import type { AiReviewProviderId } from "./ai-review-stage3";
import { hasExactObjectKeys, isPlainRecord } from "./terminal-api-contract";
import {
  buildApiUrl,
  defaultFetcher,
  requestJson,
  resolveRequestOptions,
  WorkspaceHttpError,
  type WorkspaceFetcher,
} from "./terminal-api-http";

type WorkspaceSource = "core" | "fallback";

export interface StrategyResearchSealedDataCapability {
  hashVersion: "aiqt-sealed-v1";
  minimumRows: number;
  minimumPreRollRows: number;
  developmentScoringRows: number;
  withheldRows: number;
}

export interface StrategyResearchParameterCapability {
  policyPath: string;
  type: "integer" | "number";
  minimum: number;
  maximum: number;
}

export interface StrategyResearchCapability {
  templateId: string;
  version: string;
  policyKind: string;
  market: string;
  symbol: string;
  timeframe: string;
  sealedData: StrategyResearchSealedDataCapability;
  parameterSchema: StrategyResearchParameterCapability[];
  evaluatorVersion: string;
}

export interface StrategyResearchCapabilitiesResult {
  capabilities?: StrategyResearchCapability[];
  source: WorkspaceSource;
  error?: string;
  httpStatus?: number;
}

export interface StrategyResearchProposalRequest {
  sourceRunId: string;
  goal: string;
  providerId: AiReviewProviderId;
  externalDataApproved: boolean;
}

export interface StrategyResearchDimension {
  policyPath: string;
  values: Array<string | number | boolean>;
}

export interface StrategyResearchProposal {
  proposalId: string;
  sourceRunId: string;
  goal: string;
  template: {
    templateId: string;
    policyKind: string;
    baseStrategyRevision: string;
  };
  experiment: {
    dimensions: StrategyResearchDimension[];
    assumptions: Record<string, unknown>;
    guardrails: Record<string, unknown>;
  };
  evidence: {
    sourceRunId: string;
    market: string;
    symbol: string;
    timeframe: string;
    rows: number;
    startAt: string;
    developmentEndExclusive: string;
    developmentHash: string;
    quality: "complete";
    baselineMetrics: Record<string, number>;
  };
  generation: {
    requestedProvider: AiReviewProviderId;
    usedProvider: AiReviewProviderId;
    status: "completed" | "skipped";
    externalDataApproved: boolean;
    reasons: string[];
    model?: string;
    sanitizedBaseUrl?: string;
    latencyMs?: number;
  };
  boundary: {
    proposalOnly: true;
    proposalPersisted: true;
    strategySaved: false;
    testRead: false;
    promotionExecuted: false;
    strategyBound: false;
    monitoringStarted: false;
    orderSubmitted: false;
    paperOnly: true;
    liveBlockedBoundary: true;
  };
}

export interface StrategyResearchLaunchRequest {
  proposalId: string;
  operator: string;
  confirmed: boolean;
}

export interface StrategyResearchLaunch {
  proposalId: string;
  experimentId: string;
  status: "pending" | "completed" | "failed";
  operator: string;
  boundary: {
    experimentStarted: true;
    promotionExecuted: false;
    strategyBound: false;
    monitoringStarted: false;
    orderSubmitted: false;
    paperOnly: true;
    liveBlockedBoundary: true;
  };
}

export interface StrategyResearchExperimentProjection {
  experimentId: string;
  createdAt: string;
  status: "pending" | "completed" | "failed";
  strategyRevision: string;
  sourceRunId: string;
  evaluationCount: number;
  selectedCandidateId: string | null;
  completionReason: string | null;
  profitabilityGatePassed: boolean;
  holdoutStatus: "unconsumed" | "consumed" | "consumed_by_other_definition";
  errorCode: string | null;
  errorDetail: string | null;
  candidates: Array<Record<string, unknown>>;
}

export type StrategyResearchPaperProjection = {
  status: "unavailable";
  enabled: false;
  executionMode: string | null;
  paperOnly: false;
  liveBlockedBoundary: false;
} | {
  status: "not_bound";
  enabled: false;
  executionMode: "paper";
  paperOnly: true;
  liveBlockedBoundary: true;
} | {
  status: "bound_paused" | "monitoring";
  enabled: boolean;
  executionMode: "paper";
  bindingId: string;
  revision: string;
  paperOnly: true;
  liveBlockedBoundary: true;
};

export interface StrategyResearchAggregate {
  proposal: StrategyResearchProposal;
  experiment: StrategyResearchExperimentProjection;
  reviews: Array<Record<string, unknown>>;
  promotion: Record<string, unknown> | null;
  library: Record<string, unknown> | null;
  paper: StrategyResearchPaperProjection;
  nextActions: string[];
  boundary: {
    readOnly: true;
    testBarsExposed: false;
    promotionExecuted: boolean;
    strategyBound: boolean;
    monitoringStarted: boolean;
    orderSubmitted: false;
    paperOnly: boolean;
    liveBlockedBoundary: boolean;
  };
}

export interface StrategyResearchProposalResult {
  proposal?: StrategyResearchProposal;
  source: WorkspaceSource;
  error?: string;
  httpStatus?: number;
}

export interface StrategyResearchLaunchResult {
  launch?: StrategyResearchLaunch;
  source: WorkspaceSource;
  error?: string;
  httpStatus?: number;
}

export interface StrategyResearchAggregateResult {
  research?: StrategyResearchAggregate;
  source: WorkspaceSource;
  error?: string;
  httpStatus?: number;
}

export function buildStrategyResearchProposalsUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/strategy-research/proposals");
}

export function buildStrategyResearchCapabilitiesUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/strategy-research/capabilities");
}

export function buildStrategyResearchLaunchesUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/strategy-research/launches");
}

export function buildStrategyResearchExperimentUrl(
  baseUrl: string,
  experimentId: string,
): string {
  return buildApiUrl(
    baseUrl,
    `api/strategy-research/experiments/${encodeURIComponent(
      requireTrimmedText(experimentId, "experiment ID", 320),
    )}`,
  );
}

export async function loadStrategyResearchCapabilities(
  baseUrl: string,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher,
): Promise<StrategyResearchCapabilitiesResult> {
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  try {
    const payload = await requestJson(
      buildStrategyResearchCapabilitiesUrl(baseUrl),
      signal ? { signal } : undefined,
      fetcher,
    );
    if (!hasExactObjectKeys(payload, ["capabilities"]) || !isStrategyResearchCapabilities(
      payload.capabilities,
    )) {
      throw new Error("Invalid strategy research capabilities contract");
    }
    return { capabilities: payload.capabilities, source: "core" };
  } catch (error) {
    return transportFailure(error, "Unknown strategy research capabilities error");
  }
}

export async function createStrategyResearchProposal(
  baseUrl: string,
  request: StrategyResearchProposalRequest,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher,
): Promise<StrategyResearchProposalResult> {
  const normalized = normalizeProposalRequest(request);
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  try {
    const payload = await requestJson(
      buildStrategyResearchProposalsUrl(baseUrl),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
        ...(signal ? { signal } : {}),
      },
      fetcher,
    );
    if (!hasExactObjectKeys(payload, ["proposal"]) || !isStrategyResearchProposal(payload.proposal)) {
      throw new Error("Invalid strategy research proposal contract");
    }
    if (payload.proposal.sourceRunId !== normalized.sourceRunId) {
      throw new Error("Strategy research proposal source changed");
    }
    return { proposal: payload.proposal, source: "core" };
  } catch (error) {
    return transportFailure(error, "Unknown strategy research proposal error");
  }
}

export async function launchStrategyResearchExperiment(
  baseUrl: string,
  request: StrategyResearchLaunchRequest,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher,
): Promise<StrategyResearchLaunchResult> {
  const normalized = normalizeLaunchRequest(request);
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  try {
    const payload = await requestJson(
      buildStrategyResearchLaunchesUrl(baseUrl),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalized),
        ...(signal ? { signal } : {}),
      },
      fetcher,
    );
    if (!hasExactObjectKeys(payload, ["launch"]) || !isStrategyResearchLaunch(payload.launch)) {
      throw new Error("Invalid strategy research launch contract");
    }
    if (payload.launch.proposalId !== normalized.proposalId) {
      throw new Error("Strategy research launch proposal changed");
    }
    return { launch: payload.launch, source: "core" };
  } catch (error) {
    return transportFailure(error, "Unknown strategy research launch error");
  }
}

export async function loadStrategyResearchExperiment(
  baseUrl: string,
  experimentId: string,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher,
): Promise<StrategyResearchAggregateResult> {
  const normalizedExperimentId = requireTrimmedText(experimentId, "experiment ID", 320);
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  try {
    const payload = await requestJson(
      buildStrategyResearchExperimentUrl(baseUrl, normalizedExperimentId),
      signal ? { signal } : undefined,
      fetcher,
    );
    if (!hasExactObjectKeys(payload, ["research"]) || !isStrategyResearchAggregate(payload.research)) {
      throw new Error("Invalid strategy research aggregate contract");
    }
    if (
      payload.research.experiment.experimentId !== normalizedExperimentId
      || payload.research.experiment.sourceRunId !== payload.research.proposal.sourceRunId
    ) {
      throw new Error("Strategy research aggregate identity changed");
    }
    return { research: payload.research, source: "core" };
  } catch (error) {
    return transportFailure(error, "Unknown strategy research aggregate error");
  }
}

export function shouldPollStrategyResearch(
  research: {
    readonly experiment: {
      readonly status: StrategyResearchExperimentProjection["status"];
    };
  } | null | undefined,
): boolean {
  return research?.experiment.status === "pending";
}

function normalizeProposalRequest(
  request: StrategyResearchProposalRequest,
): StrategyResearchProposalRequest {
  const sourceRunId = requireTrimmedText(request.sourceRunId, "source run ID", 320);
  const goal = requireTrimmedText(request.goal, "research goal", 1_000);
  if (goal.length < 4) {
    throw new TypeError("Invalid strategy research goal");
  }
  if (!isProviderId(request.providerId) || typeof request.externalDataApproved !== "boolean") {
    throw new TypeError("Invalid strategy research provider");
  }
  if (
    (request.providerId === "local" && request.externalDataApproved)
    || (request.providerId !== "local" && !request.externalDataApproved)
  ) {
    throw new TypeError("Invalid strategy research provider approval");
  }
  return {
    sourceRunId,
    goal,
    providerId: request.providerId,
    externalDataApproved: request.externalDataApproved,
  };
}

function normalizeLaunchRequest(
  request: StrategyResearchLaunchRequest,
): StrategyResearchLaunchRequest {
  if (request.confirmed !== true) {
    throw new TypeError("Strategy research launch requires explicit confirmation");
  }
  return {
    proposalId: requireTrimmedText(request.proposalId, "proposal ID", 320),
    operator: requireTrimmedText(request.operator, "operator", 320),
    confirmed: true,
  };
}

function requireTrimmedText(value: unknown, label: string, maxLength: number): string {
  if (
    typeof value !== "string"
    || !value
    || value !== value.trim()
    || value.length > maxLength
  ) {
    throw new TypeError(`Invalid ${label}`);
  }
  return value;
}

function isProviderId(value: unknown): value is AiReviewProviderId {
  return value === "local"
    || value === "openai"
    || value === "openai-compatible"
    || value === "ollama";
}

function isStrategyResearchCapabilities(
  value: unknown,
): value is StrategyResearchCapability[] {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isStrategyResearchCapability)) {
    return false;
  }
  return new Set(value.map((item) => item.templateId)).size === value.length;
}

function isStrategyResearchCapability(value: unknown): value is StrategyResearchCapability {
  if (!hasExactObjectKeys(value, [
    "templateId",
    "version",
    "policyKind",
    "market",
    "symbol",
    "timeframe",
    "sealedData",
    "parameterSchema",
    "evaluatorVersion",
  ])) {
    return false;
  }
  return isTrimmedCapabilityText(value.templateId)
    && isTrimmedCapabilityText(value.version)
    && isTrimmedCapabilityText(value.policyKind)
    && isTrimmedCapabilityText(value.market)
    && isTrimmedCapabilityText(value.symbol)
    && isTrimmedCapabilityText(value.timeframe)
    && isStrategyResearchSealedDataCapability(value.sealedData)
    && Array.isArray(value.parameterSchema)
    && value.parameterSchema.length > 0
    && value.parameterSchema.every(isStrategyResearchParameterCapability)
    && new Set(value.parameterSchema.map((item) => item.policyPath)).size
      === value.parameterSchema.length
    && isTrimmedCapabilityText(value.evaluatorVersion);
}

function isStrategyResearchSealedDataCapability(
  value: unknown,
): value is StrategyResearchSealedDataCapability {
  if (!hasExactObjectKeys(value, [
    "hashVersion",
    "minimumRows",
    "minimumPreRollRows",
    "developmentScoringRows",
    "withheldRows",
  ])) {
    return false;
  }
  const minimumRows = value.minimumRows;
  const minimumPreRollRows = value.minimumPreRollRows;
  const developmentScoringRows = value.developmentScoringRows;
  const withheldRows = value.withheldRows;
  const rowFields = [minimumRows, minimumPreRollRows, developmentScoringRows, withheldRows];
  return value.hashVersion === "aiqt-sealed-v1"
    && rowFields.every((rows) => typeof rows === "number" && Number.isInteger(rows) && rows > 0)
    && typeof minimumRows === "number"
    && typeof minimumPreRollRows === "number"
    && typeof developmentScoringRows === "number"
    && typeof withheldRows === "number"
    && minimumRows === minimumPreRollRows + developmentScoringRows + withheldRows;
}

function isStrategyResearchParameterCapability(
  value: unknown,
): value is StrategyResearchParameterCapability {
  return hasExactObjectKeys(value, ["policyPath", "type", "minimum", "maximum"])
    && isTrimmedCapabilityText(value.policyPath)
    && (value.type === "integer" || value.type === "number")
    && typeof value.minimum === "number"
    && Number.isFinite(value.minimum)
    && typeof value.maximum === "number"
    && Number.isFinite(value.maximum)
    && value.minimum <= value.maximum
    && (value.type !== "integer"
      || (Number.isInteger(value.minimum) && Number.isInteger(value.maximum)));
}

function isTrimmedCapabilityText(value: unknown): value is string {
  return typeof value === "string"
    && Boolean(value)
    && value === value.trim()
    && value.length <= 320;
}

function isStrategyResearchProposal(value: unknown): value is StrategyResearchProposal {
  if (!hasExactObjectKeys(value, [
    "proposalId",
    "sourceRunId",
    "goal",
    "template",
    "experiment",
    "evidence",
    "generation",
    "boundary",
  ])) {
    return false;
  }
  const template = value.template;
  const experiment = value.experiment;
  const evidence = value.evidence;
  const generation = value.generation;
  return typeof value.proposalId === "string"
    && value.proposalId.startsWith("strategy-research-proposal-")
    && typeof value.sourceRunId === "string"
    && typeof value.goal === "string"
    && hasExactObjectKeys(template, ["templateId", "policyKind", "baseStrategyRevision"])
    && typeof template.templateId === "string"
    && typeof template.policyKind === "string"
    && typeof template.baseStrategyRevision === "string"
    && hasExactObjectKeys(experiment, ["dimensions", "assumptions", "guardrails"])
    && Array.isArray(experiment.dimensions)
    && experiment.dimensions.every(isStrategyResearchDimension)
    && isPlainRecord(experiment.assumptions)
    && isPlainRecord(experiment.guardrails)
    && hasExactObjectKeys(evidence, [
      "sourceRunId", "market", "symbol", "timeframe", "rows", "startAt",
      "developmentEndExclusive", "developmentHash", "quality", "baselineMetrics",
    ])
    && typeof evidence.sourceRunId === "string"
    && typeof evidence.market === "string"
    && typeof evidence.symbol === "string"
    && typeof evidence.timeframe === "string"
    && typeof evidence.rows === "number"
    && typeof evidence.startAt === "string"
    && typeof evidence.developmentEndExclusive === "string"
    && typeof evidence.developmentHash === "string"
    && evidence.sourceRunId === value.sourceRunId
    && evidence.quality === "complete"
    && isPlainRecord(evidence.baselineMetrics)
    && Object.values(evidence.baselineMetrics).every((item) => typeof item === "number" && Number.isFinite(item))
    && isStrategyResearchGeneration(generation)
    && isProposalBoundary(value.boundary);
}

function isStrategyResearchDimension(value: unknown): value is StrategyResearchDimension {
  return hasExactObjectKeys(value, ["policyPath", "values"])
    && typeof value.policyPath === "string"
    && Array.isArray(value.values)
    && value.values.length > 0
    && value.values.every((item) =>
      typeof item === "string" || typeof item === "number" || typeof item === "boolean"
    );
}

function isStrategyResearchGeneration(
  value: unknown,
): value is StrategyResearchProposal["generation"] {
  if (!isPlainRecord(value)) {
    return false;
  }
  const required = [
    "requestedProvider", "usedProvider", "status", "externalDataApproved", "reasons",
  ];
  const optional = ["model", "sanitizedBaseUrl", "latencyMs"];
  if (
    Object.keys(value).some((key) => !required.includes(key) && !optional.includes(key))
    || required.some((key) => !(key in value))
  ) {
    return false;
  }
  return isProviderId(value.requestedProvider)
    && isProviderId(value.usedProvider)
    && (value.status === "completed" || value.status === "skipped")
    && typeof value.externalDataApproved === "boolean"
    && Array.isArray(value.reasons)
    && value.reasons.every((reason) => typeof reason === "string")
    && (value.model === undefined || typeof value.model === "string")
    && (value.sanitizedBaseUrl === undefined || typeof value.sanitizedBaseUrl === "string")
    && (value.latencyMs === undefined || typeof value.latencyMs === "number");
}

function isProposalBoundary(value: unknown): value is StrategyResearchProposal["boundary"] {
  return hasExactObjectKeys(value, [
    "proposalOnly", "proposalPersisted", "strategySaved", "testRead", "promotionExecuted", "strategyBound",
    "monitoringStarted", "orderSubmitted", "paperOnly", "liveBlockedBoundary",
  ])
    && value.proposalOnly === true
    && value.proposalPersisted === true
    && value.strategySaved === false
    && value.testRead === false
    && value.promotionExecuted === false
    && value.strategyBound === false
    && value.monitoringStarted === false
    && value.orderSubmitted === false
    && value.paperOnly === true
    && value.liveBlockedBoundary === true;
}

function isStrategyResearchLaunch(value: unknown): value is StrategyResearchLaunch {
  return hasExactObjectKeys(value, [
    "proposalId", "experimentId", "status", "operator", "boundary",
  ])
    && typeof value.proposalId === "string"
    && value.proposalId.startsWith("strategy-research-proposal-")
    && value.proposalId === value.proposalId.trim()
    && value.proposalId.length <= 320
    && typeof value.experimentId === "string"
    && Boolean(value.experimentId.trim())
    && value.experimentId === value.experimentId.trim()
    && value.experimentId.length <= 320
    && (value.status === "pending" || value.status === "completed" || value.status === "failed")
    && typeof value.operator === "string"
    && hasExactObjectKeys(value.boundary, [
      "experimentStarted", "promotionExecuted", "strategyBound", "monitoringStarted",
      "orderSubmitted", "paperOnly", "liveBlockedBoundary",
    ])
    && value.boundary.experimentStarted === true
    && value.boundary.promotionExecuted === false
    && value.boundary.strategyBound === false
    && value.boundary.monitoringStarted === false
    && value.boundary.orderSubmitted === false
    && value.boundary.paperOnly === true
    && value.boundary.liveBlockedBoundary === true;
}

function isStrategyResearchAggregate(value: unknown): value is StrategyResearchAggregate {
  if (containsProtectedStrategyResearchField(value)) {
    return false;
  }
  if (!hasExactObjectKeys(value, [
    "proposal", "experiment", "reviews", "promotion", "library", "paper", "nextActions",
    "boundary",
  ])) {
    return false;
  }
  const paper = value.paper;
  const boundary = value.boundary;
  const nextActions = value.nextActions;
  const experiment = value.experiment;
  if (
    !isStrategyResearchPaperProjection(paper)
    || !isStrategyResearchExperimentProjection(experiment)
  ) {
    return false;
  }
  const unavailablePaper = paper.status === "unavailable";
  return isStrategyResearchProposal(value.proposal)
    && Array.isArray(value.reviews)
    && value.reviews.every(isPlainRecord)
    && (value.promotion === null || isPlainRecord(value.promotion))
    && (value.library === null || isPlainRecord(value.library))
    && Array.isArray(nextActions)
    && nextActions.every((item) => typeof item === "string")
    && hasExactObjectKeys(boundary, [
      "readOnly", "testBarsExposed", "promotionExecuted", "strategyBound",
      "monitoringStarted", "orderSubmitted", "paperOnly", "liveBlockedBoundary",
    ])
    && boundary.readOnly === true
    && boundary.testBarsExposed === false
    && boundary.promotionExecuted === (value.promotion !== null)
    && boundary.strategyBound === (paper.status === "bound_paused" || paper.status === "monitoring")
    && boundary.monitoringStarted === (paper.status === "monitoring")
    && boundary.orderSubmitted === false
    && boundary.paperOnly === paper.paperOnly
    && boundary.liveBlockedBoundary === paper.liveBlockedBoundary
    && (!unavailablePaper || (
      boundary.strategyBound === false
      && boundary.monitoringStarted === false
      && boundary.paperOnly === false
      && boundary.liveBlockedBoundary === false
      && hasExactStrategyResearchNextActions(
        nextActions,
        unavailablePaperNextActions(experiment, value.promotion !== null),
      )
    ));
}

function unavailablePaperNextActions(
  experiment: StrategyResearchExperimentProjection,
  promotionExecuted: boolean,
): readonly string[] {
  if (experiment.status === "pending") {
    return ["wait_for_formal_experiment"];
  }
  if (experiment.status === "failed") {
    return ["inspect_formal_experiment_failure"];
  }
  if (!experiment.profitabilityGatePassed) {
    return ["review_non_admissible_result"];
  }
  if (!promotionExecuted) {
    return ["run_fresh_p0", "promote_winner_explicitly"];
  }
  return ["inspect_paper_runtime_boundary"];
}

function hasExactStrategyResearchNextActions(
  value: readonly string[],
  expected: readonly string[],
): boolean {
  return value.length === expected.length
    && value.every((action, index) => action === expected[index]);
}

function isStrategyResearchPaperProjection(
  value: unknown,
): value is StrategyResearchPaperProjection {
  if (!isPlainRecord(value) || typeof value.status !== "string") {
    return false;
  }
  if (value.status === "unavailable") {
    return hasExactObjectKeys(value, [
      "status", "enabled", "executionMode", "paperOnly", "liveBlockedBoundary",
    ])
      && value.enabled === false
      && (value.executionMode === null || typeof value.executionMode === "string")
      && value.paperOnly === false
      && value.liveBlockedBoundary === false;
  }
  if (value.status === "not_bound") {
    return hasExactObjectKeys(value, [
      "status", "enabled", "executionMode", "paperOnly", "liveBlockedBoundary",
    ])
      && value.enabled === false
      && value.executionMode === "paper"
      && value.paperOnly === true
      && value.liveBlockedBoundary === true;
  }
  if (value.status !== "bound_paused" && value.status !== "monitoring") {
    return false;
  }
  return hasExactObjectKeys(value, [
    "status", "enabled", "executionMode", "bindingId", "revision", "paperOnly",
    "liveBlockedBoundary",
  ])
    && value.enabled === (value.status === "monitoring")
    && value.executionMode === "paper"
    && typeof value.bindingId === "string"
    && Boolean(value.bindingId.trim())
    && typeof value.revision === "string"
    && Boolean(value.revision.trim())
    && value.paperOnly === true
    && value.liveBlockedBoundary === true;
}

const safeStrategyResearchMetricFields = new Set([
  "totalReturnPct",
  "annualReturnPct",
  "maxDrawdownPct",
  "winRatePct",
  "profitFactor",
  "tradeCount",
  "roundTripCount",
  "profitFactorInfinite",
]);

function isSafeStrategyResearchMetrics(value: unknown): boolean {
  if (value === null) {
    return true;
  }
  return isPlainRecord(value)
    && Object.entries(value).every(([key, metric]) => (
      safeStrategyResearchMetricFields.has(key)
      && (key === "profitFactorInfinite"
        ? typeof metric === "boolean"
        : typeof metric === "number" && Number.isFinite(metric))
    ));
}

function isSafeStrategyResearchTestGate(value: unknown): boolean {
  if (!hasExactObjectKeys(value, ["passed", "failures", "metrics", "guardrails"])) {
    return false;
  }
  return typeof value.passed === "boolean"
    && Array.isArray(value.failures)
    && value.failures.every((failure) => (
      failure === "non_positive_return"
      || failure === "profit_factor_below_minimum"
      || failure === "drawdown_above_maximum"
      || failure === "round_trip_count_below_minimum"
    ))
    && isSafeStrategyResearchMetrics(value.metrics)
    && hasExactObjectKeys(value.guardrails, [
      "requirePositiveReturn",
      "minimumProfitFactor",
      "maximumDrawdownPct",
      "minimumRoundTripCount",
    ])
    && typeof value.guardrails.requirePositiveReturn === "boolean"
    && typeof value.guardrails.minimumProfitFactor === "number"
    && Number.isFinite(value.guardrails.minimumProfitFactor)
    && typeof value.guardrails.maximumDrawdownPct === "number"
    && Number.isFinite(value.guardrails.maximumDrawdownPct)
    && Number.isInteger(value.guardrails.minimumRoundTripCount);
}

function isSafeStrategyResearchPretestGate(value: unknown): boolean {
  return hasExactObjectKeys(value, ["passed"])
    && typeof value.passed === "boolean";
}

function isSafeProtectedStrategyResearchSummary(
  normalized: string,
  value: unknown,
  path: readonly string[],
): boolean {
  const normalizedPath = path.map((part) => part.toLowerCase()).join(".");
  if (normalized === "holdoutstatus") {
    return normalizedPath === "experiment"
      && (value === "unconsumed"
        || value === "consumed"
        || value === "consumed_by_other_definition");
  }
  if (normalized === "testbarsexposed") {
    return normalizedPath === "boundary" && value === false;
  }
  if (normalized === "testread") {
    return normalizedPath === "proposal.boundary" && value === false;
  }
  return false;
}

function isProtectedStrategyResearchKey(
  key: string,
  value: unknown,
  path: readonly string[],
): boolean {
  const normalized = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (normalized === "testmetrics") {
    return !isSafeStrategyResearchMetrics(value);
  }
  if (isSafeProtectedStrategyResearchSummary(normalized, value, path)) {
    return false;
  }
  const tokens = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((token) => token.toLowerCase());
  const safeFormalTestGuardrail = normalized === "test"
    && isPlainRecord(value)
    && path.join(".") === "proposal.experiment.guardrails";
  const safeFormalTestEvaluation = normalized === "test"
    && path.at(-1)?.toLowerCase() === "gateevaluation"
    && isSafeStrategyResearchTestGate(value);
  const safeFormalPretestEvaluation = normalized === "pretest"
    && path.at(-1)?.toLowerCase() === "gateevaluation"
    && isSafeStrategyResearchPretestGate(value);
  if (safeFormalTestGuardrail || safeFormalTestEvaluation || safeFormalPretestEvaluation) {
    return false;
  }
  const identityMarkers = ["hash", "identity", "fingerprint", "digest", "partition", "definition"];
  return normalized.startsWith("test")
    || tokens.includes("test")
    || (tokens.some((token) => token.endsWith("test"))
      && identityMarkers.some((marker) => normalized.includes(marker)))
    || normalized.includes("holdout")
    || tokens.includes("holdout")
    || normalized.includes("withheld")
    || tokens.includes("withheld")
    || normalized.includes("dataset")
    || (normalized.includes("sealed")
      && (identityMarkers.some((marker) => normalized.includes(marker))
        || tokens.includes("id")));
}

function containsProtectedStrategyResearchField(
  value: unknown,
  path: readonly string[] = [],
): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => containsProtectedStrategyResearchField(item, path));
  }
  if (!isPlainRecord(value)) {
    return false;
  }
  return Object.entries(value).some(([key, nested]) => (
    isProtectedStrategyResearchKey(key, nested, path)
    || containsProtectedStrategyResearchField(nested, [...path, key])
  ));
}

function isStrategyResearchExperimentProjection(
  value: unknown,
): value is StrategyResearchExperimentProjection {
  return hasExactObjectKeys(value, [
    "experimentId", "createdAt", "status", "strategyRevision", "sourceRunId",
    "evaluationCount", "selectedCandidateId", "completionReason",
    "profitabilityGatePassed", "holdoutStatus", "errorCode", "errorDetail", "candidates",
  ])
    && typeof value.experimentId === "string"
    && typeof value.createdAt === "string"
    && (value.status === "pending" || value.status === "completed" || value.status === "failed")
    && typeof value.strategyRevision === "string"
    && typeof value.sourceRunId === "string"
    && Number.isInteger(value.evaluationCount)
    && typeof value.evaluationCount === "number"
    && (value.selectedCandidateId === null || typeof value.selectedCandidateId === "string")
    && (value.completionReason === null || typeof value.completionReason === "string")
    && typeof value.profitabilityGatePassed === "boolean"
    && (value.holdoutStatus === "unconsumed"
      || value.holdoutStatus === "consumed"
      || value.holdoutStatus === "consumed_by_other_definition")
    && (value.errorCode === null || typeof value.errorCode === "string")
    && (value.errorDetail === null || typeof value.errorDetail === "string")
    && Array.isArray(value.candidates)
    && value.candidates.every(isPlainRecord);
}

function transportFailure<T extends { source: WorkspaceSource; error?: string; httpStatus?: number }>(
  error: unknown,
  fallback: string,
): T {
  return {
    source: "fallback",
    error: error instanceof Error ? error.message : fallback,
    ...(error instanceof WorkspaceHttpError ? { httpStatus: error.status } : {}),
  } as T;
}
