import { Play, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import type { AiReviewProviderId, AiReviewProviderStatus } from "../lib/ai-review-stage3";
import { authenticatedActor } from "../lib/public-auth";
import {
  createStrategyResearchProposal,
  launchStrategyResearchExperiment,
  loadStrategyResearchCapabilities,
  loadStrategyResearchExperiment,
  strategyResearchCapabilityDisplayName,
  type StrategyResearchCapability,
  type StrategyResearchAggregate,
  type StrategyResearchLaunch,
  type StrategyResearchPaperProjection,
  type StrategyResearchProposal,
  type StrategyResearchProposalRequest,
} from "../lib/terminal-api";
import { aiProviderLabels } from "./TerminalSurfaceUi";

const researchGoals = [
  "提升样本外稳健性",
  "降低回撤同时保留收益",
  "提升不同市场状态下的一致性",
] as const;

type BusyAction = "propose" | "launch" | "read" | null;

export interface StrategyResearchSourceMetadata {
  runId: string | null;
  market: string | null;
  symbol: string | null;
  timeframe: string | null;
  executionMode: string | null;
  snapshotHashVersion: string | null;
  snapshotComplete: boolean;
  snapshotBarsExposed: boolean;
}

export interface StrategyResearchSourceQualification {
  eligible: boolean;
  detail: string;
}

export function strategyResearchSourceQualification(
  sourceRunId: string | null,
  metadata: StrategyResearchSourceMetadata | null,
): StrategyResearchSourceQualification {
  if (!sourceRunId) {
    return {
      eligible: false,
      detail: "先加载一份服务端审计研究运行，再生成研发提案。",
    };
  }
  if (!metadata || metadata.runId !== sourceRunId) {
    return {
      eligible: false,
      detail: "当前运行缺少可核对的服务端资格元数据，不能生成研发提案。",
    };
  }
  const eligible = metadata.market === "crypto"
    && metadata.symbol === "BTC/USDT"
    && metadata.timeframe === "1m"
    && metadata.executionMode === "paper_only"
    && metadata.snapshotHashVersion === "aiqt-sealed-v1"
    && metadata.snapshotComplete
    && !metadata.snapshotBarsExposed;
  return {
    eligible,
    detail: eligible
      ? "当前运行具备正式密封 P0 元数据；服务端仍会在提案时重新校验完整证据。"
      : "当前运行不是正式密封 P0（crypto · BTC/USDT · 1m · paper_only），请先完成并恢复合格 P0 运行。",
  };
}

export function buildStrategyResearchProposalRequest({
  sourceRunId,
  goal,
  providerId,
  externalDataApproved,
}: StrategyResearchProposalRequest): StrategyResearchProposalRequest {
  return {
    sourceRunId,
    goal,
    providerId,
    externalDataApproved,
  };
}

export interface StrategyResearchApprovalState {
  context: string;
  approved: boolean;
}

export type StrategyResearchApprovalEvent =
  | { type: "set"; context: string; approved: boolean }
  | { type: "proposal-attempted"; context: string }
  | { type: "context-changed"; context: string };

export function strategyResearchApprovalContextKey({
  sourceRunId,
  goal,
  providerId,
  providerFingerprint,
  registeredTemplateIds,
}: {
  sourceRunId: string | null;
  goal: string;
  providerId: AiReviewProviderId;
  providerFingerprint?: string | null;
  registeredTemplateIds: readonly string[];
}): string {
  return JSON.stringify({
    sourceRunId,
    goal,
    providerId,
    providerFingerprint: providerFingerprint ?? null,
    registeredTemplateIds: [...registeredTemplateIds],
  });
}

export function reduceStrategyResearchApproval(
  state: StrategyResearchApprovalState,
  event: StrategyResearchApprovalEvent,
): StrategyResearchApprovalState {
  if (event.type === "context-changed") {
    return { context: event.context, approved: false };
  }
  if (event.context !== state.context) {
    return state;
  }
  return {
    context: state.context,
    approved: event.type === "set" ? event.approved : false,
  };
}

export function createStrategyResearchApprovalAttemptGuard() {
  let consumedContext: string | null = null;
  return {
    consume(context: string, approved: boolean): boolean {
      if (!approved || consumedContext === context) {
        return false;
      }
      consumedContext = context;
      return true;
    },
    reset(): void {
      consumedContext = null;
    },
  };
}

export interface StrategyResearchProposalRequestToken {
  generation: number;
  signal: AbortSignal;
  sourceRunId: string;
}

export function createStrategyResearchProposalRequestCoordinator(
  initialSourceRunId: string | null,
) {
  let currentSourceRunId = initialSourceRunId;
  let generation = 0;
  let controller: AbortController | null = null;
  return {
    begin(sourceRunId: string): StrategyResearchProposalRequestToken {
      controller?.abort();
      controller = new AbortController();
      generation += 1;
      return { generation, signal: controller.signal, sourceRunId };
    },
    invalidate(sourceRunId: string | null): void {
      currentSourceRunId = sourceRunId;
      generation += 1;
      controller?.abort();
      controller = null;
    },
    isCurrent(request: StrategyResearchProposalRequestToken): boolean {
      return !request.signal.aborted
        && request.generation === generation
        && request.sourceRunId === currentSourceRunId;
    },
  };
}

export function canLaunchStrategyResearch(
  proposalId: string | null,
  operator: string,
  confirmed: boolean,
  busy: boolean,
): boolean {
  return Boolean(proposalId && operator.trim() && confirmed && !busy);
}

export function StrategyResearchPaperBoundaryNotice({
  paperStatus,
}: {
  paperStatus: StrategyResearchPaperProjection["status"] | null;
}) {
  if (paperStatus !== "unavailable") {
    return null;
  }
  return (
    <p className="ai-review-stage3-error" role="alert">
      Paper 运行边界不可用：服务端未确认 Paper-only 与 Live-blocked 状态；
      此结果不代表已绑定或已启动监控，请先检查运行边界。
    </p>
  );
}

export function StrategyResearchSection({
  baseUrl,
  capabilities: providedCapabilities,
  onOpenFormalP0,
  providers,
  sourceMetadata,
  sourceRunId,
}: {
  baseUrl: string;
  capabilities?: readonly StrategyResearchCapability[];
  onOpenFormalP0: () => void;
  providers: AiReviewProviderStatus[];
  sourceMetadata: StrategyResearchSourceMetadata | null;
  sourceRunId: string | null;
}) {
  const [goal, setGoal] = useState<(typeof researchGoals)[number]>(researchGoals[0]);
  const [providerId, setProviderId] = useState<AiReviewProviderId>("local");
  const [loadedCapabilities, setLoadedCapabilities] = useState<StrategyResearchCapability[]>([]);
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(
    providedCapabilities === undefined,
  );
  const [capabilityError, setCapabilityError] = useState<string | null>(null);
  const registeredCapabilities = providedCapabilities ?? loadedCapabilities;
  const registeredTemplateIds = useMemo(
    () => registeredCapabilities.map((item) => item.templateId),
    [registeredCapabilities],
  );
  const provider = providers.find((item) => item.providerId === providerId) ?? null;
  const approvalContext = strategyResearchApprovalContextKey({
    sourceRunId,
    goal,
    providerId,
    providerFingerprint: provider
      ? JSON.stringify({
        configured: provider.configured,
        model: provider.model,
        sanitizedBaseUrl: provider.sanitizedBaseUrl,
      })
      : null,
    registeredTemplateIds,
  });
  const [approval, dispatchApproval] = useReducer(reduceStrategyResearchApproval, {
    context: approvalContext,
    approved: false,
  });
  const [proposal, setProposal] = useState<StrategyResearchProposal | null>(null);
  const [operator, setOperator] = useState(authenticatedActor());
  const [launchConfirmed, setLaunchConfirmed] = useState(false);
  const [launch, setLaunch] = useState<StrategyResearchLaunch | null>(null);
  const [research, setResearch] = useState<StrategyResearchAggregate | null>(null);
  const [readRefreshGeneration, setReadRefreshGeneration] = useState(0);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [error, setError] = useState<string | null>(null);
  const proposalRequestCoordinatorRef = useRef(
    createStrategyResearchProposalRequestCoordinator(sourceRunId),
  );
  const launchRequestCoordinatorRef = useRef(
    createStrategyResearchProposalRequestCoordinator(sourceRunId),
  );
  const readRequestCoordinatorRef = useRef(
    createStrategyResearchProposalRequestCoordinator(sourceRunId),
  );
  const approvalAttemptGuardRef = useRef(
    createStrategyResearchApprovalAttemptGuard(),
  );
  const currentSourceRunIdRef = useRef(sourceRunId);
  currentSourceRunIdRef.current = sourceRunId;

  const usesExternalProvider = providerId !== "local";
  const externalDataApproved = approval.context === approvalContext && approval.approved;
  const sourceQualification = strategyResearchSourceQualification(sourceRunId, sourceMetadata);
  const canPropose = Boolean(
    sourceRunId
    && sourceQualification.eligible
    && registeredTemplateIds.length > 0
    && !capabilitiesLoading
    && provider?.configured
    && (!usesExternalProvider || externalDataApproved)
    && busyAction === null,
  );
  const canLaunch = canLaunchStrategyResearch(
    proposal?.proposalId ?? null,
    operator,
    launchConfirmed,
    busyAction !== null,
  );
  const experiment = research?.experiment ?? null;
  const statusLabel = experiment
    ? {
      pending: "正式实验运行中",
      completed: "正式实验已完成",
      failed: "正式实验失败",
    }[experiment.status]
    : launch
      ? "正式实验已持久化"
      : "尚未启动";
  const nextActionLabels = useMemo(
    () => (research?.nextActions ?? []).map(strategyResearchNextActionLabel),
    [research?.nextActions],
  );

  useEffect(() => {
    if (providedCapabilities !== undefined) {
      setCapabilitiesLoading(false);
      setCapabilityError(null);
      return;
    }
    let active = true;
    const controller = new AbortController();
    setCapabilitiesLoading(true);
    setCapabilityError(null);
    setLoadedCapabilities([]);
    void loadStrategyResearchCapabilities(baseUrl, controller.signal).then((result) => {
      if (!active) {
        return;
      }
      if (result.source === "core" && result.capabilities) {
        setLoadedCapabilities(result.capabilities);
        setCapabilityError(null);
      } else {
        setLoadedCapabilities([]);
        setCapabilityError(result.error ?? "注册策略能力读取失败。");
      }
      setCapabilitiesLoading(false);
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [baseUrl, providedCapabilities]);

  useEffect(() => {
    if (providers.some((item) => item.providerId === providerId && item.configured)) {
      return;
    }
    const next = providers.find((item) => item.providerId === "local" && item.configured)
      ?? providers.find((item) => item.configured);
    if (next) {
      setProviderId(next.providerId);
    }
  }, [providerId, providers, sourceRunId]);

  useEffect(() => {
    approvalAttemptGuardRef.current.reset();
    dispatchApproval({ type: "context-changed", context: approvalContext });
  }, [approvalContext]);

  useEffect(() => {
    proposalRequestCoordinatorRef.current.invalidate(sourceRunId);
    launchRequestCoordinatorRef.current.invalidate(sourceRunId);
    readRequestCoordinatorRef.current.invalidate(sourceRunId);
    setProposal(null);
    setLaunch(null);
    setResearch(null);
    setLaunchConfirmed(false);
    setError(null);
    setBusyAction(null);
  }, [approvalContext, sourceRunId]);

  useEffect(() => {
    const experimentId = launch?.experimentId;
    if (!experimentId) {
      return;
    }
    if (!sourceRunId) {
      return;
    }
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const refresh = async () => {
      const request = readRequestCoordinatorRef.current.begin(sourceRunId);
      setBusyAction((current) => current ?? "read");
      let shouldPoll = false;
      try {
        const result = await loadStrategyResearchExperiment(
          baseUrl,
          experimentId,
          request.signal,
        );
        if (
          !active
          || !readRequestCoordinatorRef.current.isCurrent(request)
          || request.sourceRunId !== currentSourceRunIdRef.current
        ) {
          return;
        }
        if (result.source === "core" && result.research) {
          setResearch(result.research);
          setError(null);
          shouldPoll = result.research.experiment.status === "pending";
        } else {
          setError(result.error ?? "策略研发实验读取失败。");
          shouldPoll = launch.status === "pending";
        }
      } finally {
        if (active && readRequestCoordinatorRef.current.isCurrent(request)) {
          setBusyAction((current) => current === "read" ? null : current);
        }
      }
      if (
        shouldPoll
        && active
        && readRequestCoordinatorRef.current.isCurrent(request)
      ) {
        timer = setTimeout(refresh, 2_500);
      }
    };

    void refresh();
    return () => {
      active = false;
      readRequestCoordinatorRef.current.invalidate(currentSourceRunIdRef.current);
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [baseUrl, launch?.experimentId, launch?.status, readRefreshGeneration, sourceRunId]);

  useEffect(() => () => {
    proposalRequestCoordinatorRef.current.invalidate(null);
    launchRequestCoordinatorRef.current.invalidate(null);
    readRequestCoordinatorRef.current.invalidate(null);
  }, []);

  const resetDownstream = () => {
    setProposal(null);
    setLaunch(null);
    setResearch(null);
    setLaunchConfirmed(false);
    setError(null);
  };

  const propose = async () => {
    if (!sourceRunId || !canPropose) {
      return;
    }
    const approvedForAttempt = usesExternalProvider
      ? approvalAttemptGuardRef.current.consume(approvalContext, externalDataApproved)
      : false;
    if (usesExternalProvider && !approvedForAttempt) {
      return;
    }
    const request = proposalRequestCoordinatorRef.current.begin(sourceRunId);
    setBusyAction("propose");
    setError(null);
    if (usesExternalProvider) {
      dispatchApproval({ type: "proposal-attempted", context: approvalContext });
    }
    try {
      const result = await createStrategyResearchProposal(baseUrl, buildStrategyResearchProposalRequest({
        sourceRunId,
        goal,
        providerId,
        externalDataApproved: approvedForAttempt,
      }), request.signal);
      if (
        !proposalRequestCoordinatorRef.current.isCurrent(request)
        || request.sourceRunId !== currentSourceRunIdRef.current
      ) {
        return;
      }
      if (result.source !== "core" || !result.proposal) {
        setError(result.error ?? "AI 策略研发提案生成失败。");
        return;
      }
      setProposal(result.proposal);
      setLaunch(null);
      setResearch(null);
      setLaunchConfirmed(false);
    } finally {
      if (proposalRequestCoordinatorRef.current.isCurrent(request)) {
        setBusyAction((current) => current === "propose" ? null : current);
      }
    }
  };

  const startExperiment = async () => {
    if (!proposal || !canLaunch || !sourceRunId) {
      return;
    }
    const request = launchRequestCoordinatorRef.current.begin(sourceRunId);
    setBusyAction("launch");
    setError(null);
    try {
      const result = await launchStrategyResearchExperiment(baseUrl, {
        proposalId: proposal.proposalId,
        operator: operator.trim(),
        confirmed: true,
      }, request.signal);
      if (
        !launchRequestCoordinatorRef.current.isCurrent(request)
        || request.sourceRunId !== currentSourceRunIdRef.current
      ) {
        return;
      }
      if (result.source !== "core" || !result.launch) {
        setError(result.error ?? "正式策略实验启动失败。");
        return;
      }
      setLaunch(result.launch);
      setResearch(null);
    } finally {
      if (launchRequestCoordinatorRef.current.isCurrent(request)) {
        setBusyAction((current) => current === "launch" ? null : current);
      }
    }
  };

  return (
    <section className="ai-research-m4-section strategy-research-section">
      <header className="ai-review-stage3-heading">
        <div>
          <span>AI 策略研发</span>
          <strong>注册能力提案 → 人工确认 → 正式实验</strong>
        </div>
        <span className="ai-review-stage3-boundary">
          {research?.paper.status === "unavailable"
            ? "仅注册模板 · Paper runtime 未确认"
            : "仅注册模板 · Paper-only · Live blocked"}
        </span>
      </header>

      {error ? <p className="ai-review-stage3-error" role="alert">{error}</p> : null}
      {capabilityError ? (
        <p className="ai-review-stage3-error" role="alert">{capabilityError}</p>
      ) : null}
      {!sourceQualification.eligible ? (
        <div className="ai-review-stage3-empty">
          {sourceQualification.detail}
          <div className="ai-review-stage3-actions">
            <button
              className="design-secondary-action"
              data-testid="strategy-research-open-p0"
              onClick={onOpenFormalP0}
              type="button"
            >
              前往研究页生成正式 P0
            </button>
          </div>
        </div>
      ) : null}

      <div className="ai-review-stage3-grid">
        <section className="ai-review-stage3-card ai-research-m4-config">
          <h3>1. 优化当前已审计策略族</h3>
          <label>
            <span>研发目标</span>
            <select
              disabled={busyAction !== null}
              onChange={(event) => {
                setGoal(event.target.value as (typeof researchGoals)[number]);
                resetDownstream();
              }}
              value={goal}
            >
              {researchGoals.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <div data-testid="strategy-research-template-scope">
            <strong>服务端按当前策略族自动匹配</strong>
            <p>候选范围只包含下列已注册能力，用户不需要猜测来源策略的内部类型。</p>
            {capabilitiesLoading ? <p>正在读取服务端注册能力…</p> : null}
            {!capabilitiesLoading && registeredCapabilities.length ? (
              <ul>
                {registeredCapabilities.map((item) => (
                  <li key={item.templateId}>{strategyResearchCapabilityDisplayName(item)}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <label>
            <span>模型服务</span>
            <select
              disabled={busyAction !== null || providers.length === 0}
              onChange={(event) => {
                setProviderId(event.target.value as AiReviewProviderId);
                resetDownstream();
              }}
              value={providerId}
            >
              {providers.map((item) => (
                <option disabled={!item.configured} key={item.providerId} value={item.providerId}>
                  {aiProviderLabels[item.providerId]}{item.configured ? "" : "（未配置）"}
                </option>
              ))}
            </select>
          </label>
          <label className="ai-review-stage3-approval">
            <input
              checked={usesExternalProvider && externalDataApproved}
              disabled={!usesExternalProvider || busyAction !== null}
              onChange={(event) => {
                approvalAttemptGuardRef.current.reset();
                dispatchApproval({
                  type: "set",
                  context: approvalContext,
                  approved: event.target.checked,
                });
                resetDownstream();
              }}
              type="checkbox"
            />
            <span>明确同意把服务端筛选后的开发集证据发送给外部模型</span>
          </label>
          <small>浏览器只提交运行 ID、目标、服务商和一次性批准状态；模板匹配完全由服务端完成。</small>
          <div className="ai-review-stage3-actions">
            <button
              className="design-primary-action"
              data-testid="strategy-research-propose"
              disabled={!canPropose}
              onClick={() => void propose()}
              type="button"
            >
              <Sparkles aria-hidden="true" size={14} />
              {busyAction === "propose" ? "生成中…" : "生成研发提案"}
            </button>
          </div>
        </section>

        <section className="ai-review-stage3-card ai-research-m4-config">
          <h3>2. 实名确认正式实验</h3>
          {proposal ? (
            <>
              <p>
                已持久化提案 <strong>{proposal.template.templateId}</strong>，包含 {proposal.experiment.dimensions.length} 个固定参数维度。
              </p>
              <small>{proposal.generation.reasons[0] ?? "服务端已固定模板与参数空间。"}</small>
            </>
          ) : <p>先生成只读研发提案；提案不会保存策略或读取留出集。</p>}
          <label>
            <span>操作人</span>
            <input
              disabled={busyAction !== null || Boolean(launch)}
              maxLength={320}
              onChange={(event) => setOperator(event.target.value)}
              type="text"
              value={operator}
            />
          </label>
          <label className="ai-review-stage3-approval">
            <input
              checked={launchConfirmed}
              data-testid="strategy-research-confirm-launch"
              disabled={!proposal || busyAction !== null || Boolean(launch)}
              onChange={(event) => setLaunchConfirmed(event.target.checked)}
              type="checkbox"
            />
            <span>我确认只启动正式研究实验，并接受留出集仅能被一个定义消费</span>
          </label>
          <div className="ai-review-stage3-actions">
            <button
              className="design-primary-action"
              data-testid="strategy-research-launch"
              disabled={!canLaunch || Boolean(launch)}
              onClick={() => void startExperiment()}
              type="button"
            >
              <Play aria-hidden="true" size={14} />
              {busyAction === "launch" ? "启动中…" : "确认并启动正式实验"}
            </button>
          </div>
        </section>
      </div>

      <section className="ai-review-stage3-card ai-research-m4-result">
        <h3>3. 服务端实验进度</h3>
        <StrategyResearchPaperBoundaryNotice paperStatus={research?.paper.status ?? null} />
        <div className="ai-research-m4-score-grid">
          <article>
            <span>实验状态</span>
            <strong>{statusLabel}</strong>
            <p>{experiment?.experimentId ?? launch?.experimentId ?? "等待人工启动"}</p>
          </article>
          <article>
            <span>评估数量</span>
            <strong>{experiment?.evaluationCount ?? 0}</strong>
            <p>{experiment?.holdoutStatus === "consumed" ? "留出集已按唯一实验定义消费" : "留出集未向浏览器暴露"}</p>
          </article>
          <article>
            <span>盈利门槛</span>
            <strong>{experiment?.profitabilityGatePassed ? "通过" : experiment?.status === "completed" ? "未通过" : "等待服务端复算"}</strong>
            <p>结果只读；本模块不执行后续治理动作。</p>
          </article>
        </div>
        {nextActionLabels.length ? (
          <p>服务端下一步：{nextActionLabels.join("、")}</p>
        ) : null}
        {launch ? (
          <div className="ai-review-stage3-actions">
            <button
              className="design-secondary-action"
              disabled={busyAction !== null}
              onClick={() => setReadRefreshGeneration((current) => current + 1)}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={14} />
              {busyAction === "read" ? "读取中…" : "刷新只读状态"}
            </button>
          </div>
        ) : null}
      </section>

      <div className="ai-review-stage3-boundary-detail">
        <ShieldCheck aria-hidden="true" size={14} />
        本入口不会自动晋级、绑定、启动监控或提交订单；晋级、绑定与 Paper 监控继续由现有独立人工流程控制。
      </div>
    </section>
  );
}

function strategyResearchNextActionLabel(value: string): string {
  return {
    wait_for_formal_experiment: "等待正式实验完成",
    inspect_formal_experiment_failure: "检查正式实验失败原因",
    review_non_admissible_result: "复核未达盈利门槛的结果",
    run_fresh_p0: "独立运行新的 P0 审计",
    promote_winner_explicitly: "由人工独立晋级胜出候选",
    bind_promoted_strategy_explicitly: "由人工独立绑定已晋级策略",
    start_paper_monitoring_explicitly: "由人工独立启动 Paper 监控",
    monitor_paper_trial: "观察 Paper 试运行",
    inspect_paper_runtime_boundary: "检查 Paper 运行边界（当前未确认绑定或监控）",
  }[value] ?? value;
}
