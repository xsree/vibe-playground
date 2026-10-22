# 工艺流程可视化应用 MVP 方案

## 1. 文档目的

本文档用于指导第一版可运行原型的开发。新对话或新开发人员只需读取本文档，以及当前目录中的以下文件，即可开始实施：

- `process-flow.schema.json`：工艺流程数据格式。
- `pendimethalin-process.test.json`：二甲戊灵12步流程测试数据。

MVP 的核心任务不是建设成熟工业软件，而是验证以下闭环是否成立：

> 工艺流程描述文本 → 结构化 JSON → 带设备大致外形的连接图 → 人工编辑 → 保存与导出

## 2. 产品目标

用户粘贴一段工艺流程描述，系统调用 LLM 生成符合 JSON Schema 的结构化数据，再自动绘制设备和物料管线。用户可以移动、添加、删除设备，也可以新增、删除或重新连接管线。

MVP 必须验证三个核心能力：

1. 不同设备能显示大致形状，未知设备能使用通用形状兜底。
2. 自动布局后设备之间不重叠，主流程和支路基本可读。
3. 用户移动设备时，管线始终连接在设备端口上，不会断开。

## 3. MVP 范围

### 3.1 必须实现

#### 文本生成

- 提供工艺流程文本输入区。
- 调用 LLM 生成符合 `process-flow.schema.json` 的 JSON。
- 使用 Ajv 按 Draft 2020-12 校验 JSON。
- 显示校验错误，允许用户重新生成或手工修改 JSON。
- 支持直接导入已有 JSON，便于脱离 LLM 调试画布。

#### 数据规范化

- 节点没有位号时生成随机内部 ID。
- 节点有位号时优先生成易读 ID，例如 `eq_R1008`。
- 缺少端口时自动补充默认输入端口和输出端口。
- 无效或未知 `shapeKey` 回退为 `generic.process`。
- 检查节点 ID、管线 ID 和同一节点内端口 ID 是否重复。
- 检查所有管线引用的节点和端口是否存在。
- 检查源端口不能是纯输入端口，目标端口不能是纯输出端口。

#### 设备形状

第一版实现以下基础形状：

| `shapeKey` | 用途 |
|---|---|
| `boundary.source` | 原料或辅助物料来源 |
| `boundary.sink` | 废水、尾气、母液等去向 |
| `generic.process` | 未识别或未明确设备 |
| `vessel.stirred` | 搅拌釜、反应釜、水洗釜、中和釜 |
| `vessel.heated` | 热储釜、加热釜 |
| `vessel.vacuum` | 真空脱溶釜 |
| `tank.vertical` | 立式储罐、接收罐 |
| `reactor.tubular` | 管式反应器 |
| `separator.phase` | 油水或液液分离器 |
| `separator.settling` | 沉降分层设备 |
| `separator.solid-liquid` | 压滤机或离心机的通用固液分离形状 |
| `heat-exchanger.condenser` | 冷凝器 |
| `machine.metering` | 计量输送设备 |
| `machine.transfer` | 转料设备 |
| `conveyor.chain` | 管链机 |
| `machine.slicer` | 切片机 |
| `hopper` | 料仓 |
| `collector.dust` | 除尘设备 |
| `line.packaging` | 包装线 |
| `warehouse` | 成品库 |

暂未实现的形状键统一使用 `generic.process`，不能导致页面报错。

#### 自动布局

- 使用 ELK.js 的 layered 布局。
- 默认方向为从左向右。
- 布局前将每种设备的真实宽高传给 ELK。
- 设备之间不得重叠。
- 默认采用正交折线管线。
- 主物料流程尽量保持在中间区域。
- 原料入口尽量排列在左侧。
- 废水、尾气、回收和粉尘等支路尽量放在主流程上方或下方。
- 提供“重新布局”按钮。
- 自动布局结果写入 `layout.nodes` 和 `layout.edges`。

#### 可编辑画布

- 支持画布缩放、平移和适应视图。
- 支持拖动设备。
- 支持选择一个或多个设备。
- 支持新增设备。
- 支持删除设备；删除前提示其关联管线也会删除。
- 支持修改设备名称、位号、设备类型和形状。
- 支持新增、删除和重新连接管线。
- 管线端点必须绑定节点端口，设备移动后管线仍然连接。
- 管线支持 `straight` 和 `orthogonal` 两种显示方式。
- 支持撤销和重做。

#### 保存与导出

- 将当前节点、管线和布局保存为 JSON 文件。
- 能重新导入保存后的 JSON 并恢复布局。
- 导出完整画布为 PNG。
- 第一版可以暂不实现 SVG 和 PDF。

### 3.2 MVP 不做

- 不制作完整 P&ID。
- 不处理阀门、仪表、联锁和控制回路。
- 不做多人协作。
- 不做版本和审计系统。
- 不做设备参数数据库。
- 不做复杂权限体系。
- 不做 Visio、CAD 等专业工程格式兼容。
- 不保证 LLM 生成结果可直接用于施工或安全设计。

## 4. 目标用户流程

1. 用户打开应用。
2. 粘贴工艺流程描述。
3. 点击“生成流程图”。
4. 系统调用 LLM，并显示生成进度。
5. 系统校验和规范化 JSON。
6. 如果数据存在错误，显示具体错误并允许重新生成。
7. 校验通过后，系统自动选择设备形状并执行无重叠布局。
8. 画布显示设备、标签、端口和物料管线。
9. 用户调整设备位置、形状或连接关系。
10. 用户保存 JSON 或导出 PNG。

## 5. 页面结构

MVP 只需要一个主页面：

```text
┌──────────────────────────────────────────────────────────────┐
│ 顶部工具栏：生成、导入、保存、重新布局、撤销、重做、导出   │
├───────────────┬──────────────────────────────────┬───────────┤
│ 文本/JSON区   │                                  │ 属性面板  │
│               │          可编辑流程画布          │           │
│ 工艺描述      │                                  │ 设备信息  │
│ 结构化JSON    │                                  │ 管线信息  │
├───────────────┴──────────────────────────────────┴───────────┤
│ 状态栏：校验状态、节点数量、管线数量                         │
└──────────────────────────────────────────────────────────────┘
```

窄屏下，文本区和属性面板可以改成抽屉，不要求移动端完成复杂编辑。

## 6. 推荐技术栈

- React
- TypeScript
- Vite
- React Flow / `@xyflow/react`
- ELK.js
- Ajv 2020
- Zustand
- Zundo 或等价撤销重做方案
- `html-to-image` 或等价 PNG 导出方案
- Vitest
- Playwright

LLM API 应通过服务端代理调用，不能把密钥直接写入浏览器代码。开发初期可以使用本地 mock JSON 跳过 LLM，优先完成画布。

## 7. 模块划分

```text
src/
  app/
    App.tsx
  schema/
    process-flow.schema.json
    validateProcessFlow.ts
  model/
    types.ts
    normalizeProcessFlow.ts
    graphChecks.ts
  shapes/
    registry.ts
    GenericProcessShape.tsx
    StirredVesselShape.tsx
    VerticalTankShape.tsx
    ...
  layout/
    elkLayout.ts
    collision.ts
  editor/
    ProcessCanvas.tsx
    ProcessNode.tsx
    ProcessEdge.tsx
    PropertyPanel.tsx
  llm/
    generateProcessFlow.ts
    prompt.ts
  export/
    saveJson.ts
    exportPng.ts
  store/
    editorStore.ts
```

## 8. 开发顺序

### 阶段一：只渲染测试 JSON

- 创建 React + TypeScript 项目。
- 接入 React Flow。
- 加载 `pendimethalin-process.test.json`。
- 用通用节点显示52个节点和57条管线。
- 完成 ELK 自动布局。
- 验证设备无重叠、主流程可读、管线跟随节点移动。

### 阶段二：设备形状和编辑

- 建立形状注册表。
- 实现基础 SVG 设备形状。
- 增加设备属性编辑。
- 增加设备和管线的添加、删除与重连。
- 增加撤销和重做。

### 阶段三：数据和保存

- 接入 Ajv。
- 增加 JSON 导入、校验、规范化和保存。
- 保存并恢复布局。
- 增加 PNG 导出。

### 阶段四：LLM 生成

- 设计结构化输出提示词。
- 通过服务端调用 LLM。
- 对 LLM 输出进行 JSON Schema 校验和自动修复重试。
- 将文本生成结果接入已有画布。

## 9. MVP 验收标准

使用 `pendimethalin-process.test.json` 验收：

- 52个节点和57条管线全部成功加载。
- 每个节点均有可见名称。
- 已支持的设备显示对应形状，未知形状使用通用形状。
- 初始自动布局中不存在节点重叠。
- 主流程可从原料入口追踪到成品库。
- 支路不会变成悬空管线。
- 移动任意设备后，关联管线不脱离端口。
- 可以增加和删除设备。
- 可以增加、删除和重新连接管线。
- 可以切换直线和正交折线。
- 保存后重新加载，节点位置和管线路由能够恢复。
- 可以导出包含完整流程图的 PNG。
- 非法 JSON 或非法节点引用会显示明确错误，不能静默失败。

## 10. 关键实现约束

- LLM 不生成节点坐标，不生成 SVG、HTML 或 React 代码。
- `equipmentType` 是开放字符串，不能设计成设备全集枚举。
- `shapeKey` 通过形状注册表解释，未知键必须安全回退。
- 内部 `id` 是连接依据，不能使用设备显示名称连接管线。
- 管线保存的是 `nodeId + portId`，不能只保存绝对坐标。
- 自动布局必须使用节点真实尺寸，否则仍可能出现视觉重叠。
- 用户手动移动后的坐标优先于自动布局，只有点击“重新布局”时才整体重排。

## 11. 新对话启动提示词

在新的 Codex 对话中，可使用下面的提示词开始实施：

> 请读取当前目录中的 `MVP方案.md`、`process-flow.schema.json` 和 `pendimethalin-process.test.json`，按照 MVP 方案开始制作应用。先检查当前目录和项目状态，然后优先完成“加载测试 JSON → ELK 自动布局 → React Flow 渲染设备和粘连管线”的第一个可运行版本。不要扩展到 P&ID、版本审计或多人协作。实施后运行测试并展示结果。
