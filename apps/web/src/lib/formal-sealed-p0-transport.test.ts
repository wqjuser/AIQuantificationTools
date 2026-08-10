import { describe, expect, it, vi } from "vitest";

import { buildTerminalWorkspace } from "./terminal-workbench";
import {
  buildFormalSealedDatasetWindow,
  buildP0PipelineRequest,
} from "./p0-research-transport";
import { loadResearchRunDetail } from "./research-run-transport";
import type { WorkspaceFetcher } from "./terminal-api-http";

const sealedWindow = {
  start: "2026-04-21T18:01:00+00:00",
  developmentEndExclusive: "2026-07-12T00:00:00+00:00",
  endExclusive: "2026-07-30T00:00:00+00:00",
} as const;

const sealedSummary = {
  datasetId: `sealed-${"a".repeat(24)}`,
  market: "crypto",
  symbol: "BTC/USDT",
  timeframe: "1m",
  source: "binance",
  adjustmentMode: "none",
  ...sealedWindow,
  rows: 142_919,
  developmentRows: 116_999,
  withheldRows: 25_920,
  datasetHash: "a".repeat(64),
  developmentHash: "d".repeat(64),
} as const;

function sealedRunPayload() {
  return {
    runId: "run-formal-sealed",
    createdAt: "2026-08-10T00:00:00+00:00",
    market: "crypto",
    symbol: "BTC/USDT",
    timeframe: "1m",
    strategyName: "Regime breakout v2",
    strategyRevision: "regime-v2",
    dataRows: 116_999,
    metrics: { total_return_pct: 1.2 },
    decisions: [],
    executionMode: "paper_only",
    dataQuality: {
      source: "binance",
      isComplete: true,
      warnings: [],
      rows: 116_999,
      canonicalHash: "d".repeat(64),
    },
    dataSnapshot: {
      source: "binance",
      isComplete: true,
      warnings: [],
      rows: 116_999,
      start: sealedWindow.start,
      endExclusive: sealedWindow.developmentEndExclusive,
      hashVersion: "aiqt-sealed-v1",
      hash: "d".repeat(64),
      snapshotHash: "b".repeat(64),
      adjustmentMode: "none",
      preRollVersion: "formal-pre-roll-v2",
      scoringWindow: {
        start: "2026-05-01T00:00:00+00:00",
        endExclusive: sealedWindow.endExclusive,
        rows: 129_600,
        preRollRows: 13_319,
      },
      coverage: {
        actualRows: 116_999,
        expectedRows: 116_999,
        gapCount: 0,
        ratio: 1,
      },
      qualityIssues: [],
      sealedDataset: sealedSummary,
    },
    strategyConfig: {
      name: "Regime breakout v2",
      revision: "regime-v2",
      market: "crypto",
      symbols: ["BTC/USDT"],
      timeframe: "1m",
      version: 2,
      entryConditions: [],
      exitConditions: [],
      policy: { kind: "regime_breakout_v2" },
      risk: {
        positionPct: 0.6,
        riskBudgetPct: 0.005,
        stopLossPct: null,
        takeProfitPct: null,
        maxDrawdownPct: 0.03,
        dailyLossLimitPct: 0.02,
        maxTradeGroupsPerHour: 1,
        maxEntryNotionalQuote: null,
        exitNotionalCapQuote: null,
      },
    },
  };
}

describe("formal sealed P0 Web transport", () => {
  it("strictly accepts a real server-owned aiqt-sealed-v1 run without browser bars", async () => {
    const run = sealedRunPayload();
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ run }),
    })) as WorkspaceFetcher;

    const result = await loadResearchRunDetail("/", run.runId, fetcher);

    expect(result).toEqual({ run, source: "core" });
    expect(result.run?.dataSnapshot?.hashVersion).toBe("aiqt-sealed-v1");
    expect(result.run?.dataSnapshot?.preRollVersion).toBe("formal-pre-roll-v2");
    expect(result.run?.dataSnapshot?.scoringWindow).toEqual({
      start: "2026-05-01T00:00:00+00:00",
      endExclusive: sealedWindow.endExclusive,
      rows: 129_600,
      preRollRows: 13_319,
    });
    expect(result.run?.strategyConfig?.version).toBe(2);
    expect(result.run?.dataSnapshot).not.toHaveProperty("bars");
    expect(result.run?.dataSnapshot).not.toHaveProperty("testHash");
  });

  it("fails closed when a sealed run contains bars, test identity, or mismatched development evidence", async () => {
    const valid = sealedRunPayload();
    const invalidRuns = [
      {
        ...valid,
        dataSnapshot: { ...valid.dataSnapshot, bars: [] },
      },
      {
        ...valid,
        dataSnapshot: { ...valid.dataSnapshot, testHash: "f".repeat(64) },
      },
      {
        ...valid,
        dataSnapshot: { ...valid.dataSnapshot, snapshotHash: "not-a-sha256" },
      },
      {
        ...valid,
        dataSnapshot: {
          ...valid.dataSnapshot,
          sealedDataset: {
            ...valid.dataSnapshot.sealedDataset,
            datasetId: "sealed-wrong-identity",
          },
        },
      },
      {
        ...valid,
        dataSnapshot: {
          ...valid.dataSnapshot,
          sealedDataset: {
            ...valid.dataSnapshot.sealedDataset,
            developmentHash: "e".repeat(64),
          },
        },
      },
      {
        ...valid,
        dataSnapshot: {
          ...valid.dataSnapshot,
          preRollVersion: "formal-pre-roll-v1",
        },
      },
      {
        ...valid,
        dataSnapshot: {
          ...valid.dataSnapshot,
          scoringWindow: {
            ...valid.dataSnapshot.scoringWindow,
            rows: 129_599,
          },
        },
      },
      {
        ...valid,
        dataSnapshot: {
          ...valid.dataSnapshot,
          scoringWindow: {
            ...valid.dataSnapshot.scoringWindow,
            preRollRows: 13_318,
          },
        },
      },
      {
        ...valid,
        dataSnapshot: {
          ...valid.dataSnapshot,
          scoringWindow: {
            ...valid.dataSnapshot.scoringWindow,
            start: "2026-05-01T00:01:00+00:00",
          },
        },
      },
      {
        ...valid,
        dataSnapshot: {
          ...valid.dataSnapshot,
          scoringWindow: {
            ...valid.dataSnapshot.scoringWindow,
            endExclusive: "2026-07-29T23:59:00+00:00",
          },
        },
      },
      {
        ...valid,
        dataSnapshot: {
          ...valid.dataSnapshot,
          scoringWindow: {
            ...valid.dataSnapshot.scoringWindow,
            browserExtra: true,
          },
        },
      },
    ];

    for (const run of invalidRuns) {
      const fetcher = vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ run }),
      })) as WorkspaceFetcher;

      await expect(loadResearchRunDetail("/", run.runId, fetcher)).resolves.toEqual({
        source: "fallback",
        error: "Invalid research run detail contract",
      });
    }
  });

  it("retains read compatibility for historical sealed snapshots without v2 scoring identity", async () => {
    const run = sealedRunPayload();
    const legacySnapshot = { ...run.dataSnapshot } as Record<string, unknown>;
    delete legacySnapshot.preRollVersion;
    delete legacySnapshot.scoringWindow;
    const legacyRun = { ...run, dataSnapshot: legacySnapshot };
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ run: legacyRun }),
    })) as WorkspaceFetcher;

    await expect(loadResearchRunDetail("/", run.runId, fetcher)).resolves.toEqual({
      run: legacyRun,
      source: "core",
    });
  });

  it("sends only the server-computed sealed window fields in a P0 request", () => {
    const workspace = buildTerminalWorkspace();
    const request = buildP0PipelineRequest({
      market: "crypto",
      symbol: "BTC/USDT",
      timeframe: "1m",
      registeredTemplateId: "regime-breakout-v2",
      sealedDataset: {
        ...sealedWindow,
        bars: [{ close: 99 }],
        testHash: "browser-test-hash",
        datasetId: "browser-dataset-id",
      },
    } as never, workspace);

    expect(request.sealedDataset).toEqual(sealedWindow);
    expect(request.registeredTemplateId).toBe("regime-breakout-v2");
    expect(request).not.toHaveProperty("strategyConfig");
    expect(request).not.toHaveProperty("assumptions");
    expect(JSON.stringify(request)).not.toContain("browser-test-hash");
    expect(JSON.stringify(request)).not.toContain("browser-dataset-id");
    expect(JSON.stringify(request)).not.toContain("\"bars\"");
    expect(JSON.stringify(request)).not.toContain("100000");
  });

  it("keeps the existing strategyConfig request when no registered template was selected", () => {
    const workspace = buildTerminalWorkspace();
    const request = buildP0PipelineRequest({
      market: "crypto",
      symbol: "BTC/USDT",
      timeframe: "1m",
      limit: 500,
    }, workspace);

    expect(request).toMatchObject({
      strategyConfig: workspace.strategy,
      assumptions: workspace.backtestAssumptions,
    });
    expect(request).not.toHaveProperty("registeredTemplateId");
    expect(request).not.toHaveProperty("sealedDataset");
  });

  it("derives the full sealed window only from the server capability and a completed bar boundary", () => {
    const endExclusive = "2026-08-10T00:00:00.000Z";
    const window = buildFormalSealedDatasetWindow({
      hashVersion: "aiqt-sealed-v1",
      minimumRows: 142_919,
      minimumPreRollRows: 13_319,
      developmentScoringRows: 103_680,
      withheldRows: 25_920,
    }, endExclusive);

    expect(window.endExclusive).toBe(endExclusive);
    expect(Date.parse(window.endExclusive) - Date.parse(window.start))
      .toBe(142_919 * 60_000);
    expect(Date.parse(window.developmentEndExclusive) - Date.parse(window.start))
      .toBe((13_319 + 103_680) * 60_000);
    expect(Date.parse(window.endExclusive) - Date.parse(window.developmentEndExclusive))
      .toBe(25_920 * 60_000);
  });
});
