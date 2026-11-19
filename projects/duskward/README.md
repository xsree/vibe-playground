# Duskward（与罗摩相会）

100% 纯代码程序化生成的可探索奥尼尔圆筒（O'Neill Cylinder）3D 交互世界：基于 **WebGPU** 实时渲染地形、柱廊、环形海、云雾光影与飞鸟，结合 **Web Audio API** 程序化合成风声、水流、虫鸣与鸟叫环境音，零外部 3D 模型或贴图文件依赖。

- **原始来源**：[Explorable O'Neill Cylinder 3D worldspace using 100% code only, no models or assets : r/TopologyAI](https://www.reddit.com/r/TopologyAI/comments/1xxzb2w/explorable_oneill_cylinder_3d_worldspace_using/)
- **文件结构**：
  - `index.html`：页面骨架、内联样式与 `#amb` 音频数据块
  - `fonts.js`：内嵌字体加载脚本（由原始内联脚本拆出）
  - `app.js`：WebGPU 场景渲染、相机漫游、Web Audio 环境音与参数面板逻辑

## 本地运行

需要支持 **WebGPU** 的现代浏览器（如新版 Chrome / Edge / Safari）。建议通过本地静态服务器访问：

```bash
npx serve .
# 或
python -m http.server
```

## 整理与适配说明

从原始单文件 HTML 整理拆分为离线独立运行版，做了以下适配：

1. **移除外部基路径**：删除了原始 `<base data-agnt-creation-base href="/creations/DmDSpPYm/assets/">`。
2. **脚本外置与 CSP 兼容**：将可执行内联 `<script>` 拆分为 `fonts.js` 与 `app.js`，移除 `navigator.clipboard.writeText` 与 `window.prompt` 依赖，并将 `catch {}` / 对象展开语法调整为 ES2017 兼容写法。
3. **移动端与容器交互优化**：为 `inset: 0` 补充物理定位回退；将主界面右上角设置按钮与设置面板关闭按钮统一调整至右下角，并为设置面板顶部增加安全留白，避免与移动端状态栏和宿主返回/分享按钮重叠。
