import { marketDataRefreshGuardLabel } from "../../../components/ResearchContextReadinessPanel";
import { buildMarketDataRefreshOverrideAuditEvent, loadMarketKlines, MarketAiSelectionResearchOrigin, MarketSearchSuggestion, PlatformSettingsStatus, refreshMarketCache, refreshWatchlistCacheRun, saveAuditEvent } from "../../../lib/terminal-api";
import { buildInstrumentFromSymbol, buildMarketDataRefreshGuard, resolveMarketSearchMarket, TerminalWorkspace, workspaceWithSelectedTimeframe } from "../../../lib/terminal-workbench";
import { MARKET_REFRESH_OVERRIDE_AUDIT_EVENTS_PAGE_SIZE, quantCoreBaseUrl } from "../../app-shell/initial-state";
import { mergeAuditEvidenceReportEvent } from "../../audit/event-merges";
import { chartKlineLimit } from "../../research/ChartComponents";
import { buildWatchlistCacheSummary, cacheContextKey } from "../../settings/SettingsFormatters";
import { type FormEvent, useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activeMarketDataRefreshOverride" | "activeReadinessCacheContext" | "activeWorkAreaId" | "automatedTradingWorkflowActionErrorRef" | "error" | "i18n" | "isRefreshingWatchlistCache" | "isSearchOpen" | "klinesState" | "marketDataRefreshOverride" | "marketDataRefreshOverrideAuditEvents" | "marketDataRefreshOverrideAuditStatus" | "marketDraft" | "marketRefreshIssue" | "pendingMarketAiSelectionResearchOrigin" | "refreshChart" | "refreshGoldenPathStatus" | "refreshingCacheKey" | "searchSuggestions" | "selectInstrument" | "setActiveWorkAreaId" | "setIsRefreshingWatchlistCache" | "setIsSearchOpen" | "setKlinesState" | "setMarketDataRefreshOverride" | "setMarketDataRefreshOverrideAuditEvents" | "setMarketDataRefreshOverrideAuditStatus" | "setMarketDraft" | "setMarketRefreshIssue" | "setPendingMarketAiSelectionResearchOrigin" | "setRefreshingCacheKey" | "setSearchSuggestions" | "setSettingsStatus" | "setSymbolDraft" | "setWatchlistCacheRefreshHistory" | "setWatchlistCacheRefreshRunSelection" | "setWorkspaceState" | "settingsStatus" | "source" | "statusLabel" | "symbolDraft" | "watchlistCacheRefreshHistory" | "workspace">;
type Result = Pick<AppControllerBindings, "activeCacheContext" | "marketDataRefreshGuard" | "watchlistCacheSummary" | "enableMarketDataRefreshOverride" | "refreshCacheContext" | "refreshSelectedMarketCache" | "refreshWatchlistMarketCache" | "researchMarketAiSelectionCandidate" | "submitSymbol" | "selectSearchSuggestion" | "refreshSearchSuggestionCache">;

export function useMarketNavigationActions(controller: Dependencies): Result {
  const {
    activeMarketDataRefreshOverride, activeReadinessCacheContext, activeWorkAreaId, automatedTradingWorkflowActionErrorRef, error, i18n,
    isRefreshingWatchlistCache, isSearchOpen, klinesState, marketDataRefreshOverride, marketDataRefreshOverrideAuditEvents, marketDataRefreshOverrideAuditStatus,
    marketDraft, marketRefreshIssue, pendingMarketAiSelectionResearchOrigin, refreshChart, refreshGoldenPathStatus, refreshingCacheKey,
    searchSuggestions, selectInstrument, setActiveWorkAreaId, setIsRefreshingWatchlistCache, setIsSearchOpen, setKlinesState,
    setMarketDataRefreshOverride, setMarketDataRefreshOverrideAuditEvents, setMarketDataRefreshOverrideAuditStatus, setMarketDraft, setMarketRefreshIssue, setPendingMarketAiSelectionResearchOrigin,
    setRefreshingCacheKey, setSearchSuggestions, setSettingsStatus, setSymbolDraft, setWatchlistCacheRefreshHistory, setWatchlistCacheRefreshRunSelection,
    setWorkspaceState, settingsStatus, source, statusLabel, symbolDraft, watchlistCacheRefreshHistory,
    workspace
  } = controller;
  const activeCacheContext =
      activeReadinessCacheContext ??
      settingsStatus.settings?.cache.contexts.find(
        (context) =>
          context.market === workspace.selectedInstrument.market &&
          context.symbol === workspace.selectedInstrument.symbol &&
          context.timeframe === workspace.selectedTimeframe
      );
  const marketDataRefreshGuard = buildMarketDataRefreshGuard(
      workspace.selectedInstrument.market,
      settingsStatus.settings?.marketDataAdapters,
      activeMarketDataRefreshOverride
    );
  const watchlistCacheSummary = buildWatchlistCacheSummary(settingsStatus.settings, workspace);
  const enableMarketDataRefreshOverride = useCallback(
      async (reason: string) => {
        const normalizedReason = reason.trim();
        if (!normalizedReason) {
          return;
        }
        const override = {
          enabled: true,
          market: workspace.selectedInstrument.market,
          reason: normalizedReason
        };
        const auditGuard = buildMarketDataRefreshGuard(
          workspace.selectedInstrument.market,
          settingsStatus.settings?.marketDataAdapters,
          override
        );
        const auditEvent = buildMarketDataRefreshOverrideAuditEvent({
          guard: auditGuard,
          market: workspace.selectedInstrument.market,
          name: workspace.selectedInstrument.name,
          reason: normalizedReason,
          symbol: workspace.selectedInstrument.symbol,
          timeframe: workspace.selectedTimeframe
        });
        setMarketDataRefreshOverrideAuditStatus({ state: "saving" });
        const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
        if (!result.event) {
          setMarketDataRefreshOverrideAuditStatus({
            state: "failed",
            error: result.error ?? "market_data_refresh_override_audit_save_failed"
          });
          return;
        }
        setMarketDataRefreshOverride({
          ...override,
          auditEventId: result.event.eventId
        });
        setMarketDataRefreshOverrideAuditEvents((current) =>
          mergeAuditEvidenceReportEvent(current, result.event!).slice(0, MARKET_REFRESH_OVERRIDE_AUDIT_EVENTS_PAGE_SIZE)
        );
        setMarketDataRefreshOverrideAuditStatus({ state: "saved", eventId: result.event.eventId });
      },
      [
        quantCoreBaseUrl,
        settingsStatus.settings?.marketDataAdapters,
        workspace.selectedInstrument.market,
        workspace.selectedInstrument.name,
        workspace.selectedInstrument.symbol,
        workspace.selectedTimeframe
      ]
    );
  const refreshCacheContext = useCallback(
      async (context: PlatformSettingsStatus["cache"]["contexts"][number]) => {
        const refreshGuard = buildMarketDataRefreshGuard(
          context.market,
          settingsStatus.settings?.marketDataAdapters,
          marketDataRefreshOverride?.market === context.market ? marketDataRefreshOverride : null
        );
        if (refreshGuard.blocked) {
          const blockedReason = marketDataRefreshGuardLabel(i18n, refreshGuard);
          automatedTradingWorkflowActionErrorRef.current = blockedReason;
          setSettingsStatus((current) => ({
            settings: current.settings,
            source: current.source,
            error: blockedReason
          }));
          return false;
        }
        const key = cacheContextKey(context);
        setRefreshingCacheKey(key);
        try {
          const overrideAuditEventId = refreshGuard.overrideApplied ? marketDataRefreshOverride?.auditEventId : null;
          const result = await refreshMarketCache(quantCoreBaseUrl, {
            market: context.market,
            symbol: context.symbol,
            timeframe: context.timeframe,
            limit: chartKlineLimit,
            overrideAuditEventId
          });
          const refreshedItem = result.watchlistRefresh?.items.find(
            (item) =>
              item.market === context.market &&
              item.symbol === context.symbol &&
              item.timeframe === context.timeframe
          );
          const contextRefreshed = refreshedItem?.status === "refreshed";
          const refreshError =
            result.error ??
            (contextRefreshed ? undefined : refreshedItem?.error ?? "选中标的行情刷新未完成，请检查数据源状态。");
          automatedTradingWorkflowActionErrorRef.current = refreshError ?? null;
          setSettingsStatus({
            settings: result.settings,
            source: result.source,
            error: refreshError
          });
          if (result.watchlistRefresh) {
            setWatchlistCacheRefreshHistory((current) =>
              [
                result.watchlistRefresh!,
                ...current.filter((run) => run.runId !== result.watchlistRefresh!.runId)
              ].slice(0, 4)
            );
            setWatchlistCacheRefreshRunSelection(result.watchlistRefresh.runId);
          }
          if (
            result.source === "core" &&
            context.market === workspace.selectedInstrument.market &&
            context.symbol === workspace.selectedInstrument.symbol &&
            context.timeframe === workspace.selectedTimeframe
          ) {
            await refreshChart();
          }
          await refreshGoldenPathStatus();
          return contextRefreshed;
        } finally {
          if (refreshGuard.overrideApplied) {
            setMarketDataRefreshOverride(null);
            setMarketDataRefreshOverrideAuditStatus({ state: "idle" });
          }
          setRefreshingCacheKey(null);
        }
      },
      [
        i18n,
        marketDataRefreshOverride,
        refreshChart,
        refreshGoldenPathStatus,
        setWatchlistCacheRefreshRunSelection,
        settingsStatus.settings?.marketDataAdapters,
        workspace.selectedInstrument.market,
        workspace.selectedInstrument.symbol,
        workspace.selectedTimeframe
      ]
    );
  const refreshSelectedMarketCache = useCallback(async () => {
      return refreshCacheContext({
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe,
        rowCount: activeCacheContext?.rowCount ?? 0,
        startTimestamp: activeCacheContext?.startTimestamp ?? null,
        endTimestamp: activeCacheContext?.endTimestamp ?? null,
        freshness: activeCacheContext?.freshness ?? "empty",
        ageHours: activeCacheContext?.ageHours ?? null
      });
    }, [
      activeCacheContext,
      refreshCacheContext,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]);
  const refreshWatchlistMarketCache = useCallback(async () => {
      if (!workspace.watchlist.length) {
        const message = "自选列表为空，无法刷新行情。";
        automatedTradingWorkflowActionErrorRef.current = message;
        setMarketRefreshIssue(message);
        return false;
      }
      const refreshGuard = buildMarketDataRefreshGuard(
        workspace.selectedInstrument.market,
        settingsStatus.settings?.marketDataAdapters,
        activeMarketDataRefreshOverride
      );
      if (refreshGuard.blocked) {
        const blockedReason = marketDataRefreshGuardLabel(i18n, refreshGuard);
        automatedTradingWorkflowActionErrorRef.current = blockedReason;
        setMarketRefreshIssue(blockedReason);
        setSettingsStatus((current) => ({
          settings: current.settings,
          source: current.source,
          error: blockedReason
        }));
        return false;
      }
      setMarketRefreshIssue(null);
      setIsRefreshingWatchlistCache(true);
      try {
        const overrideAuditEventId = refreshGuard.overrideApplied ? activeMarketDataRefreshOverride?.auditEventId : null;
        const result = await refreshWatchlistCacheRun(quantCoreBaseUrl, {
          timeframe: workspace.selectedTimeframe,
          limit: chartKlineLimit,
          overrideAuditEventId,
          watchlist: workspace.watchlist
        });
        setSettingsStatus((current) => ({
          settings: result.settings ?? current.settings,
          source: result.source,
          error: result.error
        }));
        const selectedItem = result.watchlistRefresh?.items.find(
          (item) =>
            item.market === workspace.selectedInstrument.market &&
            item.symbol === workspace.selectedInstrument.symbol &&
            item.timeframe === workspace.selectedTimeframe
        );
        const selectedContextRefreshed = selectedItem?.status === "refreshed";
        if (result.watchlistRefresh) {
          setWatchlistCacheRefreshHistory((current) => [
            result.watchlistRefresh!,
            ...current.filter((run) => run.runId !== result.watchlistRefresh!.runId)
          ].slice(0, 4));
          setWatchlistCacheRefreshRunSelection(result.watchlistRefresh.runId);
        }
        if (!selectedContextRefreshed) {
          const message = selectedItem?.error ?? result.error ?? "选中标的行情刷新未完成，请检查数据源状态。";
          automatedTradingWorkflowActionErrorRef.current = message;
          setMarketRefreshIssue(message);
        }
        if (selectedContextRefreshed) {
          await refreshChart();
        }
        await refreshGoldenPathStatus();
        return selectedContextRefreshed;
      } catch (error) {
        const message = error instanceof Error ? error.message : "行情刷新失败。";
        automatedTradingWorkflowActionErrorRef.current = message;
        setMarketRefreshIssue(message);
        return false;
      } finally {
        if (refreshGuard.overrideApplied) {
          setMarketDataRefreshOverride(null);
          setMarketDataRefreshOverrideAuditStatus({ state: "idle" });
        }
        setIsRefreshingWatchlistCache(false);
      }
    }, [
      activeMarketDataRefreshOverride,
      i18n,
      refreshChart,
      refreshGoldenPathStatus,
      setWatchlistCacheRefreshRunSelection,
      settingsStatus.settings?.marketDataAdapters,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe,
      workspace.watchlist
    ]);
  const researchMarketAiSelectionCandidate = useCallback(
      (
        instrument: TerminalWorkspace["selectedInstrument"],
        origin: MarketAiSelectionResearchOrigin,
      ) => {
        selectInstrument(instrument, "research", false);
        setWorkspaceState((current) => ({
          workspace: workspaceWithSelectedTimeframe(current.workspace, "1d"),
          source: "core",
          statusLabel: "AI 选股候选已选择，等待运行研究并核验证据",
        }));
        setPendingMarketAiSelectionResearchOrigin({
          ...origin,
          market: instrument.market,
          symbol: instrument.symbol,
        });
      },
      [selectInstrument],
    );
  const submitSymbol = useCallback(
      (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const searchMarket = resolveMarketSearchMarket(marketDraft, symbolDraft);
        const normalizedSymbol = buildInstrumentFromSymbol(searchMarket, symbolDraft)?.symbol;
        const matchedSuggestion = searchSuggestions.find(
          (suggestion) => suggestion.market === searchMarket && suggestion.symbol === normalizedSymbol
        );
        const instrument = matchedSuggestion
          ? {
              symbol: matchedSuggestion.symbol,
              name: matchedSuggestion.name,
              market: matchedSuggestion.market,
              changePct: 0
            }
          : buildInstrumentFromSymbol(searchMarket, symbolDraft);
        if (!instrument) {
          return;
        }
        selectInstrument(instrument, activeWorkAreaId);
        setSearchSuggestions([]);
        setIsSearchOpen(false);
      },
      [activeWorkAreaId, marketDraft, searchSuggestions, selectInstrument, symbolDraft]
    );
  const selectSearchSuggestion = useCallback(
      (suggestion: MarketSearchSuggestion) => {
        setMarketDraft(suggestion.market);
        setSymbolDraft(suggestion.symbol);
        setSearchSuggestions([]);
        setIsSearchOpen(false);
        selectInstrument(
          {
            symbol: suggestion.symbol,
            name: suggestion.name,
            market: suggestion.market,
            changePct: 0
          },
          activeWorkAreaId
        );
      },
      [activeWorkAreaId, selectInstrument]
    );
  const refreshSearchSuggestionCache = useCallback(
      async (suggestion: MarketSearchSuggestion) => {
        const timeframe = workspace.selectedTimeframe;
        setMarketDraft(suggestion.market);
        setSymbolDraft(suggestion.symbol);
        setSearchSuggestions([]);
        setIsSearchOpen(false);
        selectInstrument(
          {
            symbol: suggestion.symbol,
            name: suggestion.name,
            market: suggestion.market,
            changePct: 0
          },
          activeWorkAreaId
        );
        await refreshCacheContext({
          market: suggestion.market,
          symbol: suggestion.symbol,
          timeframe,
          rowCount: suggestion.cache?.rowCount ?? 0,
          startTimestamp: suggestion.cache?.startTimestamp ?? null,
          endTimestamp: suggestion.cache?.endTimestamp ?? null,
          freshness: suggestion.cache?.freshness ?? "empty",
          ageHours: suggestion.cache?.ageHours ?? null
        });
        setKlinesState(
          await loadMarketKlines(quantCoreBaseUrl, {
            market: suggestion.market,
            symbol: suggestion.symbol,
            timeframe,
            limit: chartKlineLimit
          })
        );
      },
      [activeWorkAreaId, refreshCacheContext, selectInstrument, workspace.selectedTimeframe]
    );
  return {
    activeCacheContext, marketDataRefreshGuard, watchlistCacheSummary, enableMarketDataRefreshOverride, refreshCacheContext, refreshSelectedMarketCache,
    refreshWatchlistMarketCache, researchMarketAiSelectionCandidate, submitSymbol, selectSearchSuggestion, refreshSearchSuggestionCache
  };
}
