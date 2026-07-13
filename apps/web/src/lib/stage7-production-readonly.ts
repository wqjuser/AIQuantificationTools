import { buildApiUrl, coreErrorDetail, type WorkspaceFetcher, type WorkspaceSource } from "./terminal-api";

export interface Stage7ProductionReadonlyProbe {
  kind: "aiqt.stage7ProductionReadonlyProbe";
  schemaVersion: 1;
  probeId: string;
  adapterId: "ccxt-live";
  exchangeId: "binance";
  mode: "production-readonly";
  status: "ready" | "review" | "blocked";
  generatedAt: string;
  stage6ExitHash: string;
  productionRouteReviewId: string;
  operator: string;
  eligibilityConfirmed: boolean;
  checks: Array<{ id: string; status: "passed" | "review" | "blocked" | "skipped" }>;
  credentialFlags: { keyConfigured: boolean; signingConfigured: boolean };
  marketCount: number;
  apiPermissions: {
    readingEnabled: boolean;
    spotTradingEnabled: boolean;
    marginTradingEnabled: boolean;
    futuresTradingEnabled: boolean;
    optionsTradingEnabled: boolean;
    withdrawalsEnabled: boolean;
    internalTransferEnabled: boolean;
    universalTransferEnabled: boolean;
  };
  accountSummary: { accountType: string | null; nonZeroAssetCount: number; observedAt: string | null };
  accountSyncState: string;
  accountDataAccessed: boolean;
  blockedReasons: string[];
  productionReadOnly: true;
  paperOnly: false;
  liveTradingAllowed: false;
  orderRoutingEnabled: false;
  liveOrderSubmitted: false;
  liveRouteExecuted: false;
  liveBlockedBoundary: true;
  evidenceHash: string;
}

export async function loadStage7ProductionReadonlyProbes(
  baseUrl: string,
  limit = 20,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ probes: Stage7ProductionReadonlyProbe[]; source: WorkspaceSource; error?: string }> {
  try {
    const url = buildApiUrl(baseUrl, "/api/execution/stage7/production-readonly-probes", (value) =>
      value.searchParams.set("limit", String(limit))
    );
    const response = await fetcher(url);
    const payload = await response.json();
    if (!response.ok) throw new Error(coreErrorDetail(payload) || `HTTP ${response.status}`);
    if (!record(payload) || !Array.isArray(payload.productionReadonlyProbes) ||
      !payload.productionReadonlyProbes.every(isStage7ProductionReadonlyProbe)) {
      throw new Error("Invalid Stage 7 production read-only history contract");
    }
    return { probes: payload.productionReadonlyProbes, source: "core" };
  } catch (error) {
    return { probes: [], source: "fallback", error: message(error) };
  }
}

export async function runStage7ProductionReadonlyProbe(
  baseUrl: string,
  productionRouteReviewId: string,
  eligibilityConfirmed: boolean,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<{ probe?: Stage7ProductionReadonlyProbe; source: WorkspaceSource; error?: string }> {
  try {
    const response = await fetcher(buildApiUrl(baseUrl, "/api/execution/stage7/production-readonly-probes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productionRouteReviewId, operator: "execution-workspace", eligibilityConfirmed })
    });
    const payload = await response.json();
    if (record(payload) && isStage7ProductionReadonlyProbe(payload.productionReadonlyProbe)) {
      return {
        probe: payload.productionReadonlyProbe,
        source: "core",
        ...(response.ok ? {} : { error: payload.productionReadonlyProbe.blockedReasons.join("; ") || "Stage 7 准入被阻断" })
      };
    }
    throw new Error(coreErrorDetail(payload) || `HTTP ${response.status}`);
  } catch (error) {
    return { source: "fallback", error: message(error) };
  }
}

export function isStage7ProductionReadonlyProbe(value: unknown): value is Stage7ProductionReadonlyProbe {
  if (!record(value)) return false;
  const permissions = value.apiPermissions;
  const account = value.accountSummary;
  const credentials = value.credentialFlags;
  const exactFields = [
    "kind", "schemaVersion", "probeId", "adapterId", "exchangeId", "mode", "status", "generatedAt",
    "stage6ExitHash", "productionRouteReviewId", "operator", "eligibilityConfirmed", "checks",
    "credentialFlags", "marketCount", "apiPermissions", "accountSummary", "accountSyncState",
    "accountDataAccessed", "blockedReasons", "productionReadOnly", "paperOnly", "liveTradingAllowed",
    "orderRoutingEnabled", "liveOrderSubmitted", "liveRouteExecuted", "liveBlockedBoundary", "evidenceHash"
  ];
  const boundaries = value.productionReadOnly === true && value.paperOnly === false &&
    value.liveTradingAllowed === false && value.orderRoutingEnabled === false &&
    value.liveOrderSubmitted === false && value.liveRouteExecuted === false && value.liveBlockedBoundary === true;
  const unsafePermission = record(permissions) && [
    "spotTradingEnabled", "marginTradingEnabled", "futuresTradingEnabled", "optionsTradingEnabled",
    "withdrawalsEnabled", "internalTransferEnabled", "universalTransferEnabled"
  ].some((field) => permissions[field] === true);
  const readyConsistent = value.status !== "ready" || (
    value.adapterId === "ccxt-live" && value.probeId.startsWith("stage7-production-readonly-") &&
    value.eligibilityConfirmed === true && record(credentials) && credentials.keyConfigured === true &&
    credentials.signingConfigured === true && value.marketCount > 0 && record(permissions) &&
    permissions.readingEnabled === true && !unsafePermission && value.accountDataAccessed === true &&
    value.accountSyncState === "ready" && record(account) && account.accountType === "SPOT" &&
    account.observedAt !== null && Array.isArray(value.blockedReasons) && value.blockedReasons.length === 0
  );
  return hasExactKeys(value, exactFields) && value.kind === "aiqt.stage7ProductionReadonlyProbe" && value.schemaVersion === 1 &&
    value.adapterId === "ccxt-live" && value.exchangeId === "binance" && value.mode === "production-readonly" &&
    ["ready", "review", "blocked"].includes(value.status) &&
    [value.probeId, value.productionRouteReviewId, value.operator, value.accountSyncState].every(nonempty) &&
    [value.stage6ExitHash, value.evidenceHash].every(hash) && zoned(value.generatedAt) &&
    typeof value.eligibilityConfirmed === "boolean" && Number.isInteger(value.marketCount) && value.marketCount >= 0 &&
    Array.isArray(value.checks) && value.checks.length > 0 && value.checks.every((row) =>
      record(row) && hasExactKeys(row, ["id", "status"]) && nonempty(row.id) &&
      ["passed", "review", "blocked", "skipped"].includes(row.status)
    ) && record(credentials) && hasExactKeys(credentials, ["keyConfigured", "signingConfigured"]) &&
    Object.values(credentials).every((flag) => typeof flag === "boolean") && record(permissions) &&
    hasExactKeys(permissions, ["readingEnabled", "spotTradingEnabled", "marginTradingEnabled",
      "futuresTradingEnabled", "optionsTradingEnabled", "withdrawalsEnabled",
      "internalTransferEnabled", "universalTransferEnabled"]) &&
    Object.values(permissions).every((flag) => typeof flag === "boolean") &&
    record(account) && hasExactKeys(account, ["accountType", "nonZeroAssetCount", "observedAt"]) &&
    (account.accountType === null || nonempty(account.accountType)) &&
    Number.isInteger(account.nonZeroAssetCount) && account.nonZeroAssetCount >= 0 &&
    (account.observedAt === null || zoned(account.observedAt)) && Array.isArray(value.blockedReasons) &&
    value.blockedReasons.every(nonempty) && typeof value.accountDataAccessed === "boolean" && boundaries && readyConsistent;
}

function record(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function hasExactKeys(value: Record<string, any>, fields: string[]): boolean {
  return Object.keys(value).length === fields.length && fields.every((field) => Object.hasOwn(value, field));
}
function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function hash(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}
function zoned(value: unknown): value is string {
  return nonempty(value) && !Number.isNaN(Date.parse(value)) && /(Z|[+-]\d{2}:\d{2})$/.test(value);
}
function message(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown Stage 7 production read-only error";
}
