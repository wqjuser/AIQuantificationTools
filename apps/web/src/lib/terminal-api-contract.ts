import type {
  BacktestAssumptions,
  Market,
  Timeframe
} from "./terminal-workbench";

export interface MarketKlineBar {
  timestamp: string;
  timestampMs: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketAiSelectionResearchOrigin {
  selectionId: string;
  candidateEvidenceId: string;
}

export interface TerminalResearchParams {
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  limit?: number;
  end?: string;
  watchlistRefreshRunId?: string | null;
  selectionOrigin?: MarketAiSelectionResearchOrigin | null;
}

export function isResearchRunStrategyConfig(value: unknown): boolean {
  if (!isPlainRecord(value)) {
    return false;
  }
  return (
    typeof value.name === "string" &&
    typeof value.revision === "string" &&
    isMarket(value.market) &&
    Array.isArray(value.symbols) &&
    value.symbols.every((symbol) => typeof symbol === "string") &&
    isTimeframe(value.timeframe) &&
    typeof value.version === "number" &&
    Array.isArray(value.entryConditions) &&
    value.entryConditions.every(isResearchRunStrategyCondition) &&
    Array.isArray(value.exitConditions) &&
    value.exitConditions.every(isResearchRunStrategyCondition) &&
    isResearchRunStrategyRisk(value.risk)
  );
}

export function isBacktestAssumptions(value: unknown): value is BacktestAssumptions {
  return (
    isPlainRecord(value) &&
    typeof value.initialCash === "number" &&
    typeof value.feeBps === "number" &&
    typeof value.slippageBps === "number"
  );
}

export function isMarketKlineBar(value: unknown): value is MarketKlineBar {
  return (
    isPlainRecord(value) &&
    typeof value.timestamp === "string" &&
    typeof value.timestampMs === "number" &&
    typeof value.open === "number" &&
    typeof value.high === "number" &&
    typeof value.low === "number" &&
    typeof value.close === "number" &&
    typeof value.volume === "number"
  );
}

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isMarket(value: unknown): value is Market {
  return value === "ashare" || value === "us" || value === "crypto";
}

export function isTimeframe(value: unknown): value is Timeframe {
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

function isResearchRunStrategyCondition(value: unknown): boolean {
  return isPlainRecord(value) && typeof value.kind === "string" && isPlainRecord(value.params);
}

function isResearchRunStrategyRisk(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    isNullableNumber(value.positionPct) &&
    isNullableNumber(value.stopLossPct) &&
    isNullableNumber(value.takeProfitPct) &&
    isNullableNumber(value.maxDrawdownPct)
  );
}

function isNullableNumber(value: unknown): boolean {
  return value === null || typeof value === "number";
}
