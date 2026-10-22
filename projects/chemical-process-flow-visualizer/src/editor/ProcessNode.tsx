import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { CSSProperties } from 'react';
import type { ProcessFlowNode } from './flowAdapter';
import type { ProcessPort } from '../model/types';
import { resolveShapeDefinition } from '../shapes/registry';
import { ShapeGlyph } from '../shapes/ShapeGlyph';

function getPosition(port: ProcessPort): Position {
  if (port.direction === 'in') return port.role === 'utility' ? Position.Top : Position.Left;
  if (port.role === 'gas') return Position.Top;
  if (port.role === 'waste') return Position.Bottom;
  return Position.Right;
}

function getPortStyle(port: ProcessPort, ports: ProcessPort[]): CSSProperties {
  const side = getPosition(port);
  const siblings = ports.filter((candidate) => getPosition(candidate) === side);
  const index = siblings.findIndex((candidate) => candidate.id === port.id);
  const offset = `${((index + 1) / (siblings.length + 1)) * 100}%`;
  return side === Position.Top || side === Position.Bottom ? { left: offset } : { top: offset };
}

export function ProcessNode({ data, selected }: NodeProps<ProcessFlowNode>) {
  const node = data.processNode;
  const shape = resolveShapeDefinition(node.shapeKey);
  const eyebrow = node.tag ?? (node.kind === 'source' ? '物料入口' : node.kind === 'sink' ? '流程去向' : '未分配位号');

  return (
    <div className={`process-node process-node--${node.kind}${selected ? ' is-selected' : ''}${data.viewMode === 'overview' ? ' is-overview-muted' : ''}${data.viewMode === 'detail' && !data.inActiveArea ? ' is-outside-area' : ''}`}>
      <div className="process-node__signal" aria-hidden="true" />
      <div className="process-node__shape" title={shape.label}>
        <ShapeGlyph kind={shape.glyph} />
      </div>
      <div className="process-node__copy">
        <span className="process-node__eyebrow">{eyebrow}</span>
        <strong className="process-node__name" title={node.name}>{node.name}</strong>
        {node.quantity && node.quantity > 1 ? <span className="process-node__quantity">×{node.quantity}</span> : null}
      </div>
      <span className="process-node__kind">{shape.label}</span>
      {node.ports.map((port) => {
        const common = {
          id: port.id,
          position: getPosition(port),
          style: getPortStyle(port, node.ports),
          className: `process-port process-port--${port.role}`,
          title: port.label ?? port.role,
        };
        if (port.direction === 'bidirectional') {
          return (
            <span key={port.id}>
              <Handle {...common} type="target" />
              <Handle {...common} type="source" />
            </span>
          );
        }
        return <Handle key={port.id} {...common} type={port.direction === 'in' ? 'target' : 'source'} />;
      })}
    </div>
  );
}
