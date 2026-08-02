import { Panel } from "../../../components/AppPanel";
import { type MarketDataRefreshOverrideAuditStatus } from "../../../components/ResearchContextReadinessPanel";
import { createLatestRequestCoordinator } from "../../../lib/latest-request";
import { AuditEventHistoryPagination, AuditEventRecord, buildLoadingMarketKlinesResult, CacheWatchlistRefreshRun, createMarketAiSelection, createMarketAiSelectionReview, loadAuditEvents, loadMarketAiSelectionQualityStatistics, loadMarketCalendarStatus, loadMarketDataReadiness, loadMarketDiscovery, loadMarketInformation, loadMarketKlines, MarketAiSelectionLoadResult, MarketAiSelectionQualityStatisticsLoadResult, MarketAiSelectionRequest, MarketAiSelectionResearchOrigin, MarketAiSelectionReviewLoadResult, MarketAiSelectionReviewRequest, MarketCalendarResult, MarketDataReadinessResult, MarketDiscoveryParams, MarketDiscoveryResult, MarketInformationResult, MarketKlinesResult, MarketSearchSuggestion, mergeMarketKlines, saveWatchlist } from "../../../lib/terminal-api";
import { buildMarketDataRefreshOverrideAuditLedgerRows, buildScannerCandidates, buildWatchlistCacheRefreshCoverageRow, buildWatchlistCacheRefreshHistoryRows, buildWatchlistCacheRefreshItemRows, Market, MarketDataRefreshOverride, resolveWatchlistCacheRefreshRunSelection, WatchlistCacheRefreshHistoryRow, workspaceWithSavedWatchlist } from "../../../lib/terminal-workbench";
import { buildFallbackMarketCalendarState, initialKlinesState, initialMarketDataReadinessState, MARKET_REFRESH_OVERRIDE_AUDIT_EVENTS_PAGE_SIZE, quantCoreBaseUrl } from "../../app-shell/initial-state";
import { replaceWatchlistCacheRefreshRunUrlParam, resolveInitialMarketAiSelectionResearchOrigin, resolveInitialWatchlistCacheRefreshRunId } from "../../app-shell/url-state";
import { ChartDataStrip, chartKlineLimit, KlineChartCanvas } from "../../research/ChartComponents";
import { cacheContextKey } from "../../settings/SettingsFormatters";
import { Maximize2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "colorScheme" | "error" | "i18n" | "locale" | "setIsSearchOpen" | "setLocale" | "setWorkspaceState" | "source" | "statusLabel" | "workspace" | "workspaceRef">;
type Result = Pick<AppControllerBindings, "klinesState" | "setKlinesState" | "marketDataReadinessState" | "setMarketDataReadinessState" | "marketCalendarState" | "setMarketCalendarState" | "marketDiscoveryResult" | "setMarketDiscoveryResult" | "isLoadingMarketDiscovery" | "setIsLoadingMarketDiscovery" | "marketDiscoveryRequestIdRef" | "marketDiscoveryRequestMarketRef" | "marketAiSelection" | "setMarketAiSelection" | "marketAiSelectionRequestKey" | "setMarketAiSelectionRequestKey" | "isLoadingMarketAiSelection" | "setIsLoadingMarketAiSelection" | "marketAiSelectionRequestRef" | "marketAiSelectionReview" | "setMarketAiSelectionReview" | "isLoadingMarketAiSelectionReview" | "setIsLoadingMarketAiSelectionReview" | "marketAiSelectionReviewRequestRef" | "marketAiSelectionStatistics" | "setMarketAiSelectionStatistics" | "isLoadingMarketAiSelectionStatistics" | "setIsLoadingMarketAiSelectionStatistics" | "marketAiSelectionStatisticsRequestRef" | "pendingMarketAiSelectionResearchOrigin" | "setPendingMarketAiSelectionResearchOrigin" | "marketInformationResult" | "setMarketInformationResult" | "marketInformationNewsResult" | "setMarketInformationNewsResult" | "marketInformationMarket" | "setMarketInformationMarket" | "isLoadingMarketInformation" | "setIsLoadingMarketInformation" | "isLoadingMarketInformationNews" | "setIsLoadingMarketInformationNews" | "marketInformationRequestRef" | "marketInformationNewsRequestRef" | "marketInformationRequestContextRef" | "marketDraft" | "setMarketDraft" | "symbolDraft" | "setSymbolDraft" | "searchSuggestions" | "setSearchSuggestions" | "isChartLoading" | "setIsChartLoading" | "isSymbolSearching" | "setIsSymbolSearching" | "hasUnsavedWatchlistChanges" | "setHasUnsavedWatchlistChanges" | "isSavingWatchlist" | "setIsSavingWatchlist" | "refreshingCacheKey" | "setRefreshingCacheKey" | "marketDataRefreshOverride" | "setMarketDataRefreshOverride" | "marketDataRefreshOverrideAuditStatus" | "setMarketDataRefreshOverrideAuditStatus" | "isRefreshingWatchlistCache" | "setIsRefreshingWatchlistCache" | "marketRefreshIssue" | "setMarketRefreshIssue" | "watchlistCacheRefreshHistory" | "setWatchlistCacheRefreshHistory" | "selectedWatchlistCacheRefreshRunId" | "setSelectedWatchlistCacheRefreshRunId" | "isChartExpanded" | "setIsChartExpanded" | "marketDataRefreshOverrideAuditEvents" | "setMarketDataRefreshOverrideAuditEvents" | "marketDataRefreshOverrideAuditPagination" | "setMarketDataRefreshOverrideAuditPagination" | "marketDataRefreshOverrideAuditQuery" | "setMarketDataRefreshOverrideAuditQuery" | "marketDataRefreshOverrideAuditOffset" | "setMarketDataRefreshOverrideAuditOffset" | "isLoadingMarketDataRefreshOverrideAudit" | "setIsLoadingMarketDataRefreshOverrideAudit" | "chartRequestIdRef" | "marketCalendarRequestIdRef" | "marketDataRefreshOverrideAuditRequestIdRef" | "klinesStateRef" | "historicalKlineRequestRef" | "symbolSearchRequestIdRef" | "setWatchlistCacheRefreshRunSelection" | "latestChartBar" | "scannerCandidates" | "marketDataRefreshOverrideAuditRows" | "activeCacheReadiness" | "activeReadinessCacheContext" | "activeCacheContextKey" | "activeMarketDataRefreshOverride" | "latestWatchlistCacheRefresh" | "selectedWatchlistCacheRefresh" | "watchlistCacheRefreshHistoryRows" | "watchlistCacheRefreshItemRows" | "watchlistCacheRefreshCoverageRow" | "selectedWatchlistRefreshEvidenceRunId" | "refreshMarketDataRefreshOverrideAuditEvents" | "refreshMarketCalendarStatus" | "searchMarketDiscovery" | "refreshMarketAiSelectionStatistics" | "runMarketAiSelection" | "runMarketAiSelectionReview" | "marketDiscoveryMarket" | "marketInformationSymbol" | "marketInformationName" | "refreshMarketInformation" | "refreshMarketInformationNews" | "selectMarketInformationMarket" | "refreshChart" | "clearMarketDataRefreshOverride" | "loadHistoricalKlines" | "updateMarketDataRefreshOverrideAuditQuery" | "previousMarketDataRefreshOverrideAuditPage" | "nextMarketDataRefreshOverrideAuditPage" | "selectWatchlistCacheRefreshRun" | "saveCurrentWatchlist" | "renderChartPanel"> & Pick<AppControllerBindings, "changeMarketDraft" | "changeSymbolDraft" | "openSymbolSearch" | "closeExpandedChart">;

export function useMarketStateActions(controller: Dependencies): Result {
  const {
    colorScheme, error, i18n, locale, setIsSearchOpen, setLocale, setWorkspaceState,
    source, statusLabel, workspace, workspaceRef
  } = controller;
  const [klinesState, setKlinesState] = useState(initialKlinesState);
  const [marketDataReadinessState, setMarketDataReadinessState] = useState<MarketDataReadinessResult>(
      initialMarketDataReadinessState
    );
  const [marketCalendarState, setMarketCalendarState] = useState<MarketCalendarResult>(() =>
      buildFallbackMarketCalendarState(workspace.selectedInstrument.market)
    );
  const [marketDiscoveryResult, setMarketDiscoveryResult] = useState<MarketDiscoveryResult | null>(null);
  const [isLoadingMarketDiscovery, setIsLoadingMarketDiscovery] = useState(false);
  const marketDiscoveryRequestIdRef = useRef(0);
  const marketDiscoveryRequestMarketRef = useRef<MarketDiscoveryParams["market"] | null>(null);
  const [marketAiSelection, setMarketAiSelection] =
      useState<MarketAiSelectionLoadResult>({ source: "fallback" });
  const [marketAiSelectionRequestKey, setMarketAiSelectionRequestKey] = useState<string | null>(null);
  const [isLoadingMarketAiSelection, setIsLoadingMarketAiSelection] = useState(false);
  const marketAiSelectionRequestRef = useRef(createLatestRequestCoordinator());
  const [marketAiSelectionReview, setMarketAiSelectionReview] =
      useState<MarketAiSelectionReviewLoadResult>({ source: "fallback" });
  const [isLoadingMarketAiSelectionReview, setIsLoadingMarketAiSelectionReview] =
      useState(false);
  const marketAiSelectionReviewRequestRef = useRef(createLatestRequestCoordinator());
  const [marketAiSelectionStatistics, setMarketAiSelectionStatistics] =
      useState<MarketAiSelectionQualityStatisticsLoadResult>({ source: "fallback" });
  const [isLoadingMarketAiSelectionStatistics, setIsLoadingMarketAiSelectionStatistics] =
      useState(false);
  const marketAiSelectionStatisticsRequestRef = useRef(createLatestRequestCoordinator());
  const [pendingMarketAiSelectionResearchOrigin, setPendingMarketAiSelectionResearchOrigin] =
      useState<(MarketAiSelectionResearchOrigin & { market: Market; symbol: string }) | null>(
        resolveInitialMarketAiSelectionResearchOrigin,
      );
  const [marketInformationResult, setMarketInformationResult] =
      useState<MarketInformationResult | null>(null);
  const [marketInformationNewsResult, setMarketInformationNewsResult] =
      useState<MarketInformationResult | null>(null);
  const [marketInformationMarket, setMarketInformationMarket] =
      useState<Market>(() => workspace.selectedInstrument.market);
  const [isLoadingMarketInformation, setIsLoadingMarketInformation] = useState(false);
  const [isLoadingMarketInformationNews, setIsLoadingMarketInformationNews] = useState(false);
  const marketInformationRequestRef = useRef(createLatestRequestCoordinator());
  const marketInformationNewsRequestRef = useRef(createLatestRequestCoordinator());
  const marketInformationRequestContextRef = useRef<string | null>(null);
  const [marketDraft, setMarketDraft] = useState<Market>(workspace.selectedInstrument.market);
  const [symbolDraft, setSymbolDraft] = useState(workspace.selectedInstrument.symbol);
  const [searchSuggestions, setSearchSuggestions] = useState<MarketSearchSuggestion[]>([]);
  const changeMarketDraft = useCallback((market: Market) => setMarketDraft(market), []);
  const changeSymbolDraft = useCallback((symbol: string) => {
    setSymbolDraft(symbol);
    setIsSearchOpen(true);
  }, [setIsSearchOpen]);
  const openSymbolSearch = useCallback(() => {
    if (symbolDraft.trim()) {
      setIsSearchOpen(true);
    }
  }, [setIsSearchOpen, symbolDraft]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [isSymbolSearching, setIsSymbolSearching] = useState(false);
  const [hasUnsavedWatchlistChanges, setHasUnsavedWatchlistChanges] = useState(false);
  const [isSavingWatchlist, setIsSavingWatchlist] = useState(false);
  const [refreshingCacheKey, setRefreshingCacheKey] = useState<string | null>(null);
  const [marketDataRefreshOverride, setMarketDataRefreshOverride] = useState<MarketDataRefreshOverride | null>(null);
  const [marketDataRefreshOverrideAuditStatus, setMarketDataRefreshOverrideAuditStatus] =
      useState<MarketDataRefreshOverrideAuditStatus>({ state: "idle" });
  const [isRefreshingWatchlistCache, setIsRefreshingWatchlistCache] = useState(false);
  const [marketRefreshIssue, setMarketRefreshIssue] = useState<string | null>(null);
  const [watchlistCacheRefreshHistory, setWatchlistCacheRefreshHistory] = useState<CacheWatchlistRefreshRun[]>([]);
  const [selectedWatchlistCacheRefreshRunId, setSelectedWatchlistCacheRefreshRunId] = useState<string | null>(
      resolveInitialWatchlistCacheRefreshRunId
    );
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const closeExpandedChart = useCallback(() => setIsChartExpanded(false), []);
  const [marketDataRefreshOverrideAuditEvents, setMarketDataRefreshOverrideAuditEvents] = useState<AuditEventRecord[]>([]);
  const [marketDataRefreshOverrideAuditPagination, setMarketDataRefreshOverrideAuditPagination] =
      useState<AuditEventHistoryPagination | null>(null);
  const [marketDataRefreshOverrideAuditQuery, setMarketDataRefreshOverrideAuditQuery] = useState("");
  const [marketDataRefreshOverrideAuditOffset, setMarketDataRefreshOverrideAuditOffset] = useState(0);
  const [isLoadingMarketDataRefreshOverrideAudit, setIsLoadingMarketDataRefreshOverrideAudit] = useState(false);
  const chartRequestIdRef = useRef(0);
  const marketCalendarRequestIdRef = useRef(0);
  const marketDataRefreshOverrideAuditRequestIdRef = useRef(0);
  const klinesStateRef = useRef(initialKlinesState);
  const historicalKlineRequestRef = useRef<string | null>(null);
  const symbolSearchRequestIdRef = useRef(0);
  const setWatchlistCacheRefreshRunSelection = useCallback((runId: string | null) => {
      setSelectedWatchlistCacheRefreshRunId(runId);
      replaceWatchlistCacheRefreshRunUrlParam(runId);
    }, []);
  const latestChartBar = klinesState.bars.at(-1);
  const scannerCandidates = buildScannerCandidates(workspace);
  const marketDataRefreshOverrideAuditRows = buildMarketDataRefreshOverrideAuditLedgerRows(
      marketDataRefreshOverrideAuditEvents
    );
  const activeCacheReadiness = marketDataReadinessState.readiness;
  const activeReadinessCacheContext =
      activeCacheReadiness?.market === workspace.selectedInstrument.market &&
        activeCacheReadiness.symbol === workspace.selectedInstrument.symbol &&
        activeCacheReadiness.timeframe === workspace.selectedTimeframe
        ? {
            market: activeCacheReadiness.market,
            symbol: activeCacheReadiness.symbol,
            timeframe: activeCacheReadiness.timeframe,
            rowCount: activeCacheReadiness.barCount,
            startTimestamp: activeCacheReadiness.startBarAt,
            endTimestamp: activeCacheReadiness.latestBarAt,
            freshness: activeCacheReadiness.cacheState,
            ageHours: activeCacheReadiness.ageHours
          }
        : undefined;
  const activeCacheContextKey = cacheContextKey({
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      timeframe: workspace.selectedTimeframe
    });
  const activeMarketDataRefreshOverride =
      marketDataRefreshOverride?.market === workspace.selectedInstrument.market ? marketDataRefreshOverride : null;
  const latestWatchlistCacheRefresh = watchlistCacheRefreshHistory[0] ?? null;
  const selectedWatchlistCacheRefresh = resolveWatchlistCacheRefreshRunSelection(
      watchlistCacheRefreshHistory,
      selectedWatchlistCacheRefreshRunId
    );
  const watchlistCacheRefreshHistoryRows = buildWatchlistCacheRefreshHistoryRows(
      watchlistCacheRefreshHistory,
      4,
      selectedWatchlistCacheRefresh?.runId ?? null
    );
  const watchlistCacheRefreshItemRows = buildWatchlistCacheRefreshItemRows(selectedWatchlistCacheRefresh);
  const watchlistCacheRefreshCoverageRow = buildWatchlistCacheRefreshCoverageRow(
      selectedWatchlistCacheRefresh,
      workspace
    );
  const selectedWatchlistRefreshEvidenceRunId =
      watchlistCacheRefreshCoverageRow?.status === "ready" ? watchlistCacheRefreshCoverageRow.runId : null;
  const refreshMarketDataRefreshOverrideAuditEvents = useCallback(async () => {
      const requestId = marketDataRefreshOverrideAuditRequestIdRef.current + 1;
      marketDataRefreshOverrideAuditRequestIdRef.current = requestId;
      setIsLoadingMarketDataRefreshOverrideAudit(true);
      const auditHistory = await loadAuditEvents(quantCoreBaseUrl, {
        eventType: "market_data_refresh_override",
        limit: MARKET_REFRESH_OVERRIDE_AUDIT_EVENTS_PAGE_SIZE,
        offset: marketDataRefreshOverrideAuditOffset,
        query: marketDataRefreshOverrideAuditQuery.trim() || undefined
      });
      if (marketDataRefreshOverrideAuditRequestIdRef.current !== requestId) {
        return auditHistory;
      }
      if (auditHistory.source === "core") {
        setMarketDataRefreshOverrideAuditEvents(auditHistory.events);
        setMarketDataRefreshOverrideAuditPagination(auditHistory.pagination ?? null);
      } else {
        setMarketDataRefreshOverrideAuditPagination(null);
      }
      setIsLoadingMarketDataRefreshOverrideAudit(false);
      return auditHistory;
    }, [marketDataRefreshOverrideAuditOffset, marketDataRefreshOverrideAuditQuery, quantCoreBaseUrl]);
  const refreshMarketCalendarStatus = useCallback(async (silent = false) => {
      const requestId = marketCalendarRequestIdRef.current + 1;
      marketCalendarRequestIdRef.current = requestId;
      const market = workspace.selectedInstrument.market;
      if (!silent) {
        setMarketCalendarState(buildFallbackMarketCalendarState(market));
      }
      const result = await loadMarketCalendarStatus(quantCoreBaseUrl, market);
      if (
        marketCalendarRequestIdRef.current !== requestId ||
        workspaceRef.current.selectedInstrument.market !== market
      ) {
        return;
      }
      if (silent && result.source !== "core") {
        setMarketCalendarState((current) => ({
          ...current,
          error: result.error ?? current.error
        }));
        return;
      }
      setMarketCalendarState(result);
    }, [workspace.selectedInstrument.market]);
  const searchMarketDiscovery = useCallback(async (params: MarketDiscoveryParams) => {
      const requestId = marketDiscoveryRequestIdRef.current + 1;
      marketDiscoveryRequestIdRef.current = requestId;
      marketDiscoveryRequestMarketRef.current = params.market;
      setIsLoadingMarketDiscovery(true);
      setMarketDiscoveryResult((current) =>
        current?.market === params.market ? current : null
      );
      const result = await loadMarketDiscovery(quantCoreBaseUrl, params);
      if (marketDiscoveryRequestIdRef.current !== requestId) {
        return;
      }
      marketDiscoveryRequestMarketRef.current = null;
      setMarketDiscoveryResult(result);
      setIsLoadingMarketDiscovery(false);
    }, [quantCoreBaseUrl]);
  const refreshMarketAiSelectionStatistics = useCallback(async () => {
      const token = marketAiSelectionStatisticsRequestRef.current.begin();
      setIsLoadingMarketAiSelectionStatistics(true);
      setMarketAiSelectionStatistics((current) => ({ ...current, error: undefined }));
      const result = await loadMarketAiSelectionQualityStatistics(quantCoreBaseUrl);
      if (!marketAiSelectionStatisticsRequestRef.current.isCurrent(token)) {
        return;
      }
      setIsLoadingMarketAiSelectionStatistics(false);
      setMarketAiSelectionStatistics((current) => result.statistics
        ? result
        : {
            ...current,
            source: "fallback",
            error: result.error ?? "AI 选股质量统计暂时不可用",
          });
    }, [quantCoreBaseUrl]);
  const runMarketAiSelection = useCallback(async (
      request: MarketAiSelectionRequest,
      requestKey: string
    ) => {
      const token = marketAiSelectionRequestRef.current.begin();
      setIsLoadingMarketAiSelection(true);
      setMarketAiSelection((current) => ({
        ...current,
        error: undefined
      }));
      const result = await createMarketAiSelection(quantCoreBaseUrl, request);
      if (!marketAiSelectionRequestRef.current.isCurrent(token)) {
        return;
      }
      setIsLoadingMarketAiSelection(false);
      if (result.selection) {
        setMarketAiSelection(result);
        setMarketAiSelectionRequestKey(requestKey);
        marketAiSelectionReviewRequestRef.current.begin();
        setIsLoadingMarketAiSelectionReview(false);
        setMarketAiSelectionReview({ source: "fallback" });
        void refreshMarketAiSelectionStatistics();
        return;
      }
      setMarketAiSelection((current) => ({
        ...current,
        source: "fallback",
        error: result.error ?? "AI 选股服务暂时不可用"
      }));
    }, [quantCoreBaseUrl, refreshMarketAiSelectionStatistics]);
  const runMarketAiSelectionReview = useCallback(async (
      request: MarketAiSelectionReviewRequest,
    ) => {
      const token = marketAiSelectionReviewRequestRef.current.begin();
      setIsLoadingMarketAiSelectionReview(true);
      setMarketAiSelectionReview((current) => ({
        ...current,
        error: undefined,
      }));
      const result = await createMarketAiSelectionReview(quantCoreBaseUrl, request);
      if (!marketAiSelectionReviewRequestRef.current.isCurrent(token)) {
        return;
      }
      setIsLoadingMarketAiSelectionReview(false);
      if (result.review) {
        setMarketAiSelectionReview(result);
        void refreshMarketAiSelectionStatistics();
        return;
      }
      setMarketAiSelectionReview((current) => ({
        ...current,
        source: "fallback",
        error: result.error ?? "AI 选股复盘服务暂时不可用",
      }));
    }, [quantCoreBaseUrl, refreshMarketAiSelectionStatistics]);
  const marketDiscoveryMarket = workspace.selectedInstrument.market === "crypto"
      ? "crypto"
      : "ashare";
  const marketInformationSymbol =
      workspace.selectedInstrument.market === marketInformationMarket
        ? workspace.selectedInstrument.symbol
        : "";
  const marketInformationName =
      workspace.selectedInstrument.market === marketInformationMarket
        ? workspace.selectedInstrument.name
        : "";
  const refreshMarketInformation = useCallback(async () => {
      const market = marketInformationMarket;
      const symbol = marketInformationSymbol;
      const name = marketInformationName;
      const contextKey = `${market}:${symbol}:${name}`;
      const requestToken = marketInformationRequestRef.current.begin();
      const newsRequestToken = marketInformationNewsRequestRef.current.begin();
      marketInformationRequestContextRef.current = contextKey;
      setIsLoadingMarketInformation(true);
      setIsLoadingMarketInformationNews(true);
      setMarketInformationResult((current) =>
        current?.market === market && current.symbol === symbol ? current : null
      );
      setMarketInformationNewsResult((current) =>
        current?.market === market && current.symbol === symbol ? current : null
      );
      const newsResult = await loadMarketInformation(quantCoreBaseUrl, {
        market,
        symbol,
        name,
        limit: 20,
        offset: 0,
        section: "news",
        scope: "all",
      });
      if (!marketInformationNewsRequestRef.current.isCurrent(newsRequestToken)) {
        return;
      }
      setMarketInformationNewsResult(newsResult);
      setIsLoadingMarketInformationNews(false);
      const result = await loadMarketInformation(quantCoreBaseUrl, {
        market,
        symbol,
        name,
        limit: 20,
        offset: 0,
        scope: "all",
      });
      if (!marketInformationRequestRef.current.isCurrent(requestToken)) {
        return;
      }
      marketInformationRequestContextRef.current = null;
      setMarketInformationResult((current) => result.error && current ? current : result);
      if (!result.error) {
        setMarketInformationNewsResult((current) => !current || current.error ? result : current);
      }
      setIsLoadingMarketInformation(false);
    }, [
      marketInformationMarket,
      marketInformationName,
      marketInformationSymbol,
      quantCoreBaseUrl,
    ]);
  const refreshMarketInformationNews = useCallback(async (
      offset: number,
      scope: "all" | "market" | "instrument",
    ) => {
      const requestToken = marketInformationNewsRequestRef.current.begin();
      setIsLoadingMarketInformationNews(true);
      const result = await loadMarketInformation(quantCoreBaseUrl, {
        market: marketInformationMarket,
        symbol: marketInformationSymbol,
        name: marketInformationName,
        limit: 20,
        offset,
        section: "news",
        scope,
      });
      if (!marketInformationNewsRequestRef.current.isCurrent(requestToken)) {
        return;
      }
      setMarketInformationNewsResult(result);
      setIsLoadingMarketInformationNews(false);
    }, [
      marketInformationMarket,
      marketInformationName,
      marketInformationSymbol,
      quantCoreBaseUrl,
    ]);
  const selectMarketInformationMarket = useCallback((market: Market) => {
      if (market === marketInformationMarket) {
        return;
      }
      marketInformationRequestRef.current.begin();
      marketInformationNewsRequestRef.current.begin();
      marketInformationRequestContextRef.current = null;
      setMarketInformationResult(null);
      setMarketInformationNewsResult(null);
      setIsLoadingMarketInformation(false);
      setIsLoadingMarketInformationNews(false);
      setMarketInformationMarket(market);
    }, [marketInformationMarket]);
  const refreshChart = useCallback(async (silent = false) => {
      const requestId = chartRequestIdRef.current + 1;
      chartRequestIdRef.current = requestId;
      const params = {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe
      };
      if (!silent) {
        setIsChartLoading(true);
        setKlinesState(buildLoadingMarketKlinesResult(params));
        setMarketDataReadinessState({ source: "fallback", error: "Market data readiness loading" });
      }
      const [result, readiness] = await Promise.all([
        loadMarketKlines(quantCoreBaseUrl, { ...params, limit: chartKlineLimit }),
        loadMarketDataReadiness(quantCoreBaseUrl, params)
      ]);
      if (chartRequestIdRef.current === requestId) {
        if (!silent || result.source === "core") {
          setKlinesState(result);
        }
        if (!silent || readiness.source === "core") {
          setMarketDataReadinessState(readiness);
        }
        setIsChartLoading(false);
      }
    }, [
      chartKlineLimit,
      quantCoreBaseUrl,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]);
  const clearMarketDataRefreshOverride = useCallback(() => {
      setMarketDataRefreshOverride(null);
      setMarketDataRefreshOverrideAuditStatus({ state: "idle" });
    }, []);
  const loadHistoricalKlines = useCallback(async (beforeTimestampMs: number): Promise<MarketKlinesResult["bars"]> => {
      const current = klinesStateRef.current;
      const earliestTimestampMs = current.bars[0]?.timestampMs;
      if (!Number.isFinite(beforeTimestampMs) || !earliestTimestampMs) {
        return [];
      }

      const endMs = Math.min(beforeTimestampMs, earliestTimestampMs) - 1;
      const requestKey = `${current.market}:${current.symbol}:${current.timeframe}:${endMs}`;
      if (historicalKlineRequestRef.current === requestKey) {
        return [];
      }

      historicalKlineRequestRef.current = requestKey;
      try {
        const result = await loadMarketKlines(quantCoreBaseUrl, {
          market: current.market,
          symbol: current.symbol,
          timeframe: current.timeframe,
          limit: chartKlineLimit,
          end: new Date(endMs).toISOString()
        });
        const olderBars = result.bars.filter((bar) => bar.timestampMs < earliestTimestampMs);
        if (olderBars.length) {
          setKlinesState((existing) =>
            existing.market === result.market &&
            existing.symbol === result.symbol &&
            existing.timeframe === result.timeframe
              ? mergeMarketKlines(existing, result)
              : existing
          );
        }
        return olderBars;
      } finally {
        if (historicalKlineRequestRef.current === requestKey) {
          historicalKlineRequestRef.current = null;
        }
      }
    }, []);
  const updateMarketDataRefreshOverrideAuditQuery = useCallback((query: string) => {
      setMarketDataRefreshOverrideAuditQuery(query);
      setMarketDataRefreshOverrideAuditOffset(0);
    }, []);
  const previousMarketDataRefreshOverrideAuditPage = useCallback(() => {
      setMarketDataRefreshOverrideAuditOffset((current) =>
        Math.max(0, current - MARKET_REFRESH_OVERRIDE_AUDIT_EVENTS_PAGE_SIZE)
      );
    }, []);
  const nextMarketDataRefreshOverrideAuditPage = useCallback(() => {
      setMarketDataRefreshOverrideAuditOffset((current) => {
        const total = marketDataRefreshOverrideAuditPagination?.total ?? 0;
        if (!total) {
          return current;
        }
        const next = current + MARKET_REFRESH_OVERRIDE_AUDIT_EVENTS_PAGE_SIZE;
        return next >= total ? current : next;
      });
    }, [marketDataRefreshOverrideAuditPagination?.total]);
  const selectWatchlistCacheRefreshRun = useCallback((row: WatchlistCacheRefreshHistoryRow) => {
      setWatchlistCacheRefreshRunSelection(row.runId);
    }, [setWatchlistCacheRefreshRunSelection]);
  const saveCurrentWatchlist = useCallback(async () => {
      setIsSavingWatchlist(true);
      const result = await saveWatchlist(quantCoreBaseUrl, workspace.watchlist);
      setWorkspaceState((current) => ({
        workspace:
          result.source === "core"
            ? workspaceWithSavedWatchlist(current.workspace, result.watchlist)
            : current.workspace,
        source: result.source,
        statusLabel: result.source === "core" ? "Watchlist saved" : "Watchlist save failed",
        error: result.error
      }));
      if (result.source === "core") {
        setHasUnsavedWatchlistChanges(false);
      }
      setIsSavingWatchlist(false);
    }, [workspace.watchlist]);
  const renderChartPanel = (className = "chart-panel") => (
      <Panel
        title={i18n.t("panel.chart.title")}
        subtitle={i18n.t("panel.chart.subtitle", { timeframe: workspace.selectedTimeframe })}
        className={className}
        action={
          <button
            aria-label={i18n.t("chart.expand")}
            className="panel-icon-button"
            onClick={() => setIsChartExpanded(true)}
            title={i18n.t("chart.expand")}
            type="button"
          >
            <Maximize2 size={16} />
          </button>
        }
      >
        <div className="chart-panel-body">
          <KlineChartCanvas
            key={`${workspace.selectedInstrument.market}-${workspace.selectedInstrument.symbol}-${workspace.selectedTimeframe}`}
            bars={klinesState.bars}
            colorScheme={colorScheme}
            locale={locale}
            market={klinesState.market}
            onLoadHistorical={loadHistoricalKlines}
            symbol={klinesState.symbol}
            timeframe={klinesState.timeframe}
          />
          {!klinesState.bars.length && !isChartLoading ? <div className="chart-empty">{i18n.t("chart.noData")}</div> : null}
          <ChartDataStrip i18n={i18n} latestChartBar={latestChartBar} state={klinesState} />
        </div>
      </Panel>
    );
  return {
    klinesState, setKlinesState, marketDataReadinessState, setMarketDataReadinessState, marketCalendarState, setMarketCalendarState,
    marketDiscoveryResult, setMarketDiscoveryResult, isLoadingMarketDiscovery, setIsLoadingMarketDiscovery, marketDiscoveryRequestIdRef, marketDiscoveryRequestMarketRef,
    marketAiSelection, setMarketAiSelection, marketAiSelectionRequestKey, setMarketAiSelectionRequestKey, isLoadingMarketAiSelection, setIsLoadingMarketAiSelection,
    marketAiSelectionRequestRef, marketAiSelectionReview, setMarketAiSelectionReview, isLoadingMarketAiSelectionReview, setIsLoadingMarketAiSelectionReview, marketAiSelectionReviewRequestRef,
    marketAiSelectionStatistics, setMarketAiSelectionStatistics, isLoadingMarketAiSelectionStatistics, setIsLoadingMarketAiSelectionStatistics, marketAiSelectionStatisticsRequestRef, pendingMarketAiSelectionResearchOrigin,
    setPendingMarketAiSelectionResearchOrigin, marketInformationResult, setMarketInformationResult, marketInformationNewsResult, setMarketInformationNewsResult, marketInformationMarket,
    setMarketInformationMarket, isLoadingMarketInformation, setIsLoadingMarketInformation, isLoadingMarketInformationNews, setIsLoadingMarketInformationNews, marketInformationRequestRef,
    marketInformationNewsRequestRef, marketInformationRequestContextRef, marketDraft, setMarketDraft, symbolDraft, setSymbolDraft,
    searchSuggestions, setSearchSuggestions, isChartLoading, setIsChartLoading, isSymbolSearching, setIsSymbolSearching,
    hasUnsavedWatchlistChanges, setHasUnsavedWatchlistChanges, isSavingWatchlist, setIsSavingWatchlist, refreshingCacheKey, setRefreshingCacheKey,
    marketDataRefreshOverride, setMarketDataRefreshOverride, marketDataRefreshOverrideAuditStatus, setMarketDataRefreshOverrideAuditStatus, isRefreshingWatchlistCache, setIsRefreshingWatchlistCache,
    marketRefreshIssue, setMarketRefreshIssue, watchlistCacheRefreshHistory, setWatchlistCacheRefreshHistory, selectedWatchlistCacheRefreshRunId, setSelectedWatchlistCacheRefreshRunId,
    isChartExpanded, setIsChartExpanded, marketDataRefreshOverrideAuditEvents, setMarketDataRefreshOverrideAuditEvents, marketDataRefreshOverrideAuditPagination, setMarketDataRefreshOverrideAuditPagination,
    marketDataRefreshOverrideAuditQuery, setMarketDataRefreshOverrideAuditQuery, marketDataRefreshOverrideAuditOffset, setMarketDataRefreshOverrideAuditOffset, isLoadingMarketDataRefreshOverrideAudit, setIsLoadingMarketDataRefreshOverrideAudit,
    chartRequestIdRef, marketCalendarRequestIdRef, marketDataRefreshOverrideAuditRequestIdRef, klinesStateRef, historicalKlineRequestRef, symbolSearchRequestIdRef,
    setWatchlistCacheRefreshRunSelection, latestChartBar, scannerCandidates, marketDataRefreshOverrideAuditRows, activeCacheReadiness, activeReadinessCacheContext,
    activeCacheContextKey, activeMarketDataRefreshOverride, latestWatchlistCacheRefresh, selectedWatchlistCacheRefresh, watchlistCacheRefreshHistoryRows, watchlistCacheRefreshItemRows,
    watchlistCacheRefreshCoverageRow, selectedWatchlistRefreshEvidenceRunId, refreshMarketDataRefreshOverrideAuditEvents, refreshMarketCalendarStatus, searchMarketDiscovery, refreshMarketAiSelectionStatistics,
    runMarketAiSelection, runMarketAiSelectionReview, marketDiscoveryMarket, marketInformationSymbol, marketInformationName, refreshMarketInformation,
    refreshMarketInformationNews, selectMarketInformationMarket, refreshChart, clearMarketDataRefreshOverride, loadHistoricalKlines, updateMarketDataRefreshOverrideAuditQuery,
    previousMarketDataRefreshOverrideAuditPage, nextMarketDataRefreshOverrideAuditPage, selectWatchlistCacheRefreshRun, saveCurrentWatchlist, renderChartPanel,
    changeMarketDraft, changeSymbolDraft, openSymbolSearch, closeExpandedChart
  };
}
