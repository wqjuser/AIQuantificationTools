import {
  resolveBacktestAssumptions,
  workspaceFromResearchRunAudit,
  workspaceWithPrimaryWorkflows,
  type BacktestAssumptions,
  type Market,
  type StrategySnapshot,
  type TerminalWorkspace
} from "./terminal-workbench";
import { buildApiUrl, coreErrorDetail, defaultFetcher, type WorkspaceFetcher } from "./terminal-api-http";
import {
  isAuditEventRecord,
  isCoreErrorPayload,
  type AuditEventRecord,
  type MarketAiSelectionResearchOrigin,
  type TerminalResearchParams
} from "./terminal-api-contract";
import type { ResearchTimeframe, WorkspaceLoadResult, WorkspaceSource } from "./workspace-transport";
import {
  isPaperExecutionRecord,
  isPromotionCandidateRecord,
  type PaperExecutionRecord,
  type PromotionCandidateRecord
} from "./paper-execution-transport";
import { isAiReviewRunRecordEnvelope, type AiReviewRunRecordEnvelope } from "./ai-review-run-transport";
import { loadResearchRunDetail } from "./research-run-transport";

export interface P0AiReviewRunParams {
  runId: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
}

export interface P0AiReviewRunResult {
  aiReview?: AiReviewRunRecordEnvelope;
  source: WorkspaceSource;
  statusLabel: string;
  error?: string;
  mode?: "local_evidence_review";
  paperOnly?: boolean;
  liveTradingAllowed?: boolean;
  directTradingInstructionBlocked?: boolean;
}

export interface P0PaperSimulationParams {
  runId: string;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
}

export interface P0PaperSimulationFill {
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  fillPrice: number;
  status: "filled" | "rejected";
  filledAt: string;
  reason: string;
}

export interface P0PaperSimulationAccountReplay {
  mode: "single_run_paper_replay";
  runId: string;
  symbol: string;
  initialCash: number;
  cashAfter: number;
  positionAfter: number;
  equityAfter: number;
  ordersApplied: number;
  paperOnly: true;
  liveTradingAllowed: false;
}

export interface P0PaperSimulationGate {
  id: string;
  label: string;
  status: "passed" | "blocked" | "review";
  detail: string;
}

export interface P0PaperSimulationExportReadiness {
  ready: boolean;
  requiredArtifacts: string[];
  paperExecutionId: string;
  auditEventId: string;
  detail: string;
}

export interface P0PaperSimulationResponse {
  status: "paper_simulation_created";
  runId: string;
  paperOnly: true;
  liveTradingAllowed: false;
  orderSubmitted?: false;
  liveOrderSubmitted?: false;
  routeExecuted?: false;
  paperOrderRecorded?: true;
  simulatedFillRecorded?: true;
  liveRouteBlockedReason: string;
  execution: PaperExecutionRecord;
  simulatedFill: P0PaperSimulationFill;
  accountReplay: P0PaperSimulationAccountReplay;
  gates?: P0PaperSimulationGate[];
  aiReview?: AiReviewRunRecordEnvelope;
  promotion?: PromotionCandidateRecord;
  auditEvent: AuditEventRecord;
  exportReadiness: P0PaperSimulationExportReadiness;
}

export interface P0PaperSimulationRunResult {
  simulation?: P0PaperSimulationResponse;
  execution?: PaperExecutionRecord;
  simulatedFill?: P0PaperSimulationFill;
  accountReplay?: P0PaperSimulationAccountReplay;
  auditEvent?: AuditEventRecord;
  exportReadiness?: P0PaperSimulationExportReadiness;
  promotion?: PromotionCandidateRecord;
  source: WorkspaceSource;
  statusLabel: string;
  error?: string;
  paperOnly?: boolean;
  liveTradingAllowed?: boolean;
  orderSubmitted?: boolean;
  liveOrderSubmitted?: boolean;
  routeExecuted?: boolean;
  liveRouteBlockedReason?: string;
}

export interface P0PipelineRequest {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  limit: number;
  watchlistRefreshRunId?: string;
  selectionOrigin?: MarketAiSelectionResearchOrigin;
  strategyConfig: StrategySnapshot;
  assumptions: BacktestAssumptions;
}

export interface P0PipelineResponse {
  status: "audited_run_created";
  runId: string;
  strategyRevisionId: string;
  dataSnapshotId: string;
  metrics: {
    totalReturnPct: number;
    maxDrawdownPct: number;
    tradeCount: number;
  };
  paperOnly: true;
  liveTradingAllowed: false;
  orderSubmitted?: false;
  liveOrderSubmitted?: false;
  routeExecuted?: false;
}

export interface P0PipelineRunResult extends WorkspaceLoadResult {
  pipeline?: P0PipelineResponse;
}

export function buildP0PipelineUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p0/pipeline");
}

export function buildP0AiReviewUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p0/ai-reviews");
}

export function buildP0PaperSimulationUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/p0/paper-simulations");
}

export async function runP0AiReview(
  baseUrl: string,
  params: P0AiReviewRunParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P0AiReviewRunResult> {
  try {
    const response = await fetcher(buildP0AiReviewUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    const payload = await response.json();
    if (!response.ok) {
      return {
        source: isCoreErrorPayload(payload) ? "core" : "fallback",
        statusLabel: "P0 AI review failed",
        error: coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`
      };
    }
    if (!isP0AiReviewRunPayload(payload)) {
      throw new Error("Invalid P0 AI review contract");
    }
    return {
      aiReview: payload.aiReview,
      source: "core",
      statusLabel: "P0 AI review saved",
      mode: payload.mode,
      paperOnly: payload.paperOnly,
      liveTradingAllowed: payload.liveTradingAllowed,
      directTradingInstructionBlocked: payload.directTradingInstructionBlocked
    };
  } catch (error) {
    return {
      source: "fallback",
      statusLabel: "P0 AI review failed",
      error: error instanceof Error ? error.message : "Unknown P0 AI review error"
    };
  }
}

export async function runP0PaperSimulation(
  baseUrl: string,
  params: P0PaperSimulationParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P0PaperSimulationRunResult> {
  try {
    const response = await fetcher(buildP0PaperSimulationUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    const payload = await response.json();
    if (!response.ok) {
      return {
        source: isCoreErrorPayload(payload) ? "core" : "fallback",
        statusLabel: "P0 paper simulation failed",
        error: coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`
      };
    }
    if (!isP0PaperSimulationPayload(payload)) {
      throw new Error("Invalid P0 paper simulation contract");
    }
    return {
      simulation: payload,
      execution: payload.execution,
      simulatedFill: payload.simulatedFill,
      accountReplay: payload.accountReplay,
      auditEvent: payload.auditEvent,
      exportReadiness: payload.exportReadiness,
      promotion: payload.promotion,
      source: "core",
      statusLabel: "P0 paper simulation created",
      paperOnly: payload.paperOnly,
      liveTradingAllowed: payload.liveTradingAllowed,
      orderSubmitted: payload.orderSubmitted ?? false,
      liveOrderSubmitted: payload.liveOrderSubmitted ?? false,
      routeExecuted: payload.routeExecuted ?? false,
      liveRouteBlockedReason: payload.liveRouteBlockedReason
    };
  } catch (error) {
    return {
      source: "fallback",
      statusLabel: "P0 paper simulation failed",
      error: error instanceof Error ? error.message : "Unknown P0 paper simulation error"
    };
  }
}

export function buildP0PipelineRequest(
  params: TerminalResearchParams,
  currentWorkspace: TerminalWorkspace
): P0PipelineRequest {
  return {
    market: params.market,
    symbol: params.symbol,
    timeframe: params.timeframe,
    limit: Math.max(1, Math.min(params.limit ?? 500, 500)),
    watchlistRefreshRunId: params.watchlistRefreshRunId?.trim() || undefined,
    selectionOrigin: params.selectionOrigin ?? undefined,
    strategyConfig: { ...currentWorkspace.strategy },
    assumptions: resolveBacktestAssumptions(currentWorkspace)
  };
}

export async function runP0Pipeline(
  baseUrl: string,
  params: TerminalResearchParams,
  currentWorkspace: TerminalWorkspace,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<P0PipelineRunResult> {
  try {
    const response = await fetcher(buildP0PipelineUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildP0PipelineRequest(params, currentWorkspace))
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
    }
    if (!isP0PipelineResponsePayload(payload)) {
      throw new Error("Invalid P0 pipeline contract");
    }
    const detail = await loadResearchRunDetail(baseUrl, payload.runId, fetcher);
    if (detail.source !== "core" || !detail.run) {
      throw new Error(detail.error ?? "P0 pipeline audit run detail unavailable");
    }
    return {
      workspace: workspaceWithPrimaryWorkflows(workspaceFromResearchRunAudit(currentWorkspace, detail.run)),
      source: "core",
      statusLabel: "P0 pipeline run complete",
      pipeline: payload
    };
  } catch (error) {
    return {
      workspace: currentWorkspace,
      source: "fallback",
      statusLabel: "P0 pipeline run failed",
      error: error instanceof Error ? error.message : "Unknown P0 pipeline error"
    };
  }
}

function isP0PipelineResponsePayload(value: unknown): value is P0PipelineResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P0PipelineResponse>;
  const metrics = payload.metrics as Partial<P0PipelineResponse["metrics"]> | undefined;
  return (
    payload.status === "audited_run_created" &&
    typeof payload.runId === "string" &&
    payload.runId.length > 0 &&
    typeof payload.strategyRevisionId === "string" &&
    payload.strategyRevisionId.length > 0 &&
    typeof payload.dataSnapshotId === "string" &&
    payload.dataSnapshotId.length > 0 &&
    Boolean(metrics) &&
    typeof metrics?.totalReturnPct === "number" &&
    typeof metrics?.maxDrawdownPct === "number" &&
    typeof metrics?.tradeCount === "number" &&
    payload.paperOnly === true &&
    payload.liveTradingAllowed === false &&
    (payload.orderSubmitted === undefined || payload.orderSubmitted === false) &&
    (payload.liveOrderSubmitted === undefined || payload.liveOrderSubmitted === false) &&
    (payload.routeExecuted === undefined || payload.routeExecuted === false)
  );
}

function isP0AiReviewRunPayload(value: unknown): value is {
  status: "ai_review_saved";
  mode: "local_evidence_review";
  aiReview: AiReviewRunRecordEnvelope;
  paperOnly: true;
  liveTradingAllowed: false;
  directTradingInstructionBlocked: true;
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as {
    status?: unknown;
    mode?: unknown;
    aiReview?: unknown;
    paperOnly?: unknown;
    liveTradingAllowed?: unknown;
    directTradingInstructionBlocked?: unknown;
  };
  return (
    payload.status === "ai_review_saved" &&
    payload.mode === "local_evidence_review" &&
    isAiReviewRunRecordEnvelope(payload.aiReview) &&
    payload.paperOnly === true &&
    payload.liveTradingAllowed === false &&
    payload.directTradingInstructionBlocked === true
  );
}

function isP0PaperSimulationPayload(value: unknown): value is P0PaperSimulationResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<P0PaperSimulationResponse>;
  return (
    payload.status === "paper_simulation_created" &&
    typeof payload.runId === "string" &&
    payload.runId.length > 0 &&
    payload.paperOnly === true &&
    payload.liveTradingAllowed === false &&
    (payload.orderSubmitted === undefined || payload.orderSubmitted === false) &&
    (payload.liveOrderSubmitted === undefined || payload.liveOrderSubmitted === false) &&
    (payload.routeExecuted === undefined || payload.routeExecuted === false) &&
    typeof payload.liveRouteBlockedReason === "string" &&
    payload.liveRouteBlockedReason.length > 0 &&
    isPaperExecutionRecord(payload.execution) &&
    isP0PaperSimulationFill(payload.simulatedFill) &&
    isP0PaperSimulationAccountReplay(payload.accountReplay) &&
    (payload.gates === undefined || (Array.isArray(payload.gates) && payload.gates.every(isP0PaperSimulationGate))) &&
    (payload.aiReview === undefined || isAiReviewRunRecordEnvelope(payload.aiReview)) &&
    (payload.promotion === undefined || isPromotionCandidateRecord(payload.promotion)) &&
    isAuditEventRecord(payload.auditEvent) &&
    isP0PaperSimulationExportReadiness(payload.exportReadiness)
  );
}

function isP0PaperSimulationFill(value: unknown): value is P0PaperSimulationFill {
  if (!value || typeof value !== "object") {
    return false;
  }
  const fill = value as Partial<P0PaperSimulationFill>;
  return (
    typeof fill.orderId === "string" &&
    typeof fill.symbol === "string" &&
    (fill.side === "buy" || fill.side === "sell") &&
    typeof fill.quantity === "number" &&
    typeof fill.fillPrice === "number" &&
    (fill.status === "filled" || fill.status === "rejected") &&
    typeof fill.filledAt === "string" &&
    typeof fill.reason === "string"
  );
}

function isP0PaperSimulationAccountReplay(value: unknown): value is P0PaperSimulationAccountReplay {
  if (!value || typeof value !== "object") {
    return false;
  }
  const replay = value as Partial<P0PaperSimulationAccountReplay>;
  return (
    replay.mode === "single_run_paper_replay" &&
    typeof replay.runId === "string" &&
    typeof replay.symbol === "string" &&
    typeof replay.initialCash === "number" &&
    typeof replay.cashAfter === "number" &&
    typeof replay.positionAfter === "number" &&
    typeof replay.equityAfter === "number" &&
    typeof replay.ordersApplied === "number" &&
    replay.paperOnly === true &&
    replay.liveTradingAllowed === false
  );
}

function isP0PaperSimulationGate(value: unknown): value is P0PaperSimulationGate {
  if (!value || typeof value !== "object") {
    return false;
  }
  const gate = value as Partial<P0PaperSimulationGate>;
  return (
    typeof gate.id === "string" &&
    typeof gate.label === "string" &&
    (gate.status === "passed" || gate.status === "blocked" || gate.status === "review") &&
    typeof gate.detail === "string"
  );
}

function isP0PaperSimulationExportReadiness(value: unknown): value is P0PaperSimulationExportReadiness {
  if (!value || typeof value !== "object") {
    return false;
  }
  const readiness = value as Partial<P0PaperSimulationExportReadiness>;
  return (
    typeof readiness.ready === "boolean" &&
    Array.isArray(readiness.requiredArtifacts) &&
    readiness.requiredArtifacts.every((item) => typeof item === "string") &&
    typeof readiness.paperExecutionId === "string" &&
    typeof readiness.auditEventId === "string" &&
    typeof readiness.detail === "string"
  );
}
