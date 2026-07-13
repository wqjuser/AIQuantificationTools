import { describe, expect, test } from "vitest";
import { createI18n, resolveInitialLocale, supportedLocales, translationKeysForLocale } from "./i18n";
import { buildProductWorkAreas, buildTerminalWorkspace } from "./terminal-workbench";

describe("i18n", () => {
  test("keeps Stage 3 AI review keys in parity across Chinese and English", () => {
    const zh = createI18n("zh-CN");
    const en = createI18n("en-US");
    expect(zh.t("aiReviewStage3.title")).toBe("权威 AI 评审");
    expect(en.t("aiReviewStage3.title")).toBe("Authoritative AI review");
    expect(zh.t("aiReviewStage3.reason.context-mismatch")).toBe("研究上下文不一致");
    expect(en.t("aiReviewStage3.reason.context-mismatch")).toBe("Research context mismatch");
    expect(zh.t("aiReviewStage3.legacyNonAuthoritative")).toBe("旧版 · 非权威记录");
    expect(en.t("aiReviewStage3.legacyNonAuthoritative")).toBe("Legacy · non-authoritative");
    expect(zh.t("aiReviewStage3.error.decisionReadbackFailed")).toBe("AI 评审 Decision 回读失败。");
    expect(en.t("aiReviewStage3.error.decisionReadbackFailed")).toBe("AI review Decision readback failed.");
    expect(en.t("archive.aiReview.group.authoritative")).toBe("Package authoritative Review");
    expect(en.t("archive.aiReview.group.decision")).toBe("Package Decision");
    expect(zh.t("archive.aiReview.authoritative")).toBe("权威评审");
    expect(zh.t("archive.aiReview.decision")).toBe("Decision");
    expect(zh.t("archive.aiReview.sameHash")).toBe("Hash 一致");
    expect(zh.t("archive.aiReview.conflict")).toBe("冲突");
    expect(zh.t("aiReviewStage3.draftSelection")).toBe("新评审草稿选择");
    expect(en.t("aiReviewStage3.loadedRecord")).toBe("Loaded authoritative record");
    expect(zh.t("aiReviewStage3.external.error.ai_review_provider_not_configured")).toBe("Provider 尚未配置。");
    expect(en.t("aiReviewStage3.external.error.ai_review_provider_not_configured")).toBe("Provider is not configured.");
    expect(zh.t("aiReviewStage3.error.contextLoadFailed")).toBe("AI 评审 Provider 或历史加载失败。");
    expect(zh.t("aiReviewStage3.error.runRestoreFailed")).toBe("AI 评审研究运行恢复失败，未加载链接中的运行数据。");
    expect(en.t("aiReviewStage3.error.runRestoreFailed")).toBe("AI review research run restore failed; linked run data was not loaded.");
    expect(translationKeysForLocale("zh-CN")).toEqual(translationKeysForLocale("en-US"));
  });

  test("defaults to Simplified Chinese unless a supported locale is stored", () => {
    expect(resolveInitialLocale()).toBe("zh-CN");
    expect(resolveInitialLocale("en-US")).toBe("en-US");
    expect(resolveInitialLocale("fr-FR")).toBe("zh-CN");
  });

  test("translates terminal chrome and known workspace labels", () => {
    const zh = createI18n("zh-CN");
    const workAreas = buildProductWorkAreas(buildTerminalWorkspace());
    const marketArea = workAreas.find((area) => area.id === "market");
    const auditArea = workAreas.find((area) => area.id === "audit");
    const executionArea = workAreas.find((area) => area.id === "execution");

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
    expect(zh.statusLabel("Strategy version loaded")).toBe("策略版本已载入");
    expect(zh.statusLabel("AI action generated")).toBe("AI 操作已生成");
    expect(zh.statusLabel("AI review export ready")).toBe("AI 评审报告导出完成");
    expect(zh.statusLabel("AI review record saved")).toBe("AI 评审运行记录已保存");
    expect(zh.statusLabel("Adapter paper execution recorded · ashare-live")).toBe(
      "适配器模拟执行已记录 · ashare-live"
    );
    expect(zh.statusLabel("Adapter paper execution blocked · ashare-live")).toBe(
      "适配器模拟执行已阻断 · ashare-live"
    );
    expect(zh.statusLabel("Adapter paper execution reused")).toBe("适配器模拟执行已复用");
    expect(zh.statusLabel("Adapter paper execution reused · ashare-live")).toBe(
      "适配器模拟执行已复用 · ashare-live"
    );
    expect(marketArea ? zh.productWorkAreaDeliveryStage(marketArea) : "").toBe("阶段 1 · 行情与研究");
    expect(marketArea ? zh.productDevelopmentStageStatus(marketArea.deliveryStageStatus) : "").toBe("基础维护");
    expect(auditArea ? zh.productDevelopmentStageStatus(auditArea.deliveryStageStatus) : "").toBe("基础维护");
    expect(executionArea ? zh.productWorkAreaDeliveryStage(executionArea) : "").toBe("阶段 8 · 生产只读连续性");
    expect(executionArea ? zh.productDevelopmentStageStatus(executionArea.deliveryStageStatus) : "").toBe("基础维护");
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
    expect(zh.t("strategy.context")).toBe("上下文");
    expect(zh.t("strategy.auditRun")).toBe("审计运行");
    expect(zh.t("strategy.loadedVersion")).toBe("已载入");
    expect(zh.t("strategy.diff")).toBe("差异");
    expect(zh.t("strategy.diffChanged", { count: 3 })).toBe("3 项差异");
    expect(zh.t("panel.backtest.title")).toBe("回测回放");
    expect(zh.t("backtest.assumptions")).toBe("回测假设");
    expect(zh.t("backtest.parameterScan")).toBe("参数敏感性");
    expect(zh.t("backtest.stageCandidate")).toBe("暂存");
    expect(zh.statusLabel("Parameter candidate staged")).toBe("参数候选已暂存");
    expect(zh.t("aiReview.exportMarkdown")).toBe("导出 AI 报告");
    expect(zh.t("aiReview.saveRecord")).toBe("保存运行记录");
    expect(zh.t("aiReview.savedRecords")).toBe("已保存评审记录");
    expect(zh.t("p0Journey.title")).toBe("P0 黄金路径");
    expect(zh.t("p0Journey.action")).toBe("运行下一步");
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
    expect(en.t("strategy.context")).toBe("Context");
    expect(en.t("strategy.auditRun")).toBe("Audit run");
    expect(en.t("strategy.loadedVersion")).toBe("Loaded");
    expect(en.t("strategy.diffChanged", { count: 3 })).toBe("3 changes");
    expect(en.t("backtest.parameterScan")).toBe("Parameter sensitivity");
    expect(en.t("backtest.stageCandidate")).toBe("Stage");
    expect(en.t("backtest.initialCash")).toBe("Initial cash");
    expect(en.t("aiReview.exportMarkdown")).toBe("Export AI report");
    expect(en.t("aiReview.saveRecord")).toBe("Save record");
    expect(en.t("aiReview.savedRecords")).toBe("Saved review records");
    expect(en.t("p0Journey.boundary")).toBe("Paper-only · live trading blocked");
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

  test("translates the persisted strategy experiment workbench", () => {
    const zh = createI18n("zh-CN");
    const en = createI18n("en-US");

    expect(zh.t("strategyExperiment.title")).toBe("策略实验");
    expect(zh.t("strategyExperiment.run")).toBe("运行实验");
    expect(zh.t("strategyExperiment.replay")).toBe("精确重放");
    expect(zh.t("strategyExperiment.export")).toBe("导出 JSON");
    expect(zh.t("strategyExperiment.loadDraft")).toBe("载入草稿");
    expect(zh.t("strategyExperiment.legacyReaudit")).toBe("旧版快照需要重新运行研究流水线后才能实验。");
    expect(zh.t("strategyExperiment.holdoutConsumed")).toBe("测试留出集已被另一实验定义使用，请生成新的审计快照。");
    expect(zh.t("strategyExperiment.persistedEvidenceRequired")).toBe("需要与当前运行和策略版本匹配的持久化实验依据。");
    expect(zh.t("strategyExperiment.train")).toBe("训练集");
    expect(zh.t("strategyExperiment.validation")).toBe("验证集");
    expect(zh.t("strategyExperiment.test")).toBe("测试集");
    expect(zh.t("strategyExperiment.eligibility")).toBe("资格");
    expect(zh.t("strategyExperiment.budget")).toBe("评估预算");
    expect(zh.t("strategyExperiment.completed")).toBe("已完成");
    expect(zh.t("strategyExperiment.failed")).toBe("失败");
    expect(zh.t("strategyExperiment.invalidDraft")).toBe("实验配置无效，请检查参数范围、保护条件和评估预算。");
    expect(zh.t("strategyExperiment.exportFailed")).toBe("实验 JSON 导出失败。");
    expect(zh.t("strategyExperiment.candidateLoadFailed")).toBe("候选草稿载入失败。");

    expect(en.t("strategyExperiment.title")).toBe("Strategy experiments");
    expect(en.t("strategyExperiment.run")).toBe("Run experiment");
    expect(en.t("strategyExperiment.replay")).toBe("Exact replay");
    expect(en.t("strategyExperiment.export")).toBe("Export JSON");
    expect(en.t("strategyExperiment.loadDraft")).toBe("Load draft");
    expect(en.t("strategyExperiment.legacyReaudit")).toBe("Legacy snapshots must be re-audited by running the research pipeline again.");
    expect(en.t("strategyExperiment.holdoutConsumed")).toBe("The test holdout was consumed by another definition; generate a fresh audited snapshot.");
    expect(en.t("strategyExperiment.persistedEvidenceRequired")).toBe("Persisted experiment evidence matching the current run and strategy revision is required.");
    expect(en.t("strategyExperiment.train")).toBe("Train");
    expect(en.t("strategyExperiment.validation")).toBe("Validation");
    expect(en.t("strategyExperiment.test")).toBe("Test");
    expect(en.t("strategyExperiment.eligibility")).toBe("Eligibility");
    expect(en.t("strategyExperiment.budget")).toBe("Evaluation budget");
    expect(en.t("strategyExperiment.completed")).toBe("Completed");
    expect(en.t("strategyExperiment.failed")).toBe("Failed");
    expect(en.t("strategyExperiment.invalidDraft")).toBe("The experiment draft is invalid; review parameter bounds, guardrails, and budget.");
    expect(en.t("strategyExperiment.exportFailed")).toBe("Strategy experiment JSON export failed.");
    expect(en.t("strategyExperiment.candidateLoadFailed")).toBe("Strategy experiment candidate load failed.");
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
    expect(zh.decisionAgent("Strategy Library")).toBe("策略库");
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
    expect(
      zh.decisionMessage(
        "Strategy revision rev-aapl-sma8 loaded for AAPL 5m. Archived audit run run-aapl-audited remains read-only; Run Pipeline to generate a fresh audited backtest."
      )
    ).toBe("策略版本 rev-aapl-sma8 已载入到 AAPL 5m。归档审计运行 run-aapl-audited 保持只读；运行流水线以生成新的可审计回测。");
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
