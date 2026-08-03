import type { AuditEvidenceReportLedgerEventRecord, AuditEvidenceReportLedgerRow } from "./report-contracts";
import { auditReportLedgerMetadataNumber, auditReportLedgerMetadataStringList, auditReportLedgerMetadataText } from "./signing-key-ledger";

export function buildAuditEvidenceReportLedgerBaseFields(
  event: AuditEvidenceReportLedgerEventRecord) {
  const reportKind: AuditEvidenceReportLedgerRow["reportKind"] =
    event.eventType === "p0_readiness_report"
      ? "p0_readiness_report"
      : event.eventType === "p2_manifest_chain_preflight"
      ? "p2_manifest_chain_preflight"
      : event.eventType === "p2_manifest_chain_preflight_review"
      ? "p2_manifest_chain_preflight_review"
      : event.eventType === "p2_readiness_evidence_coverage_review"
      ? "p2_readiness_evidence_coverage_review"
      : event.eventType === "p2_readiness_acceptance_generated"
      ? "p2_readiness_acceptance_generated"
      : event.eventType === "p2_readiness_acceptance_review"
      ? "p2_readiness_acceptance_review"
      : event.eventType === "personal_team_readiness_review"
      ? "personal_team_readiness_review"
      : event.eventType === "daily_ops_control_room_review"
      ? "daily_ops_control_room_review"
      : event.eventType === "daily_start_brief_review"
      ? "daily_start_brief_review"
      : event.eventType === "stage1_daily_archive_review"
      ? "stage1_daily_archive_review"
      : event.eventType === "operator_runbook_report"
      ? "operator_runbook_report"
      : event.eventType === "pre_live_runbook_report"
      ? "pre_live_runbook_report"
      : event.eventType === "research_context_readiness_report"
      ? "research_context_readiness_report"
      : event.eventType === "portfolio_report"
      ? "portfolio_report"
      : event.eventType === "backtest_report"
        ? "backtest_report"
        : "audit_evidence_report";
  const contentSha256 =
    auditReportLedgerMetadataText(event.metadata, "contentSha256") ||
    (reportKind === "p2_manifest_chain_preflight" || reportKind === "p2_readiness_acceptance_generated"
      ? auditReportLedgerMetadataText(event.metadata, "manifestSha256")
      : "");
  const artifactKind =
    auditReportLedgerMetadataText(event.metadata, "artifactKind") ||
    (reportKind === "p0_readiness_report"
      ? "aiqt.p0ReadinessReport"
      : reportKind === "p2_manifest_chain_preflight"
      ? "aiqt.p2ManifestChainPreflight"
      : reportKind === "p2_manifest_chain_preflight_review"
      ? "aiqt.p2ManifestChainPreflightReview"
      : reportKind === "p2_readiness_evidence_coverage_review"
      ? "aiqt.p2ReadinessEvidenceCoverageReview"
      : reportKind === "p2_readiness_acceptance_generated"
      ? "aiqt.p2ReadinessAcceptanceManifest"
      : reportKind === "p2_readiness_acceptance_review"
      ? "aiqt.p2ReadinessAcceptanceReview"
      : reportKind === "personal_team_readiness_review"
      ? "aiqt.personalTeamReadinessReview"
      : reportKind === "daily_ops_control_room_review"
      ? "aiqt.dailyOpsControlRoomReview"
      : reportKind === "daily_start_brief_review"
      ? "aiqt.dailyStartBriefReview"
      : reportKind === "stage1_daily_archive_review"
      ? "aiqt.stage1P0DailyUseArchiveReview"
      : reportKind === "operator_runbook_report"
      ? "aiqt.operatorRunbookReport"
      : reportKind === "pre_live_runbook_report"
      ? "aiqt.preLiveRunbookReport"
      : reportKind === "research_context_readiness_report"
      ? "aiqt.researchContextReadinessReport"
      : reportKind === "portfolio_report"
      ? "aiqt.portfolioReport"
      : reportKind === "backtest_report"
        ? "aiqt.backtestReport"
        : "aiqt.auditReport");
  const fileName =
    auditReportLedgerMetadataText(event.metadata, "fileName") ||
    (reportKind === "p0_readiness_report"
      ? "p0-readiness-report.md"
      : reportKind === "p2_manifest_chain_preflight"
      ? auditReportLedgerMetadataText(event.metadata, "sourcePath") || "p2-chain-preflight.json"
      : reportKind === "p2_manifest_chain_preflight_review"
      ? "p2-manifest-chain-preflight-review.md"
      : reportKind === "p2_readiness_evidence_coverage_review"
      ? "p2-readiness-evidence-coverage-review.md"
      : reportKind === "p2_readiness_acceptance_generated"
      ? auditReportLedgerMetadataText(event.metadata, "sourcePath") || "p2-readiness-acceptance.json"
      : reportKind === "p2_readiness_acceptance_review"
      ? "p2-readiness-acceptance-review.md"
      : reportKind === "personal_team_readiness_review"
      ? "personal-team-readiness-review.md"
      : reportKind === "daily_ops_control_room_review"
      ? "daily-ops-control-room-review.md"
      : reportKind === "daily_start_brief_review"
      ? "daily-start-brief-review.md"
      : reportKind === "stage1_daily_archive_review"
      ? "stage1-p0-daily-use-archive-review.md"
      : reportKind === "operator_runbook_report"
      ? "operator-runbook-report.md"
      : reportKind === "pre_live_runbook_report"
      ? "pre-live-runbook-report.md"
      : reportKind === "research_context_readiness_report"
      ? "research-context-readiness-report.md"
      : reportKind === "portfolio_report"
      ? "portfolio-report.md"
      : reportKind === "backtest_report"
        ? "backtest-report.md"
        : "audit-evidence-report.md");
  const shortHash = contentSha256 ? contentSha256.slice(0, 12) : "missing";
  const focusQuery =
    reportKind === "p0_readiness_report"
      ? [
          auditReportLedgerMetadataText(event.metadata, "state"),
          auditReportLedgerMetadataNumber(event.metadata, "progressPct")
            ? `${auditReportLedgerMetadataNumber(event.metadata, "progressPct")}%`
            : "",
          auditReportLedgerMetadataText(event.metadata, "currentGapLabel"),
          auditReportLedgerMetadataText(event.metadata, "latestEvidenceId")
        ]
          .filter(Boolean)
          .join(" ")
      : reportKind === "operator_runbook_report"
      ? [
          auditReportLedgerMetadataText(event.metadata, "adapterId"),
          auditReportLedgerMetadataText(event.metadata, "market"),
          auditReportLedgerMetadataText(event.metadata, "symbol"),
          auditReportLedgerMetadataText(event.metadata, "timeframe"),
          auditReportLedgerMetadataText(event.metadata, "status"),
          `${auditReportLedgerMetadataNumber(event.metadata, "completedSections")}/${auditReportLedgerMetadataNumber(
            event.metadata,
            "totalSections"
          )}`
        ]
          .filter(Boolean)
          .join(" ")
      : reportKind === "pre_live_runbook_report"
      ? [
          auditReportLedgerMetadataText(event.metadata, "adapterId"),
          auditReportLedgerMetadataText(event.metadata, "market"),
          auditReportLedgerMetadataText(event.metadata, "symbol"),
          auditReportLedgerMetadataText(event.metadata, "timeframe"),
          auditReportLedgerMetadataText(event.metadata, "status"),
          `${auditReportLedgerMetadataNumber(event.metadata, "completedSteps")}/${auditReportLedgerMetadataNumber(
            event.metadata,
            "totalSteps"
          )}`
        ]
          .filter(Boolean)
          .join(" ")
      : reportKind === "research_context_readiness_report"
      ? [
          auditReportLedgerMetadataText(event.metadata, "market"),
          auditReportLedgerMetadataText(event.metadata, "symbol"),
          auditReportLedgerMetadataText(event.metadata, "timeframe"),
          auditReportLedgerMetadataText(event.metadata, "preflightStatus"),
          auditReportLedgerMetadataText(event.metadata, "lockedPreparationEvidenceRunId")
        ]
          .filter(Boolean)
          .join(" ")
      : reportKind === "p2_manifest_chain_preflight"
      ? [
          auditReportLedgerMetadataText(event.metadata, "preflightStatus"),
          `${auditReportLedgerMetadataNumber(event.metadata, "validStageCount")}/${auditReportLedgerMetadataNumber(
            event.metadata,
            "totalStageCount"
          )}`,
          auditReportLedgerMetadataText(event.metadata, "nextAction"),
          auditReportLedgerMetadataStringList(event.metadata, "blockerIds").join(" ")
        ]
          .filter(Boolean)
          .join(" ")
      : reportKind === "p2_manifest_chain_preflight_review"
      ? [
          auditReportLedgerMetadataText(event.metadata, "preflightStatus") ||
            auditReportLedgerMetadataText(event.metadata, "state") ||
            event.stage,
          `${auditReportLedgerMetadataNumber(event.metadata, "validStageCount")}/${auditReportLedgerMetadataNumber(
            event.metadata,
            "totalStageCount"
          )}`,
          auditReportLedgerMetadataText(event.metadata, "nextAction"),
          auditReportLedgerMetadataStringList(event.metadata, "blockerIds").join(" ")
        ]
          .filter(Boolean)
          .join(" ")
      : reportKind === "p2_readiness_evidence_coverage_review"
      ? [
          auditReportLedgerMetadataText(event.metadata, "coverageStatus") ||
            auditReportLedgerMetadataText(event.metadata, "state") ||
            event.stage,
          `${auditReportLedgerMetadataNumber(event.metadata, "coveredCount")}/${auditReportLedgerMetadataNumber(
            event.metadata,
            "totalCount"
          )}`,
          auditReportLedgerMetadataStringList(event.metadata, "rowIds").join(" "),
          auditReportLedgerMetadataStringList(event.metadata, "sourceTypes").join(" ")
        ]
          .filter(Boolean)
          .join(" ")
      : reportKind === "p2_readiness_acceptance_generated"
      ? [
          auditReportLedgerMetadataText(event.metadata, "acceptanceStatus") ||
            auditReportLedgerMetadataText(event.metadata, "status") ||
            auditReportLedgerMetadataText(event.metadata, "state"),
          `${auditReportLedgerMetadataNumber(event.metadata, "acceptedCriterionCount")}/${auditReportLedgerMetadataNumber(
            event.metadata,
            "totalCriterionCount"
          )}`,
          auditReportLedgerMetadataText(event.metadata, "runId") || event.runId || "",
          auditReportLedgerMetadataText(event.metadata, "market"),
          auditReportLedgerMetadataText(event.metadata, "symbol"),
          auditReportLedgerMetadataText(event.metadata, "timeframe")
        ]
          .filter(Boolean)
          .join(" ")
      : reportKind === "p2_readiness_acceptance_review"
      ? [
          auditReportLedgerMetadataText(event.metadata, "market"),
          auditReportLedgerMetadataText(event.metadata, "symbol"),
          auditReportLedgerMetadataText(event.metadata, "timeframe"),
          auditReportLedgerMetadataText(event.metadata, "state"),
          `${auditReportLedgerMetadataNumber(event.metadata, "acceptedCriterionCount")}/${auditReportLedgerMetadataNumber(
            event.metadata,
            "totalCriterionCount"
          )}`
        ]
          .filter(Boolean)
          .join(" ")
      : reportKind === "daily_start_brief_review"
      ? [
          auditReportLedgerMetadataText(event.metadata, "state") || event.stage,
          "local-reviews",
          `${auditReportLedgerMetadataNumber(event.metadata, "currentReviewCount")}/2`,
          "open-ops",
          auditReportLedgerMetadataNumber(event.metadata, "openOpsItemCount"),
          auditReportLedgerMetadataText(event.metadata, "primaryActionLabel")
        ]
          .filter(Boolean)
          .join(" ")
      : reportKind === "stage1_daily_archive_review"
      ? [
          auditReportLedgerMetadataText(event.metadata, "state") || event.stage,
          `${auditReportLedgerMetadataNumber(event.metadata, "readyCount")}/${auditReportLedgerMetadataNumber(
            event.metadata,
            "totalCount"
          )}`,
          auditReportLedgerMetadataText(event.metadata, "primaryActionId"),
          auditReportLedgerMetadataText(event.metadata, "primaryActionLabel"),
          auditReportLedgerMetadataText(event.metadata, "primaryTargetWorkspaceId"),
          auditReportLedgerMetadataText(event.metadata, "refreshOutcomeState"),
          auditReportLedgerMetadataText(event.metadata, "shareKind"),
          auditReportLedgerMetadataText(event.metadata, "shareFocus"),
          auditReportLedgerMetadataText(event.metadata, "shareTargetWorkspaceId"),
          auditReportLedgerMetadataStringList(event.metadata, "rowIds").join(" "),
          auditReportLedgerMetadataStringList(event.metadata, "rowStatuses").join(" ")
        ]
          .filter(Boolean)
          .join(" ")
      : reportKind === "portfolio_report"
      ? [
          auditReportLedgerMetadataText(event.metadata, "market"),
          auditReportLedgerMetadataText(event.metadata, "timeframe"),
          auditReportLedgerMetadataText(event.metadata, "portfolioName")
        ]
          .filter(Boolean)
          .join(" ")
      : reportKind === "backtest_report"
      ? [
          auditReportLedgerMetadataText(event.metadata, "market"),
          auditReportLedgerMetadataText(event.metadata, "symbol"),
          auditReportLedgerMetadataText(event.metadata, "timeframe"),
          auditReportLedgerMetadataText(event.metadata, "strategyRevision")
        ]
          .filter(Boolean)
          .join(" ")
      : auditReportLedgerMetadataText(event.metadata, "evidenceFocus");
  const isHashReady = /^[a-f0-9]{64}$/iu.test(contentSha256);
  return { reportKind, contentSha256, artifactKind, fileName, shortHash, focusQuery, isHashReady };
}
