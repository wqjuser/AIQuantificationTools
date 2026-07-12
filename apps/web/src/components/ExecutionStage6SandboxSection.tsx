import type { Stage6ExitAcceptanceStatus, Stage6GoldenPathAction, Stage6KillSwitch, Stage6SandboxBatch, Stage6SandboxBatchAuthorization } from "../lib/stage6-sandbox";

export function ExecutionStage6SandboxSection({
  action, authorization, batch, busy, detail, error, exitAcceptance, killSwitch, onAction, onKillSwitch
}: {
  action: Stage6GoldenPathAction;
  authorization: Stage6SandboxBatchAuthorization | null;
  batch: Stage6SandboxBatch | null;
  busy: boolean;
  detail: string;
  error: string | null;
  exitAcceptance: Stage6ExitAcceptanceStatus | null;
  killSwitch: Stage6KillSwitch | null;
  onAction: () => void;
  onKillSwitch: (triggered: boolean) => void;
}) {
  const label = action === "authorize" ? "检查并授权 Sandbox 批次"
    : action === "submit" ? "提交 Binance Spot Testnet"
      : action === "reconcile" ? "对账未知订单"
        : action === "cancel" ? "撤销未终态订单" : "Stage 6 已对账";
  return (
    <section className={`execution-stage5-shadow ${batch?.status ?? (authorization ? "review" : "blocked")}`}
      aria-labelledby="execution-stage6-title">
      <header>
        <div>
          <span>Stage 6 · Sandbox Execution</span>
          <h2 id="execution-stage6-title">Binance Spot Testnet 黄金路径</h2>
          <p>检查规范化批次 → 一次性人工授权 → 提交 → 对账/撤单</p>
        </div>
        <strong>Sandbox only · Live blocked</strong>
      </header>
      <p role="status">{error || detail}</p>
      {action ? <button disabled={busy} onClick={onAction} type="button">{busy ? "处理中…" : label}</button> : null}
      <button disabled={busy} onClick={() => onKillSwitch(!(batch?.killSwitch ?? killSwitch)?.triggered)} type="button">
        {(batch?.killSwitch ?? killSwitch)?.triggered ? "完成对账后重置 Kill Switch" : "触发 Sandbox Kill Switch"}
      </button>
      <dl>
        <div><dt>授权</dt><dd>{authorization?.authorizationId ?? "尚未创建"}</dd></div>
        <div><dt>有效期</dt><dd>{authorization?.expiresAt ?? "-"}</dd></div>
        <div><dt>批次状态</dt><dd>{batch?.status ?? "waiting"}</dd></div>
        <div><dt>Kill switch</dt><dd>{String((batch?.killSwitch ?? killSwitch)?.triggered ?? false)}</dd></div>
        <div><dt>Sandbox route</dt><dd>{batch ? String(batch.sandboxRouteExecuted) : "false"}</dd></div>
        <div><dt>退出验收</dt><dd>{exitAcceptance?.status ?? "missing"}</dd></div>
      </dl>
      {(batch?.orders ?? authorization?.orders ?? []).length ? (
        <details open>
          <summary>Sandbox GTC 限价委托</summary>
          <ul>{(batch?.orders ?? authorization?.orders ?? []).map((order) => (
            <li key={order.orderId}>
              <strong>{order.symbol} · {"state" in order ? String(order.state) : "authorized"}</strong>
              <span>{order.side} {order.quantity} @ {order.price} · GTC</span>
              <small>{order.clientOrderId}</small>
            </li>
          ))}</ul>
        </details>
      ) : null}
    </section>
  );
}
