import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { stage10ConfirmationIds } from "../lib/stage10-production-execution";
import type { AutoTradingSnapshot } from "./ExecutionAutoPaperTradingSection";
import { ExecutionStage10ProductionExecutionSection } from "./ExecutionStage10ProductionExecutionSection";

describe("ExecutionStage10ProductionExecutionSection", () => {
  test("starts from the audited credential gate before auto live trading", () => {
    const html = renderToStaticMarkup(
      <ExecutionStage10ProductionExecutionSection
        baseUrl="http://127.0.0.1:8765"
        onAutoLiveAuthorized={() => undefined}
      />
    );

    expect(html).toContain("生产实盘 · 权限与急停");
    expect(html).not.toContain("阶段 10");
    expect(html).toContain("检查专用交易凭据");
    expect(html).toContain("生产权限与急停全程受控");
    expect(html).toContain("正在读取生产执行控制状态");
    expect(html).toContain("生产权限与急停状态");
    expect(html).toContain("实名操作人在本窗口显式授权或续期生产会话");
    expect(html).not.toContain("真实资金二次确认");
    expect(html).toContain('id="execution-live-trading-gate"');
    expect(html).toContain('tabindex="-1"');
    expect(stage10ConfirmationIds).toHaveLength(5);
  });

  test("keeps an active production session distinct from evidence renewal", () => {
    const html = renderToStaticMarkup(
      <ExecutionStage10ProductionExecutionSection
        autoTradingSnapshot={{
          state: {
            executionMode: "live",
            liveAuthorizedUntil: "2026-07-31T05:40:50Z",
            liveConfirmed: true,
            liveSessionTtlHours: 24,
          },
          liveTradingAllowed: true,
        } as AutoTradingSnapshot}
        baseUrl="http://127.0.0.1:8765"
        onAutoLiveAuthorized={() => undefined}
      />,
    );

    expect(html).toContain("生产会话有效至");
    expect(html).toContain("续期或重新授权前需更新权限与急停证据");
    expect(html).toContain("当前会话有效 · 续期证据读取中");
    expect(html).not.toContain("执行权限已撤销");
    expect(html).not.toContain("急停保护已生效");
  });
});
