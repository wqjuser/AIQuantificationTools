import {
  buildP0CurrentGapActionUrlSearch,
  isExecutableP0CurrentGapActionId,
  normalizeP0CurrentGapActionId,
  type ExecutionAdapterPreLiveRunbookSummary,
  type Market,
  type MarketDataRefreshGuard,
  type OperatorRunbookSummary,
  type P0CompletionChecklist,
  type P0PaperExecutionPreflight,
  type P0PlatformActionOutcome,
  type P0PlatformActionOutcomeEvidenceLink,
  type P0PlatformBacklogItem,
  type P0PlatformReadinessSummary,
  type ResearchContextReadinessReportArchive,
  type TerminalWorkspace
} from "./terminal-workbench";
import type { ResearchTimeframe } from "./workspace-transport";
import type { AuditEventRecord } from "./terminal-api-contract";
import type { AuditSigningKeyRotationApply, AuditSigningKeyRotationPlan } from "./audit-signing-key-transport";
import { sanitizeDownloadFileName, sha256TextHex } from "./research-run-report-artifacts";

export function buildMarketDataRefreshOverrideAuditEvent({
  actionScope = "manual_cache_refresh",
  createdAt = new Date().toISOString(),
  guard,
  market,
  name = "",
  operator = "local-operator",
  reason,
  symbol,
  timeframe
}: {
  actionScope?: "current_cache_refresh" | "watchlist_cache_refresh" | "manual_cache_refresh";
  createdAt?: string;
  guard: MarketDataRefreshGuard;
  market: Market;
  name?: string;
  operator?: string;
  reason: string;
  symbol: string;
  timeframe: ResearchTimeframe;
}): AuditEventRecord {
  const overrideReason = reason.trim();
  if (!overrideReason) {
    throw new Error("market_data_refresh_override_reason_required");
  }
  const normalizedOperator = operator.trim() || "local-operator";
  const affectedSymbols = guard.affectedSymbols.slice(0, 8);
  const affectedContexts = guard.affectedContexts.slice(0, 8);
  const affectedLabel = affectedSymbols.length ? affectedSymbols.slice(0, 3).join("/") : "current market";
  const safeCreatedAt = sanitizeDownloadFileName(createdAt);
  const safeReason = sanitizeDownloadFileName(overrideReason).slice(0, 32);

  return {
    schemaVersion: 1,
    eventId: `market-data-refresh-override-${sanitizeDownloadFileName(market)}-${sanitizeDownloadFileName(
      symbol
    )}-${sanitizeDownloadFileName(timeframe)}-${safeCreatedAt}-${safeReason}`,
    eventType: "market_data_refresh_override",
    runId: null,
    createdAt,
    stage: "override_recorded",
    source: "web",
    summary: `Market data refresh override recorded for ${market.toUpperCase()} ${symbol} ${timeframe}`,
    detail: `${actionScope} override by ${normalizedOperator}: ${overrideReason}; original retry after ${
      guard.retryAfterSeconds
    }s; affected ${affectedLabel}.`,
    metadata: {
      actionScope,
      affectedContexts,
      affectedSymbols,
      artifactKind: "aiqt.marketDataRefreshOverride",
      boundary: "manual market-data refresh override only; no trading authorization or investment advice",
      liveTradingAllowed: false,
      market,
      name,
      operator: normalizedOperator,
      overrideApplied: guard.overrideApplied,
      overrideReason,
      providerHealthReason: guard.reason,
      providerHealthStatus: guard.status,
      recentErrorCount: guard.recentErrorCount,
      retryAfterSeconds: guard.retryAfterSeconds,
      symbol,
      timeframe
    }
  };
}

export async function buildP0PlatformReadinessReportAuditEvent({
  backlogItems,
  evidenceLink = null,
  generatedAt = new Date().toISOString(),
  markdown,
  outcome,
  paperPreflight = null,
  summary,
  completionChecklist = null
}: {
  backlogItems: readonly P0PlatformBacklogItem[];
  completionChecklist?: P0CompletionChecklist | null;
  evidenceLink?: P0PlatformActionOutcomeEvidenceLink | null;
  generatedAt?: string;
  markdown: string;
  outcome: P0PlatformActionOutcome;
  paperPreflight?: P0PaperExecutionPreflight | null;
  summary: P0PlatformReadinessSummary;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const runId = outcome.runId?.trim() || outcome.evidenceId?.trim() || "p0-readiness";
  const safeRunId = sanitizeDownloadFileName(runId);
  const fileName = `${safeRunId}-p0-readiness-report.md`;
  const currentGap = summary.currentGap;
  const firstBacklogItem = backlogItems[0] ?? null;
  const backlogReadiness = backlogItems.map((item) =>
    buildP0ReportActionReadiness(item.actionId, item.targetWorkspaceId || item.workspaceId || "")
  );
  const firstBacklogReadiness = firstBacklogItem ? backlogReadiness[0] : null;
  const backlogExecutableCount = backlogReadiness.filter((item) => item.canExecute).length;
  const backlogNotExecutableCount = backlogReadiness.filter((item) => !item.canExecute).length;
  const backlogReadinessSummary = buildP0ReportBacklogReadinessSummary(
    backlogItems.length,
    backlogExecutableCount,
    backlogNotExecutableCount,
    firstBacklogItem,
    firstBacklogReadiness
  );
  const completionSummary = buildP0ReportCompletionSummary(completionChecklist);
  const paperPreflightGates = paperPreflight?.gates ?? [];
  const paperPreflightLiveBoundary = paperPreflightGates.find((gate) => gate.id === "live-boundary");
  const currentGapTargetWorkspaceId = currentGap?.targetWorkspaceId || currentGap?.workspaceId || "";
  const currentGapActionId = currentGap?.actionId?.trim() ?? "";
  const currentGapReadiness = buildP0ReportActionReadiness(currentGapActionId, currentGapTargetWorkspaceId);
  const currentGapDeepLinkParams = new URLSearchParams();
  currentGapDeepLinkParams.set("workspace", currentGapTargetWorkspaceId);
  currentGapDeepLinkParams.set(
    "auditReportQuery",
    ["p0_readiness_report", runId, currentGap?.actionId ?? "", currentGapTargetWorkspaceId].filter(Boolean).join(" ")
  );
  currentGapDeepLinkParams.set("p0Action", currentGap?.actionId ?? "");
  const currentGapDeepLinkSearch = buildP0CurrentGapActionUrlSearch(currentGapDeepLinkParams) ?? "";

  return {
    schemaVersion: 1,
    eventId: `p0-readiness-report-${safeRunId}-${shortHash}`,
    eventType: "p0_readiness_report",
    runId,
    createdAt: generatedAt,
    stage: "generated",
    source: "web",
    summary: "P0 readiness report generated",
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${summary.passedSteps}/${
      summary.totalSteps
    } steps · current gap ${currentGap?.label ?? "none"} · backlog ${backlogReadinessSummary} · completion ${completionSummary}`,
    metadata: {
      artifactKind: "aiqt.p0ReadinessReport",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      state: summary.state,
      progressPct: summary.progressPct,
      passedSteps: summary.passedSteps,
      totalSteps: summary.totalSteps,
      reviewSteps: summary.reviewSteps,
      blockedSteps: summary.blockedSteps,
      openStepCount: summary.openStepCount,
      currentGapStepId: currentGap?.stepId ?? "",
      currentGapLabel: currentGap?.label ?? "",
      currentGapStatus: currentGap?.status ?? "",
      currentGapWorkspaceId: currentGap?.workspaceId ?? "",
      currentGapActionId: currentGap?.actionId ?? "",
      currentGapActionLabel: currentGap?.actionLabel ?? "",
      currentGapTargetWorkspaceId: currentGap?.targetWorkspaceId ?? "",
      currentGapCanExecute: currentGapReadiness.canExecute,
      currentGapDeepLinkSearch,
      currentGapExecutableActionId: currentGapReadiness.executableActionId,
      currentGapReadinessReason: currentGapReadiness.reason,
      completionBlockedCount: completionChecklist?.blocked ?? 0,
      completionCurrentCriterionActionLabel: completionChecklist?.currentGap?.actionLabel ?? "",
      completionCurrentCriterionId: completionChecklist?.currentGap?.id ?? "",
      completionCurrentCriterionLabel: completionChecklist?.currentGap?.label ?? "",
      completionCurrentCriterionStatus: completionChecklist?.currentGap?.status ?? "",
      completionCurrentCriterionTargetWorkspaceId: completionChecklist?.currentGap?.targetWorkspaceId ?? "",
      completionOpenCriterionIds: completionChecklist?.openCriteria.map((criterion) => criterion.id).join(",") ?? "",
      completionPassedCount: completionChecklist?.passed ?? 0,
      completionProgressPct: completionChecklist?.progressPct ?? 0,
      completionReviewCount: completionChecklist?.review ?? 0,
      completionSummary,
      completionTotalCount: completionChecklist?.total ?? 0,
      latestEvidenceState: outcome.state,
      latestEvidenceId: outcome.evidenceId ?? outcome.runId ?? "",
      latestEvidenceLink: evidenceLink?.search ?? "",
      latestEvidencePreparationRunId: outcome.preparationEvidenceRunId ?? "",
      backlogCount: backlogItems.length,
      backlogExecutableCount,
      backlogNotExecutableCount,
      backlogReadinessSummary,
      firstBacklogCanExecute: firstBacklogReadiness?.canExecute ?? false,
      firstBacklogExecutableActionId: firstBacklogReadiness?.executableActionId ?? "",
      firstBacklogReadinessReason: firstBacklogReadiness?.reason ?? "missing-action",
      firstBacklogStepId: firstBacklogItem?.stepId ?? "",
      paperPreflightState: paperPreflight?.state ?? "",
      paperPreflightActionId: paperPreflight?.primaryActionId ?? "",
      paperPreflightActionLabel: paperPreflight?.primaryActionLabel ?? "",
      paperPreflightGateTotal: paperPreflightGates.length,
      paperPreflightGatePassedCount: paperPreflightGates.filter((gate) => gate.status === "passed").length,
      paperPreflightGateReviewCount: paperPreflightGates.filter((gate) => gate.status === "review").length,
      paperPreflightGateBlockedCount: paperPreflightGates.filter((gate) => gate.status === "blocked").length,
      paperPreflightLiveBoundary: paperPreflightLiveBoundary?.value ?? "",
      liveTradingAllowed: summary.liveBoundary.liveTradingAllowed,
      liveBoundary: summary.liveBoundary.label,
      boundary: "P0 readiness audit aid only; no live trading authorization or investment advice"
    }
  };
}

function buildP0ReportBacklogReadinessSummary(
  backlogCount: number,
  executableCount: number,
  notExecutableCount: number,
  firstBacklogItem: P0PlatformBacklogItem | null,
  firstBacklogReadiness: ReturnType<typeof buildP0ReportActionReadiness> | null
): string {
  const firstAction =
    firstBacklogReadiness?.executableActionId ||
    firstBacklogItem?.actionId?.trim() ||
    firstBacklogReadiness?.reason ||
    "none";
  const firstReason = firstBacklogReadiness?.reason ?? "none";
  return `${executableCount}/${backlogCount} executable, ${notExecutableCount} not executable · first ${firstAction} ${firstReason}`;
}

function buildP0ReportCompletionSummary(checklist: P0CompletionChecklist | null | undefined): string {
  if (!checklist) {
    return "not recorded";
  }
  const current = checklist.currentGap
    ? `current ${checklist.currentGap.id} ${checklist.currentGap.status}`
    : "current none";
  return `${checklist.passed}/${checklist.total} passed, ${checklist.review} review, ${checklist.blocked} blocked · ${current}`;
}

function buildP0ReportActionReadiness(actionId: string | null | undefined, workspaceId: string | null | undefined): {
  canExecute: boolean;
  executableActionId: string;
  reason: "missing-action" | "missing-workspace" | "ready" | "unknown-action";
} {
  const normalizedActionId = actionId?.trim() ?? "";
  const executableActionId = normalizeP0CurrentGapActionId(normalizedActionId);
  if (!normalizedActionId) {
    return { canExecute: false, executableActionId, reason: "missing-action" };
  }
  if (!isExecutableP0CurrentGapActionId(normalizedActionId)) {
    return { canExecute: false, executableActionId, reason: "unknown-action" };
  }
  if (!workspaceId?.trim()) {
    return { canExecute: false, executableActionId, reason: "missing-workspace" };
  }
  return { canExecute: true, executableActionId, reason: "ready" };
}

export function buildResearchContextReadinessReportAuditEvent(
  archive: ResearchContextReadinessReportArchive
): AuditEventRecord {
  const shortHash = archive.contentSha256.hash.slice(0, 16);
  const contextTokens = [
    sanitizeDownloadFileName(archive.context.market),
    sanitizeDownloadFileName(archive.context.symbol),
    sanitizeDownloadFileName(archive.context.timeframe)
  ];
  const runId = archive.lockedPreparationEvidenceRunId?.trim() || null;

  return {
    schemaVersion: 1,
    eventId: `research-context-readiness-report-${contextTokens.join("-")}-${shortHash}`,
    eventType: "research_context_readiness_report",
    runId,
    createdAt: archive.generatedAt,
    stage: "generated",
    source: "web",
    summary: "Research context readiness report generated",
    detail: `${archive.fileName} · sha256 ${archive.contentSha256.hash.slice(0, 12)} · ${archive.context.market.toUpperCase()} ${
      archive.context.symbol
    } ${archive.context.timeframe} · preflight ${archive.preflightStatus} · ready ${archive.readinessCounts.ready}/${
      archive.readinessCounts.review
    }/${archive.readinessCounts.blocked} · prep ${runId ?? "none"}`,
    metadata: {
      artifactKind: "aiqt.researchContextReadinessReport",
      fileName: archive.fileName,
      format: "text/markdown",
      contentSha256: archive.contentSha256.hash,
      contentSha256Algorithm: archive.contentSha256.algorithm,
      market: archive.context.market,
      symbol: archive.context.symbol,
      timeframe: archive.context.timeframe,
      preflightStatus: archive.preflightStatus,
      nextAction: archive.nextAction,
      lockedPreparationEvidenceRunId: archive.lockedPreparationEvidenceRunId ?? "",
      readinessReadyCount: archive.readinessCounts.ready,
      readinessReviewCount: archive.readinessCounts.review,
      readinessBlockedCount: archive.readinessCounts.blocked,
      contextLink: archive.contextLink ?? "",
      liveTradingAllowed: false,
      boundary: "research context readiness evidence only; no order routing, investment advice, or live trading authorization"
    }
  };
}

export async function buildExecutionAdapterPreLiveRunbookAuditEvent({
  generatedAt = new Date().toISOString(),
  markdown,
  runbook,
  workspace
}: {
  generatedAt?: string;
  markdown: string;
  runbook: ExecutionAdapterPreLiveRunbookSummary;
  workspace: TerminalWorkspace;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const symbol = workspace.selectedInstrument.symbol;
  const timeframe = workspace.selectedTimeframe;
  const safeAdapterId = sanitizeDownloadFileName(runbook.adapterId);
  const safeSymbol = sanitizeDownloadFileName(symbol);
  const safeTimeframe = sanitizeDownloadFileName(timeframe);
  const fileName = `${safeAdapterId}-${safeSymbol}-${safeTimeframe}-pre-live-runbook.md`;
  const evidenceIds = runbook.rows.map((row) => row.evidenceId).filter((id): id is string => Boolean(id));
  const reviewSteps = runbook.rows.filter((row) => row.status === "review").length;
  const blockedSteps = runbook.rows.filter((row) => row.status === "blocked").length;

  return {
    schemaVersion: 1,
    eventId: `pre-live-runbook-report-${safeAdapterId}-${safeSymbol}-${safeTimeframe}-${shortHash}`,
    eventType: "pre_live_runbook_report",
    runId: null,
    createdAt: generatedAt,
    stage: "generated",
    source: "web",
    summary: `Pre-live runbook report generated for ${runbook.adapterId}`,
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${runbook.completedSteps}/${
      runbook.totalSteps
    } gates · ${runbook.status} · next ${runbook.nextStepId ?? "review"}`,
    metadata: {
      adapterId: runbook.adapterId,
      artifactKind: "aiqt.preLiveRunbookReport",
      boundary: "Pre-live runbook audit evidence only; no live trading authorization, order submission, or investment advice",
      completedSteps: runbook.completedSteps,
      contentSha256,
      contentSha256Algorithm: "sha256",
      evidenceIds,
      fileName,
      format: "text/markdown",
      gateRows: runbook.rows.map((row) => ({
        detail: row.detail,
        evidenceId: row.evidenceId ?? "",
        evidenceTimestamp: row.evidenceTimestamp ?? "",
        id: row.id,
        label: row.label,
        nextStep: row.nextStep,
        status: row.status,
        value: row.value
      })),
      liveTradingAllowed: false,
      market: runbook.market,
      nextStep: runbook.nextStep,
      nextStepId: runbook.nextStepId ?? "",
      reviewSteps,
      blockedSteps,
      status: runbook.status,
      symbol,
      timeframe,
      totalSteps: runbook.totalSteps
    }
  };
}

export async function buildOperatorRunbookAuditEvent({
  generatedAt = new Date().toISOString(),
  markdown,
  runbook,
  workspace
}: {
  generatedAt?: string;
  markdown: string;
  runbook: OperatorRunbookSummary;
  workspace: TerminalWorkspace;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const market = workspace.selectedInstrument.market;
  const symbol = workspace.selectedInstrument.symbol;
  const timeframe = workspace.selectedTimeframe;
  const safeAdapterId = sanitizeDownloadFileName(runbook.adapterId);
  const safeSymbol = sanitizeDownloadFileName(symbol);
  const safeTimeframe = sanitizeDownloadFileName(timeframe);
  const fileName = `${safeAdapterId}-${safeSymbol}-${safeTimeframe}-operator-runbook.md`;
  const sectionIds = runbook.sections.map((section) => section.id);
  const sectionStatuses = runbook.sections.map((section) => `${section.id}:${section.status}`);
  const sectionEvidence = runbook.sections.map((section) => `${section.id}:${section.evidence}`);
  const controlSnapshot = buildOperatorRunbookControlSnapshot(runbook);

  return {
    schemaVersion: 1,
    eventId: `operator-runbook-report-${safeAdapterId}-${safeSymbol}-${safeTimeframe}-${shortHash}`,
    eventType: "operator_runbook_report",
    runId: null,
    createdAt: generatedAt,
    stage: "generated",
    source: "web",
    summary: `Operator runbook report generated for ${runbook.adapterId}`,
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${runbook.completedSections}/${
      runbook.totalSections
    } sections · ${runbook.status} · next ${runbook.nextActionId ?? "review"}`,
    metadata: {
      adapterId: runbook.adapterId,
      artifactKind: "aiqt.operatorRunbookReport",
      auditPackage: runbook.controls.auditPackage,
      boundary:
        "Operator runbook audit evidence only; no live trading authorization, order submission, route execution, or investment advice",
      completedSections: runbook.completedSections,
      contentSha256,
      contentSha256Algorithm: "sha256",
      controlSnapshot,
      dataFreshness: runbook.controls.dataFreshness,
      environmentState: runbook.controls.environmentState,
      fileName,
      format: "text/markdown",
      killSwitch: runbook.controls.killSwitch,
      liveOrderSubmitted: false,
      liveTradingAllowed: false,
      market,
      nextAction: runbook.nextAction,
      nextActionId: runbook.nextActionId ?? "",
      orderSubmissionEnabled: false,
      positionLimit: runbook.controls.positionLimit,
      rollbackOwner: runbook.controls.rollbackOwner,
      routeExecuted: false,
      sectionEvidence,
      sectionIds,
      sectionStatuses,
      status: runbook.status,
      symbol,
      timeframe,
      totalSections: runbook.totalSections
    }
  };
}

function buildOperatorRunbookControlSnapshot(runbook: OperatorRunbookSummary): string[] {
  return [
    `killSwitch=${runbook.controls.killSwitch}`,
    `rollbackOwner=${runbook.controls.rollbackOwner}`,
    `positionLimit=${runbook.controls.positionLimit}`,
    `dataFreshness=${runbook.controls.dataFreshness}`,
    `environmentState=${runbook.controls.environmentState}`,
    `auditPackage=${runbook.controls.auditPackage}`
  ];
}

export async function buildAuditSigningKeyRotationPlanAuditEvent(
  rotationPlan: AuditSigningKeyRotationPlan
): Promise<AuditEventRecord> {
  const legacyRegistryTemplateSha256 = await sha256TextHex(rotationPlan.legacyRegistryTemplate);
  const proposedKeyId = rotationPlan.proposedActiveKey.keyId;
  const shortTemplateHash = legacyRegistryTemplateSha256.slice(0, 12);
  const secretPlaceholderNames = rotationPlan.environmentUpdates
    .filter((update) => update.sensitivity === "secret")
    .map((update) => update.name);
  const blocked = rotationPlan.blockedReasons.length > 0;
  return {
    schemaVersion: 1,
    eventId: `audit-signing-key-rotation-${sanitizeDownloadFileName(proposedKeyId)}-${shortTemplateHash}`,
    eventType: "audit_signing_key_rotation_plan",
    runId: "audit-signing-key-rotation",
    createdAt: rotationPlan.generatedAt,
    stage: blocked ? "blocked" : "prepared",
    source: "web",
    summary: `Audit signing key rotation plan prepared for ${proposedKeyId}`,
    detail: `${rotationPlan.currentActiveKey.keyId} -> ${proposedKeyId} · legacy template sha256 ${shortTemplateHash} · ${
      rotationPlan.requiresRestart ? "restart required" : "no restart"
    }`,
    metadata: {
      currentKeyId: rotationPlan.currentActiveKey.keyId,
      currentKeyFingerprint: rotationPlan.currentActiveKey.fingerprint,
      proposedKeyId,
      proposedSigner: rotationPlan.proposedActiveKey.signer,
      proposedChainId: rotationPlan.proposedActiveKey.chainId,
      rotationRequired: rotationPlan.rotationRequired,
      requiresRestart: rotationPlan.requiresRestart,
      environmentUpdateNames: rotationPlan.environmentUpdates.map((update) => update.name),
      secretPlaceholderNames,
      legacyRegistryTemplateSha256,
      stepIds: rotationPlan.steps.map((step) => step.id),
      blockedReasons: rotationPlan.blockedReasons.slice()
    }
  };
}

export async function buildAuditSigningKeyRotationApplyAuditEvent(
  rotationApply: AuditSigningKeyRotationApply
): Promise<AuditEventRecord> {
  const digest = await sha256TextHex(
    JSON.stringify({
      blockedReasons: rotationApply.blockedReasons,
      generatedAt: rotationApply.generatedAt,
      proposedActiveKeyId: rotationApply.proposedActiveKeyId,
      requiredConfirmations: rotationApply.requiredConfirmations.map((confirmation) => [
        confirmation.id,
        confirmation.status
      ]),
      status: rotationApply.status
    })
  );
  const shortHash = digest.slice(0, 12);
  const missingConfirmationIds = rotationApply.requiredConfirmations
    .filter((confirmation) => confirmation.status === "missing")
    .map((confirmation) => confirmation.id);
  const confirmedConfirmationIds = rotationApply.requiredConfirmations
    .filter((confirmation) => confirmation.status === "confirmed")
    .map((confirmation) => confirmation.id);
  const blocked = rotationApply.status === "blocked";
  return {
    schemaVersion: 1,
    eventId: `audit-signing-key-rotation-apply-${sanitizeDownloadFileName(
      rotationApply.proposedActiveKeyId || "unknown"
    )}-${shortHash}`,
    eventType: "audit_signing_key_rotation_apply",
    runId: "audit-signing-key-rotation",
    createdAt: rotationApply.generatedAt,
    stage: rotationApply.status,
    source: "web",
    summary: `Audit signing key rotation apply ${blocked ? "blocked" : "ready"} for ${
      rotationApply.proposedActiveKeyId || "unknown"
    }`,
    detail: `${rotationApply.currentActiveKeyId} -> ${
      rotationApply.proposedActiveKeyId || "unknown"
    } · ${rotationApply.applyMode} · ${blocked ? rotationApply.blockedReasons.join(" / ") : "ready for restart"}`,
    metadata: {
      applyMode: rotationApply.applyMode,
      auditEventType: rotationApply.auditEventType,
      blockedReasons: rotationApply.blockedReasons.slice(),
      confirmedConfirmationIds,
      currentActiveKeyFingerprint: rotationApply.currentActiveKeyFingerprint,
      currentActiveKeyId: rotationApply.currentActiveKeyId,
      environmentUpdateNames: rotationApply.environmentUpdateNames.slice(),
      missingConfirmationIds,
      proposedActiveKeyId: rotationApply.proposedActiveKeyId,
      proposedChainId: rotationApply.proposedChainId,
      proposedSigner: rotationApply.proposedSigner,
      restartRequired: rotationApply.restartRequired,
      secretPlaceholderNames: rotationApply.secretPlaceholderNames.slice(),
      status: rotationApply.status
    }
  };
}
