import { buildApiUrl, defaultFetcher, type WorkspaceFetcher } from "./terminal-api-http";
import { isAuditEventRecord, type AuditEventRecord } from "./terminal-api-contract";
import type { WorkspaceSource } from "./workspace-transport";

export type HandoffNoteSubjectType = "research_run" | "strategy_version" | "portfolio_order_batch" | "p0_acceptance";

export interface HandoffNote {
  schemaVersion: 1;
  noteId: string;
  subjectType: HandoffNoteSubjectType;
  subjectId: string;
  body: string;
  author: string;
  sourceWorkspace: string;
  updatedAt: string;
  auditEventId: string | null;
  paperOnly: boolean;
  liveTradingAllowed: boolean;
}

export interface HandoffNotesResult {
  handoffNotes: HandoffNote[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
  source: WorkspaceSource;
  error?: string;
}

export interface HandoffNoteSaveParams {
  subjectType: HandoffNoteSubjectType;
  subjectId: string;
  body: string;
  author?: string;
  sourceWorkspace?: string;
}

export function buildHandoffNotesUrl(baseUrl: string, subjectType: HandoffNoteSubjectType, subjectId: string, limit = 20): string {
  return buildApiUrl(baseUrl, "api/handoff-notes", (url) => {
    url.searchParams.set("subjectType", subjectType);
    url.searchParams.set("subjectId", subjectId);
    url.searchParams.set("limit", String(Math.max(1, Math.min(limit, 50))));
  });
}

export async function loadHandoffNotes(
  baseUrl: string,
  subjectType: HandoffNoteSubjectType,
  subjectId: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<HandoffNotesResult> {
  try {
    const response = await fetcher(buildHandoffNotesUrl(baseUrl, subjectType, subjectId));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isHandoffNotesPayload(payload)) {
      throw new Error("Invalid handoff notes contract");
    }
    return {
      handoffNotes: payload.handoffNotes,
      pagination: payload.pagination,
      source: "core"
    };
  } catch (error) {
    return {
      handoffNotes: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown handoff notes load error"
    };
  }
}

export async function saveHandoffNote(
  baseUrl: string,
  params: HandoffNoteSaveParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<HandoffNotesResult> {
  try {
    const response = await fetcher(buildApiUrl(baseUrl, "api/handoff-notes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectType: params.subjectType,
        subjectId: params.subjectId,
        body: params.body,
        author: params.author ?? "local-operator",
        sourceWorkspace: params.sourceWorkspace ?? "research"
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isHandoffNoteSavePayload(payload)) {
      throw new Error("Invalid handoff note save contract");
    }
    return {
      handoffNotes: [payload.handoffNote],
      pagination: { limit: 1, offset: 0, total: 1 },
      source: "core"
    };
  } catch (error) {
    return {
      handoffNotes: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown handoff note save error"
    };
  }
}

function isHandoffNotesPayload(value: unknown): value is {
  handoffNotes: HandoffNote[];
  pagination?: HandoffNotesResult["pagination"];
} {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { handoffNotes?: unknown; pagination?: unknown };
  return (
    Array.isArray(payload.handoffNotes) &&
    payload.handoffNotes.every(isHandoffNote) &&
    (payload.pagination === undefined || isHandoffNotesPagination(payload.pagination))
  );
}

function isHandoffNoteSavePayload(value: unknown): value is { handoffNote: HandoffNote; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { handoffNote?: unknown; auditEvent?: unknown };
  return isHandoffNote(payload.handoffNote) && (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent));
}

function isHandoffNotesPagination(value: unknown): value is NonNullable<HandoffNotesResult["pagination"]> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const pagination = value as NonNullable<HandoffNotesResult["pagination"]>;
  return (
    typeof pagination.limit === "number" &&
    typeof pagination.offset === "number" &&
    typeof pagination.total === "number"
  );
}

export function isHandoffNote(value: unknown): value is HandoffNote {
  if (!value || typeof value !== "object") {
    return false;
  }
  const note = value as Partial<HandoffNote>;
  return (
    note.schemaVersion === 1 &&
    typeof note.noteId === "string" &&
    isHandoffNoteSubjectType(note.subjectType) &&
    typeof note.subjectId === "string" &&
    typeof note.body === "string" &&
    typeof note.author === "string" &&
    typeof note.sourceWorkspace === "string" &&
    typeof note.updatedAt === "string" &&
    (note.auditEventId === null || typeof note.auditEventId === "string") &&
    typeof note.paperOnly === "boolean" &&
    typeof note.liveTradingAllowed === "boolean"
  );
}

function isHandoffNoteSubjectType(value: unknown): value is HandoffNoteSubjectType {
  return (
    value === "research_run" ||
    value === "strategy_version" ||
    value === "portfolio_order_batch" ||
    value === "p0_acceptance"
  );
}
