import type {
  ExecutionState,
  Market,
  ProductDevelopmentStageId,
  ProductDevelopmentStageStatus,
  ProductWorkArea,
  ProductWorkAreaStatus,
  ResearchRunAudit,
  ResearchRunSummary
} from "./terminal-workbench";

export type Locale = "zh-CN" | "en-US";
export type TranslationKey = keyof typeof messages["en-US"];
type WorkflowNodeTranslation = readonly [string, string];
type LocalizedLabelMap = {
  markets: Record<Market, string>;
  productWorkAreas: Record<string, string>;
  productWorkAreaDescriptions: Record<string, string>;
  productWorkAreaStatuses: Record<ProductWorkAreaStatus, string>;
  productDevelopmentStages: Record<ProductDevelopmentStageId, string>;
  productDevelopmentStageStatuses: Record<ProductDevelopmentStageStatus, string>;
  quantLoop: Record<string, string>;
  modules: Record<string, string>;
  agents: Record<string, string>;
  workflowNodes: Record<string, WorkflowNodeTranslation>;
  moduleFocus: Record<string, string>;
  quantLoopFocus: Record<string, string>;
  gates: Record<string, string>;
  metrics: Record<string, string>;
  statuses: Record<string, string>;
  executionModes: Record<ExecutionState["mode"], string>;
};

export const supportedLocales: Locale[] = ["zh-CN", "en-US"];

const messages = {
  "en-US": {
    "language.zh": "中文",
    "language.en": "EN",
    "language.zh.label": "Simplified Chinese",
    "language.en.label": "English",
    "aria.language": "Language",
    "aria.timeframe": "Research timeframe",
    "aria.symbolSwitcher": "Symbol switcher",
    "brand.subtitle": "Local-first quant OS",
    "section.quantLoop": "Research Workflows",
    "section.terminalModules": "Terminal Modules",
    "section.auditTrail": "Audit Trail",
    "topbar.eyebrow": "Professional Quant Workbench",
    "symbol.market": "Market",
    "symbol.placeholder": "Symbol",
    "symbol.searching": "Searching",
    "symbol.noResults": "No matches",
    "symbol.source": "Source",
    "action.switchSymbol": "Switch",
    "action.saveWatchlist": "Save watchlist",
    "action.saveWatchlistChanges": "Save watchlist changes",
    "watchlist.unsaved": "Unsaved",
    "watchlist.saved": "Saved",
    "watchlist.unsavedDetail": "Selected symbol is in the local watchlist but has not been persisted yet.",
    "watchlist.savedDetail": "Current watchlist is persisted in the local core.",
    "action.saveResearchWorkspace": "Save workspace",
    "action.saveResearchWorkspaceChanges": "Save workspace changes",
    "action.copyResearchContextLink": "Copy research link",
    "action.researchContextLinkCopied": "Link copied",
    "researchWorkspace.unsaved": "Unsaved",
    "researchWorkspace.saved": "Saved",
    "researchWorkspace.unsavedDetail": "Current Stage 1 market, symbol, timeframe, or entry workspace has not been persisted yet.",
    "researchWorkspace.savedDetail": "Current Stage 1 research workspace context is persisted in the local core.",
    "action.runPipeline": "Run Pipeline",
    "p0Journey.title": "P0 Golden Path",
    "p0Journey.subtitle": "One path from data to paper replay",
    "p0Journey.current": "Current",
    "p0Journey.done": "Done",
    "p0Journey.blocked": "Blocked",
    "p0Journey.ready": "Ready",
    "p0Journey.action": "Run next step",
    "p0Journey.boundary": "Paper-only · live trading blocked",
    "moduleFocus.label": "Current Task",
    "moduleFocus.instrument": "Instrument",
    "panel.chart.title": "Chart & Factor Overlays",
    "panel.chart.subtitle": "Price · SMA20 · Trades · {timeframe}",
    "chart.noData": "No K-line data",
    "chart.symbol": "Symbol",
    "chart.latestClose": "Close",
    "chart.asOf": "As of",
    "chart.expand": "Expand chart",
    "chart.closeExpanded": "Close expanded chart",
    "chart.source": "Source",
    "chart.bars": "{count} bars",
    "panel.strategy.title": "Strategy Snapshot",
    "panel.backtest.title": "Backtest Replay",
    "panel.backtest.subtitle": "Audited fills · drawdown · exit review",
    "panel.nodeWorkflow.title": "Node Workflow",
    "panel.nodeWorkflow.subtitle": "Visual pipeline",
    "panel.execution.title": "Execution Center",
    "panel.execution.subtitle": "Paper first · certified live only",
    "panel.agent.title": "Agent Committee",
    "panel.agent.subtitle": "TradingAgents-style review",
    "panel.agentRoles.title": "Agent Roles",
    "panel.agentRoles.subtitle": "Current research roles",
    "panel.agent.rounds": "Committee rounds",
    "panel.agent.evidence": "Evidence summary",
    "panel.decision.title": "Decision Log",
    "panel.decision.subtitle": "Traceable AI research",
    "panel.history.title": "Run History",
    "panel.history.subtitle": "Recent audited runs",
    "history.replay": "Replay",
    "history.export": "Export",
    "history.import": "Import",
    "history.active": "Active run",
    "history.rows": "{count} bars",
    "history.revision": "Revision",
    "history.execution": "Execution",
    "history.comparison": "Run comparison",
    "history.current": "Current",
    "history.previous": "Previous",
    "history.delta": "Delta",
    "history.changed": "changed",
    "history.unchanged": "same",
    "panel.aiActions.title": "AI Actions",
    "panel.aiActions.subtitle": "Structured, not generic chat",
    "module.scanner.title": "Market Scanner",
    "module.scanner.subtitle": "Derived from active watchlist and quote context",
    "module.scanner.filters": "Filters",
    "module.scanner.results": "Candidates",
    "module.scanner.score": "Score",
    "module.scanner.signal": "Signal",
    "module.scanner.risk": "Risk",
    "module.scanner.research": "Research",
    "module.portfolio.title": "Portfolio Risk",
    "module.portfolio.subtitle": "Paper exposure and live-trading gates",
    "portfolio.paperPositions": "Paper positions",
    "portfolio.avgCost": "Avg cost",
    "portfolio.markPrice": "Mark",
    "portfolio.marketValue": "Market value",
    "portfolio.unrealizedPnl": "Unrealized P&L",
    "portfolio.returnPct": "Return",
    "portfolio.backtest": "Portfolio backtest",
    "portfolio.backtestRun": "Run portfolio backtest",
    "portfolio.backtestRunning": "Running",
    "portfolio.exportMarkdown": "Export report",
    "portfolio.recordPaperOrders": "Record orders",
    "portfolio.recordPaperOrdersRunning": "Recording",
    "portfolio.backtestDraft": "Draft legs",
    "portfolio.backtestResult": "Result",
    "portfolio.backtestNoResult": "Run a portfolio backtest to see combined return, drawdown, and leg contribution.",
    "portfolio.peerAudits": "Peer audits",
    "portfolio.peerAuditsRun": "Prepare peer audits",
    "portfolio.peerAuditsRunning": "Preparing",
    "portfolio.peerAudited": "audited",
    "portfolio.peerMissing": "missing",
    "portfolio.weight": "Weight",
    "portfolio.cash": "Cash",
    "portfolio.totalReturn": "Total return",
    "portfolio.maxDrawdown": "Max drawdown",
    "portfolio.tradeCount": "Trades",
    "portfolio.contribution": "Contribution",
    "portfolio.dataRows": "Equity points",
    "portfolio.diagnostics": "Portfolio diagnostics",
    "portfolio.allocationLedger": "Allocation ledger",
    "portfolio.allocationAllocate": "Allocate",
    "portfolio.allocationCashBuffer": "Cash buffer",
    "portfolio.sourceRun": "Source run",
    "portfolio.notional": "Notional",
    "portfolio.rebalanceReviewLedger": "Rebalance review",
    "portfolio.endingWeight": "End weight",
    "portfolio.deltaValue": "Delta value",
    "portfolio.rebalanceBlocked": "blocked",
    "portfolio.rebalanceReview": "review",
    "portfolio.rebalanceWithinBand": "within band",
    "portfolio.tradeReviewLedger": "Trade review",
    "portfolio.tradeReviewBlocked": "blocked",
    "portfolio.tradeReviewPaperReview": "paper review",
    "portfolio.tradeReviewNoAction": "no action",
    "portfolio.tradeSideBuy": "buy",
    "portfolio.tradeSideSell": "sell",
    "portfolio.tradeSideHold": "hold",
    "portfolio.preTradeRiskChecks": "Pre-trade risk",
    "portfolio.preTradeRiskValue": "Value",
    "portfolio.preTradeRiskLimit": "Limit",
    "portfolio.scopePortfolio": "Portfolio",
    "portfolio.preTradeRiskPassed": "passed",
    "portfolio.preTradeRiskReview": "review",
    "portfolio.preTradeRiskBlocked": "blocked",
    "portfolio.preTradeRiskDataQuality": "Data quality",
    "portfolio.preTradeRiskTradeStatus": "Intent status",
    "portfolio.preTradeRiskNotional": "Notional limit",
    "portfolio.paperOrderEvents": "Portfolio paper orders",
    "portfolio.paperOrderPendingReview": "pending review",
    "portfolio.paperOrderRejected": "rejected",
    "portfolio.paperOrderSkipped": "skipped",
    "portfolio.paperOrderHistory": "Recorded order batches",
    "portfolio.paperOrderBatch": "Batch",
    "portfolio.paperOrderCount": "Orders",
    "portfolio.paperOrderRecorded": "recorded",
    "portfolio.riskStatus": "Risk",
    "portfolio.stage4.eyebrow": "Stage 4 · Portfolio paper workflow",
    "portfolio.stage4.title": "Portfolio golden path",
    "portfolio.stage4.subtitle": "Build, review, approve, simulate, and restore one authoritative paper-only workflow.",
    "portfolio.stage4.boundary": "Paper only · live trading, broker routing, and order submission blocked",
    "portfolio.stage4.step.portfolioBuild": "Portfolio build",
    "portfolio.stage4.step.riskReview": "Risk review",
    "portfolio.stage4.step.operatorApproval": "Operator approval",
    "portfolio.stage4.step.paperSimulation": "Paper simulation",
    "portfolio.stage4.step.accountReplay": "Account replay",
    "portfolio.stage4.step.unknown": "Workflow step",
    "portfolio.stage4.passed": "Complete",
    "portfolio.stage4.pending": "Pending",
    "portfolio.stage4.busy": "The current paper workflow action is still running.",
    "portfolio.stage4.action.runBacktest": "Run portfolio backtest",
    "portfolio.stage4.action.recordBatch": "Record paper order batch",
    "portfolio.stage4.action.reviewRisk": "Review portfolio risk",
    "portfolio.stage4.action.reviewOrders": "Open operator approvals",
    "portfolio.stage4.action.reviewRouteRisk": "Review route risk",
    "portfolio.stage4.action.simulateBatch": "Simulate paper batch",
    "portfolio.stage4.action.refreshReplay": "Refresh account replay",
    "portfolio.stage4.action.recordWorkflow": "Record authoritative workflow",
    "portfolio.stage4.blocker.portfolioMissing": "Run the portfolio backtest first.",
    "portfolio.stage4.blocker.batchMissing": "The paper order batch has not been recorded.",
    "portfolio.stage4.blocker.riskRejected": "Portfolio risk evidence rejected the batch.",
    "portfolio.stage4.blocker.riskReview": "Portfolio risk still requires review.",
    "portfolio.stage4.blocker.mixedBatch": "Evidence from another batch is mixed into the current batch.",
    "portfolio.stage4.blocker.operatorRejected": "An operator rejected an order in this batch.",
    "portfolio.stage4.blocker.operatorApproval": "Orders have not completed operator approval.",
    "portfolio.stage4.blocker.routeRisk": "Paper route risk blocked this batch.",
    "portfolio.stage4.blocker.simulationMissing": "Paper fills are incomplete.",
    "portfolio.stage4.blocker.replayMissing": "Account history or replay evidence is incomplete.",
    "portfolio.stage4.blocker.workflowMissing": "Record the authoritative Stage 4 workflow.",
    "portfolio.stage4.blocker.staleRun": "The restored evidence belongs to another base run.",
    "portfolio.stage4.evidence": "Authoritative evidence",
    "portfolio.stage4.workflowId": "Workflow ID",
    "portfolio.stage4.workflowHash": "Workflow hash",
    "portfolio.stage4.safety": "No live-trading or broker action is available from this workflow.",
    "execution.stage5.eyebrow": "Stage 5 · Shadow execution",
    "execution.stage5.title": "Shadow operations",
    "execution.stage5.subtitle": "Project the authoritative Stage 4 workflow through an isolated local adapter and restore persisted evidence.",
    "execution.stage5.boundary": "Shadow only · no broker connection, account access, or order route",
    "execution.stage5.start": "Start shadow validation",
    "execution.stage5.retry": "Retry timed-out shadow attempt",
    "execution.stage5.readinessAction": "Generate Sandbox readiness decision",
    "execution.stage5.authorizationPreflightAction": "Generate Sandbox authorization preflight",
    "execution.stage5.authorizationReviewAction": "Record Sandbox authorization review",
    "execution.stage5.authorizationReviewOutcome": "Review outcome",
    "execution.stage5.authorizationReviewApproved": "Approve evidence review",
    "execution.stage5.authorizationReviewRejected": "Reject evidence review",
    "execution.stage5.authorizationReviewReason": "Review reason",
    "execution.stage5.busy": "Shadow validation is running.",
    "execution.stage5.workflowMissing": "Record an authoritative Stage 4 workflow first.",
    "execution.stage5.sessionBlocked": "The shadow session is blocked; review the persisted evidence.",
    "execution.stage5.probeMissing": "Complete a matching server-authoritative read-only probe and review in Settings.",
    "execution.stage5.openProbeSettings": "Open read-only probe settings",
    "execution.stage5.status": "Status",
    "execution.stage5.attempt": "Attempt",
    "execution.stage5.adapter": "Adapter",
    "execution.stage5.failureMode": "Failure mode",
    "execution.stage5.limits": "Max orders / gross notional",
    "execution.stage5.timeout": "Timeout / max attempts",
    "execution.stage5.killSwitch": "Kill switch enabled / triggered",
    "execution.stage5.reconciliation": "Reconciliation",
    "execution.stage5.sessionHash": "Session hash",
    "execution.stage5.orders": "Shadow order evidence",
    "execution.stage5.safety": "paperOnly=true · shadowOnly=true · live/order route blocked",
    "execution.stage5.readinessTitle": "Sandbox readiness decision",
    "execution.stage5.readinessBoundary": "Sandbox order submission remains prohibited · separate human authorization is required",
    "execution.stage5.authorizationPreflightTitle": "Sandbox authorization preflight",
    "execution.stage5.authorizationPreflightBoundary": "Evidence is ready for separate human authorization · Sandbox and live orders remain prohibited",
    "execution.stage5.authorizationReviewTitle": "Sandbox authorization review",
    "execution.stage5.authorizationReviewBoundary": "Review recorded · authorization is not effective · Sandbox and live orders remain prohibited",
    "execution.stage5.exitTitle": "Stage 5 exit acceptance",
    "execution.stage5.exitUnavailable": "Exit evidence is not available",
    "execution.stage5.exitBoundary": "Stage 5 is in maintenance · Sandbox and live order routes remain blocked",
    "module.broker.title": "Broker Center",
    "module.broker.subtitle": "Adapter certification and live-trading gates",
    "broker.adapter": "Adapter",
    "broker.market": "Market",
    "broker.route": "Route",
    "broker.status": "Status",
    "broker.certification": "Certification",
    "broker.nextStep": "Next step",
    "module.news.title": "News & Events",
    "module.news.subtitle": "Quote, audit, risk, and AI context",
    "module.news.context": "Local evidence stream",
    "module.workflow.title": "Node Workflow",
    "module.workflow.subtitle": "A+C orchestration surface",
    "module.workflow.canvas": "Node canvas",
    "module.workflow.output": "Output",
    "module.workflow.artifacts": "Stage artifacts",
    "module.workflow.log": "Run log",
    "module.workflow.idle": "No workflow run yet",
    "module.workflow.run": "Run pipeline",
    "strategy.name": "Name",
    "strategy.entry": "Entry",
    "strategy.exit": "Exit",
    "strategy.position": "Position",
    "strategy.risk": "Risk",
    "strategy.rules": "Rule matrix",
    "strategy.condition": "Condition",
    "strategy.parameter": "Parameter",
    "strategy.status": "Status",
    "strategy.builder": "Structured builder",
    "strategy.templates": "Templates",
    "strategy.template.smaTrend": "SMA trend",
    "strategy.template.smaTrend.description": "SMA20 baseline",
    "strategy.template.rsiReversal": "RSI reversal",
    "strategy.template.rsiReversal.description": "RSI14 mean reversion",
    "strategy.template.volumeBreakout": "Volume breakout",
    "strategy.template.volumeBreakout.description": "Price strength + VOL10",
    "strategy.auditRequired": "audit required",
    "strategy.entryCondition": "Entry condition",
    "strategy.exitCondition": "Exit condition",
    "strategy.entryWindow": "Entry SMA",
    "strategy.exitWindow": "Exit SMA",
    "strategy.entryThreshold": "Entry RSI",
    "strategy.exitThreshold": "Exit RSI",
    "strategy.rsiConfirm": "RSI confirmation",
    "strategy.rsiWindow": "RSI window",
    "strategy.rsiThreshold": "RSI threshold",
    "strategy.volumeConfirm": "Volume confirmation",
    "strategy.volumeWindow": "Volume MA",
    "strategy.condition.closeAboveSma": "Close > SMA",
    "strategy.condition.closeBelowSma": "Close < SMA",
    "strategy.condition.rsiBelow": "RSI below",
    "strategy.condition.rsiAbove": "RSI above",
    "strategy.positionPct": "Position cap",
    "strategy.stopLossPct": "Stop loss",
    "strategy.takeProfitPct": "Take profit",
    "strategy.maxDrawdownPct": "Max drawdown",
    "strategy.generatedSnapshot": "Auditable snapshot",
    "strategy.readiness": "Readiness gates",
    "strategy.saveVersion": "Save version",
    "strategy.saving": "Saving",
    "strategy.library": "Strategy library",
    "strategy.libraryEmpty": "No saved strategy versions yet.",
    "strategy.loadVersion": "Load",
    "strategy.loadedVersion": "Loaded",
    "strategy.context": "Context",
    "strategy.auditRun": "Audit run",
    "strategy.diff": "Diff",
    "strategy.diffChanged": "{count} changes",
    "strategy.diffSame": "same as draft",
    "backtest.replay": "Trade replay",
    "backtest.assumptions": "Backtest assumptions",
    "backtest.parameterScan": "Parameter sensitivity",
    "backtest.entrySma": "Entry SMA",
    "backtest.exitSma": "Exit SMA",
    "backtest.stageCandidate": "Stage",
    "backtest.exportMarkdown": "Export report",
    "strategyExperiment.title": "Strategy experiments",
    "strategyExperiment.subtitle": "Persisted, holdout-safe parameter evidence",
    "strategyExperiment.run": "Run experiment",
    "strategyExperiment.running": "Running",
    "strategyExperiment.replay": "Exact replay",
    "strategyExperiment.export": "Export JSON",
    "strategyExperiment.loadDraft": "Load draft",
    "strategyExperiment.legacyReaudit": "Legacy snapshots must be re-audited by running the research pipeline again.",
    "strategyExperiment.holdoutConsumed": "The test holdout was consumed by another definition; generate a fresh audited snapshot.",
    "strategyExperiment.persistedEvidenceRequired": "Persisted experiment evidence matching the current run and strategy revision is required.",
    "strategyExperiment.train": "Train",
    "strategyExperiment.validation": "Validation",
    "strategyExperiment.test": "Test",
    "strategyExperiment.eligibility": "Eligibility",
    "strategyExperiment.budget": "Evaluation budget",
    "strategyExperiment.completed": "Completed",
    "strategyExperiment.failed": "Failed",
    "strategyExperiment.invalidDraft": "The experiment draft is invalid; review parameter bounds, guardrails, and budget.",
    "strategyExperiment.exportFailed": "Strategy experiment JSON export failed.",
    "strategyExperiment.candidateLoadFailed": "Strategy experiment candidate load failed.",
    "strategyExperiment.dimensions": "Dimensions",
    "strategyExperiment.entry": "Entry",
    "strategyExperiment.exit": "Exit",
    "strategyExperiment.value": "Value",
    "strategyExperiment.guardrails": "Guardrails",
    "strategyExperiment.minimumTrades": "Minimum trades",
    "strategyExperiment.maximumDrawdown": "Maximum drawdown",
    "strategyExperiment.walkForward": "Walk-forward evidence",
    "strategyExperiment.trainBars": "Train bars",
    "strategyExperiment.validationBars": "Validation bars",
    "strategyExperiment.stepBars": "Step bars",
    "strategyExperiment.history": "Experiment history",
    "strategyExperiment.noHistory": "No persisted experiments match the current run and revision.",
    "strategyExperiment.inspect": "Inspect",
    "strategyExperiment.detail": "Active experiment",
    "strategyExperiment.definitionHash": "Definition hash",
    "strategyExperiment.resultHash": "Result hash",
    "strategyExperiment.dataHash": "Canonical data hash",
    "strategyExperiment.holdout": "Holdout",
    "strategyExperiment.holdoutUnconsumed": "Unconsumed",
    "strategyExperiment.holdoutConsumedStatus": "Consumed by this definition",
    "strategyExperiment.holdoutConsumedOther": "Consumed by another definition",
    "strategyExperiment.selectedTestEvidence": "Selected test evidence",
    "strategyExperiment.candidate": "Candidate",
    "strategyExperiment.rank": "Rank",
    "strategyExperiment.action": "Action",
    "strategyExperiment.eligible": "Eligible",
    "strategyExperiment.ineligible": "Ineligible",
    "strategyExperiment.noCandidates": "This experiment has no persisted candidate evidence.",
    "strategyExperiment.return": "Return",
    "strategyExperiment.trades": "Trades",
    "aiReviewStage3.title": "Authoritative AI review",
    "aiReviewStage3.subtitle": "Auditable comparison of persisted strategy experiment evidence",
    "aiReviewStage3.paperBoundary": "Paper-only · live trading and order submission blocked",
    "aiReviewStage3.evidenceSelection": "Evidence selection",
    "aiReviewStage3.draftSelection": "New review draft selection",
    "aiReviewStage3.primary": "Primary experiment",
    "aiReviewStage3.noCompletedExperiment": "No completed experiment is available",
    "aiReviewStage3.comparisons": "Comparison experiments · up to 4",
    "aiReviewStage3.eligible": "Eligible comparison",
    "aiReviewStage3.reason.primary": "Already selected as primary",
    "aiReviewStage3.reason.not-completed": "Experiment is not completed",
    "aiReviewStage3.reason.context-mismatch": "Research context mismatch",
    "aiReviewStage3.reason.lineage-mismatch": "Strategy lineage mismatch",
    "aiReviewStage3.reason.already-selected": "Comparison already selected",
    "aiReviewStage3.reason.limit-reached": "Four-comparison limit reached",
    "aiReviewStage3.provider": "Review provider",
    "aiReviewStage3.configured": "configured",
    "aiReviewStage3.notConfigured": "not configured",
    "aiReviewStage3.model": "Model",
    "aiReviewStage3.baseUrl": "Sanitized Base URL",
    "aiReviewStage3.outboundFields": "Fields sent to the external provider",
    "aiReviewStage3.outbound.experimentReferences": "Experiment references and hashes",
    "aiReviewStage3.outbound.strategyDefinition": "Strategy definition",
    "aiReviewStage3.outbound.dataQuality": "Data quality summary",
    "aiReviewStage3.outbound.candidateMetrics": "Candidate metrics and evidence references",
    "aiReviewStage3.externalApproval": "I approve sending only the fields listed above to this provider.",
    "aiReviewStage3.run": "Run authoritative review",
    "aiReviewStage3.running": "Review running",
    "aiReviewStage3.currentReview": "Current authoritative review",
    "aiReviewStage3.loadedRecord": "Loaded authoritative record",
    "aiReviewStage3.deterministic": "Deterministic assessment",
    "aiReviewStage3.external": "External model assessment",
    "aiReviewStage3.external.skipped": "External assessment skipped; local deterministic evidence remains available.",
    "aiReviewStage3.external.failed": "External assessment failed; local deterministic evidence remains available.",
    "aiReviewStage3.external.completed": "External assessment completed.",
    "aiReviewStage3.external.status.skipped": "Skipped",
    "aiReviewStage3.external.status.failed": "Failed",
    "aiReviewStage3.external.status.completed": "Completed",
    "aiReviewStage3.external.error.ai_review_provider_not_configured": "Provider is not configured.",
    "aiReviewStage3.external.error.generic": "The external attempt did not produce a valid assessment.",
    "aiReviewStage3.comparisonRecords": "Comparison experiments",
    "aiReviewStage3.externalAttemptStatus": "External attempt status",
    "aiReviewStage3.evidenceHash": "Evidence hash",
    "aiReviewStage3.recordHash": "Record hash",
    "aiReviewStage3.safetyDetail": "Research evidence review only. This record cannot authorize live trading or submit orders.",
    "aiReviewStage3.decision": "Decision chain",
    "aiReviewStage3.predecessor": "Latest predecessor",
    "aiReviewStage3.noPredecessor": "none · first Decision",
    "aiReviewStage3.operator": "Operator",
    "aiReviewStage3.decisionStatus": "Decision status",
    "aiReviewStage3.rationale": "Rationale",
    "aiReviewStage3.decision.accepted_for_research": "Accepted for research",
    "aiReviewStage3.decision.revision_requested": "Revision requested",
    "aiReviewStage3.decision.rejected": "Rejected",
    "aiReviewStage3.decision.insufficient_evidence": "Insufficient evidence",
    "aiReviewStage3.appendDecision": "Append Decision",
    "aiReviewStage3.appending": "Appending",
    "aiReviewStage3.noCurrentReview": "Run or inspect an authoritative review to see its independent assessments and Decision chain.",
    "aiReviewStage3.history": "Authoritative and legacy history",
    "aiReviewStage3.authoritative": "Authoritative v2",
    "aiReviewStage3.legacyNonAuthoritative": "Legacy · non-authoritative",
    "aiReviewStage3.inspect": "Inspect",
    "aiReviewStage3.consistency": "Consistency",
    "aiReviewStage3.consistency.consistent": "Consistent",
    "aiReviewStage3.consistency.mixed": "Mixed",
    "aiReviewStage3.consistency.divergent": "Divergent",
    "aiReviewStage3.consistency.insufficient": "Insufficient",
    "aiReviewStage3.invalidationConditions": "Invalidation conditions",
    "aiReviewStage3.watchItems": "Watch items",
    "aiReviewStage3.evidenceGaps": "Evidence gaps",
    "aiReviewStage3.none": "None",
    "aiReviewStage3.severity.low": "Low",
    "aiReviewStage3.severity.medium": "Medium",
    "aiReviewStage3.severity.high": "High",
    "aiReviewStage3.severity.critical": "Critical",
    "aiReviewStage3.error.contextLoadFailed": "AI review providers or history could not be loaded.",
    "aiReviewStage3.error.runRestoreFailed": "AI review research run restore failed; linked run data was not loaded.",
    "aiReviewStage3.runRestored": "AI review research run restored",
    "aiReviewStage3.error.reviewFailed": "Authoritative AI review failed.",
    "aiReviewStage3.error.readbackInconsistent": "Authoritative AI review readback is inconsistent.",
    "aiReviewStage3.error.decisionAppendFailed": "AI review Decision append failed.",
    "aiReviewStage3.error.decisionReadbackFailed": "AI review Decision readback failed.",
    "archive.aiReview.authoritative": "Authoritative Review",
    "archive.aiReview.decision": "Decision",
    "archive.aiReview.group.authoritative": "Package authoritative Review",
    "archive.aiReview.group.decision": "Package Decision",
    "archive.aiReview.sameHash": "Same hash",
    "archive.aiReview.conflict": "Conflict",
    "aiReviewStage3.stance.supported": "Supported",
    "aiReviewStage3.stance.caution": "Caution",
    "aiReviewStage3.stance.blocked": "Blocked",
    "aiReviewStage3.stance.insufficient_evidence": "Insufficient evidence",
    "aiReview.exportMarkdown": "Export AI report",
    "aiReview.exportRecord": "Export run record",
    "aiReview.saveRecord": "Save record",
    "aiReview.savingRecord": "Saving",
    "aiReview.savedRecords": "Saved review records",
    "aiReview.noSavedRecords": "No saved AI review records",
    "aiReview.noSavedRecordsDetail": "Save the current audited review so replay and risk approval can cite the same evidence package.",
    "aiReview.citations": "citations",
    "aiReview.rounds": "rounds",
    "aiReview.boundary": "evidence only",
    "backtest.initialCash": "Initial cash",
    "backtest.feeBps": "Fee",
    "backtest.slippageBps": "Slippage",
    "backtest.time": "Time",
    "backtest.exposure": "Exposure",
    "backtest.pnl": "P&L",
    "execution.accountSync": "Account Sync",
    "execution.paperAccount": "paper account",
    "execution.positions": "Positions",
    "execution.positionsValue": "4 watched / 0 live",
    "execution.riskState": "Risk State",
    "execution.liveBlocked": "live blocked",
    "execution.paperBlotter": "Paper blotter",
    "execution.submitPaper": "Submit paper order",
    "execution.side": "Side",
    "execution.quantity": "Qty",
    "execution.price": "Price",
    "execution.notional": "Notional",
    "execution.status": "Status",
    "execution.reason": "Reason",
    "empty.noAuditedRuns": "No audited runs",
    "aiAction.debate": "Run agent debate",
    "aiAction.explain": "Explain backtest",
    "aiAction.strategyDraft": "Generate strategy draft",
    "safety.footer": "Live execution requires adapter certification, risk approval, and human confirmation."
  },
  "zh-CN": {
    "language.zh": "中文",
    "language.en": "EN",
    "language.zh.label": "简体中文",
    "language.en.label": "English",
    "aria.language": "语言",
    "aria.timeframe": "研究周期",
    "aria.symbolSwitcher": "标的切换",
    "brand.subtitle": "本地优先量化系统",
    "section.quantLoop": "研究工作流",
    "section.terminalModules": "终端模块",
    "section.auditTrail": "审计轨迹",
    "topbar.eyebrow": "专业量化工作台",
    "symbol.market": "市场",
    "symbol.placeholder": "输入股票/币对代码",
    "symbol.searching": "搜索中",
    "symbol.noResults": "没有匹配标的",
    "symbol.source": "来源",
    "action.switchSymbol": "查询",
    "action.saveWatchlist": "保存自选",
    "action.saveWatchlistChanges": "保存自选变更",
    "watchlist.unsaved": "未保存",
    "watchlist.saved": "已保存",
    "watchlist.unsavedDetail": "当前标的已加入本地自选，但尚未持久化保存。",
    "watchlist.savedDetail": "当前自选列表已保存到本地核心服务。",
    "action.saveResearchWorkspace": "保存工作区",
    "action.saveResearchWorkspaceChanges": "保存工作区变更",
    "action.copyResearchContextLink": "复制研究链接",
    "action.researchContextLinkCopied": "链接已复制",
    "researchWorkspace.unsaved": "未保存",
    "researchWorkspace.saved": "已保存",
    "researchWorkspace.unsavedDetail": "当前 Stage 1 市场、标的、周期或入口工作区尚未持久化保存。",
    "researchWorkspace.savedDetail": "当前 Stage 1 研究工作区上下文已保存到本地核心服务。",
    "action.runPipeline": "运行流水线",
    "p0Journey.title": "P0 黄金路径",
    "p0Journey.subtitle": "从数据到纸面盘回放的一条主线",
    "p0Journey.current": "当前",
    "p0Journey.done": "完成",
    "p0Journey.blocked": "阻断",
    "p0Journey.ready": "就绪",
    "p0Journey.action": "运行下一步",
    "p0Journey.boundary": "仅纸面盘 · 实盘阻断",
    "moduleFocus.label": "当前任务",
    "moduleFocus.instrument": "标的",
    "panel.chart.title": "图表与因子叠加",
    "panel.chart.subtitle": "价格 · SMA20 · 交易 · {timeframe}",
    "chart.noData": "暂无 K 线数据",
    "chart.symbol": "标的",
    "chart.latestClose": "收盘",
    "chart.asOf": "日期",
    "chart.expand": "放大图表",
    "chart.closeExpanded": "关闭放大图表",
    "chart.source": "数据源",
    "chart.bars": "{count} 根K线",
    "panel.strategy.title": "策略快照",
    "panel.backtest.title": "回测回放",
    "panel.backtest.subtitle": "成交审计 · 回撤 · 出场复盘",
    "panel.nodeWorkflow.title": "节点工作流",
    "panel.nodeWorkflow.subtitle": "可视化流水线",
    "panel.execution.title": "执行中心",
    "panel.execution.subtitle": "模拟优先 · 实盘需认证",
    "panel.agent.title": "智能体委员会",
    "panel.agent.subtitle": "TradingAgents 风格评审",
    "panel.agentRoles.title": "智能体角色",
    "panel.agentRoles.subtitle": "当前研究分工",
    "panel.agent.rounds": "委员会轮次",
    "panel.agent.evidence": "证据摘要",
    "panel.decision.title": "决策日志",
    "panel.decision.subtitle": "可追踪 AI 研究",
    "panel.history.title": "运行历史",
    "panel.history.subtitle": "近期审计运行",
    "history.replay": "回放",
    "history.export": "导出",
    "history.import": "导入",
    "history.active": "当前运行",
    "history.rows": "{count} 根K线",
    "history.revision": "版本",
    "history.execution": "执行",
    "history.comparison": "运行对比",
    "history.current": "当前",
    "history.previous": "上次",
    "history.delta": "变化",
    "history.changed": "已变化",
    "history.unchanged": "未变化",
    "panel.aiActions.title": "AI 操作",
    "panel.aiActions.subtitle": "结构化，而不是泛聊天",
    "module.scanner.title": "市场扫描器",
    "module.scanner.subtitle": "基于当前自选和报价上下文派生",
    "module.scanner.filters": "筛选器",
    "module.scanner.results": "候选标的",
    "module.scanner.score": "评分",
    "module.scanner.signal": "信号",
    "module.scanner.risk": "风险",
    "module.scanner.research": "研究",
    "module.portfolio.title": "组合风险",
    "module.portfolio.subtitle": "模拟盘暴露和实盘闸门",
    "portfolio.paperPositions": "模拟持仓",
    "portfolio.avgCost": "成本",
    "portfolio.markPrice": "现价",
    "portfolio.marketValue": "市值",
    "portfolio.unrealizedPnl": "未实现盈亏",
    "portfolio.returnPct": "收益率",
    "portfolio.backtest": "组合回测",
    "portfolio.backtestRun": "运行组合回测",
    "portfolio.backtestRunning": "运行中",
    "portfolio.exportMarkdown": "导出报告",
    "portfolio.recordPaperOrders": "入账委托",
    "portfolio.recordPaperOrdersRunning": "入账中",
    "portfolio.backtestDraft": "组合腿草稿",
    "portfolio.backtestResult": "回测结果",
    "portfolio.backtestNoResult": "运行组合回测后查看组合收益、回撤和各腿贡献。",
    "portfolio.peerAudits": "对照审计",
    "portfolio.peerAuditsRun": "生成对照审计",
    "portfolio.peerAuditsRunning": "生成中",
    "portfolio.peerAudited": "已审计",
    "portfolio.peerMissing": "待生成",
    "portfolio.weight": "权重",
    "portfolio.cash": "现金",
    "portfolio.totalReturn": "总收益",
    "portfolio.maxDrawdown": "最大回撤",
    "portfolio.tradeCount": "交易数",
    "portfolio.contribution": "贡献",
    "portfolio.dataRows": "权益点",
    "portfolio.diagnostics": "组合诊断",
    "portfolio.allocationLedger": "分配流水",
    "portfolio.allocationAllocate": "配置",
    "portfolio.allocationCashBuffer": "现金缓冲",
    "portfolio.sourceRun": "来源运行",
    "portfolio.notional": "名义金额",
    "portfolio.rebalanceReviewLedger": "再平衡复核",
    "portfolio.endingWeight": "期末权重",
    "portfolio.deltaValue": "偏离金额",
    "portfolio.rebalanceBlocked": "阻断",
    "portfolio.rebalanceReview": "复核",
    "portfolio.rebalanceWithinBand": "阈内",
    "portfolio.tradeReviewLedger": "交易复核",
    "portfolio.tradeReviewBlocked": "阻断",
    "portfolio.tradeReviewPaperReview": "模拟复核",
    "portfolio.tradeReviewNoAction": "无操作",
    "portfolio.tradeSideBuy": "买入",
    "portfolio.tradeSideSell": "卖出",
    "portfolio.tradeSideHold": "持有",
    "portfolio.preTradeRiskChecks": "交易前风控",
    "portfolio.preTradeRiskValue": "检查值",
    "portfolio.preTradeRiskLimit": "阈值",
    "portfolio.scopePortfolio": "组合",
    "portfolio.preTradeRiskPassed": "通过",
    "portfolio.preTradeRiskReview": "复核",
    "portfolio.preTradeRiskBlocked": "阻断",
    "portfolio.preTradeRiskDataQuality": "数据质量",
    "portfolio.preTradeRiskTradeStatus": "意图状态",
    "portfolio.preTradeRiskNotional": "名义金额",
    "portfolio.paperOrderEvents": "组合模拟委托",
    "portfolio.paperOrderPendingReview": "待复核",
    "portfolio.paperOrderRejected": "已拒绝",
    "portfolio.paperOrderSkipped": "已跳过",
    "portfolio.paperOrderHistory": "委托入账批次",
    "portfolio.paperOrderBatch": "批次",
    "portfolio.paperOrderCount": "委托数",
    "portfolio.paperOrderRecorded": "已入账",
    "portfolio.riskStatus": "风控状态",
    "portfolio.stage4.eyebrow": "Stage 4 · 组合模拟工作流",
    "portfolio.stage4.title": "组合黄金路径",
    "portfolio.stage4.subtitle": "用唯一入口完成组合构建、风控复核、操作人审批、模拟成交与账户回放。",
    "portfolio.stage4.boundary": "仅限模拟盘 · 禁止实盘交易、券商下单和订单提交",
    "portfolio.stage4.step.portfolioBuild": "组合构建",
    "portfolio.stage4.step.riskReview": "风控复核",
    "portfolio.stage4.step.operatorApproval": "操作人审批",
    "portfolio.stage4.step.paperSimulation": "模拟成交",
    "portfolio.stage4.step.accountReplay": "账户回放",
    "portfolio.stage4.step.unknown": "工作流步骤",
    "portfolio.stage4.passed": "已完成",
    "portfolio.stage4.pending": "待处理",
    "portfolio.stage4.busy": "当前模拟盘动作仍在执行。",
    "portfolio.stage4.action.runBacktest": "运行组合回测",
    "portfolio.stage4.action.recordBatch": "入账模拟委托批次",
    "portfolio.stage4.action.reviewRisk": "复核组合风控",
    "portfolio.stage4.action.reviewOrders": "打开操作人审批",
    "portfolio.stage4.action.reviewRouteRisk": "复核路由风控",
    "portfolio.stage4.action.simulateBatch": "批量模拟成交",
    "portfolio.stage4.action.refreshReplay": "刷新账户回放",
    "portfolio.stage4.action.recordWorkflow": "入账权威工作流",
    "portfolio.stage4.blocker.portfolioMissing": "请先运行组合回测。",
    "portfolio.stage4.blocker.batchMissing": "模拟委托批次尚未入账。",
    "portfolio.stage4.blocker.riskRejected": "组合风控依据已拒绝该批次。",
    "portfolio.stage4.blocker.riskReview": "组合风控仍需复核。",
    "portfolio.stage4.blocker.mixedBatch": "当前批次混入了其他批次的依据。",
    "portfolio.stage4.blocker.operatorRejected": "操作人已拒绝该批次中的委托。",
    "portfolio.stage4.blocker.operatorApproval": "委托尚未完成操作人审批。",
    "portfolio.stage4.blocker.routeRisk": "模拟路由风控已阻断该批次。",
    "portfolio.stage4.blocker.simulationMissing": "模拟成交依据尚不完整。",
    "portfolio.stage4.blocker.replayMissing": "账户状态历史或回放依据尚不完整。",
    "portfolio.stage4.blocker.workflowMissing": "请入账 Stage 4 权威工作流。",
    "portfolio.stage4.blocker.staleRun": "恢复的依据属于其他基础运行。",
    "portfolio.stage4.evidence": "权威证据",
    "portfolio.stage4.workflowId": "工作流 ID",
    "portfolio.stage4.workflowHash": "工作流哈希",
    "portfolio.stage4.safety": "本工作流不提供任何实盘交易或券商动作。",
    "execution.stage5.eyebrow": "Stage 5 · Shadow Execution",
    "execution.stage5.title": "Shadow 执行操作台",
    "execution.stage5.subtitle": "将 Stage 4 权威工作流投影到隔离的本地适配器，并从持久化证据恢复。",
    "execution.stage5.boundary": "仅限 Shadow · 不连接券商、不访问账户、不路由订单",
    "execution.stage5.start": "启动 Shadow 验证",
    "execution.stage5.retry": "重试超时 Shadow",
    "execution.stage5.readinessAction": "生成 Sandbox 准入决策",
    "execution.stage5.authorizationPreflightAction": "生成 Sandbox 授权预检",
    "execution.stage5.authorizationReviewAction": "记录 Sandbox 授权复核",
    "execution.stage5.authorizationReviewOutcome": "复核结论",
    "execution.stage5.authorizationReviewApproved": "批准材料复核",
    "execution.stage5.authorizationReviewRejected": "拒绝材料复核",
    "execution.stage5.authorizationReviewReason": "复核原因",
    "execution.stage5.busy": "Shadow 验证正在运行。",
    "execution.stage5.workflowMissing": "请先入账 Stage 4 权威工作流。",
    "execution.stage5.sessionBlocked": "Shadow session 已阻断，请复核持久化证据。",
    "execution.stage5.probeMissing": "请先在设置中完成与当前准入决策匹配的服务端权威只读探针和人工复核。",
    "execution.stage5.openProbeSettings": "打开只读探针设置",
    "execution.stage5.status": "状态",
    "execution.stage5.attempt": "尝试次数",
    "execution.stage5.adapter": "适配器",
    "execution.stage5.failureMode": "故障模式",
    "execution.stage5.limits": "最大委托数 / 总名义金额",
    "execution.stage5.timeout": "超时 / 最大尝试次数",
    "execution.stage5.killSwitch": "Kill switch 启用 / 触发",
    "execution.stage5.reconciliation": "对账",
    "execution.stage5.sessionHash": "Session 哈希",
    "execution.stage5.orders": "Shadow 委托证据",
    "execution.stage5.safety": "paperOnly=true · shadowOnly=true · 实盘与订单路由已阻断",
    "execution.stage5.readinessTitle": "Sandbox 准入决策",
    "execution.stage5.readinessBoundary": "仍禁止 Sandbox 下单 · 必须经过后续独立人工授权",
    "execution.stage5.authorizationPreflightTitle": "Sandbox 授权预检",
    "execution.stage5.authorizationPreflightBoundary": "材料仅可提交独立人工授权 · Sandbox 与实盘订单仍被禁止",
    "execution.stage5.authorizationReviewTitle": "Sandbox 授权复核",
    "execution.stage5.authorizationReviewBoundary": "复核已入账 · 授权未生效 · Sandbox 与实盘订单仍被禁止",
    "execution.stage5.exitTitle": "Stage 5 顶层退出验收",
    "execution.stage5.exitUnavailable": "退出证据尚不可用",
    "execution.stage5.exitBoundary": "Stage 5 已进入维护 · Sandbox 与实盘订单路由继续阻断",
    "module.broker.title": "券商中心",
    "module.broker.subtitle": "适配器认证与实盘闸门",
    "broker.adapter": "适配器",
    "broker.market": "市场",
    "broker.route": "通道",
    "broker.status": "状态",
    "broker.certification": "认证状态",
    "broker.nextStep": "下一步",
    "module.news.title": "新闻事件",
    "module.news.subtitle": "行情、审计、风控与 AI 上下文",
    "module.news.context": "本地证据流",
    "module.workflow.title": "节点工作流",
    "module.workflow.subtitle": "A+C 编排入口",
    "module.workflow.canvas": "节点画布",
    "module.workflow.output": "输出",
    "module.workflow.artifacts": "节点产物",
    "module.workflow.log": "运行日志",
    "module.workflow.idle": "尚未运行工作流",
    "module.workflow.run": "运行流水线",
    "strategy.name": "名称",
    "strategy.entry": "入场",
    "strategy.exit": "出场",
    "strategy.position": "仓位",
    "strategy.risk": "风控",
    "strategy.rules": "规则矩阵",
    "strategy.condition": "条件",
    "strategy.parameter": "参数",
    "strategy.status": "状态",
    "strategy.builder": "结构化构建器",
    "strategy.templates": "策略模板",
    "strategy.template.smaTrend": "SMA 趋势",
    "strategy.template.smaTrend.description": "SMA20 趋势基线",
    "strategy.template.rsiReversal": "RSI 反转",
    "strategy.template.rsiReversal.description": "RSI14 均值回归",
    "strategy.template.volumeBreakout": "放量突破",
    "strategy.template.volumeBreakout.description": "价格强度 + VOL10",
    "strategy.auditRequired": "待审计",
    "strategy.entryCondition": "入场条件",
    "strategy.exitCondition": "出场条件",
    "strategy.entryWindow": "入场 SMA",
    "strategy.exitWindow": "出场 SMA",
    "strategy.entryThreshold": "入场 RSI",
    "strategy.exitThreshold": "出场 RSI",
    "strategy.rsiConfirm": "RSI 确认",
    "strategy.rsiWindow": "RSI 窗口",
    "strategy.rsiThreshold": "RSI 阈值",
    "strategy.volumeConfirm": "成交量确认",
    "strategy.volumeWindow": "成交量均线",
    "strategy.condition.closeAboveSma": "收盘价 > SMA",
    "strategy.condition.closeBelowSma": "收盘价 < SMA",
    "strategy.condition.rsiBelow": "RSI 低于",
    "strategy.condition.rsiAbove": "RSI 高于",
    "strategy.positionPct": "仓位上限",
    "strategy.stopLossPct": "止损",
    "strategy.takeProfitPct": "止盈",
    "strategy.maxDrawdownPct": "最大回撤",
    "strategy.generatedSnapshot": "可审计快照",
    "strategy.readiness": "就绪闸门",
    "strategy.saveVersion": "保存版本",
    "strategy.saving": "保存中",
    "strategy.library": "策略库",
    "strategy.libraryEmpty": "还没有保存的策略版本。",
    "strategy.loadVersion": "载入",
    "strategy.loadedVersion": "已载入",
    "strategy.context": "上下文",
    "strategy.auditRun": "审计运行",
    "strategy.diff": "差异",
    "strategy.diffChanged": "{count} 项差异",
    "strategy.diffSame": "与草稿一致",
    "backtest.replay": "交易回放",
    "backtest.assumptions": "回测假设",
    "backtest.parameterScan": "参数敏感性",
    "backtest.entrySma": "入场 SMA",
    "backtest.exitSma": "出场 SMA",
    "backtest.stageCandidate": "暂存",
    "backtest.exportMarkdown": "导出报告",
    "strategyExperiment.title": "策略实验",
    "strategyExperiment.subtitle": "持久化且留出集安全的参数依据",
    "strategyExperiment.run": "运行实验",
    "strategyExperiment.running": "运行中",
    "strategyExperiment.replay": "精确重放",
    "strategyExperiment.export": "导出 JSON",
    "strategyExperiment.loadDraft": "载入草稿",
    "strategyExperiment.legacyReaudit": "旧版快照需要重新运行研究流水线后才能实验。",
    "strategyExperiment.holdoutConsumed": "测试留出集已被另一实验定义使用，请生成新的审计快照。",
    "strategyExperiment.persistedEvidenceRequired": "需要与当前运行和策略版本匹配的持久化实验依据。",
    "strategyExperiment.train": "训练集",
    "strategyExperiment.validation": "验证集",
    "strategyExperiment.test": "测试集",
    "strategyExperiment.eligibility": "资格",
    "strategyExperiment.budget": "评估预算",
    "strategyExperiment.completed": "已完成",
    "strategyExperiment.failed": "失败",
    "strategyExperiment.invalidDraft": "实验配置无效，请检查参数范围、保护条件和评估预算。",
    "strategyExperiment.exportFailed": "实验 JSON 导出失败。",
    "strategyExperiment.candidateLoadFailed": "候选草稿载入失败。",
    "strategyExperiment.dimensions": "参数维度",
    "strategyExperiment.entry": "入场",
    "strategyExperiment.exit": "出场",
    "strategyExperiment.value": "取值",
    "strategyExperiment.guardrails": "保护条件",
    "strategyExperiment.minimumTrades": "最少交易数",
    "strategyExperiment.maximumDrawdown": "最大回撤",
    "strategyExperiment.walkForward": "滚动前推依据",
    "strategyExperiment.trainBars": "训练 K 线数",
    "strategyExperiment.validationBars": "验证 K 线数",
    "strategyExperiment.stepBars": "步进 K 线数",
    "strategyExperiment.history": "实验历史",
    "strategyExperiment.noHistory": "当前运行和版本还没有匹配的持久化实验。",
    "strategyExperiment.inspect": "查看",
    "strategyExperiment.detail": "当前实验",
    "strategyExperiment.definitionHash": "定义哈希",
    "strategyExperiment.resultHash": "结果哈希",
    "strategyExperiment.dataHash": "规范数据哈希",
    "strategyExperiment.holdout": "留出集",
    "strategyExperiment.holdoutUnconsumed": "未使用",
    "strategyExperiment.holdoutConsumedStatus": "已由当前定义使用",
    "strategyExperiment.holdoutConsumedOther": "已由其他定义使用",
    "strategyExperiment.selectedTestEvidence": "已选测试依据",
    "strategyExperiment.candidate": "候选",
    "strategyExperiment.rank": "排名",
    "strategyExperiment.action": "动作",
    "strategyExperiment.eligible": "符合条件",
    "strategyExperiment.ineligible": "不符合条件",
    "strategyExperiment.noCandidates": "该实验没有持久化候选依据。",
    "strategyExperiment.return": "收益率",
    "strategyExperiment.trades": "交易数",
    "aiReviewStage3.title": "权威 AI 评审",
    "aiReviewStage3.subtitle": "对持久化策略实验依据进行可审计对比",
    "aiReviewStage3.paperBoundary": "仅模拟盘 · 实盘交易与订单提交保持阻断",
    "aiReviewStage3.evidenceSelection": "依据选择",
    "aiReviewStage3.draftSelection": "新评审草稿选择",
    "aiReviewStage3.primary": "主实验",
    "aiReviewStage3.noCompletedExperiment": "暂无可用的已完成实验",
    "aiReviewStage3.comparisons": "对比实验 · 最多 4 个",
    "aiReviewStage3.eligible": "可用于对比",
    "aiReviewStage3.reason.primary": "已作为主实验",
    "aiReviewStage3.reason.not-completed": "实验尚未完成",
    "aiReviewStage3.reason.context-mismatch": "研究上下文不一致",
    "aiReviewStage3.reason.lineage-mismatch": "策略谱系不一致",
    "aiReviewStage3.reason.already-selected": "已选择该对比实验",
    "aiReviewStage3.reason.limit-reached": "已达到 4 个对比实验上限",
    "aiReviewStage3.provider": "评审 Provider",
    "aiReviewStage3.configured": "已配置",
    "aiReviewStage3.notConfigured": "未配置",
    "aiReviewStage3.model": "模型",
    "aiReviewStage3.baseUrl": "已脱敏 Base URL",
    "aiReviewStage3.outboundFields": "发送给外部 Provider 的字段",
    "aiReviewStage3.outbound.experimentReferences": "实验引用与哈希",
    "aiReviewStage3.outbound.strategyDefinition": "策略定义",
    "aiReviewStage3.outbound.dataQuality": "数据质量摘要",
    "aiReviewStage3.outbound.candidateMetrics": "候选指标与依据引用",
    "aiReviewStage3.externalApproval": "我确认仅向该 Provider 发送上方列出的字段。",
    "aiReviewStage3.run": "运行权威评审",
    "aiReviewStage3.running": "评审运行中",
    "aiReviewStage3.currentReview": "当前权威评审",
    "aiReviewStage3.loadedRecord": "已加载权威记录",
    "aiReviewStage3.deterministic": "确定性评估",
    "aiReviewStage3.external": "外部模型评估",
    "aiReviewStage3.external.skipped": "未运行外部评估；本地确定性依据仍可用。",
    "aiReviewStage3.external.failed": "外部评估失败；本地确定性依据仍可用。",
    "aiReviewStage3.external.completed": "外部评估已完成。",
    "aiReviewStage3.external.status.skipped": "已跳过",
    "aiReviewStage3.external.status.failed": "失败",
    "aiReviewStage3.external.status.completed": "已完成",
    "aiReviewStage3.external.error.ai_review_provider_not_configured": "Provider 尚未配置。",
    "aiReviewStage3.external.error.generic": "外部尝试未生成有效评估。",
    "aiReviewStage3.comparisonRecords": "对比实验",
    "aiReviewStage3.externalAttemptStatus": "外部尝试状态",
    "aiReviewStage3.evidenceHash": "依据哈希",
    "aiReviewStage3.recordHash": "记录哈希",
    "aiReviewStage3.safetyDetail": "仅用于研究依据评审。本记录不能授权实盘交易或提交订单。",
    "aiReviewStage3.decision": "Decision 追加链",
    "aiReviewStage3.predecessor": "最新前序记录",
    "aiReviewStage3.noPredecessor": "无 · 第一条 Decision",
    "aiReviewStage3.operator": "操作人",
    "aiReviewStage3.decisionStatus": "Decision 状态",
    "aiReviewStage3.rationale": "理由",
    "aiReviewStage3.decision.accepted_for_research": "接受并用于研究",
    "aiReviewStage3.decision.revision_requested": "要求修订",
    "aiReviewStage3.decision.rejected": "拒绝",
    "aiReviewStage3.decision.insufficient_evidence": "依据不足",
    "aiReviewStage3.appendDecision": "追加 Decision",
    "aiReviewStage3.appending": "追加中",
    "aiReviewStage3.noCurrentReview": "运行或查看一条权威评审后，可查看独立评估与 Decision 追加链。",
    "aiReviewStage3.history": "权威与旧版历史",
    "aiReviewStage3.authoritative": "权威 v2",
    "aiReviewStage3.legacyNonAuthoritative": "旧版 · 非权威记录",
    "aiReviewStage3.inspect": "查看",
    "aiReviewStage3.consistency": "一致性",
    "aiReviewStage3.consistency.consistent": "一致",
    "aiReviewStage3.consistency.mixed": "混合",
    "aiReviewStage3.consistency.divergent": "分歧",
    "aiReviewStage3.consistency.insufficient": "不足",
    "aiReviewStage3.invalidationConditions": "失效条件",
    "aiReviewStage3.watchItems": "观察项",
    "aiReviewStage3.evidenceGaps": "依据缺口",
    "aiReviewStage3.none": "无",
    "aiReviewStage3.severity.low": "低",
    "aiReviewStage3.severity.medium": "中",
    "aiReviewStage3.severity.high": "高",
    "aiReviewStage3.severity.critical": "严重",
    "aiReviewStage3.error.contextLoadFailed": "AI 评审 Provider 或历史加载失败。",
    "aiReviewStage3.error.runRestoreFailed": "AI 评审研究运行恢复失败，未加载链接中的运行数据。",
    "aiReviewStage3.runRestored": "AI 评审研究运行已恢复",
    "aiReviewStage3.error.reviewFailed": "权威 AI 评审失败。",
    "aiReviewStage3.error.readbackInconsistent": "权威 AI 评审回读不一致。",
    "aiReviewStage3.error.decisionAppendFailed": "AI 评审 Decision 追加失败。",
    "aiReviewStage3.error.decisionReadbackFailed": "AI 评审 Decision 回读失败。",
    "archive.aiReview.authoritative": "权威评审",
    "archive.aiReview.decision": "Decision",
    "archive.aiReview.group.authoritative": "包内权威评审",
    "archive.aiReview.group.decision": "包内 Decision",
    "archive.aiReview.sameHash": "Hash 一致",
    "archive.aiReview.conflict": "冲突",
    "aiReviewStage3.stance.supported": "支持",
    "aiReviewStage3.stance.caution": "谨慎",
    "aiReviewStage3.stance.blocked": "阻断",
    "aiReviewStage3.stance.insufficient_evidence": "依据不足",
    "aiReview.exportMarkdown": "导出 AI 报告",
    "aiReview.exportRecord": "导出运行记录",
    "aiReview.saveRecord": "保存运行记录",
    "aiReview.savingRecord": "保存中",
    "aiReview.savedRecords": "已保存评审记录",
    "aiReview.noSavedRecords": "暂无已保存 AI 评审记录",
    "aiReview.noSavedRecordsDetail": "保存当前审计评审后，回放和风控审批可以引用同一份证据包。",
    "aiReview.citations": "条引用",
    "aiReview.rounds": "轮",
    "aiReview.boundary": "仅解释证据",
    "backtest.initialCash": "初始资金",
    "backtest.feeBps": "手续费",
    "backtest.slippageBps": "滑点",
    "backtest.time": "时间",
    "backtest.exposure": "暴露",
    "backtest.pnl": "盈亏",
    "execution.accountSync": "账户同步",
    "execution.paperAccount": "模拟账户",
    "execution.positions": "持仓",
    "execution.positionsValue": "4 个观察 / 0 个实盘",
    "execution.riskState": "风控状态",
    "execution.liveBlocked": "实盘已阻断",
    "execution.paperBlotter": "模拟委托流水",
    "execution.submitPaper": "提交模拟委托",
    "execution.side": "方向",
    "execution.quantity": "数量",
    "execution.price": "价格",
    "execution.notional": "名义金额",
    "execution.status": "状态",
    "execution.reason": "原因",
    "empty.noAuditedRuns": "暂无审计运行",
    "aiAction.debate": "运行智能体辩论",
    "aiAction.explain": "解释回测",
    "aiAction.strategyDraft": "生成策略草稿",
    "safety.footer": "实盘执行必须通过适配器认证、风控审批和人工确认。"
  }
} as const;

const labelMaps: Record<Locale, LocalizedLabelMap> = {
  "en-US": {
    markets: {
      ashare: "A-share",
      us: "US",
      crypto: "Crypto"
    },
    productWorkAreas: {
      market: "Market Center",
      research: "Research Terminal",
      strategy: "Strategy Lab",
      backtest: "Backtest Lab",
      "ai-review": "AI Review Board",
      portfolio: "Portfolio & Risk",
      execution: "Execution Center",
      operations: "Operations",
      audit: "Audit & Replay",
      settings: "Settings"
    },
    productWorkAreaDescriptions: {
      market: "Search, quotes, K-lines, source health",
      research: "Chart, factors, notes, context",
      strategy: "Rules, versions, risk configuration",
      backtest: "Assumptions, trades, reproducible run",
      "ai-review": "Evidence-locked agent committee",
      portfolio: "Exposure, positions, live gates",
      execution: "Paper orders and adapter readiness",
      operations: "Data maintenance, research queue, scanners, evidence",
      audit: "Run history, import, export, replay",
      settings: "Data sources, API keys, safety gates"
    },
    productWorkAreaStatuses: {
      ready: "Ready",
      needs_run: "Run",
      blocked: "Blocked"
    },
    productDevelopmentStages: {
      foundation: "Stage 0 · Foundation",
      "market-research": "Stage 1 · Market and Research",
      "strategy-backtest": "Stage 2 · Strategy and Backtest",
      "ai-review": "Stage 3 · AI Review",
      "portfolio-paper": "Stage 4 · Portfolio and Paper",
      "live-readiness": "Stage 5 · Live Readiness",
      "sandbox-execution": "Stage 6 · Sandbox Execution",
      "production-readonly-admission": "Stage 7 · Production Read-only Admission",
      "production-readonly-continuity": "Stage 8 · Production Read-only Continuity",
      "production-order-admission": "Stage 9 · Production Order Admission"
    },
    productDevelopmentStageStatuses: {
      maintenance: "Maintenance",
      current: "Current",
      planned: "Planned"
    },
    quantLoop: {
      research: "Market Research",
      idea: "Idea Lab",
      data: "Data & Factor",
      strategy: "Strategy Lab",
      backtest: "Backtest Review",
      "agent-review": "Agent Review",
      paper: "Paper Trading",
      broker: "Broker Center"
    },
    modules: {
      watchlist: "Watchlist",
      scanner: "Market Scanner",
      portfolio: "Portfolio Risk",
      news: "News & Events",
      broker: "Broker Center",
      workflow: "Node Workflow"
    },
    agents: {
      technical: "Technical Analyst",
      fundamental: "Fundamental Analyst",
      news: "News Analyst",
      sentiment: "Sentiment Analyst",
      bull: "Bull Researcher",
      bear: "Bear Researcher",
      risk: "Risk Manager",
      portfolio: "Portfolio Manager"
    },
    workflowNodes: {
      data: ["Data", "AKShare / yfinance / ccxt"],
      factor: ["Factor", "SMA / RSI / custom"],
      backtest: ["Backtest", "fees / slippage / replay"],
      agent: ["Agent", "debate / risk / report"],
      execution: ["Execution", "paper / certified live"]
    },
    moduleFocus: {
      watchlist: "Watchlist is bound to {symbol}; chart and research pipeline use this context.",
      scanner: "Scanner is focused on {market} candidates while the chart stays on {symbol}.",
      portfolio: "Portfolio risk is scoped to paper exposure and gates for {symbol}.",
      news: "News and event agents are scoped to local quote, audit, risk, and AI evidence for {symbol}.",
      broker: "Broker adapters stay blocked until certification, risk checks, and human confirmation pass.",
      workflow: "Node workflow is staging data, factor, backtest, agent review, and execution for {symbol}."
    },
    quantLoopFocus: {
      research: "Load quotes and inspect the chart before promoting {symbol} into a strategy.",
      idea: "Capture the research hypothesis for {symbol}.",
      data: "Prepare market data, factors, and quality checks for {symbol}.",
      strategy: "Configure rules and ask the AI committee to draft improvements for {symbol}.",
      backtest: "Run an audited replay, compare history, and explain the result for {symbol}.",
      "agent-review": "Ask the AI committee to explain results and risks from supplied data only.",
      paper: "Route validated ideas into paper trading and risk logs.",
      broker: "Live broker adapters stay locked until certification and human confirmation."
    },
    gates: {
      "adapter-certified": "Adapter certified",
      "risk-approved": "Risk approved",
      "human-confirmed": "Human confirmed"
    },
    metrics: {
      Return: "Return",
      "Max DD": "Max DD",
      "Win Rate": "Win Rate",
      Trades: "Trades"
    },
    statuses: {
      "Offline snapshot": "Offline snapshot",
      "Core connected": "Core connected",
      "Research run complete": "Research run complete",
      "Research run failed": "Research run failed",
      "Audit replay loaded": "Audit replay loaded",
      "Strategy version saved": "Strategy version saved",
      "Strategy version save failed": "Strategy version save failed",
      "Strategy version loaded": "Strategy version loaded",
      "Research run export ready": "Research run export ready",
      "Research run export failed": "Research run export failed",
      "Research run export package loaded": "Research run export package loaded",
      "Research run export inspect failed": "Research run export inspect failed",
      "Research run export index loaded": "Research run export index loaded",
      "Research run export index partial": "Research run export index partially loaded",
      "Research run export index empty": "Research run export index empty",
      "Research run import preview ready": "Research run import preview ready",
      "Research run import preview cancelled": "Research run import preview cancelled",
      "Research run import ready": "Research run import ready",
      "Research run import failed": "Research run import failed",
      "Backtest report export ready": "Backtest report export ready",
      "Backtest report export failed": "Backtest report export failed",
      "Parameter candidate staged": "Parameter candidate staged",
      "AI review export ready": "AI review export ready",
      "AI review export failed": "AI review export failed",
      "AI review record saved": "AI review record saved",
      "AI review record save failed": "AI review record save failed",
      "AI review records loaded": "AI review records loaded",
      "Adapter paper execution recorded": "Adapter paper execution recorded",
      "Adapter paper execution blocked": "Adapter paper execution blocked",
      "Adapter paper execution failed": "Adapter paper execution failed",
      "Adapter paper execution reused": "Adapter paper execution reused",
      "Paper execution recorded": "Paper execution recorded",
      "Paper execution failed": "Paper execution failed",
      "Paper execution history loaded": "Paper execution history loaded",
      "Instrument selected": "Instrument selected",
      "Watchlist saved": "Watchlist saved",
      "Watchlist save failed": "Watchlist save failed",
      "Timeframe selected": "Timeframe selected",
      "Strategy edited": "Strategy edited",
      "Backtest assumptions edited": "Backtest assumptions edited",
      "AI action generated": "AI action generated"
    },
    executionModes: {
      paper_only: "Paper only",
      certified_live: "Certified live",
      blocked_live: "Blocked live"
    }
  },
  "zh-CN": {
    markets: {
      ashare: "A 股",
      us: "美股",
      crypto: "加密货币"
    },
    productWorkAreas: {
      market: "行情中心",
      research: "研究工作台",
      strategy: "策略工坊",
      backtest: "回测实验室",
      "ai-review": "AI 评审",
      portfolio: "组合风控",
      execution: "执行中心",
      operations: "运行管理",
      audit: "审计回放",
      settings: "设置"
    },
    productWorkAreaDescriptions: {
      market: "搜索、报价、K线、数据源健康",
      research: "图表、因子、笔记、研究上下文",
      strategy: "规则、版本、风控配置",
      backtest: "假设、交易流水、可复现运行",
      "ai-review": "绑定证据的智能体委员会",
      portfolio: "敞口、持仓、实盘闸门",
      execution: "模拟委托和适配器状态",
      operations: "数据维护、研究队列、市场扫描、运行证据",
      audit: "运行历史、导入、导出、回放",
      settings: "数据源、API Key、安全闸门"
    },
    productWorkAreaStatuses: {
      ready: "就绪",
      needs_run: "待运行",
      blocked: "阻断"
    },
    productDevelopmentStages: {
      foundation: "阶段 0 · 平台基础",
      "market-research": "阶段 1 · 行情与研究",
      "strategy-backtest": "阶段 2 · 策略与回测",
      "ai-review": "阶段 3 · AI 评审",
      "portfolio-paper": "阶段 4 · 组合与模拟",
      "live-readiness": "阶段 5 · 实盘准备",
      "sandbox-execution": "阶段 6 · 测试网执行",
      "production-readonly-admission": "阶段 7 · 生产只读准入",
      "production-readonly-continuity": "阶段 8 · 生产只读连续性",
      "production-order-admission": "阶段 9 · 生产委托准入"
    },
    productDevelopmentStageStatuses: {
      maintenance: "基础维护",
      current: "当前阶段",
      planned: "后续规划"
    },
    quantLoop: {
      research: "行情研究",
      idea: "想法实验室",
      data: "数据与因子",
      strategy: "策略工坊",
      backtest: "回测复盘",
      "agent-review": "智能体评审",
      paper: "模拟交易",
      broker: "券商中心"
    },
    modules: {
      watchlist: "自选列表",
      scanner: "市场扫描",
      portfolio: "组合风险",
      news: "新闻事件",
      broker: "券商中心",
      workflow: "节点工作流"
    },
    agents: {
      technical: "技术分析师",
      fundamental: "基本面分析师",
      news: "新闻分析师",
      sentiment: "情绪分析师",
      bull: "多头研究员",
      bear: "空头研究员",
      risk: "风险经理",
      portfolio: "组合经理"
    },
    workflowNodes: {
      data: ["数据", "AKShare / yfinance / ccxt"],
      factor: ["因子", "SMA / RSI / 自定义"],
      backtest: ["回测", "手续费 / 滑点 / 回放"],
      agent: ["智能体", "辩论 / 风险 / 报告"],
      execution: ["执行", "模拟 / 认证实盘"]
    },
    moduleFocus: {
      watchlist: "自选列表已绑定 {symbol}；图表和研究流水线会使用这个上下文。",
      scanner: "市场扫描聚焦 {market} 候选池，当前图表保持在 {symbol}。",
      portfolio: "组合风险当前只展示 {symbol} 的模拟盘暴露和风控闸门。",
      news: "新闻事件智能体已切到 {symbol} 的本地行情、审计、风控和 AI 证据。",
      broker: "券商适配器在认证、风控检查和人工确认前保持阻断。",
      workflow: "节点工作流正在围绕 {symbol} 串联数据、因子、回测、智能体评审和执行。"
    },
    quantLoopFocus: {
      research: "先加载 {symbol} 的行情和图表，再决定是否进入策略工坊。",
      idea: "记录 {symbol} 的研究假设。",
      data: "准备 {symbol} 的行情、因子和质量检查。",
      strategy: "配置 {symbol} 的规则，并让 AI 委员会生成改进草稿。",
      backtest: "运行 {symbol} 的可审计回放，对比历史并解释结果。",
      "agent-review": "让 AI 委员会只基于传入数据解释结果和风险。",
      paper: "把通过校验的想法送入模拟交易和风控日志。",
      broker: "实盘券商适配器在认证和人工确认前保持锁定。"
    },
    gates: {
      "adapter-certified": "适配器已认证",
      "risk-approved": "风控已审批",
      "human-confirmed": "人工已确认"
    },
    metrics: {
      Return: "收益率",
      "Max DD": "最大回撤",
      "Win Rate": "胜率",
      Trades: "交易数"
    },
    statuses: {
      "Offline snapshot": "离线快照",
      "Core connected": "核心已连接",
      "Research run complete": "研究运行完成",
      "Research run failed": "研究运行失败",
      "Audit replay loaded": "审计回放已加载",
      "Strategy version saved": "策略版本已保存",
      "Strategy version save failed": "策略版本保存失败",
      "Strategy version loaded": "策略版本已载入",
      "Research run export ready": "研究运行导出完成",
      "Research run export failed": "研究运行导出失败",
      "Research run export package loaded": "复现包已加载",
      "Research run export inspect failed": "复现包检查失败",
      "Research run export index loaded": "近期复现包索引已加载",
      "Research run export index partial": "近期复现包索引部分加载",
      "Research run export index empty": "近期复现包索引为空",
      "Research run import preview ready": "导入预检已就绪",
      "Research run import preview cancelled": "导入预检已取消",
      "Research run import ready": "研究运行导入完成",
      "Research run import failed": "研究运行导入失败",
      "Backtest report export ready": "回测报告导出完成",
      "Backtest report export failed": "回测报告导出失败",
      "Parameter candidate staged": "参数候选已暂存",
      "AI review export ready": "AI 评审报告导出完成",
      "AI review export failed": "AI 评审报告导出失败",
      "AI review record saved": "AI 评审运行记录已保存",
      "AI review record save failed": "AI 评审运行记录保存失败",
      "AI review records loaded": "AI 评审运行记录已加载",
      "Adapter paper execution recorded": "适配器模拟执行已记录",
      "Adapter paper execution blocked": "适配器模拟执行已阻断",
      "Adapter paper execution failed": "适配器模拟执行失败",
      "Adapter paper execution reused": "适配器模拟执行已复用",
      "Paper execution recorded": "模拟执行已记录",
      "Paper execution failed": "模拟执行失败",
      "Paper execution history loaded": "模拟执行历史已加载",
      "Instrument selected": "标的已选择",
      "Watchlist saved": "自选列表已保存",
      "Watchlist save failed": "自选列表保存失败",
      "Timeframe selected": "周期已选择",
      "Strategy edited": "策略已编辑",
      "Backtest assumptions edited": "回测假设已编辑",
      "AI action generated": "AI 操作已生成"
    },
    executionModes: {
      paper_only: "模拟盘",
      certified_live: "认证实盘",
      blocked_live: "实盘阻断"
    }
  }
};

const strategyTextMaps: Record<Locale, Record<string, string>> = {
  "en-US": {},
  "zh-CN": {
    "SMA Trend / Bank Sector": "SMA 趋势 / 银行板块",
    "SMA trend demo": "SMA 趋势演示",
    "Close > SMA20 and relative strength improving": "收盘价 > SMA20，且相对强度改善",
    "Close < SMA20 or risk manager downgrade": "收盘价 < SMA20，或风险经理下调评级",
    "20% cap per instrument": "单标的仓位上限 20%",
    "Stop -8%, drawdown guard 12%, paper only": "止损 -8%，回撤保护 12%，仅模拟盘",
    "Replay from audited research run": "来自审计研究运行的回放",
    "Momentum confirmation plus AI committee agreement": "动量确认 + AI 委员会一致",
    "Close below trend support or risk manager downgrade": "跌破趋势支撑，或风险经理下调评级",
    "Start with paper sizing and cap exposure before audited replay": "先以模拟盘定仓，审计回放前限制暴露",
    "Paper only; require adapter certification, risk approval, and human confirmation":
      "仅模拟盘；需要适配器认证、风控审批和人工确认",
    "Pending audited backtest": "等待可审计回测",
    "Pending risk sizing": "等待风控定仓",
    "Paper only until a new audited run is available": "生成新的审计运行前仅允许模拟盘",
    "Ready for pipeline run": "等待流水线运行",
    pending: "待完善",
    "paper only": "仅模拟盘",
    "live gated": "实盘闸门",
    "needs run": "待运行",
    blocked: "阻断",
    "Entry and exit conditions are structured.": "入场和出场条件已结构化。",
    "Structured entry and exit rules are required before audit.": "审计前必须补齐结构化入场和出场规则。",
    "Position, stop, take profit, and drawdown guards are parseable.": "仓位、止损、止盈和回撤保护均可解析。",
    "Position sizing and risk guardrails must be explicit.": "仓位规则和风控闸门必须明确。",
    "Live routing stays blocked until adapter, risk, and human gates pass.":
      "适配器、风控和人工确认通过前，实盘通道保持阻断。",
    "This draft is bound to a reproducible audit run.": "该草稿已绑定可复现审计运行。",
    "Run Pipeline to bind this draft to a reproducible audit run.": "运行流水线后，将该草稿绑定到可复现审计运行。",
    "Fix blocked gates before running an audit pipeline.": "先修复阻断闸门，再运行审计流水线。",
    "Latest audited metric for the selected context.": "当前上下文的最新审计指标。",
    "Backtest capital assumption.": "回测资金假设。",
    "Round-trip fee assumption in basis points.": "以基点计的双边手续费假设。",
    "Execution slippage assumption in basis points.": "以基点计的执行滑点假设。"
  }
};

const decisionTextMaps: Record<Locale, Record<string, string>> = {
  "en-US": {},
  "zh-CN": {
    "Trend is recovering, but volume confirmation is still weak.": "趋势正在修复，但成交量确认仍然偏弱。",
    "Valuation is neutral; compare against sector bank index before promotion.": "估值中性；升级前需与银行板块指数对比。",
    "Live order is blocked until adapter certification and user confirmation pass.": "实盘订单在适配器认证和用户确认前保持阻断。",
    "Keep on watchlist and rerun after data and event refresh.": "保留在自选列表，待数据和事件刷新后重新运行。",
    "No decision entries recorded for this run.": "该运行未记录决策条目。",
    "Previous audit results are cleared for this research context; live execution remains blocked.":
      "该研究上下文的旧审计结果已清除；实盘执行仍保持阻断。"
  }
};

export function resolveInitialLocale(storedLocale?: string | null): Locale {
  return isLocale(storedLocale) ? storedLocale : "zh-CN";
}

export function translationKeysForLocale(locale: Locale): string[] {
  return Object.keys(messages[locale]).sort();
}

export function createI18n(locale: Locale) {
  const dictionary = messages[locale];
  const labels = labelMaps[locale];

  return {
    locale,
    localeOptionLabel(candidate: Locale) {
      return candidate === "zh-CN" ? dictionary["language.zh.label"] : dictionary["language.en.label"];
    },
    t(key: TranslationKey, values: Record<string, string | number> = {}) {
      return formatMessage(dictionary[key] ?? messages["en-US"][key] ?? key, values);
    },
    marketLabel(market: Market) {
      return labels.markets[market];
    },
    productWorkAreaLabel(area: ProductWorkArea) {
      return valueOf(labels.productWorkAreas, area.id, area.label);
    },
    productWorkAreaDescription(area: ProductWorkArea) {
      return valueOf(labels.productWorkAreaDescriptions, area.id, area.description);
    },
    productWorkAreaStatus(status: ProductWorkAreaStatus) {
      return valueOf(labels.productWorkAreaStatuses, status, status);
    },
    productWorkAreaDeliveryStage(area: ProductWorkArea) {
      return valueOf(labels.productDevelopmentStages, area.deliveryStageId, area.deliveryStageLabel);
    },
    productDevelopmentStageStatus(status: ProductDevelopmentStageStatus) {
      return valueOf(labels.productDevelopmentStageStatuses, status, status);
    },
    quantLoopLabel(id: string, fallback: string) {
      return valueOf(labels.quantLoop, id, fallback);
    },
    moduleLabel(id: string, fallback: string) {
      return valueOf(labels.modules, id, fallback);
    },
    moduleFocus(id: string, values: Record<string, string | number>) {
      return formatMessage(valueOf(labels.moduleFocus, id, id), values);
    },
    quantLoopFocus(id: string, values: Record<string, string | number>) {
      return formatMessage(valueOf(labels.quantLoopFocus, id, id), values);
    },
    agentLabel(id: string, fallback: string) {
      return valueOf(labels.agents, id, fallback);
    },
    workflowNode(id: string, fallbackLabel: string, fallbackDetail: string) {
      const translated = valueOf(labels.workflowNodes, id, undefined);
      return translated ? { label: translated[0], detail: translated[1] } : { label: fallbackLabel, detail: fallbackDetail };
    },
    gateLabel(id: string, fallback: string) {
      return valueOf(labels.gates, id, fallback);
    },
    metricLabel(label: string) {
      return valueOf(labels.metrics, label, label);
    },
    statusLabel(status: string) {
      return translateStatusLabel(labels.statuses, status);
    },
    executionMode(execution: ExecutionState) {
      return labels.executionModes[execution.mode];
    },
    strategyText(text: string) {
      return translateStrategyText(locale, text);
    },
    decisionAgent(agent: string) {
      return translateAgentName(locale, agent);
    },
    decisionMessage(message: string) {
      return translateDecisionMessage(locale, message);
    },
    researchRunLabel(summary: ResearchRunSummary | null | undefined) {
      if (!summary) {
        return locale === "zh-CN" ? "暂无审计运行" : "No audited run yet";
      }
      if (locale === "zh-CN") {
        return `${summary.runId} · ${summary.dataRows} 根 ${summary.timeframe} K线 · ${executionModeText(locale, summary.executionMode)}`;
      }
      return `${summary.runId} · ${summary.dataRows} ${summary.timeframe} bars · ${summary.executionMode}`;
    },
    researchRunHistoryLabel(run: ResearchRunAudit) {
      const totalReturn = run.metrics.total_return_pct;
      const tradeCount = run.metrics.trade_count ?? 0;
      const returnLabel = Number.isFinite(totalReturn)
        ? `${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}%`
        : "N/A";
      return locale === "zh-CN"
        ? `${run.symbol} · ${run.timeframe} · ${returnLabel} · ${tradeCount} 笔交易`
        : `${run.symbol} · ${run.timeframe} · ${returnLabel} · ${tradeCount} trades`;
    }
  };
}

function translateStrategyText(locale: Locale, text: string): string {
  if (locale === "en-US") {
    return text;
  }
  const direct = strategyTextMaps[locale][text];
  if (direct) {
    return direct;
  }
  const researchContext = text.match(/^(.+) ((?:1d|1w|1m|5m|15m|30m|60m)) research context$/);
  if (researchContext) {
    return `${researchContext[1]} ${researchContext[2]} 研究上下文`;
  }
  const originalTimeframe = text.match(/^Original timeframe ((?:1d|1w|1m|5m|15m|30m|60m))$/);
  if (originalTimeframe) {
    return `原始周期 ${originalTimeframe[1]}`;
  }
  const barsReplayed = text.match(/^(\d+) bars replayed$/);
  if (barsReplayed) {
    return `已回放 ${barsReplayed[1]} 根K线`;
  }
  const basisPoints = text.match(/^(\d+(?:\.\d+)?) bps$/);
  if (basisPoints) {
    return `${basisPoints[1]} 基点`;
  }
  const closeAboveSma = text.match(/^Close > SMA(\d+)$/);
  if (closeAboveSma) {
    return `收盘价 > SMA${closeAboveSma[1]}`;
  }
  const closeBelowSma = text.match(/^Close < SMA(\d+)$/);
  if (closeBelowSma) {
    return `收盘价 < SMA${closeBelowSma[1]}`;
  }
  const maxCapital = text.match(/^(\d+(?:\.\d+)?)% max capital allocation$/);
  if (maxCapital) {
    return `最大资金占用 ${maxCapital[1]}%`;
  }
  const structuredRisk = text.match(
    /^Stop -(\d+(?:\.\d+)?)%, take profit \+(\d+(?:\.\d+)?)%, drawdown guard (\d+(?:\.\d+)?)%, paper only$/
  );
  if (structuredRisk) {
    return `止损 -${structuredRisk[1]}%，止盈 +${structuredRisk[2]}%，回撤保护 ${structuredRisk[3]}%，仅模拟盘`;
  }
  const revision = text.match(/^Strategy revision (.+); execution (.+)$/);
  if (revision) {
    return `策略版本 ${revision[1]}；执行模式 ${executionModeText(locale, revision[2])}`;
  }
  return text;
}

function translateDecisionMessage(locale: Locale, message: string): string {
  if (locale === "en-US") {
    return message;
  }
  const direct = decisionTextMaps[locale][message];
  if (direct) {
    return direct;
  }
  const contextSelected = message.match(
    /^(.+) ((?:1d|1w|1m|5m|15m|30m|60m)) selected\. Run Pipeline to generate an audited backtest and agent review\.$/
  );
  if (contextSelected) {
    return `${contextSelected[1]} ${contextSelected[2]} 已选中。运行流水线以生成可审计回测和智能体评审。`;
  }
  const backtestReplay = message.match(/^Backtest replay completed on (\d+) bars\.$/);
  if (backtestReplay) {
    return `回测已基于 ${backtestReplay[1]} 根K线完成。`;
  }
  const auditedAiExplanation = message.match(
    /^Backtest explanation for (.+) using audited run (.+): return (.+), max drawdown (.+), trades (.+); no guaranteed outcome\.$/
  );
  if (auditedAiExplanation) {
    return `${auditedAiExplanation[1]} 审计运行 ${auditedAiExplanation[2]} 回测解释：收益率 ${auditedAiExplanation[3]}，最大回撤 ${auditedAiExplanation[4]}，交易数 ${auditedAiExplanation[5]}；不构成收益保证。`;
  }
  const aiExplanation = message.match(
    /^Backtest explanation for (.+): return (.+), max drawdown (.+), trades (.+); no guaranteed outcome\.$/
  );
  if (aiExplanation) {
    return `${aiExplanation[1]} 回测解释：收益率 ${aiExplanation[2]}，最大回撤 ${aiExplanation[3]}，交易数 ${aiExplanation[4]}；不构成收益保证。`;
  }
  const auditedAiDebate = message.match(
    /^Debate generated for (.+) using audited run (.+): bull case requires momentum confirmation; bear case flags drawdown and data quality\.$/
  );
  if (auditedAiDebate) {
    return `${auditedAiDebate[1]} 审计运行 ${auditedAiDebate[2]} 智能体辩论：多头观点需要动量确认；空头观点提示回撤和数据质量风险。`;
  }
  const aiDebate = message.match(
    /^Debate generated for (.+): bull case requires momentum confirmation; bear case flags drawdown and data quality\.$/
  );
  if (aiDebate) {
    return `${aiDebate[1]} 智能体辩论：多头观点需要动量确认；空头观点提示回撤和数据质量风险。`;
  }
  const blockedAiReview = message.match(
    /^AI (explanation|debate) blocked for (.+): run Pipeline to create an audited backtest first\.$/
  );
  if (blockedAiReview) {
    const action = blockedAiReview[1] === "explanation" ? "解释" : "辩论";
    return `${blockedAiReview[2]} AI ${action}已阻断：请先运行流水线生成可审计回测。`;
  }
  const strategyDraft = message.match(
    /^Strategy draft generated for (.+): keep paper-only execution until data, risk, and human gates pass\.$/
  );
  if (strategyDraft) {
    return `${strategyDraft[1]} 策略草稿已生成：数据、风控和人工闸门通过前保持模拟盘执行。`;
  }
  const strategyEdited = message.match(
    /^Strategy field (.+) updated locally\. Run Pipeline to generate a fresh audited backtest\.$/
  );
  if (strategyEdited) {
    return `策略字段 ${strategyFieldText(locale, strategyEdited[1])} 已本地更新。运行流水线以生成新的可审计回测。`;
  }
  const strategyLibraryLoaded = message.match(
    /^Strategy revision (.+) loaded for (.+) ((?:1d|1w|1m|5m|15m|30m|60m))\. (?:Archived audit run (.+) remains read-only; )?Run Pipeline to generate a fresh audited backtest\.$/
  );
  if (strategyLibraryLoaded) {
    const archivedRun = strategyLibraryLoaded[4]
      ? `归档审计运行 ${strategyLibraryLoaded[4]} 保持只读；`
      : "";
    return `策略版本 ${strategyLibraryLoaded[1]} 已载入到 ${strategyLibraryLoaded[2]} ${strategyLibraryLoaded[3]}。${archivedRun}运行流水线以生成新的可审计回测。`;
  }
  const backtestAssumptionEdited = message.match(
    /^Backtest assumption (.+) updated locally\. Run Pipeline to generate a fresh audited backtest\.$/
  );
  if (backtestAssumptionEdited) {
    return `回测假设 ${backtestAssumptionFieldText(locale, backtestAssumptionEdited[1])} 已本地更新。运行流水线以生成新的可审计回测。`;
  }
  return message;
}

function strategyFieldText(locale: Locale, field: string): string {
  if (locale === "en-US") {
    return field;
  }
  return (
    {
      name: "名称",
      entry: "入场",
      exit: "出场",
      position: "仓位",
      risk: "风控"
    }[field] ?? field
  );
}

function backtestAssumptionFieldText(locale: Locale, field: string): string {
  if (locale === "en-US") {
    return field;
  }
  return (
    {
      initialCash: "初始资金",
      feeBps: "手续费",
      slippageBps: "滑点"
    }[field] ?? field
  );
}

function translateAgentName(locale: Locale, agent: string): string {
  if (locale === "en-US") {
    return agent;
  }
  const byLabel = Object.entries(labelMaps["en-US"].agents).find(([, label]) => label === agent);
  if (byLabel) {
    return valueOf(labelMaps[locale].agents, byLabel[0], agent);
  }
  const extra: Record<string, string> = {
    "AI Summary": "AI 摘要",
    "AI Review Gate": "AI 评审闸门",
    Audit: "审计",
    Technical: "技术分析",
    Fundamental: "基本面",
    Risk: "风险",
    "Portfolio Manager": "组合经理",
    "AI Debate": "AI 辩论",
    "Strategy Drafter": "策略起草员",
    "Strategy Library": "策略库"
  };
  return extra[agent] ?? agent;
}

function executionModeText(locale: Locale, mode: string): string {
  const executionModes = labelMaps[locale].executionModes as Record<string, string>;
  return executionModes[mode] ?? mode;
}

function isLocale(value: string | null | undefined): value is Locale {
  return value === "zh-CN" || value === "en-US";
}

function formatMessage(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function valueOf<T>(record: Record<string, T>, key: string, fallback: T): T;
function valueOf<T>(record: Record<string, T>, key: string, fallback: T | undefined): T | undefined;
function valueOf<T>(record: Record<string, T>, key: string, fallback: T | undefined): T | undefined {
  return Object.prototype.hasOwnProperty.call(record, key) ? record[key] : fallback;
}

function translateStatusLabel(statuses: Record<string, string>, status: string): string {
  const direct = valueOf(statuses, status, undefined);
  if (direct) {
    return direct;
  }
  const dynamicStatus = status.match(/^(.+?)( · .+)$/u);
  if (!dynamicStatus) {
    return status;
  }
  const translatedPrefix = valueOf(statuses, dynamicStatus[1], undefined);
  return translatedPrefix ? `${translatedPrefix}${dynamicStatus[2]}` : status;
}
