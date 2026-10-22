export type NodeKind = 'equipment' | 'source' | 'sink' | 'junction';
export type PortDirection = 'in' | 'out' | 'bidirectional';
export type Routing = 'straight' | 'orthogonal';

export interface ProcessPort {
  id: string;
  direction: PortDirection;
  role: string;
  label?: string;
}

export interface ProcessNode {
  id: string;
  kind: NodeKind;
  tag: string | null;
  name: string;
  equipmentType: string | null;
  shapeKey: string;
  quantity?: number;
  ports: ProcessPort[];
  attributes: Record<string, unknown>;
}

export interface ProcessEndpoint {
  nodeId: string;
  portId: string;
}

export interface ProcessEdge {
  id: string;
  source: ProcessEndpoint;
  target: ProcessEndpoint;
  label: string;
  streamType: string;
  material: {
    name: string;
    phase?: string | null;
    components?: string[];
  };
  attributes: Record<string, unknown>;
}

export interface NodeLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FunctionalArea {
  id: string;
  name: string;
  description: string;
  nodeIds: string[];
}

export interface ProcessFlowDocument {
  schemaVersion: '1.0';
  title: string;
  description?: string;
  functionalAreas: FunctionalArea[];
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  layout: {
    mode: 'auto' | 'manual';
    algorithm: string;
    direction: 'RIGHT' | 'LEFT' | 'DOWN' | 'UP';
    nodes: Record<string, NodeLayout>;
    edges: Record<string, { routing: Routing; waypoints: Array<{ x: number; y: number }> }>;
  };
  settings: {
    defaultRouting: Routing;
    nodeSpacing: number;
    layerSpacing: number;
    preventNodeOverlap: boolean;
  };
}
