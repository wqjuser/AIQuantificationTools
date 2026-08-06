import { describe, expect, it } from "vitest";
import { createI18n } from "../../lib/i18n";
import { translateGoldenPathDetail } from "./golden-path-formatters";

describe("translateGoldenPathDetail", () => {
  it("localizes golden-path page-header reasons in Chinese", () => {
    const i18n = createI18n("zh-CN");

    expect(
      [
        "Run the research pipeline to bind data, strategy, backtest, and AI evidence.",
        "Backtest evidence is unavailable until an audited research run exists.",
        "Paper execution requires an audited research run first.",
        "Live routing remains blocked until adapter certification, risk approval, and human confirmation pass."
      ].map((detail) => translateGoldenPathDetail(i18n, detail))
    ).toEqual([
      "运行研究流水线，以绑定行情数据、策略、回测和 AI 证据。",
      "在审计研究运行生成前，回测证据不可用。",
      "模拟执行需要先完成一次审计研究运行。",
      "在执行适配器认证、风控审批和人工确认全部通过前，实盘路由保持阻断。"
    ]);
  });

  it("localizes structured paper handoff blockers in Chinese", () => {
    const i18n = createI18n("zh-CN");

    expect(
      [
        "Paper handoff is blocked by paper_execution_data_quality_incomplete.",
        "Paper handoff is blocked by paper_execution_strategy_risk_incomplete."
      ].map((detail) => translateGoldenPathDetail(i18n, detail))
    ).toEqual([
      "模拟执行交接被阻断：行情数据质量证据不完整。",
      "模拟执行交接被阻断：策略风控参数不完整。"
    ]);
  });
});
