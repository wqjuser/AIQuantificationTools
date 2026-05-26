import { describe, expect, test } from "vitest";
import { buildDemoUrl, formatPct, marketLabel, summarizeBacktest } from "./research";

describe("research helpers", () => {
  test("builds demo API URLs with encoded market parameters", () => {
    expect(buildDemoUrl("http://127.0.0.1:8765", "crypto", "BTC/USDT", "1m")).toBe(
      "http://127.0.0.1:8765/api/demo?market=crypto&symbol=BTC%2FUSDT&timeframe=1m"
    );
  });

  test("formats percentages with signs and empty state", () => {
    expect(formatPct(12.345)).toBe("+12.35%");
    expect(formatPct(-4.2)).toBe("-4.20%");
    expect(formatPct(undefined)).toBe("N/A");
  });

  test("labels all first-version markets", () => {
    expect(marketLabel("ashare")).toBe("A 股");
    expect(marketLabel("us")).toBe("美股");
    expect(marketLabel("crypto")).toBe("加密货币");
  });

  test("summarizes a backtest payload without inventing metrics", () => {
    expect(
      summarizeBacktest({
        strategy: { name: "SMA trend demo", revision: "abc123" },
        backtest: {
          metrics: {
            total_return_pct: 6.12,
            annual_return_pct: 9.1,
            max_drawdown_pct: 3.2,
            win_rate_pct: 50,
            profit_factor: 1.3,
            trade_count: 4
          },
          trades: [{ side: "buy" }, { side: "sell" }]
        },
        aiReport: { risks: ["样本较少"], improvements: [] }
      })
    ).toEqual({
      title: "SMA trend demo",
      revision: "abc123",
      totalReturn: "+6.12%",
      maxDrawdown: "+3.20%",
      tradeCount: 4,
      riskCount: 1
    });
  });
});
