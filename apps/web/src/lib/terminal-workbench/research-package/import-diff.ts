import { collectPaperExecutionPreparationEvidenceRunIds, formatAdapterPaperExecutionEvidenceDetail, formatPortfolioPaperOrderSimulationAdapterEvidenceDetail } from "../ai-review/evidence-builders";
import type { PaperExecutionSnapshot } from "../audit/execution-contracts";
import type { ResearchRunExportBrowserPackage, ResearchRunImportDiffRow, ResearchRunImportDiffStatus } from "../audit/report-contracts";
import { auditReportLedgerSignatureLabel, compactResearchNoteDetail, normalizedResearchNote } from "../audit/signing-key-ledger";
import type { TerminalWorkspace } from "../core/workspace-contracts";
import type { ResearchRunExportPreviewAiReviewEnvelope } from "../portfolio/paper-contracts";
import { stage4PortfolioWorkflowAuditEventsAreValid, stage4PortfolioWorkflowAuditSnapshots, stage4PortfolioWorkflowEvidenceDetail, stage5SandboxAuthorizationPreflightAuditSnapshots, stage5SandboxAuthorizationReviewAuditSnapshots, stage5SandboxReadinessDecisionAuditSnapshots, stage5SandboxReadinessHashVerifiedPackages, stage5ShadowSessionAuditSnapshots } from "../portfolio/workflow-evidence";
import { researchRunExportAuditReportImportPolicyBlockReason, researchRunExportReportSignatureDetail, researchRunExportReportSignatureImportBlockReason, researchRunExportReportSignatureImportVerificationDetail, researchRunExportReportSignatureStatus } from "./export-browser";
import { researchRunImportArtifactCountMismatches } from "./export-index";
import { formatMarketCalendarEvidenceDetail, formatPreparationEvidenceDetail } from "../strategy/backtest-builders";
import type { AiReviewDecision, AuthoritativeAiReviewRun } from "../../ai-review-stage3";

export function buildResearchRunImportDiffRows({
  aiReviewArchiveReadbackErrors = {},
  aiReviewDecisions = [],
  aiReviewRecords = [],
  authoritativeAiReviewRecords = [],
  exportPackage,
  legacyAiReviewIds = [],
  paperExecution = null,
  workspace
}: {
  workspace: TerminalWorkspace;
  exportPackage: ResearchRunExportBrowserPackage | null | undefined;
  aiReviewArchiveReadbackErrors?: Record<string, string>;
  aiReviewDecisions?: AiReviewDecision[];
  aiReviewRecords?: ResearchRunExportPreviewAiReviewEnvelope[];
  authoritativeAiReviewRecords?: AuthoritativeAiReviewRun[];
  legacyAiReviewIds?: string[];
  paperExecution?: PaperExecutionSnapshot | null;
}): ResearchRunImportDiffRow[] {
  if (!exportPackage) {
    return [
      {
        id: "run-id",
        label: "Research run",
        status: "blocked",
        current: workspace.researchRun?.runId ?? "No audited run",
        incoming: "No package selected",
        detail: "Inspect or choose a research run export package before importing.",
        exportPath: "researchRun",
        tone: "risk"
      }
    ];
  }

  const currentRun = workspace.researchRun ?? null;
  const incomingRun = exportPackage.researchRun ?? null;
  const currentNote = normalizedResearchNote(currentRun?.researchNote);
  const incomingNote = normalizedResearchNote(incomingRun?.researchNote);
  const currentPreparationEvidence = currentRun?.dataSnapshot?.preparationEvidence ?? null;
  const incomingPreparationEvidence = incomingRun?.dataSnapshot?.preparationEvidence ?? null;
  const currentMarketCalendar = currentRun?.dataSnapshot?.marketCalendar ?? null;
  const incomingMarketCalendar = incomingRun?.dataSnapshot?.marketCalendar ?? null;
  const currentMarketCalendarDetail = currentMarketCalendar
    ? formatMarketCalendarEvidenceDetail(currentMarketCalendar)
    : "No market calendar evidence";
  const incomingMarketCalendarDetail = incomingMarketCalendar
    ? formatMarketCalendarEvidenceDetail(incomingMarketCalendar)
    : "No package market calendar evidence";
  const marketCalendarStatus: ResearchRunImportDiffStatus =
    currentMarketCalendar && incomingMarketCalendar
      ? currentMarketCalendarDetail === incomingMarketCalendarDetail
        ? "same"
        : "change"
      : incomingMarketCalendar
        ? "add"
        : currentMarketCalendar
          ? "change"
          : "same";
  const currentPreparationEvidenceDetail = currentPreparationEvidence
    ? formatPreparationEvidenceDetail(currentPreparationEvidence)
    : "No locked preparation evidence";
  const incomingPreparationEvidenceDetail = incomingPreparationEvidence
    ? formatPreparationEvidenceDetail(incomingPreparationEvidence)
    : "No package preparation evidence";
  const preparationEvidenceStatus: ResearchRunImportDiffStatus =
    currentPreparationEvidence && incomingPreparationEvidence
      ? currentPreparationEvidenceDetail === incomingPreparationEvidenceDetail
        ? "same"
        : "change"
      : incomingPreparationEvidence
        ? "add"
        : currentPreparationEvidence
          ? "change"
          : "same";
  const integrityHash = exportPackage.integrity?.hash ?? "";
  const integrityIsReady =
    exportPackage.integrity?.algorithm === "sha256" && /^[a-f0-9]{64}$/iu.test(integrityHash);
  const packageAiReviewCount = exportPackage.aiReviewRuns?.length ?? 0;
  const packageAuthoritativeAiReviewCount = exportPackage.aiReviewRunsV2?.length ?? 0;
  const packageAiReviewDecisionCount = exportPackage.aiReviewDecisions?.length ?? 0;
  const manifestAiReviewCount = exportPackage.manifest.artifactCounts.aiReviewRuns ?? 0;
  const packageAuditEventCount = exportPackage.auditEvents?.length ?? 0;
  const packageStage4PortfolioWorkflows = stage4PortfolioWorkflowAuditSnapshots(exportPackage.auditEvents);
  const packageStage4PortfolioWorkflowsAreValid = stage4PortfolioWorkflowAuditEventsAreValid(exportPackage.auditEvents);
  const packageStage5ShadowSessions = stage5ShadowSessionAuditSnapshots(exportPackage.auditEvents);
  const packageStage5ShadowSessionEventCount = (exportPackage.auditEvents ?? [])
    .filter((event) => event.eventType === "stage5_shadow_execution_session").length;
  const packageStage5ShadowSessionsAreValid =
    packageStage5ShadowSessions.length === packageStage5ShadowSessionEventCount;
  const packageStage5ShadowSessionCountMatches =
    (exportPackage.manifest.artifactCounts.stage5ShadowSessions ?? 0) === packageStage5ShadowSessions.length;
  const packageStage5SandboxReadinessDecisions =
    stage5SandboxReadinessDecisionAuditSnapshots(exportPackage.auditEvents);
  const packageStage5SandboxReadinessDecisionEventCount = (exportPackage.auditEvents ?? [])
    .filter((event) => event.eventType === "stage5_sandbox_readiness_decision").length;
  const packageStage5SandboxReadinessDecisionsAreValid =
    packageStage5SandboxReadinessDecisions.length === packageStage5SandboxReadinessDecisionEventCount &&
    stage5SandboxReadinessHashVerifiedPackages.has(exportPackage);
  const packageStage5SandboxReadinessDecisionCountMatches =
    (exportPackage.manifest.artifactCounts.stage5SandboxReadinessDecisions ?? 0) ===
    packageStage5SandboxReadinessDecisions.length;
  const packageStage5SandboxAuthorizationPreflights =
    stage5SandboxAuthorizationPreflightAuditSnapshots(exportPackage.auditEvents);
  const packageStage5SandboxAuthorizationPreflightEventCount = (exportPackage.auditEvents ?? [])
    .filter((event) => event.eventType === "stage5_sandbox_authorization_preflight").length;
  const packageStage5SandboxAuthorizationPreflightsAreValid =
    packageStage5SandboxAuthorizationPreflights.length === packageStage5SandboxAuthorizationPreflightEventCount &&
    stage5SandboxReadinessHashVerifiedPackages.has(exportPackage);
  const packageStage5SandboxAuthorizationPreflightCountMatches =
    (exportPackage.manifest.artifactCounts.stage5SandboxAuthorizationPreflights ?? 0) ===
    packageStage5SandboxAuthorizationPreflights.length;
  const packageStage5SandboxAuthorizationReviews =
    stage5SandboxAuthorizationReviewAuditSnapshots(exportPackage.auditEvents);
  const packageStage5SandboxAuthorizationReviewEventCount = (exportPackage.auditEvents ?? [])
    .filter((event) => event.eventType === "stage5_sandbox_authorization_review").length;
  const packageStage5SandboxAuthorizationReviewsAreValid =
    packageStage5SandboxAuthorizationReviews.length === packageStage5SandboxAuthorizationReviewEventCount &&
    stage5SandboxReadinessHashVerifiedPackages.has(exportPackage);
  const packageStage5SandboxAuthorizationReviewCountMatches =
    (exportPackage.manifest.artifactCounts.stage5SandboxAuthorizationReviews ?? 0) ===
    packageStage5SandboxAuthorizationReviews.length;
  const packageHandoffNoteCount = exportPackage.handoffNotes?.length ?? 0;
  const currentAiReviewCount = currentRun
    ? aiReviewRecords.filter((record) => record.runId === currentRun.runId).length
    : 0;
  const authoritativeAiReviewById = new Map(
    authoritativeAiReviewRecords.map((review) => [review.aiReviewId, review])
  );
  const legacyAiReviewIdSet = new Set(legacyAiReviewIds);
  const packagePaperCount = exportPackage.paperExecutions?.length ?? 0;
  const packagePaperPreparationEvidenceRunIds = collectPaperExecutionPreparationEvidenceRunIds(exportPackage.paperExecutions);
  const packageAdapterPaperExecutionCount = exportPackage.adapterPaperExecutions?.length ?? 0;
  const packageAdapterPaperExecutionDetail = formatAdapterPaperExecutionEvidenceDetail(
    exportPackage.adapterPaperExecutions
  );
  const packagePortfolioPaperOrderCount = exportPackage.portfolioPaperOrderBatches?.length ?? 0;
  const packagePortfolioPaperOrderApprovalCount = exportPackage.portfolioPaperOrderApprovals?.length ?? 0;
  const packagePortfolioPaperOrderSimulationCount = exportPackage.portfolioPaperOrderSimulations?.length ?? 0;
  const packagePortfolioPaperOrderHasLedger =
    packagePortfolioPaperOrderCount + packagePortfolioPaperOrderApprovalCount + packagePortfolioPaperOrderSimulationCount >
    0;
  const packagePortfolioPaperOrderSimulationAdapterEvidenceDetail =
    formatPortfolioPaperOrderSimulationAdapterEvidenceDetail(exportPackage.portfolioPaperOrderSimulations);
  const currentPaperCount = currentRun && paperExecution?.runId === currentRun.runId ? 1 : 0;
  const auditSummary = exportPackage.auditEvidenceSummary;
  const auditSummaryMatchesPackage = auditSummary?.runId === exportPackage.manifest.runId;
  const auditReport = exportPackage.auditReport;
  const auditReportHash = auditReport?.contentSha256.hash ?? "";
  const auditReportMatchesPackage =
    auditReport?.runId === exportPackage.manifest.runId &&
    auditReport.evidenceSummary?.runId === exportPackage.manifest.runId &&
    auditReport.contentSha256.algorithm === "sha256" &&
    /^[a-f0-9]{64}$/iu.test(auditReportHash) &&
    auditReport.contentMarkdown.trim() !== "";
  const auditReportSignatureDetail = researchRunExportReportSignatureDetail(auditReport?.signature);
  const auditReportSignatureImportVerificationDetail = researchRunExportReportSignatureImportVerificationDetail(
    auditReport?.signature
  );
  const auditReportSignatureStatus = researchRunExportReportSignatureStatus(auditReport?.signature);
  const auditReportSignatureImportBlockReason = researchRunExportReportSignatureImportBlockReason(
    auditReport?.signature,
    "Audit report"
  );
  const auditReportImportPolicyBlockReason = researchRunExportAuditReportImportPolicyBlockReason(auditReport);
  const auditReportImportBlockReason = auditReportSignatureImportBlockReason || auditReportImportPolicyBlockReason;
  const auditReportSignatureIsImportable = auditReportImportBlockReason === "";
  const auditReportSignatureLabel = auditReportSignatureDetail
    ? auditReportLedgerSignatureLabel(auditReportSignatureStatus)
    : "";
  const backtestReport = exportPackage.backtestReport;
  const backtestReportHash = backtestReport?.contentSha256.hash ?? "";
  const backtestReportMatchesPackage =
    backtestReport?.runId === exportPackage.manifest.runId &&
    backtestReport.market === exportPackage.manifest.market &&
    backtestReport.symbol === exportPackage.manifest.symbol &&
    backtestReport.timeframe === exportPackage.manifest.timeframe &&
    backtestReport.strategyRevision === exportPackage.manifest.strategyRevision &&
    backtestReport.contentSha256.algorithm === "sha256" &&
    /^[a-f0-9]{64}$/iu.test(backtestReportHash) &&
    backtestReport.contentMarkdown.trim() !== "";
  const backtestReportSignatureDetail = researchRunExportReportSignatureDetail(backtestReport?.signature);
  const backtestReportSignatureImportVerificationDetail = researchRunExportReportSignatureImportVerificationDetail(
    backtestReport?.signature
  );
  const backtestReportSignatureStatus = researchRunExportReportSignatureStatus(backtestReport?.signature);
  const backtestReportSignatureImportBlockReason = researchRunExportReportSignatureImportBlockReason(
    backtestReport?.signature,
    "Backtest report"
  );
  const backtestReportSignatureIsImportable = backtestReportSignatureImportBlockReason === "";
  const backtestReportSignatureLabel = backtestReportSignatureDetail
    ? auditReportLedgerSignatureLabel(backtestReportSignatureStatus)
    : "";
  const artifactCountMismatches = researchRunImportArtifactCountMismatches(exportPackage, {
    aiReviewRuns: packageAiReviewCount,
    aiReviewRunsV2: packageAuthoritativeAiReviewCount,
    aiReviewDecisions: packageAiReviewDecisionCount,
    adapterPaperExecutions: packageAdapterPaperExecutionCount,
    paperExecutions: packagePaperCount,
    portfolioPaperOrderApprovals: packagePortfolioPaperOrderApprovalCount,
    portfolioPaperOrderBatches: packagePortfolioPaperOrderCount,
    portfolioPaperOrderSimulations: packagePortfolioPaperOrderSimulationCount,
    promotionCandidates: exportPackage.promotionCandidate ? 1 : 0,
    researchNotes: incomingNote ? 1 : 0,
    auditEvents: packageAuditEventCount,
    stage4PortfolioWorkflows: packageStage4PortfolioWorkflows.length,
    stage5ShadowSessions: packageStage5ShadowSessions.length,
    stage5SandboxReadinessDecisions: packageStage5SandboxReadinessDecisions.length,
    stage5SandboxAuthorizationPreflights: packageStage5SandboxAuthorizationPreflights.length,
    stage5SandboxAuthorizationReviews: packageStage5SandboxAuthorizationReviews.length,
    handoffNotes: packageHandoffNoteCount
  });
  const authoritativeAiReviewDiffRows = (exportPackage.aiReviewRunsV2 ?? []).map(
    (envelope, index): ResearchRunImportDiffRow => {
      const incoming = envelope.record;
      const current = authoritativeAiReviewById.get(incoming.aiReviewId);
      const readbackError = aiReviewArchiveReadbackErrors["review:" + incoming.aiReviewId];
      const authorityConflict = legacyAiReviewIdSet.has(incoming.aiReviewId);
      const sameHash = current?.recordHash === incoming.recordHash;
      return {
        id: ("ai-review-run-v2:" + index) as ResearchRunImportDiffRow["id"],
        label: "Authoritative Review · " + incoming.aiReviewId,
        status: readbackError || authorityConflict || (current && !sameHash) ? "blocked" : current ? "same" : "add",
        current: readbackError
          ? "Persistent readback unavailable"
          : authorityConflict
            ? "Legacy authority owns this Review ID"
            : current
              ? "authoritative · " + current.recordHash
              : "No authoritative Review",
        incoming: "authoritative · " + incoming.recordHash,
        detail: readbackError
          ? "Authoritative Review readback unavailable; import is blocked fail-closed."
          : authorityConflict
            ? "Authority conflict: a legacy Review already owns this Review ID."
            : current
              ? sameHash
                ? "Authoritative Review ID and recordHash are same-hash."
                : "Authoritative Review ID conflict: recordHash differs from persisted evidence."
              : "Authoritative Review is new and will be added.",
        exportPath: "aiReviewRunsV2[" + index + "].record",
        tone: readbackError || authorityConflict || (current && !sameHash) ? "risk" : current ? "positive" : "ai"
      };
    }
  );
  const incomingDecisionsByReview = new Map<
    string,
    Array<{ envelope: NonNullable<ResearchRunExportBrowserPackage["aiReviewDecisions"]>[number]; index: number }>
  >();
  (exportPackage.aiReviewDecisions ?? []).forEach((envelope, index) => {
    incomingDecisionsByReview.set(
      envelope.aiReviewId,
      [...(incomingDecisionsByReview.get(envelope.aiReviewId) ?? []), { envelope, index }]
    );
  });
  const aiReviewDecisionDiffRows = [...incomingDecisionsByReview.entries()].flatMap(
    ([aiReviewId, incomingItems]): ResearchRunImportDiffRow[] => {
      const existing = aiReviewDecisions.filter((decision) => decision.aiReviewId === aiReviewId);
      const incoming = incomingItems.map((item) => item.envelope.record);
      const readbackError = aiReviewArchiveReadbackErrors["decisions:" + aiReviewId];
      const overlap = Math.min(existing.length, incoming.length);
      let divergenceIndex = -1;
      for (let index = 0; index < overlap; index += 1) {
        if (existing[index].decisionId !== incoming[index].decisionId
          || existing[index].recordHash !== incoming[index].recordHash) {
          divergenceIndex = index;
          break;
        }
      }
      const appendIndex = existing.length;
      const expectedPredecessor = existing.at(-1)?.decisionId ?? null;
      const appendPredecessorConflict =
        divergenceIndex < 0
        && incoming.length > existing.length
        && incoming[appendIndex].supersedesDecisionId !== expectedPredecessor;
      const incomingIsPersistedPrefix = divergenceIndex < 0 && incoming.length < existing.length;
      return incomingItems.map(({ envelope, index }, chainIndex) => {
        const archived = envelope.record;
        const current = existing[chainIndex];
        const diverged = divergenceIndex >= 0 && chainIndex >= divergenceIndex;
        const appendBlocked = appendPredecessorConflict && chainIndex >= appendIndex;
        const blocked = Boolean(readbackError) || diverged || appendBlocked;
        const same = !blocked && chainIndex < existing.length;
        let detail: string;
        if (readbackError) {
          detail = "Decision readback unavailable; import is blocked fail-closed.";
        } else if (diverged) {
          detail = chainIndex === divergenceIndex && current?.decisionId === archived.decisionId
            ? "Decision ID recordHash conflict: archived evidence differs from the persisted prefix."
            : "Decision chain fork: incoming Decision does not match the persisted ordered prefix.";
        } else if (appendBlocked) {
          detail = "Decision append conflict: supersedesDecisionId does not extend the persisted prefix.";
        } else if (same) {
          detail = incomingIsPersistedPrefix
            ? "Incoming Decision chain is a persisted prefix; import preserves later Decisions."
            : "Decision ID and recordHash are same-hash in the persisted prefix.";
        } else {
          detail = "Decision extends the persisted prefix and will append.";
        }
        return {
          id: ("ai-review-decision:" + index) as ResearchRunImportDiffRow["id"],
          label: "Decision · " + archived.decisionId,
          status: blocked ? "blocked" : same ? "same" : "add",
          current: readbackError
            ? "Persistent readback unavailable"
            : current
              ? current.recordHash
              : "No Decision",
          incoming: archived.recordHash,
          detail,
          exportPath: "aiReviewDecisions[" + index + "].record",
          tone: blocked ? "risk" : same ? "positive" : "ai"
        };
      });
    }
  );

  return [
    {
      id: "package-integrity",
      label: "Package integrity",
      status: integrityIsReady ? "same" : "blocked",
      current: "Local verification required",
      incoming: exportPackage.integrity
        ? `${exportPackage.integrity.algorithm} · ${integrityIsReady ? integrityHash.slice(0, 8) : "invalid"}`
        : "No integrity hash",
      detail: integrityIsReady
        ? "Canonical SHA-256 metadata is present before import."
        : "Import must stop until the package has valid canonical SHA-256 metadata.",
      exportPath: "integrity.hash",
      tone: integrityIsReady ? "positive" : "risk"
    },
    {
      id: "artifact-counts",
      label: "Artifact counts",
      status: artifactCountMismatches.length ? "blocked" : "same",
      current: "Manifest versus package payload",
      incoming: artifactCountMismatches.length ? `${artifactCountMismatches.length} mismatch` : "Counts match",
      detail: artifactCountMismatches.length
        ? artifactCountMismatches.join(" · ")
        : "Manifest artifact counts match the package payloads that will be restored.",
      exportPath: "manifest.artifactCounts",
      tone: artifactCountMismatches.length ? "risk" : "positive"
    },
    {
      id: "run-id",
      label: "Research run",
      status: currentRun ? (currentRun.runId === exportPackage.manifest.runId ? "same" : "replace") : "add",
      current: currentRun?.runId ?? "No audited run",
      incoming: exportPackage.manifest.runId,
      detail: currentRun
        ? currentRun.runId === exportPackage.manifest.runId
          ? "Import will refresh the existing audited run payload."
          : "Import will replace the current replay context with the package run."
        : "Import will add an audited run to the local workspace.",
      exportPath: "researchRun.runId",
      tone: currentRun?.runId === exportPackage.manifest.runId ? "positive" : "warning"
    },
    {
      id: "context",
      label: "Market / symbol",
      status:
        workspace.selectedInstrument.market === exportPackage.manifest.market &&
        workspace.selectedInstrument.symbol === exportPackage.manifest.symbol
          ? "same"
          : "change",
      current: `${workspace.selectedInstrument.market} · ${workspace.selectedInstrument.symbol}`,
      incoming: `${exportPackage.manifest.market} · ${exportPackage.manifest.symbol}`,
      detail: "Import will bind the terminal to the package market and symbol.",
      exportPath: "manifest.market",
      tone:
        workspace.selectedInstrument.market === exportPackage.manifest.market &&
        workspace.selectedInstrument.symbol === exportPackage.manifest.symbol
          ? "positive"
          : "warning"
    },
    {
      id: "timeframe",
      label: "Timeframe",
      status: workspace.selectedTimeframe === exportPackage.manifest.timeframe ? "same" : "change",
      current: workspace.selectedTimeframe,
      incoming: exportPackage.manifest.timeframe,
      detail:
        workspace.selectedTimeframe === exportPackage.manifest.timeframe
          ? "Current research context already matches the package timeframe."
          : "Current research context will switch to the package timeframe.",
      exportPath: "manifest.timeframe",
      tone: workspace.selectedTimeframe === exportPackage.manifest.timeframe ? "positive" : "warning"
    },
    {
      id: "data-snapshot",
      label: "Data snapshot",
      status:
        currentRun?.dataSnapshot?.hash && currentRun.dataSnapshot.hash === exportPackage.manifest.dataHash
          ? "same"
          : currentRun?.dataSnapshot
            ? "change"
            : "add",
      current: currentRun?.dataSnapshot
        ? `${currentRun.dataSnapshot.rows} rows · ${currentRun.dataSnapshot.hash || "missing hash"}`
        : "No data snapshot",
      incoming: `${exportPackage.manifest.dataRows} rows · ${exportPackage.manifest.dataHash || "missing hash"}`,
      detail: "Import will replay the package data hash and row count as the audited snapshot.",
      exportPath: "researchRun.dataSnapshot",
      tone:
        currentRun?.dataSnapshot?.hash && currentRun.dataSnapshot.hash === exportPackage.manifest.dataHash
          ? "positive"
          : "warning"
    },
    {
      id: "market-calendar",
      label: "Market calendar",
      status: marketCalendarStatus,
      current: currentMarketCalendarDetail,
      incoming: incomingMarketCalendarDetail,
      detail: incomingMarketCalendar
        ? marketCalendarStatus === "same"
          ? "Market calendar evidence already matches the package snapshot."
          : currentMarketCalendar
            ? "Import will replace market calendar evidence used to review the audited snapshot."
            : "Import will add market calendar evidence for the audited snapshot."
        : currentMarketCalendar
          ? "Package does not include market calendar evidence; import will replace the current replay context without it."
          : "Neither current workspace nor package includes market calendar evidence.",
      exportPath: "researchRun.dataSnapshot.marketCalendar",
      tone: marketCalendarStatus === "same" ? (incomingMarketCalendar ? "positive" : "neutral") : "warning"
    },
    {
      id: "preparation-evidence",
      label: "Preparation evidence",
      status: preparationEvidenceStatus,
      current: currentPreparationEvidenceDetail,
      incoming: incomingPreparationEvidenceDetail,
      detail: incomingPreparationEvidence
        ? preparationEvidenceStatus === "same"
          ? "Locked data preparation evidence already matches the package snapshot."
          : currentPreparationEvidence
            ? "Import will replace locked data preparation evidence used to build the audited snapshot."
            : "Import will add locked data preparation evidence for the audited snapshot."
        : currentPreparationEvidence
          ? "Package does not include locked preparation evidence; import will replace the current replay context without it."
          : "Neither current workspace nor package includes locked preparation evidence.",
      exportPath: "researchRun.dataSnapshot.preparationEvidence",
      tone: preparationEvidenceStatus === "same" ? (incomingPreparationEvidence ? "positive" : "neutral") : "warning"
    },
    {
      id: "strategy-revision",
      label: "Strategy revision",
      status:
        currentRun?.strategyRevision && currentRun.strategyRevision === exportPackage.manifest.strategyRevision
          ? "same"
          : currentRun?.strategyRevision
            ? "change"
            : "add",
      current: currentRun?.strategyRevision ?? "No audited strategy",
      incoming: exportPackage.manifest.strategyRevision,
      detail: "Import will restore the package strategy revision as an audited Strategy Lab version.",
      exportPath: "researchRun.strategyConfig.revision",
      tone:
        currentRun?.strategyRevision && currentRun.strategyRevision === exportPackage.manifest.strategyRevision
          ? "positive"
          : "warning"
    },
    {
      id: "research-note",
      label: "Research note",
      status: incomingNote
        ? currentNote?.body === incomingNote.body
          ? "same"
          : currentNote
            ? "change"
            : "add"
        : "same",
      current: currentNote ? compactResearchNoteDetail(currentNote.body) : "No local note",
      incoming: incomingNote ? compactResearchNoteDetail(incomingNote.body) : "No package note",
      detail: incomingNote
        ? "Import will write the package research note back to the local note store."
        : "Package does not include a locked research note.",
      exportPath: "researchRun.researchNote",
      tone: incomingNote && currentNote?.body !== incomingNote.body ? "warning" : "neutral"
    },
    {
      id: "handoff-notes",
      label: "Handoff notes",
      status: packageHandoffNoteCount > 0 ? "add" : "same",
      current: "Local handoff store",
      incoming: `${packageHandoffNoteCount} saved / ${exportPackage.manifest.artifactCounts.handoffNotes ?? 0} manifest`,
      detail:
        packageHandoffNoteCount > 0
          ? "Import will restore local team handoff notes attached to the package run."
          : "Package does not include local team handoff notes.",
      exportPath: "handoffNotes[]",
      tone: packageHandoffNoteCount > 0 ? "warning" : "neutral"
    },
    {
      id: "paper-executions",
      label: "Paper executions",
      status: packagePaperCount > currentPaperCount ? "add" : packagePaperCount === currentPaperCount ? "same" : "change",
      current: `${currentPaperCount} saved`,
      incoming: `${packagePaperCount} saved / ${exportPackage.manifest.artifactCounts.paperExecutions ?? 0} manifest`,
      detail: [
        "Import will restore paper execution records attached to the package run",
        ...(packagePaperPreparationEvidenceRunIds.length
          ? [`prep ${packagePaperPreparationEvidenceRunIds.join(", ")}`]
          : [])
      ].join(" · "),
      exportPath: "paperExecutions[]",
      tone: packagePaperCount > 0 ? "warning" : "neutral"
    },
    {
      id: "adapter-paper-executions",
      label: "Adapter paper executions",
      status: packageAdapterPaperExecutionCount > 0 ? "add" : "same",
      current: "0 saved",
      incoming: `${packageAdapterPaperExecutionCount} saved / ${
        exportPackage.manifest.artifactCounts.adapterPaperExecutions ?? 0
      } manifest`,
      detail:
        packageAdapterPaperExecutionCount > 0
          ? `Import will preserve adapter paper execution evidence: ${packageAdapterPaperExecutionDetail}`
          : "Package does not include adapter paper execution evidence.",
      exportPath: "adapterPaperExecutions[]",
      tone: packageAdapterPaperExecutionCount > 0 ? "warning" : "neutral"
    },
    {
      id: "portfolio-paper-orders",
      label: "Portfolio paper orders",
      status: packagePortfolioPaperOrderHasLedger ? "add" : "same",
      current: "Not loaded in current preview",
      incoming: `${packagePortfolioPaperOrderCount} batches / ${packagePortfolioPaperOrderApprovalCount} approvals / ${packagePortfolioPaperOrderSimulationCount} fills`,
      detail: [
        "Import will restore Portfolio paper order ledger bound to the package run.",
        packagePortfolioPaperOrderSimulationAdapterEvidenceDetail
      ]
        .filter(Boolean)
        .join(" "),
      exportPath: "portfolioPaperOrderBatches[] portfolioPaperOrderApprovals[] portfolioPaperOrderSimulations[]",
      tone: packagePortfolioPaperOrderHasLedger ? "warning" : "neutral"
    },
    ...((exportPackage.manifest.artifactCounts.stage4PortfolioWorkflows ?? 0) > 0 || packageStage4PortfolioWorkflows.length
      ? ([{
          id: "stage4-portfolio-workflows",
          label: "Stage 4 portfolio workflows",
          status: packageStage4PortfolioWorkflowsAreValid
            ? packageStage4PortfolioWorkflows.length ? "add" : "same"
            : "blocked",
          current: "Local audit event store",
          incoming: packageStage4PortfolioWorkflows.length
            ? packageStage4PortfolioWorkflows.map(stage4PortfolioWorkflowEvidenceDetail).join(" · ")
            : "No Stage 4 workflow",
          detail: !packageStage4PortfolioWorkflowsAreValid
            ? "Stage 4 workflow import is blocked by invalid bindings or an unsafe paper-only boundary."
            : packageStage4PortfolioWorkflows.length
            ? "Import will restore authoritative Stage 4 workflow evidence through auditEvents[]."
            : "Package does not include Stage 4 workflow evidence.",
          exportPath: "auditEvents[].metadata.snapshot",
          tone: packageStage4PortfolioWorkflows.length ? "ai" : "neutral"
        }] satisfies ResearchRunImportDiffRow[])
      : []),
    ...((exportPackage.manifest.artifactCounts.stage5ShadowSessions ?? 0) > 0 || packageStage5ShadowSessionEventCount > 0
      ? ([{
          id: "stage5-shadow-sessions",
          label: "Stage 5 shadow sessions",
          status: packageStage5ShadowSessionsAreValid && packageStage5ShadowSessionCountMatches
            ? packageStage5ShadowSessions.length ? "add" : "same"
            : "blocked",
          current: "Local audit event store",
          incoming: `${packageStage5ShadowSessions.length} sessions / ${exportPackage.manifest.artifactCounts.stage5ShadowSessions ?? 0} manifest`,
          detail: packageStage5ShadowSessionsAreValid && packageStage5ShadowSessionCountMatches
            ? "Import will restore Stage 5 shadow attempts with stable clientOrderId, reconciliation, and blocked live boundaries."
            : "Stage 5 shadow import is blocked by an artifact count mismatch or invalid identity, time, or safety evidence.",
          exportPath: "auditEvents[].metadata.snapshot",
          tone: packageStage5ShadowSessionsAreValid && packageStage5ShadowSessionCountMatches && packageStage5ShadowSessions.length
            ? "ai"
            : packageStage5ShadowSessionsAreValid && packageStage5ShadowSessionCountMatches ? "neutral" : "risk"
        }] satisfies ResearchRunImportDiffRow[])
      : []),
    ...((exportPackage.manifest.artifactCounts.stage5SandboxReadinessDecisions ?? 0) > 0 ||
      packageStage5SandboxReadinessDecisionEventCount > 0
      ? ([{
          id: "stage5-sandbox-readiness-decisions",
          label: "Stage 5 sandbox readiness decisions",
          status: packageStage5SandboxReadinessDecisionsAreValid && packageStage5SandboxReadinessDecisionCountMatches
            ? packageStage5SandboxReadinessDecisions.length ? "add" : "same"
            : "blocked",
          current: "Local audit event store",
          incoming: `${packageStage5SandboxReadinessDecisions.length} decisions / ${exportPackage.manifest.artifactCounts.stage5SandboxReadinessDecisions ?? 0} manifest`,
          detail: packageStage5SandboxReadinessDecisionsAreValid && packageStage5SandboxReadinessDecisionCountMatches
            ? "Import will restore server-authoritative sandbox readiness decisions while order submission remains blocked."
            : "Stage 5 sandbox readiness import is blocked by an artifact count mismatch or invalid identity, time, or safety evidence.",
          exportPath: "auditEvents[].metadata.snapshot",
          tone: packageStage5SandboxReadinessDecisionsAreValid && packageStage5SandboxReadinessDecisionCountMatches &&
            packageStage5SandboxReadinessDecisions.length ? "ai" :
            packageStage5SandboxReadinessDecisionsAreValid && packageStage5SandboxReadinessDecisionCountMatches
              ? "neutral" : "risk"
        }] satisfies ResearchRunImportDiffRow[])
      : []),
    ...((exportPackage.manifest.artifactCounts.stage5SandboxAuthorizationPreflights ?? 0) > 0 ||
      packageStage5SandboxAuthorizationPreflightEventCount > 0
      ? ([{
          id: "stage5-sandbox-authorization-preflights",
          label: "Stage 5 sandbox authorization preflights",
          status: packageStage5SandboxAuthorizationPreflightsAreValid &&
            packageStage5SandboxAuthorizationPreflightCountMatches
            ? packageStage5SandboxAuthorizationPreflights.length ? "add" : "same"
            : "blocked",
          current: "Local audit event store",
          incoming: `${packageStage5SandboxAuthorizationPreflights.length} preflights / ${exportPackage.manifest.artifactCounts.stage5SandboxAuthorizationPreflights ?? 0} manifest`,
          detail: packageStage5SandboxAuthorizationPreflightsAreValid &&
            packageStage5SandboxAuthorizationPreflightCountMatches
            ? "Import will restore server-authoritative sandbox authorization preflights while human authorization and all order routes remain blocked."
            : "Stage 5 sandbox authorization preflight import is blocked by an artifact count mismatch or invalid identity, hash, or safety evidence.",
          exportPath: "auditEvents[].metadata.snapshot",
          tone: packageStage5SandboxAuthorizationPreflightsAreValid &&
            packageStage5SandboxAuthorizationPreflightCountMatches &&
            packageStage5SandboxAuthorizationPreflights.length ? "ai" :
            packageStage5SandboxAuthorizationPreflightsAreValid &&
            packageStage5SandboxAuthorizationPreflightCountMatches ? "neutral" : "risk"
        }] satisfies ResearchRunImportDiffRow[])
      : []),
    ...((exportPackage.manifest.artifactCounts.stage5SandboxAuthorizationReviews ?? 0) > 0 ||
      packageStage5SandboxAuthorizationReviewEventCount > 0
      ? ([{
          id: "stage5-sandbox-authorization-reviews",
          label: "Stage 5 sandbox authorization reviews",
          status: packageStage5SandboxAuthorizationReviewsAreValid &&
            packageStage5SandboxAuthorizationReviewCountMatches
            ? packageStage5SandboxAuthorizationReviews.length ? "add" : "same"
            : "blocked",
          current: "Local audit event store",
          incoming: `${packageStage5SandboxAuthorizationReviews.length} reviews / ${exportPackage.manifest.artifactCounts.stage5SandboxAuthorizationReviews ?? 0} manifest`,
          detail: packageStage5SandboxAuthorizationReviewsAreValid &&
            packageStage5SandboxAuthorizationReviewCountMatches
            ? "Import will restore immutable sandbox authorization reviews while authorization remains ineffective and all order routes stay blocked."
            : "Stage 5 sandbox authorization review import is blocked by an artifact count mismatch or invalid identity, hash, or safety evidence.",
          exportPath: "auditEvents[].metadata.snapshot",
          tone: packageStage5SandboxAuthorizationReviewsAreValid &&
            packageStage5SandboxAuthorizationReviewCountMatches &&
            packageStage5SandboxAuthorizationReviews.length ? "ai" :
            packageStage5SandboxAuthorizationReviewsAreValid &&
            packageStage5SandboxAuthorizationReviewCountMatches ? "neutral" : "risk"
        }] satisfies ResearchRunImportDiffRow[])
      : []),
    {
      id: "ai-review-runs",
      label: "AI review runs",
      status: packageAiReviewCount > currentAiReviewCount ? "add" : packageAiReviewCount === currentAiReviewCount ? "same" : "change",
      current: `${currentAiReviewCount} saved`,
      incoming: `${packageAiReviewCount} saved / ${manifestAiReviewCount} manifest`,
      detail: "Import will restore saved AI review records and their evidence anchors.",
      exportPath: "aiReviewRuns[]",
      tone: packageAiReviewCount > 0 ? "ai" : "neutral"
    },
    ...authoritativeAiReviewDiffRows,
    ...aiReviewDecisionDiffRows,
    ...(auditSummary
      ? ([
          {
            id: "audit-summary",
            label: "Audit evidence summary",
            status: auditSummaryMatchesPackage ? "add" : "blocked",
            current: "No local package summary",
            incoming: `${auditSummary.runId} · ${auditSummary.focusQuery || auditSummary.packageQuery || "no focus"}`,
            detail: auditSummaryMatchesPackage
              ? `Audit focus carries ${auditSummary.package.matched}/${auditSummary.package.total} package matches and ${auditSummary.importDiff.blocked} import diff blockers.`
              : "Audit evidence summary run id does not match the import package manifest.",
            exportPath: "auditEvidenceSummary",
            tone: auditSummaryMatchesPackage ? "ai" : "risk"
          }
        ] satisfies ResearchRunImportDiffRow[])
      : []),
    ...(auditReport
      ? ([
          {
            id: "audit-report",
            label: "Audit report",
            status: auditReportMatchesPackage && auditReportSignatureIsImportable ? "add" : "blocked",
            current: "No local audit report",
            incoming: [
              `${auditReport.runId} · ${auditReport.contentSha256.algorithm} ${auditReportHash.slice(0, 8)} · ${
                auditReport.fileName
              }`,
              auditReportSignatureLabel
            ]
              .filter(Boolean)
              .join(" · "),
            detail: auditReportMatchesPackage
              ? [
                   auditReportSignatureIsImportable
                     ? "Package includes a portable Audit Markdown report bound to this manifest."
                     : auditReportImportBlockReason,
                   auditReportSignatureDetail,
                   auditReportSignatureImportVerificationDetail
                 ]
                  .filter(Boolean)
                  .join(" · ")
              : "Audit report artifact does not match the import package manifest or content hash.",
            exportPath: "auditReport.contentSha256.hash",
            tone: auditReportMatchesPackage && auditReportSignatureIsImportable ? "ai" : "risk"
          }
        ] satisfies ResearchRunImportDiffRow[])
      : []),
    ...(backtestReport
      ? ([
          {
            id: "backtest-report",
            label: "Backtest report",
            status: backtestReportMatchesPackage && backtestReportSignatureIsImportable ? "add" : "blocked",
            current: "No local backtest report",
            incoming: [
              `${backtestReport.runId} · ${backtestReport.contentSha256.algorithm} ${backtestReportHash.slice(
                0,
                8
              )} · ${backtestReport.runComparisonRows} comparisons`,
              backtestReportSignatureLabel
            ]
              .filter(Boolean)
              .join(" · "),
            detail: backtestReportMatchesPackage
              ? [
                   backtestReportSignatureIsImportable
                     ? "Package includes a portable Backtest Markdown report bound to this manifest."
                     : backtestReportSignatureImportBlockReason,
                   backtestReportSignatureDetail,
                   backtestReportSignatureImportVerificationDetail
                 ]
                  .filter(Boolean)
                  .join(" · ")
              : "Backtest report artifact does not match the import package manifest or content hash.",
            exportPath: "backtestReport.contentSha256.hash",
            tone: backtestReportMatchesPackage && backtestReportSignatureIsImportable ? "ai" : "risk"
          }
        ] satisfies ResearchRunImportDiffRow[])
      : []),
    {
      id: "live-boundary",
      label: "Live boundary",
      status: exportPackage.manifest.liveTradingAllowed || exportPackage.executionHandoff.liveTradingAllowed ? "blocked" : "same",
      current: workspace.execution.liveEnabled ? "Local live enabled" : "Local paper boundary",
      incoming:
        exportPackage.manifest.liveTradingAllowed || exportPackage.executionHandoff.liveTradingAllowed
          ? "Package claims live handoff"
          : "Package remains paper-only",
      detail:
        exportPackage.manifest.liveTradingAllowed || exportPackage.executionHandoff.liveTradingAllowed
          ? "Local import must reject packages that claim live trading permission."
          : "Import keeps the package inside the paper-only execution boundary.",
      exportPath: "executionHandoff.liveTradingAllowed",
      tone: exportPackage.manifest.liveTradingAllowed || exportPackage.executionHandoff.liveTradingAllowed ? "risk" : "positive"
    }
  ];
}
