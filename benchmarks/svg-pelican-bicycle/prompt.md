# 鹈鹕骑自行车 SVG 测试提示词（跨模型 / 跨 Harness 对比用）

## 测试提示词
```text
在 `benchmarks/svg-pelican-bicycle/` 项目内，生成一份高质量纯手写 SVG 代码：绘制一只正在骑自行车的鹈鹕（pelican riding a bicycle）。

【重要前提】：
如果你不确定自己当前被测的具体模型名（model）、思考/推理强度（effort）或所属厂商（vendor），必须在开始前或登记数据前主动向用户提问确认，严禁自行胡乱猜测、填写 unknown 或随意标记！

完成创作后，必须自动执行以下完整交付流程（不要仅回复文字）：
1. 【保存 SVG 文件】：
   - 保存到 `benchmarks/svg-pelican-bicycle/artworks/` 目录下。
   - 命名格式：`{harness}-{model}-{effort}-pelican-riding-bicycle.svg`（静态版）
     或 `{harness}-{model}-{effort}-animated-pelican-riding-bicycle.svg`（动态动效版）。
   - 示例：`MiniMax-Code-MiniMax-M3.1-Flash-max-pelican-riding-bicycle.svg`
   - harness、model、effort 必须为你当前被测环境的真实身份与推理强度（如 high / medium / low / max 等）。

2. 【自动追加到画廊数据 gallery-data.js】：
   - 读取并更新 `benchmarks/svg-pelican-bicycle/gallery-data.js`，在 `window.PELICAN_RESULTS` 数组末尾追加配置：
     ```javascript
     {
       "harness": "你的Harness名",
       "vendor": "所属厂商名", // 必填！统一使用英文厂商名，例如 Alibaba、Ant、Anthropic、ByteDance、DeepSeek、Google、Meta、MiniMax、Moonshot、NVIDIA、OpenAI、StepFun、Tencent、Xiaomi、Zhipu，或全新厂商名；填写厂商名称，不要填模型系列名
       "model": "你的模型名",
       "effort": "你的推理强度", // low | medium | high | xhigh | max 等，以实际参数为准（注意：不要写 high-animated 等混合词）
       "animated": true, // 仅在为动态动效 SVG 时添加此字段
       "file": "artworks/上面保存的文件名.svg"
     }
     ```

3. 【自动更新记录文档 README.md】：
   - 读取并更新 `benchmarks/svg-pelican-bicycle/README.md`：
   - 在「### 已有结果」对应的厂商分组下追加一条记录（若是全新厂商，则按现有格式新建 `- **厂商名**` 分组），格式：
     `  - 模型名 + Harness：`artworks/文件名.svg`（YYYY-MM-DD）`
   - 将「已登记共 **XX** 条」的总数加 1。

4. 【展示成果】：
   - 生成后以可视化方式（文件卡片 / 预览面板 / 浏览器）展示 SVG 产物。
```

## 测试规范说明

1. **保存位置**：保存在 `benchmarks/svg-pelican-bicycle/artworks/` 文件夹内。
2. **文件命名**：`{harness}-{model}-{effort}[-animated]-pelican-riding-bicycle.svg`
   - 动态动效版在 effort 后加 `-animated`。
   - 推理 effort 按实际参数标记（不确定时必须向用户确认）。
   - 模型名和 harness 名由被测 agent 自行填写真实身份，不得留空或写 "unknown"。
3. **交付要求**：生成后必须以可预览方式展示，并主动同步 `gallery-data.js` 与 `README.md` 中的已有结果记录。
4. **内容要求**：纯手写 SVG 代码（不允许调用图像生成模型生成位图再转 SVG）；画面须同时包含鹈鹕与自行车两个主体，比例合理、语义清晰可辨认。
5. **独立创作约束（重要）**：生成 SVG 时，**不得参考、读取、借鉴当前项目（包括 `artworks/` 子目录）内任何已存在的 SVG 文件**。必须完全独立地从头构思与绘制，以保证跨模型对比的公平性。若为满足文件命名与数据登记需求，仅允许读取文件列表与文档结构，不得读取任何其他 `.svg` 文件的绘图内容。
6. **身份确认与防臆测（重要）**：若当前被测环境未明确暴露模型真实版本号、当前推理强度（effort）或模型厂商（vendor），被测 Agent **必须主动向用户提问确认**，严禁臆测、填错或随意标记为 unknown/high。
