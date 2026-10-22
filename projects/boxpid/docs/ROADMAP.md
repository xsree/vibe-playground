# 产品路线图

> ROADMAP 仅表示可能的产品方向，不代表相关功能已经实现或承诺交付。

## V1 — Current MVP

导入单张 P&ID / PFD 图片与 normalized 0–1000 bbox JSON，在本地完成校验、SVG 叠加、筛选和对象检查。

## V1.1 — Inspector Improvements

- bbox 手动编辑、拖动与缩放
- 键盘对象导航与标签搜索
- bbox 复制与坐标检查器
- 全屏 Viewer 与暗色模式
- 仅保存在本机的最近文件入口

## V1.2 — Annotation

- 创建、编辑和删除 bbox
- 修改 equipment type 与 tag
- 导出修正后的 JSON

## V2 — AI Provider Integration

提供 API Base URL、API Key、Model、System Prompt 与 User Prompt 配置，支持 OpenAI-compatible API、Qwen、Gemini、Ollama 和 Custom API。

流程：Upload image → Run model → Parse bbox JSON → Display results。

## V2.1 — Prompt Management

- System Prompt presets
- Level 1 / Level 2 / Level 3
- Custom Prompt
- Prompt history

## V2.2 — Model Comparison

同一图片并列检查 Qwen、Gemini、GPT 等模型的 bbox 结果。

## V3 — Ground Truth

- Manual GT annotation
- Prediction vs GT
- 不同 bbox 颜色
- IoU、TP、FP、FN

## V3.1 — Benchmark Metrics

- IoU、Precision、Recall、F1、mAP
- Center Distance
- Per equipment category metrics

## V4 — Dataset / Benchmark Workspace

- 多图片、Dataset 与 Projects
- Batch model inference
- Result persistence
- Export report
- Benchmark history

