# 鹈鹕骑自行车 SVG 测试提示词（跨模型 / 跨 Harness 对比用）

## 测试提示词
```text
在`svg-pelican-bicycle`项目内，生成一份高质量纯手写 SVG 代码：绘制一只正在骑自行车的鹈鹕（pelican riding a bicycle）。

【重要前提】：
如果你不确定自己当前被测的具体模型名（model）、思考/推理强度（effort）或所属厂商（vendor），必须在开始前或登记数据前主动向用户提问确认，严禁自行胡乱猜测、填写 unknown 或随意标记！

完成创作后，必须自动执行以下完整交付流程（不要仅回复文字）：
1. 【保存 SVG 文件】：
   - 保存到`svg-pelican-bicycle/artworks/`目录下。
   - 命名格式：`{harness}-{model}-{effort}-pelican-riding-bicycle.svg`（静态版）
     或 `{harness}-{model}-{effort}-animated-pelican-riding-bicycle.svg`（动态动效版）。
   - 示例：`MiniMax-Code-MiniMax-M3.1-Flash-max-pelican-riding-bicycle.svg`
   - harness、model、effort 必须为你当前被测环境的真实身份与推理强度（如 high / medium / low / max 等）。

2. 【自动追加到画廊数据 gallery-data.js】：
   - 读取并更新 `svg-pelican-bicycle/gallery-data.js`，在 `window.PELICAN_RESULTS` 数组末尾追加配置：
     ```javascript
     {
       "harness": "你的Harness名",
       "vendor": "所属厂商名", // 必填！例如 Alibaba、Ant、Anthropic、ByteDance、DeepSeek、Google、Meta、MiniMax、Moonshot、NVIDIA、OpenAI、StepFun、Tencent、Zhipu、小米，或全新厂商名（盲测代号填 "匿名模型"）；填写厂商名称，不要填模型系列名
       "model": "你的模型名",
       "effort": "你的推理强度", // low | medium | high | xhigh | max 等，以实际参数为准（注意：不要写 high-animated 等混合词）
       "animated": true, // 仅在为动态动效 SVG 时添加此字段
       "file": "artworks/上面保存的文件名.svg"
     }
     ```

3. 【自动更新记录文档 prompt.md】：
   - 读取并更新 `svg-pelican-bicycle/prompt.md`：
   - 在「## 已有结果」对应的厂商分组下追加一条记录（若是全新厂商，则按现有格式新建 `- **厂商名**` 分组），格式：
     `  - 模型名 + Harness：`artworks/文件名.svg`（YYYY-MM-DD）`
   - 将顶部「共 XX 条」的总数加 1。

4. 【展示成果】：
   - 生成后以可视化方式（文件卡片 / 预览面板 / 浏览器）展示 SVG 产物。
```

## 测试规范说明

1. **保存位置**：保存在`svg-pelican-bicycle/artworks/`文件夹内。
2. **文件命名**：`harness-llm-resoningeffort-pelican-riding-bicycle.svg`
   - 动态动效版在 effort 后加 `-animated`。
   - 推理 effort 按实际参数标记（默认通常为 `high`）。
   - 模型名和 harness 名由被测 agent 自行填写真实身份，不得留空或写 "unknown"。
3. **交付要求**：生成后必须以可预览方式展示，并主动同步 `gallery-data.js` 与文档已有结果。
4. **内容要求**：纯手写 SVG 代码（不允许调用图像生成模型生成位图再转 SVG）；画面须同时包含鹈鹕与自行车两个主体，比例合理、语义清晰可辨认。
5. **独立创作约束（重要）**：生成 SVG 时，**不得参考、读取、借鉴当前项目（包括 `artworks/` 子目录）内任何已存在的 SVG 文件**。必须完全独立地从头构思与绘制，以保证跨模型对比的公平性。若为满足文件命名与数据登记需求，仅允许读取文件列表与文档结构，不得读取任何其他 `.svg` 文件的绘图内容。
6. **身份确认与防臆测（重要）**：若当前被测环境未明确暴露模型真实版本号、当前推理强度（effort）或模型厂商（vendor），被测 Agent **必须主动向用户提问确认**，严禁臆测、填错或随意标记为 unknown/high。

## 已有结果

排序规则：先按**模型厂商**分组（英文厂商名 A→Z，中文厂商随后，匿名模型最后），分组内按**版本号升序**，同版本按**轻量款 → 旗舰款**排列。画廊已登记共 **65** 条。

- **Alibaba**
  - Qwen3.8-27B + WorkBuddy：`artworks/WorkBuddy-Qwen3.8-27B-medium-pelican-riding-bicycle.svg`（日期未记录；effort: medium）
  - qwen-3.8-flash-next + QwenWork-Desktop：`artworks/QwenWork-Desktop-qwen-3.8-flash-next-high-pelican-riding-bicycle.svg`（2026-08-31）
  - Qwen-3.8-Max + QwenWork-Desktop：`artworks/QwenWork-Desktop-Qwen-3.8-Max-high-pelican-riding-bicycle.svg`（2026-08-31）
- **Ant（蚂蚁百灵）**
  - ling-3.0-flash-fin-free + opencode：`artworks/opencode-ling-3.0-flash-fin-free-high-pelican-riding-bicycle.svg`（2026-09-23）
- **Anthropic**
  - Claude-Sonnet-4.6 + Zed：`artworks/Zed-Claude-Sonnet-4.6-high-pelican-riding-bicycle.svg`（2026-10-21）
  - Claude-Sonnet-4.6-Thinking + Antigravity：`artworks/Antigravity-Claude-Sonnet-4.6-Thinking-high-pelican-riding-bicycle.svg`（2026-08-31）
  - Claude-Opus-4.6 + Antigravity：`artworks/Antigravity-Claude-Opus-4.6-high-pelican-riding-bicycle.svg`（2026-09-01）
  - Claude-Sonnet-5 + Zed：`artworks/Zed-Claude-Sonnet-5-high-pelican-riding-bicycle.svg`（2026-10-21）
  - Claude-Haiku-5.5 + Zed：`artworks/Zed-Claude-Haiku-5.5-xhigh-pelican-riding-bicycle.svg`（2026-10-21）
  - Claude-Sonnet-5.5 + Antigravity：`artworks/Antigravity-Claude-Sonnet-5.5-medium-pelican-riding-bicycle.svg`（2026-10-08）
  - Claude-Sonnet-5.5 + Zed：`artworks/Zed-Claude-Sonnet-5.5-high-pelican-riding-bicycle.svg`（2026-10-21）
  - Claude-Opus-5.5 + Antigravity：`artworks/Antigravity-Claude-Opus-5.5-medium-pelican-riding-bicycle.svg`（2026-10-08）
- **ByteDance**
  - Doubao + Doubao-Desktop：`artworks/Doubao-Desktop-Doubao-high-pelican-riding-bicycle.svg`（2026-08-31）
- **DeepSeek**
  - Deepseek-V4-Pro + WorkBuddy：`artworks/WorkBuddy-Deepseek-V4-Pro-high-pelican-riding-bicycle.svg`（2026-08-31）
  - DeepSeek-V4.1-Flash（动态版）+ Codex：`artworks/Codex-DeepSeek-V4.1-Flash-high-animated-pelican-riding-bicycle.svg`（2026-10-21）
  - DeepSeek-V4.1-Flash（动态版）+ WorkBuddy：`artworks/WorkBuddy-DeepSeek-V4.1-Flash-max-animated-pelican-riding-bicycle.svg`（2026-10-21）
  - DeepSeek-V4.1-Flash-1017 + WorkBuddy：`artworks/WorkBuddy-DeepSeek-V4.1-Flash-1017-high-pelican-riding-bicycle.svg`（2026-10-20）
  - DeepSeek-V4.1-Flash-1017（动态版）+ Codex：`artworks/Codex-DeepSeek-V4.1-Flash-1017-high-animated-pelican-riding-bicycle.svg`（2026-10-22）
- **Google**
  - Gemini-3.1-Pro + Antigravity：`artworks/Antigravity-Gemini-3.1-Pro-high-pelican-riding-bicycle.svg`（2026-08-31）
  - Gemini-3.5-Flash + Antigravity：`artworks/Antigravity-Gemini-3.5-Flash-high-pelican-riding-bicycle.svg`（2026-08-31）
  - Gemini-3.6-Flash + Antigravity：`artworks/Antigravity-Gemini-3.6-Flash-high-pelican-riding-bicycle.svg`（2026-08-31）
  - Gemini-3.7-Flash + Antigravity：`artworks/Antigravity-Gemini-3.7-Flash-high-pelican-riding-bicycle.svg`（2026-08-31）
  - Gemini-3.8-Flash + Antigravity：`artworks/Antigravity-Gemini-3.8-Flash-high-pelican-riding-bicycle.svg`（2026-09-03）
  - Gemini-4-Argon + Antigravity：`artworks/Antigravity-Gemini-4-Argon-high-pelican-riding-bicycle.svg`（2026-10-21）
  - Gemini-4-Argon（动态版）+ Antigravity：`artworks/Antigravity-Gemini-4-Argon-high-animated-pelican-riding-bicycle.svg`（2026-10-21）
- **Meta**
  - muse-spark-1.2-contributor-free + opencode：`artworks/opencode-muse-spark-1.2-contributor-free-high-pelican-riding-bicycle.svg`（2026-08-31）
  - muse-spark-1.3-contributor-free + opencode：`artworks/opencode-muse-spark-1.3-contributor-free-high-pelican-riding-bicycle.svg`（2026-09-04）
- **MiniMax**
  - MiniMax-M3 + WorkBuddy：`artworks/WorkBuddy-MiniMax-M3-high-pelican-riding-bicycle.svg`（2026-08-31）
  - MiniMax-M3.1-Flash + MiniMax Code：`artworks/MiniMax-Code-MiniMax-M3.1-Flash-max-pelican-riding-bicycle.svg`（2026-10-21）
- **Moonshot**
  - Kimi-K2.6 + WorkBuddy：`artworks/WorkBuddy-Kimi-K2.6-high-pelican-riding-bicycle.svg`（2026-08-31）
  - Kimi-K2.8-Preview + TraeCode：`artworks/TraeCode-Kimi-K2.8-Preview-max-pelican-riding-bicycle.svg`（2026-10-21）
  - Kimi-K3 + Codex：`artworks/Codex-Kimi-K3-high-pelican-riding-bicycle.svg`（2026-10-22）
  - Kimi-K3 + WorkBuddy：`artworks/WorkBuddy-Kimi-K3-high-pelican-riding-bicycle.svg`（2026-08-31）
  - Kimi-K3（动态版）+ WorkBuddy：`artworks/WorkBuddy-Kimi-K3-high-animated-pelican-riding-bicycle.svg`（2026-09-09）
- **NVIDIA**
  - nemotron-3-ultra-free + opencode：`artworks/opencode-nemotron-3-ultra-free-high-pelican-riding-bicycle.svg`（2026-08-31）
  - nemotron-3.5-lightning + opencode：`artworks/opencode-nemotron-3.5-lightning-high-pelican-riding-bicycle.svg`（2026-08-31）
- **OpenAI (GPT)**
  - GPT-5.2 + Zed：`artworks/Zed-GPT-5.2-none-pelican-riding-bicycle.svg`（2026-10-21）
  - GPT-5.3-Codex + Zed：`artworks/Zed-GPT-5.3-Codex-high-pelican-riding-bicycle.svg`（2026-10-21）
  - GPT-5.4 + Zed：`artworks/Zed-GPT-5.4-high-pelican-riding-bicycle.svg`（2026-10-21）
  - GPT-5.5 + Zed：`artworks/Zed-GPT-5.5-high-pelican-riding-bicycle.svg`（2026-10-21）
  - GPT-5.6-Sol + Codex：`artworks/Codex-GPT-5.6-Sol-high-pelican-riding-bicycle.svg`（2026-10-21）
  - GPT-5.6-Terra + Codex：`artworks/Codex-GPT-5.6-Terra-high-pelican-riding-bicycle.svg`（2026-10-21）
  - GPT-5.6-Luna + Codex：`artworks/Codex-GPT-5.6-Luna-max-pelican-riding-bicycle.svg`（2026-10-21）
  - GPT-6-Sol + Codex：`artworks/codex-gpt-6-sol-high-pelican-riding-bicycle.svg`（2026-10-21）
  - GPT-6-Luna + Codex：`artworks/Codex-GPT-6-Luna-xhigh-pelican-riding-bicycle.svg`（2026-10-21）
  - GPT-6-Astra + Codex：`artworks/codex-gpt-6-astra-low-pelican-riding-bicycle.svg`（2026-09-07）
  - GPT-6-Astra（动态版）+ Codex：`artworks/Codex-GPT-6-Astra-animated-pelican-riding-bicycle.svg`（2026-09-09，effort 未标注）
  - GPT-6.1-Sol + Codex：`artworks/Codex-GPT-6.1-Sol-high-pelican-riding-bicycle.svg`（2026-10-21）
  - GPT-6.1-Sol（动态版）+ Codex：`artworks/Codex-GPT-6.1-Sol-high-animated-pelican-riding-bicycle.svg`（2026-10-21）
  - GPT-6.1-Sol + Zed：`artworks/zed-gpt-6.1-sol-high-pelican-riding-bicycle.svg`（2026-10-21）
- **StepFun（阶跃星辰）**
  - Step-5-Preview（动态版）+ TraeCode：`artworks/TraeCode-Step-5-Preview-high-animated-pelican-riding-bicycle.svg`（2026-10-21）
- **Tencent**
  - Hy3 + WorkBuddy：`artworks/WorkBuddy-Hy3-high-pelican-riding-bicycle.svg`（2026-08-31）
  - Hy4 + WorkBuddy：`artworks/WorkBuddy-Hy4-high-pelican-riding-bicycle.svg`（2026-09-04）
  - Hy4（v2 版）+ WorkBuddy：`artworks/WorkBuddy-Hy4-high-pelican-riding-bicycle-v2.svg`（2026-09-09）
  - Hy4-preview + Codex：`artworks/Codex-Hy4-preview-high-pelican-riding-bicycle.svg`（2026-10-22）
- **Zhipu**
  - GLM-5.2 + TraeCode：`artworks/TraeCode-GLM-5.2-high-pelican-riding-bicycle.svg`（2026-10-21）
  - GLM-5.3-Flash + WorkBuddy：`artworks/WorkBuddy-GLM-5.3-Flash-high-pelican-riding-bicycle.svg`（2026-08-31）
  - GLM-5.3-Flash + Codex：`artworks/Codex-GLM-5.3-Flash-high-pelican-riding-bicycle.svg`（日期未记录；2026-10-21 补登记，effort: high）
  - GLM-5.3 + WorkBuddy：`artworks/WorkBuddy-GLM-5.3-high-pelican-riding-bicycle.svg`（2026-08-31）
  - GLM-5.3 + Codex：`artworks/Codex-GLM-5.3-high-pelican-riding-bicycle.svg`（2026-10-22）
- **小米**
  - mimo-v2.5-free + opencode：`artworks/opencode-mimo-v2.5-free-high-pelican-riding-bicycle.svg`（2026-08-31）
  - mimo-v2.6-flash-free + opencode：`artworks/opencode-mimo-v2.6-flash-free-high-pelican-riding-bicycle.svg`（2026-09-23）
  - MiMo-V2.6-Pro（动态版）+ WorkBuddy：`artworks/WorkBuddy-MiMo-V2.6-Pro-high-animated-pelican-riding-bicycle.svg`（2026-10-21）
- **匿名模型（竞技场盲测）**
  - big-pickle + opencode：`artworks/opencode-big-pickle-high-pelican-riding-bicycle.svg`（2026-08-31）
  - Space-Bunny + WorkBuddy：`artworks/WorkBuddy-Space-Bunny-high-pelican-riding-bicycle.svg`（2026-10-10）
