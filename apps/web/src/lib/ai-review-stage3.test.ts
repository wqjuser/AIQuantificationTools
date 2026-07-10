import { describe, expect, test } from "vitest";
import type { StrategyExperimentListItem } from "./terminal-workbench";
import {
  buildComparisonEligibility,
  isAiReviewDecision,
  isAiReviewDecisionChain,
  isAiReviewHistoryRecord,
  isAiReviewProviderStatus,
  isAuthoritativeAiReviewRun,
  isLegacyAiReviewHistoryRecord
} from "./ai-review-stage3";

const hash = (digit: string): string => digit.repeat(64);

function sampleAssessment() {
  return {
    stance: "supported",
    summary: "The persisted evidence supports another research iteration.",
    risks: [
      {
        severity: "low",
        message: "The sample remains bounded.",
        evidenceReferences: ["experiment:primary:context"]
      }
    ],
    invalidationConditions: ["The next validation window materially degrades."],
    watchItems: ["Monitor walk-forward stability."],
    evidenceGaps: [],
    consistency: "consistent"
  };
}

function sampleAuthoritativeReview() {
  const primaryExperiment = {
    experimentId: "primary",
    sourceRunId: "run-primary",
    strategyRevision: hash("1"),
    snapshotId: hash("2"),
    definitionHash: hash("3"),
    resultHash: hash("4"),
    selectedCandidateId: "candidate-primary",
    candidateRevision: hash("5"),
    canonicalDataHash: hash("6"),
    dataRange: {
      startAt: "2026-01-01T00:00:00+00:00",
      endAt: "2026-06-30T00:00:00+00:00"
    }
  };
  const evidenceBundle = {
    schemaVersion: 1,
    mode: "single",
    primaryExperiment,
    comparisonExperiments: [],
    strategyLineageKey: hash("7"),
    evidenceItems: [
      {
        id: "experiment:primary:context",
        kind: "experiment_context",
        value: { market: "ashare", symbol: "600000", timeframe: "1d" }
      }
    ],
    safetyBoundary: {
      paperOnly: true,
      liveTradingAllowed: false,
      orderSubmissionAllowed: false
    },
    evidenceHash: hash("8")
  };
  return {
    schemaVersion: 2,
    authority: "authoritative",
    recordType: "aiqt.aiReviewRun",
    aiReviewId: "ai-review-0123456789abcdef0123456789abcdef",
    createdAt: "2026-07-10T08:00:00+00:00",
    mode: "single",
    primaryExperiment,
    comparisonExperiments: [],
    strategyLineageKey: hash("7"),
    evidenceBundle,
    evidenceHash: hash("8"),
    deterministicAssessment: sampleAssessment(),
    externalAssessment: {
      status: "skipped",
      provider: "local",
      model: null,
      sanitizedBaseUrl: null,
      endpointHash: null,
      promptTemplateVersion: "aiqt-ai-review-v1",
      outputSchemaVersion: "aiqt-ai-review-assessment-v1",
      renderedPrompt: "",
      renderedPromptHash: hash("9"),
      evidenceHash: hash("8"),
      requestHash: null,
      responseHash: null,
      assessment: null,
      usage: null,
      latencyMs: 0,
      error: null
    },
    boundary: {
      purpose: "research_evidence_review_only",
      paperOnly: true,
      liveTradingAllowed: false,
      orderSubmissionAllowed: false
    },
    recordHash: hash("a")
  };
}

function sampleDecision(index = 1) {
  return {
    schemaVersion: 1,
    recordType: "aiqt.aiReviewDecision",
    decisionId: `ai-review-decision-${String(index).repeat(32)}`,
    aiReviewId: "ai-review-0123456789abcdef0123456789abcdef",
    createdAt: `2026-07-10T08:0${index}:00+00:00`,
    operator: "researcher",
    status: "accepted_for_research",
    rationale: "Use this evidence for the next research iteration.",
    supersedesDecisionId: index === 1 ? null : `ai-review-decision-${String(index - 1).repeat(32)}`,
    reviewRecordHash: hash("a"),
    evidenceHash: hash("8"),
    boundary: {
      paperOnly: true,
      liveTradingAllowed: false,
      orderSubmissionAllowed: false
    },
    recordHash: hash(String(index))
  };
}

function sampleLegacyReview() {
  return {
    schemaVersion: 1,
    recordType: "aiqt.aiReviewRun",
    aiReviewId: "ai-review-v1",
    runId: "run-primary",
    createdAt: "2026-07-10T07:00:00+00:00",
    authority: "legacy",
    status: "ready",
    summary: { liveExecutionBlocked: true },
    dossier: { headline: "Legacy review" },
    citations: [],
    rounds: [],
    decisionLog: [],
    boundary: "Evidence explanation only; live routing remains blocked."
  };
}

function sampleExperiment(
  experimentId: string,
  overrides: Partial<StrategyExperimentListItem> = {}
): StrategyExperimentListItem {
  return {
    experimentId,
    createdAt: "2026-07-10T08:00:00+00:00",
    status: "completed",
    definitionHash: hash("1"),
    holdoutKey: hash("2"),
    strategyRevision: "strategy-lineage-a",
    sourceRunId: `run-${experimentId}`,
    snapshotId: hash("3"),
    market: "ashare",
    symbol: "600000",
    timeframe: "1d",
    definition: {
      baseStrategy: {
        name: "SMA plan",
        revision: "strategy-lineage-a",
        market: "ashare",
        symbols: ["600000"],
        timeframe: "1d",
        version: 1,
        entryConditions: [],
        exitConditions: [],
        risk: { positionPct: 0.4, stopLossPct: 0.06, takeProfitPct: 0.12, maxDrawdownPct: 0.09 }
      },
      strategyRevision: "strategy-lineage-a",
      sourceRunId: `run-${experimentId}`,
      snapshotId: hash("3"),
      canonicalDataHash: hash("4"),
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      assumptions: { initialCash: 100000, feeBps: 3, slippageBps: 2 },
      split: { trainPct: 60, validationPct: 20, testPct: 20 },
      dimensions: [],
      guardrails: { minimumTradeCount: 2, maximumDrawdownPct: 20 },
      walkForward: null,
      evaluationBudget: 1,
      engineVersion: "backtest-v1",
      resultSchemaVersion: 1
    },
    evaluationCount: 1,
    selectedCandidateId: "candidate-1",
    completionReason: "selected",
    resultHash: hash("5"),
    errorCode: null,
    errorDetail: null,
    ...overrides
  };
}

describe("Stage 3 AI review runtime contracts", () => {
  test("accepts authoritative v2 records with skipped, failed, and completed external assessments", () => {
    const skipped = sampleAuthoritativeReview();
    expect(isAuthoritativeAiReviewRun(skipped)).toBe(true);

    const failed = {
      ...skipped,
      externalAssessment: {
        ...skipped.externalAssessment,
        status: "failed",
        provider: "openai-compatible",
        model: "review-model",
        sanitizedBaseUrl: "https://example.test/v1",
        endpointHash: hash("b"),
        renderedPrompt: "Bounded canonical evidence",
        requestHash: hash("c"),
        latencyMs: 7,
        error: { code: "timeout", message: "Provider request timed out." }
      }
    };
    expect(isAuthoritativeAiReviewRun(failed)).toBe(true);

    const completed = {
      ...failed,
      externalAssessment: {
        ...failed.externalAssessment,
        status: "completed",
        responseHash: hash("d"),
        assessment: sampleAssessment(),
        usage: { inputTokens: 17, outputTokens: 11, totalTokens: 28 },
        error: null
      }
    };
    expect(isAuthoritativeAiReviewRun(completed)).toBe(true);
  });

  test("rejects unknown assessment enums, hashes, boundaries, array types, and legacy records", () => {
    const review = sampleAuthoritativeReview();
    const mutations: Array<(value: ReturnType<typeof sampleAuthoritativeReview>) => void> = [
      (value) => { value.deterministicAssessment.stance = "buy"; },
      (value) => { value.recordHash = "not-a-hash"; },
      (value) => { value.boundary.liveTradingAllowed = true; },
      (value) => { value.deterministicAssessment.risks = {} as never; },
      (value) => { value.externalAssessment.status = "pending"; }
    ];
    for (const mutate of mutations) {
      const invalid = structuredClone(review);
      mutate(invalid);
      expect(isAuthoritativeAiReviewRun(invalid)).toBe(false);
    }
    expect(isAuthoritativeAiReviewRun({ ...review, schemaVersion: 1, authority: "legacy" })).toBe(false);
  });

  test("validates assessment evidence references against the canonical evidence bundle", () => {
    const review = sampleAuthoritativeReview();
    review.deterministicAssessment.risks[0].evidenceReferences = ["experiment:missing:context"];
    expect(isAuthoritativeAiReviewRun(review)).toBe(false);
  });

  test("rejects invalid status-dependent external fields and unsafe error text", () => {
    const review = sampleAuthoritativeReview();
    const failedWithSecret = {
      ...review,
      externalAssessment: {
        ...review.externalAssessment,
        status: "failed",
        provider: "openai-compatible",
        model: "review-model",
        sanitizedBaseUrl: "https://example.test/v1",
        endpointHash: hash("b"),
        renderedPrompt: "Bounded canonical evidence",
        requestHash: hash("c"),
        latencyMs: 7,
        error: { code: "http_error", message: "api_key=must-not-enter-state" }
      }
    };
    expect(isAuthoritativeAiReviewRun(failedWithSecret)).toBe(false);
    expect(isAuthoritativeAiReviewRun({
      ...review,
      externalAssessment: { ...review.externalAssessment, model: "unexpected-local-model" }
    })).toBe(false);
  });

  test("validates decision records and the append-only predecessor chain", () => {
    const first = sampleDecision(1);
    const second = sampleDecision(2);
    expect(isAiReviewDecision(first)).toBe(true);
    expect(isAiReviewDecisionChain([first, second])).toBe(true);
    expect(isAiReviewDecisionChain([{ ...first, status: "approved" }, second])).toBe(false);
    expect(isAiReviewDecisionChain([first, { ...second, supersedesDecisionId: null }])).toBe(false);
    expect(isAiReviewDecisionChain([first, { ...second, decisionId: first.decisionId }])).toBe(false);
    expect(isAiReviewDecision({ ...first, boundary: { ...first.boundary, orderSubmissionAllowed: true } })).toBe(false);
  });

  test("parses legal legacy history records without treating them as authoritative", () => {
    const legacy = sampleLegacyReview();
    expect(isLegacyAiReviewHistoryRecord(legacy)).toBe(true);
    expect(isLegacyAiReviewHistoryRecord({
      ...legacy,
      createdAt: "2026-W28-4T07:00:00+00:00"
    })).toBe(true);
    expect(isAiReviewHistoryRecord(legacy)).toBe(true);
    expect(isAiReviewHistoryRecord(sampleAuthoritativeReview())).toBe(true);
    expect(isAuthoritativeAiReviewRun(legacy)).toBe(false);
    expect(isAiReviewHistoryRecord({ ...legacy, authority: "authoritative" })).toBe(false);
    expect(isAiReviewHistoryRecord({ ...legacy, summary: [] })).toBe(false);
  });

  test("compares repeated review fields canonically instead of by object key order", () => {
    const review = sampleAuthoritativeReview();
    review.evidenceBundle.primaryExperiment = Object.fromEntries(
      Object.entries(review.primaryExperiment).reverse()
    ) as typeof review.primaryExperiment;
    expect(isAuthoritativeAiReviewRun(review)).toBe(true);
  });

  test("accepts only safe provider status projections and rejects key material", () => {
    expect(isAiReviewProviderStatus({
      providerId: "openai-compatible",
      configured: true,
      model: "review-model",
      sanitizedBaseUrl: "https://example.test/v1"
    })).toBe(true);
    expect(isAiReviewProviderStatus({
      providerId: "openai",
      configured: true,
      model: "gpt-5",
      sanitizedBaseUrl: "https://api.openai.com/v1"
    })).toBe(true);
    expect(isAiReviewProviderStatus({
      providerId: "openai",
      configured: true,
      model: "gpt-5",
      sanitizedBaseUrl: "https://api.openai.com/v1",
      apiKey: "secret"
    })).toBe(false);
    expect(isAiReviewProviderStatus({
      providerId: "ollama",
      configured: true,
      model: "local-model",
      sanitizedBaseUrl: "http://user:password@localhost:11434"
    })).toBe(false);
    expect(isAiReviewProviderStatus({
      providerId: "openai-compatible",
      configured: true,
      model: "review-model",
      sanitizedBaseUrl: "https://example.test/%zz"
    })).toBe(false);
    const invalidStatuses = [
      {
        providerId: "openai-compatible",
        configured: true,
        model: null,
        sanitizedBaseUrl: "https://example.test/v1"
      },
      {
        providerId: "ollama",
        configured: true,
        model: "review-model",
        sanitizedBaseUrl: null
      },
      {
        providerId: "openai",
        configured: true,
        model: "gpt-5",
        sanitizedBaseUrl: "https://example.test/v1"
      },
      {
        providerId: "openai-compatible",
        configured: true,
        model: "review-model",
        sanitizedBaseUrl: "HTTPS://EXAMPLE.TEST/v1"
      },
      {
        providerId: "openai-compatible",
        configured: true,
        model: "review-model",
        sanitizedBaseUrl: "https://bad_host.test/v1"
      },
      {
        providerId: "openai-compatible",
        configured: true,
        model: "review-model",
        sanitizedBaseUrl: "https://example.test/v1/chat/completions"
      },
      {
        providerId: "openai-compatible",
        configured: true,
        model: "review-model",
        sanitizedBaseUrl: "https://example.test/v1?key=value"
      },
      {
        providerId: "openai-compatible",
        configured: true,
        model: "review-model",
        sanitizedBaseUrl: "https://example.test/v1#fragment"
      },
      {
        providerId: "openai-compatible",
        configured: true,
        model: "review-model",
        sanitizedBaseUrl: "https://example.test/a b"
      },
      {
        providerId: "ollama",
        configured: true,
        model: "review-model",
        sanitizedBaseUrl: "http://127.0.0.1:011434"
      },
      {
        providerId: "openai-compatible",
        configured: true,
        model: "review-model",
        sanitizedBaseUrl: "ftp://example.test/v1"
      },
      {
        providerId: "openai-compatible",
        configured: true,
        model: "review-model",
        sanitizedBaseUrl: "https://example.test\\v1"
      }
    ];
    for (const status of invalidStatuses) {
      expect(isAiReviewProviderStatus(status)).toBe(false);
    }
  });

  test("enforces external assessment provider provenance including the unconfigured matrix", () => {
    const review = sampleAuthoritativeReview();
    const unconfigured = {
      ...review,
      externalAssessment: {
        ...review.externalAssessment,
        status: "failed",
        provider: "openai",
        renderedPrompt: "Bounded canonical evidence",
        error: {
          code: "ai_review_provider_not_configured",
          message: "Provider is not configured."
        }
      }
    };
    expect(isAuthoritativeAiReviewRun(unconfigured)).toBe(true);
    expect(isAuthoritativeAiReviewRun({
      ...unconfigured,
      externalAssessment: {
        ...unconfigured.externalAssessment,
        sanitizedBaseUrl: "https://example.test/v1"
      }
    })).toBe(false);

    const attempted = {
      ...unconfigured,
      externalAssessment: {
        ...unconfigured.externalAssessment,
        model: "gpt-5",
        sanitizedBaseUrl: "https://example.test/v1",
        endpointHash: hash("b"),
        requestHash: hash("c"),
        latencyMs: 7,
        error: { code: "timeout", message: "Provider request timed out." }
      }
    };
    expect(isAuthoritativeAiReviewRun(attempted)).toBe(false);
    expect(isAuthoritativeAiReviewRun({
      ...review,
      externalAssessment: { ...review.externalAssessment, provider: "ollama" }
    })).toBe(false);
  });
});

describe("Stage 3 comparison eligibility", () => {
  test("allows the same normalized structure across revisions and parameter values", () => {
    const primary = sampleExperiment("primary");
    primary.definition.baseStrategy.entryConditions = [
      { kind: "cross", params: { fast: 5, slow: 20 } },
      { kind: "volume", params: { window: 10 } }
    ];
    const candidate = structuredClone(sampleExperiment("candidate"));
    candidate.strategyRevision = "different-revision";
    candidate.definition.strategyRevision = "different-revision";
    candidate.definition.baseStrategy = {
      ...primary.definition.baseStrategy,
      name: "  sma   PLAN ",
      revision: "different-revision",
      entryConditions: [
        { kind: "cross", params: { slow: 99, fast: 1 } },
        { kind: "volume", params: { window: 30 } }
      ]
    };
    expect(buildComparisonEligibility(primary, candidate)).toEqual({
      eligible: true,
      reason: null
    });
  });

  test("rejects structural name, kind, order, and parameter-key changes despite equal revisions", () => {
    const primary = sampleExperiment("primary");
    primary.definition.baseStrategy.entryConditions = [
      { kind: "cross", params: { fast: 5, slow: 20 } },
      { kind: "volume", params: { window: 10 } }
    ];
    const candidates = [
      structuredClone(sampleExperiment("name")),
      structuredClone(sampleExperiment("kind")),
      structuredClone(sampleExperiment("order")),
      structuredClone(sampleExperiment("key"))
    ];
    for (const candidate of candidates) {
      candidate.definition.baseStrategy.entryConditions = structuredClone(
        primary.definition.baseStrategy.entryConditions
      );
    }
    candidates[0].definition.baseStrategy.name = "EMA plan";
    candidates[1].definition.baseStrategy.entryConditions[0].kind = "threshold";
    candidates[2].definition.baseStrategy.entryConditions.reverse();
    candidates[3].definition.baseStrategy.entryConditions[0].params = { fast: 5, signal: 20 };

    for (const candidate of candidates) {
      expect(buildComparisonEligibility(primary, candidate).reason).toBe("lineage-mismatch");
    }
  });

  test("returns stable reason codes in guard order", () => {
    const primary = sampleExperiment("primary");
    expect(buildComparisonEligibility(primary, primary).reason).toBe("primary");
    expect(buildComparisonEligibility(primary, sampleExperiment("failed", { status: "failed" })).reason)
      .toBe("not-completed");
    expect(buildComparisonEligibility(primary, sampleExperiment("context", { symbol: "000001" })).reason)
      .toBe("context-mismatch");
    const lineage = sampleExperiment("lineage");
    lineage.definition.baseStrategy.name = "different strategy";
    expect(buildComparisonEligibility(primary, lineage).reason)
      .toBe("lineage-mismatch");
    expect(buildComparisonEligibility(primary, sampleExperiment("selected"), ["selected"]).reason)
      .toBe("already-selected");
    expect(buildComparisonEligibility(primary, sampleExperiment("fifth"), ["1", "2", "3", "4"]).reason)
      .toBe("limit-reached");
  });
});
