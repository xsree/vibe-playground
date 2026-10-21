# Gargantua Observer

一个基于 vgpu / WebGPU / WGSL 的多通道交互黑洞观测页。

- 测地线光线追踪 G-buffer，保留黑洞背面的引力透镜光带
- 体积噪声吸积盘、星空、抗锯齿与三层 HDR bloom
- 拖动任意方位环绕，滚轮缩放，方向键微调
- 水平无限旋转，俯仰 ±88°

## 运行

```powershell
npm install --cache '.npm-cache'
npm run dev
```

需要支持 WebGPU 的现代浏览器。

## 构建

```powershell
npm run build
```

## 单 HTML 版本

`standalone-black-hole.html` 已内联页面样式、JavaScript、WGSL 和运行依赖，不需要 Node.js、npm、CDN 或其它本地文件即可运行。

推荐使用支持 WebGPU 的新版 Chrome 或 Edge 打开。若浏览器限制 `file://` 下的 WebGPU，可通过任意静态文件服务访问该 HTML；这不要求使用 Node.js。

重新生成单文件构建：

```powershell
npm run build:single
```

构建完成后会同时保留两个等价文件：

- `standalone-black-hole.html`：项目根目录中的便捷副本。
- `single-html-dist/index.html`：可直接进入或整体复制的构建目录。

测试提示词和验收文档位于上一层目录（`../prompt.md`、`../acceptance.md`）。
