# 合并 xincheng-report → tools-briefing

## 目标
把 xincheng-report（28份AI调研报告）合并进 tools-briefing 仓库，统一入口为 `https://andy-zokelink.github.io/tools-briefing/`，风格统一为 Notion 白底暖色点缀。

## 当前状态
| | xincheng-report | tools-briefing |
|---|---|---|
| 本地路径 | `/Users/andy/projects/xincheng-report/` | `/Users/andy/tools-briefing/` |
| GitHub | `andy-zokelink/xincheng-report` | `andy-zokelink/tools-briefing` |
| 页面数 | 28 份报告 + index.html | 6 期简报 + index.html |
| 主题 | 暗色（#08090a 底，内联 CSS） | Notion 白底（styles.css 共享） |
| 首页 | 搜索+分类目录 | 侧边栏+卡片流 |

## 方案
B 方案：以 tools-briefing 为主，吸收 xincheng-report。

## 分两步执行

### 第一步：文件合并 + 入口统一（本次执行）

#### 1. 搬文件
- [ ] 在 `tools-briefing/reports/` 创建目录
- [ ] 把 xincheng-report 全部 28 个 HTML 复制到 `tools-briefing/reports/`
- [ ] 保留 `xincheng-report/index.html` 作为 `/reports/index.html`（研究报告目录页）

#### 2. 统一研究报告目录页风格
- [ ] 把 `/reports/index.html` 从暗色主题改写为 Notion 白底
- [ ] 应用 tools-briefing 的 CSS 变量（--bg: #ffffff, --warm: #b97509, 等）
- [ ] 移除 Particles.js 粒子背景
- [ ] 改用 tools-briefing 的侧边栏布局
- [ ] 分类结构保留：按「模型调研 / 工具对比 / 金融数据 / 策略思考」分类

#### 3. 更新首页入口
- [ ] `tools-briefing/index.html` 侧边栏新增「📋 研究报告」导航项
- [ ] 首页 Hero 下方新增「研究报告」卡片区，列出近期报告
- [ ] 更新 stats 数字（加入报告总数等）

#### 4. 28 份报告页暂时保持原样
- [ ] 维持自包含内联 CSS（暗色），不做批量翻新
- [ ] 每份报告加一个顶部导航条（返回研究报告目录 / 返回首页）
- [ ] 后续新增报告用 Notion 白模板

#### 5. 验证与推送
- [ ] 本地预览 index.html + reports/index.html 正常
- [ ] `git push` 到 GitHub
- [ ] `curl` 验证关键页面 200
- [ ] 设置 `xincheng-report` 仓库 GitHub Pages 重定向或归档说明

### 第二步：报告模板统一（后续）
- 新建报告模板 `reports/template.html`（Notion 白底 + Chart.js）
- 旧报告按需逐个从暗色翻新为白色
- 逐步淘汰自包含内联 CSS

## 关键决策
- xincheng-report 原 URL 处理：在 xincheng-report 仓库 `index.html` 放重定向脚本，指向 `tools-briefing/reports/`
- 风格冲突：28 份暗色报告不阻塞上线，入口层先行统一

## 验证标准
- `https://andy-zokelink.github.io/tools-briefing/` 首页同时展示简报卡片 + 研究报告入口
- `https://andy-zokelink.github.io/tools-briefing/reports/` 白底目录页，列出 28 份报告
- `https://andy-zokelink.github.io/xincheng-report/` 自动跳转到新地址
