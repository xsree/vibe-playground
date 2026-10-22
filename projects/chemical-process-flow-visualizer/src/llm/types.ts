export type CompatibleApiType = 'openai-compatible';
export type ReasoningEffort = 'none' | 'low' | 'medium' | 'high' | 'xhigh';

export interface CustomProviderConfig {
  name: string;
  baseUrl: string;
  apiType: CompatibleApiType;
  apiKey: string;
  model: string;
  reasoningEffort: ReasoningEffort;
}
