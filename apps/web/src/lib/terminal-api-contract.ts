import type {
  BacktestAssumptions,
  Market,
  Timeframe
} from "./terminal-workbench";

export interface AuditEventRecord {
  schemaVersion: 1;
  eventId: string;
  eventType: string;
  runId: string | null;
  createdAt: string;
  stage: string;
  source: string;
  summary: string;
  detail: string;
  metadata: Record<string, unknown>;
}

export interface PaperExecutionAccount {
  cash: number;
  positions: Record<string, number>;
  equity: number;
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

export function isAuditEventRecord(value: unknown): value is AuditEventRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as Partial<AuditEventRecord>;
  return (
    event.schemaVersion === 1 &&
    typeof event.eventId === "string" &&
    typeof event.eventType === "string" &&
    (event.runId === null || typeof event.runId === "string") &&
    typeof event.createdAt === "string" &&
    typeof event.stage === "string" &&
    typeof event.source === "string" &&
    typeof event.summary === "string" &&
    typeof event.detail === "string" &&
    isPlainRecord(event.metadata)
  );
}

export function isPaperExecutionAccount(value: unknown): value is PaperExecutionAccount {
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

export function isSecretFreeRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return Object.entries(value as Record<string, unknown>).every(([key, item]) => {
    if (isSecretLikeKey(key)) {
      return item === "[redacted]";
    }
    if (item && typeof item === "object") {
      return Array.isArray(item)
        ? item.every((entry) => !entry || typeof entry !== "object" || isSecretFreeRecord(entry))
        : isSecretFreeRecord(item);
    }
    return true;
  });
}

export function isNumberRecord(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((item) => typeof item === "number");
}

function isSecretLikeKey(key: string): boolean {
  const normalized = key.replace(/[_-]/g, "").toLowerCase();
  return ["secret", "token", "apikey", "privatekey", "password"].some((marker) => normalized.includes(marker));
}

export function hasExactObjectKeys(
  value: unknown,
  keys: readonly string[]
): value is Record<string, unknown> {
  return isPlainRecord(value)
    && Object.keys(value).length === keys.length
    && keys.every((key) => key in value);
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

export function isOptionalDataQualityContract(value: Record<string, unknown>): boolean {
  const coverage = value.coverage;
  const issues = value.issues ?? value.qualityIssues;
  return (
    (value.originSource === undefined || value.originSource === null || typeof value.originSource === "string") &&
    (value.observedAt === undefined || value.observedAt === null || typeof value.observedAt === "string") &&
    (value.marketTime === undefined || value.marketTime === null || typeof value.marketTime === "string") &&
    (value.calendarId === undefined || value.calendarId === null || typeof value.calendarId === "string") &&
    (value.adjustmentMode === undefined || typeof value.adjustmentMode === "string") &&
    (value.freshness === undefined || typeof value.freshness === "string") &&
    (value.canonicalHash === undefined || typeof value.canonicalHash === "string") &&
    (coverage === undefined ||
      (isPlainRecord(coverage) &&
        typeof coverage.actualRows === "number" &&
        typeof coverage.expectedRows === "number" &&
        typeof coverage.gapCount === "number" &&
        typeof coverage.ratio === "number")) &&
    (issues === undefined ||
      (Array.isArray(issues) &&
        issues.every(
          (issue) =>
            isPlainRecord(issue) &&
            typeof issue.code === "string" &&
            typeof issue.severity === "string" &&
            typeof issue.count === "number" &&
            typeof issue.message === "string"
        )))
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
