import { useEffect, useState } from 'react';
import type { FunctionalArea, ProcessEdge, ProcessNode, Routing } from '../model/types';
import { isShapeKeyRegistered, SHAPE_DEFINITIONS } from '../shapes/registry';

interface CommitInputProps {
  label: string;
  value: string;
  placeholder?: string;
  onCommit: (value: string) => void;
}

function CommitInput({ label, value, placeholder, onCommit }: CommitInputProps) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    const normalized = draft.trim();
    if (normalized !== value) onCommit(normalized);
  };

  return (
    <label className="field">
      <span>{label}</span>
      <input
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            setDraft(value);
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}

interface PropertyPanelProps {
  node: ProcessNode | null;
  edge: ProcessEdge | null;
  routing: Routing | null;
  functionalAreas: FunctionalArea[];
  nodeAreaId: string | null;
  onUpdateNode: (patch: Partial<Pick<ProcessNode, 'name' | 'tag' | 'equipmentType' | 'shapeKey' | 'quantity'>>) => void;
  onMoveNodeToArea: (functionalAreaId: string) => void;
  onUpdateEdge: (patch: Partial<Pick<ProcessEdge, 'label' | 'streamType'>>) => void;
  onSetRouting: (routing: Routing) => void;
  onDeleteNode: () => void;
  onDeleteEdge: () => void;
  onClose: () => void;
}

export function PropertyPanel({
  node,
  edge,
  routing,
  functionalAreas,
  nodeAreaId,
  onUpdateNode,
  onMoveNodeToArea,
  onUpdateEdge,
  onSetRouting,
  onDeleteNode,
  onDeleteEdge,
  onClose,
}: PropertyPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => setConfirmDelete(false), [node?.id, edge?.id]);

  return (
    <aside className={`inspector${node || edge ? ' is-active' : ' is-empty'}`} aria-label="属性面板">
      <div className="inspector__header">
        <div>
          <span className="inspector__index">INSPECTOR · 02</span>
          <h2>{node ? '设备属性' : edge ? '管线属性' : '属性面板'}</h2>
        </div>
        {node || edge ? <button className="icon-button inspector__close" type="button" onClick={onClose} aria-label="关闭属性面板">×</button> : null}
      </div>

      {node ? (
        <div className="inspector__body">
          <div className="selection-identity">
            <span>{node.kind === 'equipment' ? '设备' : node.kind === 'source' ? '入口' : '去向'}</span>
            <code>{node.id}</code>
          </div>
          <label className="field field--area">
            <span>所属功能区</span>
            <select value={nodeAreaId ?? ''} onChange={(event) => onMoveNodeToArea(event.target.value)}>
              {!nodeAreaId ? <option value="" disabled>请选择功能区</option> : null}
              {functionalAreas.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}
            </select>
            <small>更改后会把设备移到目标功能区并打开该区域。</small>
          </label>
          <CommitInput
            label="设备名称"
            value={node.name}
            onCommit={(name) => name && onUpdateNode({ name })}
          />
          <CommitInput
            label="设备位号"
            value={node.tag ?? ''}
            placeholder="无位号"
            onCommit={(tag) => onUpdateNode({ tag: tag || null })}
          />
          <CommitInput
            label="设备类型"
            value={node.equipmentType ?? ''}
            placeholder="未定义"
            onCommit={(equipmentType) => onUpdateNode({ equipmentType: equipmentType || null })}
          />
          <label className="field">
            <span>设备形状</span>
            <select
              value={isShapeKeyRegistered(node.shapeKey) ? node.shapeKey : 'generic.process'}
              onChange={(event) => onUpdateNode({ shapeKey: event.target.value })}
            >
              {SHAPE_DEFINITIONS.map((shape) => <option key={shape.key} value={shape.key}>{shape.label}</option>)}
            </select>
          </label>
          {!isShapeKeyRegistered(node.shapeKey) ? (
            <p className="field-note">“{node.shapeKey}” 尚未注册，当前安全回退为通用设备。</p>
          ) : null}
          <label className="field">
            <span>设备数量</span>
            <input
              type="number"
              min="1"
              value={node.quantity ?? 1}
              onChange={(event) => onUpdateNode({ quantity: Math.max(1, Number(event.target.value) || 1) })}
            />
          </label>
          <div className="inspector__divider" />
          <div className="port-summary">
            <span>端口</span>
            <strong>{node.ports.length}</strong>
            <small>拖动端口可新建管线</small>
          </div>
          {confirmDelete ? (
            <div className="delete-confirm" role="alert">
              <p>删除设备会同时删除所有关联管线。</p>
              <div>
                <button type="button" onClick={onDeleteNode}>确认删除</button>
                <button type="button" onClick={() => setConfirmDelete(false)}>取消</button>
              </div>
            </div>
          ) : (
            <button type="button" className="danger-button" onClick={() => setConfirmDelete(true)}>删除设备</button>
          )}
        </div>
      ) : null}

      {edge ? (
        <div className="inspector__body">
          <div className="selection-identity">
            <span>管线</span>
            <code>{edge.id}</code>
          </div>
          <CommitInput label="物料名称" value={edge.label} onCommit={(label) => label && onUpdateEdge({ label })} />
          <CommitInput label="管线类型" value={edge.streamType} onCommit={(streamType) => streamType && onUpdateEdge({ streamType })} />
          <label className="field">
            <span>路由方式</span>
            <select value={routing ?? 'orthogonal'} onChange={(event) => onSetRouting(event.target.value as Routing)}>
              <option value="orthogonal">正交折线</option>
              <option value="straight">直线</option>
            </select>
          </label>
          <div className="endpoint-list">
            <div><span>来源</span><code>{edge.source.nodeId} · {edge.source.portId}</code></div>
            <div><span>目标</span><code>{edge.target.nodeId} · {edge.target.portId}</code></div>
          </div>
          <p className="field-note">选中管线后拖动首尾端点，可重新连接到其他兼容端口。</p>
          <button type="button" className="danger-button" onClick={onDeleteEdge}>删除管线</button>
        </div>
      ) : null}

      {!node && !edge ? (
        <div className="inspector__empty">
          <span className="inspector__empty-mark">⌁</span>
          <h3>选择画布元素</h3>
          <p>点击设备或管线以查看和修改属性。拖动设备时，管线会持续绑定端口。</p>
        </div>
      ) : null}
    </aside>
  );
}
