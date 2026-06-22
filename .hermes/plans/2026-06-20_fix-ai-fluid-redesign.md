# 任务：修复AI助手 + Fluid主题风格重设计

## 目标
1. 修复 AI 小助手不可用的问题
2. 将 https://andy-zokelink.github.io/tools-briefing/ 全站风格从 Notion 白底改为 Hexo Fluid 主题风格

## 当前状态
- 站点：`/Users/andy/tools-briefing/`
- Worker 正常工作（SiliconFlow R1-Qwen3-8B），curl 调用返回正常
- 前端 AI 助手不工作，需排查
- 当前风格：Notion 白底 + 暖色点缀（--warm: #b97509）

## Fluid 主题风格特征
参考 https://hexo.fluid-dev.com/
- 主色：`#2f4154`（深蓝灰）
- 强调色：`#29d`（蓝色）
- Material Design 风格，Bootstrap 4 布局
- 暗色/亮色自动切换
- 固定顶部导航栏（navbar-dark）
- 卡片带阴影（box-shadow: 0 12px 15px rgba(0,0,0,0.24)）
- Banner 视差效果
- 进度条指示器
- 代码复制按钮、图片缩放、TOC 目录

## 第一步：修复 AI 助手

### 排查方向
1. **检查所有 8 个页面**（index.html + 6 期简报 + reports/index.html）的 chat widget HTML 结构
   - 确认 `chatPanel`、`chatMessages`、`chatInput`、`sendBtn` id 都存在
   - 确认 `chat.js` 引用路径正确（根页面是 `chat.js`，reports/ 是 `../chat.js`）
   - 确认 `styles.css` 包含 `.ai-chat-widget` 相关样式
2. **检查 CSS 冲突**
   - styles.css 中 `.ai-chat-widget` 的 `position: fixed; z-index: 999` 可能被覆盖
   - reports/index.html 的 inline styles 可能与 styles.css 冲突
   - sidebar 的 `position: sticky; z-index: 100` 可能创建新的 stacking context
3. **修复要点**
   - 如果按钮不显示：检查 z-index / position / display 属性
   - 如果点击无效：检查 toggleChat() 函数能否找到 chatPanel 元素
   - 如果消息发不出：检查 sendMessage() 中的 fetch URL 是否正确
4. **测试验证**
   - 用 Python requests 模拟浏览器请求 Worker，确认 API 通路正常
   - 检查所有 8 个页面 HTML 中 chat widget 代码完整

## 第二步：Fluid 主题风格重设计

### 2.1 全局样式变量更新（styles.css）
```css
:root {
  /* Fluid 风格 */
  --primary: #2f4154;
  --primary-dark: #1a2a3a;
  --accent: #29d;
  --accent-light: rgba(0,153,221,0.1);
  
  /* 亮色模式 */
  --bg: #f5f7fa;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --text: #2c3e50;
  --text-secondary: #5a6a7a;
  --text-tertiary: #8a9aaa;
  --border: #e8ecf1;
  --border-light: #f0f2f5;
  
  /* 阴影 */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
  --shadow-lg: 0 12px 24px rgba(0,0,0,0.15);
  --shadow-xl: 0 20px 40px rgba(0,0,0,0.2);
  
  /* 圆角 */
  --radius-sm: 4px;
  --radius: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  
  /* 字体 */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### 2.2 页面结构改造（fluid 风格）

#### 导航栏（替换 sidebar）
- 固定顶部导航栏 `.navbar`（`position: fixed; top: 0; z-index: 1030`）
- 深蓝灰底色 `#2f4154`，白色文字
- 导航项：首页 / 简报 / 研究报告 / GitHub
- 移动端汉堡菜单
- 滚动时添加阴影 + 半透明背景

#### 首页布局
- **Banner 区**：全宽渐变背景（`#2f4154` → `#1a2a3a`），标题 + 副标题 + 统计数据
- **内容区**：`.container` 居中，白色卡片（`.card` 类，带阴影）
- 简报卡片：Material Design 卡片样式，hover 上浮 4px + 加深阴影
- 页脚：深色背景，简洁信息

#### 简报详情页
- 居中卡片布局（max-width: 800px）
- 面包屑导航
- 文章 meta 信息行
- 代码块：深色背景 + 复制按钮
- 相关文章推荐

#### 研究报告目录
- 分类卡片（grid 布局）
- 报告项：列表项带 hover 效果
- 搜索框：Material Design 输入框（outlined 样式）

### 2.3 AI 助手组件（保持但风格统一）
- 右下角浮动按钮：圆形，主题色 `#2f4154`
- 聊天面板：白色卡片 + 阴影
- 输入框：Material 风格

### 2.4 响应式
- 移动端：导航栏收缩，卡片全宽，sidebar 改为底部导航
- 平板：2 列卡片网格
- 桌面：3 列卡片网格（简报页）

### 2.5 交互细节
- 页面加载进度条（NProgress 风格，accent 色 `#29d`）
- 链接 hover 颜色过渡
- 卡片 hover：上浮 + 阴影加深
- 平滑滚动

## 实施步骤

### Phase 1: 修复 AI 助手（先修后改）
1. 逐页检查 chat widget HTML 元素完整性
2. 排查 CSS 冲突（z-index / stacking context）
3. 修复后 curl 验证 Worker 正常 → 确认前端联调通过

### Phase 2: 重写 styles.css
1. 更新 CSS 变量为 Fluid 配色
2. 重写导航栏、卡片、按钮、表单样式
3. 添加阴影、过渡动画

### Phase 3: 改造页面
1. **index.html**：navbar + banner + 卡片流 + footer
2. **6 期简报 HTML**：navbar + 文章卡片布局
3. **reports/index.html**：navbar + 目录卡片 + 搜索

### Phase 4: 验证部署
1. 本地确认所有页面正常渲染
2. `git push` + curl 200 验证
3. 随机点击 3 个页面测试 AI 助手响应

## 关键原则
- **先修 AI 助手再改风格** — 不让新 bug 叠加
- **不改报告页（reports/*.html 28份）** — 它们自包含暗色主题，与 Fluid 风格共存
- **保持零外部依赖**（除 Google Fonts）— 不用 Bootstrap CDN，纯 CSS
- **统一 chat.js** — 所有页面共享同一份
- **每步完成后自检** — 对照 checklist 自查通过再进入下一步

## 验证标准
- AI 助手在所有 8 个页面可用（点击按钮 → 输入 → 收到 LLM 回复）
- 全站风格统一为 Fluid Material Design
- `curl` 首页 + reports/ + 任意简报 + Worker 全部 200
- 移动端（<768px）导航栏正常折叠
