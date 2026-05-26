import { buildTerminalWorkspace, Market, ResearchRunAudit, TerminalWorkspace, Timeframe } from "./terminal-workbench";

export const defaultQuantCoreBaseUrl = "http://127.0.0.1:8765";
export type ResearchTimeframe = Timeframe;

export type WorkspaceSource = "core" | "fallback";

export interface WorkspaceLoadResult {
  workspace: TerminalWorkspace;
  source: WorkspaceSource;
  statusLabel: string;
  error?: string;
}

export interface ResearchRunHistoryResult {
  runs: ResearchRunAudit[];
  source: WorkspaceSource;
  error?: string;
}

export interface MarketKlineBar {
  timestamp: string;
  timestampMs: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketKlineQuality {
  source: string;
  isComplete: boolean;
  warnings: string[];
  rows: number;
}

export interface MarketKlinesResult {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  bars: MarketKlineBar[];
  quality: MarketKlineQuality;
  source: WorkspaceSource;
  error?: string;
}

export interface MarketSearchSuggestion {
  market: Market;
  symbol: string;
  name: string;
  source: string;
  exchange?: string | null;
  pinyin?: string | null;
}

export interface MarketSearchResult {
  market: Market;
  query: string;
  results: MarketSearchSuggestion[];
  source: WorkspaceSource;
  error?: string;
}

export interface WorkspaceResponse {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
}

export type WorkspaceFetcher = (url: string) => Promise<WorkspaceResponse>;

export interface TerminalResearchParams {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
}

const defaultFetcher: WorkspaceFetcher = async (url) => fetch(url);

export function resolveQuantCoreBaseUrl(env: { VITE_QUANT_API_BASE?: string }): string {
  const configured = env.VITE_QUANT_API_BASE?.trim();
  return configured ? configured : defaultQuantCoreBaseUrl;
}

export function buildWorkspaceUrl(baseUrl: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL("api/workspace", normalizedBase).toString();
}

export function buildResearchRunUrl(
  baseUrl: string,
  market: Market,
  symbol: string,
  timeframe: ResearchTimeframe
): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL("api/research/run", normalizedBase);
  url.searchParams.set("market", market);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("timeframe", timeframe);
  return url.toString();
}

export function buildResearchRunsUrl(baseUrl: string, limit: number): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL("api/research/runs", normalizedBase);
  url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 50))));
  return url.toString();
}

export function buildMarketKlinesUrl(
  baseUrl: string,
  market: Market,
  symbol: string,
  timeframe: ResearchTimeframe,
  limit = 160
): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL("api/market/klines", normalizedBase);
  url.searchParams.set("market", market);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("timeframe", timeframe);
  url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 500))));
  return url.toString();
}

export function buildMarketSearchUrl(baseUrl: string, market: Market, query: string, limit = 8): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL("api/market/search", normalizedBase);
  url.searchParams.set("market", market);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 20))));
  return url.toString();
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

export async function loadTerminalWorkspace(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<WorkspaceLoadResult> {
  try {
    const response = await fetcher(buildWorkspaceUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isTerminalWorkspace(payload)) {
      throw new Error("Invalid terminal workspace contract");
    }
    return {
      workspace: payload,
      source: "core",
      statusLabel: "Core connected"
    };
  } catch (error) {
    return {
      workspace: buildTerminalWorkspace(),
      source: "fallback",
      statusLabel: "Offline snapshot",
      error: error instanceof Error ? error.message : "Unknown workspace load error"
    };
  }
}

export async function loadResearchRunHistory(
  baseUrl: string,
  limit = 5,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunHistoryResult> {
  try {
    const response = await fetcher(buildResearchRunsUrl(baseUrl, limit));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchRunHistoryPayload(payload)) {
      throw new Error("Invalid research run history contract");
    }
    return {
      runs: payload.runs,
      source: "core"
    };
  } catch (error) {
    return {
      runs: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research run history error"
    };
  }
}

export async function loadMarketKlines(
  baseUrl: string,
  params: TerminalResearchParams & { limit?: number },
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<MarketKlinesResult> {
  try {
    const response = await fetcher(
      buildMarketKlinesUrl(baseUrl, params.market, params.symbol, params.timeframe, params.limit ?? 160)
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

export async function loadMarketSearch(
  baseUrl: string,
  params: { market: Market; query: string; limit?: number },
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<MarketSearchResult> {
  try {
    const response = await fetcher(buildMarketSearchUrl(baseUrl, params.market, params.query, params.limit ?? 8));
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

export async function runTerminalResearch(
  baseUrl: string,
  params: TerminalResearchParams,
  currentWorkspace: TerminalWorkspace,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<WorkspaceLoadResult> {
  try {
    const response = await fetcher(buildResearchRunUrl(baseUrl, params.market, params.symbol, params.timeframe));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isTerminalWorkspace(payload)) {
      throw new Error("Invalid terminal research contract");
    }
    return {
      workspace: payload,
      source: "core",
      statusLabel: "Research run complete"
    };
  } catch (error) {
    return {
      workspace: currentWorkspace,
      source: "fallback",
      statusLabel: "Research run failed",
      error: error instanceof Error ? error.message : "Unknown research run error"
    };
  }
}

function isResearchRunHistoryPayload(value: unknown): value is { runs: ResearchRunAudit[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { runs?: unknown };
  return Array.isArray(payload.runs) && payload.runs.every(isResearchRunAudit);
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
    Boolean(payload.quality) &&
    typeof payload.quality?.source === "string" &&
    typeof payload.quality?.isComplete === "boolean" &&
    Array.isArray(payload.quality?.warnings) &&
    typeof payload.quality?.rows === "number" &&
    Array.isArray(payload.bars) &&
    payload.bars.every(isMarketKlineBar)
  );
}

function isMarketKlineBar(value: unknown): value is MarketKlineBar {
  if (!value || typeof value !== "object") {
    return false;
  }
  const bar = value as Partial<MarketKlineBar>;
  return (
    typeof bar.timestamp === "string" &&
    typeof bar.timestampMs === "number" &&
    typeof bar.open === "number" &&
    typeof bar.high === "number" &&
    typeof bar.low === "number" &&
    typeof bar.close === "number" &&
    typeof bar.volume === "number"
  );
}

function isMarketSearchPayload(value: unknown): value is Omit<MarketSearchResult, "source" | "error"> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<MarketSearchResult>;
  return (
    isMarket(payload.market) &&
    typeof payload.query === "string" &&
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
    typeof suggestion.source === "string"
  );
}

function isResearchRunAudit(value: unknown): value is ResearchRunAudit {
  if (!value || typeof value !== "object") {
    return false;
  }
  const run = value as Partial<ResearchRunAudit>;
  return (
    Boolean(run.runId) &&
    Boolean(run.createdAt) &&
    Boolean(run.market) &&
    Boolean(run.symbol) &&
    isTimeframe(run.timeframe) &&
    Boolean(run.strategyName) &&
    Boolean(run.strategyRevision) &&
    typeof run.dataRows === "number" &&
    Boolean(run.metrics) &&
    Array.isArray(run.decisions) &&
    Boolean(run.executionMode)
  );
}

function isMarket(value: unknown): value is Market {
  return value === "ashare" || value === "us" || value === "crypto";
}

function isTerminalWorkspace(value: unknown): value is TerminalWorkspace {
  if (!value || typeof value !== "object") {
    return false;
  }
  const workspace = value as Partial<TerminalWorkspace>;
  return (
    workspace.schemaVersion === 1 &&
    Boolean(workspace.selectedInstrument?.symbol) &&
    isTimeframe(workspace.selectedTimeframe) &&
    Array.isArray(workspace.watchlist) &&
    Array.isArray(workspace.quantLoop) &&
    Array.isArray(workspace.modules) &&
    Array.isArray(workspace.panels) &&
    Array.isArray(workspace.agents) &&
    Boolean(workspace.execution) &&
    Array.isArray(workspace.execution?.gates) &&
    Boolean(workspace.strategy) &&
    Array.isArray(workspace.metrics) &&
    Array.isArray(workspace.decisionLog) &&
    Array.isArray(workspace.workflowNodes)
  );
}

function isTimeframe(value: unknown): value is Timeframe {
  return (
    value === "1d" ||
    value === "1m" ||
    value === "5m" ||
    value === "15m" ||
    value === "30m" ||
    value === "60m"
  );
}
