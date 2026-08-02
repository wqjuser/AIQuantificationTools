import { Check, Copy, Download, Save, Search, Timer } from "lucide-react";
import { Panel } from "../../components/AppPanel";
import type { AppI18n } from "../../lib/i18n";
import type { OperatorRunbookAuditCoverage, OperatorRunbookSummary } from "../../lib/terminal-workbench";

export function OperatorRunbookPanel({
  auditCoverage,
  className,
  i18n,
  isCopied = false,
  isRecordingAudit = false,
  onCopy,
  onCopyAuditLink,
  onDownload,
  onFocusAudit,
  onRecordAudit,
  runbook
}: {
  auditCoverage: OperatorRunbookAuditCoverage;
  className?: string;
  i18n: AppI18n;
  isCopied?: boolean;
  isRecordingAudit?: boolean;
  onCopy?: () => void;
  onCopyAuditLink?: () => void;
  onDownload?: () => void;
  onFocusAudit?: () => void;
  onRecordAudit?: () => void;
  runbook: OperatorRunbookSummary;
}) {
  const controlRows = [
    ["killSwitch", runbook.controls.killSwitch],
    ["rollbackOwner", runbook.controls.rollbackOwner],
    ["positionLimit", runbook.controls.positionLimit],
    ["dataFreshness", runbook.controls.dataFreshness],
    ["environmentState", runbook.controls.environmentState],
    ["auditPackage", runbook.controls.auditPackage]
  ];
  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "操作员运行手册" : "Operator Runbook"}
      subtitle={i18n.locale === "zh-CN" ? "实盘前复核清单，仍不授权下单" : "Pre-live operator checklist; no order authorization"}
      className={className}
      action={
        <div className="operator-runbook-actions">
          {onCopy ? (
            <button onClick={onCopy} type="button">
              {isCopied ? <Check size={13} /> : <Copy size={13} />}
              <span>
                {isCopied
                  ? i18n.locale === "zh-CN"
                    ? "已复制"
                    : "Copied"
                  : i18n.locale === "zh-CN"
                    ? "复制报告"
                    : "Copy report"}
              </span>
            </button>
          ) : null}
          {onDownload ? (
            <button onClick={onDownload} type="button">
              <Download size={13} />
              <span>{i18n.locale === "zh-CN" ? "下载" : "Download"}</span>
            </button>
          ) : null}
          {onRecordAudit ? (
            <button disabled={isRecordingAudit} onClick={onRecordAudit} type="button">
              {isRecordingAudit ? <Timer size={13} /> : <Save size={13} />}
              <span>{operatorRunbookAuditRecordActionLabel(i18n, auditCoverage.status, isRecordingAudit)}</span>
            </button>
          ) : null}
        </div>
      }
    >
      <div className={`operator-runbook ${runbook.tone}`}>
        <div className="operator-runbook-head">
          <span>{operatorRunbookStatusLabel(i18n, runbook.status)}</span>
          <strong>{operatorRunbookHeadline(i18n, runbook.headline)}</strong>
          <p>{operatorRunbookSummaryText(i18n, runbook.summary)}</p>
          <em>
            {runbook.contextLabel} · {runbook.adapterId} · {runbook.completedSections}/{runbook.totalSections}
          </em>
          <small>{operatorRunbookNextActionText(i18n, runbook.nextAction)}</small>
        </div>
        <div className={`operator-runbook-audit ${auditCoverage.status}`}>
          <span>{operatorRunbookAuditCoverageStatusLabel(i18n, auditCoverage)}</span>
          <strong>{operatorRunbookAuditCoverageHeadline(i18n, auditCoverage)}</strong>
          <p>{operatorRunbookAuditCoverageDetail(i18n, auditCoverage.detail)}</p>
          {auditCoverage.latestEventId || auditCoverage.shortHash || auditCoverage.sectionLabel ? (
            <small className="operator-runbook-audit-meta" title={auditCoverage.latestEventId || auditCoverage.query}>
              {operatorRunbookAuditCoverageMetaLabel(i18n, auditCoverage)}
            </small>
          ) : null}
          {(auditCoverage.query && (onFocusAudit || onCopyAuditLink)) ||
          (auditCoverage.status !== "matched" && onRecordAudit) ? (
            <div className="operator-runbook-audit-actions">
              {onFocusAudit ? (
                <button onClick={onFocusAudit} type="button">
                  <Search size={12} />
                  <span>{i18n.locale === "zh-CN" ? "定位审计" : "Focus audit"}</span>
                </button>
              ) : null}
              {onCopyAuditLink ? (
                <button onClick={onCopyAuditLink} type="button">
                  <Copy size={12} />
                  <span>{i18n.locale === "zh-CN" ? "复制审计链接" : "Copy audit link"}</span>
                </button>
              ) : null}
              {auditCoverage.status !== "matched" && onRecordAudit ? (
                <button disabled={isRecordingAudit} onClick={onRecordAudit} type="button">
                  {isRecordingAudit ? <Timer size={12} /> : <Save size={12} />}
                  <span>{operatorRunbookAuditRecordActionLabel(i18n, auditCoverage.status, isRecordingAudit)}</span>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="operator-runbook-controls">
          {controlRows.map(([key, value]) => (
            <article key={key}>
              <span>{operatorRunbookControlLabel(i18n, key)}</span>
              <strong>{operatorRunbookControlValue(i18n, value)}</strong>
            </article>
          ))}
        </div>
        <div className="operator-runbook-sections">
          {runbook.sections.map((section) => (
            <article className={`operator-runbook-section ${section.tone}`} key={section.id}>
              <span>{operatorRunbookSectionLabel(i18n, section.id, section.label)}</span>
              <strong>{operatorRunbookSectionStatusLabel(i18n, section.status)}</strong>
              <em>{operatorRunbookControlValue(i18n, section.evidence)}</em>
              <p>{operatorRunbookControlValue(i18n, section.detail)}</p>
              <small>{operatorRunbookNextActionText(i18n, section.nextAction)}</small>
            </article>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function operatorRunbookStatusLabel(i18n: AppI18n, status: OperatorRunbookSummary["status"]): string {
  if (i18n.locale === "en-US") {
    return status.replaceAll("_", " ");
  }
  return {
    blocked: "已阻断",
    review_pending: "待复核",
    manual_review_ready: "人工复核就绪"
  }[status];
}

function operatorRunbookHeadline(i18n: AppI18n, headline: string): string {
  if (i18n.locale === "en-US") {
    return headline;
  }
  return {
    "Operator runbook ready for manual review": "操作员运行手册已可人工复核",
    "Operator runbook pending review": "操作员运行手册待补证据",
    "Operator runbook blocked": "操作员运行手册已阻断"
  }[headline] ?? headline;
}

function operatorRunbookSummaryText(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  return operatorRunbookControlValue(i18n, summary)
    .replace("All operator runbook sections are aligned for manual pre-live review only; live trading remains blocked.", "所有运行手册 section 已对齐，仅允许人工实盘前复核；实盘交易仍阻断。")
    .replace("operator runbook sections passed", "个运行手册 section 通过")
    .replace("is next", "是下一步");
}

function operatorRunbookNextActionText(i18n: AppI18n, action: string): string {
  if (i18n.locale === "en-US") {
    return action;
  }
  return operatorRunbookControlValue(i18n, action)
    .replace("Resolve", "处理")
    .replace("Record or review the operator runbook before any separate live-route enablement.", "记录或复核运行手册后，才能进入后续单独的实盘路由启用流程。")
    .replace("Keep checklist evidence attached to the runbook.", "保持 checklist 证据绑定到运行手册。")
    .replace("Keep replay evidence aligned with the current run.", "保持回放证据与当前运行一致。")
    .replace("Keep adapter chain evidence available for audit.", "保持适配器链路证据可审计。")
    .replace("Keep acceptance manifest linked to this operator runbook.", "保持验收 manifest 绑定到当前运行手册。")
    .replace("Do not enable live routes in P2.", "P2 阶段不要启用实盘路由。");
}

function operatorRunbookControlLabel(i18n: AppI18n, key: string): string {
  if (i18n.locale === "en-US") {
    return key.replace(/([A-Z])/g, " $1").toLowerCase();
  }
  return {
    killSwitch: "急停",
    rollbackOwner: "回滚负责人",
    positionLimit: "仓位限制",
    dataFreshness: "数据新鲜度",
    environmentState: "环境状态",
    auditPackage: "审计包"
  }[key] ?? key;
}

function operatorRunbookSectionLabel(i18n: AppI18n, id: string, fallback: string): string {
  if (i18n.locale === "en-US") {
    return fallback;
  }
  return {
    "pre-live-checklist": "实盘前清单",
    "paper-execution-replay": "纸面执行回放",
    "adapter-chain": "适配器链路",
    "p2-acceptance": "P2 验收",
    "safety-boundary": "安全边界"
  }[id] ?? fallback;
}

function operatorRunbookSectionStatusLabel(
  i18n: AppI18n,
  status: OperatorRunbookSummary["sections"][number]["status"]
): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return {
    passed: "通过",
    review: "复核",
    blocked: "阻断"
  }[status];
}

function operatorRunbookControlValue(i18n: AppI18n, value: string): string {
  if (i18n.locale === "en-US") {
    return value;
  }
  return value
    .replace("Disable execution route and keep adapters in paper-only mode", "禁用执行路由并保持适配器为模拟模式")
    .replace("Disable adapter route and stop the scheduler", "禁用适配器路由并停止调度器")
    .replace("operator", "操作员")
    .replace("max position per instrument", "单标的最大仓位")
    .replace("complete", "完整")
    .replace("review", "复核")
    .replace("missing", "缺失")
    .replace("blocked", "阻断")
    .replace("passed", "通过")
    .replace("paper_ready", "模拟链路就绪")
    .replace("live blocked", "实盘阻断")
    .replace("replay checks", "回放检查")
    .replace("gates", "闸门")
    .replace("stages", "阶段")
    .replace("No adapter chain health rollup is available.", "没有可用的适配器链路健康汇总。")
    .replace("Order submission, live orders, route execution, and live trading remain disabled.", "下单、实盘订单、路由执行和实盘交易仍禁用。");
}

function operatorRunbookAuditCoverageStatusLabel(
  i18n: AppI18n,
  coverage: OperatorRunbookAuditCoverage
): string {
  if (i18n.locale === "en-US") {
    return coverage.status === "matched" ? "Audited" : coverage.status === "stale" ? "Needs re-audit" : "Not audited";
  }
  return coverage.status === "matched" ? "已审计" : coverage.status === "stale" ? "需重新入账" : "未审计";
}

function operatorRunbookAuditCoverageHeadline(
  i18n: AppI18n,
  coverage: OperatorRunbookAuditCoverage
): string {
  if (i18n.locale === "en-US") {
    return coverage.status === "matched"
      ? "Runbook matches current evidence"
      : coverage.status === "stale"
        ? "Runbook audit is stale"
        : "Record operator runbook";
  }
  return coverage.status === "matched"
    ? "运行手册与当前证据一致"
    : coverage.status === "stale"
      ? "运行手册审计已过期"
      : "记录操作员运行手册";
}

function operatorRunbookAuditCoverageDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return detail
    .replace("Latest audited operator runbook matches the current context, controls, and section state.", "最近入账的操作员运行手册与当前上下文、控制项和 section 状态一致。")
    .replace("Latest audited operator runbook is for this context, but its controls or section state differ from the current screen.", "最近入账的操作员运行手册属于当前上下文，但控制项或 section 状态与当前页面不同。")
    .replace("No audited operator runbook report is recorded for", "尚未为以下上下文记录操作员运行手册审计：");
}

function operatorRunbookAuditCoverageMetaLabel(
  i18n: AppI18n,
  coverage: OperatorRunbookAuditCoverage
): string {
  const parts = [
    coverage.shortHash ? `sha ${coverage.shortHash}` : "",
    coverage.sectionLabel,
    coverage.mismatchLabel || (coverage.currentSectionLabel && coverage.currentSectionLabel !== coverage.sectionLabel ? `current ${coverage.currentSectionLabel}` : "")
  ].filter(Boolean);
  return operatorRunbookControlValue(i18n, parts.join(" · "));
}

function operatorRunbookAuditRecordActionLabel(
  i18n: AppI18n,
  status: OperatorRunbookAuditCoverage["status"],
  isRecording: boolean
): string {
  if (isRecording) {
    return i18n.locale === "zh-CN" ? "入账中" : "Recording";
  }
  if (i18n.locale === "en-US") {
    return status === "stale" ? "Re-audit" : "Audit";
  }
  return status === "stale" ? "重新入账" : "审计入账";
}
