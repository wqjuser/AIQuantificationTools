import { useState } from "react";
import type { createI18n } from "../lib/i18n";
import type { Stage5ExitAcceptanceStatus, Stage5ShadowState } from "../lib/stage5-shadow";

type AppI18n = ReturnType<typeof createI18n>;

export function ExecutionStage5ShadowSection({
  busy = false,
  error,
  exitAcceptance,
  exitAcceptanceError,
  i18n,
  onOpenSettings = () => {},
  onPrimaryAction,
  state
}: {
  busy?: boolean;
  error?: string | null;
  exitAcceptance?: Stage5ExitAcceptanceStatus | null;
  exitAcceptanceError?: string | null;
  i18n: AppI18n;
  onOpenSettings?: () => void;
  onPrimaryAction: (reviewInput?: { outcome: "approved" | "rejected"; reason: string }) => void;
  state: Stage5ShadowState;
}) {
  const [reviewOutcome, setReviewOutcome] = useState<"approved" | "rejected">("approved");
  const [reviewReason, setReviewReason] = useState("");
  const session = state.session;
  const actionLabel = state.actionId === "retry-stage5-shadow"
    ? i18n.t("execution.stage5.retry")
    : state.actionId === "run-stage5-sandbox-authorization-preflight"
      ? i18n.t("execution.stage5.authorizationPreflightAction")
    : state.actionId === "record-stage5-sandbox-authorization-review"
      ? i18n.t("execution.stage5.authorizationReviewAction")
    : state.actionId === "review-stage5-sandbox-readiness"
      ? i18n.t("execution.stage5.readinessAction")
      : i18n.t("execution.stage5.start");
  const readinessDecision = state.readinessDecision;
  return (
    <section className={`execution-stage5-shadow ${state.status}`} aria-labelledby="execution-stage5-shadow-title">
      <header>
        <div>
          <span>{i18n.t("execution.stage5.eyebrow")}</span>
          <h2 id="execution-stage5-shadow-title">{i18n.t("execution.stage5.title")}</h2>
          <p>{i18n.t("execution.stage5.subtitle")}</p>
        </div>
        <strong>{i18n.t("execution.stage5.boundary")}</strong>
      </header>
      <div className={`execution-stage5-readiness ${exitAcceptance?.status ?? "missing"}`} role="status">
        <strong>{i18n.t("execution.stage5.exitTitle")}</strong>
        <span>{exitAcceptance?.status ?? "missing"} · {exitAcceptance?.artifactCount ?? 0}/7</span>
        <span>{exitAcceptance?.stage5BaseRunId ?? i18n.t("execution.stage5.exitUnavailable")}</span>
        <small className="execution-stage5-shadow-hash">{exitAcceptance?.exitHash ?? "-"}</small>
        <p>{exitAcceptanceError || exitAcceptance?.reason || i18n.t("execution.stage5.exitBoundary")}</p>
      </div>
      {state.blocker || error ? (
        <p className="execution-stage5-shadow-error" role="status">
          {error ?? i18n.t(state.blocker === "stage4-workflow-missing"
            ? "execution.stage5.workflowMissing"
            : state.blocker === "sandbox-probe-missing"
              ? "execution.stage5.probeMissing"
              : "execution.stage5.sessionBlocked")}
        </p>
      ) : null}
      {state.actionId === "record-stage5-sandbox-authorization-review" ? (
        <div className="execution-stage5-review-inputs">
          <label>
            <span>{i18n.t("execution.stage5.authorizationReviewOutcome")}</span>
            <select value={reviewOutcome} onChange={(event) => setReviewOutcome(event.target.value as "approved" | "rejected")}>
              <option value="approved">{i18n.t("execution.stage5.authorizationReviewApproved")}</option>
              <option value="rejected">{i18n.t("execution.stage5.authorizationReviewRejected")}</option>
            </select>
          </label>
          <label>
            <span>{i18n.t("execution.stage5.authorizationReviewReason")}</span>
            <input value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} />
          </label>
        </div>
      ) : null}
      {state.actionId ? (
        <button
          disabled={busy || (state.actionId === "record-stage5-sandbox-authorization-review" && !reviewReason.trim())}
          onClick={() => onPrimaryAction(state.actionId === "record-stage5-sandbox-authorization-review"
            ? { outcome: reviewOutcome, reason: reviewReason.trim() }
            : undefined)}
          type="button"
        >
          {busy ? i18n.t("execution.stage5.busy") : actionLabel}
        </button>
      ) : null}
      {state.blocker === "sandbox-probe-missing" ? (
        <button onClick={onOpenSettings} type="button">
          {i18n.t("execution.stage5.openProbeSettings")}
        </button>
      ) : null}
      <dl>
        <div><dt>{i18n.t("execution.stage5.status")}</dt><dd>{session?.status ?? state.status}</dd></div>
        <div><dt>{i18n.t("execution.stage5.attempt")}</dt><dd>{session?.attempt ?? "-"}</dd></div>
        <div><dt>{i18n.t("execution.stage5.adapter")}</dt><dd>{session?.adapter.id ?? "local-fake-shadow"}</dd></div>
        <div><dt>{i18n.t("execution.stage5.failureMode")}</dt><dd>{session?.failureMode ?? "-"}</dd></div>
        <div><dt>{i18n.t("execution.stage5.limits")}</dt><dd>{session ? `${session.limits.maxOrders} / ${session.limits.maxGrossNotional}` : "-"}</dd></div>
        <div><dt>{i18n.t("execution.stage5.timeout")}</dt><dd>{session ? `${session.limits.timeoutSeconds}s / ${session.limits.maxAttempts}` : "-"}</dd></div>
        <div><dt>{i18n.t("execution.stage5.killSwitch")}</dt><dd>{session ? `${session.killSwitch.enabled} / ${session.killSwitch.triggered}` : "-"}</dd></div>
        <div><dt>{i18n.t("execution.stage5.reconciliation")}</dt><dd>{session?.reconciliation.reason ?? "-"}</dd></div>
        <div><dt>{i18n.t("execution.stage5.sessionHash")}</dt><dd className="execution-stage5-shadow-hash">{session?.sessionHash ?? "-"}</dd></div>
      </dl>
      {readinessDecision ? (
        <div className="execution-stage5-readiness" role="status">
          <strong>{i18n.t("execution.stage5.readinessTitle")}</strong>
          <span>{readinessDecision.status}</span>
          <span>{readinessDecision.adapterId} · {readinessDecision.adapterPaperExecutionIds.join(", ")}</span>
          <small className="execution-stage5-shadow-hash">{readinessDecision.decisionHash}</small>
          <p>{i18n.t("execution.stage5.readinessBoundary")}</p>
        </div>
      ) : null}
      {state.authorizationPreflight ? (
        <div className="execution-stage5-readiness" role="status">
          <strong>{i18n.t("execution.stage5.authorizationPreflightTitle")}</strong>
          <span>{state.authorizationPreflight.status}</span>
          <span>{state.authorizationPreflight.adapterId} · {state.authorizationPreflight.market}</span>
          <small className="execution-stage5-shadow-hash">{state.authorizationPreflight.preflightHash}</small>
          <p>{i18n.t("execution.stage5.authorizationPreflightBoundary")}</p>
        </div>
      ) : null}
      {state.authorizationReview ? (
        <div className="execution-stage5-readiness" role="status">
          <strong>{i18n.t("execution.stage5.authorizationReviewTitle")}</strong>
          <span>{state.authorizationReview.outcome}</span>
          <span>{state.authorizationReview.reviewer} · authorizationEffective=false</span>
          <small className="execution-stage5-shadow-hash">{state.authorizationReview.reviewHash}</small>
          <p>{i18n.t("execution.stage5.authorizationReviewBoundary")}</p>
        </div>
      ) : null}
      {session ? (
        <details>
          <summary>{i18n.t("execution.stage5.orders")}</summary>
          <ul>
            {session.orders.map((order) => (
              <li key={order.orderId}>
                <strong>{order.symbol} · {order.state}</strong>
                <span>{order.clientOrderId}</span>
                <small>{order.transitions.map((row) => row.state).join(" → ")}</small>
              </li>
            ))}
          </ul>
          <p>{i18n.t("execution.stage5.reconciliation")}: {session.reconciliation.reconciled ? "true" : "false"} · {session.reconciliation.reason}</p>
          <p>{i18n.t("execution.stage5.safety")}</p>
        </details>
      ) : null}
    </section>
  );
}
