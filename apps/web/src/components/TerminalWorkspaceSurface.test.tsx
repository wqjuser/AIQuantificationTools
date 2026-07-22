import { createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  buildBrokerAdapterRows,
  buildTerminalWorkspace,
  type PortfolioPaperOrderApprovalRow,
  type ProductWorkAreaId,
  type StrategyExperimentListItem,
} from "../lib/terminal-workbench";
import type { AuthoritativeAiReviewRun } from "../lib/ai-review-stage3";
import { TerminalWorkspaceSurface } from "./TerminalWorkspaceSurface";

describe("TerminalWorkspaceSurface", () => {
  const workAreaIds: ProductWorkAreaId[] = [
    "market",
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
      busy: false,
      comparisonExperimentIds: [],
      currentReview: null,
      decisions: [],
      error: null,
      experiments: [],
      externalDataApproved: false,
      history: [],
      onComparisonToggle: () => undefined,
      onExternalDataApprovedChange: () => undefined,
      onProviderChange: () => undefined,
      primaryExperimentId: null,
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
    executionCandidate: null,
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
      busy: false,
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
    }
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
  });

  it("keeps live trading and order submission visibly blocked", () => {
    const execution = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="execution" />,
    );
    const settings = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="settings" />,
    );
    expect(execution).toContain("liveTradingAllowed=false");
    expect(execution).toContain("orderSubmissionEnabled=false");
    expect(settings).toContain("实盘阻断边界");
  });

  it("keeps the existing execution prerequisite controls reachable in the redesigned surface", () => {
    const execution = renderToStaticMarkup(
      <TerminalWorkspaceSurface
        {...baseProps}
        activeWorkAreaId="execution"
        executionReadiness={(
          <details className="execution-readiness-stack">
            <summary>生产准入与测试网证据</summary>
            <button type="button">开始 Stage 5 影子执行</button>
          </details>
        )}
      />,
    );

    expect(execution).toContain("生产准入与测试网证据");
    expect(execution).toContain("开始 Stage 5 影子执行");
    expect(execution).toContain("design-execution-readiness");
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
        },
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 500,
          start: "2024-05-31T00:00:00+08:00",
          end: "2026-07-20T00:00:00+08:00",
          hash: "snapshot-hash-reference",
          bars: [],
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

    expect(research).toContain("运行指标（审计证据）");
    expect(research).toContain("研究摘要（历史回测）");
    expect(research).toContain("实时运行轨迹");
    expect(research).toContain("研究动态");
    expect(research).toContain("证据链");
    expect(research).toContain("最新 AI 研究摘要");
    expect(research).toContain("数据源血缘");
    expect(research).toContain("审计回放");
    expect(research).toContain("恢复与复现");
    expect(research).toContain("snapshot-hash-reference");
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
    const execution = renderToStaticMarkup(
      <TerminalWorkspaceSurface {...baseProps} activeWorkAreaId="execution" />,
    );

    expect(backtest).toContain("暂无权威净值曲线");
    expect(backtest).toContain("当前运行未产生交易");
    expect(portfolio).toContain("暂无可展示的组合腿");
    expect(execution).toContain("暂无权威影子候选");
    expect(execution).toContain("不会提交真实订单");
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
