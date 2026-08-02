import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  OpenAiCompatibleModelsResult,
  PlatformSettingsConfigurationValues,
  PlatformSettingsSecretName,
  PlatformSettingsStatus,
  PlatformSettingsUpdateRequest,
} from "../../lib/terminal-api";
import type { ExecutionAdapterHealthProbeRow } from "../../lib/terminal-workbench";

export type ConnectorTone = "positive" | "warning" | "risk" | "neutral";

export function providerHealthLabel(
  status: PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["providerHealth"]["status"],
): string {
  return {
    blocked: "阻断",
    cooldown: "冷却中",
    ok: "健康",
    watch: "待观察",
  }[status];
}

export function providerHealthReason(reason: string): string {
  return {
    configured_not_probed: "端点已配置但尚未探测",
    dependency_missing: "可选依赖未安装",
    endpoint_invalid: "端点配置无效",
    endpoint_not_configured: "端点尚未配置",
    no_recent_provider_errors: "最近 24 小时无 Provider 错误",
    probe_failed: "只读探测失败",
    probe_succeeded: "只读探测通过",
    provider_cooldown: "近期错误达到冷却阈值",
    recent_provider_errors: "近期存在 Provider 错误",
  }[reason] ?? reason;
}

export function dataAdapterNextAction(
  adapter: PlatformSettingsStatus["marketDataAdapters"][number],
): string {
  const health = adapter.externalTelemetry.providerHealth;
  if (!adapter.externalTelemetry.dependencyAvailable) {
    return adapter.externalTelemetry.dependency.includes("local-service")
      ? "配置可选本地只读端点；不调用同步或写入"
      : `安装可选依赖 ${adapter.externalTelemetry.dependency}；不会启用交易权限`;
  }
  if (health.status === "cooldown") {
    return `等待 ${health.retryAfterSeconds} 秒后再试，期间继续使用缓存`;
  }
  if (health.status === "watch") {
    if (health.reason === "configured_not_probed") return "等待本地端点只读健康探测";
    if (health.reason === "probe_failed") return "检查本地端点后重新探测；不会调用同步或写入";
    return `检查最近 Provider 错误；${health.retryAfterSeconds} 秒后可重试`;
  }
  if (adapter.status !== "ready") {
    return adapter.note;
  }
  return "保持只读访问；需要新数据时再刷新";
}

export function executionProbePending(probe: ExecutionAdapterHealthProbeRow): string {
  if (probe.status === "ready") return "无";
  if (probe.blockerSummary && probe.blockerSummary !== "No blockers") {
    return probe.blockerSummary;
  }
  if (probe.credentialSummary.toLowerCase().includes("missing")) {
    return "Sandbox 凭据未配置";
  }
  return "只读健康探测需要复核";
}

export const platformSecretFields: Array<{
  name: PlatformSettingsSecretName;
  label: string;
  production?: boolean;
}> = [
  { name: "finnhubApiKey", label: "Finnhub API Key" },
  { name: "openaiApiKey", label: "OpenAI API Key" },
  { name: "openaiCompatibleApiKey", label: "OpenAI 兼容服务 API Key" },
  { name: "monitoringWebhookUrl", label: "监控 Webhook URL" },
  { name: "freeStockdbUrl", label: "Free StockDB URL" },
  { name: "httpsProxy", label: "HTTPS 代理" },
  { name: "ccxtSandboxApiKey", label: "CCXT Testnet API Key" },
  { name: "ccxtSandboxSecret", label: "CCXT Testnet Secret" },
  { name: "ccxtProductionReadonlyApiKey", label: "生产只读 API Key", production: true },
  { name: "ccxtProductionReadonlySecret", label: "生产只读 Secret", production: true },
  { name: "ccxtProductionTradingApiKey", label: "生产交易 API Key", production: true },
  { name: "ccxtProductionTradingSecret", label: "生产交易 Secret", production: true },
];

export function buildPlatformSettingsUpdateRequest(data: FormData): PlatformSettingsUpdateRequest {
  const text = (name: string) => String(data.get(name) ?? "").trim();
  const secretUpdates: PlatformSettingsUpdateRequest["secretUpdates"] = {};
  platformSecretFields.forEach(({ name }) => {
    const value = String(data.get(name) ?? "");
    if (value) secretUpdates[name] = value;
  });
  return {
    configuration: {
      ccxtDefaultExchange: text("ccxtDefaultExchange"),
      ccxtTimeout: Number(text("ccxtTimeout")),
      autoTradingIntervalSeconds: Number(text("autoTradingIntervalSeconds")),
      liveSessionTtlHours: Number(text("liveSessionTtlHours")),
      productionTradingEnabled: data.has("productionTradingEnabled"),
      openaiModel: text("openaiModel"),
      openaiCompatibleBaseUrl: text("openaiCompatibleBaseUrl"),
      openaiCompatibleModel: text("openaiCompatibleModel"),
      ollamaBaseUrl: text("ollamaBaseUrl"),
      ollamaModel: text("ollamaModel"),
      secEdgarUserAgent: text("secEdgarUserAgent"),
      monitoringWebhookTimeoutSeconds: Number(text("monitoringWebhookTimeoutSeconds")),
      freeStockdbTimeoutSeconds: Number(text("freeStockdbTimeoutSeconds")),
    },
    secretUpdates,
    clearSecrets: [],
  };
}

export function hasPlatformSettingsConfigurationChanges(
  saved: PlatformSettingsConfigurationValues,
  draft: PlatformSettingsUpdateRequest,
) {
  return Object.entries(draft.configuration).some(
    ([name, value]) => saved[name as keyof PlatformSettingsConfigurationValues] !== value,
  ) || Object.keys(draft.secretUpdates).length > 0 || draft.clearSecrets.length > 0;
}

export function SettingsSecretFields({
  names,
  settings,
}: {
  names: typeof platformSecretFields;
  settings: NonNullable<PlatformSettingsStatus["configuration"]>;
}) {
  return (
    <div className="design-settings-form-grid">
      {names.map(({ name, label }) => {
        const secret = settings.secrets[name];
        return (
          <div className="design-settings-field" key={name}>
            <label htmlFor={`platform-setting-${name}`}>{label}</label>
            <input
              autoComplete="new-password"
              id={`platform-setting-${name}`}
              name={name}
              placeholder={secret.masked ?? "输入后加密保存"}
              type="password"
            />
          </div>
        );
      })}
    </div>
  );
}

export function OpenAiCompatibleModelFields({
  initialBaseUrl,
  initialModel,
  onLoadModels,
}: {
  initialBaseUrl: string;
  initialModel: string;
  onLoadModels?: (baseUrl: string) => Promise<OpenAiCompatibleModelsResult>;
}) {
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);
  const [model, setModel] = useState(initialModel);
  const [models, setModels] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "manual">("idle");
  const requestSequence = useRef(0);
  const discoverModels = useCallback(async (candidateBaseUrl: string) => {
    const normalizedBaseUrl = candidateBaseUrl.trim();
    const requestId = ++requestSequence.current;
    if (!normalizedBaseUrl || !onLoadModels) {
      setModels([]);
      setStatus("manual");
      return;
    }
    setStatus("loading");
    const result = await onLoadModels(normalizedBaseUrl);
    if (requestId !== requestSequence.current) return;
    if (result.source === "core" && result.models.length) {
      setModels(result.models);
      setStatus("loaded");
      return;
    }
    setModels([]);
    setStatus("manual");
  }, [onLoadModels]);

  useEffect(() => {
    void discoverModels(initialBaseUrl);
  }, [discoverModels, initialBaseUrl]);

  const modelOptions = Array.from(new Set([model, ...models].filter(Boolean)));
  const statusLabel = status === "loading"
    ? "正在从 /models 获取模型…"
    : status === "loaded"
      ? `已从 /models 获取 ${models.length} 个模型`
      : status === "manual"
        ? "未获取到模型，可手动输入"
        : "将从 Base URL 的 /models 自动获取模型";

  return (
    <>
      <label className="design-settings-field">
        <span>OpenAI 兼容 Base URL</span>
        <input
          name="openaiCompatibleBaseUrl"
          onBlur={() => void discoverModels(baseUrl)}
          onChange={(event) => {
            requestSequence.current += 1;
            setBaseUrl(event.currentTarget.value);
            setModels([]);
            setStatus("idle");
          }}
          type="url"
          value={baseUrl}
        />
      </label>
      <div className="design-settings-field">
        <label htmlFor="platform-setting-openai-compatible-model">OpenAI 兼容模型</label>
        <div className="design-settings-model-control">
          {status === "loaded" ? (
            <select
              id="platform-setting-openai-compatible-model"
              name="openaiCompatibleModel"
              onChange={(event) => setModel(event.currentTarget.value)}
              value={model}
            >
              {!model ? <option value="">请选择模型</option> : null}
              {modelOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          ) : (
            <input
              id="platform-setting-openai-compatible-model"
              name="openaiCompatibleModel"
              onChange={(event) => setModel(event.currentTarget.value)}
              placeholder="自动获取失败时手动输入"
              value={model}
            />
          )}
          <button
            aria-label="刷新 OpenAI 兼容模型"
            className="design-secondary-action"
            disabled={!baseUrl.trim() || status === "loading" || !onLoadModels}
            onClick={() => void discoverModels(baseUrl)}
            title="从 Base URL 的 /models 获取模型"
            type="button"
          >
            <RefreshCw className={status === "loading" ? "spin" : undefined} size={12} />
            获取
          </button>
        </div>
        <small aria-live="polite">{statusLabel}</small>
      </div>
    </>
  );
}
