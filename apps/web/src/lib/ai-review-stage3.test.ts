import { describe, expect, test } from "vitest";
import type { StrategyExperimentListItem } from "./terminal-workbench";
import type { AiReviewDecision, AuthoritativeAiReviewRun } from "./ai-review-stage3";
import {
  AI_REVIEW_EXTERNAL_DATA_FIELDS,
  appendAiReviewDecisionAndReadback,
  aiReviewRequestIsCurrent,
  aiReviewRequiresExternalApproval,
  buildAiReviewAssessmentColumns,
  buildAiReviewDecisionDraft,
  buildComparisonEligibility,
  canRunAiReviewStage3,
  createAiReviewRequestCoordinator,
  isAiReviewDecision,
  isAiReviewDecisionChain,
  isAiReviewHistoryRecord,
  isAiReviewProviderStatus,
  isAuthoritativeAiReviewRun,
  isLegacyAiReviewHistoryRecord,
  resolveAiReviewPrimaryExperiment,
  resolveAiReviewRestoredSelection,
  toggleAiReviewComparisonSelection
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
    strategyLineageKey: hash("7"),
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
  test("restores the latest authoritative review with its complete Decision chain", () => {
    const review = sampleAuthoritativeReview() as AuthoritativeAiReviewRun;
    const decisions = [sampleDecision(1), sampleDecision(2)] as AiReviewDecision[];

    expect(resolveAiReviewRestoredSelection([review], decisions, "run-primary")).toEqual({
      review,
      decisions,
      primaryExperimentId: "primary",
      comparisonExperimentIds: []
    });
    expect(resolveAiReviewRestoredSelection([], [], "run-primary")).toEqual({
      review: null,
      decisions: [],
      primaryExperimentId: null,
      comparisonExperimentIds: []
    });
  });

  test("fails closed for cross-run, orphaned, or incomplete restored Decision evidence", () => {
    const review = sampleAuthoritativeReview() as AuthoritativeAiReviewRun;
    const first = sampleDecision(1) as AiReviewDecision;
    const second = sampleDecision(2) as AiReviewDecision;

    expect(resolveAiReviewRestoredSelection([review], [first, second], "run-other")).toBeNull();
    expect(resolveAiReviewRestoredSelection([review], [{ ...first, aiReviewId: "ai-review-orphan" }], "run-primary"))
      .toBeNull();
    expect(resolveAiReviewRestoredSelection([review], [second], "run-primary")).toBeNull();
  });

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
    expect(isAiReviewDecision({ ...second, decisionId: second.supersedesDecisionId })).toBe(false);
    expect(isAiReviewDecision({ ...first, boundary: { ...first.boundary, orderSubmissionAllowed: true } })).toBe(false);
  });

  test("parses legal legacy history records without treating them as authoritative", () => {
    const legacy = sampleLegacyReview();
    expect(isLegacyAiReviewHistoryRecord(legacy)).toBe(true);
    expect(isLegacyAiReviewHistoryRecord({
      ...legacy,
      createdAt: "2026-W28-4T07:00:00+00:00"
    })).toBe(true);
    for (const createdAt of [
      "2026-07-10 07:00:00+00:00",
      "20260710T070000+0000",
      "opaque-created-at"
    ]) {
      expect(isLegacyAiReviewHistoryRecord({ ...legacy, createdAt })).toBe(true);
    }
    expect(isAiReviewHistoryRecord(legacy)).toBe(true);
    expect(isAiReviewHistoryRecord(sampleAuthoritativeReview())).toBe(true);
    expect(isAuthoritativeAiReviewRun(legacy)).toBe(false);
    expect(isAiReviewHistoryRecord({ ...legacy, authority: "authoritative" })).toBe(false);
    expect(isAiReviewHistoryRecord({ ...legacy, summary: [] })).toBe(false);
    expect(isAiReviewHistoryRecord({ ...legacy, createdAt: "" })).toBe(false);
    expect(isAiReviewHistoryRecord({ ...legacy, createdAt: 123 })).toBe(false);
  });

  test("compares repeated review fields canonically instead of by object key order", () => {
    const review = sampleAuthoritativeReview();
    review.evidenceBundle.primaryExperiment = Object.fromEntries(
      Object.entries(review.primaryExperiment).reverse()
    ) as typeof review.primaryExperiment;
    expect(isAuthoritativeAiReviewRun(review)).toBe(true);
  });

  test("accepts current and legacy AI review prompt templates", () => {
    const legacy = sampleAuthoritativeReview();
    const current = {
      ...legacy,
      externalAssessment: {
        ...legacy.externalAssessment,
        promptTemplateVersion: "aiqt-ai-review-v2"
      }
    };

    expect(isAuthoritativeAiReviewRun(legacy)).toBe(true);
    expect(isAuthoritativeAiReviewRun(current)).toBe(true);
    expect(isAuthoritativeAiReviewRun({
      ...current,
      externalAssessment: {
        ...current.externalAssessment,
        promptTemplateVersion: "aiqt-ai-review-v3"
      }
    })).toBe(false);
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
    for (const sanitizedBaseUrl of [
      "http://[::1]:11434",
      "http://[0:0:0:0:0:0:0:1]:11434"
    ]) {
      expect(isAiReviewProviderStatus({
        providerId: "ollama",
        configured: true,
        model: "local-model",
        sanitizedBaseUrl
      })).toBe(true);
    }
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
  test("uses the authoritative lineage key instead of rebuilding strategy structure", () => {
    const primary = sampleExperiment("primary");
    const candidate = structuredClone(sampleExperiment("candidate"));
    candidate.strategyRevision = "different-revision";
    candidate.definition.strategyRevision = "different-revision";
    candidate.definition.baseStrategy.name = "A structurally different strategy";
    candidate.definition.baseStrategy.entryConditions = [
      { kind: "threshold", params: { signal: 99 } }
    ];
    expect(buildComparisonEligibility(primary, candidate)).toEqual({
      eligible: true,
      reason: null
    });
  });

  test("rejects different authoritative lineage keys even when local structure matches", () => {
    const primary = sampleExperiment("primary");
    const candidate = sampleExperiment("candidate", { strategyLineageKey: hash("9") });
    expect(buildComparisonEligibility(primary, candidate).reason).toBe("lineage-mismatch");
  });

  test("normalizes controlled context casing before applying authoritative lineage", () => {
    const primary = sampleExperiment("primary", { symbol: "BTCUSDT" });
    const candidate = sampleExperiment("candidate", { symbol: "btcusdt" });
    expect(buildComparisonEligibility(primary, candidate)).toEqual({ eligible: true, reason: null });
  });

  test("returns stable reason codes in guard order", () => {
    const primary = sampleExperiment("primary");
    expect(buildComparisonEligibility(primary, primary).reason).toBe("primary");
    expect(buildComparisonEligibility(primary, sampleExperiment("failed", { status: "failed" })).reason)
      .toBe("not-completed");
    expect(buildComparisonEligibility(primary, sampleExperiment("context", {
      symbol: "000001",
      strategyLineageKey: hash("9")
    })).reason)
      .toBe("context-mismatch");
    const lineage = sampleExperiment("lineage", { strategyLineageKey: hash("9") });
    expect(buildComparisonEligibility(primary, lineage).reason)
      .toBe("lineage-mismatch");
    expect(buildComparisonEligibility(primary, sampleExperiment("selected"), ["selected"]).reason)
      .toBe("already-selected");
    expect(buildComparisonEligibility(primary, sampleExperiment("fifth"), ["1", "2", "3", "4"]).reason)
      .toBe("limit-reached");
  });
});

describe("Stage 3 authoritative workspace view model", () => {
  test("automatically selects the current completed experiment as primary", () => {
    const older = sampleExperiment("older");
    const active = sampleExperiment("active");
    expect(resolveAiReviewPrimaryExperiment(active, [older, active])?.experimentId).toBe("active");
    expect(resolveAiReviewPrimaryExperiment(
      sampleExperiment("failed-active", { status: "failed" }),
      [older]
    )?.experimentId).toBe("older");
    expect(resolveAiReviewPrimaryExperiment(null, [sampleExperiment("failed", { status: "failed" })])).toBeNull();
  });

  test("keeps at most four legal comparisons and preserves stable ineligibility reasons", () => {
    const primary = sampleExperiment("primary");
    const selected = ["one", "two", "three"];
    expect(toggleAiReviewComparisonSelection(primary, sampleExperiment("four"), selected)).toEqual([
      "one", "two", "three", "four"
    ]);
    expect(toggleAiReviewComparisonSelection(primary, sampleExperiment("five"), [
      "one", "two", "three", "four"
    ])).toEqual(["one", "two", "three", "four"]);
    expect(toggleAiReviewComparisonSelection(primary, sampleExperiment("wrong-context", {
      symbol: "000001"
    }), selected)).toEqual(selected);
    expect(toggleAiReviewComparisonSelection(primary, sampleExperiment("two"), selected)).toEqual(["one", "three"]);
  });

  test("requires explicit external approval and exposes only the bounded outbound field manifest", () => {
    expect(aiReviewRequiresExternalApproval("local")).toBe(false);
    expect(aiReviewRequiresExternalApproval("openai-compatible")).toBe(true);
    expect(AI_REVIEW_EXTERNAL_DATA_FIELDS).toEqual([
      "experimentReferences",
      "strategyDefinition",
      "dataQuality",
      "candidateMetrics"
    ]);
  });

  test("shares run eligibility for configured local and approved external attempts", () => {
    const base = {
      primaryExperimentId: "primary",
      providerId: "openai-compatible" as const,
      providers: [{
        providerId: "openai-compatible" as const,
        configured: false,
        model: null,
        sanitizedBaseUrl: null
      }],
      externalDataApproved: true,
      busy: false
    };
    expect(canRunAiReviewStage3(base)).toBe(true);
    expect(canRunAiReviewStage3({ ...base, externalDataApproved: false })).toBe(false);
    expect(canRunAiReviewStage3({ ...base, providers: [] })).toBe(false);
    expect(canRunAiReviewStage3({
      ...base,
      providerId: "local",
      providers: [{ providerId: "local", configured: false, model: null, sanitizedBaseUrl: null }]
    })).toBe(false);
    expect(canRunAiReviewStage3({
      ...base,
      providerId: "local",
      externalDataApproved: false,
      providers: [{ providerId: "local", configured: true, model: null, sanitizedBaseUrl: null }]
    })).toBe(true);
  });

  test("keeps deterministic and external assessments as independent columns", () => {
    const localOnly = sampleAuthoritativeReview();
    expect(buildAiReviewAssessmentColumns(localOnly as AuthoritativeAiReviewRun)).toEqual({
      deterministic: localOnly.deterministicAssessment,
      external: null,
      externalStatus: "skipped",
      externalError: null
    });

    const failed = structuredClone(localOnly) as AuthoritativeAiReviewRun;
    failed.externalAssessment = {
      ...failed.externalAssessment,
      status: "failed",
      provider: "openai-compatible",
      model: "review-model",
      sanitizedBaseUrl: "https://example.test/v1",
      endpointHash: hash("b"),
      renderedPrompt: "Bounded canonical evidence",
      requestHash: hash("c"),
      latencyMs: 7,
      error: { code: "timeout", message: "Provider request timed out." }
    };
    expect(buildAiReviewAssessmentColumns(failed).deterministic).toBe(failed.deterministicAssessment);
    expect(buildAiReviewAssessmentColumns(failed).external).toBeNull();
    expect(buildAiReviewAssessmentColumns(failed).externalError?.code).toBe("timeout");
  });

  test("builds decision drafts against the latest authoritative predecessor", () => {
    expect(buildAiReviewDecisionDraft([], "operator", "reason").supersedesDecisionId).toBeNull();
    expect(buildAiReviewDecisionDraft([
      sampleDecision(1) as AiReviewDecision,
      sampleDecision(2) as AiReviewDecision
    ], "operator", "reason"))
      .toMatchObject({
        operator: "operator",
        rationale: "reason",
        status: "accepted_for_research",
        supersedesDecisionId: sampleDecision(2).decisionId
      });
  });

  test("requires both generation and scope to match before committing async responses", () => {
    expect(aiReviewRequestIsCurrent({
      requestGeneration: 4,
      currentGeneration: 4,
      requestScopeKey: "ashare:600000:1d",
      currentScopeKey: "ashare:600000:1d",
      aborted: false
    })).toBe(true);
    expect(aiReviewRequestIsCurrent({
      requestGeneration: 3,
      currentGeneration: 4,
      requestScopeKey: "ashare:600000:1d",
      currentScopeKey: "ashare:600000:1d",
      aborted: false
    })).toBe(false);
    expect(aiReviewRequestIsCurrent({
      requestGeneration: 4,
      currentGeneration: 4,
      requestScopeKey: "ashare:600000:1d",
      currentScopeKey: "crypto:BTCUSDT:1d",
      aborted: false
    })).toBe(false);
    expect(aiReviewRequestIsCurrent({
      requestGeneration: 4,
      currentGeneration: 4,
      requestScopeKey: "ashare:600000:1d",
      currentScopeKey: "ashare:600000:1d",
      aborted: true
    })).toBe(false);
  });

  test("coordinates context and review lanes so scope changes, newer requests, and aborts stale old tokens", () => {
    const coordinator = createAiReviewRequestCoordinator("scope-a");
    const firstContext = coordinator.beginContext("scope-a");
    expect(coordinator.busy).toEqual({ loading: true, running: false, appending: false });

    expect("observeScope" in coordinator).toBe(false);
    const abandonedRenderScopes = ["scope-b", "scope-a"];
    expect(abandonedRenderScopes.at(-1)).toBe("scope-a");
    expect(coordinator.scopeKey).toBe("scope-a");
    expect(coordinator.isCurrent(firstContext)).toBe(true);
    expect(firstContext.signal.aborted).toBe(false);
    expect(coordinator.busy).toEqual({ loading: true, running: false, appending: false });

    const secondContext = coordinator.beginContext("scope-b");
    expect(firstContext.signal.aborted).toBe(true);
    expect(coordinator.isCurrent(firstContext)).toBe(false);
    expect(coordinator.finish(firstContext)).toBe(false);
    expect(coordinator.busy.loading).toBe(true);
    expect(coordinator.finish(secondContext)).toBe(true);
    expect(coordinator.busy).toEqual({ loading: false, running: false, appending: false });

    const review = coordinator.beginReview("running");
    const append = coordinator.beginReview("appending");
    expect(review.signal.aborted).toBe(true);
    expect(coordinator.isCurrent(review)).toBe(false);
    expect(coordinator.busy).toEqual({ loading: false, running: false, appending: true });
    expect(coordinator.finish(review)).toBe(false);
    expect(coordinator.finish(append)).toBe(true);
    expect(coordinator.busy).toEqual({ loading: false, running: false, appending: false });
  });

  test("converges busy state across a StrictMode-style dispose and committed restart", () => {
    const coordinator = createAiReviewRequestCoordinator("scope-a");
    const discarded = coordinator.beginContext("scope-a");
    coordinator.dispose();
    expect(discarded.signal.aborted).toBe(true);
    expect(coordinator.busy).toEqual({ loading: false, running: false, appending: false });

    const committed = coordinator.beginContext("scope-a");
    expect(coordinator.busy).toEqual({ loading: true, running: false, appending: false });
    expect(coordinator.finish(discarded)).toBe(false);
    expect(coordinator.busy).toEqual({ loading: true, running: false, appending: false });
    expect(coordinator.finish(committed)).toBe(true);
    expect(coordinator.busy).toEqual({ loading: false, running: false, appending: false });
  });

  test("does not let an asynchronously completed older request clear the newer busy state", async () => {
    const coordinator = createAiReviewRequestCoordinator("scope");
    const older = coordinator.beginReview("running");
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    }).then(() => coordinator.isCurrent(older));
    const newer = coordinator.beginReview("appending");
    release();
    await expect(pending).resolves.toBe(false);
    expect(coordinator.finish(older)).toBe(false);
    expect(coordinator.busy).toEqual({ loading: false, running: false, appending: true });
    expect(coordinator.finish(newer)).toBe(true);
    expect(coordinator.busy).toEqual({ loading: false, running: false, appending: false });
  });

  test("reads the full Decision chain after append and commits only a current matching readback", async () => {
    const appended = sampleDecision(2) as AiReviewDecision;
    const first = sampleDecision(1) as AiReviewDecision;
    const calls: string[] = [];
    const success = await appendAiReviewDecisionAndReadback({
      aiReviewId: appended.aiReviewId,
      request: buildAiReviewDecisionDraft([first], "operator", "reason"),
      signal: new AbortController().signal,
      append: async () => {
        calls.push("append");
        return { decision: appended };
      },
      load: async () => {
        calls.push("load");
        return { decisions: [first, appended] };
      },
      isCurrent: () => true
    });
    expect(calls).toEqual(["append", "load"]);
    expect(success).toEqual({ status: "committed", decisions: [first, appended] });

    const mismatch = await appendAiReviewDecisionAndReadback({
      aiReviewId: appended.aiReviewId,
      request: buildAiReviewDecisionDraft([first], "operator", "reason"),
      signal: new AbortController().signal,
      append: async () => ({ decision: appended }),
      load: async () => ({ decisions: [first] }),
      isCurrent: () => true
    });
    expect(mismatch).toEqual({ status: "readback-mismatch", decisions: null });

    let loadCalled = false;
    const stale = await appendAiReviewDecisionAndReadback({
      aiReviewId: appended.aiReviewId,
      request: buildAiReviewDecisionDraft([first], "operator", "reason"),
      signal: new AbortController().signal,
      append: async () => ({ decision: appended }),
      load: async () => {
        loadCalled = true;
        return { decisions: [first, appended] };
      },
      isCurrent: () => false
    });
    expect(stale).toEqual({ status: "stale", decisions: null });
    expect(loadCalled).toBe(false);
  });

  test("classifies Decision append and readback fallback or throw paths without committing", async () => {
    const first = sampleDecision(1) as AiReviewDecision;
    const appended = sampleDecision(2) as AiReviewDecision;
    const base = {
      aiReviewId: appended.aiReviewId,
      request: buildAiReviewDecisionDraft([first], "operator", "reason"),
      signal: new AbortController().signal,
      isCurrent: () => true
    };
    await expect(appendAiReviewDecisionAndReadback({
      ...base,
      append: async () => ({}),
      load: async () => ({ decisions: [first, appended] })
    })).resolves.toEqual({ status: "append-failed", decisions: null });
    await expect(appendAiReviewDecisionAndReadback({
      ...base,
      append: async () => ({ decision: appended }),
      load: async () => ({})
    })).resolves.toEqual({ status: "readback-failed", decisions: null });
    await expect(appendAiReviewDecisionAndReadback({
      ...base,
      append: async () => { throw new Error("append failed"); },
      load: async () => ({ decisions: [first, appended] })
    })).resolves.toEqual({ status: "append-failed", decisions: null });
    await expect(appendAiReviewDecisionAndReadback({
      ...base,
      append: async () => ({ decision: appended }),
      load: async () => { throw new Error("readback failed"); }
    })).resolves.toEqual({ status: "readback-failed", decisions: null });

    let appendCurrent = true;
    await expect(appendAiReviewDecisionAndReadback({
      ...base,
      append: async () => {
        appendCurrent = false;
        throw new Error("stale append");
      },
      load: async () => ({ decisions: [first, appended] }),
      isCurrent: () => appendCurrent
    })).resolves.toEqual({ status: "stale", decisions: null });

    let readbackCurrent = true;
    await expect(appendAiReviewDecisionAndReadback({
      ...base,
      append: async () => ({ decision: appended }),
      load: async () => {
        readbackCurrent = false;
        throw new Error("stale readback");
      },
      isCurrent: () => readbackCurrent
    })).resolves.toEqual({ status: "stale", decisions: null });
  });
});
