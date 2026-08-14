import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  buildStrategyResearchProposalRequest,
  canLaunchStrategyResearch,
  createStrategyResearchApprovalAttemptGuard,
  createStrategyResearchProposalRequestCoordinator,
  reduceStrategyResearchApproval,
  strategyResearchApprovalContextKey,
  strategyResearchSourceQualification,
  StrategyResearchSection,
  StrategyResearchPaperBoundaryNotice,
} from "./StrategyResearchSection";

function tag(markup: string, testId: string): string {
  return markup.match(new RegExp(`<[^>]+data-testid="${testId}"[^>]*>`))?.[0] ?? "";
}

describe("StrategyResearchSection", () => {
  const capabilities = [
    {
      templateId: "regime-breakout-v2",
      version: "2",
      policyKind: "regime_breakout_v2",
      market: "crypto",
      symbol: "BTC/USDT",
      timeframe: "1m",
      sealedData: {
        hashVersion: "aiqt-sealed-v1" as const,
        minimumRows: 142_919,
        minimumPreRollRows: 13_319,
        developmentScoringRows: 103_680,
        withheldRows: 25_920,
      },
      parameterSchema: [{
        policyPath: "regime.closeAboveSmaWindow",
        type: "integer" as const,
        minimum: 2,
        maximum: 500,
      }],
      evaluatorVersion: "strategy-evaluator-v2",
    },
    {
      templateId: "cost-aware-range-reversion-v1-1",
      version: "1.1",
      policyKind: "cost_aware_range_reversion_v1_1",
      market: "crypto",
      symbol: "BTC/USDT",
      timeframe: "1m",
      sealedData: {
        hashVersion: "aiqt-sealed-v1" as const,
        minimumRows: 163_199,
        minimumPreRollRows: 33_599,
        developmentScoringRows: 103_680,
        withheldRows: 25_920,
      },
      parameterSchema: [{
        policyPath: "reversion.entryZThreshold",
        type: "number" as const,
        minimum: -100,
        maximum: 100,
      }],
      evaluatorVersion: "strategy-evaluator-v2",
    },
  ];
  const eligibleSource = {
    runId: "run-source",
    market: "crypto",
    symbol: "BTC/USDT",
    timeframe: "1m",
    executionMode: "paper_only",
    snapshotHashVersion: "aiqt-sealed-v1",
    snapshotComplete: true,
    snapshotBarsExposed: false,
  } as const;

  it("offers only registered research inputs and keeps launch explicitly blocked", () => {
    const markup = renderToStaticMarkup(
      <StrategyResearchSection
        baseUrl="/"
        capabilities={capabilities}
        providers={[
          { providerId: "local", configured: true, model: null, sanitizedBaseUrl: null },
          { providerId: "openai", configured: true, model: "gpt-test", sanitizedBaseUrl: "https://api.example.com" },
        ]}
        sourceMetadata={eligibleSource}
        sourceRunId="run-source"
      />,
    );

    expect(markup).toContain("AI 策略研发");
    expect(markup).toContain("市场状态突破策略");
    expect(markup).toContain("成本约束区间回归策略");
    expect(markup).not.toContain(">regime-breakout-v2<");
    expect(markup).not.toContain(">cost-aware-range-reversion-v1-1<");
    expect(markup).toContain("服务端按当前策略族自动匹配");
    expect(markup).toContain("提升样本外稳健性");
    expect(markup).toContain("仅注册模板");
    expect(tag(markup, "strategy-research-propose")).not.toContain("disabled");
    expect(tag(markup, "strategy-research-confirm-launch")).not.toContain("checked");
    expect(tag(markup, "strategy-research-launch")).toContain("disabled");
    expect(markup).toContain("不会自动晋级、绑定、启动监控或提交订单");
    expect(markup).toContain("Paper-only");
    expect(markup).not.toContain("上传 K 线");
    expect(markup).not.toContain("上传指标");
    expect(markup).not.toContain("Testnet");
  });

  it("requires a persisted proposal, named operator, confirmation and idle state", () => {
    expect(canLaunchStrategyResearch(null, "quant.user", true, false)).toBe(false);
    expect(canLaunchStrategyResearch("proposal-1", "", true, false)).toBe(false);
    expect(canLaunchStrategyResearch("proposal-1", "quant.user", false, false)).toBe(false);
    expect(canLaunchStrategyResearch("proposal-1", "quant.user", true, true)).toBe(false);
    expect(canLaunchStrategyResearch("proposal-1", "quant.user", true, false)).toBe(true);
  });

  it("blocks proposal generation until an audited source run exists", () => {
    const markup = renderToStaticMarkup(
      <StrategyResearchSection
        baseUrl="/"
        capabilities={capabilities}
        providers={[
          { providerId: "local", configured: true, model: null, sanitizedBaseUrl: null },
        ]}
        sourceMetadata={null}
        sourceRunId={null}
      />,
    );

    expect(tag(markup, "strategy-research-propose")).toContain("disabled");
    expect(markup).toContain("先加载一份服务端审计研究运行");
  });

  it("fails closed until the current source is a formal sealed paper-only P0 run", () => {
    expect(strategyResearchSourceQualification("run-source", {
      ...eligibleSource,
      snapshotHashVersion: "aiqt-data-v2",
      snapshotBarsExposed: true,
    }).eligible).toBe(false);

    const markup = renderToStaticMarkup(
      <StrategyResearchSection
        baseUrl="/"
        capabilities={capabilities}
        providers={[
          { providerId: "local", configured: true, model: null, sanitizedBaseUrl: null },
        ]}
        sourceMetadata={{
          ...eligibleSource,
          snapshotHashVersion: "aiqt-data-v2",
          snapshotBarsExposed: true,
        }}
        sourceRunId="run-source"
      />,
    );

    expect(tag(markup, "strategy-research-propose")).toContain("disabled");
    expect(markup).toContain("当前运行不是正式密封 P0");
  });

  it("submits only proposal intent so the server owns template matching", () => {
    expect(buildStrategyResearchProposalRequest({
      sourceRunId: "run-source",
      goal: "提升样本外稳健性",
      providerId: "local",
      externalDataApproved: false,
    })).toEqual({
      sourceRunId: "run-source",
      goal: "提升样本外稳健性",
      providerId: "local",
      externalDataApproved: false,
    });
  });

  it("uses the live capability order instead of a browser-owned template registry", () => {
    const serverOnly = [capabilities[1]];
    const markup = renderToStaticMarkup(
      <StrategyResearchSection
        baseUrl="/"
        capabilities={serverOnly}
        providers={[
          { providerId: "local", configured: true, model: null, sanitizedBaseUrl: null },
        ]}
        sourceMetadata={eligibleSource}
        sourceRunId="run-source"
      />,
    );

    expect(markup).toContain("成本约束区间回归策略");
    expect(markup).not.toContain("市场状态突破策略");
  });

  it("consumes external approval before every attempt and scopes it to the full outbound context", () => {
    const context = strategyResearchApprovalContextKey({
      sourceRunId: "run-a",
      goal: "提升样本外稳健性",
      providerId: "openai",
      registeredTemplateIds: ["regime-breakout-v2"],
    });
    const approved = reduceStrategyResearchApproval(
      { context, approved: false },
      { type: "set", context, approved: true },
    );
    const consumed = reduceStrategyResearchApproval(approved, {
      type: "proposal-attempted",
      context,
    });

    expect(consumed).toEqual({ context, approved: false });
    for (const changedContext of [
      strategyResearchApprovalContextKey({
        sourceRunId: "run-b",
        goal: "提升样本外稳健性",
        providerId: "openai",
        registeredTemplateIds: ["regime-breakout-v2"],
      }),
      strategyResearchApprovalContextKey({
        sourceRunId: "run-a",
        goal: "降低回撤同时保留收益",
        providerId: "openai",
        registeredTemplateIds: ["regime-breakout-v2"],
      }),
      strategyResearchApprovalContextKey({
        sourceRunId: "run-a",
        goal: "提升样本外稳健性",
        providerId: "ollama",
        registeredTemplateIds: ["regime-breakout-v2"],
      }),
      strategyResearchApprovalContextKey({
        sourceRunId: "run-a",
        goal: "提升样本外稳健性",
        providerId: "openai",
        providerFingerprint: "model-b@https://api.example.com",
        registeredTemplateIds: ["regime-breakout-v2"],
      }),
      strategyResearchApprovalContextKey({
        sourceRunId: "run-a",
        goal: "提升样本外稳健性",
        providerId: "openai",
        registeredTemplateIds: ["cost-aware-range-reversion-v1-1"],
      }),
    ]) {
      expect(reduceStrategyResearchApproval(approved, {
        type: "context-changed",
        context: changedContext,
      })).toEqual({ context: changedContext, approved: false });
    }
  });

  it("synchronously prevents a rapid second attempt from reusing one external approval", () => {
    const guard = createStrategyResearchApprovalAttemptGuard();

    expect(guard.consume("context-a", true)).toBe(true);
    expect(guard.consume("context-a", true)).toBe(false);
    expect(guard.consume("context-b", false)).toBe(false);

    guard.reset();
    expect(guard.consume("context-a", true)).toBe(true);
  });

  it("aborts and rejects a late proposal after the source changes", () => {
    const coordinator = createStrategyResearchProposalRequestCoordinator("run-a");
    const request = coordinator.begin("run-a");

    coordinator.invalidate("run-b");

    expect(request.signal.aborted).toBe(true);
    expect(coordinator.isCurrent(request)).toBe(false);
  });

  it("lets only the latest proposal generation commit within one source", () => {
    const coordinator = createStrategyResearchProposalRequestCoordinator("run-a");
    const older = coordinator.begin("run-a");
    const newer = coordinator.begin("run-a");

    expect(older.signal.aborted).toBe(true);
    expect(coordinator.isCurrent(older)).toBe(false);
    expect(coordinator.isCurrent(newer)).toBe(true);
  });

  it("invalidates independent launch and read generations when the source changes", () => {
    const launchCoordinator = createStrategyResearchProposalRequestCoordinator("run-a");
    const readCoordinator = createStrategyResearchProposalRequestCoordinator("run-a");
    const launch = launchCoordinator.begin("run-a");
    const read = readCoordinator.begin("run-a");

    launchCoordinator.invalidate("run-b");
    readCoordinator.invalidate("run-b");

    expect(launch.signal.aborted).toBe(true);
    expect(read.signal.aborted).toBe(true);
    expect(launchCoordinator.isCurrent(launch)).toBe(false);
    expect(readCoordinator.isCurrent(read)).toBe(false);
  });

  it("warns that an unavailable Paper runtime is neither bound nor monitoring", () => {
    const markup = renderToStaticMarkup(
      <StrategyResearchPaperBoundaryNotice paperStatus="unavailable" />,
    );

    expect(markup).toContain("Paper 运行边界不可用");
    expect(markup).toContain("不代表已绑定或已启动监控");
    expect(markup).toContain("检查运行边界");
  });
});
