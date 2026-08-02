import { Panel } from "../../components/AppPanel";
import { type AppI18n } from "../../lib/i18n";
import { P2ReadinessAcceptanceLatestResult } from "../../lib/terminal-api";
import { P2ManifestChainPreflightAuditEventReferenceSource, P2ManifestChainPreflightSummary, P2PaperReplaySummary, P2ReadinessAcceptanceAuditEventReferenceSource, P2ReadinessAcceptanceSummary, P2ReadinessEvidenceCoverage, P2ReadinessEvidenceCoverageRow } from "../../lib/terminal-workbench";
import { p2EvidenceCoverageDetail, p2EvidenceCoverageHeadline, p2EvidenceCoverageRowActionIcon, p2EvidenceCoverageRowActionLabel, p2EvidenceCoverageRowLabel, p2EvidenceCoverageSourceLabel, p2EvidenceCoverageStatusLabel, p2ManifestChainPreflightDetail, p2ManifestChainPreflightHeadline, p2ManifestChainPreflightStageStatusLabel, p2ManifestChainPreflightStatusLabel, p2PaperReplayBoundaryLabel, p2PaperReplaySummaryDetail, p2PaperReplaySummaryStatusLabel, p2ReadinessAcceptanceAuditEventSourceLabel, p2ReadinessAcceptanceDetail, p2ReadinessAcceptanceHeadline, p2ReadinessAcceptanceRowLabel, p2ReadinessAcceptanceRowStatusLabel, p2ReadinessAcceptanceStatusLabel } from "./p2-readiness-formatters";
import { Play, RefreshCw, ShieldCheck } from "lucide-react";

export function P2PaperReplayManifestPanel({
  className,
  headline,
  i18n,
  isRefreshing,
  onOpenAudit,
  onRefresh,
  summary
}: {
  className?: string;
  headline: string;
  i18n: AppI18n;
  isRefreshing: boolean;
  onOpenAudit: () => void;
  onRefresh: () => void;
  summary: P2PaperReplaySummary;
}) {
  const context = [summary.market ? i18n.marketLabel(summary.market) : null, summary.symbol, summary.timeframe]
    .filter(Boolean)
    .join(" · ");
  const checkLabel =
    summary.totalCheckCount > 0
      ? `${summary.passedCheckCount}/${summary.totalCheckCount}`
      : `${summary.checkCount}/${summary.requiredCheckCount}`;
  const auditLabel =
    summary.auditEventIds.length > 0
      ? summary.auditEventIds.slice(0, 2).join(", ")
      : i18n.locale === "zh-CN"
        ? "待写入审计"
        : "audit pending";

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "P2 纸面回放 manifest" : "P2 Paper Replay Manifest"}
      subtitle={i18n.locale === "zh-CN" ? "回读本地证据，仍阻断实盘" : "Local replay evidence with live trading blocked"}
      className={className}
      action={
        <div className="p2-paper-replay-actions">
          <button disabled={isRefreshing} onClick={onRefresh} type="button">
            <RefreshCw className={isRefreshing ? "spin" : ""} size={13} />
            <span>{isRefreshing ? (i18n.locale === "zh-CN" ? "刷新中" : "Refreshing") : i18n.locale === "zh-CN" ? "刷新" : "Refresh"}</span>
          </button>
          <button onClick={onOpenAudit} type="button">
            <ShieldCheck size={13} />
            <span>{i18n.locale === "zh-CN" ? "审计复核" : "Audit review"}</span>
          </button>
        </div>
      }
    >
      <div className={`p2-paper-replay ${summary.tone}`}>
        <div className="p2-paper-replay-head">
          <div>
            <span>{p2PaperReplaySummaryStatusLabel(i18n, summary)}</span>
            <strong>{headline}</strong>
            <p>{p2PaperReplaySummaryDetail(i18n, summary)}</p>
          </div>
          <em>{checkLabel}</em>
        </div>
        <div className="p2-paper-replay-meta">
          <span title={summary.sourcePath}>
            {i18n.locale === "zh-CN" ? "来源" : "Source"} · {summary.sourcePath}
          </span>
          <span>{i18n.locale === "zh-CN" ? "上下文" : "Context"} · {context || "n/a"}</span>
          <span>{i18n.locale === "zh-CN" ? "适配器" : "Adapter"} · {summary.adapterId || "n/a"}</span>
          <span>{i18n.locale === "zh-CN" ? "回放状态" : "Replay"} · {summary.replayStatus || summary.state}</span>
          <span>{i18n.locale === "zh-CN" ? "警告" : "Warnings"} · {summary.warningCount}</span>
          <span>{i18n.locale === "zh-CN" ? "最新证据" : "Latest evidence"} · {summary.latestEvidenceId || "n/a"}</span>
          <span>{i18n.locale === "zh-CN" ? "审计" : "Audit"} · {auditLabel}</span>
          <span>{p2PaperReplayBoundaryLabel(i18n, summary)}</span>
        </div>
      </div>
    </Panel>
  );
}

export function P2ReadinessEvidenceCoveragePanel({
  className,
  coverage,
  i18n,
  onOpenEvidence
}: {
  className?: string;
  coverage: P2ReadinessEvidenceCoverage;
  i18n: AppI18n;
  onOpenEvidence: (row: P2ReadinessEvidenceCoverageRow) => void;
}) {
  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "P2 证据覆盖矩阵" : "P2 Evidence Coverage"}
      subtitle={i18n.locale === "zh-CN" ? "把 readiness 声明追溯到审计或本地 manifest" : "Readiness claims traced to audit or local manifests"}
      className={className}
    >
      <div className={`p2-evidence-coverage ${coverage.tone}`}>
        <div className="p2-evidence-coverage-head">
          <div>
            <span>{p2EvidenceCoverageStatusLabel(i18n, coverage.status)}</span>
            <strong>{p2EvidenceCoverageHeadline(i18n, coverage)}</strong>
            <p>{p2EvidenceCoverageDetail(i18n, coverage)}</p>
          </div>
          <em>
            {coverage.coveredCount}/{coverage.totalCount}
          </em>
        </div>
        <div className="p2-evidence-coverage-grid">
          {coverage.rows.map((row) => {
            const EvidenceActionIcon = p2EvidenceCoverageRowActionIcon(row);
            return (
              <div className={`p2-evidence-coverage-row ${row.tone}`} key={row.id}>
                <div>
                  <span>{p2EvidenceCoverageRowLabel(i18n, row.id)}</span>
                  <strong>{p2EvidenceCoverageStatusLabel(i18n, row.status)}</strong>
                </div>
                <p>{row.evidence}</p>
                <small title={row.sourceId ?? row.detail}>
                  {p2EvidenceCoverageSourceLabel(i18n, row.sourceType)} · {row.sourceId || "n/a"}
                </small>
                <button className="p2-evidence-coverage-row-action" onClick={() => onOpenEvidence(row)} type="button">
                  <EvidenceActionIcon size={13} />
                  <span>{p2EvidenceCoverageRowActionLabel(i18n, row)}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

export function P2ReadinessAcceptancePanel({
  auditEventId,
  auditEventSource,
  className,
  i18n,
  isGenerating,
  isRefreshing,
  onGenerateAcceptance,
  onOpenAudit,
  onRefresh,
  readback,
  summary
}: {
  auditEventId: string;
  auditEventSource: P2ReadinessAcceptanceAuditEventReferenceSource;
  className?: string;
  i18n: AppI18n;
  isGenerating: boolean;
  isRefreshing: boolean;
  onGenerateAcceptance: () => void;
  onOpenAudit: () => void;
  onRefresh: () => void;
  readback: NonNullable<P2ReadinessAcceptanceLatestResult["acceptance"]> | null;
  summary: P2ReadinessAcceptanceSummary;
}) {
  const readbackTone =
    readback?.status === "accepted" && readback.liveBlockedBoundary && !readback.liveTradingAllowed
      ? "positive"
      : readback?.status === "invalid"
        ? "risk"
        : "warning";
  const readbackStatusLabel =
    readback?.status === "accepted"
      ? i18n.locale === "zh-CN"
        ? "manifest 已验收"
        : "manifest accepted"
      : readback?.status === "invalid"
        ? i18n.locale === "zh-CN"
          ? "manifest 无效"
          : "manifest invalid"
        : i18n.locale === "zh-CN"
          ? "manifest 未回读"
          : "manifest missing";
  const readbackCriteriaLabel = readback
    ? `${readback.acceptedCriterionCount}/${readback.totalCriterionCount}`
    : "0/6";
  const readbackBoundaryLabel =
    readback?.liveBlockedBoundary && !readback.liveTradingAllowed && !readback.orderSubmissionEnabled
      ? i18n.locale === "zh-CN"
        ? "实盘边界关闭"
        : "live boundary closed"
      : i18n.locale === "zh-CN"
        ? "实盘边界需复核"
        : "live boundary needs review";

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "P2 顶层验收门禁" : "P2 Acceptance Gate"}
      subtitle={i18n.locale === "zh-CN" ? "验收定义 6 项，不授权实盘" : "Six acceptance criteria, no live authorization"}
      className={className}
      action={
        <div className="p2-readiness-acceptance-actions">
          <button
            className="p2-readiness-acceptance-generate"
            disabled={isGenerating || isRefreshing}
            onClick={onGenerateAcceptance}
            type="button"
          >
            {isGenerating ? <RefreshCw className="spin" size={13} /> : <Play size={13} />}
            <span>
              {isGenerating
                ? i18n.locale === "zh-CN"
                  ? "生成中"
                  : "Generating"
                : i18n.locale === "zh-CN"
                  ? "生成验收"
                  : "Generate"}
            </span>
          </button>
          <button
            className="p2-readiness-acceptance-refresh"
            disabled={isRefreshing || isGenerating}
            onClick={onRefresh}
            type="button"
          >
            <RefreshCw className={isRefreshing ? "spin" : ""} size={13} />
            <span>{isRefreshing ? (i18n.locale === "zh-CN" ? "刷新中" : "Refreshing") : i18n.locale === "zh-CN" ? "刷新" : "Refresh"}</span>
          </button>
          <button onClick={onOpenAudit} type="button">
            <ShieldCheck size={13} />
            <span>{i18n.locale === "zh-CN" ? "审计" : "Audit"}</span>
          </button>
        </div>
      }
    >
      <div className={`p2-readiness-acceptance ${summary.tone}`}>
        <div className="p2-readiness-acceptance-head">
          <div>
            <span>{p2ReadinessAcceptanceStatusLabel(i18n, summary.status)}</span>
            <strong>{p2ReadinessAcceptanceHeadline(i18n, summary)}</strong>
            <p>{p2ReadinessAcceptanceDetail(i18n, summary)}</p>
          </div>
          <em>
            {summary.acceptedCount}/{summary.totalCount}
          </em>
        </div>
        <div className={`p2-readiness-acceptance-readback ${readbackTone}`}>
          <div>
            <span>{readbackStatusLabel}</span>
            <strong>{readback?.runId ?? "n/a"}</strong>
            <p title={readback?.sourcePath ?? "data/p2-readiness-acceptance.json"}>
              {readback?.sourcePath ?? "data/p2-readiness-acceptance.json"}
            </p>
          </div>
          <div>
            <span>{i18n.locale === "zh-CN" ? "验收项" : "Criteria"}</span>
            <strong>{readbackCriteriaLabel}</strong>
            <p>{readback?.readinessCoverageStatus ?? "n/a"}</p>
          </div>
          <div>
            <span>{i18n.locale === "zh-CN" ? "安全边界" : "Safety boundary"}</span>
            <strong>{readbackBoundaryLabel}</strong>
            <p>
              {i18n.locale === "zh-CN" ? "下单" : "orders"} ·{" "}
              {readback?.orderSubmissionEnabled ? "on" : "off"}
            </p>
          </div>
        </div>
        {auditEventId ? (
          <small className="p2-readiness-acceptance-audit">
            <span>{i18n.locale === "zh-CN" ? "审计事件" : "Audit event"}</span>
            <code>{auditEventId}</code>
            <em>{p2ReadinessAcceptanceAuditEventSourceLabel(i18n, auditEventSource)}</em>
          </small>
        ) : null}
        <div className="p2-readiness-acceptance-grid">
          {summary.rows.map((row) => (
            <div className={`p2-readiness-acceptance-row ${row.tone}`} key={row.id}>
              <span>{p2ReadinessAcceptanceRowLabel(i18n, row.id)}</span>
              <strong>{p2ReadinessAcceptanceRowStatusLabel(i18n, row.status)}</strong>
              <small title={row.sourceId ?? row.detail}>{row.evidence}</small>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function P2ManifestChainPreflightPanel({
  auditEventId,
  auditEventSource,
  className,
  i18n,
  isGenerating,
  isRefreshing,
  onGeneratePreflight,
  onOpenAudit,
  onRefresh,
  summary
}: {
  auditEventId: string;
  auditEventSource: P2ManifestChainPreflightAuditEventReferenceSource;
  className?: string;
  i18n: AppI18n;
  isGenerating: boolean;
  isRefreshing: boolean;
  onGeneratePreflight: () => void;
  onOpenAudit: () => void;
  onRefresh: () => void;
  summary: P2ManifestChainPreflightSummary;
}) {
  const commandLabel =
    summary.nextCommand ||
    (i18n.locale === "zh-CN" ? "当前链路无推荐命令" : "No command required for the current chain");
  const boundaryLabel =
    summary.liveBlockedBoundary && !summary.reportedLiveTradingAllowed && !summary.reportedOrderSubmissionEnabled
      ? i18n.locale === "zh-CN"
        ? "只读预检，实盘和直接下单保持关闭"
        : "Read-only preflight; live trading and direct order submission stay disabled"
      : i18n.locale === "zh-CN"
        ? "预检声明了不安全执行字段，平台继续阻断"
        : "Preflight reports unsafe execution fields; platform keeps blocking";
  const auditEventSourceLabel =
    i18n.locale === "zh-CN"
      ? {
          ledger: "来源 · 台账回填",
          none: "来源 · 未定位",
          response: "来源 · 本次响应"
        }[auditEventSource]
      : {
          ledger: "Source · ledger rehydrated",
          none: "Source · not linked",
          response: "Source · latest response"
        }[auditEventSource];

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "P2 manifest 链路预检" : "P2 Manifest Chain Preflight"}
      subtitle={i18n.locale === "zh-CN" ? "定位 P1/P2 证据链的第一个阻断点" : "First blocker across archived P1/P2 manifests"}
      className={className}
      action={
        <div className="p2-chain-preflight-actions">
          <button disabled={isGenerating || isRefreshing} onClick={onGeneratePreflight} type="button">
            {isGenerating ? <RefreshCw className="spin" size={13} /> : <Play size={13} />}
            <span>
              {isGenerating
                ? i18n.locale === "zh-CN"
                  ? "生成中"
                  : "Generating"
                : i18n.locale === "zh-CN"
                  ? "生成预检"
                  : "Generate"}
            </span>
          </button>
          <button disabled={isRefreshing || isGenerating} onClick={onRefresh} type="button">
            <RefreshCw className={isRefreshing ? "spin" : ""} size={13} />
            <span>{isRefreshing ? (i18n.locale === "zh-CN" ? "刷新中" : "Refreshing") : i18n.locale === "zh-CN" ? "刷新" : "Refresh"}</span>
          </button>
          <button onClick={onOpenAudit} type="button">
            <ShieldCheck size={13} />
            <span>{i18n.locale === "zh-CN" ? "审计" : "Audit"}</span>
          </button>
        </div>
      }
    >
      <div className={`p2-chain-preflight ${summary.tone}`}>
        <div className="p2-chain-preflight-head">
          <div>
            <span>{p2ManifestChainPreflightStatusLabel(i18n, summary.state)}</span>
            <strong>{p2ManifestChainPreflightHeadline(i18n, summary)}</strong>
            <p>{p2ManifestChainPreflightDetail(i18n, summary)}</p>
          </div>
          <em>
            {summary.validStageCount}/{summary.totalStageCount}
          </em>
        </div>
        <div className="p2-chain-preflight-command">
          <span>{i18n.locale === "zh-CN" ? "下一步" : "Next"}</span>
          <strong>{summary.nextAction || (i18n.locale === "zh-CN" ? "无需动作" : "none")}</strong>
          <code>{commandLabel}</code>
        </div>
        {auditEventId ? (
          <small className="p2-chain-preflight-audit">
            <span>{i18n.locale === "zh-CN" ? "审计事件" : "Audit event"}</span>
            <code>{auditEventId}</code>
            <em>{auditEventSourceLabel}</em>
          </small>
        ) : null}
        <div className="p2-chain-preflight-stages">
          {summary.stages.length ? (
            summary.stages.map((stage) => (
              <div className={`p2-chain-preflight-stage ${stage.status}`} key={stage.id}>
                <div>
                  <span>{stage.label}</span>
                  <strong>{p2ManifestChainPreflightStageStatusLabel(i18n, stage.status)}</strong>
                </div>
                <p title={stage.reason || stage.summary}>{stage.summary || stage.reason || stage.path}</p>
              </div>
            ))
          ) : (
            <p className="empty-state">
              {i18n.locale === "zh-CN"
                ? "暂无预检阶段结果；先运行 docker:smoke:p2:preflight。"
                : "No preflight stage results yet; run docker:smoke:p2:preflight first."}
            </p>
          )}
        </div>
        <small className="p2-chain-preflight-boundary">{boundaryLabel}</small>
      </div>
    </Panel>
  );
}
