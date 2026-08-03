import type { AuditEvidenceReportLedgerSummary } from "./deep-link-queries";
import { latestAuditEvidenceReportLedgerRow } from "./evidence-control-room";
import { auditReportLedgerDeduplicatedQueryText, auditReportLedgerLocalReviewBundleCoverage } from "./local-review-bundle";
import type { AuditEvidenceReportLedgerRow } from "./report-contracts";
import { auditReportLedgerLocalReviewBundleContextTitle, auditReportLedgerLocalReviewBundleLatestLabel, auditReportLedgerLocalReviewBundleLatestQuery, auditReportLedgerLocalReviewBundleLatestReviewTitle, auditReportLedgerLocalReviewBundleLatestTitle, buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageLinkedAcceptanceReviewQuery, buildAuditEvidenceReportLedgerRowP2ReadinessReviewChainQuery } from "./report-queries";

export function auditEvidenceReportLedgerRowIsLocalReviewBundle(row: AuditEvidenceReportLedgerRow): boolean {
  return (
    row.status === "ready" &&
    (row.reportKind === "personal_team_readiness_review" ||
      row.reportKind === "daily_ops_control_room_review" ||
      row.reportKind === "daily_start_brief_review" ||
      row.reportKind === "stage1_daily_archive_review")
  );
}

export function markLocalReviewBundleContextTitleLedgerRows(rows: AuditEvidenceReportLedgerRow[]): AuditEvidenceReportLedgerRow[] {
  return rows.map((row) => {
    if (!auditEvidenceReportLedgerRowIsLocalReviewBundle(row)) {
      return row;
    }
    const contextTitle = auditReportLedgerLocalReviewBundleContextTitle(
      row.reportKind,
      row.id,
      auditReportLedgerLocalReviewBundleLatestReviewTitle(row)
    );
    if (!contextTitle || contextTitle === row.localReviewBundleContextTitle) {
      return row;
    }
    return {
      ...row,
      localReviewBundleContextTitle: contextTitle,
      searchText: [row.searchText, contextTitle].filter(Boolean).join(" ")
    };
  });
}

export function markLocalReviewBundleCoverageLedgerRows(rows: AuditEvidenceReportLedgerRow[]): AuditEvidenceReportLedgerRow[] {
  const localReviewBundleRows = rows.filter(auditEvidenceReportLedgerRowIsLocalReviewBundle);
  const personalTeamCount = localReviewBundleRows.filter((row) => row.reportKind === "personal_team_readiness_review")
    .length;
  const dailyOpsCount = localReviewBundleRows.filter((row) => row.reportKind === "daily_ops_control_room_review")
    .length;
  const dailyStartCount = localReviewBundleRows.filter((row) => row.reportKind === "daily_start_brief_review")
    .length;
  const stage1ArchiveCount = localReviewBundleRows.filter((row) => row.reportKind === "stage1_daily_archive_review")
    .length;
  const coverage = auditReportLedgerLocalReviewBundleCoverage({
    dailyOpsCount,
    dailyStartCount,
    personalTeamCount,
    stage1ArchiveCount
  });

  if (!coverage.query) {
    return rows;
  }

  if (localReviewBundleRows.length === 0) {
    const latestReadyAuditReportRow = latestAuditEvidenceReportLedgerRow(
      rows.filter((row) => row.reportKind === "audit_evidence_report" && row.status === "ready")
    );
    if (!latestReadyAuditReportRow) {
      return rows;
    }
    return rows.map((row) =>
      row.id === latestReadyAuditReportRow.id
        ? {
            ...row,
            searchText: [row.searchText, coverage.query, coverage.title, coverage.nextActionQuery, coverage.nextActionTitle]
              .filter(Boolean)
              .join(" ")
          }
        : row
    );
  }

  return rows.map((row) => {
    if (!auditEvidenceReportLedgerRowIsLocalReviewBundle(row)) {
      return row;
    }
    return {
      ...row,
      localReviewBundleCoverageQuery: coverage.query,
      localReviewBundleCoverageTitle: coverage.title,
      localReviewBundleCoverageNextActionQuery: coverage.nextActionQuery,
      localReviewBundleCoverageNextActionTargetWorkspaceId: coverage.nextActionTargetWorkspaceId,
      localReviewBundleCoverageNextActionTitle: coverage.nextActionTitle,
      searchText: [row.searchText, coverage.query, coverage.nextActionQuery, coverage.nextActionTitle]
        .filter(Boolean)
        .join(" ")
    };
  });
}

export function markLatestLocalReviewBundleLedgerRow(rows: AuditEvidenceReportLedgerRow[]): AuditEvidenceReportLedgerRow[] {
  const latestLocalReviewBundleRow = rows
    .filter(auditEvidenceReportLedgerRowIsLocalReviewBundle)
    .reduce<AuditEvidenceReportLedgerRow | undefined>((latest, row) => {
      if (!latest) {
        return row;
      }
      const rowCreatedAt = Date.parse(row.createdAt);
      const latestCreatedAt = Date.parse(latest.createdAt);
      if (rowCreatedAt > latestCreatedAt) {
        return row;
      }
      if (rowCreatedAt === latestCreatedAt && row.id.localeCompare(latest.id) > 0) {
        return row;
      }
      return latest;
    }, undefined);

  if (!latestLocalReviewBundleRow) {
    return rows;
  }

  const latestLabel = auditReportLedgerLocalReviewBundleLatestLabel(latestLocalReviewBundleRow);
  const latestQuery = auditReportLedgerLocalReviewBundleLatestQuery(latestLocalReviewBundleRow);
  const latestTitle = auditReportLedgerLocalReviewBundleLatestTitle(latestLocalReviewBundleRow);
  return rows.map((row) => {
    if (row.id !== latestLocalReviewBundleRow.id) {
      return row;
    }
    return {
      ...row,
      localReviewBundleLatestLabel: latestLabel,
      localReviewBundleLatestQuery: latestQuery,
      localReviewBundleLatestTitle: latestTitle,
      searchText: [row.searchText, latestLabel, latestQuery, latestTitle].filter(Boolean).join(" ")
    };
  });
}

export function linkP2ReadinessEvidenceCoverageLedgerRowsToAcceptanceReviews(
  rows: AuditEvidenceReportLedgerRow[]
): AuditEvidenceReportLedgerRow[] {
  const coverageReviewIds = new Set(
    rows.filter((row) => row.reportKind === "p2_readiness_evidence_coverage_review").map((row) => row.id)
  );
  const latestAcceptanceReviewByCoverageReviewId = new Map<string, AuditEvidenceReportLedgerRow>();
  rows.forEach((row) => {
    const linkedCoverageReviewAuditEventId =
      row.reportKind === "p2_readiness_acceptance_review"
        ? row.p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId.trim()
        : "";
    if (!linkedCoverageReviewAuditEventId) {
      return;
    }
    const current = latestAcceptanceReviewByCoverageReviewId.get(linkedCoverageReviewAuditEventId);
    if (!current || Date.parse(row.createdAt) > Date.parse(current.createdAt)) {
      latestAcceptanceReviewByCoverageReviewId.set(linkedCoverageReviewAuditEventId, row);
    }
  });

  return rows.map((row) => {
    if (row.reportKind === "p2_readiness_acceptance_review") {
      const linkedCoverageReviewAuditEventId = row.p2ReadinessAcceptanceLinkedCoverageReviewAuditEventId.trim();
      if (!linkedCoverageReviewAuditEventId) {
        return row;
      }
      const coverageLoaded = coverageReviewIds.has(linkedCoverageReviewAuditEventId);
      const statusLabel = coverageLoaded ? "review chain loaded" : "review chain coverage missing";
      const statusQuery = auditReportLedgerDeduplicatedQueryText([
        "review-chain-status",
        coverageLoaded ? "" : "review-chain-gap",
        coverageLoaded ? "review-chain-loaded" : "review-chain-coverage-missing",
        row.id,
        linkedCoverageReviewAuditEventId,
        row.createdAt
      ]);
      return {
        ...row,
        p2ReadinessReviewChainAcceptanceLoaded: true,
        p2ReadinessReviewChainCoverageLoaded: coverageLoaded,
        p2ReadinessReviewChainHealthContextQuery: "review-chain-health",
        p2ReadinessReviewChainHealthContextTitle: auditReportLedgerP2ReviewChainHealthContextTitle({
          acceptanceReviewAuditEventId: row.id,
          coverageReviewAuditEventId: linkedCoverageReviewAuditEventId,
          state: coverageLoaded ? "loaded" : "missing-coverage"
        }),
        p2ReadinessReviewChainStatusLabel: statusLabel,
        p2ReadinessReviewChainStatusQuery: statusQuery
      };
    }
    if (row.reportKind !== "p2_readiness_evidence_coverage_review") {
      return row;
    }
    const acceptanceReviewRow = latestAcceptanceReviewByCoverageReviewId.get(row.id);
    if (!acceptanceReviewRow) {
      const statusLabel = "review chain acceptance missing";
      const statusQuery = auditReportLedgerDeduplicatedQueryText([
        "review-chain-status",
        "review-chain-gap",
        "review-chain-acceptance-missing",
        row.id,
        row.createdAt
      ]);
      return {
        ...row,
        p2ReadinessReviewChainAcceptanceLoaded: false,
        p2ReadinessReviewChainCoverageLoaded: true,
        p2ReadinessReviewChainHealthContextQuery: "review-chain-health",
        p2ReadinessReviewChainHealthContextTitle: auditReportLedgerP2ReviewChainHealthContextTitle({
          coverageReviewAuditEventId: row.id,
          state: "missing-acceptance"
        }),
        p2ReadinessReviewChainStatusLabel: statusLabel,
        p2ReadinessReviewChainStatusQuery: statusQuery
      };
    }
    const linkLabel = `linked acceptance review · ${acceptanceReviewRow.id}`;
    const linkQuery =
      buildAuditEvidenceReportLedgerRowP2ReadinessEvidenceCoverageLinkedAcceptanceReviewQuery(acceptanceReviewRow);
    const reviewChainLabel =
      acceptanceReviewRow.p2ReadinessReviewChainLabel ||
      `linked review chain · ${acceptanceReviewRow.id} -> ${row.id}`;
    const reviewChainQuery =
      acceptanceReviewRow.p2ReadinessReviewChainQuery ||
      buildAuditEvidenceReportLedgerRowP2ReadinessReviewChainQuery(acceptanceReviewRow);
    const statusLabel = "review chain loaded";
    const statusQuery = auditReportLedgerDeduplicatedQueryText([
      "review-chain-status",
      "review-chain-loaded",
      acceptanceReviewRow.id,
      row.id,
      acceptanceReviewRow.createdAt
    ]);
    return {
      ...row,
      p2ReadinessEvidenceCoverageAcceptanceReviewLinkLabel: linkLabel,
      p2ReadinessEvidenceCoverageAcceptanceReviewLinkQuery: linkQuery,
      p2ReadinessReviewChainLabel: reviewChainLabel,
      p2ReadinessReviewChainQuery: reviewChainQuery,
      p2ReadinessReviewChainAcceptanceLoaded: true,
      p2ReadinessReviewChainCoverageLoaded: true,
      p2ReadinessReviewChainHealthContextQuery: "review-chain-health",
      p2ReadinessReviewChainHealthContextTitle: auditReportLedgerP2ReviewChainHealthContextTitle({
        acceptanceReviewAuditEventId: acceptanceReviewRow.id,
        coverageReviewAuditEventId: row.id,
        state: "loaded"
      }),
      p2ReadinessReviewChainStatusLabel: statusLabel,
      p2ReadinessReviewChainStatusQuery: statusQuery,
      searchText: [
        row.searchText,
        linkLabel,
        linkQuery,
        reviewChainLabel,
        reviewChainQuery,
        "linked-review-chain",
        "linked review chain"
      ]
        .filter(Boolean)
        .join(" ")
    };
  });
}

export function auditReportLedgerP2ReviewChainHealthContextTitle({
  acceptanceReviewAuditEventId,
  coverageReviewAuditEventId,
  state
}: {
  acceptanceReviewAuditEventId?: string;
  coverageReviewAuditEventId?: string;
  state: "loaded" | "missing-coverage" | "missing-acceptance";
}): string {
  const stateToken =
    state === "loaded"
      ? "health-context-loaded"
      : state === "missing-coverage"
        ? "health-context-missing-coverage"
        : "health-context-missing-acceptance";
  return [
    "review-chain-health",
    stateToken,
    acceptanceReviewAuditEventId ? `acceptance ${acceptanceReviewAuditEventId}` : "",
    coverageReviewAuditEventId ? `coverage ${coverageReviewAuditEventId}` : ""
  ]
    .filter(Boolean)
    .join(" · ");
}

export function auditReportLedgerP2ReviewChainHealthContextSummaryTitle({
  contextRows,
  gapRows,
  latestGapEventId,
  loadedChains,
  missingAcceptance,
  missingCoverage
}: {
  contextRows: number;
  gapRows: number;
  latestGapEventId?: string;
  loadedChains: number;
  missingAcceptance: number;
  missingCoverage: number;
}): string {
  if (contextRows <= 0) {
    return "";
  }
  return [
    "review-chain-health",
    `health context rows ${contextRows}`,
    `loaded chains ${loadedChains}`,
    `gaps ${gapRows}`,
    `missing coverage ${missingCoverage}`,
    `missing acceptance ${missingAcceptance}`,
    latestGapEventId ? `latest gap ${latestGapEventId}` : ""
  ]
    .filter(Boolean)
    .join(" · ");
}

export function auditReportLedgerP2ReviewChainHealthSummaryTitle({
  contextRows,
  gapRows,
  latestGapEventId,
  loadedChains,
  missingAcceptance,
  missingCoverage,
  query,
  state
}: {
  contextRows: number;
  gapRows: number;
  latestGapEventId?: string;
  loadedChains: number;
  missingAcceptance: number;
  missingCoverage: number;
  query: string;
  state: AuditEvidenceReportLedgerSummary["p2ReadinessReviewChainHealthState"];
}): string {
  if (!query || state === "empty") {
    return "";
  }
  return [
    "review-chain-health",
    `health-state-${state}`,
    `query ${query}`,
    `context rows ${contextRows}`,
    `loaded chains ${loadedChains}`,
    `gaps ${gapRows}`,
    `missing coverage ${missingCoverage}`,
    `missing acceptance ${missingAcceptance}`,
    latestGapEventId ? `latest gap ${latestGapEventId}` : ""
  ]
    .filter(Boolean)
    .join(" · ");
}

export function auditReportLedgerPaperPreflightLabel({
  actionLabel,
  blocked,
  liveBoundary,
  passed,
  review,
  state,
  total
}: {
  actionLabel: string;
  blocked: number;
  liveBoundary: string;
  passed: number;
  review: number;
  state: string;
  total: number;
}): string {
  if (!state && total <= 0) {
    return "";
  }
  const action = actionLabel || "No direct action";
  const gateLabel = total > 0 ? `gates ${passed}/${review}/${blocked}` : "gates n/a";
  return ["Paper preflight", state || "unknown", "·", action, "·", gateLabel, liveBoundary ? `· ${liveBoundary}` : ""]
    .join(" ")
    .replace(/\s+/gu, " ")
    .trim();
}

export function auditReportLedgerLocalReviewBundleTitle({
  dailyOpsCount,
  dailyStartCount,
  latestEventId,
  latestTitle,
  personalTeamCount,
  stage1ArchiveCount,
  totalCount
}: {
  dailyOpsCount: number;
  dailyStartCount: number;
  latestEventId: string;
  latestTitle: string;
  personalTeamCount: number;
  stage1ArchiveCount: number;
  totalCount: number;
}): string {
  if (totalCount <= 0) {
    return "";
  }
  return [
    `Local review bundle: ${totalCount} reviews`,
    `personal/team ${personalTeamCount}`,
    `daily ops ${dailyOpsCount}`,
    `daily start ${dailyStartCount}`,
    `stage1 archive ${stage1ArchiveCount}`,
    latestEventId ? `latest ${latestEventId}` : "",
    latestTitle ? `latest context ${latestTitle}` : ""
  ]
    .filter(Boolean)
    .join(" · ");
}
