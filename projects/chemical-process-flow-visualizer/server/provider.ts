import OpenAI from 'openai';
import type { CustomProviderConfig, ReasoningEffort } from '../src/llm/types';
import { PROCESS_FLOW_GENERATION_SCHEMA } from './generationSchema';
import { buildGenerationInput, PROCESS_FLOW_SYSTEM_PROMPT } from './prompt';
import type { ModelCall } from './generate';

const reasoningEfforts = new Set<ReasoningEffort>(['none', 'low', 'medium', 'high', 'xhigh']);

export class ProviderConfigurationError extends Error {}

export function parseProviderConfig(value: unknown, requireModel = true): CustomProviderConfig {
  if (!value || typeof value !== 'object') throw new ProviderConfigurationError('缺少自定义服务商配置。');
  const raw = value as Record<string, unknown>;
  const name = String(raw.name ?? '').trim();
  const baseUrlInput = String(raw.baseUrl ?? '').trim();
  const apiType = String(raw.apiType ?? '');
  const apiKey = String(raw.apiKey ?? '').trim();
  const model = String(raw.model ?? '').trim();
  const reasoningEffort = String(raw.reasoningEffort ?? 'none') as ReasoningEffort;

  if (!name || name.length > 80) throw new ProviderConfigurationError('服务商名称不能为空且不能超过 80 个字符。');
  let baseUrl: URL;
  try {
    baseUrl = new URL(baseUrlInput);
  } catch {
    throw new ProviderConfigurationError('Base URL 不是有效网址。');
  }
  if (baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') {
    throw new ProviderConfigurationError('Base URL 仅支持 http 或 https。');
  }
  if (apiType !== 'openai-compatible') throw new ProviderConfigurationError('当前只支持 OpenAI 兼容接口。');
  if (!apiKey || apiKey.length > 10000) throw new ProviderConfigurationError('API Key 不能为空。');
  if (requireModel && !model) throw new ProviderConfigurationError('请选择或填写模型名称。');
  if (!reasoningEfforts.has(reasoningEffort)) throw new ProviderConfigurationError('思考强度选项无效。');

  return {
    name,
    baseUrl: baseUrl.toString().replace(/\/$/, ''),
    apiType: 'openai-compatible',
    apiKey,
    model,
    reasoningEffort,
  };
}

export function createCompatibleModelCall(provider: CustomProviderConfig): ModelCall {
  const client = new OpenAI({ apiKey: provider.apiKey, baseURL: provider.baseUrl });
  return async ({ description, previous, errors }) => {
    const request: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming & { reasoning_effort?: ReasoningEffort } = {
      model: provider.model,
      messages: [
        { role: 'system', content: PROCESS_FLOW_SYSTEM_PROMPT },
        { role: 'user', content: buildGenerationInput(description, previous && errors ? { previous, errors } : undefined) },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'process_flow_document',
          strict: true,
          schema: PROCESS_FLOW_GENERATION_SCHEMA,
        },
      },
    };
    if (provider.reasoningEffort !== 'none') request.reasoning_effort = provider.reasoningEffort;
    const response = await client.chat.completions.create(request);
    const content = response.choices[0]?.message.content;
    if (!content) throw new Error('服务商没有返回结构化文本。');
    return JSON.parse(content) as unknown;
  };
}

export async function listCompatibleModels(provider: CustomProviderConfig): Promise<string[]> {
  const client = new OpenAI({ apiKey: provider.apiKey, baseURL: provider.baseUrl });
  const models: string[] = [];
  for await (const model of await client.models.list()) {
    if (model.id) models.push(model.id);
    if (models.length >= 500) break;
  }
  return [...new Set(models)].sort((first, second) => first.localeCompare(second));
}
