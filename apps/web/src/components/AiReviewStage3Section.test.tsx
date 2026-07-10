import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { createI18n } from "../lib/i18n";
import type {
  AiReviewProviderStatus,
  AppendAiReviewDecisionRequest,
  AuthoritativeAiReviewRun,
  LegacyAiReviewHistoryRecord
} from "../lib/ai-review-stage3";
import type { StrategyExperimentListItem } from "../lib/terminal-workbench";
import { AiReviewStage3Section, type AiReviewStage3SectionProps } from "./AiReviewStage3Section";

const hash = (value: string) => value.repeat(64);

function experiment(experimentId: string): StrategyExperimentListItem {
  return {
    experimentId,
    status: "completed",
    strategyLineageKey: hash("7"),
    market: "ashare",
    symbol: "600000",
    timeframe: "1d"
  } as StrategyExperimentListItem;
}

function review(externalStatus: "failed" | "completed" = "failed"): AuthoritativeAiReviewRun {
  const assessment = {
    stance: "caution" as const,
    summary: "Deterministic evidence remains visible.",
    risks: [{ severity: "high" as const, message: "Drawdown risk.", evidenceReferences: ["evidence:primary"] }],
    invalidationConditions: ["Validation return turns negative."],
    watchItems: ["Monitor drawdown."],
    evidenceGaps: ["Need another window."],
    consistency: "mixed" as const
  };
  return {
    aiReviewId: "ai-review-0123456789abcdef0123456789abcdef",
    createdAt: "2026-07-10T08:00:00+00:00",
    primaryExperiment: { experimentId: "primary" },
    comparisonExperiments: [{ experimentId: "comparison" }],
    deterministicAssessment: assessment,
    externalAssessment: {
      provider: "openai-compatible",
      model: "review-model",
      sanitizedBaseUrl: "https://example.test/v1",
      status: externalStatus,
      assessment: externalStatus === "completed" ? { ...assessment, stance: "supported" } : null,
      error: externalStatus === "failed"
        ? { code: "ai_review_provider_not_configured", message: "raw provider message must not render" }
        : null
    },
    evidenceHash: hash("e"),
    recordHash: hash("r")
  } as AuthoritativeAiReviewRun;
}

const externalProvider: AiReviewProviderStatus = {
  providerId: "openai-compatible",
  configured: false,
  model: null,
  sanitizedBaseUrl: null
};

const decisionDraft: AppendAiReviewDecisionRequest = {
  operator: "operator",
  status: "accepted_for_research",
  rationale: "Use in research.",
  supersedesDecisionId: null
};

function props(overrides: Partial<AiReviewStage3SectionProps> = {}): AiReviewStage3SectionProps {
  return {
    i18n: createI18n("en-US"),
    experiments: [experiment("primary"), experiment("comparison")],
    primaryExperimentId: "primary",
    comparisonExperimentIds: [],
    providers: [externalProvider],
    providerId: "openai-compatible",
    externalDataApproved: true,
    currentReview: null,
    decisions: [],
    history: [],
    legacyHistory: [],
    decisionDraft,
    loading: false,
    running: false,
    appendingDecision: false,
    error: null,
    onPrimaryChange: () => undefined,
    onComparisonToggle: () => undefined,
    onProviderChange: () => undefined,
    onExternalDataApprovedChange: () => undefined,
    onRunReview: () => undefined,
    onLoadReview: () => undefined,
    onDecisionDraftChange: () => undefined,
    onAppendDecision: () => undefined,
    ...overrides
  };
}

function testTag(markup: string, testId: string): string {
  return markup.match(new RegExp(`<[^>]+data-testid="${testId}"[^>]*>`))?.[0] ?? "";
}

describe("AiReviewStage3Section", () => {
  test("allows an approved unconfigured external provider attempt", () => {
    const markup = renderToStaticMarkup(<AiReviewStage3Section {...props()} />);
    expect(testTag(markup, "ai-review-stage3-run")).not.toContain("disabled");
    expect(markup).toContain("not configured");
    const unapproved = renderToStaticMarkup(<AiReviewStage3Section {...props({ externalDataApproved: false })} />);
    expect(testTag(unapproved, "ai-review-stage3-run")).toContain("disabled");
    const missingProvider = renderToStaticMarkup(<AiReviewStage3Section {...props({ providers: [] })} />);
    expect(testTag(missingProvider, "ai-review-stage3-run")).toContain("disabled");
  });

  test("disables conflicting controls and Decision edits while append is busy", () => {
    const current = review();
    const markup = renderToStaticMarkup(<AiReviewStage3Section {...props({
      currentReview: current,
      history: [current],
      appendingDecision: true
    })} />);
    for (const testId of [
      "ai-review-stage3-primary",
      "ai-review-stage3-provider",
      "ai-review-stage3-comparison",
      "ai-review-stage3-approval",
      "ai-review-stage3-run",
      "ai-review-stage3-inspect",
      "ai-review-stage3-operator",
      "ai-review-stage3-status",
      "ai-review-stage3-rationale",
      "ai-review-stage3-append"
    ]) {
      expect(testTag(markup, testId), testId).toContain("disabled");
    }
    const runningMarkup = renderToStaticMarkup(<AiReviewStage3Section {...props({
      currentReview: current,
      running: true
    })} />);
    for (const testId of [
      "ai-review-stage3-operator",
      "ai-review-stage3-status",
      "ai-review-stage3-rationale",
      "ai-review-stage3-append"
    ]) {
      expect(testTag(runningMarkup, testId), `${testId} while running`).toContain("disabled");
    }
  });

  test("keeps deterministic evidence, safe external failure, and loaded-record metadata visible", () => {
    const current = review();
    const markup = renderToStaticMarkup(<AiReviewStage3Section {...props({
      currentReview: current,
      history: [current]
    })} />);
    expect(markup).toContain("Deterministic evidence remains visible.");
    expect(markup).toContain("Provider is not configured");
    expect(markup).toContain("ai_review_provider_not_configured");
    expect(markup).not.toContain("raw provider message must not render");
    expect(markup).toContain("primary");
    expect(markup).toContain("comparison");
    expect(markup).toContain("openai-compatible");
    expect(markup).toContain("review-model");
    expect(markup).toContain("https://example.test/v1");
    expect(markup).toContain(hash("e"));
    expect(markup).toContain(hash("r"));
    expect(markup).toContain("Loaded authoritative record");
  });

  test("renders complete assessment fields, localized severity, and legacy authority labels", () => {
    const legacy = {
      aiReviewId: "legacy-review",
      createdAt: "2026-07-09 08:00:00+00:00"
    } as LegacyAiReviewHistoryRecord;
    const markup = renderToStaticMarkup(<AiReviewStage3Section {...props({
      currentReview: review("completed"),
      legacyHistory: [legacy]
    })} />);
    expect(markup).toContain("Mixed");
    expect(markup).toContain("Invalidation conditions");
    expect(markup).toContain("Validation return turns negative.");
    expect(markup).toContain("Watch items");
    expect(markup).toContain("Monitor drawdown.");
    expect(markup).toContain("Evidence gaps");
    expect(markup).toContain("Need another window.");
    expect(markup).toContain("High");
    expect(markup).toContain("Legacy · non-authoritative");
  });
});
