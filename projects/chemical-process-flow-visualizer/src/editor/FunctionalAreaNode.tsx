import type { NodeProps } from '@xyflow/react';
import type { FunctionalAreaFlowNode } from './flowAdapter';

export function FunctionalAreaNode({ data }: NodeProps<FunctionalAreaFlowNode>) {
  return (
    <div className={`functional-area-node${data.active ? ' is-active' : ''}${data.hidden ? ' is-hidden' : ''}`}>
      <div className="functional-area-node__heading">
        <span>{String(data.index + 1).padStart(2, '0')}</span>
        <div>
          <strong>{data.area.name}</strong>
          <p>{data.area.description}</p>
        </div>
        <i aria-hidden="true">进入区域 →</i>
      </div>
      <div className="functional-area-node__members" aria-label="包含节点">
        {data.nodeNames.map((name, index) => <span key={`${name}-${index}`}>{name}</span>)}
      </div>
    </div>
  );
}
