import { loadLatestResearchRunPaperExecution, loadResearchRunDetail, loadResearchRunPromotion, marketKlinesFromResearchRunAudit } from "../../../lib/terminal-api";
import { buildAuditReplayWorkflowState, workspaceFromResearchRunAudit } from "../../../lib/terminal-workbench";
import { quantCoreBaseUrl } from "../../app-shell/initial-state";
import { type InitialPaperExecutionDeepLink } from "../../app-shell/url-state";
import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activeLoopStepId" | "activeWorkAreaId" | "activeWorkflowStageId" | "aiReviewRunRecords" | "error" | "isRunning" | "klinesState" | "manualSelectionVersionRef" | "paperExecutionDeepLinkStatus" | "paperExecutionRecord" | "pendingMarketAiSelectionResearchOrigin" | "promotionCandidateRecord" | "refreshAiReviewRunHistory" | "resetAiReviewHistoryState" | "setActiveLoopStepId" | "setActiveWorkAreaId" | "setActiveWorkflowStageId" | "setAiReviewRunRecords" | "setIsRunning" | "setKlinesState" | "setPaperExecutionDeepLinkStatus" | "setPaperExecutionRecord" | "setPendingMarketAiSelectionResearchOrigin" | "setPromotionCandidateRecord" | "setWorkflowRunState" | "setWorkspaceState" | "source" | "statusLabel" | "workflowRunIdRef" | "workflowRunState" | "workspace">;
type Result = Pick<AppControllerBindings, "loadPaperExecutionDeepLink">;

export function usePaperExecutionDeepLink(controller: Dependencies): Result {
  const {
    activeLoopStepId, activeWorkAreaId, activeWorkflowStageId, aiReviewRunRecords, error, isRunning,
    klinesState, manualSelectionVersionRef, paperExecutionDeepLinkStatus, paperExecutionRecord, pendingMarketAiSelectionResearchOrigin, promotionCandidateRecord,
    refreshAiReviewRunHistory, resetAiReviewHistoryState, setActiveLoopStepId, setActiveWorkAreaId, setActiveWorkflowStageId, setAiReviewRunRecords,
    setIsRunning, setKlinesState, setPaperExecutionDeepLinkStatus, setPaperExecutionRecord, setPendingMarketAiSelectionResearchOrigin, setPromotionCandidateRecord,
    setWorkflowRunState, setWorkspaceState, source, statusLabel, workflowRunIdRef, workflowRunState,
    workspace
  } = controller;
  const loadPaperExecutionDeepLink = useCallback(
      async (deepLink: InitialPaperExecutionDeepLink) => {
        const replayVersion = manualSelectionVersionRef.current + 1;
        manualSelectionVersionRef.current = replayVersion;
        workflowRunIdRef.current += 1;
        setIsRunning(false);
        setPaperExecutionRecord(null);
        setPromotionCandidateRecord(null);
        setPendingMarketAiSelectionResearchOrigin(null);
        resetAiReviewHistoryState();
        setPaperExecutionDeepLinkStatus({ ...deepLink, status: "loading", error: null });
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Paper execution deep link loading",
          error: undefined
        }));

        const detail = await loadResearchRunDetail(quantCoreBaseUrl, deepLink.runId);
        if (manualSelectionVersionRef.current !== replayVersion) {
          return;
        }
        if (!detail.run) {
          const message = detail.error ?? `Paper execution run ${deepLink.runId} was not found`;
          setPaperExecutionDeepLinkStatus({ ...deepLink, status: "failed", error: message });
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Paper execution deep link failed",
            error: message
          }));
          setActiveWorkAreaId("execution");
          setActiveLoopStepId("paper");
          setActiveWorkflowStageId("execution");
          return;
        }

        const auditedRun = detail.run;
        const auditedKlines = marketKlinesFromResearchRunAudit(auditedRun);
        setWorkspaceState((current) => ({
          workspace: workspaceFromResearchRunAudit(current.workspace, auditedRun),
          source: "core",
          statusLabel: "Paper execution deep link run loaded",
          error: undefined
        }));
        if (auditedKlines) {
          setKlinesState(auditedKlines);
        }

        const [paperHistory, promotionHistory, aiReviewHistory] = await Promise.all([
          loadLatestResearchRunPaperExecution(quantCoreBaseUrl, auditedRun.runId),
          loadResearchRunPromotion(quantCoreBaseUrl, auditedRun.runId),
          refreshAiReviewRunHistory(auditedRun.runId, { offset: 0, query: "" })
        ]);
        if (manualSelectionVersionRef.current !== replayVersion) {
          return;
        }

        if (paperHistory.execution?.executionId !== deepLink.executionId) {
          const message =
            paperHistory.error ?? `Paper execution ${deepLink.executionId} was not found for ${auditedRun.runId}`;
          setPaperExecutionDeepLinkStatus({ ...deepLink, status: "failed", error: message });
          setPromotionCandidateRecord(promotionHistory.promotion ?? null);
          setAiReviewRunRecords(aiReviewHistory.aiReviews);
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Paper execution deep link failed",
            error: message
          }));
          setActiveWorkAreaId("execution");
          setActiveLoopStepId("paper");
          setActiveWorkflowStageId("execution");
          setWorkflowRunState(buildAuditReplayWorkflowState(auditedRun));
          return;
        }

        setPaperExecutionRecord(paperHistory.execution);
        setPaperExecutionDeepLinkStatus({ ...deepLink, status: "loaded", error: null });
        setPromotionCandidateRecord(promotionHistory.promotion ?? null);
        setAiReviewRunRecords(aiReviewHistory.aiReviews);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Paper execution deep link loaded",
          error: undefined
        }));
        setActiveWorkAreaId("execution");
        setActiveLoopStepId("paper");
        setActiveWorkflowStageId("execution");
        setWorkflowRunState(buildAuditReplayWorkflowState(auditedRun));
      },
      [refreshAiReviewRunHistory, resetAiReviewHistoryState]
    );
  return {
    loadPaperExecutionDeepLink
  };
}
