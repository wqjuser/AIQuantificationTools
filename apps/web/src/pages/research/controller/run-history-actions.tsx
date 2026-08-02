import { buildBacktestReportAuditEvent, loadLatestResearchRunPaperExecution, loadResearchRunDetail, loadResearchRunPromotion, marketKlinesFromResearchRunAudit, saveAuditEvent } from "../../../lib/terminal-api";
import { buildAuditReplayWorkflowState, buildBacktestReportMarkdown, buildResearchRunExportPreviewRows, replayRunRequestIsCurrent, ResearchRunAudit, workspaceFromResearchRunAudit } from "../../../lib/terminal-workbench";
import { AUDIT_REPORT_EVENTS_PAGE_SIZE, quantCoreBaseUrl } from "../../app-shell/initial-state";
import { mergeAuditEvidenceReportEvent } from "../../audit/event-merges";
import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activeAiReviewRunRecords" | "activeLoopStepId" | "activePaperExecutionRecord" | "activePromotionCandidateRecord" | "activeWorkAreaId" | "activeWorkflowStageId" | "aiReviewHistoryPagination" | "aiReviewRunRecords" | "auditEvidenceReportEvents" | "currentAiReviewArchivePreview" | "currentAiReviewRunRecord" | "error" | "isLoadingAiReviewHistory" | "isRunning" | "klinesState" | "manualSelectionVersionRef" | "paperExecutionRecord" | "promotionCandidateRecord" | "refreshAiReviewRunHistory" | "resetAiReviewHistoryState" | "riskApprovalSummary" | "runHistory" | "setActiveLoopStepId" | "setActiveWorkAreaId" | "setActiveWorkflowStageId" | "setAiReviewHistoryPagination" | "setAiReviewRunRecords" | "setAuditEvidenceReportEvents" | "setIsLoadingAiReviewHistory" | "setIsRunning" | "setKlinesState" | "setPaperExecutionRecord" | "setPromotionCandidateRecord" | "setRunHistoryState" | "setWorkflowRunState" | "setWorkspaceState" | "source" | "statusLabel" | "visibleStrategyExperimentActive" | "workflowRunIdRef" | "workflowRunState" | "workspace">;
type Result = Pick<AppControllerBindings, "researchRunExportPreviewRows" | "replayRun" | "exportBacktestReportMarkdown">;

export function useRunHistoryActions(controller: Dependencies): Result {
  const {
    activeAiReviewRunRecords, activeLoopStepId, activePaperExecutionRecord, activePromotionCandidateRecord, activeWorkAreaId, activeWorkflowStageId,
    aiReviewHistoryPagination, aiReviewRunRecords, auditEvidenceReportEvents, currentAiReviewArchivePreview, currentAiReviewRunRecord, error,
    isLoadingAiReviewHistory, isRunning, klinesState, manualSelectionVersionRef, paperExecutionRecord, promotionCandidateRecord,
    refreshAiReviewRunHistory, resetAiReviewHistoryState, riskApprovalSummary, runHistory, setActiveLoopStepId, setActiveWorkAreaId,
    setActiveWorkflowStageId, setAiReviewHistoryPagination, setAiReviewRunRecords, setAuditEvidenceReportEvents, setIsLoadingAiReviewHistory, setIsRunning,
    setKlinesState, setPaperExecutionRecord, setPromotionCandidateRecord, setRunHistoryState, setWorkflowRunState, setWorkspaceState,
    source, statusLabel, visibleStrategyExperimentActive, workflowRunIdRef, workflowRunState, workspace
  } = controller;
  const researchRunExportPreviewRows = buildResearchRunExportPreviewRows({
      aiReviewArchiveError: currentAiReviewArchivePreview.error,
      aiReviewArchiveStatus: currentAiReviewArchivePreview.status,
      aiReviewDecisions: currentAiReviewArchivePreview.aiReviewDecisions,
      aiReviewRecords: activeAiReviewRunRecords,
      authoritativeAiReviewRecords: currentAiReviewArchivePreview.authoritativeAiReviewRecords,
      currentAiReviewRecord: currentAiReviewRunRecord,
      paperExecution: activePaperExecutionRecord,
      promotionCandidate: activePromotionCandidateRecord,
      riskApproval: riskApprovalSummary,
      workspace
    });
  const replayRun = useCallback(
      async (run: ResearchRunAudit): Promise<boolean> => {
        const replayVersion = manualSelectionVersionRef.current + 1;
        manualSelectionVersionRef.current = replayVersion;
        const replayWorkflowRunId = workflowRunIdRef.current + 1;
        workflowRunIdRef.current = replayWorkflowRunId;
        setIsRunning(false);
        setPaperExecutionRecord(null);
        setPromotionCandidateRecord(null);
        resetAiReviewHistoryState();
        const detail = await loadResearchRunDetail(quantCoreBaseUrl, run.runId);
        if (!replayRunRequestIsCurrent(
          replayVersion,
          manualSelectionVersionRef.current,
          replayWorkflowRunId,
          workflowRunIdRef.current
        )) {
          return false;
        }
        const auditedRun = detail.run ?? run;
        const auditedKlines = marketKlinesFromResearchRunAudit(auditedRun);
        setWorkspaceState((current) => ({
          workspace: workspaceFromResearchRunAudit(current.workspace, auditedRun),
          source: "core",
          statusLabel: detail.source === "core" ? "Audit detail loaded" : "Audit replay loaded"
        }));
        if (auditedKlines) {
          setKlinesState(auditedKlines);
        }
        setIsLoadingAiReviewHistory(true);
        const [paperHistory, promotionHistory, aiReviewHistory] = await Promise.all([
          loadLatestResearchRunPaperExecution(quantCoreBaseUrl, auditedRun.runId),
          loadResearchRunPromotion(quantCoreBaseUrl, auditedRun.runId),
          refreshAiReviewRunHistory(auditedRun.runId, { commit: false, offset: 0, query: "" })
        ]);
        if (!replayRunRequestIsCurrent(
          replayVersion,
          manualSelectionVersionRef.current,
          replayWorkflowRunId,
          workflowRunIdRef.current
        )) {
          setIsLoadingAiReviewHistory(false);
          return false;
        }
        setPaperExecutionRecord(paperHistory.execution ?? null);
        setPromotionCandidateRecord(promotionHistory.promotion ?? null);
        setAiReviewRunRecords(aiReviewHistory.aiReviews);
        setAiReviewHistoryPagination(aiReviewHistory.pagination ?? null);
        setIsLoadingAiReviewHistory(false);
        if (paperHistory.execution) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Paper execution history loaded",
            error: undefined
          }));
        } else if (aiReviewHistory.aiReviews.length) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "AI review records loaded",
            error: undefined
          }));
        }
        setActiveWorkAreaId("audit");
        setActiveLoopStepId("backtest");
        setActiveWorkflowStageId("execution");
        setWorkflowRunState(buildAuditReplayWorkflowState(auditedRun));
        return true;
      },
      [refreshAiReviewRunHistory, resetAiReviewHistoryState]
    );
  const exportBacktestReportMarkdown = useCallback(() => {
      const markdown = visibleStrategyExperimentActive
        ? buildBacktestReportMarkdown(workspace, runHistory, visibleStrategyExperimentActive)
        : buildBacktestReportMarkdown(workspace, runHistory);
      const runId = workspace.researchRun?.runId;
      if (!markdown || !runId) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Backtest report export failed",
          error: "Run Pipeline before exporting an audited backtest report"
        }));
        return;
      }

      const objectUrl = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${runId}-backtest-report.md`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Backtest report export ready",
        error: undefined
      }));
      void buildBacktestReportAuditEvent({
        experiment: visibleStrategyExperimentActive,
        markdown,
        runHistory,
        workspace
      }).then((backtestReportAuditEvent) => {
        if (!backtestReportAuditEvent) {
          return;
        }

        return saveAuditEvent(quantCoreBaseUrl, backtestReportAuditEvent).then((result) => {
          if (result.event) {
            setAuditEvidenceReportEvents((current) =>
              mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
            );
            setWorkspaceState((current) => ({
              ...current,
              statusLabel: "Backtest report exported and audited",
              error: undefined
            }));
            return;
          }

          if (result.error) {
            setWorkspaceState((current) => ({
              ...current,
              statusLabel: "Backtest report export ready",
              error: `Audit ledger save failed: ${result.error}`
            }));
          }
        });
      });
    }, [runHistory, visibleStrategyExperimentActive, workspace]);
  return {
    researchRunExportPreviewRows, replayRun, exportBacktestReportMarkdown
  };
}
