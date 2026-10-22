import { describe, expect, it } from 'vitest';
import processData from '../pendimethalin-process.test.json';
import { prepareProcessFlowJson, serializeProcessFlow } from './import-export/json';
import { layoutProcessFlowDocument } from './layout/elkLayout';
import type { ProcessFlowDocument } from './model/types';

describe('MVP 里程碑三', () => {
  it('规范化缺少端口、布局和未知形状的 JSON', () => {
    const result = prepareProcessFlowJson(JSON.stringify({
      title: '规范化测试',
      nodes: [
        {
          id: 'EquipmentA',
          kind: 'equipment',
          name: ' 测试设备 ',
          shapeKey: 'unknown.shape',
        },
      ],
      edges: [],
    }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.nodes[0]).toMatchObject({
      name: '测试设备',
      shapeKey: 'generic.process',
      ports: [
        { id: 'in-1', direction: 'in' },
        { id: 'out-1', direction: 'out' },
      ],
    });
    expect(result.needsLayout).toBe(true);
    expect(result.warnings.some((warning) => warning.includes('未知形状'))).toBe(true);
  });

  it('非法 JSON 和不存在的端点引用返回明确错误', () => {
    const syntaxError = prepareProcessFlowJson('{broken');
    expect(syntaxError.ok).toBe(false);
    if (!syntaxError.ok) expect(syntaxError.errors[0]).toContain('JSON 解析失败');

    const referenceError = prepareProcessFlowJson(JSON.stringify({
      title: '引用错误',
      nodes: [{ id: 'SourceA', kind: 'source', name: '来源', shapeKey: 'boundary.source' }],
      edges: [{
        id: 'FlowA',
        source: { nodeId: 'SourceA', portId: 'out-1' },
        target: { nodeId: 'MissingNode', portId: 'in-1' },
        label: '物料',
      }],
    }));
    expect(referenceError.ok).toBe(false);
    if (!referenceError.ok) expect(referenceError.errors.join('\n')).toContain('不存在的目标节点 MissingNode');
  });

  it('保存并重新载入后恢复完整语义、位置和路由', async () => {
    const laidOut = await layoutProcessFlowDocument(processData as ProcessFlowDocument);
    const restored = prepareProcessFlowJson(serializeProcessFlow(laidOut));
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.needsLayout).toBe(false);
    expect(restored.document.nodes).toHaveLength(52);
    expect(restored.document.edges).toHaveLength(57);
    expect(restored.document.layout.nodes.eq_R1008).toEqual(laidOut.layout.nodes.eq_R1008);
    expect(restored.document.layout.edges.flow_007.routing).toBe('orthogonal');
  });
});
