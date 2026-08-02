import { runResearchContextReadinessAction } from "../../../components/ResearchContextReadinessPanel";
import { buildResearchContextReadinessReportAuditEvent, runP0Pipeline, saveAuditEvent, validateStrategySnapshot } from "../../../lib/terminal-api";
import { buildResearchContextDeepLink, buildResearchContextReadinessReportArchive, buildResearchContextReadinessRows, buildResearchPipelinePreflight, researchPipelineDataSnapshotLogLabel, ResearchPipelinePreflight, researchRunEvidenceLogLabel, resolveResearchPipelinePreparationEvidenceRunId, WorkflowRunLogEntry } from "../../../lib/terminal-workbench";
import { AUDIT_REPORT_EVENTS_PAGE_SIZE, quantCoreBaseUrl } from "../../app-shell/initial-state";
import { researchPipelinePreflightIssueTargets } from "../../app-shell/navigation";
import { replaceAuditEvidenceReportQueryUrlParam } from "../../app-shell/url-state";
import { createWorkflowLogEntry, waitForWorkflowStep } from "../../app-shell/workflow-runtime";
import { mergeAuditEvidenceReportEvent } from "../../audit/event-merges";
import { chartKlineLimit } from "../ChartComponents";
import { researchPipelinePreflightIssueDetail, researchPipelinePreflightStatusLabel } from "../ResearchPipelineFormatters";
import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activeCacheContext" | "activeLoopStepId" | "activeWorkAreaId" | "activeWorkflowStageId" | "auditEvidenceReportEvents" | "auditEvidenceReportOffset" | "auditEvidenceReportQuery" | "automatedTradingWorkflowActionErrorRef" | "copiedResearchContextLink" | "copiedResearchContextReadinessReport" | "error" | "hasUnsavedWatchlistChanges" | "i18n" | "isResearchPipelineConfirmationOpen" | "isRunning" | "klinesState" | "latestOtherResearchContextReadinessReport" | "latestResearchContextReadinessReport" | "marketCalendarState" | "marketDataRefreshGuard" | "openAuditReportLedgerResearchContextLink" | "paperExecutionRecord" | "pendingMarketAiSelectionResearchOrigin" | "promotionCandidateRecord" | "refreshRunHistory" | "refreshSelectedMarketCache" | "refreshStrategyLibrary" | "refreshWatchlistMarketCache" | "researchCompletionNotice" | "researchContextEvidenceRows" | "researchContextLinkCopyResetTimerRef" | "researchContextReadinessReportCopyResetTimerRef" | "researchNoteDraft" | "researchNoteState" | "resetAiReviewHistoryState" | "selectProductWorkArea" | "selectedWatchlistCacheRefreshRunId" | "selectedWatchlistRefreshEvidenceRunId" | "setActiveLoopStepId" | "setActiveWorkAreaId" | "setActiveWorkflowStageId" | "setAuditEvidenceReportEvents" | "setAuditEvidenceReportOffset" | "setAuditEvidenceReportQuery" | "setCopiedResearchContextLink" | "setCopiedResearchContextReadinessReport" | "setHasUnsavedWatchlistChanges" | "setIsResearchPipelineConfirmationOpen" | "setIsRunning" | "setKlinesState" | "setMarketCalendarState" | "setPaperExecutionRecord" | "setPendingMarketAiSelectionResearchOrigin" | "setPromotionCandidateRecord" | "setResearchCompletionNotice" | "setResearchNoteDraft" | "setResearchNoteState" | "setSelectedWatchlistCacheRefreshRunId" | "setStrategyValidationState" | "setWatchlistCacheRefreshHistory" | "setWorkflowRunState" | "setWorkspaceState" | "source" | "statusLabel" | "strategyValidationState" | "watchlistCacheRefreshHistory" | "workflowRunIdRef" | "workflowRunState" | "workspace">;
type Result = Pick<AppControllerBindings, "researchContextReadinessRows" | "researchPipelinePreflight" | "researchPipelinePreparationEvidenceRunId" | "runPipeline" | "copyResearchContextLink" | "buildCurrentResearchContextReadinessReport" | "copyResearchContextReadinessReport" | "downloadResearchContextReadinessReport" | "recordResearchContextReadinessReport" | "openResearchPipelinePreflightIssue" | "openLatestResearchContextReportInAudit" | "openLatestOtherResearchContextReportInAudit" | "openLatestResearchContextReportContext" | "openSelectedRefreshCoverageInResearch">;

export function useResearchWorkflowActions(controller: Dependencies): Result {
  const {
    activeCacheContext, activeLoopStepId, activeWorkAreaId, activeWorkflowStageId, auditEvidenceReportEvents, auditEvidenceReportOffset,
    auditEvidenceReportQuery, automatedTradingWorkflowActionErrorRef, copiedResearchContextLink, copiedResearchContextReadinessReport, error, hasUnsavedWatchlistChanges,
    i18n, isResearchPipelineConfirmationOpen, isRunning, klinesState, latestOtherResearchContextReadinessReport, latestResearchContextReadinessReport,
    marketCalendarState, marketDataRefreshGuard, openAuditReportLedgerResearchContextLink, paperExecutionRecord, pendingMarketAiSelectionResearchOrigin, promotionCandidateRecord,
    refreshRunHistory, refreshSelectedMarketCache, refreshStrategyLibrary, refreshWatchlistMarketCache, researchCompletionNotice, researchContextEvidenceRows,
    researchContextLinkCopyResetTimerRef, researchContextReadinessReportCopyResetTimerRef, researchNoteDraft, researchNoteState, resetAiReviewHistoryState, selectProductWorkArea,
    selectedWatchlistCacheRefreshRunId, selectedWatchlistRefreshEvidenceRunId, setActiveLoopStepId, setActiveWorkAreaId, setActiveWorkflowStageId, setAuditEvidenceReportEvents,
    setAuditEvidenceReportOffset, setAuditEvidenceReportQuery, setCopiedResearchContextLink, setCopiedResearchContextReadinessReport, setHasUnsavedWatchlistChanges, setIsResearchPipelineConfirmationOpen,
    setIsRunning, setKlinesState, setMarketCalendarState, setPaperExecutionRecord, setPendingMarketAiSelectionResearchOrigin, setPromotionCandidateRecord,
    setResearchCompletionNotice, setResearchNoteDraft, setResearchNoteState, setSelectedWatchlistCacheRefreshRunId, setStrategyValidationState, setWatchlistCacheRefreshHistory,
    setWorkflowRunState, setWorkspaceState, source, statusLabel, strategyValidationState, watchlistCacheRefreshHistory,
    workflowRunIdRef, workflowRunState, workspace
  } = controller;
  const researchContextReadinessRows = buildResearchContextReadinessRows({
      workspace,
      barCount: klinesState.bars.length,
      dataQuality: {
        source: klinesState.quality.source,
        isComplete: klinesState.quality.isComplete,
        warnings: klinesState.quality.warnings,
        rows: klinesState.quality.rows || klinesState.bars.length
      },
      activeWorkAreaId,
      watchlist: {
        hasUnsavedChanges: hasUnsavedWatchlistChanges
      },
      marketCalendar: marketCalendarState.calendar,
      cacheContext: activeCacheContext
        ? {
            rowCount: activeCacheContext.rowCount,
            freshness: activeCacheContext.freshness,
            ageHours: activeCacheContext.ageHours,
            latestTimestamp: activeCacheContext.endTimestamp
          }
        : null,
      watchlistRefreshRuns: watchlistCacheRefreshHistory,
      note: {
        source: researchNoteState.source,
        body: researchNoteDraft,
        savedBody: researchNoteState.note?.body ?? null,
        updatedAt: researchNoteState.note?.updatedAt ?? null,
        error: researchNoteState.error ?? null
      }
    });
  const researchPipelinePreflight = buildResearchPipelinePreflight(researchContextReadinessRows);
  const researchPipelinePreparationEvidenceRunId = resolveResearchPipelinePreparationEvidenceRunId({
      preflight: researchPipelinePreflight,
      selectedCoverageRunId: selectedWatchlistRefreshEvidenceRunId
    });
  const runPipeline = useCallback(async (confirmation?: "accepted") => {
      if (!researchPipelinePreflight.canRun) {
        automatedTradingWorkflowActionErrorRef.current =
          researchPipelinePreflightIssueDetail(i18n, researchPipelinePreflight);
        setIsResearchPipelineConfirmationOpen(true);
        setActiveWorkAreaId("research");
        setActiveLoopStepId("research");
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: researchPipelinePreflightStatusLabel(i18n, researchPipelinePreflight),
          error: researchPipelinePreflightIssueDetail(i18n, researchPipelinePreflight)
        }));
        return false;
      }
      if (researchPipelinePreflight.requiresConfirmation && confirmation !== "accepted") {
        automatedTradingWorkflowActionErrorRef.current =
          i18n.locale === "zh-CN" ? "研究上下文仍需确认。" : "The research context still requires confirmation.";
        setIsResearchPipelineConfirmationOpen(true);
        return false;
      }
      setIsResearchPipelineConfirmationOpen(false);
      setResearchCompletionNotice(null);

      const runId = workflowRunIdRef.current + 1;
      workflowRunIdRef.current = runId;
      let log: WorkflowRunLogEntry[] = [];
      const selectedContext = `${workspace.selectedInstrument.symbol} · ${workspace.selectedTimeframe}`;
      const publishStage = (
        activeStageId: string,
        completedStageIds: string[],
        failedStageId: string | null = null
      ) => {
        if (workflowRunIdRef.current !== runId) {
          return;
        }
        setActiveWorkflowStageId(activeStageId);
        setWorkflowRunState({
          activeStageId,
          completedStageIds,
          failedStageId,
          log
        });
      };
      const appendLog = (stageId: string, level: WorkflowRunLogEntry["level"], message: string) => {
        log = [...log, createWorkflowLogEntry(runId, log.length + 1, stageId, level, message)];
      };

      setIsRunning(true);
      setPaperExecutionRecord(null);
      setPromotionCandidateRecord(null);
      resetAiReviewHistoryState();
      appendLog("factor", "info", "Strategy preflight sent to local core");
      publishStage("factor", []);
      const preflight = await validateStrategySnapshot(quantCoreBaseUrl, {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe,
        auditRunId: workspace.researchRun?.runId ?? null,
        strategy: workspace.strategy
      });
      if (workflowRunIdRef.current !== runId) {
        return false;
      }
      setStrategyValidationState(preflight);
      if (preflight.validation?.status === "blocked") {
        const blockedGates = preflight.validation.gates
          .filter((gate) => gate.status === "blocked")
          .map((gate) => gate.id)
          .join(", ");
        automatedTradingWorkflowActionErrorRef.current =
          `Strategy preflight blocked: ${blockedGates || "readiness gate"}`;
        appendLog("factor", "error", `Strategy preflight blocked: ${blockedGates || "readiness gate"}`);
        publishStage("factor", [], "factor");
        setIsRunning(false);
        return false;
      }
      appendLog(
        "factor",
        preflight.source === "core" ? "success" : "warning",
        preflight.source === "core"
          ? `Strategy preflight passed: ${preflight.validation?.status ?? "review"}`
          : `Strategy preflight used local fallback: ${preflight.error ?? "core unavailable"}`
      );

      appendLog("data", "info", researchPipelineDataSnapshotLogLabel(selectedContext, researchPipelinePreflight));
      publishStage("data", []);
      await waitForWorkflowStep();
      if (workflowRunIdRef.current !== runId) {
        return false;
      }
      appendLog("factor", "success", "Factor set staged: SMA / RSI / volume");
      publishStage("factor", ["data"]);
      await waitForWorkflowStep();
      if (workflowRunIdRef.current !== runId) {
        return false;
      }
      appendLog("backtest", "info", "Backtest request sent to local core");
      publishStage("backtest", ["data", "factor"]);

      const result = await runP0Pipeline(
        quantCoreBaseUrl,
        {
          market: workspace.selectedInstrument.market,
          symbol: workspace.selectedInstrument.symbol,
          timeframe: workspace.selectedTimeframe,
          limit: chartKlineLimit,
          watchlistRefreshRunId: researchPipelinePreparationEvidenceRunId,
          selectionOrigin:
            pendingMarketAiSelectionResearchOrigin
            && pendingMarketAiSelectionResearchOrigin.market === workspace.selectedInstrument.market
            && pendingMarketAiSelectionResearchOrigin.symbol === workspace.selectedInstrument.symbol
            && workspace.selectedTimeframe === "1d"
              ? {
                  selectionId: pendingMarketAiSelectionResearchOrigin.selectionId,
                  candidateEvidenceId:
                    pendingMarketAiSelectionResearchOrigin.candidateEvidenceId,
                }
              : undefined,
        },
        workspace
      );
      if (workflowRunIdRef.current !== runId) {
        return false;
      }
      setWorkspaceState(result);

      if (result.source === "fallback") {
        automatedTradingWorkflowActionErrorRef.current = result.error ?? result.statusLabel;
        appendLog("backtest", "error", `Pipeline failed before audited backtest: ${result.error ?? result.statusLabel}`);
        publishStage("backtest", ["data", "factor"], "backtest");
        await refreshRunHistory();
        setIsRunning(false);
        return false;
      }

      const researchSummary = result.workspace.researchRun;
      appendLog(
        "backtest",
        "success",
        result.pipeline
          ? `P0 audited run ${result.pipeline.runId} ready · ${result.pipeline.dataSnapshotId} · paper-only`
          : researchRunEvidenceLogLabel(researchSummary)
      );
      publishStage("agent", ["data", "factor", "backtest"]);
      await waitForWorkflowStep();
      if (workflowRunIdRef.current !== runId) {
        return false;
      }
      appendLog("agent", "success", "Agent committee report received");
      appendLog("execution", "warning", "Live execution remains blocked; paper review is ready");
      publishStage("execution", ["data", "factor", "backtest", "agent"]);
      const runHistoryReadback = await refreshRunHistory();
      const strategyLibraryReadback = await refreshStrategyLibrary();
      if (workflowRunIdRef.current !== runId) {
        return false;
      }
      setIsRunning(false);
      if (researchSummary) {
        setResearchCompletionNotice({
          dataRows: researchSummary.dataRows,
          instrumentName: result.workspace.selectedInstrument.name,
          readbackReady:
            runHistoryReadback.source === "core" && strategyLibraryReadback.source === "core",
          runId: researchSummary.runId,
          symbol: result.workspace.selectedInstrument.symbol,
          timeframe: result.workspace.selectedTimeframe
        });
      }
      return true;
    }, [
      chartKlineLimit,
      i18n,
      pendingMarketAiSelectionResearchOrigin,
      quantCoreBaseUrl,
      refreshRunHistory,
      refreshStrategyLibrary,
      researchPipelinePreparationEvidenceRunId,
      researchPipelinePreflight,
      resetAiReviewHistoryState,
      workspace
    ]);
  const copyResearchContextLink = useCallback(async () => {
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }
        await navigator.clipboard.writeText(
          buildResearchContextDeepLink(window.location.href, workspace, activeWorkAreaId === "market" ? "market" : "research", {
            watchlistRefreshRunId:
              researchPipelinePreflight.lockedPreparationEvidence?.runId ?? selectedWatchlistCacheRefreshRunId
          })
        );
        setCopiedResearchContextLink(true);
        if (researchContextLinkCopyResetTimerRef.current !== null) {
          window.clearTimeout(researchContextLinkCopyResetTimerRef.current);
        }
        researchContextLinkCopyResetTimerRef.current = window.setTimeout(() => {
          setCopiedResearchContextLink(false);
          researchContextLinkCopyResetTimerRef.current = null;
        }, 1800);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research context link copied",
          error: undefined
        }));
      } catch (copyError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research context link copy failed",
          error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
        }));
      }
    }, [activeWorkAreaId, researchPipelinePreflight.lockedPreparationEvidence?.runId, selectedWatchlistCacheRefreshRunId, workspace]);
  const buildCurrentResearchContextReadinessReport = useCallback(async () => {
      const generatedAt = new Date().toISOString();
      return buildResearchContextReadinessReportArchive({
        contextLink: buildResearchContextDeepLink(window.location.href, workspace, activeWorkAreaId === "market" ? "market" : "research", {
          watchlistRefreshRunId:
            researchPipelinePreflight.lockedPreparationEvidence?.runId ?? selectedWatchlistCacheRefreshRunId
        }),
        evidenceRows: researchContextEvidenceRows,
        generatedAt,
        preflight: researchPipelinePreflight,
        rows: researchContextReadinessRows,
        workspace
      });
    }, [
      activeWorkAreaId,
      researchContextEvidenceRows,
      researchContextReadinessRows,
      researchPipelinePreflight,
      selectedWatchlistCacheRefreshRunId,
      workspace
    ]);
  const copyResearchContextReadinessReport = useCallback(async () => {
      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error("Clipboard API unavailable");
        }
        const report = await buildCurrentResearchContextReadinessReport();
        await navigator.clipboard.writeText(report.contentMarkdown);
        setCopiedResearchContextReadinessReport(true);
        if (researchContextReadinessReportCopyResetTimerRef.current !== null) {
          window.clearTimeout(researchContextReadinessReportCopyResetTimerRef.current);
        }
        researchContextReadinessReportCopyResetTimerRef.current = window.setTimeout(() => {
          setCopiedResearchContextReadinessReport(false);
          researchContextReadinessReportCopyResetTimerRef.current = null;
        }, 1800);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Research context readiness report copied · sha256 ${report.contentSha256.hash.slice(0, 12)}`,
          error: undefined
        }));
      } catch (copyError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research context readiness report copy failed",
          error: copyError instanceof Error ? copyError.message : "Clipboard copy failed"
        }));
      }
    }, [buildCurrentResearchContextReadinessReport]);
  const downloadResearchContextReadinessReport = useCallback(async () => {
      let objectUrl: string | null = null;
      try {
        const report = await buildCurrentResearchContextReadinessReport();
        objectUrl = URL.createObjectURL(new Blob([report.contentMarkdown], { type: "text/markdown;charset=utf-8" }));
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = report.fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Research context readiness report download ready · sha256 ${report.contentSha256.hash.slice(0, 12)}`,
          error: undefined
        }));
      } catch (downloadError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research context readiness report download failed",
          error: downloadError instanceof Error ? downloadError.message : "Report download failed"
        }));
      } finally {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
      }
    }, [buildCurrentResearchContextReadinessReport, quantCoreBaseUrl]);
  const recordResearchContextReadinessReport = useCallback(async () => {
      try {
        const report = await buildCurrentResearchContextReadinessReport();
        const result = await saveAuditEvent(quantCoreBaseUrl, buildResearchContextReadinessReportAuditEvent(report));
        if (result.source !== "core" || !result.event) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Research context readiness report audit failed",
            error: result.error ?? "Audit ledger unavailable"
          }));
          return;
        }
        setAuditEvidenceReportEvents((current) =>
          mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
        );
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Research context readiness report audited · sha256 ${report.contentSha256.hash.slice(0, 12)}`,
          error: undefined
        }));
      } catch (recordError) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research context readiness report audit failed",
          error: recordError instanceof Error ? recordError.message : "Audit ledger save failed"
        }));
      }
    }, [buildCurrentResearchContextReadinessReport]);
  const openResearchPipelinePreflightIssue = useCallback(
      (issue: ResearchPipelinePreflight["issues"][number]) => {
        if (
          !marketDataRefreshGuard.blocked &&
          (issue.action === "refresh-cache" || issue.action === "refresh-watchlist-cache")
        ) {
          runResearchContextReadinessAction(
            issue.action,
            () => void refreshSelectedMarketCache(),
            () => void refreshWatchlistMarketCache()
          );
          return;
        }
        const target = researchPipelinePreflightIssueTargets[issue.id];
        setIsResearchPipelineConfirmationOpen(false);
        selectProductWorkArea(target.workspaceId);
        window.setTimeout(() => {
          const element = document.querySelector<HTMLElement>(target.selector);
          if (!element) {
            return;
          }
          element.scrollIntoView({ block: "center" });
          element.focus({ preventScroll: true });
        }, 0);
      },
      [
        marketDataRefreshGuard.blocked,
        refreshSelectedMarketCache,
        refreshWatchlistMarketCache,
        selectProductWorkArea
      ]
    );
  const openLatestResearchContextReportInAudit = useCallback(() => {
      const query = latestResearchContextReadinessReport?.query ?? "";
      if (!query) {
        selectProductWorkArea("audit");
        return;
      }
      setAuditEvidenceReportQuery(query);
      setAuditEvidenceReportOffset(0);
      replaceAuditEvidenceReportQueryUrlParam(query);
      setActiveWorkAreaId("audit");
      setActiveLoopStepId("backtest");
      setActiveWorkflowStageId("execution");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Latest research context readiness report selected",
        error: undefined
      }));
    }, [latestResearchContextReadinessReport?.query, selectProductWorkArea]);
  const openLatestOtherResearchContextReportInAudit = useCallback(() => {
      const query = latestOtherResearchContextReadinessReport?.query ?? "";
      if (!query) {
        selectProductWorkArea("audit");
        return;
      }
      setAuditEvidenceReportQuery(query);
      setAuditEvidenceReportOffset(0);
      replaceAuditEvidenceReportQueryUrlParam(query);
      setActiveWorkAreaId("audit");
      setActiveLoopStepId("backtest");
      setActiveWorkflowStageId("execution");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Other research context readiness report selected",
        error: undefined
      }));
    }, [latestOtherResearchContextReadinessReport?.query, selectProductWorkArea]);
  const openLatestResearchContextReportContext = useCallback(() => {
      const search = latestResearchContextReadinessReport?.linkSearch ?? "";
      if (!search) {
        selectProductWorkArea("audit");
        return;
      }
      openAuditReportLedgerResearchContextLink(search);
    }, [
      latestResearchContextReadinessReport?.linkSearch,
      openAuditReportLedgerResearchContextLink,
      selectProductWorkArea
    ]);
  const openSelectedRefreshCoverageInResearch = useCallback(() => {
      selectProductWorkArea("research");
    }, [selectProductWorkArea]);
  return {
    researchContextReadinessRows, researchPipelinePreflight, researchPipelinePreparationEvidenceRunId, runPipeline, copyResearchContextLink, buildCurrentResearchContextReadinessReport,
    copyResearchContextReadinessReport, downloadResearchContextReadinessReport, recordResearchContextReadinessReport, openResearchPipelinePreflightIssue, openLatestResearchContextReportInAudit, openLatestOtherResearchContextReportInAudit,
    openLatestResearchContextReportContext, openSelectedRefreshCoverageInResearch
  };
}
