# 仓库指南

## 项目结构与模块组织

本仓库是一个小型静态笔记应用。

- `index.html` 定义左右两栏布局，并加载 CSS 与 JavaScript。
- `styles.css` 包含全部视觉样式和响应式布局规则。
- `app.js` 包含应用状态辅助函数、`localStorage` 持久化、渲染和 DOM 事件绑定。
- `app.test.js` 包含基于 Node 的测试，覆盖状态行为和关键 HTML/CSS 回归。
- 仓库中不应包含构建产物或依赖目录。

## 构建、测试与开发命令

- `node app.test.js` 使用 Node 内置测试运行器执行完整测试套件。
- `python3 -m http.server 8000` 在本地启动静态服务，可通过 `http://localhost:8000/` 在浏览器中验证。
- 也可以直接用浏览器打开 `index.html`，因为本项目没有构建步骤。

本项目没有包管理器配置、打包器或编译命令。

## 编码风格与命名约定

使用原生 HTML、CSS 和 JavaScript。改动应尽量小，并贴合现有结构。

- HTML、CSS 和 JavaScript 使用 2 个空格缩进。
- JavaScript 函数和变量使用 `camelCase`，例如 `getVisibleNotes`。
- CSS 类名使用 kebab-case，例如 `.note-item` 和 `.empty-editor`。
- 对已测试或复用的行为，优先使用清晰的辅助函数，避免内联重复。
- 除非功能明确需要，否则避免新增第三方依赖。

## 测试指南

测试使用 Node 内置的 `node:test` 和 `node:assert/strict`，不需要外部测试库。

- 在 `app.test.js` 中添加测试。
- 测试名称应描述具体行为，例如 `deleteSelectedNote removes the current note and selects the next note`。
- 覆盖状态变更、持久化解析，以及可从静态文件检查的 UI 回归。
- 提交前运行 `node app.test.js`。

## 提交与 Pull Request 指南

近期提交使用简短的祈使句式标题，并采用 Title Case，例如 `Add static notes app` 和 `Fix hidden editor overlay`。

Pull Request 应包含：

- 面向用户或代码行为变更的简明摘要。
- 已运行的测试命令及结果。
- 对可见 UI 变更提供截图，或简短说明浏览器验证结果。
- 已知限制或后续工作。

## Agent 专用说明

除非任务明确要求，否则不要修改无关文件或未跟踪文件。除非有充分理由，否则保留当前静态、无依赖的项目形态。


## 提交

每次完成代码修改后，都需要提交一次 git commit
