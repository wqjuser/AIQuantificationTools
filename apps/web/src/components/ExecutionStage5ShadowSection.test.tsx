import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { createI18n } from "../lib/i18n";
import type { Stage5SandboxReadinessDecision, Stage5ShadowSession } from "../lib/stage5-shadow";
import { ExecutionStage5ShadowSection } from "./ExecutionStage5ShadowSection";

const i18n = createI18n("zh-CN");

describe("ExecutionStage5ShadowSection", () => {
  test("shows one start action before a session and no broker action", () => {
    const html = renderToStaticMarkup(<ExecutionStage5ShadowSection
      i18n={i18n}
      onPrimaryAction={() => undefined}
      state={{ status: "review", actionId: "start-stage5-shadow", blocker: null, session: null }}
    />);
    expect(html).toContain("启动 Shadow 验证");
    expect(html).not.toContain(">连接券商</button>");
    expect(html).not.toContain(">提交订单</button>");
  });

  test("renders restored order ids and offers the single readiness action after reconciliation", () => {
    const session = {
      status: "reconciled", attempt: 2, adapter: { id: "local-fake-shadow" }, sessionHash: "a".repeat(64),
      failureMode: "timeout_once",
      limits: { maxOrders: 2, maxGrossNotional: 90000, timeoutSeconds: 3, maxAttempts: 2 },
      killSwitch: { enabled: true, triggered: false },
      reconciliation: { reconciled: true, reason: "shadow_projection_matches_stage4" },
      orders: [{ orderId: "order-1", symbol: "600000", state: "shadow_acknowledged", clientOrderId: "shadow-abc", transitions: [{ state: "projected" }, { state: "reconciled" }] }]
    } as Stage5ShadowSession;
    const html = renderToStaticMarkup(<ExecutionStage5ShadowSection
      i18n={i18n}
      onPrimaryAction={() => undefined}
      state={{ status: "review", actionId: "review-stage5-sandbox-readiness", blocker: null, session, readinessDecision: null }}
    />);
    expect(html).toContain("shadow-abc");
    expect(html).toContain("projected → reconciled");
    expect(html).toContain("timeout_once");
    expect(html).toContain("2 / 90000");
    expect(html).toContain("3s / 2");
    expect(html).toContain("true / false");
    expect(html).toContain("shadow_projection_matches_stage4");
    expect(html).toContain("生成 Sandbox 准入决策");
  });

  test("renders the persisted readiness decision without an order action", () => {
    const session = {
      status: "reconciled", attempt: 1, adapter: { id: "local-fake-shadow" }, sessionHash: "a".repeat(64),
      failureMode: "none", limits: { maxOrders: 1, maxGrossNotional: 90000, timeoutSeconds: 3, maxAttempts: 2 },
      killSwitch: { enabled: true, triggered: false },
      reconciliation: { reconciled: true, reason: "shadow_projection_matches_stage4" },
      orders: [{ orderId: "order-1", symbol: "600000", state: "shadow_acknowledged", clientOrderId: "shadow-abc", transitions: [{ state: "projected" }] }]
    } as Stage5ShadowSession;
    const readinessDecision = {
      adapterId: "ashare-live", decisionHash: "d".repeat(64), status: "ready_for_manually_authorized_sandbox_phase",
      adapterPaperExecutionIds: ["execution-1"], sandboxOrderSubmissionAllowed: false
    } as Stage5SandboxReadinessDecision;
    const html = renderToStaticMarkup(<ExecutionStage5ShadowSection
      i18n={i18n}
      onPrimaryAction={() => undefined}
      state={{ status: "ready", actionId: null, blocker: null, session, readinessDecision }}
    />);
    expect(html).toContain("ashare-live");
    expect(html).toContain("execution-1");
    expect(html).toContain("仍禁止 Sandbox 下单");
    expect(html).not.toContain("<button");
  });

  test("keeps a blocked drill read-only and explains the safety evidence", () => {
    const session = {
      status: "blocked", attempt: 1, adapter: { id: "local-fake-shadow" }, sessionHash: "b".repeat(64),
      failureMode: "kill_switch",
      limits: { maxOrders: 2, maxGrossNotional: 90000, timeoutSeconds: 3, maxAttempts: 2 },
      killSwitch: { enabled: true, triggered: true },
      reconciliation: { reconciled: false, reason: "shadow_orders_blocked" },
      orders: [{ orderId: "order-1", symbol: "600000", state: "blocked", clientOrderId: "shadow-def", transitions: [{ state: "projected" }, { state: "blocked" }] }]
    } as Stage5ShadowSession;
    const html = renderToStaticMarkup(<ExecutionStage5ShadowSection
      i18n={i18n}
      onPrimaryAction={() => undefined}
      state={{ status: "blocked", actionId: null, blocker: "shadow-session-blocked", session }}
    />);
    expect(html).toContain("kill_switch");
    expect(html).toContain("true / true");
    expect(html).toContain("shadow_orders_blocked");
    expect(html).not.toContain("<button");
  });
});
