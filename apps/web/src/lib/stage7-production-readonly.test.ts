import { describe, expect, test, vi } from "vitest";
import {
  isStage7ProductionReadonlyProbe,
  loadStage7ProductionReadonlyProbes,
  runStage7ProductionReadonlyProbe,
  type Stage7ProductionReadonlyProbe
} from "./stage7-production-readonly";

const probe: Stage7ProductionReadonlyProbe = {
  kind: "aiqt.stage7ProductionReadonlyProbe", schemaVersion: 1,
  probeId: "stage7-production-readonly-probe-1", adapterId: "ccxt-live",
  exchangeId: "binance", mode: "production-readonly", status: "ready", generatedAt: "2026-07-13T10:00:00+00:00",
  stage6ExitHash: "1".repeat(64), productionRouteReviewId: "review-1", operator: "execution-workspace",
  eligibilityConfirmed: true, checks: [{ id: "api-key-permissions", status: "passed" }],
  credentialFlags: { keyConfigured: true, signingConfigured: true }, marketCount: 1200,
  apiPermissions: {
    readingEnabled: true, spotTradingEnabled: false, marginTradingEnabled: false,
    futuresTradingEnabled: false, optionsTradingEnabled: false,
    withdrawalsEnabled: false, internalTransferEnabled: false,
    universalTransferEnabled: false
  },
  accountSummary: { accountType: "SPOT", nonZeroAssetCount: 2, observedAt: "2026-07-13T10:00:00+00:00" },
  accountSyncState: "ready", accountDataAccessed: true, blockedReasons: [], productionReadOnly: true,
  paperOnly: false, liveTradingAllowed: false, orderRoutingEnabled: false, liveOrderSubmitted: false,
  liveRouteExecuted: false, liveBlockedBoundary: true, evidenceHash: "2".repeat(64)
};

describe("Stage 7 production read-only client", () => {
  test("accepts only strict production read-only boundaries", () => {
    expect(isStage7ProductionReadonlyProbe(probe)).toBe(true);
    expect(isStage7ProductionReadonlyProbe({ ...probe, orderRoutingEnabled: true })).toBe(false);
    expect(isStage7ProductionReadonlyProbe({
      ...probe, apiPermissions: { ...probe.apiPermissions, withdrawalsEnabled: true }
    })).toBe(false);
    expect(isStage7ProductionReadonlyProbe({ ...probe, accountSummary: { ...probe.accountSummary, asset: "BTC" } })).toBe(false);
  });

  test("posts only the route review authority and eligibility confirmation", async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true, status: 201, json: async () => ({ productionReadonlyProbe: probe, requestBody: init?.body })
    } as Response));
    const result = await runStage7ProductionReadonlyProbe("http://localhost:8765", "review-1", true, fetcher);
    expect(result.probe?.status).toBe("ready");
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({
      productionRouteReviewId: "review-1", operator: "execution-workspace", eligibilityConfirmed: true
    });
  });

  test("keeps a persisted blocked probe visible and loads history", async () => {
    const blocked = { ...probe, status: "blocked" as const, accountDataAccessed: false,
      accountSyncState: "credentials_missing", blockedReasons: ["production_readonly_credentials_missing"] };
    const blockedResult = await runStage7ProductionReadonlyProbe("http://localhost:8765", "review-1", true, vi.fn(async () => ({
      ok: false, status: 409, json: async () => ({ productionReadonlyProbe: blocked })
    } as Response)));
    expect(blockedResult.probe?.status).toBe("blocked");
    expect(blockedResult.error).toContain("credentials_missing");
    const history = await loadStage7ProductionReadonlyProbes("http://localhost:8765", 5, vi.fn(async () => ({
      ok: true, status: 200, json: async () => ({ productionReadonlyProbes: [blocked] })
    } as Response)));
    expect(history.probes).toHaveLength(1);
  });
});
