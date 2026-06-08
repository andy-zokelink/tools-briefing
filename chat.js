// === 工具推荐 AI 助理 ===
// API 代理地址 — Cloudflare Worker 转发到 DeepSeek
const API_URL = 'https://tools-briefing-ai.andy-132.workers.dev';

// 简报知识库（系统提示词）
const SYSTEM_PROMPT = `你是「趁手工具推荐榜」的 AI 助理，帮助用户了解 AI 开发者工具和 Agent Skills 生态。

你的知识范围：
- sandboxd (tastyeffectco/sandboxd): AI agent 即时沙箱环境，npx sandboxd 一行命令启动隔离环境，带预览 URL
- Lexa (anvia-hq/lexa): Rust 代码智能引擎，把代码库转成可查询图结构
- goose (b-nnett/goose): Swift AI agent PoC
- JoyAI-Echo (jd-opensource): 京东长音频+视频生成模型
- TripoSplat (VAST-AI-Research): 单张 2D 图→3D 高斯泼溅
- Burrow (caezium/Burrow): Mole CLI 的 macOS GUI
- opendocswork-mcp (Aimino-Tech): Rust MCP server, Office文档处理
- totem (briangaoo/totem): Whoop健身手环 MCP server

趋势洞察：
1. Agent 基础设施从推理转向执行环境 — MCP解决工具调用，现在瓶颈是安全隔离执行
2. MCP server 从"能用"转向"好用" — Rust原生、硬件接入、GUI工具链

你的风格：简洁直接、中文回答、有具体建议。如果用户问的问题超出你的知识范围，诚实说明并建议查阅最新简报。
每期简报发布在 https://andy-zokelink.github.io/tools-briefing/`;

// UI State
let isOpen = false;
let isTyping = false;
let messageHistory = [{ role: 'system', content: SYSTEM_PROMPT }];

function toggleChat() {
  isOpen = !isOpen;
  document.getElementById('chatPanel').classList.toggle('open', isOpen);
  if (isOpen) {
    document.getElementById('chatInput').focus();
  }
}

function addMessage(role, text) {
  const container = document.getElementById('chatMessages');
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
  const text = input.value.trim();
  
  if (!text) return;
  
  // Clear input
  input.value = '';
  input.disabled = true;
  btn.disabled = true;
  
  // Add user message
  addMessage('user', text);
  messageHistory.push({ role: 'user', content: text });
  
  // Show typing
  showTyping();
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messageHistory,
        // Keep only last 10 messages to avoid token bloat
      })
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
