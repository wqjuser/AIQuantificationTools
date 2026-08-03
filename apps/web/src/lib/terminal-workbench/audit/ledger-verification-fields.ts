import { buildAuditEvidenceReportLedgerBaseFields } from "./ledger-base-fields";
import type { AuditEvidenceReportLedgerEventRecord, AuditEvidenceReportLedgerStatus } from "./report-contracts";
import { auditReportLedgerImportVerificationDetail, auditReportLedgerMetadataNumber, auditReportLedgerSignatureLabel, auditReportLedgerSignatureMetadata, auditReportLedgerSignatureStatus } from "./signing-key-ledger";

export function buildAuditEvidenceReportLedgerVerificationFields(
  event: AuditEvidenceReportLedgerEventRecord,
  context: ReturnType<typeof buildAuditEvidenceReportLedgerBaseFields>
) {
  const { reportKind, contentSha256, artifactKind, fileName, shortHash, focusQuery, isHashReady } = context;
  const status: AuditEvidenceReportLedgerStatus = isHashReady ? "ready" : "invalid";
  const signature = auditReportLedgerSignatureMetadata(event.metadata);
  const signatureStatus = status === "ready" ? auditReportLedgerSignatureStatus(signature) : "invalid";
  const signatureLabel = auditReportLedgerSignatureLabel(signatureStatus);
  const importVerificationVerified =
    reportKind === "backtest_report" ||
    reportKind === "operator_runbook_report" ||
    reportKind === "p0_readiness_report" ||
    reportKind === "p2_manifest_chain_preflight" ||
    reportKind === "p2_manifest_chain_preflight_review" ||
    reportKind === "p2_readiness_evidence_coverage_review" ||
    reportKind === "p2_readiness_acceptance_generated" ||
    reportKind === "p2_readiness_acceptance_review" ||
    reportKind === "personal_team_readiness_review" ||
    reportKind === "daily_ops_control_room_review" ||
    reportKind === "daily_start_brief_review" ||
    reportKind === "stage1_daily_archive_review" ||
    reportKind === "pre_live_runbook_report" ||
    reportKind === "research_context_readiness_report"
      ? 0
      : auditReportLedgerMetadataNumber(event.metadata, "importVerificationVerified");
  const importVerificationInvalid =
    reportKind === "backtest_report" ||
    reportKind === "operator_runbook_report" ||
    reportKind === "p0_readiness_report" ||
    reportKind === "p2_manifest_chain_preflight" ||
    reportKind === "p2_manifest_chain_preflight_review" ||
    reportKind === "p2_readiness_evidence_coverage_review" ||
    reportKind === "p2_readiness_acceptance_generated" ||
    reportKind === "p2_readiness_acceptance_review" ||
    reportKind === "personal_team_readiness_review" ||
    reportKind === "daily_ops_control_room_review" ||
    reportKind === "daily_start_brief_review" ||
    reportKind === "stage1_daily_archive_review" ||
    reportKind === "pre_live_runbook_report" ||
    reportKind === "research_context_readiness_report"
      ? 0
      : auditReportLedgerMetadataNumber(event.metadata, "importVerificationInvalid");
  const importVerificationDetail =
    reportKind === "backtest_report" ||
    reportKind === "operator_runbook_report" ||
    reportKind === "p0_readiness_report" ||
    reportKind === "p2_manifest_chain_preflight" ||
    reportKind === "p2_manifest_chain_preflight_review" ||
    reportKind === "p2_readiness_evidence_coverage_review" ||
    reportKind === "p2_readiness_acceptance_generated" ||
    reportKind === "p2_readiness_acceptance_review" ||
    reportKind === "personal_team_readiness_review" ||
    reportKind === "daily_ops_control_room_review" ||
    reportKind === "daily_start_brief_review" ||
    reportKind === "stage1_daily_archive_review" ||
    reportKind === "pre_live_runbook_report" ||
    reportKind === "research_context_readiness_report"
      ? ""
      : auditReportLedgerImportVerificationDetail(event.metadata, importVerificationVerified, importVerificationInvalid);
  return { status, signature, signatureStatus, signatureLabel, importVerificationVerified, importVerificationInvalid, importVerificationDetail };
}
