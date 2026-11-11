# 提示词

在已有"做一个黑洞可视化"的语境下，只说了一句：

```text
impress me
```

> 说明：原始上下文未完整保留，此处按记忆记录。本题为 `open-ended` 自由发挥题，对技术路线与视觉细节不设约束，但跨模型评测与交付归档须遵守以下规范。

---

## 跨模型测试与交付流程（被测 Agent 必须遵守）

```text
【重要前提】：
如果你不确定自己当前被测的具体模型名（model）、思考/推理强度（effort）或所属厂商（vendor），必须在开始前或登记数据前主动向用户提问确认，严禁自行胡乱猜测、填写 unknown 或随意标记！

完成创作后，必须自动执行以下完整交付流程（不要仅回复文字）：
1. 【保存答卷】：
   - 多文件作品保存到 `benchmarks/web-black-hole-impress-me/{harness}-{model}-{effort}/` 目录下（入口为 `index.html`）；单文件作品保存为 `benchmarks/web-black-hole-impress-me/{harness}-{model}-{effort}.html`。
   - harness、model、effort 必须为你当前被测环境的真实身份与推理强度（如 high / medium / low / max 等）。
2. 【自动更新记录文档 README.md】：
   - 读取并更新 `benchmarks/web-black-hole-impress-me/README.md`，在「## 答卷」部分追加本次产物记录（含厂商、模型、Harness、effort 与路径）。
3. 【展示成果】：
   - 生成后以可视化方式（预览面板 / 浏览器）展示作品。
```

## 测试规范说明

1. **保存位置**：保存在 `benchmarks/web-black-hole-impress-me/` 下的 `{harness}-{model}-{effort}/` 目录（或同名 `.html` 单文件）内。
2. **文件与目录命名**：`{harness}-{model}-{effort}`
   - 推理 effort 按实际参数标记（不确定时必须向用户确认）。
   - 模型名和 harness 名由被测 agent 自行填写真实身份，不得留空或写 "unknown"。
3. **交付要求**：生成后必须以可预览方式展示，并主动同步 `benchmarks/web-black-hole-impress-me/README.md` 中的已有结果记录。
4. **内容要求**：无预设视觉规格（`open-ended`），由模型自主选择最佳前端/图形技术路线完成令人印象深刻的黑洞可视化作品。
5. **独立创作约束（重要）**：生成代码时，**严禁参考、读取、借鉴当前目录（包括 `cosmic-singularity/` 及其他答卷）内任何已存在的源代码文件**。必须完全独立地从头构思与实现，以保证跨模型对比的公平性。若为满足命名与登记需求，仅允许读取目录清单与 `README.md`。
6. **身份确认与防臆测（重要）**：若当前被测环境未明确暴露模型真实版本号、当前推理强度（effort）或模型厂商（vendor），被测 Agent **必须主动向用户提问确认**，严禁臆测、填错或随意标记为 unknown/high。
