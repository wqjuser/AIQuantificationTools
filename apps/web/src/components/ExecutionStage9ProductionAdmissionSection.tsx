import { useState } from "react";
import type { Stage6SandboxBatch, Stage6SandboxBatchAuthorization } from "../lib/stage6-sandbox";
import type { Stage8ProductionReadonlyContinuity } from "../lib/stage8-readonly-continuity";
import type {
  Stage9ProductionAdmissionCandidate,
  Stage9ProductionAdmissionReview
} from "../lib/stage9-production-admission";

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
