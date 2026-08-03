import { collectPaperExecutionPreparationEvidenceRunIds, formatAdapterPaperExecutionEvidenceDetail, formatPortfolioPaperOrderSimulationAdapterEvidenceDetail } from "../ai-review/evidence-builders";
import type { AuditEvidenceReportSignatureStatus, ResearchRunExportBrowserPackage, ResearchRunExportBrowserRow } from "../audit/report-contracts";
import { auditReportLedgerMetadataText, auditReportLedgerSignatureDetail, auditReportLedgerSignatureLabel, auditReportLedgerSignatureStatus } from "../audit/signing-key-ledger";
import { stage4PortfolioWorkflowAuditEventsAreValid, stage4PortfolioWorkflowAuditSnapshots, stage4PortfolioWorkflowEvidenceDetail, stage5SandboxAuthorizationPreflightAuditSnapshots, stage5SandboxAuthorizationReviewAuditSnapshots, stage5SandboxReadinessDecisionAuditSnapshots, stage5SandboxReadinessHashVerifiedPackages, stage5ShadowSessionAuditSnapshots } from "../portfolio/workflow-evidence";
import { formatMarketCalendarEvidenceDetail, formatPreparationEvidenceDetail, marketCalendarEvidenceTone } from "../strategy/backtest-builders";

export function buildResearchRunExportBrowserRows(
  exportPackage: ResearchRunExportBrowserPackage | null | undefined
): ResearchRunExportBrowserRow[] {
  if (!exportPackage) {
    return [
      {
        id: "package",
        label: "Export package",
        status: "blocked",
        value: "No package selected",
        detail: "Inspect a run from history to load its manifest and artifact counts.",
        exportPath: "manifest.runId",
        tone: "risk"
      }
    ];
  }

  const { artifactCounts } = exportPackage.manifest;
  const paperPackageCount = exportPackage.paperExecutions?.length ?? 0;
  const paperPreparationEvidenceRunIds = collectPaperExecutionPreparationEvidenceRunIds(exportPackage.paperExecutions);
  const adapterPaperExecutionPackageCount = exportPackage.adapterPaperExecutions?.length ?? 0;
  const adapterPaperExecutionDetail = formatAdapterPaperExecutionEvidenceDetail(exportPackage.adapterPaperExecutions);
  const portfolioPaperOrderPackageCount = exportPackage.portfolioPaperOrderBatches?.length ?? 0;
  const portfolioPaperOrderApprovalPackageCount = exportPackage.portfolioPaperOrderApprovals?.length ?? 0;
  const portfolioPaperOrderSimulationPackageCount = exportPackage.portfolioPaperOrderSimulations?.length ?? 0;
  const portfolioPaperOrderSimulationAdapterEvidenceDetail =
    formatPortfolioPaperOrderSimulationAdapterEvidenceDetail(exportPackage.portfolioPaperOrderSimulations);
  const aiReviewPackageCount = exportPackage.aiReviewRuns?.length ?? 0;
  const authoritativeAiReviewPackageCount = exportPackage.aiReviewRunsV2?.length ?? 0;
  const aiReviewDecisionPackageCount = exportPackage.aiReviewDecisions?.length ?? 0;
  const auditEventPackageCount = exportPackage.auditEvents?.length ?? 0;
  const stage4PortfolioWorkflows = stage4PortfolioWorkflowAuditSnapshots(exportPackage.auditEvents);
  const stage4PortfolioWorkflowsAreValid = stage4PortfolioWorkflowAuditEventsAreValid(exportPackage.auditEvents);
  const hasStage4PortfolioWorkflowAccounting =
    (artifactCounts.stage4PortfolioWorkflows ?? 0) > 0 || stage4PortfolioWorkflows.length > 0;
  const stage5ShadowSessions = stage5ShadowSessionAuditSnapshots(exportPackage.auditEvents);
  const stage5ShadowFailureModes = [...new Set(stage5ShadowSessions.map((session) => session.failureMode))];
  const stage5ShadowBlockedCount = stage5ShadowSessions.filter((session) => session.status === "blocked").length;
  const stage5ShadowRecoveredCount = stage5ShadowSessions.filter(
    (session) => session.failureMode === "timeout_once" && session.attempt === 2 && session.status === "reconciled"
  ).length;
  const stage5ShadowSessionEventCount = (exportPackage.auditEvents ?? [])
    .filter((event) => event.eventType === "stage5_shadow_execution_session").length;
  const stage5ShadowSessionsAreValid = stage5ShadowSessions.length === stage5ShadowSessionEventCount;
  const stage5SandboxReadinessDecisions = stage5SandboxReadinessDecisionAuditSnapshots(exportPackage.auditEvents);
  const stage5SandboxReadinessDecisionEventCount = (exportPackage.auditEvents ?? [])
    .filter((event) => event.eventType === "stage5_sandbox_readiness_decision").length;
  const stage5SandboxReadinessDecisionsAreValid =
    stage5SandboxReadinessDecisions.length === stage5SandboxReadinessDecisionEventCount &&
    stage5SandboxReadinessHashVerifiedPackages.has(exportPackage);
  const stage5SandboxAuthorizationPreflights =
    stage5SandboxAuthorizationPreflightAuditSnapshots(exportPackage.auditEvents);
  const stage5SandboxAuthorizationPreflightEventCount = (exportPackage.auditEvents ?? [])
    .filter((event) => event.eventType === "stage5_sandbox_authorization_preflight").length;
  const stage5SandboxAuthorizationPreflightsAreValid =
    stage5SandboxAuthorizationPreflights.length === stage5SandboxAuthorizationPreflightEventCount &&
    stage5SandboxReadinessHashVerifiedPackages.has(exportPackage);
  const stage5SandboxAuthorizationReviews =
    stage5SandboxAuthorizationReviewAuditSnapshots(exportPackage.auditEvents);
  const stage5SandboxAuthorizationReviewEventCount = (exportPackage.auditEvents ?? [])
    .filter((event) => event.eventType === "stage5_sandbox_authorization_review").length;
  const stage5SandboxAuthorizationReviewsAreValid =
    stage5SandboxAuthorizationReviews.length === stage5SandboxAuthorizationReviewEventCount &&
    stage5SandboxReadinessHashVerifiedPackages.has(exportPackage);
  const handoffNotePackageCount = exportPackage.handoffNotes?.length ?? 0;
  const p0PaperSimulationAuditEvents = (exportPackage.auditEvents ?? []).filter(
    (event) => event.eventType === "p0_paper_simulation"
  );
  const promotionPackageCount = exportPackage.promotionCandidate ? 1 : 0;
  const preparationEvidence = exportPackage.researchRun?.dataSnapshot?.preparationEvidence ?? null;
  const marketCalendar = exportPackage.researchRun?.dataSnapshot?.marketCalendar ?? null;
  const passedGateCount = exportPackage.executionHandoff.requiredGates.filter((gate) => gate.passed).length;
  const totalGateCount = exportPackage.executionHandoff.requiredGates.length;
  const integrityHash = exportPackage.integrity?.hash ?? "";
  const auditSummary = exportPackage.auditEvidenceSummary;
  const auditReport = exportPackage.auditReport;
  const backtestReport = exportPackage.backtestReport;
  const auditSummaryIsReady =
    auditSummary?.kind === "aiqt.auditEvidenceSummary" &&
    auditSummary.schemaVersion === 1 &&
    auditSummary.runId === exportPackage.manifest.runId &&
    auditSummary.copyText.trim() !== "";
  const auditReportHash = auditReport?.contentSha256.hash ?? "";
  const auditReportIsReady =
    auditReport?.kind === "aiqt.auditReport" &&
    auditReport.schemaVersion === 1 &&
    auditReport.runId === exportPackage.manifest.runId &&
    auditReport.format === "text/markdown" &&
    auditReport.contentSha256.algorithm === "sha256" &&
    /^[a-f0-9]{64}$/iu.test(auditReportHash) &&
    auditReport.contentMarkdown.trim() !== "";
  const backtestReportHash = backtestReport?.contentSha256.hash ?? "";
  const backtestReportIsReady =
    backtestReport?.kind === "aiqt.backtestReport" &&
    backtestReport.schemaVersion === 1 &&
    backtestReport.runId === exportPackage.manifest.runId &&
    backtestReport.format === "text/markdown" &&
    backtestReport.contentSha256.algorithm === "sha256" &&
    /^[a-f0-9]{64}$/iu.test(backtestReportHash) &&
    backtestReport.contentMarkdown.trim() !== "";
  const auditReportSignatureDetail = researchRunExportReportSignatureDetail(auditReport?.signature);
  const backtestReportSignatureDetail = researchRunExportReportSignatureDetail(backtestReport?.signature);
  const integrityIsReady = exportPackage.integrity?.algorithm === "sha256" && /^[a-f0-9]{64}$/iu.test(integrityHash);
  const dataIsReady =
    artifactCounts.bars === exportPackage.manifest.dataRows &&
    artifactCounts.bars > 0 &&
    exportPackage.manifest.dataHash.trim() !== "";
  const backtestIsReady = artifactCounts.trades > 0 && artifactCounts.equityPoints > 0;
  const paperCountMatches = (artifactCounts.paperExecutions ?? 0) === paperPackageCount;
  const adapterPaperExecutionCountMatches =
    (artifactCounts.adapterPaperExecutions ?? 0) === adapterPaperExecutionPackageCount;
  const portfolioPaperOrderCountMatches =
    (artifactCounts.portfolioPaperOrderBatches ?? 0) === portfolioPaperOrderPackageCount &&
    (artifactCounts.portfolioPaperOrderApprovals ?? 0) === portfolioPaperOrderApprovalPackageCount &&
    (artifactCounts.portfolioPaperOrderSimulations ?? 0) === portfolioPaperOrderSimulationPackageCount;
  const portfolioPaperOrderPackageHasLedger =
    portfolioPaperOrderPackageCount + portfolioPaperOrderApprovalPackageCount + portfolioPaperOrderSimulationPackageCount >
    0;
  const portfolioPaperOrderMismatchDetail = [
    (artifactCounts.portfolioPaperOrderBatches ?? 0) === portfolioPaperOrderPackageCount
      ? ""
      : `portfolioPaperOrderBatches ${artifactCounts.portfolioPaperOrderBatches ?? 0}/${portfolioPaperOrderPackageCount}`,
    (artifactCounts.portfolioPaperOrderApprovals ?? 0) === portfolioPaperOrderApprovalPackageCount
      ? ""
      : `portfolioPaperOrderApprovals ${artifactCounts.portfolioPaperOrderApprovals ?? 0}/${portfolioPaperOrderApprovalPackageCount}`,
    (artifactCounts.portfolioPaperOrderSimulations ?? 0) === portfolioPaperOrderSimulationPackageCount
      ? ""
      : `portfolioPaperOrderSimulations ${artifactCounts.portfolioPaperOrderSimulations ?? 0}/${portfolioPaperOrderSimulationPackageCount}`
  ].filter(Boolean);
  const promotionCountMatches = (artifactCounts.promotionCandidates ?? 0) === promotionPackageCount;
  const aiReviewCountMatches = (artifactCounts.aiReviewRuns ?? 0) === aiReviewPackageCount;
  const authoritativeAiReviewCountMatches =
    (artifactCounts.aiReviewRunsV2 ?? 0) === authoritativeAiReviewPackageCount;
  const aiReviewDecisionCountMatches =
    (artifactCounts.aiReviewDecisions ?? 0) === aiReviewDecisionPackageCount;
  const auditEventCountMatches = (artifactCounts.auditEvents ?? 0) === auditEventPackageCount;
  const stage4PortfolioWorkflowCountMatches =
    (artifactCounts.stage4PortfolioWorkflows ?? 0) === stage4PortfolioWorkflows.length;
  const stage5ShadowSessionCountMatches =
    (artifactCounts.stage5ShadowSessions ?? 0) === stage5ShadowSessions.length;
  const stage5SandboxReadinessDecisionCountMatches =
    (artifactCounts.stage5SandboxReadinessDecisions ?? 0) === stage5SandboxReadinessDecisions.length;
  const stage5SandboxAuthorizationPreflightCountMatches =
    (artifactCounts.stage5SandboxAuthorizationPreflights ?? 0) === stage5SandboxAuthorizationPreflights.length;
  const stage5SandboxAuthorizationReviewCountMatches =
    (artifactCounts.stage5SandboxAuthorizationReviews ?? 0) === stage5SandboxAuthorizationReviews.length;
  const handoffNoteCountMatches = (artifactCounts.handoffNotes ?? 0) === handoffNotePackageCount;
  const p0PackageCompleteness = exportPackage.p0PackageCompleteness;
  const p0CompletenessIsReady =
    p0PackageCompleteness?.kind === "aiqt.p0PackageCompleteness" &&
    p0PackageCompleteness.schemaVersion === 1 &&
    p0PackageCompleteness.runId === exportPackage.manifest.runId &&
    p0PackageCompleteness.ready &&
    p0PackageCompleteness.status === "complete" &&
    !p0PackageCompleteness.liveTradingAllowed &&
    p0PackageCompleteness.liveBlockedBoundary;

  return [
    {
      id: "package",
      label: "Export package",
      status: "ready",
      value: `${exportPackage.manifest.runId} · ${exportPackage.manifest.strategyRevision}`,
      detail: `${exportPackage.manifest.symbol} · ${exportPackage.manifest.timeframe} · exported ${exportPackage.exportedAt}`,
      exportPath: "manifest.runId",
      tone: "positive"
    },
    {
      id: "integrity",
      label: "Integrity",
      status: integrityIsReady ? "ready" : "missing",
      value: exportPackage.integrity ? `${exportPackage.integrity.algorithm} · ${integrityHash.slice(0, 8)}` : "No hash",
      detail: integrityIsReady
        ? "Canonical SHA-256 integrity metadata is present."
        : "Integrity metadata is missing or malformed.",
      exportPath: "integrity.hash",
      tone: integrityIsReady ? "positive" : "warning"
    },
    {
      id: "data",
      label: "Data snapshot",
      status: dataIsReady ? "ready" : "blocked",
      value: `${artifactCounts.bars}/${exportPackage.manifest.dataRows} bars`,
      detail: `${exportPackage.manifest.dataHash || "missing hash"} · ${exportPackage.manifest.market}`,
      exportPath: "manifest.artifactCounts.bars",
      tone: dataIsReady ? "positive" : "risk"
    },
    {
      id: "market-calendar",
      label: "Market calendar",
      status: marketCalendar ? "ready" : "missing",
      value: marketCalendar ? `${marketCalendar.status} · ${marketCalendar.session}` : "No market calendar evidence",
      detail: marketCalendar
        ? formatMarketCalendarEvidenceDetail(marketCalendar)
        : "Package research run does not include market calendar evidence.",
      exportPath: "researchRun.dataSnapshot.marketCalendar",
      tone: marketCalendar ? marketCalendarEvidenceTone(marketCalendar) : "neutral"
    },
    {
      id: "preparation-evidence",
      label: "Preparation evidence",
      status: preparationEvidence ? "ready" : "missing",
      value: preparationEvidence?.runId ?? "No preparation evidence",
      detail: preparationEvidence
        ? formatPreparationEvidenceDetail(preparationEvidence)
        : "Package research run does not include locked watchlist cache refresh evidence.",
      exportPath: "researchRun.dataSnapshot.preparationEvidence",
      tone: preparationEvidence ? (preparationEvidence.quality.isComplete ? "positive" : "warning") : "neutral"
    },
    {
      id: "backtest",
      label: "Backtest replay",
      status: backtestIsReady ? "ready" : "missing",
      value: `${artifactCounts.trades} trades / ${artifactCounts.equityPoints} equity`,
      detail: `${artifactCounts.decisions} decisions · ${artifactCounts.aiRisks} AI risks`,
      exportPath: "researchRun.backtestTrades",
      tone: backtestIsReady ? "positive" : "warning"
    },
    ...(backtestReport
      ? ([
          {
            id: "backtest-report",
            label: "Backtest report",
            status: backtestReportIsReady ? "ready" : "blocked",
            value: backtestReport.contentSha256
              ? `${backtestReport.contentSha256.algorithm} · ${backtestReportHash.slice(0, 8)}`
              : "No content hash",
            detail: backtestReportIsReady
              ? [
                  `${backtestReport.fileName} · ${backtestReport.runComparisonRows} comparable runs`,
                  backtestReportSignatureDetail
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "Backtest report artifact is missing valid Markdown content or SHA-256 metadata.",
            exportPath: "backtestReport.contentSha256.hash",
            tone: backtestReportIsReady ? "ai" : "risk"
          }
        ] satisfies ResearchRunExportBrowserRow[])
      : []),
    {
      id: "research-note",
      label: "Research note",
      status: (artifactCounts.researchNotes ?? 0) > 0 ? "ready" : "missing",
      value: `${artifactCounts.researchNotes ?? 0} note`,
      detail:
        (artifactCounts.researchNotes ?? 0) > 0
          ? "Locked research context is declared in the manifest."
          : "No locked research note is declared in this package.",
      exportPath: "researchRun.researchNote",
      tone: (artifactCounts.researchNotes ?? 0) > 0 ? "ai" : "neutral"
    },
    {
      id: "handoff-notes",
      label: "Handoff notes",
      status:
        handoffNoteCountMatches && handoffNotePackageCount > 0
          ? "ready"
          : handoffNoteCountMatches
            ? "missing"
            : "blocked",
      value: `${artifactCounts.handoffNotes ?? 0} manifest / ${handoffNotePackageCount} package`,
      detail: handoffNoteCountMatches
        ? "Local team handoff note count matches the export package payload."
        : "Handoff note manifest count does not match the package payload.",
      exportPath: "handoffNotes[]",
      tone: handoffNoteCountMatches && handoffNotePackageCount > 0 ? "ai" : handoffNoteCountMatches ? "neutral" : "risk"
    },
    {
      id: "paper-executions",
      label: "Paper executions",
      status: paperCountMatches && paperPackageCount > 0 ? "ready" : paperCountMatches ? "missing" : "blocked",
      value: `${artifactCounts.paperExecutions ?? 0} manifest / ${paperPackageCount} package`,
      detail: paperCountMatches
        ? [
            "Manifest and package paper execution counts match",
            ...(paperPreparationEvidenceRunIds.length ? [`prep ${paperPreparationEvidenceRunIds.join(", ")}`] : [])
          ].join(" · ")
        : "Manifest paper execution count does not match the package payload.",
      exportPath: "paperExecutions[]",
      tone: paperCountMatches && paperPackageCount > 0 ? "positive" : paperCountMatches ? "neutral" : "risk"
    },
    {
      id: "adapter-paper-executions",
      label: "Adapter paper executions",
      status:
        adapterPaperExecutionCountMatches && adapterPaperExecutionPackageCount > 0
          ? "ready"
          : adapterPaperExecutionCountMatches
            ? "missing"
            : "blocked",
      value: `${artifactCounts.adapterPaperExecutions ?? 0} manifest / ${adapterPaperExecutionPackageCount} package`,
      detail: adapterPaperExecutionCountMatches
        ? adapterPaperExecutionDetail
        : "Manifest adapter paper execution count does not match the package payload.",
      exportPath: "adapterPaperExecutions[]",
      tone:
        adapterPaperExecutionCountMatches && adapterPaperExecutionPackageCount > 0
          ? "positive"
          : adapterPaperExecutionCountMatches
            ? "neutral"
            : "risk"
    },
    {
      id: "portfolio-paper-orders",
      label: "Portfolio paper orders",
      status:
        portfolioPaperOrderCountMatches && portfolioPaperOrderPackageHasLedger
          ? "ready"
          : portfolioPaperOrderCountMatches
            ? "missing"
            : "blocked",
      value: `${artifactCounts.portfolioPaperOrderBatches ?? 0} batches / ${artifactCounts.portfolioPaperOrderApprovals ?? 0} approvals / ${artifactCounts.portfolioPaperOrderSimulations ?? 0} fills`,
      detail: portfolioPaperOrderCountMatches
        ? [
            "Portfolio paper order batch, approval, and simulated-fill counts match the package payload. portfolioPaperOrderBatches / portfolioPaperOrderApprovals / portfolioPaperOrderSimulations",
            portfolioPaperOrderSimulationAdapterEvidenceDetail
          ]
            .filter(Boolean)
            .join(" · ")
        : `Portfolio paper order manifest count does not match the package payload: ${portfolioPaperOrderMismatchDetail.join(", ")}.`,
      exportPath: "portfolioPaperOrderBatches[] portfolioPaperOrderApprovals[] portfolioPaperOrderSimulations[]",
      tone:
        portfolioPaperOrderCountMatches && portfolioPaperOrderPackageHasLedger
          ? "warning"
          : portfolioPaperOrderCountMatches
            ? "neutral"
            : "risk"
    },
    {
      id: "promotion-candidate",
      label: "Promotion candidate",
      status: promotionCountMatches && promotionPackageCount > 0 ? "ready" : promotionCountMatches ? "missing" : "blocked",
      value: `${artifactCounts.promotionCandidates ?? 0} manifest / ${promotionPackageCount} package`,
      detail: exportPackage.promotionCandidate?.summary ?? "No promotion candidate payload is attached.",
      exportPath: "promotionCandidate",
      tone: promotionCountMatches && promotionPackageCount > 0 ? "warning" : promotionCountMatches ? "neutral" : "risk"
    },
    {
      id: "ai-reviews",
      label: "AI review records",
      status: aiReviewCountMatches && aiReviewPackageCount > 0 ? "ready" : aiReviewCountMatches ? "missing" : "blocked",
      value: `${artifactCounts.aiReviewRuns ?? 0} manifest / ${aiReviewPackageCount} package`,
      detail: aiReviewCountMatches
        ? "AI review record count matches the export package payload."
        : "AI review manifest count does not match the package payload.",
      exportPath: "aiReviewRuns[]",
      tone: aiReviewCountMatches && aiReviewPackageCount > 0 ? "ai" : aiReviewCountMatches ? "neutral" : "risk"
    },
    ...(artifactCounts.aiReviewRunsV2 !== undefined || exportPackage.aiReviewRunsV2 !== undefined
      ? ([
        {
          id: "ai-reviews-v2",
          label: "Authoritative AI Reviews",
          status:
            authoritativeAiReviewCountMatches && authoritativeAiReviewPackageCount > 0
              ? "ready"
              : authoritativeAiReviewCountMatches
                ? "missing"
                : "blocked",
          value:
            (artifactCounts.aiReviewRunsV2 ?? 0) + " manifest / "
            + authoritativeAiReviewPackageCount + " package",
          detail: authoritativeAiReviewCountMatches
            ? "Authoritative v2 Review count matches the export package payload."
            : "Authoritative v2 Review manifest count does not match the package payload.",
          exportPath: "aiReviewRunsV2[].record",
          tone:
            authoritativeAiReviewCountMatches && authoritativeAiReviewPackageCount > 0
              ? "ai"
              : authoritativeAiReviewCountMatches
                ? "neutral"
                : "risk"
        }
      ] satisfies ResearchRunExportBrowserRow[])
      : []),
    ...(artifactCounts.aiReviewDecisions !== undefined || exportPackage.aiReviewDecisions !== undefined
      ? ([
        {
          id: "ai-review-decisions",
          label: "AI Review Decisions",
          status:
            aiReviewDecisionCountMatches && aiReviewDecisionPackageCount > 0
              ? "ready"
              : aiReviewDecisionCountMatches
                ? "missing"
                : "blocked",
          value:
            (artifactCounts.aiReviewDecisions ?? 0) + " manifest / "
            + aiReviewDecisionPackageCount + " package",
          detail: aiReviewDecisionCountMatches
            ? "AI Review Decision count matches the export package payload."
            : "AI Review Decision manifest count does not match the package payload.",
          exportPath: "aiReviewDecisions[].record",
          tone:
            aiReviewDecisionCountMatches && aiReviewDecisionPackageCount > 0
              ? "ai"
              : aiReviewDecisionCountMatches
                ? "neutral"
                : "risk"
        }
      ] satisfies ResearchRunExportBrowserRow[])
      : []),
    ...((artifactCounts.stage5ShadowSessions ?? 0) > 0 || stage5ShadowSessionEventCount > 0
      ? ([{
          id: "stage5-shadow-sessions",
          label: "Stage 5 shadow sessions",
          status: stage5ShadowSessionCountMatches && stage5ShadowSessionsAreValid ? "ready" : "blocked",
          value: `${artifactCounts.stage5ShadowSessions ?? 0} manifest / ${stage5ShadowSessions.length} package`,
          detail: stage5ShadowSessionCountMatches && stage5ShadowSessionsAreValid
            ? `modes ${stage5ShadowFailureModes.join(", ")} · blocked ${stage5ShadowBlockedCount} · recovered ${stage5ShadowRecoveredCount} · hashes ${stage5ShadowSessions.map((session) => session.sessionHash.slice(0, 12)).join(", ")} · live route blocked`
            : "Stage 5 shadow session count, identity, time, or safety contract does not match auditEvents[].",
          exportPath: "auditEvents[].metadata.snapshot",
          tone: stage5ShadowSessionCountMatches && stage5ShadowSessionsAreValid ? "ai" : "risk"
        }] satisfies ResearchRunExportBrowserRow[])
      : []),
    ...((artifactCounts.stage5SandboxReadinessDecisions ?? 0) > 0 || stage5SandboxReadinessDecisionEventCount > 0
      ? ([{
          id: "stage5-sandbox-readiness-decisions",
          label: "Stage 5 sandbox readiness decisions",
          status: stage5SandboxReadinessDecisionCountMatches && stage5SandboxReadinessDecisionsAreValid
            ? "ready" : "blocked",
          value: `${artifactCounts.stage5SandboxReadinessDecisions ?? 0} manifest / ${stage5SandboxReadinessDecisions.length} package`,
          detail: stage5SandboxReadinessDecisionCountMatches && stage5SandboxReadinessDecisionsAreValid
            ? stage5SandboxReadinessDecisions.map((decision) =>
                `run ${decision.baseRunId} · session ${decision.shadowSessionHash.slice(0, 12)} · ${decision.adapterId} · terminal ${decision.adapterPaperExecutionIds.join(", ")} · decision SHA-256 ${decision.decisionHash.slice(0, 12)} · sandbox order submission blocked`
              ).join(" · ")
            : "Stage 5 sandbox readiness decision count, identity, time, SHA-256, or safety contract does not match auditEvents[].",
          exportPath: "auditEvents[].metadata.snapshot",
          tone: stage5SandboxReadinessDecisionCountMatches && stage5SandboxReadinessDecisionsAreValid ? "ai" : "risk"
        }] satisfies ResearchRunExportBrowserRow[])
      : []),
    ...((artifactCounts.stage5SandboxAuthorizationPreflights ?? 0) > 0 ||
      stage5SandboxAuthorizationPreflightEventCount > 0
      ? ([{
          id: "stage5-sandbox-authorization-preflights",
          label: "Stage 5 sandbox authorization preflights",
          status: stage5SandboxAuthorizationPreflightCountMatches &&
            stage5SandboxAuthorizationPreflightsAreValid ? "ready" : "blocked",
          value: `${artifactCounts.stage5SandboxAuthorizationPreflights ?? 0} manifest / ${stage5SandboxAuthorizationPreflights.length} package`,
          detail: stage5SandboxAuthorizationPreflightCountMatches && stage5SandboxAuthorizationPreflightsAreValid
            ? stage5SandboxAuthorizationPreflights.map((preflight) =>
                `${preflight.adapterId} · ${preflight.market} · health ${preflight.authoritativeHealthEvidenceHash.slice(0, 12)} · preflight SHA-256 ${preflight.preflightHash.slice(0, 12)} · human authorization required · orders blocked`
              ).join(" · ")
            : "Stage 5 sandbox authorization preflight count, identity, SHA-256, or safety contract does not match auditEvents[].",
          exportPath: "auditEvents[].metadata.snapshot",
          tone: stage5SandboxAuthorizationPreflightCountMatches &&
            stage5SandboxAuthorizationPreflightsAreValid ? "ai" : "risk"
        }] satisfies ResearchRunExportBrowserRow[])
      : []),
    ...((artifactCounts.stage5SandboxAuthorizationReviews ?? 0) > 0 ||
      stage5SandboxAuthorizationReviewEventCount > 0
      ? ([{
          id: "stage5-sandbox-authorization-reviews",
          label: "Stage 5 sandbox authorization reviews",
          status: stage5SandboxAuthorizationReviewCountMatches &&
            stage5SandboxAuthorizationReviewsAreValid ? "ready" : "blocked",
          value: `${artifactCounts.stage5SandboxAuthorizationReviews ?? 0} manifest / ${stage5SandboxAuthorizationReviews.length} package`,
          detail: stage5SandboxAuthorizationReviewCountMatches && stage5SandboxAuthorizationReviewsAreValid
            ? stage5SandboxAuthorizationReviews.map((review) =>
                `${review.outcome} · ${review.reviewer} · review SHA-256 ${review.reviewHash.slice(0, 12)} · authorization ineffective · orders blocked`
              ).join(" · ")
            : "Stage 5 sandbox authorization review count, identity, SHA-256, or safety contract does not match auditEvents[].",
          exportPath: "auditEvents[].metadata.snapshot",
          tone: stage5SandboxAuthorizationReviewCountMatches &&
            stage5SandboxAuthorizationReviewsAreValid ? "ai" : "risk"
        }] satisfies ResearchRunExportBrowserRow[])
      : []),
    {
      id: "audit-events",
      label: hasStage4PortfolioWorkflowAccounting ? "Stage 4 portfolio workflows" : "Audit events",
      status:
        auditEventCountMatches && stage4PortfolioWorkflowCountMatches && stage4PortfolioWorkflowsAreValid && auditEventPackageCount > 0
          ? "ready"
          : auditEventCountMatches && stage4PortfolioWorkflowCountMatches && stage4PortfolioWorkflowsAreValid
            ? "missing"
            : "blocked",
      value: hasStage4PortfolioWorkflowAccounting
        ? `${artifactCounts.stage4PortfolioWorkflows ?? 0} manifest / ${stage4PortfolioWorkflows.length} package`
        : `${artifactCounts.auditEvents ?? 0} manifest / ${auditEventPackageCount} package`,
      detail: hasStage4PortfolioWorkflowAccounting
        ? stage4PortfolioWorkflowCountMatches && stage4PortfolioWorkflowsAreValid
          ? stage4PortfolioWorkflows.map(stage4PortfolioWorkflowEvidenceDetail).join(" · ")
          : stage4PortfolioWorkflowCountMatches
            ? `${stage4PortfolioWorkflows.map(stage4PortfolioWorkflowEvidenceDetail).join(" · ")} · invalid bindings or unsafe boundary`
            : "Stage 4 workflow manifest count does not match auditEvents[]."
        : auditEventCountMatches
          ? `${p0PaperSimulationAuditEvents.length} P0 paper simulation event${
            p0PaperSimulationAuditEvents.length === 1 ? "" : "s"
          }${
            p0PaperSimulationAuditEvents[0]?.eventType ? ` · ${p0PaperSimulationAuditEvents[0].eventType}` : ""
          }${
            p0PaperSimulationAuditEvents[0]?.eventId ? ` · ${p0PaperSimulationAuditEvents[0].eventId}` : ""
          }`
          : "Manifest audit event count does not match the package payload.",
      exportPath: hasStage4PortfolioWorkflowAccounting ? "auditEvents[].metadata.snapshot" : "auditEvents[]",
      tone: auditEventCountMatches && stage4PortfolioWorkflowCountMatches && stage4PortfolioWorkflowsAreValid && auditEventPackageCount > 0
        ? "ai"
        : auditEventCountMatches && stage4PortfolioWorkflowCountMatches && stage4PortfolioWorkflowsAreValid ? "neutral" : "risk"
    },
    ...(p0PackageCompleteness
      ? ([
          {
            id: "p0-completeness",
            label: "P0 package completeness",
            status: p0CompletenessIsReady ? "ready" : p0PackageCompleteness.blocked > 0 ? "blocked" : "missing",
            value: `${p0PackageCompleteness.passed}/${p0PackageCompleteness.total} · ${p0PackageCompleteness.status}`,
            detail: p0PackageCompleteness.summary,
            exportPath: "p0PackageCompleteness",
            tone: p0CompletenessIsReady ? "positive" : p0PackageCompleteness.blocked > 0 ? "risk" : "warning"
          }
        ] satisfies ResearchRunExportBrowserRow[])
      : []),
    ...(auditSummary
      ? ([
          {
            id: "audit-summary",
            label: "Audit evidence summary",
            status: auditSummaryIsReady ? "ready" : "blocked",
            value: `${auditSummary.package.matched}/${auditSummary.package.total} package · ${auditSummary.importDiff.blocked} diff blocked`,
            detail: auditSummaryIsReady
              ? `Copyable audit focus embedded at ${auditSummary.generatedAt}.`
              : "Audit evidence summary metadata does not match this export package.",
            exportPath: "auditEvidenceSummary",
            tone: auditSummaryIsReady ? "ai" : "risk"
          }
        ] satisfies ResearchRunExportBrowserRow[])
      : []),
    ...(auditReport
      ? ([
          {
            id: "audit-report",
            label: "Audit report",
            status: auditReportIsReady ? "ready" : "blocked",
            value: auditReport.contentSha256
              ? `${auditReport.contentSha256.algorithm} · ${auditReportHash.slice(0, 8)}`
              : "No content hash",
            detail: auditReportIsReady
              ? [`${auditReport.fileName} · generated ${auditReport.generatedAt}`, auditReportSignatureDetail]
                  .filter(Boolean)
                  .join(" · ")
              : "Audit report artifact is missing valid Markdown content or SHA-256 metadata.",
            exportPath: "auditReport.contentSha256.hash",
            tone: auditReportIsReady ? "ai" : "risk"
          }
        ] satisfies ResearchRunExportBrowserRow[])
      : []),
    {
      id: "execution-handoff",
      label: "Execution handoff",
      status: exportPackage.executionHandoff.liveTradingAllowed ? "ready" : "blocked",
      value: `${passedGateCount}/${totalGateCount} gates`,
      detail: exportPackage.executionHandoff.liveTradingAllowed
        ? "Live execution handoff is allowed by the package gates."
        : "Package remains paper-only; live execution is blocked.",
      exportPath: "executionHandoff.requiredGates",
      tone: exportPackage.executionHandoff.liveTradingAllowed ? "positive" : "risk"
    }
  ];
}

export function filterResearchRunExportBrowserRows(
  rows: ResearchRunExportBrowserRow[],
  query: string
): ResearchRunExportBrowserRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }
  return rows.filter((row) =>
    [row.id, row.label, row.status, row.value, row.detail, row.exportPath, row.tone]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

export function researchRunExportReportSignatureMetadata(signature: Record<string, unknown> | undefined): Record<string, unknown> {
  return signature && typeof signature === "object" && !Array.isArray(signature) ? signature : {};
}

export function researchRunExportReportSignatureStatus(signature: Record<string, unknown> | undefined): AuditEvidenceReportSignatureStatus {
  return auditReportLedgerSignatureStatus(researchRunExportReportSignatureMetadata(signature));
}

export function researchRunExportReportSignatureImportBlockReason(
  signature: Record<string, unknown> | undefined,
  reportLabel: string
): string {
  const status = researchRunExportReportSignatureStatus(signature);
  if (status === "invalid" || status === "revoked") {
    return `${reportLabel} signature is revoked or invalid and cannot be trusted for import.`;
  }
  if (
    (status === "signed" || status === "verified") &&
    !researchRunExportReportSignatureHasRequiredFields(signature, status)
  ) {
    return `${reportLabel} signature metadata is incomplete and cannot be trusted for import.`;
  }
  return "";
}

export function researchRunExportAuditReportImportPolicyBlockReason(
  auditReport: ResearchRunExportBrowserPackage["auditReport"] | undefined
): string {
  const invalidImportVerificationCount = auditReport?.evidenceSummary?.importVerification?.invalid ?? 0;
  if (Number.isFinite(invalidImportVerificationCount) && invalidImportVerificationCount > 0) {
    return "Audit report carries invalid imported evidence and cannot be trusted for import.";
  }
  return "";
}

export function researchRunExportReportSignatureHasRequiredFields(
  signature: Record<string, unknown> | undefined,
  status: "signed" | "verified"
): boolean {
  const metadata = researchRunExportReportSignatureMetadata(signature);
  const requiredFields = ["algorithm", "chainId", "eventId", "keyId", "signedAt", "signer", "value"];
  if (status === "verified") {
    requiredFields.push("verifiedAt");
  }
  return requiredFields.every((field) => auditReportLedgerMetadataText(metadata, field).trim() !== "");
}

export function researchRunExportReportSignatureDetail(signature: Record<string, unknown> | undefined): string {
  const metadata = researchRunExportReportSignatureMetadata(signature);
  const status = auditReportLedgerSignatureStatus(metadata);
  if (status === "unsigned") {
    return "";
  }
  const detail = auditReportLedgerSignatureDetail(metadata);
  return [auditReportLedgerSignatureLabel(status), detail].filter(Boolean).join(" · ");
}

export function researchRunExportReportSignatureImportVerificationDetail(signature: Record<string, unknown> | undefined): string {
  const metadata = researchRunExportReportSignatureMetadata(signature);
  const source = auditReportLedgerMetadataText(metadata, "importVerificationSource");
  const status = auditReportLedgerMetadataText(metadata, "importVerificationStatus");
  if (source !== "local-core" || (status !== "verified" && status !== "invalid")) {
    return "";
  }
  return [`Local core import verification: ${status}`, auditReportLedgerMetadataText(metadata, "importVerificationReason")]
    .filter(Boolean)
    .join(" · ");
}

export function researchRunExportReportSignatureArtifactSuffix(signature: Record<string, unknown> | undefined): string {
  const status = researchRunExportReportSignatureStatus(signature);
  return status === "unsigned" ? "" : status;
}
