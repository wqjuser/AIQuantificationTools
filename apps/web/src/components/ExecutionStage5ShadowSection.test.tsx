import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { createI18n } from "../lib/i18n";
import type { Stage5ShadowSession } from "../lib/stage5-shadow";
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

  test("renders restored order ids and removes actions after reconciliation", () => {
    const session = {
      status: "reconciled", attempt: 2, adapter: { id: "local-fake-shadow" }, sessionHash: "a".repeat(64),
      orders: [{ orderId: "order-1", symbol: "600000", state: "shadow_acknowledged", clientOrderId: "shadow-abc", transitions: [{ state: "projected" }, { state: "reconciled" }] }]
    } as Stage5ShadowSession;
    const html = renderToStaticMarkup(<ExecutionStage5ShadowSection
      i18n={i18n}
      onPrimaryAction={() => undefined}
      state={{ status: "ready", actionId: null, blocker: null, session }}
    />);
    expect(html).toContain("shadow-abc");
    expect(html).toContain("projected → reconciled");
    expect(html).not.toContain("<button");
  });
});
