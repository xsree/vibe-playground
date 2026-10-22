import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkNode, ElkPort } from 'elkjs/lib/elk-api';
import type { NodeLayout, ProcessFlowDocument, ProcessNode, ProcessPort } from '../model/types';

const elk = new ELK();

export const EQUIPMENT_SIZE = { width: 188, height: 96 } as const;
export const BOUNDARY_SIZE = { width: 164, height: 78 } as const;

export function getNodeSize(node: ProcessNode): { width: number; height: number } {
  return node.kind === 'equipment' ? EQUIPMENT_SIZE : BOUNDARY_SIZE;
}

function getPortSide(port: ProcessPort): 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' {
  if (port.direction === 'in') {
    return port.role === 'utility' ? 'NORTH' : 'WEST';
  }
  if (port.role === 'gas') return 'NORTH';
  if (port.role === 'waste') return 'SOUTH';
  return 'EAST';
}

function elkPortId(nodeId: string, portId: string): string {
  return `${nodeId}::${portId}`;
}

function toElkPort(nodeId: string, port: ProcessPort): ElkPort {
  return {
    id: elkPortId(nodeId, port.id),
    width: 8,
    height: 8,
    layoutOptions: {
      'org.eclipse.elk.port.side': getPortSide(port),
    },
  };
}

export async function layoutProcessFlow(document: ProcessFlowDocument): Promise<Record<string, NodeLayout>> {
  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': document.layout.direction,
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': String(document.settings.nodeSpacing),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(document.settings.layerSpacing),
      'elk.separateConnectedComponents': 'true',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    },
    children: document.nodes.map((node) => {
      const size = getNodeSize(node);
      return {
        id: node.id,
        width: size.width,
        height: size.height,
        ports: node.ports.map((port) => toElkPort(node.id, port)),
        layoutOptions: {
          'org.eclipse.elk.portConstraints': 'FIXED_SIDE',
        },
      };
    }),
    edges: document.edges.map((edge) => ({
      id: edge.id,
      sources: [elkPortId(edge.source.nodeId, edge.source.portId)],
      targets: [elkPortId(edge.target.nodeId, edge.target.portId)],
      layoutOptions: {
        'org.eclipse.elk.layered.priority.direction': edge.streamType === 'main' ? '10' : '1',
      },
    })),
  };

  const result = await elk.layout(graph);
  const positions: Record<string, NodeLayout> = {};
  for (const node of result.children ?? []) {
    if (node.x === undefined || node.y === undefined || node.width === undefined || node.height === undefined) {
      throw new Error(`ELK 未返回节点 ${node.id} 的完整布局信息`);
    }
    positions[node.id] = {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    };
  }
  return separateFunctionalAreas(document, positions);
}

export function separateFunctionalAreas(
  document: ProcessFlowDocument,
  positions: Record<string, NodeLayout>,
  areaGap = 420,
): Record<string, NodeLayout> {
  if (document.functionalAreas.length < 2) return positions;
  const horizontal = document.layout.direction === 'RIGHT' || document.layout.direction === 'LEFT';
  const orderedAreas = document.layout.direction === 'LEFT' || document.layout.direction === 'UP'
    ? [...document.functionalAreas].reverse()
    : document.functionalAreas;
  const result = Object.fromEntries(Object.entries(positions).map(([id, layout]) => [id, { ...layout }]));
  let cursor: number | null = null;

  for (const area of orderedAreas) {
    const layouts = area.nodeIds.flatMap((nodeId) => result[nodeId] ? [result[nodeId]] : []);
    if (!layouts.length) continue;
    const minimum = Math.min(...layouts.map((layout) => horizontal ? layout.x : layout.y));
    const maximum = Math.max(...layouts.map((layout) => horizontal
      ? layout.x + layout.width
      : layout.y + layout.height));
    const shift: number = cursor === null ? 0 : cursor - minimum;
    for (const nodeId of area.nodeIds) {
      const layout = result[nodeId];
      if (!layout) continue;
      result[nodeId] = horizontal
        ? { ...layout, x: layout.x + shift }
        : { ...layout, y: layout.y + shift };
    }
    cursor = maximum + shift + areaGap;
  }
  return result;
}

export async function layoutProcessFlowDocument(document: ProcessFlowDocument): Promise<ProcessFlowDocument> {
  const nodes = await layoutProcessFlow(document);
  return {
    ...document,
    layout: {
      ...document.layout,
      mode: 'auto',
      algorithm: 'layered',
      nodes,
      edges: Object.fromEntries(
        document.edges.map((edge) => [
          edge.id,
          {
            routing: document.settings.defaultRouting,
            waypoints: [],
          },
        ]),
      ),
    },
  };
}

export function findNodeOverlaps(layout: Record<string, NodeLayout>): Array<[string, string]> {
  const entries = Object.entries(layout);
  const overlaps: Array<[string, string]> = [];
  for (let first = 0; first < entries.length; first += 1) {
    for (let second = first + 1; second < entries.length; second += 1) {
      const [firstId, a] = entries[first];
      const [secondId, b] = entries[second];
      const intersects =
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
      if (intersects) overlaps.push([firstId, secondId]);
    }
  }
  return overlaps;
}
