import { generateProcessFlow, GenerationError, type GenerateOptions } from './generate';
import { createCompatibleModelCall, listCompatibleModels, parseProviderConfig, ProviderConfigurationError } from './provider';

export interface ApiResult {
  status: number;
  body: Record<string, unknown>;
}

export async function processGeneratePayload(payload: unknown, options: GenerateOptions = {}): Promise<ApiResult> {
  const rawPayload = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const description = 'description' in rawPayload
    ? String(rawPayload.description ?? '')
    : '';
  try {
    let resolvedOptions = options;
    if (rawPayload.provider) {
      const provider = parseProviderConfig(rawPayload.provider);
      resolvedOptions = {
        ...options,
        apiKey: undefined,
        mock: false,
        mode: 'compatible',
        model: provider.model,
        providerName: provider.name,
        callModel: createCompatibleModelCall(provider),
      };
    }
    const result = await generateProcessFlow(description, resolvedOptions);
    return {
      status: 200,
      body: {
        ok: true,
        document: result.document,
        warnings: result.warnings,
        meta: { attempts: result.attempts, model: result.model, mode: result.mode, providerName: result.providerName },
      },
    };
  } catch (error) {
    const generationError = error instanceof GenerationError
      ? error
      : error instanceof ProviderConfigurationError
        ? new GenerationError('INVALID_INPUT', error.message)
      : new GenerationError('MODEL_ERROR', error instanceof Error ? error.message : String(error));
    const status = generationError.code === 'INVALID_INPUT' ? 400
      : generationError.code === 'CONFIGURATION' ? 503
        : generationError.code === 'INVALID_OUTPUT' ? 422
          : 502;
    return {
      status,
      body: {
        ok: false,
        error: { code: generationError.code, message: generationError.message, details: generationError.details },
      },
    };
  }
}

export async function processModelsPayload(
  payload: unknown,
  listModels: (provider: ReturnType<typeof parseProviderConfig>) => Promise<string[]> = listCompatibleModels,
): Promise<ApiResult> {
  try {
    const raw = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
    const provider = parseProviderConfig(raw.provider, false);
    const models = await listModels(provider);
    return { status: 200, body: { ok: true, models } };
  } catch (error) {
    const status = error instanceof ProviderConfigurationError ? 400 : 502;
    return {
      status,
      body: {
        ok: false,
        error: {
          code: error instanceof ProviderConfigurationError ? 'INVALID_PROVIDER' : 'MODEL_LIST_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
      },
    };
  }
}

export function generateOptionsFromEnvironment(environment: NodeJS.ProcessEnv, developmentFallback = false): GenerateOptions {
  const explicitMock = environment.PROCESS_FLOW_LLM_MOCK === '1';
  const mock = explicitMock || (developmentFallback && !environment.OPENAI_API_KEY);
  return {
    apiKey: environment.OPENAI_API_KEY,
    model: environment.OPENAI_MODEL || 'gpt-5.4-mini',
    mock,
  };
}
