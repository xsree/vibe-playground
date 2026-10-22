import { useState } from 'react';
import { requestProviderModels } from '../llm/generate';
import type { CustomProviderConfig, ReasoningEffort } from '../llm/types';

export interface GenerateApplyResult {
  ok: boolean;
  message: string;
  details?: string[];
  nodes?: number;
  edges?: number;
  attempts?: number;
  model?: string;
  providerName?: string;
  mode?: 'openai' | 'compatible' | 'mock';
}

interface GeneratePanelProps {
  open: boolean;
  onGenerate: (description: string, provider?: CustomProviderConfig) => Promise<GenerateApplyResult>;
  onClose: () => void;
}

const EXAMPLE_DESCRIPTION = `将液体原料送入 R101 搅拌反应釜进行反应，反应液进入 M102 固液分离设备。固体产品送至产品收集，分离母液送往母液处理系统。`;

const INITIAL_PROVIDER: CustomProviderConfig = {
  name: '',
  baseUrl: 'https://api.openai.com/v1',
  apiType: 'openai-compatible',
  apiKey: '',
  model: '',
  reasoningEffort: 'medium',
};

const REASONING_OPTIONS: Array<{ value: ReasoningEffort; label: string }> = [
  { value: 'none', label: '不启用' },
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'xhigh', label: '极高' },
];

export function GeneratePanel({ open, onGenerate, onClose }: GeneratePanelProps) {
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GenerateApplyResult | null>(null);
  const [customProviderEnabled, setCustomProviderEnabled] = useState(false);
  const [provider, setProvider] = useState<CustomProviderConfig>(INITIAL_PROVIDER);
  const [models, setModels] = useState<string[]>([]);
  const [modelsBusy, setModelsBusy] = useState(false);
  const [modelsMessage, setModelsMessage] = useState('');

  const updateProvider = <Key extends keyof CustomProviderConfig>(key: Key, value: CustomProviderConfig[Key]) => {
    setProvider((current) => ({ ...current, [key]: value }));
    setModelsMessage('');
  };

  const providerReady = !customProviderEnabled || Boolean(
    provider.name.trim() && provider.baseUrl.trim() && provider.apiKey.trim() && provider.model.trim(),
  );

  const loadModels = async () => {
    setModelsBusy(true);
    setModelsMessage('');
    const response = await requestProviderModels(provider);
    if (response.ok) {
      setModels(response.models);
      setModelsMessage(response.models.length ? `已获取 ${response.models.length} 个模型。` : '服务商未返回可用模型。');
    } else {
      setModelsMessage(response.error.message);
    }
    setModelsBusy(false);
  };

  const generate = async () => {
    setBusy(true);
    setResult(null);
    try {
      setResult(await onGenerate(description, customProviderEnabled ? provider : undefined));
    } catch (error) {
      setResult({ ok: false, message: error instanceof Error ? error.message : '生成时发生未知错误。' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className={`generate-panel${open ? ' is-open' : ''}`} aria-label="AI 生成流程图" aria-hidden={!open} onWheel={(event) => event.stopPropagation()}>
      <div className="generate-panel__header">
        <div>
          <span className="panel-kicker">AI 生成</span>
          <h2>从工艺描述生成流程图</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="关闭生成面板">×</button>
      </div>

      <div className="generate-panel__body">
        <p className="generation-intro">写清原料、设备、物流方向与最终去向；生成结果会先校验，再进入当前编辑器。</p>

        <div className="generation-field__heading">
          <label htmlFor="process-description">工艺流程描述</label>
          <span>{description.length.toLocaleString()} / 20,000</span>
        </div>
        <textarea
          id="process-description"
          className="generation-input"
          value={description}
          maxLength={20000}
          placeholder="粘贴连续段落或编号步骤。请写清原料、设备、物料流向和最终去向。"
          onChange={(event) => {
            setDescription(event.target.value);
            setResult(null);
          }}
        />

        <section className={`provider-section${customProviderEnabled ? ' is-open' : ''}`}>
          <button
            type="button"
            className="provider-section__toggle"
            aria-expanded={customProviderEnabled}
            onClick={() => setCustomProviderEnabled((enabled) => !enabled)}
          >
            <span>自定义服务商</span>
            <i aria-hidden="true">{customProviderEnabled ? '−' : '＋'}</i>
          </button>

          {customProviderEnabled ? (
            <div className="provider-fields">
              <label>
                <span>服务商名</span>
                <input value={provider.name} placeholder="例如：公司模型网关" onChange={(event) => updateProvider('name', event.target.value)} />
              </label>
              <label>
                <span>Base URL</span>
                <input value={provider.baseUrl} placeholder="https://example.com/v1" onChange={(event) => updateProvider('baseUrl', event.target.value)} />
              </label>
              <label>
                <span>API 类型</span>
                <select value={provider.apiType} onChange={(event) => updateProvider('apiType', event.target.value as CustomProviderConfig['apiType'])}>
                  <option value="openai-compatible">OpenAI 兼容接口</option>
                </select>
              </label>
              <label>
                <span>API Key</span>
                <input type="password" autoComplete="off" value={provider.apiKey} placeholder="仅用于本次请求" onChange={(event) => updateProvider('apiKey', event.target.value)} />
              </label>
              <label>
                <span>模型</span>
                <div className="provider-model-row">
                  <input list="provider-model-options" value={provider.model} placeholder="选择或输入模型名" onChange={(event) => updateProvider('model', event.target.value)} />
                  <button type="button" disabled={modelsBusy || !provider.baseUrl.trim() || !provider.apiKey.trim()} onClick={() => void loadModels()}>
                    {modelsBusy ? '获取中…' : '获取模型'}
                  </button>
                </div>
                <datalist id="provider-model-options">
                  {models.map((model) => <option value={model} key={model} />)}
                </datalist>
              </label>
              <label>
                <span>思考强度</span>
                <select value={provider.reasoningEffort} onChange={(event) => updateProvider('reasoningEffort', event.target.value as ReasoningEffort)}>
                  {REASONING_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                </select>
              </label>
              {modelsMessage ? <p className="provider-message" role="status">{modelsMessage}</p> : null}
              <p className="provider-secret-note">API Key 不写入浏览器存储；关闭或刷新页面后需重新输入。</p>
            </div>
          ) : null}
        </section>

        <div className="generation-actions">
          <button type="button" className="data-action" disabled={busy} onClick={() => {
            setDescription(EXAMPLE_DESCRIPTION);
            setResult(null);
          }}>载入示例</button>
          <button type="button" className="data-action data-action--primary" disabled={busy || description.trim().length < 20 || !providerReady} onClick={() => void generate()}>
            {busy ? '正在生成…' : '生成流程图'}
          </button>
        </div>

        <ol className={`generation-steps${busy ? ' is-running' : ''}`} aria-label="生成处理步骤">
          <li><i />提取结构</li>
          <li><i />校验引用</li>
          <li><i />自动布局</li>
        </ol>

        {result ? (
          <div className={`generation-result${result.ok ? ' is-success' : ' is-error'}`} role="status">
            <strong>{result.message}</strong>
            {result.ok ? (
              <div className="generation-result__meta">
                <span>{result.nodes} 节点</span>
                <span>{result.edges} 管线</span>
                <span>{result.attempts} 次尝试</span>
              </div>
            ) : null}
            {result.mode === 'mock' ? <p>当前未配置默认 API 密钥，结果来自本地演示生成器。</p> : null}
            {result.model ? <small>{result.providerName ? `${result.providerName} · ` : ''}{result.model}</small> : null}
            {result.details?.length ? <ul>{result.details.slice(0, 8).map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}
          </div>
        ) : (
          <div className="generation-guard">
            <strong>当前画布受保护</strong>
            <p>请求失败或数据无效时不会覆盖；生成成功后仍可撤销。</p>
          </div>
        )}

        <p className="generation-disclaimer">自动生成结果用于流程梳理与演示，请在使用前核对关键设备与物流关系。</p>
      </div>
    </aside>
  );
}
