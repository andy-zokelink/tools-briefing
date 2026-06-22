// Transform briefing pages to new design system
// Reads old HTML, extracts article content, wraps in new shell
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pages = [
  { file: '2026-06-19.html', num: 29, date: '2026年6月19日', title: 'Token 压缩工业化 · MCP 成为基础设施', desc: 'headroom（38K⭐）和 context-mode（17K⭐）代表上下文优化从 nice-to-have 变成 agent 工程必选项。MCP 获 Google/Microsoft/Unreal 三方官方背书，从社区协议升级为基础设施标准。NVIDIA SkillSpector 代表 agent 安全成为独立赛道。' },
  { file: '2026-06-17.html', num: 28, date: '2026年6月17日', title: 'Skills 操作系统化 · Agent 基础设施工业化', desc: 'compass-skills（司南）将 Agent Skills 从单任务能力升级为个人工作流 OS，Skills 正从 function 走向 platform。agent-harness-generator 让创建 agent harness 像脚手架一样简单，Agent 基础设施进入标准化时代。NVIDIA SkillSpector 以硬件巨头身份进场 Skills 安全。' },
  { file: '2026-06-15.html', num: 27, date: '2026年6月15日', title: 'Agent Skills 病毒传播 · 可靠性护栏时代', desc: 'ponytail 3天15K星——Agent Skills 首次病毒式传播。Forge（HN #1）用 RL 护栏让 8B 模型 agentic 准确率 53%→99%。Anthropic-Cybersecurity-Skills 发布 754 结构化安全技能。' },
  { file: '2026-06-12.html', num: 26, date: '2026年6月12日', title: 'Apple Xcode Skills · MCP 安全军备竞赛', desc: 'Apple 从 Xcode 27 导出官方 Agent Skills——平台级 Skills 有了第二个锚点。MCP 安全一周内涌入腾讯、NVIDIA、Snyk 三大厂商，agent-gate + Spanly 填补运行时防护和可观测空白。' },
  { file: '2026-06-10.html', num: 25, date: '2026年6月10日', title: 'MCTS · Agent Manager · MCP 安全元年', desc: 'MCTS 首个 MCP 安全扫描器填补生态空白。Agent Manager 桌面端 GUI 管理 Agent 和 MCP。MCP 安全从真空到元年，agent 工具从 CLI 走向桌面。' },
  { file: '2026-06-08.html', num: 24, date: '2026年6月8日', title: 'headroom · harness · Agent Skills 元技能时代', desc: 'headroom 省 60-95% token 登顶 #1 Trending。harness 让 agent 为自己生成技能。GitHub 正被 AI Agent 压垮——Claude Code 单工具占全平台公开提交 4.5%。MCP 破万，Skills 进入工业化。' },
];

function extractArticleBody(html) {
  // Extract everything from <main class="main"> to </main>
  const mainMatch = html.match(/<main class="main">([\s\S]*?)<\/main>/);
  if (!mainMatch) {
    console.error('Could not find <main> in HTML');
    return html;
  }
  let content = mainMatch[1];

  // Remove the old navbar toggler onclick since we use app.js
  // Remove the old inline script blocks
  content = content.replace(/onclick="[^"]*"/g, '');
  // Remove old inline styles (they're in new CSS)
  content = content.replace(/\s*style="[^"]*"/g, '');

  return content;
}

function buildNewPage(info, articleBody) {
  const nextNum = info.num + 1;
  const prevNum = info.num - 1;
  const hasNext = info.num < 29;
  const hasPrev = info.num > 24;

  // Date-to-filename lookup
  const numToDate = { 24: '08', 25: '10', 26: '12', 27: '15', 28: '17', 29: '19' };

  // Build post navigation
  let postNav = '';
  if (hasPrev || hasNext) {
    postNav = '\n      <nav class="post-nav">';
    if (hasPrev) {
      const prevDate = numToDate[prevNum];
      const prevFile = prevDate ? `2026-06-${prevDate}.html` : '#';
      postNav += `\n        <a href="${prevFile}" class="prev">\n          <span class="nav-label">← 上一期</span>\n          <span class="nav-title">第${prevNum}期</span>\n        </a>`;
    } else {
      postNav += '\n        <span></span>';
    }
    if (hasNext) {
      const nextDate = numToDate[nextNum];
      const nextFile = nextDate ? `2026-06-${nextDate}.html` : '#';
      postNav += `\n        <a href="${nextFile}" class="next">\n          <span class="nav-label">下一期 →</span>\n          <span class="nav-title">第${nextNum}期</span>\n        </a>`;
    } else {
      postNav += '\n        <span></span>';
    }
    postNav += '\n      </nav>';
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, shrink-to-fit=no">
<meta name="theme-color" content="#05070a">
<meta name="description" content="${info.desc}">
<meta property="og:title" content="第${info.num}期 · ${info.title} — 趁手工具推荐榜">
<meta property="og:description" content="${info.desc}">
<meta property="og:type" content="article">
<title>第${info.num}期 · ${info.title} — 趁手工具推荐榜</title>
<link rel="icon" href="favicon.png">
<link rel="apple-touch-icon" href="favicon.png">
<link rel="stylesheet" href="styles.css">
</head>
<body>

<!-- Particle Field Canvas -->
<canvas id="particleCanvas"></canvas>

<!-- Loading Bar -->
<div class="loading-bar" id="loadingBar"></div>

<!-- ════════════ NAVBAR ════════════ -->
<nav class="navbar scrolled" id="navbar">
  <div class="navbar-container">
    <a class="navbar-brand" href="index.html">
      <span class="brand-dot"></span>趁手工具推荐榜
    </a>
    <button class="navbar-toggler" id="navbarToggler" aria-label="菜单">
      <span></span><span></span><span></span>
    </button>
    <div class="navbar-menu" id="navbarMenu">
      <a href="index.html">首页</a>
      <a href="reports/">研究报告</a>
      <a href="https://github.com/andy-zokelink/tools-briefing" target="_blank" rel="noopener" class="external">GitHub</a>
    </div>
  </div>
</nav>

<main class="main">
${articleBody.trim()}${postNav}
</main>

<!-- ════════════ FOOTER ════════════ -->
<footer class="site-footer">
  <div>由 <a href="https://hermes-agent.nousresearch.com">Hermes Agent</a> 驱动 · 内容基于公开数据源</div>
  <div style="margin-top:0.3rem;display:flex;justify-content:center;gap:0.6rem;font-size:0.76rem;">
    <span>第${info.num}期简报</span><span>·</span>
    <span>${info.date}</span>
  </div>
  <div style="margin-top:0.5rem;font-size:0.7rem;opacity:0.3;">Latent Topology Design · 每周一三五更新 · © 2026</div>
</footer>

<!-- Scroll to Top -->
<button class="scroll-top-btn" id="scrollTopBtn" title="回到顶部">↑</button>

<!-- ════════════ AI CHAT WIDGET ════════════ -->
<div class="ai-chat-widget" id="aiChatWidget">
  <button class="ai-chat-btn" id="chatBtn" title="AI 助手">
    <span style="line-height:1;">💬</span>
    <span class="ai-chat-indicator" id="chatIndicator"></span>
  </button>
  <div class="ai-chat-panel" id="chatPanel">
    <div class="ai-chat-header">
      <span class="ai-chat-status">
        <span class="ai-chat-dot" id="chatDot"></span>
        <span id="chatStatusText">检测中…</span>
      </span>
      <button class="ai-chat-close" id="chatClose">✕</button>
    </div>
    <div class="ai-chat-messages" id="chatMessages"></div>
    <div class="ai-chat-input-area">
      <input type="text" class="ai-chat-input" id="chatInput" placeholder="问一个问题…" autocomplete="off">
      <button class="ai-chat-send" id="chatSend">发送</button>
    </div>
  </div>
</div>

<script src="app.js"></script>
<script src="chat.js"></script>
</body>
</html>`;
}

// Process each page
for (const info of pages) {
  const filePath = path.join(__dirname, info.file);
  console.log(`Processing ${info.file}...`);

  let html;
  try {
    html = fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    console.error(`  ERROR reading ${info.file}: ${e.message}`);
    continue;
  }

  const articleBody = extractArticleBody(html);
  const newHtml = buildNewPage(info, articleBody);

  fs.writeFileSync(filePath, newHtml, 'utf-8');
  console.log(`  ✓ Written ${info.file} (${(newHtml.length / 1024).toFixed(1)} KB)`);
}

console.log('\nDone! All briefing pages transformed.');
