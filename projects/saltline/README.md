# Saltline

从 Claude Web Artifact 导出的纯前端 3D 第一人称射击游戏（Three.js r180，零后端、零构建依赖，所有贴图、模型与 Web Audio 音效均在浏览器内程序化生成）。

- **原始来源**：[Saltline — Claude Artifact](https://claude.ai/artifact/BGY1SztrAYcJQHSsnHHGmp)（原作者：Felix，基于 Claude Fable 5.2 初版优化）
- **文件结构**：
  - `index.html`：干净的页面骨架与 `#legacy-v8` 内嵌数据
  - `ui.css`：HUD、菜单与触控/手柄样式
  - `game.js`：Three.js 渲染、物理、AI、武器与音频完整逻辑

## 本地运行

直接用现代浏览器打开 `index.html`（或通过任意静态文件服务器访问，如 `npx serve .` / `python -m http.server`）。

> 若通过 `file://` 打开时浏览器限制指针锁定（Pointer Lock），可按提示按住鼠标左/右键拖动转视角，或使用本地静态服务器访问。

## 导出修复说明

从在线运行态导出的原始 DOM（`raw.html`）存在两个问题，已在本次整理中修复：
1. **点击 Deploy 后主菜单仍遮挡画面**：原始导出保存了已挂载的 `<div id="ui">`（内含 `<div class="menu open" data-screen="title">`），游戏本地启动时又向 `#ui` 追加了第二套 `.hud` 与 `.menu`，导致旧的冻结菜单一直盖在最上层。现已清空 `#ui` 初始节点，由 `game.js` 启动时统一创建。
2. **清理沙盒与扩展注入**：移除了 Claude Artifact 外壳运行时脚本（`__FRAME_PREAMBLE` 等）、已完成的 `#boot` 残留状态以及浏览器翻译扩展注入的 `<style>` / `<div>` 节点。
