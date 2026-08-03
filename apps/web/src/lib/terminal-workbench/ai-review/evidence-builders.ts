import type { PaperExecutionSnapshot, RiskApprovalSummary } from "../audit/execution-contracts";
import type { ResearchRunExportBrowserPackage } from "../audit/report-contracts";
import { auditTimelineExportPath, compactResearchNoteDetail, normalizedResearchNote, timestampSortValue } from "../audit/signing-key-ledger";
import type { TerminalWorkspace } from "../core/workspace-contracts";
import type { ExecutionAdapterPaperExecutionSnapshot } from "../execution/ops-contracts";
import type { AiReviewAuditTimelineItem, AiReviewDossier, AiReviewExportEvidenceIndexRow, AiReviewRunRecord, PortfolioPaperOrderSimulationSnapshot, ResearchRunExportPreviewAiReviewEnvelope, ResearchRunExportPreviewPromotionCandidate, ResearchRunExportPreviewRow } from "../portfolio/paper-contracts";
import type { ResearchRunDataPreparationEvidence, ResearchRunDataSnapshot } from "../research/workspace-contracts";
import type { ResearchContextMarketCalendar } from "../stage1/archive-contracts";
import { formatMarketCalendarEvidenceDetail, formatPreparationEvidenceDetail, formatWarningCount, marketCalendarEvidenceTone } from "../strategy/backtest-builders";
import type { AiReviewDecision, AuthoritativeAiReviewRun } from "../../ai-review-stage3";

export function buildAiReviewAuditTimelineItems({
  aiBoundary = "",
  citationCount = 0,
  currentRunId,
  currentStrategyRevision,
  dataSnapshot = null,
  decisionCount = 0,
  dossier,
  marketCalendar = null,
  paperExecution = null,
  preparationEvidence = null,
  records,
  roundCount = 0,
  riskApproval
}: {
  aiBoundary?: string;
  citationCount?: number;
  currentRunId: string | null;
  currentStrategyRevision: string;
  dataSnapshot?: ResearchRunDataSnapshot | null;
  decisionCount?: number;
  dossier: AiReviewDossier;
  marketCalendar?: ResearchContextMarketCalendar | null;
  paperExecution?: PaperExecutionSnapshot | null;
  preparationEvidence?: ResearchRunDataPreparationEvidence | null;
  records: AiReviewRunRecord[];
  roundCount?: number;
  riskApproval: RiskApprovalSummary;
}): AiReviewAuditTimelineItem[] {
  const currentEvidenceReady = Boolean(currentRunId) && dossier.status === "ready";
  const currentRunReference = currentRunId ?? "pending-audit-run";
  const citationBundleItem =
    currentRunId && citationCount > 0
      ? ({
          id: `citations:${citationCount}`,
          kind: "citation-bundle-evidence" as const,
          label: "Citation bundle",
          value: `${citationCount} citations`,
          detail: `AI review citations locked for ${currentRunReference}`,
          reference: String(citationCount),
          exportAnchor: `citations:${citationCount}`,
          createdAt: null,
          targetWorkspaceId: "ai-review" as const,
          targetRecordId: null,
          actionLabel: "Open citations",
          status: "passed" as const,
          tone: "ai" as const
        } satisfies AiReviewAuditTimelineItem)
      : null;
  const strategyItem =
    currentRunId && currentStrategyRevision.trim() && currentStrategyRevision !== "draft"
      ? ({
          id: `strategy:${currentStrategyRevision}`,
          kind: "strategy-revision-evidence" as const,
          label: "Strategy revision",
          value: currentStrategyRevision,
          detail: `Audited strategy revision · ${currentStrategyRevision}`,
          reference: currentStrategyRevision,
          exportAnchor: `strategy:${currentStrategyRevision}`,
          createdAt: null,
          targetWorkspaceId: "strategy" as const,
          targetRecordId: null,
          actionLabel: "Open strategy revision",
          status: "passed" as const,
          tone: "positive" as const
        } satisfies AiReviewAuditTimelineItem)
      : null;
  const committeeItem =
    currentRunId && roundCount > 0
      ? ({
          id: `committee:${roundCount}-rounds`,
          kind: "committee-rounds-evidence" as const,
          label: "Committee rounds",
          value: `${roundCount} rounds`,
          detail: `TradingAgents committee rounds locked for ${currentRunReference}`,
          reference: String(roundCount),
          exportAnchor: `committee:${roundCount}-rounds`,
          createdAt: null,
          targetWorkspaceId: "ai-review" as const,
          targetRecordId: null,
          actionLabel: "Open committee rounds",
          status: "passed" as const,
          tone: "ai" as const
        } satisfies AiReviewAuditTimelineItem)
      : null;
  const decisionLogItem =
    currentRunId && decisionCount > 0
      ? ({
          id: `decision-log:${decisionCount}`,
          kind: "decision-log-evidence" as const,
          label: "Decision log",
          value: `${decisionCount} entries`,
          detail: `AI review decision log locked for ${currentRunReference}`,
          reference: String(decisionCount),
          exportAnchor: `decision-log:${decisionCount}`,
          createdAt: null,
          targetWorkspaceId: "ai-review" as const,
          targetRecordId: null,
          actionLabel: "Open decision log",
          status: "passed" as const,
          tone: "ai" as const
        } satisfies AiReviewAuditTimelineItem)
      : null;
  const normalizedAiBoundary = aiBoundary.trim();
  const aiBoundaryItem =
    currentRunId && normalizedAiBoundary
      ? ({
          id: "boundary:evidence-explanation-only",
          kind: "ai-boundary-evidence" as const,
          label: "AI boundary",
          value: "Evidence explanation only",
          detail: normalizedAiBoundary,
          reference: "Evidence explanation only",
          exportAnchor: "boundary:evidence-explanation-only",
          createdAt: null,
          targetWorkspaceId: "ai-review" as const,
          targetRecordId: null,
          actionLabel: "Open AI boundary",
          status: "blocked" as const,
          tone: "risk" as const
        } satisfies AiReviewAuditTimelineItem)
      : null;
  const snapshotItem =
    dataSnapshot?.hash && Number.isFinite(dataSnapshot.rows) && dataSnapshot.rows > 0
      ? ({
          id: `snapshot:${dataSnapshot.hash}`,
          kind: "data-snapshot-evidence" as const,
          label: "Data snapshot",
          value: `${dataSnapshot.rows} rows · ${dataSnapshot.source}`,
          detail: `${dataSnapshot.source} · ${dataSnapshot.hash} · ${formatWarningCount(dataSnapshot.warnings.length)}`,
          reference: dataSnapshot.hash,
          exportAnchor: `data:${dataSnapshot.hash}`,
          createdAt: dataSnapshot.end,
          targetWorkspaceId: "backtest" as const,
          targetRecordId: null,
          actionLabel: "Open data snapshot",
          status:
            dataSnapshot.isComplete && dataSnapshot.warnings.length === 0 ? ("passed" as const) : ("review" as const),
          tone: dataSnapshot.isComplete && dataSnapshot.warnings.length === 0 ? ("positive" as const) : ("warning" as const)
        } satisfies AiReviewAuditTimelineItem)
      : null;
  const preparationItem = preparationEvidence
    ? ({
        id: `preparation:${preparationEvidence.runId}`,
        kind: "data-preparation-evidence" as const,
        label: "Data preparation",
        value: `${preparationEvidence.upsertedRows} rows · ${preparationEvidence.quality.source}`,
        detail: formatPreparationEvidenceDetail(preparationEvidence),
        reference: preparationEvidence.runId,
        exportAnchor: `preparationEvidence:${preparationEvidence.runId}`,
        createdAt: preparationEvidence.createdAt,
        targetWorkspaceId: "backtest" as const,
        targetRecordId: null,
        actionLabel: "Open preparation evidence",
        status: preparationEvidence.quality.isComplete ? ("passed" as const) : ("review" as const),
        tone: preparationEvidence.quality.isComplete ? ("positive" as const) : ("warning" as const)
      } satisfies AiReviewAuditTimelineItem)
    : null;
  const paperExecutionPreparationEvidence =
    paperExecution?.runId === currentRunId ? (paperExecution.preparationEvidence ?? null) : null;
  const paperExecutionPreparationItem =
    paperExecution && paperExecutionPreparationEvidence
      ? ({
          id: `paper-preparation:${paperExecutionPreparationEvidence.runId}`,
          kind: "paper-execution-preparation-evidence" as const,
          label: "Paper execution preparation",
          value: `${paperExecutionPreparationEvidence.upsertedRows} rows · ${paperExecutionPreparationEvidence.quality.source}`,
          detail: `Paper ${paperExecution.executionId} · ${formatPreparationEvidenceDetail(paperExecutionPreparationEvidence)}`,
          reference: paperExecutionPreparationEvidence.runId,
          exportAnchor: `paperExecution:${paperExecution.executionId}:preparationEvidence:${paperExecutionPreparationEvidence.runId}`,
          createdAt: paperExecutionPreparationEvidence.createdAt,
          targetWorkspaceId: "execution" as const,
          targetRecordId: paperExecution.executionId,
          actionLabel: "Open paper evidence",
          status: paperExecutionPreparationEvidence.quality.isComplete ? ("passed" as const) : ("review" as const),
          tone: paperExecutionPreparationEvidence.quality.isComplete ? ("positive" as const) : ("warning" as const)
        } satisfies AiReviewAuditTimelineItem)
      : null;
  const calendarItem = marketCalendar
    ? ({
        id: `calendar:${marketCalendar.market}:${marketCalendar.tradingDay}`,
        kind: "market-calendar-evidence" as const,
        label: "Market calendar",
        value: `${marketCalendar.status} · ${marketCalendar.session}`,
        detail: formatMarketCalendarEvidenceDetail(marketCalendar),
        reference: `${marketCalendar.market} ${marketCalendar.tradingDay} ${marketCalendar.status}/${marketCalendar.session}`,
        exportAnchor: `marketCalendar:${marketCalendar.market}:${marketCalendar.tradingDay}`,
        createdAt: marketCalendar.asOf,
        targetWorkspaceId: "backtest" as const,
        targetRecordId: null,
        actionLabel: "Open calendar evidence",
        status: marketCalendarEvidenceTone(marketCalendar) === "positive" ? ("passed" as const) : ("review" as const),
        tone: marketCalendarEvidenceTone(marketCalendar)
      } satisfies AiReviewAuditTimelineItem)
    : null;
  const savedRecordItems = [...records]
    .sort((left, right) => timestampSortValue(right.createdAt) - timestampSortValue(left.createdAt))
    .map((record) => ({
      id: `saved:${record.aiReviewId}`,
      kind: "saved-review" as const,
      label: "Saved AI review",
      value: `${record.strategyRevision} · ${record.summary.citationCount} citations · ${record.summary.roundCount} rounds`,
      detail: record.dossier.headline,
      reference: record.aiReviewId,
      exportAnchor: `aiReviewRun:${record.aiReviewId}`,
      createdAt: record.createdAt,
      targetWorkspaceId: null,
      targetRecordId: record.aiReviewId,
      actionLabel: "Compare saved review",
      status: record.status === "ready" ? ("passed" as const) : ("blocked" as const),
      tone: record.status === "ready" ? ("ai" as const) : ("risk" as const)
    }));

  return [
    {
      id: `current:${currentRunReference}`,
      kind: "current-evidence",
      label: "Current audit evidence",
      value: currentRunId
        ? `${currentStrategyRevision} · ${dossier.citations.length} citations`
        : `${currentStrategyRevision} · no audited run`,
      detail: dossier.headline,
      reference: currentRunReference,
      exportAnchor: `run:${currentRunReference}`,
      createdAt: null,
      targetWorkspaceId: "backtest",
      targetRecordId: null,
      actionLabel: "Open backtest evidence",
      status: currentEvidenceReady ? "passed" : "blocked",
      tone: currentEvidenceReady ? "ai" : "risk"
    },
    ...(citationBundleItem ? [citationBundleItem] : []),
    ...(strategyItem ? [strategyItem] : []),
    ...(committeeItem ? [committeeItem] : []),
    ...(decisionLogItem ? [decisionLogItem] : []),
    ...(aiBoundaryItem ? [aiBoundaryItem] : []),
    ...(snapshotItem ? [snapshotItem] : []),
    ...(preparationItem ? [preparationItem] : []),
    ...(paperExecutionPreparationItem ? [paperExecutionPreparationItem] : []),
    ...(calendarItem ? [calendarItem] : []),
    ...savedRecordItems,
    {
      id: `risk:${riskApproval.status}`,
      kind: "risk-approval",
      label: "Risk approval",
      value: riskApproval.headline,
      detail: riskApproval.summary,
      reference: `risk:${riskApproval.status}`,
      exportAnchor: `riskApproval:${riskApproval.status}`,
      createdAt: null,
      targetWorkspaceId: "execution",
      targetRecordId: null,
      actionLabel: "Open execution approval",
      status:
        riskApproval.status === "live_ready" ? "passed" : riskApproval.status === "paper_ready" ? "review" : "blocked",
      tone:
        riskApproval.status === "live_ready" ? "positive" : riskApproval.status === "paper_ready" ? "warning" : "risk"
    }
  ];
}

export function buildAiReviewExportEvidenceIndexRows({
  currentRecord,
  exportPackage,
  records,
  timelineItems
}: {
  currentRecord: AiReviewRunRecord | null;
  exportPackage?: Pick<ResearchRunExportBrowserPackage, "aiReviewRunsV2" | "aiReviewDecisions"> | null;
  records: AiReviewRunRecord[];
  timelineItems: AiReviewAuditTimelineItem[];
}): AiReviewExportEvidenceIndexRow[] {
  const rows: AiReviewExportEvidenceIndexRow[] = [];

  currentRecord?.evidenceAnchors?.forEach((anchor) => {
    rows.push({
      id: `current:${anchor.id}`,
      group: "current-record",
      label: anchor.label,
      anchor: anchor.id,
      reference: anchor.reference,
      exportPath: anchor.exportPath,
      detail: `Current AI review record · ${currentRecord.aiReviewId}`,
      tone: anchor.type === "risk-boundary" ? "risk" : "ai"
    });
  });

  records.forEach((record) => {
    record.evidenceAnchors?.forEach((anchor) => {
      rows.push({
        id: `saved:${record.aiReviewId}:${anchor.id}`,
        group: "saved-record",
        label: `${record.strategyRevision} · ${anchor.label}`,
        anchor: anchor.id,
        reference: anchor.reference,
        exportPath: anchor.exportPath,
        detail: `Saved AI review record · ${record.aiReviewId}`,
        tone: anchor.type === "risk-boundary" ? "risk" : "neutral"
      });
    });
  });

  timelineItems.forEach((item) => {
    rows.push({
      id: `timeline:${item.reference}`,
      group: "timeline",
      label: item.label,
      anchor: item.exportAnchor,
      reference: item.reference,
      exportPath: auditTimelineExportPath(item),
      detail: item.detail,
      tone: item.tone
    });
  });

  exportPackage?.aiReviewRunsV2?.forEach((envelope, index) => {
    const review = envelope.record;
    const experimentIds = [
      review.primaryExperiment.experimentId,
      ...review.comparisonExperiments.map((experiment) => experiment.experimentId)
    ];
    rows.push({
      id: "package-v2:" + review.aiReviewId,
      group: "package-authoritative-review",
      label: "Authoritative Review · " + review.aiReviewId,
      anchor: "aiReviewRunV2:" + review.aiReviewId,
      reference: experimentIds.join(" "),
      exportPath: "aiReviewRunsV2[" + index + "].record",
      detail: [
        "provider " + review.externalAssessment.provider,
        "status " + review.externalAssessment.status,
        "assessment " + review.deterministicAssessment.stance,
        "evidenceHash " + review.evidenceHash,
        "recordHash " + review.recordHash
      ].join(" · "),
      tone: review.externalAssessment.status === "failed" ? "risk" : "ai"
    });
  });

  exportPackage?.aiReviewDecisions?.forEach((envelope, index) => {
    const decision = envelope.record;
    rows.push({
      id: "package-decision:" + decision.decisionId,
      group: "package-decision",
      label: "Decision · " + decision.decisionId,
      anchor: "aiReviewDecision:" + decision.decisionId,
      reference: decision.aiReviewId,
      exportPath: "aiReviewDecisions[" + index + "].record",
      detail: [
        "status " + decision.status,
        "evidenceHash " + decision.evidenceHash,
        "recordHash " + decision.recordHash,
        "operator " + decision.operator
      ].join(" · "),
      tone: decision.status === "rejected" ? "risk" : "ai"
    });
  });

  return rows;
}

export function filterAiReviewExportEvidenceIndexRows(
  rows: AiReviewExportEvidenceIndexRow[],
  query: string
): AiReviewExportEvidenceIndexRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }

  return rows.filter((row) =>
    [row.group, row.label, row.anchor, row.reference, row.exportPath, row.detail, row.tone]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

export function buildResearchRunExportPreviewRows({
  aiReviewArchiveError = null,
  aiReviewArchiveStatus = "ready",
  aiReviewDecisions = [],
  aiReviewRecords = [],
  authoritativeAiReviewRecords = [],
  currentAiReviewRecord = null,
  paperExecution = null,
  promotionCandidate = null,
  riskApproval = null,
  workspace
}: {
  workspace: TerminalWorkspace;
  aiReviewArchiveError?: string | null;
  aiReviewArchiveStatus?: "idle" | "loading" | "ready" | "failed";
  aiReviewDecisions?: AiReviewDecision[];
  currentAiReviewRecord?: AiReviewRunRecord | null;
  aiReviewRecords?: ResearchRunExportPreviewAiReviewEnvelope[];
  authoritativeAiReviewRecords?: AuthoritativeAiReviewRun[];
  paperExecution?: PaperExecutionSnapshot | null;
  promotionCandidate?: ResearchRunExportPreviewPromotionCandidate | null;
  riskApproval?: RiskApprovalSummary | null;
}): ResearchRunExportPreviewRow[] {
  const run = workspace.researchRun ?? null;
  const runId = run?.runId ?? "pending-run";
  const dataSnapshot = run?.dataSnapshot ?? null;
  const preparationEvidence = dataSnapshot?.preparationEvidence ?? null;
  const marketCalendar = dataSnapshot?.marketCalendar ?? null;
  const researchNote = normalizedResearchNote(run?.researchNote);
  const activePaperExecution = run && paperExecution?.runId === run.runId ? paperExecution : null;
  const activePaperPreparationEvidence = activePaperExecution?.preparationEvidence ?? null;
  const activePromotionCandidate =
    run && promotionCandidate?.runId && promotionCandidate.runId === run.runId ? promotionCandidate : null;
  const activeAiReviewRecords = run
    ? aiReviewRecords.filter((record) => record.runId === run.runId)
    : [];
  const latestAiReviewRecord = activeAiReviewRecords[0] ?? null;
  const activeAuthoritativeAiReviewRecords = run
    ? authoritativeAiReviewRecords.filter((review) => review.primaryExperiment.sourceRunId === run.runId)
    : [];
  const authoritativeReviewIds = new Set(activeAuthoritativeAiReviewRecords.map((review) => review.aiReviewId));
  const activeAiReviewDecisions = aiReviewDecisions.filter((decision) =>
    authoritativeReviewIds.has(decision.aiReviewId)
  );
  const latestAuthoritativeAiReviewRecord = activeAuthoritativeAiReviewRecords[0] ?? null;
  const latestAiReviewDecision = activeAiReviewDecisions.at(-1) ?? null;
  const aiReviewArchiveUnavailable = aiReviewArchiveStatus !== "ready";
  const aiReviewArchiveUnavailableDetail =
    aiReviewArchiveStatus === "loading"
      ? "Loading the complete persistent Stage 3 archive for this research run."
      : aiReviewArchiveError
        ? "Persistent Stage 3 archive readback failed: " + aiReviewArchiveError
        : "Persistent Stage 3 archive readiness is unknown.";
  const currentRecordReady = Boolean(currentAiReviewRecord && run && currentAiReviewRecord.runId === run.runId);
  const backtestTradeCount = workspace.backtestTrades?.length ?? 0;
  const equityPointCount = workspace.backtestEquityCurve?.length ?? 0;

  return [
    {
      id: "research-run",
      label: "Research run",
      status: run ? "ready" : "blocked",
      count: run ? "1" : "0",
      anchor: `run:${runId}`,
      exportPath: "researchRun",
      detail: run
        ? `${workspace.selectedInstrument.symbol} · ${run.timeframe} · ${run.strategyRevision} · ${run.dataRows} bars`
        : "Run Pipeline before an export package can be reproduced.",
      tone: run ? "positive" : "risk"
    },
    {
      id: "data-snapshot",
      label: "Data snapshot",
      status:
        run && dataSnapshot?.hash && Number.isFinite(dataSnapshot.rows) && dataSnapshot.rows > 0
          ? "ready"
          : run
            ? "missing"
            : "blocked",
      count: dataSnapshot ? String(dataSnapshot.rows) : "0",
      anchor: dataSnapshot?.hash ? `dataSnapshot:${dataSnapshot.hash}` : `dataSnapshot:${runId}:missing`,
      exportPath: "researchRun.dataSnapshot",
      detail: dataSnapshot
        ? `${dataSnapshot.source} · ${dataSnapshot.hash} · ${formatWarningCount(dataSnapshot.warnings.length)}`
        : run
          ? "The audited run did not include a local data snapshot hash."
          : "A research run is required before data can be exported.",
      tone:
        run && dataSnapshot?.hash && Number.isFinite(dataSnapshot.rows) && dataSnapshot.rows > 0
          ? dataSnapshot.warnings.length
            ? "warning"
            : "positive"
          : run
            ? "warning"
            : "risk"
    },
    {
      id: "market-calendar",
      label: "Market calendar",
      status: marketCalendar ? "ready" : run ? "missing" : "blocked",
      count: marketCalendar ? `${marketCalendar.status} · ${marketCalendar.session}` : "missing",
      anchor: marketCalendar ? `marketCalendar:${marketCalendar.market}:${marketCalendar.tradingDay}` : `marketCalendar:${runId}:missing`,
      exportPath: "researchRun.dataSnapshot.marketCalendar",
      detail: marketCalendar
        ? formatMarketCalendarEvidenceDetail(marketCalendar)
        : run
          ? "The audited run did not include market calendar evidence."
          : "Run Pipeline before market calendar evidence can be exported.",
      tone: marketCalendar ? marketCalendarEvidenceTone(marketCalendar) : run ? "warning" : "risk"
    },
    {
      id: "preparation-evidence",
      label: "Preparation evidence",
      status: preparationEvidence ? "ready" : run ? "missing" : "blocked",
      count: preparationEvidence ? `${preparationEvidence.upsertedRows} rows` : "0 rows",
      anchor: preparationEvidence
        ? `preparationEvidence:${preparationEvidence.runId}`
        : `preparationEvidence:${runId}:missing`,
      exportPath: "researchRun.dataSnapshot.preparationEvidence",
      detail: preparationEvidence
        ? formatPreparationEvidenceDetail(preparationEvidence)
        : run
          ? "The audited run did not lock a matching watchlist cache refresh run."
          : "Run Pipeline from a matched watchlist cache refresh before preparation evidence can be exported.",
      tone: preparationEvidence ? (preparationEvidence.quality.isComplete ? "positive" : "warning") : run ? "warning" : "risk"
    },
    {
      id: "strategy-config",
      label: "Strategy config",
      status: run?.strategyConfig ? "ready" : run ? "missing" : "blocked",
      count: run?.strategyConfig ? `${run.strategyConfig.entryConditions.length}/${run.strategyConfig.exitConditions.length}` : "0/0",
      anchor: run?.strategyConfig ? `strategy:${run.strategyConfig.revision}` : `strategy:${runId}:missing`,
      exportPath: "researchRun.strategyConfig",
      detail: run?.strategyConfig
        ? `${run.strategyConfig.name} · v${run.strategyConfig.version} · ${run.strategyConfig.symbols.join(", ")}`
        : run
          ? "The export can replay the run, but structured strategy rules are missing."
          : "Run Pipeline after saving a strategy to bind structured rules.",
      tone: run?.strategyConfig ? "positive" : run ? "warning" : "risk"
    },
    {
      id: "research-note",
      label: "Research note",
      status: researchNote ? "ready" : run ? "missing" : "blocked",
      count: researchNote ? "1" : "0",
      anchor: researchNote ? `researchNote:${researchNote.symbol}:${researchNote.timeframe}` : `researchNote:${runId}:missing`,
      exportPath: "researchRun.researchNote",
      detail: researchNote
        ? compactResearchNoteDetail(researchNote.body)
        : run
          ? "No research note is attached to this run; add one for stronger replay context."
          : "Research notes are bound after a run is created.",
      tone: researchNote ? "ai" : run ? "neutral" : "risk"
    },
    {
      id: "backtest-trades",
      label: "Backtest trades",
      status: backtestTradeCount > 0 || equityPointCount > 0 ? "ready" : run ? "missing" : "blocked",
      count:
        backtestTradeCount > 0 || equityPointCount > 0
          ? `${backtestTradeCount} trades / ${equityPointCount} equity`
          : "0 trades / 0 equity",
      anchor: `backtest:${runId}`,
      exportPath: "researchRun.backtestTrades",
      detail:
        backtestTradeCount > 0 || equityPointCount > 0
          ? "Trade blotter and equity curve are available for replay."
          : run
            ? "The run summary is bound, but the trade blotter or equity curve is missing."
            : "Run Pipeline before backtest replay artifacts are exported.",
      tone: backtestTradeCount > 0 || equityPointCount > 0 ? "positive" : run ? "warning" : "risk"
    },
    {
      id: "ai-review-runs",
      label: "AI review runs",
      status: activeAiReviewRecords.length > 0 ? "ready" : currentRecordReady ? "missing" : run ? "missing" : "blocked",
      count: `${activeAiReviewRecords.length} saved / ${currentRecordReady ? "current ready" : "current missing"}`,
      anchor: latestAiReviewRecord
        ? `aiReviewRun:${latestAiReviewRecord.aiReviewId}`
        : currentRecordReady
          ? `aiReviewRun:${currentAiReviewRecord?.aiReviewId}`
          : `aiReviewRun:${runId}:missing`,
      exportPath: "aiReviewRuns[]",
      detail:
        activeAiReviewRecords.length > 0
          ? "Saved AI review records are attached to this export package."
          : currentRecordReady
            ? "Current AI evidence is ready, but it has not been saved into the export package yet."
            : run
              ? "Run and save an AI review record before relying on exported AI evidence."
              : "A research run is required before AI review records can be exported.",
      tone: activeAiReviewRecords.length > 0 ? "ai" : currentRecordReady || run ? "warning" : "risk"
    },
    {
      id: "ai-review-runs-v2",
      label: "Authoritative AI reviews",
      status: aiReviewArchiveUnavailable
        ? "blocked"
        : activeAuthoritativeAiReviewRecords.length > 0
          ? "ready"
          : run
            ? "missing"
            : "blocked",
      count: aiReviewArchiveUnavailable ? "unknown" : activeAuthoritativeAiReviewRecords.length + " authoritative",
      anchor: latestAuthoritativeAiReviewRecord
        ? "aiReviewRunV2:" + latestAuthoritativeAiReviewRecord.aiReviewId
        : "aiReviewRunV2:" + runId + ":missing",
      exportPath: "aiReviewRunsV2[]",
      detail: aiReviewArchiveUnavailable
        ? aiReviewArchiveUnavailableDetail
        : activeAuthoritativeAiReviewRecords.length > 0
        ? "Authoritative v2 Reviews and evidence hashes are ready for export."
        : run
          ? "No authoritative v2 Review is saved for this research run."
          : "A research run is required before authoritative Reviews can be exported.",
      tone: aiReviewArchiveUnavailable
        ? "risk"
        : activeAuthoritativeAiReviewRecords.length > 0
          ? "ai"
          : run
            ? "warning"
            : "risk"
    },
    {
      id: "ai-review-decisions",
      label: "AI review Decisions",
      status: aiReviewArchiveUnavailable
        ? "blocked"
        : activeAiReviewDecisions.length > 0
        ? "ready"
        : activeAuthoritativeAiReviewRecords.length > 0
          ? "missing"
          : run
            ? "missing"
            : "blocked",
      count: aiReviewArchiveUnavailable
        ? "unknown"
        : activeAiReviewDecisions.length + " Decision" + (activeAiReviewDecisions.length === 1 ? "" : "s"),
      anchor: latestAiReviewDecision
        ? "aiReviewDecision:" + latestAiReviewDecision.decisionId
        : "aiReviewDecision:" + runId + ":missing",
      exportPath: "aiReviewDecisions[]",
      detail: aiReviewArchiveUnavailable
        ? aiReviewArchiveUnavailableDetail
        : activeAiReviewDecisions.length > 0
        ? "Decision append-chain evidence is ready for export."
        : activeAuthoritativeAiReviewRecords.length > 0
          ? "The authoritative Review has no appended Decision."
          : run
            ? "Save an authoritative Review before appending a Decision."
            : "A research run is required before Decisions can be exported.",
      tone: aiReviewArchiveUnavailable
        ? "risk"
        : activeAiReviewDecisions.length > 0
          ? "ai"
          : run
            ? "warning"
            : "risk"
    },
    {
      id: "paper-executions",
      label: "Paper executions",
      status: activePaperExecution ? "ready" : run ? "missing" : "blocked",
      count: activePaperExecution ? `${activePaperExecution.orders.length} order${activePaperExecution.orders.length === 1 ? "" : "s"}` : "0 orders",
      anchor: activePaperExecution ? `paperExecution:${activePaperExecution.executionId}` : `paperExecution:${runId}:missing`,
      exportPath: "paperExecutions[]",
      detail: activePaperExecution
        ? [
            activePaperExecution.mode,
            `${activePaperExecution.gates.filter((gate) => gate.passed).length}/${activePaperExecution.gates.length} gates passed`,
            ...(activePaperPreparationEvidence ? [`prep ${activePaperPreparationEvidence.runId}`] : [])
          ].join(" · ")
        : run
          ? "Submit a paper order to attach execution evidence to the run package."
          : "Paper execution waits for an audited run.",
      tone: activePaperExecution ? "positive" : run ? "warning" : "risk"
    },
    {
      id: "promotion-candidate",
      label: "Promotion candidate",
      status: activePromotionCandidate
        ? activePromotionCandidate.status === "live_ready" || activePromotionCandidate.liveTradingAllowed
          ? "ready"
          : "blocked"
        : run
          ? "missing"
          : "blocked",
      count: activePromotionCandidate?.evidence
        ? `${activePromotionCandidate.evidence.filledOrders} fills / ${activePromotionCandidate.evidence.passedPaperRiskChecks} risk`
        : "0 fills / 0 risk",
      anchor: activePromotionCandidate?.candidateId
        ? `promotion:${activePromotionCandidate.candidateId}`
        : `promotion:${runId}:missing`,
      exportPath: "promotionCandidate",
      detail: activePromotionCandidate
        ? activePromotionCandidate.summary ?? "Promotion evidence is attached, but live execution remains blocked."
        : run
          ? "Create a paper execution before promotion evidence can be attached."
          : "Promotion evidence waits for a research run.",
      tone:
        activePromotionCandidate?.status === "live_ready" || activePromotionCandidate?.liveTradingAllowed
          ? "positive"
          : activePromotionCandidate
            ? "warning"
            : run
              ? "neutral"
              : "risk"
    },
    {
      id: "execution-handoff",
      label: "Execution handoff",
      status: run && riskApproval && riskApproval.status !== "blocked" ? "ready" : run ? "blocked" : "blocked",
      count: riskApproval ? `${riskApproval.gates.filter((gate) => gate.status === "passed").length}/${riskApproval.gates.length}` : "0/0",
      anchor: riskApproval ? `riskApproval:${riskApproval.status}` : `riskApproval:${runId}:missing`,
      exportPath: "executionHandoff.requiredGates",
      detail: riskApproval
        ? riskApproval.summary
        : "Execution handoff gates are created after an audited run is available.",
      tone: riskApproval?.status === "live_ready" ? "positive" : riskApproval?.status === "paper_ready" ? "warning" : "risk"
    }
  ];
}

export function filterResearchRunExportPreviewRows(
  rows: ResearchRunExportPreviewRow[],
  query: string
): ResearchRunExportPreviewRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }
  return rows.filter((row) =>
    [row.id, row.label, row.status, row.count, row.anchor, row.exportPath, row.detail, row.tone]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

export function collectPaperExecutionPreparationEvidenceRunIds(
  executions: readonly PaperExecutionSnapshot[] | null | undefined
): string[] {
  return Array.from(
    new Set(
      (executions ?? [])
        .map((execution) => execution.preparationEvidence?.runId)
        .filter((runId): runId is string => Boolean(runId))
    )
  );
}

export function formatAdapterPaperExecutionEvidenceDetail(
  executions: readonly ExecutionAdapterPaperExecutionSnapshot[] | null | undefined
): string {
  const firstExecution = executions?.[0];
  if (!firstExecution) {
    return "No adapter paper execution evidence is attached.";
  }
  return [
    firstExecution.adapterPaperExecutionId,
    firstExecution.adapterId,
    firstExecution.route,
    firstExecution.simulatedFill.status
  ].join(" · ");
}

export function formatPortfolioPaperOrderSimulationAdapterEvidenceDetail(
  simulations: readonly PortfolioPaperOrderSimulationSnapshot[] | null | undefined
): string {
  const withAdapterEvidence = (simulations ?? []).filter((simulation) => simulation.adapterPaperExecutionId);
  if (!withAdapterEvidence.length) {
    return "";
  }
  const firstSimulation = withAdapterEvidence[0];
  const evidence = firstSimulation?.adapterPaperExecutionEvidence ?? {};
  const fillSummary = typeof evidence.fillSummary === "string" ? evidence.fillSummary : "adapter fill evidence";
  return `${withAdapterEvidence.length} simulated fill${
    withAdapterEvidence.length === 1 ? "" : "s"
  } carries adapter paper execution evidence: ${firstSimulation.adapterPaperExecutionId} · ${fillSummary}`;
}
