import { describe, expect, test, vi } from "vitest";
import {
  authorizeStage6SandboxBatch,
  buildStage6BatchUrl,
  buildStage6GoldenPath,
  isStage6SandboxBatch,
  isStage6SandboxBatchAuthorization,
  loadStage6ExitAcceptance,
  setStage6KillSwitch,
  submitStage6SandboxBatch,
  type Stage6SandboxBatch,
  type Stage6SandboxBatchAuthorization
} from "./stage6-sandbox";

const order = {
  orderId: "order-1", clientOrderId: `shadow-${"a".repeat(24)}`, symbol: "BTC/USDT",
  side: "buy" as const, type: "limit" as const, timeInForce: "GTC" as const,
  quantity: 0.01, price: 60000, notionalValue: 600
};
const authorization: Stage6SandboxBatchAuthorization = {
  kind: "aiqt.stage6SandboxBatchAuthorization", schemaVersion: 1,
  authorizationId: "stage6-auth-1", authorizationHash: "1".repeat(64),
  generatedAt: "2026-07-12T10:00:00+00:00", expiresAt: "2026-07-12T10:10:00+00:00",
  baseRunId: "run-1", workflowId: "workflow-1", workflowHash: "2".repeat(64), batchId: "batch-1",
  shadowSessionHash: "3".repeat(64), readinessDecisionHash: "4".repeat(64),
  preflightHash: "5".repeat(64), reviewHash: "6".repeat(64), orders: [order], ordersHash: "7".repeat(64),
  operator: "operator", status: "authorized", sandboxOnly: true, sandboxOrderSubmissionAllowed: true,
  sandboxOrderSubmitted: false, sandboxRouteExecuted: false,
  liveTradingAllowed: false, liveOrderSubmissionAllowed: false, liveOrderSubmitted: false,
  liveRouteExecuted: false, liveBlockedBoundary: true
};
const batch: Stage6SandboxBatch = {
  authorizationId: authorization.authorizationId, baseRunId: "run-1", batchId: "batch-1", status: "active",
  orders: [{ ...order, state: "open", attempt: 1, exchangeEvidence: { exchangeOrderId: "exchange-1" } }],
  killSwitch: { enabled: true, triggered: false, recordedAt: null, operator: null },
  sandboxOnly: true, sandboxOrderSubmitted: true, sandboxRouteExecuted: true,
  liveTradingAllowed: false, liveOrderSubmissionAllowed: false, liveOrderSubmitted: false,
  liveRouteExecuted: false, liveBlockedBoundary: true
};

describe("Stage 6 sandbox client", () => {
  test("validates strict sandbox and live-blocked contracts", () => {
    expect(isStage6SandboxBatchAuthorization(authorization)).toBe(true);
    expect(isStage6SandboxBatchAuthorization({ ...authorization, liveTradingAllowed: true })).toBe(false);
    expect(isStage6SandboxBatch(batch)).toBe(true);
    expect(isStage6SandboxBatch({ ...batch, sandboxOnly: false })).toBe(false);
  });

  test("derives the single golden-path action", () => {
    expect(buildStage6GoldenPath(null, null, null, null, null, null, null).status).toBe("blocked");
    const upstream = [{}, {}, {}, {}, { outcome: "approved" }] as const;
    const golden = (auth: Stage6SandboxBatchAuthorization | null, value: Stage6SandboxBatch | null) =>
      buildStage6GoldenPath(upstream[0] as any, upstream[1] as any, upstream[2] as any,
        upstream[3] as any, upstream[4] as any, auth, value);
    expect(golden(null, null).action).toBe("authorize");
    expect(golden(authorization, null).action).toBe("submit");
    expect(golden(authorization, batch).action).toBe("cancel");
    expect(golden(authorization, { ...batch, status: "reconciliation_required" }).action).toBe("reconcile");
  });

  test("posts authority ids and validates submission response", async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true, status: 201,
      json: async () => String(init?.body).includes("workflowId")
        ? { sandboxBatchAuthorization: authorization }
        : { sandboxBatch: batch }
    } as Response));
    const upstream = [
      { workflowId: "workflow-1" }, { sessionId: "session-1" }, { decisionId: "decision-1" },
      { preflightId: "preflight-1" }, { reviewId: "review-1" }
    ] as const;
    const created = await authorizeStage6SandboxBatch(
      "http://localhost:8765", upstream[0] as any, upstream[1] as any, upstream[2] as any,
      upstream[3] as any, upstream[4] as any, fetcher
    );
    const submitted = await submitStage6SandboxBatch("http://localhost:8765", authorization.authorizationId, fetcher);
    expect(created.authorization?.authorizationId).toBe("stage6-auth-1");
    expect(submitted.batch?.status).toBe("active");
    expect(buildStage6BatchUrl("http://localhost:8765", "auth 1")).toContain("authorizationId=auth+1");
    const switched = await setStage6KillSwitch("http://localhost:8765", true, vi.fn(async () => ({
      ok: true,
      json: async () => ({
        killSwitch: {
          enabled: true, triggered: true, recordedAt: "2026-07-12T10:00:00+00:00", operator: "local-operator"
        }
      })
    } as Response)));
    expect(switched.killSwitch?.triggered).toBe(true);
    const exit = await loadStage6ExitAcceptance("http://localhost:8765", vi.fn(async () => ({
      ok: true,
      json: async () => ({ acceptance: {
        kind: "aiqt.stage6ExitAcceptanceStatus", schemaVersion: 1, status: "missing", available: false,
        sourcePath: "data/stage6-exit-acceptance.json", summary: "missing", reason: "real manifest missing",
        authorizationId: null, exitHash: null, sandboxOrderSubmitted: false, sandboxRouteExecuted: false,
        liveTradingAllowed: false, liveBlockedBoundary: true
      } })
    } as Response)));
    expect(exit.acceptance?.status).toBe("missing");
  });
});
