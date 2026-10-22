# Chemical Process Flow Visualizer (化工工艺流程可视化)

基于 React 19 + @xyflow/react + ELK.js 的现代化化工工艺流程可视化、结构化解析与自动化排版编辑工具。

支持从工艺文本经由大语言模型（LLM）一键抽取为标准 JSON Schema 数据，在浏览器端完成工业设备图符绘制、物料管线连接、ELK 拓扑分层自动布局及交互式编辑导出。

## 核心特性

- **流程文本转结构化数据**：接入 LLM 将工艺描述文本提炼为符合 `process-flow.schema.json`（Draft 2020-12）规范的工艺流程数据。
- **设备图符库与通用兜底**：涵盖反应釜、储罐、离心机、冷凝器、泵等典型化工设备微缩几何图符与端口系统，未知设备自动采用通用图符回退。
- **ELK.js 分层自动排版**：内置 ELK (Eclipse Layout Kernel) 布局引擎，自动规避节点重叠，理顺主流程与支路管线拓扑。
- **交互式流道画布**：基于 `@xyflow/react` 打造，支持缩放拖拽、端口吸附、节点位移自适应连线、功能区域分组（Functional Area Node）。
- **校验与规范化管线**：内置 Ajv Schema 严格校验与图连通性/端口有效性检查，支持位号规范化与默认端口推断。
- **导入与导出**：支持 JSON 流程数据双向导入导出，以及画布一键生成 PNG 高清快照。

## 技术栈

- **前端框架**：React 19 + TypeScript (Strict)
- **构建工具**：Vite
- **画布引擎**：`@xyflow/react`
- **自动布局**：`elkjs`
- **数据校验**：`ajv` (JSON Schema Draft 2020-12)
- **图表导出**：`html-to-image`
- **图标库**：`lucide-react`
- **单测框架**：`vitest`
- **后端服务**：Node.js + `tsx` + OpenAI SDK（用于本地代理与 LLM 流程生成）

## 快速上手

### 1. 安装依赖

```bash
cd projects/chemical-process-flow-visualizer
npm install
```

### 2. 启动开发服务

```bash
npm run dev
```

如需启动集成 LLM 文本解析的完整服务端服务：

```bash
cp .env.example .env
# 配置 .env 中的 OPENAI_API_KEY 与 BASE_URL
npm start
```

### 3. 测试与构建

```bash
# 运行单元测试
npm test

# 生产环境打包
npm run build
```

## 项目文档

- [MVP方案.md](MVP方案.md)：第一版可运行原型的设计与规格闭环
- [最终产品方案.md](最终产品方案.md)：产品功能演进路线与形态
- [最终产品技术方案.md](最终产品技术方案.md)：完整架构设计与技术决策
- [AI生成与导入指南.md](AI生成与导入指南.md)：提示词工程与数据导入规范
- [process-flow.schema.json](process-flow.schema.json)：工艺流程 JSON Schema 规范定义
- [pendimethalin-process.test.json](pendimethalin-process.test.json)：二甲戊灵12步工艺示例流程数据
