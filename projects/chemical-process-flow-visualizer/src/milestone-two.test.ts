import { describe, expect, it } from 'vitest';
import processData from '../pendimethalin-process.test.json';
import { toFlowEdges } from './editor/flowAdapter';
import {
  addProcessEdge,
  addProcessNode,
  assignProcessNodeToFunctionalArea,
  createUniqueId,
  deleteProcessEdge,
  deleteProcessNode,
  reconnectProcessEdge,
  setProcessEdgeRouting,
  updateProcessNode,
} from './model/editorActions';
import type { ProcessEdge, ProcessFlowDocument, ProcessNode } from './model/types';
import { isShapeKeyRegistered, resolveShapeDefinition } from './shapes/registry';
import { createEditorHistory, historyReducer } from './store/history';

const document = processData as ProcessFlowDocument;

describe('MVP 里程碑二', () => {
  it('注册全部基础形状，未知 shapeKey 安全回退为通用设备', () => {
    const expectedKeys = [
      'boundary.source',
      'boundary.sink',
      'generic.process',
      'vessel.stirred',
      'vessel.heated',
      'vessel.vacuum',
      'tank.vertical',
      'reactor.tubular',
      'separator.phase',
      'separator.settling',
      'separator.solid-liquid',
      'heat-exchanger.condenser',
      'machine.metering',
      'machine.transfer',
      'conveyor.chain',
      'machine.slicer',
      'hopper',
      'collector.dust',
      'line.packaging',
      'warehouse',
    ];
    expect(expectedKeys.every(isShapeKeyRegistered)).toBe(true);
    expect(resolveShapeDefinition('system.feeding').key).toBe('generic.process');
  });

  it('新增、修改和删除设备，并同步清理关联管线', () => {
    const id = createUniqueId('eq_new', document.nodes.map((node) => node.id));
    const node: ProcessNode = {
      id,
      kind: 'equipment',
      tag: null,
      name: '新建设备',
      equipmentType: '通用工艺设备',
      shapeKey: 'generic.process',
      ports: [
        { id: 'in-1', direction: 'in', role: 'material' },
        { id: 'out-1', direction: 'out', role: 'material' },
      ],
      attributes: {},
    };
    const firstAreaId = document.functionalAreas[0].id;
    const secondAreaId = document.functionalAreas[1].id;
    const added = addProcessNode(document, node, { x: 10, y: 20, width: 188, height: 96 }, firstAreaId);
    const updated = updateProcessNode(added, id, { name: '校验用设备', shapeKey: 'tank.vertical' });
    expect(updated.nodes).toHaveLength(53);
    expect(updated.nodes.find((candidate) => candidate.id === id)).toMatchObject({
      name: '校验用设备',
      shapeKey: 'tank.vertical',
    });
    expect(updated.functionalAreas).toHaveLength(document.functionalAreas.length);
    expect(updated.functionalAreas.find((area) => area.id === firstAreaId)?.nodeIds).toContain(id);

    const reassigned = assignProcessNodeToFunctionalArea(updated, id, secondAreaId);
    expect(reassigned.functionalAreas.find((area) => area.id === firstAreaId)?.nodeIds).not.toContain(id);
    expect(reassigned.functionalAreas.find((area) => area.id === secondAreaId)?.nodeIds).toContain(id);
    expect(reassigned.functionalAreas.flatMap((area) => area.nodeIds).filter((nodeId) => nodeId === id)).toHaveLength(1);

    const deleted = deleteProcessNode(document, 'eq_R1008');
    expect(deleted.nodes).toHaveLength(51);
    expect(deleted.edges).toHaveLength(54);
    expect(deleted.edges.some((edge) => edge.source.nodeId === 'eq_R1008' || edge.target.nodeId === 'eq_R1008')).toBe(false);
  });

  it('支持管线新增、重连、路由切换和删除', () => {
    const edge: ProcessEdge = {
      id: 'flow_new_001',
      source: { nodeId: 'src_concentrated_nitric_acid', portId: 'out-1' },
      target: { nodeId: 'eq_R1008', portId: 'in-concentrated' },
      label: '测试管线',
      streamType: 'main',
      material: { name: '测试物料' },
      attributes: {},
    };
    const added = addProcessEdge(document, edge);
    const reconnected = reconnectProcessEdge(
      added,
      edge.id,
      edge.source,
      { nodeId: 'eq_R1008', portId: 'in-dilute' },
    );
    const straight = setProcessEdgeRouting(reconnected, edge.id, 'straight');
    expect(straight.edges.find((candidate) => candidate.id === edge.id)?.target.portId).toBe('in-dilute');
    expect(toFlowEdges(straight).find((candidate) => candidate.id === edge.id)?.type).toBe('straight');
    expect(deleteProcessEdge(straight, edge.id).edges).toHaveLength(57);
  });

  it('编辑历史支持撤销和重做', () => {
    const renamed = updateProcessNode(document, 'eq_R1008', { name: '已修改名称' });
    const initial = createEditorHistory(document);
    const committed = historyReducer(initial, { type: 'commit', document: renamed });
    const undone = historyReducer(committed, { type: 'undo' });
    const redone = historyReducer(undone, { type: 'redo' });
    expect(committed.present.nodes.find((node) => node.id === 'eq_R1008')?.name).toBe('已修改名称');
    expect(undone.present.nodes.find((node) => node.id === 'eq_R1008')?.name).toBe('硝酸配制釜');
    expect(redone.present.nodes.find((node) => node.id === 'eq_R1008')?.name).toBe('已修改名称');
  });
});
