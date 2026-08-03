import { compactResearchNoteDetail, normalizedResearchNote } from "../audit/signing-key-ledger";
import type { ResearchRunAudit, TerminalWorkspace } from "../core/workspace-contracts";
import { formatInstrumentPrice } from "../core/workspace-operations";
import type { AgentCommitteeRound, AiEvidenceCard, AiReviewCitation, AiReviewDossier, AiReviewEvidenceAnchor, AiReviewRecordDriftReason, AiReviewRecordDriftRow, AiReviewRunRecord, DecisionLogEntry } from "../portfolio/paper-contracts";
import type { StrategyExperimentDetail } from "../research/workspace-contracts";
import type { ResearchRunSummary } from "../stage1/archive-contracts";
import { buildAgentCommitteeRounds } from "../stage1/platform-readiness";
import { aiBenchmarkDetail, buildBacktestBenchmark, formatWarningCount, markdownTable, metricValue } from "../strategy/backtest-builders";
import { buildResearchRunContextBinding, buildStrategyExperimentEvidenceSummary } from "../strategy/experiment-builders";

export function buildAiEvidenceCards(workspace: TerminalWorkspace): AiEvidenceCard[] {
  const selected = workspace.selectedInstrument;
  const auditBinding = buildResearchRunContextBinding(workspace);
  const usableRun = auditBinding.canUseRun ? workspace.researchRun : null;
  const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
  const gateDetail = workspace.execution.gates
    .map((gate) => `${gate.label}: ${gate.passed ? "passed" : "blocked"}`)
    .join(" · ");
  const researchNote = normalizedResearchNote(usableRun?.researchNote);
  const cards: AiEvidenceCard[] = [
    {
      id: "context",
      label: "Research context",
      value: `${selected.symbol} · ${workspace.selectedTimeframe}`,
      detail: `${selected.market} · price ${formatInstrumentPrice(selected.price)}`,
      tone: "neutral"
    },
    usableRun
      ? {
          id: "backtest",
          label: "Backtest evidence",
          value: `${usableRun.dataRows} ${usableRun.timeframe} bars`,
          detail: `Audited run ${usableRun.runId} · revision ${usableRun.strategyRevision}`,
          tone: "positive"
        }
      : auditBinding.status === "mismatched"
        ? {
            id: "backtest",
            label: "Backtest evidence",
            value: "Stale audited run",
            detail: auditBinding.detail,
            tone: "risk"
          }
      : {
          id: "backtest",
          label: "Backtest evidence",
          value: "Pending audited run",
          detail: "Run Pipeline before trusting AI review.",
          tone: "warning"
        },
  ];

  if (usableRun) {
    const benchmark = buildBacktestBenchmark(workspace);
    cards.push({
      id: "benchmark",
      label: "Benchmark alpha",
      value: benchmark.alpha,
      detail: aiBenchmarkDetail(benchmark),
      tone: benchmark.tone
    });
  }

  if (researchNote) {
    cards.push({
      id: "research-note",
      label: "Research note",
      value: "Locked note snapshot",
      detail: compactResearchNoteDetail(researchNote.body),
      tone: "ai"
    });
  }

  cards.push(
    {
      id: "risk",
      label: "Risk gates",
      value: workspace.execution.liveEnabled ? "Live gates open" : `${blockedGateCount} blocked gates`,
      detail: gateDetail,
      tone: workspace.execution.liveEnabled ? "positive" : "risk"
    },
    {
      id: "safety",
      label: "AI boundary",
      value: "No buy/sell advice",
      detail: "AI can explain supplied evidence only; no guaranteed outcome.",
      tone: "ai"
    }
  );

  return cards;
}

export const persistedStrategyExperimentRequired = "Persisted strategy experiment required.";

export function buildAiReviewDossier(
  workspace: TerminalWorkspace,
  experiment: StrategyExperimentDetail | null = null
): AiReviewDossier {
  const auditBinding = buildResearchRunContextBinding(workspace);
  const blockedGateCount = workspace.execution.gates.filter((gate) => !gate.passed).length;
  const riskGateCitation: AiReviewCitation = {
    id: "risk-gates",
    label: "Risk gates",
    value: workspace.execution.liveEnabled ? "Live gates open" : `${blockedGateCount} blocked gates`,
    detail: workspace.execution.gates
      .map((gate) => `${gate.label}: ${gate.passed ? "passed" : "blocked"}`)
      .join(" · "),
    tone: workspace.execution.liveEnabled ? "positive" : "risk"
  };

  if (!workspace.researchRun) {
    return {
      status: "blocked",
      headline: "Audited evidence required",
      summary: "Run Pipeline before agent debate, explanation, or strategy promotion.",
      citations: [
        {
          id: "run",
          label: "Run id",
          value: "Missing audited run",
          detail: "No reproducible backtest is bound to this context.",
          tone: "risk"
        },
        {
          id: "data-quality",
          label: "Data quality",
          value: "Unavailable",
          detail: "Data quality is only trusted after an audited run is loaded.",
          tone: "warning"
        },
        riskGateCitation
      ]
    };
  }

  if (!auditBinding.canUseRun) {
    return {
      status: "blocked",
      headline: "Current audit context required",
      summary: "Run Pipeline to bind AI review to the selected research context before exporting or saving records.",
      citations: [
        {
          id: "run",
          label: "Run id",
          value: auditBinding.runId ?? "Stale audited run",
          detail: auditBinding.detail,
          tone: "risk"
        },
        {
          id: "data-quality",
          label: "Data quality",
          value: "Stale context",
          detail: "Data quality cannot be trusted until the run matches the selected market, symbol, and timeframe.",
          tone: "warning"
        },
        riskGateCitation
      ]
    };
  }

  const run = workspace.researchRun;
  const returnMetric = metricValue(workspace, "Return", "N/A");
  const drawdownMetric = metricValue(workspace, "Max DD", "N/A");
  const winRateMetric = metricValue(workspace, "Win Rate", "N/A");
  const tradeMetric = metricValue(workspace, "Trades", "0");
  const dataQuality = run.dataQuality;
  const researchNote = normalizedResearchNote(run.researchNote);
  const benchmark = buildBacktestBenchmark(workspace);
  const experimentEvidence = buildStrategyExperimentEvidenceSummary(workspace, experiment);
  const benchmarkCitation: AiReviewCitation = {
    id: "benchmark",
    label: "Benchmark alpha",
    value: benchmark.alpha,
    detail: aiBenchmarkDetail(benchmark),
    tone: benchmark.tone
  };
  const parameterScanCitation: AiReviewCitation = {
    id: "parameter-scan",
    label: "Persisted strategy experiment",
    value: experimentEvidence?.experimentId ?? persistedStrategyExperimentRequired,
    detail: experimentEvidence
      ? `Definition ${experimentEvidence.definitionHash} · Result ${experimentEvidence.resultHash} · Selected candidate ${experimentEvidence.selectedCandidateId} (${experimentEvidence.candidateRevision}) · Holdout ${experimentEvidence.holdoutStatus}.`
      : persistedStrategyExperimentRequired,
    tone: experimentEvidence ? "positive" : "warning"
  };
  const noteCitation: AiReviewCitation | null = researchNote
    ? {
        id: "research-note",
        label: "Research note",
        value: "Locked note snapshot",
        detail: compactResearchNoteDetail(researchNote.body),
        tone: "ai"
      }
    : null;

  return {
    status: "ready",
    headline: `AI review bound to ${run.runId}`,
    summary: `Agents may explain evidence for ${workspace.selectedInstrument.symbol}, but live execution remains gated.`,
    citations: [
      {
        id: "run",
        label: "Run id",
        value: run.runId,
        detail: `${run.dataRows} ${run.timeframe} bars · ${run.executionMode}`,
        tone: "positive"
      },
      {
        id: "metrics",
        label: "Backtest metrics",
        value: `${returnMetric} / ${drawdownMetric} / ${tradeMetric} trades`,
        detail: `Win rate ${winRateMetric}; no guaranteed outcome.`,
        tone: returnMetric.startsWith("-") ? "warning" : "positive"
      },
      benchmarkCitation,
      parameterScanCitation,
      {
        id: "strategy",
        label: "Strategy revision",
        value: run.strategyRevision,
        detail: workspace.strategy.name,
        tone: "positive"
      },
      dataQuality
        ? {
            id: "data-quality",
            label: "Data quality",
            value: `${dataQuality.source} · ${dataQuality.isComplete ? "complete" : "review"}`,
            detail: `${dataQuality.rows} rows · ${formatWarningCount(dataQuality.warnings.length)}`,
            tone: dataQuality.isComplete && dataQuality.warnings.length === 0 ? "positive" : "warning"
          }
        : {
            id: "data-quality",
            label: "Data quality",
            value: "Not attached",
            detail: "Run metadata did not include data quality details.",
            tone: "warning"
          },
      ...(noteCitation ? [noteCitation] : []),
      riskGateCitation
    ]
  };
}

export function buildAiReviewReportMarkdown(
  workspace: TerminalWorkspace,
  experiment: StrategyExperimentDetail | null = null
): string | null {
  const run = workspace.researchRun;
  if (!run) {
    return null;
  }

  const dossier = buildAiReviewDossier(workspace, experiment);
  if (dossier.status !== "ready") {
    return null;
  }

  const rounds = buildAgentCommitteeRounds(workspace);
  const benchmark = buildBacktestBenchmark(workspace);
  const experimentEvidence = buildStrategyExperimentEvidenceSummary(workspace, experiment);
  const researchNote = normalizedResearchNote(run.researchNote);
  const citationRows = dossier.citations.map((citation) => [citation.label, citation.value, citation.detail]);
  const committeeRows = rounds.map((round) => [
    round.agent,
    round.verdict,
    `${round.confidence}%`,
    round.thesis,
    round.evidence
  ]);
  const decisionRows = workspace.decisionLog.map((entry) => [entry.agent, entry.tone, entry.message]);

  return [
    "# AIQuant Evidence-Locked AI Review",
    "",
    `Run ID: \`${run.runId}\``,
    `Market: \`${workspace.selectedInstrument.market}\``,
    `Symbol: \`${workspace.selectedInstrument.symbol}\``,
    `Timeframe: \`${run.timeframe}\``,
    `Strategy revision: \`${run.strategyRevision}\``,
    `Execution mode: \`${run.executionMode}\``,
    "",
    "## Review Scope",
    "",
    dossier.headline,
    "",
    dossier.summary,
    "",
    "## Evidence Citations",
    "",
    markdownTable(["Citation", "Value", "Evidence"], citationRows),
    "",
    "## Benchmark Context",
    "",
    benchmark.detail,
    "",
    markdownTable(
      ["Measure", "Value"],
      [
        ["Strategy return", benchmark.strategyReturn],
        ["Benchmark buy and hold", benchmark.benchmarkReturn],
        ["Benchmark alpha", benchmark.alpha]
      ]
    ),
    "",
    "## Persisted Strategy Experiment",
    "",
    experimentEvidence
      ? markdownTable(
          ["Field", "Value"],
          [
            ["Experiment ID", experimentEvidence.experimentId],
            ["Definition hash", experimentEvidence.definitionHash],
            ["Result hash", experimentEvidence.resultHash],
            ["Selected candidate", `${experimentEvidence.selectedCandidateId} (${experimentEvidence.candidateRevision})`],
            ["Holdout", experimentEvidence.holdoutStatus]
          ]
        )
      : persistedStrategyExperimentRequired,
    "",
    researchNote ? "## Locked Research Note" : "",
    researchNote ? "" : "",
    researchNote ? researchNote.body : "",
    researchNote ? "" : "",
    "## Committee Rounds",
    "",
    markdownTable(["Agent", "Verdict", "Confidence", "Thesis", "Evidence"], committeeRows),
    "",
    "## Decision Log",
    "",
    decisionRows.length ? markdownTable(["Agent", "Tone", "Message"], decisionRows) : "No decision log entries are attached.",
    "",
    "## AI Boundary",
    "",
    "AI must not output buy/sell instructions or guaranteed returns.",
    "",
    "This report can explain only the audited run, locked strategy revision, data snapshot, benchmark comparison, persisted strategy experiment, and risk gates above."
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n")
    .trimEnd()
    .concat("\n");
}

export function buildAiReviewRunRecord(
  workspace: TerminalWorkspace,
  experiment: StrategyExperimentDetail | null = null
): AiReviewRunRecord | null {
  const run = workspace.researchRun;
  if (!run) {
    return null;
  }

  const dossier = buildAiReviewDossier(workspace, experiment);
  if (dossier.status !== "ready") {
    return null;
  }

  const rounds = buildAgentCommitteeRounds(workspace);
  const decisionLog = workspace.decisionLog.slice();
  const citations = dossier.citations.slice();
  const evidenceAnchors = buildAiReviewEvidenceAnchors(run, citations, rounds, decisionLog);

  return {
    schemaVersion: 1,
    recordType: "aiqt.aiReviewRun",
    aiReviewId: `ai-review:${run.runId}:${run.strategyRevision}`,
    runId: run.runId,
    createdAt: run.createdAt,
    market: workspace.selectedInstrument.market,
    symbol: workspace.selectedInstrument.symbol,
    timeframe: run.timeframe,
    strategyRevision: run.strategyRevision,
    executionMode: run.executionMode,
    status: dossier.status,
    summary: {
      citationCount: citations.length,
      roundCount: rounds.length,
      decisionCount: decisionLog.length,
      parameterScanBound: Boolean(buildStrategyExperimentEvidenceSummary(workspace, experiment)),
      liveExecutionBlocked: !workspace.execution.liveEnabled
    },
    dossier,
    citations,
    rounds,
    decisionLog,
    evidenceAnchors,
    boundary: "Evidence explanation only; no buy/sell instructions or guaranteed returns."
  };
}

export function buildAiReviewEvidenceAnchors(
  run: ResearchRunSummary | ResearchRunAudit,
  citations: AiReviewCitation[],
  rounds: AgentCommitteeRound[],
  decisionLog: DecisionLogEntry[]
): AiReviewEvidenceAnchor[] {
  const anchors: AiReviewEvidenceAnchor[] = [
    {
      id: `run:${run.runId}`,
      type: "research-run",
      label: "Research run",
      reference: run.runId,
      exportPath: "researchRun.runId"
    },
    {
      id: `strategy:${run.strategyRevision}`,
      type: "strategy-revision",
      label: "Strategy revision",
      reference: run.strategyRevision,
      exportPath: "researchRun.strategyConfig.revision"
    }
  ];

  if (run.dataSnapshot?.hash) {
    anchors.push({
      id: `data:${run.dataSnapshot.hash}`,
      type: "data-snapshot",
      label: "Data snapshot",
      reference: run.dataSnapshot.hash,
      exportPath: "researchRun.dataSnapshot.hash"
    });
  }

  if (run.dataSnapshot?.marketCalendar) {
    const calendar = run.dataSnapshot.marketCalendar;
    anchors.push({
      id: `marketCalendar:${calendar.market}:${calendar.tradingDay}`,
      type: "market-calendar",
      label: "Market calendar",
      reference: `${calendar.market} ${calendar.tradingDay} ${calendar.status}/${calendar.session}`,
      exportPath: "researchRun.dataSnapshot.marketCalendar"
    });
  }

  if (run.dataSnapshot?.preparationEvidence) {
    anchors.push({
      id: `preparationEvidence:${run.dataSnapshot.preparationEvidence.runId}`,
      type: "data-preparation",
      label: "Data preparation",
      reference: run.dataSnapshot.preparationEvidence.runId,
      exportPath: "researchRun.dataSnapshot.preparationEvidence"
    });
  }

  citations.forEach((citation) => {
    anchors.push({
      id: `citation:${citation.id}`,
      type: "citation",
      label: citation.label,
      reference: citation.id,
      exportPath: `aiReviewRuns[].record.citations[${citation.id}]`
    });
  });

  anchors.push(
    {
      id: `committee:${rounds.length}-rounds`,
      type: "committee-rounds",
      label: "Committee rounds",
      reference: String(rounds.length),
      exportPath: "aiReviewRuns[].record.rounds"
    },
    {
      id: `decision-log:${decisionLog.length}`,
      type: "decision-log",
      label: "Decision log",
      reference: String(decisionLog.length),
      exportPath: "aiReviewRuns[].record.decisionLog"
    },
    {
      id: "boundary:evidence-explanation-only",
      type: "risk-boundary",
      label: "AI boundary",
      reference: "Evidence explanation only",
      exportPath: "aiReviewRuns[].record.boundary"
    }
  );

  return anchors;
}

export function buildAiReviewRecordDriftRows({
  currentCitationCount,
  currentRunId,
  currentStatus,
  currentStrategyRevision,
  liveExecutionBlocked,
  records,
  roundCount
}: {
  currentCitationCount: number;
  currentRunId: string | null;
  currentStatus: AiReviewDossier["status"];
  currentStrategyRevision: string;
  liveExecutionBlocked: boolean;
  records: AiReviewRunRecord[];
  roundCount: number;
}): AiReviewRecordDriftRow[] {
  return records.map((record) => {
    const driftReasons: AiReviewRecordDriftReason[] = [];
    if (!currentRunId || record.runId !== currentRunId) {
      driftReasons.push("run");
    }
    if (record.strategyRevision !== currentStrategyRevision) {
      driftReasons.push("strategy");
    }
    if (record.status !== currentStatus) {
      driftReasons.push("status");
    }
    if (record.summary.citationCount !== currentCitationCount) {
      driftReasons.push("citations");
    }
    if (record.summary.roundCount !== roundCount) {
      driftReasons.push("rounds");
    }
    if (record.summary.liveExecutionBlocked !== liveExecutionBlocked) {
      driftReasons.push("boundary");
    }

    return {
      aiReviewId: record.aiReviewId,
      createdAt: record.createdAt,
      strategyRevision: record.strategyRevision,
      citationCount: record.summary.citationCount,
      roundCount: record.summary.roundCount,
      liveExecutionBlocked: record.summary.liveExecutionBlocked,
      status: driftReasons.length ? "drift" : "matched",
      driftCount: driftReasons.length,
      driftReasons
    };
  });
}

export function filterAiReviewRecordDriftRows(
  rows: AiReviewRecordDriftRow[],
  query: string
): AiReviewRecordDriftRow[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }

  return rows.filter((row) =>
    [
      row.aiReviewId,
      row.createdAt,
      row.strategyRevision,
      row.status,
      row.driftCount.toString(),
      row.citationCount.toString(),
      row.roundCount.toString(),
      row.liveExecutionBlocked ? "paper only blocked" : "live open",
      ...row.driftReasons
    ]
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}
