import type { Market, ResearchRunAudit, TerminalWorkspace, Timeframe } from "./terminal-workbench";
import {
  isMarket,
  isMarketKlineBar,
  isOptionalDataQualityContract,
  isTimeframe,
  type MarketKlineBar,
  type TerminalResearchParams
} from "./terminal-api-contract";
import { buildApiUrl, defaultFetcher, type WorkspaceFetcher } from "./terminal-api-http";
import { isPlatformSettingsStatus, type PlatformSettingsStatus } from "./platform-settings";

type WorkspaceSource = "core" | "fallback";

export interface MarketKlineQuality {
  source: string;
  originSource?: string | null;
  isComplete: boolean;
  warnings: string[];
  rows: number;
  observedAt?: string | null;
  marketTime?: string | null;
  calendarId?: string | null;
  adjustmentMode?: string;
  freshness?: "fresh" | "stale" | "historical" | "unknown" | string;
  coverage?: {
    actualRows: number;
    expectedRows: number;
    gapCount: number;
    ratio: number;
  };
  canonicalHash?: string;
  issues?: Array<{
    code: string;
    severity: "warning" | "blocked" | string;
    count: number;
    message: string;
  }>;
}

export interface MarketKlinesResult {
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  bars: MarketKlineBar[];
  quality: MarketKlineQuality;
  source: WorkspaceSource;
  error?: string;
}

export type MarketDataReadinessState = "ready" | "stale" | "blocked";
export type MarketDataReadinessCacheState = "fresh" | "stale" | "empty";
export type MarketDataReadinessProviderHealthState = "healthy" | "degraded";

export interface MarketDataReadinessRepairAction {
  id: string;
  label: string;
  target: string;
  method: "GET" | "POST";
}

export interface MarketDataReadiness {
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  state: MarketDataReadinessState;
  source: string;
  cacheState: MarketDataReadinessCacheState;
  barCount: number;
  latestBarAt: string | null;
  startBarAt: string | null;
  ageHours: number | null;
  providerHealthState: MarketDataReadinessProviderHealthState;
  blockingReasons: string[];
  repairActions: MarketDataReadinessRepairAction[];
  latestRefreshRunId: string | null;
  latestProviderErrorId: string | null;
  dataQualityWarnings: string[];
}

export interface MarketDataReadinessResult {
  readiness?: MarketDataReadiness;
  source: WorkspaceSource;
  error?: string;
}

export type MarketCalendarStatusValue = "open" | "closed" | "break" | "always_open" | "unknown";

export interface MarketCalendarStatus {
  market: Market;
  timezone: string;
  status: MarketCalendarStatusValue;
  isOpen: boolean;
  session: string;
  asOf: string;
  tradingDay: string;
  nextOpen: string | null;
  nextClose: string | null;
  detail: string;
  warnings: string[];
  source: string;
}

export interface MarketCalendarResult {
  calendar?: MarketCalendarStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface CacheRefreshSummary {
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  requestedLimit: number;
  upsertedRows: number;
  overrideAuditEventId?: string | null;
  quality: MarketKlineQuality;
}

export interface CacheRefreshResult {
  refresh?: CacheRefreshSummary;
  watchlistRefresh?: CacheWatchlistRefreshRun;
  settings?: PlatformSettingsStatus;
  source: WorkspaceSource;
  error?: string;
}

export type CacheWatchlistRefreshItemStatus = "refreshed" | "skipped" | "failed";

export interface CacheWatchlistRefreshItem extends CacheRefreshSummary {
  name: string;
  status: CacheWatchlistRefreshItemStatus;
  error: string | null;
}

export interface CacheWatchlistRefreshRunSummary {
  totalSymbols: number;
  refreshed: number;
  skipped: number;
  failed: number;
  upsertedRows: number;
}

export interface CacheWatchlistRefreshRun {
  runId: string;
  createdAt: string;
  timeframe: Timeframe;
  requestedLimit: number;
  overrideAuditEventId?: string | null;
  summary: CacheWatchlistRefreshRunSummary;
  items: CacheWatchlistRefreshItem[];
}

export interface CacheWatchlistRefreshParams {
  timeframe: Timeframe;
  limit?: number;
  overrideAuditEventId?: string | null;
  watchlist: TerminalWorkspace["watchlist"];
}

export interface CacheWatchlistRefreshResult {
  watchlistRefresh?: CacheWatchlistRefreshRun;
  settings?: PlatformSettingsStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface CacheWatchlistRefreshHistoryResult {
  watchlistRefreshes: CacheWatchlistRefreshRun[];
  source: WorkspaceSource;
  error?: string;
}

export interface CacheBatchRefreshResult {
  refreshes: CacheRefreshSummary[];
  settings?: PlatformSettingsStatus;
  source: WorkspaceSource;
  failedCount: number;
  error?: string;
}

export interface MarketKlinesParams extends TerminalResearchParams {
  end?: string;
}

export interface CacheRefreshParams extends TerminalResearchParams {
  limit?: number;
  overrideAuditEventId?: string | null;
}

export function buildMarketKlinesUrl(
  baseUrl: string,
  market: Market,
  symbol: string,
  timeframe: Timeframe,
  limit = 160,
  end?: string
): string {
  return buildApiUrl(baseUrl, "api/market/klines", (url) => {
    url.searchParams.set("market", market);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("timeframe", timeframe);
    url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 500))));
    if (end?.trim()) {
      url.searchParams.set("end", end.trim());
    }
  });
}

export function buildMarketDataReadinessUrl(
  baseUrl: string,
  market: Market,
  symbol: string,
  timeframe: Timeframe
): string {
  return buildApiUrl(baseUrl, "api/market/data-readiness", (url) => {
    url.searchParams.set("market", market);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("timeframe", timeframe);
  });
}

export function buildMarketCalendarUrl(baseUrl: string, market: Market, at?: string): string {
  return buildApiUrl(baseUrl, "api/market/calendar", (url) => {
    url.searchParams.set("market", market);
    if (at?.trim()) {
      url.searchParams.set("at", at.trim());
    }
  });
}

export function buildCacheRefreshUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/cache/refresh");
}

export function buildWatchlistCacheRefreshUrl(baseUrl: string, params: { limit?: number } = {}): string {
  return buildApiUrl(baseUrl, "api/cache/watchlist-refreshes", (url) => {
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildLoadingMarketKlinesResult(params: TerminalResearchParams): MarketKlinesResult {
  return {
    market: params.market,
    symbol: params.symbol,
    timeframe: params.timeframe,
    bars: [],
    quality: {
      source: "loading",
      isComplete: false,
      warnings: [],
      rows: 0
    },
    source: "fallback"
  };
}

export async function refreshMarketCache(
  baseUrl: string,
  params: CacheRefreshParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<CacheRefreshResult> {
  try {
    const overrideAuditEventId = params.overrideAuditEventId?.trim();
    const body: Record<string, unknown> = {
      market: params.market,
      symbol: params.symbol,
      timeframe: params.timeframe,
      limit: Math.max(1, Math.min(params.limit ?? 160, 500))
    };
    if (overrideAuditEventId) {
      body.overrideAuditEventId = overrideAuditEventId;
    }
    const response = await fetcher(buildCacheRefreshUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isCacheRefreshPayload(payload)) {
      throw new Error("Invalid cache refresh contract");
    }
    return {
      refresh: payload.refresh,
      watchlistRefresh: payload.watchlistRefresh,
      settings: payload.settings,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown cache refresh error"
    };
  }
}

export async function refreshWatchlistCacheRun(
  baseUrl: string,
  params: CacheWatchlistRefreshParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<CacheWatchlistRefreshResult> {
  try {
    const overrideAuditEventId = params.overrideAuditEventId?.trim();
    const body: Record<string, unknown> = {
      timeframe: params.timeframe,
      limit: Math.max(1, Math.min(params.limit ?? 160, 500)),
      watchlist: params.watchlist.map((instrument) => ({
        market: instrument.market,
        symbol: instrument.symbol,
        name: instrument.name
      }))
    };
    if (overrideAuditEventId) {
      body.overrideAuditEventId = overrideAuditEventId;
    }
    const response = await fetcher(buildWatchlistCacheRefreshUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isCacheWatchlistRefreshPayload(payload)) {
      throw new Error("Invalid watchlist cache refresh contract");
    }
    return {
      watchlistRefresh: payload.watchlistRefresh,
      settings: payload.settings,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown watchlist cache refresh error"
    };
  }
}

export async function loadWatchlistCacheRefreshRuns(
  baseUrl: string,
  params: { limit?: number } = {},
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<CacheWatchlistRefreshHistoryResult> {
  try {
    const response = await fetcher(buildWatchlistCacheRefreshUrl(baseUrl, params));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isCacheWatchlistRefreshHistoryPayload(payload)) {
      throw new Error("Invalid watchlist cache refresh history contract");
    }
    return {
      watchlistRefreshes: payload.watchlistRefreshes,
      source: "core"
    };
  } catch (error) {
    return {
      watchlistRefreshes: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown watchlist cache refresh history error"
    };
  }
}

export async function refreshMarketCacheBatch(
  baseUrl: string,
  paramsList: CacheRefreshParams[],
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<CacheBatchRefreshResult> {
  const refreshes: CacheRefreshSummary[] = [];
  const errors: string[] = [];
  let settings: PlatformSettingsStatus | undefined;
  let failedCount = 0;

  for (const params of paramsList) {
    const result = await refreshMarketCache(baseUrl, params, fetcher);
    if (result.source === "core" && result.refresh && result.settings) {
      refreshes.push(result.refresh);
      settings = result.settings;
      continue;
    }
    failedCount += 1;
    if (result.error) {
      errors.push(`${params.symbol}: ${result.error}`);
    }
  }

  return {
    refreshes,
    settings,
    source: refreshes.length || paramsList.length === 0 ? "core" : "fallback",
    failedCount,
    error: failedCount ? errors.join("; ") || `${failedCount} cache refresh failed` : undefined
  };
}

export async function loadMarketKlines(
  baseUrl: string,
  params: MarketKlinesParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<MarketKlinesResult> {
  try {
    const response = await fetcher(
      buildMarketKlinesUrl(baseUrl, params.market, params.symbol, params.timeframe, params.limit ?? 160, params.end)
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isMarketKlinesPayload(payload)) {
      throw new Error("Invalid market klines contract");
    }
    return {
      ...payload,
      source: "core"
    };
  } catch (error) {
    return {
      market: params.market,
      symbol: params.symbol,
      timeframe: params.timeframe,
      bars: [],
      quality: {
        source: "unavailable",
        isComplete: false,
        warnings: [],
        rows: 0
      },
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown market kline load error"
    };
  }
}

export async function loadMarketDataReadiness(
  baseUrl: string,
  params: TerminalResearchParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<MarketDataReadinessResult> {
  try {
    const response = await fetcher(
      buildMarketDataReadinessUrl(baseUrl, params.market, params.symbol, params.timeframe)
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isMarketDataReadinessPayload(payload)) {
      throw new Error("Invalid market data readiness contract");
    }
    return {
      readiness: payload,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown market data readiness load error"
    };
  }
}

export async function loadMarketCalendarStatus(
  baseUrl: string,
  market: Market,
  fetcher: WorkspaceFetcher = defaultFetcher,
  at?: string
): Promise<MarketCalendarResult> {
  try {
    const response = await fetcher(buildMarketCalendarUrl(baseUrl, market, at));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isMarketCalendarPayload(payload)) {
      throw new Error("Invalid market calendar contract");
    }
    return {
      calendar: payload.calendar,
      source: "core"
    };
  } catch (error) {
    return {
      calendar: {
        market,
        timezone: "unknown",
        status: "unknown",
        isOpen: false,
        session: "unknown",
        asOf: "",
        tradingDay: "",
        nextOpen: null,
        nextClose: null,
        detail: "Market calendar unavailable.",
        warnings: [],
        source: "fallback"
      },
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown market calendar error"
    };
  }
}

export function marketKlinesFromResearchRunAudit(run: ResearchRunAudit): MarketKlinesResult | null {
  const snapshot = run.dataSnapshot;
  if (!snapshot || !snapshot.bars.length) {
    return null;
  }
  return {
    market: run.market,
    symbol: run.symbol,
    timeframe: run.timeframe,
    bars: snapshot.bars.map((bar) => ({ ...bar })),
    quality: {
      source: snapshot.source,
      isComplete: snapshot.isComplete,
      warnings: [...snapshot.warnings],
      rows: snapshot.rows
    },
    source: "core"
  };
}

export function mergeMarketKlines(current: MarketKlinesResult, incoming: MarketKlinesResult): MarketKlinesResult {
  if (
    current.market !== incoming.market ||
    current.symbol !== incoming.symbol ||
    current.timeframe !== incoming.timeframe
  ) {
    return current;
  }

  const barsByTimestamp = new Map<number, MarketKlineBar>();
  [...incoming.bars, ...current.bars].forEach((bar) => {
    barsByTimestamp.set(bar.timestampMs, bar);
  });
  const bars = [...barsByTimestamp.values()].sort((left, right) => left.timestampMs - right.timestampMs);
  const warnings = [...new Set([...current.quality.warnings, ...incoming.quality.warnings])];

  return {
    ...current,
    source: current.source === "core" || incoming.source === "core" ? "core" : current.source,
    error: current.error ?? incoming.error,
    quality: {
      source: incoming.quality.source || current.quality.source,
      isComplete: current.quality.isComplete && incoming.quality.isComplete,
      warnings,
      rows: bars.length
    },
    bars
  };
}

export function isMarketKlineQuality(value: unknown): value is MarketKlineQuality {
  if (!value || typeof value !== "object") {
    return false;
  }
  const quality = value as Partial<MarketKlineQuality>;
  return (
    typeof quality.source === "string" &&
    typeof quality.isComplete === "boolean" &&
    Array.isArray(quality.warnings) &&
    quality.warnings.every((warning) => typeof warning === "string") &&
    typeof quality.rows === "number" &&
    isOptionalDataQualityContract(quality)
  );
}

function isMarketKlinesPayload(value: unknown): value is Omit<MarketKlinesResult, "source" | "error"> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<MarketKlinesResult>;
  return (
    isMarket(payload.market) &&
    typeof payload.symbol === "string" &&
    isTimeframe(payload.timeframe) &&
    isMarketKlineQuality(payload.quality) &&
    Array.isArray(payload.bars) &&
    payload.bars.every(isMarketKlineBar)
  );
}

function isMarketDataReadinessPayload(value: unknown): value is MarketDataReadiness {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<MarketDataReadiness>;
  return (
    isMarket(payload.market) &&
    typeof payload.symbol === "string" &&
    isTimeframe(payload.timeframe) &&
    (payload.state === "ready" || payload.state === "stale" || payload.state === "blocked") &&
    typeof payload.source === "string" &&
    (payload.cacheState === "fresh" || payload.cacheState === "stale" || payload.cacheState === "empty") &&
    typeof payload.barCount === "number" &&
    Number.isFinite(payload.barCount) &&
    payload.barCount >= 0 &&
    (payload.latestBarAt === null || typeof payload.latestBarAt === "string") &&
    (payload.startBarAt === null || typeof payload.startBarAt === "string") &&
    (payload.ageHours === null ||
      (typeof payload.ageHours === "number" && Number.isFinite(payload.ageHours) && payload.ageHours >= 0)) &&
    (payload.providerHealthState === "healthy" || payload.providerHealthState === "degraded") &&
    Array.isArray(payload.blockingReasons) &&
    payload.blockingReasons.every((reason) => typeof reason === "string") &&
    Array.isArray(payload.repairActions) &&
    payload.repairActions.every(isMarketDataReadinessRepairAction) &&
    (payload.latestRefreshRunId === null || typeof payload.latestRefreshRunId === "string") &&
    (payload.latestProviderErrorId === null || typeof payload.latestProviderErrorId === "string") &&
    Array.isArray(payload.dataQualityWarnings) &&
    payload.dataQualityWarnings.every((warning) => typeof warning === "string")
  );
}

function isMarketDataReadinessRepairAction(value: unknown): value is MarketDataReadinessRepairAction {
  if (!value || typeof value !== "object") {
    return false;
  }
  const action = value as Partial<MarketDataReadinessRepairAction>;
  return (
    typeof action.id === "string" &&
    typeof action.label === "string" &&
    typeof action.target === "string" &&
    (action.method === "GET" || action.method === "POST")
  );
}

function isMarketCalendarPayload(value: unknown): value is { calendar: MarketCalendarStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { calendar?: unknown };
  return isMarketCalendarStatus(payload.calendar);
}

function isMarketCalendarStatus(value: unknown): value is MarketCalendarStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const calendar = value as Partial<MarketCalendarStatus>;
  return (
    isMarket(calendar.market) &&
    typeof calendar.timezone === "string" &&
    isMarketCalendarStatusValue(calendar.status) &&
    typeof calendar.isOpen === "boolean" &&
    typeof calendar.session === "string" &&
    typeof calendar.asOf === "string" &&
    typeof calendar.tradingDay === "string" &&
    (calendar.nextOpen === null || typeof calendar.nextOpen === "string") &&
    (calendar.nextClose === null || typeof calendar.nextClose === "string") &&
    typeof calendar.detail === "string" &&
    Array.isArray(calendar.warnings) &&
    calendar.warnings.every((warning) => typeof warning === "string") &&
    typeof calendar.source === "string"
  );
}

function isMarketCalendarStatusValue(value: unknown): value is MarketCalendarStatusValue {
  return value === "open" || value === "closed" || value === "break" || value === "always_open" || value === "unknown";
}

function isCacheRefreshPayload(
  value: unknown
): value is { refresh: CacheRefreshSummary; watchlistRefresh?: CacheWatchlistRefreshRun; settings: PlatformSettingsStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { refresh?: unknown; watchlistRefresh?: unknown; settings?: unknown };
  return (
    isCacheRefreshSummary(payload.refresh) &&
    (payload.watchlistRefresh === undefined || isCacheWatchlistRefreshRun(payload.watchlistRefresh)) &&
    isPlatformSettingsStatus(payload.settings)
  );
}

function isCacheRefreshSummary(value: unknown): value is CacheRefreshSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const refresh = value as Partial<CacheRefreshSummary>;
  return (
    isMarket(refresh.market) &&
    typeof refresh.symbol === "string" &&
    isTimeframe(refresh.timeframe) &&
    typeof refresh.requestedLimit === "number" &&
    typeof refresh.upsertedRows === "number" &&
    isOptionalStringOrNull(refresh.overrideAuditEventId) &&
    isMarketKlineQuality(refresh.quality)
  );
}

function isCacheWatchlistRefreshPayload(
  value: unknown
): value is { watchlistRefresh: CacheWatchlistRefreshRun; settings: PlatformSettingsStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { watchlistRefresh?: unknown; settings?: unknown };
  return isCacheWatchlistRefreshRun(payload.watchlistRefresh) && isPlatformSettingsStatus(payload.settings);
}

function isCacheWatchlistRefreshHistoryPayload(value: unknown): value is { watchlistRefreshes: CacheWatchlistRefreshRun[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { watchlistRefreshes?: unknown };
  return Array.isArray(payload.watchlistRefreshes) && payload.watchlistRefreshes.every(isCacheWatchlistRefreshRun);
}

function isCacheWatchlistRefreshRun(value: unknown): value is CacheWatchlistRefreshRun {
  if (!value || typeof value !== "object") {
    return false;
  }
  const run = value as Partial<CacheWatchlistRefreshRun>;
  return (
    typeof run.runId === "string" &&
    typeof run.createdAt === "string" &&
    isTimeframe(run.timeframe) &&
    typeof run.requestedLimit === "number" &&
    isOptionalStringOrNull(run.overrideAuditEventId) &&
    isCacheWatchlistRefreshRunSummary(run.summary) &&
    Array.isArray(run.items) &&
    run.items.every(isCacheWatchlistRefreshItem)
  );
}

function isCacheWatchlistRefreshRunSummary(value: unknown): value is CacheWatchlistRefreshRunSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<CacheWatchlistRefreshRunSummary>;
  return (
    typeof summary.totalSymbols === "number" &&
    typeof summary.refreshed === "number" &&
    typeof summary.skipped === "number" &&
    typeof summary.failed === "number" &&
    typeof summary.upsertedRows === "number"
  );
}

function isCacheWatchlistRefreshItem(value: unknown): value is CacheWatchlistRefreshItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Partial<CacheWatchlistRefreshItem>;
  return (
    isCacheRefreshSummary(value) &&
    typeof item.name === "string" &&
    (item.status === "refreshed" || item.status === "skipped" || item.status === "failed") &&
    (item.error === null || typeof item.error === "string")
  );
}

function isOptionalStringOrNull(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}
