## 项目现状与任务

线上站点：https://andy-zokelink.github.io/tools-briefing/
项目路径：/Users/andy/tools-briefing/
GitHub：https://github.com/andy-zokelink/tools-briefing

这是一个 AI 开发者工具周刊站点，6 期简报 + 29 份研究报告 + AI 聊天助手。
当前 styles.css 约 1900 行，自称"Fluid Material Design"但远不如目标 https://hexo.fluid-dev.com/

## 四个任务（全部做，做完一个汇报一个）

### 任务1：修复 AI 助手 "Failed to fetch"（最高优先级）
- 浏览器打开 https://andy-zokelink.github.io/tools-briefing/ 测试 AI 助手
- 查看 Console/Network 面板找到确切错误
- Worker URL: https://tools-briefing-ai.andy-132.workers.dev
- 后端 SiliconFlow API，模型 deepseek-ai/DeepSeek-R1-0528-Qwen3-8B
- 用 curl 测试 Worker 和 API 都正常——问题在浏览器端
- 修复后必须实际测试对话功能正常

### 任务2：100% 复刻 Fluid 主题
- 仔细打开 https://hexo.fluid-dev.com/ 逐区域分析每个细节
- 从 banner/导航/卡片/代码块/页脚/响应式 全部对齐
- 重写 index.html + styles.css

### 任务3：排版/配图/配色/互动全面提升
- 每篇文章卡片必须有配图
- hover 效果、滚动动画、过渡
- 移动端体验
- 浅灰底色（不是纯白）

### 任务4：主动创作
- 用 kkidc 的 gemini-3.1-flash-image-preview 生成文章配图（API Key 在 ~/.hermes/config.yaml 的 image_gen.providers.kkidc.api_key）
- 生成 Hero banner 背景图
- 做个有趣的 404 页面

## 约束
- 纯静态 HTML/CSS/JS，不引入构建工具
- 图片放项目里不外部链接（/images/ 目录）
- 研究报告 HTML 不修改（导航链正确即可）
- 做完 git add/commit/push
- 每完成一个阶段用 echo "=== 阶段X完成 ===" 汇报
- 大胆创作，不预设限制，要有自己的审美判断
