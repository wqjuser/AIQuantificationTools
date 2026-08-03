import type { ResearchRunAudit, ResearchRunContextBinding, StrategyExperimentEvidenceSummary, TerminalWorkspace } from "../core/workspace-contracts";
import { backtestAssumptionSpecs, defaultBacktestAssumptions, defaultStrategyRuleDraft, strategyTemplateOptions } from "../core/workspace-contracts";
import { formatConditionNumber, formatFractionPct, formatStrategyConditions, formatStrategyRisk, hasSmaConditionText, inferRsiCondition, inferVolumeWindow, normalizeInstrumentSymbol } from "../core/workspace-operations";
import { sha256TextHex } from "../research/readiness-builders";
import type { ResearchRunStrategyCondition, ResearchRunStrategyConfig, StrategyExperimentDetail, StrategyExperimentDimension, StrategyExperimentListItem } from "../research/workspace-contracts";
import type { Market, Timeframe } from "../stage1/foundation-contracts";
import type { BacktestAssumptionField, BacktestAssumptionRow, BacktestAssumptions, BacktestEvidenceCard, BacktestTradeRow, StrategyGovernanceQueueRow, StrategyGovernanceQueueStage, StrategyGovernanceQueueSummary, StrategyLibraryDraftItem, StrategyRuleDraft, StrategySnapshot, StrategyTemplateOption, StrategyVersionDiffRow } from "../stage1/review-contracts";
import { formatPercentValue, inferPercent, inferPercentNearKeywords, inferSmaConditionKind, inferSmaWindow, isPendingStrategyText, isRsiConditionKind, metricValue, normalizeDrawdownLoss, normalizeStrategyRuleDraft, rsiOperatorToConditionKind, strategyConditionSnapshotText } from "./backtest-builders";
import { calculatePaperQuantity, clearAuditedResearchResults } from "./comparison-builders";
import { formatAssumptionCurrency, inferExposureFromPosition, normalizeBacktestAssumptionValue, resolvePaperOrderPrice } from "./workflow-builders";

export function strategyGovernanceDetail({
  changedFields,
  contextLabel,
  item,
  latestAuditRunId,
  stage,
  validationDetail
}: {
  changedFields: StrategyVersionDiffRow["id"][];
  contextLabel: string;
  item: StrategyLibraryDraftItem;
  latestAuditRunId: string | null;
  stage: StrategyGovernanceQueueStage;
  validationDetail: string;
}): string {
  if (stage === "blocked") {
    return validationDetail;
  }
  if (stage === "imported") {
    return `Saved for ${contextLabel}; load as a cross-context draft before auditing in this workspace.`;
  }
  if (stage === "stale") {
    return `Current context changed in ${changedFields.join(", ")}; load this version and rerun an audit.`;
  }
  if (stage === "audited") {
    return `Audited version is backed by ${latestAuditRunId ?? item.auditRunId}.`;
  }
  return "Saved draft is valid but has no current audit evidence; load it and rerun the pipeline.";
}

export function buildStrategyGovernanceQueueSummary(
  rows: StrategyGovernanceQueueRow[]
): StrategyGovernanceQueueSummary {
  return {
    totalRows: rows.length,
    currentDraftCount: rows.filter((row) => row.stage === "current_draft").length,
    auditedCount: rows.filter((row) => row.stage === "audited").length,
    importedCount: rows.filter((row) => row.stage === "imported").length,
    staleCount: rows.filter((row) => row.stage === "stale").length,
    needsReauditCount: rows.filter((row) => row.stage === "needs_reaudit").length,
    blockedCount: rows.filter((row) => row.stage === "blocked").length
  };
}

export function strategyGovernanceQueueSort(left: StrategyGovernanceQueueRow, right: StrategyGovernanceQueueRow): number {
  const rank: Record<StrategyGovernanceQueueStage, number> = {
    current_draft: 0,
    blocked: 1,
    needs_reaudit: 2,
    stale: 3,
    audited: 4,
    imported: 5
  };
  const rankDelta = rank[left.stage] - rank[right.stage];
  if (rankDelta !== 0) {
    return rankDelta;
  }
  return left.revision.localeCompare(right.revision);
}

export function buildStrategyRuleDraft(workspace: TerminalWorkspace): StrategyRuleDraft {
  const strategy = workspace.strategy;
  const entryRsiCondition = inferRsiCondition(strategy.entry);
  const exitRsiCondition = inferRsiCondition(strategy.exit);
  const entryVolumeWindow = inferVolumeWindow(strategy.entry);
  const hasEntrySmaCondition = hasSmaConditionText(strategy.entry);
  const isPrimaryEntryRsi = Boolean(entryRsiCondition && !hasEntrySmaCondition);
  const entryWindow = isPrimaryEntryRsi
    ? entryRsiCondition?.window ?? defaultStrategyRuleDraft.entryWindow
    : inferSmaWindow(strategy.entry, defaultStrategyRuleDraft.entryWindow);
  const exitWindow = exitRsiCondition?.window ?? inferSmaWindow(strategy.exit, defaultStrategyRuleDraft.exitWindow);

  return {
    name: strategy.name.trim() || defaultStrategyRuleDraft.name,
    entryKind: isPrimaryEntryRsi && entryRsiCondition
      ? rsiOperatorToConditionKind(entryRsiCondition.operator)
      : inferSmaConditionKind(strategy.entry, "close_above_sma"),
    entryWindow,
    entryThreshold: isPrimaryEntryRsi
      ? entryRsiCondition?.threshold ?? defaultStrategyRuleDraft.entryThreshold
      : defaultStrategyRuleDraft.entryThreshold,
    entryRsiConfirm: Boolean(entryRsiCondition && !isPrimaryEntryRsi),
    entryRsiWindow: entryRsiCondition?.window ?? defaultStrategyRuleDraft.entryRsiWindow,
    entryRsiThreshold: entryRsiCondition?.threshold ?? defaultStrategyRuleDraft.entryRsiThreshold,
    entryVolumeConfirm: entryVolumeWindow !== null,
    entryVolumeWindow: entryVolumeWindow ?? defaultStrategyRuleDraft.entryVolumeWindow,
    exitKind: exitRsiCondition
      ? rsiOperatorToConditionKind(exitRsiCondition.operator)
      : inferSmaConditionKind(strategy.exit, "close_below_sma"),
    exitWindow,
    exitThreshold: exitRsiCondition?.threshold ?? defaultStrategyRuleDraft.exitThreshold,
    positionPct: inferPercent(strategy.position, defaultStrategyRuleDraft.positionPct),
    stopLossPct: inferPercentNearKeywords(strategy.risk, ["stop", "止损"], defaultStrategyRuleDraft.stopLossPct),
    takeProfitPct: inferPercentNearKeywords(
      strategy.risk,
      ["take profit", "take-profit", "止盈"],
      defaultStrategyRuleDraft.takeProfitPct
    ),
    maxDrawdownPct: inferPercentNearKeywords(
      strategy.risk,
      ["drawdown", "回撤"],
      defaultStrategyRuleDraft.maxDrawdownPct
    ),
    paperOnly: !/\blive\b|实盘/u.test(strategy.risk.toLowerCase()) || /paper only|模拟/u.test(strategy.risk.toLowerCase())
  };
}

export function buildStrategyTemplateOptions(): StrategyTemplateOption[] {
  return strategyTemplateOptions.map((template) => ({
    ...template,
    draft: { ...template.draft }
  }));
}

export function strategyContextLabel(market: Market, symbol: string, timeframe: Timeframe): string {
  return `${market.toUpperCase()} · ${symbol} · ${timeframe}`;
}

export function findLatestResearchRunForContext(
  runs: readonly ResearchRunAudit[],
  context: { market: Market; symbol: string; timeframe: Timeframe }
): ResearchRunAudit | null {
  const symbol = normalizeInstrumentSymbol(context.market, context.symbol);
  return [...runs]
    .filter((run) =>
      run.market === context.market
      && normalizeInstrumentSymbol(run.market, run.symbol) === symbol
      && run.timeframe === context.timeframe
    )
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0] ?? null;
}

export function buildResearchRunContextBinding(workspace: TerminalWorkspace): ResearchRunContextBinding {
  const selectedContext = strategyContextLabel(
    workspace.selectedInstrument.market,
    workspace.selectedInstrument.symbol,
    workspace.selectedTimeframe
  );
  const run = workspace.researchRun;

  if (!run) {
    return {
      status: "missing",
      canUseRun: false,
      runId: null,
      selectedContext,
      runContext: null,
      detail: "Run Pipeline to bind a matching audited research run."
    };
  }

  const runMarket = run.market ?? workspace.selectedInstrument.market;
  const runSymbol = run.symbol ?? workspace.selectedInstrument.symbol;
  const runContext = strategyContextLabel(runMarket, runSymbol, run.timeframe);
  const matches =
    runMarket === workspace.selectedInstrument.market &&
    runSymbol === workspace.selectedInstrument.symbol &&
    run.timeframe === workspace.selectedTimeframe;

  if (matches) {
    return {
      status: "matched",
      canUseRun: true,
      runId: run.runId,
      selectedContext,
      runContext,
      detail: `Audited run ${run.runId} matches the selected research context.`
    };
  }

  return {
    status: "mismatched",
    canUseRun: false,
    runId: run.runId,
    selectedContext,
    runContext,
    detail: `Audited run ${run.runId} belongs to ${runContext}, not ${selectedContext}.`
  };
}

export function normalizeStrategyExperimentId(value: string | null | undefined): string | null {
  const experimentId = value?.trim() ?? "";
  return /^experiment-[A-Za-z0-9][A-Za-z0-9._:-]{0,109}$/.test(experimentId) ? experimentId : null;
}

export function resolveStrategyExperimentIdForCurrentSource(
  experiment: Pick<StrategyExperimentListItem, "experimentId" | "sourceRunId" | "strategyRevision"> | null,
  sourceKey: string | null
): string | null {
  return experiment && sourceKey === `${experiment.sourceRunId}:${experiment.strategyRevision}`
    ? normalizeStrategyExperimentId(experiment.experimentId)
    : null;
}

export function resolveStrategyExperimentIdFromUrl(
  search: string | URLSearchParams | null | undefined
): string | null {
  if (!search) {
    return null;
  }
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  const values = params.getAll("strategyExperiment");
  return values.length === 1 ? normalizeStrategyExperimentId(values[0]) : null;
}

export function replaceStrategyExperimentIdInUrl(href: string, experimentId: string | null): string {
  const url = new URL(href);
  const normalizedExperimentId = normalizeStrategyExperimentId(experimentId);
  url.searchParams.delete("strategyExperiment");
  if (normalizedExperimentId) {
    url.searchParams.set("strategyExperiment", normalizedExperimentId);
  }
  return url.toString();
}

export function buildStrategyExperimentEvidenceSummary(
  workspace: TerminalWorkspace,
  experiment: StrategyExperimentDetail | null
): StrategyExperimentEvidenceSummary | null {
  const run = workspace.researchRun;
  const definition = experiment?.definition;
  const snapshot = experiment?.snapshot;
  const dataSnapshot = run?.dataSnapshot;
  if (
    !experiment ||
    experiment.status !== "completed" ||
    !run ||
    !definition ||
    !snapshot ||
    dataSnapshot?.hashVersion !== "aiqt-data-v2" ||
    !buildResearchRunContextBinding(workspace).canUseRun ||
    experiment.strategyRevision !== run.strategyRevision ||
    experiment.strategyRevision !== definition.strategyRevision ||
    experiment.strategyRevision !== definition.baseStrategy.revision ||
    experiment.sourceRunId !== run.runId ||
    experiment.sourceRunId !== definition.sourceRunId ||
    experiment.snapshotId !== definition.snapshotId ||
    experiment.snapshotId !== snapshot.snapshotId ||
    dataSnapshot.hash !== definition.canonicalDataHash ||
    dataSnapshot.hash !== snapshot.canonicalDataHash ||
    experiment.market !== workspace.selectedInstrument.market ||
    experiment.market !== run.market ||
    experiment.market !== definition.market ||
    experiment.market !== definition.baseStrategy.market ||
    experiment.market !== snapshot.market ||
    experiment.symbol !== workspace.selectedInstrument.symbol ||
    experiment.symbol !== run.symbol ||
    experiment.symbol !== definition.symbol ||
    definition.baseStrategy.symbols.length !== 1 ||
    experiment.symbol !== definition.baseStrategy.symbols[0] ||
    experiment.symbol !== snapshot.symbol ||
    experiment.timeframe !== workspace.selectedTimeframe ||
    experiment.timeframe !== run.timeframe ||
    experiment.timeframe !== definition.timeframe ||
    experiment.timeframe !== definition.baseStrategy.timeframe ||
    experiment.timeframe !== snapshot.timeframe ||
    !experiment.resultHash ||
    !experiment.selectedCandidateId
  ) {
    return null;
  }

  const candidate = experiment.candidates.find(
    (item) => item.candidateId === experiment.selectedCandidateId
  );
  if (!candidate?.testMetrics) {
    return null;
  }

  return {
    experimentId: experiment.experimentId,
    definitionHash: experiment.definitionHash,
    resultHash: experiment.resultHash,
    selectedCandidateId: experiment.selectedCandidateId,
    candidateRevision: candidate.candidateRevision,
    parameters: candidate.parameters,
    trainMetrics: candidate.trainMetrics,
    validationMetrics: candidate.validationMetrics,
    testMetrics: candidate.testMetrics,
    holdoutStatus: experiment.holdoutStatus
  };
}

export const strategyExperimentSupportedParameters: Record<
  string,
  readonly StrategyExperimentDimension["parameter"][]
> = {
  close_above_sma: ["window"],
  close_below_sma: ["window"],
  volume_above_sma: ["window"],
  rsi_below: ["window", "threshold"],
  rsi_above: ["window", "threshold"]
};

export function buildDefaultStrategyExperimentDimensions(
  strategyConfig: ResearchRunStrategyConfig
): StrategyExperimentDimension[] {
  const dimensions: StrategyExperimentDimension[] = [];

  const appendDimensions = (
    conditionSide: StrategyExperimentDimension["conditionSide"],
    conditions: ResearchRunStrategyCondition[]
  ) => {
    conditions.forEach((condition, conditionIndex) => {
      (strategyExperimentSupportedParameters[condition.kind] ?? []).forEach((parameter) => {
        const currentValue = condition.params[parameter];
        if (
          typeof currentValue === "number" &&
          isValidStrategyExperimentParameterValue(parameter, currentValue)
        ) {
          dimensions.push({ conditionSide, conditionIndex, parameter, values: [currentValue] });
        }
      });
    });
  };

  appendDimensions("entry", strategyConfig.entryConditions);
  appendDimensions("exit", strategyConfig.exitConditions);

  let candidateCount = 1;
  dimensions.forEach((dimension) => {
    const currentValue = dimension.values[0];
    [-5, 5].forEach((offset) => {
      const value = currentValue + offset;
      const nextCandidateCount = (candidateCount / dimension.values.length) * (dimension.values.length + 1);
      if (
        nextCandidateCount <= 81 &&
        isValidStrategyExperimentParameterValue(dimension.parameter, value) &&
        !dimension.values.includes(value)
      ) {
        dimension.values.push(value);
        candidateCount = nextCandidateCount;
      }
    });
    dimension.values.sort((left, right) => left - right);
  });

  return dimensions;
}

export function isValidStrategyExperimentParameterValue(
  parameter: StrategyExperimentDimension["parameter"],
  value: number
): boolean {
  return Number.isFinite(value) &&
    (parameter === "window" ? Number.isInteger(value) && value >= 1 && value <= 250 : value >= 0 && value <= 100);
}

export function strategySnapshotFromStrategyConfig(
  strategyConfig: ResearchRunStrategyConfig
): StrategySnapshot {
  return {
    name: strategyConfig.name,
    entry: formatStrategyConditions(strategyConfig.entryConditions),
    exit: formatStrategyConditions(strategyConfig.exitConditions),
    position:
      strategyConfig.risk.positionPct === null
        ? "Position cap unavailable"
        : `${formatFractionPct(strategyConfig.risk.positionPct)} position cap`,
    risk: formatStrategyRisk(strategyConfig.risk)
  };
}

export async function workspaceWithStrategyExperimentCandidate(
  workspace: TerminalWorkspace,
  experiment: StrategyExperimentDetail,
  candidateId: string
): Promise<TerminalWorkspace> {
  const candidate = experiment.candidates.find((item) => item.candidateId === candidateId);
  if (!candidate || !candidate.candidateRevision.trim()) {
    return workspace;
  }

  const baseStrategy = experiment.definition.baseStrategy;
  const dimensions = new Map<string, StrategyExperimentDimension>();
  for (const dimension of experiment.definition.dimensions) {
    const conditions =
      dimension.conditionSide === "entry"
        ? baseStrategy.entryConditions
        : dimension.conditionSide === "exit"
          ? baseStrategy.exitConditions
          : null;
    if (
      !conditions ||
      !Number.isInteger(dimension.conditionIndex) ||
      dimension.conditionIndex < 0 ||
      dimension.conditionIndex >= conditions.length
    ) {
      return workspace;
    }
    const condition = conditions[dimension.conditionIndex];
    if (
      !strategyExperimentSupportedParameters[condition.kind]?.includes(dimension.parameter) ||
      !dimension.values.length ||
      !dimension.values.every((value) =>
        isValidStrategyExperimentParameterValue(dimension.parameter, value)
      )
    ) {
      return workspace;
    }
    const target = `${dimension.conditionSide}:${dimension.conditionIndex}:${dimension.parameter}`;
    if (dimensions.has(target)) {
      return workspace;
    }
    dimensions.set(target, dimension);
  }
  if (!dimensions.size || candidate.parameters.length !== dimensions.size) {
    return workspace;
  }

  const targets = new Set<string>();
  for (const parameterPatch of candidate.parameters) {
    const conditions =
      parameterPatch.conditionSide === "entry"
        ? baseStrategy.entryConditions
        : parameterPatch.conditionSide === "exit"
          ? baseStrategy.exitConditions
          : null;
    if (
      !conditions ||
      !Number.isInteger(parameterPatch.conditionIndex) ||
      parameterPatch.conditionIndex < 0 ||
      parameterPatch.conditionIndex >= conditions.length
    ) {
      return workspace;
    }
    const condition = conditions[parameterPatch.conditionIndex];
    if (
      !strategyExperimentSupportedParameters[condition.kind]?.includes(parameterPatch.parameter) ||
      !isValidStrategyExperimentParameterValue(parameterPatch.parameter, parameterPatch.value)
    ) {
      return workspace;
    }
    const target = `${parameterPatch.conditionSide}:${parameterPatch.conditionIndex}:${parameterPatch.parameter}`;
    const dimension = dimensions.get(target);
    if (!dimension || !dimension.values.includes(parameterPatch.value) || targets.has(target)) {
      return workspace;
    }
    targets.add(target);
  }

  const strategyConfig: ResearchRunStrategyConfig = {
    ...baseStrategy,
    entryConditions: baseStrategy.entryConditions.map((condition) => ({
      ...condition,
      params: { ...condition.params }
    })),
    exitConditions: baseStrategy.exitConditions.map((condition) => ({
      ...condition,
      params: { ...condition.params }
    })),
    risk: { ...baseStrategy.risk }
  };
  candidate.parameters.forEach((parameterPatch) => {
    const conditions =
      parameterPatch.conditionSide === "entry"
        ? strategyConfig.entryConditions
        : strategyConfig.exitConditions;
    conditions[parameterPatch.conditionIndex].params[parameterPatch.parameter] = parameterPatch.value;
  });
  const expectedRevision = (
    await sha256TextHex(pythonStrategyRevisionJson(strategyConfig))
  ).slice(0, 12);
  if (expectedRevision !== candidate.candidateRevision) {
    return workspace;
  }
  const candidateStrategyConfig = { ...strategyConfig, revision: expectedRevision };

  return clearAuditedResearchResults(
    {
      ...workspace,
      strategy: strategySnapshotFromStrategyConfig(candidateStrategyConfig),
      decisionLog: [
        {
          agent: "Strategy Experiment",
          message: `Candidate ${candidate.candidateId} revision ${candidateStrategyConfig.revision} staged from persisted experiment ${experiment.experimentId}. Run Pipeline to generate fresh audited backtest, AI review, paper, and promotion evidence.`,
          tone: "warning"
        }
      ]
    },
    "strategy"
  );
}

export interface PythonFloatJsonValue {
  pythonFloat: number;
}

export function pythonStrategyRevisionJson(strategyConfig: ResearchRunStrategyConfig): string {
  const conditionPayload = (condition: ResearchRunStrategyCondition) => ({
    kind: condition.kind,
    params: Object.fromEntries(
      Object.entries(condition.params).map(([key, value]) => [
        key,
        key === "threshold" && typeof value === "number" && !Number.isInteger(value)
          ? pythonFloatJsonValue(value)
          : value
      ])
    )
  });
  return pythonCanonicalJson({
    name: strategyConfig.name,
    market: strategyConfig.market,
    symbols: strategyConfig.symbols,
    timeframe: strategyConfig.timeframe,
    entry_conditions: strategyConfig.entryConditions.map(conditionPayload),
    exit_conditions: strategyConfig.exitConditions.map(conditionPayload),
    risk: {
      position_pct: pythonFloatJsonValue(strategyConfig.risk.positionPct),
      stop_loss_pct: pythonFloatJsonValue(strategyConfig.risk.stopLossPct),
      take_profit_pct: pythonFloatJsonValue(strategyConfig.risk.takeProfitPct),
      max_drawdown_pct: pythonFloatJsonValue(strategyConfig.risk.maxDrawdownPct)
    },
    version: strategyConfig.version
  });
}

export function pythonFloatJsonValue(value: number | null): PythonFloatJsonValue | null {
  return value === null ? null : { pythonFloat: value };
}

export function pythonCanonicalJson(value: unknown): string {
  if (isPythonFloatJsonValue(value)) {
    return pythonFloatJsonToken(value.pythonFloat);
  }
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Strategy revision numbers must be finite.");
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => pythonCanonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
      .map((key) => `${JSON.stringify(key)}:${pythonCanonicalJson(record[key])}`)
      .join(",")}}`;
  }
  throw new TypeError("Strategy revision payload contains an unsupported value.");
}

export function isPythonFloatJsonValue(value: unknown): value is PythonFloatJsonValue {
  return value !== null &&
    typeof value === "object" &&
    Object.keys(value).length === 1 &&
    typeof (value as PythonFloatJsonValue).pythonFloat === "number";
}

export function pythonFloatJsonToken(value: number): string {
  if (!Number.isFinite(value)) {
    throw new TypeError("Strategy revision risk values must be finite.");
  }
  if (Object.is(value, -0)) {
    return "-0.0";
  }
  if (value === 0) {
    return "0.0";
  }
  const absoluteValue = Math.abs(value);
  if (absoluteValue < 1e-4 || absoluteValue >= 1e16) {
    return value
      .toExponential()
      .replace(/e([+-])(\d+)$/u, (_match, sign: string, exponent: string) =>
        `e${sign}${exponent.padStart(2, "0")}`
      );
  }
  return Number.isInteger(value) ? `${value.toString()}.0` : value.toString();
}

export function normalizeDiffValue(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function strategySnapshotFromRuleDraft(draft: StrategyRuleDraft): StrategySnapshot {
  const normalizedDraft = normalizeStrategyRuleDraft(draft);
  const entrySignal = strategyConditionSnapshotText(
    normalizedDraft.entryKind,
    normalizedDraft.entryWindow,
    normalizedDraft.entryThreshold
  );
  const entrySignals = [entrySignal];
  if (normalizedDraft.entryRsiConfirm && !isRsiConditionKind(normalizedDraft.entryKind)) {
    entrySignals.push(`RSI${normalizedDraft.entryRsiWindow} > ${formatConditionNumber(normalizedDraft.entryRsiThreshold)}`);
  }
  if (normalizedDraft.entryVolumeConfirm) {
    entrySignals.push(`Volume > VOL${normalizedDraft.entryVolumeWindow}`);
  }
  return {
    name: normalizedDraft.name,
    entry: entrySignals.join(" AND "),
    exit: strategyConditionSnapshotText(normalizedDraft.exitKind, normalizedDraft.exitWindow, normalizedDraft.exitThreshold),
    position: `${formatPercentValue(normalizedDraft.positionPct)}% max capital allocation`,
    risk: [
      `Stop -${formatPercentValue(normalizedDraft.stopLossPct)}%`,
      `take profit +${formatPercentValue(normalizedDraft.takeProfitPct)}%`,
      `drawdown guard ${formatPercentValue(normalizedDraft.maxDrawdownPct)}%`,
      normalizedDraft.paperOnly ? "paper only" : "live gated"
    ].join(", ")
  };
}

export function buildBacktestTradeRows(workspace: TerminalWorkspace): BacktestTradeRow[] {
  if (workspace.backtestTrades?.length) {
    return workspace.backtestTrades;
  }

  const price = resolvePaperOrderPrice(workspace);
  const quantity = calculatePaperQuantity(workspace.selectedInstrument.market, price);
  const returnMetric = metricValue(workspace, "Return", "N/A");
  const drawdownMetric = metricValue(workspace, "Max DD", "N/A");
  const exposure = inferExposureFromPosition(workspace.strategy.position);
  const entryTone: BacktestTradeRow["tone"] = returnMetric.startsWith("-") ? "warning" : "positive";

  return [
    {
      id: "entry-fill",
      timestamp: "T+0",
      symbol: workspace.selectedInstrument.symbol,
      side: "BUY",
      status: isPendingStrategyText(workspace.strategy.entry) ? "blocked" : "filled",
      price: price.toFixed(2),
      quantity: String(quantity),
      exposure,
      pnl: returnMetric,
      reason: workspace.strategy.entry,
      tone: isPendingStrategyText(workspace.strategy.entry) ? "warning" : entryTone
    },
    {
      id: "risk-review",
      timestamp: "T+1",
      symbol: workspace.selectedInstrument.symbol,
      side: "RISK",
      status: "review",
      price: "-",
      quantity: "-",
      exposure: "drawdown",
      pnl: normalizeDrawdownLoss(drawdownMetric),
      reason: workspace.strategy.risk,
      tone: "warning"
    },
    {
      id: "exit-review",
      timestamp: "T+2",
      symbol: workspace.selectedInstrument.symbol,
      side: "SELL",
      status: isPendingStrategyText(workspace.strategy.exit) ? "blocked" : "open",
      price: price.toFixed(2),
      quantity: String(quantity),
      exposure,
      pnl: returnMetric,
      reason: workspace.strategy.exit,
      tone: "neutral"
    }
  ];
}

export function resolveBacktestAssumptions(workspace: TerminalWorkspace): BacktestAssumptions {
  return normalizeBacktestAssumptions(workspace.backtestAssumptions);
}

export function normalizeBacktestAssumptions(current?: Partial<BacktestAssumptions>): BacktestAssumptions {
  const assumptions = current ?? defaultBacktestAssumptions;
  return {
    initialCash: normalizeBacktestAssumptionValue(
      "initialCash",
      assumptions.initialCash,
      defaultBacktestAssumptions.initialCash
    ),
    feeBps: normalizeBacktestAssumptionValue("feeBps", assumptions.feeBps, defaultBacktestAssumptions.feeBps),
    slippageBps: normalizeBacktestAssumptionValue(
      "slippageBps",
      assumptions.slippageBps,
      defaultBacktestAssumptions.slippageBps
    )
  };
}

export function buildBacktestAssumptionRows(workspace: TerminalWorkspace): BacktestAssumptionRow[] {
  const assumptions = resolveBacktestAssumptions(workspace);
  return (Object.keys(backtestAssumptionSpecs) as BacktestAssumptionField[]).map((field) => ({
    field,
    ...backtestAssumptionSpecs[field],
    value: assumptions[field]
  }));
}

export function buildBacktestEvidenceCards(workspace: TerminalWorkspace): BacktestEvidenceCard[] {
  const assumptions = resolveBacktestAssumptions(workspace);
  const diagnostics = workspace.backtestDiagnostics ?? [];
  const firstDiagnostic = diagnostics[0];
  const run = workspace.researchRun;
  const contextBinding = buildResearchRunContextBinding(workspace);
  const snapshotIdentity = run?.dataSnapshot?.snapshotHash ?? run?.dataSnapshot?.hash;

  return [
    run && contextBinding.canUseRun
      ? {
          id: "run",
          label: "Run package",
          value: run.runId,
          detail: `${run.dataRows} ${run.timeframe} bars · audited backtest${snapshotIdentity ? ` · snapshot ${snapshotIdentity.slice(0, 16)}` : ""}`,
          tone: "positive"
        }
      : run
        ? {
            id: "run",
            label: "Run package",
            value: run.runId,
            detail: contextBinding.detail,
            tone: "risk"
          }
      : {
          id: "run",
          label: "Run package",
          value: "Draft workspace",
          detail: "Run Pipeline to bind a reproducible run id.",
          tone: "warning"
        },
    {
      id: "strategy",
      label: "Strategy revision",
      value: run?.strategyRevision ?? "Local draft",
      detail: workspace.strategy.name,
      tone: run ? (contextBinding.canUseRun ? "positive" : "risk") : "warning"
    },
    {
      id: "costs",
      label: "Cost model",
      value: `${assumptions.feeBps} bps / ${assumptions.slippageBps} bps`,
      detail: `Cash ${formatAssumptionCurrency(assumptions.initialCash)}`,
      tone: "neutral"
    },
    {
      id: "diagnostics",
      label: "Diagnostics",
      value: diagnostics.length === 1 ? "1 check" : `${diagnostics.length} checks`,
      detail: firstDiagnostic
        ? `${firstDiagnostic.label}: ${firstDiagnostic.detail}`
        : "No core diagnostics supplied yet.",
      tone: firstDiagnostic?.tone ?? "warning"
    }
  ];
}
