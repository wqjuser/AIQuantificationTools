import { describe, expect, test } from "vitest";
import {
  type AiReviewRunRecord,
  buildBacktestReportMarkdown,
  buildP0AcceptanceReviewMarkdown,
  buildP0AcceptanceSummary,
  buildP1AcceptanceSummary,
  buildP2PaperReplaySummary,
  buildP2PreLiveAcceptanceSummary,
  buildP2ManifestChainPreflightReviewMarkdown,
  buildP2ManifestChainPreflightSummary,
  buildP2ReadinessAcceptanceReviewMarkdown,
  buildP2ReadinessEvidenceCoverageReviewMarkdown,
  buildDailyOpsControlRoomReviewMarkdown,
  buildDailyStartBriefMarkdown,
  buildPersonalTeamUsabilityReadinessReviewMarkdown,
  buildP0CompletionChecklist,
  buildP0PlatformActionOutcome,
  buildP0PlatformActionOutcomeEvidenceLink,
  buildP0PlatformBacklogItems,
  buildP0PaperExecutionPreflight,
  buildP0PlatformReadinessReportMarkdown,
  buildP0PlatformReadinessSummary,
  buildPortfolioBacktestReportMarkdown,
  buildResearchContextEvidenceRows,
  buildResearchContextReadinessReportArchive,
  buildResearchContextReadinessRows,
  buildResearchPipelinePreflight,
  buildExecutionAdapterPreLiveRunbookMarkdown,
  buildExecutionAdapterPreLiveRunbookSummary,
  buildOperatorRunbookMarkdown,
  buildTerminalWorkspace,
  workspaceFromResearchRunAudit,
  workspaceWithSavedResearchWorkspaceState,
  workspaceWithBacktestAssumption,
  workspaceWithStrategyField,
  type DailyOpsControlRoomSummary,
  type DailyStartBrief,
  type OperatorRunbookSummary,
  type P0AcceptanceSummarySource,
  type PersonalTeamUsabilityReadinessSummary,
  type P2ReadinessEvidenceCoverage,
  type P2ReadinessAcceptanceReviewSource,
  type P2ReadinessAcceptanceSummary,
  type ResearchRunAudit,
  type ResearchRunStrategyConfig,
  type StrategyExperimentDetail
} from "./terminal-workbench";
import {
  buildP0AcceptanceLatestUrl,
  buildP1AcceptanceLatestUrl,
  buildP2PaperReplayLatestUrl,
  buildP2PreLiveAcceptanceLatestUrl,
  buildP2ReadinessAcceptanceUrl,
  buildP2ReadinessAcceptanceLatestUrl,
  buildP2ManifestChainPreflightUrl,
  buildP2ManifestChainPreflightLatestUrl,
  buildP0AiReviewUrl,
  buildP0PaperSimulationUrl,
  buildP0PipelineUrl,
  buildResearchRunUrl,
  buildResearchRunDetailUrl,
  buildResearchRunExportUrl,
  buildResearchRunImportUrl,
  buildResearchRunImportUndoUrl,
  buildResearchNoteUrl,
  buildResearchRunPaperExecutionsUrl,
  buildResearchRunPromotionUrl,
  buildResearchRunAiReviewsUrl,
  buildAuthoritativeAiReviewUrl,
  buildAuthoritativeAiReviewsUrl,
  buildAiReviewDecisionsUrl,
  buildMarketCalendarUrl,
  buildPortfolioBacktestUrl,
  buildPortfolioPaperOrderApprovalsUrl,
  buildPortfolioPaperOrdersUrl,
  buildPortfolioPaperOrderReplayUrl,
  buildPortfolioPaperOrderStateHistoryUrl,
  buildPortfolioPaperOrderBatchSimulationsUrl,
  buildPortfolioPaperOrderSimulationsUrl,
  buildAuditEventsUrl,
  buildAuditReportSignUrl,
  buildAuditReportVerifyUrl,
  buildAuditReportVerifyPackageUrl,
  buildAuditReportRevokeUrl,
  buildAuditSigningKeysUrl,
  buildAuditSigningKeyEnvironmentBindingHistoryUrl,
  buildAuditSigningKeyEnvironmentBindingUrl,
  buildAuditSigningKeyRuntimeReloadExecutionHistoryUrl,
  buildAuditSigningKeyRuntimeReloadExecutionUrl,
  buildAuditSigningKeyRotationAcceptanceHistoryUrl,
  buildAuditSigningKeyRotationAcceptanceUrl,
  buildAuditSigningKeyRuntimeReloadPlanHistoryUrl,
  buildAuditSigningKeyRuntimeReloadPlanUrl,
  buildAuditSigningKeySecretMaterializationHistoryUrl,
  buildAuditSigningKeySecretMaterializationUrl,
  buildAuditSigningKeyRotationApplyUrl,
  buildAuditSigningKeyRotationPlanUrl,
  buildAuditSigningKeyRotationRestartEvidenceUrl,
  buildCacheRefreshUrl,
  buildWatchlistCacheRefreshUrl,
  buildExecutionAdapterCertificationApplyUrl,
  buildExecutionAdapterCertificationAppliesUrl,
  buildExecutionAdapterControlledRestartEvidenceHistoryUrl,
  buildExecutionAdapterControlledRestartEvidenceUrl,
  buildExecutionAdapterRestartAcceptanceHistoryUrl,
  buildExecutionAdapterRestartAcceptanceUrl,
  buildExecutionAdapterSecretManifestValidationHistoryUrl,
  buildExecutionAdapterSecretManifestValidationUrl,
  buildExecutionAdapterSecretMaterializationHistoryUrl,
  buildExecutionAdapterSecretMaterializationUrl,
  buildExecutionAdapterEnvironmentBindingHistoryUrl,
  buildExecutionAdapterEnvironmentBindingUrl,
  buildExecutionAdapterRuntimeReloadAcceptanceHistoryUrl,
  buildExecutionAdapterRuntimeReloadAcceptanceUrl,
  buildExecutionAdapterOrchestrationDryRunHistoryUrl,
  buildExecutionAdapterOrchestrationDryRunUrl,
  buildExecutionAdapterOrchestrationExecutionHistoryUrl,
  buildExecutionAdapterOrchestrationExecutionUrl,
  buildExecutionAdapterHumanConfirmationHistoryUrl,
  buildExecutionAdapterHumanConfirmationUrl,
  buildExecutionAdapterSandboxProbeExecutionHistoryUrl,
  buildExecutionAdapterSandboxProbeExecutionUrl,
  buildExecutionAdapterSandboxProbePlanHistoryUrl,
  buildExecutionAdapterSandboxProbePlanUrl,
  buildExecutionAdapterSandboxProbeReviewHistoryUrl,
  buildExecutionAdapterSandboxProbeReviewUrl,
  buildExecutionAdapterProductionRouteReviewHistoryUrl,
  buildExecutionAdapterProductionRouteReviewUrl,
  buildExecutionAdapterPaperOrderLifecycleHistoryUrl,
  buildExecutionAdapterPaperOrderLifecycleUrl,
  buildExecutionAdapterPaperExecutionHistoryUrl,
  buildExecutionAdapterPaperExecutionUrl,
  buildExecutionAdapterOpsStateHistoryUrl,
  buildExecutionAdapterOpsStateUrl,
  buildExecutionAdapterPaperRouteRunbookHistoryUrl,
  buildExecutionAdapterPaperRouteRunbookUrl,
  buildExecutionAdapterSandboxOrderSchemaDryRunHistoryUrl,
  buildExecutionAdapterSandboxOrderSchemaDryRunUrl,
  buildExecutionAdapterHealthProbeUrl,
  buildExecutionAdapterRuntimeReloadExecutionHistoryUrl,
  buildExecutionAdapterRuntimeReloadExecutionUrl,
  buildExecutionAdapterRuntimeReloadPlanHistoryUrl,
  buildExecutionAdapterRuntimeReloadPlanUrl,
  buildExecutionAdapterSecretReferenceHistoryUrl,
  buildExecutionAdapterSecretReferenceUrl,
  buildExecutionAdapterCertificationsUrl,
  buildExecutionAdapterLedgerUrl,
  buildSettingsStatusUrl,
  buildStrategiesUrl,
  buildStrategyDetailUrl,
  buildStrategyExperimentDetailUrl,
  buildStrategyExperimentsUrl,
  buildStrategyValidationUrl,
  buildResearchRunsUrl,
  buildMarketDataReadinessUrl,
  buildMarketKlinesUrl,
  buildMarketSearchUrl,
  buildWatchlistUrl,
  buildLoadingMarketKlinesResult,
  buildGoldenPathStatusUrl,
  loadGoldenPathStatus,
  loadMarketDataReadiness,
  loadMarketKlines,
  loadMarketCalendarStatus,
  loadMarketSearch,
  loadResearchRunDetail,
  loadResearchRunExport,
  loadLatestResearchRunPaperExecution,
  loadResearchRunPromotion,
  loadPortfolioPaperOrderBatches,
  loadPortfolioPaperOrderApprovals,
  loadPortfolioPaperOrderReplay,
  loadPortfolioPaperOrderStateHistory,
  loadPortfolioPaperOrderSimulations,
  loadExecutionAdapterLedger,
  loadExecutionAdapterCertificationApplies,
  loadExecutionAdapterControlledRestartEvidence,
  loadExecutionAdapterRestartAcceptances,
  loadExecutionAdapterSecretManifestValidations,
  loadExecutionAdapterSecretMaterializations,
  loadExecutionAdapterEnvironmentBindings,
  loadExecutionAdapterRuntimeReloadAcceptances,
  loadExecutionAdapterOrchestrationDryRuns,
  loadExecutionAdapterOrchestrationExecutions,
  loadExecutionAdapterHumanConfirmations,
  loadExecutionAdapterSandboxProbeExecutions,
  loadExecutionAdapterSandboxProbePlans,
  loadExecutionAdapterSandboxProbeReviews,
  loadExecutionAdapterProductionRouteReviews,
  loadExecutionAdapterPaperOrderLifecycles,
  loadExecutionAdapterPaperExecutions,
  loadExecutionAdapterOpsStates,
  loadExecutionAdapterPaperRouteRunbooks,
  loadExecutionAdapterSandboxOrderSchemaDryRuns,
  loadExecutionAdapterHealthProbe,
  loadExecutionAdapterRuntimeReloadExecutions,
  loadExecutionAdapterRuntimeReloadPlans,
  loadExecutionAdapterSecretReferences,
  loadExecutionAdapterCertifications,
  runPortfolioBacktest,
  recordPortfolioPaperOrderBatch,
  recordPortfolioPaperOrderApproval,
  recordPortfolioPaperOrderBatchSimulation,
  recordPortfolioPaperOrderSimulation,
  recordExecutionAdapterCertification,
  recordExecutionAdapterCertificationApply,
  recordExecutionAdapterControlledRestartEvidence,
  recordExecutionAdapterRestartAcceptance,
  recordExecutionAdapterSecretManifestValidation,
  recordExecutionAdapterSecretMaterialization,
  recordExecutionAdapterEnvironmentBinding,
  recordExecutionAdapterRuntimeReloadAcceptance,
  recordExecutionAdapterOrchestrationDryRun,
  recordExecutionAdapterOrchestrationExecution,
  recordExecutionAdapterHumanConfirmation,
  recordExecutionAdapterSandboxProbeExecution,
  recordExecutionAdapterSandboxProbePlan,
  recordExecutionAdapterSandboxProbeReview,
  recordExecutionAdapterProductionRouteReview,
  recordExecutionAdapterPaperOrderLifecycle,
  recordExecutionAdapterPaperExecution,
  recordExecutionAdapterOpsState,
  recordExecutionAdapterPaperRouteRunbook,
  recordExecutionAdapterSandboxOrderSchemaDryRun,
  recordExecutionAdapterRuntimeReloadExecution,
  recordExecutionAdapterRuntimeReloadPlan,
  recordExecutionAdapterSecretReference,
  loadResearchNote,
  loadPlatformSettings,
  loadWatchlistCacheRefreshRuns,
  refreshMarketCache,
  refreshMarketCacheBatch,
  refreshWatchlistCacheRun,
  loadStrategyLibrary,
  loadStrategyExperimentDetail,
  loadStrategyExperiments,
  loadAiReviewProviders,
  createAuthoritativeAiReview,
  loadAuthoritativeAiReview,
  loadAuthoritativeAiReviews,
  loadAiReviewDecisions,
  loadAiReviewArchiveImportSnapshot,
  loadAiReviewRunArchiveSnapshot,
  appendAiReviewDecision,
  validateStrategySnapshot,
  submitResearchRunPaperExecution,
  saveAiReviewRunRecord,
  loadResearchRunAiReviews,
  saveAuditEvent,
  loadAuditEvents,
  loadAuditSigningKeys,
  loadAuditSigningKeyEnvironmentBindings,
  loadAuditSigningKeyRotationAcceptances,
  loadAuditSigningKeyRuntimeReloadExecutions,
  loadAuditSigningKeyRuntimeReloadPlans,
  loadAuditSigningKeySecretMaterializations,
  applyAuditSigningKeyRotationPlan,
  prepareAuditSigningKeyRotationPlan,
  recordAuditSigningKeySecretMaterialization,
  recordAuditSigningKeyEnvironmentBinding,
  recordAuditSigningKeyRotationAcceptance,
  recordAuditSigningKeyRuntimeReloadExecution,
  recordAuditSigningKeyRuntimeReloadPlan,
  recordAuditSigningKeyControlledRestartEvidence,
  signAuditReportEvent,
  verifyAuditReportEvent,
  verifyResearchRunExportReportSignature,
  revokeAuditReportEvent,
  saveResearchNote,
  saveStrategySnapshot,
  createStrategyExperiment,
  withResearchRunExportAuditEvidenceArtifacts,
  buildBacktestReportAuditEvent,
  buildPortfolioBacktestReportAuditEvent,
  buildP0AcceptanceReviewAuditEvent,
  buildP2ManifestChainPreflightReviewAuditEvent,
  buildP2ReadinessEvidenceCoverageReviewAuditEvent,
  buildP2ReadinessAcceptanceReviewAuditEvent,
  buildDailyOpsControlRoomReviewAuditEvent,
  buildDailyStartBriefReviewAuditEvent,
  buildPersonalTeamUsabilityReadinessReviewAuditEvent,
  buildStage1P0DailyUseArchiveReviewAuditEvent,
  buildP0PlatformReadinessReportAuditEvent,
  buildExecutionAdapterPreLiveRunbookAuditEvent,
  buildOperatorRunbookAuditEvent,
  buildResearchContextReadinessReportAuditEvent,
  buildResearchRunExportAuditReport,
  buildAuditEvidenceReportAuditEvent,
  buildMarketDataRefreshOverrideAuditEvent,
  buildAuditSigningKeyRotationApplyAuditEvent,
  buildAuditSigningKeyRotationPlanAuditEvent,
  withResearchRunExportReportSignatures,
  withVerifiedResearchRunExportPackageReportSignatures,
  withResearchRunExportAuditEvidenceSummary,
  normalizeResearchRunExportPackagePayload,
  importResearchRunExport,
  undoResearchRunImport,
  marketKlinesFromResearchRunAudit,
  mergeMarketKlines,
  buildWorkspaceUrl,
  loadResearchRunHistory,
  loadTerminalWorkspace,
  resolveQuantCoreBaseUrl,
  runTerminalResearch,
  buildDesktopReleaseLatestUrl,
  loadDesktopReleaseLatest,
  buildStage1BootstrapPreflightLatestUrl,
  buildStage1BootstrapPreflightUrl,
  buildStage1DailyUseUrl,
  buildStage1DailyUseLatestUrl,
  generateStage1BootstrapPreflight,
  generateStage1DailyUse,
  loadStage1BootstrapPreflightLatest,
  loadStage1DailyUseLatest,
  loadP0AcceptanceLatest,
  loadP1AcceptanceLatest,
  loadP2PaperReplayLatest,
  loadP2PreLiveAcceptanceLatest,
  loadP2ReadinessAcceptanceLatest,
  generateP2ReadinessAcceptance,
  loadP2ManifestChainPreflightLatest,
  generateP2ManifestChainPreflight,
  runP0Pipeline,
  runP0AiReview,
  runP0PaperSimulation,
  buildResearchWorkspaceStateUrl,
  saveResearchWorkspaceState,
  saveWatchlist,
  buildApiUrl,
  coreErrorDetail,
  type AuditEventRecord,
  type PortfolioBacktestRun,
  type ResearchRunExportPackage
} from "./terminal-api";

describe("Stage 4 portfolio workflow shared API utilities", () => {
  test("encode query values and extract only safe server error text", () => {
    expect(buildApiUrl("/", "/api/portfolio/workflows", (url) => url.searchParams.set("baseRunId", "run /你好"))).toBe(
      "/api/portfolio/workflows?baseRunId=run+%2F%E4%BD%A0%E5%A5%BD"
    );
    expect(coreErrorDetail({ detail: "safe detail", secret: "not returned" })).toBe("safe detail");
    expect(coreErrorDetail({ error: "safe code" })).toBe("safe code");
  });
});

const sampleAkshareInstallGuidance = {
  packageName: "akshare",
  dockerBuildArg: "INSTALL_DATA_DEPS=true",
  packageInstallCommand: "pip install akshare",
  projectExtraInstallCommand: 'pip install -e "services/quant_core[data]"',
  note: "Installs optional public market data dependencies only; it does not configure API keys or enable live trading."
} as const;

const sampleYfinanceInstallGuidance = {
  ...sampleAkshareInstallGuidance,
  packageName: "yfinance",
  packageInstallCommand: "pip install yfinance"
} as const;

const sampleCcxtInstallGuidance = {
  ...sampleAkshareInstallGuidance,
  packageName: "ccxt",
  packageInstallCommand: "pip install ccxt"
} as const;

function sampleStrategyExperimentDetail(): StrategyExperimentDetail {
  const metrics = {
    totalReturnPct: 4.2,
    annualReturnPct: 12.4,
    maxDrawdownPct: 3.1,
    winRatePct: 62.5,
    profitFactor: 1.8,
    tradeCount: 8
  };
  const baseStrategy: ResearchRunStrategyConfig = {
    name: "SMA plan",
    revision: "rev/a",
    market: "ashare",
    symbols: ["600000"],
    timeframe: "1d",
    version: 1,
    entryConditions: [{ kind: "close_above_sma", params: { window: 10 } }],
    exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
    risk: {
      positionPct: 0.4,
      stopLossPct: 0.06,
      takeProfitPct: 0.12,
      maxDrawdownPct: 0.09
    }
  };
  return {
    experimentId: "experiment-1",
    createdAt: "2026-07-10T08:00:00+00:00",
    status: "completed",
    definitionHash: "definition-hash-1",
    holdoutKey: "holdout-key-1",
    strategyLineageKey: stage3Hash("7"),
    strategyRevision: "rev/a",
    sourceRunId: "run 1",
    snapshotId: "snapshot-1",
    market: "ashare",
    symbol: "600000",
    timeframe: "1d",
    definition: {
      baseStrategy,
      strategyRevision: "rev/a",
      sourceRunId: "run 1",
      snapshotId: "snapshot-1",
      canonicalDataHash: "data-hash-1",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      assumptions: { initialCash: 100000, feeBps: 3, slippageBps: 2 },
      split: { trainPct: 60, validationPct: 20, testPct: 20 },
      dimensions: [
        { conditionSide: "entry", conditionIndex: 0, parameter: "window", values: [10, 15] }
      ],
      guardrails: { minimumTradeCount: 2, maximumDrawdownPct: 20 },
      walkForward: { trainBars: 40, validationBars: 10, stepBars: 10 },
      evaluationBudget: 13,
      engineVersion: "backtest-v1",
      resultSchemaVersion: 1
    },
    evaluationCount: 13,
    selectedCandidateId: "candidate-a",
    completionReason: "selected",
    resultHash: "result-hash-1",
    errorCode: null,
    errorDetail: null,
    holdoutStatus: "consumed",
    snapshot: {
      snapshotId: "snapshot-1",
      createdAt: "2026-07-10T07:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      canonicalDataHash: "data-hash-1",
      rows: 1,
      startAt: "2026-07-09T08:00:00+00:00",
      endAt: "2026-07-09T08:00:00+00:00",
      bars: [
        {
          timestamp: "2026-07-09T08:00:00+00:00",
          timestampMs: 1783584000000,
          open: 9.1,
          high: 9.4,
          low: 9,
          close: 9.3,
          volume: 1300000
        }
      ],
      testDefinitionHash: "definition-hash-1",
      testOwnerExperimentId: "experiment-1",
      testConsumedAt: "2026-07-10T08:00:00+00:00"
    },
    candidates: [
      {
        candidateId: "candidate-a",
        candidateRevision: "candidate-rev-a",
        parameters: [{ conditionSide: "entry", conditionIndex: 0, parameter: "window", value: 15 }],
        trainMetrics: metrics,
        validationMetrics: metrics,
        testMetrics: metrics,
        walkForward: {
          windows: [
            {
              index: 0,
              trainStartIndex: 0,
              trainEndIndex: 40,
              validationStartIndex: 40,
              validationEndIndex: 50,
              trainMetrics: metrics,
              validationMetrics: metrics
            }
          ],
          validationWindowCount: 1,
          positiveReturnCount: 1,
          medianReturnPct: 4.2,
          worstDrawdownPct: 3.1
        },
        eligible: true,
        rank: 1
      }
    ]
  };
}

const stage3Hash = (digit: string): string => digit.repeat(64);

function sampleAuthoritativeAiReviewPayload() {
  const primaryExperiment = {
    experimentId: "primary",
    sourceRunId: "run-primary",
    strategyRevision: stage3Hash("1"),
    snapshotId: stage3Hash("2"),
    definitionHash: stage3Hash("3"),
    resultHash: stage3Hash("4"),
    selectedCandidateId: "candidate-primary",
    candidateRevision: stage3Hash("5"),
    canonicalDataHash: stage3Hash("6"),
    dataRange: {
      startAt: "2026-01-01T00:00:00+00:00",
      endAt: "2026-06-30T00:00:00+00:00"
    }
  };
  const assessment = {
    stance: "supported",
    summary: "The persisted evidence supports another research iteration.",
    risks: [],
    invalidationConditions: [],
    watchItems: [],
    evidenceGaps: [],
    consistency: "consistent"
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
    strategyLineageKey: stage3Hash("7"),
    evidenceBundle: {
      schemaVersion: 1,
      mode: "single",
      primaryExperiment,
      comparisonExperiments: [],
      strategyLineageKey: stage3Hash("7"),
      evidenceItems: [
        {
          id: "experiment:primary:context",
          kind: "experiment_context",
          value: { market: "ashare", symbol: "600000", timeframe: "1d" }
        }
      ],
      safetyBoundary: { paperOnly: true, liveTradingAllowed: false, orderSubmissionAllowed: false },
      evidenceHash: stage3Hash("8")
    },
    evidenceHash: stage3Hash("8"),
    deterministicAssessment: assessment,
    externalAssessment: {
      status: "skipped",
      provider: "local",
      model: null,
      sanitizedBaseUrl: null,
      endpointHash: null,
      promptTemplateVersion: "aiqt-ai-review-v1",
      outputSchemaVersion: "aiqt-ai-review-assessment-v1",
      renderedPrompt: "",
      renderedPromptHash: stage3Hash("9"),
      evidenceHash: stage3Hash("8"),
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
    recordHash: stage3Hash("a")
  };
}

function sampleAiReviewDecisionPayload(index = 1) {
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
    reviewRecordHash: stage3Hash("a"),
    evidenceHash: stage3Hash("8"),
    boundary: { paperOnly: true, liveTradingAllowed: false, orderSubmissionAllowed: false },
    recordHash: stage3Hash(String(index))
  };
}

function sampleLegacyAiReviewHistoryPayload() {
  return {
    schemaVersion: 1,
    recordType: "aiqt.aiReviewRun",
    aiReviewId: "ai-review-v1-http",
    runId: "run-primary",
    createdAt: "2026-07-10T07:00:00+00:00",
    authority: "legacy",
    status: "ready",
    summary: { liveExecutionBlocked: true },
    dossier: { headline: "Legacy HTTP review" },
    citations: [],
    rounds: [],
    decisionLog: [],
    boundary: "Evidence explanation only; live routing remains blocked."
  };
}

function sampleStage3ArchiveExportPackage() {
  const review = sampleAuthoritativeAiReviewPayload();
  const { authority: _authority, ...archiveReview } = review;
  const decision = sampleAiReviewDecisionPayload();
  return {
    kind: "aiqt.researchRun.export",
    packageVersion: 1,
    exportedAt: "2026-07-10T09:00:00+00:00",
    manifest: {
      runId: "run-primary",
      createdAt: "2026-07-10T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyRevision: stage3Hash("1"),
      dataHash: "stage3-archive-snapshot",
      dataRows: 0,
      executionMode: "paper_only",
      paperOnly: true,
      liveBlockedBoundary: true,
      liveTradingAllowed: false,
      orderSubmissionEnabled: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      artifactCounts: {
        bars: 0,
        trades: 0,
        equityPoints: 0,
        decisions: 0,
        aiRisks: 0,
        aiReviewRuns: 0,
        aiReviewRunsV2: 1,
        aiReviewDecisions: 1
      }
    },
    researchRun: {
      runId: "run-primary",
      createdAt: "2026-07-10T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "Stage 3 archive",
      strategyRevision: stage3Hash("1"),
      dataRows: 0,
      metrics: {},
      decisions: [],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "fixture",
        isComplete: true,
        warnings: [],
        rows: 0,
        start: null,
        end: null,
        hash: "stage3-archive-snapshot",
        bars: []
      }
    },
    executionHandoff: {
      mode: "paper_only",
      paperOnly: true,
      liveTradingAllowed: false,
      requiredGates: []
    },
    aiReviewRuns: [],
    aiReviewRunsV2: [
      {
        aiReviewId: review.aiReviewId,
        runId: review.primaryExperiment.sourceRunId,
        createdAt: review.createdAt,
        record: archiveReview
      }
    ],
    aiReviewDecisions: [
      {
        decisionId: decision.decisionId,
        aiReviewId: decision.aiReviewId,
        createdAt: decision.createdAt,
        record: decision
      }
    ]
  };
}

function sampleLegacyArchiveEnvelope(aiReviewId: string) {
  const record = {
    schemaVersion: 1,
    recordType: "aiqt.aiReviewRun",
    aiReviewId,
    runId: "run-primary",
    createdAt: "2026-07-10T07:00:00+00:00",
    market: "ashare",
    symbol: "600000",
    timeframe: "1d",
    strategyRevision: stage3Hash("1"),
    executionMode: "paper_only",
    status: "ready",
    summary: {
      citationCount: 0,
      roundCount: 0,
      decisionCount: 0,
      parameterScanBound: false,
      liveExecutionBlocked: true
    },
    dossier: {
      status: "ready",
      headline: "Legacy review",
      summary: "Legacy evidence explanation.",
      citations: []
    },
    citations: [],
    rounds: [],
    decisionLog: [],
    boundary: "Evidence explanation only; live routing remains blocked."
  };
  return {
    aiReviewId,
    runId: record.runId,
    createdAt: record.createdAt,
    record
  };
}

function sampleStage1BootstrapPreflight(status: "ready" | "review" | "blocked" = "ready") {
  const checkStatus = status === "ready" ? "ready" : status === "review" ? "review" : "blocked";
  return {
    kind: "aiqt.stage1BootstrapPreflight",
    schemaVersion: 1,
    generatedAt: "2026-07-02T10:00:00+00:00",
    status,
    summary: `Stage 1 bootstrap preflight ${status}.`,
    ready: status === "ready",
    readyCount: status === "ready" ? 7 : 1,
    reviewCount: status === "review" ? 6 : 0,
    blockedCount: status === "blocked" ? 6 : 0,
    totalCount: 7,
    nextAction: status === "ready" ? "open-daily-workbench" : "run-p0-acceptance",
    recommendedCommand: status === "ready" ? "npm run dev" : "npm run docker:smoke:p0 -- --no-build --down",
    blockerIds: status === "blocked" ? ["p0-acceptance"] : [],
    reviewIds: status === "review" ? ["p0-acceptance"] : [],
    paperOnly: true,
    liveTradingAllowed: false,
    liveBlockedBoundary: true,
    sourcePath: "data/stage1-bootstrap-preflight.json",
    sourcePaths: {
      p0Acceptance: "data/p0-acceptance.json",
      p1Acceptance: "data/p1-acceptance.json",
      p2ManifestChainPreflight: "data/p2-chain-preflight.json",
      desktopRelease: "data/desktop-release.json",
      stage1DailyUse: "data/stage1-daily-use.json"
    },
    checks: [
      {
        id: "package-scripts",
        label: "Package scripts",
        status: "ready",
        summary: "Required Stage 1 scripts are present.",
        recommendedCommand: "npm run stage1:preflight:validate",
        sourcePath: "package.json",
        paperOnly: true,
        liveTradingAllowed: false,
        liveBlockedBoundary: true
      },
      {
        id: "p0-acceptance",
        label: "P0 acceptance",
        status: checkStatus,
        summary: "P0 acceptance is ready.",
        recommendedCommand: status === "ready" ? "npm run stage1:preflight:validate" : "npm run docker:smoke:p0 -- --no-build --down",
        sourcePath: "data/p0-acceptance.json",
        paperOnly: true,
        liveTradingAllowed: false,
        liveBlockedBoundary: true
      },
      {
        id: "p1-acceptance",
        label: "P1 acceptance",
        status: checkStatus,
        summary: "P1 acceptance is ready.",
        recommendedCommand: "npm run stage1:preflight:validate",
        sourcePath: "data/p1-acceptance.json",
        paperOnly: true,
        liveTradingAllowed: false,
        liveBlockedBoundary: true
      },
      {
        id: "p2-manifest-chain",
        label: "P2 manifest chain",
        status: checkStatus,
        summary: "P2 manifest chain preflight is ready.",
        recommendedCommand: "npm run stage1:preflight:validate",
        sourcePath: "data/p2-chain-preflight.json",
        paperOnly: true,
        liveTradingAllowed: false,
        liveBlockedBoundary: true
      },
      {
        id: "desktop-release",
        label: "Desktop release",
        status: checkStatus,
        summary: "Desktop release is ready.",
        recommendedCommand: "npm run stage1:preflight:validate",
        sourcePath: "data/desktop-release.json",
        paperOnly: true,
        liveTradingAllowed: false,
        liveBlockedBoundary: true
      },
      {
        id: "stage1-daily-use",
        label: "Stage 1 daily use",
        status: checkStatus,
        summary: "Stage 1 daily use is ready.",
        recommendedCommand: "npm run stage1:daily:validate",
        sourcePath: "data/stage1-daily-use.json",
        paperOnly: true,
        liveTradingAllowed: false,
        liveBlockedBoundary: true
      },
      {
        id: "live-blocked-boundary",
        label: "Live-blocked boundary",
        status: "ready",
        summary: "Recorded evidence keeps live trading blocked.",
        recommendedCommand: "npm run stage1:preflight:validate",
        sourcePath: "data",
        paperOnly: true,
        liveTradingAllowed: false,
        liveBlockedBoundary: true
      }
    ]
  } as const;
}

const sampleYfinanceProviderError = {
  eventId: "adapter-error-yf",
  createdAt: "2026-06-14T08:10:00+00:00",
  adapterId: "yfinance-ohlcv",
  provider: "yfinance",
  market: "us",
  symbol: "AAPL",
  timeframe: "1d",
  source: "yfinance-fallback",
  context: "market-klines",
  category: "network",
  message: "Yahoo chart timed out"
} as const;

const emptyProviderErrorCategorySummary = {
  rate_limit: 0,
  dependency: 0,
  network: 0,
  upstream: 0,
  incomplete_data: 0,
  unknown: 0
} as const;

const emptyProviderHealthWindow = {
  errorCount: 0,
  latestErrorAt: null,
  categorySummary: emptyProviderErrorCategorySummary,
  dominantCategory: null
} as const;

const sampleCooldownProviderHealthWindow = {
  errorCount: 3,
  latestErrorAt: "2026-06-14T08:14:00+00:00",
  categorySummary: {
    rate_limit: 1,
    dependency: 0,
    network: 1,
    upstream: 0,
    incomplete_data: 1,
    unknown: 0
  },
  dominantCategory: "rate_limit"
} as const;

const sampleOkProviderHealth = {
  status: "ok",
  recentErrorCount: 0,
  lastErrorAt: null,
  affectedSymbols: [],
  affectedContexts: [],
  categorySummary: emptyProviderErrorCategorySummary,
  dominantCategory: null,
  windowSummary: {
    oneHour: emptyProviderHealthWindow,
    twentyFourHours: emptyProviderHealthWindow,
    sevenDays: emptyProviderHealthWindow
  },
  retryAfterSeconds: 0,
  reason: "no_recent_provider_errors"
} as const;

const sampleCooldownProviderHealth = {
  status: "cooldown",
  recentErrorCount: 3,
  lastErrorAt: "2026-06-14T08:14:00+00:00",
  affectedSymbols: ["AAPL", "MSFT"],
  affectedContexts: ["cache-refresh", "market-klines", "watchlist-cache-refresh"],
  categorySummary: sampleCooldownProviderHealthWindow.categorySummary,
  dominantCategory: "rate_limit",
  windowSummary: {
    oneHour: sampleCooldownProviderHealthWindow,
    twentyFourHours: sampleCooldownProviderHealthWindow,
    sevenDays: sampleCooldownProviderHealthWindow
  },
  retryAfterSeconds: 900,
  reason: "provider_cooldown"
} as const;

const sampleBlockedProviderHealth = {
  status: "blocked",
  recentErrorCount: 0,
  lastErrorAt: null,
  affectedSymbols: [],
  affectedContexts: [],
  categorySummary: emptyProviderErrorCategorySummary,
  dominantCategory: null,
  windowSummary: {
    oneHour: emptyProviderHealthWindow,
    twentyFourHours: emptyProviderHealthWindow,
    sevenDays: emptyProviderHealthWindow
  },
  retryAfterSeconds: 0,
  reason: "dependency_missing"
} as const;

const samplePlatformSettingsMarketDataAdapters = [
  {
    id: "akshare-ohlcv",
    market: "ashare",
    adapter: "AkShareMarketDataAdapter",
    provider: "akshare",
    status: "ready",
    route: "public_ohlcv",
    capabilities: ["stock_zh_a_hist", "stock_zh_a_hist_min_em"],
    timeframes: ["1d", "1m", "5m", "15m", "30m", "60m"],
    requiresApiKey: false,
    requiresTradingKey: false,
    cacheScope: "ohlcv",
    cacheDiagnostics: {
      freshness: "fresh",
      contextCount: 1,
      rowCount: 500,
      latestTimestamp: "2026-05-29T00:00:00+00:00",
      freshnessSummary: { fresh: 1, stale: 0, empty: 0 }
    },
    externalTelemetry: {
      status: "ok",
      dependency: "akshare",
      dependencyAvailable: true,
      lastError: null,
      retryState: "idle",
      checkedAt: "2026-06-14T08:00:00+00:00",
      installGuidance: sampleAkshareInstallGuidance,
      lastProviderError: null,
      providerHealth: sampleOkProviderHealth
    },
    note: "A-share public OHLCV adapter."
  },
  {
    id: "yfinance-ohlcv",
    market: "us",
    adapter: "YFinanceMarketDataAdapter",
    provider: "yfinance",
    status: "degraded",
    route: "public_ohlcv",
    capabilities: ["Ticker.history"],
    timeframes: ["1d", "1m", "5m", "15m", "30m", "60m"],
    requiresApiKey: false,
    requiresTradingKey: false,
    cacheScope: "ohlcv",
    cacheDiagnostics: {
      freshness: "empty",
      contextCount: 0,
      rowCount: 0,
      latestTimestamp: null,
      freshnessSummary: { fresh: 0, stale: 0, empty: 0 }
    },
    externalTelemetry: {
      status: "degraded",
      dependency: "yfinance",
      dependencyAvailable: true,
      lastError: "Yahoo chart timed out",
      retryState: "provider_error",
      checkedAt: "2026-06-14T08:00:00+00:00",
      installGuidance: sampleYfinanceInstallGuidance,
      lastProviderError: sampleYfinanceProviderError,
      providerHealth: sampleCooldownProviderHealth
    },
    note: "US equity public OHLCV adapter."
  },
  {
    id: "ccxt-ohlcv",
    market: "crypto",
    adapter: "CcxtMarketDataAdapter",
    provider: "ccxt:binance",
    status: "ready",
    route: "public_ohlcv",
    capabilities: ["fetch_ohlcv"],
    timeframes: ["1d", "1m", "5m", "15m", "30m", "60m"],
    requiresApiKey: false,
    requiresTradingKey: false,
    cacheScope: "ohlcv",
    cacheDiagnostics: {
      freshness: "stale",
      contextCount: 1,
      rowCount: 100,
      latestTimestamp: "2026-05-20T00:00:00+00:00",
      freshnessSummary: { fresh: 0, stale: 1, empty: 0 }
    },
    externalTelemetry: {
      status: "blocked",
      dependency: "ccxt",
      dependencyAvailable: false,
      lastError: "optional package 'ccxt' is not installed",
      retryState: "dependency_missing",
      checkedAt: "2026-06-14T08:00:00+00:00",
      installGuidance: sampleCcxtInstallGuidance,
      lastProviderError: null,
      providerHealth: sampleBlockedProviderHealth
    },
    note: "Crypto public OHLCV adapter."
  }
] as const;

describe("terminal workspace API client", () => {
  test("builds the local core workspace URL without duplicate slashes", () => {
    expect(buildWorkspaceUrl("http://127.0.0.1:8765/")).toBe("http://127.0.0.1:8765/api/workspace");
  });

  test("saves the market watchlist through the local core", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          watchlist: [
            {
              market: "us",
              symbol: "MSFT",
              name: "Microsoft",
              changePct: 1.2,
              price: 420.5
            }
          ]
        })
      };
    };

    expect(buildWatchlistUrl("/")).toBe("/api/watchlist");

    const result = await saveWatchlist(
      "/",
      [{ market: "us", symbol: "MSFT", name: "Microsoft", changePct: 1.2, price: 420.5 }],
      fetcher
    );

    expect(calls).toEqual([
      {
        url: "/api/watchlist",
        method: "PUT",
        body: {
          watchlist: [
            { market: "us", symbol: "MSFT", name: "Microsoft", price: 420.5, changePct: 1.2 }
          ]
        }
      }
    ]);
    expect(result.source).toBe("core");
    expect(result.watchlist[0]?.symbol).toBe("MSFT");
  });

  test("saves the research workspace state through the local core", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          state: {
            market: "us",
            symbol: "MSFT",
            name: "Microsoft",
            timeframe: "5m",
            workspaceId: "research",
            updatedAt: "2026-06-09T00:00:00+00:00"
          }
        })
      };
    };

    expect(buildResearchWorkspaceStateUrl("/")).toBe("/api/research/workspace-state");

    const result = await saveResearchWorkspaceState(
      "/",
      { market: "us", symbol: "MSFT", name: "Microsoft", timeframe: "5m", workspaceId: "research" },
      fetcher
    );

    expect(calls).toEqual([
      {
        url: "/api/research/workspace-state",
        method: "PUT",
        body: {
          state: { market: "us", symbol: "MSFT", name: "Microsoft", timeframe: "5m", workspaceId: "research" }
        }
      }
    ]);
    expect(result.source).toBe("core");
    expect(result.state?.symbol).toBe("MSFT");
    expect(result.state?.timeframe).toBe("5m");
  });

  test("loads the selected market calendar status through the local core", async () => {
    const calls: string[] = [];
    const fetcher = async (url: string) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          calendar: {
            market: "ashare",
            timezone: "Asia/Shanghai",
            status: "open",
            isOpen: true,
            session: "morning",
            asOf: "2026-06-11T10:00:00+08:00",
            tradingDay: "2026-06-11",
            nextOpen: null,
            nextClose: "2026-06-11T11:30:00+08:00",
            detail: "A-share market is open in the morning session.",
            warnings: ["Static session template only; exchange holiday calendar is not configured."],
            source: "static-session-template"
          }
        })
      };
    };

    expect(buildMarketCalendarUrl("/", "ashare")).toBe("/api/market/calendar?market=ashare");

    const result = await loadMarketCalendarStatus("/", "ashare", fetcher);

    expect(calls).toEqual(["/api/market/calendar?market=ashare"]);
    expect(result.source).toBe("core");
    expect(result.calendar?.market).toBe("ashare");
    expect(result.calendar?.status).toBe("open");
    expect(result.calendar?.nextClose).toBe("2026-06-11T11:30:00+08:00");
  });

  test("falls back when the market calendar contract is invalid", async () => {
    const fetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ calendar: { market: "ashare", status: "open" } })
    });

    const result = await loadMarketCalendarStatus("/", "ashare", fetcher);

    expect(result.source).toBe("fallback");
    expect(result.calendar?.market).toBe("ashare");
    expect(result.calendar?.status).toBe("unknown");
    expect(result.error).toBe("Invalid market calendar contract");
  });

  test("builds same-origin API URLs for containerized web deployments", () => {
    expect(resolveQuantCoreBaseUrl({ VITE_QUANT_API_BASE: "/" })).toBe("/");
    expect(resolveQuantCoreBaseUrl({})).toBe("/");
    expect(buildWorkspaceUrl("/")).toBe("/api/workspace");
    expect(buildResearchRunDetailUrl("/", "run 你好/1")).toBe("/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1");
    expect(buildMarketSearchUrl("/", "ashare", "浦发", 8)).toBe(
      "/api/market/search?market=ashare&query=%E6%B5%A6%E5%8F%91&limit=8"
    );
    expect(buildExecutionAdapterHealthProbeUrl("/", { adapterId: "ccxt-live", exchange: "binance" })).toBe(
      "/api/execution/adapter-health/ccxt-sandbox?adapterId=ccxt-live&exchange=binance"
    );
  });

  test("builds the research run URL with selected instrument context", () => {
    expect(buildResearchRunUrl("http://127.0.0.1:8765/", "ashare", "600000", "1d")).toBe(
      "http://127.0.0.1:8765/api/research/run?market=ashare&symbol=600000&timeframe=1d&limit=500"
    );
  });

  test("builds the P0 pipeline URL as a single audited command endpoint", () => {
    expect(buildP0PipelineUrl("http://127.0.0.1:8765/")).toBe("http://127.0.0.1:8765/api/p0/pipeline");
    expect(buildP0PipelineUrl("/")).toBe("/api/p0/pipeline");
  });

  test("builds the P0 AI review URL as a single evidence review command endpoint", () => {
    expect(buildP0AiReviewUrl("http://127.0.0.1:8765/")).toBe("http://127.0.0.1:8765/api/p0/ai-reviews");
    expect(buildP0AiReviewUrl("/")).toBe("/api/p0/ai-reviews");
  });

  test("builds the P0 paper simulation URL as a single paper-only command endpoint", () => {
    expect(buildP0PaperSimulationUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/p0/paper-simulations"
    );
    expect(buildP0PaperSimulationUrl("/")).toBe("/api/p0/paper-simulations");
  });

  test("loads latest P0 acceptance manifest readback from the core service", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const manifest = {
      kind: "aiqt.p0AcceptanceManifest",
      schemaVersion: 1,
      generatedAt: "2026-06-23T08:00:00+00:00",
      status: "passed" as const,
      baseUrl: "http://aiqt.local",
      importBaseUrl: "http://clean.local",
      market: "ashare" as const,
      symbol: "600000",
      timeframe: "1d" as const,
      runId: "run-smoke",
      paperOnly: true,
      liveTradingAllowed: false,
      liveBlockedBoundary: true,
      checkCount: 6,
      checks: [
        { id: "pipeline", status: "passed", summary: "p0 pipeline run=run-smoke" },
        { id: "ai-review", status: "passed", summary: "p0 ai-review run=run-smoke mode=local_evidence_review" },
        { id: "paper-simulation", status: "passed", summary: "p0 paper-simulation run=run-smoke liveBlocked=True" },
        { id: "export", status: "passed", summary: "p0 export run=run-smoke completeness=9/9 liveBlocked=True" },
        { id: "import", status: "passed", summary: "p0 import run=run-smoke undo=import-undo-smoke" },
        { id: "imported-export", status: "passed", summary: "p0 imported-export run=run-smoke completeness=9/9" }
      ]
    };
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          acceptance: {
            kind: "aiqt.p0AcceptanceStatus",
            schemaVersion: 1,
            status: "passed",
            available: true,
            sourcePath: "data/p0-acceptance.json",
            summary: "p0 acceptance manifest run=run-smoke checks=6 liveBlocked=True",
            reason: "",
            generatedAt: "2026-06-23T08:00:00+00:00",
            runId: "run-smoke",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            checkCount: 6,
            requiredCheckCount: 4,
            checkIds: ["pipeline", "ai-review", "paper-simulation", "export", "import", "imported-export"],
            paperOnly: true,
            liveTradingAllowed: false,
            liveBlockedBoundary: true,
            manifest
          }
        })
      };
    };

    const result = await loadP0AcceptanceLatest("http://127.0.0.1:8765/", fetcher);
    const summary = buildP0AcceptanceSummary(result.acceptance);

    expect(buildP0AcceptanceLatestUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/p0/acceptance/latest"
    );
    expect(buildP0AcceptanceLatestUrl("/")).toBe("/api/p0/acceptance/latest");
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/p0/acceptance/latest");
    expect(result.source).toBe("core");
    expect(result.acceptance?.manifest?.runId).toBe("run-smoke");
    expect(result.acceptance?.liveTradingAllowed).toBe(false);
    expect(summary.state).toBe("passed");
    expect(summary.liveTradingAllowed).toBe(false);
  });

  test("falls back when latest P0 acceptance readback is missing or malformed", async () => {
    const fetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ acceptance: { status: "passed" } })
    });

    const result = await loadP0AcceptanceLatest("/", fetcher);

    expect(result.source).toBe("fallback");
    expect(result.acceptance?.status).toBe("missing");
    expect(result.acceptance?.available).toBe(false);
    expect(result.acceptance?.manifest).toBeNull();
    expect(result.error).toBe("Invalid P0 acceptance status contract");
  });

  test("loads the latest P1 acceptance readback and keeps live trading blocked", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const manifest = {
      kind: "aiqt.p1AcceptanceManifest",
      schemaVersion: 1,
      generatedAt: "2026-06-23T09:00:00+00:00",
      status: "passed",
      baseUrl: "http://aiqt.local",
      importBaseUrl: "http://clean.local",
      timeframe: "1d" as const,
      runId: "run-p1-smoke",
      watchlistRefreshRunId: "cache-refresh-p1",
      queuedMarket: "ashare" as const,
      queuedSymbol: "600000",
      watchlistCount: 3,
      watchlist: [
        { market: "ashare", symbol: "600000", name: "浦发银行" },
        { market: "ashare", symbol: "000300", name: "沪深300" },
        { market: "us", symbol: "AAPL", name: "Apple" }
      ],
      paperOnly: true,
      liveTradingAllowed: false,
      liveBlockedBoundary: true,
      checkCount: 8,
      checks: [
        { id: "workspace", status: "passed", summary: "p1 workspace selected=600000 watchlist=3" },
        {
          id: "watchlist-refresh",
          status: "passed",
          summary: "p1 watchlist-refresh run=cache-refresh-p1 symbols=3 refreshed=3 queued=600000"
        },
        {
          id: "queue-pipeline",
          status: "passed",
          summary: "p1 queue-pipeline run=run-p1-smoke symbol=600000 refresh=cache-refresh-p1"
        },
        { id: "ai-review", status: "passed", summary: "p1 ai-review run=run-p1-smoke mode=local_evidence_review" },
        { id: "paper-simulation", status: "passed", summary: "p1 paper-simulation run=run-p1-smoke liveBlocked=True" },
        { id: "export", status: "passed", summary: "p1 export run=run-p1-smoke refresh=cache-refresh-p1 liveBlocked=True" },
        { id: "import", status: "passed", summary: "p1 import run=run-p1-smoke undo=import-undo-p1" },
        {
          id: "imported-export",
          status: "passed",
          summary: "p1 imported-export run=run-p1-smoke refresh=cache-refresh-p1 liveBlocked=True"
        }
      ]
    };
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          acceptance: {
            kind: "aiqt.p1AcceptanceStatus",
            schemaVersion: 1,
            status: "passed",
            available: true,
            sourcePath: "data/p1-acceptance.json",
            summary: "p1 acceptance manifest run=run-p1-smoke watchlist=3 checks=8 liveBlocked=True",
            reason: "",
            generatedAt: "2026-06-23T09:00:00+00:00",
            runId: "run-p1-smoke",
            timeframe: "1d",
            watchlistRefreshRunId: "cache-refresh-p1",
            queuedMarket: "ashare",
            queuedSymbol: "600000",
            watchlistCount: 3,
            checkCount: 8,
            requiredCheckCount: 8,
            checkIds: [
              "workspace",
              "watchlist-refresh",
              "queue-pipeline",
              "ai-review",
              "paper-simulation",
              "export",
              "import",
              "imported-export"
            ],
            paperOnly: true,
            liveTradingAllowed: false,
            liveBlockedBoundary: true,
            manifest
          }
        })
      };
    };

    const result = await loadP1AcceptanceLatest("http://127.0.0.1:8765/", fetcher);
    const summary = buildP1AcceptanceSummary(result.acceptance);

    expect(buildP1AcceptanceLatestUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/p1/acceptance/latest"
    );
    expect(buildP1AcceptanceLatestUrl("/")).toBe("/api/p1/acceptance/latest");
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/p1/acceptance/latest");
    expect(result.source).toBe("core");
    expect(result.acceptance?.manifest?.runId).toBe("run-p1-smoke");
    expect(result.acceptance?.watchlistRefreshRunId).toBe("cache-refresh-p1");
    expect(result.acceptance?.liveTradingAllowed).toBe(false);
    expect(summary.state).toBe("passed");
    expect(summary.watchlistCount).toBe(3);
    expect(summary.liveTradingAllowed).toBe(false);
  });

  test("falls back when latest P1 acceptance readback is missing or malformed", async () => {
    const fetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ acceptance: { status: "passed" } })
    });

    const result = await loadP1AcceptanceLatest("/", fetcher);

    expect(result.source).toBe("fallback");
    expect(result.acceptance?.status).toBe("missing");
    expect(result.acceptance?.available).toBe(false);
    expect(result.acceptance?.manifest).toBeNull();
    expect(result.error).toBe("Invalid P1 acceptance status contract");
  });

  test("loads the latest desktop release readback without enabling live trading", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const manifest = {
      kind: "aiqt.desktopReleaseManifest",
      schemaVersion: 1,
      generatedAt: "2026-06-30T06:45:00+00:00",
      status: "passed",
      platform: "darwin-arm64",
      version: "0.1.0",
      tauriConfigPath: "apps/web/src-tauri/tauri.conf.json",
      desktopArtifactPath: "apps/web/src-tauri/target/release/bundle",
      paperOnly: true,
      liveTradingAllowed: false,
      liveBlockedBoundary: true,
      checkCount: 5,
      checks: [
        { id: "web-build", status: "passed", summary: "npm run build passed" },
        { id: "cargo-check", status: "passed", summary: "cargo check passed" },
        { id: "tauri-icon", status: "passed", summary: "icons/icon.png present" },
        { id: "desktop-bundle", status: "passed", summary: "npm run desktop:build passed" },
        { id: "live-blocked-boundary", status: "passed", summary: "live trading remains blocked" }
      ]
    };
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          release: {
            kind: "aiqt.desktopReleaseStatus",
            schemaVersion: 1,
            status: "passed",
            available: true,
            sourcePath: "data/desktop-release.json",
            summary: "desktop release manifest platform=darwin-arm64 checks=5 liveBlocked=True",
            reason: "",
            generatedAt: "2026-06-30T06:45:00+00:00",
            platform: "darwin-arm64",
            version: "0.1.0",
            tauriConfigPath: "apps/web/src-tauri/tauri.conf.json",
            desktopArtifactPath: "apps/web/src-tauri/target/release/bundle",
            checkCount: 5,
            requiredCheckCount: 5,
            checkIds: ["web-build", "cargo-check", "tauri-icon", "desktop-bundle", "live-blocked-boundary"],
            paperOnly: true,
            liveTradingAllowed: false,
            liveBlockedBoundary: true,
            manifest
          }
        })
      };
    };

    const result = await loadDesktopReleaseLatest("http://127.0.0.1:8765/", fetcher);

    expect(buildDesktopReleaseLatestUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/desktop/release/latest"
    );
    expect(buildDesktopReleaseLatestUrl("/")).toBe("/api/desktop/release/latest");
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/desktop/release/latest");
    expect(result.source).toBe("core");
    expect(result.release?.status).toBe("passed");
    expect(result.release?.platform).toBe("darwin-arm64");
    expect(result.release?.requiredCheckCount).toBe(5);
    expect(result.release?.checkIds).toEqual([
      "web-build",
      "cargo-check",
      "tauri-icon",
      "desktop-bundle",
      "live-blocked-boundary"
    ]);
    expect(result.release?.liveTradingAllowed).toBe(false);
    expect(result.release?.manifest?.platform).toBe("darwin-arm64");
  });

  test("falls back when latest desktop release readback is missing or malformed", async () => {
    const fetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ release: { status: "passed" } })
    });

    const result = await loadDesktopReleaseLatest("/", fetcher);

    expect(result.source).toBe("fallback");
    expect(result.release?.status).toBe("missing");
    expect(result.release?.available).toBe(false);
    expect(result.release?.sourcePath).toBe("data/desktop-release.json");
    expect(result.release?.manifest).toBeNull();
    expect(result.error).toBe("Invalid desktop release status contract");
  });

  test("loads the latest Stage 1 daily-use readback without enabling live trading", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          dailyUse: {
            kind: "aiqt.stage1DailyUseReport",
            schemaVersion: 1,
            generatedAt: "2026-06-30T10:00:00+00:00",
            status: "ready",
            summary: "Stage 1 daily use is ready (5/5 checks ready).",
            readyCount: 5,
            totalCount: 5,
            paperOnly: true,
            liveTradingAllowed: false,
            liveBlockedBoundary: true,
            sourcePaths: {
              p0Acceptance: "data/p0-acceptance.json",
              p1Acceptance: "data/p1-acceptance.json",
              desktopRelease: "data/desktop-release.json"
            },
            rows: [
              {
                id: "clean-open",
                label: "Clean environment startup",
                status: "ready",
                value: "P0/P1 acceptance evidence is ready",
                summary: "Clean environment startup has current P0 and P1 acceptance evidence.",
                action: "npm run stage1:daily:validate",
                paperOnly: true,
                liveTradingAllowed: false,
                liveBlockedBoundary: true
              },
              {
                id: "market-refresh-recovery",
                label: "Market refresh recovery",
                status: "ready",
                value: "Watchlist refresh recovery evidence is ready",
                summary: "P1 acceptance includes watchlist refresh cache-refresh-p1 for 3 symbols.",
                action: "npm run stage1:daily:validate",
                paperOnly: true,
                liveTradingAllowed: false,
                liveBlockedBoundary: true
              },
              {
                id: "research-entry",
                label: "Research entry",
                status: "ready",
                value: "Research queue entry evidence is ready",
                summary: "P1 acceptance includes queued research pipeline run-p1-smoke for 600000 from cache-refresh-p1.",
                action: "npm run stage1:daily:validate",
                paperOnly: true,
                liveTradingAllowed: false,
                liveBlockedBoundary: true
              },
              {
                id: "daily-start",
                label: "Daily start path",
                status: "ready",
                value: "Daily start path is ready",
                summary: "Daily start has clean-open, refresh recovery, and research entry evidence.",
                action: "npm run stage1:daily:validate",
                paperOnly: true,
                liveTradingAllowed: false,
                liveBlockedBoundary: true
              },
              {
                id: "desktop-release",
                label: "Desktop release",
                status: "ready",
                value: "Desktop release manifest is ready",
                summary: "desktop release manifest platform=darwin-arm64 checks=5 liveBlocked=True",
                action: "npm run stage1:daily:validate",
                paperOnly: true,
                liveTradingAllowed: false,
                liveBlockedBoundary: true
              }
            ]
          }
        })
      };
    };

    const result = await loadStage1DailyUseLatest("http://127.0.0.1:8765/", fetcher);

    expect(buildStage1DailyUseLatestUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/stage1/daily-use/latest"
    );
    expect(buildStage1DailyUseLatestUrl("/")).toBe("/api/stage1/daily-use/latest");
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/stage1/daily-use/latest");
    expect(result.source).toBe("core");
    expect(result.dailyUse?.status).toBe("ready");
    expect(result.dailyUse?.readyCount).toBe(5);
    expect(result.dailyUse?.rows.map((row) => row.id)).toEqual([
      "clean-open",
      "market-refresh-recovery",
      "research-entry",
      "daily-start",
      "desktop-release"
    ]);
    expect(result.dailyUse?.liveTradingAllowed).toBe(false);
    expect(result.dailyUse?.liveBlockedBoundary).toBe(true);
  });

  test("falls back when latest Stage 1 daily-use readback is missing or malformed", async () => {
    const fetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ dailyUse: { status: "ready" } })
    });

    const result = await loadStage1DailyUseLatest("/", fetcher);

    expect(result.source).toBe("fallback");
    expect(result.dailyUse?.status).toBe("missing");
    expect(result.dailyUse?.readyCount).toBe(0);
    expect(result.dailyUse?.totalCount).toBe(5);
    expect(result.dailyUse?.rows.map((row) => row.id)).toEqual([
      "clean-open",
      "market-refresh-recovery",
      "research-entry",
      "daily-start",
      "desktop-release"
    ]);
    expect(result.dailyUse?.sourcePaths.p0Acceptance).toBe("data/p0-acceptance.json");
    expect(result.dailyUse?.liveTradingAllowed).toBe(false);
    expect(result.error).toBe("Invalid Stage 1 daily-use report contract");
  });

  test("accepts stale Stage 1 daily-use readback as review without enabling live trading", async () => {
    const fetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        dailyUse: {
          kind: "aiqt.stage1DailyUseReport",
          schemaVersion: 1,
          generatedAt: "2026-06-30T10:00:00+00:00",
          status: "review",
          summary:
            "Stage 1 daily-use report needs refresh because source manifests changed: data/p1-acceptance.json.",
          reason:
            "Stage 1 daily-use report needs refresh because source manifests changed: data/p1-acceptance.json.",
          readyCount: 1,
          totalCount: 5,
          paperOnly: true,
          liveTradingAllowed: false,
          liveBlockedBoundary: true,
          staleSourcePaths: ["data/p1-acceptance.json"],
          sourcePaths: {
            p0Acceptance: "data/p0-acceptance.json",
            p1Acceptance: "data/p1-acceptance.json",
            desktopRelease: "data/desktop-release.json"
          },
          rows: [
            {
              id: "clean-open",
              label: "Clean environment startup",
              status: "review",
              value: "Daily-use evidence should be refreshed",
              summary:
                "Clean environment startup has current P0 and P1 acceptance evidence. Source manifest changed after this daily-use report was generated.",
              action: "npm run stage1:daily",
              paperOnly: true,
              liveTradingAllowed: false,
              liveBlockedBoundary: true
            },
            {
              id: "market-refresh-recovery",
              label: "Market refresh recovery",
              status: "review",
              value: "Daily-use evidence should be refreshed",
              summary:
                "P1 acceptance includes watchlist refresh cache-refresh-p1 for 3 symbols. Source manifest changed after this daily-use report was generated.",
              action: "npm run stage1:daily",
              paperOnly: true,
              liveTradingAllowed: false,
              liveBlockedBoundary: true
            },
            {
              id: "research-entry",
              label: "Research entry",
              status: "review",
              value: "Daily-use evidence should be refreshed",
              summary:
                "P1 acceptance includes queued research pipeline run-p1-smoke for 600000 from cache-refresh-p1. Source manifest changed after this daily-use report was generated.",
              action: "npm run stage1:daily",
              paperOnly: true,
              liveTradingAllowed: false,
              liveBlockedBoundary: true
            },
            {
              id: "daily-start",
              label: "Daily start path",
              status: "review",
              value: "Daily-use evidence should be refreshed",
              summary:
                "Daily start has clean-open, refresh recovery, and research entry evidence. Source manifest changed after this daily-use report was generated.",
              action: "npm run stage1:daily",
              paperOnly: true,
              liveTradingAllowed: false,
              liveBlockedBoundary: true
            },
            {
              id: "desktop-release",
              label: "Desktop release",
              status: "ready",
              value: "Desktop release manifest is ready",
              summary: "desktop release manifest platform=darwin-arm64 checks=5 liveBlocked=True",
              action: "npm run stage1:daily:validate",
              paperOnly: true,
              liveTradingAllowed: false,
              liveBlockedBoundary: true
            }
          ]
        }
      })
    });

    const result = await loadStage1DailyUseLatest("/", fetcher);

    expect(result.source).toBe("core");
    expect(result.error).toBeUndefined();
    expect(result.dailyUse?.status).toBe("review");
    expect(result.dailyUse?.readyCount).toBe(1);
    expect(result.dailyUse?.staleSourcePaths).toEqual(["data/p1-acceptance.json"]);
    expect(result.dailyUse?.rows[1]?.status).toBe("review");
    expect(result.dailyUse?.rows[4]?.status).toBe("ready");
    expect(result.dailyUse?.liveTradingAllowed).toBe(false);
    expect(result.dailyUse?.liveBlockedBoundary).toBe(true);
  });

  test("generates the Stage 1 daily-use report without enabling live trading", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          status: "daily_use_generated",
          dailyUse: {
            kind: "aiqt.stage1DailyUseReport",
            schemaVersion: 1,
            generatedAt: "2026-06-30T10:10:00+00:00",
            status: "ready",
            summary: "Stage 1 daily use is ready (5/5 checks ready).",
            readyCount: 5,
            totalCount: 5,
            paperOnly: true,
            liveTradingAllowed: false,
            liveBlockedBoundary: true,
            sourcePath: "data/stage1-daily-use.json",
            sourcePaths: {
              p0Acceptance: "data/p0-acceptance.json",
              p1Acceptance: "data/p1-acceptance.json",
              desktopRelease: "data/desktop-release.json"
            },
            rows: [
              {
                id: "clean-open",
                label: "Clean environment startup",
                status: "ready",
                value: "P0/P1 acceptance evidence is ready",
                summary: "Clean environment startup has current P0 and P1 acceptance evidence.",
                action: "npm run stage1:daily:validate",
                paperOnly: true,
                liveTradingAllowed: false,
                liveBlockedBoundary: true
              },
              {
                id: "market-refresh-recovery",
                label: "Market refresh recovery",
                status: "ready",
                value: "Watchlist refresh recovery evidence is ready",
                summary: "P1 acceptance includes watchlist refresh cache-refresh-p1 for 3 symbols.",
                action: "npm run stage1:daily:validate",
                paperOnly: true,
                liveTradingAllowed: false,
                liveBlockedBoundary: true
              },
              {
                id: "research-entry",
                label: "Research entry",
                status: "ready",
                value: "Research queue entry evidence is ready",
                summary: "P1 acceptance includes queued research pipeline run-p1-smoke for 600000 from cache-refresh-p1.",
                action: "npm run stage1:daily:validate",
                paperOnly: true,
                liveTradingAllowed: false,
                liveBlockedBoundary: true
              },
              {
                id: "daily-start",
                label: "Daily start path",
                status: "ready",
                value: "Daily start path is ready",
                summary: "Daily start has clean-open, refresh recovery, and research entry evidence.",
                action: "npm run stage1:daily:validate",
                paperOnly: true,
                liveTradingAllowed: false,
                liveBlockedBoundary: true
              },
              {
                id: "desktop-release",
                label: "Desktop release",
                status: "ready",
                value: "Desktop release manifest is ready",
                summary: "desktop release manifest platform=darwin-arm64 checks=5 liveBlocked=True",
                action: "npm run stage1:daily:validate",
                paperOnly: true,
                liveTradingAllowed: false,
                liveBlockedBoundary: true
              }
            ]
          },
          paperOnly: true,
          orderSubmissionEnabled: false,
          liveTradingAllowed: false,
          liveOrderSubmitted: false,
          routeExecuted: false
        })
      };
    };

    const result = await generateStage1DailyUse("http://127.0.0.1:8765/", fetcher);

    expect(buildStage1DailyUseUrl("http://127.0.0.1:8765/")).toBe("http://127.0.0.1:8765/api/stage1/daily-use");
    expect(buildStage1DailyUseUrl("/")).toBe("/api/stage1/daily-use");
    expect(calls[0]).toEqual(
      expect.objectContaining({
        url: "http://127.0.0.1:8765/api/stage1/daily-use",
        init: expect.objectContaining({ method: "POST" })
      })
    );
    expect(result.source).toBe("core");
    expect(result.status).toBe("daily_use_generated");
    expect(result.dailyUse?.status).toBe("ready");
    expect(result.dailyUse?.readyCount).toBe(5);
    expect(result.dailyUse?.rows.map((row) => row.id)).toEqual([
      "clean-open",
      "market-refresh-recovery",
      "research-entry",
      "daily-start",
      "desktop-release"
    ]);
    expect(result.orderSubmissionEnabled).toBe(false);
    expect(result.liveTradingAllowed).toBe(false);
    expect(result.liveOrderSubmitted).toBe(false);
    expect(result.routeExecuted).toBe(false);
  });

  test("loads the latest Stage 1 bootstrap preflight readback without enabling live trading", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          preflight: sampleStage1BootstrapPreflight("ready")
        })
      };
    };

    const result = await loadStage1BootstrapPreflightLatest("http://127.0.0.1:8765/", fetcher);

    expect(buildStage1BootstrapPreflightLatestUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/stage1/bootstrap-preflight/latest"
    );
    expect(buildStage1BootstrapPreflightLatestUrl("/")).toBe("/api/stage1/bootstrap-preflight/latest");
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/stage1/bootstrap-preflight/latest");
    expect(result.source).toBe("core");
    expect(result.preflight?.status).toBe("ready");
    expect(result.preflight?.readyCount).toBe(7);
    expect(result.preflight?.checks.map((check) => check.id)).toEqual([
      "package-scripts",
      "p0-acceptance",
      "p1-acceptance",
      "p2-manifest-chain",
      "desktop-release",
      "stage1-daily-use",
      "live-blocked-boundary"
    ]);
    expect(result.preflight?.sourcePaths.p2ManifestChainPreflight).toBe("data/p2-chain-preflight.json");
    expect(result.preflight?.sourcePaths.stage1DailyUse).toBe("data/stage1-daily-use.json");
    expect(result.preflight?.liveTradingAllowed).toBe(false);
    expect(result.preflight?.liveBlockedBoundary).toBe(true);
  });

  test("rejects Stage 1 bootstrap preflight readback without the P2 chain source path", async () => {
    const incompletePreflight = {
      ...sampleStage1BootstrapPreflight("ready"),
      sourcePaths: {
        p0Acceptance: "data/p0-acceptance.json",
        p1Acceptance: "data/p1-acceptance.json",
        desktopRelease: "data/desktop-release.json",
        stage1DailyUse: "data/stage1-daily-use.json"
      }
    };
    const fetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ preflight: incompletePreflight })
    });

    const result = await loadStage1BootstrapPreflightLatest("/", fetcher);

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid Stage 1 bootstrap preflight contract");
    expect(result.preflight?.checks.map((check) => check.id)).toContain("p2-manifest-chain");
    expect(result.preflight?.sourcePaths.p2ManifestChainPreflight).toBe("data/p2-chain-preflight.json");
  });

  test("falls back when latest Stage 1 bootstrap preflight readback is missing or malformed", async () => {
    const fetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ preflight: { status: "ready" } })
    });

    const result = await loadStage1BootstrapPreflightLatest("/", fetcher);

    expect(result.source).toBe("fallback");
    expect(result.preflight?.status).toBe("missing");
    expect(result.preflight?.readyCount).toBe(0);
    expect(result.preflight?.totalCount).toBe(7);
    expect(result.preflight?.checks.map((check) => check.id)).toEqual([
      "package-scripts",
      "p0-acceptance",
      "p1-acceptance",
      "p2-manifest-chain",
      "desktop-release",
      "stage1-daily-use",
      "live-blocked-boundary"
    ]);
    expect(result.preflight?.sourcePath).toBe("data/stage1-bootstrap-preflight.json");
    expect(result.preflight?.sourcePaths.p2ManifestChainPreflight).toBe("data/p2-chain-preflight.json");
    expect(result.preflight?.sourcePaths.stage1DailyUse).toBe("data/stage1-daily-use.json");
    expect(result.preflight?.checks.find((check) => check.id === "package-scripts")?.recommendedCommand).toBe(
      "node tools/run_python.mjs tools/stage1_prepare.py --mode full --dry-run"
    );
    expect(result.preflight?.liveTradingAllowed).toBe(false);
    expect(result.error).toBe("Invalid Stage 1 bootstrap preflight contract");
  });

  test("accepts stale Stage 1 bootstrap preflight readback as review without enabling live trading", async () => {
    const fetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        preflight: {
          ...sampleStage1BootstrapPreflight("review"),
          summary:
            "Stage 1 bootstrap preflight needs refresh because source files changed: data/stage1-daily-use.json.",
          reason:
            "Stage 1 bootstrap preflight needs refresh because source files changed: data/stage1-daily-use.json.",
          readyCount: 6,
          reviewCount: 1,
          blockedCount: 0,
          nextAction: "refresh-stage1-bootstrap-preflight",
          recommendedCommand: "npm run stage1:prepare:quick",
          staleSourcePaths: ["data/stage1-daily-use.json"],
          reviewIds: ["stage1-daily-use"],
          checks: sampleStage1BootstrapPreflight("review").checks.map((check) =>
            check.id === "stage1-daily-use"
              ? {
                  ...check,
                  status: "review",
                  summary:
                    "Stage 1 daily use is ready. Source file changed after this bootstrap preflight was generated.",
                  recommendedCommand: "npm run stage1:prepare:quick"
                }
                : check.id === "p0-acceptance" ||
                    check.id === "p1-acceptance" ||
                    check.id === "p2-manifest-chain" ||
                    check.id === "desktop-release"
                ? { ...check, status: "ready" }
                : check
          )
        }
      })
    });

    const result = await loadStage1BootstrapPreflightLatest("/", fetcher);

    expect(result.source).toBe("core");
    expect(result.error).toBeUndefined();
    expect(result.preflight?.status).toBe("review");
    expect(result.preflight?.readyCount).toBe(6);
    expect(result.preflight?.staleSourcePaths).toEqual(["data/stage1-daily-use.json"]);
    expect(result.preflight?.nextAction).toBe("refresh-stage1-bootstrap-preflight");
    expect(result.preflight?.recommendedCommand).toBe("npm run stage1:prepare:quick");
    expect(result.preflight?.checks.find((check) => check.id === "stage1-daily-use")?.status).toBe("review");
    expect(result.preflight?.liveTradingAllowed).toBe(false);
    expect(result.preflight?.liveBlockedBoundary).toBe(true);
  });

  test("generates the Stage 1 bootstrap preflight without enabling live trading", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          status: "preflight_generated",
          preflight: sampleStage1BootstrapPreflight("ready"),
          paperOnly: true,
          orderSubmissionEnabled: false,
          liveTradingAllowed: false,
          liveOrderSubmitted: false,
          routeExecuted: false
        })
      };
    };

    const result = await generateStage1BootstrapPreflight("http://127.0.0.1:8765/", fetcher);

    expect(buildStage1BootstrapPreflightUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/stage1/bootstrap-preflight"
    );
    expect(buildStage1BootstrapPreflightUrl("/")).toBe("/api/stage1/bootstrap-preflight");
    expect(calls[0]).toEqual(
      expect.objectContaining({
        url: "http://127.0.0.1:8765/api/stage1/bootstrap-preflight",
        init: expect.objectContaining({ method: "POST" })
      })
    );
    expect(result.source).toBe("core");
    expect(result.status).toBe("preflight_generated");
    expect(result.preflight?.status).toBe("ready");
    expect(result.preflight?.readyCount).toBe(7);
    expect(result.orderSubmissionEnabled).toBe(false);
    expect(result.liveTradingAllowed).toBe(false);
    expect(result.liveOrderSubmitted).toBe(false);
    expect(result.routeExecuted).toBe(false);
  });

  test("loads the latest P2 pre-live acceptance readback and keeps order submission blocked", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const manifest = {
      kind: "aiqt.p2PreLiveAcceptanceManifest",
      schemaVersion: 1,
      generatedAt: "2026-06-24T09:30:00+00:00",
      status: "passed",
      baseUrl: "http://aiqt.local",
      market: "ashare" as const,
      symbol: "600000",
      timeframe: "1d" as const,
      runId: "run-p2-pre-live",
      adapterId: "ashare-live",
      promotionStatus: "certification_pending",
      checklistStatus: "evidence_pending",
      passedGateCount: 4,
      totalGateCount: 6,
      blockingGateCount: 2,
      gateIds: [
        "audited-run",
        "risk-approval",
        "paper-execution",
        "paper-execution-replay",
        "adapter-certification",
        "human-confirmation"
      ],
      blockerIds: ["adapter-certification", "human-confirmation"],
      auditEventIds: [
        "research-run-audit-run-p2-pre-live",
        "paper-execution-run-p2-pre-live",
        "paper-execution-replay-run-p2-pre-live",
        "execution-adapter-certification-ashare-live"
      ],
      manualRouteCandidate: false,
      paperOnly: true,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      checkCount: 6,
      checks: [
        { id: "pre-live-checklist", status: "passed", summary: "p2 pre-live checklist evidence_pending" },
        { id: "promotion-gates", status: "passed", summary: "p2 promotion gates" },
        { id: "paper-execution-replay", status: "passed", summary: "p2 paper execution replay ready" },
        { id: "adapter-evidence", status: "passed", summary: "p2 adapter evidence ashare-live" },
        { id: "manual-route-boundary", status: "passed", summary: "p2 manual route boundary" },
        { id: "live-blocked-boundary", status: "passed", summary: "p2 live blocked boundary" }
      ]
    };
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          acceptance: {
            kind: "aiqt.p2PreLiveAcceptanceStatus",
            schemaVersion: 1,
            status: "passed",
            available: true,
            sourcePath: "data/p2-pre-live-acceptance.json",
            summary:
              "p2 pre-live acceptance manifest run=run-p2-pre-live checklist=evidence_pending gates=4/6 blockers=2 liveBlocked=True",
            reason: "",
            generatedAt: "2026-06-24T09:30:00+00:00",
            runId: "run-p2-pre-live",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            adapterId: "ashare-live",
            promotionStatus: "certification_pending",
            checklistStatus: "evidence_pending",
            passedGateCount: 4,
            totalGateCount: 6,
            blockingGateCount: 2,
            gateIds: [
              "audited-run",
              "risk-approval",
              "paper-execution",
              "paper-execution-replay",
              "adapter-certification",
              "human-confirmation"
            ],
            blockerIds: ["adapter-certification", "human-confirmation"],
            auditEventIds: [
              "research-run-audit-run-p2-pre-live",
              "paper-execution-run-p2-pre-live",
              "paper-execution-replay-run-p2-pre-live",
              "execution-adapter-certification-ashare-live"
            ],
            checkCount: 6,
            requiredCheckCount: 6,
            checkIds: [
              "pre-live-checklist",
              "promotion-gates",
              "paper-execution-replay",
              "adapter-evidence",
              "manual-route-boundary",
              "live-blocked-boundary"
            ],
            manualRouteCandidate: false,
            paperOnly: true,
            orderSubmissionEnabled: false,
            liveTradingAllowed: false,
            liveOrderSubmitted: false,
            routeExecuted: false,
            liveBlockedBoundary: true,
            manifest
          }
        })
      };
    };

    const result = await loadP2PreLiveAcceptanceLatest("http://127.0.0.1:8765/", fetcher);
    const summary = buildP2PreLiveAcceptanceSummary(result.acceptance);

    expect(buildP2PreLiveAcceptanceLatestUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/p2/pre-live/acceptance/latest"
    );
    expect(buildP2PreLiveAcceptanceLatestUrl("/")).toBe("/api/p2/pre-live/acceptance/latest");
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/p2/pre-live/acceptance/latest");
    expect(result.source).toBe("core");
    expect(result.acceptance?.manifest?.runId).toBe("run-p2-pre-live");
    expect(result.acceptance?.adapterId).toBe("ashare-live");
    expect(result.acceptance?.orderSubmissionEnabled).toBe(false);
    expect(result.acceptance?.liveTradingAllowed).toBe(false);
    expect(result.acceptance?.liveOrderSubmitted).toBe(false);
    expect(result.acceptance?.routeExecuted).toBe(false);
    expect(summary.state).toBe("passed");
    expect(summary.blockingGateCount).toBe(2);
    expect(summary.orderSubmissionEnabled).toBe(false);
    expect(summary.liveTradingAllowed).toBe(false);
  });

  test("falls back when latest P2 pre-live acceptance readback is missing or malformed", async () => {
    const fetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ acceptance: { status: "passed" } })
    });

    const result = await loadP2PreLiveAcceptanceLatest("/", fetcher);

    expect(result.source).toBe("fallback");
    expect(result.acceptance?.status).toBe("missing");
    expect(result.acceptance?.available).toBe(false);
    expect(result.acceptance?.manifest).toBeNull();
    expect(result.error).toBe("Invalid P2 pre-live acceptance status contract");
  });

  test("loads the latest P2 paper replay manifest readback and keeps live routes blocked", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const manifest = {
      kind: "aiqt.p2PaperReplayManifest",
      schemaVersion: 1,
      generatedAt: "2026-06-24T10:15:00+00:00",
      status: "passed",
      baseUrl: "http://aiqt.local",
      market: "ashare" as const,
      symbol: "600000",
      timeframe: "1d" as const,
      runId: "run-p2-paper-replay",
      adapterId: "ashare-live",
      replayStatus: "replay_ready",
      passedCheckCount: 8,
      totalCheckCount: 8,
      warningCount: 0,
      checkIds: [
        "single-paper-execution",
        "portfolio-order-ledger",
        "portfolio-approval-ledger",
        "portfolio-simulation-ledger",
        "portfolio-state-history",
        "portfolio-replay",
        "adapter-paper-execution",
        "live-blocked-boundary"
      ],
      auditEventIds: ["paper-execution-run-p2-paper-replay", "adapter-paper-execution-run-p2-paper-replay"],
      latestEvidenceId: "adapter-paper-execution-ready",
      metrics: {
        filledPaperOrders: 1,
        portfolioOrders: 1,
        approvedPortfolioOrders: 1,
        portfolioFilledOrders: 1,
        stateHistoryFilledEvents: 1,
        adapterPaperExecutions: 1,
        replayWarnings: 0
      },
      paperOnly: true,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      checkCount: 8,
      checks: [
        {
          id: "single-paper-execution",
          status: "passed",
          summary: "single paper execution",
          evidenceId: "paper-execution-ready"
        },
        {
          id: "portfolio-order-ledger",
          status: "passed",
          summary: "portfolio order ledger",
          evidenceId: "portfolio-paper-ready"
        },
        {
          id: "portfolio-approval-ledger",
          status: "passed",
          summary: "portfolio approval ledger",
          evidenceId: "approval-ready"
        },
        {
          id: "portfolio-simulation-ledger",
          status: "passed",
          summary: "portfolio simulation ledger",
          evidenceId: "simulation-ready"
        },
        {
          id: "portfolio-state-history",
          status: "passed",
          summary: "portfolio state history",
          evidenceId: "state-filled-ready"
        },
        {
          id: "portfolio-replay",
          status: "passed",
          summary: "portfolio replay",
          evidenceId: "run-p2-paper-replay"
        },
        {
          id: "adapter-paper-execution",
          status: "passed",
          summary: "adapter paper execution",
          evidenceId: "adapter-paper-execution-ready"
        },
        {
          id: "live-blocked-boundary",
          status: "passed",
          summary: "live blocked boundary",
          evidenceId: "live-blocked-boundary"
        }
      ]
    };
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          replay: {
            kind: "aiqt.p2PaperReplayStatus",
            schemaVersion: 1,
            status: "passed",
            available: true,
            sourcePath: "data/p2-paper-replay.json",
            summary:
              "p2 paper replay manifest run=run-p2-paper-replay replay=replay_ready checks=8/8 warnings=0 liveBlocked=True",
            reason: "",
            generatedAt: "2026-06-24T10:15:00+00:00",
            runId: "run-p2-paper-replay",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            adapterId: "ashare-live",
            replayStatus: "replay_ready",
            passedCheckCount: 8,
            totalCheckCount: 8,
            warningCount: 0,
            requiredCheckCount: 8,
            checkCount: 8,
            checkIds: manifest.checkIds,
            auditEventIds: manifest.auditEventIds,
            latestEvidenceId: "adapter-paper-execution-ready",
            metrics: manifest.metrics,
            paperOnly: true,
            orderSubmissionEnabled: false,
            liveTradingAllowed: false,
            liveOrderSubmitted: false,
            routeExecuted: false,
            liveBlockedBoundary: true,
            manifest
          }
        })
      };
    };

    const result = await loadP2PaperReplayLatest("http://127.0.0.1:8765/", fetcher);
    const summary = buildP2PaperReplaySummary(result.replay);

    expect(buildP2PaperReplayLatestUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/p2/paper-replay/latest"
    );
    expect(buildP2PaperReplayLatestUrl("/")).toBe("/api/p2/paper-replay/latest");
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/p2/paper-replay/latest");
    expect(result.source).toBe("core");
    expect(result.replay?.manifest?.runId).toBe("run-p2-paper-replay");
    expect(result.replay?.latestEvidenceId).toBe("adapter-paper-execution-ready");
    expect(result.replay?.metrics.adapterPaperExecutions).toBe(1);
    expect(result.replay?.orderSubmissionEnabled).toBe(false);
    expect(result.replay?.liveTradingAllowed).toBe(false);
    expect(result.replay?.liveOrderSubmitted).toBe(false);
    expect(result.replay?.routeExecuted).toBe(false);
    expect(summary.state).toBe("passed");
    expect(summary.passedCheckCount).toBe(8);
    expect(summary.totalCheckCount).toBe(8);
    expect(summary.orderSubmissionEnabled).toBe(false);
    expect(summary.liveTradingAllowed).toBe(false);
  });

  test("falls back when latest P2 paper replay manifest readback is missing or malformed", async () => {
    const fetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ replay: { status: "passed" } })
    });

    const result = await loadP2PaperReplayLatest("/", fetcher);

    expect(result.source).toBe("fallback");
    expect(result.replay?.status).toBe("missing");
    expect(result.replay?.available).toBe(false);
    expect(result.replay?.manifest).toBeNull();
    expect(result.error).toBe("Invalid P2 paper replay status contract");
  });

  test("loads the latest P2 readiness acceptance manifest readback without opening live routes", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const manifest = {
      kind: "aiqt.p2ReadinessAcceptanceManifest",
      schemaVersion: 1,
      generatedAt: "2026-06-24T11:00:00+00:00",
      status: "accepted",
      baseUrl: "http://aiqt.local",
      market: "ashare" as const,
      symbol: "600000",
      timeframe: "1d" as const,
      runId: "run-p2-readiness",
      adapterId: "ashare-live",
      p1AcceptanceRunId: "run-p1-smoke",
      p2PreLiveAcceptanceRunId: "run-p2-pre-live",
      p2PaperReplayRunId: "run-p2-paper-replay",
      operatorRunbookAuditEventId: "operator-runbook-report-ashare-live-600000-1d-7777777777777777",
      readinessCoverageStatus: "covered",
      acceptedCriterionCount: 6,
      totalCriterionCount: 6,
      blockingCriterionCount: 0,
      criterionIds: [
        "p1-acceptance",
        "paper-execution-replay",
        "pre-live-checklist",
        "p2-pre-live-manifest",
        "readiness-evidence-coverage",
        "live-blocked-boundary"
      ],
      auditEventIds: [
        "p1-acceptance-run-p1-smoke",
        "paper-execution-run-p2-paper-replay",
        "p2-pre-live-acceptance-run-p2-pre-live",
        "operator-runbook-report-ashare-live-600000-1d-7777777777777777"
      ],
      manifestPaths: {
        p1Acceptance: "data/p1-acceptance.json",
        p2PreLiveAcceptance: "data/p2-pre-live-acceptance.json",
        p2PaperReplay: "data/p2-paper-replay.json"
      },
      paperOnly: true,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      checkCount: 6,
      checks: [
        {
          id: "p1-acceptance",
          status: "passed",
          summary: "P1 research workflow accepted",
          evidenceId: "data/p1-acceptance.json"
        },
        {
          id: "paper-execution-replay",
          status: "passed",
          summary: "Paper replay valid",
          evidenceId: "data/p2-paper-replay.json"
        },
        {
          id: "pre-live-checklist",
          status: "passed",
          summary: "Pre-live checklist complete",
          evidenceId: "manual-route-ready"
        },
        {
          id: "p2-pre-live-manifest",
          status: "passed",
          summary: "P2 pre-live manifest valid",
          evidenceId: "data/p2-pre-live-acceptance.json"
        },
        {
          id: "readiness-evidence-coverage",
          status: "passed",
          summary: "Readiness evidence covered",
          evidenceId: "p2-evidence-coverage"
        },
        {
          id: "live-blocked-boundary",
          status: "passed",
          summary: "Live boundary blocked",
          evidenceId: "forced-platform-boundary"
        }
      ]
    };
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          acceptance: {
            kind: "aiqt.p2ReadinessAcceptanceStatus",
            schemaVersion: 1,
            status: "accepted",
            available: true,
            sourcePath: "data/p2-readiness-acceptance.json",
            summary:
              "p2 readiness acceptance manifest run=run-p2-readiness criteria=6/6 blockers=0 liveBlocked=True",
            reason: "",
            generatedAt: "2026-06-24T11:00:00+00:00",
            runId: "run-p2-readiness",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            adapterId: "ashare-live",
            p1AcceptanceRunId: "run-p1-smoke",
            p2PreLiveAcceptanceRunId: "run-p2-pre-live",
            p2PaperReplayRunId: "run-p2-paper-replay",
            operatorRunbookAuditEventId: "operator-runbook-report-ashare-live-600000-1d-7777777777777777",
            readinessCoverageStatus: "covered",
            acceptedCriterionCount: 6,
            totalCriterionCount: 6,
            blockingCriterionCount: 0,
            criterionIds: manifest.criterionIds,
            auditEventIds: manifest.auditEventIds,
            manifestPaths: manifest.manifestPaths,
            checkCount: 6,
            requiredCheckCount: 6,
            checkIds: manifest.criterionIds,
            paperOnly: true,
            orderSubmissionEnabled: false,
            liveTradingAllowed: false,
            liveOrderSubmitted: false,
            routeExecuted: false,
            liveBlockedBoundary: true,
            manifest
          }
        })
      };
    };

    const result = await loadP2ReadinessAcceptanceLatest("http://127.0.0.1:8765/", fetcher);

    expect(buildP2ReadinessAcceptanceLatestUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/p2/readiness/acceptance/latest"
    );
    expect(buildP2ReadinessAcceptanceLatestUrl("/")).toBe("/api/p2/readiness/acceptance/latest");
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/p2/readiness/acceptance/latest");
    expect(result.source).toBe("core");
    expect(result.acceptance?.manifest?.runId).toBe("run-p2-readiness");
    expect(result.acceptance?.acceptedCriterionCount).toBe(6);
    expect(result.acceptance?.totalCriterionCount).toBe(6);
    expect(result.acceptance?.blockingCriterionCount).toBe(0);
    expect(result.acceptance?.readinessCoverageStatus).toBe("covered");
    expect(result.acceptance?.manifestPaths.p2PaperReplay).toBe("data/p2-paper-replay.json");
    expect(result.acceptance?.orderSubmissionEnabled).toBe(false);
    expect(result.acceptance?.liveTradingAllowed).toBe(false);
    expect(result.acceptance?.liveOrderSubmitted).toBe(false);
    expect(result.acceptance?.routeExecuted).toBe(false);
  });

  test("generates the P2 readiness acceptance manifest without enabling execution", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const manifest = {
      kind: "aiqt.p2ReadinessAcceptanceManifest",
      schemaVersion: 1,
      generatedAt: "2026-06-24T11:00:00+00:00",
      status: "accepted",
      baseUrl: "http://aiqt.local",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      runId: "run-p2-readiness",
      adapterId: "ashare-live",
      p1AcceptanceRunId: "run-p1-smoke",
      p2PreLiveAcceptanceRunId: "run-p2-pre-live",
      p2PaperReplayRunId: "run-p2-paper-replay",
      operatorRunbookAuditEventId: "operator-runbook-report-ashare-live-600000-1d-run-p2-readiness",
      readinessCoverageStatus: "covered",
      acceptedCriterionCount: 6,
      totalCriterionCount: 6,
      blockingCriterionCount: 0,
      criterionIds: [
        "p1-acceptance",
        "paper-execution-replay",
        "pre-live-checklist",
        "p2-pre-live-manifest",
        "readiness-evidence-coverage",
        "live-blocked-boundary"
      ],
      auditEventIds: ["p1-acceptance-run-p1-smoke", "paper-execution-run-p2-paper-replay"],
      manifestPaths: {
        p1Acceptance: "data/p1-acceptance.json",
        p2PreLiveAcceptance: "data/p2-pre-live-acceptance.json",
        p2PaperReplay: "data/p2-paper-replay.json"
      },
      paperOnly: true,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      checkCount: 6,
      checks: [
        { id: "p1-acceptance", status: "passed", summary: "P1 accepted", evidenceId: "data/p1-acceptance.json" },
        { id: "paper-execution-replay", status: "passed", summary: "Replay ready", evidenceId: "data/p2-paper-replay.json" },
        { id: "pre-live-checklist", status: "passed", summary: "Checklist ready", evidenceId: "run-p2-pre-live" },
        { id: "p2-pre-live-manifest", status: "passed", summary: "Manifest ready", evidenceId: "data/p2-pre-live-acceptance.json" },
        { id: "readiness-evidence-coverage", status: "passed", summary: "Traceable", evidenceId: "p2-evidence-coverage" },
        { id: "live-blocked-boundary", status: "passed", summary: "Live blocked", evidenceId: "forced-platform-boundary" }
      ]
    };
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          status: "acceptance_generated",
          acceptance: {
            kind: "aiqt.p2ReadinessAcceptanceStatus",
            schemaVersion: 1,
            status: "accepted",
            available: true,
            sourcePath: "data/p2-readiness-acceptance.json",
            summary:
              "p2 readiness acceptance manifest run=run-p2-readiness criteria=6/6 blockers=0 liveBlocked=True",
            reason: "",
            generatedAt: "2026-06-24T11:00:00+00:00",
            runId: "run-p2-readiness",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            adapterId: "ashare-live",
            p1AcceptanceRunId: "run-p1-smoke",
            p2PreLiveAcceptanceRunId: "run-p2-pre-live",
            p2PaperReplayRunId: "run-p2-paper-replay",
            operatorRunbookAuditEventId: "operator-runbook-report-ashare-live-600000-1d-run-p2-readiness",
            readinessCoverageStatus: "covered",
            acceptedCriterionCount: 6,
            totalCriterionCount: 6,
            blockingCriterionCount: 0,
            criterionIds: manifest.criterionIds,
            auditEventIds: manifest.auditEventIds,
            manifestPaths: manifest.manifestPaths,
            checkCount: 6,
            requiredCheckCount: 6,
            checkIds: manifest.criterionIds,
            paperOnly: true,
            orderSubmissionEnabled: false,
            liveTradingAllowed: false,
            liveOrderSubmitted: false,
            routeExecuted: false,
            liveBlockedBoundary: true,
            manifest
          },
          paperOnly: true,
          orderSubmissionEnabled: false,
          liveTradingAllowed: false,
          liveOrderSubmitted: false,
          routeExecuted: false,
          auditEvent: {
            schemaVersion: 1,
            eventId: "p2-readiness-acceptance-generated-abc123",
            eventType: "p2_readiness_acceptance_generated",
            runId: "run-p2-readiness",
            createdAt: "2026-06-24T00:00:00Z",
            stage: "p2",
            source: "core-service",
            summary: "P2 readiness acceptance generated accepted 6/6",
            detail: "data/p2-readiness-acceptance.json",
            metadata: {
              reportKind: "p2_readiness_acceptance_generated",
              acceptanceStatus: "accepted",
              orderSubmissionEnabled: false,
              liveTradingAllowed: false,
              liveOrderSubmitted: false,
              routeExecuted: false,
              liveBlockedBoundary: true
            }
          }
        })
      };
    };

    const result = await generateP2ReadinessAcceptance("http://127.0.0.1:8765/", fetcher);

    expect(buildP2ReadinessAcceptanceUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/p2/readiness/acceptance"
    );
    expect(buildP2ReadinessAcceptanceUrl("/")).toBe("/api/p2/readiness/acceptance");
    expect(calls[0]).toEqual(
      expect.objectContaining({
        url: "http://127.0.0.1:8765/api/p2/readiness/acceptance",
        init: expect.objectContaining({ method: "POST" })
      })
    );
    expect(result.source).toBe("core");
    expect(result.acceptance?.status).toBe("accepted");
    expect(result.acceptance?.acceptedCriterionCount).toBe(6);
    expect(result.orderSubmissionEnabled).toBe(false);
    expect(result.liveTradingAllowed).toBe(false);
    expect(result.liveOrderSubmitted).toBe(false);
    expect(result.routeExecuted).toBe(false);
    expect(result.auditEvent?.eventType).toBe("p2_readiness_acceptance_generated");
    expect(result.auditEvent?.metadata.acceptanceStatus).toBe("accepted");
    expect(result.auditEvent?.metadata.liveBlockedBoundary).toBe(true);
  });

  test("falls back when latest P2 readiness acceptance readback is missing or malformed", async () => {
    const fetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ acceptance: { status: "accepted" } })
    });

    const result = await loadP2ReadinessAcceptanceLatest("/", fetcher);

    expect(result.source).toBe("fallback");
    expect(result.acceptance?.status).toBe("missing");
    expect(result.acceptance?.available).toBe(false);
    expect(result.acceptance?.manifest).toBeNull();
    expect(result.error).toBe("Invalid P2 readiness acceptance status contract");
  });

  test("loads the latest P2 manifest chain preflight readback without enabling execution", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const stages = [
      {
        id: "p1-acceptance",
        label: "P1 acceptance",
        status: "valid",
        path: "data/p1-acceptance.json",
        summary: "p1 acceptance manifest run=run-p1-smoke watchlist=3 checks=8 liveBlocked=True",
        reason: "",
        nextAction: "",
        nextCommand: ""
      },
      {
        id: "p2-paper-replay",
        label: "P2 paper replay",
        status: "valid",
        path: "data/p2-paper-replay.json",
        summary: "p2 paper replay manifest run=run-p2-paper-replay replay=replay_ready checks=8/8 warnings=0 liveBlocked=True",
        reason: "",
        nextAction: "",
        nextCommand: ""
      },
      {
        id: "p2-pre-live-acceptance",
        label: "P2 pre-live acceptance",
        status: "valid",
        path: "data/p2-pre-live-acceptance.json",
        summary: "p2 pre-live acceptance manifest run=run-p2-pre-live checklist=evidence_pending gates=4/6 blockers=2 liveBlocked=True",
        reason: "",
        nextAction: "",
        nextCommand: ""
      },
      {
        id: "p2-readiness-acceptance",
        label: "P2 readiness acceptance",
        status: "missing",
        path: "data/p2-readiness-acceptance.json",
        summary: "",
        reason: "P2 readiness acceptance report not found at data/p2-readiness-acceptance.json",
        nextAction: "run-p2-readiness",
        nextCommand: "npm run docker:smoke:p2 -- --no-build"
      }
    ];
    const manifest = {
      kind: "aiqt.p2ManifestChainPreflight",
      schemaVersion: 1,
      status: "blocked",
      ready: false,
      validStageCount: 3,
      totalStageCount: 4,
      blockerIds: ["p2-readiness-acceptance"],
      nextAction: "run-p2-readiness",
      nextCommand: "npm run docker:smoke:p2 -- --no-build",
      stages,
      paperOnly: true,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true
    };
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          preflight: {
            kind: "aiqt.p2ManifestChainPreflightStatus",
            schemaVersion: 1,
            status: "blocked",
            available: true,
            sourcePath: "data/p2-chain-preflight.json",
            summary: "p2 manifest chain preflight status=blocked valid=3/4 next=run-p2-readiness",
            reason: "",
            ready: false,
            validStageCount: 3,
            totalStageCount: 4,
            blockerIds: ["p2-readiness-acceptance"],
            nextAction: "run-p2-readiness",
            nextCommand: "npm run docker:smoke:p2 -- --no-build",
            stages,
            paperOnly: true,
            orderSubmissionEnabled: false,
            liveTradingAllowed: false,
            liveOrderSubmitted: false,
            routeExecuted: false,
            liveBlockedBoundary: true,
            manifest
          }
        })
      };
    };

    const result = await loadP2ManifestChainPreflightLatest("http://127.0.0.1:8765/", fetcher);

    expect(buildP2ManifestChainPreflightLatestUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/p2/manifest-chain/preflight/latest"
    );
    expect(buildP2ManifestChainPreflightLatestUrl("/")).toBe("/api/p2/manifest-chain/preflight/latest");
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/p2/manifest-chain/preflight/latest");
    expect(result.source).toBe("core");
    expect(result.preflight?.status).toBe("blocked");
    expect(result.preflight?.validStageCount).toBe(3);
    expect(result.preflight?.totalStageCount).toBe(4);
    expect(result.preflight?.nextAction).toBe("run-p2-readiness");
    expect(result.preflight?.nextCommand).toBe("npm run docker:smoke:p2 -- --no-build");
    expect(result.preflight?.stages.map((stage) => stage.status)).toEqual(["valid", "valid", "valid", "missing"]);
    expect(result.preflight?.orderSubmissionEnabled).toBe(false);
    expect(result.preflight?.liveTradingAllowed).toBe(false);
    expect(result.preflight?.liveOrderSubmitted).toBe(false);
    expect(result.preflight?.routeExecuted).toBe(false);
  });

  test("falls back when latest P2 manifest chain preflight readback is missing or malformed", async () => {
    const fetcher = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ preflight: { status: "blocked" } })
    });

    const result = await loadP2ManifestChainPreflightLatest("/", fetcher);

    expect(result.source).toBe("fallback");
    expect(result.preflight?.status).toBe("missing");
    expect(result.preflight?.available).toBe(false);
    expect(result.preflight?.manifest).toBeNull();
    expect(result.preflight?.nextAction).toBe("run-p1-acceptance");
    expect(result.error).toBe("Invalid P2 manifest chain preflight status contract");
  });

  test("generates the P2 manifest chain preflight through the core service without enabling execution", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const stages = [
      {
        id: "p1-acceptance",
        label: "P1 acceptance",
        status: "valid",
        path: "data/p1-acceptance.json",
        summary: "p1 acceptance manifest run=run-p1-smoke watchlist=3 checks=8 liveBlocked=True",
        reason: "",
        nextAction: "",
        nextCommand: ""
      },
      {
        id: "p2-paper-replay",
        label: "P2 paper replay",
        status: "valid",
        path: "data/p2-paper-replay.json",
        summary: "p2 paper replay manifest run=run-p2-paper-replay replay=replay_ready checks=8/8 warnings=0 liveBlocked=True",
        reason: "",
        nextAction: "",
        nextCommand: ""
      },
      {
        id: "p2-pre-live-acceptance",
        label: "P2 pre-live acceptance",
        status: "valid",
        path: "data/p2-pre-live-acceptance.json",
        summary: "p2 pre-live acceptance manifest run=run-p2-pre-live checklist=evidence_pending gates=4/6 blockers=2 liveBlocked=True",
        reason: "",
        nextAction: "",
        nextCommand: ""
      },
      {
        id: "p2-readiness-acceptance",
        label: "P2 readiness acceptance",
        status: "missing",
        path: "data/p2-readiness-acceptance.json",
        summary: "",
        reason: "P2 readiness acceptance report not found at data/p2-readiness-acceptance.json",
        nextAction: "run-p2-readiness",
        nextCommand: "npm run docker:smoke:p2 -- --no-build"
      }
    ];
    const manifest = {
      kind: "aiqt.p2ManifestChainPreflight",
      schemaVersion: 1,
      status: "blocked",
      ready: false,
      validStageCount: 3,
      totalStageCount: 4,
      blockerIds: ["p2-readiness-acceptance"],
      nextAction: "run-p2-readiness",
      nextCommand: "npm run docker:smoke:p2 -- --no-build",
      stages,
      paperOnly: true,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true
    };
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          status: "preflight_generated",
          auditEvent: {
            schemaVersion: 1,
            eventId: "p2-chain-preflight-abc123",
            eventType: "p2_manifest_chain_preflight",
            runId: null,
            createdAt: "2026-06-24T12:00:00+00:00",
            stage: "p2",
            source: "core-service",
            summary: "P2 manifest chain preflight blocked 3/4 next=run-p2-readiness",
            detail: "First blocker: p2-readiness-acceptance; live trading remains blocked.",
            metadata: {
              reportKind: "p2_manifest_chain_preflight",
              preflightStatus: "blocked",
              validStageCount: 3,
              totalStageCount: 4,
              nextAction: "run-p2-readiness",
              orderSubmissionEnabled: false,
              liveTradingAllowed: false,
              liveOrderSubmitted: false,
              routeExecuted: false
            }
          },
          paperOnly: true,
          orderSubmissionEnabled: false,
          liveTradingAllowed: false,
          liveOrderSubmitted: false,
          routeExecuted: false,
          preflight: {
            kind: "aiqt.p2ManifestChainPreflightStatus",
            schemaVersion: 1,
            status: "blocked",
            available: true,
            sourcePath: "data/p2-chain-preflight.json",
            summary: "p2 manifest chain preflight status=blocked valid=3/4 next=run-p2-readiness",
            reason: "",
            ready: false,
            validStageCount: 3,
            totalStageCount: 4,
            blockerIds: ["p2-readiness-acceptance"],
            nextAction: "run-p2-readiness",
            nextCommand: "npm run docker:smoke:p2 -- --no-build",
            stages,
            paperOnly: true,
            orderSubmissionEnabled: false,
            liveTradingAllowed: false,
            liveOrderSubmitted: false,
            routeExecuted: false,
            liveBlockedBoundary: true,
            manifest
          }
        })
      };
    };

    const result = await generateP2ManifestChainPreflight("http://127.0.0.1:8765/", fetcher);

    expect(buildP2ManifestChainPreflightUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/p2/manifest-chain/preflight"
    );
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/p2/manifest-chain/preflight");
    expect(calls[0].init?.method).toBe("POST");
    expect(result.source).toBe("core");
    expect(result.status).toBe("preflight_generated");
    expect(result.auditEvent?.eventType).toBe("p2_manifest_chain_preflight");
    expect(result.auditEvent?.metadata.preflightStatus).toBe("blocked");
    expect(result.auditEvent?.metadata.liveTradingAllowed).toBe(false);
    expect(result.preflight?.status).toBe("blocked");
    expect(result.preflight?.nextAction).toBe("run-p2-readiness");
    expect(result.preflight?.orderSubmissionEnabled).toBe(false);
    expect(result.preflight?.liveTradingAllowed).toBe(false);
    expect(result.preflight?.liveOrderSubmitted).toBe(false);
    expect(result.preflight?.routeExecuted).toBe(false);
  });

  test("runs the P0 paper simulation command and returns fill replay evidence", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          status: "paper_simulation_created",
          runId: "run-p0-paper",
          paperOnly: true,
          liveTradingAllowed: false,
          orderSubmitted: false,
          liveOrderSubmitted: false,
          routeExecuted: false,
          paperOrderRecorded: true,
          simulatedFillRecorded: true,
          liveRouteBlockedReason: "P0 only records simulated paper fills; live routing flags are rejected.",
          execution: {
            executionId: "paper-p0-1",
            runId: "run-p0-paper",
            createdAt: "2026-06-23T08:20:00+00:00",
            mode: "paper_only",
            account: { cash: 80680, positions: { "600000": 2100 }, equity: 100000 },
            orders: [
              {
                orderId: "order-p0-1",
                symbol: "600000",
                side: "buy",
                quantity: 2100,
                price: 9.2,
                status: "filled",
                reason: "filled_immediately",
                timestamp: "2026-06-23T08:20:00+00:00"
              }
            ],
            gates: [
              { id: "audit-run-bound", label: "Audit run bound", passed: true, reason: "bound" },
              { id: "paper-risk-check", label: "Paper risk check", passed: true, reason: "filled_immediately" },
              { id: "live-route-blocked", label: "Live route blocked", passed: false, reason: "paper-only" }
            ]
          },
          simulatedFill: {
            orderId: "order-p0-1",
            symbol: "600000",
            side: "buy",
            quantity: 2100,
            fillPrice: 9.2,
            status: "filled",
            filledAt: "2026-06-23T08:20:00+00:00",
            reason: "filled_immediately"
          },
          accountReplay: {
            mode: "single_run_paper_replay",
            runId: "run-p0-paper",
            symbol: "600000",
            initialCash: 100000,
            cashAfter: 80680,
            positionAfter: 2100,
            equityAfter: 100000,
            ordersApplied: 1,
            paperOnly: true,
            liveTradingAllowed: false
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "p0-paper-simulation-paper-p0-1",
            eventType: "p0_paper_simulation",
            runId: "run-p0-paper",
            createdAt: "2026-06-23T08:20:00+00:00",
            stage: "execution",
            source: "p0-paper-simulation",
            summary: "P0 paper simulation recorded for 600000; live routing blocked.",
            detail: "Simulated buy 2100 600000 at 9.2; no live order was submitted.",
            metadata: { paperOnly: true, liveTradingAllowed: false }
          },
          exportReadiness: {
            ready: true,
            requiredArtifacts: ["researchRun", "aiReview", "paperExecution", "auditEvent"],
            paperExecutionId: "paper-p0-1",
            auditEventId: "p0-paper-simulation-paper-p0-1",
            detail: "Paper simulation evidence is recorded."
          }
        })
      };
    };

    const result = await runP0PaperSimulation(
      "/",
      { runId: "run-p0-paper", market: "ashare", symbol: "600000", timeframe: "1d" },
      fetcher
    );
    const body = JSON.parse(String(calls[0].init?.body));

    expect(calls[0].url).toBe("/api/p0/paper-simulations");
    expect(calls[0].init?.method).toBe("POST");
    expect(body).toEqual({ runId: "run-p0-paper", market: "ashare", symbol: "600000", timeframe: "1d" });
    expect(result.source).toBe("core");
    expect(result.statusLabel).toBe("P0 paper simulation created");
    expect(result.execution?.executionId).toBe("paper-p0-1");
    expect(result.simulatedFill?.orderId).toBe("order-p0-1");
    expect(result.accountReplay?.cashAfter).toBe(80680);
    expect(result.auditEvent?.eventType).toBe("p0_paper_simulation");
    expect(result.exportReadiness?.ready).toBe(true);
    expect(result.liveTradingAllowed).toBe(false);
    expect(result.routeExecuted).toBe(false);
  });

  test("runs the P0 AI review command and returns saved evidence", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          status: "ai_review_saved",
          mode: "local_evidence_review",
          paperOnly: true,
          liveTradingAllowed: false,
          directTradingInstructionBlocked: true,
          aiReview: {
            aiReviewId: "ai-review:run-p0:rev-p0:local-evidence",
            runId: "run-p0",
            createdAt: "2026-06-23T08:10:00+00:00",
            record: {
              schemaVersion: 1,
              recordType: "aiqt.aiReviewRun",
              aiReviewId: "ai-review:run-p0:rev-p0:local-evidence",
              runId: "run-p0",
              createdAt: "2026-06-23T08:10:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyRevision: "rev-p0",
              executionMode: "paper_only",
              status: "ready",
              summary: {
                citationCount: 4,
                roundCount: 4,
                decisionCount: 3,
                parameterScanBound: true,
                liveExecutionBlocked: true
              },
              dossier: {
                status: "ready",
                headline: "Local evidence review ready",
                summary: "Evidence-bound review, no direct trading instruction.",
                citations: [
                  { id: "run", label: "Audited run", value: "run-p0", detail: "120 bars", tone: "ai" },
                  { id: "metrics", label: "Backtest metrics", value: "+1.2%", detail: "2 trades", tone: "positive" },
                  { id: "risk-gates", label: "Risk boundary", value: "paper-only", detail: "Live blocked", tone: "risk" }
                ],
                risks: ["Paper-only boundary remains active."],
                unknowns: ["Benchmark review remains open."]
              },
              citations: [
                { id: "run", label: "Audited run", value: "run-p0", detail: "120 bars", tone: "ai" },
                { id: "metrics", label: "Backtest metrics", value: "+1.2%", detail: "2 trades", tone: "positive" },
                { id: "risk-gates", label: "Risk boundary", value: "paper-only", detail: "Live blocked", tone: "risk" }
              ],
              rounds: [
                {
                  id: "risk-manager",
                  phase: "risk",
                  agent: "Risk Manager",
                  thesis: "Paper review only.",
                  evidence: "Live route is blocked.",
                  verdict: "risk",
                  confidence: 0.8,
                  tone: "risk"
                }
              ],
              decisionLog: [{ agent: "AI Boundary", message: "No direct trading instructions.", tone: "ai" }],
              evidenceAnchors: [
                {
                  id: "run:run-p0",
                  type: "research-run",
                  label: "Audited run",
                  reference: "run-p0",
                  exportPath: "researchRun.runId"
                }
              ],
              boundary: "Evidence explanation only; No direct trading instructions; no return promises; paper review only."
            }
          }
        })
      };
    };

    const result = await runP0AiReview(
      "/",
      { runId: "run-p0", market: "ashare", symbol: "600000", timeframe: "1d" },
      fetcher
    );
    const body = JSON.parse(String(calls[0].init?.body));

    expect(calls[0].url).toBe("/api/p0/ai-reviews");
    expect(calls[0].init?.method).toBe("POST");
    expect(body).toEqual({ runId: "run-p0", market: "ashare", symbol: "600000", timeframe: "1d" });
    expect(result.source).toBe("core");
    expect(result.statusLabel).toBe("P0 AI review saved");
    expect(result.mode).toBe("local_evidence_review");
    expect(result.aiReview?.aiReviewId).toBe("ai-review:run-p0:rev-p0:local-evidence");
    expect(result.paperOnly).toBe(true);
    expect(result.liveTradingAllowed).toBe(false);
    expect(result.directTradingInstructionBlocked).toBe(true);
  });

  test("runs the P0 pipeline and hydrates the audited run workspace", async () => {
    const currentWorkspace = {
      ...buildTerminalWorkspace(),
      strategy: {
        name: "SMA trend",
        entry: "Close > SMA20",
        exit: "Close < SMA20",
        position: "20% cap per instrument",
        risk: "Stop -8%, take profit +18%, drawdown guard 12%, paper only"
      },
      backtestAssumptions: {
        initialCash: 100000,
        feeBps: 3,
        slippageBps: 2
      }
    };
    const auditedRun: ResearchRunAudit = {
      runId: "run-p0abc123",
      createdAt: "2026-06-23T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend",
      strategyRevision: "2015b7a0c498",
      dataRows: 120,
      metrics: {
        total_return_pct: 1.2,
        annual_return_pct: 24,
        max_drawdown_pct: 0.8,
        win_rate_pct: 50,
        profit_factor: 1.1,
        trade_count: 2,
        bar_count: 120
      },
      decisions: [],
      executionMode: "paper_only",
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 120 },
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 1,
        start: "2026-06-22T08:00:00+00:00",
        end: "2026-06-23T08:00:00+00:00",
        hash: "abc123def456",
        bars: [
          {
            timestamp: "2026-06-23T08:00:00+00:00",
            timestampMs: 1782201600000,
            open: 9.1,
            high: 9.3,
            low: 9,
            close: 9.2,
            volume: 1200000
          }
        ]
      },
      strategyConfig: {
        name: "SMA trend",
        revision: "2015b7a0c498",
        market: "ashare",
        symbols: ["600000"],
        timeframe: "1d",
        version: 1,
        entryConditions: [{ kind: "close_above_sma", params: { window: 20 } }],
        exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
        risk: { positionPct: 0.2, stopLossPct: 0.08, takeProfitPct: 0.18, maxDrawdownPct: 0.12 }
      },
      backtestAssumptions: { initialCash: 100000, feeBps: 3, slippageBps: 2 },
      backtestTrades: [],
      backtestEquityCurve: [{ timestamp: "2026-06-23T08:00:00+00:00", equity: 101200 }],
      backtestDiagnostics: []
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (init?.method === "POST") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: "audited_run_created",
            runId: "run-p0abc123",
            strategyRevisionId: "strategy-2015b7a0c498",
            dataSnapshotId: "data-abc123def456",
            metrics: { totalReturnPct: 1.2, maxDrawdownPct: 0.8, tradeCount: 2 },
            paperOnly: true,
            liveTradingAllowed: false,
            orderSubmitted: false,
            liveOrderSubmitted: false,
            routeExecuted: false
          })
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ run: auditedRun })
      };
    };

    const result = await runP0Pipeline(
      "/",
      { market: "ashare", symbol: "600000", timeframe: "1d", limit: 240 },
      currentWorkspace,
      fetcher
    );
    const body = JSON.parse(String(calls[0].init?.body));

    expect(calls[0].url).toBe("/api/p0/pipeline");
    expect(calls[0].init?.method).toBe("POST");
    expect(body).toMatchObject({
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      limit: 240,
      strategyConfig: {
        name: "SMA trend",
        entry: { type: "sma_cross", window: 20 },
        exit: { type: "sma_break", window: 20 },
        position: { maxPositionPct: 20 },
        risk: { stopLossPct: 8, takeProfitPct: 18, maxDrawdownPct: 12 }
      },
      assumptions: { initialCash: 100000, feeBps: 3, slippageBps: 2 }
    });
    expect(calls[1].url).toBe("/api/research/runs/run-p0abc123");
    expect(result.source).toBe("core");
    expect(result.statusLabel).toBe("P0 pipeline run complete");
    expect(result.pipeline?.paperOnly).toBe(true);
    expect(result.pipeline?.liveTradingAllowed).toBe(false);
    expect(result.workspace.researchRun?.runId).toBe("run-p0abc123");
    expect(result.workspace.strategy.entry).toBe("Close > SMA20");
  });

  test("builds the research run URL with locked watchlist refresh evidence", () => {
    expect(
      buildResearchRunUrl(
        "http://127.0.0.1:8765/",
        "ashare",
        "600000",
        "1d",
        undefined,
        120,
        undefined,
        "cache-refresh-f10efd7401b7"
      )
    ).toBe(
      "http://127.0.0.1:8765/api/research/run?market=ashare&symbol=600000&timeframe=1d&limit=120&watchlistRefreshRunId=cache-refresh-f10efd7401b7"
    );
  });

  test("builds the research run URL with editable backtest assumptions", () => {
    expect(
      buildResearchRunUrl("http://127.0.0.1:8765/", "ashare", "600000", "1d", {
        initialCash: 250000,
        feeBps: 8,
        slippageBps: 4
      })
    ).toBe(
      "http://127.0.0.1:8765/api/research/run?market=ashare&symbol=600000&timeframe=1d&limit=500&initialCash=250000&feeBps=8&slippageBps=4"
    );
  });

  test("builds the research run URL with editable strategy snapshot fields", () => {
    const url = new URL(
      buildResearchRunUrl(
        "http://127.0.0.1:8765/",
        "ashare",
        "600000",
        "1d",
        undefined,
        500,
        {
          name: "Custom SMA risk plan",
          entry: "Close > SMA5",
          exit: "Close < SMA7",
          position: "25% cap per instrument",
          risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
        }
      )
    );

    expect(url.searchParams.get("strategyName")).toBe("Custom SMA risk plan");
    expect(url.searchParams.get("strategyEntry")).toBe("Close > SMA5");
    expect(url.searchParams.get("strategyExit")).toBe("Close < SMA7");
    expect(url.searchParams.get("strategyPosition")).toBe("25% cap per instrument");
    expect(url.searchParams.get("strategyRisk")).toBe("Stop -6%, take profit +12%, drawdown guard 9%, paper only");
  });

  test("builds the research run history URL with a bounded limit", () => {
    expect(buildResearchRunsUrl("http://127.0.0.1:8765/", 5)).toBe(
      "http://127.0.0.1:8765/api/research/runs?limit=5"
    );
  });

  test("builds the research run detail URL with an encoded run id", () => {
    expect(buildResearchRunDetailUrl("http://127.0.0.1:8765/", "run 你好/1")).toBe(
      "http://127.0.0.1:8765/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1"
    );
  });

  test("builds the research run export URL with an encoded run id", () => {
    expect(buildResearchRunExportUrl("http://127.0.0.1:8765/", "run 你好/1")).toBe(
      "http://127.0.0.1:8765/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1/export"
    );
  });

  test("builds the research run import URL", () => {
    expect(buildResearchRunImportUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/research/runs/import"
    );
  });

  test("builds the research note URL for the selected context", () => {
    expect(buildResearchNoteUrl("http://127.0.0.1:8765/", "ashare", "600000", "1d")).toBe(
      "http://127.0.0.1:8765/api/research/notes?market=ashare&symbol=600000&timeframe=1d"
    );
  });

  test("builds the paper execution URL with an encoded run id", () => {
    expect(buildResearchRunPaperExecutionsUrl("http://127.0.0.1:8765/", "run 你好/1")).toBe(
      "http://127.0.0.1:8765/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1/paper-executions"
    );
  });

  test("builds the promotion candidate URL with an encoded run id", () => {
    expect(buildResearchRunPromotionUrl("http://127.0.0.1:8765/", "run 你好/1")).toBe(
      "http://127.0.0.1:8765/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1/promotion"
    );
  });

  test("builds the portfolio backtest URL", () => {
    expect(buildPortfolioBacktestUrl("/")).toBe("/api/portfolio/backtest");
  });

  test("builds the portfolio paper order URL with a bounded query", () => {
    expect(buildPortfolioPaperOrdersUrl("/", { baseRunId: "portfolio run/你好", limit: 200 })).toBe(
      "/api/portfolio/paper-orders?baseRunId=portfolio+run%2F%E4%BD%A0%E5%A5%BD&limit=50"
    );
  });

  test("builds the portfolio paper order approval URL with an encoded batch query", () => {
    expect(
      buildPortfolioPaperOrderApprovalsUrl("/", {
        baseRunId: "portfolio run/你好",
        batchId: "portfolio-paper-batch/1"
      })
    ).toBe(
      "/api/portfolio/paper-order-approvals?baseRunId=portfolio+run%2F%E4%BD%A0%E5%A5%BD&batchId=portfolio-paper-batch%2F1"
    );
  });

  test("builds the portfolio paper order simulation URL with an encoded batch query", () => {
    expect(
      buildPortfolioPaperOrderSimulationsUrl("/", {
        baseRunId: "portfolio run/你好",
        batchId: "portfolio-paper-batch/1"
      })
    ).toBe(
      "/api/portfolio/paper-order-simulations?baseRunId=portfolio+run%2F%E4%BD%A0%E5%A5%BD&batchId=portfolio-paper-batch%2F1"
    );
  });

  test("builds the portfolio paper order state history URL with an encoded batch query", () => {
    expect(
      buildPortfolioPaperOrderStateHistoryUrl("/", {
        baseRunId: "portfolio run/你好",
        batchId: "portfolio-paper-batch/1"
      })
    ).toBe(
      "/api/portfolio/paper-order-state-history?baseRunId=portfolio+run%2F%E4%BD%A0%E5%A5%BD&batchId=portfolio-paper-batch%2F1"
    );
  });

  test("builds the portfolio paper order replay URL with initial cash", () => {
    expect(buildPortfolioPaperOrderReplayUrl("/", { baseRunId: "portfolio run/你好", initialCash: 50000 })).toBe(
      "/api/portfolio/paper-order-replay?baseRunId=portfolio+run%2F%E4%BD%A0%E5%A5%BD&initialCash=50000"
    );
  });

  test("builds the settings status URL", () => {
    expect(buildSettingsStatusUrl("http://127.0.0.1:8765/")).toBe("http://127.0.0.1:8765/api/settings/status");
  });

  test("builds the execution adapter ledger URL", () => {
    expect(buildExecutionAdapterLedgerUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-ledger"
    );
  });

  test("builds the ccxt sandbox adapter health URL", () => {
    expect(
      buildExecutionAdapterHealthProbeUrl("http://127.0.0.1:8765/", {
        adapterId: "ccxt live/1",
        exchange: "binance-usdm",
        productionRouteReviewId: "execution-adapter-production-route-review/1"
      })
    ).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-health/ccxt-sandbox?adapterId=ccxt+live%2F1&exchange=binance-usdm&productionRouteReviewId=execution-adapter-production-route-review%2F1"
    );
  });

  test("builds the execution adapter certifications URL with an encoded adapter query", () => {
    expect(buildExecutionAdapterCertificationsUrl("http://127.0.0.1:8765/", { adapterId: "us live/1", limit: 3 })).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-certifications?adapterId=us+live%2F1&limit=3"
    );
    expect(buildExecutionAdapterCertificationsUrl("/", { adapterId: "crypto-live" })).toBe(
      "/api/execution/adapter-certifications?adapterId=crypto-live"
    );
  });

  test("builds the golden path status URL for the selected context", () => {
    expect(buildGoldenPathStatusUrl("/", { market: "ashare", symbol: "600000", timeframe: "1d" })).toBe(
      "/api/golden-path/status?market=ashare&symbol=600000&timeframe=1d"
    );
  });

  test("builds the cache refresh URL", () => {
    expect(buildCacheRefreshUrl("http://127.0.0.1:8765/")).toBe("http://127.0.0.1:8765/api/cache/refresh");
  });

  test("builds strategy library URLs for context and detail lookup", () => {
    expect(buildStrategiesUrl("http://127.0.0.1:8765/", { market: "ashare", symbol: "600000", limit: 5 })).toBe(
      "http://127.0.0.1:8765/api/strategies?market=ashare&symbol=600000&limit=5"
    );
    expect(buildStrategyDetailUrl("http://127.0.0.1:8765/", "rev 你好/1")).toBe(
      "http://127.0.0.1:8765/api/strategies/rev%20%E4%BD%A0%E5%A5%BD%2F1"
    );
    expect(buildStrategyValidationUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/strategies/validate"
    );
  });

  test("builds the market klines URL with selected chart context", () => {
    expect(buildMarketKlinesUrl("http://127.0.0.1:8765/", "ashare", "600000", "1d", 160)).toBe(
      "http://127.0.0.1:8765/api/market/klines?market=ashare&symbol=600000&timeframe=1d&limit=160"
    );
  });

  test("builds the market klines URL with an optional end boundary for historical paging", () => {
    expect(
      buildMarketKlinesUrl("http://127.0.0.1:8765/", "ashare", "600000", "60m", 500, "2026-05-26T09:45:00.000Z")
    ).toBe(
      "http://127.0.0.1:8765/api/market/klines?market=ashare&symbol=600000&timeframe=60m&limit=500&end=2026-05-26T09%3A45%3A00.000Z"
    );
  });

  test("builds the market search URL with encoded Chinese query text and optional timeframe", () => {
    expect(buildMarketSearchUrl("http://127.0.0.1:8765/", "ashare", "浦发", 8)).toBe(
      "http://127.0.0.1:8765/api/market/search?market=ashare&query=%E6%B5%A6%E5%8F%91&limit=8"
    );
    expect(buildMarketSearchUrl("http://127.0.0.1:8765/", "ashare", "浦发", 8, "5m")).toBe(
      "http://127.0.0.1:8765/api/market/search?market=ashare&query=%E6%B5%A6%E5%8F%91&limit=8&timeframe=5m"
    );
  });

  test("builds an empty chart loading state for the newly selected symbol", () => {
    expect(buildLoadingMarketKlinesResult({ market: "ashare", symbol: "600004", timeframe: "1d" })).toEqual({
      market: "ashare",
      symbol: "600004",
      timeframe: "1d",
      bars: [],
      quality: {
        source: "loading",
        isComplete: false,
        warnings: [],
        rows: 0
      },
      source: "fallback"
    });
  });

  test("resolves the local core base URL from Vite environment with a default", () => {
    expect(resolveQuantCoreBaseUrl({ VITE_QUANT_API_BASE: "http://localhost:9999" })).toBe("http://localhost:9999");
    expect(resolveQuantCoreBaseUrl({})).toBe("/");
  });

  test("loads the workspace contract from the Python core", async () => {
    const remoteWorkspace = {
      ...buildTerminalWorkspace(),
      schemaVersion: 1,
      selectedInstrument: {
        symbol: "AAPL",
        name: "Apple",
        market: "us",
        changePct: -0.36
      }
    };
    const calls: string[] = [];
    const result = await loadTerminalWorkspace("http://127.0.0.1:8765/", async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => remoteWorkspace
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/workspace"]);
    expect(result.source).toBe("core");
    expect(result.statusLabel).toBe("Core connected");
    expect(result.workspace.selectedInstrument.symbol).toBe("AAPL");
  });

  test("runs a portfolio backtest against audited run ids", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          portfolio: {
            name: "A-share core basket",
            market: "ashare",
            timeframe: "1d",
            initialCash: 100000,
            cashWeight: 0.1,
            metrics: {
              totalReturnPct: 9,
              annualReturnPct: 109,
              maxDrawdownPct: 1.2,
              winRatePct: 50,
              profitFactor: 1.5,
              tradeCount: 4
            },
            equityCurve: [
              { timestamp: "2026-05-26T08:00:00+00:00", equity: 100000 },
              { timestamp: "2026-05-27T08:00:00+00:00", equity: 109000 }
            ],
            allocationEvents: [
              {
                timestamp: "2026-05-26T08:00:00+00:00",
                eventType: "allocate",
                symbol: "600000",
                sourceRunId: "run-a",
                targetWeight: 0.6,
                notionalValue: 60000,
                reason: "static target allocation"
              },
              {
                timestamp: "2026-05-26T08:00:00+00:00",
                eventType: "cash_buffer",
                symbol: "CASH",
                sourceRunId: null,
                targetWeight: 0.1,
                notionalValue: 10000,
                reason: "unallocated cash buffer"
              }
            ],
            rebalanceEvents: [
              {
                timestamp: "2026-05-27T08:00:00+00:00",
                eventType: "rebalance_review",
                symbol: "600000",
                sourceRunId: "run-a",
                targetWeight: 0.6,
                endingWeight: 0.578,
                currentValue: 63000,
                targetValue: 65400,
                deltaValue: 2400,
                driftPct: -2.2,
                status: "review",
                reason: "ending weight drift requires review; no order is routed"
              },
              {
                timestamp: "2026-05-27T08:00:00+00:00",
                eventType: "rebalance_review",
                symbol: "CASH",
                sourceRunId: null,
                targetWeight: 0.1,
                endingWeight: 0.092,
                currentValue: 10000,
                targetValue: 10900,
                deltaValue: 900,
                driftPct: -0.8,
                status: "within_band",
                reason: "ending weight remains inside the review band"
              }
            ],
            tradeReviewEvents: [
              {
                timestamp: "2026-05-27T08:00:00+00:00",
                eventType: "trade_review",
                symbol: "600000",
                sourceRunId: "run-a",
                side: "buy",
                notionalValue: 2400,
                targetWeight: 0.6,
                endingWeight: 0.578,
                status: "paper_review",
                reason: "paper-only rebalance intent generated from audited portfolio drift; no order is routed"
              }
            ],
            preTradeRiskChecks: [
              {
                timestamp: "2026-05-27T08:00:00+00:00",
                eventType: "pre_trade_risk_check",
                scope: "trade",
                symbol: "600000",
                sourceRunId: "run-a",
                checkId: "trade_notional_limit",
                status: "passed",
                value: 0.022,
                limit: 0.2,
                reason: "trade notional remains inside the hard pre-trade limit"
              }
            ],
            paperOrderEvents: [
              {
                timestamp: "2026-05-27T08:00:00+00:00",
                eventType: "portfolio_paper_order",
                orderId: "portfolio-paper-run-a-buy",
                symbol: "600000",
                sourceRunId: "run-a",
                side: "buy",
                notionalValue: 2400,
                quantity: 2400,
                status: "pending_review",
                riskStatus: "review",
                reason: "portfolio paper order candidate requires operator review before staging"
              }
            ],
            covarianceRisk: {
              method: "population_covariance",
              observations: 1,
              periodVolatilityPct: 1.8,
              annualizedVolatilityPct: 28.6,
              contributions: [
                {
                  symbol: "600000",
                  sourceRunId: "run-a",
                  targetWeight: 0.6,
                  annualizedVolatilityPct: 31.2,
                  marginalContributionPct: 24.8,
                  contributionPct: 68.4
                },
                {
                  symbol: "000300",
                  sourceRunId: "run-b",
                  targetWeight: 0.3,
                  annualizedVolatilityPct: 18.5,
                  marginalContributionPct: 12.6,
                  contributionPct: 31.6
                }
              ]
            },
            legs: [
              {
                symbol: "600000",
                targetWeight: 0.6,
                startingValue: 60000,
                endingValue: 63000,
                contributionValue: 3000,
                contributionReturnPct: 5,
                maxDrawdownPct: 4.5,
                tradeCount: 2,
                dataQuality: { source: "local-cache", isComplete: true, warnings: [], rows: 2 }
              },
              {
                symbol: "000300",
                targetWeight: 0.3,
                startingValue: 30000,
                endingValue: 36000,
                contributionValue: 6000,
                contributionReturnPct: 20,
                maxDrawdownPct: 5,
                tradeCount: 2,
                dataQuality: { source: "local-cache", isComplete: true, warnings: [], rows: 2 }
              }
            ],
            dataQuality: { source: "portfolio-composite(600000:local-cache,000300:local-cache)", isComplete: true, warnings: [], rows: 2 }
          }
        })
      };
    };

    const result = await runPortfolioBacktest(
      "/",
      {
        name: "A-share core basket",
        initialCash: 100000,
        legs: [
          { runId: "run-a", targetWeight: 0.6 },
          { runId: "run-b", targetWeight: 0.3 }
        ]
      },
      fetcher
    );

    expect(result.source).toBe("core");
    expect(result.portfolio?.metrics.totalReturnPct).toBe(9);
    expect(result.portfolio?.cashWeight).toBe(0.1);
    expect(result.portfolio?.legs.map((leg) => `${leg.symbol}:${leg.contributionValue}`)).toEqual(["600000:3000", "000300:6000"]);
    expect(result.portfolio?.allocationEvents?.map((event) => `${event.eventType}:${event.symbol}:${event.notionalValue}`)).toEqual([
      "allocate:600000:60000",
      "cash_buffer:CASH:10000"
    ]);
    expect(result.portfolio?.rebalanceEvents?.map((event) => `${event.symbol}:${event.status}:${event.deltaValue}`)).toEqual([
      "600000:review:2400",
      "CASH:within_band:900"
    ]);
    expect(result.portfolio?.tradeReviewEvents?.map((event) => `${event.symbol}:${event.side}:${event.status}:${event.notionalValue}`)).toEqual([
      "600000:buy:paper_review:2400"
    ]);
    expect(result.portfolio?.preTradeRiskChecks?.map((check) => `${check.symbol}:${check.checkId}:${check.status}:${check.limit}`)).toEqual([
      "600000:trade_notional_limit:passed:0.2"
    ]);
    expect(result.portfolio?.paperOrderEvents?.map((event) => `${event.symbol}:${event.side}:${event.status}:${event.riskStatus}:${event.quantity}`)).toEqual([
      "600000:buy:pending_review:review:2400"
    ]);
    expect(result.portfolio?.covarianceRisk?.contributions.map((item) => `${item.symbol}:${item.contributionPct}`)).toEqual([
      "600000:68.4",
      "000300:31.6"
    ]);
    expect(calls[0]).toMatchObject({ url: "/api/portfolio/backtest" });
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      name: "A-share core basket",
      initialCash: 100000,
      legs: [
        { runId: "run-a", targetWeight: 0.6 },
        { runId: "run-b", targetWeight: 0.3 }
      ]
    });
  });

  test("records and loads portfolio paper order batches from the Python core", async () => {
    const order = {
      timestamp: "2026-05-27T08:00:00+00:00",
      eventType: "portfolio_paper_order" as const,
      orderId: "portfolio-paper-run-a-buy",
      symbol: "600000",
      sourceRunId: "run-a",
      side: "buy" as const,
      notionalValue: 2400,
      quantity: 2400,
      status: "pending_review" as const,
      riskStatus: "review" as const,
      reason: "portfolio paper order candidate requires operator review before staging"
    };
    const batch = {
      batchId: "portfolio-paper-batch-1",
      baseRunId: "portfolio-run-1",
      portfolioName: "A-share core basket",
      createdAt: "2026-05-27T08:05:00+00:00",
      mode: "portfolio_paper_order_review" as const,
      source: "portfolio_backtest",
      summary: {
        totalOrders: 1,
        totalNotionalValue: 2400,
        statusCounts: { pending_review: 1 },
        riskStatusCounts: { review: 1 }
      },
      orders: [order]
    };
    const auditEvent: AuditEventRecord = {
      schemaVersion: 1 as const,
      eventId: "portfolio-paper-order-batch-portfolio-paper-batch-1",
      eventType: "portfolio_paper_order_batch",
      runId: "portfolio-run-1",
      createdAt: "2026-05-27T08:05:00+00:00",
      stage: "portfolio-paper-order-review",
      source: "portfolio_backtest",
      summary: "A-share core basket recorded 1 portfolio paper order candidates.",
      detail: "Portfolio paper order batch is paper-only and requires operator review before any simulated routing.",
      metadata: {
        batchId: "portfolio-paper-batch-1",
        totalOrders: 1,
        statusCounts: { pending_review: 1 },
        paperOnly: true,
        liveExecutionBlocked: true
      }
    };
    const lifecycle = [
      {
        batchId: "portfolio-paper-batch-1",
        baseRunId: "portfolio-run-1",
        portfolioName: "A-share core basket",
        orderId: "portfolio-paper-run-a-buy",
        symbol: "600000",
        sourceRunId: "run-a",
        side: "buy",
        quantity: 2400,
        notionalValue: 2400,
        originalStatus: "pending_review",
        riskStatus: "review",
        state: "awaiting_operator_review",
        routable: false,
        paperOnly: true,
        liveExecutionBlocked: true,
        approvedBy: null,
        reviewedAt: null,
        reason: "portfolio paper order candidate requires operator review before staging"
      }
    ];
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        json: async () =>
          init?.method === "POST"
            ? { portfolioPaperOrderBatch: batch, portfolioPaperOrderLifecycle: lifecycle, auditEvent }
            : { portfolioPaperOrderBatches: [batch] }
      };
    };

    const recordResult = await recordPortfolioPaperOrderBatch(
      "/",
      {
        baseRunId: "portfolio-run-1",
        portfolioName: "A-share core basket",
        orders: [order]
      },
      fetcher
    );
    const historyResult = await loadPortfolioPaperOrderBatches("/", "portfolio-run-1", fetcher);

    expect(recordResult.source).toBe("core");
    expect(recordResult.batch?.summary.statusCounts.pending_review).toBe(1);
    expect(recordResult.lifecycle?.map((row) => `${row.orderId}:${row.state}:${row.routable}`)).toEqual([
      "portfolio-paper-run-a-buy:awaiting_operator_review:false"
    ]);
    expect(recordResult.auditEvent?.eventId).toBe("portfolio-paper-order-batch-portfolio-paper-batch-1");
    expect(recordResult.auditEvent?.metadata.paperOnly).toBe(true);
    expect(historyResult.source).toBe("core");
    expect(historyResult.batches[0].orders[0].orderId).toBe("portfolio-paper-run-a-buy");
    expect(calls[0]).toMatchObject({ url: "/api/portfolio/paper-orders" });
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      baseRunId: "portfolio-run-1",
      portfolioName: "A-share core basket",
      orders: [order],
      source: "portfolio_backtest"
    });
    expect(calls[1].url).toBe("/api/portfolio/paper-orders?baseRunId=portfolio-run-1&limit=20");
  });

  test("reuses an existing portfolio paper order batch when the core reports a duplicate", async () => {
    const order = {
      timestamp: "2026-05-27T08:00:00+00:00",
      eventType: "portfolio_paper_order" as const,
      orderId: "portfolio-paper-run-a-buy",
      symbol: "600000",
      sourceRunId: "run-a",
      side: "buy" as const,
      notionalValue: 2400,
      quantity: 2400,
      status: "pending_review" as const,
      riskStatus: "review" as const,
      reason: "Duplicate clicks should reuse the existing batch."
    };
    const existingBatch = {
      batchId: "portfolio-paper-batch-existing",
      baseRunId: "portfolio-run-1",
      portfolioName: "A-share core basket",
      createdAt: "2026-05-27T08:05:00+00:00",
      mode: "portfolio_paper_order_review" as const,
      source: "portfolio_backtest",
      summary: {
        totalOrders: 1,
        totalNotionalValue: 2400,
        statusCounts: { pending_review: 1 },
        riskStatusCounts: { review: 1 }
      },
      orders: [order]
    };
    const lifecycle = [
      {
        batchId: "portfolio-paper-batch-existing",
        baseRunId: "portfolio-run-1",
        portfolioName: "A-share core basket",
        orderId: "portfolio-paper-run-a-buy",
        symbol: "600000",
        sourceRunId: "run-a",
        side: "buy" as const,
        quantity: 2400,
        notionalValue: 2400,
        originalStatus: "pending_review" as const,
        riskStatus: "review" as const,
        state: "awaiting_operator_review" as const,
        routable: false,
        paperOnly: true,
        liveExecutionBlocked: true,
        approvedBy: null,
        reviewedAt: null,
        reason: "portfolio paper order candidate requires operator review before staging"
      }
    ];
    const fetcher = async () => ({
      ok: false,
      status: 409,
      json: async () => ({
        error: "portfolio_paper_order_batch_already_recorded",
        detail: "portfolio-paper-batch-existing",
        existingBatch,
        portfolioPaperOrderLifecycle: lifecycle
      })
    });

    const result = await recordPortfolioPaperOrderBatch(
      "/",
      {
        baseRunId: "portfolio-run-1",
        portfolioName: "A-share core basket",
        orders: [order]
      },
      fetcher
    );

    expect(result.source).toBe("core");
    expect(result.error).toBeUndefined();
    expect(result.batch?.batchId).toBe("portfolio-paper-batch-existing");
    expect(result.lifecycle?.map((row) => `${row.orderId}:${row.state}`)).toEqual([
      "portfolio-paper-run-a-buy:awaiting_operator_review"
    ]);
    expect(result.auditEvent).toBeUndefined();
  });

  test("records and loads portfolio paper order approvals from the Python core", async () => {
    const approval = {
      approvalId: "portfolio-paper-order-approval-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      orderId: "portfolio-paper-run-a-buy",
      reviewedAt: "2026-05-27T08:45:00+00:00",
      approved: true,
      reviewer: "operator-a",
      reason: "Approved for paper simulation only."
    };
    const lifecycle = [
      {
        batchId: "portfolio-paper-batch-1",
        baseRunId: "portfolio-run-1",
        portfolioName: "A-share core basket",
        orderId: "portfolio-paper-run-a-buy",
        symbol: "600000",
        sourceRunId: "run-a",
        side: "buy",
        quantity: 2400,
        notionalValue: 2400,
        originalStatus: "pending_review",
        riskStatus: "passed",
        state: "ready_for_simulation",
        routable: true,
        paperOnly: true,
        liveExecutionBlocked: true,
        approvedBy: "operator-a",
        reviewedAt: "2026-05-27T08:45:00+00:00",
        reason: "Approved for paper simulation only."
      }
    ];
    const auditEvent = {
      schemaVersion: 1 as const,
      eventId: "portfolio-paper-order-approval-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
      eventType: "portfolio_paper_order_approval",
      runId: "portfolio-run-1",
      createdAt: "2026-05-27T08:45:00+00:00",
      stage: "portfolio-paper-order-approval",
      source: "operator-review",
      summary: "operator-a approved portfolio paper order portfolio-paper-run-a-buy.",
      detail: "Approved for paper simulation only.",
      metadata: {
        approvalId: "portfolio-paper-order-approval-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
        batchId: "portfolio-paper-batch-1",
        orderId: "portfolio-paper-run-a-buy",
        approved: true,
        reviewer: "operator-a",
        approvalState: "ready_for_simulation",
        routable: true,
        paperOnly: true,
        liveExecutionBlocked: true
      }
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        json: async () =>
          init?.method === "POST"
            ? { approval, approvals: [approval], portfolioPaperOrderLifecycle: lifecycle, auditEvent }
            : { approvals: [approval], portfolioPaperOrderLifecycle: lifecycle }
      };
    };

    const recordResult = await recordPortfolioPaperOrderApproval(
      "/",
      {
        baseRunId: "portfolio-run-1",
        batchId: "portfolio-paper-batch-1",
        orderId: "portfolio-paper-run-a-buy",
        approved: true,
        reviewer: "operator-a",
        reviewedAt: "2026-05-27T08:45:00+00:00",
        reason: "Approved for paper simulation only."
      },
      fetcher
    );
    const historyResult = await loadPortfolioPaperOrderApprovals(
      "/",
      "portfolio-run-1",
      "portfolio-paper-batch-1",
      fetcher
    );

    expect(recordResult.source).toBe("core");
    expect(recordResult.approval?.reviewer).toBe("operator-a");
    expect(recordResult.lifecycle?.map((row) => `${row.orderId}:${row.state}:${row.routable}:${row.approvedBy}`)).toEqual([
      "portfolio-paper-run-a-buy:ready_for_simulation:true:operator-a"
    ]);
    expect(recordResult.auditEvent?.metadata.approvalState).toBe("ready_for_simulation");
    expect(historyResult.source).toBe("core");
    expect(historyResult.approvals[0].approvalId).toBe(
      "portfolio-paper-order-approval-portfolio-paper-batch-1-portfolio-paper-run-a-buy"
    );
    expect(historyResult.lifecycle.map((row) => row.state)).toEqual(["ready_for_simulation"]);
    expect(calls[0]).toMatchObject({ url: "/api/portfolio/paper-order-approvals" });
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      orderId: "portfolio-paper-run-a-buy",
      approved: true,
      reviewer: "operator-a",
      reviewedAt: "2026-05-27T08:45:00+00:00",
      reason: "Approved for paper simulation only."
    });
    expect(calls[1].url).toBe(
      "/api/portfolio/paper-order-approvals?baseRunId=portfolio-run-1&batchId=portfolio-paper-batch-1"
    );
  });

  test("returns current approvals and lifecycle when portfolio paper order approval is locked after simulation", async () => {
    const approval = {
      approvalId: "portfolio-paper-order-approval-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      orderId: "portfolio-paper-run-a-buy",
      reviewedAt: "2026-05-27T08:45:00+00:00",
      approved: true,
      reviewer: "operator-a",
      reason: "Approved for paper simulation only."
    };
    const simulation = {
      simulationId: "portfolio-paper-order-simulation-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      orderId: "portfolio-paper-run-a-buy",
      simulatedAt: "2026-05-27T08:46:00+00:00",
      mode: "portfolio_paper_order_simulation" as const,
      symbol: "600000",
      sourceRunId: "run-a",
      side: "buy" as const,
      quantity: 2400,
      fillPrice: 9.2,
      notionalValue: 22080,
      orderState: "filled" as const,
      fillStatus: "filled" as const,
      reason: "Paper-only simulation filled the approved portfolio order.",
      approvedBy: "operator-a",
      paperOnly: true,
      liveExecutionBlocked: true
    };
    const lifecycle = [
      {
        batchId: "portfolio-paper-batch-1",
        baseRunId: "portfolio-run-1",
        portfolioName: "A-share core basket",
        orderId: "portfolio-paper-run-a-buy",
        symbol: "600000",
        sourceRunId: "run-a",
        side: "buy" as const,
        quantity: 2400,
        notionalValue: 22080,
        originalStatus: "pending_review" as const,
        riskStatus: "passed" as const,
        state: "ready_for_simulation" as const,
        routable: true,
        paperOnly: true,
        liveExecutionBlocked: true,
        approvedBy: "operator-a",
        reviewedAt: "2026-05-27T08:45:00+00:00",
        reason: "Approved for paper simulation only."
      }
    ];

    const result = await recordPortfolioPaperOrderApproval(
      "/",
      {
        baseRunId: "portfolio-run-1",
        batchId: "portfolio-paper-batch-1",
        orderId: "portfolio-paper-run-a-buy",
        approved: false,
        reviewer: "operator-b",
        reason: "Attempted reversal after simulated fill."
      },
      async () => ({
        ok: false,
        status: 409,
        json: async () => ({
          error: "portfolio_paper_order_approval_locked_after_simulation",
          detail: "portfolio-paper-run-a-buy",
          existingApproval: approval,
          existingSimulation: simulation,
          approvals: [approval],
          portfolioPaperOrderLifecycle: lifecycle
        })
      })
    );

    expect(result.source).toBe("core");
    expect(result.error).toBe("portfolio_paper_order_approval_locked_after_simulation");
    expect(result.approval).toBeUndefined();
    expect(result.approvals).toEqual([approval]);
    expect(result.existingApproval).toEqual(approval);
    expect(result.existingSimulation).toEqual(simulation);
    expect(result.lifecycle?.map((row) => `${row.orderId}:${row.state}`)).toEqual([
      "portfolio-paper-run-a-buy:ready_for_simulation"
    ]);
  });

  test("records and loads portfolio paper order simulations from the Python core", async () => {
    const simulation = {
      simulationId: "portfolio-paper-order-simulation-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      orderId: "portfolio-paper-run-a-buy",
      simulatedAt: "2026-05-27T08:46:00+00:00",
      mode: "portfolio_paper_order_simulation",
      symbol: "600000",
      sourceRunId: "run-a",
      side: "buy",
      quantity: 2400,
      fillPrice: 9.2,
      notionalValue: 22080,
      orderState: "filled",
      fillStatus: "filled",
      reason: "Paper-only simulation filled the approved portfolio order.",
      approvedBy: "operator-a",
      routeRisk: {
        status: "passed",
        cashAfter: 77920,
        blockedReasons: []
      },
      adapterPaperExecutionId: "execution-adapter-paper-execution-portfolio-simulation",
      adapterManifestValidationId: "execution-adapter-secret-manifest-validation-portfolio-simulation",
      adapterPaperExecutionEvidence: {
        fillSummary: "filled buy 2400 600000 @ 9.2",
        manifestValidationId: "execution-adapter-secret-manifest-validation-portfolio-simulation",
        paperFillRecorded: true,
        liveOrderSubmitted: false,
        privateKey: "[redacted]"
      },
      paperOnly: true,
      liveExecutionBlocked: true
    };
    const lifecycle = [
      {
        batchId: "portfolio-paper-batch-1",
        baseRunId: "portfolio-run-1",
        portfolioName: "A-share core basket",
        orderId: "portfolio-paper-run-a-buy",
        symbol: "600000",
        sourceRunId: "run-a",
        side: "buy",
        quantity: 2400,
        notionalValue: 22080,
        originalStatus: "pending_review",
        riskStatus: "passed",
        state: "ready_for_simulation",
        routable: true,
        paperOnly: true,
        liveExecutionBlocked: true,
        approvedBy: "operator-a",
        reviewedAt: "2026-05-27T08:45:00+00:00",
        reason: "Approved for paper simulation only."
      }
    ];
    const auditEvent = {
      schemaVersion: 1 as const,
      eventId: "portfolio-paper-order-simulation-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
      eventType: "portfolio_paper_order_simulation",
      runId: "portfolio-run-1",
      createdAt: "2026-05-27T08:46:00+00:00",
      stage: "portfolio-paper-order-simulation",
      source: "paper-simulator",
      summary: "Paper simulation filled portfolio-paper-run-a-buy.",
      detail: "Paper-only simulation filled the approved portfolio order.",
      metadata: {
        simulationId: "portfolio-paper-order-simulation-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
        batchId: "portfolio-paper-batch-1",
        orderId: "portfolio-paper-run-a-buy",
        orderState: "filled",
        fillStatus: "filled",
        approvalState: "ready_for_simulation",
        routeRiskStatus: "passed",
        adapterPaperExecutionId: "execution-adapter-paper-execution-portfolio-simulation",
        adapterManifestValidationId: "execution-adapter-secret-manifest-validation-portfolio-simulation",
        adapterPaperExecutionEvidence: {
          fillSummary: "filled buy 2400 600000 @ 9.2",
          manifestValidationId: "execution-adapter-secret-manifest-validation-portfolio-simulation",
          paperFillRecorded: true,
          liveOrderSubmitted: false,
          privateKey: "[redacted]"
        },
        paperOnly: true,
        liveExecutionBlocked: true
      }
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        json: async () =>
          init?.method === "POST"
            ? { simulation, simulations: [simulation], portfolioPaperOrderLifecycle: lifecycle, auditEvent }
            : { simulations: [simulation], portfolioPaperOrderLifecycle: lifecycle }
      };
    };

    const recordResult = await recordPortfolioPaperOrderSimulation(
      "/",
      {
        baseRunId: "portfolio-run-1",
        batchId: "portfolio-paper-batch-1",
        orderId: "portfolio-paper-run-a-buy",
        simulatedAt: "2026-05-27T08:46:00+00:00",
        routeRisk: {
          initialCash: 100000,
          minCashAfter: 0,
          maxSymbolNotional: 20000,
          maxBatchNotional: 60000
        },
        adapterPaperExecutionId: "execution-adapter-paper-execution-portfolio-simulation",
        adapterManifestValidationId: "execution-adapter-secret-manifest-validation-portfolio-simulation",
        adapterPaperExecutionEvidence: {
          fillSummary: "filled buy 2400 600000 @ 9.2",
          manifestValidationId: "execution-adapter-secret-manifest-validation-portfolio-simulation",
          paperFillRecorded: true,
          liveOrderSubmitted: false,
          privateKey: "[redacted]"
        }
      },
      fetcher
    );
    const historyResult = await loadPortfolioPaperOrderSimulations(
      "/",
      "portfolio-run-1",
      "portfolio-paper-batch-1",
      fetcher
    );

    expect(recordResult.source).toBe("core");
    expect(recordResult.simulation?.orderState).toBe("filled");
    expect(recordResult.simulation?.fillPrice).toBe(9.2);
    expect(recordResult.simulation?.routeRisk?.status).toBe("passed");
    expect(recordResult.simulation?.adapterPaperExecutionId).toBe(
      "execution-adapter-paper-execution-portfolio-simulation"
    );
    expect(recordResult.simulation?.adapterPaperExecutionEvidence?.privateKey).toBe("[redacted]");
    expect(recordResult.lifecycle?.map((row) => row.state)).toEqual(["ready_for_simulation"]);
    expect(recordResult.auditEvent?.metadata.approvalState).toBe("ready_for_simulation");
    expect(recordResult.auditEvent?.metadata.adapterPaperExecutionId).toBe(
      "execution-adapter-paper-execution-portfolio-simulation"
    );
    expect(historyResult.source).toBe("core");
    expect(historyResult.simulations[0].simulationId).toBe(
      "portfolio-paper-order-simulation-portfolio-paper-batch-1-portfolio-paper-run-a-buy"
    );
    expect(historyResult.simulations[0].adapterManifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-portfolio-simulation"
    );
    expect(calls[0]).toMatchObject({ url: "/api/portfolio/paper-order-simulations" });
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      orderId: "portfolio-paper-run-a-buy",
      simulatedAt: "2026-05-27T08:46:00+00:00",
      routeRisk: {
        initialCash: 100000,
        minCashAfter: 0,
        maxSymbolNotional: 20000,
        maxBatchNotional: 60000
      },
      adapterPaperExecutionId: "execution-adapter-paper-execution-portfolio-simulation",
      adapterManifestValidationId: "execution-adapter-secret-manifest-validation-portfolio-simulation",
      adapterPaperExecutionEvidence: {
        fillSummary: "filled buy 2400 600000 @ 9.2",
        manifestValidationId: "execution-adapter-secret-manifest-validation-portfolio-simulation",
        paperFillRecorded: true,
        liveOrderSubmitted: false,
        privateKey: "[redacted]"
      }
    });
    expect(calls[1].url).toBe(
      "/api/portfolio/paper-order-simulations?baseRunId=portfolio-run-1&batchId=portfolio-paper-batch-1"
    );
  });

  test("rejects portfolio paper order simulation evidence that leaks adapter secrets", async () => {
    const leakedSimulation = {
      simulationId: "portfolio-paper-order-simulation-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      orderId: "portfolio-paper-run-a-buy",
      simulatedAt: "2026-05-27T08:46:00+00:00",
      mode: "portfolio_paper_order_simulation",
      symbol: "600000",
      sourceRunId: "run-a",
      side: "buy",
      quantity: 2400,
      fillPrice: 9.2,
      notionalValue: 22080,
      orderState: "filled",
      fillStatus: "filled",
      reason: "Paper-only simulation filled the approved portfolio order.",
      approvedBy: "operator-a",
      adapterPaperExecutionId: "execution-adapter-paper-execution-portfolio-simulation",
      adapterManifestValidationId: "execution-adapter-secret-manifest-validation-portfolio-simulation",
      adapterPaperExecutionEvidence: {
        fillSummary: "filled buy 2400 600000 @ 9.2",
        privateKey: "raw-private-key-should-not-leak"
      },
      paperOnly: true,
      liveExecutionBlocked: true
    };
    const result = await recordPortfolioPaperOrderSimulation(
      "/",
      {
        baseRunId: "portfolio-run-1",
        batchId: "portfolio-paper-batch-1",
        orderId: "portfolio-paper-run-a-buy"
      },
      async () => ({
        ok: true,
        json: async () => ({
          simulation: leakedSimulation,
          simulations: [leakedSimulation]
        })
      })
    );

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid portfolio paper order simulation contract");
    expect(result.simulation).toBeUndefined();
  });

  test("reuses an existing portfolio paper order simulation when the core reports a duplicate", async () => {
    const simulation = {
      simulationId: "portfolio-paper-order-simulation-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      orderId: "portfolio-paper-run-a-buy",
      simulatedAt: "2026-05-27T08:46:00+00:00",
      mode: "portfolio_paper_order_simulation" as const,
      symbol: "600000",
      sourceRunId: "run-a",
      side: "buy" as const,
      quantity: 2400,
      fillPrice: 9.2,
      notionalValue: 22080,
      orderState: "filled" as const,
      fillStatus: "filled" as const,
      reason: "Paper-only simulation filled the approved portfolio order.",
      approvedBy: "operator-a",
      routeRisk: { status: "passed", cashAfter: 77920, blockedReasons: [] },
      paperOnly: true,
      liveExecutionBlocked: true
    };
    const lifecycle = [
      {
        batchId: "portfolio-paper-batch-1",
        baseRunId: "portfolio-run-1",
        portfolioName: "A-share core basket",
        orderId: "portfolio-paper-run-a-buy",
        symbol: "600000",
        sourceRunId: "run-a",
        side: "buy" as const,
        quantity: 2400,
        notionalValue: 22080,
        originalStatus: "pending_review" as const,
        riskStatus: "passed" as const,
        state: "ready_for_simulation" as const,
        routable: true,
        paperOnly: true,
        liveExecutionBlocked: true,
        approvedBy: "operator-a",
        reviewedAt: "2026-05-27T08:45:00+00:00",
        reason: "Approved for paper simulation only."
      }
    ];
    const fetcher = async () => ({
      ok: false,
      status: 409,
      json: async () => ({
        error: "portfolio_paper_order_simulation_already_recorded",
        detail: "portfolio-paper-run-a-buy",
        existingSimulation: simulation,
        simulations: [simulation],
        portfolioPaperOrderLifecycle: lifecycle
      })
    });

    const result = await recordPortfolioPaperOrderSimulation(
      "/",
      {
        baseRunId: "portfolio-run-1",
        batchId: "portfolio-paper-batch-1",
        orderId: "portfolio-paper-run-a-buy",
        simulatedAt: "2026-05-27T08:50:00+00:00"
      },
      fetcher
    );

    expect(result.source).toBe("core");
    expect(result.error).toBeUndefined();
    expect(result.simulation?.simulationId).toBe(
      "portfolio-paper-order-simulation-portfolio-paper-batch-1-portfolio-paper-run-a-buy"
    );
    expect(result.simulations).toHaveLength(1);
    expect(result.lifecycle?.map((row) => `${row.orderId}:${row.state}`)).toEqual([
      "portfolio-paper-run-a-buy:ready_for_simulation"
    ]);
    expect(result.auditEvent).toBeUndefined();
  });

  test("records portfolio paper order batch simulations from the Python core", async () => {
    const simulation = {
      simulationId: "portfolio-paper-order-simulation-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      orderId: "portfolio-paper-run-a-buy",
      simulatedAt: "2026-05-27T08:46:00+00:00",
      mode: "portfolio_paper_order_simulation",
      symbol: "600000",
      sourceRunId: "run-a",
      side: "buy",
      quantity: 2400,
      fillPrice: 9.2,
      notionalValue: 22080,
      orderState: "filled",
      fillStatus: "filled",
      reason: "Paper-only simulation filled the approved portfolio order.",
      approvedBy: "operator-a",
      routeRisk: {
        status: "passed",
        cashAfter: 77920,
        blockedReasons: []
      },
      adapterPaperExecutionId: "execution-adapter-paper-execution-batch-a",
      adapterManifestValidationId: "execution-adapter-secret-manifest-validation-batch-a",
      adapterPaperExecutionEvidence: {
        fillSummary: "filled buy 2400 600000 @ 9.2",
        manifestValidationId: "execution-adapter-secret-manifest-validation-batch-a",
        paperFillRecorded: true,
        liveOrderSubmitted: false,
        privateKey: "[redacted]"
      },
      paperOnly: true,
      liveExecutionBlocked: true
    };
    const lifecycle = [
      {
        batchId: "portfolio-paper-batch-1",
        baseRunId: "portfolio-run-1",
        portfolioName: "A-share core basket",
        orderId: "portfolio-paper-run-a-buy",
        symbol: "600000",
        sourceRunId: "run-a",
        side: "buy",
        quantity: 2400,
        notionalValue: 22080,
        originalStatus: "pending_review",
        riskStatus: "passed",
        state: "ready_for_simulation",
        routable: true,
        paperOnly: true,
        liveExecutionBlocked: true,
        approvedBy: "operator-a",
        reviewedAt: "2026-05-27T08:45:00+00:00",
        reason: "Approved for paper simulation only."
      }
    ];
    const auditEvent = {
      schemaVersion: 1 as const,
      eventId: "portfolio-paper-order-simulation-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
      eventType: "portfolio_paper_order_simulation",
      runId: "portfolio-run-1",
      createdAt: "2026-05-27T08:46:00+00:00",
      stage: "portfolio-paper-order-simulation",
      source: "paper-simulator",
      summary: "Paper simulation filled portfolio-paper-run-a-buy.",
      detail: "Paper-only simulation filled the approved portfolio order.",
      metadata: {
        simulationId: "portfolio-paper-order-simulation-portfolio-paper-batch-1-portfolio-paper-run-a-buy",
        batchId: "portfolio-paper-batch-1",
        orderId: "portfolio-paper-run-a-buy",
        orderState: "filled",
        fillStatus: "filled",
        approvalState: "ready_for_simulation",
        routeRiskStatus: "passed",
        adapterPaperExecutionId: "execution-adapter-paper-execution-batch-a",
        adapterManifestValidationId: "execution-adapter-secret-manifest-validation-batch-a",
        paperOnly: true,
        liveExecutionBlocked: true
      }
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        json: async () => ({
          batchSimulation: {
            schemaVersion: 1,
            mode: "portfolio_paper_order_batch_simulation",
            status: "partial",
            baseRunId: "portfolio-run-1",
            batchId: "portfolio-paper-batch-1",
            requestedCount: 2,
            filledCount: 1,
            blockedCount: 1,
            skippedCount: 0,
            filledOrderIds: ["portfolio-paper-run-a-buy"],
            blockedOrders: [
              {
                orderId: "portfolio-paper-run-b-buy",
                symbol: "000300",
                side: "buy",
                detail: "portfolio_paper_order_simulation_route_risk_blocked:batch_notional_limit_exceeded"
              }
            ],
            skippedOrders: [],
            paperOnly: true,
            liveExecutionBlocked: true
          },
          simulations: [simulation],
          createdSimulations: [simulation],
          portfolioPaperOrderLifecycle: lifecycle,
          auditEvents: [auditEvent]
        })
      };
    };

    expect(buildPortfolioPaperOrderBatchSimulationsUrl("/")).toBe("/api/portfolio/paper-order-simulations/batch");
    const result = await recordPortfolioPaperOrderBatchSimulation(
      "/",
      {
        baseRunId: "portfolio-run-1",
        batchId: "portfolio-paper-batch-1",
        orderIds: ["portfolio-paper-run-a-buy", "portfolio-paper-run-b-buy"],
        simulatedAt: "2026-05-27T08:46:00+00:00",
        routeRisk: {
          initialCash: 100000,
          minCashAfter: 0,
          maxSymbolNotional: 20000,
          maxBatchNotional: 25000
        },
        adapterPaperExecutionEvidenceByOrderId: {
          "portfolio-paper-run-a-buy": {
            adapterPaperExecutionId: "execution-adapter-paper-execution-batch-a",
            adapterManifestValidationId: "execution-adapter-secret-manifest-validation-batch-a",
            adapterPaperExecutionEvidence: {
              fillSummary: "filled buy 2400 600000 @ 9.2",
              manifestValidationId: "execution-adapter-secret-manifest-validation-batch-a",
              paperFillRecorded: true,
              liveOrderSubmitted: false,
              privateKey: "[redacted]"
            }
          }
        }
      },
      fetcher
    );

    expect(result.source).toBe("core");
    expect(result.batchSimulation?.status).toBe("partial");
    expect(result.batchSimulation?.filledCount).toBe(1);
    expect(result.batchSimulation?.blockedOrders[0].orderId).toBe("portfolio-paper-run-b-buy");
    expect(result.createdSimulations[0].orderId).toBe("portfolio-paper-run-a-buy");
    expect(result.createdSimulations[0].adapterPaperExecutionId).toBe("execution-adapter-paper-execution-batch-a");
    expect(result.createdSimulations[0].adapterPaperExecutionEvidence?.privateKey).toBe("[redacted]");
    expect(result.auditEvents[0].eventType).toBe("portfolio_paper_order_simulation");
    expect(result.auditEvents[0].metadata.adapterPaperExecutionId).toBe("execution-adapter-paper-execution-batch-a");
    expect(result.lifecycle?.map((row) => row.state)).toEqual(["ready_for_simulation"]);
    expect(calls[0]).toMatchObject({ url: "/api/portfolio/paper-order-simulations/batch" });
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      orderIds: ["portfolio-paper-run-a-buy", "portfolio-paper-run-b-buy"],
      simulatedAt: "2026-05-27T08:46:00+00:00",
      routeRisk: {
        initialCash: 100000,
        minCashAfter: 0,
        maxSymbolNotional: 20000,
        maxBatchNotional: 25000
      },
      adapterPaperExecutionEvidenceByOrderId: {
        "portfolio-paper-run-a-buy": {
          adapterPaperExecutionId: "execution-adapter-paper-execution-batch-a",
          adapterManifestValidationId: "execution-adapter-secret-manifest-validation-batch-a",
          adapterPaperExecutionEvidence: {
            fillSummary: "filled buy 2400 600000 @ 9.2",
            manifestValidationId: "execution-adapter-secret-manifest-validation-batch-a",
            paperFillRecorded: true,
            liveOrderSubmitted: false,
            privateKey: "[redacted]"
          }
        }
      }
    });
  });

  test("loads portfolio paper order replay account snapshots", async () => {
    const replay = {
      schemaVersion: 1 as const,
      baseRunId: "portfolio-run-1",
      generatedAt: "2026-05-27T09:00:00+00:00",
      mode: "portfolio_paper_order_replay" as const,
      initialCash: 50000,
      account: { cash: 40800, positions: { "600000": 1000 }, equity: 50000 },
      positions: [
        {
          symbol: "600000",
          quantity: 1000,
          avgCost: 9.2,
          lastPrice: 9.2,
          marketValue: 9200,
          unrealizedPnl: 0
        }
      ],
      orders: [
        {
          simulationId: "sim-replay-api",
          batchId: "portfolio-paper-batch-1",
          orderId: "portfolio-paper-run-a-buy",
          simulatedAt: "2026-05-27T08:46:00+00:00",
          symbol: "600000",
          side: "buy" as const,
          quantity: 1000,
          fillPrice: 9.2,
          notionalValue: 9200,
          cashAfter: 40800,
          positionAfter: 1000,
          replayState: "applied" as const,
          adapterPaperExecutionId: "execution-adapter-paper-execution-replay",
          adapterManifestValidationId: "execution-adapter-secret-manifest-validation-replay",
          adapterPaperExecutionEvidence: {
            fillSummary: "filled buy 1000 600000 @ 9.2",
            manifestValidationId: "execution-adapter-secret-manifest-validation-replay",
            paperFillRecorded: true,
            liveOrderSubmitted: false,
            privateKey: "[redacted]"
          },
          paperOnly: true,
          liveExecutionBlocked: true
        }
      ],
      summary: {
        filledOrders: 1,
        buyNotional: 9200,
        sellNotional: 0,
        netNotional: 9200,
        realizedPnl: 0,
        unrealizedPnl: 0,
        positionCount: 1,
        warnings: []
      },
      paperOnly: true,
      liveExecutionBlocked: true
    };
    const calls: string[] = [];
    const fetcher = async (url: string) => {
      calls.push(url);
      return { ok: true, json: async () => ({ replay }) };
    };

    const result = await loadPortfolioPaperOrderReplay("/", "portfolio-run-1", fetcher, 50000);

    expect(buildPortfolioPaperOrderReplayUrl("/", { baseRunId: "portfolio-run-1", initialCash: 50000 })).toBe(
      "/api/portfolio/paper-order-replay?baseRunId=portfolio-run-1&initialCash=50000"
    );
    expect(calls[0]).toBe("/api/portfolio/paper-order-replay?baseRunId=portfolio-run-1&initialCash=50000");
    expect(result.source).toBe("core");
    expect(result.replay?.account.cash).toBe(40800);
    expect(result.replay?.positions[0].symbol).toBe("600000");
    expect(result.replay?.orders[0].replayState).toBe("applied");
    expect(result.replay?.orders[0].adapterPaperExecutionId).toBe("execution-adapter-paper-execution-replay");
    expect(result.replay?.orders[0].adapterPaperExecutionEvidence?.privateKey).toBe("[redacted]");
  });

  test("rejects portfolio paper order replay evidence that leaks adapter secrets", async () => {
    const replay = {
      schemaVersion: 1 as const,
      baseRunId: "portfolio-run-1",
      generatedAt: "2026-05-27T09:00:00+00:00",
      mode: "portfolio_paper_order_replay" as const,
      initialCash: 50000,
      account: { cash: 40800, positions: { "600000": 1000 }, equity: 50000 },
      positions: [],
      orders: [
        {
          simulationId: "sim-replay-api",
          batchId: "portfolio-paper-batch-1",
          orderId: "portfolio-paper-run-a-buy",
          simulatedAt: "2026-05-27T08:46:00+00:00",
          symbol: "600000",
          side: "buy" as const,
          quantity: 1000,
          fillPrice: 9.2,
          notionalValue: 9200,
          cashAfter: 40800,
          positionAfter: 1000,
          replayState: "applied" as const,
          adapterPaperExecutionId: "execution-adapter-paper-execution-replay",
          adapterManifestValidationId: "execution-adapter-secret-manifest-validation-replay",
          adapterPaperExecutionEvidence: {
            fillSummary: "filled buy 1000 600000 @ 9.2",
            privateKey: "raw-private-key-should-not-leak"
          },
          paperOnly: true,
          liveExecutionBlocked: true
        }
      ],
      summary: {
        filledOrders: 1,
        buyNotional: 9200,
        sellNotional: 0,
        netNotional: 9200,
        realizedPnl: 0,
        unrealizedPnl: 0,
        positionCount: 1,
        warnings: []
      },
      paperOnly: true,
      liveExecutionBlocked: true
    };
    const result = await loadPortfolioPaperOrderReplay("/", "portfolio-run-1", async () => ({
      ok: true,
      json: async () => ({ replay })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid portfolio paper order replay contract");
    expect(result.replay).toBeUndefined();
  });

  test("loads portfolio paper order state history timelines", async () => {
    const stateHistory = {
      schemaVersion: 1 as const,
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      portfolioName: "A-share state basket",
      generatedAt: "2026-05-27T09:00:00+00:00",
      mode: "portfolio_paper_order_state_history" as const,
      summary: {
        orderCount: 1,
        eventCount: 4,
        approvedOrders: 1,
        rejectedOrders: 0,
        filledOrders: 1,
        liveBlockedEvents: 1,
        stateCounts: { live_blocked: 1 }
      },
      orders: [
        {
          batchId: "portfolio-paper-batch-1",
          baseRunId: "portfolio-run-1",
          portfolioName: "A-share state basket",
          orderId: "portfolio-paper-run-a-buy",
          symbol: "600000",
          sourceRunId: "run-a",
          side: "buy" as const,
          quantity: 1000,
          notionalValue: 9200,
          originalStatus: "pending_review" as const,
          riskStatus: "passed" as const,
          currentState: "live_blocked",
          currentStateLabel: "Live route blocked",
          paperOnly: true,
          liveExecutionBlocked: true,
          events: [
            {
              eventId: "portfolio-paper-batch-1:portfolio-paper-run-a-buy:created:1",
              batchId: "portfolio-paper-batch-1",
              baseRunId: "portfolio-run-1",
              orderId: "portfolio-paper-run-a-buy",
              timestamp: "2026-05-27T08:30:00+00:00",
              state: "created",
              label: "Paper order created",
              actor: "portfolio_backtest",
              source: "portfolio_backtest",
              reason: "Created.",
              paperOnly: true,
              liveExecutionBlocked: true
            },
            {
              eventId: "portfolio-paper-batch-1:portfolio-paper-run-a-buy:operator_approved:3",
              batchId: "portfolio-paper-batch-1",
              baseRunId: "portfolio-run-1",
              orderId: "portfolio-paper-run-a-buy",
              timestamp: "2026-05-27T08:45:00+00:00",
              state: "operator_approved",
              label: "Operator approved",
              actor: "operator-a",
              source: "operator-review",
              reason: "Approved.",
              paperOnly: true,
              liveExecutionBlocked: true
            },
            {
              eventId: "portfolio-paper-batch-1:portfolio-paper-run-a-buy:simulation_filled:4",
              batchId: "portfolio-paper-batch-1",
              baseRunId: "portfolio-run-1",
              orderId: "portfolio-paper-run-a-buy",
              timestamp: "2026-05-27T08:46:00+00:00",
              state: "simulation_filled",
              label: "Paper simulation filled",
              actor: "operator-a",
              source: "paper-simulator",
              reason: "Filled.",
              paperOnly: true,
              liveExecutionBlocked: true,
              metadata: {
                simulationId: "sim-state",
                fillPrice: 9.2,
                fillStatus: "filled",
                orderState: "filled",
                adapterPaperExecutionId: "execution-adapter-paper-execution-state",
                adapterManifestValidationId: "execution-adapter-secret-manifest-validation-state",
                adapterPaperExecutionEvidence: {
                  fillSummary: "filled buy 1000 600000 @ 9.2",
                  manifestValidationId: "execution-adapter-secret-manifest-validation-state",
                  paperFillRecorded: true,
                  liveOrderSubmitted: false,
                  privateKey: "[redacted]"
                }
              }
            },
            {
              eventId: "portfolio-paper-batch-1:portfolio-paper-run-a-buy:live_blocked:5",
              batchId: "portfolio-paper-batch-1",
              baseRunId: "portfolio-run-1",
              orderId: "portfolio-paper-run-a-buy",
              timestamp: "2026-05-27T08:46:00+00:00",
              state: "live_blocked",
              label: "Live route blocked",
              actor: "execution-guard",
              source: "live-route-guard",
              reason: "Live execution blocked.",
              paperOnly: true,
              liveExecutionBlocked: true
            }
          ]
        }
      ],
      paperOnly: true,
      liveExecutionBlocked: true
    };
    const calls: string[] = [];
    const fetcher = async (url: string) => {
      calls.push(url);
      return { ok: true, json: async () => ({ stateHistory }) };
    };

    const result = await loadPortfolioPaperOrderStateHistory(
      "/",
      "portfolio-run-1",
      "portfolio-paper-batch-1",
      fetcher
    );

    expect(calls[0]).toBe(
      "/api/portfolio/paper-order-state-history?baseRunId=portfolio-run-1&batchId=portfolio-paper-batch-1"
    );
    expect(result.source).toBe("core");
    expect(result.stateHistory?.summary.eventCount).toBe(4);
    expect(result.stateHistory?.orders[0].events.map((event) => event.state)).toEqual([
      "created",
      "operator_approved",
      "simulation_filled",
      "live_blocked"
    ]);
    expect(result.stateHistory?.orders[0].events[2].metadata?.adapterPaperExecutionId).toBe(
      "execution-adapter-paper-execution-state"
    );
    expect(
      (result.stateHistory?.orders[0].events[2].metadata?.adapterPaperExecutionEvidence as Record<string, unknown>)
        ?.privateKey
    ).toBe("[redacted]");
  });

  test("rejects portfolio paper order state history metadata that leaks adapter secrets", async () => {
    const stateHistory = {
      schemaVersion: 1 as const,
      baseRunId: "portfolio-run-1",
      batchId: "portfolio-paper-batch-1",
      portfolioName: "A-share state basket",
      generatedAt: "2026-05-27T09:00:00+00:00",
      mode: "portfolio_paper_order_state_history" as const,
      summary: {
        orderCount: 1,
        eventCount: 1,
        approvedOrders: 1,
        rejectedOrders: 0,
        filledOrders: 1,
        liveBlockedEvents: 0,
        stateCounts: { simulation_filled: 1 }
      },
      orders: [
        {
          batchId: "portfolio-paper-batch-1",
          baseRunId: "portfolio-run-1",
          portfolioName: "A-share state basket",
          orderId: "portfolio-paper-run-a-buy",
          symbol: "600000",
          sourceRunId: "run-a",
          side: "buy" as const,
          quantity: 1000,
          notionalValue: 9200,
          originalStatus: "pending_review" as const,
          riskStatus: "passed" as const,
          currentState: "simulation_filled",
          currentStateLabel: "Paper simulation filled",
          paperOnly: true,
          liveExecutionBlocked: true,
          events: [
            {
              eventId: "portfolio-paper-batch-1:portfolio-paper-run-a-buy:simulation_filled:4",
              batchId: "portfolio-paper-batch-1",
              baseRunId: "portfolio-run-1",
              orderId: "portfolio-paper-run-a-buy",
              timestamp: "2026-05-27T08:46:00+00:00",
              state: "simulation_filled",
              label: "Paper simulation filled",
              actor: "operator-a",
              source: "paper-simulator",
              reason: "Filled.",
              metadata: {
                simulationId: "sim-state",
                adapterPaperExecutionEvidence: {
                  privateKey: "raw-private-key-should-not-leak"
                }
              },
              paperOnly: true,
              liveExecutionBlocked: true
            }
          ]
        }
      ],
      paperOnly: true,
      liveExecutionBlocked: true
    };
    const result = await loadPortfolioPaperOrderStateHistory(
      "/",
      "portfolio-run-1",
      "portfolio-paper-batch-1",
      async () => ({ ok: true, json: async () => ({ stateHistory }) })
    );

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid portfolio paper order state history contract");
    expect(result.stateHistory).toBeUndefined();
  });

  test("loads golden path status from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadGoldenPathStatus(
      "http://127.0.0.1:8765/",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => ({
            goldenPath: {
              schemaVersion: 1,
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              status: "blocked",
              currentStepId: "paper-execution",
              latestRunId: "run-golden",
              nextAction: {
                id: "submit-paper-order",
                label: "Submit paper order",
                targetWorkspace: "execution",
                reason: "Audited AI evidence is ready, but no paper execution is bound."
              },
              summary: {
                totalSteps: 6,
                passedSteps: 4,
                reviewSteps: 1,
                blockedSteps: 1,
                currentStepLabel: "Paper execution",
                nextActionId: "submit-paper-order",
                liveTradingAllowed: false
              },
              workspaces: [
                {
                  id: "research",
                  label: "Research",
                  status: "ready",
                  current: false,
                  stepIds: ["research-run"],
                  reason: "Audit run is bound.",
                  actionId: null
                },
                {
                  id: "execution",
                  label: "Execution",
                  status: "needs_run",
                  current: true,
                  stepIds: ["paper-execution"],
                  reason: "Submit a paper execution before promotion.",
                  actionId: "submit-paper-order"
                }
              ],
              runbook: [
                {
                  stepId: "market-data",
                  label: "Market data",
                  workspaceId: "market",
                  status: "passed",
                  current: false,
                  passed: true,
                  detail: "Fresh cache exists.",
                  blocker: null,
                  actionId: null,
                  actionLabel: null
                },
                {
                  stepId: "paper-execution",
                  label: "Paper execution",
                  workspaceId: "execution",
                  status: "review",
                  current: true,
                  passed: false,
                  detail: "Submit a paper execution before promotion.",
                  blocker: "Submit a paper execution before promotion.",
                  actionId: "submit-paper-order",
                  actionLabel: "Submit paper order"
                }
              ],
              steps: [
                {
                  id: "market-data",
                  label: "Market data",
                  status: "passed",
                  passed: true,
                  detail: "Fresh cache exists.",
                  actionId: null
                },
                {
                  id: "paper-execution",
                  label: "Paper execution",
                  status: "review",
                  passed: false,
                  detail: "Submit a paper execution before promotion.",
                  actionId: "submit-paper-order"
                }
              ]
            }
          })
        };
      }
    );

    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/golden-path/status?market=ashare&symbol=600000&timeframe=1d"
    ]);
    expect(result.source).toBe("core");
    expect(result.goldenPath?.currentStepId).toBe("paper-execution");
    expect(result.goldenPath?.nextAction?.targetWorkspace).toBe("execution");
    expect(result.goldenPath?.summary.passedSteps).toBe(4);
    expect(result.goldenPath?.workspaces.find((workspace) => workspace.id === "execution")?.status).toBe("needs_run");
    expect(result.goldenPath?.runbook.find((item) => item.stepId === "paper-execution")?.workspaceId).toBe("execution");
  });

  test("rejects stale golden path status payloads without a runbook", async () => {
    const result = await loadGoldenPathStatus(
      "http://127.0.0.1:8765/",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      async () => ({
        ok: true,
        json: async () => ({
          goldenPath: {
            schemaVersion: 1,
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            status: "blocked",
            currentStepId: "research-run",
            latestRunId: null,
            nextAction: {
              id: "run-pipeline",
              label: "Run research pipeline",
              targetWorkspace: "research",
              reason: "Run the research pipeline."
            },
            summary: {
              totalSteps: 6,
              passedSteps: 1,
              reviewSteps: 0,
              blockedSteps: 5,
              currentStepLabel: "Audited research run",
              nextActionId: "run-pipeline",
              liveTradingAllowed: false
            },
            workspaces: [],
            steps: []
          }
        })
      })
    );

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid golden path status contract");
  });

  test("validates the active strategy draft through the Python core", async () => {
    const calls: Array<{ url: string; body?: string }> = [];
    const result = await validateStrategySnapshot(
      "http://127.0.0.1:8765/",
      {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategy: {
          name: "Validated SMA plan",
          entry: "Close > SMA8",
          exit: "Close < SMA21",
          position: "40% cap per instrument",
          risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
        }
      },
      async (url, init) => {
        calls.push({ url, body: String(init?.body ?? "") });
        return {
          ok: true,
          json: async () => ({
            validation: {
              status: "review",
              revision: "rev-validated",
              gates: [
                {
                  id: "schema",
                  label: "Strategy schema",
                  value: "SMA8 / SMA21",
                  detail: "Entry and exit conditions are structured.",
                  status: "passed",
                  tone: "positive"
                },
                {
                  id: "audit",
                  label: "Audit evidence",
                  value: "needs run",
                  detail: "Run Pipeline to bind this draft to a reproducible audit run.",
                  status: "review",
                  tone: "warning"
                }
              ],
              strategyConfig: {
                name: "Validated SMA plan",
                revision: "rev-validated",
                market: "ashare",
                symbols: ["600000"],
                timeframe: "1d",
                version: 1,
                entryConditions: [{ kind: "close_above_sma", params: { window: 8 } }],
                exitConditions: [{ kind: "close_below_sma", params: { window: 21 } }],
                risk: {
                  positionPct: 0.4,
                  stopLossPct: 0.06,
                  takeProfitPct: 0.12,
                  maxDrawdownPct: 0.09
                }
              }
            }
          })
        };
      }
    );

    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/strategies/validate");
    expect(JSON.parse(calls[0].body ?? "{}").strategy.entry).toBe("Close > SMA8");
    expect(result.source).toBe("core");
    expect(result.validation?.status).toBe("review");
    expect(result.validation?.gates[0]).toMatchObject({ id: "schema", status: "passed" });
  });

  test("surfaces blocked strategy save validation from the Python core", async () => {
    const result = await saveStrategySnapshot(
      "http://127.0.0.1:8765/",
      {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategy: {
          name: "Blocked SMA plan",
          entry: "Close > SMA8",
          exit: "Close < SMA21",
          position: "40% cap per instrument",
          risk: "Stop -6%, drawdown guard 9%, paper only"
        }
      },
      async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          error: "strategy_not_ready",
          detail: "strategy_preflight_blocked",
          validation: {
            status: "blocked",
            revision: "rev-blocked",
            gates: [
              {
                id: "risk",
                label: "Risk controls",
                value: "pending",
                detail: "Position sizing and risk guardrails must be explicit.",
                status: "blocked",
                tone: "risk"
              }
            ],
            strategyConfig: {
              name: "Blocked SMA plan",
              revision: "rev-blocked",
              market: "ashare",
              symbols: ["600000"],
              timeframe: "1d",
              version: 1,
              entryConditions: [{ kind: "close_above_sma", params: { window: 8 } }],
              exitConditions: [{ kind: "close_below_sma", params: { window: 21 } }],
              risk: {
                positionPct: 0.4,
                stopLossPct: 0.06,
                takeProfitPct: 0.18,
                maxDrawdownPct: 0.09
              }
            }
          }
        })
      })
    );

    expect(result.source).toBe("core");
    expect(result.strategy).toBeUndefined();
    expect(result.error).toBe("strategy_not_ready");
    expect(result.validation?.status).toBe("blocked");
    expect(result.validation?.gates[0]).toMatchObject({ id: "risk", status: "blocked" });
  });

  test("normalizes older core workspace navigation to the workflow-first contract", async () => {
    const remoteWorkspace = {
      ...buildTerminalWorkspace(),
      quantLoop: [
        { id: "idea", label: "Idea Lab", status: "active" },
        { id: "data", label: "Data & Factor", status: "ready" },
        { id: "strategy", label: "Strategy Builder", status: "ready" },
        { id: "backtest", label: "Backtest Lab", status: "ready" },
        { id: "agent-review", label: "Agent Review", status: "ready" },
        { id: "paper", label: "Paper Trading", status: "ready" },
        { id: "broker", label: "Broker Center", status: "locked" }
      ]
    };

    const result = await loadTerminalWorkspace("http://127.0.0.1:8765", async () => ({
      ok: true,
      json: async () => remoteWorkspace
    }));

    expect(result.workspace.quantLoop.map((step) => step.id)).toEqual([
      "research",
      "strategy",
      "backtest",
      "agent-review",
      "paper"
    ]);
    expect(result.workspace.quantLoop.map((step) => step.label)).toEqual([
      "Market Research",
      "Strategy Lab",
      "Backtest Review",
      "Agent Review",
      "Paper Trading"
    ]);
  });

  test("falls back to the bundled workspace when the Python core is unavailable", async () => {
    const result = await loadTerminalWorkspace("http://127.0.0.1:8765", async () => {
      throw new Error("offline");
    });

    expect(result.source).toBe("fallback");
    expect(result.statusLabel).toBe("Offline snapshot");
    expect(result.workspace.execution.liveEnabled).toBe(false);
    expect(result.workspace.selectedInstrument.symbol).toBe("600000");
  });

  test("loads settings status without exposing secret values", async () => {
    const calls: string[] = [];
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => ({
          settings: {
            schemaVersion: 1,
            generatedAt: "2026-05-31T09:00:00+08:00",
            dataSources: [
              {
                market: "us",
                label: "US equities",
                quoteSource: "finnhub / yfinance",
                klineSource: "yahoo / yfinance",
                status: "ready",
                optionalKeyName: "FINNHUB_API_KEY",
                optionalKeyConfigured: true,
                note: "Secret values stay local."
              }
            ],
            marketDataAdapters: [
              {
                id: "akshare-ohlcv",
                market: "ashare",
                adapter: "AkShareMarketDataAdapter",
                provider: "akshare",
                status: "ready",
                route: "public_ohlcv",
                capabilities: ["stock_zh_a_hist", "stock_zh_a_hist_min_em"],
                timeframes: ["1d", "1m", "5m", "15m", "30m", "60m"],
                requiresApiKey: false,
                requiresTradingKey: false,
                cacheScope: "ohlcv",
                cacheDiagnostics: {
                  freshness: "fresh",
                  contextCount: 1,
                  rowCount: 500,
                  latestTimestamp: "2026-05-29T00:00:00+00:00",
                  freshnessSummary: { fresh: 1, stale: 0, empty: 0 }
                },
                externalTelemetry: {
                  status: "ok",
                  dependency: "akshare",
                  dependencyAvailable: true,
                  lastError: null,
                  retryState: "idle",
                  checkedAt: "2026-06-14T08:00:00+00:00",
                  installGuidance: sampleAkshareInstallGuidance,
                  lastProviderError: null,
                  providerHealth: sampleOkProviderHealth
                },
                note: "Public A-share OHLCV."
              },
              {
                id: "yfinance-ohlcv",
                market: "us",
                adapter: "YFinanceMarketDataAdapter",
                provider: "yfinance",
                status: "degraded",
                route: "public_ohlcv",
                capabilities: ["Ticker.history"],
                timeframes: ["1d", "1m", "5m", "15m", "30m", "60m"],
                requiresApiKey: false,
                requiresTradingKey: false,
                cacheScope: "ohlcv",
                cacheDiagnostics: {
                  freshness: "empty",
                  contextCount: 0,
                  rowCount: 0,
                  latestTimestamp: null,
                  freshnessSummary: { fresh: 0, stale: 0, empty: 0 }
                },
                externalTelemetry: {
                  status: "degraded",
                  dependency: "yfinance",
                  dependencyAvailable: true,
                  lastError: "Yahoo chart timed out",
                  retryState: "provider_error",
                  checkedAt: "2026-06-14T08:00:00+00:00",
                  installGuidance: sampleYfinanceInstallGuidance,
                  lastProviderError: sampleYfinanceProviderError,
                  providerHealth: sampleCooldownProviderHealth
                },
                note: "Public US OHLCV."
              }
            ],
            cache: {
              engine: "sqlite",
              path: "data/market.sqlite",
              exists: true,
              scope: "ohlcv",
              rowCount: 1280,
              contextCount: 12,
              latestTimestamp: "2026-05-29T00:00:00+00:00",
              freshnessSummary: {
                fresh: 1,
                stale: 0,
                empty: 0
              },
              contexts: [
                {
                  market: "ashare",
                  symbol: "600000",
                  timeframe: "1d",
                  rowCount: 500,
                  startTimestamp: "2025-09-12T00:00:00+08:00",
                  endTimestamp: "2026-05-29T00:00:00+08:00",
                  freshness: "fresh",
                  ageHours: 48
                }
              ]
            },
            executionAdapters: [
              {
                id: "paper-local",
                market: "multi",
                adapter: "Paper Trading",
                route: "paper",
                status: "paper_ready",
                certification: "local",
                liveTradingAllowed: false,
                note: "Paper only."
              }
            ],
            safety: {
              liveTradingAllowed: false,
              requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
            }
          }
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/settings/status"]);
    expect(result.source).toBe("core");
    expect(result.settings?.dataSources[0]).toMatchObject({
      market: "us",
      optionalKeyName: "FINNHUB_API_KEY",
      optionalKeyConfigured: true
    });
    expect(result.settings?.marketDataAdapters?.[0]).toMatchObject({
      id: "akshare-ohlcv",
      adapter: "AkShareMarketDataAdapter",
      capabilities: ["stock_zh_a_hist", "stock_zh_a_hist_min_em"],
      requiresTradingKey: false,
      cacheDiagnostics: {
        freshness: "fresh",
        contextCount: 1,
        rowCount: 500,
        latestTimestamp: "2026-05-29T00:00:00+00:00"
      },
      externalTelemetry: {
        status: "ok",
        dependency: "akshare",
        dependencyAvailable: true
      }
    });
    expect(result.settings?.marketDataAdapters?.[1]).toMatchObject({
      id: "yfinance-ohlcv",
      provider: "yfinance",
      route: "public_ohlcv",
      cacheDiagnostics: {
        freshness: "empty",
        contextCount: 0,
        rowCount: 0
      },
      externalTelemetry: {
        status: "degraded",
        dependency: "yfinance",
        retryState: "provider_error",
        installGuidance: {
          dockerBuildArg: "INSTALL_DATA_DEPS=true",
          packageInstallCommand: "pip install yfinance"
        },
        providerHealth: {
          status: "cooldown",
          recentErrorCount: 3,
          retryAfterSeconds: 900,
          affectedSymbols: ["AAPL", "MSFT"],
          categorySummary: {
            rate_limit: 1,
            dependency: 0,
            network: 1,
            upstream: 0,
            incomplete_data: 1,
            unknown: 0
          },
          dominantCategory: "rate_limit",
          windowSummary: {
            oneHour: {
              errorCount: 3,
              dominantCategory: "rate_limit"
            },
            twentyFourHours: {
              errorCount: 3,
              dominantCategory: "rate_limit"
            },
            sevenDays: {
              errorCount: 3,
              dominantCategory: "rate_limit"
            }
          }
        },
        lastProviderError: {
          source: "yfinance-fallback",
          context: "market-klines",
          category: "network",
          message: "Yahoo chart timed out"
        }
      }
    });
    expect((result.settings?.cache as unknown as { rowCount?: number }).rowCount).toBe(1280);
    expect((result.settings?.cache as unknown as { contextCount?: number }).contextCount).toBe(12);
    expect((result.settings?.cache as unknown as { latestTimestamp?: string | null }).latestTimestamp).toBe(
      "2026-05-29T00:00:00+00:00"
    );
    expect((result.settings?.cache as unknown as { contexts?: unknown[] }).contexts?.[0]).toMatchObject({
      market: "ashare",
      symbol: "600000",
      rowCount: 500
    });
    expect((result.settings?.cache as unknown as { contexts?: Array<{ freshness?: string; ageHours?: number }> }).contexts?.[0]).toMatchObject({
      freshness: "fresh",
      ageHours: 48
    });
    expect((result.settings?.cache as unknown as { freshnessSummary?: { fresh?: number } }).freshnessSummary?.fresh).toBe(1);
    expect(JSON.stringify(result.settings)).not.toContain("secret-finnhub-token");
  });

  test("loads execution adapter state ledger from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadExecutionAdapterLedger("http://127.0.0.1:8765/", async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => ({
          adapterLedger: {
            schemaVersion: 1,
            generatedAt: "2026-06-07T09:31:00+00:00",
            mode: "execution_adapter_state_ledger",
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"],
            summary: {
              adapterCount: 2,
              liveAdapterCount: 1,
              certifiedLiveAdapters: 0,
              paperReadyAdapters: 1,
              blockedLiveAdapters: 1,
              configRequiredAdapters: 0,
              requiredGateCount: 3
            },
            adapters: [
              {
                id: "paper-local",
                market: "multi",
                adapter: "Paper Trading",
                route: "paper",
                status: "paper_ready",
                certification: "local",
                currentState: "paper_ready",
                liveTradingAllowed: false,
                note: "Paper only.",
                nextStep: "Use paper execution before live certification.",
                gates: [
                  {
                    id: "paper-order-risk",
                    label: "Paper risk check",
                    passed: true,
                    reason: "Local risk checks are available."
                  }
                ],
                events: [
                  {
                    eventId: "adapter-ledger:paper-local:paper_ready",
                    adapterId: "paper-local",
                    timestamp: "2026-06-07T09:31:00+00:00",
                    state: "paper_ready",
                    label: "Paper adapter ready",
                    actor: "execution-safety",
                    source: "settings-status",
                    reason: "Paper execution is available locally.",
                    liveTradingAllowed: false
                  }
                ]
              },
              {
                id: "ashare-live",
                market: "ashare",
                adapter: "A-share broker adapter",
                route: "live",
                status: "blocked",
                certification: "interface_only",
                currentState: "blocked",
                liveTradingAllowed: false,
                note: "Real A-share trading stays blocked.",
                nextStep: "Keep live trading blocked until certification passes.",
                gates: [
                  {
                    id: "adapter-certified",
                    label: "Adapter certified",
                    passed: false,
                    reason: "No certified A-share broker API is connected."
                  }
                ],
                events: [
                  {
                    eventId: "adapter-ledger:ashare-live:live_blocked",
                    adapterId: "ashare-live",
                    timestamp: "2026-06-07T09:31:00+00:00",
                    state: "live_blocked",
                    label: "Live route blocked",
                    actor: "execution-safety",
                    source: "settings-status",
                    reason: "Live execution remains blocked until adapter certification, risk approval, and human confirmation pass.",
                    liveTradingAllowed: false
                  }
                ]
              }
            ]
          }
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/execution/adapter-ledger"]);
    expect(result.source).toBe("core");
    expect(result.adapterLedger?.summary.blockedLiveAdapters).toBe(1);
    expect(result.adapterLedger?.adapters[1].events[0]).toMatchObject({
      adapterId: "ashare-live",
      state: "live_blocked",
      liveTradingAllowed: false
    });
    expect(JSON.stringify(result.adapterLedger)).not.toContain("secret");
  });

  test("loads ccxt sandbox adapter health without accepting raw secret metadata", async () => {
    const calls: string[] = [];
    const cleanResult = await loadExecutionAdapterHealthProbe(
      "http://127.0.0.1:8765/",
      {
        adapterId: "ccxt-live",
        exchange: "binance",
        productionRouteReviewId: "execution-adapter-production-route-review-ccxt-live"
      },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => ({
            adapterHealthProbe: {
              schemaVersion: 1,
              probeId: "execution-adapter-health-ccxt-live-1",
              adapterId: "ccxt-live",
              provider: "ccxt",
              exchangeId: "binance",
              mode: "sandbox",
              status: "review",
              generatedAt: "2026-06-14T08:00:00+00:00",
              checks: [
                {
                  id: "markets-loaded",
                  label: "markets loaded",
                  status: "passed",
                  detail: "Loaded 1200 markets.",
                  latencyMs: 12
                },
                {
                  id: "account-sync",
                  label: "account sync",
                  status: "review",
                  detail: "Sandbox credentials missing.",
                  latencyMs: null
                }
              ],
              capabilities: {
                sandboxMode: true,
                loadMarkets: true,
                fetchStatus: true,
                fetchTime: true,
                fetchBalance: true,
                createOrder: true
              },
              credentials: {
                apiKeyConfigured: false,
                apiKeySource: null,
                secretConfigured: false,
                secretSource: null,
                passwordConfigured: false,
                passwordSource: null
              },
              marketCount: 1200,
              exchangeStatus: "ok",
              serverTimeMs: 1780000000000,
              accountSyncState: "credentials_missing",
              blockedReasons: [],
              metadata: {
                readOnly: true,
                productionRouteReviewId: "execution-adapter-production-route-review-ccxt-live",
                productionRouteReviewStatus: "route_review_recorded"
              },
              productionRouteReviewId: "execution-adapter-production-route-review-ccxt-live",
              productionRouteReviewStatus: "route_review_recorded",
              routeReview: {
                productionRouteReviewId: "execution-adapter-production-route-review-ccxt-live",
                status: "route_review_recorded",
                adapterId: "ccxt-live",
                market: "crypto",
                route: "live",
                maintenanceWindowId: "window-ccxt-health-route-review",
                requiredEnvVars: ["CCXT_API_KEY", "CCXT_API_SECRET"],
                liveTradingAllowed: false,
                paperOnly: true
              },
              paperOnly: true,
              liveTradingAllowed: false,
              orderRoutingEnabled: false
            }
          })
        };
      }
    );

    const rejectedResult = await loadExecutionAdapterHealthProbe(
      "http://127.0.0.1:8765/",
      {
        adapterId: "ccxt-live",
        exchange: "binance"
      },
      async () => ({
        ok: true,
        json: async () => ({
          adapterHealthProbe: {
            schemaVersion: 1,
            probeId: "execution-adapter-health-ccxt-live-secret",
            adapterId: "ccxt-live",
            provider: "ccxt",
            exchangeId: "binance",
            mode: "sandbox",
            status: "ready",
            generatedAt: "2026-06-14T08:00:00+00:00",
            checks: [],
            capabilities: {},
            credentials: {
              apiKeyConfigured: true,
              apiKeySource: "CCXT_API_KEY",
              secretConfigured: true,
              secretSource: "CCXT_SECRET",
              passwordConfigured: false,
              passwordSource: null
            },
            marketCount: 1,
            exchangeStatus: "ok",
            serverTimeMs: 1780000000000,
            accountSyncState: "ready",
            blockedReasons: [],
            metadata: { apiSecret: "raw-secret-should-not-leak" },
            paperOnly: true,
            liveTradingAllowed: false,
            orderRoutingEnabled: false
          }
        })
      })
    );

    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-health/ccxt-sandbox?adapterId=ccxt-live&exchange=binance&productionRouteReviewId=execution-adapter-production-route-review-ccxt-live"
    ]);
    expect(cleanResult.source).toBe("core");
    expect(cleanResult.adapterHealthProbe?.adapterId).toBe("ccxt-live");
    expect(cleanResult.adapterHealthProbe?.status).toBe("review");
    expect(cleanResult.adapterHealthProbe?.paperOnly).toBe(true);
    expect(cleanResult.adapterHealthProbe?.liveTradingAllowed).toBe(false);
    expect(cleanResult.adapterHealthProbe?.orderRoutingEnabled).toBe(false);
    expect(cleanResult.adapterHealthProbe?.productionRouteReviewId).toBe(
      "execution-adapter-production-route-review-ccxt-live"
    );
    expect(cleanResult.adapterHealthProbe?.routeReview?.maintenanceWindowId).toBe("window-ccxt-health-route-review");
    expect(rejectedResult.source).toBe("fallback");
    expect(rejectedResult.adapterHealthProbe).toBeUndefined();
  });

  test("records and loads execution adapter certification evidence without secrets", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const certification = {
      schemaVersion: 1,
      certificationId: "adapter-certification-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "blocked",
      operator: "local-operator",
      startedAt: "2026-06-08T08:00:00+00:00",
      completedAt: "2026-06-08T08:01:00+00:00",
      checks: [
        {
          id: "sandbox-credentials",
          label: "Sandbox credentials",
          status: "passed",
          detail: "Sandbox references are present.",
          metadata: { apiKey: "[redacted]", keyId: "paper-us-key" }
        },
        {
          id: "controlled-restart",
          label: "Controlled restart",
          status: "blocked",
          detail: "Controlled restart evidence is missing.",
          metadata: { token: "[redacted]", restartWindow: "manual" }
        }
      ],
      metadata: { source: "settings-panel", password: "[redacted]" },
      summary: {
        checkCount: 2,
        checkStatusCounts: { blocked: 1, passed: 1 },
        passedChecks: 1,
        blockedChecks: 1,
        failedChecks: 0,
        reviewChecks: 0
      },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (init?.method === "POST") {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            adapterCertification: certification,
            auditEvent: {
              schemaVersion: 1,
              eventId: "adapter-certification-us-live",
              eventType: "execution_adapter_certification",
              runId: "",
              createdAt: "2026-06-08T08:01:00+00:00",
              stage: "execution-adapter-certification",
              source: "execution-adapter-ledger",
              summary: "us-live certification recorded as blocked.",
              detail: "Adapter certification evidence is stored without secrets and live trading remains blocked.",
              metadata: {
                adapterId: "us-live",
                status: "blocked",
                liveTradingAllowed: false
              }
            }
          })
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ adapterCertifications: [certification] })
      };
    };

    const recordResult = await recordExecutionAdapterCertification(
      "/",
      {
        adapterId: "us-live",
        market: "us",
        route: "live",
        operator: "local-operator",
        checks: [
          {
            id: "sandbox-credentials",
            label: "Sandbox credentials",
            status: "passed",
            detail: "Sandbox references are present.",
            metadata: { credentialRef: "paper-us-key" }
          },
          {
            id: "controlled-restart",
            label: "Controlled restart",
            status: "blocked",
            detail: "Controlled restart evidence is missing.",
            metadata: { restartWindow: "manual" }
          }
        ],
        metadata: { source: "settings-panel" }
      },
      fetcher
    );
    const loadResult = await loadExecutionAdapterCertifications("/", "us-live", fetcher, 3);

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-certifications",
      "GET /api/execution/adapter-certifications?adapterId=us-live&limit=3"
    ]);
    expect(calls[0].body).toMatchObject({
      adapterId: "us-live",
      route: "live",
      checks: [{ id: "sandbox-credentials" }, { id: "controlled-restart" }]
    });
    expect(JSON.stringify(calls[0].body)).not.toContain("apiKey");
    expect(recordResult.source).toBe("core");
    expect(recordResult.adapterCertification?.status).toBe("blocked");
    expect(recordResult.adapterCertification?.summary.checkStatusCounts).toEqual({ blocked: 1, passed: 1 });
    expect(recordResult.auditEvent?.eventType).toBe("execution_adapter_certification");
    expect(loadResult.adapterCertifications[0].adapterId).toBe("us-live");
    expect(loadResult.adapterCertifications[0].liveTradingAllowed).toBe(false);
    expect(JSON.stringify(recordResult)).not.toContain("secret-key-should-not-leak");
    expect(JSON.stringify(loadResult)).not.toContain("token-should-not-leak");
  });

  test("records execution adapter certification apply preflight results", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const certificationApply = {
      schemaVersion: 1,
      applyId: "execution-adapter-certification-apply-us-live",
      certificationId: "adapter-certification-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "blocked",
      operator: "local-operator",
      generatedAt: "2026-06-08T08:05:00+00:00",
      applyMode: "manual_secret_store",
      restartRequired: true,
      requiredConfirmations: [
        {
          id: "secret-reference-stored",
          label: "Secret-store reference is saved outside the UI",
          status: "missing"
        },
        {
          id: "controlled-restart-window-approved",
          label: "Controlled restart window is approved",
          status: "missing"
        },
        {
          id: "operator-reviewed-certification",
          label: "Operator reviewed certification evidence and restart impact",
          status: "missing"
        }
      ],
      blockedReasons: [
        "secret_reference_not_confirmed",
        "controlled_restart_not_confirmed",
        "operator_review_not_confirmed"
      ],
      metadata: { source: "settings-panel", secretStorePath: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return {
        ok: false,
        status: 409,
        json: async () => ({
          certificationApply,
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-certification-apply-us-live",
            eventType: "execution_adapter_certification_apply",
            runId: "",
            createdAt: "2026-06-08T08:05:00+00:00",
            stage: "execution-adapter-certification-apply",
            source: "execution-adapter-ledger",
            summary: "us-live certification apply preflight recorded as blocked.",
            detail: "Certification apply preflight records manual confirmations without secrets.",
            metadata: {
              certificationId: "adapter-certification-us-live",
              adapterId: "us-live",
              status: "blocked",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterCertificationApplyUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-certifications/apply"
    );

    const result = await recordExecutionAdapterCertificationApply(
      "/",
      {
        certificationId: "adapter-certification-us-live",
        operator: "local-operator",
        confirmations: {
          secretReferenceStored: false,
          controlledRestartWindowApproved: false,
          operatorReviewedCertification: false
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-certifications/apply"
    ]);
    expect(calls[0]?.body).toEqual({
      certificationId: "adapter-certification-us-live",
      operator: "local-operator",
      confirmations: {
        secretReferenceStored: false,
        controlledRestartWindowApproved: false,
        operatorReviewedCertification: false
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.certificationApply?.status).toBe("blocked");
    expect(result.certificationApply?.blockedReasons).toContain("controlled_restart_not_confirmed");
    expect(result.auditEvent?.eventType).toBe("execution_adapter_certification_apply");
  });

  test("loads execution adapter certification apply history from the local core", async () => {
    const calls: string[] = [];
    const certificationApply = {
      schemaVersion: 1,
      applyId: "execution-adapter-certification-apply-us-live-ready",
      certificationId: "adapter-certification-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "ready_for_restart",
      operator: "local-operator",
      generatedAt: "2026-06-08T08:06:00+00:00",
      applyMode: "manual_secret_store",
      restartRequired: true,
      requiredConfirmations: [
        {
          id: "secret-reference-stored",
          label: "Secret-store reference is saved outside the UI",
          status: "confirmed"
        },
        {
          id: "controlled-restart-window-approved",
          label: "Controlled restart window is approved",
          status: "confirmed"
        },
        {
          id: "operator-reviewed-certification",
          label: "Operator reviewed certification evidence and restart impact",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", secretStorePath: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterCertificationApplies(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ certificationApplies: [certificationApply] })
        };
      },
      5
    );

    expect(buildExecutionAdapterCertificationAppliesUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-certifications/applies?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-certifications/applies?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.certificationApplies).toHaveLength(1);
    expect(result.certificationApplies[0].status).toBe("ready_for_restart");
    expect(result.certificationApplies[0].liveTradingAllowed).toBe(false);
    expect(JSON.stringify(result)).not.toContain("secret-key-should-not-leak");
  });

  test("records controlled restart evidence without enabling live routing", async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : null
      });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          controlledRestartEvidence: {
            schemaVersion: 1,
            evidenceId: "execution-adapter-controlled-restart-us-live",
            applyId: "execution-adapter-certification-apply-us-live-ready",
            certificationId: "adapter-certification-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "evidence_recorded",
            operator: "restart-operator",
            recordedAt: "2026-06-08T08:10:00+00:00",
            evidenceMode: "manual_controlled_restart",
            restartRequired: true,
            requiredConfirmations: [
              {
                id: "restart-window-executed",
                label: "Controlled restart window was executed",
                status: "confirmed"
              },
              {
                id: "rollback-plan-confirmed",
                label: "Rollback plan is available and confirmed",
                status: "confirmed"
              },
              {
                id: "post-restart-validation-passed",
                label: "Post-restart validation passed",
                status: "confirmed"
              },
              {
                id: "operator-reviewed-restart-logs",
                label: "Operator reviewed restart logs and adapter status",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { restartWindowId: "window-us-live-1", privateKey: "[redacted]" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-controlled-restart-us-live",
            eventType: "execution_adapter_controlled_restart_evidence",
            runId: "",
            createdAt: "2026-06-08T08:10:00+00:00",
            stage: "execution-adapter-controlled-restart",
            source: "execution-adapter-ledger",
            summary: "us-live controlled restart evidence recorded as evidence_recorded.",
            detail: "Controlled restart evidence is paper-only.",
            metadata: {
              evidenceId: "execution-adapter-controlled-restart-us-live",
              adapterId: "us-live",
              status: "evidence_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterControlledRestartEvidenceUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-certifications/restart-evidence"
    );

    const result = await recordExecutionAdapterControlledRestartEvidence(
      "/",
      {
        applyId: "execution-adapter-certification-apply-us-live-ready",
        operator: "restart-operator",
        confirmations: {
          restartWindowExecuted: true,
          rollbackPlanConfirmed: true,
          postRestartValidationPassed: true,
          operatorReviewedRestartLogs: true
        },
        metadata: { restartWindowId: "window-us-live-1" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-certifications/restart-evidence"
    ]);
    expect(calls[0]?.body).toEqual({
      applyId: "execution-adapter-certification-apply-us-live-ready",
      operator: "restart-operator",
      confirmations: {
        restartWindowExecuted: true,
        rollbackPlanConfirmed: true,
        postRestartValidationPassed: true,
        operatorReviewedRestartLogs: true
      },
      metadata: { restartWindowId: "window-us-live-1" }
    });
    expect(result.source).toBe("core");
    expect(result.controlledRestartEvidence?.status).toBe("evidence_recorded");
    expect(result.controlledRestartEvidence?.liveTradingAllowed).toBe(false);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_controlled_restart_evidence");
  });

  test("loads controlled restart evidence history from the local core", async () => {
    const calls: string[] = [];
    const controlledRestartEvidence = {
      schemaVersion: 1,
      evidenceId: "execution-adapter-controlled-restart-us-live",
      applyId: "execution-adapter-certification-apply-us-live-ready",
      certificationId: "adapter-certification-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "evidence_recorded",
      operator: "restart-operator",
      recordedAt: "2026-06-08T08:10:00+00:00",
      evidenceMode: "manual_controlled_restart",
      restartRequired: true,
      requiredConfirmations: [
        {
          id: "restart-window-executed",
          label: "Controlled restart window was executed",
          status: "confirmed"
        },
        {
          id: "rollback-plan-confirmed",
          label: "Rollback plan is available and confirmed",
          status: "confirmed"
        },
        {
          id: "post-restart-validation-passed",
          label: "Post-restart validation passed",
          status: "confirmed"
        },
        {
          id: "operator-reviewed-restart-logs",
          label: "Operator reviewed restart logs and adapter status",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { restartWindowId: "window-us-live-1", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterControlledRestartEvidence(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ controlledRestartEvidence: [controlledRestartEvidence] })
        };
      },
      5
    );

    expect(buildExecutionAdapterControlledRestartEvidenceHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-certifications/restart-evidence?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-certifications/restart-evidence?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.controlledRestartEvidence).toHaveLength(1);
    expect(result.controlledRestartEvidence[0].status).toBe("evidence_recorded");
    expect(result.controlledRestartEvidence[0].liveTradingAllowed).toBe(false);
    expect(JSON.stringify(result)).not.toContain("restart-secret-should-not-leak");
  });

  test("records restart acceptance evidence without enabling live trading", async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          restartAcceptance: {
            schemaVersion: 1,
            acceptanceId: "execution-adapter-restart-acceptance-us-live",
            evidenceId: "execution-adapter-controlled-restart-us-live",
            applyId: "execution-adapter-certification-apply-us-live-ready",
            certificationId: "adapter-certification-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "acceptance_recorded",
            operator: "acceptance-operator",
            recordedAt: "2026-06-08T08:15:00+00:00",
            acceptanceMode: "manual_post_restart_acceptance",
            restartRequired: true,
            requiredConfirmations: [
              {
                id: "core-health-checked",
                label: "Local core health was checked after restart",
                status: "confirmed"
              },
              {
                id: "settings-reload-observed",
                label: "Adapter settings reload was observed",
                status: "confirmed"
              },
              {
                id: "paper-route-handshake-passed",
                label: "Sandbox or paper route handshake passed",
                status: "confirmed"
              },
              {
                id: "emergency-stop-armed",
                label: "Emergency stop remains armed",
                status: "confirmed"
              },
              {
                id: "account-sync-dry-run-passed",
                label: "Account sync dry-run passed",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { probeId: "post-restart-acceptance-1", privateKey: "[redacted]" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-restart-acceptance-us-live",
            eventType: "execution_adapter_restart_acceptance",
            runId: "",
            createdAt: "2026-06-08T08:15:00+00:00",
            stage: "execution-adapter-restart-acceptance",
            source: "execution-adapter-ledger",
            summary: "us-live restart acceptance recorded as acceptance_recorded.",
            detail: "Post-restart acceptance is paper-only.",
            metadata: {
              acceptanceId: "execution-adapter-restart-acceptance-us-live",
              adapterId: "us-live",
              status: "acceptance_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterRestartAcceptanceUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-certifications/restart-acceptance"
    );

    const result = await recordExecutionAdapterRestartAcceptance(
      "/",
      {
        evidenceId: "execution-adapter-controlled-restart-us-live",
        operator: "acceptance-operator",
        confirmations: {
          coreHealthChecked: true,
          settingsReloadObserved: true,
          paperRouteHandshakePassed: true,
          emergencyStopArmed: true,
          accountSyncDryRunPassed: true
        },
        metadata: { probeId: "post-restart-acceptance-1" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-certifications/restart-acceptance"
    ]);
    expect(calls[0]?.body).toEqual({
      evidenceId: "execution-adapter-controlled-restart-us-live",
      operator: "acceptance-operator",
      confirmations: {
        coreHealthChecked: true,
        settingsReloadObserved: true,
        paperRouteHandshakePassed: true,
        emergencyStopArmed: true,
        accountSyncDryRunPassed: true
      },
      metadata: { probeId: "post-restart-acceptance-1" }
    });
    expect(result.source).toBe("core");
    expect(result.restartAcceptance?.status).toBe("acceptance_recorded");
    expect(result.restartAcceptance?.liveTradingAllowed).toBe(false);
    expect(result.restartAcceptance?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_restart_acceptance");
  });

  test("loads restart acceptance history from the local core", async () => {
    const calls: string[] = [];
    const restartAcceptance = {
      schemaVersion: 1,
      acceptanceId: "execution-adapter-restart-acceptance-us-live",
      evidenceId: "execution-adapter-controlled-restart-us-live",
      applyId: "execution-adapter-certification-apply-us-live-ready",
      certificationId: "adapter-certification-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "acceptance_recorded",
      operator: "acceptance-operator",
      recordedAt: "2026-06-08T08:15:00+00:00",
      acceptanceMode: "manual_post_restart_acceptance",
      restartRequired: true,
      requiredConfirmations: [
        {
          id: "core-health-checked",
          label: "Local core health was checked after restart",
          status: "confirmed"
        },
        {
          id: "settings-reload-observed",
          label: "Adapter settings reload was observed",
          status: "confirmed"
        },
        {
          id: "paper-route-handshake-passed",
          label: "Sandbox or paper route handshake passed",
          status: "confirmed"
        },
        {
          id: "emergency-stop-armed",
          label: "Emergency stop remains armed",
          status: "confirmed"
        },
        {
          id: "account-sync-dry-run-passed",
          label: "Account sync dry-run passed",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { probeId: "post-restart-acceptance-1", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterRestartAcceptances(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ restartAcceptances: [restartAcceptance] })
        };
      },
      5
    );

    expect(buildExecutionAdapterRestartAcceptanceHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-certifications/restart-acceptance?adapterId=us-live&limit=5"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-certifications/restart-acceptance?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.restartAcceptances).toHaveLength(1);
    expect(result.restartAcceptances[0].status).toBe("acceptance_recorded");
    expect(result.restartAcceptances[0].liveTradingAllowed).toBe(false);
    expect(JSON.stringify(result)).not.toContain("acceptance-secret-should-not-leak");
  });

  test("records execution adapter secret references without raw secret values", async () => {
    const calls: { url: string; method?: string; body?: unknown }[] = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method,
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterSecretReference: {
            schemaVersion: 1,
            referenceId: "execution-adapter-secret-reference-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "reference_recorded",
            operator: "settings-panel",
            recordedAt: "2026-06-09T08:00:00+00:00",
            referenceName: "us-live/alpaca-sandbox",
            backend: "local-secret-store",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            requiredConfirmations: [
              {
                id: "reference-created-outside-ui",
                label: "Secret reference was created outside this UI",
                status: "confirmed"
              },
              {
                id: "operator-verified-fingerprint",
                label: "Operator verified the stored secret fingerprint",
                status: "confirmed"
              },
              {
                id: "rotation-plan-documented",
                label: "Secret rotation plan is documented",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel", secret: "[redacted]" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-secret-reference-us-live",
            eventType: "execution_adapter_secret_reference",
            runId: "",
            createdAt: "2026-06-09T08:00:00+00:00",
            stage: "execution-adapter-secret-reference",
            source: "execution-adapter-ledger",
            summary: "us-live secret reference recorded as reference_recorded.",
            detail: "Secret reference is paper-only.",
            metadata: {
              referenceId: "execution-adapter-secret-reference-us-live",
              adapterId: "us-live",
              status: "reference_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterSecretReferenceUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-secret-references"
    );

    const result = await recordExecutionAdapterSecretReference(
      "/",
      {
        adapterId: "us-live",
        market: "us",
        route: "live",
        operator: "settings-panel",
        referenceName: "us-live/alpaca-sandbox",
        backend: "local-secret-store",
        requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
        confirmations: {
          referenceCreatedOutsideUi: true,
          operatorVerifiedFingerprint: true,
          rotationPlanDocumented: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-secret-references"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      market: "us",
      route: "live",
      operator: "settings-panel",
      referenceName: "us-live/alpaca-sandbox",
      backend: "local-secret-store",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      confirmations: {
        referenceCreatedOutsideUi: true,
        operatorVerifiedFingerprint: true,
        rotationPlanDocumented: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterSecretReference?.status).toBe("reference_recorded");
    expect(result.adapterSecretReference?.liveTradingAllowed).toBe(false);
    expect(result.adapterSecretReference?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_secret_reference");
  });

  test("loads secret reference history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const secretReference = {
      schemaVersion: 1,
      referenceId: "execution-adapter-secret-reference-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "reference_recorded",
      operator: "settings-panel",
      recordedAt: "2026-06-09T08:00:00+00:00",
      referenceName: "us-live/alpaca-sandbox",
      backend: "local-secret-store",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      requiredConfirmations: [
        {
          id: "reference-created-outside-ui",
          label: "Secret reference was created outside this UI",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", privateKey: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterSecretReferences(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterSecretReferences: [secretReference] })
        };
      },
      5
    );

    expect(buildExecutionAdapterSecretReferenceHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-secret-references?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-secret-references?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterSecretReferences).toHaveLength(1);
    expect(result.adapterSecretReferences[0].status).toBe("reference_recorded");
    expect(result.adapterSecretReferences[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterSecretReferences(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterSecretReferences: [
            {
              ...secretReference,
              metadata: { privateKey: "secret-reference-private-key-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterSecretReferences).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("secret-reference-private-key-should-not-leak");
  });

  test("records secret materialization manifests against a reference without enabling live trading", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterSecretMaterialization: {
            schemaVersion: 1,
            materializationId: "execution-adapter-secret-materialization-us-live",
            referenceId: "execution-adapter-secret-reference-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "manifest_recorded",
            operator: "settings-panel",
            recordedAt: "2026-06-09T08:10:00+00:00",
            materializationMode: "local_secret_store_manifest",
            referenceName: "us-live/alpaca-sandbox",
            backend: "local-secret-store",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            requiredConfirmations: [
              {
                id: "local-secret-store-write-verified",
                label: "Local secret-store write was verified",
                status: "confirmed"
              },
              {
                id: "no-raw-secret-in-payload",
                label: "No raw secret is present in this payload",
                status: "confirmed"
              },
              {
                id: "env-binding-plan-documented",
                label: "Environment binding plan is documented",
                status: "confirmed"
              },
              {
                id: "rollback-plan-documented",
                label: "Rollback plan is documented",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-secret-materialization-us-live",
            eventType: "execution_adapter_secret_materialization",
            runId: "",
            createdAt: "2026-06-09T08:10:00+00:00",
            stage: "execution-adapter-secret-materialization",
            source: "execution-adapter-ledger",
            summary: "us-live secret materialization manifest recorded as manifest_recorded.",
            detail: "Secret materialization is paper-only.",
            metadata: {
              materializationId: "execution-adapter-secret-materialization-us-live",
              adapterId: "us-live",
              status: "manifest_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterSecretMaterializationUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-secret-materializations"
    );

    const result = await recordExecutionAdapterSecretMaterialization(
      "/",
      {
        adapterId: "us-live",
        referenceId: "execution-adapter-secret-reference-us-live",
        operator: "settings-panel",
        manifestPath: "local-secret-store://us-live/alpaca-sandbox",
        confirmations: {
          localSecretStoreWriteVerified: true,
          noRawSecretInPayload: true,
          envBindingPlanDocumented: true,
          rollbackPlanDocumented: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-secret-materializations"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      referenceId: "execution-adapter-secret-reference-us-live",
      operator: "settings-panel",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      confirmations: {
        localSecretStoreWriteVerified: true,
        noRawSecretInPayload: true,
        envBindingPlanDocumented: true,
        rollbackPlanDocumented: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterSecretMaterialization?.status).toBe("manifest_recorded");
    expect(result.adapterSecretMaterialization?.referenceId).toBe("execution-adapter-secret-reference-us-live");
    expect(result.adapterSecretMaterialization?.liveTradingAllowed).toBe(false);
    expect(result.adapterSecretMaterialization?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_secret_materialization");
  });

  test("loads secret materialization history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const materialization = {
      schemaVersion: 1,
      materializationId: "execution-adapter-secret-materialization-us-live",
      referenceId: "execution-adapter-secret-reference-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "manifest_recorded",
      operator: "settings-panel",
      recordedAt: "2026-06-09T08:10:00+00:00",
      materializationMode: "local_secret_store_manifest",
      referenceName: "us-live/alpaca-sandbox",
      backend: "local-secret-store",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      requiredConfirmations: [
        {
          id: "local-secret-store-write-verified",
          label: "Local secret-store write was verified",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", privateKey: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterSecretMaterializations(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterSecretMaterializations: [materialization] })
        };
      },
      5
    );

    expect(buildExecutionAdapterSecretMaterializationHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-secret-materializations?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-secret-materializations?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterSecretMaterializations).toHaveLength(1);
    expect(result.adapterSecretMaterializations[0].status).toBe("manifest_recorded");
    expect(result.adapterSecretMaterializations[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterSecretMaterializations(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterSecretMaterializations: [
            {
              ...materialization,
              metadata: { privateKey: "secret-materialization-private-key-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterSecretMaterializations).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("secret-materialization-private-key-should-not-leak");
  });

  test("records secret manifest validation without returning raw secrets", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterSecretManifestValidation: {
            schemaVersion: 1,
            validationId: "execution-adapter-secret-manifest-validation-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            referenceId: "execution-adapter-secret-reference-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "validated",
            operator: "settings-panel",
            recordedAt: "2026-06-09T08:12:00+00:00",
            validationMode: "local_secret_store_manifest_readonly",
            referenceName: "us-live/alpaca-sandbox",
            backend: "local-secret-store",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            fingerprint: "sha256:validated-manifest",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            coveredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            blockedReasons: [],
            manifestSummary: {
              manifestExists: true,
              manifestJsonValid: true,
              requiredEnvVarCount: 2,
              coveredEnvVarCount: 2,
              rawValuesReturned: false
            },
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-secret-manifest-validation-us-live",
            eventType: "execution_adapter_secret_manifest_validation",
            runId: "",
            createdAt: "2026-06-09T08:12:00+00:00",
            stage: "execution-adapter-secret-manifest-validation",
            source: "execution-adapter-ledger",
            summary: "us-live secret manifest validated as validated.",
            detail: "Secret manifest validation is paper-only.",
            metadata: {
              validationId: "execution-adapter-secret-manifest-validation-us-live",
              adapterId: "us-live",
              status: "validated",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterSecretManifestValidationUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-secret-manifest-validations"
    );

    const result = await recordExecutionAdapterSecretManifestValidation(
      "/",
      {
        adapterId: "us-live",
        materializationId: "execution-adapter-secret-materialization-us-live",
        operator: "settings-panel",
        manifestPath: "local-secret-store://us-live/alpaca-sandbox",
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-secret-manifest-validations"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      operator: "settings-panel",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterSecretManifestValidation?.status).toBe("validated");
    expect(result.adapterSecretManifestValidation?.fingerprint).toBe("sha256:validated-manifest");
    expect(result.adapterSecretManifestValidation?.coveredEnvVars).toEqual(["ALPACA_API_KEY", "ALPACA_API_SECRET"]);
    expect(result.adapterSecretManifestValidation?.liveTradingAllowed).toBe(false);
    expect(result.adapterSecretManifestValidation?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_secret_manifest_validation");
  });

  test("loads secret manifest validation history and rejects unredacted summaries", async () => {
    const calls: string[] = [];
    const validation = {
      schemaVersion: 1,
      validationId: "execution-adapter-secret-manifest-validation-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      referenceId: "execution-adapter-secret-reference-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "validated",
      operator: "settings-panel",
      recordedAt: "2026-06-09T08:12:00+00:00",
      validationMode: "local_secret_store_manifest_readonly",
      referenceName: "us-live/alpaca-sandbox",
      backend: "local-secret-store",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      fingerprint: "sha256:validated-manifest",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      coveredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      blockedReasons: [],
      manifestSummary: {
        manifestExists: true,
        manifestJsonValid: true,
        requiredEnvVarCount: 2,
        coveredEnvVarCount: 2,
        rawValuesReturned: false
      },
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterSecretManifestValidations(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterSecretManifestValidations: [validation] })
        };
      },
      5
    );

    expect(buildExecutionAdapterSecretManifestValidationHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-secret-manifest-validations?adapterId=us-live&limit=5"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-secret-manifest-validations?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterSecretManifestValidations).toHaveLength(1);
    expect(result.adapterSecretManifestValidations[0].status).toBe("validated");
    expect(result.adapterSecretManifestValidations[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterSecretManifestValidations(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterSecretManifestValidations: [
            {
              ...validation,
              manifestSummary: { secret: "secret-manifest-summary-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterSecretManifestValidations).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("secret-manifest-summary-should-not-leak");
  });

  test("records environment binding evidence after secret materialization without enabling live trading", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterEnvironmentBinding: {
            schemaVersion: 1,
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "binding_recorded",
            operator: "settings-panel",
            recordedAt: "2026-06-09T08:20:00+00:00",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            requiredConfirmations: [
              {
                id: "runtime-env-mapping-verified",
                label: "Runtime environment mapping was verified",
                status: "confirmed"
              },
              {
                id: "config-reload-plan-documented",
                label: "Config reload plan is documented",
                status: "confirmed"
              },
              {
                id: "no-raw-secret-in-payload",
                label: "No raw secret is present in this payload",
                status: "confirmed"
              },
              {
                id: "rollback-snapshot-recorded",
                label: "Rollback snapshot is recorded",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-environment-binding-us-live",
            eventType: "execution_adapter_environment_binding",
            runId: "",
            createdAt: "2026-06-09T08:20:00+00:00",
            stage: "execution-adapter-environment-binding",
            source: "execution-adapter-ledger",
            summary: "us-live environment binding recorded as binding_recorded.",
            detail: "Environment binding is paper-only.",
            metadata: {
              bindingId: "execution-adapter-environment-binding-us-live",
              adapterId: "us-live",
              status: "binding_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterEnvironmentBindingUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-environment-bindings"
    );

    const result = await recordExecutionAdapterEnvironmentBinding(
      "/",
      {
        adapterId: "us-live",
        manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
        operator: "settings-panel",
        bindingMode: "container_env_reference",
        confirmations: {
          runtimeEnvMappingVerified: true,
          configReloadPlanDocumented: true,
          noRawSecretInPayload: true,
          rollbackSnapshotRecorded: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-environment-bindings"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      operator: "settings-panel",
      bindingMode: "container_env_reference",
      confirmations: {
        runtimeEnvMappingVerified: true,
        configReloadPlanDocumented: true,
        noRawSecretInPayload: true,
        rollbackSnapshotRecorded: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterEnvironmentBinding?.status).toBe("binding_recorded");
    expect(result.adapterEnvironmentBinding?.materializationId).toBe("execution-adapter-secret-materialization-us-live");
    expect(result.adapterEnvironmentBinding?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterEnvironmentBinding?.liveTradingAllowed).toBe(false);
    expect(result.adapterEnvironmentBinding?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_environment_binding");
  });

  test("loads environment binding history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const binding = {
      schemaVersion: 1,
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "binding_recorded",
      operator: "settings-panel",
      recordedAt: "2026-06-09T08:20:00+00:00",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      requiredConfirmations: [
        {
          id: "runtime-env-mapping-verified",
          label: "Runtime environment mapping was verified",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", privateKey: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterEnvironmentBindings(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterEnvironmentBindings: [binding] })
        };
      },
      5
    );

    expect(buildExecutionAdapterEnvironmentBindingHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-environment-bindings?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-environment-bindings?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterEnvironmentBindings).toHaveLength(1);
    expect(result.adapterEnvironmentBindings[0].status).toBe("binding_recorded");
    expect(result.adapterEnvironmentBindings[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterEnvironmentBindings(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterEnvironmentBindings: [
            {
              ...binding,
              metadata: { privateKey: "environment-binding-private-key-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterEnvironmentBindings).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("environment-binding-private-key-should-not-leak");
  });

  test("records runtime reload plan evidence after environment binding without enabling live trading", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterRuntimeReloadPlan: {
            schemaVersion: 1,
            planId: "execution-adapter-runtime-reload-plan-us-live",
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "plan_recorded",
            operator: "settings-panel",
            recordedAt: "2026-06-09T08:30:00+00:00",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "window-us-live-1",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            requiredConfirmations: [
              {
                id: "maintenance-window-approved",
                label: "Maintenance window is approved",
                status: "confirmed"
              },
              {
                id: "health-baseline-captured",
                label: "Pre-reload health baseline was captured",
                status: "confirmed"
              },
              {
                id: "config-diff-reviewed",
                label: "Configuration diff was reviewed",
                status: "confirmed"
              },
              {
                id: "post-reload-smoke-plan-documented",
                label: "Post-reload smoke plan is documented",
                status: "confirmed"
              },
              {
                id: "rollback-owner-assigned",
                label: "Rollback trigger owner is assigned",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-runtime-reload-plan-us-live",
            eventType: "execution_adapter_runtime_reload_plan",
            runId: "",
            createdAt: "2026-06-09T08:30:00+00:00",
            stage: "execution-adapter-runtime-reload-plan",
            source: "execution-adapter-ledger",
            summary: "us-live runtime reload plan recorded as plan_recorded.",
            detail: "Runtime reload plan is paper-only.",
            metadata: {
              planId: "execution-adapter-runtime-reload-plan-us-live",
              manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
              adapterId: "us-live",
              status: "plan_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterRuntimeReloadPlanUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-runtime-reload-plans"
    );

    const result = await recordExecutionAdapterRuntimeReloadPlan(
      "/",
      {
        adapterId: "us-live",
        bindingId: "execution-adapter-environment-binding-us-live",
        operator: "settings-panel",
        reloadMode: "manual_container_reload_plan",
        maintenanceWindowId: "window-us-live-1",
        confirmations: {
          maintenanceWindowApproved: true,
          healthBaselineCaptured: true,
          configDiffReviewed: true,
          postReloadSmokePlanDocumented: true,
          rollbackOwnerAssigned: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-runtime-reload-plans"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      operator: "settings-panel",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      confirmations: {
        maintenanceWindowApproved: true,
        healthBaselineCaptured: true,
        configDiffReviewed: true,
        postReloadSmokePlanDocumented: true,
        rollbackOwnerAssigned: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterRuntimeReloadPlan?.status).toBe("plan_recorded");
    expect(result.adapterRuntimeReloadPlan?.bindingId).toBe("execution-adapter-environment-binding-us-live");
    expect(result.adapterRuntimeReloadPlan?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterRuntimeReloadPlan?.liveTradingAllowed).toBe(false);
    expect(result.adapterRuntimeReloadPlan?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_runtime_reload_plan");
  });

  test("loads runtime reload plan history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const plan = {
      schemaVersion: 1,
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "plan_recorded",
      operator: "settings-panel",
      recordedAt: "2026-06-09T08:30:00+00:00",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      requiredConfirmations: [
        {
          id: "maintenance-window-approved",
          label: "Maintenance window is approved",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", privateKey: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterRuntimeReloadPlans(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterRuntimeReloadPlans: [plan] })
        };
      },
      5
    );

    expect(buildExecutionAdapterRuntimeReloadPlanHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-runtime-reload-plans?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-runtime-reload-plans?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterRuntimeReloadPlans).toHaveLength(1);
    expect(result.adapterRuntimeReloadPlans[0].status).toBe("plan_recorded");
    expect(result.adapterRuntimeReloadPlans[0].manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterRuntimeReloadPlans[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterRuntimeReloadPlans(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterRuntimeReloadPlans: [
            {
              ...plan,
              metadata: { privateKey: "runtime-reload-private-key-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterRuntimeReloadPlans).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("runtime-reload-private-key-should-not-leak");
  });

  test("records runtime reload execution evidence after a reload plan without enabling live trading", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterRuntimeReloadExecution: {
            schemaVersion: 1,
            executionId: "execution-adapter-runtime-reload-execution-us-live",
            planId: "execution-adapter-runtime-reload-plan-us-live",
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "execution_recorded",
            operator: "settings-panel",
            recordedAt: "2026-06-09T08:45:00+00:00",
            executionMode: "manual_controlled_reload",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "window-us-live-1",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            requiredConfirmations: [
              {
                id: "pre-reload-health-verified",
                label: "Pre-reload health is verified",
                status: "confirmed"
              },
              {
                id: "reload-action-recorded",
                label: "Reload action is recorded",
                status: "confirmed"
              },
              {
                id: "post-reload-smoke-passed",
                label: "Post-reload smoke passed",
                status: "confirmed"
              },
              {
                id: "rollback-readiness-confirmed",
                label: "Rollback readiness is confirmed",
                status: "confirmed"
              },
              {
                id: "operator-confirmed-live-blocked",
                label: "Operator confirmed live routing remains blocked",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-runtime-reload-execution-us-live",
            eventType: "execution_adapter_runtime_reload_execution",
            runId: "",
            createdAt: "2026-06-09T08:45:00+00:00",
            stage: "execution-adapter-runtime-reload-execution",
            source: "execution-adapter-ledger",
            summary: "us-live runtime reload execution recorded as execution_recorded.",
            detail: "Runtime reload execution evidence is paper-only.",
            metadata: {
              executionId: "execution-adapter-runtime-reload-execution-us-live",
              planId: "execution-adapter-runtime-reload-plan-us-live",
              manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
              adapterId: "us-live",
              status: "execution_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterRuntimeReloadExecutionUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-runtime-reload-executions"
    );

    const result = await recordExecutionAdapterRuntimeReloadExecution(
      "/",
      {
        adapterId: "us-live",
        planId: "execution-adapter-runtime-reload-plan-us-live",
        operator: "settings-panel",
        executionMode: "manual_controlled_reload",
        confirmations: {
          preReloadHealthVerified: true,
          reloadActionRecorded: true,
          postReloadSmokePassed: true,
          rollbackReadinessConfirmed: true,
          operatorConfirmedLiveBlocked: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-runtime-reload-executions"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      operator: "settings-panel",
      executionMode: "manual_controlled_reload",
      confirmations: {
        preReloadHealthVerified: true,
        reloadActionRecorded: true,
        postReloadSmokePassed: true,
        rollbackReadinessConfirmed: true,
        operatorConfirmedLiveBlocked: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterRuntimeReloadExecution?.status).toBe("execution_recorded");
    expect(result.adapterRuntimeReloadExecution?.planId).toBe("execution-adapter-runtime-reload-plan-us-live");
    expect(result.adapterRuntimeReloadExecution?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterRuntimeReloadExecution?.liveTradingAllowed).toBe(false);
    expect(result.adapterRuntimeReloadExecution?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_runtime_reload_execution");
  });

  test("loads runtime reload execution history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const execution = {
      schemaVersion: 1,
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "execution_recorded",
      operator: "settings-panel",
      recordedAt: "2026-06-09T08:45:00+00:00",
      executionMode: "manual_controlled_reload",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      requiredConfirmations: [
        {
          id: "pre-reload-health-verified",
          label: "Pre-reload health is verified",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterRuntimeReloadExecutions(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterRuntimeReloadExecutions: [execution] })
        };
      },
      5
    );

    expect(buildExecutionAdapterRuntimeReloadExecutionHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-runtime-reload-executions?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-runtime-reload-executions?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterRuntimeReloadExecutions).toHaveLength(1);
    expect(result.adapterRuntimeReloadExecutions[0].status).toBe("execution_recorded");
    expect(result.adapterRuntimeReloadExecutions[0].manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterRuntimeReloadExecutions[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterRuntimeReloadExecutions(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterRuntimeReloadExecutions: [
            {
              ...execution,
              metadata: { token: "runtime-reload-execution-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterRuntimeReloadExecutions).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("runtime-reload-execution-token-should-not-leak");
  });

  test("records runtime reload acceptance after execution without enabling live trading", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterRuntimeReloadAcceptance: {
            schemaVersion: 1,
            acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
            executionId: "execution-adapter-runtime-reload-execution-us-live",
            planId: "execution-adapter-runtime-reload-plan-us-live",
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "acceptance_recorded",
            operator: "settings-panel",
            recordedAt: "2026-06-09T09:00:00+00:00",
            acceptanceMode: "manual_runtime_reload_acceptance",
            executionMode: "manual_controlled_reload",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "window-us-live-1",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            requiredConfirmations: [
              {
                id: "execution-evidence-reviewed",
                label: "Runtime reload execution evidence is reviewed",
                status: "confirmed"
              },
              {
                id: "post-reload-health-verified",
                label: "Post-reload health is verified",
                status: "confirmed"
              },
              {
                id: "adapter-handshake-verified",
                label: "Adapter handshake is verified",
                status: "confirmed"
              },
              {
                id: "kill-switch-still-enabled",
                label: "Kill switch remains enabled",
                status: "confirmed"
              },
              {
                id: "operator-confirmed-live-blocked",
                label: "Operator confirmed live routing remains blocked",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-runtime-reload-acceptance-us-live",
            eventType: "execution_adapter_runtime_reload_acceptance",
            runId: "",
            createdAt: "2026-06-09T09:00:00+00:00",
            stage: "execution-adapter-runtime-reload-acceptance",
            source: "execution-adapter-ledger",
            summary: "us-live runtime reload acceptance recorded as acceptance_recorded.",
            detail: "Runtime reload acceptance is paper-only.",
            metadata: {
              acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
              executionId: "execution-adapter-runtime-reload-execution-us-live",
              planId: "execution-adapter-runtime-reload-plan-us-live",
              manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
              adapterId: "us-live",
              status: "acceptance_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterRuntimeReloadAcceptanceUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-runtime-reload-acceptances"
    );

    const result = await recordExecutionAdapterRuntimeReloadAcceptance(
      "/",
      {
        adapterId: "us-live",
        executionId: "execution-adapter-runtime-reload-execution-us-live",
        operator: "settings-panel",
        acceptanceMode: "manual_runtime_reload_acceptance",
        confirmations: {
          executionEvidenceReviewed: true,
          postReloadHealthVerified: true,
          adapterHandshakeVerified: true,
          killSwitchStillEnabled: true,
          operatorConfirmedLiveBlocked: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-runtime-reload-acceptances"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      operator: "settings-panel",
      acceptanceMode: "manual_runtime_reload_acceptance",
      confirmations: {
        executionEvidenceReviewed: true,
        postReloadHealthVerified: true,
        adapterHandshakeVerified: true,
        killSwitchStillEnabled: true,
        operatorConfirmedLiveBlocked: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterRuntimeReloadAcceptance?.status).toBe("acceptance_recorded");
    expect(result.adapterRuntimeReloadAcceptance?.executionId).toBe(
      "execution-adapter-runtime-reload-execution-us-live"
    );
    expect(result.adapterRuntimeReloadAcceptance?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterRuntimeReloadAcceptance?.liveTradingAllowed).toBe(false);
    expect(result.adapterRuntimeReloadAcceptance?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_runtime_reload_acceptance");
  });

  test("loads runtime reload acceptance history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const acceptance = {
      schemaVersion: 1,
      acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "acceptance_recorded",
      operator: "settings-panel",
      recordedAt: "2026-06-09T09:00:00+00:00",
      acceptanceMode: "manual_runtime_reload_acceptance",
      executionMode: "manual_controlled_reload",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      requiredConfirmations: [
        {
          id: "execution-evidence-reviewed",
          label: "Runtime reload execution evidence is reviewed",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterRuntimeReloadAcceptances(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterRuntimeReloadAcceptances: [acceptance] })
        };
      },
      5
    );

    expect(buildExecutionAdapterRuntimeReloadAcceptanceHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-runtime-reload-acceptances?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-runtime-reload-acceptances?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterRuntimeReloadAcceptances).toHaveLength(1);
    expect(result.adapterRuntimeReloadAcceptances[0].status).toBe("acceptance_recorded");
    expect(result.adapterRuntimeReloadAcceptances[0].manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterRuntimeReloadAcceptances[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterRuntimeReloadAcceptances(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterRuntimeReloadAcceptances: [
            {
              ...acceptance,
              metadata: { token: "runtime-reload-acceptance-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterRuntimeReloadAcceptances).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("runtime-reload-acceptance-token-should-not-leak");
  });

  test("records adapter orchestration dry run after final acceptance without enabling live trading", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterOrchestrationDryRun: {
            schemaVersion: 1,
            dryRunId: "execution-adapter-orchestration-dry-run-us-live",
            acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
            executionId: "execution-adapter-runtime-reload-execution-us-live",
            planId: "execution-adapter-runtime-reload-plan-us-live",
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "dry_run_recorded",
            operator: "settings-panel",
            recordedAt: "2026-06-09T10:00:00+00:00",
            orchestrationMode: "manual_adapter_orchestration_dry_run",
            acceptanceMode: "manual_runtime_reload_acceptance",
            executionMode: "manual_controlled_reload",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "window-us-live-1",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            requiredConfirmations: [
              {
                id: "accepted-chain-reviewed",
                label: "Runtime reload acceptance chain was reviewed",
                status: "confirmed"
              },
              {
                id: "sandbox-handshake-dry-run-passed",
                label: "Sandbox or paper adapter handshake dry run passed",
                status: "confirmed"
              },
              {
                id: "order-schema-dry-run-passed",
                label: "Order schema dry run passed without submission",
                status: "confirmed"
              },
              {
                id: "account-sync-dry-run-passed",
                label: "Account sync dry run passed without broker mutation",
                status: "confirmed"
              },
              {
                id: "operator-confirmed-no-live-orders",
                label: "Operator confirmed no live orders were routed",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-orchestration-dry-run-us-live",
            eventType: "execution_adapter_orchestration_dry_run",
            runId: "",
            createdAt: "2026-06-09T10:00:00+00:00",
            stage: "execution-adapter-orchestration-dry-run",
            source: "execution-adapter-ledger",
            summary: "us-live adapter orchestration dry run recorded as dry_run_recorded.",
            detail: "Adapter orchestration dry run is paper-only.",
            metadata: {
              dryRunId: "execution-adapter-orchestration-dry-run-us-live",
              acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
              manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
              adapterId: "us-live",
              status: "dry_run_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterOrchestrationDryRunUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-orchestration-dry-runs"
    );

    const result = await recordExecutionAdapterOrchestrationDryRun(
      "/",
      {
        adapterId: "us-live",
        acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
        operator: "settings-panel",
        orchestrationMode: "manual_adapter_orchestration_dry_run",
        confirmations: {
          acceptedChainReviewed: true,
          sandboxHandshakeDryRunPassed: true,
          orderSchemaDryRunPassed: true,
          accountSyncDryRunPassed: true,
          operatorConfirmedNoLiveOrders: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-orchestration-dry-runs"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
      operator: "settings-panel",
      orchestrationMode: "manual_adapter_orchestration_dry_run",
      confirmations: {
        acceptedChainReviewed: true,
        sandboxHandshakeDryRunPassed: true,
        orderSchemaDryRunPassed: true,
        accountSyncDryRunPassed: true,
        operatorConfirmedNoLiveOrders: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterOrchestrationDryRun?.status).toBe("dry_run_recorded");
    expect(result.adapterOrchestrationDryRun?.acceptanceId).toBe(
      "execution-adapter-runtime-reload-acceptance-us-live"
    );
    expect(result.adapterOrchestrationDryRun?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterOrchestrationDryRun?.liveTradingAllowed).toBe(false);
    expect(result.adapterOrchestrationDryRun?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_orchestration_dry_run");
  });

  test("loads adapter orchestration dry run history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const dryRun = {
      schemaVersion: 1,
      dryRunId: "execution-adapter-orchestration-dry-run-us-live",
      acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "dry_run_recorded",
      operator: "settings-panel",
      recordedAt: "2026-06-09T10:00:00+00:00",
      orchestrationMode: "manual_adapter_orchestration_dry_run",
      acceptanceMode: "manual_runtime_reload_acceptance",
      executionMode: "manual_controlled_reload",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      requiredConfirmations: [
        {
          id: "accepted-chain-reviewed",
          label: "Runtime reload acceptance chain was reviewed",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterOrchestrationDryRuns(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterOrchestrationDryRuns: [dryRun] })
        };
      },
      5
    );

    expect(buildExecutionAdapterOrchestrationDryRunHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-orchestration-dry-runs?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-orchestration-dry-runs?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterOrchestrationDryRuns).toHaveLength(1);
    expect(result.adapterOrchestrationDryRuns[0].status).toBe("dry_run_recorded");
    expect(result.adapterOrchestrationDryRuns[0].manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterOrchestrationDryRuns[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterOrchestrationDryRuns(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterOrchestrationDryRuns: [
            {
              ...dryRun,
              metadata: { token: "orchestration-dry-run-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterOrchestrationDryRuns).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("orchestration-dry-run-token-should-not-leak");
  });

  test("records adapter orchestration execution after dry run without enabling live trading", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterOrchestrationExecution: {
            schemaVersion: 1,
            orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
            dryRunId: "execution-adapter-orchestration-dry-run-us-live",
            acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
            executionId: "execution-adapter-runtime-reload-execution-us-live",
            planId: "execution-adapter-runtime-reload-plan-us-live",
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "execution_recorded",
            operator: "settings-panel",
            recordedAt: "2026-06-09T10:00:00+00:00",
            orchestrationExecutionMode: "manual_adapter_orchestration_execution",
            orchestrationMode: "manual_adapter_orchestration_dry_run",
            acceptanceMode: "manual_runtime_reload_acceptance",
            executionMode: "manual_controlled_reload",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "window-us-live-1",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            requiredConfirmations: [
              { id: "dry-run-evidence-reviewed", label: "Adapter orchestration dry-run evidence was reviewed", status: "confirmed" },
              { id: "sandbox-route-locked", label: "Sandbox or paper route remains locked for the handoff", status: "confirmed" },
              { id: "kill-switch-armed", label: "Kill switch remains armed during orchestration", status: "confirmed" },
              { id: "idempotency-key-recorded", label: "Idempotency key or replay guard was recorded", status: "confirmed" },
              { id: "operator-confirmed-no-capital", label: "Operator confirmed no capital was routed", status: "confirmed" }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-orchestration-execution-us-live",
            eventType: "execution_adapter_orchestration_execution",
            runId: "",
            createdAt: "2026-06-09T10:00:00+00:00",
            stage: "execution-adapter-orchestration-execution",
            source: "execution-adapter-ledger",
            summary: "us-live adapter orchestration execution recorded as execution_recorded.",
            detail: "Adapter orchestration execution is paper-only.",
            metadata: {
              orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
              dryRunId: "execution-adapter-orchestration-dry-run-us-live",
              manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
              adapterId: "us-live",
              status: "execution_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterOrchestrationExecutionUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-orchestration-executions"
    );

    const result = await recordExecutionAdapterOrchestrationExecution(
      "/",
      {
        adapterId: "us-live",
        dryRunId: "execution-adapter-orchestration-dry-run-us-live",
        operator: "settings-panel",
        orchestrationExecutionMode: "manual_adapter_orchestration_execution",
        confirmations: {
          dryRunEvidenceReviewed: true,
          sandboxRouteLocked: true,
          killSwitchArmed: true,
          idempotencyKeyRecorded: true,
          operatorConfirmedNoCapital: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-orchestration-executions"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      dryRunId: "execution-adapter-orchestration-dry-run-us-live",
      operator: "settings-panel",
      orchestrationExecutionMode: "manual_adapter_orchestration_execution",
      confirmations: {
        dryRunEvidenceReviewed: true,
        sandboxRouteLocked: true,
        killSwitchArmed: true,
        idempotencyKeyRecorded: true,
        operatorConfirmedNoCapital: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterOrchestrationExecution?.status).toBe("execution_recorded");
    expect(result.adapterOrchestrationExecution?.dryRunId).toBe("execution-adapter-orchestration-dry-run-us-live");
    expect(result.adapterOrchestrationExecution?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterOrchestrationExecution?.liveTradingAllowed).toBe(false);
    expect(result.adapterOrchestrationExecution?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_orchestration_execution");
  });

  test("loads adapter orchestration execution history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const execution = {
      schemaVersion: 1,
      orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
      dryRunId: "execution-adapter-orchestration-dry-run-us-live",
      acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "execution_recorded",
      operator: "settings-panel",
      recordedAt: "2026-06-09T10:00:00+00:00",
      orchestrationExecutionMode: "manual_adapter_orchestration_execution",
      orchestrationMode: "manual_adapter_orchestration_dry_run",
      acceptanceMode: "manual_runtime_reload_acceptance",
      executionMode: "manual_controlled_reload",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      requiredConfirmations: [
        { id: "dry-run-evidence-reviewed", label: "Adapter orchestration dry-run evidence was reviewed", status: "confirmed" }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterOrchestrationExecutions(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterOrchestrationExecutions: [execution] })
        };
      },
      5
    );

    expect(buildExecutionAdapterOrchestrationExecutionHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-orchestration-executions?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-orchestration-executions?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterOrchestrationExecutions).toHaveLength(1);
    expect(result.adapterOrchestrationExecutions[0].status).toBe("execution_recorded");
    expect(result.adapterOrchestrationExecutions[0].manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterOrchestrationExecutions[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterOrchestrationExecutions(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterOrchestrationExecutions: [
            {
              ...execution,
              metadata: { token: "orchestration-execution-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterOrchestrationExecutions).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("orchestration-execution-token-should-not-leak");
  });

  test("records adapter human confirmation after orchestration execution without enabling live trading", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterHumanConfirmation: {
            schemaVersion: 1,
            humanConfirmationId: "execution-adapter-human-confirmation-us-live",
            orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
            dryRunId: "execution-adapter-orchestration-dry-run-us-live",
            acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
            executionId: "execution-adapter-runtime-reload-execution-us-live",
            planId: "execution-adapter-runtime-reload-plan-us-live",
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "confirmation_recorded",
            operator: "human-operator",
            recordedAt: "2026-06-09T10:05:00+00:00",
            confirmationMode: "manual_final_human_confirmation",
            orchestrationExecutionMode: "manual_adapter_orchestration_execution",
            orchestrationMode: "manual_adapter_orchestration_dry_run",
            acceptanceMode: "manual_runtime_reload_acceptance",
            executionMode: "manual_controlled_reload",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "window-us-live-1",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            requiredConfirmations: [
              {
                id: "orchestration-execution-reviewed",
                label: "Controlled adapter orchestration execution evidence was reviewed",
                status: "confirmed"
              },
              {
                id: "risk-approval-still-valid",
                label: "Risk approval remains valid for the selected strategy and adapter",
                status: "confirmed"
              },
              {
                id: "paper-execution-reviewed",
                label: "Paper execution result was reviewed before final confirmation",
                status: "confirmed"
              },
              { id: "kill-switch-ready", label: "Kill switch and rollback contacts are ready", status: "confirmed" },
              {
                id: "operator-confirmed-final-boundary",
                label: "Operator confirmed no automatic live routing is enabled by this record",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-human-confirmation-us-live",
            eventType: "execution_adapter_human_confirmation",
            runId: "",
            createdAt: "2026-06-09T10:05:00+00:00",
            stage: "execution-adapter-human-confirmation",
            source: "execution-adapter-ledger",
            summary: "us-live adapter human confirmation recorded as confirmation_recorded.",
            detail: "Adapter human confirmation is paper-only.",
            metadata: {
              humanConfirmationId: "execution-adapter-human-confirmation-us-live",
              orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
              manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
              adapterId: "us-live",
              status: "confirmation_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterHumanConfirmationUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-human-confirmations"
    );

    const result = await recordExecutionAdapterHumanConfirmation(
      "/",
      {
        adapterId: "us-live",
        orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
        operator: "human-operator",
        confirmationMode: "manual_final_human_confirmation",
        confirmations: {
          orchestrationExecutionReviewed: true,
          riskApprovalStillValid: true,
          paperExecutionReviewed: true,
          killSwitchReady: true,
          operatorConfirmedFinalBoundary: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-human-confirmations"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
      operator: "human-operator",
      confirmationMode: "manual_final_human_confirmation",
      confirmations: {
        orchestrationExecutionReviewed: true,
        riskApprovalStillValid: true,
        paperExecutionReviewed: true,
        killSwitchReady: true,
        operatorConfirmedFinalBoundary: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterHumanConfirmation?.status).toBe("confirmation_recorded");
    expect(result.adapterHumanConfirmation?.orchestrationExecutionId).toBe(
      "execution-adapter-orchestration-execution-us-live"
    );
    expect(result.adapterHumanConfirmation?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterHumanConfirmation?.liveTradingAllowed).toBe(false);
    expect(result.adapterHumanConfirmation?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_human_confirmation");
  });

  test("loads adapter human confirmation history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const confirmation = {
      schemaVersion: 1,
      humanConfirmationId: "execution-adapter-human-confirmation-us-live",
      orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
      dryRunId: "execution-adapter-orchestration-dry-run-us-live",
      acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "confirmation_recorded",
      operator: "human-operator",
      recordedAt: "2026-06-09T10:05:00+00:00",
      confirmationMode: "manual_final_human_confirmation",
      orchestrationExecutionMode: "manual_adapter_orchestration_execution",
      orchestrationMode: "manual_adapter_orchestration_dry_run",
      acceptanceMode: "manual_runtime_reload_acceptance",
      executionMode: "manual_controlled_reload",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      requiredConfirmations: [
        {
          id: "orchestration-execution-reviewed",
          label: "Controlled adapter orchestration execution evidence was reviewed",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterHumanConfirmations(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterHumanConfirmations: [confirmation] })
        };
      },
      5
    );

    expect(buildExecutionAdapterHumanConfirmationHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-human-confirmations?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-human-confirmations?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterHumanConfirmations).toHaveLength(1);
    expect(result.adapterHumanConfirmations[0].status).toBe("confirmation_recorded");
    expect(result.adapterHumanConfirmations[0].manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterHumanConfirmations[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterHumanConfirmations(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterHumanConfirmations: [
            {
              ...confirmation,
              metadata: { token: "human-confirmation-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterHumanConfirmations).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("human-confirmation-token-should-not-leak");
  });

  test("records adapter sandbox probe plan from final human confirmation without enabling live routing", async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : null
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterSandboxProbePlan: {
            schemaVersion: 1,
            sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
            humanConfirmationId: "execution-adapter-human-confirmation-us-live",
            orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
            dryRunId: "execution-adapter-orchestration-dry-run-us-live",
            acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
            executionId: "execution-adapter-runtime-reload-execution-us-live",
            planId: "execution-adapter-runtime-reload-plan-us-live",
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "probe_plan_recorded",
            operator: "sandbox-operator",
            recordedAt: "2026-06-09T10:06:00+00:00",
            probeMode: "manual_sandbox_probe_plan",
            confirmationMode: "manual_final_human_confirmation",
            orchestrationExecutionMode: "manual_adapter_orchestration_execution",
            orchestrationMode: "manual_adapter_orchestration_dry_run",
            acceptanceMode: "manual_runtime_reload_acceptance",
            executionMode: "manual_controlled_reload",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "window-us-live-1",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            requiredConfirmations: [
              { id: "human-confirmation-reviewed", label: "Human confirmation reviewed", status: "confirmed" },
              { id: "testnet-endpoint-locked", label: "Testnet endpoint locked", status: "confirmed" }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-sandbox-probe-plan-us-live",
            eventType: "execution_adapter_sandbox_probe_plan",
            runId: "",
            createdAt: "2026-06-09T10:06:00+00:00",
            stage: "execution-adapter-sandbox-probe-plan",
            source: "execution-adapter-ledger",
            summary: "us-live adapter sandbox probe plan recorded as probe_plan_recorded.",
            detail: "Adapter sandbox probe plan is paper-only.",
            metadata: {
              sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
              humanConfirmationId: "execution-adapter-human-confirmation-us-live",
              manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
              adapterId: "us-live",
              status: "probe_plan_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterSandboxProbePlanUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-sandbox-probe-plans"
    );

    const result = await recordExecutionAdapterSandboxProbePlan(
      "/",
      {
        adapterId: "us-live",
        humanConfirmationId: "execution-adapter-human-confirmation-us-live",
        operator: "sandbox-operator",
        probeMode: "manual_sandbox_probe_plan",
        confirmations: {
          humanConfirmationReviewed: true,
          testnetEndpointLocked: true,
          credentialsAreSandboxOnly: true,
          orderRoutingDisabled: true,
          probeLimitsDocumented: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-sandbox-probe-plans"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      humanConfirmationId: "execution-adapter-human-confirmation-us-live",
      operator: "sandbox-operator",
      probeMode: "manual_sandbox_probe_plan",
      confirmations: {
        humanConfirmationReviewed: true,
        testnetEndpointLocked: true,
        credentialsAreSandboxOnly: true,
        orderRoutingDisabled: true,
        probeLimitsDocumented: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterSandboxProbePlan?.status).toBe("probe_plan_recorded");
    expect(result.adapterSandboxProbePlan?.humanConfirmationId).toBe(
      "execution-adapter-human-confirmation-us-live"
    );
    expect(result.adapterSandboxProbePlan?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterSandboxProbePlan?.liveTradingAllowed).toBe(false);
    expect(result.adapterSandboxProbePlan?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_sandbox_probe_plan");
  });

  test("loads adapter sandbox probe plan history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const sandboxProbePlan = {
      schemaVersion: 1,
      sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
      humanConfirmationId: "execution-adapter-human-confirmation-us-live",
      orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
      dryRunId: "execution-adapter-orchestration-dry-run-us-live",
      acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "probe_plan_recorded",
      operator: "sandbox-operator",
      recordedAt: "2026-06-09T10:06:00+00:00",
      probeMode: "manual_sandbox_probe_plan",
      confirmationMode: "manual_final_human_confirmation",
      orchestrationExecutionMode: "manual_adapter_orchestration_execution",
      orchestrationMode: "manual_adapter_orchestration_dry_run",
      acceptanceMode: "manual_runtime_reload_acceptance",
      executionMode: "manual_controlled_reload",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      requiredConfirmations: [
        { id: "human-confirmation-reviewed", label: "Human confirmation reviewed", status: "confirmed" }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterSandboxProbePlans(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterSandboxProbePlans: [sandboxProbePlan] })
        };
      },
      5
    );

    expect(buildExecutionAdapterSandboxProbePlanHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-sandbox-probe-plans?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-sandbox-probe-plans?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterSandboxProbePlans).toHaveLength(1);
    expect(result.adapterSandboxProbePlans[0].status).toBe("probe_plan_recorded");
    expect(result.adapterSandboxProbePlans[0].manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterSandboxProbePlans[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterSandboxProbePlans(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterSandboxProbePlans: [
            {
              ...sandboxProbePlan,
              metadata: { token: "sandbox-probe-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterSandboxProbePlans).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("sandbox-probe-token-should-not-leak");
  });

  test("records adapter sandbox probe execution from probe plan without enabling live routing", async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : null
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterSandboxProbeExecution: {
            schemaVersion: 1,
            sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
            sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
            humanConfirmationId: "execution-adapter-human-confirmation-us-live",
            orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
            dryRunId: "execution-adapter-orchestration-dry-run-us-live",
            acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
            executionId: "execution-adapter-runtime-reload-execution-us-live",
            planId: "execution-adapter-runtime-reload-plan-us-live",
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "probe_execution_recorded",
            operator: "sandbox-operator",
            recordedAt: "2026-06-09T10:16:00+00:00",
            probeExecutionMode: "manual_readonly_sandbox_probe",
            probeMode: "manual_sandbox_probe_plan",
            confirmationMode: "manual_final_human_confirmation",
            orchestrationExecutionMode: "manual_adapter_orchestration_execution",
            orchestrationMode: "manual_adapter_orchestration_dry_run",
            acceptanceMode: "manual_runtime_reload_acceptance",
            executionMode: "manual_controlled_reload",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "window-us-live-1",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            requiredConfirmations: [
              { id: "probe-plan-reviewed", label: "Probe plan reviewed", status: "confirmed" },
              { id: "readonly-handshake-captured", label: "Readonly handshake captured", status: "confirmed" }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-sandbox-probe-execution-us-live",
            eventType: "execution_adapter_sandbox_probe_execution",
            runId: "",
            createdAt: "2026-06-09T10:16:00+00:00",
            stage: "execution-adapter-sandbox-probe-execution",
            source: "execution-adapter-ledger",
            summary: "us-live adapter sandbox probe execution recorded as probe_execution_recorded.",
            detail: "Adapter sandbox probe execution is paper-only.",
            metadata: {
              sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
              sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
              manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
              adapterId: "us-live",
              status: "probe_execution_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterSandboxProbeExecutionUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-sandbox-probe-executions"
    );

    const result = await recordExecutionAdapterSandboxProbeExecution(
      "/",
      {
        adapterId: "us-live",
        sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
        operator: "sandbox-operator",
        probeExecutionMode: "manual_readonly_sandbox_probe",
        confirmations: {
          probePlanReviewed: true,
          readonlyHandshakeCaptured: true,
          accountSnapshotRedacted: true,
          orderSchemaValidated: true,
          operatorConfirmedNoOrdersSubmitted: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-sandbox-probe-executions"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
      operator: "sandbox-operator",
      probeExecutionMode: "manual_readonly_sandbox_probe",
      confirmations: {
        probePlanReviewed: true,
        readonlyHandshakeCaptured: true,
        accountSnapshotRedacted: true,
        orderSchemaValidated: true,
        operatorConfirmedNoOrdersSubmitted: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterSandboxProbeExecution?.status).toBe("probe_execution_recorded");
    expect(result.adapterSandboxProbeExecution?.sandboxProbePlanId).toBe(
      "execution-adapter-sandbox-probe-plan-us-live"
    );
    expect(result.adapterSandboxProbeExecution?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterSandboxProbeExecution?.liveTradingAllowed).toBe(false);
    expect(result.adapterSandboxProbeExecution?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_sandbox_probe_execution");
  });

  test("loads adapter sandbox probe execution history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const sandboxProbeExecution = {
      schemaVersion: 1,
      sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
      sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
      humanConfirmationId: "execution-adapter-human-confirmation-us-live",
      orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
      dryRunId: "execution-adapter-orchestration-dry-run-us-live",
      acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "probe_execution_recorded",
      operator: "sandbox-operator",
      recordedAt: "2026-06-09T10:16:00+00:00",
      probeExecutionMode: "manual_readonly_sandbox_probe",
      probeMode: "manual_sandbox_probe_plan",
      confirmationMode: "manual_final_human_confirmation",
      orchestrationExecutionMode: "manual_adapter_orchestration_execution",
      orchestrationMode: "manual_adapter_orchestration_dry_run",
      acceptanceMode: "manual_runtime_reload_acceptance",
      executionMode: "manual_controlled_reload",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      requiredConfirmations: [
        { id: "probe-plan-reviewed", label: "Probe plan reviewed", status: "confirmed" }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterSandboxProbeExecutions(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterSandboxProbeExecutions: [sandboxProbeExecution] })
        };
      },
      5
    );

    expect(buildExecutionAdapterSandboxProbeExecutionHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-sandbox-probe-executions?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-sandbox-probe-executions?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterSandboxProbeExecutions).toHaveLength(1);
    expect(result.adapterSandboxProbeExecutions[0].status).toBe("probe_execution_recorded");
    expect(result.adapterSandboxProbeExecutions[0].manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterSandboxProbeExecutions[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterSandboxProbeExecutions(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterSandboxProbeExecutions: [
            {
              ...sandboxProbeExecution,
              metadata: { token: "sandbox-probe-execution-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterSandboxProbeExecutions).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("sandbox-probe-execution-token-should-not-leak");
  });

  test("records adapter sandbox probe review from probe execution without enabling live routing", async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : null
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterSandboxProbeReview: {
            schemaVersion: 1,
            sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
            sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
            sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
            humanConfirmationId: "execution-adapter-human-confirmation-us-live",
            orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
            dryRunId: "execution-adapter-orchestration-dry-run-us-live",
            acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
            executionId: "execution-adapter-runtime-reload-execution-us-live",
            planId: "execution-adapter-runtime-reload-plan-us-live",
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "probe_review_recorded",
            operator: "sandbox-reviewer",
            recordedAt: "2026-06-09T10:18:00+00:00",
            reviewMode: "manual_sandbox_probe_review",
            probeExecutionMode: "manual_readonly_sandbox_probe",
            probeMode: "manual_sandbox_probe_plan",
            confirmationMode: "manual_final_human_confirmation",
            orchestrationExecutionMode: "manual_adapter_orchestration_execution",
            orchestrationMode: "manual_adapter_orchestration_dry_run",
            acceptanceMode: "manual_runtime_reload_acceptance",
            executionMode: "manual_controlled_reload",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "window-us-live-1",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            requiredConfirmations: [
              { id: "probe-execution-reviewed", label: "Probe execution reviewed", status: "confirmed" },
              { id: "readonly-evidence-matches-plan", label: "Evidence matches plan", status: "confirmed" },
              { id: "redacted-snapshot-archived", label: "Redacted snapshot archived", status: "confirmed" },
              { id: "order-schema-risk-reviewed", label: "Order schema risk reviewed", status: "confirmed" },
              { id: "production-route-still-blocked", label: "Production route still blocked", status: "confirmed" }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-sandbox-probe-review-us-live",
            eventType: "execution_adapter_sandbox_probe_review",
            runId: "",
            createdAt: "2026-06-09T10:18:00+00:00",
            stage: "execution-adapter-sandbox-probe-review",
            source: "execution-adapter-ledger",
            summary: "us-live adapter sandbox probe review recorded as probe_review_recorded.",
            detail: "Adapter sandbox probe review is paper-only.",
            metadata: {
              sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
              sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
              adapterId: "us-live",
              manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
              status: "probe_review_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterSandboxProbeReviewUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-sandbox-probe-reviews"
    );

    const result = await recordExecutionAdapterSandboxProbeReview(
      "/",
      {
        adapterId: "us-live",
        sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
        operator: "sandbox-reviewer",
        reviewMode: "manual_sandbox_probe_review",
        confirmations: {
          probeExecutionReviewed: true,
          readonlyEvidenceMatchesPlan: true,
          redactedSnapshotArchived: true,
          orderSchemaRiskReviewed: true,
          productionRouteStillBlocked: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-sandbox-probe-reviews"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
      operator: "sandbox-reviewer",
      reviewMode: "manual_sandbox_probe_review",
      confirmations: {
        probeExecutionReviewed: true,
        readonlyEvidenceMatchesPlan: true,
        redactedSnapshotArchived: true,
        orderSchemaRiskReviewed: true,
        productionRouteStillBlocked: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterSandboxProbeReview?.status).toBe("probe_review_recorded");
    expect(result.adapterSandboxProbeReview?.sandboxProbeExecutionId).toBe(
      "execution-adapter-sandbox-probe-execution-us-live"
    );
    expect(result.adapterSandboxProbeReview?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterSandboxProbeReview?.liveTradingAllowed).toBe(false);
    expect(result.adapterSandboxProbeReview?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_sandbox_probe_review");
  });

  test("loads adapter sandbox probe review history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const sandboxProbeReview = {
      schemaVersion: 1,
      sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
      sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
      sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
      humanConfirmationId: "execution-adapter-human-confirmation-us-live",
      orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
      dryRunId: "execution-adapter-orchestration-dry-run-us-live",
      acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "probe_review_recorded",
      operator: "sandbox-reviewer",
      recordedAt: "2026-06-09T10:18:00+00:00",
      reviewMode: "manual_sandbox_probe_review",
      probeExecutionMode: "manual_readonly_sandbox_probe",
      probeMode: "manual_sandbox_probe_plan",
      confirmationMode: "manual_final_human_confirmation",
      orchestrationExecutionMode: "manual_adapter_orchestration_execution",
      orchestrationMode: "manual_adapter_orchestration_dry_run",
      acceptanceMode: "manual_runtime_reload_acceptance",
      executionMode: "manual_controlled_reload",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      requiredConfirmations: [
        { id: "probe-execution-reviewed", label: "Probe execution reviewed", status: "confirmed" }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterSandboxProbeReviews(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterSandboxProbeReviews: [sandboxProbeReview] })
        };
      },
      5
    );

    expect(buildExecutionAdapterSandboxProbeReviewHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-sandbox-probe-reviews?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-sandbox-probe-reviews?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterSandboxProbeReviews).toHaveLength(1);
    expect(result.adapterSandboxProbeReviews[0].status).toBe("probe_review_recorded");
    expect(result.adapterSandboxProbeReviews[0].manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterSandboxProbeReviews[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterSandboxProbeReviews(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterSandboxProbeReviews: [
            {
              ...sandboxProbeReview,
              metadata: { token: "sandbox-probe-review-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterSandboxProbeReviews).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("sandbox-probe-review-token-should-not-leak");
  });

  test("records adapter production route review from sandbox review without enabling live routing", async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : null
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterProductionRouteReview: {
            schemaVersion: 1,
            productionRouteReviewId: "execution-adapter-production-route-review-us-live",
            sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
            sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
            sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
            humanConfirmationId: "execution-adapter-human-confirmation-us-live",
            orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
            dryRunId: "execution-adapter-orchestration-dry-run-us-live",
            acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
            executionId: "execution-adapter-runtime-reload-execution-us-live",
            planId: "execution-adapter-runtime-reload-plan-us-live",
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "route_review_recorded",
            operator: "route-reviewer",
            recordedAt: "2026-06-09T10:22:00+00:00",
            reviewMode: "manual_production_route_review",
            sandboxReviewMode: "manual_sandbox_probe_review",
            probeExecutionMode: "manual_readonly_sandbox_probe",
            probeMode: "manual_sandbox_probe_plan",
            confirmationMode: "manual_final_human_confirmation",
            orchestrationExecutionMode: "manual_adapter_orchestration_execution",
            orchestrationMode: "manual_adapter_orchestration_dry_run",
            acceptanceMode: "manual_runtime_reload_acceptance",
            executionMode: "manual_controlled_reload",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "window-us-live-1",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            requiredConfirmations: [
              { id: "sandbox-probe-review-accepted", label: "Sandbox review accepted", status: "confirmed" },
              { id: "kill-switch-policy-reviewed", label: "Kill switch policy reviewed", status: "confirmed" },
              { id: "order-routing-disabled-verified", label: "Order routing disabled", status: "confirmed" },
              { id: "position-limit-policy-reviewed", label: "Position limit policy reviewed", status: "confirmed" },
              { id: "rollback-owner-recorded", label: "Rollback owner recorded", status: "confirmed" }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-production-route-review-us-live",
            eventType: "execution_adapter_production_route_review",
            runId: "",
            createdAt: "2026-06-09T10:22:00+00:00",
            stage: "execution-adapter-production-route-review",
            source: "execution-adapter-ledger",
            summary: "us-live adapter production route review recorded as route_review_recorded.",
            detail: "Adapter production route review is paper-only.",
            metadata: {
              productionRouteReviewId: "execution-adapter-production-route-review-us-live",
              sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
              adapterId: "us-live",
              manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
              status: "route_review_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterProductionRouteReviewUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-production-route-reviews"
    );

    const result = await recordExecutionAdapterProductionRouteReview(
      "/",
      {
        adapterId: "us-live",
        sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
        operator: "route-reviewer",
        reviewMode: "manual_production_route_review",
        confirmations: {
          sandboxProbeReviewAccepted: true,
          killSwitchPolicyReviewed: true,
          orderRoutingDisabledVerified: true,
          positionLimitPolicyReviewed: true,
          rollbackOwnerRecorded: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-production-route-reviews"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
      operator: "route-reviewer",
      reviewMode: "manual_production_route_review",
      confirmations: {
        sandboxProbeReviewAccepted: true,
        killSwitchPolicyReviewed: true,
        orderRoutingDisabledVerified: true,
        positionLimitPolicyReviewed: true,
        rollbackOwnerRecorded: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterProductionRouteReview?.status).toBe("route_review_recorded");
    expect(result.adapterProductionRouteReview?.sandboxProbeReviewId).toBe(
      "execution-adapter-sandbox-probe-review-us-live"
    );
    expect(result.adapterProductionRouteReview?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterProductionRouteReview?.liveTradingAllowed).toBe(false);
    expect(result.adapterProductionRouteReview?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_production_route_review");
  });

  test("loads adapter production route review history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const productionRouteReview = {
      schemaVersion: 1,
      productionRouteReviewId: "execution-adapter-production-route-review-us-live",
      sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
      sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
      sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
      humanConfirmationId: "execution-adapter-human-confirmation-us-live",
      orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
      dryRunId: "execution-adapter-orchestration-dry-run-us-live",
      acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "route_review_recorded",
      operator: "route-reviewer",
      recordedAt: "2026-06-09T10:22:00+00:00",
      reviewMode: "manual_production_route_review",
      sandboxReviewMode: "manual_sandbox_probe_review",
      probeExecutionMode: "manual_readonly_sandbox_probe",
      probeMode: "manual_sandbox_probe_plan",
      confirmationMode: "manual_final_human_confirmation",
      orchestrationExecutionMode: "manual_adapter_orchestration_execution",
      orchestrationMode: "manual_adapter_orchestration_dry_run",
      acceptanceMode: "manual_runtime_reload_acceptance",
      executionMode: "manual_controlled_reload",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      requiredConfirmations: [
        { id: "sandbox-probe-review-accepted", label: "Sandbox review accepted", status: "confirmed" }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterProductionRouteReviews(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterProductionRouteReviews: [productionRouteReview] })
        };
      },
      5
    );

    expect(buildExecutionAdapterProductionRouteReviewHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-production-route-reviews?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-production-route-reviews?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterProductionRouteReviews).toHaveLength(1);
    expect(result.adapterProductionRouteReviews[0].status).toBe("route_review_recorded");
    expect(result.adapterProductionRouteReviews[0].manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterProductionRouteReviews[0].liveTradingAllowed).toBe(false);

    const rejected = await loadExecutionAdapterProductionRouteReviews(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterProductionRouteReviews: [
            {
              ...productionRouteReview,
              metadata: { token: "production-route-review-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterProductionRouteReviews).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("production-route-review-token-should-not-leak");
  });

  test("records adapter sandbox order schema dry-run without enabling live routing", async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : null
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterSandboxOrderSchemaDryRun: {
            schemaVersion: 1,
            sandboxOrderSchemaDryRunId: "execution-adapter-sandbox-order-schema-dry-run-us-live",
            productionRouteReviewId: "execution-adapter-production-route-review-us-live",
            sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
            sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
            sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
            humanConfirmationId: "execution-adapter-human-confirmation-us-live",
            orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
            dryRunId: "execution-adapter-orchestration-dry-run-us-live",
            acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
            executionId: "execution-adapter-runtime-reload-execution-us-live",
            planId: "execution-adapter-runtime-reload-plan-us-live",
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "schema_dry_run_recorded",
            operator: "schema-runner",
            recordedAt: "2026-06-09T10:32:00+00:00",
            dryRunMode: "manual_sandbox_order_schema_dry_run",
            reviewMode: "manual_production_route_review",
            sandboxReviewMode: "manual_sandbox_probe_review",
            probeExecutionMode: "manual_readonly_sandbox_probe",
            probeMode: "manual_sandbox_probe_plan",
            confirmationMode: "manual_final_human_confirmation",
            orchestrationExecutionMode: "manual_adapter_orchestration_execution",
            orchestrationMode: "manual_adapter_orchestration_dry_run",
            acceptanceMode: "manual_runtime_reload_acceptance",
            executionMode: "manual_controlled_reload",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "window-us-live-1",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            orderIntent: {
              symbol: "AAPL",
              side: "buy",
              type: "limit",
              quantity: 10,
              price: 191.2
            },
            orderSubmitted: false,
            requiredConfirmations: [
              { id: "production-route-review-accepted", label: "Route review accepted", status: "confirmed" },
              { id: "health-probe-bound", label: "Health probe bound", status: "confirmed" },
              { id: "order-intent-schema-validated", label: "Order intent schema validated", status: "confirmed" },
              { id: "sandbox-endpoint-still-locked", label: "Sandbox endpoint locked", status: "confirmed" },
              { id: "operator-confirmed-no-order-submitted", label: "No order submitted", status: "confirmed" }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-sandbox-order-schema-dry-run-us-live",
            eventType: "execution_adapter_sandbox_order_schema_dry_run",
            runId: "",
            createdAt: "2026-06-09T10:32:00+00:00",
            stage: "execution-adapter-sandbox-order-schema-dry-run",
            source: "execution-adapter-ledger",
            summary: "us-live sandbox order schema dry-run recorded as schema_dry_run_recorded.",
            detail: "Sandbox order schema dry-run is paper-only.",
            metadata: {
              sandboxOrderSchemaDryRunId: "execution-adapter-sandbox-order-schema-dry-run-us-live",
              productionRouteReviewId: "execution-adapter-production-route-review-us-live",
              adapterId: "us-live",
              manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
              status: "schema_dry_run_recorded",
              orderSubmitted: false,
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterSandboxOrderSchemaDryRunUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-sandbox-order-schema-dry-runs"
    );

    const result = await recordExecutionAdapterSandboxOrderSchemaDryRun(
      "/",
      {
        adapterId: "us-live",
        productionRouteReviewId: "execution-adapter-production-route-review-us-live",
        operator: "schema-runner",
        dryRunMode: "manual_sandbox_order_schema_dry_run",
        orderIntent: {
          symbol: "AAPL",
          side: "buy",
          type: "limit",
          quantity: 10,
          price: 191.2
        },
        confirmations: {
          productionRouteReviewAccepted: true,
          healthProbeBound: true,
          orderIntentSchemaValidated: true,
          sandboxEndpointStillLocked: true,
          operatorConfirmedNoOrderSubmitted: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-sandbox-order-schema-dry-runs"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      productionRouteReviewId: "execution-adapter-production-route-review-us-live",
      operator: "schema-runner",
      dryRunMode: "manual_sandbox_order_schema_dry_run",
      orderIntent: {
        symbol: "AAPL",
        side: "buy",
        type: "limit",
        quantity: 10,
        price: 191.2
      },
      confirmations: {
        productionRouteReviewAccepted: true,
        healthProbeBound: true,
        orderIntentSchemaValidated: true,
        sandboxEndpointStillLocked: true,
        operatorConfirmedNoOrderSubmitted: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterSandboxOrderSchemaDryRun?.status).toBe("schema_dry_run_recorded");
    expect(result.adapterSandboxOrderSchemaDryRun?.productionRouteReviewId).toBe(
      "execution-adapter-production-route-review-us-live"
    );
    expect(result.adapterSandboxOrderSchemaDryRun?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterSandboxOrderSchemaDryRun?.orderSubmitted).toBe(false);
    expect(result.adapterSandboxOrderSchemaDryRun?.liveTradingAllowed).toBe(false);
    expect(result.adapterSandboxOrderSchemaDryRun?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_sandbox_order_schema_dry_run");
  });

  test("loads adapter sandbox order schema dry-run history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const schemaDryRun = {
      schemaVersion: 1,
      sandboxOrderSchemaDryRunId: "execution-adapter-sandbox-order-schema-dry-run-us-live",
      productionRouteReviewId: "execution-adapter-production-route-review-us-live",
      sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
      sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
      sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
      humanConfirmationId: "execution-adapter-human-confirmation-us-live",
      orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
      dryRunId: "execution-adapter-orchestration-dry-run-us-live",
      acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "schema_dry_run_recorded",
      operator: "schema-runner",
      recordedAt: "2026-06-09T10:32:00+00:00",
      dryRunMode: "manual_sandbox_order_schema_dry_run",
      reviewMode: "manual_production_route_review",
      sandboxReviewMode: "manual_sandbox_probe_review",
      probeExecutionMode: "manual_readonly_sandbox_probe",
      probeMode: "manual_sandbox_probe_plan",
      confirmationMode: "manual_final_human_confirmation",
      orchestrationExecutionMode: "manual_adapter_orchestration_execution",
      orchestrationMode: "manual_adapter_orchestration_dry_run",
      acceptanceMode: "manual_runtime_reload_acceptance",
      executionMode: "manual_controlled_reload",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      orderIntent: { symbol: "AAPL", side: "buy", type: "limit", quantity: 10, price: 191.2 },
      orderSubmitted: false,
      requiredConfirmations: [
        { id: "production-route-review-accepted", label: "Route review accepted", status: "confirmed" }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterSandboxOrderSchemaDryRuns(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterSandboxOrderSchemaDryRuns: [schemaDryRun] })
        };
      },
      5
    );

    expect(buildExecutionAdapterSandboxOrderSchemaDryRunHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-sandbox-order-schema-dry-runs?adapterId=us-live&limit=5"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-sandbox-order-schema-dry-runs?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterSandboxOrderSchemaDryRuns).toHaveLength(1);
    expect(result.adapterSandboxOrderSchemaDryRuns[0].status).toBe("schema_dry_run_recorded");
    expect(result.adapterSandboxOrderSchemaDryRuns[0].manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterSandboxOrderSchemaDryRuns[0].orderSubmitted).toBe(false);

    const rejected = await loadExecutionAdapterSandboxOrderSchemaDryRuns(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterSandboxOrderSchemaDryRuns: [
            {
              ...schemaDryRun,
              metadata: { token: "schema-dry-run-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterSandboxOrderSchemaDryRuns).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("schema-dry-run-token-should-not-leak");
  });

  test("records adapter paper order lifecycle without submitting live orders", async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : null
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterPaperOrderLifecycle: {
            schemaVersion: 1,
            paperOrderLifecycleId: "execution-adapter-paper-order-lifecycle-us-live",
            sandboxOrderSchemaDryRunId: "execution-adapter-sandbox-order-schema-dry-run-us-live",
            productionRouteReviewId: "execution-adapter-production-route-review-us-live",
            sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
            sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
            sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
            humanConfirmationId: "execution-adapter-human-confirmation-us-live",
            orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
            dryRunId: "execution-adapter-orchestration-dry-run-us-live",
            acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
            executionId: "execution-adapter-runtime-reload-execution-us-live",
            planId: "execution-adapter-runtime-reload-plan-us-live",
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "lifecycle_recorded",
            operator: "paper-lifecycle-runner",
            recordedAt: "2026-06-09T11:12:00+00:00",
            lifecycleMode: "manual_paper_order_lifecycle_adapter",
            dryRunMode: "manual_sandbox_order_schema_dry_run",
            reviewMode: "manual_production_route_review",
            sandboxReviewMode: "manual_sandbox_probe_review",
            probeExecutionMode: "manual_readonly_sandbox_probe",
            probeMode: "manual_sandbox_probe_plan",
            confirmationMode: "manual_final_human_confirmation",
            orchestrationExecutionMode: "manual_adapter_orchestration_execution",
            orchestrationMode: "manual_adapter_orchestration_dry_run",
            acceptanceMode: "manual_runtime_reload_acceptance",
            executionMode: "manual_controlled_reload",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "window-us-live-1",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            orderIntent: { symbol: "AAPL", side: "buy", type: "limit", quantity: 10, price: 191.2 },
            lifecycleSteps: [
              { id: "intent-validated", label: "Order intent validated", status: "recorded" },
              { id: "paper-router-locked", label: "Paper router locked", status: "recorded" },
              { id: "risk-limits-bound", label: "Risk limits bound", status: "recorded" },
              { id: "simulated-lifecycle-recorded", label: "Simulated lifecycle recorded", status: "recorded" }
            ],
            orderSubmitted: false,
            liveOrderSubmitted: false,
            requiredConfirmations: [
              { id: "schema-dry-run-accepted", label: "Schema dry-run accepted", status: "confirmed" },
              { id: "paper-router-locked", label: "Paper router locked", status: "confirmed" },
              { id: "risk-limits-bound", label: "Risk limits bound", status: "confirmed" },
              { id: "simulated-lifecycle-generated", label: "Simulated lifecycle generated", status: "confirmed" },
              { id: "operator-confirmed-no-live-order-submitted", label: "No live order submitted", status: "confirmed" }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-paper-order-lifecycle-us-live",
            eventType: "execution_adapter_paper_order_lifecycle",
            runId: "",
            createdAt: "2026-06-09T11:12:00+00:00",
            stage: "execution-adapter-paper-order-lifecycle",
            source: "execution-adapter-ledger",
            summary: "us-live paper order lifecycle recorded as lifecycle_recorded.",
            detail: "Paper order lifecycle adapter records local transitions only.",
            metadata: {
              paperOrderLifecycleId: "execution-adapter-paper-order-lifecycle-us-live",
              sandboxOrderSchemaDryRunId: "execution-adapter-sandbox-order-schema-dry-run-us-live",
              manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
              adapterId: "us-live",
              status: "lifecycle_recorded",
              liveOrderSubmitted: false,
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterPaperOrderLifecycleUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-paper-order-lifecycles"
    );

    const result = await recordExecutionAdapterPaperOrderLifecycle(
      "/",
      {
        adapterId: "us-live",
        sandboxOrderSchemaDryRunId: "execution-adapter-sandbox-order-schema-dry-run-us-live",
        operator: "paper-lifecycle-runner",
        lifecycleMode: "manual_paper_order_lifecycle_adapter",
        confirmations: {
          schemaDryRunAccepted: true,
          paperRouterLocked: true,
          riskLimitsBound: true,
          simulatedLifecycleGenerated: true,
          operatorConfirmedNoLiveOrderSubmitted: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-paper-order-lifecycles"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      sandboxOrderSchemaDryRunId: "execution-adapter-sandbox-order-schema-dry-run-us-live",
      operator: "paper-lifecycle-runner",
      lifecycleMode: "manual_paper_order_lifecycle_adapter",
      confirmations: {
        schemaDryRunAccepted: true,
        paperRouterLocked: true,
        riskLimitsBound: true,
        simulatedLifecycleGenerated: true,
        operatorConfirmedNoLiveOrderSubmitted: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterPaperOrderLifecycle?.status).toBe("lifecycle_recorded");
    expect(result.adapterPaperOrderLifecycle?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterPaperOrderLifecycle?.orderSubmitted).toBe(false);
    expect(result.adapterPaperOrderLifecycle?.liveOrderSubmitted).toBe(false);
    expect(result.adapterPaperOrderLifecycle?.paperOnly).toBe(true);
    expect(result.adapterPaperOrderLifecycle?.liveTradingAllowed).toBe(false);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_paper_order_lifecycle");
  });

  test("loads adapter paper order lifecycle history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const lifecycle = {
      schemaVersion: 1,
      paperOrderLifecycleId: "execution-adapter-paper-order-lifecycle-us-live",
      sandboxOrderSchemaDryRunId: "execution-adapter-sandbox-order-schema-dry-run-us-live",
      productionRouteReviewId: "execution-adapter-production-route-review-us-live",
      sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
      sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
      sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
      humanConfirmationId: "execution-adapter-human-confirmation-us-live",
      orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
      dryRunId: "execution-adapter-orchestration-dry-run-us-live",
      acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "lifecycle_recorded",
      operator: "paper-lifecycle-runner",
      recordedAt: "2026-06-09T11:12:00+00:00",
      lifecycleMode: "manual_paper_order_lifecycle_adapter",
      dryRunMode: "manual_sandbox_order_schema_dry_run",
      reviewMode: "manual_production_route_review",
      sandboxReviewMode: "manual_sandbox_probe_review",
      probeExecutionMode: "manual_readonly_sandbox_probe",
      probeMode: "manual_sandbox_probe_plan",
      confirmationMode: "manual_final_human_confirmation",
      orchestrationExecutionMode: "manual_adapter_orchestration_execution",
      orchestrationMode: "manual_adapter_orchestration_dry_run",
      acceptanceMode: "manual_runtime_reload_acceptance",
      executionMode: "manual_controlled_reload",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      orderIntent: { symbol: "AAPL", side: "buy", type: "limit", quantity: 10, price: 191.2 },
      lifecycleSteps: [{ id: "intent-validated", label: "Order intent validated", status: "recorded" }],
      orderSubmitted: false,
      liveOrderSubmitted: false,
      requiredConfirmations: [{ id: "schema-dry-run-accepted", label: "Schema dry-run accepted", status: "confirmed" }],
      blockedReasons: [],
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterPaperOrderLifecycles(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterPaperOrderLifecycles: [lifecycle] })
        };
      },
      5
    );

    expect(buildExecutionAdapterPaperOrderLifecycleHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-paper-order-lifecycles?adapterId=us-live&limit=5"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-paper-order-lifecycles?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterPaperOrderLifecycles).toHaveLength(1);
    expect(result.adapterPaperOrderLifecycles[0].status).toBe("lifecycle_recorded");
    expect(result.adapterPaperOrderLifecycles[0].manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterPaperOrderLifecycles[0].liveOrderSubmitted).toBe(false);

    const missingValidation = await loadExecutionAdapterPaperOrderLifecycles(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => {
        const { manifestValidationId: _manifestValidationId, ...missingValidationLifecycle } = lifecycle;
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterPaperOrderLifecycles: [missingValidationLifecycle] })
        };
      },
      5
    );

    expect(missingValidation.source).toBe("fallback");
    expect(missingValidation.adapterPaperOrderLifecycles).toEqual([]);

    const rejected = await loadExecutionAdapterPaperOrderLifecycles(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterPaperOrderLifecycles: [
            {
              ...lifecycle,
              metadata: { token: "paper-lifecycle-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterPaperOrderLifecycles).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("paper-lifecycle-token-should-not-leak");
  });

  test("records adapter paper route runbook without executing routes", async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : null
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterPaperRouteRunbook: {
            schemaVersion: 1,
            paperRouteRunbookId: "execution-adapter-paper-route-runbook-us-live",
            paperOrderLifecycleId: "execution-adapter-paper-order-lifecycle-us-live",
            sandboxOrderSchemaDryRunId: "execution-adapter-sandbox-order-schema-dry-run-us-live",
            productionRouteReviewId: "execution-adapter-production-route-review-us-live",
            sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
            sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
            sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
            humanConfirmationId: "execution-adapter-human-confirmation-us-live",
            orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
            dryRunId: "execution-adapter-orchestration-dry-run-us-live",
            acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
            executionId: "execution-adapter-runtime-reload-execution-us-live",
            planId: "execution-adapter-runtime-reload-plan-us-live",
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "runbook_recorded",
            operator: "paper-route-runbook-runner",
            recordedAt: "2026-06-09T11:22:00+00:00",
            runbookMode: "manual_paper_route_runbook",
            lifecycleMode: "manual_paper_order_lifecycle_adapter",
            dryRunMode: "manual_sandbox_order_schema_dry_run",
            reviewMode: "manual_production_route_review",
            sandboxReviewMode: "manual_sandbox_probe_review",
            probeExecutionMode: "manual_readonly_sandbox_probe",
            probeMode: "manual_sandbox_probe_plan",
            confirmationMode: "manual_final_human_confirmation",
            orchestrationExecutionMode: "manual_adapter_orchestration_execution",
            orchestrationMode: "manual_adapter_orchestration_dry_run",
            acceptanceMode: "manual_runtime_reload_acceptance",
            executionMode: "manual_controlled_reload",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "window-us-live-1",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            orderIntent: { symbol: "AAPL", side: "buy", type: "limit", quantity: 10, price: 191.2 },
            lifecycleSteps: [{ id: "intent-validated", label: "Order intent validated", status: "recorded" }],
            runbookSteps: [
              { id: "lifecycle-evidence-linked", label: "Paper lifecycle evidence linked", status: "recorded" },
              { id: "paper-account-snapshot-bound", label: "Paper account snapshot bound", status: "recorded" },
              { id: "risk-controls-verified", label: "Risk controls verified", status: "recorded" },
              { id: "replay-plan-recorded", label: "Replay plan recorded", status: "recorded" }
            ],
            orderSubmitted: false,
            liveOrderSubmitted: false,
            routeExecuted: false,
            requiredConfirmations: [
              { id: "paper-lifecycle-accepted", label: "Paper lifecycle accepted", status: "confirmed" },
              { id: "paper-account-snapshot-captured", label: "Paper account snapshot captured", status: "confirmed" },
              { id: "risk-controls-verified", label: "Risk controls verified", status: "confirmed" },
              { id: "replay-plan-recorded", label: "Replay plan recorded", status: "confirmed" },
              { id: "operator-confirmed-no-live-routing", label: "No live routing", status: "confirmed" }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-paper-route-runbook-us-live",
            eventType: "execution_adapter_paper_route_runbook",
            runId: "",
            createdAt: "2026-06-09T11:22:00+00:00",
            stage: "execution-adapter-paper-route-runbook",
            source: "execution-adapter-ledger",
            summary: "us-live paper route runbook recorded as runbook_recorded.",
            detail: "Paper route runbook records the controlled simulation plan only.",
            metadata: {
              paperRouteRunbookId: "execution-adapter-paper-route-runbook-us-live",
              paperOrderLifecycleId: "execution-adapter-paper-order-lifecycle-us-live",
              manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
              adapterId: "us-live",
              status: "runbook_recorded",
              routeExecuted: false,
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterPaperRouteRunbookUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-paper-route-runbooks"
    );

    const result = await recordExecutionAdapterPaperRouteRunbook(
      "/",
      {
        adapterId: "us-live",
        paperOrderLifecycleId: "execution-adapter-paper-order-lifecycle-us-live",
        operator: "paper-route-runbook-runner",
        runbookMode: "manual_paper_route_runbook",
        confirmations: {
          paperLifecycleAccepted: true,
          paperAccountSnapshotCaptured: true,
          riskControlsVerified: true,
          replayPlanRecorded: true,
          operatorConfirmedNoLiveRouting: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-paper-route-runbooks"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      paperOrderLifecycleId: "execution-adapter-paper-order-lifecycle-us-live",
      operator: "paper-route-runbook-runner",
      runbookMode: "manual_paper_route_runbook",
      confirmations: {
        paperLifecycleAccepted: true,
        paperAccountSnapshotCaptured: true,
        riskControlsVerified: true,
        replayPlanRecorded: true,
        operatorConfirmedNoLiveRouting: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterPaperRouteRunbook?.status).toBe("runbook_recorded");
    expect(result.adapterPaperRouteRunbook?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterPaperRouteRunbook?.orderSubmitted).toBe(false);
    expect(result.adapterPaperRouteRunbook?.liveOrderSubmitted).toBe(false);
    expect(result.adapterPaperRouteRunbook?.routeExecuted).toBe(false);
    expect(result.adapterPaperRouteRunbook?.paperOnly).toBe(true);
    expect(result.adapterPaperRouteRunbook?.liveTradingAllowed).toBe(false);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_paper_route_runbook");
  });

  test("loads adapter paper route runbook history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const runbook = {
      schemaVersion: 1,
      paperRouteRunbookId: "execution-adapter-paper-route-runbook-us-live",
      paperOrderLifecycleId: "execution-adapter-paper-order-lifecycle-us-live",
      sandboxOrderSchemaDryRunId: "execution-adapter-sandbox-order-schema-dry-run-us-live",
      productionRouteReviewId: "execution-adapter-production-route-review-us-live",
      sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
      sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
      sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
      humanConfirmationId: "execution-adapter-human-confirmation-us-live",
      orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
      dryRunId: "execution-adapter-orchestration-dry-run-us-live",
      acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "runbook_recorded",
      operator: "paper-route-runbook-runner",
      recordedAt: "2026-06-09T11:22:00+00:00",
      runbookMode: "manual_paper_route_runbook",
      lifecycleMode: "manual_paper_order_lifecycle_adapter",
      dryRunMode: "manual_sandbox_order_schema_dry_run",
      reviewMode: "manual_production_route_review",
      sandboxReviewMode: "manual_sandbox_probe_review",
      probeExecutionMode: "manual_readonly_sandbox_probe",
      probeMode: "manual_sandbox_probe_plan",
      confirmationMode: "manual_final_human_confirmation",
      orchestrationExecutionMode: "manual_adapter_orchestration_execution",
      orchestrationMode: "manual_adapter_orchestration_dry_run",
      acceptanceMode: "manual_runtime_reload_acceptance",
      executionMode: "manual_controlled_reload",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      orderIntent: { symbol: "AAPL", side: "buy", type: "limit", quantity: 10, price: 191.2 },
      lifecycleSteps: [{ id: "intent-validated", label: "Order intent validated", status: "recorded" }],
      runbookSteps: [{ id: "lifecycle-evidence-linked", label: "Paper lifecycle evidence linked", status: "recorded" }],
      orderSubmitted: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      requiredConfirmations: [{ id: "paper-lifecycle-accepted", label: "Paper lifecycle accepted", status: "confirmed" }],
      blockedReasons: [],
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterPaperRouteRunbooks(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterPaperRouteRunbooks: [runbook] })
        };
      },
      5
    );

    expect(buildExecutionAdapterPaperRouteRunbookHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-paper-route-runbooks?adapterId=us-live&limit=5"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-paper-route-runbooks?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterPaperRouteRunbooks).toHaveLength(1);
    expect(result.adapterPaperRouteRunbooks[0].status).toBe("runbook_recorded");
    expect(result.adapterPaperRouteRunbooks[0].manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterPaperRouteRunbooks[0].routeExecuted).toBe(false);

    const missingValidation = await loadExecutionAdapterPaperRouteRunbooks(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => {
        const { manifestValidationId: _manifestValidationId, ...missingValidationRunbook } = runbook;
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterPaperRouteRunbooks: [missingValidationRunbook] })
        };
      },
      5
    );

    expect(missingValidation.source).toBe("fallback");
    expect(missingValidation.adapterPaperRouteRunbooks).toEqual([]);

    const rejected = await loadExecutionAdapterPaperRouteRunbooks(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterPaperRouteRunbooks: [
            {
              ...runbook,
              metadata: { token: "paper-route-runbook-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterPaperRouteRunbooks).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("paper-route-runbook-token-should-not-leak");
  });

  test("records adapter ops state without live enablement", async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : null
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterOpsState: {
            schemaVersion: 1,
            adapterOpsStateId: "execution-adapter-ops-state-us-live",
            paperRouteRunbookId: "execution-adapter-paper-route-runbook-us-live",
            paperOrderLifecycleId: "execution-adapter-paper-order-lifecycle-us-live",
            sandboxOrderSchemaDryRunId: "execution-adapter-sandbox-order-schema-dry-run-us-live",
            productionRouteReviewId: "execution-adapter-production-route-review-us-live",
            sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
            sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
            sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
            humanConfirmationId: "execution-adapter-human-confirmation-us-live",
            orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
            dryRunId: "execution-adapter-orchestration-dry-run-us-live",
            acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
            executionId: "execution-adapter-runtime-reload-execution-us-live",
            planId: "execution-adapter-runtime-reload-plan-us-live",
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "ops_state_recorded",
            operator: "adapter-ops-runner",
            recordedAt: "2026-06-09T11:24:00+00:00",
            opsMode: "manual_adapter_ops_state",
            runbookMode: "manual_paper_route_runbook",
            lifecycleMode: "manual_paper_order_lifecycle_adapter",
            dryRunMode: "manual_sandbox_order_schema_dry_run",
            reviewMode: "manual_production_route_review",
            sandboxReviewMode: "manual_sandbox_probe_review",
            probeExecutionMode: "manual_readonly_sandbox_probe",
            probeMode: "manual_sandbox_probe_plan",
            confirmationMode: "manual_final_human_confirmation",
            orchestrationExecutionMode: "manual_adapter_orchestration_execution",
            orchestrationMode: "manual_adapter_orchestration_dry_run",
            acceptanceMode: "manual_runtime_reload_acceptance",
            executionMode: "manual_controlled_reload",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "window-us-live-1",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            orderIntent: { symbol: "AAPL", side: "buy", type: "limit", quantity: 10, price: 191.2 },
            lifecycleSteps: [{ id: "intent-validated", label: "Order intent validated", status: "recorded" }],
            runbookSteps: [{ id: "lifecycle-evidence-linked", label: "Paper lifecycle evidence linked", status: "recorded" }],
            opsSteps: [
              { id: "paper-route-runbook-linked", label: "Paper route runbook linked", status: "recorded" },
              { id: "monitoring-channel-ready", label: "Monitoring channel ready", status: "recorded" },
              { id: "kill-switch-drill-recorded", label: "Kill switch drill recorded", status: "recorded" },
              { id: "paper-account-reconciled", label: "Paper account reconciled", status: "recorded" }
            ],
            orderSubmitted: false,
            liveOrderSubmitted: false,
            routeExecuted: false,
            requiredConfirmations: [
              { id: "paper-route-runbook-accepted", label: "Paper route runbook accepted", status: "confirmed" },
              { id: "monitoring-channel-ready", label: "Monitoring channel ready", status: "confirmed" },
              { id: "kill-switch-drill-recorded", label: "Kill switch drill recorded", status: "confirmed" },
              { id: "paper-account-reconciled", label: "Paper account reconciled", status: "confirmed" },
              { id: "operator-confirmed-live-trading-disabled", label: "Live trading disabled", status: "confirmed" }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-ops-state-us-live",
            eventType: "execution_adapter_ops_state",
            runId: "",
            createdAt: "2026-06-09T11:24:00+00:00",
            stage: "execution-adapter-ops-state",
            source: "execution-adapter-ledger",
            summary: "us-live adapter ops state recorded as ops_state_recorded.",
            detail: "Adapter ops state records monitoring and kill-switch readiness only.",
            metadata: {
              adapterOpsStateId: "execution-adapter-ops-state-us-live",
              paperRouteRunbookId: "execution-adapter-paper-route-runbook-us-live",
              manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
              adapterId: "us-live",
              status: "ops_state_recorded",
              routeExecuted: false,
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterOpsStateUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-ops-states"
    );

    const result = await recordExecutionAdapterOpsState(
      "/",
      {
        adapterId: "us-live",
        paperRouteRunbookId: "execution-adapter-paper-route-runbook-us-live",
        operator: "adapter-ops-runner",
        opsMode: "manual_adapter_ops_state",
        confirmations: {
          paperRouteRunbookAccepted: true,
          monitoringChannelReady: true,
          killSwitchDrillRecorded: true,
          paperAccountReconciled: true,
          operatorConfirmedLiveTradingDisabled: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual(["POST /api/execution/adapter-ops-states"]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      paperRouteRunbookId: "execution-adapter-paper-route-runbook-us-live",
      operator: "adapter-ops-runner",
      opsMode: "manual_adapter_ops_state",
      confirmations: {
        paperRouteRunbookAccepted: true,
        monitoringChannelReady: true,
        killSwitchDrillRecorded: true,
        paperAccountReconciled: true,
        operatorConfirmedLiveTradingDisabled: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterOpsState?.status).toBe("ops_state_recorded");
    expect(result.adapterOpsState?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterOpsState?.orderSubmitted).toBe(false);
    expect(result.adapterOpsState?.liveOrderSubmitted).toBe(false);
    expect(result.adapterOpsState?.routeExecuted).toBe(false);
    expect(result.adapterOpsState?.paperOnly).toBe(true);
    expect(result.adapterOpsState?.liveTradingAllowed).toBe(false);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_ops_state");
  });

  test("loads adapter ops state history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const opsState = {
      schemaVersion: 1,
      adapterOpsStateId: "execution-adapter-ops-state-us-live",
      paperRouteRunbookId: "execution-adapter-paper-route-runbook-us-live",
      paperOrderLifecycleId: "execution-adapter-paper-order-lifecycle-us-live",
      sandboxOrderSchemaDryRunId: "execution-adapter-sandbox-order-schema-dry-run-us-live",
      productionRouteReviewId: "execution-adapter-production-route-review-us-live",
      sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
      sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
      sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
      humanConfirmationId: "execution-adapter-human-confirmation-us-live",
      orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
      dryRunId: "execution-adapter-orchestration-dry-run-us-live",
      acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "ops_state_recorded",
      operator: "adapter-ops-runner",
      recordedAt: "2026-06-09T11:24:00+00:00",
      opsMode: "manual_adapter_ops_state",
      runbookMode: "manual_paper_route_runbook",
      lifecycleMode: "manual_paper_order_lifecycle_adapter",
      dryRunMode: "manual_sandbox_order_schema_dry_run",
      reviewMode: "manual_production_route_review",
      sandboxReviewMode: "manual_sandbox_probe_review",
      probeExecutionMode: "manual_readonly_sandbox_probe",
      probeMode: "manual_sandbox_probe_plan",
      confirmationMode: "manual_final_human_confirmation",
      orchestrationExecutionMode: "manual_adapter_orchestration_execution",
      orchestrationMode: "manual_adapter_orchestration_dry_run",
      acceptanceMode: "manual_runtime_reload_acceptance",
      executionMode: "manual_controlled_reload",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      orderIntent: { symbol: "AAPL", side: "buy", type: "limit", quantity: 10, price: 191.2 },
      lifecycleSteps: [{ id: "intent-validated", label: "Order intent validated", status: "recorded" }],
      runbookSteps: [{ id: "lifecycle-evidence-linked", label: "Paper lifecycle evidence linked", status: "recorded" }],
      opsSteps: [{ id: "paper-route-runbook-linked", label: "Paper route runbook linked", status: "recorded" }],
      orderSubmitted: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      requiredConfirmations: [
        { id: "paper-route-runbook-accepted", label: "Paper route runbook accepted", status: "confirmed" }
      ],
      blockedReasons: [],
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterOpsStates(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterOpsStates: [opsState] })
        };
      },
      5
    );

    expect(buildExecutionAdapterOpsStateHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-ops-states?adapterId=us-live&limit=5");
    expect(calls).toEqual(["http://127.0.0.1:8765/api/execution/adapter-ops-states?adapterId=us-live&limit=5"]);
    expect(result.source).toBe("core");
    expect(result.adapterOpsStates).toHaveLength(1);
    expect(result.adapterOpsStates[0].status).toBe("ops_state_recorded");
    expect(result.adapterOpsStates[0].manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterOpsStates[0].routeExecuted).toBe(false);

    const missingValidation = await loadExecutionAdapterOpsStates(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => {
        const { manifestValidationId: _manifestValidationId, ...missingValidationOpsState } = opsState;
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterOpsStates: [missingValidationOpsState] })
        };
      },
      5
    );

    expect(missingValidation.source).toBe("fallback");
    expect(missingValidation.adapterOpsStates).toEqual([]);

    const rejected = await loadExecutionAdapterOpsStates(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterOpsStates: [
            {
              ...opsState,
              metadata: { token: "adapter-ops-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterOpsStates).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("adapter-ops-token-should-not-leak");
  });

  test("records adapter paper execution without live routing", async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : null
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          adapterPaperExecution: {
            schemaVersion: 1,
            adapterPaperExecutionId: "execution-adapter-paper-execution-us-live",
            adapterOpsStateId: "execution-adapter-ops-state-us-live",
            paperRouteRunbookId: "execution-adapter-paper-route-runbook-us-live",
            paperOrderLifecycleId: "execution-adapter-paper-order-lifecycle-us-live",
            sandboxOrderSchemaDryRunId: "execution-adapter-sandbox-order-schema-dry-run-us-live",
            productionRouteReviewId: "execution-adapter-production-route-review-us-live",
            sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
            sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
            sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
            humanConfirmationId: "execution-adapter-human-confirmation-us-live",
            orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
            dryRunId: "execution-adapter-orchestration-dry-run-us-live",
            acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
            executionId: "execution-adapter-runtime-reload-execution-us-live",
            planId: "execution-adapter-runtime-reload-plan-us-live",
            bindingId: "execution-adapter-environment-binding-us-live",
            materializationId: "execution-adapter-secret-materialization-us-live",
            manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
            adapterId: "us-live",
            market: "us",
            route: "live",
            status: "paper_execution_recorded",
            operator: "paper-execution-runner",
            recordedAt: "2026-06-09T11:25:00+00:00",
            paperExecutionMode: "manual_adapter_paper_execution",
            opsMode: "manual_adapter_ops_state",
            runbookMode: "manual_paper_route_runbook",
            lifecycleMode: "manual_paper_order_lifecycle_adapter",
            dryRunMode: "manual_sandbox_order_schema_dry_run",
            reviewMode: "manual_production_route_review",
            sandboxReviewMode: "manual_sandbox_probe_review",
            probeExecutionMode: "manual_readonly_sandbox_probe",
            probeMode: "manual_sandbox_probe_plan",
            confirmationMode: "manual_final_human_confirmation",
            orchestrationExecutionMode: "manual_adapter_orchestration_execution",
            orchestrationMode: "manual_adapter_orchestration_dry_run",
            acceptanceMode: "manual_runtime_reload_acceptance",
            executionMode: "manual_controlled_reload",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "window-us-live-1",
            bindingMode: "container_env_reference",
            manifestPath: "local-secret-store://us-live/alpaca-sandbox",
            requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
            orderIntent: { symbol: "AAPL", side: "buy", type: "limit", quantity: 10, price: 191.2 },
            lifecycleSteps: [{ id: "intent-validated", label: "Order intent validated", status: "recorded" }],
            runbookSteps: [{ id: "lifecycle-evidence-linked", label: "Paper lifecycle evidence linked", status: "recorded" }],
            opsSteps: [{ id: "paper-route-runbook-linked", label: "Paper route runbook linked", status: "recorded" }],
            paperExecutionSteps: [
              { id: "ops-state-linked", label: "Adapter ops state linked", status: "recorded" },
              { id: "paper-account-synced", label: "Paper account synced", status: "recorded" },
              { id: "risk-budget-bound", label: "Risk budget bound", status: "recorded" },
              { id: "simulated-fill-recorded", label: "Simulated fill recorded", status: "recorded" }
            ],
            simulatedFill: {
              fillId: "paper-fill-execution-adapter-paper-execution-us-live",
              status: "filled",
              symbol: "AAPL",
              side: "buy",
              type: "limit",
              quantity: 10,
              price: 191.2,
              timeInForce: "GTC",
              source: "local-paper-ledger",
              orderSubmitted: false,
              liveOrderSubmitted: false,
              routeExecuted: false
            },
            paperFillRecorded: true,
            orderSubmitted: false,
            liveOrderSubmitted: false,
            routeExecuted: false,
            requiredConfirmations: [
              { id: "ops-state-accepted", label: "Ops state accepted", status: "confirmed" },
              { id: "paper-account-synced", label: "Paper account synced", status: "confirmed" },
              { id: "risk-budget-bound", label: "Risk budget bound", status: "confirmed" },
              { id: "simulated-fill-generated", label: "Simulated fill generated", status: "confirmed" },
              { id: "operator-confirmed-no-live-routing", label: "No live routing", status: "confirmed" }
            ],
            blockedReasons: [],
            metadata: { source: "settings-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "execution-adapter-paper-execution-us-live",
            eventType: "execution_adapter_paper_execution",
            runId: "",
            createdAt: "2026-06-09T11:25:00+00:00",
            stage: "execution-adapter-paper-execution",
            source: "execution-adapter-ledger",
            summary: "us-live adapter paper execution recorded as paper_execution_recorded.",
            detail: "Adapter paper execution records local simulated fill evidence only.",
            metadata: {
              adapterPaperExecutionId: "execution-adapter-paper-execution-us-live",
              adapterOpsStateId: "execution-adapter-ops-state-us-live",
              manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
              adapterId: "us-live",
              status: "paper_execution_recorded",
              orderSubmitted: false,
              liveOrderSubmitted: false,
              routeExecuted: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildExecutionAdapterPaperExecutionUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/execution/adapter-paper-executions"
    );

    const result = await recordExecutionAdapterPaperExecution(
      "/",
      {
        adapterId: "us-live",
        adapterOpsStateId: "execution-adapter-ops-state-us-live",
        operator: "paper-execution-runner",
        paperExecutionMode: "manual_adapter_paper_execution",
        confirmations: {
          opsStateAccepted: true,
          paperAccountSynced: true,
          riskBudgetBound: true,
          simulatedFillGenerated: true,
          operatorConfirmedNoLiveRouting: true
        },
        metadata: { source: "settings-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/execution/adapter-paper-executions"
    ]);
    expect(calls[0]?.body).toEqual({
      adapterId: "us-live",
      adapterOpsStateId: "execution-adapter-ops-state-us-live",
      operator: "paper-execution-runner",
      paperExecutionMode: "manual_adapter_paper_execution",
      confirmations: {
        opsStateAccepted: true,
        paperAccountSynced: true,
        riskBudgetBound: true,
        simulatedFillGenerated: true,
        operatorConfirmedNoLiveRouting: true
      },
      metadata: { source: "settings-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.adapterPaperExecution?.status).toBe("paper_execution_recorded");
    expect(result.adapterPaperExecution?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterPaperExecution?.simulatedFill.status).toBe("filled");
    expect(result.adapterPaperExecution?.paperFillRecorded).toBe(true);
    expect(result.adapterPaperExecution?.orderSubmitted).toBe(false);
    expect(result.adapterPaperExecution?.liveOrderSubmitted).toBe(false);
    expect(result.adapterPaperExecution?.routeExecuted).toBe(false);
    expect(result.adapterPaperExecution?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("execution_adapter_paper_execution");
  });

  test("reuses existing adapter paper execution on duplicate submission", async () => {
    const existingPaperExecution = {
      schemaVersion: 1,
      adapterPaperExecutionId: "execution-adapter-paper-execution-us-live-existing",
      adapterOpsStateId: "execution-adapter-ops-state-us-live",
      paperRouteRunbookId: "execution-adapter-paper-route-runbook-us-live",
      paperOrderLifecycleId: "execution-adapter-paper-order-lifecycle-us-live",
      sandboxOrderSchemaDryRunId: "execution-adapter-sandbox-order-schema-dry-run-us-live",
      productionRouteReviewId: "execution-adapter-production-route-review-us-live",
      sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
      sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
      sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
      humanConfirmationId: "execution-adapter-human-confirmation-us-live",
      orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
      dryRunId: "execution-adapter-orchestration-dry-run-us-live",
      acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "paper_execution_recorded",
      operator: "paper-execution-runner",
      recordedAt: "2026-06-09T11:25:00+00:00",
      paperExecutionMode: "manual_adapter_paper_execution",
      opsMode: "manual_adapter_ops_state",
      runbookMode: "manual_paper_route_runbook",
      lifecycleMode: "manual_paper_order_lifecycle_adapter",
      dryRunMode: "manual_sandbox_order_schema_dry_run",
      reviewMode: "manual_production_route_review",
      sandboxReviewMode: "manual_sandbox_probe_review",
      probeExecutionMode: "manual_readonly_sandbox_probe",
      probeMode: "manual_sandbox_probe_plan",
      confirmationMode: "manual_final_human_confirmation",
      orchestrationExecutionMode: "manual_adapter_orchestration_execution",
      orchestrationMode: "manual_adapter_orchestration_dry_run",
      acceptanceMode: "manual_runtime_reload_acceptance",
      executionMode: "manual_controlled_reload",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      orderIntent: { symbol: "AAPL", side: "buy", type: "limit", quantity: 10, price: 191.2 },
      lifecycleSteps: [{ id: "intent-validated", label: "Order intent validated", status: "recorded" }],
      runbookSteps: [{ id: "lifecycle-evidence-linked", label: "Paper lifecycle evidence linked", status: "recorded" }],
      opsSteps: [{ id: "paper-route-runbook-linked", label: "Paper route runbook linked", status: "recorded" }],
      paperExecutionSteps: [{ id: "simulated-fill-recorded", label: "Simulated fill recorded", status: "recorded" }],
      simulatedFill: {
        fillId: "paper-fill-execution-adapter-paper-execution-us-live-existing",
        status: "filled",
        symbol: "AAPL",
        side: "buy",
        type: "limit",
        quantity: 10,
        price: 191.2,
        timeInForce: "GTC",
        source: "local-paper-ledger",
        orderSubmitted: false,
        liveOrderSubmitted: false,
        routeExecuted: false
      },
      paperFillRecorded: true,
      orderSubmitted: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      requiredConfirmations: [{ id: "ops-state-accepted", label: "Ops state accepted", status: "confirmed" }],
      blockedReasons: [],
      metadata: { source: "settings-panel" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await recordExecutionAdapterPaperExecution(
      "http://127.0.0.1:8765/",
      {
        adapterId: "us-live",
        adapterOpsStateId: "execution-adapter-ops-state-us-live",
        confirmations: {
          opsStateAccepted: true,
          paperAccountSynced: true,
          riskBudgetBound: true,
          simulatedFillGenerated: true,
          operatorConfirmedNoLiveRouting: true
        }
      },
      async () => ({
        ok: false,
        status: 409,
        json: async () => ({
          error: "execution_adapter_paper_execution_already_recorded",
          existingAdapterPaperExecution: existingPaperExecution
        })
      })
    );

    expect(result.source).toBe("core");
    expect(result.error).toBe("execution_adapter_paper_execution_already_recorded");
    expect(result.adapterPaperExecution?.adapterPaperExecutionId).toBe(
      "execution-adapter-paper-execution-us-live-existing"
    );
    expect(result.adapterPaperExecution?.paperFillRecorded).toBe(true);
  });

  test("loads adapter paper execution history and rejects unredacted metadata", async () => {
    const calls: string[] = [];
    const paperExecution = {
      schemaVersion: 1,
      adapterPaperExecutionId: "execution-adapter-paper-execution-us-live",
      adapterOpsStateId: "execution-adapter-ops-state-us-live",
      paperRouteRunbookId: "execution-adapter-paper-route-runbook-us-live",
      paperOrderLifecycleId: "execution-adapter-paper-order-lifecycle-us-live",
      sandboxOrderSchemaDryRunId: "execution-adapter-sandbox-order-schema-dry-run-us-live",
      productionRouteReviewId: "execution-adapter-production-route-review-us-live",
      sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-us-live",
      sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-us-live",
      sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-us-live",
      humanConfirmationId: "execution-adapter-human-confirmation-us-live",
      orchestrationExecutionId: "execution-adapter-orchestration-execution-us-live",
      dryRunId: "execution-adapter-orchestration-dry-run-us-live",
      acceptanceId: "execution-adapter-runtime-reload-acceptance-us-live",
      executionId: "execution-adapter-runtime-reload-execution-us-live",
      planId: "execution-adapter-runtime-reload-plan-us-live",
      bindingId: "execution-adapter-environment-binding-us-live",
      materializationId: "execution-adapter-secret-materialization-us-live",
      manifestValidationId: "execution-adapter-secret-manifest-validation-us-live",
      adapterId: "us-live",
      market: "us",
      route: "live",
      status: "paper_execution_recorded",
      operator: "paper-execution-runner",
      recordedAt: "2026-06-09T11:25:00+00:00",
      paperExecutionMode: "manual_adapter_paper_execution",
      opsMode: "manual_adapter_ops_state",
      runbookMode: "manual_paper_route_runbook",
      lifecycleMode: "manual_paper_order_lifecycle_adapter",
      dryRunMode: "manual_sandbox_order_schema_dry_run",
      reviewMode: "manual_production_route_review",
      sandboxReviewMode: "manual_sandbox_probe_review",
      probeExecutionMode: "manual_readonly_sandbox_probe",
      probeMode: "manual_sandbox_probe_plan",
      confirmationMode: "manual_final_human_confirmation",
      orchestrationExecutionMode: "manual_adapter_orchestration_execution",
      orchestrationMode: "manual_adapter_orchestration_dry_run",
      acceptanceMode: "manual_runtime_reload_acceptance",
      executionMode: "manual_controlled_reload",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "window-us-live-1",
      bindingMode: "container_env_reference",
      manifestPath: "local-secret-store://us-live/alpaca-sandbox",
      requiredEnvVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
      orderIntent: { symbol: "AAPL", side: "buy", type: "limit", quantity: 10, price: 191.2 },
      lifecycleSteps: [{ id: "intent-validated", label: "Order intent validated", status: "recorded" }],
      runbookSteps: [{ id: "lifecycle-evidence-linked", label: "Paper lifecycle evidence linked", status: "recorded" }],
      opsSteps: [{ id: "paper-route-runbook-linked", label: "Paper route runbook linked", status: "recorded" }],
      paperExecutionSteps: [{ id: "ops-state-linked", label: "Adapter ops state linked", status: "recorded" }],
      simulatedFill: {
        fillId: "paper-fill-execution-adapter-paper-execution-us-live",
        status: "filled",
        symbol: "AAPL",
        side: "buy",
        type: "limit",
        quantity: 10,
        price: 191.2,
        timeInForce: "GTC",
        source: "local-paper-ledger",
        orderSubmitted: false,
        liveOrderSubmitted: false,
        routeExecuted: false
      },
      paperFillRecorded: true,
      orderSubmitted: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      requiredConfirmations: [{ id: "ops-state-accepted", label: "Ops state accepted", status: "confirmed" }],
      blockedReasons: [],
      metadata: { source: "settings-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const result = await loadExecutionAdapterPaperExecutions(
      "http://127.0.0.1:8765/",
      "us-live",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ adapterPaperExecutions: [paperExecution] })
        };
      },
      5
    );

    expect(buildExecutionAdapterPaperExecutionHistoryUrl("http://127.0.0.1:8765/", {
      adapterId: "us-live",
      limit: 5
    })).toBe("http://127.0.0.1:8765/api/execution/adapter-paper-executions?adapterId=us-live&limit=5");
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/execution/adapter-paper-executions?adapterId=us-live&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.adapterPaperExecutions).toHaveLength(1);
    expect(result.adapterPaperExecutions[0].status).toBe("paper_execution_recorded");
    expect(result.adapterPaperExecutions[0].manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-us-live"
    );
    expect(result.adapterPaperExecutions[0].paperFillRecorded).toBe(true);

    const rejected = await loadExecutionAdapterPaperExecutions(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          adapterPaperExecutions: [
            {
              ...paperExecution,
              metadata: { token: "adapter-paper-execution-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.adapterPaperExecutions).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("adapter-paper-execution-token-should-not-leak");

    const { manifestValidationId: _manifestValidationId, ...missingValidationPaperExecution } = paperExecution;
    const missingValidation = await loadExecutionAdapterPaperExecutions(
      "http://127.0.0.1:8765/",
      "us-live",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({ adapterPaperExecutions: [missingValidationPaperExecution] })
      }),
      5
    );

    expect(missingValidation.source).toBe("fallback");
    expect(missingValidation.adapterPaperExecutions).toEqual([]);
  });

  test("loads audit signing key registry without exposing secrets", async () => {
    const calls: string[] = [];
    const result = await loadAuditSigningKeys("http://127.0.0.1:8765/", async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          registry: {
            schemaVersion: 1,
            generatedAt: "2026-06-04T09:45:00+00:00",
            activeKeyId: "active-audit-key",
            rotationRequired: false,
            keys: [
              {
                keyId: "active-audit-key",
                signer: "Active Audit Key",
                algorithm: "hmac-sha256",
                chainId: "audit-chain-active",
                status: "active",
                source: "env",
                fingerprint: "a".repeat(16),
                canSign: true,
                canVerify: true,
                createdAt: null,
                activatedAt: "2026-06-04T09:45:00+00:00",
                retiredAt: null
              },
              {
                keyId: "legacy-audit-key",
                signer: "Legacy Audit Key",
                algorithm: "hmac-sha256",
                chainId: "audit-chain-legacy",
                status: "retired",
                source: "registry",
                fingerprint: "b".repeat(16),
                canSign: false,
                canVerify: true,
                createdAt: "2026-05-01T00:00:00+00:00",
                activatedAt: null,
                retiredAt: "2026-06-01T00:00:00+00:00"
              }
            ]
          }
        })
      };
    });

    expect(buildAuditSigningKeysUrl("http://127.0.0.1:8765")).toBe("http://127.0.0.1:8765/api/audit/signing-keys");
    expect(calls).toEqual(["http://127.0.0.1:8765/api/audit/signing-keys"]);
    expect(result.source).toBe("core");
    expect(result.registry?.activeKeyId).toBe("active-audit-key");
    expect(result.registry?.keys.map((key) => `${key.keyId}:${key.status}:${key.canVerify}`)).toEqual([
      "active-audit-key:active:true",
      "legacy-audit-key:retired:true"
    ]);
    expect(JSON.stringify(result.registry)).not.toContain("secret");
  });

  test("rejects audit signing key registry payloads that expose secret material", async () => {
    const result = await loadAuditSigningKeys("http://127.0.0.1:8765/", async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        registry: {
          schemaVersion: 1,
          generatedAt: "2026-06-04T09:45:00+00:00",
          activeKeyId: "active-audit-key",
          rotationRequired: false,
          keys: [
            {
              keyId: "active-audit-key",
              signer: "Active Audit Key",
              algorithm: "hmac-sha256",
              chainId: "audit-chain-active",
              status: "active",
              source: "env",
              fingerprint: "a".repeat(16),
              canSign: true,
              canVerify: true,
              createdAt: null,
              activatedAt: "2026-06-04T09:45:00+00:00",
              retiredAt: null,
              secret: "must-not-cross-wire"
            }
          ]
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid audit signing key registry contract");
  });

  test("prepares an audit signing key rotation plan without exposing secrets", async () => {
    const calls: Array<{ init?: RequestInit; url: string }> = [];
    const result = await prepareAuditSigningKeyRotationPlan(
      "http://127.0.0.1:8765/",
      {
        proposedChainId: "audit-chain-next",
        proposedKeyId: "next-audit-key",
        proposedSigner: "Next Audit Key"
      },
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          status: 200,
          json: async () => ({
            rotationPlan: {
              schemaVersion: 1,
              generatedAt: "2026-06-04T10:30:00+00:00",
              currentActiveKey: {
                keyId: "active-audit-key",
                signer: "Active Audit Key",
                chainId: "audit-chain-active",
                fingerprint: "a".repeat(16)
              },
              proposedActiveKey: {
                keyId: "next-audit-key",
                signer: "Next Audit Key",
                chainId: "audit-chain-next"
              },
              rotationRequired: true,
              requiresRestart: true,
              environmentUpdates: [
                { name: "AIQT_AUDIT_SIGNING_KEY_ID", value: "next-audit-key", sensitivity: "public" },
                { name: "AIQT_AUDIT_SIGNER_NAME", value: "Next Audit Key", sensitivity: "public" },
                { name: "AIQT_AUDIT_CHAIN_ID", value: "audit-chain-next", sensitivity: "public" },
                { name: "AIQT_AUDIT_SIGNING_SECRET", value: "<set-new-key-material-outside-ui>", sensitivity: "secret" },
                {
                  name: "AIQT_AUDIT_SIGNING_KEYS_JSON",
                  value:
                    '[{"keyId":"active-audit-key","signer":"Active Audit Key","chainId":"audit-chain-active","status":"retired","secret":"<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>"}]',
                  sensitivity: "secret"
                }
              ],
              legacyRegistryTemplate:
                '[{"keyId":"active-audit-key","signer":"Active Audit Key","chainId":"audit-chain-active","status":"retired","secret":"<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>"}]',
              steps: [
                { id: "set-new-active-key", title: "Set new active key", detail: "Update active env vars.", status: "manual" },
                { id: "verify-legacy-reports", title: "Verify legacy reports", detail: "Keep retired key available.", status: "required" }
              ],
              blockedReasons: []
            }
          })
        };
      }
    );

    expect(buildAuditSigningKeyRotationPlanUrl("http://127.0.0.1:8765")).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/rotation-plan"
    );
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/audit/signing-keys/rotation-plan");
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      proposedChainId: "audit-chain-next",
      proposedKeyId: "next-audit-key",
      proposedSigner: "Next Audit Key"
    });
    expect(result.source).toBe("core");
    expect(result.rotationPlan?.proposedActiveKey.keyId).toBe("next-audit-key");
    expect(result.rotationPlan?.steps.map((step) => step.id)).toContain("verify-legacy-reports");
    expect(JSON.stringify(result.rotationPlan)).not.toContain("active-audit-secret");
  });

  test("rejects audit signing key rotation plans that expose raw secret material", async () => {
    const result = await prepareAuditSigningKeyRotationPlan("http://127.0.0.1:8765/", {}, async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        rotationPlan: {
          schemaVersion: 1,
          generatedAt: "2026-06-04T10:30:00+00:00",
          currentActiveKey: {
            keyId: "active-audit-key",
            signer: "Active Audit Key",
            chainId: "audit-chain-active",
            fingerprint: "a".repeat(16),
            secretMaterial: "active-audit-secret"
          },
          proposedActiveKey: {
            keyId: "next-audit-key",
            signer: "Next Audit Key",
            chainId: "audit-chain-next"
          },
          rotationRequired: true,
          requiresRestart: true,
          environmentUpdates: [],
          legacyRegistryTemplate: "[]",
          steps: [],
          blockedReasons: []
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid audit signing key rotation plan contract");
  });

  test("preflights audit signing key rotation apply without exposing secrets", async () => {
    const calls: Array<{ init?: RequestInit; url: string }> = [];
    const rotationPlan = {
      schemaVersion: 1 as const,
      generatedAt: "2026-06-04T10:30:00+00:00",
      currentActiveKey: {
        keyId: "active-audit-key",
        signer: "Active Audit Key",
        chainId: "audit-chain-active",
        fingerprint: "a".repeat(16)
      },
      proposedActiveKey: {
        keyId: "next-audit-key",
        signer: "Next Audit Key",
        chainId: "audit-chain-next"
      },
      rotationRequired: true,
      requiresRestart: true,
      environmentUpdates: [
        { name: "AIQT_AUDIT_SIGNING_KEY_ID", value: "next-audit-key", sensitivity: "public" as const },
        { name: "AIQT_AUDIT_SIGNING_SECRET", value: "<set-new-key-material-outside-ui>", sensitivity: "secret" as const },
        { name: "AIQT_AUDIT_SIGNING_KEYS_JSON", value: "legacy-template-placeholder", sensitivity: "secret" as const }
      ],
      legacyRegistryTemplate: "legacy-template-placeholder",
      steps: [
        { id: "set-new-active-key", title: "Set new active key", detail: "Update active env vars.", status: "manual" as const }
      ],
      blockedReasons: []
    };
    const result = await applyAuditSigningKeyRotationPlan(
      "http://127.0.0.1:8765/",
      {
        confirmations: {
          legacySecretStored: false,
          newSecretMaterialStored: false,
          operatorReviewedPlan: false
        },
        rotationPlan
      },
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: false,
          status: 409,
          json: async () => ({
            rotationApply: {
              schemaVersion: 1,
              generatedAt: "2026-06-04T10:35:00+00:00",
              status: "blocked",
              applyMode: "manual_secret_store",
              auditEventType: "audit_signing_key_rotation_apply",
              currentActiveKeyId: "active-audit-key",
              currentActiveKeyFingerprint: "a".repeat(16),
              proposedActiveKeyId: "next-audit-key",
              proposedSigner: "Next Audit Key",
              proposedChainId: "audit-chain-next",
              restartRequired: true,
              requiredConfirmations: [
                {
                  id: "new-secret-material-stored",
                  label: "New signing secret generated and stored outside the UI",
                  status: "missing"
                },
                {
                  id: "legacy-secret-stored",
                  label: "Current active secret copied into the legacy registry outside the UI",
                  status: "missing"
                },
                {
                  id: "operator-reviewed-plan",
                  label: "Operator reviewed key ids, fingerprints, and restart impact",
                  status: "missing"
                }
              ],
              blockedReasons: [
                "new_secret_material_not_confirmed",
                "legacy_secret_not_confirmed",
                "operator_review_not_confirmed"
              ],
              environmentUpdateNames: [
                "AIQT_AUDIT_SIGNING_KEY_ID",
                "AIQT_AUDIT_SIGNING_SECRET",
                "AIQT_AUDIT_SIGNING_KEYS_JSON"
              ],
              secretPlaceholderNames: ["AIQT_AUDIT_SIGNING_SECRET", "AIQT_AUDIT_SIGNING_KEYS_JSON"]
            }
          })
        };
      }
    );

    expect(buildAuditSigningKeyRotationApplyUrl("http://127.0.0.1:8765")).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/rotation-apply"
    );
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/audit/signing-keys/rotation-apply");
    expect(calls[0].init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      confirmations: {
        legacySecretStored: false,
        newSecretMaterialStored: false,
        operatorReviewedPlan: false
      },
      rotationPlan
    });
    expect(result.source).toBe("core");
    expect(result.rotationApply?.status).toBe("blocked");
    expect(result.rotationApply?.blockedReasons).toEqual([
      "new_secret_material_not_confirmed",
      "legacy_secret_not_confirmed",
      "operator_review_not_confirmed"
    ]);
    expect(result.rotationApply?.secretPlaceholderNames).toEqual([
      "AIQT_AUDIT_SIGNING_SECRET",
      "AIQT_AUDIT_SIGNING_KEYS_JSON"
    ]);
    expect(JSON.stringify(result.rotationApply)).not.toContain("active-audit-secret");
    expect(JSON.stringify(result.rotationApply)).not.toContain("<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>");
  });

  test("rejects audit signing key rotation apply payloads that expose raw secret material", async () => {
    const result = await applyAuditSigningKeyRotationPlan(
      "http://127.0.0.1:8765/",
      {
        confirmations: {},
        rotationPlan: {
          schemaVersion: 1,
          generatedAt: "2026-06-04T10:30:00+00:00",
          currentActiveKey: { keyId: "active-audit-key", signer: "Active Audit Key", chainId: "audit-chain-active", fingerprint: "a".repeat(16) },
          proposedActiveKey: { keyId: "next-audit-key", signer: "Next Audit Key", chainId: "audit-chain-next" },
          rotationRequired: true,
          requiresRestart: true,
          environmentUpdates: [],
          legacyRegistryTemplate: "[]",
          steps: [],
          blockedReasons: []
        }
      },
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          rotationApply: {
            schemaVersion: 1,
            generatedAt: "2026-06-04T10:35:00+00:00",
            status: "ready_for_restart",
            applyMode: "manual_secret_store",
            auditEventType: "audit_signing_key_rotation_apply",
            currentActiveKeyId: "active-audit-key",
            currentActiveKeyFingerprint: "a".repeat(16),
            proposedActiveKeyId: "next-audit-key",
            proposedSigner: "Next Audit Key",
            proposedChainId: "audit-chain-next",
            restartRequired: true,
            requiredConfirmations: [],
            blockedReasons: [],
            environmentUpdateNames: [],
            secretPlaceholderNames: [],
            secret: "active-audit-secret"
          }
        })
      })
    );

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid audit signing key rotation apply contract");
  });

  test("records audit signing key controlled restart evidence without enabling live signing", async () => {
    const calls: Array<{ body: unknown; method: string; url: string }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        body: init?.body ? JSON.parse(String(init.body)) : null,
        method: init?.method ?? "GET",
        url
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          restartEvidence: {
            schemaVersion: 1,
            evidenceId: "audit-signing-key-controlled-restart-next-audit-key",
            applyEventId: "audit-signing-key-rotation-apply-next-audit-key-test",
            currentActiveKeyId: "active-audit-key",
            currentActiveKeyFingerprint: "a".repeat(16),
            proposedActiveKeyId: "next-audit-key",
            proposedSigner: "Next Audit Key",
            proposedChainId: "audit-chain-next",
            status: "evidence_recorded",
            operator: "audit-operator",
            recordedAt: "2026-06-04T10:45:00+00:00",
            evidenceMode: "manual_controlled_restart",
            restartRequired: true,
            requiredConfirmations: [
              {
                id: "restart-window-executed",
                label: "Controlled restart window was executed",
                status: "confirmed"
              },
              {
                id: "rollback-plan-confirmed",
                label: "Rollback plan is available and confirmed",
                status: "confirmed"
              },
              {
                id: "post-restart-validation-passed",
                label: "Post-restart validation passed",
                status: "confirmed"
              },
              {
                id: "operator-reviewed-restart-logs",
                label: "Operator reviewed restart logs and audit signing status",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { ticket: "CHG-42", apiKey: "[redacted]" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "audit-signing-key-controlled-restart-next-audit-key",
            eventType: "audit_signing_key_controlled_restart_evidence",
            runId: "audit-signing-key-rotation",
            createdAt: "2026-06-04T10:45:00+00:00",
            stage: "audit-signing-key-controlled-restart",
            source: "audit-signing-key-ledger",
            summary: "Audit signing key controlled restart evidence recorded.",
            detail: "Controlled restart evidence is paper-only.",
            metadata: {
              evidenceId: "audit-signing-key-controlled-restart-next-audit-key",
              applyEventId: "audit-signing-key-rotation-apply-next-audit-key-test",
              status: "evidence_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildAuditSigningKeyRotationRestartEvidenceUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/rotation-restart-evidence"
    );

    const result = await recordAuditSigningKeyControlledRestartEvidence(
      "/",
      {
        applyEventId: "audit-signing-key-rotation-apply-next-audit-key-test",
        operator: "audit-operator",
        confirmations: {
          restartWindowExecuted: true,
          rollbackPlanConfirmed: true,
          postRestartValidationPassed: true,
          operatorReviewedRestartLogs: true
        },
        metadata: { ticket: "CHG-42" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/audit/signing-keys/rotation-restart-evidence"
    ]);
    expect(calls[0]?.body).toEqual({
      applyEventId: "audit-signing-key-rotation-apply-next-audit-key-test",
      operator: "audit-operator",
      confirmations: {
        restartWindowExecuted: true,
        rollbackPlanConfirmed: true,
        postRestartValidationPassed: true,
        operatorReviewedRestartLogs: true
      },
      metadata: { ticket: "CHG-42" }
    });
    expect(result.source).toBe("core");
    expect(result.restartEvidence?.status).toBe("evidence_recorded");
    expect(result.restartEvidence?.applyEventId).toBe("audit-signing-key-rotation-apply-next-audit-key-test");
    expect(result.restartEvidence?.metadata.apiKey).toBe("[redacted]");
    expect(result.restartEvidence?.liveTradingAllowed).toBe(false);
    expect(result.restartEvidence?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("audit_signing_key_controlled_restart_evidence");
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("records audit signing key secret materialization manifests without raw secrets", async () => {
    const calls: Array<{ body: unknown; method: string; url: string }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        body: init?.body ? JSON.parse(String(init.body)) : null,
        method: init?.method ?? "GET",
        url
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          secretMaterialization: {
            schemaVersion: 1,
            materializationId: "audit-signing-key-secret-materialization-next-audit-key",
            planEventId: "audit-signing-key-rotation-next-audit-key-test",
            currentActiveKeyId: "active-audit-key",
            currentActiveKeyFingerprint: "a".repeat(16),
            proposedActiveKeyId: "next-audit-key",
            proposedSigner: "Next Audit Key",
            proposedChainId: "audit-chain-next",
            status: "manifest_recorded",
            operator: "audit-operator",
            recordedAt: "2026-06-04T10:40:00+00:00",
            materializationMode: "local_secret_store_manifest",
            backend: "local-secret-store",
            manifestPath: "local-secret-store://audit-signing/next-audit-key",
            requiredEnvVars: [
              "AIQT_AUDIT_SIGNING_KEY_ID",
              "AIQT_AUDIT_SIGNING_SECRET",
              "AIQT_AUDIT_SIGNING_KEYS_JSON"
            ],
            secretPlaceholderNames: ["AIQT_AUDIT_SIGNING_SECRET", "AIQT_AUDIT_SIGNING_KEYS_JSON"],
            requiredConfirmations: [
              { id: "local-secret-store-write-verified", label: "Local secret-store write was verified", status: "confirmed" },
              { id: "raw-secret-boundary-confirmed", label: "No raw secret is present in this payload", status: "confirmed" },
              { id: "env-binding-plan-documented", label: "Environment binding plan is documented", status: "confirmed" },
              { id: "rollback-plan-documented", label: "Rollback plan is documented", status: "confirmed" }
            ],
            blockedReasons: [],
            metadata: { fingerprint: "sha256:next-audit-key", apiKey: "[redacted]" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "audit-signing-key-secret-materialization-next-audit-key",
            eventType: "audit_signing_key_secret_materialization",
            runId: "audit-signing-key-rotation",
            createdAt: "2026-06-04T10:40:00+00:00",
            stage: "audit-signing-key-secret-materialization",
            source: "audit-signing-key-ledger",
            summary: "Audit signing key secret materialization manifest recorded.",
            detail: "Secret materialization is paper-only.",
            metadata: {
              materializationId: "audit-signing-key-secret-materialization-next-audit-key",
              planEventId: "audit-signing-key-rotation-next-audit-key-test",
              status: "manifest_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildAuditSigningKeySecretMaterializationUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/secret-materializations"
    );

    const result = await recordAuditSigningKeySecretMaterialization(
      "/",
      {
        backend: "local-secret-store",
        confirmations: {
          localSecretStoreWriteVerified: true,
          noRawSecretInPayload: true,
          envBindingPlanDocumented: true,
          rollbackPlanDocumented: true
        },
        manifestPath: "local-secret-store://audit-signing/next-audit-key",
        metadata: { fingerprint: "sha256:next-audit-key" },
        operator: "audit-operator",
        planEventId: "audit-signing-key-rotation-next-audit-key-test"
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/audit/signing-keys/secret-materializations"
    ]);
    expect(calls[0]?.body).toEqual({
      backend: "local-secret-store",
      confirmations: {
        localSecretStoreWriteVerified: true,
        noRawSecretInPayload: true,
        envBindingPlanDocumented: true,
        rollbackPlanDocumented: true
      },
      manifestPath: "local-secret-store://audit-signing/next-audit-key",
      metadata: { fingerprint: "sha256:next-audit-key" },
      operator: "audit-operator",
      planEventId: "audit-signing-key-rotation-next-audit-key-test"
    });
    expect(result.source).toBe("core");
    expect(result.secretMaterialization?.status).toBe("manifest_recorded");
    expect(result.secretMaterialization?.proposedActiveKeyId).toBe("next-audit-key");
    expect(result.secretMaterialization?.metadata.apiKey).toBe("[redacted]");
    expect(result.secretMaterialization?.liveTradingAllowed).toBe(false);
    expect(result.secretMaterialization?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("audit_signing_key_secret_materialization");
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("loads audit signing key secret materialization history from the local core", async () => {
    const calls: string[] = [];
    const result = await loadAuditSigningKeySecretMaterializations(
      "http://127.0.0.1:8765/",
      "next-audit-key",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            secretMaterializations: [
              {
                schemaVersion: 1,
                materializationId: "audit-signing-key-secret-materialization-next-audit-key",
                planEventId: "audit-signing-key-rotation-next-audit-key-test",
                currentActiveKeyId: "active-audit-key",
                currentActiveKeyFingerprint: "a".repeat(16),
                proposedActiveKeyId: "next-audit-key",
                proposedSigner: "Next Audit Key",
                proposedChainId: "audit-chain-next",
                status: "manifest_recorded",
                operator: "audit-operator",
                recordedAt: "2026-06-04T10:40:00+00:00",
                materializationMode: "local_secret_store_manifest",
                backend: "local-secret-store",
                manifestPath: "local-secret-store://audit-signing/next-audit-key",
                requiredEnvVars: ["AIQT_AUDIT_SIGNING_SECRET"],
                secretPlaceholderNames: ["AIQT_AUDIT_SIGNING_SECRET"],
                requiredConfirmations: [
                  { id: "local-secret-store-write-verified", label: "Local secret-store write was verified", status: "confirmed" },
                  { id: "raw-secret-boundary-confirmed", label: "No raw secret is present in this payload", status: "confirmed" },
                  { id: "env-binding-plan-documented", label: "Environment binding plan is documented", status: "confirmed" },
                  { id: "rollback-plan-documented", label: "Rollback plan is documented", status: "confirmed" }
                ],
                blockedReasons: [],
                metadata: { apiKey: "[redacted]" },
                liveTradingAllowed: false,
                paperOnly: true
              }
            ]
          })
        };
      },
      5
    );

    expect(buildAuditSigningKeySecretMaterializationHistoryUrl("http://127.0.0.1:8765/", {
      limit: 5,
      proposedKeyId: "next-audit-key"
    })).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/secret-materializations?proposedKeyId=next-audit-key&limit=5"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/audit/signing-keys/secret-materializations?proposedKeyId=next-audit-key&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.secretMaterializations).toHaveLength(1);
    expect(result.secretMaterializations[0].status).toBe("manifest_recorded");
    expect(result.secretMaterializations[0].liveTradingAllowed).toBe(false);
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("records an audit signing key environment binding without raw secret material", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          environmentBinding: {
            schemaVersion: 1,
            bindingId: "audit-signing-key-environment-binding-next-audit-key",
            materializationId: "audit-signing-key-secret-materialization-next-audit-key",
            planEventId: "audit-signing-key-rotation-next-audit-key-test",
            currentActiveKeyId: "active-audit-key",
            currentActiveKeyFingerprint: "a".repeat(16),
            proposedActiveKeyId: "next-audit-key",
            proposedSigner: "Next Audit Key",
            proposedChainId: "audit-chain-next",
            status: "binding_recorded",
            operator: "audit-operator",
            recordedAt: "2026-06-04T10:50:00+00:00",
            bindingMode: "container_env_reference",
            backend: "local-secret-store",
            manifestPath: "local-secret-store://audit-signing/next-audit-key",
            requiredEnvVars: [
              "AIQT_AUDIT_SIGNING_KEY_ID",
              "AIQT_AUDIT_SIGNER_NAME",
              "AIQT_AUDIT_CHAIN_ID",
              "AIQT_AUDIT_SIGNING_SECRET",
              "AIQT_AUDIT_SIGNING_KEYS_JSON"
            ],
            requiredConfirmations: [
              { id: "runtime-env-mapping-verified", label: "Runtime environment mapping was verified", status: "confirmed" },
              { id: "config-reload-plan-documented", label: "Config reload plan is documented", status: "confirmed" },
              { id: "no-raw-secret-in-payload", label: "No raw secret is present in this payload", status: "confirmed" },
              { id: "rollback-snapshot-recorded", label: "Rollback snapshot is recorded", status: "confirmed" }
            ],
            blockedReasons: [],
            metadata: { apiKey: "[redacted]" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "audit-signing-key-environment-binding-next-audit-key",
            eventType: "audit_signing_key_environment_binding",
            runId: "audit-signing-key-rotation",
            createdAt: "2026-06-04T10:50:00+00:00",
            stage: "audit-signing-key-environment-binding",
            source: "audit-signing-key-ledger",
            summary: "Audit signing key environment binding recorded.",
            detail: "Environment binding is paper-only.",
            metadata: {
              bindingId: "audit-signing-key-environment-binding-next-audit-key",
              materializationId: "audit-signing-key-secret-materialization-next-audit-key",
              status: "binding_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildAuditSigningKeyEnvironmentBindingUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/environment-bindings"
    );

    const result = await recordAuditSigningKeyEnvironmentBinding(
      "/",
      {
        bindingMode: "container_env_reference",
        confirmations: {
          configReloadPlanDocumented: true,
          noRawSecretInPayload: true,
          rollbackSnapshotRecorded: true,
          runtimeEnvMappingVerified: true
        },
        materializationId: "audit-signing-key-secret-materialization-next-audit-key",
        metadata: { source: "audit-panel" },
        operator: "audit-operator"
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/audit/signing-keys/environment-bindings"
    ]);
    expect(calls[0]?.body).toEqual({
      bindingMode: "container_env_reference",
      confirmations: {
        configReloadPlanDocumented: true,
        noRawSecretInPayload: true,
        rollbackSnapshotRecorded: true,
        runtimeEnvMappingVerified: true
      },
      materializationId: "audit-signing-key-secret-materialization-next-audit-key",
      metadata: { source: "audit-panel" },
      operator: "audit-operator"
    });
    expect(result.source).toBe("core");
    expect(result.environmentBinding?.status).toBe("binding_recorded");
    expect(result.environmentBinding?.proposedActiveKeyId).toBe("next-audit-key");
    expect(result.environmentBinding?.metadata.apiKey).toBe("[redacted]");
    expect(result.environmentBinding?.liveTradingAllowed).toBe(false);
    expect(result.environmentBinding?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("audit_signing_key_environment_binding");
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("loads audit signing key environment binding history from the local core", async () => {
    const calls: string[] = [];
    const result = await loadAuditSigningKeyEnvironmentBindings(
      "http://127.0.0.1:8765/",
      "next-audit-key",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            environmentBindings: [
              {
                schemaVersion: 1,
                bindingId: "audit-signing-key-environment-binding-next-audit-key",
                materializationId: "audit-signing-key-secret-materialization-next-audit-key",
                planEventId: "audit-signing-key-rotation-next-audit-key-test",
                currentActiveKeyId: "active-audit-key",
                currentActiveKeyFingerprint: "a".repeat(16),
                proposedActiveKeyId: "next-audit-key",
                proposedSigner: "Next Audit Key",
                proposedChainId: "audit-chain-next",
                status: "binding_recorded",
                operator: "audit-operator",
                recordedAt: "2026-06-04T10:50:00+00:00",
                bindingMode: "container_env_reference",
                backend: "local-secret-store",
                manifestPath: "local-secret-store://audit-signing/next-audit-key",
                requiredEnvVars: ["AIQT_AUDIT_SIGNING_SECRET"],
                requiredConfirmations: [
                  { id: "runtime-env-mapping-verified", label: "Runtime environment mapping was verified", status: "confirmed" },
                  { id: "config-reload-plan-documented", label: "Config reload plan is documented", status: "confirmed" },
                  { id: "no-raw-secret-in-payload", label: "No raw secret is present in this payload", status: "confirmed" },
                  { id: "rollback-snapshot-recorded", label: "Rollback snapshot is recorded", status: "confirmed" }
                ],
                blockedReasons: [],
                metadata: { apiKey: "[redacted]" },
                liveTradingAllowed: false,
                paperOnly: true
              }
            ]
          })
        };
      },
      5
    );

    expect(buildAuditSigningKeyEnvironmentBindingHistoryUrl("http://127.0.0.1:8765/", {
      limit: 5,
      proposedKeyId: "next-audit-key"
    })).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/environment-bindings?proposedKeyId=next-audit-key&limit=5"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/audit/signing-keys/environment-bindings?proposedKeyId=next-audit-key&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.environmentBindings).toHaveLength(1);
    expect(result.environmentBindings[0].status).toBe("binding_recorded");
    expect(result.environmentBindings[0].liveTradingAllowed).toBe(false);
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("records an audit signing key runtime reload plan without executing reloads", async () => {
    const calls: Array<{ url: string; method: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          runtimeReloadPlan: {
            schemaVersion: 1,
            planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
            bindingId: "audit-signing-key-environment-binding-next-audit-key",
            materializationId: "audit-signing-key-secret-materialization-next-audit-key",
            planEventId: "audit-signing-key-rotation-next-audit-key-test",
            currentActiveKeyId: "active-audit-key",
            currentActiveKeyFingerprint: "a".repeat(16),
            proposedActiveKeyId: "next-audit-key",
            proposedSigner: "Next Audit Key",
            proposedChainId: "audit-chain-next",
            status: "plan_recorded",
            operator: "audit-operator",
            recordedAt: "2026-06-04T11:00:00+00:00",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "audit-window-1",
            bindingMode: "container_env_reference",
            backend: "local-secret-store",
            manifestPath: "local-secret-store://audit-signing/next-audit-key",
            requiredEnvVars: [
              "AIQT_AUDIT_SIGNING_KEY_ID",
              "AIQT_AUDIT_SIGNER_NAME",
              "AIQT_AUDIT_CHAIN_ID",
              "AIQT_AUDIT_SIGNING_SECRET",
              "AIQT_AUDIT_SIGNING_KEYS_JSON"
            ],
            requiredConfirmations: [
              { id: "maintenance-window-approved", label: "Maintenance window is approved", status: "confirmed" },
              { id: "health-baseline-captured", label: "Pre-reload health baseline was captured", status: "confirmed" },
              { id: "config-diff-reviewed", label: "Configuration diff was reviewed", status: "confirmed" },
              { id: "post-reload-smoke-plan-documented", label: "Post-reload smoke plan is documented", status: "confirmed" },
              { id: "rollback-owner-assigned", label: "Rollback trigger owner is assigned", status: "confirmed" }
            ],
            blockedReasons: [],
            metadata: { apiKey: "[redacted]" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "audit-signing-key-runtime-reload-plan-next-audit-key",
            eventType: "audit_signing_key_runtime_reload_plan",
            runId: "audit-signing-key-rotation",
            createdAt: "2026-06-04T11:00:00+00:00",
            stage: "audit-signing-key-runtime-reload-plan",
            source: "audit-signing-key-ledger",
            summary: "Audit signing key runtime reload plan recorded.",
            detail: "Runtime reload plan is paper-only.",
            metadata: {
              bindingId: "audit-signing-key-environment-binding-next-audit-key",
              planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
              status: "plan_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildAuditSigningKeyRuntimeReloadPlanUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/runtime-reload-plans"
    );

    const result = await recordAuditSigningKeyRuntimeReloadPlan(
      "/",
      {
        bindingId: "audit-signing-key-environment-binding-next-audit-key",
        confirmations: {
          configDiffReviewed: true,
          healthBaselineCaptured: true,
          maintenanceWindowApproved: true,
          postReloadSmokePlanDocumented: true,
          rollbackOwnerAssigned: true
        },
        maintenanceWindowId: "audit-window-1",
        metadata: { source: "audit-panel" },
        operator: "audit-operator",
        reloadMode: "manual_container_reload_plan"
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/audit/signing-keys/runtime-reload-plans"
    ]);
    expect(calls[0]?.body).toEqual({
      bindingId: "audit-signing-key-environment-binding-next-audit-key",
      confirmations: {
        configDiffReviewed: true,
        healthBaselineCaptured: true,
        maintenanceWindowApproved: true,
        postReloadSmokePlanDocumented: true,
        rollbackOwnerAssigned: true
      },
      maintenanceWindowId: "audit-window-1",
      metadata: { source: "audit-panel" },
      operator: "audit-operator",
      reloadMode: "manual_container_reload_plan"
    });
    expect(result.source).toBe("core");
    expect(result.runtimeReloadPlan?.status).toBe("plan_recorded");
    expect(result.runtimeReloadPlan?.proposedActiveKeyId).toBe("next-audit-key");
    expect(result.runtimeReloadPlan?.metadata.apiKey).toBe("[redacted]");
    expect(result.runtimeReloadPlan?.liveTradingAllowed).toBe(false);
    expect(result.runtimeReloadPlan?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("audit_signing_key_runtime_reload_plan");
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("loads audit signing key runtime reload plan history from the local core", async () => {
    const calls: string[] = [];
    const result = await loadAuditSigningKeyRuntimeReloadPlans(
      "http://127.0.0.1:8765/",
      "next-audit-key",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            runtimeReloadPlans: [
              {
                schemaVersion: 1,
                planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
                bindingId: "audit-signing-key-environment-binding-next-audit-key",
                materializationId: "audit-signing-key-secret-materialization-next-audit-key",
                planEventId: "audit-signing-key-rotation-next-audit-key-test",
                currentActiveKeyId: "active-audit-key",
                currentActiveKeyFingerprint: "a".repeat(16),
                proposedActiveKeyId: "next-audit-key",
                proposedSigner: "Next Audit Key",
                proposedChainId: "audit-chain-next",
                status: "plan_recorded",
                operator: "audit-operator",
                recordedAt: "2026-06-04T11:00:00+00:00",
                reloadMode: "manual_container_reload_plan",
                maintenanceWindowId: "audit-window-1",
                bindingMode: "container_env_reference",
                backend: "local-secret-store",
                manifestPath: "local-secret-store://audit-signing/next-audit-key",
                requiredEnvVars: ["AIQT_AUDIT_SIGNING_SECRET"],
                requiredConfirmations: [
                  { id: "maintenance-window-approved", label: "Maintenance window is approved", status: "confirmed" },
                  { id: "health-baseline-captured", label: "Pre-reload health baseline was captured", status: "confirmed" },
                  { id: "config-diff-reviewed", label: "Configuration diff was reviewed", status: "confirmed" },
                  { id: "post-reload-smoke-plan-documented", label: "Post-reload smoke plan is documented", status: "confirmed" },
                  { id: "rollback-owner-assigned", label: "Rollback trigger owner is assigned", status: "confirmed" }
                ],
                blockedReasons: [],
                metadata: { apiKey: "[redacted]" },
                liveTradingAllowed: false,
                paperOnly: true
              }
            ]
          })
        };
      },
      5
    );

    expect(buildAuditSigningKeyRuntimeReloadPlanHistoryUrl("http://127.0.0.1:8765/", {
      limit: 5,
      proposedKeyId: "next-audit-key"
    })).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/runtime-reload-plans?proposedKeyId=next-audit-key&limit=5"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/audit/signing-keys/runtime-reload-plans?proposedKeyId=next-audit-key&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.runtimeReloadPlans).toHaveLength(1);
    expect(result.runtimeReloadPlans[0].status).toBe("plan_recorded");
    expect(result.runtimeReloadPlans[0].liveTradingAllowed).toBe(false);
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("records an audit signing key runtime reload execution without restarting containers", async () => {
    const calls: Array<{ method?: string; url: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        method: init?.method,
        url,
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          runtimeReloadExecution: {
            schemaVersion: 1,
            executionId: "audit-signing-key-runtime-reload-execution-next-audit-key",
            planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
            bindingId: "audit-signing-key-environment-binding-next-audit-key",
            materializationId: "audit-signing-key-secret-materialization-next-audit-key",
            planEventId: "audit-signing-key-rotation-next-audit-key-test",
            currentActiveKeyId: "active-audit-key",
            currentActiveKeyFingerprint: "a".repeat(16),
            proposedActiveKeyId: "next-audit-key",
            proposedSigner: "Next Audit Key",
            proposedChainId: "audit-chain-next",
            status: "execution_recorded",
            operator: "audit-operator",
            recordedAt: "2026-06-04T11:05:00+00:00",
            executionMode: "manual_controlled_reload_evidence",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "audit-window-1",
            bindingMode: "container_env_reference",
            backend: "local-secret-store",
            manifestPath: "local-secret-store://audit-signing/next-audit-key",
            requiredEnvVars: ["AIQT_AUDIT_SIGNING_SECRET", "AIQT_AUDIT_SIGNING_KEYS_JSON"],
            requiredConfirmations: [
              { id: "pre-reload-health-verified", label: "Pre-reload health is verified", status: "confirmed" },
              { id: "reload-action-recorded", label: "Reload action is recorded", status: "confirmed" },
              { id: "post-reload-smoke-passed", label: "Post-reload smoke passed", status: "confirmed" },
              { id: "rollback-readiness-confirmed", label: "Rollback readiness is confirmed", status: "confirmed" },
              {
                id: "operator-confirmed-live-blocked",
                label: "Operator confirmed live routing remains blocked",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { apiKey: "[redacted]", source: "audit-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "audit-signing-key-runtime-reload-execution-next-audit-key",
            eventType: "audit_signing_key_runtime_reload_execution",
            runId: "audit-signing-key-rotation",
            createdAt: "2026-06-04T11:05:00+00:00",
            stage: "audit-signing-key-runtime-reload-execution",
            source: "audit-signing-key-ledger",
            summary: "Audit signing key runtime reload execution recorded.",
            detail: "Runtime reload execution evidence is paper-only.",
            metadata: {
              executionId: "audit-signing-key-runtime-reload-execution-next-audit-key",
              status: "execution_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildAuditSigningKeyRuntimeReloadExecutionUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/runtime-reload-executions"
    );

    const result = await recordAuditSigningKeyRuntimeReloadExecution(
      "/",
      {
        planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
        operator: "audit-operator",
        executionMode: "manual_controlled_reload_evidence",
        confirmations: {
          preReloadHealthVerified: true,
          reloadActionRecorded: true,
          postReloadSmokePassed: true,
          rollbackReadinessConfirmed: true,
          operatorConfirmedLiveBlocked: true
        },
        metadata: { source: "audit-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/audit/signing-keys/runtime-reload-executions"
    ]);
    expect(calls[0]?.body).toEqual({
      planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
      operator: "audit-operator",
      executionMode: "manual_controlled_reload_evidence",
      confirmations: {
        preReloadHealthVerified: true,
        reloadActionRecorded: true,
        postReloadSmokePassed: true,
        rollbackReadinessConfirmed: true,
        operatorConfirmedLiveBlocked: true
      },
      metadata: { source: "audit-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.runtimeReloadExecution?.status).toBe("execution_recorded");
    expect(result.runtimeReloadExecution?.proposedActiveKeyId).toBe("next-audit-key");
    expect(result.runtimeReloadExecution?.liveTradingAllowed).toBe(false);
    expect(result.runtimeReloadExecution?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("audit_signing_key_runtime_reload_execution");
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("loads audit signing key runtime reload execution history from the local core", async () => {
    const execution = {
      schemaVersion: 1,
      executionId: "audit-signing-key-runtime-reload-execution-next-audit-key",
      planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
      bindingId: "audit-signing-key-environment-binding-next-audit-key",
      materializationId: "audit-signing-key-secret-materialization-next-audit-key",
      planEventId: "audit-signing-key-rotation-next-audit-key-test",
      currentActiveKeyId: "active-audit-key",
      currentActiveKeyFingerprint: "a".repeat(16),
      proposedActiveKeyId: "next-audit-key",
      proposedSigner: "Next Audit Key",
      proposedChainId: "audit-chain-next",
      status: "execution_recorded",
      operator: "audit-operator",
      recordedAt: "2026-06-04T11:05:00+00:00",
      executionMode: "manual_controlled_reload_evidence",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "audit-window-1",
      bindingMode: "container_env_reference",
      backend: "local-secret-store",
      manifestPath: "local-secret-store://audit-signing/next-audit-key",
      requiredEnvVars: ["AIQT_AUDIT_SIGNING_SECRET"],
      requiredConfirmations: [
        { id: "pre-reload-health-verified", label: "Pre-reload health is verified", status: "confirmed" }
      ],
      blockedReasons: [],
      metadata: { source: "audit-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const calls: string[] = [];
    const result = await loadAuditSigningKeyRuntimeReloadExecutions(
      "http://127.0.0.1:8765/",
      "next-audit-key",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ runtimeReloadExecutions: [execution] })
        };
      },
      5
    );

    expect(buildAuditSigningKeyRuntimeReloadExecutionHistoryUrl("http://127.0.0.1:8765/", {
      limit: 5,
      proposedKeyId: "next-audit-key"
    })).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/runtime-reload-executions?proposedKeyId=next-audit-key&limit=5"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/audit/signing-keys/runtime-reload-executions?proposedKeyId=next-audit-key&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.runtimeReloadExecutions).toHaveLength(1);
    expect(result.runtimeReloadExecutions[0].status).toBe("execution_recorded");
    expect(result.runtimeReloadExecutions[0].liveTradingAllowed).toBe(false);

    const rejected = await loadAuditSigningKeyRuntimeReloadExecutions(
      "http://127.0.0.1:8765/",
      "next-audit-key",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          runtimeReloadExecutions: [
            {
              ...execution,
              metadata: { token: "reload-execution-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.runtimeReloadExecutions).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("reload-execution-token-should-not-leak");
  });

  test("records an audit signing key rotation acceptance without activating keys", async () => {
    const calls: Array<{ method?: string; url: string; body?: unknown }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({
        method: init?.method,
        url,
        body: init?.body ? JSON.parse(String(init.body)) : undefined
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          rotationAcceptance: {
            schemaVersion: 1,
            acceptanceId: "audit-signing-key-rotation-acceptance-next-audit-key",
            executionId: "audit-signing-key-runtime-reload-execution-next-audit-key",
            planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
            bindingId: "audit-signing-key-environment-binding-next-audit-key",
            materializationId: "audit-signing-key-secret-materialization-next-audit-key",
            planEventId: "audit-signing-key-rotation-next-audit-key-test",
            currentActiveKeyId: "active-audit-key",
            currentActiveKeyFingerprint: "a".repeat(16),
            proposedActiveKeyId: "next-audit-key",
            proposedSigner: "Next Audit Key",
            proposedChainId: "audit-chain-next",
            status: "acceptance_recorded",
            operator: "audit-operator",
            recordedAt: "2026-06-04T11:10:00+00:00",
            acceptanceMode: "manual_rotation_acceptance",
            executionMode: "manual_controlled_reload_evidence",
            reloadMode: "manual_container_reload_plan",
            maintenanceWindowId: "audit-window-1",
            requiredEnvVars: ["AIQT_AUDIT_SIGNING_SECRET", "AIQT_AUDIT_SIGNING_KEYS_JSON"],
            requiredConfirmations: [
              {
                id: "execution-evidence-reviewed",
                label: "Runtime reload execution evidence was reviewed",
                status: "confirmed"
              },
              { id: "signature-probe-verified", label: "Post-reload signing probe was verified", status: "confirmed" },
              {
                id: "legacy-verification-confirmed",
                label: "Legacy report verification was confirmed",
                status: "confirmed"
              },
              { id: "rollback-window-still-open", label: "Rollback window remains open", status: "confirmed" },
              {
                id: "operator-confirmed-activation-blocked",
                label: "Operator confirmed activation and live routing remain blocked",
                status: "confirmed"
              }
            ],
            blockedReasons: [],
            metadata: { privateKey: "[redacted]", source: "audit-panel" },
            liveTradingAllowed: false,
            paperOnly: true
          },
          auditEvent: {
            schemaVersion: 1,
            eventId: "audit-signing-key-rotation-acceptance-next-audit-key",
            eventType: "audit_signing_key_rotation_acceptance",
            runId: "audit-signing-key-rotation",
            createdAt: "2026-06-04T11:10:00+00:00",
            stage: "audit-signing-key-rotation-acceptance",
            source: "audit-signing-key-ledger",
            summary: "Audit signing key rotation acceptance recorded.",
            detail: "Rotation acceptance evidence is paper-only.",
            metadata: {
              acceptanceId: "audit-signing-key-rotation-acceptance-next-audit-key",
              status: "acceptance_recorded",
              liveTradingAllowed: false,
              paperOnly: true
            }
          }
        })
      };
    };

    expect(buildAuditSigningKeyRotationAcceptanceUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/rotation-acceptances"
    );

    const result = await recordAuditSigningKeyRotationAcceptance(
      "/",
      {
        executionId: "audit-signing-key-runtime-reload-execution-next-audit-key",
        operator: "audit-operator",
        acceptanceMode: "manual_rotation_acceptance",
        confirmations: {
          executionEvidenceReviewed: true,
          signatureProbeVerified: true,
          legacyVerificationConfirmed: true,
          rollbackWindowStillOpen: true,
          operatorConfirmedActivationBlocked: true
        },
        metadata: { source: "audit-panel" }
      },
      fetcher
    );

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST /api/audit/signing-keys/rotation-acceptances"
    ]);
    expect(calls[0]?.body).toEqual({
      executionId: "audit-signing-key-runtime-reload-execution-next-audit-key",
      operator: "audit-operator",
      acceptanceMode: "manual_rotation_acceptance",
      confirmations: {
        executionEvidenceReviewed: true,
        signatureProbeVerified: true,
        legacyVerificationConfirmed: true,
        rollbackWindowStillOpen: true,
        operatorConfirmedActivationBlocked: true
      },
      metadata: { source: "audit-panel" }
    });
    expect(result.source).toBe("core");
    expect(result.rotationAcceptance?.status).toBe("acceptance_recorded");
    expect(result.rotationAcceptance?.proposedActiveKeyId).toBe("next-audit-key");
    expect(result.rotationAcceptance?.liveTradingAllowed).toBe(false);
    expect(result.rotationAcceptance?.paperOnly).toBe(true);
    expect(result.auditEvent?.eventType).toBe("audit_signing_key_rotation_acceptance");
    expect(JSON.stringify(result)).not.toContain("active-audit-secret");
  });

  test("loads audit signing key rotation acceptance history from the local core", async () => {
    const acceptance = {
      schemaVersion: 1,
      acceptanceId: "audit-signing-key-rotation-acceptance-next-audit-key",
      executionId: "audit-signing-key-runtime-reload-execution-next-audit-key",
      planId: "audit-signing-key-runtime-reload-plan-next-audit-key",
      bindingId: "audit-signing-key-environment-binding-next-audit-key",
      materializationId: "audit-signing-key-secret-materialization-next-audit-key",
      planEventId: "audit-signing-key-rotation-next-audit-key-test",
      currentActiveKeyId: "active-audit-key",
      currentActiveKeyFingerprint: "a".repeat(16),
      proposedActiveKeyId: "next-audit-key",
      proposedSigner: "Next Audit Key",
      proposedChainId: "audit-chain-next",
      status: "acceptance_recorded",
      operator: "audit-operator",
      recordedAt: "2026-06-04T11:10:00+00:00",
      acceptanceMode: "manual_rotation_acceptance",
      executionMode: "manual_controlled_reload_evidence",
      reloadMode: "manual_container_reload_plan",
      maintenanceWindowId: "audit-window-1",
      requiredEnvVars: ["AIQT_AUDIT_SIGNING_SECRET"],
      requiredConfirmations: [
        {
          id: "execution-evidence-reviewed",
          label: "Runtime reload execution evidence was reviewed",
          status: "confirmed"
        }
      ],
      blockedReasons: [],
      metadata: { source: "audit-panel", token: "[redacted]" },
      liveTradingAllowed: false,
      paperOnly: true
    };
    const calls: string[] = [];
    const result = await loadAuditSigningKeyRotationAcceptances(
      "http://127.0.0.1:8765/",
      "next-audit-key",
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({ rotationAcceptances: [acceptance] })
        };
      },
      5
    );

    expect(buildAuditSigningKeyRotationAcceptanceHistoryUrl("http://127.0.0.1:8765/", {
      limit: 5,
      proposedKeyId: "next-audit-key"
    })).toBe(
      "http://127.0.0.1:8765/api/audit/signing-keys/rotation-acceptances?proposedKeyId=next-audit-key&limit=5"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/audit/signing-keys/rotation-acceptances?proposedKeyId=next-audit-key&limit=5"
    ]);
    expect(result.source).toBe("core");
    expect(result.rotationAcceptances).toHaveLength(1);
    expect(result.rotationAcceptances[0].status).toBe("acceptance_recorded");
    expect(result.rotationAcceptances[0].liveTradingAllowed).toBe(false);

    const rejected = await loadAuditSigningKeyRotationAcceptances(
      "http://127.0.0.1:8765/",
      "next-audit-key",
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          rotationAcceptances: [
            {
              ...acceptance,
              metadata: { token: "rotation-acceptance-token-should-not-leak" }
            }
          ]
        })
      }),
      5
    );

    expect(rejected.source).toBe("fallback");
    expect(rejected.rotationAcceptances).toEqual([]);
    expect(JSON.stringify(rejected)).not.toContain("rotation-acceptance-token-should-not-leak");
  });

  test("refreshes a market cache context and returns updated settings", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await refreshMarketCache(
      "http://127.0.0.1:8765/",
      {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        limit: 240,
        overrideAuditEventId: "market-data-refresh-override-client"
      },
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          json: async () => ({
            refresh: {
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              requestedLimit: 240,
              upsertedRows: 3,
              overrideAuditEventId: "market-data-refresh-override-client",
              quality: {
                source: "tencent",
                isComplete: true,
                warnings: [],
                rows: 3
              }
            },
            watchlistRefresh: {
              runId: "cache-refresh-single-600000",
              createdAt: "2026-06-15T09:30:00+08:00",
              timeframe: "1d",
              requestedLimit: 240,
              overrideAuditEventId: "market-data-refresh-override-client",
              summary: {
                totalSymbols: 1,
                refreshed: 1,
                skipped: 0,
                failed: 0,
                upsertedRows: 3
              },
              items: [
                {
                  market: "ashare",
                  symbol: "600000",
                  name: "600000",
                  timeframe: "1d",
                  requestedLimit: 240,
                  upsertedRows: 3,
                  status: "refreshed",
                  error: null,
                  quality: {
                    source: "tencent",
                    isComplete: true,
                    warnings: [],
                    rows: 3
                  }
                }
              ]
            },
            settings: {
              schemaVersion: 1,
              generatedAt: "2026-05-31T09:00:00+08:00",
              dataSources: [
                {
                  market: "ashare",
                  label: "A shares",
                  quoteSource: "tencent",
                  klineSource: "tencent",
                  status: "ready",
                  optionalKeyName: null,
                  optionalKeyConfigured: false,
                  note: "No key required."
                }
              ],
              marketDataAdapters: samplePlatformSettingsMarketDataAdapters,
              cache: {
                engine: "sqlite",
                path: "data/market.sqlite",
                exists: true,
                scope: "ohlcv",
                rowCount: 3,
                contextCount: 1,
                latestTimestamp: "2026-05-27T00:00:00+00:00",
                freshnessSummary: {
                  fresh: 1,
                  stale: 0,
                  empty: 0
                },
                contexts: [
                  {
                    market: "ashare",
                    symbol: "600000",
                    timeframe: "1d",
                    rowCount: 3,
                    startTimestamp: "2026-05-25T00:00:00+00:00",
                    endTimestamp: "2026-05-27T00:00:00+00:00",
                    freshness: "fresh",
                    ageHours: 48
                  }
                ]
              },
              executionAdapters: [
                {
                  id: "paper-local",
                  market: "multi",
                  adapter: "Paper Trading",
                  route: "paper",
                  status: "paper_ready",
                  certification: "local",
                  liveTradingAllowed: false,
                  note: "Paper only."
                }
              ],
              safety: {
                liveTradingAllowed: false,
                requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
              }
            }
          })
        };
      }
    );

    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/cache/refresh");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0]?.init?.body))).toMatchObject({
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      limit: 240,
      overrideAuditEventId: "market-data-refresh-override-client"
    });
    expect(result.source).toBe("core");
    expect(result.refresh?.overrideAuditEventId).toBe("market-data-refresh-override-client");
    expect(result.refresh?.upsertedRows).toBe(3);
    expect(result.watchlistRefresh?.runId).toBe("cache-refresh-single-600000");
    expect(result.watchlistRefresh?.summary.totalSymbols).toBe(1);
    expect(result.watchlistRefresh?.items[0]?.symbol).toBe("600000");
    expect(result.settings?.cache.rowCount).toBe(3);
  });

  test("refreshes multiple market cache contexts in request order", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await refreshMarketCacheBatch(
      "http://127.0.0.1:8765/",
      [
        { market: "ashare", symbol: "600000", timeframe: "1d", limit: 240 },
        { market: "us", symbol: "AAPL", timeframe: "1d", limit: 240 }
      ],
      async (url, init) => {
        calls.push({ url, init });
        const body = JSON.parse(String(init?.body)) as { market: string; symbol: string; timeframe: string; limit: number };
        const rowCount = body.symbol === "600000" ? 500 : 240;
        return {
          ok: true,
          json: async () => ({
            refresh: {
              market: body.market,
              symbol: body.symbol,
              timeframe: body.timeframe,
              requestedLimit: body.limit,
              upsertedRows: rowCount,
              quality: {
                source: body.market === "ashare" ? "tencent" : "yfinance",
                isComplete: true,
                warnings: [],
                rows: rowCount
              }
            },
            settings: {
              schemaVersion: 1,
              generatedAt: "2026-05-31T09:00:00+08:00",
              dataSources: [
                {
                  market: "ashare",
                  label: "A shares",
                  quoteSource: "tencent",
                  klineSource: "tencent",
                  status: "ready",
                  optionalKeyName: null,
                  optionalKeyConfigured: false,
                  note: "No key required."
                }
              ],
              marketDataAdapters: samplePlatformSettingsMarketDataAdapters,
              cache: {
                engine: "sqlite",
                path: "data/market.sqlite",
                exists: true,
                scope: "ohlcv",
                rowCount,
                contextCount: calls.length,
                latestTimestamp: "2026-05-29T00:00:00+00:00",
                freshnessSummary: {
                  fresh: calls.length,
                  stale: 0,
                  empty: 0
                },
                contexts: [
                  {
                    market: body.market,
                    symbol: body.symbol,
                    timeframe: body.timeframe,
                    rowCount,
                    startTimestamp: "2026-05-25T00:00:00+00:00",
                    endTimestamp: "2026-05-29T00:00:00+00:00",
                    freshness: "fresh",
                    ageHours: 48
                  }
                ]
              },
              executionAdapters: [
                {
                  id: "paper-local",
                  market: "multi",
                  adapter: "Paper Trading",
                  route: "paper",
                  status: "paper_ready",
                  certification: "local",
                  liveTradingAllowed: false,
                  note: "Paper only."
                }
              ],
              safety: {
                liveTradingAllowed: false,
                requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
              }
            }
          })
        };
      }
    );

    expect(calls).toHaveLength(2);
    expect(calls.map((call) => JSON.parse(String(call.init?.body)).symbol)).toEqual(["600000", "AAPL"]);
    expect(result.source).toBe("core");
    expect(result.refreshes.map((refresh) => refresh.symbol)).toEqual(["600000", "AAPL"]);
    expect(result.settings?.cache.rowCount).toBe(240);
    expect(result.failedCount).toBe(0);
  });

  test("records a watchlist cache refresh run", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await refreshWatchlistCacheRun(
      "http://127.0.0.1:8765/",
      {
        timeframe: "1d",
        limit: 240,
        overrideAuditEventId: "market-data-refresh-override-watchlist-client",
        watchlist: [
          { market: "ashare", symbol: "600000", name: "浦发银行", changePct: 0 },
          { market: "us", symbol: "AAPL", name: "Apple", changePct: 0 }
        ]
      },
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          json: async () => ({
            watchlistRefresh: {
              runId: "cache-refresh-run-1",
              createdAt: "2026-06-09T22:50:00+08:00",
              timeframe: "1d",
              requestedLimit: 240,
              overrideAuditEventId: "market-data-refresh-override-watchlist-client",
              summary: {
                totalSymbols: 2,
                refreshed: 2,
                skipped: 0,
                failed: 0,
                upsertedRows: 740
              },
              items: [
                {
                  market: "ashare",
                  symbol: "600000",
                  name: "浦发银行",
                  timeframe: "1d",
                  requestedLimit: 240,
                  upsertedRows: 500,
                  status: "refreshed",
                  error: null,
                  quality: { source: "tencent", isComplete: true, warnings: [], rows: 500 }
                },
                {
                  market: "us",
                  symbol: "AAPL",
                  name: "Apple",
                  timeframe: "1d",
                  requestedLimit: 240,
                  upsertedRows: 240,
                  status: "refreshed",
                  error: null,
                  quality: { source: "yfinance", isComplete: true, warnings: [], rows: 240 }
                }
              ]
            },
            settings: {
              schemaVersion: 1,
              generatedAt: "2026-05-31T09:00:00+08:00",
              dataSources: [
                {
                  market: "ashare",
                  label: "A shares",
                  quoteSource: "tencent",
                  klineSource: "tencent",
                  status: "ready",
                  optionalKeyName: null,
                  optionalKeyConfigured: false,
                  note: "No key required."
                }
              ],
              marketDataAdapters: samplePlatformSettingsMarketDataAdapters,
              cache: {
                engine: "sqlite",
                path: "data/market.sqlite",
                exists: true,
                scope: "ohlcv",
                rowCount: 740,
                contextCount: 2,
                latestTimestamp: "2026-05-29T00:00:00+00:00",
                freshnessSummary: { fresh: 2, stale: 0, empty: 0 },
                contexts: [
                  {
                    market: "ashare",
                    symbol: "600000",
                    timeframe: "1d",
                    rowCount: 500,
                    startTimestamp: "2026-05-25T00:00:00+00:00",
                    endTimestamp: "2026-05-29T00:00:00+00:00",
                    freshness: "fresh",
                    ageHours: 48
                  }
                ]
              },
              executionAdapters: [
                {
                  id: "paper-local",
                  market: "multi",
                  adapter: "Paper Trading",
                  route: "paper",
                  status: "paper_ready",
                  certification: "local",
                  liveTradingAllowed: false,
                  note: "Paper only."
                }
              ],
              safety: {
                liveTradingAllowed: false,
                requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
              }
            }
          })
        };
      }
    );

    expect(buildWatchlistCacheRefreshUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/cache/watchlist-refreshes"
    );
    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/cache/watchlist-refreshes");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0]?.init?.body))).toMatchObject({
      timeframe: "1d",
      limit: 240,
      overrideAuditEventId: "market-data-refresh-override-watchlist-client",
      watchlist: [
        { market: "ashare", symbol: "600000", name: "浦发银行" },
        { market: "us", symbol: "AAPL", name: "Apple" }
      ]
    });
    expect(result.source).toBe("core");
    expect(result.watchlistRefresh?.runId).toBe("cache-refresh-run-1");
    expect(result.watchlistRefresh?.overrideAuditEventId).toBe("market-data-refresh-override-watchlist-client");
    expect(result.watchlistRefresh?.summary.refreshed).toBe(2);
    expect(result.watchlistRefresh?.items.map((item) => item.symbol)).toEqual(["600000", "AAPL"]);
    expect(result.settings?.cache.rowCount).toBe(740);
  });

  test("loads recent watchlist cache refresh runs", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await loadWatchlistCacheRefreshRuns("http://127.0.0.1:8765/", { limit: 2 }, async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        json: async () => ({
          watchlistRefreshes: [
            {
              runId: "cache-refresh-run-2",
              createdAt: "2026-06-09T23:10:00+08:00",
              timeframe: "1d",
              requestedLimit: 240,
              overrideAuditEventId: "market-data-refresh-override-history-client",
              summary: { totalSymbols: 2, refreshed: 1, skipped: 1, failed: 0, upsertedRows: 240 },
              items: [
                {
                  market: "ashare",
                  symbol: "600000",
                  name: "浦发银行",
                  timeframe: "1d",
                  requestedLimit: 240,
                  upsertedRows: 240,
                  status: "refreshed",
                  error: null,
                  quality: { source: "tencent", isComplete: true, warnings: [], rows: 240 }
                }
              ]
            },
            {
              runId: "cache-refresh-run-1",
              createdAt: "2026-06-09T22:50:00+08:00",
              timeframe: "1d",
              requestedLimit: 160,
              summary: { totalSymbols: 1, refreshed: 1, skipped: 0, failed: 0, upsertedRows: 160 },
              items: [
                {
                  market: "us",
                  symbol: "AAPL",
                  name: "Apple",
                  timeframe: "1d",
                  requestedLimit: 160,
                  upsertedRows: 160,
                  status: "refreshed",
                  error: null,
                  quality: { source: "yfinance", isComplete: true, warnings: [], rows: 160 }
                }
              ]
            }
          ]
        })
      };
    });

    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/cache/watchlist-refreshes?limit=2");
    expect(calls[0]?.init).toBeUndefined();
    expect(result.source).toBe("core");
    expect(result.watchlistRefreshes.map((run) => run.runId)).toEqual(["cache-refresh-run-2", "cache-refresh-run-1"]);
    expect(result.watchlistRefreshes[0]?.overrideAuditEventId).toBe("market-data-refresh-override-history-client");
    expect(result.watchlistRefreshes[0]?.summary.skipped).toBe(1);
  });

  test("rejects settings status when cache freshness summary is missing", async () => {
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-05-31T09:00:00+08:00",
          dataSources: [
            {
              market: "ashare",
              label: "A shares",
              quoteSource: "tencent",
              klineSource: "tencent",
              status: "ready",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 500,
            contextCount: 1,
            latestTimestamp: "2026-05-29T00:00:00+00:00",
            contexts: [
              {
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                rowCount: 500,
                startTimestamp: "2025-09-12T00:00:00+08:00",
                endTimestamp: "2026-05-29T00:00:00+08:00",
                freshness: "fresh",
                ageHours: 48
              }
            ]
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("rejects settings status when cache context freshness is missing", async () => {
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-05-31T09:00:00+08:00",
          dataSources: [
            {
              market: "ashare",
              label: "A shares",
              quoteSource: "tencent",
              klineSource: "tencent",
              status: "ready",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 500,
            contextCount: 1,
            latestTimestamp: "2026-05-29T00:00:00+00:00",
            contexts: [
              {
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                rowCount: 500,
                startTimestamp: "2025-09-12T00:00:00+08:00",
                endTimestamp: "2026-05-29T00:00:00+08:00"
              }
            ]
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("rejects settings status when market data adapters are missing", async () => {
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-05-31T09:00:00+08:00",
          dataSources: [
            {
              market: "ashare",
              label: "A shares",
              quoteSource: "tencent",
              klineSource: "tencent",
              status: "ready",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 500,
            contextCount: 1,
            latestTimestamp: "2026-05-29T00:00:00+00:00",
            freshnessSummary: { fresh: 1, stale: 0, empty: 0 },
            contexts: []
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("rejects settings status when market data adapter diagnostics are missing", async () => {
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-05-31T09:00:00+08:00",
          dataSources: [
            {
              market: "ashare",
              label: "A shares",
              quoteSource: "tencent",
              klineSource: "tencent",
              status: "ready",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          marketDataAdapters: [
            {
              id: "akshare-ohlcv",
              market: "ashare",
              adapter: "AkShareMarketDataAdapter",
              provider: "akshare",
              status: "ready",
              route: "public_ohlcv",
              capabilities: ["stock_zh_a_hist"],
              timeframes: ["1d"],
              requiresApiKey: false,
              requiresTradingKey: false,
              cacheScope: "ohlcv",
              note: "Diagnostics intentionally omitted."
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 500,
            contextCount: 1,
            latestTimestamp: "2026-05-29T00:00:00+00:00",
            freshnessSummary: { fresh: 1, stale: 0, empty: 0 },
            contexts: []
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("rejects settings status when market data adapter external telemetry is missing", async () => {
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-06-14T08:00:00+00:00",
          dataSources: [
            {
              market: "ashare",
              label: "A shares",
              quoteSource: "tencent",
              klineSource: "tencent",
              status: "ready",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          marketDataAdapters: [
            {
              id: "akshare-ohlcv",
              market: "ashare",
              adapter: "AkShareMarketDataAdapter",
              provider: "akshare",
              status: "ready",
              route: "public_ohlcv",
              capabilities: ["stock_zh_a_hist"],
              timeframes: ["1d"],
              requiresApiKey: false,
              requiresTradingKey: false,
              cacheScope: "ohlcv",
              cacheDiagnostics: {
                freshness: "fresh",
                contextCount: 1,
                rowCount: 500,
                latestTimestamp: "2026-05-29T00:00:00+00:00",
                freshnessSummary: { fresh: 1, stale: 0, empty: 0 }
              },
              note: "External telemetry intentionally omitted."
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 500,
            contextCount: 1,
            latestTimestamp: "2026-05-29T00:00:00+00:00",
            freshnessSummary: { fresh: 1, stale: 0, empty: 0 },
            contexts: []
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("rejects settings status when market data adapter install guidance is missing", async () => {
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-06-14T08:00:00+00:00",
          dataSources: [
            {
              market: "ashare",
              label: "A shares",
              quoteSource: "tencent",
              klineSource: "tencent",
              status: "ready",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          marketDataAdapters: [
            {
              ...samplePlatformSettingsMarketDataAdapters[0],
              externalTelemetry: {
                status: "ok",
                dependency: "akshare",
                dependencyAvailable: true,
                lastError: null,
                retryState: "idle",
                checkedAt: "2026-06-14T08:00:00+00:00",
                lastProviderError: null,
                providerHealth: sampleOkProviderHealth
              }
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 500,
            contextCount: 1,
            latestTimestamp: "2026-05-29T00:00:00+00:00",
            freshnessSummary: { fresh: 1, stale: 0, empty: 0 },
            contexts: []
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("rejects settings status when market data adapter provider error state is missing", async () => {
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-06-14T08:00:00+00:00",
          dataSources: [
            {
              market: "ashare",
              label: "A shares",
              quoteSource: "tencent",
              klineSource: "tencent",
              status: "ready",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          marketDataAdapters: [
            {
              ...samplePlatformSettingsMarketDataAdapters[0],
              externalTelemetry: {
                status: "ok",
                dependency: "akshare",
                dependencyAvailable: true,
                lastError: null,
                retryState: "idle",
                checkedAt: "2026-06-14T08:00:00+00:00",
                installGuidance: sampleAkshareInstallGuidance,
                providerHealth: sampleOkProviderHealth
              }
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 500,
            contextCount: 1,
            latestTimestamp: "2026-05-29T00:00:00+00:00",
            freshnessSummary: { fresh: 1, stale: 0, empty: 0 },
            contexts: []
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("rejects settings status when market data adapter provider error category is missing", async () => {
    const { category: _category, ...providerErrorWithoutCategory } = sampleYfinanceProviderError;
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-06-14T08:00:00+00:00",
          dataSources: [
            {
              market: "us",
              label: "US equities",
              quoteSource: "yfinance",
              klineSource: "yfinance",
              status: "degraded",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          marketDataAdapters: [
            {
              ...samplePlatformSettingsMarketDataAdapters[1],
              externalTelemetry: {
                ...samplePlatformSettingsMarketDataAdapters[1].externalTelemetry,
                lastProviderError: providerErrorWithoutCategory
              }
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 0,
            contextCount: 0,
            latestTimestamp: null,
            freshnessSummary: { fresh: 0, stale: 0, empty: 0 },
            contexts: []
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("rejects settings status when market data adapter provider health is missing", async () => {
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-06-14T08:00:00+00:00",
          dataSources: [
            {
              market: "ashare",
              label: "A shares",
              quoteSource: "tencent",
              klineSource: "tencent",
              status: "ready",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          marketDataAdapters: [
            {
              ...samplePlatformSettingsMarketDataAdapters[0],
              externalTelemetry: {
                status: "ok",
                dependency: "akshare",
                dependencyAvailable: true,
                lastError: null,
                retryState: "idle",
                checkedAt: "2026-06-14T08:00:00+00:00",
                installGuidance: sampleAkshareInstallGuidance,
                lastProviderError: null
              }
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 500,
            contextCount: 1,
            latestTimestamp: "2026-05-29T00:00:00+00:00",
            freshnessSummary: { fresh: 1, stale: 0, empty: 0 },
            contexts: []
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("rejects settings status when market data adapter provider health category summary is missing", async () => {
    const { categorySummary: _categorySummary, ...providerHealthWithoutSummary } = sampleCooldownProviderHealth;
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-06-14T08:00:00+00:00",
          dataSources: [
            {
              market: "us",
              label: "US equities",
              quoteSource: "yfinance",
              klineSource: "yfinance",
              status: "degraded",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          marketDataAdapters: [
            {
              ...samplePlatformSettingsMarketDataAdapters[1],
              externalTelemetry: {
                ...samplePlatformSettingsMarketDataAdapters[1].externalTelemetry,
                providerHealth: providerHealthWithoutSummary
              }
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 0,
            contextCount: 0,
            latestTimestamp: null,
            freshnessSummary: { fresh: 0, stale: 0, empty: 0 },
            contexts: []
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("rejects settings status when market data adapter provider health window summary is missing", async () => {
    const { windowSummary: _windowSummary, ...providerHealthWithoutWindowSummary } = sampleCooldownProviderHealth;
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-06-14T08:00:00+00:00",
          dataSources: [
            {
              market: "us",
              label: "US equities",
              quoteSource: "yfinance",
              klineSource: "yfinance",
              status: "degraded",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          marketDataAdapters: [
            {
              ...samplePlatformSettingsMarketDataAdapters[1],
              externalTelemetry: {
                ...samplePlatformSettingsMarketDataAdapters[1].externalTelemetry,
                providerHealth: providerHealthWithoutWindowSummary
              }
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 0,
            contextCount: 0,
            latestTimestamp: null,
            freshnessSummary: { fresh: 0, stale: 0, empty: 0 },
            contexts: []
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("rejects settings status when cache contexts are missing", async () => {
    const result = await loadPlatformSettings("http://127.0.0.1:8765/", async () => ({
      ok: true,
      json: async () => ({
        settings: {
          schemaVersion: 1,
          generatedAt: "2026-05-31T09:00:00+08:00",
          dataSources: [
            {
              market: "ashare",
              label: "A shares",
              quoteSource: "tencent",
              klineSource: "tencent",
              status: "ready",
              optionalKeyName: null,
              optionalKeyConfigured: false,
              note: "No key required."
            }
          ],
          cache: {
            engine: "sqlite",
            path: "data/market.sqlite",
            exists: true,
            scope: "ohlcv",
            rowCount: 1280,
            contextCount: 12,
            latestTimestamp: "2026-05-29T00:00:00+00:00"
          },
          executionAdapters: [
            {
              id: "paper-local",
              market: "multi",
              adapter: "Paper Trading",
              route: "paper",
              status: "paper_ready",
              certification: "local",
              liveTradingAllowed: false,
              note: "Paper only."
            }
          ],
          safety: {
            liveTradingAllowed: false,
            requiredGates: ["adapter-certified", "risk-approved", "human-confirmed"]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid settings status contract");
  });

  test("runs terminal research and returns a core-backed workspace", async () => {
    const remoteWorkspace = {
      ...buildTerminalWorkspace(),
      schemaVersion: 1,
      quantLoop: [
        { id: "idea", label: "Idea Lab", status: "active" },
        { id: "data", label: "Data & Factor", status: "ready" },
        { id: "strategy", label: "Strategy Builder", status: "ready" },
        { id: "backtest", label: "Backtest Lab", status: "ready" },
        { id: "agent-review", label: "Agent Review", status: "ready" },
        { id: "paper", label: "Paper Trading", status: "ready" },
        { id: "broker", label: "Broker Center", status: "locked" }
      ],
      metrics: [
        { label: "Return", value: "+3.20%", tone: "positive" },
        { label: "Max DD", value: "1.10%", tone: "warning" },
        { label: "Win Rate", value: "50.00%", tone: "neutral" },
        { label: "Trades", value: "8", tone: "neutral" }
      ]
    };
    const calls: string[] = [];
    const currentWorkspace = workspaceWithStrategyField(
      workspaceWithBacktestAssumption(
        workspaceWithBacktestAssumption(buildTerminalWorkspace(), "initialCash", 250000),
        "feeBps",
        8
      ),
      "entry",
      "Close > SMA5"
    );
    const result = await runTerminalResearch(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "1d", watchlistRefreshRunId: "cache-refresh-f10efd7401b7" },
      workspaceWithBacktestAssumption(currentWorkspace, "slippageBps", 4),
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => remoteWorkspace
        };
      }
    );

    const requestUrl = new URL(calls[0]);
    expect(requestUrl.searchParams.get("market")).toBe("ashare");
    expect(requestUrl.searchParams.get("symbol")).toBe("600000");
    expect(requestUrl.searchParams.get("timeframe")).toBe("1d");
    expect(requestUrl.searchParams.get("limit")).toBe("500");
    expect(requestUrl.searchParams.get("initialCash")).toBe("250000");
    expect(requestUrl.searchParams.get("feeBps")).toBe("8");
    expect(requestUrl.searchParams.get("slippageBps")).toBe("4");
    expect(requestUrl.searchParams.get("watchlistRefreshRunId")).toBe("cache-refresh-f10efd7401b7");
    expect(requestUrl.searchParams.get("strategyName")).toBe("SMA Trend / Bank Sector");
    expect(requestUrl.searchParams.get("strategyEntry")).toBe("Close > SMA5");
    expect(result.source).toBe("core");
    expect(result.statusLabel).toBe("Research run complete");
    expect(result.workspace.metrics[0].value).toBe("+3.20%");
    expect(result.workspace.quantLoop.map((step) => step.id)).toEqual([
      "research",
      "strategy",
      "backtest",
      "agent-review",
      "paper"
    ]);
  });

  test("hydrates research run detail when the run workspace omits its data snapshot", async () => {
    const remoteWorkspace = {
      ...buildTerminalWorkspace(),
      schemaVersion: 1,
      researchRun: {
        runId: "run-needs-detail",
        createdAt: "2026-05-29T08:00:00+00:00",
        timeframe: "1d",
        strategyRevision: "rev-snapshot",
        dataRows: 2,
        executionMode: "paper_only"
      },
      metrics: [
        { label: "Return", value: "+8.20%", tone: "positive" },
        { label: "Max DD", value: "3.10%", tone: "warning" },
        { label: "Win Rate", value: "55.00%", tone: "neutral" },
        { label: "Trades", value: "9", tone: "neutral" }
      ]
    };
    const calls: string[] = [];
    const result = await runTerminalResearch(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      buildTerminalWorkspace(),
      async (url) => {
        calls.push(url);
        if (url.endsWith("/api/research/runs/run-needs-detail")) {
          return {
            ok: true,
            json: async () => ({
              run: {
                runId: "run-needs-detail",
                createdAt: "2026-05-29T08:00:00+00:00",
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                strategyName: "SMA trend demo",
                strategyRevision: "rev-snapshot",
                dataRows: 2,
                metrics: {
                  total_return_pct: 8.2,
                  max_drawdown_pct: 3.1,
                  win_rate_pct: 55,
                  trade_count: 9
                },
                decisions: [],
                executionMode: "paper_only",
                dataSnapshot: {
                  source: "tencent",
                  isComplete: true,
                  warnings: [],
                  rows: 2,
                  start: "2026-05-28T08:00:00Z",
                  end: "2026-05-29T08:00:00Z",
                  hash: "snapshot-hydrated",
                  bars: [
                    {
                      timestamp: "2026-05-28T08:00:00Z",
                      timestampMs: 1779955200000,
                      open: 10,
                      high: 10.2,
                      low: 9.9,
                      close: 10,
                      volume: 1000
                    },
                    {
                      timestamp: "2026-05-29T08:00:00Z",
                      timestampMs: 1780041600000,
                      open: 10.2,
                      high: 10.6,
                      low: 10.1,
                      close: 10.5,
                      volume: 1200
                    }
                  ]
                }
              }
            })
          };
        }
        return {
          ok: true,
          json: async () => remoteWorkspace
        };
      }
    );

    const runUrl = new URL(calls[0]);
    expect(runUrl.pathname).toBe("/api/research/run");
    expect(runUrl.searchParams.get("symbol")).toBe("600000");
    expect(calls[1]).toBe("http://127.0.0.1:8765/api/research/runs/run-needs-detail");
    expect(result.source).toBe("core");
    expect(result.workspace.researchRun?.dataSnapshot?.hash).toBe("snapshot-hydrated");
    expect(result.workspace.researchRun?.dataSnapshot?.bars).toHaveLength(2);
  });

  test("keeps the current workspace when research run fails", async () => {
    const currentWorkspace = buildTerminalWorkspace();
    const result = await runTerminalResearch(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      currentWorkspace,
      async () => {
        throw new Error("core offline");
      }
    );

    expect(result.source).toBe("fallback");
    expect(result.statusLabel).toBe("Research run failed");
    expect(result.workspace).toBe(currentWorkspace);
    expect(result.error).toBe("core offline");
  });

  test("loads recent research run history from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunHistory("http://127.0.0.1:8765", 2, async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => ({
          runs: [
            {
              runId: "run-new",
              createdAt: "2026-05-26T08:00:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyName: "SMA trend demo",
              strategyRevision: "rev123",
              dataRows: 120,
              metrics: { total_return_pct: 3.4, trade_count: 8 },
              decisions: [],
              executionMode: "paper_only",
              aiReport: {
                summary: "SMA trend demo research summary",
                risks: ["Sample risk"],
                improvements: ["Compare benchmark"],
                disclaimer: "No investment advice"
              },
              dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 120 },
              strategyConfig: {
                name: "SMA trend demo",
                revision: "rev123",
                market: "ashare",
                symbols: ["600000"],
                timeframe: "1d",
                version: 1,
                entryConditions: [{ kind: "close_above_sma", params: { window: 20 } }],
                exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
                risk: { positionPct: 0.8, stopLossPct: 0.08, takeProfitPct: 0.18, maxDrawdownPct: 0.2 }
              },
              backtestAssumptions: { initialCash: 250000, feeBps: 8, slippageBps: 4 },
              backtestTrades: [
                {
                  id: "trade-1",
                  timestamp: "2026-05-26T08:00:00+00:00",
                  symbol: "600000",
                  side: "BUY",
                  status: "filled",
                  price: "9.20",
                  quantity: "2100",
                  exposure: "19.32%",
                  pnl: "-",
                  reason: "entry_conditions",
                  tone: "neutral"
                }
              ],
              backtestEquityCurve: [
                { timestamp: "2026-05-26T08:00:00+00:00", equity: 250000 },
                { timestamp: "2026-05-27T08:00:00+00:00", equity: 253400 }
              ],
              backtestDiagnostics: [
                {
                  id: "return-profile",
                  label: "Return profile",
                  value: "+3.40%",
                  detail: "Total return over 120 bars",
                  tone: "positive"
                }
              ]
            }
          ]
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs?limit=2"]);
    expect(result.source).toBe("core");
    expect(result.runs[0].runId).toBe("run-new");
    expect(result.runs[0].metrics.trade_count).toBe(8);
    expect(result.runs[0].aiReport?.summary).toBe("SMA trend demo research summary");
    expect(result.runs[0].aiReport?.risks[0]).toBe("Sample risk");
    expect(result.runs[0].aiReport?.improvements[0]).toBe("Compare benchmark");
    expect(result.runs[0].aiReport?.disclaimer).toBe("No investment advice");
    expect(result.runs[0].dataQuality).toEqual({ source: "tencent", isComplete: true, warnings: [], rows: 120 });
    expect(result.runs[0].strategyConfig?.entryConditions[0].params).toEqual({ window: 20 });
    expect(result.runs[0].strategyConfig?.risk.positionPct).toBe(0.8);
    expect(result.runs[0].backtestAssumptions).toEqual({ initialCash: 250000, feeBps: 8, slippageBps: 4 });
    expect(result.runs[0].backtestTrades?.[0]).toMatchObject({ id: "trade-1", side: "BUY" });
    expect(result.runs[0].backtestEquityCurve?.at(-1)?.equity).toBe(253400);
    expect(result.runs[0].backtestDiagnostics?.[0]).toMatchObject({ id: "return-profile", tone: "positive" });
  });

  test("loads one research run detail from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => ({
          run: {
            runId: "run-new",
            createdAt: "2026-05-26T08:00:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyName: "SMA trend demo",
            strategyRevision: "rev123",
            dataRows: 120,
            metrics: { total_return_pct: 3.4, trade_count: 8 },
            decisions: [],
            executionMode: "paper_only",
            aiReport: {
              summary: "SMA trend detail research summary",
              risks: ["Detail risk"],
              improvements: ["Review slippage"],
              disclaimer: "No investment advice"
            },
            dataSnapshot: {
              source: "tencent",
              isComplete: true,
              warnings: [],
              rows: 2,
              start: "2026-05-26T08:00:00+00:00",
              end: "2026-05-27T08:00:00+00:00",
              hash: "snapshot-detail",
              bars: [
                {
                  timestamp: "2026-05-26T08:00:00+00:00",
                  timestampMs: 1779782400000,
                  open: 9.1,
                  high: 9.3,
                  low: 9,
                  close: 9.2,
                  volume: 1200000
                },
                {
                  timestamp: "2026-05-27T08:00:00+00:00",
                  timestampMs: 1779868800000,
                  open: 9.2,
                  high: 9.4,
                  low: 9.1,
                  close: 9.3,
                  volume: 1300000
                }
              ]
            },
            dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 120 },
            strategyConfig: {
              name: "SMA trend demo",
              revision: "rev123",
              market: "ashare",
              symbols: ["600000"],
              timeframe: "1d",
              version: 1,
              entryConditions: [{ kind: "close_above_sma", params: { window: 20 } }],
              exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
              risk: { positionPct: 0.8, stopLossPct: 0.08, takeProfitPct: 0.18, maxDrawdownPct: 0.2 }
            },
            backtestAssumptions: { initialCash: 250000, feeBps: 8, slippageBps: 4 }
          }
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs/run-new"]);
    expect(result.source).toBe("core");
    expect(result.run?.runId).toBe("run-new");
    expect(result.run?.aiReport?.summary).toBe("SMA trend detail research summary");
    expect(result.run?.aiReport?.risks[0]).toBe("Detail risk");
    expect(result.run?.aiReport?.improvements[0]).toBe("Review slippage");
    expect(result.run?.aiReport?.disclaimer).toBe("No investment advice");
    expect(result.run?.dataSnapshot?.hash).toBe("snapshot-detail");
    expect(result.run?.dataSnapshot?.bars.at(-1)?.close).toBe(9.3);
    expect(result.run?.dataQuality).toEqual({ source: "tencent", isComplete: true, warnings: [], rows: 120 });
    expect(result.run?.strategyConfig?.entryConditions[0].params).toEqual({ window: 20 });
    expect(result.run?.strategyConfig?.risk.positionPct).toBe(0.8);
    expect(result.run?.backtestAssumptions).toEqual({ initialCash: 250000, feeBps: 8, slippageBps: 4 });
  });

  test("forwards an abort signal while loading an exact research run", async () => {
    const controller = new AbortController();
    let requestSignal: AbortSignal | null = null;
    const result = await loadResearchRunDetail(
      "http://127.0.0.1:8765",
      "run-new",
      controller.signal,
      async (_url, init) => {
        requestSignal = init?.signal ?? null;
        return {
          ok: false,
          status: 404,
          json: async () => ({ detail: "not found" })
        };
      }
    );

    expect(requestSignal).toBe(controller.signal);
    expect(result.source).toBe("fallback");
  });

  test("loads one research run export package from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunExport("http://127.0.0.1:8765", "run-new", async (url) => {
      calls.push(url);
      return {
        ok: true,
        json: async () => ({
          export: {
            kind: "aiqt.researchRun.export",
            packageVersion: 1,
            exportedAt: "2026-05-26T08:05:00+00:00",
            integrity: {
              algorithm: "sha256",
              hash: "a".repeat(64)
            },
            manifest: {
              runId: "run-new",
              createdAt: "2026-05-26T08:00:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyRevision: "rev123",
              dataHash: "snapshot-detail",
              dataRows: 2,
              executionMode: "paper_only",
              paperOnly: true,
              liveBlockedBoundary: true,
              liveTradingAllowed: false,
              orderSubmissionEnabled: false,
              liveOrderSubmitted: false,
              routeExecuted: false,
              artifactCounts: {
                bars: 2,
                trades: 1,
                equityPoints: 2,
                decisions: 0,
                aiRisks: 1,
                paperExecutions: 1,
                adapterPaperExecutions: 1,
                portfolioPaperOrderBatches: 1,
                promotionCandidates: 1,
                researchNotes: 1,
                aiReviewRuns: 1
              }
            },
            researchRun: {
              runId: "run-new",
              createdAt: "2026-05-26T08:00:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyName: "SMA trend demo",
              strategyRevision: "rev123",
              dataRows: 2,
              metrics: { total_return_pct: 3.4, trade_count: 8 },
              decisions: [],
              executionMode: "paper_only",
              researchNote: {
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                body: "关注银行板块相对强度，等待放量确认。",
                updatedAt: "2026-05-29T07:55:00+00:00"
              },
              dataSnapshot: {
                source: "tencent",
                isComplete: true,
                warnings: [],
                rows: 2,
                start: "2026-05-26T08:00:00+00:00",
                end: "2026-05-27T08:00:00+00:00",
                hash: "snapshot-detail",
                bars: [
                  {
                    timestamp: "2026-05-26T08:00:00+00:00",
                    timestampMs: 1779782400000,
                    open: 9.1,
                    high: 9.3,
                    low: 9,
                    close: 9.2,
                    volume: 1200000
                  },
                  {
                    timestamp: "2026-05-27T08:00:00+00:00",
                    timestampMs: 1779868800000,
                    open: 9.2,
                    high: 9.4,
                    low: 9.1,
                    close: 9.3,
                    volume: 1300000
                  }
                ]
              }
            },
            executionHandoff: {
              mode: "paper_only",
              paperOnly: true,
              liveTradingAllowed: false,
              requiredGates: [
                {
                  id: "adapter-certified",
                  label: "Adapter certified",
                  passed: false,
                  reason: "No certified live adapter is bound to this audited run."
                }
              ]
            },
            paperExecutions: [
              {
                executionId: "paper-exported",
                runId: "run-new",
                createdAt: "2026-05-26T08:20:00+00:00",
                mode: "paper_only",
                account: { cash: 80680, positions: { "600000": 2100 }, equity: 100000 },
                orders: [
                  {
                    orderId: "order-exported",
                    symbol: "600000",
                    side: "buy",
                    quantity: 2100,
                    price: 9.2,
                    status: "filled",
                    reason: "filled_immediately",
                    timestamp: "2026-05-26T08:20:00+00:00"
                  }
                ],
                gates: [
                  {
                    id: "paper-risk-check",
                    label: "Paper risk check",
                    passed: true,
                    reason: "filled_immediately"
                  }
                ]
              }
            ],
            adapterPaperExecutions: [
              {
                schemaVersion: 1,
                adapterPaperExecutionId: "execution-adapter-paper-exported",
                adapterOpsStateId: "execution-adapter-ops-state-exported",
                paperRouteRunbookId: "execution-adapter-paper-route-runbook-exported",
                paperOrderLifecycleId: "execution-adapter-paper-order-lifecycle-exported",
                sandboxOrderSchemaDryRunId: "execution-adapter-sandbox-order-schema-dry-run-exported",
                productionRouteReviewId: "execution-adapter-production-route-review-exported",
                sandboxProbeReviewId: "execution-adapter-sandbox-probe-review-exported",
                sandboxProbeExecutionId: "execution-adapter-sandbox-probe-execution-exported",
                sandboxProbePlanId: "execution-adapter-sandbox-probe-plan-exported",
                humanConfirmationId: "execution-adapter-human-confirmation-exported",
                orchestrationExecutionId: "execution-adapter-orchestration-execution-exported",
                dryRunId: "execution-adapter-orchestration-dry-run-exported",
                acceptanceId: "execution-adapter-runtime-reload-acceptance-exported",
                executionId: "execution-adapter-runtime-reload-execution-exported",
                planId: "execution-adapter-runtime-reload-plan-exported",
                bindingId: "execution-adapter-environment-binding-exported",
                materializationId: "execution-adapter-secret-materialization-exported",
                manifestValidationId: "execution-adapter-secret-manifest-validation-exported",
                adapterId: "ashare-live",
                market: "ashare",
                route: "live",
                status: "paper_execution_recorded",
                operator: "local-operator",
                recordedAt: "2026-05-26T08:22:00+00:00",
                paperExecutionMode: "manual_adapter_paper_execution",
                opsMode: "manual_adapter_ops_state",
                runbookMode: "manual_paper_route_runbook",
                lifecycleMode: "manual_paper_order_lifecycle_adapter",
                dryRunMode: "manual_sandbox_order_schema_dry_run",
                reviewMode: "manual_production_route_review",
                sandboxReviewMode: "manual_sandbox_probe_review",
                probeExecutionMode: "manual_readonly_sandbox_probe",
                probeMode: "manual_sandbox_probe_plan",
                confirmationMode: "manual_final_human_confirmation",
                orchestrationExecutionMode: "manual_adapter_orchestration_execution",
                orchestrationMode: "manual_adapter_orchestration_dry_run",
                acceptanceMode: "manual_runtime_reload_acceptance",
                executionMode: "manual_controlled_reload",
                reloadMode: "manual_container_reload_plan",
                maintenanceWindowId: "window-adapter-paper-exported",
                bindingMode: "container_env_reference",
                manifestPath: "local-secret-store://ashare-live/sandbox",
                requiredEnvVars: ["ASHARE_API_KEY", "ASHARE_API_SECRET"],
                orderIntent: { symbol: "600000", side: "buy", type: "limit", quantity: 2100, price: 9.21 },
                lifecycleSteps: [],
                runbookSteps: [],
                opsSteps: [],
                paperExecutionSteps: [
                  { id: "simulated-fill-recorded", label: "Simulated fill recorded", status: "recorded" }
                ],
                simulatedFill: {
                  fillId: "paper-fill-exported",
                  status: "filled",
                  symbol: "600000",
                  side: "buy",
                  type: "limit",
                  quantity: 2100,
                  price: 9.21,
                  source: "local-paper-ledger",
                  orderSubmitted: false,
                  liveOrderSubmitted: false,
                  routeExecuted: false
                },
                paperFillRecorded: true,
                orderSubmitted: false,
                liveOrderSubmitted: false,
                routeExecuted: false,
                requiredConfirmations: [
                  { id: "operator-confirmed-no-live-routing", label: "No live routing", status: "confirmed" }
                ],
                blockedReasons: [],
                metadata: { source: "export-package" },
                liveTradingAllowed: false,
                paperOnly: true
              }
            ],
            portfolioPaperOrderBatches: [
              {
                batchId: "portfolio-paper-batch-exported",
                baseRunId: "run-new",
                portfolioName: "Portable basket",
                createdAt: "2026-05-26T08:25:00+00:00",
                mode: "portfolio_paper_order_review",
                source: "portfolio_backtest",
                summary: {
                  totalOrders: 1,
                  totalNotionalValue: 19341,
                  statusCounts: { pending_review: 1 },
                  riskStatusCounts: { review: 1 }
                },
                orders: [
                  {
                    timestamp: "2026-05-26T08:25:00+00:00",
                    eventType: "portfolio_paper_order",
                    orderId: "portfolio-paper-order-exported",
                    symbol: "600000",
                    sourceRunId: "run-new",
                    side: "buy",
                    notionalValue: 19341,
                    quantity: 2100,
                    status: "pending_review",
                    riskStatus: "review",
                    reason: "Portfolio order requires operator review."
                  }
                ]
              }
            ],
            promotionCandidate: {
              candidateId: "promotion-run-new",
              runId: "run-new",
              createdAt: "2026-05-26T08:20:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyRevision: "rev123",
              latestPaperExecutionId: "paper-exported",
              status: "certification_pending",
              headline: "Live promotion pending certification",
              summary: "Paper execution has passed, but live routing stays blocked until adapter certification and human confirmation pass.",
              liveTradingAllowed: false,
              evidence: { paperExecutions: 1, filledOrders: 1, passedPaperRiskChecks: 1 },
              stages: [
                {
                  id: "paper-execution",
                  label: "Paper execution",
                  value: "1 filled order",
                  detail: "Paper snapshot paper-exported passed local risk checks before live promotion.",
                  status: "passed",
                  tone: "positive",
                  passed: true,
                  reason: "Paper snapshot paper-exported passed local risk checks before live promotion."
                }
              ]
            }
            ,
            aiReviewRuns: [
              {
                aiReviewId: "ai-review:run-new:rev123",
                runId: "run-new",
                createdAt: "2026-05-26T08:30:00+00:00",
                record: {
                  schemaVersion: 1,
                  recordType: "aiqt.aiReviewRun",
                  aiReviewId: "ai-review:run-new:rev123",
                  runId: "run-new",
                  createdAt: "2026-05-26T08:30:00+00:00",
                  market: "ashare",
                  symbol: "600000",
                  timeframe: "1d",
                  strategyRevision: "rev123",
                  executionMode: "paper_only",
                  status: "ready",
                  summary: {
                    citationCount: 1,
                    roundCount: 1,
                    decisionCount: 1,
                    parameterScanBound: true,
                    liveExecutionBlocked: true
                  },
                  dossier: {
                    status: "ready",
                    headline: "AI review saved",
                    summary: "Evidence only.",
                    citations: []
                  },
                  citations: [
                    {
                      id: "parameter-scan",
                      label: "Parameter scan",
                      value: "SMA20",
                      detail: "Re-audit before promotion.",
                      tone: "warning"
                    }
                  ],
                  rounds: [
                    {
                      id: "technical-analysis",
                      phase: "analysis",
                      agent: "Technical Analyst",
                      thesis: "Trend remains constructive but needs audited evidence.",
                      evidence: "SMA20 and parameter scan are attached.",
                      verdict: "support",
                      confidence: 0.64,
                      tone: "positive"
                    }
                  ],
                  decisionLog: [{ agent: "Technical", message: "Evidence only.", tone: "positive" }],
                  evidenceAnchors: [
                    {
                      id: "run:run-new",
                      type: "research-run",
                      label: "Research run",
                      reference: "run-new",
                      exportPath: "researchRun.runId"
                    },
                    {
                      id: "citation:parameter-scan",
                      type: "citation",
                      label: "Parameter scan",
                      reference: "parameter-scan",
                      exportPath: "aiReviewRuns[].record.citations[parameter-scan]"
                    }
                  ],
                  boundary: "Evidence explanation only; no buy/sell instructions or guaranteed returns."
                }
              }
            ]
          }
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs/run-new/export"]);
    expect(result.source).toBe("core");
    expect(result.exportPackage?.integrity?.algorithm).toBe("sha256");
    expect(result.exportPackage?.manifest.dataHash).toBe("snapshot-detail");
    expect(result.exportPackage?.manifest.artifactCounts.bars).toBe(2);
    expect(result.exportPackage?.manifest.artifactCounts.paperExecutions).toBe(1);
    expect(result.exportPackage?.manifest.artifactCounts.adapterPaperExecutions).toBe(1);
    expect(result.exportPackage?.manifest.artifactCounts.portfolioPaperOrderBatches).toBe(1);
    expect(result.exportPackage?.manifest.artifactCounts.promotionCandidates).toBe(1);
    expect(result.exportPackage?.manifest.artifactCounts.researchNotes).toBe(1);
    expect(result.exportPackage?.manifest.artifactCounts.aiReviewRuns).toBe(1);
    expect(result.exportPackage?.researchRun.researchNote?.body).toBe("关注银行板块相对强度，等待放量确认。");
    expect(result.exportPackage?.researchRun.dataSnapshot?.bars.at(-1)?.close).toBe(9.3);
    expect(result.exportPackage?.executionHandoff.liveTradingAllowed).toBe(false);
    expect(result.exportPackage?.paperExecutions?.[0]?.executionId).toBe("paper-exported");
    expect(result.exportPackage?.adapterPaperExecutions?.[0]?.adapterPaperExecutionId).toBe(
      "execution-adapter-paper-exported"
    );
    expect(result.exportPackage?.adapterPaperExecutions?.[0]?.manifestValidationId).toBe(
      "execution-adapter-secret-manifest-validation-exported"
    );
    expect(result.exportPackage?.adapterPaperExecutions?.[0]?.simulatedFill.orderSubmitted).toBe(false);
    expect(result.exportPackage?.portfolioPaperOrderBatches?.[0]?.batchId).toBe("portfolio-paper-batch-exported");
    expect(result.exportPackage?.promotionCandidate?.status).toBe("certification_pending");
    expect(result.exportPackage?.aiReviewRuns?.[0]?.aiReviewId).toBe("ai-review:run-new:rev123");
    expect(result.exportPackage?.aiReviewRuns?.[0]?.record.evidenceAnchors?.map((anchor) => anchor.id)).toEqual([
      "run:run-new",
      "citation:parameter-scan"
    ]);
  });

  test("returns fallback when research run export package is malformed", async () => {
    const result = await loadResearchRunExport("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        export: {
          kind: "aiqt.researchRun.export",
          packageVersion: 1,
          manifest: { runId: "run-new" },
          researchRun: { runId: "run-new" },
          executionHandoff: { liveTradingAllowed: true }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.exportPackage).toBeUndefined();
    expect(result.error).toBe("Invalid research run export contract");
  });

  test("returns fallback when research run export adapter paper executions are malformed", async () => {
    const result = await loadResearchRunExport("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        export: {
          kind: "aiqt.researchRun.export",
          packageVersion: 1,
          exportedAt: "2026-05-26T08:05:00+00:00",
          manifest: {
            runId: "run-new",
            createdAt: "2026-05-26T08:00:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyRevision: "rev123",
            dataHash: "snapshot-detail",
            dataRows: 1,
            executionMode: "paper_only",
            paperOnly: true,
            liveTradingAllowed: false,
            artifactCounts: {
              bars: 1,
              trades: 0,
              equityPoints: 0,
              decisions: 0,
              aiRisks: 0,
              adapterPaperExecutions: 1
            }
          },
          researchRun: {
            runId: "run-new",
            createdAt: "2026-05-26T08:00:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyName: "SMA trend demo",
            strategyRevision: "rev123",
            dataRows: 1,
            metrics: { total_return_pct: 0, trade_count: 0 },
            decisions: [],
            executionMode: "paper_only",
            dataSnapshot: {
              source: "tencent",
              isComplete: true,
              warnings: [],
              rows: 1,
              start: "2026-05-26T08:00:00+00:00",
              end: "2026-05-26T08:00:00+00:00",
              hash: "snapshot-detail",
              bars: [
                {
                  timestamp: "2026-05-26T08:00:00+00:00",
                  timestampMs: 1779782400000,
                  open: 9.1,
                  high: 9.3,
                  low: 9,
                  close: 9.2,
                  volume: 1200000
                }
              ]
            }
          },
          executionHandoff: {
            mode: "paper_only",
            paperOnly: true,
            liveTradingAllowed: false,
            requiredGates: [
              {
                id: "adapter-certified",
                label: "Adapter certified",
                passed: false,
                reason: "No certified live adapter is bound to this audited run."
              }
            ]
          },
          adapterPaperExecutions: [{ adapterPaperExecutionId: "broken-adapter-paper-execution" }]
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.exportPackage).toBeUndefined();
    expect(result.error).toBe("Invalid research run export contract");
  });

  test("normalizes raw and wrapped research run export package payloads for preview", () => {
    const exportPackage = {
      kind: "aiqt.researchRun.export",
      packageVersion: 1,
      exportedAt: "2026-05-26T08:05:00+00:00",
      manifest: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-preview",
        dataHash: "hash-preview",
        dataRows: 1,
        executionMode: "paper_only",
        paperOnly: true,
        liveBlockedBoundary: true,
        liveTradingAllowed: false,
        orderSubmissionEnabled: false,
        liveOrderSubmitted: false,
        routeExecuted: false,
        artifactCounts: { bars: 1, trades: 0, equityPoints: 0, decisions: 0, aiRisks: 0 }
      },
      researchRun: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Preview SMA trend",
        strategyRevision: "rev-preview",
        dataRows: 1,
        metrics: { total_return_pct: 1.2, trade_count: 0 },
        decisions: [],
        executionMode: "paper_only",
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 1,
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-26T08:00:00+00:00",
          hash: "hash-preview",
          bars: [
            {
              timestamp: "2026-05-26T08:00:00+00:00",
              timestampMs: 1779782400000,
              open: 9.1,
              high: 9.3,
              low: 9,
              close: 9.2,
              volume: 1200000
            }
          ]
        }
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: [{ id: "adapter-certified", label: "Adapter certified", passed: false, reason: "Blocked" }]
      }
    } satisfies ResearchRunExportPackage;

    expect(normalizeResearchRunExportPackagePayload(exportPackage)?.manifest.runId).toBe("run-preview");
    expect(normalizeResearchRunExportPackagePayload({ export: exportPackage })?.manifest.runId).toBe("run-preview");
    expect(normalizeResearchRunExportPackagePayload({ export: { manifest: { runId: "broken" } } })).toBeNull();
  });

  test("normalizes legacy-only and authoritative Stage 3 archive packages", () => {
    const stage3Package = sampleStage3ArchiveExportPackage();
    const normalized = normalizeResearchRunExportPackagePayload(stage3Package);
    const {
      aiReviewRunsV2: _reviews,
      aiReviewDecisions: _decisions,
      ...legacyOnly
    } = stage3Package;
    const {
      aiReviewRunsV2: _reviewCount,
      aiReviewDecisions: _decisionCount,
      ...legacyArtifactCounts
    } = legacyOnly.manifest.artifactCounts;
    const legacyManifest = {
      ...legacyOnly.manifest,
      artifactCounts: legacyArtifactCounts
    };

    expect(normalized?.aiReviewRunsV2?.[0]?.record.aiReviewId).toBe(
      "ai-review-0123456789abcdef0123456789abcdef"
    );
    expect(normalized?.aiReviewRunsV2?.[0]?.record).toBe(stage3Package.aiReviewRunsV2[0].record);
    expect(normalized?.aiReviewRunsV2?.[0]?.record).not.toHaveProperty("authority");
    expect(normalized?.aiReviewDecisions?.[0]?.record.decisionId).toBe(
      "ai-review-decision-11111111111111111111111111111111"
    );
    expect(
      normalizeResearchRunExportPackagePayload({
        ...legacyOnly,
        manifest: legacyManifest
      })?.manifest.runId
    ).toBe("run-primary");
  });

  test("rejects invalid authoritative archive records without falling back to legacy", () => {
    const stage3Package = sampleStage3ArchiveExportPackage();
    const invalidReview = {
      ...stage3Package.aiReviewRunsV2[0],
      record: {
        ...stage3Package.aiReviewRunsV2[0].record,
        boundary: {
          ...stage3Package.aiReviewRunsV2[0].record.boundary,
          liveTradingAllowed: true
        }
      }
    };

    expect(
      normalizeResearchRunExportPackagePayload({
        ...stage3Package,
        aiReviewRunsV2: [invalidReview]
      })
    ).toBeNull();

    expect(
      normalizeResearchRunExportPackagePayload({
        ...stage3Package,
        aiReviewRunsV2: [{
          ...stage3Package.aiReviewRunsV2[0],
          record: {
            ...stage3Package.aiReviewRunsV2[0].record,
            unexpected: true
          }
        }]
      })
    ).toBeNull();

    expect(
      normalizeResearchRunExportPackagePayload({
        ...stage3Package,
        aiReviewDecisions: [{
          ...stage3Package.aiReviewDecisions[0],
          record: {
            ...stage3Package.aiReviewDecisions[0].record,
            status: "unknown"
          }
        }]
      })
    ).toBeNull();

    expect(
      normalizeResearchRunExportPackagePayload({
        ...stage3Package,
        aiReviewRuns: [sampleLegacyArchiveEnvelope(stage3Package.aiReviewRunsV2[0].aiReviewId)],
        manifest: {
          ...stage3Package.manifest,
          artifactCounts: {
            ...stage3Package.manifest.artifactCounts,
            aiReviewRuns: 1
          }
        }
      })
    ).toBeNull();
  });

  test("rejects Stage 3 archive count mismatches and unsafe package boundaries", () => {
    const stage3Package = sampleStage3ArchiveExportPackage();

    expect(
      normalizeResearchRunExportPackagePayload({
        ...stage3Package,
        manifest: {
          ...stage3Package.manifest,
          artifactCounts: {
            ...stage3Package.manifest.artifactCounts,
            aiReviewRunsV2: 0
          }
        }
      })
    ).toBeNull();
    for (const field of [
      "liveBlockedBoundary",
      "orderSubmissionEnabled",
      "liveOrderSubmitted",
      "routeExecuted"
    ]) {
      const manifest = { ...stage3Package.manifest } as Record<string, unknown>;
      delete manifest[field];
      expect(
        normalizeResearchRunExportPackagePayload({
          ...stage3Package,
          manifest
        })
      ).toBeNull();
    }
    expect(
      normalizeResearchRunExportPackagePayload({
        ...stage3Package,
        manifest: {
          ...stage3Package.manifest,
          artifactCounts: {
            ...stage3Package.manifest.artifactCounts,
            aiReviewDecisions: 0
          }
        }
      })
    ).toBeNull();
    expect(
      normalizeResearchRunExportPackagePayload({
        ...stage3Package,
        executionHandoff: {
          ...stage3Package.executionHandoff,
          liveTradingAllowed: true
        }
      })
    ).toBeNull();
    expect(
      normalizeResearchRunExportPackagePayload({
        ...stage3Package,
        manifest: {
          ...stage3Package.manifest,
          route: "live"
        }
      })
    ).toBeNull();
  });

  test("normalizes P0 package completeness and run-bound audit events", () => {
    const auditEvent: AuditEventRecord = {
      schemaVersion: 1,
      eventId: "p0-paper-simulation-paper-exec-preview",
      eventType: "p0_paper_simulation",
      runId: "run-preview",
      createdAt: "2026-05-26T08:10:00+00:00",
      stage: "execution",
      source: "p0-paper-simulation",
      summary: "P0 paper simulation recorded; live routing blocked.",
      detail: "Portable P0 paper simulation evidence.",
      metadata: {
        paperExecutionId: "paper-exec-preview",
        paperOnly: true,
        liveTradingAllowed: false
      }
    };
    const exportPackage = {
      kind: "aiqt.researchRun.export",
      packageVersion: 1,
      exportedAt: "2026-05-26T08:05:00+00:00",
      manifest: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-preview",
        dataHash: "hash-preview",
        dataRows: 1,
        executionMode: "paper_only",
        paperOnly: true,
        liveBlockedBoundary: true,
        liveTradingAllowed: false,
        orderSubmissionEnabled: false,
        liveOrderSubmitted: false,
        routeExecuted: false,
        artifactCounts: {
          bars: 1,
          trades: 1,
          equityPoints: 1,
          decisions: 1,
          aiRisks: 1,
          paperExecutions: 1,
          aiReviewRuns: 1,
          auditEvents: 1
        }
      },
      researchRun: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Preview SMA trend",
        strategyRevision: "rev-preview",
        dataRows: 1,
        metrics: { total_return_pct: 1.2, trade_count: 1 },
        decisions: [{ agent: "AI Summary", message: "Portable", tone: "ai" }],
        executionMode: "paper_only",
        aiReport: {
          summary: "Evidence only",
          risks: ["Imported package only explains evidence"],
          improvements: [],
          disclaimer: "No investment advice"
        },
        strategyConfig: {
          name: "Preview SMA trend",
          revision: "rev-preview",
          market: "ashare",
          symbols: ["600000"],
          timeframe: "1d",
          version: 1,
          entryConditions: [{ kind: "close_above_sma", params: { window: 20 } }],
          exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
          risk: { positionPct: 0.2, stopLossPct: 0.08, takeProfitPct: 0.18, maxDrawdownPct: 0.2 }
        },
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 1,
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-26T08:00:00+00:00",
          hash: "hash-preview",
          bars: [
            {
              timestamp: "2026-05-26T08:00:00+00:00",
              timestampMs: 1779782400000,
              open: 9.1,
              high: 9.3,
              low: 9,
              close: 9.2,
              volume: 1200000
            }
          ]
        },
        backtestTrades: [
          {
            id: "trade-preview",
            timestamp: "2026-05-26T08:00:00+00:00",
            symbol: "600000",
            side: "BUY",
            status: "filled",
            price: "9.20",
            quantity: "2100",
            exposure: "19.32%",
            pnl: "-",
            reason: "entry_conditions",
            tone: "neutral"
          }
        ],
        backtestEquityCurve: [{ timestamp: "2026-05-26T08:00:00+00:00", equity: 100000 }]
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: [{ id: "adapter-certified", label: "Adapter certified", passed: false, reason: "Blocked" }]
      },
      paperExecutions: [
        {
          executionId: "paper-exec-preview",
          runId: "run-preview",
          createdAt: "2026-05-26T08:10:00+00:00",
          mode: "paper_only",
          account: { cash: 80659, equity: 100000, positions: { "600000": 2100 } },
          orders: [
            {
              orderId: "paper-order-preview",
              symbol: "600000",
              side: "buy",
              quantity: 2100,
              price: 9.21,
              status: "filled",
              timestamp: "2026-05-26T08:10:00+00:00",
              reason: "P0 paper simulation"
            }
          ],
          gates: []
        }
      ],
      aiReviewRuns: [
        {
          aiReviewId: "ai-review:run-preview:rev-preview",
          runId: "run-preview",
          createdAt: "2026-05-26T08:08:00+00:00",
          record: {
            schemaVersion: 1,
            recordType: "aiqt.aiReviewRun",
            aiReviewId: "ai-review:run-preview:rev-preview",
            runId: "run-preview",
            createdAt: "2026-05-26T08:08:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            executionMode: "paper_only",
            status: "ready",
            strategyRevision: "rev-preview",
            summary: {
              citationCount: 1,
              roundCount: 1,
              decisionCount: 1,
              parameterScanBound: false,
              liveExecutionBlocked: true
            },
            dossier: {
              status: "ready",
              headline: "Evidence reviewed",
              summary: "Portable P0 evidence is bound to the audited run.",
              citations: [
                {
                  id: "run",
                  label: "Audited run",
                  value: "run-preview",
                  detail: "Run is present in the export package.",
                  tone: "ai"
                }
              ]
            },
            citations: [
              {
                id: "run",
                label: "Audited run",
                value: "run-preview",
                detail: "Run is present in the export package.",
                tone: "ai"
              }
            ],
            rounds: [
              {
                id: "round-risk",
                phase: "risk",
                agent: "Risk Manager",
                thesis: "Paper-only boundary is intact.",
                evidence: "executionHandoff.liveTradingAllowed=false",
                verdict: "risk",
                confidence: 0.82,
                tone: "warning"
              }
            ],
            decisionLog: [{ agent: "Risk Manager", message: "Keep live routing blocked.", tone: "warning" }],
            boundary: "Evidence explanation only; no direct trading instructions."
          }
        }
      ],
      auditEvents: [auditEvent],
      p0PackageCompleteness: {
        kind: "aiqt.p0PackageCompleteness",
        schemaVersion: 1,
        runId: "run-preview",
        ready: true,
        status: "complete",
        passed: 9,
        review: 0,
        blocked: 0,
        total: 9,
        progressPct: 100,
        paperOnly: true,
        liveTradingAllowed: false,
        liveBlockedBoundary: true,
        summary: "P0 package complete: 9/9 criteria passed.",
        criteria: [
          {
            id: "paper-simulation",
            label: "Paper simulation record",
            status: "passed",
            detail: "1 paper executions · 1 P0 audit events",
            evidence: "1 paper executions · 1 P0 audit events",
            evidencePath: "paperExecutions[]"
          }
        ]
      }
    } satisfies ResearchRunExportPackage;

    const normalized = normalizeResearchRunExportPackagePayload({ export: exportPackage });

    expect(normalized?.manifest.artifactCounts.auditEvents).toBe(1);
    expect(normalized?.auditEvents?.[0].eventType).toBe("p0_paper_simulation");
    expect(normalized?.p0PackageCompleteness?.ready).toBe(true);
    expect(normalized?.p0PackageCompleteness?.criteria[0]?.id).toBe("paper-simulation");
  });

  test("rejects malformed portfolio paper order batches in export packages", () => {
    const exportPackage = {
      kind: "aiqt.researchRun.export",
      packageVersion: 1,
      exportedAt: "2026-05-26T08:05:00+00:00",
      manifest: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-preview",
        dataHash: "hash-preview",
        dataRows: 1,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: {
          bars: 1,
          trades: 0,
          equityPoints: 0,
          decisions: 0,
          aiRisks: 0,
          portfolioPaperOrderBatches: 1
        }
      },
      researchRun: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Preview SMA trend",
        strategyRevision: "rev-preview",
        dataRows: 1,
        metrics: { total_return_pct: 1.2, trade_count: 0 },
        decisions: [],
        executionMode: "paper_only",
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 1,
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-26T08:00:00+00:00",
          hash: "hash-preview",
          bars: [
            {
              timestamp: "2026-05-26T08:00:00+00:00",
              timestampMs: 1779782400000,
              open: 9.1,
              high: 9.3,
              low: 9,
              close: 9.2,
              volume: 1200000
            }
          ]
        }
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: [{ id: "adapter-certified", label: "Adapter certified", passed: false, reason: "Blocked" }]
      },
      portfolioPaperOrderBatches: [{ batchId: "broken-batch" }]
    };

    expect(normalizeResearchRunExportPackagePayload(exportPackage)).toBeNull();
  });

  test("rejects malformed portfolio paper order approvals and simulations in export packages", () => {
    const exportPackage = {
      kind: "aiqt.researchRun.export",
      packageVersion: 1,
      exportedAt: "2026-05-26T08:05:00+00:00",
      manifest: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-preview",
        dataHash: "hash-preview",
        dataRows: 1,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: {
          bars: 1,
          trades: 0,
          equityPoints: 0,
          decisions: 0,
          aiRisks: 0,
          portfolioPaperOrderApprovals: 1,
          portfolioPaperOrderSimulations: 1
        }
      },
      researchRun: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Preview SMA trend",
        strategyRevision: "rev-preview",
        dataRows: 1,
        metrics: { total_return_pct: 1.2, trade_count: 0 },
        decisions: [],
        executionMode: "paper_only",
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 1,
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-26T08:00:00+00:00",
          hash: "hash-preview",
          bars: [
            {
              timestamp: "2026-05-26T08:00:00+00:00",
              timestampMs: 1779782400000,
              open: 9.1,
              high: 9.3,
              low: 9,
              close: 9.2,
              volume: 1200000
            }
          ]
        }
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: [{ id: "adapter-certified", label: "Adapter certified", passed: false, reason: "Blocked" }]
      },
      portfolioPaperOrderApprovals: [{ approvalId: "broken-approval" }],
      portfolioPaperOrderSimulations: [{ simulationId: "broken-simulation" }]
    };

    expect(normalizeResearchRunExportPackagePayload(exportPackage)).toBeNull();
  });

  test("strips untrusted local package verification markers from external package signatures", () => {
    const exportPackage = {
      kind: "aiqt.researchRun.export",
      packageVersion: 1,
      exportedAt: "2026-05-26T08:05:00+00:00",
      manifest: {
        runId: "run-untrusted-verification",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-untrusted-verification",
        dataHash: "hash-untrusted-verification",
        dataRows: 1,
        executionMode: "paper_only",
        paperOnly: true,
        liveBlockedBoundary: true,
        liveTradingAllowed: false,
        orderSubmissionEnabled: false,
        liveOrderSubmitted: false,
        routeExecuted: false,
        artifactCounts: { bars: 1, trades: 0, equityPoints: 0, decisions: 0, aiRisks: 0 }
      },
      researchRun: {
        runId: "run-untrusted-verification",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Untrusted marker test",
        strategyRevision: "rev-untrusted-verification",
        dataRows: 1,
        metrics: { total_return_pct: 1.2, trade_count: 0 },
        decisions: [],
        executionMode: "paper_only",
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 1,
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-26T08:00:00+00:00",
          hash: "hash-untrusted-verification",
          bars: []
        }
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: [{ id: "adapter-certified", label: "Adapter certified", passed: false, reason: "Blocked" }]
      },
      auditReport: {
        kind: "aiqt.auditReport",
        schemaVersion: 1,
        runId: "run-untrusted-verification",
        generatedAt: "2026-05-26T08:01:00+00:00",
        format: "text/markdown",
        fileName: "run-untrusted-verification-audit-evidence-report.md",
        contentSha256: { algorithm: "sha256", hash: "b".repeat(64) },
        contentMarkdown: "# report",
        signature: {
          eventId: "audit-report-untrusted-verification",
          status: "signed",
          algorithm: "hmac-sha256",
          chainId: "audit-chain-local",
          keyId: "local-audit-key",
          signedAt: "2026-05-26T08:01:00+00:00",
          signer: "Local Audit Key",
          value: "c".repeat(64),
          importVerificationReason: "signature_verified",
          importVerificationSource: "local-core",
          importVerificationStatus: "verified",
          importVerifiedAt: "2026-05-26T08:02:00+00:00"
        },
        evidenceSummary: {
          kind: "aiqt.auditEvidenceSummary",
          schemaVersion: 1,
          runId: "run-untrusted-verification",
          generatedAt: "2026-05-26T08:01:00+00:00",
          auditQuery: "manifest:run-untrusted-verification",
          packageQuery: "manifest:run-untrusted-verification",
          importDiffQuery: "manifest:run-untrusted-verification",
          focusQuery: "manifest:run-untrusted-verification",
          deepLinkStatus: "loaded",
          deepLinkError: null,
          package: { ready: 1, missing: 0, blocked: 0, matched: 1, total: 1 },
          importDiff: { changes: 0, adds: 1, blocked: 0, matched: 1, total: 1 },
          copyText: "Run: run-untrusted-verification"
        }
      }
    };

    const normalized = normalizeResearchRunExportPackagePayload(exportPackage);

    expect(normalized?.auditReport?.signature?.status).toBe("signed");
    expect(normalized?.auditReport?.signature?.importVerificationSource).toBeUndefined();
    expect(normalized?.auditReport?.signature?.importVerificationStatus).toBeUndefined();
    expect(normalized?.auditReport?.signature?.importVerificationReason).toBeUndefined();
    expect(normalized?.auditReport?.signature?.importVerifiedAt).toBeUndefined();
  });

  test("attaches audit evidence summary metadata and strategy experiment evidence to export artifacts", async () => {
    const exportPackage = {
      kind: "aiqt.researchRun.export",
      packageVersion: 1,
      exportedAt: "2026-05-26T08:05:00+00:00",
      integrity: { algorithm: "sha256", hash: "a".repeat(64) },
      manifest: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-preview",
        dataHash: "hash-preview",
        dataRows: 1,
        executionMode: "paper_only",
        paperOnly: true,
        liveBlockedBoundary: true,
        liveTradingAllowed: false,
        orderSubmissionEnabled: false,
        liveOrderSubmitted: false,
        routeExecuted: false,
        artifactCounts: { bars: 1, trades: 0, equityPoints: 0, decisions: 0, aiRisks: 0 }
      },
      researchRun: {
        runId: "run-preview",
        createdAt: "2026-05-26T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "Preview SMA trend",
        strategyRevision: "rev-preview",
        dataRows: 1,
        metrics: { total_return_pct: 1.2, trade_count: 0 },
        decisions: [],
        executionMode: "paper_only",
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 1,
          start: "2026-05-26T08:00:00+00:00",
          end: "2026-05-26T08:00:00+00:00",
          hash: "hash-preview",
          bars: [
            {
              timestamp: "2026-05-26T08:00:00+00:00",
              timestampMs: 1779782400000,
              open: 9.1,
              high: 9.3,
              low: 9,
              close: 9.2,
              volume: 1200000
            }
          ]
        }
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: [{ id: "adapter-certified", label: "Adapter certified", passed: false, reason: "Blocked" }]
      }
    } satisfies ResearchRunExportPackage;

    const summary = {
      auditQuery: "manual-smoke",
      copyText: "AIQT Audit Evidence Summary\nRun: run-preview",
      deepLinkError: null,
      deepLinkStatus: "loaded" as const,
      focusQuery: "manifest:run-preview",
      importDiffAddCount: 0,
      importDiffBlockedCount: 0,
      importDiffChangeCount: 0,
      importDiffMatchedCount: 1,
      importDiffQuery: "manifest:run-preview",
      importDiffTotalCount: 11,
      importVerificationBuckets: [
        {
          count: 1,
          latestExportPath: "auditReport.contentSha256.hash",
          latestReason: "signature_verified",
          source: "local-core" as const,
          status: "verified" as const
        }
      ],
      importVerificationInvalidCount: 0,
      importVerificationVerifiedCount: 1,
      importPolicyBlockedCount: 1,
      importPolicyBlockerBuckets: [
        {
          category: "import-verification" as const,
          count: 1,
          label: "Import verification",
          latestDetail: "Audit report carries invalid imported evidence and cannot be trusted for import.",
          latestExportPath: "auditReport.contentSha256.hash",
          latestFileName: "invalid-evidence.json",
          latestRunId: "run-preview",
          tone: "risk" as const
        }
      ],
      packageBlockedCount: 0,
      packageMatchedCount: 1,
      packageMissingCount: 0,
      packageQuery: "manifest:run-preview",
      packageReadyCount: 5,
      packageTotalCount: 9,
      runId: "run-preview"
    };

    const enrichedPackage = withResearchRunExportAuditEvidenceSummary(
      exportPackage,
      summary,
      "2026-06-04T08:00:00+00:00"
    );
    const auditReport = await buildResearchRunExportAuditReport(summary, "2026-06-04T08:00:00+00:00");
    const enrichedArtifactPackage = await withResearchRunExportAuditEvidenceArtifacts(
      exportPackage,
      summary,
      "2026-06-04T08:00:00+00:00"
    );

    expect(enrichedPackage.auditEvidenceSummary).toMatchObject({
      kind: "aiqt.auditEvidenceSummary",
      schemaVersion: 1,
      runId: "run-preview",
      generatedAt: "2026-06-04T08:00:00+00:00",
      package: { ready: 5, missing: 0, blocked: 0, matched: 1, total: 9 },
      importDiff: { changes: 0, adds: 0, blocked: 0, matched: 1, total: 11 },
      importVerification: {
        verified: 1,
        invalid: 0,
        buckets: [
          {
            count: 1,
            latestExportPath: "auditReport.contentSha256.hash",
            latestReason: "signature_verified",
            source: "local-core",
            status: "verified"
          }
        ]
      },
      importPolicyBlockers: {
        blocked: 1,
        buckets: [
          {
            category: "import-verification",
            count: 1,
            label: "Import verification",
            latestDetail: "Audit report carries invalid imported evidence and cannot be trusted for import.",
            latestExportPath: "auditReport.contentSha256.hash",
            latestFileName: "invalid-evidence.json",
            latestRunId: "run-preview",
            tone: "risk"
          }
        ]
      }
    });
    expect(normalizeResearchRunExportPackagePayload(enrichedPackage)?.auditEvidenceSummary?.copyText).toContain(
      "AIQT Audit Evidence Summary"
    );
    expect(normalizeResearchRunExportPackagePayload({ export: enrichedPackage })?.auditEvidenceSummary?.package.matched).toBe(
      1
    );
    expect(
      normalizeResearchRunExportPackagePayload({ export: enrichedPackage })?.auditEvidenceSummary?.importVerification?.verified
    ).toBe(1);
    expect(
      normalizeResearchRunExportPackagePayload({ export: enrichedPackage })?.auditEvidenceSummary?.importPolicyBlockers?.blocked
    ).toBe(1);
    expect(auditReport).toMatchObject({
      kind: "aiqt.auditReport",
      schemaVersion: 1,
      runId: "run-preview",
      generatedAt: "2026-06-04T08:00:00+00:00",
      format: "text/markdown",
      fileName: "run-preview-audit-evidence-report.md",
      contentSha256: { algorithm: "sha256" }
    });
    expect(auditReport.contentSha256.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(auditReport.contentMarkdown).toContain("# AIQuant Audit Evidence Report");
    expect(auditReport.evidenceSummary.copyText).toContain("AIQT Audit Evidence Summary");
    expect(enrichedArtifactPackage.auditEvidenceSummary?.runId).toBe("run-preview");
    expect(enrichedArtifactPackage.auditReport?.contentSha256.hash).toBe(auditReport.contentSha256.hash);
    expect(enrichedArtifactPackage.backtestReport).toMatchObject({
      kind: "aiqt.backtestReport",
      schemaVersion: 1,
      runId: "run-preview",
      generatedAt: "2026-06-04T08:00:00+00:00",
      format: "text/markdown",
      fileName: "run-preview-backtest-report.md",
      contentSha256: { algorithm: "sha256" },
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyRevision: "rev-preview",
      executionMode: "paper_only",
      dataRows: 1,
      boundary: "historical audited evidence only; no investment advice"
    });
    expect(enrichedArtifactPackage.backtestReport?.contentSha256.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(enrichedArtifactPackage.backtestReport?.contentMarkdown).toContain("# AIQuant Audited Backtest Report");
    expect(normalizeResearchRunExportPackagePayload(enrichedArtifactPackage)?.auditReport?.fileName).toBe(
      "run-preview-audit-evidence-report.md"
    );
    expect(normalizeResearchRunExportPackagePayload(enrichedArtifactPackage)?.backtestReport?.fileName).toBe(
      "run-preview-backtest-report.md"
    );
    const signedArtifactPackage = {
      ...enrichedArtifactPackage,
      auditReport: {
        ...enrichedArtifactPackage.auditReport,
        signature: {
          status: "verified",
          algorithm: "hmac-sha256",
          keyId: "local-audit-key",
          signer: "Local Audit Key",
          signedAt: "2026-06-04T08:01:00.000Z",
          verifiedAt: "2026-06-04T08:02:00.000Z",
          chainId: "audit-chain-local",
          value: "a".repeat(64)
        }
      },
      backtestReport: {
        ...enrichedArtifactPackage.backtestReport,
        signature: {
          status: "signed",
          algorithm: "hmac-sha256",
          keyId: "local-audit-key",
          signer: "Local Audit Key",
          signedAt: "2026-06-04T08:03:00.000Z",
          chainId: "audit-chain-local",
          value: "b".repeat(64)
        }
      }
    };
    expect(normalizeResearchRunExportPackagePayload(signedArtifactPackage)?.auditReport?.signature).toMatchObject({
      keyId: "local-audit-key",
      status: "verified"
    });
    expect(normalizeResearchRunExportPackagePayload(signedArtifactPackage)?.backtestReport?.signature).toMatchObject({
      keyId: "local-audit-key",
      status: "signed"
    });
    const signedAuditEvent: AuditEventRecord = {
      schemaVersion: 1,
      eventId: "audit-report-run-preview-signed",
      eventType: "audit_evidence_report",
      runId: "run-preview",
      createdAt: "2026-06-04T08:04:00.000Z",
      stage: "generated",
      source: "web",
      summary: "Audit evidence report generated for run-preview",
      detail: "signed audit report",
      metadata: {
        artifactKind: "aiqt.auditReport",
        fileName: enrichedArtifactPackage.auditReport?.fileName,
        contentSha256: enrichedArtifactPackage.auditReport?.contentSha256.hash,
        contentSha256Algorithm: "sha256",
        signature: {
          status: "verified",
          algorithm: "hmac-sha256",
          chainId: "audit-chain-local",
          keyId: "local-audit-key",
          signedAt: "2026-06-04T08:04:00.000Z",
          signer: "Local Audit Key",
          value: "c".repeat(64),
          verifiedAt: "2026-06-04T08:05:00.000Z"
        }
      }
    };
    const signedBacktestEvent: AuditEventRecord = {
      schemaVersion: 1,
      eventId: "backtest-report-run-preview-signed",
      eventType: "backtest_report",
      runId: "run-preview",
      createdAt: "2026-06-04T08:06:00.000Z",
      stage: "generated",
      source: "web",
      summary: "Backtest Markdown report generated for run-preview",
      detail: "signed backtest report",
      metadata: {
        artifactKind: "aiqt.backtestReport",
        fileName: enrichedArtifactPackage.backtestReport?.fileName,
        contentSha256: enrichedArtifactPackage.backtestReport?.contentSha256.hash,
        contentSha256Algorithm: "sha256",
        signature: {
          status: "signed",
          algorithm: "hmac-sha256",
          chainId: "audit-chain-local",
          keyId: "local-audit-key",
          signedAt: "2026-06-04T08:06:00.000Z",
          signer: "Local Audit Key",
          value: "d".repeat(64)
        }
      }
    };
    const signedExportPackage = withResearchRunExportReportSignatures(enrichedArtifactPackage, [
      {
        ...signedAuditEvent,
        eventId: "audit-report-wrong-hash",
        metadata: { ...signedAuditEvent.metadata, contentSha256: "0".repeat(64) }
      },
      signedAuditEvent,
      {
        ...signedBacktestEvent,
        eventId: "backtest-report-leaky-signature",
        metadata: {
          ...signedBacktestEvent.metadata,
          signature: { ...(signedBacktestEvent.metadata.signature as Record<string, unknown>), secret: "nope" }
        }
      },
      signedBacktestEvent
    ]);
    expect(signedExportPackage.auditReport?.signature).toMatchObject({
      eventId: "audit-report-run-preview-signed",
      keyId: "local-audit-key",
      status: "verified",
      verifiedAt: "2026-06-04T08:05:00.000Z"
    });
    expect(signedExportPackage.backtestReport?.signature).toMatchObject({
      eventId: "backtest-report-run-preview-signed",
      keyId: "local-audit-key",
      status: "signed",
      signedAt: "2026-06-04T08:06:00.000Z"
    });
    expect(
      normalizeResearchRunExportPackagePayload({
        ...signedArtifactPackage,
        auditReport: {
          ...signedArtifactPackage.auditReport,
          signature: { ...signedArtifactPackage.auditReport.signature, secret: "do-not-import" }
        }
      })
    ).toBeNull();
    expect(
      normalizeResearchRunExportPackagePayload({
        ...signedArtifactPackage,
        backtestReport: {
          ...signedArtifactPackage.backtestReport,
          signature: { ...signedArtifactPackage.backtestReport.signature, privateKey: "do-not-import" }
        }
      })
    ).toBeNull();
    expect(
      normalizeResearchRunExportPackagePayload({
        ...enrichedPackage,
        auditEvidenceSummary: { ...enrichedPackage.auditEvidenceSummary, schemaVersion: 2 }
      })
    ).toBeNull();
    expect(
      normalizeResearchRunExportPackagePayload({
        ...enrichedArtifactPackage,
        auditReport: { ...enrichedArtifactPackage.auditReport, contentSha256: { algorithm: "sha256", hash: "bad" } }
      })
    ).toBeNull();
    expect(
      normalizeResearchRunExportPackagePayload({
        ...enrichedArtifactPackage,
        backtestReport: {
          ...enrichedArtifactPackage.backtestReport,
          contentSha256: { algorithm: "sha256", hash: "bad" }
        }
      })
    ).toBeNull();

    const experiment = sampleStrategyExperimentDetail();
    const experimentRun: ResearchRunAudit = {
      runId: experiment.sourceRunId,
      createdAt: experiment.createdAt,
      market: experiment.market,
      symbol: experiment.symbol,
      timeframe: experiment.timeframe,
      strategyName: experiment.definition.baseStrategy.name,
      strategyRevision: experiment.strategyRevision,
      dataRows: experiment.snapshot.rows,
      metrics: { total_return_pct: 4.2, max_drawdown_pct: 3.1, win_rate_pct: 62.5, trade_count: 8 },
      decisions: [],
      executionMode: "paper_only",
      strategyConfig: experiment.definition.baseStrategy,
      dataSnapshot: {
        hashVersion: "aiqt-data-v2",
        source: "unit-test",
        isComplete: true,
        warnings: [],
        rows: experiment.snapshot.rows,
        start: experiment.snapshot.startAt,
        end: experiment.snapshot.endAt,
        hash: experiment.snapshot.canonicalDataHash,
        bars: experiment.snapshot.bars
      }
    };
    const experimentExportPackage = {
      ...exportPackage,
      researchRun: experimentRun
    } satisfies ResearchRunExportPackage;
    const experimentArtifactPackage = await withResearchRunExportAuditEvidenceArtifacts(
      experimentExportPackage,
      summary,
      "2026-07-10T09:00:00+00:00",
      [],
      experiment
    );
    const experimentMarkdown = experimentArtifactPackage.backtestReport?.contentMarkdown;

    [
      experiment.experimentId,
      experiment.definitionHash,
      experiment.resultHash,
      experiment.selectedCandidateId,
      experiment.holdoutStatus
    ].forEach((value) => expect(experimentMarkdown).toContain(value));
    const missingArtifactPackage = await withResearchRunExportAuditEvidenceArtifacts(
      experimentExportPackage,
      summary,
      "2026-07-10T09:00:00+00:00"
    );
    expect(missingArtifactPackage.backtestReport?.contentMarkdown).toContain(
      "Persisted strategy experiment required."
    );
    expect(missingArtifactPackage.backtestReport?.contentMarkdown).not.toContain("Candidate return");

    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), experimentRun);
    const auditEvent = await buildBacktestReportAuditEvent({
      generatedAt: "2026-07-10T09:00:00+00:00",
      markdown: buildBacktestReportMarkdown(workspace, [], experiment) ?? "",
      workspace,
      experiment
    });
    expect(auditEvent?.metadata).toMatchObject({
      strategyExperimentId: experiment.experimentId,
      strategyExperimentDefinitionHash: experiment.definitionHash,
      strategyExperimentResultHash: experiment.resultHash,
      strategyExperimentSelectedCandidateId: experiment.selectedCandidateId,
      strategyExperimentHoldoutStatus: experiment.holdoutStatus
    });
  });

  test("builds a ledger audit event when an audit evidence report is generated", async () => {
    const summary = {
      auditQuery: "manifest:run-preview",
      copyText: "AIQT Audit Evidence Summary\nRun: run-preview\nFocus: manifest:run-preview",
      deepLinkError: null,
      deepLinkStatus: "loaded" as const,
      focusQuery: "manifest:run-preview",
      importDiffAddCount: 1,
      importDiffBlockedCount: 2,
      importDiffChangeCount: 3,
      importDiffMatchedCount: 4,
      importDiffQuery: "auditReport.contentSha256.hash",
      importDiffTotalCount: 11,
      importPolicyBlockedCount: 0,
      importPolicyBlockerBuckets: [],
      importVerificationBuckets: [
        {
          count: 1,
          latestExportPath: "auditReport.contentSha256.hash",
          latestReason: "signature_verified",
          source: "local-core" as const,
          status: "verified" as const
        }
      ],
      importVerificationInvalidCount: 0,
      importVerificationVerifiedCount: 1,
      packageBlockedCount: 1,
      packageMatchedCount: 2,
      packageMissingCount: 0,
      packageQuery: "auditReport",
      packageReadyCount: 6,
      packageTotalCount: 9,
      runId: "run-preview"
    };
    const auditReport = await buildResearchRunExportAuditReport(summary, "2026-06-04T08:00:00+00:00");
    const event = buildAuditEvidenceReportAuditEvent(auditReport, summary);

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "audit_evidence_report",
      runId: "run-preview",
      createdAt: "2026-06-04T08:00:00+00:00",
      stage: "generated",
      source: "web",
      summary: "Audit evidence report generated for run-preview",
      metadata: {
        artifactKind: "aiqt.auditReport",
        fileName: "run-preview-audit-evidence-report.md",
        format: "text/markdown",
        contentSha256: auditReport.contentSha256.hash,
        contentSha256Algorithm: "sha256",
        evidenceFocus: "manifest:run-preview",
        auditQuery: "manifest:run-preview",
        packageQuery: "auditReport",
        importDiffQuery: "auditReport.contentSha256.hash",
        packageMatched: 2,
        packageTotal: 9,
        importDiffBlocked: 2,
        importDiffTotal: 11,
        importVerificationInvalid: 0,
        importVerificationLatestExportPath: "auditReport.contentSha256.hash",
        importVerificationLatestReason: "signature_verified",
        importVerificationLatestSource: "local-core",
        importVerificationLatestStatus: "verified",
        importVerificationVerified: 1,
        deepLinkStatus: "loaded",
        deepLinkError: null
      }
    });
    expect(event.eventId).toBe(`audit-report-run-preview-${auditReport.contentSha256.hash.slice(0, 16)}`);
    expect(event.detail).toContain("run-preview-audit-evidence-report.md");
    expect(event.detail).toContain(auditReport.contentSha256.hash.slice(0, 12));
  });

  test("builds a ledger audit event when a market data cooldown refresh override is recorded", () => {
    const event = buildMarketDataRefreshOverrideAuditEvent({
      actionScope: "watchlist_cache_refresh",
      createdAt: "2026-06-14T08:00:00.000Z",
      guard: {
        affectedContexts: ["ashare:600000:1d"],
        affectedSymbols: ["600000", "000300"],
        blocked: false,
        detail:
          "Provider cooldown override for ashare: operator confirmed upstream recovered; original retry after 180s; affected 600000/000300.",
        overrideApplied: true,
        overrideReason: "operator confirmed upstream recovered",
        reason: "provider_cooldown_manual_override",
        recentErrorCount: 4,
        retryAfterSeconds: 180,
        status: "cooldown"
      },
      market: "ashare",
      name: "浦发银行",
      operator: "local-operator",
      reason: "operator confirmed upstream recovered",
      symbol: "600000",
      timeframe: "1d"
    });

    expect(event).toEqual({
      schemaVersion: 1,
      eventId:
        "market-data-refresh-override-ashare-600000-1d-2026-06-14T08-00-00.000Z-operator-confirmed-upstream-reco",
      eventType: "market_data_refresh_override",
      runId: null,
      createdAt: "2026-06-14T08:00:00.000Z",
      stage: "override_recorded",
      source: "web",
      summary: "Market data refresh override recorded for ASHARE 600000 1d",
      detail:
        "watchlist_cache_refresh override by local-operator: operator confirmed upstream recovered; original retry after 180s; affected 600000/000300.",
      metadata: {
        actionScope: "watchlist_cache_refresh",
        affectedContexts: ["ashare:600000:1d"],
        affectedSymbols: ["600000", "000300"],
        artifactKind: "aiqt.marketDataRefreshOverride",
        boundary: "manual market-data refresh override only; no trading authorization or investment advice",
        liveTradingAllowed: false,
        market: "ashare",
        name: "浦发银行",
        operator: "local-operator",
        overrideApplied: true,
        overrideReason: "operator confirmed upstream recovered",
        providerHealthReason: "provider_cooldown_manual_override",
        providerHealthStatus: "cooldown",
        recentErrorCount: 4,
        retryAfterSeconds: 180,
        symbol: "600000",
        timeframe: "1d"
      }
    });
  });

  test("rejects blank market data refresh override audit reasons", () => {
    expect(() =>
      buildMarketDataRefreshOverrideAuditEvent({
        createdAt: "2026-06-14T08:00:00.000Z",
        guard: {
          affectedContexts: [],
          affectedSymbols: [],
          blocked: true,
          detail: "Provider cooldown for ashare.",
          overrideApplied: false,
          overrideReason: null,
          reason: "provider_cooldown",
          recentErrorCount: 3,
          retryAfterSeconds: 900,
          status: "cooldown"
        },
        market: "ashare",
        reason: "   ",
        symbol: "600000",
        timeframe: "1d"
      })
    ).toThrow("market_data_refresh_override_reason_required");
  });

  test("builds a ledger audit event when a P0 readiness report is generated", async () => {
    const goldenPath = {
      status: "blocked",
      summary: {
        totalSteps: 5,
        passedSteps: 2,
        reviewSteps: 1,
        blockedSteps: 2,
        currentStepLabel: "Backtest report",
        nextActionId: "run-pipeline",
        liveTradingAllowed: false
      },
      nextAction: {
        id: "run-pipeline",
        label: "Run research pipeline",
        targetWorkspace: "research",
        reason: "Refresh audited backtest evidence."
      },
      runbook: [
        {
          stepId: "market-data",
          label: "Market data",
          workspaceId: "market",
          status: "passed",
          current: false,
          passed: true,
          detail: "Fresh cache exists with provider quality.",
          blocker: null,
          actionId: null,
          actionLabel: null,
          targetWorkspace: null
        },
        {
          stepId: "backtest-report",
          label: "Backtest report",
          workspaceId: "backtest",
          status: "review",
          current: true,
          passed: false,
          detail: "Refresh audited backtest evidence.",
          blocker: "Refresh audited backtest evidence.",
          actionId: "run-pipeline",
          actionLabel: "Run research pipeline",
          targetWorkspace: "research"
        },
        {
          stepId: "ai-review",
          label: "AI review",
          workspaceId: "ai-review",
          status: "blocked",
          current: false,
          passed: false,
          detail: "AI waits for backtest.",
          blocker: "AI waits for backtest.",
          actionId: "run-ai-review",
          actionLabel: "Run AI review",
          targetWorkspace: "ai-review"
        }
      ]
    } satisfies Parameters<typeof buildP0PlatformReadinessSummary>[0];
    const summary = buildP0PlatformReadinessSummary(goldenPath);
    const backlogItems = buildP0PlatformBacklogItems(goldenPath, 3);
    const outcome = buildP0PlatformActionOutcome({
      goldenPath: {
        latestRunId: "run-p0-readiness",
        status: "review",
        summary: { liveTradingAllowed: false }
      },
      paperExecution: {
        executionId: "paper-p0-readiness",
        runId: "run-p0-readiness",
        mode: "paper",
        orders: [{ orderId: "paper-order-1" }],
        gates: [{ passed: true }, { passed: true }, { passed: false }],
        preparationEvidence: {
          runId: "cache-refresh-p0-readiness",
          upsertedRows: 240,
          quality: { source: "tencent" }
        }
      },
      statusLabel: "Golden Path audit run loaded"
    });
    const evidenceLink = buildP0PlatformActionOutcomeEvidenceLink(outcome);
    const paperPreflight = buildP0PaperExecutionPreflight({
      goldenPath: {
        currentStepId: "paper-execution",
        latestRunId: "run-p0-readiness",
        nextAction: {
          id: "submit-paper-order",
          label: "Submit paper order",
          targetWorkspace: "execution",
          reason: "Paper order is ready."
        },
        summary: { liveTradingAllowed: false }
      },
      paperExecution: null,
      researchBinding: {
        status: "matched",
        canUseRun: true,
        runId: "run-p0-readiness",
        selectedContext: "ASHARE · 600000 · 1d",
        runContext: "ASHARE · 600000 · 1d",
        detail: "Audited run run-p0-readiness matches the selected research context."
      },
      riskApproval: {
        status: "paper_ready",
        headline: "Paper execution approved",
        summary: "All paper execution risk checks are approved.",
        gates: [
          {
            id: "audited-run",
            label: "Audited run",
            value: "run-p0-readiness",
            detail: "risk gate ready",
            status: "passed",
            tone: "positive"
          },
          {
            id: "execution-route",
            label: "Human reviewed",
            value: "confirmed",
            detail: "operator confirmed",
            status: "passed",
            tone: "positive"
          }
        ]
      }
    });
    const completionChecklist = buildP0CompletionChecklist({
      automatedTestsVerified: false,
      exportImportReady: true,
      goldenPath,
      outcome,
      paperPreflight,
      productWorkAreaCount: 9,
      replayReady: true,
      strategyVersionReady: true,
      summary
    });
    const markdown = buildP0PlatformReadinessReportMarkdown({
      backlogItems,
      completionChecklist,
      evidenceLink,
      generatedAt: "2026-06-12T10:00:00.000Z",
      outcome,
      paperPreflight,
      summary
    });

    const event = await buildP0PlatformReadinessReportAuditEvent({
      backlogItems,
      completionChecklist,
      evidenceLink,
      generatedAt: "2026-06-12T10:00:00.000Z",
      markdown,
      outcome,
      paperPreflight,
      summary
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "p0_readiness_report",
      runId: "run-p0-readiness",
      createdAt: "2026-06-12T10:00:00.000Z",
      stage: "generated",
      source: "web",
      summary: "P0 readiness report generated",
      metadata: {
        artifactKind: "aiqt.p0ReadinessReport",
        fileName: "run-p0-readiness-p0-readiness-report.md",
        format: "text/markdown",
        contentSha256Algorithm: "sha256",
        state: "blocked",
        progressPct: 40,
        passedSteps: 2,
        totalSteps: 5,
        reviewSteps: 1,
        blockedSteps: 2,
        openStepCount: 3,
        currentGapStepId: "backtest-report",
        currentGapLabel: "Backtest report",
        currentGapStatus: "review",
        currentGapWorkspaceId: "backtest",
        currentGapActionId: "run-pipeline",
        currentGapActionLabel: "Run research pipeline",
        currentGapTargetWorkspaceId: "research",
        currentGapCanExecute: true,
        currentGapDeepLinkSearch:
          "workspace=research&auditReportQuery=p0_readiness_report+run-p0-readiness+run-pipeline+research&p0Action=run-pipeline",
        currentGapExecutableActionId: "run-pipeline",
        currentGapReadinessReason: "ready",
        completionBlockedCount: 0,
        completionCurrentCriterionActionLabel: "Run research pipeline",
        completionCurrentCriterionId: "golden-path",
        completionCurrentCriterionLabel: "Golden path can run through",
        completionCurrentCriterionStatus: "review",
        completionCurrentCriterionTargetWorkspaceId: "research",
        completionOpenCriterionIds: "golden-path,ai-evidence,automated-tests",
        completionPassedCount: 7,
        completionProgressPct: 70,
        completionReviewCount: 3,
        completionSummary: "7/10 passed, 3 review, 0 blocked · current golden-path review",
        completionTotalCount: 10,
        latestEvidenceState: "paper_execution",
        latestEvidenceId: "paper-p0-readiness",
        latestEvidenceLink: "workspace=execution&paperExecution=paper-p0-readiness&runId=run-p0-readiness",
        latestEvidencePreparationRunId: "cache-refresh-p0-readiness",
        backlogCount: 2,
        backlogExecutableCount: 2,
        backlogNotExecutableCount: 0,
        backlogReadinessSummary: "2/2 executable, 0 not executable · first run-pipeline ready",
        firstBacklogCanExecute: true,
        firstBacklogExecutableActionId: "run-pipeline",
        firstBacklogReadinessReason: "ready",
        firstBacklogStepId: "backtest-report",
        paperPreflightActionId: "submit-paper-order",
        paperPreflightActionLabel: "Submit paper order",
        paperPreflightGateBlockedCount: 0,
        paperPreflightGatePassedCount: 2,
        paperPreflightGateReviewCount: 2,
        paperPreflightGateTotal: 4,
        paperPreflightLiveBoundary: "paper only",
        paperPreflightState: "ready",
        liveTradingAllowed: false,
        liveBoundary: "Paper-only boundary",
        boundary: "P0 readiness audit aid only; no live trading authorization or investment advice"
      }
    });
    expect(typeof event.metadata.contentSha256).toBe("string");
    expect(String(event.metadata.contentSha256)).toHaveLength(64);
    expect(event.eventId).toBe(`p0-readiness-report-run-p0-readiness-${String(event.metadata.contentSha256).slice(0, 16)}`);
    expect(event.detail).toContain("run-p0-readiness-p0-readiness-report.md");
    expect(event.detail).toContain("2/5 steps");
    expect(event.detail).toContain("backlog 2/2 executable, 0 not executable");
    expect(event.detail).toContain("completion 7/10 passed, 3 review, 0 blocked");
    expect(event.detail).not.toContain(markdown);
  });

  test("builds a P0 acceptance review audit event without storing markdown", async () => {
    const acceptance: P0AcceptanceSummarySource = {
      kind: "aiqt.p0AcceptanceManifest",
      schemaVersion: 1,
      status: "passed",
      available: true,
      sourcePath: "data/p0-acceptance.json",
      summary: "P0 acceptance smoke passed",
      reason: "All local P0 checks passed while live trading remains blocked.",
      generatedAt: "2026-06-23T09:00:00.000Z",
      runId: "run-p0-acceptance",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      checkCount: 4,
      requiredCheckCount: 4,
      checkIds: ["docker-smoke", "research-pipeline", "paper-execution", "live-blocked-boundary"],
      paperOnly: true,
      liveTradingAllowed: false,
      liveBlockedBoundary: true,
      manifest: {
        checks: ["docker-smoke", "research-pipeline", "paper-execution", "live-blocked-boundary"]
      }
    };
    const summary = buildP0AcceptanceSummary(acceptance);
    const markdown = buildP0AcceptanceReviewMarkdown({ acceptance, summary });

    const event = await buildP0AcceptanceReviewAuditEvent({
      acceptance,
      generatedAt: "2026-06-23T09:10:00.000Z",
      markdown,
      summary
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "p0_acceptance_review",
      runId: "run-p0-acceptance",
      createdAt: "2026-06-23T09:10:00.000Z",
      stage: "passed",
      source: "web",
      summary: "P0 acceptance review recorded",
      metadata: {
        artifactKind: "aiqt.p0AcceptanceReview",
        fileName: "run-p0-acceptance-p0-acceptance-review.md",
        format: "text/markdown",
        contentSha256Algorithm: "sha256",
        state: "passed",
        sourcePath: "data/p0-acceptance.json",
        manifestGeneratedAt: "2026-06-23T09:00:00.000Z",
        manifestAvailable: true,
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        checkCount: 4,
        requiredCheckCount: 4,
        checkIds: ["docker-smoke", "research-pipeline", "paper-execution", "live-blocked-boundary"],
        paperOnly: true,
        reportedLiveTradingAllowed: false,
        liveTradingAllowed: false,
        liveBlockedBoundary: true,
        boundary: "P0 acceptance audit evidence only; live trading remains blocked and no investment advice"
      }
    });
    expect(typeof event.metadata.contentSha256).toBe("string");
    expect(String(event.metadata.contentSha256)).toHaveLength(64);
    expect(event.eventId).toBe(
      `p0-acceptance-review-run-p0-acceptance-${String(event.metadata.contentSha256).slice(0, 16)}`
    );
    expect(event.detail).toContain("run-p0-acceptance-p0-acceptance-review.md");
    expect(event.detail).toContain("4/4 checks");
    expect(event.detail).toContain("live blocked true");
    expect(event.detail).not.toContain(markdown);
  });

  test("builds a P2 readiness acceptance review audit event without storing markdown", async () => {
    const acceptance: P2ReadinessAcceptanceReviewSource = {
      kind: "aiqt.p2ReadinessAcceptanceStatus",
      schemaVersion: 1,
      status: "accepted",
      available: true,
      sourcePath: "data/p2-readiness-acceptance.json",
      summary: "P2 readiness accepted with live boundary blocked.",
      reason: "All P2 criteria passed while the execution boundary remains paper-only.",
      generatedAt: "2026-06-24T09:00:00.000Z",
      runId: "run-p2-readiness",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      adapterId: "paper-sim",
      p1AcceptanceRunId: "run-p1-acceptance",
      p2PreLiveAcceptanceRunId: "run-p2-prelive",
      p2PaperReplayRunId: "run-p2-replay",
      operatorRunbookAuditEventId: "operator-runbook-audit-1",
      readinessCoverageStatus: "accepted",
      acceptedCriterionCount: 6,
      totalCriterionCount: 6,
      blockingCriterionCount: 0,
      criterionIds: [
        "p1-acceptance",
        "paper-execution-replay",
        "pre-live-checklist",
        "p2-pre-live-manifest",
        "readiness-evidence-coverage",
        "live-blocked-boundary"
      ],
      auditEventIds: ["p1-audit", "prelive-audit", "replay-audit", "operator-audit"],
      manifestPaths: {
        p1Acceptance: "data/p1-acceptance.json",
        p2PreLiveAcceptance: "data/p2-pre-live-acceptance.json",
        p2PaperReplay: "data/p2-paper-replay.json"
      },
      checkCount: 6,
      requiredCheckCount: 6,
      checkIds: [
        "p1-acceptance",
        "paper-execution-replay",
        "pre-live-checklist",
        "p2-pre-live-manifest",
        "readiness-evidence-coverage",
        "live-blocked-boundary"
      ],
      paperOnly: true,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      manifest: null
    };
    const summary: P2ReadinessAcceptanceSummary = {
      acceptedCount: 6,
      blockingCount: 0,
      detail: "All six top-level P2 readiness criteria have evidence while live routing stays blocked.",
      evidenceCoverageReviewAuditEventId: "p2-readiness-evidence-coverage-review-cccccccccccccccc",
      headline: "P2 readiness accepted",
      liveOrderSubmitted: false,
      liveTradingAllowed: false,
      orderSubmissionEnabled: false,
      routeExecuted: false,
      rows: [
        {
          detail: "P1 acceptance manifest is available.",
          evidence: "data/p1-acceptance.json",
          id: "p1-acceptance",
          label: "P1 acceptance",
          sourceId: "run-p1-acceptance",
          status: "passed",
          tone: "positive"
        },
        {
          detail: "Paper execution replay manifest is available.",
          evidence: "data/p2-paper-replay.json",
          id: "paper-execution-replay",
          label: "Paper execution replay",
          sourceId: "run-p2-replay",
          status: "passed",
          tone: "positive"
        },
        {
          detail: "Pre-live checklist is complete.",
          evidence: "manual-route candidate",
          id: "pre-live-checklist",
          label: "Pre-live checklist",
          sourceId: "run-p2-prelive",
          status: "passed",
          tone: "positive"
        },
        {
          detail: "P2 pre-live manifest is available.",
          evidence: "data/p2-pre-live-acceptance.json",
          id: "p2-pre-live-manifest",
          label: "P2 pre-live manifest",
          sourceId: "run-p2-prelive",
          status: "passed",
          tone: "positive"
        },
        {
          detail: "Readiness evidence coverage is accepted.",
          evidence: "accepted",
          id: "readiness-evidence-coverage",
          label: "Readiness evidence coverage",
          sourceId: "operator-runbook-audit-1",
          status: "passed",
          tone: "positive"
        },
        {
          detail: "All live execution flags remain disabled.",
          evidence: "live blocked",
          id: "live-blocked-boundary",
          label: "Live-blocked boundary",
          sourceId: "forced-platform-boundary",
          status: "passed",
          tone: "positive"
        }
      ],
      status: "accepted",
      tone: "positive",
      totalCount: 6
    };
    const markdown = buildP2ReadinessAcceptanceReviewMarkdown({ acceptance, summary });

    const event = await buildP2ReadinessAcceptanceReviewAuditEvent({
      acceptance,
      generatedAt: "2026-06-24T09:10:00.000Z",
      markdown,
      summary
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "p2_readiness_acceptance_review",
      runId: "run-p2-readiness",
      createdAt: "2026-06-24T09:10:00.000Z",
      stage: "accepted",
      source: "web",
      summary: "P2 readiness acceptance review recorded",
      metadata: {
        artifactKind: "aiqt.p2ReadinessAcceptanceReview",
        fileName: "run-p2-readiness-p2-readiness-acceptance-review.md",
        format: "text/markdown",
        contentSha256Algorithm: "sha256",
        state: "accepted",
        sourcePath: "data/p2-readiness-acceptance.json",
        manifestGeneratedAt: "2026-06-24T09:00:00.000Z",
        manifestAvailable: true,
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        adapterId: "paper-sim",
        p1AcceptanceRunId: "run-p1-acceptance",
        p2PreLiveAcceptanceRunId: "run-p2-prelive",
        p2PaperReplayRunId: "run-p2-replay",
        operatorRunbookAuditEventId: "operator-runbook-audit-1",
        currentEvidenceCoverageReviewAuditEventId: "p2-readiness-evidence-coverage-review-cccccccccccccccc",
        readinessCoverageStatus: "accepted",
        acceptedCriterionCount: 6,
        totalCriterionCount: 6,
        blockingCriterionCount: 0,
        criterionIds: [
          "p1-acceptance",
          "paper-execution-replay",
          "pre-live-checklist",
          "p2-pre-live-manifest",
          "readiness-evidence-coverage",
          "live-blocked-boundary"
        ],
        auditEventIds: ["p1-audit", "prelive-audit", "replay-audit", "operator-audit"],
        manifestPaths: {
          p1Acceptance: "data/p1-acceptance.json",
          p2PreLiveAcceptance: "data/p2-pre-live-acceptance.json",
          p2PaperReplay: "data/p2-paper-replay.json"
        },
        paperOnly: true,
        reportedOrderSubmissionEnabled: false,
        reportedLiveTradingAllowed: false,
        reportedLiveOrderSubmitted: false,
        reportedRouteExecuted: false,
        reportedLiveBlockedBoundary: true,
        orderSubmissionEnabled: false,
        liveTradingAllowed: false,
        liveOrderSubmitted: false,
        routeExecuted: false,
        liveBlockedBoundary: true,
        boundary: "P2 readiness acceptance review is audit evidence only; live trading remains blocked and no investment advice"
      }
    });
    expect(typeof event.metadata.contentSha256).toBe("string");
    expect(String(event.metadata.contentSha256)).toHaveLength(64);
    expect(event.eventId).toBe(
      `p2-readiness-acceptance-review-run-p2-readiness-${String(event.metadata.contentSha256).slice(0, 16)}`
    );
    expect(event.detail).toContain("run-p2-readiness-p2-readiness-acceptance-review.md");
    expect(event.detail).toContain("6/6 criteria");
    expect(event.detail).toContain("live blocked true");
    expect(event.detail).not.toContain(markdown);
  });

  test("builds a P2 readiness evidence coverage review audit event without storing markdown", async () => {
    const coverage: P2ReadinessEvidenceCoverage = {
      status: "covered",
      tone: "positive",
      headline: "P2 readiness evidence fully covered",
      detail:
        "3/3 readiness claims have audit events or local manifests; 0 rows still block pre-live confidence. Direct order submission remains disabled.",
      coveredCount: 3,
      totalCount: 3,
      blockingCount: 0,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      rows: [
        {
          id: "paper-replay-manifest",
          label: "Paper replay manifest",
          status: "covered",
          tone: "positive",
          evidence: "8/8 checks",
          detail: "P2 paper replay manifest is present.",
          sourceType: "manifest",
          sourceId: "data/p2-paper-replay.json"
        },
        {
          id: "p2-manifest-chain-preflight-review",
          label: "P2 manifest chain preflight review",
          status: "covered",
          tone: "positive",
          evidence: "Review audited · aaaaaaaaaaaa",
          detail: "P2 manifest-chain preflight review is recorded.",
          sourceType: "audit",
          sourceId: "p2-chain-preflight-review-aaaaaaaaaaaaaaaa"
        },
        {
          id: "safety-boundary",
          label: "Safety boundary",
          status: "covered",
          tone: "positive",
          evidence: "Live blocked · direct order submission disabled",
          detail: "All P2 readiness evidence keeps live routing blocked.",
          sourceType: "safety-boundary",
          sourceId: "paper-exec"
        }
      ]
    };
    const markdown = buildP2ReadinessEvidenceCoverageReviewMarkdown({ coverage });

    const event = await buildP2ReadinessEvidenceCoverageReviewAuditEvent({
      coverage,
      generatedAt: "2026-06-24T09:25:00.000Z",
      markdown
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "p2_readiness_evidence_coverage_review",
      runId: "p2-readiness-evidence-coverage",
      createdAt: "2026-06-24T09:25:00.000Z",
      stage: "covered",
      source: "web",
      summary: "P2 readiness evidence coverage review recorded",
      metadata: {
        artifactKind: "aiqt.p2ReadinessEvidenceCoverageReview",
        fileName: "p2-readiness-evidence-coverage-review.md",
        format: "text/markdown",
        contentSha256Algorithm: "sha256",
        state: "covered",
        coverageStatus: "covered",
        coveredCount: 3,
        totalCount: 3,
        blockingCount: 0,
        rowIds: ["paper-replay-manifest", "p2-manifest-chain-preflight-review", "safety-boundary"],
        rowStatuses: ["covered", "covered", "covered"],
        sourceTypes: ["manifest", "audit", "safety-boundary"],
        sourceIds: [
          "data/p2-paper-replay.json",
          "p2-chain-preflight-review-aaaaaaaaaaaaaaaa",
          "paper-exec"
        ],
        orderSubmissionEnabled: false,
        liveTradingAllowed: false,
        liveBlockedBoundary: true,
        boundary:
          "P2 readiness evidence coverage review is audit evidence only; live trading remains blocked and no investment advice"
      }
    });
    expect(typeof event.metadata.contentSha256).toBe("string");
    expect(String(event.metadata.contentSha256)).toHaveLength(64);
    expect(event.eventId).toBe(
      `p2-readiness-evidence-coverage-review-${String(event.metadata.contentSha256).slice(0, 16)}`
    );
    expect(event.detail).toContain("p2-readiness-evidence-coverage-review.md");
    expect(event.detail).toContain("covered 3/3 claims");
    expect(event.detail).toContain("live blocked true");
    expect(event.detail).not.toContain(markdown);
  });

  test("builds a personal and team readiness review audit event without storing markdown", async () => {
    const summary: PersonalTeamUsabilityReadinessSummary = {
      state: "ready",
      tone: "positive",
      headline: "Personal and small-team beta ready",
      detail:
        "6/6 usability gates ready; personal local paper loop 100%; small-team internal beta 100%. Live trading remains blocked.",
      personalPercent: 100,
      teamPercent: 100,
      readyCount: 6,
      totalCount: 6,
      items: [
        {
          id: "p0-local-loop",
          label: "P0 local paper loop",
          status: "ready",
          detail: "Single-symbol research to paper execution is accepted for local paper-only use.",
          actionLabel: "Review accepted loop",
          targetWorkspaceId: "audit"
        },
        {
          id: "p1-research-ops",
          label: "P1 research ops",
          status: "ready",
          detail: "Watchlist research operations are accepted and still paper-only.",
          actionLabel: "Review research ops",
          targetWorkspaceId: "audit"
        },
        {
          id: "p2-prelive-chain",
          label: "P2 pre-live chain",
          status: "ready",
          detail: "P2 paper replay, manifest chain, evidence coverage, and live boundary are accepted.",
          actionLabel: "Review P2 readiness",
          targetWorkspaceId: "audit"
        },
        {
          id: "audit-traceability",
          label: "Audit traceability",
          status: "ready",
          detail: "Latest acceptance or audit-aid evidence is traceable from the Audit workspace.",
          actionLabel: "Open audit ledger",
          targetWorkspaceId: "audit"
        },
        {
          id: "team-handoff-runbook",
          label: "Team handoff runbook",
          status: "ready",
          detail: "2 local handoff notes recorded for the current audited run.",
          actionLabel: "Open handoff notes",
          targetWorkspaceId: "research"
        },
        {
          id: "backup-restore-drill",
          label: "Backup restore drill",
          status: "ready",
          detail: "Latest P0/P1 acceptance includes export, import, and imported-export restore checks.",
          actionLabel: "Review restore evidence",
          targetWorkspaceId: "audit"
        }
      ],
      openItems: [
        {
          id: "p2-prelive-chain",
          label: "P2 pre-live chain",
          status: "review",
          detail: "Run the AI committee review after the audited backtest is selected.",
          actionLabel: "Run AI review",
          targetWorkspaceId: "ai-review"
        },
        {
          id: "team-handoff-runbook",
          label: "Team handoff runbook",
          status: "review",
          detail: "Write the operator handoff, incident owner, and review cadence before small-team beta.",
          actionLabel: "Create handoff runbook",
          targetWorkspaceId: "research"
        }
      ],
      nextActionLabel: "Review accepted loop",
      nextActionWorkspaceId: "audit",
      liveBoundaryLabel: "Paper-only · live blocked · no order submission"
    };
    const markdown = buildPersonalTeamUsabilityReadinessReviewMarkdown({ summary });

    const event = await buildPersonalTeamUsabilityReadinessReviewAuditEvent({
      generatedAt: "2026-06-28T09:00:00.000Z",
      markdown,
      summary
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "personal_team_readiness_review",
      runId: "personal-team-readiness",
      createdAt: "2026-06-28T09:00:00.000Z",
      stage: "ready",
      source: "web",
      summary: "Personal and small-team readiness review recorded",
      metadata: {
        artifactKind: "aiqt.personalTeamReadinessReview",
        fileName: "personal-team-readiness-review.md",
        format: "text/markdown",
        contentSha256Algorithm: "sha256",
        state: "ready",
        personalPercent: 100,
        teamPercent: 100,
        readyCount: 6,
        totalCount: 6,
        openItemIds: ["p2-prelive-chain", "team-handoff-runbook"],
        itemIds: [
          "p0-local-loop",
          "p1-research-ops",
          "p2-prelive-chain",
          "audit-traceability",
          "team-handoff-runbook",
          "backup-restore-drill"
        ],
        itemStatuses: ["ready", "ready", "ready", "ready", "ready", "ready"],
        nextActionLabel: "Review accepted loop",
        nextActionWorkspaceId: "audit",
        orderSubmissionEnabled: false,
        liveTradingAllowed: false,
        liveOrderSubmitted: false,
        routeExecuted: false,
        liveBlockedBoundary: true,
        boundary:
          "Personal and small-team readiness review is audit evidence only; live trading remains blocked and no investment advice"
      }
    });
    expect(String(event.metadata.contentSha256)).toHaveLength(64);
    expect(event.eventId).toBe(`personal-team-readiness-review-${String(event.metadata.contentSha256).slice(0, 16)}`);
    expect(event.detail).toContain("personal-team-readiness-review.md");
    expect(event.detail).toContain("ready 6/6 gates");
    expect(event.detail).toContain("live blocked true");
    expect(event.detail).not.toContain(markdown);
  });

  test("builds a daily ops control room review audit event without storing markdown", async () => {
    const summary = {
      state: "attention",
      tone: "warning",
      headline: "Daily ops needs 2 reviews",
      detail: "2/4 ops gates ready; 2 need review; 0 blocked. Live trading remains blocked.",
      primaryActionLabel: "Run AI review",
      primaryActionWorkspaceId: "ai-review",
      auditQueryLabel: "Latest P0 audit evidence",
      auditQuery: "p0_readiness_report p0-completion-focus run-p0-smoke",
      auditQueryTitle: "P0 completion focus · current criterion ai-review",
      readyCount: 2,
      reviewCount: 2,
      blockingCount: 0,
      totalCount: 4,
      queueItems: [
        {
          id: "current-action",
          label: "Current action",
          status: "review",
          tone: "warning",
          detail: "Run the AI committee review after the audited backtest is selected.",
          actionLabel: "Run AI review",
          targetWorkspaceId: "ai-review",
          auditQuery: "p0_readiness_report p0-completion-focus run-p0-smoke"
        },
        {
          id: "audit-context",
          label: "Audit context",
          status: "ready",
          tone: "positive",
          detail: "Latest P0 audit evidence is available for read-only review.",
          actionLabel: "Open audit evidence",
          targetWorkspaceId: "audit",
          auditQuery: "p0_readiness_report p0-completion-focus run-p0-smoke"
        },
        {
          id: "team-handoff",
          label: "Team handoff runbook",
          status: "review",
          tone: "warning",
          detail: "Write the operator handoff, incident owner, and review cadence before small-team beta.",
          actionLabel: "Create handoff runbook",
          targetWorkspaceId: "research",
          auditQuery: "p0_readiness_report p0-completion-focus run-p0-smoke"
        },
        {
          id: "backup-restore",
          label: "Backup restore drill",
          status: "ready",
          tone: "positive",
          detail: "Latest P0/P1 acceptance includes export, import, and imported-export restore checks.",
          actionLabel: "Review restore evidence",
          targetWorkspaceId: "audit",
          auditQuery: "p0_readiness_report p0-completion-focus run-p0-smoke"
        }
      ],
      openItems: [
        {
          id: "current-action",
          label: "Current action",
          status: "review",
          tone: "warning",
          detail: "Run the AI committee review after the audited backtest is selected.",
          actionLabel: "Run AI review",
          targetWorkspaceId: "ai-review",
          auditQuery: "p0_readiness_report p0-completion-focus run-p0-smoke"
        },
        {
          id: "team-handoff",
          label: "Team handoff runbook",
          status: "review",
          tone: "warning",
          detail: "Write the operator handoff, incident owner, and review cadence before small-team beta.",
          actionLabel: "Create handoff runbook",
          targetWorkspaceId: "research",
          auditQuery: "p0_readiness_report p0-completion-focus run-p0-smoke"
        }
      ],
      liveBoundaryLabel: "Paper-only · live blocked · no order submission"
    } as DailyOpsControlRoomSummary & { auditQueryTitle: string };
    const markdown = buildDailyOpsControlRoomReviewMarkdown({ summary });

    const event = await buildDailyOpsControlRoomReviewAuditEvent({
      generatedAt: "2026-06-28T10:00:00.000Z",
      markdown,
      summary
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "daily_ops_control_room_review",
      runId: "daily-ops-control-room",
      createdAt: "2026-06-28T10:00:00.000Z",
      stage: "attention",
      source: "web",
      summary: "Daily ops control room review recorded",
      metadata: {
        artifactKind: "aiqt.dailyOpsControlRoomReview",
        fileName: "daily-ops-control-room-review.md",
        format: "text/markdown",
        contentSha256Algorithm: "sha256",
        state: "attention",
        readyCount: 2,
        reviewCount: 2,
        blockingCount: 0,
        totalCount: 4,
        queueItemIds: ["current-action", "audit-context", "team-handoff", "backup-restore"],
        queueItemStatuses: ["review", "ready", "review", "ready"],
        openItemIds: ["current-action", "team-handoff"],
        primaryActionLabel: "Run AI review",
        primaryActionWorkspaceId: "ai-review",
        auditQueryLabel: "Latest P0 audit evidence",
        auditQuery: "p0_readiness_report p0-completion-focus run-p0-smoke",
        auditQueryTitle: "P0 completion focus · current criterion ai-review",
        orderSubmissionEnabled: false,
        liveTradingAllowed: false,
        liveOrderSubmitted: false,
        routeExecuted: false,
        liveBlockedBoundary: true,
        boundary:
          "Daily ops control room review is audit evidence only; live trading remains blocked and no investment advice"
      }
    });
    expect(String(event.metadata.contentSha256)).toHaveLength(64);
    expect(event.eventId).toBe(`daily-ops-control-room-review-${String(event.metadata.contentSha256).slice(0, 16)}`);
    expect(event.detail).toContain("daily-ops-control-room-review.md");
    expect(event.detail).toContain("attention 2/4 gates");
    expect(event.detail).toContain("blocked 0");
    expect(event.detail).toContain("live blocked true");
    expect(event.detail).not.toContain(markdown);
  });

  test("builds a daily start brief review audit event with audit query title metadata", async () => {
    const brief = {
      state: "attention",
      tone: "warning",
      headline: "Daily start needs fresh local review",
      detail: "2/4 ops gates ready · 1/2 local reviews current · 1 open ops item. Live trading remains blocked.",
      primaryActionLabel: "Run AI review",
      primaryActionWorkspaceId: "ai-review",
      auditActionLabel: "Open audit context",
      auditQuery: "review-chain-health review-chain-gap",
      auditQueryTitle:
        "review-chain-health · health-state-gaps · query review-chain-health review-chain-gap · context rows 6 · loaded chains 2 · gaps 2",
      localReviewStatus: "stale",
      localReviewActionLabel: "Refresh local reviews",
      localReviewDetail: "Daily ops review is stale; refresh local review evidence before handoff.",
      localReviewQuery: "daily_ops_control_room_review daily-ops-stale",
      localReviewWorkspaceId: "research",
      currentReviewCount: 1,
      staleReviewCount: 1,
      missingReviewCount: 0,
      openOpsItemCount: 1,
      checkpoints: [
        {
          id: "ops-queue",
          label: "Daily ops queue",
          status: "review",
          detail: "Daily ops needs review.",
          actionLabel: "Run AI review",
          targetWorkspaceId: "ai-review",
          query: "review-chain-health review-chain-gap",
          queryTitle:
            "review-chain-health · health-state-gaps · query review-chain-health review-chain-gap · context rows 6 · loaded chains 2 · gaps 2"
        },
        {
          id: "daily-ops-review",
          label: "Daily ops review",
          status: "stale",
          detail: "Latest daily ops review is stale.",
          actionLabel: "Refresh review",
          targetWorkspaceId: "research",
          query: "daily_ops_control_room_review daily-ops-stale",
          queryTitle: ""
        }
      ],
      liveBoundaryLabel: "Paper-only · live blocked · no order submission"
    } as DailyStartBrief & {
      auditQueryTitle: string;
      checkpoints: Array<DailyStartBrief["checkpoints"][number] & { queryTitle: string }>;
    };
    const markdown = buildDailyStartBriefMarkdown({ brief });

    const event = await buildDailyStartBriefReviewAuditEvent({
      generatedAt: "2026-06-28T10:20:00.000Z",
      markdown,
      brief
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "daily_start_brief_review",
      runId: "daily-start-brief",
      createdAt: "2026-06-28T10:20:00.000Z",
      stage: "attention",
      source: "web",
      summary: "Daily start brief review recorded",
      metadata: {
        artifactKind: "aiqt.dailyStartBriefReview",
        fileName: "daily-start-brief-review.md",
        format: "text/markdown",
        contentSha256Algorithm: "sha256",
        state: "attention",
        currentReviewCount: 1,
        staleReviewCount: 1,
        missingReviewCount: 0,
        openOpsItemCount: 1,
        primaryActionLabel: "Run AI review",
        primaryActionWorkspaceId: "ai-review",
        auditActionLabel: "Open audit context",
        auditQuery: "review-chain-health review-chain-gap",
        auditQueryTitle:
          "review-chain-health · health-state-gaps · query review-chain-health review-chain-gap · context rows 6 · loaded chains 2 · gaps 2",
        localReviewStatus: "stale",
        localReviewActionLabel: "Refresh local reviews",
        localReviewQuery: "daily_ops_control_room_review daily-ops-stale",
        checkpointIds: ["ops-queue", "daily-ops-review"],
        checkpointStatuses: ["review", "stale"],
        orderSubmissionEnabled: false,
        liveTradingAllowed: false,
        liveOrderSubmitted: false,
        routeExecuted: false,
        liveBlockedBoundary: true
      }
    });
    expect(String(event.metadata.contentSha256)).toHaveLength(64);
    expect(event.eventId).toBe(`daily-start-brief-review-${String(event.metadata.contentSha256).slice(0, 16)}`);
    expect(event.detail).toContain("daily-start-brief-review.md");
    expect(event.detail).toContain("local reviews 1/2");
    expect(event.detail).toContain("open ops 1");
    expect(event.detail).toContain("live blocked true");
    expect(event.detail).not.toContain(markdown);
  });

  test("builds a Stage 1 daily-use archive audit event without storing archive markdown", async () => {
    const archiveMarkdown = [
      "# Stage 1/P0 Daily Use Archive",
      "",
      "Archive summary:",
      "- Daily state: blocked (1/2 ready)",
      "- Suggested file name: stage1-p0-daily-use-archive-blocked-1-of-2-daily-use-research-entry-research.md",
      "- Archive body SHA-256: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      "- Primary action: Open research entry -> research",
      "",
      "## Daily Handoff",
      "The full handoff body should not be stored in audit metadata."
    ].join("\n");
    const expectedContentHash = await sha256TextHexForTest(archiveMarkdown);

    const event = await buildStage1P0DailyUseArchiveReviewAuditEvent({
      archive: {
        bodySha256: {
          algorithm: "sha256",
          hash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
        },
        contentMarkdown: archiveMarkdown,
        fileName: "stage1-p0-daily-use-archive-blocked-1-of-2-daily-use-research-entry-research.md"
      },
      closure: {
        bootstrapPreflightChecks: [
          {
            id: "p2-manifest-chain",
            label: "P2 manifest chain",
            liveBlockedBoundary: true,
            liveTradingAllowed: false,
            paperOnly: true,
            recommendedCommand: "npm run docker:smoke:p2:preflight",
            sourcePath: "data/p2-chain-preflight.json",
            status: "ready",
            summary: "P2 manifest chain is ready."
          }
        ],
        bootstrapPreflightSourcePaths: {
          desktopRelease: "data/desktop-release.json",
          p0Acceptance: "data/p0-acceptance.json",
          p1Acceptance: "data/p1-acceptance.json",
          p2ManifestChainPreflight: "data/p2-chain-preflight.json",
          stage1DailyUse: "data/stage1-daily-use.json"
        },
        primaryActionId: "research-entry",
        primaryActionLabel: "Open research entry",
        primaryTargetWorkspaceId: "research",
        readyCount: 1,
        rows: [
          {
            id: "clean-open",
            label: "Clean environment",
            status: "ready",
            targetWorkspaceId: "overview"
          },
          {
            id: "research-entry",
            label: "Research entry",
            status: "blocked",
            targetWorkspaceId: "research"
          }
        ],
        state: "blocked",
        totalCount: 2
      },
      generatedAt: "2026-07-07T08:00:00.000Z",
      invalidShareStatus: {
        reason: "invalid-workspace",
        state: null,
        status: "invalid"
      },
      refreshOutcome: {
        state: "review"
      },
      shareDeepLinkState: {
        focus: "research-entry",
        kind: "daily-use",
        targetWorkspaceId: "research"
      }
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "stage1_daily_archive_review",
      runId: "stage1-p0-daily-use",
      createdAt: "2026-07-07T08:00:00.000Z",
      stage: "blocked",
      source: "web",
      summary: "Stage 1/P0 daily-use archive recorded",
      metadata: {
        archiveBodySha256: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        archiveBodySha256Algorithm: "sha256",
        artifactKind: "aiqt.stage1P0DailyUseArchiveReview",
        bootstrapPreflightCheckIds: ["p2-manifest-chain"],
        bootstrapPreflightCheckSourcePaths: ["data/p2-chain-preflight.json"],
        bootstrapPreflightCheckStatuses: ["ready"],
        bootstrapPreflightP2ManifestChainPreflightSourcePath: "data/p2-chain-preflight.json",
        contentSha256: expectedContentHash,
        contentSha256Algorithm: "sha256",
        fileName: "stage1-p0-daily-use-archive-blocked-1-of-2-daily-use-research-entry-research.md",
        format: "text/markdown",
        invalidShareReason: "invalid-workspace",
        invalidShareStatus: "invalid",
        liveBlockedBoundary: true,
        liveOrderSubmitted: false,
        liveTradingAllowed: false,
        orderSubmissionEnabled: false,
        primaryActionId: "research-entry",
        primaryActionLabel: "Open research entry",
        primaryTargetWorkspaceId: "research",
        readyCount: 1,
        refreshOutcomeState: "review",
        routeExecuted: false,
        rowIds: ["clean-open", "research-entry"],
        rowLabels: ["Clean environment", "Research entry"],
        rowStatuses: ["ready", "blocked"],
        rowTargetWorkspaceIds: ["overview", "research"],
        shareFocus: "research-entry",
        shareKind: "daily-use",
        shareTargetWorkspaceId: "research",
        state: "blocked",
        totalCount: 2
      }
    });
    expect(event.eventId).toBe(`stage1-daily-archive-review-${expectedContentHash.slice(0, 16)}`);
    expect(event.detail).toContain("stage1-p0-daily-use-archive-blocked-1-of-2-daily-use-research-entry-research.md");
    expect(event.detail).toContain(`sha256 ${expectedContentHash.slice(0, 12)}`);
    expect(event.detail).toContain("body bbbbbbbbbbbb");
    expect(event.detail).toContain("blocked 1/2 ready");
    expect(event.detail).toContain("live blocked true");
    expect(event.metadata.markdown).toBeUndefined();
    expect(JSON.stringify(event.metadata)).not.toContain(archiveMarkdown);
    expect(event.detail).not.toContain(archiveMarkdown);
  });

  test("builds a P2 manifest chain preflight review audit event without storing markdown", async () => {
    const preflight = {
      kind: "aiqt.p2ManifestChainPreflightStatus",
      schemaVersion: 1,
      status: "blocked" as const,
      available: true,
      sourcePath: "data/p2-chain-preflight.json",
      summary: "p2 manifest chain preflight status=blocked valid=3/4 next=run-p2-readiness",
      reason: "",
      ready: false,
      validStageCount: 3,
      totalStageCount: 4,
      blockerIds: ["p2-readiness-acceptance"],
      nextAction: "run-p2-readiness",
      nextCommand: "npm run docker:smoke:p2 -- --no-build",
      stages: [
        {
          id: "p1-acceptance",
          label: "P1 acceptance",
          status: "valid" as const,
          path: "data/p1-acceptance.json",
          summary: "p1 acceptance manifest run=run-p1 liveBlocked=True",
          reason: "",
          nextAction: "",
          nextCommand: ""
        },
        {
          id: "p2-paper-replay",
          label: "P2 paper replay",
          status: "valid" as const,
          path: "data/p2-paper-replay.json",
          summary: "p2 paper replay manifest run=run-p2-replay liveBlocked=True",
          reason: "",
          nextAction: "",
          nextCommand: ""
        },
        {
          id: "p2-pre-live-acceptance",
          label: "P2 pre-live acceptance",
          status: "valid" as const,
          path: "data/p2-pre-live-acceptance.json",
          summary: "p2 pre-live acceptance manifest run=run-p2-prelive liveBlocked=True",
          reason: "",
          nextAction: "",
          nextCommand: ""
        },
        {
          id: "p2-readiness-acceptance",
          label: "P2 readiness acceptance",
          status: "missing" as const,
          path: "data/p2-readiness-acceptance.json",
          summary: "",
          reason: "P2 readiness acceptance report not found at data/p2-readiness-acceptance.json",
          nextAction: "run-p2-readiness",
          nextCommand: "npm run docker:smoke:p2 -- --no-build"
        }
      ],
      paperOnly: true,
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false,
      liveBlockedBoundary: true,
      manifest: null
    };
    const summary = buildP2ManifestChainPreflightSummary(preflight);
    const markdown = buildP2ManifestChainPreflightReviewMarkdown({ preflight, summary });

    const event = await buildP2ManifestChainPreflightReviewAuditEvent({
      generatedAt: "2026-06-24T09:20:00.000Z",
      markdown,
      preflight,
      summary
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "p2_manifest_chain_preflight_review",
      runId: "p2-manifest-chain-preflight",
      createdAt: "2026-06-24T09:20:00.000Z",
      stage: "blocked",
      source: "web",
      summary: "P2 manifest chain preflight review recorded",
      metadata: {
        artifactKind: "aiqt.p2ManifestChainPreflightReview",
        fileName: "p2-manifest-chain-preflight-review.md",
        format: "text/markdown",
        contentSha256Algorithm: "sha256",
        state: "blocked",
        sourcePath: "data/p2-chain-preflight.json",
        manifestAvailable: true,
        ready: false,
        validStageCount: 3,
        totalStageCount: 4,
        blockerIds: ["p2-readiness-acceptance"],
        nextAction: "run-p2-readiness",
        nextCommand: "npm run docker:smoke:p2 -- --no-build",
        stageIds: ["p1-acceptance", "p2-paper-replay", "p2-pre-live-acceptance", "p2-readiness-acceptance"],
        stageStatuses: ["valid", "valid", "valid", "missing"],
        paperOnly: true,
        reportedOrderSubmissionEnabled: false,
        reportedLiveTradingAllowed: false,
        reportedLiveOrderSubmitted: false,
        reportedRouteExecuted: false,
        reportedLiveBlockedBoundary: true,
        orderSubmissionEnabled: false,
        liveTradingAllowed: false,
        liveOrderSubmitted: false,
        routeExecuted: false,
        liveBlockedBoundary: true,
        boundary: "P2 manifest chain preflight review is audit evidence only; live trading remains blocked and no investment advice"
      }
    });
    expect(typeof event.metadata.contentSha256).toBe("string");
    expect(String(event.metadata.contentSha256)).toHaveLength(64);
    expect(event.eventId).toBe(
      `p2-manifest-chain-preflight-review-${String(event.metadata.contentSha256).slice(0, 16)}`
    );
    expect(event.detail).toContain("p2-manifest-chain-preflight-review.md");
    expect(event.detail).toContain("blocked 3/4");
    expect(event.detail).toContain("live blocked true");
    expect(event.detail).not.toContain(markdown);
  });

  test("builds a research context readiness report audit event without storing markdown", async () => {
    const workspace = workspaceWithSavedResearchWorkspaceState(buildTerminalWorkspace(), {
      market: "ashare",
      symbol: "600000",
      name: "浦发银行",
      timeframe: "1d",
      workspaceId: "research",
      updatedAt: "2026-05-26T08:40:00+08:00"
    });
    const rows = buildResearchContextReadinessRows({
      workspace,
      barCount: 240,
      dataQuality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
      cacheContext: {
        rowCount: 240,
        freshness: "fresh",
        ageHours: 1,
        latestTimestamp: "2026-05-26T08:00:00+08:00"
      },
      watchlistRefreshRuns: [
        {
          runId: "cache-refresh-ready",
          createdAt: "2026-06-10T06:00:00+00:00",
          timeframe: "1d",
          requestedLimit: 240,
          summary: {
            totalSymbols: 1,
            refreshed: 1,
            skipped: 0,
            failed: 0,
            upsertedRows: 240
          },
          items: [
            {
              market: "ashare",
              symbol: "600000",
              name: "浦发银行",
              timeframe: "1d",
              requestedLimit: 240,
              upsertedRows: 240,
              status: "refreshed",
              quality: {
                source: "tencent",
                isComplete: true,
                warnings: [],
                rows: 240
              },
              error: null
            }
          ]
        }
      ],
      note: {
        source: "core",
        body: "观察假设：银行板块修复中，等待成交量确认。",
        savedBody: "观察假设：银行板块修复中，等待成交量确认。",
        updatedAt: "2026-05-26T08:30:00+08:00"
      }
    });
    const archive = await buildResearchContextReadinessReportArchive({
      contextLink:
        "http://127.0.0.1:5173/?workspace=research&market=ashare&symbol=600000&timeframe=1d&watchlistRefreshRun=cache-refresh-ready",
      evidenceRows: buildResearchContextEvidenceRows(workspace),
      generatedAt: "2026-06-20T08:00:00.000Z",
      preflight: buildResearchPipelinePreflight(rows),
      rows,
      workspace
    });

    const event = buildResearchContextReadinessReportAuditEvent(archive);

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "research_context_readiness_report",
      runId: "cache-refresh-ready",
      createdAt: "2026-06-20T08:00:00.000Z",
      stage: "generated",
      source: "web",
      summary: "Research context readiness report generated",
      metadata: {
        artifactKind: "aiqt.researchContextReadinessReport",
        fileName: "aiquant-research-context-ashare-600000-1d-20260620T080000Z.md",
        format: "text/markdown",
        contentSha256: archive.contentSha256.hash,
        contentSha256Algorithm: "sha256",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        preflightStatus: "ready",
        nextAction: "none",
        lockedPreparationEvidenceRunId: "cache-refresh-ready",
        readinessReadyCount: 6,
        readinessReviewCount: 0,
        readinessBlockedCount: 0,
        contextLink:
          "http://127.0.0.1:5173/?workspace=research&market=ashare&symbol=600000&timeframe=1d&watchlistRefreshRun=cache-refresh-ready",
        liveTradingAllowed: false,
        boundary: "research context readiness evidence only; no order routing, investment advice, or live trading authorization"
      }
    });
    expect(event.eventId).toBe(
      `research-context-readiness-report-ashare-600000-1d-${archive.contentSha256.hash.slice(0, 16)}`
    );
    expect(event.detail).toContain("aiquant-research-context-ashare-600000-1d-20260620T080000Z.md");
    expect(event.detail).toContain("sha256");
    expect(event.detail).toContain("ready 6/0/0");
    expect(event.detail).not.toContain(archive.contentMarkdown);
  });

  test("builds a pre-live runbook report audit event without storing markdown", async () => {
    const workspace = workspaceWithSavedResearchWorkspaceState(buildTerminalWorkspace(), {
      market: "ashare",
      symbol: "600000",
      name: "浦发银行",
      timeframe: "1d",
      workspaceId: "research",
      updatedAt: "2026-05-26T08:40:00+08:00"
    });
    const runbook = buildExecutionAdapterPreLiveRunbookSummary({ workspace });
    const markdown = buildExecutionAdapterPreLiveRunbookMarkdown(runbook, {
      generatedAt: "2026-06-21T09:00:00.000Z"
    });

    const event = await buildExecutionAdapterPreLiveRunbookAuditEvent({
      generatedAt: "2026-06-21T09:00:00.000Z",
      markdown,
      runbook,
      workspace
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "pre_live_runbook_report",
      runId: null,
      createdAt: "2026-06-21T09:00:00.000Z",
      stage: "generated",
      source: "web",
      summary: "Pre-live runbook report generated for ashare-live",
      metadata: {
        adapterId: "ashare-live",
        artifactKind: "aiqt.preLiveRunbookReport",
        boundary: "Pre-live runbook audit evidence only; no live trading authorization, order submission, or investment advice",
        completedSteps: 0,
        contentSha256Algorithm: "sha256",
        fileName: "ashare-live-600000-1d-pre-live-runbook.md",
        format: "text/markdown",
        liveTradingAllowed: false,
        market: "ashare",
        nextStepId: "adapter-state",
        status: "blocked",
        symbol: "600000",
        timeframe: "1d",
        totalSteps: 7
      }
    });
    expect(typeof event.metadata.contentSha256).toBe("string");
    expect(String(event.metadata.contentSha256)).toHaveLength(64);
    expect(event.eventId).toBe(
      `pre-live-runbook-report-ashare-live-600000-1d-${String(event.metadata.contentSha256).slice(0, 16)}`
    );
    expect(event.detail).toContain("ashare-live-600000-1d-pre-live-runbook.md");
    expect(event.detail).toContain("sha256");
    expect(event.detail).toContain("0/7 gates");
    expect(event.detail).not.toContain(markdown);
  });

  test("builds an operator runbook report audit event without storing markdown", async () => {
    const workspace = workspaceWithSavedResearchWorkspaceState(buildTerminalWorkspace(), {
      market: "ashare",
      symbol: "600000",
      name: "浦发银行",
      timeframe: "1d",
      workspaceId: "research",
      updatedAt: "2026-06-24T09:00:00.000Z"
    });
    const runbook: OperatorRunbookSummary = {
      status: "manual_review_ready",
      tone: "positive",
      headline: "Operator runbook ready for manual review",
      summary: "All operator runbook sections are aligned for manual pre-live review only; live trading remains blocked.",
      contextLabel: "ashare 600000 1d",
      adapterId: "ashare-live",
      completedSections: 5,
      totalSections: 5,
      nextActionId: null,
      nextAction: "Record or review the operator runbook before any separate live-route enablement.",
      controls: {
        killSwitch: "Disable adapter route and stop the scheduler",
        rollbackOwner: "Desk operator",
        positionLimit: "20% max position per instrument",
        dataFreshness: "tencent · 240 rows · complete",
        environmentState: "ashare-live · paper_ready · live blocked",
        auditPackage: "data/p2-pre-live-acceptance.json"
      },
      sections: [
        {
          id: "pre-live-checklist",
          label: "Pre-live checklist",
          status: "passed",
          evidence: "6/6 gates",
          detail: "Checklist complete.",
          nextAction: "Keep checklist evidence attached to the runbook.",
          tone: "positive"
        },
        {
          id: "paper-execution-replay",
          label: "Paper execution replay",
          status: "passed",
          evidence: "8/8 replay checks",
          detail: "Replay aligned.",
          nextAction: "Keep replay evidence aligned with the current run.",
          tone: "positive"
        },
        {
          id: "adapter-chain",
          label: "Adapter chain",
          status: "passed",
          evidence: "19/19 stages",
          detail: "Adapter paper-only chain complete.",
          nextAction: "Keep adapter chain evidence available for audit.",
          tone: "positive"
        },
        {
          id: "p2-acceptance",
          label: "P2 acceptance",
          status: "passed",
          evidence: "passed",
          detail: "P2 evidence recorded.",
          nextAction: "Keep acceptance manifest linked to this operator runbook.",
          tone: "positive"
        },
        {
          id: "safety-boundary",
          label: "Safety boundary",
          status: "passed",
          evidence: "live blocked",
          detail: "Order submission, live orders, route execution, and live trading remain disabled.",
          nextAction: "Do not enable live routes in P2.",
          tone: "positive"
        }
      ],
      orderSubmissionEnabled: false,
      liveTradingAllowed: false,
      liveOrderSubmitted: false,
      routeExecuted: false
    };
    const markdown = buildOperatorRunbookMarkdown(runbook);

    const event = await buildOperatorRunbookAuditEvent({
      generatedAt: "2026-06-24T09:00:00.000Z",
      markdown,
      runbook,
      workspace
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "operator_runbook_report",
      runId: null,
      createdAt: "2026-06-24T09:00:00.000Z",
      stage: "generated",
      source: "web",
      summary: "Operator runbook report generated for ashare-live",
      metadata: {
        adapterId: "ashare-live",
        artifactKind: "aiqt.operatorRunbookReport",
        auditPackage: "data/p2-pre-live-acceptance.json",
        completedSections: 5,
        contentSha256Algorithm: "sha256",
        dataFreshness: "tencent · 240 rows · complete",
        environmentState: "ashare-live · paper_ready · live blocked",
        fileName: "ashare-live-600000-1d-operator-runbook.md",
        format: "text/markdown",
        killSwitch: "Disable adapter route and stop the scheduler",
        liveOrderSubmitted: false,
        liveTradingAllowed: false,
        market: "ashare",
        nextActionId: "",
        orderSubmissionEnabled: false,
        positionLimit: "20% max position per instrument",
        rollbackOwner: "Desk operator",
        routeExecuted: false,
        sectionEvidence: [
          "pre-live-checklist:6/6 gates",
          "paper-execution-replay:8/8 replay checks",
          "adapter-chain:19/19 stages",
          "p2-acceptance:passed",
          "safety-boundary:live blocked"
        ],
        sectionIds: [
          "pre-live-checklist",
          "paper-execution-replay",
          "adapter-chain",
          "p2-acceptance",
          "safety-boundary"
        ],
        sectionStatuses: [
          "pre-live-checklist:passed",
          "paper-execution-replay:passed",
          "adapter-chain:passed",
          "p2-acceptance:passed",
          "safety-boundary:passed"
        ],
        status: "manual_review_ready",
        symbol: "600000",
        timeframe: "1d",
        totalSections: 5
      }
    });
    expect(typeof event.metadata.contentSha256).toBe("string");
    expect(String(event.metadata.contentSha256)).toHaveLength(64);
    expect(event.eventId).toBe(
      `operator-runbook-report-ashare-live-600000-1d-${String(event.metadata.contentSha256).slice(0, 16)}`
    );
    expect(event.detail).toContain("ashare-live-600000-1d-operator-runbook.md");
    expect(event.detail).toContain("sha256");
    expect(event.detail).toContain("5/5 sections");
    expect(event.detail).not.toContain(markdown);
  });

  test("builds a ledger audit event when a backtest markdown report is exported", async () => {
    const run: ResearchRunAudit = {
      runId: "run-backtest-report",
      createdAt: "2026-06-05T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA Trend / Bank Sector",
      strategyRevision: "rev-backtest-report",
      dataRows: 240,
      dataQuality: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 240
      },
      metrics: {
        total_return_pct: 5,
        max_drawdown_pct: 4,
        win_rate_pct: 52,
        trade_count: 8
      },
      decisions: [],
      executionMode: "paper_only"
    };
    const previousRun: ResearchRunAudit = {
      ...run,
      runId: "run-backtest-report-prev",
      createdAt: "2026-06-04T08:00:00+00:00",
      strategyRevision: "rev-backtest-report-prev",
      metrics: {
        total_return_pct: 2,
        max_drawdown_pct: 6,
        win_rate_pct: 48,
        trade_count: 7
      }
    };
    const workspace = workspaceFromResearchRunAudit(buildTerminalWorkspace(), run);
    const markdown = buildBacktestReportMarkdown(workspace, [run, previousRun]);

    expect(markdown).toContain("## Run Comparison Matrix");

    const event = await buildBacktestReportAuditEvent({
      generatedAt: "2026-06-05T09:00:00+00:00",
      markdown: markdown ?? "",
      runHistory: [run, previousRun],
      workspace
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "backtest_report",
      runId: "run-backtest-report",
      createdAt: "2026-06-05T09:00:00+00:00",
      stage: "generated",
      source: "web",
      summary: "Backtest Markdown report generated for run-backtest-report",
      metadata: {
        artifactKind: "aiqt.backtestReport",
        fileName: "run-backtest-report-backtest-report.md",
        format: "text/markdown",
        contentSha256Algorithm: "sha256",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyRevision: "rev-backtest-report",
        executionMode: "paper_only",
        dataRows: 240,
        runComparisonRows: 2,
        hasRunComparisonMatrix: true,
        boundary: "historical audited evidence only; no investment advice"
      }
    });
    expect(typeof event?.metadata.contentSha256).toBe("string");
    expect(event?.eventId).toBe(
      `backtest-report-run-backtest-report-${String(event?.metadata.contentSha256).slice(0, 16)}`
    );
    expect(event?.detail).toContain("run-backtest-report-backtest-report.md");
    expect(event?.detail).toContain("2 comparable runs");
    expect(event?.detail).not.toContain(markdown ?? "");
  });

  test("builds a portfolio report audit event from a combined backtest report", async () => {
    const portfolio: PortfolioBacktestRun = {
      name: "ashare 1d audited basket",
      market: "ashare",
      timeframe: "1d",
      initialCash: 100000,
      cashWeight: 0.1,
      metrics: {
        totalReturnPct: 6.2,
        annualReturnPct: 12.4,
        maxDrawdownPct: 8.1,
        winRatePct: 52,
        profitFactor: 1.2,
        tradeCount: 18
      },
      equityCurve: [
        { timestamp: "2026-05-26T08:00:00+00:00", equity: 100000 },
        { timestamp: "2026-05-27T08:00:00+00:00", equity: 106200 }
      ],
      legs: [
        {
          symbol: "600000",
          targetWeight: 0.65,
          startingValue: 65000,
          endingValue: 71500,
          contributionValue: 6500,
          contributionReturnPct: 10,
          maxDrawdownPct: 5.1,
          tradeCount: 12,
          dataQuality: {
            source: "local-cache",
            isComplete: true,
            warnings: [],
            rows: 2
          }
        },
        {
          symbol: "000300",
          targetWeight: 0.25,
          startingValue: 25000,
          endingValue: 24000,
          contributionValue: -1000,
          contributionReturnPct: -4,
          maxDrawdownPct: 7.3,
          tradeCount: 6,
          dataQuality: {
            source: "local-cache",
            isComplete: false,
            warnings: ["missing 1 bar"],
            rows: 2
          }
        }
      ],
      correlationPairs: [{ leftSymbol: "600000", rightSymbol: "000300", correlation: 0.91 }],
      covarianceRisk: {
        method: "population_covariance",
        observations: 4,
        periodVolatilityPct: 1.8,
        annualizedVolatilityPct: 28.6,
        contributions: [
          {
            symbol: "600000",
            sourceRunId: "run-current-600000",
            targetWeight: 0.65,
            annualizedVolatilityPct: 31.2,
            marginalContributionPct: 24.8,
            contributionPct: 68.4
          },
          {
            symbol: "000300",
            sourceRunId: "run-peer-000300",
            targetWeight: 0.25,
            annualizedVolatilityPct: 18.5,
            marginalContributionPct: 12.6,
            contributionPct: 31.6
          }
        ]
      },
      tradeReviewEvents: [
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "trade_review",
          symbol: "600000",
          sourceRunId: "run-current-600000",
          side: "sell",
          notionalValue: 2470,
          targetWeight: 0.65,
          endingWeight: 0.6733,
          status: "paper_review",
          reason: "paper-only rebalance intent generated from audited portfolio drift; no order is routed"
        }
      ],
      preTradeRiskChecks: [
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "pre_trade_risk_check",
          scope: "portfolio",
          symbol: null,
          sourceRunId: null,
          checkId: "portfolio_data_quality",
          status: "blocked",
          value: 0,
          limit: 1,
          reason: "portfolio composite data quality is incomplete; no paper order should be staged"
        }
      ],
      paperOrderEvents: [
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          eventType: "portfolio_paper_order",
          orderId: "portfolio-paper-run-current-600000-sell",
          symbol: "600000",
          sourceRunId: "run-current-600000",
          side: "sell",
          notionalValue: 2470,
          quantity: 2470,
          status: "rejected",
          riskStatus: "blocked",
          reason: "pre-trade risk checks blocked this portfolio paper order candidate"
        }
      ],
      dataQuality: {
        source: "portfolio-composite(600000:local-cache,000300:local-cache)",
        isComplete: false,
        warnings: ["000300: missing 1 bar"],
        rows: 2
      }
    };
    const markdown = buildPortfolioBacktestReportMarkdown(
      portfolio,
      {
        status: "ready",
        headline: "Audited basket ready",
        summary: "2 legs from audited runs",
        cashWeight: 0.1,
        request: {
          name: portfolio.name,
          initialCash: portfolio.initialCash,
          legs: [
            { runId: "run-current-600000", targetWeight: 0.65 },
            { runId: "run-peer-000300", targetWeight: 0.25 }
          ]
        },
        rows: [
          {
            runId: "run-current-600000",
            symbol: "600000",
            targetWeight: 0.65,
            weightLabel: "65.0%",
            strategyRevision: "rev-current",
            totalReturnPct: "+10.0%",
            maxDrawdownPct: "5.1%",
            current: true
          },
          {
            runId: "run-peer-000300",
            symbol: "000300",
            targetWeight: 0.25,
            weightLabel: "25.0%",
            strategyRevision: "rev-peer",
            totalReturnPct: "-4.0%",
            maxDrawdownPct: "7.3%",
            current: false
          }
        ]
      },
      { generatedAt: "2026-06-06T10:00:00+08:00" }
    );

    expect(markdown).toContain("## Diagnostics");

    const event = await buildPortfolioBacktestReportAuditEvent({
      baseRunId: "run-current-600000",
      generatedAt: "2026-06-06T10:00:00+08:00",
      markdown: markdown ?? "",
      portfolio
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "portfolio_report",
      runId: "run-current-600000",
      createdAt: "2026-06-06T10:00:00+08:00",
      stage: "generated",
      source: "web",
      summary: "Portfolio Markdown report generated for ashare 1d audited basket",
      metadata: {
        artifactKind: "aiqt.portfolioReport",
        fileName: "run-current-600000-ashare-1d-portfolio-report.md",
        format: "text/markdown",
        contentSha256Algorithm: "sha256",
        portfolioName: "ashare 1d audited basket",
        market: "ashare",
        timeframe: "1d",
        initialCash: 100000,
        cashWeight: 0.1,
        legCount: 2,
        equityRows: 2,
        tradeReviewEventCount: 1,
        preTradeRiskCheckCount: 1,
        paperOrderEventCount: 1,
        covarianceRiskContributionCount: 2,
        covarianceRiskAnnualizedVolatilityPct: 28.6,
        diagnosticsCount: 9,
        incompleteDataQuality: true,
        negativeContributionLegs: 1,
        boundary: "historical audited portfolio evidence only; no investment advice"
      }
    });
    expect(event?.metadata.contentSha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(event?.eventId).toBe(
      `portfolio-report-run-current-600000-${String(event?.metadata.contentSha256).slice(0, 16)}`
    );
    expect(event?.detail).toContain("run-current-600000-ashare-1d-portfolio-report.md");
    expect(event?.detail).toContain("2 legs");
    expect(event?.detail).toContain("9 diagnostics");
    expect(event?.detail).not.toContain(markdown ?? "");
  });

  test("does not build a portfolio report audit event without an anchored research run", async () => {
    const event = await buildPortfolioBacktestReportAuditEvent({
      baseRunId: null,
      markdown: "# Portfolio report",
      portfolio: null
    });

    expect(event).toBeNull();
  });

  test("builds a secret-free audit event when an audit signing key rotation plan is prepared", async () => {
    const event = await buildAuditSigningKeyRotationPlanAuditEvent({
      schemaVersion: 1,
      generatedAt: "2026-06-04T10:30:00+00:00",
      currentActiveKey: {
        keyId: "active-audit-key",
        signer: "Active Audit Key",
        chainId: "audit-chain-active",
        fingerprint: "a".repeat(16)
      },
      proposedActiveKey: {
        keyId: "next-audit-key",
        signer: "Next Audit Key",
        chainId: "audit-chain-next"
      },
      rotationRequired: true,
      requiresRestart: true,
      environmentUpdates: [
        { name: "AIQT_AUDIT_SIGNING_KEY_ID", value: "next-audit-key", sensitivity: "public" },
        { name: "AIQT_AUDIT_SIGNER_NAME", value: "Next Audit Key", sensitivity: "public" },
        { name: "AIQT_AUDIT_SIGNING_SECRET", value: "<set-new-key-material-outside-ui>", sensitivity: "secret" },
        {
          name: "AIQT_AUDIT_SIGNING_KEYS_JSON",
          value:
            '[{"keyId":"active-audit-key","signer":"Active Audit Key","secret":"<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>"}]',
          sensitivity: "secret"
        }
      ],
      legacyRegistryTemplate:
        '[{"keyId":"active-audit-key","signer":"Active Audit Key","secret":"<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>"}]',
      steps: [
        {
          id: "set-new-active-key",
          title: "Set new active signing key",
          detail: "Update active signing key environment variables with new locally generated key material.",
          status: "manual"
        },
        {
          id: "verify-legacy-reports",
          title: "Verify legacy reports",
          detail: "Run Audit report verification on old signed reports before removing any retired key.",
          status: "required"
        }
      ],
      blockedReasons: []
    });

    expect(event).toMatchObject({
      schemaVersion: 1,
      eventType: "audit_signing_key_rotation_plan",
      runId: "audit-signing-key-rotation",
      createdAt: "2026-06-04T10:30:00+00:00",
      stage: "prepared",
      source: "web",
      summary: "Audit signing key rotation plan prepared for next-audit-key",
      metadata: {
        currentKeyId: "active-audit-key",
        currentKeyFingerprint: "a".repeat(16),
        proposedKeyId: "next-audit-key",
        proposedSigner: "Next Audit Key",
        proposedChainId: "audit-chain-next",
        rotationRequired: true,
        requiresRestart: true,
        environmentUpdateNames: [
          "AIQT_AUDIT_SIGNING_KEY_ID",
          "AIQT_AUDIT_SIGNER_NAME",
          "AIQT_AUDIT_SIGNING_SECRET",
          "AIQT_AUDIT_SIGNING_KEYS_JSON"
        ],
        secretPlaceholderNames: ["AIQT_AUDIT_SIGNING_SECRET", "AIQT_AUDIT_SIGNING_KEYS_JSON"],
        stepIds: ["set-new-active-key", "verify-legacy-reports"],
        blockedReasons: []
      }
    });
    expect(event.eventId).toMatch(/^audit-signing-key-rotation-next-audit-key-[a-f0-9]{12}$/);
    expect(String(event.metadata.legacyRegistryTemplateSha256)).toMatch(/^[a-f0-9]{64}$/);
    expect(event.detail).toContain("legacy template sha256");
    expect(JSON.stringify(event)).not.toContain("<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>");
    expect(JSON.stringify(event)).not.toContain("<set-new-key-material-outside-ui>");
    expect(JSON.stringify(event)).not.toContain("active-audit-secret");
  });

  test("builds a secret-free audit event when an audit signing key rotation apply preflight runs", async () => {
    const event = await buildAuditSigningKeyRotationApplyAuditEvent({
      schemaVersion: 1,
      generatedAt: "2026-06-04T11:00:00+00:00",
      status: "blocked",
      applyMode: "manual_secret_store",
      auditEventType: "audit_signing_key_rotation_apply",
      currentActiveKeyId: "active-audit-key",
      currentActiveKeyFingerprint: "a".repeat(16),
      proposedActiveKeyId: "next-audit-key",
      proposedSigner: "Next Audit Key",
      proposedChainId: "audit-chain-next",
      restartRequired: true,
      requiredConfirmations: [
        { id: "new-secret-material-stored", label: "New signing secret generated and stored outside the UI", status: "missing" },
        { id: "legacy-secret-stored", label: "Current active secret copied into legacy registry outside the UI", status: "confirmed" }
      ],
      blockedReasons: ["new_secret_material_not_confirmed"],
      environmentUpdateNames: ["AIQT_AUDIT_SIGNING_KEY_ID", "AIQT_AUDIT_SIGNING_SECRET"],
      secretPlaceholderNames: ["AIQT_AUDIT_SIGNING_SECRET"]
    });

    expect(event).toEqual(
      expect.objectContaining({
        eventType: "audit_signing_key_rotation_apply",
        runId: "audit-signing-key-rotation",
        source: "web",
        stage: "blocked",
        summary: "Audit signing key rotation apply blocked for next-audit-key"
      })
    );
    expect(event.eventId).toMatch(/^audit-signing-key-rotation-apply-next-audit-key-[a-f0-9]{12}$/u);
    expect(event.metadata).toEqual(
      expect.objectContaining({
        applyMode: "manual_secret_store",
        auditEventType: "audit_signing_key_rotation_apply",
        blockedReasons: ["new_secret_material_not_confirmed"],
        confirmedConfirmationIds: ["legacy-secret-stored"],
        currentActiveKeyFingerprint: "a".repeat(16),
        currentActiveKeyId: "active-audit-key",
        environmentUpdateNames: ["AIQT_AUDIT_SIGNING_KEY_ID", "AIQT_AUDIT_SIGNING_SECRET"],
        missingConfirmationIds: ["new-secret-material-stored"],
        proposedActiveKeyId: "next-audit-key",
        proposedChainId: "audit-chain-next",
        proposedSigner: "Next Audit Key",
        restartRequired: true,
        secretPlaceholderNames: ["AIQT_AUDIT_SIGNING_SECRET"],
        status: "blocked"
      })
    );
    expect(JSON.stringify(event)).not.toContain("<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>");
    expect(JSON.stringify(event)).not.toContain("local-dev-audit-secret");
  });

  test("returns fallback when research run export integrity is malformed", async () => {
    const result = await loadResearchRunExport("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        export: {
          kind: "aiqt.researchRun.export",
          packageVersion: 1,
          exportedAt: "2026-05-26T08:05:00+00:00",
          integrity: { algorithm: "md5", hash: "abc" },
          manifest: {
            runId: "run-new",
            createdAt: "2026-05-26T08:00:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyRevision: "rev123",
            dataHash: "snapshot-detail",
            dataRows: 1,
            executionMode: "paper_only",
            paperOnly: true,
            liveTradingAllowed: false,
            artifactCounts: { bars: 1, trades: 0, equityPoints: 0, decisions: 0, aiRisks: 0 }
          },
          researchRun: {
            runId: "run-new",
            createdAt: "2026-05-26T08:00:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyName: "SMA trend demo",
            strategyRevision: "rev123",
            dataRows: 1,
            metrics: { total_return_pct: 3.4, trade_count: 0 },
            decisions: [],
            executionMode: "paper_only",
            dataSnapshot: {
              source: "tencent",
              isComplete: true,
              warnings: [],
              rows: 1,
              start: null,
              end: null,
              hash: "snapshot-detail",
              bars: [
                {
                  timestamp: "2026-05-26T08:00:00+00:00",
                  timestampMs: 1779782400000,
                  open: 9.1,
                  high: 9.3,
                  low: 9,
                  close: 9.2,
                  volume: 1200000
                }
              ]
            }
          },
          executionHandoff: {
            mode: "paper_only",
            paperOnly: true,
            liveTradingAllowed: false,
            requiredGates: []
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Invalid research run export contract");
  });

  test("returns fallback when research run export ai review records are malformed", async () => {
    const result = await loadResearchRunExport("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        export: {
          kind: "aiqt.researchRun.export",
          packageVersion: 1,
          exportedAt: "2026-05-26T08:05:00+00:00",
          manifest: {
            runId: "run-new",
            createdAt: "2026-05-26T08:00:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyRevision: "rev123",
            dataHash: "snapshot-detail",
            dataRows: 1,
            executionMode: "paper_only",
            paperOnly: true,
            liveTradingAllowed: false,
            artifactCounts: {
              bars: 1,
              trades: 0,
              equityPoints: 0,
              decisions: 0,
              aiRisks: 0,
              aiReviewRuns: 1
            }
          },
          researchRun: {
            runId: "run-new",
            createdAt: "2026-05-26T08:00:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyName: "SMA trend demo",
            strategyRevision: "rev123",
            dataRows: 1,
            metrics: { total_return_pct: 3.4, trade_count: 0 },
            decisions: [],
            executionMode: "paper_only",
            dataSnapshot: {
              source: "tencent",
              isComplete: true,
              warnings: [],
              rows: 1,
              start: null,
              end: null,
              hash: "snapshot-detail",
              bars: [
                {
                  timestamp: "2026-05-26T08:00:00+00:00",
                  timestampMs: 1779782400000,
                  open: 9.1,
                  high: 9.3,
                  low: 9,
                  close: 9.2,
                  volume: 1200000
                }
              ]
            }
          },
          executionHandoff: {
            mode: "paper_only",
            paperOnly: true,
            liveTradingAllowed: false,
            requiredGates: []
          },
          aiReviewRuns: [{ aiReviewId: "broken-ai-review" }]
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.exportPackage).toBeUndefined();
    expect(result.error).toBe("Invalid research run export contract");
  });

  test("imports one research run export package into the Python core", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await importResearchRunExport(
      "http://127.0.0.1:8765",
      {
        kind: "aiqt.researchRun.export",
        packageVersion: 1,
        exportedAt: "2026-05-26T08:05:00+00:00",
        manifest: {
          runId: "run-import",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyRevision: "rev-import",
          dataHash: "snapshot-import",
          dataRows: 2,
          executionMode: "paper_only",
          paperOnly: true,
          liveTradingAllowed: false,
          artifactCounts: { bars: 2, trades: 1, equityPoints: 1, decisions: 1, aiRisks: 1, researchNotes: 1 }
        },
        researchRun: {
          runId: "run-import",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "Imported SMA trend",
          strategyRevision: "rev-import",
          dataRows: 2,
          metrics: { total_return_pct: 4.2, trade_count: 1 },
          decisions: [{ agent: "AI Summary", message: "Imported evidence only", tone: "ai" }],
          executionMode: "paper_only",
          researchNote: {
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            body: "导入包里的研究笔记应恢复到本地笔记库。",
            updatedAt: "2026-05-26T08:03:00+00:00"
          },
          dataSnapshot: {
            source: "tencent",
            isComplete: true,
            warnings: [],
            rows: 2,
            start: "2026-05-26T08:00:00+00:00",
            end: "2026-05-27T08:00:00+00:00",
            hash: "snapshot-import",
            bars: [
              {
                timestamp: "2026-05-26T08:00:00+00:00",
                timestampMs: 1779782400000,
                open: 9.1,
                high: 9.3,
                low: 9,
                close: 9.2,
                volume: 1200000
              }
            ]
          }
        },
        executionHandoff: {
          mode: "paper_only",
          paperOnly: true,
          liveTradingAllowed: false,
          requiredGates: [{ id: "adapter-certified", label: "Adapter certified", passed: false, reason: "Blocked" }]
        }
      },
      async (url, init) => {
        calls.push({ url, init });
        if (url.includes("/api/research/notes")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              note: {
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                body: "导入包里的研究笔记应恢复到本地笔记库。",
                updatedAt: "2026-05-26T08:03:00+00:00"
              }
            })
          };
        }
        if (url.includes("/api/strategies")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              strategies: [
                {
                  strategyId: "strategy-rev-import",
                  createdAt: "2026-05-26T08:00:00+00:00",
                  name: "Imported SMA trend",
                  revision: "rev-import",
                  market: "ashare",
                  symbol: "600000",
                  timeframe: "1d",
                  version: 1,
                  status: "audited",
                  auditRunId: "run-import",
                  strategySnapshot: {
                    name: "Imported SMA trend",
                    entry: "Close > SMA20",
                    exit: "Close < SMA20",
                    position: "80% cap per instrument",
                    risk: "Stop -8%, take profit +18%, drawdown guard 20%, paper only"
                  },
                  strategyConfig: {
                    name: "Imported SMA trend",
                    revision: "rev-import",
                    market: "ashare",
                    symbols: ["600000"],
                    timeframe: "1d",
                    version: 1,
                    entryConditions: [{ kind: "close_above_sma", params: { window: 20 } }],
                    exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
                    risk: {
                      positionPct: 0.8,
                      stopLossPct: 0.08,
                      takeProfitPct: 0.18,
                      maxDrawdownPct: 0.2
                    }
                  }
                }
              ]
            })
          };
        }
        return {
          ok: true,
          status: 201,
          json: async () => ({
            undoToken: "import-undo-client-token",
            run: {
              runId: "run-import",
              createdAt: "2026-05-26T08:00:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyName: "Imported SMA trend",
              strategyRevision: "rev-import",
              dataRows: 2,
              metrics: { total_return_pct: 4.2, trade_count: 1 },
              decisions: [{ agent: "AI Summary", message: "Imported evidence only", tone: "ai" }],
              executionMode: "paper_only",
              researchNote: {
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                body: "导入包里的研究笔记应恢复到本地笔记库。",
                updatedAt: "2026-05-26T08:03:00+00:00"
              },
              dataSnapshot: {
                source: "tencent",
                isComplete: true,
                warnings: [],
                rows: 1,
                start: "2026-05-26T08:00:00+00:00",
                end: "2026-05-26T08:00:00+00:00",
                hash: "snapshot-import",
                bars: [
                  {
                    timestamp: "2026-05-26T08:00:00+00:00",
                    timestampMs: 1779782400000,
                    open: 9.1,
                    high: 9.3,
                    low: 9,
                    close: 9.2,
                    volume: 1200000
                  }
                ]
              }
            }
          })
        };
      }
    );

    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/research/runs/import");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(calls[0]?.init?.body)).kind).toBe("aiqt.researchRun.export");
    expect(calls[1]?.url).toBe("http://127.0.0.1:8765/api/research/notes?market=ashare&symbol=600000&timeframe=1d");
    expect(calls[2]?.url).toBe("http://127.0.0.1:8765/api/strategies?market=ashare&symbol=600000&limit=12");
    expect(result.source).toBe("core");
    expect(result.run?.runId).toBe("run-import");
    expect(result.undoToken).toBe("import-undo-client-token");
    expect(result.run?.dataSnapshot?.hash).toBe("snapshot-import");
    expect(result.note?.body).toBe("导入包里的研究笔记应恢复到本地笔记库。");
    expect(result.strategies?.[0]?.revision).toBe("rev-import");
    expect(result.strategies?.[0]?.status).toBe("audited");
  });

  test("undoes a successful research run import through the Python core", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await undoResearchRunImport(
      "http://127.0.0.1:8765",
      "import-undo-client-token",
      "run-import",
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          status: 200,
          json: async () => ({
            undo: {
              undoToken: "import-undo-client-token",
              runId: "run-import",
              createdAt: "2026-05-26T08:06:00+00:00",
              consumedAt: "2026-05-26T08:07:00+00:00",
              status: "undone"
            },
            run: {
              runId: "run-before-import",
              createdAt: "2026-05-25T08:00:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyName: "Previous SMA trend",
              strategyRevision: "rev-before-import",
              dataRows: 1,
              metrics: { total_return_pct: -1.0, trade_count: 1 },
              decisions: [],
              executionMode: "paper_only",
              dataSnapshot: {
                source: "tencent",
                isComplete: true,
                warnings: [],
                rows: 1,
                start: "2026-05-25T08:00:00+00:00",
                end: "2026-05-25T08:00:00+00:00",
                hash: "snapshot-before-import",
                bars: [
                  {
                    timestamp: "2026-05-25T08:00:00+00:00",
                    timestampMs: 1779696000000,
                    open: 8.9,
                    high: 9,
                    low: 8.7,
                    close: 8.8,
                    volume: 1100000
                  }
                ]
              }
            }
          })
        };
      }
    );

    expect(buildResearchRunImportUndoUrl("http://127.0.0.1:8765/")).toBe(
      "http://127.0.0.1:8765/api/research/runs/import/undo"
    );
    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/research/runs/import/undo");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({
      undoToken: "import-undo-client-token",
      expectedRunId: "run-import"
    });
    expect(result.source).toBe("core");
    expect(result.undo?.status).toBe("undone");
    expect(result.run?.runId).toBe("run-before-import");
  });

  test("surfaces detailed research run import errors from the Python core", async () => {
    const result = await importResearchRunExport(
      "http://127.0.0.1:8765",
      {
        kind: "aiqt.researchRun.export",
        packageVersion: 1,
        exportedAt: "2026-05-26T08:05:00+00:00",
        manifest: {
          runId: "run-import-broken",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyRevision: "rev-import",
          dataHash: "snapshot-import",
          dataRows: 1,
          executionMode: "paper_only",
          paperOnly: true,
          liveTradingAllowed: false,
          artifactCounts: { bars: 1, trades: 0, equityPoints: 1, decisions: 0, aiRisks: 0, researchNotes: 0 }
        },
        researchRun: {
          runId: "run-import-broken",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "Imported SMA trend",
          strategyRevision: "rev-import",
          dataRows: 1,
          metrics: { total_return_pct: 0, trade_count: 0 },
          decisions: [],
          executionMode: "paper_only"
        },
        executionHandoff: {
          mode: "paper_only",
          paperOnly: true,
          liveTradingAllowed: false,
          requiredGates: []
        }
      },
      async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          error: "invalid_research_run_export",
          detail: "integrity_hash_mismatch"
        })
      })
    );

    expect(result.source).toBe("core");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("integrity_hash_mismatch");
  });

  test("submits a paper execution for an audited research run", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await submitResearchRunPaperExecution("http://127.0.0.1:8765", "run-new", async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          execution: {
            executionId: "paper-123",
            runId: "run-new",
            createdAt: "2026-05-26T08:10:00+00:00",
            mode: "paper_only",
            account: { cash: 80680, positions: { "600000": 2100 }, equity: 100000 },
            orders: [
              {
                orderId: "order-1",
                symbol: "600000",
                side: "buy",
                quantity: 2100,
                price: 9.2,
                status: "filled",
                reason: "filled_immediately",
                timestamp: "2026-05-26T08:10:00+00:00"
              }
            ],
            gates: [
              {
                id: "audit-run-bound",
                label: "Audit run bound",
                passed: true,
                reason: "Paper execution is linked to audited run run-new."
              },
              {
                id: "paper-risk-check",
                label: "Paper risk check",
                passed: true,
                reason: "filled_immediately"
              },
              {
                id: "live-route-blocked",
                label: "Live route blocked",
                passed: false,
                reason: "Live execution is blocked; this record is paper-only."
              }
            ]
          },
          promotion: {
            candidateId: "promotion-run-new",
            runId: "run-new",
            createdAt: "2026-05-26T08:10:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyRevision: "rev123",
            latestPaperExecutionId: "paper-123",
            status: "certification_pending",
            headline: "Live promotion pending certification",
            summary: "Paper execution has passed, but live routing stays blocked until adapter certification and human confirmation pass.",
            liveTradingAllowed: false,
            evidence: { paperExecutions: 1, filledOrders: 1, passedPaperRiskChecks: 1 },
            stages: [
              {
                id: "paper-execution",
                label: "Paper execution",
                value: "1 filled order",
                detail: "Paper snapshot paper-123 passed local risk checks before live promotion.",
                status: "passed",
                tone: "positive",
                passed: true,
                reason: "Paper snapshot paper-123 passed local risk checks before live promotion."
              }
            ]
          }
        })
      };
    });

    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/research/runs/run-new/paper-executions");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(result.source).toBe("core");
    expect(result.execution?.orders[0]?.status).toBe("filled");
    expect(result.execution?.gates[2]?.passed).toBe(false);
    expect(result.promotion?.runId).toBe("run-new");
    expect(result.promotion?.status).toBe("certification_pending");
    expect(result.promotion?.stages[0]?.status).toBe("passed");
  });

  test("loads a promotion candidate for an audited research run", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunPromotion("http://127.0.0.1:8765", "run-new", async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          promotion: {
            candidateId: "promotion-run-new",
            runId: "run-new",
            createdAt: "2026-05-26T08:20:00+00:00",
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            strategyRevision: "rev123",
            latestPaperExecutionId: "paper-latest",
            status: "certification_pending",
            headline: "Live promotion pending certification",
            summary: "Paper execution has passed, but live routing stays blocked until adapter certification and human confirmation pass.",
            liveTradingAllowed: false,
            evidence: { paperExecutions: 1, filledOrders: 1, passedPaperRiskChecks: 1 },
            stages: [
              {
                id: "paper-execution",
                label: "Paper execution",
                value: "1 filled order",
                detail: "Paper snapshot paper-latest passed local risk checks before live promotion.",
                status: "passed",
                tone: "positive",
                passed: true,
                reason: "Paper snapshot paper-latest passed local risk checks before live promotion."
              }
            ]
          }
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs/run-new/promotion"]);
    expect(result.source).toBe("core");
    expect(result.promotion?.latestPaperExecutionId).toBe("paper-latest");
    expect(result.promotion?.evidence.filledOrders).toBe(1);
  });

  test("saves an AI review run record for an audited research run", async () => {
    const record: AiReviewRunRecord = {
      schemaVersion: 1,
      recordType: "aiqt.aiReviewRun",
      aiReviewId: "ai-review:run-ai-save:rev-ai-save",
      runId: "run-ai-save",
      createdAt: "2026-06-02T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyRevision: "rev-ai-save",
      executionMode: "paper_only",
      status: "ready",
      summary: {
        citationCount: 2,
        roundCount: 1,
        decisionCount: 1,
        parameterScanBound: true,
        liveExecutionBlocked: true
      },
      dossier: {
        status: "ready",
        headline: "AI review bound to run-ai-save",
        summary: "Agents explain supplied evidence only.",
        citations: [
          {
            id: "run",
            label: "Run id",
            value: "run-ai-save",
            detail: "500 1d bars",
            tone: "positive"
          },
          {
            id: "parameter-scan",
            label: "Parameter scan",
            value: "Current rank 2 of 9",
            detail: "Candidate requires fresh audited run.",
            tone: "neutral"
          }
        ]
      },
      citations: [
        {
          id: "run",
          label: "Run id",
          value: "run-ai-save",
          detail: "500 1d bars",
          tone: "positive"
        }
      ],
      rounds: [
        {
          id: "technical-analysis",
          phase: "analysis",
          agent: "Technical Analyst",
          thesis: "Trend improving",
          evidence: "Close above SMA20",
          verdict: "support",
          confidence: 64,
          tone: "positive"
        }
      ],
      decisionLog: [
        {
          agent: "AI Boundary",
          message: "No buy/sell instructions.",
          tone: "ai"
        }
      ],
      evidenceAnchors: [
        {
          id: "run:run-ai-save",
          type: "research-run",
          label: "Research run",
          reference: "run-ai-save",
          exportPath: "researchRun.runId"
        }
      ],
      boundary: "Evidence explanation only; no buy/sell instructions or guaranteed returns."
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];

    const result = await saveAiReviewRunRecord("http://127.0.0.1:8765", record, async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          aiReview: {
            aiReviewId: record.aiReviewId,
            runId: record.runId,
            createdAt: record.createdAt,
            record
          }
        })
      };
    });

    expect(buildResearchRunAiReviewsUrl("http://127.0.0.1:8765/", "run 你好/1")).toBe(
      "http://127.0.0.1:8765/api/research/runs/run%20%E4%BD%A0%E5%A5%BD%2F1/ai-reviews"
    );
    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/research/runs/run-ai-save/ai-reviews");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual(record);
    expect(result.source).toBe("core");
    expect(result.aiReview?.record.summary.parameterScanBound).toBe(true);
  });

  test("loads AI review run records for replay and audit history", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunAiReviews("http://127.0.0.1:8765", "run-ai-save", async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          aiReviews: [
            {
              aiReviewId: "ai-review:run-ai-save:rev-ai-save",
              runId: "run-ai-save",
              createdAt: "2026-06-02T08:00:00+00:00",
              record: {
                schemaVersion: 1,
                recordType: "aiqt.aiReviewRun",
                aiReviewId: "ai-review:run-ai-save:rev-ai-save",
                runId: "run-ai-save",
                createdAt: "2026-06-02T08:00:00+00:00",
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                strategyRevision: "rev-ai-save",
                executionMode: "paper_only",
                status: "ready",
                summary: {
                  citationCount: 1,
                  roundCount: 1,
                  decisionCount: 1,
                  parameterScanBound: false,
                  liveExecutionBlocked: true
                },
                dossier: {
                  status: "ready",
                  headline: "AI review bound to run-ai-save",
                  summary: "Evidence only.",
                  citations: []
                },
                citations: [],
                rounds: [],
                decisionLog: [],
                boundary: "Evidence explanation only; no buy/sell instructions or guaranteed returns."
              }
            }
          ]
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs/run-ai-save/ai-reviews"]);
    expect(result.source).toBe("core");
    expect(result.aiReviews).toHaveLength(1);
    expect(result.aiReviews[0]?.record.boundary).toContain("Evidence explanation only");
  });

  test("loads paged AI review run records with backend search metadata", async () => {
    const calls: string[] = [];
    const result = await loadResearchRunAiReviews(
      "http://127.0.0.1:8765",
      "run-ai-save",
      { query: "risk drift", limit: 5, offset: 10 },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            aiReviews: [],
            pagination: {
              limit: 5,
              offset: 10,
              total: 24,
              query: "risk drift"
            }
          })
        };
      }
    );

    expect(buildResearchRunAiReviewsUrl("http://127.0.0.1:8765", "run-ai-save", { query: "risk drift", limit: 5, offset: 10 })).toBe(
      "http://127.0.0.1:8765/api/research/runs/run-ai-save/ai-reviews?query=risk+drift&limit=5&offset=10"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/research/runs/run-ai-save/ai-reviews?query=risk+drift&limit=5&offset=10"
    ]);
    expect(result.source).toBe("core");
    expect(result.pagination).toEqual({ limit: 5, offset: 10, total: 24, query: "risk drift" });
  });

  test("saves import audit events through the Python core", async () => {
    const event: AuditEventRecord = {
      schemaVersion: 1,
      eventId: "audit-import-run-ledger-confirmed",
      eventType: "research_run_import",
      runId: "run-ledger",
      createdAt: "2026-06-03T09:12:00+00:00",
      stage: "confirmed",
      source: "web",
      summary: "Import applied",
      detail: "Research run import wrote to the local audit store. 0 blocked · 2 changes.",
      metadata: {
        fileName: "safe-import.json",
        blockedCount: 0,
        changeCount: 2,
        exportPath: "manifest:run-ledger",
        tone: "positive"
      }
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];

    const result = await saveAuditEvent("http://127.0.0.1:8765", event, async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 201,
        json: async () => ({ event })
      };
    });

    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/audit/events");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual(event);
    expect(result.source).toBe("core");
    expect(result.event?.metadata.fileName).toBe("safe-import.json");
  });

  test("loads paged import audit events with backend search metadata", async () => {
    const event: AuditEventRecord = {
      schemaVersion: 1,
      eventId: "audit-import-run-ledger-blocked",
      eventType: "research_run_import",
      runId: "run-ledger",
      createdAt: "2026-06-03T09:10:00+00:00",
      stage: "blocked",
      source: "web",
      summary: "Import preview blocked",
      detail: "Import preview found blocked preflight gates. 1 blocked · 2 changes.",
      metadata: {
        fileName: "unsafe-import.json",
        blockedCount: 1,
        changeCount: 2,
        exportPath: "manifest:run-ledger",
        tone: "risk"
      }
    };
    const calls: string[] = [];

    const result = await loadAuditEvents(
      "http://127.0.0.1:8765",
      { eventType: "research_run_import", runId: "run-ledger", query: "unsafe-import", limit: 5, offset: 10 },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            events: [event],
            pagination: {
              limit: 5,
              offset: 10,
              total: 1,
              query: "unsafe-import"
            }
          })
        };
      }
    );

    expect(
      buildAuditEventsUrl("http://127.0.0.1:8765", {
        eventType: "research_run_import",
        runId: "run-ledger",
        query: "unsafe-import",
        limit: 5,
        offset: 10
      })
    ).toBe(
      "http://127.0.0.1:8765/api/audit/events?eventType=research_run_import&runId=run-ledger&query=unsafe-import&limit=5&offset=10"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/audit/events?eventType=research_run_import&runId=run-ledger&query=unsafe-import&limit=5&offset=10"
    ]);
    expect(result.source).toBe("core");
    expect(result.events[0]?.stage).toBe("blocked");
    expect(result.pagination).toEqual({ limit: 5, offset: 10, total: 1, query: "unsafe-import" });
  });

  test("signs verifies and revokes audit report events through the local core", async () => {
    const signedEvent: AuditEventRecord = {
      schemaVersion: 1,
      eventId: "audit-report-run-signed",
      eventType: "audit_evidence_report",
      runId: "run-signed",
      createdAt: "2026-06-04T09:20:00+00:00",
      stage: "generated",
      source: "web",
      summary: "Audit evidence report generated for run-signed",
      detail: "signed report",
      metadata: {
        contentSha256: "f".repeat(64),
        fileName: "run-signed-audit-evidence-report.md",
        signature: {
          algorithm: "hmac-sha256",
          chainId: "audit-chain-local",
          keyId: "local-audit-key",
          signer: "Local Audit Key",
          status: "verified",
          value: "a".repeat(64)
        }
      }
    };
    const signedSignature = signedEvent.metadata.signature as Record<string, unknown>;
    const revokedEvent: AuditEventRecord = {
      ...signedEvent,
      metadata: {
        ...signedEvent.metadata,
        signature: {
          ...signedSignature,
          revokedAt: "2026-06-04T09:25:00+00:00",
          revokedReason: "superseded by corrected evidence package",
          status: "revoked"
        }
      }
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];

    const signResult = await signAuditReportEvent("http://127.0.0.1:8765", "audit-report-run-signed", async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          event: signedEvent,
          signature: signedEvent.metadata.signature,
          verification: { status: "verified", reason: "signature_verified" }
        })
      };
    });
    const verifyResult = await verifyAuditReportEvent("http://127.0.0.1:8765", "audit-report-run-signed", async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          event: signedEvent,
          signature: signedEvent.metadata.signature,
          verification: { status: "verified", reason: "signature_verified" }
        })
      };
    });
    const revokeResult = await revokeAuditReportEvent(
      "http://127.0.0.1:8765",
      "audit-report-run-signed",
      "superseded by corrected evidence package",
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          status: 200,
          json: async () => ({
            event: revokedEvent,
            signature: revokedEvent.metadata.signature,
            verification: { status: "invalid", reason: "signature_revoked" }
          })
        };
      }
    );

    expect(buildAuditReportSignUrl("http://127.0.0.1:8765")).toBe("http://127.0.0.1:8765/api/audit/reports/sign");
    expect(buildAuditReportVerifyUrl("http://127.0.0.1:8765")).toBe("http://127.0.0.1:8765/api/audit/reports/verify");
    expect(buildAuditReportRevokeUrl("http://127.0.0.1:8765")).toBe("http://127.0.0.1:8765/api/audit/reports/revoke");
    expect(calls.map((call) => call.url)).toEqual([
      "http://127.0.0.1:8765/api/audit/reports/sign",
      "http://127.0.0.1:8765/api/audit/reports/verify",
      "http://127.0.0.1:8765/api/audit/reports/revoke"
    ]);
    expect(calls[0]?.init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({ eventId: "audit-report-run-signed" });
    expect(JSON.parse(String(calls[2]?.init?.body))).toEqual({
      eventId: "audit-report-run-signed",
      reason: "superseded by corrected evidence package"
    });
    expect(signResult.source).toBe("core");
    expect(signResult.event?.metadata.signature).toEqual(signedEvent.metadata.signature);
    expect(signResult.verification).toEqual({ status: "verified", reason: "signature_verified" });
    expect(verifyResult.source).toBe("core");
    expect(verifyResult.signature?.keyId).toBe("local-audit-key");
    expect(revokeResult.source).toBe("core");
    expect(revokeResult.signature?.status).toBe("revoked");
    expect(revokeResult.verification).toEqual({ status: "invalid", reason: "signature_revoked" });
  });

  test("verifies external package report signatures through the local core", async () => {
    const report: NonNullable<ResearchRunExportPackage["backtestReport"]> = {
      kind: "aiqt.backtestReport",
      schemaVersion: 1,
      runId: "run-package-verify",
      generatedAt: "2026-06-05T10:00:00+00:00",
      format: "text/markdown",
      fileName: "run-package-verify-backtest-report.md",
      contentSha256: { algorithm: "sha256", hash: "a".repeat(64) },
      contentMarkdown: "# Backtest report",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyRevision: "rev-package-verify",
      executionMode: "paper_only",
      dataRows: 240,
      runComparisonRows: 3,
      signature: {
        eventId: "backtest-report-package-verify",
        status: "signed",
        algorithm: "hmac-sha256",
        chainId: "audit-chain-local",
        keyId: "local-audit-key",
        signedAt: "2026-06-05T10:00:00+00:00",
        signer: "Local Audit Key",
        value: "a".repeat(64)
      },
      boundary: "historical audited evidence only; no investment advice"
    };
    const verifiedEvent: AuditEventRecord = {
      schemaVersion: 1,
      eventId: "backtest-report-package-verify",
      eventType: "backtest_report",
      runId: "run-package-verify",
      createdAt: "2026-06-05T10:00:00+00:00",
      stage: "generated",
      source: "package",
      summary: "Backtest package report signature verified",
      detail: "run-package-verify-backtest-report.md · sha256 aaaaaaaa",
      metadata: {
        artifactKind: "aiqt.backtestReport",
        contentSha256: "a".repeat(64),
        contentSha256Algorithm: "sha256",
        fileName: "run-package-verify-backtest-report.md",
        signature: { ...report.signature, status: "verified", verifiedAt: "2026-06-05T10:01:00+00:00" }
      }
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];

    const result = await verifyResearchRunExportReportSignature("http://127.0.0.1:8765", report, async (url, init) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          event: verifiedEvent,
          signature: verifiedEvent.metadata.signature,
          verification: { status: "verified", reason: "signature_verified" }
        })
      };
    });

    expect(buildAuditReportVerifyPackageUrl("http://127.0.0.1:8765")).toBe(
      "http://127.0.0.1:8765/api/audit/reports/verify-package"
    );
    expect(calls.map((call) => call.url)).toEqual(["http://127.0.0.1:8765/api/audit/reports/verify-package"]);
    expect(calls[0]?.init?.method).toBe("POST");
    expect(JSON.parse(String(calls[0]?.init?.body))).toEqual({ report });
    expect(result.source).toBe("core");
    expect(result.event?.eventType).toBe("backtest_report");
    expect(result.signature?.status).toBe("verified");
    expect(result.verification).toEqual({ status: "verified", reason: "signature_verified" });

    const exportPackage = {
      kind: "aiqt.researchRun.export" as const,
      packageVersion: 1,
      exportedAt: "2026-06-05T10:00:00+00:00",
      manifest: {
        runId: "run-package-verify",
        createdAt: "2026-06-05T10:00:00+00:00",
        market: "ashare" as const,
        symbol: "600000",
        timeframe: "1d" as const,
        strategyRevision: "rev-package-verify",
        dataHash: "hash-package-verify",
        dataRows: 240,
        executionMode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        artifactCounts: { bars: 240, trades: 12, equityPoints: 240, decisions: 1, aiRisks: 0 }
      },
      researchRun: {
        runId: "run-package-verify",
        createdAt: "2026-06-05T10:00:00+00:00",
        market: "ashare" as const,
        symbol: "600000",
        timeframe: "1d" as const,
        strategyName: "Package verify",
        strategyRevision: "rev-package-verify",
        dataRows: 240,
        metrics: {},
        decisions: [],
        executionMode: "paper_only",
        dataSnapshot: {
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 240,
          start: "2026-06-05T10:00:00+00:00",
          end: "2026-06-05T10:00:00+00:00",
          hash: "hash-package-verify",
          bars: []
        }
      },
      executionHandoff: {
        mode: "paper_only",
        paperOnly: true,
        liveTradingAllowed: false,
        requiredGates: []
      },
      backtestReport: report
    };

    const verifiedPackage = await withVerifiedResearchRunExportPackageReportSignatures(
      "http://127.0.0.1:8765",
      exportPackage,
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          event: verifiedEvent,
          signature: verifiedEvent.metadata.signature,
          verification: { status: "verified", reason: "signature_verified" }
        })
      })
    );

    expect(verifiedPackage.backtestReport?.signature).toMatchObject({
      importVerificationReason: "signature_verified",
      importVerificationSource: "local-core",
      importVerificationStatus: "verified",
      importVerifiedAt: "2026-06-05T10:01:00+00:00",
      status: "verified"
    });
  });

  test("returns fallback when AI review run history payload is malformed", async () => {
    const result = await loadResearchRunAiReviews("http://127.0.0.1:8765", "run-ai-save", async () => ({
      ok: true,
      status: 200,
      json: async () => ({ aiReviews: [{ runId: "run-ai-save" }] })
    }));

    expect(result.source).toBe("fallback");
    expect(result.aiReviews).toEqual([]);
    expect(result.error).toBe("Invalid AI review run history contract");
  });

  test("returns fallback when AI review evidence anchors are malformed", async () => {
    const result = await loadResearchRunAiReviews("http://127.0.0.1:8765", "run-ai-save", async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        aiReviews: [
          {
            aiReviewId: "ai-review:run-ai-save:rev-ai-save",
            runId: "run-ai-save",
            createdAt: "2026-06-02T08:00:00+00:00",
            record: {
              schemaVersion: 1,
              recordType: "aiqt.aiReviewRun",
              aiReviewId: "ai-review:run-ai-save:rev-ai-save",
              runId: "run-ai-save",
              createdAt: "2026-06-02T08:00:00+00:00",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              strategyRevision: "rev-ai-save",
              executionMode: "paper_only",
              status: "ready",
              summary: {
                citationCount: 1,
                roundCount: 1,
                decisionCount: 1,
                parameterScanBound: false,
                liveExecutionBlocked: true
              },
              dossier: {
                status: "ready",
                headline: "AI review bound to run-ai-save",
                summary: "Evidence only.",
                citations: []
              },
              citations: [],
              rounds: [],
              decisionLog: [],
              evidenceAnchors: [{ id: "run:run-ai-save", type: "unknown", label: "Bad", reference: "run-ai-save" }],
              boundary: "Evidence explanation only; no buy/sell instructions or guaranteed returns."
            }
          }
        ]
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.aiReviews).toEqual([]);
    expect(result.error).toBe("Invalid AI review run history contract");
  });

  test("loads and saves a research note for the selected context", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: init?.method === "POST" ? 201 : 200,
        json: async () => ({
          note: {
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            body: "关注银行板块相对强度。",
            updatedAt: "2026-05-29T08:00:00+00:00"
          }
        })
      };
    };

    const loaded = await loadResearchNote(
      "http://127.0.0.1:8765/",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      fetcher
    );
    const saved = await saveResearchNote(
      "http://127.0.0.1:8765/",
      {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        body: "关注银行板块相对强度。"
      },
      fetcher
    );

    expect(loaded.note?.body).toBe("关注银行板块相对强度。");
    expect(saved.note?.updatedAt).toBe("2026-05-29T08:00:00+00:00");
    expect(calls[0].url).toBe("http://127.0.0.1:8765/api/research/notes?market=ashare&symbol=600000&timeframe=1d");
    expect(calls[1]).toMatchObject({
      url: "http://127.0.0.1:8765/api/research/notes",
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }
    });
    expect(JSON.parse(String(calls[1].init?.body))).toMatchObject({
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      body: "关注银行板块相对强度。"
    });
  });

  test("saves the current strategy snapshot to the strategy library", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const result = await saveStrategySnapshot(
      "http://127.0.0.1:8765",
      {
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        auditRunId: "run-strategy-api",
        strategy: {
          name: "API saved SMA plan",
          entry: "Close > SMA8",
          exit: "Close < SMA21",
          position: "40% cap per instrument",
          risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
        }
      },
      async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          status: 201,
          json: async () => ({
            strategy: {
              strategyId: "strategy-rev123",
              createdAt: "2026-05-29T08:00:00+00:00",
              name: "API saved SMA plan",
              revision: "rev123",
              market: "ashare",
              symbol: "600000",
              timeframe: "1d",
              version: 1,
              status: "audited",
              auditRunId: "run-strategy-api",
              strategySnapshot: {
                name: "API saved SMA plan",
                entry: "Close > SMA8",
                exit: "Close < SMA21",
                position: "40% cap per instrument",
                risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
              },
              strategyConfig: {
                name: "API saved SMA plan",
                revision: "rev123",
                market: "ashare",
                symbols: ["600000"],
                timeframe: "1d",
                version: 1,
                entryConditions: [{ kind: "close_above_sma", params: { window: 8 } }],
                exitConditions: [{ kind: "close_below_sma", params: { window: 21 } }],
                risk: {
                  positionPct: 0.4,
                  stopLossPct: 0.06,
                  takeProfitPct: 0.12,
                  maxDrawdownPct: 0.09
                }
              }
            }
          })
        };
      }
    );

    expect(calls[0]?.url).toBe("http://127.0.0.1:8765/api/strategies");
    expect(calls[0]?.init?.method).toBe("POST");
    expect(calls[0]?.init?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(calls[0]?.init?.body)).strategy.entry).toBe("Close > SMA8");
    expect(result.source).toBe("core");
    expect(result.strategy?.revision).toBe("rev123");
    expect(result.strategy?.status).toBe("audited");
    expect(result.strategy?.strategyConfig.risk.positionPct).toBe(0.4);
  });

  test("loads strategy library versions for the selected instrument", async () => {
    const calls: string[] = [];
    const result = await loadStrategyLibrary(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", limit: 5 },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            strategies: [
              {
                strategyId: "strategy-rev123",
                createdAt: "2026-05-29T08:00:00+00:00",
                name: "Saved SMA plan",
                revision: "rev123",
                market: "ashare",
                symbol: "600000",
                timeframe: "1d",
                version: 1,
                status: "draft",
                auditRunId: null,
                strategySnapshot: {
                  name: "Saved SMA plan",
                  entry: "Close > SMA8",
                  exit: "Close < SMA21",
                  position: "40% cap per instrument",
                  risk: "Stop -6%, take profit +12%, drawdown guard 9%, paper only"
                },
                strategyConfig: {
                  name: "Saved SMA plan",
                  revision: "rev123",
                  market: "ashare",
                  symbols: ["600000"],
                  timeframe: "1d",
                  version: 1,
                  entryConditions: [{ kind: "close_above_sma", params: { window: 8 } }],
                  exitConditions: [{ kind: "close_below_sma", params: { window: 21 } }],
                  risk: {
                    positionPct: 0.4,
                    stopLossPct: 0.06,
                    takeProfitPct: 0.12,
                    maxDrawdownPct: 0.09
                  }
                }
              }
            ]
          })
        };
      }
    );

    expect(calls).toEqual(["http://127.0.0.1:8765/api/strategies?market=ashare&symbol=600000&limit=5"]);
    expect(result.source).toBe("core");
    expect(result.strategies).toHaveLength(1);
    expect(result.strategies[0]?.strategySnapshot.entry).toBe("Close > SMA8");
  });

  test("loads the latest paper execution for an audited research run", async () => {
    const calls: string[] = [];
    const result = await loadLatestResearchRunPaperExecution("http://127.0.0.1:8765", "run-new", async (url) => {
      calls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          executions: [
            {
              executionId: "paper-latest",
              runId: "run-new",
              createdAt: "2026-05-26T08:20:00+00:00",
              mode: "paper_only",
              account: { cash: 80680, positions: { "600000": 2100 }, equity: 100000 },
              orders: [
                {
                  orderId: "order-latest",
                  symbol: "600000",
                  side: "buy",
                  quantity: 2100,
                  price: 9.2,
                  status: "filled",
                  reason: "filled_immediately",
                  timestamp: "2026-05-26T08:20:00+00:00"
                }
              ],
              gates: [],
              preparationEvidence: {
                kind: "watchlist_cache_refresh",
                runId: "cache-refresh-paper-latest",
                createdAt: "2026-05-26T08:10:00+00:00",
                market: "ashare",
                symbol: "600000",
                name: "浦发银行",
                timeframe: "1d",
                status: "refreshed",
                requestedLimit: 500,
                upsertedRows: 240,
                quality: { source: "tencent", isComplete: true, warnings: [], rows: 240 },
                error: null
              }
            },
            {
              executionId: "paper-older",
              runId: "run-new",
              createdAt: "2026-05-26T08:10:00+00:00",
              mode: "paper_only",
              account: { cash: 90000, positions: {}, equity: 90000 },
              orders: [],
              gates: []
            }
          ]
        })
      };
    });

    expect(calls).toEqual(["http://127.0.0.1:8765/api/research/runs/run-new/paper-executions"]);
    expect(result.source).toBe("core");
    expect(result.execution?.executionId).toBe("paper-latest");
    expect(result.execution?.orders[0]?.orderId).toBe("order-latest");
    expect(result.execution?.preparationEvidence?.runId).toBe("cache-refresh-paper-latest");
  });

  test("returns core without execution when a run has no paper execution history", async () => {
    const result = await loadLatestResearchRunPaperExecution("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      status: 200,
      json: async () => ({ executions: [] })
    }));

    expect(result.source).toBe("core");
    expect(result.execution).toBeUndefined();
  });

  test("returns fallback when paper execution payload is malformed", async () => {
    const result = await submitResearchRunPaperExecution("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      status: 201,
      json: async () => ({ execution: { runId: "run-new", orders: [] } })
    }));

    expect(result.source).toBe("fallback");
    expect(result.execution).toBeUndefined();
    expect(result.error).toBe("Invalid paper execution contract");
  });

  test("returns fallback when paper execution preparation evidence is malformed", async () => {
    const result = await loadLatestResearchRunPaperExecution("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        executions: [
          {
            executionId: "paper-bad-prep",
            runId: "run-new",
            createdAt: "2026-05-26T08:20:00+00:00",
            mode: "paper_only",
            account: { cash: 80680, positions: { "600000": 2100 }, equity: 100000 },
            orders: [],
            gates: [],
            preparationEvidence: {
              kind: "watchlist_cache_refresh",
              runId: "cache-refresh-bad",
              createdAt: "2026-05-26T08:10:00+00:00",
              market: "ashare",
              symbol: "600000",
              name: "浦发银行",
              timeframe: "1d",
              status: "refreshed",
              requestedLimit: 500,
              upsertedRows: 240,
              quality: "not-a-quality-object",
              error: null
            }
          }
        ]
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.execution).toBeUndefined();
    expect(result.error).toBe("Invalid paper execution history contract");
  });

  test("surfaces core paper execution gate rejections without treating them as offline fallback", async () => {
    const result = await submitResearchRunPaperExecution("http://127.0.0.1:8765", "run-risk", async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        error: "invalid_paper_execution",
        detail: "paper_execution_strategy_risk_incomplete"
      })
    }));

    expect(result.source).toBe("core");
    expect(result.execution).toBeUndefined();
    expect(result.error).toBe("paper_execution_strategy_risk_incomplete");
  });

  test("returns fallback when the research run detail payload is invalid", async () => {
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({ run: { runId: "run-new" } })
    }));

    expect(result.source).toBe("fallback");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("Invalid research run detail contract");
  });

  test("returns fallback when research run strategy config is malformed", async () => {
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        run: {
          runId: "run-new",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "SMA trend demo",
          strategyRevision: "rev123",
          dataRows: 120,
          metrics: { total_return_pct: 3.4, trade_count: 8 },
          decisions: [],
          executionMode: "paper_only",
          strategyConfig: {
            name: "SMA trend demo",
            revision: "rev123",
            market: "ashare",
            symbols: ["600000"],
            timeframe: "1d",
            version: 1,
            entryConditions: [{ kind: "close_above_sma", params: "window=20" }],
            exitConditions: [{ kind: "close_below_sma", params: { window: 20 } }],
            risk: { positionPct: 0.8 }
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("Invalid research run detail contract");
  });

  test("returns fallback when research run data quality is malformed", async () => {
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        run: {
          runId: "run-new",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "SMA trend demo",
          strategyRevision: "rev123",
          dataRows: 120,
          metrics: { total_return_pct: 3.4, trade_count: 8 },
          decisions: [],
          executionMode: "paper_only",
          dataQuality: { source: "tencent", isComplete: "yes", warnings: [], rows: 120 }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("Invalid research run detail contract");
  });

  test("returns fallback when research run AI report is malformed", async () => {
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        run: {
          runId: "run-new",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "SMA trend demo",
          strategyRevision: "rev123",
          dataRows: 120,
          metrics: { total_return_pct: 3.4, trade_count: 8 },
          decisions: [],
          executionMode: "paper_only",
          aiReport: {
            summary: "Malformed research summary",
            risks: "risk should be a list",
            improvements: [],
            disclaimer: "No investment advice"
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("Invalid research run detail contract");
  });

  test("returns fallback when research run data snapshot is malformed", async () => {
    const result = await loadResearchRunDetail("http://127.0.0.1:8765", "run-new", async () => ({
      ok: true,
      json: async () => ({
        run: {
          runId: "run-new",
          createdAt: "2026-05-26T08:00:00+00:00",
          market: "ashare",
          symbol: "600000",
          timeframe: "1d",
          strategyName: "SMA trend demo",
          strategyRevision: "rev123",
          dataRows: 120,
          metrics: { total_return_pct: 3.4, trade_count: 8 },
          decisions: [],
          executionMode: "paper_only",
          dataSnapshot: {
            source: "tencent",
            isComplete: true,
            warnings: [],
            rows: 1,
            start: "2026-05-26T08:00:00+00:00",
            end: "2026-05-26T08:00:00+00:00",
            hash: "snapshot-bad",
            bars: [{ timestamp: "2026-05-26T08:00:00+00:00", close: 9.2 }]
          }
        }
      })
    }));

    expect(result.source).toBe("fallback");
    expect(result.run).toBeUndefined();
    expect(result.error).toBe("Invalid research run detail contract");
  });

  test("builds chart klines from an audited research run data snapshot", () => {
    const klines = marketKlinesFromResearchRunAudit({
      runId: "run-snapshot",
      createdAt: "2026-05-26T08:00:00+00:00",
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      strategyName: "SMA trend demo",
      strategyRevision: "rev123",
      dataRows: 2,
      metrics: { total_return_pct: 3.4, trade_count: 8 },
      decisions: [],
      executionMode: "paper_only",
      dataSnapshot: {
        source: "tencent",
        isComplete: true,
        warnings: [],
        rows: 2,
        start: "2026-05-26T08:00:00+00:00",
        end: "2026-05-27T08:00:00+00:00",
        hash: "snapshot-chart",
        bars: [
          {
            timestamp: "2026-05-26T08:00:00+00:00",
            timestampMs: 1779782400000,
            open: 9.1,
            high: 9.3,
            low: 9,
            close: 9.2,
            volume: 1200000
          },
          {
            timestamp: "2026-05-27T08:00:00+00:00",
            timestampMs: 1779868800000,
            open: 9.2,
            high: 9.4,
            low: 9.1,
            close: 9.3,
            volume: 1300000
          }
        ]
      }
    });

    expect(klines).toEqual({
      market: "ashare",
      symbol: "600000",
      timeframe: "1d",
      source: "core",
      quality: { source: "tencent", isComplete: true, warnings: [], rows: 2 },
      bars: [
        {
          timestamp: "2026-05-26T08:00:00+00:00",
          timestampMs: 1779782400000,
          open: 9.1,
          high: 9.3,
          low: 9,
          close: 9.2,
          volume: 1200000
        },
        {
          timestamp: "2026-05-27T08:00:00+00:00",
          timestampMs: 1779868800000,
          open: 9.2,
          high: 9.4,
          low: 9.1,
          close: 9.3,
          volume: 1300000
        }
      ]
    });
  });

  test("loads market klines from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadMarketKlines(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "1d", limit: 2 },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => ({
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            quality: { source: "tencent", isComplete: true, warnings: [], rows: 2 },
            bars: [
              {
                timestamp: "2026-05-22T00:00:00+08:00",
                timestampMs: 1779379200000,
                open: 9,
                high: 9.12,
                low: 8.98,
                close: 9.08,
                volume: 100000
              },
              {
                timestamp: "2026-05-25T00:00:00+08:00",
                timestampMs: 1779638400000,
                open: 9.1,
                high: 9.32,
                low: 9.09,
                close: 9.27,
                volume: 120000
              }
            ]
          })
        };
      }
    );

    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/market/klines?market=ashare&symbol=600000&timeframe=1d&limit=2"
    ]);
    expect(result.source).toBe("core");
    expect(result.quality.source).toBe("tencent");
    expect(result.bars.at(-1)?.close).toBe(9.27);
  });

  test("loads market data readiness from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadMarketDataReadiness(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "1d" },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => ({
            market: "ashare",
            symbol: "600000",
            timeframe: "1d",
            state: "ready",
            source: "tencent",
            cacheState: "fresh",
            barCount: 500,
            latestBarAt: "2026-05-26T00:00:00+08:00",
            startBarAt: "2025-05-26T00:00:00+08:00",
            ageHours: 2,
            providerHealthState: "healthy",
            blockingReasons: [],
            repairActions: [],
            latestRefreshRunId: "cache-refresh-ready",
            latestProviderErrorId: null,
            dataQualityWarnings: []
          })
        };
      }
    );

    expect(buildMarketDataReadinessUrl("http://127.0.0.1:8765", "ashare", "600000", "1d")).toBe(
      "http://127.0.0.1:8765/api/market/data-readiness?market=ashare&symbol=600000&timeframe=1d"
    );
    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/market/data-readiness?market=ashare&symbol=600000&timeframe=1d"
    ]);
    expect(result.source).toBe("core");
    expect(result.readiness?.state).toBe("ready");
    expect(result.readiness?.cacheState).toBe("fresh");
    expect(result.readiness?.providerHealthState).toBe("healthy");
    expect(result.readiness?.repairActions).toEqual([]);
  });

  test("loads historical market klines with the requested end boundary", async () => {
    const calls: string[] = [];
    const result = await loadMarketKlines(
      "http://127.0.0.1:8765",
      { market: "ashare", symbol: "600000", timeframe: "60m", limit: 500, end: "2026-05-26T09:45:00.000Z" },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => ({
            market: "ashare",
            symbol: "600000",
            timeframe: "60m",
            quality: { source: "demo-fallback", isComplete: false, warnings: [], rows: 1 },
            bars: [
              {
                timestamp: "2026-05-26T09:00:00+08:00",
                timestampMs: 1779738000000,
                open: 9.1,
                high: 9.2,
                low: 9.0,
                close: 9.16,
                volume: 3200
              }
            ]
          })
        };
      }
    );

    expect(calls).toEqual([
      "http://127.0.0.1:8765/api/market/klines?market=ashare&symbol=600000&timeframe=60m&limit=500&end=2026-05-26T09%3A45%3A00.000Z"
    ]);
    expect(result.source).toBe("core");
    expect(result.bars[0].timestamp).toBe("2026-05-26T09:00:00+08:00");
  });

  test("merges historical market klines before existing bars without duplicates", () => {
    const current = {
      market: "ashare" as const,
      symbol: "600000",
      timeframe: "60m" as const,
      source: "core" as const,
      quality: { source: "demo-fallback", isComplete: false, warnings: ["current"], rows: 2 },
      bars: [
        {
          timestamp: "2026-05-26T10:00:00+08:00",
          timestampMs: 1779746400000,
          open: 9.1,
          high: 9.3,
          low: 9.0,
          close: 9.2,
          volume: 1000
        },
        {
          timestamp: "2026-05-26T11:00:00+08:00",
          timestampMs: 1779750000000,
          open: 9.2,
          high: 9.4,
          low: 9.1,
          close: 9.3,
          volume: 1200
        }
      ]
    };
    const incoming = {
      ...current,
      quality: { source: "demo-fallback", isComplete: false, warnings: ["older"], rows: 2 },
      bars: [
        {
          timestamp: "2026-05-26T09:00:00+08:00",
          timestampMs: 1779742800000,
          open: 9.0,
          high: 9.2,
          low: 8.9,
          close: 9.1,
          volume: 900
        },
        current.bars[0]
      ]
    };

    const merged = mergeMarketKlines(current, incoming);

    expect(merged.bars.map((bar) => bar.timestampMs)).toEqual([1779742800000, 1779746400000, 1779750000000]);
    expect(merged.quality.rows).toBe(3);
    expect(merged.quality.warnings).toEqual(["current", "older"]);
  });

  test("loads market symbol search suggestions from the Python core", async () => {
    const calls: string[] = [];
    const result = await loadMarketSearch(
      "http://127.0.0.1:8765",
      { market: "ashare", query: "600", limit: 2, timeframe: "1d" },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          json: async () => ({
            market: "ashare",
            query: "600",
            timeframe: "1d",
            results: [
              {
                market: "ashare",
                symbol: "600000",
                name: "浦发银行",
                source: "eastmoney",
                exchange: "沪A",
                pinyin: "PFYH",
                cache: {
                  freshness: "fresh",
                  rowCount: 240,
                  ageHours: 12,
                  startTimestamp: "2026-05-01T00:00:00+00:00",
                  endTimestamp: "2026-06-09T00:00:00+00:00"
                }
              }
            ]
          })
        };
      }
    );

    expect(calls).toEqual(["http://127.0.0.1:8765/api/market/search?market=ashare&query=600&limit=2&timeframe=1d"]);
    expect(result.source).toBe("core");
    expect(result.timeframe).toBe("1d");
    expect(result.results[0].name).toBe("浦发银行");
    expect(result.results[0].cache).toMatchObject({ freshness: "fresh", rowCount: 240, ageHours: 12 });
  });

  test("returns an empty run history when the Python core is unavailable", async () => {
    const result = await loadResearchRunHistory("http://127.0.0.1:8765", 5, async () => {
      throw new Error("offline");
    });

    expect(result.source).toBe("fallback");
    expect(result.runs).toEqual([]);
    expect(result.error).toBe("offline");
  });

  test("builds encoded strategy experiment collection and detail URLs", () => {
    expect(
      buildStrategyExperimentsUrl("/", {
        strategyRevision: "rev/a",
        sourceRunId: "run 1",
        limit: 5
      })
    ).toBe("/api/strategy-experiments?strategyRevision=rev%2Fa&sourceRunId=run+1&limit=5");
    expect(buildStrategyExperimentDetailUrl("/", "experiment/你好")).toBe(
      "/api/strategy-experiments/experiment%2F%E4%BD%A0%E5%A5%BD"
    );
  });

  test("creates a strategy experiment with the exact new-definition request", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const request = {
      strategyRevision: "rev/a",
      sourceRunId: "run 1",
      assumptions: { initialCash: 100000, feeBps: 3, slippageBps: 2 },
      dimensions: [
        { conditionSide: "entry" as const, conditionIndex: 0, parameter: "window" as const, values: [10, 15] }
      ],
      guardrails: { minimumTradeCount: 2, maximumDrawdownPct: 20 },
      walkForward: { trainBars: 40, validationBars: 10, stepBars: 10 }
    };

    const result = await createStrategyExperiment("/", request, async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 201, json: async () => ({ experiment: sampleStrategyExperimentDetail() }) };
    });

    expect(calls).toEqual([
      {
        url: "/api/strategy-experiments",
        init: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request)
        }
      }
    ]);
    expect(result.source).toBe("core");
    expect(result.experiment?.experimentId).toBe("experiment-1");
    expect(result.experiment?.candidates[0]?.testMetrics?.totalReturnPct).toBe(4.2);
  });

  test("replays a strategy experiment through the create client", async () => {
    const bodies: unknown[] = [];
    const result = await createStrategyExperiment(
      "/",
      { replayOfExperimentId: "experiment/1" },
      async (_url, init) => {
        bodies.push(JSON.parse(String(init?.body)));
        return { ok: true, status: 201, json: async () => ({ experiment: sampleStrategyExperimentDetail() }) };
      }
    );

    expect(bodies).toEqual([{ replayOfExperimentId: "experiment/1" }]);
    expect(result.source).toBe("core");
    expect(result.experiment?.definitionHash).toBe("definition-hash-1");
  });

  test("loads valid strategy experiment list and detail envelopes", async () => {
    const detail = sampleStrategyExperimentDetail();
    const listItem = Object.fromEntries(
      Object.entries(detail).filter(([key]) => !["holdoutStatus", "snapshot", "candidates"].includes(key))
    );
    const history = await loadStrategyExperiments(
      "/",
      { strategyRevision: "rev/a", sourceRunId: "run 1", limit: 5 },
      async () => ({ ok: true, status: 200, json: async () => ({ experiments: [listItem] }) })
    );
    const loaded = await loadStrategyExperimentDetail("/", "experiment/1", async () => ({
      ok: true,
      status: 200,
      json: async () => ({ experiment: detail })
    }));

    expect(history.source).toBe("core");
    expect(history.experiments[0]?.strategyLineageKey).toBe(stage3Hash("7"));
    expect(history.experiments[0]?.definition.baseStrategy.revision).toBe("rev/a");
    expect(loaded.source).toBe("core");
    expect(loaded.experiment?.strategyLineageKey).toBe(stage3Hash("7"));
    expect(loaded.experiment?.snapshot.bars[0]?.close).toBe(9.3);
    expect(loaded.experiment?.candidates[0]?.walkForward.validationWindowCount).toBe(1);

    const { strategyLineageKey: _omitted, ...withoutLineageKey } = listItem;
    const missingLineage = await loadStrategyExperiments("/", {}, async () => ({
      ok: true,
      status: 200,
      json: async () => ({ experiments: [withoutLineageKey] })
    }));
    expect(missingLineage.source).toBe("fallback");
    expect(missingLineage.experiments).toEqual([]);
  });

  test("preserves strategy experiment core business errors instead of falling back", async () => {
    const result = await createStrategyExperiment(
      "/",
      { replayOfExperimentId: "experiment-1" },
      async () => ({
        ok: false,
        status: 409,
        json: async () => ({ error: "test_holdout_consumed", detail: "Use a fresh snapshot." })
      })
    );

    expect(result).toEqual({
      source: "core",
      errorCode: "test_holdout_consumed",
      error: "Use a fresh snapshot."
    });
  });

  test("accepts legacy or v2 strategy experiment source snapshots and rejects unknown hash versions", async () => {
    const runPayload = (hashVersion?: string) => ({
      run: {
        runId: "run-snapshot-version",
        createdAt: "2026-07-10T08:00:00+00:00",
        market: "ashare",
        symbol: "600000",
        timeframe: "1d",
        strategyName: "SMA plan",
        strategyRevision: "rev/a",
        dataRows: 1,
        metrics: {},
        decisions: [],
        executionMode: "paper_only",
        dataSnapshot: {
          ...(hashVersion === undefined ? {} : { hashVersion }),
          source: "tencent",
          isComplete: true,
          warnings: [],
          rows: 1,
          start: "2026-07-09T08:00:00+00:00",
          end: "2026-07-09T08:00:00+00:00",
          hash: "snapshot-hash",
          bars: [
            {
              timestamp: "2026-07-09T08:00:00+00:00",
              timestampMs: 1783584000000,
              open: 9.1,
              high: 9.4,
              low: 9,
              close: 9.3,
              volume: 1300000
            }
          ]
        }
      }
    });
    const fetchVersion = (version?: string) =>
      loadResearchRunDetail("/", "run-snapshot-version", async () => ({
        ok: true,
        status: 200,
        json: async () => runPayload(version)
      }));

    expect((await fetchVersion()).source).toBe("core");
    expect((await fetchVersion("aiqt-data-v2")).source).toBe("core");
    expect((await fetchVersion("aiqt-data-v1")).source).toBe("fallback");
  });

  test("loads safe AI review provider status and rejects secret-bearing projections", async () => {
    const valid = await loadAiReviewProviders("/", async (url, init) => {
      expect(url).toBe("/api/ai-review/providers");
      expect(init).toBeUndefined();
      return {
        ok: true,
        status: 200,
        json: async () => ({
          providers: [
            { providerId: "local", configured: true, model: null, sanitizedBaseUrl: null },
            {
              providerId: "openai-compatible",
              configured: true,
              model: "review-model",
              sanitizedBaseUrl: "https://example.test/v1"
            }
          ]
        })
      };
    });
    expect(valid.source).toBe("core");
    expect(valid.providers[0]).toMatchObject({ providerId: "local" });

    const invalid = await loadAiReviewProviders("/", async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        providers: [{ providerId: "openai", configured: true, model: "gpt-5", sanitizedBaseUrl: null, apiKey: "x" }]
      })
    }));
    expect(invalid.source).toBe("fallback");
    expect(invalid.providers).toEqual([]);
    expect(invalid.error).toContain("provider");
  });

  test("creates an authoritative review with an exact request and forwards AbortSignal", async () => {
    const controller = new AbortController();
    const request = {
      primaryExperimentId: "primary",
      comparisonExperimentIds: [],
      providerId: "local" as const,
      externalDataApproved: false,
      uiOnly: "must-not-leak"
    };
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const review = sampleAuthoritativeAiReviewPayload();
    const result = await createAuthoritativeAiReview("/", request, controller.signal, async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 201, json: async () => ({ review, latestDecision: null }) };
    });

    expect(calls).toEqual([
      {
        url: "/api/ai-reviews",
        init: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            primaryExperimentId: "primary",
            comparisonExperimentIds: [],
            providerId: "local",
            externalDataApproved: false
          }),
          signal: controller.signal
        }
      }
    ]);
    expect(result).toMatchObject({ source: "core", review: { authority: "authoritative" }, latestDecision: null });

    const mutableRequest = {
      ...request,
      comparisonExperimentIds: [] as string[],
      providerId: "local" as "local" | "openai"
    };
    const snapshottedPromise = createAuthoritativeAiReview("/", mutableRequest, async (_url, init) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        primaryExperimentId: "primary",
        comparisonExperimentIds: [],
        providerId: "local",
        externalDataApproved: false
      });
      return { ok: true, status: 201, json: async () => ({ review, latestDecision: null }) };
    });
    mutableRequest.primaryExperimentId = "mutated-after-call";
    mutableRequest.comparisonExperimentIds.push("mutated-after-call");
    mutableRequest.providerId = "openai";
    mutableRequest.externalDataApproved = true;
    const snapshotted = await snapshottedPromise;
    expect(snapshotted.source).toBe("core");

    const mismatches = [
      { request: { ...request, primaryExperimentId: "other" }, latestDecision: null },
      { request: { ...request, comparisonExperimentIds: ["comparison"] }, latestDecision: null },
      { request: { ...request, providerId: "openai" as const }, latestDecision: null },
      { request, latestDecision: sampleAiReviewDecisionPayload(1) }
    ];
    for (const mismatch of mismatches) {
      const rejected = await createAuthoritativeAiReview("/", mismatch.request, async () => ({
        ok: true,
        status: 201,
        json: async () => ({ review, latestDecision: mismatch.latestDecision })
      }));
      expect(rejected.source).toBe("fallback");
      expect(rejected.review).toBeUndefined();
    }
  });

  test("loads encoded authoritative detail and deeply rejects a legacy review", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const review = sampleAuthoritativeAiReviewPayload();
    const result = await loadAuthoritativeAiReview("/", review.aiReviewId, async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 200, json: async () => ({ review, latestDecision: null }) };
    });
    expect(calls).toEqual([{ url: `/api/ai-reviews/${review.aiReviewId}`, init: undefined }]);
    expect(result.review?.recordHash).toBe(stage3Hash("a"));

    const mismatched = await loadAuthoritativeAiReview("/", "ai-review-other", async () => ({
      ok: true,
      status: 200,
      json: async () => ({ review, latestDecision: null })
    }));
    expect(mismatched.source).toBe("fallback");
    expect(mismatched.review).toBeUndefined();

    const legacy = await loadAuthoritativeAiReview("/", "legacy", async () => ({
      ok: true,
      status: 200,
      json: async () => ({ review: { ...review, schemaVersion: 1, authority: "legacy" }, latestDecision: null })
    }));
    expect(legacy.source).toBe("fallback");
    expect(legacy.review).toBeUndefined();

    const missing = await loadAuthoritativeAiReview("/", review.aiReviewId, async () => ({
      ok: false,
      status: 404,
      json: async () => ({ detail: "ai_review_not_found" })
    }));
    expect(missing).toMatchObject({
      source: "fallback",
      error: "ai_review_not_found",
      httpStatus: 404
    });
  });

  test("loads a persistent Stage 3 archive import snapshot for same-hash comparison", async () => {
    const exportPackage = sampleStage3ArchiveExportPackage() as unknown as ResearchRunExportPackage;
    const review = { ...exportPackage.aiReviewRunsV2![0].record, authority: "authoritative" as const };
    const decision = exportPackage.aiReviewDecisions![0].record;
    const snapshot = await loadAiReviewArchiveImportSnapshot("/", exportPackage, async (url) => {
      if (url.endsWith("/decisions")) {
        return { ok: true, status: 200, json: async () => ({ decisions: [decision] }) };
      }
      if (url.includes("?")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            reviews: [review],
            pagination: { limit: 50, offset: 0, total: 1, query: review.aiReviewId }
          })
        };
      }
      return { ok: true, status: 200, json: async () => ({ review, latestDecision: decision }) };
    });

    expect(snapshot).toEqual({
      authoritativeAiReviewRecords: [review],
      aiReviewDecisions: [decision],
      legacyAiReviewIds: [],
      readbackErrors: {}
    });
  });

  test("treats 404 as absent but fails closed on readback and authority errors", async () => {
    const exportPackage = sampleStage3ArchiveExportPackage() as unknown as ResearchRunExportPackage;
    const review = { ...exportPackage.aiReviewRunsV2![0].record, authority: "authoritative" as const };
    const decision = exportPackage.aiReviewDecisions![0].record;
    const history = (reviews: unknown[]) => ({
      ok: true,
      status: 200,
      json: async () => ({
        reviews,
        pagination: { limit: 50, offset: 0, total: reviews.length, query: review.aiReviewId }
      })
    });
    const missing = await loadAiReviewArchiveImportSnapshot("/", exportPackage, async (url) =>
      url.includes("?")
        ? history([])
        : { ok: false, status: 404, json: async () => ({ detail: "ai_review_not_found" }) }
    );
    expect(missing).toMatchObject({
      authoritativeAiReviewRecords: [],
      aiReviewDecisions: [],
      legacyAiReviewIds: [],
      readbackErrors: {}
    });

    const unavailable = await loadAiReviewArchiveImportSnapshot("/", exportPackage, async (url) => {
      if (url.includes("?")) {
        return history([]);
      }
      throw new Error("offline");
    });
    expect(unavailable.readbackErrors).toMatchObject({
      ["review:" + review.aiReviewId]: "offline",
      ["decisions:" + review.aiReviewId]: "offline"
    });

    const legacyRecord = {
      ...sampleLegacyAiReviewHistoryPayload(),
      aiReviewId: review.aiReviewId
    };
    const authorityConflict = await loadAiReviewArchiveImportSnapshot("/", exportPackage, async (url) =>
      url.includes("?")
        ? history([legacyRecord])
        : { ok: false, status: 404, json: async () => ({ detail: "ai_review_not_found" }) }
    );
    expect(authorityConflict.legacyAiReviewIds).toEqual([review.aiReviewId]);

    const decisionUnavailable = await loadAiReviewArchiveImportSnapshot("/", exportPackage, async (url) => {
      if (url.endsWith("/decisions")) {
        throw new Error("decision store offline");
      }
      if (url.includes("?")) {
        return history([review]);
      }
      return { ok: true, status: 200, json: async () => ({ review, latestDecision: decision }) };
    });
    expect(decisionUnavailable.readbackErrors).toMatchObject({
      ["decisions:" + review.aiReviewId]: "decision store offline"
    });
  });

  test("loads every paginated authoritative Review and Decision for an Audit run snapshot", async () => {
    const reviews = Array.from({ length: 51 }, (_, index) => {
      const source = sampleAuthoritativeAiReviewPayload();
      const aiReviewId = "ai-review-" + index.toString(16).padStart(32, "0");
      const recordHash = index.toString(16).padStart(64, "0");
      const primaryExperiment = {
        ...source.primaryExperiment,
        sourceRunId: "run-audit-snapshot",
        experimentId: "experiment-audit-" + index
      };
      return {
        ...source,
        aiReviewId,
        primaryExperiment,
        evidenceBundle: {
          ...source.evidenceBundle,
          primaryExperiment
        },
        recordHash
      };
    });
    const first = reviews[0];
    const decision = {
      ...sampleAiReviewDecisionPayload(),
      aiReviewId: first.aiReviewId,
      reviewRecordHash: first.recordHash
    };
    const historyOffsets: number[] = [];
    const result = await loadAiReviewRunArchiveSnapshot("/", "run-audit-snapshot", async (url) => {
      const parsed = new URL(url, "http://aiqt.local");
      if (parsed.pathname.endsWith("/decisions")) {
        const aiReviewId = decodeURIComponent(parsed.pathname.split("/").at(-2) ?? "");
        return {
          ok: true,
          status: 200,
          json: async () => ({ decisions: aiReviewId === first.aiReviewId ? [decision] : [] })
        };
      }
      const offset = Number(parsed.searchParams.get("offset") ?? 0);
      historyOffsets.push(offset);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          reviews: reviews.slice(offset, offset + 50),
          pagination: { limit: 50, offset, total: reviews.length, query: "" }
        })
      };
    });

    expect(historyOffsets).toEqual([0, 50]);
    expect(result).toMatchObject({
      runId: "run-audit-snapshot",
      source: "core",
      authoritativeAiReviewRecords: reviews,
      aiReviewDecisions: [decision],
      legacyAiReviewRecords: []
    });
  });

  test("fails the complete Audit run snapshot when any Decision chain readback fails", async () => {
    const review = sampleAuthoritativeAiReviewPayload();
    const primaryExperiment = { ...review.primaryExperiment, sourceRunId: "run-audit-failure" };
    const runReview = {
      ...review,
      primaryExperiment,
      evidenceBundle: { ...review.evidenceBundle, primaryExperiment }
    };
    const result = await loadAiReviewRunArchiveSnapshot("/", "run-audit-failure", async (url) => {
      if (url.endsWith("/decisions")) {
        throw new Error("decision store offline");
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          reviews: [runReview],
          pagination: { limit: 50, offset: 0, total: 1, query: "" }
        })
      };
    });

    expect(result).toMatchObject({
      runId: "run-audit-failure",
      source: "fallback",
      error: "decision store offline"
    });
  });

  test("fails Audit run snapshots closed on stale pagination and run bindings", async () => {
    const source = sampleAuthoritativeAiReviewPayload();
    const forRun = (runId: string) => {
      const primaryExperiment = { ...source.primaryExperiment, sourceRunId: runId };
      return {
        ...source,
        primaryExperiment,
        evidenceBundle: { ...source.evidenceBundle, primaryExperiment }
      };
    };
    const malformedPages = [
      { reviews: [forRun("run-audit-guard")], pagination: { limit: 49, offset: 0, total: 1, query: "" } },
      { reviews: [forRun("run-audit-guard")], pagination: { limit: 50, offset: 1, total: 1, query: "" } },
      { reviews: [forRun("run-audit-guard")], pagination: { limit: 50, offset: 0, total: 1, query: "stale" } },
      { reviews: [forRun("different-run")], pagination: { limit: 50, offset: 0, total: 1, query: "" } },
      { reviews: [], pagination: { limit: 50, offset: 0, total: 1, query: "" } }
    ];

    for (const page of malformedPages) {
      const result = await loadAiReviewRunArchiveSnapshot("/", "run-audit-guard", async () => ({
        ok: true,
        status: 200,
        json: async () => page
      }));
      expect(result.source).toBe("fallback");
      expect(result.authoritativeAiReviewRecords).toEqual([]);
      expect(result.aiReviewDecisions).toEqual([]);
    }
  });

  test("fails Audit run snapshots closed on duplicate IDs and changing totals across pages", async () => {
    const reviews = Array.from({ length: 50 }, (_, index) => {
      const source = sampleAuthoritativeAiReviewPayload();
      const primaryExperiment = { ...source.primaryExperiment, sourceRunId: "run-audit-pages" };
      return {
        ...source,
        aiReviewId: "ai-review-" + index.toString(16).padStart(32, "0"),
        primaryExperiment,
        evidenceBundle: { ...source.evidenceBundle, primaryExperiment },
        recordHash: index.toString(16).padStart(64, "0")
      };
    });
    for (const secondPage of [
      { reviews: [reviews[0]], pagination: { limit: 50, offset: 50, total: 51, query: "" } },
      { reviews: [{ ...reviews[0], aiReviewId: "ai-review-" + "f".repeat(32) }], pagination: { limit: 50, offset: 50, total: 52, query: "" } }
    ]) {
      const result = await loadAiReviewRunArchiveSnapshot("/", "run-audit-pages", async (url) => {
        const offset = Number(new URL(url, "http://aiqt.local").searchParams.get("offset") ?? 0);
        return {
          ok: true,
          status: 200,
          json: async () => offset === 0
            ? { reviews, pagination: { limit: 50, offset: 0, total: 51, query: "" } }
            : secondPage
        };
      });
      expect(result.source).toBe("fallback");
      expect(result.authoritativeAiReviewRecords).toEqual([]);
    }
  });

  test("loads mixed review history into explicit groups while preserving the mixed total", async () => {
    const calls: string[] = [];
    const review = sampleAuthoritativeAiReviewPayload();
    const result = await loadAuthoritativeAiReviews(
      "/",
      { runId: "run 1", experimentId: "experiment/1", limit: 5, offset: 10, query: "hash match" },
      async (url) => {
        calls.push(url);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            reviews: [{
              ...sampleLegacyAiReviewHistoryPayload(),
              apiKey: "must-not-enter-state",
              externalAssessment: { provider: "openai", model: "must-not-enter-state" },
              primaryExperiment: { experimentId: "malformed-v2-field" },
              summary: { liveExecutionBlocked: true, secret: "must-not-enter-state" }
            }, review],
            pagination: { limit: 5, offset: 10, total: 12, query: "hash match" }
          })
        };
      }
    );
    expect(calls).toEqual([
      "/api/ai-reviews?runId=run+1&experimentId=experiment%2F1&limit=5&offset=10&query=hash+match"
    ]);
    expect(result).toMatchObject({
      source: "core",
      pagination: { total: 12 },
      reviews: [{ schemaVersion: 2 }],
      legacyReviews: [{
        schemaVersion: 1,
        authority: "legacy",
        recordType: "aiqt.aiReviewRun",
        aiReviewId: "ai-review-v1-http",
        runId: "run-primary",
        createdAt: "2026-07-10T07:00:00+00:00",
        status: "ready",
        boundary: "Evidence explanation only; live routing remains blocked."
      }]
    });
    expect(result.legacyReviews[0]).toEqual({
      schemaVersion: 1,
      authority: "legacy",
      recordType: "aiqt.aiReviewRun",
      aiReviewId: "ai-review-v1-http",
      runId: "run-primary",
      createdAt: "2026-07-10T07:00:00+00:00",
      status: "ready",
      boundary: "Evidence explanation only; live routing remains blocked."
    });

    const invalid = await loadAuthoritativeAiReviews("/", {}, async () => ({
      ok: true,
      status: 200,
      json: async () => ({ reviews: [review], pagination: { limit: "5", offset: 0, total: 1, query: "" } })
    }));
    expect(invalid.source).toBe("fallback");
    expect(invalid.reviews).toEqual([]);
    expect(invalid.legacyReviews).toEqual([]);

    const malformed = await loadAuthoritativeAiReviews("/", {}, async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        reviews: [{ ...sampleLegacyAiReviewHistoryPayload(), authority: "unknown" }],
        pagination: { limit: 20, offset: 0, total: 1, query: "" }
      })
    }));
    expect(malformed.source).toBe("fallback");
    expect(malformed.reviews).toEqual([]);
    expect(malformed.legacyReviews).toEqual([]);
  });

  test("rejects invalid review pagination filters without sending a request", async () => {
    const invalidFilters = [
      { limit: 0 },
      { limit: 51 },
      { limit: 1.5 },
      { limit: Number.NaN },
      { limit: Number.POSITIVE_INFINITY },
      { offset: -1 },
      { offset: 1.5 },
      { offset: Number.NaN },
      { offset: Number.POSITIVE_INFINITY }
    ];
    for (const filters of invalidFilters) {
      expect(() => buildAuthoritativeAiReviewsUrl("/", filters)).toThrow("Invalid AI review filters");
      let requested = false;
      const result = await loadAuthoritativeAiReviews("/", filters, async () => {
        requested = true;
        throw new Error("must not request");
      });
      expect(requested).toBe(false);
      expect(result.source).toBe("fallback");
    }
  });

  test("loads and appends the exact AI review decision chain", async () => {
    const first = sampleAiReviewDecisionPayload(1);
    const second = sampleAiReviewDecisionPayload(2);
    const loaded = await loadAiReviewDecisions("/", first.aiReviewId, async (url) => {
      expect(url).toBe(`/api/ai-reviews/${first.aiReviewId}/decisions`);
      return { ok: true, status: 200, json: async () => ({ decisions: [first, second] }) };
    });
    expect(loaded.decisions).toHaveLength(2);

    const controller = new AbortController();
    const request = {
      operator: "researcher",
      status: "revision_requested" as const,
      rationale: "Add a longer validation window.",
      supersedesDecisionId: second.decisionId,
      uiDraftId: "must-not-leak"
    };
    const appendedDecision = {
      ...sampleAiReviewDecisionPayload(3),
      operator: request.operator,
      status: request.status,
      rationale: request.rationale,
      supersedesDecisionId: request.supersedesDecisionId
    };
    const appended = await appendAiReviewDecision(
      "/",
      second.aiReviewId,
      request,
      controller.signal,
      async (url, init) => {
        expect(url).toBe(`/api/ai-reviews/${second.aiReviewId}/decisions`);
        expect(init).toEqual({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operator: "researcher",
            status: "revision_requested",
            rationale: "Add a longer validation window.",
            supersedesDecisionId: second.decisionId
          }),
          signal: controller.signal
        });
        return { ok: true, status: 201, json: async () => ({ decision: appendedDecision }) };
      }
    );
    expect(appended).toMatchObject({ source: "core", decision: { status: "revision_requested" } });

    const mutableRequest = {
      ...request,
      status: "revision_requested" as "revision_requested" | "accepted_for_research"
    };
    const snapshottedPromise = appendAiReviewDecision(
      "/",
      second.aiReviewId,
      mutableRequest,
      async (_url, init) => {
        expect(JSON.parse(String(init?.body))).toEqual({
          operator: "researcher",
          status: "revision_requested",
          rationale: "Add a longer validation window.",
          supersedesDecisionId: second.decisionId
        });
        return { ok: true, status: 201, json: async () => ({ decision: appendedDecision }) };
      }
    );
    mutableRequest.operator = "mutated-after-call";
    mutableRequest.status = "accepted_for_research";
    mutableRequest.rationale = "mutated-after-call";
    mutableRequest.supersedesDecisionId = first.decisionId;
    const snapshotted = await snapshottedPromise;
    expect(snapshotted).toMatchObject({
      source: "core",
      decision: {
        operator: "researcher",
        status: "revision_requested",
        rationale: "Add a longer validation window.",
        supersedesDecisionId: second.decisionId
      }
    });

    const mismatchedFields = [
      { ...appendedDecision, operator: "another-operator" },
      { ...appendedDecision, status: "accepted_for_research" },
      { ...appendedDecision, rationale: "A different rationale." },
      { ...appendedDecision, supersedesDecisionId: first.decisionId }
    ];
    for (const decision of mismatchedFields) {
      const mismatched = await appendAiReviewDecision("/", second.aiReviewId, request, async () => ({
        ok: true,
        status: 201,
        json: async () => ({ decision })
      }));
      expect(mismatched.source).toBe("fallback");
      expect(mismatched.decision).toBeUndefined();
    }

    const mismatchedList = await loadAiReviewDecisions("/", "ai-review-other", async () => ({
      ok: true,
      status: 200,
      json: async () => ({ decisions: [first, second] })
    }));
    expect(mismatchedList).toMatchObject({ source: "fallback", decisions: [] });

    const mismatchedAppend = await appendAiReviewDecision(
      "/",
      "ai-review-other",
      request,
      async () => ({
        ok: true,
        status: 201,
        json: async () => ({ decision: second })
      })
    );
    expect(mismatchedAppend.source).toBe("fallback");
    expect(mismatchedAppend.decision).toBeUndefined();
  });

  test("rejects a broken decision predecessor chain before returning it to callers", async () => {
    const first = sampleAiReviewDecisionPayload(1);
    const second = { ...sampleAiReviewDecisionPayload(2), supersedesDecisionId: null };
    const result = await loadAiReviewDecisions("/", first.aiReviewId, async () => ({
      ok: true,
      status: 200,
      json: async () => ({ decisions: [first, second] })
    }));
    expect(result.source).toBe("fallback");
    expect(result.decisions).toEqual([]);
  });

  test("returns invalid review IDs through fallback promises without fetching", async () => {
    let fetchCount = 0;
    const fetcher = async () => {
      fetchCount += 1;
      throw new Error("must not fetch");
    };
    const createRequest = {
      primaryExperimentId: "primary",
      comparisonExperimentIds: [] as string[],
      providerId: "local" as const,
      externalDataApproved: false
    };
    for (const request of [
      { ...createRequest, primaryExperimentId: " primary" },
      { ...createRequest, primaryExperimentId: "" },
      { ...createRequest, comparisonExperimentIds: ["comparison "] },
      { ...createRequest, comparisonExperimentIds: ["   "] }
    ]) {
      const result = await createAuthoritativeAiReview("/", request, fetcher);
      expect(result.source).toBe("fallback");
      expect(result.error).toContain("Invalid AI review ID");
    }
    for (const aiReviewId of [" ai-review-id", "", "   "]) {
      expect((await loadAuthoritativeAiReview("/", aiReviewId, fetcher)).source).toBe("fallback");
      expect((await loadAiReviewDecisions("/", aiReviewId, fetcher)).source).toBe("fallback");
      expect((await appendAiReviewDecision("/", aiReviewId, {
        operator: "researcher",
        status: "revision_requested",
        rationale: "Add a longer validation window.",
        supersedesDecisionId: null
      }, fetcher)).source).toBe("fallback");
    }
    expect(fetchCount).toBe(0);
    expect(() => buildAuthoritativeAiReviewUrl("/", " bad-id")).toThrow("Invalid AI review ID");
    expect(() => buildAiReviewDecisionsUrl("/", " bad-id")).toThrow("Invalid AI review ID");
  });

  test("keeps non-ID URL construction errors in the fallback channel", async () => {
    const result = await loadAuthoritativeAiReview(
      "not-a-valid-base",
      "ai-review-0123456789abcdef0123456789abcdef",
      async () => { throw new Error("must not fetch"); }
    );
    expect(result.source).toBe("fallback");
    expect(result.review).toBeUndefined();
  });
});

async function sha256TextHexForTest(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
