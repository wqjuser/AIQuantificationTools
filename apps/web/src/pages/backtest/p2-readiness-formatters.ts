import { type AppI18n } from "../../lib/i18n";
import { P0AcceptanceSummary, P2ManifestChainPreflightSummary, P2PaperReplaySummary, P2PreLiveAcceptanceSummary, P2ReadinessAcceptanceAuditEventReferenceSource, P2ReadinessAcceptanceSummary, P2ReadinessEvidenceCoverage, P2ReadinessEvidenceCoverageRow } from "../../lib/terminal-workbench";
import { Database, Search, ShieldCheck } from "lucide-react";

export function p2PreLiveAcceptanceSummaryStatusLabel(
  i18n: AppI18n,
  summary: P2PreLiveAcceptanceSummary
): string {
  if (i18n.locale === "en-US") {
    return summary.state;
  }
  return { invalid: "无效", missing: "缺失", passed: "已记录" }[summary.state];
}

export function p2PaperReplaySummaryStatusLabel(i18n: AppI18n, summary: P2PaperReplaySummary): string {
  if (i18n.locale === "en-US") {
    return summary.state;
  }
  return { invalid: "无效", missing: "缺失", passed: "已回读" }[summary.state];
}

export function p2PaperReplaySummaryHeadline(i18n: AppI18n, summary: P2PaperReplaySummary): string {
  if (i18n.locale === "en-US") {
    return summary.headline;
  }
  return (
    {
      "P2 paper replay manifest invalid": "P2 纸面回放清单无效",
      "P2 paper replay manifest missing": "P2 纸面回放清单缺失",
      "P2 paper replay manifest recorded": "P2 纸面回放已回读"
    }[summary.headline] ?? summary.headline
  );
}

export function p2PaperReplaySummaryDetail(i18n: AppI18n, summary: P2PaperReplaySummary): string {
  if (i18n.locale === "en-US") {
    return summary.detail;
  }
  if (summary.state === "passed") {
    const run = summary.runId ? `运行 ${summary.runId}` : "最近一次 P2 纸面回放";
    const context = [summary.market, summary.symbol, summary.timeframe].filter(Boolean).join(" ");
    const adapter = summary.adapterId ? ` · 适配器 ${summary.adapterId}` : "";
    return `${run} · ${context || "未绑定上下文"}${adapter} · ${summary.passedCheckCount}/${
      summary.totalCheckCount
    } 项回放证据 · ${summary.warningCount} 个警告 · 实盘仍阻断。`;
  }
  if (summary.state === "invalid") {
    return `P2 纸面回放未通过校验：${summary.detail
      .replace("P2 paper replay evidence is invalid: ", "")
      .replace("Live trading remains blocked and direct order submission stays disabled.", "")}；下单通道和实盘仍阻断。`;
  }
  return `运行 P2 纸面回放 manifest 后会在这里读取 ${summary.sourcePath}；缺失时不能把回放证据当作便携验收材料。`;
}

export function p2PaperReplayBoundaryLabel(i18n: AppI18n, summary: P2PaperReplaySummary): string {
  if (
    summary.reportedOrderSubmissionEnabled ||
    summary.reportedLiveTradingAllowed ||
    summary.reportedLiveOrderSubmitted ||
    summary.reportedRouteExecuted
  ) {
    return i18n.locale === "zh-CN"
      ? "manifest 声称存在实盘/下单动作，平台已阻断"
      : "Manifest reports live or order activity; platform blocks it";
  }
  if (!summary.liveBlockedBoundary) {
    return i18n.locale === "zh-CN"
      ? "manifest 缺少实盘阻断边界，平台已阻断"
      : "Manifest lacks live-blocked boundary; platform blocks it";
  }
  return i18n.locale === "zh-CN"
    ? "回放证据可复核，实盘保持阻断"
    : "Replay evidence is reviewable; live trading blocked";
}

export function p2ManifestChainPreflightStatusLabel(
  i18n: AppI18n,
  status: P2ManifestChainPreflightSummary["state"]
): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { blocked: "阻断", invalid: "无效", missing: "缺失", ready: "就绪" }[status];
}

export function p2ManifestChainPreflightHeadline(i18n: AppI18n, summary: P2ManifestChainPreflightSummary): string {
  if (i18n.locale === "en-US") {
    return summary.headline;
  }
  return (
    {
      "P2 manifest chain blocked": "P2 manifest 链路被阻断",
      "P2 manifest chain preflight invalid": "P2 manifest 链路预检无效",
      "P2 manifest chain preflight missing": "P2 manifest 链路预检缺失",
      "P2 manifest chain ready": "P2 manifest 链路已就绪"
    }[summary.headline] ?? summary.headline
  );
}

export function p2ManifestChainPreflightDetail(i18n: AppI18n, summary: P2ManifestChainPreflightSummary): string {
  if (i18n.locale === "en-US") {
    return summary.detail;
  }
  if (summary.state === "ready") {
    return `${summary.validStageCount}/${summary.totalStageCount} 个归档 manifest 已通过校验；仍只允许审计复核，不授权实盘。`;
  }
  if (summary.state === "invalid") {
    return `预检报告未通过校验：${summary.detail
      .replace("P2 chain preflight evidence is invalid: ", "")
      .replace(". Direct order submission remains disabled and live trading remains blocked.", "")}；平台继续阻断下单和实盘。`;
  }
  if (summary.state === "missing") {
    return `运行 docker:smoke:p2:preflight 后会读取 ${summary.sourcePath}；缺失时先从 P1 验收开始补齐证据。`;
  }
  return `${summary.validStageCount}/${summary.totalStageCount} 个 manifest 已通过；下一步 ${summary.nextAction || "人工处理"}：${
    summary.nextCommand || "查看本地命令"
  }。`;
}

export function p2ManifestChainPreflightStageStatusLabel(
  i18n: AppI18n,
  status: P2ManifestChainPreflightSummary["stages"][number]["status"]
): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { invalid: "无效", missing: "缺失", valid: "有效" }[status];
}

export function p2EvidenceCoverageStatusLabel(
  i18n: AppI18n,
  status: P2ReadinessEvidenceCoverage["status"]
): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { blocked: "阻断", covered: "已覆盖", missing: "缺失", stale: "过期" }[status];
}

export function p2EvidenceCoverageHeadline(i18n: AppI18n, coverage: P2ReadinessEvidenceCoverage): string {
  if (i18n.locale === "en-US") {
    return coverage.headline;
  }
  return (
    {
      "P2 readiness evidence blocked": "P2 证据覆盖存在阻断",
      "P2 readiness evidence fully covered": "P2 证据已完整覆盖",
      "P2 readiness evidence incomplete": "P2 证据覆盖未完成",
      "P2 readiness evidence stale": "P2 证据覆盖已过期"
    }[coverage.headline] ?? coverage.headline
  );
}

export function p2EvidenceCoverageDetail(i18n: AppI18n, coverage: P2ReadinessEvidenceCoverage): string {
  if (i18n.locale === "en-US") {
    return coverage.detail;
  }
  return `${coverage.coveredCount}/${coverage.totalCount} 条 readiness 声明已有审计事件或本地 manifest；${coverage.blockingCount} 条仍阻断预实盘信心。直接下单和实盘交易仍关闭。`;
}

export function p2EvidenceCoverageRowLabel(
  i18n: AppI18n,
  rowId: P2ReadinessEvidenceCoverage["rows"][number]["id"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        "adapter-chain-health": "Adapter chain",
        "operator-runbook-audit": "Operator runbook",
        "p2-acceptance-manifest": "P2 acceptance",
        "p2-manifest-chain-preflight-review": "P2 preflight review",
        "paper-replay-manifest": "Paper replay",
        "pre-live-checklist": "Pre-live checklist",
        "safety-boundary": "Safety boundary"
      }[rowId] ?? rowId
    );
  }
  return (
    {
      "adapter-chain-health": "适配器链路",
      "operator-runbook-audit": "操作手册审计",
      "p2-acceptance-manifest": "P2 验收清单",
      "p2-manifest-chain-preflight-review": "P2 预检复核",
      "paper-replay-manifest": "纸面回放清单",
      "pre-live-checklist": "预实盘 checklist",
      "safety-boundary": "安全边界"
    }[rowId] ?? rowId
  );
}

export function p2EvidenceCoverageSourceLabel(
  i18n: AppI18n,
  sourceType: P2ReadinessEvidenceCoverage["rows"][number]["sourceType"]
): string {
  if (i18n.locale === "en-US") {
    return sourceType;
  }
  return { audit: "审计", "local-state": "本地状态", manifest: "manifest", "safety-boundary": "边界" }[
    sourceType
  ];
}

export function p2EvidenceCoverageRowActionLabel(i18n: AppI18n, row: P2ReadinessEvidenceCoverageRow): string {
  switch (row.sourceType) {
    case "manifest":
      return i18n.locale === "zh-CN" ? "清单" : "Manifest";
    case "audit":
      return i18n.locale === "zh-CN" ? "审计" : "Audit";
    case "local-state":
      return i18n.locale === "zh-CN" ? "工作区" : "Workspace";
    case "safety-boundary":
      return i18n.locale === "zh-CN" ? "边界" : "Boundary";
  }
}

export function p2EvidenceCoverageRowActionIcon(row: P2ReadinessEvidenceCoverageRow): typeof ShieldCheck {
  switch (row.sourceType) {
    case "audit":
    case "safety-boundary":
      return ShieldCheck;
    case "manifest":
      return Database;
    case "local-state":
      return Search;
  }
}

export function p2ReadinessAcceptanceStatusLabel(
  i18n: AppI18n,
  status: P2ReadinessAcceptanceSummary["status"]
): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { accepted: "已验收", blocked: "阻断", incomplete: "未完成" }[status];
}

export function p2ReadinessAcceptanceRowStatusLabel(
  i18n: AppI18n,
  status: P2ReadinessAcceptanceSummary["rows"][number]["status"]
): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { blocked: "阻断", missing: "缺失", passed: "通过" }[status];
}

export function p2ReadinessAcceptanceHeadline(i18n: AppI18n, summary: P2ReadinessAcceptanceSummary): string {
  if (i18n.locale === "en-US") {
    return summary.headline;
  }
  return (
    {
      "P2 pre-live readiness accepted": "P2 预实盘验收通过",
      "P2 pre-live readiness blocked": "P2 预实盘验收阻断",
      "P2 pre-live readiness incomplete": "P2 预实盘验收未完成"
    }[summary.headline] ?? summary.headline
  );
}

export function p2ReadinessAcceptanceDetail(i18n: AppI18n, summary: P2ReadinessAcceptanceSummary): string {
  if (i18n.locale === "en-US") {
    return summary.detail;
  }
  return `${summary.acceptedCount}/${summary.totalCount} 项 P2 验收定义通过；${summary.blockingCount} 项仍阻断最终预实盘验收。直接下单和实盘交易仍关闭。`;
}

export function p2ReadinessAcceptanceAuditEventSourceLabel(
  i18n: AppI18n,
  source: P2ReadinessAcceptanceAuditEventReferenceSource
): string {
  if (i18n.locale === "en-US") {
    return {
      ledger: "Source · ledger rehydrated",
      none: "Source · not linked",
      response: "Source · latest response"
    }[source];
  }
  return {
    ledger: "来源 · 台账回填",
    none: "来源 · 未定位",
    response: "来源 · 本次响应"
  }[source];
}

export function p2ReadinessAcceptanceRowLabel(
  i18n: AppI18n,
  rowId: P2ReadinessAcceptanceSummary["rows"][number]["id"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        "live-blocked-boundary": "Live boundary",
        "p1-acceptance": "P1 acceptance",
        "p2-pre-live-manifest": "P2 manifest",
        "paper-execution-replay": "Paper replay",
        "pre-live-checklist": "Pre-live checklist",
        "readiness-evidence-coverage": "Evidence coverage"
      }[rowId] ?? rowId
    );
  }
  return (
    {
      "live-blocked-boundary": "实盘阻断边界",
      "p1-acceptance": "P1 研究验收",
      "p2-pre-live-manifest": "P2 manifest",
      "paper-execution-replay": "纸面回放",
      "pre-live-checklist": "预实盘清单",
      "readiness-evidence-coverage": "证据覆盖"
    }[rowId] ?? rowId
  );
}

export function p2PreLiveAcceptanceSummaryHeadline(i18n: AppI18n, summary: P2PreLiveAcceptanceSummary): string {
  if (i18n.locale === "en-US") {
    return summary.headline;
  }
  return (
    {
      "P2 pre-live acceptance manifest invalid": "P2 实盘前验收清单无效",
      "P2 pre-live acceptance manifest missing": "P2 实盘前验收清单缺失",
      "P2 pre-live acceptance recorded": "P2 实盘前验收已回读"
    }[summary.headline] ?? summary.headline
  );
}

export function p2PreLiveAcceptanceSummaryDetail(i18n: AppI18n, summary: P2PreLiveAcceptanceSummary): string {
  if (i18n.locale === "en-US") {
    return summary.detail;
  }
  if (summary.state === "passed") {
    const run = summary.runId ? `运行 ${summary.runId}` : "最近一次 P2 实盘前验收";
    const context = [summary.market, summary.symbol, summary.timeframe].filter(Boolean).join(" ");
    const adapter = summary.adapterId ? ` · 适配器 ${summary.adapterId}` : "";
    return `${run} · ${context || "未绑定上下文"}${adapter} · ${summary.passedGateCount}/${
      summary.totalGateCount
    } 个闸门通过 · ${summary.blockingGateCount} 个阻断 · 实盘仍阻断。`;
  }
  if (summary.state === "invalid") {
    return `P2 实盘前验收未通过校验：${summary.detail
      .replace("P2 pre-live evidence is invalid: ", "")
      .replace(". Direct order submission remains disabled and live trading remains blocked.", "")}；下单通道和实盘仍阻断。`;
  }
  return `运行 P2 实盘前验收后会在这里读取 ${summary.sourcePath}；缺失时下单通道和实盘仍保持阻断。`;
}

export function p2PreLiveAcceptanceBoundaryLabel(i18n: AppI18n, summary: P2PreLiveAcceptanceSummary): string {
  if (
    summary.reportedOrderSubmissionEnabled ||
    summary.reportedLiveTradingAllowed ||
    summary.reportedLiveOrderSubmitted ||
    summary.reportedRouteExecuted
  ) {
    return i18n.locale === "zh-CN"
      ? "manifest 声称存在实盘/下单动作，平台已阻断"
      : "Manifest reports live or order activity; platform blocks it";
  }
  if (!summary.liveBlockedBoundary) {
    return i18n.locale === "zh-CN"
      ? "manifest 缺少实盘阻断边界，平台已阻断"
      : "Manifest lacks live-blocked boundary; platform blocks it";
  }
  return i18n.locale === "zh-CN"
    ? "下单通道关闭，实盘保持阻断"
    : "Order submission off and live trading blocked";
}

export function p0AcceptanceReviewStatusLabel(i18n: AppI18n, status: P0AcceptanceSummary["state"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { invalid: "无效", missing: "缺失", passed: "通过" }[status];
}

export function p0AcceptanceReviewBoundaryLabel(i18n: AppI18n, summary: P0AcceptanceSummary): string {
  if (summary.reportedLiveTradingAllowed) {
    return i18n.locale === "zh-CN"
      ? "manifest 声称允许实盘，平台已阻断"
      : "Manifest reports live allowed; platform blocks it";
  }
  if (!summary.liveBlockedBoundary) {
    return i18n.locale === "zh-CN"
      ? "缺少 live-blocked 边界，平台已阻断"
      : "Live-blocked boundary missing; platform blocks it";
  }
  return i18n.locale === "zh-CN" ? "paper-only · 实盘阻断" : "paper-only · live blocked";
}

export function p0AcceptanceReviewCheckLabel(i18n: AppI18n, checkId: string): string {
  if (i18n.locale === "en-US") {
    return checkId;
  }
  return (
    {
      p0_acceptance_manifest_invalid: "验收清单无效",
      p0_acceptance_manifest_missing: "验收清单缺失",
      p0_export_package_complete: "复现包完整",
      p0_import_replay_complete: "导入复现完整",
      p0_paper_simulation_audited: "模拟委托已审计",
      p0_pipeline_complete: "P0 流水线完成"
    }[checkId] ?? checkId
  );
}
