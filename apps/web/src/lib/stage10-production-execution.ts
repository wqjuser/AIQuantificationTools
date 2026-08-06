import { buildApiUrl, coreErrorDetail, type WorkspaceFetcher } from "./terminal-api";
import type { Stage6SandboxOrder } from "./stage6-sandbox";

export const stage10ConfirmationIds = [
  "real-funds-risk-understood",
  "stage9-candidate-and-review-verified",
  "dedicated-production-trading-credential-isolated",
  "withdrawal-and-transfer-disabled",
  "production-kill-switch-required-before-live-route"
] as const;

export interface Stage10CredentialPreflight {
  kind: "aiqt.stage10ProductionTradingCredentialPreflight";
  preflightId: string;
  preflightHash: string;
  checkedAt: string;
  expiresAt: string;
  operator: string;
  status: "configured_offline" | "blocked";
  apiKeyConfigured: boolean;
  secretConfigured: boolean;
  isolatedFromReadOnly: boolean;
  isolatedFromSandbox: boolean;
  spotOnly: boolean;
  blockedReasons: string[];
  networkCallCount: 0;
  orderSubmissionEnabled: false;
  liveTradingAllowed: false;
  liveBlockedBoundary: true;
}

export interface Stage10PermissionVerification {
  kind: "aiqt.stage10ProductionTradingPermissionVerification";
  verificationId: string;
  verificationHash: string;
  preflightId: string;
  preflightHash: string;
  verifiedAt: string;
  expiresAt: string;
  operator: string;
  status: "verified" | "blocked";
  marketCount: number;
  permissionEndpointVerified: boolean;
  permissionsAuthoritative: boolean;
  permissions: {
    readingEnabled: boolean;
    spotTradingEnabled: boolean;
    marginTradingEnabled: boolean;
    futuresTradingEnabled: boolean;
    optionsTradingEnabled: boolean;
    withdrawalsEnabled: boolean;
    internalTransferEnabled: boolean;
    universalTransferEnabled: boolean;
  };
  blockedReasons: string[];
  mutationCallCount: 0;
  orderSubmissionEnabled: false;
  liveTradingAllowed: false;
  liveBlockedBoundary: true;
}

export interface Stage10ExecutionControl {
  controlId?: string;
  status: "active" | "revoked";
  triggered: boolean;
  reason: string;
  credentialPreflightId?: string;
  permissionVerificationId?: string;
  deterministicGateActive?: boolean;
  productionAuthorizationEffective: false;
  liveTradingAllowed: false;
  liveBlockedBoundary: true;
}

export interface Stage10ExecutionAuthorization {
  kind: "aiqt.stage10ProductionExecutionAuthorization";
  authorizationId: string;
  authorizationHash: string;
  authorizedAt: string;
  expiresAt: string;
  baseRunId: string;
  candidateId: string;
  admissionReviewId: string;
  orders: Stage6SandboxOrder[];
  operator: string;
  reason: string;
  confirmedScopeIds: typeof stage10ConfirmationIds;
  status: "deterministic_execution_authorized";
  deterministicAuthorizationEffective: true;
  productionAuthorizationEffective: false;
  orderSubmissionEnabled: false;
  liveTradingAllowed: false;
  liveBlockedBoundary: true;
}

export interface Stage10ExecutionAttempt {
  kind: "aiqt.stage10ProductionExecutionAttempt";
  attemptId: string;
  attemptHash: string;
  attemptedAt: string;
  baseRunId: string;
  authorizationId: string;
  operator: string;
  status: "blocked_before_network";
  blocker: "stage10_production_route_not_implemented";
  networkCallCount: 0;
  orders: Array<Stage6SandboxOrder & { state: "blocked_before_network"; attempt: 0 }>;
  orderSubmissionEnabled: false;
  liveTradingAllowed: false;
  liveBlockedBoundary: true;
}

export interface Stage10ProductionExecutionState {
  preflight: Stage10CredentialPreflight | null;
  verification: Stage10PermissionVerification | null;
  control: Stage10ExecutionControl;
  authorizations: Stage10ExecutionAuthorization[];
  attempts: Stage10ExecutionAttempt[];
}

export async function loadStage10ProductionExecutionState(
  baseUrl: string,
  baseRunId?: string,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<Stage10ProductionExecutionState> {
  const history = (path: string) => baseRunId
    ? request(buildApiUrl(baseUrl, path, (url) => url.searchParams.set("baseRunId", baseRunId)), undefined, fetcher)
    : Promise.resolve(null);
  const [preflightPayload, verificationPayload, controlPayload, authorizationPayload, attemptPayload] =
    await Promise.all([
      request(buildApiUrl(baseUrl, "/api/execution/stage10/production-trading-credential-preflights"), undefined, fetcher),
      request(buildApiUrl(baseUrl, "/api/execution/stage10/production-trading-permission-verifications"), undefined, fetcher),
      request(buildApiUrl(baseUrl, "/api/execution/stage10/production-execution-controls"), undefined, fetcher),
      history("/api/execution/stage10/production-execution-authorizations"),
      history("/api/execution/stage10/production-execution-attempts")
    ]);
  if (!record(preflightPayload) || !nullable(preflightPayload.productionTradingCredentialPreflight, isPreflight) ||
    !record(verificationPayload) || !nullable(verificationPayload.productionTradingPermissionVerification, isVerification) ||
    !record(controlPayload) || !isControl(controlPayload.productionExecutionControl) ||
    (authorizationPayload !== null && (!record(authorizationPayload) ||
      !array(authorizationPayload.productionExecutionAuthorizations, isAuthorization))) ||
    (attemptPayload !== null && (!record(attemptPayload) ||
      !array(attemptPayload.productionExecutionAttempts, isAttempt)))) {
    throw new Error("Stage 10 返回了无效的执行状态");
  }
  return {
    preflight: preflightPayload.productionTradingCredentialPreflight,
    verification: verificationPayload.productionTradingPermissionVerification,
    control: controlPayload.productionExecutionControl,
    authorizations: authorizationPayload?.productionExecutionAuthorizations ?? [],
    attempts: attemptPayload?.productionExecutionAttempts ?? []
  };
}

export async function runStage10CredentialPreflight(baseUrl: string, operator: string, fetcher?: WorkspaceFetcher) {
  return action(baseUrl, "/api/execution/stage10/production-trading-credential-preflights", { operator },
    "productionTradingCredentialPreflight", isPreflight, fetcher);
}

export async function runStage10PermissionVerification(
  baseUrl: string, preflightId: string, operator: string, fetcher?: WorkspaceFetcher
) {
  return action(baseUrl, "/api/execution/stage10/production-trading-permission-verifications",
    { preflightId, operator }, "productionTradingPermissionVerification", isVerification, fetcher);
}

export async function setStage10ExecutionControl(
  baseUrl: string,
  requestBody: {
    action: "restore" | "revoke";
    operator: string;
    reason: string;
    credentialPreflightId: string | null;
    permissionVerificationId: string | null;
  },
  fetcher?: WorkspaceFetcher
) {
  return action(baseUrl, "/api/execution/stage10/production-execution-controls", requestBody,
    "productionExecutionControl", isControl, fetcher);
}

export async function createStage10ExecutionAuthorization(
  baseUrl: string,
  candidateId: string,
  operator: string,
  reason: string,
  confirmations: Record<(typeof stage10ConfirmationIds)[number], boolean>,
  fetcher?: WorkspaceFetcher
) {
  return action(baseUrl, "/api/execution/stage10/production-execution-authorizations",
    { candidateId, operator, reason, confirmations }, "productionExecutionAuthorization", isAuthorization, fetcher);
}

export async function runStage10ExecutionAttempt(
  baseUrl: string, authorizationId: string, operator: string, fetcher?: WorkspaceFetcher
) {
  return action(baseUrl, "/api/execution/stage10/production-execution-attempts",
    { authorizationId, operator }, "productionExecutionAttempt", isAttempt, fetcher);
}

async function action<T>(
  baseUrl: string,
  path: string,
  body: object,
  field: string,
  validate: (value: unknown) => value is T,
  fetcher: WorkspaceFetcher = (url, init) => fetch(url, init)
): Promise<T> {
  const payload = await request(buildApiUrl(baseUrl, path), post(body), fetcher);
  if (!record(payload) || !validate(payload[field])) throw new Error("Stage 10 返回了无效的操作结果");
  return payload[field];
}

async function request(url: string, init: RequestInit | undefined, fetcher: WorkspaceFetcher): Promise<any> {
  const response = await fetcher(url, init);
  const payload = await response.json();
  if (!response.ok) {
    const blockers = record(payload) && Array.isArray(payload.blockers)
      ? payload.blockers.filter(nonempty).map(stage10Error).join("；") : "";
    throw new Error(blockers || coreErrorDetail(payload) || `HTTP ${response.status}`);
  }
  return payload;
}

function isPreflight(value: unknown): value is Stage10CredentialPreflight {
  return record(value) && value.kind === "aiqt.stage10ProductionTradingCredentialPreflight" &&
    nonempty(value.preflightId) && nonempty(value.preflightHash) && zoned(value.expiresAt) &&
    ["configured_offline", "blocked"].includes(value.status) && Array.isArray(value.blockedReasons) &&
    value.networkCallCount === 0 && safeBoundary(value);
}

function isVerification(value: unknown): value is Stage10PermissionVerification {
  return record(value) && value.kind === "aiqt.stage10ProductionTradingPermissionVerification" &&
    nonempty(value.verificationId) && nonempty(value.preflightId) && zoned(value.expiresAt) &&
    ["verified", "blocked"].includes(value.status) && record(value.permissions) &&
    Object.values(value.permissions).every((item) => typeof item === "boolean") &&
    Array.isArray(value.blockedReasons) && value.mutationCallCount === 0 && safeBoundary(value);
}

function isControl(value: unknown): value is Stage10ExecutionControl {
  return record(value) && ["active", "revoked"].includes(value.status) &&
    value.triggered === (value.status === "revoked") && nonempty(value.reason) &&
    value.productionAuthorizationEffective === false && value.liveTradingAllowed === false &&
    value.liveBlockedBoundary === true;
}

function isAuthorization(value: unknown): value is Stage10ExecutionAuthorization {
  return record(value) && value.kind === "aiqt.stage10ProductionExecutionAuthorization" &&
    nonempty(value.authorizationId) && nonempty(value.baseRunId) && zoned(value.expiresAt) &&
    value.status === "deterministic_execution_authorized" &&
    value.deterministicAuthorizationEffective === true &&
    Array.isArray(value.confirmedScopeIds) &&
    value.confirmedScopeIds.join("|") === stage10ConfirmationIds.join("|") &&
    array(value.orders, isOrder) && safeBoundary(value);
}

function isAttempt(value: unknown): value is Stage10ExecutionAttempt {
  return record(value) && value.kind === "aiqt.stage10ProductionExecutionAttempt" &&
    nonempty(value.attemptId) && nonempty(value.authorizationId) &&
    value.status === "blocked_before_network" && value.networkCallCount === 0 &&
    array(value.orders, isAttemptOrder) &&
    safeBoundary(value);
}

function isAttemptOrder(value: unknown): value is Stage10ExecutionAttempt["orders"][number] {
  return record(value) && value.state === "blocked_before_network" && value.attempt === 0 && isOrder(value);
}

function isOrder(value: unknown): value is Stage6SandboxOrder {
  return record(value) && nonempty(value.orderId) && nonempty(value.symbol) &&
    ["buy", "sell"].includes(value.side) && value.type === "limit" && value.timeInForce === "GTC" &&
    [value.quantity, value.price, value.notionalValue].every(positive);
}

function safeBoundary(value: Record<string, any>) {
  return value.orderSubmissionEnabled === false && value.liveTradingAllowed === false &&
    value.liveBlockedBoundary === true;
}

function stage10Error(value: string) {
  const messages: Record<string, string> = {
    stage10_production_binance_region_restricted: "服务器所在地区被 Binance 限制，无法核验生产交易权限；请使用 Binance 允许服务的服务器地区",
    stage10_production_market_access_failed: "服务器无法访问 Binance 现货市场，请检查服务器网络后重试",
    stage10_production_trading_permission_endpoint_unavailable: "当前 Binance 连接器不支持读取 API 权限限制",
    stage10_production_trading_permission_check_failed: "Binance 权限核验请求失败，请检查网络、API Key、IP 白名单和现货交易权限",
    stage10_production_execution_control_permission_verification_required: "需要五分钟内有效的交易权限核验",
    stage10_production_execution_kill_switch_triggered: "执行急停仍处于撤销状态",
    stage10_production_execution_control_evidence_stale: "执行控制绑定的权限证据已过期",
    stage10_production_execution_candidate_expired: "阶段 9 候选已过期，请重新生成",
    stage10_approved_stage9_review_required: "需要已批准的阶段 9 人工复核"
  };
  return messages[value] ?? value;
}

function post(body: object): RequestInit {
  return { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
function record(value: unknown): value is Record<string, any> { return !!value && typeof value === "object" && !Array.isArray(value); }
function nullable<T>(value: unknown, guard: (item: unknown) => item is T): value is T | null { return value === null || guard(value); }
function array<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] { return Array.isArray(value) && value.every(guard); }
function nonempty(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function zoned(value: unknown): value is string { return nonempty(value) && !Number.isNaN(Date.parse(value)); }
function positive(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && value > 0; }
