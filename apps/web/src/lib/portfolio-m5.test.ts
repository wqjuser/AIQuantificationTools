import { describe, expect, it } from "vitest";
import type { Stage4PortfolioWorkflow } from "./portfolio-stage4";
import {
  buildPortfolioRiskAssessmentDraft,
  buildPortfolioRiskAssessmentsUrl,
  createPortfolioRiskAssessment,
  isPortfolioRiskAssessment,
  loadPortfolioRiskAssessments,
  type PortfolioRiskAssessment,
} from "./portfolio-m5";

function workflow(): Stage4PortfolioWorkflow {
  return {
    workflowId: "stage4-workflow-1",
    portfolioRequest: {
      legs: [
        { symbol: "600000", market: "ashare", timeframe: "1d", runId: "run-a", targetWeight: 0.55 },
        { symbol: "000300", market: "ashare", timeframe: "1d", runId: "run-b", targetWeight: 0.35 },
      ],
    },
    replay: {
      generatedAt: "2026-07-20T10:00:00+00:00",
      orders: [
        { simulatedAt: "2026-07-20T09:00:00+00:00" },
        { simulatedAt: "2026-07-19T09:00:00+00:00" },
      ],
    },
  } as Stage4PortfolioWorkflow;
}

export function assessment(): PortfolioRiskAssessment {
  return {
    kind: "aiqt.portfolioRiskAssessment",
    schemaVersion: 1,
    assessmentId: "portfolio-risk-1",
    createdAt: "2026-07-20T10:00:00+00:00",
    baseRunId: "run-a",
    workflowId: "stage4-workflow-1",
    workflowHash: "a".repeat(64),
    operator: "local-operator",
    classifications: [
      { symbol: "600000", industry: "银行", currency: "CNY" },
      { symbol: "000300", industry: "宽基指数", currency: "CNY" },
    ],
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
        reason: "单一标的集中度已下调至组合限额",
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
        reason: "纸面调仓候选",
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
      {
        dimension: "market",
        group: "ashare",
        currentWeight: 0.3,
        targetWeight: 0.9,
        adjustedTargetWeight: 0.75,
        limit: 0.95,
        status: "reduced",
      },
      {
        dimension: "currency",
        group: "CNY",
        currentWeight: 0.3,
        targetWeight: 0.9,
        adjustedTargetWeight: 0.75,
        limit: 0.95,
        status: "reduced",
      },
    ],
    correlations: [
      { leftSymbol: "600000", rightSymbol: "000300", correlation: 0.4, limit: 0.8, status: "passed" },
    ],
    riskContributions: [
      { symbol: "600000", sourceRunId: "run-a", contributionPct: 60, limitPct: 60, status: "passed" },
    ],
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
      {
        checkId: "symbol_concentration",
        scope: "portfolio",
        status: "reduced",
        value: 0.55,
        limit: 0.4,
        unit: "weight",
        reason: "单一标的集中度已下调至组合限额。",
      },
    ],
    batch: {
      status: "reduced",
      orders: [
        {
          symbol: "600000",
          sourceRunId: "run-a",
          side: "buy",
          notionalValue: 30_000,
          status: "candidate",
          reason: "纸面候选",
        },
        {
          symbol: "000300",
          sourceRunId: "run-b",
          side: "buy",
          notionalValue: 15_000,
          status: "candidate",
          reason: "纸面候选",
        },
      ],
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
  };
}

describe("portfolio M5 contract", () => {
  it("builds a conservative draft from the existing Stage 4 workflow", () => {
    const draft = buildPortfolioRiskAssessmentDraft(workflow());

    expect(draft.classifications).toEqual([
      { symbol: "600000", industry: "未分类", currency: "CNY" },
      { symbol: "000300", industry: "未分类", currency: "CNY" },
    ]);
    expect(draft.observations.tradesToday).toBe(1);
    expect(draft.limits.maxTotalExposureWeight).toBe(0.95);
  });

  it("accepts the safety-bound assessment and rejects exposure or live-boundary drift", () => {
    expect(isPortfolioRiskAssessment(assessment())).toBe(true);
    expect(isPortfolioRiskAssessment({
      ...assessment(),
      liveTradingAllowed: true,
    })).toBe(false);
    expect(isPortfolioRiskAssessment({
      ...assessment(),
      allocations: [
        { ...assessment().allocations[0], adjustedTargetWeight: 0.8 },
        assessment().allocations[1],
      ],
    })).toBe(false);
  });

  it("creates and reloads assessments through the existing API base URL rules", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () =>
          init?.method === "POST"
            ? { assessment: assessment() }
            : { assessments: [assessment()] },
      };
    };

    const created = await createPortfolioRiskAssessment("/", {
      ...buildPortfolioRiskAssessmentDraft(workflow()),
      classifications: assessment().classifications,
    }, fetcher);
    const loaded = await loadPortfolioRiskAssessments("/", "run /你好", fetcher);

    expect(created.assessment?.batch.status).toBe("reduced");
    expect(loaded.assessments).toHaveLength(1);
    expect(calls[0].url).toBe("/api/portfolio/risk-assessments");
    expect(calls[0].init?.method).toBe("POST");
    expect(calls[1].url).toBe(
      "/api/portfolio/risk-assessments?baseRunId=run+%2F%E4%BD%A0%E5%A5%BD&limit=20",
    );
    expect(buildPortfolioRiskAssessmentsUrl("http://127.0.0.1:8765/", "run-a")).toBe(
      "http://127.0.0.1:8765/api/portfolio/risk-assessments?baseRunId=run-a&limit=20",
    );
  });

  it("fails closed when the API returns a malformed assessment", async () => {
    const result = await loadPortfolioRiskAssessments("/", "run-a", async () => ({
      ok: true,
      status: 200,
      json: async () => ({ assessments: [{ ...assessment(), paperOnly: false }] }),
    }));

    expect(result.assessments).toEqual([]);
    expect(result.source).toBe("fallback");
    expect(result.error).toContain("Invalid portfolio risk assessment history contract");
  });
});
