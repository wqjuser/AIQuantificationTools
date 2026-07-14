import { describe, expect, test, vi } from "vitest";
import {
  createStage9ProductionAdmissionCandidate,
  createStage9ProductionAdmissionReview,
  loadStage9ProductionAdmissionCandidates,
  type Stage9ProductionAdmissionCandidate
} from "./stage9-production-admission";

const hash = "a".repeat(64);
const observedAt = "2026-07-14T06:00:00+00:00";
const order = {
  orderId: "order-btc", clientOrderId: "shadow-1234567890abcdef12345678", symbol: "BTC/USDT",
  side: "buy" as const, type: "limit" as const, timeInForce: "GTC" as const,
  quantity: 0.0001, price: 60000, notionalValue: 6
};
const boundary = {
  productionReadOnly: true as const, liveTradingAllowed: false as const,
  orderSubmissionEnabled: false as const, orderRoutingEnabled: false as const,
  liveOrderSubmitted: false as const, liveRouteExecuted: false as const, liveBlockedBoundary: true as const
};
const observation = {
  kind: "aiqt.stage9ProductionAdmissionObservation" as const, schemaVersion: 1 as const,
  observedAt, exchangeId: "binance" as const,
  marketChecks: [{ orderId: order.orderId, passed: true }],
  priceChecks: [{ orderId: order.orderId, quoteObservedAt: observedAt, referencePrice: 60000, adverseDeviationPct: 0, passed: true }],
  fundingChecks: [{ orderId: order.orderId, passed: true }],
  passed: true, blockedReasons: [], ...boundary, observationHash: hash
};
const candidate: Stage9ProductionAdmissionCandidate = {
  kind: "aiqt.stage9ProductionOrderAdmissionCandidate", schemaVersion: 1,
  candidateId: "stage9-production-admission-1234567890abcdef12345678", candidateKey: hash,
  candidateHash: hash, generatedAt: observedAt, expiresAt: "2026-07-14T06:10:00+00:00",
  baseRunId: "run-a", workflowId: "workflow-a", workflowHash: hash, batchId: "batch-a",
  sandboxAuthorizationId: "authorization-a", sandboxAuthorizationHash: hash,
  sandboxBatchStatus: "reconciled", stage8ContinuityHash: hash,
  productionRouteReviewId: "route-review-a", orders: [order], ordersHash: hash,
  observation, operator: "execution-workspace", status: "ready_for_review", ...boundary
};

describe("Stage 9 production order admission", () => {
  test("creates and restores a safety-bound candidate", async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => new Response(JSON.stringify(
      init?.method === "POST"
        ? { productionOrderAdmissionCandidate: candidate }
        : { productionOrderAdmissionCandidates: [candidate] }
    ), { status: init?.method === "POST" ? 201 : 200 }));

    const created = await createStage9ProductionAdmissionCandidate(
      "http://localhost:8765", "authorization-a", fetcher
    );
    const restored = await loadStage9ProductionAdmissionCandidates(
      "http://localhost:8765", "run-a", fetcher
    );

    expect(created.candidate).toEqual(candidate);
    expect(restored.candidates).toEqual([candidate]);
    expect(JSON.parse(fetcher.mock.calls[0][1]?.body as string)).toEqual({
      authorizationId: "authorization-a", operator: "execution-workspace"
    });
  });

  test("records one named immutable review with all fixed confirmations", async () => {
    const review = {
      kind: "aiqt.stage9ProductionOrderAdmissionReview", schemaVersion: 1,
      reviewId: "stage9-production-admission-review-1234567890abcdef12345678", reviewHash: hash,
      reviewedAt: "2026-07-14T06:01:00+00:00", baseRunId: "run-a",
      candidateId: candidate.candidateId, candidateHash: hash,
      sandboxAuthorizationId: "authorization-a", stage8ContinuityHash: hash,
      reviewObservation: { ...observation, observedAt: "2026-07-14T06:01:00+00:00",
        priceChecks: [{ ...observation.priceChecks[0], quoteObservedAt: "2026-07-14T06:01:00+00:00" }] },
      reviewer: "李复核", outcome: "approved", reason: "证据已核对",
      confirmedScopeIds: [
        "candidate-hash-reviewed", "production-envelope-reviewed", "market-and-funding-checks-reviewed",
        "stage8-continuity-current", "no-production-execution-authority"
      ],
      status: "admission_review_recorded", authorizationEffective: false, ...boundary
    } as const;
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => new Response(JSON.stringify({
      productionOrderAdmissionReview: review, requestBody: init?.body
    }), { status: 201 }));

    const result = await createStage9ProductionAdmissionReview(
      "http://localhost:8765", candidate.candidateId, "李复核", "approved", "证据已核对", fetcher
    );

    expect(result.review).toEqual(review);
    const body = JSON.parse(fetcher.mock.calls[0][1]?.body as string);
    expect(body.confirmations).toEqual(Object.fromEntries(review.confirmedScopeIds.map((id) => [id, true])));
    expect(result.review?.authorizationEffective).toBe(false);
  });

  test("rejects a contract that widens the production boundary", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      productionOrderAdmissionCandidates: [{ ...candidate, orderSubmissionEnabled: true }]
    })));
    const result = await loadStage9ProductionAdmissionCandidates("http://localhost:8765", "run-a", fetcher);
    expect(result.source).toBe("fallback");
    expect(result.error).toContain("Invalid Stage 9 candidate history contract");
  });
});
