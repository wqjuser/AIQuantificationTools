import { describe, expect, test, vi } from "vitest";
import {
  isStage8ProductionReadonlyContinuity,
  loadStage8ProductionReadonlyContinuity,
  setStage8ProductionReadonlyAccess,
  type Stage8ProductionReadonlyContinuity
} from "./stage8-readonly-continuity";

const continuity: Stage8ProductionReadonlyContinuity = {
  kind: "aiqt.stage8ProductionReadonlyContinuity",
  schemaVersion: 1,
  generatedAt: "2026-07-13T12:00:00+00:00",
  status: "current",
  accessState: "active",
  accessControl: null,
  latestProbe: {
    probeId: "stage7-production-readonly-1",
    evidenceHash: "a".repeat(64),
    status: "ready",
    generatedAt: "2026-07-13T11:00:00+00:00",
    productionRouteReviewId: "route-review-1"
  },
  expiresAt: "2026-07-14T10:00:00+00:00",
  stage6HashMatches: true,
  routeReviewCurrent: true,
  probeFresh: true,
  permissionDrift: false,
  blockedReasons: [],
  productionReadOnly: true,
  liveTradingAllowed: false,
  orderRoutingEnabled: false,
  liveOrderSubmitted: false,
  liveRouteExecuted: false,
  liveBlockedBoundary: true,
  continuityHash: "b".repeat(64)
};

describe("Stage 8 production read-only continuity", () => {
  test("validates exact current and revoked contracts", () => {
    expect(isStage8ProductionReadonlyContinuity(continuity)).toBe(true);
    expect(isStage8ProductionReadonlyContinuity({ ...continuity, orderRoutingEnabled: true })).toBe(false);
    expect(isStage8ProductionReadonlyContinuity({ ...continuity, probeFresh: false })).toBe(false);
    expect(isStage8ProductionReadonlyContinuity({ ...continuity, asset: "BTC" })).toBe(false);
  });

  test("loads continuity and posts only the manual access control", async () => {
    const fetcher = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify({ productionReadonlyContinuity: continuity }))
    );
    const loaded = await loadStage8ProductionReadonlyContinuity("http://localhost:8765", fetcher);
    const revoked = await setStage8ProductionReadonlyAccess(
      "http://localhost:8765", "revoke", "incident", null, fetcher
    );

    expect(loaded.continuity).toEqual(continuity);
    expect(revoked.continuity).toEqual(continuity);
    const [url, init] = fetcher.mock.calls[1];
    expect(url).toBe("http://localhost:8765/api/execution/stage8/production-readonly-access-controls");
    expect(JSON.parse(String(init?.body))).toEqual({
      action: "revoke",
      operator: "execution-workspace",
      reason: "incident",
      productionRouteReviewId: null
    });
  });

  test("keeps rejected restore fail closed", async () => {
    const fetcher = vi.fn(async (_url: string, _init?: RequestInit) => new Response(
      JSON.stringify({ error: "stage8_production_readonly_access_control_blocked", blockers: ["route review stale"] }),
      { status: 409 }
    ));
    const result = await setStage8ProductionReadonlyAccess(
      "http://localhost:8765", "restore", "recovered", "route-review-1", fetcher
    );
    expect(result.continuity).toBeUndefined();
    expect(result.error).toContain("stage8_production_readonly_access_control_blocked");
  });
});
