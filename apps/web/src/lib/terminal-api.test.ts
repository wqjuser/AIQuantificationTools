import { describe, expect, test } from "vitest";
import {
  type AiReviewRunRecord,
  buildTerminalWorkspace,
  workspaceWithBacktestAssumption,
  workspaceWithStrategyField
} from "./terminal-workbench";
import {
  buildResearchRunUrl,
  buildResearchRunDetailUrl,
  buildResearchRunExportUrl,
  buildResearchRunImportUrl,
  buildResearchNoteUrl,
  buildResearchRunPaperExecutionsUrl,
  buildResearchRunPromotionUrl,
  buildResearchRunAiReviewsUrl,
  buildCacheRefreshUrl,
  buildSettingsStatusUrl,
  buildStrategiesUrl,
  buildStrategyDetailUrl,
  buildStrategyValidationUrl,
  buildResearchRunsUrl,
  buildMarketKlinesUrl,
  buildMarketSearchUrl,
  buildLoadingMarketKlinesResult,
  loadMarketKlines,
  loadMarketSearch,
  loadResearchRunDetail,
  loadResearchRunExport,
  loadLatestResearchRunPaperExecution,
  loadResearchRunPromotion,
  loadResearchNote,
  loadPlatformSettings,
  refreshMarketCache,
  refreshMarketCacheBatch,
  loadStrategyLibrary,
  validateStrategySnapshot,
  submitResearchRunPaperExecution,
  saveAiReviewRunRecord,
  loadResearchRunAiReviews,
  saveResearchNote,
  saveStrategySnapshot,
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

  test("builds the research note URL for the selected context", () => {
    expect(buildResearchNoteUrl("http://127.0.0.1:8765/", "ashare", "600000", "1d")).toBe(
      "http://127.0.0.1:8765/api/research/notes?market=ashare&symbol=600000&timeframe=1d"
    );
  });

  test("builds the paper execution URL with an encoded run id", () => {
    expect(buildResearchRunPaperExecutionsUrl("http://127.0.0.1:8765/", "run 你好/1")).toBe(
      "http://127.0.0.1:8765/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1/paper-executions"
    );
  });

  test("builds the promotion candidate URL with an encoded run id", () => {
    expect(buildResearchRunPromotionUrl("http://127.0.0.1:8765/", "run 你好/1")).toBe(
      "http://127.0.0.1:8765/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1/promotion"
    );
  });

  test("builds the settings status URL", () => {
    expect(buildSettingsStatusUrl("http://127.0.0.1:8765/")).toBe("http://127.0.0.1:8765/api/settings/status");
  });

  test("builds the cache refresh URL", () => {
    expect(buildCacheRefreshUrl("http://127.0.0.1:8765/")).toBe("http://127.0.0.1:8765/api/cache/refresh");
  });

  test("builds strategy library URLs for context and detail lookup", () => {
    expect(buildStrategiesUrl("http://127.0.0.1:8765/", { market: "ashare", symbol: "600000", limit: 5 })).toBe(
      "http://127.0.0.1:8765/api/strategies?market=ashare&symbol=600000&limit=5"
    );
    expect(buildStrategyDetailUrl("http://127.0.0.1:8765/", "rev 你好/1")).toBe(
      "http://127.0.0.1:8765/api/strategies/rev%20%E4%BD%A0%E5%A5%BD%2F1"
    );
    expect(buildStrategyValidationUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/strategies/validate"
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

  test("validates the active strategy draft through the Python core", async () => {
    const calls: Array<{ url: string; body?: string }> = [];
    const result = await validateStrategySnapshot(
      "http://127.0.0.1:8765/",
      {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategy: {
          name: "Validated SMA plan",
          entry: "Close > SMA8",
          exit: "Close < SMA21",
          position: "40% cap per instrument",
          risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
        }
      },
      async (url, init) => {
        calls.push({ url, body: String(init?.body ?? "") });
        return {
          ok: true,
          json: async () => ({
            validation: {
              status: "review",
              revision: "rev-validated",
              gates: [
                {
                  id: "schema",
                  label: "Strategy schema",
                  value: "SMA8 / SMA21",
                  detail: "Entry and exit conditions are structured.",
                  status: "passed",
                  tone: "positive"
                },
                {
                  id: "audit",
                  label: "Audit evidence",
                  value: "needs run",
                  detail: "Run Pipeline to bind this draft to a reproducible audit run.",
                  status: "review",
                  tone: "warning"
                }
              ],
              strategyConfig: {
                name: "Validated SMA plan",
                revision: "rev-validated",
                market: "ashare",
                symbols: ["600000"],
                timeframe: "1d",
                version: 1,
                entryConditions: [{ kind: "close_above_sma", params: { window: 8 } }],
                exitConditions: [{ kind: "close_below_sma", params: { window: 21 } }],
                risk: {
                  positionPct: 0.4,
                  stopLossPct: 0.06,
                  takeProfitPct: 0.12,
                  maxDrawdownPct: 0.09
                }
              }
            }
          })
        };
      }
    );

    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/strategies/validate");
    expect(JSON.parse(calls[0].body ?? "{}").strategy.entry).toBe("Close > SMA8");
    expect(result.source).toBe("core");
    expect(result.validation?.status).toBe("review");
    expect(result.validation?.gates[0]).toMatchObject({ id: "schema", status: "passed" });
  });

  test("surfaces blocked strategy save validation from the Python core", async () => {
    const result = await saveStrategySnapshot(
      "http://127.0.0.1:8765/",
      {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategy: {
          name: "Blocked SMA plan",
          entry: "Close > SMA8",
          exit: "Close < SMA21",
          position: "40% cap per instrument",
          risk: "Stop -6%, drawdown guard 9%, paper only"
        }
      },
      async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          error: "strategy_not_ready",
          detail: "strategy_preflight_blocked",
          validation: {
            status: "blocked",
            revision: "rev-blocked",
            gates: [
              {
                id: "risk",
                label: "Risk controls",
                value: "pending",
                detail: "Position sizing and risk guardrails must be explicit.",
                status: "blocked",
                tone: "risk"
              }
            ],
            strategyConfig: {
              name: "Blocked SMA plan",
              revision: "rev-blocked",
              market: "ashare",
              symbols: ["600000"],
              timeframe: "1d",
              version: 1,
              entryConditions: [{ kind: "close_above_sma", params: { window: 8 } }],
              exitConditions: [{ kind: "close_below_sma", params: { window: 21 } }],
              risk: {
                positionPct: 0.4,
                stopLossPct: 0.06,
                takeProfitPct: 0.18,
                maxDrawdownPct: 0.09
              }
            }
          }
        })
      })
    );

    expect(result.source).toBe("core");
    expect(result.strategy).toBeUndefined();
    expect(result.error).toBe("strategy_not_ready");
    expect(result.validation?.status).toBe("blocked");
    expect(result.validation?.gates[0]).toMatchObject({ id: "risk", status: "blocked" });
  });

  test("normalizes older core workspace navigation to the workflow-first contract", async () => {
    const remoteWorkspace = {
      ...buildTerminalWorkspace(),
      quantLoop: [
        { id: "idea", label: "Idea Lab", status: "active" },
        { id: "data", label: "Data & Factor", status: "ready" },
        { id: "strategy", label: "Strategy Builder", status: "ready" },
        { id: "backtest", label: "Backtest Lab", status: "ready" },
        { id: "agent-review", label: "Agent Review", status: "ready" },
        { id: "paper", label: "Paper Trading", status: "ready" },
        { id: "broker", label: "Broker Center", status: "locked" }
      ]
    };

    const result = await loadTerminalWorkspace("http://127.0.0.1:8765", async () => ({
      ok: true,
      json: async () => remoteWorkspace
    }));

    expect(result.workspace.quantLoop.map((step) => step.id)).toEqual([
      "research",
      "strategy",
      "backtest",
      "agent-review",
      "paper"
    ]);
    expect(result.workspace.quantLoop.map((step) => step.label)).toEqual([
      "Market Research",
      "Strategy Lab",
      "Backtest Review",
      "Agent Review",
      "Paper Trading"
    ]);
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

  test("loads settings status without exposing secret values", async () => {
    const calls: string[] = [];
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => ({
          settings: {
            schemaVersion: 1,
            generatedAt: "2026-05-31T09:00:00+08:00",
            dataSources: [
              {
                market: "us",
                label: "US equities",
                quoteSource: "finnhub / yfinance",
                klineSource: "yahoo / yfinance",
                status: "ready",
                optionalKeyName: "FINNHUB_API_KEY",
                optionalKeyConfigured: true,
                note: "Secret values stay local."
              }
            ],
            cache: {
              engine: "sqlite",
              path: "data/market.sqlite",
              exists: true,
              scope: "ohlcv",
              rowCount: 1280,
              contextCount: 12,
              latestTimestamp: "2026-05-29T00:00:00+00:00",
              freshnessSummary: {
                fresh: 1,
                stale: 0,
                empty: 0
              },
              contexts: [
                {
                  market: "ashare",
                  symbol: "600000",
                  timeframe: "1d",
                  rowCount: 500,
                  startTimestamp: "2025-09-12T00:00:00+08:00",
                  endTimestamp: "2026-05-29T00:00:00+08:00",
                  freshness: "fresh",
                  ageHours: 48
                }
              ]
            },
            executionAdapters: [
              {
                id: "paper-local",
                market: "multi",
                adapter: "Paper Trading",
                route: "paper",
                status: "paper_ready",
                certification: "local",
                liveTradingAllowed: false,
                note: "Paper only."
              }
            ],
            safety: {
              liveTradingAllowed: false,
              requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
            }
          }
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/settings/status"]);
    expect(result.source).toBe("core");
    expect(result.settings?.dataSources[0]).toMatchObject({
      market: "us",
      optionalKeyName: "FINNHUB_API_KEY",
      optionalKeyConfigured: true
    });
    expect((result.settings?.cache as unknown as { rowCount?: number }).rowCount).toBe(1280);
    expect((result.settings?.cache as unknown as { contextCount?: number }).contextCount).toBe(12);
    expect((result.settings?.cache as unknown as { latestTimestamp?: string | null }).latestTimestamp).toBe(
      "2026-05-29T00:00:00+00:00"
    );
    expect((result.settings?.cache as unknown as { contexts?: unknown[] }).contexts?.[0]).toMatchObject({
      market: "ashare",
      symbol: "600000",
      rowCount: 500
    });
    expect((result.settings?.cache as unknown as { contexts?: Array<{ freshness?: string; ageHours?: number }> }).contexts?.[0]).toMatchObject({
      freshness: "fresh",
      ageHours: 48
    });
    expect((result.settings?.cache as unknown as { freshnessSummary?: { fresh?: number } }).freshnessSummary?.fresh).toBe(1);
    expect(JSON.stringify(result.settings)).not.toContain("secret-finnhub-token");
  });

  test("refreshes a market cache context and returns updated settings", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await refreshMarketCache(
      "http://127.0.0.1:8765/",
      { market: "ashare", symbol: "600000", timeframe: "1d", limit: 240 },
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          json: async () => ({
            refresh: {
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              requestedLimit: 240,
              upsertedRows: 3,
              quality: {
                source: "tencent",
                isComplete: true,
                warnings: [],
                rows: 3
              }
            },
            settings: {
              schemaVersion: 1,
              generatedAt: "2026-05-31T09:00:00+08:00",
              dataSources: [
                {
                  market: "ashare",
                  label: "A shares",
                  quoteSource: "tencent",
                  klineSource: "tencent",
                  status: "ready",
                  optionalKeyName: null,
                  optionalKeyConfigured: false,
                  note: "No key required."
                }
              ],
              cache: {
                engine: "sqlite",
                path: "data/market.sqlite",
                exists: true,
                scope: "ohlcv",
                rowCount: 3,
                contextCount: 1,
                latestTimestamp: "2026-05-27T00:00:00+00:00",
                freshnessSummary: {
                  fresh: 1,
                  stale: 0,
                  empty: 0
                },
                contexts: [
                  {
                    market: "ashare",
                    symbol: "600000",
                    timeframe: "1d",
                    rowCount: 3,
                    startTimestamp: "2026-05-25T00:00:00+00:00",
                    endTimestamp: "2026-05-27T00:00:00+00:00",
                    freshness: "fresh",
                    ageHours: 48
                  }
                ]
              },
              executionAdapters: [
                {
                  id: "paper-local",
                  market: "multi",
                  adapter: "Paper Trading",
                  route: "paper",
                  status: "paper_ready",
                  certification: "local",
                  liveTradingAllowed: false,
                  note: "Paper only."
                }
              ],
              safety: {
                liveTradingAllowed: false,
                requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
              }
            }
          })
        };
      }
    );

    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/cache/refresh");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0]?.init?.body))).toMatchObject({
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      limit: 240
    });
    expect(result.source).toBe("core");
    expect(result.refresh?.upsertedRows).toBe(3);
    expect(result.settings?.cache.rowCount).toBe(3);
  });

  test("refreshes multiple market cache contexts in request order", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await refreshMarketCacheBatch(
      "http://127.0.0.1:8765/",
      [
        { market: "ashare", symbol: "600000", timeframe: "1d", limit: 240 },
        { market: "us", symbol: "AAPL", timeframe: "1d", limit: 240 }
      ],
      async (url, init) => {
        calls.push({ url, init });
        const body = JSON.parse(String(init?.body)) as { market: string; symbol: string; timeframe: string; limit: number };
        const rowCount = body.symbol === "600000" ? 500 : 240;
        return {
          ok: true,
          json: async () => ({
            refresh: {
              market: body.market,
              symbol: body.symbol,
              timeframe: body.timeframe,
              requestedLimit: body.limit,
              upsertedRows: rowCount,
              quality: {
                source: body.market === "ashare" ? "tencent" : "yfinance",
                isComplete: true,
                warnings: [],
                rows: rowCount
              }
            },
            settings: {
              schemaVersion: 1,
              generatedAt: "2026-05-31T09:00:00+08:00",
              dataSources: [
                {
                  market: "ashare",
                  label: "A shares",
                  quoteSource: "tencent",
                  klineSource: "tencent",
                  status: "ready",
                  optionalKeyName: null,
                  optionalKeyConfigured: false,
                  note: "No key required."
                }
              ],
              cache: {
                engine: "sqlite",
                path: "data/market.sqlite",
                exists: true,
                scope: "ohlcv",
                rowCount,
                contextCount: calls.length,
                latestTimestamp: "2026-05-29T00:00:00+00:00",
                freshnessSummary: {
                  fresh: calls.length,
                  stale: 0,
                  empty: 0
                },
                contexts: [
                  {
                    market: body.market,
                    symbol: body.symbol,
                    timeframe: body.timeframe,
                    rowCount,
                    startTimestamp: "2026-05-25T00:00:00+00:00",
                    endTimestamp: "2026-05-29T00:00:00+00:00",
                    freshness: "fresh",
                    ageHours: 48
                  }
                ]
              },
              executionAdapters: [
                {
                  id: "paper-local",
                  market: "multi",
                  adapter: "Paper Trading",
                  route: "paper",
                  status: "paper_ready",
                  certification: "local",
                  liveTradingAllowed: false,
                  note: "Paper only."
                }
              ],
              safety: {
                liveTradingAllowed: false,
                requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
              }
            }
          })
        };
      }
    );

    expect(calls).toHaveLength(2);
    expect(calls.map((call) => JSON.parse(String(call.init?.body)).symbol)).toEqual(["600000", "AAPL"]);
    expect(result.source).toBe("core");
    expect(result.refreshes.map((refresh) => refresh.symbol)).toEqual(["600000", "AAPL"]);
    expect(result.settings?.cache.rowCount).toBe(240);
    expect(result.failedCount).toBe(0);
  });

  test("rejects settings status when cache freshness summary is missing", async () => {
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-05-31T09:00:00+08:00",
          dataSources: [
            {
              market: "ashare",
              label: "A shares",
              quoteSource: "tencent",
              klineSource: "tencent",
              status: "ready",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 500,
            contextCount: 1,
            latestTimestamp: "2026-05-29T00:00:00+00:00",
            contexts: [
              {
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                rowCount: 500,
                startTimestamp: "2025-09-12T00:00:00+08:00",
                endTimestamp: "2026-05-29T00:00:00+08:00",
                freshness: "fresh",
                ageHours: 48
              }
            ]
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("rejects settings status when cache context freshness is missing", async () => {
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-05-31T09:00:00+08:00",
          dataSources: [
            {
              market: "ashare",
              label: "A shares",
              quoteSource: "tencent",
              klineSource: "tencent",
              status: "ready",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 500,
            contextCount: 1,
            latestTimestamp: "2026-05-29T00:00:00+00:00",
            contexts: [
              {
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                rowCount: 500,
                startTimestamp: "2025-09-12T00:00:00+08:00",
                endTimestamp: "2026-05-29T00:00:00+08:00"
              }
            ]
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("rejects settings status when cache contexts are missing", async () => {
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-05-31T09:00:00+08:00",
          dataSources: [
            {
              market: "ashare",
              label: "A shares",
              quoteSource: "tencent",
              klineSource: "tencent",
              status: "ready",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 1280,
            contextCount: 12,
            latestTimestamp: "2026-05-29T00:00:00+00:00"
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("runs terminal research and returns a core-backed workspace", async () => {
    const remoteWorkspace = {
      ...buildTerminalWorkspace(),
      schemaVersion: 1,
      quantLoop: [
        { id: "idea", label: "Idea Lab", status: "active" },
        { id: "data", label: "Data & Factor", status: "ready" },
        { id: "strategy", label: "Strategy Builder", status: "ready" },
        { id: "backtest", label: "Backtest Lab", status: "ready" },
        { id: "agent-review", label: "Agent Review", status: "ready" },
        { id: "paper", label: "Paper Trading", status: "ready" },
        { id: "broker", label: "Broker Center", status: "locked" }
      ],
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
    expect(result.workspace.quantLoop.map((step) => step.id)).toEqual([
      "research",
      "strategy",
      "backtest",
      "agent-review",
      "paper"
    ]);
  });

  test("hydrates research run detail when the run workspace omits its data snapshot", async () => {
    const remoteWorkspace = {
      ...buildTerminalWorkspace(),
      schemaVersion: 1,
      researchRun: {
        runId: "run-needs-detail",
        createdAt: "2026-05-29T08:00:00+00:00",
        timeframe: "1d",
        strategyRevision: "rev-snapshot",
        dataRows: 2,
        executionMode: "paper_only"
      },
      metrics: [
        { label: "Return", value: "+8.20%", tone: "positive" },
        { label: "Max DD", value: "3.10%", tone: "warning" },
        { label: "Win Rate", value: "55.00%", tone: "neutral" },
        { label: "Trades", value: "9", tone: "neutral" }
      ]
    };
    const calls: string[] = [];
    const result = await runTerminalResearch(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      buildTerminalWorkspace(),
      async (url) => {
        calls.push(url);
        if (url.endsWith("/api/research/runs/run-needs-detail")) {
          return {
            ok: true,
            json: async () => ({
              run: {
                runId: "run-needs-detail",
                createdAt: "2026-05-29T08:00:00+00:00",
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                strategyName: "SMA trend demo",
                strategyRevision: "rev-snapshot",
                dataRows: 2,
                metrics: {
                  total_return_pct: 8.2,
                  max_drawdown_pct: 3.1,
                  win_rate_pct: 55,
                  trade_count: 9
                },
                decisions: [],
                executionMode: "paper_only",
                dataSnapshot: {
                  source: "tencent",
                  isComplete: true,
                  warnings: [],
                  rows: 2,
                  start: "2026-05-28T08:00:00Z",
                  end: "2026-05-29T08:00:00Z",
                  hash: "snapshot-hydrated",
                  bars: [
                    {
                      timestamp: "2026-05-28T08:00:00Z",
                      timestampMs: 1779955200000,
                      open: 10,
                      high: 10.2,
                      low: 9.9,
                      close: 10,
                      volume: 1000
                    },
                    {
                      timestamp: "2026-05-29T08:00:00Z",
                      timestampMs: 1780041600000,
                      open: 10.2,
                      high: 10.6,
                      low: 10.1,
                      close: 10.5,
                      volume: 1200
                    }
                  ]
                }
              }
            })
          };
        }
        return {
          ok: true,
          json: async () => remoteWorkspace
        };
      }
    );

    const runUrl = new URL(calls[0]);
    expect(runUrl.pathname).toBe("/api/research/run");
    expect(runUrl.searchParams.get("symbol")).toBe("600000");
    expect(calls[1]).toBe("http://127.0.0.1:8765/api/research/runs/run-needs-detail");
    expect(result.source).toBe("core");
    expect(result.workspace.researchRun?.dataSnapshot?.hash).toBe("snapshot-hydrated");
    expect(result.workspace.researchRun?.dataSnapshot?.bars).toHaveLength(2);
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
              artifactCounts: {
                bars: 2,
                trades: 1,
                equityPoints: 2,
                decisions: 0,
                aiRisks: 1,
                paperExecutions: 1,
                promotionCandidates: 1,
                researchNotes: 1
              }
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
              researchNote: {
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                body: "关注银行板块相对强度，等待放量确认。",
                updatedAt: "2026-05-29T07:55:00+00:00"
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
            },
            paperExecutions: [
              {
                executionId: "paper-exported",
                runId: "run-new",
                createdAt: "2026-05-26T08:20:00+00:00",
                mode: "paper_only",
                account: { cash: 80680, positions: { "600000": 2100 }, equity: 100000 },
                orders: [
                  {
                    orderId: "order-exported",
                    symbol: "600000",
                    side: "buy",
                    quantity: 2100,
                    price: 9.2,
                    status: "filled",
                    reason: "filled_immediately",
                    timestamp: "2026-05-26T08:20:00+00:00"
                  }
                ],
                gates: [
                  {
                    id: "paper-risk-check",
                    label: "Paper risk check",
                    passed: true,
                    reason: "filled_immediately"
                  }
                ]
              }
            ],
            promotionCandidate: {
              candidateId: "promotion-run-new",
              runId: "run-new",
              createdAt: "2026-05-26T08:20:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyRevision: "rev123",
              latestPaperExecutionId: "paper-exported",
              status: "certification_pending",
              headline: "Live promotion pending certification",
              summary: "Paper execution has passed, but live routing stays blocked until adapter certification and human confirmation pass.",
              liveTradingAllowed: false,
              evidence: { paperExecutions: 1, filledOrders: 1, passedPaperRiskChecks: 1 },
              stages: [
                {
                  id: "paper-execution",
                  label: "Paper execution",
                  value: "1 filled order",
                  detail: "Paper snapshot paper-exported passed local risk checks before live promotion.",
                  status: "passed",
                  tone: "positive",
                  passed: true,
                  reason: "Paper snapshot paper-exported passed local risk checks before live promotion."
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
    expect(result.exportPackage?.manifest.artifactCounts.paperExecutions).toBe(1);
    expect(result.exportPackage?.manifest.artifactCounts.promotionCandidates).toBe(1);
    expect(result.exportPackage?.manifest.artifactCounts.researchNotes).toBe(1);
    expect(result.exportPackage?.researchRun.researchNote?.body).toBe("关注银行板块相对强度，等待放量确认。");
    expect(result.exportPackage?.researchRun.dataSnapshot?.bars.at(-1)?.close).toBe(9.3);
    expect(result.exportPackage?.executionHandoff.liveTradingAllowed).toBe(false);
    expect(result.exportPackage?.paperExecutions?.[0]?.executionId).toBe("paper-exported");
    expect(result.exportPackage?.promotionCandidate?.status).toBe("certification_pending");
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
          },
          promotion: {
            candidateId: "promotion-run-new",
            runId: "run-new",
            createdAt: "2026-05-26T08:10:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyRevision: "rev123",
            latestPaperExecutionId: "paper-123",
            status: "certification_pending",
            headline: "Live promotion pending certification",
            summary: "Paper execution has passed, but live routing stays blocked until adapter certification and human confirmation pass.",
            liveTradingAllowed: false,
            evidence: { paperExecutions: 1, filledOrders: 1, passedPaperRiskChecks: 1 },
            stages: [
              {
                id: "paper-execution",
                label: "Paper execution",
                value: "1 filled order",
                detail: "Paper snapshot paper-123 passed local risk checks before live promotion.",
                status: "passed",
                tone: "positive",
                passed: true,
                reason: "Paper snapshot paper-123 passed local risk checks before live promotion."
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
    expect(result.promotion?.runId).toBe("run-new");
    expect(result.promotion?.status).toBe("certification_pending");
    expect(result.promotion?.stages[0]?.status).toBe("passed");
  });

  test("loads a promotion candidate for an audited research run", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunPromotion("http://127.0.0.1:8765", "run-new", async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          promotion: {
            candidateId: "promotion-run-new",
            runId: "run-new",
            createdAt: "2026-05-26T08:20:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyRevision: "rev123",
            latestPaperExecutionId: "paper-latest",
            status: "certification_pending",
            headline: "Live promotion pending certification",
            summary: "Paper execution has passed, but live routing stays blocked until adapter certification and human confirmation pass.",
            liveTradingAllowed: false,
            evidence: { paperExecutions: 1, filledOrders: 1, passedPaperRiskChecks: 1 },
            stages: [
              {
                id: "paper-execution",
                label: "Paper execution",
                value: "1 filled order",
                detail: "Paper snapshot paper-latest passed local risk checks before live promotion.",
                status: "passed",
                tone: "positive",
                passed: true,
                reason: "Paper snapshot paper-latest passed local risk checks before live promotion."
              }
            ]
          }
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs/run-new/promotion"]);
    expect(result.source).toBe("core");
    expect(result.promotion?.latestPaperExecutionId).toBe("paper-latest");
    expect(result.promotion?.evidence.filledOrders).toBe(1);
  });

  test("saves an AI review run record for an audited research run", async () => {
    const record: AiReviewRunRecord = {
      schemaVersion: 1,
      recordType: "aiqt.aiReviewRun",
      aiReviewId: "ai-review:run-ai-save:rev-ai-save",
      runId: "run-ai-save",
      createdAt: "2026-06-02T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyRevision: "rev-ai-save",
      executionMode: "paper_only",
      status: "ready",
      summary: {
        citationCount: 2,
        roundCount: 1,
        decisionCount: 1,
        parameterScanBound: true,
        liveExecutionBlocked: true
      },
      dossier: {
        status: "ready",
        headline: "AI review bound to run-ai-save",
        summary: "Agents explain supplied evidence only.",
        citations: [
          {
            id: "run",
            label: "Run id",
            value: "run-ai-save",
            detail: "500 1d bars",
            tone: "positive"
          },
          {
            id: "parameter-scan",
            label: "Parameter scan",
            value: "Current rank 2 of 9",
            detail: "Candidate requires fresh audited run.",
            tone: "neutral"
          }
        ]
      },
      citations: [
        {
          id: "run",
          label: "Run id",
          value: "run-ai-save",
          detail: "500 1d bars",
          tone: "positive"
        }
      ],
      rounds: [
        {
          id: "technical-analysis",
          phase: "analysis",
          agent: "Technical Analyst",
          thesis: "Trend improving",
          evidence: "Close above SMA20",
          verdict: "support",
          confidence: 64,
          tone: "positive"
        }
      ],
      decisionLog: [
        {
          agent: "AI Boundary",
          message: "No buy/sell instructions.",
          tone: "ai"
        }
      ],
      boundary: "Evidence explanation only; no buy/sell instructions or guaranteed returns."
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];

    const result = await saveAiReviewRunRecord("http://127.0.0.1:8765", record, async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          aiReview: {
            aiReviewId: record.aiReviewId,
            runId: record.runId,
            createdAt: record.createdAt,
            record
          }
        })
      };
    });

    expect(buildResearchRunAiReviewsUrl("http://127.0.0.1:8765/", "run 你好/1")).toBe(
      "http://127.0.0.1:8765/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1/ai-reviews"
    );
    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/research/runs/run-ai-save/ai-reviews");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual(record);
    expect(result.source).toBe("core");
    expect(result.aiReview?.record.summary.parameterScanBound).toBe(true);
  });

  test("loads AI review run records for replay and audit history", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunAiReviews("http://127.0.0.1:8765", "run-ai-save", async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          aiReviews: [
            {
              aiReviewId: "ai-review:run-ai-save:rev-ai-save",
              runId: "run-ai-save",
              createdAt: "2026-06-02T08:00:00+00:00",
              record: {
                schemaVersion: 1,
                recordType: "aiqt.aiReviewRun",
                aiReviewId: "ai-review:run-ai-save:rev-ai-save",
                runId: "run-ai-save",
                createdAt: "2026-06-02T08:00:00+00:00",
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                strategyRevision: "rev-ai-save",
                executionMode: "paper_only",
                status: "ready",
                summary: {
                  citationCount: 1,
                  roundCount: 1,
                  decisionCount: 1,
                  parameterScanBound: false,
                  liveExecutionBlocked: true
                },
                dossier: {
                  status: "ready",
                  headline: "AI review bound to run-ai-save",
                  summary: "Evidence only.",
                  citations: []
                },
                citations: [],
                rounds: [],
                decisionLog: [],
                boundary: "Evidence explanation only; no buy/sell instructions or guaranteed returns."
              }
            }
          ]
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs/run-ai-save/ai-reviews"]);
    expect(result.source).toBe("core");
    expect(result.aiReviews).toHaveLength(1);
    expect(result.aiReviews[0]?.record.boundary).toContain("Evidence explanation only");
  });

  test("returns fallback when AI review run history payload is malformed", async () => {
    const result = await loadResearchRunAiReviews("http://127.0.0.1:8765", "run-ai-save", async () => ({
      ok: true,
      status: 200,
      json: async () => ({ aiReviews: [{ runId: "run-ai-save" }] })
    }));

    expect(result.source).toBe("fallback");
    expect(result.aiReviews).toEqual([]);
    expect(result.error).toBe("Invalid AI review run history contract");
  });

  test("loads and saves a research note for the selected context", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: init?.method === "POST" ? 201 : 200,
        json: async () => ({
          note: {
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            body: "关注银行板块相对强度。",
            updatedAt: "2026-05-29T08:00:00+00:00"
          }
        })
      };
    };

    const loaded = await loadResearchNote(
      "http://127.0.0.1:8765/",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      fetcher
    );
    const saved = await saveResearchNote(
      "http://127.0.0.1:8765/",
      {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        body: "关注银行板块相对强度。"
      },
      fetcher
    );

    expect(loaded.note?.body).toBe("关注银行板块相对强度。");
    expect(saved.note?.updatedAt).toBe("2026-05-29T08:00:00+00:00");
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/research/notes?market=ashare&symbol=600000&timeframe=1d");
    expect(calls[1]).toMatchObject({
      url: "http://127.0.0.1:8765/api/research/notes",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }
    });
    expect(JSON.parse(String(calls[1].init?.body))).toMatchObject({
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      body: "关注银行板块相对强度。"
    });
  });

  test("saves the current strategy snapshot to the strategy library", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await saveStrategySnapshot(
      "http://127.0.0.1:8765",
      {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        auditRunId: "run-strategy-api",
        strategy: {
          name: "API saved SMA plan",
          entry: "Close > SMA8",
          exit: "Close < SMA21",
          position: "40% cap per instrument",
          risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
        }
      },
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          status: 201,
          json: async () => ({
            strategy: {
              strategyId: "strategy-rev123",
              createdAt: "2026-05-29T08:00:00+00:00",
              name: "API saved SMA plan",
              revision: "rev123",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              version: 1,
              status: "audited",
              auditRunId: "run-strategy-api",
              strategySnapshot: {
                name: "API saved SMA plan",
                entry: "Close > SMA8",
                exit: "Close < SMA21",
                position: "40% cap per instrument",
                risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
              },
              strategyConfig: {
                name: "API saved SMA plan",
                revision: "rev123",
                market: "ashare",
                symbols: ["600000"],
                timeframe: "1d",
                version: 1,
                entryConditions: [{ kind: "close_above_sma", params: { window: 8 } }],
                exitConditions: [{ kind: "close_below_sma", params: { window: 21 } }],
                risk: {
                  positionPct: 0.4,
                  stopLossPct: 0.06,
                  takeProfitPct: 0.12,
                  maxDrawdownPct: 0.09
                }
              }
            }
          })
        };
      }
    );

    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/strategies");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(calls[0]?.init?.body)).strategy.entry).toBe("Close > SMA8");
    expect(result.source).toBe("core");
    expect(result.strategy?.revision).toBe("rev123");
    expect(result.strategy?.status).toBe("audited");
    expect(result.strategy?.strategyConfig.risk.positionPct).toBe(0.4);
  });

  test("loads strategy library versions for the selected instrument", async () => {
    const calls: string[] = [];
    const result = await loadStrategyLibrary(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", limit: 5 },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            strategies: [
              {
                strategyId: "strategy-rev123",
                createdAt: "2026-05-29T08:00:00+00:00",
                name: "Saved SMA plan",
                revision: "rev123",
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                version: 1,
                status: "draft",
                auditRunId: null,
                strategySnapshot: {
                  name: "Saved SMA plan",
                  entry: "Close > SMA8",
                  exit: "Close < SMA21",
                  position: "40% cap per instrument",
                  risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
                },
                strategyConfig: {
                  name: "Saved SMA plan",
                  revision: "rev123",
                  market: "ashare",
                  symbols: ["600000"],
                  timeframe: "1d",
                  version: 1,
                  entryConditions: [{ kind: "close_above_sma", params: { window: 8 } }],
                  exitConditions: [{ kind: "close_below_sma", params: { window: 21 } }],
                  risk: {
                    positionPct: 0.4,
                    stopLossPct: 0.06,
                    takeProfitPct: 0.12,
                    maxDrawdownPct: 0.09
                  }
                }
              }
            ]
          })
        };
      }
    );

    expect(calls).toEqual(["http://127.0.0.1:8765/api/strategies?market=ashare&symbol=600000&limit=5"]);
    expect(result.source).toBe("core");
    expect(result.strategies).toHaveLength(1);
    expect(result.strategies[0]?.strategySnapshot.entry).toBe("Close > SMA8");
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

  test("surfaces core paper execution gate rejections without treating them as offline fallback", async () => {
    const result = await submitResearchRunPaperExecution("http://127.0.0.1:8765", "run-risk", async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        error: "invalid_paper_execution",
        detail: "paper_execution_strategy_risk_incomplete"
      })
    }));

    expect(result.source).toBe("core");
    expect(result.execution).toBeUndefined();
    expect(result.error).toBe("paper_execution_strategy_risk_incomplete");
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
