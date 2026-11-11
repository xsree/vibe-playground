# 黑魂 3 艾斯特瓶（Estus Flask）SVG 测试提示词

## 提示词原话

> TODO: 原始提示词未保留。找回后请原文粘贴到这里。

---

## 跨模型测试与交付流程（被测 Agent 必须遵守）

```text
【重要前提】：
如果你不确定自己当前被测的具体模型名（model）、思考/推理强度（effort）或所属厂商（vendor），必须在开始前或登记数据前主动向用户提问确认，严禁自行胡乱猜测、填写 unknown 或随意标记！

完成创作后，必须自动执行以下完整交付流程（不要仅回复文字）：
1. 【保存 SVG 文件】：
   - 保存到 `benchmarks/svg-ds3-estus-flask/` 目录下。
   - 命名格式：`{harness}-{model}-{effort}.svg`（静态版）或 `{harness}-{model}-{effort}-animated.svg`（动态版）。
   - harness、model、effort 必须为你当前被测环境的真实身份与推理强度（如 high / medium / low / max 等）。
2. 【自动更新记录文档 README.md】：
   - 读取并更新 `benchmarks/svg-ds3-estus-flask/README.md`，在「## 答卷」部分追加本次产物记录（含厂商、模型、Harness、effort 与文件名）。
3. 【展示成果】：
   - 生成后以可视化方式（文件卡片 / 预览面板 / 浏览器）展示 SVG 产物。
```

## 测试规范说明

1. **保存位置**：保存在 `benchmarks/svg-ds3-estus-flask/` 文件夹内。
2. **文件命名**：`{harness}-{model}-{effort}[-animated].svg`
   - 推理 effort 按实际参数标记（不确定时必须向用户确认）。
   - 模型名和 harness 名由被测 agent 自行填写真实身份，不得留空或写 "unknown"。
3. **交付要求**：生成后必须以可预览方式展示，并主动同步 `benchmarks/svg-ds3-estus-flask/README.md` 中的已有结果记录。
4. **内容要求**：纯手写 SVG 代码（不允许调用图像生成模型生成位图再转 SVG），刻画《黑暗之魂 3》艾斯特瓶（Estus Flask）的玻璃器皿质感与余火液面光效。
5. **独立创作约束（重要）**：生成 SVG 时，**严禁参考、读取、借鉴当前目录内任何已存在的 `.svg` 文件（包括 `estus-flask.svg`）**。必须完全独立地从头构思与绘制，以保证跨模型对比的公平性。若为满足命名与登记需求，仅允许读取文件列表与 `README.md`。
6. **身份确认与防臆测（重要）**：若当前被测环境未明确暴露模型真实版本号、当前推理强度（effort）或模型厂商（vendor），被测 Agent **必须主动向用户提问确认**，严禁臆测、填错或随意标记为 unknown/high。
