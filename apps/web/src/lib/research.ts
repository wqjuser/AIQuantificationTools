export type Market = "ashare" | "us" | "crypto";
export type Timeframe = "1d" | "1m" | "5m" | "15m" | "30m" | "60m";

export interface BacktestMetrics {
  total_return_pct: number;
  annual_return_pct: number;
  max_drawdown_pct: number;
  win_rate_pct: number;
  profit_factor: number;
  trade_count: number;
}

export interface Trade {
  side: "buy" | "sell";
  timestamp?: string;
  price?: number;
  quantity?: number;
  reason?: string;
}

export interface EquityPoint {
  timestamp: string;
  equity: number;
}

export interface Bar {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DemoPayload {
  quality?: {
    source: string;
    is_complete: boolean;
    warnings: string[];
    rows: number;
  };
  strategy: {
    name: string;
    revision: string;
  };
  backtest: {
    metrics: BacktestMetrics;
    trades: Trade[];
    equity_curve?: EquityPoint[];
  };
  aiReport: {
    summary?: string;
    risks: string[];
    improvements: string[];
    disclaimer?: string;
  };
  bars?: Bar[];
}

export function buildDemoUrl(baseUrl: string, market: Market, symbol: string, timeframe: Timeframe): string {
  const url = new URL("/api/demo", baseUrl.replace(/\/+$/, ""));
  url.searchParams.set("market", market);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("timeframe", timeframe);
  return url.toString();
}

export function formatPct(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function marketLabel(market: Market): string {
  const labels: Record<Market, string> = {
    ashare: "A 股",
    us: "美股",
    crypto: "加密货币"
  };
  return labels[market];
}

export function summarizeBacktest(payload: DemoPayload) {
  return {
    title: payload.strategy.name,
    revision: payload.strategy.revision,
    totalReturn: formatPct(payload.backtest.metrics.total_return_pct),
    maxDrawdown: formatPct(payload.backtest.metrics.max_drawdown_pct),
    tradeCount: payload.backtest.metrics.trade_count,
    riskCount: payload.aiReport.risks.length
  };
}

export function lastUpdatedLabel(timestamp?: string): string {
  if (!timestamp) {
    return "尚未同步";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(timestamp));
}
