import {
  buildTerminalWorkspace,
  buildAuditEvidenceReportMarkdown,
  buildBacktestRunComparisonMatrixRows,
  resolveBacktestAssumptions,
  workspaceFromResearchRunAudit,
  workspaceWithPrimaryWorkflows,
  Market,
  PromotionReadiness,
  ResearchRunAudit,
  TerminalWorkspace,
  Timeframe,
  type AiReviewEvidenceAnchor,
  type AiReviewRunRecord,
  type AuditEvidenceSummary,
  type BacktestAssumptions,
  type StrategyReadinessGate,
  type StrategySnapshot
} from "./terminal-workbench";

export const defaultQuantCoreBaseUrl = "http://127.0.0.1:8765";
export type ResearchTimeframe = Timeframe;

export type WorkspaceSource = "core" | "fallback";

export interface WorkspaceLoadResult {
  workspace: TerminalWorkspace;
  source: WorkspaceSource;
  statusLabel: string;
  error?: string;
}

export interface ResearchRunHistoryResult {
  runs: ResearchRunAudit[];
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchNote {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  body: string;
  updatedAt: string | null;
}

export interface ResearchNoteResult {
  note?: ResearchNote;
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchRunDetailResult {
  run?: ResearchRunAudit;
  source: WorkspaceSource;
  error?: string;
}

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
  artifactCounts: {
    bars: number;
    trades: number;
    equityPoints: number;
    decisions: number;
    aiRisks: number;
    paperExecutions?: number;
    promotionCandidates?: number;
    researchNotes?: number;
    aiReviewRuns?: number;
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
  copyText: string;
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
  evidenceSummary: ResearchRunExportAuditEvidenceSummary;
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
  promotionCandidate?: PromotionCandidateRecord | null;
  aiReviewRuns?: AiReviewRunRecordEnvelope[];
  auditEvidenceSummary?: ResearchRunExportAuditEvidenceSummary;
  auditReport?: ResearchRunExportAuditReport;
}

export interface ResearchRunExportResult {
  exportPackage?: ResearchRunExportPackage;
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchRunImportResult {
  run?: ResearchRunAudit;
  note?: ResearchNote;
  strategies?: StrategyLibraryItem[];
  undoToken?: string;
  undo?: ResearchRunImportUndoRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchRunImportUndoRecord {
  undoToken: string;
  runId: string;
  createdAt: string;
  consumedAt: string | null;
  status: string;
}

export interface ResearchRunImportUndoResult {
  undo?: ResearchRunImportUndoRecord;
  run?: ResearchRunAudit | null;
  source: WorkspaceSource;
  error?: string;
}

export interface PaperExecutionAccount {
  cash: number;
  positions: Record<string, number>;
  equity: number;
}

export interface PaperExecutionOrder {
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  status: "filled" | "rejected";
  reason: string;
  timestamp: string;
}

export interface PaperExecutionGate {
  id: string;
  label: string;
  passed: boolean;
  reason: string;
}

export interface PaperExecutionRecord {
  executionId: string;
  runId: string;
  createdAt: string;
  mode: string;
  account: PaperExecutionAccount;
  orders: PaperExecutionOrder[];
  gates: PaperExecutionGate[];
}

export interface PromotionCandidateEvidence {
  paperExecutions: number;
  filledOrders: number;
  passedPaperRiskChecks: number;
}

export interface PromotionCandidateRecord extends PromotionReadiness {
  candidateId: string;
  runId: string;
  createdAt: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  strategyRevision: string;
  latestPaperExecutionId?: string | null;
  liveTradingAllowed: boolean;
  evidence: PromotionCandidateEvidence;
}

export interface PaperExecutionResult {
  execution?: PaperExecutionRecord;
  promotion?: PromotionCandidateRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface PaperExecutionHistoryResult {
  executions: PaperExecutionRecord[];
  source: WorkspaceSource;
  error?: string;
}

export interface PromotionCandidateResult {
  promotion?: PromotionCandidateRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface AiReviewRunRecordEnvelope {
  aiReviewId: string;
  runId: string;
  createdAt: string;
  record: AiReviewRunRecord;
}

export interface AiReviewRunRecordResult {
  aiReview?: AiReviewRunRecordEnvelope;
  source: WorkspaceSource;
  error?: string;
}

export interface AiReviewRunHistoryResult {
  aiReviews: AiReviewRunRecordEnvelope[];
  pagination?: AiReviewRunHistoryPagination;
  source: WorkspaceSource;
  error?: string;
}

export interface AiReviewRunHistoryPagination {
  limit: number;
  offset: number;
  total: number;
  query: string;
}

export interface AiReviewRunHistoryParams {
  query?: string;
  limit?: number;
  offset?: number;
}

export interface AuditEventRecord {
  schemaVersion: 1;
  eventId: string;
  eventType: string;
  runId: string | null;
  createdAt: string;
  stage: string;
  source: string;
  summary: string;
  detail: string;
  metadata: Record<string, unknown>;
}

export interface AuditEventResult {
  event?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditReportSignatureVerification {
  status: "verified" | "invalid";
  reason: string;
}

export interface AuditReportSignatureResult {
  event?: AuditEventRecord;
  signature?: Record<string, unknown>;
  verification?: AuditReportSignatureVerification;
  source: WorkspaceSource;
  error?: string;
}

export type AuditSigningKeyStatus = "active" | "retired" | "revoked";

export interface AuditSigningKeyRecord {
  keyId: string;
  signer: string;
  algorithm: "hmac-sha256";
  chainId: string;
  status: AuditSigningKeyStatus;
  source: string;
  fingerprint: string;
  canSign: boolean;
  canVerify: boolean;
  createdAt: string | null;
  activatedAt: string | null;
  retiredAt: string | null;
}

export interface AuditSigningKeyRegistry {
  schemaVersion: 1;
  generatedAt: string;
  activeKeyId: string;
  rotationRequired: boolean;
  keys: AuditSigningKeyRecord[];
}

export interface AuditSigningKeyRegistryResult {
  registry?: AuditSigningKeyRegistry;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditSigningKeyRotationPlanEnvUpdate {
  name: string;
  value: string;
  sensitivity: "public" | "secret";
}

export interface AuditSigningKeyRotationPlanStep {
  id: string;
  title: string;
  detail: string;
  status: "manual" | "required" | "blocked";
}

export interface AuditSigningKeyRotationPlan {
  schemaVersion: 1;
  generatedAt: string;
  currentActiveKey: Pick<AuditSigningKeyRecord, "chainId" | "fingerprint" | "keyId" | "signer">;
  proposedActiveKey: Pick<AuditSigningKeyRecord, "chainId" | "keyId" | "signer">;
  rotationRequired: boolean;
  requiresRestart: boolean;
  environmentUpdates: AuditSigningKeyRotationPlanEnvUpdate[];
  legacyRegistryTemplate: string;
  steps: AuditSigningKeyRotationPlanStep[];
  blockedReasons: string[];
}

export interface AuditSigningKeyRotationPlanParams {
  proposedChainId?: string;
  proposedKeyId?: string;
  proposedSigner?: string;
}

export interface AuditSigningKeyRotationPlanResult {
  rotationPlan?: AuditSigningKeyRotationPlan;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditSigningKeyRotationApplyConfirmation {
  id: string;
  label: string;
  status: "confirmed" | "missing";
}

export interface AuditSigningKeyRotationApply {
  schemaVersion: 1;
  generatedAt: string;
  status: "blocked" | "ready_for_restart";
  applyMode: "manual_secret_store";
  auditEventType: "audit_signing_key_rotation_apply";
  currentActiveKeyId: string;
  currentActiveKeyFingerprint: string;
  proposedActiveKeyId: string;
  proposedSigner: string;
  proposedChainId: string;
  restartRequired: boolean;
  requiredConfirmations: AuditSigningKeyRotationApplyConfirmation[];
  blockedReasons: string[];
  environmentUpdateNames: string[];
  secretPlaceholderNames: string[];
}

export interface AuditSigningKeyRotationApplyParams {
  rotationPlan: AuditSigningKeyRotationPlan;
  confirmations: {
    legacySecretStored?: boolean;
    newSecretMaterialStored?: boolean;
    operatorReviewedPlan?: boolean;
  };
}

export interface AuditSigningKeyRotationApplyResult {
  rotationApply?: AuditSigningKeyRotationApply;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditEventHistoryPagination {
  limit: number;
  offset: number;
  total: number;
  query: string;
}

export interface AuditEventHistoryResult {
  events: AuditEventRecord[];
  pagination?: AuditEventHistoryPagination;
  source: WorkspaceSource;
  error?: string;
}

export interface AuditEventHistoryParams {
  runId?: string | null;
  eventType?: string;
  query?: string;
  limit?: number;
  offset?: number;
}

export type StrategyLibraryStatus = "draft" | "audited";

export interface StrategyLibraryConfig {
  name: string;
  revision: string;
  market: Market;
  symbols: string[];
  timeframe: ResearchTimeframe;
  version: number;
  entryConditions: Array<{ kind: string; params: Record<string, unknown> }>;
  exitConditions: Array<{ kind: string; params: Record<string, unknown> }>;
  risk: {
    positionPct: number | null;
    stopLossPct: number | null;
    takeProfitPct: number | null;
    maxDrawdownPct: number | null;
  };
}

export interface StrategyLibraryItem {
  strategyId: string;
  createdAt: string;
  name: string;
  revision: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  version: number;
  status: StrategyLibraryStatus;
  auditRunId?: string | null;
  strategySnapshot: StrategySnapshot;
  strategyConfig: StrategyLibraryConfig;
}

export interface StrategyLibraryResult {
  strategies: StrategyLibraryItem[];
  source: WorkspaceSource;
  error?: string;
}

export interface StrategySaveParams extends TerminalResearchParams {
  strategy: StrategySnapshot;
  auditRunId?: string | null;
}

export interface StrategySaveResult {
  strategy?: StrategyLibraryItem;
  validation?: StrategyValidation;
  source: WorkspaceSource;
  error?: string;
}

export interface StrategyValidation {
  status: "ready" | "review" | "blocked";
  revision: string;
  gates: StrategyReadinessGate[];
  strategyConfig: StrategyLibraryConfig;
}

export interface StrategyValidationResult {
  validation?: StrategyValidation;
  source: WorkspaceSource;
  error?: string;
}

export interface MarketKlineBar {
  timestamp: string;
  timestampMs: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketKlineQuality {
  source: string;
  isComplete: boolean;
  warnings: string[];
  rows: number;
}

export interface MarketKlinesResult {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  bars: MarketKlineBar[];
  quality: MarketKlineQuality;
  source: WorkspaceSource;
  error?: string;
}

export interface MarketSearchSuggestion {
  market: Market;
  symbol: string;
  name: string;
  source: string;
  exchange?: string | null;
  pinyin?: string | null;
}

export interface MarketSearchResult {
  market: Market;
  query: string;
  results: MarketSearchSuggestion[];
  source: WorkspaceSource;
  error?: string;
}

export type PlatformSettingsStatusTone =
  | "ready"
  | "degraded"
  | "blocked"
  | "config_required"
  | "interface_only"
  | "paper_ready";

export interface PlatformSettingsDataSource {
  market: Market;
  label: string;
  quoteSource: string;
  klineSource: string;
  status: PlatformSettingsStatusTone;
  optionalKeyName: string | null;
  optionalKeyConfigured: boolean;
  note: string;
}

export interface PlatformSettingsCacheStatus {
  engine: "sqlite";
  path: string;
  exists: boolean;
  scope: string;
  rowCount: number;
  contextCount: number;
  latestTimestamp: string | null;
  freshnessSummary: PlatformSettingsCacheFreshnessSummary;
  contexts: PlatformSettingsCacheContext[];
}

export interface PlatformSettingsCacheFreshnessSummary {
  fresh: number;
  stale: number;
  empty: number;
}

export interface PlatformSettingsCacheContext {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  rowCount: number;
  startTimestamp: string | null;
  endTimestamp: string | null;
  freshness: "fresh" | "stale" | "empty";
  ageHours: number | null;
}

export interface PlatformSettingsExecutionAdapter {
  id: string;
  market: Market | "multi";
  adapter: string;
  route: "paper" | "live";
  status: PlatformSettingsStatusTone;
  certification: string;
  liveTradingAllowed: boolean;
  note: string;
}

export interface PlatformSettingsStatus {
  schemaVersion: 1;
  generatedAt: string;
  dataSources: PlatformSettingsDataSource[];
  cache: PlatformSettingsCacheStatus;
  executionAdapters: PlatformSettingsExecutionAdapter[];
  safety: {
    liveTradingAllowed: boolean;
    requiredGates: string[];
  };
}

export interface PlatformSettingsResult {
  settings?: PlatformSettingsStatus;
  source: WorkspaceSource;
  error?: string;
}

export type GoldenPathOverallStatus = "ready" | "review" | "blocked";
export type GoldenPathStepStatus = "passed" | "review" | "blocked";
export type GoldenPathWorkspaceStatus = "ready" | "needs_run" | "blocked";

export interface GoldenPathNextAction {
  id: string;
  label: string;
  targetWorkspace: string;
  reason: string;
}

export interface GoldenPathStep {
  id: string;
  label: string;
  status: GoldenPathStepStatus;
  passed: boolean;
  detail: string;
  actionId: string | null;
}

export interface GoldenPathWorkspace {
  id: string;
  label: string;
  status: GoldenPathWorkspaceStatus;
  current: boolean;
  stepIds: string[];
  reason: string;
  actionId: string | null;
}

export interface GoldenPathSummary {
  totalSteps: number;
  passedSteps: number;
  reviewSteps: number;
  blockedSteps: number;
  currentStepLabel: string | null;
  nextActionId: string | null;
  liveTradingAllowed: boolean;
}

export interface GoldenPathRunbookItem {
  stepId: string;
  label: string;
  workspaceId: string;
  status: GoldenPathStepStatus;
  current: boolean;
  passed: boolean;
  detail: string;
  blocker: string | null;
  actionId: string | null;
  actionLabel: string | null;
}

export interface GoldenPathStatus {
  schemaVersion: 1;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  status: GoldenPathOverallStatus;
  currentStepId: string | null;
  latestRunId: string | null;
  nextAction: GoldenPathNextAction | null;
  summary: GoldenPathSummary;
  runbook: GoldenPathRunbookItem[];
  workspaces: GoldenPathWorkspace[];
  steps: GoldenPathStep[];
}

export interface GoldenPathStatusResult {
  goldenPath?: GoldenPathStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface CacheRefreshSummary {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  requestedLimit: number;
  upsertedRows: number;
  quality: MarketKlineQuality;
}

export interface CacheRefreshResult {
  refresh?: CacheRefreshSummary;
  settings?: PlatformSettingsStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface CacheBatchRefreshResult {
  refreshes: CacheRefreshSummary[];
  settings?: PlatformSettingsStatus;
  source: WorkspaceSource;
  failedCount: number;
  error?: string;
}

export interface WorkspaceResponse {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
}

export type WorkspaceFetcher = (url: string, init?: RequestInit) => Promise<WorkspaceResponse>;

export interface TerminalResearchParams {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  limit?: number;
}

export interface MarketKlinesParams extends TerminalResearchParams {
  end?: string;
}

export interface CacheRefreshParams extends TerminalResearchParams {
  limit?: number;
}

export interface ResearchNoteSaveParams extends TerminalResearchParams {
  body: string;
}

const defaultFetcher: WorkspaceFetcher = async (url, init) => fetch(url, init);

export function resolveQuantCoreBaseUrl(env: { VITE_QUANT_API_BASE?: string }): string {
  const configured = env.VITE_QUANT_API_BASE?.trim();
  return configured ? configured : defaultQuantCoreBaseUrl;
}

function buildApiUrl(baseUrl: string, path: string, configure?: (url: URL) => void): string {
  const trimmedBase = baseUrl.trim();
  const normalizedBase = trimmedBase && trimmedBase !== "/" ? (trimmedBase.endsWith("/") ? trimmedBase : `${trimmedBase}/`) : "/";
  const url = new URL(path.replace(/^\/+/, ""), normalizedBase === "/" ? "http://aiqt.local/" : normalizedBase);
  configure?.(url);
  return normalizedBase === "/" ? `${url.pathname}${url.search}` : url.toString();
}

export function buildWorkspaceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/workspace");
}

export function buildResearchRunUrl(
  baseUrl: string,
  market: Market,
  symbol: string,
  timeframe: ResearchTimeframe,
  assumptions?: BacktestAssumptions,
  limit = 500,
  strategy?: StrategySnapshot
): string {
  return buildApiUrl(baseUrl, "api/research/run", (url) => {
    url.searchParams.set("market", market);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("timeframe", timeframe);
    url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 500))));
    if (strategy) {
      url.searchParams.set("strategyName", strategy.name);
      url.searchParams.set("strategyEntry", strategy.entry);
      url.searchParams.set("strategyExit", strategy.exit);
      url.searchParams.set("strategyPosition", strategy.position);
      url.searchParams.set("strategyRisk", strategy.risk);
    }
    if (assumptions) {
      url.searchParams.set("initialCash", String(assumptions.initialCash));
      url.searchParams.set("feeBps", String(assumptions.feeBps));
      url.searchParams.set("slippageBps", String(assumptions.slippageBps));
    }
  });
}

export function buildResearchRunsUrl(baseUrl: string, limit: number): string {
  return buildApiUrl(baseUrl, "api/research/runs", (url) => {
    url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 50))));
  });
}

export function buildResearchRunDetailUrl(baseUrl: string, runId: string): string {
  return buildApiUrl(baseUrl, `api/research/runs/${encodeURIComponent(runId)}`);
}

export function buildResearchRunExportUrl(baseUrl: string, runId: string): string {
  return buildApiUrl(baseUrl, `api/research/runs/${encodeURIComponent(runId)}/export`);
}

export function buildResearchRunImportUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/research/runs/import");
}

export function buildResearchRunImportUndoUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/research/runs/import/undo");
}

export function buildResearchNoteUrl(
  baseUrl: string,
  market: Market,
  symbol: string,
  timeframe: ResearchTimeframe
): string {
  return buildApiUrl(baseUrl, "api/research/notes", (url) => {
    url.searchParams.set("market", market);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("timeframe", timeframe);
  });
}

export function buildResearchRunPaperExecutionsUrl(baseUrl: string, runId: string): string {
  return buildApiUrl(baseUrl, `api/research/runs/${encodeURIComponent(runId)}/paper-executions`);
}

export function buildResearchRunPromotionUrl(baseUrl: string, runId: string): string {
  return buildApiUrl(baseUrl, `api/research/runs/${encodeURIComponent(runId)}/promotion`);
}

export function buildResearchRunAiReviewsUrl(
  baseUrl: string,
  runId: string,
  params: AiReviewRunHistoryParams = {}
): string {
  return buildApiUrl(baseUrl, `api/research/runs/${encodeURIComponent(runId)}/ai-reviews`, (url) => {
    if (params.query?.trim()) {
      url.searchParams.set("query", params.query.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
    if (params.offset !== undefined) {
      url.searchParams.set("offset", String(Math.max(0, params.offset)));
    }
  });
}

export function buildAuditEventsUrl(baseUrl: string, params: AuditEventHistoryParams = {}): string {
  return buildApiUrl(baseUrl, "api/audit/events", (url) => {
    if (params.eventType?.trim()) {
      url.searchParams.set("eventType", params.eventType.trim());
    }
    if (params.runId?.trim()) {
      url.searchParams.set("runId", params.runId.trim());
    }
    if (params.query?.trim()) {
      url.searchParams.set("query", params.query.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
    if (params.offset !== undefined) {
      url.searchParams.set("offset", String(Math.max(0, params.offset)));
    }
  });
}

export function buildAuditReportSignUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/reports/sign");
}

export function buildAuditReportVerifyUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/reports/verify");
}

export function buildAuditReportRevokeUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/reports/revoke");
}

export function buildAuditSigningKeysUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys");
}

export function buildAuditSigningKeyRotationPlanUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/rotation-plan");
}

export function buildAuditSigningKeyRotationApplyUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/audit/signing-keys/rotation-apply");
}

export function buildStrategiesUrl(
  baseUrl: string,
  params: { market?: Market; symbol?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/strategies", (url) => {
    if (params.market) {
      url.searchParams.set("market", params.market);
    }
    if (params.symbol?.trim()) {
      url.searchParams.set("symbol", params.symbol.trim());
    }
    url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit ?? 20, 50))));
  });
}

export function buildStrategyDetailUrl(baseUrl: string, revision: string): string {
  return buildApiUrl(baseUrl, `api/strategies/${encodeURIComponent(revision)}`);
}

export function buildStrategyValidationUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/strategies/validate");
}

export function buildMarketKlinesUrl(
  baseUrl: string,
  market: Market,
  symbol: string,
  timeframe: ResearchTimeframe,
  limit = 160,
  end?: string
): string {
  return buildApiUrl(baseUrl, "api/market/klines", (url) => {
    url.searchParams.set("market", market);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("timeframe", timeframe);
    url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 500))));
    if (end?.trim()) {
      url.searchParams.set("end", end.trim());
    }
  });
}

export function buildMarketSearchUrl(baseUrl: string, market: Market, query: string, limit = 8): string {
  return buildApiUrl(baseUrl, "api/market/search", (url) => {
    url.searchParams.set("market", market);
    url.searchParams.set("query", query);
    url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 20))));
  });
}

export function buildSettingsStatusUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/settings/status");
}

export function buildGoldenPathStatusUrl(baseUrl: string, params: TerminalResearchParams): string {
  return buildApiUrl(baseUrl, "api/golden-path/status", (url) => {
    url.searchParams.set("market", params.market);
    url.searchParams.set("symbol", params.symbol);
    url.searchParams.set("timeframe", params.timeframe);
  });
}

export function buildCacheRefreshUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/cache/refresh");
}

export function buildLoadingMarketKlinesResult(params: TerminalResearchParams): MarketKlinesResult {
  return {
    market: params.market,
    symbol: params.symbol,
    timeframe: params.timeframe,
    bars: [],
    quality: {
      source: "loading",
      isComplete: false,
      warnings: [],
      rows: 0
    },
    source: "fallback"
  };
}

export async function loadTerminalWorkspace(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<WorkspaceLoadResult> {
  try {
    const response = await fetcher(buildWorkspaceUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isTerminalWorkspace(payload)) {
      throw new Error("Invalid terminal workspace contract");
    }
    return {
      workspace: workspaceWithPrimaryWorkflows(payload),
      source: "core",
      statusLabel: "Core connected"
    };
  } catch (error) {
    return {
      workspace: buildTerminalWorkspace(),
      source: "fallback",
      statusLabel: "Offline snapshot",
      error: error instanceof Error ? error.message : "Unknown workspace load error"
    };
  }
}

export async function loadResearchRunHistory(
  baseUrl: string,
  limit = 5,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunHistoryResult> {
  try {
    const response = await fetcher(buildResearchRunsUrl(baseUrl, limit));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchRunHistoryPayload(payload)) {
      throw new Error("Invalid research run history contract");
    }
    return {
      runs: payload.runs,
      source: "core"
    };
  } catch (error) {
    return {
      runs: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research run history error"
    };
  }
}

export async function loadResearchRunDetail(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunDetailResult> {
  try {
    const response = await fetcher(buildResearchRunDetailUrl(baseUrl, runId));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchRunDetailPayload(payload)) {
      throw new Error("Invalid research run detail contract");
    }
    return {
      run: payload.run,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research run detail error"
    };
  }
}

export function normalizeResearchRunExportPackagePayload(value: unknown): ResearchRunExportPackage | null {
  if (isResearchRunExportPackage(value)) {
    return value;
  }
  if (isResearchRunExportPayload(value)) {
    return value.export;
  }
  return null;
}

export function buildResearchRunExportAuditEvidenceSummary(
  summary: AuditEvidenceSummary,
  generatedAt = new Date().toISOString()
): ResearchRunExportAuditEvidenceSummary {
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

export function buildAuditEvidenceReportAuditEvent(
  auditReport: ResearchRunExportAuditReport,
  summary: AuditEvidenceSummary
): AuditEventRecord {
  const shortHash = auditReport.contentSha256.hash.slice(0, 16);
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
      deepLinkStatus: summary.deepLinkStatus,
      deepLinkError: summary.deepLinkError
    }
  };
}

export async function buildBacktestReportAuditEvent({
  generatedAt = new Date().toISOString(),
  markdown,
  runHistory = [],
  workspace
}: {
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
      boundary: "historical audited evidence only; no investment advice"
    }
  };
}

export async function buildAuditSigningKeyRotationPlanAuditEvent(
  rotationPlan: AuditSigningKeyRotationPlan
): Promise<AuditEventRecord> {
  const legacyRegistryTemplateSha256 = await sha256TextHex(rotationPlan.legacyRegistryTemplate);
  const proposedKeyId = rotationPlan.proposedActiveKey.keyId;
  const shortTemplateHash = legacyRegistryTemplateSha256.slice(0, 12);
  const secretPlaceholderNames = rotationPlan.environmentUpdates
    .filter((update) => update.sensitivity === "secret")
    .map((update) => update.name);
  const blocked = rotationPlan.blockedReasons.length > 0;
  return {
    schemaVersion: 1,
    eventId: `audit-signing-key-rotation-${sanitizeDownloadFileName(proposedKeyId)}-${shortTemplateHash}`,
    eventType: "audit_signing_key_rotation_plan",
    runId: "audit-signing-key-rotation",
    createdAt: rotationPlan.generatedAt,
    stage: blocked ? "blocked" : "prepared",
    source: "web",
    summary: `Audit signing key rotation plan prepared for ${proposedKeyId}`,
    detail: `${rotationPlan.currentActiveKey.keyId} -> ${proposedKeyId} · legacy template sha256 ${shortTemplateHash} · ${
      rotationPlan.requiresRestart ? "restart required" : "no restart"
    }`,
    metadata: {
      currentKeyId: rotationPlan.currentActiveKey.keyId,
      currentKeyFingerprint: rotationPlan.currentActiveKey.fingerprint,
      proposedKeyId,
      proposedSigner: rotationPlan.proposedActiveKey.signer,
      proposedChainId: rotationPlan.proposedActiveKey.chainId,
      rotationRequired: rotationPlan.rotationRequired,
      requiresRestart: rotationPlan.requiresRestart,
      environmentUpdateNames: rotationPlan.environmentUpdates.map((update) => update.name),
      secretPlaceholderNames,
      legacyRegistryTemplateSha256,
      stepIds: rotationPlan.steps.map((step) => step.id),
      blockedReasons: rotationPlan.blockedReasons.slice()
    }
  };
}

export async function buildAuditSigningKeyRotationApplyAuditEvent(
  rotationApply: AuditSigningKeyRotationApply
): Promise<AuditEventRecord> {
  const digest = await sha256TextHex(
    JSON.stringify({
      blockedReasons: rotationApply.blockedReasons,
      generatedAt: rotationApply.generatedAt,
      proposedActiveKeyId: rotationApply.proposedActiveKeyId,
      requiredConfirmations: rotationApply.requiredConfirmations.map((confirmation) => [
        confirmation.id,
        confirmation.status
      ]),
      status: rotationApply.status
    })
  );
  const shortHash = digest.slice(0, 12);
  const missingConfirmationIds = rotationApply.requiredConfirmations
    .filter((confirmation) => confirmation.status === "missing")
    .map((confirmation) => confirmation.id);
  const confirmedConfirmationIds = rotationApply.requiredConfirmations
    .filter((confirmation) => confirmation.status === "confirmed")
    .map((confirmation) => confirmation.id);
  const blocked = rotationApply.status === "blocked";
  return {
    schemaVersion: 1,
    eventId: `audit-signing-key-rotation-apply-${sanitizeDownloadFileName(
      rotationApply.proposedActiveKeyId || "unknown"
    )}-${shortHash}`,
    eventType: "audit_signing_key_rotation_apply",
    runId: "audit-signing-key-rotation",
    createdAt: rotationApply.generatedAt,
    stage: rotationApply.status,
    source: "web",
    summary: `Audit signing key rotation apply ${blocked ? "blocked" : "ready"} for ${
      rotationApply.proposedActiveKeyId || "unknown"
    }`,
    detail: `${rotationApply.currentActiveKeyId} -> ${
      rotationApply.proposedActiveKeyId || "unknown"
    } · ${rotationApply.applyMode} · ${blocked ? rotationApply.blockedReasons.join(" / ") : "ready for restart"}`,
    metadata: {
      applyMode: rotationApply.applyMode,
      auditEventType: rotationApply.auditEventType,
      blockedReasons: rotationApply.blockedReasons.slice(),
      confirmedConfirmationIds,
      currentActiveKeyFingerprint: rotationApply.currentActiveKeyFingerprint,
      currentActiveKeyId: rotationApply.currentActiveKeyId,
      environmentUpdateNames: rotationApply.environmentUpdateNames.slice(),
      missingConfirmationIds,
      proposedActiveKeyId: rotationApply.proposedActiveKeyId,
      proposedChainId: rotationApply.proposedChainId,
      proposedSigner: rotationApply.proposedSigner,
      restartRequired: rotationApply.restartRequired,
      secretPlaceholderNames: rotationApply.secretPlaceholderNames.slice(),
      status: rotationApply.status
    }
  };
}

export async function withResearchRunExportAuditEvidenceArtifacts(
  exportPackage: ResearchRunExportPackage,
  summary: AuditEvidenceSummary,
  generatedAt?: string
): Promise<ResearchRunExportPackage> {
  const resolvedGeneratedAt = generatedAt ?? new Date().toISOString();
  return {
    ...exportPackage,
    auditEvidenceSummary: buildResearchRunExportAuditEvidenceSummary(summary, resolvedGeneratedAt),
    auditReport: await buildResearchRunExportAuditReport(summary, resolvedGeneratedAt)
  };
}

export async function loadResearchRunExport(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunExportResult> {
  try {
    const response = await fetcher(buildResearchRunExportUrl(baseUrl, runId));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchRunExportPayload(payload)) {
      throw new Error("Invalid research run export contract");
    }
    return {
      exportPackage: payload.export,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research run export error"
    };
  }
}

export async function importResearchRunExport(
  baseUrl: string,
  exportPackage: ResearchRunExportPackage,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunImportResult> {
  try {
    const response = await fetcher(buildResearchRunImportUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exportPackage)
    });
    const payload = await response.json();
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isResearchRunImportPayload(payload)) {
      throw new Error("Invalid research run import contract");
    }
    const noteResult = await loadResearchNote(
      baseUrl,
      {
        market: payload.run.market,
        symbol: payload.run.symbol,
        timeframe: payload.run.timeframe
      },
      fetcher
    );
    const strategyLibraryResult = await loadStrategyLibrary(
      baseUrl,
      {
        market: payload.run.market,
        symbol: payload.run.symbol,
        limit: 12
      },
      fetcher
    );
    return {
      run: payload.run,
      note: noteResult.note,
      strategies: strategyLibraryResult.source === "core" ? strategyLibraryResult.strategies : undefined,
      undoToken: payload.undoToken,
      undo: payload.undo,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research run import error"
    };
  }
}

export async function undoResearchRunImport(
  baseUrl: string,
  undoToken: string,
  expectedRunId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchRunImportUndoResult> {
  try {
    const response = await fetcher(buildResearchRunImportUndoUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ undoToken, expectedRunId })
    });
    const payload = await response.json();
    if (!response.ok) {
      const detail = coreErrorDetail(payload);
      if (detail) {
        return {
          source: "core",
          error: detail
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isResearchRunImportUndoPayload(payload)) {
      throw new Error("Invalid research run import undo contract");
    }
    return {
      undo: payload.undo,
      run: payload.run,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research run import undo error"
    };
  }
}

function coreErrorDetail(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.detail === "string" && record.detail.trim()) {
    return record.detail;
  }
  if (typeof record.error === "string" && record.error.trim()) {
    return record.error;
  }
  return null;
}

export async function loadResearchNote(
  baseUrl: string,
  params: TerminalResearchParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchNoteResult> {
  try {
    const response = await fetcher(buildResearchNoteUrl(baseUrl, params.market, params.symbol, params.timeframe));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchNotePayload(payload)) {
      throw new Error("Invalid research note contract");
    }
    return {
      note: payload.note,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research note load error"
    };
  }
}

export async function saveResearchNote(
  baseUrl: string,
  params: ResearchNoteSaveParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchNoteResult> {
  try {
    const response = await fetcher(buildApiUrl(baseUrl, "api/research/notes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        market: params.market,
        symbol: params.symbol,
        timeframe: params.timeframe,
        body: params.body
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchNotePayload(payload)) {
      throw new Error("Invalid research note contract");
    }
    return {
      note: payload.note,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research note save error"
    };
  }
}

export async function submitResearchRunPaperExecution(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PaperExecutionResult> {
  try {
    const response = await fetcher(buildResearchRunPaperExecutionsUrl(baseUrl, runId), {
      method: "POST"
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isCoreErrorPayload(payload)) {
        return {
          source: "core",
          error: payload.detail ?? payload.error
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isPaperExecutionPayload(payload)) {
      throw new Error("Invalid paper execution contract");
    }
    return {
      execution: payload.execution,
      promotion: payload.promotion,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown paper execution error"
    };
  }
}

export async function loadResearchRunPromotion(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PromotionCandidateResult> {
  try {
    const response = await fetcher(buildResearchRunPromotionUrl(baseUrl, runId));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPromotionCandidatePayload(payload)) {
      throw new Error("Invalid promotion candidate contract");
    }
    return {
      promotion: payload.promotion,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown promotion candidate error"
    };
  }
}

export async function saveAiReviewRunRecord(
  baseUrl: string,
  record: AiReviewRunRecord,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiReviewRunRecordResult> {
  try {
    const response = await fetcher(buildResearchRunAiReviewsUrl(baseUrl, record.runId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isCoreErrorPayload(payload)) {
        return {
          source: "core",
          error: payload.detail ?? payload.error
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isAiReviewRunRecordPayload(payload)) {
      throw new Error("Invalid AI review run record contract");
    }
    return {
      aiReview: payload.aiReview,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown AI review run record save error"
    };
  }
}

export async function loadResearchRunAiReviews(
  baseUrl: string,
  runId: string,
  paramsOrFetcher: AiReviewRunHistoryParams | WorkspaceFetcher = {},
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiReviewRunHistoryResult> {
  const params = typeof paramsOrFetcher === "function" ? {} : paramsOrFetcher;
  const fetcher = typeof paramsOrFetcher === "function" ? paramsOrFetcher : maybeFetcher;
  try {
    const response = await fetcher(buildResearchRunAiReviewsUrl(baseUrl, runId, params));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAiReviewRunHistoryPayload(payload)) {
      throw new Error("Invalid AI review run history contract");
    }
    return {
      aiReviews: payload.aiReviews,
      pagination: payload.pagination,
      source: "core"
    };
  } catch (error) {
    return {
      aiReviews: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown AI review run history error"
    };
  }
}

export async function saveAuditEvent(
  baseUrl: string,
  event: AuditEventRecord,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditEventResult> {
  try {
    const response = await fetcher(buildAuditEventsUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event)
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isCoreErrorPayload(payload)) {
        return {
          source: "core",
          error: payload.detail ?? payload.error
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isAuditEventPayload(payload)) {
      throw new Error("Invalid audit event contract");
    }
    return {
      event: payload.event,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit event save error"
    };
  }
}

export async function loadAuditEvents(
  baseUrl: string,
  paramsOrFetcher: AuditEventHistoryParams | WorkspaceFetcher = {},
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditEventHistoryResult> {
  const params = typeof paramsOrFetcher === "function" ? {} : paramsOrFetcher;
  const fetcher = typeof paramsOrFetcher === "function" ? paramsOrFetcher : maybeFetcher;
  try {
    const response = await fetcher(buildAuditEventsUrl(baseUrl, params));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditEventHistoryPayload(payload)) {
      throw new Error("Invalid audit event history contract");
    }
    return {
      events: payload.events,
      pagination: payload.pagination,
      source: "core"
    };
  } catch (error) {
    return {
      events: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit event history error"
    };
  }
}

export async function signAuditReportEvent(
  baseUrl: string,
  eventId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditReportSignatureResult> {
  return mutateAuditReportSignature(buildAuditReportSignUrl(baseUrl), eventId, undefined, fetcher, "sign");
}

export async function verifyAuditReportEvent(
  baseUrl: string,
  eventId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditReportSignatureResult> {
  return mutateAuditReportSignature(buildAuditReportVerifyUrl(baseUrl), eventId, undefined, fetcher, "verify");
}

export async function revokeAuditReportEvent(
  baseUrl: string,
  eventId: string,
  reason = "manual audit revocation",
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditReportSignatureResult> {
  return mutateAuditReportSignature(buildAuditReportRevokeUrl(baseUrl), eventId, reason, fetcher, "revoke");
}

async function mutateAuditReportSignature(
  url: string,
  eventId: string,
  reason: string | undefined,
  fetcher: WorkspaceFetcher,
  action: "sign" | "verify" | "revoke"
): Promise<AuditReportSignatureResult> {
  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reason === undefined ? { eventId } : { eventId, reason })
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
      throw new Error("Invalid audit report signature contract");
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
      error: error instanceof Error ? error.message : `Unknown audit report ${action} error`
    };
  }
}

export async function loadAuditSigningKeys(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyRegistryResult> {
  try {
    const response = await fetcher(buildAuditSigningKeysUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyRegistryPayload(payload)) {
      throw new Error("Invalid audit signing key registry contract");
    }
    return {
      registry: payload.registry,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key registry error"
    };
  }
}

export async function prepareAuditSigningKeyRotationPlan(
  baseUrl: string,
  params: AuditSigningKeyRotationPlanParams = {},
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyRotationPlanResult> {
  try {
    const response = await fetcher(buildAuditSigningKeyRotationPlanUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposedChainId: params.proposedChainId ?? "",
        proposedKeyId: params.proposedKeyId ?? "",
        proposedSigner: params.proposedSigner ?? ""
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyRotationPlanPayload(payload)) {
      throw new Error("Invalid audit signing key rotation plan contract");
    }
    return {
      rotationPlan: payload.rotationPlan,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key rotation plan error"
    };
  }
}

export async function applyAuditSigningKeyRotationPlan(
  baseUrl: string,
  params: AuditSigningKeyRotationApplyParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AuditSigningKeyRotationApplyResult> {
  try {
    const response = await fetcher(buildAuditSigningKeyRotationApplyUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        confirmations: {
          legacySecretStored: params.confirmations.legacySecretStored === true,
          newSecretMaterialStored: params.confirmations.newSecretMaterialStored === true,
          operatorReviewedPlan: params.confirmations.operatorReviewedPlan === true
        },
        rotationPlan: params.rotationPlan
      })
    });
    if (!response.ok && response.status !== 409) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isAuditSigningKeyRotationApplyPayload(payload)) {
      throw new Error("Invalid audit signing key rotation apply contract");
    }
    return {
      rotationApply: payload.rotationApply,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown audit signing key rotation apply error"
    };
  }
}

export async function loadPlatformSettings(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PlatformSettingsResult> {
  try {
    const response = await fetcher(buildSettingsStatusUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPlatformSettingsPayload(payload)) {
      throw new Error("Invalid settings status contract");
    }
    return {
      settings: payload.settings,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown settings status error"
    };
  }
}

export async function loadGoldenPathStatus(
  baseUrl: string,
  params: TerminalResearchParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<GoldenPathStatusResult> {
  try {
    const response = await fetcher(buildGoldenPathStatusUrl(baseUrl, params));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isGoldenPathStatusPayload(payload)) {
      throw new Error("Invalid golden path status contract");
    }
    return {
      goldenPath: payload.goldenPath,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown golden path status error"
    };
  }
}

export async function refreshMarketCache(
  baseUrl: string,
  params: CacheRefreshParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<CacheRefreshResult> {
  try {
    const response = await fetcher(buildCacheRefreshUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        market: params.market,
        symbol: params.symbol,
        timeframe: params.timeframe,
        limit: Math.max(1, Math.min(params.limit ?? 160, 500))
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isCacheRefreshPayload(payload)) {
      throw new Error("Invalid cache refresh contract");
    }
    return {
      refresh: payload.refresh,
      settings: payload.settings,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown cache refresh error"
    };
  }
}

export async function refreshMarketCacheBatch(
  baseUrl: string,
  paramsList: CacheRefreshParams[],
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<CacheBatchRefreshResult> {
  const refreshes: CacheRefreshSummary[] = [];
  const errors: string[] = [];
  let settings: PlatformSettingsStatus | undefined;
  let failedCount = 0;

  for (const params of paramsList) {
    const result = await refreshMarketCache(baseUrl, params, fetcher);
    if (result.source === "core" && result.refresh && result.settings) {
      refreshes.push(result.refresh);
      settings = result.settings;
      continue;
    }
    failedCount += 1;
    if (result.error) {
      errors.push(`${params.symbol}: ${result.error}`);
    }
  }

  return {
    refreshes,
    settings,
    source: refreshes.length || paramsList.length === 0 ? "core" : "fallback",
    failedCount,
    error: failedCount ? errors.join("; ") || `${failedCount} cache refresh failed` : undefined
  };
}

export async function saveStrategySnapshot(
  baseUrl: string,
  params: StrategySaveParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategySaveResult> {
  try {
    const response = await fetcher(buildApiUrl(baseUrl, "api/strategies"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        market: params.market,
        symbol: params.symbol,
        timeframe: params.timeframe,
        auditRunId: params.auditRunId ?? null,
        strategy: params.strategy
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isStrategyValidationErrorPayload(payload)) {
        return {
          validation: payload.validation,
          source: "core",
          error: payload.error
        };
      }
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (!isStrategyLibraryItemPayload(payload)) {
      throw new Error("Invalid strategy library save contract");
    }
    return {
      strategy: payload.strategy,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy save error"
    };
  }
}

export async function validateStrategySnapshot(
  baseUrl: string,
  params: StrategySaveParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategyValidationResult> {
  try {
    const response = await fetcher(buildStrategyValidationUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        market: params.market,
        symbol: params.symbol,
        timeframe: params.timeframe,
        auditRunId: params.auditRunId ?? null,
        strategy: params.strategy
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStrategyValidationPayload(payload)) {
      throw new Error("Invalid strategy validation contract");
    }
    return {
      validation: payload.validation,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy validation error"
    };
  }
}

export async function loadStrategyLibrary(
  baseUrl: string,
  params: { market?: Market; symbol?: string; limit?: number } = {},
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategyLibraryResult> {
  try {
    const response = await fetcher(buildStrategiesUrl(baseUrl, params));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStrategyLibraryPayload(payload)) {
      throw new Error("Invalid strategy library contract");
    }
    return {
      strategies: payload.strategies,
      source: "core"
    };
  } catch (error) {
    return {
      strategies: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy library error"
    };
  }
}

export async function loadStrategyDetail(
  baseUrl: string,
  revision: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategySaveResult> {
  try {
    const response = await fetcher(buildStrategyDetailUrl(baseUrl, revision));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStrategyLibraryItemPayload(payload)) {
      throw new Error("Invalid strategy detail contract");
    }
    return {
      strategy: payload.strategy,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy detail error"
    };
  }
}

export async function loadResearchRunPaperExecutions(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PaperExecutionHistoryResult> {
  try {
    const response = await fetcher(buildResearchRunPaperExecutionsUrl(baseUrl, runId));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isPaperExecutionHistoryPayload(payload)) {
      throw new Error("Invalid paper execution history contract");
    }
    return {
      executions: payload.executions,
      source: "core"
    };
  } catch (error) {
    return {
      executions: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown paper execution history error"
    };
  }
}

export async function loadLatestResearchRunPaperExecution(
  baseUrl: string,
  runId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<PaperExecutionResult> {
  const result = await loadResearchRunPaperExecutions(baseUrl, runId, fetcher);
  if (result.source === "fallback") {
    return {
      source: "fallback",
      error: result.error
    };
  }
  return {
    execution: result.executions[0],
    source: "core"
  };
}

export async function loadMarketKlines(
  baseUrl: string,
  params: MarketKlinesParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<MarketKlinesResult> {
  try {
    const response = await fetcher(
      buildMarketKlinesUrl(baseUrl, params.market, params.symbol, params.timeframe, params.limit ?? 160, params.end)
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isMarketKlinesPayload(payload)) {
      throw new Error("Invalid market klines contract");
    }
    return {
      ...payload,
      source: "core"
    };
  } catch (error) {
    return {
      market: params.market,
      symbol: params.symbol,
      timeframe: params.timeframe,
      bars: [],
      quality: {
        source: "unavailable",
        isComplete: false,
        warnings: [],
        rows: 0
      },
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown market kline load error"
    };
  }
}

export function marketKlinesFromResearchRunAudit(run: ResearchRunAudit): MarketKlinesResult | null {
  const snapshot = run.dataSnapshot;
  if (!snapshot || !snapshot.bars.length) {
    return null;
  }
  return {
    market: run.market,
    symbol: run.symbol,
    timeframe: run.timeframe,
    bars: snapshot.bars.map((bar) => ({ ...bar })),
    quality: {
      source: snapshot.source,
      isComplete: snapshot.isComplete,
      warnings: [...snapshot.warnings],
      rows: snapshot.rows
    },
    source: "core"
  };
}

export function mergeMarketKlines(current: MarketKlinesResult, incoming: MarketKlinesResult): MarketKlinesResult {
  if (
    current.market !== incoming.market ||
    current.symbol !== incoming.symbol ||
    current.timeframe !== incoming.timeframe
  ) {
    return current;
  }

  const barsByTimestamp = new Map<number, MarketKlineBar>();
  [...incoming.bars, ...current.bars].forEach((bar) => {
    barsByTimestamp.set(bar.timestampMs, bar);
  });
  const bars = [...barsByTimestamp.values()].sort((left, right) => left.timestampMs - right.timestampMs);
  const warnings = [...new Set([...current.quality.warnings, ...incoming.quality.warnings])];

  return {
    ...current,
    source: current.source === "core" || incoming.source === "core" ? "core" : current.source,
    error: current.error ?? incoming.error,
    quality: {
      source: incoming.quality.source || current.quality.source,
      isComplete: current.quality.isComplete && incoming.quality.isComplete,
      warnings,
      rows: bars.length
    },
    bars
  };
}

export async function loadMarketSearch(
  baseUrl: string,
  params: { market: Market; query: string; limit?: number },
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<MarketSearchResult> {
  try {
    const response = await fetcher(buildMarketSearchUrl(baseUrl, params.market, params.query, params.limit ?? 8));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isMarketSearchPayload(payload)) {
      throw new Error("Invalid market search contract");
    }
    return {
      ...payload,
      source: "core"
    };
  } catch (error) {
    return {
      market: params.market,
      query: params.query,
      results: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown market search error"
    };
  }
}

export async function runTerminalResearch(
  baseUrl: string,
  params: TerminalResearchParams,
  currentWorkspace: TerminalWorkspace,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<WorkspaceLoadResult> {
  try {
    const response = await fetcher(
      buildResearchRunUrl(
        baseUrl,
        params.market,
        params.symbol,
        params.timeframe,
        resolveBacktestAssumptions(currentWorkspace),
        params.limit ?? 500,
        currentWorkspace.strategy
      )
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isTerminalWorkspace(payload)) {
      throw new Error("Invalid terminal research contract");
    }
    const workspace = await hydrateResearchRunSnapshotIfNeeded(
      baseUrl,
      workspaceWithPrimaryWorkflows(payload),
      fetcher
    );
    return {
      workspace,
      source: "core",
      statusLabel: "Research run complete"
    };
  } catch (error) {
    return {
      workspace: currentWorkspace,
      source: "fallback",
      statusLabel: "Research run failed",
      error: error instanceof Error ? error.message : "Unknown research run error"
    };
  }
}

async function hydrateResearchRunSnapshotIfNeeded(
  baseUrl: string,
  workspace: TerminalWorkspace,
  fetcher: WorkspaceFetcher
): Promise<TerminalWorkspace> {
  const runId = workspace.researchRun?.runId;
  const snapshot = workspace.researchRun?.dataSnapshot;
  if (!runId || (snapshot && snapshot.bars.length > 0)) {
    return workspace;
  }

  try {
    const response = await fetcher(buildResearchRunDetailUrl(baseUrl, runId));
    if (!response.ok) {
      return workspace;
    }
    const payload = await response.json();
    if (!isResearchRunDetailPayload(payload) || !payload.run.dataSnapshot?.bars.length) {
      return workspace;
    }
    return workspaceWithPrimaryWorkflows(workspaceFromResearchRunAudit(workspace, payload.run));
  } catch {
    return workspace;
  }
}

function isResearchRunHistoryPayload(value: unknown): value is { runs: ResearchRunAudit[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { runs?: unknown };
  return Array.isArray(payload.runs) && payload.runs.every(isResearchRunAudit);
}

function isResearchRunDetailPayload(value: unknown): value is { run: ResearchRunAudit } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { run?: unknown };
  return isResearchRunAudit(payload.run);
}

function isResearchRunExportPayload(value: unknown): value is { export: ResearchRunExportPackage } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { export?: unknown };
  return isResearchRunExportPackage(payload.export);
}

function isResearchRunImportPayload(value: unknown): value is {
  run: ResearchRunAudit;
  undoToken?: string;
  undo?: ResearchRunImportUndoRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { run?: unknown; undoToken?: unknown; undo?: unknown };
  return (
    isResearchRunAudit(payload.run) &&
    Boolean(payload.run.dataSnapshot) &&
    (payload.undoToken === undefined || typeof payload.undoToken === "string") &&
    (payload.undo === undefined || isResearchRunImportUndoRecord(payload.undo))
  );
}

function isResearchRunImportUndoPayload(value: unknown): value is {
  undo: ResearchRunImportUndoRecord;
  run: ResearchRunAudit | null;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { undo?: unknown; run?: unknown };
  return isResearchRunImportUndoRecord(payload.undo) && (payload.run === null || isResearchRunAudit(payload.run));
}

function isResearchRunImportUndoRecord(value: unknown): value is ResearchRunImportUndoRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const undo = value as Partial<ResearchRunImportUndoRecord>;
  return (
    typeof undo.undoToken === "string" &&
    typeof undo.runId === "string" &&
    typeof undo.createdAt === "string" &&
    (undo.consumedAt === null || typeof undo.consumedAt === "string") &&
    typeof undo.status === "string"
  );
}

function isResearchNotePayload(value: unknown): value is { note: ResearchNote } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { note?: unknown };
  return isResearchNote(payload.note);
}

function isResearchNote(value: unknown): value is ResearchNote {
  if (!value || typeof value !== "object") {
    return false;
  }
  const note = value as Partial<ResearchNote>;
  return (
    isMarket(note.market) &&
    typeof note.symbol === "string" &&
    isTimeframe(note.timeframe) &&
    typeof note.body === "string" &&
    (note.updatedAt === null || typeof note.updatedAt === "string")
  );
}

function isPaperExecutionPayload(value: unknown): value is { execution: PaperExecutionRecord; promotion?: PromotionCandidateRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { execution?: unknown; promotion?: unknown };
  return isPaperExecutionRecord(payload.execution) && (payload.promotion === undefined || isPromotionCandidateRecord(payload.promotion));
}

function isPaperExecutionHistoryPayload(value: unknown): value is { executions: PaperExecutionRecord[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { executions?: unknown };
  return Array.isArray(payload.executions) && payload.executions.every(isPaperExecutionRecord);
}

function isPromotionCandidatePayload(value: unknown): value is { promotion: PromotionCandidateRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { promotion?: unknown };
  return isPromotionCandidateRecord(payload.promotion);
}

function isAiReviewRunRecordPayload(value: unknown): value is { aiReview: AiReviewRunRecordEnvelope } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { aiReview?: unknown };
  return isAiReviewRunRecordEnvelope(payload.aiReview);
}

function isAiReviewRunHistoryPayload(value: unknown): value is {
  aiReviews: AiReviewRunRecordEnvelope[];
  pagination?: AiReviewRunHistoryPagination;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { aiReviews?: unknown; pagination?: unknown };
  return (
    Array.isArray(payload.aiReviews) &&
    payload.aiReviews.every(isAiReviewRunRecordEnvelope) &&
    (payload.pagination === undefined || isAiReviewRunHistoryPagination(payload.pagination))
  );
}

function isAiReviewRunHistoryPagination(value: unknown): value is AiReviewRunHistoryPagination {
  if (!value || typeof value !== "object") {
    return false;
  }
  const pagination = value as Partial<AiReviewRunHistoryPagination>;
  return (
    typeof pagination.limit === "number" &&
    typeof pagination.offset === "number" &&
    typeof pagination.total === "number" &&
    typeof pagination.query === "string"
  );
}

function isAuditEventPayload(value: unknown): value is { event: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { event?: unknown };
  return isAuditEventRecord(payload.event);
}

function isAuditReportSignaturePayload(value: unknown): value is {
  event: AuditEventRecord;
  signature: Record<string, unknown>;
  verification: AuditReportSignatureVerification;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { event?: unknown; signature?: unknown; verification?: unknown };
  return (
    isAuditEventRecord(payload.event) &&
    isPlainRecord(payload.signature) &&
    isAuditReportSignatureVerification(payload.verification)
  );
}

function isAuditReportSignatureVerification(value: unknown): value is AuditReportSignatureVerification {
  if (!value || typeof value !== "object") {
    return false;
  }
  const verification = value as Partial<AuditReportSignatureVerification>;
  return (
    (verification.status === "verified" || verification.status === "invalid") &&
    typeof verification.reason === "string"
  );
}

function isAuditSigningKeyRegistryPayload(value: unknown): value is { registry: AuditSigningKeyRegistry } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { registry?: unknown };
  return isAuditSigningKeyRegistry(payload.registry);
}

function isAuditSigningKeyRegistry(value: unknown): value is AuditSigningKeyRegistry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const registry = value as Partial<AuditSigningKeyRegistry>;
  return (
    registry.schemaVersion === 1 &&
    typeof registry.generatedAt === "string" &&
    typeof registry.activeKeyId === "string" &&
    typeof registry.rotationRequired === "boolean" &&
    Array.isArray(registry.keys) &&
    registry.keys.every(isAuditSigningKeyRecord)
  );
}

function isAuditSigningKeyRecord(value: unknown): value is AuditSigningKeyRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(value, "secret")) {
    return false;
  }
  const key = value as Partial<AuditSigningKeyRecord>;
  return (
    typeof key.keyId === "string" &&
    typeof key.signer === "string" &&
    key.algorithm === "hmac-sha256" &&
    typeof key.chainId === "string" &&
    (key.status === "active" || key.status === "retired" || key.status === "revoked") &&
    typeof key.source === "string" &&
    typeof key.fingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(key.fingerprint) &&
    typeof key.canSign === "boolean" &&
    typeof key.canVerify === "boolean" &&
    (key.createdAt === null || typeof key.createdAt === "string") &&
    (key.activatedAt === null || typeof key.activatedAt === "string") &&
    (key.retiredAt === null || typeof key.retiredAt === "string")
  );
}

function isAuditSigningKeyRotationPlanPayload(value: unknown): value is { rotationPlan: AuditSigningKeyRotationPlan } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { rotationPlan?: unknown };
  return isAuditSigningKeyRotationPlan(payload.rotationPlan);
}

function isAuditSigningKeyRotationPlan(value: unknown): value is AuditSigningKeyRotationPlan {
  if (!value || typeof value !== "object" || containsDisallowedSecretField(value)) {
    return false;
  }
  const plan = value as Partial<AuditSigningKeyRotationPlan>;
  return (
    plan.schemaVersion === 1 &&
    typeof plan.generatedAt === "string" &&
    isAuditSigningKeyRotationCurrentKey(plan.currentActiveKey) &&
    isAuditSigningKeyRotationProposedKey(plan.proposedActiveKey) &&
    typeof plan.rotationRequired === "boolean" &&
    typeof plan.requiresRestart === "boolean" &&
    Array.isArray(plan.environmentUpdates) &&
    plan.environmentUpdates.every(isAuditSigningKeyRotationEnvUpdate) &&
    typeof plan.legacyRegistryTemplate === "string" &&
    Array.isArray(plan.steps) &&
    plan.steps.every(isAuditSigningKeyRotationStep) &&
    Array.isArray(plan.blockedReasons) &&
    plan.blockedReasons.every((reason) => typeof reason === "string")
  );
}

function isAuditSigningKeyRotationCurrentKey(
  value: unknown
): value is AuditSigningKeyRotationPlan["currentActiveKey"] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const key = value as Partial<AuditSigningKeyRotationPlan["currentActiveKey"]>;
  return (
    typeof key.keyId === "string" &&
    typeof key.signer === "string" &&
    typeof key.chainId === "string" &&
    typeof key.fingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(key.fingerprint)
  );
}

function isAuditSigningKeyRotationProposedKey(
  value: unknown
): value is AuditSigningKeyRotationPlan["proposedActiveKey"] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const key = value as Partial<AuditSigningKeyRotationPlan["proposedActiveKey"]>;
  return typeof key.keyId === "string" && typeof key.signer === "string" && typeof key.chainId === "string";
}

function isAuditSigningKeyRotationEnvUpdate(value: unknown): value is AuditSigningKeyRotationPlanEnvUpdate {
  if (!value || typeof value !== "object") {
    return false;
  }
  const update = value as Partial<AuditSigningKeyRotationPlanEnvUpdate>;
  return (
    typeof update.name === "string" &&
    typeof update.value === "string" &&
    (update.sensitivity === "public" || update.sensitivity === "secret")
  );
}

function isAuditSigningKeyRotationStep(value: unknown): value is AuditSigningKeyRotationPlanStep {
  if (!value || typeof value !== "object") {
    return false;
  }
  const step = value as Partial<AuditSigningKeyRotationPlanStep>;
  return (
    typeof step.id === "string" &&
    typeof step.title === "string" &&
    typeof step.detail === "string" &&
    (step.status === "manual" || step.status === "required" || step.status === "blocked")
  );
}

function isAuditSigningKeyRotationApplyPayload(value: unknown): value is { rotationApply: AuditSigningKeyRotationApply } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { rotationApply?: unknown };
  return isAuditSigningKeyRotationApply(payload.rotationApply);
}

function isAuditSigningKeyRotationApply(value: unknown): value is AuditSigningKeyRotationApply {
  if (!value || typeof value !== "object" || containsDisallowedSecretField(value)) {
    return false;
  }
  const rotationApply = value as Partial<AuditSigningKeyRotationApply>;
  return (
    rotationApply.schemaVersion === 1 &&
    typeof rotationApply.generatedAt === "string" &&
    (rotationApply.status === "blocked" || rotationApply.status === "ready_for_restart") &&
    rotationApply.applyMode === "manual_secret_store" &&
    rotationApply.auditEventType === "audit_signing_key_rotation_apply" &&
    typeof rotationApply.currentActiveKeyId === "string" &&
    typeof rotationApply.currentActiveKeyFingerprint === "string" &&
    /^[a-f0-9]{16}$/.test(rotationApply.currentActiveKeyFingerprint) &&
    typeof rotationApply.proposedActiveKeyId === "string" &&
    typeof rotationApply.proposedSigner === "string" &&
    typeof rotationApply.proposedChainId === "string" &&
    typeof rotationApply.restartRequired === "boolean" &&
    Array.isArray(rotationApply.requiredConfirmations) &&
    rotationApply.requiredConfirmations.every(isAuditSigningKeyRotationApplyConfirmation) &&
    Array.isArray(rotationApply.blockedReasons) &&
    rotationApply.blockedReasons.every((reason) => typeof reason === "string") &&
    Array.isArray(rotationApply.environmentUpdateNames) &&
    rotationApply.environmentUpdateNames.every((name) => typeof name === "string") &&
    Array.isArray(rotationApply.secretPlaceholderNames) &&
    rotationApply.secretPlaceholderNames.every((name) => typeof name === "string")
  );
}

function isAuditSigningKeyRotationApplyConfirmation(
  value: unknown
): value is AuditSigningKeyRotationApplyConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<AuditSigningKeyRotationApplyConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function containsDisallowedSecretField(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const disallowedSecretFields = new Set(["secret", "secretMaterial", "secretValue", "rawSecret", "privateKey", "keyMaterial"]);
  return Object.entries(value as Record<string, unknown>).some(([key, child]) => {
    if (disallowedSecretFields.has(key)) {
      return true;
    }
    return typeof child === "object" && containsDisallowedSecretField(child);
  });
}

function isAuditEventHistoryPayload(value: unknown): value is {
  events: AuditEventRecord[];
  pagination?: AuditEventHistoryPagination;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { events?: unknown; pagination?: unknown };
  return (
    Array.isArray(payload.events) &&
    payload.events.every(isAuditEventRecord) &&
    (payload.pagination === undefined || isAuditEventHistoryPagination(payload.pagination))
  );
}

function isAuditEventHistoryPagination(value: unknown): value is AuditEventHistoryPagination {
  if (!value || typeof value !== "object") {
    return false;
  }
  const pagination = value as Partial<AuditEventHistoryPagination>;
  return (
    typeof pagination.limit === "number" &&
    typeof pagination.offset === "number" &&
    typeof pagination.total === "number" &&
    typeof pagination.query === "string"
  );
}

function isAuditEventRecord(value: unknown): value is AuditEventRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as Partial<AuditEventRecord>;
  return (
    event.schemaVersion === 1 &&
    typeof event.eventId === "string" &&
    typeof event.eventType === "string" &&
    (event.runId === null || typeof event.runId === "string") &&
    typeof event.createdAt === "string" &&
    typeof event.stage === "string" &&
    typeof event.source === "string" &&
    typeof event.summary === "string" &&
    typeof event.detail === "string" &&
    isPlainRecord(event.metadata)
  );
}

function isPlatformSettingsPayload(value: unknown): value is { settings: PlatformSettingsStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { settings?: unknown };
  return isPlatformSettingsStatus(payload.settings);
}

function isGoldenPathStatusPayload(value: unknown): value is { goldenPath: GoldenPathStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { goldenPath?: unknown };
  return isGoldenPathStatus(payload.goldenPath);
}

function isCacheRefreshPayload(value: unknown): value is { refresh: CacheRefreshSummary; settings: PlatformSettingsStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { refresh?: unknown; settings?: unknown };
  return isCacheRefreshSummary(payload.refresh) && isPlatformSettingsStatus(payload.settings);
}

function isCacheRefreshSummary(value: unknown): value is CacheRefreshSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const refresh = value as Partial<CacheRefreshSummary>;
  return (
    isMarket(refresh.market) &&
    typeof refresh.symbol === "string" &&
    isTimeframe(refresh.timeframe) &&
    typeof refresh.requestedLimit === "number" &&
    typeof refresh.upsertedRows === "number" &&
    isMarketKlineQuality(refresh.quality)
  );
}

function isStrategyLibraryPayload(value: unknown): value is { strategies: StrategyLibraryItem[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { strategies?: unknown };
  return Array.isArray(payload.strategies) && payload.strategies.every(isStrategyLibraryItem);
}

function isStrategyLibraryItemPayload(value: unknown): value is { strategy: StrategyLibraryItem } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { strategy?: unknown };
  return isStrategyLibraryItem(payload.strategy);
}

function isStrategyValidationPayload(value: unknown): value is { validation: StrategyValidation } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { validation?: unknown };
  return isStrategyValidation(payload.validation);
}

function isStrategyValidationErrorPayload(value: unknown): value is { error: string; validation: StrategyValidation } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { error?: unknown; validation?: unknown };
  return typeof payload.error === "string" && isStrategyValidation(payload.validation);
}

function isCoreErrorPayload(value: unknown): value is { error: string; detail?: string } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { error?: unknown; detail?: unknown };
  return typeof payload.error === "string" && (payload.detail === undefined || typeof payload.detail === "string");
}

function isStrategyValidation(value: unknown): value is StrategyValidation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const validation = value as Partial<StrategyValidation>;
  return (
    (validation.status === "ready" || validation.status === "review" || validation.status === "blocked") &&
    typeof validation.revision === "string" &&
    Array.isArray(validation.gates) &&
    validation.gates.every(isStrategyReadinessGate) &&
    isResearchRunStrategyConfig(validation.strategyConfig)
  );
}

function isStrategyReadinessGate(value: unknown): value is StrategyReadinessGate {
  if (!value || typeof value !== "object") {
    return false;
  }
  const gate = value as Partial<StrategyReadinessGate>;
  return (
    (gate.id === "schema" || gate.id === "risk" || gate.id === "execution" || gate.id === "audit") &&
    (gate.label === "Strategy schema" ||
      gate.label === "Risk controls" ||
      gate.label === "Execution mode" ||
      gate.label === "Audit evidence") &&
    typeof gate.value === "string" &&
    typeof gate.detail === "string" &&
    (gate.status === "passed" || gate.status === "review" || gate.status === "blocked") &&
    (gate.tone === "positive" || gate.tone === "warning" || gate.tone === "risk")
  );
}

function isStrategyLibraryItem(value: unknown): value is StrategyLibraryItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const strategy = value as Partial<StrategyLibraryItem>;
  return (
    typeof strategy.strategyId === "string" &&
    typeof strategy.createdAt === "string" &&
    typeof strategy.name === "string" &&
    typeof strategy.revision === "string" &&
    isMarket(strategy.market) &&
    typeof strategy.symbol === "string" &&
    isTimeframe(strategy.timeframe) &&
    typeof strategy.version === "number" &&
    (strategy.status === "draft" || strategy.status === "audited") &&
    (strategy.auditRunId === undefined || strategy.auditRunId === null || typeof strategy.auditRunId === "string") &&
    isStrategySnapshot(strategy.strategySnapshot) &&
    isResearchRunStrategyConfig(strategy.strategyConfig)
  );
}

function isStrategySnapshot(value: unknown): value is StrategySnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }
  const snapshot = value as Partial<StrategySnapshot>;
  return (
    typeof snapshot.name === "string" &&
    typeof snapshot.entry === "string" &&
    typeof snapshot.exit === "string" &&
    typeof snapshot.position === "string" &&
    typeof snapshot.risk === "string"
  );
}

function isPromotionCandidateRecord(value: unknown): value is PromotionCandidateRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<PromotionCandidateRecord>;
  return (
    typeof candidate.candidateId === "string" &&
    typeof candidate.runId === "string" &&
    typeof candidate.createdAt === "string" &&
    isMarket(candidate.market) &&
    typeof candidate.symbol === "string" &&
    isTimeframe(candidate.timeframe) &&
    typeof candidate.strategyRevision === "string" &&
    (candidate.latestPaperExecutionId === undefined ||
      candidate.latestPaperExecutionId === null ||
      typeof candidate.latestPaperExecutionId === "string") &&
    isPromotionReadinessStatus(candidate.status) &&
    typeof candidate.headline === "string" &&
    typeof candidate.summary === "string" &&
    typeof candidate.liveTradingAllowed === "boolean" &&
    isPromotionCandidateEvidence(candidate.evidence) &&
    Array.isArray(candidate.stages) &&
    candidate.stages.every(isPromotionCandidateStage)
  );
}

function isPromotionReadinessStatus(value: unknown): value is PromotionCandidateRecord["status"] {
  return value === "blocked" || value === "paper_pending" || value === "certification_pending" || value === "live_ready";
}

function isPromotionCandidateEvidence(value: unknown): value is PromotionCandidateEvidence {
  if (!value || typeof value !== "object") {
    return false;
  }
  const evidence = value as Partial<PromotionCandidateEvidence>;
  return (
    typeof evidence.paperExecutions === "number" &&
    typeof evidence.filledOrders === "number" &&
    typeof evidence.passedPaperRiskChecks === "number"
  );
}

function isPromotionCandidateStage(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const stage = value as Record<string, unknown>;
  return (
    typeof stage.id === "string" &&
    typeof stage.label === "string" &&
    typeof stage.value === "string" &&
    typeof stage.detail === "string" &&
    (stage.status === "passed" || stage.status === "blocked" || stage.status === "review") &&
    (stage.tone === "positive" || stage.tone === "warning" || stage.tone === "neutral" || stage.tone === "risk") &&
    (stage.passed === undefined || typeof stage.passed === "boolean") &&
    (stage.reason === undefined || typeof stage.reason === "string")
  );
}

function isAiReviewRunRecordEnvelope(value: unknown): value is AiReviewRunRecordEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }
  const envelope = value as Partial<AiReviewRunRecordEnvelope>;
  return (
    typeof envelope.aiReviewId === "string" &&
    typeof envelope.runId === "string" &&
    typeof envelope.createdAt === "string" &&
    isAiReviewRunRecord(envelope.record) &&
    envelope.aiReviewId === envelope.record.aiReviewId &&
    envelope.runId === envelope.record.runId
  );
}

function isAiReviewRunRecord(value: unknown): value is AiReviewRunRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Partial<AiReviewRunRecord>;
  return (
    record.schemaVersion === 1 &&
    record.recordType === "aiqt.aiReviewRun" &&
    typeof record.aiReviewId === "string" &&
    typeof record.runId === "string" &&
    typeof record.createdAt === "string" &&
    isMarket(record.market) &&
    typeof record.symbol === "string" &&
    isTimeframe(record.timeframe) &&
    typeof record.strategyRevision === "string" &&
    typeof record.executionMode === "string" &&
    isAiReviewStatus(record.status) &&
    isAiReviewRecordSummary(record.summary) &&
    isAiReviewDossier(record.dossier) &&
    Array.isArray(record.citations) &&
    record.citations.every(isAiReviewCitation) &&
    Array.isArray(record.rounds) &&
    record.rounds.every(isAgentCommitteeRound) &&
    Array.isArray(record.decisionLog) &&
    record.decisionLog.every(isDecisionLogEntry) &&
    (record.evidenceAnchors === undefined ||
      (Array.isArray(record.evidenceAnchors) && record.evidenceAnchors.every(isAiReviewEvidenceAnchor))) &&
    typeof record.boundary === "string" &&
    record.boundary.includes("Evidence explanation only")
  );
}

function isAiReviewEvidenceAnchor(value: unknown): value is AiReviewEvidenceAnchor {
  if (!value || typeof value !== "object") {
    return false;
  }
  const anchor = value as Partial<AiReviewEvidenceAnchor>;
  return (
    typeof anchor.id === "string" &&
    anchor.id.trim().length > 0 &&
    isAiReviewEvidenceAnchorType(anchor.type) &&
    typeof anchor.label === "string" &&
    anchor.label.trim().length > 0 &&
    typeof anchor.reference === "string" &&
    anchor.reference.trim().length > 0 &&
    typeof anchor.exportPath === "string" &&
    anchor.exportPath.trim().length > 0
  );
}

function isAiReviewEvidenceAnchorType(value: unknown): value is AiReviewEvidenceAnchor["type"] {
  return (
    value === "research-run" ||
    value === "strategy-revision" ||
    value === "data-snapshot" ||
    value === "citation" ||
    value === "committee-rounds" ||
    value === "decision-log" ||
    value === "risk-boundary"
  );
}

function isAiReviewRecordSummary(value: unknown): value is AiReviewRunRecord["summary"] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<AiReviewRunRecord["summary"]>;
  return (
    typeof summary.citationCount === "number" &&
    typeof summary.roundCount === "number" &&
    typeof summary.decisionCount === "number" &&
    typeof summary.parameterScanBound === "boolean" &&
    typeof summary.liveExecutionBlocked === "boolean"
  );
}

function isAiReviewDossier(value: unknown): value is AiReviewRunRecord["dossier"] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const dossier = value as Partial<AiReviewRunRecord["dossier"]>;
  return (
    isAiReviewStatus(dossier.status) &&
    typeof dossier.headline === "string" &&
    typeof dossier.summary === "string" &&
    Array.isArray(dossier.citations) &&
    dossier.citations.every(isAiReviewCitation)
  );
}

function isAiReviewStatus(value: unknown): value is AiReviewRunRecord["status"] {
  return value === "ready" || value === "blocked";
}

function isAiReviewCitation(value: unknown): value is AiReviewRunRecord["citations"][number] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const citation = value as Partial<AiReviewRunRecord["citations"][number]>;
  return (
    isAiReviewCitationId(citation.id) &&
    typeof citation.label === "string" &&
    typeof citation.value === "string" &&
    typeof citation.detail === "string" &&
    isAiReviewTone(citation.tone)
  );
}

function isAiReviewCitationId(value: unknown): value is AiReviewRunRecord["citations"][number]["id"] {
  return (
    value === "run" ||
    value === "metrics" ||
    value === "benchmark" ||
    value === "parameter-scan" ||
    value === "strategy" ||
    value === "data-quality" ||
    value === "research-note" ||
    value === "risk-gates"
  );
}

function isAgentCommitteeRound(value: unknown): value is AiReviewRunRecord["rounds"][number] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const round = value as Partial<AiReviewRunRecord["rounds"][number]>;
  return (
    typeof round.id === "string" &&
    (round.phase === "analysis" || round.phase === "debate" || round.phase === "risk" || round.phase === "decision") &&
    typeof round.agent === "string" &&
    typeof round.thesis === "string" &&
    typeof round.evidence === "string" &&
    (round.verdict === "support" || round.verdict === "challenge" || round.verdict === "risk" || round.verdict === "watch") &&
    typeof round.confidence === "number" &&
    isAiReviewTone(round.tone)
  );
}

function isDecisionLogEntry(value: unknown): value is AiReviewRunRecord["decisionLog"][number] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const entry = value as Partial<AiReviewRunRecord["decisionLog"][number]>;
  return typeof entry.agent === "string" && typeof entry.message === "string" && isAiReviewTone(entry.tone);
}

function isAiReviewTone(value: unknown): value is AiReviewRunRecord["citations"][number]["tone"] {
  return value === "positive" || value === "warning" || value === "neutral" || value === "risk" || value === "ai";
}

function isPlatformSettingsStatus(value: unknown): value is PlatformSettingsStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const settings = value as Partial<PlatformSettingsStatus>;
  return (
    settings.schemaVersion === 1 &&
    typeof settings.generatedAt === "string" &&
    Array.isArray(settings.dataSources) &&
    settings.dataSources.every(isPlatformSettingsDataSource) &&
    isPlatformSettingsCacheStatus(settings.cache) &&
    Array.isArray(settings.executionAdapters) &&
    settings.executionAdapters.every(isPlatformSettingsExecutionAdapter) &&
    Boolean(settings.safety) &&
    typeof settings.safety?.liveTradingAllowed === "boolean" &&
    Array.isArray(settings.safety?.requiredGates) &&
    settings.safety.requiredGates.every((gate) => typeof gate === "string")
  );
}

function isPlatformSettingsDataSource(value: unknown): value is PlatformSettingsDataSource {
  if (!value || typeof value !== "object") {
    return false;
  }
  const source = value as Partial<PlatformSettingsDataSource>;
  return (
    isMarket(source.market) &&
    typeof source.label === "string" &&
    typeof source.quoteSource === "string" &&
    typeof source.klineSource === "string" &&
    isPlatformSettingsTone(source.status) &&
    (source.optionalKeyName === null || typeof source.optionalKeyName === "string") &&
    typeof source.optionalKeyConfigured === "boolean" &&
    typeof source.note === "string"
  );
}

function isPlatformSettingsCacheStatus(value: unknown): value is PlatformSettingsCacheStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const cache = value as Partial<PlatformSettingsCacheStatus>;
  return (
    cache.engine === "sqlite" &&
    typeof cache.path === "string" &&
    typeof cache.exists === "boolean" &&
    typeof cache.scope === "string" &&
    typeof cache.rowCount === "number" &&
    typeof cache.contextCount === "number" &&
    (cache.latestTimestamp === null || typeof cache.latestTimestamp === "string") &&
    isPlatformSettingsCacheFreshnessSummary(cache.freshnessSummary) &&
    Array.isArray(cache.contexts) &&
    cache.contexts.every(isPlatformSettingsCacheContext)
  );
}

function isPlatformSettingsCacheFreshnessSummary(value: unknown): value is PlatformSettingsCacheFreshnessSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<PlatformSettingsCacheFreshnessSummary>;
  return typeof summary.fresh === "number" && typeof summary.stale === "number" && typeof summary.empty === "number";
}

function isPlatformSettingsCacheContext(value: unknown): value is PlatformSettingsCacheContext {
  if (!value || typeof value !== "object") {
    return false;
  }
  const context = value as Partial<PlatformSettingsCacheContext>;
  return (
    isMarket(context.market) &&
    typeof context.symbol === "string" &&
    isTimeframe(context.timeframe) &&
    typeof context.rowCount === "number" &&
    (context.startTimestamp === null || typeof context.startTimestamp === "string") &&
    (context.endTimestamp === null || typeof context.endTimestamp === "string") &&
    (context.freshness === "fresh" || context.freshness === "stale" || context.freshness === "empty") &&
    (context.ageHours === null || typeof context.ageHours === "number")
  );
}

function isPlatformSettingsExecutionAdapter(value: unknown): value is PlatformSettingsExecutionAdapter {
  if (!value || typeof value !== "object") {
    return false;
  }
  const adapter = value as Partial<PlatformSettingsExecutionAdapter>;
  return (
    typeof adapter.id === "string" &&
    (isMarket(adapter.market) || adapter.market === "multi") &&
    typeof adapter.adapter === "string" &&
    (adapter.route === "paper" || adapter.route === "live") &&
    isPlatformSettingsTone(adapter.status) &&
    typeof adapter.certification === "string" &&
    typeof adapter.liveTradingAllowed === "boolean" &&
    typeof adapter.note === "string"
  );
}

function isPlatformSettingsTone(value: unknown): value is PlatformSettingsStatusTone {
  return (
    value === "ready" ||
    value === "degraded" ||
    value === "blocked" ||
    value === "config_required" ||
    value === "interface_only" ||
    value === "paper_ready"
  );
}

function isGoldenPathStatus(value: unknown): value is GoldenPathStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const status = value as Partial<GoldenPathStatus>;
  return (
    status.schemaVersion === 1 &&
    isMarket(status.market) &&
    typeof status.symbol === "string" &&
    isTimeframe(status.timeframe) &&
    isGoldenPathOverallStatus(status.status) &&
    (status.currentStepId === null || typeof status.currentStepId === "string") &&
    (status.latestRunId === null || typeof status.latestRunId === "string") &&
    (status.nextAction === null || isGoldenPathNextAction(status.nextAction)) &&
    isGoldenPathSummary(status.summary) &&
    Array.isArray(status.runbook) &&
    status.runbook.every(isGoldenPathRunbookItem) &&
    Array.isArray(status.workspaces) &&
    status.workspaces.every(isGoldenPathWorkspace) &&
    Array.isArray(status.steps) &&
    status.steps.every(isGoldenPathStep)
  );
}

function isGoldenPathOverallStatus(value: unknown): value is GoldenPathOverallStatus {
  return value === "ready" || value === "review" || value === "blocked";
}

function isGoldenPathStep(value: unknown): value is GoldenPathStep {
  if (!value || typeof value !== "object") {
    return false;
  }
  const step = value as Partial<GoldenPathStep>;
  return (
    typeof step.id === "string" &&
    typeof step.label === "string" &&
    isGoldenPathStepStatus(step.status) &&
    typeof step.passed === "boolean" &&
    typeof step.detail === "string" &&
    (step.actionId === null || typeof step.actionId === "string")
  );
}

function isGoldenPathStepStatus(value: unknown): value is GoldenPathStepStatus {
  return value === "passed" || value === "review" || value === "blocked";
}

function isGoldenPathWorkspace(value: unknown): value is GoldenPathWorkspace {
  if (!value || typeof value !== "object") {
    return false;
  }
  const workspace = value as Partial<GoldenPathWorkspace>;
  return (
    typeof workspace.id === "string" &&
    typeof workspace.label === "string" &&
    isGoldenPathWorkspaceStatus(workspace.status) &&
    typeof workspace.current === "boolean" &&
    Array.isArray(workspace.stepIds) &&
    workspace.stepIds.every((stepId) => typeof stepId === "string") &&
    typeof workspace.reason === "string" &&
    (workspace.actionId === null || typeof workspace.actionId === "string")
  );
}

function isGoldenPathWorkspaceStatus(value: unknown): value is GoldenPathWorkspaceStatus {
  return value === "ready" || value === "needs_run" || value === "blocked";
}

function isGoldenPathSummary(value: unknown): value is GoldenPathSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<GoldenPathSummary>;
  return (
    typeof summary.totalSteps === "number" &&
    typeof summary.passedSteps === "number" &&
    typeof summary.reviewSteps === "number" &&
    typeof summary.blockedSteps === "number" &&
    (summary.currentStepLabel === null || typeof summary.currentStepLabel === "string") &&
    (summary.nextActionId === null || typeof summary.nextActionId === "string") &&
    typeof summary.liveTradingAllowed === "boolean"
  );
}

function isGoldenPathRunbookItem(value: unknown): value is GoldenPathRunbookItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Partial<GoldenPathRunbookItem>;
  return (
    typeof item.stepId === "string" &&
    typeof item.label === "string" &&
    typeof item.workspaceId === "string" &&
    isGoldenPathStepStatus(item.status) &&
    typeof item.current === "boolean" &&
    typeof item.passed === "boolean" &&
    typeof item.detail === "string" &&
    (item.blocker === null || typeof item.blocker === "string") &&
    (item.actionId === null || typeof item.actionId === "string") &&
    (item.actionLabel === null || typeof item.actionLabel === "string")
  );
}

function isGoldenPathNextAction(value: unknown): value is GoldenPathNextAction {
  if (!value || typeof value !== "object") {
    return false;
  }
  const action = value as Partial<GoldenPathNextAction>;
  return (
    typeof action.id === "string" &&
    typeof action.label === "string" &&
    typeof action.targetWorkspace === "string" &&
    typeof action.reason === "string"
  );
}

function isPaperExecutionRecord(value: unknown): value is PaperExecutionRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const execution = value as Partial<PaperExecutionRecord>;
  return (
    typeof execution.executionId === "string" &&
    typeof execution.runId === "string" &&
    typeof execution.createdAt === "string" &&
    typeof execution.mode === "string" &&
    isPaperExecutionAccount(execution.account) &&
    Array.isArray(execution.orders) &&
    execution.orders.every(isPaperExecutionOrder) &&
    Array.isArray(execution.gates) &&
    execution.gates.every(isPaperExecutionGate)
  );
}

function isPaperExecutionAccount(value: unknown): value is PaperExecutionAccount {
  if (!value || typeof value !== "object") {
    return false;
  }
  const account = value as Partial<PaperExecutionAccount>;
  return (
    typeof account.cash === "number" &&
    typeof account.equity === "number" &&
    Boolean(account.positions) &&
    typeof account.positions === "object" &&
    Object.values(account.positions).every((quantity) => typeof quantity === "number")
  );
}

function isPaperExecutionOrder(value: unknown): value is PaperExecutionOrder {
  if (!value || typeof value !== "object") {
    return false;
  }
  const order = value as Partial<PaperExecutionOrder>;
  return (
    typeof order.orderId === "string" &&
    typeof order.symbol === "string" &&
    (order.side === "buy" || order.side === "sell") &&
    typeof order.quantity === "number" &&
    typeof order.price === "number" &&
    (order.status === "filled" || order.status === "rejected") &&
    typeof order.reason === "string" &&
    typeof order.timestamp === "string"
  );
}

function isPaperExecutionGate(value: unknown): value is PaperExecutionGate {
  if (!value || typeof value !== "object") {
    return false;
  }
  const gate = value as Partial<PaperExecutionGate>;
  return (
    typeof gate.id === "string" &&
    typeof gate.label === "string" &&
    typeof gate.passed === "boolean" &&
    typeof gate.reason === "string"
  );
}

function isResearchRunExportPackage(value: unknown): value is ResearchRunExportPackage {
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
    (exportPackage.promotionCandidate === undefined ||
      exportPackage.promotionCandidate === null ||
      isPromotionCandidateRecord(exportPackage.promotionCandidate)) &&
    (exportPackage.aiReviewRuns === undefined ||
      (Array.isArray(exportPackage.aiReviewRuns) && exportPackage.aiReviewRuns.every(isAiReviewRunRecordEnvelope))) &&
    (exportPackage.auditEvidenceSummary === undefined ||
      isResearchRunExportAuditEvidenceSummary(exportPackage.auditEvidenceSummary)) &&
    (exportPackage.auditReport === undefined || isResearchRunExportAuditReport(exportPackage.auditReport))
  );
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
    isResearchRunExportAuditEvidenceSummary(report.evidenceSummary)
  );
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

async function sha256TextHex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function sanitizeDownloadFileName(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/gu, "-").replace(/^-+|-+$/gu, "");
  return normalized || "audit-run";
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
    (counts?.researchNotes === undefined || typeof counts.researchNotes === "number") &&
    (counts?.aiReviewRuns === undefined || typeof counts.aiReviewRuns === "number")
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

function isMarketKlinesPayload(value: unknown): value is Omit<MarketKlinesResult, "source" | "error"> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<MarketKlinesResult>;
  return (
    isMarket(payload.market) &&
    typeof payload.symbol === "string" &&
    isTimeframe(payload.timeframe) &&
    isMarketKlineQuality(payload.quality) &&
    Array.isArray(payload.bars) &&
    payload.bars.every(isMarketKlineBar)
  );
}

function isMarketKlineQuality(value: unknown): value is MarketKlineQuality {
  if (!value || typeof value !== "object") {
    return false;
  }
  const quality = value as Partial<MarketKlineQuality>;
  return (
    typeof quality.source === "string" &&
    typeof quality.isComplete === "boolean" &&
    Array.isArray(quality.warnings) &&
    quality.warnings.every((warning) => typeof warning === "string") &&
    typeof quality.rows === "number"
  );
}

function isMarketKlineBar(value: unknown): value is MarketKlineBar {
  if (!value || typeof value !== "object") {
    return false;
  }
  const bar = value as Partial<MarketKlineBar>;
  return (
    typeof bar.timestamp === "string" &&
    typeof bar.timestampMs === "number" &&
    typeof bar.open === "number" &&
    typeof bar.high === "number" &&
    typeof bar.low === "number" &&
    typeof bar.close === "number" &&
    typeof bar.volume === "number"
  );
}

function isMarketSearchPayload(value: unknown): value is Omit<MarketSearchResult, "source" | "error"> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<MarketSearchResult>;
  return (
    isMarket(payload.market) &&
    typeof payload.query === "string" &&
    Array.isArray(payload.results) &&
    payload.results.every(isMarketSearchSuggestion)
  );
}

function isMarketSearchSuggestion(value: unknown): value is MarketSearchSuggestion {
  if (!value || typeof value !== "object") {
    return false;
  }
  const suggestion = value as Partial<MarketSearchSuggestion>;
  return (
    isMarket(suggestion.market) &&
    typeof suggestion.symbol === "string" &&
    typeof suggestion.name === "string" &&
    typeof suggestion.source === "string"
  );
}

function isResearchRunAudit(value: unknown): value is ResearchRunAudit {
  if (!value || typeof value !== "object") {
    return false;
  }
  const run = value as Partial<ResearchRunAudit>;
  return (
    Boolean(run.runId) &&
    Boolean(run.createdAt) &&
    Boolean(run.market) &&
    Boolean(run.symbol) &&
    isTimeframe(run.timeframe) &&
    Boolean(run.strategyName) &&
    Boolean(run.strategyRevision) &&
    typeof run.dataRows === "number" &&
    Boolean(run.metrics) &&
    Array.isArray(run.decisions) &&
    Boolean(run.executionMode) &&
    (run.aiReport === undefined || isResearchRunAiReport(run.aiReport)) &&
    (run.dataQuality === undefined || isResearchRunDataQuality(run.dataQuality)) &&
    (run.dataSnapshot === undefined || isResearchRunDataSnapshot(run.dataSnapshot)) &&
    (run.researchNote === undefined || isResearchRunNote(run.researchNote)) &&
    (run.strategyConfig === undefined || isResearchRunStrategyConfig(run.strategyConfig)) &&
    (run.backtestAssumptions === undefined || isBacktestAssumptions(run.backtestAssumptions)) &&
    (run.backtestTrades === undefined ||
      (Array.isArray(run.backtestTrades) && run.backtestTrades.every(isBacktestTradeRow))) &&
    (run.backtestEquityCurve === undefined ||
      (Array.isArray(run.backtestEquityCurve) && run.backtestEquityCurve.every(isBacktestEquityPoint))) &&
    (run.backtestDiagnostics === undefined ||
      (Array.isArray(run.backtestDiagnostics) && run.backtestDiagnostics.every(isBacktestDiagnostic)))
  );
}

function isResearchRunNote(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const note = value as Record<string, unknown>;
  return (
    isMarket(note.market) &&
    typeof note.symbol === "string" &&
    isTimeframe(note.timeframe) &&
    typeof note.body === "string" &&
    (note.updatedAt === null || typeof note.updatedAt === "string")
  );
}

function isResearchRunDataSnapshot(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const snapshot = value as Record<string, unknown>;
  return (
    typeof snapshot.source === "string" &&
    typeof snapshot.isComplete === "boolean" &&
    Array.isArray(snapshot.warnings) &&
    snapshot.warnings.every((warning) => typeof warning === "string") &&
    typeof snapshot.rows === "number" &&
    (snapshot.start === null || typeof snapshot.start === "string") &&
    (snapshot.end === null || typeof snapshot.end === "string") &&
    typeof snapshot.hash === "string" &&
    Array.isArray(snapshot.bars) &&
    snapshot.bars.every(isMarketKlineBar)
  );
}

function isResearchRunAiReport(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const report = value as Record<string, unknown>;
  return (
    typeof report.summary === "string" &&
    Array.isArray(report.risks) &&
    report.risks.every((risk) => typeof risk === "string") &&
    Array.isArray(report.improvements) &&
    report.improvements.every((improvement) => typeof improvement === "string") &&
    typeof report.disclaimer === "string"
  );
}

function isResearchRunStrategyConfig(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const config = value as Record<string, unknown>;
  return (
    typeof config.name === "string" &&
    typeof config.revision === "string" &&
    isMarket(config.market) &&
    Array.isArray(config.symbols) &&
    config.symbols.every((symbol) => typeof symbol === "string") &&
    isTimeframe(config.timeframe) &&
    typeof config.version === "number" &&
    Array.isArray(config.entryConditions) &&
    config.entryConditions.every(isResearchRunStrategyCondition) &&
    Array.isArray(config.exitConditions) &&
    config.exitConditions.every(isResearchRunStrategyCondition) &&
    isResearchRunStrategyRisk(config.risk)
  );
}

function isResearchRunStrategyCondition(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const condition = value as Record<string, unknown>;
  return typeof condition.kind === "string" && isPlainRecord(condition.params);
}

function isResearchRunStrategyRisk(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const risk = value as Record<string, unknown>;
  return (
    isNullableNumber(risk.positionPct) &&
    isNullableNumber(risk.stopLossPct) &&
    isNullableNumber(risk.takeProfitPct) &&
    isNullableNumber(risk.maxDrawdownPct)
  );
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNullableNumber(value: unknown): boolean {
  return value === null || typeof value === "number";
}

function isResearchRunDataQuality(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const quality = value as Record<string, unknown>;
  return (
    typeof quality.source === "string" &&
    typeof quality.isComplete === "boolean" &&
    Array.isArray(quality.warnings) &&
    quality.warnings.every((warning) => typeof warning === "string") &&
    typeof quality.rows === "number"
  );
}

function isBacktestDiagnostic(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const diagnostic = value as Record<string, unknown>;
  return (
    typeof diagnostic.id === "string" &&
    typeof diagnostic.label === "string" &&
    typeof diagnostic.value === "string" &&
    typeof diagnostic.detail === "string" &&
    (diagnostic.tone === "positive" ||
      diagnostic.tone === "warning" ||
      diagnostic.tone === "neutral" ||
      diagnostic.tone === "risk")
  );
}

function isBacktestEquityPoint(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const point = value as Record<string, unknown>;
  return typeof point.timestamp === "string" && typeof point.equity === "number";
}

function isBacktestTradeRow(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.timestamp === "string" &&
    typeof row.symbol === "string" &&
    (row.side === "BUY" || row.side === "SELL" || row.side === "RISK" || row.side === "HOLD") &&
    (row.status === "filled" || row.status === "open" || row.status === "review" || row.status === "blocked") &&
    typeof row.price === "string" &&
    typeof row.quantity === "string" &&
    typeof row.exposure === "string" &&
    typeof row.pnl === "string" &&
    typeof row.reason === "string" &&
    (row.tone === "positive" || row.tone === "warning" || row.tone === "neutral" || row.tone === "risk")
  );
}

function isBacktestAssumptions(value: unknown): value is BacktestAssumptions {
  if (!value || typeof value !== "object") {
    return false;
  }
  const assumptions = value as Partial<BacktestAssumptions>;
  return (
    typeof assumptions.initialCash === "number" &&
    typeof assumptions.feeBps === "number" &&
    typeof assumptions.slippageBps === "number"
  );
}

function isMarket(value: unknown): value is Market {
  return value === "ashare" || value === "us" || value === "crypto";
}

function isTerminalWorkspace(value: unknown): value is TerminalWorkspace {
  if (!value || typeof value !== "object") {
    return false;
  }
  const workspace = value as Partial<TerminalWorkspace>;
  return (
    workspace.schemaVersion === 1 &&
    Boolean(workspace.selectedInstrument?.symbol) &&
    isTimeframe(workspace.selectedTimeframe) &&
    Array.isArray(workspace.watchlist) &&
    Array.isArray(workspace.quantLoop) &&
    Array.isArray(workspace.modules) &&
    Array.isArray(workspace.panels) &&
    Array.isArray(workspace.agents) &&
    Boolean(workspace.execution) &&
    Array.isArray(workspace.execution?.gates) &&
    Boolean(workspace.strategy) &&
    Array.isArray(workspace.metrics) &&
    Array.isArray(workspace.decisionLog) &&
    Array.isArray(workspace.workflowNodes)
  );
}

function isTimeframe(value: unknown): value is Timeframe {
  return (
    value === "1d" ||
    value === "1m" ||
    value === "5m" ||
    value === "15m" ||
    value === "30m" ||
    value === "60m"
  );
}
