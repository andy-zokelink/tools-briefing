// === 工具推荐 AI 助理 ===
// API 代理地址 — Cloudflare Worker 转发到 SiliconFlow (DeepSeek-R1-Qwen3-8B)
const API_URL = 'https://tools-briefing-ai.andy-132.workers.dev';
const FETCH_TIMEOUT_MS = 45000;  // 45s — worker 响应通常 15-20s，留足余量
const MAX_RETRIES = 2;

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
  div.className = 'ai-chat-msg ' + role;

  const label = role === 'assistant' ? 'AI 助理' : '你';
  div.innerHTML = '<div class="label">' + label + '</div>' + escapeHtml(text);

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

  // Trim history — keep only last 6 exchanges (12 messages + keep first 2 for context)
  if (messageHistory.length > 14) {
    messageHistory = messageHistory.slice(0, 2).concat(messageHistory.slice(-12));
  }

  // Show typing
  showTyping();

  // Try with retries
  var lastError = null;
  for (var attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Update typing indicator to show retry
      var typingEl = document.getElementById('typingIndicator');
      if (typingEl) {
        typingEl.innerHTML = '<span style="font-size:0.78rem;color:var(--text-tertiary)">重试中 (' + (attempt + 1) + '/' + (MAX_RETRIES + 1) + ')...</span>';
      }
      // Wait before retry (exponential backoff)
      await new Promise(function(r) { setTimeout(r, attempt * 1500); });
    }

    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, FETCH_TIMEOUT_MS);

    try {
      console.log('[AI Chat] Sending request (attempt ' + (attempt + 1) + '/' + (MAX_RETRIES + 1) + ')...');
      var response = await fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messageHistory }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('[AI Chat] Response status:', response.status);

      if (!response.ok) {
        var errMsg = 'AI 服务返回错误 (' + response.status + ')';
        try {
          var errData = await response.json();
          if (errData && errData.error) { errMsg = errData.error; }
        } catch(e) { /* ignore parse errors */ }
        throw new Error(errMsg);
      }

      var data = await response.json();
      var reply = data.reply || '抱歉，我暂时无法回答这个问题。';

      hideTyping();
      addMessage('assistant', reply);
      messageHistory.push({ role: 'assistant', content: reply });

      input.disabled = false;
      btn.disabled = false;
      input.focus();
      return; // Success — exit retry loop

    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      console.error('[AI Chat] Attempt ' + (attempt + 1) + ' error:', err.name, err.message);

      // Don't retry on abort/timeout — just go to next attempt
      if (err.name === 'AbortError') {
        console.warn('[AI Chat] Request timeout after ' + (FETCH_TIMEOUT_MS/1000) + 's');
        continue; // Retry
      }

      // Network errors — retry
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        console.warn('[AI Chat] Network error, will retry');
        continue; // Retry
      }

      // Other errors — don't retry
      break;
    }
  }

  // All retries exhausted — show error
  hideTyping();
  var errText;
  if (lastError && lastError.name === 'AbortError') {
    errText = '⏱ 请求超时（' + (FETCH_TIMEOUT_MS/1000) + '秒）。AI 服务响应较慢，请稍后重试。';
  } else if (lastError && lastError.message === 'Failed to fetch') {
    errText = '⚠️ 无法连接到 AI 服务。\n\n可能原因：\n1. 浏览器隐私/追踪保护拦截了请求\n2. 网络连接问题\n3. 服务暂时不可用\n\n请尝试：\n- 关闭浏览器的严格追踪保护\n- 刷新页面后重试\n- 查阅最新简报页面获取信息';
  } else {
    errText = '抱歉，AI 服务暂时不可用。\n\n' + (lastError ? lastError.message : '未知错误') + '\n\n请稍后重试或查阅最新简报页面。';
  }
  addMessage('assistant', errText);

  input.disabled = false;
  btn.disabled = false;
  input.focus();
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
}
