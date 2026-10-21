# vibe-playground

多项目聚合目录，用来测试 LLM 的不同能力，以及存放自制的学习网页。规范见 [AGENTS.md](AGENTS.md)。

## benchmarks：提示词索引

核心资产是提示词。点进题目目录，先看 `prompt.md`。

| 题目 | 类型 | 提示词要点 | 答卷 |
|---|---|---|---|
| [svg-pelican-bicycle](benchmarks/svg-pelican-bicycle/) | spec-driven | 纯手写 SVG：鹈鹕骑自行车，自动登记画廊 | 多个，见画廊 |
| [canvas-pelican-bicycle](benchmarks/canvas-pelican-bicycle/) | spec-driven | 纯手写 Canvas 2D：鹈鹕骑自行车，动画与画面导出 | 1，见画廊 |
| [canvas-pelican-bicycle](benchmarks/canvas-pelican-bicycle/) | spec-driven | 手写 Canvas 2D：鹈鹕骑自行车（SVG 版的 Canvas 适配） | 1 |
| [svg-ds3-estus-flask](benchmarks/svg-ds3-estus-flask/) | spec-driven | 黑魂 3 艾斯特瓦（**提示词待补**） | 1 |
| [web-ps5-controller](benchmarks/web-ps5-controller/) | spec-driven | 纯前端高保真可交互 DualSense | 1 |
| [3d-spring-railway-diorama](benchmarks/3d-spring-railway-diorama/) | spec-driven | Three.js 日系春季铁路车站微缩模型，三文件限制 | 1 |
| [3d-rainy-convenience-store](benchmarks/3d-rainy-convenience-store/) | spec-driven | 三渲二雨夜便利店街角微缩场景 | 2 |
| [webgpu-black-hole-lensing](benchmarks/webgpu-black-hole-lensing/) | spec-driven | WebGPU 引力透镜 + 吸积盘，盲测 + 验收标准 | 1（原始作品） |
| [web-black-hole-impress-me](benchmarks/web-black-hole-impress-me/) | open-ended | 一句 "impress me" | 1 |
| [newapi-black-hole-controls](benchmarks/newapi-black-hole-controls/) | reverse-engineering | 逆向 newapi 官网黑洞，加颜色和缩放控制 | 1 |

## learning：知识点网页

- [web-tech-visual-lab](learning/web-tech-visual-lab/)
- [canvas-visual-lab](learning/canvas-visual-lab/)
- [svg-visual-lab](learning/svg-visual-lab/)
