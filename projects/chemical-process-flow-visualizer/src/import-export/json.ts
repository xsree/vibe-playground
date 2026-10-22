import type { ProcessFlowDocument } from '../model/types';
import { checkGraph } from '../model/graphChecks';
import { normalizeProcessFlow } from '../model/normalize';
import { validateProcessFlow } from '../schema/validate';

export type PreparedJsonResult =
  | { ok: true; document: ProcessFlowDocument; warnings: string[]; needsLayout: boolean }
  | { ok: false; errors: string[] };

export function prepareProcessFlowJson(text: string): PreparedJsonResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { ok: false, errors: [`JSON 解析失败：${error instanceof Error ? error.message : String(error)}`] };
  }

  const normalized = normalizeProcessFlow(parsed);
  const validation = validateProcessFlow(normalized.document);
  if (!validation.valid) {
    return {
      ok: false,
      errors: validation.errors.map((error) => `${error.instancePath || '/'} ${error.message ?? '格式不正确'}`),
    };
  }

  const graphIssues = checkGraph(validation.document);
  const errors = graphIssues.filter((issue) => issue.severity === 'error').map((issue) => issue.message);
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    document: validation.document,
    warnings: [
      ...normalized.warnings,
      ...graphIssues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message),
    ],
    needsLayout: normalized.needsLayout,
  };
}

export function serializeProcessFlow(document: ProcessFlowDocument): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}
