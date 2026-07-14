import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import type { Stage6SandboxBatch, Stage6SandboxBatchAuthorization } from "../lib/stage6-sandbox";
import type { Stage8ProductionReadonlyContinuity } from "../lib/stage8-readonly-continuity";
import type { Stage9ProductionAdmissionCandidate, Stage9ProductionAdmissionReview } from "../lib/stage9-production-admission";
import {
  ExecutionStage9ProductionAdmissionSection,
  Stage9ProductionAdmissionAuditLedgerPanel
} from "./ExecutionStage9ProductionAdmissionSection";

describe("ExecutionStage9ProductionAdmissionSection", () => {
  test("only offers a read-only candidate after Stage 6 reconciliation and current Stage 8 continuity", () => {
    const html = renderToStaticMarkup(<ExecutionStage9ProductionAdmissionSection
      authorization={{ authorizationId: "authorization-a" } as Stage6SandboxBatchAuthorization}
      batch={{ status: "reconciled" } as Stage6SandboxBatch}
      continuity={{ status: "current" } as Stage8ProductionReadonlyContinuity}
      onCreateCandidate={() => undefined}
      onReview={() => undefined}
    />);
    expect(html).toContain("生成生产委托准入候选");
    expect(html).toContain("只读检查，不提交生产委托");
    expect(html).not.toContain("连接生产下单");
  });

  test("renders an immutable review as non-effective authority", () => {
    const candidate = {
      candidateId: "candidate-a", candidateHash: "a".repeat(64), expiresAt: "2026-07-14T06:10:00+00:00",
      orders: [{ orderId: "order-a", symbol: "BTC/USDT", side: "buy", quantity: 0.0001, price: 60000, notionalValue: 6 }],
      observation: { marketChecks: [{ passed: true }], priceChecks: [{ passed: true }], fundingChecks: [{ passed: true }] }
    } as Stage9ProductionAdmissionCandidate;
    const review = {
      reviewer: "李复核", outcome: "approved", reason: "已核对", authorizationEffective: false,
      reviewHash: "b".repeat(64), reviewedAt: "2026-07-14T06:01:00+00:00"
    } as Stage9ProductionAdmissionReview;
    const html = renderToStaticMarkup(<ExecutionStage9ProductionAdmissionSection
      candidate={candidate}
      review={review}
      onCreateCandidate={() => undefined}
      onReview={() => undefined}
    />);
    expect(html).toContain("李复核");
    expect(html).toContain("approved");
    expect(html).toContain("authorizationEffective=false");
    expect(html).toContain("BTC/USDT");
    expect(html).not.toContain("批准准入复核</button>");
  });

  test("distinguishes valid detached evidence from invalid event bindings", () => {
    const boundary = {
      productionReadOnly: true as const, liveTradingAllowed: false as const,
      orderSubmissionEnabled: false as const, orderRoutingEnabled: false as const,
      liveOrderSubmitted: false as const, liveRouteExecuted: false as const, liveBlockedBoundary: true as const
    };
    const review = {
      kind: "aiqt.stage9ProductionOrderAdmissionReview" as const, schemaVersion: 1 as const,
      reviewId: "stage9-production-admission-review-1234567890abcdef12345678", reviewHash: "b".repeat(64),
      reviewedAt: "2026-07-14T06:01:00+00:00", baseRunId: "run-a",
      candidateId: "stage9-production-admission-1234567890abcdef12345678", candidateHash: "a".repeat(64),
      sandboxAuthorizationId: "authorization-a", stage8ContinuityHash: "a".repeat(64),
      reviewObservation: {
        kind: "aiqt.stage9ProductionAdmissionObservation" as const, schemaVersion: 1 as const,
        observedAt: "2026-07-14T06:01:00+00:00", exchangeId: "binance" as const,
        marketChecks: [{ orderId: "order-a", passed: true }],
        priceChecks: [{ orderId: "order-a", quoteObservedAt: "2026-07-14T06:01:00+00:00", referencePrice: 60000, adverseDeviationPct: 0, passed: true }],
        fundingChecks: [{ orderId: "order-a", passed: true }], passed: true, blockedReasons: [], observationHash: "c".repeat(64), ...boundary
      },
      reviewer: "李复核", outcome: "approved" as const, reason: "证据已核对",
      confirmedScopeIds: [
        "candidate-hash-reviewed", "production-envelope-reviewed", "market-and-funding-checks-reviewed",
        "stage8-continuity-current", "no-production-execution-authority"
      ] as const,
      status: "admission_review_recorded" as const, authorizationEffective: false as const, ...boundary
    };
    const detachedHtml = renderToStaticMarkup(<Stage9ProductionAdmissionAuditLedgerPanel
      locale="zh-CN"
      events={[
        {
          schemaVersion: 1, eventId: review.reviewId, eventType: "stage9_production_order_admission_review",
          runId: review.baseRunId, createdAt: review.reviewedAt,
          stage: "stage9-production-order-admission-review", source: review.reviewer,
          summary: "review", detail: "read-only", metadata: { detached: true, snapshot: review }
        }
      ]}
    />);
    const invalidHtml = renderToStaticMarkup(<Stage9ProductionAdmissionAuditLedgerPanel
      locale="zh-CN"
      events={[
        {
          schemaVersion: 1, eventId: review.reviewId, eventType: "stage9_production_order_admission_review",
          runId: review.baseRunId, createdAt: review.reviewedAt, stage: "stage9", source: "test",
          summary: "review", detail: "read-only", metadata: { detached: true, snapshot: review }
        }
      ]}
    />);
    expect(detachedHtml).toContain("生产委托准入审计");
    expect(detachedHtml).toContain("人工复核");
    expect(detachedHtml).toContain("detached · audit-only");
    expect(detachedHtml).toContain("authorizationEffective=false");
    expect(detachedHtml).not.toContain("<button");
    expect(invalidHtml).toContain("invalid · audit-only");
    expect(invalidHtml).not.toContain("detached · audit-only");
  });
});
