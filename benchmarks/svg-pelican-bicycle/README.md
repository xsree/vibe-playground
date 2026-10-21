类型: spec-driven

# 鹈鹕骑自行车 (svg-pelican-bicycle)

## 提示词
见 [prompt.md](prompt.md)。该文件同时是测试规范和"已有结果"记录表，被测 agent 会按其中流程更新。

## 想测什么
纯手写 SVG 的造型能力：能否让鹈鹕与自行车两个主体比例合理、语义清晰。

## 答卷
- 画廊：[index.html](index.html)（数据来自 [gallery-data.js](gallery-data.js)，已登记 58 条，记录见 [prompt.md](prompt.md#已有结果)）。
- `vendor` 填厂商名称，`model` 保留模型名。前端直接从 `gallery-data.js` 的 `vendor` 字段生成厂商列表、模型分组和筛选，不维护内置厂商名单；新增或更名只需更新数据。
- 答卷文件命名沿用提示词内定义的 `{harness}-{model}-{effort}[-animated]-pelican-riding-bicycle.svg`，不要改名，画廊依赖它。
