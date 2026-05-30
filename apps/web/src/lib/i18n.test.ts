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
    expect(zh.quantLoopLabel("research", "Market Research")).toBe("行情研究");
    expect(zh.quantLoopLabel("strategy", "Strategy Lab")).toBe("策略工坊");
    expect(zh.quantLoopLabel("backtest", "Backtest Review")).toBe("回测复盘");
    expect(zh.moduleLabel("portfolio", "Portfolio Risk")).toBe("组合风险");
    expect(zh.agentLabel("risk", "Risk Manager")).toBe("风险经理");
    expect(zh.decisionAgent("Technical")).toBe("技术分析");
    expect(zh.metricLabel("Max DD")).toBe("最大回撤");
    expect(zh.statusLabel("Research run complete")).toBe("研究运行完成");
    expect(zh.statusLabel("Strategy edited")).toBe("策略已编辑");
    expect(zh.statusLabel("AI action generated")).toBe("AI 操作已生成");
    expect(zh.statusLabel("AI review export ready")).toBe("AI 评审报告导出完成");
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
    expect(zh.t("backtest.parameterScan")).toBe("参数敏感性");
    expect(zh.t("backtest.stageCandidate")).toBe("暂存");
    expect(zh.statusLabel("Parameter candidate staged")).toBe("参数候选已暂存");
    expect(zh.t("aiReview.exportMarkdown")).toBe("导出 AI 报告");
    expect(zh.t("history.replay")).toBe("回放");
    expect(zh.t("history.comparison")).toBe("运行对比");
    expect(zh.t("history.changed")).toBe("已变化");
    expect(zh.t("history.unchanged")).toBe("未变化");
    expect(zh.t("panel.agent.evidence")).toBe("证据摘要");
    expect(zh.t("panel.agentRoles.title")).toBe("智能体角色");
    expect(zh.t("panel.agentRoles.subtitle")).toBe("当前研究分工");
    expect(zh.t("portfolio.paperPositions")).toBe("模拟持仓");
    expect(zh.moduleLabel("broker", "Broker Center")).toBe("券商中心");
    expect(zh.t("module.broker.title")).toBe("券商中心");
    expect(zh.t("broker.certification")).toBe("认证状态");
    expect(zh.t("module.news.context")).toBe("本地证据流");
    expect(zh.t("module.workflow.canvas")).toBe("节点画布");
    expect(en.t("backtest.replay")).toBe("Trade replay");
    expect(en.t("backtest.parameterScan")).toBe("Parameter sensitivity");
    expect(en.t("backtest.stageCandidate")).toBe("Stage");
    expect(en.t("backtest.initialCash")).toBe("Initial cash");
    expect(en.t("aiReview.exportMarkdown")).toBe("Export AI report");
    expect(en.t("portfolio.unrealizedPnl")).toBe("Unrealized P&L");
    expect(en.t("history.rows", { count: 240 })).toBe("240 bars");
    expect(en.t("history.comparison")).toBe("Run comparison");
    expect(en.t("panel.agent.evidence")).toBe("Evidence summary");
    expect(en.t("panel.agentRoles.title")).toBe("Agent Roles");
    expect(en.t("panel.agentRoles.subtitle")).toBe("Current research roles");
    expect(en.t("module.broker.title")).toBe("Broker Center");
    expect(en.t("broker.nextStep")).toBe("Next step");
    expect(en.t("module.news.context")).toBe("Local evidence stream");
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
    expect(zh.decisionAgent("AI Review Gate")).toBe("AI 评审闸门");
    expect(
      zh.decisionMessage(
        "Backtest explanation for 600000 using audited run run-1: return +8.20%, max drawdown 3.10%, trades 9; no guaranteed outcome."
      )
    ).toBe("600000 审计运行 run-1 回测解释：收益率 +8.20%，最大回撤 3.10%，交易数 9；不构成收益保证。");
    expect(
      zh.decisionMessage("AI explanation blocked for 600000: run Pipeline to create an audited backtest first.")
    ).toBe("600000 AI 解释已阻断：请先运行流水线生成可审计回测。");
    expect(
      zh.decisionMessage("600000 15m selected. Run Pipeline to generate an audited backtest and agent review.")
    ).toBe("600000 15m 已选中。运行流水线以生成可审计回测和智能体评审。");
    expect(
      zh.decisionMessage("Strategy field entry updated locally. Run Pipeline to generate a fresh audited backtest.")
    ).toBe("策略字段 入场 已本地更新。运行流水线以生成新的可审计回测。");
    expect(zh.strategyText("Close > SMA7")).toBe("收盘价 > SMA7");
    expect(zh.strategyText("Close < SMA13")).toBe("收盘价 < SMA13");
    expect(zh.strategyText("35% max capital allocation")).toBe("最大资金占用 35%");
    expect(zh.strategyText("Stop -8%, take profit +16%, drawdown guard 12%, paper only")).toBe(
      "止损 -8%，止盈 +16%，回撤保护 12%，仅模拟盘"
    );
    expect(zh.strategyText("Ready for pipeline run")).toBe("等待流水线运行");
    expect(zh.strategyText("Latest audited metric for the selected context.")).toBe("当前上下文的最新审计指标。");
    expect(zh.strategyText("Backtest capital assumption.")).toBe("回测资金假设。");
    expect(zh.strategyText("Round-trip fee assumption in basis points.")).toBe("以基点计的双边手续费假设。");
    expect(zh.strategyText("Execution slippage assumption in basis points.")).toBe("以基点计的执行滑点假设。");
    expect(zh.strategyText("3 bps")).toBe("3 基点");
    expect(zh.decisionMessage("自定义中文研究结论")).toBe("自定义中文研究结论");
  });
});
