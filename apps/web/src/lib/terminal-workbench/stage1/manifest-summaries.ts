import type { OperatorRunbookAuditCoverage } from "../audit/deep-link-queries";
import type { AuditEvidenceReportLedgerRow } from "../audit/report-contracts";
import type { ExecutionAdapterChainHealthRollup, PreLiveReadinessChecklist } from "../execution/ops-contracts";
import type { P1AcceptanceSummary, P2ManifestChainPreflightSummary, P2ManifestChainPreflightSummarySource, P2PaperReplayMetrics, P2PaperReplaySummary, P2PreLiveAcceptanceSummary, P2ReadinessAcceptanceRowStatus, P2ReadinessAcceptanceStatus, P2ReadinessAcceptanceTone, P2ReadinessEvidenceCoverage, P2ReadinessEvidenceCoverageInput, P2ReadinessEvidenceCoverageRow, P2ReadinessEvidenceCoverageStatus, P2ReadinessEvidenceCoverageTone } from "./foundation-contracts";
import type { P2ReadinessAcceptanceRow, P2ReadinessAcceptanceSummary, P2ReadinessAcceptanceSummaryInput } from "./review-contracts";

export function buildP2ManifestChainPreflightSummary(
  preflight: P2ManifestChainPreflightSummarySource | null | undefined
): P2ManifestChainPreflightSummary {
  const missingDefaults = {
    sourcePath: preflight?.sourcePath || "data/p2-chain-preflight.json",
    ready: false,
    validStageCount: preflight?.validStageCount ?? 0,
    totalStageCount: preflight?.totalStageCount ?? 4,
    blockerIds: preflight?.blockerIds ?? [],
    nextAction: preflight?.nextAction || "run-p1-acceptance",
    nextCommand: preflight?.nextCommand || "npm run docker:smoke:p1 -- --no-build",
    stages: preflight?.stages ?? [],
    reportedOrderSubmissionEnabled: Boolean(preflight?.orderSubmissionEnabled),
    reportedLiveTradingAllowed: Boolean(preflight?.liveTradingAllowed),
    reportedLiveOrderSubmitted: Boolean(preflight?.liveOrderSubmitted),
    reportedRouteExecuted: Boolean(preflight?.routeExecuted),
    liveBlockedBoundary: Boolean(preflight?.liveBlockedBoundary)
  };

  if (!preflight || preflight.status === "missing") {
    return {
      state: "missing",
      tone: "warning",
      headline: "P2 manifest chain preflight missing",
      detail:
        preflight?.reason ||
        "Generate data/p2-chain-preflight.json to see which archived P1/P2 manifest blocks the operator path.",
      actionLabel: "Run P2 chain preflight",
      targetWorkspaceId: "execution",
      ...missingDefaults,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false
    };
  }

  const unsafeExecutionClaim =
    preflight.status === "invalid" ||
    preflight.orderSubmissionEnabled ||
    preflight.liveTradingAllowed ||
    preflight.liveOrderSubmitted ||
    preflight.routeExecuted ||
    !preflight.liveBlockedBoundary;
  if (unsafeExecutionClaim) {
    return {
      state: "invalid",
      tone: "risk",
      headline: "P2 manifest chain preflight invalid",
      detail: `P2 chain preflight evidence is invalid: ${
        preflight.reason || preflight.summary || "unknown validation failure"
      }. Direct order submission remains disabled and live trading remains blocked.`,
      actionLabel: "Review P2 preflight report",
      targetWorkspaceId: "audit",
      sourcePath: preflight.sourcePath,
      ready: Boolean(preflight.ready),
      validStageCount: preflight.validStageCount,
      totalStageCount: preflight.totalStageCount,
      blockerIds: preflight.blockerIds,
      nextAction: preflight.nextAction,
      nextCommand: preflight.nextCommand,
      stages: preflight.stages,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      reportedOrderSubmissionEnabled: Boolean(preflight.orderSubmissionEnabled),
      reportedLiveTradingAllowed: Boolean(preflight.liveTradingAllowed),
      reportedLiveOrderSubmitted: Boolean(preflight.liveOrderSubmitted),
      reportedRouteExecuted: Boolean(preflight.routeExecuted),
      liveBlockedBoundary: Boolean(preflight.liveBlockedBoundary)
    };
  }

  if (preflight.status === "ready") {
    return {
      state: "ready",
      tone: "positive",
      headline: "P2 manifest chain ready",
      detail: `${preflight.validStageCount}/${preflight.totalStageCount} manifest stages valid · archived evidence chain can be reviewed without enabling live trading.`,
      actionLabel: "Open P2 readiness review",
      targetWorkspaceId: "audit",
      sourcePath: preflight.sourcePath,
      ready: Boolean(preflight.ready),
      validStageCount: preflight.validStageCount,
      totalStageCount: preflight.totalStageCount,
      blockerIds: preflight.blockerIds,
      nextAction: preflight.nextAction,
      nextCommand: preflight.nextCommand,
      stages: preflight.stages,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      reportedOrderSubmissionEnabled: Boolean(preflight.orderSubmissionEnabled),
      reportedLiveTradingAllowed: Boolean(preflight.liveTradingAllowed),
      reportedLiveOrderSubmitted: Boolean(preflight.liveOrderSubmitted),
      reportedRouteExecuted: Boolean(preflight.routeExecuted),
      liveBlockedBoundary: Boolean(preflight.liveBlockedBoundary)
    };
  }

  const actionLabel = p2ManifestChainPreflightActionLabel(preflight.nextAction);
  return {
    state: "blocked",
    tone: "warning",
    headline: "P2 manifest chain blocked",
    detail: `${preflight.validStageCount}/${preflight.totalStageCount} manifest stages valid · next ${
      preflight.nextAction || "operator action"
    } via ${preflight.nextCommand || "manual command"}.`,
    actionLabel,
    targetWorkspaceId: "execution",
    sourcePath: preflight.sourcePath,
    ready: Boolean(preflight.ready),
    validStageCount: preflight.validStageCount,
    totalStageCount: preflight.totalStageCount,
    blockerIds: preflight.blockerIds,
    nextAction: preflight.nextAction,
    nextCommand: preflight.nextCommand,
    stages: preflight.stages,
    orderSubmissionEnabled: false,
    liveTradingAllowed: false,
    liveOrderSubmitted: false,
    routeExecuted: false,
    reportedOrderSubmissionEnabled: Boolean(preflight.orderSubmissionEnabled),
    reportedLiveTradingAllowed: Boolean(preflight.liveTradingAllowed),
    reportedLiveOrderSubmitted: Boolean(preflight.liveOrderSubmitted),
    reportedRouteExecuted: Boolean(preflight.routeExecuted),
    liveBlockedBoundary: Boolean(preflight.liveBlockedBoundary)
  };
}

export function p2ManifestChainPreflightActionLabel(nextAction: string): string {
  const labels: Record<string, string> = {
    "run-p1-acceptance": "Run P1 acceptance smoke",
    "run-p2-paper-replay": "Run P2 paper replay smoke",
    "run-p2-pre-live": "Run P2 pre-live smoke",
    "run-p2-readiness": "Run P2 readiness smoke"
  };
  return labels[nextAction] ?? "Run next P2 chain step";
}

export function emptyP2PaperReplayMetrics(): P2PaperReplayMetrics {
  return {
    filledPaperOrders: 0,
    portfolioOrders: 0,
    approvedPortfolioOrders: 0,
    portfolioFilledOrders: 0,
    stateHistoryFilledEvents: 0,
    adapterPaperExecutions: 0,
    replayWarnings: 0
  };
}

export function buildP2ReadinessEvidenceCoverage({
  adapterChainHealthRollups = [],
  operatorRunbookAuditCoverage,
  p2ManifestChainPreflight = null,
  p2ManifestChainPreflightReviewAuditRow = null,
  p2PaperReplay,
  p2PreLiveAcceptance,
  preLiveChecklist
}: P2ReadinessEvidenceCoverageInput): P2ReadinessEvidenceCoverage {
  const primaryAdapterChain =
    adapterChainHealthRollups.find((rollup) => rollup.status === "paper_ready") ??
    adapterChainHealthRollups.find((rollup) => rollup.status === "blocked") ??
    adapterChainHealthRollups.find((rollup) => rollup.status === "in_progress") ??
    adapterChainHealthRollups[0] ??
    null;
  const rows: P2ReadinessEvidenceCoverageRow[] = [
    buildP2PaperReplayEvidenceCoverageRow(p2PaperReplay),
    buildP2AcceptanceEvidenceCoverageRow(p2PreLiveAcceptance),
    ...(p2ManifestChainPreflight
      ? [
          buildP2ManifestChainPreflightReviewEvidenceCoverageRow(
            p2ManifestChainPreflight,
            p2ManifestChainPreflightReviewAuditRow
          )
        ]
      : []),
    buildP2OperatorRunbookEvidenceCoverageRow(operatorRunbookAuditCoverage),
    buildP2PreLiveChecklistEvidenceCoverageRow(preLiveChecklist),
    buildP2AdapterChainEvidenceCoverageRow(primaryAdapterChain),
    buildP2SafetyBoundaryEvidenceCoverageRow({ p2PaperReplay, p2PreLiveAcceptance, primaryAdapterChain })
  ];
  const coveredCount = rows.filter((row) => row.status === "covered").length;
  const totalCount = rows.length;
  const blockingRows = rows.filter((row) => row.status !== "covered");
  const blockingCount = blockingRows.length;
  const blockingDetail =
    blockingRows.length > 0
      ? ` Blocking rows: ${blockingRows.map((row) => `${row.id} ${row.status}`).join(", ")}.`
      : "";
  const status: P2ReadinessEvidenceCoverageStatus = rows.some((row) => row.status === "blocked")
    ? "blocked"
    : rows.some((row) => row.status === "stale")
      ? "stale"
      : coveredCount === totalCount
        ? "covered"
        : "missing";
  const tone: P2ReadinessEvidenceCoverageTone =
    status === "covered" ? "positive" : status === "blocked" ? "risk" : "warning";
  const headline =
    status === "covered"
      ? "P2 readiness evidence fully covered"
      : status === "blocked"
        ? "P2 readiness evidence blocked"
        : status === "stale"
          ? "P2 readiness evidence stale"
          : "P2 readiness evidence incomplete";

  return {
    status,
    tone,
    headline,
    detail: `${coveredCount}/${totalCount} readiness claims have audit events or local manifests; ${blockingCount} rows still block pre-live confidence.${blockingDetail} Direct order submission remains disabled.`,
    coveredCount,
    totalCount,
    blockingCount,
    orderSubmissionEnabled: false,
    liveTradingAllowed: false,
    rows
  };
}

export function buildP2ManifestChainPreflightReviewEvidenceCoverageRow(
  preflight: P2ManifestChainPreflightSummary,
  reviewRow: AuditEvidenceReportLedgerRow | null | undefined
): P2ReadinessEvidenceCoverageRow {
  const unsafe =
    preflight.state === "invalid" ||
    !preflight.liveBlockedBoundary ||
    preflight.reportedOrderSubmissionEnabled ||
    preflight.reportedLiveTradingAllowed ||
    preflight.reportedLiveOrderSubmitted ||
    preflight.reportedRouteExecuted;
  const validReviewRow =
    reviewRow?.reportKind === "p2_manifest_chain_preflight_review" && reviewRow.status === "ready";
  const status: P2ReadinessEvidenceCoverageStatus = unsafe ? "blocked" : validReviewRow ? "covered" : "missing";

  return {
    id: "p2-manifest-chain-preflight-review",
    label: "P2 manifest chain preflight review",
    status,
    tone: p2EvidenceCoverageTone(status),
    evidence:
      status === "covered"
        ? `Review audited · ${reviewRow?.shortHash ?? "missing"}`
        : status === "blocked"
          ? "Review blocked by unsafe preflight boundary"
          : "Review not recorded",
    detail:
      status === "covered"
        ? `P2 manifest-chain preflight review is recorded for ${preflight.sourcePath} and preserves the live-blocked boundary.`
        : status === "blocked"
          ? "P2 manifest-chain preflight review cannot cover an invalid or unsafe preflight boundary."
          : "Record the P2 manifest-chain preflight review from the Audit workspace before treating the preflight readback as fully reviewed.",
    sourceType: "audit",
    sourceId: status === "covered" ? reviewRow?.id ?? null : null
  };
}

export function buildP2PaperReplayEvidenceCoverageRow(replay: P2PaperReplaySummary): P2ReadinessEvidenceCoverageRow {
  const unsafe = p2ReplayHasUnsafeExecutionClaim(replay);
  const status: P2ReadinessEvidenceCoverageStatus =
    replay.state === "passed" && !unsafe
      ? "covered"
      : replay.state === "missing"
        ? "missing"
        : "blocked";
  const latestEvidence = replay.latestEvidenceId ? ` · latest ${replay.latestEvidenceId}` : "";
  return {
    id: "paper-replay-manifest",
    label: "Paper replay manifest",
    status,
    tone: p2EvidenceCoverageTone(status),
    evidence:
      status === "covered"
        ? `${replay.passedCheckCount}/${replay.totalCheckCount} checks${latestEvidence}`
        : replay.state === "missing"
          ? "Manifest missing"
          : `${replay.passedCheckCount}/${replay.totalCheckCount} checks`,
    detail:
      status === "covered"
        ? "P2 paper replay manifest is present, validates replay checks, and keeps live routing blocked."
        : unsafe
          ? "P2 paper replay manifest has unsafe execution claims or no live-blocked boundary."
          : replay.detail,
    sourceType: "manifest",
    sourceId: replay.sourcePath || null
  };
}

export function buildP2AcceptanceEvidenceCoverageRow(
  acceptance: P2PreLiveAcceptanceSummary
): P2ReadinessEvidenceCoverageRow {
  const unsafe = p2AcceptanceHasUnsafeExecutionClaim(acceptance);
  const status: P2ReadinessEvidenceCoverageStatus =
    acceptance.state === "passed" && !unsafe
      ? "covered"
      : acceptance.state === "missing"
        ? "missing"
        : "blocked";
  return {
    id: "p2-acceptance-manifest",
    label: "P2 acceptance manifest",
    status,
    tone: p2EvidenceCoverageTone(status),
    evidence:
      status === "covered"
        ? `${acceptance.passedGateCount}/${acceptance.totalGateCount} gates`
        : acceptance.state === "missing"
          ? "Manifest missing"
          : `${acceptance.passedGateCount}/${acceptance.totalGateCount} gates`,
    detail:
      status === "covered"
        ? "P2 pre-live acceptance manifest is present and keeps the manual-route boundary intact."
        : unsafe
          ? "P2 acceptance manifest has unsafe execution claims or no live-blocked boundary."
          : acceptance.detail,
    sourceType: "manifest",
    sourceId: acceptance.sourcePath || null
  };
}

export function buildP2OperatorRunbookEvidenceCoverageRow(
  coverage: OperatorRunbookAuditCoverage
): P2ReadinessEvidenceCoverageRow {
  const status: P2ReadinessEvidenceCoverageStatus =
    coverage.status === "matched" ? "covered" : coverage.status === "stale" ? "stale" : "missing";
  const detail =
    status === "covered"
      ? coverage.detail
      : coverage.mismatchLabel
        ? `${coverage.detail} ${coverage.mismatchLabel}`
        : coverage.detail;
  return {
    id: "operator-runbook-audit",
    label: "Operator runbook audit",
    status,
    tone: p2EvidenceCoverageTone(status),
    evidence:
      status === "covered"
        ? `${coverage.statusLabel} · ${coverage.shortHash}`
        : coverage.statusLabel || "Not audited",
    detail,
    sourceType: "audit",
    sourceId: coverage.latestEventId || null
  };
}

export function buildP2PreLiveChecklistEvidenceCoverageRow(
  checklist: PreLiveReadinessChecklist
): P2ReadinessEvidenceCoverageRow {
  const status: P2ReadinessEvidenceCoverageStatus =
    checklist.status === "manual_route_ready" && checklist.blockingCount === 0 ? "covered" : checklist.status === "blocked" ? "blocked" : "missing";
  const nextAction = checklist.nextActionId ? ` Next action: ${checklist.nextActionId}.` : "";
  return {
    id: "pre-live-checklist",
    label: "Pre-live checklist",
    status,
    tone: p2EvidenceCoverageTone(status),
    evidence: `${checklist.passedCount}/${checklist.totalCount} gates`,
    detail:
      status === "covered"
        ? "Local pre-live checklist is complete for manual route review only."
        : `${checklist.summary}${nextAction}`,
    sourceType: "local-state",
    sourceId: checklist.nextActionId ?? "manual-route-ready"
  };
}

export function buildP2AdapterChainEvidenceCoverageRow(
  rollup: ExecutionAdapterChainHealthRollup | null
): P2ReadinessEvidenceCoverageRow {
  if (!rollup) {
    return {
      id: "adapter-chain-health",
      label: "Adapter chain health",
      status: "missing",
      tone: "warning",
      evidence: "No adapter chain evidence",
      detail: "No paper-only live-adapter chain rollup is available for the current route.",
      sourceType: "local-state",
      sourceId: null
    };
  }
  const status: P2ReadinessEvidenceCoverageStatus =
    rollup.status === "paper_ready"
      ? "covered"
      : rollup.status === "blocked"
        ? "blocked"
        : rollup.latestEvidenceId
          ? "stale"
          : "missing";
  return {
    id: "adapter-chain-health",
    label: "Adapter chain health",
    status,
    tone: p2EvidenceCoverageTone(status),
    evidence:
      status === "covered"
        ? `${rollup.completedStageCount}/${rollup.totalStageCount} stages`
        : rollup.blockerLabel || rollup.headline,
    detail:
      status === "covered"
        ? "Adapter chain has complete paper-only evidence and remains blocked from live routing."
        : rollup.detail,
    sourceType: "local-state",
    sourceId: rollup.latestEvidenceId || rollup.latestAuditEventId || rollup.id
  };
}

export function buildP2SafetyBoundaryEvidenceCoverageRow({
  p2PaperReplay,
  p2PreLiveAcceptance,
  primaryAdapterChain
}: {
  p2PaperReplay: P2PaperReplaySummary;
  p2PreLiveAcceptance: P2PreLiveAcceptanceSummary;
  primaryAdapterChain: ExecutionAdapterChainHealthRollup | null;
}): P2ReadinessEvidenceCoverageRow {
  const unsafe =
    p2ReplayHasUnsafeExecutionClaim(p2PaperReplay) ||
    p2AcceptanceHasUnsafeExecutionClaim(p2PreLiveAcceptance) ||
    Boolean(primaryAdapterChain?.orderSubmissionEnabled || primaryAdapterChain?.liveTradingAllowed);
  const hasBoundaryEvidence =
    p2PaperReplay.state === "passed" &&
    p2PreLiveAcceptance.state === "passed" &&
    p2PaperReplay.liveBlockedBoundary &&
    p2PreLiveAcceptance.liveBlockedBoundary &&
    Boolean(primaryAdapterChain);
  const status: P2ReadinessEvidenceCoverageStatus = unsafe
    ? "blocked"
    : hasBoundaryEvidence
      ? "covered"
      : "missing";
  return {
    id: "safety-boundary",
    label: "Safety boundary",
    status,
    tone: p2EvidenceCoverageTone(status),
    evidence:
      status === "covered"
        ? "Live blocked · direct order submission disabled"
        : unsafe
          ? "Unsafe execution claim detected"
          : "Boundary evidence incomplete",
    detail:
      status === "covered"
        ? "All P2 readiness evidence keeps order submission, live orders, route execution, and live trading blocked."
        : unsafe
          ? "One or more P2 evidence sources reports unsafe execution flags or a missing live-blocked boundary."
          : "Safety boundary needs both P2 manifests and an adapter-chain rollup before pre-live confidence is complete.",
    sourceType: "safety-boundary",
    sourceId: primaryAdapterChain?.latestEvidenceId ?? p2PaperReplay.latestEvidenceId ?? p2PreLiveAcceptance.runId
  };
}

export function p2EvidenceCoverageTone(
  status: P2ReadinessEvidenceCoverageStatus
): P2ReadinessEvidenceCoverageTone {
  return status === "covered" ? "positive" : status === "blocked" ? "risk" : "warning";
}

export function p2ReplayHasUnsafeExecutionClaim(replay: P2PaperReplaySummary): boolean {
  return (
    replay.state === "invalid" ||
    replay.reportedOrderSubmissionEnabled ||
    replay.reportedLiveTradingAllowed ||
    replay.reportedLiveOrderSubmitted ||
    replay.reportedRouteExecuted ||
    !replay.liveBlockedBoundary
  );
}

export function p2AcceptanceHasUnsafeExecutionClaim(acceptance: P2PreLiveAcceptanceSummary): boolean {
  return (
    acceptance.state === "invalid" ||
    acceptance.reportedOrderSubmissionEnabled ||
    acceptance.reportedLiveTradingAllowed ||
    acceptance.reportedLiveOrderSubmitted ||
    acceptance.reportedRouteExecuted ||
    !acceptance.liveBlockedBoundary
  );
}

export function buildP2ReadinessAcceptanceSummary({
  evidenceCoverage,
  evidenceCoverageReviewAuditEventId,
  p1Acceptance,
  p2PaperReplay,
  p2PreLiveAcceptance,
  preLiveChecklist
}: P2ReadinessAcceptanceSummaryInput): P2ReadinessAcceptanceSummary {
  const normalizedEvidenceCoverageReviewAuditEventId = evidenceCoverageReviewAuditEventId?.trim() ?? "";
  const rows: P2ReadinessAcceptanceRow[] = [
    buildP2AcceptanceP1Row(p1Acceptance),
    buildP2AcceptancePaperReplayRow(p2PaperReplay),
    buildP2AcceptancePreLiveChecklistRow(preLiveChecklist),
    buildP2AcceptancePreLiveManifestRow(p2PreLiveAcceptance),
    buildP2ReadinessAcceptanceEvidenceCoverageRow(
      evidenceCoverage,
      normalizedEvidenceCoverageReviewAuditEventId
    ),
    buildP2AcceptanceLiveBoundaryRow({
      evidenceCoverage,
      p1Acceptance,
      p2PaperReplay,
      p2PreLiveAcceptance
    })
  ];
  const acceptedCount = rows.filter((row) => row.status === "passed").length;
  const totalCount = rows.length;
  const blockingCount = rows.filter((row) => row.status !== "passed").length;
  const status: P2ReadinessAcceptanceStatus = rows.some((row) => row.status === "blocked")
    ? "blocked"
    : acceptedCount === totalCount
      ? "accepted"
      : "incomplete";
  const tone: P2ReadinessAcceptanceTone =
    status === "accepted" ? "positive" : status === "blocked" ? "risk" : "warning";
  return {
    status,
    tone,
    headline:
      status === "accepted"
        ? "P2 pre-live readiness accepted"
        : status === "blocked"
          ? "P2 pre-live readiness blocked"
          : "P2 pre-live readiness incomplete",
    detail: `${acceptedCount}/${totalCount} P2 acceptance criteria passed; ${blockingCount} criteria still block final pre-live acceptance. Direct order submission and live trading remain disabled.`,
    evidenceCoverageReviewAuditEventId: normalizedEvidenceCoverageReviewAuditEventId,
    acceptedCount,
    totalCount,
    blockingCount,
    orderSubmissionEnabled: false,
    liveTradingAllowed: false,
    liveOrderSubmitted: false,
    routeExecuted: false,
    rows
  };
}

export function buildP2AcceptanceP1Row(p1Acceptance: P1AcceptanceSummary): P2ReadinessAcceptanceRow {
  const unsafe = p1AcceptanceHasUnsafeExecutionClaim(p1Acceptance);
  const status: P2ReadinessAcceptanceRowStatus =
    p1Acceptance.state === "passed" && !unsafe
      ? "passed"
      : p1Acceptance.state === "missing"
        ? "missing"
        : "blocked";
  return {
    id: "p1-acceptance",
    label: "P1 accepted research workflow",
    status,
    tone: p2ReadinessAcceptanceRowTone(status),
    evidence:
      status === "passed"
        ? `${p1Acceptance.checkCount}/${p1Acceptance.requiredCheckCount} checks · ${p1Acceptance.runId || "latest run"}`
        : p1Acceptance.state === "missing"
          ? "P1 acceptance missing"
          : "P1 acceptance unsafe",
    detail:
      status === "passed"
        ? "A P1 research-ops workflow is accepted and keeps the live boundary closed."
        : unsafe
          ? "P1 acceptance evidence has unsafe live-trading claims or lacks a live-blocked boundary."
          : p1Acceptance.detail,
    sourceId: p1Acceptance.sourcePath
  };
}

export function buildP2AcceptancePaperReplayRow(replay: P2PaperReplaySummary): P2ReadinessAcceptanceRow {
  const unsafe = p2ReplayHasUnsafeExecutionClaim(replay);
  const status: P2ReadinessAcceptanceRowStatus =
    replay.state === "passed" && !unsafe ? "passed" : replay.state === "missing" ? "missing" : "blocked";
  return {
    id: "paper-execution-replay",
    label: "Paper execution replay",
    status,
    tone: p2ReadinessAcceptanceRowTone(status),
    evidence:
      status === "passed"
        ? `${replay.passedCheckCount}/${replay.totalCheckCount} checks`
        : replay.state === "missing"
          ? "Replay manifest missing"
          : "Replay manifest unsafe",
    detail:
      status === "passed"
        ? "Paper-only execution can be replayed from stored evidence."
        : unsafe
          ? "Paper replay evidence has unsafe execution flags or lacks a live-blocked boundary."
          : replay.detail,
    sourceId: replay.latestEvidenceId ?? replay.sourcePath
  };
}

export function buildP2AcceptancePreLiveChecklistRow(
  checklist: PreLiveReadinessChecklist
): P2ReadinessAcceptanceRow {
  const status: P2ReadinessAcceptanceRowStatus =
    checklist.status === "manual_route_ready" && checklist.blockingCount === 0
      ? "passed"
      : checklist.status === "blocked"
        ? "blocked"
        : "missing";
  return {
    id: "pre-live-checklist",
    label: "Pre-live checklist",
    status,
    tone: p2ReadinessAcceptanceRowTone(status),
    evidence: `${checklist.passedCount}/${checklist.totalCount} gates`,
    detail:
      status === "passed"
        ? "Pre-live checklist is complete for manual route review only."
        : checklist.summary,
    sourceId: checklist.nextActionId ?? "manual-route-ready"
  };
}

export function buildP2AcceptancePreLiveManifestRow(
  acceptance: P2PreLiveAcceptanceSummary
): P2ReadinessAcceptanceRow {
  const unsafe = p2AcceptanceHasUnsafeExecutionClaim(acceptance);
  const status: P2ReadinessAcceptanceRowStatus =
    acceptance.state === "passed" && !unsafe
      ? "passed"
      : acceptance.state === "missing"
        ? "missing"
        : "blocked";
  return {
    id: "p2-pre-live-manifest",
    label: "P2 pre-live acceptance manifest",
    status,
    tone: p2ReadinessAcceptanceRowTone(status),
    evidence:
      status === "passed"
        ? `${acceptance.passedGateCount}/${acceptance.totalGateCount} gates`
        : acceptance.state === "missing"
          ? "P2 manifest missing"
          : "P2 manifest unsafe",
    detail:
      status === "passed"
        ? "P2 pre-live manifest is valid and records the live-blocked boundary."
        : unsafe
          ? "P2 pre-live manifest has unsafe execution flags or lacks a live-blocked boundary."
          : acceptance.detail,
    sourceId: acceptance.sourcePath
  };
}

export function buildP2ReadinessAcceptanceEvidenceCoverageRow(
  coverage: P2ReadinessEvidenceCoverage,
  coverageReviewAuditEventId = ""
): P2ReadinessAcceptanceRow {
  const status: P2ReadinessAcceptanceRowStatus =
    coverage.status === "covered" && coverage.blockingCount === 0
      ? "passed"
      : coverage.status === "blocked" || coverage.status === "stale"
        ? "blocked"
        : "missing";
  const claimsEvidence = `${coverage.coveredCount}/${coverage.totalCount} claims covered`;
  return {
    id: "readiness-evidence-coverage",
    label: "Readiness evidence coverage",
    status,
    tone: p2ReadinessAcceptanceRowTone(status),
    evidence:
      status === "passed" && coverageReviewAuditEventId
        ? `${claimsEvidence} · review ${coverageReviewAuditEventId.slice(-12)}`
        : claimsEvidence,
    detail:
      status === "passed"
        ? coverageReviewAuditEventId
          ? "Every P2 readiness claim is traceable and the current coverage review is recorded in Audit."
          : "Every P2 readiness claim is traceable to audit evidence, a manifest, or local state."
        : coverage.detail,
    sourceId: coverageReviewAuditEventId || "P2 evidence coverage matrix"
  };
}

export function buildP2AcceptanceLiveBoundaryRow({
  evidenceCoverage,
  p1Acceptance,
  p2PaperReplay,
  p2PreLiveAcceptance
}: {
  evidenceCoverage: P2ReadinessEvidenceCoverage;
  p1Acceptance: P1AcceptanceSummary;
  p2PaperReplay: P2PaperReplaySummary;
  p2PreLiveAcceptance: P2PreLiveAcceptanceSummary;
}): P2ReadinessAcceptanceRow {
  const unsafe =
    p1AcceptanceHasUnsafeExecutionClaim(p1Acceptance) ||
    p2ReplayHasUnsafeExecutionClaim(p2PaperReplay) ||
    p2AcceptanceHasUnsafeExecutionClaim(p2PreLiveAcceptance) ||
    evidenceCoverage.status === "blocked";
  const status: P2ReadinessAcceptanceRowStatus = unsafe ? "blocked" : "passed";
  return {
    id: "live-blocked-boundary",
    label: "Live-blocked boundary",
    status,
    tone: p2ReadinessAcceptanceRowTone(status),
    evidence: status === "passed" ? "Live blocked · no order route" : "Unsafe execution flags detected",
    detail:
      status === "passed"
        ? "P2 acceptance keeps order submission, live orders, route execution, and live trading disabled."
        : "One or more acceptance inputs reports unsafe execution flags or a missing live-blocked boundary.",
    sourceId: "forced-platform-boundary"
  };
}

export function p2ReadinessAcceptanceRowTone(status: P2ReadinessAcceptanceRowStatus): P2ReadinessAcceptanceTone {
  return status === "passed" ? "positive" : status === "blocked" ? "risk" : "warning";
}

export function p1AcceptanceHasUnsafeExecutionClaim(acceptance: P1AcceptanceSummary): boolean {
  return acceptance.state === "invalid" || acceptance.reportedLiveTradingAllowed || !acceptance.liveBlockedBoundary;
}
