// === 工具推荐 AI 助理 ===
// API 代理地址 — Cloudflare Worker 转发到 SiliconFlow (DeepSeek-R1-Qwen3-8B)
const API_URL = 'https://tools-briefing-ai.andy-132.workers.dev';

// UI State
let isOpen = false;
let isTyping = false;
let messageHistory = [];  // Worker 端统一管理系统提示词，前端只传对话历史

function toggleChat() {
  isOpen = !isOpen;
  const panel = document.getElementById('chatPanel');
  if (!panel) {
    console.warn('chatPanel element not found');
    return;
  }
  panel.classList.toggle('open', isOpen);
  if (isOpen) {
    const input = document.getElementById('chatInput');
    if (input) input.focus();
  }
}

function addMessage(role, text) {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = `ai-chat-msg ${role}`;

  const label = role === 'assistant' ? 'AI 助理' : '你';
  div.innerHTML = `<div class="label">${label}</div>${escapeHtml(text)}`;

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function showTyping() {
  isTyping = true;
  const container = document.getElementById('chatMessages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'ai-chat-msg assistant';
  div.id = 'typingIndicator';
  div.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function hideTyping() {
  isTyping = false;
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

async function sendMessage() {
  if (isTyping) return;

  const input = document.getElementById('chatInput');
  const btn = document.getElementById('sendBtn');

  if (!input || !btn) {
    console.warn('Chat input or send button not found');
    return;
  }

  const text = input.value.trim();
  if (!text) return;

  // Clear input
  input.value = '';
  input.disabled = true;
  btn.disabled = true;

  // Add user message
  addMessage('user', text);
  messageHistory.push({ role: 'user', content: text });

  // Trim history — keep only last 10 exchanges (20 messages) to avoid bloated requests
  if (messageHistory.length > 20) {
    messageHistory = messageHistory.slice(-20);
  }

  // Show typing
  showTyping();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messageHistory })
    });

    if (!response.ok) {
      throw new Error(`API ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const reply = data.reply || '抱歉，我暂时无法回答这个问题。';

    hideTyping();
    addMessage('assistant', reply);
    messageHistory.push({ role: 'assistant', content: reply });

  } catch (err) {
    hideTyping();
    addMessage('assistant', '抱歉，AI 服务暂时不可用。请稍后重试或查阅最新简报页面。');
    console.error('Chat error:', err);
  }

  input.disabled = false;
  btn.disabled = false;
  input.focus();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
}
