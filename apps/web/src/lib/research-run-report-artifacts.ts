import {
  buildAuditEvidenceReportMarkdown,
  buildBacktestReportMarkdown,
  buildBacktestRunComparisonMatrixRows,
  buildPortfolioBacktestDiagnosticRows,
  buildStrategyExperimentEvidenceSummary,
  buildTerminalWorkspace,
  workspaceFromResearchRunAudit,
  type AuditEvidenceSummary,
  type ResearchRunAudit,
  type StrategyExperimentDetail,
  type TerminalWorkspace
} from "./terminal-workbench";
import { buildApiUrl, defaultFetcher, type WorkspaceFetcher } from "./terminal-api-http";
import { isCoreErrorPayload, type AuditEventRecord } from "./terminal-api-contract";
import { isAuditReportSignaturePayload, type AuditReportSignatureResult } from "./audit-event-transport";
import type { PortfolioBacktestRun } from "./portfolio-transport";
import {
  isResearchRunExportReportSignature,
  type ResearchRunExportAuditEvidenceSummary,
  type ResearchRunExportAuditReport,
  type ResearchRunExportBacktestReport,
  type ResearchRunExportPackage,
  type ResearchRunExportReportSignature
} from "./research-run-export-contract";

export function buildAuditReportVerifyPackageUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/reports/verify-package");
}

export function buildResearchRunExportAuditEvidenceSummary(
  summary: AuditEvidenceSummary,
  generatedAt = new Date().toISOString()
): ResearchRunExportAuditEvidenceSummary {
  const importVerificationBuckets = summary.importVerificationBuckets ?? [];
  const importVerificationVerifiedCount = summary.importVerificationVerifiedCount ?? 0;
  const importVerificationInvalidCount = summary.importVerificationInvalidCount ?? 0;
  const importPolicyBlockerBuckets = summary.importPolicyBlockerBuckets ?? [];
  const importPolicyBlockedCount = summary.importPolicyBlockedCount ?? 0;
  return {
    kind: "aiqt.auditEvidenceSummary",
    schemaVersion: 1,
    runId: summary.runId,
    generatedAt,
    auditQuery: summary.auditQuery,
    packageQuery: summary.packageQuery,
    importDiffQuery: summary.importDiffQuery,
    focusQuery: summary.focusQuery,
    deepLinkStatus: summary.deepLinkStatus,
    deepLinkError: summary.deepLinkError,
    package: {
      ready: summary.packageReadyCount,
      missing: summary.packageMissingCount,
      blocked: summary.packageBlockedCount,
      matched: summary.packageMatchedCount,
      total: summary.packageTotalCount
    },
    importDiff: {
      changes: summary.importDiffChangeCount,
      adds: summary.importDiffAddCount,
      blocked: summary.importDiffBlockedCount,
      matched: summary.importDiffMatchedCount,
      total: summary.importDiffTotalCount
    },
    importVerification: {
      verified: importVerificationVerifiedCount,
      invalid: importVerificationInvalidCount,
      buckets: importVerificationBuckets
    },
    importPolicyBlockers: {
      blocked: importPolicyBlockedCount,
      buckets: importPolicyBlockerBuckets
    },
    copyText: summary.copyText
  };
}

export function withResearchRunExportAuditEvidenceSummary(
  exportPackage: ResearchRunExportPackage,
  summary: AuditEvidenceSummary,
  generatedAt?: string
): ResearchRunExportPackage {
  return {
    ...exportPackage,
    auditEvidenceSummary: buildResearchRunExportAuditEvidenceSummary(summary, generatedAt)
  };
}

export async function buildResearchRunExportAuditReport(
  summary: AuditEvidenceSummary,
  generatedAt = new Date().toISOString()
): Promise<ResearchRunExportAuditReport> {
  const contentMarkdown = buildAuditEvidenceReportMarkdown(summary, { generatedAt });
  return {
    kind: "aiqt.auditReport",
    schemaVersion: 1,
    runId: summary.runId,
    generatedAt,
    format: "text/markdown",
    fileName: `${sanitizeDownloadFileName(summary.runId)}-audit-evidence-report.md`,
    contentSha256: {
      algorithm: "sha256",
      hash: await sha256TextHex(contentMarkdown)
    },
    contentMarkdown,
    evidenceSummary: buildResearchRunExportAuditEvidenceSummary(summary, generatedAt)
  };
}

export async function buildResearchRunExportBacktestReport(
  exportPackage: ResearchRunExportPackage,
  runHistory: ResearchRunAudit[] = [],
  generatedAt = new Date().toISOString(),
  experiment: StrategyExperimentDetail | null = null
): Promise<ResearchRunExportBacktestReport | null> {
  const run = exportPackage.researchRun;
  if (!run.dataSnapshot) {
    return null;
  }

  const comparisonHistory = [run, ...runHistory.filter((candidate) => candidate.runId !== run.runId)];
  const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), run);
  const contentMarkdown = buildBacktestReportMarkdown(workspace, comparisonHistory, experiment);
  if (!contentMarkdown) {
    return null;
  }

  return {
    kind: "aiqt.backtestReport",
    schemaVersion: 1,
    runId: run.runId,
    generatedAt,
    format: "text/markdown",
    fileName: `${sanitizeDownloadFileName(run.runId)}-backtest-report.md`,
    contentSha256: {
      algorithm: "sha256",
      hash: await sha256TextHex(contentMarkdown)
    },
    contentMarkdown,
    market: run.market,
    symbol: run.symbol,
    timeframe: run.timeframe,
    strategyRevision: run.strategyRevision,
    executionMode: run.executionMode,
    dataRows: run.dataRows,
    runComparisonRows: buildBacktestRunComparisonMatrixRows(comparisonHistory, run.runId).length,
    boundary: "historical audited evidence only; no investment advice"
  };
}

export function buildAuditEvidenceReportAuditEvent(
  auditReport: ResearchRunExportAuditReport,
  summary: AuditEvidenceSummary
): AuditEventRecord {
  const shortHash = auditReport.contentSha256.hash.slice(0, 16);
  const importVerificationBuckets = summary.importVerificationBuckets ?? [];
  const latestImportVerification = importVerificationBuckets[0] ?? null;
  return {
    schemaVersion: 1,
    eventId: `audit-report-${sanitizeDownloadFileName(auditReport.runId)}-${shortHash}`,
    eventType: "audit_evidence_report",
    runId: auditReport.runId,
    createdAt: auditReport.generatedAt,
    stage: "generated",
    source: "web",
    summary: `Audit evidence report generated for ${auditReport.runId}`,
    detail: `${auditReport.fileName} · sha256 ${auditReport.contentSha256.hash.slice(0, 12)} · focus ${
      summary.focusQuery || "none"
    }`,
    metadata: {
      artifactKind: auditReport.kind,
      fileName: auditReport.fileName,
      format: auditReport.format,
      contentSha256: auditReport.contentSha256.hash,
      contentSha256Algorithm: auditReport.contentSha256.algorithm,
      evidenceFocus: summary.focusQuery,
      auditQuery: summary.auditQuery,
      packageQuery: summary.packageQuery,
      importDiffQuery: summary.importDiffQuery,
      packageMatched: summary.packageMatchedCount,
      packageTotal: summary.packageTotalCount,
      importDiffBlocked: summary.importDiffBlockedCount,
      importDiffTotal: summary.importDiffTotalCount,
      importVerificationVerified: summary.importVerificationVerifiedCount ?? 0,
      importVerificationInvalid: summary.importVerificationInvalidCount ?? 0,
      importVerificationLatestStatus: latestImportVerification?.status ?? "",
      importVerificationLatestSource: latestImportVerification?.source ?? "",
      importVerificationLatestExportPath: latestImportVerification?.latestExportPath ?? "",
      importVerificationLatestReason: latestImportVerification?.latestReason ?? "",
      deepLinkStatus: summary.deepLinkStatus,
      deepLinkError: summary.deepLinkError
    }
  };
}

export async function buildBacktestReportAuditEvent({
  experiment = null,
  generatedAt = new Date().toISOString(),
  markdown,
  runHistory = [],
  workspace
}: {
  experiment?: StrategyExperimentDetail | null;
  generatedAt?: string;
  markdown: string;
  runHistory?: ResearchRunAudit[];
  workspace: TerminalWorkspace;
}): Promise<AuditEventRecord | null> {
  const run = workspace.researchRun;
  if (!run) {
    return null;
  }

  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const fileName = `${sanitizeDownloadFileName(run.runId)}-backtest-report.md`;
  const auditedRun = runHistory.find((candidate) => candidate.runId === run.runId);
  const runComparisonRows = buildBacktestRunComparisonMatrixRows(runHistory, run.runId);
  const experimentEvidence = buildStrategyExperimentEvidenceSummary(workspace, experiment);

  return {
    schemaVersion: 1,
    eventId: `backtest-report-${sanitizeDownloadFileName(run.runId)}-${shortHash}`,
    eventType: "backtest_report",
    runId: run.runId,
    createdAt: generatedAt,
    stage: "generated",
    source: "web",
    summary: `Backtest Markdown report generated for ${run.runId}`,
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${runComparisonRows.length} comparable runs`,
    metadata: {
      artifactKind: "aiqt.backtestReport",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      market: auditedRun?.market ?? workspace.selectedInstrument.market,
      symbol: auditedRun?.symbol ?? workspace.selectedInstrument.symbol,
      timeframe: run.timeframe,
      strategyRevision: run.strategyRevision,
      executionMode: auditedRun?.executionMode ?? run.executionMode,
      dataRows: auditedRun?.dataRows ?? run.dataRows,
      runComparisonRows: runComparisonRows.length,
      hasRunComparisonMatrix: markdown.includes("## Run Comparison Matrix"),
      ...(experimentEvidence
        ? {
            strategyExperimentId: experimentEvidence.experimentId,
            strategyExperimentDefinitionHash: experimentEvidence.definitionHash,
            strategyExperimentResultHash: experimentEvidence.resultHash,
            strategyExperimentSelectedCandidateId: experimentEvidence.selectedCandidateId,
            strategyExperimentHoldoutStatus: experimentEvidence.holdoutStatus
          }
        : {}),
      boundary: "historical audited evidence only; no investment advice"
    }
  };
}

export async function buildPortfolioBacktestReportAuditEvent({
  baseRunId,
  generatedAt = new Date().toISOString(),
  markdown,
  portfolio
}: {
  baseRunId?: string | null;
  generatedAt?: string;
  markdown: string;
  portfolio?: PortfolioBacktestRun | null;
}): Promise<AuditEventRecord | null> {
  const anchoredRunId = baseRunId?.trim();
  if (!anchoredRunId || !portfolio || !markdown.trim()) {
    return null;
  }

  const contentSha256 = await sha256TextHex(markdown);
  const shortHash = contentSha256.slice(0, 16);
  const fileName = `${sanitizeDownloadFileName(anchoredRunId)}-${sanitizeDownloadFileName(
    portfolio.market
  )}-${sanitizeDownloadFileName(portfolio.timeframe)}-portfolio-report.md`;
  const diagnostics = buildPortfolioBacktestDiagnosticRows(portfolio);
  const negativeContributionLegs = portfolio.legs.filter((leg) => leg.contributionValue < 0).length;
  const incompleteDataQuality =
    !portfolio.dataQuality.isComplete || portfolio.legs.some((leg) => !leg.dataQuality.isComplete);

  return {
    schemaVersion: 1,
    eventId: `portfolio-report-${sanitizeDownloadFileName(anchoredRunId)}-${shortHash}`,
    eventType: "portfolio_report",
    runId: anchoredRunId,
    createdAt: generatedAt,
    stage: "generated",
    source: "web",
    summary: `Portfolio Markdown report generated for ${portfolio.name}`,
    detail: `${fileName} · sha256 ${contentSha256.slice(0, 12)} · ${portfolio.legs.length} legs · ${
      diagnostics.length
    } diagnostics`,
    metadata: {
      artifactKind: "aiqt.portfolioReport",
      fileName,
      format: "text/markdown",
      contentSha256,
      contentSha256Algorithm: "sha256",
      portfolioName: portfolio.name,
      market: portfolio.market,
      timeframe: portfolio.timeframe,
      initialCash: portfolio.initialCash,
      cashWeight: portfolio.cashWeight,
      legCount: portfolio.legs.length,
      equityRows: portfolio.equityCurve.length,
      allocationEventCount: portfolio.allocationEvents?.length ?? 0,
      rebalanceEventCount: portfolio.rebalanceEvents?.length ?? 0,
      tradeReviewEventCount: portfolio.tradeReviewEvents?.length ?? 0,
      preTradeRiskCheckCount: portfolio.preTradeRiskChecks?.length ?? 0,
      paperOrderEventCount: portfolio.paperOrderEvents?.length ?? 0,
      covarianceRiskContributionCount: portfolio.covarianceRisk?.contributions.length ?? 0,
      covarianceRiskAnnualizedVolatilityPct: portfolio.covarianceRisk?.annualizedVolatilityPct ?? null,
      diagnosticsCount: diagnostics.length,
      incompleteDataQuality,
      negativeContributionLegs,
      boundary: "historical audited portfolio evidence only; no investment advice"
    }
  };
}

export async function withResearchRunExportAuditEvidenceArtifacts(
  exportPackage: ResearchRunExportPackage,
  summary: AuditEvidenceSummary,
  generatedAt?: string,
  runHistory: ResearchRunAudit[] = [],
  experiment: StrategyExperimentDetail | null = null
): Promise<ResearchRunExportPackage> {
  const resolvedGeneratedAt = generatedAt ?? new Date().toISOString();
  const backtestReport = await buildResearchRunExportBacktestReport(
    exportPackage,
    runHistory,
    resolvedGeneratedAt,
    experiment
  );
  return {
    ...exportPackage,
    auditEvidenceSummary: buildResearchRunExportAuditEvidenceSummary(summary, resolvedGeneratedAt),
    auditReport: await buildResearchRunExportAuditReport(summary, resolvedGeneratedAt),
    ...(backtestReport ? { backtestReport } : {})
  };
}

export function withResearchRunExportReportSignatures(
  exportPackage: ResearchRunExportPackage,
  auditEvents: AuditEventRecord[]
): ResearchRunExportPackage {
  const auditReportSignature = researchRunExportReportSignatureFromEvents({
    artifactKind: "aiqt.auditReport",
    eventType: "audit_evidence_report",
    events: auditEvents,
    report: exportPackage.auditReport
  });
  const backtestReportSignature = researchRunExportReportSignatureFromEvents({
    artifactKind: "aiqt.backtestReport",
    eventType: "backtest_report",
    events: auditEvents,
    report: exportPackage.backtestReport
  });

  return {
    ...exportPackage,
    ...(exportPackage.auditReport && auditReportSignature
      ? { auditReport: { ...exportPackage.auditReport, signature: auditReportSignature } }
      : {}),
    ...(exportPackage.backtestReport && backtestReportSignature
      ? { backtestReport: { ...exportPackage.backtestReport, signature: backtestReportSignature } }
      : {})
  };
}

function researchRunExportReportSignatureFromEvents({
  artifactKind,
  eventType,
  events,
  report
}: {
  artifactKind: ResearchRunExportAuditReport["kind"] | ResearchRunExportBacktestReport["kind"];
  eventType: "audit_evidence_report" | "backtest_report";
  events: AuditEventRecord[];
  report: ResearchRunExportAuditReport | ResearchRunExportBacktestReport | undefined;
}): ResearchRunExportReportSignature | undefined {
  if (!report) {
    return undefined;
  }

  for (const event of events) {
    const signature = event.metadata.signature;
    if (
      event.eventType === eventType &&
      event.runId === report.runId &&
      auditEventMetadataText(event.metadata, "artifactKind") === artifactKind &&
      auditEventMetadataText(event.metadata, "fileName") === report.fileName &&
      auditEventMetadataText(event.metadata, "contentSha256") === report.contentSha256.hash &&
      auditEventMetadataText(event.metadata, "contentSha256Algorithm") === report.contentSha256.algorithm &&
      isResearchRunExportReportSignature(signature)
    ) {
      return { ...signature, eventId: event.eventId };
    }
  }

  return undefined;
}

function auditEventMetadataText(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  return typeof value === "string" ? value : "";
}

export async function verifyResearchRunExportReportSignature(
  baseUrl: string,
  report: ResearchRunExportAuditReport | ResearchRunExportBacktestReport,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditReportSignatureResult> {
  return mutateAuditReportPackageSignature(buildAuditReportVerifyPackageUrl(baseUrl), report, fetcher);
}

export async function withVerifiedResearchRunExportPackageReportSignatures(
  baseUrl: string,
  exportPackage: ResearchRunExportPackage,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunExportPackage> {
  const [auditReport, backtestReport] = await Promise.all([
    verifyResearchRunExportPackageReportIfNeeded(baseUrl, exportPackage.auditReport, fetcher),
    verifyResearchRunExportPackageReportIfNeeded(baseUrl, exportPackage.backtestReport, fetcher)
  ]);
  return {
    ...exportPackage,
    ...(auditReport ? { auditReport } : {}),
    ...(backtestReport ? { backtestReport } : {})
  };
}

async function verifyResearchRunExportPackageReportIfNeeded<
  TReport extends ResearchRunExportAuditReport | ResearchRunExportBacktestReport
>(
  baseUrl: string,
  report: TReport | undefined,
  fetcher: WorkspaceFetcher
): Promise<TReport | undefined> {
  if (!report || !researchRunExportReportSignatureNeedsVerification(report.signature)) {
    return report;
  }
  const result = await verifyResearchRunExportReportSignature(baseUrl, report, fetcher);
  if (result.source !== "core" || !isResearchRunExportReportSignature(result.signature) || !result.verification) {
    return report;
  }
  return {
    ...report,
    signature: {
      ...result.signature,
      importVerificationReason: result.verification.reason,
      importVerificationSource: "local-core",
      importVerificationStatus: result.verification.status,
      ...(result.signature.verifiedAt ? { importVerifiedAt: result.signature.verifiedAt } : {})
    }
  };
}

function researchRunExportReportSignatureNeedsVerification(
  signature: ResearchRunExportReportSignature | undefined
): boolean {
  return (
    Boolean(signature?.eventId?.trim()) &&
    (signature?.status === "signed" || signature?.status === "verified")
  );
}

async function mutateAuditReportPackageSignature(
  url: string,
  report: ResearchRunExportAuditReport | ResearchRunExportBacktestReport,
  fetcher: WorkspaceFetcher
): Promise<AuditReportSignatureResult> {
  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report })
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isAuditReportSignaturePayload(payload)) {
        return {
          event: payload.event,
          signature: payload.signature,
          verification: payload.verification,
          source: "core",
          error: payload.verification.reason
        };
      }
      if (isCoreErrorPayload(payload)) {
        return {
          source: "core",
          error: payload.detail ?? payload.error
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isAuditReportSignaturePayload(payload)) {
      throw new Error("Invalid package report signature contract");
    }
    return {
      event: payload.event,
      signature: payload.signature,
      verification: payload.verification,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown package report signature verification error"
    };
  }
}

export async function sha256TextHex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function sanitizeDownloadFileName(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/gu, "-").replace(/^-+|-+$/gu, "");
  return normalized || "audit-run";
}
