import type { NodeLayout, ProcessEdge, ProcessFlowDocument, ProcessNode } from './types';

export function updateProcessNode(
  document: ProcessFlowDocument,
  nodeId: string,
  patch: Partial<Pick<ProcessNode, 'name' | 'tag' | 'equipmentType' | 'shapeKey' | 'quantity'>>,
): ProcessFlowDocument {
  return {
    ...document,
    nodes: document.nodes.map((node) => node.id === nodeId ? { ...node, ...patch } : node),
  };
}

export function addProcessNode(
  document: ProcessFlowDocument,
  node: ProcessNode,
  layout: NodeLayout,
  functionalAreaId: string,
): ProcessFlowDocument {
  if (!document.functionalAreas.some((area) => area.id === functionalAreaId)) return document;
  return {
    ...document,
    nodes: [...document.nodes, node],
    functionalAreas: document.functionalAreas.map((area) => area.id === functionalAreaId
      ? { ...area, nodeIds: [...new Set([...area.nodeIds, node.id])] }
      : area),
    layout: {
      ...document.layout,
      mode: 'manual',
      nodes: { ...document.layout.nodes, [node.id]: layout },
    },
  };
}

export function assignProcessNodeToFunctionalArea(
  document: ProcessFlowDocument,
  nodeId: string,
  functionalAreaId: string,
): ProcessFlowDocument {
  if (!document.nodes.some((node) => node.id === nodeId)) return document;
  if (!document.functionalAreas.some((area) => area.id === functionalAreaId)) return document;
  return {
    ...document,
    functionalAreas: document.functionalAreas
      .map((area) => ({
        ...area,
        nodeIds: area.id === functionalAreaId
          ? [...new Set([...area.nodeIds, nodeId])]
          : area.nodeIds.filter((id) => id !== nodeId),
      }))
      .filter((area) => area.nodeIds.length > 0),
  };
}

export function deleteProcessNode(document: ProcessFlowDocument, nodeId: string): ProcessFlowDocument {
  const deletedEdgeIds = new Set(
    document.edges
      .filter((edge) => edge.source.nodeId === nodeId || edge.target.nodeId === nodeId)
      .map((edge) => edge.id),
  );
  const nextNodeLayout = { ...document.layout.nodes };
  delete nextNodeLayout[nodeId];
  const nextEdgeLayout = Object.fromEntries(
    Object.entries(document.layout.edges).filter(([edgeId]) => !deletedEdgeIds.has(edgeId)),
  );
  return {
    ...document,
    nodes: document.nodes.filter((node) => node.id !== nodeId),
    edges: document.edges.filter((edge) => !deletedEdgeIds.has(edge.id)),
    functionalAreas: document.functionalAreas
      .map((area) => ({ ...area, nodeIds: area.nodeIds.filter((id) => id !== nodeId) }))
      .filter((area) => area.nodeIds.length > 0),
    layout: { ...document.layout, nodes: nextNodeLayout, edges: nextEdgeLayout },
  };
}

export function moveProcessNode(
  document: ProcessFlowDocument,
  nodeId: string,
  position: { x: number; y: number },
): ProcessFlowDocument {
  const previous = document.layout.nodes[nodeId];
  if (!previous) return document;
  return {
    ...document,
    layout: {
      ...document.layout,
      mode: 'manual',
      nodes: {
        ...document.layout.nodes,
        [nodeId]: { ...previous, ...position },
      },
    },
  };
}

export function addProcessEdge(document: ProcessFlowDocument, edge: ProcessEdge): ProcessFlowDocument {
  return {
    ...document,
    edges: [...document.edges, edge],
    layout: {
      ...document.layout,
      edges: {
        ...document.layout.edges,
        [edge.id]: { routing: document.settings.defaultRouting, waypoints: [] },
      },
    },
  };
}

export function updateProcessEdge(
  document: ProcessFlowDocument,
  edgeId: string,
  patch: Partial<Pick<ProcessEdge, 'label' | 'streamType' | 'material'>>,
): ProcessFlowDocument {
  return {
    ...document,
    edges: document.edges.map((edge) => edge.id === edgeId ? { ...edge, ...patch } : edge),
  };
}

export function reconnectProcessEdge(
  document: ProcessFlowDocument,
  edgeId: string,
  source: { nodeId: string; portId: string },
  target: { nodeId: string; portId: string },
): ProcessFlowDocument {
  return {
    ...document,
    edges: document.edges.map((edge) => edge.id === edgeId ? { ...edge, source, target } : edge),
  };
}

export function setProcessEdgeRouting(
  document: ProcessFlowDocument,
  edgeId: string,
  routing: 'straight' | 'orthogonal',
): ProcessFlowDocument {
  return {
    ...document,
    layout: {
      ...document.layout,
      edges: {
        ...document.layout.edges,
        [edgeId]: {
          routing,
          waypoints: document.layout.edges[edgeId]?.waypoints ?? [],
        },
      },
    },
  };
}

export function deleteProcessEdge(document: ProcessFlowDocument, edgeId: string): ProcessFlowDocument {
  const nextEdgeLayout = { ...document.layout.edges };
  delete nextEdgeLayout[edgeId];
  return {
    ...document,
    edges: document.edges.filter((edge) => edge.id !== edgeId),
    layout: { ...document.layout, edges: nextEdgeLayout },
  };
}

export function createUniqueId(prefix: string, existingIds: Iterable<string>): string {
  const ids = new Set(existingIds);
  let sequence = 1;
  let candidate = `${prefix}_${String(sequence).padStart(3, '0')}`;
  while (ids.has(candidate)) {
    sequence += 1;
    candidate = `${prefix}_${String(sequence).padStart(3, '0')}`;
  }
  return candidate;
}
