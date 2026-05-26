import { describe, expect, test } from "vitest";
import { createI18n, resolveInitialLocale, supportedLocales } from "./i18n";

describe("i18n", () => {
  test("defaults to Simplified Chinese unless a supported locale is stored", () => {
    expect(resolveInitialLocale()).toBe("zh-CN");
    expect(resolveInitialLocale("en-US")).toBe("en-US");
    expect(resolveInitialLocale("fr-FR")).toBe("zh-CN");
  });

  test("translates terminal chrome and known workspace labels", () => {
    const zh = createI18n("zh-CN");

    expect(zh.t("topbar.eyebrow")).toBe("专业量化工作台");
    expect(zh.quantLoopLabel("agent-review", "Agent Review")).toBe("智能体评审");
    expect(zh.moduleLabel("portfolio", "Portfolio Risk")).toBe("组合风险");
    expect(zh.agentLabel("risk", "Risk Manager")).toBe("风险经理");
    expect(zh.decisionAgent("Technical")).toBe("技术分析");
    expect(zh.metricLabel("Max DD")).toBe("最大回撤");
    expect(zh.statusLabel("Research run complete")).toBe("研究运行完成");
    expect(zh.statusLabel("Strategy edited")).toBe("策略已编辑");
    expect(zh.statusLabel("AI action generated")).toBe("AI 操作已生成");
  });

  test("provides dropdown labels for every supported locale", () => {
    const zh = createI18n("zh-CN");
    const en = createI18n("en-US");

    expect(supportedLocales.map((locale) => zh.localeOptionLabel(locale))).toEqual(["简体中文", "English"]);
    expect(supportedLocales.map((locale) => en.localeOptionLabel(locale))).toEqual([
      "Simplified Chinese",
      "English"
    ]);
  });

  test("translates chart expansion actions", () => {
    const zh = createI18n("zh-CN");
    const en = createI18n("en-US");

    expect(zh.t("chart.expand")).toBe("放大图表");
    expect(zh.t("chart.closeExpanded")).toBe("关闭放大图表");
    expect(en.t("chart.expand")).toBe("Expand chart");
    expect(en.t("chart.closeExpanded")).toBe("Close expanded chart");
  });

  test("translates module workbench panel labels", () => {
    const zh = createI18n("zh-CN");
    const en = createI18n("en-US");

    expect(zh.t("module.scanner.title")).toBe("市场扫描器");
    expect(zh.t("strategy.name")).toBe("名称");
    expect(zh.t("panel.backtest.title")).toBe("回测回放");
    expect(zh.t("backtest.assumptions")).toBe("回测假设");
    expect(zh.t("history.replay")).toBe("回放");
    expect(zh.t("history.comparison")).toBe("运行对比");
    expect(zh.t("history.changed")).toBe("已变化");
    expect(zh.t("history.unchanged")).toBe("未变化");
    expect(zh.t("portfolio.paperPositions")).toBe("模拟持仓");
    expect(zh.t("module.workflow.canvas")).toBe("节点画布");
    expect(en.t("backtest.replay")).toBe("Trade replay");
    expect(en.t("backtest.initialCash")).toBe("Initial cash");
    expect(en.t("portfolio.unrealizedPnl")).toBe("Unrealized P&L");
    expect(en.t("history.rows", { count: 240 })).toBe("240 bars");
    expect(en.t("history.comparison")).toBe("Run comparison");
    expect(en.t("module.news.pending")).toBe("Live feed pending");
    expect(en.t("module.workflow.run")).toBe("Run pipeline");
  });

  test("formats audited run labels in the active locale", () => {
    const zh = createI18n("zh-CN");
    const en = createI18n("en-US");
    const run = {
      runId: "run-1",
      createdAt: "2026-05-26T08:00:00+00:00",
      timeframe: "5m" as const,
      strategyRevision: "rev123",
      dataRows: 240,
      executionMode: "paper_only"
    };

    expect(zh.researchRunLabel(run)).toBe("run-1 · 240 根 5m K线 · 模拟盘");
    expect(en.researchRunLabel(run)).toBe("run-1 · 240 5m bars · paper_only");
  });

  test("translates known strategy and decision copy without changing unknown text", () => {
    const zh = createI18n("zh-CN");

    expect(zh.strategyText("Close > SMA20 and relative strength improving")).toBe("收盘价 > SMA20，且相对强度改善");
    expect(zh.strategyText("Momentum confirmation plus AI committee agreement")).toBe("动量确认 + AI 委员会一致");
    expect(zh.decisionAgent("AI Debate")).toBe("AI 辩论");
    expect(zh.decisionAgent("Strategy Drafter")).toBe("策略起草员");
    expect(
      zh.decisionMessage(
        "Backtest explanation for 600000: return +12.4%, max drawdown 5.8%, trades 42; no guaranteed outcome."
      )
    ).toBe("600000 回测解释：收益率 +12.4%，最大回撤 5.8%，交易数 42；不构成收益保证。");
    expect(
      zh.decisionMessage("600000 15m selected. Run Pipeline to generate an audited backtest and agent review.")
    ).toBe("600000 15m 已选中。运行流水线以生成可审计回测和智能体评审。");
    expect(
      zh.decisionMessage("Strategy field entry updated locally. Run Pipeline to generate a fresh audited backtest.")
    ).toBe("策略字段 入场 已本地更新。运行流水线以生成新的可审计回测。");
    expect(zh.decisionMessage("自定义中文研究结论")).toBe("自定义中文研究结论");
  });
});
