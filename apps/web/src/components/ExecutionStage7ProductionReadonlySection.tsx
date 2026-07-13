import { useState } from "react";
import type { Stage7ProductionReadonlyProbe } from "../lib/stage7-production-readonly";
import type { Stage8ProductionReadonlyContinuity } from "../lib/stage8-readonly-continuity";

export function ExecutionStage7ProductionReadonlySection({
  busy, continuity, continuityBusy, continuityError, error, onOpenSettings, onRun, onSetAccess,
  probe, productionRouteReviewId
}: {
  busy: boolean;
  continuity: Stage8ProductionReadonlyContinuity | null;
  continuityBusy: boolean;
  continuityError: string | null;
  error: string | null;
  onOpenSettings: () => void;
  onRun: (eligibilityConfirmed: boolean) => void;
  onSetAccess: (action: "revoke" | "restore", reason: string) => void;
  probe: Stage7ProductionReadonlyProbe | null;
  productionRouteReviewId?: string;
}) {
  const [reason, setReason] = useState("");
  const permissions = probe?.apiPermissions;
  const revoked = continuity?.accessState === "revoked";
  const detail = continuityError || error || continuity?.blockedReasons.join("; ") || probe?.blockedReasons.join("; ") ||
    (productionRouteReviewId ? "已具备 Stage 6 退出与生产路由复核前提，可运行只读准入。" : "请先在设置中完成 ccxt-live 生产路由复核。");
  return (
    <section className={`execution-stage5-shadow ${probe?.status ?? "blocked"}`}
      aria-labelledby="execution-stage7-title">
      <header>
        <div>
          <span>Stage 7 · Production Read-only</span>
          <h2 id="execution-stage7-title">Binance Spot 生产只读准入</h2>
          <p>点击即确认账户与访问位置符合服务资格，再检查市场、权限和脱敏账户摘要</p>
        </div>
        <strong>Production read-only · Orders blocked</strong>
      </header>
      <p role="status" className={continuityError || error || revoked || probe?.status === "blocked" ? "execution-stage5-shadow-error" : undefined}>
        {detail}
      </p>
      {productionRouteReviewId ? (
        <button disabled={busy || continuityBusy || revoked} onClick={() => onRun(true)} type="button">
          {busy ? "只读检查中…" : "确认资格并运行生产只读准入"}
        </button>
      ) : (
        <button onClick={onOpenSettings} type="button">前往设置完成生产路由复核</button>
      )}
      <dl>
        <div><dt>状态</dt><dd>{probe?.status ?? "blocked"}</dd></div>
        <div><dt>生产市场</dt><dd>{probe?.marketCount ?? 0}</dd></div>
        <div><dt>非零资产数</dt><dd>{probe?.accountSummary.nonZeroAssetCount ?? 0}</dd></div>
        <div><dt>账户类型</dt><dd>{probe?.accountSummary.accountType ?? "未读取"}</dd></div>
        <div><dt>读取权限</dt><dd>{permissions ? String(permissions.readingEnabled) : "未读取"}</dd></div>
        <div><dt>交易权限</dt><dd>{permissions ? String(permissions.spotTradingEnabled || permissions.marginTradingEnabled || permissions.futuresTradingEnabled || permissions.optionsTradingEnabled) : "未读取"}</dd></div>
        <div><dt>提现/划转</dt><dd>{permissions ? String(permissions.withdrawalsEnabled || permissions.internalTransferEnabled || permissions.universalTransferEnabled) : "未读取"}</dd></div>
        <div><dt>Live route</dt><dd>{String(probe?.liveRouteExecuted ?? false)}</dd></div>
      </dl>
      {probe ? <details><summary>权威证据</summary><span className="execution-stage5-shadow-hash">{probe.evidenceHash}</span></details> : null}
      <hr />
      <header>
        <div>
          <span>Stage 8 · Read-only Continuity</span>
          <h3>生产只读连续性与撤销</h3>
          <p>过期或权限漂移保持阻断；本地撤销在生产网络访问前生效</p>
        </div>
        <strong>{continuity?.status ?? "missing"}</strong>
      </header>
      <dl>
        <div><dt>访问控制</dt><dd>{continuity?.accessState ?? "active"}</dd></div>
        <div><dt>Probe 新鲜</dt><dd>{String(continuity?.probeFresh ?? false)}</dd></div>
        <div><dt>Route review</dt><dd>{String(continuity?.routeReviewCurrent ?? false)}</dd></div>
        <div><dt>权限漂移</dt><dd>{String(continuity?.permissionDrift ?? false)}</dd></div>
        <div><dt>到期时间</dt><dd>{continuity?.expiresAt ?? "无当前证据"}</dd></div>
      </dl>
      <label>
        撤销/恢复原因
        <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="记录人工操作原因" />
      </label>
      <button
        disabled={continuityBusy || !reason.trim() || (revoked && !productionRouteReviewId)}
        onClick={() => onSetAccess(revoked ? "restore" : "revoke", reason.trim())}
        type="button"
      >
        {continuityBusy ? "记录中…" : revoked ? "恢复生产只读访问" : "立即撤销生产只读访问"}
      </button>
      {continuity?.accessControl ? (
        <details><summary>访问控制证据</summary><span className="execution-stage5-shadow-hash">{continuity.accessControl.controlHash}</span></details>
      ) : null}
    </section>
  );
}
