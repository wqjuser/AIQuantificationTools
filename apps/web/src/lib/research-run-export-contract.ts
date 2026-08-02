import type { AuditEvidenceSummary, Market, ResearchRunAudit } from "./terminal-workbench";
import { isAiReviewDecisionChain, type AiReviewDecision } from "./ai-review-stage3";
import {
  hasExactObjectKeys,
  isAuditEventRecord,
  isMarket,
  isPlainRecord,
  isTimeframe,
  type AuditEventRecord
} from "./terminal-api-contract";
import type { ResearchTimeframe } from "./workspace-transport";
import { isResearchRunAudit } from "./research-run-transport";
import {
  isPaperExecutionRecord,
  isPromotionCandidateRecord,
  type PaperExecutionRecord,
  type PromotionCandidateRecord
} from "./paper-execution-transport";
import {
  isExecutionAdapterPaperExecutionResult,
  type ExecutionAdapterPaperExecutionResult
} from "./execution-adapter-paper-validation-transport";
import {
  isPortfolioPaperOrderApproval,
  isPortfolioPaperOrderBatch,
  isPortfolioPaperOrderSimulation,
  type PortfolioPaperOrderApproval,
  type PortfolioPaperOrderBatch,
  type PortfolioPaperOrderSimulation
} from "./portfolio-transport";
import {
  isAiReviewDecisionArchiveEnvelope,
  isAiReviewRunRecordEnvelope,
  isAiReviewRunV2ArchiveEnvelope,
  type AiReviewDecisionArchiveEnvelope,
  type AiReviewRunRecordEnvelope,
  type AiReviewRunV2ArchiveEnvelope
} from "./ai-review-run-transport";
import { isHandoffNote, type HandoffNote } from "./handoff-note-transport";

export interface ResearchRunExportManifest {
  runId: string;
  createdAt: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  strategyRevision: string;
  dataHash: string;
  dataRows: number;
  executionMode: string;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary?: boolean;
  liveOrderSubmitted?: boolean;
  orderSubmissionAllowed?: boolean;
  orderSubmissionEnabled?: boolean;
  orderSubmitted?: boolean;
  route?: string;
  routeExecuted?: boolean;
  routeMode?: string;
  executionRoute?: string;
  artifactCounts: {
    bars: number;
    trades: number;
    equityPoints: number;
    decisions: number;
    aiRisks: number;
    paperExecutions?: number;
    adapterPaperExecutions?: number;
    portfolioPaperOrderBatches?: number;
    portfolioPaperOrderApprovals?: number;
    portfolioPaperOrderSimulations?: number;
    promotionCandidates?: number;
    researchNotes?: number;
    aiReviewRuns?: number;
    aiReviewRunsV2?: number;
    aiReviewDecisions?: number;
    auditEvents?: number;
    stage4PortfolioWorkflows?: number;
    stage5ShadowSessions?: number;
    handoffNotes?: number;
  };
}

export interface ResearchRunExecutionGateExport {
  id: string;
  label: string;
  passed: boolean;
  reason: string;
}

export interface ResearchRunExecutionHandoff {
  mode: string;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  requiredGates: ResearchRunExecutionGateExport[];
}

export interface ResearchRunExportIntegrity {
  algorithm: "sha256";
  hash: string;
}

export interface ResearchRunExportAuditEvidenceSummary {
  kind: "aiqt.auditEvidenceSummary";
  schemaVersion: 1;
  runId: string;
  generatedAt: string;
  auditQuery: string;
  packageQuery: string;
  importDiffQuery: string;
  focusQuery: string;
  deepLinkStatus: AuditEvidenceSummary["deepLinkStatus"];
  deepLinkError: string | null;
  package: {
    ready: number;
    missing: number;
    blocked: number;
    matched: number;
    total: number;
  };
  importDiff: {
    changes: number;
    adds: number;
    blocked: number;
    matched: number;
    total: number;
  };
  importVerification?: {
    verified: number;
    invalid: number;
    buckets: AuditEvidenceSummary["importVerificationBuckets"];
  };
  importPolicyBlockers?: {
    blocked: number;
    buckets: AuditEvidenceSummary["importPolicyBlockerBuckets"];
  };
  copyText: string;
}

export interface ResearchRunExportReportSignature {
  [key: string]: string | undefined;
  status: "unsigned" | "signed" | "verified" | "revoked" | "invalid";
  algorithm?: string;
  chainId?: string;
  eventId?: string;
  importVerificationReason?: string;
  importVerificationSource?: "local-core";
  importVerificationStatus?: "verified" | "invalid";
  importVerifiedAt?: string;
  invalidReason?: string;
  keyFingerprint?: string;
  keyId?: string;
  revokedAt?: string;
  revokedReason?: string;
  signedAt?: string;
  signer?: string;
  value?: string;
  verifiedAt?: string;
}

export interface ResearchRunExportAuditReport {
  kind: "aiqt.auditReport";
  schemaVersion: 1;
  runId: string;
  generatedAt: string;
  format: "text/markdown";
  fileName: string;
  contentSha256: ResearchRunExportIntegrity;
  contentMarkdown: string;
  signature?: ResearchRunExportReportSignature;
  evidenceSummary: ResearchRunExportAuditEvidenceSummary;
}

export interface ResearchRunExportBacktestReport {
  kind: "aiqt.backtestReport";
  schemaVersion: 1;
  runId: string;
  generatedAt: string;
  format: "text/markdown";
  fileName: string;
  contentSha256: ResearchRunExportIntegrity;
  contentMarkdown: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  strategyRevision: string;
  executionMode: string;
  dataRows: number;
  runComparisonRows: number;
  signature?: ResearchRunExportReportSignature;
  boundary: "historical audited evidence only; no investment advice";
}

export interface ResearchRunExportP0PackageCriterion {
  id: string;
  label: string;
  status: "passed" | "review" | "blocked";
  detail: string;
  evidence: string;
  evidencePath: string;
}

export interface ResearchRunExportP0PackageCompleteness {
  kind: "aiqt.p0PackageCompleteness";
  schemaVersion: 1;
  runId: string;
  ready: boolean;
  status: "complete" | "review" | "blocked";
  passed: number;
  review: number;
  blocked: number;
  total: number;
  progressPct: number;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  summary: string;
  criteria: ResearchRunExportP0PackageCriterion[];
}

export interface ResearchRunExportPackage {
  kind: "aiqt.researchRun.export";
  packageVersion: number;
  exportedAt: string;
  integrity?: ResearchRunExportIntegrity;
  manifest: ResearchRunExportManifest;
  researchRun: ResearchRunAudit;
  executionHandoff: ResearchRunExecutionHandoff;
  paperExecutions?: PaperExecutionRecord[];
  adapterPaperExecutions?: ExecutionAdapterPaperExecutionResult[];
  portfolioPaperOrderBatches?: PortfolioPaperOrderBatch[];
  portfolioPaperOrderApprovals?: PortfolioPaperOrderApproval[];
  portfolioPaperOrderSimulations?: PortfolioPaperOrderSimulation[];
  promotionCandidate?: PromotionCandidateRecord | null;
  aiReviewRuns?: AiReviewRunRecordEnvelope[];
  aiReviewRunsV2?: AiReviewRunV2ArchiveEnvelope[];
  aiReviewDecisions?: AiReviewDecisionArchiveEnvelope[];
  auditEvents?: AuditEventRecord[];
  handoffNotes?: HandoffNote[];
  p0PackageCompleteness?: ResearchRunExportP0PackageCompleteness;
  auditEvidenceSummary?: ResearchRunExportAuditEvidenceSummary;
  auditReport?: ResearchRunExportAuditReport;
  backtestReport?: ResearchRunExportBacktestReport;
}

export function normalizeResearchRunExportPackagePayload(value: unknown): ResearchRunExportPackage | null {
  if (isResearchRunExportPackage(value)) {
    return stripUntrustedPackageReportVerification(value);
  }
  if (isResearchRunExportPayload(value)) {
    return stripUntrustedPackageReportVerification(value.export);
  }
  return null;
}

function stripUntrustedPackageReportVerification(exportPackage: ResearchRunExportPackage): ResearchRunExportPackage {
  return {
    ...exportPackage,
    ...(exportPackage.auditReport
      ? { auditReport: stripUntrustedPackageReportSignatureVerification(exportPackage.auditReport) }
      : {}),
    ...(exportPackage.backtestReport
      ? { backtestReport: stripUntrustedPackageReportSignatureVerification(exportPackage.backtestReport) }
      : {})
  };
}

function stripUntrustedPackageReportSignatureVerification<
  TReport extends ResearchRunExportAuditReport | ResearchRunExportBacktestReport
>(report: TReport): TReport {
  if (!report.signature) {
    return report;
  }
  const signature = { ...report.signature };
  delete signature.importVerificationReason;
  delete signature.importVerificationSource;
  delete signature.importVerificationStatus;
  delete signature.importVerifiedAt;
  return { ...report, signature } as TReport;
}

export function isResearchRunExportPackage(value: unknown): value is ResearchRunExportPackage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const exportPackage = value as Partial<ResearchRunExportPackage>;
  return (
    exportPackage.kind === "aiqt.researchRun.export" &&
    typeof exportPackage.packageVersion === "number" &&
    typeof exportPackage.exportedAt === "string" &&
    (exportPackage.integrity === undefined || isResearchRunExportIntegrity(exportPackage.integrity)) &&
    isResearchRunExportManifest(exportPackage.manifest) &&
    isResearchRunAudit(exportPackage.researchRun) &&
    Boolean(exportPackage.researchRun.dataSnapshot) &&
    isResearchRunExecutionHandoff(exportPackage.executionHandoff) &&
    (exportPackage.paperExecutions === undefined ||
      (Array.isArray(exportPackage.paperExecutions) && exportPackage.paperExecutions.every(isPaperExecutionRecord))) &&
    (exportPackage.adapterPaperExecutions === undefined ||
      (Array.isArray(exportPackage.adapterPaperExecutions) &&
        exportPackage.adapterPaperExecutions.every(isExecutionAdapterPaperExecutionResult))) &&
    (exportPackage.portfolioPaperOrderBatches === undefined ||
      (Array.isArray(exportPackage.portfolioPaperOrderBatches) &&
        exportPackage.portfolioPaperOrderBatches.every(isPortfolioPaperOrderBatch))) &&
    (exportPackage.portfolioPaperOrderApprovals === undefined ||
      (Array.isArray(exportPackage.portfolioPaperOrderApprovals) &&
        exportPackage.portfolioPaperOrderApprovals.every(isPortfolioPaperOrderApproval))) &&
    (exportPackage.portfolioPaperOrderSimulations === undefined ||
      (Array.isArray(exportPackage.portfolioPaperOrderSimulations) &&
        exportPackage.portfolioPaperOrderSimulations.every(isPortfolioPaperOrderSimulation))) &&
    (exportPackage.promotionCandidate === undefined ||
      exportPackage.promotionCandidate === null ||
      isPromotionCandidateRecord(exportPackage.promotionCandidate)) &&
    (exportPackage.aiReviewRuns === undefined ||
      (Array.isArray(exportPackage.aiReviewRuns) && exportPackage.aiReviewRuns.every(isAiReviewRunRecordEnvelope))) &&
    (exportPackage.aiReviewRunsV2 === undefined ||
      (Array.isArray(exportPackage.aiReviewRunsV2) &&
        exportPackage.aiReviewRunsV2.every((item) =>
          isAiReviewRunV2ArchiveEnvelope(item, exportPackage.manifest?.runId)
        ))) &&
    (exportPackage.aiReviewDecisions === undefined ||
      (Array.isArray(exportPackage.aiReviewDecisions) &&
        exportPackage.aiReviewDecisions.every(isAiReviewDecisionArchiveEnvelope))) &&
    isAiReviewStage3ArchiveBindingValid(exportPackage) &&
    isResearchRunExportPaperBoundary(exportPackage) &&
    (exportPackage.auditEvents === undefined ||
      (Array.isArray(exportPackage.auditEvents) && exportPackage.auditEvents.every(isAuditEventRecord))) &&
    (exportPackage.handoffNotes === undefined ||
      (Array.isArray(exportPackage.handoffNotes) && exportPackage.handoffNotes.every(isHandoffNote))) &&
    (exportPackage.p0PackageCompleteness === undefined ||
      isResearchRunExportP0PackageCompleteness(exportPackage.p0PackageCompleteness)) &&
    (exportPackage.auditEvidenceSummary === undefined ||
      isResearchRunExportAuditEvidenceSummary(exportPackage.auditEvidenceSummary)) &&
    (exportPackage.auditReport === undefined || isResearchRunExportAuditReport(exportPackage.auditReport)) &&
    (exportPackage.backtestReport === undefined || isResearchRunExportBacktestReport(exportPackage.backtestReport))
  );
}

export function isResearchRunExportPayload(value: unknown): value is { export: ResearchRunExportPackage } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { export?: unknown };
  return isResearchRunExportPackage(payload.export);
}

function isResearchRunExportIntegrity(value: unknown): value is ResearchRunExportIntegrity {
  if (!value || typeof value !== "object") {
    return false;
  }
  const integrity = value as Partial<ResearchRunExportIntegrity>;
  return integrity.algorithm === "sha256" && typeof integrity.hash === "string" && /^[a-f0-9]{64}$/i.test(integrity.hash);
}

function isResearchRunExportAuditEvidenceSummary(value: unknown): value is ResearchRunExportAuditEvidenceSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<ResearchRunExportAuditEvidenceSummary>;
  return (
    summary.kind === "aiqt.auditEvidenceSummary" &&
    summary.schemaVersion === 1 &&
    typeof summary.runId === "string" &&
    typeof summary.generatedAt === "string" &&
    typeof summary.auditQuery === "string" &&
    typeof summary.packageQuery === "string" &&
    typeof summary.importDiffQuery === "string" &&
    typeof summary.focusQuery === "string" &&
    isAuditEvidenceDeepLinkStatus(summary.deepLinkStatus) &&
    (summary.deepLinkError === null || typeof summary.deepLinkError === "string") &&
    isAuditEvidenceCountGroup(summary.package) &&
    isAuditEvidenceImportDiffCountGroup(summary.importDiff) &&
    (summary.importVerification === undefined ||
      isAuditEvidenceImportVerificationGroup(summary.importVerification)) &&
    (summary.importPolicyBlockers === undefined ||
      isAuditEvidenceImportPolicyBlockerGroup(summary.importPolicyBlockers)) &&
    typeof summary.copyText === "string"
  );
}

function isResearchRunExportAuditReport(value: unknown): value is ResearchRunExportAuditReport {
  if (!value || typeof value !== "object") {
    return false;
  }
  const report = value as Partial<ResearchRunExportAuditReport>;
  return (
    report.kind === "aiqt.auditReport" &&
    report.schemaVersion === 1 &&
    typeof report.runId === "string" &&
    typeof report.generatedAt === "string" &&
    report.format === "text/markdown" &&
    typeof report.fileName === "string" &&
    isResearchRunExportIntegrity(report.contentSha256) &&
    typeof report.contentMarkdown === "string" &&
    (report.signature === undefined || isResearchRunExportReportSignature(report.signature)) &&
    isResearchRunExportAuditEvidenceSummary(report.evidenceSummary)
  );
}

function isResearchRunExportBacktestReport(value: unknown): value is ResearchRunExportBacktestReport {
  if (!value || typeof value !== "object") {
    return false;
  }
  const report = value as Partial<ResearchRunExportBacktestReport>;
  return (
    report.kind === "aiqt.backtestReport" &&
    report.schemaVersion === 1 &&
    typeof report.runId === "string" &&
    typeof report.generatedAt === "string" &&
    report.format === "text/markdown" &&
    typeof report.fileName === "string" &&
    isResearchRunExportIntegrity(report.contentSha256) &&
    typeof report.contentMarkdown === "string" &&
    isMarket(report.market) &&
    typeof report.symbol === "string" &&
    isTimeframe(report.timeframe) &&
    typeof report.strategyRevision === "string" &&
    typeof report.executionMode === "string" &&
    typeof report.dataRows === "number" &&
    typeof report.runComparisonRows === "number" &&
    (report.signature === undefined || isResearchRunExportReportSignature(report.signature)) &&
    report.boundary === "historical audited evidence only; no investment advice"
  );
}

export function isResearchRunExportReportSignature(value: unknown): value is ResearchRunExportReportSignature {
  if (!isPlainRecord(value) || hasForbiddenSignatureMaterial(value)) {
    return false;
  }
  const signature = value as Partial<ResearchRunExportReportSignature>;
  const status = signature.status;
  const stringFields = [
    "algorithm",
    "chainId",
    "eventId",
    "importVerificationReason",
    "importVerificationSource",
    "importVerificationStatus",
    "importVerifiedAt",
    "invalidReason",
    "keyFingerprint",
    "keyId",
    "revokedAt",
    "revokedReason",
    "signedAt",
    "signer",
    "value",
    "verifiedAt"
  ] as const;
  return (
    (status === "unsigned" ||
      status === "signed" ||
      status === "verified" ||
      status === "revoked" ||
      status === "invalid") &&
    stringFields.every((field) => signature[field] === undefined || typeof signature[field] === "string")
  );
}

function hasForbiddenSignatureMaterial(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(hasForbiddenSignatureMaterial);
  }
  if (!isPlainRecord(value)) {
    return false;
  }
  const forbiddenKeys = new Set([
    "accesstoken",
    "apikey",
    "passphrase",
    "password",
    "privatekey",
    "rawprivatekey",
    "rawsecret",
    "refreshtoken",
    "secret"
  ]);
  return Object.entries(value).some(([key, nested]) => {
    const normalizedKey = key.toLowerCase().replace(/[-_\s]/gu, "");
    return forbiddenKeys.has(normalizedKey) || hasForbiddenSignatureMaterial(nested);
  });
}

function isAuditEvidenceDeepLinkStatus(value: unknown): value is ResearchRunExportAuditEvidenceSummary["deepLinkStatus"] {
  return value === "none" || value === "idle" || value === "loading" || value === "loaded" || value === "failed";
}

function isAuditEvidenceCountGroup(
  value: unknown
): value is ResearchRunExportAuditEvidenceSummary["package"] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const counts = value as Partial<ResearchRunExportAuditEvidenceSummary["package"]>;
  return (
    typeof counts.ready === "number" &&
    typeof counts.missing === "number" &&
    typeof counts.blocked === "number" &&
    typeof counts.matched === "number" &&
    typeof counts.total === "number"
  );
}

function isAuditEvidenceImportDiffCountGroup(
  value: unknown
): value is ResearchRunExportAuditEvidenceSummary["importDiff"] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const counts = value as Partial<ResearchRunExportAuditEvidenceSummary["importDiff"]>;
  return (
    typeof counts.changes === "number" &&
    typeof counts.adds === "number" &&
    typeof counts.blocked === "number" &&
    typeof counts.matched === "number" &&
    typeof counts.total === "number"
  );
}

function isAuditEvidenceImportVerificationGroup(
  value: unknown
): value is NonNullable<ResearchRunExportAuditEvidenceSummary["importVerification"]> {
  if (!value || typeof value !== "object") {
    return false;
  }
  type ImportVerificationGroup = NonNullable<ResearchRunExportAuditEvidenceSummary["importVerification"]>;
  const group = value as Partial<ImportVerificationGroup>;
  return (
    typeof group.verified === "number" &&
    typeof group.invalid === "number" &&
    Array.isArray(group.buckets) &&
    group.buckets.every((bucket) => {
      if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) {
        return false;
      }
      const item = bucket as Partial<ImportVerificationGroup["buckets"][number]>;
      return (
        typeof item.count === "number" &&
        typeof item.latestExportPath === "string" &&
        typeof item.latestReason === "string" &&
        item.source === "local-core" &&
        (item.status === "verified" || item.status === "invalid")
      );
    })
  );
}

function isAuditEvidenceImportPolicyBlockerGroup(
  value: unknown
): value is NonNullable<ResearchRunExportAuditEvidenceSummary["importPolicyBlockers"]> {
  if (!value || typeof value !== "object") {
    return false;
  }
  type ImportPolicyBlockerGroup = NonNullable<ResearchRunExportAuditEvidenceSummary["importPolicyBlockers"]>;
  const group = value as Partial<ImportPolicyBlockerGroup>;
  const categories = new Set([
    "import-verification",
    "report-signature",
    "package-integrity",
    "artifact-counts",
    "live-boundary",
    "data-snapshot",
    "unknown"
  ]);
  return (
    typeof group.blocked === "number" &&
    Array.isArray(group.buckets) &&
    group.buckets.every((bucket) => {
      if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) {
        return false;
      }
      const item = bucket as Partial<ImportPolicyBlockerGroup["buckets"][number]>;
      return (
        typeof item.category === "string" &&
        categories.has(item.category) &&
        typeof item.count === "number" &&
        typeof item.label === "string" &&
        typeof item.latestDetail === "string" &&
        typeof item.latestExportPath === "string" &&
        typeof item.latestFileName === "string" &&
        typeof item.latestRunId === "string" &&
        (item.tone === "risk" || item.tone === "warning")
      );
    })
  );
}

function isResearchRunExportManifest(value: unknown): value is ResearchRunExportManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const manifest = value as Partial<ResearchRunExportManifest>;
  const counts = manifest.artifactCounts as Partial<ResearchRunExportManifest["artifactCounts"]> | undefined;
  return (
    typeof manifest.runId === "string" &&
    typeof manifest.createdAt === "string" &&
    isMarket(manifest.market) &&
    typeof manifest.symbol === "string" &&
    isTimeframe(manifest.timeframe) &&
    typeof manifest.strategyRevision === "string" &&
    typeof manifest.dataHash === "string" &&
    typeof manifest.dataRows === "number" &&
    typeof manifest.executionMode === "string" &&
    typeof manifest.paperOnly === "boolean" &&
    typeof manifest.liveTradingAllowed === "boolean" &&
    Boolean(counts) &&
    typeof counts?.bars === "number" &&
    typeof counts?.trades === "number" &&
    typeof counts?.equityPoints === "number" &&
    typeof counts?.decisions === "number" &&
    typeof counts?.aiRisks === "number" &&
    (counts?.paperExecutions === undefined || typeof counts.paperExecutions === "number") &&
    (counts?.adapterPaperExecutions === undefined || typeof counts.adapterPaperExecutions === "number") &&
    (counts?.portfolioPaperOrderBatches === undefined ||
      typeof counts.portfolioPaperOrderBatches === "number") &&
    (counts?.portfolioPaperOrderApprovals === undefined ||
      typeof counts.portfolioPaperOrderApprovals === "number") &&
    (counts?.portfolioPaperOrderSimulations === undefined ||
      typeof counts.portfolioPaperOrderSimulations === "number") &&
    (counts?.promotionCandidates === undefined || typeof counts.promotionCandidates === "number") &&
    (counts?.researchNotes === undefined || typeof counts.researchNotes === "number") &&
    (counts?.aiReviewRuns === undefined || typeof counts.aiReviewRuns === "number") &&
    (counts?.aiReviewRunsV2 === undefined || typeof counts.aiReviewRunsV2 === "number") &&
    (counts?.aiReviewDecisions === undefined || typeof counts.aiReviewDecisions === "number") &&
    (counts?.auditEvents === undefined || typeof counts.auditEvents === "number") &&
    (counts?.stage4PortfolioWorkflows === undefined ||
      (Number.isInteger(counts.stage4PortfolioWorkflows) && counts.stage4PortfolioWorkflows >= 0)) &&
    (counts?.stage5ShadowSessions === undefined ||
      (Number.isInteger(counts.stage5ShadowSessions) && counts.stage5ShadowSessions >= 0)) &&
    (counts?.handoffNotes === undefined || typeof counts.handoffNotes === "number")
  );
}

function isAiReviewStage3ArchiveBindingValid(
  exportPackage: Partial<ResearchRunExportPackage>
): boolean {
  const reviews = exportPackage.aiReviewRunsV2;
  const decisions = exportPackage.aiReviewDecisions;
  const counts = exportPackage.manifest?.artifactCounts;
  const hasReviews = reviews !== undefined || counts?.aiReviewRunsV2 !== undefined;
  const hasDecisions = decisions !== undefined || counts?.aiReviewDecisions !== undefined;
  if ((hasReviews && (!Array.isArray(reviews) || counts?.aiReviewRunsV2 !== reviews.length))
    || (hasDecisions && (!Array.isArray(decisions) || counts?.aiReviewDecisions !== decisions.length))) {
    return false;
  }
  if (!reviews && !decisions) {
    return true;
  }
  const reviewRecords = reviews?.map((item) => item.record) ?? [];
  const legacyReviewIds = exportPackage.aiReviewRuns?.map((item) => item.aiReviewId) ?? [];
  if (new Set(legacyReviewIds).size !== legacyReviewIds.length
    || reviewRecords.some((review) => legacyReviewIds.includes(review.aiReviewId))) {
    return false;
  }
  if (new Set(reviewRecords.map((review) => review.aiReviewId)).size !== reviewRecords.length) {
    return false;
  }
  const reviewById = new Map(reviewRecords.map((review) => [review.aiReviewId, review]));
  const decisionRecords = decisions?.map((item) => item.record) ?? [];
  if (new Set(decisionRecords.map((decision) => decision.decisionId)).size !== decisionRecords.length) {
    return false;
  }
  const groupedDecisions = new Map<string, AiReviewDecision[]>();
  for (const decision of decisionRecords) {
    const review = reviewById.get(decision.aiReviewId);
    if (!review
      || decision.reviewRecordHash !== review.recordHash
      || decision.evidenceHash !== review.evidenceHash) {
      return false;
    }
    groupedDecisions.set(decision.aiReviewId, [...(groupedDecisions.get(decision.aiReviewId) ?? []), decision]);
  }
  return [...groupedDecisions.values()].every(isAiReviewDecisionChain);
}

function isResearchRunExportPaperBoundary(
  exportPackage: Partial<ResearchRunExportPackage>
): boolean {
  const manifest = exportPackage.manifest;
  const researchRun = exportPackage.researchRun;
  const handoff = exportPackage.executionHandoff;
  if (!manifest || !researchRun || !handoff
    || manifest.executionMode !== "paper_only"
    || researchRun.executionMode !== "paper_only"
    || handoff.mode !== "paper_only"
    || manifest.paperOnly !== true
    || manifest.liveBlockedBoundary !== true
    || manifest.orderSubmissionEnabled !== false
    || manifest.liveOrderSubmitted !== false
    || manifest.routeExecuted !== false
    || manifest.liveTradingAllowed !== false
    || handoff.paperOnly !== true
    || handoff.liveTradingAllowed !== false) {
    return false;
  }
  const records = [
    manifest as unknown as Record<string, unknown>,
    researchRun as unknown as Record<string, unknown>,
    handoff as unknown as Record<string, unknown>
  ];
  const falseOnlyFields = [
    "orderSubmissionEnabled",
    "orderSubmissionAllowed",
    "orderSubmitted",
    "liveTradingAllowed",
    "liveOrderSubmitted",
    "routeExecuted"
  ];
  const allowedRoutes = new Set(["paper", "paper_only", "blocked"]);
  return records.every((record) =>
      falseOnlyFields.every((field) => !(field in record) || record[field] === false)
      && ["route", "routeMode", "executionRoute"].every((field) =>
        !(field in record)
        || (typeof record[field] === "string" && allowedRoutes.has((record[field] as string).trim()))
      )
      && (!("paperOnly" in record) || record.paperOnly === true)
    );
}

function isResearchRunExportP0PackageCompleteness(
  value: unknown
): value is ResearchRunExportP0PackageCompleteness {
  if (!value || typeof value !== "object") {
    return false;
  }
  const completeness = value as Partial<ResearchRunExportP0PackageCompleteness>;
  return (
    completeness.kind === "aiqt.p0PackageCompleteness" &&
    completeness.schemaVersion === 1 &&
    typeof completeness.runId === "string" &&
    typeof completeness.ready === "boolean" &&
    (completeness.status === "complete" ||
      completeness.status === "review" ||
      completeness.status === "blocked") &&
    typeof completeness.passed === "number" &&
    typeof completeness.review === "number" &&
    typeof completeness.blocked === "number" &&
    typeof completeness.total === "number" &&
    typeof completeness.progressPct === "number" &&
    typeof completeness.paperOnly === "boolean" &&
    typeof completeness.liveTradingAllowed === "boolean" &&
    typeof completeness.liveBlockedBoundary === "boolean" &&
    typeof completeness.summary === "string" &&
    Array.isArray(completeness.criteria) &&
    completeness.criteria.every(isResearchRunExportP0PackageCriterion)
  );
}

function isResearchRunExportP0PackageCriterion(
  value: unknown
): value is ResearchRunExportP0PackageCriterion {
  if (!value || typeof value !== "object") {
    return false;
  }
  const criterion = value as Partial<ResearchRunExportP0PackageCriterion>;
  return (
    typeof criterion.id === "string" &&
    typeof criterion.label === "string" &&
    (criterion.status === "passed" || criterion.status === "review" || criterion.status === "blocked") &&
    typeof criterion.detail === "string" &&
    typeof criterion.evidence === "string" &&
    typeof criterion.evidencePath === "string"
  );
}

function isResearchRunExecutionHandoff(value: unknown): value is ResearchRunExecutionHandoff {
  if (!value || typeof value !== "object") {
    return false;
  }
  const handoff = value as Partial<ResearchRunExecutionHandoff>;
  return (
    typeof handoff.mode === "string" &&
    typeof handoff.paperOnly === "boolean" &&
    typeof handoff.liveTradingAllowed === "boolean" &&
    Array.isArray(handoff.requiredGates) &&
    handoff.requiredGates.every(isResearchRunExecutionGateExport)
  );
}

function isResearchRunExecutionGateExport(value: unknown): value is ResearchRunExecutionGateExport {
  if (!value || typeof value !== "object") {
    return false;
  }
  const gate = value as Partial<ResearchRunExecutionGateExport>;
  return (
    typeof gate.id === "string" &&
    typeof gate.label === "string" &&
    typeof gate.passed === "boolean" &&
    typeof gate.reason === "string"
  );
}
