# 开发计划

## Product Goal

构建一个完全在浏览器本地运行的 P&ID / PFD 检查工具。用户导入工程图与符合约定的 bounding box JSON 后，可在原图上核对模型定位结果，无需后端、账户或网络上传。

## MVP Scope

- [x] Image upload（文件选择与拖放）
- [x] JSON upload
- [x] JSON paste
- [x] Schema validation
- [x] SVG bbox rendering
- [x] Object list
- [x] Selection
- [x] Zoom
- [x] Pan
- [x] Fit
- [x] Equipment filters
- [x] Confidence filter
- [x] Reset

## Non-goals

- AI / VLM / LLM 接入
- Backend
- Authentication
- Database
- Cloud storage
- Benchmark system
- Dataset management
- 手工标注或 bbox 编辑

## Development Phases

### Phase 1 — Project foundation

- [x] 初始化 React、TypeScript、Vite、Tailwind CSS 与 Vitest
- [x] 建立项目计划、路线图与架构文档
- [x] 建立严格 TypeScript、lint 与测试配置

### Phase 2 — Image + JSON ingestion

- [x] 实现浏览器本地图片导入与尺寸读取
- [x] 实现 JSON 文件导入、粘贴与示例填充
- [x] 使用 Zod 进行严格校验并保留上一次有效结果

### Phase 3 — BBox rendering

- [x] 建立 normalized 0–1000 坐标工具
- [x] 建立确定性设备类型配色
- [x] 使用 `<img>` 与 SVG overlay 渲染 bbox 和标签

### Phase 4 — Viewer interaction

- [x] 实现 Fit、100%、10%–800% 缩放
- [x] 实现鼠标滚轮定点缩放
- [x] 实现 Space + 左键拖动与中键拖动平移

### Phase 5 — Filtering and object inspection

- [x] 实现设备类型与置信度过滤
- [x] 实现对象列表与 bbox 双向选择、滚动定位
- [x] 实现显示设置与完整 Reset

### Phase 6 — Validation, tests and polish

- [x] 覆盖 bbox、schema、JSON 与过滤纯逻辑测试
- [x] 完成响应式布局、空状态与基础无障碍
- [x] 完成 lint、类型检查、测试、构建和浏览器 QA

## 验证记录

- `npm run lint`：通过。
- `npm run typecheck`：通过。
- `npm test`：4 个测试文件、21 个测试通过。
- `npm run build`：通过，Vite production bundle 已生成。
- 浏览器 QA：桌面三栏和窄屏纵向布局通过；3840 × 2400 图片导入、Fit、SVG overlay、选择、类型筛选、非法 JSON 保留旧结果与 Reset 均通过；应用 QA 端口无 console error。

## 当前技术决策

- 使用 SVG 而不是 Canvas，使原图像素坐标可直接作为 `viewBox`，并保留 DOM 级选择和无障碍能力。
- 使用原生 CSS 配合 Tailwind CSS 入口层；界面为高度定制的工程工作台，不引入大型 UI 框架。
- Viewer 只消费图片状态和统一 `DetectionResult`，不会知道任何未来 AI Provider。
