# 黑洞引力透镜 (webgpu-black-hole-lensing)

类型: spec-driven

## 提示词
- [prompt.md](prompt.md)：盲测提示词（要求从零独立实现，不得参考现有代码）
- [acceptance.md](acceptance.md)：视觉验收标准
- [fallback-implementation.md](fallback-implementation.md)：降级实现说明

## 想测什么
实时渲染引力透镜和吸积盘（WebGPU / WGSL），以及按验收标准自检的能力。

## 来源
`gargantua/` 是本题的**原始作品**：由 agent 根据"做一个黑洞可视化"生成，盲测提示词由它提炼而来。它可作为参考实现，不算盲测答卷。

## 答卷

| 厂商 | 模型 | Harness | Effort | 路径 | 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Google | Gemini 4 Carbon | Antigravity | medium | [antigravity-gemini-4-carbon-medium/](antigravity-gemini-4-carbon-medium/index.html) | 原生 WebGPU (WGSL) + WebGL2 自动回退，实时三维零测地线步进、双相位湍流烟雾吸积盘、上下连续透镜光弧与光子环 |

