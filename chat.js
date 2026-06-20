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
  var HEALTH_TIMEOUT_MS = 8000;
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
    if (role === 'assistant' || role === 'error') {
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

  // ── 构建 API 请求体 ──
  function buildApiBody() {
    // 发送完整对话历史（系统提示 + 所有用户和助手消息）
    var apiMessages = [{ role: 'system', content: buildSystemPrompt() }];

    // 只保留最近的消息（不含系统提示，限制总数）
    var history = messageHistory.slice();
    // 保留最近 20 条（10 轮对话），避免 token 超限
    if (history.length > 20) {
      history = history.slice(-20);
    }

    for (var i = 0; i < history.length; i++) {
      apiMessages.push(history[i]);
    }

    console.log('[AI Chat] 发送消息数:', apiMessages.length, '(含系统提示)');

    return JSON.stringify({
      model: MODEL,
      messages: apiMessages,
      max_tokens: 1024,
      temperature: 0.7
    });
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

    console.log('[AI Chat] 请求 API (尝试 ' + (attempt + 1) + '/' + (MAX_RETRIES + 1) + ')...');

    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY
      },
      body: buildApiBody(),
      signal: controller.signal
    })
    .then(function(res) {
      clearTimeout(timeoutId);
      console.log('[AI Chat] 响应 HTTP', res.status);
      if (!res.ok) {
        // 读取错误详情
        return res.text().then(function(body) {
          var err = new Error('HTTP ' + res.status);
          err.httpStatus = res.status;
          err.httpBody = body.slice(0, 500);
          throw err;
        });
      }
      return res.json();
    })
    .then(function(data) {
      hideTyping();
      var reply = '';
      if (data.choices && data.choices[0] && data.choices[0].message) {
        reply = data.choices[0].message.content || '';
      }
      if (!reply) {
        reply = '（AI 返回了空内容，请重试或换个问法）';
        console.warn('[AI Chat] 空回复:', JSON.stringify(data).slice(0, 300));
      }
      addMessage('assistant', reply);
      messageHistory.push({ role: 'assistant', content: reply });
      if (sendBtn) sendBtn.disabled = false;
      if (input) input.focus();
      console.log('[AI Chat] ✅ 成功 (' + reply.length + ' 字符)');
    })
    .catch(function(err) {
      clearTimeout(timeoutId);
      console.error('[AI Chat] 尝试 ' + (attempt + 1) + ' 失败:', err.message, err.httpStatus || '');

      // 判断是否可重试
      var canRetry = attempt < MAX_RETRIES;
      var shouldRetry = false;

      if (err.name === 'AbortError') {
        // 超时 → 重试
        shouldRetry = true;
      } else if (err.message.indexOf('Failed to fetch') !== -1 || err.message.indexOf('NetworkError') !== -1) {
        // 网络错误 → 重试
        shouldRetry = true;
      } else if (err.httpStatus && (err.httpStatus >= 500 || err.httpStatus === 429)) {
        // 服务端错误或限流 → 重试
        shouldRetry = true;
      } else if (err.httpStatus && err.httpStatus >= 400) {
        // 客户端错误 (400, 401, 403) → 不重试
        shouldRetry = false;
      } else {
        // 未知错误 → 重试一次
        shouldRetry = true;
      }

      if (canRetry && shouldRetry) {
        var delay = (attempt + 1) * 2000;
        console.log('[AI Chat] ' + delay + 'ms 后重试...');
        setTimeout(function() { doApiCall(attempt + 1); }, delay);
        return;
      }

      // 重试用尽 / 不可重试 → 展示错误
      hideTyping();
      var errorMsg = '抱歉，AI 服务暂时不可用。';
      if (err.httpStatus === 401 || err.httpStatus === 403) {
        errorMsg = '⚠️ API 密钥无效，请联系管理员更新。';
      } else if (err.httpStatus === 429) {
        errorMsg = '⏳ 请求过于频繁，请稍后再试。';
      } else if (err.httpStatus && err.httpStatus >= 500) {
        errorMsg = '🔧 AI 服务端故障（HTTP ' + err.httpStatus + '），请稍后重试。';
      } else if (err.name === 'AbortError') {
        errorMsg = '⏱️ 请求超时，AI 服务响应较慢。请稍后重试或缩短问题。';
      } else {
        errorMsg = '❌ 连接失败: ' + (err.message || '未知错误').slice(0, 80);
      }

      console.warn('[AI Chat] 最终失败:', errorMsg);
      addMessage('error', errorMsg);

      // 如果之前在线，切到离线模式避免连续失败
      if (err.httpStatus && err.httpStatus >= 500) {
        setOnline(false);
      }

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
      console.log('[AI Chat] 健康检查: HTTP', res.status, online ? '✅' : '❌');
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
      if (!healthCheckedOnce) {
        healthCheckedOnce = true;
        console.log('[AI Chat] 首次检查失败，进入离线模式（30s 后重试）');
      }
    });
  }

  // ── 初始化 ──
  console.log('[AI Chat] 初始化 v2.0 (直连 SiliconFlow + 对话历史) ...');
  // 延迟 500ms 确保页面完全加载后检查
  setTimeout(function() { healthCheck(); }, 500);
  setInterval(healthCheck, 30000);

  // 暴露到全局
  window.toggleChat = toggleChat;
  window.sendMessage = sendMessage;
})();
