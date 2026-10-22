import type { FunctionalArea, NodeLayout, ProcessFlowDocument } from '../model/types';

export interface FunctionalAreaFrame extends FunctionalArea {
  x: number;
  y: number;
  width: number;
  height: number;
  nodeNames: string[];
}

function boundsForLayouts(layouts: NodeLayout[]) {
  const left = Math.min(...layouts.map((layout) => layout.x));
  const top = Math.min(...layouts.map((layout) => layout.y));
  const right = Math.max(...layouts.map((layout) => layout.x + layout.width));
  const bottom = Math.max(...layouts.map((layout) => layout.y + layout.height));
  return { left, top, right, bottom };
}

export function createFunctionalAreaFrames(document: ProcessFlowDocument): FunctionalAreaFrame[] {
  const nodeById = new Map(document.nodes.map((node) => [node.id, node]));
  return document.functionalAreas.flatMap((area) => {
    const layouts = area.nodeIds.flatMap((nodeId) => {
      const layout = document.layout.nodes[nodeId];
      return layout ? [layout] : [];
    });
    if (!layouts.length) return [];
    const bounds = boundsForLayouts(layouts);
    const horizontalPadding = 82;
    const topPadding = 300;
    const bottomPadding = 82;
    return [{
      ...area,
      x: bounds.left - horizontalPadding,
      y: bounds.top - topPadding,
      width: bounds.right - bounds.left + horizontalPadding * 2,
      height: bounds.bottom - bounds.top + topPadding + bottomPadding,
      nodeNames: area.nodeIds.flatMap((nodeId) => {
        const node = nodeById.get(nodeId);
        return node ? [node.name] : [];
      }),
    }];
  });
}

export function getAreaNodeIds(document: ProcessFlowDocument, areaId: string | null): Set<string> {
  if (!areaId) return new Set();
  return new Set(document.functionalAreas.find((area) => area.id === areaId)?.nodeIds ?? []);
}
