import type { ResearchRunExportBrowserPackage } from "../audit/report-contracts";
import { sha256TextHex } from "../research/readiness-builders";
import { isStage5SandboxAuthorizationPreflight, isStage5SandboxAuthorizationReview, isStage5SandboxReadinessDecision, isStage5ShadowSession } from "../../stage5-shadow";
import type { Stage5SandboxAuthorizationPreflight, Stage5SandboxAuthorizationReview, Stage5SandboxReadinessDecision } from "../../stage5-shadow";

export function stage4PortfolioWorkflowAuditSnapshots(
  auditEvents: ResearchRunExportBrowserPackage["auditEvents"]
): Record<string, unknown>[] {
  return (auditEvents ?? []).flatMap((event) => {
    const snapshot = event.metadata.snapshot;
    return event.eventType === "stage4_portfolio_workflow"
      && snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
      ? [snapshot as Record<string, unknown>]
      : [];
  });
}

export function stage5ShadowSessionAuditSnapshots(
  auditEvents: ResearchRunExportBrowserPackage["auditEvents"]
) {
  return (auditEvents ?? []).flatMap((event) => {
    const snapshot = event.metadata.snapshot;
    return event.eventType === "stage5_shadow_execution_session" && isStage5ShadowSession(snapshot)
      && event.eventId === snapshot.sessionId && event.runId === snapshot.baseRunId
      && event.createdAt === snapshot.generatedAt && event.stage === "stage5-shadow-execution"
      ? [snapshot]
      : [];
  });
}

export function stage5SandboxReadinessDecisionAuditSnapshots(
  auditEvents: ResearchRunExportBrowserPackage["auditEvents"]
) {
  return (auditEvents ?? []).flatMap((event) => {
    const snapshot = event.metadata.snapshot;
    return event.eventType === "stage5_sandbox_readiness_decision" && isStage5SandboxReadinessDecision(snapshot)
      && event.eventId === snapshot.decisionId && event.runId === snapshot.baseRunId
      && event.createdAt === snapshot.generatedAt && event.stage === "stage5-sandbox-readiness"
      && event.source === snapshot.operator
      ? [snapshot]
      : [];
  });
}

export function stage5SandboxAuthorizationPreflightAuditSnapshots(
  auditEvents: ResearchRunExportBrowserPackage["auditEvents"]
) {
  return (auditEvents ?? []).flatMap((event) => {
    const snapshot = event.metadata.snapshot;
    return event.eventType === "stage5_sandbox_authorization_preflight" &&
      isStage5SandboxAuthorizationPreflight(snapshot) && event.eventId === snapshot.preflightId &&
      event.runId === snapshot.baseRunId && event.createdAt === snapshot.generatedAt &&
      event.stage === "stage5-sandbox-authorization-preflight" && event.source === snapshot.operator
      ? [snapshot]
      : [];
  });
}

export function stage5SandboxAuthorizationReviewAuditSnapshots(
  auditEvents: ResearchRunExportBrowserPackage["auditEvents"]
) {
  return (auditEvents ?? []).flatMap((event) => {
    const snapshot = event.metadata.snapshot;
    return event.eventType === "stage5_sandbox_authorization_review" &&
      isStage5SandboxAuthorizationReview(snapshot) && event.eventId === snapshot.reviewId &&
      event.runId === snapshot.baseRunId && event.createdAt === snapshot.generatedAt &&
      event.stage === "stage5-sandbox-authorization-review" && event.source === snapshot.reviewer
      ? [snapshot]
      : [];
  });
}

export const stage5SandboxReadinessHashVerifiedPackages = new WeakSet<object>();

export async function stage5SandboxReadinessDecisionHash(
  decision: Stage5SandboxReadinessDecision
): Promise<string> {
  const { decisionHash: _decisionHash, ...payload } = decision;
  return sha256TextHex(pythonAsciiCanonicalJson(payload));
}

export async function stage5SandboxAuthorizationPreflightHash(
  preflight: Stage5SandboxAuthorizationPreflight
): Promise<string> {
  const { preflightHash: _preflightHash, ...payload } = preflight;
  return sha256TextHex(pythonAsciiCanonicalJson(payload));
}

export async function stage5SandboxAuthorizationReviewHash(
  review: Stage5SandboxAuthorizationReview
): Promise<string> {
  const { reviewHash: _reviewHash, ...payload } = review;
  return sha256TextHex(pythonAsciiCanonicalJson(payload));
}

export function pythonAsciiCanonicalJson(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    return pythonAsciiJsonString(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(pythonAsciiCanonicalJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) =>
      `${pythonAsciiJsonString(key)}:${pythonAsciiCanonicalJson(record[key])}`
    ).join(",")}}`;
  }
  throw new TypeError("Stage 5 sandbox readiness decision contains an unsupported value");
}

export function pythonAsciiJsonString(value: string): string {
  return JSON.stringify(value).replace(/[^\x00-\x7f]/g, (character) =>
    `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`
  );
}

export async function verifyStage5SandboxReadinessDecisionHashes(
  exportPackage: ResearchRunExportBrowserPackage
): Promise<boolean> {
  const decisions = stage5SandboxReadinessDecisionAuditSnapshots(exportPackage.auditEvents);
  const preflights = stage5SandboxAuthorizationPreflightAuditSnapshots(exportPackage.auditEvents);
  const reviews = stage5SandboxAuthorizationReviewAuditSnapshots(exportPackage.auditEvents);
  const eventCount = (exportPackage.auditEvents ?? [])
    .filter((event) => event.eventType === "stage5_sandbox_readiness_decision").length;
  const preflightEventCount = (exportPackage.auditEvents ?? [])
    .filter((event) => event.eventType === "stage5_sandbox_authorization_preflight").length;
  const reviewEventCount = (exportPackage.auditEvents ?? [])
    .filter((event) => event.eventType === "stage5_sandbox_authorization_review").length;
  const valid = decisions.length === eventCount && preflights.length === preflightEventCount &&
    reviews.length === reviewEventCount && (
    await Promise.all([
      ...decisions.map(async (decision) =>
        (await stage5SandboxReadinessDecisionHash(decision)) === decision.decisionHash
      ),
      ...preflights.map(async (preflight) =>
        (await stage5SandboxAuthorizationPreflightHash(preflight)) === preflight.preflightHash
      ),
      ...reviews.map(async (review) =>
        (await stage5SandboxAuthorizationReviewHash(review)) === review.reviewHash
      )
    ])
  ).every(Boolean);
  if (valid) stage5SandboxReadinessHashVerifiedPackages.add(exportPackage);
  else stage5SandboxReadinessHashVerifiedPackages.delete(exportPackage);
  return valid;
}

export function stage4PortfolioWorkflowAuditEventsAreValid(
  auditEvents: ResearchRunExportBrowserPackage["auditEvents"]
): boolean {
  return (auditEvents ?? [])
    .filter((event) => event.eventType === "stage4_portfolio_workflow")
    .every((event) => {
      const snapshot = event.metadata.snapshot;
      if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
        return false;
      }
      const value = snapshot as Record<string, unknown>;
      const batch = stage4ArchiveRecord(value.batch);
      const stateHistory = stage4ArchiveRecord(value.stateHistory);
      const replay = stage4ArchiveRecord(value.replay);
      const orders = stage4ArchiveRows(batch?.orders);
      const approvals = stage4ArchiveRows(value.approvals);
      const simulations = stage4ArchiveRows(value.simulations);
      const stateOrders = stage4ArchiveRows(stateHistory?.orders);
      const replayOrders = stage4ArchiveRows(replay?.orders);
      const orderIds = stage4ArchiveIds(orders, "orderId");
      const batchId = batch?.batchId;
      const baseRunId = value.baseRunId;
      return event.eventId === value.workflowId
        && event.runId === baseRunId
        && event.createdAt === value.generatedAt
        && event.stage === "stage4-portfolio-workflow"
        && stage4ArchiveHasExactWorkflowKeys(value)
        && value.kind === "aiqt.stage4PortfolioWorkflow"
        && value.schemaVersion === 1
        && typeof value.workflowHash === "string"
        && /^[0-9a-f]{64}$/.test(value.workflowHash)
        && typeof baseRunId === "string" && baseRunId.length > 0
        && stage4ArchiveRecord(value.portfolioRequest) !== null
        && stage4ArchiveRecord(value.portfolio) !== null
        && stage4ArchiveRecord(value.riskTemplate) !== null
        && batch !== null && typeof batchId === "string" && batchId.length > 0
        && batch.baseRunId === baseRunId
        && orderIds.length > 0 && new Set(orderIds).size === orderIds.length
        && stage4ArchiveBoundRows(approvals, orderIds, baseRunId, batchId, "approvalId")
        && approvals.every((row) => row.approved === true)
        && stage4ArchiveBoundRows(simulations, orderIds, baseRunId, batchId, "simulationId")
        && simulations.every((row) => row.orderState === "filled" && row.fillStatus === "filled"
          && row.paperOnly === true && row.liveExecutionBlocked === true)
        && stateHistory !== null && stateHistory.baseRunId === baseRunId && stateHistory.batchId === batchId
        && stage4ArchiveExactIds(stateOrders, orderIds)
        && stateHistory.paperOnly === true && stateHistory.liveExecutionBlocked === true
        && replay !== null && replay.baseRunId === baseRunId
        && stage4ArchiveExactIds(replayOrders, orderIds)
        && replayOrders.every((row, index) => row.batchId === batchId
          && row.simulationId === simulations[index]?.simulationId)
        && replay.paperOnly === true && replay.liveExecutionBlocked === true
        && value.paperOnly === true
        && value.liveTradingAllowed === false
        && value.liveBlockedBoundary === true
        && value.orderSubmissionEnabled === false
        && value.routeExecuted === false;
    });
}

export const stage4ArchiveWorkflowKeys = [
  "kind", "schemaVersion", "workflowId", "generatedAt", "baseRunId", "portfolioRequest", "portfolio",
  "riskTemplate", "batch", "approvals", "simulations", "stateHistory", "replay", "paperOnly",
  "liveTradingAllowed", "orderSubmissionEnabled", "routeExecuted", "liveBlockedBoundary", "workflowHash"
] as const;

export function stage4ArchiveHasExactWorkflowKeys(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  return keys.length === stage4ArchiveWorkflowKeys.length
    && stage4ArchiveWorkflowKeys.every((key) => Object.hasOwn(value, key));
}

export function stage4ArchiveRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function stage4ArchiveRows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) && value.every((row) => stage4ArchiveRecord(row) !== null)
    ? value as Record<string, unknown>[]
    : [];
}

export function stage4ArchiveIds(rows: Record<string, unknown>[], field: string): string[] {
  return rows.flatMap((row) => typeof row[field] === "string" && row[field] ? [row[field] as string] : []);
}

export function stage4ArchiveExactIds(rows: Record<string, unknown>[], expectedIds: string[]): boolean {
  const ids = stage4ArchiveIds(rows, "orderId");
  return ids.length === expectedIds.length && ids.every((id, index) => id === expectedIds[index]);
}

export function stage4ArchiveBoundRows(
  rows: Record<string, unknown>[],
  orderIds: string[],
  baseRunId: unknown,
  batchId: unknown,
  recordIdField: string
): boolean {
  return rows.length === orderIds.length && rows.every((row, index) =>
    typeof row[recordIdField] === "string" && row[recordIdField] !== ""
    && row.orderId === orderIds[index] && row.baseRunId === baseRunId && row.batchId === batchId
  );
}

export function stage4PortfolioWorkflowEvidenceDetail(snapshot: Record<string, unknown>): string {
  const batch = snapshot.batch && typeof snapshot.batch === "object" && !Array.isArray(snapshot.batch)
    ? snapshot.batch as Record<string, unknown>
    : {};
  const orders = stage4ArchiveRows(batch.orders);
  const approvals = stage4ArchiveRows(snapshot.approvals);
  const simulations = stage4ArchiveRows(snapshot.simulations);
  const stateHistory = stage4ArchiveRecord(snapshot.stateHistory) ?? {};
  const stateOrders = stage4ArchiveRows(stateHistory.orders);
  const replay = snapshot.replay && typeof snapshot.replay === "object" && !Array.isArray(snapshot.replay)
    ? snapshot.replay as Record<string, unknown>
    : {};
  const replayOrders = stage4ArchiveRows(replay.orders);
  const safety = [
    `paperOnly=${String(snapshot.paperOnly)}`,
    `liveTradingAllowed=${String(snapshot.liveTradingAllowed)}`,
    `orderSubmissionEnabled=${String(snapshot.orderSubmissionEnabled)}`,
    `routeExecuted=${String(snapshot.routeExecuted)}`,
    `liveBlockedBoundary=${String(snapshot.liveBlockedBoundary)}`
  ];
  return [
    snapshot.workflowHash,
    `base ${String(snapshot.baseRunId ?? "")}`,
    `batch ${String(batch.batchId ?? "")}`,
    `orders ${stage4ArchiveIds(orders, "orderId").join(", ")}`,
    `approvals ${stage4ArchiveIds(approvals, "approvalId").join(", ")}`,
    `simulations ${stage4ArchiveIds(simulations, "simulationId").join(", ")}`,
    `state ${stage4ArchiveIds(stateOrders, "orderId").join(", ")}`,
    `replay ${stage4ArchiveIds(replayOrders, "orderId").join(", ")}`,
    ...safety,
    snapshot.paperOnly === true
      && snapshot.liveTradingAllowed === false
      && snapshot.liveBlockedBoundary === true
      && snapshot.orderSubmissionEnabled === false
      && snapshot.routeExecuted === false
      ? "paper-only"
      : "unsafe boundary"
  ].filter(Boolean).join(" · ");
}
