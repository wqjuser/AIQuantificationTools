export interface WorkspaceResponse {
  ok: boolean;
  status?: number;
  body?: ReadableStream<Uint8Array> | null;
  json: () => Promise<unknown>;
}

export type WorkspaceFetcher = (
  url: string,
  init?: RequestInit
) => Promise<WorkspaceResponse>;

export const defaultFetcher: WorkspaceFetcher = async (url, init) => fetch(url, init);

export function resolveRequestOptions(
  signalOrFetcher: AbortSignal | WorkspaceFetcher | undefined,
  maybeFetcher: WorkspaceFetcher
): { signal?: AbortSignal; fetcher: WorkspaceFetcher } {
  return typeof signalOrFetcher === "function"
    ? { fetcher: signalOrFetcher }
    : { signal: signalOrFetcher, fetcher: maybeFetcher };
}

export function buildApiUrl(
  baseUrl: string,
  path: string,
  configure?: (url: URL) => void
): string {
  const trimmedBase = baseUrl.trim();
  const normalizedBase = trimmedBase && trimmedBase !== "/"
    ? (trimmedBase.endsWith("/") ? trimmedBase : `${trimmedBase}/`)
    : "/";
  const url = new URL(
    path.replace(/^\/+/, ""),
    normalizedBase === "/" ? "http://aiqt.local/" : normalizedBase
  );
  configure?.(url);
  return normalizedBase === "/" ? `${url.pathname}${url.search}` : url.toString();
}

export function coreErrorDetail(value: unknown): string | null {
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

export class WorkspaceHttpError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

export async function requestJson(
  url: string,
  init: RequestInit | undefined,
  fetcher: WorkspaceFetcher
): Promise<unknown> {
  const response = await fetcher(url, init);
  const payload = await response.json();
  if (!response.ok) {
    throw new WorkspaceHttpError(
      coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`,
      response.status
    );
  }
  return payload;
}
