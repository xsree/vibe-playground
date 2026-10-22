import type { FunctionalArea, NodeKind, ProcessEdge, ProcessFlowDocument, ProcessNode, ProcessPort, Routing } from './types';
import { isShapeKeyRegistered } from '../shapes/registry';

const identifierPattern = /^[A-Za-z][A-Za-z0-9._:-]*$/;
const nodeKinds = new Set<NodeKind>(['equipment', 'source', 'sink', 'junction']);
const routings = new Set<Routing>(['straight', 'orthogonal']);

type JsonRecord = Record<string, unknown>;

export interface NormalizeResult {
  document: ProcessFlowDocument;
  warnings: string[];
  needsLayout: boolean;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asTrimmedString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toIdentifier(value: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9._:-]+/g, '_')
    .replace(/^[^A-Za-z]+/, '')
    .replace(/_+/g, '_');
  return normalized || 'item';
}

function uniqueIdentifier(preferred: string, prefix: string, used: Set<string>): string {
  const base = identifierPattern.test(preferred) ? preferred : `${prefix}_${toIdentifier(preferred)}`;
  let candidate = identifierPattern.test(base) ? base : `${prefix}_item`;
  let sequence = 2;
  while (used.has(candidate)) {
    candidate = `${base}_${sequence}`;
    sequence += 1;
  }
  used.add(candidate);
  return candidate;
}

function normalizePorts(kind: NodeKind, rawPorts: unknown, warnings: string[], nodeId: string): ProcessPort[] {
  const ports: ProcessPort[] = [];
  const used = new Set<string>();
  if (Array.isArray(rawPorts)) {
    for (const [index, value] of rawPorts.entries()) {
      if (!isRecord(value)) continue;
      const rawId = asTrimmedString(value.id) ?? `port-${index + 1}`;
      const id = uniqueIdentifier(rawId, 'port', used);
      if (id !== rawId) warnings.push(`节点 ${nodeId} 的端口 “${rawId}” 已规范化为 “${id}”。`);
      const rawDirection = asTrimmedString(value.direction);
      const direction = rawDirection === 'in' || rawDirection === 'out' || rawDirection === 'bidirectional'
        ? rawDirection
        : 'bidirectional';
      ports.push({
        id,
        direction,
        role: asTrimmedString(value.role) ?? 'material',
        ...(asTrimmedString(value.label) ? { label: asTrimmedString(value.label)! } : {}),
      });
    }
  }
  if (ports.length > 0) return ports;
  warnings.push(`节点 ${nodeId} 缺少端口，已补充默认端口。`);
  if (kind === 'source') return [{ id: 'out-1', direction: 'out', role: 'material' }];
  if (kind === 'sink') return [{ id: 'in-1', direction: 'in', role: 'material' }];
  return [
    { id: 'in-1', direction: 'in', role: 'material' },
    { id: 'out-1', direction: 'out', role: 'material' },
  ];
}

export function normalizeProcessFlow(input: unknown): NormalizeResult {
  const root = isRecord(input) ? input : {};
  const warnings: string[] = [];
  const rawNodes = Array.isArray(root.nodes) ? root.nodes : [];
  const usedNodeIds = new Set<string>();
  const nodeAliases = new Map<string, string>();

  const nodes: ProcessNode[] = rawNodes.map((value, index) => {
    const raw = isRecord(value) ? value : {};
    const kindValue = asTrimmedString(raw.kind);
    const kind = kindValue && nodeKinds.has(kindValue as NodeKind) ? kindValue as NodeKind : 'equipment';
    const tag = asTrimmedString(raw.tag);
    const sourceId = asTrimmedString(raw.id);
    const preferredId = sourceId ?? (tag ? `eq_${toIdentifier(tag)}` : `eq_generated_${index + 1}`);
    const id = uniqueIdentifier(preferredId, kind === 'source' ? 'src' : kind === 'sink' ? 'sink' : 'eq', usedNodeIds);
    if (sourceId && !nodeAliases.has(sourceId)) nodeAliases.set(sourceId, id);
    if (id !== preferredId) warnings.push(`节点 ID “${preferredId}” 已规范化为 “${id}”。`);

    const requestedShape = asTrimmedString(raw.shapeKey) ?? 'generic.process';
    const shapeKey = isShapeKeyRegistered(requestedShape) ? requestedShape : 'generic.process';
    if (shapeKey !== requestedShape) warnings.push(`节点 ${id} 的未知形状 “${requestedShape}” 已回退为 generic.process。`);
    const quantity = typeof raw.quantity === 'number' && Number.isInteger(raw.quantity) && raw.quantity >= 1
      ? raw.quantity
      : 1;

    return {
      id,
      kind,
      tag,
      name: asTrimmedString(raw.name) ?? tag ?? `未命名设备 ${index + 1}`,
      equipmentType: asTrimmedString(raw.equipmentType),
      shapeKey,
      quantity,
      ports: normalizePorts(kind, raw.ports, warnings, id),
      attributes: isRecord(raw.attributes) ? raw.attributes : {},
    };
  });

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const rawAreas = Array.isArray(root.functionalAreas) ? root.functionalAreas : [];
  const usedAreaIds = new Set<string>();
  const functionalAreas: FunctionalArea[] = rawAreas.flatMap((value, index) => {
    if (!isRecord(value)) return [];
    const rawId = asTrimmedString(value.id) ?? `area_${index + 1}`;
    const id = uniqueIdentifier(rawId, 'area', usedAreaIds);
    const nodeIds = Array.isArray(value.nodeIds)
      ? [...new Set(value.nodeIds.flatMap((nodeId) => {
        const input = asTrimmedString(nodeId);
        if (!input) return [];
        return [nodeAliases.get(input) ?? input];
      }))]
      : [];
    if (!nodeIds.length) return [];
    return [{
      id,
      name: asTrimmedString(value.name) ?? `工艺功能区 ${index + 1}`,
      description: asTrimmedString(value.description) ?? '待补充功能区说明。',
      nodeIds,
    }];
  });
  if (!functionalAreas.length && nodes.length) {
    functionalAreas.push({
      id: 'area_complete_process',
      name: '完整工艺流程',
      description: '导入数据未提供工艺功能区，所有节点暂归入同一区域。',
      nodeIds: nodes.map((node) => node.id),
    });
    warnings.push('导入文件未提供 functionalAreas，已建立“完整工艺流程”默认功能区。');
  }
  const usedEdgeIds = new Set<string>();
  const rawEdges = Array.isArray(root.edges) ? root.edges : [];
  const edges: ProcessEdge[] = rawEdges.map((value, index) => {
    const raw = isRecord(value) ? value : {};
    const source = isRecord(raw.source) ? raw.source : {};
    const target = isRecord(raw.target) ? raw.target : {};
    const rawId = asTrimmedString(raw.id) ?? `flow_generated_${index + 1}`;
    const id = uniqueIdentifier(rawId, 'flow', usedEdgeIds);
    if (id !== rawId) warnings.push(`管线 ID “${rawId}” 已规范化为 “${id}”。`);
    const sourceNodeInput = asTrimmedString(source.nodeId) ?? '';
    const targetNodeInput = asTrimmedString(target.nodeId) ?? '';
    const sourceNodeId = nodeAliases.get(sourceNodeInput) ?? sourceNodeInput;
    const targetNodeId = nodeAliases.get(targetNodeInput) ?? targetNodeInput;
    const sourceNode = nodeById.get(sourceNodeId);
    const targetNode = nodeById.get(targetNodeId);
    const sourcePortId = asTrimmedString(source.portId)
      ?? sourceNode?.ports.find((port) => port.direction !== 'in')?.id
      ?? 'out-1';
    const targetPortId = asTrimmedString(target.portId)
      ?? targetNode?.ports.find((port) => port.direction !== 'out')?.id
      ?? 'in-1';
    const material = isRecord(raw.material) ? raw.material : {};
    const label = asTrimmedString(raw.label) ?? asTrimmedString(material.name) ?? `未命名管线 ${index + 1}`;
    return {
      id,
      source: { nodeId: sourceNodeId, portId: sourcePortId },
      target: { nodeId: targetNodeId, portId: targetPortId },
      label,
      streamType: asTrimmedString(raw.streamType) ?? 'main',
      material: {
        name: asTrimmedString(material.name) ?? label,
        ...(typeof material.phase === 'string' || material.phase === null ? { phase: material.phase } : {}),
        ...(Array.isArray(material.components)
          ? { components: [...new Set(material.components.filter((component): component is string => typeof component === 'string' && Boolean(component.trim())).map((component) => component.trim()))] }
          : {}),
      },
      attributes: isRecord(raw.attributes) ? raw.attributes : {},
    };
  });

  const rawLayout = isRecord(root.layout) ? root.layout : {};
  const rawNodeLayout = isRecord(rawLayout.nodes) ? rawLayout.nodes : {};
  const layoutNodes: ProcessFlowDocument['layout']['nodes'] = {};
  for (const [rawNodeId, value] of Object.entries(rawNodeLayout)) {
    if (!isRecord(value)) continue;
    const nodeId = nodeAliases.get(rawNodeId) ?? rawNodeId;
    const x = Number(value.x);
    const y = Number(value.y);
    const width = Number(value.width);
    const height = Number(value.height);
    if ([x, y, width, height].every(Number.isFinite) && width > 0 && height > 0 && nodeById.has(nodeId)) {
      layoutNodes[nodeId] = { x, y, width, height };
    }
  }

  const rawEdgeLayout = isRecord(rawLayout.edges) ? rawLayout.edges : {};
  const layoutEdges: ProcessFlowDocument['layout']['edges'] = {};
  for (const edge of edges) {
    const value = isRecord(rawEdgeLayout[edge.id]) ? rawEdgeLayout[edge.id] as JsonRecord : {};
    const routingValue = asTrimmedString(value.routing);
    const routing = routingValue && routings.has(routingValue as Routing) ? routingValue as Routing : 'orthogonal';
    const waypoints = Array.isArray(value.waypoints)
      ? value.waypoints.flatMap((point) => {
        if (!isRecord(point)) return [];
        const x = Number(point.x);
        const y = Number(point.y);
        return Number.isFinite(x) && Number.isFinite(y) ? [{ x, y }] : [];
      })
      : [];
    layoutEdges[edge.id] = { routing, waypoints };
  }

  const rawSettings = isRecord(root.settings) ? root.settings : {};
  const defaultRoutingValue = asTrimmedString(rawSettings.defaultRouting);
  const defaultRouting = defaultRoutingValue && routings.has(defaultRoutingValue as Routing)
    ? defaultRoutingValue as Routing
    : 'orthogonal';
  const needsLayout = nodes.some((node) => !layoutNodes[node.id]);
  if (needsLayout && nodes.length > 0) warnings.push('导入文件缺少完整节点布局，将自动执行 ELK 布局。');

  return {
    document: {
      schemaVersion: '1.0',
      title: asTrimmedString(root.title) ?? '未命名工艺流程',
      ...(asTrimmedString(root.description) ? { description: asTrimmedString(root.description)! } : {}),
      functionalAreas,
      nodes,
      edges,
      layout: {
        mode: rawLayout.mode === 'manual' ? 'manual' : 'auto',
        algorithm: asTrimmedString(rawLayout.algorithm) ?? 'layered',
        direction: rawLayout.direction === 'LEFT' || rawLayout.direction === 'DOWN' || rawLayout.direction === 'UP'
          ? rawLayout.direction
          : 'RIGHT',
        nodes: layoutNodes,
        edges: layoutEdges,
      },
      settings: {
        defaultRouting,
        nodeSpacing: typeof rawSettings.nodeSpacing === 'number' && rawSettings.nodeSpacing >= 0 ? rawSettings.nodeSpacing : 80,
        layerSpacing: typeof rawSettings.layerSpacing === 'number' && rawSettings.layerSpacing >= 0 ? rawSettings.layerSpacing : 160,
        preventNodeOverlap: typeof rawSettings.preventNodeOverlap === 'boolean' ? rawSettings.preventNodeOverlap : true,
      },
    },
    warnings,
    needsLayout,
  };
}
