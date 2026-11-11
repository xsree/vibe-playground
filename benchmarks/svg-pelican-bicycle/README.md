类型: spec-driven

# 鹈鹕骑自行车 (svg-pelican-bicycle)

## 提示词
见 [prompt.md](prompt.md)（包含测试提示词与测试规范说明，被测 agent 会按其中流程更新 `gallery-data.js` 与本文档的「已有结果」记录）。

## 想测什么
纯手写 SVG 的造型能力：能否让鹈鹕与自行车两个主体比例合理、语义清晰。

## 答卷
- 画廊：[index.html](index.html)（数据来自 [gallery-data.js](gallery-data.js)，已登记 75 条，记录见下方 [已有结果](#已有结果)）。
- `vendor` 统一填英文厂商名称（如 Alibaba、Ant、ByteDance、Xiaomi），`model` 保留模型名。前端直接从 `gallery-data.js` 的 `vendor` 字段生成厂商列表、模型分组和筛选，不维护内置厂商名单；新增或更名需同步更新数据与记录文档。
- 默认采用连续排列的画廊，桌面标准尺寸每行 5 幅，提供大图、标准、紧凑三种尺寸；可按厂商、模型或平台分组。筛选栏滚动时吸顶，视图、尺寸和分组偏好保存在浏览器本地。
- 每幅作品可加入对比，最多同时选择 4 幅；筛选和切换视图时保留已选作品。选择 2–4 幅后打开对比台，可固定一幅作为参照，通过下拉列表或“下一幅”替换其他作品，并切换浅灰、深灰、棋盘格底色。手机采用纵向排列，SVG 均完整展示、保持原始比例。
- 矩阵作为辅助视图，只显示当前结果中有作品的平台列；可勾选“仅看跨平台模型”，按当前筛选范围保留在多个平台有作品的模型。重置会同时取消该条件。画廊、矩阵和对比逻辑位于 [gallery-view.js](gallery-view.js)，筛选控制器与数据更新位于 [gallery.js](gallery.js)。
- 直接打开 HTML 即可使用：筛选条件保存在浏览器本地；页面可见时每 3 秒检查一次 `gallery-data.js`，数据变化后自动更新画廊并保留仍有效的筛选。后台页面暂停检查，切回后立即检查。新增 SVG 仍需登记到数据文件；仅修改 SVG 内容不会触发数据更新。
- 页头日月按钮可切换明暗主题，首次打开跟随系统，手动选择后自动记忆。深色采用中性石墨灰，以淡紫色标识选中状态；切换使用配色渐变与日月图标动画，并尊重系统的减少动态效果设置。
- SVG 产物统一存放在 [artworks/](artworks/) 子目录，页面、脚本、样式与文档保留在当前目录。`gallery-data.js` 的 `file` 字段填写相对于画廊页面的路径，例如 `artworks/文件名.svg`。
- 答卷文件命名沿用提示词内定义的 `{harness}-{model}-{effort}[-animated]-pelican-riding-bicycle.svg`，不要改名，画廊依赖它。


### 已有结果

排序规则：先按**模型厂商**分组（统一使用英文厂商名，按 A→Z 排列），分组内按**版本号升序**，同版本按**轻量款 → 旗舰款**排列。画廊已登记共 **75** 条。

- **Alibaba**
  - Qwen3.8-27B + WorkBuddy：`artworks/WorkBuddy-Qwen3.8-27B-medium-pelican-riding-bicycle.svg`（日期未记录；effort: medium）
  - qwen-3.8-flash-next + 千问办公：`artworks/QwenWork-Desktop-qwen-3.8-flash-next-high-pelican-riding-bicycle.svg`（2026-08-31）
  - Qwen-3.8-Max + 千问办公：`artworks/QwenWork-Desktop-Qwen-3.8-Max-high-pelican-riding-bicycle.svg`（2026-08-31）
- **Ant**
  - ling-3.0-flash-fin-free + OpenCode：`artworks/opencode-ling-3.0-flash-fin-free-high-pelican-riding-bicycle.svg`（2026-09-23）
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
  - 豆包 2.1 Pro + 豆包工作：`artworks/Doubao-Desktop-Doubao-2.1-Pro-high-pelican-riding-bicycle.svg`（2026-08-31）
  - Seed-2.1-Pro-0915 + Trae：`artworks/Trae-Seed-2.1-Pro-0915-high-pelican-riding-bicycle.svg`（2026-10-22）
  - Seed-2.1-Pro-0915（动态版）+ Trae：`artworks/Trae-Seed-2.1-Pro-0915-high-animated-pelican-riding-bicycle.svg`（2026-10-22）
  - Seed-Evolving-20261022 + Trae：`artworks/Trae-Seed-Evolving-20261022-none-pelican-riding-bicycle.svg`（2026-10-22）
  - Seed-Code + Trae：`artworks/Trae-Seed-Code-high-pelican-riding-bicycle.svg`（2026-10-22）
- **DeepSeek**
  - Deepseek-V4-Pro + WorkBuddy：`artworks/WorkBuddy-Deepseek-V4-Pro-high-pelican-riding-bicycle.svg`（2026-08-31）
  - DeepSeek-V4.1-Flash（动态版）+ Codex：`artworks/Codex-DeepSeek-V4.1-Flash-high-animated-pelican-riding-bicycle.svg`（2026-10-21）
  - DeepSeek-V4.1-Flash（动态版）+ WorkBuddy：`artworks/WorkBuddy-DeepSeek-V4.1-Flash-max-animated-pelican-riding-bicycle.svg`（2026-10-21）
  - DeepSeek-V4.1-Flash-1017-Free（动态版）+ OpenCode：`artworks/opencode-DeepSeek-V4.1-Flash-1017-Free-xhigh-animated-pelican-riding-bicycle.svg`（2026-10-22）
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
  - Gemini-4-Carbon + Antigravity：`artworks/Antigravity-Gemini-4-Carbon-medium-pelican-riding-bicycle.svg`（2026-11-11）
  - Gemini-4-Carbon（动态版）+ Antigravity：`artworks/Antigravity-Gemini-4-Carbon-medium-animated-pelican-riding-bicycle.svg`（2026-11-11）
- **Meta**
  - muse-spark-1.2-contributor-free + OpenCode：`artworks/opencode-muse-spark-1.2-contributor-free-high-pelican-riding-bicycle.svg`（2026-08-31）
  - muse-spark-1.3-contributor-free + OpenCode：`artworks/opencode-muse-spark-1.3-contributor-free-high-pelican-riding-bicycle.svg`（2026-09-04）
- **MiniMax**
  - MiniMax-M3 + WorkBuddy：`artworks/WorkBuddy-MiniMax-M3-high-pelican-riding-bicycle.svg`（2026-08-31）
  - minimax-m3.1-flash-free（动态版）+ OpenCode：`artworks/opencode-minimax-m3.1-flash-free-xhigh-animated-pelican-riding-bicycle.svg`（2026-10-22）
  - MiniMax-M3.1-Flash + MiniMax Code：`artworks/MiniMax-Code-MiniMax-M3.1-Flash-max-pelican-riding-bicycle.svg`（2026-10-21）

- **Moonshot**
  - Kimi-K2.6 + WorkBuddy：`artworks/WorkBuddy-Kimi-K2.6-high-pelican-riding-bicycle.svg`（2026-08-31）
  - Kimi-K2.8-Preview + Trae：`artworks/Trae-Kimi-K2.8-Preview-max-pelican-riding-bicycle.svg`（2026-10-21）
  - Kimi-K3 + Codex：`artworks/Codex-Kimi-K3-high-pelican-riding-bicycle.svg`（2026-10-22）
  - Kimi-K3 + WorkBuddy：`artworks/WorkBuddy-Kimi-K3-high-pelican-riding-bicycle.svg`（2026-08-31）
  - Kimi-K3（动态版）+ WorkBuddy：`artworks/WorkBuddy-Kimi-K3-high-animated-pelican-riding-bicycle.svg`（2026-09-09）
- **NVIDIA**
  - nemotron-3-ultra-free + OpenCode：`artworks/opencode-nemotron-3-ultra-free-high-pelican-riding-bicycle.svg`（2026-08-31）
  - nemotron-3.5-lightning + OpenCode：`artworks/opencode-nemotron-3.5-lightning-high-pelican-riding-bicycle.svg`（2026-08-31）
  - nemotron-3.5-super-vl-free + OpenCode：`artworks/opencode-nemotron-3.5-super-vl-free-xhigh-pelican-riding-bicycle.svg`（2026-10-22）
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
  - GPT-6.1-Terra + Codex：`artworks/codex-gpt-6.1-terra-high-pelican-riding-bicycle.svg`（2026-10-27）
  - GPT-6.1-Terra + Codex：`artworks/codex-gpt-6.1-terra-max-pelican-riding-bicycle.svg`（2026-10-27；effort: max）
- **StepFun**
  - Step-5-Preview（动态版）+ Trae：`artworks/Trae-Step-5-Preview-high-animated-pelican-riding-bicycle.svg`（2026-10-21）
- **Tencent**
  - Hy3 + WorkBuddy：`artworks/WorkBuddy-Hy3-high-pelican-riding-bicycle.svg`（2026-08-31）
  - Hy4 + WorkBuddy：`artworks/WorkBuddy-Hy4-high-pelican-riding-bicycle.svg`（2026-09-04）
  - Hy4（v2 版）+ WorkBuddy：`artworks/WorkBuddy-Hy4-high-pelican-riding-bicycle-v2.svg`（2026-09-09）
  - Hy4-preview + Codex：`artworks/Codex-Hy4-preview-high-pelican-riding-bicycle.svg`（2026-10-22）
- **Xiaomi**
  - mimo-v2.5-free + OpenCode：`artworks/opencode-mimo-v2.5-free-high-pelican-riding-bicycle.svg`（2026-08-31）
  - mimo-v2.6-flash-free + OpenCode：`artworks/opencode-mimo-v2.6-flash-free-high-pelican-riding-bicycle.svg`（2026-09-23）
  - MiMo-V2.6-Pro（动态版）+ WorkBuddy：`artworks/WorkBuddy-MiMo-V2.6-Pro-high-animated-pelican-riding-bicycle.svg`（2026-10-21）
- **Zhipu**
  - GLM-5.2 + Trae：`artworks/Trae-GLM-5.2-high-pelican-riding-bicycle.svg`（2026-10-21）
  - GLM-5.3-Flash + WorkBuddy：`artworks/WorkBuddy-GLM-5.3-Flash-high-pelican-riding-bicycle.svg`（2026-08-31）
  - GLM-5.3-Flash + Codex：`artworks/Codex-GLM-5.3-Flash-high-pelican-riding-bicycle.svg`（日期未记录；2026-10-21 补登记，effort: high）
  - GLM-5.3-FlashX + Trae：`artworks/Trae-GLM-5.3-FlashX-xhigh-pelican-riding-bicycle.svg`（2026-10-22）
  - GLM-5.3 + WorkBuddy：`artworks/WorkBuddy-GLM-5.3-high-pelican-riding-bicycle.svg`（2026-08-31）
  - GLM-5.3 + Codex：`artworks/Codex-GLM-5.3-high-pelican-riding-bicycle.svg`（2026-10-22）
