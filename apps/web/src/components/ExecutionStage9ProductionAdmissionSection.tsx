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
import { executionEvidenceLabel } from "./execution-readiness-display";

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
  const detail = error || (!authorization ? "尚无阶段 6 批次授权。"
    : batch?.status !== "reconciled" ? "阶段 6 批次必须先完成终态对账。"
      : continuity?.status !== "current" ? "阶段 8 生产只读连续性必须保持有效。"
        : candidate ? "候选已绑定只读生产检查；复核不会产生下单权限。"
          : "已具备生成一次性生产委托准入候选的前提。");
  return (
    <section className={`execution-stage5-shadow ${review?.outcome ?? (candidate ? "review" : ready ? "ready" : "blocked")}`}
      aria-labelledby="execution-stage9-title">
      <header>
        <div>
          <span>阶段 9 · 生产委托准入</span>
          <h2 id="execution-stage9-title">生产委托准入准备</h2>
          <p>只读检查，不提交生产委托；候选与人工复核都不授予执行权限</p>
        </div>
        <strong>仅生产只读 · 委托持续阻断</strong>
      </header>
      <p role="status" className={error || !ready ? "execution-stage5-shadow-error" : undefined}>{detail}</p>
      {!candidate ? (
        <button disabled={busy || !ready} onClick={onCreateCandidate} type="button">
          {busy ? "检查中…" : "生成生产委托准入候选"}
        </button>
      ) : null}
      <details className="execution-stage-technical">
        <summary>查看技术证据</summary>
        <dl>
          <div><dt>测试网批次</dt><dd>{executionEvidenceLabel(batch?.status ?? "missing")}</dd></div>
          <div><dt>只读连续性</dt><dd>{executionEvidenceLabel(continuity?.status ?? "missing")}</dd></div>
          <div><dt>候选</dt><dd>{executionEvidenceLabel(candidate?.status ?? "missing")}</dd></div>
          <div><dt>执行授权</dt><dd>授权不会生效</dd></div>
        </dl>
      </details>
      {candidate ? (
        <>
          <details open>
            <summary>准入包络与只读检查</summary>
            <ul>{candidate.orders.map((order) => (
              <li key={order.orderId}>
                <strong>{order.symbol} · {order.side === "buy" ? "买入" : "卖出"}</strong>
                <span>{order.quantity} @ {order.price} · {order.notionalValue} USDT · GTC</span>
                <small>{order.orderId}</small>
              </li>
            ))}</ul>
            <span>市场 {executionEvidenceLabel(candidate.observation.marketChecks.every((row) => row.passed))} · 价格 {executionEvidenceLabel(candidate.observation.priceChecks.every((row) => row.passed))} · 资金 {executionEvidenceLabel(candidate.observation.fundingChecks.every((row) => row.passed))}</span>
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
              <p>{review.reviewer} · {executionEvidenceLabel(review.outcome)} · {review.reviewedAt}</p>
              <p>{review.reason}</p>
              <strong>授权不会生效</strong>
              <span className="execution-stage5-shadow-hash">{review.reviewHash}</span>
            </details>
          )}
        </>
      ) : null}
      <p>准入急停复用阶段 8 撤销；系统没有第二套急停开关，也不提供生产订单接口。</p>
    </section>
  );
}

export const executionAcceptanceAuditEventTypes = [
  "stage5_shadow_execution_session",
  "stage5_sandbox_readiness_decision",
  "stage5_sandbox_authorization_preflight",
  "stage5_sandbox_authorization_review",
  "stage6_sandbox_batch_authorization",
  "stage6_sandbox_order_transition",
  "stage6_sandbox_kill_switch",
  "stage7_production_readonly_probe",
  "stage8_production_readonly_access_control",
  "stage9_production_order_admission_candidate",
  "stage9_production_order_admission_review"
] as const;

const executionAcceptanceAuditEventTypeSet = new Set<string>(executionAcceptanceAuditEventTypes);
const executionAcceptanceStages = [
  {
    id: 5,
    title: "影子执行验收",
    titleEn: "Shadow execution acceptance",
    detail: "隔离执行、测试网准备与人工授权证据"
  },
  {
    id: 6,
    title: "手工测试网验收",
    titleEn: "Manual sandbox acceptance",
    detail: "批次授权、订单状态与测试网急停证据"
  },
  {
    id: 7,
    title: "生产只读探针",
    titleEn: "Production read-only probe",
    detail: "历史只读账户与权限探测证据"
  },
  {
    id: 8,
    title: "只读连续性控制",
    titleEn: "Read-only continuity control",
    detail: "历史生产只读访问恢复与撤销证据"
  },
  {
    id: 9,
    title: "旧单笔生产准入",
    titleEn: "Legacy single-order admission",
    detail: "候选与人工复核证据；不授予自动交易权限"
  }
] as const;

const executionAcceptanceEventLabels: Record<string, string> = {
  stage5_shadow_execution_session: "影子执行会话",
  stage5_sandbox_readiness_decision: "测试网就绪决策",
  stage5_sandbox_authorization_preflight: "测试网授权预检",
  stage5_sandbox_authorization_review: "测试网授权复核",
  stage6_sandbox_batch_authorization: "测试网批次授权",
  stage6_sandbox_order_transition: "测试网订单状态",
  stage6_sandbox_kill_switch: "测试网急停",
  stage7_production_readonly_probe: "生产只读探针",
  stage8_production_readonly_access_control: "只读访问控制",
  stage9_production_order_admission_candidate: "生产准入候选",
  stage9_production_order_admission_review: "人工复核"
};

export function ExecutionAcceptanceAuditLedgerPanel({
  className, events, locale
}: {
  className?: string;
  events: AuditEventRecord[];
  locale: "zh-CN" | "en-US";
}) {
  const rows = events.filter((event) => executionAcceptanceAuditEventTypeSet.has(event.eventType));
  return (
    <section className={`execution-stage5-shadow ${className ?? ""}`}
      aria-labelledby="execution-acceptance-audit-title">
      <header>
        <div>
          <span>{locale === "zh-CN" ? "历史验收 · 只读审计" : "Historical acceptance · Read-only audit"}</span>
          <h2 id="execution-acceptance-audit-title">
            {locale === "zh-CN" ? "历史执行验收证据" : "Historical execution acceptance evidence"}
          </h2>
          <p>
            {locale === "zh-CN"
              ? "阶段 5–9 已退出当前自动交易主流程，仅保留不可操作的历史证据"
              : "Stages 5–9 are retired from the automatic-trading path and remain read-only"}
          </p>
        </div>
        <strong>{locale === "zh-CN" ? `只读证据 ${rows.length} 条` : `${rows.length} read-only records`}</strong>
      </header>
      <div className="execution-acceptance-audit-groups">
        {executionAcceptanceStages.map((stage) => {
          const stageRows = rows.filter((event) => event.eventType.startsWith(`stage${stage.id}_`));
          return (
            <section key={stage.id}>
              <header>
                <div>
                  <strong>{locale === "zh-CN" ? `阶段 ${stage.id} · ${stage.title}` : `Stage ${stage.id} · ${stage.titleEn}`}</strong>
                  <small>{locale === "zh-CN" ? stage.detail : "Historical evidence; not part of automatic trading"}</small>
                </div>
                <span>{stageRows.length}</span>
              </header>
              {stageRows.length ? (
                <ul>{stageRows.map((event) => {
                  const validity = stage9AuditBindingValidity(event);
                  const detached = event.metadata.detached === true;
                  return (
                    <li key={event.eventId}>
                      <strong>
                        {locale === "zh-CN"
                          ? executionAcceptanceEventLabels[event.eventType] ?? event.eventType
                          : event.eventType}
                      </strong>
                      <span>{event.eventId}</span>
                      <small>{event.createdAt} · {event.source}</small>
                      <small className={validity === false ? "blocked" : undefined}>
                        {locale === "zh-CN"
                          ? validity === false ? "证据绑定无效"
                            : validity === true ? detached ? "导入证据 · 绑定有效" : "本地证据 · 绑定有效"
                              : detached ? "导入只读证据" : "本地只读证据"
                          : validity === false ? "Invalid binding"
                            : validity === true ? detached ? "Detached · valid binding" : "Local · valid binding"
                              : detached ? "Detached read-only evidence" : "Local read-only evidence"}
                      </small>
                    </li>
                  );
                })}</ul>
              ) : (
                <p>{locale === "zh-CN" ? "暂无历史证据。" : "No historical evidence."}</p>
              )}
            </section>
          );
        })}
      </div>
      <p>{locale === "zh-CN"
        ? "本面板不提供授权、急停、委托或恢复操作。"
        : "This panel provides no authorization, kill-switch, order, or restore actions."}</p>
    </section>
  );
}

function stage9AuditBindingValidity(event: AuditEventRecord): boolean | null {
  if (!event.eventType.startsWith("stage9_")) return null;
  const snapshot = event.metadata.snapshot;
  const record = snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
    ? snapshot as Record<string, unknown> : {};
  const isReview = event.eventType.endsWith("_review");
  const candidate = !isReview && isStage9ProductionAdmissionCandidate(record) ? record : null;
  const review = isReview && isStage9ProductionAdmissionReview(record) ? record : null;
  return candidate
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
}
