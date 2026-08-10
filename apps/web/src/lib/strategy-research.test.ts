import { describe, expect, it, vi } from "vitest";

import type { WorkspaceFetcher } from "./terminal-api-http";
import {
  createStrategyResearchProposal,
  launchStrategyResearchExperiment,
  loadStrategyResearchCapabilities,
  loadStrategyResearchExperiment,
  shouldPollStrategyResearch,
} from "./strategy-research";

const registeredCapability = {
  templateId: "regime-breakout-v2",
  version: "2",
  policyKind: "regime_breakout_v2",
  market: "crypto",
  symbol: "BTC/USDT",
  timeframe: "1m",
  sealedData: {
    hashVersion: "aiqt-sealed-v1",
    minimumRows: 142_919,
    minimumPreRollRows: 13_319,
    developmentScoringRows: 103_680,
    withheldRows: 25_920,
  },
  parameterSchema: [{
    policyPath: "regime.closeAboveSmaWindow",
    type: "integer",
    minimum: 2,
    maximum: 500,
  }],
  evaluatorVersion: "strategy-evaluator-v2",
} as const;

const proposal = {
  proposalId: "strategy-research-proposal-1234567890abcdef12345678",
  sourceRunId: "run-source",
  goal: "提升样本外稳健性",
  template: {
    templateId: "regime-breakout-v2",
    policyKind: "regime_breakout_v2",
    baseStrategyRevision: "strategy-v1",
  },
  experiment: {
    dimensions: [
      { policyPath: "regime.closeAboveSmaWindow", values: [180, 200, 220] },
    ],
    assumptions: { initialCash: 100000 },
    guardrails: { test: { minTrades: 10 } },
  },
  evidence: {
    sourceRunId: "run-source",
    market: "crypto",
    symbol: "BTC/USDT",
    timeframe: "1m",
    rows: 1000,
    startAt: "2026-01-01T00:00:00Z",
    developmentEndExclusive: "2026-01-02T00:00:00Z",
    developmentHash: "a".repeat(64),
    quality: "complete",
    baselineMetrics: {
      totalReturnPct: 4.2,
      maxDrawdownPct: -1.8,
      profitFactor: 1.3,
      roundTripCount: 12,
    },
  },
  generation: {
    requestedProvider: "local",
    usedProvider: "local",
    status: "skipped",
    externalDataApproved: false,
    reasons: ["固定模板", "服务端参数", "人工启动"],
  },
  boundary: {
    proposalOnly: true,
    proposalPersisted: true,
    strategySaved: false,
    testRead: false,
    promotionExecuted: false,
    strategyBound: false,
    monitoringStarted: false,
    orderSubmitted: false,
    paperOnly: true,
    liveBlockedBoundary: true,
  },
} as const;

function jsonResponse(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

describe("AI strategy research transport", () => {
  it("loads strict server-owned registered capabilities without executable policy payloads", async () => {
    const fetcher = vi.fn(async () => jsonResponse({
      capabilities: [registeredCapability],
    })) as WorkspaceFetcher;

    const result = await loadStrategyResearchCapabilities("/", fetcher);

    expect(result).toEqual({ capabilities: [registeredCapability], source: "core" });
    expect(fetcher).toHaveBeenCalledWith(
      "/api/strategy-research/capabilities",
      undefined,
    );
    expect(JSON.stringify(result)).not.toContain("\"policy\"");
    expect(JSON.stringify(result)).not.toContain("testHash");
  });

  it("rejects capability projections with hidden policy, invalid row identity, or duplicates", async () => {
    for (const capabilities of [
      [{ ...registeredCapability, policy: { kind: "browser-executable" } }],
      [{
        ...registeredCapability,
        sealedData: { ...registeredCapability.sealedData, minimumRows: 129_600 },
      }],
      [registeredCapability, registeredCapability],
    ]) {
      const fetcher = vi.fn(async () => jsonResponse({ capabilities })) as WorkspaceFetcher;

      await expect(loadStrategyResearchCapabilities("/", fetcher)).resolves.toEqual({
        source: "fallback",
        error: "Invalid strategy research capabilities contract",
      });
    }
  });

  it("submits only the four server-owned proposal fields and accepts a strict proposal", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ proposal })) as WorkspaceFetcher;
    const request = {
      sourceRunId: "run-source",
      goal: "提升样本外稳健性",
      providerId: "local" as const,
      externalDataApproved: false,
      allowedTemplateIds: ["regime-breakout-v2"],
      metrics: { forged: 99 },
      bars: [{ close: 999 }],
      winner: "browser-choice",
      datasetHash: "browser-hash",
      withheldRows: 500,
    };

    const result = await createStrategyResearchProposal("/", request, fetcher);

    expect(result).toEqual({ proposal, source: "core" });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetcher).mock.calls[0];
    expect(url).toBe("/api/strategy-research/proposals");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      sourceRunId: "run-source",
      goal: "提升样本外稳健性",
      providerId: "local",
      externalDataApproved: false,
    });
  });

  it("supports aborting proposal generation at the transport boundary", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn(async () => jsonResponse({ proposal })) as WorkspaceFetcher;

    const result = await createStrategyResearchProposal("/", {
      sourceRunId: "run-source",
      goal: "提升样本外稳健性",
      providerId: "local",
      externalDataApproved: false,
    }, controller.signal, fetcher);

    expect(result).toEqual({ proposal, source: "core" });
    expect(fetcher).toHaveBeenCalledWith(
      "/api/strategy-research/proposals",
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it("rejects a proposal read back for a different source run", async () => {
    const fetcher = vi.fn(async () => jsonResponse({
      proposal: {
        ...proposal,
        sourceRunId: "run-stale",
        evidence: { ...proposal.evidence, sourceRunId: "run-stale" },
      },
    })) as WorkspaceFetcher;

    const result = await createStrategyResearchProposal("/", {
      sourceRunId: "run-current",
      goal: "提升样本外稳健性",
      providerId: "local",
      externalDataApproved: false,
    }, fetcher);

    expect(result).toEqual({
      source: "fallback",
      error: "Strategy research proposal source changed",
    });
  });

  it("requires an explicit confirmed launch and sends only its three fields", async () => {
    const fetcher = vi.fn(async () => jsonResponse({
      launch: {
        proposalId: proposal.proposalId,
        experimentId: "experiment-1",
        status: "pending",
        operator: "researcher@example.com",
        boundary: {
          experimentStarted: true,
          promotionExecuted: false,
          strategyBound: false,
          monitoringStarted: false,
          orderSubmitted: false,
          paperOnly: true,
          liveBlockedBoundary: true,
        },
      },
    }, 201)) as WorkspaceFetcher;

    await expect(launchStrategyResearchExperiment("/", {
      proposalId: proposal.proposalId,
      operator: "researcher@example.com",
      confirmed: false,
    }, fetcher)).rejects.toThrow("explicit confirmation");
    expect(fetcher).not.toHaveBeenCalled();

    const launchRequest = {
      proposalId: proposal.proposalId,
      operator: "researcher@example.com",
      confirmed: true,
      winner: "forged-winner",
      rank: 1,
    };
    const result = await launchStrategyResearchExperiment("/", launchRequest, fetcher);

    expect(result.launch?.experimentId).toBe("experiment-1");
    const [url, init] = vi.mocked(fetcher).mock.calls[0];
    expect(url).toBe("/api/strategy-research/launches");
    expect(JSON.parse(String(init?.body))).toEqual({
      proposalId: proposal.proposalId,
      operator: "researcher@example.com",
      confirmed: true,
    });
  });

  it("aborts launch at the transport boundary and rejects a mismatched proposal response", async () => {
    const controller = new AbortController();
    const launch = {
      proposalId: "strategy-research-proposal-stale",
      experimentId: "experiment-stale",
      status: "pending",
      operator: "researcher@example.com",
      boundary: {
        experimentStarted: true,
        promotionExecuted: false,
        strategyBound: false,
        monitoringStarted: false,
        orderSubmitted: false,
        paperOnly: true,
        liveBlockedBoundary: true,
      },
    } as const;
    const fetcher = vi.fn(async () => jsonResponse({ launch }, 201)) as WorkspaceFetcher;

    const result = await launchStrategyResearchExperiment("/", {
      proposalId: proposal.proposalId,
      operator: "researcher@example.com",
      confirmed: true,
    }, controller.signal, fetcher);

    expect(fetcher).toHaveBeenCalledWith(
      "/api/strategy-research/launches",
      expect.objectContaining({ signal: controller.signal }),
    );
    expect(result).toEqual({
      source: "fallback",
      error: "Strategy research launch proposal changed",
    });
  });

  it("loads the server-owned aggregate and polls only while the formal experiment is pending", async () => {
    const research = {
      proposal,
      experiment: {
        experimentId: "experiment / 1",
        createdAt: "2026-08-10T10:00:00Z",
        status: "pending",
        strategyRevision: "strategy-v1",
        sourceRunId: "run-source",
        evaluationCount: 0,
        selectedCandidateId: null,
        completionReason: null,
        profitabilityGatePassed: false,
        holdoutStatus: "unconsumed",
        errorCode: null,
        errorDetail: null,
        candidates: [],
      },
      reviews: [],
      promotion: null,
      library: null,
      paper: {
        status: "not_bound",
        enabled: false,
        executionMode: "paper",
        paperOnly: true,
        liveBlockedBoundary: true,
      },
      nextActions: ["wait_for_formal_experiment"],
      boundary: {
        readOnly: true,
        testBarsExposed: false,
        promotionExecuted: false,
        strategyBound: false,
        monitoringStarted: false,
        orderSubmitted: false,
        paperOnly: true,
        liveBlockedBoundary: true,
      },
    } as const;
    const fetcher = vi.fn(async () => jsonResponse({ research })) as WorkspaceFetcher;

    const result = await loadStrategyResearchExperiment("/", "experiment / 1", fetcher);

    expect(result).toEqual({ research, source: "core" });
    expect(fetcher).toHaveBeenCalledWith(
      "/api/strategy-research/experiments/experiment%20%2F%201",
      undefined,
    );
    expect(shouldPollStrategyResearch(result.research)).toBe(true);
    expect(shouldPollStrategyResearch({
      ...research,
      experiment: { ...research.experiment, status: "completed" },
    })).toBe(false);
    expect(shouldPollStrategyResearch(null)).toBe(false);
  });

  it("accepts the fail-closed unavailable Paper projection and its matching runtime action", async () => {
    const research = {
      proposal,
      experiment: {
        experimentId: "experiment-1",
        createdAt: "2026-08-10T10:00:00Z",
        status: "completed",
        strategyRevision: "strategy-v1",
        sourceRunId: "run-source",
        evaluationCount: 1,
        selectedCandidateId: "candidate-1",
        completionReason: "completed",
        profitabilityGatePassed: true,
        holdoutStatus: "consumed",
        errorCode: null,
        errorDetail: null,
        candidates: [],
      },
      reviews: [],
      promotion: { strategyRevision: "strategy-v1" },
      library: { revision: "strategy-v1" },
      paper: {
        status: "unavailable",
        enabled: false,
        executionMode: "live",
        paperOnly: false,
        liveBlockedBoundary: false,
      },
      nextActions: ["inspect_paper_runtime_boundary"],
      boundary: {
        readOnly: true,
        testBarsExposed: false,
        promotionExecuted: true,
        strategyBound: false,
        monitoringStarted: false,
        orderSubmitted: false,
        paperOnly: false,
        liveBlockedBoundary: false,
      },
    } as const;
    const fetcher = vi.fn(async () => jsonResponse({ research })) as WorkspaceFetcher;

    await expect(loadStrategyResearchExperiment("/", "experiment-1", fetcher)).resolves.toEqual({
      research,
      source: "core",
    });

    for (const invalid of [
      { ...research, boundary: { ...research.boundary, strategyBound: true } },
      { ...research, boundary: { ...research.boundary, monitoringStarted: true } },
      { ...research, boundary: { ...research.boundary, paperOnly: true } },
      { ...research, boundary: { ...research.boundary, liveBlockedBoundary: true } },
      { ...research, nextActions: ["monitor_paper_trial"] },
      { ...research, paper: { ...research.paper, paperOnly: true } },
      { ...research, paper: { ...research.paper, liveBlockedBoundary: true } },
    ]) {
      const invalidFetcher = vi.fn(async () => jsonResponse({
        research: invalid,
      })) as WorkspaceFetcher;
      await expect(
        loadStrategyResearchExperiment("/", "experiment-1", invalidFetcher),
      ).resolves.toEqual({
        source: "fallback",
        error: "Invalid strategy research aggregate contract",
      });
    }
  });

  it("accepts unavailable Paper across the backend experiment state matrix and rejects action drift", async () => {
    const pendingExperiment = {
      experimentId: "experiment-1",
      createdAt: "2026-08-10T10:00:00Z",
      status: "pending",
      strategyRevision: "strategy-v1",
      sourceRunId: "run-source",
      evaluationCount: 0,
      selectedCandidateId: null,
      completionReason: null,
      profitabilityGatePassed: false,
      holdoutStatus: "unconsumed",
      errorCode: null,
      errorDetail: null,
      candidates: [],
    } as const;
    const unavailablePaper = {
      status: "unavailable",
      enabled: false,
      executionMode: null,
      paperOnly: false,
      liveBlockedBoundary: false,
    } as const;
    const backendUnavailablePaperStateMatrix = [
      {
        label: "pending",
        experiment: pendingExperiment,
        promotion: null,
        nextActions: ["wait_for_formal_experiment"],
      },
      {
        label: "failed",
        experiment: {
          ...pendingExperiment,
          status: "failed",
          completionReason: "failed",
          errorCode: "strategy_experiment_failed",
          errorDetail: "Formal experiment failed.",
        },
        promotion: null,
        nextActions: ["inspect_formal_experiment_failure"],
      },
      {
        label: "completed non-admissible",
        experiment: {
          ...pendingExperiment,
          status: "completed",
          evaluationCount: 1,
          selectedCandidateId: "candidate-1",
          completionReason: "formal_profitability_gate_failed",
          holdoutStatus: "consumed",
        },
        promotion: null,
        nextActions: ["review_non_admissible_result"],
      },
      {
        label: "completed admissible but not promoted",
        experiment: {
          ...pendingExperiment,
          status: "completed",
          evaluationCount: 1,
          selectedCandidateId: "candidate-1",
          completionReason: "completed",
          profitabilityGatePassed: true,
          holdoutStatus: "consumed",
        },
        promotion: null,
        nextActions: ["run_fresh_p0", "promote_winner_explicitly"],
      },
      {
        label: "completed and promoted",
        experiment: {
          ...pendingExperiment,
          status: "completed",
          evaluationCount: 1,
          selectedCandidateId: "candidate-1",
          completionReason: "completed",
          profitabilityGatePassed: true,
          holdoutStatus: "consumed",
        },
        promotion: { strategyRevision: "strategy-v1" },
        nextActions: ["inspect_paper_runtime_boundary"],
      },
    ] as const;

    for (const state of backendUnavailablePaperStateMatrix) {
      const research = {
        proposal,
        experiment: state.experiment,
        reviews: [],
        promotion: state.promotion,
        library: null,
        paper: unavailablePaper,
        nextActions: state.nextActions,
        boundary: {
          readOnly: true,
          testBarsExposed: false,
          promotionExecuted: state.promotion !== null,
          strategyBound: false,
          monitoringStarted: false,
          orderSubmitted: false,
          paperOnly: false,
          liveBlockedBoundary: false,
        },
      } as const;
      const fetcher = vi.fn(async () => jsonResponse({ research })) as WorkspaceFetcher;

      await expect(
        loadStrategyResearchExperiment("/", "experiment-1", fetcher),
        state.label,
      ).resolves.toEqual({ research, source: "core" });

      const driftedFetcher = vi.fn(async () => jsonResponse({
        research: { ...research, nextActions: ["monitor_paper_trial"] },
      })) as WorkspaceFetcher;
      await expect(
        loadStrategyResearchExperiment("/", "experiment-1", driftedFetcher),
        `${state.label} action drift`,
      ).resolves.toEqual({
        source: "fallback",
        error: "Invalid strategy research aggregate contract",
      });
    }
  });

  it("rejects protected holdout fields anywhere inside aggregate records", async () => {
    const research = {
      proposal,
      experiment: {
        experimentId: "experiment-1",
        createdAt: "2026-08-10T10:00:00Z",
        status: "completed",
        strategyRevision: "strategy-v1",
        sourceRunId: "run-source",
        evaluationCount: 1,
        selectedCandidateId: "candidate-1",
        completionReason: "completed",
        profitabilityGatePassed: true,
        holdoutStatus: "consumed",
        errorCode: null,
        errorDetail: null,
        candidates: [{
          candidateId: "candidate-1",
          testMetrics: { totalReturnPct: 2.1, profitFactor: 1.4 },
          gateEvaluation: {
            test: {
              passed: true,
              failures: [],
              metrics: { totalReturnPct: 2.1, profitFactor: 1.4 },
              guardrails: {
                requirePositiveReturn: true,
                minimumProfitFactor: 1.2,
                maximumDrawdownPct: 3,
                minimumRoundTripCount: 6,
              },
            },
          },
        }],
      },
      reviews: [],
      promotion: null,
      library: null,
      paper: {
        status: "not_bound",
        enabled: false,
        executionMode: "paper",
        paperOnly: true,
        liveBlockedBoundary: true,
      },
      nextActions: ["run_fresh_p0"],
      boundary: {
        readOnly: true,
        testBarsExposed: false,
        promotionExecuted: false,
        strategyBound: false,
        monitoringStarted: false,
        orderSubmitted: false,
        paperOnly: true,
        liveBlockedBoundary: true,
      },
    } as const;

    for (const protectedRecord of [
      { nested: { testBars: [{ close: 1 }] } },
      { nested: { TEST_HASH: "secret" } },
      { nested: [{ dataset_hash: "secret" }] },
      { nested: { "withheld-rows": 100 } },
      { nested: { sealedDatasetHash: "secret" } },
      { nested: { withheldRowsCount: 100 } },
      { nested: { claimedTestHash: "secret" } },
      { nested: { testBarsChunk: [{ close: 1 }] } },
      { nested: { testDefinitionHash: "secret" } },
      { nested: { testDataHash: "secret" } },
      { nested: { holdoutHash: "secret" } },
      { nested: { withheldBars: [{ close: 1 }] } },
      { nested: { sealedDatasetId: "secret" } },
      { nested: { sealed_data_set_identity: "secret" } },
      { nested: { datasetIdentity: "secret" } },
      { nested: { pretestDefinitionHash: "secret" } },
      { nested: { testPartition: "secret" } },
      { nested: { holdoutStatus: "sealed-dataset-secret" } },
      { nested: { testRead: "sealed-dataset-secret" } },
      { nested: { testBarsExposed: "sealed-dataset-secret" } },
      { nested: { testMetrics: { bars: [{ close: 1 }] } } },
      {
        nested: {
          gateEvaluation: {
            test: {
              passed: true,
              failures: [],
              metrics: { totalReturnPct: 2.1 },
              guardrails: {
                requirePositiveReturn: true,
                minimumProfitFactor: 1.2,
                maximumDrawdownPct: 3,
                minimumRoundTripCount: 6,
              },
              sealedDatasetId: "secret",
            },
          },
        },
      },
    ]) {
      const fetcher = vi.fn(async () => jsonResponse({
        research: {
          ...research,
          reviews: [protectedRecord],
        },
      })) as WorkspaceFetcher;

      const result = await loadStrategyResearchExperiment("/", "experiment-1", fetcher);

      expect(result).toEqual({
        source: "fallback",
        error: "Invalid strategy research aggregate contract",
      });
    }

    const safeFetcher = vi.fn(async () => jsonResponse({ research })) as WorkspaceFetcher;
    const safeResult = await loadStrategyResearchExperiment(
      "/",
      "experiment-1",
      safeFetcher,
    );
    expect(safeResult).toEqual({ research, source: "core" });
  });
});
