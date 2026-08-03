import { collectPaperExecutionPreparationEvidenceRunIds } from "../ai-review/evidence-builders";
import type { ResearchRunExportBrowserPackage, ResearchRunExportIndexRow, ResearchRunExportIndexStatus } from "../audit/report-contracts";
import { timestampSortValue } from "../audit/signing-key-ledger";
import { researchRunExportReportSignatureArtifactSuffix, researchRunExportReportSignatureDetail } from "./export-browser";

export function buildResearchRunExportIndexRows(
  exportPackages: ResearchRunExportBrowserPackage[]
): ResearchRunExportIndexRow[] {
  return [...exportPackages]
    .sort((left, right) => timestampSortValue(right.exportedAt) - timestampSortValue(left.exportedAt))
    .map((exportPackage) => {
      const { artifactCounts } = exportPackage.manifest;
      const paperPackageCount = exportPackage.paperExecutions?.length ?? 0;
      const adapterPaperExecutionPackageCount = exportPackage.adapterPaperExecutions?.length ?? 0;
      const portfolioPaperOrderPackageCount = exportPackage.portfolioPaperOrderBatches?.length ?? 0;
      const portfolioPaperOrderApprovalPackageCount = exportPackage.portfolioPaperOrderApprovals?.length ?? 0;
      const portfolioPaperOrderSimulationPackageCount = exportPackage.portfolioPaperOrderSimulations?.length ?? 0;
      const aiReviewPackageCount = exportPackage.aiReviewRuns?.length ?? 0;
      const authoritativeAiReviewPackageCount = exportPackage.aiReviewRunsV2?.length ?? 0;
      const aiReviewDecisionPackageCount = exportPackage.aiReviewDecisions?.length ?? 0;
      const auditEventPackageCount = exportPackage.auditEvents?.length ?? 0;
      const handoffNotePackageCount = exportPackage.handoffNotes?.length ?? 0;
      const promotionPackageCount = exportPackage.promotionCandidate ? 1 : 0;
      const passedGateCount = exportPackage.executionHandoff.requiredGates.filter((gate) => gate.passed).length;
      const totalGateCount = exportPackage.executionHandoff.requiredGates.length;
      const integrityHash = exportPackage.integrity?.hash ?? "";
      const preparationEvidence = exportPackage.researchRun?.dataSnapshot?.preparationEvidence ?? null;
      const preparationEvidenceArtifact = preparationEvidence ? `prep ${preparationEvidence.runId}` : null;
      const paperPreparationEvidenceRunIds = collectPaperExecutionPreparationEvidenceRunIds(exportPackage.paperExecutions);
      const paperPreparationEvidenceArtifact = paperPreparationEvidenceRunIds.length
        ? `paper prep ${paperPreparationEvidenceRunIds.join(", ")}`
        : null;
      const marketCalendar = exportPackage.researchRun?.dataSnapshot?.marketCalendar ?? null;
      const marketCalendarArtifact = marketCalendar ? `calendar ${marketCalendar.status}/${marketCalendar.session}` : null;
      const auditReport = exportPackage.auditReport;
      const auditReportHash = auditReport?.contentSha256.hash ?? "";
      const auditReportIsReady =
        auditReport?.kind === "aiqt.auditReport" &&
        auditReport.schemaVersion === 1 &&
        auditReport.runId === exportPackage.manifest.runId &&
        auditReport.evidenceSummary?.runId === exportPackage.manifest.runId &&
        auditReport.format === "text/markdown" &&
        auditReport.contentSha256.algorithm === "sha256" &&
        /^[a-f0-9]{64}$/iu.test(auditReportHash) &&
        auditReport.contentMarkdown.trim() !== "";
      const backtestReport = exportPackage.backtestReport;
      const backtestReportHash = backtestReport?.contentSha256.hash ?? "";
      const backtestReportIsReady =
        backtestReport?.kind === "aiqt.backtestReport" &&
        backtestReport.schemaVersion === 1 &&
        backtestReport.runId === exportPackage.manifest.runId &&
        backtestReport.market === exportPackage.manifest.market &&
        backtestReport.symbol === exportPackage.manifest.symbol &&
        backtestReport.timeframe === exportPackage.manifest.timeframe &&
        backtestReport.strategyRevision === exportPackage.manifest.strategyRevision &&
        backtestReport.format === "text/markdown" &&
        backtestReport.contentSha256.algorithm === "sha256" &&
        /^[a-f0-9]{64}$/iu.test(backtestReportHash) &&
        backtestReport.contentMarkdown.trim() !== "";
      const reportArtifactLabels = [
        auditReport
          ? `auditReport ${
              auditReportIsReady
                ? [auditReportHash.slice(0, 8), researchRunExportReportSignatureArtifactSuffix(auditReport.signature)]
                    .filter(Boolean)
                    .join(" ")
                : "blocked"
            }`
          : null,
        backtestReport
          ? `backtestReport ${
              backtestReportIsReady
                ? [
                    backtestReportHash.slice(0, 8),
                    researchRunExportReportSignatureArtifactSuffix(backtestReport.signature)
                  ]
                    .filter(Boolean)
                    .join(" ")
                : "blocked"
            }`
          : null
      ].filter((label): label is string => Boolean(label));
      const reportSignatureDetails = [
        auditReportIsReady ? researchRunExportReportSignatureDetail(auditReport?.signature) : "",
        backtestReportIsReady ? researchRunExportReportSignatureDetail(backtestReport?.signature) : ""
      ].filter(Boolean);
      const integrityIsReady =
        exportPackage.integrity?.algorithm === "sha256" && /^[a-f0-9]{64}$/iu.test(integrityHash);
      const dataIsReady =
        artifactCounts.bars === exportPackage.manifest.dataRows &&
        artifactCounts.bars > 0 &&
        exportPackage.manifest.dataHash.trim() !== "";
      const paperCountMatches = (artifactCounts.paperExecutions ?? 0) === paperPackageCount;
      const adapterPaperExecutionCountMatches =
        (artifactCounts.adapterPaperExecutions ?? 0) === adapterPaperExecutionPackageCount;
      const portfolioPaperOrderCountMatches =
        (artifactCounts.portfolioPaperOrderBatches ?? 0) === portfolioPaperOrderPackageCount &&
        (artifactCounts.portfolioPaperOrderApprovals ?? 0) === portfolioPaperOrderApprovalPackageCount &&
        (artifactCounts.portfolioPaperOrderSimulations ?? 0) === portfolioPaperOrderSimulationPackageCount;
      const promotionCountMatches = (artifactCounts.promotionCandidates ?? 0) === promotionPackageCount;
      const aiReviewCountMatches = (artifactCounts.aiReviewRuns ?? 0) === aiReviewPackageCount;
      const authoritativeAiReviewCountMatches =
        (artifactCounts.aiReviewRunsV2 ?? 0) === authoritativeAiReviewPackageCount;
      const aiReviewDecisionCountMatches =
        (artifactCounts.aiReviewDecisions ?? 0) === aiReviewDecisionPackageCount;
      const auditEventCountMatches = (artifactCounts.auditEvents ?? 0) === auditEventPackageCount;
      const handoffNoteCountMatches = (artifactCounts.handoffNotes ?? 0) === handoffNotePackageCount;
      const mismatchReasons = [
        integrityIsReady ? null : "Integrity missing",
        dataIsReady ? null : "Data snapshot mismatch",
        paperCountMatches ? null : "Paper execution count mismatch",
        adapterPaperExecutionCountMatches ? null : "Adapter paper execution count mismatch",
        portfolioPaperOrderCountMatches ? null : "Portfolio paper order count mismatch",
        promotionCountMatches ? null : "Promotion candidate count mismatch",
        aiReviewCountMatches ? null : "AI review count mismatch",
        authoritativeAiReviewCountMatches ? null : "Authoritative AI Review count mismatch",
        aiReviewDecisionCountMatches ? null : "AI Review Decision count mismatch",
        auditEventCountMatches ? null : "Audit event count mismatch",
        handoffNoteCountMatches ? null : "Handoff note count mismatch",
        auditReport && !auditReportIsReady ? "Audit report mismatch" : null,
        backtestReport && !backtestReportIsReady ? "Backtest report mismatch" : null
      ].filter((reason): reason is string => Boolean(reason));
      const status: ResearchRunExportIndexStatus = mismatchReasons.length
        ? "blocked"
        : exportPackage.executionHandoff.liveTradingAllowed
          ? "ready"
          : "review";

      return {
        id: exportPackage.manifest.runId,
        runId: exportPackage.manifest.runId,
        context: `${exportPackage.manifest.symbol} · ${exportPackage.manifest.timeframe}`,
        strategyRevision: exportPackage.manifest.strategyRevision,
        exportedAt: exportPackage.exportedAt,
        status,
        integrity: exportPackage.integrity
          ? `${exportPackage.integrity.algorithm} · ${integrityHash.slice(0, 8)}`
          : "No hash",
        dataHash: exportPackage.manifest.dataHash || "missing hash",
        artifacts: [
          `${artifactCounts.bars} bars`,
          `${artifactCounts.trades} trades`,
          marketCalendarArtifact,
          preparationEvidenceArtifact,
          paperPreparationEvidenceArtifact,
          (artifactCounts.adapterPaperExecutions ?? 0) > 0
            ? `${artifactCounts.adapterPaperExecutions ?? 0} adapter paper executions`
            : null,
          `${artifactCounts.portfolioPaperOrderBatches ?? 0} portfolio batches`,
          `${artifactCounts.portfolioPaperOrderApprovals ?? 0} approvals`,
          `${artifactCounts.portfolioPaperOrderSimulations ?? 0} fills`,
          `${artifactCounts.aiReviewRuns ?? 0} AI`,
          artifactCounts.aiReviewRunsV2 !== undefined || exportPackage.aiReviewRunsV2 !== undefined
            ? (artifactCounts.aiReviewRunsV2 ?? 0) + " authoritative Reviews"
            : null,
          artifactCounts.aiReviewDecisions !== undefined || exportPackage.aiReviewDecisions !== undefined
            ? (artifactCounts.aiReviewDecisions ?? 0) + " Decisions"
            : null,
          (artifactCounts.auditEvents ?? 0) > 0 ? `${artifactCounts.auditEvents ?? 0} audit events` : null,
          (artifactCounts.handoffNotes ?? 0) > 0 ? `${artifactCounts.handoffNotes ?? 0} handoff notes` : null,
          reportArtifactLabels.length ? `${reportArtifactLabels.length} reports` : null,
          ...reportArtifactLabels
        ]
          .filter((artifact): artifact is string => Boolean(artifact))
          .join(" / "),
        execution: `${passedGateCount}/${totalGateCount} gates · ${exportPackage.executionHandoff.mode}`,
        detail: mismatchReasons.length
          ? mismatchReasons.join("; ")
          : exportPackage.executionHandoff.liveTradingAllowed
            ? ["Package is consistent and live handoff is open.", ...reportSignatureDetails].join(" · ")
            : ["Package is consistent; paper-only handoff requires review.", ...reportSignatureDetails].join(" · "),
        exportPath: `manifest:${exportPackage.manifest.runId}`,
        tone: status === "ready" ? "positive" : status === "review" ? "warning" : "risk"
      };
    });
}

export function filterResearchRunExportIndexRows(
  rows: ResearchRunExportIndexRow[],
  query: string
): ResearchRunExportIndexRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }
  return rows.filter((row) =>
    [
      row.id,
      row.runId,
      row.context,
      row.strategyRevision,
      row.exportedAt,
      row.status,
      row.integrity,
      row.dataHash,
      row.artifacts,
      row.execution,
      row.detail,
      row.exportPath,
      row.tone
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

export function researchRunImportArtifactCountMismatches(
  exportPackage: ResearchRunExportBrowserPackage,
  actualCounts: {
    aiReviewRuns: number;
    aiReviewRunsV2: number;
    aiReviewDecisions: number;
    adapterPaperExecutions: number;
    paperExecutions: number;
    portfolioPaperOrderApprovals: number;
    portfolioPaperOrderBatches: number;
    portfolioPaperOrderSimulations: number;
    promotionCandidates: number;
    researchNotes: number;
    auditEvents: number;
    stage4PortfolioWorkflows: number;
    stage5ShadowSessions: number;
    stage5SandboxReadinessDecisions: number;
    stage5SandboxAuthorizationPreflights: number;
    stage5SandboxAuthorizationReviews: number;
    handoffNotes: number;
  }
): string[] {
  const { artifactCounts } = exportPackage.manifest;
  const pairs: Array<[string, number, number]> = [
    ["bars", artifactCounts.bars, exportPackage.manifest.dataRows],
    ["researchNotes", artifactCounts.researchNotes ?? 0, actualCounts.researchNotes],
    ["paperExecutions", artifactCounts.paperExecutions ?? 0, actualCounts.paperExecutions],
    ["adapterPaperExecutions", artifactCounts.adapterPaperExecutions ?? 0, actualCounts.adapterPaperExecutions],
    [
      "portfolioPaperOrderBatches",
      artifactCounts.portfolioPaperOrderBatches ?? 0,
      actualCounts.portfolioPaperOrderBatches
    ],
    [
      "portfolioPaperOrderApprovals",
      artifactCounts.portfolioPaperOrderApprovals ?? 0,
      actualCounts.portfolioPaperOrderApprovals
    ],
    [
      "portfolioPaperOrderSimulations",
      artifactCounts.portfolioPaperOrderSimulations ?? 0,
      actualCounts.portfolioPaperOrderSimulations
    ],
    ["promotionCandidates", artifactCounts.promotionCandidates ?? 0, actualCounts.promotionCandidates],
    ["aiReviewRuns", artifactCounts.aiReviewRuns ?? 0, actualCounts.aiReviewRuns],
    ["aiReviewRunsV2", artifactCounts.aiReviewRunsV2 ?? 0, actualCounts.aiReviewRunsV2],
    ["aiReviewDecisions", artifactCounts.aiReviewDecisions ?? 0, actualCounts.aiReviewDecisions],
    ["auditEvents", artifactCounts.auditEvents ?? 0, actualCounts.auditEvents],
    ["stage4PortfolioWorkflows", artifactCounts.stage4PortfolioWorkflows ?? 0, actualCounts.stage4PortfolioWorkflows],
    ["stage5ShadowSessions", artifactCounts.stage5ShadowSessions ?? 0, actualCounts.stage5ShadowSessions],
    [
      "stage5SandboxReadinessDecisions",
      artifactCounts.stage5SandboxReadinessDecisions ?? 0,
      actualCounts.stage5SandboxReadinessDecisions
    ],
    [
      "stage5SandboxAuthorizationPreflights",
      artifactCounts.stage5SandboxAuthorizationPreflights ?? 0,
      actualCounts.stage5SandboxAuthorizationPreflights
    ],
    [
      "stage5SandboxAuthorizationReviews",
      artifactCounts.stage5SandboxAuthorizationReviews ?? 0,
      actualCounts.stage5SandboxAuthorizationReviews
    ],
    ["handoffNotes", artifactCounts.handoffNotes ?? 0, actualCounts.handoffNotes]
  ];

  return pairs
    .filter(([, manifestCount, packageCount]) => manifestCount !== packageCount)
    .map(([label, manifestCount, packageCount]) => `${label} ${manifestCount}/${packageCount}`);
}
