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
import {
  authorizeAutoLiveSession,
  liveAuthorizationLabel,
  type AutoTradingSnapshot
} from "./ExecutionAutoPaperTradingSection";
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

export function isAutoLiveSessionRenewalAvailable(
  snapshot: AutoTradingSnapshot | null | undefined,
  controlActive: boolean
) {
  return Boolean(
    controlActive
    && snapshot?.state.executionMode === "live"
    && snapshot.state.enabled
    && snapshot.productionLive?.enabled === true
  );
}

export function ExecutionStage10ProductionExecutionSection({
  autoTradingSnapshot,
  baseUrl,
  candidate = null,
  fetcher = defaultFetcher,
  onAutoLiveAuthorized,
  review = null,
  sectionId = "execution-live-trading-gate"
}: {
  autoTradingSnapshot?: AutoTradingSnapshot | null;
  baseUrl: string;
  candidate?: Stage9ProductionAdmissionCandidate | null;
  fetcher?: WorkspaceFetcher;
  onAutoLiveAuthorized?: () => Promise<void> | void;
  review?: Stage9ProductionAdmissionReview | null;
  sectionId?: string;
}) {
  const [state, setState] = useState<Stage10ProductionExecutionState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [operator, setOperator] = useState("");
  const [reason, setReason] = useState("");
  const [confirmations, setConfirmations] = useState(emptyConfirmations);
  const [liveFundsConfirmed, setLiveFundsConfirmed] = useState(false);
  const autoLiveGate = Boolean(onAutoLiveAuthorized);
  const productionSessionActive = Boolean(
    autoLiveGate
    && autoTradingSnapshot?.state.executionMode === "live"
    && autoTradingSnapshot.liveTradingAllowed
  );
  const autoLiveModeConfigured = Boolean(
    autoTradingSnapshot?.state.executionMode === "live"
    && autoTradingSnapshot.state.enabled
  );
  const productionTradingEnabled = autoTradingSnapshot?.productionLive?.enabled === true;
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
  const controlActive = state?.control.status === "active" &&
    !state.control.triggered &&
    preflightReady &&
    verificationReady &&
    state.control.credentialPreflightId === state.preflight?.preflightId &&
    state.control.permissionVerificationId === state.verification?.verificationId;
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

  const status = !state ? "loading"
    : attempt ? "blocked_before_network"
      : authorization ? "deterministic_execution_authorized"
        : controlActive ? "active"
          : verificationReady ? "verified"
            : preflightReady ? "configured_offline"
              : "revoked";

  const authorizeLiveSession = async () => {
    setBusy("live-session");
    setError(null);
    try {
      await authorizeAutoLiveSession(baseUrl, operator, fetcher);
      await onAutoLiveAuthorized?.();
    } catch (actionError) {
      setError(message(actionError));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      aria-labelledby={`${sectionId}-title`}
      className={`execution-stage5-shadow ${
        error ? "blocked" : productionSessionActive || controlActive ? "review" : "ready"
      }`}
      id={sectionId}
      tabIndex={-1}
    >
      <header>
        <div>
          <span>生产实盘 · 权限与急停</span>
          <h2 id={`${sectionId}-title`}>生产交易控制链</h2>
          <p>
            {autoLiveGate
              ? "专用密钥、权限、急停与自动生产会话使用同一条审计链"
              : "专用密钥、权限、急停、单笔授权与提交前演练使用同一条审计链"}
          </p>
        </div>
        <strong>
          {productionSessionActive
            ? `生产会话${liveAuthorizationLabel(autoTradingSnapshot?.state)}`
            : "生产权限与急停全程受控"}
        </strong>
      </header>

      <p role="status" className={error ? "execution-stage5-shadow-error" : undefined}>
        {error ?? (productionSessionActive
          ? controlActive
            ? "生产会话有效，权限与急停安全链已恢复，可按需续期。"
            : "生产会话仍然有效；续期或重新授权前需更新权限与急停证据。"
          : stage10StatusLabel(status))}
      </p>

      <label>操作人
        <input
          value={operator}
          onChange={(event) => setOperator(event.target.value)}
          placeholder="实名操作人"
        />
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

      {autoLiveGate && autoTradingSnapshot && !productionTradingEnabled ? (
        <p role="status">先到设置开启生产实盘总开关，再返回完成生产会话授权。</p>
      ) : null}

      {autoLiveGate && autoTradingSnapshot && productionTradingEnabled && !autoLiveModeConfigured ? (
        <p role="status">先到自动交易控制台选择生产实盘并保存开启，再返回完成生产会话授权。</p>
      ) : null}

      {autoLiveGate && isAutoLiveSessionRenewalAvailable(autoTradingSnapshot, controlActive) ? (
        <fieldset className="execution-stage10-live-session">
          <legend>生产会话授权与续期</legend>
          <label>
            <input
              checked={liveFundsConfirmed}
              onChange={(event) => setLiveFundsConfirmed(event.target.checked)}
              type="checkbox"
            />
            我确认自动策略会使用真实资金提交币安现货生产委托，单笔新增风险不超过 10 USDT
          </label>
          <button
            disabled={!!busy || !operatorReady || !liveFundsConfirmed}
            onClick={() => void authorizeLiveSession()}
            type="button"
          >
            {busy === "live-session" ? "确认中…" : "确认并续期生产会话"}
          </button>
          <small>仅续期当前已启用的生产实盘模式，不会切换执行模式或立即发起评估。</small>
        </fieldset>
      ) : null}

      {!autoLiveGate && controlActive && reviewReady && !authorization ? (
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

      {!autoLiveGate && controlActive && authorization && !attempt ? (
        <button disabled={!!busy || !operatorReady}
          onClick={() => void perform("attempt", () => runStage10ExecutionAttempt(
            baseUrl, authorization.authorizationId, operator.trim(), fetcher
          ))} type="button">
          {busy === "attempt" ? "演练中…" : "运行提交前阻断演练"}
        </button>
      ) : null}

      <details open>
        <summary>{autoLiveGate ? "生产权限与急停状态" : "交易流程状态"}</summary>
        <dl>
          <div><dt>专用凭据</dt><dd>{state ? executionEvidenceLabel(preflightReady) : "正在读取"}</dd></div>
          <div><dt>安全权限</dt><dd>{state ? executionEvidenceLabel(verificationReady) : "正在读取"}</dd></div>
          <div>
            <dt>生产执行控制</dt>
            <dd>
              {!state
                ? productionSessionActive
                  ? "当前会话有效 · 续期证据读取中"
                  : "正在读取"
                : controlActive
                ? "安全链已恢复"
                : productionSessionActive
                  ? "当前会话有效 · 续期前需更新证据"
                  : "安全链已撤销 · 急停保护已生效"}
            </dd>
          </div>
          {!autoLiveGate ? (
            <>
              <div><dt>阶段 9 复核</dt><dd>{executionEvidenceLabel(reviewReady)}</dd></div>
              <div><dt>单笔授权</dt><dd>{executionEvidenceLabel(authorization?.status ?? "missing")}</dd></div>
            </>
          ) : null}
          <div><dt>网络变更调用</dt><dd>{attempt?.networkCallCount ?? state?.verification?.mutationCallCount ?? 0}</dd></div>
        </dl>
        {authorization?.orders.map((order) => (
          <p key={order.orderId}>
            {order.symbol} · {order.side === "buy" ? "买入" : "卖出"} · {order.quantity} @ {order.price}
            {" · "}{order.notionalValue} USDT · GTC
          </p>
        ))}
      </details>

      {!autoLiveGate && !reviewReady ? <p>先完成阶段 9 候选及批准复核；本区不会代替人工确认。</p> : null}
      <p>
        {autoLiveGate
          ? productionSessionActive
            ? "当前生产会话继续受每笔委托门禁保护；本区仅用于更新证据或续期，不会立即评估或提交委托。"
            : "凭据、权限与急停安全链恢复后，可由实名操作人在本窗口显式授权或续期生产会话；本区不会立即评估或提交委托。"
          : "本区负责凭据、权限和急停控制；自动交易区的生产会话授权仍由实名操作人显式完成。"}
      </p>
    </section>
  );
}

function stage10StatusLabel(status: string) {
  const labels: Record<string, string> = {
    loading: "正在读取生产执行控制状态…",
    revoked: "执行权限已撤销（急停已触发）；从专用凭据检查开始。",
    configured_offline: "专用交易凭据已通过离线隔离检查。",
    verified: "读取与现货权限已验证，危险权限均关闭。",
    active: "生产权限与急停安全链已恢复；生产会话授权仍由实名操作人显式完成。",
    deterministic_execution_authorized: "单笔确定性授权已记录，等待提交前阻断演练。",
    blocked_before_network: "提交前演练已在访问生产网络前阻断，未提交订单。"
  };
  return labels[status] ?? labels.loading;
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "生产执行控制操作失败";
}
