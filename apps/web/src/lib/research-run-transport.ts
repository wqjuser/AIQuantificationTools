import {
  resolveBacktestAssumptions,
  workspaceFromResearchRunAudit,
  workspaceWithPrimaryWorkflows,
  type BacktestAssumptions,
  type Market,
  type ResearchRunAudit,
  type ResearchRunDataPreparationEvidence,
  type StrategySnapshot,
  type TerminalWorkspace
} from "./terminal-workbench";
import {
  buildApiUrl,
  coreErrorDetail,
  defaultFetcher,
  resolveRequestOptions,
  type WorkspaceFetcher
} from "./terminal-api-http";
import {
  isBacktestAssumptions,
  isMarket,
  isMarketKlineBar,
  isOptionalDataQualityContract,
  isPlainRecord,
  isResearchRunStrategyConfig,
  isTimeframe,
  type TerminalResearchParams
} from "./terminal-api-contract";
import {
  isTerminalWorkspace,
  type ResearchTimeframe,
  type WorkspaceLoadResult,
  type WorkspaceSource
} from "./workspace-transport";
import {
  isProductionStrategyHandoffPayload,
  type ProductionStrategyHandoffResult
} from "./strategy-transport";

export interface ResearchRunHistoryResult {
  runs: ResearchRunAudit[];
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchRunDetailResult {
  run?: ResearchRunAudit;
  source: WorkspaceSource;
  error?: string;
}

export function buildResearchRunUrl(
  baseUrl: string,
  market: Market,
  symbol: string,
  timeframe: ResearchTimeframe,
  assumptions?: BacktestAssumptions,
  limit = 500,
  strategy?: StrategySnapshot,
  watchlistRefreshRunId?: string | null,
  end?: string | null
): string {
  return buildApiUrl(baseUrl, "api/research/run", (url) => {
    url.searchParams.set("market", market);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("timeframe", timeframe);
    url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 500))));
    if (end?.trim()) {
      url.searchParams.set("end", end.trim());
    }
    if (watchlistRefreshRunId?.trim()) {
      url.searchParams.set("watchlistRefreshRunId", watchlistRefreshRunId.trim());
    }
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
  });
}

export function buildResearchRunsUrl(baseUrl: string, limit: number): string {
  return buildApiUrl(baseUrl, "api/research/runs", (url) => {
    url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 50))));
  });
}

export function buildResearchRunDetailUrl(baseUrl: string, runId: string): string {
  return buildApiUrl(baseUrl, `api/research/runs/${encodeURIComponent(runId)}`);
}

export function buildResearchRunProductionStrategyHandoffUrl(baseUrl: string, runId: string): string {
  return buildApiUrl(baseUrl, `api/research/runs/${encodeURIComponent(runId)}/production-strategy-handoff`);
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
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunDetailResult> {
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  try {
    const response = await fetcher(buildResearchRunDetailUrl(baseUrl, runId), signal ? { signal } : undefined);
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

export async function loadResearchRunProductionStrategyHandoff(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ProductionStrategyHandoffResult> {
  try {
    const response = await fetcher(buildResearchRunProductionStrategyHandoffUrl(baseUrl, runId));
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error(response.ok
        ? "Invalid production strategy handoff contract"
        : `HTTP ${response.status ?? "error"}`);
    }
    if (!response.ok) {
      return {
        source: "core",
        error: coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`
      };
    }
    if (!isProductionStrategyHandoffPayload(payload)) {
      throw new Error("Invalid production strategy handoff contract");
    }
    return {
      handoff: payload.productionStrategyHandoff,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown production strategy handoff error"
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
        currentWorkspace.strategy,
        params.watchlistRefreshRunId,
        params.end
      )
    );
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error(response.ok
        ? "Invalid terminal research contract"
        : `HTTP ${response.status ?? "error"}`);
    }
    if (!response.ok) {
      throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
    }
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

export function isResearchRunAudit(value: unknown): value is ResearchRunAudit {
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
    (snapshot.hashVersion === undefined || snapshot.hashVersion === "aiqt-data-v2") &&
    typeof snapshot.source === "string" &&
    typeof snapshot.isComplete === "boolean" &&
    Array.isArray(snapshot.warnings) &&
    snapshot.warnings.every((warning) => typeof warning === "string") &&
    typeof snapshot.rows === "number" &&
    (snapshot.start === null || typeof snapshot.start === "string") &&
    (snapshot.end === null || typeof snapshot.end === "string") &&
    typeof snapshot.hash === "string" &&
    (snapshot.snapshotHash === undefined || typeof snapshot.snapshotHash === "string") &&
    Array.isArray(snapshot.bars) &&
    snapshot.bars.every(isMarketKlineBar) &&
    isOptionalDataQualityContract(snapshot) &&
    (snapshot.offlineReplay === undefined || isOfflineReplayEvidence(snapshot.offlineReplay)) &&
    (snapshot.sourceComparison === undefined || isSourceComparisonReport(snapshot.sourceComparison)) &&
    (snapshot.preparationEvidence === undefined ||
      isResearchRunDataPreparationEvidence(snapshot.preparationEvidence)) &&
    (snapshot.marketAiSelectionEvidence === undefined ||
      isResearchRunMarketAiSelectionEvidence(snapshot.marketAiSelectionEvidence))
  );
}

function isResearchRunMarketAiSelectionEvidence(value: unknown): boolean {
  if (!isPlainRecord(value)) {
    return false;
  }
  return (
    typeof value.selectionId === "string" &&
    typeof value.auditEventId === "string" &&
    typeof value.candidateEvidenceId === "string" &&
    typeof value.selectionRecordHash === "string" &&
    typeof value.candidateEvidenceHash === "string" &&
    typeof value.marketSnapshotHash === "string" &&
    isMarket(value.market) &&
    typeof value.symbol === "string" &&
    value.timeframe === "1d" &&
    (value.profile === "balanced" ||
      value.profile === "quality_growth" ||
      value.profile === "value" ||
      value.profile === "trend") &&
    (value.horizon === "short" || value.horizon === "medium" || value.horizon === "long") &&
    typeof value.horizonBars === "number" &&
    typeof value.rank === "number" &&
    (value.tier === "priority_research" ||
      value.tier === "watch" ||
      value.tier === "insufficient_evidence") &&
    typeof value.referenceAt === "string" &&
    typeof value.referencePrice === "number" &&
    typeof value.generatedAt === "string" &&
    value.researchOnly === true &&
    typeof value.recordHash === "string"
  );
}

export function isResearchRunDataPreparationEvidence(value: unknown): value is ResearchRunDataPreparationEvidence {
  if (!value || typeof value !== "object") {
    return false;
  }
  const evidence = value as Partial<ResearchRunDataPreparationEvidence>;
  return (
    evidence.kind === "watchlist_cache_refresh" &&
    typeof evidence.runId === "string" &&
    (evidence.createdAt === null || typeof evidence.createdAt === "string") &&
    isOptionalStringOrNull(evidence.overrideAuditEventId) &&
    isMarket(evidence.market) &&
    typeof evidence.symbol === "string" &&
    typeof evidence.name === "string" &&
    isTimeframe(evidence.timeframe) &&
    typeof evidence.status === "string" &&
    typeof evidence.requestedLimit === "number" &&
    typeof evidence.upsertedRows === "number" &&
    isResearchRunDataQuality(evidence.quality) &&
    (evidence.error === null || typeof evidence.error === "string")
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
    typeof quality.rows === "number" &&
    isOptionalDataQualityContract(quality)
  );
}

function isOfflineReplayEvidence(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    value.status === "verified" &&
    value.mode === "embedded_snapshot" &&
    typeof value.rows === "number" &&
    typeof value.canonicalHash === "string" &&
    value.networkRequired === false
  );
}

function isSourceComparisonReport(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    value.schemaVersion === 1 &&
    (value.status === "agreement" ||
      value.status === "warning" ||
      value.status === "blocked" ||
      value.status === "unavailable") &&
    typeof value.primarySource === "string" &&
    typeof value.secondarySource === "string" &&
    typeof value.primaryRows === "number" &&
    typeof value.secondaryRows === "number" &&
    typeof value.overlapRows === "number" &&
    typeof value.overlapRatio === "number" &&
    isPlainRecord(value.fields) &&
    Array.isArray(value.differences) &&
    value.valuesMerged === false &&
    (value.reason === null || typeof value.reason === "string") &&
    typeof value.reportHash === "string"
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
    (row.proposalId === undefined || row.proposalId === null || typeof row.proposalId === "string") &&
    (row.signalId === undefined || row.signalId === null || typeof row.signalId === "string") &&
    (row.snapshotHash === undefined || row.snapshotHash === null || typeof row.snapshotHash === "string") &&
    (row.tone === "positive" || row.tone === "warning" || row.tone === "neutral" || row.tone === "risk")
  );
}

function isOptionalStringOrNull(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}
