# P&ID Bounding Box Viewer

一个轻量级、完全在浏览器本地运行的 P&ID / PFD bounding box 检查工具。导入工程图，再上传或粘贴 normalized bounding box JSON，即可在原图上核对视觉模型的定位结果。

## 当前功能

- PNG、JPG、JPEG、WEBP 图片选择与拖放
- JSON 文件上传、textarea 粘贴和内置示例
- Zod 严格 schema 校验与可定位错误信息
- `<img>` + SVG overlay bbox 与标签渲染
- 对象列表与 bbox 双向选择、自动滚动/定位
- 10%–800% 缩放、滚轮定点缩放、Fit 与 100%
- Space + 左键拖动或中键拖动平移
- equipment type、minimum confidence 与显示选项过滤
- 完整 Reset 与响应式布局
- 所有输入仅在浏览器内存中处理

## 技术栈

- React
- TypeScript（strict mode）
- Vite
- SVG
- Zod
- Tailwind CSS
- Vitest

## 启动

```bash
npm install
npm run dev
```

开发服务器会输出本地访问地址，通常是 `http://localhost:5173`。

## 质量检查与构建

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

生产文件会输出到 `dist/`。

## JSON 格式

```json
{
  "mode": "Level 2",
  "count": 1,
  "objects": [
    {
      "equipment_type": "Pump",
      "tag": "P-101A",
      "bbox": [100, 200, 300, 400],
      "confidence": 0.95
    }
  ]
}
```

- `equipment_type`：非空字符串。
- `tag`：字符串或 `null`。
- `bbox`：恰好四个数字，格式为 `[xmin, ymin, xmax, ymax]`。
- `confidence`：可选，范围为 0–1。
- `count` 与 `objects.length` 不一致时显示 warning，但按 `objects.length` 渲染。

## 坐标规则

bbox 使用 normalized 0–1000 坐标。图片左上角是 `(0, 0)`，右下角是 `(1000, 1000)`：

```text
pixelX = normalizedX / 1000 × imageWidth
pixelY = normalizedY / 1000 × imageHeight
```

## 数据隐私

图片使用 `URL.createObjectURL()` 读取，JSON 使用浏览器 File API 或 textarea 读取。应用不包含上传请求、API 调用、analytics 或 telemetry；页面刷新后状态会丢失。

## 项目文档

- [开发计划](docs/DEVELOPMENT_PLAN.md)
- [架构说明](docs/ARCHITECTURE.md)
- [产品路线图](docs/ROADMAP.md)
