# AI 生成与导入指南

本应用面向任意由“物料来源—工艺设备—物料去向”构成的轻量工艺流程，不限定具体产品。它不生成 P&ID、仪表联锁、管径或施工设计。

## 最简单的操作方式

1. 点击顶部“AI 生成”。
2. 粘贴工艺描述。尽量写明物料名称、设备名称或位号、流向、分支、回收和最终去向。
3. 直接使用应用服务端配置，或展开“自定义服务商”，填写 OpenAI 兼容接口。
4. 点击“生成流程图”。应用会自动执行 Schema 校验、跨引用检查和 ELK 布局。
5. 生成后先查看功能区总览；点击粗虚线功能区钻取设备、物料和连接。

也可以让外部模型生成 JSON，再从“数据”面板导入。外部生成的 JSON 必须通过项目根目录的 `process-flow.schema.json`。

## 推荐提示词

将下面提示词作为 system/developer prompt，把实际工艺说明作为最后的用户输入。若 API 支持 Structured Outputs，应把 Schema 作为 API 的 `json_schema` 响应格式传入，不要只靠提示词描述格式。

```text
你是一名工艺流程信息抽取助手。把用户提供的自然语言工艺说明转换为 ProcessFlowDocument 1.0 JSON。

成功标准：
- 只提取原文明确出现的物料来源、设备、去向与连接，不进行工程设计推断。
- 有位号时原样保留；没有位号时 tag 为 null，绝不虚构位号。
- 每条管线必须引用已存在节点的已存在端口，不能产生悬空连接。
- 根据工艺目的划分少量、连续、可讲解的 functionalAreas，例如原料配制、反应、分离、净化、回收、成型、包装。
- 禁止按坐标、节点数量或固定长度机械分区。
- 每个节点必须且只能属于一个 functionalArea；功能区按主流程先后排序。
- 不输出阀门、仪表、联锁、管径、SVG、HTML 或安全设计。
- 只返回符合给定 JSON Schema 的 JSON，不返回 Markdown 或解释文字。

工艺描述：
{{在这里粘贴工艺描述}}
```

## JSON 的关键结构

完整约束见 [`process-flow.schema.json`](./process-flow.schema.json)。用于导入的最小结构如下：

```json
{
  "schemaVersion": "1.0",
  "title": "某产品工艺流程",
  "description": "根据用户原始描述整理。",
  "functionalAreas": [
    {
      "id": "area_reaction",
      "name": "进料与反应",
      "description": "原料计量后进入反应设备完成主要反应。",
      "nodeIds": ["src_feed", "eq_R101"]
    },
    {
      "id": "area_separation",
      "name": "分离与收集",
      "description": "反应物经分离后分别进入产品和母液去向。",
      "nodeIds": ["eq_M102", "sink_product", "sink_mother_liquor"]
    }
  ],
  "nodes": [
    {
      "id": "src_feed",
      "kind": "source",
      "tag": null,
      "name": "原料",
      "equipmentType": null,
      "shapeKey": "boundary.source",
      "quantity": 1,
      "ports": [{ "id": "out-1", "direction": "out", "role": "material" }],
      "attributes": {}
    },
    {
      "id": "eq_R101",
      "kind": "equipment",
      "tag": "R101",
      "name": "反应釜",
      "equipmentType": "搅拌反应釜",
      "shapeKey": "vessel.stirred",
      "quantity": 1,
      "ports": [
        { "id": "in-1", "direction": "in", "role": "material" },
        { "id": "out-1", "direction": "out", "role": "material" }
      ],
      "attributes": {}
    }
  ],
  "edges": [
    {
      "id": "flow_001",
      "source": { "nodeId": "src_feed", "portId": "out-1" },
      "target": { "nodeId": "eq_R101", "portId": "in-1" },
      "label": "原料",
      "streamType": "feed",
      "material": { "name": "原料", "phase": "liquid", "components": [] },
      "attributes": {}
    }
  ],
  "layout": {
    "mode": "auto",
    "algorithm": "layered",
    "direction": "RIGHT",
    "nodes": {},
    "edges": {}
  },
  "settings": {
    "defaultRouting": "orthogonal",
    "nodeSpacing": 80,
    "layerSpacing": 160,
    "preventNodeOverlap": true
  }
}
```

导入时 `layout.nodes` 和 `layout.edges` 可以为空，应用会自动运行 ELK。`functionalAreas[].nodeIds` 必须引用现有节点；同一节点不能重复归入多个功能区。

## 工艺描述写法建议

推荐写成连续步骤，例如：

```text
1. 原料 A 与溶剂由计量罐送入 R101，在 80℃ 下反应。
2. R101 反应液送入 M102 固液分离；滤饼进入产品干燥，母液进入溶剂回收。
3. 回收溶剂返回前端溶剂罐，不合格物料送处置系统。
```

温度、压力等信息会保留在 `attributes` 时才有意义，但本应用当前主要显示设备、物料、连接和功能区，不将这些数据扩展为成熟工业设计系统。
