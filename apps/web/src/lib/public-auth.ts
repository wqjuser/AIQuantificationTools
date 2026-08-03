export type PublicAuthSession =
  | { authenticated: false }
  | {
      authenticated: true;
      ownerId: string;
      email: string;
      csrfToken: string;
      reauthenticationRequired: boolean;
    };

export type DeploymentSession = PublicAuthSession | { deploymentMode: "local" };

let activeSession: Extract<PublicAuthSession, { authenticated: true }> | null = null;
let fetchInstalled = false;

export function parseAuthSession(value: unknown): PublicAuthSession {
  if (!value || typeof value !== "object") throw new Error("invalid_auth_session");
  const record = value as Record<string, unknown>;
  if (record.authenticated === false) return { authenticated: false };
  if (
    record.authenticated !== true
    || typeof record.ownerId !== "string"
    || typeof record.email !== "string"
    || typeof record.csrfToken !== "string"
    || typeof record.reauthenticationRequired !== "boolean"
  ) throw new Error("invalid_auth_session");
  return {
    authenticated: true,
    ownerId: record.ownerId,
    email: record.email,
    csrfToken: record.csrfToken,
    reauthenticationRequired: record.reauthenticationRequired,
  };
}

export function parseDeploymentSession(value: unknown): DeploymentSession {
  if (
    value
    && typeof value === "object"
    && (value as Record<string, unknown>).deploymentMode === "local"
  ) return { deploymentMode: "local" };
  return parseAuthSession(value);
}

export function bindPublicSession(session: PublicAuthSession): void {
  activeSession = session.authenticated ? session : null;
}

export function authenticatedActor(): string {
  return activeSession?.email ?? "quant.user";
}

export function hasPublicSession(): boolean {
  return activeSession !== null;
}

export function prepareAuthenticatedRequest(
  input: RequestInfo | URL,
  init: RequestInit = {},
  origin = globalThis.location?.origin ?? "http://aiqt.local",
): { input: RequestInfo | URL; init: RequestInit } {
  const url = new URL(input instanceof Request ? input.url : String(input), origin);
  const method = (init.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  if (!activeSession || url.origin !== origin || !url.pathname.startsWith("/api/")) {
    return { input, init };
  }
  const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined));
  let body = init.body;
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    headers.set("X-AIQT-CSRF", activeSession.csrfToken);
    if (typeof body === "string" && headers.get("Content-Type")?.split(";", 1)[0] === "application/json") {
      try {
        const payload = JSON.parse(body) as unknown;
        if (payload && typeof payload === "object" && !Array.isArray(payload)) {
          const record = payload as Record<string, unknown>;
          for (const field of ["operator", "reviewer", "author", "approvedBy", "liveOperator"]) {
            if (field in record) record[field] = activeSession.email;
          }
          body = JSON.stringify(record);
        }
      } catch {
        // The server remains authoritative and will reject malformed JSON.
      }
    }
  }
  return { input, init: { ...init, body, credentials: "same-origin", headers } };
}

export function installAuthenticatedFetch(): void {
  if (fetchInstalled || typeof window === "undefined") return;
  fetchInstalled = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const request = prepareAuthenticatedRequest(input, init);
    const response = await nativeFetch(request.input, request.init);
    if (response.status === 401 && !new URL(input instanceof Request ? input.url : String(input), location.origin).pathname.startsWith("/api/auth/")) {
      window.dispatchEvent(new Event("aiqt:authentication-required"));
    } else if (response.status === 428) {
      const returnTo = `${location.pathname}${location.search}${location.hash}`;
      location.assign(`/api/auth/reauthenticate?returnTo=${encodeURIComponent(returnTo)}`);
    }
    return response;
  };
}

export async function logoutPublicSession(): Promise<void> {
  if (!activeSession) return;
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (response.ok) {
    bindPublicSession({ authenticated: false });
    location.assign("/");
  }
}
