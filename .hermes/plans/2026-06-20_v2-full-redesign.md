# 任务三合一：修复AI助手 + 90%还原Fluid主题 + 配置生图模型

## 目标总览
1. 修复 AI 助手报错（fetch 到 Worker 失败）
2. 全站 90% 还原 Hexo Fluid 主题视觉
3. 本地配置 Gemini 图像生成模型

## 一、修复 AI 助手

### 问题现象
- 用户点击发送后，返回"抱歉，AI 服务暂时不可用。请稍后重试或查阅最新简报页面。"
- 这是 chat.js 第 107 行 catch 块的消息，说明 `fetch()` 本身抛异常
- Worker 直接 curl 调用正常返回（200 + CORS + JSON reply）

### 排查步骤
1. **检查 fetch 参数**：chat.js 发送 `{messages: []}`（messageHistory 初始为空数组），Worker 能处理
2. **CORS 检查**：Worker 已返回 `Access-Control-Allow-Origin: *`，但浏览器可能还发 OPTIONS 预检
3. **Worker OPTIONS 处理**：Worker 已正确处理 OPTIONS 返回 204，但需确认 GitHub Pages HTTPS → Worker HTTPS 不被浏览器拦截
4. **可能根因**：
   - 浏览器端的 `fetch` 因为 Worker URL 的 SSL 证书链问题失败（CF Workers 使用 `*.workers.dev` 证书，部分浏览器可能不信任）
   - `messageHistory` 的 SYSTEM_PROMPT 太长导致 payload 过大（旧版代码）
   - CSS `display:none` 隐藏了 chatPanel 但 JS 仍在运行，实际 fetch 成功但 UI 不显示？不对——error message 是 catch 块输出

### 修复方案（按优先级）
1. **添加详细调试信息**：在 catch 块中输出 `err.message` 到界面，帮助定位（console.error 在 GitHub Pages 上用户看不到）
2. **添加 fetch 超时**：`AbortController` + 15 秒超时
3. **预检处理**：确保 Worker 对 OPTIONS 返回完整 CORS 头
4. **简化 payload**：messageHistory 只发送最近 10 条，控制 body 大小
5. **测试验证**：
   - 在本地用 Python http.server 模拟浏览器请求，确认 CORS
   - curl -X OPTIONS 验证 Worker 预检响应
   - 修复后实际在浏览器 console 确认 fetch 成功

### 修复后自检
- `curl -X OPTIONS https://tools-briefing-ai.andy-132.workers.dev` 返回 204 + 完整 CORS 头
- `curl -X POST ...` 返回 JSON reply
- 在浏览器打开 https://andy-zokelink.github.io/tools-briefing/，点击 AI 按钮，输入"你好"，收到 LLM 回复

---

## 二、90% 还原 Hexo Fluid 主题

### Fluid 主题视觉规范（从 https://hexo.fluid-dev.com/ 提取）

#### 配色
```
主色: #2f4154 (深蓝灰)
主色暗: #1a2a3a
强调色: #29d (亮蓝)
强调色暗: #0077b6
亮色背景: #f5f7fa
白色卡片: #ffffff
文字主: #2c3e50
文字次: #5a6a7a
文字弱: #8a9aaa
边框: #e8ecf1
代码背景: #f0f2f5
```

#### 阴影（Material Design Elevation）
```
card: box-shadow: 0 12px 15px rgba(0,0,0,0.24), 0 17px 50px rgba(0,0,0,0.19)
navbar: box-shadow: 0 2px 8px rgba(0,0,0,0.1)
hover: box-shadow: 0 20px 40px rgba(0,0,0,0.2)
```

#### 字体
```
正文: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans SC, PingFang SC, sans-serif
等宽: JetBrains Mono, Fira Code, Cascadia Code, SF Mono, monospace
```

#### 布局体系
```
导航栏: fixed top, 56px 高度, 深蓝灰底色, 白色文字, 滚动后加阴影
Banner: 全宽, 深蓝灰 → 暗色渐变, 居中标题+副标题+统计数字
内容区 (board): 白色卡片, 圆角 8px, 上移 -2rem 覆盖 banner 底部, 强阴影
卡片: 白色底, 圆角 8px, 阴影, hover 上浮 4px
侧边栏 (TOC): 固定右侧, 滚动高亮当前标题
页脚: 深色背景, 简洁文字
```

#### 关键组件（Fluid 特有）
1. **进度条**: 顶部 2.5px 蓝色线条，页面加载时动画
2. **滚动进度**: NProgress 风格
3. **导航栏汉堡菜单**: 三条线动画旋转
4. **Banner 视差**: 随滚动减速移动（可选）
5. **卡片 hover**: 上浮 + 阴影加深 + 过渡动画
6. **代码块**: 深色背景 + 右上角复制按钮 + 语言标签
7. **标签云**: 彩色标签
8. **分页器**: 圆形按钮
9. **返回顶部**: 圆形蓝色按钮，滚动到一定距离后出现
10. **TOC 目录**: 右侧固定，当前章节高亮

#### 首页布局（参考 Fluid）
```
┌──────────────────────────────┐
│  Navbar (fixed, #2f4154)     │
├──────────────────────────────┤
│  Banner (gradient #2f4154)   │
│  标题 + 副标题 + 统计数据     │
├──────────────────────────────┤
│  ┌────────────────────┐      │
│  │ Board (white card)  │     │
│  │ 卡片1               │     │
│  │ 卡片2               │     │
│  │ 卡片3               │     │
│  │ 分页器              │     │
│  └────────────────────┘      │
├──────────────────────────────┤
│  Footer (dark)               │
└──────────────────────────────┘
```

#### 简报详情页布局
```
┌──────────────────────────────┐
│  Navbar                      │
├──────────────────────────────┤
│  ┌────────────────────┐      │
│  │ Board (article card)│     │
│  │ 标题 + meta         │     │
│  │ 核心观点 (highlight) │     │
│  │ 正文内容             │     │
│  │ 代码块               │     │
│  │ 上一篇/下一篇        │     │
│  └────────────────────┘      │
│         TOC (固定右侧)       │
├──────────────────────────────┤
│  Footer                      │
└──────────────────────────────┘
```

### 实施步骤

#### Phase 1: 全局基础（styles.css 完全重写）
1. CSS 变量更新为 Fluid 配色
2. 重置样式 + 基础排版（字体、行高、颜色）
3. 进度条组件
4. 导航栏组件（含汉堡菜单动画）
5. Banner 组件
6. Board 容器 + 卡片组件
7. 按钮、标签、表单
8. 代码块 + 复制按钮
9. 分页器
10. 返回顶部按钮
11. TOC 目录组件
12. 页脚
13. 响应式（<768px 移动端适配）
14. 打印样式

#### Phase 2: 改造首页 (index.html)
1. 添加进度条 HTML
2. 替换导航栏为 Fluid 风格 navbar
3. 添加 Banner section
4. Board 容器包裹所有卡片
5. 卡片列表改为 Fluid 卡片样式
6. 导航项更新

#### Phase 3: 改造简报详情页 (6 个 HTML)
1. 每个页面统一 navbar
2. Board 容器包裹文章
3. 卡片式文章布局
4. 代码块深色主题 + 复制按钮
5. 上一篇/下一篇导航

#### Phase 4: 改造研究报告目录 (reports/index.html)
1. navbar 统一
2. 分类卡片改为 Material 风格
3. 搜索框改为 outlined 样式
4. 报告列表项增加 hover 效果

#### Phase 5: 配图生成
1. **Banner 背景图**: 用 CSS 线性渐变 + 几何图案（AI 工具/芯片/代码元素），不要外部图片
2. **卡片装饰**: 标题左侧细线强调、图标点缀
3. **OG 图片**: 生成站点社交分享图（纯 CSS 或内嵌 SVG）
4. 所有配图方案用 CSS/SVG，零 HTTP 请求

---

## 三、配置本地图像生成模型

### 模型信息
- 模型名: gemini-3.1-flash-image-preview
- API Key: sk-RtRA0kNoRTALyPjExCRu24RYKiCHp26yuBQY1oAdavAsqpYC
- 端点: https://ai-api.kkidc.com/v1beta/models/{model}:generateContent

### 配置方式
1. 在 Hermes 的 config.yaml 中配置自定义 provider
2. Provider 配置：
```yaml
custom_providers:
  kkidc-image:
    base_url: https://ai-api.kkidc.com
    api_key: sk-RtRA0kNoRTALyPjExCRu24RYKiCHp26yuBQY1oAdavAsqpYC
    models:
      - gemini-3.1-flash-image-preview
```
3. 使用 `hermes config set` 或直接编辑 `~/.hermes/config.yaml`
4. **API Key 安全**: 不写入 git 追踪的文件，存在 config.yaml 中即可（已在 .gitignore）

### 配置后测试
- `hermes config get` 确认配置生效
- 用 Hermes 调用生图功能测试

---

## 执行规则

### 顺序
1. **先修 AI 助手** → 确认能用后再继续
2. **再改 Fluid 主题** → 分 Phase 逐个页面改造
3. **最后配生图模型** → 不影响站点

### 每步自检
- AI 助手：curl Worker + 检查所有 8 个页面 chat widget 可用
- Fluid 主题：对比 hexo.fluid-dev.com 首页截图，检查导航栏/卡片/阴影/配色一致性
- 生图模型：hermes config get 验证

### Git 提交
- 每完成一个 Phase 提交一次
- 提交信息格式：`emoji 简短描述`
- 全部完成后 push

### 重要
- **不改 reports/*.html 的 28 份报告页**（自包含暗色主题，不受全局样式影响）
- 配图优先用 CSS/SVG，不用外部图片
- API Key 存在 config.yaml，不要写入 git
- 90% 还原度：Fluid 主题的布局体系、配色、阴影、组件、交互动画都要复刻
