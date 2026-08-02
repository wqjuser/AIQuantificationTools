import { saveWatchlist } from "../../../lib/terminal-api";
import { TerminalWorkspace, WatchlistCacheRefreshItemRow, watchlistIncludesInstrument, workspaceWithSelectedInstrument, workspaceWithSelectedTimeframe } from "../../../lib/terminal-workbench";
import { quantCoreBaseUrl } from "../../app-shell/initial-state";
import { createWorkflowRunState } from "../../app-shell/workflow-runtime";
import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activeLoopStepId" | "activeWorkAreaId" | "activeWorkflowStageId" | "error" | "hasUnsavedWatchlistChanges" | "isRunning" | "isSavingWatchlist" | "manualSelectionVersionRef" | "paperExecutionRecord" | "pendingMarketAiSelectionResearchOrigin" | "promotionCandidateRecord" | "resetAiReviewHistoryState" | "setActiveLoopStepId" | "setActiveWorkAreaId" | "setActiveWorkflowStageId" | "setHasUnsavedWatchlistChanges" | "setIsRunning" | "setIsSavingWatchlist" | "setPaperExecutionRecord" | "setPendingMarketAiSelectionResearchOrigin" | "setPromotionCandidateRecord" | "setWorkflowRunState" | "setWorkspaceState" | "source" | "statusLabel" | "workflowRunIdRef" | "workflowRunState" | "workspace" | "workspaceRef">;
type Result = Pick<AppControllerBindings, "selectWatchlistCacheRefreshItem" | "removeWatchlistInstrument">;

export function useWatchlistActions(controller: Dependencies): Result {
  const {
    activeLoopStepId, activeWorkAreaId, activeWorkflowStageId, error, hasUnsavedWatchlistChanges, isRunning,
    isSavingWatchlist, manualSelectionVersionRef, paperExecutionRecord, pendingMarketAiSelectionResearchOrigin, promotionCandidateRecord, resetAiReviewHistoryState,
    setActiveLoopStepId, setActiveWorkAreaId, setActiveWorkflowStageId, setHasUnsavedWatchlistChanges, setIsRunning, setIsSavingWatchlist,
    setPaperExecutionRecord, setPendingMarketAiSelectionResearchOrigin, setPromotionCandidateRecord, setWorkflowRunState, setWorkspaceState, source,
    statusLabel, workflowRunIdRef, workflowRunState, workspace, workspaceRef
  } = controller;
  const selectWatchlistCacheRefreshItem = useCallback(
      (row: WatchlistCacheRefreshItemRow) => {
        const existingInstrument =
          workspace.watchlist.find((instrument) => instrument.market === row.market && instrument.symbol === row.symbol) ??
          row.instrument;
        const isExistingWatchlistInstrument = watchlistIncludesInstrument(workspace.watchlist, existingInstrument);
        manualSelectionVersionRef.current += 1;
        workflowRunIdRef.current += 1;
        setIsRunning(false);
        setPaperExecutionRecord(null);
        setPromotionCandidateRecord(null);
        setPendingMarketAiSelectionResearchOrigin(null);
        resetAiReviewHistoryState();
        setHasUnsavedWatchlistChanges((current) => current || !isExistingWatchlistInstrument);
        setWorkspaceState((current) => {
          const instrumentWorkspace = workspaceWithSelectedInstrument(current.workspace, existingInstrument);
          const timeframeWorkspace =
            instrumentWorkspace.selectedTimeframe === row.timeframe
              ? instrumentWorkspace
              : workspaceWithSelectedTimeframe(instrumentWorkspace, row.timeframe);
          return {
            workspace: timeframeWorkspace,
            source: "core",
            statusLabel: "Refresh item selected"
          };
        });
        setActiveWorkAreaId("research");
        setActiveLoopStepId("research");
        setActiveWorkflowStageId("data");
        setWorkflowRunState(createWorkflowRunState());
      },
      [resetAiReviewHistoryState, workspace.watchlist]
    );
  const removeWatchlistInstrument = useCallback(async (instrument: TerminalWorkspace["selectedInstrument"]) => {
      const nextWatchlist = workspace.watchlist.filter(
        (candidate) => candidate.market !== instrument.market || candidate.symbol !== instrument.symbol
      );
      if (!nextWatchlist.length || nextWatchlist.length === workspace.watchlist.length) {
        return;
      }
      const selectionVersionAtRequest = manualSelectionVersionRef.current;
      const selectedWasRemoved =
        workspace.selectedInstrument.market === instrument.market &&
        workspace.selectedInstrument.symbol === instrument.symbol;
      setIsSavingWatchlist(true);
      try {
        const result = await saveWatchlist(quantCoreBaseUrl, nextWatchlist);
        if (result.source !== "core" || !result.watchlist.length) {
          setWorkspaceState((current) => ({
            ...current,
            source: result.source,
            statusLabel: "Watchlist save failed",
            error: result.error ?? "Watchlist save failed"
          }));
          return;
        }
        const shouldSelectFallback =
          selectedWasRemoved && manualSelectionVersionRef.current === selectionVersionAtRequest;
        const selectionChangedDuringSave = manualSelectionVersionRef.current !== selectionVersionAtRequest;
        const latestWorkspace = workspaceRef.current;
        const concurrentAdditions = selectionChangedDuringSave
          ? latestWorkspace.watchlist.filter(
              (candidate) =>
                !watchlistIncludesInstrument(workspace.watchlist, candidate) ||
                (
                  candidate.market === instrument.market &&
                  candidate.symbol === instrument.symbol &&
                  latestWorkspace.selectedInstrument.market === instrument.market &&
                  latestWorkspace.selectedInstrument.symbol === instrument.symbol
                )
            )
          : [];
        if (shouldSelectFallback) {
          manualSelectionVersionRef.current += 1;
          workflowRunIdRef.current += 1;
          setIsRunning(false);
          setPaperExecutionRecord(null);
          setPromotionCandidateRecord(null);
          resetAiReviewHistoryState();
          setWorkflowRunState(createWorkflowRunState());
        }
        setWorkspaceState((current) => {
          const savedWatchlist = [
            ...concurrentAdditions,
            ...result.watchlist.filter((candidate) => !watchlistIncludesInstrument(concurrentAdditions, candidate))
          ].slice(0, 8);
          const savedWorkspace = { ...current.workspace, watchlist: savedWatchlist };
          return {
            workspace: shouldSelectFallback
              ? workspaceWithSelectedInstrument(savedWorkspace, savedWatchlist[0])
              : savedWorkspace,
            source: "core",
            statusLabel: "Watchlist saved",
            error: undefined
          };
        });
        setHasUnsavedWatchlistChanges(concurrentAdditions.length > 0);
      } finally {
        setIsSavingWatchlist(false);
      }
    }, [resetAiReviewHistoryState, workspace.selectedInstrument, workspace.watchlist]);
  return {
    selectWatchlistCacheRefreshItem, removeWatchlistInstrument
  };
}
