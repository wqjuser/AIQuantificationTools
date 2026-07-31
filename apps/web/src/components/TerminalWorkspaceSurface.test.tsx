import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  buildBrokerAdapterRows,
  buildTerminalWorkspace,
  type PortfolioPaperOrderApprovalRow,
  type ProductWorkAreaId,
  type ResearchRunAudit,
  type StrategyExperimentDetail,
  type StrategyExperimentListItem,
} from "../lib/terminal-workbench";
import type { AuthoritativeAiReviewRun } from "../lib/ai-review-stage3";
import type { PortfolioRiskAssessment } from "../lib/portfolio-m5";
import type {
  MarketDiscoveryResult,
  MarketAiSelectionResult,
  MarketInformationResult,
  PlatformSettingsStatus,
  PortfolioBacktestRun,
} from "../lib/terminal-api";
import type { AutoTradingSnapshot } from "./ExecutionAutoPaperTradingSection";
import {
  buildAiReviewProductionPath,
  buildAuditLedgerRows,
  TerminalWorkspaceSurface,
} from "./TerminalWorkspaceSurface";

describe("TerminalWorkspaceSurface", () => {
  const workAreaIds: ProductWorkAreaId[] = [
    "market",
    "market-information",
    "research",
    "strategy",
    "backtest",
    "ai-review",
    "portfolio",
    "execution",
    "audit",
    "settings",
  ];
  const workspace = buildTerminalWorkspace();
  const baseProps = {
    action: { label: "运行", onClick: () => undefined },
    adapterRows: buildBrokerAdapterRows(workspace),
    aiReview: {
      appendingDecision: false,
      busy: false,
      comparisonExperimentIds: [],
      currentReview: null,
      decisionDraft: {
        operator: "",
        status: "accepted_for_research" as const,
        rationale: "",
        supersedesDecisionId: null,
      },
      decisions: [],
      error: null,
      experiments: [],
      externalDataApproved: false,
      history: [],
      onAppendDecision: () => undefined,
      onComparisonToggle: () => undefined,
      onDecisionDraftChange: () => undefined,
      onExternalDataApprovedChange: () => undefined,
      onOpenProductionHandoff: () => undefined,
      onProviderChange: () => undefined,
      onStagePrimaryCandidate: () => undefined,
      primaryExperimentId: null,
      primaryCandidateAvailable: false,
      providerId: "local" as const,
      providers: [
        {
          configured: true,
          model: null,
          providerId: "local" as const,
          sanitizedBaseUrl: null,
        },
      ],
    },
    chart: <div>chart</div>,
    colorScheme: "dark" as const,
    isSavingWatchlist: false,
    latestWatchlistCacheRefresh: null,
    marketRefreshIssue: null,
    onRemoveWatchlistInstrument: () => undefined,
    onSaveWatchlist: () => undefined,
    onScrollPositionChange: () => undefined,
    onSelectInstrument: () => undefined,
    onSelectTimeframe: () => undefined,
    portfolio: null,
    researchPreparation: {
      externalDataApproved: false,
      generationError: null,
      generationStatus: null,
      isGeneratingNote: false,
      isSavingNote: false,
      isSavingWorkspace: false,
      note: { source: "fallback" as const },
      noteDraft: "",
      onExternalDataApprovedChange: () => undefined,
      onGenerateNote: () => undefined,
      onNoteChange: () => undefined,
      onProviderChange: () => undefined,
      onSaveNote: () => undefined,
      onSaveWorkspace: () => undefined,
      providerId: "local" as const,
      providers: [
        {
          configured: true,
          model: null,
          providerId: "local" as const,
          sanitizedBaseUrl: null,
        },
      ],
      workspaceSaved: false,
    },
    runs: [],
    source: "fallback" as const,
    strategyExperiment: {
      active: null,
      busy: false,
      error: null,
      history: [],
      onWalkForwardChange: () => undefined,
      walkForward: null,
    },
    strategyWorkbench: <div data-testid="strategy-workbench">策略模板、规则编辑与版本治理</div>,
    surfaceRef: createRef<HTMLElement>(),
    workspace,
  };

  it("renders a dedicated surface for every product work area", () => {
    for (const activeWorkAreaId of workAreaIds) {
      const markup = renderToStaticMarkup(
        <TerminalWorkspaceSurface
          {...baseProps}
          activeWorkAreaId={activeWorkAreaId}
        />,
      );
      expect(markup).toContain(`surface-${activeWorkAreaId}`);
      expect(markup).toContain("design-page-header");
      expect(markup).toContain("当前工作区状态");
      expect(markup).toContain("当前状态");
      expect(markup).toContain("阻断原因");
      expect(markup).toContain("下一步");
    }
  });

  it("localizes the built-in strategy name and draft revision in the strategy header", () => {
    const markup = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="strategy"
      />,
    );

    expect(markup).toContain("/ 简单移动平均线趋势 / 银行板块");
    expect(markup).toContain("修订版：草稿");
    expect(markup).not.toContain("SMA Trend / Bank Sector");
    expect(markup).not.toContain("修订版：draft");
  });

  it("localizes the backtest header and trade ledger without changing stored values", () => {
    const backtestTrades = [
      {
        id: "trade-buy",
        timestamp: "2026-07-29T08:00:00Z",
        symbol: "BTC/USDT",
        side: "BUY" as const,
        status: "filled" as const,
        price: "64000",
        quantity: "0.001",
        exposure: "64",
        pnl: "-",
        reason: "entry",
        tone: "positive" as const,
      },
      {
        id: "trade-sell",
        timestamp: "2026-07-30T08:00:00Z",
        symbol: "BTC/USDT",
        side: "SELL" as const,
        status: "filled" as const,
        price: "64500",
        quantity: "0.001",
        exposure: "64.5",
        pnl: "+0.5",
        reason: "exit",
        tone: "positive" as const,
      },
    ];
    const markup = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="backtest"
        workspace={{ ...workspace, backtestTrades }}
      />,
    );

    expect(markup).toContain("/ 简单移动平均线趋势 / 银行板块");
    expect(markup).toContain(">买入<");
    expect(markup).toContain(">卖出<");
    expect(markup).toContain(">已成交<");
    expect(markup).not.toContain(">BUY<");
    expect(markup).not.toContain(">SELL<");
    expect(markup).not.toContain(">filled<");
  });

  it("keeps the shared automated-trading guide visible above every workspace", () => {
    const markup = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market"
        workflowGuide={<section data-testid="automated-trading-guide">10 个页面 · 继续自动化交易流程</section>}
      />,
    );

    expect(markup).toContain('data-testid="automated-trading-guide"');
    expect(markup.indexOf('data-testid="automated-trading-guide"')).toBeLessThan(
      markup.indexOf("design-page-header"),
    );
  });

  it("shows the golden-path blocker even when the local page action is enabled", () => {
    const markup = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        action={{
          label: "刷新行情",
          onClick: () => undefined,
          workflowReason: "当前标的还没有 K 线缓存上下文，先刷新行情数据后再运行审计研究。",
          workflowStatus: "needs_run",
        }}
        activeWorkAreaId="market"
      />,
    );

    expect(markup).toContain("待处理");
    expect(markup).toContain("当前标的还没有 K 线缓存上下文");
    expect(markup).not.toContain("无主动作阻断");
  });

  it("provides working audit filters for run, symbol, and event type", () => {
    const run = (
      runId: string,
      symbol: string,
    ): ResearchRunAudit => ({
      runId,
      createdAt: "2026-07-23T08:00:00.000Z",
      market: "ashare",
      symbol,
      timeframe: "1d",
      strategyName: "SMA Trend",
      strategyRevision: "revision-1",
      dataRows: 500,
      metrics: {},
      decisions: [],
      executionMode: "paper",
    });
    const runs = [
      run("run-600519-primary", "600519"),
      run("run-600000-secondary", "600000"),
    ];

    expect(buildAuditLedgerRows(runs, {
      runId: "PRIMARY",
      symbol: "600519",
      eventType: "backtest",
    }).map((row) => row.event)).toEqual(["回测运行"]);
    expect(buildAuditLedgerRows(runs, {
      runId: "",
      symbol: "600000",
      eventType: "all",
    })).toHaveLength(4);

    const audit = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="audit"
        executionAcceptanceAudit={<section>历史执行验收证据</section>}
      />,
    );
    expect(audit).toContain('aria-label="审计事件筛选"');
    expect(audit).toContain('name="runId"');
    expect(audit).toContain('name="symbol"');
    expect(audit).toContain("历史执行验收证据");
    expect(audit).toContain("design-execution-acceptance-audit");
    expect(audit).not.toContain("readonly");
  });

  it("presents AI review as a compact evidence-first Chinese hierarchy", () => {
    const review = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="ai-review" />,
    );

    expect(review).toContain('aria-label="当前评审上下文"');
    expect(review).toContain("design-ai-main");
    expect(review).toContain("评审结论");
    expect(review).toContain("实验指标对比");
    expect(review).toContain("评审记录");
    expect(review).toContain("等待建立权威基线");
    expect(review).toContain("暂无当前权威评审记录");
    expect(review).toContain("等待选择主实验");
    expect(review).not.toContain("Trend is recovering, but volume confirmation is still weak.");
    expect(review).not.toContain("Portfolio Manager");
  });

  it("exposes the existing AI review provider and outbound authorization controls", () => {
    const review = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="ai-review"
        aiReview={{
          ...baseProps.aiReview,
          providerId: "openai-compatible",
          providers: [
            ...baseProps.aiReview.providers,
            {
              configured: true,
              model: "gpt-5.5",
              providerId: "openai-compatible",
              sanitizedBaseUrl: "https://provider.example/v1",
            },
          ],
        }}
      />,
    );

    expect(review).toContain("评审设置");
    expect(review).toContain("模型服务");
    expect(review).toContain("OpenAI 兼容服务");
    expect(review).toContain("允许发送证据摘要");
    expect(review).toContain("仅本次评审有效");
    expect(review).toContain("不发送原始 K 线、密钥或已有研究笔记");
  });

  it("offers only existing experiments through the authoritative comparison selector", () => {
    const experiment = (
      experimentId: string,
      overrides: Partial<StrategyExperimentListItem> = {},
    ) => ({
      experimentId,
      market: "ashare",
      status: "completed",
      strategyLineageKey: "lineage-1",
      symbol: "600519",
      timeframe: "1d",
      ...overrides,
    }) as StrategyExperimentListItem;
    const review = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="ai-review"
        aiReview={{
          ...baseProps.aiReview,
          experiments: [
            experiment("primary"),
            experiment("comparison"),
            experiment("other-context", { symbol: "600000" }),
          ],
          primaryExperimentId: "primary",
        }}
      />,
    );

    expect(review).toContain("对照实验");
    expect(review).toContain("comparison");
    expect(review).toContain("可用于对比");
    expect(review).toContain("other-context");
    expect(review).toContain("研究上下文不一致");
  });

  it("shows AI review orchestration failures instead of silently ignoring the run", () => {
    const review = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="ai-review"
        aiReview={{
          ...baseProps.aiReview,
          error: "策略实验创建失败，请检查证据后重试。",
        }}
      />,
    );

    expect(review).toContain('role="alert"');
    expect(review).toContain("策略实验创建失败，请检查证据后重试。");
  });

  it("exposes walk-forward evidence controls in the backtest laboratory", () => {
    const backtest = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="backtest"
        strategyExperiment={{
          ...baseProps.strategyExperiment,
          walkForward: {
            stepBars: 10,
            trainBars: 40,
            validationBars: 10,
          },
        }}
      />,
    );

    expect(backtest).toContain("样本外验证");
    expect(backtest).toContain("滚动前推依据");
    expect(backtest).toContain("训练 K 线数");
    expect(backtest).toContain("验证 K 线数");
    expect(backtest).toContain("步进 K 线数");
  });

  it("uses server-qualified backtest evidence for an explicit production strategy handoff", () => {
    const handoff = {
      runId: "run-live-strategy",
      strategyId: "strategy-revision-1",
      strategyRevision: "revision-1",
      strategyName: "BTC 一分钟均线策略",
      market: "crypto" as const,
      symbol: "BTC/USDT",
      timeframe: "1m" as const,
      status: "ready" as const,
      evidenceStatus: "eligible" as const,
      switchAllowed: true,
      switchBlockedReason: null,
      alreadyBound: false,
      auditHash: "audit-hash",
      dataSnapshotHash: "snapshot-hash",
      productionReplay: {
        feeBps: 10,
        slippageBps: 10,
        auditedMaxDrawdownPct: 1.2,
        productionMaxDrawdownPct: 1.4,
        strategyMaxDrawdownPct: 2,
      },
      boundary: {
        authorizesLive: false as const,
        startsMonitoring: false as const,
        evaluatesNow: false as const,
        submitsOrder: false as const,
      },
    };
    const ready = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="backtest"
        productionStrategyHandoff={{
          binding: null,
          busy: false,
          errorLabel: null,
          onBind: async () => true,
          onOpenDynamicTrading: () => undefined,
          result: { handoff, source: "core" },
        }}
      />,
    );
    const active = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="backtest"
        productionStrategyHandoff={{
          binding: {
            kind: "library",
            bindingId: "binding-1",
            strategyId: handoff.strategyId,
            revision: handoff.strategyRevision,
            name: handoff.strategyName,
            auditRunId: handoff.runId,
            market: handoff.market,
            symbol: handoff.symbol,
            timeframe: handoff.timeframe,
            status: "ready",
            detail: "已绑定",
            switchAllowed: true,
            switchBlockedReason: null,
            operator: "wenqingjie",
          },
          busy: false,
          errorLabel: null,
          onBind: async () => true,
          onOpenDynamicTrading: () => undefined,
          result: {
            handoff: { ...handoff, alreadyBound: true, status: "active" },
            source: "core",
          },
        }}
      />,
    );
    const blocked = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="backtest"
        productionStrategyHandoff={{
          binding: null,
          busy: false,
          errorLabel: "当前自动监控正在运行，请先暂停后再切换策略。",
          onBind: async () => false,
          onOpenDynamicTrading: () => undefined,
          result: {
            handoff: {
              ...handoff,
              status: "review",
              switchAllowed: false,
              switchBlockedReason: "strategy_switch_requires_paused_monitoring",
            },
            source: "core",
          },
        }}
      />,
    );

    expect(ready).toContain("生产策略资格与交接");
    expect(ready).toContain("服务端按生产边界复算");
    expect(ready).toContain("交接为生产自动策略");
    expect(ready).toContain('id="backtest-production-confirm"');
    expect(ready).toContain('maxLength="80"');
    expect(ready).toContain("disabled");
    expect(ready).toContain("不会授权实盘、启动监控、立即评估或提交订单");
    expect(active).toContain(">已交接<");
    expect(active).toContain("前往动态交易复核");
    expect(active).not.toContain("交接为生产自动策略");
    expect(blocked).toContain("需处理切换条件");
    expect(blocked).toContain("当前自动监控正在运行，请先暂停后再切换策略。");
  });

  it("shows completed backtest experiments and failures instead of returning silently to idle", () => {
    const experiment = {
      createdAt: "2026-07-23T13:39:09+08:00",
      experimentId: "experiment-visible",
      resultHash: "result-hash-123",
      selectedCandidateId: "candidate-3",
      sourceRunId: "run-research",
      status: "completed",
      strategyRevision: "revision-1",
    } as StrategyExperimentDetail;
    const completed = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="backtest"
        strategyExperiment={{
          ...baseProps.strategyExperiment,
          active: experiment,
          history: [experiment],
        }}
      />,
    );
    const failed = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="backtest"
        strategyExperiment={{
          ...baseProps.strategyExperiment,
          error: "策略实验创建失败，请检查证据后重试。",
        }}
      />,
    );

    expect(completed).toContain('role="status"');
    expect(completed).toContain("experiment-visible");
    expect(completed).toContain("已完成");
    expect(completed).toContain("candidate-3");
    expect(completed).toContain("result-hash-123");
    expect(failed).toContain('role="alert"');
    expect(failed).toContain("策略实验创建失败，请检查证据后重试。");
  });

  it("renders authoritative AI review status instead of hard-coded verdicts", () => {
    const assessment = {
      stance: "supported" as const,
      summary: "Evidence is incomplete; 1 required item(s) are missing or invalid.",
      risks: [],
      invalidationConditions: [],
      watchItems: [],
      evidenceGaps: [],
      consistency: "consistent" as const,
    };
    const reference = {
      experimentId: "experiment-1",
      sourceRunId: "run-authoritative-1",
      strategyRevision: "revision-1",
      snapshotId: "snapshot-1",
      definitionHash: "a".repeat(64),
      resultHash: "b".repeat(64),
      selectedCandidateId: "candidate-1",
      candidateRevision: "candidate-revision-1",
      canonicalDataHash: "c".repeat(64),
      dataRange: { startAt: "2026-01-01", endAt: "2026-07-21" },
    };
    const reviewRecord = {
      schemaVersion: 2,
      authority: "authoritative",
      recordType: "aiqt.aiReviewRun",
      aiReviewId: "ai-review-authoritative-1",
      createdAt: "2026-07-21T08:00:00+00:00",
      mode: "single",
      primaryExperiment: reference,
      comparisonExperiments: [],
      strategyLineageKey: "lineage-1",
      evidenceBundle: {
        schemaVersion: 1,
        mode: "single",
        primaryExperiment: reference,
        comparisonExperiments: [],
        strategyLineageKey: "lineage-1",
        evidenceItems: [{
          id: "experiment:experiment-1:candidate:candidate-1",
          kind: "candidate_metrics",
          value: {
            candidateId: "candidate-1",
            selected: true,
            testMetrics: {
              maxDrawdownPct: 7.34,
              totalReturnPct: -3.14,
              tradeCount: 62,
              winRatePct: 22.58,
            },
          },
        }],
        safetyBoundary: {
          paperOnly: true,
          liveTradingAllowed: false,
          orderSubmissionAllowed: false,
        },
        evidenceHash: "d".repeat(64),
      },
      evidenceHash: "d".repeat(64),
      deterministicAssessment: assessment,
      externalAssessment: {
        status: "completed",
        provider: "openai-compatible",
        model: "deterministic-local-v1",
        sanitizedBaseUrl: null,
        endpointHash: null,
        promptTemplateVersion: "aiqt-ai-review-v1",
        outputSchemaVersion: "aiqt-ai-review-assessment-v1",
        renderedPrompt: "local",
        renderedPromptHash: "e".repeat(64),
        evidenceHash: "d".repeat(64),
        requestHash: null,
        responseHash: null,
        assessment,
        usage: null,
        latencyMs: 1,
        error: null,
      },
      boundary: {
        purpose: "research_evidence_review_only",
        paperOnly: true,
        liveTradingAllowed: false,
        orderSubmissionAllowed: false,
      },
      recordHash: "f".repeat(64),
    } satisfies AuthoritativeAiReviewRun;
    const review = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="ai-review"
        aiReview={{
          ...baseProps.aiReview,
          busy: false,
          comparisonExperimentIds: [],
          currentReview: reviewRecord,
          decisions: [],
          error: null,
          experiments: [],
          externalDataApproved: true,
          history: [reviewRecord],
          onComparisonToggle: () => undefined,
          onExternalDataApprovedChange: () => undefined,
          onProviderChange: () => undefined,
          primaryExperimentId: "experiment-1",
          providerId: "openai-compatible",
          providers: [{
            configured: true,
            model: "deterministic-local-v1",
            providerId: "openai-compatible",
            sanitizedBaseUrl: null,
          }],
        }}
      />,
    );

    expect(review).toContain("支持");
    expect(review).toContain("证据不完整：1 项必需证据缺失或无效。");
    expect(review).toContain("OpenAI 兼容服务");
    expect(review).toContain("确定性评估");
    expect(review).toContain("deterministic-local-v1");
    expect(review).toContain("快照身份");
    expect(review).toContain("snapshot-1");
    expect(review).toContain("ai-review…tive-1");
    expect(review).toContain("一致性：一致");
    expect(review).not.toContain("未通过");
    expect(review).not.toContain("Evidence is incomplete");
    expect(review).not.toContain("OpenAI Compatible");
    expect(review).not.toContain(">Deterministic<");
    expect(review).not.toContain("对照实验 A");
    expect(review).toContain("-3.14%");
    expect(review).toContain("22.58%");

    const insufficientReview: AuthoritativeAiReviewRun = {
      ...reviewRecord,
      deterministicAssessment: {
        ...reviewRecord.deterministicAssessment,
        consistency: "insufficient",
      },
    };
    const insufficient = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="ai-review"
        aiReview={{
          ...baseProps.aiReview,
          currentReview: insufficientReview,
          history: [insufficientReview],
          primaryExperimentId: "experiment-1",
        }}
      />,
    );
    expect(insufficient).toContain("一致性：未选择对照实验");

    const comparisonReference = {
      ...reference,
      experimentId: "comparison-1",
      selectedCandidateId: "candidate-2",
    };
    const comparisonReview: AuthoritativeAiReviewRun = {
      ...reviewRecord,
      mode: "comparison",
      comparisonExperiments: [comparisonReference],
      evidenceBundle: {
        ...reviewRecord.evidenceBundle,
        mode: "comparison",
        comparisonExperiments: [comparisonReference],
        evidenceItems: [
          ...reviewRecord.evidenceBundle.evidenceItems,
          {
            id: "experiment:comparison-1:candidate:candidate-2",
            kind: "candidate_metrics",
            value: {
              candidateId: "candidate-2",
              selected: true,
              testMetrics: {
                maxDrawdownPct: 5.1,
                totalReturnPct: -2.5,
                tradeCount: 28,
                winRatePct: 21.43,
              },
            },
          },
        ],
      },
    };
    const comparison = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="ai-review"
        aiReview={{
          ...baseProps.aiReview,
          comparisonExperimentIds: ["comparison-1"],
          currentReview: comparisonReview,
          history: [comparisonReview],
          primaryExperimentId: "experiment-1",
        }}
      />,
    );
    expect(comparison).toContain("对照实验 1 · comparison-1");
    expect(comparison).toContain("-2.50%");
    expect(comparison).toContain("21.43%");
    expect(comparison).not.toContain("对照实验 B");

    const failedReview: AuthoritativeAiReviewRun = {
      ...reviewRecord,
      externalAssessment: {
        ...reviewRecord.externalAssessment,
        status: "failed",
        assessment: null,
        responseHash: null,
        usage: null,
        error: {
          code: "invalid_schema",
          message: "raw provider validation detail must not render",
        },
      },
    };
    const failed = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="ai-review"
        aiReview={{
          ...baseProps.aiReview,
          busy: false,
          comparisonExperimentIds: [],
          currentReview: failedReview,
          decisions: [],
          error: null,
          experiments: [],
          externalDataApproved: true,
          history: [failedReview],
          onComparisonToggle: () => undefined,
          onExternalDataApprovedChange: () => undefined,
          onProviderChange: () => undefined,
          primaryExperimentId: "experiment-1",
          providerId: "openai-compatible",
          providers: [],
        }}
      />,
    );
    expect(failed).toContain("本地确定性评估仍有效");
    expect(failed).toContain("证据不完整：1 项必需证据缺失或无效。");
    expect(failed).not.toContain("raw provider validation detail must not render");
    expect(failed).not.toContain("权威 AI 评审失败");

    expect(review).toContain("人工研究决策");
    expect(review).toContain("等待人工研究决策");
    expect(review).toContain("生产策略关联");
    expect(review).not.toContain("采用已评审候选并重新审计");

    const acceptedDecision = {
      schemaVersion: 1,
      recordType: "aiqt.aiReviewDecision",
      decisionId: "decision-accepted",
      aiReviewId: reviewRecord.aiReviewId,
      createdAt: "2026-07-21T08:01:00+00:00",
      operator: "researcher",
      status: "accepted_for_research",
      rationale: "接受用于后续研究与生产资格复核。",
      supersedesDecisionId: null,
      reviewRecordHash: reviewRecord.recordHash,
      evidenceHash: reviewRecord.evidenceHash,
      boundary: {
        paperOnly: true,
        liveTradingAllowed: false,
        orderSubmissionAllowed: false,
      },
      recordHash: "1".repeat(64),
    } as const;
    const candidateReaudit = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="ai-review"
        aiReview={{
          ...baseProps.aiReview,
          currentReview: reviewRecord,
          decisions: [acceptedDecision],
          history: [reviewRecord],
          primaryCandidateAvailable: true,
          primaryExperimentId: "experiment-1",
        }}
      />,
    );
    expect(candidateReaudit).toContain("候选需重新审计");
    expect(candidateReaudit).toContain("采用已评审候选并重新审计");
    expect(candidateReaudit).not.toContain("交接为生产自动策略");

    const sameRevisionReference = {
      ...reference,
      candidateRevision: reference.strategyRevision,
    };
    const sameRevisionReview: AuthoritativeAiReviewRun = {
      ...reviewRecord,
      primaryExperiment: sameRevisionReference,
      evidenceBundle: {
        ...reviewRecord.evidenceBundle,
        primaryExperiment: sameRevisionReference,
      },
    };
    const handoff = {
      runId: sameRevisionReference.sourceRunId,
      strategyId: "strategy-revision-1",
      strategyRevision: sameRevisionReference.strategyRevision,
      strategyName: "BTC 一分钟均线策略",
      market: "crypto" as const,
      symbol: "BTC/USDT",
      timeframe: "1m" as const,
      status: "active" as const,
      evidenceStatus: "eligible" as const,
      switchAllowed: true,
      switchBlockedReason: null,
      alreadyBound: true,
      auditHash: "audit-hash",
      dataSnapshotHash: sameRevisionReference.snapshotId,
      productionReplay: {
        feeBps: 10,
        slippageBps: 10,
        auditedMaxDrawdownPct: 1.2,
        productionMaxDrawdownPct: 1.4,
        strategyMaxDrawdownPct: 2,
      },
      boundary: {
        authorizesLive: false as const,
        startsMonitoring: false as const,
        evaluatesNow: false as const,
        submitsOrder: false as const,
      },
    };
    const productionBinding = {
      kind: "library" as const,
      bindingId: "binding-1",
      strategyId: handoff.strategyId,
      revision: handoff.strategyRevision,
      name: handoff.strategyName,
      auditRunId: handoff.runId,
      market: handoff.market,
      symbol: handoff.symbol,
      timeframe: handoff.timeframe,
      status: "ready" as const,
      detail: "已绑定",
      switchAllowed: true,
      switchBlockedReason: null,
      operator: "wenqingjie",
    };
    const productionLinked = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="ai-review"
        aiReview={{
          ...baseProps.aiReview,
          currentReview: sameRevisionReview,
          decisions: [acceptedDecision],
          history: [sameRevisionReview],
          primaryCandidateAvailable: true,
          primaryExperimentId: "experiment-1",
        }}
        productionStrategyHandoff={{
          binding: productionBinding,
          busy: false,
          errorLabel: null,
          onBind: async () => true,
          onOpenDynamicTrading: () => undefined,
          result: { handoff, source: "core" },
        }}
      />,
    );
    expect(productionLinked).toContain("生产策略已关联");
    expect(productionLinked).toContain("前往动态交易复核");
    expect(productionLinked).not.toContain("交接为生产自动策略");
    expect(productionLinked).not.toContain(">立即评估<");
    expect(productionLinked).not.toContain(">提交订单<");

    const rejectedDecision = {
      ...acceptedDecision,
      decisionId: "decision-rejected",
      status: "rejected" as const,
      supersedesDecisionId: acceptedDecision.decisionId,
    };
    expect(buildAiReviewProductionPath({
      binding: null,
      decisions: [acceptedDecision, rejectedDecision],
      handoff: null,
      handoffError: null,
      primaryCandidateAvailable: true,
      review: reviewRecord,
    })).toMatchObject({
      action: null,
      label: "研究决策未接受",
      tone: "risk",
    });
    expect(buildAiReviewProductionPath({
      binding: { ...productionBinding, status: "blocked" },
      decisions: [acceptedDecision],
      handoff,
      handoffError: "固定审计证据已失效",
      primaryCandidateAvailable: true,
      review: sameRevisionReview,
    })).toMatchObject({
      action: "open-production-handoff",
      label: "生产预检未通过",
      tone: "risk",
    });
    expect(buildAiReviewProductionPath({
      binding: null,
      decisions: [acceptedDecision],
      handoff: {
        ...handoff,
        status: "review",
        switchAllowed: false,
        switchBlockedReason: "active_position",
        alreadyBound: false,
      },
      handoffError: null,
      primaryCandidateAvailable: true,
      review: sameRevisionReview,
      switchBlockedReason: "当前仍有策略持仓",
    })).toMatchObject({
      action: "open-production-handoff",
      label: "生产切换条件待处理",
      tone: "warning",
    });
    expect(buildAiReviewProductionPath({
      binding: null,
      decisions: [acceptedDecision],
      handoff: {
        ...handoff,
        status: "review",
        switchAllowed: false,
        switchBlockedReason: "active_position",
        alreadyBound: false,
      },
      handoffError: "生产绑定读取失败",
      primaryCandidateAvailable: true,
      review: sameRevisionReview,
      switchBlockedReason: "当前仍有策略持仓",
    })).toMatchObject({
      action: "open-production-handoff",
      label: "生产预检未通过",
      tone: "risk",
    });
    expect(buildAiReviewProductionPath({
      binding: productionBinding,
      decisions: [acceptedDecision],
      handoff: { ...handoff, dataSnapshotHash: "mismatched-snapshot" },
      handoffError: null,
      primaryCandidateAvailable: true,
      review: sameRevisionReview,
    })).toMatchObject({
      action: "open-production-handoff",
      label: "生产身份不一致",
      tone: "risk",
    });
    expect(buildAiReviewProductionPath({
      binding: null,
      decisions: [{ ...acceptedDecision, evidenceHash: "mismatched-evidence" }],
      handoff: null,
      handoffError: null,
      primaryCandidateAvailable: true,
      review: reviewRecord,
    })).toMatchObject({
      action: null,
      label: "等待人工研究决策",
      tone: "warning",
    });
  });

  it("projects paper, testnet, and blocked production execution semantics", () => {
    const paperExecution = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="execution" />,
    );
    const testnetSettings: PlatformSettingsStatus = {
      schemaVersion: 1,
      generatedAt: "2026-07-28T08:00:00Z",
      dataSources: [],
      fundamentalDataSources: [],
      marketDataAdapters: [],
      cache: {} as PlatformSettingsStatus["cache"],
      executionAdapters: [],
      safety: {
        liveTradingAllowed: false,
        requiredGates: ["adapter-certified"],
        executionMode: "testnet",
        liveConfirmed: false,
        liveAuthorizedUntil: null,
        productionLive: {
          enabled: true,
          credentialsConfigured: true,
          controlActive: false,
          controlRecordedActive: true,
          evidenceFresh: false,
          blockingReason: "stage10_production_execution_control_evidence_stale",
          triggered: false,
        },
      },
    };
    const testnetExecution = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="execution"
        settings={testnetSettings}
      />,
    );
    const blockedLiveExecution = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="execution"
        settings={{
          ...testnetSettings,
          safety: {
            ...testnetSettings.safety,
            executionMode: "live",
          },
        }}
      />,
    );
    const unavailableLiveExecution = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="execution"
        executionSnapshot={null}
        settings={{
          ...testnetSettings,
          safety: {
            ...testnetSettings.safety,
            executionMode: "live",
            liveTradingAllowed: true,
          },
        }}
      />,
    );
    const settings = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="settings"
        settings={testnetSettings}
      />,
    );
    expect(paperExecution).toContain("当前为纸面模拟");
    expect(paperExecution).toContain("不会向交易所提交委托");
    expect(testnetExecution).toContain("当前为币安现货测试网");
    expect(testnetExecution).toContain("仅使用测试网资金");
    expect(blockedLiveExecution).toContain("当前为币安现货生产实盘");
    expect(blockedLiveExecution).toContain("生产会话尚未授权或已过期");
    expect(blockedLiveExecution).toContain("权限核验、急停恢复和实名确认");
    expect(blockedLiveExecution).not.toContain("Stage 10");
    expect(unavailableLiveExecution).toContain("自动交易运行状态暂不可用");
    expect(unavailableLiveExecution).not.toContain("；生产路由可用。");
    expect(settings).toContain("测试网运行中");
    expect(settings).toContain("生产权限证据已过期");
    expect(settings).toContain("重新核验生产权限并恢复执行控制");
    expect(settings).not.toContain("实盘阻断");
  });

  it("projects an active production session into the execution center in Chinese", () => {
    const execution = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="execution"
        executionSnapshot={{
          state: {
            executionMode: "live",
            liveAuthorizedUntil: "2026-07-30T10:15:29Z",
          },
          liveTradingAllowed: true,
        } as AutoTradingSnapshot}
        settings={{
          schemaVersion: 1,
          generatedAt: "2026-07-30T02:10:00Z",
          dataSources: [],
          fundamentalDataSources: [],
          marketDataAdapters: [],
          cache: {} as PlatformSettingsStatus["cache"],
          executionAdapters: [],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"],
            executionMode: "testnet",
            liveConfirmed: false,
            liveAuthorizedUntil: null,
            productionLive: {
              enabled: true,
              credentialsConfigured: true,
              controlActive: false,
              controlRecordedActive: true,
              evidenceFresh: false,
              blockingReason: "stage10_production_execution_control_evidence_stale",
              triggered: false,
            },
          },
          configuration: {
            source: "database",
            revision: 3,
            updatedAt: "2026-07-30T02:10:00Z",
            restartRequired: false,
            values: {
              ccxtDefaultExchange: "binance",
              ccxtTimeout: 10000,
              autoTradingIntervalSeconds: 35,
              liveSessionTtlHours: 8,
              openaiModel: "",
              openaiCompatibleBaseUrl: "",
              openaiCompatibleModel: "",
              ollamaBaseUrl: "http://127.0.0.1:11434",
              ollamaModel: "",
              secEdgarUserAgent: "",
              monitoringWebhookTimeoutSeconds: 5,
              freeStockdbTimeoutSeconds: 3,
            },
            secrets: {} as NonNullable<PlatformSettingsStatus["configuration"]>["secrets"],
          },
        }}
        onSaveSettingsConfiguration={() => undefined}
      />,
    );

    expect(execution).toContain("生产会话有效");
    expect(execution).toContain("生产路由可用");
    expect(execution).toContain("每笔委托仍会复核权限、急停、账户覆盖和风险边界");
    expect(execution).not.toContain("权限核验、急停保护和实名确认均已完成");
    expect(execution).toContain("自动交易运行状态、风险参数与生产授权");
    expect(execution).toContain("生产授权策略");
    expect(execution).toContain('aria-label="生产授权有效时长配置"');
    expect(execution).toContain('name="liveSessionTtlHours"');
    expect(execution).toContain('value="8"');
    expect(execution).toContain("0 表示永久有效");
    expect(execution).toContain("保存授权时长");
    expect(execution).not.toContain("生产会话尚未授权或已过期");
    expect(execution).not.toContain("Adapter certified");
    expect(execution).not.toContain("Risk approved");
    expect(execution).not.toContain("Human confirmed");
    expect(execution).not.toContain("Kill Switch");
    expect(execution).not.toContain("replayExact");
    expect(execution).not.toContain("discrepancies");
    expect(execution).not.toContain("routeExecuted");
  });

  it("renders the live data adapter capability matrix without treating configuration as health", () => {
    const settings = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="settings"
        settings={{
          schemaVersion: 1,
          generatedAt: "2026-07-28T08:00:00Z",
          dataSources: [],
          fundamentalDataSources: [
            {
              id: "ashare-akshare-financials",
              market: "ashare",
              provider: "akshare",
              status: "ready",
              configured: true,
              reasonCode: "dependency_available",
              reason: "AKShare 财务依赖已就绪。",
            },
            {
              id: "us-sec-companyfacts",
              market: "us",
              provider: "sec-companyfacts",
              status: "blocked",
              configured: false,
              reasonCode: "sec_edgar_user_agent_missing",
              reason: "请配置 SEC EDGAR User-Agent 联系信息。",
            },
            {
              id: "crypto-coingecko-binance-mapping",
              market: "crypto",
              provider: "coingecko-binance",
              status: "ready_for_probe",
              configured: true,
              reasonCode: "runtime_mapping_validation_required",
              reason: "生成候选时逐项校验精确映射。",
            },
          ],
          marketDataAdapters: [{
            id: "free-stockdb-ohlcv",
            market: "ashare",
            adapter: "free-stockdb",
            provider: "free-stockdb",
            status: "degraded",
            route: "public_ohlcv",
            capabilities: ["daily_ohlcv_comparison"],
            timeframes: ["1d"],
            historyDepth: "up-to-500-bars-per-request",
            adjustmentModes: ["none"],
            freshnessSemantics: "local-snapshot",
            credentialRequirements: [],
            readOnly: true,
            requiresApiKey: false,
            requiresTradingKey: false,
            cacheScope: "comparison-only",
            cacheDiagnostics: {
              freshness: "fresh",
              contextCount: 1,
              rowCount: 500,
              latestTimestamp: "2026-07-28T07:30:00Z",
              freshnessSummary: { fresh: 1, stale: 0, empty: 0 },
            },
            externalTelemetry: {
              status: "degraded",
              dependency: "free-stockdb-local-service",
              dependencyAvailable: true,
              lastError: "provider rate limit",
              retryState: "provider_error",
              checkedAt: "2026-07-28T08:00:00Z",
              installGuidance: {
                packageName: "free-stockdb",
                dockerBuildArg: "",
                packageInstallCommand: "",
                projectExtraInstallCommand: "",
                note: "配置只读本地服务。",
              },
              lastProviderError: null,
              providerHealth: {
                status: "cooldown",
                recentErrorCount: 3,
                lastErrorAt: "2026-07-28T07:59:00Z",
                affectedSymbols: ["600000"],
                affectedContexts: ["settings"],
                categorySummary: {
                  rate_limit: 3,
                  dependency: 0,
                  network: 0,
                  upstream: 0,
                  incomplete_data: 0,
                  unknown: 0,
                },
                dominantCategory: "rate_limit",
                windowSummary: {} as never,
                retryAfterSeconds: 900,
                reason: "provider_cooldown",
              },
            },
            note: "只读对照源。",
          }],
          cache: {} as PlatformSettingsStatus["cache"],
          executionAdapters: [],
          safety: { liveTradingAllowed: false, requiredGates: ["adapter-certified"] },
        } satisfies PlatformSettingsStatus}
      />,
    );

    expect(settings).toContain("free-stockdb");
    expect(settings).toContain("daily_ohlcv_comparison");
    expect(settings).toContain("up-to-500-bars-per-request");
    expect(settings).toContain("none · local-snapshot");
    expect(settings).toContain("无需凭据");
    expect(settings).toContain("冷却中");
    expect(settings).toContain("900 秒");
    expect(settings).toContain("只读 · comparison-only");
    expect(settings).toContain("已配置不等于健康或已授权");
    expect(settings).toContain("0/1 健康");
    expect(settings).toContain("部分受限");
    expect(settings).not.toContain("Tencent");
  });

  it("projects actual M6 connector health, permissions, evidence, and next actions", () => {
    const settings = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="settings"
        adapterChainHealthRollups={[{
          adapterId: "ccxt-live",
          status: "in_progress",
          tone: "warning",
          blockerLabel: "沙箱探针",
          latestEvidenceTimestamp: "2026-07-28T08:10:00Z",
          headline: "证据收集中",
        } as never]}
        adapterHealthProbeRows={[{
          id: "probe-1",
          adapterId: "ccxt-live",
          provider: "ccxt",
          exchangeId: "binance",
          mode: "sandbox",
          timestamp: "2026-07-28T08:12:00Z",
          status: "blocked",
          statusLabel: "阻断",
          tone: "risk",
          credentialSummary: "API 密钥已配置 · 密钥已配置",
          blockerSummary: "账户同步待复核",
          boundary: "仅模拟盘 · 订单路由关闭",
        } as never]}
        adapterLedgerRows={[{
          id: "ledger-1",
          adapterId: "ccxt-live",
          adapter: "ccxt 交易所适配器",
          market: "crypto",
          route: "live",
          timestamp: "2026-07-28T08:11:00Z",
          state: "live_blocked",
          label: "实盘阻断",
          actor: "execution-safety",
          source: "settings-status",
          reason: "沙箱证据不完整",
          nextStep: "完成沙盒探测并复核只读账户同步",
          gateSummary: "2/4 gates",
          liveTradingAllowed: false,
          tone: "warning",
        }]}
        aiReview={{
          ...baseProps.aiReview,
          providerId: "openai-compatible",
          providers: [
            ...baseProps.aiReview.providers,
            {
              configured: true,
              model: "review-model",
              providerId: "openai-compatible",
              sanitizedBaseUrl: "https://models.example/v1",
            },
          ],
        }}
        settings={{
          schemaVersion: 1,
          generatedAt: "2026-07-28T08:00:00Z",
          dataSources: [],
          fundamentalDataSources: [],
          marketDataAdapters: [],
          cache: {} as PlatformSettingsStatus["cache"],
          executionAdapters: [{
            id: "ccxt-live",
            market: "crypto",
            adapter: "CCXT Binance",
            route: "live",
            status: "config_required",
            certification: "sandbox only",
            liveTradingAllowed: false,
            note: "保持生产路由关闭。",
          }],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "human-confirmed"],
          },
        }}
      />,
    );

    expect(settings).toContain("连接器状态与下一步");
    expect(settings).toContain("阻断原因");
    expect(settings).toContain("影响");
    expect(settings).toContain("下一步");
    expect(settings).toContain("外部端点尚无健康探测证据");
    expect(settings).toContain("https://models.example/v1");
    expect(settings).toContain("需逐次授权证据摘要");
    expect(settings).toContain("端点健康待验证");
    expect(settings).toContain("ccxt 交易所适配器");
    expect(settings).toContain("沙箱探针");
    expect(settings).toContain("API 密钥已配置 · 密钥已配置");
    expect(settings).toContain("处理“账户同步待复核”后重新运行只读健康检查");
    expect(settings).not.toContain("CCXT Binance");
    expect(settings).not.toContain("Evidence chain in progress");
    expect(settings).not.toContain("account sync pending");
    expect(settings).toContain("<details");
    expect(settings).not.toContain("https://api.openai.com/v1");
    expect(settings).not.toContain("~/AIQuantTools/data");
  });

  it("renders editable persisted settings without exposing stored secrets", () => {
    const settings = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="settings"
        isSavingSettingsConfiguration={false}
        onLoadOpenAiCompatibleModels={async () => ({ models: [], source: "fallback" })}
        onSaveSettingsConfiguration={() => undefined}
        onTestMonitoringWebhook={() => undefined}
        settings={{
          schemaVersion: 1,
          generatedAt: "2026-07-28T08:00:00Z",
          dataSources: [],
          fundamentalDataSources: [
            {
              id: "ashare-akshare-financials",
              market: "ashare",
              provider: "akshare",
              status: "ready",
              configured: true,
              reasonCode: "dependency_available",
              reason: "AKShare 财务依赖已就绪。",
            },
            {
              id: "us-sec-companyfacts",
              market: "us",
              provider: "sec-companyfacts",
              status: "blocked",
              configured: false,
              reasonCode: "sec_edgar_user_agent_missing",
              reason: "请配置 SEC EDGAR User-Agent 联系信息。",
            },
            {
              id: "crypto-coingecko-binance-mapping",
              market: "crypto",
              provider: "coingecko-binance",
              status: "ready_for_probe",
              configured: true,
              reasonCode: "runtime_mapping_validation_required",
              reason: "生成候选时逐项校验精确映射。",
            },
          ],
          marketDataAdapters: [],
          cache: {} as PlatformSettingsStatus["cache"],
          executionAdapters: [],
          safety: { liveTradingAllowed: false, requiredGates: [] },
          configuration: {
            source: "database",
            revision: 2,
            updatedAt: "2026-07-28T08:00:00Z",
            restartRequired: false,
            values: {
              ccxtDefaultExchange: "binance",
              ccxtTimeout: 10000,
              autoTradingIntervalSeconds: 35,
              liveSessionTtlHours: 8,
              openaiModel: "gpt-5-mini",
              openaiCompatibleBaseUrl: "",
              openaiCompatibleModel: "",
              ollamaBaseUrl: "http://127.0.0.1:11434",
              ollamaModel: "",
              secEdgarUserAgent: "AIQuantificationTools contact@example.com",
              monitoringWebhookTimeoutSeconds: 5,
              freeStockdbTimeoutSeconds: 3,
            },
            secrets: {
              finnhubApiKey: { configured: false, masked: null },
              openaiApiKey: { configured: true, masked: "sk-p••••••••1234" },
              openaiCompatibleApiKey: { configured: false, masked: null },
              ccxtSandboxApiKey: { configured: false, masked: null },
              ccxtSandboxSecret: { configured: false, masked: null },
              ccxtProductionReadonlyApiKey: { configured: false, masked: null },
              ccxtProductionReadonlySecret: { configured: false, masked: null },
              ccxtProductionTradingApiKey: { configured: false, masked: null },
              ccxtProductionTradingSecret: { configured: false, masked: null },
              monitoringWebhookUrl: { configured: true, masked: "http••••••••vate" },
              freeStockdbUrl: { configured: false, masked: null },
              httpsProxy: { configured: false, masked: null },
            },
          },
        }}
      />,
    );

    expect(settings).toContain('aria-label="平台配置"');
    expect(settings).toContain('name="openaiModel"');
    expect(settings).toContain('name="liveSessionTtlHours"');
    expect(settings).toContain('name="autoTradingIntervalSeconds"');
    expect(settings).toContain('name="secEdgarUserAgent"');
    expect(settings).toContain("请包含产品名和联系邮箱");
    expect(settings).toContain("AI 选股基本面数据");
    expect(settings).toContain("AKShare 财务");
    expect(settings).toContain("SEC Company Facts");
    expect(settings).toContain("CoinGecko / Binance 映射");
    expect(settings).toContain("运行时校验");
    expect(settings).toContain("保存后实时应用");
    expect(settings).toContain("0 表示永久有效");
    expect(settings).toContain('name="openaiCompatibleModel"');
    expect(settings).toContain("从 Base URL 的 /models 自动获取模型");
    expect(settings).toContain("刷新 OpenAI 兼容模型");
    expect(settings).toContain('name="openaiApiKey"');
    expect(settings).toContain('type="password"');
    expect(settings).toContain("数据库配置 · 修订 2");
    expect(settings).toContain("保存配置");
    expect(settings).toContain("测试 Webhook");
    expect(settings).toContain('placeholder="sk-p••••••••1234"');
    expect(settings).toContain('placeholder="http••••••••vate"');
    expect(settings).not.toContain('name="clearSecrets"');
    expect(settings).not.toContain("清除");
    expect(settings).not.toContain("database-openai-secret");
  });

  it("shows a loading state before the writable settings contract resolves", () => {
    const settings = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="settings"
        isLoadingSettingsConfiguration
      />,
    );

    expect(settings).toContain("正在加载平台配置");
    expect(settings).not.toContain("核心服务尚未提供可写配置契约");
  });

  it("keeps the current automatic-trading controls reachable in the execution center", () => {
    const execution = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="execution"
        executionReadiness={(
          <details className="execution-readiness-stack">
            <summary>自动交易控制与生产授权</summary>
            <section>生产交易控制链</section>
          </details>
        )}
      />,
    );

    expect(execution).toContain("自动交易控制与生产授权");
    expect(execution).toContain("生产交易控制链");
    expect(execution).toContain("design-execution-readiness");
    expect(execution).not.toContain("候选执行队列");
    expect(execution).not.toContain("阶段 9");
  });

  it("keeps research preparation controls reachable in the redesigned surface", () => {
    const research = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="research" />,
    );

    expect(research).toContain("研究准备");
    expect(research).toContain('id="research-note-input"');
    expect(research).toContain('id="research-note-generate"');
    expect(research).toContain('id="research-note-provider"');
    expect(research).toContain('id="research-note-save"');
    expect(research).toContain('id="research-workspace-save"');
    expect(research).toContain("生成本地草稿");
    expect(research).toContain("尚未填写");
    expect(research).toContain('aria-valuetext="暂无回测胜率"');
    expect(research).not.toContain('aria-valuenow="0"');
  });

  it("renders the functional strategy workbench instead of a static strategy mockup", () => {
    const strategy = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="strategy" />,
    );

    expect(strategy).toContain("策略模板、规则编辑与版本治理");
    expect(strategy).toContain('aria-label="策略构建与版本治理"');
    expect(strategy).not.toContain('aria-label="搜索策略"');
    expect(strategy).not.toContain("评分 ≥ 0.35");
  });

  it("renders the completed research evidence hierarchy from the selected audited run", () => {
    const runId = "run-research-complete";
    const completedWorkspace = {
      ...workspace,
      metrics: [
        { label: "Return", value: "+12.40%", tone: "positive" as const },
        { label: "Max DD", value: "5.80%", tone: "warning" as const },
        { label: "Win Rate", value: "51.00%", tone: "neutral" as const },
        { label: "Trades", value: "42", tone: "neutral" as const },
      ],
      researchRun: {
        runId,
        createdAt: "2026-07-20T15:00:12+08:00",
        market: "ashare" as const,
        symbol: "600000",
        timeframe: "1d" as const,
        strategyRevision: "v3.2.1",
        dataRows: 500,
        executionMode: "paper_only",
        dataQuality: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 500,
          adjustmentMode: "qfq",
          freshness: "fresh",
          coverage: {
            actualRows: 500,
            expectedRows: 500,
            gapCount: 0,
            ratio: 1,
          },
        },
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 500,
          start: "2024-05-31T00:00:00+08:00",
          end: "2026-07-20T00:00:00+08:00",
          hash: "snapshot-hash-reference",
          snapshotHash: "decision-snapshot-hash-reference",
          bars: [],
          adjustmentMode: "qfq",
          freshness: "fresh",
          calendarId: "ashare:Asia/Shanghai:static-session-template",
          coverage: {
            actualRows: 500,
            expectedRows: 500,
            gapCount: 0,
            ratio: 1,
          },
          offlineReplay: {
            status: "verified" as const,
            mode: "embedded_snapshot" as const,
            rows: 500,
            canonicalHash: "snapshot-hash-reference",
            networkRequired: false as const,
          },
          sourceComparison: {
            schemaVersion: 1 as const,
            status: "agreement" as const,
            primarySource: "tencent",
            secondarySource: "free-stockdb",
            primaryRows: 500,
            secondaryRows: 500,
            overlapRows: 500,
            overlapRatio: 1,
            fields: {},
            differences: [],
            valuesMerged: false as const,
            reason: null,
            reportHash: "comparison-hash-reference",
          },
        },
      },
    };
    const renderCompletedResearch = (winRatePct: number) =>
      renderToStaticMarkup(
        <TerminalWorkspaceSurface
          {...baseProps}
          activeWorkAreaId="research"
          runs={[
            {
              ...completedWorkspace.researchRun,
              market: "ashare",
              symbol: "600000",
              strategyName: "SMA Trend / Bank Sector",
              metrics: {
                total_return_pct: 12.4,
                max_drawdown_pct: 5.8,
                win_rate_pct: winRatePct,
                trade_count: 42,
              },
              decisions: [],
              aiReport: {
                summary: "审计证据支持审慎看多，继续关注回撤约束。",
                risks: ["估值边际收窄"],
                improvements: ["补充量价确认"],
                disclaimer: "仅供研究。",
              },
            },
          ]}
          workspace={completedWorkspace}
        />,
      );
    const research = renderCompletedResearch(51);
    const backtest = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="backtest"
        workspace={completedWorkspace}
      />,
    );
    const aiReview = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="ai-review"
        workspace={completedWorkspace}
      />,
    );
    const missingComparison = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="research"
        workspace={{
          ...completedWorkspace,
          researchRun: {
            ...completedWorkspace.researchRun,
            dataSnapshot: {
              ...completedWorkspace.researchRun.dataSnapshot,
              sourceComparison: undefined,
            },
          },
        }}
      />,
    );
    const blockedComparison = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="research"
        workspace={{
          ...completedWorkspace,
          researchRun: {
            ...completedWorkspace.researchRun,
            dataSnapshot: {
              ...completedWorkspace.researchRun.dataSnapshot,
              sourceComparison: {
                ...completedWorkspace.researchRun.dataSnapshot.sourceComparison,
                status: "blocked",
              },
            },
          },
        }}
      />,
    );

    expect(research).toContain("运行指标（审计证据）");
    expect(research).toContain("研究摘要（历史回测）");
    expect(research).toContain("实时运行轨迹");
    expect(research).toContain("研究动态");
    expect(research).toContain("证据链");
    expect(research).toContain("最新 AI 研究摘要");
    expect(research).toContain("数据源血缘");
    expect(research).toContain("审计回放");
    expect(research).toContain("恢复与复现");
    expect(research).toContain("复权 / 时效");
    expect(research).toContain("qfq · fresh");
    expect(research).toContain("覆盖率");
    expect(research).toContain("100.0% · 缺口 0");
    expect(research).toContain("来源一致");
    expect(research).toContain("500 行重叠 · compariso…");
    expect(research).toContain("下一步");
    expect(research).toContain("无需处理");
    expect(missingComparison).toContain('<span class="design-status positive">暂无对照数据</span>');
    expect(missingComparison).toContain("无需处理");
    expect(blockedComparison).toContain('<span class="design-status risk">差异阻断</span>');
    expect(research).toContain("哈希已验证 · 无需网络");
    expect(research).toContain("ashare:Asia/Shanghai:static-session-template");
    expect(research).toContain("decision-snapshot-hash-reference");
    expect(backtest).toContain("快照身份");
    expect(backtest).toContain("decision-snapshot-hash-reference");
    expect(aiReview).toContain("快照身份");
    expect(aiReview).toContain("decision-snapshot-hash-reference");
    expect(research).toContain("12.40%");
    expect(research).toContain('aria-valuenow="51"');
    expect(research).toContain('pathLength="100"');
    expect(research).toContain('stroke="var(--amber)"');
    expect(research).toContain('stroke-dasharray="100"');
    expect(research).toContain('stroke-dashoffset="49"');
    expect(renderCompletedResearch(39.9)).toContain('stroke="var(--danger)"');
    expect(renderCompletedResearch(40)).toContain('stroke="var(--amber)"');
    expect(renderCompletedResearch(60)).toContain('stroke="var(--teal)"');
    expect(renderCompletedResearch(-10)).toContain('stroke-dashoffset="100"');
    expect(renderCompletedResearch(100)).toContain('stroke-dashoffset="0"');
    expect(renderCompletedResearch(120)).toContain('aria-valuenow="100"');
  });

  it("requires explicit approval before sending a derived summary to an external provider", () => {
    const research = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="research"
        researchPreparation={{
          ...baseProps.researchPreparation,
          providerId: "openai-compatible",
          providers: [
            ...baseProps.researchPreparation.providers,
            {
              configured: true,
              model: "note-model",
              providerId: "openai-compatible",
              sanitizedBaseUrl: "https://example.test/v1",
            },
          ],
        }}
      />,
    );

    expect(research).toContain("note-model");
    expect(research).toContain("https://example.test/v1");
    expect(research).toContain("市场、标的、周期、缓存区间、行数和派生统计");
    expect(research).toContain("不会发送原始 K 线或已有研究笔记");
    expect(research).toContain('id="research-note-external-approval"');
    expect(research).toContain('id="research-note-generate"');
    expect(research).toContain("disabled");
  });

  it("streams AI text in the note editor without rendering a duplicate preview", () => {
    const research = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="research"
        researchPreparation={{
          ...baseProps.researchPreparation,
          isGeneratingNote: true,
          noteDraft: "AI 草稿正在逐步写入",
        }}
      />,
    );

    expect(research).toContain("正在生成草稿");
    expect(research).toContain("AI 草稿正在逐步写入");
    expect(research).not.toContain("AI 已验证预览");
    expect(research).not.toContain("AI 已验证章节预览");
    expect(research.match(/<textarea[^>]*id="research-note-input"[^>]*>/)?.[0]).not.toContain("disabled");
    expect(research.match(/<button[^>]*id="research-note-save"[^>]*>/)?.[0]).toContain("disabled");
  });

  it("keeps draft generation errors visible without labeling the note as saved", () => {
    const research = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="research"
        researchPreparation={{
          ...baseProps.researchPreparation,
          generationError: "生成失败，原草稿已保留。",
          noteDraft: "用户正在编辑的内容",
        }}
      />,
    );

    expect(research).toContain('role="alert"');
    expect(research).toContain("生成失败，原草稿已保留。");
    expect(research).toContain("有未保存更改");
  });

  it("does not label an edited research note as saved", () => {
    const research = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="research"
        researchPreparation={{
          ...baseProps.researchPreparation,
          note: {
            source: "core",
            note: {
              body: "已保存的假设",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              updatedAt: "2026-07-17T12:00:00+08:00",
            },
          },
          noteDraft: "尚未保存的新假设",
          workspaceSaved: true,
        }}
      />,
    );

    expect(research).toContain("有未保存项");
    expect(research).toContain("有未保存更改");
    expect(research).not.toContain("准备已保存");
  });

  it("turns authoritative empty data into an explicit next-step state", () => {
    const backtest = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="backtest" />,
    );
    const portfolio = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="portfolio" />,
    );
    expect(backtest).toContain("暂无权威净值曲线");
    expect(backtest).toContain("当前运行未产生交易");
    expect(portfolio).toContain("暂无可展示的组合腿");
  });

  it("renders the authoritative portfolio step and an accessible equity ring", () => {
    const portfolio = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="portfolio"
        portfolioGoldenPath={{
          blockers: [],
          currentStepId: "portfolio-build",
          primaryActionId: "run-portfolio-backtest",
          status: "review",
          steps: [
            {
              actionId: "run-portfolio-backtest",
              detail: "portfolio-missing",
              id: "portfolio-build",
              label: "Portfolio build",
              passed: false,
              status: "review",
            },
            ...["risk-review", "operator-approval", "paper-simulation", "account-replay"].map(
              (id) => ({
                actionId: null,
                detail: "Pending",
                id,
                label: id,
                passed: false,
                status: "review" as const,
              }),
            ),
          ],
        }}
      />,
    );

    expect(portfolio).toContain('aria-current="step"');
    expect(portfolio).toContain('aria-label="组合权益占比"');
    expect(portfolio).toContain('aria-valuemax="100"');
    expect(portfolio).toContain('aria-valuenow="0"');
    expect(portfolio).not.toContain("design-portfolio-donut-value");
  });

  it("shows audited M5 current weights and authoritative portfolio checks instead of synthetic passes", () => {
    const portfolioRun = {
      name: "M5 组合",
      market: "ashare",
      timeframe: "1d",
      initialCash: 100_000,
      cashWeight: 0.1,
      metrics: {
        totalReturnPct: 1,
        annualReturnPct: 1,
        maxDrawdownPct: -8,
        winRatePct: 50,
        profitFactor: 1,
        tradeCount: 2,
      },
      equityCurve: [],
      legs: [
        {
          symbol: "600000",
          targetWeight: 0.55,
          startingValue: 55_000,
          endingValue: 56_000,
          contributionValue: 1_000,
          contributionReturnPct: 1.8,
          maxDrawdownPct: -4,
          tradeCount: 1,
          dataQuality: { source: "fixture", isComplete: true, warnings: [], rows: 30 },
        },
        {
          symbol: "000300",
          targetWeight: 0.35,
          startingValue: 35_000,
          endingValue: 36_000,
          contributionValue: 1_000,
          contributionReturnPct: 2.8,
          maxDrawdownPct: -3,
          tradeCount: 1,
          dataQuality: { source: "fixture", isComplete: true, warnings: [], rows: 30 },
        },
      ],
      dataQuality: { source: "fixture", isComplete: true, warnings: [], rows: 30 },
    } satisfies PortfolioBacktestRun;
    const risk = {
      kind: "aiqt.portfolioRiskAssessment",
      schemaVersion: 1,
      assessmentId: "portfolio-risk-1",
      createdAt: "2026-07-20T10:00:00+00:00",
      baseRunId: "run-a",
      workflowId: "workflow-1",
      workflowHash: "a".repeat(64),
      operator: "local-operator",
      classifications: [],
      observations: { dailyLossPct: 1, tradesToday: 2 },
      limits: {
        maxDrawdownPct: 20,
        maxDailyLossPct: 3,
        maxTradesPerDay: 20,
        maxTotalExposureWeight: 0.95,
        maxSymbolWeight: 0.4,
        maxIndustryWeight: 0.6,
        maxMarketWeight: 0.95,
        maxCurrencyWeight: 0.95,
        maxCorrelation: 0.8,
        maxRiskContributionPct: 60,
      },
      account: {
        source: "stage4_paper_replay",
        observedAt: "2026-07-20T09:00:00+00:00",
        equity: 100_000,
        cash: 70_000,
        unmatchedSymbols: [],
      },
      allocations: [
        {
          symbol: "600000",
          sourceRunId: "run-a",
          market: "ashare",
          industry: "银行",
          currency: "CNY",
          currentQuantity: 100,
          currentValue: 10_000,
          currentWeight: 0.1,
          targetWeight: 0.55,
          adjustedTargetWeight: 0.4,
          driftPct: -45,
          proposedDeltaValue: 30_000,
          side: "buy",
          status: "candidate",
          reason: "风险目标已下调",
        },
        {
          symbol: "000300",
          sourceRunId: "run-b",
          market: "ashare",
          industry: "宽基指数",
          currency: "CNY",
          currentQuantity: 50,
          currentValue: 20_000,
          currentWeight: 0.2,
          targetWeight: 0.35,
          adjustedTargetWeight: 0.35,
          driftPct: -15,
          proposedDeltaValue: 15_000,
          side: "buy",
          status: "candidate",
          reason: "纸面候选",
        },
      ],
      cash: {
        currentValue: 70_000,
        currentWeight: 0.7,
        targetWeight: 0.1,
        adjustedTargetWeight: 0.25,
        proposedDeltaValue: -45_000,
      },
      exposures: [
        {
          dimension: "industry",
          group: "银行",
          currentWeight: 0.1,
          targetWeight: 0.55,
          adjustedTargetWeight: 0.4,
          limit: 0.6,
          status: "reduced",
        },
      ],
      correlations: [],
      riskContributions: [],
      checks: [
        {
          checkId: "account_reconciliation",
          scope: "account",
          status: "passed",
          value: 0,
          limit: 0,
          unit: "count",
          reason: "账户持仓与本地目标组合已逐项匹配。",
        },
      ],
      batch: {
        status: "reduced",
        orders: [],
        blockedReasons: [],
      },
      summary: {
        currentExposureWeight: 0.3,
        targetExposureWeight: 0.9,
        adjustedTargetExposureWeight: 0.75,
        currentWeightSum: 1,
        targetWeightSum: 1,
        adjustedTargetWeightSum: 1,
        proposedTradeCount: 2,
        reducedTargetCount: 1,
        unmatchedHoldingCount: 0,
        blockedCheckCount: 0,
      },
      paperOnly: true,
      liveTradingAllowed: false,
      orderSubmissionEnabled: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      recordHash: "b".repeat(64),
    } as PortfolioRiskAssessment;

    const portfolio = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="portfolio"
        portfolio={portfolioRun}
        portfolioRiskAssessment={risk}
      />,
    );

    expect(portfolio).toContain("<td>55.00%</td><td>10.00%</td>");
    expect(portfolio).toContain("账户、目标与批次风险");
    expect(portfolio).toContain("账户 / 本地组合匹配");
    expect(portfolio).toContain("行业 / 市场 / 币种暴露");
    expect(portfolio).not.toContain("组合年化波动率");
    expect(portfolio).not.toContain("权威组合回测结果");
  });

  it("projects the existing production risk chain without turning research M5 into live execution", () => {
    const snapshot = {
      state: {
        dailyLossDrawdownPct: 0.03,
        dailyLossLimitPct: 2,
        dailyProfitDrawdownLimitPct: 20,
        dailyProfitDrawdownPct: 0.05,
        dailyRiskHaltReason: null,
        detail: "自动监控中",
        enabled: true,
        equity: 91.7056,
        executionMode: "live",
        liveConfirmed: true,
        liveSessionTtlHours: 0,
        lastAccountCheck: {
          accountCovered: true,
          positionCovered: true,
          quoteCovered: true,
          unexpectedOpenAutoOrderCount: 0,
        },
        lastDecisionContract: {
          strategyRevision: "bfef1234567890abcdef",
          riskAdjustedTarget: {
            approvedNotional: 0.6292,
            decision: "preserve",
            evidence: { recentTradeCount: 1 },
            reason: "账户覆盖与双回撤检查均通过。",
          },
        },
        liveAuthorizedUntil: "2026-07-31T05:40:50+08:00",
        maxTradesPerHour: 20,
        position: 0.00000986,
        runnerHealth: {
          status: "running",
        },
        runnerState: "running",
        symbol: "BTC/USDT",
        timeframe: "1m",
        tradeTimestamps: [],
      },
      strategyBinding: {
        auditRunId: null,
        kind: "builtin",
        name: "内置涨跌幅与 AI 自动策略",
        revision: "bfef1234567890abcdef",
        status: "ready",
        symbol: "BTC/USDT",
        timeframe: "1m",
      },
      liveBlockedBoundary: false,
      liveTradingAllowed: true,
      orderSubmissionEnabled: true,
    } as unknown as AutoTradingSnapshot;
    const props = {
      portfolioProductionRisk: {
        error: null,
        loading: false,
        onRefresh: () => undefined,
        snapshot,
      },
      productionStrategyHandoff: {
        binding: null,
        busy: false,
        errorLabel: null,
        onBind: async () => false,
        onOpenDynamicTrading: () => undefined,
        result: { source: "fallback" as const },
      },
    };
    const portfolio = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        {...props}
        activeWorkAreaId="portfolio"
      />,
    );

    expect(portfolio).toContain("独立生产策略与运行风险");
    expect(portfolio).toContain("独立生产链运行中 · 未覆盖当前研究组合");
    expect(portfolio).toContain("生产实盘 · 后台运行正常");
    expect(portfolio).toContain("内置涨跌幅与 AI 自动策略");
    expect(portfolio).toContain("bfef1234");
    expect(portfolio).toContain("保持目标");
    expect(portfolio).toContain("91.7056 USDT");
    expect(portfolio).toContain("0.03% / 2.00%");
    expect(portfolio).toContain("0.05% / 20.00%");
    expect(portfolio).toContain("1 / 20 笔");
    expect(portfolio).toContain("账户已覆盖");
    expect(portfolio).toContain("生产授权：永久有效");
    expect(portfolio).toContain("刷新生产风险");
    expect(portfolio).toContain("前往动态交易复核");
    expect(portfolio).toContain("M5 · 组合研究风险");
    expect(portfolio).toContain("该评估不写入生产风险链");
    expect(portfolio).not.toContain("模拟成交状态");
    expect(portfolio).not.toContain("回放精确性");
    expect(portfolio).not.toContain("交接为生产自动策略");
    expect(portfolio).not.toContain("授权实盘");
    expect(portfolio).not.toContain("立即评估");
    expect(portfolio).not.toContain("提交订单");

    const blocked = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        {...props}
        activeWorkAreaId="portfolio"
        portfolioProductionRisk={{
          ...props.portfolioProductionRisk,
          snapshot: {
            ...snapshot,
            liveBlockedBoundary: true,
            liveTradingAllowed: false,
          },
        }}
      />,
    );
    expect(blocked).toContain("生产风险链已阻断");

    const riskPaused = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        {...props}
        activeWorkAreaId="portfolio"
        portfolioProductionRisk={{
          ...props.portfolioProductionRisk,
          snapshot: {
            ...snapshot,
            state: {
              ...snapshot.state,
              dailyRiskHaltReason: "已达到当日亏损回撤上限。",
              lastAccountCheck: {
                ...snapshot.state.lastAccountCheck!,
                accountCovered: false,
              },
              runnerHealth: {
                ...snapshot.state.runnerHealth!,
                status: "blocked",
              },
            },
          },
        }}
      />,
    );
    expect(riskPaused).toContain("生产风险链已阻断");
    expect(riskPaused).toContain("已触发风险暂停");
  });

  it("keeps the redesigned operator approval step actionable", () => {
    const approvalRow: PortfolioPaperOrderApprovalRow = {
      id: "batch-1:order-1",
      portfolioName: "核心组合",
      batchId: "batch-1",
      baseRunId: "run-1",
      orderId: "order-1",
      symbol: "600519",
      side: "buy",
      quantity: 10,
      notionalValue: 12_530,
      riskStatus: "passed",
      state: "awaiting_operator_review",
      canApprove: true,
      canReject: true,
      approvedBy: null,
      reviewedAt: null,
      actionHint: "Operator approval or rejection is required before this paper-only order can move on.",
      tone: "warning",
    };
    const portfolio = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="portfolio"
        onApprovePortfolioOrder={() => undefined}
        onRejectPortfolioOrder={() => undefined}
        portfolioPaperOrderApprovalRows={[approvalRow]}
        portfolioGoldenPath={{
          blockers: ["operator-approval-required"],
          currentStepId: "operator-approval",
          primaryActionId: "review-portfolio-orders",
          status: "review",
          steps: [
            ...["portfolio-build", "risk-review"].map((id) => ({
              actionId: null,
              detail: "Complete",
              id,
              label: id,
              passed: true,
              status: "passed" as const,
            })),
            {
              actionId: "review-portfolio-orders",
              detail: "operator-approval-required",
              id: "operator-approval",
              label: "Operator approval",
              passed: false,
              status: "review" as const,
            },
            ...["paper-simulation", "account-replay"].map((id) => ({
              actionId: null,
              detail: "Pending",
              id,
              label: id,
              passed: false,
              status: "review" as const,
            })),
          ],
        }}
      />,
    );

    expect(portfolio).toContain("portfolio-order-approval");
    expect(portfolio).toContain("组合委托人工审批");
    expect(portfolio).toContain("order-1");
    expect(portfolio).toContain("风控已通过，等待人工批准或拒绝。");
    expect(portfolio).not.toContain("Operator approval or rejection");
    expect(portfolio).toContain("批准");
    expect(portfolio).toContain("拒绝");
  });

  it("does not present skipped hold rows as awaiting operator approval", () => {
    const portfolio = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="portfolio"
        portfolioPaperOrderApprovalRows={[
          {
            approvedBy: null,
            baseRunId: "run-1",
            batchId: "batch-1",
            canApprove: false,
            canReject: false,
            id: "batch-1:order-hold",
            notionalValue: 0,
            orderId: "order-hold",
            portfolioName: "核心组合",
            quantity: 0,
            reviewedAt: null,
            riskStatus: "passed",
            side: "hold",
            state: "skipped",
            symbol: "600519",
            actionHint: "当前无需生成模拟委托。",
            tone: "neutral",
          },
        ]}
      />,
    );

    expect(portfolio).toContain("无需人工审批");
    expect(portfolio).toContain("没有需审批委托");
    expect(portfolio).not.toContain("组合委托人工审批");
    expect(portfolio).not.toContain('class="portfolio-order-approval"');
  });

  it("keeps the operator approval target available while that step is active", () => {
    const portfolio = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="portfolio"
        portfolioGoldenPath={{
          blockers: ["operator-approval-required"],
          currentStepId: "operator-approval",
          primaryActionId: "review-portfolio-orders",
          status: "review",
          steps: ["portfolio-build", "risk-review", "operator-approval", "paper-simulation", "account-replay"].map(
            (id, index) => ({
              actionId: index === 2 ? "review-portfolio-orders" : null,
              detail: index < 2 ? "Complete" : "Pending",
              id,
              label: id,
              passed: index < 2,
              status: index < 2 ? "passed" as const : "review" as const,
            }),
          ),
        }}
        portfolioPaperOrderApprovalRows={[{
          approvedBy: null,
          baseRunId: "run-1",
          batchId: "batch-1",
          canApprove: false,
          canReject: false,
          id: "batch-1:order-hold",
          notionalValue: 0,
          orderId: "order-hold",
          portfolioName: "核心组合",
          quantity: 0,
          reviewedAt: null,
          riskStatus: "passed",
          side: "hold",
          state: "skipped",
          symbol: "600519",
          actionHint: "当前无需生成模拟委托。",
          tone: "neutral",
        }]}
      />,
    );

    expect(portfolio).toContain("组合委托人工审批");
    expect(portfolio).toContain('class="portfolio-order-approval"');
    expect(portfolio).toContain("无需人工操作");
  });

  it("explains why the portfolio golden path cannot continue", () => {
    const portfolio = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="portfolio"
        portfolioActionError="需要至少两个同市场、同周期且带权益曲线的审计运行。"
      />,
    );

    expect(portfolio).toContain('role="alert"');
    expect(portfolio).toContain("暂时无法继续黄金路径");
    expect(portfolio).toContain("需要至少两个同市场、同周期且带权益曲线的审计运行。");
  });

  it("uses the spare watchlist space for a truthful overview", () => {
    const market = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="market" />,
    );

    expect(market).toContain("当前自选概览");
    expect(market).toContain("4 个标的");
    expect(market).toContain("覆盖市场");
    expect(market).toContain("市场分布");
    expect(market).toContain("加密货币");
    expect(market).toContain("自选弱势排行");
    expect(market).not.toContain('aria-label="搜索行情"');
    expect(market).not.toContain("design-market-toolbar");
    expect(market).not.toContain("今开 —");
  });

  it("shows a server-backed market overview and actionable stock-selection results", () => {
    const discovery: MarketDiscoveryResult = {
      market: "ashare",
      source: "eastmoney",
      observedAt: "2026-07-30T08:00:00+00:00",
      freshness: "fresh",
      warnings: [],
      snapshotHash: "b".repeat(64),
      overview: {
        universeCount: 5_432,
        advancing: 3_100,
        declining: 2_100,
        flat: 232,
        totalAmount: 980_000_000_000,
      },
      totalMatched: 1,
      items: [{
        market: "ashare",
        symbol: "601318",
        name: "中国平安",
        price: 52.36,
        changePct: 2.15,
        volume: 36_800_000,
        amount: 1_920_000_000,
        turnoverRate: 0.75,
        peRatio: 7.8,
        pbRatio: 0.92,
        marketCap: 1_040_000_000_000,
        source: "eastmoney",
        observedAt: "2026-07-30T08:00:00+00:00",
      }],
    };
    const market = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market"
        marketDiscovery={{
          isLoading: false,
          onSearch: () => undefined,
          result: discovery,
        }}
        onResearchInstrument={() => undefined}
      />,
    );

    expect(market).toContain("市场概览");
    expect(market).toContain("全市场股票");
    expect(market).toContain("5,432");
    expect(market).toContain("上涨");
    expect(market).toContain("3,100");
    expect(market).toContain("条件选股");
    expect(market).toContain('aria-label="条件选股筛选"');
    expect(market).toContain('name="minChangePct"');
    expect(market).toContain("中国平安");
    expect(market).toContain("601318");
    expect(market).toContain(">查看并加入<");
    expect(market).not.toContain(">查看行情<");
    expect(market).not.toContain(">加入自选<");
    expect(market).toContain(">开始研究<");
  });

  it("renders auditable AI research candidates without watchlist or trading actions", () => {
    const candidate = {
      evidenceId: "evidence-600000",
      market: "ashare" as const,
      symbol: "600000",
      name: "浦发银行",
      score: 84.2,
      pillarScores: {
        quality: 80,
        growth: 72,
        valuation: 92,
        trend: 76,
        liquidityRisk: 86,
      },
      fundamentalPeriod: "2026 年一季度",
      dataGaps: ["第二财务源仍待复核"],
    };
    const result: MarketAiSelectionResult = {
      selectionId: "selection-test",
      status: "partial",
      generatedAt: "2026-07-31T08:00:00+00:00",
      marketSnapshot: {
        snapshotHash: "a".repeat(64),
        observedAt: "2026-07-31T08:00:00+00:00",
        source: "eastmoney",
        freshness: "partial",
        warnings: ["新闻源暂不可用，排名继续使用行情与基本面证据。"],
      },
      baselineCandidates: [candidate],
      recommendations: [{
        ...candidate,
        rank: 1,
        tier: "priority_research",
        reasons: ["质量与估值证据在当前候选中更完整。"],
        risks: ["历史表现不能保证未来结果。"],
        evidenceReferences: ["evidence-600000"],
        summary: "优先进入既有研究链继续核验。",
      }],
      exclusions: [{
        market: "ashare",
        symbol: "600001",
        name: "示例公司",
        reason: "缺少上一可比报告期净利润。",
      }],
      generation: {
        requestedProvider: "local",
        usedProvider: "local",
        status: "skipped",
        fallbackUsed: false,
        model: null,
        sanitizedBaseUrl: null,
        latencyMs: 0,
        externalDataApproved: false,
        outboundFields: [],
        errorCode: null,
      },
      auditEventId: "market-ai-selection-selection-test",
      boundary: {
        researchOnly: true,
        watchlistModified: false,
        researchStarted: false,
        riskModified: false,
        autoTradingModified: false,
        orderSubmissionAllowed: false,
        routeExecuted: false,
      },
    };
    const requestKey = JSON.stringify({
      market: "ashare",
      universeMode: "discovery",
      discovery: { sort: "changePct", direction: "desc" },
      profile: "balanced",
      horizon: "medium",
      providerId: "local",
      externalDataApproved: false,
    });
    const market = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market"
        marketAiSelection={{
          isLoading: false,
          onResearchInstrument: () => undefined,
          onRun: () => undefined,
          onViewInstrument: () => undefined,
          requestKey,
          result,
        }}
        marketDiscovery={{
          isLoading: false,
          onSearch: () => undefined,
          result: null,
        }}
      />,
    );

    expect(market).toContain("AI 选股");
    expect(market).toContain("A 股全市场");
    expect(market).toContain("Binance USDT");
    expect(market).toContain("美股自选池");
    expect(market).toContain("AI 分析当前候选");
    expect(market).toContain("确定性基准候选");
    expect(market).toContain("浦发银行");
    expect(market).toContain("流动性与风险");
    expect(market).toContain("2026 年一季度");
    expect(market).toContain("第二财务源仍待复核");
    expect(market).toContain("已排除 1 项");
    expect(market).toContain("缺少上一可比报告期净利润");
    expect(market).toContain(">查看行情<");
    expect(market).toContain(">开始研究<");
    expect(market).toContain("不修改自选、风控、自动交易或订单路由");
    expect(market).not.toContain(">查看并加入<");
    expect(market).not.toContain(">加入自选<");
    expect(market).not.toContain("目标价");
    expect(market).not.toContain("提交订单");
  });

  it("marks an AI selection stale when the current controls no longer match", () => {
    const result: MarketAiSelectionResult = {
      selectionId: "selection-stale",
      status: "completed",
      generatedAt: "2026-07-31T08:00:00+00:00",
      marketSnapshot: {
        snapshotHash: "b".repeat(64),
        observedAt: "2026-07-31T08:00:00+00:00",
        source: "eastmoney",
        freshness: "fresh",
        warnings: [],
      },
      baselineCandidates: [],
      recommendations: [],
      exclusions: [],
      generation: {
        requestedProvider: "local",
        usedProvider: "local",
        status: "skipped",
        fallbackUsed: false,
        model: null,
        sanitizedBaseUrl: null,
        latencyMs: 0,
        externalDataApproved: false,
        outboundFields: [],
        errorCode: null,
      },
      auditEventId: "market-ai-selection-selection-stale",
      boundary: {
        researchOnly: true,
        watchlistModified: false,
        researchStarted: false,
        riskModified: false,
        autoTradingModified: false,
        orderSubmissionAllowed: false,
        routeExecuted: false,
      },
    };
    const market = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market"
        marketAiSelection={{
          isLoading: false,
          onResearchInstrument: () => undefined,
          onRun: () => undefined,
          onViewInstrument: () => undefined,
          requestKey: "old-request",
          result,
        }}
        marketDiscovery={{
          isLoading: false,
          onSearch: () => undefined,
          result: null,
        }}
      />,
    );

    expect(market).toContain("旧结果已失效");
    expect(market).toContain("请重新分析");
  });

  it("shows Binance USDT spot discovery with crypto-specific labels and fields", () => {
    const cryptoInstrument = {
      market: "crypto" as const,
      symbol: "SHIB/USDT",
      name: "SHIB",
      price: 0.00001234,
      changePct: 2.15,
      quoteSource: "binance-data-api",
      quoteAsOf: "2026-07-31T08:00:00+00:00",
    };
    const discovery: MarketDiscoveryResult = {
      market: "crypto",
      source: "binance-data-api",
      observedAt: "2026-07-31T08:00:00+00:00",
      freshness: "fresh",
      warnings: [],
      snapshotHash: "e".repeat(64),
      overview: {
        universeCount: 480,
        advancing: 250,
        declining: 220,
        flat: 10,
        totalAmount: 12_345_678_900,
      },
      totalMatched: 1,
      items: [{
        market: "crypto",
        symbol: "SHIB/USDT",
        name: "SHIB",
        price: 0.00001234,
        changePct: 2.15,
        volume: 9_876_543_210,
        amount: 123_456.78,
        turnoverRate: null,
        peRatio: null,
        pbRatio: null,
        marketCap: null,
        source: "binance-data-api",
        observedAt: "2026-07-31T08:00:00+00:00",
      }],
    };
    const market = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market"
        marketDiscovery={{
          isLoading: false,
          onSearch: () => undefined,
          result: discovery,
        }}
        onResearchInstrument={() => undefined}
        workspace={{
          ...workspace,
          selectedInstrument: cryptoInstrument,
          watchlist: [...workspace.watchlist, cryptoInstrument],
        }}
      />,
    );

    expect(market).toContain("Binance USDT 现货市场");
    expect(market).toContain("USDT 现货交易对");
    expect(market).toContain("交易对筛选");
    expect(market).toContain('aria-label="交易对筛选"');
    expect(market).toContain("24 小时成交额");
    expect(market).toContain("24 小时成交量（基础资产）");
    expect(market).toContain("9,876,543,210 SHIB");
    expect(market.split("0.00001234")).toHaveLength(4);
    expect(market).toContain("来源 Binance 公开现货行情");
    expect(market).toContain("仅覆盖 Binance 当前可交易的 USDT 现货交易对");
    expect(market).not.toContain('name="minTurnoverRate"');
    expect(market).not.toContain('name="maxPe"');
    expect(market).not.toContain("<th>换手率</th>");
    expect(market).not.toContain("<th>市盈率</th>");
    expect(market).not.toContain("<th>总市值</th>");
  });

  it("renders market information as a separate read-only page", () => {
    const item = {
      market: "ashare" as const,
      symbol: "600000",
      name: "浦发银行",
      price: 10.25,
      changePct: 2.5,
      volume: 1_000,
      amount: 2_000_000,
      turnoverRate: 1.2,
      peRatio: 6.5,
      pbRatio: 0.8,
      marketCap: 200_000_000_000,
      source: "eastmoney",
      observedAt: "2026-07-31T01:00:00+00:00",
    };
    const result: MarketInformationResult = {
      market: "ashare",
      symbol: "600000",
      section: "all",
      overview: {
        universeCount: 5_432,
        advancing: 3_100,
        declining: 2_100,
        flat: 232,
        totalAmount: 980_000_000_000,
      },
      leaders: [item],
      active: [{ ...item, symbol: "601318", name: "中国平安" }],
      news: [
        {
          id: "market-news",
          headline: "A 股早盘重要快讯",
          summary: "市场成交活跃。",
          publishedAt: "2026-07-31T01:00:00+00:00",
          source: "东方财富",
          scope: "market",
          url: "https://finance.eastmoney.com/a/market-news.html",
        },
        {
          id: "instrument-news",
          headline: "浦发银行发布公告",
          summary: "公司披露最新公告。",
          publishedAt: "2026-07-31T00:30:00+00:00",
          source: "证券时报",
          scope: "instrument",
          url: "https://finance.eastmoney.com/a/instrument-news.html",
        },
        ...Array.from({ length: 18 }, (_, index) => ({
          id: `more-news-${index}`,
          headline: `更多新闻 ${index + 1}`,
          summary: "用于验证新闻分页。",
          publishedAt: "2026-07-31T00:00:00+00:00",
          source: "东方财富",
          scope: "market" as const,
          url: null,
        })),
      ],
      pagination: {
        limit: 20,
        offset: 0,
        hasMore: true,
        scope: "all",
      },
      source: "binance-data-api+finnhub",
      observedAt: "2026-07-31T01:05:00+00:00",
      freshness: "fresh",
      warnings: [],
      snapshotHash: "f".repeat(64),
    };
    const information = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market-information"
        marketInformation={{
          isLoading: false,
          isLoadingNews: false,
          market: "ashare",
          newsResult: result,
          onMarketChange: () => undefined,
          onNewsPageChange: () => undefined,
          onRefresh: () => undefined,
          result,
          symbol: "600000",
        }}
      />,
    );

    expect(information).toContain("市场资讯");
    expect(information).toContain('aria-label="市场切换"');
    expect(information).toContain(">A 股<");
    expect(information).toContain(">美股<");
    expect(information).toContain(">加密货币<");
    expect(information).toContain("市场概览");
    expect(information).toContain("涨幅领先");
    expect(information).toContain("成交活跃");
    expect(information).toContain('role="tablist"');
    expect(information).toContain(">全部<");
    expect(information).toContain(">市场快讯<");
    expect(information).toContain(">标的资讯<");
    expect(information).toContain("新闻资讯");
    expect(information).not.toContain("新闻与公告");
    expect(information).toContain("来源 Binance 公开现货行情、Finnhub 新闻");
    expect(information).not.toContain("binance-data-api+finnhub");
    expect(information).toContain("A 股早盘重要快讯");
    expect(information).toContain("浦发银行发布公告");
    expect(information).toContain("第 1 页 · 本页 20 条");
    expect(information).toContain(">上一页<");
    expect(information).toContain(">下一页<");
    expect(information).not.toContain("更多新闻 19");
    expect(information).toContain('target="_blank"');
    expect(information).toContain('rel="noreferrer noopener"');
    expect(information).not.toContain("开始交易");
  });

  it("keeps the information market independent from the selected watchlist instrument", () => {
    const result: MarketInformationResult = {
      market: "ashare",
      symbol: "",
      section: "all",
      overview: {
        universeCount: 5_432,
        advancing: 3_100,
        declining: 2_100,
        flat: 232,
        totalAmount: 980_000_000_000,
      },
      leaders: [],
      active: [],
      news: [],
      pagination: { limit: 20, offset: 0, hasMore: false, scope: "all" },
      source: "eastmoney",
      observedAt: "2026-07-31T01:05:00+00:00",
      freshness: "fresh",
      warnings: [],
      snapshotHash: "f".repeat(64),
    };
    const information = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market-information"
        marketInformation={{
          isLoading: false,
          isLoadingNews: false,
          market: "ashare",
          newsResult: result,
          onMarketChange: () => undefined,
          onNewsPageChange: () => undefined,
          onRefresh: () => undefined,
          result,
          symbol: "",
        }}
        workspace={{
          ...workspace,
          selectedInstrument: {
            ...workspace.selectedInstrument,
            market: "crypto",
            symbol: "BTC/USDT",
            name: "Bitcoin",
          },
        }}
      />,
    );

    expect(information).toContain("A 股市场快照");
    expect(information).toContain(
      'aria-selected="true" class="active" role="tab" type="button">A 股</button>',
    );
    expect(information).not.toContain("等待市场资讯");
  });

  it("renders the backend news page without slicing it again", () => {
    const result: MarketInformationResult = {
      market: "ashare",
      symbol: "600000",
      section: "all",
      overview: {
        universeCount: 1,
        advancing: 1,
        declining: 0,
        flat: 0,
        totalAmount: 1,
      },
      leaders: [],
      active: [],
      news: [{
        id: "page-two-news",
        headline: "第二页后端新闻",
        summary: "",
        publishedAt: "2026-07-30T23:00:00+00:00",
        source: "东方财富",
        scope: "market",
        url: null,
      }],
      pagination: {
        limit: 20,
        offset: 20,
        hasMore: false,
        scope: "all",
      },
      source: "eastmoney",
      observedAt: "2026-07-31T01:05:00+00:00",
      freshness: "fresh",
      warnings: [],
      snapshotHash: "e".repeat(64),
    };
    const information = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market-information"
        marketInformation={{
          isLoading: false,
          isLoadingNews: false,
          market: "ashare",
          newsResult: result,
          onMarketChange: () => undefined,
          onNewsPageChange: () => undefined,
          onRefresh: () => undefined,
          result,
          symbol: "600000",
        }}
      />,
    );

    expect(information).toContain("第二页后端新闻");
    expect(information).toContain("第 2 页 · 本页 1 条");
    expect(information).toContain('<button type="button">上一页</button>');
    expect(information).toContain('<button disabled="" type="button">下一页</button>');
  });

  it("does not present an unavailable US market breadth as real zero statistics", () => {
    const usInstrument = {
      market: "us" as const,
      symbol: "AAPL",
      name: "Apple",
      price: 210,
      changePct: 0.5,
      quoteSource: "finnhub",
      quoteAsOf: "2026-07-31T01:00:00+00:00",
    };
    const result: MarketInformationResult = {
      market: "us",
      symbol: "AAPL",
      section: "all",
      overview: {
        universeCount: 0,
        advancing: 0,
        declining: 0,
        flat: 0,
        totalAmount: 0,
      },
      leaders: [],
      active: [],
      news: [],
      pagination: { limit: 20, offset: 0, hasMore: false, scope: "all" },
      source: "finnhub",
      observedAt: "2026-07-31T01:05:00+00:00",
      freshness: "fresh",
      warnings: ["美股市场广度暂未接入。"],
      snapshotHash: "a".repeat(64),
    };
    const information = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market-information"
        marketInformation={{
          isLoading: false,
          isLoadingNews: false,
          market: "us",
          newsResult: result,
          onMarketChange: () => undefined,
          onNewsPageChange: () => undefined,
          onRefresh: () => undefined,
          result,
          symbol: "AAPL",
        }}
        workspace={{
          ...workspace,
          selectedInstrument: usInstrument,
        }}
      />,
    );

    expect(information).toContain("市场广度暂未接入");
    expect(information).not.toContain("<span>覆盖标的</span>");
    expect(information).not.toContain("<span>成交额</span>");
    expect(information).toContain("暂无资讯");
  });

  it("shows explicit loading and matching error states for market information", () => {
    const loading = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market-information"
        marketInformation={{
          isLoading: true,
          isLoadingNews: true,
          market: workspace.selectedInstrument.market,
          newsResult: null,
          onMarketChange: () => undefined,
          onNewsPageChange: () => undefined,
          onRefresh: () => undefined,
          result: null,
          symbol: workspace.selectedInstrument.symbol,
        }}
      />,
    );
    const preview: MarketInformationResult = {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      section: "news",
      overview: {
        universeCount: 0,
        advancing: 0,
        declining: 0,
        flat: 0,
        totalAmount: 0,
      },
      leaders: [],
      active: [],
      news: [{
        id: "preview-news",
        headline: "新闻先行展示",
        summary: "市场排行仍在加载。",
        publishedAt: "2026-07-31T01:00:00+00:00",
        source: "东方财富",
        scope: "market",
        url: null,
      }],
      pagination: { limit: 20, offset: 0, hasMore: true, scope: "all" },
      source: "eastmoney",
      observedAt: "2026-07-31T01:05:00+00:00",
      freshness: "fresh",
      warnings: [],
      snapshotHash: "b".repeat(64),
    };
    const previewLoading = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market-information"
        marketInformation={{
          isLoading: true,
          isLoadingNews: false,
          market: workspace.selectedInstrument.market,
          newsResult: preview,
          onMarketChange: () => undefined,
          onNewsPageChange: () => undefined,
          onRefresh: () => undefined,
          result: null,
          symbol: workspace.selectedInstrument.symbol,
        }}
      />,
    );
    const failed: MarketInformationResult = {
      market: workspace.selectedInstrument.market,
      symbol: workspace.selectedInstrument.symbol,
      section: "all",
      overview: {
        universeCount: 0,
        advancing: 0,
        declining: 0,
        flat: 0,
        totalAmount: 0,
      },
      leaders: [],
      active: [],
      news: [],
      pagination: { limit: 20, offset: 0, hasMore: false, scope: "all" },
      source: "fallback",
      observedAt: "",
      freshness: "stale",
      warnings: [],
      snapshotHash: "",
      error: "上游资讯服务暂时不可用",
    };
    const error = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market-information"
        marketInformation={{
          isLoading: false,
          isLoadingNews: false,
          market: workspace.selectedInstrument.market,
          newsResult: failed,
          onMarketChange: () => undefined,
          onNewsPageChange: () => undefined,
          onRefresh: () => undefined,
          result: failed,
          symbol: workspace.selectedInstrument.symbol,
        }}
      />,
    );

    expect(loading).toContain('role="status"');
    expect(loading).toContain("正在加载最新资讯");
    expect(previewLoading).toContain("新闻先行展示");
    expect(previewLoading).toContain("正在加载市场概览与排行");
    expect(previewLoading).not.toContain("覆盖标的");
    expect(previewLoading).not.toContain("涨幅领先");
    expect(error).toContain('role="alert"');
    expect(error).toContain("上游资讯服务暂时不可用");
    expect(error).toContain("重新加载");
    expect(error).not.toContain("<span>覆盖标的</span>");
  });

  it("shows an explicit loading state while market discovery is running", () => {
    const market = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market"
        marketDiscovery={{
          isLoading: true,
          onSearch: () => undefined,
          result: null,
        }}
      />,
    );

    expect(market).toContain('role="status"');
    expect(market).toContain("正在加载全市场快照与候选");
    expect(market).toContain("筛选中…");
  });

  it("shows a market discovery error without presenting zeroes as a real snapshot", () => {
    const market = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market"
        marketDiscovery={{
          isLoading: false,
          onSearch: () => undefined,
          result: {
            market: "ashare",
            source: "fallback",
            observedAt: "",
            freshness: "unavailable",
            warnings: [],
            snapshotHash: "",
            overview: {
              universeCount: 0,
              advancing: 0,
              declining: 0,
              flat: 0,
              totalAmount: 0,
            },
            totalMatched: 0,
            items: [],
            error: "HTTP 503",
          },
        }}
      />,
    );

    expect(market).toContain('role="alert"');
    expect(market).toContain("暂时无法加载市场概览与选股结果");
    expect(market).toContain("HTTP 503");
    expect(market).toContain("全市场股票</span><strong class=\"\">—");
  });

  it("explains when no stocks match the current discovery filters", () => {
    const market = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market"
        marketDiscovery={{
          isLoading: false,
          onSearch: () => undefined,
          result: {
            market: "ashare",
            source: "eastmoney",
            observedAt: "2026-07-30T08:00:00+00:00",
            freshness: "fresh",
            warnings: [],
            snapshotHash: "c".repeat(64),
            overview: {
              universeCount: 5_432,
              advancing: 3_100,
              declining: 2_100,
              flat: 232,
              totalAmount: 980_000_000_000,
            },
            totalMatched: 0,
            items: [],
          },
        }}
      />,
    );

    expect(market).toContain('role="status"');
    expect(market).toContain("没有符合当前条件的股票");
    expect(market).toContain("请放宽筛选条件后重试");
  });

  it("localizes discovery source and exposes freshness warnings", () => {
    const market = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market"
        marketDiscovery={{
          isLoading: false,
          onSearch: () => undefined,
          result: {
            market: "ashare",
            source: "akshare-sina",
            observedAt: "2026-07-30T08:00:00+00:00",
            freshness: "stale",
            warnings: ["降级行情不含换手率与估值字段。"],
            snapshotHash: "d".repeat(64),
            overview: {
              universeCount: 5_432,
              advancing: 3_100,
              declining: 2_100,
              flat: 232,
              totalAmount: 980_000_000_000,
            },
            totalMatched: 0,
            items: [],
          },
        }}
      />,
    );

    expect(market).toContain("来源 新浪行情（AKShare）");
    expect(market).toContain("数据可能延迟");
    expect(market).toContain("降级行情不含换手率与估值字段。");
    expect(market).not.toContain("来源 akshare-sina");
  });

  it("shows the selected market calendar instead of fixed A-share trading hours", () => {
    const cryptoInstrument = workspace.watchlist.find((instrument) => instrument.market === "crypto")!;
    const crypto = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        {...{
          marketCalendar: {
            market: "crypto" as const,
            timezone: "UTC",
            status: "always_open" as const,
            isOpen: true,
            session: "continuous",
            asOf: "2026-07-19T10:35:34+00:00",
            tradingDay: "2026-07-19",
            nextOpen: null,
            nextClose: null,
            detail: "Crypto markets trade continuously.",
            warnings: [],
            source: "static-session-template",
          },
        }}
        activeWorkAreaId="market"
        source="core"
        workspace={{ ...workspace, selectedInstrument: cryptoInstrument }}
      />,
    );

    expect(crypto).toContain("全天交易");
    expect(crypto).toContain("24/7");
    expect(crypto).not.toContain("09:30");

    const weekend = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        {...{
          marketCalendar: {
            market: "ashare" as const,
            timezone: "Asia/Shanghai",
            status: "closed" as const,
            isOpen: false,
            session: "weekend",
            asOf: "2026-07-19T18:35:34+08:00",
            tradingDay: "2026-07-19",
            nextOpen: "2026-07-20T09:30:00+08:00",
            nextClose: null,
            detail: "A-share market is closed for the weekend.",
            warnings: [],
            source: "static-session-template",
          },
        }}
        activeWorkAreaId="market"
        source="core"
      />,
    );

    expect(weekend).toContain("休市");
    expect(weekend).toContain("下次开盘");
    expect(weekend).not.toContain(">交易中<");
  });

  it("renders every dense watchlist row in all market tables", () => {
    const denseWorkspace: typeof workspace = {
      ...workspace,
      watchlist: [
        ...workspace.watchlist,
        { symbol: "600001", name: "邯郸钢铁", market: "ashare", changePct: 0 },
        { symbol: "600005", name: "武钢股份", market: "ashare", changePct: 0 },
        { symbol: "601398", name: "工商银行", market: "ashare", changePct: 0 },
        { symbol: "000001", name: "平安银行", market: "ashare", changePct: 0 },
      ],
    };
    const market = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="market" workspace={denseWorkspace} />,
    );

    expect(market).toContain("8 个标的");
    expect(market.match(/>601398</g)).toHaveLength(4);
    expect(market).toContain("当前自选概览");
  });

  it("renders market editing and timeframe controls as real buttons", () => {
    const market = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="market" />,
    );

    expect(market).toContain('aria-pressed="false" class="design-link-button" type="button">编辑</button>');
    expect(market).toContain('aria-pressed="false" class="" type="button">1 分</button>');
    expect(market).toContain('aria-pressed="false" class="" type="button">5 分</button>');
    expect(market).toContain('aria-pressed="true" class="active" type="button">日 K</button>');
    expect(market).toContain('aria-pressed="false" class="" type="button">周 K</button>');
    expect(market).not.toContain("<span>1 分</span>");
  });

  it("shows a disabled retry state while the shared market refresh action is running", () => {
    const market = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        action={{ label: "刷新中…", onClick: () => undefined, disabled: true }}
        activeWorkAreaId="market"
      />,
    );

    expect(market).toContain("design-market-retry-panel");
    expect(market).toContain(
      '<button class="design-secondary-action design-market-retry-action" disabled="" type="button">重试中…</button>',
    );
  });

  it("shows the latest watchlist refresh result instead of a fixed success state", () => {
    const market = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market"
        latestWatchlistCacheRefresh={{
          runId: "cache-refresh-test",
          createdAt: "2026-07-16T02:30:00+00:00",
          timeframe: "1d",
          requestedLimit: 500,
          summary: { totalSymbols: 4, refreshed: 3, skipped: 0, failed: 1, upsertedRows: 1500 },
          items: [],
        }}
      />,
    );

    expect(market).toContain("部分失败");
    expect(market).toContain("1,500");
    expect(market).not.toContain("等待首次刷新");
  });

  it("surfaces skipped and failed refresh attempts instead of reusing an old success", () => {
    const skipped = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market"
        latestWatchlistCacheRefresh={{
          runId: "cache-refresh-skipped",
          createdAt: "2026-07-16T02:30:00+00:00",
          timeframe: "1d",
          requestedLimit: 500,
          summary: { totalSymbols: 4, refreshed: 0, skipped: 4, failed: 0, upsertedRows: 0 },
          items: [],
        }}
      />,
    );
    const failed = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="market"
        latestWatchlistCacheRefresh={{
          runId: "cache-refresh-old-success",
          createdAt: "2026-07-16T01:30:00+00:00",
          timeframe: "1d",
          requestedLimit: 500,
          summary: { totalSymbols: 4, refreshed: 4, skipped: 0, failed: 0, upsertedRows: 1500 },
          items: [],
        }}
        marketRefreshIssue="数据源当前不可用"
      />,
    );

    expect(skipped).toContain("全部跳过");
    expect(failed).toContain("刷新未完成");
    expect(failed).toContain("数据源当前不可用");
    expect(failed).toContain("本次尝试");
    expect(failed).toContain("更新条数</span><strong>—</strong>");
    expect(failed.indexOf("design-market-retry-panel")).toBeLessThan(
      failed.indexOf("数据源当前不可用"),
    );
  });
});
