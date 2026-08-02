import { AlertTriangle, CheckCircle2, Download, LockKeyhole, RefreshCw, Save, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { InstallablePlatformDataDependency } from "../../lib/terminal-api";
import { aiProviderLabels, PageHeader, Status, SurfacePanel } from "../../components/TerminalSurfaceUi";
import type { TerminalWorkspacePageProps } from "../shared/terminal-workspace-page";
import { connectorTimestamp, terminalSurfaceZh } from "../shared/terminal-workspace-formatters";
import {
  OpenAiCompatibleModelFields,
  SettingsSecretFields,
  buildPlatformSettingsUpdateRequest,
  dataAdapterNextAction,
  executionProbePending,
  hasPlatformSettingsConfigurationChanges,
  platformSecretFields,
  providerHealthLabel,
  providerHealthReason,
  type ConnectorTone,
} from "./SettingsPage.helpers";
import "./SettingsPage.layout.css";

export function SettingsPage({
  action,
  adapterRows,
  adapterChainHealthRollups = [],
  adapterHealthProbeRows = [],
  adapterLedgerRows = [],
  aiReview,
  isLoadingSettingsConfiguration = false,
  installingDataDependency = null,
  isSavingSettingsConfiguration = false,
  isTestingMonitoringWebhook = false,
  onLoadOpenAiCompatibleModels,
  onInstallDataDependency,
  onSaveSettingsConfiguration,
  onSettingsConfigurationDirtyChange,
  onTestMonitoringWebhook,
  settings,
  settingsConfigurationMessage,
}: Pick<
  TerminalWorkspacePageProps,
  | "action"
  | "adapterRows"
  | "adapterChainHealthRollups"
  | "adapterHealthProbeRows"
  | "adapterLedgerRows"
  | "aiReview"
  | "isLoadingSettingsConfiguration"
  | "installingDataDependency"
  | "isSavingSettingsConfiguration"
  | "isTestingMonitoringWebhook"
  | "onLoadOpenAiCompatibleModels"
  | "onInstallDataDependency"
  | "onSaveSettingsConfiguration"
  | "onSettingsConfigurationDirtyChange"
  | "onTestMonitoringWebhook"
  | "settings"
  | "settingsConfigurationMessage"
>) {
  const configuration = settings?.configuration;
  const configurationFormRef = useRef<HTMLFormElement | null>(null);
  const [productionTradingEnabledDraft, setProductionTradingEnabledDraft] = useState(
    configuration?.values.productionTradingEnabled ?? false,
  );
  useEffect(() => {
    setProductionTradingEnabledDraft(configuration?.values.productionTradingEnabled ?? false);
    onSettingsConfigurationDirtyChange?.(false);
  }, [
    configuration?.revision,
    configuration?.values.productionTradingEnabled,
    onSettingsConfigurationDirtyChange,
  ]);
  const productionTradingEnabledDirty = Boolean(
    configuration
    && productionTradingEnabledDraft !== configuration.values.productionTradingEnabled,
  );
  const productionTradingStatusLabel = productionTradingEnabledDirty
    ? productionTradingEnabledDraft ? "待保存开启" : "待保存关闭"
    : productionTradingEnabledDraft ? "已开启" : "已关闭";
  const dataAdapters = settings?.marketDataAdapters ?? [];
  const fundamentalDataSources = settings?.fundamentalDataSources ?? [];
  const executionAdapters = settings?.executionAdapters ?? [];
  const dataBlocker = dataAdapters.find(
    (adapter) =>
      adapter.status !== "ready" ||
      adapter.externalTelemetry.providerHealth.status !== "ok",
  );
  const missingInstallableDataDependencies = dataAdapters.flatMap<InstallablePlatformDataDependency>(
    ({ externalTelemetry }) =>
      !externalTelemetry.dependencyAvailable &&
      (externalTelemetry.dependency === "akshare" || externalTelemetry.dependency === "yfinance")
        ? [externalTelemetry.dependency]
        : [],
  );
  const readyDataAdapterCount = dataAdapters.filter(
    (adapter) =>
      adapter.status === "ready" &&
      adapter.externalTelemetry.providerHealth.status === "ok",
  ).length;
  const dataAdapterHealthTone: ConnectorTone = !settings || !dataAdapters.length
    ? "neutral"
    : readyDataAdapterCount === dataAdapters.length
      ? "positive"
      : readyDataAdapterCount
        ? "warning"
        : "risk";
  const configuredAiProviders = aiReview.providers.filter((provider) => provider.configured);
  const configuredExternalAiProviders = configuredAiProviders.filter(
    (provider) => provider.providerId !== "local",
  );
  const localAiProvider = aiReview.providers.find((provider) => provider.providerId === "local");
  const aiProviderTone: ConnectorTone = !aiReview.providers.length
    ? "neutral"
    : !localAiProvider?.configured
      ? "risk"
      : configuredExternalAiProviders.length
        ? "warning"
        : "positive";
  const liveTradingAllowed = settings?.safety.liveTradingAllowed ?? false;
  const executionMode = settings?.safety.executionMode;
  const productionLive = settings?.safety.productionLive;
  const productionEvidenceStale =
    productionLive?.blockingReason === "stage10_production_execution_control_evidence_stale";
  const executionStatusLabel = !settings
    ? "未加载"
    : liveTradingAllowed
      ? "生产会话已授权"
      : executionMode === "testnet"
        ? "测试网运行中"
        : executionMode === "paper"
          ? "模拟运行中"
          : "生产会话未授权";
  const runtimeBlockingReason = liveTradingAllowed
    ? null
    : productionEvidenceStale
      ? "生产权限证据已过期"
      : productionLive?.enabled === false
        ? "生产实盘功能未启用"
        : productionLive?.credentialsConfigured === false
          ? "生产交易凭据未配置"
          : productionLive?.triggered
            ? "生产急停已触发"
            : productionLive && !productionLive.controlActive
              ? "生产执行控制未恢复"
              : settings
                ? "生产会话未开启"
                : null;
  const blockingChain = adapterChainHealthRollups.find(
    (rollup) => rollup.status === "blocked" || rollup.status === "in_progress",
  );
  const latestLedgerRow =
    adapterLedgerRows.find((row) => row.adapterId === blockingChain?.adapterId) ??
    adapterLedgerRows.find((row) => row.route === "live" && !row.liveTradingAllowed) ??
    adapterLedgerRows[0];
  const latestHealthProbe = adapterHealthProbeRows[0];
  const latestHealthProbePending = latestHealthProbe
    ? executionProbePending(latestHealthProbe)
    : null;
  const paperReadyAdapterCount = executionAdapters.filter(
    (adapter) => adapter.route === "paper" && adapter.status === "paper_ready",
  ).length;
  const executionTone: ConnectorTone = !settings
    ? "neutral"
    : latestHealthProbe?.tone === "risk"
      ? "risk"
      : liveTradingAllowed || executionMode === "paper" || executionMode === "testnet"
        ? "positive"
        : "warning";
  const executionNextAction =
    (productionEvidenceStale
      ? "重新核验生产权限并恢复执行控制"
      : liveTradingAllowed
        ? "生产会话有效；继续遵守风险与对账门禁"
        : productionLive?.credentialsConfigured === false
          ? "先配置专用生产交易凭据"
          : executionMode === "paper" || executionMode === "testnet"
            ? "如需实盘，在执行中心切换生产模式并确认真实资金风险"
            : null) ??
    (latestHealthProbe && latestHealthProbe.status !== "ready"
      ? `处理“${latestHealthProbePending}”后重新运行只读健康检查`
      : null) ??
    (blockingChain?.blockerLabel
      ? `补齐 ${blockingChain.blockerLabel} 证据`
      : latestLedgerRow
        ? "保持纸面执行，按现有门禁顺序补齐认证证据"
        : "保持纸面执行，按门禁顺序补齐认证证据");
  const saveConfiguration = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!configuration || !onSaveSettingsConfiguration) return;
    void onSaveSettingsConfiguration(buildPlatformSettingsUpdateRequest(new FormData(event.currentTarget)));
  };
  const updateConfigurationDirtyState = useCallback(() => {
    if (!configuration || !configurationFormRef.current || !onSettingsConfigurationDirtyChange) return;
    onSettingsConfigurationDirtyChange(hasPlatformSettingsConfigurationChanges(
      configuration.values,
      buildPlatformSettingsUpdateRequest(new FormData(configurationFormRef.current)),
    ));
  }, [configuration, onSettingsConfigurationDirtyChange]);

  return (
    <>
      <PageHeader
        action={action}
        subtitle="/ 连接器能力、健康与权限"
        title="设置"
      />
      <div className="design-settings-grid">
        <nav aria-label="设置分区" className="design-settings-nav">
          <a className="selected" href="#settings-configuration">平台配置</a>
          <a href="#settings-connectors">连接器总览</a>
          <a href="#settings-data-connectors">数据源</a>
          <a href="#settings-ai-connectors">AI Provider</a>
          <a href="#settings-execution-connectors">执行适配器</a>
          <a href="#settings-safety">安全边界</a>
        </nav>
        <div className="design-settings-main">
          <SurfacePanel title="平台配置">
            {configuration ? (
              <form
                aria-label="平台配置"
                aria-busy={isSavingSettingsConfiguration}
                className="design-settings-form"
                id="settings-configuration"
                inert={isSavingSettingsConfiguration}
                key={`${configuration.source}-${configuration.revision}`}
                onChange={updateConfigurationDirtyState}
                onSubmit={saveConfiguration}
                ref={configurationFormRef}
              >
                <div className="design-settings-form-meta">
                  <strong>
                    {configuration.source === "database"
                      ? `数据库配置 · 修订 ${configuration.revision}`
                      : "环境变量初始化"}
                  </strong>
                  <span>
                    首次保存后以数据库为准；密钥只返回掩码，保存后实时生效。
                  </span>
                </div>
                <fieldset>
                  <legend>数据与运行参数</legend>
                  <div className="design-settings-form-grid">
                    <label className="design-settings-field">
                      <span>CCXT 默认交易所</span>
                      <input defaultValue={configuration.values.ccxtDefaultExchange} name="ccxtDefaultExchange" required />
                    </label>
                    <label className="design-settings-field">
                      <span>CCXT 超时（毫秒）</span>
                      <input defaultValue={configuration.values.ccxtTimeout} max="120000" min="1000" name="ccxtTimeout" required type="number" />
                    </label>
                    <label className="design-settings-field">
                      <span>监控超时（秒）</span>
                      <input defaultValue={configuration.values.monitoringWebhookTimeoutSeconds} max="120" min="1" name="monitoringWebhookTimeoutSeconds" required type="number" />
                    </label>
                    <label className="design-settings-field">
                      <span>Free StockDB 超时（秒）</span>
                      <input defaultValue={configuration.values.freeStockdbTimeoutSeconds} max="120" min="1" name="freeStockdbTimeoutSeconds" required type="number" />
                    </label>
                    <label className="design-settings-field">
                      <span>自动评估间隔（秒）</span>
                      <input
                        defaultValue={configuration.values.autoTradingIntervalSeconds}
                        max="3600"
                        min="5"
                        name="autoTradingIntervalSeconds"
                        required
                        step="1"
                        type="number"
                      />
                      <small>5–3600 秒；保存后实时应用，无需重启 API。</small>
                    </label>
                    <label className="design-settings-field">
                      <span>SEC EDGAR User-Agent</span>
                      <input
                        defaultValue={configuration.values.secEdgarUserAgent}
                        name="secEdgarUserAgent"
                        placeholder="AIQuantificationTools contact@example.com"
                      />
                      <small>
                        用于美股 SEC 财务数据访问；请包含产品名和联系邮箱，保存后实时生效。
                      </small>
                    </label>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>生产安全策略</legend>
                  <div className="design-settings-form-grid">
                    <label className="design-settings-live-toggle">
                      <input
                        aria-describedby="platform-setting-production-trading-help"
                        checked={productionTradingEnabledDraft}
                        id="platform-setting-production-trading"
                        name="productionTradingEnabled"
                        onChange={(event) => setProductionTradingEnabledDraft(event.currentTarget.checked)}
                        type="checkbox"
                      />
                      <span className="design-settings-live-toggle-copy">
                        <span className="design-settings-live-toggle-heading">
                          <strong>生产实盘总开关</strong>
                          <span className={`design-settings-live-toggle-state${
                            productionTradingEnabledDirty ? " dirty" : ""
                          }`}>
                            {productionTradingStatusLabel}
                          </span>
                        </span>
                        <small id="platform-setting-production-trading-help">
                          保存后实时生效；仅解锁生产路由，不会切换执行模式、授权生产会话、发起评估或提交委托。
                          仍需凭据、权限、IP 白名单、急停与实名确认。
                        </small>
                      </span>
                      <span aria-hidden="true" className="design-settings-live-toggle-control" />
                    </label>
                    <label className="design-settings-field">
                      <span>生产授权有效时长（小时）</span>
                      <input
                        defaultValue={configuration.values.liveSessionTtlHours}
                        max="8760"
                        min="0"
                        name="liveSessionTtlHours"
                        required
                        step="1"
                        type="number"
                      />
                      <small>默认 8 小时；0 表示永久有效，直到手动暂停、急停或撤销授权。</small>
                    </label>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>AI Provider</legend>
                  <div className="design-settings-form-grid">
                    <label className="design-settings-field">
                      <span>OpenAI 模型</span>
                      <input defaultValue={configuration.values.openaiModel} name="openaiModel" />
                    </label>
                    <OpenAiCompatibleModelFields
                      initialBaseUrl={configuration.values.openaiCompatibleBaseUrl}
                      initialModel={configuration.values.openaiCompatibleModel}
                      onLoadModels={onLoadOpenAiCompatibleModels}
                    />
                    <label className="design-settings-field">
                      <span>Ollama Base URL</span>
                      <input defaultValue={configuration.values.ollamaBaseUrl} name="ollamaBaseUrl" type="url" />
                    </label>
                    <label className="design-settings-field">
                      <span>Ollama 模型</span>
                      <input defaultValue={configuration.values.ollamaModel} name="ollamaModel" />
                    </label>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>密钥与私密地址</legend>
                  <SettingsSecretFields
                    names={platformSecretFields.filter((field) => !field.production)}
                    settings={configuration}
                  />
                </fieldset>
                <details className="design-settings-disclosure">
                  <summary>
                    <span>生产凭据（保存不会启用实盘交易）</span>
                    <Status tone="risk">独立门禁保持阻断</Status>
                  </summary>
                  <SettingsSecretFields
                    names={platformSecretFields.filter((field) => field.production)}
                    settings={configuration}
                  />
                </details>
                <div className="design-settings-actions">
                  <button
                    className="design-primary-action"
                    disabled={isSavingSettingsConfiguration || !onSaveSettingsConfiguration}
                    type="submit"
                  >
                    <Save size={15} />
                    {isSavingSettingsConfiguration ? "保存中…" : "保存配置"}
                  </button>
                  <button
                    className="design-secondary-action"
                    disabled={
                      isSavingSettingsConfiguration ||
                      isTestingMonitoringWebhook ||
                      !onTestMonitoringWebhook ||
                      !configuration.secrets.monitoringWebhookUrl.configured
                    }
                    onClick={onTestMonitoringWebhook}
                    type="button"
                  >
                    <Send size={14} />
                    {isTestingMonitoringWebhook ? "测试中…" : "测试 Webhook"}
                  </button>
                </div>
              </form>
            ) : (
              <p id="settings-configuration">
                {isLoadingSettingsConfiguration
                  ? "正在加载平台配置…"
                  : "核心服务尚未提供可写配置契约。"}
              </p>
            )}
          </SurfacePanel>
          {settingsConfigurationMessage ? (
            <p aria-live="polite" className="design-settings-message" role="status">
              {settingsConfigurationMessage}
            </p>
          ) : null}
          <SurfacePanel
            className="design-connector-overview"
            title="连接器状态与下一步"
          >
            <div className="design-connector-summary" id="settings-connectors">
              <article>
                <header>
                  <strong>数据源</strong>
                  <Status tone={dataAdapterHealthTone}>
                    {!settings || !dataAdapters.length
                      ? "未加载"
                      : readyDataAdapterCount === dataAdapters.length
                        ? "健康"
                        : "部分受限"}
                  </Status>
                </header>
                <dl>
                  <div><dt>阻断原因</dt><dd>{dataBlocker
                    ? providerHealthReason(dataBlocker.externalTelemetry.providerHealth.reason)
                    : settings && dataAdapters.length ? "无" : "核心服务状态未加载"}</dd></div>
                  <div><dt>影响</dt><dd>{settings && dataAdapters.length
                    ? `${readyDataAdapterCount}/${dataAdapters.length} 个适配器可直接使用`
                    : "不把静态配置当作健康状态"}</dd></div>
                  <div><dt>下一步</dt><dd>{dataBlocker
                    ? dataAdapterNextAction(dataBlocker)
                    : settings && dataAdapters.length ? "按需刷新只读行情" : "重新加载核心服务状态"}</dd></div>
                </dl>
                {missingInstallableDataDependencies.length && onInstallDataDependency ? (
                  <div className="design-settings-actions">
                    {missingInstallableDataDependencies.map((dependency) => (
                      <button
                        aria-label={`安装 ${dependency} 可选依赖`}
                        className="design-secondary-action"
                        disabled={Boolean(installingDataDependency)}
                        key={dependency}
                        onClick={() => onInstallDataDependency(dependency)}
                        type="button"
                      >
                        <Download
                          className={installingDataDependency === dependency ? "spin" : undefined}
                          size={12}
                        />
                        {installingDataDependency === dependency ? "正在安装…" : `安装 ${dependency}`}
                      </button>
                    ))}
                  </div>
                ) : null}
              </article>
              <article>
                <header>
                  <strong>AI Provider</strong>
                  <Status tone={aiProviderTone}>
                    {!aiReview.providers.length
                      ? "未加载"
                      : `${configuredAiProviders.length}/${aiReview.providers.length} 已配置`}
                  </Status>
                </header>
                <dl>
                  <div><dt>阻断原因</dt><dd>{
                    !aiReview.providers.length
                      ? "Provider 注册表未加载"
                      : !localAiProvider?.configured
                        ? "本地确定性基线不可用"
                        : configuredExternalAiProviders.length
                          ? "外部端点尚无健康探测证据"
                          : "外部服务未配置"
                  }</dd></div>
                  <div><dt>影响</dt><dd>配置只代表可选择；外部调用仍需逐次授权证据摘要</dd></div>
                  <div><dt>下一步</dt><dd>{
                    localAiProvider?.configured
                      ? "继续保留本地基线；外部调用前核对出站字段"
                      : "先恢复本地确定性基线"
                  }</dd></div>
                </dl>
              </article>
              <article>
                <header>
                  <strong>执行适配器</strong>
                  <Status tone={executionTone}>
                    {executionStatusLabel}
                  </Status>
                </header>
                <dl>
                  <div><dt>阻断原因</dt><dd>{
                    (latestHealthProbe && latestHealthProbe.status !== "ready"
                      ? latestHealthProbePending
                      : null) ??
                    runtimeBlockingReason ??
                    blockingChain?.blockerLabel ??
                    latestLedgerRow?.reason ??
                    (settings ? "生产门禁尚未全部通过" : "核心服务状态未加载")
                  }</dd></div>
                  <div><dt>影响</dt><dd>{settings
                    ? `当前执行模式：${
                      executionMode === "testnet" ? "测试网" : executionMode === "live" ? "生产实盘" : "模拟"
                    }；生产下单：${liveTradingAllowed ? "允许" : "未开启"}`
                    : "不推断订单提交或路由权限"}</dd></div>
                  <div><dt>下一步</dt><dd>{executionNextAction}</dd></div>
                </dl>
              </article>
            </div>
          </SurfacePanel>
          <SurfacePanel title="连接器详情（渐进披露）">
            <details className="design-settings-disclosure" id="settings-data-connectors">
              <summary>
                <span>数据源能力、冷却与最近成功证据</span>
                <Status tone={dataAdapterHealthTone}>
                  {settings && dataAdapters.length
                    ? `${readyDataAdapterCount}/${dataAdapters.length} 健康`
                    : "未加载"}
                </Status>
              </summary>
              <table className="design-table compact design-data-provider-table">
                <thead>
                  <tr>
                    <th>适配器 / 能力</th>
                    <th>健康</th>
                    <th>权限</th>
                    <th>冷却</th>
                    <th>最近成功证据</th>
                    <th>未决状态</th>
                    <th>下一步</th>
                  </tr>
                </thead>
                <tbody>
                  {dataAdapters.map((adapter) => {
                    const health = adapter.externalTelemetry.providerHealth;
                    const tone: ConnectorTone =
                      health.status === "ok"
                        ? adapter.status === "ready" ? "positive" : "warning"
                        : health.status === "blocked" ? "risk" : "warning";
                    return (
                      <tr key={adapter.id}>
                        <td>
                          <strong>{adapter.provider}</strong><br />
                          {adapter.capabilities.join(" / ")} · {adapter.timeframes.join(" / ")}
                          {" · "}{adapter.historyDepth ?? "深度未声明"}
                          <br />
                          {adapter.adjustmentModes?.join(" / ") || "复权未声明"}
                          {" · "}{adapter.freshnessSemantics ?? "时效未声明"}
                        </td>
                        <td>
                          <Status tone={tone}>{providerHealthLabel(health.status)}</Status>
                          <br />{providerHealthReason(health.reason)}
                        </td>
                        <td>
                          {adapter.credentialRequirements?.join(" / ") || "无需凭据"}
                          <br />{adapter.readOnly ? "只读" : "可写"} · {adapter.cacheScope}
                        </td>
                        <td>{health.retryAfterSeconds ? `${health.retryAfterSeconds} 秒` : "无"}</td>
                        <td>{connectorTimestamp(adapter.cacheDiagnostics.latestTimestamp)}</td>
                        <td>
                          {adapter.externalTelemetry.retryState}
                          {adapter.externalTelemetry.lastProviderError
                            ? ` · ${adapter.externalTelemetry.lastProviderError.category}`
                            : ""}
                        </td>
                        <td>{dataAdapterNextAction(adapter)}</td>
                      </tr>
                    );
                  })}
                  {!dataAdapters.length ? (
                    <tr><td colSpan={7}>核心服务能力矩阵未加载；不会用静态配置冒充健康状态。</td></tr>
                  ) : null}
                </tbody>
              </table>
              <section
                aria-label="基本面数据就绪状态"
                className="design-settings-fundamental-readiness"
              >
                <header>
                  <strong>AI 选股基本面数据</strong>
                  <span>
                    {fundamentalDataSources.filter((source) => source.status === "ready").length}
                    /{fundamentalDataSources.length} 已直接就绪
                  </span>
                </header>
                <table className="design-table compact">
                  <thead>
                    <tr>
                      <th>市场 / 数据源</th>
                      <th>状态</th>
                      <th>配置</th>
                      <th>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundamentalDataSources.map((source) => {
                      const marketLabel = source.market === "ashare"
                        ? "A 股"
                        : source.market === "us"
                          ? "美股"
                          : "加密资产";
                      const providerLabel = source.id === "ashare-akshare-financials"
                        ? "AKShare 财务"
                        : source.id === "us-sec-companyfacts"
                          ? "SEC Company Facts"
                          : "CoinGecko / Binance 映射";
                      const tone: ConnectorTone = source.status === "ready"
                        ? "positive"
                        : source.status === "ready_for_probe"
                          ? "warning"
                          : "risk";
                      return (
                        <tr key={source.id}>
                          <td><strong>{marketLabel}</strong><br />{providerLabel}</td>
                          <td>
                            <Status tone={tone}>
                              {source.status === "ready"
                                ? "就绪"
                                : source.status === "ready_for_probe"
                                  ? "运行时校验"
                                  : "阻断"}
                            </Status>
                          </td>
                          <td>{source.configured ? "已配置" : "未配置"}</td>
                          <td>{source.reason}</td>
                        </tr>
                      );
                    })}
                    {!fundamentalDataSources.length ? (
                      <tr>
                        <td colSpan={4}>基本面数据源状态尚未加载。</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </section>
            </details>
            <details className="design-settings-disclosure" id="settings-ai-connectors">
              <summary>
                <span>AI Provider 配置、权限与健康证据</span>
                <Status tone={aiProviderTone}>
                  {aiReview.providers.length
                    ? `${configuredAiProviders.length}/${aiReview.providers.length} 已配置`
                    : "未加载"}
                </Status>
              </summary>
              <table className="design-table compact">
                <thead>
                  <tr>
                    <th>Provider / 能力</th>
                    <th>配置状态</th>
                    <th>健康</th>
                    <th>权限</th>
                    <th>冷却 / 最近成功</th>
                    <th>未决状态</th>
                    <th>下一步</th>
                  </tr>
                </thead>
                <tbody>
                  {aiReview.providers.map((provider) => {
                    const local = provider.providerId === "local";
                    return (
                      <tr key={provider.providerId}>
                        <td>
                          <strong>{aiProviderLabels[provider.providerId]}</strong><br />
                          {provider.model ?? (local ? "deterministic" : "模型未配置")}
                          {" · "}{provider.sanitizedBaseUrl ?? (local ? "无外部端点" : "地址未配置")}
                        </td>
                        <td>{provider.configured ? "已配置" : "未配置"}</td>
                        <td>
                          <Status tone={local && provider.configured ? "positive" : provider.configured ? "warning" : "risk"}>
                            {local && provider.configured ? "本地基线可用" : provider.configured ? "健康未探测" : "不可用"}
                          </Status>
                        </td>
                        <td>{local ? "无出站" : "需逐次授权证据摘要"}</td>
                        <td>{local ? "不适用" : "未提供 · 暂无端点探测证据"}</td>
                        <td>{local ? "无" : provider.configured ? "端点健康待验证" : "配置缺失"}</td>
                        <td>{local
                          ? "保持确定性基线"
                          : provider.configured
                            ? "调用前核对出站字段并授权"
                            : "先完成服务配置"}</td>
                      </tr>
                    );
                  })}
                  {!aiReview.providers.length ? (
                    <tr><td colSpan={7}>Provider 注册表尚未加载。</td></tr>
                  ) : null}
                </tbody>
              </table>
            </details>
            <details className="design-settings-disclosure" id="settings-execution-connectors">
              <summary>
                <span>执行适配器权限、健康与链路证据</span>
                <Status tone={executionTone}>
                  {executionStatusLabel}
                </Status>
              </summary>
              <table className="design-table compact design-adapter-table">
                <thead>
                  <tr>
                    <th>适配器</th>
                    <th>状态</th>
                    <th>权限 / 凭据</th>
                    <th>冷却</th>
                    <th>最近状态证据</th>
                    <th>未决状态</th>
                    <th>下一步</th>
                  </tr>
                </thead>
                <tbody>
                  {executionAdapters.map((adapter) => {
                    const broker = adapterRows.find((row) => row.id === adapter.id);
                    const ledger = adapterLedgerRows.find((row) => row.adapterId === adapter.id);
                    const probe = adapterHealthProbeRows.find((row) => row.adapterId === adapter.id);
                    const chain = adapterChainHealthRollups.find((row) => row.adapterId === adapter.id);
                    const tone: ConnectorTone = chain
                      ? chain.tone
                      : ledger?.tone ?? (adapter.status === "paper_ready" ? "positive" : "warning");
                    return (
                      <tr key={adapter.id}>
                        <td>
                          <strong>{ledger?.adapter ?? broker?.adapter ?? adapter.adapter}</strong><br />
                          {adapter.market === "multi" ? "多市场" : terminalSurfaceZh.marketLabel(adapter.market)}
                          {" · "}{adapter.route === "paper" ? "模拟" : "实盘"}
                        </td>
                        <td>
                          <Status tone={tone}>
                            {chain?.headline ?? ledger?.label ?? (
                              {
                                paper_ready: "模拟可用",
                                interface_only: "仅接口",
                                config_required: "需要配置",
                                ready: "可用",
                                degraded: "受限",
                                blocked: "已阻断",
                              }[adapter.status] ?? adapter.status
                            )}
                          </Status>
                        </td>
                        <td>
                          {probe?.credentialSummary ?? broker?.certification ?? adapter.certification}
                          <br />实盘权限：{adapter.liveTradingAllowed ? "是" : "否"}
                        </td>
                        <td>未声明</td>
                        <td>{connectorTimestamp(
                          chain?.latestEvidenceTimestamp ?? probe?.timestamp ?? ledger?.timestamp,
                        )}</td>
                        <td>{chain?.blockerLabel ?? probe?.blockerSummary ?? ledger?.reason ?? broker?.certification ?? adapter.note}</td>
                        <td>{ledger?.nextStep ?? broker?.nextStep ?? (chain?.blockerLabel
                          ? `补齐 ${chain.blockerLabel} 证据`
                          : adapter.note)}</td>
                      </tr>
                    );
                  })}
                  {adapterHealthProbeRows
                    .filter((probe) => !executionAdapters.some((adapter) => adapter.id === probe.adapterId))
                    .map((probe) => {
                      const chain = adapterChainHealthRollups.find((row) => row.adapterId === probe.adapterId);
                      return (
                        <tr key={`probe:${probe.id}`}>
                          <td>
                            <strong>{probe.provider}:{probe.exchangeId}</strong><br />
                            {probe.adapterId} · {probe.mode === "sandbox" ? "沙箱" : probe.mode}
                          </td>
                          <td><Status tone={probe.tone}>{probe.statusLabel}</Status></td>
                          <td>{probe.credentialSummary}<br />{probe.boundary}</td>
                          <td>未声明</td>
                          <td>{connectorTimestamp(probe.timestamp)}</td>
                          <td>{chain?.blockerLabel ?? executionProbePending(probe)}</td>
                          <td>{probe.status === "ready"
                            ? "保持只读探测；生产权限仍需独立门禁"
                            : `处理 ${executionProbePending(probe)} 后重新检查`}</td>
                        </tr>
                      );
                    })}
                  {!executionAdapters.length ? (
                    <tr><td colSpan={7}>执行适配器状态未从核心服务加载。</td></tr>
                  ) : null}
                </tbody>
              </table>
            </details>
            <div className="design-live-warning small">
              <AlertTriangle size={14} />
              已配置不等于健康或已授权；原始能力、权限、冷却与证据仅在需要时展开。
            </div>
          </SurfacePanel>
        </div>
        <div className="design-settings-side" id="settings-safety">
          <SurfacePanel title="安全边界（核心服务）">
            <div className="design-check-row">
              <LockKeyhole size={13} />
              <span>模拟适配器就绪</span>
              <strong>{settings ? paperReadyAdapterCount : "未加载"}</strong>
            </div>
            <div className="design-check-row">
              <LockKeyhole size={13} />
              <span>允许实盘交易</span>
              <strong className={liveTradingAllowed ? "up" : "down"}>
                {settings ? (liveTradingAllowed ? "是" : "否") : "未加载"}
              </strong>
            </div>
            <div className="design-check-row">
              <LockKeyhole size={13} />
              <span>当前执行模式</span>
              <strong>
                {settings
                  ? executionMode === "testnet"
                    ? "测试网"
                    : executionMode === "live"
                      ? "生产实盘"
                      : "模拟"
                  : "未加载"}
              </strong>
            </div>
            <div className="design-kv-row">
              <span>必需门禁</span>
              <strong>{settings ? settings.safety.requiredGates.length : "未加载"}</strong>
            </div>
            <p className={settings && !liveTradingAllowed ? "down" : ""}>
              {settings
                ? liveTradingAllowed
                  ? `生产会话已授权${
                    settings.safety.liveAuthorizedUntil
                      ? `，有效至 ${connectorTimestamp(settings.safety.liveAuthorizedUntil)}`
                      : ""
                  }。`
                  : `${runtimeBlockingReason ?? "生产会话未开启"}；${executionNextAction}。`
                : "安全契约尚未加载。"}
            </p>
          </SurfacePanel>
          <SurfacePanel title="最近状态证据">
            <div className="design-kv-row">
              <span>设置快照</span>
              <strong>{connectorTimestamp(settings?.generatedAt)}</strong>
            </div>
            <div className="design-kv-row">
              <span>执行健康探测</span>
              <strong>{connectorTimestamp(adapterHealthProbeRows[0]?.timestamp)}</strong>
            </div>
            <div className="design-kv-row">
              <span>执行链路证据</span>
              <strong>{connectorTimestamp(
                adapterChainHealthRollups
                  .map((row) => row.latestEvidenceTimestamp)
                  .filter((value): value is string => Boolean(value))
                  .sort()
                  .at(-1),
              )}</strong>
            </div>
          </SurfacePanel>
          <SurfacePanel title="密钥处理规则">
            {[
              "密钥仅通过本机 API 提交",
              "SQLite 加密存储，响应仅返回掩码",
              "绝不写入 Dockerfile/镜像层",
              "绝不导出到日志/错误堆栈",
            ].map((label) => (
              <div className="design-check-row" key={label}>
                <CheckCircle2 size={13} />
                <span>{label}</span>
              </div>
            ))}
          </SurfacePanel>
          <SurfacePanel title="只读操作">
            <button
              className="design-secondary-action"
              disabled={action.disabled}
              onClick={action.onClick}
              type="button"
            >
              <RefreshCw className={action.disabled ? "spin" : undefined} size={13} />
              {action.label}
            </button>
          </SurfacePanel>
        </div>
      </div>
    </>
  );
}
