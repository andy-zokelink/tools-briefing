// === 工具推荐 AI 助理 ===
// 架构：前端 → Cloudflare Worker（代理）→ SiliconFlow API
// UX 设计参考阿森版：暗色玻璃面板 + 在线状态指示 + 离线降级 + 键盘操作
(function() {
  // ════════════ 配置 ════════════
  const API_URL = 'https://tools-briefing-ai.andy-132.workers.dev';
  const HEALTH_URL = API_URL;  // 健康检查复用 Worker（OPTIONS 可达）
  const FETCH_TIMEOUT_MS = 45000;
  const HEALTH_TIMEOUT_MS = 5000;
  const MAX_RETRIES = 2;

  // DOM 引用
  const panel = document.getElementById('chatPanel');
  const messages = document.getElementById('chatMessages');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const toggleBtn = document.getElementById('chatBtn');
  const closeBtn = document.getElementById('chatClose');
  const dot = document.getElementById('chatDot');
  const indicator = document.getElementById('chatIndicator');
  const statusText = document.getElementById('chatStatusText');

  // 状态
  let isOpen = false;
  let isTyping = false;
  let isOnline = false;  // 健康检查确认后才为 true
  let messageHistory = [];

  // ── 开关面板 ──
  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      panel.classList.add('open');
      setTimeout(function() { input.focus(); }, 150);
    } else {
      panel.classList.remove('open');
    }
  }
  toggleBtn.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  // ── 键盘操作 ──
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      toggleChat();
    }
  });
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  sendBtn.addEventListener('click', sendMessage);

  // ── 在线状态切换 ──
  function setOnline(online) {
    isOnline = online;
    const method = online ? 'remove' : 'add';
    if (dot) dot.classList[method]('offline');
    if (indicator) indicator.classList[method]('offline');
    if (statusText) {
      statusText.textContent = online ? 'AI 在线' : '离线模式';
      statusText.style.color = online ? '#4caf50' : '#f44336';
    }
  }

  // ── 简易 Markdown → HTML ──
  function renderMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\s*[-•]\s+(.+)/g, '\n<li>$1</li>')
      .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
      .replace(/\n/g, '<br>');
  }

  // ── 添加消息气泡 ──
  function addMessage(role, content) {
    const div = document.createElement('div');
    div.className = 'ai-chat-msg ' + role;
    if (role === 'assistant') {
      div.innerHTML = renderMarkdown(content);
    } else {
      div.textContent = content;
    }
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  // ── 输入中动画 ──
  function showTyping() {
    isTyping = true;
    const el = document.createElement('div');
    el.className = 'ai-chat-typing';
    el.id = 'typingIndicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }
  function hideTyping() {
    isTyping = false;
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  // ── 离线兜底回复 ──
  function getMockReply(msg) {
    const lower = msg.toLowerCase();
    if (lower.indexOf('你好') !== -1 || lower.indexOf('hello') !== -1) {
      return '你好！我是工具推荐 AI 助手，当前处于**离线模式**。\n\n网络恢复后可以问我：\n- 本期推荐了哪些工具\n- MCP 生态最新动态\n- 适合我场景的开发工具';
    }
    if (lower.indexOf('推荐') !== -1 || lower.indexOf('工具') !== -1) {
      return '我在离线模式，无法获取最新推荐。请浏览页面上方的最新简报卡片，或等待网络恢复。';
    }
    if (lower.indexOf('报告') !== -1 || lower.indexOf('研究') !== -1) {
      return '研究报告共 28 份，覆盖 Agent 全谱系、大模型对比、金融工具等。请点击页面上方「📋 研究报告」浏览。';
    }
    return '我正在**离线模式**，无法连接 AI 服务。你可以浏览页面上的简报卡片和研究报告，或刷新页面重试。';
  }

  // ── 发送消息（核心）──
  async function sendMessage() {
    if (isTyping) return;
    const text = (input.value || '').trim();
    if (!text) return;

    input.value = '';
    sendBtn.disabled = true;
    addMessage('user', text);
    messageHistory.push({ role: 'user', content: text });

    // 保留对话上下文（前 2 条 + 后 12 条）
    if (messageHistory.length > 14) {
      messageHistory = messageHistory.slice(0, 2).concat(messageHistory.slice(-12));
    }

    showTyping();

    // 离线降级
    if (!isOnline) {
      setTimeout(function() {
        hideTyping();
        addMessage('assistant', getMockReply(text));
        sendBtn.disabled = false;
        input.focus();
      }, 700 + Math.random() * 500);
      return;
    }

    // 在线 → 带重试的 Worker 调用
    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        // 更新输入中提示
        const typingEl = document.getElementById('typingIndicator');
        if (typingEl) {
          typingEl.innerHTML = '<span style="font-size:0.72rem;color:#6a8090">重试中 (' + (attempt + 1) + '/' + (MAX_RETRIES + 1) + ')...</span>';
        }
        await new Promise(function(r) { setTimeout(r, attempt * 1500); });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(function() { controller.abort(); }, FETCH_TIMEOUT_MS);

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: messageHistory }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errMsg = 'HTTP ' + response.status;
          throw new Error(errMsg);
        }

        const data = await response.json();
        const reply = data.reply || '（AI 未返回内容，请重试）';

        hideTyping();
        addMessage('assistant', reply);
        messageHistory.push({ role: 'assistant', content: reply });

        sendBtn.disabled = false;
        input.focus();
        return;  // 成功

      } catch (err) {
        clearTimeout(timeoutId);
        lastError = err;
        console.warn('[AI Chat] 尝试 ' + (attempt + 1) + '/' + (MAX_RETRIES + 1) + ' 失败:', err.message);

        if (err.name === 'AbortError' || err.message === 'Failed to fetch') {
          continue;  // 重试
        }
        break;  // 其他错误不重试
      }
    }

    // 重试用尽 → 切离线
    hideTyping();
    console.warn('[AI Chat] Worker 不可达，切换离线模式:', lastError ? lastError.message : '');
    setOnline(false);
    addMessage('assistant', getMockReply(text));
    sendBtn.disabled = false;
    input.focus();
  }

  // ── 健康检查 ──
  let healthCheckedOnce = false;
  function healthCheck() {
    const controller = new AbortController();
    const timeoutId = setTimeout(function() { controller.abort(); }, HEALTH_TIMEOUT_MS);

    // 用 OPTIONS 请求测 Worker 可达性（轻量，不消耗 token）
    fetch(HEALTH_URL, {
      method: 'OPTIONS',
      signal: controller.signal
    })
    .then(function(res) {
      clearTimeout(timeoutId);
      const online = res.ok || res.status === 204;
      setOnline(online);
      // 首次连通后显示欢迎消息
      if (online && !healthCheckedOnce) {
        healthCheckedOnce = true;
        if (messages.children.length === 0) {
          addMessage('assistant', '👋 你好！我是**趁手工具推荐榜**的 AI 助理。\n\n可以问我：\n- 本期推荐了哪些工具\n- MCP / Agent Skills 最新动态\n- 适合我场景的开发工具\n- 站内 28 份研究报告的要点');
        }
      }
    })
    .catch(function(err) {
      clearTimeout(timeoutId);
      setOnline(false);
      // 首次检查失败也标记，避免反复显示离线欢迎
      if (!healthCheckedOnce) healthCheckedOnce = true;
    });
  }

  // ── 初始化 ──
  healthCheck();
  // 每 30 秒重新检查一次
  setInterval(healthCheck, 30000);

  // 暴露 toggleChat 到全局（供 HTML onclick 使用）
  window.toggleChat = toggleChat;
  window.sendMessage = sendMessage;
})();
