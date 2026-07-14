import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import type { Stage6SandboxBatch, Stage6SandboxBatchAuthorization } from "../lib/stage6-sandbox";
import type { Stage8ProductionReadonlyContinuity } from "../lib/stage8-readonly-continuity";
import type { Stage9ProductionAdmissionCandidate, Stage9ProductionAdmissionReview } from "../lib/stage9-production-admission";
import { ExecutionStage9ProductionAdmissionSection } from "./ExecutionStage9ProductionAdmissionSection";

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
});
