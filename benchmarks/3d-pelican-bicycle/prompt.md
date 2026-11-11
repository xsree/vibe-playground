# 鹈鹕骑自行车 3D 测试提示词

## 用户原话

```text
再做个3d动态版
```

上下文引用文件：[原 SVG 提示词](../svg-pelican-bicycle/prompt.md)。

载体与目录形式确认（多选一交互确认）：

> 新建独立题目 benchmarks/3d-pelican-bicycle/（Three.js / WebGL 可交互 3D 动态场景）

当前被测环境真实身份：

> Antigravity / Gemini-4-Carbon / medium（厂商：Google）

## 执行提示词（根据上述要求适配，跨模型 / 跨 Harness 对比用）

```text
在 `benchmarks/3d-pelican-bicycle/` 项目内，独立生成高质量纯程序化 Three.js / WebGL 3D 动态场景代码：绘制一只正在骑自行车的 3D 鹈鹕（3D pelican riding a bicycle）。

【重要前提】：
如果你不确定自己当前被测的具体模型名（model）、思考/推理强度（effort）或所属厂商（vendor），必须在开始前或登记数据前主动向用户提问确认，严禁自行胡乱猜测、填写 unknown 或随意标记！

完成创作后，必须自动执行以下完整交付流程（不要仅回复文字）：
1. 【保存多文件 3D 答卷】：
   - 保存到 `benchmarks/3d-pelican-bicycle/{harness}-{model}-{effort}-animated/` 目录下（包含物理分离的 `index.html`、`style.css`、`main.js`）。
   - harness、model、effort 必须为你当前被测环境的真实身份与推理强度（如 high / medium / low / max 等）。

2. 【自动追加到画廊数据 gallery-data.js】：
   - 读取并更新 `benchmarks/3d-pelican-bicycle/gallery-data.js`，在 `window.PELICAN_3D_RESULTS` 数组末尾追加配置：
     ```javascript
     {
       "harness": "你的Harness名",
       "vendor": "所属厂商名", // 必填！统一使用英文厂商名（如 Alibaba、Anthropic、ByteDance、DeepSeek、Google、Meta、MiniMax、Moonshot、NVIDIA、OpenAI、StepFun、Tencent、Xiaomi、Zhipu 等）
       "model": "你的模型名",
       "effort": "你的推理强度", // low | medium | high | xhigh | max 等，以实际参数为准
       "animated": true,
       "file": "{harness}-{model}-{effort}-animated/index.html"
     }
     ```

3. 【自动更新记录文档 README.md】：
   - 读取并更新 `benchmarks/3d-pelican-bicycle/README.md`：
   - 在「## 答卷」表格中追加一条记录，并将顶部「画廊共 **XX** 条」的总数加 1。

4. 【展示成果】：
   - 生成后以可视化方式（预览面板 / 浏览器）展示 3D 场景与画廊产物。
```

## 测试规范说明

1. **保存位置**：保存在 `benchmarks/3d-pelican-bicycle/{harness}-{model}-{effort}-animated/` 文件夹内（`index.html`、`style.css`、`main.js` 物理分离，无构建步骤）。
2. **文件与目录命名**：`{harness}-{model}-{effort}-animated`
   - 推理 effort 按实际参数标记（不确定时必须向用户确认）。
   - 模型名和 harness 名由被测 agent 自行填写真实身份，不得留空或写 "unknown"。
3. **交付要求**：生成后必须以可预览方式展示，并主动同步 `gallery-data.js` 与 `README.md` 中的已有结果记录。
4. **内容要求**：所有 3D 几何体（鹈鹕、自行车、环境道具）均须通过 Three.js 程序化建模构造（禁止加载外部 `.glb` / `.gltf` / `.obj` 模型或调用图像生成模型）；鹈鹕与自行车在 360° 视角下立体比例合理、结构闭合清晰，具备连续骑行动画与 `OrbitControls` 交互，并尊重 `prefers-reduced-motion`。
5. **独立创作约束（重要）**：生成代码时，**不得参考、读取、借鉴当前项目或其他题目内任何已存在的答卷代码**。必须完全独立地从头构思与建模，以保证跨模型对比的公平性。若为满足命名与数据登记需求，仅允许读取文件列表与文档结构，不得读取任何其他答卷的绘图/建模代码。
6. **身份确认与防臆测（重要）**：若当前被测环境未明确暴露模型真实版本号、当前推理强度（effort）或模型厂商（vendor），被测 Agent **必须主动向用户提问确认**，严禁臆测、填错或随意标记为 unknown/high。
