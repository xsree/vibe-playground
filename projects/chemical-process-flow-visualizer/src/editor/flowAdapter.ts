import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { FunctionalArea, NodeLayout, ProcessFlowDocument, ProcessNode } from '../model/types';
import { getNodeSize } from '../layout/elkLayout';
import { createFunctionalAreaFrames, getAreaNodeIds } from '../overview/functionalAreas';

export interface ProcessNodeData extends Record<string, unknown> {
  processNode: ProcessNode;
  viewMode: 'overview' | 'detail';
  inActiveArea: boolean;
}

export type ProcessFlowNode = Node<ProcessNodeData, 'process'>;

export interface FunctionalAreaNodeData extends Record<string, unknown> {
  area: FunctionalArea;
  index: number;
  nodeNames: string[];
  active: boolean;
  hidden: boolean;
}

export type FunctionalAreaFlowNode = Node<FunctionalAreaNodeData, 'functionalArea'>;
export type CanvasFlowNode = ProcessFlowNode | FunctionalAreaFlowNode;

export interface FlowViewOptions {
  activeAreaId: string | null;
}

const edgeStyles: Record<string, { stroke: string; strokeWidth: number; strokeDasharray?: string }> = {
  main: { stroke: '#246f64', strokeWidth: 2.4 },
  product: { stroke: '#246f64', strokeWidth: 2.4 },
  feed: { stroke: '#52635f', strokeWidth: 1.8 },
  utility: { stroke: '#6e8b84', strokeWidth: 1.7, strokeDasharray: '6 4' },
  gas: { stroke: '#72808d', strokeWidth: 1.7, strokeDasharray: '3 5' },
  waste: { stroke: '#9a6d54', strokeWidth: 1.7, strokeDasharray: '7 4' },
  recycle: { stroke: '#74688d', strokeWidth: 1.8, strokeDasharray: '8 4' },
};

export function toCanvasNodes(
  document: ProcessFlowDocument,
  positions: Record<string, NodeLayout>,
  view: FlowViewOptions = { activeAreaId: null },
): CanvasFlowNode[] {
  const activeNodeIds = getAreaNodeIds(document, view.activeAreaId);
  const areaNodes: FunctionalAreaFlowNode[] = createFunctionalAreaFrames(document).map((frame, index) => ({
    id: `functional-area:${frame.id}`,
    type: 'functionalArea',
    position: { x: frame.x, y: frame.y },
    data: {
      area: frame,
      index,
      nodeNames: frame.nodeNames,
      active: frame.id === view.activeAreaId,
      hidden: Boolean(view.activeAreaId && frame.id !== view.activeAreaId),
    },
    style: { width: frame.width, height: frame.height, zIndex: 0 },
    draggable: false,
    selectable: false,
    connectable: false,
    deletable: false,
  }));
  const processNodes: ProcessFlowNode[] = document.nodes.map((processNode) => {
    const size = getNodeSize(processNode);
    const layout = positions[processNode.id];
    return {
      id: processNode.id,
      type: 'process',
      position: { x: layout?.x ?? 0, y: layout?.y ?? 0 },
      data: {
        processNode,
        viewMode: view.activeAreaId ? 'detail' : 'overview',
        inActiveArea: activeNodeIds.has(processNode.id),
      },
      style: { width: size.width, height: size.height, zIndex: 2 },
    };
  });
  return [...areaNodes, ...processNodes];
}

export function toFlowNodes(
  document: ProcessFlowDocument,
  positions: Record<string, NodeLayout>,
): ProcessFlowNode[] {
  return toCanvasNodes(document, positions).filter((node): node is ProcessFlowNode => node.type === 'process');
}

export function toFlowEdges(document: ProcessFlowDocument, view: FlowViewOptions = { activeAreaId: null }): Edge[] {
  const activeNodeIds = getAreaNodeIds(document, view.activeAreaId);
  return document.edges.map((edge) => ({
    id: edge.id,
    source: edge.source.nodeId,
    sourceHandle: edge.source.portId,
    target: edge.target.nodeId,
    targetHandle: edge.target.portId,
    type: (document.layout.edges[edge.id]?.routing ?? document.settings.defaultRouting) === 'orthogonal' ? 'smoothstep' : 'straight',
    label: edge.label,
    markerEnd: { type: MarkerType.ArrowClosed, width: 13, height: 13 },
    style: {
      ...(edgeStyles[edge.streamType] ?? { stroke: '#52635f', strokeWidth: 1.8 }),
      opacity: view.activeAreaId
        ? activeNodeIds.has(edge.source.nodeId) && activeNodeIds.has(edge.target.nodeId) ? 1
          : activeNodeIds.has(edge.source.nodeId) || activeNodeIds.has(edge.target.nodeId) ? 0.28 : 0.045
        : 0.1,
    },
    labelStyle: {
      fill: '#53615d',
      fontSize: 11,
      fontWeight: 600,
      opacity: view.activeAreaId && activeNodeIds.has(edge.source.nodeId) && activeNodeIds.has(edge.target.nodeId) ? 1 : 0,
    },
    labelBgStyle: {
      fill: '#f7f8f5',
      fillOpacity: view.activeAreaId && activeNodeIds.has(edge.source.nodeId) && activeNodeIds.has(edge.target.nodeId) ? 0.9 : 0,
    },
    labelBgPadding: [5, 3],
    labelBgBorderRadius: 3,
    data: { streamType: edge.streamType },
    reconnectable: true,
  }));
}
