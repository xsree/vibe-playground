import processData from '../../pendimethalin-process.test.json';
import { ProcessCanvas } from '../editor/ProcessCanvas';
import { checkGraph } from '../model/graphChecks';
import { validateProcessFlow } from '../schema/validate';
import { useCallback, useState } from 'react';
import { prepareProcessFlowJson } from '../import-export/json';
import type { ProcessFlowDocument } from '../model/types';

const STORAGE_KEY = 'process-flow-visualizer:draft:v5';

function loadInitialDocument() {
  const fallback = validateProcessFlow(processData);
  if (!fallback.valid) return fallback;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return fallback;
    const prepared = prepareProcessFlowJson(stored);
    if (!prepared.ok) return fallback;
    const sampleHasRicherAreas = prepared.document.title === fallback.document.title
      && prepared.document.functionalAreas.length < fallback.document.functionalAreas.length;
    if (sampleHasRicherAreas) {
      return fallback;
    }
    return { valid: true as const, document: prepared.document, errors: [] as [] };
  } catch {
    return fallback;
  }
}

export function App() {
  const [validation] = useState(loadInitialDocument);
  const saveDraft = useCallback((document: ProcessFlowDocument) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
    } catch {
      // 本地存储不可用时不影响编辑器继续工作。
    }
  }, []);
  if (!validation.valid) {
    return (
      <main className="fatal-state">
        <span>数据校验失败</span>
        <h1>测试 JSON 暂时无法加载</h1>
        <pre>{JSON.stringify(validation.errors, null, 2)}</pre>
      </main>
    );
  }

  const graphErrors = checkGraph(validation.document).filter((issue) => issue.severity === 'error');
  if (graphErrors.length > 0) {
    return (
      <main className="fatal-state">
        <span>图引用检查失败</span>
        <h1>管线端点需要修正</h1>
        <pre>{graphErrors.map((issue) => issue.message).join('\n')}</pre>
      </main>
    );
  }

  return <ProcessCanvas document={validation.document} onDocumentChange={saveDraft} />;
}
