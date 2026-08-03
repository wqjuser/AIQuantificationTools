import type { WorkflowRunState } from "../audit/execution-contracts";
import { formatPct, formatSignedPct, freshResearchContext } from "./workspace-audit-formatters";
import type { ResearchRunAudit, TerminalWorkspace } from "./workspace-contracts";
import { activeQuantLoopStepId, buildPrimaryQuantLoopSteps, strategyTemplateOptions } from "./workspace-contracts";
import type { DecisionLogEntry } from "../portfolio/paper-contracts";
import { normalizeWatchlistCacheRefreshRunId } from "../research/readiness-builders";
import type { ResearchRunStrategyCondition, ResearchRunStrategyRisk } from "../research/workspace-contracts";
import type { ResearchRunSummary } from "../stage1/archive-contracts";
import type { Market, MarketAiSelectionResearchOriginUrlState, ProductWorkAreaId, ProductWorkAreaSelection, ResearchContextUrlState, ResearchWorkspaceStateDraft, ResearchWorkspaceStateSnapshot, Stage1ResearchWorkspaceId, Timeframe } from "../stage1/foundation-contracts";
import { resolveProductWorkAreaSelection } from "../stage1/platform-readiness";
import type { Instrument, StrategyField, StrategyLibraryDraftItem, StrategyRuleDraftField, StrategySnapshot, StrategyTemplateId } from "../stage1/review-contracts";
import { normalizeStrategyRuleDraft, normalizeStrategyWindow } from "../strategy/backtest-builders";
import { clearAuditedResearchResults } from "../strategy/comparison-builders";
import { buildStrategyRuleDraft, normalizeBacktestAssumptions, strategySnapshotFromRuleDraft, strategySnapshotFromStrategyConfig } from "../strategy/experiment-builders";

export function formatInstrumentPrice(value: number | null | undefined): string {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "N/A";
  }
  return Math.abs(value) >= 1 || value === 0
    ? value.toFixed(2)
    : value.toLocaleString("zh-CN", { maximumFractionDigits: 8 });
}

export function buildInstrumentFromSymbol(market: Market, rawSymbol: string): Instrument | null {
  const symbol = normalizeInstrumentSymbol(market, rawSymbol);
  if (!symbol) {
    return null;
  }
  return {
    symbol,
    name: symbol,
    market,
    changePct: 0
  };
}

export function watchlistIncludesInstrument(watchlist: Instrument[], instrument: Pick<Instrument, "market" | "symbol">): boolean {
  return watchlist.some((item) => item.market === instrument.market && item.symbol === instrument.symbol);
}

export function resolveAdapterWorkflowInstrument(workspace: TerminalWorkspace, market: Market): Instrument {
  return workspace.watchlist.find((instrument) => instrument.market === market) ?? workspace.selectedInstrument;
}

export function parseMarket(value: string | null | undefined): Market | null {
  const normalized = value?.trim().toLowerCase();
  return normalized === "ashare" || normalized === "us" || normalized === "crypto" ? normalized : null;
}

export function parseTimeframe(value: string | null | undefined): Timeframe | null {
  const normalized = value?.trim();
  return normalized === "1d" ||
    normalized === "1w" ||
    normalized === "1m" ||
    normalized === "5m" ||
    normalized === "15m" ||
    normalized === "30m" ||
    normalized === "60m"
    ? normalized
    : null;
}

export function normalizeInstrumentSymbol(market: Market, rawSymbol: string): string {
  const compact = rawSymbol.trim().toUpperCase().replace(/\s+/g, "");
  if (!compact) {
    return "";
  }
  if (market === "ashare") {
    return compact
      .replace(/^(SH|SZ|SSE|SZSE|CN:)/, "")
      .replace(/\.(SH|SZ|SS|SSE|SZSE)$/u, "");
  }
  if (market === "crypto") {
    const withSlash = compact.replace("-", "/");
    if (withSlash.includes("/")) {
      return withSlash;
    }
    if (withSlash.endsWith("USDT") && withSlash.length > 4) {
      return `${withSlash.slice(0, -4)}/USDT`;
    }
  }
  return compact;
}

export function resolveMarketSearchMarket(currentMarket: Market, rawQuery: string): Market {
  const query = rawQuery.trim().toUpperCase().replace(/\s+/g, "");
  if (/^(?:SH|SZ|SSE|SZSE|CN:)?\d{1,6}(?:\.(?:SH|SZ|SS|SSE|SZSE))?$/.test(query)) {
    return "ashare";
  }
  if (/[\u3400-\u9fff]/u.test(query)) {
    return "ashare";
  }
  if (query.includes("/") || query.includes("-") || (query.length > 4 && query.endsWith("USDT"))) {
    return "crypto";
  }
  return /^[A-Z]{1,5}(?:\.[A-Z])?$/.test(query) ? "us" : currentMarket;
}

export function workspaceFromResearchRunAudit(
  currentWorkspace: TerminalWorkspace,
  run: ResearchRunAudit
): TerminalWorkspace {
  const instrument = currentWorkspace.watchlist.find(
    (candidate) => candidate.symbol === run.symbol && candidate.market === run.market
  ) ?? {
    symbol: run.symbol,
    name: run.symbol,
    market: run.market,
    changePct: 0
  };
  const researchRun: ResearchRunSummary = {
    runId: run.runId,
    createdAt: run.createdAt,
    market: run.market,
    symbol: run.symbol,
    timeframe: run.timeframe,
    strategyRevision: run.strategyRevision,
    dataRows: run.dataRows,
    executionMode: run.executionMode,
    dataQuality: run.dataQuality,
    dataSnapshot: run.dataSnapshot,
    researchNote: run.researchNote,
    strategyConfig: run.strategyConfig
  };
  return {
    ...currentWorkspace,
    selectedInstrument: instrument,
    selectedTimeframe: run.timeframe,
    quantLoop: buildPrimaryQuantLoopSteps(activeQuantLoopStepId(currentWorkspace), true),
    backtestAssumptions: normalizeBacktestAssumptions(run.backtestAssumptions),
    strategy: strategySnapshotFromAudit(run),
    metrics: [
      {
        label: "Return",
        value: formatSignedPct(run.metrics.total_return_pct),
        tone: run.metrics.total_return_pct >= 0 ? "positive" : "warning"
      },
      { label: "Max DD", value: formatPct(run.metrics.max_drawdown_pct), tone: "warning" },
      { label: "Win Rate", value: formatPct(run.metrics.win_rate_pct), tone: "neutral" },
      { label: "Trades", value: String(run.metrics.trade_count ?? 0), tone: "neutral" }
    ],
    decisionLog: decisionLogFromAudit(run),
    backtestTrades: run.backtestTrades ?? [],
    backtestEquityCurve: run.backtestEquityCurve ?? [],
    backtestDiagnostics: run.backtestDiagnostics ?? [],
    researchRun
  };
}

export function decisionLogFromAudit(run: ResearchRunAudit): DecisionLogEntry[] {
  if (run.decisions.length) {
    return run.decisions;
  }
  const report = run.aiReport;
  if (!report) {
    return [{ agent: "Audit", message: "No decision entries recorded for this run.", tone: "warning" }];
  }

  const entries: DecisionLogEntry[] = [];
  if (report.summary.trim()) {
    entries.push({ agent: "AI Summary", message: report.summary, tone: "ai" });
  }
  report.risks
    .filter((risk) => risk.trim())
    .forEach((risk) => entries.push({ agent: "Risk Manager", message: risk, tone: "risk" }));
  report.improvements
    .filter((improvement) => improvement.trim())
    .forEach((improvement) => entries.push({ agent: "Portfolio Manager", message: improvement, tone: "warning" }));
  if (report.disclaimer.trim()) {
    entries.push({ agent: "AI Boundary", message: report.disclaimer, tone: "ai" });
  }

  return entries.length ? entries : [{ agent: "Audit", message: "No decision entries recorded for this run.", tone: "warning" }];
}

export function strategySnapshotFromAudit(run: ResearchRunAudit): StrategySnapshot {
  if (!run.strategyConfig) {
    return {
      name: run.strategyName,
      entry: "Replay from audited research run",
      exit: `Original timeframe ${run.timeframe}`,
      position: `${run.dataRows} bars replayed`,
      risk: `Strategy revision ${run.strategyRevision}; execution ${run.executionMode}`
    };
  }
  return strategySnapshotFromStrategyConfig(run.strategyConfig);
}

export function formatStrategyConditions(conditions: ResearchRunStrategyCondition[]): string {
  if (!conditions.length) {
    return "No structured condition";
  }
  return conditions.map((condition) => formatStrategyCondition(condition)).join(" AND ");
}

export function formatStrategyCondition(condition: ResearchRunStrategyCondition): string {
  const window = Number(condition.params["window"]);
  if (condition.kind === "close_above_sma" && Number.isFinite(window)) {
    return `Close > SMA${window}`;
  }
  if (condition.kind === "close_below_sma" && Number.isFinite(window)) {
    return `Close < SMA${window}`;
  }
  if (condition.kind === "volume_above_sma" && Number.isFinite(window)) {
    return `Volume > VOL${window}`;
  }
  if ((condition.kind === "rsi_below" || condition.kind === "rsi_above") && Number.isFinite(window)) {
    const threshold = Number(condition.params["threshold"]);
    if (Number.isFinite(threshold)) {
      return `RSI${window} ${condition.kind === "rsi_below" ? "<" : ">"} ${formatConditionNumber(threshold)}`;
    }
  }
  const params = Object.entries(condition.params)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(", ");
  return params ? `${condition.kind}(${params})` : condition.kind;
}

export function strategyEntryParameter(text: string, entryWindow: number): string {
  return strategyConditionParameter(text, entryWindow);
}

export function strategyExitParameter(text: string, exitWindow: number): string {
  return strategyConditionParameter(text, exitWindow);
}

export function strategyConditionParameter(text: string, smaWindow: number): string {
  const parts: string[] = [];
  if (hasSmaConditionText(text) || !hasKnownIndicatorText(text)) {
    parts.push(`SMA${smaWindow}`);
  }
  const rsiCondition = inferRsiCondition(text);
  if (rsiCondition) {
    parts.push(`RSI${rsiCondition.window}${rsiCondition.operator}${formatConditionNumber(rsiCondition.threshold)}`);
  }
  const volumeWindow = inferVolumeWindow(text);
  if (volumeWindow !== null) {
    parts.push(`VOL${volumeWindow}`);
  }
  return parts.join(" / ");
}

export function hasKnownIndicatorText(text: string): boolean {
  return hasSmaConditionText(text) || inferRsiCondition(text) !== null || inferVolumeWindow(text) !== null;
}

export function hasSmaConditionText(text: string): boolean {
  const normalized = text.toLowerCase();
  const smaIndex = normalized.search(/sma\s*\d*/u);
  if (smaIndex < 0) {
    return false;
  }
  if (/(?:close|price|收盘价|收盘)\s*(?:<=|>=|<|>|above|below|over|under|高于|大于|低于|小于)\s*sma\s*\d*/u.test(normalized)) {
    return true;
  }
  if (normalized.includes("rsi") || normalized.includes("相对强弱")) {
    return false;
  }
  const volumeIndexCandidates = [normalized.indexOf("volume"), normalized.indexOf("vol"), normalized.indexOf("成交量")].filter(
    (index) => index >= 0
  );
  const firstVolumeIndex = volumeIndexCandidates.length ? Math.min(...volumeIndexCandidates) : -1;
  return firstVolumeIndex < 0 || firstVolumeIndex > smaIndex;
}

export function inferRsiCondition(text: string): { window: number; operator: "<" | ">"; threshold: number } | null {
  const normalized = text.toLowerCase();
  if (!normalized.includes("rsi") && !normalized.includes("相对强弱")) {
    return null;
  }
  const windowMatch = normalized.match(/rsi\s*(\d+)/u);
  const window = normalizeStrategyWindow(windowMatch ? Number(windowMatch[1]) : 14);
  const belowMatch = normalized.match(/rsi\s*\d*\s*(?:<=|<|below|under|低于|小于)\s*(\d+(?:\.\d+)?)/u);
  if (belowMatch) {
    return { window, operator: "<", threshold: Number(belowMatch[1]) };
  }
  const aboveMatch = normalized.match(/rsi\s*\d*\s*(?:>=|>|above|over|高于|大于)\s*(\d+(?:\.\d+)?)/u);
  if (aboveMatch) {
    return { window, operator: ">", threshold: Number(aboveMatch[1]) };
  }
  if (normalized.includes("rebound") || normalized.includes("反弹") || normalized.includes("超卖")) {
    return { window, operator: "<", threshold: 30 };
  }
  return null;
}

export function inferVolumeWindow(text: string): number | null {
  const normalized = text.toLowerCase();
  if (!normalized.includes("volume") && !normalized.includes("vol") && !normalized.includes("成交量")) {
    return null;
  }
  const match = normalized.match(/(?:volume|vol|成交量).*?(?:sma|ma|均线|vol)\s*(\d+)/u);
  return match ? normalizeStrategyWindow(Number(match[1])) : 20;
}

export function formatConditionNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/u, "").replace(/\.$/u, "");
}

export function formatStrategyRisk(risk: ResearchRunStrategyRisk): string {
  const parts = [
    risk.stopLossPct === null ? null : `Stop ${formatFractionPct(risk.stopLossPct)}`,
    risk.takeProfitPct === null ? null : `take profit ${formatFractionPct(risk.takeProfitPct)}`,
    risk.maxDrawdownPct === null ? null : `max drawdown ${formatFractionPct(risk.maxDrawdownPct)}`
  ].filter((part): part is string => Boolean(part));
  return parts.length ? parts.join(" / ") : "No structured risk guardrail";
}

export function formatFractionPct(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function buildAuditReplayWorkflowState(run: ResearchRunAudit): WorkflowRunState {
  return {
    activeStageId: "execution",
    completedStageIds: ["data", "factor", "backtest", "agent"],
    log: [
      {
        id: `replay-${run.runId}-data`,
        stageId: "data",
        level: run.dataQuality && !run.dataQuality.isComplete ? "warning" : "success",
        message: auditDataSnapshotMessage(run)
      },
      {
        id: `replay-${run.runId}-factor`,
        stageId: "factor",
        level: "success",
        message: `Strategy revision restored: ${run.strategyRevision}`
      },
      {
        id: `replay-${run.runId}-backtest`,
        stageId: "backtest",
        level: "success",
        message: `Audit replay loaded: ${run.dataRows} bars · ${run.executionMode}`
      },
      {
        id: `replay-${run.runId}-agent`,
        stageId: "agent",
        level: "success",
        message: `Decision notes restored: ${run.decisions.length}`
      },
      {
        id: `replay-${run.runId}-execution`,
        stageId: "execution",
        level: "warning",
        message: `Execution mode restored: ${run.executionMode}; live gates remain controlled locally`
      }
    ]
  };
}

export function auditDataSnapshotMessage(run: ResearchRunAudit): string {
  const base = `Audit data snapshot restored: ${run.symbol} · ${run.timeframe} · ${run.dataRows} bars`;
  if (!run.dataQuality) {
    return base;
  }
  const warningCount = run.dataQuality.warnings.length;
  const warningLabel = warningCount === 1 ? "1 warning" : `${warningCount} warnings`;
  return warningCount > 0
    ? `${base} · source ${run.dataQuality.source} · ${warningLabel}`
    : `${base} · source ${run.dataQuality.source}`;
}

export function workspaceWithSelectedInstrument(
  currentWorkspace: TerminalWorkspace,
  instrument: Instrument
): TerminalWorkspace {
  const existingInstrument = currentWorkspace.watchlist.find(
    (candidate) => candidate.symbol === instrument.symbol && candidate.market === instrument.market
  );
  const hasIncomingQuote =
    instrument.price !== undefined ||
    instrument.quoteSource !== undefined ||
    instrument.quoteAsOf !== undefined;
  const selectedInstrument = existingInstrument
    ? {
        ...existingInstrument,
        ...instrument,
        name:
          instrument.name.trim() && instrument.name !== instrument.symbol
            ? instrument.name
            : existingInstrument.name,
        changePct: hasIncomingQuote ? instrument.changePct : existingInstrument.changePct,
        price: instrument.price !== undefined ? instrument.price : existingInstrument.price,
        quoteSource:
          instrument.quoteSource !== undefined ? instrument.quoteSource : existingInstrument.quoteSource,
        quoteAsOf: instrument.quoteAsOf !== undefined ? instrument.quoteAsOf : existingInstrument.quoteAsOf
      }
    : instrument;
  const watchlist = existingInstrument
    ? currentWorkspace.watchlist.map((candidate) =>
        candidate.symbol === instrument.symbol && candidate.market === instrument.market
          ? selectedInstrument
          : candidate
      )
    : [selectedInstrument, ...currentWorkspace.watchlist].slice(0, 8);

  return {
    ...freshResearchContext(currentWorkspace, selectedInstrument, currentWorkspace.selectedTimeframe),
    watchlist
  };
}

export function workspaceWithPortfolioPeerAuditInstrument(
  currentWorkspace: TerminalWorkspace,
  instrument: Instrument
): TerminalWorkspace {
  return {
    ...workspaceWithSelectedInstrument(currentWorkspace, instrument),
    strategy: { ...currentWorkspace.strategy }
  };
}

export function workspaceWithSavedWatchlist(
  currentWorkspace: TerminalWorkspace,
  savedWatchlist: Instrument[]
): TerminalWorkspace {
  if (!savedWatchlist.length) {
    return currentWorkspace;
  }
  const selectedInstrument =
    savedWatchlist.find(
      (instrument) =>
        instrument.market === currentWorkspace.selectedInstrument.market &&
        instrument.symbol === currentWorkspace.selectedInstrument.symbol
    ) ?? currentWorkspace.selectedInstrument;
  return {
    ...currentWorkspace,
    selectedInstrument,
    watchlist: savedWatchlist
  };
}

export function workspaceWithSavedResearchWorkspaceState(
  currentWorkspace: TerminalWorkspace,
  savedState: ResearchWorkspaceStateSnapshot
): TerminalWorkspace {
  return {
    ...currentWorkspace,
    researchWorkspaceState: savedState
  };
}

export function resolveResearchContextUrlState(
  search: string | URLSearchParams | null | undefined
): ResearchContextUrlState | null {
  if (!search) {
    return null;
  }
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const market = parseMarket(params.get("market"));
  const timeframe = parseTimeframe(params.get("timeframe"));
  if (!market || !timeframe) {
    return null;
  }
  const symbol = normalizeInstrumentSymbol(market, params.get("symbol") ?? "");
  if (!symbol) {
    return null;
  }
  return {
    market,
    symbol,
    timeframe
  };
}

export function resolveMarketAiSelectionResearchOriginUrlState(
  search: string | URLSearchParams | null | undefined
): MarketAiSelectionResearchOriginUrlState | null {
  if (!search) {
    return null;
  }
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const context = resolveResearchContextUrlState(params);
  const selectionIds = params.getAll("selectionId").map((value) => value.trim()).filter(Boolean);
  const evidenceIds = params
    .getAll("candidateEvidenceId")
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    !context
    || params.getAll("workspace").length !== 1
    || params.get("workspace") !== "research"
    || context.timeframe !== "1d"
    || selectionIds.length !== 1
    || evidenceIds.length !== 1
  ) {
    return null;
  }
  return {
    ...context,
    timeframe: "1d",
    selectionId: selectionIds[0],
    candidateEvidenceId: evidenceIds[0],
  };
}

export function buildResearchContextDeepLink(
  href: string,
  workspace: Pick<TerminalWorkspace, "selectedInstrument" | "selectedTimeframe">,
  workAreaId: "market" | "research" = "research",
  options: { watchlistRefreshRunId?: string | null } = {}
): string {
  const url = new URL(href);
  url.search = "";
  url.searchParams.set("workspace", workAreaId);
  url.searchParams.set("market", workspace.selectedInstrument.market);
  url.searchParams.set("symbol", workspace.selectedInstrument.symbol);
  url.searchParams.set("timeframe", workspace.selectedTimeframe);
  const watchlistRefreshRunId = normalizeWatchlistCacheRefreshRunId(options.watchlistRefreshRunId);
  if (watchlistRefreshRunId) {
    url.searchParams.set("watchlistRefreshRun", watchlistRefreshRunId);
  }
  return url.toString();
}

export function workspaceWithResearchContextUrlState(
  currentWorkspace: TerminalWorkspace,
  urlState: ResearchContextUrlState | null | undefined
): TerminalWorkspace {
  if (!urlState) {
    return currentWorkspace;
  }
  const instrument =
    currentWorkspace.watchlist.find(
      (candidate) => candidate.market === urlState.market && candidate.symbol === urlState.symbol
    ) ?? buildInstrumentFromSymbol(urlState.market, urlState.symbol);
  if (!instrument) {
    return currentWorkspace;
  }
  const instrumentWorkspace =
    currentWorkspace.selectedInstrument.market === instrument.market &&
    currentWorkspace.selectedInstrument.symbol === instrument.symbol
      ? currentWorkspace
      : workspaceWithSelectedInstrument(currentWorkspace, instrument);
  return instrumentWorkspace.selectedTimeframe === urlState.timeframe
    ? instrumentWorkspace
    : workspaceWithSelectedTimeframe(instrumentWorkspace, urlState.timeframe);
}

export function workspaceWithSelectedTimeframe(
  currentWorkspace: TerminalWorkspace,
  timeframe: Timeframe
): TerminalWorkspace {
  return freshResearchContext(currentWorkspace, currentWorkspace.selectedInstrument, timeframe);
}

export function workspaceWithAppliedResearchWorkspaceState(currentWorkspace: TerminalWorkspace): TerminalWorkspace {
  const savedState = currentWorkspace.researchWorkspaceState;
  if (!savedState) {
    return currentWorkspace;
  }
  const savedInstrument =
    currentWorkspace.watchlist.find(
      (instrument) => instrument.market === savedState.market && instrument.symbol === savedState.symbol
    ) ?? {
      market: savedState.market,
      symbol: savedState.symbol,
      name: savedState.name || savedState.symbol,
      changePct: 0
    };
  const sameInstrument =
    currentWorkspace.selectedInstrument.market === savedInstrument.market &&
    currentWorkspace.selectedInstrument.symbol === savedInstrument.symbol;
  const instrumentWorkspace = sameInstrument
    ? currentWorkspace
    : workspaceWithSelectedInstrument(currentWorkspace, savedInstrument);
  const timeframeWorkspace =
    instrumentWorkspace.selectedTimeframe === savedState.timeframe
      ? instrumentWorkspace
      : workspaceWithSelectedTimeframe(instrumentWorkspace, savedState.timeframe);
  return {
    ...timeframeWorkspace,
    researchWorkspaceState: savedState
  };
}

export function buildResearchWorkspaceStateDraft(
  workspace: TerminalWorkspace,
  activeWorkAreaId: ProductWorkAreaId
): ResearchWorkspaceStateDraft {
  const workspaceId: Stage1ResearchWorkspaceId =
    activeWorkAreaId === "market" || activeWorkAreaId === "research" ? activeWorkAreaId : "research";
  return {
    market: workspace.selectedInstrument.market,
    symbol: workspace.selectedInstrument.symbol,
    name: workspace.selectedInstrument.name,
    timeframe: workspace.selectedTimeframe,
    workspaceId
  };
}

export function researchWorkspaceStateMatchesDraft(
  savedState: ResearchWorkspaceStateSnapshot | null | undefined,
  draft: ResearchWorkspaceStateDraft
): boolean {
  return Boolean(
    savedState &&
      savedState.market === draft.market &&
      savedState.symbol === draft.symbol &&
      savedState.timeframe === draft.timeframe &&
      savedState.workspaceId === draft.workspaceId
  );
}

export function resolveSavedResearchWorkspaceId(
  workspace: TerminalWorkspace,
  fallback: Stage1ResearchWorkspaceId
): Stage1ResearchWorkspaceId {
  const workspaceId = workspace.researchWorkspaceState?.workspaceId;
  return workspaceId === "market" || workspaceId === "research" ? workspaceId : fallback;
}

export function resolveSavedResearchWorkspaceSelection(
  workspace: TerminalWorkspace,
  fallback: Stage1ResearchWorkspaceId
): ProductWorkAreaSelection {
  return resolveProductWorkAreaSelection(workspace, resolveSavedResearchWorkspaceId(workspace, fallback));
}

export function workspaceWithStrategyLibraryItem(
  currentWorkspace: TerminalWorkspace,
  item: StrategyLibraryDraftItem
): TerminalWorkspace {
  const existingInstrument = currentWorkspace.watchlist.find(
    (candidate) => candidate.market === item.market && candidate.symbol === item.symbol
  );
  const selectedInstrument: Instrument = existingInstrument ?? {
    market: item.market,
    symbol: item.symbol,
    name: item.name || item.symbol,
    changePct: 0
  };
  const watchlist = [
    selectedInstrument,
    ...currentWorkspace.watchlist.filter(
      (candidate) => candidate.market !== item.market || candidate.symbol !== item.symbol
    )
  ].slice(0, 8);
  const auditDetail = item.auditRunId
    ? `Archived audit run ${item.auditRunId} remains read-only; `
    : "";
  const note: DecisionLogEntry = {
    agent: "Strategy Library",
    message: `Strategy revision ${item.revision} loaded for ${item.symbol} ${item.timeframe}. ${auditDetail}Run Pipeline to generate a fresh audited backtest.`,
    tone: "warning"
  };
  const existingLog =
    currentWorkspace.decisionLog[0]?.agent === "Strategy Library"
      ? currentWorkspace.decisionLog.slice(1)
      : currentWorkspace.decisionLog;

  return clearAuditedResearchResults(
    {
      ...currentWorkspace,
      selectedInstrument,
      selectedTimeframe: item.timeframe,
      watchlist,
      strategy: item.strategySnapshot,
      decisionLog: [note, ...existingLog]
    },
    "strategy"
  );
}

export function workspaceWithStrategyField(
  currentWorkspace: TerminalWorkspace,
  field: StrategyField,
  value: string
): TerminalWorkspace {
  const note: DecisionLogEntry = {
    agent: "Strategy Editor",
    message: `Strategy field ${field} updated locally. Run Pipeline to generate a fresh audited backtest.`,
    tone: "warning"
  };
  const existingLog =
    currentWorkspace.decisionLog[0]?.agent === "Strategy Editor"
      ? currentWorkspace.decisionLog.slice(1)
      : currentWorkspace.decisionLog;
  return {
    ...currentWorkspace,
    strategy: {
      ...currentWorkspace.strategy,
      [field]: value
    },
    quantLoop: buildPrimaryQuantLoopSteps("strategy", false),
    metrics: [
      { label: "Return", value: "N/A", tone: "neutral" },
      { label: "Max DD", value: "N/A", tone: "warning" },
      { label: "Win Rate", value: "N/A", tone: "neutral" },
      { label: "Trades", value: "0", tone: "neutral" }
    ],
    decisionLog: [note, ...existingLog],
    researchRun: null
  };
}

export function workspaceWithStrategyRuleDraftField(
  currentWorkspace: TerminalWorkspace,
  field: StrategyRuleDraftField,
  value: number | string | boolean
): TerminalWorkspace {
  const currentDraft = buildStrategyRuleDraft(currentWorkspace);
  const nextDraft = normalizeStrategyRuleDraft({
    ...currentDraft,
    [field]:
      field === "name" || field === "entryKind" || field === "exitKind"
        ? String(value)
        : field === "entryVolumeConfirm" || field === "entryRsiConfirm"
          ? Boolean(value)
          : Number(value)
  });
  const nextStrategy = strategySnapshotFromRuleDraft(nextDraft);
  const note: DecisionLogEntry = {
    agent: "Strategy Builder",
    message: `Structured strategy field ${field} updated locally. Run Pipeline to generate a fresh audited backtest.`,
    tone: "warning"
  };
  const existingLog =
    currentWorkspace.decisionLog[0]?.agent === "Strategy Builder"
      ? currentWorkspace.decisionLog.slice(1)
      : currentWorkspace.decisionLog;

  return {
    ...clearAuditedResearchResults(
      {
        ...currentWorkspace,
        strategy: nextStrategy,
        decisionLog: [note, ...existingLog]
      },
      "strategy"
    )
  };
}

export function workspaceWithStrategyTemplate(
  currentWorkspace: TerminalWorkspace,
  templateId: StrategyTemplateId
): TerminalWorkspace {
  const template = strategyTemplateOptions.find((candidate) => candidate.id === templateId);
  if (!template) {
    return currentWorkspace;
  }

  const nextStrategy = strategySnapshotFromRuleDraft(template.draft);
  const note: DecisionLogEntry = {
    agent: "Strategy Template",
    message: `Strategy template ${template.name} applied locally. Run Pipeline to generate a fresh audited backtest.`,
    tone: "warning"
  };
  const existingLog =
    currentWorkspace.decisionLog[0]?.agent === "Strategy Template"
      ? currentWorkspace.decisionLog.slice(1)
      : currentWorkspace.decisionLog;

  return clearAuditedResearchResults(
    {
      ...currentWorkspace,
      strategy: nextStrategy,
      decisionLog: [note, ...existingLog]
    },
    "strategy"
  );
}
