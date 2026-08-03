import { LOCAL_REVIEW_COVERAGE_NEXT_ACTION_TARGET_WORKSPACE_ID, buildAuditEvidenceReportLedgerRowCurrentGapActionReadiness } from "./deep-link-queries";
import type { MarketDataRefreshOverrideAuditLedgerRow, MarketDataRefreshOverrideAuditLedgerSummary } from "./execution-contracts";
import type { AuditEvidenceReportLedgerEventRecord, AuditEvidenceReportLedgerLocalReviewBundleCoverageState, AuditEvidenceReportLedgerRow } from "./report-contracts";
import { auditReportLedgerLatestAuditAidBaseQuery, buildAuditEvidenceReportLedgerRowResearchContextReportQuery } from "./report-queries";
import { auditReportLedgerMetadataBoolean, auditReportLedgerMetadataNumber, auditReportLedgerMetadataStringList, auditReportLedgerMetadataText } from "./signing-key-ledger";
import type { Market, P2ReadinessEvidenceCoverage, ProductWorkAreaId, Timeframe } from "../stage1/foundation-contracts";

export function auditReportLedgerLocalReviewBundleCoverage({
  dailyOpsCount,
  dailyStartCount,
  personalTeamCount,
  stage1ArchiveCount
}: {
  dailyOpsCount: number;
  dailyStartCount: number;
  personalTeamCount: number;
  stage1ArchiveCount: number;
}): {
  label: string;
  nextActionLabel: string;
  nextActionQuery: string;
  nextActionTargetWorkspaceId: ProductWorkAreaId | null;
  nextActionTitle: string;
  query: string;
  state: AuditEvidenceReportLedgerLocalReviewBundleCoverageState;
  title: string;
} {
  const totalCount = dailyOpsCount + dailyStartCount + personalTeamCount + stage1ArchiveCount;
  const countLabel = `personal/team ${personalTeamCount} · daily ops ${dailyOpsCount} · daily start ${dailyStartCount} · stage1 archive ${stage1ArchiveCount}`;
  if (totalCount <= 0) {
    const nextActionLabel = "record personal/team review";
    return {
      label: `local review bundle empty · ${countLabel}`,
      nextActionLabel,
      nextActionQuery: auditReportLedgerDeduplicatedQueryText([
        "local-review-bundle-next-action",
        "record-personal-team-review",
        "local-review-bundle-empty",
        "local-review-bundle-personal-missing"
      ]),
      nextActionTargetWorkspaceId: LOCAL_REVIEW_COVERAGE_NEXT_ACTION_TARGET_WORKSPACE_ID,
      nextActionTitle: `local-review-bundle-next-action · ${nextActionLabel} · no local reviews recorded · ${countLabel}`,
      query: auditReportLedgerDeduplicatedQueryText([
        "local-review-bundle-empty",
        "local-review-bundle-personal-missing"
      ]),
      state: "empty",
      title: `local-review-bundle-empty · no local reviews recorded · ${countLabel}`
    };
  }

  if (personalTeamCount > 0 && dailyOpsCount > 0 && dailyStartCount > 0 && stage1ArchiveCount > 0) {
    return {
      label: `local review bundle complete · ${countLabel}`,
      nextActionLabel: "",
      nextActionQuery: "",
      nextActionTargetWorkspaceId: null,
      nextActionTitle: "",
      query: "local-review-bundle-complete",
      state: "complete",
      title: `local-review-bundle-complete · local review coverage complete · ${countLabel}`
    };
  }

  const missingReviews = [
    personalTeamCount <= 0
      ? {
          label: "personal/team review",
          nextActionLabel: "record personal/team review",
          nextActionQueryToken: "record-personal-team-review",
          queryToken: "local-review-bundle-personal-missing"
        }
      : null,
    dailyOpsCount <= 0
      ? {
          label: "daily ops review",
          nextActionLabel: "record daily ops review",
          nextActionQueryToken: "record-daily-ops-review",
          queryToken: "local-review-bundle-daily-ops-missing"
        }
      : null,
    dailyStartCount <= 0
      ? {
          label: "daily start review",
          nextActionLabel: "record daily start review",
          nextActionQueryToken: "record-daily-start-review",
          queryToken: "local-review-bundle-daily-start-missing"
        }
      : null,
    stage1ArchiveCount <= 0
      ? {
          label: "stage1 archive review",
          nextActionLabel: "record Stage 1 archive review",
          nextActionQueryToken: "record-stage1-archive-review",
          queryToken: "local-review-bundle-stage1-archive-missing"
        }
      : null
  ].filter((review): review is {
    label: string;
    nextActionLabel: string;
    nextActionQueryToken: string;
    queryToken: string;
  } => Boolean(review));
  const firstMissingReview = missingReviews[0];
  const missingReviewLabel = missingReviews.map((review) => review.label).join(", ");
  return {
    label: `local review bundle gap · ${countLabel}`,
    nextActionLabel: firstMissingReview.nextActionLabel,
    nextActionQuery: auditReportLedgerDeduplicatedQueryText([
      "local-review-bundle-next-action",
      firstMissingReview.nextActionQueryToken,
      firstMissingReview.queryToken
    ]),
    nextActionTargetWorkspaceId: LOCAL_REVIEW_COVERAGE_NEXT_ACTION_TARGET_WORKSPACE_ID,
    nextActionTitle: `local-review-bundle-next-action · ${firstMissingReview.nextActionLabel} · missing ${firstMissingReview.label} · ${countLabel}`,
    query: auditReportLedgerDeduplicatedQueryText([
      "local-review-bundle-gap",
      ...missingReviews.map((review) => review.queryToken)
    ]),
    state: "partial",
    title: `local-review-bundle-gap · missing ${missingReviewLabel} · ${countLabel}`
  };
}

export function auditReportLedgerDeduplicatedQueryText(values: unknown[]): string {
  const seen = new Set<string>();
  return values
    .flatMap((value) => {
      const text = auditReportSearchValueText(value).trim();
      return text ? text.split(/\s+/u) : [];
    })
    .filter((token) => {
      const normalizedToken = token.toLowerCase();
      if (!normalizedToken || seen.has(normalizedToken)) {
        return false;
      }
      seen.add(normalizedToken);
      return true;
    })
    .join(" ");
}

export function findLatestP2ManifestChainPreflightAuditLedgerRow(
  rows: AuditEvidenceReportLedgerRow[],
  context: P2ManifestChainPreflightAuditContext = {},
  reportKind: "p2_manifest_chain_preflight" | "p2_manifest_chain_preflight_review" = "p2_manifest_chain_preflight"
): AuditEvidenceReportLedgerRow | null {
  const contextTokenGroups = p2ManifestChainPreflightAuditContextTokenGroups(context);
  return rows
    .filter((row) => {
      const rowStatus = row.status?.trim().toLowerCase() ?? "";
      if (row.reportKind !== reportKind || rowStatus !== "ready") {
        return false;
      }
      if (!contextTokenGroups.length) {
        return true;
      }
      return auditReportSearchTokenGroupsMatch(auditReportLedgerRowSearchTokenSet(row), contextTokenGroups);
    })
    .reduce<AuditEvidenceReportLedgerRow | null>((latest, row) => {
      if (!latest) {
        return row;
      }
      const latestTime = Date.parse(latest.createdAt) || 0;
      const rowTime = Date.parse(row.createdAt) || 0;
      return rowTime > latestTime ? row : latest;
    }, null);
}

export function findLatestP2ReadinessAcceptanceAuditLedgerRow(
  rows: AuditEvidenceReportLedgerRow[],
  reportKind: "p2_readiness_acceptance_generated" | "p2_readiness_acceptance_review",
  context: {
    evidenceCoverageReviewAuditEventId?: string | null;
    market?: string | null;
    runId?: string | null;
    symbol?: string | null;
    timeframe?: string | null;
  } = {}
): AuditEvidenceReportLedgerRow | null {
  const terms = [context.market, context.symbol, context.timeframe]
    .map((term) => term?.trim().toLowerCase() ?? "")
    .filter(Boolean);
  const runId = context.runId?.trim().toLowerCase() ?? "";
  const evidenceCoverageReviewAuditEventId = context.evidenceCoverageReviewAuditEventId?.trim().toLowerCase() ?? "";
  return rows
    .filter((row) => {
      const rowStatus = row.status?.trim().toLowerCase() ?? "";
      if (row.reportKind !== reportKind || rowStatus !== "ready") {
        return false;
      }
      const tokens = auditReportLedgerRowSearchTokenSet(row);
      const rowRunId = row.runId?.trim().toLowerCase() ?? "";
      if (runId && rowRunId !== runId && !tokens.has(runId)) {
        return false;
      }
      if (
        reportKind === "p2_readiness_acceptance_review" &&
        evidenceCoverageReviewAuditEventId &&
        !tokens.has(evidenceCoverageReviewAuditEventId)
      ) {
        return false;
      }
      return terms.every((term) => tokens.has(term));
    })
    .reduce<AuditEvidenceReportLedgerRow | null>((latest, row) => {
      if (!latest) {
        return row;
      }
      const latestTime = Date.parse(latest.createdAt) || 0;
      const rowTime = Date.parse(row.createdAt) || 0;
      return rowTime > latestTime ? row : latest;
    }, null);
}

export function findLatestP2ReadinessEvidenceCoverageReviewAuditLedgerRow(
  rows: AuditEvidenceReportLedgerRow[],
  coverage: P2ReadinessEvidenceCoverage | null | undefined
): AuditEvidenceReportLedgerRow | null {
  const contextTokenGroups = p2ReadinessEvidenceCoverageReviewContextTokenGroups(coverage);
  return rows
    .filter((row) => {
      const rowStatus = row.status?.trim().toLowerCase() ?? "";
      if (row.reportKind !== "p2_readiness_evidence_coverage_review" || rowStatus !== "ready") {
        return false;
      }
      if (!contextTokenGroups.length) {
        return true;
      }
      return auditReportSearchTokenGroupsMatch(auditReportLedgerRowSearchTokenSet(row), contextTokenGroups);
    })
    .reduce<AuditEvidenceReportLedgerRow | null>((latest, row) => {
      if (!latest) {
        return row;
      }
      const latestTime = Date.parse(latest.createdAt) || 0;
      const rowTime = Date.parse(row.createdAt) || 0;
      return rowTime > latestTime ? row : latest;
    }, null);
}

export function auditReportLedgerRowSearchTokenSet(row: AuditEvidenceReportLedgerRow): Set<string> {
  return auditReportSearchTokenSet([row.id, row.runId, row.fileName, row.focusQuery, row.searchText, row.detail]);
}

export type P2ManifestChainPreflightAuditEventReferenceSource = "none" | "response" | "ledger";

export interface P2ManifestChainPreflightAuditEventReference {
  eventId: string;
  ledgerRow: AuditEvidenceReportLedgerRow | null;
  source: P2ManifestChainPreflightAuditEventReferenceSource;
}

export type P2ManifestChainPreflightAuditContext = {
  blockerIds?: unknown[] | null;
  nextAction?: unknown;
  sourcePath?: unknown;
  status?: unknown;
  totalStageCount?: unknown;
  validStageCount?: unknown;
};

export type P2ManifestChainPreflightAuditEventLike = {
  detail?: unknown;
  eventId?: unknown;
  metadata?: Record<string, unknown> | null;
  runId?: unknown;
  summary?: unknown;
};

export function resolveP2ManifestChainPreflightAuditEventReference({
  context = {},
  event,
  ledgerRow
}: {
  context?: P2ManifestChainPreflightAuditContext;
  event?: P2ManifestChainPreflightAuditEventLike | null;
  ledgerRow?: AuditEvidenceReportLedgerRow | null;
}): P2ManifestChainPreflightAuditEventReference {
  const responseEventId = auditReportSearchValueText(event?.eventId).trim();
  if (responseEventId && event && p2ManifestChainPreflightAuditEventMatchesContext(event, context)) {
    return {
      eventId: responseEventId,
      ledgerRow: null,
      source: "response"
    };
  }
  if (ledgerRow?.id) {
    return {
      eventId: ledgerRow.id,
      ledgerRow,
      source: "ledger"
    };
  }
  return {
    eventId: "",
    ledgerRow: null,
    source: "none"
  };
}

export function p2ManifestChainPreflightAuditEventMatchesContext(
  event: P2ManifestChainPreflightAuditEventLike,
  context: P2ManifestChainPreflightAuditContext
): boolean {
  const contextTokenGroups = p2ManifestChainPreflightAuditContextTokenGroups(context);
  if (!contextTokenGroups.length) {
    return true;
  }
  return auditReportSearchTokenGroupsMatch(auditReportEventSearchTokenSet(event), contextTokenGroups);
}

export function p2ManifestChainPreflightAuditContextTokenGroups(
  context: P2ManifestChainPreflightAuditContext
): string[][] {
  const stageCount =
    auditReportSearchValueText(context.validStageCount).trim() && auditReportSearchValueText(context.totalStageCount).trim()
      ? `${auditReportSearchValueText(context.validStageCount).trim()}/${auditReportSearchValueText(context.totalStageCount).trim()}`
      : "";
  return auditReportSearchTokenGroups([
    context.status,
    stageCount,
    context.nextAction,
    context.sourcePath,
    ...(Array.isArray(context.blockerIds) ? context.blockerIds : [])
  ]);
}

export type P2ReadinessEvidenceCoverageReviewAuditEventReferenceSource = "none" | "response" | "ledger";

export interface P2ReadinessEvidenceCoverageReviewAuditEventReference {
  eventId: string;
  ledgerRow: AuditEvidenceReportLedgerRow | null;
  source: P2ReadinessEvidenceCoverageReviewAuditEventReferenceSource;
}

export type P2ReadinessEvidenceCoverageReviewAuditEventLike = {
  detail?: unknown;
  eventId?: unknown;
  metadata?: Record<string, unknown> | null;
  runId?: unknown;
  summary?: unknown;
};

export function resolveP2ReadinessEvidenceCoverageReviewAuditEventReference({
  coverage,
  event,
  ledgerRow
}: {
  coverage?: P2ReadinessEvidenceCoverage | null;
  event?: P2ReadinessEvidenceCoverageReviewAuditEventLike | null;
  ledgerRow?: AuditEvidenceReportLedgerRow | null;
}): P2ReadinessEvidenceCoverageReviewAuditEventReference {
  const responseEventId = auditReportSearchValueText(event?.eventId).trim();
  if (responseEventId && event && p2ReadinessEvidenceCoverageReviewAuditEventMatchesContext(event, coverage)) {
    return {
      eventId: responseEventId,
      ledgerRow: null,
      source: "response"
    };
  }
  if (ledgerRow?.id) {
    return {
      eventId: ledgerRow.id,
      ledgerRow,
      source: "ledger"
    };
  }
  return {
    eventId: "",
    ledgerRow: null,
    source: "none"
  };
}

export function p2ReadinessEvidenceCoverageReviewAuditEventMatchesContext(
  event: P2ReadinessEvidenceCoverageReviewAuditEventLike,
  coverage: P2ReadinessEvidenceCoverage | null | undefined
): boolean {
  const contextTokenGroups = p2ReadinessEvidenceCoverageReviewContextTokenGroups(coverage);
  if (!contextTokenGroups.length) {
    return true;
  }
  return auditReportSearchTokenGroupsMatch(auditReportEventSearchTokenSet(event), contextTokenGroups);
}

export function p2ReadinessEvidenceCoverageReviewContextTokenGroups(
  coverage: P2ReadinessEvidenceCoverage | null | undefined
): string[][] {
  if (!coverage) {
    return [];
  }
  return auditReportSearchTokenGroups([
    coverage.status,
    `${coverage.coveredCount}/${coverage.totalCount}`,
    ...coverage.rows.map((row) => row.id),
    ...coverage.rows.map((row) => row.status),
    ...coverage.rows.map((row) => row.sourceType),
    ...coverage.rows.map((row) => row.sourceId ?? "")
  ]);
}

export type P2ReadinessAcceptanceAuditEventReferenceSource = "none" | "response" | "ledger";

export interface P2ReadinessAcceptanceAuditEventReference {
  eventId: string;
  ledgerRow: AuditEvidenceReportLedgerRow | null;
  source: P2ReadinessAcceptanceAuditEventReferenceSource;
}

export type P2ReadinessAcceptanceAuditContext = {
  evidenceCoverageReviewAuditEventId?: string | null;
  market?: string | null;
  runId?: string | null;
  symbol?: string | null;
  timeframe?: string | null;
};

export type P2ReadinessAcceptanceAuditEventLike = {
  detail?: unknown;
  eventId?: unknown;
  metadata?: Record<string, unknown> | null;
  runId?: unknown;
  summary?: unknown;
};

export function resolveP2ReadinessAcceptanceAuditEventReference({
  context = {},
  event,
  ledgerRow
}: {
  context?: P2ReadinessAcceptanceAuditContext;
  event?: P2ReadinessAcceptanceAuditEventLike | null;
  ledgerRow?: AuditEvidenceReportLedgerRow | null;
}): P2ReadinessAcceptanceAuditEventReference {
  const responseEventId = auditReportSearchValueText(event?.eventId).trim();
  if (responseEventId && event && p2ReadinessAcceptanceAuditEventMatchesContext(event, context)) {
    return {
      eventId: responseEventId,
      ledgerRow: null,
      source: "response"
    };
  }
  if (ledgerRow?.id) {
    return {
      eventId: ledgerRow.id,
      ledgerRow,
      source: "ledger"
    };
  }
  return {
    eventId: "",
    ledgerRow: null,
    source: "none"
  };
}

export function p2ReadinessAcceptanceAuditEventMatchesContext(
  event: P2ReadinessAcceptanceAuditEventLike,
  context: P2ReadinessAcceptanceAuditContext
): boolean {
  const terms = [context.market, context.symbol, context.timeframe]
    .map((term) => term?.trim().toLowerCase() ?? "")
    .filter(Boolean);
  const runId = context.runId?.trim().toLowerCase() ?? "";
  const evidenceCoverageReviewAuditEventId = context.evidenceCoverageReviewAuditEventId?.trim().toLowerCase() ?? "";
  if (!runId && terms.length === 0 && !evidenceCoverageReviewAuditEventId) {
    return true;
  }
  const tokens = auditReportEventSearchTokenSet(event);
  const eventRunId = auditReportSearchValueText(event.runId).trim().toLowerCase();
  const metadataRunId =
    event.metadata && Object.prototype.hasOwnProperty.call(event.metadata, "runId")
      ? auditReportSearchValueText(event.metadata.runId).trim().toLowerCase()
      : "";
  if (runId && eventRunId !== runId && metadataRunId !== runId && !tokens.has(runId)) {
    return false;
  }
  if (evidenceCoverageReviewAuditEventId && !tokens.has(evidenceCoverageReviewAuditEventId)) {
    return false;
  }
  return terms.every((term) => tokens.has(term));
}

export function auditReportEventSearchTokenSet(event: P2ReadinessAcceptanceAuditEventLike): Set<string> {
  return auditReportSearchTokenSet([
    event.eventId ?? "",
    event.runId ?? "",
    event.summary ?? "",
    event.detail ?? "",
    ...auditReportEventMetadataSearchValues(event.metadata)
  ]);
}

export function auditReportSearchTokenSet(values: unknown[]): Set<string> {
  return new Set(
    values.flatMap((value) =>
      value === null || value === undefined ? [] : auditReportSearchTokens(auditReportSearchValueText(value))
    )
  );
}

export function auditReportSearchTokenGroups(values: unknown[]): string[][] {
  return values
    .map((value) => (value === null || value === undefined ? [] : auditReportSearchTokens(auditReportSearchValueText(value))))
    .filter((tokens) => tokens.length > 0);
}

export function auditReportSearchTokenGroupsMatch(tokens: Set<string>, groups: string[][]): boolean {
  return groups.every((group) => group.every((token) => tokens.has(token)));
}

export function auditReportSearchValueText(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

export function auditReportSearchTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9._-]+/iu)
    .filter(Boolean);
}

export function auditReportEventMetadataSearchValues(value: unknown): string[] {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => auditReportEventMetadataSearchValues(item));
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((item) => auditReportEventMetadataSearchValues(item));
  }
  return [];
}

export function auditReportLedgerLatestResearchContextReportQuery(row: AuditEvidenceReportLedgerRow | undefined): string {
  return buildAuditEvidenceReportLedgerRowResearchContextReportQuery(row);
}

export type ResearchContextReportCoverageStatus = "matched" | "context-mismatch" | "missing";

export interface ResearchContextReportCoverage {
  latestMatchingReport: AuditEvidenceReportLedgerRow | null;
  latestOtherReport: AuditEvidenceReportLedgerRow | null;
  readyReportCount: number;
  status: ResearchContextReportCoverageStatus;
}

export function auditReportLedgerLatestAuditAidBacklogReadinessQuery(row: AuditEvidenceReportLedgerRow | undefined): string {
  const baseQuery = auditReportLedgerLatestAuditAidBaseQuery(row);
  if (!row || !baseQuery) {
    return "";
  }
  return [
    baseQuery,
    "backlog",
    row.p0BacklogReadinessRecorded ? "backlog-recorded" : "backlog-not-recorded",
    `backlog total ${row.p0BacklogTotalCount}`,
    `executable ${row.p0BacklogExecutableCount}`,
    `not-executable ${row.p0BacklogNotExecutableCount}`,
    row.p0FirstBacklogCanExecute ? "first-backlog-executable" : "first-backlog-not-executable",
    row.p0FirstBacklogExecutableActionId,
    row.p0FirstBacklogReadinessReason,
    row.p0BacklogReadinessSummary.trim() ? "backlog-summary-recorded" : "backlog-summary-missing",
    row.p0BacklogReadinessSummary
  ]
    .filter(Boolean)
    .join(" ");
}

export function auditReportLedgerLatestAuditAidCompletionQuery(row: AuditEvidenceReportLedgerRow | undefined): string {
  const baseQuery = auditReportLedgerLatestAuditAidBaseQuery(row);
  if (!row || !baseQuery) {
    return "";
  }
  return [
    baseQuery,
    "p0-completion-focus",
    "completion",
    row.p0CompletionReadinessRecorded ? "completion-recorded" : "completion-not-recorded",
    `completion ${row.p0CompletionPassedCount}/${row.p0CompletionTotalCount}`,
    `completion-progress ${row.p0CompletionProgressPct}`,
    `completion-review ${row.p0CompletionReviewCount}`,
    `completion-blocked ${row.p0CompletionBlockedCount}`,
    row.p0CompletionCurrentCriterionId,
    row.p0CompletionCurrentCriterionLabel,
    row.p0CompletionCurrentCriterionStatus,
    row.p0CompletionCurrentCriterionActionLabel,
    row.p0CompletionCurrentCriterionTargetWorkspaceId ?? "",
    row.p0CompletionOpenCriterionIds,
    row.p0CompletionSummary.trim() ? "completion-summary-recorded" : "completion-summary-missing",
    row.p0CompletionSummary
  ]
    .filter(Boolean)
    .join(" ");
}

export function auditReportLedgerLatestAuditAidCurrentGapReadinessQuery(
  row: AuditEvidenceReportLedgerRow | undefined
): string {
  const baseQuery = auditReportLedgerLatestAuditAidBaseQuery(row);
  if (!row || !baseQuery) {
    return "";
  }
  const readiness = buildAuditEvidenceReportLedgerRowCurrentGapActionReadiness(row);
  return [
    baseQuery,
    "current-gap",
    readiness.canExecute ? "current-gap-executable" : "current-gap-not-executable",
    readiness.executableActionId,
    readiness.reason,
    readiness.targetWorkspaceId ?? readiness.workspaceId ?? ""
  ]
    .filter(Boolean)
    .join(" ");
}

export function auditReportLedgerPreparationEvidenceLabel(runId: string): string {
  return runId ? `prep ${runId}` : "";
}

export function buildAuditEvidenceReportLedgerRowP0ProgressLabel(
  row: AuditEvidenceReportLedgerRow | null | undefined
): string {
  if (!row || row.reportKind !== "p0_readiness_report") {
    return "";
  }
  const progress = row.packageTotal > 0 ? `${row.packageMatched}/${row.packageTotal}` : "";
  const focusSuffix = row.runId ? ` ${row.runId}` : "";
  const focusText = row.focusQuery.endsWith(focusSuffix)
    ? row.focusQuery.slice(0, -focusSuffix.length).trim()
    : row.focusQuery.trim();
  const focus = focusText.replace(/^(\S+)\s+(\d+%)\s+(.+)$/u, "$1 $2 · $3");
  return [progress ? `P0 progress ${progress}` : "P0 progress", focus].filter(Boolean).join(" · ");
}

export function buildMarketDataRefreshOverrideAuditLedgerRows(
  events: AuditEvidenceReportLedgerEventRecord[]
): MarketDataRefreshOverrideAuditLedgerRow[] {
  return events
    .filter((event) => event.eventType === "market_data_refresh_override")
    .map((event) => {
      const market = auditReportLedgerMetadataText(event.metadata, "market") as Market;
      const timeframe = auditReportLedgerMetadataText(event.metadata, "timeframe") as Timeframe;
      const affectedContexts = auditReportLedgerMetadataStringList(event.metadata, "affectedContexts");
      const affectedSymbols = auditReportLedgerMetadataStringList(event.metadata, "affectedSymbols");
      const liveTradingAllowed = auditReportLedgerMetadataBoolean(event.metadata, "liveTradingAllowed");
      const overrideApplied = auditReportLedgerMetadataBoolean(event.metadata, "overrideApplied");
      const providerHealthStatus = auditReportLedgerMetadataText(event.metadata, "providerHealthStatus");
      const providerHealthReason = auditReportLedgerMetadataText(event.metadata, "providerHealthReason");
      const boundary = auditReportLedgerMetadataText(event.metadata, "boundary");
      const statusLabel = overrideApplied ? "Override recorded" : "Override blocked";
      const liveBoundaryLabel = liveTradingAllowed ? "live allowed" : "live blocked";
      const tone: MarketDataRefreshOverrideAuditLedgerRow["tone"] =
        liveTradingAllowed || !overrideApplied
          ? "risk"
          : providerHealthStatus === "ok"
            ? "positive"
            : "warning";

      return {
        id: event.eventId,
        actionScope: auditReportLedgerMetadataText(event.metadata, "actionScope"),
        affectedContexts,
        affectedContextsLabel: affectedContexts.join(", "),
        affectedSymbols,
        affectedSymbolsLabel: affectedSymbols.join(", "),
        boundary,
        createdAt: event.createdAt,
        detail: event.detail,
        liveTradingAllowed,
        market,
        name: auditReportLedgerMetadataText(event.metadata, "name"),
        operator: auditReportLedgerMetadataText(event.metadata, "operator"),
        overrideApplied,
        overrideReason: auditReportLedgerMetadataText(event.metadata, "overrideReason"),
        providerHealthReason,
        providerHealthStatus,
        recentErrorCount: auditReportLedgerMetadataNumber(event.metadata, "recentErrorCount"),
        retryAfterSeconds: auditReportLedgerMetadataNumber(event.metadata, "retryAfterSeconds"),
        searchText: [
          event.eventType,
          event.stage,
          event.source,
          event.summary,
          event.detail,
          market,
          auditReportLedgerMetadataText(event.metadata, "symbol"),
          timeframe,
          auditReportLedgerMetadataText(event.metadata, "name"),
          auditReportLedgerMetadataText(event.metadata, "operator"),
          auditReportLedgerMetadataText(event.metadata, "overrideReason"),
          providerHealthStatus,
          providerHealthReason,
          boundary,
          liveBoundaryLabel,
          affectedContexts.join(" "),
          affectedSymbols.join(" "),
          String(auditReportLedgerMetadataNumber(event.metadata, "retryAfterSeconds")),
          String(auditReportLedgerMetadataNumber(event.metadata, "recentErrorCount"))
        ]
          .filter(Boolean)
          .join(" "),
        source: event.source,
        stage: event.stage,
        statusLabel,
        summary: event.summary,
        symbol: auditReportLedgerMetadataText(event.metadata, "symbol"),
        timeframe,
        tone
      };
    });
}

export function buildMarketDataRefreshOverrideAuditLedgerSummary(
  rows: MarketDataRefreshOverrideAuditLedgerRow[]
): MarketDataRefreshOverrideAuditLedgerSummary {
  const latestRow = rows.reduce<MarketDataRefreshOverrideAuditLedgerRow | undefined>((latest, row) => {
    if (!latest) {
      return row;
    }
    return Date.parse(row.createdAt) > Date.parse(latest.createdAt) ? row : latest;
  }, undefined);

  return {
    blocked: rows.filter((row) => !row.overrideApplied).length,
    latestEventId: latestRow?.id ?? "",
    latestMarket: latestRow?.market ?? "",
    latestReason: latestRow?.overrideReason ?? "",
    latestRetryAfterSeconds: latestRow?.retryAfterSeconds ?? 0,
    latestSymbol: latestRow?.symbol ?? "",
    latestTimeframe: latestRow?.timeframe ?? "",
    liveBlocked: rows.filter((row) => !row.liveTradingAllowed).length,
    recorded: rows.filter((row) => row.overrideApplied).length,
    total: rows.length
  };
}
