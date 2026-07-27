import type { Stage6ExitAcceptanceStatus, Stage6GoldenPathAction, Stage6KillSwitch, Stage6SandboxBatch, Stage6SandboxBatchAuthorization } from "../lib/stage6-sandbox";
import { executionEvidenceLabel } from "./execution-readiness-display";

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
  const label = action === "authorize" ? "检查并授权测试网批次"
    : action === "submit" ? "提交至 Binance Spot 测试网"
      : action === "reconcile" ? "对账未知订单"
        : action === "cancel" ? "撤销未终态订单" : "阶段 6 已对账";
  return (
    <section className={`execution-stage5-shadow ${batch?.status ?? (authorization ? "review" : "blocked")}`}
      aria-labelledby="execution-stage6-title">
      <header>
        <div>
          <span>阶段 6 · 测试网执行</span>
          <h2 id="execution-stage6-title">Binance Spot 测试网黄金路径</h2>
          <p>检查规范化批次 → 一次性人工授权 → 提交 → 对账/撤单</p>
        </div>
        <strong>仅测试网 · 实盘持续阻断</strong>
      </header>
      <p role="status">{error || detail}</p>
      {action ? <button disabled={busy} onClick={onAction} type="button">{busy ? "处理中…" : label}</button> : null}
      <button disabled={busy} onClick={() => onKillSwitch(!(batch?.killSwitch ?? killSwitch)?.triggered)} type="button">
        {(batch?.killSwitch ?? killSwitch)?.triggered ? "完成对账后重置急停开关" : "触发测试网急停开关"}
      </button>
      <details className="execution-stage-technical">
        <summary>查看技术证据</summary>
        <dl>
          <div><dt>授权记录</dt><dd>{authorization?.authorizationId ?? "尚未创建"}</dd></div>
          <div><dt>有效期</dt><dd>{authorization?.expiresAt ?? "暂无"}</dd></div>
          <div><dt>批次状态</dt><dd>{executionEvidenceLabel(batch?.status ?? "waiting")}</dd></div>
          <div><dt>急停开关已触发</dt><dd>{executionEvidenceLabel((batch?.killSwitch ?? killSwitch)?.triggered ?? false)}</dd></div>
          <div><dt>测试网路由已执行</dt><dd>{executionEvidenceLabel(batch?.sandboxRouteExecuted ?? false)}</dd></div>
          <div><dt>退出验收</dt><dd>{executionEvidenceLabel(exitAcceptance?.status ?? "missing")}</dd></div>
        </dl>
      </details>
      {(batch?.orders ?? authorization?.orders ?? []).length ? (
        <details open>
          <summary>测试网 GTC 限价委托</summary>
          <ul>{(batch?.orders ?? authorization?.orders ?? []).map((order) => (
            <li key={order.orderId}>
              <strong>{order.symbol} · {executionEvidenceLabel("state" in order ? order.state : "authorized")}</strong>
              <span>{order.side} {order.quantity} @ {order.price} · GTC</span>
              <small>{order.clientOrderId}</small>
            </li>
          ))}</ul>
        </details>
      ) : null}
    </section>
  );
}
