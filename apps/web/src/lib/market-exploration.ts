import type { Market, Timeframe } from "./terminal-workbench";
import {
  buildApiUrl,
  coreErrorDetail,
  defaultFetcher,
  type WorkspaceFetcher
} from "./terminal-api-http";

type ResearchTimeframe = Timeframe;
type WorkspaceSource = "core" | "fallback";

export interface MarketSearchSuggestion {
  market: Market;
  symbol: string;
  name: string;
  source: string;
  exchange?: string | null;
  pinyin?: string | null;
  cache?: MarketSearchCacheCoverage;
}

export interface MarketSearchCacheCoverage {
  freshness: "fresh" | "stale" | "empty";
  rowCount: number;
  ageHours: number | null;
  startTimestamp: string | null;
  endTimestamp: string | null;
}

export interface MarketSearchResult {
  market: Market;
  query: string;
  timeframe?: ResearchTimeframe;
  results: MarketSearchSuggestion[];
  source: WorkspaceSource;
  error?: string;
}

export type MarketDiscoverySort =
  | "changePct"
  | "amount"
  | "turnoverRate"
  | "marketCap"
  | "peRatio";

export interface MarketDiscoveryParams {
  market: Extract<Market, "ashare" | "crypto">;
  query?: string;
  minChangePct?: number;
  maxChangePct?: number;
  minAmount?: number;
  minTurnoverRate?: number;
  maxPe?: number;
  sort?: MarketDiscoverySort;
  direction?: "asc" | "desc";
  limit?: number;
}

export interface MarketDiscoveryOverview {
  universeCount: number;
  advancing: number;
  declining: number;
  flat: number;
  totalAmount: number;
}

export interface MarketDiscoveryItem {
  market: Market;
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  volume: number;
  amount: number;
  turnoverRate: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  marketCap: number | null;
  source: string;
  observedAt: string;
}

export interface MarketDiscoveryResult {
  market: Market;
  source: string;
  observedAt: string;
  freshness: string;
  warnings: string[];
  snapshotHash: string;
  overview: MarketDiscoveryOverview;
  totalMatched: number;
  items: MarketDiscoveryItem[];
  error?: string;
}

export interface MarketInformationParams {
  market: Market;
  symbol?: string;
  name?: string;
  limit?: number;
  offset?: number;
  section?: "all" | "news";
  scope?: "all" | "market" | "instrument";
}

export interface MarketInformationNewsItem {
  id: string;
  headline: string;
  summary: string;
  publishedAt: string;
  source: string;
  scope: "market" | "instrument";
  url: string | null;
}

export interface MarketInformationResult {
  market: Market;
  symbol: string;
  section: "all" | "news";
  overview: MarketDiscoveryOverview;
  leaders: MarketDiscoveryItem[];
  active: MarketDiscoveryItem[];
  news: MarketInformationNewsItem[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
    scope: "all" | "market" | "instrument";
  };
  source: string;
  observedAt: string;
  freshness: "fresh" | "stale";
  warnings: string[];
  snapshotHash: string;
  error?: string;
}

export function buildMarketSearchUrl(
  baseUrl: string,
  market: Market,
  query: string,
  limit = 8,
  timeframe?: ResearchTimeframe
): string {
  return buildApiUrl(baseUrl, "api/market/search", (url) => {
    url.searchParams.set("market", market);
    url.searchParams.set("query", query);
    url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 20))));
    if (timeframe) {
      url.searchParams.set("timeframe", timeframe);
    }
  });
}

export function buildMarketDiscoveryUrl(
  baseUrl: string,
  params: MarketDiscoveryParams
): string {
  return buildApiUrl(baseUrl, "api/market/discovery", (url) => {
    url.searchParams.set("market", params.market);
    if (params.query?.trim()) {
      url.searchParams.set("query", params.query.trim());
    }
    ([
      ["minChangePct", params.minChangePct],
      ["maxChangePct", params.maxChangePct],
      ["minAmount", params.minAmount],
      ["minTurnoverRate", params.minTurnoverRate],
      ["maxPe", params.maxPe],
    ] as const).forEach(([key, value]) => {
      if (typeof value === "number" && Number.isFinite(value)) {
        url.searchParams.set(key, String(value));
      }
    });
    if (params.sort) {
      url.searchParams.set("sort", params.sort);
    }
    if (params.direction) {
      url.searchParams.set("direction", params.direction);
    }
    if (params.limit !== undefined) {
      url.searchParams.set(
        "limit",
        String(Math.max(1, Math.min(Math.trunc(params.limit), 100)))
      );
    }
  });
}

export function buildMarketInformationUrl(
  baseUrl: string,
  params: MarketInformationParams
): string {
  return buildApiUrl(baseUrl, "api/market/information", (url) => {
    url.searchParams.set("market", params.market);
    if (params.symbol?.trim()) {
      url.searchParams.set("symbol", params.symbol.trim());
    }
    if (params.name?.trim()) {
      url.searchParams.set("name", params.name.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set(
        "limit",
        String(Math.max(1, Math.min(Math.trunc(params.limit), 50)))
      );
    }
    if (params.offset !== undefined) {
      url.searchParams.set(
        "offset",
        String(Math.max(0, Math.min(Math.trunc(params.offset), 1_000)))
      );
    }
    if (params.section !== undefined) {
      url.searchParams.set("section", params.section);
    }
    if (params.scope !== undefined) {
      url.searchParams.set("scope", params.scope);
    }
  });
}

export async function loadMarketSearch(
  baseUrl: string,
  params: { market: Market; query: string; limit?: number; timeframe?: ResearchTimeframe },
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<MarketSearchResult> {
  try {
    const response = await fetcher(
      buildMarketSearchUrl(baseUrl, params.market, params.query, params.limit ?? 8, params.timeframe)
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isMarketSearchPayload(payload)) {
      throw new Error("Invalid market search contract");
    }
    return {
      ...payload,
      source: "core"
    };
  } catch (error) {
    return {
      market: params.market,
      query: params.query,
      results: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown market search error"
    };
  }
}

export async function loadMarketDiscovery(
  baseUrl: string,
  params: MarketDiscoveryParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<MarketDiscoveryResult> {
  try {
    const response = await fetcher(buildMarketDiscoveryUrl(baseUrl, params));
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!response.ok) {
      throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
    }
    if (!isMarketDiscoveryPayload(payload) || payload.market !== params.market) {
      throw new Error("Invalid market discovery contract");
    }
    return payload;
  } catch (error) {
    return {
      market: params.market,
      source: "fallback",
      observedAt: "",
      freshness: "unavailable",
      warnings: [],
      snapshotHash: "",
      overview: {
        universeCount: 0,
        advancing: 0,
        declining: 0,
        flat: 0,
        totalAmount: 0,
      },
      totalMatched: 0,
      items: [],
      error: error instanceof Error ? error.message : "Unknown market discovery error",
    };
  }
}

export async function loadMarketInformation(
  baseUrl: string,
  params: MarketInformationParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<MarketInformationResult> {
  try {
    const response = await fetcher(buildMarketInformationUrl(baseUrl, params));
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!response.ok) {
      throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
    }
    const requestedSymbol = params.symbol?.trim();
    const requestedSection = params.section ?? "all";
    const requestedLimit = Math.max(1, Math.min(Math.trunc(params.limit ?? 20), 50));
    const requestedOffset = Math.max(0, Math.min(Math.trunc(params.offset ?? 0), 1_000));
    const requestedScope = params.scope ?? "all";
    if (
      !isMarketInformationPayload(payload)
      || payload.market !== params.market
      || (requestedSymbol && payload.symbol !== requestedSymbol)
      || payload.section !== requestedSection
      || payload.pagination.limit !== requestedLimit
      || payload.pagination.offset !== requestedOffset
      || payload.pagination.scope !== requestedScope
      || (requestedScope !== "all" && payload.news.some((item) => item.scope !== requestedScope))
    ) {
      throw new Error("Invalid market information contract");
    }
    return payload;
  } catch (error) {
    return {
      market: params.market,
      symbol: params.symbol?.trim() ?? "",
      section: params.section ?? "all",
      overview: {
        universeCount: 0,
        advancing: 0,
        declining: 0,
        flat: 0,
        totalAmount: 0,
      },
      leaders: [],
      active: [],
      news: [],
      pagination: {
        limit: Math.max(1, Math.min(Math.trunc(params.limit ?? 20), 50)),
        offset: Math.max(0, Math.min(Math.trunc(params.offset ?? 0), 1_000)),
        hasMore: false,
        scope: params.scope ?? "all",
      },
      source: "fallback",
      observedAt: "",
      freshness: "stale",
      warnings: [],
      snapshotHash: "",
      error: error instanceof Error ? error.message : "Unknown market information error",
    };
  }
}

function isMarketDiscoveryPayload(value: unknown): value is MarketDiscoveryResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<MarketDiscoveryResult>;
  return (
    isMarket(payload.market) &&
    typeof payload.source === "string" &&
    typeof payload.observedAt === "string" &&
    typeof payload.freshness === "string" &&
    Array.isArray(payload.warnings) &&
    payload.warnings.every((warning) => typeof warning === "string") &&
    typeof payload.snapshotHash === "string" &&
    isMarketDiscoveryOverview(payload.overview) &&
    isNonNegativeFiniteNumber(payload.totalMatched) &&
    Array.isArray(payload.items) &&
    payload.items.every(isMarketDiscoveryItem)
  );
}

function isMarketInformationPayload(value: unknown): value is MarketInformationResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<MarketInformationResult>;
  return (
    isMarket(payload.market) &&
    typeof payload.symbol === "string" &&
    (payload.section === "all" || payload.section === "news") &&
    isMarketDiscoveryOverview(payload.overview) &&
    Array.isArray(payload.leaders) &&
    payload.leaders.every(isMarketDiscoveryItem) &&
    Array.isArray(payload.active) &&
    payload.active.every(isMarketDiscoveryItem) &&
    Array.isArray(payload.news) &&
    payload.news.every(isMarketInformationNewsItem) &&
    isMarketInformationPagination(payload.pagination) &&
    typeof payload.source === "string" &&
    typeof payload.observedAt === "string" &&
    (payload.freshness === "fresh" || payload.freshness === "stale") &&
    Array.isArray(payload.warnings) &&
    payload.warnings.every((warning) => typeof warning === "string") &&
    typeof payload.snapshotHash === "string"
  );
}

function isMarketInformationPagination(value: unknown): value is MarketInformationResult["pagination"] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const pagination = value as Partial<MarketInformationResult["pagination"]>;
  return (
    Number.isInteger(pagination.limit)
    && Number(pagination.limit) >= 1
    && Number(pagination.limit) <= 50
    && Number.isInteger(pagination.offset)
    && Number(pagination.offset) >= 0
    && typeof pagination.hasMore === "boolean"
    && (
      pagination.scope === "all"
      || pagination.scope === "market"
      || pagination.scope === "instrument"
    )
  );
}

function isMarketInformationNewsItem(value: unknown): value is MarketInformationNewsItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Partial<MarketInformationNewsItem>;
  return (
    typeof item.id === "string" &&
    typeof item.headline === "string" &&
    typeof item.summary === "string" &&
    typeof item.publishedAt === "string" &&
    typeof item.source === "string" &&
    (item.scope === "market" || item.scope === "instrument") &&
    (item.url === null || typeof item.url === "string")
  );
}

function isMarketDiscoveryOverview(value: unknown): value is MarketDiscoveryOverview {
  if (!value || typeof value !== "object") {
    return false;
  }
  const overview = value as Partial<MarketDiscoveryOverview>;
  return (
    isNonNegativeFiniteNumber(overview.universeCount) &&
    isNonNegativeFiniteNumber(overview.advancing) &&
    isNonNegativeFiniteNumber(overview.declining) &&
    isNonNegativeFiniteNumber(overview.flat) &&
    isNonNegativeFiniteNumber(overview.totalAmount)
  );
}

function isMarketDiscoveryItem(value: unknown): value is MarketDiscoveryItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Partial<MarketDiscoveryItem>;
  return (
    isMarket(item.market) &&
    typeof item.symbol === "string" &&
    typeof item.name === "string" &&
    isNonNegativeFiniteNumber(item.price) &&
    typeof item.changePct === "number" &&
    Number.isFinite(item.changePct) &&
    isNonNegativeFiniteNumber(item.volume) &&
    isNonNegativeFiniteNumber(item.amount) &&
    isNullableNonNegativeFiniteNumber(item.turnoverRate) &&
    isNullableFiniteNumber(item.peRatio) &&
    isNullableFiniteNumber(item.pbRatio) &&
    isNullableFiniteNumber(item.marketCap) &&
    typeof item.source === "string" &&
    typeof item.observedAt === "string"
  );
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isNullableFiniteNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isNullableNonNegativeFiniteNumber(value: unknown): value is number | null {
  return value === null || isNonNegativeFiniteNumber(value);
}

function isMarketSearchPayload(value: unknown): value is Omit<MarketSearchResult, "source" | "error"> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<MarketSearchResult>;
  return (
    isMarket(payload.market) &&
    typeof payload.query === "string" &&
    (payload.timeframe === undefined || isTimeframe(payload.timeframe)) &&
    Array.isArray(payload.results) &&
    payload.results.every(isMarketSearchSuggestion)
  );
}

function isMarketSearchSuggestion(value: unknown): value is MarketSearchSuggestion {
  if (!value || typeof value !== "object") {
    return false;
  }
  const suggestion = value as Partial<MarketSearchSuggestion>;
  return (
    isMarket(suggestion.market) &&
    typeof suggestion.symbol === "string" &&
    typeof suggestion.name === "string" &&
    typeof suggestion.source === "string" &&
    (suggestion.cache === undefined || isMarketSearchCacheCoverage(suggestion.cache))
  );
}

function isMarketSearchCacheCoverage(value: unknown): value is MarketSearchCacheCoverage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const cache = value as Partial<MarketSearchCacheCoverage>;
  return (
    (cache.freshness === "fresh" || cache.freshness === "stale" || cache.freshness === "empty") &&
    typeof cache.rowCount === "number" &&
    (cache.ageHours === null || typeof cache.ageHours === "number") &&
    (cache.startTimestamp === null || typeof cache.startTimestamp === "string") &&
    (cache.endTimestamp === null || typeof cache.endTimestamp === "string")
  );
}

function isMarket(value: unknown): value is Market {
  return value === "ashare" || value === "us" || value === "crypto";
}

function isTimeframe(value: unknown): value is Timeframe {
  return (
    value === "1d" ||
    value === "1w" ||
    value === "1m" ||
    value === "5m" ||
    value === "15m" ||
    value === "30m" ||
    value === "60m"
  );
}
