import { Check, Copy, Download, Save, Search, Timer } from "lucide-react";
import { Panel } from "../../components/AppPanel";
import type { AppI18n } from "../../lib/i18n";
import type {
  ExecutionAdapterPreLiveRunbookStep,
  ExecutionAdapterPreLiveRunbookSummary,
  PreLiveRunbookAuditCoverage,
} from "../../lib/terminal-workbench";

export function PreLiveRunbookPanel({
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
  auditCoverage: PreLiveRunbookAuditCoverage;
  className?: string;
  i18n: AppI18n;
  isCopied?: boolean;
  isRecordingAudit?: boolean;
  onCopy?: () => void;
  onCopyAuditLink?: () => void;
  onDownload?: () => void;
  onFocusAudit?: () => void;
  onRecordAudit?: () => void;
  runbook: ExecutionAdapterPreLiveRunbookSummary;
}) {
  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "实盘前运行手册" : "Pre-live Runbook"}
      subtitle={i18n.locale === "zh-CN" ? "模拟演练证据链，实盘仍阻断" : "Paper-only evidence chain; live stays blocked"}
      className={className}
      action={
        <div className="pre-live-runbook-actions">
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
              <Save size={13} />
              <span>
                {isRecordingAudit
                  ? i18n.locale === "zh-CN"
                    ? "入账中"
                    : "Recording"
                  : i18n.locale === "zh-CN"
                    ? "审计入账"
                    : "Audit"}
              </span>
            </button>
          ) : null}
        </div>
      }
    >
      <div className={`pre-live-runbook ${runbook.status}`}>
        <div className="pre-live-runbook-summary">
          <span>{preLiveRunbookStatusLabel(i18n, runbook.status)}</span>
          <strong>{preLiveRunbookHeadline(i18n, runbook.headline)}</strong>
          <p>{preLiveRunbookSummaryText(i18n, runbook.summary)}</p>
          <div className="pre-live-runbook-progress">
            <em>
              {runbook.completedSteps}/{runbook.totalSteps}
            </em>
            <span>{preLiveRunbookNextStep(i18n, runbook.nextStep)}</span>
            <small>{preLiveRunbookBoundary(i18n, runbook.boundary)}</small>
          </div>
          <div className={`pre-live-runbook-audit ${auditCoverage.status}`}>
            <span>{preLiveRunbookAuditCoverageStatusLabel(i18n, auditCoverage)}</span>
            <strong>{preLiveRunbookAuditCoverageHeadline(i18n, auditCoverage)}</strong>
            <p>{preLiveRunbookAuditCoverageDetail(i18n, auditCoverage.detail)}</p>
            {auditCoverage.latestEventId || auditCoverage.shortHash || auditCoverage.gateLabel ? (
              <small className="pre-live-runbook-audit-meta" title={auditCoverage.latestEventId || auditCoverage.query}>
                {preLiveRunbookAuditCoverageMetaLabel(i18n, auditCoverage)}
              </small>
            ) : null}
            {(auditCoverage.query && (onFocusAudit || onCopyAuditLink)) ||
            (auditCoverage.status !== "matched" && onRecordAudit) ? (
              <div className="pre-live-runbook-audit-actions">
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
                    <span>{preLiveRunbookAuditRecordActionLabel(i18n, auditCoverage.status, isRecordingAudit)}</span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className="pre-live-runbook-list">
          {runbook.rows.map((row) => (
            <article className={`pre-live-runbook-row ${row.tone}`} key={row.id}>
              <span>{preLiveRunbookStepLabel(i18n, row)}</span>
              <strong>{preLiveRunbookStepValue(i18n, row)}</strong>
              <em>{preLiveRunbookStepStatusLabel(i18n, row.status)}</em>
              <p>{preLiveRunbookStepDetail(i18n, row)}</p>
              <small>{row.evidenceId ?? preLiveRunbookNextStep(i18n, row.nextStep)}</small>
            </article>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function preLiveRunbookStatusLabel(i18n: AppI18n, status: ExecutionAdapterPreLiveRunbookSummary["status"]): string {
  if (i18n.locale === "en-US") {
    return status.replaceAll("_", " ");
  }
  return {
    blocked: "运行手册阻断",
    in_progress: "运行手册推进中",
    paper_rehearsal_ready: "模拟演练就绪"
  }[status];
}

function preLiveRunbookAuditCoverageStatusLabel(i18n: AppI18n, coverage: PreLiveRunbookAuditCoverage): string {
  if (i18n.locale === "en-US") {
    return coverage.statusLabel;
  }
  return {
    matched: "已审计",
    missing: "未入账",
    stale: "需重新入账"
  }[coverage.status];
}

function preLiveRunbookAuditCoverageHeadline(i18n: AppI18n, coverage: PreLiveRunbookAuditCoverage): string {
  if (i18n.locale === "en-US") {
    return {
      matched: "Current runbook has matching audit evidence",
      missing: "No current runbook audit evidence",
      stale: "Audit evidence is stale"
    }[coverage.status];
  }
  return {
    matched: "当前运行手册已有匹配审计记录",
    missing: "当前运行手册还没有审计记录",
    stale: "审计记录与当前状态不一致"
  }[coverage.status];
}

function preLiveRunbookAuditRecordActionLabel(
  i18n: AppI18n,
  status: PreLiveRunbookAuditCoverage["status"],
  isRecording: boolean
): string {
  if (isRecording) {
    return i18n.locale === "zh-CN" ? "入账中" : "Recording";
  }
  if (status === "stale") {
    return i18n.locale === "zh-CN" ? "重新入账" : "Re-audit";
  }
  return i18n.locale === "zh-CN" ? "入账报告" : "Record audit";
}

function preLiveRunbookAuditCoverageDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  const missing = detail.match(/^No audited pre-live runbook report is recorded for (.+)\.$/);
  if (missing) {
    return `${missing[1]} 尚未记录实盘前运行手册审计报告。`;
  }
  return detail
    .replace(
      "Latest audited runbook matches the current adapter context and gate state.",
      "最新入账运行手册与当前适配器上下文和闸门状态一致。"
    )
    .replace(
      "Latest audited runbook is for this adapter context, but its gate state differs from the current screen.",
      "最新入账运行手册属于当前适配器上下文，但闸门状态已和当前屏幕不一致。"
    )
    .replace(
      "Latest audited runbook is for this adapter context, but its evidence set differs from the current screen.",
      "最新入账运行手册属于当前适配器上下文，但底层证据集合已和当前屏幕不一致。"
    )
    .replace(
      "Latest audited runbook is for this adapter context, but its gate state and evidence set differ from the current screen.",
      "最新入账运行手册属于当前适配器上下文，但闸门状态和底层证据集合都已和当前屏幕不一致。"
    );
}

function preLiveRunbookAuditCoverageMetaLabel(i18n: AppI18n, coverage: PreLiveRunbookAuditCoverage): string {
  const gateLabel =
    coverage.currentGateLabel && coverage.currentGateLabel !== coverage.gateLabel
      ? preLiveRunbookGateComparisonLabel(i18n, coverage.gateLabel, coverage.currentGateLabel)
      : coverage.gateLabel
        ? preLiveRunbookGateLabel(i18n, coverage.gateLabel)
        : "";
  const parts = [
    coverage.mismatchLabel ? preLiveRunbookMismatchLabel(i18n, coverage.mismatchLabel) : "",
    gateLabel,
    coverage.shortHash ? `sha256 ${coverage.shortHash}` : "",
    coverage.latestEventId
  ].filter(Boolean);
  const prefix = i18n.locale === "zh-CN" ? "审计证据" : "Audit evidence";
  return parts.length ? `${prefix} · ${parts.join(" · ")}` : prefix;
}

function preLiveRunbookMismatchLabel(i18n: AppI18n, mismatchLabel: string): string {
  if (i18n.locale === "en-US") {
    return `Mismatch ${mismatchLabel}`;
  }
  return `差异 ${mismatchLabel
    .replaceAll("status", "状态")
    .replaceAll("next step", "下一步")
    .replaceAll("gates", "闸门")
    .replaceAll("evidence ids", "证据 ID")
    .replaceAll("changed", "已变化")
    .replaceAll("removed", "移除")
    .replaceAll("added", "新增")}`;
}

function preLiveRunbookGateComparisonLabel(i18n: AppI18n, auditedGateLabel: string, currentGateLabel: string): string {
  const audited = preLiveRunbookGateLabel(i18n, auditedGateLabel);
  const current = preLiveRunbookGateLabel(i18n, currentGateLabel);
  return i18n.locale === "zh-CN" ? `入账 ${audited} · 当前 ${current}` : `audited ${audited} · current ${current}`;
}

function preLiveRunbookGateLabel(i18n: AppI18n, gateLabel: string): string {
  if (i18n.locale === "en-US") {
    return gateLabel;
  }
  const gateMatch = gateLabel.match(/^(\d+)\/(\d+) gates$/);
  if (gateMatch) {
    return `${gateMatch[1]}/${gateMatch[2]} 闸门`;
  }
  return gateLabel;
}

function preLiveRunbookStepStatusLabel(
  i18n: AppI18n,
  status: ExecutionAdapterPreLiveRunbookStep["status"]
): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { blocked: "阻断", passed: "通过", review: "复核" }[status];
}

function preLiveRunbookHeadline(i18n: AppI18n, headline: string): string {
  if (i18n.locale === "en-US") {
    return headline;
  }
  return {
    "Paper rehearsal complete": "模拟演练证据链完成",
    "Pre-live runbook blocked": "实盘前运行手册阻断",
    "Pre-live runbook in progress": "实盘前运行手册推进中"
  }[headline] ?? headline;
}

function preLiveRunbookSummaryText(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  const ready = summary.match(/^(.+) has a complete paper-only pre-live rehearsal chain\. Live routing is still blocked\.$/);
  if (ready) {
    return `${ready[1]} 已完成实盘前模拟演练证据链；实盘路由仍保持阻断。`;
  }
  const progress = summary.match(/^(.+) has (\d+)\/(\d+) pre-live runbook gates complete\.$/);
  if (progress) {
    return `${progress[1]} 已完成 ${progress[2]}/${progress[3]} 个实盘前运行手册闸门。`;
  }
  return summary;
}

function preLiveRunbookStepLabel(i18n: AppI18n, row: ExecutionAdapterPreLiveRunbookStep): string {
  if (i18n.locale === "en-US") {
    return row.label;
  }
  return {
    "adapter-state": "适配器状态账本",
    "adapter-certification": "适配器认证",
    "human-confirmation": "最终人工确认",
    "paper-rehearsal": "模拟路由演练",
    "route-review-health": "路由复核与只读健康检查",
    "runtime-acceptance": "运行时重载验收",
    "secret-manifest": "密钥清单验证"
  }[row.id];
}

function preLiveRunbookStepValue(i18n: AppI18n, row: ExecutionAdapterPreLiveRunbookStep): string {
  if (i18n.locale === "en-US") {
    return row.value;
  }
  return preLiveRunbookTranslateEvidenceText(row.value)
    .replace("Live route blocked", "实盘路由已阻断")
    .replace("No adapter state", "缺少适配器状态")
    .replace("No certification", "缺少认证")
    .replace("No manifest validation", "缺少清单验证")
    .replace("No runtime acceptance", "缺少运行时验收")
    .replace("No human confirmation", "缺少人工确认")
    .replace("No route review", "缺少路由复核")
    .replace("Route review recorded · health probe missing", "路由复核已记录 · 缺少健康探针")
    .replace("Route review + health ready", "路由复核与健康探针就绪")
    .replace("No paper rehearsal evidence", "缺少模拟演练证据");
}

function preLiveRunbookStepDetail(i18n: AppI18n, row: ExecutionAdapterPreLiveRunbookStep): string {
  if (i18n.locale === "en-US") {
    return row.detail;
  }
  return preLiveRunbookTranslateEvidenceText(row.detail);
}

function preLiveRunbookNextStep(i18n: AppI18n, nextStep: string): string {
  if (i18n.locale === "en-US") {
    return nextStep;
  }
  return {
    "Continue paper-only certification chain": "继续模拟优先的认证链",
    "Record adapter certification evidence": "记录适配器认证证据",
    "Record adapter ops state": "记录适配器 ops state",
    "Record adapter paper execution": "记录适配器模拟执行",
    "Record final human confirmation": "记录最终人工确认",
    "Record paper order lifecycle": "记录模拟订单生命周期",
    "Record paper route runbook": "记录模拟路由运行手册",
    "Record production route review": "记录生产路由复核",
    "Record production route review and read-only health probe": "记录生产路由复核与只读健康探针",
    "Record runtime reload final acceptance": "记录运行时重载最终验收",
    "Record sandbox order schema dry-run": "记录 sandbox 订单 schema dry-run",
    "Refresh adapter state ledger in Settings": "在设置中刷新适配器状态账本",
    "Regenerate adapter paper execution without order submission or route execution": "重新生成不提交订单、不执行路由的模拟执行证据",
    "Resolve read-only health probe review items": "处理只读健康探针复核项",
    "Review paper rehearsal evidence before any separate live-route enablement": "单独启用实盘路由前，先复核模拟演练证据",
    "Run read-only adapter health probe": "运行只读适配器健康探针",
    "Validate local secret-store manifest": "验证本地密钥存储清单"
  }[nextStep] ?? nextStep;
}

function preLiveRunbookBoundary(i18n: AppI18n, boundary: string): string {
  if (i18n.locale === "en-US") {
    return boundary;
  }
  return preLiveRunbookTranslateEvidenceText(boundary);
}

function preLiveRunbookTranslateEvidenceText(text: string): string {
  return text
    .replaceAll("Paper-only rehearsal · live routing remains blocked", "仅模拟演练 · 实盘路由仍阻断")
    .replaceAll("Live execution remains blocked until gates pass.", "闸门通过前，实盘执行保持阻断。")
    .replaceAll("Paper only · live trading blocked", "仅模拟 · 实盘交易阻断")
    .replaceAll("Paper only · order routing disabled", "仅模拟 · 订单路由禁用")
    .replaceAll("Paper execution recorded · simulated fill only · live route blocked", "模拟执行已记录 · 仅模拟成交 · 实盘路由阻断")
    .replaceAll("No order submitted · paper only · live trading blocked", "未提交订单 · 仅模拟 · 实盘交易阻断")
    .replaceAll("Paper lifecycle recorded · no live order submitted · live trading blocked", "模拟生命周期已记录 · 未提交实盘订单 · 实盘交易阻断")
    .replaceAll("No sandbox order schema dry-run is bound to the paper rehearsal chain.", "模拟演练链尚未绑定 sandbox 订单 schema dry-run。")
    .replaceAll("No live adapter certification evidence is bound", "尚未绑定实盘适配器认证证据")
    .replaceAll("No validated local secret-store manifest is bound.", "尚未绑定已验证的本地密钥存储清单。")
    .replaceAll("Runtime reload final acceptance has not been recorded.", "尚未记录运行时重载最终验收。")
    .replaceAll("Final human confirmation has not been recorded.", "尚未记录最终人工确认。")
    .replaceAll("Production route review has not been recorded.", "尚未记录生产路由复核。")
    .replaceAll("Live trading is already allowed; pre-live runbook refuses to treat this as paper-only evidence.", "实盘交易已允许；实盘前运行手册不会把它视为模拟证据。")
    .replaceAll("Settings has not loaded a live adapter state ledger", "设置尚未加载实盘适配器状态账本")
    .replaceAll("Passed", "通过")
    .replaceAll("Validated", "已验证")
    .replaceAll("Acceptance recorded", "验收已记录")
    .replaceAll("Confirmation recorded", "确认已记录")
    .replaceAll("Route review recorded", "路由复核已记录")
    .replaceAll("Ready", "就绪")
    .replaceAll("Paper execution recorded", "模拟执行已记录")
    .replaceAll("Schema dry-run recorded", "schema dry-run 已记录")
    .replaceAll("Lifecycle recorded", "生命周期已记录")
    .replaceAll("Runbook recorded", "运行手册已记录")
    .replaceAll("Ops state recorded", "ops state 已记录")
    .replaceAll("No blockers", "无阻断项")
    .replaceAll("confirmed / 0 missing", "项已确认 / 0 项缺失")
    .replaceAll("passed / 0 review / 0 blocked", "项通过 / 0 项复核 / 0 项阻断")
    .replaceAll("passed / 0 blocked / 0 failed / 0 review", "项通过 / 0 项阻断 / 0 项失败 / 0 项复核")
    .replaceAll("filled buy", "模拟买入成交")
    .replaceAll("local paper fill", "本地模拟成交")
    .replaceAll("live route blocked", "实盘路由阻断")
    .replaceAll("live trading blocked", "实盘交易阻断")
    .replaceAll("order routing disabled", "订单路由禁用")
    .replaceAll("gates", "个闸门")
    .replaceAll("env vars covered", "个环境变量已覆盖")
    .replaceAll("markets", "个市场");
}
