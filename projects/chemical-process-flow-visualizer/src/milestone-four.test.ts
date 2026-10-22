import { describe, expect, it } from 'vitest';
import { processGeneratePayload, processModelsPayload } from '../server/api';
import { generateProcessFlow, mockModelCall, type ModelCall } from '../server/generate';
import { parseProviderConfig, ProviderConfigurationError } from '../server/provider';
import { checkGraph } from './model/graphChecks';
import { validateProcessFlow } from './schema/validate';

const description = '将液体原料送入 R101 搅拌反应釜，反应结束后进入过滤设备，固体送产品收集，母液送处理系统。';

const invalidCandidate = {
  schemaVersion: '1.0',
  title: '无效引用流程',
  description: null,
  functionalAreas: [
    { id: 'area_invalid', name: '无效功能区', description: '用于验证引用错误。', nodeIds: ['src_feed'] },
  ],
  nodes: [
    {
      id: 'src_feed', kind: 'source', tag: null, name: '原料', equipmentType: null,
      shapeKey: 'boundary.source', quantity: 1,
      ports: [{ id: 'out-1', direction: 'out', role: 'material', label: null }], attributes: {},
    },
  ],
  edges: [
    {
      id: 'flow_001', source: { nodeId: 'src_feed', portId: 'out-1' },
      target: { nodeId: 'missing_node', portId: 'in-1' }, label: '原料', streamType: 'main',
      material: { name: '原料', phase: 'liquid', components: [] }, attributes: {},
    },
  ],
};

describe('MVP 里程碑四', () => {
  it('本地演示生成器返回可校验、可编辑的流程文档', async () => {
    const result = await generateProcessFlow(description, { mock: true });
    expect(result.mode).toBe('mock');
    expect(result.attempts).toBe(1);
    expect(result.document.nodes).toHaveLength(5);
    expect(result.document.edges).toHaveLength(4);
    expect(validateProcessFlow(result.document).valid).toBe(true);
    expect(checkGraph(result.document).filter((issue) => issue.severity === 'error')).toHaveLength(0);
  });

  it('首次输出引用无效时携带错误自动修复重试', async () => {
    const calls: Array<{ attempt: number; errors?: string[] }> = [];
    const callModel: ModelCall = async (context) => {
      calls.push({ attempt: context.attempt, errors: context.errors });
      return context.attempt === 1 ? invalidCandidate : mockModelCall(context);
    };
    const result = await generateProcessFlow(description, { callModel, maxAttempts: 3 });
    expect(result.attempts).toBe(2);
    expect(calls[1].errors?.join(' ')).toContain('missing_node');
    expect(result.document.nodes).toHaveLength(5);
  });

  it('三次无效输出后返回明确错误且不返回候选文档', async () => {
    const response = await processGeneratePayload(
      { description },
      { callModel: async () => invalidCandidate, maxAttempts: 3 },
    );
    expect(response.status).toBe(422);
    expect(response.body.ok).toBe(false);
    expect(response.body).not.toHaveProperty('document');
    expect(JSON.stringify(response.body)).toContain('missing_node');
  });

  it('缺少服务端密钥时返回配置错误而不是在浏览器暴露密钥', async () => {
    const response = await processGeneratePayload({ description }, { apiKey: undefined, mock: false });
    expect(response.status).toBe(503);
    expect(response.body.ok).toBe(false);
    expect(JSON.stringify(response.body)).toContain('OPENAI_API_KEY');
  });

  it('校验 OpenAI 兼容服务商配置并拒绝非 HTTP Base URL', () => {
    const provider = parseProviderConfig({
      name: '内部模型网关',
      baseUrl: 'https://models.example.com/v1/',
      apiType: 'openai-compatible',
      apiKey: 'test-key',
      model: 'process-model',
      reasoningEffort: 'high',
    });
    expect(provider.baseUrl).toBe('https://models.example.com/v1');
    expect(provider.reasoningEffort).toBe('high');
    expect(() => parseProviderConfig({ ...provider, baseUrl: 'file:///tmp/models' })).toThrow(ProviderConfigurationError);
  });

  it('模型列表接口使用已校验配置并返回服务商模型', async () => {
    const response = await processModelsPayload({
      provider: {
        name: '测试服务商',
        baseUrl: 'http://127.0.0.1:9999/v1',
        apiType: 'openai-compatible',
        apiKey: 'test-key',
        model: '',
        reasoningEffort: 'medium',
      },
    }, async (provider) => {
      expect(provider.name).toBe('测试服务商');
      expect(provider.model).toBe('');
      return ['model-a', 'model-b'];
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, models: ['model-a', 'model-b'] });
  });
});
