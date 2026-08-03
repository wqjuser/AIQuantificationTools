import type { OperatorRunbookAuditCoverage, PreLiveRunbookAuditCoverage } from "./deep-link-queries";
import type { AuditSigningKeyRotationChainStageId, AuditSigningKeyRotationLedgerEventKind, AuditSigningKeyRotationLedgerRow, AuditSigningKeyRotationLedgerStatus } from "./execution-contracts";
import type { ResearchContextReportCoverage } from "./local-review-bundle";
import type { AuditEvidenceReportLedgerEventRecord, AuditEvidenceReportLedgerRow, AuditEvidenceReportSignatureStatus } from "./report-contracts";
import { auditReportLedgerRowIsSigningEligible, latestEvidencePackageLedgerRow } from "./report-ledger-summary";
import { buildAuditEvidenceReportLedgerRowOperatorRunbookQuery } from "./report-queries";
import { auditReportLedgerMetadataBoolean, auditReportLedgerMetadataStringList, auditReportLedgerMetadataText, timestampSortValue } from "./signing-key-ledger";
import type { TerminalWorkspace } from "../core/workspace-contracts";
import type { ExecutionAdapterPreLiveRunbookSummary, OperatorRunbookSummary } from "../execution/ops-contracts";
import type { Market, Timeframe } from "../stage1/foundation-contracts";

export function evidencePackageSignatureState(rows: AuditEvidenceReportLedgerRow[]): {
  status: AuditEvidenceReportSignatureStatus | "missing";
  stale: boolean;
  detail: string;
} {
  const signingRows = rows.filter(auditReportLedgerRowIsSigningEligible);
  if (!signingRows.length) {
    return {
      status: "missing",
      stale: false,
      detail: "No signable audit/backtest/portfolio report has been recorded."
    };
  }
  const staleRows = signingRows.filter(
    (row) => row.status === "invalid" || row.signatureStatus === "invalid" || row.signatureStatus === "revoked"
  );
  const unsignedRows = signingRows.filter((row) => row.signatureStatus === "unsigned");
  const verifiedRows = signingRows.filter((row) => row.signatureStatus === "verified");
  const signedRows = signingRows.filter((row) => row.signatureStatus === "signed");
  const latest = latestEvidencePackageLedgerRow(signingRows);
  const status: AuditEvidenceReportSignatureStatus =
    staleRows[0]?.signatureStatus === "revoked" || staleRows[0]?.signatureStatus === "invalid"
      ? staleRows[0].signatureStatus
      : staleRows.length
        ? "invalid"
        : unsignedRows.length
          ? "unsigned"
          : verifiedRows.length
            ? "verified"
            : signedRows.length
              ? "signed"
              : latest?.signatureStatus ?? "unsigned";

  return {
    status,
    stale: staleRows.length > 0,
    detail: `${signedRows.length + verifiedRows.length}/${signingRows.length} signed or verified · ${
      unsignedRows.length
    } unsigned · ${staleRows.length} stale`
  };
}

export function evidencePackageCoverageDetail(rows: AuditEvidenceReportLedgerRow[]): string {
  if (!rows.length) {
    return "No report ledger evidence recorded.";
  }
  const packageMatched = rows.reduce((total, row) => total + row.packageMatched, 0);
  const packageTotal = rows.reduce((total, row) => total + row.packageTotal, 0);
  const importVerified = rows.reduce((total, row) => total + row.importVerificationVerified, 0);
  const importInvalid = rows.reduce((total, row) => total + row.importVerificationInvalid, 0);
  return `Package evidence ${packageMatched}/${packageTotal} · import verification ${importVerified}/${importInvalid}`;
}

export function auditReportLedgerPreLiveRunbookEvidenceLabel(count: number): string {
  return `${count} evidence ${count === 1 ? "id" : "ids"}`;
}

export function auditReportLedgerOperatorRunbookSectionLabel(count: number): string {
  return `${count} ${count === 1 ? "section" : "sections"}`;
}

export function buildLatestResearchContextReportForContext(
  rows: AuditEvidenceReportLedgerRow[],
  context: { market: Market; symbol: string; timeframe: Timeframe }
): AuditEvidenceReportLedgerRow | null {
  return buildResearchContextReportCoverageForContext(rows, context).latestMatchingReport;
}

export function buildPreLiveRunbookAuditCoverage(
  rows: AuditEvidenceReportLedgerRow[],
  runbook: ExecutionAdapterPreLiveRunbookSummary,
  workspace: TerminalWorkspace
): PreLiveRunbookAuditCoverage {
  const market = runbook.market;
  const symbol = workspace.selectedInstrument.symbol;
  const timeframe = workspace.selectedTimeframe;
  const currentGateLabel = `${runbook.completedSteps}/${runbook.totalSteps} gates`;
  const latest = rows
    .filter(
      (row) =>
        row.reportKind === "pre_live_runbook_report" &&
        row.status === "ready" &&
        row.preLiveRunbookAdapterId === runbook.adapterId &&
        row.preLiveRunbookMarket === market &&
        row.preLiveRunbookSymbol === symbol &&
        row.preLiveRunbookTimeframe === timeframe
    )
    .sort((left, right) => timestampSortValue(right.createdAt) - timestampSortValue(left.createdAt))[0];

  if (!latest) {
    return {
      currentGateLabel,
      detail: `No audited pre-live runbook report is recorded for ${runbook.adapterId} ${market} ${symbol} ${timeframe}.`,
      gateLabel: "",
      latestEventId: "",
      mismatchLabel: "",
      query: "",
      shortHash: "",
      status: "missing",
      statusLabel: "Not audited"
    };
  }

  const query = [
    latest.reportKind,
    latest.preLiveRunbookAdapterId,
    latest.preLiveRunbookMarket,
    latest.preLiveRunbookSymbol,
    latest.preLiveRunbookTimeframe,
    latest.preLiveRunbookStatus,
    latest.shortHash
  ]
    .filter(Boolean)
    .join(" ");
  const currentEvidenceIds = normalizedPreLiveRunbookEvidenceIds(
    runbook.rows.map((row) => row.evidenceId ?? "")
  );
  const auditedEvidenceIds = normalizedPreLiveRunbookEvidenceIds(latest.preLiveRunbookEvidenceIds);
  const evidenceIdsMatch = samePreLiveRunbookEvidenceIds(auditedEvidenceIds, currentEvidenceIds);
  const matchesCurrent =
    latest.preLiveRunbookCompletedSteps === runbook.completedSteps &&
    latest.preLiveRunbookTotalSteps === runbook.totalSteps &&
    latest.preLiveRunbookStatus === runbook.status &&
    latest.preLiveRunbookNextStepId === (runbook.nextStepId ?? "") &&
    evidenceIdsMatch;
  const mismatchLabel = matchesCurrent ? "" : buildPreLiveRunbookAuditMismatchLabel(latest, runbook);
  const gateStateMatches =
    latest.preLiveRunbookCompletedSteps === runbook.completedSteps &&
    latest.preLiveRunbookTotalSteps === runbook.totalSteps &&
    latest.preLiveRunbookStatus === runbook.status &&
    latest.preLiveRunbookNextStepId === (runbook.nextStepId ?? "");
  const staleDetail =
    !gateStateMatches && !evidenceIdsMatch
      ? "Latest audited runbook is for this adapter context, but its gate state and evidence set differ from the current screen."
      : !evidenceIdsMatch
        ? "Latest audited runbook is for this adapter context, but its evidence set differs from the current screen."
        : "Latest audited runbook is for this adapter context, but its gate state differs from the current screen.";

  return {
    currentGateLabel,
    detail: matchesCurrent
      ? "Latest audited runbook matches the current adapter context and gate state."
      : auditCoverageDetailWithMismatch(staleDetail, mismatchLabel),
    gateLabel: `${latest.preLiveRunbookCompletedSteps}/${latest.preLiveRunbookTotalSteps} gates`,
    latestEventId: latest.id,
    mismatchLabel,
    query,
    shortHash: latest.shortHash,
    status: matchesCurrent ? "matched" : "stale",
    statusLabel: matchesCurrent ? "Audited" : "Needs re-audit"
  };
}

export function normalizedPreLiveRunbookEvidenceIds(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

export function samePreLiveRunbookEvidenceIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function buildPreLiveRunbookEvidenceIdDiffLabel(
  auditedEvidenceIds: readonly string[],
  currentEvidenceIds: readonly string[]
): string {
  const removed = auditedEvidenceIds.filter((id) => !currentEvidenceIds.includes(id));
  const added = currentEvidenceIds.filter((id) => !auditedEvidenceIds.includes(id));
  return [
    `evidence ids ${auditedEvidenceIds.length} -> ${currentEvidenceIds.length} changed`,
    removed.length ? `removed ${removed.join(",")}` : "",
    added.length ? `added ${added.join(",")}` : ""
  ]
    .filter(Boolean)
    .join(" · ");
}

export function buildPreLiveRunbookAuditMismatchLabel(
  latest: AuditEvidenceReportLedgerRow,
  runbook: ExecutionAdapterPreLiveRunbookSummary
): string {
  const mismatches: string[] = [];
  if (latest.preLiveRunbookStatus !== runbook.status) {
    mismatches.push(`status ${latest.preLiveRunbookStatus || "unknown"} -> ${runbook.status}`);
  }

  const latestNextStepId = latest.preLiveRunbookNextStepId || "ready";
  const currentNextStepId = runbook.nextStepId ?? "ready";
  if (latestNextStepId !== currentNextStepId) {
    mismatches.push(`next step ${latestNextStepId} -> ${currentNextStepId}`);
  }

  if (
    latest.preLiveRunbookCompletedSteps !== runbook.completedSteps ||
    latest.preLiveRunbookTotalSteps !== runbook.totalSteps
  ) {
    mismatches.push(
      `gates ${latest.preLiveRunbookCompletedSteps}/${latest.preLiveRunbookTotalSteps} -> ${runbook.completedSteps}/${runbook.totalSteps}`
    );
  }

  const currentEvidenceIds = normalizedPreLiveRunbookEvidenceIds(
    runbook.rows.map((row) => row.evidenceId ?? "")
  );
  const auditedEvidenceIds = normalizedPreLiveRunbookEvidenceIds(latest.preLiveRunbookEvidenceIds);
  if (!samePreLiveRunbookEvidenceIds(auditedEvidenceIds, currentEvidenceIds)) {
    mismatches.push(buildPreLiveRunbookEvidenceIdDiffLabel(auditedEvidenceIds, currentEvidenceIds));
  }

  return mismatches.join(" · ");
}

export function buildOperatorRunbookAuditCoverage(
  rows: AuditEvidenceReportLedgerRow[],
  runbook: OperatorRunbookSummary,
  workspace: TerminalWorkspace
): OperatorRunbookAuditCoverage {
  const market = workspace.selectedInstrument.market;
  const symbol = workspace.selectedInstrument.symbol;
  const timeframe = workspace.selectedTimeframe;
  const currentSectionLabel = `${runbook.completedSections}/${runbook.totalSections} sections`;
  const latest = rows
    .filter(
      (row) =>
        row.reportKind === "operator_runbook_report" &&
        row.status === "ready" &&
        row.operatorRunbookAdapterId === runbook.adapterId &&
        row.operatorRunbookMarket === market &&
        row.operatorRunbookSymbol === symbol &&
        row.operatorRunbookTimeframe === timeframe
    )
    .sort((left, right) => timestampSortValue(right.createdAt) - timestampSortValue(left.createdAt))[0];

  if (!latest) {
    return {
      currentSectionLabel,
      detail: `No audited operator runbook report is recorded for ${runbook.adapterId} ${market} ${symbol} ${timeframe}.`,
      latestEventId: "",
      mismatchLabel: "",
      query: "",
      sectionLabel: "",
      shortHash: "",
      status: "missing",
      statusLabel: "Not audited"
    };
  }

  const query = buildAuditEvidenceReportLedgerRowOperatorRunbookQuery(latest);
  const matchesCurrent =
    latest.operatorRunbookCompletedSections === runbook.completedSections &&
    latest.operatorRunbookTotalSections === runbook.totalSections &&
    latest.operatorRunbookStatus === runbook.status &&
    latest.operatorRunbookNextActionId === (runbook.nextActionId ?? "") &&
    sameOperatorRunbookValues(latest.operatorRunbookSectionStatuses, operatorRunbookSectionStatuses(runbook)) &&
    sameOperatorRunbookValues(latest.operatorRunbookSectionEvidence, operatorRunbookSectionEvidence(runbook)) &&
    sameOperatorRunbookValues(latest.operatorRunbookControlSnapshot, operatorRunbookControlSnapshot(runbook));
  const mismatchLabel = matchesCurrent ? "" : buildOperatorRunbookAuditMismatchLabel(latest, runbook);

  return {
    currentSectionLabel,
    detail: matchesCurrent
      ? "Latest audited operator runbook matches the current context, controls, and section state."
      : auditCoverageDetailWithMismatch(
          "Latest audited operator runbook is for this context, but its controls or section state differ from the current screen.",
          mismatchLabel
        ),
    latestEventId: latest.id,
    mismatchLabel,
    query,
    sectionLabel: `${latest.operatorRunbookCompletedSections}/${latest.operatorRunbookTotalSections} sections`,
    shortHash: latest.shortHash,
    status: matchesCurrent ? "matched" : "stale",
    statusLabel: matchesCurrent ? "Audited" : "Needs re-audit"
  };
}

export function auditCoverageDetailWithMismatch(detail: string, mismatchLabel: string): string {
  const baseDetail = detail.endsWith(".") ? detail.slice(0, -1) : detail;
  return mismatchLabel ? `${baseDetail}: ${mismatchLabel}.` : detail;
}

export function operatorRunbookSectionStatuses(runbook: OperatorRunbookSummary): string[] {
  return runbook.sections.map((section) => `${section.id}:${section.status}`);
}

export function operatorRunbookSectionEvidence(runbook: OperatorRunbookSummary): string[] {
  return runbook.sections.map((section) => `${section.id}:${section.evidence}`);
}

export function operatorRunbookControlSnapshot(runbook: OperatorRunbookSummary): string[] {
  return [
    `killSwitch=${runbook.controls.killSwitch}`,
    `rollbackOwner=${runbook.controls.rollbackOwner}`,
    `positionLimit=${runbook.controls.positionLimit}`,
    `dataFreshness=${runbook.controls.dataFreshness}`,
    `environmentState=${runbook.controls.environmentState}`,
    `auditPackage=${runbook.controls.auditPackage}`
  ];
}

export function sameOperatorRunbookValues(left: readonly string[], right: readonly string[]): boolean {
  const normalizedLeft = normalizedOperatorRunbookValues(left);
  const normalizedRight = normalizedOperatorRunbookValues(right);
  return normalizedLeft.length === normalizedRight.length && normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

export function normalizedOperatorRunbookValues(values: readonly string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean).sort();
}

export function buildOperatorRunbookAuditMismatchLabel(
  latest: AuditEvidenceReportLedgerRow,
  runbook: OperatorRunbookSummary
): string {
  const mismatches: string[] = [];
  if (latest.operatorRunbookStatus !== runbook.status) {
    mismatches.push(`status ${latest.operatorRunbookStatus || "unknown"} -> ${runbook.status}`);
  }

  const latestNextActionId = latest.operatorRunbookNextActionId || "ready";
  const currentNextActionId = runbook.nextActionId ?? "ready";
  if (latestNextActionId !== currentNextActionId) {
    mismatches.push(`next action ${latestNextActionId} -> ${currentNextActionId}`);
  }

  if (
    latest.operatorRunbookCompletedSections !== runbook.completedSections ||
    latest.operatorRunbookTotalSections !== runbook.totalSections
  ) {
    mismatches.push(
      `sections ${latest.operatorRunbookCompletedSections}/${latest.operatorRunbookTotalSections} -> ${runbook.completedSections}/${runbook.totalSections}`
    );
  }

  if (!sameOperatorRunbookValues(latest.operatorRunbookSectionStatuses, operatorRunbookSectionStatuses(runbook))) {
    mismatches.push("section statuses changed");
  }
  if (!sameOperatorRunbookValues(latest.operatorRunbookSectionEvidence, operatorRunbookSectionEvidence(runbook))) {
    mismatches.push("section evidence changed");
  }
  if (!sameOperatorRunbookValues(latest.operatorRunbookControlSnapshot, operatorRunbookControlSnapshot(runbook))) {
    mismatches.push("controls changed");
  }
  return mismatches.join(" · ");
}

export function buildResearchContextReportCoverageForContext(
  rows: AuditEvidenceReportLedgerRow[],
  context: { market: Market; symbol: string; timeframe: Timeframe }
): ResearchContextReportCoverage {
  const readyReports = rows.filter(
    (row) => row.reportKind === "research_context_readiness_report" && row.status === "ready"
  );
  const latestMatchingReport = latestAuditEvidenceReportLedgerRow(
    readyReports.filter(
      (row) =>
        row.researchContextMarket === context.market &&
        row.researchContextSymbol === context.symbol &&
        row.researchContextTimeframe === context.timeframe
    )
  );
  const latestOtherReport = latestAuditEvidenceReportLedgerRow(
    readyReports.filter(
      (row) =>
        row.researchContextMarket !== context.market ||
        row.researchContextSymbol !== context.symbol ||
        row.researchContextTimeframe !== context.timeframe
    )
  );

  return {
    latestMatchingReport,
    latestOtherReport,
    readyReportCount: readyReports.length,
    status: latestMatchingReport ? "matched" : readyReports.length > 0 ? "context-mismatch" : "missing"
  };
}

export function latestAuditEvidenceReportLedgerRow(
  rows: AuditEvidenceReportLedgerRow[]
): AuditEvidenceReportLedgerRow | null {
  return rows.reduce<AuditEvidenceReportLedgerRow | null>((latest, row) => {
    if (!latest) {
      return row;
    }
    return Date.parse(row.createdAt) > Date.parse(latest.createdAt) ? row : latest;
  }, null);
}

export function filterAuditEvidenceReportLedgerRows(
  rows: AuditEvidenceReportLedgerRow[],
  query: string
): AuditEvidenceReportLedgerRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }
  const queryTokens = normalizedQuery.split(/\s+/u).filter(Boolean);
  return rows.filter((row) => {
    const searchableText = [
      row.id,
      row.artifactKind,
      row.runId,
      row.fileName,
      row.contentSha256,
      row.shortHash,
      row.focusQuery,
      row.evidenceLinkDecodedSearch,
      row.evidenceLinkLabel,
      row.evidenceLinkSearch,
      row.evidenceLinkStatus,
      row.evidenceTargetWorkspaceId ?? "",
      row.deepLinkStatus,
      row.status,
      row.statusLabel,
      row.chainId,
      row.signer,
      row.signatureAlgorithm,
      row.signatureDetail,
      row.signatureKeyId,
      row.signatureRevokedReason,
      row.signatureSignedAt,
      row.signatureStatus,
      row.signatureLabel,
      row.signatureVerifiedAt,
      row.importVerificationDetail,
      row.p0CurrentGapActionId,
      row.p0CurrentGapActionLabel,
      row.p0CurrentGapDeepLinkSearch,
      row.p0CurrentGapTargetWorkspaceId ?? "",
      row.p0CurrentGapWorkspaceId ?? "",
      row.p0PreparationEvidenceRunId,
      row.researchContextLinkDecodedSearch,
      row.researchContextLinkLabel,
      row.researchContextLinkSearch,
      row.researchContextNextAction,
      row.researchContextPreflightStatus,
      row.researchContextPreparationEvidenceRunId,
      row.p2ReadinessAcceptanceCoverageReviewLinkLabel,
      row.p2ReadinessAcceptanceCoverageReviewLinkQuery,
      row.p2ReadinessEvidenceCoverageAcceptanceReviewLinkLabel,
      row.p2ReadinessEvidenceCoverageAcceptanceReviewLinkQuery,
      row.localReviewBundleContextLabel,
      row.localReviewBundleContextQuery,
      row.localReviewBundleContextTitle,
      row.localReviewBundleCoverageQuery,
      row.localReviewBundleCoverageNextActionQuery,
      row.localReviewBundleCoverageNextActionTitle,
      row.localReviewBundleLatestLabel,
      row.localReviewBundleLatestQuery,
      row.localReviewBundleLatestTitle,
      row.p2ReadinessReviewChainLabel,
      row.p2ReadinessReviewChainQuery,
      row.p2ReadinessReviewChainHealthContextQuery,
      row.p2ReadinessReviewChainHealthContextTitle,
      row.p2ReadinessReviewChainStatusLabel,
      row.p2ReadinessReviewChainStatusQuery,
      String(row.p2ReadinessReviewChainAcceptanceLoaded),
      String(row.p2ReadinessReviewChainCoverageLoaded),
      row.searchText,
      String(row.importVerificationVerified),
      String(row.importVerificationInvalid),
      row.detail,
      row.reportKind,
      String(row.packageMatched),
      String(row.packageTotal),
      String(row.importDiffBlocked),
      String(row.importDiffTotal)
    ]
      .join(" ")
      .toLowerCase();
    return queryTokens.every((token) => searchableText.includes(token));
  });
}

export function buildAuditSigningKeyRotationLedgerRows(
  events: AuditEvidenceReportLedgerEventRecord[]
): AuditSigningKeyRotationLedgerRow[] {
  return events
    .filter(
      (event) =>
        event.eventType === "audit_signing_key_rotation_plan" ||
        event.eventType === "audit_signing_key_rotation_apply" ||
        event.eventType === "audit_signing_key_controlled_restart_evidence" ||
        event.eventType === "audit_signing_key_secret_materialization" ||
        event.eventType === "audit_signing_key_environment_binding" ||
        event.eventType === "audit_signing_key_runtime_reload_plan" ||
        event.eventType === "audit_signing_key_runtime_reload_execution" ||
        event.eventType === "audit_signing_key_rotation_acceptance"
    )
    .map((event) => {
      const blockedReasons = auditReportLedgerMetadataStringList(event.metadata, "blockedReasons");
      const isApplyEvent = event.eventType === "audit_signing_key_rotation_apply";
      const isRestartEvent = event.eventType === "audit_signing_key_controlled_restart_evidence";
      const isMaterializationEvent = event.eventType === "audit_signing_key_secret_materialization";
      const isEnvironmentBindingEvent = event.eventType === "audit_signing_key_environment_binding";
      const isRuntimeReloadPlanEvent = event.eventType === "audit_signing_key_runtime_reload_plan";
      const isRuntimeReloadExecutionEvent = event.eventType === "audit_signing_key_runtime_reload_execution";
      const isRotationAcceptanceEvent = event.eventType === "audit_signing_key_rotation_acceptance";
      const statusMetadata = auditReportLedgerMetadataText(event.metadata, "status");
      const status: AuditSigningKeyRotationLedgerStatus =
        event.stage === "blocked" || statusMetadata === "blocked" || blockedReasons.length > 0
          ? "blocked"
          : isRotationAcceptanceEvent
            ? "acceptance_recorded"
          : isRuntimeReloadExecutionEvent
            ? "execution_recorded"
          : isRuntimeReloadPlanEvent
            ? "plan_recorded"
          : isEnvironmentBindingEvent
            ? "binding_recorded"
          : isMaterializationEvent
            ? "manifest_recorded"
          : isRestartEvent
            ? "evidence_recorded"
            : isApplyEvent
            ? "ready_for_restart"
            : "prepared";
      const templateSha256 = auditReportLedgerMetadataText(event.metadata, "legacyRegistryTemplateSha256");
      const isTemplateHashReady = /^[a-f0-9]{64}$/iu.test(templateSha256);
      const environmentUpdateNames = isMaterializationEvent || isEnvironmentBindingEvent || isRuntimeReloadPlanEvent || isRuntimeReloadExecutionEvent || isRotationAcceptanceEvent
        ? auditReportLedgerMetadataStringList(event.metadata, "requiredEnvVars")
        : auditReportLedgerMetadataStringList(event.metadata, "environmentUpdateNames");
      const secretPlaceholderNames = auditReportLedgerMetadataStringList(event.metadata, "secretPlaceholderNames");
      const stepIds = auditReportLedgerMetadataStringList(event.metadata, "stepIds");
      const confirmedConfirmationIds = auditReportLedgerMetadataStringList(event.metadata, "confirmedConfirmationIds");
      const requiredConfirmationIds = auditReportLedgerMetadataStringList(event.metadata, "requiredConfirmationIds");
      const missingConfirmationIds = isRestartEvent || isMaterializationEvent || isEnvironmentBindingEvent || isRuntimeReloadPlanEvent || isRuntimeReloadExecutionEvent || isRotationAcceptanceEvent
        ? requiredConfirmationIds.filter((confirmationId) => !confirmedConfirmationIds.includes(confirmationId))
        : auditReportLedgerMetadataStringList(event.metadata, "missingConfirmationIds");
      const isConfirmationEvent =
        isApplyEvent || isRestartEvent || isMaterializationEvent || isEnvironmentBindingEvent || isRuntimeReloadPlanEvent || isRuntimeReloadExecutionEvent || isRotationAcceptanceEvent;
      return {
        id: event.eventId,
        applyEventId: isRotationAcceptanceEvent
          ? auditReportLedgerMetadataText(event.metadata, "executionId")
          : isRuntimeReloadExecutionEvent
          ? auditReportLedgerMetadataText(event.metadata, "planId")
          : isRuntimeReloadPlanEvent
          ? auditReportLedgerMetadataText(event.metadata, "bindingId")
          : auditReportLedgerMetadataText(event.metadata, "applyEventId"),
        applyMode: isRotationAcceptanceEvent
          ? auditReportLedgerMetadataText(event.metadata, "acceptanceMode")
          : isRuntimeReloadExecutionEvent
          ? auditReportLedgerMetadataText(event.metadata, "executionMode")
          : isRuntimeReloadPlanEvent
          ? auditReportLedgerMetadataText(event.metadata, "reloadMode")
          : isEnvironmentBindingEvent
          ? auditReportLedgerMetadataText(event.metadata, "bindingMode")
          : isMaterializationEvent
          ? auditReportLedgerMetadataText(event.metadata, "materializationMode")
          : isRestartEvent
          ? auditReportLedgerMetadataText(event.metadata, "evidenceMode")
          : auditReportLedgerMetadataText(event.metadata, "applyMode"),
        createdAt: event.createdAt,
        confirmedConfirmationCount: confirmedConfirmationIds.length,
        confirmedConfirmationIds,
        currentKeyFingerprint: isConfirmationEvent
          ? auditReportLedgerMetadataText(event.metadata, "currentActiveKeyFingerprint")
          : auditReportLedgerMetadataText(event.metadata, "currentKeyFingerprint"),
        currentKeyId: isConfirmationEvent
          ? auditReportLedgerMetadataText(event.metadata, "currentActiveKeyId")
          : auditReportLedgerMetadataText(event.metadata, "currentKeyId"),
        detail: event.detail,
        environmentUpdateCount: environmentUpdateNames.length,
        eventKind: isEnvironmentBindingEvent
          ? "environment_binding"
          : isRotationAcceptanceEvent
          ? "rotation_acceptance"
          : isRuntimeReloadExecutionEvent
          ? "runtime_reload_execution"
          : isRuntimeReloadPlanEvent
          ? "runtime_reload_plan"
          : isMaterializationEvent
          ? "materialization"
          : isRestartEvent
          ? "restart"
          : isApplyEvent
          ? "apply"
          : "plan",
        executionMode: isRotationAcceptanceEvent || isRuntimeReloadExecutionEvent
          ? auditReportLedgerMetadataText(event.metadata, "executionMode")
          : "",
        liveTradingAllowed: auditReportLedgerMetadataBoolean(event.metadata, "liveTradingAllowed"),
        missingConfirmationCount: missingConfirmationIds.length,
        missingConfirmationIds,
        operator: auditReportLedgerMetadataText(event.metadata, "operator"),
        paperOnly: auditReportLedgerMetadataBoolean(event.metadata, "paperOnly"),
        planEventId: auditReportLedgerMetadataText(event.metadata, "planEventId"),
        proposedChainId: auditReportLedgerMetadataText(event.metadata, "proposedChainId"),
        proposedKeyId: isConfirmationEvent
          ? auditReportLedgerMetadataText(event.metadata, "proposedActiveKeyId")
          : auditReportLedgerMetadataText(event.metadata, "proposedKeyId"),
        proposedSigner: auditReportLedgerMetadataText(event.metadata, "proposedSigner"),
        reloadMode:
          isRotationAcceptanceEvent || isRuntimeReloadExecutionEvent || isRuntimeReloadPlanEvent
            ? auditReportLedgerMetadataText(event.metadata, "reloadMode")
            : "",
        requiresRestart: isConfirmationEvent
          ? auditReportLedgerMetadataBoolean(event.metadata, "restartRequired")
          : auditReportLedgerMetadataBoolean(event.metadata, "requiresRestart"),
        rotationRequired: auditReportLedgerMetadataBoolean(event.metadata, "rotationRequired"),
        secretPlaceholderCount: secretPlaceholderNames.length,
        stepCount: isConfirmationEvent ? confirmedConfirmationIds.length + missingConfirmationIds.length : stepIds.length,
        status,
        statusLabel: isRotationAcceptanceEvent
          ? status === "blocked"
            ? "Rotation acceptance blocked"
            : "Rotation acceptance recorded"
          : isRuntimeReloadExecutionEvent
          ? status === "blocked"
            ? "Runtime reload execution blocked"
            : "Runtime reload execution recorded"
          : isRuntimeReloadPlanEvent
          ? status === "blocked"
            ? "Runtime reload plan blocked"
            : "Runtime reload plan recorded"
          : isEnvironmentBindingEvent
          ? status === "blocked"
            ? "Environment binding blocked"
            : "Environment binding recorded"
          : isRestartEvent
          ? status === "blocked"
            ? "Controlled restart evidence blocked"
            : "Controlled restart evidence recorded"
          : isMaterializationEvent
          ? status === "blocked"
            ? "Secret materialization blocked"
            : "Secret materialization recorded"
          : isApplyEvent
          ? status === "blocked"
            ? "Rotation apply blocked"
            : "Rotation apply ready"
          : status === "blocked"
            ? "Rotation plan blocked"
            : "Rotation plan prepared",
        templateSha256,
        templateShortHash: isRotationAcceptanceEvent
          ? "acceptance"
          : isRuntimeReloadExecutionEvent
          ? "execution"
          : isRuntimeReloadPlanEvent
          ? "reload"
          : isEnvironmentBindingEvent
          ? "binding"
          : isMaterializationEvent
          ? "manifest"
          : isRestartEvent
          ? "restart"
          : isApplyEvent
          ? "apply"
          : isTemplateHashReady
          ? templateSha256.slice(0, 12)
          : "invalid",
        blockedReasons,
        blockedReasonLabel: blockedReasons.length ? blockedReasons.join(" / ") : "none",
        tone: status === "blocked" || (!isConfirmationEvent && !isTemplateHashReady)
          ? "risk"
          : status === "ready_for_restart" ||
              status === "evidence_recorded" ||
              status === "manifest_recorded" ||
              status === "binding_recorded" ||
              status === "plan_recorded" ||
              status === "execution_recorded" ||
              status === "acceptance_recorded"
            ? "positive"
            : "warning"
      };
    });
}

export function filterAuditSigningKeyRotationLedgerRows(
  rows: AuditSigningKeyRotationLedgerRow[],
  query: string
): AuditSigningKeyRotationLedgerRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }
  return rows.filter((row) => {
    const searchableText = [
      row.id,
      row.createdAt,
      row.currentKeyFingerprint,
      row.currentKeyId,
      row.detail,
      row.proposedChainId,
      row.proposedKeyId,
      row.proposedSigner,
      row.reloadMode,
      row.status,
      row.statusLabel,
      row.eventKind,
      row.executionMode,
      row.applyEventId,
      row.applyMode,
      row.operator,
      row.planEventId,
      row.templateSha256,
      row.templateShortHash,
      row.blockedReasonLabel,
      String(row.environmentUpdateCount),
      String(row.confirmedConfirmationCount),
      String(row.missingConfirmationCount),
      String(row.secretPlaceholderCount),
      String(row.stepCount)
    ]
      .join(" ")
      .toLowerCase();
    const searchableTokens = [...row.confirmedConfirmationIds, ...row.missingConfirmationIds].map((token) =>
      token.toLowerCase()
    );
    return searchableText.includes(normalizedQuery) || searchableTokens.some((token) => token === normalizedQuery);
  });
}

export const auditSigningKeyRotationChainStageSpecs: Array<{
  id: AuditSigningKeyRotationChainStageId;
  eventKind: AuditSigningKeyRotationLedgerEventKind;
  label: string;
}> = [
  { id: "rotation_plan", eventKind: "plan", label: "Rotation plan" },
  { id: "secret_materialization", eventKind: "materialization", label: "Secret materialization" },
  { id: "environment_binding", eventKind: "environment_binding", label: "Environment binding" },
  { id: "runtime_reload_plan", eventKind: "runtime_reload_plan", label: "Runtime reload plan" },
  { id: "runtime_reload_execution", eventKind: "runtime_reload_execution", label: "Runtime reload execution" },
  { id: "rotation_acceptance", eventKind: "rotation_acceptance", label: "Final acceptance gate" }
];
