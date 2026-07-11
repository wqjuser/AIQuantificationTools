import { describe, expect, test, vi } from "vitest";
import {
  buildStage5SandboxReadinessDecisionsUrl,
  buildStage5ShadowSessionsUrl,
  buildStage5ShadowState,
  isStage5SandboxReadinessDecision,
  isStage5ShadowSession,
  loadStage5SandboxReadinessDecisions,
  loadStage5ShadowSessions,
  runStage5SandboxReadinessDecision,
  runStage5ShadowSession,
  type Stage5SandboxReadinessDecision,
  type Stage5ShadowSession
} from "./stage5-shadow";
import type { Stage4PortfolioWorkflow } from "./portfolio-stage4";

const workflow = { baseRunId: "run-a", workflowId: "workflow-1", workflowHash: "a".repeat(64) } as Stage4PortfolioWorkflow;

function session(overrides: Partial<Stage5ShadowSession> = {}): Stage5ShadowSession {
  return {
    kind: "aiqt.stage5ShadowExecutionSession", schemaVersion: 1,
    sessionId: "session-1", sessionKey: "b".repeat(64), generatedAt: "2026-07-11T12:00:00+00:00",
    baseRunId: "run-a", workflowId: "workflow-1", workflowHash: "a".repeat(64),
    adapter: { id: "local-fake-shadow", environment: "isolated-local", mode: "shadow" },
    attempt: 1, failureMode: "none", status: "reconciled",
    limits: { maxOrders: 1, maxGrossNotional: 90_000, timeoutSeconds: 3, maxAttempts: 2 },
    killSwitch: { enabled: true, triggered: false },
    orders: [{
      orderId: "order-1", clientOrderId: `shadow-${"c".repeat(24)}`, symbol: "600000", side: "buy",
      quantity: 10, notionalValue: 1000, state: "shadow_acknowledged", reason: "shadow_projection_only",
      transitions: [{ state: "projected", at: "2026-07-11T12:00:00+00:00" }]
    }],
    reconciliation: { reconciled: true, reason: "shadow_projection_matches_stage4", stage4OrderCount: 1, shadowOrderCount: 1, grossNotional: 1000 },
    paperOnly: true, shadowOnly: true, liveTradingAllowed: false, orderSubmissionEnabled: false,
    routeExecuted: false, liveBlockedBoundary: true, sessionHash: "d".repeat(64), ...overrides
  };
}

function decision(overrides: Partial<Stage5SandboxReadinessDecision> = {}): Stage5SandboxReadinessDecision {
  return {
    kind: "aiqt.stage5SandboxReadinessDecision", schemaVersion: 1,
    decisionId: "stage5-sandbox-readiness-123456789012345678901234", decisionHash: "e".repeat(64),
    generatedAt: "2026-07-11T13:00:00+00:00", baseRunId: "run-a", workflowId: "workflow-1",
    workflowHash: "a".repeat(64), shadowSessionId: "session-1", shadowSessionHash: "d".repeat(64),
    adapterId: "ashare-live", market: "ashare", adapterPaperExecutionIds: ["execution-1"],
    adapterManifestValidationIds: ["manifest-1"], adapterAuditEventIds: ["execution-1"],
    operator: "local-operator", status: "ready_for_manually_authorized_sandbox_phase",
    paperOnly: true, shadowOnly: true, sandboxOrderSubmissionAllowed: false, liveTradingAllowed: false,
    orderSubmissionEnabled: false, routeExecuted: false, liveBlockedBoundary: true, ...overrides
  };
}

describe("Stage 5 shadow client", () => {
  test("builds URLs and derives the one operator action", () => {
    expect(buildStage5ShadowSessionsUrl("http://localhost:8765", "run a", 5)).toBe(
      "http://localhost:8765/api/execution/shadow-sessions?baseRunId=run+a&limit=5"
    );
    expect(buildStage5ShadowState(null, [])).toMatchObject({ status: "blocked", actionId: null });
    expect(buildStage5ShadowState(workflow, [])).toMatchObject({ status: "review", actionId: "start-stage5-shadow" });
    expect(buildStage5ShadowState(workflow, [session({ status: "recoverable_failure", reconciliation: {
      reconciled: false, reason: "shadow_timeout_retry_required", stage4OrderCount: 1, shadowOrderCount: 1, grossNotional: 1000
    } })])).toMatchObject({ status: "review", actionId: "retry-stage5-shadow" });
    expect(buildStage5ShadowState(workflow, [session()])).toMatchObject({
      status: "review", actionId: "review-stage5-sandbox-readiness"
    });
    expect(buildStage5ShadowState(workflow, [session()], [decision()])).toMatchObject({
      status: "ready", actionId: null, readinessDecision: decision()
    });
  });

  test("rejects malformed and unsafe sessions", () => {
    expect(isStage5ShadowSession(session())).toBe(true);
    expect(isStage5ShadowSession({ ...session(), routeExecuted: true })).toBe(false);
    expect(isStage5ShadowSession({ ...session(), orders: [] })).toBe(false);
    expect(isStage5ShadowSession({ ...session(), extra: true })).toBe(false);
  });

  test("validates and persists the sandbox readiness decision contract", async () => {
    expect(isStage5SandboxReadinessDecision(decision())).toBe(true);
    expect(isStage5SandboxReadinessDecision({ ...decision(), sandboxOrderSubmissionAllowed: true })).toBe(false);
    expect(buildStage5SandboxReadinessDecisionsUrl("http://localhost:8765", "run a", 5)).toBe(
      "http://localhost:8765/api/execution/sandbox-readiness-decisions?baseRunId=run+a&limit=5"
    );
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true, status: init?.method === "POST" ? 201 : 200,
      json: async () => init?.method === "POST"
        ? { sandboxReadinessDecision: decision() }
        : { sandboxReadinessDecisions: [decision()] }
    } as Response));
    const created = await runStage5SandboxReadinessDecision(
      "http://localhost:8765", workflow, session(), fetcher
    );
    const history = await loadStage5SandboxReadinessDecisions(
      "http://localhost:8765", "run-a", fetcher, 3
    );
    expect(created.decision?.decisionHash).toBe("e".repeat(64));
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({
      baseRunId: "run-a", workflowHash: "a".repeat(64), sessionHash: "d".repeat(64),
      operator: "local-operator", confirmed: true
    });
    expect(history.decisions).toHaveLength(1);
  });

  test("posts the server-authoritative request and loads persisted history", async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true, status: init?.method === "POST" ? 201 : 200,
      json: async () => init?.method === "POST" ? { shadowSession: session() } : { shadowSessions: [session()] }
    } as Response));
    const result = await runStage5ShadowSession("http://localhost:8765", workflow, "none", fetcher);
    const history = await loadStage5ShadowSessions("http://localhost:8765", "run-a", fetcher, 3);
    expect(result.source).toBe("core");
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({
      baseRunId: "run-a", workflowHash: "a".repeat(64), failureMode: "none", operator: "local-operator"
    });
    expect(history.sessions).toHaveLength(1);
  });
});
