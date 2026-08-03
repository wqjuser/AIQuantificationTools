import type { ResearchRunAudit, TerminalWorkspace } from "./workspace-contracts";
import { activeQuantLoopStepId, buildPrimaryQuantLoopSteps } from "./workspace-contracts";
import { workspaceWithSelectedInstrument, workspaceWithSelectedTimeframe } from "./workspace-operations";
import type { DecisionLogEntry } from "../portfolio/paper-contracts";
import type { Timeframe } from "../stage1/foundation-contracts";
import type { BacktestAssumptionField, BacktestAssumptions, Instrument, StrategyRuleDraft } from "../stage1/review-contracts";
import { normalizeStrategyRuleDraft } from "../strategy/backtest-builders";
import { clearAuditedResearchResults } from "../strategy/comparison-builders";
import { resolveBacktestAssumptions, strategySnapshotFromRuleDraft } from "../strategy/experiment-builders";
import { formatAssumptionCurrency, normalizeBacktestAssumptionValue } from "../strategy/workflow-builders";

export function workspaceWithAiStrategyDraft(
  currentWorkspace: TerminalWorkspace,
  draft: StrategyRuleDraft,
  reasons: string[]
): TerminalWorkspace {
  const nextDraft = normalizeStrategyRuleDraft({
    ...draft,
    paperOnly: true
  });
  const normalizedReasons = reasons
    .map((reason) => reason.trim())
    .filter(Boolean)
    .slice(0, 6);
  const note: DecisionLogEntry = {
    agent: "AI Strategy Assistant",
    message: [
      "AI 策略草稿已应用到当前结构化构建器，仍为仅模拟盘草稿。",
      normalizedReasons.length ? `编写原因：${normalizedReasons.join("；")}` : "",
      "该草稿尚未保存或运行；请重新运行研究流水线生成新的回测与审计证据。"
    ].filter(Boolean).join(" "),
    tone: "warning"
  };
  const existingLog = currentWorkspace.decisionLog[0]?.agent === note.agent
    ? currentWorkspace.decisionLog.slice(1)
    : currentWorkspace.decisionLog;

  return clearAuditedResearchResults(
    {
      ...currentWorkspace,
      strategy: strategySnapshotFromRuleDraft(nextDraft),
      decisionLog: [note, ...existingLog]
    },
    "strategy"
  );
}

export function workspaceWithBacktestAssumption(
  currentWorkspace: TerminalWorkspace,
  field: BacktestAssumptionField,
  value: number
): TerminalWorkspace {
  const currentAssumptions = resolveBacktestAssumptions(currentWorkspace);
  const nextAssumptions = {
    ...currentAssumptions,
    [field]: normalizeBacktestAssumptionValue(field, value, currentAssumptions[field])
  };
  const note: DecisionLogEntry = {
    agent: "Backtest Lab",
    message: `Backtest assumption ${field} updated locally. Run Pipeline to generate a fresh audited backtest.`,
    tone: "warning"
  };
  const existingLog =
    currentWorkspace.decisionLog[0]?.agent === "Backtest Lab"
      ? currentWorkspace.decisionLog.slice(1)
      : currentWorkspace.decisionLog;
  return {
    ...currentWorkspace,
    backtestAssumptions: nextAssumptions,
    quantLoop: buildPrimaryQuantLoopSteps("backtest", false),
    metrics: [
      { label: "Return", value: "N/A", tone: "neutral" },
      { label: "Max DD", value: "N/A", tone: "warning" },
      { label: "Win Rate", value: "N/A", tone: "neutral" },
      { label: "Trades", value: "0", tone: "neutral" }
    ],
    decisionLog: [note, ...existingLog],
    researchRun: null
  };
}

export function workspaceWithPreservedSelection(
  refreshedWorkspace: TerminalWorkspace,
  currentWorkspace: TerminalWorkspace
): TerminalWorkspace {
  const sameInstrument =
    refreshedWorkspace.selectedInstrument.symbol === currentWorkspace.selectedInstrument.symbol &&
    refreshedWorkspace.selectedInstrument.market === currentWorkspace.selectedInstrument.market;
  const sameTimeframe = refreshedWorkspace.selectedTimeframe === currentWorkspace.selectedTimeframe;

  let workspace = refreshedWorkspace;
  if (!sameInstrument) {
    workspace = workspaceWithSelectedInstrument(workspace, currentWorkspace.selectedInstrument);
  }
  if (!sameTimeframe) {
    workspace = workspaceWithSelectedTimeframe(workspace, currentWorkspace.selectedTimeframe);
  }
  return workspace;
}

export function workspaceWithPreservedInteractiveState(
  refreshedWorkspace: TerminalWorkspace,
  currentWorkspace: TerminalWorkspace
): TerminalWorkspace {
  const workspace = workspaceWithPreservedSelection(refreshedWorkspace, currentWorkspace);
  return {
    ...workspace,
    strategy: currentWorkspace.strategy,
    backtestAssumptions: resolveBacktestAssumptions(currentWorkspace),
    metrics: currentWorkspace.metrics,
    decisionLog: currentWorkspace.decisionLog,
    quantLoop: buildPrimaryQuantLoopSteps(
      activeQuantLoopStepId(currentWorkspace),
      Boolean(currentWorkspace.researchRun)
    ),
    researchRun: currentWorkspace.researchRun
  };
}

export function freshResearchContext(
  currentWorkspace: TerminalWorkspace,
  instrument: Instrument,
  timeframe: Timeframe
): TerminalWorkspace {
  return {
    ...currentWorkspace,
    selectedInstrument: instrument,
    selectedTimeframe: timeframe,
    quantLoop: buildPrimaryQuantLoopSteps("research", false),
    strategy: { ...currentWorkspace.strategy },
    metrics: [
      { label: "Return", value: "N/A", tone: "neutral" },
      { label: "Max DD", value: "N/A", tone: "warning" },
      { label: "Win Rate", value: "N/A", tone: "neutral" },
      { label: "Trades", value: "0", tone: "neutral" }
    ],
    decisionLog: [
      {
        agent: "Research Context",
        message: `${instrument.symbol} ${timeframe} selected. Run Pipeline to generate an audited backtest and agent review.`,
        tone: "ai"
      },
      {
        agent: "Risk Manager",
        message: "Previous audit results are cleared for this research context; live execution remains blocked.",
        tone: "risk"
      }
    ],
    researchRun: null
  };
}

export function formatSignedPct(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "N/A";
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatPct(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) {
    return "N/A";
  }
  return `${value.toFixed(2)}%`;
}

export function formatSignedPointDelta(value: number): string {
  if (!Number.isFinite(value)) {
    return "N/A";
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}pp`;
}

export function formatSignedIntegerDelta(value: number): string {
  if (!Number.isFinite(value)) {
    return "N/A";
  }
  return `${value >= 0 ? "+" : ""}${Math.round(value)}`;
}

export function metricNumber(run: ResearchRunAudit, key: string): number {
  const value = run.metrics[key];
  return Number.isFinite(value) ? value : 0;
}

export function formatAssumptionsForAudit(assumptions: BacktestAssumptions): string {
  return `Cash ${formatAssumptionCurrency(assumptions.initialCash)} · Fee ${assumptions.feeBps}bps · Slippage ${assumptions.slippageBps}bps`;
}
