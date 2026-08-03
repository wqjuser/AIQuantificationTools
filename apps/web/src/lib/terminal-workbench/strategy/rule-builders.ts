import type { ResearchRunAudit, TerminalWorkspace } from "../core/workspace-contracts";
import { strategyEntryParameter, strategyExitParameter } from "../core/workspace-operations";
import type { ExecutionAdapterChainHealthRollup, OperatorRunbookControls, OperatorRunbookInput, OperatorRunbookSection, OperatorRunbookSectionStatus, OperatorRunbookStatus, OperatorRunbookSummary, OperatorRunbookTone, PreLiveReadinessChecklist, PreLiveReadinessChecklistInput, PreLiveReadinessChecklistItem, PreLiveReadinessChecklistStatus, PromotionQueueStage, PromotionReadiness } from "../execution/ops-contracts";
import type { PaperExecutionReplayGate } from "../portfolio/paper-contracts";
import type { P2PreLiveAcceptanceSummary } from "../stage1/foundation-contracts";
import type { StrategyGovernanceQueue, StrategyGovernanceQueueActionId, StrategyGovernanceQueueRow, StrategyGovernanceQueueStage, StrategyLibraryDraftItem, StrategyReadinessGate, StrategyRuleRow, StrategySnapshot, StrategyVersionDiffRow } from "../stage1/review-contracts";
import { formatPercentValue, isPendingStrategyText } from "./backtest-builders";
import { buildResearchRunContextBinding, buildStrategyGovernanceQueueSummary, buildStrategyRuleDraft, normalizeDiffValue, strategyContextLabel, strategyGovernanceDetail, strategyGovernanceQueueSort } from "./experiment-builders";

export function buildPreLiveReadinessChecklist(
  readiness: PromotionReadiness,
  input: PreLiveReadinessChecklistInput = {}
): PreLiveReadinessChecklist {
  const items: PreLiveReadinessChecklistItem[] = readiness.stages.map((stage) => ({
    id: stage.id,
    label: stage.label,
    state: stage.status,
    tone: stage.tone,
    evidence: stage.value,
    detail: stage.detail
  }));
  if (input.paperExecutionReplayGate) {
    items.push(buildPaperExecutionReplayChecklistItem(input.paperExecutionReplayGate));
  }
  const totalCount = items.length;
  const passedCount = items.filter((item) => item.state === "passed").length;
  const blockingCount = items.filter((item) => item.state !== "passed").length;
  const nextAction = items.find((item) => item.state !== "passed") ?? null;
  const adapterStage = items.find((item) => item.id === "adapter-certification");
  const humanStage = items.find((item) => item.id === "human-confirmation");
  const replayStage = items.find((item) => item.id === "paper-execution-replay");

  let status: PreLiveReadinessChecklistStatus;
  let tone: PreLiveReadinessChecklist["tone"];
  let headline: string;
  if (readiness.status === "live_ready" && blockingCount === 0) {
    status = "manual_route_ready";
    tone = "positive";
    headline = "Pre-live checklist complete";
  } else if (readiness.status === "paper_pending") {
    status = "paper_pending";
    tone = "warning";
    headline = "Pre-live paper evidence pending";
  } else if (replayStage && replayStage.state !== "passed" && passedCount > 0) {
    status = "evidence_pending";
    tone = "warning";
    headline = "Pre-live replay evidence pending";
  } else if (adapterStage?.state === "passed" && humanStage?.state !== "passed") {
    status = "operator_pending";
    tone = "warning";
    headline = "Pre-live operator confirmation pending";
  } else if (passedCount > 0) {
    status = "evidence_pending";
    tone = "warning";
    headline = "Pre-live evidence pending";
  } else {
    status = "blocked";
    tone = "risk";
    headline = "Pre-live readiness blocked";
  }

  const nextActionLabel = nextAction ? `${nextAction.id}: ${nextAction.evidence}` : "manual route review only";
  const summary =
    status === "manual_route_ready"
      ? `${passedCount}/${totalCount} gates passed; ready for manual route review only. Direct order submission remains disabled.`
      : `${passedCount}/${totalCount} gates passed; next action ${nextActionLabel}. Direct order submission remains disabled.`;

  return {
    status,
    tone,
    headline,
    summary,
    passedCount,
    totalCount,
    blockingCount,
    nextActionId: nextAction?.id ?? null,
    manualRouteCandidate: status === "manual_route_ready",
    orderSubmissionEnabled: false,
    liveTradingAllowed: false,
    items
  };
}

export function buildPaperExecutionReplayChecklistItem(gate: PaperExecutionReplayGate): PreLiveReadinessChecklistItem {
  const passed = gate.status === "replay_ready";
  const state: PromotionQueueStage["status"] = passed ? "passed" : gate.status === "partial" ? "review" : "blocked";
  const evidence =
    gate.status === "replay_ready"
      ? "Paper replay ready"
      : gate.status === "stale"
        ? "Paper replay stale"
        : gate.status === "partial"
          ? "Paper replay incomplete"
          : "Paper replay blocked";
  const latestEvidence = gate.latestEvidenceId ? ` Latest evidence: ${gate.latestEvidenceId}.` : "";
  return {
    id: "paper-execution-replay",
    label: "Paper execution replay",
    state,
    tone: gate.tone === "positive" ? "positive" : gate.tone === "warning" ? "warning" : "risk",
    evidence,
    detail: `${gate.detail} Replay checks ${gate.passedCount}/${gate.totalCount}.${latestEvidence}`
  };
}

export function buildOperatorRunbookSummary(input: OperatorRunbookInput): OperatorRunbookSummary {
  const chainRollups = input.adapterChainHealthRollups ?? [];
  const primaryChain =
    chainRollups.find((rollup) => rollup.status === "paper_ready") ??
    chainRollups.find((rollup) => rollup.status === "blocked") ??
    chainRollups[0] ??
    null;
  const adapterId = primaryChain?.adapterId ?? input.p2PreLiveAcceptance.adapterId ?? "adapter-unselected";
  const contextLabel = [
    input.workspace.selectedInstrument.market,
    input.workspace.selectedInstrument.symbol,
    input.workspace.selectedTimeframe
  ].join(" ");
  const controls: OperatorRunbookControls = {
    killSwitch: input.killSwitch?.trim() || "Disable execution route and keep adapters in paper-only mode",
    rollbackOwner: input.rollbackOwner?.trim() || "operator",
    positionLimit: `${Math.max(0, input.maxPositionPct ?? 20)}% max position per instrument`,
    dataFreshness: operatorRunbookDataFreshness(input.workspace),
    auditPackage: input.p2PreLiveAcceptance.sourcePath || "data/p2-pre-live-acceptance.json",
    environmentState: operatorRunbookEnvironmentState(primaryChain)
  };
  const sections: OperatorRunbookSection[] = [
    operatorRunbookChecklistSection(input.preLiveChecklist),
    operatorRunbookReplaySection(input.paperExecutionReplayGate),
    operatorRunbookAdapterChainSection(primaryChain),
    operatorRunbookP2AcceptanceSection(input.p2PreLiveAcceptance),
    operatorRunbookSafetyBoundarySection(input)
  ];
  const completedSections = sections.filter((section) => section.status === "passed").length;
  const blocker = sections.find((section) => section.status === "blocked") ?? null;
  const review = sections.find((section) => section.status === "review") ?? null;
  const next = blocker ?? review;
  const status: OperatorRunbookStatus = blocker ? "blocked" : review ? "review_pending" : "manual_review_ready";
  const tone: OperatorRunbookTone = status === "manual_review_ready" ? "positive" : status === "review_pending" ? "warning" : "risk";

  return {
    status,
    tone,
    headline:
      status === "manual_review_ready"
        ? "Operator runbook ready for manual review"
        : status === "review_pending"
          ? "Operator runbook pending review"
          : "Operator runbook blocked",
    summary:
      status === "manual_review_ready"
        ? "All operator runbook sections are aligned for manual pre-live review only; live trading remains blocked."
        : `${completedSections}/${sections.length} operator runbook sections passed; ${next?.label ?? "operator review"} is next.`,
    contextLabel,
    adapterId,
    completedSections,
    totalSections: sections.length,
    nextActionId: next?.id ?? null,
    nextAction: next ? `Resolve ${next.label}: ${next.nextAction}` : "Record or review the operator runbook before any separate live-route enablement.",
    controls,
    sections,
    orderSubmissionEnabled: false,
    liveTradingAllowed: false,
    liveOrderSubmitted: false,
    routeExecuted: false
  };
}

export function buildOperatorRunbookMarkdown(runbook: OperatorRunbookSummary): string {
  const lines = [
    "# Operator Runbook",
    "",
    `Status: ${runbook.status}`,
    `Context: ${runbook.contextLabel}`,
    `Adapter: ${runbook.adapterId}`,
    `Progress: ${runbook.completedSections}/${runbook.totalSections}`,
    `Next action: ${runbook.nextAction}`,
    "",
    "## Controls",
    `- Kill switch: ${runbook.controls.killSwitch}`,
    `- Rollback owner: ${runbook.controls.rollbackOwner}`,
    `- Position limit: ${runbook.controls.positionLimit}`,
    `- Data freshness: ${runbook.controls.dataFreshness}`,
    `- Environment state: ${runbook.controls.environmentState}`,
    `- Audit package: ${runbook.controls.auditPackage}`,
    "",
    "## Safety Boundary",
    `- orderSubmissionEnabled=${runbook.orderSubmissionEnabled}`,
    `- liveTradingAllowed=${runbook.liveTradingAllowed}`,
    `- liveOrderSubmitted=${runbook.liveOrderSubmitted}`,
    `- routeExecuted=${runbook.routeExecuted}`,
    "",
    "## Sections",
    ...runbook.sections.flatMap((section) => [
      `- ${section.id}: ${section.status} · ${section.evidence}`,
      `  - ${section.detail}`,
      `  - Next: ${section.nextAction}`
    ])
  ];
  return lines.join("\n");
}

export function operatorRunbookChecklistSection(checklist: PreLiveReadinessChecklist): OperatorRunbookSection {
  const passed = checklist.status === "manual_route_ready" && checklist.manualRouteCandidate && checklist.blockingCount === 0;
  const status: OperatorRunbookSectionStatus = passed ? "passed" : checklist.passedCount > 0 ? "review" : "blocked";
  return {
    id: "pre-live-checklist",
    label: "Pre-live checklist",
    status,
    evidence: `${checklist.passedCount}/${checklist.totalCount} gates`,
    detail: checklist.summary,
    nextAction: checklist.nextActionId ? `Complete ${checklist.nextActionId}` : "Keep checklist evidence attached to the runbook.",
    tone: operatorRunbookSectionTone(status)
  };
}

export function operatorRunbookReplaySection(gate: PaperExecutionReplayGate): OperatorRunbookSection {
  const status: OperatorRunbookSectionStatus =
    gate.status === "replay_ready" ? "passed" : gate.status === "partial" ? "review" : "blocked";
  return {
    id: "paper-execution-replay",
    label: "Paper execution replay",
    status,
    evidence: `${gate.passedCount}/${gate.totalCount} replay checks`,
    detail: gate.detail,
    nextAction: gate.currentBlockerLabel ? `Resolve ${gate.currentBlockerLabel}` : "Keep replay evidence aligned with the current run.",
    tone: operatorRunbookSectionTone(status)
  };
}

export function operatorRunbookAdapterChainSection(
  chain: ExecutionAdapterChainHealthRollup | null
): OperatorRunbookSection {
  if (!chain) {
    return {
      id: "adapter-chain",
      label: "Adapter chain",
      status: "blocked",
      evidence: "no adapter chain",
      detail: "No adapter chain health rollup is available.",
      nextAction: "Record adapter chain evidence from secret reference through paper execution.",
      tone: "risk"
    };
  }
  const status: OperatorRunbookSectionStatus =
    chain.status === "paper_ready" ? "passed" : chain.status === "in_progress" ? "review" : "blocked";
  return {
    id: "adapter-chain",
    label: "Adapter chain",
    status,
    evidence: `${chain.completedStageCount}/${chain.totalStageCount} stages`,
    detail: chain.detail,
    nextAction: chain.blockerLabel ? `Resolve ${chain.blockerLabel}` : "Keep adapter chain evidence available for audit.",
    tone: operatorRunbookSectionTone(status)
  };
}

export function operatorRunbookP2AcceptanceSection(acceptance: P2PreLiveAcceptanceSummary): OperatorRunbookSection {
  const unsafe =
    acceptance.reportedOrderSubmissionEnabled ||
    acceptance.reportedLiveTradingAllowed ||
    acceptance.reportedLiveOrderSubmitted ||
    acceptance.reportedRouteExecuted ||
    !acceptance.liveBlockedBoundary;
  const status: OperatorRunbookSectionStatus = acceptance.state === "passed" && !unsafe ? "passed" : "blocked";
  return {
    id: "p2-acceptance",
    label: "P2 acceptance",
    status,
    evidence: acceptance.state,
    detail: acceptance.detail,
    nextAction: status === "passed" ? "Keep acceptance manifest linked to this operator runbook." : acceptance.actionLabel,
    tone: operatorRunbookSectionTone(status)
  };
}

export function operatorRunbookSafetyBoundarySection(input: OperatorRunbookInput): OperatorRunbookSection {
  const chainUnsafe = (input.adapterChainHealthRollups ?? []).some(
    (rollup) => rollup.orderSubmissionEnabled || rollup.liveTradingAllowed
  );
  const unsafe =
    input.preLiveChecklist.orderSubmissionEnabled ||
    input.preLiveChecklist.liveTradingAllowed ||
    input.paperExecutionReplayGate.orderSubmissionEnabled ||
    input.paperExecutionReplayGate.liveTradingAllowed ||
    input.p2PreLiveAcceptance.reportedOrderSubmissionEnabled ||
    input.p2PreLiveAcceptance.reportedLiveTradingAllowed ||
    input.p2PreLiveAcceptance.reportedLiveOrderSubmitted ||
    input.p2PreLiveAcceptance.reportedRouteExecuted ||
    (input.p2PreLiveAcceptance.state !== "missing" && !input.p2PreLiveAcceptance.liveBlockedBoundary) ||
    chainUnsafe;
  return {
    id: "safety-boundary",
    label: "Safety boundary",
    status: unsafe ? "blocked" : "passed",
    evidence: unsafe ? "unsafe claim detected" : "live blocked",
    detail: unsafe
      ? "One or more inputs claim order submission, route execution, or live trading is enabled."
      : "Order submission, live orders, route execution, and live trading remain disabled.",
    nextAction: unsafe ? "Remove unsafe execution claims before operator review." : "Do not enable live routes in P2.",
    tone: unsafe ? "risk" : "positive"
  };
}

export function operatorRunbookSectionTone(status: OperatorRunbookSectionStatus): OperatorRunbookTone {
  if (status === "passed") {
    return "positive";
  }
  return status === "review" ? "warning" : "risk";
}

export function operatorRunbookDataFreshness(workspace: TerminalWorkspace): string {
  const quality = workspace.researchRun?.dataQuality;
  if (!quality) {
    return workspace.researchRun
      ? `${workspace.researchRun.dataRows.toLocaleString("en-US")} rows · freshness not audited`
      : "No audited research data freshness evidence";
  }
  return `${quality.source} · ${quality.rows.toLocaleString("en-US")} rows · ${
    quality.isComplete ? "complete" : "review"
  }`;
}

export function operatorRunbookEnvironmentState(chain: ExecutionAdapterChainHealthRollup | null): string {
  if (!chain) {
    return "adapter chain missing";
  }
  return `${chain.adapterId} · ${chain.status} · live blocked`;
}

export function buildStrategyRuleRows(workspace: TerminalWorkspace): StrategyRuleRow[] {
  const draft = buildStrategyRuleDraft(workspace);
  return [
    {
      id: "entry-rule",
      group: "entry",
      label: "Entry signal",
      condition: workspace.strategy.entry,
      parameter: strategyEntryParameter(workspace.strategy.entry, draft.entryWindow),
      status: isPendingStrategyText(workspace.strategy.entry) ? "pending" : "active",
      tone: isPendingStrategyText(workspace.strategy.entry) ? "warning" : "positive"
    },
    {
      id: "exit-rule",
      group: "exit",
      label: "Exit signal",
      condition: workspace.strategy.exit,
      parameter: strategyExitParameter(workspace.strategy.exit, draft.exitWindow),
      status: isPendingStrategyText(workspace.strategy.exit) ? "pending" : "active",
      tone: "warning"
    },
    {
      id: "position-rule",
      group: "position",
      label: "Position sizing",
      condition: workspace.strategy.position,
      parameter: `${formatPercentValue(draft.positionPct)}% exposure cap`,
      status: isPendingStrategyText(workspace.strategy.position) ? "pending" : "active",
      tone: isPendingStrategyText(workspace.strategy.position) ? "warning" : "neutral"
    },
    {
      id: "risk-rule",
      group: "risk",
      label: "Risk guardrail",
      condition: workspace.strategy.risk,
      parameter: "Stop / take profit / drawdown / execution mode",
      status: "guardrail",
      tone: "risk"
    }
  ];
}

export function buildStrategyReadinessGates(workspace: TerminalWorkspace): StrategyReadinessGate[] {
  const draft = buildStrategyRuleDraft(workspace);
  const schemaIsReady =
    !isPendingStrategyText(workspace.strategy.entry) &&
    !isPendingStrategyText(workspace.strategy.exit) &&
    draft.entryWindow > 0 &&
    draft.exitWindow > 0;
  const riskIsReady =
    !isPendingStrategyText(workspace.strategy.position) &&
    !isPendingStrategyText(workspace.strategy.risk) &&
    draft.positionPct > 0 &&
    draft.stopLossPct > 0 &&
    draft.takeProfitPct > 0 &&
    draft.maxDrawdownPct > 0;
  const auditBinding = buildResearchRunContextBinding(workspace);
  const hasBlockedGate = !schemaIsReady || !riskIsReady;

  return [
    schemaIsReady
      ? {
          id: "schema",
          label: "Strategy schema",
          value: `${strategyEntryParameter(workspace.strategy.entry, draft.entryWindow)} / ${strategyExitParameter(
            workspace.strategy.exit,
            draft.exitWindow
          )}`,
          detail: "Entry and exit conditions are structured.",
          status: "passed",
          tone: "positive"
        }
      : {
          id: "schema",
          label: "Strategy schema",
          value: "pending",
          detail: "Structured entry and exit rules are required before audit.",
          status: "blocked",
          tone: "risk"
        },
    riskIsReady
      ? {
          id: "risk",
          label: "Risk controls",
          value: [
            `${formatPercentValue(draft.positionPct)}%`,
            `${formatPercentValue(draft.stopLossPct)}%`,
            `${formatPercentValue(draft.takeProfitPct)}%`,
            `${formatPercentValue(draft.maxDrawdownPct)}%`
          ].join(" / "),
          detail: "Position, stop, take profit, and drawdown guards are parseable.",
          status: "passed",
          tone: "positive"
        }
      : {
          id: "risk",
          label: "Risk controls",
          value: "pending",
          detail: "Position sizing and risk guardrails must be explicit.",
          status: "blocked",
          tone: "risk"
        },
    {
      id: "execution",
      label: "Execution mode",
      value: draft.paperOnly ? "paper only" : "live gated",
      detail: "Live routing stays blocked until adapter, risk, and human gates pass.",
      status: draft.paperOnly ? "passed" : "review",
      tone: draft.paperOnly ? "positive" : "warning"
    },
    auditBinding.status === "matched"
      ? {
          id: "audit",
          label: "Audit evidence",
          value: auditBinding.runId ?? "bound",
          detail: auditBinding.detail,
          status: "passed",
          tone: "positive"
        }
      : auditBinding.status === "mismatched"
        ? {
            id: "audit",
            label: "Audit evidence",
            value: auditBinding.runId ?? "stale run",
            detail: auditBinding.detail,
            status: "blocked",
            tone: "risk"
          }
      : {
          id: "audit",
          label: "Audit evidence",
          value: hasBlockedGate ? "blocked" : "needs run",
          detail: hasBlockedGate
            ? "Fix blocked gates before running an audit pipeline."
            : "Run Pipeline to bind this draft to a reproducible audit run.",
          status: hasBlockedGate ? "blocked" : "review",
          tone: hasBlockedGate ? "risk" : "warning"
        }
  ];
}

export function mergeStrategyReadinessGatesWithLocalAudit(
  coreGates: StrategyReadinessGate[] | null | undefined,
  localGates: StrategyReadinessGate[]
): StrategyReadinessGate[] {
  if (!coreGates) {
    return localGates;
  }
  const localAuditGate = localGates.find((gate) => gate.id === "audit");
  if (!localAuditGate) {
    return coreGates;
  }
  const merged = coreGates.map((gate) => (gate.id === "audit" ? localAuditGate : gate));
  if (!merged.some((gate) => gate.id === "audit")) {
    merged.push(localAuditGate);
  }
  return merged;
}

export function buildStrategyVersionDiffRows(
  workspace: TerminalWorkspace,
  item: StrategyLibraryDraftItem
): StrategyVersionDiffRow[] {
  const rows: Array<{ id: StrategyVersionDiffRow["id"]; label: string; current: string; saved: string }> = [
    {
      id: "context",
      label: "Context",
      current: strategyContextLabel(
        workspace.selectedInstrument.market,
        workspace.selectedInstrument.symbol,
        workspace.selectedTimeframe
      ),
      saved: strategyContextLabel(item.market, item.symbol, item.timeframe)
    },
    {
      id: "name",
      label: "Name",
      current: workspace.strategy.name,
      saved: item.strategySnapshot.name
    },
    {
      id: "entry",
      label: "Entry",
      current: workspace.strategy.entry,
      saved: item.strategySnapshot.entry
    },
    {
      id: "exit",
      label: "Exit",
      current: workspace.strategy.exit,
      saved: item.strategySnapshot.exit
    },
    {
      id: "position",
      label: "Position",
      current: workspace.strategy.position,
      saved: item.strategySnapshot.position
    },
    {
      id: "risk",
      label: "Risk",
      current: workspace.strategy.risk,
      saved: item.strategySnapshot.risk
    }
  ];

  return rows.map((row) => {
    const changed = normalizeDiffValue(row.current) !== normalizeDiffValue(row.saved);
    return {
      ...row,
      changed,
      tone: changed ? "warning" : "neutral"
    };
  });
}

export function buildStrategyGovernanceQueueRows({
  workspace,
  library = [],
  runHistory = []
}: {
  workspace: TerminalWorkspace;
  library?: StrategyLibraryDraftItem[];
  runHistory?: ResearchRunAudit[];
}): StrategyGovernanceQueue {
  const currentContextLabel = strategyContextLabel(
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe
  );
  const currentValidation = buildStrategyGovernanceValidation(workspace, workspace.strategy);
  const currentAuditBinding = buildResearchRunContextBinding(workspace);
  const currentDraftRow: StrategyGovernanceQueueRow = {
    id: "current-draft",
    name: workspace.strategy.name,
    revision: "current-draft",
    market: workspace.selectedInstrument.market,
    symbol: workspace.selectedInstrument.symbol,
    timeframe: workspace.selectedTimeframe,
    status: "current",
    stage: "current_draft",
    tone: currentValidation.validationStatus === "blocked" ? "risk" : "neutral",
    contextLabel: currentContextLabel,
    contextMismatch: false,
    importProvenance: currentContextLabel,
    validationStatus: currentValidation.validationStatus,
    validationDetail: currentValidation.validationDetail,
    auditRunId: currentAuditBinding.runId,
    latestAuditRunId: currentAuditBinding.status === "matched" ? currentAuditBinding.runId : null,
    changedFieldCount: 0,
    changedFields: [],
    nextActionId: "save-current-version",
    nextActionLabel: "Save current version",
    detail:
      currentAuditBinding.status === "matched"
        ? `Current draft is bound to audit run ${currentAuditBinding.runId}.`
        : currentValidation.validationDetail
  };
  const rows = [
    currentDraftRow,
    ...library.map((item) => buildStrategyGovernanceLibraryRow(workspace, item, runHistory))
  ].sort(strategyGovernanceQueueSort);

  return {
    rows,
    summary: buildStrategyGovernanceQueueSummary(rows)
  };
}

export function buildStrategyGovernanceLibraryRow(
  workspace: TerminalWorkspace,
  item: StrategyLibraryDraftItem,
  runHistory: ResearchRunAudit[]
): StrategyGovernanceQueueRow {
  const diffRows = buildStrategyVersionDiffRows(workspace, item);
  const changedFields = diffRows.filter((row) => row.changed).map((row) => row.id);
  const contextMismatch =
    item.market !== workspace.selectedInstrument.market ||
    item.symbol !== workspace.selectedInstrument.symbol ||
    item.timeframe !== workspace.selectedTimeframe;
  const validation = buildStrategyGovernanceValidation(workspace, item.strategySnapshot, item);
  const latestAuditRunId = latestStrategyAuditRunId(item, runHistory);
  const stage = strategyGovernanceStage({
    changedFieldCount: changedFields.length,
    contextMismatch,
    item,
    latestAuditRunId,
    validationStatus: validation.validationStatus
  });
  const nextActionId = strategyGovernanceActionId(stage);
  const contextLabel = strategyContextLabel(item.market, item.symbol, item.timeframe);

  return {
    id: item.revision,
    name: item.name,
    revision: item.revision,
    market: item.market,
    symbol: item.symbol,
    timeframe: item.timeframe,
    status: item.status,
    stage,
    tone: strategyGovernanceTone(stage),
    contextLabel,
    contextMismatch,
    importProvenance: contextLabel,
    validationStatus: validation.validationStatus,
    validationDetail: validation.validationDetail,
    auditRunId: item.auditRunId ?? null,
    latestAuditRunId,
    changedFieldCount: changedFields.length,
    changedFields,
    nextActionId,
    nextActionLabel: strategyGovernanceActionLabel(nextActionId),
    detail: strategyGovernanceDetail({
      changedFields,
      contextLabel,
      item,
      latestAuditRunId,
      stage,
      validationDetail: validation.validationDetail
    })
  };
}

export function buildStrategyGovernanceValidation(
  workspace: TerminalWorkspace,
  strategySnapshot: StrategySnapshot,
  item?: StrategyLibraryDraftItem
): Pick<StrategyGovernanceQueueRow, "validationStatus" | "validationDetail"> {
  const validationWorkspace: TerminalWorkspace = {
    ...workspace,
    selectedInstrument: {
      ...workspace.selectedInstrument,
      market: item?.market ?? workspace.selectedInstrument.market,
      symbol: item?.symbol ?? workspace.selectedInstrument.symbol,
      name: item?.name ?? workspace.selectedInstrument.name
    },
    selectedTimeframe: item?.timeframe ?? workspace.selectedTimeframe,
    strategy: strategySnapshot,
    researchRun: null
  };
  const gates = buildStrategyReadinessGates(validationWorkspace).filter((gate) => gate.id !== "audit");
  const blocked = gates.filter((gate) => gate.status === "blocked");
  if (blocked.length) {
    return {
      validationStatus: "blocked",
      validationDetail: blocked.map((gate) => `${gate.label}: ${gate.detail}`).join(" · ")
    };
  }
  const review = gates.filter((gate) => gate.status === "review");
  if (review.length) {
    return {
      validationStatus: "review",
      validationDetail: review.map((gate) => `${gate.label}: ${gate.detail}`).join(" · ")
    };
  }
  return {
    validationStatus: "ready",
    validationDetail: "Strategy schema, risk controls, and paper-only execution mode are ready."
  };
}

export function latestStrategyAuditRunId(item: StrategyLibraryDraftItem, runHistory: ResearchRunAudit[]): string | null {
  const matchingRuns = runHistory
    .filter(
      (run) =>
        run.market === item.market &&
        run.symbol === item.symbol &&
        run.timeframe === item.timeframe &&
        run.strategyRevision === item.revision
    )
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  return matchingRuns[0]?.runId ?? item.auditRunId ?? null;
}

export function strategyGovernanceStage({
  changedFieldCount,
  contextMismatch,
  item,
  latestAuditRunId,
  validationStatus
}: {
  changedFieldCount: number;
  contextMismatch: boolean;
  item: StrategyLibraryDraftItem;
  latestAuditRunId: string | null;
  validationStatus: StrategyGovernanceQueueRow["validationStatus"];
}): StrategyGovernanceQueueStage {
  if (validationStatus === "blocked") {
    return "blocked";
  }
  if (contextMismatch) {
    return "imported";
  }
  if (changedFieldCount > 0) {
    return "stale";
  }
  if (item.status === "audited" && latestAuditRunId) {
    return "audited";
  }
  return "needs_reaudit";
}

export function strategyGovernanceActionId(stage: StrategyGovernanceQueueStage): StrategyGovernanceQueueActionId {
  if (stage === "stale" || stage === "needs_reaudit") {
    return "load-and-rerun";
  }
  return "load-version";
}

export function strategyGovernanceActionLabel(actionId: StrategyGovernanceQueueActionId): string {
  if (actionId === "save-current-version") {
    return "Save current version";
  }
  if (actionId === "load-and-rerun") {
    return "Load and rerun audit";
  }
  return "Load version";
}

export function strategyGovernanceTone(stage: StrategyGovernanceQueueStage): StrategyGovernanceQueueRow["tone"] {
  if (stage === "audited") {
    return "positive";
  }
  if (stage === "blocked") {
    return "risk";
  }
  if (stage === "current_draft" || stage === "imported") {
    return "neutral";
  }
  return "warning";
}
