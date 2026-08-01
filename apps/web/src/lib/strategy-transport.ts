import type {
  Market,
  StrategyExperimentCandidate,
  StrategyExperimentDetail,
  StrategyExperimentErrorCode,
  StrategyExperimentListItem,
  StrategyExperimentMetricSet,
  StrategyReadinessGate,
  StrategySnapshot,
  Timeframe
} from "./terminal-workbench";
import {
  isBacktestAssumptions,
  isMarket,
  isMarketKlineBar,
  isPlainRecord,
  isResearchRunStrategyConfig,
  isTimeframe,
  type TerminalResearchParams
} from "./terminal-api-contract";
import {
  buildApiUrl,
  defaultFetcher,
  type WorkspaceFetcher
} from "./terminal-api-http";

type WorkspaceSource = "core" | "fallback";
type ResearchTimeframe = Timeframe;

export type StrategyExperimentCreateRequest = import("./terminal-workbench").StrategyExperimentCreateRequest;

export interface StrategyExperimentHistoryParams {
  strategyRevision?: string;
  sourceRunId?: string;
  limit?: number;
}

export interface StrategyExperimentHistoryResult {
  experiments: StrategyExperimentListItem[];
  source: WorkspaceSource;
  errorCode?: StrategyExperimentErrorCode;
  error?: string;
}

export interface StrategyExperimentDetailResult {
  experiment?: StrategyExperimentDetail;
  source: WorkspaceSource;
  errorCode?: StrategyExperimentErrorCode;
  error?: string;
}

export type StrategyExperimentMutationResult = StrategyExperimentDetailResult;

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

export interface StrategyDeleteResult {
  deleted: boolean;
  revision?: string;
  source: WorkspaceSource;
  error?: string;
}

export interface StrategyProductionBinding {
  kind: "builtin" | "library";
  bindingId: string | null;
  strategyId: string;
  revision: string;
  name: string;
  auditRunId: string | null;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  status: "ready" | "blocked";
  detail: string;
  switchAllowed: boolean;
  switchBlockedReason: string | null;
  operator: string;
}

export interface StrategyProductionBindingResult {
  binding?: StrategyProductionBinding;
  source: WorkspaceSource;
  error?: string;
}

export interface ProductionStrategyHandoff {
  runId: string;
  strategyId: string;
  strategyRevision: string;
  strategyName: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  status: "active" | "ready" | "review";
  evidenceStatus: "eligible";
  switchAllowed: boolean;
  switchBlockedReason: string | null;
  alreadyBound: boolean;
  auditHash: string;
  dataSnapshotHash: string;
  productionReplay: {
    feeBps: number;
    slippageBps: number;
    auditedMaxDrawdownPct: number;
    productionMaxDrawdownPct: number;
    strategyMaxDrawdownPct: number;
  };
  boundary: {
    authorizesLive: false;
    startsMonitoring: false;
    evaluatesNow: false;
    submitsOrder: false;
  };
}

export interface ProductionStrategyHandoffResult {
  handoff?: ProductionStrategyHandoff;
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

export function buildStrategyExperimentsUrl(
  baseUrl: string,
  params: StrategyExperimentHistoryParams = {}
): string {
  return buildApiUrl(baseUrl, "api/strategy-experiments", (url) => {
    if (params.strategyRevision?.trim()) {
      url.searchParams.set("strategyRevision", params.strategyRevision.trim());
    }
    if (params.sourceRunId?.trim()) {
      url.searchParams.set("sourceRunId", params.sourceRunId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildStrategyExperimentDetailUrl(baseUrl: string, experimentId: string): string {
  return buildApiUrl(baseUrl, `api/strategy-experiments/${encodeURIComponent(experimentId)}`);
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

export async function loadStrategyProductionBinding(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategyProductionBindingResult> {
  return requestStrategyProductionBinding(
    buildApiUrl(baseUrl, "api/execution/auto-paper-trading"),
    undefined,
    fetcher
  );
}

export async function updateStrategyProductionBinding(
  baseUrl: string,
  params: {
    strategyRevision: string | null;
    auditRunId: string | null;
    operator: string;
  },
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategyProductionBindingResult> {
  return requestStrategyProductionBinding(
    buildApiUrl(baseUrl, "api/execution/auto-paper-trading"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        strategyRevision: params.strategyRevision,
        auditRunId: params.auditRunId,
        operator: params.operator,
        confirmed: true
      })
    },
    fetcher
  );
}

async function requestStrategyProductionBinding(
  url: string,
  init: RequestInit | undefined,
  fetcher: WorkspaceFetcher
): Promise<StrategyProductionBindingResult> {
  try {
    const response = await fetcher(url, init);
    const payload = await response.json();
    if (!response.ok) {
      const detail = isPlainRecord(payload) && typeof payload.detail === "string"
        ? payload.detail
        : `HTTP ${response.status ?? "error"}`;
      throw new Error(detail);
    }
    if (!isStrategyProductionBindingPayload(payload)) {
      throw new Error("Invalid production strategy binding contract");
    }
    return {
      binding: payload.strategyBinding,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown production strategy binding error"
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

export async function deleteStrategyVersion(
  baseUrl: string,
  revision: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategyDeleteResult> {
  try {
    const response = await fetcher(buildStrategyDetailUrl(baseUrl, revision), { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    if (
      !payload ||
      typeof payload !== "object" ||
      (payload as { deleted?: unknown }).deleted !== true ||
      (payload as { revision?: unknown }).revision !== revision
    ) {
      throw new Error("Invalid strategy delete contract");
    }
    return { deleted: true, revision, source: "core" };
  } catch (error) {
    return {
      deleted: false,
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy delete error"
    };
  }
}

export async function createStrategyExperiment(
  baseUrl: string,
  request: StrategyExperimentCreateRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategyExperimentMutationResult> {
  try {
    const response = await fetcher(buildStrategyExperimentsUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
    const payload = await response.json();
    if (!response.ok) {
      if (isStrategyExperimentErrorPayload(payload)) {
        return {
          source: "core",
          errorCode: payload.error,
          error: payload.detail ?? payload.error
        };
      }
      throw new Error("Invalid strategy experiment error contract");
    }
    if (!isStrategyExperimentDetailPayload(payload)) {
      throw new Error("Invalid strategy experiment mutation contract");
    }
    return { experiment: payload.experiment, source: "core" };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy experiment mutation error"
    };
  }
}

export async function loadStrategyExperiments(
  baseUrl: string,
  params: StrategyExperimentHistoryParams = {},
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategyExperimentHistoryResult> {
  try {
    const response = await fetcher(buildStrategyExperimentsUrl(baseUrl, params));
    const payload = await response.json();
    if (!response.ok) {
      if (isStrategyExperimentErrorPayload(payload)) {
        return {
          experiments: [],
          source: "core",
          errorCode: payload.error,
          error: payload.detail ?? payload.error
        };
      }
      throw new Error("Invalid strategy experiment error contract");
    }
    if (!isStrategyExperimentHistoryPayload(payload)) {
      throw new Error("Invalid strategy experiment history contract");
    }
    return { experiments: payload.experiments, source: "core" };
  } catch (error) {
    return {
      experiments: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy experiment history error"
    };
  }
}

export async function loadStrategyExperimentDetail(
  baseUrl: string,
  experimentId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategyExperimentDetailResult> {
  try {
    const response = await fetcher(buildStrategyExperimentDetailUrl(baseUrl, experimentId));
    const payload = await response.json();
    if (!response.ok) {
      if (isStrategyExperimentErrorPayload(payload)) {
        return {
          source: "core",
          errorCode: payload.error,
          error: payload.detail ?? payload.error
        };
      }
      throw new Error("Invalid strategy experiment error contract");
    }
    if (!isStrategyExperimentDetailPayload(payload)) {
      throw new Error("Invalid strategy experiment detail contract");
    }
    return { experiment: payload.experiment, source: "core" };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown strategy experiment detail error"
    };
  }
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

export function isStrategyProductionBindingPayload(
  value: unknown
): value is { strategyBinding: StrategyProductionBinding } {
  if (!isPlainRecord(value) || !isPlainRecord(value.strategyBinding)) {
    return false;
  }
  const binding = value.strategyBinding;
  return (
    (binding.kind === "builtin" || binding.kind === "library") &&
    (binding.bindingId === null || typeof binding.bindingId === "string") &&
    typeof binding.strategyId === "string" &&
    typeof binding.revision === "string" &&
    typeof binding.name === "string" &&
    (binding.auditRunId === null || typeof binding.auditRunId === "string") &&
    isMarket(binding.market) &&
    typeof binding.symbol === "string" &&
    isTimeframe(binding.timeframe) &&
    (binding.status === "ready" || binding.status === "blocked") &&
    typeof binding.detail === "string" &&
    typeof binding.switchAllowed === "boolean" &&
    (binding.switchBlockedReason === null || typeof binding.switchBlockedReason === "string") &&
    typeof binding.operator === "string"
  );
}

export function isProductionStrategyHandoffPayload(
  value: unknown
): value is { productionStrategyHandoff: ProductionStrategyHandoff } {
  if (!isPlainRecord(value) || !isPlainRecord(value.productionStrategyHandoff)) {
    return false;
  }
  const handoff = value.productionStrategyHandoff;
  if (!isPlainRecord(handoff.productionReplay) || !isPlainRecord(handoff.boundary)) {
    return false;
  }
  const replay = handoff.productionReplay;
  const boundary = handoff.boundary;
  return (
    typeof handoff.runId === "string" &&
    typeof handoff.strategyId === "string" &&
    typeof handoff.strategyRevision === "string" &&
    typeof handoff.strategyName === "string" &&
    isMarket(handoff.market) &&
    typeof handoff.symbol === "string" &&
    isTimeframe(handoff.timeframe) &&
    (handoff.status === "active" || handoff.status === "ready" || handoff.status === "review") &&
    handoff.evidenceStatus === "eligible" &&
    typeof handoff.switchAllowed === "boolean" &&
    (handoff.switchBlockedReason === null || typeof handoff.switchBlockedReason === "string") &&
    typeof handoff.alreadyBound === "boolean" &&
    typeof handoff.auditHash === "string" &&
    typeof handoff.dataSnapshotHash === "string" &&
    typeof replay.feeBps === "number" &&
    Number.isFinite(replay.feeBps) &&
    typeof replay.slippageBps === "number" &&
    Number.isFinite(replay.slippageBps) &&
    typeof replay.auditedMaxDrawdownPct === "number" &&
    Number.isFinite(replay.auditedMaxDrawdownPct) &&
    typeof replay.productionMaxDrawdownPct === "number" &&
    Number.isFinite(replay.productionMaxDrawdownPct) &&
    typeof replay.strategyMaxDrawdownPct === "number" &&
    Number.isFinite(replay.strategyMaxDrawdownPct) &&
    boundary.authorizesLive === false &&
    boundary.startsMonitoring === false &&
    boundary.evaluatesNow === false &&
    boundary.submitsOrder === false
  );
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

function isStrategyExperimentErrorPayload(
  value: unknown
): value is { error: StrategyExperimentErrorCode; detail?: string } {
  if (!isPlainRecord(value)) {
    return false;
  }
  return (
    isStrategyExperimentErrorCode(value.error) &&
    (value.detail === undefined || typeof value.detail === "string")
  );
}

function isStrategyExperimentErrorCode(value: unknown): value is StrategyExperimentErrorCode {
  return (
    value === "invalid_strategy_experiment" ||
    value === "strategy_not_found" ||
    value === "research_run_not_found" ||
    value === "strategy_experiment_not_found" ||
    value === "source_snapshot_reaudit_required" ||
    value === "strategy_experiment_conflict" ||
    value === "test_holdout_consumed" ||
    value === "strategy_experiment_failed"
  );
}

function isStrategyExperimentHistoryPayload(value: unknown): value is { experiments: StrategyExperimentListItem[] } {
  return (
    isPlainRecord(value) &&
    Array.isArray(value.experiments) &&
    value.experiments.every(isStrategyExperimentListItem)
  );
}

function isStrategyExperimentDetailPayload(value: unknown): value is { experiment: StrategyExperimentDetail } {
  return isPlainRecord(value) && isStrategyExperimentDetail(value.experiment);
}

function isStrategyExperimentListItem(value: unknown): value is StrategyExperimentListItem {
  if (!isPlainRecord(value)) {
    return false;
  }
  return (
    typeof value.experimentId === "string" &&
    typeof value.createdAt === "string" &&
    (value.status === "completed" || value.status === "failed") &&
    typeof value.definitionHash === "string" &&
    typeof value.holdoutKey === "string" &&
    typeof value.strategyLineageKey === "string" &&
    /^[0-9a-f]{64}$/.test(value.strategyLineageKey) &&
    typeof value.strategyRevision === "string" &&
    typeof value.sourceRunId === "string" &&
    typeof value.snapshotId === "string" &&
    isMarket(value.market) &&
    typeof value.symbol === "string" &&
    isTimeframe(value.timeframe) &&
    isStrategyExperimentDefinition(value.definition) &&
    typeof value.evaluationCount === "number" &&
    (value.selectedCandidateId === null || typeof value.selectedCandidateId === "string") &&
    (value.completionReason === null ||
      value.completionReason === "selected" ||
      value.completionReason === "no_eligible_candidate") &&
    (value.resultHash === null || typeof value.resultHash === "string") &&
    (value.errorCode === null || typeof value.errorCode === "string") &&
    (value.errorDetail === null || typeof value.errorDetail === "string")
  );
}

function isStrategyExperimentDefinition(value: unknown): value is StrategyExperimentListItem["definition"] {
  if (!isPlainRecord(value) || !isPlainRecord(value.split)) {
    return false;
  }
  return (
    isResearchRunStrategyConfig(value.baseStrategy) &&
    typeof value.strategyRevision === "string" &&
    typeof value.sourceRunId === "string" &&
    typeof value.snapshotId === "string" &&
    typeof value.canonicalDataHash === "string" &&
    isMarket(value.market) &&
    typeof value.symbol === "string" &&
    isTimeframe(value.timeframe) &&
    isBacktestAssumptions(value.assumptions) &&
    value.split.trainPct === 60 &&
    value.split.validationPct === 20 &&
    value.split.testPct === 20 &&
    Array.isArray(value.dimensions) &&
    value.dimensions.every(isStrategyExperimentDimension) &&
    isStrategyExperimentGuardrails(value.guardrails) &&
    (value.walkForward === null || isStrategyExperimentWalkForward(value.walkForward)) &&
    typeof value.evaluationBudget === "number" &&
    value.engineVersion === "backtest-v1" &&
    value.resultSchemaVersion === 1
  );
}

function isStrategyExperimentDimension(value: unknown): boolean {
  if (!isPlainRecord(value)) {
    return false;
  }
  return (
    (value.conditionSide === "entry" || value.conditionSide === "exit") &&
    typeof value.conditionIndex === "number" &&
    (value.parameter === "window" || value.parameter === "threshold") &&
    Array.isArray(value.values) &&
    value.values.every((item) => typeof item === "number")
  );
}

function isStrategyExperimentGuardrails(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    typeof value.minimumTradeCount === "number" &&
    (value.maximumDrawdownPct === null || typeof value.maximumDrawdownPct === "number")
  );
}

function isStrategyExperimentWalkForward(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    typeof value.trainBars === "number" &&
    typeof value.validationBars === "number" &&
    typeof value.stepBars === "number"
  );
}

function isStrategyExperimentDetail(value: unknown): value is StrategyExperimentDetail {
  return (
    isStrategyExperimentListItem(value) &&
    isPlainRecord(value) &&
    (value.holdoutStatus === "unconsumed" ||
      value.holdoutStatus === "consumed" ||
      value.holdoutStatus === "consumed_by_other_definition") &&
    isStrategyExperimentSnapshot(value.snapshot) &&
    Array.isArray(value.candidates) &&
    value.candidates.every(isStrategyExperimentCandidate)
  );
}

function isStrategyExperimentSnapshot(value: unknown): boolean {
  if (!isPlainRecord(value)) {
    return false;
  }
  return (
    typeof value.snapshotId === "string" &&
    typeof value.createdAt === "string" &&
    isMarket(value.market) &&
    typeof value.symbol === "string" &&
    isTimeframe(value.timeframe) &&
    typeof value.canonicalDataHash === "string" &&
    typeof value.rows === "number" &&
    typeof value.startAt === "string" &&
    typeof value.endAt === "string" &&
    Array.isArray(value.bars) &&
    value.bars.every(isMarketKlineBar) &&
    (value.testDefinitionHash === null || typeof value.testDefinitionHash === "string") &&
    (value.testOwnerExperimentId === null || typeof value.testOwnerExperimentId === "string") &&
    (value.testConsumedAt === null || typeof value.testConsumedAt === "string")
  );
}

function isStrategyExperimentCandidate(value: unknown): value is StrategyExperimentCandidate {
  if (!isPlainRecord(value)) {
    return false;
  }
  return (
    typeof value.candidateId === "string" &&
    typeof value.candidateRevision === "string" &&
    Array.isArray(value.parameters) &&
    value.parameters.every(isStrategyExperimentParameterPatch) &&
    isStrategyExperimentMetricSet(value.trainMetrics) &&
    isStrategyExperimentMetricSet(value.validationMetrics) &&
    (value.testMetrics === null || isStrategyExperimentMetricSet(value.testMetrics)) &&
    isStrategyExperimentWalkForwardEvidence(value.walkForward) &&
    typeof value.eligible === "boolean" &&
    (value.rank === null || typeof value.rank === "number")
  );
}

function isStrategyExperimentParameterPatch(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    (value.conditionSide === "entry" || value.conditionSide === "exit") &&
    typeof value.conditionIndex === "number" &&
    (value.parameter === "window" || value.parameter === "threshold") &&
    typeof value.value === "number"
  );
}

function isStrategyExperimentMetricSet(value: unknown): value is StrategyExperimentMetricSet {
  return (
    isPlainRecord(value) &&
    typeof value.totalReturnPct === "number" &&
    typeof value.annualReturnPct === "number" &&
    typeof value.maxDrawdownPct === "number" &&
    typeof value.winRatePct === "number" &&
    typeof value.profitFactor === "number" &&
    typeof value.tradeCount === "number"
  );
}

function isStrategyExperimentWalkForwardEvidence(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    Array.isArray(value.windows) &&
    value.windows.every(isStrategyExperimentWalkForwardWindow) &&
    typeof value.validationWindowCount === "number" &&
    typeof value.positiveReturnCount === "number" &&
    (value.medianReturnPct === null || typeof value.medianReturnPct === "number") &&
    (value.worstDrawdownPct === null || typeof value.worstDrawdownPct === "number")
  );
}

function isStrategyExperimentWalkForwardWindow(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    typeof value.index === "number" &&
    typeof value.trainStartIndex === "number" &&
    typeof value.trainEndIndex === "number" &&
    typeof value.validationStartIndex === "number" &&
    typeof value.validationEndIndex === "number" &&
    isStrategyExperimentMetricSet(value.trainMetrics) &&
    isStrategyExperimentMetricSet(value.validationMetrics)
  );
}

export function isStrategyValidation(value: unknown): value is StrategyValidation {
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
