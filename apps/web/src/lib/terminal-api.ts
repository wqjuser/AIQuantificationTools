import {
  buildTerminalWorkspace,
  resolveBacktestAssumptions,
  workspaceFromResearchRunAudit,
  workspaceWithPrimaryWorkflows,
  Market,
  PromotionReadiness,
  ResearchRunAudit,
  TerminalWorkspace,
  Timeframe,
  type BacktestAssumptions,
  type StrategyReadinessGate,
  type StrategySnapshot
} from "./terminal-workbench";

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

export interface ResearchNote {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  body: string;
  updatedAt: string | null;
}

export interface ResearchNoteResult {
  note?: ResearchNote;
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchRunDetailResult {
  run?: ResearchRunAudit;
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchRunExportManifest {
  runId: string;
  createdAt: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  strategyRevision: string;
  dataHash: string;
  dataRows: number;
  executionMode: string;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  artifactCounts: {
    bars: number;
    trades: number;
    equityPoints: number;
    decisions: number;
    aiRisks: number;
    paperExecutions?: number;
    promotionCandidates?: number;
    researchNotes?: number;
  };
}

export interface ResearchRunExecutionGateExport {
  id: string;
  label: string;
  passed: boolean;
  reason: string;
}

export interface ResearchRunExecutionHandoff {
  mode: string;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  requiredGates: ResearchRunExecutionGateExport[];
}

export interface ResearchRunExportIntegrity {
  algorithm: "sha256";
  hash: string;
}

export interface ResearchRunExportPackage {
  kind: "aiqt.researchRun.export";
  packageVersion: number;
  exportedAt: string;
  integrity?: ResearchRunExportIntegrity;
  manifest: ResearchRunExportManifest;
  researchRun: ResearchRunAudit;
  executionHandoff: ResearchRunExecutionHandoff;
  paperExecutions?: PaperExecutionRecord[];
  promotionCandidate?: PromotionCandidateRecord | null;
}

export interface ResearchRunExportResult {
  exportPackage?: ResearchRunExportPackage;
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchRunImportResult {
  run?: ResearchRunAudit;
  source: WorkspaceSource;
  error?: string;
}

export interface PaperExecutionAccount {
  cash: number;
  positions: Record<string, number>;
  equity: number;
}

export interface PaperExecutionOrder {
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  status: "filled" | "rejected";
  reason: string;
  timestamp: string;
}

export interface PaperExecutionGate {
  id: string;
  label: string;
  passed: boolean;
  reason: string;
}

export interface PaperExecutionRecord {
  executionId: string;
  runId: string;
  createdAt: string;
  mode: string;
  account: PaperExecutionAccount;
  orders: PaperExecutionOrder[];
  gates: PaperExecutionGate[];
}

export interface PromotionCandidateEvidence {
  paperExecutions: number;
  filledOrders: number;
  passedPaperRiskChecks: number;
}

export interface PromotionCandidateRecord extends PromotionReadiness {
  candidateId: string;
  runId: string;
  createdAt: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  strategyRevision: string;
  latestPaperExecutionId?: string | null;
  liveTradingAllowed: boolean;
  evidence: PromotionCandidateEvidence;
}

export interface PaperExecutionResult {
  execution?: PaperExecutionRecord;
  promotion?: PromotionCandidateRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface PaperExecutionHistoryResult {
  executions: PaperExecutionRecord[];
  source: WorkspaceSource;
  error?: string;
}

export interface PromotionCandidateResult {
  promotion?: PromotionCandidateRecord;
  source: WorkspaceSource;
  error?: string;
}

export type StrategyLibraryStatus = "draft" | "audited";

export interface StrategyLibraryConfig {
  name: string;
  revision: string;
  market: Market;
  symbols: string[];
  timeframe: ResearchTimeframe;
  version: number;
  entryConditions: Array<{ kind: string; params: Record<string, unknown> }>;
  exitConditions: Array<{ kind: string; params: Record<string, unknown> }>;
  risk: {
    positionPct: number | null;
    stopLossPct: number | null;
    takeProfitPct: number | null;
    maxDrawdownPct: number | null;
  };
}

export interface StrategyLibraryItem {
  strategyId: string;
  createdAt: string;
  name: string;
  revision: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  version: number;
  status: StrategyLibraryStatus;
  auditRunId?: string | null;
  strategySnapshot: StrategySnapshot;
  strategyConfig: StrategyLibraryConfig;
}

export interface StrategyLibraryResult {
  strategies: StrategyLibraryItem[];
  source: WorkspaceSource;
  error?: string;
}

export interface StrategySaveParams extends TerminalResearchParams {
  strategy: StrategySnapshot;
  auditRunId?: string | null;
}

export interface StrategySaveResult {
  strategy?: StrategyLibraryItem;
  validation?: StrategyValidation;
  source: WorkspaceSource;
  error?: string;
}

export interface StrategyValidation {
  status: "ready" | "review" | "blocked";
  revision: string;
  gates: StrategyReadinessGate[];
  strategyConfig: StrategyLibraryConfig;
}

export interface StrategyValidationResult {
  validation?: StrategyValidation;
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

export type WorkspaceFetcher = (url: string, init?: RequestInit) => Promise<WorkspaceResponse>;

export interface TerminalResearchParams {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  limit?: number;
}

export interface MarketKlinesParams extends TerminalResearchParams {
  end?: string;
}

export interface ResearchNoteSaveParams extends TerminalResearchParams {
  body: string;
}

const defaultFetcher: WorkspaceFetcher = async (url, init) => fetch(url, init);

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
  timeframe: ResearchTimeframe,
  assumptions?: BacktestAssumptions,
  limit = 500,
  strategy?: StrategySnapshot
): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL("api/research/run", normalizedBase);
  url.searchParams.set("market", market);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("timeframe", timeframe);
  url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 500))));
  if (strategy) {
    url.searchParams.set("strategyName", strategy.name);
    url.searchParams.set("strategyEntry", strategy.entry);
    url.searchParams.set("strategyExit", strategy.exit);
    url.searchParams.set("strategyPosition", strategy.position);
    url.searchParams.set("strategyRisk", strategy.risk);
  }
  if (assumptions) {
    url.searchParams.set("initialCash", String(assumptions.initialCash));
    url.searchParams.set("feeBps", String(assumptions.feeBps));
    url.searchParams.set("slippageBps", String(assumptions.slippageBps));
  }
  return url.toString();
}

export function buildResearchRunsUrl(baseUrl: string, limit: number): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL("api/research/runs", normalizedBase);
  url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 50))));
  return url.toString();
}

export function buildResearchRunDetailUrl(baseUrl: string, runId: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(`api/research/runs/${encodeURIComponent(runId)}`, normalizedBase).toString();
}

export function buildResearchRunExportUrl(baseUrl: string, runId: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(`api/research/runs/${encodeURIComponent(runId)}/export`, normalizedBase).toString();
}

export function buildResearchRunImportUrl(baseUrl: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL("api/research/runs/import", normalizedBase).toString();
}

export function buildResearchNoteUrl(
  baseUrl: string,
  market: Market,
  symbol: string,
  timeframe: ResearchTimeframe
): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL("api/research/notes", normalizedBase);
  url.searchParams.set("market", market);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("timeframe", timeframe);
  return url.toString();
}

export function buildResearchRunPaperExecutionsUrl(baseUrl: string, runId: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(`api/research/runs/${encodeURIComponent(runId)}/paper-executions`, normalizedBase).toString();
}

export function buildResearchRunPromotionUrl(baseUrl: string, runId: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(`api/research/runs/${encodeURIComponent(runId)}/promotion`, normalizedBase).toString();
}

export function buildStrategiesUrl(
  baseUrl: string,
  params: { market?: Market; symbol?: string; limit?: number } = {}
): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL("api/strategies", normalizedBase);
  if (params.market) {
    url.searchParams.set("market", params.market);
  }
  if (params.symbol?.trim()) {
    url.searchParams.set("symbol", params.symbol.trim());
  }
  url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit ?? 20, 50))));
  return url.toString();
}

export function buildStrategyDetailUrl(baseUrl: string, revision: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(`api/strategies/${encodeURIComponent(revision)}`, normalizedBase).toString();
}

export function buildStrategyValidationUrl(baseUrl: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL("api/strategies/validate", normalizedBase).toString();
}

export function buildMarketKlinesUrl(
  baseUrl: string,
  market: Market,
  symbol: string,
  timeframe: ResearchTimeframe,
  limit = 160,
  end?: string
): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL("api/market/klines", normalizedBase);
  url.searchParams.set("market", market);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("timeframe", timeframe);
  url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 500))));
  if (end?.trim()) {
    url.searchParams.set("end", end.trim());
  }
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
      workspace: workspaceWithPrimaryWorkflows(payload),
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

export async function loadResearchRunDetail(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunDetailResult> {
  try {
    const response = await fetcher(buildResearchRunDetailUrl(baseUrl, runId));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchRunDetailPayload(payload)) {
      throw new Error("Invalid research run detail contract");
    }
    return {
      run: payload.run,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research run detail error"
    };
  }
}

export async function loadResearchRunExport(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunExportResult> {
  try {
    const response = await fetcher(buildResearchRunExportUrl(baseUrl, runId));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchRunExportPayload(payload)) {
      throw new Error("Invalid research run export contract");
    }
    return {
      exportPackage: payload.export,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research run export error"
    };
  }
}

export async function importResearchRunExport(
  baseUrl: string,
  exportPackage: ResearchRunExportPackage,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunImportResult> {
  try {
    const response = await fetcher(buildResearchRunImportUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exportPackage)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchRunImportPayload(payload)) {
      throw new Error("Invalid research run import contract");
    }
    return {
      run: payload.run,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research run import error"
    };
  }
}

export async function loadResearchNote(
  baseUrl: string,
  params: TerminalResearchParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchNoteResult> {
  try {
    const response = await fetcher(buildResearchNoteUrl(baseUrl, params.market, params.symbol, params.timeframe));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchNotePayload(payload)) {
      throw new Error("Invalid research note contract");
    }
    return {
      note: payload.note,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research note load error"
    };
  }
}

export async function saveResearchNote(
  baseUrl: string,
  params: ResearchNoteSaveParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchNoteResult> {
  try {
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    const response = await fetcher(new URL("api/research/notes", normalizedBase).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        market: params.market,
        symbol: params.symbol,
        timeframe: params.timeframe,
        body: params.body
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchNotePayload(payload)) {
      throw new Error("Invalid research note contract");
    }
    return {
      note: payload.note,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research note save error"
    };
  }
}

export async function submitResearchRunPaperExecution(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PaperExecutionResult> {
  try {
    const response = await fetcher(buildResearchRunPaperExecutionsUrl(baseUrl, runId), {
      method: "POST"
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isCoreErrorPayload(payload)) {
        return {
          source: "core",
          error: payload.detail ?? payload.error
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isPaperExecutionPayload(payload)) {
      throw new Error("Invalid paper execution contract");
    }
    return {
      execution: payload.execution,
      promotion: payload.promotion,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown paper execution error"
    };
  }
}

export async function loadResearchRunPromotion(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PromotionCandidateResult> {
  try {
    const response = await fetcher(buildResearchRunPromotionUrl(baseUrl, runId));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPromotionCandidatePayload(payload)) {
      throw new Error("Invalid promotion candidate contract");
    }
    return {
      promotion: payload.promotion,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown promotion candidate error"
    };
  }
}

export async function saveStrategySnapshot(
  baseUrl: string,
  params: StrategySaveParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategySaveResult> {
  try {
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    const response = await fetcher(new URL("api/strategies", normalizedBase).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        market: params.market,
        symbol: params.symbol,
        timeframe: params.timeframe,
        auditRunId: params.auditRunId ?? null,
        strategy: params.strategy
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isStrategyValidationErrorPayload(payload)) {
        return {
          validation: payload.validation,
          source: "core",
          error: payload.error
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isStrategyLibraryItemPayload(payload)) {
      throw new Error("Invalid strategy library save contract");
    }
    return {
      strategy: payload.strategy,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy save error"
    };
  }
}

export async function validateStrategySnapshot(
  baseUrl: string,
  params: StrategySaveParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategyValidationResult> {
  try {
    const response = await fetcher(buildStrategyValidationUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        market: params.market,
        symbol: params.symbol,
        timeframe: params.timeframe,
        auditRunId: params.auditRunId ?? null,
        strategy: params.strategy
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStrategyValidationPayload(payload)) {
      throw new Error("Invalid strategy validation contract");
    }
    return {
      validation: payload.validation,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy validation error"
    };
  }
}

export async function loadStrategyLibrary(
  baseUrl: string,
  params: { market?: Market; symbol?: string; limit?: number } = {},
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategyLibraryResult> {
  try {
    const response = await fetcher(buildStrategiesUrl(baseUrl, params));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStrategyLibraryPayload(payload)) {
      throw new Error("Invalid strategy library contract");
    }
    return {
      strategies: payload.strategies,
      source: "core"
    };
  } catch (error) {
    return {
      strategies: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy library error"
    };
  }
}

export async function loadStrategyDetail(
  baseUrl: string,
  revision: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategySaveResult> {
  try {
    const response = await fetcher(buildStrategyDetailUrl(baseUrl, revision));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStrategyLibraryItemPayload(payload)) {
      throw new Error("Invalid strategy detail contract");
    }
    return {
      strategy: payload.strategy,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy detail error"
    };
  }
}

export async function loadResearchRunPaperExecutions(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PaperExecutionHistoryResult> {
  try {
    const response = await fetcher(buildResearchRunPaperExecutionsUrl(baseUrl, runId));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPaperExecutionHistoryPayload(payload)) {
      throw new Error("Invalid paper execution history contract");
    }
    return {
      executions: payload.executions,
      source: "core"
    };
  } catch (error) {
    return {
      executions: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown paper execution history error"
    };
  }
}

export async function loadLatestResearchRunPaperExecution(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PaperExecutionResult> {
  const result = await loadResearchRunPaperExecutions(baseUrl, runId, fetcher);
  if (result.source === "fallback") {
    return {
      source: "fallback",
      error: result.error
    };
  }
  return {
    execution: result.executions[0],
    source: "core"
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
    const response = await fetcher(
      buildResearchRunUrl(
        baseUrl,
        params.market,
        params.symbol,
        params.timeframe,
        resolveBacktestAssumptions(currentWorkspace),
        params.limit ?? 500,
        currentWorkspace.strategy
      )
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isTerminalWorkspace(payload)) {
      throw new Error("Invalid terminal research contract");
    }
    const workspace = await hydrateResearchRunSnapshotIfNeeded(
      baseUrl,
      workspaceWithPrimaryWorkflows(payload),
      fetcher
    );
    return {
      workspace,
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

async function hydrateResearchRunSnapshotIfNeeded(
  baseUrl: string,
  workspace: TerminalWorkspace,
  fetcher: WorkspaceFetcher
): Promise<TerminalWorkspace> {
  const runId = workspace.researchRun?.runId;
  const snapshot = workspace.researchRun?.dataSnapshot;
  if (!runId || (snapshot && snapshot.bars.length > 0)) {
    return workspace;
  }

  try {
    const response = await fetcher(buildResearchRunDetailUrl(baseUrl, runId));
    if (!response.ok) {
      return workspace;
    }
    const payload = await response.json();
    if (!isResearchRunDetailPayload(payload) || !payload.run.dataSnapshot?.bars.length) {
      return workspace;
    }
    return workspaceWithPrimaryWorkflows(workspaceFromResearchRunAudit(workspace, payload.run));
  } catch {
    return workspace;
  }
}

function isResearchRunHistoryPayload(value: unknown): value is { runs: ResearchRunAudit[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { runs?: unknown };
  return Array.isArray(payload.runs) && payload.runs.every(isResearchRunAudit);
}

function isResearchRunDetailPayload(value: unknown): value is { run: ResearchRunAudit } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { run?: unknown };
  return isResearchRunAudit(payload.run);
}

function isResearchRunExportPayload(value: unknown): value is { export: ResearchRunExportPackage } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { export?: unknown };
  return isResearchRunExportPackage(payload.export);
}

function isResearchRunImportPayload(value: unknown): value is { run: ResearchRunAudit } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { run?: unknown };
  return isResearchRunAudit(payload.run) && Boolean(payload.run.dataSnapshot);
}

function isResearchNotePayload(value: unknown): value is { note: ResearchNote } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { note?: unknown };
  return isResearchNote(payload.note);
}

function isResearchNote(value: unknown): value is ResearchNote {
  if (!value || typeof value !== "object") {
    return false;
  }
  const note = value as Partial<ResearchNote>;
  return (
    isMarket(note.market) &&
    typeof note.symbol === "string" &&
    isTimeframe(note.timeframe) &&
    typeof note.body === "string" &&
    (note.updatedAt === null || typeof note.updatedAt === "string")
  );
}

function isPaperExecutionPayload(value: unknown): value is { execution: PaperExecutionRecord; promotion?: PromotionCandidateRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { execution?: unknown; promotion?: unknown };
  return isPaperExecutionRecord(payload.execution) && (payload.promotion === undefined || isPromotionCandidateRecord(payload.promotion));
}

function isPaperExecutionHistoryPayload(value: unknown): value is { executions: PaperExecutionRecord[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { executions?: unknown };
  return Array.isArray(payload.executions) && payload.executions.every(isPaperExecutionRecord);
}

function isPromotionCandidatePayload(value: unknown): value is { promotion: PromotionCandidateRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { promotion?: unknown };
  return isPromotionCandidateRecord(payload.promotion);
}

function isStrategyLibraryPayload(value: unknown): value is { strategies: StrategyLibraryItem[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { strategies?: unknown };
  return Array.isArray(payload.strategies) && payload.strategies.every(isStrategyLibraryItem);
}

function isStrategyLibraryItemPayload(value: unknown): value is { strategy: StrategyLibraryItem } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { strategy?: unknown };
  return isStrategyLibraryItem(payload.strategy);
}

function isStrategyValidationPayload(value: unknown): value is { validation: StrategyValidation } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { validation?: unknown };
  return isStrategyValidation(payload.validation);
}

function isStrategyValidationErrorPayload(value: unknown): value is { error: string; validation: StrategyValidation } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { error?: unknown; validation?: unknown };
  return typeof payload.error === "string" && isStrategyValidation(payload.validation);
}

function isCoreErrorPayload(value: unknown): value is { error: string; detail?: string } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { error?: unknown; detail?: unknown };
  return typeof payload.error === "string" && (payload.detail === undefined || typeof payload.detail === "string");
}

function isStrategyValidation(value: unknown): value is StrategyValidation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const validation = value as Partial<StrategyValidation>;
  return (
    (validation.status === "ready" || validation.status === "review" || validation.status === "blocked") &&
    typeof validation.revision === "string" &&
    Array.isArray(validation.gates) &&
    validation.gates.every(isStrategyReadinessGate) &&
    isResearchRunStrategyConfig(validation.strategyConfig)
  );
}

function isStrategyReadinessGate(value: unknown): value is StrategyReadinessGate {
  if (!value || typeof value !== "object") {
    return false;
  }
  const gate = value as Partial<StrategyReadinessGate>;
  return (
    (gate.id === "schema" || gate.id === "risk" || gate.id === "execution" || gate.id === "audit") &&
    (gate.label === "Strategy schema" ||
      gate.label === "Risk controls" ||
      gate.label === "Execution mode" ||
      gate.label === "Audit evidence") &&
    typeof gate.value === "string" &&
    typeof gate.detail === "string" &&
    (gate.status === "passed" || gate.status === "review" || gate.status === "blocked") &&
    (gate.tone === "positive" || gate.tone === "warning" || gate.tone === "risk")
  );
}

function isStrategyLibraryItem(value: unknown): value is StrategyLibraryItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const strategy = value as Partial<StrategyLibraryItem>;
  return (
    typeof strategy.strategyId === "string" &&
    typeof strategy.createdAt === "string" &&
    typeof strategy.name === "string" &&
    typeof strategy.revision === "string" &&
    isMarket(strategy.market) &&
    typeof strategy.symbol === "string" &&
    isTimeframe(strategy.timeframe) &&
    typeof strategy.version === "number" &&
    (strategy.status === "draft" || strategy.status === "audited") &&
    (strategy.auditRunId === undefined || strategy.auditRunId === null || typeof strategy.auditRunId === "string") &&
    isStrategySnapshot(strategy.strategySnapshot) &&
    isResearchRunStrategyConfig(strategy.strategyConfig)
  );
}

function isStrategySnapshot(value: unknown): value is StrategySnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }
  const snapshot = value as Partial<StrategySnapshot>;
  return (
    typeof snapshot.name === "string" &&
    typeof snapshot.entry === "string" &&
    typeof snapshot.exit === "string" &&
    typeof snapshot.position === "string" &&
    typeof snapshot.risk === "string"
  );
}

function isPromotionCandidateRecord(value: unknown): value is PromotionCandidateRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<PromotionCandidateRecord>;
  return (
    typeof candidate.candidateId === "string" &&
    typeof candidate.runId === "string" &&
    typeof candidate.createdAt === "string" &&
    isMarket(candidate.market) &&
    typeof candidate.symbol === "string" &&
    isTimeframe(candidate.timeframe) &&
    typeof candidate.strategyRevision === "string" &&
    (candidate.latestPaperExecutionId === undefined ||
      candidate.latestPaperExecutionId === null ||
      typeof candidate.latestPaperExecutionId === "string") &&
    isPromotionReadinessStatus(candidate.status) &&
    typeof candidate.headline === "string" &&
    typeof candidate.summary === "string" &&
    typeof candidate.liveTradingAllowed === "boolean" &&
    isPromotionCandidateEvidence(candidate.evidence) &&
    Array.isArray(candidate.stages) &&
    candidate.stages.every(isPromotionCandidateStage)
  );
}

function isPromotionReadinessStatus(value: unknown): value is PromotionCandidateRecord["status"] {
  return value === "blocked" || value === "paper_pending" || value === "certification_pending" || value === "live_ready";
}

function isPromotionCandidateEvidence(value: unknown): value is PromotionCandidateEvidence {
  if (!value || typeof value !== "object") {
    return false;
  }
  const evidence = value as Partial<PromotionCandidateEvidence>;
  return (
    typeof evidence.paperExecutions === "number" &&
    typeof evidence.filledOrders === "number" &&
    typeof evidence.passedPaperRiskChecks === "number"
  );
}

function isPromotionCandidateStage(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const stage = value as Record<string, unknown>;
  return (
    typeof stage.id === "string" &&
    typeof stage.label === "string" &&
    typeof stage.value === "string" &&
    typeof stage.detail === "string" &&
    (stage.status === "passed" || stage.status === "blocked" || stage.status === "review") &&
    (stage.tone === "positive" || stage.tone === "warning" || stage.tone === "neutral" || stage.tone === "risk") &&
    (stage.passed === undefined || typeof stage.passed === "boolean") &&
    (stage.reason === undefined || typeof stage.reason === "string")
  );
}

function isPaperExecutionRecord(value: unknown): value is PaperExecutionRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const execution = value as Partial<PaperExecutionRecord>;
  return (
    typeof execution.executionId === "string" &&
    typeof execution.runId === "string" &&
    typeof execution.createdAt === "string" &&
    typeof execution.mode === "string" &&
    isPaperExecutionAccount(execution.account) &&
    Array.isArray(execution.orders) &&
    execution.orders.every(isPaperExecutionOrder) &&
    Array.isArray(execution.gates) &&
    execution.gates.every(isPaperExecutionGate)
  );
}

function isPaperExecutionAccount(value: unknown): value is PaperExecutionAccount {
  if (!value || typeof value !== "object") {
    return false;
  }
  const account = value as Partial<PaperExecutionAccount>;
  return (
    typeof account.cash === "number" &&
    typeof account.equity === "number" &&
    Boolean(account.positions) &&
    typeof account.positions === "object" &&
    Object.values(account.positions).every((quantity) => typeof quantity === "number")
  );
}

function isPaperExecutionOrder(value: unknown): value is PaperExecutionOrder {
  if (!value || typeof value !== "object") {
    return false;
  }
  const order = value as Partial<PaperExecutionOrder>;
  return (
    typeof order.orderId === "string" &&
    typeof order.symbol === "string" &&
    (order.side === "buy" || order.side === "sell") &&
    typeof order.quantity === "number" &&
    typeof order.price === "number" &&
    (order.status === "filled" || order.status === "rejected") &&
    typeof order.reason === "string" &&
    typeof order.timestamp === "string"
  );
}

function isPaperExecutionGate(value: unknown): value is PaperExecutionGate {
  if (!value || typeof value !== "object") {
    return false;
  }
  const gate = value as Partial<PaperExecutionGate>;
  return (
    typeof gate.id === "string" &&
    typeof gate.label === "string" &&
    typeof gate.passed === "boolean" &&
    typeof gate.reason === "string"
  );
}

function isResearchRunExportPackage(value: unknown): value is ResearchRunExportPackage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const exportPackage = value as Partial<ResearchRunExportPackage>;
  return (
    exportPackage.kind === "aiqt.researchRun.export" &&
    typeof exportPackage.packageVersion === "number" &&
    typeof exportPackage.exportedAt === "string" &&
    (exportPackage.integrity === undefined || isResearchRunExportIntegrity(exportPackage.integrity)) &&
    isResearchRunExportManifest(exportPackage.manifest) &&
    isResearchRunAudit(exportPackage.researchRun) &&
    Boolean(exportPackage.researchRun.dataSnapshot) &&
    isResearchRunExecutionHandoff(exportPackage.executionHandoff) &&
    (exportPackage.paperExecutions === undefined ||
      (Array.isArray(exportPackage.paperExecutions) && exportPackage.paperExecutions.every(isPaperExecutionRecord))) &&
    (exportPackage.promotionCandidate === undefined ||
      exportPackage.promotionCandidate === null ||
      isPromotionCandidateRecord(exportPackage.promotionCandidate))
  );
}

function isResearchRunExportIntegrity(value: unknown): value is ResearchRunExportIntegrity {
  if (!value || typeof value !== "object") {
    return false;
  }
  const integrity = value as Partial<ResearchRunExportIntegrity>;
  return integrity.algorithm === "sha256" && typeof integrity.hash === "string" && /^[a-f0-9]{64}$/i.test(integrity.hash);
}

function isResearchRunExportManifest(value: unknown): value is ResearchRunExportManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const manifest = value as Partial<ResearchRunExportManifest>;
  const counts = manifest.artifactCounts as Partial<ResearchRunExportManifest["artifactCounts"]> | undefined;
  return (
    typeof manifest.runId === "string" &&
    typeof manifest.createdAt === "string" &&
    isMarket(manifest.market) &&
    typeof manifest.symbol === "string" &&
    isTimeframe(manifest.timeframe) &&
    typeof manifest.strategyRevision === "string" &&
    typeof manifest.dataHash === "string" &&
    typeof manifest.dataRows === "number" &&
    typeof manifest.executionMode === "string" &&
    typeof manifest.paperOnly === "boolean" &&
    typeof manifest.liveTradingAllowed === "boolean" &&
    Boolean(counts) &&
    typeof counts?.bars === "number" &&
    typeof counts?.trades === "number" &&
    typeof counts?.equityPoints === "number" &&
    typeof counts?.decisions === "number" &&
    typeof counts?.aiRisks === "number" &&
    (counts?.researchNotes === undefined || typeof counts.researchNotes === "number")
  );
}

function isResearchRunExecutionHandoff(value: unknown): value is ResearchRunExecutionHandoff {
  if (!value || typeof value !== "object") {
    return false;
  }
  const handoff = value as Partial<ResearchRunExecutionHandoff>;
  return (
    typeof handoff.mode === "string" &&
    typeof handoff.paperOnly === "boolean" &&
    typeof handoff.liveTradingAllowed === "boolean" &&
    Array.isArray(handoff.requiredGates) &&
    handoff.requiredGates.every(isResearchRunExecutionGateExport)
  );
}

function isResearchRunExecutionGateExport(value: unknown): value is ResearchRunExecutionGateExport {
  if (!value || typeof value !== "object") {
    return false;
  }
  const gate = value as Partial<ResearchRunExecutionGateExport>;
  return (
    typeof gate.id === "string" &&
    typeof gate.label === "string" &&
    typeof gate.passed === "boolean" &&
    typeof gate.reason === "string"
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
    Boolean(run.executionMode) &&
    (run.aiReport === undefined || isResearchRunAiReport(run.aiReport)) &&
    (run.dataQuality === undefined || isResearchRunDataQuality(run.dataQuality)) &&
    (run.dataSnapshot === undefined || isResearchRunDataSnapshot(run.dataSnapshot)) &&
    (run.researchNote === undefined || isResearchRunNote(run.researchNote)) &&
    (run.strategyConfig === undefined || isResearchRunStrategyConfig(run.strategyConfig)) &&
    (run.backtestAssumptions === undefined || isBacktestAssumptions(run.backtestAssumptions)) &&
    (run.backtestTrades === undefined ||
      (Array.isArray(run.backtestTrades) && run.backtestTrades.every(isBacktestTradeRow))) &&
    (run.backtestEquityCurve === undefined ||
      (Array.isArray(run.backtestEquityCurve) && run.backtestEquityCurve.every(isBacktestEquityPoint))) &&
    (run.backtestDiagnostics === undefined ||
      (Array.isArray(run.backtestDiagnostics) && run.backtestDiagnostics.every(isBacktestDiagnostic)))
  );
}

function isResearchRunNote(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const note = value as Record<string, unknown>;
  return (
    isMarket(note.market) &&
    typeof note.symbol === "string" &&
    isTimeframe(note.timeframe) &&
    typeof note.body === "string" &&
    (note.updatedAt === null || typeof note.updatedAt === "string")
  );
}

function isResearchRunDataSnapshot(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const snapshot = value as Record<string, unknown>;
  return (
    typeof snapshot.source === "string" &&
    typeof snapshot.isComplete === "boolean" &&
    Array.isArray(snapshot.warnings) &&
    snapshot.warnings.every((warning) => typeof warning === "string") &&
    typeof snapshot.rows === "number" &&
    (snapshot.start === null || typeof snapshot.start === "string") &&
    (snapshot.end === null || typeof snapshot.end === "string") &&
    typeof snapshot.hash === "string" &&
    Array.isArray(snapshot.bars) &&
    snapshot.bars.every(isMarketKlineBar)
  );
}

function isResearchRunAiReport(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const report = value as Record<string, unknown>;
  return (
    typeof report.summary === "string" &&
    Array.isArray(report.risks) &&
    report.risks.every((risk) => typeof risk === "string") &&
    Array.isArray(report.improvements) &&
    report.improvements.every((improvement) => typeof improvement === "string") &&
    typeof report.disclaimer === "string"
  );
}

function isResearchRunStrategyConfig(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const config = value as Record<string, unknown>;
  return (
    typeof config.name === "string" &&
    typeof config.revision === "string" &&
    isMarket(config.market) &&
    Array.isArray(config.symbols) &&
    config.symbols.every((symbol) => typeof symbol === "string") &&
    isTimeframe(config.timeframe) &&
    typeof config.version === "number" &&
    Array.isArray(config.entryConditions) &&
    config.entryConditions.every(isResearchRunStrategyCondition) &&
    Array.isArray(config.exitConditions) &&
    config.exitConditions.every(isResearchRunStrategyCondition) &&
    isResearchRunStrategyRisk(config.risk)
  );
}

function isResearchRunStrategyCondition(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const condition = value as Record<string, unknown>;
  return typeof condition.kind === "string" && isPlainRecord(condition.params);
}

function isResearchRunStrategyRisk(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const risk = value as Record<string, unknown>;
  return (
    isNullableNumber(risk.positionPct) &&
    isNullableNumber(risk.stopLossPct) &&
    isNullableNumber(risk.takeProfitPct) &&
    isNullableNumber(risk.maxDrawdownPct)
  );
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNullableNumber(value: unknown): boolean {
  return value === null || typeof value === "number";
}

function isResearchRunDataQuality(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const quality = value as Record<string, unknown>;
  return (
    typeof quality.source === "string" &&
    typeof quality.isComplete === "boolean" &&
    Array.isArray(quality.warnings) &&
    quality.warnings.every((warning) => typeof warning === "string") &&
    typeof quality.rows === "number"
  );
}

function isBacktestDiagnostic(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const diagnostic = value as Record<string, unknown>;
  return (
    typeof diagnostic.id === "string" &&
    typeof diagnostic.label === "string" &&
    typeof diagnostic.value === "string" &&
    typeof diagnostic.detail === "string" &&
    (diagnostic.tone === "positive" ||
      diagnostic.tone === "warning" ||
      diagnostic.tone === "neutral" ||
      diagnostic.tone === "risk")
  );
}

function isBacktestEquityPoint(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const point = value as Record<string, unknown>;
  return typeof point.timestamp === "string" && typeof point.equity === "number";
}

function isBacktestTradeRow(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.timestamp === "string" &&
    typeof row.symbol === "string" &&
    (row.side === "BUY" || row.side === "SELL" || row.side === "RISK" || row.side === "HOLD") &&
    (row.status === "filled" || row.status === "open" || row.status === "review" || row.status === "blocked") &&
    typeof row.price === "string" &&
    typeof row.quantity === "string" &&
    typeof row.exposure === "string" &&
    typeof row.pnl === "string" &&
    typeof row.reason === "string" &&
    (row.tone === "positive" || row.tone === "warning" || row.tone === "neutral" || row.tone === "risk")
  );
}

function isBacktestAssumptions(value: unknown): value is BacktestAssumptions {
  if (!value || typeof value !== "object") {
    return false;
  }
  const assumptions = value as Partial<BacktestAssumptions>;
  return (
    typeof assumptions.initialCash === "number" &&
    typeof assumptions.feeBps === "number" &&
    typeof assumptions.slippageBps === "number"
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
