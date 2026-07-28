import { describe, expect, it, vi } from "vitest";

import {
  isAiResearchEvidence,
  isAiResearchOutcome,
  type AiResearchEvidence,
  type AiResearchOutcome,
  type CreateAiResearchEvidenceRequest
} from "./ai-research-m4";
import {
  buildAiResearchEvidenceUrl,
  buildAiResearchOutcomesUrl,
  createAiResearchEvidence,
  evaluateAiResearchOutcome,
  loadAiResearchEvidence
} from "./terminal-api";

const hash = "a".repeat(64);
const boundary = {
  researchContextOnly: true,
  affectsRisk: false,
  affectsAuthorization: false,
  affectsPermissions: false,
  affectsOrderRouting: false
} as const;

function evidence(): AiResearchEvidence {
  return {
    schemaVersion: 1,
    recordType: "aiqt.aiResearchEvidence",
    researchEvidenceId: "ai-research-evidence-1",
    aiReviewId: `ai-review-${"1".repeat(32)}`,
    sourceRunId: "run-source",
    createdAt: "2026-01-02T00:00:00+00:00",
    market: "ashare",
    symbol: "600000",
    timeframe: "1d",
    snapshotHash: hash,
    claims: [
      { claimId: "fact", kind: "fact", text: "事实", evidenceReferences: ["context"] },
      { claimId: "calculation", kind: "calculation", text: "计算", evidenceReferences: ["candidate"] },
      { claimId: "assumption", kind: "assumption", text: "假设", evidenceReferences: ["strategy"] },
      { claimId: "inference", kind: "model_inference", text: "模型推断", evidenceReferences: ["candidate"] }
    ],
    informationRichness: {
      score: 60,
      level: "medium",
      claimKindCount: 4,
      evidenceKindCount: 4,
      gaps: ["财务证据待补充"],
      basis: "只评价证据覆盖。"
    },
    investmentCertainty: {
      level: "low",
      basis: "与信息丰富度分开。",
      derivedFromInformationRichness: false
    },
    financialFactReport: {
      status: "unavailable",
      facts: [],
      valuesMerged: false,
      summary: "尚未提供双来源。"
    },
    multiView: {
      status: "completed",
      engine: "deterministic_evidence_projection",
      roles: [
        { role: "bullish", thesis: "支持观点", evidenceReferences: ["candidate"] },
        { role: "bearish", thesis: "反对观点", evidenceReferences: ["candidate"] },
        { role: "neutral", thesis: "中性观点", evidenceReferences: ["candidate"] }
      ]
    },
    recommendation: {
      recommendationId: "research-recommendation-1",
      stance: "bullish",
      declaredHorizonBars: 5,
      timeframe: "1d",
      referenceAt: "2026-01-02T00:00:00+00:00",
      referencePrice: 10,
      snapshotHash: hash,
      aiReviewId: `ai-review-${"1".repeat(32)}`,
      researchOnly: true
    },
    priorOutcomeLessons: [],
    boundary,
    recordHash: hash
  };
}

function outcome(): AiResearchOutcome {
  return {
    schemaVersion: 1,
    recordType: "aiqt.aiResearchOutcome",
    outcomeId: "ai-research-outcome-1",
    researchEvidenceId: "ai-research-evidence-1",
    recommendationId: "research-recommendation-1",
    aiReviewId: `ai-review-${"1".repeat(32)}`,
    sourceRunId: "run-source",
    snapshotHash: hash,
    createdAt: "2026-01-10T00:00:00+00:00",
    status: "completed",
    market: "ashare",
    symbol: "600000",
    timeframe: "1d",
    stance: "bullish",
    horizonBars: 5,
    referenceAt: "2026-01-02T00:00:00+00:00",
    outcomeAt: "2026-01-09T00:00:00+00:00",
    referencePrice: 10,
    outcomePrice: 11,
    rawReturnPct: 10,
    stanceAdjustedReturnPct: 10,
    adverseExcursionPct: -2,
    benchmarkRunId: "run-benchmark",
    benchmarkSymbol: "000300",
    benchmarkReturnPct: 3,
    alphaPct: 7,
    outcomeRunId: "run-outcome",
    outcomeSnapshotHash: hash,
    benchmarkSnapshotHash: hash,
    lesson: "仅用于后续研究。",
    boundary,
    recordHash: hash
  };
}

describe("M4 AI research contracts", () => {
  it("accepts separated evidence and rejects a trading-capable boundary", () => {
    const artifact = evidence();
    expect(isAiResearchEvidence(artifact)).toBe(true);
    expect(isAiResearchOutcome(outcome())).toBe(true);
    expect(isAiResearchEvidence({
      ...artifact,
      boundary: { ...artifact.boundary, affectsOrderRouting: true }
    })).toBe(false);
  });

  it("creates, reads and evaluates through the typed local API", async () => {
    const artifact = evidence();
    const completed = outcome();
    const request: CreateAiResearchEvidenceRequest = {
      recommendation: { stance: "bullish", horizonBars: 5 },
      multiViewEnabled: true,
      financialFacts: []
    };
    const fetcher = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ researchEvidence: artifact })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ researchEvidence: artifact, outcomes: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ outcome: completed })
      });

    const created = await createAiResearchEvidence("/", artifact.aiReviewId, request, fetcher);
    const loaded = await loadAiResearchEvidence("/", artifact.aiReviewId, fetcher);
    const evaluated = await evaluateAiResearchOutcome("/", {
      researchEvidenceId: artifact.researchEvidenceId,
      outcomeRunId: "run-outcome",
      benchmarkRunId: "run-benchmark"
    }, fetcher);

    expect(created.researchEvidence?.recordHash).toBe(hash);
    expect(loaded.researchEvidence?.researchEvidenceId).toBe(artifact.researchEvidenceId);
    expect(evaluated.outcome?.alphaPct).toBe(7);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      buildAiResearchEvidenceUrl("/", artifact.aiReviewId),
      buildAiResearchEvidenceUrl("/", artifact.aiReviewId),
      buildAiResearchOutcomesUrl("/")
    ]);
  });
});
