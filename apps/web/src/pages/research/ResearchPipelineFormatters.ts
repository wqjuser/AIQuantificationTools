import { researchContextReadinessValue } from "../../components/ResearchContextReadinessPanel";
import type { AppI18n } from "../../lib/i18n";
import type { ResearchContextReadinessRow, ResearchPipelinePreflight } from "../../lib/terminal-workbench";

export function researchPipelinePreflightStatusLabel(i18n: AppI18n, preflight: ResearchPipelinePreflight): string {
  if (preflight.status === "ready") {
    return i18n.locale === "zh-CN" ? "研究上下文已就绪，可以运行流水线。" : preflight.summary;
  }
  if (preflight.status === "review") {
    return i18n.locale === "zh-CN"
      ? `研究上下文有 ${preflight.issues.length} 项需复核，运行前需要确认。`
      : preflight.summary;
  }
  return i18n.locale === "zh-CN"
    ? `研究上下文有 ${preflight.issues.filter((issue) => issue.status === "blocked").length} 项阻断，先修复后再运行流水线。`
    : preflight.summary;
}

export function researchPipelineLockedEvidenceLabel(i18n: AppI18n, preflight: ResearchPipelinePreflight): string {
  const evidence = preflight.lockedPreparationEvidence;
  if (!evidence) {
    return i18n.locale === "zh-CN" ? "未锁定刷新证据" : "No refresh evidence";
  }
  const shortRunId = compactEvidenceRunId(evidence.runId);
  return i18n.locale === "zh-CN" ? `锁定证据 · ${shortRunId}` : `Locks evidence · ${shortRunId}`;
}

export function researchPipelineLockedEvidenceTitle(i18n: AppI18n, preflight: ResearchPipelinePreflight): string {
  const evidence = preflight.lockedPreparationEvidence;
  if (!evidence) {
    return researchPipelinePreflightStatusLabel(i18n, preflight);
  }
  return i18n.locale === "zh-CN"
    ? `运行流水线将锁定刷新证据 ${evidence.runId}。${evidence.detail}`
    : `Run Pipeline will lock refresh evidence ${evidence.runId}. ${evidence.detail}`;
}

export function compactEvidenceRunId(runId: string): string {
  if (runId.length <= 24) {
    return runId;
  }
  return `${runId.slice(0, 12)}...${runId.slice(-6)}`;
}

export function researchPipelinePreflightIssueDetail(i18n: AppI18n, preflight: ResearchPipelinePreflight): string {
  const issueSummary = preflight.issues
    .slice(0, 3)
    .map(
      (issue) =>
        `${researchPipelinePreflightIssueLabel(i18n, issue)}: ${researchContextReadinessValue(i18n, issue)}`
    )
    .join(" · ");
  const summary = researchPipelinePreflightStatusLabel(i18n, preflight);
  return issueSummary ? `${summary} ${issueSummary}` : summary;
}

export function goldenPathActionPreflightHint(
  i18n: AppI18n,
  actionId: string | null | undefined,
  preflight: ResearchPipelinePreflight
): string | null {
  if (actionId !== "run-pipeline" || preflight.status === "ready") {
    return null;
  }
  return researchPipelinePreflightIssueDetail(i18n, preflight);
}

export function strategyDraftReauditHint(
  i18n: AppI18n,
  actionId: string | null | undefined,
  strategyDraftRequiresReaudit: boolean
): string | null {
  if (actionId !== "submit-paper-order" || !strategyDraftRequiresReaudit) {
    return null;
  }
  return i18n.locale === "zh-CN"
    ? "请先运行流水线审计当前策略草稿，再提交模拟委托。"
    : "Run Pipeline to audit this strategy draft before paper execution.";
}

export function researchPipelinePreflightIssueLabel(
  i18n: AppI18n,
  issue: ResearchPipelinePreflight["issues"][number]
): string {
  const labels: Record<ResearchContextReadinessRow["id"], string> = {
    instrument: "当前标的",
    watchlist: "自选状态",
    calendar: "交易日历",
    klines: "K线数据",
    cache: "本地缓存",
    refresh: "刷新证据",
    note: "研究笔记",
    workspace: "工作区状态"
  };
  return i18n.locale === "zh-CN" ? labels[issue.id] : issue.label;
}
