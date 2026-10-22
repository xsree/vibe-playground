import processData from '../../pendimethalin-process.test.json';
import { describe, expect, it } from 'vitest';
import { layoutProcessFlowDocument } from '../layout/elkLayout';
import { checkGraph } from '../model/graphChecks';
import type { ProcessFlowDocument } from '../model/types';
import { createFunctionalAreaFrames } from './functionalAreas';

describe('工艺功能区总览与钻取', () => {
  it('示例流程按工艺语义定义 8 个功能区且所有节点只归属一次', () => {
    const document = processData as ProcessFlowDocument;
    const memberships = document.functionalAreas.flatMap((area) => area.nodeIds);
    expect(document.functionalAreas.map((area) => area.name)).toEqual([
      '原料配制与成盐',
      '连续硝化',
      '中和分相与水洗',
      '脱亚硝',
      '脱亚硝后水洗',
      '脱溶与溶剂回收',
      '精制与产品成型',
      '包装与粉尘收集',
    ]);
    expect(memberships).toHaveLength(document.nodes.length);
    expect(new Set(memberships).size).toBe(document.nodes.length);
    expect(checkGraph(document).filter((issue) => issue.severity === 'error')).toEqual([]);
  });

  it('自动布局后为每个功能区生成包围成员节点的粗粒度框', async () => {
    const document = await layoutProcessFlowDocument(processData as ProcessFlowDocument);
    const frames = createFunctionalAreaFrames(document);
    expect(frames).toHaveLength(8);
    for (const frame of frames) {
      expect(frame.width).toBeGreaterThan(0);
      expect(frame.height).toBeGreaterThan(0);
      expect(frame.nodeNames).toHaveLength(frame.nodeIds.length);
      for (const nodeId of frame.nodeIds) {
        const node = document.layout.nodes[nodeId];
        expect(node.x).toBeGreaterThan(frame.x);
        expect(node.y).toBeGreaterThan(frame.y);
        expect(node.x + node.width).toBeLessThan(frame.x + frame.width);
        expect(node.y + node.height).toBeLessThan(frame.y + frame.height);
      }
    }
    for (let index = 1; index < frames.length; index += 1) {
      expect(frames[index].x).toBeGreaterThan(frames[index - 1].x + frames[index - 1].width);
    }
  });
});
