import { getViewportForBounds, type Node } from '@xyflow/react';
import { toPng } from 'html-to-image';

export interface PngExportResult {
  dataUrl: string;
  width: number;
  height: number;
}

function numericSize(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number.parseFloat(value) || 0;
  return 0;
}

export function getCompleteCanvasBounds(nodes: Node[]) {
  const extents = nodes.map((node) => {
    const width = node.measured?.width ?? node.width ?? numericSize(node.style?.width);
    const height = node.measured?.height ?? node.height ?? numericSize(node.style?.height);
    return {
      left: node.position.x,
      top: node.position.y,
      right: node.position.x + width,
      bottom: node.position.y + height,
    };
  });
  const x = Math.min(...extents.map((extent) => extent.left));
  const y = Math.min(...extents.map((extent) => extent.top));
  const right = Math.max(...extents.map((extent) => extent.right));
  const bottom = Math.max(...extents.map((extent) => extent.bottom));
  return { x, y, width: right - x, height: bottom - y };
}

export async function renderCompleteCanvasPng(viewportElement: HTMLElement, nodes: Node[]): Promise<PngExportResult> {
  if (nodes.length === 0) throw new Error('画布中没有可导出的节点。');
  const bounds = getCompleteCanvasBounds(nodes);
  const width = Math.min(12000, Math.max(1600, Math.ceil(bounds.width + 320)));
  const height = Math.min(6000, Math.max(1000, Math.ceil(bounds.height + 320)));
  const viewport = getViewportForBounds(bounds, width, height, 0.02, 2, 0.06);
  const dataUrl = await toPng(viewportElement, {
    backgroundColor: '#eef1ec',
    cacheBust: true,
    width,
    height,
    pixelRatio: 1,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      transformOrigin: '0 0',
    },
  });
  return { dataUrl, width, height };
}
