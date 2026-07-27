import { useCallback, useEffect, useMemo, useState } from "react";
import type { Stage9ProductionAdmissionCandidate, Stage9ProductionAdmissionReview } from "../lib/stage9-production-admission";
import {
  createStage10ExecutionAuthorization,
  loadStage10ProductionExecutionState,
  runStage10CredentialPreflight,
  runStage10ExecutionAttempt,
  runStage10PermissionVerification,
  setStage10ExecutionControl,
  stage10ConfirmationIds,
  type Stage10ProductionExecutionState
} from "../lib/stage10-production-execution";
import type { WorkspaceFetcher } from "../lib/terminal-api";
import { executionEvidenceLabel } from "./execution-readiness-display";

const defaultFetcher: WorkspaceFetcher = (url, init) => fetch(url, init);
const emptyConfirmations = () => Object.fromEntries(
  stage10ConfirmationIds.map((id) => [id, false])
) as Record<(typeof stage10ConfirmationIds)[number], boolean>;
const confirmationLabels: Record<(typeof stage10ConfirmationIds)[number], string> = {
  "real-funds-risk-understood": "我理解真实资金亏损风险",
  "stage9-candidate-and-review-verified": "我已核对阶段 9 候选与人工复核",
  "dedicated-production-trading-credential-isolated": "专用交易密钥未复用只读或测试网密钥",
  "withdrawal-and-transfer-disabled": "提现、内部划转与万能划转均已关闭",
  "production-kill-switch-required-before-live-route": "任何真实路由前必须再次检查急停"
};

export function ExecutionStage10ProductionExecutionSection({
  baseUrl,
  candidate = null,
  fetcher = defaultFetcher,
  review = null
}: {
  baseUrl: string;
  candidate?: Stage9ProductionAdmissionCandidate | null;
  fetcher?: WorkspaceFetcher;
  review?: Stage9ProductionAdmissionReview | null;
}) {
  const [state, setState] = useState<Stage10ProductionExecutionState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [operator, setOperator] = useState("");
  const [reason, setReason] = useState("");
  const [confirmations, setConfirmations] = useState(emptyConfirmations);
  const baseRunId = candidate?.baseRunId;
  const refresh = useCallback(async () => {
    try {
      setState(await loadStage10ProductionExecutionState(baseUrl, baseRunId, fetcher));
    } catch (loadError) {
      setError(message(loadError));
    }
  }, [baseRunId, baseUrl, fetcher]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { setConfirmations(emptyConfirmations()); }, [candidate?.candidateId]);

  const now = Date.now();
  const preflightReady = state?.preflight?.status === "configured_offline" &&
    Date.parse(state.preflight.expiresAt) >= now;
  const verificationReady = state?.verification?.status === "verified" &&
    state.verification.preflightId === state.preflight?.preflightId &&
    Date.parse(state.verification.expiresAt) >= now;
  const controlActive = state?.control.status === "active" && !state.control.triggered;
  const reviewReady = review?.outcome === "approved" && review.candidateId === candidate?.candidateId;
  const authorization = useMemo(() => state?.authorizations.find(
    (item) => item.candidateId === candidate?.candidateId
  ) ?? null, [candidate?.candidateId, state?.authorizations]);
  const attempt = useMemo(() => state?.attempts.find(
    (item) => item.authorizationId === authorization?.authorizationId
  ) ?? null, [authorization?.authorizationId, state?.attempts]);
  const operatorReady = !!operator.trim();
  const reasonReady = !!reason.trim();
  const confirmationsReady = stage10ConfirmationIds.every((id) => confirmations[id]);

  const perform = async (name: string, task: () => Promise<unknown>) => {
    setBusy(name);
    setError(null);
    try {
      await task();
    } catch (actionError) {
      setError(message(actionError));
    } finally {
      await refresh();
      setBusy(null);
    }
  };

  const status = attempt ? "blocked_before_network"
    : authorization ? "deterministic_execution_authorized"
      : controlActive ? "active"
        : verificationReady ? "verified"
          : preflightReady ? "configured_offline"
            : "revoked";

  return (
    <section className={`execution-stage5-shadow ${error ? "blocked" : controlActive ? "review" : "ready"}`}
      aria-labelledby="execution-stage10-title">
      <header>
        <div>
          <span>阶段 10 · 真实交易准备</span>
          <h2 id="execution-stage10-title">生产交易控制链</h2>
          <p>专用密钥、权限、急停、单笔授权与提交前演练使用同一条审计链</p>
        </div>
        <strong>自动实盘需显式开启</strong>
      </header>

      <p role="status" className={error ? "execution-stage5-shadow-error" : undefined}>
        {error ?? stage10StatusLabel(status)}
      </p>

      <label>操作人
        <input value={operator} onChange={(event) => setOperator(event.target.value)} placeholder="实名操作人" />
      </label>
      {(verificationReady || controlActive || authorization) ? (
        <label>操作理由
          <input value={reason} onChange={(event) => setReason(event.target.value)}
            placeholder="记录启用门禁或授权依据" />
        </label>
      ) : null}

      {!preflightReady ? (
        <button disabled={!!busy || !operatorReady}
          onClick={() => void perform("preflight", () => runStage10CredentialPreflight(baseUrl, operator.trim(), fetcher))}
          type="button">
          {busy === "preflight" ? "检查中…" : "检查专用交易凭据"}
        </button>
      ) : !verificationReady ? (
        <button disabled={!!busy || !operatorReady}
          onClick={() => void perform("verification", () => runStage10PermissionVerification(
            baseUrl, state!.preflight!.preflightId, operator.trim(), fetcher
          ))} type="button">
          {busy === "verification" ? "核验中…" : "只读核验交易权限"}
        </button>
      ) : !controlActive ? (
        <button disabled={!!busy || !operatorReady || !reasonReady}
          onClick={() => void perform("restore", () => setStage10ExecutionControl(baseUrl, {
            action: "restore",
            operator: operator.trim(),
            reason: reason.trim(),
            credentialPreflightId: state!.preflight!.preflightId,
            permissionVerificationId: state!.verification!.verificationId
          }, fetcher))} type="button">
          {busy === "restore" ? "恢复中…" : "恢复生产执行控制"}
        </button>
      ) : null}

      {controlActive ? (
        <button disabled={!!busy || !operatorReady || !reasonReady}
          onClick={() => void perform("revoke", () => setStage10ExecutionControl(baseUrl, {
            action: "revoke",
            operator: operator.trim(),
            reason: reason.trim(),
            credentialPreflightId: null,
            permissionVerificationId: null
          }, fetcher))} type="button">
          {busy === "revoke" ? "急停中…" : "立即触发生产急停"}
        </button>
      ) : null}

      {controlActive && reviewReady && !authorization ? (
        <fieldset>
          <legend>单笔执行授权确认</legend>
          {stage10ConfirmationIds.map((id) => (
            <label key={id}>
              <input checked={confirmations[id]} type="checkbox"
                onChange={(event) => setConfirmations((current) => ({ ...current, [id]: event.target.checked }))} />
              {confirmationLabels[id]}
            </label>
          ))}
          <button disabled={!!busy || !operatorReady || !reasonReady || !confirmationsReady}
            onClick={() => void perform("authorization", () => createStage10ExecutionAuthorization(
              baseUrl, candidate!.candidateId, operator.trim(), reason.trim(), confirmations, fetcher
            ))} type="button">
            {busy === "authorization" ? "记录中…" : "记录单笔确定性授权"}
          </button>
        </fieldset>
      ) : null}

      {controlActive && authorization && !attempt ? (
        <button disabled={!!busy || !operatorReady}
          onClick={() => void perform("attempt", () => runStage10ExecutionAttempt(
            baseUrl, authorization.authorizationId, operator.trim(), fetcher
          ))} type="button">
          {busy === "attempt" ? "演练中…" : "运行提交前阻断演练"}
        </button>
      ) : null}

      <details open>
        <summary>交易流程状态</summary>
        <dl>
          <div><dt>专用凭据</dt><dd>{executionEvidenceLabel(preflightReady)}</dd></div>
          <div><dt>安全权限</dt><dd>{executionEvidenceLabel(verificationReady)}</dd></div>
          <div><dt>生产执行控制</dt><dd>{controlActive ? "已恢复 · 实盘仍需二次确认" : "已撤销 · 急停已触发"}</dd></div>
          <div><dt>阶段 9 复核</dt><dd>{executionEvidenceLabel(reviewReady)}</dd></div>
          <div><dt>单笔授权</dt><dd>{executionEvidenceLabel(authorization?.status ?? "missing")}</dd></div>
          <div><dt>网络变更调用</dt><dd>{attempt?.networkCallCount ?? state?.verification?.mutationCallCount ?? 0}</dd></div>
        </dl>
        {authorization?.orders.map((order) => (
          <p key={order.orderId}>
            {order.symbol} · {order.side === "buy" ? "买入" : "卖出"} · {order.quantity} @ {order.price}
            {" · "}{order.notionalValue} USDT · GTC
          </p>
        ))}
      </details>

      {!reviewReady ? <p>先完成阶段 9 候选及批准复核；本区不会代替人工确认。</p> : null}
      <p>本区负责凭据、权限和急停控制；上方自动交易区仍需实名操作人和真实资金二次确认才会开启生产委托。</p>
    </section>
  );
}

function stage10StatusLabel(status: string) {
  const labels: Record<string, string> = {
    revoked: "执行权限已撤销（急停已触发）；从专用凭据检查开始。",
    configured_offline: "专用交易凭据已通过离线隔离检查。",
    verified: "读取与现货权限已验证，危险权限均关闭。",
    active: "生产执行控制已恢复；自动实盘仍需实名与真实资金二次确认。",
    deterministic_execution_authorized: "单笔确定性授权已记录，等待提交前阻断演练。",
    blocked_before_network: "提交前演练已在访问生产网络前阻断，未提交订单。"
  };
  return labels[status] ?? "正在读取 Stage 10 状态…";
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Stage 10 操作失败";
}
