import { saveAuditEvent, undoResearchRunImport } from "../../../lib/terminal-api";
import { buildInstrumentFromSymbol, buildResearchRunImportDiffRows, buildResearchRunImportUndoAuditEvent, buildResearchRunImportUndoFailureAuditEvent, mergeResearchRunImportAuditEvents, ResearchRunImportAuditEvent, resolveResearchContextUrlState, resolveWatchlistCacheRefreshRunIdFromUrl, watchlistIncludesInstrument, workspaceWithSelectedInstrument, workspaceWithSelectedTimeframe } from "../../../lib/terminal-workbench";
import { quantCoreBaseUrl } from "../../app-shell/initial-state";
import { createWorkflowRunState } from "../../app-shell/workflow-runtime";
import { auditEventRecordToResearchRunImportEvent, researchRunImportAuditEventToAuditEventRecord } from "../ResearchPackageFormatters";
import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activeAiReviewRunRecords" | "activeLoopStepId" | "activePaperExecutionRecord" | "activeWorkAreaId" | "activeWorkflowStageId" | "aiReviewStage3Decisions" | "aiReviewStage3History" | "aiReviewStage3LegacyHistory" | "error" | "hasUnsavedWatchlistChanges" | "inspectedExportPackage" | "isRunning" | "manualSelectionVersionRef" | "paperExecutionRecord" | "pendingImportPackage" | "promotionCandidateRecord" | "refreshRunHistory" | "replayRun" | "researchRunImportArchiveSnapshot" | "researchRunImportAuditEvents" | "resetAiReviewHistoryState" | "setActiveLoopStepId" | "setActiveWorkAreaId" | "setActiveWorkflowStageId" | "setAiReviewStage3Decisions" | "setAiReviewStage3History" | "setAiReviewStage3LegacyHistory" | "setHasUnsavedWatchlistChanges" | "setInspectedExportPackage" | "setIsRunning" | "setPaperExecutionRecord" | "setPendingImportPackage" | "setPromotionCandidateRecord" | "setResearchRunImportAuditEvents" | "setWatchlistCacheRefreshRunSelection" | "setWorkflowRunState" | "setWorkspaceState" | "source" | "statusLabel" | "workflowRunIdRef" | "workflowRunState" | "workspace">;
type Result = Pick<AppControllerBindings, "researchRunImportDiffRows" | "undoResearchRunImportEvent" | "openAuditReportLedgerResearchContextLink">;

export function useImportRollbackActions(controller: Dependencies): Result {
  const {
    activeAiReviewRunRecords, activeLoopStepId, activePaperExecutionRecord, activeWorkAreaId, activeWorkflowStageId, aiReviewStage3Decisions,
    aiReviewStage3History, aiReviewStage3LegacyHistory, error, hasUnsavedWatchlistChanges, inspectedExportPackage, isRunning,
    manualSelectionVersionRef, paperExecutionRecord, pendingImportPackage, promotionCandidateRecord, refreshRunHistory, replayRun,
    researchRunImportArchiveSnapshot, researchRunImportAuditEvents, resetAiReviewHistoryState, setActiveLoopStepId, setActiveWorkAreaId, setActiveWorkflowStageId,
    setAiReviewStage3Decisions, setAiReviewStage3History, setAiReviewStage3LegacyHistory, setHasUnsavedWatchlistChanges, setInspectedExportPackage, setIsRunning,
    setPaperExecutionRecord, setPendingImportPackage, setPromotionCandidateRecord, setResearchRunImportAuditEvents, setWatchlistCacheRefreshRunSelection, setWorkflowRunState,
    setWorkspaceState, source, statusLabel, workflowRunIdRef, workflowRunState, workspace
  } = controller;
  const researchRunImportDiffRows = buildResearchRunImportDiffRows({
      aiReviewArchiveReadbackErrors: researchRunImportArchiveSnapshot?.readbackErrors,
      aiReviewDecisions:
        researchRunImportArchiveSnapshot?.aiReviewDecisions ?? aiReviewStage3Decisions,
      aiReviewRecords: activeAiReviewRunRecords,
      authoritativeAiReviewRecords:
        researchRunImportArchiveSnapshot?.authoritativeAiReviewRecords ?? aiReviewStage3History,
      exportPackage: pendingImportPackage?.exportPackage ?? inspectedExportPackage,
      legacyAiReviewIds:
        researchRunImportArchiveSnapshot?.legacyAiReviewIds
        ?? aiReviewStage3LegacyHistory.map((review) => review.aiReviewId),
      paperExecution: activePaperExecutionRecord,
      workspace
    });
  const undoResearchRunImportEvent = useCallback(
      async (undoToken: string, expectedRunId: string) => {
        const eventToUndo = researchRunImportAuditEvents.find(
          (event) => event.stage === "confirmed" && event.undoToken === undoToken
        );
        const persistUndoAuditEvent = (event: ResearchRunImportAuditEvent) => {
          setResearchRunImportAuditEvents((current) => mergeResearchRunImportAuditEvents(current, event));
          void saveAuditEvent(quantCoreBaseUrl, researchRunImportAuditEventToAuditEventRecord(event)).then((saved) => {
            if (saved.source !== "core" || !saved.event) {
              return;
            }
            const savedEvent = auditEventRecordToResearchRunImportEvent(saved.event);
            if (savedEvent) {
              setResearchRunImportAuditEvents((current) => mergeResearchRunImportAuditEvents(current, savedEvent));
            }
          });
        };
        const result = await undoResearchRunImport(quantCoreBaseUrl, undoToken, expectedRunId);
        if (result.source === "fallback" || !result.undo) {
          if (eventToUndo) {
            persistUndoAuditEvent(
              buildResearchRunImportUndoFailureAuditEvent({
                error: result.error ?? "Research run import undo failed",
                event: eventToUndo
              })
            );
          }
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Research run import undo failed",
            error: result.error ?? "Research run import undo failed"
          }));
          return;
        }
        if (eventToUndo) {
          const undoneEvent = buildResearchRunImportUndoAuditEvent({ event: eventToUndo });
          persistUndoAuditEvent(undoneEvent);
        }
        if (result.run) {
          await replayRun(result.run);
        } else {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Research run import undone",
            error: undefined
          }));
          setActiveWorkAreaId("audit");
        }
        await refreshRunHistory();
      },
      [quantCoreBaseUrl, refreshRunHistory, replayRun, researchRunImportAuditEvents]
    );
  const openAuditReportLedgerResearchContextLink = useCallback(
      (search: string) => {
        const urlState = resolveResearchContextUrlState(search);
        if (!urlState) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Research context report link failed",
            error: "The report does not contain a valid research context link."
          }));
          return;
        }
        const instrument =
          workspace.watchlist.find(
            (candidate) => candidate.market === urlState.market && candidate.symbol === urlState.symbol
          ) ?? buildInstrumentFromSymbol(urlState.market, urlState.symbol);
        if (!instrument) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Research context report link failed",
            error: "The report research context symbol is invalid."
          }));
          return;
        }

        const watchlistRefreshRunId = resolveWatchlistCacheRefreshRunIdFromUrl(search);
        const isExistingWatchlistInstrument = watchlistIncludesInstrument(workspace.watchlist, instrument);
        manualSelectionVersionRef.current += 1;
        workflowRunIdRef.current += 1;
        setIsRunning(false);
        setPaperExecutionRecord(null);
        setPromotionCandidateRecord(null);
        resetAiReviewHistoryState();
        setHasUnsavedWatchlistChanges((current) => current || !isExistingWatchlistInstrument);
        setWatchlistCacheRefreshRunSelection(watchlistRefreshRunId);
        setWorkspaceState((current) => {
          const instrumentWorkspace = workspaceWithSelectedInstrument(current.workspace, instrument);
          const timeframeWorkspace =
            instrumentWorkspace.selectedTimeframe === urlState.timeframe
              ? instrumentWorkspace
              : workspaceWithSelectedTimeframe(instrumentWorkspace, urlState.timeframe);
          return {
            workspace: timeframeWorkspace,
            source: "core",
            statusLabel: "Research context report link opened"
          };
        });
        setActiveWorkAreaId("research");
        setActiveLoopStepId("research");
        setActiveWorkflowStageId("data");
        setWorkflowRunState(createWorkflowRunState());
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.search = search.startsWith("?") ? search : `?${search}`;
          url.hash = "";
          window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        }
      },
      [resetAiReviewHistoryState, setWatchlistCacheRefreshRunSelection, workspace.watchlist]
    );
  return {
    researchRunImportDiffRows, undoResearchRunImportEvent, openAuditReportLedgerResearchContextLink
  };
}
