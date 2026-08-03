import { auditReportLedgerDeduplicatedQueryText } from "../audit/local-review-bundle";
import type { AuditEvidenceReportLedgerRow } from "../audit/report-contracts";
import { buildAuditEvidenceReportLedgerRowDailyStartBriefReviewQuery, buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewQuery } from "../audit/report-queries";
import { buildStage1BootstrapPreflightEvidenceLines, stage1P0DailyUseArchiveFileNameToken } from "./archive-builders";
import type { Stage1P0DailyUseClosure, Stage1P0DailyUseRefreshOutcome, Stage1P0DailyUseShareDeepLinkState, Stage1P0DailyUseShareDeepLinkStatus } from "./archive-contracts";
import type { DailyOpsControlRoomSummary, DailyStartBrief, DailyStartBriefReviewReference, P2ReadinessAcceptanceReviewSource, P2ReadinessAcceptanceSummary, PersonalTeamUsabilityReadinessReviewReference, PersonalTeamUsabilityReadinessSummary, Stage1P0DailyUseArchiveReviewReference, Stage1P0DailyUseStartupSnapshot } from "./review-contracts";

export function buildDailyStartBriefReviewReference({
  brief,
  ledgerRows
}: {
  brief: DailyStartBrief;
  ledgerRows: AuditEvidenceReportLedgerRow[];
}): DailyStartBriefReviewReference {
  const latestRow =
    ledgerRows
      .filter((row) => row.reportKind === "daily_start_brief_review" && row.status === "ready")
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0] ?? null;

  if (!latestRow) {
    return {
      createdAt: "",
      detail: "No daily start brief review has been recorded yet.",
      eventId: "",
      label: "No daily start review recorded",
      query: "",
      row: null,
      status: "missing"
    };
  }

  const query = buildAuditEvidenceReportLedgerRowDailyStartBriefReviewQuery(latestRow);
  const isCurrent = dailyStartBriefReviewRowMatchesBrief(latestRow, brief);
  const stateLabel = `${latestRow.dailyStartBriefReviewState || latestRow.focusQuery} local reviews ${
    latestRow.dailyStartBriefReviewCurrentReviewCount
  }/2 open ops ${latestRow.dailyStartBriefReviewOpenOpsItemCount}`;
  const currentStateLabel = `${brief.state} local reviews ${brief.currentReviewCount}/2 open ops ${brief.openOpsItemCount}`;
  const stateStaleReason =
    !isCurrent && stateLabel !== currentStateLabel
      ? ` Daily start state changed from ${stateLabel} to ${currentStateLabel}.`
      : "";
  const archivedPrimaryAction = `${latestRow.dailyStartBriefReviewPrimaryActionLabel}->${latestRow.dailyStartBriefReviewPrimaryActionWorkspaceId}`;
  const currentPrimaryAction = `${brief.primaryActionLabel}->${brief.primaryActionWorkspaceId}`;
  const primaryActionStaleReason =
    !isCurrent && archivedPrimaryAction !== currentPrimaryAction
      ? ` Primary action changed from ${archivedPrimaryAction} to ${currentPrimaryAction}.`
      : "";
  const archivedLocalReview = `${latestRow.dailyStartBriefReviewLocalReviewStatus}:${latestRow.dailyStartBriefReviewLocalReviewActionLabel}->${latestRow.dailyStartBriefReviewLocalReviewQuery}`;
  const currentLocalReview = `${brief.localReviewStatus}:${brief.localReviewActionLabel}->${brief.localReviewQuery}`;
  const localReviewStaleReason =
    !isCurrent && archivedLocalReview !== currentLocalReview
      ? ` Local review changed from ${archivedLocalReview} to ${currentLocalReview}.`
      : "";
  const archivedAuditContext = `${latestRow.dailyStartBriefReviewAuditQueryTitle || "none"}->${
    latestRow.dailyStartBriefReviewAuditQuery || "none"
  }`;
  const currentAuditContext = `${brief.auditQueryTitle || "none"}->${brief.auditQuery || "none"}`;
  const auditContextStaleReason =
    !isCurrent && archivedAuditContext !== currentAuditContext
      ? ` Audit context changed from ${archivedAuditContext} to ${currentAuditContext}.`
      : "";
  const archivedCheckpoints = latestRow.dailyStartBriefReviewCheckpointIds
    .map((id, index) => `${id}:${latestRow.dailyStartBriefReviewCheckpointStatuses[index] || "unknown"}`)
    .join(", ");
  const currentCheckpoints = brief.checkpoints.map((checkpoint) => `${checkpoint.id}:${checkpoint.status}`).join(", ");
  const checkpointsStaleReason =
    !isCurrent && archivedCheckpoints !== currentCheckpoints
      ? ` Checkpoints changed from ${archivedCheckpoints || "none"} to ${currentCheckpoints || "none"}.`
      : "";

  return {
    createdAt: latestRow.createdAt,
    detail: isCurrent
      ? `Latest review ${latestRow.id} matches current daily start brief (${stateLabel}).`
      : `Latest review ${latestRow.id} no longer matches current daily start brief (${stateLabel}); record a fresh review.${stateStaleReason}${primaryActionStaleReason}${localReviewStaleReason}${auditContextStaleReason}${checkpointsStaleReason}`,
    eventId: latestRow.id,
    label: isCurrent ? "Daily start review current" : "Daily start review stale",
    query,
    row: latestRow,
    status: isCurrent ? "current" : "stale"
  };
}

export function buildStage1P0DailyUseArchiveReviewReference({
  closure,
  invalidShareStatus = null,
  ledgerRows,
  refreshOutcome = null,
  shareDeepLinkState = null
}: {
  closure: Stage1P0DailyUseClosure;
  invalidShareStatus?: Stage1P0DailyUseShareDeepLinkStatus | null;
  ledgerRows: AuditEvidenceReportLedgerRow[];
  refreshOutcome?: Stage1P0DailyUseRefreshOutcome | null;
  shareDeepLinkState?: Stage1P0DailyUseShareDeepLinkState | null;
}): Stage1P0DailyUseArchiveReviewReference {
  const latestRow =
    ledgerRows
      .filter((row) => row.reportKind === "stage1_daily_archive_review" && row.status === "ready")
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0] ?? null;

  if (!latestRow) {
    return finalizeStage1P0DailyUseArchiveReviewReference({
      createdAt: "",
      detail: "No Stage 1 daily-use archive review has been recorded yet.",
      eventId: "",
      label: "No Stage 1 archive review recorded",
      query: "",
      row: null,
      status: "missing"
    });
  }

  const query = buildAuditEvidenceReportLedgerRowStage1DailyArchiveReviewQuery(latestRow);
  const isCurrent = stage1DailyArchiveReviewRowMatchesContext(latestRow, {
    closure,
    invalidShareStatus,
    refreshOutcome,
    shareDeepLinkState
  });
  const stateLabel = `${latestRow.stage1DailyArchiveReviewState || latestRow.focusQuery} ${
    latestRow.stage1DailyArchiveReviewReadyCount
  }/${latestRow.stage1DailyArchiveReviewTotalCount}`;
  const currentStateLabel = `${closure.state} ${closure.readyCount}/${closure.totalCount}`;
  const stage1StateStaleReason =
    !isCurrent && stateLabel !== currentStateLabel
      ? ` Stage 1 state changed from ${stateLabel} to ${currentStateLabel}.`
      : "";
  const archivedPrimaryAction = `${latestRow.stage1DailyArchiveReviewPrimaryActionId}:${latestRow.stage1DailyArchiveReviewPrimaryActionLabel}->${latestRow.stage1DailyArchiveReviewPrimaryTargetWorkspaceId}`;
  const currentPrimaryAction = `${closure.primaryActionId}:${closure.primaryActionLabel}->${closure.primaryTargetWorkspaceId}`;
  const primaryActionStaleReason =
    !isCurrent && archivedPrimaryAction !== currentPrimaryAction
      ? ` Primary action changed from ${archivedPrimaryAction} to ${currentPrimaryAction}.`
      : "";
  const archivedRefreshOutcome = latestRow.stage1DailyArchiveReviewRefreshOutcomeState;
  const currentRefreshOutcome = refreshOutcome?.state ?? "not-generated";
  const refreshOutcomeStaleReason =
    !isCurrent && archivedRefreshOutcome !== currentRefreshOutcome
      ? ` Refresh outcome changed from ${archivedRefreshOutcome || "none"} to ${currentRefreshOutcome || "none"}.`
      : "";
  const archivedShareContext = `${latestRow.stage1DailyArchiveReviewShareKind}/${latestRow.stage1DailyArchiveReviewShareFocus}->${latestRow.stage1DailyArchiveReviewShareTargetWorkspaceId}`;
  const currentShareContext = `${shareDeepLinkState?.kind ?? "none"}/${shareDeepLinkState?.focus ?? "none"}->${
    shareDeepLinkState?.targetWorkspaceId ?? "none"
  }`;
  const shareContextStaleReason =
    !isCurrent && archivedShareContext !== currentShareContext
      ? ` Share context changed from ${archivedShareContext} to ${currentShareContext}.`
      : "";
  const currentInvalidShareReason = invalidShareStatus?.status === "invalid" ? invalidShareStatus.reason : "none";
  const archivedInvalidShare = `${latestRow.stage1DailyArchiveReviewInvalidShareStatus}:${latestRow.stage1DailyArchiveReviewInvalidShareReason}`;
  const currentInvalidShare = `${invalidShareStatus?.status ?? "none"}:${currentInvalidShareReason}`;
  const invalidShareStaleReason =
    !isCurrent && archivedInvalidShare !== currentInvalidShare
      ? ` Invalid share changed from ${archivedInvalidShare} to ${currentInvalidShare}.`
      : "";
  const archivedP2ChainSource = latestRow.stage1DailyArchiveReviewBootstrapPreflightP2ManifestChainPreflightSourcePath;
  const currentP2ChainSource = closure.bootstrapPreflightSourcePaths?.p2ManifestChainPreflight ?? "";
  const p2ChainStaleReason =
    !isCurrent && archivedP2ChainSource !== currentP2ChainSource
      ? ` P2 chain source changed from ${archivedP2ChainSource || "none"} to ${currentP2ChainSource || "none"}.`
      : "";
  const archivedBootstrapChecks = latestRow.stage1DailyArchiveReviewBootstrapPreflightCheckIds
    .map((id, index) => `${id}:${latestRow.stage1DailyArchiveReviewBootstrapPreflightCheckStatuses[index] || "unknown"}`)
    .join(", ");
  const currentBootstrapChecks = (closure.bootstrapPreflightChecks ?? [])
    .map((check) => `${check.id}:${check.status}`)
    .join(", ");
  const bootstrapCheckStaleReason =
    !isCurrent && archivedBootstrapChecks !== currentBootstrapChecks
      ? ` Bootstrap checks changed from ${archivedBootstrapChecks || "none"} to ${currentBootstrapChecks || "none"}.`
      : "";
  const archivedBootstrapCheckSources = latestRow.stage1DailyArchiveReviewBootstrapPreflightCheckSourcePaths.join(", ");
  const currentBootstrapCheckSources = (closure.bootstrapPreflightChecks ?? [])
    .map((check) => check.sourcePath)
    .join(", ");
  const bootstrapCheckSourceStaleReason =
    !isCurrent && archivedBootstrapCheckSources !== currentBootstrapCheckSources
      ? ` Bootstrap check sources changed from ${archivedBootstrapCheckSources || "none"} to ${currentBootstrapCheckSources || "none"}.`
      : "";
  const archivedStage1RowLabels = latestRow.stage1DailyArchiveReviewRowIds
    .map((id, index) => `${id}:${latestRow.stage1DailyArchiveReviewRowLabels[index] || "unknown"}`)
    .join(", ");
  const currentStage1RowLabels = closure.rows.map((row) => `${row.id}:${row.label}`).join(", ");
  const stage1RowLabelsStaleReason =
    !isCurrent && archivedStage1RowLabels !== currentStage1RowLabels
      ? ` Stage 1 row labels changed from ${archivedStage1RowLabels || "none"} to ${currentStage1RowLabels || "none"}.`
      : "";
  const archivedStage1Rows = latestRow.stage1DailyArchiveReviewRowIds
    .map(
      (id, index) =>
        `${id}:${latestRow.stage1DailyArchiveReviewRowStatuses[index] || "unknown"}->${
          latestRow.stage1DailyArchiveReviewRowTargetWorkspaceIds[index] || "unknown"
        }`
    )
    .join(", ");
  const currentStage1Rows = closure.rows.map((row) => `${row.id}:${row.status}->${row.targetWorkspaceId}`).join(", ");
  const stage1RowsStaleReason =
    !isCurrent && archivedStage1Rows !== currentStage1Rows
      ? ` Stage 1 rows changed from ${archivedStage1Rows || "none"} to ${currentStage1Rows || "none"}.`
      : "";

  return finalizeStage1P0DailyUseArchiveReviewReference({
    createdAt: latestRow.createdAt,
    detail: isCurrent
      ? `Latest archive review ${latestRow.id} matches current Stage 1 daily-use context (${stateLabel}).`
      : `Latest archive review ${latestRow.id} no longer matches current Stage 1 daily-use context (${stateLabel}); record a fresh archive.${stage1StateStaleReason}${primaryActionStaleReason}${refreshOutcomeStaleReason}${shareContextStaleReason}${invalidShareStaleReason}${p2ChainStaleReason}${bootstrapCheckStaleReason}${bootstrapCheckSourceStaleReason}${stage1RowLabelsStaleReason}${stage1RowsStaleReason}`,
    eventId: latestRow.id,
    label: isCurrent ? "Stage 1 archive review current" : "Stage 1 archive review stale",
    query,
    row: latestRow,
    status: isCurrent ? "current" : "stale"
  });
}

export function finalizeStage1P0DailyUseArchiveReviewReference(
  reference: Omit<Stage1P0DailyUseArchiveReviewReference, "copyText" | "fileName">
): Stage1P0DailyUseArchiveReviewReference {
  const fileName = `stage1-p0-daily-use-archive-review-${reference.status}.md`;
  return {
    ...reference,
    copyText: buildStage1P0DailyUseArchiveReviewReferenceCopyText(reference),
    fileName
  };
}

export function buildStage1P0DailyUseArchiveReviewReferenceCopyText(
  reference: Omit<Stage1P0DailyUseArchiveReviewReference, "copyText" | "fileName">
): string {
  const row = reference.row;
  const rowStatuses =
    row && row.stage1DailyArchiveReviewRowIds.length > 0
      ? row.stage1DailyArchiveReviewRowIds
          .map((id, index) => {
            const status = row.stage1DailyArchiveReviewRowStatuses[index] || "unknown";
            const workspace = row.stage1DailyArchiveReviewRowTargetWorkspaceIds[index] || "unknown";
            return `${id}:${status}->${workspace}`;
          })
          .join(", ")
      : "none";
  const primaryAction = row?.stage1DailyArchiveReviewPrimaryActionLabel
    ? `${row.stage1DailyArchiveReviewPrimaryActionLabel} -> ${row.stage1DailyArchiveReviewPrimaryTargetWorkspaceId || "unknown"}`
    : "none";
  const bootstrapChecks =
    row && row.stage1DailyArchiveReviewBootstrapPreflightCheckIds.length > 0
      ? row.stage1DailyArchiveReviewBootstrapPreflightCheckIds
          .map((id, index) => {
            const status = row.stage1DailyArchiveReviewBootstrapPreflightCheckStatuses[index] || "unknown";
            return `${id}:${status}`;
          })
          .join(", ")
      : "none";

  return [
    "# Stage 1 Daily-Use Archive Review Reference",
    "",
    "## Summary",
    `- Status: ${reference.status}`,
    `- Label: ${reference.label}`,
    `- Detail: ${reference.detail}`,
    `- Event id: ${reference.eventId || "none"}`,
    `- Created at: ${reference.createdAt || "none"}`,
    `- Query: ${reference.query || "none"}`,
    `- Archive body SHA-256: ${row?.stage1DailyArchiveReviewArchiveBodySha256 || "none"}`,
    `- Bootstrap P2 chain source: ${
      row?.stage1DailyArchiveReviewBootstrapPreflightP2ManifestChainPreflightSourcePath || "none"
    }`,
    `- Bootstrap checks: ${bootstrapChecks}`,
    `- Primary action: ${primaryAction}`,
    `- Stage 1 rows: ${rowStatuses}`,
    "",
    "## Boundary",
    "- This summary only describes the latest local Stage 1 archive review reference.",
    "- It does not record a new audit event, refresh evidence, connect brokers, enable live trading, or submit orders."
  ].join("\n");
}

export function buildStage1P0DailyUseStartupSnapshot({
  archiveReference,
  closure,
  refreshOutcome = null
}: {
  archiveReference: Stage1P0DailyUseArchiveReviewReference;
  closure: Stage1P0DailyUseClosure;
  refreshOutcome?: Stage1P0DailyUseRefreshOutcome | null;
}): Stage1P0DailyUseStartupSnapshot {
  const refreshOutcomeState = refreshOutcome?.state ?? "not-generated";
  const fileName = [
    "stage1",
    "p0",
    "daily",
    "startup",
    "snapshot",
    closure.state,
    archiveReference.status,
    refreshOutcomeState
  ]
    .map(stage1P0DailyUseArchiveFileNameToken)
    .join("-");
  const refreshLines = refreshOutcome
    ? [
        `- Refresh next action: ${refreshOutcome.actionLabel} -> ${refreshOutcome.targetWorkspaceId}`,
        `- Refresh next link: ${refreshOutcome.targetWorkspaceLink}`,
        `- Refresh ready: ${refreshOutcome.readyCount}/${refreshOutcome.totalCount}`,
        ...refreshOutcome.entries.map(
          (entry) => `- ${entry.id}: ${entry.status}/${entry.source} -> ${entry.targetWorkspaceId}`
        )
      ]
    : ["- Refresh next action: none"];
  const bootstrapEvidenceLines = buildStage1BootstrapPreflightEvidenceLines(
    closure.bootstrapPreflightChecks ?? [],
    closure.bootstrapPreflightSourcePaths ?? null
  );
  const archiveReferenceRow = archiveReference.row;
  const archivedBootstrapChecks = archiveReferenceRow?.stage1DailyArchiveReviewBootstrapPreflightCheckIds.length
    ? archiveReferenceRow.stage1DailyArchiveReviewBootstrapPreflightCheckIds
        .map((id, index) => `${id}:${archiveReferenceRow.stage1DailyArchiveReviewBootstrapPreflightCheckStatuses[index] || "unknown"}`)
        .join(", ")
    : "none";

  return {
    archiveReferenceStatus: archiveReference.status,
    copyText: [
      "# Stage 1/P0 Daily Startup Snapshot",
      "",
      "## Summary",
      `- Daily state: ${closure.state}`,
      `- Ready: ${closure.readyCount}/${closure.totalCount}`,
      `- Primary action: ${closure.primaryActionLabel} -> ${closure.primaryTargetWorkspaceId}`,
      `- Primary action id: ${closure.primaryActionId}`,
      `- Primary link: ${closure.primaryWorkspaceLink}`,
      `- Archive reference: ${archiveReference.status}`,
      `- Archive reference event id: ${archiveReference.eventId || "none"}`,
      `- Archive reference query: ${archiveReference.query || "none"}`,
      `- Refresh receipt: ${refreshOutcomeState}`,
      "",
      "## Daily Rows",
      ...closure.rows.map(
        (row) =>
          `- ${row.id}: ${row.status} -> ${row.targetWorkspaceId} (${row.actionLabel}; link: ${row.workspaceLink})`
      ),
      "",
      "## Bootstrap Preflight Evidence",
      ...bootstrapEvidenceLines,
      "",
      "## Archive Reference",
      `- Label: ${archiveReference.label}`,
      `- Detail: ${archiveReference.detail}`,
      `- Created at: ${archiveReference.createdAt || "none"}`,
      `- File name: ${archiveReference.fileName}`,
      `- Archive body SHA-256: ${archiveReferenceRow?.stage1DailyArchiveReviewArchiveBodySha256 || "none"}`,
      `- Archived P2 chain source: ${
        archiveReferenceRow?.stage1DailyArchiveReviewBootstrapPreflightP2ManifestChainPreflightSourcePath || "none"
      }`,
      `- Archived bootstrap checks: ${archivedBootstrapChecks}`,
      "",
      "## Refresh Receipt",
      ...refreshLines,
      "",
      "## Boundary",
      "- This snapshot only describes the current browser/local Stage 1 startup context.",
      "- It does not record a new audit event, refresh evidence, run Docker, build the desktop app, connect brokers, enable live trading, or submit orders.",
      "Live trading remains blocked."
    ].join("\n"),
    fileName: `${fileName}.md`,
    primaryActionId: closure.primaryActionId,
    primaryActionLabel: closure.primaryActionLabel,
    primaryTargetWorkspaceId: closure.primaryTargetWorkspaceId,
    readyCount: closure.readyCount,
    refreshOutcomeState,
    state: closure.state,
    totalCount: closure.totalCount
  };
}

export function buildPersonalTeamUsabilityReadinessReviewReference({
  ledgerRows,
  summary
}: {
  ledgerRows: AuditEvidenceReportLedgerRow[];
  summary: PersonalTeamUsabilityReadinessSummary;
}): PersonalTeamUsabilityReadinessReviewReference {
  const latestRow =
    ledgerRows
      .filter((row) => row.reportKind === "personal_team_readiness_review" && row.status === "ready")
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0] ?? null;

  if (!latestRow) {
    return {
      createdAt: "",
      detail: "No personal/team readiness review has been recorded yet.",
      eventId: "",
      label: "No personal/team readiness review recorded",
      query: "",
      row: null,
      status: "missing"
    };
  }

  const query = auditReportLedgerDeduplicatedQueryText([
    "personal_team_readiness_review",
    latestRow.id,
    latestRow.personalTeamReadinessReviewState,
    `${latestRow.personalTeamReadinessReviewReadyCount}/${latestRow.personalTeamReadinessReviewTotalCount}`
  ]);
  const isCurrent = personalTeamReadinessReviewRowMatchesSummary(latestRow, summary);
  const stateLabel = `${latestRow.personalTeamReadinessReviewState || latestRow.focusQuery} ${
    latestRow.personalTeamReadinessReviewReadyCount
  }/${latestRow.personalTeamReadinessReviewTotalCount}`;
  const archivedStateLabel = `${stateLabel} personal ${latestRow.personalTeamReadinessReviewPersonalPercent}% team ${latestRow.personalTeamReadinessReviewTeamPercent}%`;
  const currentStateLabel = `${summary.state} ${summary.readyCount}/${summary.totalCount} personal ${summary.personalPercent}% team ${summary.teamPercent}%`;
  const stateStaleReason =
    !isCurrent && archivedStateLabel !== currentStateLabel
      ? ` Personal/team state changed from ${archivedStateLabel} to ${currentStateLabel}.`
      : "";
  const archivedNextAction = `${latestRow.personalTeamReadinessReviewNextActionLabel}->${latestRow.personalTeamReadinessReviewNextActionWorkspaceId}`;
  const currentNextAction = `${summary.nextActionLabel}->${summary.nextActionWorkspaceId}`;
  const nextActionStaleReason =
    !isCurrent && archivedNextAction !== currentNextAction
      ? ` Next action changed from ${archivedNextAction} to ${currentNextAction}.`
      : "";
  const archivedItems = latestRow.personalTeamReadinessReviewItemIds
    .map((id, index) => `${id}:${latestRow.personalTeamReadinessReviewItemStatuses[index] || "unknown"}`)
    .join(", ");
  const currentItems = summary.items.map((item) => `${item.id}:${item.status}`).join(", ");
  const itemsStaleReason =
    !isCurrent && archivedItems !== currentItems
      ? ` Readiness items changed from ${archivedItems || "none"} to ${currentItems || "none"}.`
      : "";
  const archivedOpenItems = latestRow.personalTeamReadinessReviewOpenItemIds.join(", ");
  const currentOpenItems = summary.openItems.map((item) => item.id).join(", ");
  const openItemsStaleReason =
    !isCurrent && archivedOpenItems !== currentOpenItems
      ? ` Open items changed from ${archivedOpenItems || "none"} to ${currentOpenItems || "none"}.`
      : "";

  return {
    createdAt: latestRow.createdAt,
    detail: isCurrent
      ? `Latest review ${latestRow.id} matches current personal/team readiness (${stateLabel}).`
      : `Latest review ${latestRow.id} no longer matches current personal/team readiness (${stateLabel}); record a fresh review.${stateStaleReason}${nextActionStaleReason}${itemsStaleReason}${openItemsStaleReason}`,
    eventId: latestRow.id,
    label: isCurrent ? "Personal/team readiness review current" : "Personal/team readiness review stale",
    query,
    row: latestRow,
    status: isCurrent ? "current" : "stale"
  };
}

export function personalTeamReadinessReviewRowMatchesSummary(
  row: AuditEvidenceReportLedgerRow,
  summary: PersonalTeamUsabilityReadinessSummary
): boolean {
  return (
    row.reportKind === "personal_team_readiness_review" &&
    row.status === "ready" &&
    row.personalTeamReadinessReviewState === summary.state &&
    row.personalTeamReadinessReviewPersonalPercent === summary.personalPercent &&
    row.personalTeamReadinessReviewTeamPercent === summary.teamPercent &&
    row.personalTeamReadinessReviewReadyCount === summary.readyCount &&
    row.personalTeamReadinessReviewTotalCount === summary.totalCount &&
    row.personalTeamReadinessReviewNextActionLabel === summary.nextActionLabel &&
    row.personalTeamReadinessReviewNextActionWorkspaceId === summary.nextActionWorkspaceId &&
    sameAuditStringList(
      row.personalTeamReadinessReviewItemIds,
      summary.items.map((item) => item.id)
    ) &&
    sameAuditStringList(
      row.personalTeamReadinessReviewItemStatuses,
      summary.items.map((item) => item.status)
    ) &&
    sameAuditStringList(
      row.personalTeamReadinessReviewOpenItemIds,
      summary.openItems.map((item) => item.id)
    )
  );
}

export function dailyOpsControlRoomReviewRowMatchesSummary(
  row: AuditEvidenceReportLedgerRow,
  summary: DailyOpsControlRoomSummary
): boolean {
  return (
    row.reportKind === "daily_ops_control_room_review" &&
    row.status === "ready" &&
    row.dailyOpsControlRoomReviewState === summary.state &&
    row.dailyOpsControlRoomReviewReadyCount === summary.readyCount &&
    row.dailyOpsControlRoomReviewReviewCount === summary.reviewCount &&
    row.dailyOpsControlRoomReviewBlockingCount === summary.blockingCount &&
    row.dailyOpsControlRoomReviewTotalCount === summary.totalCount &&
    row.dailyOpsControlRoomReviewPrimaryActionLabel === summary.primaryActionLabel &&
    row.dailyOpsControlRoomReviewPrimaryActionWorkspaceId === summary.primaryActionWorkspaceId &&
    row.dailyOpsControlRoomReviewAuditQuery === summary.auditQuery &&
    row.dailyOpsControlRoomReviewAuditQueryTitle === (summary.auditQueryTitle || "") &&
    sameAuditStringList(
      row.dailyOpsControlRoomReviewQueueItemIds,
      summary.queueItems.map((item) => item.id)
    ) &&
    sameAuditStringList(
      row.dailyOpsControlRoomReviewQueueItemStatuses,
      summary.queueItems.map((item) => item.status)
    ) &&
    sameAuditStringList(
      row.dailyOpsControlRoomReviewOpenItemIds,
      summary.openItems.map((item) => item.id)
    )
  );
}

export function dailyStartBriefReviewRowMatchesBrief(row: AuditEvidenceReportLedgerRow, brief: DailyStartBrief): boolean {
  return (
    row.reportKind === "daily_start_brief_review" &&
    row.status === "ready" &&
    row.dailyStartBriefReviewState === brief.state &&
    row.dailyStartBriefReviewCurrentReviewCount === brief.currentReviewCount &&
    row.dailyStartBriefReviewStaleReviewCount === brief.staleReviewCount &&
    row.dailyStartBriefReviewMissingReviewCount === brief.missingReviewCount &&
    row.dailyStartBriefReviewOpenOpsItemCount === brief.openOpsItemCount &&
    row.dailyStartBriefReviewPrimaryActionLabel === brief.primaryActionLabel &&
    row.dailyStartBriefReviewPrimaryActionWorkspaceId === brief.primaryActionWorkspaceId &&
    row.dailyStartBriefReviewAuditQuery === brief.auditQuery &&
    row.dailyStartBriefReviewAuditQueryTitle === (brief.auditQueryTitle || "") &&
    row.dailyStartBriefReviewLocalReviewStatus === brief.localReviewStatus &&
    row.dailyStartBriefReviewLocalReviewActionLabel === brief.localReviewActionLabel &&
    row.dailyStartBriefReviewLocalReviewQuery === brief.localReviewQuery &&
    sameAuditStringList(
      row.dailyStartBriefReviewCheckpointIds,
      brief.checkpoints.map((checkpoint) => checkpoint.id)
    ) &&
    sameAuditStringList(
      row.dailyStartBriefReviewCheckpointStatuses,
      brief.checkpoints.map((checkpoint) => checkpoint.status)
    )
  );
}

export function stage1DailyArchiveReviewRowMatchesContext(
  row: AuditEvidenceReportLedgerRow,
  {
    closure,
    invalidShareStatus,
    refreshOutcome,
    shareDeepLinkState
  }: {
    closure: Stage1P0DailyUseClosure;
    invalidShareStatus?: Stage1P0DailyUseShareDeepLinkStatus | null;
    refreshOutcome?: Stage1P0DailyUseRefreshOutcome | null;
    shareDeepLinkState?: Stage1P0DailyUseShareDeepLinkState | null;
  }
): boolean {
  const invalidShareStatusValue = invalidShareStatus?.status ?? "none";
  const invalidShareReason = invalidShareStatus?.status === "invalid" ? invalidShareStatus.reason : "none";
  const bootstrapChecks = closure.bootstrapPreflightChecks ?? [];
  return (
    row.reportKind === "stage1_daily_archive_review" &&
    row.status === "ready" &&
    row.stage1DailyArchiveReviewState === closure.state &&
    row.stage1DailyArchiveReviewReadyCount === closure.readyCount &&
    row.stage1DailyArchiveReviewTotalCount === closure.totalCount &&
    row.stage1DailyArchiveReviewPrimaryActionId === closure.primaryActionId &&
    row.stage1DailyArchiveReviewPrimaryActionLabel === closure.primaryActionLabel &&
    row.stage1DailyArchiveReviewPrimaryTargetWorkspaceId === closure.primaryTargetWorkspaceId &&
    row.stage1DailyArchiveReviewRefreshOutcomeState === (refreshOutcome?.state ?? "not-generated") &&
    row.stage1DailyArchiveReviewShareKind === (shareDeepLinkState?.kind ?? "none") &&
    row.stage1DailyArchiveReviewShareFocus === (shareDeepLinkState?.focus ?? "none") &&
    row.stage1DailyArchiveReviewShareTargetWorkspaceId === (shareDeepLinkState?.targetWorkspaceId ?? "none") &&
    row.stage1DailyArchiveReviewInvalidShareStatus === invalidShareStatusValue &&
    row.stage1DailyArchiveReviewInvalidShareReason === invalidShareReason &&
    row.stage1DailyArchiveReviewBootstrapPreflightP2ManifestChainPreflightSourcePath ===
      (closure.bootstrapPreflightSourcePaths?.p2ManifestChainPreflight ?? "") &&
    sameAuditStringList(
      row.stage1DailyArchiveReviewBootstrapPreflightCheckIds,
      bootstrapChecks.map((check) => check.id)
    ) &&
    sameAuditStringList(
      row.stage1DailyArchiveReviewBootstrapPreflightCheckStatuses,
      bootstrapChecks.map((check) => check.status)
    ) &&
    sameAuditStringList(
      row.stage1DailyArchiveReviewBootstrapPreflightCheckSourcePaths,
      bootstrapChecks.map((check) => check.sourcePath)
    ) &&
    sameAuditStringList(
      row.stage1DailyArchiveReviewRowIds,
      closure.rows.map((item) => item.id)
    ) &&
    sameAuditStringList(
      row.stage1DailyArchiveReviewRowLabels,
      closure.rows.map((item) => item.label)
    ) &&
    sameAuditStringList(
      row.stage1DailyArchiveReviewRowStatuses,
      closure.rows.map((item) => item.status)
    ) &&
    sameAuditStringList(
      row.stage1DailyArchiveReviewRowTargetWorkspaceIds,
      closure.rows.map((item) => item.targetWorkspaceId)
    )
  );
}

export function sameAuditStringList(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

export function buildPersonalTeamUsabilityReadinessReviewMarkdown({
  summary
}: {
  summary: PersonalTeamUsabilityReadinessSummary;
}): string {
  const openItemIds = summary.openItems.map((item) => item.id);

  return [
    "# Personal And Small-Team Readiness Review",
    "",
    "## Summary",
    `- State: ${summary.state}`,
    `- Headline: ${summary.headline}`,
    `- Detail: ${summary.detail}`,
    `- Personal readiness: ${summary.personalPercent}%`,
    `- Team readiness: ${summary.teamPercent}%`,
    `- Ready gates: ${summary.readyCount}/${summary.totalCount}`,
    `- Open items: ${openItemIds.length ? openItemIds.join(", ") : "none"}`,
    `- Next action: ${summary.nextActionLabel}`,
    `- Next workspace: ${summary.nextActionWorkspaceId}`,
    "",
    "## Readiness Gates",
    ...summary.items.map(
      (item) =>
        `- ${item.id}: ${item.status} · ${item.label} · ${item.actionLabel} · ${item.detail}`
    ),
    "",
    "## Execution Boundary",
    `- ${summary.liveBoundaryLabel}`,
    "- orderSubmissionEnabled: false",
    "- liveTradingAllowed: false",
    "- liveOrderSubmitted: false",
    "- routeExecuted: false",
    "- Platform decision: live trading and real order routing remain blocked.",
    "",
    "## Review Notes",
    "- This review is local audit evidence only and does not authorize live trading.",
    "- This review is not investment advice.",
    ""
  ].join("\n");
}

export function buildP2ReadinessAcceptanceReviewMarkdown({
  acceptance,
  summary
}: {
  acceptance: P2ReadinessAcceptanceReviewSource | null | undefined;
  summary: P2ReadinessAcceptanceSummary;
}): string {
  const criterionIds =
    acceptance?.criterionIds.length
      ? acceptance.criterionIds
      : summary.status === "incomplete"
        ? ["p2_readiness_acceptance_manifest_missing"]
        : ["p2_readiness_acceptance_manifest_invalid"];
  const auditEventIds = acceptance?.auditEventIds.length ? acceptance.auditEventIds : ["audit_event_missing"];
  const context = [acceptance?.market, acceptance?.symbol, acceptance?.timeframe].filter(Boolean).join(" ") || "n/a";
  const generatedAt = acceptance?.generatedAt || "n/a";
  const reason = acceptance?.reason || acceptance?.summary || summary.detail;
  const status = acceptance?.status ?? (summary.status === "accepted" ? "accepted" : summary.status === "blocked" ? "invalid" : "missing");
  const sourcePath = acceptance?.sourcePath ?? "data/p2-readiness-acceptance.json";
  const acceptedCriterionCount = acceptance?.acceptedCriterionCount ?? summary.acceptedCount;
  const totalCriterionCount = acceptance?.totalCriterionCount ?? summary.totalCount;
  const blockingCriterionCount = acceptance?.blockingCriterionCount ?? summary.blockingCount;
  const currentEvidenceCoverageReviewAuditEventId = summary.evidenceCoverageReviewAuditEventId ?? "";
  const reviewAuditEventIds = currentEvidenceCoverageReviewAuditEventId
    ? [...new Set([...auditEventIds, currentEvidenceCoverageReviewAuditEventId])]
    : auditEventIds;

  return [
    "# P2 Readiness Acceptance Review",
    "",
    "## Summary",
    `- Status: ${status}`,
    `- Headline: ${summary.headline}`,
    `- Detail: ${summary.detail}`,
    `- Source: ${sourcePath}`,
    `- Generated at: ${generatedAt}`,
    `- Run: ${acceptance?.runId || "n/a"}`,
    `- Context: ${context}`,
    `- Adapter: ${acceptance?.adapterId || "n/a"}`,
    `- Criteria: ${acceptedCriterionCount}/${totalCriterionCount}`,
    `- Blocking criteria: ${blockingCriterionCount}`,
    `- readinessCoverageStatus: ${acceptance?.readinessCoverageStatus || "n/a"}`,
    `- Current evidence coverage review: ${currentEvidenceCoverageReviewAuditEventId || "n/a"}`,
    "",
    "## Linked Manifests",
    `- p1Acceptance: ${acceptance?.manifestPaths.p1Acceptance || "n/a"}`,
    `- p2PreLiveAcceptance: ${acceptance?.manifestPaths.p2PreLiveAcceptance || "n/a"}`,
    `- p2PaperReplay: ${acceptance?.manifestPaths.p2PaperReplay || "n/a"}`,
    "",
    "## Execution Boundary",
    `- paperOnly: ${Boolean(acceptance?.paperOnly)}`,
    `- orderSubmissionEnabled: ${Boolean(acceptance?.orderSubmissionEnabled)}`,
    `- liveTradingAllowed: ${Boolean(acceptance?.liveTradingAllowed)}`,
    `- liveOrderSubmitted: ${Boolean(acceptance?.liveOrderSubmitted)}`,
    `- routeExecuted: ${Boolean(acceptance?.routeExecuted)}`,
    `- liveBlockedBoundary: ${Boolean(acceptance?.liveBlockedBoundary)}`,
    "- Platform decision: live trading and real order routing remain blocked.",
    "",
    "## Acceptance Criteria",
    ...criterionIds.map((criterionId) => `- ${criterionId}`),
    "",
    "## Audit Evidence",
    ...reviewAuditEventIds.map((eventId) => `- ${eventId}`),
    "",
    "## Review Notes",
    `- Reason: ${reason}`,
    "- This review is audit evidence only and does not authorize live trading.",
    ""
  ].join("\n");
}
