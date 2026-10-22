# vibe-playground

多项目聚合目录，用来测试 LLM 的不同能力，以及存放自制的技术图谱与独立工具项目。规范见 [AGENTS.md](AGENTS.md)。

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

## atlas：技术与代码图谱

- [web-tech](atlas/web-tech/)
- [canvas](atlas/canvas/)
- [svg](atlas/svg/)

## projects：应用与工具项目

| 项目 | 类型 | 简介 |
|---|---|---|
| [boxpid](projects/boxpid/) | Web 工具 (React + TS) | 浏览器本地运行的 P&ID / PFD Bounding Box 可视化核对工具 |
| [eatwhat](projects/eatwhat/) | Web 应用 (Vanilla JS) | 「今天吃什么」随机选餐与菜单管理前端应用 |
| [nitri-kb-pipeline](projects/nitri-kb-pipeline/) | Python CLI 管线 | PDF 自动化拆分、提取与高价值知识库构建流水线 |
| [chemical-process-flow-visualizer](projects/chemical-process-flow-visualizer/) | Web 工具 (React + TS) | 基于 React Flow 与 ELK.js 的化工工艺流程可视化、结构化解析与自动排版平台 |
| [prompt-probe](projects/prompt-probe/) | Python CLI 工具 | 伪装 OpenAI 兼容接口以捕获 Coding Agent 首个请求系统提示词的诊断工具 |
| [theme-transition-showcase](projects/theme-transition-showcase/) | 前端交互展示 | 42 种明暗主题切换动画，涵盖光线、材质、工艺与空间，支持并排比较和进度拖动 |
