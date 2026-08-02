import { type AiReviewProviderStatus } from "../../../lib/ai-review-stage3";
import { loadAiReviewProviders, loadMarketSearch, loadResearchRunDetail, loadResearchRunProductionStrategyHandoff } from "../../../lib/terminal-api";
import { findLatestResearchRunForContext, replaceAiReviewRunIdInUrl, resolveMarketSearchMarket, workspaceFromResearchRunAudit } from "../../../lib/terminal-workbench";
import { resolveSystemColorScheme } from "../../../lib/theme";
import { AUTO_TRADING_STATUS_REFRESH_INTERVAL_MS } from "../../dynamic-trading/ExecutionAutoPaperTradingSection";
import { strategyLibraryItemMatchesWorkspace } from "../../strategy/strategy-workspace";
import { initialProductionStrategyHandoffState, quantCoreBaseUrl, VISIBLE_PAGE_REFRESH_INTERVAL_MS } from "../initial-state";
import { useEffect, useLayoutEffect } from "react";
import type { AppControllerBindings } from "./bindings";

type Dependencies = Pick<AppControllerBindings, "activeWorkAreaId" | "aiReviewHistoryPagination" | "aiReviewRunRecords" | "aiReviewRunRestoreAbortControllerRef" | "aiReviewStage3PrimaryCandidateAvailable" | "aiReviewStage3PrimaryReference" | "auditEvidenceReportCopyResetTimerRef" | "auditEvidenceSummaryCopyResetTimerRef" | "colorScheme" | "colorSchemePreference" | "currentResearchRunId" | "error" | "hasUnsavedSettingsConfiguration" | "importAuditCopyResetTimerRef" | "initialAiReviewRunIdRef" | "initialImportAuditEvidenceDeepLinkRef" | "initialPaperExecutionDeepLinkRef" | "isChartExpanded" | "isGeneratingResearchNoteDraft" | "isLiveTradingGateDialogOpen" | "isResearchPipelineConfirmationOpen" | "isRunning" | "isSavingStrategy" | "isSearchOpen" | "isSymbolSearching" | "liveTradingGateDialogRef" | "loadImportAuditEvidenceDeepLink" | "loadPaperExecutionDeepLink" | "locale" | "marketDataRefreshOverride" | "marketDataRefreshOverrideAuditStatus" | "marketDiscoveryMarket" | "marketDiscoveryRequestMarketRef" | "marketDiscoveryResult" | "marketDraft" | "marketInformationMarket" | "marketInformationName" | "marketInformationRequestContextRef" | "marketInformationResult" | "marketInformationSymbol" | "operatorRunbookCopyResetTimerRef" | "paperExecutionRecord" | "pendingMarketAiSelectionResearchOrigin" | "pendingSettingsWorkAreaId" | "pendingStrategyGovernanceAction" | "portfolioProductionRiskRequestIdRef" | "preLiveRunbookCopyResetTimerRef" | "productionStrategyHandoffState" | "refreshAiReviewRunHistory" | "refreshAuditSigningKeys" | "refreshChart" | "refreshGoldenPathStatus" | "refreshHandoffNotes" | "refreshMarketAiSelectionStatistics" | "refreshMarketCalendarStatus" | "refreshMarketInformation" | "refreshPortfolioProductionRisk" | "refreshResearchNote" | "refreshSettingsStatus" | "refreshStrategyLibrary" | "refreshStrategyProductionBinding" | "refreshVisiblePageData" | "refreshWorkspace" | "researchCompletionNotice" | "researchContextLinkCopyResetTimerRef" | "researchContextReadinessReportCopyResetTimerRef" | "researchNoteDraftGenerationAbortControllerRef" | "researchNoteDraftGenerationRequestIdRef" | "researchNoteExternalDataApproved" | "researchNoteGenerationError" | "researchNoteGenerationStatus" | "researchNoteProviderId" | "researchNoteProviders" | "researchPipelineConfirmationCancelButtonRef" | "researchPipelineConfirmationDialogRef" | "researchRunContextBinding" | "runGoldenPathActionById" | "runHistory" | "searchMarketDiscovery" | "searchSuggestions" | "setActiveWorkAreaId" | "setAiReviewHistoryPagination" | "setAiReviewRunRecords" | "setColorSchemePreference" | "setHasUnsavedSettingsConfiguration" | "setIsChartExpanded" | "setIsGeneratingResearchNoteDraft" | "setIsLiveTradingGateDialogOpen" | "setIsResearchPipelineConfirmationOpen" | "setIsRunning" | "setIsSavingStrategy" | "setIsSearchOpen" | "setIsSymbolSearching" | "setLocale" | "setMarketDataRefreshOverride" | "setMarketDataRefreshOverrideAuditStatus" | "setMarketDiscoveryResult" | "setMarketDraft" | "setMarketInformationMarket" | "setMarketInformationResult" | "setPaperExecutionRecord" | "setPendingMarketAiSelectionResearchOrigin" | "setPendingSettingsWorkAreaId" | "setPendingStrategyGovernanceAction" | "setProductionStrategyHandoffState" | "setResearchCompletionNotice" | "setResearchNoteExternalDataApproved" | "setResearchNoteGenerationError" | "setResearchNoteGenerationStatus" | "setResearchNoteProviderId" | "setResearchNoteProviders" | "setRunHistoryState" | "setSearchSuggestions" | "setStrategyProductionBindingState" | "setSymbolDraft" | "setSystemColorScheme" | "setTextScale" | "setWorkspaceState" | "settingsUnsavedContinueButtonRef" | "settingsUnsavedDialogRef" | "source" | "statusLabel" | "strategyProductionBindingState" | "symbolDraft" | "symbolSearchRequestIdRef" | "systemColorScheme" | "textScale" | "visibleStrategyLibrary" | "workspace">;
type Result = void;

export function useDomainRuntimeEffects(controller: Dependencies): Result {
  const {
    activeWorkAreaId, aiReviewHistoryPagination, aiReviewRunRecords, aiReviewRunRestoreAbortControllerRef, aiReviewStage3PrimaryCandidateAvailable, aiReviewStage3PrimaryReference,
    auditEvidenceReportCopyResetTimerRef, auditEvidenceSummaryCopyResetTimerRef, colorScheme, colorSchemePreference, currentResearchRunId, error,
    hasUnsavedSettingsConfiguration, importAuditCopyResetTimerRef, initialAiReviewRunIdRef, initialImportAuditEvidenceDeepLinkRef, initialPaperExecutionDeepLinkRef, isChartExpanded,
    isGeneratingResearchNoteDraft, isLiveTradingGateDialogOpen, isResearchPipelineConfirmationOpen, isRunning, isSavingStrategy, isSearchOpen,
    isSymbolSearching, liveTradingGateDialogRef, loadImportAuditEvidenceDeepLink, loadPaperExecutionDeepLink, locale, marketDataRefreshOverride,
    marketDataRefreshOverrideAuditStatus, marketDiscoveryMarket, marketDiscoveryRequestMarketRef, marketDiscoveryResult, marketDraft, marketInformationMarket,
    marketInformationName, marketInformationRequestContextRef, marketInformationResult, marketInformationSymbol, operatorRunbookCopyResetTimerRef, paperExecutionRecord,
    pendingMarketAiSelectionResearchOrigin, pendingSettingsWorkAreaId, pendingStrategyGovernanceAction, portfolioProductionRiskRequestIdRef, preLiveRunbookCopyResetTimerRef, productionStrategyHandoffState,
    refreshAiReviewRunHistory, refreshAuditSigningKeys, refreshChart, refreshGoldenPathStatus, refreshHandoffNotes, refreshMarketAiSelectionStatistics,
    refreshMarketCalendarStatus, refreshMarketInformation, refreshPortfolioProductionRisk, refreshResearchNote, refreshSettingsStatus, refreshStrategyLibrary,
    refreshStrategyProductionBinding, refreshVisiblePageData, refreshWorkspace, researchCompletionNotice, researchContextLinkCopyResetTimerRef, researchContextReadinessReportCopyResetTimerRef,
    researchNoteDraftGenerationAbortControllerRef, researchNoteDraftGenerationRequestIdRef, researchNoteExternalDataApproved, researchNoteGenerationError, researchNoteGenerationStatus, researchNoteProviderId,
    researchNoteProviders, researchPipelineConfirmationCancelButtonRef, researchPipelineConfirmationDialogRef, researchRunContextBinding, runGoldenPathActionById, runHistory,
    searchMarketDiscovery, searchSuggestions, setActiveWorkAreaId, setAiReviewHistoryPagination, setAiReviewRunRecords, setColorSchemePreference,
    setHasUnsavedSettingsConfiguration, setIsChartExpanded, setIsGeneratingResearchNoteDraft, setIsLiveTradingGateDialogOpen, setIsResearchPipelineConfirmationOpen, setIsRunning,
    setIsSavingStrategy, setIsSearchOpen, setIsSymbolSearching, setLocale, setMarketDataRefreshOverride, setMarketDataRefreshOverrideAuditStatus,
    setMarketDiscoveryResult, setMarketDraft, setMarketInformationMarket, setMarketInformationResult, setPaperExecutionRecord, setPendingMarketAiSelectionResearchOrigin,
    setPendingSettingsWorkAreaId, setPendingStrategyGovernanceAction, setProductionStrategyHandoffState, setResearchCompletionNotice, setResearchNoteExternalDataApproved, setResearchNoteGenerationError,
    setResearchNoteGenerationStatus, setResearchNoteProviderId, setResearchNoteProviders, setRunHistoryState, setSearchSuggestions, setStrategyProductionBindingState,
    setSymbolDraft, setSystemColorScheme, setTextScale, setWorkspaceState, settingsUnsavedContinueButtonRef, settingsUnsavedDialogRef,
    source, statusLabel, strategyProductionBindingState, symbolDraft, symbolSearchRequestIdRef, systemColorScheme,
    textScale, visibleStrategyLibrary, workspace
  } = controller;
  useEffect(() => {
      return () => {
        if (importAuditCopyResetTimerRef.current !== null) {
          window.clearTimeout(importAuditCopyResetTimerRef.current);
        }
        if (auditEvidenceSummaryCopyResetTimerRef.current !== null) {
          window.clearTimeout(auditEvidenceSummaryCopyResetTimerRef.current);
        }
        if (auditEvidenceReportCopyResetTimerRef.current !== null) {
          window.clearTimeout(auditEvidenceReportCopyResetTimerRef.current);
        }
        if (researchContextLinkCopyResetTimerRef.current !== null) {
          window.clearTimeout(researchContextLinkCopyResetTimerRef.current);
        }
        if (researchContextReadinessReportCopyResetTimerRef.current !== null) {
          window.clearTimeout(researchContextReadinessReportCopyResetTimerRef.current);
        }
        if (operatorRunbookCopyResetTimerRef.current !== null) {
          window.clearTimeout(operatorRunbookCopyResetTimerRef.current);
        }
        if (preLiveRunbookCopyResetTimerRef.current !== null) {
          window.clearTimeout(preLiveRunbookCopyResetTimerRef.current);
        }
      };
    }, []);
  useEffect(() => {
      if (activeWorkAreaId !== "audit") {
        return;
      }
      const runId = workspace.researchRun?.runId;
      if (!runId) {
        setAiReviewRunRecords([]);
        setAiReviewHistoryPagination(null);
        return;
      }
      void refreshAiReviewRunHistory(runId);
    }, [activeWorkAreaId, refreshAiReviewRunHistory, workspace.researchRun?.runId]);
  useEffect(() => {
      void refreshMarketCalendarStatus();
    }, [refreshMarketCalendarStatus]);
  useEffect(() => {
      if (activeWorkAreaId === "market") {
        void refreshMarketAiSelectionStatistics();
      }
    }, [activeWorkAreaId, refreshMarketAiSelectionStatistics]);
  useEffect(() => {
      if (
        activeWorkAreaId !== "market"
        || marketDiscoveryResult?.market === marketDiscoveryMarket
        || marketDiscoveryRequestMarketRef.current === marketDiscoveryMarket
      ) {
        return;
      }
      void searchMarketDiscovery({
        market: marketDiscoveryMarket,
        sort: "changePct",
        direction: "desc",
        limit: 20,
      });
    }, [
      activeWorkAreaId,
      marketDiscoveryMarket,
      marketDiscoveryResult,
      searchMarketDiscovery,
    ]);
  useEffect(() => {
      const contextKey = `${marketInformationMarket}:${marketInformationSymbol}:${marketInformationName}`;
      if (
        activeWorkAreaId !== "market-information"
        || (
          marketInformationResult?.market === marketInformationMarket
          && marketInformationResult.symbol === marketInformationSymbol
        )
        || marketInformationRequestContextRef.current === contextKey
      ) {
        return;
      }
      void refreshMarketInformation();
    }, [
      activeWorkAreaId,
      marketInformationMarket,
      marketInformationName,
      marketInformationResult,
      marketInformationSymbol,
      refreshMarketInformation,
    ]);
  useEffect(() => {
      if (activeWorkAreaId !== "audit") {
        return;
      }
      void refreshAuditSigningKeys();
    }, [activeWorkAreaId, refreshAuditSigningKeys]);
  useEffect(() => {
      let refreshInFlight = false;
      const refreshWhenVisible = () => {
        if (document.visibilityState !== "visible" || refreshInFlight) {
          return;
        }
        refreshInFlight = true;
        void refreshVisiblePageData().finally(() => {
          refreshInFlight = false;
        });
      };
      const intervalId = window.setInterval(refreshWhenVisible, VISIBLE_PAGE_REFRESH_INTERVAL_MS);
      document.addEventListener("visibilitychange", refreshWhenVisible);
      window.addEventListener("focus", refreshWhenVisible);
      return () => {
        window.clearInterval(intervalId);
        document.removeEventListener("visibilitychange", refreshWhenVisible);
        window.removeEventListener("focus", refreshWhenVisible);
      };
    }, [refreshVisiblePageData]);
  useEffect(() => {
      setMarketDataRefreshOverride((current) =>
        current?.market === workspace.selectedInstrument.market ? current : null
      );
      setMarketDataRefreshOverrideAuditStatus({ state: "idle" });
    }, [workspace.selectedInstrument.market]);
  useEffect(() => {
      const deepLink = initialPaperExecutionDeepLinkRef.current;
      if (!deepLink) {
        return;
      }
      initialPaperExecutionDeepLinkRef.current = null;
      void loadPaperExecutionDeepLink(deepLink);
    }, [loadPaperExecutionDeepLink]);
  useEffect(() => {
      const deepLink = initialImportAuditEvidenceDeepLinkRef.current;
      if (!deepLink || activeWorkAreaId !== "audit") {
        return;
      }
      initialImportAuditEvidenceDeepLinkRef.current = null;
      void loadImportAuditEvidenceDeepLink(deepLink);
    }, [activeWorkAreaId, loadImportAuditEvidenceDeepLink]);
  useEffect(() => {
      void refreshWorkspace();
      return () => aiReviewRunRestoreAbortControllerRef.current?.abort();
    }, [refreshWorkspace]);
  useEffect(() => {
      if (activeWorkAreaId !== "research" && activeWorkAreaId !== "backtest" && activeWorkAreaId !== "ai-review") {
        return;
      }
      const latestRun = findLatestResearchRunForContext(runHistory, {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe
      });
      if (!latestRun) {
        return;
      }
      const workspaceNeedsDetailBinding =
        activeWorkAreaId !== "research"
        && (
          workspace.researchRun?.runId !== latestRun.runId
          || !workspace.researchRun.dataSnapshot?.snapshotHash
        );
      if (latestRun.dataSnapshot?.snapshotHash) {
        if (workspaceNeedsDetailBinding) {
          setWorkspaceState((current) => ({
            ...current,
            workspace: workspaceFromResearchRunAudit(current.workspace, latestRun),
            statusLabel: activeWorkAreaId === "backtest"
              ? "已载入当前标的最近的已审计回测运行"
              : "已载入当前标的最近的已审计研究运行",
            error: undefined
          }));
        }
        return;
      }
      let cancelled = false;
      void loadResearchRunDetail(quantCoreBaseUrl, latestRun.runId).then((detail) => {
        if (cancelled || detail.source !== "core" || detail.run?.runId !== latestRun.runId) {
          return;
        }
        setRunHistoryState((current) => ({
          ...current,
          runs: current.runs.map((run) => run.runId === detail.run!.runId ? detail.run! : run)
        }));
        if (activeWorkAreaId !== "research") {
          setWorkspaceState((current) => ({
            ...current,
            workspace: workspaceFromResearchRunAudit(current.workspace, detail.run!),
            statusLabel: activeWorkAreaId === "backtest"
              ? "已载入当前标的最近的已审计回测运行"
              : "已载入当前标的最近的已审计研究运行",
            error: undefined
          }));
        }
      });
      return () => {
        cancelled = true;
      };
    }, [
      activeWorkAreaId,
      runHistory,
      workspace.researchRun?.dataSnapshot?.snapshotHash,
      workspace.researchRun?.runId,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]);
  useEffect(() => {
      if (
        (activeWorkAreaId !== "ai-review" && activeWorkAreaId !== "portfolio")
        || researchRunContextBinding.canUseRun
      ) {
        return;
      }
      const latestRun = findLatestResearchRunForContext(runHistory, {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe
      });
      if (!latestRun) {
        return;
      }
      setWorkspaceState((current) => ({
        ...current,
        workspace: workspaceFromResearchRunAudit(current.workspace, latestRun),
        statusLabel: "已载入当前标的最近的已审计研究运行",
        error: undefined
      }));
    }, [
      activeWorkAreaId,
      researchRunContextBinding.canUseRun,
      runHistory,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]);
  useEffect(() => {
      if (activeWorkAreaId !== "ai-review" && activeWorkAreaId !== "execution") {
        initialAiReviewRunIdRef.current = null;
        aiReviewRunRestoreAbortControllerRef.current?.abort();
      }
    }, [activeWorkAreaId]);
  useEffect(() => {
      void refreshChart();
    }, [refreshChart]);
  useEffect(() => {
      void refreshStrategyLibrary();
    }, [refreshStrategyLibrary]);
  useEffect(() => {
      void refreshStrategyProductionBinding();
    }, [refreshStrategyProductionBinding]);
  useEffect(() => {
      if (activeWorkAreaId !== "portfolio") return;
      void refreshPortfolioProductionRisk(true);
      const intervalId = window.setInterval(
        () => void refreshPortfolioProductionRisk(),
        AUTO_TRADING_STATUS_REFRESH_INTERVAL_MS
      );
      return () => {
        portfolioProductionRiskRequestIdRef.current += 1;
        window.clearInterval(intervalId);
      };
    }, [activeWorkAreaId, refreshPortfolioProductionRisk]);
  useEffect(() => {
      const handoffRunId = activeWorkAreaId === "backtest"
        ? currentResearchRunId
        : activeWorkAreaId === "ai-review"
          && aiReviewStage3PrimaryCandidateAvailable
          && aiReviewStage3PrimaryReference
          && aiReviewStage3PrimaryReference.candidateRevision === aiReviewStage3PrimaryReference.strategyRevision
          ? aiReviewStage3PrimaryReference.sourceRunId
          : null;
      if (!handoffRunId) {
        setProductionStrategyHandoffState(initialProductionStrategyHandoffState);
        return;
      }
      let cancelled = false;
      setProductionStrategyHandoffState((current) =>
        current.handoff?.runId === handoffRunId
          ? current
          : initialProductionStrategyHandoffState
      );
      void loadResearchRunProductionStrategyHandoff(
        quantCoreBaseUrl,
        handoffRunId
      ).then((result) => {
        if (!cancelled) {
          setProductionStrategyHandoffState(result);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [
      activeWorkAreaId,
      aiReviewStage3PrimaryCandidateAvailable,
      aiReviewStage3PrimaryReference?.candidateRevision,
      aiReviewStage3PrimaryReference?.sourceRunId,
      aiReviewStage3PrimaryReference?.strategyRevision,
      currentResearchRunId,
      strategyProductionBindingState.binding?.auditRunId,
      strategyProductionBindingState.binding?.bindingId
    ]);
  useEffect(() => {
      void refreshResearchNote();
    }, [refreshResearchNote]);
  useEffect(() => {
      researchNoteDraftGenerationAbortControllerRef.current?.abort();
      researchNoteDraftGenerationAbortControllerRef.current = null;
      researchNoteDraftGenerationRequestIdRef.current += 1;
      setIsGeneratingResearchNoteDraft(false);
      setResearchNoteExternalDataApproved(false);
      setResearchNoteGenerationError(null);
      setResearchNoteGenerationStatus(null);
      if (activeWorkAreaId !== "research" && activeWorkAreaId !== "strategy") {
        return;
      }
      const controller = new AbortController();
      void loadAiReviewProviders(quantCoreBaseUrl, controller.signal).then((result) => {
        if (controller.signal.aborted) {
          return;
        }
        const localProvider: AiReviewProviderStatus = {
          providerId: "local",
          configured: true,
          model: null,
          sanitizedBaseUrl: null
        };
        const providers = result.source === "core" && result.providers.length
          ? result.providers
          : [localProvider];
        setResearchNoteProviders(providers);
        setResearchNoteProviderId(
          providers.find((provider) => provider.providerId !== "local" && provider.configured)?.providerId
            ?? "local"
        );
        if (result.source !== "core") {
          setResearchNoteGenerationStatus("AI Provider 状态暂不可用，可继续生成本地草稿。");
        }
      });
      return () => {
        controller.abort();
        researchNoteDraftGenerationAbortControllerRef.current?.abort();
      };
    }, [
      activeWorkAreaId,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]);
  useEffect(() => {
      void refreshHandoffNotes();
    }, [refreshHandoffNotes]);
  useEffect(() => {
      void refreshSettingsStatus();
    }, [refreshSettingsStatus]);
  useEffect(() => {
      void refreshGoldenPathStatus();
    }, [paperExecutionRecord?.executionId, refreshGoldenPathStatus, workspace.researchRun?.runId]);
  useEffect(() => {
      document.documentElement.lang = locale;
      window.localStorage.setItem("aiqt.locale", locale);
    }, [locale]);
  useEffect(() => {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const syncSystemColorScheme = () => {
        setSystemColorScheme(resolveSystemColorScheme(media.matches));
        setColorSchemePreference(null);
      };
      syncSystemColorScheme();
      media.addEventListener("change", syncSystemColorScheme);
      return () => media.removeEventListener("change", syncSystemColorScheme);
    }, []);
  useEffect(() => {
      document.documentElement.dataset.theme = colorScheme;
      document.documentElement.style.colorScheme = colorScheme;
    }, [colorScheme]);
  useEffect(() => {
      if (
        pendingMarketAiSelectionResearchOrigin
        && (
          pendingMarketAiSelectionResearchOrigin.market !== workspace.selectedInstrument.market
          || pendingMarketAiSelectionResearchOrigin.symbol !== workspace.selectedInstrument.symbol
          || workspace.selectedTimeframe !== "1d"
        )
      ) {
        setPendingMarketAiSelectionResearchOrigin(null);
      }
    }, [
      pendingMarketAiSelectionResearchOrigin,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe,
    ]);
  useLayoutEffect(() => {
      document.documentElement.style.setProperty("--aiqt-text-scale", String(textScale));
      window.localStorage.setItem("aiqt.text-scale", String(textScale));
    }, [textScale]);
  useEffect(() => {
      const currentUrl = new URL(window.location.href);
      const url = new URL(replaceAiReviewRunIdInUrl(
        currentUrl.toString(),
        activeWorkAreaId,
        activeWorkAreaId === "ai-review"
          ? currentResearchRunId ?? initialAiReviewRunIdRef.current
          : currentResearchRunId
      ));
      const shouldSyncResearchContext = activeWorkAreaId === "market"
        || activeWorkAreaId === "market-information"
        || activeWorkAreaId === "research";
      const selectionOrigin =
        activeWorkAreaId === "research"
        && workspace.selectedTimeframe === "1d"
        && pendingMarketAiSelectionResearchOrigin?.market === workspace.selectedInstrument.market
        && pendingMarketAiSelectionResearchOrigin.symbol === workspace.selectedInstrument.symbol
          ? pendingMarketAiSelectionResearchOrigin
          : null;
      const runIdChanged = url.searchParams.toString() !== currentUrl.searchParams.toString();
      const contextChanged =
        shouldSyncResearchContext &&
        (url.searchParams.get("market") !== workspace.selectedInstrument.market ||
          url.searchParams.get("symbol") !== workspace.selectedInstrument.symbol ||
          url.searchParams.get("timeframe") !== workspace.selectedTimeframe);
      const selectionOriginChanged =
        url.searchParams.get("selectionId") !== (selectionOrigin?.selectionId ?? null)
        || url.searchParams.get("candidateEvidenceId") !== (
          selectionOrigin?.candidateEvidenceId ?? null
        );
      if (url.searchParams.get("workspace") === activeWorkAreaId
        && !url.searchParams.has("workflow")
        && !contextChanged
        && !runIdChanged
        && !selectionOriginChanged) {
        return;
      }
      url.searchParams.set("workspace", activeWorkAreaId);
      url.searchParams.delete("workflow");
      if (shouldSyncResearchContext) {
        url.searchParams.set("market", workspace.selectedInstrument.market);
        url.searchParams.set("symbol", workspace.selectedInstrument.symbol);
        url.searchParams.set("timeframe", workspace.selectedTimeframe);
      }
      if (selectionOrigin) {
        url.searchParams.set("selectionId", selectionOrigin.selectionId);
        url.searchParams.set("candidateEvidenceId", selectionOrigin.candidateEvidenceId);
      } else {
        url.searchParams.delete("selectionId");
        url.searchParams.delete("candidateEvidenceId");
      }
      window.history.replaceState({}, "", `${url.pathname}?${url.searchParams.toString()}${url.hash}`);
    }, [
      activeWorkAreaId,
      currentResearchRunId,
      pendingMarketAiSelectionResearchOrigin,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]);
  useEffect(() => {
      setMarketDraft(workspace.selectedInstrument.market);
      setSymbolDraft(workspace.selectedInstrument.symbol);
      setSearchSuggestions([]);
      setIsSearchOpen(false);
    }, [workspace.selectedInstrument.market, workspace.selectedInstrument.symbol]);
  useEffect(() => {
      const query = symbolDraft.trim();
      const requestId = symbolSearchRequestIdRef.current + 1;
      symbolSearchRequestIdRef.current = requestId;

      if (!isSearchOpen) {
        setIsSymbolSearching(false);
        return;
      }

      if (!query) {
        setSearchSuggestions([]);
        setIsSearchOpen(false);
        setIsSymbolSearching(false);
        return;
      }

      setIsSymbolSearching(true);
      setIsSearchOpen(true);
      const timeoutId = window.setTimeout(async () => {
        const searchMarket = resolveMarketSearchMarket(marketDraft, query);
        const result = await loadMarketSearch(quantCoreBaseUrl, { market: searchMarket, query, limit: 8, timeframe: workspace.selectedTimeframe });
        if (symbolSearchRequestIdRef.current === requestId) {
          setSearchSuggestions(result.results);
          setIsSearchOpen(true);
          setIsSymbolSearching(false);
        }
      }, 220);

      return () => window.clearTimeout(timeoutId);
    }, [isSearchOpen, marketDraft, symbolDraft, workspace.selectedTimeframe]);
  useEffect(() => {
      if (!isChartExpanded) {
        return;
      }
      const closeOnEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsChartExpanded(false);
        }
      };
      window.addEventListener("keydown", closeOnEscape);
      return () => window.removeEventListener("keydown", closeOnEscape);
    }, [isChartExpanded]);
  useEffect(() => {
      if (isResearchPipelineConfirmationOpen && !researchPipelineConfirmationDialogRef.current?.open) {
        researchPipelineConfirmationDialogRef.current?.showModal();
        researchPipelineConfirmationCancelButtonRef.current?.focus();
      }
    }, [isResearchPipelineConfirmationOpen]);
  useEffect(() => {
      if (isLiveTradingGateDialogOpen && !liveTradingGateDialogRef.current?.open) {
        liveTradingGateDialogRef.current?.showModal();
        liveTradingGateDialogRef.current
          ?.querySelector<HTMLInputElement>('input[placeholder="实名操作人"]')
          ?.focus();
      }
    }, [isLiveTradingGateDialogOpen]);
  useEffect(() => {
      if (pendingSettingsWorkAreaId && !settingsUnsavedDialogRef.current?.open) {
        settingsUnsavedDialogRef.current?.showModal();
        settingsUnsavedContinueButtonRef.current?.focus();
      }
    }, [pendingSettingsWorkAreaId]);
  useEffect(() => {
      if (!hasUnsavedSettingsConfiguration) return;
      const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = "";
      };
      window.addEventListener("beforeunload", warnBeforeLeaving);
      return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
    }, [hasUnsavedSettingsConfiguration]);
  useEffect(() => {
      if (!researchCompletionNotice) {
        return;
      }
      const timeoutId = window.setTimeout(() => {
        setResearchCompletionNotice((current) =>
          current?.runId === researchCompletionNotice.runId ? null : current
        );
      }, 6000);
      return () => window.clearTimeout(timeoutId);
    }, [researchCompletionNotice]);
  useEffect(() => {
      if (!pendingStrategyGovernanceAction) {
        return;
      }
      if (isRunning || isSavingStrategy) {
        return;
      }
      const strategy = visibleStrategyLibrary.find((item) => item.revision === pendingStrategyGovernanceAction.revision);
      if (!strategy || !strategyLibraryItemMatchesWorkspace(workspace, strategy)) {
        return;
      }
      setPendingStrategyGovernanceAction(null);
      runGoldenPathActionById("run-pipeline", "strategy");
    }, [
      isRunning,
      isSavingStrategy,
      pendingStrategyGovernanceAction,
      runGoldenPathActionById,
      visibleStrategyLibrary,
      workspace
    ]);
}
