import { PlatformSettingsStatus, recordExecutionAdapterPaperExecution } from "../../../lib/terminal-api";
import { ExecutionAdapterOpsStateRow, ExecutionAdapterPaperExecutionAuditLedgerRow, ExecutionAdapterPaperExecutionRow, resolveAdapterWorkflowInstrument } from "../../../lib/terminal-workbench";
import { quantCoreBaseUrl } from "../../app-shell/initial-state";
import { replaceAdapterPaperExecutionEvidenceUrlParam } from "../../app-shell/url-state";
import { buildExecutionAdapterPaperExecutionAuditQuery } from "../audit-query";
import { createDefaultExecutionAdapterPaperExecutionConfirmations } from "../ExecutionConfirmations";
import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "adapterPaperExecutionConfirmations" | "authoritativeFooterSnapshotExpected" | "autoTradingSnapshot" | "currentExecutionMode" | "error" | "executionAdapterPaperExecutions" | "executionAdapterPreLiveRunbookAuditCoverage" | "focusedAdapterPaperExecutionAuditEventId" | "footerExecutionSafety" | "footerExecutionStateAvailable" | "i18n" | "recordingAdapterPaperExecutionId" | "refreshSettingsStatus" | "selectInstrument" | "selectProductWorkArea" | "setAdapterPaperExecutionConfirmations" | "setAutoTradingSnapshot" | "setExecutionAdapterPaperExecutions" | "setFocusedAdapterPaperExecutionAuditEventId" | "setRecordingAdapterPaperExecutionId" | "setWorkspaceState" | "source" | "statusLabel" | "updateAuditEvidenceReportQuery" | "updateExecutionAdapterPaperExecutionAuditQuery" | "workspace">;
type Result = Pick<AppControllerBindings, "recordAdapterPaperExecution" | "focusExecutionAdapterPaperExecutionAudit" | "focusExecutionAdapterPreLiveRunbookAudit" | "openExecutionAdapterPaperExecutionEvidence" | "openMarketDataAdapterWorkflow" | "footerLiveTradingAllowed" | "currentExecutionModeLabel" | "currentExecutionVenueLabel" | "currentExecutionTone" | "currentLiveBadgeLabel" | "footerExecutionStatus" | "footerExecutionDetail">;

export function useAdapterAuditActions(controller: Dependencies): Result {
  const {
    adapterPaperExecutionConfirmations, authoritativeFooterSnapshotExpected, autoTradingSnapshot, currentExecutionMode, error, executionAdapterPaperExecutions,
    executionAdapterPreLiveRunbookAuditCoverage, focusedAdapterPaperExecutionAuditEventId, footerExecutionSafety, footerExecutionStateAvailable, i18n, recordingAdapterPaperExecutionId,
    refreshSettingsStatus, selectInstrument, selectProductWorkArea, setAdapterPaperExecutionConfirmations, setAutoTradingSnapshot, setExecutionAdapterPaperExecutions,
    setFocusedAdapterPaperExecutionAuditEventId, setRecordingAdapterPaperExecutionId, setWorkspaceState, source, statusLabel, updateAuditEvidenceReportQuery,
    updateExecutionAdapterPaperExecutionAuditQuery, workspace
  } = controller;
  const recordAdapterPaperExecution = useCallback(
      async (row: ExecutionAdapterOpsStateRow) => {
        const confirmations =
          adapterPaperExecutionConfirmations[row.id] ?? createDefaultExecutionAdapterPaperExecutionConfirmations();
        setRecordingAdapterPaperExecutionId(row.id);
        try {
          const result = await recordExecutionAdapterPaperExecution(quantCoreBaseUrl, {
            adapterId: row.adapterId,
            adapterOpsStateId: row.id,
            confirmations,
            metadata: {
              acceptanceId: row.acceptanceId,
              bindingId: row.bindingId,
              dryRunId: row.dryRunId,
              executionId: row.executionId,
              lifecycleMode: row.lifecycleMode,
              materializationId: row.materializationId,
              orchestrationExecutionId: row.orchestrationExecutionId,
              paperOrderLifecycleId: row.paperOrderLifecycleId,
              paperRouteRunbookId: row.paperRouteRunbookId,
              planId: row.planId,
              productionRouteReviewId: row.productionRouteReviewId,
              runbookMode: row.runbookMode,
              sandboxOrderSchemaDryRunId: row.sandboxOrderSchemaDryRunId,
              sandboxProbeExecutionId: row.sandboxProbeExecutionId,
              sandboxProbePlanId: row.sandboxProbePlanId,
              sandboxProbeReviewId: row.sandboxProbeReviewId,
              source: "settings-panel"
            },
            operator: "settings-panel",
            paperExecutionMode: "manual_adapter_paper_execution"
          });
          const reusedAdapterPaperExecution =
            result.error === "execution_adapter_paper_execution_already_recorded" && Boolean(result.adapterPaperExecution);
          if (result.adapterPaperExecution) {
            setExecutionAdapterPaperExecutions((current) => [
              result.adapterPaperExecution!,
              ...current.filter(
                (currentRow) =>
                  currentRow.adapterPaperExecutionId !== result.adapterPaperExecution!.adapterPaperExecutionId
              )
            ]);
          }
          if (result.error && !reusedAdapterPaperExecution) {
            setWorkspaceState((current) => ({
              ...current,
              error: result.error,
              statusLabel: "Adapter paper execution failed"
            }));
          } else {
            const status = result.adapterPaperExecution?.status ?? "blocked";
            setWorkspaceState((current) => ({
              ...current,
              error: undefined,
              statusLabel:
                reusedAdapterPaperExecution
                  ? `Adapter paper execution reused · ${row.adapterId}`
                  : status === "paper_execution_recorded"
                  ? `Adapter paper execution recorded · ${row.adapterId}`
                  : `Adapter paper execution blocked · ${row.adapterId}`
            }));
            await refreshSettingsStatus();
          }
        } finally {
          setRecordingAdapterPaperExecutionId(null);
        }
      },
      [adapterPaperExecutionConfirmations, refreshSettingsStatus]
    );
  const focusExecutionAdapterPaperExecutionAudit = useCallback(
      (row: ExecutionAdapterPaperExecutionRow) => {
        updateExecutionAdapterPaperExecutionAuditQuery(buildExecutionAdapterPaperExecutionAuditQuery(row));
        selectProductWorkArea("audit");
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Adapter paper execution audit opened",
          error: undefined
        }));
      },
      [selectProductWorkArea, updateExecutionAdapterPaperExecutionAuditQuery]
    );
  const focusExecutionAdapterPreLiveRunbookAudit = useCallback(() => {
      const query = executionAdapterPreLiveRunbookAuditCoverage.query;
      selectProductWorkArea("audit");
      if (!query) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Pre-live runbook audit coverage unavailable",
          error: "No matching pre-live runbook report has been recorded yet."
        }));
        return;
      }
      updateAuditEvidenceReportQuery(query);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Pre-live runbook audit coverage selected",
        error: undefined
      }));
    }, [executionAdapterPreLiveRunbookAuditCoverage.query, selectProductWorkArea, updateAuditEvidenceReportQuery]);
  const openExecutionAdapterPaperExecutionEvidence = useCallback(
      (row: ExecutionAdapterPaperExecutionAuditLedgerRow) => {
        setFocusedAdapterPaperExecutionAuditEventId(row.id);
        replaceAdapterPaperExecutionEvidenceUrlParam(row.id);
        selectProductWorkArea("settings");
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Adapter paper execution evidence selected",
          error: undefined
        }));
      },
      [selectProductWorkArea]
    );
  const openMarketDataAdapterWorkflow = useCallback(
      (adapter: PlatformSettingsStatus["marketDataAdapters"][number]) => {
        const instrument = resolveAdapterWorkflowInstrument(workspace, adapter.market);
        selectInstrument(instrument, "market");
      },
      [selectInstrument, workspace]
    );
  const footerLiveTradingAllowed = authoritativeFooterSnapshotExpected
      ? autoTradingSnapshot?.liveTradingAllowed === true
      : footerExecutionSafety?.liveTradingAllowed === true;
  const currentExecutionModeLabel = !footerExecutionStateAvailable
      ? i18n.locale === "zh-CN" ? "状态读取中" : "Loading"
      : currentExecutionMode === "live"
        ? footerLiveTradingAllowed
          ? i18n.locale === "zh-CN" ? "生产实盘" : "Production live"
          : i18n.locale === "zh-CN" ? "生产实盘受保护" : "Production live protected"
        : currentExecutionMode === "testnet"
          ? i18n.locale === "zh-CN" ? "币安测试网" : "Binance Testnet"
          : i18n.locale === "zh-CN" ? "纸面模拟" : "Paper simulation";
  const currentExecutionVenueLabel = currentExecutionMode === "live"
      ? i18n.locale === "zh-CN" ? "币安现货" : "Binance Spot"
      : currentExecutionMode === "testnet"
        ? i18n.locale === "zh-CN" ? "币安测试网" : "Binance Testnet"
        : i18n.locale === "zh-CN" ? "纸面经纪" : "Paper Broker";
  const currentExecutionTone = footerLiveTradingAllowed
      ? "live"
      : currentExecutionMode === "live"
        ? "blocked"
        : "paper";
  const currentLiveBadgeLabel = !footerExecutionStateAvailable
      ? i18n.locale === "zh-CN" ? "权限读取中" : "Loading permissions"
      : footerLiveTradingAllowed
        ? i18n.locale === "zh-CN" ? "生产会话有效" : "Production session active"
        : currentExecutionMode === "live"
          ? i18n.locale === "zh-CN" ? "生产闸门保护中" : "Production gate protected"
          : i18n.locale === "zh-CN" ? "实盘需授权" : "Live authorization required";
  const footerExecutionStatus = !footerExecutionStateAvailable
      ? i18n.locale === "zh-CN" ? "未加载" : "Unavailable"
      : footerLiveTradingAllowed
        ? i18n.locale === "zh-CN" ? "已授权" : "Authorized"
        : currentExecutionMode === "testnet"
          ? "Testnet"
          : currentExecutionMode === "paper"
            ? "Paper"
            : i18n.locale === "zh-CN" ? "未授权" : "Not authorized";
  const footerExecutionDetail = !footerExecutionStateAvailable
      ? i18n.locale === "zh-CN" ? "正在读取执行状态" : "Loading execution status"
      : footerLiveTradingAllowed
        ? i18n.locale === "zh-CN" ? "生产会话有效" : "Production session active"
        : footerExecutionSafety?.productionLive?.blockingReason ===
            "stage10_production_execution_control_evidence_stale"
          ? i18n.locale === "zh-CN" ? "生产权限证据已过期" : "Production permission evidence expired"
          : footerExecutionSafety?.productionLive?.credentialsConfigured === false
            ? i18n.locale === "zh-CN" ? "生产交易凭据未配置" : "Production credentials missing"
            : i18n.locale === "zh-CN"
              ? "生产会话未开启，切换时需实名确认"
              : "Production session inactive; named confirmation required";
  return {
    recordAdapterPaperExecution, focusExecutionAdapterPaperExecutionAudit, focusExecutionAdapterPreLiveRunbookAudit, openExecutionAdapterPaperExecutionEvidence, openMarketDataAdapterWorkflow, footerLiveTradingAllowed,
    currentExecutionModeLabel, currentExecutionVenueLabel, currentExecutionTone, currentLiveBadgeLabel, footerExecutionStatus, footerExecutionDetail
  };
}
