import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { ExecutionStage6SandboxSection } from "./ExecutionStage6SandboxSection";
import { ExecutionStage7ProductionReadonlySection } from "./ExecutionStage7ProductionReadonlySection";
import { executionEvidenceLabel } from "./execution-readiness-display";

describe("execution readiness sections", () => {
  test("translates execution order states", () => {
    expect(executionEvidenceLabel("submission_pending")).toBe("等待提交");
    expect(executionEvidenceLabel("partially_filled")).toBe("部分成交");
  });

  test("keeps Stage 6 and Stage 7 summaries compact and Chinese-first", () => {
    const stage6 = renderToStaticMarkup(
      <ExecutionStage6SandboxSection
        action={null}
        authorization={null}
        batch={null}
        busy={false}
        detail="阶段 4/5 权威证据链尚未批准。"
        error={null}
        exitAcceptance={null}
        killSwitch={null}
        onAction={() => undefined}
        onKillSwitch={() => undefined}
      />,
    );
    const stage7 = renderToStaticMarkup(
      <ExecutionStage7ProductionReadonlySection
        busy={false}
        continuity={null}
        continuityBusy={false}
        continuityError={null}
        error="stage7_production_readonly_probe_missing"
        onOpenSettings={() => undefined}
        onRun={() => undefined}
        onSetAccess={() => undefined}
        probe={null}
      />,
    );

    expect(stage6).toContain("阶段 6 · 测试网执行");
    expect(stage6).toContain("仅测试网 · 实盘持续阻断");
    expect(stage6).toContain("阶段 4/5 权威证据链尚未批准");
    expect(stage6).toContain("查看技术证据");
    expect(stage6).not.toContain("Sandbox Execution");
    expect(stage7).toContain("阶段 7 · 生产只读");
    expect(stage7).toContain("阶段 8 · 只读连续性");
    expect(stage7).toContain("尚未生成生产只读准入证据");
    expect(stage7).toContain("查看技术证据");
    expect(stage7).not.toContain("Production Read-only");
    expect(stage7).not.toContain("stage7_production_readonly_probe_missing");
  });
});
