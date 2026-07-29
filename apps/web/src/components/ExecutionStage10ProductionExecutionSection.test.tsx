import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { stage10ConfirmationIds } from "../lib/stage10-production-execution";
import { ExecutionStage10ProductionExecutionSection } from "./ExecutionStage10ProductionExecutionSection";

describe("ExecutionStage10ProductionExecutionSection", () => {
  test("starts from the audited credential gate before auto live trading", () => {
    const html = renderToStaticMarkup(
      <ExecutionStage10ProductionExecutionSection
        baseUrl="http://127.0.0.1:8765"
      />
    );

    expect(html).toContain("生产实盘 · 权限与急停");
    expect(html).not.toContain("阶段 10");
    expect(html).toContain("检查专用交易凭据");
    expect(html).toContain("自动实盘需显式开启");
    expect(html).toContain("真实资金二次确认");
    expect(html).toContain('id="execution-live-trading-gate"');
    expect(html).toContain('tabindex="-1"');
    expect(stage10ConfirmationIds).toHaveLength(5);
  });
});
