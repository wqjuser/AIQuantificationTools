import { useState } from "react";
import type { Stage6SandboxBatch, Stage6SandboxBatchAuthorization } from "../lib/stage6-sandbox";
import type { Stage8ProductionReadonlyContinuity } from "../lib/stage8-readonly-continuity";
import {
  isStage9ProductionAdmissionCandidate,
  isStage9ProductionAdmissionReview,
  type Stage9ProductionAdmissionCandidate,
  type Stage9ProductionAdmissionReview
} from "../lib/stage9-production-admission";
import type { AuditEventRecord } from "../lib/terminal-api";

export function ExecutionStage9ProductionAdmissionSection({
  authorization = null, batch = null, busy = false, candidate = null, continuity = null,
  error = null, onCreateCandidate, onReview, review = null
}: {
  authorization?: Stage6SandboxBatchAuthorization | null;
  batch?: Stage6SandboxBatch | null;
  busy?: boolean;
  candidate?: Stage9ProductionAdmissionCandidate | null;
  continuity?: Stage8ProductionReadonlyContinuity | null;
  error?: string | null;
  onCreateCandidate: () => void;
  onReview: (reviewer: string, outcome: "approved" | "rejected", reason: string) => void;
  review?: Stage9ProductionAdmissionReview | null;
}) {
  const [reviewer, setReviewer] = useState("");
  const [reason, setReason] = useState("");
  const ready = !!authorization && batch?.status === "reconciled" && continuity?.status === "current";
  const detail = error || (!authorization ? "尚无 Stage 6 批次授权。"
    : batch?.status !== "reconciled" ? "Stage 6 批次必须先完成终态对账。"
      : continuity?.status !== "current" ? "Stage 8 生产只读连续性必须保持 current。"
        : candidate ? "候选已绑定只读生产检查；复核不会产生下单权限。"
          : "已具备生成一次性生产委托准入候选的前提。");
  return (
    <section className={`execution-stage5-shadow ${review?.outcome ?? (candidate ? "review" : ready ? "ready" : "blocked")}`}
      aria-labelledby="execution-stage9-title">
      <header>
        <div>
          <span>Stage 9 · Production Order Admission</span>
          <h2 id="execution-stage9-title">生产委托准入准备</h2>
          <p>只读检查，不提交生产委托；候选与人工复核都不授予执行权限</p>
        </div>
        <strong>Production read-only · Orders blocked</strong>
      </header>
      <p role="status" className={error || !ready ? "execution-stage5-shadow-error" : undefined}>{detail}</p>
      {!candidate ? (
        <button disabled={busy || !ready} onClick={onCreateCandidate} type="button">
          {busy ? "检查中…" : "生成生产委托准入候选"}
        </button>
      ) : null}
      <dl>
        <div><dt>Sandbox 批次</dt><dd>{batch?.status ?? "missing"}</dd></div>
        <div><dt>只读连续性</dt><dd>{continuity?.status ?? "missing"}</dd></div>
        <div><dt>候选</dt><dd>{candidate?.status ?? "missing"}</dd></div>
        <div><dt>执行授权</dt><dd>authorizationEffective=false</dd></div>
      </dl>
      {candidate ? (
        <>
          <details open>
            <summary>准入包络与只读检查</summary>
            <ul>{candidate.orders.map((order) => (
              <li key={order.orderId}>
                <strong>{order.symbol} · {order.side}</strong>
                <span>{order.quantity} @ {order.price} · {order.notionalValue} USDT · GTC</span>
                <small>{order.orderId}</small>
              </li>
            ))}</ul>
            <span>市场 {String(candidate.observation.marketChecks.every((row) => row.passed))} · 价格 {String(candidate.observation.priceChecks.every((row) => row.passed))} · 资金 {String(candidate.observation.fundingChecks.every((row) => row.passed))}</span>
            <p>候选到期：{candidate.expiresAt}</p>
            <span className="execution-stage5-shadow-hash">{candidate.candidateHash}</span>
          </details>
          {!review ? (
            <>
              <label>复核人<input value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="实名复核人" /></label>
              <label>复核理由<input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="记录准入判断依据" /></label>
              <button disabled={busy || !ready || !reviewer.trim() || !reason.trim()}
                onClick={() => onReview(reviewer.trim(), "approved", reason.trim())} type="button">
                {busy ? "复核中…" : "批准准入复核"}
              </button>
              <button disabled={busy || !ready || !reviewer.trim() || !reason.trim()}
                onClick={() => onReview(reviewer.trim(), "rejected", reason.trim())} type="button">
                拒绝准入复核
              </button>
            </>
          ) : (
            <details open>
              <summary>不可改写人工复核</summary>
              <p>{review.reviewer} · {review.outcome} · {review.reviewedAt}</p>
              <p>{review.reason}</p>
              <strong>authorizationEffective=false</strong>
              <span className="execution-stage5-shadow-hash">{review.reviewHash}</span>
            </details>
          )}
        </>
      ) : null}
      <p>准入急停复用 Stage 8 撤销；系统不存在第二套 Kill Switch，也没有生产订单 API。</p>
    </section>
  );
}

const stage9AuditEventTypes = new Set([
  "stage9_production_order_admission_candidate",
  "stage9_production_order_admission_review"
]);

export function Stage9ProductionAdmissionAuditLedgerPanel({
  className, events, locale
}: {
  className?: string;
  events: AuditEventRecord[];
  locale: "zh-CN" | "en-US";
}) {
  const rows = events.filter((event) => stage9AuditEventTypes.has(event.eventType));
  return (
    <section className={`execution-stage5-shadow ${className ?? ""}`}
      aria-labelledby="stage9-production-admission-audit-title">
      <header>
        <div>
          <span>Stage 9 · Audit</span>
          <h2 id="stage9-production-admission-audit-title">
            {locale === "zh-CN" ? "生产委托准入审计" : "Production admission audit"}
          </h2>
          <p>{locale === "zh-CN" ? "候选与人工复核只读回放，不提供任何执行操作" : "Read-only candidate and review evidence with no execution actions"}</p>
        </div>
        <strong>Audit-only · Orders blocked</strong>
      </header>
      <details open>
        <summary>{locale === "zh-CN" ? `准入证据 ${rows.length}` : `Admission evidence ${rows.length}`}</summary>
        {rows.length ? (
          <ul>{rows.map((event) => {
            const snapshot = event.metadata.snapshot;
            const record = snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
              ? snapshot as Record<string, unknown> : {};
            const isReview = event.eventType.endsWith("_review");
            const candidate = !isReview && isStage9ProductionAdmissionCandidate(record) ? record : null;
            const review = isReview && isStage9ProductionAdmissionReview(record) ? record : null;
            const valid = candidate
              ? event.eventId === candidate.candidateId
                && event.runId === candidate.baseRunId
                && event.createdAt === candidate.generatedAt
                && event.stage === "stage9-production-order-admission"
                && event.source === candidate.operator
              : review
                ? event.eventId === review.reviewId
                  && event.runId === review.baseRunId
                  && event.createdAt === review.reviewedAt
                  && event.stage === "stage9-production-order-admission-review"
                  && event.source === review.reviewer
                : false;
            const identity = candidate?.candidateId ?? review?.reviewId ?? event.eventId;
            const hash = candidate?.candidateHash ?? review?.reviewHash ?? "";
            const detached = event.metadata.detached === true;
            return (
              <li key={event.eventId}>
                <strong>{isReview ? (locale === "zh-CN" ? "人工复核" : "Review") : (locale === "zh-CN" ? "准入候选" : "Candidate")}</strong>
                <span>{identity}</span>
                <small>{!valid ? "invalid · audit-only" : detached ? "detached · audit-only" : "local · audit-only"}</small>
                <small>{hash}</small>
              </li>
            );
          })}</ul>
        ) : <p>{locale === "zh-CN" ? "暂无 Stage 9 准入审计证据。" : "No Stage 9 admission evidence yet."}</p>}
      </details>
      <p>authorizationEffective=false · liveBlockedBoundary=true</p>
    </section>
  );
}
