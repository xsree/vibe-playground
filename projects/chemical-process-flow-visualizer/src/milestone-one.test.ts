import processData from '../pendimethalin-process.test.json';
import { describe, expect, it } from 'vitest';
import { toFlowEdges, toFlowNodes } from './editor/flowAdapter';
import { findNodeOverlaps, layoutProcessFlowDocument } from './layout/elkLayout';
import { checkGraph } from './model/graphChecks';
import type { ProcessFlowDocument } from './model/types';
import { validateProcessFlow } from './schema/validate';

describe('MVP 里程碑一', () => {
  it('测试 JSON 通过 Draft 2020-12 Schema 与跨引用检查', () => {
    const result = validateProcessFlow(processData);
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(checkGraph(result.document)).toEqual([]);
  });

  it('完整加载 52 个节点和 57 条管线，并绑定原始端口', () => {
    const document = processData as ProcessFlowDocument;
    const edges = toFlowEdges(document);
    expect(document.nodes).toHaveLength(52);
    expect(edges).toHaveLength(57);
    expect(edges[0]).toMatchObject({
      source: 'src_concentrated_nitric_acid',
      sourceHandle: 'out-1',
      target: 'eq_R1008',
      targetHandle: 'in-concentrated',
      type: 'smoothstep',
    });
  });

  it('ELK layered 布局覆盖所有节点且没有矩形重叠', async () => {
    const document = processData as ProcessFlowDocument;
    const laidOutDocument = await layoutProcessFlowDocument(document);
    const layout = laidOutDocument.layout.nodes;
    const nodes = toFlowNodes(laidOutDocument, layout);
    expect(Object.keys(layout)).toHaveLength(52);
    expect(Object.keys(laidOutDocument.layout.edges)).toHaveLength(57);
    expect(laidOutDocument.layout.edges.flow_001.routing).toBe('orthogonal');
    expect(nodes).toHaveLength(52);
    expect(findNodeOverlaps(layout)).toEqual([]);
    expect(layout.src_concentrated_nitric_acid.x).toBeLessThan(layout.sink_finished_goods_warehouse.x);
  });
});
