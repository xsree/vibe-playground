# 架构说明

## Current Architecture

```text
Browser

Image Input
      │
      ▼
Image State

JSON Input
      │
      ▼
Zod Validation
      │
      ▼
DetectionResult
      │
      ▼
ImageViewer
      │
      ├── Image
      └── SVG Overlay
```

应用为纯静态 SPA。图片通过 `URL.createObjectURL()` 在浏览器内读取，JSON 通过 File API 或 textarea 进入同一套校验流程。不存在上传、分析、遥测或其他网络请求。

## Coordinate System

输入 bbox 统一为 `[xmin, ymin, xmax, ymax]`，坐标范围是 normalized 0–1000，左上角为 `(0, 0)`，右下角为 `(1000, 1000)`。

转换公式：

```text
pixelX = normalizedX / 1000 × imageWidth
pixelY = normalizedY / 1000 × imageHeight
```

转换集中在 `src/utils/bbox.ts`。SVG 使用原图像素尺寸作为 `viewBox`，图片与 overlay 共享缩放和平移变换。

## State

- `App`：图片、最后一次有效 DetectionResult、内部对象 ID、JSON 草稿、错误/警告、显示选项和过滤器。
- `ImageViewer`：zoom、pan、Fit 计算、拖动状态和空间键状态。
- `Filters`：无独立数据副本，只接收 App 中的筛选状态并发出变更事件。

JSON 校验失败时仅更新错误，不清空最后一次有效结果。过滤始终派生自原始对象，不修改输入数据。

## Data Model

```text
BBox = [number, number, number, number]

DetectionObject
├── equipment_type: string
├── tag: string | null
├── bbox: BBox
└── confidence?: number

DetectionResult
├── mode?: string
├── count: number
└── objects: DetectionObject[]
```

加载成功后另建带 `id` 的 UI 对象，ID 不写回原 JSON。

## Rendering

使用 `<img>` + `<svg>`，不使用 Canvas。SVG 可让矩形、标签和点击区域保持独立 DOM 元素，天然适合精确坐标、选择反馈、矢量缩放与事件处理，也避免引入 Fabric.js / Konva 等大型依赖。

## Dependencies

- React / React DOM：UI 与状态管理。
- Zod：运行时 schema 校验与可定位错误信息。
- Tailwind CSS：轻量 utility 构建链；定制工程界面仍以项目 CSS 变量和语义 class 为主。
- Vitest：纯逻辑单元测试。
- ESLint：静态质量检查。

不使用 Redux、MobX、大型 UI framework 或 Canvas drawing library。

## Future AI Boundary

```text
Image + Prompt
       ↓
AI Provider
       ↓
Provider-specific response
       ↓
Adapter
       ↓
DetectionResult
       ↓
Existing Viewer
```

未来可以实现 `OpenAICompatibleProvider`、`QwenProvider`、`GeminiProvider`、`OllamaProvider` 或 `CustomProvider`，但 Provider 结果必须先由 Adapter 转为统一 `DetectionResult`。当前 Viewer 不包含模型、Prompt、API Key 或 Provider 概念，本版本也不创建假 Provider。

## Future Backend

当前不存在 backend。只有在需要多用户协作、保存项目、批量 benchmark、API key proxy 或 dataset management 时才考虑引入后端；这些能力均不在 MVP 范围内。
