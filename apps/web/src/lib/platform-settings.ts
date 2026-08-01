import type { Market, Timeframe } from "./terminal-workbench";
import {
  buildApiUrl,
  defaultFetcher,
  requestJson,
  type WorkspaceFetcher
} from "./terminal-api-http";

type ResearchTimeframe = Timeframe;
type WorkspaceSource = "core" | "fallback";

export type PlatformSettingsStatusTone =
  | "ready"
  | "degraded"
  | "blocked"
  | "config_required"
  | "interface_only"
  | "paper_ready";

export interface PlatformSettingsDataSource {
  market: Market;
  label: string;
  quoteSource: string;
  klineSource: string;
  status: PlatformSettingsStatusTone;
  optionalKeyName: string | null;
  optionalKeyConfigured: boolean;
  note: string;
}

export interface PlatformSettingsFundamentalDataSource {
  id: string;
  market: Market;
  provider: string;
  status: "ready" | "blocked" | "ready_for_probe";
  configured: boolean;
  reasonCode: string;
  reason: string;
}

export interface PlatformSettingsCacheStatus {
  engine: "sqlite";
  path: string;
  exists: boolean;
  scope: string;
  rowCount: number;
  contextCount: number;
  latestTimestamp: string | null;
  freshnessSummary: PlatformSettingsCacheFreshnessSummary;
  contexts: PlatformSettingsCacheContext[];
}

export interface PlatformSettingsCacheFreshnessSummary {
  fresh: number;
  stale: number;
  empty: number;
}

export interface PlatformSettingsCacheContext {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  rowCount: number;
  startTimestamp: string | null;
  endTimestamp: string | null;
  freshness: "fresh" | "stale" | "empty";
  ageHours: number | null;
}

export interface PlatformSettingsMarketDataAdapter {
  id: string;
  market: Market;
  adapter: string;
  provider: string;
  status: PlatformSettingsStatusTone;
  route: "public_ohlcv" | string;
  capabilities: string[];
  timeframes: ResearchTimeframe[];
  historyDepth?: string;
  adjustmentModes?: string[];
  freshnessSemantics?: string;
  credentialRequirements?: string[];
  readOnly?: boolean;
  requiresApiKey: boolean;
  requiresTradingKey: boolean;
  cacheScope: string;
  cacheDiagnostics: PlatformSettingsMarketDataAdapterCacheDiagnostics;
  externalTelemetry: PlatformSettingsMarketDataAdapterExternalTelemetry;
  note: string;
}

export interface PlatformSettingsMarketDataAdapterCacheDiagnostics {
  freshness: "fresh" | "stale" | "empty";
  contextCount: number;
  rowCount: number;
  latestTimestamp: string | null;
  freshnessSummary: PlatformSettingsCacheFreshnessSummary;
}

export interface PlatformSettingsMarketDataAdapterExternalTelemetry {
  status: "ok" | "degraded" | "blocked" | "unknown";
  dependency: string;
  dependencyAvailable: boolean;
  lastError: string | null;
  retryState: "idle" | "dependency_missing" | "provider_error" | "not_observed";
  checkedAt: string;
  installGuidance: PlatformSettingsMarketDataAdapterInstallGuidance;
  lastProviderError: PlatformSettingsMarketDataAdapterProviderError | null;
  providerHealth: PlatformSettingsMarketDataAdapterProviderHealth;
}

export interface PlatformSettingsMarketDataAdapterInstallGuidance {
  packageName: string;
  dockerBuildArg: string;
  packageInstallCommand: string;
  projectExtraInstallCommand: string;
  note: string;
}

export interface PlatformSettingsMarketDataAdapterProviderError {
  eventId: string;
  createdAt: string;
  adapterId: string;
  provider: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  source: string;
  context: string;
  category: PlatformSettingsMarketDataAdapterProviderErrorCategory;
  message: string;
}

export type PlatformSettingsMarketDataAdapterProviderErrorCategory =
  | "rate_limit"
  | "dependency"
  | "network"
  | "upstream"
  | "incomplete_data"
  | "unknown";

const platformSettingsMarketDataAdapterProviderErrorCategories = [
  "rate_limit",
  "dependency",
  "network",
  "upstream",
  "incomplete_data",
  "unknown"
] as const satisfies readonly PlatformSettingsMarketDataAdapterProviderErrorCategory[];

export type PlatformSettingsMarketDataAdapterProviderErrorCategorySummary = Record<
  PlatformSettingsMarketDataAdapterProviderErrorCategory,
  number
>;

export interface PlatformSettingsMarketDataAdapterProviderHealthWindow {
  errorCount: number;
  latestErrorAt: string | null;
  categorySummary: PlatformSettingsMarketDataAdapterProviderErrorCategorySummary;
  dominantCategory: PlatformSettingsMarketDataAdapterProviderErrorCategory | null;
}

export interface PlatformSettingsMarketDataAdapterProviderHealthWindowSummary {
  oneHour: PlatformSettingsMarketDataAdapterProviderHealthWindow;
  twentyFourHours: PlatformSettingsMarketDataAdapterProviderHealthWindow;
  sevenDays: PlatformSettingsMarketDataAdapterProviderHealthWindow;
}

export interface PlatformSettingsMarketDataAdapterProviderHealth {
  status: "ok" | "watch" | "cooldown" | "blocked";
  recentErrorCount: number;
  lastErrorAt: string | null;
  affectedSymbols: string[];
  affectedContexts: string[];
  categorySummary: PlatformSettingsMarketDataAdapterProviderErrorCategorySummary;
  dominantCategory: PlatformSettingsMarketDataAdapterProviderErrorCategory | null;
  windowSummary: PlatformSettingsMarketDataAdapterProviderHealthWindowSummary;
  retryAfterSeconds: number;
  reason: string;
}

export interface PlatformSettingsExecutionAdapter {
  id: string;
  market: Market | "multi";
  adapter: string;
  route: "paper" | "live";
  status: PlatformSettingsStatusTone;
  certification: string;
  liveTradingAllowed: boolean;
  note: string;
}

export type PlatformSettingsSecretName =
  | "finnhubApiKey"
  | "openaiApiKey"
  | "openaiCompatibleApiKey"
  | "ccxtSandboxApiKey"
  | "ccxtSandboxSecret"
  | "ccxtProductionReadonlyApiKey"
  | "ccxtProductionReadonlySecret"
  | "ccxtProductionTradingApiKey"
  | "ccxtProductionTradingSecret"
  | "monitoringWebhookUrl"
  | "freeStockdbUrl"
  | "httpsProxy";

export interface PlatformSettingsConfigurationValues {
  ccxtDefaultExchange: string;
  ccxtTimeout: number;
  autoTradingIntervalSeconds: number;
  liveSessionTtlHours: number;
  productionTradingEnabled: boolean;
  openaiModel: string;
  openaiCompatibleBaseUrl: string;
  openaiCompatibleModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  secEdgarUserAgent: string;
  monitoringWebhookTimeoutSeconds: number;
  freeStockdbTimeoutSeconds: number;
}

export interface PlatformSettingsConfiguration {
  source: "environment" | "database";
  revision: number;
  updatedAt: string | null;
  restartRequired: boolean;
  values: PlatformSettingsConfigurationValues;
  secrets: Record<PlatformSettingsSecretName, {
    configured: boolean;
    masked: string | null;
  }>;
}

export interface PlatformSettingsUpdateRequest {
  configuration: PlatformSettingsConfigurationValues;
  secretUpdates: Partial<Record<PlatformSettingsSecretName, string>>;
  clearSecrets: PlatformSettingsSecretName[];
}

export interface PlatformSettingsStatus {
  schemaVersion: 1;
  generatedAt: string;
  dataSources: PlatformSettingsDataSource[];
  fundamentalDataSources: PlatformSettingsFundamentalDataSource[];
  marketDataAdapters: PlatformSettingsMarketDataAdapter[];
  cache: PlatformSettingsCacheStatus;
  executionAdapters: PlatformSettingsExecutionAdapter[];
  safety: {
    liveTradingAllowed: boolean;
    requiredGates: string[];
    executionMode?: "paper" | "testnet" | "live";
    liveConfirmed?: boolean;
    liveSessionTtlHours?: number;
    liveAuthorizedUntil?: string | null;
    productionLive?: {
      enabled: boolean;
      credentialsConfigured: boolean;
      controlActive: boolean;
      controlRecordedActive: boolean;
      evidenceFresh: boolean;
      blockingReason: string | null;
      triggered: boolean;
    };
  };
  configuration?: PlatformSettingsConfiguration;
}

export interface PlatformSettingsResult {
  settings?: PlatformSettingsStatus;
  source: WorkspaceSource;
  error?: string;
}

export type InstallablePlatformDataDependency = "akshare" | "yfinance";

export interface OpenAiCompatibleModelsResult {
  models: string[];
  source: WorkspaceSource;
  error?: string;
}

export interface MonitoringTestNotification {
  schemaVersion: 1;
  deliveryStatus: "sent";
  observedAt: string;
  channelType: "webhook";
  tradingActionsAvailable: false;
}

export interface MonitoringTestNotificationResult {
  notification?: MonitoringTestNotification;
  source: WorkspaceSource;
  error?: string;
}

export function buildSettingsStatusUrl(baseUrl: string, probeFreeStockdb = false): string {
  return buildApiUrl(baseUrl, "api/settings/status", (url) => {
    if (probeFreeStockdb) url.searchParams.set("probe", "free-stockdb");
  });
}

export function buildSettingsConfigurationUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/settings/configuration");
}

export function buildSettingsDependencyInstallUrl(
  baseUrl: string,
  dependency: InstallablePlatformDataDependency
): string {
  return buildApiUrl(
    baseUrl,
    `api/settings/dependencies/${encodeURIComponent(dependency)}/install`
  );
}

export function buildMonitoringTestNotificationsUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/operations/monitoring/test-notifications");
}

export function buildOpenAiCompatibleModelsUrl(
  baseUrl: string,
  compatibleBaseUrl: string
): string {
  return buildApiUrl(baseUrl, "api/settings/openai-compatible-models", (url) => {
    url.searchParams.set("baseUrl", compatibleBaseUrl.trim());
  });
}

export async function loadPlatformSettings(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  probeFreeStockdb = false
): Promise<PlatformSettingsResult> {
  try {
    const response = await fetcher(buildSettingsStatusUrl(baseUrl, probeFreeStockdb));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPlatformSettingsPayload(payload)) {
      throw new Error("Invalid settings status contract");
    }
    return {
      settings: payload.settings,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown settings status error"
    };
  }
}

export async function savePlatformSettings(
  baseUrl: string,
  request: PlatformSettingsUpdateRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PlatformSettingsResult> {
  try {
    const response = await fetcher(buildSettingsConfigurationUrl(baseUrl), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { detail?: unknown } | null;
      throw new Error(typeof payload?.detail === "string" ? payload.detail : `HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPlatformSettingsPayload(payload)) {
      throw new Error("Invalid settings configuration contract");
    }
    return { settings: payload.settings, source: "core" };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown settings configuration error"
    };
  }
}

export async function installPlatformDataDependency(
  baseUrl: string,
  dependency: InstallablePlatformDataDependency,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PlatformSettingsResult> {
  try {
    const payload = await requestJson(
      buildSettingsDependencyInstallUrl(baseUrl, dependency),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-AIQT-Install-Intent": "settings-ui"
        },
        body: "{}"
      },
      fetcher
    );
    const installation = (
      payload as {
        dependencyInstallation?: {
          dependency?: unknown;
          installed?: unknown;
          alreadyInstalled?: unknown;
        };
      }
    )?.dependencyInstallation;
    if (
      !isPlatformSettingsPayload(payload) ||
      installation?.dependency !== dependency ||
      installation.installed !== true ||
      typeof installation.alreadyInstalled !== "boolean"
    ) {
      throw new Error("Invalid optional data dependency installation contract");
    }
    return { settings: payload.settings, source: "core" };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error
        ? error.message
        : "Unknown optional data dependency installation error"
    };
  }
}

export async function loadOpenAiCompatibleModels(
  baseUrl: string,
  compatibleBaseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<OpenAiCompatibleModelsResult> {
  try {
    const payload = await requestJson(
      buildOpenAiCompatibleModelsUrl(baseUrl, compatibleBaseUrl),
      undefined,
      fetcher
    );
    if (
      !payload ||
      typeof payload !== "object" ||
      !Array.isArray((payload as { models?: unknown }).models) ||
      !(payload as { models: unknown[] }).models.every(
        (model) => typeof model === "string" && Boolean(model.trim())
      )
    ) {
      throw new Error("Invalid compatible model discovery contract");
    }
    return {
      models: (payload as { models: string[] }).models,
      source: "core"
    };
  } catch (error) {
    return {
      models: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown compatible model discovery error"
    };
  }
}

export async function testMonitoringWebhook(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<MonitoringTestNotificationResult> {
  try {
    const payload = await requestJson(
      buildMonitoringTestNotificationsUrl(baseUrl),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      },
      fetcher
    );
    const notification = (
      payload as { monitoringTestNotification?: Partial<MonitoringTestNotification> }
    )?.monitoringTestNotification;
    if (
      notification?.schemaVersion !== 1 ||
      notification.deliveryStatus !== "sent" ||
      typeof notification.observedAt !== "string" ||
      notification.channelType !== "webhook" ||
      notification.tradingActionsAvailable !== false
    ) {
      throw new Error("Invalid monitoring Webhook test contract");
    }
    return {
      notification: notification as MonitoringTestNotification,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown monitoring Webhook test error"
    };
  }
}

function isPlatformSettingsPayload(value: unknown): value is { settings: PlatformSettingsStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { settings?: unknown };
  return isPlatformSettingsStatus(payload.settings);
}

export function isPlatformSettingsStatus(value: unknown): value is PlatformSettingsStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const settings = value as Partial<PlatformSettingsStatus>;
  return (
    settings.schemaVersion === 1 &&
    typeof settings.generatedAt === "string" &&
    Array.isArray(settings.dataSources) &&
    settings.dataSources.every(isPlatformSettingsDataSource) &&
    Array.isArray(settings.fundamentalDataSources) &&
    settings.fundamentalDataSources.every(isPlatformSettingsFundamentalDataSource) &&
    Array.isArray(settings.marketDataAdapters) &&
    settings.marketDataAdapters.every(isPlatformSettingsMarketDataAdapter) &&
    isPlatformSettingsCacheStatus(settings.cache) &&
    Array.isArray(settings.executionAdapters) &&
    settings.executionAdapters.every(isPlatformSettingsExecutionAdapter) &&
    Boolean(settings.safety) &&
    typeof settings.safety?.liveTradingAllowed === "boolean" &&
    Array.isArray(settings.safety?.requiredGates) &&
    settings.safety.requiredGates.every((gate) => typeof gate === "string") &&
    (
      settings.safety.executionMode === undefined ||
      settings.safety.executionMode === "paper" ||
      settings.safety.executionMode === "testnet" ||
      settings.safety.executionMode === "live"
    ) &&
    (settings.safety.liveConfirmed === undefined || typeof settings.safety.liveConfirmed === "boolean") &&
    (
      settings.safety.liveSessionTtlHours === undefined ||
      typeof settings.safety.liveSessionTtlHours === "number"
    ) &&
    (
      settings.safety.liveAuthorizedUntil === undefined ||
      settings.safety.liveAuthorizedUntil === null ||
      typeof settings.safety.liveAuthorizedUntil === "string"
    ) &&
    (
      settings.safety.productionLive === undefined ||
      (
        typeof settings.safety.productionLive.enabled === "boolean" &&
        typeof settings.safety.productionLive.credentialsConfigured === "boolean" &&
        typeof settings.safety.productionLive.controlActive === "boolean" &&
        typeof settings.safety.productionLive.controlRecordedActive === "boolean" &&
        typeof settings.safety.productionLive.evidenceFresh === "boolean" &&
        (
          settings.safety.productionLive.blockingReason === null ||
          typeof settings.safety.productionLive.blockingReason === "string"
        ) &&
        typeof settings.safety.productionLive.triggered === "boolean"
      )
    ) &&
    (settings.configuration === undefined || isPlatformSettingsConfiguration(settings.configuration))
  );
}

const platformSettingsSecretNames: PlatformSettingsSecretName[] = [
  "finnhubApiKey",
  "openaiApiKey",
  "openaiCompatibleApiKey",
  "ccxtSandboxApiKey",
  "ccxtSandboxSecret",
  "ccxtProductionReadonlyApiKey",
  "ccxtProductionReadonlySecret",
  "ccxtProductionTradingApiKey",
  "ccxtProductionTradingSecret",
  "monitoringWebhookUrl",
  "freeStockdbUrl",
  "httpsProxy",
];

function isPlatformSettingsConfiguration(value: unknown): value is PlatformSettingsConfiguration {
  if (!value || typeof value !== "object") return false;
  const configuration = value as Partial<PlatformSettingsConfiguration>;
  const values = configuration.values as Partial<PlatformSettingsConfigurationValues> | undefined;
  const secrets = configuration.secrets as PlatformSettingsConfiguration["secrets"] | undefined;
  return (
    (configuration.source === "environment" || configuration.source === "database") &&
    typeof configuration.revision === "number" &&
    (configuration.updatedAt === null || typeof configuration.updatedAt === "string") &&
    typeof configuration.restartRequired === "boolean" &&
    Boolean(values) &&
    typeof values?.ccxtDefaultExchange === "string" &&
    typeof values.ccxtTimeout === "number" &&
    Number.isInteger(values.autoTradingIntervalSeconds) &&
    Number(values.autoTradingIntervalSeconds) >= 5 &&
    Number(values.autoTradingIntervalSeconds) <= 3600 &&
    Number.isInteger(values.liveSessionTtlHours) &&
    Number(values.liveSessionTtlHours) >= 0 &&
    Number(values.liveSessionTtlHours) <= 8760 &&
    typeof values.productionTradingEnabled === "boolean" &&
    typeof values.openaiModel === "string" &&
    typeof values.openaiCompatibleBaseUrl === "string" &&
    typeof values.openaiCompatibleModel === "string" &&
    typeof values.ollamaBaseUrl === "string" &&
    typeof values.ollamaModel === "string" &&
    typeof values.secEdgarUserAgent === "string" &&
    typeof values.monitoringWebhookTimeoutSeconds === "number" &&
    typeof values.freeStockdbTimeoutSeconds === "number" &&
    Boolean(secrets) &&
    platformSettingsSecretNames.every((name) =>
      typeof secrets?.[name]?.configured === "boolean" &&
      (secrets[name].masked === null || typeof secrets[name].masked === "string")
    )
  );
}

function isPlatformSettingsFundamentalDataSource(
  value: unknown
): value is PlatformSettingsFundamentalDataSource {
  if (!value || typeof value !== "object") {
    return false;
  }
  const source = value as Partial<PlatformSettingsFundamentalDataSource>;
  return typeof source.id === "string"
    && isMarket(source.market)
    && typeof source.provider === "string"
    && (
      source.status === "ready"
      || source.status === "blocked"
      || source.status === "ready_for_probe"
    )
    && typeof source.configured === "boolean"
    && typeof source.reasonCode === "string"
    && typeof source.reason === "string";
}

function isPlatformSettingsMarketDataAdapter(value: unknown): value is PlatformSettingsMarketDataAdapter {
  if (!value || typeof value !== "object") {
    return false;
  }
  const adapter = value as Partial<PlatformSettingsMarketDataAdapter>;
  return (
    typeof adapter.id === "string" &&
    isMarket(adapter.market) &&
    typeof adapter.adapter === "string" &&
    typeof adapter.provider === "string" &&
    isPlatformSettingsTone(adapter.status) &&
    typeof adapter.route === "string" &&
    Array.isArray(adapter.capabilities) &&
    adapter.capabilities.every((capability) => typeof capability === "string") &&
    Array.isArray(adapter.timeframes) &&
    adapter.timeframes.every(isTimeframe) &&
    (adapter.historyDepth === undefined || typeof adapter.historyDepth === "string") &&
    (adapter.adjustmentModes === undefined ||
      (Array.isArray(adapter.adjustmentModes) && adapter.adjustmentModes.every((mode) => typeof mode === "string"))) &&
    (adapter.freshnessSemantics === undefined || typeof adapter.freshnessSemantics === "string") &&
    (adapter.credentialRequirements === undefined ||
      (Array.isArray(adapter.credentialRequirements) &&
        adapter.credentialRequirements.every((requirement) => typeof requirement === "string"))) &&
    (adapter.readOnly === undefined || typeof adapter.readOnly === "boolean") &&
    typeof adapter.requiresApiKey === "boolean" &&
    typeof adapter.requiresTradingKey === "boolean" &&
    typeof adapter.cacheScope === "string" &&
    isPlatformSettingsMarketDataAdapterCacheDiagnostics(adapter.cacheDiagnostics) &&
    isPlatformSettingsMarketDataAdapterExternalTelemetry(adapter.externalTelemetry) &&
    typeof adapter.note === "string"
  );
}

function isPlatformSettingsMarketDataAdapterCacheDiagnostics(
  value: unknown
): value is PlatformSettingsMarketDataAdapterCacheDiagnostics {
  if (!value || typeof value !== "object") {
    return false;
  }
  const diagnostics = value as Partial<PlatformSettingsMarketDataAdapterCacheDiagnostics>;
  return (
    (diagnostics.freshness === "fresh" || diagnostics.freshness === "stale" || diagnostics.freshness === "empty") &&
    typeof diagnostics.contextCount === "number" &&
    typeof diagnostics.rowCount === "number" &&
    (diagnostics.latestTimestamp === null || typeof diagnostics.latestTimestamp === "string") &&
    isPlatformSettingsCacheFreshnessSummary(diagnostics.freshnessSummary)
  );
}

function isPlatformSettingsMarketDataAdapterExternalTelemetry(
  value: unknown
): value is PlatformSettingsMarketDataAdapterExternalTelemetry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const telemetry = value as Partial<PlatformSettingsMarketDataAdapterExternalTelemetry>;
  return (
    (telemetry.status === "ok" ||
      telemetry.status === "degraded" ||
      telemetry.status === "blocked" ||
      telemetry.status === "unknown") &&
    typeof telemetry.dependency === "string" &&
    typeof telemetry.dependencyAvailable === "boolean" &&
    (telemetry.lastError === null || typeof telemetry.lastError === "string") &&
    (telemetry.retryState === "idle" ||
      telemetry.retryState === "dependency_missing" ||
      telemetry.retryState === "provider_error" ||
      telemetry.retryState === "not_observed") &&
    typeof telemetry.checkedAt === "string" &&
    isPlatformSettingsMarketDataAdapterInstallGuidance(telemetry.installGuidance) &&
    (telemetry.lastProviderError === null ||
      isPlatformSettingsMarketDataAdapterProviderError(telemetry.lastProviderError)) &&
    isPlatformSettingsMarketDataAdapterProviderHealth(telemetry.providerHealth)
  );
}

function isPlatformSettingsMarketDataAdapterInstallGuidance(
  value: unknown
): value is PlatformSettingsMarketDataAdapterInstallGuidance {
  if (!value || typeof value !== "object") {
    return false;
  }
  const guidance = value as Partial<PlatformSettingsMarketDataAdapterInstallGuidance>;
  return (
    typeof guidance.packageName === "string" &&
    typeof guidance.dockerBuildArg === "string" &&
    typeof guidance.packageInstallCommand === "string" &&
    typeof guidance.projectExtraInstallCommand === "string" &&
    typeof guidance.note === "string"
  );
}

function isPlatformSettingsMarketDataAdapterProviderError(
  value: unknown
): value is PlatformSettingsMarketDataAdapterProviderError {
  if (!value || typeof value !== "object") {
    return false;
  }
  const error = value as Partial<PlatformSettingsMarketDataAdapterProviderError>;
  return (
    typeof error.eventId === "string" &&
    typeof error.createdAt === "string" &&
    typeof error.adapterId === "string" &&
    typeof error.provider === "string" &&
    isMarket(error.market) &&
    typeof error.symbol === "string" &&
    isTimeframe(error.timeframe) &&
    typeof error.source === "string" &&
    typeof error.context === "string" &&
    isPlatformSettingsMarketDataAdapterProviderErrorCategory(error.category) &&
    typeof error.message === "string"
  );
}

function isPlatformSettingsMarketDataAdapterProviderErrorCategory(
  value: unknown
): value is PlatformSettingsMarketDataAdapterProviderErrorCategory {
  return platformSettingsMarketDataAdapterProviderErrorCategories.includes(
    value as PlatformSettingsMarketDataAdapterProviderErrorCategory
  );
}

function isPlatformSettingsMarketDataAdapterProviderErrorCategorySummary(
  value: unknown
): value is PlatformSettingsMarketDataAdapterProviderErrorCategorySummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<PlatformSettingsMarketDataAdapterProviderErrorCategorySummary>;
  return platformSettingsMarketDataAdapterProviderErrorCategories.every((category) => {
    const count = summary[category];
    return typeof count === "number" && Number.isFinite(count) && count >= 0;
  });
}

function isPlatformSettingsMarketDataAdapterProviderHealth(
  value: unknown
): value is PlatformSettingsMarketDataAdapterProviderHealth {
  if (!value || typeof value !== "object") {
    return false;
  }
  const health = value as Partial<PlatformSettingsMarketDataAdapterProviderHealth>;
  return (
    (health.status === "ok" ||
      health.status === "watch" ||
      health.status === "cooldown" ||
      health.status === "blocked") &&
    typeof health.recentErrorCount === "number" &&
    Number.isFinite(health.recentErrorCount) &&
    health.recentErrorCount >= 0 &&
    (health.lastErrorAt === null || typeof health.lastErrorAt === "string") &&
    Array.isArray(health.affectedSymbols) &&
    health.affectedSymbols.every((symbol) => typeof symbol === "string") &&
    Array.isArray(health.affectedContexts) &&
    health.affectedContexts.every((context) => typeof context === "string") &&
    isPlatformSettingsMarketDataAdapterProviderErrorCategorySummary(health.categorySummary) &&
    (health.dominantCategory === null || isPlatformSettingsMarketDataAdapterProviderErrorCategory(health.dominantCategory)) &&
    isPlatformSettingsMarketDataAdapterProviderHealthWindowSummary(health.windowSummary) &&
    typeof health.retryAfterSeconds === "number" &&
    Number.isFinite(health.retryAfterSeconds) &&
    health.retryAfterSeconds >= 0 &&
    typeof health.reason === "string"
  );
}

function isPlatformSettingsMarketDataAdapterProviderHealthWindowSummary(
  value: unknown
): value is PlatformSettingsMarketDataAdapterProviderHealthWindowSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<PlatformSettingsMarketDataAdapterProviderHealthWindowSummary>;
  return (
    isPlatformSettingsMarketDataAdapterProviderHealthWindow(summary.oneHour) &&
    isPlatformSettingsMarketDataAdapterProviderHealthWindow(summary.twentyFourHours) &&
    isPlatformSettingsMarketDataAdapterProviderHealthWindow(summary.sevenDays)
  );
}

function isPlatformSettingsMarketDataAdapterProviderHealthWindow(
  value: unknown
): value is PlatformSettingsMarketDataAdapterProviderHealthWindow {
  if (!value || typeof value !== "object") {
    return false;
  }
  const window = value as Partial<PlatformSettingsMarketDataAdapterProviderHealthWindow>;
  return (
    typeof window.errorCount === "number" &&
    Number.isFinite(window.errorCount) &&
    window.errorCount >= 0 &&
    (window.latestErrorAt === null || typeof window.latestErrorAt === "string") &&
    isPlatformSettingsMarketDataAdapterProviderErrorCategorySummary(window.categorySummary) &&
    (window.dominantCategory === null ||
      isPlatformSettingsMarketDataAdapterProviderErrorCategory(window.dominantCategory))
  );
}

function isPlatformSettingsDataSource(value: unknown): value is PlatformSettingsDataSource {
  if (!value || typeof value !== "object") {
    return false;
  }
  const source = value as Partial<PlatformSettingsDataSource>;
  return (
    isMarket(source.market) &&
    typeof source.label === "string" &&
    typeof source.quoteSource === "string" &&
    typeof source.klineSource === "string" &&
    isPlatformSettingsTone(source.status) &&
    (source.optionalKeyName === null || typeof source.optionalKeyName === "string") &&
    typeof source.optionalKeyConfigured === "boolean" &&
    typeof source.note === "string"
  );
}

function isPlatformSettingsCacheStatus(value: unknown): value is PlatformSettingsCacheStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const cache = value as Partial<PlatformSettingsCacheStatus>;
  return (
    cache.engine === "sqlite" &&
    typeof cache.path === "string" &&
    typeof cache.exists === "boolean" &&
    typeof cache.scope === "string" &&
    typeof cache.rowCount === "number" &&
    typeof cache.contextCount === "number" &&
    (cache.latestTimestamp === null || typeof cache.latestTimestamp === "string") &&
    isPlatformSettingsCacheFreshnessSummary(cache.freshnessSummary) &&
    Array.isArray(cache.contexts) &&
    cache.contexts.every(isPlatformSettingsCacheContext)
  );
}

function isPlatformSettingsCacheFreshnessSummary(value: unknown): value is PlatformSettingsCacheFreshnessSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<PlatformSettingsCacheFreshnessSummary>;
  return typeof summary.fresh === "number" && typeof summary.stale === "number" && typeof summary.empty === "number";
}

function isPlatformSettingsCacheContext(value: unknown): value is PlatformSettingsCacheContext {
  if (!value || typeof value !== "object") {
    return false;
  }
  const context = value as Partial<PlatformSettingsCacheContext>;
  return (
    isMarket(context.market) &&
    typeof context.symbol === "string" &&
    isTimeframe(context.timeframe) &&
    typeof context.rowCount === "number" &&
    (context.startTimestamp === null || typeof context.startTimestamp === "string") &&
    (context.endTimestamp === null || typeof context.endTimestamp === "string") &&
    (context.freshness === "fresh" || context.freshness === "stale" || context.freshness === "empty") &&
    (context.ageHours === null || typeof context.ageHours === "number")
  );
}

function isPlatformSettingsExecutionAdapter(value: unknown): value is PlatformSettingsExecutionAdapter {
  if (!value || typeof value !== "object") {
    return false;
  }
  const adapter = value as Partial<PlatformSettingsExecutionAdapter>;
  return (
    typeof adapter.id === "string" &&
    (isMarket(adapter.market) || adapter.market === "multi") &&
    typeof adapter.adapter === "string" &&
    (adapter.route === "paper" || adapter.route === "live") &&
    isPlatformSettingsTone(adapter.status) &&
    typeof adapter.certification === "string" &&
    typeof adapter.liveTradingAllowed === "boolean" &&
    typeof adapter.note === "string"
  );
}

export function isPlatformSettingsTone(value: unknown): value is PlatformSettingsStatusTone {
  return (
    value === "ready" ||
    value === "degraded" ||
    value === "blocked" ||
    value === "config_required" ||
    value === "interface_only" ||
    value === "paper_ready"
  );
}

function isMarket(value: unknown): value is Market {
  return value === "ashare" || value === "us" || value === "crypto";
}

function isTimeframe(value: unknown): value is Timeframe {
  return (
    value === "1d" ||
    value === "1w" ||
    value === "1m" ||
    value === "5m" ||
    value === "15m" ||
    value === "30m" ||
    value === "60m"
  );
}
