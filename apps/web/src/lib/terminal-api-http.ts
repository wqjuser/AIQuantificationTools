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
