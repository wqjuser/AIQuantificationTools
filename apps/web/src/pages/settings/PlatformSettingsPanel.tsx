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
import { useEffect, useRef } from "react";

export function PlatformSettingsPanel({
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
}: {
  adapterCertificationApplyConfirmations: Record<string, ExecutionAdapterCertificationApplyConfirmations>;
  adapterCertificationApplyRows: ExecutionAdapterCertificationApplyRow[];
  adapterCertificationRows: ExecutionAdapterCertificationRow[];
  adapterChainHealthRollups: ExecutionAdapterChainHealthRollup[];
  adapterHealthProbeRows: ExecutionAdapterHealthProbeRow[];
  adapterRows: BrokerAdapterRow[];
  adapterLedgerRows: ExecutionAdapterLedgerRow[];
  applyingAdapterCertificationId?: string | null;
  className?: string;
  i18n: AppI18n;
  isRefreshingAdapterHealthProbe?: boolean;
  onApplyAdapterCertification?: (row: ExecutionAdapterCertificationRow) => void;
  onApplyConfirmationChange?: (
    certificationId: string,
    key: ExecutionAdapterCertificationApplyConfirmationKey,
    checked: boolean
  ) => void;
  onHumanConfirmationChange?: (
    orchestrationExecutionId: string,
    key: keyof ExecutionAdapterHumanConfirmationConfirmations,
    checked: boolean
  ) => void;
  onOrchestrationDryRunConfirmationChange?: (
    acceptanceId: string,
    key: keyof ExecutionAdapterOrchestrationDryRunConfirmations,
    checked: boolean
  ) => void;
  onOrchestrationExecutionConfirmationChange?: (
    dryRunId: string,
    key: keyof ExecutionAdapterOrchestrationExecutionConfirmations,
    checked: boolean
  ) => void;
  onSandboxProbeExecutionConfirmationChange?: (
    sandboxProbePlanId: string,
    key: keyof ExecutionAdapterSandboxProbeExecutionConfirmations,
    checked: boolean
  ) => void;
  onSandboxProbePlanConfirmationChange?: (
    humanConfirmationId: string,
    key: keyof ExecutionAdapterSandboxProbePlanConfirmations,
    checked: boolean
  ) => void;
  onSandboxProbeReviewConfirmationChange?: (
    sandboxProbeExecutionId: string,
    key: keyof ExecutionAdapterSandboxProbeReviewConfirmations,
    checked: boolean
  ) => void;
  onProductionRouteReviewConfirmationChange?: (
    sandboxProbeReviewId: string,
    key: keyof ExecutionAdapterProductionRouteReviewConfirmations,
    checked: boolean
  ) => void;
  onOpsStateConfirmationChange?: (
    paperRouteRunbookId: string,
    key: keyof ExecutionAdapterOpsStateConfirmations,
    checked: boolean
  ) => void;
  onPaperExecutionConfirmationChange?: (
    adapterOpsStateId: string,
    key: keyof ExecutionAdapterPaperExecutionConfirmations,
    checked: boolean
  ) => void;
  onRecordAdapterCertification?: (adapter: PlatformSettingsStatus["executionAdapters"][number]) => void;
  onRecordHumanConfirmation?: (row: ExecutionAdapterOrchestrationExecutionRow) => void;
  onRecordOrchestrationDryRun?: (row: ExecutionAdapterRuntimeReloadAcceptanceRow) => void;
  onRecordOrchestrationExecution?: (row: ExecutionAdapterOrchestrationDryRunRow) => void;
  onRecordProductionRouteReview?: (row: ExecutionAdapterSandboxProbeReviewRow) => void;
  onRecordOpsState?: (row: ExecutionAdapterPaperRouteRunbookRow) => void;
  onRecordPaperExecution?: (row: ExecutionAdapterOpsStateRow) => void;
  onRecordRuntimeReloadAcceptance?: (row: ExecutionAdapterRuntimeReloadExecutionRow) => void;
  onRecordSandboxProbeExecution?: (row: ExecutionAdapterSandboxProbePlanRow) => void;
  onRecordSandboxProbePlan?: (row: ExecutionAdapterHumanConfirmationRow) => void;
  onRecordSandboxProbeReview?: (row: ExecutionAdapterSandboxProbeExecutionRow) => void;
  onFocusPaperExecutionAudit?: (row: ExecutionAdapterPaperExecutionRow) => void;
  onCopyPaperExecutionAuditLink?: (row: ExecutionAdapterPaperExecutionRow) => void;
  onRefreshAdapterHealthProbe?: () => void;
  onRefreshContext?: (context: PlatformSettingsStatus["cache"]["contexts"][number]) => void;
  onOpenMarketDataAdapterWorkflow?: (adapter: PlatformSettingsStatus["marketDataAdapters"][number]) => void;
  onRuntimeReloadAcceptanceConfirmationChange?: (
    executionId: string,
    key: keyof ExecutionAdapterRuntimeReloadAcceptanceConfirmations,
    checked: boolean
  ) => void;
  recordingAdapterCertificationId?: string | null;
  recordingHumanConfirmationId?: string | null;
  recordingOrchestrationDryRunId?: string | null;
  recordingOrchestrationExecutionId?: string | null;
  recordingRuntimeReloadAcceptanceId?: string | null;
  recordingSandboxProbeExecutionId?: string | null;
  recordingSandboxProbePlanId?: string | null;
  recordingSandboxProbeReviewId?: string | null;
  recordingProductionRouteReviewId?: string | null;
  recordingOpsStateId?: string | null;
  recordingPaperExecutionId?: string | null;
  focusedPaperExecutionAuditEventId?: string | null;
  humanConfirmationConfirmations: Record<string, ExecutionAdapterHumanConfirmationConfirmations>;
  humanConfirmationRows: ExecutionAdapterHumanConfirmationRow[];
  orchestrationDryRunConfirmations: Record<string, ExecutionAdapterOrchestrationDryRunConfirmations>;
  orchestrationDryRunRows: ExecutionAdapterOrchestrationDryRunRow[];
  orchestrationExecutionConfirmations: Record<string, ExecutionAdapterOrchestrationExecutionConfirmations>;
  orchestrationExecutionRows: ExecutionAdapterOrchestrationExecutionRow[];
  refreshingCacheKey?: string | null;
  runtimeReloadAcceptanceConfirmations: Record<string, ExecutionAdapterRuntimeReloadAcceptanceConfirmations>;
  runtimeReloadAcceptanceRows: ExecutionAdapterRuntimeReloadAcceptanceRow[];
  runtimeReloadExecutionRows: ExecutionAdapterRuntimeReloadExecutionRow[];
  sandboxProbeExecutionConfirmations: Record<string, ExecutionAdapterSandboxProbeExecutionConfirmations>;
  sandboxProbeExecutionRows: ExecutionAdapterSandboxProbeExecutionRow[];
  sandboxProbePlanConfirmations: Record<string, ExecutionAdapterSandboxProbePlanConfirmations>;
  sandboxProbePlanRows: ExecutionAdapterSandboxProbePlanRow[];
  sandboxProbeReviewConfirmations: Record<string, ExecutionAdapterSandboxProbeReviewConfirmations>;
  sandboxProbeReviewRows: ExecutionAdapterSandboxProbeReviewRow[];
  adapterSandboxOrderSchemaDryRunRows: ExecutionAdapterSandboxOrderSchemaDryRunRow[];
  adapterPaperOrderLifecycleRows: ExecutionAdapterPaperOrderLifecycleRow[];
  adapterPaperRouteRunbookRows: ExecutionAdapterPaperRouteRunbookRow[];
  adapterOpsStateRows: ExecutionAdapterOpsStateRow[];
  adapterOpsStateConfirmations: Record<string, ExecutionAdapterOpsStateConfirmations>;
  adapterPaperExecutionRows: ExecutionAdapterPaperExecutionRow[];
  adapterPaperExecutionConfirmations: Record<string, ExecutionAdapterPaperExecutionConfirmations>;
  productionRouteReviewConfirmations: Record<string, ExecutionAdapterProductionRouteReviewConfirmations>;
  productionRouteReviewRows: ExecutionAdapterProductionRouteReviewRow[];
  settings?: PlatformSettingsStatus;
  state: MarketKlinesResult;
  workspace: TerminalWorkspace;
}) {
  const focusedPaperExecutionRef = useRef<HTMLElement | null>(null);
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

  useEffect(() => {
    if (!focusedPaperExecutionAuditEventId) {
      return;
    }
    focusedPaperExecutionRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusedPaperExecutionAuditEventId, adapterPaperExecutionRows.length]);

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
      <div className="adapter-human-confirmation-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "最终人工确认" : "Final human confirmation"}</span>
          <strong>{orchestrationExecutionRows.length}</strong>
        </div>
        {orchestrationExecutionRows.length ? (
          orchestrationExecutionRows.slice(0, 4).map((row) => {
            const confirmations =
              humanConfirmationConfirmations[row.id] ??
              createDefaultExecutionAdapterHumanConfirmationConfirmations();
            const confirmation = humanConfirmationRows.find(
              (item) => item.adapterId === row.adapterId && item.orchestrationExecutionId === row.id
            );
            return (
              <article className={`adapter-human-confirmation-row ${confirmation?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterOrchestrationExecutionStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterOrchestrationExecutionConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-human-confirmation-confirmations">
                  {executionAdapterHumanConfirmationConfirmationRows.map((item) => (
                    <label
                      className={`adapter-human-confirmation-confirmation ${
                        confirmations[item.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onHumanConfirmationChange?.(row.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingHumanConfirmationId === row.id || !onRecordHumanConfirmation}
                  onClick={() => onRecordHumanConfirmation?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingHumanConfirmationId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "确认中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录最终确认"
                      : "Record final confirmation"}
                </button>
                {confirmation ? (
                  <div className={`adapter-human-confirmation-result ${confirmation.tone}`}>
                    <strong>{adapterHumanConfirmationStatusLabel(i18n, confirmation.statusLabel)}</strong>
                    <span>
                      {adapterHumanConfirmationConfirmationSummary(i18n, confirmation.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, confirmation.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, confirmation.boundary)}
                    </span>
                    <em>{confirmation.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待最终人工确认；确认记录只关闭审计闸门，实盘交易仍保持阻断。"
                      : "Waiting for final human confirmation; recording closes the audit gate only while live trading stays blocked."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待受控编排执行证据；执行证据记录后才能录入最终人工确认。"
              : "Waiting for controlled orchestration execution evidence before final human confirmation can be recorded."}
          </p>
        )}
      </div>
      <div className="adapter-sandbox-probe-plan-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "Sandbox 探针计划" : "Sandbox probe plan"}</span>
          <strong>{humanConfirmationRows.length}</strong>
        </div>
        {humanConfirmationRows.length ? (
          humanConfirmationRows.slice(0, 4).map((row) => {
            const confirmations =
              sandboxProbePlanConfirmations[row.id] ??
              createDefaultExecutionAdapterSandboxProbePlanConfirmations();
            const probePlan = sandboxProbePlanRows.find(
              (item) => item.adapterId === row.adapterId && item.humanConfirmationId === row.id
            );
            return (
              <article className={`adapter-sandbox-probe-plan-row ${probePlan?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterHumanConfirmationStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterHumanConfirmationConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-sandbox-probe-plan-confirmations">
                  {executionAdapterSandboxProbePlanConfirmationRows.map((item) => (
                    <label
                      className={`adapter-sandbox-probe-plan-confirmation ${
                        confirmations[item.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onSandboxProbePlanConfirmationChange?.(row.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingSandboxProbePlanId === row.id || !onRecordSandboxProbePlan}
                  onClick={() => onRecordSandboxProbePlan?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingSandboxProbePlanId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "记录中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录探针计划"
                      : "Record probe plan"}
                </button>
                {probePlan ? (
                  <div className={`adapter-sandbox-probe-plan-result ${probePlan.tone}`}>
                    <strong>{adapterSandboxProbePlanStatusLabel(i18n, probePlan.statusLabel)}</strong>
                    <span>
                      {adapterSandboxProbePlanConfirmationSummary(i18n, probePlan.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, probePlan.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, probePlan.boundary)}
                    </span>
                    <em>{probePlan.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待 sandbox 探针计划；这一步只记录测试计划，不连接券商、不提交订单。"
                      : "Waiting for a sandbox probe plan; this records the test plan only, with no broker connection or order submission."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待最终人工确认；确认后才能记录 sandbox/testnet 探针计划。"
              : "Waiting for final human confirmation before recording a sandbox/testnet probe plan."}
          </p>
        )}
      </div>
      <div className="adapter-sandbox-probe-execution-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "Sandbox 探针执行" : "Sandbox probe execution"}</span>
          <strong>{sandboxProbePlanRows.length}</strong>
        </div>
        {sandboxProbePlanRows.length ? (
          sandboxProbePlanRows.slice(0, 4).map((row) => {
            const confirmations =
              sandboxProbeExecutionConfirmations[row.id] ??
              createDefaultExecutionAdapterSandboxProbeExecutionConfirmations();
            const probeExecution = sandboxProbeExecutionRows.find(
              (item) => item.adapterId === row.adapterId && item.sandboxProbePlanId === row.id
            );
            const authoritativeHealthReady = probeExecution?.authoritativeHealthReady ?? false;
            return (
              <article className={`adapter-sandbox-probe-execution-row ${probeExecution?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterSandboxProbePlanStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterSandboxProbePlanConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-sandbox-probe-execution-confirmations">
                  {executionAdapterSandboxProbeExecutionConfirmationRows.map((item) => {
                    const checked = item.authoritative ? authoritativeHealthReady : confirmations[item.key];
                    return (
                      <label
                        className={`adapter-sandbox-probe-execution-confirmation ${checked ? "positive" : "warning"}`}
                        key={`${row.id}-${item.key}`}
                      >
                        <input
                          checked={checked}
                          disabled={item.authoritative}
                          onChange={(event) =>
                            onSandboxProbeExecutionConfirmationChange?.(row.id, item.key, event.currentTarget.checked)
                          }
                          type="checkbox"
                        />
                        <span>
                          {i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}
                          {item.authoritative
                            ? i18n.locale === "zh-CN"
                              ? "（服务端探针）"
                              : " (server probe)"
                            : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingSandboxProbeExecutionId === row.id || !onRecordSandboxProbeExecution}
                  onClick={() => onRecordSandboxProbeExecution?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingSandboxProbeExecutionId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "记录中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录探针执行"
                      : "Record probe execution"}
                </button>
                {probeExecution ? (
                  <div className={`adapter-sandbox-probe-execution-result ${probeExecution.tone}`}>
                    <strong>{adapterSandboxProbeExecutionStatusLabel(i18n, probeExecution.statusLabel)}</strong>
                    <span>
                      {adapterSandboxProbeExecutionConfirmationSummary(i18n, probeExecution.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, probeExecution.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, probeExecution.boundary)}
                    </span>
                    <span>
                      {i18n.locale === "zh-CN" ? "权威探针" : "Authoritative probe"} ·{" "}
                      {probeExecution.healthProbeSummary}
                    </span>
                    <em>{probeExecution.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待 sandbox/testnet 只读探针执行；这一步只记录握手和订单 schema 证据，不提交任何订单。"
                      : "Waiting for a read-only sandbox/testnet probe execution; this records handshake and order-schema evidence only, with no order submission."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待 sandbox/testnet 探针计划；计划记录后才能录入只读探针执行证据。"
              : "Waiting for a sandbox/testnet probe plan before read-only probe execution evidence can be recorded."}
          </p>
        )}
      </div>
      <div className="adapter-sandbox-probe-review-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "Sandbox 探针复核" : "Sandbox probe review"}</span>
          <strong>{sandboxProbeExecutionRows.length}</strong>
        </div>
        {sandboxProbeExecutionRows.length ? (
          sandboxProbeExecutionRows.slice(0, 4).map((row) => {
            const confirmations =
              sandboxProbeReviewConfirmations[row.id] ??
              createDefaultExecutionAdapterSandboxProbeReviewConfirmations();
            const probeReview = sandboxProbeReviewRows.find(
              (item) => item.adapterId === row.adapterId && item.sandboxProbeExecutionId === row.id
            );
            return (
              <article className={`adapter-sandbox-probe-review-row ${probeReview?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterSandboxProbeExecutionStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterSandboxProbeExecutionConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-sandbox-probe-review-confirmations">
                  {executionAdapterSandboxProbeReviewConfirmationRows.map((item) => (
                    <label
                      className={`adapter-sandbox-probe-review-confirmation ${
                        confirmations[item.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onSandboxProbeReviewConfirmationChange?.(row.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingSandboxProbeReviewId === row.id || !onRecordSandboxProbeReview}
                  onClick={() => onRecordSandboxProbeReview?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingSandboxProbeReviewId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "复核中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录探针复核"
                      : "Record probe review"}
                </button>
                {probeReview ? (
                  <div className={`adapter-sandbox-probe-review-result ${probeReview.tone}`}>
                    <strong>{adapterSandboxProbeReviewStatusLabel(i18n, probeReview.statusLabel)}</strong>
                    <span>
                      {adapterSandboxProbeReviewConfirmationSummary(i18n, probeReview.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, probeReview.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, probeReview.boundary)}
                    </span>
                    <em>{probeReview.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待 sandbox/testnet 探针复核；复核只确认只读证据已归档，生产路由仍保持阻断。"
                      : "Waiting for sandbox/testnet probe review; review only attests read-only evidence is archived while production routing stays blocked."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待只读探针执行证据；执行记录后才能录入复核。"
              : "Waiting for read-only probe execution evidence before recording a review."}
          </p>
        )}
      </div>
      <div className="adapter-production-route-review-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "生产路由策略复核" : "Production route review"}</span>
          <strong>{sandboxProbeReviewRows.length}</strong>
        </div>
        {sandboxProbeReviewRows.length ? (
          sandboxProbeReviewRows.slice(0, 4).map((row) => {
            const confirmations =
              productionRouteReviewConfirmations[row.id] ??
              createDefaultExecutionAdapterProductionRouteReviewConfirmations();
            const routeReview = productionRouteReviewRows.find((item) => item.sandboxProbeReviewId === row.id);
            return (
              <article className={`adapter-production-route-review-row ${routeReview?.tone ?? row.tone}`} key={row.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                    {adapterSandboxProbeReviewStatusLabel(i18n, row.statusLabel)}
                  </strong>
                  <span>{formatChartDate(row.timestamp)}</span>
                </div>
                <p>
                  {adapterSandboxProbeReviewConfirmationSummary(i18n, row.confirmationSummary)} ·{" "}
                  {adapterCertificationBoundaryLabel(i18n, row.boundary)}
                </p>
                <div className="adapter-production-route-review-confirmations">
                  {executionAdapterProductionRouteReviewConfirmationRows.map((item) => (
                    <label
                      className={`adapter-production-route-review-confirmation ${
                        confirmations[item.key] ? "positive" : "warning"
                      }`}
                      key={`${row.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onProductionRouteReviewConfirmationChange?.(row.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingProductionRouteReviewId === row.id || !onRecordProductionRouteReview}
                  onClick={() => onRecordProductionRouteReview?.(row)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingProductionRouteReviewId === row.id
                    ? i18n.locale === "zh-CN"
                      ? "复核中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录生产路由复核"
                      : "Record route review"}
                </button>
                {routeReview ? (
                  <div className={`adapter-production-route-review-result ${routeReview.tone}`}>
                    <strong>{adapterProductionRouteReviewStatusLabel(i18n, routeReview.statusLabel)}</strong>
                    <span>
                      {adapterProductionRouteReviewConfirmationSummary(i18n, routeReview.confirmationSummary)} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, routeReview.blockerSummary)} ·{" "}
                      {adapterCertificationBoundaryLabel(i18n, routeReview.boundary)}
                    </span>
                    <em>{routeReview.auditEventId}</em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待生产路由策略复核；该复核只记录急停、仓位限额、路由禁用和回滚责任，实盘路由仍保持阻断。"
                      : "Waiting for production route policy review; this only records kill-switch, position-limit, routing-disabled, and rollback-owner checks while live routing remains blocked."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待 sandbox 探针复核；前置复核记录后才能录入生产路由策略复核。"
            : "Waiting for sandbox probe review before production route policy review can be recorded."}
          </p>
        )}
      </div>
      <div className="adapter-sandbox-order-schema-dry-run-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "订单 schema dry-run 证据" : "Order schema dry-run evidence"}</span>
          <strong>{adapterSandboxOrderSchemaDryRunRows.length}</strong>
        </div>
        {adapterSandboxOrderSchemaDryRunRows.length ? (
          adapterSandboxOrderSchemaDryRunRows.slice(0, 3).map((dryRun) => (
            <article className={`adapter-sandbox-order-schema-dry-run-row ${dryRun.tone}`} key={dryRun.id}>
              <div>
                <strong>
                  {adapterCertificationAdapterName(i18n, dryRun.adapterId)} ·{" "}
                  {adapterSandboxOrderSchemaDryRunStatusLabel(i18n, dryRun.statusLabel)}
                </strong>
                <span>{formatChartDate(dryRun.timestamp)}</span>
              </div>
              <p>
                {adapterSandboxOrderSchemaDryRunConfirmationSummary(i18n, dryRun.confirmationSummary)} ·{" "}
                {adapterCertificationApplyBlockerSummary(i18n, dryRun.blockerSummary)} ·{" "}
                {adapterSandboxOrderSchemaDryRunBoundaryLabel(i18n, dryRun.boundary)}
              </p>
              <p>
                {dryRun.orderIntentSummary} · {dryRun.envVarSummary}
              </p>
              <em>
                {dryRun.manifestValidationId ? `${dryRun.manifestValidationId} · ` : ""}
                {dryRun.auditEventId}
              </em>
            </article>
          ))
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待订单 schema dry-run 证据；该记录只验证订单意图结构，不提交任何订单。"
              : "Waiting for order schema dry-run evidence; this only validates order-intent structure and submits no orders."}
          </p>
        )}
      </div>
      <div className="adapter-paper-order-lifecycle-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "Paper 订单 lifecycle 证据" : "Paper order lifecycle evidence"}</span>
          <strong>{adapterPaperOrderLifecycleRows.length}</strong>
        </div>
        {adapterPaperOrderLifecycleRows.length ? (
          adapterPaperOrderLifecycleRows.slice(0, 3).map((lifecycle) => (
            <article className={`adapter-paper-order-lifecycle-row ${lifecycle.tone}`} key={lifecycle.id}>
              <div>
                <strong>
                  {adapterCertificationAdapterName(i18n, lifecycle.adapterId)} ·{" "}
                  {adapterPaperOrderLifecycleStatusLabel(i18n, lifecycle.statusLabel)}
                </strong>
                <span>{formatChartDate(lifecycle.timestamp)}</span>
              </div>
              <p>
                {adapterPaperOrderLifecycleConfirmationSummary(i18n, lifecycle.confirmationSummary)} ·{" "}
                {lifecycle.lifecycleStepSummary} · {adapterCertificationApplyBlockerSummary(i18n, lifecycle.blockerSummary)}
              </p>
              <p>
                {lifecycle.orderIntentSummary} ·{" "}
                {adapterPaperOrderLifecycleBoundaryLabel(i18n, lifecycle.boundary)}
              </p>
              <em>
                {lifecycle.manifestValidationId ? `${lifecycle.manifestValidationId} · ` : ""}
                {lifecycle.auditEventId}
              </em>
            </article>
          ))
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待 Paper 订单 lifecycle 证据；该记录只写本地模拟生命周期，不提交实盘订单。"
              : "Waiting for paper order lifecycle evidence; this records local simulated lifecycle only and submits no live orders."}
          </p>
        )}
      </div>
      <div className="adapter-paper-route-runbook-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "Paper 路由 runbook 证据" : "Paper route runbook evidence"}</span>
          <strong>{adapterPaperRouteRunbookRows.length}</strong>
        </div>
        {adapterPaperRouteRunbookRows.length ? (
          adapterPaperRouteRunbookRows.slice(0, 3).map((runbook) => (
            <article className={`adapter-paper-route-runbook-row ${runbook.tone}`} key={runbook.id}>
              <div>
                <strong>
                  {adapterCertificationAdapterName(i18n, runbook.adapterId)} ·{" "}
                  {adapterPaperRouteRunbookStatusLabel(i18n, runbook.statusLabel)}
                </strong>
                <span>{formatChartDate(runbook.timestamp)}</span>
              </div>
              <p>
                {adapterPaperRouteRunbookConfirmationSummary(i18n, runbook.confirmationSummary)} ·{" "}
                {runbook.runbookStepSummary} · {adapterCertificationApplyBlockerSummary(i18n, runbook.blockerSummary)}
              </p>
              <p>
                {runbook.orderIntentSummary} · {adapterPaperRouteRunbookBoundaryLabel(i18n, runbook.boundary)}
              </p>
              <em>
                {runbook.manifestValidationId ? `${runbook.manifestValidationId} · ` : ""}
                {runbook.auditEventId}
              </em>
            </article>
          ))
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待 Paper 路由 runbook 证据；该记录只写受控模拟路由手册，不执行任何路由。"
              : "Waiting for paper route runbook evidence; this records a controlled paper route runbook and executes no route."}
          </p>
        )}
      </div>
      <div className="adapter-ops-state-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "适配器 ops state 证据" : "Adapter ops state evidence"}</span>
          <strong>{adapterPaperRouteRunbookRows.length}</strong>
        </div>
        {adapterPaperRouteRunbookRows.length ? (
          adapterPaperRouteRunbookRows.slice(0, 4).map((runbook) => {
            const confirmations =
              adapterOpsStateConfirmations[runbook.id] ?? createDefaultExecutionAdapterOpsStateConfirmations();
            const opsState = adapterOpsStateRows.find((item) => item.paperRouteRunbookId === runbook.id);
            return (
              <article className={`adapter-ops-state-row ${opsState?.tone ?? runbook.tone}`} key={runbook.id}>
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, runbook.adapterId)} ·{" "}
                    {opsState
                      ? adapterOpsStateStatusLabel(i18n, opsState.statusLabel)
                      : adapterPaperRouteRunbookStatusLabel(i18n, runbook.statusLabel)}
                  </strong>
                  <span>{formatChartDate(opsState?.timestamp ?? runbook.timestamp)}</span>
                </div>
                <p>
                  {adapterPaperRouteRunbookConfirmationSummary(i18n, runbook.confirmationSummary)} ·{" "}
                  {runbook.runbookStepSummary} · {adapterPaperRouteRunbookBoundaryLabel(i18n, runbook.boundary)}
                </p>
                <div className="adapter-ops-state-confirmations">
                  {executionAdapterOpsStateConfirmationRows.map((item) => (
                    <label
                      className={`adapter-ops-state-confirmation ${confirmations[item.key] ? "positive" : "warning"}`}
                      key={`${runbook.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onOpsStateConfirmationChange?.(runbook.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingOpsStateId === runbook.id || !onRecordOpsState}
                  onClick={() => onRecordOpsState?.(runbook)}
                  type="button"
                >
                  <ShieldCheck size={13} />
                  {recordingOpsStateId === runbook.id
                    ? i18n.locale === "zh-CN"
                      ? "记录中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录 ops state"
                      : "Record ops state"}
                </button>
                {opsState ? (
                  <div className={`adapter-ops-state-result ${opsState.tone}`}>
                    <strong>{adapterOpsStateStatusLabel(i18n, opsState.statusLabel)}</strong>
                    <span>
                      {adapterOpsStateConfirmationSummary(i18n, opsState.confirmationSummary)} ·{" "}
                      {opsState.opsStepSummary} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, opsState.blockerSummary)}
                    </span>
                    <span>
                      {opsState.orderIntentSummary} · {adapterOpsStateBoundaryLabel(i18n, opsState.boundary)}
                    </span>
                    <em>
                      {opsState.manifestValidationId ? `${opsState.manifestValidationId} · ` : ""}
                      {opsState.auditEventId}
                    </em>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待适配器 ops state；该记录只确认监控、急停和 paper 对账状态，不开启实盘。"
                      : "Waiting for adapter ops state; this only confirms monitoring, kill-switch, and paper reconciliation readiness without enabling live trading."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待 Paper 路由 runbook；runbook 记录后才能录入 ops state。"
              : "Waiting for a paper route runbook before adapter ops state can be recorded."}
          </p>
        )}
      </div>
      <div className="adapter-paper-execution-list">
        <div className="paper-blotter-title">
          <span>{i18n.locale === "zh-CN" ? "适配器模拟执行" : "Adapter paper executions"}</span>
          <strong>{adapterOpsStateRows.length}</strong>
        </div>
        {adapterOpsStateRows.length ? (
          adapterOpsStateRows.slice(0, 4).map((opsState) => {
            const confirmations =
              adapterPaperExecutionConfirmations[opsState.id] ??
              createDefaultExecutionAdapterPaperExecutionConfirmations();
            const paperExecution = adapterPaperExecutionRows.find((item) => item.adapterOpsStateId === opsState.id);
            const isFocusedPaperExecution = Boolean(
              paperExecution &&
                (paperExecution.auditEventId === focusedPaperExecutionAuditEventId ||
                  paperExecution.id === focusedPaperExecutionAuditEventId)
            );
            return (
              <article
                className={`adapter-ops-state-row ${paperExecution?.tone ?? opsState.tone} ${isFocusedPaperExecution ? "focused" : ""}`}
                key={opsState.id}
                ref={isFocusedPaperExecution ? focusedPaperExecutionRef : undefined}
              >
                <div>
                  <strong>
                    {adapterCertificationAdapterName(i18n, opsState.adapterId)} ·{" "}
                    {paperExecution
                      ? adapterPaperExecutionStatusLabel(i18n, paperExecution.statusLabel)
                      : adapterOpsStateStatusLabel(i18n, opsState.statusLabel)}
                  </strong>
                  <span>{formatChartDate(paperExecution?.timestamp ?? opsState.timestamp)}</span>
                </div>
                <p>
                  {adapterOpsStateConfirmationSummary(i18n, opsState.confirmationSummary)} ·{" "}
                  {opsState.opsStepSummary} · {adapterOpsStateBoundaryLabel(i18n, opsState.boundary)}
                </p>
                <div className="adapter-ops-state-confirmations">
                  {executionAdapterPaperExecutionConfirmationRows.map((item) => (
                    <label
                      className={`adapter-ops-state-confirmation ${confirmations[item.key] ? "positive" : "warning"}`}
                      key={`${opsState.id}-${item.key}`}
                    >
                      <input
                        checked={confirmations[item.key]}
                        onChange={(event) =>
                          onPaperExecutionConfirmationChange?.(opsState.id, item.key, event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>{i18n.locale === "zh-CN" ? item.labelZh : item.labelEn}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="adapter-certification-apply-button"
                  disabled={recordingPaperExecutionId === opsState.id || !onRecordPaperExecution}
                  onClick={() => onRecordPaperExecution?.(opsState)}
                  type="button"
                >
                  <Play size={13} />
                  {recordingPaperExecutionId === opsState.id
                    ? i18n.locale === "zh-CN"
                      ? "记录中"
                      : "Recording"
                    : i18n.locale === "zh-CN"
                      ? "记录模拟执行"
                      : "Record paper execution"}
                </button>
                {paperExecution ? (
                  <div className={`adapter-ops-state-result ${paperExecution.tone}`}>
                    <strong>{adapterPaperExecutionStatusLabel(i18n, paperExecution.statusLabel)}</strong>
                    <span>
                      {adapterPaperExecutionConfirmationSummary(i18n, paperExecution.confirmationSummary)} ·{" "}
                      {paperExecution.paperExecutionStepSummary} ·{" "}
                      {adapterCertificationApplyBlockerSummary(i18n, paperExecution.blockerSummary)}
                    </span>
                    <span>
                      {paperExecution.fillSummary} · {adapterPaperExecutionBoundaryLabel(i18n, paperExecution.boundary)}
                    </span>
                    <em>
                      {paperExecution.manifestValidationId
                        ? `${paperExecution.manifestValidationId} · ${paperExecution.auditEventId}`
                        : paperExecution.auditEventId}
                    </em>
                    <div className="adapter-ops-state-result-actions">
                      <button
                        disabled={!onFocusPaperExecutionAudit}
                        onClick={() => onFocusPaperExecutionAudit?.(paperExecution)}
                        type="button"
                      >
                        <Search size={13} />
                        {i18n.locale === "zh-CN" ? "审计定位" : "Open audit"}
                      </button>
                      <button
                        disabled={!onCopyPaperExecutionAuditLink}
                        onClick={() => void onCopyPaperExecutionAuditLink?.(paperExecution)}
                        type="button"
                      >
                        <Copy size={13} />
                        {i18n.locale === "zh-CN" ? "复制审计链接" : "Copy audit link"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <em>
                    {i18n.locale === "zh-CN"
                      ? "等待模拟执行；该记录只生成本地模拟成交，不提交订单或触发实盘路由。"
                      : "Waiting for paper execution; this only creates a local simulated fill without submitting orders or touching live routes."}
                  </em>
                )}
              </article>
            );
          })
        ) : (
          <p className="empty-state">
            {i18n.locale === "zh-CN"
              ? "等待 adapter ops state；ops state 记录后才能生成模拟执行证据。"
              : "Waiting for adapter ops state before paper execution evidence can be recorded."}
          </p>
        )}
      </div>
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
