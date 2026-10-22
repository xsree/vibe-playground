import OpenAI from 'openai';
import { checkGraph } from '../src/model/graphChecks';
import { normalizeProcessFlow } from '../src/model/normalize';
import { validateProcessFlow } from '../src/schema/validate';
import type { ProcessFlowDocument } from '../src/model/types';
import { PROCESS_FLOW_GENERATION_SCHEMA } from './generationSchema';
import { buildGenerationInput, PROCESS_FLOW_SYSTEM_PROMPT } from './prompt';

export type GenerationMode = 'openai' | 'compatible' | 'mock';

export interface ModelCallContext {
  description: string;
  attempt: number;
  previous?: unknown;
  errors?: string[];
}

export type ModelCall = (context: ModelCallContext) => Promise<unknown>;

export interface GenerateOptions {
  apiKey?: string;
  model?: string;
  mock?: boolean;
  maxAttempts?: number;
  callModel?: ModelCall;
  mode?: GenerationMode;
  providerName?: string;
}

export interface GeneratedProcessFlow {
  document: ProcessFlowDocument;
  warnings: string[];
  attempts: number;
  model: string;
  mode: GenerationMode;
  providerName?: string;
}

export class GenerationError extends Error {
  constructor(
    public readonly code: 'INVALID_INPUT' | 'CONFIGURATION' | 'MODEL_ERROR' | 'INVALID_OUTPUT',
    message: string,
    public readonly details: string[] = [],
  ) {
    super(message);
  }
}

function validateCandidate(candidate: unknown): { ok: true; document: ProcessFlowDocument; warnings: string[] } | { ok: false; errors: string[] } {
  const raw = candidate && typeof candidate === 'object' ? candidate as Record<string, unknown> : {};
  const normalized = normalizeProcessFlow({
    ...raw,
    schemaVersion: '1.0',
    layout: { mode: 'auto', algorithm: 'layered', direction: 'RIGHT', nodes: {}, edges: {} },
    settings: { defaultRouting: 'orthogonal', nodeSpacing: 80, layerSpacing: 160, preventNodeOverlap: true },
  });
  const validation = validateProcessFlow(normalized.document);
  if (!validation.valid) {
    return {
      ok: false,
      errors: validation.errors.map((error) => `${error.instancePath || '/'} ${error.message ?? '格式错误'}`),
    };
  }
  const graphErrors = checkGraph(validation.document)
    .filter((issue) => issue.severity === 'error')
    .map((issue) => issue.message);
  if (graphErrors.length) return { ok: false, errors: graphErrors };
  return { ok: true, document: validation.document, warnings: normalized.warnings };
}

export function createOpenAIModelCall(apiKey: string, model: string): ModelCall {
  const client = new OpenAI({ apiKey });
  return async ({ description, previous, errors }) => {
    const response = await client.responses.create({
      model,
      instructions: PROCESS_FLOW_SYSTEM_PROMPT,
      input: buildGenerationInput(description, previous && errors ? { previous, errors } : undefined),
      text: {
        format: {
          type: 'json_schema',
          name: 'process_flow_document',
          strict: true,
          schema: PROCESS_FLOW_GENERATION_SCHEMA,
        },
      },
      store: false,
    });
    if (!response.output_text) throw new Error('模型没有返回结构化文本。');
    return JSON.parse(response.output_text) as unknown;
  };
}

export const mockModelCall: ModelCall = async ({ description }) => ({
  schemaVersion: '1.0',
  title: description.includes('结晶') ? '结晶分离工艺流程' : '文本生成示例流程',
  description,
  functionalAreas: [
    { id: 'area_reaction', name: '进料与反应', description: '原料进入反应设备完成主要反应。', nodeIds: ['src_feed', 'eq_R101'] },
    { id: 'area_separation', name: '分离与收集', description: '反应液完成固液分离并分别进入产品和母液去向。', nodeIds: ['eq_M102', 'sink_product', 'sink_mother_liquor'] },
  ],
  nodes: [
    { id: 'src_feed', kind: 'source', tag: null, name: '原料', equipmentType: null, shapeKey: 'boundary.source', quantity: 1, ports: [{ id: 'out-1', direction: 'out', role: 'material', label: '原料出口' }], attributes: {} },
    { id: 'eq_R101', kind: 'equipment', tag: 'R101', name: '反应釜', equipmentType: '搅拌反应釜', shapeKey: 'vessel.stirred', quantity: 1, ports: [{ id: 'in-1', direction: 'in', role: 'material', label: '进料' }, { id: 'out-1', direction: 'out', role: 'material', label: '反应液' }], attributes: {} },
    { id: 'eq_M102', kind: 'equipment', tag: 'M102', name: '固液分离设备', equipmentType: '过滤设备', shapeKey: 'separator.solid-liquid', quantity: 1, ports: [{ id: 'in-1', direction: 'in', role: 'material', label: '混合物' }, { id: 'out-product', direction: 'out', role: 'product', label: '产品' }, { id: 'out-waste', direction: 'out', role: 'waste', label: '母液' }], attributes: {} },
    { id: 'sink_product', kind: 'sink', tag: null, name: '产品收集', equipmentType: null, shapeKey: 'boundary.sink', quantity: 1, ports: [{ id: 'in-1', direction: 'in', role: 'product', label: '产品入口' }], attributes: {} },
    { id: 'sink_mother_liquor', kind: 'sink', tag: null, name: '母液处理', equipmentType: null, shapeKey: 'boundary.sink', quantity: 1, ports: [{ id: 'in-1', direction: 'in', role: 'waste', label: '母液入口' }], attributes: {} },
  ],
  edges: [
    { id: 'flow_001', source: { nodeId: 'src_feed', portId: 'out-1' }, target: { nodeId: 'eq_R101', portId: 'in-1' }, label: '原料', streamType: 'feed', material: { name: '原料', phase: 'liquid', components: [] }, attributes: {} },
    { id: 'flow_002', source: { nodeId: 'eq_R101', portId: 'out-1' }, target: { nodeId: 'eq_M102', portId: 'in-1' }, label: '反应液', streamType: 'main', material: { name: '反应液', phase: 'mixed', components: [] }, attributes: {} },
    { id: 'flow_003', source: { nodeId: 'eq_M102', portId: 'out-product' }, target: { nodeId: 'sink_product', portId: 'in-1' }, label: '产品', streamType: 'product', material: { name: '产品', phase: 'solid', components: [] }, attributes: {} },
    { id: 'flow_004', source: { nodeId: 'eq_M102', portId: 'out-waste' }, target: { nodeId: 'sink_mother_liquor', portId: 'in-1' }, label: '母液', streamType: 'waste', material: { name: '母液', phase: 'liquid', components: [] }, attributes: {} },
  ],
});

export async function generateProcessFlow(description: string, options: GenerateOptions = {}): Promise<GeneratedProcessFlow> {
  const cleanDescription = description.trim();
  if (cleanDescription.length < 20) throw new GenerationError('INVALID_INPUT', '工艺描述至少需要 20 个字符。');
  if (cleanDescription.length > 20000) throw new GenerationError('INVALID_INPUT', '工艺描述不能超过 20,000 个字符。');

  const model = options.model ?? 'gpt-5.4-mini';
  const mode: GenerationMode = options.mode ?? (options.mock ? 'mock' : 'openai');
  const callModel = options.callModel
    ?? (options.mock ? mockModelCall : options.apiKey ? createOpenAIModelCall(options.apiKey, model) : null);
  if (!callModel) throw new GenerationError('CONFIGURATION', '服务端未配置 OPENAI_API_KEY，当前画布未改变。');

  const maxAttempts = Math.min(3, Math.max(1, options.maxAttempts ?? 3));
  let previous: unknown;
  let errors: string[] = [];
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      previous = await callModel({ description: cleanDescription, attempt, previous, errors });
    } catch (error) {
      throw new GenerationError('MODEL_ERROR', `LLM 请求失败：${error instanceof Error ? error.message : String(error)}`);
    }
    const checked = validateCandidate(previous);
    if (checked.ok) {
      return { document: checked.document, warnings: checked.warnings, attempts: attempt, model, mode, providerName: options.providerName };
    }
    errors = checked.errors;
  }
  throw new GenerationError('INVALID_OUTPUT', `LLM 输出在 ${maxAttempts} 次尝试后仍未通过校验。`, errors);
}
