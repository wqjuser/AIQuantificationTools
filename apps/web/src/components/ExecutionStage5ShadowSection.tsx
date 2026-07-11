import type { createI18n } from "../lib/i18n";
import type { Stage5ShadowState } from "../lib/stage5-shadow";

type AppI18n = ReturnType<typeof createI18n>;

export function ExecutionStage5ShadowSection({
  busy = false,
  error,
  i18n,
  onPrimaryAction,
  state
}: {
  busy?: boolean;
  error?: string | null;
  i18n: AppI18n;
  onPrimaryAction: () => void;
  state: Stage5ShadowState;
}) {
  const session = state.session;
  const actionLabel = state.actionId === "retry-stage5-shadow"
    ? i18n.t("execution.stage5.retry")
    : i18n.t("execution.stage5.start");
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
      {state.blocker || error ? (
        <p className="execution-stage5-shadow-error" role="status">
          {error ?? i18n.t(state.blocker === "stage4-workflow-missing"
            ? "execution.stage5.workflowMissing"
            : "execution.stage5.sessionBlocked")}
        </p>
      ) : null}
      {state.actionId ? (
        <button disabled={busy} onClick={onPrimaryAction} type="button">
          {busy ? i18n.t("execution.stage5.busy") : actionLabel}
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
