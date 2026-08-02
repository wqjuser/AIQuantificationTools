import { type AppI18n } from "../../lib/i18n";
import { ResearchRunAudit } from "../../lib/terminal-workbench";

export function historyRunDetailLabel(i18n: AppI18n, run: ResearchRunAudit): string {
  const rows = i18n.t("history.rows", { count: run.dataRows });
  const revision = `${i18n.t("history.revision")}: ${run.strategyRevision}`;
  const execution = `${i18n.t("history.execution")}: ${historyExecutionModeLabel(i18n, run.executionMode)}`;
  const assumptions = historyAssumptionLabel(i18n, run);
  return assumptions ? `${rows} · ${revision} · ${execution} · ${assumptions}` : `${rows} · ${revision} · ${execution}`;
}

export function historyExecutionModeLabel(i18n: AppI18n, mode: string): string {
  if (i18n.locale === "zh-CN") {
    return mode.replace("paper_only", "模拟盘").replace("certified_live", "认证实盘").replace("blocked_live", "实盘阻断");
  }
  return mode;
}

export function historyAssumptionLabel(i18n: AppI18n, run: ResearchRunAudit): string | null {
  if (!run.backtestAssumptions) {
    return null;
  }
  const cash = run.backtestAssumptions.initialCash.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (i18n.locale === "zh-CN") {
    return `资金 ${cash} / 手续费 ${run.backtestAssumptions.feeBps}基点 / 滑点 ${run.backtestAssumptions.slippageBps}基点`;
  }
  return `Cash ${cash} / Fee ${run.backtestAssumptions.feeBps}bps / Slippage ${run.backtestAssumptions.slippageBps}bps`;
}

export function historyComparisonLabel(i18n: AppI18n, label: string): string {
  if (label === "Assumptions") {
    return i18n.locale === "zh-CN" ? "回测假设" : label;
  }
  return i18n.metricLabel(label);
}

export function historyComparisonDeltaLabel(i18n: AppI18n, delta: string): string {
  if (delta === "changed") {
    return i18n.t("history.changed");
  }
  if (delta === "same") {
    return i18n.t("history.unchanged");
  }
  return delta;
}

export function historyComparisonValue(i18n: AppI18n, value: string): string {
  if (i18n.locale === "en-US") {
    return value;
  }
  return value.replace("Cash", "资金").replace("Fee", "手续费").replace("Slippage", "滑点").replaceAll("bps", "基点");
}
