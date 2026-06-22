# 🚀 tools-briefing 全面重构 · 创意 Brief

## 一句话愿景
做一个**有品位的 AI 工具与开源项目资讯站**——不堆砌新闻、不平庸、有艺术感，让人打开就觉得"这网站有点东西"。

---

## 一、现有资产盘点

### 内容资源
- **6 期简报**：`2026-06-08` ~ `2026-06-19`，覆盖 AI 开发者工具、GitHub Trending、MCP/Skills 生态
- **27 份研究报告**：Agent 全谱系横评、大模型对比、金融量化工具、云厂商 CLI、边缘硬件等 7 大分类
- **1 个对比页**：`ai-assistant-comparison.html`（LLM vs 本地搜索）
- **1 个 404 页**：已有浮动光球 + 终端命令行风格

### 技术能力
- **图片生成**：kkidc Gemini 模型（`gemini-2.5-flash` 文字 + `gemini-3.1-flash-image-preview` 生图）
  - API: `https://ai-api.kkidc.com/v1beta/models/{model}:generateContent`
  - Key: `sk-RtR...qpYC`
- **AI 对话**：`chat.js` 直连 SiliconFlow `DeepSeek-R1-0528-Qwen3-8B`
  - API: `https://api.siliconflow.cn/v1/chat/completions`
  - Key: `sk-nvf...nzar`
- **深度思考**：Claude Code 2.1.165 + DeepSeek V4 Pro 1M 上下文 + xhigh 思考强度
- **现有图片**：`banner.jpg`、`og-image.jpg`、`favicon.png`（之前 Gemini 生成，可替换）

### 代码现状
- 纯静态 HTML/CSS/JS，GitHub Pages 部署
- `styles.css`：~1780 行，Fluid Material Design 主题
- `chat.js`：284 行，暗色玻璃面板 + 状态指示 + 离线降级
- 所有页面共用 `chat.js` + `styles.css`

---

## 二、设计方向（核心）

### 拒绝平庸
- ❌ 不要 "卡片列表 + 标题 + 摘要" 的新闻聚合站
- ❌ 不要纯白/纯灰背景的极简主义
- ❌ 不要模仿 Hexo Fluid 或其他现有主题
- ❌ 不要做个"看起来还行"的普通网站

### 追求的气质
- **AI-Native 美学**：不是"放个机器人 emoji"那种 AI 感，而是**神经网络、数据流动、潜伏空间、涌现**这些概念在视觉上的体现
- **有品味**：字体选择、留白、色彩克制、暗色为主但有亮度层次
- **艺术感**：让浏览体验像翻阅一本精心排版的杂志/画册
- **独特性**：让人记住——"那个做 AI 工具推荐的站，设计很特别"

### 参考但不复制
- 可以看但不复制：Linear、Vercel、Stripe、Apple 设计语言
- 核心问题：**如果 AI 自己设计一个展示 AI 工具的网站，它会怎么做？**

---

## 三、功能要求

### 必须保留
- ✅ AI 小助手（右下角对话框，当前功能完整）
- ✅ 6 期简报内容（内容不变，呈现方式可以翻天覆地）
- ✅ 27 份研究报告入口（不修改报告 HTML，但目录页可以重新设计）

### 可以自由发挥
- 首页布局（不必是列表，可以是时间线/星系图/数据可视化/任何形式）
- 简报详情页的视觉呈现
- 色彩体系、字体系统
- 配图（用 kkidc Gemini 生成——给文章配图、Hero 大图、装饰元素）
- 动效（粒子、渐变、视差、滚动叙事——大胆用）
- 新增页面（比如"关于"页、工具索引页、标签云——你来决定）
- 交互方式（不一定是传统导航——可以是探索式的）

### 技术约束
- 纯静态 HTML/CSS/JS，GitHub Pages 部署
- 生成图片放 `/images/` 目录
- 不动 `reports/*.html` 研究报告（它们独立存在）
- API Key 已在代码中，直接用

---

## 四、执行方式

### 给你最大权限
- **2000 turns**，有充足的试错和迭代空间
- **你自己做决策**：视觉风格、布局、配色、动效——不需要问我
- **自己生成配图**：用 Gemini 生图，根据每篇文章主题创作配图
- **自己找参考**：可以 web_search 看设计灵感，但不复制

### 工作流建议
1. 先确立视觉语言（配色、字体、核心视觉 motif）——做个 moodboard/风格指南
2. 设计首页——这是门面，花足够时间打磨
3. 逐个改造简报页——每期有独特的视觉呈现
4. 重新设计报告目录页
5. 打磨动效和细节
6. 404 和特殊页面

### 输出要求
- 每个阶段完成后 `git add/commit/push`
- 最终给我一个**完整复核清单**（改了什么、为什么这样改、设计决策）

---

## 五、开始

项目路径：`/Users/andy/tools-briefing/`
线上地址：`https://andy-zokelink.github.io/tools-briefing/`

**放手去做。不做平庸的东西。**
