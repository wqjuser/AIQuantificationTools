import { loadResearchRunDetail, loadStrategyExperimentDetail, loadTerminalWorkspace, marketKlinesFromResearchRunAudit, MarketKlinesResult } from "../../../lib/terminal-api";
import { buildAuditEvidenceReportLedgerRowP2ManifestChainPreflightQuery, buildAuditEvidenceReportLedgerRowP2ManifestChainPreflightReviewQuery, buildPreLiveReadinessChecklist, buildStrategyExperimentEvidenceSummary, P0PlatformActionOutcome, ProductWorkAreaId, replaceAiReviewRunIdInUrl, ResearchRunAudit, resolveP0CurrentGapActionDeepLinkState, resolveSavedResearchWorkspaceSelection, Stage1P0DailyUseClosure, Stage1P0DailyUseRefreshOutcome, StrategyExperimentDetail, TerminalWorkspace, Timeframe, watchlistIncludesInstrument, workspaceFromResearchRunAudit, workspaceWithAppliedResearchWorkspaceState, workspaceWithPreservedInteractiveState, workspaceWithResearchContextUrlState, workspaceWithSelectedInstrument, workspaceWithSelectedTimeframe } from "../../../lib/terminal-workbench";
import { quantCoreBaseUrl } from "../initial-state";
import { hasExplicitResearchContextUrl, replaceAuditEvidenceReportQueryUrlParam, replaceP0CurrentGapActionUrlSearch, replaceStrategyExperimentUrlParam, resolveInitialResearchContextUrlState } from "../url-state";
import { createWorkflowRunState } from "../workflow-runtime";
import { useCallback } from "react";
import type { AppControllerBindings } from "./bindings";

type Dependencies = Pick<AppControllerBindings, "activeLoopStepId" | "activeWorkAreaId" | "activeWorkflowStageId" | "aiReviewRunRestoreAbortControllerRef" | "auditEvidenceReportLedgerRows" | "auditEvidenceReportLedgerSummary" | "auditEvidenceReportOffset" | "auditEvidenceReportQuery" | "commitProductWorkAreaSelection" | "currentResearchRunIdRef" | "deferSettingsNavigation" | "error" | "hasUnsavedWatchlistChanges" | "initialAiReviewRunIdRef" | "initialStrategyExperimentIdRef" | "isRefreshing" | "isRunning" | "isSearchOpen" | "klinesState" | "latestP2ManifestChainPreflightReviewAuditRow" | "manualSelectionVersionRef" | "p2ManifestChainPreflightAuditReference" | "p2ManifestChainPreflightReviewAuditEvent" | "p2ManifestChainPreflightReviewAuditEventId" | "p2ManifestChainPreflightReviewAuditEventReference" | "p2ManifestChainPreflightSummary" | "paperExecutionRecord" | "paperExecutionReplayGate" | "pendingMarketAiSelectionResearchOrigin" | "portfolioStage4RefreshGeneration" | "portfolioStage4RequestCoordinatorRef" | "promotionCandidateRecord" | "promotionReadiness" | "refreshAuditSigningKeys" | "refreshRunHistory" | "refreshSettingsStatus" | "replayRun" | "researchRunExportBrowserQuery" | "researchRunImportAuditQuery" | "researchRunImportDiffQuery" | "resetAiReviewHistoryState" | "resetStage4PortfolioBusyState" | "runHistory" | "savedResearchWorkspaceSelectionAppliedRef" | "searchSuggestions" | "setActiveLoopStepId" | "setActiveWorkAreaId" | "setActiveWorkflowStageId" | "setAuditEvidenceReportOffset" | "setAuditEvidenceReportQuery" | "setHasUnsavedWatchlistChanges" | "setIsRefreshing" | "setIsRunning" | "setIsSearchOpen" | "setKlinesState" | "setP2ManifestChainPreflightReviewAuditEvent" | "setPaperExecutionRecord" | "setPendingMarketAiSelectionResearchOrigin" | "setPortfolioStage4RefreshGeneration" | "setPromotionCandidateRecord" | "setResearchRunExportBrowserQuery" | "setResearchRunImportAuditQuery" | "setResearchRunImportDiffQuery" | "setRunHistoryState" | "setSearchSuggestions" | "setStage1P0DailyUseRefreshOutcome" | "setStrategyExperimentActive" | "setWatchlistCacheRefreshRunSelection" | "setWorkflowRunState" | "setWorkspaceState" | "source" | "stage1P0DailyUseRefreshOutcome" | "statusLabel" | "strategyExperimentActive" | "strategyExperimentI18nRef" | "updateAuditEvidenceReportQuery" | "workflowRunIdRef" | "workflowRunState" | "workspace">;
type Result = Pick<AppControllerBindings, "preLiveReadinessChecklist" | "refreshWorkspace" | "selectInstrument" | "selectTimeframe" | "selectProductWorkArea" | "openP2ManifestChainPreflightAudit" | "openP2ManifestChainPreflightReviewAudit" | "openP0CurrentGapActionLink" | "openStage1P0DailyUseRow" | "openStage1P0DailyUseRefreshOutcomeEntry" | "openStage1P0DailyUseRefreshOutcomeNextStep" | "focusLatestP0ReadinessReport" | "focusLatestP0PreparationEvidence" | "focusLatestP0Progress" | "focusLatestP0Preflight" | "focusLatestP0Completion" | "openLatestP0CompletionGap" | "focusLatestP0BacklogReadiness" | "focusLatestP0CurrentGapReadiness" | "openP0ActionOutcomeEvidence" | "inspectRefreshEvidenceRun" | "openAutomaticTradingConsole">;

export function useNavigationActions(controller: Dependencies): Result {
  const {
    activeLoopStepId, activeWorkAreaId, activeWorkflowStageId, aiReviewRunRestoreAbortControllerRef, auditEvidenceReportLedgerRows, auditEvidenceReportLedgerSummary,
    auditEvidenceReportOffset, auditEvidenceReportQuery, commitProductWorkAreaSelection, currentResearchRunIdRef, deferSettingsNavigation, error,
    hasUnsavedWatchlistChanges, initialAiReviewRunIdRef, initialStrategyExperimentIdRef, isRefreshing, isRunning, isSearchOpen,
    klinesState, latestP2ManifestChainPreflightReviewAuditRow, manualSelectionVersionRef, p2ManifestChainPreflightAuditReference, p2ManifestChainPreflightReviewAuditEvent, p2ManifestChainPreflightReviewAuditEventId,
    p2ManifestChainPreflightReviewAuditEventReference, p2ManifestChainPreflightSummary, paperExecutionRecord, paperExecutionReplayGate, pendingMarketAiSelectionResearchOrigin, portfolioStage4RefreshGeneration,
    portfolioStage4RequestCoordinatorRef, promotionCandidateRecord, promotionReadiness, refreshAuditSigningKeys, refreshRunHistory, refreshSettingsStatus,
    replayRun, researchRunExportBrowserQuery, researchRunImportAuditQuery, researchRunImportDiffQuery, resetAiReviewHistoryState, resetStage4PortfolioBusyState,
    runHistory, savedResearchWorkspaceSelectionAppliedRef, searchSuggestions, setActiveLoopStepId, setActiveWorkAreaId, setActiveWorkflowStageId,
    setAuditEvidenceReportOffset, setAuditEvidenceReportQuery, setHasUnsavedWatchlistChanges, setIsRefreshing, setIsRunning, setIsSearchOpen,
    setKlinesState, setP2ManifestChainPreflightReviewAuditEvent, setPaperExecutionRecord, setPendingMarketAiSelectionResearchOrigin, setPortfolioStage4RefreshGeneration, setPromotionCandidateRecord,
    setResearchRunExportBrowserQuery, setResearchRunImportAuditQuery, setResearchRunImportDiffQuery, setRunHistoryState, setSearchSuggestions, setStage1P0DailyUseRefreshOutcome,
    setStrategyExperimentActive, setWatchlistCacheRefreshRunSelection, setWorkflowRunState, setWorkspaceState, source, stage1P0DailyUseRefreshOutcome,
    statusLabel, strategyExperimentActive, strategyExperimentI18nRef, updateAuditEvidenceReportQuery, workflowRunIdRef, workflowRunState,
    workspace
  } = controller;
  const preLiveReadinessChecklist = buildPreLiveReadinessChecklist(promotionReadiness, {
      paperExecutionReplayGate
    });
  const refreshWorkspace = useCallback(async () => {
      const startedSelectionVersion = manualSelectionVersionRef.current;
      const requestedStrategyExperimentId = initialStrategyExperimentIdRef.current;
      const requestedAiReviewRunId = initialAiReviewRunIdRef.current;
      aiReviewRunRestoreAbortControllerRef.current?.abort();
      const restoreController = requestedAiReviewRunId ? new AbortController() : null;
      aiReviewRunRestoreAbortControllerRef.current = restoreController;
      const aiReviewRestoreIsCurrent = () => Boolean(
        restoreController
        && !restoreController.signal.aborted
        && aiReviewRunRestoreAbortControllerRef.current === restoreController
        && manualSelectionVersionRef.current === startedSelectionVersion
      );
      setIsRefreshing(true);
      resetStage4PortfolioBusyState();
      portfolioStage4RequestCoordinatorRef.current.invalidate(currentResearchRunIdRef.current);
      setPortfolioStage4RefreshGeneration((current) => current + 1);
      const result = await loadTerminalWorkspace(quantCoreBaseUrl);
      const researchContextUrlState = resolveInitialResearchContextUrlState();
      let restoredWorkspace = workspaceWithResearchContextUrlState(
        workspaceWithAppliedResearchWorkspaceState(result.workspace),
        researchContextUrlState
      );
      let restoredAiReviewRun: ResearchRunAudit | null = null;
      let restoredAiReviewKlines: MarketKlinesResult | null = null;
      let aiReviewRunRestoreError: string | null = null;
      if (requestedAiReviewRunId && restoreController) {
        const runResult = await loadResearchRunDetail(
          quantCoreBaseUrl,
          requestedAiReviewRunId,
          restoreController.signal
        );
        if (aiReviewRestoreIsCurrent()) {
          initialAiReviewRunIdRef.current = null;
          if (runResult.source === "core" && runResult.run?.runId === requestedAiReviewRunId) {
            restoredAiReviewRun = runResult.run;
            restoredWorkspace = workspaceFromResearchRunAudit(restoredWorkspace, runResult.run);
            restoredAiReviewKlines = marketKlinesFromResearchRunAudit(runResult.run);
          } else {
            aiReviewRunRestoreError = strategyExperimentI18nRef.current.t("aiReviewStage3.error.runRestoreFailed");
            window.history.replaceState(
              {},
              "",
              replaceAiReviewRunIdInUrl(window.location.href, "ai-review", null)
            );
          }
        } else {
          initialAiReviewRunIdRef.current = null;
        }
        if (aiReviewRunRestoreAbortControllerRef.current === restoreController) {
          aiReviewRunRestoreAbortControllerRef.current = null;
        }
      }
      let restoredStrategyExperiment: StrategyExperimentDetail | null = null;
      let restoredStrategyExperimentKlines: MarketKlinesResult | null = null;
      if (requestedStrategyExperimentId && (!requestedAiReviewRunId || restoredAiReviewRun)) {
        const experimentResult = await loadStrategyExperimentDetail(quantCoreBaseUrl, requestedStrategyExperimentId);
        const experiment = experimentResult.experiment;
        if (experiment && (!requestedAiReviewRunId || experiment.sourceRunId === requestedAiReviewRunId)) {
          const runResult = restoredAiReviewRun?.runId === experiment.sourceRunId
            ? { run: restoredAiReviewRun, source: "core" as const }
            : await loadResearchRunDetail(quantCoreBaseUrl, experiment.sourceRunId);
          if (runResult.run) {
            const experimentWorkspace = workspaceFromResearchRunAudit(restoredWorkspace, runResult.run);
            if (buildStrategyExperimentEvidenceSummary(experimentWorkspace, experiment)) {
              restoredWorkspace = experimentWorkspace;
              restoredStrategyExperiment = experiment;
              restoredStrategyExperimentKlines = marketKlinesFromResearchRunAudit(runResult.run);
            }
          }
        }
        initialStrategyExperimentIdRef.current = null;
        if (!restoredStrategyExperiment) {
          replaceStrategyExperimentUrlParam(null);
        }
      } else if (requestedStrategyExperimentId) {
        initialStrategyExperimentIdRef.current = null;
        replaceStrategyExperimentUrlParam(null);
      }
      const restoredResult = {
        ...result,
        workspace: restoredWorkspace,
        ...(aiReviewRunRestoreError
          ? { statusLabel: aiReviewRunRestoreError, error: aiReviewRunRestoreError }
          : restoredAiReviewRun
            ? {
                statusLabel: strategyExperimentI18nRef.current.t("aiReviewStage3.runRestored"),
                error: undefined
              }
            : {})
      };
      const urlContextCreatesUnsavedWatchlist =
        Boolean(researchContextUrlState) && !watchlistIncludesInstrument(result.workspace.watchlist, researchContextUrlState!);
      const shouldConsiderSavedWorkArea =
        !savedResearchWorkspaceSelectionAppliedRef.current && !hasExplicitResearchContextUrl();
      const shouldApplySavedWorkArea =
        shouldConsiderSavedWorkArea && manualSelectionVersionRef.current === startedSelectionVersion;
      setWorkspaceState((current) => {
        if (manualSelectionVersionRef.current === startedSelectionVersion) {
          return restoredResult;
        }
        return {
          ...restoredResult,
          workspace: workspaceWithPreservedInteractiveState(restoredResult.workspace, current.workspace),
          statusLabel: current.statusLabel
        };
      });
      if (
        restoredStrategyExperiment &&
        manualSelectionVersionRef.current === startedSelectionVersion
      ) {
        setStrategyExperimentActive(restoredStrategyExperiment);
        if (restoredStrategyExperimentKlines) {
          setKlinesState(restoredStrategyExperimentKlines);
        }
      } else if (restoredAiReviewKlines && manualSelectionVersionRef.current === startedSelectionVersion) {
        setKlinesState(restoredAiReviewKlines);
      }
      if (shouldConsiderSavedWorkArea) {
        savedResearchWorkspaceSelectionAppliedRef.current = true;
        if (shouldApplySavedWorkArea) {
          const selection = resolveSavedResearchWorkspaceSelection(restoredResult.workspace, "research");
          setActiveWorkAreaId(selection.areaId);
          setActiveLoopStepId(selection.quantLoopStepId);
          setActiveWorkflowStageId(selection.workflowStageId);
        }
      }
      if (urlContextCreatesUnsavedWatchlist && manualSelectionVersionRef.current === startedSelectionVersion) {
        setHasUnsavedWatchlistChanges(true);
      }
      await refreshRunHistory();
      await refreshSettingsStatus();
      await refreshAuditSigningKeys();
      setIsRefreshing(false);
    }, [
      refreshAuditSigningKeys,
      refreshRunHistory,
      refreshSettingsStatus,
      resetStage4PortfolioBusyState
    ]);
  const selectInstrument = useCallback(
      (
        instrument: TerminalWorkspace["selectedInstrument"],
        targetWorkAreaId: ProductWorkAreaId = "research",
        addToWatchlist = true
      ) => {
        const applySelection = () => {
          const isExistingWatchlistInstrument = watchlistIncludesInstrument(workspace.watchlist, instrument);
          manualSelectionVersionRef.current += 1;
          workflowRunIdRef.current += 1;
          setIsRunning(false);
          setPaperExecutionRecord(null);
          setPromotionCandidateRecord(null);
          setPendingMarketAiSelectionResearchOrigin(null);
          resetAiReviewHistoryState();
          if (addToWatchlist) {
            setHasUnsavedWatchlistChanges((current) => current || !isExistingWatchlistInstrument);
          }
          setWorkspaceState((current) => {
            const selectedWorkspace = workspaceWithSelectedInstrument(current.workspace, instrument);
            return {
              workspace: addToWatchlist
                ? selectedWorkspace
                : {
                    ...selectedWorkspace,
                    watchlist: current.workspace.watchlist
                  },
              source: "core",
              statusLabel: "Instrument selected"
            };
          });
          setActiveWorkAreaId(targetWorkAreaId);
          setActiveLoopStepId("research");
          setActiveWorkflowStageId("data");
          setWorkflowRunState(createWorkflowRunState());
        };
        if (deferSettingsNavigation(targetWorkAreaId, applySelection)) return;
        applySelection();
      },
      [deferSettingsNavigation, resetAiReviewHistoryState, workspace.watchlist]
    );
  const selectTimeframe = useCallback(
      (timeframe: Timeframe, targetWorkAreaId: "market" | "research" = "research") => {
        const applySelection = () => {
          setSearchSuggestions([]);
          setIsSearchOpen(false);
          manualSelectionVersionRef.current += 1;
          workflowRunIdRef.current += 1;
          setIsRunning(false);
          setPaperExecutionRecord(null);
          setPromotionCandidateRecord(null);
          setPendingMarketAiSelectionResearchOrigin(null);
          resetAiReviewHistoryState();
          setWorkspaceState((current) => ({
            workspace: workspaceWithSelectedTimeframe(current.workspace, timeframe),
            source: "core",
            statusLabel: "Timeframe selected"
          }));
          setActiveWorkAreaId(targetWorkAreaId);
          setActiveLoopStepId("research");
          setActiveWorkflowStageId("data");
          setWorkflowRunState(createWorkflowRunState());
        };
        if (deferSettingsNavigation(targetWorkAreaId, applySelection)) return;
        applySelection();
      },
      [deferSettingsNavigation, resetAiReviewHistoryState]
    );
  const selectProductWorkArea = useCallback(
      (areaId: ProductWorkAreaId) => {
        const commitSelection = () => commitProductWorkAreaSelection(areaId);
        if (deferSettingsNavigation(areaId, commitSelection)) return;
        commitSelection();
      },
      [commitProductWorkAreaSelection, deferSettingsNavigation]
    );
  const openP2ManifestChainPreflightAudit = useCallback(() => {
      const auditEventId = p2ManifestChainPreflightAuditReference.eventId;
      const matchingRow =
        p2ManifestChainPreflightAuditReference.ledgerRow ??
        (auditEventId ? auditEvidenceReportLedgerRows.find((row) => row.id === auditEventId) : undefined);
      const ledgerQuery = buildAuditEvidenceReportLedgerRowP2ManifestChainPreflightQuery(matchingRow);
      const fallbackQuery = [
        "p2_manifest_chain_preflight",
        auditEventId,
        p2ManifestChainPreflightSummary.sourcePath,
        p2ManifestChainPreflightSummary.state,
        `${p2ManifestChainPreflightSummary.validStageCount}/${p2ManifestChainPreflightSummary.totalStageCount}`,
        p2ManifestChainPreflightSummary.nextAction,
        p2ManifestChainPreflightSummary.blockerIds.join(" ")
      ]
        .filter(Boolean)
        .join(" ");
      const query = ledgerQuery || fallbackQuery;

      selectProductWorkArea("audit");
      updateAuditEvidenceReportQuery(query);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: auditEventId
          ? "P2 manifest chain preflight audit event selected"
          : "P2 manifest chain preflight audit query prepared",
        error: query ? undefined : "Generate the P2 manifest chain preflight before opening its audit event."
      }));
    }, [
      auditEvidenceReportLedgerRows,
      p2ManifestChainPreflightAuditReference.eventId,
      p2ManifestChainPreflightAuditReference.ledgerRow,
      p2ManifestChainPreflightSummary.blockerIds,
      p2ManifestChainPreflightSummary.nextAction,
      p2ManifestChainPreflightSummary.sourcePath,
      p2ManifestChainPreflightSummary.state,
      p2ManifestChainPreflightSummary.totalStageCount,
      p2ManifestChainPreflightSummary.validStageCount,
      selectProductWorkArea,
      updateAuditEvidenceReportQuery
    ]);
  const openP2ManifestChainPreflightReviewAudit = useCallback(() => {
      const auditEventId = p2ManifestChainPreflightReviewAuditEventId;
      const matchingRow =
        p2ManifestChainPreflightReviewAuditEventReference.ledgerRow ??
        (auditEventId ? auditEvidenceReportLedgerRows.find((row) => row.id === auditEventId) : undefined) ??
        latestP2ManifestChainPreflightReviewAuditRow ??
        undefined;
      const ledgerQuery = buildAuditEvidenceReportLedgerRowP2ManifestChainPreflightReviewQuery(matchingRow);
      const savedFileName =
        typeof p2ManifestChainPreflightReviewAuditEvent?.metadata?.fileName === "string"
          ? p2ManifestChainPreflightReviewAuditEvent.metadata.fileName
          : "";
      const savedHash =
        typeof p2ManifestChainPreflightReviewAuditEvent?.metadata?.contentSha256 === "string"
          ? p2ManifestChainPreflightReviewAuditEvent.metadata.contentSha256.slice(0, 12)
          : "";
      const fallbackQuery = [
        "p2_manifest_chain_preflight_review",
        auditEventId,
        savedHash,
        savedFileName,
        p2ManifestChainPreflightSummary.sourcePath,
        p2ManifestChainPreflightSummary.state,
        `${p2ManifestChainPreflightSummary.validStageCount}/${p2ManifestChainPreflightSummary.totalStageCount}`,
        p2ManifestChainPreflightSummary.nextAction,
        p2ManifestChainPreflightSummary.blockerIds.join(" ")
      ]
        .filter(Boolean)
        .join(" ");
      const query = ledgerQuery || fallbackQuery;

      selectProductWorkArea("audit");
      updateAuditEvidenceReportQuery(query);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: auditEventId
          ? "P2 manifest chain preflight review audit event selected"
          : "P2 manifest chain preflight review audit query prepared",
        error: query ? undefined : "Record the P2 manifest chain preflight review before opening its audit event."
      }));
    }, [
      auditEvidenceReportLedgerRows,
      latestP2ManifestChainPreflightReviewAuditRow,
      p2ManifestChainPreflightReviewAuditEvent,
      p2ManifestChainPreflightReviewAuditEventId,
      p2ManifestChainPreflightReviewAuditEventReference,
      p2ManifestChainPreflightSummary.blockerIds,
      p2ManifestChainPreflightSummary.nextAction,
      p2ManifestChainPreflightSummary.sourcePath,
      p2ManifestChainPreflightSummary.state,
      p2ManifestChainPreflightSummary.totalStageCount,
      p2ManifestChainPreflightSummary.validStageCount,
      selectProductWorkArea,
      updateAuditEvidenceReportQuery
    ]);
  const openP0CurrentGapActionLink = useCallback(
      (search: string) => {
        const state = resolveP0CurrentGapActionDeepLinkState(search);
        if (!state) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "P0 next-step link open failed",
            error: "The P0 next-step link is missing a valid workspace, audit query, or action id."
          }));
          return;
        }

        replaceP0CurrentGapActionUrlSearch(search);
        selectProductWorkArea(state.targetWorkspaceId);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P0 next-step workspace opened",
          error: undefined
        }));
      },
      [selectProductWorkArea]
    );
  const openStage1P0DailyUseRow = useCallback(
      (row: Stage1P0DailyUseClosure["rows"][number]) => {
        selectProductWorkArea(row.targetWorkspaceId);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Stage 1 daily row opened · ${row.id} -> ${row.targetWorkspaceId}`,
          error: undefined
        }));
      },
      [selectProductWorkArea]
    );
  const openStage1P0DailyUseRefreshOutcomeEntry = useCallback(
      (entry: Stage1P0DailyUseRefreshOutcome["entries"][number]) => {
        selectProductWorkArea(entry.targetWorkspaceId);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Stage 1 refresh receipt entry opened · ${entry.id} -> ${entry.targetWorkspaceId}`,
          error: undefined
        }));
      },
      [selectProductWorkArea]
    );
  const openStage1P0DailyUseRefreshOutcomeNextStep = useCallback(() => {
      if (!stage1P0DailyUseRefreshOutcome) {
        return;
      }

      selectProductWorkArea(stage1P0DailyUseRefreshOutcome.targetWorkspaceId);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: `Stage 1 refresh receipt next step opened · ${stage1P0DailyUseRefreshOutcome.actionLabel} -> ${stage1P0DailyUseRefreshOutcome.targetWorkspaceId}`,
        error: undefined
      }));
    }, [selectProductWorkArea, stage1P0DailyUseRefreshOutcome]);
  const focusLatestP0ReadinessReport = useCallback(() => {
      if (!auditEvidenceReportLedgerSummary.latestAuditAidReportQuery) {
        selectProductWorkArea("audit");
        return;
      }
      setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidReportQuery);
      setAuditEvidenceReportOffset(0);
      replaceAuditEvidenceReportQueryUrlParam(auditEvidenceReportLedgerSummary.latestAuditAidReportQuery);
      setActiveWorkAreaId("audit");
      setActiveLoopStepId("backtest");
      setActiveWorkflowStageId("execution");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Latest P0 readiness report selected",
        error: undefined
      }));
    }, [auditEvidenceReportLedgerSummary.latestAuditAidReportQuery, selectProductWorkArea]);
  const focusLatestP0PreparationEvidence = useCallback(() => {
      if (!auditEvidenceReportLedgerSummary.latestAuditAidPreparationEvidenceRunId) {
        selectProductWorkArea("audit");
        return;
      }
      setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidPreparationEvidenceRunId);
      setAuditEvidenceReportOffset(0);
      replaceAuditEvidenceReportQueryUrlParam(auditEvidenceReportLedgerSummary.latestAuditAidPreparationEvidenceRunId);
      setActiveWorkAreaId("audit");
      setActiveLoopStepId("backtest");
      setActiveWorkflowStageId("execution");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Latest P0 data preparation evidence selected",
        error: undefined
      }));
    }, [auditEvidenceReportLedgerSummary.latestAuditAidPreparationEvidenceRunId, selectProductWorkArea]);
  const focusLatestP0Progress = useCallback(() => {
      if (!auditEvidenceReportLedgerSummary.latestAuditAidProgressQuery) {
        selectProductWorkArea("audit");
        return;
      }
      setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidProgressQuery);
      setAuditEvidenceReportOffset(0);
      replaceAuditEvidenceReportQueryUrlParam(auditEvidenceReportLedgerSummary.latestAuditAidProgressQuery);
      setActiveWorkAreaId("audit");
      setActiveLoopStepId("backtest");
      setActiveWorkflowStageId("execution");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Latest P0 progress selected",
        error: undefined
      }));
    }, [auditEvidenceReportLedgerSummary.latestAuditAidProgressQuery, selectProductWorkArea]);
  const focusLatestP0Preflight = useCallback(() => {
      if (!auditEvidenceReportLedgerSummary.latestAuditAidPreflightQuery) {
        selectProductWorkArea("audit");
        return;
      }
      setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidPreflightQuery);
      setAuditEvidenceReportOffset(0);
      replaceAuditEvidenceReportQueryUrlParam(auditEvidenceReportLedgerSummary.latestAuditAidPreflightQuery);
      setActiveWorkAreaId("audit");
      setActiveLoopStepId("backtest");
      setActiveWorkflowStageId("execution");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Latest P0 preflight selected",
        error: undefined
      }));
    }, [auditEvidenceReportLedgerSummary.latestAuditAidPreflightQuery, selectProductWorkArea]);
  const focusLatestP0Completion = useCallback(() => {
      if (!auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery) {
        selectProductWorkArea("audit");
        return;
      }
      setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery);
      setAuditEvidenceReportOffset(0);
      replaceAuditEvidenceReportQueryUrlParam(auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery);
      setActiveWorkAreaId("audit");
      setActiveLoopStepId("backtest");
      setActiveWorkflowStageId("execution");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Latest P0 completion selected",
        error: undefined
      }));
    }, [auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery, selectProductWorkArea]);
  const openLatestP0CompletionGap = useCallback(() => {
      if (!auditEvidenceReportLedgerSummary.latestAuditAidCompletionCurrentCriterionTargetWorkspaceId) {
        focusLatestP0Completion();
        return;
      }
      if (auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery) {
        setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery);
        setAuditEvidenceReportOffset(0);
        replaceAuditEvidenceReportQueryUrlParam(auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery);
      }
      selectProductWorkArea(auditEvidenceReportLedgerSummary.latestAuditAidCompletionCurrentCriterionTargetWorkspaceId);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Latest P0 completion gap selected",
        error: undefined
      }));
    }, [
      auditEvidenceReportLedgerSummary.latestAuditAidCompletionCurrentCriterionTargetWorkspaceId,
      auditEvidenceReportLedgerSummary.latestAuditAidCompletionQuery,
      focusLatestP0Completion,
      selectProductWorkArea
    ]);
  const focusLatestP0BacklogReadiness = useCallback(() => {
      if (!auditEvidenceReportLedgerSummary.latestAuditAidBacklogReadinessQuery) {
        selectProductWorkArea("audit");
        return;
      }
      setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidBacklogReadinessQuery);
      setAuditEvidenceReportOffset(0);
      replaceAuditEvidenceReportQueryUrlParam(auditEvidenceReportLedgerSummary.latestAuditAidBacklogReadinessQuery);
      setActiveWorkAreaId("audit");
      setActiveLoopStepId("backtest");
      setActiveWorkflowStageId("execution");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Latest P0 backlog readiness selected",
        error: undefined
      }));
    }, [auditEvidenceReportLedgerSummary.latestAuditAidBacklogReadinessQuery, selectProductWorkArea]);
  const focusLatestP0CurrentGapReadiness = useCallback(() => {
      if (!auditEvidenceReportLedgerSummary.latestAuditAidCurrentGapReadinessQuery) {
        selectProductWorkArea("audit");
        return;
      }
      setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidCurrentGapReadinessQuery);
      setAuditEvidenceReportOffset(0);
      replaceAuditEvidenceReportQueryUrlParam(auditEvidenceReportLedgerSummary.latestAuditAidCurrentGapReadinessQuery);
      setActiveWorkAreaId("audit");
      setActiveLoopStepId("backtest");
      setActiveWorkflowStageId("execution");
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Latest P0 current gap readiness selected",
        error: undefined
      }));
    }, [auditEvidenceReportLedgerSummary.latestAuditAidCurrentGapReadinessQuery, selectProductWorkArea]);
  const openP0ActionOutcomeEvidence = useCallback(
      (outcome: P0PlatformActionOutcome) => {
        if (!outcome.evidenceId) {
          selectProductWorkArea(outcome.targetWorkspaceId);
          return;
        }

        const evidenceId = outcome.evidenceId;

        if (outcome.state === "paper_execution") {
          setActiveWorkAreaId("execution");
          setActiveLoopStepId("paper");
          setActiveWorkflowStageId("execution");
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Paper execution evidence selected",
            error: undefined
          }));
          return;
        }

        if (outcome.state === "audit_run" || outcome.state === "live_ready") {
          setResearchRunExportBrowserQuery(evidenceId);
          setResearchRunImportDiffQuery(evidenceId);
          setResearchRunImportAuditQuery(evidenceId);
          void (async () => {
            const historyRun = runHistory.find((run) => run.runId === evidenceId);
            if (historyRun) {
              await replayRun(historyRun);
              return;
            }

            const detail = await loadResearchRunDetail(quantCoreBaseUrl, evidenceId);
            if (detail.run) {
              await replayRun(detail.run);
              return;
            }

            setActiveWorkAreaId("audit");
            setActiveLoopStepId("backtest");
            setActiveWorkflowStageId("execution");
            setWorkspaceState((current) => ({
              ...current,
              statusLabel: "P0 evidence replay failed",
              error: detail.error ?? `P0 evidence run ${evidenceId} was not found`
            }));
          })();
          return;
        }

        selectProductWorkArea(outcome.targetWorkspaceId);
      },
      [quantCoreBaseUrl, replayRun, runHistory, selectProductWorkArea]
    );
  const inspectRefreshEvidenceRun = useCallback(
      (runId: string) => {
        setWatchlistCacheRefreshRunSelection(runId);
        selectProductWorkArea("market");
      },
      [selectProductWorkArea, setWatchlistCacheRefreshRunSelection]
    );
  const openAutomaticTradingConsole = () => {
      selectProductWorkArea("dynamic-trading");
    };
  return {
    preLiveReadinessChecklist, refreshWorkspace, selectInstrument, selectTimeframe, selectProductWorkArea, openP2ManifestChainPreflightAudit,
    openP2ManifestChainPreflightReviewAudit, openP0CurrentGapActionLink, openStage1P0DailyUseRow, openStage1P0DailyUseRefreshOutcomeEntry, openStage1P0DailyUseRefreshOutcomeNextStep, focusLatestP0ReadinessReport,
    focusLatestP0PreparationEvidence, focusLatestP0Progress, focusLatestP0Preflight, focusLatestP0Completion, openLatestP0CompletionGap, focusLatestP0BacklogReadiness,
    focusLatestP0CurrentGapReadiness, openP0ActionOutcomeEvidence, inspectRefreshEvidenceRun, openAutomaticTradingConsole
  };
}
