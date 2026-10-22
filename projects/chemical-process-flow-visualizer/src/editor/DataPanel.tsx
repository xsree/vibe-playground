import { useEffect, useRef, useState } from 'react';
import type { ProcessFlowDocument } from '../model/types';
import { downloadText, safeFilename } from '../import-export/download';
import { serializeProcessFlow } from '../import-export/json';

export interface ApplyJsonResult {
  ok: boolean;
  message: string;
  details?: string[];
}

interface DataPanelProps {
  open: boolean;
  document: ProcessFlowDocument;
  onApplyJson: (text: string) => Promise<ApplyJsonResult>;
  onExportPng: () => Promise<ApplyJsonResult>;
  onClose: () => void;
}

export function DataPanel({ open, document, onApplyJson, onExportPng, onClose }: DataPanelProps) {
  const [text, setText] = useState(() => serializeProcessFlow(document));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ApplyJsonResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || dirty) return;
    setText(serializeProcessFlow(document));
  }, [dirty, document, open]);

  const apply = async (nextText = text) => {
    setBusy(true);
    try {
      const nextResult = await onApplyJson(nextText);
      setResult(nextResult);
      if (nextResult.ok) setDirty(false);
    } catch (error) {
      setResult({
        ok: false,
        message: error instanceof Error ? error.message : '应用 JSON 时发生未知错误。',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const nextText = await file.text();
      setText(nextText);
      setDirty(true);
      await apply(nextText);
    } catch (error) {
      setResult({ ok: false, message: `读取文件失败：${error instanceof Error ? error.message : String(error)}` });
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const reset = () => {
    setText(serializeProcessFlow(document));
    setDirty(false);
    setResult(null);
  };

  const saveJson = () => {
    try {
      const filename = `${safeFilename(document.title)}.json`;
      downloadText(serializeProcessFlow(document), filename);
      setResult({ ok: true, message: `JSON 已保存：${filename}` });
    } catch (error) {
      setResult({
        ok: false,
        message: `JSON 保存失败：${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  return (
    <aside className={`data-panel${open ? ' is-open' : ''}`} aria-label="数据与文件" aria-hidden={!open}>
      <div className="data-panel__header">
        <div>
          <span className="inspector__index">DATA · 03</span>
          <h2>数据与文件</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="关闭数据面板">×</button>
      </div>

      <div className="data-panel__body">
        <div className="data-panel__summary">
          <div><strong>{document.nodes.length}</strong><span>节点</span></div>
          <div><strong>{document.edges.length}</strong><span>管线</span></div>
          <div><strong>1.0</strong><span>Schema</span></div>
        </div>

        <div className="json-editor__heading">
          <label htmlFor="process-json">ProcessFlowDocument</label>
          <span>{dirty ? '有未应用修改' : '与画布同步'}</span>
        </div>
        <textarea
          id="process-json"
          className="json-editor"
          value={text}
          spellCheck={false}
          onChange={(event) => {
            setText(event.target.value);
            setDirty(true);
            setResult(null);
          }}
        />

        {result ? (
          <div className={`data-result${result.ok ? ' is-success' : ' is-error'}`} role="status">
            <strong>{result.message}</strong>
            {result.details?.length ? (
              <ul>{result.details.slice(0, 8).map((detail) => <li key={detail}>{detail}</li>)}</ul>
            ) : null}
          </div>
        ) : (
          <p className="data-panel__hint">无效 JSON 不会覆盖当前画布。导入缺少布局的数据时会自动运行 ELK。</p>
        )}

        <div className="data-panel__actions">
          <button type="button" className="data-action data-action--primary" disabled={busy || !dirty} onClick={() => void apply()}>
            {busy ? '处理中…' : '校验并应用'}
          </button>
          <button type="button" className="data-action" disabled={busy} onClick={() => fileInput.current?.click()}>从文件导入</button>
          <button type="button" className="data-action" disabled={busy || !dirty} onClick={reset}>放弃修改</button>
        </div>

        <div className="data-panel__divider" />
        <div className="file-actions">
          <button
            type="button"
            onClick={saveJson}
          >
            <span aria-hidden="true">↓</span><span><strong>保存 JSON</strong><small>语义、位置与路由</small></span>
          </button>
          <button type="button" disabled={busy} onClick={() => {
            setBusy(true);
            void onExportPng().then(setResult).finally(() => setBusy(false));
          }}>
            <span aria-hidden="true">▧</span><span><strong>{busy ? '正在导出…' : '导出 PNG'}</strong><small>完整画布，不限当前视口</small></span>
          </button>
        </div>

        <div className="autosave-state"><i />浏览器本地草稿自动保存</div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </div>
    </aside>
  );
}
