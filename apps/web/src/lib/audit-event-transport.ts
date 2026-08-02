import {
  isAuditEventRecord,
  isCoreErrorPayload,
  isPlainRecord,
  type AuditEventRecord
} from "./terminal-api-contract";
import {
  buildApiUrl,
  defaultFetcher,
  type WorkspaceFetcher
} from "./terminal-api-http";

type WorkspaceSource = "core" | "fallback";

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

function isAuditEventPayload(value: unknown): value is { event: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { event?: unknown };
  return isAuditEventRecord(payload.event);
}

export function isAuditReportSignaturePayload(value: unknown): value is {
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
