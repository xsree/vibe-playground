import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Database,
  Maximize,
  Moon,
  PanelsTopLeft,
  Plus,
  Redo2,
  Sparkles,
  Sun,
  Undo2,
  Workflow,
} from 'lucide-react';
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge as FlowEdge,
  type Node as FlowNode,
  type OnSelectionChangeParams,
} from '@xyflow/react';
import type { ProcessEdge, ProcessFlowDocument, ProcessNode, Routing } from '../model/types';
import { findNodeOverlaps, layoutProcessFlowDocument } from '../layout/elkLayout';
import {
  addProcessEdge,
  addProcessNode,
  assignProcessNodeToFunctionalArea,
  createUniqueId,
  deleteProcessEdge,
  deleteProcessNode,
  moveProcessNode,
  reconnectProcessEdge,
  setProcessEdgeRouting,
  updateProcessEdge,
  updateProcessNode,
} from '../model/editorActions';
import { createEditorHistory, historyReducer } from '../store/history';
import { ProcessNode as ProcessNodeComponent } from './ProcessNode';
import { FunctionalAreaNode } from './FunctionalAreaNode';
import { PropertyPanel } from './PropertyPanel';
import { DataPanel, type ApplyJsonResult } from './DataPanel';
import { toCanvasNodes, toFlowEdges, type CanvasFlowNode, type ProcessNodeData } from './flowAdapter';
import { prepareProcessFlowJson } from '../import-export/json';
import { downloadDataUrl, safeFilename } from '../import-export/download';
import { renderCompleteCanvasPng } from '../import-export/png';
import { GeneratePanel, type GenerateApplyResult } from './GeneratePanel';
import { requestProcessFlowGeneration } from '../llm/generate';
import type { CustomProviderConfig } from '../llm/types';
import { ProductLogo } from './ProductLogo';

const nodeTypes = { process: ProcessNodeComponent, functionalArea: FunctionalAreaNode };

interface CanvasProps {
  document: ProcessFlowDocument;
  onDocumentChange?: (document: ProcessFlowDocument) => void;
}

function sameIds(first: string[], second: string[]): boolean {
  return first.length === second.length && first.every((id, index) => id === second[index]);
}

type ColorTheme = 'light' | 'dark';

function getInitialTheme(): ColorTheme {
  const stored = localStorage.getItem('process-flow-visualizer:theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function Canvas({ document: initialDocument, onDocumentChange }: CanvasProps) {
  const [history, dispatch] = useReducer(historyReducer, initialDocument, createEditorHistory);
  const document = history.present;
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [isLayingOut, setIsLayingOut] = useState(true);
  const [layoutTime, setLayoutTime] = useState<number | null>(null);
  const [overlapCount, setOverlapCount] = useState<number | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const [activePanel, setActivePanel] = useState<'generate' | 'data' | null>(null);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [addAreaPickerOpen, setAddAreaPickerOpen] = useState(false);
  const [addTargetAreaId, setAddTargetAreaId] = useState('');
  const [theme, setTheme] = useState<ColorTheme>(getInitialTheme);
  const didInitialLayout = useRef(false);
  const shouldFitView = useRef(false);
  const pendingFocusAreaId = useRef<string | null>(null);
  const canvasShell = useRef<HTMLElement>(null);
  const { fitView, screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    globalThis.document.documentElement.dataset.theme = theme;
    globalThis.document.documentElement.style.colorScheme = theme;
    localStorage.setItem('process-flow-visualizer:theme', theme);
  }, [theme]);

  const handleThemeToggle = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme: ColorTheme = theme === 'light' ? 'dark' : 'light';
    const rect = event.currentTarget.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY),
    );
    const viewTransitionDocument = globalThis.document as Document & {
      startViewTransition?: (callback: () => void) => { ready: Promise<void> };
    };
    const applyTheme = () => {
      globalThis.document.documentElement.dataset.theme = nextTheme;
      globalThis.document.documentElement.style.colorScheme = nextTheme;
      localStorage.setItem('process-flow-visualizer:theme', nextTheme);
      flushSync(() => setTheme(nextTheme));
    };
    if (!viewTransitionDocument.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyTheme();
      return;
    }
    const transition = viewTransitionDocument.startViewTransition(applyTheme);
    void transition.ready.then(() => {
      globalThis.document.documentElement.animate(
        { clipPath: [`circle(0px at ${originX}px ${originY}px)`, `circle(${radius}px at ${originX}px ${originY}px)`] },
        {
          duration: 620,
          easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)',
          pseudoElement: '::view-transition-new(root)',
        } as KeyframeAnimationOptions,
      );
    });
  }, [theme]);

  const selectedNode = document.nodes.find((node) => node.id === selectedNodeIds[0]) ?? null;
  const selectedEdge = document.edges.find((edge) => edge.id === selectedEdgeIds[0]) ?? null;
  const selectedRouting = selectedEdge
    ? document.layout.edges[selectedEdge.id]?.routing ?? document.settings.defaultRouting
    : null;
  const activeArea = document.functionalAreas.find((area) => area.id === activeAreaId) ?? null;
  const selectedNodeAreaId = selectedNode
    ? document.functionalAreas.find((area) => area.nodeIds.includes(selectedNode.id))?.id ?? null
    : null;

  const clearSelection = useCallback(() => {
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
  }, []);

  const focusFunctionalArea = useCallback((areaId: string) => {
    const area = document.functionalAreas.find((candidate) => candidate.id === areaId);
    if (!area) return;
    const nodeIds = new Set(area.nodeIds);
    setActivePanel(null);
    setActiveAreaId(areaId);
    clearSelection();
    requestAnimationFrame(() => fitView({
      nodes: nodes.filter((node) => node.type === 'process' && nodeIds.has(node.id)),
      padding: 0.2,
      duration: 650,
      maxZoom: 1.15,
    }));
  }, [clearSelection, document.functionalAreas, fitView, nodes]);

  const showFunctionalOverview = useCallback(() => {
    setActivePanel(null);
    setActiveAreaId(null);
    clearSelection();
    requestAnimationFrame(() => fitView({
      nodes: nodes.filter((node) => node.type === 'functionalArea'),
      padding: 0.08,
      duration: 650,
    }));
  }, [clearSelection, fitView, nodes]);

  useEffect(() => {
    const nodeSelection = new Set(selectedNodeIds);
    const edgeSelection = new Set(selectedEdgeIds);
    const nextNodes = toCanvasNodes(document, document.layout.nodes, { activeAreaId }).map((node) => ({
      ...node,
      selected: node.type === 'process' && nodeSelection.has(node.id),
    }));
    setNodes(nextNodes);
    setEdges(toFlowEdges(document, { activeAreaId }).map((edge) => ({
      ...edge,
      selected: edgeSelection.has(edge.id),
    })));
    if (pendingFocusAreaId.current) {
      const areaId = pendingFocusAreaId.current;
      const area = document.functionalAreas.find((candidate) => candidate.id === areaId);
      pendingFocusAreaId.current = null;
      if (area) {
        const memberIds = new Set(area.nodeIds);
        requestAnimationFrame(() => requestAnimationFrame(() => fitView({
          nodes: nextNodes.filter((node) => node.type === 'process' && memberIds.has(node.id)),
          padding: 0.2,
          duration: 550,
          maxZoom: 1.15,
        })));
      }
    } else if (shouldFitView.current) {
      shouldFitView.current = false;
      requestAnimationFrame(() => requestAnimationFrame(() => fitView({ padding: 0.09, duration: 550 })));
    }
  }, [activeAreaId, document, fitView, selectedEdgeIds, selectedNodeIds, setEdges, setNodes]);

  useEffect(() => {
    setSelectedNodeIds((ids) => ids.filter((id) => document.nodes.some((node) => node.id === id)));
    setSelectedEdgeIds((ids) => ids.filter((id) => document.edges.some((edge) => edge.id === id)));
  }, [document.edges, document.nodes]);

  useEffect(() => {
    if (activeAreaId && !document.functionalAreas.some((area) => area.id === activeAreaId)) setActiveAreaId(null);
  }, [activeAreaId, document.functionalAreas]);

  useEffect(() => {
    onDocumentChange?.(document);
  }, [document, onDocumentChange]);

  const commit = useCallback((nextDocument: ProcessFlowDocument) => {
    dispatch({ type: 'commit', document: nextDocument });
  }, []);

  const applyLayout = useCallback(async (recordHistory = true) => {
    setIsLayingOut(true);
    const startedAt = performance.now();
    const laidOutDocument = await layoutProcessFlowDocument(document);
    shouldFitView.current = true;
    dispatch({ type: recordHistory ? 'commit' : 'replace', document: laidOutDocument });
    setOverlapCount(findNodeOverlaps(laidOutDocument.layout.nodes).length);
    setLayoutTime(Math.round(performance.now() - startedAt));
    setIsLayingOut(false);
  }, [document]);

  useEffect(() => {
    if (didInitialLayout.current) return;
    didInitialLayout.current = true;
    void applyLayout(false);
  }, [applyLayout]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (addAreaPickerOpen && event.key === 'Escape') {
        event.preventDefault();
        setAddAreaPickerOpen(false);
        return;
      }
      if (target?.matches('input, textarea, select')) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? 'redo' : 'undo' });
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        dispatch({ type: 'redo' });
      }
      if (activeAreaId && event.key === 'Escape') {
        event.preventDefault();
        showFunctionalOverview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAreaId, addAreaPickerOpen, showFunctionalOverview]);

  const handleSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }: OnSelectionChangeParams) => {
    const nextNodeIds = selectedNodes.filter((node) => node.type === 'process').map((node) => node.id);
    const nextEdgeIds = selectedEdges.map((edge) => edge.id);
    setSelectedNodeIds((previous) => sameIds(previous, nextNodeIds) ? previous : nextNodeIds);
    setSelectedEdgeIds((previous) => sameIds(previous, nextEdgeIds) ? previous : nextEdgeIds);
  }, []);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: FlowNode) => {
    if (node.type !== 'functionalArea') return;
    const areaId = node.id.replace(/^functional-area:/, '');
    focusFunctionalArea(areaId);
  }, [focusFunctionalArea]);

  const addDeviceToArea = useCallback((functionalAreaId: string) => {
    const targetArea = document.functionalAreas.find((area) => area.id === functionalAreaId);
    if (!targetArea) return;
    const id = createUniqueId('eq_new', document.nodes.map((node) => node.id));
    const size = { width: 188, height: 96 };
    const visibleCenter = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const areaLayouts = targetArea.nodeIds.flatMap((nodeId) => {
      const layout = document.layout.nodes[nodeId];
      return layout ? [layout] : [];
    });
    const position = activeAreaId === functionalAreaId || areaLayouts.length === 0
      ? { x: visibleCenter.x - size.width / 2, y: visibleCenter.y - size.height / 2 }
      : {
        x: Math.max(...areaLayouts.map((layout) => layout.x + layout.width)) + 80,
        y: areaLayouts.reduce((sum, layout) => sum + layout.y + layout.height / 2, 0) / areaLayouts.length - size.height / 2,
      };
    const node: ProcessNode = {
      id,
      kind: 'equipment',
      tag: null,
      name: '新建设备',
      equipmentType: '通用工艺设备',
      shapeKey: 'generic.process',
      quantity: 1,
      ports: [
        { id: 'in-1', direction: 'in', role: 'material' },
        { id: 'out-1', direction: 'out', role: 'material' },
      ],
      attributes: {},
    };
    pendingFocusAreaId.current = functionalAreaId;
    commit(addProcessNode(document, node, { ...position, ...size }, functionalAreaId));
    setActiveAreaId(functionalAreaId);
    setAddAreaPickerOpen(false);
    setSelectedNodeIds([id]);
    setSelectedEdgeIds([]);
  }, [activeAreaId, commit, document, screenToFlowPosition]);

  const handleAddNode = useCallback(() => {
    if (activeAreaId) {
      addDeviceToArea(activeAreaId);
      return;
    }
    setAddTargetAreaId(document.functionalAreas[0]?.id ?? '');
    setAddAreaPickerOpen(true);
  }, [activeAreaId, addDeviceToArea, document.functionalAreas]);

  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) return;
    const id = createUniqueId('flow_new', document.edges.map((edge) => edge.id));
    const edge: ProcessEdge = {
      id,
      source: { nodeId: connection.source, portId: connection.sourceHandle },
      target: { nodeId: connection.target, portId: connection.targetHandle },
      label: '新管线',
      streamType: 'main',
      material: { name: '新物料' },
      attributes: {},
    };
    commit(addProcessEdge(document, edge));
    setSelectedNodeIds([]);
    setSelectedEdgeIds([id]);
  }, [commit, document]);

  const handleReconnect = useCallback((oldEdge: FlowEdge, connection: Connection) => {
    if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) return;
    commit(reconnectProcessEdge(
      document,
      oldEdge.id,
      { nodeId: connection.source, portId: connection.sourceHandle },
      { nodeId: connection.target, portId: connection.targetHandle },
    ));
    setSelectedEdgeIds([oldEdge.id]);
  }, [commit, document]);

  const handleUpdateNode = useCallback((patch: Partial<Pick<ProcessNode, 'name' | 'tag' | 'equipmentType' | 'shapeKey' | 'quantity'>>) => {
    if (!selectedNode) return;
    commit(updateProcessNode(document, selectedNode.id, patch));
  }, [commit, document, selectedNode]);

  const handleMoveNodeToArea = useCallback((functionalAreaId: string) => {
    if (!selectedNode || functionalAreaId === selectedNodeAreaId) return;
    const targetArea = document.functionalAreas.find((area) => area.id === functionalAreaId);
    if (!targetArea) return;
    const targetLayouts = targetArea.nodeIds.flatMap((nodeId) => {
      const layout = document.layout.nodes[nodeId];
      return layout ? [layout] : [];
    });
    let reassigned = assignProcessNodeToFunctionalArea(document, selectedNode.id, functionalAreaId);
    if (targetLayouts.length > 0) {
      const currentLayout = document.layout.nodes[selectedNode.id];
      reassigned = moveProcessNode(reassigned, selectedNode.id, {
        x: Math.max(...targetLayouts.map((layout) => layout.x + layout.width)) + 80,
        y: targetLayouts.reduce((sum, layout) => sum + layout.y + layout.height / 2, 0) / targetLayouts.length
          - (currentLayout?.height ?? 96) / 2,
      });
    }
    pendingFocusAreaId.current = functionalAreaId;
    commit(reassigned);
    setActiveAreaId(functionalAreaId);
    setOverlapCount(findNodeOverlaps(reassigned.layout.nodes).length);
  }, [commit, document, selectedNode, selectedNodeAreaId]);

  const handleUpdateEdge = useCallback((patch: Partial<Pick<ProcessEdge, 'label' | 'streamType'>>) => {
    if (!selectedEdge) return;
    commit(updateProcessEdge(document, selectedEdge.id, patch));
  }, [commit, document, selectedEdge]);

  const handleSetRouting = useCallback((routing: Routing) => {
    if (!selectedEdge) return;
    commit(setProcessEdgeRouting(document, selectedEdge.id, routing));
  }, [commit, document, selectedEdge]);

  const handleDeleteNode = useCallback(() => {
    if (!selectedNode) return;
    commit(deleteProcessNode(document, selectedNode.id));
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
  }, [commit, document, selectedNode]);

  const handleDeleteEdge = useCallback(() => {
    if (!selectedEdge) return;
    commit(deleteProcessEdge(document, selectedEdge.id));
    setSelectedEdgeIds([]);
  }, [commit, document, selectedEdge]);

  const handleApplyJson = useCallback(async (text: string): Promise<ApplyJsonResult> => {
    const prepared = prepareProcessFlowJson(text);
    if (!prepared.ok) {
      return { ok: false, message: 'JSON 校验失败，当前画布未改变。', details: prepared.errors };
    }
    try {
      let nextDocument = prepared.document;
      if (prepared.needsLayout) {
        setIsLayingOut(true);
        nextDocument = await layoutProcessFlowDocument(nextDocument);
      }
      shouldFitView.current = true;
      commit(nextDocument);
      clearSelection();
      setOverlapCount(findNodeOverlaps(nextDocument.layout.nodes).length);
      return {
        ok: true,
        message: prepared.warnings.length ? 'JSON 已规范化并应用。' : 'JSON 校验通过并已应用。',
        details: prepared.warnings,
      };
    } catch (error) {
      return {
        ok: false,
        message: `JSON 布局失败，当前画布未改变：${error instanceof Error ? error.message : String(error)}`,
      };
    } finally {
      setIsLayingOut(false);
    }
  }, [clearSelection, commit]);

  const handleExportPng = useCallback(async (): Promise<ApplyJsonResult> => {
    const viewport = canvasShell.current?.querySelector<HTMLElement>('.react-flow__viewport');
    if (!viewport || !canvasShell.current) return { ok: false, message: '未找到可导出的画布。' };
    canvasShell.current.classList.add('is-exporting');
    try {
      const result = await renderCompleteCanvasPng(viewport, nodes);
      downloadDataUrl(result.dataUrl, `${safeFilename(document.title)}.png`);
      return { ok: true, message: `PNG 已导出：${result.width} × ${result.height}` };
    } catch (error) {
      return { ok: false, message: `PNG 导出失败：${error instanceof Error ? error.message : String(error)}` };
    } finally {
      canvasShell.current.classList.remove('is-exporting');
    }
  }, [document.title, nodes]);

  const handleGenerate = useCallback(async (description: string, provider?: CustomProviderConfig): Promise<GenerateApplyResult> => {
    const generated = await requestProcessFlowGeneration(description, provider);
    if (!generated.ok) {
      return {
        ok: false,
        message: `${generated.error.message} 当前画布未改变。`,
        details: generated.error.details,
      };
    }
    const applied = await handleApplyJson(JSON.stringify(generated.document));
    if (!applied.ok) return applied;
    return {
      ok: true,
      message: generated.meta.mode === 'mock' ? '演示流程已生成并进入画布。' : 'LLM 流程已生成并进入画布。',
      details: [...new Set([...generated.warnings, ...(applied.details ?? [])])],
      nodes: generated.document.nodes.length,
      edges: generated.document.edges.length,
      attempts: generated.meta.attempts,
      model: generated.meta.model,
      providerName: generated.meta.providerName,
      mode: generated.meta.mode,
    };
  }, [handleApplyJson]);

  const statusText = useMemo(() => {
    if (isLayingOut) return 'ELK 正在计算布局';
    if (overlapCount === 0) return '布局检查通过 · 无节点重叠';
    if (overlapCount === null) return '画布可编辑';
    return `检测到 ${overlapCount} 处重叠`;
  }, [isLayingOut, overlapCount]);

  return (
    <main className="workspace">
      <header className="toolbar">
        <div className="toolbar__leading">
          <div className="product-mark">
            <span className="product-mark__logo"><ProductLogo /></span>
            <h1>工艺流程可视化</h1>
          </div>
          <button type="button" className={`tool-button tool-button--quiet tool-button--data${activePanel === 'data' ? ' is-active' : ''}`} onClick={() => setActivePanel((panel) => panel === 'data' ? null : 'data')} title="数据与文件">
            <Database className="tool-button__icon" size={17} strokeWidth={1.8} aria-hidden="true" />
            <span className="tool-button__label">数据</span>
          </button>
        </div>
        <div className="toolbar__actions" aria-label="编辑命令">
          <button type="button" className={`tool-button${activePanel === 'generate' ? ' is-active' : ''}`} onClick={() => setActivePanel((panel) => panel === 'generate' ? null : 'generate')} title="从文本生成流程图">
            <span className="ai-tool-mark" aria-hidden="true"><Sparkles size={16} strokeWidth={2} /></span>
            <span className="tool-button__label">AI 生成</span>
          </button>
          <button type="button" className="tool-button tool-button--quiet" onClick={handleAddNode} title={activeArea ? `添加设备到“${activeArea.name}”` : '选择功能区并添加设备'} disabled={document.functionalAreas.length === 0}>
            <Plus className="tool-button__icon" size={17} strokeWidth={1.9} aria-hidden="true" /><span className="tool-button__label">添加设备</span>
          </button>
          <button type="button" className="tool-button tool-button--quiet" onClick={() => dispatch({ type: 'undo' })} disabled={history.past.length === 0} title="撤销 Ctrl+Z">
            <Undo2 className="tool-button__icon" size={17} strokeWidth={1.9} aria-hidden="true" /><span className="tool-button__label">撤销</span>
          </button>
          <button type="button" className="tool-button tool-button--quiet" onClick={() => dispatch({ type: 'redo' })} disabled={history.future.length === 0} title="重做 Ctrl+Y">
            <Redo2 className="tool-button__icon" size={17} strokeWidth={1.9} aria-hidden="true" /><span className="tool-button__label">重做</span>
          </button>
          <button type="button" className="tool-button tool-button--quiet" onClick={() => void applyLayout()} disabled={isLayingOut} title="重新布局">
            <Workflow className="tool-button__icon" size={17} strokeWidth={1.9} aria-hidden="true" /><span className="tool-button__label">{isLayingOut ? '布局中…' : '重新布局'}</span>
          </button>
          <button type="button" className="tool-button tool-button--quiet" onClick={() => fitView({ padding: 0.09, duration: 400 })} title="适应视图">
            <Maximize className="tool-button__icon" size={17} strokeWidth={1.9} aria-hidden="true" /><span className="tool-button__label">适应视图</span>
          </button>
          <button type="button" className={`tool-button tool-button--quiet${activeAreaId === null ? ' is-active' : ''}`} onClick={showFunctionalOverview} title="查看工艺功能区总览">
            <PanelsTopLeft className="tool-button__icon" size={17} strokeWidth={1.9} aria-hidden="true" /><span className="tool-button__label">功能区</span>
          </button>
        </div>
        <div className="toolbar__trailing">
          <div className="legend" aria-label="管线图例">
            <span><i className="legend__line legend__line--main" />主流程</span>
            <span><i className="legend__line legend__line--gas" />气相</span>
            <span><i className="legend__line legend__line--waste" />废物流</span>
          </div>
          <button type="button" className="theme-toggle" onClick={handleThemeToggle} aria-label={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'} title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}>
            {theme === 'light' ? <Moon size={18} strokeWidth={1.8} aria-hidden="true" /> : <Sun size={18} strokeWidth={1.8} aria-hidden="true" />}
          </button>
        </div>
      </header>

      <div className={`workspace-body${activePanel ? ' has-drawer' : ''}${activeAreaId === null ? ' is-overview' : ' is-area-detail'}${selectedNodeIds.length + selectedEdgeIds.length ? ' has-selection' : ''}`}>
        <section ref={canvasShell} className={`canvas-shell${isLayingOut ? ' is-laying-out' : ''}${activeAreaId === null ? ' is-overview' : ' is-area-detail'}`} aria-label="工艺流程可视化画布">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={(_, node) => {
              if (node.type === 'process') commit(moveProcessNode(document, node.id, node.position));
            }}
            onNodeClick={handleNodeClick}
            onConnect={handleConnect}
            onReconnect={handleReconnect}
            onSelectionChange={handleSelectionChange}
            onPaneClick={clearSelection}
            minZoom={0.04}
            maxZoom={1.8}
            nodesDraggable={activeAreaId !== null}
            nodesConnectable={activeAreaId !== null}
            edgesReconnectable={activeAreaId !== null}
            connectionMode={ConnectionMode.Strict}
            selectionOnDrag
            panOnScroll={false}
            zoomOnScroll
            deleteKeyCode={null}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#cad1cc" />
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) => {
                if (node.type === 'functionalArea') return '#b6c8c1';
                return (node.data as ProcessNodeData).processNode.kind === 'equipment' ? '#6f8d85' : '#aab5b0';
              }}
              maskColor="rgba(238, 241, 237, 0.78)"
            />
            <Controls showInteractive={false} />
          </ReactFlow>
          {addAreaPickerOpen ? (
            <div className="add-device-dialog__backdrop" role="presentation" onMouseDown={() => setAddAreaPickerOpen(false)}>
              <section className="add-device-dialog" role="dialog" aria-modal="true" aria-labelledby="add-device-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
                <span className="panel-kicker">添加设备</span>
                <h2 id="add-device-dialog-title">选择所属功能区</h2>
                <p>设备必须归入一个已有功能区；添加后仍可在属性面板中调整。</p>
                <label className="field">
                  <span>目标功能区</span>
                  <select autoFocus value={addTargetAreaId} onChange={(event) => setAddTargetAreaId(event.target.value)}>
                    {document.functionalAreas.map((area) => <option value={area.id} key={area.id}>{area.name}</option>)}
                  </select>
                </label>
                <div className="add-device-dialog__actions">
                  <button type="button" onClick={() => setAddAreaPickerOpen(false)}>取消</button>
                  <button type="button" className="is-primary" disabled={!addTargetAreaId} onClick={() => addDeviceToArea(addTargetAreaId)}>添加到该功能区</button>
                </div>
              </section>
            </div>
          ) : null}
          {isLayingOut ? (
            <div className="layout-indicator" role="status">
              <span className="layout-indicator__pulse" />
              计算 {document.nodes.length} 个节点的无重叠位置
            </div>
          ) : null}
          <nav className={`area-view-bar${activeArea ? ' is-detail' : ''}`} aria-label="工艺功能区视图控制">
            {activeArea ? (
              <>
                <button type="button" onClick={showFunctionalOverview}>← 返回功能区总览</button>
                <strong>{activeArea.name}</strong>
                <span>{activeArea.nodeIds.length} 个流程节点</span>
              </>
            ) : (
              <>
                <strong>{document.functionalAreas.length} 个工艺功能区</strong>
                <span>点击粗虚线区域查看设备、物料与连接</span>
              </>
            )}
          </nav>
        </section>

        <PropertyPanel
          node={selectedNode}
          edge={selectedEdge}
          routing={selectedRouting}
          functionalAreas={document.functionalAreas}
          nodeAreaId={selectedNodeAreaId}
          onUpdateNode={handleUpdateNode}
          onMoveNodeToArea={handleMoveNodeToArea}
          onUpdateEdge={handleUpdateEdge}
          onSetRouting={handleSetRouting}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
          onClose={clearSelection}
        />
        <DataPanel
          open={activePanel === 'data'}
          document={document}
          onApplyJson={handleApplyJson}
          onExportPng={handleExportPng}
          onClose={() => setActivePanel(null)}
        />
        <GeneratePanel
          open={activePanel === 'generate'}
          onGenerate={handleGenerate}
          onClose={() => setActivePanel(null)}
        />
      </div>

      <footer className="statusbar">
        <div className="statusbar__state">
          <span className={`status-dot${overlapCount === 0 ? ' is-valid' : ''}`} />
          <strong>{statusText}</strong>
          {layoutTime !== null ? <span>{layoutTime} ms</span> : null}
        </div>
        <div className="statusbar__metrics">
          <span><strong>{document.nodes.length}</strong> 节点</span>
          <span><strong>{document.edges.length}</strong> 管线</span>
          <span><strong>{selectedNodeIds.length + selectedEdgeIds.length}</strong> 已选择</span>
          <span>{history.past.length} 步可撤销</span>
        </div>
      </footer>
    </main>
  );
}

export function ProcessCanvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
