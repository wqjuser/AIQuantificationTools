import { describe, expect, test } from "vitest";
import { buildTerminalWorkspace, workspaceWithBacktestAssumption, workspaceWithStrategyField } from "./terminal-workbench";
import {
  buildResearchRunUrl,
  buildResearchRunDetailUrl,
  buildResearchRunExportUrl,
  buildResearchRunImportUrl,
  buildResearchRunPaperExecutionsUrl,
  buildResearchRunsUrl,
  buildMarketKlinesUrl,
  buildMarketSearchUrl,
  buildLoadingMarketKlinesResult,
  loadMarketKlines,
  loadMarketSearch,
  loadResearchRunDetail,
  loadResearchRunExport,
  loadLatestResearchRunPaperExecution,
  submitResearchRunPaperExecution,
  importResearchRunExport,
  marketKlinesFromResearchRunAudit,
  mergeMarketKlines,
  buildWorkspaceUrl,
  loadResearchRunHistory,
  loadTerminalWorkspace,
  resolveQuantCoreBaseUrl,
  runTerminalResearch
} from "./terminal-api";

describe("terminal workspace API client", () => {
  test("builds the local core workspace URL without duplicate slashes", () => {
    expect(buildWorkspaceUrl("http://127.0.0.1:8765/")).toBe("http://127.0.0.1:8765/api/workspace");
  });

  test("builds the research run URL with selected instrument context", () => {
    expect(buildResearchRunUrl("http://127.0.0.1:8765/", "ashare", "600000", "1d")).toBe(
      "http://127.0.0.1:8765/api/research/run?market=ashare&symbol=600000&timeframe=1d&limit=500"
    );
  });

  test("builds the research run URL with editable backtest assumptions", () => {
    expect(
      buildResearchRunUrl("http://127.0.0.1:8765/", "ashare", "600000", "1d", {
        initialCash: 250000,
        feeBps: 8,
        slippageBps: 4
      })
    ).toBe(
      "http://127.0.0.1:8765/api/research/run?market=ashare&symbol=600000&timeframe=1d&limit=500&initialCash=250000&feeBps=8&slippageBps=4"
    );
  });

  test("builds the research run URL with editable strategy snapshot fields", () => {
    const url = new URL(
      buildResearchRunUrl(
        "http://127.0.0.1:8765/",
        "ashare",
        "600000",
        "1d",
        undefined,
        500,
        {
          name: "Custom SMA risk plan",
          entry: "Close > SMA5",
          exit: "Close < SMA7",
          position: "25% cap per instrument",
          risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
        }
      )
    );

    expect(url.searchParams.get("strategyName")).toBe("Custom SMA risk plan");
    expect(url.searchParams.get("strategyEntry")).toBe("Close > SMA5");
    expect(url.searchParams.get("strategyExit")).toBe("Close < SMA7");
    expect(url.searchParams.get("strategyPosition")).toBe("25% cap per instrument");
    expect(url.searchParams.get("strategyRisk")).toBe("Stop -6%, take profit +12%, drawdown guard 9%, paper only");
  });

  test("builds the research run history URL with a bounded limit", () => {
    expect(buildResearchRunsUrl("http://127.0.0.1:8765/", 5)).toBe(
      "http://127.0.0.1:8765/api/research/runs?limit=5"
    );
  });

  test("builds the research run detail URL with an encoded run id", () => {
    expect(buildResearchRunDetailUrl("http://127.0.0.1:8765/", "run 你好/1")).toBe(
      "http://127.0.0.1:8765/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1"
    );
  });

  test("builds the research run export URL with an encoded run id", () => {
    expect(buildResearchRunExportUrl("http://127.0.0.1:8765/", "run 你好/1")).toBe(
      "http://127.0.0.1:8765/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1/export"
    );
  });

  test("builds the research run import URL", () => {
    expect(buildResearchRunImportUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/research/runs/import"
    );
  });

  test("builds the paper execution URL with an encoded run id", () => {
    expect(buildResearchRunPaperExecutionsUrl("http://127.0.0.1:8765/", "run 你好/1")).toBe(
      "http://127.0.0.1:8765/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1/paper-executions"
    );
  });

  test("builds the market klines URL with selected chart context", () => {
    expect(buildMarketKlinesUrl("http://127.0.0.1:8765/", "ashare", "600000", "1d", 160)).toBe(
      "http://127.0.0.1:8765/api/market/klines?market=ashare&symbol=600000&timeframe=1d&limit=160"
    );
  });

  test("builds the market klines URL with an optional end boundary for historical paging", () => {
    expect(
      buildMarketKlinesUrl("http://127.0.0.1:8765/", "ashare", "600000", "60m", 500, "2026-05-26T09:45:00.000Z")
    ).toBe(
      "http://127.0.0.1:8765/api/market/klines?market=ashare&symbol=600000&timeframe=60m&limit=500&end=2026-05-26T09%3A45%3A00.000Z"
    );
  });

  test("builds the market search URL with encoded Chinese query text", () => {
    expect(buildMarketSearchUrl("http://127.0.0.1:8765/", "ashare", "浦发", 8)).toBe(
      "http://127.0.0.1:8765/api/market/search?market=ashare&query=%E6%B5%A6%E5%8F%91&limit=8"
    );
  });

  test("builds an empty chart loading state for the newly selected symbol", () => {
    expect(buildLoadingMarketKlinesResult({ market: "ashare", symbol: "600004", timeframe: "1d" })).toEqual({
      market: "ashare",
      symbol: "600004",
      timeframe: "1d",
      bars: [],
      quality: {
        source: "loading",
        isComplete: false,
        warnings: [],
        rows: 0
      },
      source: "fallback"
    });
  });

  test("resolves the local core base URL from Vite environment with a default", () => {
    expect(resolveQuantCoreBaseUrl({ VITE_QUANT_API_BASE: "http://localhost:9999" })).toBe("http://localhost:9999");
    expect(resolveQuantCoreBaseUrl({})).toBe("http://127.0.0.1:8765");
  });

  test("loads the workspace contract from the Python core", async () => {
    const remoteWorkspace = {
      ...buildTerminalWorkspace(),
      schemaVersion: 1,
      selectedInstrument: {
        symbol: "AAPL",
        name: "Apple",
        market: "us",
        changePct: -0.36
      }
    };
    const calls: string[] = [];
    const result = await loadTerminalWorkspace("http://127.0.0.1:8765/", async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => remoteWorkspace
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/workspace"]);
    expect(result.source).toBe("core");
    expect(result.statusLabel).toBe("Core connected");
    expect(result.workspace.selectedInstrument.symbol).toBe("AAPL");
  });

  test("falls back to the bundled workspace when the Python core is unavailable", async () => {
    const result = await loadTerminalWorkspace("http://127.0.0.1:8765", async () => {
      throw new Error("offline");
    });

    expect(result.source).toBe("fallback");
    expect(result.statusLabel).toBe("Offline snapshot");
    expect(result.workspace.execution.liveEnabled).toBe(false);
    expect(result.workspace.selectedInstrument.symbol).toBe("600000");
  });

  test("runs terminal research and returns a core-backed workspace", async () => {
    const remoteWorkspace = {
      ...buildTerminalWorkspace(),
      schemaVersion: 1,
      metrics: [
        { label: "Return", value: "+3.20%", tone: "positive" },
        { label: "Max DD", value: "1.10%", tone: "warning" },
        { label: "Win Rate", value: "50.00%", tone: "neutral" },
        { label: "Trades", value: "8", tone: "neutral" }
      ]
    };
    const calls: string[] = [];
    const currentWorkspace = workspaceWithStrategyField(
      workspaceWithBacktestAssumption(
        workspaceWithBacktestAssumption(buildTerminalWorkspace(), "initialCash", 250000),
        "feeBps",
        8
      ),
      "entry",
      "Close > SMA5"
    );
    const result = await runTerminalResearch(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      workspaceWithBacktestAssumption(currentWorkspace, "slippageBps", 4),
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => remoteWorkspace
        };
      }
    );

    const requestUrl = new URL(calls[0]);
    expect(requestUrl.searchParams.get("market")).toBe("ashare");
    expect(requestUrl.searchParams.get("symbol")).toBe("600000");
    expect(requestUrl.searchParams.get("timeframe")).toBe("1d");
    expect(requestUrl.searchParams.get("limit")).toBe("500");
    expect(requestUrl.searchParams.get("initialCash")).toBe("250000");
    expect(requestUrl.searchParams.get("feeBps")).toBe("8");
    expect(requestUrl.searchParams.get("slippageBps")).toBe("4");
    expect(requestUrl.searchParams.get("strategyName")).toBe("SMA Trend / Bank Sector");
    expect(requestUrl.searchParams.get("strategyEntry")).toBe("Close > SMA5");
    expect(result.source).toBe("core");
    expect(result.statusLabel).toBe("Research run complete");
    expect(result.workspace.metrics[0].value).toBe("+3.20%");
  });

  test("keeps the current workspace when research run fails", async () => {
    const currentWorkspace = buildTerminalWorkspace();
    const result = await runTerminalResearch(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      currentWorkspace,
      async () => {
        throw new Error("core offline");
      }
    );

    expect(result.source).toBe("fallback");
    expect(result.statusLabel).toBe("Research run failed");
    expect(result.workspace).toBe(currentWorkspace);
    expect(result.error).toBe("core offline");
  });

  test("loads recent research run history from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunHistory("http://127.0.0.1:8765", 2, async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => ({
          runs: [
            {
              runId: "run-new",
              createdAt: "2026-05-26T08:00:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyName: "SMA trend demo",
              strategyRevision: "rev123",
              dataRows: 120,
              metrics: { total_return_pct: 3.4, trade_count: 8 },
              decisions: [],
              executionMode: "paper_only",
              aiReport: {
                summary: "SMA trend demo research summary",
                risks: ["Sample risk"],
                improvements: ["Compare benchmark"],
                disclaimer: "No investment advice"
              },
              dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 120 },
              strategyConfig: {
                name: "SMA trend demo",
                revision: "rev123",
                market: "ashare",
                symbols: ["600000"],
                timeframe: "1d",
                version: 1,
                entryConditions: [{ kind: "close_above_sma", params: { window: 20 } }],
                exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
                risk: { positionPct: 0.8, stopLossPct: 0.08, takeProfitPct: 0.18, maxDrawdownPct: 0.2 }
              },
              backtestAssumptions: { initialCash: 250000, feeBps: 8, slippageBps: 4 },
              backtestTrades: [
                {
                  id: "trade-1",
                  timestamp: "2026-05-26T08:00:00+00:00",
                  symbol: "600000",
                  side: "BUY",
                  status: "filled",
                  price: "9.20",
                  quantity: "2100",
                  exposure: "19.32%",
                  pnl: "-",
                  reason: "entry_conditions",
                  tone: "neutral"
                }
              ],
              backtestEquityCurve: [
                { timestamp: "2026-05-26T08:00:00+00:00", equity: 250000 },
                { timestamp: "2026-05-27T08:00:00+00:00", equity: 253400 }
              ],
              backtestDiagnostics: [
                {
                  id: "return-profile",
                  label: "Return profile",
                  value: "+3.40%",
                  detail: "Total return over 120 bars",
                  tone: "positive"
                }
              ]
            }
          ]
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs?limit=2"]);
    expect(result.source).toBe("core");
    expect(result.runs[0].runId).toBe("run-new");
    expect(result.runs[0].metrics.trade_count).toBe(8);
    expect(result.runs[0].aiReport?.summary).toBe("SMA trend demo research summary");
    expect(result.runs[0].aiReport?.risks[0]).toBe("Sample risk");
    expect(result.runs[0].aiReport?.improvements[0]).toBe("Compare benchmark");
    expect(result.runs[0].aiReport?.disclaimer).toBe("No investment advice");
    expect(result.runs[0].dataQuality).toEqual({ source: "tencent", isComplete: true, warnings: [], rows: 120 });
    expect(result.runs[0].strategyConfig?.entryConditions[0].params).toEqual({ window: 20 });
    expect(result.runs[0].strategyConfig?.risk.positionPct).toBe(0.8);
    expect(result.runs[0].backtestAssumptions).toEqual({ initialCash: 250000, feeBps: 8, slippageBps: 4 });
    expect(result.runs[0].backtestTrades?.[0]).toMatchObject({ id: "trade-1", side: "BUY" });
    expect(result.runs[0].backtestEquityCurve?.at(-1)?.equity).toBe(253400);
    expect(result.runs[0].backtestDiagnostics?.[0]).toMatchObject({ id: "return-profile", tone: "positive" });
  });

  test("loads one research run detail from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => ({
          run: {
            runId: "run-new",
            createdAt: "2026-05-26T08:00:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyName: "SMA trend demo",
            strategyRevision: "rev123",
            dataRows: 120,
            metrics: { total_return_pct: 3.4, trade_count: 8 },
            decisions: [],
            executionMode: "paper_only",
            aiReport: {
              summary: "SMA trend detail research summary",
              risks: ["Detail risk"],
              improvements: ["Review slippage"],
              disclaimer: "No investment advice"
            },
            dataSnapshot: {
              source: "tencent",
              isComplete: true,
              warnings: [],
              rows: 2,
              start: "2026-05-26T08:00:00+00:00",
              end: "2026-05-27T08:00:00+00:00",
              hash: "snapshot-detail",
              bars: [
                {
                  timestamp: "2026-05-26T08:00:00+00:00",
                  timestampMs: 1779782400000,
                  open: 9.1,
                  high: 9.3,
                  low: 9,
                  close: 9.2,
                  volume: 1200000
                },
                {
                  timestamp: "2026-05-27T08:00:00+00:00",
                  timestampMs: 1779868800000,
                  open: 9.2,
                  high: 9.4,
                  low: 9.1,
                  close: 9.3,
                  volume: 1300000
                }
              ]
            },
            dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 120 },
            strategyConfig: {
              name: "SMA trend demo",
              revision: "rev123",
              market: "ashare",
              symbols: ["600000"],
              timeframe: "1d",
              version: 1,
              entryConditions: [{ kind: "close_above_sma", params: { window: 20 } }],
              exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
              risk: { positionPct: 0.8, stopLossPct: 0.08, takeProfitPct: 0.18, maxDrawdownPct: 0.2 }
            },
            backtestAssumptions: { initialCash: 250000, feeBps: 8, slippageBps: 4 }
          }
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs/run-new"]);
    expect(result.source).toBe("core");
    expect(result.run?.runId).toBe("run-new");
    expect(result.run?.aiReport?.summary).toBe("SMA trend detail research summary");
    expect(result.run?.aiReport?.risks[0]).toBe("Detail risk");
    expect(result.run?.aiReport?.improvements[0]).toBe("Review slippage");
    expect(result.run?.aiReport?.disclaimer).toBe("No investment advice");
    expect(result.run?.dataSnapshot?.hash).toBe("snapshot-detail");
    expect(result.run?.dataSnapshot?.bars.at(-1)?.close).toBe(9.3);
    expect(result.run?.dataQuality).toEqual({ source: "tencent", isComplete: true, warnings: [], rows: 120 });
    expect(result.run?.strategyConfig?.entryConditions[0].params).toEqual({ window: 20 });
    expect(result.run?.strategyConfig?.risk.positionPct).toBe(0.8);
    expect(result.run?.backtestAssumptions).toEqual({ initialCash: 250000, feeBps: 8, slippageBps: 4 });
  });

  test("loads one research run export package from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunExport("http://127.0.0.1:8765", "run-new", async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => ({
          export: {
            kind: "aiqt.researchRun.export",
            packageVersion: 1,
            exportedAt: "2026-05-26T08:05:00+00:00",
            integrity: {
              algorithm: "sha256",
              hash: "a".repeat(64)
            },
            manifest: {
              runId: "run-new",
              createdAt: "2026-05-26T08:00:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyRevision: "rev123",
              dataHash: "snapshot-detail",
              dataRows: 2,
              executionMode: "paper_only",
              paperOnly: true,
              liveTradingAllowed: false,
              artifactCounts: { bars: 2, trades: 1, equityPoints: 2, decisions: 0, aiRisks: 1 }
            },
            researchRun: {
              runId: "run-new",
              createdAt: "2026-05-26T08:00:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyName: "SMA trend demo",
              strategyRevision: "rev123",
              dataRows: 2,
              metrics: { total_return_pct: 3.4, trade_count: 8 },
              decisions: [],
              executionMode: "paper_only",
              dataSnapshot: {
                source: "tencent",
                isComplete: true,
                warnings: [],
                rows: 2,
                start: "2026-05-26T08:00:00+00:00",
                end: "2026-05-27T08:00:00+00:00",
                hash: "snapshot-detail",
                bars: [
                  {
                    timestamp: "2026-05-26T08:00:00+00:00",
                    timestampMs: 1779782400000,
                    open: 9.1,
                    high: 9.3,
                    low: 9,
                    close: 9.2,
                    volume: 1200000
                  },
                  {
                    timestamp: "2026-05-27T08:00:00+00:00",
                    timestampMs: 1779868800000,
                    open: 9.2,
                    high: 9.4,
                    low: 9.1,
                    close: 9.3,
                    volume: 1300000
                  }
                ]
              }
            },
            executionHandoff: {
              mode: "paper_only",
              paperOnly: true,
              liveTradingAllowed: false,
              requiredGates: [
                {
                  id: "adapter-certified",
                  label: "Adapter certified",
                  passed: false,
                  reason: "No certified live adapter is bound to this audited run."
                }
              ]
            }
          }
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs/run-new/export"]);
    expect(result.source).toBe("core");
    expect(result.exportPackage?.integrity?.algorithm).toBe("sha256");
    expect(result.exportPackage?.manifest.dataHash).toBe("snapshot-detail");
    expect(result.exportPackage?.manifest.artifactCounts.bars).toBe(2);
    expect(result.exportPackage?.researchRun.dataSnapshot?.bars.at(-1)?.close).toBe(9.3);
    expect(result.exportPackage?.executionHandoff.liveTradingAllowed).toBe(false);
  });

  test("returns fallback when research run export package is malformed", async () => {
    const result = await loadResearchRunExport("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        export: {
          kind: "aiqt.researchRun.export",
          packageVersion: 1,
          manifest: { runId: "run-new" },
          researchRun: { runId: "run-new" },
          executionHandoff: { liveTradingAllowed: true }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.exportPackage).toBeUndefined();
    expect(result.error).toBe("Invalid research run export contract");
  });

  test("returns fallback when research run export integrity is malformed", async () => {
    const result = await loadResearchRunExport("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        export: {
          kind: "aiqt.researchRun.export",
          packageVersion: 1,
          exportedAt: "2026-05-26T08:05:00+00:00",
          integrity: { algorithm: "md5", hash: "abc" },
          manifest: {
            runId: "run-new",
            createdAt: "2026-05-26T08:00:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyRevision: "rev123",
            dataHash: "snapshot-detail",
            dataRows: 1,
            executionMode: "paper_only",
            paperOnly: true,
            liveTradingAllowed: false,
            artifactCounts: { bars: 1, trades: 0, equityPoints: 0, decisions: 0, aiRisks: 0 }
          },
          researchRun: {
            runId: "run-new",
            createdAt: "2026-05-26T08:00:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyName: "SMA trend demo",
            strategyRevision: "rev123",
            dataRows: 1,
            metrics: { total_return_pct: 3.4, trade_count: 0 },
            decisions: [],
            executionMode: "paper_only",
            dataSnapshot: {
              source: "tencent",
              isComplete: true,
              warnings: [],
              rows: 1,
              start: null,
              end: null,
              hash: "snapshot-detail",
              bars: [
                {
                  timestamp: "2026-05-26T08:00:00+00:00",
                  timestampMs: 1779782400000,
                  open: 9.1,
                  high: 9.3,
                  low: 9,
                  close: 9.2,
                  volume: 1200000
                }
              ]
            }
          },
          executionHandoff: {
            mode: "paper_only",
            paperOnly: true,
            liveTradingAllowed: false,
            requiredGates: []
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid research run export contract");
  });

  test("imports one research run export package into the Python core", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await importResearchRunExport(
      "http://127.0.0.1:8765",
      {
        kind: "aiqt.researchRun.export",
        packageVersion: 1,
        exportedAt: "2026-05-26T08:05:00+00:00",
        manifest: {
          runId: "run-import",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyRevision: "rev-import",
          dataHash: "snapshot-import",
          dataRows: 2,
          executionMode: "paper_only",
          paperOnly: true,
          liveTradingAllowed: false,
          artifactCounts: { bars: 2, trades: 1, equityPoints: 1, decisions: 1, aiRisks: 1 }
        },
        researchRun: {
          runId: "run-import",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "Imported SMA trend",
          strategyRevision: "rev-import",
          dataRows: 2,
          metrics: { total_return_pct: 4.2, trade_count: 1 },
          decisions: [{ agent: "AI Summary", message: "Imported evidence only", tone: "ai" }],
          executionMode: "paper_only",
          dataSnapshot: {
            source: "tencent",
            isComplete: true,
            warnings: [],
            rows: 2,
            start: "2026-05-26T08:00:00+00:00",
            end: "2026-05-27T08:00:00+00:00",
            hash: "snapshot-import",
            bars: [
              {
                timestamp: "2026-05-26T08:00:00+00:00",
                timestampMs: 1779782400000,
                open: 9.1,
                high: 9.3,
                low: 9,
                close: 9.2,
                volume: 1200000
              }
            ]
          }
        },
        executionHandoff: {
          mode: "paper_only",
          paperOnly: true,
          liveTradingAllowed: false,
          requiredGates: [{ id: "adapter-certified", label: "Adapter certified", passed: false, reason: "Blocked" }]
        }
      },
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          status: 201,
          json: async () => ({
            run: {
              runId: "run-import",
              createdAt: "2026-05-26T08:00:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyName: "Imported SMA trend",
              strategyRevision: "rev-import",
              dataRows: 2,
              metrics: { total_return_pct: 4.2, trade_count: 1 },
              decisions: [{ agent: "AI Summary", message: "Imported evidence only", tone: "ai" }],
              executionMode: "paper_only",
              dataSnapshot: {
                source: "tencent",
                isComplete: true,
                warnings: [],
                rows: 1,
                start: "2026-05-26T08:00:00+00:00",
                end: "2026-05-26T08:00:00+00:00",
                hash: "snapshot-import",
                bars: [
                  {
                    timestamp: "2026-05-26T08:00:00+00:00",
                    timestampMs: 1779782400000,
                    open: 9.1,
                    high: 9.3,
                    low: 9,
                    close: 9.2,
                    volume: 1200000
                  }
                ]
              }
            }
          })
        };
      }
    );

    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/research/runs/import");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(calls[0]?.init?.body)).kind).toBe("aiqt.researchRun.export");
    expect(result.source).toBe("core");
    expect(result.run?.runId).toBe("run-import");
    expect(result.run?.dataSnapshot?.hash).toBe("snapshot-import");
  });

  test("submits a paper execution for an audited research run", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await submitResearchRunPaperExecution("http://127.0.0.1:8765", "run-new", async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          execution: {
            executionId: "paper-123",
            runId: "run-new",
            createdAt: "2026-05-26T08:10:00+00:00",
            mode: "paper_only",
            account: { cash: 80680, positions: { "600000": 2100 }, equity: 100000 },
            orders: [
              {
                orderId: "order-1",
                symbol: "600000",
                side: "buy",
                quantity: 2100,
                price: 9.2,
                status: "filled",
                reason: "filled_immediately",
                timestamp: "2026-05-26T08:10:00+00:00"
              }
            ],
            gates: [
              {
                id: "audit-run-bound",
                label: "Audit run bound",
                passed: true,
                reason: "Paper execution is linked to audited run run-new."
              },
              {
                id: "paper-risk-check",
                label: "Paper risk check",
                passed: true,
                reason: "filled_immediately"
              },
              {
                id: "live-route-blocked",
                label: "Live route blocked",
                passed: false,
                reason: "Live execution is blocked; this record is paper-only."
              }
            ]
          }
        })
      };
    });

    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/research/runs/run-new/paper-executions");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(result.source).toBe("core");
    expect(result.execution?.orders[0]?.status).toBe("filled");
    expect(result.execution?.gates[2]?.passed).toBe(false);
  });

  test("loads the latest paper execution for an audited research run", async () => {
    const calls: string[] = [];
    const result = await loadLatestResearchRunPaperExecution("http://127.0.0.1:8765", "run-new", async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          executions: [
            {
              executionId: "paper-latest",
              runId: "run-new",
              createdAt: "2026-05-26T08:20:00+00:00",
              mode: "paper_only",
              account: { cash: 80680, positions: { "600000": 2100 }, equity: 100000 },
              orders: [
                {
                  orderId: "order-latest",
                  symbol: "600000",
                  side: "buy",
                  quantity: 2100,
                  price: 9.2,
                  status: "filled",
                  reason: "filled_immediately",
                  timestamp: "2026-05-26T08:20:00+00:00"
                }
              ],
              gates: []
            },
            {
              executionId: "paper-older",
              runId: "run-new",
              createdAt: "2026-05-26T08:10:00+00:00",
              mode: "paper_only",
              account: { cash: 90000, positions: {}, equity: 90000 },
              orders: [],
              gates: []
            }
          ]
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs/run-new/paper-executions"]);
    expect(result.source).toBe("core");
    expect(result.execution?.executionId).toBe("paper-latest");
    expect(result.execution?.orders[0]?.orderId).toBe("order-latest");
  });

  test("returns core without execution when a run has no paper execution history", async () => {
    const result = await loadLatestResearchRunPaperExecution("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      status: 200,
      json: async () => ({ executions: [] })
    }));

    expect(result.source).toBe("core");
    expect(result.execution).toBeUndefined();
  });

  test("returns fallback when paper execution payload is malformed", async () => {
    const result = await submitResearchRunPaperExecution("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      status: 201,
      json: async () => ({ execution: { runId: "run-new", orders: [] } })
    }));

    expect(result.source).toBe("fallback");
    expect(result.execution).toBeUndefined();
    expect(result.error).toBe("Invalid paper execution contract");
  });

  test("returns fallback when the research run detail payload is invalid", async () => {
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({ run: { runId: "run-new" } })
    }));

    expect(result.source).toBe("fallback");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("Invalid research run detail contract");
  });

  test("returns fallback when research run strategy config is malformed", async () => {
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        run: {
          runId: "run-new",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "SMA trend demo",
          strategyRevision: "rev123",
          dataRows: 120,
          metrics: { total_return_pct: 3.4, trade_count: 8 },
          decisions: [],
          executionMode: "paper_only",
          strategyConfig: {
            name: "SMA trend demo",
            revision: "rev123",
            market: "ashare",
            symbols: ["600000"],
            timeframe: "1d",
            version: 1,
            entryConditions: [{ kind: "close_above_sma", params: "window=20" }],
            exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
            risk: { positionPct: 0.8 }
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("Invalid research run detail contract");
  });

  test("returns fallback when research run data quality is malformed", async () => {
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        run: {
          runId: "run-new",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "SMA trend demo",
          strategyRevision: "rev123",
          dataRows: 120,
          metrics: { total_return_pct: 3.4, trade_count: 8 },
          decisions: [],
          executionMode: "paper_only",
          dataQuality: { source: "tencent", isComplete: "yes", warnings: [], rows: 120 }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("Invalid research run detail contract");
  });

  test("returns fallback when research run AI report is malformed", async () => {
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        run: {
          runId: "run-new",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "SMA trend demo",
          strategyRevision: "rev123",
          dataRows: 120,
          metrics: { total_return_pct: 3.4, trade_count: 8 },
          decisions: [],
          executionMode: "paper_only",
          aiReport: {
            summary: "Malformed research summary",
            risks: "risk should be a list",
            improvements: [],
            disclaimer: "No investment advice"
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("Invalid research run detail contract");
  });

  test("returns fallback when research run data snapshot is malformed", async () => {
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        run: {
          runId: "run-new",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "SMA trend demo",
          strategyRevision: "rev123",
          dataRows: 120,
          metrics: { total_return_pct: 3.4, trade_count: 8 },
          decisions: [],
          executionMode: "paper_only",
          dataSnapshot: {
            source: "tencent",
            isComplete: true,
            warnings: [],
            rows: 1,
            start: "2026-05-26T08:00:00+00:00",
            end: "2026-05-26T08:00:00+00:00",
            hash: "snapshot-bad",
            bars: [{ timestamp: "2026-05-26T08:00:00+00:00", close: 9.2 }]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("Invalid research run detail contract");
  });

  test("builds chart klines from an audited research run data snapshot", () => {
    const klines = marketKlinesFromResearchRunAudit({
      runId: "run-snapshot",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev123",
      dataRows: 2,
      metrics: { total_return_pct: 3.4, trade_count: 8 },
      decisions: [],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-26T08:00:00+00:00",
        end: "2026-05-27T08:00:00+00:00",
        hash: "snapshot-chart",
        bars: [
          {
            timestamp: "2026-05-26T08:00:00+00:00",
            timestampMs: 1779782400000,
            open: 9.1,
            high: 9.3,
            low: 9,
            close: 9.2,
            volume: 1200000
          },
          {
            timestamp: "2026-05-27T08:00:00+00:00",
            timestampMs: 1779868800000,
            open: 9.2,
            high: 9.4,
            low: 9.1,
            close: 9.3,
            volume: 1300000
          }
        ]
      }
    });

    expect(klines).toEqual({
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      source: "core",
      quality: { source: "tencent", isComplete: true, warnings: [], rows: 2 },
      bars: [
        {
          timestamp: "2026-05-26T08:00:00+00:00",
          timestampMs: 1779782400000,
          open: 9.1,
          high: 9.3,
          low: 9,
          close: 9.2,
          volume: 1200000
        },
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          timestampMs: 1779868800000,
          open: 9.2,
          high: 9.4,
          low: 9.1,
          close: 9.3,
          volume: 1300000
        }
      ]
    });
  });

  test("loads market klines from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadMarketKlines(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "1d", limit: 2 },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => ({
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            quality: { source: "tencent", isComplete: true, warnings: [], rows: 2 },
            bars: [
              {
                timestamp: "2026-05-22T00:00:00+08:00",
                timestampMs: 1779379200000,
                open: 9,
                high: 9.12,
                low: 8.98,
                close: 9.08,
                volume: 100000
              },
              {
                timestamp: "2026-05-25T00:00:00+08:00",
                timestampMs: 1779638400000,
                open: 9.1,
                high: 9.32,
                low: 9.09,
                close: 9.27,
                volume: 120000
              }
            ]
          })
        };
      }
    );

    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/market/klines?market=ashare&symbol=600000&timeframe=1d&limit=2"
    ]);
    expect(result.source).toBe("core");
    expect(result.quality.source).toBe("tencent");
    expect(result.bars.at(-1)?.close).toBe(9.27);
  });

  test("loads historical market klines with the requested end boundary", async () => {
    const calls: string[] = [];
    const result = await loadMarketKlines(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "60m", limit: 500, end: "2026-05-26T09:45:00.000Z" },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => ({
            market: "ashare",
            symbol: "600000",
            timeframe: "60m",
            quality: { source: "demo-fallback", isComplete: false, warnings: [], rows: 1 },
            bars: [
              {
                timestamp: "2026-05-26T09:00:00+08:00",
                timestampMs: 1779738000000,
                open: 9.1,
                high: 9.2,
                low: 9.0,
                close: 9.16,
                volume: 3200
              }
            ]
          })
        };
      }
    );

    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/market/klines?market=ashare&symbol=600000&timeframe=60m&limit=500&end=2026-05-26T09%3A45%3A00.000Z"
    ]);
    expect(result.source).toBe("core");
    expect(result.bars[0].timestamp).toBe("2026-05-26T09:00:00+08:00");
  });

  test("merges historical market klines before existing bars without duplicates", () => {
    const current = {
      market: "ashare" as const,
      symbol: "600000",
      timeframe: "60m" as const,
      source: "core" as const,
      quality: { source: "demo-fallback", isComplete: false, warnings: ["current"], rows: 2 },
      bars: [
        {
          timestamp: "2026-05-26T10:00:00+08:00",
          timestampMs: 1779746400000,
          open: 9.1,
          high: 9.3,
          low: 9.0,
          close: 9.2,
          volume: 1000
        },
        {
          timestamp: "2026-05-26T11:00:00+08:00",
          timestampMs: 1779750000000,
          open: 9.2,
          high: 9.4,
          low: 9.1,
          close: 9.3,
          volume: 1200
        }
      ]
    };
    const incoming = {
      ...current,
      quality: { source: "demo-fallback", isComplete: false, warnings: ["older"], rows: 2 },
      bars: [
        {
          timestamp: "2026-05-26T09:00:00+08:00",
          timestampMs: 1779742800000,
          open: 9.0,
          high: 9.2,
          low: 8.9,
          close: 9.1,
          volume: 900
        },
        current.bars[0]
      ]
    };

    const merged = mergeMarketKlines(current, incoming);

    expect(merged.bars.map((bar) => bar.timestampMs)).toEqual([1779742800000, 1779746400000, 1779750000000]);
    expect(merged.quality.rows).toBe(3);
    expect(merged.quality.warnings).toEqual(["current", "older"]);
  });

  test("loads market symbol search suggestions from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadMarketSearch(
      "http://127.0.0.1:8765",
      { market: "ashare", query: "600", limit: 2 },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => ({
            market: "ashare",
            query: "600",
            results: [
              {
                market: "ashare",
                symbol: "600000",
                name: "浦发银行",
                source: "eastmoney",
                exchange: "沪A",
                pinyin: "PFYH"
              }
            ]
          })
        };
      }
    );

    expect(calls).toEqual(["http://127.0.0.1:8765/api/market/search?market=ashare&query=600&limit=2"]);
    expect(result.source).toBe("core");
    expect(result.results[0].name).toBe("浦发银行");
  });

  test("returns an empty run history when the Python core is unavailable", async () => {
    const result = await loadResearchRunHistory("http://127.0.0.1:8765", 5, async () => {
      throw new Error("offline");
    });

    expect(result.source).toBe("fallback");
    expect(result.runs).toEqual([]);
    expect(result.error).toBe("offline");
  });
});
