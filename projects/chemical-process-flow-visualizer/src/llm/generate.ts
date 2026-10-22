import type { ProcessFlowDocument } from '../model/types';
import type { CustomProviderConfig } from './types';

interface GenerateSuccess {
  ok: true;
  document: ProcessFlowDocument;
  warnings: string[];
  meta: { attempts: number; model: string; mode: 'openai' | 'compatible' | 'mock'; providerName?: string };
}

interface GenerateFailure {
  ok: false;
  error: { code: string; message: string; details?: string[] };
}

export type GenerateResponse = GenerateSuccess | GenerateFailure;

interface ModelsSuccess { ok: true; models: string[] }
interface ModelsFailure { ok: false; error: { code: string; message: string } }
export type ModelsResponse = ModelsSuccess | ModelsFailure;

async function postJson<T>(url: string, body: unknown, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return await response.json() as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function requestProcessFlowGeneration(description: string, provider?: CustomProviderConfig): Promise<GenerateResponse> {
  try {
    return await postJson<GenerateResponse>('/api/generate', { description, ...(provider ? { provider } : {}) }, 120_000);
  } catch (error) {
    return {
      ok: false,
      error: {
        code: error instanceof DOMException && error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
        message: error instanceof DOMException && error.name === 'AbortError'
          ? '生成请求超过 120 秒，当前画布未改变。'
          : `无法连接生成服务：${error instanceof Error ? error.message : String(error)}`,
      },
    };
  }
}

export async function requestProviderModels(provider: CustomProviderConfig): Promise<ModelsResponse> {
  try {
    return await postJson<ModelsResponse>('/api/models', { provider }, 30_000);
  } catch (error) {
    return {
      ok: false,
      error: {
        code: error instanceof DOMException && error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
        message: error instanceof DOMException && error.name === 'AbortError'
          ? '获取模型列表超时。'
          : `无法获取模型列表：${error instanceof Error ? error.message : String(error)}`,
      },
    };
  }
}
