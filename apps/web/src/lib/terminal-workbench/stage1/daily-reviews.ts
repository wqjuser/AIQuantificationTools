import type { AuditEvidenceReportLedgerSummary } from "../audit/deep-link-queries";
import { auditReportLedgerDeduplicatedQueryText } from "../audit/local-review-bundle";
import type { AuditEvidenceReportLedgerRow } from "../audit/report-contracts";
import type { ProductWorkAreaId } from "./foundation-contracts";
import { p1AcceptanceHasUnsafeExecutionClaim } from "./manifest-summaries";
import type { DailyOpsControlRoomQueueItem, DailyOpsControlRoomQueueItemId, DailyOpsControlRoomQueueItemStatus, DailyOpsControlRoomReviewReference, DailyOpsControlRoomState, DailyOpsControlRoomSummary, DailyOpsControlRoomSummaryInput, DailyOpsControlRoomTone, DailyStartBrief, DailyStartBriefCheckpoint, DailyStartBriefInput, DailyStartBriefLocalReviewStatus, DailyStartBriefState, DailyStartBriefTone, P0CompletionChecklist, P0CompletionCriterionStatus, PersonalTeamUsabilityReadinessItem, PersonalTeamUsabilityReadinessState, PersonalTeamUsabilityReadinessSummary, PersonalTeamUsabilityReadinessSummaryInput, PersonalTeamUsabilityReadinessTone } from "./review-contracts";
import { dailyOpsControlRoomReviewRowMatchesSummary } from "./review-markdown";

export function buildPersonalTeamUsabilityReadinessSummary({
  auditEvidenceReportLedgerSummary,
  handoffNoteCount = 0,
  p0AcceptanceSummary,
  p0PlatformReadinessSummary,
  p1AcceptanceSummary,
  p2ManifestChainPreflightSummary,
  p2ReadinessAcceptanceSummary,
  p2ReadinessEvidenceCoverage
}: PersonalTeamUsabilityReadinessSummaryInput): PersonalTeamUsabilityReadinessSummary {
  const p0Unsafe =
    p0AcceptanceSummary.state === "invalid" ||
    p0AcceptanceSummary.reportedLiveTradingAllowed ||
    !p0AcceptanceSummary.liveBlockedBoundary ||
    p0PlatformReadinessSummary.liveBoundary.liveTradingAllowed;
  const p0Ready =
    !p0Unsafe &&
    (p0PlatformReadinessSummary.state === "paper_ready" || p0PlatformReadinessSummary.state === "live_ready") &&
    p0AcceptanceSummary.state === "passed";
  const p1Unsafe = p1AcceptanceHasUnsafeExecutionClaim(p1AcceptanceSummary);
  const p1Ready = !p1Unsafe && p1AcceptanceSummary.state === "passed";
  const p2Unsafe =
    p2ManifestChainPreflightSummary.state === "invalid" ||
    p2ManifestChainPreflightSummary.reportedOrderSubmissionEnabled ||
    p2ManifestChainPreflightSummary.reportedLiveTradingAllowed ||
    p2ManifestChainPreflightSummary.reportedLiveOrderSubmitted ||
    p2ManifestChainPreflightSummary.reportedRouteExecuted ||
    !p2ManifestChainPreflightSummary.liveBlockedBoundary ||
    p2ReadinessAcceptanceSummary.status === "blocked" ||
    p2ReadinessEvidenceCoverage.status === "blocked";
  const p2Ready =
    !p2Unsafe &&
    p2ManifestChainPreflightSummary.state === "ready" &&
    p2ReadinessAcceptanceSummary.status === "accepted" &&
    p2ReadinessEvidenceCoverage.status === "covered" &&
    p2ReadinessEvidenceCoverage.blockingCount === 0;
  const auditReady = Boolean(
    auditEvidenceReportLedgerSummary.latestAuditAidEventId ||
      p2ReadinessAcceptanceSummary.evidenceCoverageReviewAuditEventId
  );
  const handoffReady = handoffNoteCount > 0;
  const backupRestoreReady =
    p1AcceptanceSummary.importExportRoundTripReady || p0AcceptanceSummary.importExportRoundTripReady;

  const items: PersonalTeamUsabilityReadinessItem[] = [
    {
      id: "p0-local-loop",
      label: "P0 local paper loop",
      status: p0Ready ? "ready" : p0Unsafe || p0PlatformReadinessSummary.state === "blocked" ? "blocked" : "review",
      detail: p0Ready
        ? "Single-symbol research to paper execution is accepted for local paper-only use."
        : p0Unsafe
          ? "P0 evidence has unsafe live-trading claims or lacks the live-blocked boundary."
          : p0PlatformReadinessSummary.detail,
      actionLabel: p0Ready ? "Review accepted loop" : p0AcceptanceSummary.actionLabel,
      targetWorkspaceId: p0AcceptanceSummary.targetWorkspaceId
    },
    {
      id: "p1-research-ops",
      label: "P1 research ops",
      status: p1Ready ? "ready" : p1Unsafe ? "blocked" : "review",
      detail: p1Ready
        ? "Watchlist research operations are accepted and still paper-only."
        : p1Unsafe
          ? "P1 acceptance has unsafe live-trading claims or lacks the live-blocked boundary."
          : p1AcceptanceSummary.detail,
      actionLabel: p1Ready ? "Review research ops" : p1AcceptanceSummary.actionLabel,
      targetWorkspaceId: p1AcceptanceSummary.targetWorkspaceId
    },
    {
      id: "p2-prelive-chain",
      label: "P2 pre-live chain",
      status: p2Ready ? "ready" : p2Unsafe ? "blocked" : "review",
      detail: p2Ready
        ? "P2 paper replay, manifest chain, evidence coverage, and live boundary are accepted."
        : p2Unsafe
          ? "P2 readiness has unsafe execution claims or blocked evidence."
          : p2ReadinessAcceptanceSummary.detail,
      actionLabel: p2Ready ? "Review P2 readiness" : p2ManifestChainPreflightSummary.actionLabel,
      targetWorkspaceId: p2Ready ? "audit" : p2ManifestChainPreflightSummary.targetWorkspaceId
    },
    {
      id: "audit-traceability",
      label: "Audit traceability",
      status: auditReady ? "ready" : "review",
      detail: auditReady
        ? "Latest acceptance or audit-aid evidence is traceable from the Audit workspace."
        : "Record a current audit-aid or P2 readiness review event before team handoff.",
      actionLabel: auditReady ? "Open audit ledger" : "Record audit review",
      targetWorkspaceId: "audit"
    },
    {
      id: "team-handoff-runbook",
      label: "Team handoff runbook",
      status: handoffReady ? "ready" : "review",
      detail: handoffReady
        ? `${handoffNoteCount} local handoff note${handoffNoteCount === 1 ? "" : "s"} recorded for the current audited run.`
        : "Write the operator handoff, incident owner, and review cadence before small-team beta.",
      actionLabel: handoffReady ? "Open handoff notes" : "Create handoff runbook",
      targetWorkspaceId: "research"
    },
    {
      id: "backup-restore-drill",
      label: "Backup restore drill",
      status: backupRestoreReady ? "ready" : "review",
      detail: backupRestoreReady
        ? "Latest P0/P1 acceptance includes export, import, and imported-export restore checks."
        : "Run a repeatable export/import/imported-export restore drill before relying on shared use.",
      actionLabel: backupRestoreReady ? "Review restore evidence" : "Plan backup drill",
      targetWorkspaceId: "audit"
    }
  ];

  const personalItems = items.slice(0, 3);
  const readyCount = items.filter((item) => item.status === "ready").length;
  const totalCount = items.length;
  const openItems = items.filter((item) => item.status !== "ready");
  const personalPercent = readinessPercent(personalItems.filter((item) => item.status === "ready").length, personalItems.length);
  const teamPercent = readinessPercent(readyCount, totalCount);
  const state: PersonalTeamUsabilityReadinessState = items.some((item) => item.status === "blocked")
    ? "blocked"
    : openItems.length
      ? "attention"
      : "ready";
  const tone: PersonalTeamUsabilityReadinessTone =
    state === "ready" ? "positive" : state === "blocked" ? "risk" : "warning";
  const nextAction = openItems[0] ?? items[0];

  return {
    state,
    tone,
    headline:
      state === "ready"
        ? "Personal and small-team beta ready"
        : state === "blocked"
          ? "Personal paper loop blocked"
          : "Personal paper loop ready; team handoff pending",
    detail: `${readyCount}/${totalCount} usability gates ready; personal local paper loop ${personalPercent}%; small-team internal beta ${teamPercent}%. Live trading remains blocked.`,
    personalPercent,
    teamPercent,
    readyCount,
    totalCount,
    items,
    openItems,
    nextActionLabel: nextAction.actionLabel,
    nextActionWorkspaceId: nextAction.targetWorkspaceId,
    liveBoundaryLabel: "Paper-only · live blocked · no order submission"
  };
}

export function readinessPercent(readyCount: number, totalCount: number): number {
  return totalCount > 0 ? Math.round((Math.max(0, Math.min(readyCount, totalCount)) / totalCount) * 100) : 0;
}

export function buildDailyOpsControlRoomSummary({
  auditEvidenceReportLedgerSummary,
  personalTeamUsabilityReadiness,
  p0CompletionChecklist
}: DailyOpsControlRoomSummaryInput): DailyOpsControlRoomSummary {
  const auditQuery =
    auditEvidenceReportLedgerSummary.latestAuditAidReportQuery ||
    auditEvidenceReportLedgerSummary.latestP2ReadinessReviewChainQuery ||
    auditEvidenceReportLedgerSummary.latestP2ReadinessLinkedAcceptanceReviewQuery ||
    auditEvidenceReportLedgerSummary.p2ReadinessReviewChainHealthQuery ||
    "";
  const auditQueryLabel = dailyOpsAuditQueryLabel(auditEvidenceReportLedgerSummary);
  const auditQueryTitle = dailyOpsAuditQueryTitle(auditEvidenceReportLedgerSummary);
  const currentActionItem = buildDailyOpsCurrentActionItem({
    auditQuery,
    auditQueryTitle,
    personalTeamUsabilityReadiness,
    p0CompletionChecklist
  });
  const teamHandoffItem = buildDailyOpsPersonalTeamItem({
    auditQuery,
    auditQueryTitle,
    fallbackActionLabel: "Create handoff runbook",
    fallbackDetail: "Write the operator handoff, incident owner, and review cadence before small-team beta.",
    fallbackLabel: "Team handoff runbook",
    fallbackWorkspaceId: "research",
    id: "team-handoff",
    sourceItem: personalTeamUsabilityReadiness.items.find((item) => item.id === "team-handoff-runbook")
  });
  const backupRestoreItem = buildDailyOpsPersonalTeamItem({
    auditQuery,
    auditQueryTitle,
    fallbackActionLabel: "Plan backup drill",
    fallbackDetail: "Run a repeatable export/import/imported-export restore drill before shared use.",
    fallbackLabel: "Backup restore drill",
    fallbackWorkspaceId: "audit",
    id: "backup-restore",
    sourceItem: personalTeamUsabilityReadiness.items.find((item) => item.id === "backup-restore-drill")
  });
  const auditContextReady = Boolean(auditQuery || auditEvidenceReportLedgerSummary.latestAuditAidEventId);
  const auditContextItem: DailyOpsControlRoomQueueItem = {
    id: "audit-context",
    label: "Audit context",
    status: auditContextReady ? "ready" : "review",
    tone: auditContextReady ? "positive" : "warning",
    detail: auditContextReady
      ? auditQueryTitle
        ? `${auditQueryLabel} is available for read-only review: ${auditQueryTitle}.`
        : `${auditQueryLabel} is available for read-only review.`
      : "Record or load a current audit-aid report before sharing daily status.",
    actionLabel: auditContextReady ? "Open audit evidence" : "Open audit ledger",
    targetWorkspaceId: "audit",
    auditQuery,
    auditQueryTitle
  };
  const queueItems = [currentActionItem, auditContextItem, teamHandoffItem, backupRestoreItem];
  const readyCount = queueItems.filter((item) => item.status === "ready").length;
  const reviewCount = queueItems.filter((item) => item.status === "review").length;
  const blockingCount = queueItems.filter((item) => item.status === "blocked").length;
  const totalCount = queueItems.length;
  const state: DailyOpsControlRoomState = blockingCount > 0 ? "blocked" : reviewCount > 0 ? "attention" : "ready";
  const tone: DailyOpsControlRoomTone = dailyOpsTone(state);
  const openItems = queueItems.filter((item) => item.status !== "ready");
  const primaryAction = openItems[0] ?? currentActionItem;

  return {
    state,
    tone,
    headline:
      state === "ready"
        ? "Daily ops ready for paper review"
        : state === "blocked"
          ? `Daily ops has ${blockingCount} blocker${blockingCount === 1 ? "" : "s"}`
          : `Daily ops needs ${reviewCount} review${reviewCount === 1 ? "" : "s"}`,
    detail: `${readyCount}/${totalCount} ops gates ready; ${reviewCount} need review; ${blockingCount} blocked. Live trading remains blocked.`,
    primaryActionLabel: primaryAction.actionLabel,
    primaryActionWorkspaceId: primaryAction.targetWorkspaceId,
    auditQueryLabel,
    auditQuery,
    auditQueryTitle,
    readyCount,
    reviewCount,
    blockingCount,
    totalCount,
    queueItems,
    openItems,
    liveBoundaryLabel: personalTeamUsabilityReadiness.liveBoundaryLabel
  };
}

export function buildDailyOpsCurrentActionItem({
  auditQuery,
  auditQueryTitle,
  personalTeamUsabilityReadiness,
  p0CompletionChecklist
}: {
  auditQuery: string;
  auditQueryTitle: string;
  personalTeamUsabilityReadiness: PersonalTeamUsabilityReadinessSummary;
  p0CompletionChecklist: P0CompletionChecklist;
}): DailyOpsControlRoomQueueItem {
  const personalBlocker = personalTeamUsabilityReadiness.openItems.find((item) => item.status === "blocked");
  const completionGap = p0CompletionChecklist.currentGap;
  const personalOpenItem = personalTeamUsabilityReadiness.openItems[0] ?? null;

  if (personalBlocker) {
    const status = dailyOpsStatusFromPersonalTeamItem(personalBlocker);
    return {
      id: "current-action",
      label: "Current action",
      status,
      tone: dailyOpsTone(status),
      detail: personalBlocker.detail,
      actionLabel: personalBlocker.actionLabel,
      targetWorkspaceId: personalBlocker.targetWorkspaceId,
      auditQuery,
      auditQueryTitle
    };
  }

  if (completionGap) {
    const status = dailyOpsStatusFromP0Completion(completionGap.status);
    return {
      id: "current-action",
      label: "Current action",
      status,
      tone: dailyOpsTone(status),
      detail: completionGap.detail,
      actionLabel: completionGap.actionLabel ?? "Open completion gap",
      targetWorkspaceId: completionGap.targetWorkspaceId,
      auditQuery,
      auditQueryTitle
    };
  }

  if (personalOpenItem) {
    const status = dailyOpsStatusFromPersonalTeamItem(personalOpenItem);
    return {
      id: "current-action",
      label: "Current action",
      status,
      tone: dailyOpsTone(status),
      detail: personalOpenItem.detail,
      actionLabel: personalOpenItem.actionLabel,
      targetWorkspaceId: personalOpenItem.targetWorkspaceId,
      auditQuery,
      auditQueryTitle
    };
  }

  return {
    id: "current-action",
    label: "Current action",
    status: "ready",
    tone: "positive",
    detail: "Daily paper-only operations are ready for read-only audit review.",
    actionLabel: "Open audit ledger",
    targetWorkspaceId: "audit",
    auditQuery,
    auditQueryTitle
  };
}

export function buildDailyOpsPersonalTeamItem({
  auditQuery,
  auditQueryTitle,
  fallbackActionLabel,
  fallbackDetail,
  fallbackLabel,
  fallbackWorkspaceId,
  id,
  sourceItem
}: {
  auditQuery: string;
  auditQueryTitle: string;
  fallbackActionLabel: string;
  fallbackDetail: string;
  fallbackLabel: string;
  fallbackWorkspaceId: ProductWorkAreaId;
  id: Exclude<DailyOpsControlRoomQueueItemId, "audit-context" | "current-action">;
  sourceItem: PersonalTeamUsabilityReadinessItem | undefined;
}): DailyOpsControlRoomQueueItem {
  const status = sourceItem ? dailyOpsStatusFromPersonalTeamItem(sourceItem) : "review";
  return {
    id,
    label: sourceItem?.label ?? fallbackLabel,
    status,
    tone: dailyOpsTone(status),
    detail: sourceItem?.detail ?? fallbackDetail,
    actionLabel: sourceItem?.actionLabel ?? fallbackActionLabel,
    targetWorkspaceId: sourceItem?.targetWorkspaceId ?? fallbackWorkspaceId,
    auditQuery,
    auditQueryTitle
  };
}

export function dailyOpsStatusFromPersonalTeamItem(
  item: PersonalTeamUsabilityReadinessItem
): DailyOpsControlRoomQueueItemStatus {
  return item.status === "ready" ? "ready" : item.status === "blocked" ? "blocked" : "review";
}

export function dailyOpsStatusFromP0Completion(status: P0CompletionCriterionStatus): DailyOpsControlRoomQueueItemStatus {
  return status === "passed" ? "ready" : status === "blocked" ? "blocked" : "review";
}

export function dailyOpsTone(status: DailyOpsControlRoomState | DailyOpsControlRoomQueueItemStatus): DailyOpsControlRoomTone {
  return status === "ready" ? "positive" : status === "blocked" ? "risk" : "warning";
}

export function dailyOpsAuditQueryLabel(summary: AuditEvidenceReportLedgerSummary): string {
  if (summary.latestAuditAidReportQuery) {
    return "Latest P0 audit evidence";
  }
  if (summary.latestP2ReadinessReviewChainQuery || summary.latestP2ReadinessLinkedAcceptanceReviewQuery) {
    return "Latest P2 review chain";
  }
  if (summary.p2ReadinessReviewChainHealthQuery) {
    return "P2 review chain health";
  }
  return "Audit ledger";
}

export function dailyOpsAuditQueryTitle(summary: AuditEvidenceReportLedgerSummary): string {
  if (summary.latestAuditAidReportQuery) {
    return "";
  }
  if (summary.latestP2ReadinessReviewChainQuery) {
    return summary.latestP2ReadinessReviewChainLabel;
  }
  if (summary.latestP2ReadinessLinkedAcceptanceReviewQuery) {
    return summary.latestP2ReadinessLinkedCoverageReviewLabel;
  }
  if (summary.p2ReadinessReviewChainHealthQuery) {
    return summary.p2ReadinessReviewChainHealthTitle;
  }
  return "";
}

export function buildDailyOpsControlRoomReviewMarkdown({
  summary
}: {
  summary: DailyOpsControlRoomSummary;
}): string {
  return [
    "# Daily Ops Control Room Review",
    "",
    "## Summary",
    `- State: ${summary.state}`,
    `- Headline: ${summary.headline}`,
    `- Detail: ${summary.detail}`,
    `- Ready ops gates: ${summary.readyCount}/${summary.totalCount}`,
    `- Review gates: ${summary.reviewCount}`,
    `- Blocking gates: ${summary.blockingCount}`,
    `- Primary action: ${summary.primaryActionLabel} (${summary.primaryActionWorkspaceId})`,
    `- Audit query label: ${summary.auditQueryLabel}`,
    `- Audit query: ${summary.auditQuery || "none"}`,
    `- Audit query title: ${summary.auditQueryTitle || "none"}`,
    `- Live boundary: ${summary.liveBoundaryLabel}`,
    "",
    "## Daily Ops Queue",
    ...summary.queueItems.map((item) =>
      [
        `- ${item.id}: ${item.status}`,
        `  - Label: ${item.label}`,
        `  - Detail: ${item.detail}`,
        `  - Action: ${item.actionLabel}`,
        `  - Target workspace: ${item.targetWorkspaceId}`,
        `  - Audit query: ${item.auditQuery || "none"}`,
        `  - Audit query title: ${item.auditQueryTitle || "none"}`
      ].join("\n")
    ),
    "",
    "## Open Items",
    summary.openItems.length ? summary.openItems.map((item) => `- ${item.id}: ${item.actionLabel}`) : "- none",
    "",
    "## Boundary",
    "- Platform decision: live trading and real order routing remain blocked.",
    "- This review is a local daily-ops audit aid only; it does not authorize live trading or investment advice."
  ]
    .flat()
    .join("\n");
}

export function buildDailyOpsControlRoomReviewReference({
  ledgerRows,
  summary
}: {
  ledgerRows: AuditEvidenceReportLedgerRow[];
  summary: DailyOpsControlRoomSummary;
}): DailyOpsControlRoomReviewReference {
  const latestRow =
    ledgerRows
      .filter((row) => row.reportKind === "daily_ops_control_room_review" && row.status === "ready")
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0] ?? null;

  if (!latestRow) {
    return {
      createdAt: "",
      detail: "No daily ops control room review has been recorded yet.",
      eventId: "",
      label: "No daily ops review recorded",
      query: "",
      row: null,
      status: "missing"
    };
  }

  const query = auditReportLedgerDeduplicatedQueryText([
    "daily_ops_control_room_review",
    latestRow.id,
    latestRow.dailyOpsControlRoomReviewState,
    `${latestRow.dailyOpsControlRoomReviewReadyCount}/${latestRow.dailyOpsControlRoomReviewTotalCount}`
  ]);
  const isCurrent = dailyOpsControlRoomReviewRowMatchesSummary(latestRow, summary);
  const stateLabel = `${latestRow.dailyOpsControlRoomReviewState || latestRow.focusQuery} ${
    latestRow.dailyOpsControlRoomReviewReadyCount
  }/${latestRow.dailyOpsControlRoomReviewTotalCount}`;
  const archivedStateLabel = `${stateLabel} review ${latestRow.dailyOpsControlRoomReviewReviewCount} blocked ${latestRow.dailyOpsControlRoomReviewBlockingCount}`;
  const currentStateLabel = `${summary.state} ${summary.readyCount}/${summary.totalCount} review ${summary.reviewCount} blocked ${summary.blockingCount}`;
  const stateStaleReason =
    !isCurrent && archivedStateLabel !== currentStateLabel
      ? ` Daily ops state changed from ${archivedStateLabel} to ${currentStateLabel}.`
      : "";
  const archivedPrimaryAction = `${latestRow.dailyOpsControlRoomReviewPrimaryActionLabel}->${latestRow.dailyOpsControlRoomReviewPrimaryActionWorkspaceId}`;
  const currentPrimaryAction = `${summary.primaryActionLabel}->${summary.primaryActionWorkspaceId}`;
  const primaryActionStaleReason =
    !isCurrent && archivedPrimaryAction !== currentPrimaryAction
      ? ` Primary action changed from ${archivedPrimaryAction} to ${currentPrimaryAction}.`
      : "";
  const archivedAuditContext = `${latestRow.dailyOpsControlRoomReviewAuditQueryTitle || "none"}->${
    latestRow.dailyOpsControlRoomReviewAuditQuery || "none"
  }`;
  const currentAuditContext = `${summary.auditQueryTitle || "none"}->${summary.auditQuery || "none"}`;
  const auditContextStaleReason =
    !isCurrent && archivedAuditContext !== currentAuditContext
      ? ` Audit context changed from ${archivedAuditContext} to ${currentAuditContext}.`
      : "";
  const archivedQueueItems = latestRow.dailyOpsControlRoomReviewQueueItemIds
    .map((id, index) => `${id}:${latestRow.dailyOpsControlRoomReviewQueueItemStatuses[index] || "unknown"}`)
    .join(", ");
  const currentQueueItems = summary.queueItems.map((item) => `${item.id}:${item.status}`).join(", ");
  const queueItemsStaleReason =
    !isCurrent && archivedQueueItems !== currentQueueItems
      ? ` Queue items changed from ${archivedQueueItems || "none"} to ${currentQueueItems || "none"}.`
      : "";
  const archivedOpenItems = latestRow.dailyOpsControlRoomReviewOpenItemIds.join(", ");
  const currentOpenItems = summary.openItems.map((item) => item.id).join(", ");
  const openItemsStaleReason =
    !isCurrent && archivedOpenItems !== currentOpenItems
      ? ` Open items changed from ${archivedOpenItems || "none"} to ${currentOpenItems || "none"}.`
      : "";

  return {
    createdAt: latestRow.createdAt,
    detail: isCurrent
      ? `Latest review ${latestRow.id} matches current daily ops queue (${stateLabel}).`
      : `Latest review ${latestRow.id} no longer matches current daily ops queue (${stateLabel}); record a fresh review.${stateStaleReason}${primaryActionStaleReason}${auditContextStaleReason}${queueItemsStaleReason}${openItemsStaleReason}`,
    eventId: latestRow.id,
    label: isCurrent ? "Daily ops review current" : "Daily ops review stale",
    query,
    row: latestRow,
    status: isCurrent ? "current" : "stale"
  };
}

export function buildDailyStartBrief({
  dailyOpsControlRoom,
  dailyOpsControlRoomReviewReference,
  personalTeamReadinessReviewReference,
  personalTeamUsabilityReadiness
}: DailyStartBriefInput): DailyStartBrief {
  const reviewReferences = [
    {
      id: "personal-team-review" as const,
      label: "Personal/team readiness review",
      reference: personalTeamReadinessReviewReference,
      targetWorkspaceId: "research" as const
    },
    {
      id: "daily-ops-review" as const,
      label: "Daily ops review",
      reference: dailyOpsControlRoomReviewReference,
      targetWorkspaceId: "research" as const
    }
  ];
  const currentReviewCount = reviewReferences.filter((item) => item.reference.status === "current").length;
  const staleReviewCount = reviewReferences.filter((item) => item.reference.status === "stale").length;
  const missingReviewCount = reviewReferences.filter((item) => item.reference.status === "missing").length;
  const localReviewStatus: DailyStartBriefLocalReviewStatus =
    missingReviewCount > 0 ? "missing" : staleReviewCount > 0 ? "stale" : "current";
  const state: DailyStartBriefState =
    dailyOpsControlRoom.state === "blocked" || personalTeamUsabilityReadiness.state === "blocked"
      ? "blocked"
      : localReviewStatus !== "current" || dailyOpsControlRoom.state === "attention"
        ? "attention"
        : "ready";
  const tone: DailyStartBriefTone = state === "ready" ? "positive" : state === "blocked" ? "risk" : "warning";
  const localReviewQuery =
    reviewReferences.find((item) => item.reference.status !== "missing" && item.reference.query)?.reference.query ||
    dailyOpsControlRoomReviewReference.query ||
    personalTeamReadinessReviewReference.query ||
    "";
  const currentLocalReviewQuery = dailyOpsControlRoomReviewReference.query || personalTeamReadinessReviewReference.query || "";
  const localReviewWorkspaceId: ProductWorkAreaId = localReviewStatus === "current" && localReviewQuery ? "audit" : "research";
  const localReviewActionLabel =
    localReviewStatus === "missing"
      ? "Record local reviews"
      : localReviewStatus === "stale"
        ? "Refresh local reviews"
        : "Open local review evidence";
  const missingLabels = reviewReferences
    .filter((item) => item.reference.status === "missing")
    .map((item) => item.label.toLowerCase());
  const staleLabels = reviewReferences
    .filter((item) => item.reference.status === "stale")
    .map((item) => item.label.toLowerCase());
  const localReviewDetail =
    localReviewStatus === "current"
      ? "Personal/team readiness and daily ops reviews match the current model state."
    : localReviewStatus === "missing"
        ? `${formatDailyStartBriefReviewList(missingLabels)} ${missingLabels.length === 1 ? "is" : "are"} missing; record fresh local review evidence before handoff.`
        : `${formatDailyStartBriefReviewList(staleLabels)} ${staleLabels.length === 1 ? "is" : "are"} stale; refresh local review evidence before handoff.`;

  const checkpoints: DailyStartBriefCheckpoint[] = [
    {
      id: "ops-queue",
      label: "Daily ops queue",
      status: dailyOpsControlRoom.state === "ready" ? "ready" : dailyOpsControlRoom.state === "blocked" ? "blocked" : "review",
      detail: dailyOpsControlRoom.detail,
      actionLabel: dailyOpsControlRoom.primaryActionLabel,
      targetWorkspaceId: dailyOpsControlRoom.primaryActionWorkspaceId,
      query: dailyOpsControlRoom.auditQuery,
      queryTitle: dailyOpsControlRoom.auditQueryTitle || ""
    },
    ...reviewReferences.map((item): DailyStartBriefCheckpoint => ({
      id: item.id,
      label: item.label,
      status: item.reference.status,
      detail: item.reference.detail,
      actionLabel:
        item.reference.status === "current"
          ? "Open review evidence"
          : item.reference.status === "stale"
            ? "Refresh review"
            : "Record review",
      targetWorkspaceId: item.reference.status === "current" && item.reference.query ? "audit" : item.targetWorkspaceId,
      query: item.reference.query,
      queryTitle: ""
    })),
    {
      id: "live-boundary",
      label: "Live boundary",
      status: "ready",
      detail: dailyOpsControlRoom.liveBoundaryLabel,
      actionLabel: "Keep paper-only boundary",
      targetWorkspaceId: "execution",
      query: "",
      queryTitle: ""
    }
  ];

  return {
    state,
    tone,
    headline:
      state === "blocked"
        ? "Daily start is blocked"
        : localReviewStatus !== "current"
          ? "Daily start needs fresh local review"
          : dailyOpsControlRoom.state === "attention"
            ? "Daily start needs an ops action"
            : "Daily start ready for paper review",
    detail: `${dailyOpsControlRoom.readyCount}/${dailyOpsControlRoom.totalCount} ops gates ready · ${currentReviewCount}/2 local reviews current · ${dailyOpsControlRoom.openItems.length} open ops item${dailyOpsControlRoom.openItems.length === 1 ? "" : "s"}. Live trading remains blocked.`,
    primaryActionLabel: dailyOpsControlRoom.primaryActionLabel,
    primaryActionWorkspaceId: dailyOpsControlRoom.primaryActionWorkspaceId,
    auditActionLabel: dailyOpsControlRoom.auditQuery ? "Open audit context" : "Open audit ledger",
    auditQuery: dailyOpsControlRoom.auditQuery,
    auditQueryTitle: dailyOpsControlRoom.auditQueryTitle || "",
    localReviewStatus,
    localReviewActionLabel,
    localReviewDetail,
    localReviewQuery: localReviewStatus === "current" ? currentLocalReviewQuery : localReviewQuery,
    localReviewWorkspaceId,
    currentReviewCount,
    staleReviewCount,
    missingReviewCount,
    openOpsItemCount: dailyOpsControlRoom.openItems.length,
    checkpoints,
    liveBoundaryLabel: dailyOpsControlRoom.liveBoundaryLabel
  };
}

export function formatDailyStartBriefReviewList(labels: string[]): string {
  if (labels.length === 0) {
    return "local reviews";
  }
  const readableLabels = labels.map((label) => label.replace(/\s+review$/u, ""));
  if (labels.length === 1) {
    return readableLabels[0];
  }
  return `${readableLabels.slice(0, -1).join(", ")} and ${readableLabels[readableLabels.length - 1]} reviews`;
}

export function buildDailyStartBriefMarkdown({ brief }: { brief: DailyStartBrief }): string {
  return [
    "# Daily Start Brief",
    "",
    "## Summary",
    `- State: ${brief.state}`,
    `- Headline: ${brief.headline}`,
    `- Detail: ${brief.detail}`,
    `- Primary action: ${brief.primaryActionLabel} (${brief.primaryActionWorkspaceId})`,
    `- Audit action: ${brief.auditActionLabel}`,
    `- Audit query: ${brief.auditQuery || "none"}`,
    `- Audit query title: ${brief.auditQueryTitle || "none"}`,
    `- Local review status: ${brief.localReviewStatus}`,
    `- Local review action: ${brief.localReviewActionLabel} (${brief.localReviewWorkspaceId})`,
    `- Local review query: ${brief.localReviewQuery || "none"}`,
    `- Live boundary: ${brief.liveBoundaryLabel}`,
    "",
    "## Checkpoints",
    ...brief.checkpoints.map((checkpoint) =>
      [
        `- ${checkpoint.id}: ${checkpoint.status}`,
        `  - Label: ${checkpoint.label}`,
        `  - Detail: ${checkpoint.detail}`,
        `  - Action: ${checkpoint.actionLabel}`,
        `  - Target workspace: ${checkpoint.targetWorkspaceId}`,
        `  - Query: ${checkpoint.query || "none"}`,
        `  - Query title: ${checkpoint.queryTitle || "none"}`
      ].join("\n")
    ),
    "",
    "## Boundary",
    "- Platform decision: live trading and real order routing remain blocked.",
    "- This brief only organizes the next local paper-only operating step; it does not authorize live trading or investment advice."
  ]
    .flat()
    .join("\n");
}
