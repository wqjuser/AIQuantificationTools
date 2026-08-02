import type { AiReviewEvidenceAnchor, AiReviewRunRecord } from "./terminal-workbench";
import {
  isAiReviewDecision,
  isAiReviewRunArchiveRecord,
  type AiReviewDecision,
  type AiReviewRunArchiveRecord
} from "./ai-review-stage3";
import { buildApiUrl, defaultFetcher, type WorkspaceFetcher } from "./terminal-api-http";
import { hasExactObjectKeys, isCoreErrorPayload, isMarket, isTimeframe } from "./terminal-api-contract";
import type { WorkspaceSource } from "./workspace-transport";

export interface AiReviewRunRecordEnvelope {
  aiReviewId: string;
  runId: string;
  createdAt: string;
  record: AiReviewRunRecord;
}

export interface AiReviewRunV2ArchiveEnvelope {
  aiReviewId: string;
  runId: string;
  createdAt: string;
  record: AiReviewRunArchiveRecord;
}

export interface AiReviewDecisionArchiveEnvelope {
  decisionId: string;
  aiReviewId: string;
  createdAt: string;
  record: AiReviewDecision;
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

export function isAiReviewRunRecordPayload(value: unknown): value is { aiReview: AiReviewRunRecordEnvelope } {
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

export function isAiReviewRunRecordEnvelope(value: unknown): value is AiReviewRunRecordEnvelope {
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

export function isAiReviewRunV2ArchiveEnvelope(value: unknown, runId: string | undefined): value is AiReviewRunV2ArchiveEnvelope {
  if (!hasExactObjectKeys(value, ["aiReviewId", "runId", "createdAt", "record"])
    || typeof value.aiReviewId !== "string"
    || typeof value.runId !== "string"
    || typeof value.createdAt !== "string"
    || !isAiReviewRunArchiveRecord(value.record)) {
    return false;
  }
  return value.aiReviewId === value.record.aiReviewId
    && value.createdAt === value.record.createdAt
    && value.runId === value.record.primaryExperiment.sourceRunId
    && (!runId || value.runId === runId);
}

export function isAiReviewDecisionArchiveEnvelope(value: unknown): value is AiReviewDecisionArchiveEnvelope {
  if (!hasExactObjectKeys(value, ["decisionId", "aiReviewId", "createdAt", "record"])
    || typeof value.decisionId !== "string"
    || typeof value.aiReviewId !== "string"
    || typeof value.createdAt !== "string"
    || !isAiReviewDecision(value.record)) {
    return false;
  }
  return value.decisionId === value.record.decisionId
    && value.aiReviewId === value.record.aiReviewId
    && value.createdAt === value.record.createdAt;
}
