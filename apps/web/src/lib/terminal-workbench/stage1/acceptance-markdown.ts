import { auditReportLedgerProductWorkAreaId } from "../research-package/import-audit";
import type { GoldenPathRunbookSourceItem, P0AcceptanceSummary, P0AcceptanceSummarySource, P0PlatformBacklogItem, P0PlatformReadinessGap, P0PlatformReadinessSource, P0PlatformReadinessSummary, P2ManifestChainPreflightStageSource, P2ManifestChainPreflightSummary, P2ManifestChainPreflightSummarySource, P2ReadinessEvidenceCoverage, ProductWorkAreaId } from "./foundation-contracts";
import { p0GoldenPathActionTargetWorkspaceId, p0GoldenPathJourneyDefinitions, p0GoldenPathJourneyStepState, p0GoldenPathNextActionIdForStep, p0GoldenPathRunbookItem, p0GoldenPathStepEvidenceId, p0GoldenPathStepHasEvidence, p0GoldenPathSummaryComplete, p0PlatformBacklogPriority, p0PlatformBacklogPriorityRank, p0PlatformReadinessDetail, p0PlatformReadinessHeadline, resolveP0PlatformReadinessState } from "./platform-readiness";
import type { P0CompletionChecklist, P0CompletionChecklistInput, P0CompletionCriterion, P0CompletionCriterionStatus, P0GoldenPathJourney, P0GoldenPathJourneyInput, P0GoldenPathJourneyStep, P0PlatformActionOutcome, P0PlatformActionOutcomePaperExecution, P0PlatformActionOutcomeSource } from "./review-contracts";

export function buildP2ManifestChainPreflightReviewMarkdown({
  preflight,
  summary
}: {
  preflight: P2ManifestChainPreflightSummarySource | null | undefined;
  summary: P2ManifestChainPreflightSummary;
}): string {
  const stages = preflight?.stages.length
    ? preflight.stages
    : summary.stages.length
      ? summary.stages
      : [
          {
            id: "p2_manifest_chain_preflight_missing",
            label: "P2 manifest chain preflight",
            status: summary.state === "missing" ? "missing" : "invalid",
            path: summary.sourcePath,
            summary: "",
            reason: summary.detail,
            nextAction: summary.nextAction,
            nextCommand: summary.nextCommand
          } satisfies P2ManifestChainPreflightStageSource
        ];
  const reason = preflight?.reason || preflight?.summary || summary.detail;
  const nextAction = preflight?.nextAction ?? summary.nextAction;
  const nextCommand = preflight?.nextCommand ?? summary.nextCommand;

  return [
    "# P2 Manifest Chain Preflight Review",
    "",
    "## Summary",
    `- Status: ${preflight?.status ?? summary.state}`,
    `- Headline: ${summary.headline}`,
    `- Detail: ${summary.detail}`,
    `- Source: ${preflight?.sourcePath ?? summary.sourcePath}`,
    `- Available: ${Boolean(preflight?.available)}`,
    `- Ready: ${Boolean(preflight?.ready ?? summary.ready)}`,
    `- Stages: ${preflight?.validStageCount ?? summary.validStageCount}/${preflight?.totalStageCount ?? summary.totalStageCount}`,
    `- Next action: ${nextAction || "none"}`,
    `- Next command: ${nextCommand || "none"}`,
    `- Blockers: ${(preflight?.blockerIds.length ? preflight.blockerIds : summary.blockerIds).join(", ") || "none"}`,
    "",
    "## Manifest Stages",
    ...stages.map(
      (stage) =>
        `- ${stage.id}: ${stage.status} · ${stage.path} · ${stage.summary || stage.reason || "no detail"}`
    ),
    "",
    "## Execution Boundary",
    `- paperOnly: ${Boolean(preflight?.paperOnly)}`,
    `- orderSubmissionEnabled: ${Boolean(preflight?.orderSubmissionEnabled)}`,
    `- liveTradingAllowed: ${Boolean(preflight?.liveTradingAllowed)}`,
    `- liveOrderSubmitted: ${Boolean(preflight?.liveOrderSubmitted)}`,
    `- routeExecuted: ${Boolean(preflight?.routeExecuted)}`,
    `- liveBlockedBoundary: ${Boolean(preflight?.liveBlockedBoundary ?? summary.liveBlockedBoundary)}`,
    "- Platform decision: live trading and real order routing remain blocked.",
    "",
    "## Review Notes",
    `- Reason: ${reason}`,
    "- This review is audit evidence only and does not authorize live trading.",
    ""
  ].join("\n");
}

export function buildP2ReadinessEvidenceCoverageReviewMarkdown({
  coverage
}: {
  coverage: P2ReadinessEvidenceCoverage;
}): string {
  return [
    "# P2 Readiness Evidence Coverage Review",
    "",
    "## Summary",
    `- Status: ${coverage.status}`,
    `- Headline: ${coverage.headline}`,
    `- Detail: ${coverage.detail}`,
    `- Claims: ${coverage.coveredCount}/${coverage.totalCount}`,
    `- Blocking claims: ${coverage.blockingCount}`,
    "",
    "## Execution Boundary",
    `- orderSubmissionEnabled: ${coverage.orderSubmissionEnabled}`,
    `- liveTradingAllowed: ${coverage.liveTradingAllowed}`,
    "- Platform decision: live trading and real order routing remain blocked.",
    "",
    "## Coverage Rows",
    ...coverage.rows.map(
      (row) => `- ${row.id}: ${row.status} · ${row.sourceType} · ${row.sourceId ?? "n/a"} · ${row.evidence}`
    ),
    "",
    "## Review Notes",
    "- This review is audit evidence only and does not authorize live trading.",
    ""
  ].join("\n");
}

export function buildP0AcceptanceReviewMarkdown({
  acceptance,
  summary
}: {
  acceptance: P0AcceptanceSummarySource | null | undefined;
  summary: P0AcceptanceSummary;
}): string {
  const checkIds =
    acceptance?.checkIds.length
      ? acceptance.checkIds
      : summary.state === "missing"
        ? ["p0_acceptance_manifest_missing"]
        : ["p0_acceptance_manifest_invalid"];
  const context = [acceptance?.market, acceptance?.symbol, acceptance?.timeframe].filter(Boolean).join(" ") || "n/a";
  const generatedAt = acceptance?.generatedAt || "n/a";
  const reason = acceptance?.reason || acceptance?.summary || summary.detail;

  return [
    "# P0 Acceptance Review",
    "",
    "## Summary",
    `- Status: ${summary.state}`,
    `- Headline: ${summary.headline}`,
    `- Detail: ${summary.detail}`,
    `- Source: ${summary.sourcePath}`,
    `- Generated at: ${generatedAt}`,
    `- Run: ${summary.runId || "n/a"}`,
    `- Context: ${context}`,
    `- Checks: ${summary.checkCount}/${summary.requiredCheckCount}`,
    "",
    "## Execution Boundary",
    `- paperOnly: ${Boolean(acceptance?.paperOnly)}`,
    `- liveTradingAllowed: ${summary.reportedLiveTradingAllowed}`,
    `- liveBlockedBoundary: ${summary.liveBlockedBoundary}`,
    "- Platform decision: live trading remains blocked.",
    "",
    "## Manifest Checks",
    ...checkIds.map((checkId) => `- ${checkId}`),
    "",
    "## Review Notes",
    `- Reason: ${reason}`,
    "- This review is audit evidence only and does not authorize live trading.",
    ""
  ].join("\n");
}

export function buildP0PlatformReadinessSummary(
  goldenPath: P0PlatformReadinessSource | null | undefined
): P0PlatformReadinessSummary {
  if (!goldenPath || !Array.isArray(goldenPath.runbook)) {
    return {
      state: "unknown",
      headline: "Waiting for P0 readiness evidence",
      detail: "Golden path status is not loaded yet.",
      progressPct: 0,
      passedSteps: 0,
      totalSteps: 0,
      reviewSteps: 0,
      blockedSteps: 0,
      openStepCount: 0,
      currentGap: null,
      liveBoundary: {
        liveTradingAllowed: false,
        label: "Unknown live boundary",
        detail: "Load golden path status before evaluating execution readiness."
      }
    };
  }

  const runbook = goldenPath.runbook;
  const totalSteps = Math.max(goldenPath.summary?.totalSteps ?? runbook.length, 0);
  const passedSteps = Math.max(
    goldenPath.summary?.passedSteps ?? runbook.filter((item) => item.passed).length,
    0
  );
  const reviewSteps = Math.max(
    goldenPath.summary?.reviewSteps ?? runbook.filter((item) => !item.passed && item.status === "review").length,
    0
  );
  const blockedSteps = Math.max(
    goldenPath.summary?.blockedSteps ?? runbook.filter((item) => !item.passed && item.status === "blocked").length,
    0
  );
  const openStepCount = Math.max(totalSteps - passedSteps, reviewSteps + blockedSteps);
  const progressPct = totalSteps > 0 ? Math.round((Math.min(passedSteps, totalSteps) / totalSteps) * 100) : 0;
  const currentGapItem =
    runbook.find((item) => item.current && !item.passed) ?? runbook.find((item) => !item.passed) ?? null;
  const currentGap: P0PlatformReadinessGap | null = currentGapItem
    ? {
        stepId: currentGapItem.stepId,
        label: currentGapItem.label,
        workspaceId: currentGapItem.workspaceId,
        status: currentGapItem.status,
        detail: currentGapItem.blocker ?? currentGapItem.detail,
        actionId: currentGapItem.actionId,
        actionLabel: currentGapItem.actionLabel,
        targetWorkspaceId: currentGapItem.targetWorkspace ?? goldenPath.nextAction?.targetWorkspace ?? currentGapItem.workspaceId
      }
    : null;
  const liveTradingAllowed = Boolean(goldenPath.summary?.liveTradingAllowed);
  const state = resolveP0PlatformReadinessState({
    blockedSteps,
    goldenPathStatus: goldenPath.status,
    liveTradingAllowed,
    reviewSteps,
    totalSteps,
    passedSteps
  });
  const headline = p0PlatformReadinessHeadline(state);
  const detail = p0PlatformReadinessDetail(state, {
    currentGap,
    passedSteps,
    totalSteps
  });

  return {
    state,
    headline,
    detail,
    progressPct,
    passedSteps,
    totalSteps,
    reviewSteps,
    blockedSteps,
    openStepCount,
    currentGap,
    liveBoundary: liveTradingAllowed
      ? {
          liveTradingAllowed,
          label: "Live boundary open",
          detail: "Golden path status marks live trading gates open; require explicit operator confirmation before routing capital."
        }
      : {
          liveTradingAllowed,
          label: "Paper-only boundary",
          detail: "P0 can be usable for audited research, review, and simulation while live trading remains blocked."
        }
  };
}

export function buildP0PlatformBacklogItems(
  goldenPath: P0PlatformReadinessSource | null | undefined,
  limit = 3
): P0PlatformBacklogItem[] {
  if (!goldenPath || !Array.isArray(goldenPath.runbook) || limit <= 0) {
    return [];
  }
  return goldenPath.runbook
    .filter((item) => !item.passed)
    .map((item, index) => ({
      actionId: item.actionId,
      actionLabel: item.actionLabel,
      detail: item.blocker ?? item.detail,
      label: item.label,
      priority: p0PlatformBacklogPriority(item),
      rank: index + 1,
      status: item.status,
      stepId: item.stepId,
      targetWorkspaceId: item.targetWorkspace ?? goldenPath.nextAction?.targetWorkspace ?? item.workspaceId,
      workspaceId: item.workspaceId
    }))
    .sort((left, right) => p0PlatformBacklogPriorityRank(left.priority) - p0PlatformBacklogPriorityRank(right.priority))
    .slice(0, limit)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export function buildP0GoldenPathJourney(input: P0GoldenPathJourneyInput | null | undefined): P0GoldenPathJourney {
  const source = input ?? {};
  const goldenPath = source.goldenPath;
  const runbook = Array.isArray(goldenPath?.runbook) ? goldenPath.runbook : [];
  const criteria = Array.isArray(source.completionChecklist?.criteria) ? source.completionChecklist.criteria : [];
  const summaryComplete = p0GoldenPathSummaryComplete(goldenPath, source.summary);
  const rawSteps = p0GoldenPathJourneyDefinitions.map((definition) => {
    const criterion = criteria.find((item) => definition.criteria.includes(item.id));
    const runbookItem = p0GoldenPathRunbookItem(runbook, definition.runbookKeys);
    const passed =
      summaryComplete ||
      criterion?.status === "passed" ||
      Boolean(runbookItem?.passed) ||
      p0GoldenPathStepHasEvidence(definition.id, source);
    const detail =
      criterion?.detail?.trim() ||
      runbookItem?.blocker?.trim() ||
      runbookItem?.detail?.trim() ||
      definition.detail;
    const evidenceId =
      criterion?.evidence?.trim() ||
      runbookItem?.stepId?.trim() ||
      p0GoldenPathStepEvidenceId(definition.id, source);
    const actionId = runbookItem?.actionId?.trim() || p0GoldenPathNextActionIdForStep(definition.id, source);
    const actionTargetWorkspaceId = p0GoldenPathActionTargetWorkspaceId(
      runbookItem?.targetWorkspace || goldenPath?.nextAction?.targetWorkspace,
      definition.workspaceId
    );

    return {
      actionId,
      actionTargetWorkspaceId,
      definition,
      detail,
      evidenceId,
      passed
    };
  });
  const firstOpenIndex = rawSteps.findIndex((step) => !step.passed);
  const currentIndex = firstOpenIndex >= 0 ? firstOpenIndex : rawSteps.length - 1;
  const currentRawStep = rawSteps[currentIndex] ?? rawSteps[0];
  const steps: P0GoldenPathJourneyStep[] = rawSteps.map((step, index) => ({
    id: step.definition.id,
    label: step.definition.label,
    state: p0GoldenPathJourneyStepState({
      hasAction: Boolean(step.actionId),
      index,
      currentIndex,
      passed: step.passed
    }),
    workspaceId: step.definition.workspaceId,
    evidenceId: step.evidenceId,
    nextActionId: index === currentIndex ? step.actionId : "",
    detail: step.detail
  }));
  const currentStep = steps[currentIndex] ?? steps[0];
  const nextActionId = currentStep?.nextActionId ?? "";

  return {
    steps,
    currentStepId: currentStep?.id ?? "data",
    nextActionId,
    nextActionTargetWorkspaceId: nextActionId ? currentRawStep.actionTargetWorkspaceId : (currentStep?.workspaceId ?? "research"),
    liveTradingAllowed: false,
    liveBoundaryLabel: "Paper-only P0 journey",
    detail: nextActionId
      ? `${currentStep?.label ?? "P0"} is current · action: ${nextActionId}`
      : `${currentStep?.label ?? "P0"} is current · live trading remains blocked`
  };
}

export function buildP0CompletionChecklist(input: P0CompletionChecklistInput): P0CompletionChecklist {
  const runbook = Array.isArray(input.goldenPath?.runbook) ? input.goldenPath.runbook : [];
  const dataQualityStep = p0CompletionRunbookStep(runbook, ["market-data", "data-quality", "watchlist-cache"]);
  const strategyStep = p0CompletionRunbookStep(runbook, ["strategy-config", "strategy-version", "strategy"]);
  const backtestStep = p0CompletionRunbookStep(runbook, ["backtest-report", "audited-backtest", "research-run"]);
  const aiStep = p0CompletionRunbookStep(runbook, ["ai-review", "agent-review"]);
  const paperStep = p0CompletionRunbookStep(runbook, ["paper-execution", "paper-order"]);
  const latestRunId = input.goldenPath?.latestRunId?.trim() || input.outcome.runId?.trim() || null;
  const hasAuditEvidence =
    input.outcome.state === "audit_run" ||
    input.outcome.state === "paper_execution" ||
    input.outcome.state === "live_ready" ||
    Boolean(latestRunId) ||
    Boolean(backtestStep?.passed);
  const paperRecorded = input.paperPreflight?.state === "recorded" || input.outcome.state === "paper_execution";
  const paperReady = paperRecorded || input.paperPreflight?.state === "ready";
  const strategyReady = Boolean(input.strategyVersionReady || strategyStep?.passed);

  const criteria: P0CompletionCriterion[] = [
    {
      id: "product-workspaces",
      label: "Clear product workspaces",
      status: input.productWorkAreaCount >= 8 ? "passed" : "blocked",
      detail:
        input.productWorkAreaCount >= 8
          ? `${input.productWorkAreaCount} product workspaces are available.`
          : "Product workspaces are not fully wired yet.",
      evidence: `${input.productWorkAreaCount} workspaces`,
      actionLabel: input.productWorkAreaCount >= 8 ? null : "Review workspace map",
      targetWorkspaceId: "research"
    },
    {
      id: "golden-path",
      label: "Golden path can run through",
      status:
        input.summary.state === "paper_ready" || input.summary.state === "live_ready"
          ? "passed"
          : input.summary.totalSteps > 0
            ? "review"
            : "blocked",
      detail:
        input.summary.totalSteps > 0
          ? input.summary.detail
          : "Golden path evidence has not been loaded.",
      evidence: `${input.summary.passedSteps}/${input.summary.totalSteps} steps`,
      actionLabel: input.summary.currentGap?.actionLabel ?? "Open golden path",
      targetWorkspaceId: p0CompletionWorkspaceId(input.summary.currentGap?.targetWorkspaceId ?? input.summary.currentGap?.workspaceId, "research")
    },
    p0CompletionCriterionFromStep({
      actionLabel: dataQualityStep?.actionLabel ?? null,
      detail: dataQualityStep?.detail ?? "Market data quality evidence is missing.",
      evidence: dataQualityStep?.detail ?? "no market-data step",
      id: "data-quality",
      label: "Market data quality is visible",
      status: p0CompletionStatusFromStep(dataQualityStep),
      targetWorkspaceId: p0CompletionWorkspaceId(dataQualityStep?.targetWorkspace ?? dataQualityStep?.workspaceId, "market")
    }),
    {
      id: "strategy-versioning",
      label: "Strategy config is structured and versioned",
      status: strategyReady ? "passed" : hasAuditEvidence ? "review" : "blocked",
      detail: strategyReady
        ? strategyStep?.detail ?? "Structured strategy version is available."
        : hasAuditEvidence
          ? "Audited evidence exists; verify the structured strategy revision is bound."
          : "Save a structured strategy version before the audited run.",
      evidence: strategyStep?.detail ?? latestRunId ?? "no strategy revision",
      actionLabel: strategyReady ? null : "Open strategy lab",
      targetWorkspaceId: "strategy"
    },
    {
      id: "audited-backtest",
      label: "Backtest run is reproducible and audited",
      status: hasAuditEvidence ? "passed" : "blocked",
      detail: hasAuditEvidence
        ? backtestStep?.detail ?? input.outcome.detail
        : "Run an audited research/backtest pipeline before AI or execution.",
      evidence: latestRunId ?? backtestStep?.detail ?? "no audited run",
      actionLabel: hasAuditEvidence ? null : "Run pipeline",
      targetWorkspaceId: hasAuditEvidence ? "audit" : "research"
    },
    {
      id: "ai-evidence",
      label: "AI review is bound to audit evidence",
      status: aiStep?.passed ? "passed" : hasAuditEvidence ? "review" : "blocked",
      detail: aiStep?.passed
        ? aiStep.detail
        : hasAuditEvidence
          ? aiStep?.blocker ?? aiStep?.detail ?? "Run AI review from audited evidence."
          : "AI review waits for audited backtest evidence.",
      evidence: aiStep?.detail ?? latestRunId ?? "no AI review",
      actionLabel: aiStep?.passed ? null : aiStep?.actionLabel ?? "Run AI review",
      targetWorkspaceId: p0CompletionWorkspaceId(aiStep?.targetWorkspace ?? aiStep?.workspaceId, "ai-review")
    },
    {
      id: "paper-execution",
      label: "Paper execution cannot bypass audit evidence",
      status: paperRecorded ? "passed" : paperReady ? "review" : "blocked",
      detail: paperRecorded
        ? input.paperPreflight?.detail ?? input.outcome.detail
        : paperReady
          ? input.paperPreflight?.detail ?? "Paper order is ready for operator confirmation."
          : paperStep?.blocker ?? paperStep?.detail ?? "Paper execution is not recorded yet.",
      evidence: input.outcome.state === "paper_execution" ? input.outcome.evidenceId ?? "paper execution" : input.paperPreflight?.headline ?? paperStep?.detail ?? "no paper execution",
      actionLabel: paperRecorded ? null : input.paperPreflight?.primaryActionLabel ?? paperStep?.actionLabel ?? "Submit paper order",
      targetWorkspaceId: "execution"
    },
    {
      id: "replay",
      label: "Replay restores chart, strategy, backtest, AI, and execution state",
      status: input.replayReady ? "passed" : input.outcome.evidenceId ? "review" : "blocked",
      detail: input.replayReady
        ? "Replay state is available for the current evidence chain."
        : input.outcome.evidenceId
          ? "Evidence exists; verify replay coverage before release."
          : "No evidence chain is available to replay.",
      evidence: input.outcome.evidenceId ?? "no replay evidence",
      actionLabel: input.replayReady ? null : "Open audit replay",
      targetWorkspaceId: "audit"
    },
    {
      id: "export-import",
      label: "Export/import can reproduce key results",
      status: input.exportImportReady ? "passed" : input.outcome.evidenceId ? "review" : "blocked",
      detail: input.exportImportReady
        ? "Export/import evidence is available for this run."
        : input.outcome.evidenceId
          ? "Run export/import verification for the current evidence chain."
          : "Create an audited run before export/import verification.",
      evidence: input.outcome.evidenceId ?? "no export evidence",
      actionLabel: input.exportImportReady ? null : "Open export evidence",
      targetWorkspaceId: "audit"
    },
    {
      id: "automated-tests",
      label: "Automated tests cover backend contracts and frontend flows",
      status: input.automatedTestsVerified ? "passed" : "review",
      detail: input.automatedTestsVerified
        ? "Automated tests were verified for the current build."
        : "Run the full test/build suite before calling P0 complete.",
      evidence: input.automatedTestsVerified ? "verified" : "not verified in runtime",
      actionLabel: input.automatedTestsVerified ? null : "Run tests",
      targetWorkspaceId: "settings"
    }
  ];
  const passed = criteria.filter((item) => item.status === "passed").length;
  const review = criteria.filter((item) => item.status === "review").length;
  const blocked = criteria.filter((item) => item.status === "blocked").length;
  const total = criteria.length;
  const progressPct = total > 0 ? Math.round((passed / total) * 100) : 0;
  const openCriteria = criteria.filter((item) => item.status !== "passed");
  const currentGap = criteria.find((item) => item.status === "blocked") ?? criteria.find((item) => item.status === "review") ?? null;
  const headline = blocked > 0 ? "P0 completion not ready" : review > 0 ? "P0 completion needs review" : "P0 completion ready";
  const detail =
    blocked > 0 || review > 0
      ? `${passed}/${total} completion criteria passed · ${review} need review · ${blocked} blocked`
      : `${passed}/${total} completion criteria passed · ready for personal/team paper workflow`;

  return {
    total,
    passed,
    review,
    blocked,
    progressPct,
    headline,
    detail,
    criteria,
    openCriteria,
    currentGap
  };
}

export function p0CompletionRunbookStep(
  runbook: readonly GoldenPathRunbookSourceItem[],
  preferredStepIds: readonly string[]
): GoldenPathRunbookSourceItem | null {
  const preferred = runbook.find((item) => preferredStepIds.includes(item.stepId));
  if (preferred) {
    return preferred;
  }
  const preferredTokens = preferredStepIds.map((id) => id.replace(/-/gu, " "));
  return (
    runbook.find((item) => {
      const haystack = `${item.stepId} ${item.label}`.replace(/-/gu, " ").toLowerCase();
      return preferredTokens.some((token) => haystack.includes(token.toLowerCase()));
    }) ?? null
  );
}

export function p0CompletionStatusFromStep(
  step: GoldenPathRunbookSourceItem | null | undefined
): P0CompletionCriterionStatus {
  if (!step) {
    return "blocked";
  }
  if (step.passed) {
    return "passed";
  }
  return step.status === "review" ? "review" : "blocked";
}

export function p0CompletionCriterionFromStep(criterion: P0CompletionCriterion): P0CompletionCriterion {
  return criterion;
}

export function p0CompletionWorkspaceId(
  value: string | null | undefined,
  fallback: ProductWorkAreaId
): ProductWorkAreaId {
  return auditReportLedgerProductWorkAreaId(value?.trim() ?? "") ?? fallback;
}

export function buildP0PlatformActionOutcome(
  source: P0PlatformActionOutcomeSource | null | undefined
): P0PlatformActionOutcome {
  const statusLabel = source?.statusLabel?.trim() ?? "";
  const paperExecution = source?.paperExecution;
  if (paperExecution?.executionId) {
    const orderCount = paperExecution.orders?.length ?? 0;
    const gateCount = paperExecution.gates?.length ?? 0;
    const passedGateCount = paperExecution.gates?.filter((gate) => gate.passed).length ?? 0;
    const preparationEvidenceDetail = formatP0PaperExecutionPreparationEvidenceDetail(
      paperExecution.preparationEvidence
    );
    const preparationEvidenceRunId = p0PaperExecutionPreparationEvidenceRunId(paperExecution.preparationEvidence);
    return {
      state: "paper_execution",
      label: "Paper execution recorded",
      detail: [
        paperExecution.executionId,
        `${orderCount} ${orderCount === 1 ? "order" : "orders"}`,
        `${passedGateCount}/${gateCount} gates passed`,
        ...(preparationEvidenceDetail ? [preparationEvidenceDetail] : [])
      ].join(" · "),
      evidenceId: paperExecution.executionId,
      runId: paperExecution.runId || null,
      ...(preparationEvidenceRunId ? { preparationEvidenceRunId } : {}),
      targetWorkspaceId: "execution",
      tone: "positive",
      nextStep: "Review the execution handoff and promotion gates; live trading remains blocked."
    };
  }

  const latestRunId = source?.goldenPath?.latestRunId?.trim() ?? "";
  if (latestRunId) {
    return {
      state: source?.goldenPath?.summary?.liveTradingAllowed ? "live_ready" : "audit_run",
      label: source?.goldenPath?.summary?.liveTradingAllowed ? "Audited run live gate open" : "Audited run available",
      detail: statusLabel ? `${latestRunId} · ${statusLabel}` : latestRunId,
      evidenceId: latestRunId,
      runId: latestRunId,
      targetWorkspaceId: "audit",
      tone: "ai",
      nextStep: source?.goldenPath?.summary?.liveTradingAllowed
        ? "Require explicit operator confirmation before any live routing."
        : "Continue with AI review or paper execution from the P0 backlog."
    };
  }

  return {
    state: "waiting",
    label: "Waiting for P0 action evidence",
    detail: statusLabel || "Run an audited pipeline to create traceable P0 evidence.",
    evidenceId: null,
    runId: null,
    targetWorkspaceId: "research",
    tone: "warning",
    nextStep: "Start with market data refresh and an audited research pipeline."
  };
}

export function formatP0PaperExecutionPreparationEvidenceDetail(
  evidence: P0PlatformActionOutcomePaperExecution["preparationEvidence"]
): string | null {
  const runId = p0PaperExecutionPreparationEvidenceRunId(evidence);
  if (!runId) {
    return null;
  }
  const rows = Number.isFinite(evidence?.upsertedRows) ? `${evidence?.upsertedRows} rows` : null;
  const source = evidence?.quality?.source?.trim() || null;
  return [`prep ${runId}`, rows, source].filter(Boolean).join(" · ");
}

export function p0PaperExecutionPreparationEvidenceRunId(
  evidence: P0PlatformActionOutcomePaperExecution["preparationEvidence"]
): string | null {
  return evidence?.runId?.trim() || null;
}
