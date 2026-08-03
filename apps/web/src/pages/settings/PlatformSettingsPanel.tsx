import { formatChartDate } from "../../components/AiReviewAuditBoards";
import { Panel } from "../../components/AppPanel";
import { type AppI18n } from "../../lib/i18n";
import { MarketKlinesResult, PlatformSettingsStatus } from "../../lib/terminal-api";
import { BrokerAdapterRow, ExecutionAdapterCertificationApplyConfirmationKey, ExecutionAdapterCertificationApplyConfirmations, ExecutionAdapterCertificationApplyRow, ExecutionAdapterCertificationRow, ExecutionAdapterChainHealthRollup, ExecutionAdapterHealthProbeRow, ExecutionAdapterHumanConfirmationRow, ExecutionAdapterLedgerRow, ExecutionAdapterOpsStateRow, ExecutionAdapterOrchestrationDryRunRow, ExecutionAdapterOrchestrationExecutionRow, ExecutionAdapterPaperExecutionRow, ExecutionAdapterPaperOrderLifecycleRow, ExecutionAdapterPaperRouteRunbookRow, ExecutionAdapterProductionRouteReviewRow, ExecutionAdapterRuntimeReloadAcceptanceRow, ExecutionAdapterRuntimeReloadExecutionRow, ExecutionAdapterSandboxOrderSchemaDryRunRow, ExecutionAdapterSandboxProbeExecutionRow, ExecutionAdapterSandboxProbePlanRow, ExecutionAdapterSandboxProbeReviewRow, TerminalWorkspace, buildExecutionAdapterCertificationApplyConfirmationRows, createDefaultExecutionAdapterCertificationApplyConfirmations } from "../../lib/terminal-workbench";
import { AdapterChainHealthList } from "../backtest/P2ReviewPanels";
import { adapterCertificationAdapterName, adapterCertificationApplyBlockerSummary, adapterCertificationApplyConfirmationDetail, adapterCertificationApplyConfirmationLabel, adapterCertificationApplyConfirmationSummary, adapterCertificationApplyModeLabel, adapterCertificationApplyStatusLabel, adapterCertificationBoundaryLabel, adapterCertificationCheckSummary, adapterCertificationStatusLabel, adapterHealthProbeBlockerLabel, adapterHealthProbeBoundaryLabel, adapterHealthProbeCheckStatusLabel, adapterHealthProbeCheckSummaryLabel, adapterHealthProbeCredentialSummaryLabel, adapterHealthProbeRouteReviewSummaryLabel, adapterHealthProbeStatusLabel, adapterHumanConfirmationConfirmationSummary, adapterHumanConfirmationStatusLabel, adapterLedgerAdapterName, adapterLedgerGateSummary, adapterLedgerLabel, adapterLedgerNextStep, adapterLedgerReason, adapterOpsStateBoundaryLabel, adapterOpsStateConfirmationSummary, adapterOpsStateStatusLabel, adapterOrchestrationDryRunConfirmationSummary, adapterOrchestrationDryRunStatusLabel, adapterOrchestrationExecutionConfirmationSummary, adapterOrchestrationExecutionStatusLabel, adapterPaperExecutionBoundaryLabel, adapterPaperExecutionConfirmationSummary, adapterPaperExecutionStatusLabel, adapterPaperOrderLifecycleBoundaryLabel, adapterPaperOrderLifecycleConfirmationSummary, adapterPaperOrderLifecycleStatusLabel, adapterPaperRouteRunbookBoundaryLabel, adapterPaperRouteRunbookConfirmationSummary, adapterPaperRouteRunbookStatusLabel, adapterProductionRouteReviewConfirmationSummary, adapterProductionRouteReviewStatusLabel, adapterRuntimeReloadAcceptanceConfirmationSummary, adapterRuntimeReloadAcceptanceStatusLabel, adapterRuntimeReloadExecutionConfirmationSummary, adapterRuntimeReloadExecutionStatusLabel, adapterSandboxOrderSchemaDryRunBoundaryLabel, adapterSandboxOrderSchemaDryRunConfirmationSummary, adapterSandboxOrderSchemaDryRunStatusLabel, adapterSandboxProbeExecutionConfirmationSummary, adapterSandboxProbeExecutionStatusLabel, adapterSandboxProbePlanConfirmationSummary, adapterSandboxProbePlanStatusLabel, adapterSandboxProbeReviewConfirmationSummary, adapterSandboxProbeReviewStatusLabel } from "../execution/AdapterFormatters";
import { createDefaultExecutionAdapterHumanConfirmationConfirmations, createDefaultExecutionAdapterOpsStateConfirmations, createDefaultExecutionAdapterOrchestrationDryRunConfirmations, createDefaultExecutionAdapterOrchestrationExecutionConfirmations, createDefaultExecutionAdapterPaperExecutionConfirmations, createDefaultExecutionAdapterProductionRouteReviewConfirmations, createDefaultExecutionAdapterRuntimeReloadAcceptanceConfirmations, createDefaultExecutionAdapterSandboxProbeExecutionConfirmations, createDefaultExecutionAdapterSandboxProbePlanConfirmations, createDefaultExecutionAdapterSandboxProbeReviewConfirmations, executionAdapterHumanConfirmationConfirmationRows, executionAdapterOpsStateConfirmationRows, executionAdapterOrchestrationDryRunConfirmationRows, executionAdapterOrchestrationExecutionConfirmationRows, executionAdapterPaperExecutionConfirmationRows, executionAdapterProductionRouteReviewConfirmationRows, executionAdapterRuntimeReloadAcceptanceConfirmationRows, executionAdapterSandboxProbeExecutionConfirmationRows, executionAdapterSandboxProbePlanConfirmationRows, executionAdapterSandboxProbeReviewConfirmationRows, type ExecutionAdapterHumanConfirmationConfirmations, type ExecutionAdapterOpsStateConfirmations, type ExecutionAdapterOrchestrationDryRunConfirmations, type ExecutionAdapterOrchestrationExecutionConfirmations, type ExecutionAdapterPaperExecutionConfirmations, type ExecutionAdapterProductionRouteReviewConfirmations, type ExecutionAdapterRuntimeReloadAcceptanceConfirmations, type ExecutionAdapterSandboxProbeExecutionConfirmations, type ExecutionAdapterSandboxProbePlanConfirmations, type ExecutionAdapterSandboxProbeReviewConfirmations } from "../execution/ExecutionConfirmations";
import { MarketDataProviderHealthTrendStrip } from "../market/MarketWorkspaceComponents";
import { formatCacheContextRange } from "./cache-range";
import { cacheContextKey, cacheFreshnessLabel, marketDataAdapterCacheDiagnosticsLabel, marketDataAdapterExternalTelemetryLabel, marketDataAdapterInstallGuidanceLabel, marketDataAdapterProviderErrorLabel, marketDataAdapterProviderHealthLabel, settingsKeyStatusLabel, settingsStatusLabel } from "./SettingsFormatters";
import { Copy, Play, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { SettingsExecutionEvidence } from "./SettingsExecutionEvidence";
import { type PlatformSettingsPanelProps } from "./PlatformSettingsPanel.types";

export function PlatformSettingsPanel(props: PlatformSettingsPanelProps) {
  const {
  adapterCertificationApplyConfirmations,
  adapterCertificationApplyRows,
  adapterCertificationRows,
  adapterChainHealthRollups,
  adapterHealthProbeRows,
  adapterRows,
  adapterLedgerRows,
  applyingAdapterCertificationId,
  className,
  i18n,
  isRefreshingAdapterHealthProbe,
  onApplyAdapterCertification,
  onApplyConfirmationChange,
  onHumanConfirmationChange,
  onOrchestrationDryRunConfirmationChange,
  onOrchestrationExecutionConfirmationChange,
  onSandboxProbeExecutionConfirmationChange,
  onSandboxProbePlanConfirmationChange,
  onSandboxProbeReviewConfirmationChange,
  onProductionRouteReviewConfirmationChange,
  onOpsStateConfirmationChange,
  onPaperExecutionConfirmationChange,
  onRecordAdapterCertification,
  onRecordHumanConfirmation,
  onRecordOrchestrationDryRun,
  onRecordOrchestrationExecution,
  onRecordProductionRouteReview,
  onRecordOpsState,
  onRecordPaperExecution,
  onRecordRuntimeReloadAcceptance,
  onRecordSandboxProbeExecution,
  onRecordSandboxProbePlan,
  onRecordSandboxProbeReview,
  onFocusPaperExecutionAudit,
  onCopyPaperExecutionAuditLink,
  onRefreshAdapterHealthProbe,
  onRefreshContext,
  onOpenMarketDataAdapterWorkflow,
  onRuntimeReloadAcceptanceConfirmationChange,
  recordingAdapterCertificationId,
  recordingHumanConfirmationId,
  recordingOrchestrationDryRunId,
  recordingOrchestrationExecutionId,
  recordingRuntimeReloadAcceptanceId,
  recordingSandboxProbeExecutionId,
  recordingSandboxProbePlanId,
  recordingSandboxProbeReviewId,
  recordingProductionRouteReviewId,
  recordingOpsStateId,
  recordingPaperExecutionId,
  humanConfirmationConfirmations,
  humanConfirmationRows,
  orchestrationDryRunConfirmations,
  orchestrationDryRunRows,
  orchestrationExecutionConfirmations,
  orchestrationExecutionRows,
  refreshingCacheKey,
  runtimeReloadAcceptanceConfirmations,
  runtimeReloadAcceptanceRows,
  runtimeReloadExecutionRows,
  sandboxProbeExecutionConfirmations,
  sandboxProbeExecutionRows,
  sandboxProbePlanConfirmations,
  sandboxProbePlanRows,
  sandboxProbeReviewConfirmations,
  sandboxProbeReviewRows,
  adapterSandboxOrderSchemaDryRunRows,
  adapterPaperOrderLifecycleRows,
  adapterPaperRouteRunbookRows,
  adapterOpsStateRows,
  adapterOpsStateConfirmations,
  adapterPaperExecutionRows,
  adapterPaperExecutionConfirmations,
  productionRouteReviewConfirmations,
  productionRouteReviewRows,
  focusedPaperExecutionAuditEventId,
  settings,
  state,
  workspace
} = props;
  const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
  const dataSources = settings?.dataSources ?? [
    {
      market: workspace.selectedInstrument.market,
      label: i18n.marketLabel(workspace.selectedInstrument.market),
      quoteSource: state.quality.source,
      klineSource: state.quality.source,
      status: state.quality.isComplete ? "ready" : "degraded",
      optionalKeyName: null,
      optionalKeyConfigured: false,
      note:
        state.quality.warnings[0] ??
        (i18n.locale === "zh-CN"
          ? "当前图表数据源状态来自本地页面回退。"
          : "Current chart source status comes from the local page fallback.")
    }
  ];
  const marketDataAdapters = settings?.marketDataAdapters ?? [];
  const executionAdapters = settings?.executionAdapters ?? adapterRows.map((row) => ({
    id: row.id,
    market: row.market,
    adapter: row.adapter,
    route: row.route,
    status: row.status,
    certification: row.certification,
    liveTradingAllowed: false,
    note: row.nextStep
  }));
  const liveAdapterCount =
    settings?.executionAdapters.filter((row) => row.route === "live").length ??
    adapterRows.filter((row) => row.route === "live").length;
  const cacheStatus = settings?.cache;
  const cacheLatestLabel = cacheStatus?.latestTimestamp
    ? formatChartDate(cacheStatus.latestTimestamp)
    : i18n.locale === "zh-CN"
      ? "暂无 K 线"
      : "No bars yet";
  const cacheStatsLabel = cacheStatus
    ? i18n.locale === "zh-CN"
      ? `${cacheStatus.rowCount.toLocaleString("zh-CN")} 行 · ${cacheStatus.contextCount.toLocaleString(
          "zh-CN"
        )} 个上下文 · 最新 ${cacheLatestLabel}`
      : `${cacheStatus.rowCount.toLocaleString("en-US")} rows · ${cacheStatus.contextCount.toLocaleString(
          "en-US"
        )} contexts · latest ${cacheLatestLabel}`
    : "";
  const cacheFreshnessSummary = cacheStatus?.freshnessSummary;
  const cacheFreshnessSummaryLabel = cacheFreshnessSummary
    ? i18n.locale === "zh-CN"
      ? `新鲜 ${cacheFreshnessSummary.fresh.toLocaleString("zh-CN")} · 过期 ${cacheFreshnessSummary.stale.toLocaleString(
          "zh-CN"
        )} · 空 ${cacheFreshnessSummary.empty.toLocaleString("zh-CN")}`
      : `Fresh ${cacheFreshnessSummary.fresh.toLocaleString("en-US")} · Stale ${cacheFreshnessSummary.stale.toLocaleString(
          "en-US"
        )} · Empty ${cacheFreshnessSummary.empty.toLocaleString("en-US")}`
    : "";
  const cacheRowTone =
    cacheStatus && cacheStatus.exists && cacheFreshnessSummary && cacheFreshnessSummary.stale === 0 && cacheFreshnessSummary.empty === 0
      ? "positive"
      : "warning";

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "平台设置" : "Platform Settings"}
      subtitle={i18n.locale === "zh-CN" ? "数据源、API Key、安全闸门" : "Data sources, API keys, safety gates"}
      className={className}
    >
      <div className="settings-grid">
        <article className="positive">
          <span>{i18n.locale === "zh-CN" ? "行情源" : "Market data"}</span>
          <strong>{dataSources.length}</strong>
          <p>{i18n.locale === "zh-CN" ? "A 股 / 美股 / 加密货币通过统一 OHLCV schema 接入，并显示可用性。" : "A shares, US equities, and crypto expose shared OHLCV readiness."}</p>
        </article>
        <article className="warning">
          <span>{i18n.locale === "zh-CN" ? "API Key" : "API keys"}</span>
          <strong>{dataSources.filter((row) => row.optionalKeyConfigured).length}</strong>
          <p>{i18n.locale === "zh-CN" ? "只显示是否配置，不把密钥值返回给浏览器。" : "Only configured flags are shown; secret values never return to the browser."}</p>
        </article>
        <article className="risk">
          <span>{i18n.locale === "zh-CN" ? "实盘闸门" : "Live gates"}</span>
          <strong>{blockedGateCount}</strong>
          <p>{i18n.locale === "zh-CN" ? "适配器认证、风控审批、人工确认缺一不可。" : "Adapter certification, risk approval, and human confirmation are all required."}</p>
        </article>
        <article className="neutral">
          <span>{i18n.locale === "zh-CN" ? "适配器" : "Adapters"}</span>
          <strong>{liveAdapterCount}</strong>
          <p>{i18n.locale === "zh-CN" ? "实盘适配器目前仅保留接口和认证状态。" : "Live adapters currently expose contracts and certification state only."}</p>
        </article>
      </div>
      <div className="settings-source-list">
        {dataSources.map((row) => (
          <article className={`settings-source-row ${row.status}`} key={`source-${row.market}`}>
            <span>{i18n.marketLabel(row.market)}</span>
            <strong>{row.label}</strong>
            <p>{row.quoteSource} · {row.klineSource}</p>
            <em>
              {settingsStatusLabel(i18n, row.status)} ·{" "}
              {settingsKeyStatusLabel(i18n, row.optionalKeyName, row.optionalKeyConfigured)}
            </em>
          </article>
        ))}
      </div>
      {marketDataAdapters.length ? (
        <div className="settings-source-list adapters">
          {marketDataAdapters.map((row) => (
            <article className={`settings-source-row ${row.status}`} key={`market-adapter-${row.id}`}>
              <span>{i18n.marketLabel(row.market)}</span>
              <strong>{row.adapter}</strong>
              <p>{row.provider} · {row.route} · {row.cacheScope}</p>
              <em>
                {settingsStatusLabel(i18n, row.status)} ·{" "}
                {row.requiresApiKey || row.requiresTradingKey
                  ? i18n.locale === "zh-CN"
                    ? "需要配置密钥"
                    : "Key required"
                  : i18n.locale === "zh-CN"
                    ? "无需交易密钥"
                    : "No trading key"}
              </em>
              <small>
                {marketDataAdapterExternalTelemetryLabel(i18n, row.externalTelemetry)} ·{" "}
                {marketDataAdapterProviderHealthLabel(i18n, row.externalTelemetry.providerHealth)} ·{" "}
                {marketDataAdapterInstallGuidanceLabel(i18n, row.externalTelemetry.installGuidance)} ·{" "}
                {marketDataAdapterCacheDiagnosticsLabel(i18n, row.cacheDiagnostics)} · {row.capabilities.join(" / ")} ·{" "}
                {row.timeframes.join(" / ")}
              </small>
              {row.historyDepth ? (
                <small>
                  {i18n.locale === "zh-CN" ? "历史深度" : "History"} {row.historyDepth} ·{" "}
                  {i18n.locale === "zh-CN" ? "复权" : "Adjustment"} {(row.adjustmentModes ?? ["none"]).join(" / ")} ·{" "}
                  {i18n.locale === "zh-CN" ? "时效" : "Freshness"} {row.freshnessSemantics ?? "unknown"} ·{" "}
                  {row.readOnly
                    ? i18n.locale === "zh-CN"
                      ? "只读"
                      : "Read only"
                    : i18n.locale === "zh-CN"
                      ? "可写"
                      : "Writable"}
                </small>
              ) : null}
              <MarketDataProviderHealthTrendStrip i18n={i18n} health={row.externalTelemetry.providerHealth} />
              {row.externalTelemetry.lastProviderError ? (
                <small>{marketDataAdapterProviderErrorLabel(i18n, row.externalTelemetry.lastProviderError)}</small>
              ) : null}
              {onOpenMarketDataAdapterWorkflow ? (
                <button
                  className="adapter-certification-button"
                  onClick={() => onOpenMarketDataAdapterWorkflow(row)}
                  type="button"
                >
                  <RefreshCw size={13} />
                  {i18n.locale === "zh-CN" ? "打开缓存工作流" : "Open cache workflow"}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
      <div className="settings-source-list adapters">
        {executionAdapters.map((row) => (
          <article className={`settings-source-row ${row.status}`} key={`adapter-${row.id}`}>
            <span>
              {row.route === "live" ? (i18n.locale === "zh-CN" ? "实盘" : "Live") : i18n.locale === "zh-CN" ? "模拟" : "Paper"}
            </span>
            <strong>{row.adapter}</strong>
            <p>{row.certification}</p>
            <em>
              {settingsStatusLabel(i18n, row.status)} ·{" "}
              {row.liveTradingAllowed
                ? i18n.locale === "zh-CN"
                  ? "允许实盘"
                  : "Live allowed"
                : i18n.locale === "zh-CN"
                  ? "实盘关闭"
                  : "Live blocked"}
            </em>
            {row.route === "live" && onRecordAdapterCertification ? (
              <button
                className="adapter-certification-button"
                disabled={recordingAdapterCertificationId === row.id}
                onClick={() => onRecordAdapterCertification(row)}
                type="button"
              >
                <ShieldCheck size={13} />
                {recordingAdapterCertificationId === row.id
                  ? i18n.locale === "zh-CN"
                    ? "记录中"
                    : "Recording"
                  : i18n.locale === "zh-CN"
                    ? "记录认证"
                    : "Record evidence"}
              </button>
            ) : null}
          </article>
        ))}
      </div>
      <div className="adapter-health-probe-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "真实适配器健康检查" : "Real adapter health"}</span>
          <button
            className="adapter-certification-button"
            disabled={isRefreshingAdapterHealthProbe || !onRefreshAdapterHealthProbe}
            onClick={onRefreshAdapterHealthProbe}
            type="button"
          >
            <RefreshCw size={13} />
            {isRefreshingAdapterHealthProbe
              ? i18n.locale === "zh-CN"
                ? "检查中"
                : "Checking"
              : i18n.locale === "zh-CN"
                ? "刷新"
                : "Refresh"}
          </button>
        </div>
        {adapterHealthProbeRows.length ? (
          adapterHealthProbeRows.map((row) => (
            <article className={`adapter-health-probe-row ${row.tone}`} key={row.id}>
              <div>
                <strong>
                  {row.provider.toUpperCase()} {row.exchangeId} · {adapterHealthProbeStatusLabel(i18n, row.statusLabel)}
                </strong>
                <span>
                  {row.marketSummary} · {adapterHealthProbeCredentialSummaryLabel(i18n, row.credentialSummary)}
                </span>
                <small>{adapterHealthProbeRouteReviewSummaryLabel(i18n, row.routeReviewSummary)}</small>
              </div>
              <p>
                {adapterHealthProbeCheckSummaryLabel(i18n, row.checkSummary)} ·{" "}
                {adapterHealthProbeBoundaryLabel(i18n, row.boundary)}
              </p>
              <em>{adapterHealthProbeBlockerLabel(i18n, row.blockerSummary)}</em>
              <div className="adapter-health-probe-checks">
                {row.checks.slice(0, 4).map((check) => (
                  <span className={`adapter-health-probe-check ${check.status}`} key={`${row.id}-${check.id}`}>
                    {check.label}: {adapterHealthProbeCheckStatusLabel(i18n, check.status)}
                  </span>
                ))}
              </div>
            </article>
          ))
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待本地核心返回 ccxt sandbox/testnet 只读健康检查。"
              : "Waiting for the local core to return the ccxt sandbox/testnet read-only health probe."}
          </p>
        )}
      </div>
      <div className="settings-adapter-chain-health">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "实盘前链路总览" : "Pre-live chain overview"}</span>
          <strong>{adapterChainHealthRollups.length}</strong>
        </div>
        <AdapterChainHealthList i18n={i18n} rollups={adapterChainHealthRollups} />
      </div>
      {adapterLedgerRows.length ? (
        <div className="adapter-ledger-list">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "适配器状态账本" : "Adapter state ledger"}</span>
            <strong>{adapterLedgerRows.length}</strong>
          </div>
          {adapterLedgerRows.map((row) => (
            <article className={`adapter-ledger-row ${row.tone}`} key={row.id}>
              <div>
                <strong>{adapterLedgerLabel(i18n, row)}</strong>
                <span>
                  {adapterLedgerAdapterName(i18n, row)} · {adapterLedgerGateSummary(i18n, row.gateSummary)}
                </span>
              </div>
              <p>{adapterLedgerReason(i18n, row)}</p>
              <em>{adapterLedgerNextStep(i18n, row)}</em>
            </article>
          ))}
        </div>
      ) : null}
      {adapterCertificationRows.length ? (
        <div className="adapter-certification-list">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "适配器认证流水" : "Adapter certification evidence"}</span>
            <strong>{adapterCertificationRows.length}</strong>
          </div>
          {adapterCertificationRows.map((row) => (
            <article className={`adapter-certification-row ${row.tone}`} key={row.id}>
              <div>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterCertificationStatusLabel(i18n, row.statusLabel)}
                </strong>
                <span>{formatChartDate(row.timestamp)}</span>
              </div>
              <p>{adapterCertificationBoundaryLabel(i18n, row.boundary)}</p>
              <em>
                {adapterCertificationCheckSummary(i18n, row.checkSummary)} · {row.auditEventId}
              </em>
              {onApplyConfirmationChange ? (
                <div className="adapter-certification-apply-confirmations">
                  {buildExecutionAdapterCertificationApplyConfirmationRows(
                    adapterCertificationApplyConfirmations[row.id] ??
                      createDefaultExecutionAdapterCertificationApplyConfirmations()
                  ).map((confirmation) => (
                    <label className={`adapter-certification-apply-confirmation ${confirmation.tone}`} key={confirmation.id}>
                      <input
                        checked={confirmation.checked}
                        onChange={(event) => onApplyConfirmationChange(row.id, confirmation.key, event.currentTarget.checked)}
                        type="checkbox"
                      />
                      <span>
                        <strong>{adapterCertificationApplyConfirmationLabel(i18n, confirmation.label)}</strong>
                        <em>{adapterCertificationApplyConfirmationDetail(i18n, confirmation.detail)}</em>
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}
              {onApplyAdapterCertification ? (
                <button
                  className="adapter-certification-apply-button"
                  disabled={applyingAdapterCertificationId === row.id}
                  onClick={() => onApplyAdapterCertification(row)}
                  type="button"
                >
                  <RefreshCw size={13} />
                  {applyingAdapterCertificationId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "预检中"
                      : "Checking"
                    : i18n.locale === "zh-CN"
                      ? "应用预检"
                      : "Apply preflight"}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
      {adapterCertificationApplyRows.length ? (
        <div className="adapter-certification-apply-list">
          <div className="paper-blotter-title">
            <span>{i18n.locale === "zh-CN" ? "应用预检结果" : "Apply preflight results"}</span>
            <strong>{adapterCertificationApplyRows.length}</strong>
          </div>
          {adapterCertificationApplyRows.map((row) => (
            <article className={`adapter-certification-apply-row ${row.tone}`} key={row.id}>
              <div>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterCertificationApplyStatusLabel(i18n, row.statusLabel)}
                </strong>
                <span>{formatChartDate(row.timestamp)}</span>
              </div>
              <p>{adapterCertificationBoundaryLabel(i18n, row.boundary)}</p>
              <em>
                {adapterCertificationApplyConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                {adapterCertificationApplyModeLabel(i18n, row.applyMode)} · {row.auditEventId}
              </em>
            </article>
          ))}
        </div>
      ) : null}
      <div className="adapter-runtime-reload-acceptance-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "运行时重载最终验收" : "Runtime reload final acceptance"}</span>
          <strong>{runtimeReloadExecutionRows.length}</strong>
        </div>
        {runtimeReloadExecutionRows.length ? (
          runtimeReloadExecutionRows.slice(0, 4).map((row) => {
            const confirmations =
              runtimeReloadAcceptanceConfirmations[row.id] ??
              createDefaultExecutionAdapterRuntimeReloadAcceptanceConfirmations();
            const acceptance = runtimeReloadAcceptanceRows.find(
              (item) => item.adapterId === row.adapterId && item.executionId === row.id
            );
            return (
              <article className={`adapter-runtime-reload-acceptance-row ${acceptance?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterRuntimeReloadExecutionStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterRuntimeReloadExecutionConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-runtime-reload-acceptance-confirmations">
                  {executionAdapterRuntimeReloadAcceptanceConfirmationRows.map((confirmation) => (
                    <label
                      className={`adapter-runtime-reload-acceptance-confirmation ${
                        confirmations[confirmation.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${confirmation.key}`}
                    >
                      <input
                        checked={confirmations[confirmation.key]}
                        onChange={(event) =>
                          onRuntimeReloadAcceptanceConfirmationChange?.(
                            row.id,
                            confirmation.key,
                            event.currentTarget.checked
                          )
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? confirmation.labelZh : confirmation.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingRuntimeReloadAcceptanceId === row.id || !onRecordRuntimeReloadAcceptance}
                  onClick={() => onRecordRuntimeReloadAcceptance?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingRuntimeReloadAcceptanceId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "验收中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录最终验收"
                      : "Record acceptance"}
                </button>
                {acceptance ? (
                  <div className={`adapter-runtime-reload-acceptance-result ${acceptance.tone}`}>
                    <strong>{adapterRuntimeReloadAcceptanceStatusLabel(i18n, acceptance.statusLabel)}</strong>
                    <span>
                      {adapterRuntimeReloadAcceptanceConfirmationSummary(i18n, acceptance.confirmationSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, acceptance.boundary)}
                    </span>
                    <em>{acceptance.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待录入最终验收；录入后仍保持实盘阻断。"
                      : "Waiting for final acceptance; live routing stays blocked after recording."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待运行时重载执行证据；记录执行证据后才能录入最终验收。"
              : "Waiting for runtime reload execution evidence before final acceptance can be recorded."}
          </p>
        )}
      </div>
      <div className="adapter-orchestration-dry-run-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "适配器编排 dry-run" : "Adapter orchestration dry run"}</span>
          <strong>{runtimeReloadAcceptanceRows.length}</strong>
        </div>
        {runtimeReloadAcceptanceRows.length ? (
          runtimeReloadAcceptanceRows.slice(0, 4).map((row) => {
            const confirmations =
              orchestrationDryRunConfirmations[row.id] ??
              createDefaultExecutionAdapterOrchestrationDryRunConfirmations();
            const dryRun = orchestrationDryRunRows.find(
              (item) => item.adapterId === row.adapterId && item.acceptanceId === row.id
            );
            return (
              <article className={`adapter-orchestration-dry-run-row ${dryRun?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterRuntimeReloadAcceptanceStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterRuntimeReloadAcceptanceConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-orchestration-dry-run-confirmations">
                  {executionAdapterOrchestrationDryRunConfirmationRows.map((confirmation) => (
                    <label
                      className={`adapter-orchestration-dry-run-confirmation ${
                        confirmations[confirmation.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${confirmation.key}`}
                    >
                      <input
                        checked={confirmations[confirmation.key]}
                        onChange={(event) =>
                          onOrchestrationDryRunConfirmationChange?.(
                            row.id,
                            confirmation.key,
                            event.currentTarget.checked
                          )
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? confirmation.labelZh : confirmation.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingOrchestrationDryRunId === row.id || !onRecordOrchestrationDryRun}
                  onClick={() => onRecordOrchestrationDryRun?.(row)}
                  type="button"
                >
                  <Play size={13} />
                  {recordingOrchestrationDryRunId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "记录中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录 dry-run"
                      : "Record dry run"}
                </button>
                {dryRun ? (
                  <div className={`adapter-orchestration-dry-run-result ${dryRun.tone}`}>
                    <strong>{adapterOrchestrationDryRunStatusLabel(i18n, dryRun.statusLabel)}</strong>
                    <span>
                      {adapterOrchestrationDryRunConfirmationSummary(i18n, dryRun.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, dryRun.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, dryRun.boundary)}
                    </span>
                    <em>{dryRun.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待录入编排 dry-run；录入后仍不连接券商、不路由实盘订单。"
                      : "Waiting for orchestration dry-run; recording still avoids broker connections and live orders."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待运行时重载最终验收；验收完成后才能录入适配器编排 dry-run。"
              : "Waiting for runtime reload final acceptance before adapter orchestration dry-run can be recorded."}
          </p>
        )}
      </div>
      <div className="adapter-orchestration-execution-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "受控编排执行证据" : "Controlled orchestration execution"}</span>
          <strong>{orchestrationDryRunRows.length}</strong>
        </div>
        {orchestrationDryRunRows.length ? (
          orchestrationDryRunRows.slice(0, 4).map((row) => {
            const confirmations =
              orchestrationExecutionConfirmations[row.id] ??
              createDefaultExecutionAdapterOrchestrationExecutionConfirmations();
            const execution = orchestrationExecutionRows.find(
              (item) => item.adapterId === row.adapterId && item.dryRunId === row.id
            );
            return (
              <article className={`adapter-orchestration-execution-row ${execution?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterOrchestrationDryRunStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterOrchestrationDryRunConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-orchestration-execution-confirmations">
                  {executionAdapterOrchestrationExecutionConfirmationRows.map((confirmation) => (
                    <label
                      className={`adapter-orchestration-execution-confirmation ${
                        confirmations[confirmation.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${confirmation.key}`}
                    >
                      <input
                        checked={confirmations[confirmation.key]}
                        onChange={(event) =>
                          onOrchestrationExecutionConfirmationChange?.(
                            row.id,
                            confirmation.key,
                            event.currentTarget.checked
                          )
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? confirmation.labelZh : confirmation.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingOrchestrationExecutionId === row.id || !onRecordOrchestrationExecution}
                  onClick={() => onRecordOrchestrationExecution?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingOrchestrationExecutionId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "记录中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录执行证据"
                      : "Record execution evidence"}
                </button>
                {execution ? (
                  <div className={`adapter-orchestration-execution-result ${execution.tone}`}>
                    <strong>{adapterOrchestrationExecutionStatusLabel(i18n, execution.statusLabel)}</strong>
                    <span>
                      {adapterOrchestrationExecutionConfirmationSummary(i18n, execution.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, execution.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, execution.boundary)}
                    </span>
                    <em>{execution.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待录入受控编排执行证据；录入仍不会连接券商或路由任何订单。"
                      : "Waiting for controlled orchestration execution evidence; recording still avoids broker connections and all order routing."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待适配器编排 dry-run；dry-run 完整后才能记录受控执行证据。"
              : "Waiting for adapter orchestration dry-run before controlled execution evidence can be recorded."}
          </p>
        )}
      </div>
      <SettingsExecutionEvidence {...props} />
      {cacheStatus ? (
        <div className={`settings-cache-row ${cacheRowTone}`}>
          <span>{i18n.locale === "zh-CN" ? "本地缓存" : "Local cache"}</span>
          <strong>{cacheStatus.engine} · {cacheStatus.scope}</strong>
          <p>{cacheStatus.path}</p>
          <p className="settings-cache-stats">{cacheStatsLabel}</p>
          <p className="settings-cache-health">{cacheFreshnessSummaryLabel}</p>
        </div>
      ) : null}
      {cacheStatus?.contexts.length ? (
        <div className="settings-cache-contexts">
          <span>{i18n.locale === "zh-CN" ? "缓存上下文" : "Cache contexts"}</span>
          <div>
            {cacheStatus.contexts.map((context) => (
              <article className={context.freshness} key={`${context.market}-${context.symbol}-${context.timeframe}`}>
                <strong>
                  {i18n.marketLabel(context.market)} · {context.symbol} · {context.timeframe}
                </strong>
                <p>
                  {i18n.locale === "zh-CN"
                    ? `${context.rowCount.toLocaleString("zh-CN")} 行 · ${formatCacheContextRange(context.startTimestamp, context.endTimestamp)}`
                    : `${context.rowCount.toLocaleString("en-US")} rows · ${formatCacheContextRange(context.startTimestamp, context.endTimestamp)}`}
                </p>
                <div className="settings-cache-context-actions">
                  <em>{cacheFreshnessLabel(i18n, context.freshness, context.ageHours)}</em>
                  {onRefreshContext ? (
                    <button
                      type="button"
                      className="settings-cache-refresh"
                      disabled={refreshingCacheKey === cacheContextKey(context)}
                      onClick={() => onRefreshContext(context)}
                    >
                      <RefreshCw size={12} />
                      {refreshingCacheKey === cacheContextKey(context)
                        ? i18n.locale === "zh-CN"
                          ? "刷新中"
                          : "Refreshing"
                        : i18n.locale === "zh-CN"
                          ? "刷新"
                          : "Refresh"}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
