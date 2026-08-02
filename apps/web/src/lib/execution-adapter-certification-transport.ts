import type { Market } from "./terminal-workbench";
import {
  buildApiUrl,
  coreErrorDetail,
  defaultFetcher,
  type WorkspaceFetcher
} from "./terminal-api-http";
import {
  isAuditEventRecord,
  isMarket,
  isNumberRecord,
  isSecretFreeRecord,
  type AuditEventRecord
} from "./terminal-api-contract";

type WorkspaceSource = "core" | "fallback";

export type ExecutionAdapterCertificationStatus = "passed" | "blocked" | "failed" | "review";

export interface ExecutionAdapterCertificationCheck {
  id: string;
  label: string;
  status: ExecutionAdapterCertificationStatus;
  detail: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterCertificationSummary {
  checkCount: number;
  checkStatusCounts: Record<string, number>;
  passedChecks: number;
  blockedChecks: number;
  failedChecks: number;
  reviewChecks: number;
}

export interface ExecutionAdapterCertificationRun {
  schemaVersion: 1;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterCertificationStatus;
  operator: string;
  startedAt: string;
  completedAt: string | null;
  checks: ExecutionAdapterCertificationCheck[];
  metadata: Record<string, unknown>;
  summary: ExecutionAdapterCertificationSummary;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterCertificationRequest {
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  operator?: string;
  startedAt?: string;
  completedAt?: string;
  checks: ExecutionAdapterCertificationCheck[];
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterCertificationRecordResult {
  adapterCertification?: ExecutionAdapterCertificationRun;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterCertificationHistoryResult {
  adapterCertifications: ExecutionAdapterCertificationRun[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterCertificationApplyStatus = "blocked" | "ready_for_restart";
export type ExecutionAdapterCertificationApplyConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterCertificationApplyConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterCertificationApplyConfirmationStatus;
}

export interface ExecutionAdapterCertificationApplyResult {
  schemaVersion: 1;
  applyId: string;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterCertificationApplyStatus;
  operator: string;
  generatedAt: string;
  applyMode: string;
  restartRequired: boolean;
  requiredConfirmations: ExecutionAdapterCertificationApplyConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterCertificationApplyRequest {
  certificationId: string;
  operator?: string;
  confirmations?: {
    secretReferenceStored?: boolean;
    controlledRestartWindowApproved?: boolean;
    operatorReviewedCertification?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterCertificationApplyRecordResult {
  certificationApply?: ExecutionAdapterCertificationApplyResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterCertificationApplyHistoryResult {
  certificationApplies: ExecutionAdapterCertificationApplyResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterControlledRestartEvidenceStatus = "blocked" | "evidence_recorded";
export type ExecutionAdapterControlledRestartEvidenceConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterControlledRestartEvidenceConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterControlledRestartEvidenceConfirmationStatus;
}

export interface ExecutionAdapterControlledRestartEvidenceResult {
  schemaVersion: 1;
  evidenceId: string;
  applyId: string;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterControlledRestartEvidenceStatus;
  operator: string;
  recordedAt: string;
  evidenceMode: string;
  restartRequired: boolean;
  requiredConfirmations: ExecutionAdapterControlledRestartEvidenceConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterControlledRestartEvidenceRequest {
  applyId: string;
  operator?: string;
  confirmations?: {
    restartWindowExecuted?: boolean;
    rollbackPlanConfirmed?: boolean;
    postRestartValidationPassed?: boolean;
    operatorReviewedRestartLogs?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterControlledRestartEvidenceRecordResult {
  controlledRestartEvidence?: ExecutionAdapterControlledRestartEvidenceResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterControlledRestartEvidenceHistoryResult {
  controlledRestartEvidence: ExecutionAdapterControlledRestartEvidenceResult[];
  source: WorkspaceSource;
  error?: string;
}

export type ExecutionAdapterRestartAcceptanceStatus = "blocked" | "acceptance_recorded";
export type ExecutionAdapterRestartAcceptanceConfirmationStatus = "confirmed" | "missing";

export interface ExecutionAdapterRestartAcceptanceConfirmation {
  id: string;
  label: string;
  status: ExecutionAdapterRestartAcceptanceConfirmationStatus;
}

export interface ExecutionAdapterRestartAcceptanceResult {
  schemaVersion: 1;
  acceptanceId: string;
  evidenceId: string;
  applyId: string;
  certificationId: string;
  adapterId: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: ExecutionAdapterRestartAcceptanceStatus;
  operator: string;
  recordedAt: string;
  acceptanceMode: string;
  restartRequired: boolean;
  requiredConfirmations: ExecutionAdapterRestartAcceptanceConfirmation[];
  blockedReasons: string[];
  metadata: Record<string, unknown>;
  liveTradingAllowed: boolean;
  paperOnly: boolean;
}

export interface ExecutionAdapterRestartAcceptanceRequest {
  evidenceId: string;
  operator?: string;
  confirmations?: {
    coreHealthChecked?: boolean;
    settingsReloadObserved?: boolean;
    paperRouteHandshakePassed?: boolean;
    emergencyStopArmed?: boolean;
    accountSyncDryRunPassed?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface ExecutionAdapterRestartAcceptanceRecordResult {
  restartAcceptance?: ExecutionAdapterRestartAcceptanceResult;
  auditEvent?: AuditEventRecord;
  source: WorkspaceSource;
  error?: string;
}

export interface ExecutionAdapterRestartAcceptanceHistoryResult {
  restartAcceptances: ExecutionAdapterRestartAcceptanceResult[];
  source: WorkspaceSource;
  error?: string;
}

export function buildExecutionAdapterCertificationsUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-certifications", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterCertificationApplyUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-certifications/apply");
}

export function buildExecutionAdapterControlledRestartEvidenceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-certifications/restart-evidence");
}

export function buildExecutionAdapterRestartAcceptanceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-certifications/restart-acceptance");
}

export function buildExecutionAdapterCertificationAppliesUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-certifications/applies", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterControlledRestartEvidenceHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-certifications/restart-evidence", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export function buildExecutionAdapterRestartAcceptanceHistoryUrl(
  baseUrl: string,
  params: { adapterId?: string; limit?: number } = {}
): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-certifications/restart-acceptance", (url) => {
    if (params.adapterId?.trim()) {
      url.searchParams.set("adapterId", params.adapterId.trim());
    }
    if (params.limit !== undefined) {
      url.searchParams.set("limit", String(Math.max(1, Math.min(params.limit, 50))));
    }
  });
}

export async function recordExecutionAdapterCertification(
  baseUrl: string,
  request: ExecutionAdapterCertificationRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterCertificationRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterCertificationsUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adapterId: request.adapterId,
        market: request.market,
        route: request.route,
        operator: request.operator ?? "local-operator",
        startedAt: request.startedAt,
        completedAt: request.completedAt,
        checks: request.checks,
        metadata: request.metadata ?? {}
      })
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
    if (!isExecutionAdapterCertificationRecordPayload(payload)) {
      throw new Error("Invalid execution adapter certification record contract");
    }
    return {
      adapterCertification: payload.adapterCertification,
      auditEvent: payload.auditEvent,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter certification record error"
    };
  }
}

export async function recordExecutionAdapterCertificationApply(
  baseUrl: string,
  request: ExecutionAdapterCertificationApplyRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterCertificationApplyRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterCertificationApplyUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        certificationId: request.certificationId,
        operator: request.operator ?? "local-operator",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterCertificationApplyRecordPayload(payload)) {
      return {
        certificationApply: payload.certificationApply,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
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
    throw new Error("Invalid execution adapter certification apply contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter certification apply error"
    };
  }
}

export async function recordExecutionAdapterControlledRestartEvidence(
  baseUrl: string,
  request: ExecutionAdapterControlledRestartEvidenceRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterControlledRestartEvidenceRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterControlledRestartEvidenceUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applyId: request.applyId,
        operator: request.operator ?? "local-operator",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterControlledRestartEvidenceRecordPayload(payload)) {
      return {
        controlledRestartEvidence: payload.controlledRestartEvidence,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
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
    throw new Error("Invalid execution adapter controlled restart evidence contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter controlled restart evidence error"
    };
  }
}

export async function recordExecutionAdapterRestartAcceptance(
  baseUrl: string,
  request: ExecutionAdapterRestartAcceptanceRequest,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterRestartAcceptanceRecordResult> {
  try {
    const response = await fetcher(buildExecutionAdapterRestartAcceptanceUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evidenceId: request.evidenceId,
        operator: request.operator ?? "local-operator",
        confirmations: request.confirmations ?? {},
        metadata: request.metadata ?? {}
      })
    });
    const payload = await response.json();
    if (isExecutionAdapterRestartAcceptanceRecordPayload(payload)) {
      return {
        restartAcceptance: payload.restartAcceptance,
        auditEvent: payload.auditEvent,
        source: "core"
      };
    }
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
    throw new Error("Invalid execution adapter restart acceptance contract");
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter restart acceptance error"
    };
  }
}

export async function loadExecutionAdapterCertifications(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterCertificationHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterCertificationsUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterCertificationHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter certification history contract");
    }
    return {
      adapterCertifications: payload.adapterCertifications,
      source: "core"
    };
  } catch (error) {
    return {
      adapterCertifications: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter certification history error"
    };
  }
}

export async function loadExecutionAdapterCertificationApplies(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterCertificationApplyHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterCertificationAppliesUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterCertificationApplyHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter certification apply history contract");
    }
    return {
      certificationApplies: payload.certificationApplies,
      source: "core"
    };
  } catch (error) {
    return {
      certificationApplies: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter certification apply history error"
    };
  }
}

export async function loadExecutionAdapterControlledRestartEvidence(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterControlledRestartEvidenceHistoryResult> {
  try {
    const response = await fetcher(
      buildExecutionAdapterControlledRestartEvidenceHistoryUrl(baseUrl, { adapterId, limit })
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterControlledRestartEvidenceHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter controlled restart evidence history contract");
    }
    return {
      controlledRestartEvidence: payload.controlledRestartEvidence,
      source: "core"
    };
  } catch (error) {
    return {
      controlledRestartEvidence: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter controlled restart evidence history error"
    };
  }
}

export async function loadExecutionAdapterRestartAcceptances(
  baseUrl: string,
  adapterId: string,
  fetcher: WorkspaceFetcher = defaultFetcher,
  limit = 20
): Promise<ExecutionAdapterRestartAcceptanceHistoryResult> {
  try {
    const response = await fetcher(buildExecutionAdapterRestartAcceptanceHistoryUrl(baseUrl, { adapterId, limit }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterRestartAcceptanceHistoryPayload(payload)) {
      throw new Error("Invalid execution adapter restart acceptance history contract");
    }
    return {
      restartAcceptances: payload.restartAcceptances,
      source: "core"
    };
  } catch (error) {
    return {
      restartAcceptances: [],
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter restart acceptance history error"
    };
  }
}

function isExecutionAdapterCertificationRecordPayload(
  value: unknown
): value is { adapterCertification: ExecutionAdapterCertificationRun; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterCertification?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterCertificationRun(payload.adapterCertification) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterCertificationApplyRecordPayload(
  value: unknown
): value is { certificationApply: ExecutionAdapterCertificationApplyResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { certificationApply?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterCertificationApplyResult(payload.certificationApply) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterControlledRestartEvidenceRecordPayload(
  value: unknown
): value is { controlledRestartEvidence: ExecutionAdapterControlledRestartEvidenceResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { controlledRestartEvidence?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterControlledRestartEvidenceResult(payload.controlledRestartEvidence) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterRestartAcceptanceRecordPayload(
  value: unknown
): value is { restartAcceptance: ExecutionAdapterRestartAcceptanceResult; auditEvent?: AuditEventRecord } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { restartAcceptance?: unknown; auditEvent?: unknown };
  return (
    isExecutionAdapterRestartAcceptanceResult(payload.restartAcceptance) &&
    (payload.auditEvent === undefined || isAuditEventRecord(payload.auditEvent))
  );
}

function isExecutionAdapterCertificationHistoryPayload(
  value: unknown
): value is { adapterCertifications: ExecutionAdapterCertificationRun[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterCertifications?: unknown };
  return (
    Array.isArray(payload.adapterCertifications) &&
    payload.adapterCertifications.every(isExecutionAdapterCertificationRun)
  );
}

function isExecutionAdapterCertificationApplyHistoryPayload(
  value: unknown
): value is { certificationApplies: ExecutionAdapterCertificationApplyResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { certificationApplies?: unknown };
  return (
    Array.isArray(payload.certificationApplies) &&
    payload.certificationApplies.every(isExecutionAdapterCertificationApplyResult)
  );
}

function isExecutionAdapterControlledRestartEvidenceHistoryPayload(
  value: unknown
): value is { controlledRestartEvidence: ExecutionAdapterControlledRestartEvidenceResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { controlledRestartEvidence?: unknown };
  return (
    Array.isArray(payload.controlledRestartEvidence) &&
    payload.controlledRestartEvidence.every(isExecutionAdapterControlledRestartEvidenceResult)
  );
}

function isExecutionAdapterRestartAcceptanceHistoryPayload(
  value: unknown
): value is { restartAcceptances: ExecutionAdapterRestartAcceptanceResult[] } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { restartAcceptances?: unknown };
  return (
    Array.isArray(payload.restartAcceptances) &&
    payload.restartAcceptances.every(isExecutionAdapterRestartAcceptanceResult)
  );
}

function isExecutionAdapterCertificationApplyResult(value: unknown): value is ExecutionAdapterCertificationApplyResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterCertificationApplyResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.applyId === "string" &&
    typeof result.certificationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterCertificationApplyStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.generatedAt === "string" &&
    typeof result.applyMode === "string" &&
    typeof result.restartRequired === "boolean" &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterCertificationApplyConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterControlledRestartEvidenceResult(
  value: unknown
): value is ExecutionAdapterControlledRestartEvidenceResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterControlledRestartEvidenceResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.evidenceId === "string" &&
    typeof result.applyId === "string" &&
    typeof result.certificationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterControlledRestartEvidenceStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.evidenceMode === "string" &&
    typeof result.restartRequired === "boolean" &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterControlledRestartEvidenceConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterRestartAcceptanceResult(
  value: unknown
): value is ExecutionAdapterRestartAcceptanceResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const result = value as Partial<ExecutionAdapterRestartAcceptanceResult>;
  return (
    result.schemaVersion === 1 &&
    typeof result.acceptanceId === "string" &&
    typeof result.evidenceId === "string" &&
    typeof result.applyId === "string" &&
    typeof result.certificationId === "string" &&
    typeof result.adapterId === "string" &&
    (isMarket(result.market) || result.market === "multi") &&
    (result.route === "paper" || result.route === "live") &&
    isExecutionAdapterRestartAcceptanceStatus(result.status) &&
    typeof result.operator === "string" &&
    typeof result.recordedAt === "string" &&
    typeof result.acceptanceMode === "string" &&
    typeof result.restartRequired === "boolean" &&
    Array.isArray(result.requiredConfirmations) &&
    result.requiredConfirmations.every(isExecutionAdapterRestartAcceptanceConfirmation) &&
    Array.isArray(result.blockedReasons) &&
    result.blockedReasons.every((reason) => typeof reason === "string") &&
    isSecretFreeRecord(result.metadata) &&
    typeof result.liveTradingAllowed === "boolean" &&
    typeof result.paperOnly === "boolean"
  );
}

function isExecutionAdapterCertificationApplyConfirmation(
  value: unknown
): value is ExecutionAdapterCertificationApplyConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterCertificationApplyConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterControlledRestartEvidenceConfirmation(
  value: unknown
): value is ExecutionAdapterControlledRestartEvidenceConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterControlledRestartEvidenceConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterCertificationRun(value: unknown): value is ExecutionAdapterCertificationRun {
  if (!value || typeof value !== "object") {
    return false;
  }
  const run = value as Partial<ExecutionAdapterCertificationRun>;
  return (
    run.schemaVersion === 1 &&
    typeof run.certificationId === "string" &&
    typeof run.adapterId === "string" &&
    (isMarket(run.market) || run.market === "multi") &&
    (run.route === "paper" || run.route === "live") &&
    isExecutionAdapterCertificationStatus(run.status) &&
    typeof run.operator === "string" &&
    typeof run.startedAt === "string" &&
    (run.completedAt === null || typeof run.completedAt === "string") &&
    Array.isArray(run.checks) &&
    run.checks.every(isExecutionAdapterCertificationCheck) &&
    isSecretFreeRecord(run.metadata) &&
    isExecutionAdapterCertificationSummary(run.summary) &&
    typeof run.liveTradingAllowed === "boolean" &&
    typeof run.paperOnly === "boolean"
  );
}

function isExecutionAdapterCertificationCheck(value: unknown): value is ExecutionAdapterCertificationCheck {
  if (!value || typeof value !== "object") {
    return false;
  }
  const check = value as Partial<ExecutionAdapterCertificationCheck>;
  return (
    typeof check.id === "string" &&
    typeof check.label === "string" &&
    isExecutionAdapterCertificationStatus(check.status) &&
    typeof check.detail === "string" &&
    (check.metadata === undefined || isSecretFreeRecord(check.metadata))
  );
}

function isExecutionAdapterCertificationSummary(value: unknown): value is ExecutionAdapterCertificationSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<ExecutionAdapterCertificationSummary>;
  return (
    typeof summary.checkCount === "number" &&
    isNumberRecord(summary.checkStatusCounts) &&
    typeof summary.passedChecks === "number" &&
    typeof summary.blockedChecks === "number" &&
    typeof summary.failedChecks === "number" &&
    typeof summary.reviewChecks === "number"
  );
}

function isExecutionAdapterRestartAcceptanceConfirmation(
  value: unknown
): value is ExecutionAdapterRestartAcceptanceConfirmation {
  if (!value || typeof value !== "object") {
    return false;
  }
  const confirmation = value as Partial<ExecutionAdapterRestartAcceptanceConfirmation>;
  return (
    typeof confirmation.id === "string" &&
    typeof confirmation.label === "string" &&
    (confirmation.status === "confirmed" || confirmation.status === "missing")
  );
}

function isExecutionAdapterCertificationStatus(value: unknown): value is ExecutionAdapterCertificationStatus {
  return value === "passed" || value === "blocked" || value === "failed" || value === "review";
}

function isExecutionAdapterCertificationApplyStatus(
  value: unknown
): value is ExecutionAdapterCertificationApplyStatus {
  return value === "blocked" || value === "ready_for_restart";
}

function isExecutionAdapterControlledRestartEvidenceStatus(
  value: unknown
): value is ExecutionAdapterControlledRestartEvidenceStatus {
  return value === "blocked" || value === "evidence_recorded";
}

function isExecutionAdapterRestartAcceptanceStatus(
  value: unknown
): value is ExecutionAdapterRestartAcceptanceStatus {
  return value === "blocked" || value === "acceptance_recorded";
}
