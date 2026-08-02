import type { ResearchRunAudit } from "./terminal-workbench";
import type { AiReviewDecision, AuthoritativeAiReviewRun, LegacyAiReviewHistoryRecord } from "./ai-review-stage3";
import {
  buildApiUrl,
  coreErrorDetail,
  defaultFetcher,
  resolveRequestOptions,
  type WorkspaceFetcher
} from "./terminal-api-http";
import type { WorkspaceSource } from "./workspace-transport";
import {
  isResearchRunExportPayload,
  type ResearchRunExportPackage
} from "./research-run-export-contract";
import {
  loadAiReviewDecisions,
  loadAuthoritativeAiReview,
  loadAuthoritativeAiReviews
} from "./ai-review-transport";
import { loadResearchNote, type ResearchNote } from "./research-ai-transport";
import { isResearchRunAudit } from "./research-run-transport";
import { loadStrategyLibrary, type StrategyLibraryItem } from "./strategy-transport";

export interface ResearchRunExportResult {
  exportPackage?: ResearchRunExportPackage;
  source: WorkspaceSource;
  error?: string;
}

export interface AiReviewArchiveImportSnapshot {
  authoritativeAiReviewRecords: AuthoritativeAiReviewRun[];
  aiReviewDecisions: AiReviewDecision[];
  legacyAiReviewIds: string[];
  readbackErrors: Record<string, string>;
}

export interface AiReviewRunArchiveSnapshotResult {
  runId: string;
  authoritativeAiReviewRecords: AuthoritativeAiReviewRun[];
  aiReviewDecisions: AiReviewDecision[];
  legacyAiReviewRecords: LegacyAiReviewHistoryRecord[];
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

export function buildResearchRunExportUrl(baseUrl: string, runId: string): string {
  return buildApiUrl(baseUrl, `api/research/runs/${encodeURIComponent(runId)}/export`);
}

export function buildResearchRunImportUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/research/runs/import");
}

export function buildResearchRunImportUndoUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/research/runs/import/undo");
}

export async function loadAiReviewArchiveImportSnapshot(
  baseUrl: string,
  exportPackage: ResearchRunExportPackage,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiReviewArchiveImportSnapshot> {
  const reviewIds = Array.from(new Set((exportPackage.aiReviewRunsV2 ?? []).map((item) => item.aiReviewId)));
  const entries = await Promise.all(reviewIds.map(async (aiReviewId) => {
    const [detail, history] = await Promise.all([
      loadAuthoritativeAiReview(baseUrl, aiReviewId, fetcher),
      loadAuthoritativeAiReviews(baseUrl, { query: aiReviewId, limit: 50, offset: 0 }, fetcher)
    ]);
    const exactLegacyIds = history.legacyReviews
      .filter((review) => review.aiReviewId === aiReviewId)
      .map((review) => review.aiReviewId);
    const exactHistoryReview = history.reviews.find((review) => review.aiReviewId === aiReviewId);
    const errors: Record<string, string> = {};
    if (history.source !== "core") {
      errors["review:" + aiReviewId] = history.error ?? "AI Review authority readback failed";
    } else if (detail.source !== "core" && detail.httpStatus !== 404) {
      errors["review:" + aiReviewId] = detail.error ?? "Authoritative Review readback failed";
    } else if (detail.source !== "core" && exactHistoryReview) {
      errors["review:" + aiReviewId] = "Authoritative Review detail/history readback mismatch";
    }
    const review = detail.review ?? exactHistoryReview;
    let decisions: AiReviewDecision[] = [];
    if (review && !errors["review:" + aiReviewId]) {
      const decisionHistory = await loadAiReviewDecisions(baseUrl, aiReviewId, fetcher);
      if (decisionHistory.source === "core") {
        decisions = decisionHistory.decisions;
      } else {
        errors["decisions:" + aiReviewId] =
          decisionHistory.error ?? "AI Review Decision readback failed";
      }
    } else if (errors["review:" + aiReviewId]) {
      errors["decisions:" + aiReviewId] = errors["review:" + aiReviewId];
    }
    return {
      decisions,
      errors,
      legacyAiReviewIds: exactLegacyIds,
      review
    };
  }));
  return {
    authoritativeAiReviewRecords: entries
      .map((entry) => entry.review)
      .filter((review): review is AuthoritativeAiReviewRun => Boolean(review)),
    aiReviewDecisions: entries.flatMap((entry) => entry.decisions),
    legacyAiReviewIds: Array.from(new Set(entries.flatMap((entry) => entry.legacyAiReviewIds))),
    readbackErrors: Object.assign({}, ...entries.map((entry) => entry.errors))
  };
}

export async function loadAiReviewRunArchiveSnapshot(
  baseUrl: string,
  runId: string,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<AiReviewRunArchiveSnapshotResult> {
  const normalizedRunId = runId.trim();
  if (!normalizedRunId) {
    return {
      runId: normalizedRunId,
      authoritativeAiReviewRecords: [],
      aiReviewDecisions: [],
      legacyAiReviewRecords: [],
      source: "fallback",
      error: "Invalid AI Review archive run ID"
    };
  }
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  const fallback = (error: string): AiReviewRunArchiveSnapshotResult => ({
    runId: normalizedRunId,
    authoritativeAiReviewRecords: [],
    aiReviewDecisions: [],
    legacyAiReviewRecords: [],
    source: "fallback",
    error
  });
  const authoritativeAiReviewRecords: AuthoritativeAiReviewRun[] = [];
  const legacyAiReviewRecords: LegacyAiReviewHistoryRecord[] = [];
  const seenAiReviewIds = new Set<string>();
  let offset = 0;
  let expectedTotal: number | null = null;
  while (expectedTotal === null || offset < expectedTotal) {
    const page = await loadAuthoritativeAiReviews(
      baseUrl,
      { runId: normalizedRunId, limit: 50, offset },
      signal,
      fetcher
    );
    if (page.source !== "core" || !page.pagination) {
      return fallback(page.error ?? "AI Review archive history readback failed");
    }
    if (page.pagination.limit !== 50
      || page.pagination.offset !== offset
      || page.pagination.query !== ""
      || (expectedTotal !== null && page.pagination.total !== expectedTotal)) {
      return fallback("Inconsistent AI Review archive pagination");
    }
    expectedTotal ??= page.pagination.total;
    const pageRecords = [...page.reviews, ...page.legacyReviews];
    if (pageRecords.length > page.pagination.limit
      || offset + pageRecords.length > expectedTotal
      || (offset + pageRecords.length < expectedTotal && pageRecords.length !== page.pagination.limit)) {
      return fallback("Incomplete AI Review archive pagination");
    }
    for (const review of page.reviews) {
      if (review.primaryExperiment.sourceRunId !== normalizedRunId || seenAiReviewIds.has(review.aiReviewId)) {
        return fallback("Invalid AI Review archive run binding or duplicate Review ID");
      }
      seenAiReviewIds.add(review.aiReviewId);
    }
    for (const review of page.legacyReviews) {
      if (review.runId !== normalizedRunId || seenAiReviewIds.has(review.aiReviewId)) {
        return fallback("Invalid AI Review archive run binding or duplicate Review ID");
      }
      seenAiReviewIds.add(review.aiReviewId);
    }
    authoritativeAiReviewRecords.push(...page.reviews);
    legacyAiReviewRecords.push(...page.legacyReviews);
    if (offset + pageRecords.length === expectedTotal) {
      break;
    }
    offset += page.pagination.limit;
  }
  const decisionResults = await Promise.all(
    authoritativeAiReviewRecords.map((review) =>
      loadAiReviewDecisions(baseUrl, review.aiReviewId, signal, fetcher)
    )
  );
  const failedDecisionReadback = decisionResults.find((result) => result.source !== "core");
  if (failedDecisionReadback) {
    return fallback(failedDecisionReadback.error ?? "AI Review Decision archive readback failed");
  }
  return {
    runId: normalizedRunId,
    authoritativeAiReviewRecords,
    aiReviewDecisions: decisionResults.flatMap((result) => result.decisions),
    legacyAiReviewRecords,
    source: "core"
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
