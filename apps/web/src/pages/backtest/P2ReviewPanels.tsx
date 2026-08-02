import { Panel } from "../../components/AppPanel";
import { type AppI18n } from "../../lib/i18n";
import { P0AcceptanceLatestResult, P2ManifestChainPreflightLatestResult, P2ReadinessAcceptanceLatestResult } from "../../lib/terminal-api";
import { ExecutionAdapterChainHealthRollup, P0AcceptanceSummary, P2ManifestChainPreflightAuditEventReferenceSource, P2ManifestChainPreflightSummary, P2PreLiveAcceptanceSummary, P2ReadinessAcceptanceAuditEventReferenceSource, P2ReadinessAcceptanceSummary, P2ReadinessEvidenceCoverage, P2ReadinessEvidenceCoverageReviewAuditEventReferenceSource } from "../../lib/terminal-workbench";
import { adapterChainHealthDetailLabel, adapterChainHealthStageLabel, adapterChainHealthStageStatusLabel, adapterChainHealthStatusLabel } from "../audit/AuditControlFormatters";
import { p0AcceptanceSummaryDetail, p0AcceptanceSummaryHeadline } from "../stage1/platform-overview-formatters";
import { p0AcceptanceReviewBoundaryLabel, p0AcceptanceReviewCheckLabel, p0AcceptanceReviewStatusLabel, p2EvidenceCoverageDetail, p2EvidenceCoverageHeadline, p2EvidenceCoverageRowLabel, p2EvidenceCoverageSourceLabel, p2EvidenceCoverageStatusLabel, p2ManifestChainPreflightDetail, p2ManifestChainPreflightHeadline, p2ManifestChainPreflightStatusLabel, p2PreLiveAcceptanceBoundaryLabel, p2PreLiveAcceptanceSummaryDetail, p2PreLiveAcceptanceSummaryStatusLabel, p2ReadinessAcceptanceAuditEventSourceLabel, p2ReadinessAcceptanceDetail, p2ReadinessAcceptanceHeadline, p2ReadinessAcceptanceRowLabel, p2ReadinessAcceptanceStatusLabel } from "./p2-readiness-formatters";
import { Check, Copy, Download, GitBranch, RefreshCw, Search, ShieldCheck } from "lucide-react";

export function P2ManifestChainPreflightReviewPanel({
  auditEventId,
  auditEventSource,
  className,
  i18n,
  isCopied,
  isRecordingAudit,
  isRefreshing,
  onCopy,
  onDownload,
  onOpenAudit,
  onRecordAudit,
  onRefresh,
  preflight,
  summary
}: {
  auditEventId: string;
  auditEventSource: P2ManifestChainPreflightAuditEventReferenceSource;
  className?: string;
  i18n: AppI18n;
  isCopied: boolean;
  isRecordingAudit: boolean;
  isRefreshing: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onOpenAudit: () => void;
  onRecordAudit: () => void;
  onRefresh: () => void;
  preflight: P2ManifestChainPreflightLatestResult["preflight"] | null;
  summary: P2ManifestChainPreflightSummary;
}) {
  const sourcePath = preflight?.sourcePath ?? summary.sourcePath;
  const stages = preflight?.stages.length ? preflight.stages : summary.stages;
  const blockerText = (preflight?.blockerIds.length ? preflight.blockerIds : summary.blockerIds).join(", ") || "none";
  const nextAction = preflight?.nextAction ?? summary.nextAction;
  const nextCommand = preflight?.nextCommand ?? summary.nextCommand;
  const boundaryLabel =
    Boolean(preflight?.liveBlockedBoundary ?? summary.liveBlockedBoundary) &&
    !Boolean(preflight?.orderSubmissionEnabled ?? summary.reportedOrderSubmissionEnabled) &&
    !Boolean(preflight?.liveTradingAllowed ?? summary.reportedLiveTradingAllowed) &&
    !Boolean(preflight?.liveOrderSubmitted ?? summary.reportedLiveOrderSubmitted) &&
    !Boolean(preflight?.routeExecuted ?? summary.reportedRouteExecuted)
      ? i18n.locale === "zh-CN"
        ? "实盘边界关闭"
        : "live boundary closed"
      : i18n.locale === "zh-CN"
        ? "实盘边界需复核"
        : "live boundary needs review";
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
      title={i18n.locale === "zh-CN" ? "P2 manifest 链路预检复核" : "P2 Manifest Chain Preflight Review"}
      subtitle={i18n.locale === "zh-CN" ? "复核预检 manifest、blocker 与审计边界" : "Review preflight manifest, blockers, and audit boundary"}
      className={className}
      action={
        <div className="p2-manifest-chain-preflight-review-actions">
          <button onClick={onCopy} type="button">
            {isCopied ? <Check size={13} /> : <Copy size={13} />}
            <span>
              {isCopied
                ? i18n.locale === "zh-CN"
                  ? "已复制"
                  : "Copied"
                : i18n.locale === "zh-CN"
                  ? "复制"
                  : "Copy"}
            </span>
          </button>
          <button onClick={onDownload} type="button">
            <Download size={13} />
            <span>{i18n.locale === "zh-CN" ? "下载" : "Download"}</span>
          </button>
          <button disabled={isRecordingAudit} onClick={onRecordAudit} type="button">
            {isRecordingAudit ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
            <span>
              {isRecordingAudit
                ? i18n.locale === "zh-CN"
                  ? "入账中"
                  : "Recording"
                : i18n.locale === "zh-CN"
                  ? "入账"
                  : "Record"}
            </span>
          </button>
          <button onClick={onOpenAudit} type="button">
            <ShieldCheck size={13} />
            <span>{i18n.locale === "zh-CN" ? "审计" : "Audit"}</span>
          </button>
          <button disabled={isRefreshing} onClick={onRefresh} type="button">
            <RefreshCw className={isRefreshing ? "spin" : ""} size={13} />
            <span>{isRefreshing ? (i18n.locale === "zh-CN" ? "刷新中" : "Refreshing") : i18n.locale === "zh-CN" ? "刷新" : "Refresh"}</span>
          </button>
        </div>
      }
    >
      <div className={`p2-manifest-chain-preflight-review ${summary.tone}`}>
        <div className="p2-manifest-chain-preflight-review-head">
          <div>
            <span>{p2ManifestChainPreflightStatusLabel(i18n, preflight?.status ?? summary.state)}</span>
            <strong>{p2ManifestChainPreflightHeadline(i18n, summary)}</strong>
            <p>{p2ManifestChainPreflightDetail(i18n, summary)}</p>
          </div>
          <em>
            {preflight?.validStageCount ?? summary.validStageCount}/
            {preflight?.totalStageCount ?? summary.totalStageCount}
          </em>
        </div>
        <div className="p2-manifest-chain-preflight-review-meta">
          <span title={sourcePath}>{i18n.locale === "zh-CN" ? "来源" : "Source"} · {sourcePath}</span>
          <span>{i18n.locale === "zh-CN" ? "状态" : "Status"} · {preflight?.status ?? summary.state}</span>
          <span>{i18n.locale === "zh-CN" ? "下一步" : "Next"} · {nextAction || "none"}</span>
          <span>{i18n.locale === "zh-CN" ? "阻断项" : "Blockers"} · {blockerText}</span>
          <span>{boundaryLabel}</span>
        </div>
        <div className="p2-manifest-chain-preflight-review-command">
          <span>{i18n.locale === "zh-CN" ? "推荐命令" : "Command"}</span>
          <code>{nextCommand || "none"}</code>
        </div>
        {auditEventId ? (
          <small className="p2-manifest-chain-preflight-review-audit">
            <span>{i18n.locale === "zh-CN" ? "审计事件" : "Audit event"}</span>
            <code>{auditEventId}</code>
            <em>{auditEventSourceLabel}</em>
          </small>
        ) : null}
        <div className="p2-manifest-chain-preflight-review-stages">
          {preflight?.stages.map((stage) => (
            <div className={`p2-manifest-chain-preflight-review-stage ${stage.status}`} key={stage.id}>
              <span title={stage.path}>{stage.id}</span>
              <em>{stage.status}</em>
            </div>
          )) ??
            stages.map((stage) => (
              <div className={`p2-manifest-chain-preflight-review-stage ${stage.status}`} key={stage.id}>
                <span title={stage.path}>{stage.id}</span>
                <em>{stage.status}</em>
              </div>
            ))}
        </div>
      </div>
    </Panel>
  );
}

export function AdapterChainHealthPanel({
  className,
  i18n,
  onOpenSettings,
  rollups
}: {
  className?: string;
  i18n: AppI18n;
  onOpenSettings?: () => void;
  rollups: ExecutionAdapterChainHealthRollup[];
}) {
  const readyCount = rollups.filter((row) => row.status === "paper_ready").length;
  const blockedCount = rollups.filter((row) => row.status === "blocked").length;
  const inProgressCount = rollups.filter((row) => row.status === "in_progress").length;
  const summary =
    i18n.locale === "zh-CN"
      ? `${readyCount} 条模拟链路就绪 · ${blockedCount} 条阻断 · ${inProgressCount} 条收集中`
      : `${readyCount} paper-ready · ${blockedCount} blocked · ${inProgressCount} in progress`;

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "适配器链路健康" : "Adapter Chain Health"}
      subtitle={i18n.locale === "zh-CN" ? "19 段实盘前证据链" : "19-step pre-live evidence chain"}
      className={className}
      action={
        onOpenSettings ? (
          <button className="adapter-chain-health-settings-button" onClick={onOpenSettings} type="button">
            <GitBranch size={13} />
            <span>{i18n.locale === "zh-CN" ? "配置" : "Settings"}</span>
          </button>
        ) : null
      }
    >
      <div className="adapter-chain-health-summary">
        <strong>{summary}</strong>
        <span>
          {i18n.locale === "zh-CN"
            ? "即使链路完整，也只进入人工复核；直接下单和实盘交易保持关闭。"
            : "A complete chain only reaches manual review; direct order submission and live trading stay disabled."}
        </span>
      </div>
      <AdapterChainHealthList i18n={i18n} rollups={rollups} />
    </Panel>
  );
}

export function AdapterChainHealthList({
  i18n,
  rollups
}: {
  i18n: AppI18n;
  rollups: ExecutionAdapterChainHealthRollup[];
}) {
  if (!rollups.length) {
    return (
      <div className="adapter-chain-health">
        <p className="empty-state">
          {i18n.locale === "zh-CN"
            ? "暂无实盘适配器链路；模拟盘仍可运行，实盘保持关闭。"
            : "No live adapter chain yet; paper trading can continue while live trading stays blocked."}
        </p>
      </div>
    );
  }

  return (
    <div className="adapter-chain-health">
      {rollups.slice(0, 4).map((rollup) => {
        const marketLabel = rollup.market === "multi" ? (i18n.locale === "zh-CN" ? "多市场" : "Multi-market") : i18n.marketLabel(rollup.market);
        return (
          <article className={`adapter-chain-health-row ${rollup.tone}`} key={rollup.id}>
            <div className="adapter-chain-health-head">
              <div>
                <span>{adapterChainHealthStatusLabel(i18n, rollup.status)}</span>
                <strong>{rollup.adapterName}</strong>
                <p>{adapterChainHealthDetailLabel(i18n, rollup)}</p>
              </div>
              <em>
                {rollup.completedStageCount}/{rollup.totalStageCount}
              </em>
            </div>
            <div className="adapter-chain-health-meta">
              <span>
                {i18n.locale === "zh-CN" ? "市场" : "Market"} · {marketLabel}
              </span>
              <span>
                {i18n.locale === "zh-CN" ? "阻塞点" : "Blocker"} ·{" "}
                {rollup.blockerStageId
                  ? adapterChainHealthStageLabel(i18n, rollup.blockerStageId, rollup.blockerLabel)
                  : i18n.locale === "zh-CN"
                    ? "无"
                    : "none"}
              </span>
              <span>
                {i18n.locale === "zh-CN" ? "最近证据" : "Latest evidence"} ·{" "}
                {rollup.latestEvidenceId ?? (i18n.locale === "zh-CN" ? "暂无" : "none")}
              </span>
              <span>
                {i18n.locale === "zh-CN" ? "边界" : "Boundary"} ·{" "}
                {rollup.orderSubmissionEnabled || rollup.liveTradingAllowed
                  ? i18n.locale === "zh-CN"
                    ? "需复核"
                    : "review"
                  : i18n.locale === "zh-CN"
                    ? "实盘关闭"
                    : "live blocked"}
              </span>
            </div>
            <div className="adapter-chain-health-stages">
              {rollup.stages.map((stage) => (
                <span
                  className={`adapter-chain-health-stage ${stage.status}`}
                  key={`${rollup.id}-${stage.id}`}
                  title={`${adapterChainHealthStageLabel(i18n, stage.id, stage.label)} · ${adapterChainHealthStageStatusLabel(
                    i18n,
                    stage.status
                  )} · ${stage.detail}`}
                >
                  {adapterChainHealthStageLabel(i18n, stage.id, stage.label)}
                </span>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function P2PreLiveAcceptancePanel({
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
  summary: P2PreLiveAcceptanceSummary;
}) {
  const context = [summary.market ? i18n.marketLabel(summary.market) : null, summary.symbol, summary.timeframe]
    .filter(Boolean)
    .join(" · ");
  const gateLabel =
    summary.totalGateCount > 0
      ? `${summary.passedGateCount}/${summary.totalGateCount}`
      : `${summary.checkCount}/${summary.requiredCheckCount}`;
  const blockerLabel =
    summary.blockerIds.length > 0
      ? summary.blockerIds.slice(0, 3).join(", ")
      : i18n.locale === "zh-CN"
        ? "无阻断项"
        : "no blockers";
  const auditLabel =
    summary.auditEventIds.length > 0
      ? summary.auditEventIds.slice(0, 2).join(", ")
      : i18n.locale === "zh-CN"
        ? "待写入审计"
        : "audit pending";

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "P2 实盘前验收" : "P2 Pre-live Acceptance"}
      subtitle={i18n.locale === "zh-CN" ? "回读 manifest，保持下单与实盘阻断" : "Manifest readback with order and live trading blocked"}
      className={className}
      action={
        <div className="p2-pre-live-acceptance-actions">
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
      <div className={`p2-pre-live-acceptance ${summary.tone}`}>
        <div className="p2-pre-live-acceptance-head">
          <div>
            <span>{p2PreLiveAcceptanceSummaryStatusLabel(i18n, summary)}</span>
            <strong>{headline}</strong>
            <p>{p2PreLiveAcceptanceSummaryDetail(i18n, summary)}</p>
          </div>
          <em>{gateLabel}</em>
        </div>
        <div className="p2-pre-live-acceptance-meta">
          <span title={summary.sourcePath}>
            {i18n.locale === "zh-CN" ? "来源" : "Source"} · {summary.sourcePath}
          </span>
          <span>{i18n.locale === "zh-CN" ? "上下文" : "Context"} · {context || "n/a"}</span>
          <span>{i18n.locale === "zh-CN" ? "适配器" : "Adapter"} · {summary.adapterId || "n/a"}</span>
          <span>{i18n.locale === "zh-CN" ? "清单" : "Checklist"} · {summary.checklistStatus || summary.state}</span>
          <span>{i18n.locale === "zh-CN" ? "阻断项" : "Blockers"} · {blockerLabel}</span>
          <span>{i18n.locale === "zh-CN" ? "审计" : "Audit"} · {auditLabel}</span>
          <span>{p2PreLiveAcceptanceBoundaryLabel(i18n, summary)}</span>
        </div>
      </div>
    </Panel>
  );
}

export function P2ReadinessAcceptanceReviewPanel({
  acceptance,
  auditEventId,
  auditEventSource,
  className,
  i18n,
  isCopied,
  isRecordingAudit,
  isRefreshing,
  onCopy,
  onDownload,
  onOpenAudit,
  onOpenCoverageReview,
  onRecordAudit,
  onRefresh,
  summary
}: {
  acceptance: P2ReadinessAcceptanceLatestResult["acceptance"] | null;
  auditEventId: string;
  auditEventSource: P2ReadinessAcceptanceAuditEventReferenceSource;
  className?: string;
  i18n: AppI18n;
  isCopied: boolean;
  isRecordingAudit: boolean;
  isRefreshing: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onOpenAudit: () => void;
  onOpenCoverageReview: () => void;
  onRecordAudit: () => void;
  onRefresh: () => void;
  summary: P2ReadinessAcceptanceSummary;
}) {
  const context = [acceptance?.market ? i18n.marketLabel(acceptance.market) : null, acceptance?.symbol, acceptance?.timeframe]
    .filter(Boolean)
    .join(" · ");
  const criteria = acceptance?.criterionIds.map((criterionId) => criterionId) ?? [];
  const reviewCriteria = criteria.length
    ? criteria
    : summary.status === "incomplete"
      ? ["p2_readiness_acceptance_manifest_missing"]
      : ["p2_readiness_acceptance_manifest_invalid"];
  const readinessCoverageStatus = acceptance?.readinessCoverageStatus ?? "n/a";
  const boundaryLabel =
    acceptance?.liveBlockedBoundary &&
    !acceptance.orderSubmissionEnabled &&
    !acceptance.liveTradingAllowed &&
    !acceptance.liveOrderSubmitted &&
    !acceptance.routeExecuted
      ? i18n.locale === "zh-CN"
        ? "实盘边界关闭"
        : "live boundary closed"
      : i18n.locale === "zh-CN"
        ? "实盘边界需复核"
        : "live boundary needs review";

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "P2 顶层验收复核" : "P2 Readiness Acceptance Review"}
      subtitle={i18n.locale === "zh-CN" ? "本地 readiness manifest 与实盘阻断边界" : "Local readiness manifest and live-blocked boundary"}
      className={className}
      action={
        <div className="p2-readiness-acceptance-review-actions">
          <button onClick={onCopy} type="button">
            {isCopied ? <Check size={13} /> : <Copy size={13} />}
            <span>
              {isCopied
                ? i18n.locale === "zh-CN"
                  ? "已复制"
                  : "Copied"
                : i18n.locale === "zh-CN"
                  ? "复制"
                  : "Copy"}
            </span>
          </button>
          <button onClick={onDownload} type="button">
            <Download size={13} />
            <span>{i18n.locale === "zh-CN" ? "下载" : "Download"}</span>
          </button>
          <button disabled={isRecordingAudit} onClick={onRecordAudit} type="button">
            {isRecordingAudit ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
            <span>
              {isRecordingAudit
                ? i18n.locale === "zh-CN"
                  ? "入账中"
                  : "Recording"
                : i18n.locale === "zh-CN"
                  ? "入账"
                : "Record"}
            </span>
          </button>
          <button onClick={onOpenAudit} type="button">
            <ShieldCheck size={13} />
            <span>{i18n.locale === "zh-CN" ? "审计" : "Audit"}</span>
          </button>
          <button onClick={onOpenCoverageReview} type="button">
            <Search size={13} />
            <span>{i18n.locale === "zh-CN" ? "覆盖复核" : "Coverage review"}</span>
          </button>
          <button disabled={isRefreshing} onClick={onRefresh} type="button">
            <RefreshCw className={isRefreshing ? "spin" : ""} size={13} />
            <span>{isRefreshing ? (i18n.locale === "zh-CN" ? "刷新中" : "Refreshing") : i18n.locale === "zh-CN" ? "刷新" : "Refresh"}</span>
          </button>
        </div>
      }
    >
      <div className={`p2-readiness-acceptance-review ${summary.tone}`}>
        <div className="p2-readiness-acceptance-review-head">
          <div>
            <span>{p2ReadinessAcceptanceStatusLabel(i18n, summary.status)}</span>
            <strong>{p2ReadinessAcceptanceHeadline(i18n, summary)}</strong>
            <p>{p2ReadinessAcceptanceDetail(i18n, summary)}</p>
          </div>
          <em>
            {acceptance?.acceptedCriterionCount ?? summary.acceptedCount}/
            {acceptance?.totalCriterionCount ?? summary.totalCount}
          </em>
        </div>
        <div className="p2-readiness-acceptance-review-meta">
          <span title={acceptance?.sourcePath ?? "data/p2-readiness-acceptance.json"}>
            {i18n.locale === "zh-CN" ? "来源" : "Source"} ·{" "}
            {acceptance?.sourcePath ?? "data/p2-readiness-acceptance.json"}
          </span>
          <span>{i18n.locale === "zh-CN" ? "运行" : "Run"} · {acceptance?.runId ?? "n/a"}</span>
          <span>{i18n.locale === "zh-CN" ? "上下文" : "Context"} · {context || "n/a"}</span>
          <span>{i18n.locale === "zh-CN" ? "适配器" : "Adapter"} · {acceptance?.adapterId ?? "n/a"}</span>
          <span>{i18n.locale === "zh-CN" ? "覆盖" : "Coverage"} · {readinessCoverageStatus}</span>
          <span>
            {i18n.locale === "zh-CN" ? "覆盖复核" : "Coverage review"} ·{" "}
            {summary.evidenceCoverageReviewAuditEventId || "n/a"}
          </span>
          <span>{i18n.locale === "zh-CN" ? "阻断项" : "Blockers"} · {acceptance?.blockingCriterionCount ?? summary.blockingCount}</span>
          <span>{boundaryLabel}</span>
        </div>
        {auditEventId ? (
          <small className="p2-readiness-acceptance-review-audit">
            <span>{i18n.locale === "zh-CN" ? "审计事件" : "Audit event"}</span>
            <code>{auditEventId}</code>
            <em>{p2ReadinessAcceptanceAuditEventSourceLabel(i18n, auditEventSource)}</em>
          </small>
        ) : null}
        <div className="p2-readiness-acceptance-review-manifests">
          <span>{i18n.locale === "zh-CN" ? "P1 验收" : "P1 acceptance"} · {acceptance?.manifestPaths.p1Acceptance ?? "n/a"}</span>
          <span>{i18n.locale === "zh-CN" ? "P2 pre-live" : "P2 pre-live"} · {acceptance?.manifestPaths.p2PreLiveAcceptance ?? "n/a"}</span>
          <span>{i18n.locale === "zh-CN" ? "纸面回放" : "Paper replay"} · {acceptance?.manifestPaths.p2PaperReplay ?? "n/a"}</span>
        </div>
        <div className="p2-readiness-acceptance-review-criteria">
          {reviewCriteria.map((criterionId) => (
            <div className="p2-readiness-acceptance-review-criterion" key={criterionId}>
              <span>{p2ReadinessAcceptanceRowLabel(i18n, criterionId as P2ReadinessAcceptanceSummary["rows"][number]["id"])}</span>
              <em>
                {summary.status === "accepted"
                  ? i18n.locale === "zh-CN"
                    ? "通过"
                    : "passed"
                  : p2ReadinessAcceptanceStatusLabel(i18n, summary.status)}
              </em>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function P2ReadinessEvidenceCoverageReviewPanel({
  auditEventId,
  auditEventSource,
  className,
  coverage,
  i18n,
  isCopied,
  isRecordingAudit,
  onCopy,
  onDownload,
  onOpenAcceptanceReview,
  onOpenAudit,
  onRecordAudit
}: {
  auditEventId: string;
  auditEventSource: P2ReadinessEvidenceCoverageReviewAuditEventReferenceSource;
  className?: string;
  coverage: P2ReadinessEvidenceCoverage;
  i18n: AppI18n;
  isCopied: boolean;
  isRecordingAudit: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onOpenAcceptanceReview: () => void;
  onOpenAudit: () => void;
  onRecordAudit: () => void;
}) {
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
  const boundaryLabel =
    !coverage.orderSubmissionEnabled && !coverage.liveTradingAllowed
      ? i18n.locale === "zh-CN"
        ? "实盘边界关闭"
        : "live boundary closed"
      : i18n.locale === "zh-CN"
        ? "实盘边界需复核"
        : "live boundary needs review";

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "P2 证据覆盖复核" : "P2 Evidence Coverage Review"}
      subtitle={i18n.locale === "zh-CN" ? "覆盖矩阵的可留档审计报告" : "Portable audit report for the coverage matrix"}
      className={className}
      action={
        <div className="p2-readiness-evidence-coverage-review-actions">
          <button onClick={onCopy} type="button">
            {isCopied ? <Check size={13} /> : <Copy size={13} />}
            <span>
              {isCopied
                ? i18n.locale === "zh-CN"
                  ? "已复制"
                  : "Copied"
                : i18n.locale === "zh-CN"
                  ? "复制"
                  : "Copy"}
            </span>
          </button>
          <button onClick={onDownload} type="button">
            <Download size={13} />
            <span>{i18n.locale === "zh-CN" ? "下载" : "Download"}</span>
          </button>
          <button disabled={isRecordingAudit} onClick={onRecordAudit} type="button">
            {isRecordingAudit ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
            <span>
              {isRecordingAudit
                ? i18n.locale === "zh-CN"
                  ? "入账中"
                  : "Recording"
                : i18n.locale === "zh-CN"
                  ? "入账"
                  : "Record"}
            </span>
          </button>
          <button onClick={onOpenAudit} type="button">
            <ShieldCheck size={13} />
            <span>{i18n.locale === "zh-CN" ? "审计" : "Audit"}</span>
          </button>
          <button onClick={onOpenAcceptanceReview} type="button">
            <Search size={13} />
            <span>{i18n.locale === "zh-CN" ? "顶层复核" : "Acceptance review"}</span>
          </button>
        </div>
      }
    >
      <div className={`p2-readiness-evidence-coverage-review ${coverage.tone}`}>
        <div className="p2-readiness-evidence-coverage-review-head">
          <div>
            <span>{p2EvidenceCoverageStatusLabel(i18n, coverage.status)}</span>
            <strong>{p2EvidenceCoverageHeadline(i18n, coverage)}</strong>
            <p>{p2EvidenceCoverageDetail(i18n, coverage)}</p>
          </div>
          <em>
            {coverage.coveredCount}/{coverage.totalCount}
          </em>
        </div>
        <div className="p2-readiness-evidence-coverage-review-meta">
          <span>{i18n.locale === "zh-CN" ? "状态" : "Status"} · {coverage.status}</span>
          <span>{i18n.locale === "zh-CN" ? "阻断项" : "Blockers"} · {coverage.blockingCount}</span>
          <span>{boundaryLabel}</span>
        </div>
        {auditEventId ? (
          <small className="p2-readiness-evidence-coverage-review-audit">
            <span>{i18n.locale === "zh-CN" ? "审计事件" : "Audit event"}</span>
            <code>{auditEventId}</code>
            <em>{auditEventSourceLabel}</em>
          </small>
        ) : null}
        <div className="p2-readiness-evidence-coverage-review-rows">
          {coverage.rows.map((row) => (
            <div className={`p2-readiness-evidence-coverage-review-row ${row.tone}`} key={row.id}>
              <div>
                <span>{p2EvidenceCoverageRowLabel(i18n, row.id)}</span>
                <strong>{p2EvidenceCoverageStatusLabel(i18n, row.status)}</strong>
              </div>
              <em>{p2EvidenceCoverageSourceLabel(i18n, row.sourceType)}</em>
              <small title={row.sourceId ?? row.detail}>{row.sourceId || "n/a"}</small>
              <p>{row.evidence}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function P0AcceptanceReviewPanel({
  acceptance,
  className,
  i18n,
  isCopied,
  isRecordingAudit,
  isRefreshing,
  onCopy,
  onDownload,
  onRecordAudit,
  onRefresh,
  summary
}: {
  acceptance: P0AcceptanceLatestResult["acceptance"] | null;
  className?: string;
  i18n: AppI18n;
  isCopied: boolean;
  isRecordingAudit: boolean;
  isRefreshing: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onRecordAudit: () => void;
  onRefresh: () => void;
  summary: P0AcceptanceSummary;
}) {
  const context = [acceptance?.market ? i18n.marketLabel(acceptance.market) : null, acceptance?.symbol, acceptance?.timeframe]
    .filter(Boolean)
    .join(" · ");
  const manifestCheckIds = acceptance?.checkIds.map((checkId) => checkId) ?? [];
  const checks = manifestCheckIds.length
    ? manifestCheckIds
    : summary.state === "missing"
      ? ["p0_acceptance_manifest_missing"]
      : ["p0_acceptance_manifest_invalid"];

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "P0 验收复核" : "P0 Acceptance Review"}
      subtitle={i18n.locale === "zh-CN" ? "本地验收 manifest 与实盘阻断边界" : "Local acceptance manifest and live-blocked boundary"}
      className={className}
      action={
        <div className="p0-acceptance-review-actions">
          <button onClick={onCopy} type="button">
            {isCopied ? <Check size={13} /> : <Copy size={13} />}
            <span>
              {isCopied
                ? i18n.locale === "zh-CN"
                  ? "已复制"
                  : "Copied"
                : i18n.locale === "zh-CN"
                  ? "复制"
                  : "Copy"}
            </span>
          </button>
          <button onClick={onDownload} type="button">
            <Download size={13} />
            <span>{i18n.locale === "zh-CN" ? "下载" : "Download"}</span>
          </button>
          <button disabled={isRecordingAudit} onClick={onRecordAudit} type="button">
            {isRecordingAudit ? <RefreshCw className="spin" size={13} /> : <ShieldCheck size={13} />}
            <span>
              {isRecordingAudit
                ? i18n.locale === "zh-CN"
                  ? "入账中"
                  : "Recording"
                : i18n.locale === "zh-CN"
                  ? "入账"
                  : "Record"}
            </span>
          </button>
          <button disabled={isRefreshing} onClick={onRefresh} type="button">
            <RefreshCw className={isRefreshing ? "spin" : ""} size={13} />
            <span>{isRefreshing ? (i18n.locale === "zh-CN" ? "刷新中" : "Refreshing") : i18n.locale === "zh-CN" ? "刷新" : "Refresh"}</span>
          </button>
        </div>
      }
    >
      <div className={`p0-acceptance-review ${summary.tone}`}>
        <div className="p0-acceptance-review-head">
          <div>
            <span>{p0AcceptanceReviewStatusLabel(i18n, summary.state)}</span>
            <strong>{p0AcceptanceSummaryHeadline(i18n, summary)}</strong>
            <p>{p0AcceptanceSummaryDetail(i18n, summary)}</p>
          </div>
          <em>
            {summary.checkCount}/{summary.requiredCheckCount}
          </em>
        </div>
        <div className="p0-acceptance-review-meta">
          <span title={summary.sourcePath}>
            {i18n.locale === "zh-CN" ? "来源" : "Source"} · {summary.sourcePath}
          </span>
          <span>{i18n.locale === "zh-CN" ? "运行" : "Run"} · {summary.runId || "n/a"}</span>
          <span>{i18n.locale === "zh-CN" ? "上下文" : "Context"} · {context || "n/a"}</span>
          <span>{p0AcceptanceReviewBoundaryLabel(i18n, summary)}</span>
        </div>
        <div className="p0-acceptance-review-checks">
          {checks.map((checkId) => (
            <div className="p0-acceptance-review-check" key={checkId}>
              <span>{p0AcceptanceReviewCheckLabel(i18n, checkId)}</span>
              <em>{summary.state === "passed" ? (i18n.locale === "zh-CN" ? "通过" : "passed") : p0AcceptanceReviewStatusLabel(i18n, summary.state)}</em>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
