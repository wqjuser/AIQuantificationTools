import type { P0CurrentGapActionReadinessReason } from "./deep-link-queries";
import { auditSigningKeyRotationChainStageSpecs } from "./evidence-control-room";
import type { AuditSigningKeyRotationChainStage, AuditSigningKeyRotationChainStageStatus, AuditSigningKeyRotationChainState, AuditSigningKeyRotationChainSummary, AuditSigningKeyRotationLedgerEventKind, AuditSigningKeyRotationLedgerRow } from "./execution-contracts";
import type { AuditEvidenceReportLedgerRow, AuditEvidenceReportSignatureStatus, ResearchRunImportAuditBlockedRow, ResearchRunImportAuditEvent, ResearchRunImportAuditEventStage, ResearchRunImportAuditFailureBucketCategory, ResearchRunImportAuditFilter, ResearchRunImportBlockedEvidenceBucket, ResearchRunImportBlockedEvidenceBucketCategory, ResearchRunImportFailureCategory, ResearchRunImportVerifiedReportSignatureBucket } from "./report-contracts";
import type { AiReviewAuditTimelineItem } from "../portfolio/paper-contracts";
import { buildRefreshEvidenceReadinessRow, buildResearchWorkspaceReadinessRow, buildWatchlistReadinessRow, cacheReadinessDetail, isReviewRequiredKlineSource, readinessTone } from "../research/readiness-builders";
import type { ResearchContextMarketCalendar, ResearchContextReadinessInput, ResearchContextReadinessRow, ResearchContextReadinessStatus, ResearchRunNote } from "../stage1/archive-contracts";
import type { P0CompletionCriterionStatus } from "../stage1/review-contracts";
import { formatWarningCount } from "../strategy/backtest-builders";

export function buildAuditSigningKeyRotationChainSummary(
  rows: AuditSigningKeyRotationLedgerRow[]
): AuditSigningKeyRotationChainSummary {
  const proposedKeyId = resolveLatestAuditSigningKeyRotationChainKey(rows);
  const scopedRows = proposedKeyId ? rows.filter((row) => row.proposedKeyId === proposedKeyId) : [];
  const stages = auditSigningKeyRotationChainStageSpecs.map<AuditSigningKeyRotationChainStage>((stage) => {
    const row = latestAuditSigningKeyRotationRowByKind(scopedRows, stage.eventKind);
    if (!row) {
      return {
        id: stage.id,
        label: stage.label,
        rowId: "",
        status: "missing",
        statusLabel: "Missing",
        createdAt: "",
        detail: "Awaiting evidence"
      };
    }
    const status: AuditSigningKeyRotationChainStageStatus = row.status === "blocked" ? "blocked" : "complete";
    return {
      id: stage.id,
      label: stage.label,
      rowId: row.id,
      status,
      statusLabel: row.statusLabel,
      createdAt: row.createdAt,
      detail: row.blockedReasonLabel === "none" ? row.applyMode || row.templateShortHash || row.eventKind : row.blockedReasonLabel
    };
  });
  const totalCount = stages.length;
  const completedCount = stages.filter((stage) => stage.status === "complete").length;
  const blockedCount = stages.filter((stage) => stage.status === "blocked").length;
  const missingCount = stages.filter((stage) => stage.status === "missing").length;
  const nextStage = stages.find((stage) => stage.status !== "complete") ?? null;
  const state: AuditSigningKeyRotationChainState =
    !proposedKeyId || !rows.length
      ? "empty"
      : blockedCount > 0
        ? "blocked"
        : completedCount === totalCount
          ? "complete"
          : "in_progress";
  const headline =
    state === "complete"
      ? "Rotation chain accepted"
      : state === "blocked"
        ? "Rotation chain blocked"
        : state === "in_progress"
          ? "Rotation chain in progress"
          : "No rotation chain";
  const detail =
    state === "empty"
      ? "No signing key rotation evidence yet"
      : state === "blocked"
        ? `${completedCount}/${totalCount} evidence stages recorded · blocked: ${nextStage?.label ?? "Evidence"}`
        : state === "complete"
          ? `${completedCount}/${totalCount} evidence stages recorded · live remains blocked`
          : `${completedCount}/${totalCount} evidence stages recorded · next: ${nextStage?.label ?? "Evidence"}`;

  return {
    blockedCount,
    completedCount,
    detail,
    headline,
    missingCount,
    nextStageId: nextStage?.id ?? null,
    proposedKeyId,
    stages,
    state,
    totalCount
  };
}

export function resolveLatestAuditSigningKeyRotationChainKey(rows: AuditSigningKeyRotationLedgerRow[]): string {
  const rankedRows = [...rows]
    .filter((row) => row.proposedKeyId)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  const acceptedRow = rankedRows.find((row) => row.eventKind === "rotation_acceptance" && row.status === "acceptance_recorded");
  return acceptedRow?.proposedKeyId ?? rankedRows[0]?.proposedKeyId ?? "";
}

export function latestAuditSigningKeyRotationRowByKind(
  rows: AuditSigningKeyRotationLedgerRow[],
  eventKind: AuditSigningKeyRotationLedgerEventKind
): AuditSigningKeyRotationLedgerRow | null {
  return (
    [...rows]
      .filter((row) => row.eventKind === eventKind)
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0] ?? null
  );
}

export function auditReportLedgerMetadataText(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  return typeof value === "string" ? value : "";
}

export function auditReportLedgerMetadataHas(metadata: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(metadata, key);
}

export function auditReportLedgerMetadataBoolean(metadata: Record<string, unknown>, key: string, fallback = false): boolean {
  const value = metadata[key];
  return typeof value === "boolean" ? value : fallback;
}

export function auditReportLedgerP0CompletionCriterionStatus(value: string): P0CompletionCriterionStatus | "" {
  return value === "passed" || value === "review" || value === "blocked" ? value : "";
}

export function auditReportLedgerP0ReadinessReason(
  reason: string,
  fallback: P0CurrentGapActionReadinessReason
): P0CurrentGapActionReadinessReason {
  return reason === "missing-action" ||
    reason === "missing-workspace" ||
    reason === "not-ready-report" ||
    reason === "ready" ||
    reason === "unknown-action"
    ? reason
    : fallback;
}

export function auditReportLedgerMetadataStringList(metadata: Record<string, unknown>, key: string): string[] {
  const value = metadata[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function auditReportLedgerSignatureMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const value = metadata.signature;
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function auditReportLedgerSignatureStatus(
  signature: Record<string, unknown>
): AuditEvidenceReportSignatureStatus {
  const value = auditReportLedgerMetadataText(signature, "status").toLowerCase();
  return value === "signed" || value === "verified" || value === "revoked" || value === "invalid"
    ? value
    : "unsigned";
}

export function auditReportLedgerSignatureLabel(status: AuditEvidenceReportSignatureStatus): string {
  if (status === "verified") {
    return "Verified signature";
  }
  if (status === "signed") {
    return "Signed report hash";
  }
  if (status === "revoked") {
    return "Revoked signature";
  }
  if (status === "invalid") {
    return "Signature chain blocked";
  }
  return "Unsigned report hash";
}

export function auditReportLedgerSignatureTone(
  status: AuditEvidenceReportSignatureStatus
): AuditEvidenceReportLedgerRow["tone"] {
  return status === "signed" || status === "verified" ? "positive" : status === "revoked" || status === "invalid" ? "risk" : "ai";
}

export function auditReportLedgerSignatureDetail(signature: Record<string, unknown>): string {
  return [
    auditReportLedgerMetadataText(signature, "signer"),
    auditReportLedgerMetadataText(signature, "keyId"),
    auditReportLedgerMetadataText(signature, "algorithm")
  ]
    .filter(Boolean)
    .join(" · ");
}

export function auditReportLedgerImportVerificationDetail(
  metadata: Record<string, unknown>,
  verified: number,
  invalid: number
): string {
  const latestStatus = auditReportLedgerMetadataText(metadata, "importVerificationLatestStatus");
  const latestExportPath = auditReportLedgerMetadataText(metadata, "importVerificationLatestExportPath");
  const latestReason = auditReportLedgerMetadataText(metadata, "importVerificationLatestReason");
  const latestSource = auditReportLedgerMetadataText(metadata, "importVerificationLatestSource");
  const latestDetail =
    latestStatus && latestExportPath
      ? ` · latest ${latestStatus} ${latestExportPath}${latestReason ? ` · ${latestReason}` : ""}${
          latestSource ? ` · ${latestSource}` : ""
        }`
      : "";
  return `Import report verification: ${verified} verified / ${invalid} invalid${latestDetail}`;
}

export function auditReportLedgerMetadataNumber(metadata: Record<string, unknown>, key: string): number {
  const value = metadata[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export const researchRunImportFailureBucketOrder: ResearchRunImportAuditFailureBucketCategory[] = [
  "blocked",
  "schema",
  "integrity",
  "artifact-counts",
  "core",
  "unknown"
];

export function researchRunImportFailureBucketLabel(category: ResearchRunImportAuditFailureBucketCategory): string {
  return (
    {
      blocked: "Preflight blocked",
      schema: "Schema contract",
      integrity: "Integrity check",
      "artifact-counts": "Artifact counts",
      core: "Core rejection",
      unknown: "Unknown failure"
    } satisfies Record<ResearchRunImportAuditFailureBucketCategory, string>
  )[category];
}

export const researchRunImportBlockedEvidenceBucketOrder: ResearchRunImportBlockedEvidenceBucketCategory[] = [
  "import-verification",
  "report-signature",
  "package-integrity",
  "artifact-counts",
  "live-boundary",
  "data-snapshot",
  "unknown"
];

export function researchRunImportBlockedEvidenceBucketCategory(
  row: ResearchRunImportAuditBlockedRow
): ResearchRunImportBlockedEvidenceBucketCategory {
  const searchableText = [row.id, row.label, row.incoming, row.detail, row.exportPath].join(" ").toLowerCase();
  if (
    searchableText.includes("invalid imported evidence") ||
    searchableText.includes("import verification") ||
    searchableText.includes("local core import verification")
  ) {
    return "import-verification";
  }
  if (row.id === "audit-report" || row.id === "backtest-report" || searchableText.includes("signature")) {
    return "report-signature";
  }
  if (row.id === "package-integrity" || searchableText.includes("integrity")) {
    return "package-integrity";
  }
  if (row.id === "artifact-counts" || searchableText.includes("artifact")) {
    return "artifact-counts";
  }
  if (row.id === "live-boundary" || searchableText.includes("live boundary")) {
    return "live-boundary";
  }
  if (row.id === "data-snapshot" || searchableText.includes("data snapshot")) {
    return "data-snapshot";
  }
  return "unknown";
}

export function researchRunImportBlockedEvidenceBucketLabel(
  category: ResearchRunImportBlockedEvidenceBucketCategory
): string {
  return (
    {
      "import-verification": "Import verification",
      "report-signature": "Report signature",
      "package-integrity": "Package integrity",
      "artifact-counts": "Artifact counts",
      "live-boundary": "Live boundary",
      "data-snapshot": "Data snapshot",
      unknown: "Other blocked evidence"
    } satisfies Record<ResearchRunImportBlockedEvidenceBucketCategory, string>
  )[category];
}

export function researchRunImportBlockedEvidenceBucketTone(
  category: ResearchRunImportBlockedEvidenceBucketCategory
): ResearchRunImportBlockedEvidenceBucket["tone"] {
  return category === "data-snapshot" || category === "unknown" ? "warning" : "risk";
}

export const researchRunImportVerifiedReportSignatureBucketOrder: ResearchRunImportVerifiedReportSignatureBucket["status"][] = [
  "verified",
  "invalid"
];

export function researchRunImportVerifiedReportSignatureBucketLabel(
  status: ResearchRunImportVerifiedReportSignatureBucket["status"]
): string {
  return (
    {
      verified: "Local core verified",
      invalid: "Local core invalid"
    } satisfies Record<ResearchRunImportVerifiedReportSignatureBucket["status"], string>
  )[status];
}

export function researchRunImportVerifiedReportSignatureBucketTone(
  status: ResearchRunImportVerifiedReportSignatureBucket["status"]
): ResearchRunImportVerifiedReportSignatureBucket["tone"] {
  return status === "verified" ? "positive" : "risk";
}

export function isResearchRunImportAuditEventNeedsReview(event: ResearchRunImportAuditEvent): boolean {
  return event.stage === "blocked" || event.stage === "failed" || event.stage === "undo-failed";
}

export function isResearchRunImportAuditEventUndoable(event: ResearchRunImportAuditEvent): boolean {
  return event.stage === "confirmed" && Boolean(event.undoToken?.trim());
}

export function isResearchRunImportAuditEventRecoverable(event: ResearchRunImportAuditEvent): boolean {
  return isResearchRunImportAuditEventNeedsReview(event) || isResearchRunImportAuditEventUndoable(event);
}

export function researchRunImportAuditEventMatchesFilter(
  event: ResearchRunImportAuditEvent,
  filter: ResearchRunImportAuditFilter
): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "needs-review") {
    return isResearchRunImportAuditEventNeedsReview(event);
  }
  if (filter === "undoable") {
    return isResearchRunImportAuditEventUndoable(event);
  }
  if (filter === "recoverable") {
    return isResearchRunImportAuditEventRecoverable(event);
  }
  return event.stage === filter;
}

export function researchRunImportAuditSummary(stage: ResearchRunImportAuditEventStage): string {
  if (stage === "blocked") {
    return "Import preview blocked";
  }
  if (stage === "confirmed") {
    return "Import applied";
  }
  if (stage === "failed") {
    return "Import failed";
  }
  if (stage === "cancelled") {
    return "Import cancelled";
  }
  if (stage === "undone") {
    return "Import undone";
  }
  if (stage === "undo-failed") {
    return "Import undo failed";
  }
  return "Import preview ready";
}

export function researchRunImportAuditDetail({
  blockedCount,
  changeCount,
  error,
  stage
}: {
  blockedCount: number;
  changeCount: number;
  error?: string | null;
  fileName: string;
  stage: ResearchRunImportAuditEventStage;
}): string {
  const counts = `${blockedCount} blocked · ${changeCount} change${changeCount === 1 ? "" : "s"}`;
  if (stage === "failed") {
    return error || "Import failed before the package could be applied.";
  }
  if (stage === "cancelled") {
    return `Import preview was discarded before writing to the local audit store. ${counts}.`;
  }
  if (stage === "undone") {
    return "Research run import undo restored the previous audited stores.";
  }
  if (stage === "undo-failed") {
    return error || "Research run import undo failed before the previous audited stores could be restored.";
  }
  if (stage === "confirmed") {
    return `Research run import wrote to the local audit store. ${counts}.`;
  }
  if (stage === "blocked") {
    return `Import preview found blocked preflight gates. ${counts}.`;
  }
  return `Import preview passed preflight. ${counts}.`;
}

export function researchRunImportAuditTone(stage: ResearchRunImportAuditEventStage): ResearchRunImportAuditEvent["tone"] {
  if (stage === "confirmed") {
    return "positive";
  }
  if (stage === "failed" || stage === "blocked" || stage === "undo-failed") {
    return "risk";
  }
  if (stage === "cancelled" || stage === "undone") {
    return "warning";
  }
  return "ai";
}

export function researchRunImportFailure(error?: string | null): {
  category: ResearchRunImportFailureCategory;
  detail: string | null;
} {
  const message = error?.trim() || "";
  const normalized = message.toLowerCase();
  if (!message) {
    return {
      category: "unknown",
      detail: null
    };
  }
  if (normalized.includes("invalid research run export contract")) {
    return {
      category: "schema",
      detail: `Schema contract invalid: ${message}`
    };
  }
  if (normalized.includes("integrity") || normalized.includes("hash")) {
    return {
      category: "integrity",
      detail: `Integrity check failed: ${message}`
    };
  }
  if (normalized.includes("artifact") || normalized.includes("count") || normalized.includes("manifest")) {
    return {
      category: "artifact-counts",
      detail: `Artifact manifest mismatch: ${message}`
    };
  }
  if (
    normalized.includes("http") ||
    normalized.includes("invalid_research_run_export") ||
    normalized.includes("research_run_import_undo") ||
    normalized.includes("run_mismatch") ||
    normalized.includes("expected_run")
  ) {
    return {
      category: "core",
      detail: `Core import rejected the package: ${message}`
    };
  }
  return {
    category: "unknown",
    detail: message
  };
}

export function researchRunImportRecoveryHint(
  stage: ResearchRunImportAuditEventStage,
  rollbackTargetRunId: string | null,
  failure: { category: ResearchRunImportFailureCategory; detail: string | null },
  undoToken: string | null = null
): string {
  if (stage === "undone") {
    return `Import undo has already consumed ${undoToken || "the undo token"}.`;
  }
  if (stage === "confirmed") {
    if (undoToken) {
      return `Undo import ${undoToken} to restore the audited stores.`;
    }
    return rollbackTargetRunId
      ? `Replay previous audited run ${rollbackTargetRunId} to roll back the workspace context.`
      : "No previous audited run was bound before import; replay a run from history to change context.";
  }
  if (stage === "undo-failed") {
    return "Review the undo rejection detail, replay the previous audited run if needed, then retry with the matching import event.";
  }
  if (stage === "failed") {
    if (failure.category === "schema") {
      return "Choose a valid aiqt.researchRun.export package or a wrapped { export } payload.";
    }
    if (failure.category === "integrity") {
      return "Re-export the run or choose a package whose canonical SHA-256 integrity matches its payload.";
    }
    if (failure.category === "artifact-counts") {
      return "Re-export the run and ensure manifest artifact counts match the included payload arrays.";
    }
    if (failure.category === "core") {
      return "Review the Python core rejection detail, fix the package, and run import preflight again.";
    }
    return "Inspect the import error, then retry with a verified research run export package.";
  }
  if (stage === "blocked") {
    return "Import not applied; fix blocked preflight rows before confirming.";
  }
  if (stage === "cancelled") {
    return "Import not applied; no rollback is required.";
  }
  return "Import not applied yet; confirm only after reviewing diff rows.";
}

export function auditTimelineExportPath(item: AiReviewAuditTimelineItem): string {
  if (item.kind === "current-evidence") {
    return "researchRun.runId";
  }
  if (item.kind === "citation-bundle-evidence") {
    return "aiReviewRuns[].record.citations";
  }
  if (item.kind === "strategy-revision-evidence") {
    return "researchRun.strategyConfig.revision";
  }
  if (item.kind === "committee-rounds-evidence") {
    return "aiReviewRuns[].record.rounds";
  }
  if (item.kind === "decision-log-evidence") {
    return "aiReviewRuns[].record.decisionLog";
  }
  if (item.kind === "ai-boundary-evidence") {
    return "aiReviewRuns[].record.boundary";
  }
  if (item.kind === "data-snapshot-evidence") {
    return "researchRun.dataSnapshot.hash";
  }
  if (item.kind === "data-preparation-evidence") {
    return "researchRun.dataSnapshot.preparationEvidence";
  }
  if (item.kind === "paper-execution-preparation-evidence") {
    return "paperExecutions[].preparationEvidence";
  }
  if (item.kind === "market-calendar-evidence") {
    return "researchRun.dataSnapshot.marketCalendar";
  }
  if (item.kind === "saved-review") {
    return "aiReviewRuns[].record";
  }
  return "executionHandoff.requiredGates";
}

export function timestampSortValue(timestamp: string): number {
  const value = Date.parse(timestamp);
  return Number.isFinite(value) ? value : 0;
}

export function normalizedResearchNote(note: ResearchRunNote | null | undefined): ResearchRunNote | null {
  if (!note || !note.body.trim()) {
    return null;
  }
  return {
    ...note,
    body: note.body.trim()
  };
}

export function compactResearchNoteDetail(body: string): string {
  const trimmed = body.trim();
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
}

export function researchNoteReadinessDetail(
  noteValue: "draft not saved" | "not saved" | "saved" | "unsaved changes",
  noteBody: string,
  updatedAt: string | null | undefined,
  error?: string | null
): string {
  if (!noteBody) {
    return error?.trim() || "Save a note to bind the research hypothesis to this symbol and timeframe.";
  }
  const compactBody = compactResearchNoteDetail(noteBody);
  if (noteValue === "saved" && updatedAt) {
    return `Saved ${updatedAt} · ${compactBody}`;
  }
  if (noteValue === "unsaved changes" && updatedAt) {
    return `Unsaved changes since ${updatedAt} · ${compactBody}`;
  }
  if (noteValue === "draft not saved") {
    return `Draft not saved · ${compactBody}`;
  }
  return compactBody;
}

export function buildResearchContextReadinessRows(
  input: ResearchContextReadinessInput
): ResearchContextReadinessRow[] {
  const instrument = input.workspace.selectedInstrument;
  const timeframe = input.workspace.selectedTimeframe;
  const symbolReady = Boolean(instrument.symbol.trim());
  const warnings = input.dataQuality.warnings.filter((warning) => warning.trim());
  const barCount = Math.max(0, Math.floor(input.barCount || input.dataQuality.rows || 0));
  const klineSource = input.dataQuality.source || "unknown";
  const klineSourceNeedsReview = isReviewRequiredKlineSource(klineSource);
  const klineStatus: ResearchContextReadinessStatus =
    barCount <= 0 ? "blocked" : input.dataQuality.isComplete && warnings.length === 0 && !klineSourceNeedsReview ? "ready" : "review";
  const klineDetail = `${klineSource} ${input.dataQuality.isComplete ? "complete" : "review"} · ${
    warnings[0] ?? (klineSourceNeedsReview ? "source requires review" : formatWarningCount(0))
  }`;
  const cache = input.cacheContext ?? null;
  const cacheRows = cache ? Math.max(0, Math.floor(cache.rowCount || 0)) : 0;
  const cacheStatus: ResearchContextReadinessStatus =
    !cache || cacheRows <= 0 || cache.freshness === "empty"
      ? "blocked"
      : cache.freshness === "fresh"
        ? "ready"
        : "review";
  const noteBody = input.note?.body.trim() ?? "";
  const noteHasExplicitSavedBody = input.note ? Object.prototype.hasOwnProperty.call(input.note, "savedBody") : false;
  const savedNoteBody = noteHasExplicitSavedBody
    ? input.note?.savedBody?.trim() ?? ""
    : input.note?.updatedAt
      ? noteBody
      : "";
  const hasSavedNote = Boolean(savedNoteBody);
  const noteValue = noteBody
    ? hasSavedNote
      ? noteBody === savedNoteBody
        ? "saved"
        : "unsaved changes"
      : "draft not saved"
    : "not saved";
  const noteStatus: ResearchContextReadinessStatus = noteValue === "saved" ? "ready" : "review";

  const rows: ResearchContextReadinessRow[] = [
    {
      id: "instrument",
      label: "Selected symbol",
      value: `${instrument.symbol || "N/A"} · ${timeframe}`,
      detail: `${instrument.name || instrument.symbol || "Unknown"} · ${instrument.market} · ${input.workspace.watchlist.length} watched`,
      status: symbolReady ? "ready" : "blocked",
      tone: symbolReady ? "positive" : "risk"
    }
  ];

  if (input.marketCalendar) {
    rows.push(buildMarketCalendarReadinessRow(input.marketCalendar));
  }

  if (input.watchlist) {
    rows.push(buildWatchlistReadinessRow(input.workspace, input.watchlist.hasUnsavedChanges));
  }

  rows.push(
    {
      id: "klines",
      label: "K-line data",
      value: `${barCount} bars`,
      detail: klineDetail,
      status: klineStatus,
      tone: readinessTone(klineStatus),
      action: klineStatus === "ready" ? undefined : "refresh-cache"
    },
    {
      id: "cache",
      label: "Local cache",
      value: cache ? `${cache.freshness} · ${cacheRows} rows` : "missing",
      detail: cacheReadinessDetail(cache, cacheRows),
      status: cacheStatus,
      tone: readinessTone(cacheStatus),
      action: cacheStatus === "ready" ? undefined : "refresh-cache"
    }
  );

  if (input.watchlistRefreshRuns) {
    rows.push(buildRefreshEvidenceReadinessRow(input.workspace, input.watchlistRefreshRuns));
  }

  rows.push(
    {
      id: "note",
      label: "Research note",
      value: noteValue,
      detail: researchNoteReadinessDetail(noteValue, noteBody, input.note?.updatedAt, input.note?.error),
      status: noteStatus,
      tone: readinessTone(noteStatus),
      action: noteStatus === "ready" ? undefined : "save-note"
    },
    buildResearchWorkspaceReadinessRow(input.workspace, input.activeWorkAreaId ?? "research")
  );

  return rows;
}

export function buildMarketCalendarReadinessRow(calendar: ResearchContextMarketCalendar): ResearchContextReadinessRow {
  const warnings = calendar.warnings.filter((warning) => warning.trim());
  const hasOnlyStaticCalendarCoverageWarnings = warnings.every(
    (warning) => warning === "Static session template only; exchange holiday calendar is not configured."
  );
  const isReady =
    (calendar.status === "open" || calendar.status === "always_open") && hasOnlyStaticCalendarCoverageWarnings;
  return {
    id: "calendar",
    label: "Market calendar",
    value: `${calendar.status} · ${calendar.session}`,
    detail: `${calendar.timezone} · ${marketCalendarNextEventDetail(calendar)} · ${warnings[0] ?? calendar.source}`,
    status: isReady ? "ready" : "review",
    tone: isReady ? "positive" : "warning"
  };
}

export function marketCalendarNextEventDetail(calendar: ResearchContextMarketCalendar): string {
  if ((calendar.status === "break" || calendar.status === "closed") && calendar.nextOpen) {
    return `next open ${calendar.nextOpen}`;
  }
  if (calendar.nextClose) {
    return `next close ${calendar.nextClose}`;
  }
  if (calendar.nextOpen) {
    return `next open ${calendar.nextOpen}`;
  }
  if (calendar.status === "always_open") {
    return "continuous trading";
  }
  return "no scheduled event";
}
