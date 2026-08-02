import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Play,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  aiReviewExternalErrorTranslationKey,
  aiReviewRequiresExternalApproval,
  buildComparisonEligibility,
  type AiReviewDecision,
  type AiReviewDecisionStatus,
  type AiReviewExperimentReference,
  type AiReviewProviderId,
  type AiReviewProviderStatus,
  type AiReviewStance,
  type AppendAiReviewDecisionRequest,
  type AuthoritativeAiReviewRun,
} from "../../lib/ai-review-stage3";
import { createI18n, type TranslationKey } from "../../lib/i18n";
import type {
  ProductionStrategyHandoff,
  ProductionStrategyHandoffResult,
  StrategyProductionBinding,
} from "../../lib/terminal-api";
import type {
  StrategyExperimentListItem,
  TerminalWorkspace,
} from "../../lib/terminal-workbench";
import {
  aiProviderLabels,
  compactRunId,
  EmptyState,
  PageHeader,
  type SurfaceAction,
  Status,
  SurfacePanel,
} from "../../components/TerminalSurfaceUi";
import "./AiReviewPage.layout.css";
import "./AiReviewResearchLoop.layout.css";
import "./AiReviewResults.layout.css";
import "./AiReviewDecision.layout.css";
import type {
  AiReviewController,
  AiReviewProductionPath,
  AiReviewProductionPathAction,
  AiReviewProductionPathProjection,
} from "../shared/ai-review-contract";
export type {
  AiReviewController,
  AiReviewProductionPath,
  AiReviewProductionPathAction,
  AiReviewProductionPathProjection,
} from "../shared/ai-review-contract";


const aiReviewZh = createI18n("zh-CN");

const aiReviewDecisionStatuses: AiReviewDecisionStatus[] = [
  "accepted_for_research",
  "revision_requested",
  "rejected",
  "insufficient_evidence",
];

export function buildAiReviewProductionPath({
  binding,
  decisions,
  handoff,
  handoffError,
  primaryCandidateAvailable,
  review,
  switchBlockedReason,
}: {
  binding: StrategyProductionBinding | null;
  decisions: readonly AiReviewDecision[];
  handoff: ProductionStrategyHandoff | null;
  handoffError: string | null;
  primaryCandidateAvailable: boolean;
  review: AuthoritativeAiReviewRun | null;
  switchBlockedReason?: string | null;
}): AiReviewProductionPath {
  if (!review) {
    return {
      action: null,
      actionLabel: null,
      detail: "先完成权威评审；AI 评审只形成研究证据，不会直接授权实盘。",
      label: "等待权威评审",
      tone: "neutral",
    };
  }
  if (review.deterministicAssessment.stance !== "supported") {
    return {
      action: null,
      actionLabel: null,
      detail: "本地确定性评估尚未支持该候选，不能进入生产策略交接。",
      label: "确定性评估未支持",
      tone: "risk",
    };
  }
  const externalSupported = review.externalAssessment.status === "completed"
    && review.externalAssessment.assessment?.stance === "supported";
  if (
    review.externalAssessment.provider !== "local"
      ? !externalSupported
      : review.externalAssessment.status !== "skipped" && !externalSupported
  ) {
    return {
      action: null,
      actionLabel: null,
      detail: "本次已请求外部补充评估，但结果未明确支持该候选；请先处理评审风险。",
      label: "外部评估未支持",
      tone: "risk",
    };
  }
  const latestDecision = decisions[decisions.length - 1] ?? null;
  if (
    !latestDecision
    || latestDecision.aiReviewId !== review.aiReviewId
    || latestDecision.reviewRecordHash !== review.recordHash
    || latestDecision.evidenceHash !== review.evidenceHash
  ) {
    return {
      action: null,
      actionLabel: null,
      detail: "请实名追加一条与当前证据哈希一致的研究决策；该决定仍不构成生产授权。",
      label: "等待人工研究决策",
      tone: "warning",
    };
  }
  if (latestDecision.status !== "accepted_for_research") {
    return {
      action: null,
      actionLabel: null,
      detail: "最新人工结论没有接受该候选用于后续研究，生产关联保持阻断。",
      label: "研究决策未接受",
      tone: "risk",
    };
  }

  const reference = review.primaryExperiment;
  if (reference.candidateRevision !== reference.strategyRevision) {
    return primaryCandidateAvailable
      ? {
          action: "stage-primary-candidate",
          actionLabel: "采用已评审候选并重新审计",
          detail: "选中候选与源运行策略版本不同；采用后会清除旧审计结果，并回到策略工坊重新运行完整研究链。",
          label: "候选需重新审计",
          tone: "warning",
        }
      : {
          action: null,
          actionLabel: null,
          detail: "当前页面没有载入与评审哈希完全一致的实验详情，不能采用候选。",
          label: "候选上下文待恢复",
          tone: "warning",
        };
  }

  const handoffMatchesReview = Boolean(
    handoff
    && handoff.runId === reference.sourceRunId
    && handoff.strategyRevision === reference.candidateRevision
    && handoff.dataSnapshotHash === reference.snapshotId
  );
  if (handoffError) {
    return {
      action: "open-production-handoff",
      actionLabel: "前往回测检查生产资格",
      detail: `服务端生产预检未通过：${handoffError}`,
      label: "生产预检未通过",
      tone: "risk",
    };
  }
  const bindingMatchesReview = Boolean(
    binding
    && binding.auditRunId === reference.sourceRunId
    && binding.revision === reference.candidateRevision
    && binding.status === "ready"
    && handoffMatchesReview
    && handoff?.status === "active"
    && handoff?.alreadyBound === true
  );
  if (bindingMatchesReview) {
    return {
      action: "open-dynamic-trading",
      actionLabel: "前往动态交易复核",
      detail: "当前生产策略已精确绑定这份审计运行；进入动态交易后仍由独立授权、风控和人工确认控制真实委托。",
      label: "生产策略已关联",
      tone: "positive",
    };
  }

  if (
    !handoff
    || !handoffMatchesReview
  ) {
    const identityMismatch = Boolean(handoff);
    return {
      action: "open-production-handoff",
      actionLabel: "前往回测检查生产资格",
      detail: identityMismatch
        ? "服务端生产预检返回的运行、策略版本或快照与当前评审不一致，请前往回测实验室重新核对。"
        : "等待服务端读取该审计运行的生产预检；可前往回测实验室查看完整证据。",
      label: identityMismatch ? "生产身份不一致" : "等待生产预检",
      tone: identityMismatch ? "risk" : "neutral",
    };
  }

  return {
    action: "open-production-handoff",
    actionLabel: handoff.status === "ready"
      ? "前往回测完成生产交接"
      : "前往回测处理切换条件",
    detail: handoff.status === "ready"
      ? "服务端已复算通过；生产交接仍需在回测页实名确认，完成后保持自动交易暂停。"
      : switchBlockedReason
        ? `审计证据已通过；当前切换条件：${switchBlockedReason}`
        : "审计证据已通过，但当前生产策略切换条件尚未满足；请在回测页查看阻断原因。",
    label: handoff.status === "ready" ? "可进入生产交接" : "生产切换条件待处理",
    tone: handoff.status === "ready" ? "positive" : "warning",
  };
}

export function AiReviewPage({
  action,
  aiReview,
  productionStrategyHandoff,
  workspace,
}: {
  action: SurfaceAction;
  aiReview: AiReviewController;
  productionStrategyHandoff?: AiReviewProductionPathProjection;
  workspace: TerminalWorkspace;
}) {
  const currentReview = aiReview.running ? null : aiReview.currentReview;
  const deterministicAssessment = currentReview?.deterministicAssessment ?? null;
  const externalAssessment = currentReview?.externalAssessment ?? null;
  const hasCurrentReview = Boolean(currentReview);
  const hasCurrentEvidence = Boolean(currentReview || workspace.researchRun);
  const configuredProvider = aiReview.providers.find(
    (provider) => provider.providerId === aiReview.providerId,
  );
  const usesExternalProvider = aiReviewRequiresExternalApproval(aiReview.providerId);
  const selectedProvider = aiReview.providers.find(
    (provider) => provider.providerId === (externalAssessment?.provider ?? aiReview.providerId),
  );
  const comparisonMetricRows = [
    ["收益率", "totalReturnPct"],
    ["最大回撤", "maxDrawdownPct"],
    ["胜率", "winRatePct"],
    ["交易数", "tradeCount"],
  ] as const;
  const reviewExperiments = currentReview
    ? [currentReview.primaryExperiment, ...currentReview.comparisonExperiments]
    : [];
  const reviewMetricValue = (
    experiment: AiReviewExperimentReference,
    metric: (typeof comparisonMetricRows)[number][1],
  ) => {
    const evidence = currentReview?.evidenceBundle.evidenceItems.find((item) =>
      item.kind === "candidate_metrics"
      && item.id.startsWith(`experiment:${experiment.experimentId}:candidate:`)
      && item.value.selected === true
      && item.value.candidateId === experiment.selectedCandidateId,
    );
    const testMetrics = evidence?.value.testMetrics;
    const value = testMetrics && typeof testMetrics === "object"
      ? (testMetrics as Record<string, unknown>)[metric]
      : null;
    if (typeof value !== "number" || !Number.isFinite(value)) return "—";
    return metric === "tradeCount" ? String(value) : `${value.toFixed(2)}%`;
  };
  const currentReviewId = compactRunId(currentReview?.aiReviewId);
  const currentRunId = compactRunId(
    currentReview?.primaryExperiment.sourceRunId ?? workspace.researchRun?.runId,
  );
  const evidenceHash = compactRunId(currentReview?.evidenceHash);
  const recordHash = compactRunId(currentReview?.recordHash);
  const primaryExperimentId = currentReview?.primaryExperiment.experimentId
    ?? aiReview.primaryExperimentId;
  const comparisonCount = currentReview?.comparisonExperiments.length
    ?? aiReview.comparisonExperimentIds.length;
  const primarySelection = aiReview.experiments.find(
    (experiment) => experiment.experimentId === aiReview.primaryExperimentId,
  ) ?? null;
  const snapshotIdentity =
    currentReview?.primaryExperiment.snapshotId
    ?? primarySelection?.snapshotId
    ?? workspace.researchRun?.dataSnapshot?.snapshotHash
    ?? workspace.researchRun?.dataSnapshot?.hash
    ?? null;
  const comparisonOptions = primarySelection
    ? aiReview.experiments
        .filter((experiment) => experiment.experimentId !== primarySelection.experimentId)
        .map((experiment) => {
          const selected = aiReview.comparisonExperimentIds.includes(experiment.experimentId);
          const eligibility = selected
            ? { eligible: true, reason: null }
            : buildComparisonEligibility(
                primarySelection,
                experiment,
                aiReview.comparisonExperimentIds,
              );
          return { eligibility, experiment, selected };
        })
    : [];
  const localizedMessage = (message: string | undefined, fallback: string) =>
    message ? aiReviewZh.decisionMessage(message) : fallback;
  const stanceLabel = (stance: AiReviewStance | undefined) =>
    stance
      ? aiReviewZh.t(`aiReviewStage3.stance.${stance}` as TranslationKey)
      : "待运行";
  const stanceTone = (stance: AiReviewStance | undefined) => {
    if (stance === "supported") return "positive" as const;
    if (stance === "blocked") return "risk" as const;
    if (stance === "caution" || stance === "insufficient_evidence") return "warning" as const;
    return "neutral" as const;
  };
  const consistencyLabel = deterministicAssessment
    ? deterministicAssessment.consistency === "insufficient" && comparisonCount === 0
      ? "未选择对照实验"
      : aiReviewZh.t(
          `aiReviewStage3.consistency.${deterministicAssessment.consistency}` as TranslationKey,
        )
    : "—";
  const externalTone = externalAssessment?.status === "completed"
    ? stanceTone(externalAssessment.assessment?.stance)
    : externalAssessment?.status === "failed"
      ? "risk" as const
      : "neutral" as const;
  const executionSemanticsFailure = externalAssessment?.status === "failed" && (
    externalAssessment.error?.code === "execution_semantics"
    || (
      externalAssessment.error?.code === "invalid_schema"
      && externalAssessment.error.message === "provider_assessment_contains_execution_semantics"
    )
  );
  const externalLabel = aiReview.running
    ? "运行中"
    : externalAssessment?.status === "completed"
      ? stanceLabel(externalAssessment.assessment?.stance)
      : executionSemanticsFailure
        ? "安全校验拒绝"
        : externalAssessment?.error?.code === "timeout"
          ? "响应超时"
          : externalAssessment?.error?.code === "invalid_schema"
            ? "格式校验拒绝"
      : externalAssessment
        ? aiReviewZh.t(
            `aiReviewStage3.external.status.${externalAssessment.status}` as TranslationKey,
          )
        : "待运行";
  const externalErrorKey = aiReviewExternalErrorTranslationKey(
    externalAssessment?.error ?? null,
  );
  const externalSummary = aiReview.running
    ? "正在等待本次外部模型结果，不显示历史评审结论。"
    : externalAssessment?.assessment?.summary
      ? localizedMessage(externalAssessment.assessment.summary, externalAssessment.assessment.summary)
      : executionSemanticsFailure && externalAssessment
        ? `外部响应${externalAssessment.latencyMs > 0
            ? `已在 ${(externalAssessment.latencyMs / 1_000).toFixed(1)} 秒返回`
            : "已返回"}，但在响应安全校验阶段被拒绝${externalAssessment.error?.diagnostic?.fieldPath
            ? `（字段：${externalAssessment.error.diagnostic.fieldPath.replace(/^\$\./, "")}）`
            : ""}：检测到买卖、持仓、目标价或订单等执行语义。本地确定性评估仍有效。`
      : externalAssessment?.error
        ? aiReviewZh.t(externalErrorKey)
        : externalAssessment
          ? aiReviewZh.t(
              `aiReviewStage3.external.${externalAssessment.status}` as TranslationKey,
            )
          : "运行权威评审后，才会显示外部模型的补充意见。";
  const assessmentRows = currentReview && deterministicAssessment
    ? [
        {
          agent: "确定性评估",
          id: `${currentReview.aiReviewId}-deterministic`,
          message: deterministicAssessment.summary,
          runId: currentReview.aiReviewId,
          status: stanceLabel(deterministicAssessment.stance),
          tone: stanceTone(deterministicAssessment.stance),
          version: "基线",
        },
        ...(externalAssessment?.status === "completed" && externalAssessment.assessment
          ? [{
              agent: aiProviderLabels[externalAssessment.provider],
              id: `${currentReview.aiReviewId}-external`,
              message: externalAssessment.assessment.summary,
              runId: currentReview.aiReviewId,
              status: stanceLabel(externalAssessment.assessment.stance),
              tone: stanceTone(externalAssessment.assessment.stance),
              version: "外部",
            }]
          : []),
      ]
    : [];
  const appendedDecisionRows = [...aiReview.decisions].reverse().map((decision, index) => ({
    agent: decision.operator,
    id: decision.decisionId,
    message: decision.rationale,
    runId: decision.aiReviewId,
    status: aiReviewZh.t(`aiReviewStage3.decision.${decision.status}` as TranslationKey),
    tone: decision.status === "accepted_for_research"
      ? "positive" as const
      : decision.status === "rejected"
        ? "risk" as const
        : "warning" as const,
    version: `D${aiReview.decisions.length - index}`,
  }));
  const decisionRows = [...appendedDecisionRows, ...assessmentRows].slice(0, 5);
  const chainRows = ["回测运行", "证据包", "因子库", "数据同步", "审计回放"];
  const timelineRows = ["证据锁定", "确定性评估", "外部评估", "追加决策"];
  const canAppendDecision = Boolean(
    currentReview
    && aiReview.decisionDraft.operator.trim()
    && aiReview.decisionDraft.rationale.trim()
    && !aiReview.busy,
  );
  const productionHandoff = productionStrategyHandoff?.result.handoff ?? null;
  const productionPath = buildAiReviewProductionPath({
    binding: productionStrategyHandoff?.binding ?? null,
    decisions: aiReview.decisions,
    handoff: productionHandoff,
    handoffError: productionStrategyHandoff?.errorLabel ?? null,
    primaryCandidateAvailable: aiReview.primaryCandidateAvailable,
    review: currentReview,
    switchBlockedReason: productionStrategyHandoff?.switchBlockedReasonLabel ?? null,
  });
  const runProductionPathAction = () => {
    if (productionPath.action === "stage-primary-candidate") {
      aiReview.onStagePrimaryCandidate();
    } else if (productionPath.action === "open-production-handoff") {
      aiReview.onOpenProductionHandoff();
    } else if (productionPath.action === "open-dynamic-trading") {
      productionStrategyHandoff?.onOpenDynamicTrading();
    }
  };
  return (
    <>
      <PageHeader
        action={action}
        title="AI 评审"
        subtitle={`/ ${currentReviewId}`}
      >
        <div className="design-meta-line">
          <LockKeyhole size={13} /> 证据锁定：
          {hasCurrentEvidence ? "已锁定（不可修改）" : "等待运行"}
        </div>
      </PageHeader>
      {aiReview.error ? (
        <div className="design-ai-run-error" role="alert">
          <AlertTriangle size={16} />
          <span>{aiReview.error}</span>
        </div>
      ) : null}
      <div className="design-ai-grid">
        <section className="design-ai-overview" aria-label="当前评审上下文">
          <div>
            <span>当前评审</span>
            <strong>{currentReviewId}</strong>
            <small>{hasCurrentReview ? "已载入权威评审" : "等待权威评审"}</small>
          </div>
          <div>
            <span>证据状态</span>
            <strong>{hasCurrentEvidence ? "已锁定" : "未锁定"}</strong>
            <small>{hasCurrentEvidence ? "只读 · 不可修改" : "运行研究后生成"}</small>
          </div>
          <div>
            <span>实验范围</span>
            <strong>
              {primaryExperimentId
                ? `1 个主实验 · ${comparisonCount} 个对照`
                : "等待选择主实验"}
            </strong>
            <small>{primaryExperimentId ? "同一证据口径横向比较" : "先完成回测实验"}</small>
          </div>
          <div>
            <span>安全基线</span>
            <strong>本地确定性优先</strong>
            <small>外部失败不会覆盖基线</small>
          </div>
        </section>

        <main className="design-ai-main">
          <SurfacePanel
            className="design-ai-review"
            subtitle="确定性基线优先，外部模型仅提供补充意见"
            title="评审结论"
          >
            <div className="design-ai-verdicts">
              <article className="design-ai-verdict primary">
                <header>
                  <div>
                    <span>确定性评估</span>
                    <small>本地基线</small>
                  </div>
                  {deterministicAssessment?.stance === "supported"
                    ? <CheckCircle2 size={22} />
                    : deterministicAssessment?.stance === "blocked"
                      ? <XCircle size={22} />
                      : <Clock3 size={22} />}
                </header>
                <strong>{stanceLabel(deterministicAssessment?.stance)}</strong>
                <p>
                  {deterministicAssessment
                    ? localizedMessage(deterministicAssessment.summary, deterministicAssessment.summary)
                    : hasCurrentEvidence
                      ? "证据已锁定，运行权威评审后形成确定性结论。"
                      : "运行研究并锁定证据后，才会形成权威评审结论。"}
                </p>
                <footer>
                  <Status tone={stanceTone(deterministicAssessment?.stance)}>
                    {deterministicAssessment ? `一致性：${consistencyLabel}` : "尚未运行"}
                  </Status>
                  <span>{deterministicAssessment ? "确定性基线" : "等待评审"}</span>
                </footer>
              </article>
              <article className="design-ai-verdict external">
                <header>
                  <div>
                    <span>外部评估</span>
                    <small>补充意见</small>
                  </div>
                  {externalTone === "positive"
                    ? <CheckCircle2 size={22} />
                    : externalTone === "risk"
                      ? <XCircle size={22} />
                      : <Clock3 size={22} />}
                </header>
                <strong>{externalLabel}</strong>
                <p>{externalSummary}</p>
                <footer>
                  <Status tone={externalTone}>
                    {externalAssessment?.status === "completed"
                      ? `一致性：${externalAssessment.assessment
                          ? aiReviewZh.t(
                              `aiReviewStage3.consistency.${externalAssessment.assessment.consistency}` as TranslationKey,
                            )
                          : "—"}`
                      : externalLabel}
                  </Status>
                  <span>{externalAssessment?.model ?? "等待模型结果"}</span>
                </footer>
              </article>
            </div>
            <div className="design-ai-baseline">
              <ShieldCheck size={17} />
              <div>
                <strong>{hasCurrentReview ? "权威基线保持不变" : "等待建立权威基线"}</strong>
                <span>外部评估失败、超时或不一致，均不会覆盖确定性本地结果。</span>
              </div>
              <Status>{hasCurrentReview ? "基线有效" : "安全边界有效"}</Status>
            </div>
          </SurfacePanel>

          <SurfacePanel
            className="design-ai-evidence"
            subtitle={currentReview?.comparisonExperiments.length
              ? "主实验与本次评审实际加入的对照实验"
              : "当前评审未加入对照实验"}
            title="实验指标对比"
          >
            {currentReview ? (
              <table className="design-table">
                <thead>
                  <tr>
                    <th>指标</th>
                    {reviewExperiments.map((experiment, index) => (
                      <th key={experiment.experimentId} title={experiment.experimentId}>
                        {index === 0
                          ? "主实验"
                          : `对照实验 ${index} · ${compactRunId(experiment.experimentId)}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonMetricRows.map(([label, metric]) => (
                    <tr key={metric}>
                      <td>{label}</td>
                      {reviewExperiments.map((experiment) => (
                        <td key={experiment.experimentId}>{reviewMetricValue(experiment, metric)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                detail="运行评审后显示主实验与已选对照实验的权威指标。"
                title="等待权威评审"
              />
            )}
          </SurfacePanel>

          <SurfacePanel
            className="design-ai-decisions"
            subtitle="只追加，不覆盖历史结论"
            title="评审记录"
          >
            {decisionRows.length ? (
              <div className="design-decision-head" aria-hidden="true">
                <span>版本</span>
                <span>评审角色</span>
                <span>结论</span>
                <span>依据摘要</span>
                <span>评审记录</span>
              </div>
            ) : null}
            {decisionRows.map((decision) => (
              <div className="design-decision-row" key={decision.id}>
                <span>{decision.version}</span>
                <strong>{aiReviewZh.decisionAgent(decision.agent)}</strong>
                <Status tone={decision.tone}>{decision.status}</Status>
                <p>{aiReviewZh.decisionMessage(decision.message)}</p>
                <small>{compactRunId(decision.runId)}</small>
              </div>
            ))}
            {!decisionRows.length ? (
              <p className="design-ai-empty">暂无当前权威评审记录，请先运行评审或载入最近评审。</p>
            ) : null}
          </SurfacePanel>
          <SurfacePanel
            className="design-ai-decision-entry"
            subtitle="决定只追加到当前证据链，不覆盖历史记录"
            title="人工研究决策"
          >
            <div className="design-ai-decision-form">
              <label htmlFor="ai-review-decision-operator">
                <span>实名操作人</span>
                <input
                  autoComplete="name"
                  disabled={aiReview.busy}
                  id="ai-review-decision-operator"
                  maxLength={80}
                  onChange={(event) => aiReview.onDecisionDraftChange({
                    ...aiReview.decisionDraft,
                    operator: event.currentTarget.value,
                  })}
                  placeholder="输入实名操作人"
                  type="text"
                  value={aiReview.decisionDraft.operator}
                />
              </label>
              <label htmlFor="ai-review-decision-status">
                <span>研究决定</span>
                <select
                  disabled={aiReview.busy}
                  id="ai-review-decision-status"
                  onChange={(event) => aiReview.onDecisionDraftChange({
                    ...aiReview.decisionDraft,
                    status: event.currentTarget.value as AiReviewDecisionStatus,
                  })}
                  value={aiReview.decisionDraft.status}
                >
                  {aiReviewDecisionStatuses.map((status) => (
                    <option key={status} value={status}>
                      {aiReviewZh.t(`aiReviewStage3.decision.${status}` as TranslationKey)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="design-ai-decision-rationale" htmlFor="ai-review-decision-rationale">
                <span>决定依据</span>
                <textarea
                  disabled={aiReview.busy}
                  id="ai-review-decision-rationale"
                  maxLength={2000}
                  onChange={(event) => aiReview.onDecisionDraftChange({
                    ...aiReview.decisionDraft,
                    rationale: event.currentTarget.value,
                  })}
                  placeholder="说明接受、修订或拒绝该研究候选的依据"
                  value={aiReview.decisionDraft.rationale}
                />
              </label>
              <div className="design-ai-decision-actions">
                <button
                  className="design-primary-action"
                  disabled={!canAppendDecision}
                  onClick={aiReview.onAppendDecision}
                  type="button"
                >
                  <Check size={14} />
                  {aiReview.appendingDecision ? "正在追加…" : "追加研究决策"}
                </button>
              </div>
            </div>
            <p className="design-ai-decision-boundary">
              “接受用于研究”仅确认后续研究方向，不等于生产批准，也不会授权、启动、评估或提交订单。
            </p>
          </SurfacePanel>
          <SurfacePanel
            className="design-production-handoff design-ai-production-handoff"
            subtitle="评审候选先与已审计策略对齐，再进入既有生产交接"
            title="生产策略关联"
          >
            <div className="design-production-handoff-status">
              <div>
                <span>关联状态</span>
                <Status tone={productionPath.tone}>{productionPath.label}</Status>
              </div>
              <p>{productionPath.detail}</p>
            </div>
            <div className="design-production-handoff-grid">
              <div>
                <span>评审源运行</span>
                <strong title={currentReview?.primaryExperiment.sourceRunId ?? "—"}>
                  {compactRunId(currentReview?.primaryExperiment.sourceRunId)}
                </strong>
              </div>
              <div>
                <span>源策略版本</span>
                <strong title={currentReview?.primaryExperiment.strategyRevision ?? "—"}>
                  {compactRunId(currentReview?.primaryExperiment.strategyRevision)}
                </strong>
              </div>
              <div>
                <span>已评审候选</span>
                <strong title={currentReview?.primaryExperiment.candidateRevision ?? "—"}>
                  {compactRunId(currentReview?.primaryExperiment.candidateRevision)}
                </strong>
                <small title={currentReview?.primaryExperiment.selectedCandidateId ?? "—"}>
                  候选 {compactRunId(currentReview?.primaryExperiment.selectedCandidateId)}
                </small>
              </div>
              <div>
                <span>当前生产策略</span>
                <strong>
                  {productionStrategyHandoff?.binding
                    ? `${productionStrategyHandoff.binding.name} · ${compactRunId(productionStrategyHandoff.binding.revision)}`
                    : "尚未绑定"}
                </strong>
              </div>
            </div>
            <div className="design-production-handoff-actions">
              {productionPath.action && productionPath.actionLabel ? (
                <button
                  className={productionPath.action === "open-dynamic-trading"
                    ? "design-secondary-action"
                    : "design-primary-action"}
                  disabled={aiReview.busy}
                  onClick={runProductionPathAction}
                  type="button"
                >
                  {productionPath.action === "stage-primary-candidate"
                    ? <Check size={14} />
                    : productionPath.action === "open-dynamic-trading"
                      ? <Play size={14} />
                      : <ShieldCheck size={14} />}
                  {productionPath.actionLabel}
                </button>
              ) : null}
            </div>
          </SurfacePanel>
          {aiReview.researchLoop}
        </main>

        <aside className="design-ai-side">
          <SurfacePanel
            title="对照实验"
            subtitle="仅允许同标的、同周期、同策略谱系，最多 4 个"
          >
            {primarySelection ? (
              comparisonOptions.length ? (
                <div className="design-ai-comparison-list">
                  {comparisonOptions.map(({ eligibility, experiment, selected }) => (
                    <label
                      className={`design-ai-external-approval ${eligibility.eligible ? "eligible" : "ineligible"}`}
                      key={experiment.experimentId}
                    >
                      <input
                        checked={selected}
                        disabled={aiReview.busy || (!selected && !eligibility.eligible)}
                        onChange={() => aiReview.onComparisonToggle(experiment.experimentId)}
                        type="checkbox"
                      />
                      <span className="design-ai-external-approval-copy">
                        <strong>{compactRunId(experiment.experimentId)}</strong>
                        <small>
                          {selected
                            ? "已加入本次评审"
                            : eligibility.reason
                              ? aiReviewZh.t(
                                  `aiReviewStage3.reason.${eligibility.reason}` as TranslationKey,
                                )
                              : aiReviewZh.t("aiReviewStage3.eligible")}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              ) : <p className="design-ai-empty">暂无其他可选实验</p>
            ) : <p className="design-ai-empty">请先完成并选择主实验</p>}
          </SurfacePanel>
          <SurfacePanel
            title="评审设置"
            subtitle="选择本次评审使用的补充模型"
          >
            <div className="design-research-ai-controls design-ai-provider-controls">
              <label htmlFor="ai-review-provider">
                <span>模型服务</span>
                <select
                  disabled={aiReview.busy || !aiReview.providers.length}
                  id="ai-review-provider"
                  onChange={(event) => aiReview.onProviderChange(
                    event.currentTarget.value as AiReviewProviderId,
                  )}
                  value={aiReview.providerId}
                >
                  {!aiReview.providers.length ? (
                    <option value={aiReview.providerId}>
                      {aiProviderLabels[aiReview.providerId]} · 正在加载
                    </option>
                  ) : null}
                  {aiReview.providers.map((provider) => (
                    <option
                      disabled={!provider.configured}
                      key={provider.providerId}
                      value={provider.providerId}
                    >
                      {aiProviderLabels[provider.providerId]}
                      {provider.configured ? "" : " · 未配置"}
                    </option>
                  ))}
                </select>
              </label>
              <small className="design-research-provider-meta">
                {configuredProvider
                  ? usesExternalProvider
                    ? `${configuredProvider.model ?? "模型未配置"} · ${configuredProvider.sanitizedBaseUrl ?? "地址未配置"}`
                    : "确定性本地评估 · 不发送任何数据"
                  : "正在加载服务配置"}
              </small>
              {usesExternalProvider ? (
                <>
                  <p>
                    发送服务端冻结且已完成的原始 K 线、实验引用与哈希、策略定义、
                    数据质量摘要和候选指标证据；不发送形成中 K 线、密钥或已有研究笔记。
                  </p>
                  <label
                    className="design-ai-external-approval"
                    htmlFor="ai-review-external-approval"
                  >
                    <input
                      checked={aiReview.externalDataApproved}
                      disabled={aiReview.busy}
                      id="ai-review-external-approval"
                      onChange={(event) => aiReview.onExternalDataApprovedChange(
                        event.currentTarget.checked,
                      )}
                      type="checkbox"
                    />
                    <span className="design-ai-external-approval-copy">
                      <strong>允许发送已完成 K 线与证据</strong>
                      <small>仅本次评审有效，切换模型或实验后需重新确认</small>
                    </span>
                  </label>
                </>
              ) : (
                <p>当前只运行本地确定性评估，外部评估会明确记录为“已跳过”。</p>
              )}
            </div>
          </SurfacePanel>
          <SurfacePanel title="证据与审计">
            <div className="design-ai-chain">
              {chainRows.map((label, index) => (
                <div className="design-chain-row" key={label}>
                  <span>{index + 1}</span>
                  <strong>{label}</strong>
                  <small>{hasCurrentReview ? currentRunId : "等待运行"}</small>
                </div>
              ))}
            </div>
            <div className="design-ai-audit-grid">
              <div>
                <span>快照身份</span>
                <strong title={snapshotIdentity ?? "—"}>{compactRunId(snapshotIdentity)}</strong>
              </div>
              <div><span>证据包 Hash</span><strong>{evidenceHash}</strong></div>
              <div><span>评审记录 Hash</span><strong>{recordHash}</strong></div>
            </div>
          </SurfacePanel>

          <SurfacePanel title="模型披露">
            <div className="design-kv-row">
              <span>模型提供方</span>
              <strong>{aiProviderLabels[externalAssessment?.provider ?? aiReview.providerId]}</strong>
            </div>
            <div className="design-kv-row">
              <span>模型</span>
              <strong>{externalAssessment?.model ?? selectedProvider?.model ?? "—"}</strong>
            </div>
            <div className="design-kv-row">
              <span>出站字段</span>
              <strong>已完成 K 线与审计证据</strong>
            </div>
            <div className="design-ai-disclosure">
              <LockKeyhole size={14} /> 不发送形成中 K 线、密钥或已有研究笔记
            </div>
          </SurfacePanel>

          <SurfacePanel title="评审进度">
            {timelineRows.map((label, index) => {
              const completed = hasCurrentReview && (
                index < 2 || (index === 2 && externalAssessment?.status === "completed")
              );
              return (
                <div className="design-history-row" key={label}>
                  <i className={completed ? "done" : ""} />
                  <span>{label}</span>
                  <strong>{completed ? "完成" : "待复核"}</strong>
                </div>
              );
            })}
          </SurfacePanel>

          <SurfacePanel title="最近评审">
            {aiReview.history.slice(0, 3).map((review) => (
              <div className="design-history-row" key={review.aiReviewId}>
                <i className="done" />
                <span>{compactRunId(review.aiReviewId)}</span>
                <Status>已保存</Status>
              </div>
            ))}
            {!aiReview.history.length ? <p className="design-ai-empty">暂无已保存评审</p> : null}
          </SurfacePanel>
        </aside>
      </div>
    </>
  );
}
