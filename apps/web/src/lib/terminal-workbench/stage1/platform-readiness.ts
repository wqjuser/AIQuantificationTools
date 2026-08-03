import { buildP0CurrentGapActionUrlSearch } from "../audit/deep-link-queries";
import type { RiskApprovalSummary } from "../audit/execution-contracts";
import { buildP0CurrentGapActionReadiness } from "../audit/execution-contracts";
import type { TerminalWorkspace } from "../core/workspace-contracts";
import { activeQuantLoopStepId, buildProductWorkAreas, buildQuantLoopNavigationTarget, primaryQuantLoopStepDefinitions } from "../core/workspace-contracts";
import type { AgentCommitteeRound } from "../portfolio/paper-contracts";
import { auditReportLedgerProductWorkAreaId } from "../research-package/import-audit";
import type { GoldenPathRunbookSourceItem, P0PlatformBacklogItem, P0PlatformBacklogPriority, P0PlatformReadinessGap, P0PlatformReadinessSource, P0PlatformReadinessState, P0PlatformReadinessSummary, PanelId, ProductWorkAreaId, ProductWorkAreaSelection, ProductWorkAreaStatus } from "./foundation-contracts";
import type { P0CompletionChecklist, P0CompletionCriterionId, P0GoldenPathJourneyInput, P0GoldenPathJourneyStepId, P0GoldenPathJourneyStepState, P0PaperExecutionPreflight, P0PaperExecutionPreflightGate, P0PaperExecutionPreflightSource, P0PlatformActionOutcome, P0PlatformActionOutcomeEvidenceLink, P0PlatformReadinessReportInput, QuantLoopSelection } from "./review-contracts";
import { findDecisionMessage } from "../strategy/comparison-builders";
import { buildResearchRunContextBinding } from "../strategy/experiment-builders";

export function buildP0PaperExecutionPreflight(
  source: P0PaperExecutionPreflightSource | null | undefined
): P0PaperExecutionPreflight {
  const paperExecution = source?.paperExecution;
  const latestRunId = source?.goldenPath?.latestRunId?.trim() ?? "";
  const binding = source?.researchBinding ?? null;
  const riskApproval = source?.riskApproval ?? null;
  const liveTradingAllowed = Boolean(source?.goldenPath?.summary?.liveTradingAllowed);
  const targetWorkspaceId: ProductWorkAreaId = "execution";

  if (paperExecution?.executionId) {
    const orderCount = paperExecution.orders?.length ?? 0;
    const gateCount = paperExecution.gates?.length ?? 0;
    const passedGateCount = paperExecution.gates?.filter((gate) => gate.passed).length ?? 0;
    const detail = [
      paperExecution.executionId,
      `${orderCount} ${orderCount === 1 ? "order" : "orders"}`,
      `${passedGateCount}/${gateCount} gates passed`
    ].join(" · ");

    return {
      state: "recorded",
      headline: "Paper execution recorded",
      detail,
      primaryActionLabel: "Review paper execution",
      primaryActionId: null,
      primaryActionTargetWorkspaceId: targetWorkspaceId,
      canSubmitPaperOrder: false,
      canRebindLatestRun: false,
      targetWorkspaceId,
      gates: [
        {
          id: "audited-run",
          label: "Audited run",
          value: paperExecution.runId || latestRunId || "bound",
          detail: "Paper execution is linked to an audited research run.",
          status: "passed",
          tone: "positive"
        },
        {
          id: "risk-approval",
          label: "Risk approval",
          value: `${passedGateCount}/${gateCount} execution gates`,
          detail: "Paper execution captured its execution gate evidence.",
          status: gateCount > 0 && passedGateCount === gateCount ? "passed" : "review",
          tone: gateCount > 0 && passedGateCount === gateCount ? "positive" : "warning"
        },
        {
          id: "paper-execution",
          label: "Paper execution",
          value: paperExecution.executionId,
          detail: `${orderCount} ${orderCount === 1 ? "order" : "orders"} recorded in paper mode.`,
          status: "passed",
          tone: "positive"
        },
        buildP0PaperExecutionLiveBoundaryGate(liveTradingAllowed, "Paper execution remains paper-only unless live gates are explicitly opened.")
      ]
    };
  }

  const canUseBoundRun = Boolean(binding?.canUseRun);
  const canRebindLatestRun = Boolean(latestRunId) && !canUseBoundRun;
  const riskHeadline = riskApproval?.headline?.trim() || "Risk approval blocked";
  const riskSummary = riskApproval?.summary?.trim() || "Bind an audited run before paper or live execution.";
  const riskIsReady = riskApproval?.status === "paper_ready" || riskApproval?.status === "live_ready";

  if (!canUseBoundRun) {
    return {
      state: "blocked",
      headline: canRebindLatestRun ? "Bind latest audited run" : "Audited run required",
      detail: canRebindLatestRun
        ? `Golden Path has ${latestRunId} ready; load it before submitting a paper order.`
        : binding?.detail || "Run an audited pipeline before submitting a paper order.",
      primaryActionLabel: canRebindLatestRun ? "Load latest audited run" : "Run audited pipeline",
      primaryActionId: canRebindLatestRun ? "submit-paper-order" : "run-pipeline",
      primaryActionTargetWorkspaceId: canRebindLatestRun ? targetWorkspaceId : "research",
      canSubmitPaperOrder: false,
      canRebindLatestRun,
      targetWorkspaceId,
      gates: [
        {
          id: "audited-run",
          label: "Audited run",
          value: latestRunId || binding?.runId || "missing",
          detail: canRebindLatestRun
            ? "Latest Golden Path run can be rebound into the current workspace."
            : binding?.detail || "No matching audited run is bound to the current workspace.",
          status: canRebindLatestRun ? "review" : "blocked",
          tone: canRebindLatestRun ? "warning" : "risk"
        },
        buildP0PaperExecutionRiskGate(riskApproval, riskHeadline, riskSummary, false),
        buildP0PaperExecutionGate("blocked"),
        buildP0PaperExecutionLiveBoundaryGate(liveTradingAllowed, "Live routing remains blocked while paper execution is prepared.")
      ]
    };
  }

  if (!riskIsReady) {
    const firstBlockedGate = riskApproval?.gates.find((gate) => gate.status === "blocked");
    return {
      state: "blocked",
      headline: "Risk approval required",
      detail: firstBlockedGate?.detail || riskSummary,
      primaryActionLabel: "Review risk gates",
      primaryActionId: null,
      primaryActionTargetWorkspaceId: targetWorkspaceId,
      canSubmitPaperOrder: false,
      canRebindLatestRun: false,
      targetWorkspaceId,
      gates: [
        {
          id: "audited-run",
          label: "Audited run",
          value: binding?.runId || latestRunId || "bound",
          detail: binding?.detail || "Matching audited run is bound to the current workspace.",
          status: "passed",
          tone: "positive"
        },
        buildP0PaperExecutionRiskGate(riskApproval, riskHeadline, riskSummary, false),
        buildP0PaperExecutionGate("blocked"),
        buildP0PaperExecutionLiveBoundaryGate(liveTradingAllowed, "Live routing remains blocked while risk gates are reviewed.")
      ]
    };
  }

  return {
    state: "ready",
    headline: "Paper order ready",
    detail: riskSummary,
    primaryActionLabel: "Submit paper order",
    primaryActionId: "submit-paper-order",
    primaryActionTargetWorkspaceId: targetWorkspaceId,
    canSubmitPaperOrder: true,
    canRebindLatestRun: false,
    targetWorkspaceId,
    gates: [
      {
        id: "audited-run",
        label: "Audited run",
        value: binding?.runId || latestRunId || "bound",
        detail: binding?.detail || "Matching audited run is bound to the current workspace.",
        status: "passed",
        tone: "positive"
      },
      buildP0PaperExecutionRiskGate(riskApproval, riskHeadline, riskSummary, true),
      buildP0PaperExecutionGate("review"),
      buildP0PaperExecutionLiveBoundaryGate(liveTradingAllowed, "Paper route can stage; live routing still requires explicit gate approval.")
    ]
  };
}

export function buildP0PlatformActionOutcomeEvidenceLink(
  outcome: P0PlatformActionOutcome | null | undefined
): P0PlatformActionOutcomeEvidenceLink | null {
  const evidenceId = outcome?.evidenceId?.trim() ?? "";
  if (!outcome || !evidenceId) {
    return null;
  }

  const searchParams = new URLSearchParams();
  if (outcome.state === "paper_execution") {
    searchParams.set("workspace", "execution");
    searchParams.set("paperExecution", evidenceId);
    if (outcome.runId?.trim()) {
      searchParams.set("runId", outcome.runId.trim());
    }
    return {
      evidenceId,
      label: "Paper execution evidence link",
      search: searchParams.toString(),
      targetWorkspaceId: "execution"
    };
  }

  if (outcome.state === "audit_run" || outcome.state === "live_ready") {
    const runId = outcome.runId?.trim() || evidenceId;
    searchParams.set("workspace", "audit");
    searchParams.set("runId", runId);
    searchParams.set("exportPath", `manifest:${runId}`);
    return {
      evidenceId,
      label: "Audit evidence link",
      search: searchParams.toString(),
      targetWorkspaceId: "audit"
    };
  }

  return null;
}

export function buildP0PaperExecutionRiskGate(
  riskApproval: RiskApprovalSummary | null,
  fallbackHeadline: string,
  fallbackSummary: string,
  ready: boolean
): P0PaperExecutionPreflightGate {
  return {
    id: "risk-approval",
    label: "Risk approval",
    value: riskApproval?.headline || fallbackHeadline,
    detail: riskApproval?.summary || fallbackSummary,
    status: ready ? "passed" : "blocked",
    tone: ready ? "positive" : "risk"
  };
}

export function buildP0PaperExecutionGate(status: "blocked" | "review"): P0PaperExecutionPreflightGate {
  return {
    id: "paper-execution",
    label: "Paper execution",
    value: status === "review" ? "ready to submit" : "not recorded",
    detail:
      status === "review"
        ? "Paper order can be submitted after the operator confirms this paper-only route."
        : "Paper order has not been submitted for the latest audited run.",
    status,
    tone: status === "review" ? "warning" : "risk"
  };
}

export function buildP0PaperExecutionLiveBoundaryGate(
  liveTradingAllowed: boolean,
  detail: string
): P0PaperExecutionPreflightGate {
  return {
    id: "live-boundary",
    label: "Live boundary",
    value: liveTradingAllowed ? "live gate open" : "paper only",
    detail: liveTradingAllowed
      ? "Golden Path reports live gates open; require explicit human confirmation before routing capital."
      : detail,
    status: liveTradingAllowed ? "passed" : "review",
    tone: liveTradingAllowed ? "positive" : "warning"
  };
}

export function buildP0PlatformReadinessReportMarkdown(input: P0PlatformReadinessReportInput): string {
  const generatedAt = input.generatedAt?.trim() || new Date().toISOString();
  const currentGap = input.summary.currentGap;
  const currentGapLinkLine = buildP0CurrentGapReportLinkLine(input, generatedAt);
  const backlogLines = input.backlogItems.length
    ? input.backlogItems.map((item, index) => {
        return `${index + 1}. [${item.priority}] ${item.label} (${item.status}) - ${p0ReportText(item.detail)}${p0ReadinessGapActionReportText(item)}`;
      })
    : ["No open P0 gaps in the current Golden Path status."];
  const evidenceLink = input.evidenceLink?.search?.trim()
    ? `- Evidence link: ${input.evidenceLink.search.trim()}`
    : "- Evidence link: not available yet";
  const paperPreflightLines = buildP0PaperExecutionPreflightReportLines(input.paperPreflight);

  return [
    "# P0 Platform Readiness Report",
    "",
    `- Generated at: ${generatedAt}`,
    `- State: ${input.summary.headline}`,
    `- Progress: ${input.summary.passedSteps}/${input.summary.totalSteps} steps passed (${input.summary.progressPct}%)`,
    buildP0BacklogReadinessReportLine(input.backlogItems),
    `- Open gaps: ${input.summary.openStepCount}`,
    `- Review steps: ${input.summary.reviewSteps}`,
    `- Blocked steps: ${input.summary.blockedSteps}`,
    currentGap
      ? `- Current gap: ${currentGap.label} - ${p0ReportText(currentGap.detail)}${p0ReadinessGapActionReportText(currentGap)}`
      : "- Current gap: none",
    ...(currentGapLinkLine ? [currentGapLinkLine] : []),
    `- Live boundary: ${input.summary.liveBoundary.label} - ${p0ReportText(input.summary.liveBoundary.detail)}`,
    ...buildP0CompletionChecklistReportLines(input.completionChecklist),
    "",
    "## Open P0 Gaps",
    "",
    ...backlogLines,
    "",
    "## Latest Evidence",
    "",
    `- Evidence: ${input.outcome.label} - ${p0ReportText(input.outcome.detail)}`,
    `- Next step: ${p0ReportText(input.outcome.nextStep)}`,
    evidenceLink,
    ...paperPreflightLines,
    "",
    "This report is an audit aid only. It does not authorize live trading or provide investment advice."
  ].join("\n");
}

export function buildP0CompletionChecklistReportLines(
  checklist: P0CompletionChecklist | null | undefined
): string[] {
  if (!checklist) {
    return [];
  }
  const currentGapLine = checklist.currentGap
    ? `- Current completion gap: ${checklist.currentGap.label} (${checklist.currentGap.status}) - ${p0ReportText(checklist.currentGap.detail)}`
    : "- Current completion gap: none";
  return [
    "",
    "## P0 Completion Checklist",
    "",
    `- Completion: ${checklist.passed}/${checklist.total} passed, ${checklist.review} review, ${checklist.blocked} blocked.`,
    currentGapLine,
    "",
    ...checklist.criteria.map((criterion, index) => {
      const action = criterion.actionLabel
        ? ` Next: ${p0ReportText(criterion.actionLabel)} -> ${criterion.targetWorkspaceId}.`
        : "";
      return `${index + 1}. ${criterion.label} [${criterion.status}] - ${p0ReportSentence(criterion.detail)} Evidence: ${p0ReportSentence(criterion.evidence)}${action}`;
    })
  ];
}

export function p0ReportSentence(value: string | null | undefined): string {
  const text = p0ReportText(value);
  return /[.!?。！？]$/u.test(text) ? text : `${text}.`;
}

export function buildP0BacklogReadinessReportLine(backlogItems: readonly P0PlatformBacklogItem[]): string {
  const readiness = backlogItems.map((item) =>
    buildP0CurrentGapActionReadiness({
      actionId: item.actionId,
      targetWorkspaceId: auditReportLedgerProductWorkAreaId((item.targetWorkspaceId ?? item.workspaceId ?? "").trim()),
      workspaceId: auditReportLedgerProductWorkAreaId((item.workspaceId ?? "").trim())
    })
  );
  const total = backlogItems.length;
  const executable = readiness.filter((item) => item.canExecute).length;
  const notExecutable = Math.max(0, total - executable);
  const firstReadiness = readiness[0] ?? null;
  const firstAction =
    firstReadiness?.executableActionId ||
    backlogItems[0]?.actionId?.trim() ||
    firstReadiness?.reason ||
    "none";
  const firstReason = firstReadiness?.reason ?? "none";
  return `- Backlog readiness: ${executable}/${total} executable, ${notExecutable} not executable. First: ${firstAction} ${firstReason}.`;
}

export function buildP0CurrentGapReportLinkLine(
  input: P0PlatformReadinessReportInput,
  generatedAt: string
): string | null {
  const gap = input.summary.currentGap;
  const actionId = gap?.actionId?.trim() ?? "";
  const targetWorkspaceId = auditReportLedgerProductWorkAreaId((gap?.targetWorkspaceId ?? gap?.workspaceId ?? "").trim());
  if (!gap || !actionId || !targetWorkspaceId) {
    return null;
  }
  const evidenceToken = input.outcome.runId?.trim() || input.outcome.evidenceId?.trim() || generatedAt;
  const query = ["p0_readiness_report", evidenceToken, actionId, targetWorkspaceId].filter(Boolean).join(" ");
  const params = new URLSearchParams();
  params.set("workspace", targetWorkspaceId);
  params.set("auditReportQuery", query);
  params.set("p0Action", actionId);
  const search = buildP0CurrentGapActionUrlSearch(params);
  return search ? `- Current gap link: ${search}` : null;
}

export function p0ReadinessGapActionReportText(gap: P0PlatformReadinessGap): string {
  const action = gap.actionLabel?.trim() || "No direct action";
  const workspace = gap.targetWorkspaceId || gap.workspaceId;
  const targetWorkspaceId = auditReportLedgerProductWorkAreaId((gap.targetWorkspaceId ?? gap.workspaceId ?? "").trim());
  const workspaceId = auditReportLedgerProductWorkAreaId((gap.workspaceId ?? "").trim());
  const readiness = buildP0CurrentGapActionReadiness({
    actionId: gap.actionId,
    targetWorkspaceId,
    workspaceId
  });
  const executableText = readiness.canExecute
    ? `yes (${readiness.executableActionId})`
    : `no (${readiness.reason})`;
  return ` Action: ${p0ReportText(action)}. Workspace: ${workspace}. Executable: ${executableText}.`;
}

export function buildP0PaperExecutionPreflightReportLines(
  preflight: P0PaperExecutionPreflight | null | undefined
): string[] {
  if (!preflight) {
    return [];
  }
  const primaryAction = preflight.primaryActionId
    ? `${preflight.primaryActionLabel} (${preflight.primaryActionId} -> ${preflight.primaryActionTargetWorkspaceId})`
    : `${preflight.primaryActionLabel} (review -> ${preflight.primaryActionTargetWorkspaceId})`;
  return [
    "",
    "## Paper Execution Preflight",
    "",
    `- State: ${preflight.state}`,
    `- Primary action: ${p0ReportText(primaryAction)}`,
    "",
    ...preflight.gates.map(
      (gate, index) =>
        `${index + 1}. ${gate.label} [${gate.status}] - ${p0ReportText(gate.value)} - ${p0ReportText(gate.detail)}`
    )
  ];
}

export function p0PlatformBacklogPriority(item: GoldenPathRunbookSourceItem): P0PlatformBacklogPriority {
  if (item.current) {
    return "current";
  }
  return item.status === "review" ? "review" : "blocked";
}

export const p0GoldenPathJourneyDefinitions: readonly {
  id: P0GoldenPathJourneyStepId;
  label: string;
  workspaceId: ProductWorkAreaId;
  criteria: readonly P0CompletionCriterionId[];
  runbookKeys: readonly string[];
  detail: string;
}[] = [
  {
    id: "data",
    label: "Data readiness",
    workspaceId: "market",
    criteria: ["data-quality"],
    runbookKeys: ["market-data", "data-quality", "watchlist-cache"],
    detail: "Prepare A-share data and cache evidence."
  },
  {
    id: "strategy",
    label: "Strategy draft",
    workspaceId: "strategy",
    criteria: ["strategy-versioning"],
    runbookKeys: ["strategy-config", "strategy-version", "strategy"],
    detail: "Save a structured strategy version."
  },
  {
    id: "backtest",
    label: "Audited backtest",
    workspaceId: "backtest",
    criteria: ["audited-backtest"],
    runbookKeys: ["backtest-report", "audited-backtest", "research-run"],
    detail: "Run an audited backtest and bind a run id."
  },
  {
    id: "ai-review",
    label: "AI review",
    workspaceId: "ai-review",
    criteria: ["ai-evidence"],
    runbookKeys: ["ai-review", "agent-review"],
    detail: "Run an evidence-bound AI review."
  },
  {
    id: "paper-simulation",
    label: "Paper simulation",
    workspaceId: "execution",
    criteria: ["paper-execution"],
    runbookKeys: ["paper-execution", "paper-order", "paper-simulation"],
    detail: "Submit a paper-only simulated order."
  },
  {
    id: "replay",
    label: "Replay",
    workspaceId: "execution",
    criteria: ["replay"],
    runbookKeys: ["replay", "paper-replay", "account-replay"],
    detail: "Replay cash, position, and order state."
  },
  {
    id: "export",
    label: "Export package",
    workspaceId: "audit",
    criteria: ["export-import"],
    runbookKeys: ["export-import", "export", "package"],
    detail: "Export or verify the portable P0 evidence package."
  }
];

export function p0GoldenPathRunbookItem(
  runbook: readonly GoldenPathRunbookSourceItem[],
  keys: readonly string[]
): GoldenPathRunbookSourceItem | null {
  return (
    runbook.find((item) => keys.some((key) => item.stepId === key || item.stepId.includes(key))) ??
    runbook.find((item) => keys.some((key) => item.label.toLowerCase().includes(key.replaceAll("-", " ")))) ??
    null
  );
}

export function p0GoldenPathStepHasEvidence(
  stepId: P0GoldenPathJourneyStepId,
  source: P0GoldenPathJourneyInput
): boolean {
  if (stepId === "paper-simulation") {
    return source.paperPreflight?.state === "recorded" || source.outcome?.state === "paper_execution";
  }
  if (stepId === "backtest") {
    return source.outcome?.state === "audit_run" || source.outcome?.state === "paper_execution" || Boolean(source.outcome?.runId);
  }
  return false;
}

export function p0GoldenPathStepEvidenceId(
  stepId: P0GoldenPathJourneyStepId,
  source: P0GoldenPathJourneyInput
): string {
  if (stepId === "paper-simulation") {
    return source.outcome?.evidenceId?.trim() || "";
  }
  if (stepId === "backtest" || stepId === "ai-review") {
    return source.outcome?.runId?.trim() || source.goldenPath?.latestRunId?.trim() || "";
  }
  return "";
}

export function p0GoldenPathSummaryComplete(
  goldenPath: P0PlatformReadinessSource | null | undefined,
  summary: P0PlatformReadinessSummary | null | undefined
): boolean {
  const totalSteps = Math.max(summary?.totalSteps ?? goldenPath?.summary?.totalSteps ?? 0, 0);
  const passedSteps = Math.max(summary?.passedSteps ?? goldenPath?.summary?.passedSteps ?? 0, 0);
  const blockedSteps = Math.max(summary?.blockedSteps ?? goldenPath?.summary?.blockedSteps ?? 0, 0);
  const reviewSteps = Math.max(summary?.reviewSteps ?? goldenPath?.summary?.reviewSteps ?? 0, 0);
  return totalSteps > 0 && passedSteps >= totalSteps && blockedSteps === 0 && reviewSteps === 0;
}

export function p0GoldenPathNextActionIdForStep(
  stepId: P0GoldenPathJourneyStepId,
  source: P0GoldenPathJourneyInput
): string {
  const nextAction = source.goldenPath?.nextAction;
  if (!nextAction?.id) {
    return "";
  }
  const targetWorkspaceId = auditReportLedgerProductWorkAreaId(nextAction.targetWorkspace?.trim() ?? "");
  const definition = p0GoldenPathJourneyDefinitions.find((item) => item.id === stepId);
  return targetWorkspaceId && definition?.workspaceId === targetWorkspaceId ? nextAction.id.trim() : "";
}

export function p0GoldenPathActionTargetWorkspaceId(
  value: string | null | undefined,
  fallback: ProductWorkAreaId
): ProductWorkAreaId {
  return auditReportLedgerProductWorkAreaId(value?.trim() ?? "") ?? fallback;
}

export function p0GoldenPathJourneyStepState(input: {
  currentIndex: number;
  hasAction: boolean;
  index: number;
  passed: boolean;
}): P0GoldenPathJourneyStepState {
  if (input.index === input.currentIndex) {
    return "current";
  }
  if (input.passed) {
    return "done";
  }
  return input.hasAction ? "ready" : "blocked";
}

export function p0PlatformBacklogPriorityRank(priority: P0PlatformBacklogPriority): number {
  return (
    {
      current: 0,
      blocked: 1,
      review: 2
    } satisfies Record<P0PlatformBacklogPriority, number>
  )[priority];
}

export function resolveP0PlatformReadinessState(input: {
  blockedSteps: number;
  goldenPathStatus?: P0PlatformReadinessSource["status"];
  liveTradingAllowed: boolean;
  reviewSteps: number;
  totalSteps: number;
  passedSteps: number;
}): P0PlatformReadinessState {
  if (input.totalSteps <= 0) {
    return "unknown";
  }
  if (input.passedSteps >= input.totalSteps && input.blockedSteps === 0 && input.reviewSteps === 0) {
    return input.liveTradingAllowed ? "live_ready" : "paper_ready";
  }
  if (input.blockedSteps > 0 || input.goldenPathStatus === "blocked") {
    return "blocked";
  }
  if (input.reviewSteps > 0 || input.goldenPathStatus === "review") {
    return "review";
  }
  return "blocked";
}

export function p0PlatformReadinessHeadline(state: P0PlatformReadinessState): string {
  return (
    {
      blocked: "P0 golden path blocked",
      live_ready: "P0 live workflow ready",
      paper_ready: "P0 paper workflow ready",
      review: "P0 golden path needs review",
      unknown: "Waiting for P0 readiness evidence"
    } satisfies Record<P0PlatformReadinessState, string>
  )[state];
}

export function p0PlatformReadinessDetail(
  state: P0PlatformReadinessState,
  context: {
    currentGap: P0PlatformReadinessGap | null;
    passedSteps: number;
    totalSteps: number;
  }
): string {
  if (state === "unknown") {
    return "Golden path status is not loaded yet.";
  }
  const progress = `${context.passedSteps}/${context.totalSteps} P0 steps passed`;
  if (state === "paper_ready") {
    return `${progress} · paper workflow ready · live trading remains blocked`;
  }
  if (state === "live_ready") {
    return `${progress} · live gates reported ready`;
  }
  const gap = context.currentGap?.label ?? "Evidence";
  const action = context.currentGap?.actionLabel?.trim();
  const workspace = context.currentGap?.targetWorkspaceId || context.currentGap?.workspaceId;
  const actionDetail = action && workspace ? ` · action: ${action} -> ${workspace}` : "";
  return `${progress} · current gap: ${gap}${actionDetail}`;
}

export function p0ReportText(value: string | null | undefined): string {
  return value?.trim() || "n/a";
}

export function resolveProductWorkAreaSelection(
  workspace: TerminalWorkspace,
  requestedAreaId: string,
  fallbackAreaId: ProductWorkAreaId = "research"
): ProductWorkAreaSelection {
  const areas = buildProductWorkAreas(workspace);
  const requestedArea = areas.find((area) => area.id === requestedAreaId);
  const fallbackArea = areas.find((area) => area.id === fallbackAreaId) ?? areas[0];
  const selectedArea = requestedArea ?? fallbackArea;

  return {
    areaId: selectedArea.id,
    quantLoopStepId: selectedArea.quantLoopStepId,
    workflowStageId: selectedArea.workflowStageId
  };
}

export function productWorkAreaStatus(
  areaId: ProductWorkAreaId,
  hasAuditedRun: boolean,
  workspace: TerminalWorkspace
): ProductWorkAreaStatus {
  if (areaId === "execution" || areaId === "dynamic-trading") {
    return hasAuditedRun ? "ready" : "blocked";
  }
  if (areaId === "portfolio" || areaId === "ai-review" || areaId === "audit") {
    return hasAuditedRun ? "ready" : "needs_run";
  }
  if (areaId === "backtest") {
    return workspace.metrics.some((metric) => metric.value !== "N/A" && metric.value !== "0") ? "ready" : "needs_run";
  }
  return "ready";
}

export function resolveQuantLoopSelection(
  workspace: TerminalWorkspace,
  requestedStepId: string,
  fallbackStepId = activeQuantLoopStepId(workspace)
): QuantLoopSelection {
  const supportedStepIds = new Set<string>(primaryQuantLoopStepDefinitions.map((step) => step.id));
  const supportedSteps = workspace.quantLoop.filter((step) => supportedStepIds.has(step.id));
  const requestedStep = supportedSteps.find((step) => step.id === requestedStepId);
  const fallbackStep = supportedSteps.find((step) => step.id === fallbackStepId && step.status !== "locked");
  const selectedStep =
    requestedStep && requestedStep.status !== "locked"
      ? requestedStep
      : fallbackStep ?? supportedSteps.find((step) => step.status !== "locked");
  const stepId = selectedStep?.id ?? "research";

  return {
    stepId,
    target: buildQuantLoopNavigationTarget(stepId)
  };
}

export function visiblePanels(workspace: TerminalWorkspace): PanelId[] {
  return workspace.panels.filter((panel) => panel.visible).map((panel) => panel.id);
}

export function agentRoleLabels(workspace: TerminalWorkspace): string[] {
  return workspace.agents.map((agent) => agent.label);
}

export function buildAgentCommitteeRounds(workspace: TerminalWorkspace): AgentCommitteeRound[] {
  const returnMetric = workspace.metrics.find((metric) => metric.label === "Return")?.value ?? "N/A";
  const drawdownMetric = workspace.metrics.find((metric) => metric.label === "Max DD")?.value ?? "N/A";
  const technicalNote = findDecisionMessage(workspace, "Technical");
  const riskNote = findDecisionMessage(workspace, "Risk");
  const portfolioNote = findDecisionMessage(workspace, "Portfolio Manager");
  const auditBinding = buildResearchRunContextBinding(workspace);
  const usableRun = auditBinding.canUseRun ? workspace.researchRun : null;

  return [
    {
      id: "technical-analysis",
      phase: "analysis",
      agent: "Technical Analyst",
      thesis: technicalNote,
      evidence: `${workspace.selectedInstrument.symbol} · ${workspace.selectedTimeframe} · Return ${returnMetric} · Max DD ${drawdownMetric}`,
      verdict: returnMetric.startsWith("+") ? "support" : "challenge",
      confidence: returnMetric.startsWith("+") ? 64 : 52,
      tone: returnMetric.startsWith("+") ? "positive" : "warning"
    },
    {
      id: "bull-research",
      phase: "debate",
      agent: "Bull Researcher",
      thesis: `Bull case requires ${workspace.strategy.entry}.`,
      evidence: `Position rule: ${workspace.strategy.position}.`,
      verdict: "support",
      confidence: 58,
      tone: "positive"
    },
    {
      id: "bear-research",
      phase: "debate",
      agent: "Bear Researcher",
      thesis: `Bear case challenges the setup if ${workspace.strategy.exit}.`,
      evidence: `Risk rule: ${workspace.strategy.risk}.`,
      verdict: "challenge",
      confidence: 55,
      tone: "warning"
    },
    {
      id: "risk-manager",
      phase: "risk",
      agent: "Risk Manager",
      thesis: riskNote,
      evidence: workspace.execution.gates.map((gate) => `${gate.label}: ${gate.passed ? "passed" : "blocked"}`).join(" · "),
      verdict: "risk",
      confidence: workspace.execution.liveEnabled ? 48 : 82,
      tone: "risk"
    },
    {
      id: "portfolio-decision",
      phase: "decision",
      agent: "Portfolio Manager",
      thesis: portfolioNote,
      evidence: usableRun
        ? `Audited run ${usableRun.runId} · ${usableRun.dataRows} bars`
        : auditBinding.status === "mismatched"
          ? auditBinding.detail
          : "No audited run is bound to this research context yet.",
      verdict: "watch",
      confidence: usableRun ? 66 : 60,
      tone: "ai"
    }
  ];
}
