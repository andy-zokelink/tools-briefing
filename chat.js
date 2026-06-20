// === 工具推荐 AI 助理 ===
// 直连 SiliconFlow API (OpenAI 兼容接口)
// UX：暗色玻璃面板 + 在线状态指示 + 离线降级 + 键盘操作
(function() {
  // ════════════ 配置 ════════════
  var API_URL  = 'https://api.siliconflow.cn/v1/chat/completions';
  var API_KEY  = 'sk-nvfaozgpfzdrmvyonmrrkrltfohwuytczuijlobdaieynzar';
  var MODEL    = 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B';
  var HEALTH_URL = 'https://api.siliconflow.cn/v1/models';
  var FETCH_TIMEOUT_MS = 45000;
  var HEALTH_TIMEOUT_MS = 5000;
  var MAX_RETRIES = 2;

  // DOM 引用
  var panel = document.getElementById('chatPanel');
  var messages = document.getElementById('chatMessages');
  var input = document.getElementById('chatInput');
  var sendBtn = document.getElementById('chatSend');
  var toggleBtn = document.getElementById('chatBtn');
  var closeBtn = document.getElementById('chatClose');
  var dot = document.getElementById('chatDot');
  var indicator = document.getElementById('chatIndicator');
  var statusText = document.getElementById('chatStatusText');

  // 状态
  var isOpen = false;
  var isTyping = false;
  var isOnline = false;
  var messageHistory = [];

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
  if (toggleBtn) toggleBtn.addEventListener('click', toggleChat);
  if (closeBtn) closeBtn.addEventListener('click', toggleChat);

  // ── 键盘操作 ──
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && panel && panel.classList.contains('open')) {
      toggleChat();
    }
  });
  if (input) {
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  if (sendBtn) sendBtn.addEventListener('click', sendMessage);

  // ── 在线状态切换 ──
  function setOnline(online) {
    isOnline = online;
    var method = online ? 'remove' : 'add';
    if (dot) dot.classList[method]('offline');
    if (indicator) indicator.classList[method]('offline');
    if (statusText) {
      statusText.textContent = online ? 'AI 在线' : '离线模式';
      statusText.style.color = online ? '#4caf50' : '#f44336';
    }
    console.log('[AI Chat] 状态:', online ? '在线 ✅' : '离线 ❌');
  }

  // ── 构建 System Prompt ──
  function buildSystemPrompt() {
    return '你是「趁手工具推荐榜」的 AI 助理，帮助用户了解 AI 开发者工具、Agent Skills 生态和研究报告。\n' +
      '知识范围：每周简报（AI 开发者工具、GitHub Trending）、28份研究报告（Agent全谱系、大模型对比、金融工具等）。\n' +
      '风格：简洁直接、中文回答、有具体建议。不知道就说不知道，不要编造。';
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
    if (!messages) return;
    var div = document.createElement('div');
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
    if (!messages) return;
    var el = document.createElement('div');
    el.className = 'ai-chat-typing';
    el.id = 'typingIndicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }
  function hideTyping() {
    isTyping = false;
    var el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  // ── 离线兜底回复 ──
  function getMockReply(msg) {
    var lower = msg.toLowerCase();
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
  function sendMessage() {
    if (isTyping) return;
    if (!input) return;
    var text = (input.value || '').trim();
    if (!text) return;

    input.value = '';
    if (sendBtn) sendBtn.disabled = true;
    addMessage('user', text);
    messageHistory.push({ role: 'user', content: text });

    // 保留对话上下文
    if (messageHistory.length > 14) {
      messageHistory = messageHistory.slice(0, 2).concat(messageHistory.slice(-12));
    }

    showTyping();

    // 离线降级
    if (!isOnline) {
      setTimeout(function() {
        hideTyping();
        addMessage('assistant', getMockReply(text));
        if (sendBtn) sendBtn.disabled = false;
        if (input) input.focus();
      }, 500 + Math.random() * 500);
      return;
    }

    // 在线 → 直连 SiliconFlow
    doApiCall(0);
  }

  function doApiCall(attempt) {
    if (attempt > 0) {
      var typingEl = document.getElementById('typingIndicator');
      if (typingEl) {
        typingEl.innerHTML = '<span style="font-size:0.72rem;color:#6a8090">重试中 (' + (attempt + 1) + '/' + (MAX_RETRIES + 1) + ')...</span>';
      }
    }

    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, FETCH_TIMEOUT_MS);

    console.log('[AI Chat] 请求 SiliconFlow (尝试 ' + (attempt + 1) + '/' + (MAX_RETRIES + 1) + ')...');

    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: messageHistory[messageHistory.length - 1].content }
        ],
        max_tokens: 1024,
        temperature: 0.7
      }),
      signal: controller.signal
    })
    .then(function(res) {
      clearTimeout(timeoutId);
      console.log('[AI Chat] 响应状态:', res.status);
      if (!res.ok) {
        return res.text().then(function(t) { throw new Error('HTTP ' + res.status + ': ' + t.slice(0, 200)); });
      }
      return res.json();
    })
    .then(function(data) {
      hideTyping();
      var reply = '';
      if (data.choices && data.choices[0] && data.choices[0].message) {
        reply = data.choices[0].message.content || '';
      }
      if (!reply) reply = '（AI 未返回内容，请重试）';
      addMessage('assistant', reply);
      messageHistory.push({ role: 'assistant', content: reply });
      if (sendBtn) sendBtn.disabled = false;
      if (input) input.focus();
      console.log('[AI Chat] ✅ 成功 (' + reply.length + ' 字符)');
    })
    .catch(function(err) {
      clearTimeout(timeoutId);
      console.error('[AI Chat] 尝试 ' + (attempt + 1) + ' 失败:', err.message);

      // 重试
      if (attempt < MAX_RETRIES && (err.name === 'AbortError' || err.message.indexOf('Failed to fetch') !== -1)) {
        setTimeout(function() { doApiCall(attempt + 1); }, (attempt + 1) * 1500);
        return;
      }

      // 重试用尽 → 切离线
      hideTyping();
      console.warn('[AI Chat] 切离线模式');
      setOnline(false);
      addMessage('assistant', getMockReply(messageHistory[messageHistory.length - 1].content));
      if (sendBtn) sendBtn.disabled = false;
      if (input) input.focus();
    });
  }

  // ── 健康检查 ──
  var healthCheckedOnce = false;
  function healthCheck() {
    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, HEALTH_TIMEOUT_MS);

    console.log('[AI Chat] 健康检查...');
    fetch(HEALTH_URL, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + API_KEY },
      signal: controller.signal
    })
    .then(function(res) {
      clearTimeout(timeoutId);
      var online = res.ok;
      console.log('[AI Chat] 健康检查结果:', online ? 'OK' : 'FAIL (HTTP ' + res.status + ')');
      setOnline(online);
      if (online && !healthCheckedOnce) {
        healthCheckedOnce = true;
        if (messages && messages.children.length === 0) {
          addMessage('assistant', '👋 你好！我是**趁手工具推荐榜**的 AI 助理。\n\n可以问我：\n- 本期推荐了哪些工具\n- MCP / Agent Skills 最新动态\n- 适合我场景的开发工具\n- 站内 28 份研究报告的要点');
        }
      }
    })
    .catch(function(err) {
      clearTimeout(timeoutId);
      console.warn('[AI Chat] 健康检查失败:', err.message);
      setOnline(false);
      if (!healthCheckedOnce) healthCheckedOnce = true;
    });
  }

  // ── 初始化 ──
  console.log('[AI Chat] 初始化...');
  healthCheck();
  setInterval(healthCheck, 30000);

  // 暴露到全局
  window.toggleChat = toggleChat;
  window.sendMessage = sendMessage;
})();
