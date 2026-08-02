import type {
  Market,
  P2ManifestChainPreflightStageSource,
  P2ManifestChainPreflightSummarySource,
  P2PaperReplaySummarySource,
  P2PreLiveAcceptanceSummarySource,
  Timeframe
} from "./terminal-workbench";
import {
  buildApiUrl,
  coreErrorDetail,
  defaultFetcher,
  type WorkspaceFetcher
} from "./terminal-api-http";
import {
  isAuditEventRecord,
  isMarket,
  isTimeframe,
  type AuditEventRecord
} from "./terminal-api-contract";

type ResearchTimeframe = Timeframe;
type WorkspaceSource = "core" | "fallback";

export interface P0AcceptanceManifestCheck {
  id: string;
  status: string;
  summary: string;
}

export interface P0AcceptanceManifest {
  kind: string;
  schemaVersion: number;
  generatedAt: string;
  status: string;
  baseUrl: string;
  importBaseUrl?: string | null;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  runId: string;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  checkCount: number;
  checks: P0AcceptanceManifestCheck[];
}

export interface P0AcceptanceStatus {
  kind: "aiqt.p0AcceptanceStatus";
  schemaVersion: 1;
  status: "passed" | "missing" | "invalid";
  available: boolean;
  sourcePath: string;
  summary: string;
  reason: string;
  generatedAt: string | null;
  runId: string | null;
  market: Market | null;
  symbol: string | null;
  timeframe: ResearchTimeframe | null;
  checkCount: number;
  requiredCheckCount: number;
  checkIds: string[];
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  manifest: P0AcceptanceManifest | null;
}

export interface P0AcceptanceLatestResult {
  acceptance?: P0AcceptanceStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface P1AcceptanceManifestCheck {
  id: string;
  status: string;
  summary: string;
}

export interface P1AcceptanceManifestWatchlistItem {
  market: string;
  symbol: string;
  name: string;
}

export interface P1AcceptanceManifest {
  kind: string;
  schemaVersion: number;
  generatedAt: string;
  status: string;
  baseUrl: string;
  importBaseUrl?: string | null;
  timeframe: ResearchTimeframe;
  runId: string;
  watchlistRefreshRunId: string;
  queuedMarket: Market;
  queuedSymbol: string;
  watchlistCount: number;
  watchlist: P1AcceptanceManifestWatchlistItem[];
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  checkCount: number;
  checks: P1AcceptanceManifestCheck[];
}

export interface P1AcceptanceStatus {
  kind: "aiqt.p1AcceptanceStatus";
  schemaVersion: 1;
  status: "passed" | "missing" | "invalid";
  available: boolean;
  sourcePath: string;
  summary: string;
  reason: string;
  generatedAt: string | null;
  runId: string | null;
  timeframe: ResearchTimeframe | null;
  watchlistRefreshRunId: string | null;
  queuedMarket: Market | null;
  queuedSymbol: string | null;
  watchlistCount: number;
  checkCount: number;
  requiredCheckCount: number;
  checkIds: string[];
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  manifest: P1AcceptanceManifest | null;
}

export interface P1AcceptanceLatestResult {
  acceptance?: P1AcceptanceStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface DesktopReleaseManifestCheck {
  id: string;
  status: string;
  summary: string;
}

export interface DesktopReleaseManifest {
  kind: string;
  schemaVersion: number;
  generatedAt: string;
  status: string;
  platform: string;
  version: string;
  tauriConfigPath: string;
  desktopArtifactPath: string;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  checkCount: number;
  checks: DesktopReleaseManifestCheck[];
}

export interface DesktopReleaseStatus {
  kind: "aiqt.desktopReleaseStatus";
  schemaVersion: 1;
  status: "passed" | "missing" | "invalid";
  available: boolean;
  sourcePath: string;
  summary: string;
  reason: string;
  generatedAt: string | null;
  platform: string | null;
  version: string | null;
  tauriConfigPath: string | null;
  desktopArtifactPath: string | null;
  checkCount: number;
  requiredCheckCount: number;
  checkIds: string[];
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  manifest: DesktopReleaseManifest | null;
}

export interface DesktopReleaseLatestResult {
  release?: DesktopReleaseStatus;
  source: WorkspaceSource;
  error?: string;
}

export type Stage1DailyUseReportStatus = "ready" | "review" | "blocked" | "missing" | "invalid";
export type Stage1DailyUseReportRowStatus = "ready" | "review" | "blocked";

export interface Stage1DailyUseReportSourcePaths {
  p0Acceptance: string;
  p1Acceptance: string;
  desktopRelease: string;
}

export interface Stage1DailyUseReportRow {
  id: string;
  label: string;
  status: Stage1DailyUseReportRowStatus;
  value: string;
  summary: string;
  action: string;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
}

export interface Stage1DailyUseReport {
  kind: "aiqt.stage1DailyUseReport";
  schemaVersion: 1;
  generatedAt: string | null;
  status: Stage1DailyUseReportStatus;
  summary: string;
  reason?: string;
  readyCount: number;
  totalCount: number;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  sourcePath?: string;
  staleSourcePaths?: string[];
  sourcePaths: Stage1DailyUseReportSourcePaths;
  rows: Stage1DailyUseReportRow[];
}

export interface Stage1DailyUseLatestResult {
  dailyUse?: Stage1DailyUseReport;
  source: WorkspaceSource;
  error?: string;
}

export interface Stage1DailyUseGenerateResult {
  dailyUse?: Stage1DailyUseReport;
  status: "daily_use_generated" | "daily_use_failed";
  source: WorkspaceSource;
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  error?: string;
}

export type Stage1BootstrapPreflightStatus = "ready" | "review" | "blocked" | "missing" | "invalid";
export type Stage1BootstrapPreflightCheckStatus = "ready" | "review" | "blocked";

export interface Stage1BootstrapPreflightSourcePaths {
  p0Acceptance: string;
  p1Acceptance: string;
  p2ManifestChainPreflight: string;
  desktopRelease: string;
  stage1DailyUse: string;
}

export interface Stage1BootstrapPreflightCheck {
  id: string;
  label: string;
  status: Stage1BootstrapPreflightCheckStatus;
  summary: string;
  recommendedCommand: string;
  sourcePath: string;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
}

export interface Stage1BootstrapPreflight {
  kind: "aiqt.stage1BootstrapPreflight";
  schemaVersion: 1;
  generatedAt: string | null;
  status: Stage1BootstrapPreflightStatus;
  summary: string;
  reason?: string;
  ready: boolean;
  readyCount: number;
  reviewCount: number;
  blockedCount: number;
  totalCount: number;
  nextAction: string;
  recommendedCommand: string;
  blockerIds: string[];
  reviewIds: string[];
  paperOnly: boolean;
  liveTradingAllowed: boolean;
  liveBlockedBoundary: boolean;
  sourcePath?: string;
  staleSourcePaths?: string[];
  sourcePaths: Stage1BootstrapPreflightSourcePaths;
  checks: Stage1BootstrapPreflightCheck[];
}

export interface Stage1BootstrapPreflightLatestResult {
  preflight?: Stage1BootstrapPreflight;
  source: WorkspaceSource;
  error?: string;
}

export interface Stage1BootstrapPreflightGenerateResult {
  preflight?: Stage1BootstrapPreflight;
  status: "preflight_generated" | "preflight_failed";
  source: WorkspaceSource;
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  error?: string;
}

export interface P2PreLiveAcceptanceManifestCheck {
  id: string;
  status: string;
  summary: string;
}

export interface P2PreLiveAcceptanceManifest {
  kind: string;
  schemaVersion: number;
  generatedAt: string;
  status: string;
  baseUrl: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  runId: string;
  adapterId: string;
  promotionStatus: string;
  checklistStatus: string;
  passedGateCount: number;
  totalGateCount: number;
  blockingGateCount: number;
  gateIds: string[];
  blockerIds: string[];
  auditEventIds: string[];
  manualRouteCandidate: boolean;
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  liveBlockedBoundary: boolean;
  checkCount: number;
  checks: P2PreLiveAcceptanceManifestCheck[];
}

export interface P2PreLiveAcceptanceStatus extends P2PreLiveAcceptanceSummarySource {
  kind: "aiqt.p2PreLiveAcceptanceStatus";
  schemaVersion: 1;
  status: "passed" | "missing" | "invalid";
  manifest: P2PreLiveAcceptanceManifest | null;
}

export interface P2PreLiveAcceptanceLatestResult {
  acceptance?: P2PreLiveAcceptanceStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface P2PaperReplayManifestCheck {
  id: string;
  status: string;
  summary: string;
  evidenceId: string;
}

export interface P2PaperReplayMetrics {
  filledPaperOrders: number;
  portfolioOrders: number;
  approvedPortfolioOrders: number;
  portfolioFilledOrders: number;
  stateHistoryFilledEvents: number;
  adapterPaperExecutions: number;
  replayWarnings: number;
}

export interface P2PaperReplayManifest {
  kind: string;
  schemaVersion: number;
  generatedAt: string;
  status: string;
  baseUrl: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  runId: string;
  adapterId: string;
  replayStatus: string;
  passedCheckCount: number;
  totalCheckCount: number;
  warningCount: number;
  checkIds: string[];
  auditEventIds: string[];
  latestEvidenceId: string;
  metrics: P2PaperReplayMetrics;
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  liveBlockedBoundary: boolean;
  checkCount: number;
  checks: P2PaperReplayManifestCheck[];
}

export interface P2PaperReplayStatus extends P2PaperReplaySummarySource {
  kind: "aiqt.p2PaperReplayStatus";
  schemaVersion: 1;
  status: "passed" | "missing" | "invalid";
  manifest: P2PaperReplayManifest | null;
}

export interface P2PaperReplayLatestResult {
  replay?: P2PaperReplayStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface P2ReadinessAcceptanceManifestPaths {
  p1Acceptance: string | null;
  p2PreLiveAcceptance: string | null;
  p2PaperReplay: string | null;
}

export interface P2ReadinessAcceptanceManifestCheck {
  id: string;
  status: string;
  summary: string;
  evidenceId: string;
}

export interface P2ReadinessAcceptanceManifest {
  kind: string;
  schemaVersion: number;
  generatedAt: string;
  status: string;
  baseUrl: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  runId: string;
  adapterId: string;
  p1AcceptanceRunId: string;
  p2PreLiveAcceptanceRunId: string;
  p2PaperReplayRunId: string;
  operatorRunbookAuditEventId: string;
  readinessCoverageStatus: string;
  acceptedCriterionCount: number;
  totalCriterionCount: number;
  blockingCriterionCount: number;
  criterionIds: string[];
  auditEventIds: string[];
  manifestPaths: P2ReadinessAcceptanceManifestPaths;
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  liveBlockedBoundary: boolean;
  checkCount: number;
  checks: P2ReadinessAcceptanceManifestCheck[];
}

export interface P2ReadinessAcceptanceReadbackStatus {
  kind: "aiqt.p2ReadinessAcceptanceStatus";
  schemaVersion: 1;
  status: "accepted" | "missing" | "invalid";
  available: boolean;
  sourcePath: string;
  summary: string;
  reason: string;
  generatedAt: string | null;
  runId: string | null;
  market: Market | null;
  symbol: string | null;
  timeframe: ResearchTimeframe | null;
  adapterId: string | null;
  p1AcceptanceRunId: string | null;
  p2PreLiveAcceptanceRunId: string | null;
  p2PaperReplayRunId: string | null;
  operatorRunbookAuditEventId: string | null;
  readinessCoverageStatus: string | null;
  acceptedCriterionCount: number;
  totalCriterionCount: number;
  blockingCriterionCount: number;
  criterionIds: string[];
  auditEventIds: string[];
  manifestPaths: P2ReadinessAcceptanceManifestPaths;
  checkCount: number;
  requiredCheckCount: number;
  checkIds: string[];
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  liveBlockedBoundary: boolean;
  manifest: P2ReadinessAcceptanceManifest | null;
}

export interface P2ReadinessAcceptanceLatestResult {
  acceptance?: P2ReadinessAcceptanceReadbackStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface P2ReadinessAcceptanceGenerateResult {
  acceptance?: P2ReadinessAcceptanceReadbackStatus;
  auditEvent?: AuditEventRecord;
  status: "acceptance_generated" | "acceptance_failed";
  source: WorkspaceSource;
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  error?: string;
}

export interface P2ManifestChainPreflightManifest {
  kind: string;
  schemaVersion: number;
  status: "ready" | "blocked";
  ready: boolean;
  validStageCount: number;
  totalStageCount: number;
  blockerIds: string[];
  nextAction: string;
  nextCommand: string;
  stages: P2ManifestChainPreflightStageSource[];
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
  liveBlockedBoundary: boolean;
}

export interface P2ManifestChainPreflightStatus extends P2ManifestChainPreflightSummarySource {
  kind: "aiqt.p2ManifestChainPreflightStatus";
  schemaVersion: 1;
  status: "ready" | "blocked" | "missing" | "invalid";
  manifest: P2ManifestChainPreflightManifest | null;
}

export interface P2ManifestChainPreflightLatestResult {
  preflight?: P2ManifestChainPreflightStatus;
  source: WorkspaceSource;
  error?: string;
}

export interface P2ManifestChainPreflightGenerateResult {
  preflight?: P2ManifestChainPreflightStatus;
  auditEvent?: AuditEventRecord;
  status: "preflight_generated" | "preflight_failed";
  source: WorkspaceSource;
  error?: string;
}

export function buildP0AcceptanceLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p0/acceptance/latest");
}

export function buildP1AcceptanceLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p1/acceptance/latest");
}

export function buildDesktopReleaseLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/desktop/release/latest");
}

export function buildStage1DailyUseUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/stage1/daily-use");
}

export function buildStage1DailyUseLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/stage1/daily-use/latest");
}

export function buildStage1BootstrapPreflightUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/stage1/bootstrap-preflight");
}

export function buildStage1BootstrapPreflightLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/stage1/bootstrap-preflight/latest");
}

export function buildP2PreLiveAcceptanceLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p2/pre-live/acceptance/latest");
}

export function buildP2PaperReplayLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p2/paper-replay/latest");
}

export function buildP2ReadinessAcceptanceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p2/readiness/acceptance");
}

export function buildP2ReadinessAcceptanceLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p2/readiness/acceptance/latest");
}

export function buildP2ManifestChainPreflightUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p2/manifest-chain/preflight");
}

export function buildP2ManifestChainPreflightLatestUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p2/manifest-chain/preflight/latest");
}

export async function loadP0AcceptanceLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P0AcceptanceLatestResult> {
  try {
    const response = await fetcher(buildP0AcceptanceLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isP0AcceptanceLatestPayload(payload)) {
      throw new Error("Invalid P0 acceptance status contract");
    }
    return {
      acceptance: payload.acceptance,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown P0 acceptance readback error";
    return {
      acceptance: buildMissingP0AcceptanceStatus(message),
      source: "fallback",
      error: message
    };
  }
}

function buildMissingP0AcceptanceStatus(reason: string): P0AcceptanceStatus {
  return {
    kind: "aiqt.p0AcceptanceStatus",
    schemaVersion: 1,
    status: "missing",
    available: false,
    sourcePath: "data/p0-acceptance.json",
    summary: "P0 acceptance manifest is missing.",
    reason,
    generatedAt: null,
    runId: null,
    market: null,
    symbol: null,
    timeframe: null,
    checkCount: 0,
    requiredCheckCount: 4,
    checkIds: [],
    paperOnly: false,
    liveTradingAllowed: false,
    liveBlockedBoundary: false,
    manifest: null
  };
}

export async function loadP1AcceptanceLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P1AcceptanceLatestResult> {
  try {
    const response = await fetcher(buildP1AcceptanceLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isP1AcceptanceLatestPayload(payload)) {
      throw new Error("Invalid P1 acceptance status contract");
    }
    return {
      acceptance: payload.acceptance,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown P1 acceptance readback error";
    return {
      acceptance: buildMissingP1AcceptanceStatus(message),
      source: "fallback",
      error: message
    };
  }
}

function buildMissingP1AcceptanceStatus(reason: string): P1AcceptanceStatus {
  return {
    kind: "aiqt.p1AcceptanceStatus",
    schemaVersion: 1,
    status: "missing",
    available: false,
    sourcePath: "data/p1-acceptance.json",
    summary: "P1 acceptance manifest is missing.",
    reason,
    generatedAt: null,
    runId: null,
    timeframe: null,
    watchlistRefreshRunId: null,
    queuedMarket: null,
    queuedSymbol: null,
    watchlistCount: 0,
    checkCount: 0,
    requiredCheckCount: 8,
    checkIds: [],
    paperOnly: false,
    liveTradingAllowed: false,
    liveBlockedBoundary: false,
    manifest: null
  };
}

export async function loadDesktopReleaseLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<DesktopReleaseLatestResult> {
  try {
    const response = await fetcher(buildDesktopReleaseLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isDesktopReleaseLatestPayload(payload)) {
      throw new Error("Invalid desktop release status contract");
    }
    return {
      release: payload.release,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown desktop release readback error";
    return {
      release: buildMissingDesktopReleaseStatus(message),
      source: "fallback",
      error: message
    };
  }
}

function buildMissingDesktopReleaseStatus(reason: string): DesktopReleaseStatus {
  return {
    kind: "aiqt.desktopReleaseStatus",
    schemaVersion: 1,
    status: "missing",
    available: false,
    sourcePath: "data/desktop-release.json",
    summary: "Desktop release manifest is missing.",
    reason,
    generatedAt: null,
    platform: null,
    version: null,
    tauriConfigPath: null,
    desktopArtifactPath: null,
    checkCount: 0,
    requiredCheckCount: 5,
    checkIds: [],
    paperOnly: false,
    liveTradingAllowed: false,
    liveBlockedBoundary: false,
    manifest: null
  };
}

export async function loadStage1DailyUseLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<Stage1DailyUseLatestResult> {
  try {
    const response = await fetcher(buildStage1DailyUseLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStage1DailyUseLatestPayload(payload)) {
      throw new Error("Invalid Stage 1 daily-use report contract");
    }
    return {
      dailyUse: payload.dailyUse,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stage 1 daily-use readback error";
    return {
      dailyUse: buildMissingStage1DailyUseReport(message),
      source: "fallback",
      error: message
    };
  }
}

export async function generateStage1DailyUse(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<Stage1DailyUseGenerateResult> {
  try {
    const response = await fetcher(buildStage1DailyUseUrl(baseUrl), {
      method: "POST"
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStage1DailyUseGeneratePayload(payload)) {
      throw new Error("Invalid Stage 1 daily-use generation contract");
    }
    return {
      dailyUse: payload.dailyUse,
      status: payload.status,
      source: "core",
      paperOnly: payload.paperOnly,
      orderSubmissionEnabled: payload.orderSubmissionEnabled,
      liveTradingAllowed: payload.liveTradingAllowed,
      liveOrderSubmitted: payload.liveOrderSubmitted,
      routeExecuted: payload.routeExecuted
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stage 1 daily-use generation error";
    return {
      dailyUse: buildMissingStage1DailyUseReport(message),
      status: "daily_use_failed",
      source: "fallback",
      paperOnly: true,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      error: message
    };
  }
}

function buildMissingStage1DailyUseReport(reason: string): Stage1DailyUseReport {
  const row = (id: string, label: string): Stage1DailyUseReportRow => ({
    id,
    label,
    status: "blocked",
    value: "Stage 1 report unavailable",
    summary: "Stage 1 daily-use report is missing.",
    action: "npm run stage1:daily",
    paperOnly: true,
    liveTradingAllowed: false,
    liveBlockedBoundary: true
  });
  return {
    kind: "aiqt.stage1DailyUseReport",
    schemaVersion: 1,
    generatedAt: null,
    status: "missing",
    summary: "Stage 1 daily-use report is missing.",
    reason,
    readyCount: 0,
    totalCount: 5,
    paperOnly: true,
    liveTradingAllowed: false,
    liveBlockedBoundary: true,
    sourcePath: "data/stage1-daily-use.json",
    sourcePaths: {
      p0Acceptance: "data/p0-acceptance.json",
      p1Acceptance: "data/p1-acceptance.json",
      desktopRelease: "data/desktop-release.json"
    },
    rows: [
      row("clean-open", "Clean environment startup"),
      row("market-refresh-recovery", "Market refresh recovery"),
      row("research-entry", "Research entry"),
      row("daily-start", "Daily start path"),
      row("desktop-release", "Desktop release")
    ]
  };
}

export async function loadStage1BootstrapPreflightLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<Stage1BootstrapPreflightLatestResult> {
  try {
    const response = await fetcher(buildStage1BootstrapPreflightLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStage1BootstrapPreflightLatestPayload(payload)) {
      throw new Error("Invalid Stage 1 bootstrap preflight contract");
    }
    return {
      preflight: payload.preflight,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stage 1 bootstrap preflight readback error";
    return {
      preflight: buildMissingStage1BootstrapPreflight(message),
      source: "fallback",
      error: message
    };
  }
}

export async function generateStage1BootstrapPreflight(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<Stage1BootstrapPreflightGenerateResult> {
  try {
    const response = await fetcher(buildStage1BootstrapPreflightUrl(baseUrl), {
      method: "POST"
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isStage1BootstrapPreflightGeneratePayload(payload)) {
      throw new Error("Invalid Stage 1 bootstrap preflight generation contract");
    }
    return {
      preflight: payload.preflight,
      status: payload.status,
      source: "core",
      paperOnly: payload.paperOnly,
      orderSubmissionEnabled: payload.orderSubmissionEnabled,
      liveTradingAllowed: payload.liveTradingAllowed,
      liveOrderSubmitted: payload.liveOrderSubmitted,
      routeExecuted: payload.routeExecuted
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stage 1 bootstrap preflight generation error";
    return {
      preflight: buildMissingStage1BootstrapPreflight(message),
      status: "preflight_failed",
      source: "fallback",
      paperOnly: true,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      error: message
    };
  }
}

function buildMissingStage1BootstrapPreflight(reason: string): Stage1BootstrapPreflight {
  const check = (id: string, label: string, sourcePath: string, recommendedCommand: string): Stage1BootstrapPreflightCheck => ({
    id,
    label,
    status: "blocked",
    summary: "Stage 1 bootstrap preflight report is missing.",
    recommendedCommand,
    sourcePath,
    paperOnly: true,
    liveTradingAllowed: false,
    liveBlockedBoundary: true
  });
  return {
    kind: "aiqt.stage1BootstrapPreflight",
    schemaVersion: 1,
    generatedAt: null,
    status: "missing",
    summary: "Stage 1 bootstrap preflight report is missing.",
    reason,
    ready: false,
    readyCount: 0,
    reviewCount: 0,
    blockedCount: 7,
    totalCount: 7,
    nextAction: "run-stage1-bootstrap-preflight",
    recommendedCommand: "npm run stage1:preflight",
    blockerIds: [
      "package-scripts",
      "p0-acceptance",
      "p1-acceptance",
      "p2-manifest-chain",
      "desktop-release",
      "stage1-daily-use",
      "live-blocked-boundary"
    ],
    reviewIds: [],
    paperOnly: true,
    liveTradingAllowed: false,
    liveBlockedBoundary: true,
    sourcePath: "data/stage1-bootstrap-preflight.json",
    sourcePaths: {
      p0Acceptance: "data/p0-acceptance.json",
      p1Acceptance: "data/p1-acceptance.json",
      p2ManifestChainPreflight: "data/p2-chain-preflight.json",
      desktopRelease: "data/desktop-release.json",
      stage1DailyUse: "data/stage1-daily-use.json"
    },
    checks: [
      check(
        "package-scripts",
        "Package scripts",
        "package.json",
        "node tools/run_python.mjs tools/stage1_prepare.py --mode full --dry-run"
      ),
      check("p0-acceptance", "P0 acceptance", "data/p0-acceptance.json", "npm run docker:smoke:p0 -- --no-build --down"),
      check("p1-acceptance", "P1 acceptance", "data/p1-acceptance.json", "npm run docker:smoke:p1 -- --no-build --down"),
      check("p2-manifest-chain", "P2 manifest chain", "data/p2-chain-preflight.json", "npm run docker:smoke:p2:preflight"),
      check("desktop-release", "Desktop release", "data/desktop-release.json", "npm run desktop:release"),
      check("stage1-daily-use", "Stage 1 daily use", "data/stage1-daily-use.json", "npm run stage1:daily"),
      check("live-blocked-boundary", "Live-blocked boundary", "data", "npm run stage1:preflight:validate")
    ]
  };
}

export async function loadP2PreLiveAcceptanceLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P2PreLiveAcceptanceLatestResult> {
  try {
    const response = await fetcher(buildP2PreLiveAcceptanceLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isP2PreLiveAcceptanceLatestPayload(payload)) {
      throw new Error("Invalid P2 pre-live acceptance status contract");
    }
    return {
      acceptance: payload.acceptance,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown P2 pre-live acceptance readback error";
    return {
      acceptance: buildMissingP2PreLiveAcceptanceStatus(message),
      source: "fallback",
      error: message
    };
  }
}

function buildMissingP2PreLiveAcceptanceStatus(reason: string): P2PreLiveAcceptanceStatus {
  return {
    kind: "aiqt.p2PreLiveAcceptanceStatus",
    schemaVersion: 1,
    status: "missing",
    available: false,
    sourcePath: "data/p2-pre-live-acceptance.json",
    summary: "P2 pre-live acceptance manifest is missing.",
    reason,
    generatedAt: null,
    runId: null,
    market: null,
    symbol: null,
    timeframe: null,
    adapterId: null,
    promotionStatus: null,
    checklistStatus: null,
    passedGateCount: 0,
    totalGateCount: 0,
    blockingGateCount: 0,
    gateIds: [],
    blockerIds: [],
    auditEventIds: [],
    checkCount: 0,
    requiredCheckCount: 6,
    checkIds: [],
    manualRouteCandidate: false,
    paperOnly: false,
    orderSubmissionEnabled: false,
    liveTradingAllowed: false,
    liveOrderSubmitted: false,
    routeExecuted: false,
    liveBlockedBoundary: false,
    manifest: null
  };
}

export async function loadP2PaperReplayLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P2PaperReplayLatestResult> {
  try {
    const response = await fetcher(buildP2PaperReplayLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isP2PaperReplayLatestPayload(payload)) {
      throw new Error("Invalid P2 paper replay status contract");
    }
    return {
      replay: payload.replay,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown P2 paper replay readback error";
    return {
      replay: buildMissingP2PaperReplayStatus(message),
      source: "fallback",
      error: message
    };
  }
}

function buildMissingP2PaperReplayStatus(reason: string): P2PaperReplayStatus {
  return {
    kind: "aiqt.p2PaperReplayStatus",
    schemaVersion: 1,
    status: "missing",
    available: false,
    sourcePath: "data/p2-paper-replay.json",
    summary: "P2 paper replay manifest is missing.",
    reason,
    generatedAt: null,
    runId: null,
    market: null,
    symbol: null,
    timeframe: null,
    adapterId: null,
    replayStatus: null,
    passedCheckCount: 0,
    totalCheckCount: 0,
    warningCount: 0,
    requiredCheckCount: 8,
    checkCount: 0,
    checkIds: [],
    auditEventIds: [],
    latestEvidenceId: null,
    metrics: {
      filledPaperOrders: 0,
      portfolioOrders: 0,
      approvedPortfolioOrders: 0,
      portfolioFilledOrders: 0,
      stateHistoryFilledEvents: 0,
      adapterPaperExecutions: 0,
      replayWarnings: 0
    },
    paperOnly: false,
    orderSubmissionEnabled: false,
    liveTradingAllowed: false,
    liveOrderSubmitted: false,
    routeExecuted: false,
    liveBlockedBoundary: false,
    manifest: null
  };
}

export async function loadP2ReadinessAcceptanceLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P2ReadinessAcceptanceLatestResult> {
  try {
    const response = await fetcher(buildP2ReadinessAcceptanceLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isP2ReadinessAcceptanceLatestPayload(payload)) {
      throw new Error("Invalid P2 readiness acceptance status contract");
    }
    return {
      acceptance: payload.acceptance,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown P2 readiness acceptance readback error";
    return {
      acceptance: buildMissingP2ReadinessAcceptanceStatus(message),
      source: "fallback",
      error: message
    };
  }
}

export async function generateP2ReadinessAcceptance(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P2ReadinessAcceptanceGenerateResult> {
  try {
    const response = await fetcher(buildP2ReadinessAcceptanceUrl(baseUrl), {
      method: "POST"
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isP2ReadinessAcceptanceGeneratePayload(payload)) {
      throw new Error("Invalid P2 readiness acceptance generation contract");
    }
    return {
      acceptance: payload.acceptance,
      auditEvent: payload.auditEvent,
      status: payload.status,
      source: "core",
      paperOnly: payload.paperOnly,
      orderSubmissionEnabled: payload.orderSubmissionEnabled,
      liveTradingAllowed: payload.liveTradingAllowed,
      liveOrderSubmitted: payload.liveOrderSubmitted,
      routeExecuted: payload.routeExecuted
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown P2 readiness acceptance generation error";
    return {
      acceptance: buildMissingP2ReadinessAcceptanceStatus(message),
      status: "acceptance_failed",
      source: "fallback",
      paperOnly: true,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      error: message
    };
  }
}

function buildMissingP2ReadinessAcceptanceStatus(reason: string): P2ReadinessAcceptanceReadbackStatus {
  return {
    kind: "aiqt.p2ReadinessAcceptanceStatus",
    schemaVersion: 1,
    status: "missing",
    available: false,
    sourcePath: "data/p2-readiness-acceptance.json",
    summary: "P2 readiness acceptance manifest is missing.",
    reason,
    generatedAt: null,
    runId: null,
    market: null,
    symbol: null,
    timeframe: null,
    adapterId: null,
    p1AcceptanceRunId: null,
    p2PreLiveAcceptanceRunId: null,
    p2PaperReplayRunId: null,
    operatorRunbookAuditEventId: null,
    readinessCoverageStatus: null,
    acceptedCriterionCount: 0,
    totalCriterionCount: 0,
    blockingCriterionCount: 0,
    criterionIds: [],
    auditEventIds: [],
    manifestPaths: {
      p1Acceptance: null,
      p2PreLiveAcceptance: null,
      p2PaperReplay: null
    },
    checkCount: 0,
    requiredCheckCount: 6,
    checkIds: [],
    paperOnly: false,
    orderSubmissionEnabled: false,
    liveTradingAllowed: false,
    liveOrderSubmitted: false,
    routeExecuted: false,
    liveBlockedBoundary: false,
    manifest: null
  };
}

export async function loadP2ManifestChainPreflightLatest(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P2ManifestChainPreflightLatestResult> {
  try {
    const response = await fetcher(buildP2ManifestChainPreflightLatestUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isP2ManifestChainPreflightLatestPayload(payload)) {
      throw new Error("Invalid P2 manifest chain preflight status contract");
    }
    return {
      preflight: payload.preflight,
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown P2 manifest chain preflight readback error";
    return {
      preflight: buildMissingP2ManifestChainPreflightStatus(message),
      source: "fallback",
      error: message
    };
  }
}

export async function generateP2ManifestChainPreflight(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P2ManifestChainPreflightGenerateResult> {
  try {
    const response = await fetcher(buildP2ManifestChainPreflightUrl(baseUrl), {
      method: "POST"
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
    }
    if (!isP2ManifestChainPreflightGeneratePayload(payload)) {
      throw new Error("Invalid P2 manifest chain preflight generation contract");
    }
    return {
      preflight: payload.preflight,
      auditEvent: payload.auditEvent,
      status: "preflight_generated",
      source: "core"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown P2 manifest chain preflight generation error";
    return {
      preflight: buildMissingP2ManifestChainPreflightStatus(message),
      status: "preflight_failed",
      source: "fallback",
      error: message
    };
  }
}

function buildMissingP2ManifestChainPreflightStatus(reason: string): P2ManifestChainPreflightStatus {
  return {
    kind: "aiqt.p2ManifestChainPreflightStatus",
    schemaVersion: 1,
    status: "missing",
    available: false,
    sourcePath: "data/p2-chain-preflight.json",
    summary: "P2 manifest chain preflight is missing.",
    reason,
    ready: false,
    validStageCount: 0,
    totalStageCount: 4,
    blockerIds: [],
    nextAction: "run-p1-acceptance",
    nextCommand: "npm run docker:smoke:p1 -- --no-build",
    stages: [],
    paperOnly: false,
    orderSubmissionEnabled: false,
    liveTradingAllowed: false,
    liveOrderSubmitted: false,
    routeExecuted: false,
    liveBlockedBoundary: false,
    manifest: null
  };
}

function isP0AcceptanceLatestPayload(value: unknown): value is { acceptance: P0AcceptanceStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { acceptance?: unknown };
  return isP0AcceptanceStatusPayload(payload.acceptance);
}

function isP0AcceptanceStatusPayload(value: unknown): value is P0AcceptanceStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P0AcceptanceStatus>;
  const validStatus = payload.status === "passed" || payload.status === "missing" || payload.status === "invalid";
  const validMarket = payload.market === null || isMarket(payload.market);
  const validTimeframe = payload.timeframe === null || isTimeframe(payload.timeframe);
  return (
    payload.kind === "aiqt.p0AcceptanceStatus" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    typeof payload.available === "boolean" &&
    typeof payload.sourcePath === "string" &&
    typeof payload.summary === "string" &&
    typeof payload.reason === "string" &&
    (payload.generatedAt === null || typeof payload.generatedAt === "string") &&
    (payload.runId === null || typeof payload.runId === "string") &&
    validMarket &&
    (payload.symbol === null || typeof payload.symbol === "string") &&
    validTimeframe &&
    typeof payload.checkCount === "number" &&
    typeof payload.requiredCheckCount === "number" &&
    Array.isArray(payload.checkIds) &&
    payload.checkIds.every((id) => typeof id === "string") &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.manifest === null || isP0AcceptanceManifestPayload(payload.manifest))
  );
}

function isP0AcceptanceManifestPayload(value: unknown): value is P0AcceptanceManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P0AcceptanceManifest>;
  return (
    typeof payload.kind === "string" &&
    typeof payload.schemaVersion === "number" &&
    typeof payload.generatedAt === "string" &&
    typeof payload.status === "string" &&
    typeof payload.baseUrl === "string" &&
    (payload.importBaseUrl === undefined || payload.importBaseUrl === null || typeof payload.importBaseUrl === "string") &&
    isMarket(payload.market) &&
    typeof payload.symbol === "string" &&
    isTimeframe(payload.timeframe) &&
    typeof payload.runId === "string" &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    typeof payload.checkCount === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isP0AcceptanceManifestCheckPayload)
  );
}

function isP0AcceptanceManifestCheckPayload(value: unknown): value is P0AcceptanceManifestCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<P0AcceptanceManifestCheck>;
  return typeof check.id === "string" && typeof check.status === "string" && typeof check.summary === "string";
}

function isP1AcceptanceLatestPayload(value: unknown): value is { acceptance: P1AcceptanceStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { acceptance?: unknown };
  return isP1AcceptanceStatusPayload(payload.acceptance);
}

function isP1AcceptanceStatusPayload(value: unknown): value is P1AcceptanceStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P1AcceptanceStatus>;
  const validStatus = payload.status === "passed" || payload.status === "missing" || payload.status === "invalid";
  const validQueuedMarket = payload.queuedMarket === null || isMarket(payload.queuedMarket);
  const validTimeframe = payload.timeframe === null || isTimeframe(payload.timeframe);
  return (
    payload.kind === "aiqt.p1AcceptanceStatus" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    typeof payload.available === "boolean" &&
    typeof payload.sourcePath === "string" &&
    typeof payload.summary === "string" &&
    typeof payload.reason === "string" &&
    (payload.generatedAt === null || typeof payload.generatedAt === "string") &&
    (payload.runId === null || typeof payload.runId === "string") &&
    validTimeframe &&
    (payload.watchlistRefreshRunId === null || typeof payload.watchlistRefreshRunId === "string") &&
    validQueuedMarket &&
    (payload.queuedSymbol === null || typeof payload.queuedSymbol === "string") &&
    typeof payload.watchlistCount === "number" &&
    typeof payload.checkCount === "number" &&
    typeof payload.requiredCheckCount === "number" &&
    Array.isArray(payload.checkIds) &&
    payload.checkIds.every((id) => typeof id === "string") &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.manifest === null || isP1AcceptanceManifestPayload(payload.manifest))
  );
}

function isP1AcceptanceManifestPayload(value: unknown): value is P1AcceptanceManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P1AcceptanceManifest>;
  return (
    typeof payload.kind === "string" &&
    typeof payload.schemaVersion === "number" &&
    typeof payload.generatedAt === "string" &&
    typeof payload.status === "string" &&
    typeof payload.baseUrl === "string" &&
    (payload.importBaseUrl === undefined || payload.importBaseUrl === null || typeof payload.importBaseUrl === "string") &&
    isTimeframe(payload.timeframe) &&
    typeof payload.runId === "string" &&
    typeof payload.watchlistRefreshRunId === "string" &&
    isMarket(payload.queuedMarket) &&
    typeof payload.queuedSymbol === "string" &&
    typeof payload.watchlistCount === "number" &&
    Array.isArray(payload.watchlist) &&
    payload.watchlist.every(isP1AcceptanceManifestWatchlistItemPayload) &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    typeof payload.checkCount === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isP1AcceptanceManifestCheckPayload)
  );
}

function isP1AcceptanceManifestWatchlistItemPayload(value: unknown): value is P1AcceptanceManifestWatchlistItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Partial<P1AcceptanceManifestWatchlistItem>;
  return typeof item.market === "string" && typeof item.symbol === "string" && typeof item.name === "string";
}

function isP1AcceptanceManifestCheckPayload(value: unknown): value is P1AcceptanceManifestCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<P1AcceptanceManifestCheck>;
  return typeof check.id === "string" && typeof check.status === "string" && typeof check.summary === "string";
}

function isDesktopReleaseLatestPayload(value: unknown): value is { release: DesktopReleaseStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { release?: unknown };
  return isDesktopReleaseStatusPayload(payload.release);
}

function isDesktopReleaseStatusPayload(value: unknown): value is DesktopReleaseStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<DesktopReleaseStatus>;
  const validStatus = payload.status === "passed" || payload.status === "missing" || payload.status === "invalid";
  return (
    payload.kind === "aiqt.desktopReleaseStatus" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    typeof payload.available === "boolean" &&
    typeof payload.sourcePath === "string" &&
    typeof payload.summary === "string" &&
    typeof payload.reason === "string" &&
    (payload.generatedAt === null || typeof payload.generatedAt === "string") &&
    (payload.platform === null || typeof payload.platform === "string") &&
    (payload.version === null || typeof payload.version === "string") &&
    (payload.tauriConfigPath === null || typeof payload.tauriConfigPath === "string") &&
    (payload.desktopArtifactPath === null || typeof payload.desktopArtifactPath === "string") &&
    typeof payload.checkCount === "number" &&
    typeof payload.requiredCheckCount === "number" &&
    Array.isArray(payload.checkIds) &&
    payload.checkIds.every((id) => typeof id === "string") &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.manifest === null || isDesktopReleaseManifestPayload(payload.manifest))
  );
}

function isDesktopReleaseManifestPayload(value: unknown): value is DesktopReleaseManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<DesktopReleaseManifest>;
  return (
    typeof payload.kind === "string" &&
    typeof payload.schemaVersion === "number" &&
    typeof payload.generatedAt === "string" &&
    typeof payload.status === "string" &&
    typeof payload.platform === "string" &&
    typeof payload.version === "string" &&
    typeof payload.tauriConfigPath === "string" &&
    typeof payload.desktopArtifactPath === "string" &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    typeof payload.checkCount === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isDesktopReleaseManifestCheckPayload)
  );
}

function isStage1DailyUseLatestPayload(value: unknown): value is { dailyUse: Stage1DailyUseReport } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { dailyUse?: unknown };
  return isStage1DailyUseReportPayload(payload.dailyUse);
}

function isStage1DailyUseGeneratePayload(value: unknown): value is {
  dailyUse: Stage1DailyUseReport;
  status: "daily_use_generated";
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    dailyUse?: unknown;
    status?: unknown;
    paperOnly?: unknown;
    orderSubmissionEnabled?: unknown;
    liveTradingAllowed?: unknown;
    liveOrderSubmitted?: unknown;
    routeExecuted?: unknown;
  };
  return (
    payload.status === "daily_use_generated" &&
    isStage1DailyUseReportPayload(payload.dailyUse) &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean"
  );
}

function isStage1DailyUseReportPayload(value: unknown): value is Stage1DailyUseReport {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<Stage1DailyUseReport>;
  const validStatus =
    payload.status === "ready" ||
    payload.status === "review" ||
    payload.status === "blocked" ||
    payload.status === "missing" ||
    payload.status === "invalid";
  return (
    payload.kind === "aiqt.stage1DailyUseReport" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    (payload.generatedAt === null || typeof payload.generatedAt === "string") &&
    typeof payload.summary === "string" &&
    (payload.reason === undefined || typeof payload.reason === "string") &&
    typeof payload.readyCount === "number" &&
    typeof payload.totalCount === "number" &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.sourcePath === undefined || typeof payload.sourcePath === "string") &&
    (payload.staleSourcePaths === undefined ||
      (Array.isArray(payload.staleSourcePaths) && payload.staleSourcePaths.every((sourcePath) => typeof sourcePath === "string"))) &&
    isStage1DailyUseSourcePathsPayload(payload.sourcePaths) &&
    Array.isArray(payload.rows) &&
    payload.rows.every(isStage1DailyUseReportRowPayload)
  );
}

function isStage1DailyUseSourcePathsPayload(value: unknown): value is Stage1DailyUseReportSourcePaths {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<Stage1DailyUseReportSourcePaths>;
  return (
    typeof payload.p0Acceptance === "string" &&
    typeof payload.p1Acceptance === "string" &&
    typeof payload.desktopRelease === "string"
  );
}

function isStage1DailyUseReportRowPayload(value: unknown): value is Stage1DailyUseReportRow {
  if (!value || typeof value !== "object") {
    return false;
  }
  const row = value as Partial<Stage1DailyUseReportRow>;
  const validStatus = row.status === "ready" || row.status === "review" || row.status === "blocked";
  return (
    typeof row.id === "string" &&
    typeof row.label === "string" &&
    validStatus &&
    typeof row.value === "string" &&
    typeof row.summary === "string" &&
    typeof row.action === "string" &&
    typeof row.paperOnly === "boolean" &&
    typeof row.liveTradingAllowed === "boolean" &&
    typeof row.liveBlockedBoundary === "boolean"
  );
}

function isStage1BootstrapPreflightLatestPayload(value: unknown): value is { preflight: Stage1BootstrapPreflight } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { preflight?: unknown };
  return isStage1BootstrapPreflightPayload(payload.preflight);
}

function isStage1BootstrapPreflightGeneratePayload(value: unknown): value is {
  preflight: Stage1BootstrapPreflight;
  status: "preflight_generated";
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    preflight?: unknown;
    status?: unknown;
    paperOnly?: unknown;
    orderSubmissionEnabled?: unknown;
    liveTradingAllowed?: unknown;
    liveOrderSubmitted?: unknown;
    routeExecuted?: unknown;
  };
  return (
    payload.status === "preflight_generated" &&
    isStage1BootstrapPreflightPayload(payload.preflight) &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean"
  );
}

function isStage1BootstrapPreflightPayload(value: unknown): value is Stage1BootstrapPreflight {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<Stage1BootstrapPreflight>;
  const validStatus =
    payload.status === "ready" ||
    payload.status === "review" ||
    payload.status === "blocked" ||
    payload.status === "missing" ||
    payload.status === "invalid";
  return (
    payload.kind === "aiqt.stage1BootstrapPreflight" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    (payload.generatedAt === null || typeof payload.generatedAt === "string") &&
    typeof payload.summary === "string" &&
    (payload.reason === undefined || typeof payload.reason === "string") &&
    typeof payload.ready === "boolean" &&
    typeof payload.readyCount === "number" &&
    typeof payload.reviewCount === "number" &&
    typeof payload.blockedCount === "number" &&
    typeof payload.totalCount === "number" &&
    typeof payload.nextAction === "string" &&
    typeof payload.recommendedCommand === "string" &&
    Array.isArray(payload.blockerIds) &&
    payload.blockerIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.reviewIds) &&
    payload.reviewIds.every((id) => typeof id === "string") &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.sourcePath === undefined || typeof payload.sourcePath === "string") &&
    (payload.staleSourcePaths === undefined ||
      (Array.isArray(payload.staleSourcePaths) && payload.staleSourcePaths.every((sourcePath) => typeof sourcePath === "string"))) &&
    isStage1BootstrapPreflightSourcePathsPayload(payload.sourcePaths) &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isStage1BootstrapPreflightCheckPayload)
  );
}

function isStage1BootstrapPreflightSourcePathsPayload(value: unknown): value is Stage1BootstrapPreflightSourcePaths {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<Stage1BootstrapPreflightSourcePaths>;
  return (
    typeof payload.p0Acceptance === "string" &&
    typeof payload.p1Acceptance === "string" &&
    typeof payload.p2ManifestChainPreflight === "string" &&
    typeof payload.desktopRelease === "string" &&
    typeof payload.stage1DailyUse === "string"
  );
}

function isStage1BootstrapPreflightCheckPayload(value: unknown): value is Stage1BootstrapPreflightCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<Stage1BootstrapPreflightCheck>;
  const validStatus = check.status === "ready" || check.status === "review" || check.status === "blocked";
  return (
    typeof check.id === "string" &&
    typeof check.label === "string" &&
    validStatus &&
    typeof check.summary === "string" &&
    typeof check.recommendedCommand === "string" &&
    typeof check.sourcePath === "string" &&
    typeof check.paperOnly === "boolean" &&
    typeof check.liveTradingAllowed === "boolean" &&
    typeof check.liveBlockedBoundary === "boolean"
  );
}

function isDesktopReleaseManifestCheckPayload(value: unknown): value is DesktopReleaseManifestCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<DesktopReleaseManifestCheck>;
  return typeof check.id === "string" && typeof check.status === "string" && typeof check.summary === "string";
}

function isP2PreLiveAcceptanceLatestPayload(value: unknown): value is { acceptance: P2PreLiveAcceptanceStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { acceptance?: unknown };
  return isP2PreLiveAcceptanceStatusPayload(payload.acceptance);
}

function isP2PreLiveAcceptanceStatusPayload(value: unknown): value is P2PreLiveAcceptanceStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2PreLiveAcceptanceStatus>;
  const validStatus = payload.status === "passed" || payload.status === "missing" || payload.status === "invalid";
  const validMarket = payload.market === null || isMarket(payload.market);
  const validTimeframe = payload.timeframe === null || isTimeframe(payload.timeframe);
  return (
    payload.kind === "aiqt.p2PreLiveAcceptanceStatus" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    typeof payload.available === "boolean" &&
    typeof payload.sourcePath === "string" &&
    typeof payload.summary === "string" &&
    typeof payload.reason === "string" &&
    (payload.generatedAt === null || typeof payload.generatedAt === "string") &&
    (payload.runId === null || typeof payload.runId === "string") &&
    validMarket &&
    (payload.symbol === null || typeof payload.symbol === "string") &&
    validTimeframe &&
    (payload.adapterId === null || typeof payload.adapterId === "string") &&
    (payload.promotionStatus === null || typeof payload.promotionStatus === "string") &&
    (payload.checklistStatus === null || typeof payload.checklistStatus === "string") &&
    typeof payload.passedGateCount === "number" &&
    typeof payload.totalGateCount === "number" &&
    typeof payload.blockingGateCount === "number" &&
    Array.isArray(payload.gateIds) &&
    payload.gateIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.blockerIds) &&
    payload.blockerIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.auditEventIds) &&
    payload.auditEventIds.every((id) => typeof id === "string") &&
    typeof payload.checkCount === "number" &&
    typeof payload.requiredCheckCount === "number" &&
    Array.isArray(payload.checkIds) &&
    payload.checkIds.every((id) => typeof id === "string") &&
    typeof payload.manualRouteCandidate === "boolean" &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.manifest === null || isP2PreLiveAcceptanceManifestPayload(payload.manifest))
  );
}

function isP2PreLiveAcceptanceManifestPayload(value: unknown): value is P2PreLiveAcceptanceManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2PreLiveAcceptanceManifest>;
  return (
    typeof payload.kind === "string" &&
    typeof payload.schemaVersion === "number" &&
    typeof payload.generatedAt === "string" &&
    typeof payload.status === "string" &&
    typeof payload.baseUrl === "string" &&
    isMarket(payload.market) &&
    typeof payload.symbol === "string" &&
    isTimeframe(payload.timeframe) &&
    typeof payload.runId === "string" &&
    typeof payload.adapterId === "string" &&
    typeof payload.promotionStatus === "string" &&
    typeof payload.checklistStatus === "string" &&
    typeof payload.passedGateCount === "number" &&
    typeof payload.totalGateCount === "number" &&
    typeof payload.blockingGateCount === "number" &&
    Array.isArray(payload.gateIds) &&
    payload.gateIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.blockerIds) &&
    payload.blockerIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.auditEventIds) &&
    payload.auditEventIds.every((id) => typeof id === "string") &&
    typeof payload.manualRouteCandidate === "boolean" &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    typeof payload.checkCount === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isP2PreLiveAcceptanceManifestCheckPayload)
  );
}

function isP2PreLiveAcceptanceManifestCheckPayload(
  value: unknown
): value is P2PreLiveAcceptanceManifestCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<P2PreLiveAcceptanceManifestCheck>;
  return typeof check.id === "string" && typeof check.status === "string" && typeof check.summary === "string";
}

function isP2PaperReplayLatestPayload(value: unknown): value is { replay: P2PaperReplayStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { replay?: unknown };
  return isP2PaperReplayStatusPayload(payload.replay);
}

function isP2PaperReplayStatusPayload(value: unknown): value is P2PaperReplayStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2PaperReplayStatus>;
  const validStatus = payload.status === "passed" || payload.status === "missing" || payload.status === "invalid";
  const validMarket = payload.market === null || isMarket(payload.market);
  const validTimeframe = payload.timeframe === null || isTimeframe(payload.timeframe);
  return (
    payload.kind === "aiqt.p2PaperReplayStatus" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    typeof payload.available === "boolean" &&
    typeof payload.sourcePath === "string" &&
    typeof payload.summary === "string" &&
    typeof payload.reason === "string" &&
    (payload.generatedAt === null || typeof payload.generatedAt === "string") &&
    (payload.runId === null || typeof payload.runId === "string") &&
    validMarket &&
    (payload.symbol === null || typeof payload.symbol === "string") &&
    validTimeframe &&
    (payload.adapterId === null || typeof payload.adapterId === "string") &&
    (payload.replayStatus === null || typeof payload.replayStatus === "string") &&
    typeof payload.passedCheckCount === "number" &&
    typeof payload.totalCheckCount === "number" &&
    typeof payload.warningCount === "number" &&
    typeof payload.requiredCheckCount === "number" &&
    typeof payload.checkCount === "number" &&
    Array.isArray(payload.checkIds) &&
    payload.checkIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.auditEventIds) &&
    payload.auditEventIds.every((id) => typeof id === "string") &&
    (payload.latestEvidenceId === null || typeof payload.latestEvidenceId === "string") &&
    isP2PaperReplayMetricsPayload(payload.metrics) &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.manifest === null || isP2PaperReplayManifestPayload(payload.manifest))
  );
}

function isP2PaperReplayManifestPayload(value: unknown): value is P2PaperReplayManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2PaperReplayManifest>;
  return (
    typeof payload.kind === "string" &&
    typeof payload.schemaVersion === "number" &&
    typeof payload.generatedAt === "string" &&
    typeof payload.status === "string" &&
    typeof payload.baseUrl === "string" &&
    isMarket(payload.market) &&
    typeof payload.symbol === "string" &&
    isTimeframe(payload.timeframe) &&
    typeof payload.runId === "string" &&
    typeof payload.adapterId === "string" &&
    typeof payload.replayStatus === "string" &&
    typeof payload.passedCheckCount === "number" &&
    typeof payload.totalCheckCount === "number" &&
    typeof payload.warningCount === "number" &&
    Array.isArray(payload.checkIds) &&
    payload.checkIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.auditEventIds) &&
    payload.auditEventIds.every((id) => typeof id === "string") &&
    typeof payload.latestEvidenceId === "string" &&
    isP2PaperReplayMetricsPayload(payload.metrics) &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    typeof payload.checkCount === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isP2PaperReplayManifestCheckPayload)
  );
}

function isP2PaperReplayManifestCheckPayload(value: unknown): value is P2PaperReplayManifestCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<P2PaperReplayManifestCheck>;
  return (
    typeof check.id === "string" &&
    typeof check.status === "string" &&
    typeof check.summary === "string" &&
    typeof check.evidenceId === "string"
  );
}

function isP2PaperReplayMetricsPayload(value: unknown): value is P2PaperReplayMetrics {
  if (!value || typeof value !== "object") {
    return false;
  }
  const metrics = value as Partial<P2PaperReplayMetrics>;
  return (
    typeof metrics.filledPaperOrders === "number" &&
    typeof metrics.portfolioOrders === "number" &&
    typeof metrics.approvedPortfolioOrders === "number" &&
    typeof metrics.portfolioFilledOrders === "number" &&
    typeof metrics.stateHistoryFilledEvents === "number" &&
    typeof metrics.adapterPaperExecutions === "number" &&
    typeof metrics.replayWarnings === "number"
  );
}

function isP2ReadinessAcceptanceLatestPayload(
  value: unknown
): value is { acceptance: P2ReadinessAcceptanceReadbackStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { acceptance?: unknown };
  return isP2ReadinessAcceptanceStatusPayload(payload.acceptance);
}

function isP2ReadinessAcceptanceGeneratePayload(value: unknown): value is {
  status: "acceptance_generated";
  acceptance: P2ReadinessAcceptanceReadbackStatus;
  auditEvent: AuditEventRecord;
  paperOnly: boolean;
  orderSubmissionEnabled: boolean;
  liveTradingAllowed: boolean;
  liveOrderSubmitted: boolean;
  routeExecuted: boolean;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2ReadinessAcceptanceGenerateResult>;
  return (
    payload.status === "acceptance_generated" &&
    isP2ReadinessAcceptanceStatusPayload(payload.acceptance) &&
    isAuditEventRecord(payload.auditEvent) &&
    payload.paperOnly === true &&
    payload.orderSubmissionEnabled === false &&
    payload.liveTradingAllowed === false &&
    payload.liveOrderSubmitted === false &&
    payload.routeExecuted === false
  );
}

function isP2ReadinessAcceptanceStatusPayload(value: unknown): value is P2ReadinessAcceptanceReadbackStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2ReadinessAcceptanceReadbackStatus>;
  const validStatus = payload.status === "accepted" || payload.status === "missing" || payload.status === "invalid";
  const validMarket = payload.market === null || isMarket(payload.market);
  const validTimeframe = payload.timeframe === null || isTimeframe(payload.timeframe);
  return (
    payload.kind === "aiqt.p2ReadinessAcceptanceStatus" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    typeof payload.available === "boolean" &&
    typeof payload.sourcePath === "string" &&
    typeof payload.summary === "string" &&
    typeof payload.reason === "string" &&
    (payload.generatedAt === null || typeof payload.generatedAt === "string") &&
    (payload.runId === null || typeof payload.runId === "string") &&
    validMarket &&
    (payload.symbol === null || typeof payload.symbol === "string") &&
    validTimeframe &&
    (payload.adapterId === null || typeof payload.adapterId === "string") &&
    (payload.p1AcceptanceRunId === null || typeof payload.p1AcceptanceRunId === "string") &&
    (payload.p2PreLiveAcceptanceRunId === null || typeof payload.p2PreLiveAcceptanceRunId === "string") &&
    (payload.p2PaperReplayRunId === null || typeof payload.p2PaperReplayRunId === "string") &&
    (payload.operatorRunbookAuditEventId === null ||
      typeof payload.operatorRunbookAuditEventId === "string") &&
    (payload.readinessCoverageStatus === null || typeof payload.readinessCoverageStatus === "string") &&
    typeof payload.acceptedCriterionCount === "number" &&
    typeof payload.totalCriterionCount === "number" &&
    typeof payload.blockingCriterionCount === "number" &&
    Array.isArray(payload.criterionIds) &&
    payload.criterionIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.auditEventIds) &&
    payload.auditEventIds.every((id) => typeof id === "string") &&
    isP2ReadinessAcceptanceManifestPathsPayload(payload.manifestPaths) &&
    typeof payload.checkCount === "number" &&
    typeof payload.requiredCheckCount === "number" &&
    Array.isArray(payload.checkIds) &&
    payload.checkIds.every((id) => typeof id === "string") &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.manifest === null || isP2ReadinessAcceptanceManifestPayload(payload.manifest))
  );
}

function isP2ReadinessAcceptanceManifestPayload(value: unknown): value is P2ReadinessAcceptanceManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2ReadinessAcceptanceManifest>;
  return (
    typeof payload.kind === "string" &&
    typeof payload.schemaVersion === "number" &&
    typeof payload.generatedAt === "string" &&
    typeof payload.status === "string" &&
    typeof payload.baseUrl === "string" &&
    isMarket(payload.market) &&
    typeof payload.symbol === "string" &&
    isTimeframe(payload.timeframe) &&
    typeof payload.runId === "string" &&
    typeof payload.adapterId === "string" &&
    typeof payload.p1AcceptanceRunId === "string" &&
    typeof payload.p2PreLiveAcceptanceRunId === "string" &&
    typeof payload.p2PaperReplayRunId === "string" &&
    typeof payload.operatorRunbookAuditEventId === "string" &&
    typeof payload.readinessCoverageStatus === "string" &&
    typeof payload.acceptedCriterionCount === "number" &&
    typeof payload.totalCriterionCount === "number" &&
    typeof payload.blockingCriterionCount === "number" &&
    Array.isArray(payload.criterionIds) &&
    payload.criterionIds.every((id) => typeof id === "string") &&
    Array.isArray(payload.auditEventIds) &&
    payload.auditEventIds.every((id) => typeof id === "string") &&
    isP2ReadinessAcceptanceManifestPathsPayload(payload.manifestPaths) &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    typeof payload.checkCount === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isP2ReadinessAcceptanceManifestCheckPayload)
  );
}

function isP2ReadinessAcceptanceManifestPathsPayload(
  value: unknown
): value is P2ReadinessAcceptanceManifestPaths {
  if (!value || typeof value !== "object") {
    return false;
  }
  const paths = value as Partial<P2ReadinessAcceptanceManifestPaths>;
  return (
    (paths.p1Acceptance === null || typeof paths.p1Acceptance === "string") &&
    (paths.p2PreLiveAcceptance === null || typeof paths.p2PreLiveAcceptance === "string") &&
    (paths.p2PaperReplay === null || typeof paths.p2PaperReplay === "string")
  );
}

function isP2ReadinessAcceptanceManifestCheckPayload(
  value: unknown
): value is P2ReadinessAcceptanceManifestCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<P2ReadinessAcceptanceManifestCheck>;
  return (
    typeof check.id === "string" &&
    typeof check.status === "string" &&
    typeof check.summary === "string" &&
    typeof check.evidenceId === "string"
  );
}

function isP2ManifestChainPreflightLatestPayload(
  value: unknown
): value is { preflight: P2ManifestChainPreflightStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { preflight?: unknown };
  return isP2ManifestChainPreflightStatusPayload(payload.preflight);
}

function isP2ManifestChainPreflightGeneratePayload(
  value: unknown
): value is {
  status: "preflight_generated";
  preflight: P2ManifestChainPreflightStatus;
  auditEvent: AuditEventRecord;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { status?: unknown; preflight?: unknown; auditEvent?: unknown };
  return (
    payload.status === "preflight_generated" &&
    isP2ManifestChainPreflightStatusPayload(payload.preflight) &&
    isAuditEventRecord(payload.auditEvent)
  );
}

function isP2ManifestChainPreflightStatusPayload(value: unknown): value is P2ManifestChainPreflightStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2ManifestChainPreflightStatus>;
  const validStatus =
    payload.status === "ready" ||
    payload.status === "blocked" ||
    payload.status === "missing" ||
    payload.status === "invalid";
  return (
    payload.kind === "aiqt.p2ManifestChainPreflightStatus" &&
    payload.schemaVersion === 1 &&
    validStatus &&
    typeof payload.available === "boolean" &&
    typeof payload.sourcePath === "string" &&
    typeof payload.summary === "string" &&
    typeof payload.reason === "string" &&
    typeof payload.ready === "boolean" &&
    typeof payload.validStageCount === "number" &&
    typeof payload.totalStageCount === "number" &&
    Array.isArray(payload.blockerIds) &&
    payload.blockerIds.every((id) => typeof id === "string") &&
    typeof payload.nextAction === "string" &&
    typeof payload.nextCommand === "string" &&
    Array.isArray(payload.stages) &&
    payload.stages.every(isP2ManifestChainPreflightStagePayload) &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean" &&
    (payload.manifest === null || isP2ManifestChainPreflightManifestPayload(payload.manifest))
  );
}

function isP2ManifestChainPreflightManifestPayload(
  value: unknown
): value is P2ManifestChainPreflightManifest {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P2ManifestChainPreflightManifest>;
  const validStatus = payload.status === "ready" || payload.status === "blocked";
  return (
    typeof payload.kind === "string" &&
    typeof payload.schemaVersion === "number" &&
    validStatus &&
    typeof payload.ready === "boolean" &&
    typeof payload.validStageCount === "number" &&
    typeof payload.totalStageCount === "number" &&
    Array.isArray(payload.blockerIds) &&
    payload.blockerIds.every((id) => typeof id === "string") &&
    typeof payload.nextAction === "string" &&
    typeof payload.nextCommand === "string" &&
    Array.isArray(payload.stages) &&
    payload.stages.every(isP2ManifestChainPreflightStagePayload) &&
    typeof payload.paperOnly === "boolean" &&
    typeof payload.orderSubmissionEnabled === "boolean" &&
    typeof payload.liveTradingAllowed === "boolean" &&
    typeof payload.liveOrderSubmitted === "boolean" &&
    typeof payload.routeExecuted === "boolean" &&
    typeof payload.liveBlockedBoundary === "boolean"
  );
}

function isP2ManifestChainPreflightStagePayload(value: unknown): value is P2ManifestChainPreflightStageSource {
  if (!value || typeof value !== "object") {
    return false;
  }
  const stage = value as Partial<P2ManifestChainPreflightStageSource>;
  const validStatus = stage.status === "valid" || stage.status === "missing" || stage.status === "invalid";
  return (
    typeof stage.id === "string" &&
    typeof stage.label === "string" &&
    validStatus &&
    typeof stage.path === "string" &&
    typeof stage.summary === "string" &&
    typeof stage.reason === "string" &&
    typeof stage.nextAction === "string" &&
    typeof stage.nextCommand === "string"
  );
}
