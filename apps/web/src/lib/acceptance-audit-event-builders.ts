import type {
  DailyOpsControlRoomSummary,
  DailyStartBrief,
  P0AcceptanceSummary,
  P0AcceptanceSummarySource,
  P2ManifestChainPreflightSummary,
  P2ManifestChainPreflightSummarySource,
  P2ReadinessAcceptanceReviewSource,
  P2ReadinessAcceptanceSummary,
  P2ReadinessEvidenceCoverage,
  PersonalTeamUsabilityReadinessSummary,
  Stage1BootstrapPreflightSummaryCheckSource,
  Stage1BootstrapPreflightSummarySource,
  Stage1P0DailyUseArchiveBundle
} from "./terminal-workbench";
import type { AuditEventRecord } from "./terminal-api-contract";
import { sanitizeDownloadFileName, sha256TextHex } from "./research-run-report-artifacts";

export async function buildP0AcceptanceReviewAuditEvent({
  acceptance,
  generatedAt = new Date().toISOString(),
  markdown,
  summary
}: {
  acceptance: P0AcceptanceSummarySource | null | undefined;
  generatedAt?: string;
  markdown: string;
  summary: P0AcceptanceSummary;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const runId = summary.runId?.trim() || acceptance?.runId?.trim() || "p0-acceptance";
  const safeRunId = sanitizeDownloadFileName(runId);
  const fileName = `${safeRunId}-p0-acceptance-review.md`;
  const checkIds =
    acceptance?.checkIds.length
      ? acceptance.checkIds
      : summary.state === "missing"
        ? ["p0_acceptance_manifest_missing"]
        : ["p0_acceptance_manifest_invalid"];

  return {
    schemaVersion: 1,
    eventId: `p0-acceptance-review-${safeRunId}-${shortHash}`,
    eventType: "p0_acceptance_review",
    runId,
    createdAt: generatedAt,
    stage: summary.state,
    source: "web",
    summary: "P0 acceptance review recorded",
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${summary.checkCount}/${
      summary.requiredCheckCount
    } checks · live blocked ${summary.liveBlockedBoundary}`,
    metadata: {
      artifactKind: "aiqt.p0AcceptanceReview",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      state: summary.state,
      sourcePath: summary.sourcePath,
      manifestGeneratedAt: acceptance?.generatedAt ?? "",
      manifestAvailable: Boolean(acceptance?.available),
      market: acceptance?.market ?? "",
      symbol: acceptance?.symbol ?? "",
      timeframe: acceptance?.timeframe ?? "",
      checkCount: summary.checkCount,
      requiredCheckCount: summary.requiredCheckCount,
      checkIds,
      paperOnly: Boolean(acceptance?.paperOnly),
      reportedLiveTradingAllowed: summary.reportedLiveTradingAllowed,
      liveTradingAllowed: false,
      liveBlockedBoundary: summary.liveBlockedBoundary,
      boundary: "P0 acceptance audit evidence only; live trading remains blocked and no investment advice"
    }
  };
}

export async function buildP2ReadinessAcceptanceReviewAuditEvent({
  acceptance,
  generatedAt = new Date().toISOString(),
  markdown,
  summary
}: {
  acceptance: P2ReadinessAcceptanceReviewSource | null | undefined;
  generatedAt?: string;
  markdown: string;
  summary: P2ReadinessAcceptanceSummary;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const runId = acceptance?.runId?.trim() || "p2-readiness-acceptance";
  const safeRunId = sanitizeDownloadFileName(runId);
  const fileName = `${safeRunId}-p2-readiness-acceptance-review.md`;
  const criterionIds =
    acceptance?.criterionIds.length
      ? acceptance.criterionIds
      : summary.status === "incomplete"
        ? ["p2_readiness_acceptance_manifest_missing"]
        : ["p2_readiness_acceptance_manifest_invalid"];
  const auditEventIds = acceptance?.auditEventIds.length ? acceptance.auditEventIds : ["audit_event_missing"];
  const state = acceptance?.status ?? (summary.status === "accepted" ? "accepted" : summary.status === "blocked" ? "invalid" : "missing");

  return {
    schemaVersion: 1,
    eventId: `p2-readiness-acceptance-review-${safeRunId}-${shortHash}`,
    eventType: "p2_readiness_acceptance_review",
    runId,
    createdAt: generatedAt,
    stage: state,
    source: "web",
    summary: "P2 readiness acceptance review recorded",
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${
      acceptance?.acceptedCriterionCount ?? summary.acceptedCount
    }/${acceptance?.totalCriterionCount ?? summary.totalCount} criteria · live blocked ${Boolean(
      acceptance?.liveBlockedBoundary
    )}`,
    metadata: {
      artifactKind: "aiqt.p2ReadinessAcceptanceReview",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      state,
      sourcePath: acceptance?.sourcePath ?? "data/p2-readiness-acceptance.json",
      manifestGeneratedAt: acceptance?.generatedAt ?? "",
      manifestAvailable: Boolean(acceptance?.available),
      market: acceptance?.market ?? "",
      symbol: acceptance?.symbol ?? "",
      timeframe: acceptance?.timeframe ?? "",
      adapterId: acceptance?.adapterId ?? "",
      p1AcceptanceRunId: acceptance?.p1AcceptanceRunId ?? "",
      p2PreLiveAcceptanceRunId: acceptance?.p2PreLiveAcceptanceRunId ?? "",
      p2PaperReplayRunId: acceptance?.p2PaperReplayRunId ?? "",
      operatorRunbookAuditEventId: acceptance?.operatorRunbookAuditEventId ?? "",
      currentEvidenceCoverageReviewAuditEventId: summary.evidenceCoverageReviewAuditEventId ?? "",
      readinessCoverageStatus: acceptance?.readinessCoverageStatus ?? "",
      acceptedCriterionCount: acceptance?.acceptedCriterionCount ?? summary.acceptedCount,
      totalCriterionCount: acceptance?.totalCriterionCount ?? summary.totalCount,
      blockingCriterionCount: acceptance?.blockingCriterionCount ?? summary.blockingCount,
      criterionIds,
      auditEventIds,
      manifestPaths: acceptance?.manifestPaths ?? {
        p1Acceptance: null,
        p2PreLiveAcceptance: null,
        p2PaperReplay: null
      },
      paperOnly: Boolean(acceptance?.paperOnly),
      reportedOrderSubmissionEnabled: Boolean(acceptance?.orderSubmissionEnabled),
      reportedLiveTradingAllowed: Boolean(acceptance?.liveTradingAllowed),
      reportedLiveOrderSubmitted: Boolean(acceptance?.liveOrderSubmitted),
      reportedRouteExecuted: Boolean(acceptance?.routeExecuted),
      reportedLiveBlockedBoundary: Boolean(acceptance?.liveBlockedBoundary),
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      boundary:
        "P2 readiness acceptance review is audit evidence only; live trading remains blocked and no investment advice"
    }
  };
}

export async function buildP2ReadinessEvidenceCoverageReviewAuditEvent({
  coverage,
  generatedAt = new Date().toISOString(),
  markdown
}: {
  coverage: P2ReadinessEvidenceCoverage;
  generatedAt?: string;
  markdown: string;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const fileName = "p2-readiness-evidence-coverage-review.md";

  return {
    schemaVersion: 1,
    eventId: `p2-readiness-evidence-coverage-review-${shortHash}`,
    eventType: "p2_readiness_evidence_coverage_review",
    runId: "p2-readiness-evidence-coverage",
    createdAt: generatedAt,
    stage: coverage.status,
    source: "web",
    summary: "P2 readiness evidence coverage review recorded",
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${coverage.status} ${coverage.coveredCount}/${
      coverage.totalCount
    } claims · live blocked true`,
    metadata: {
      artifactKind: "aiqt.p2ReadinessEvidenceCoverageReview",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      state: coverage.status,
      coverageStatus: coverage.status,
      coveredCount: coverage.coveredCount,
      totalCount: coverage.totalCount,
      blockingCount: coverage.blockingCount,
      rowIds: coverage.rows.map((row) => row.id),
      rowStatuses: coverage.rows.map((row) => row.status),
      sourceTypes: coverage.rows.map((row) => row.sourceType),
      sourceIds: coverage.rows.map((row) => row.sourceId ?? "n/a"),
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      boundary:
        "P2 readiness evidence coverage review is audit evidence only; live trading remains blocked and no investment advice"
    }
  };
}

export async function buildPersonalTeamUsabilityReadinessReviewAuditEvent({
  generatedAt = new Date().toISOString(),
  markdown,
  summary
}: {
  generatedAt?: string;
  markdown: string;
  summary: PersonalTeamUsabilityReadinessSummary;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const fileName = "personal-team-readiness-review.md";

  return {
    schemaVersion: 1,
    eventId: `personal-team-readiness-review-${shortHash}`,
    eventType: "personal_team_readiness_review",
    runId: "personal-team-readiness",
    createdAt: generatedAt,
    stage: summary.state,
    source: "web",
    summary: "Personal and small-team readiness review recorded",
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${summary.state} ${summary.readyCount}/${
      summary.totalCount
    } gates · personal ${summary.personalPercent}% · team ${summary.teamPercent}% · live blocked true`,
    metadata: {
      artifactKind: "aiqt.personalTeamReadinessReview",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      state: summary.state,
      tone: summary.tone,
      headline: summary.headline,
      personalPercent: summary.personalPercent,
      teamPercent: summary.teamPercent,
      readyCount: summary.readyCount,
      totalCount: summary.totalCount,
      openItemIds: summary.openItems.map((item) => item.id),
      itemIds: summary.items.map((item) => item.id),
      itemStatuses: summary.items.map((item) => item.status),
      nextActionLabel: summary.nextActionLabel,
      nextActionWorkspaceId: summary.nextActionWorkspaceId,
      liveBoundaryLabel: summary.liveBoundaryLabel,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      boundary:
        "Personal and small-team readiness review is audit evidence only; live trading remains blocked and no investment advice"
    }
  };
}

export async function buildDailyOpsControlRoomReviewAuditEvent({
  generatedAt = new Date().toISOString(),
  markdown,
  summary
}: {
  generatedAt?: string;
  markdown: string;
  summary: DailyOpsControlRoomSummary;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const fileName = "daily-ops-control-room-review.md";

  return {
    schemaVersion: 1,
    eventId: `daily-ops-control-room-review-${shortHash}`,
    eventType: "daily_ops_control_room_review",
    runId: "daily-ops-control-room",
    createdAt: generatedAt,
    stage: summary.state,
    source: "web",
    summary: "Daily ops control room review recorded",
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${summary.state} ${summary.readyCount}/${
      summary.totalCount
    } gates · review ${summary.reviewCount} · blocked ${summary.blockingCount} · live blocked true`,
    metadata: {
      artifactKind: "aiqt.dailyOpsControlRoomReview",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      state: summary.state,
      tone: summary.tone,
      headline: summary.headline,
      readyCount: summary.readyCount,
      reviewCount: summary.reviewCount,
      blockingCount: summary.blockingCount,
      totalCount: summary.totalCount,
      queueItemIds: summary.queueItems.map((item) => item.id),
      queueItemStatuses: summary.queueItems.map((item) => item.status),
      openItemIds: summary.openItems.map((item) => item.id),
      primaryActionLabel: summary.primaryActionLabel,
      primaryActionWorkspaceId: summary.primaryActionWorkspaceId,
      auditQueryLabel: summary.auditQueryLabel,
      auditQuery: summary.auditQuery,
      auditQueryTitle: summary.auditQueryTitle || "",
      liveBoundaryLabel: summary.liveBoundaryLabel,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      boundary:
        "Daily ops control room review is audit evidence only; live trading remains blocked and no investment advice"
    }
  };
}

export async function buildDailyStartBriefReviewAuditEvent({
  brief,
  generatedAt = new Date().toISOString(),
  markdown
}: {
  brief: DailyStartBrief;
  generatedAt?: string;
  markdown: string;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const fileName = "daily-start-brief-review.md";

  return {
    schemaVersion: 1,
    eventId: `daily-start-brief-review-${shortHash}`,
    eventType: "daily_start_brief_review",
    runId: "daily-start-brief",
    createdAt: generatedAt,
    stage: brief.state,
    source: "web",
    summary: "Daily start brief review recorded",
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${brief.state} · local reviews ${brief.currentReviewCount}/2 · open ops ${brief.openOpsItemCount} · live blocked true`,
    metadata: {
      artifactKind: "aiqt.dailyStartBriefReview",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      state: brief.state,
      tone: brief.tone,
      headline: brief.headline,
      currentReviewCount: brief.currentReviewCount,
      staleReviewCount: brief.staleReviewCount,
      missingReviewCount: brief.missingReviewCount,
      openOpsItemCount: brief.openOpsItemCount,
      primaryActionLabel: brief.primaryActionLabel,
      primaryActionWorkspaceId: brief.primaryActionWorkspaceId,
      auditActionLabel: brief.auditActionLabel,
      auditQuery: brief.auditQuery,
      auditQueryTitle: brief.auditQueryTitle || "",
      localReviewStatus: brief.localReviewStatus,
      localReviewActionLabel: brief.localReviewActionLabel,
      localReviewQuery: brief.localReviewQuery,
      checkpointIds: brief.checkpoints.map((checkpoint) => checkpoint.id),
      checkpointStatuses: brief.checkpoints.map((checkpoint) => checkpoint.status),
      liveBoundaryLabel: brief.liveBoundaryLabel,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      boundary:
        "Daily start brief review is audit evidence only; live trading remains blocked and no investment advice"
    }
  };
}

interface Stage1P0DailyUseArchiveReviewClosure {
  bootstrapPreflightChecks?: readonly Stage1BootstrapPreflightSummaryCheckSource[];
  bootstrapPreflightSourcePaths?: Stage1BootstrapPreflightSummarySource["sourcePaths"] | null;
  primaryActionId?: string | null;
  primaryActionLabel: string;
  primaryTargetWorkspaceId: string;
  readyCount: number;
  rows: readonly {
    id?: string | null;
    label: string;
    status: string;
    targetWorkspaceId: string;
  }[];
  state: string;
  totalCount: number;
}

interface Stage1P0DailyUseArchiveReviewShareState {
  focus: string;
  kind: string;
  targetWorkspaceId: string;
}

interface Stage1P0DailyUseArchiveReviewInvalidShareStatus {
  reason: string | null;
  state?: unknown;
  status: string;
}

interface Stage1P0DailyUseArchiveReviewRefreshOutcome {
  state: string;
}

export async function buildStage1P0DailyUseArchiveReviewAuditEvent({
  archive,
  closure,
  generatedAt = new Date().toISOString(),
  invalidShareStatus = null,
  refreshOutcome = null,
  shareDeepLinkState = null
}: {
  archive: Stage1P0DailyUseArchiveBundle;
  closure: Stage1P0DailyUseArchiveReviewClosure;
  generatedAt?: string;
  invalidShareStatus?: Stage1P0DailyUseArchiveReviewInvalidShareStatus | null;
  refreshOutcome?: Stage1P0DailyUseArchiveReviewRefreshOutcome | null;
  shareDeepLinkState?: Stage1P0DailyUseArchiveReviewShareState | null;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(archive.contentMarkdown);
  const shortHash = contentSha256.slice(0, 16);
  const invalidShareReason = invalidShareStatus?.status === "invalid" ? invalidShareStatus.reason : null;
  const bootstrapPreflightChecks = closure.bootstrapPreflightChecks ?? [];
  const bootstrapPreflightCheckIds = bootstrapPreflightChecks.map((check) => check.id ?? "");
  const bootstrapPreflightCheckStatuses = bootstrapPreflightChecks.map((check) => check.status ?? "");
  const bootstrapPreflightCheckSourcePaths = bootstrapPreflightChecks.map((check) => check.sourcePath ?? "");
  const p2ManifestChainCheckSourcePath =
    bootstrapPreflightChecks.find((check) => check.id === "p2-manifest-chain")?.sourcePath ?? "";
  const bootstrapPreflightP2ManifestChainPreflightSourcePath =
    closure.bootstrapPreflightSourcePaths?.p2ManifestChainPreflight ?? p2ManifestChainCheckSourcePath;

  return {
    schemaVersion: 1,
    eventId: `stage1-daily-archive-review-${shortHash}`,
    eventType: "stage1_daily_archive_review",
    runId: "stage1-p0-daily-use",
    createdAt: generatedAt,
    stage: closure.state,
    source: "web",
    summary: "Stage 1/P0 daily-use archive recorded",
    detail: `${archive.fileName} · sha256 ${contentSha256.slice(0, 12)} · body ${archive.bodySha256.hash.slice(
      0,
      12
    )} · ${closure.state} ${closure.readyCount}/${closure.totalCount} ready · live blocked true`,
    metadata: {
      archiveBodySha256: archive.bodySha256.hash,
      archiveBodySha256Algorithm: archive.bodySha256.algorithm,
      artifactKind: "aiqt.stage1P0DailyUseArchiveReview",
      bootstrapPreflightCheckIds,
      bootstrapPreflightCheckSourcePaths,
      bootstrapPreflightCheckStatuses,
      bootstrapPreflightP2ManifestChainPreflightSourcePath,
      boundary:
        "Stage 1/P0 daily-use archive is local review evidence only; live trading remains blocked and no investment advice",
      contentSha256,
      contentSha256Algorithm: "sha256",
      fileName: archive.fileName,
      format: "text/markdown",
      invalidShareReason: invalidShareReason ?? "none",
      invalidShareStatus: invalidShareStatus?.status ?? "none",
      liveBlockedBoundary: true,
      liveOrderSubmitted: false,
      liveTradingAllowed: false,
      orderSubmissionEnabled: false,
      primaryActionId: closure.primaryActionId ?? "",
      primaryActionLabel: closure.primaryActionLabel,
      primaryTargetWorkspaceId: closure.primaryTargetWorkspaceId,
      readyCount: closure.readyCount,
      refreshOutcomeState: refreshOutcome?.state ?? "not-generated",
      routeExecuted: false,
      rowIds: closure.rows.map((row) => row.id ?? ""),
      rowLabels: closure.rows.map((row) => row.label),
      rowStatuses: closure.rows.map((row) => row.status),
      rowTargetWorkspaceIds: closure.rows.map((row) => row.targetWorkspaceId),
      shareFocus: shareDeepLinkState?.focus ?? "none",
      shareKind: shareDeepLinkState?.kind ?? "none",
      shareTargetWorkspaceId: shareDeepLinkState?.targetWorkspaceId ?? "none",
      state: closure.state,
      totalCount: closure.totalCount
    }
  };
}

export async function buildP2ManifestChainPreflightReviewAuditEvent({
  generatedAt = new Date().toISOString(),
  markdown,
  preflight,
  summary
}: {
  generatedAt?: string;
  markdown: string;
  preflight: P2ManifestChainPreflightSummarySource | null | undefined;
  summary: P2ManifestChainPreflightSummary;
}): Promise<AuditEventRecord> {
  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const fileName = "p2-manifest-chain-preflight-review.md";
  const stages = preflight?.stages.length ? preflight.stages : summary.stages;
  const state = preflight?.status ?? summary.state;
  const validStageCount = preflight?.validStageCount ?? summary.validStageCount;
  const totalStageCount = preflight?.totalStageCount ?? summary.totalStageCount;
  const blockerIds = preflight?.blockerIds.length ? preflight.blockerIds : summary.blockerIds;
  const nextAction = preflight?.nextAction ?? summary.nextAction;
  const nextCommand = preflight?.nextCommand ?? summary.nextCommand;
  const liveBlockedBoundary = Boolean(preflight?.liveBlockedBoundary ?? summary.liveBlockedBoundary);

  return {
    schemaVersion: 1,
    eventId: `p2-manifest-chain-preflight-review-${shortHash}`,
    eventType: "p2_manifest_chain_preflight_review",
    runId: "p2-manifest-chain-preflight",
    createdAt: generatedAt,
    stage: state,
    source: "web",
    summary: "P2 manifest chain preflight review recorded",
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${state} ${validStageCount}/${totalStageCount} · next=${
      nextAction || "none"
    } · live blocked ${liveBlockedBoundary}`,
    metadata: {
      artifactKind: "aiqt.p2ManifestChainPreflightReview",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      state,
      preflightStatus: state,
      sourcePath: preflight?.sourcePath ?? summary.sourcePath,
      manifestAvailable: Boolean(preflight?.available),
      ready: Boolean(preflight?.ready ?? summary.ready),
      validStageCount,
      totalStageCount,
      blockerIds,
      nextAction,
      nextCommand,
      stageIds: stages.map((stage) => stage.id),
      stageStatuses: stages.map((stage) => stage.status),
      paperOnly: Boolean(preflight?.paperOnly),
      reportedOrderSubmissionEnabled: Boolean(preflight?.orderSubmissionEnabled ?? summary.reportedOrderSubmissionEnabled),
      reportedLiveTradingAllowed: Boolean(preflight?.liveTradingAllowed ?? summary.reportedLiveTradingAllowed),
      reportedLiveOrderSubmitted: Boolean(preflight?.liveOrderSubmitted ?? summary.reportedLiveOrderSubmitted),
      reportedRouteExecuted: Boolean(preflight?.routeExecuted ?? summary.reportedRouteExecuted),
      reportedLiveBlockedBoundary: liveBlockedBoundary,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary,
      boundary:
        "P2 manifest chain preflight review is audit evidence only; live trading remains blocked and no investment advice"
    }
  };
}
