# New API 黑洞控制器改造测试提示词

## 提示词原话

> TODO: 原始提示词未保留。找回后请原文粘贴到这里。
> 背景说明：基于 `benchmarks/newapi-black-hole-controls/base/` 下从 newapi 官网逆向提取的原始着色器与页面壳，增加颜色选择器（`uTintA / uTintB / uTintC`）、鼠标滚轮与滑块相机距离缩放（`uCamDist`），并保持上下 180° 视角切换与平衡版 Doppler 效果。

---

## 跨模型测试与交付流程（被测 Agent 必须遵守）

```text
【重要前提】：
如果你不确定自己当前被测的具体模型名（model）、思考/推理强度（effort）或所属厂商（vendor），必须在开始前或登记数据前主动向用户提问确认，严禁自行胡乱猜测、填写 unknown 或随意标记！

完成改造后，必须自动执行以下完整交付流程（不要仅回复文字）：
1. 【保存改造答卷】：
   - 基于 `benchmarks/newapi-black-hole-controls/base/` 中的原始逆向素材进行改造，将完整答卷保存到 `benchmarks/newapi-black-hole-controls/{harness}-{model}-{effort}/` 目录下。
   - harness、model、effort 必须为你当前被测环境的真实身份与推理强度（如 high / medium / low / max 等）。
2. 【自动更新记录文档 README.md】：
   - 读取并更新 `benchmarks/newapi-black-hole-controls/README.md`，在「## 答卷」部分追加本次产物记录。
3. 【展示成果】：
   - 生成后以可视化方式（预览面板 / 浏览器）展示改造后的黑洞控制页面。
```

## 测试规范说明

1. **保存位置**：保存在 `benchmarks/newapi-black-hole-controls/{harness}-{model}-{effort}/` 独立子目录内。
2. **目录命名**：`{harness}-{model}-{effort}`
   - 推理 effort 按实际参数标记（不确定时必须向用户确认）。
   - 模型名和 harness 名由被测 agent 自行填写真实身份，不得留空或写 "unknown"。
3. **交付要求**：生成后必须以可预览方式展示，并主动同步 `benchmarks/newapi-black-hole-controls/README.md` 中的答卷记录。
4. **独立改造约束（重要）**：本题为 `reverse-engineering` 改造题，**仅允许读取 `base/` 目录下的原始逆向素材**，**严禁读取、参考或借鉴 `base/` 以外其他已完成改造的答卷代码**。
5. **身份确认与防臆测（重要）**：若当前被测环境未明确暴露模型真实版本号、当前推理强度（effort）或模型厂商（vendor），被测 Agent **必须主动向用户提问确认**，严禁臆测、填错或随意标记为 unknown/high。
