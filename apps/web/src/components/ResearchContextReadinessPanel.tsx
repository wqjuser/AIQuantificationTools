import { Copy, Download, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Panel } from "./AppPanel";
import type { AppI18n } from "../lib/i18n";
import type { MarketDataReadinessResult } from "../lib/terminal-api";
import type {
  MarketDataRefreshGuard,
  ResearchContextEvidenceRow,
  ResearchContextReadinessRow
} from "../lib/terminal-workbench";

export type MarketDataRefreshOverrideAuditStatus =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved"; eventId: string }
  | { state: "failed"; error: string };

function MarketDataRefreshOverrideControl({
  auditStatus = { state: "idle" },
  i18n,
  onApplyOverride,
  onClearOverride,
  overrideReason,
  refreshGuard
}: {
  auditStatus?: MarketDataRefreshOverrideAuditStatus;
  i18n: AppI18n;
  onApplyOverride?: (reason: string) => void | Promise<void>;
  onClearOverride?: () => void;
  overrideReason?: string | null;
  refreshGuard?: MarketDataRefreshGuard;
}) {
  const [draftReason, setDraftReason] = useState(overrideReason ?? "");
  const isVisible = Boolean(refreshGuard && (refreshGuard.status === "cooldown" || refreshGuard.overrideApplied));
  const normalizedReason = draftReason.trim();

  useEffect(() => {
    setDraftReason(overrideReason ?? "");
  }, [overrideReason, refreshGuard?.status]);

  if (!isVisible || !onApplyOverride) {
    return null;
  }

  return (
    <div className={`market-refresh-override${refreshGuard?.overrideApplied ? " active" : ""}`}>
      <label>
        <span>{i18n.locale === "zh-CN" ? "覆盖原因" : "Override reason"}</span>
        <input
          onChange={(event) => setDraftReason(event.target.value)}
          placeholder={
            i18n.locale === "zh-CN"
              ? "例如：已确认上游恢复，本次手动刷新"
              : "Example: upstream recovered, refresh this run"
          }
          value={draftReason}
        />
      </label>
      <button
        className="market-refresh-override-apply"
        disabled={!normalizedReason || auditStatus.state === "saving"}
        onClick={() => void onApplyOverride(normalizedReason)}
        type="button"
      >
        <ShieldCheck size={13} />
        <span>
          {auditStatus.state === "saving"
            ? i18n.locale === "zh-CN"
              ? "记录中"
              : "Recording"
            : i18n.locale === "zh-CN"
              ? "本次仍刷新"
              : "Manual override"}
        </span>
      </button>
      {refreshGuard?.overrideApplied ? (
        <button className="market-refresh-override-clear" onClick={onClearOverride} type="button">
          {i18n.locale === "zh-CN" ? "取消覆盖" : "Clear"}
        </button>
      ) : null}
      {auditStatus.state !== "idle" ? (
        <p className={`market-refresh-override-audit-status ${auditStatus.state}`}>
          {marketDataRefreshOverrideAuditStatusLabel(i18n, auditStatus)}
        </p>
      ) : null}
    </div>
  );
}

function marketDataRefreshOverrideAuditStatusLabel(
  i18n: AppI18n,
  status: MarketDataRefreshOverrideAuditStatus
): string {
  if (status.state === "saving") {
    return i18n.locale === "zh-CN" ? "覆盖审计写入中，写入成功后才会放行刷新。" : "Recording override audit before refresh is enabled.";
  }
  if (status.state === "saved") {
    return i18n.locale === "zh-CN"
      ? `覆盖审计已记录：${status.eventId}`
      : `Override audit recorded: ${status.eventId}`;
  }
  if (status.state === "failed") {
    return i18n.locale === "zh-CN"
      ? `覆盖审计失败：${status.error}`
      : `Override audit failed: ${status.error}`;
  }
  return "";
}

function MarketDataReadinessStrip({
  i18n,
  readinessState
}: {
  i18n: AppI18n;
  readinessState: MarketDataReadinessResult;
}) {
  const readiness = readinessState.readiness;
  if (!readiness) {
    return (
      <div className="market-data-readiness-strip blocked">
        <div>
          <span>{i18n.locale === "zh-CN" ? "数据就绪" : "Data readiness"}</span>
          <strong>{i18n.locale === "zh-CN" ? "等待核心服务" : "Waiting for core"}</strong>
          <p>{readinessState.error ?? (i18n.locale === "zh-CN" ? "尚未加载数据就绪合同。" : "Readiness contract is not loaded yet.")}</p>
        </div>
      </div>
    );
  }

  const latestBar = readiness.latestBarAt ?? (i18n.locale === "zh-CN" ? "无" : "n/a");
  const repairLabel = readiness.repairActions.length
    ? readiness.repairActions.map((action) => marketDataReadinessRepairLabel(i18n, action.label)).join(" · ")
    : i18n.locale === "zh-CN"
      ? "无需修复"
      : "No repair needed";

  return (
    <div className={`market-data-readiness-strip ${readiness.state}`}>
      <div>
        <span>{i18n.locale === "zh-CN" ? "数据就绪" : "Data readiness"}</span>
        <strong>{marketDataReadinessStateLabel(i18n, readiness.state)}</strong>
        <p>{marketDataReadinessDetail(i18n, readiness)}</p>
      </div>
      <dl>
        <div>
          <dt>{i18n.locale === "zh-CN" ? "来源" : "Source"}</dt>
          <dd>{readiness.source}</dd>
        </div>
        <div>
          <dt>{i18n.locale === "zh-CN" ? "缓存" : "Cache"}</dt>
          <dd>{marketDataReadinessCacheLabel(i18n, readiness.cacheState, readiness.ageHours)}</dd>
        </div>
        <div>
          <dt>{i18n.locale === "zh-CN" ? "K线" : "Bars"}</dt>
          <dd>{readiness.barCount.toLocaleString(i18n.locale === "zh-CN" ? "zh-CN" : "en-US")}</dd>
        </div>
        <div>
          <dt>{i18n.locale === "zh-CN" ? "数据提供方" : "Provider"}</dt>
          <dd>{marketDataReadinessProviderLabel(i18n, readiness.providerHealthState)}</dd>
        </div>
        <div>
          <dt>{i18n.locale === "zh-CN" ? "最新" : "Latest"}</dt>
          <dd>{latestBar}</dd>
        </div>
        <div>
          <dt>{i18n.locale === "zh-CN" ? "修复" : "Repair"}</dt>
          <dd>{repairLabel}</dd>
        </div>
      </dl>
    </div>
  );
}

function marketDataReadinessStateLabel(i18n: AppI18n, state: "ready" | "stale" | "blocked"): string {
  if (i18n.locale === "en-US") {
    return { ready: "Ready", stale: "Stale", blocked: "Blocked" }[state];
  }
  return { ready: "可用", stale: "需刷新", blocked: "阻断" }[state];
}

function marketDataReadinessDetail(
  i18n: AppI18n,
  readiness: NonNullable<MarketDataReadinessResult["readiness"]>
): string {
  if (i18n.locale === "en-US") {
    if (readiness.state === "ready") {
      return `${readiness.symbol} ${readiness.timeframe} is ready for research.`;
    }
    if (readiness.state === "stale") {
      return `${readiness.symbol} has cached bars, but the cache should be refreshed.`;
    }
    return readiness.blockingReasons.length
      ? readiness.blockingReasons.join(" · ")
      : `${readiness.symbol} is not ready for research.`;
  }
  if (readiness.state === "ready") {
    return `${readiness.symbol} ${i18n.strategyText(readiness.timeframe)} 已可用于研究。`;
  }
  if (readiness.state === "stale") {
    return `${readiness.symbol} 有缓存，但需要刷新后再进入流水线。`;
  }
  return readiness.blockingReasons.length
    ? readiness.blockingReasons.map((reason) => i18n.strategyText(reason)).join(" · ")
    : `${readiness.symbol} 当前不能进入研究流水线。`;
}

function marketDataReadinessCacheLabel(
  i18n: AppI18n,
  cacheState: "fresh" | "stale" | "empty",
  ageHours: number | null
): string {
  const age = ageHours === null ? "" : i18n.locale === "zh-CN" ? ` · ${ageHours} 小时` : ` · ${ageHours}h`;
  if (i18n.locale === "en-US") {
    return { fresh: "Fresh", stale: "Stale", empty: "Empty" }[cacheState] + age;
  }
  return { fresh: "新鲜", stale: "过期", empty: "空" }[cacheState] + age;
}

function marketDataReadinessProviderLabel(
  i18n: AppI18n,
  providerHealthState: "healthy" | "degraded"
): string {
  if (i18n.locale === "en-US") {
    return providerHealthState === "healthy" ? "Healthy" : "Degraded";
  }
  return providerHealthState === "healthy" ? "健康" : "降级";
}

function marketDataReadinessRepairLabel(i18n: AppI18n, label: string): string {
  if (i18n.locale === "en-US") {
    return label;
  }
  return label
    .replace("Refresh market cache", "刷新行情缓存")
    .replace("Review provider health", "检查数据源健康");
}

function ResearchContextReadinessPanel({
  className,
  i18n,
  isRefreshingCache = false,
  isRefreshingWatchlistCache = false,
  refreshGuard,
  refreshOverrideAuditStatus,
  refreshOverrideReason,
  isSavingNote = false,
  isSavingWatchlist = false,
  isSavingWorkspace = false,
  onApplyRefreshOverride,
  onClearRefreshOverride,
  onRefreshCache,
  onRefreshWatchlistCache,
  onInspectRefreshEvidence,
  onSaveNote,
  onSaveWatchlist,
  onSaveWorkspace,
  onCopyReadinessReport,
  onDownloadReadinessReport,
  onRecordReadinessReport,
  latestReadinessReport,
  latestOtherReadinessReport,
  marketDataReadiness,
  readinessReportCoverageStatus = "missing",
  onOpenLatestReadinessReport,
  onOpenLatestOtherReadinessReport,
  onOpenLatestReadinessReportContext,
  onCopyLatestReadinessReportLink,
  onCopyLatestOtherReadinessReportLink,
  isReadinessReportCopied = false,
  evidenceRows,
  rows
}: {
  className?: string;
  i18n: AppI18n;
  isRefreshingCache?: boolean;
  isRefreshingWatchlistCache?: boolean;
  refreshGuard?: MarketDataRefreshGuard;
  refreshOverrideAuditStatus?: MarketDataRefreshOverrideAuditStatus;
  refreshOverrideReason?: string | null;
  isSavingNote?: boolean;
  isSavingWatchlist?: boolean;
  isSavingWorkspace?: boolean;
  onApplyRefreshOverride?: (reason: string) => void;
  onClearRefreshOverride?: () => void;
  onRefreshCache?: () => void;
  onRefreshWatchlistCache?: () => void;
  onInspectRefreshEvidence?: (runId: string) => void;
  onSaveNote?: () => void;
  onSaveWatchlist?: () => void;
  onSaveWorkspace?: () => void;
  onCopyReadinessReport?: () => void;
  onDownloadReadinessReport?: () => void;
  onRecordReadinessReport?: () => void;
  latestReadinessReport?: {
    linkSearch: string;
    preflightStatus: string;
    preparationEvidenceRunId: string;
    query: string;
    runId: string;
    shortHash: string;
  } | null;
  latestOtherReadinessReport?: {
    contextLabel: string;
    query: string;
    runId: string;
    shortHash: string;
  } | null;
  marketDataReadiness: MarketDataReadinessResult;
  readinessReportCoverageStatus?: "matched" | "context-mismatch" | "missing";
  onOpenLatestReadinessReport?: () => void;
  onOpenLatestOtherReadinessReport?: () => void;
  onOpenLatestReadinessReportContext?: () => void;
  onCopyLatestReadinessReportLink?: () => void;
  onCopyLatestOtherReadinessReportLink?: () => void;
  isReadinessReportCopied?: boolean;
  evidenceRows: ResearchContextEvidenceRow[];
  rows: ResearchContextReadinessRow[];
}) {
  const missingReadinessReportTitle =
    readinessReportCoverageStatus === "context-mismatch"
      ? i18n.locale === "zh-CN" ? "当前上下文未入账" : "Current context not recorded"
      : i18n.locale === "zh-CN" ? "等待入账当前上下文" : "Waiting for this context";
  const missingReadinessReportDetail =
    readinessReportCoverageStatus === "context-mismatch"
      ? i18n.locale === "zh-CN" ? "已有其他标的或周期的报告；请入账当前上下文。" : "Other symbols or timeframes have reports; record this context."
      : i18n.locale === "zh-CN"
        ? "复制、下载或入账报告后会在这里回显。"
        : "Copy, download, or audit a report and it will appear here.";

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "研究上下文就绪" : "Research Context Readiness"}
      subtitle={
        i18n.locale === "zh-CN"
          ? "阶段 1 · 标的、自选、K线、缓存、刷新证据、笔记、工作区、审计运行"
          : "Stage 1 · symbol, watchlist, K-lines, cache, refresh evidence, notes, workspace, audited run"
      }
      className={className}
      action={
        onCopyReadinessReport || onDownloadReadinessReport || onRecordReadinessReport ? (
          <div className="research-context-report-actions">
            {onCopyReadinessReport ? (
              <button className="research-context-report-button" onClick={onCopyReadinessReport} type="button">
                <Copy size={13} />
                <span>
                  {isReadinessReportCopied
                    ? i18n.locale === "zh-CN"
                      ? "已复制"
                      : "Copied"
                    : i18n.locale === "zh-CN"
                      ? "复制报告"
                      : "Copy report"}
                </span>
              </button>
            ) : null}
            {onDownloadReadinessReport ? (
              <button className="research-context-report-button" onClick={onDownloadReadinessReport} type="button">
                <Download size={13} />
                <span>{i18n.locale === "zh-CN" ? "下载报告" : "Download"}</span>
              </button>
            ) : null}
            {onRecordReadinessReport ? (
              <button className="research-context-report-button" onClick={onRecordReadinessReport} type="button">
                <Save size={13} />
                <span>{i18n.locale === "zh-CN" ? "入账报告" : "Audit"}</span>
              </button>
            ) : null}
          </div>
        ) : null
      }
    >
      {refreshGuard?.blocked || refreshGuard?.overrideApplied ? (
        <p className="market-refresh-guard-note">{marketDataRefreshGuardLabel(i18n, refreshGuard)}</p>
      ) : null}
      <MarketDataRefreshOverrideControl
        auditStatus={refreshOverrideAuditStatus}
        i18n={i18n}
        onApplyOverride={onApplyRefreshOverride}
        onClearOverride={onClearRefreshOverride}
        overrideReason={refreshOverrideReason}
        refreshGuard={refreshGuard}
      />
      <MarketDataReadinessStrip i18n={i18n} readinessState={marketDataReadiness} />
      {latestReadinessReport?.runId ? (
        <div className="research-context-latest-report">
          <div>
            <span>{i18n.locale === "zh-CN" ? "最近入账报告" : "Latest recorded report"}</span>
            <strong>{latestReadinessReport.runId}</strong>
            <small>
              {latestReadinessReport.shortHash || "n/a"} · {latestReadinessReport.preflightStatus || "n/a"}
            </small>
            {latestReadinessReport.preparationEvidenceRunId ? (
              <em title={latestReadinessReport.preparationEvidenceRunId}>
                prep {latestReadinessReport.preparationEvidenceRunId}
              </em>
            ) : null}
          </div>
          <div className="research-context-latest-report-actions">
            {latestReadinessReport.query ? (
              <button onClick={onOpenLatestReadinessReport} type="button">
                {i18n.locale === "zh-CN" ? "定位审计报告" : "Focus audit report"}
              </button>
            ) : null}
            {latestReadinessReport.linkSearch ? (
              <button onClick={onOpenLatestReadinessReportContext} type="button">
                {i18n.locale === "zh-CN" ? "打开研究上下文" : "Open research context"}
              </button>
            ) : null}
            {latestReadinessReport.linkSearch ? (
              <button onClick={onCopyLatestReadinessReportLink} type="button">
                {i18n.locale === "zh-CN" ? "复制研究链接" : "Copy research link"}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className={`research-context-latest-report muted ${readinessReportCoverageStatus}`}>
          <div>
            <span>{i18n.locale === "zh-CN" ? "最近入账报告" : "Latest recorded report"}</span>
            <strong>{missingReadinessReportTitle}</strong>
            <small>{missingReadinessReportDetail}</small>
            {readinessReportCoverageStatus === "context-mismatch" && latestOtherReadinessReport?.runId ? (
              <em title={latestOtherReadinessReport.runId}>
                {latestOtherReadinessReport.contextLabel} ·{" "}
                {latestOtherReadinessReport.shortHash || latestOtherReadinessReport.runId}
              </em>
            ) : null}
          </div>
          {readinessReportCoverageStatus === "context-mismatch" && latestOtherReadinessReport?.query ? (
            <div className="research-context-latest-report-actions">
              <button onClick={onOpenLatestOtherReadinessReport} type="button">
                {i18n.locale === "zh-CN" ? "定位其他报告" : "Focus other report"}
              </button>
              {onCopyLatestOtherReadinessReportLink ? (
                <button onClick={onCopyLatestOtherReadinessReportLink} type="button">
                  {i18n.locale === "zh-CN" ? "复制其他报告链接" : "Copy other report link"}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
      <div className="research-context-checklist">
        {rows.map((row, index) => {
          const action = row.action;
          const refreshEvidenceRunId = row.id === "refresh" ? row.evidenceRunId : undefined;
          return (
            <article className={`research-context-row ${row.tone}`} key={row.id}>
              <span className="research-context-index">{index + 1}</span>
              <div>
                <strong>
                  {researchContextReadinessLabel(i18n, row)}
                  <span>{researchContextReadinessValue(i18n, row)}</span>
                </strong>
                <p>{researchContextReadinessDetail(i18n, row)}</p>
              </div>
              <div className="research-context-actions">
                <em>{researchContextReadinessStatusLabel(i18n, row.status)}</em>
                {refreshEvidenceRunId ? (
                  <button onClick={() => onInspectRefreshEvidence?.(refreshEvidenceRunId)} type="button">
                    {i18n.locale === "zh-CN" ? "查看明细" : "Details"}
                  </button>
                ) : null}
                {action ? (
                  <button
                    disabled={isResearchContextActionDisabled(
                      action,
                      isRefreshingCache,
                      isRefreshingWatchlistCache,
                      Boolean(refreshGuard?.blocked),
                      isSavingNote,
                      isSavingWatchlist,
                      isSavingWorkspace
                    )}
                    onClick={() =>
                      runResearchContextReadinessAction(
                        action,
                        onRefreshCache,
                        onRefreshWatchlistCache,
                        onSaveNote,
                        onSaveWatchlist,
                        onSaveWorkspace
                      )
                    }
                    type="button"
                  >
                    {researchContextReadinessActionLabel(
                      i18n,
                      action,
                      isRefreshingCache,
                      isRefreshingWatchlistCache,
                      Boolean(refreshGuard?.blocked),
                      isSavingNote,
                      isSavingWatchlist,
                      isSavingWorkspace
                    )}
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
        {evidenceRows.map((row, index) => (
          <article className={`research-context-row ${row.tone}`} key={row.id}>
            <span className="research-context-index">{rows.length + index + 1}</span>
            <div>
              <strong>
                {researchContextEvidenceLabel(i18n, row)}
                <span>{researchContextEvidenceValue(i18n, row)}</span>
              </strong>
              <p>{researchContextEvidenceDetail(i18n, row)}</p>
            </div>
            <div className="research-context-actions">
              <em>{researchContextReadinessStatusLabel(i18n, row.status)}</em>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

export function researchContextReadinessActionLabel(
  i18n: AppI18n,
  action: NonNullable<ResearchContextReadinessRow["action"]>,
  isRefreshingCache: boolean,
  isRefreshingWatchlistCache: boolean,
  isRefreshGuardBlocked: boolean,
  isSavingNote: boolean,
  isSavingWatchlist: boolean,
  isSavingWorkspace: boolean
): string {
  if (action === "refresh-cache") {
    if (isRefreshGuardBlocked) {
      return i18n.locale === "zh-CN" ? "冷却中" : "Cooldown";
    }
    if (isRefreshingCache) {
      return i18n.locale === "zh-CN" ? "刷新中" : "Refreshing";
    }
    return i18n.locale === "zh-CN" ? "刷新缓存" : "Refresh cache";
  }
  if (action === "refresh-watchlist-cache") {
    if (isRefreshGuardBlocked) {
      return i18n.locale === "zh-CN" ? "冷却中" : "Cooldown";
    }
    if (isRefreshingWatchlistCache) {
      return i18n.locale === "zh-CN" ? "刷新中" : "Refreshing";
    }
    return i18n.locale === "zh-CN" ? "刷新自选缓存" : "Refresh watchlist";
  }
  if (action === "save-workspace") {
    if (isSavingWorkspace) {
      return i18n.locale === "zh-CN" ? "保存中" : "Saving";
    }
    return i18n.locale === "zh-CN" ? "保存工作区" : "Save workspace";
  }
  if (action === "save-watchlist") {
    if (isSavingWatchlist) {
      return i18n.locale === "zh-CN" ? "保存中" : "Saving";
    }
    return i18n.locale === "zh-CN" ? "保存自选" : "Save watchlist";
  }
  if (isSavingNote) {
    return i18n.locale === "zh-CN" ? "保存中" : "Saving";
  }
  return i18n.locale === "zh-CN" ? "保存笔记" : "Save note";
}

export function isResearchContextActionDisabled(
  action: NonNullable<ResearchContextReadinessRow["action"]>,
  isRefreshingCache: boolean,
  isRefreshingWatchlistCache: boolean,
  isRefreshGuardBlocked: boolean,
  isSavingNote: boolean,
  isSavingWatchlist: boolean,
  isSavingWorkspace: boolean
): boolean {
  if (action === "refresh-cache") {
    return isRefreshingCache || isRefreshGuardBlocked;
  }
  if (action === "refresh-watchlist-cache") {
    return isRefreshingWatchlistCache || isRefreshGuardBlocked;
  }
  if (action === "save-workspace") {
    return isSavingWorkspace;
  }
  if (action === "save-watchlist") {
    return isSavingWatchlist;
  }
  return isSavingNote;
}

export function runResearchContextReadinessAction(
  action: NonNullable<ResearchContextReadinessRow["action"]>,
  onRefreshCache?: () => void,
  onRefreshWatchlistCache?: () => void,
  onSaveNote?: () => void,
  onSaveWatchlist?: () => void,
  onSaveWorkspace?: () => void
): void {
  if (action === "refresh-cache") {
    onRefreshCache?.();
    return;
  }
  if (action === "refresh-watchlist-cache") {
    onRefreshWatchlistCache?.();
    return;
  }
  if (action === "save-workspace") {
    onSaveWorkspace?.();
    return;
  }
  if (action === "save-watchlist") {
    onSaveWatchlist?.();
    return;
  }
  onSaveNote?.();
}

function researchContextReadinessLabel(i18n: AppI18n, row: ResearchContextReadinessRow): string {
  if (i18n.locale !== "zh-CN") {
    return row.label;
  }
  const labels: Record<ResearchContextReadinessRow["id"], string> = {
    instrument: "标的",
    watchlist: "自选状态",
    calendar: "交易日历",
    klines: "K线数据",
    cache: "本地缓存",
    refresh: "刷新证据",
    note: "研究笔记",
    workspace: "工作区状态"
  };
  return labels[row.id];
}

export function researchContextReadinessValue(
  i18n: AppI18n,
  row: Pick<ResearchContextReadinessRow, "id" | "value">
): string {
  if (i18n.locale !== "zh-CN") {
    return row.value;
  }
  if (row.id === "instrument") {
    const timeframeLabels: Record<string, string> = {
      "1m": "1 分",
      "5m": "5 分",
      "1d": "日 K",
      "1w": "周 K"
    };
    return row.value
      .split(" · ")
      .map((token) => token === "N/A" ? "未选择" : timeframeLabels[token] ?? token)
      .join(" · ");
  }
  if (row.id === "klines") {
    return row.value.replace(" bars", " 根K线");
  }
  if (row.id === "cache") {
    return row.value
      .replace("fresh", "新鲜")
      .replace("stale", "过期")
      .replace("empty", "空")
      .replace("missing", "缺失")
      .replace(" rows", " 行");
  }
  if (row.id === "refresh") {
    if (row.value === "no matching refresh") {
      return "无匹配刷新";
    }
    return row.value
      .replace("refreshed", "已刷新")
      .replace("skipped", "已跳过")
      .replace("failed", "失败");
  }
  if (row.id === "note") {
    if (row.value === "saved") {
      return "已保存";
    }
    if (row.value === "unsaved changes") {
      return "未保存更改";
    }
    if (row.value === "draft not saved") {
      return "草稿未保存";
    }
    return "未保存";
  }
  if (row.id === "workspace") {
    if (row.value === "saved") {
      return "已保存";
    }
    if (row.value === "unsaved changes") {
      return "未保存更改";
    }
    return "未保存";
  }
  if (row.id === "watchlist") {
    return row.value === "saved" ? "已保存" : "未保存更改";
  }
  if (row.id === "calendar") {
    const calendarLabels: Record<string, string> = {
      always_open: "连续交易",
      open: "开市",
      closed: "休市",
      break: "盘中休市",
      unknown: "未知",
      after_hours: "盘后",
      morning: "上午盘",
      afternoon: "下午盘",
      regular: "常规时段",
      continuous: "连续交易",
      weekend: "周末",
      pre_open: "盘前",
      lunch_break: "午间休市"
    };
    return row.value
      .split(" · ")
      .map((token) => calendarLabels[token] ?? token)
      .join(" · ");
  }
  return row.value;
}

function researchContextReadinessStatusLabel(
  i18n: AppI18n,
  status: ResearchContextReadinessRow["status"] | ResearchContextEvidenceRow["status"]
): string {
  if (i18n.locale !== "zh-CN") {
    return status === "ready" ? "Ready" : status === "review" ? "Review" : "Blocked";
  }
  return status === "ready" ? "就绪" : status === "review" ? "复核" : "阻断";
}

function researchContextEvidenceLabel(i18n: AppI18n, row: ResearchContextEvidenceRow): string {
  if (i18n.locale !== "zh-CN") {
    return row.label;
  }
  return "审计运行";
}

function researchContextEvidenceValue(i18n: AppI18n, row: ResearchContextEvidenceRow): string {
  if (i18n.locale !== "zh-CN" || row.value !== "no audited run") {
    return row.value;
  }
  return "无审计运行";
}

function researchContextEvidenceDetail(i18n: AppI18n, row: ResearchContextEvidenceRow): string {
  if (i18n.locale !== "zh-CN") {
    return row.detail;
  }
  if (row.detail === "Run Pipeline to bind a matching audited research run.") {
    return "运行流水线以绑定匹配当前上下文的审计运行。";
  }
  const matched = row.detail.match(/^Audited run (.+) matches the selected research context\.$/);
  if (matched) {
    return `审计运行 ${matched[1]} 匹配当前研究上下文。`;
  }
  const mismatched = row.detail.match(/^Audited run (.+) belongs to (.+), not (.+)\.$/);
  if (mismatched) {
    return `审计运行 ${mismatched[1]} 属于 ${mismatched[2]}，而不是 ${mismatched[3]}。`;
  }
  return row.detail;
}

export function researchContextReadinessDetail(
  i18n: AppI18n,
  row: Pick<ResearchContextReadinessRow, "detail" | "id">
): string {
  if (i18n.locale !== "zh-CN") {
    return row.detail;
  }
  if (
    row.detail ===
    "No current-timeframe cache coverage yet. Use search suggestion refresh or refresh current cache before audited research."
  ) {
    return "当前周期还没有缓存覆盖。请在搜索建议中刷新缓存，或刷新当前缓存后再运行审计研究。";
  }
  if (row.detail === "Save a note to bind the research hypothesis to this symbol and timeframe.") {
    return "保存笔记，把研究假设绑定到当前标的和周期。";
  }
  if (row.id === "klines") {
    return "当前 K 线数据质量需要复核，请前往数据刷新检查并重试。";
  }
  if (row.id === "note") {
    if (
      row.detail.startsWith("Draft not saved · ") ||
      row.detail.startsWith("Unsaved changes since ") ||
      row.detail.startsWith("Saved ")
    ) {
      return row.detail
        .replace("Draft not saved", "草稿未保存")
        .replace("Unsaved changes since", "自上次保存后有未保存更改")
        .replace(/^Saved /, "已保存 ");
    }
    return "研究笔记尚未保存，请填写并保存后继续。";
  }
  if (row.id === "cache") {
    return row.detail
      .replace("Ready for audited research", "可运行审计研究")
      .replace("Latest cache", "最新缓存")
      .replace("Cache is stale.", "缓存已过期。")
      .replace("Cache is empty.", "缓存为空。")
      .replace(
        "Refresh from search suggestions or current cache before audited research",
        "请从搜索建议或当前缓存入口刷新后再运行审计研究"
      )
      .replace("latest timestamp unknown", "最新时间未知")
      .replace("age unknown", "缓存年龄未知")
      .replace("h old", " 小时前")
      .replace("latest", "最新");
  }
  if (row.id === "workspace") {
    return row.detail
      .replace(/\bASHARE\b/g, "A 股")
      .replace(/\bCRYPTO\b/g, "加密货币")
      .replace(/\bUS\b/g, "美股")
      .replace(/\b1m\b/g, "1 分")
      .replace(/\b5m\b/g, "5 分")
      .replace(/\b1d\b/g, "日 K")
      .replace(/\b1w\b/g, "周 K")
      .replace(/^Saved /, "已保存 ")
      .replace("time unknown", "时间未知")
      .replace("research entry", "研究入口")
      .replace("market entry", "行情入口")
      .replace(/^Save /, "保存 ")
      .replace(" before relying on this workspace context.", " 后再信任这个工作区上下文。")
      .replace(" · research", " · 研究入口")
      .replace(" · market", " · 行情入口");
  }
  if (row.id === "watchlist") {
    return row.detail
      .replace(/^Save /, "保存 ")
      .replace(" watched symbols before relying on this research context.", " 个自选标的后再信任这个研究上下文。")
      .replace(" watched symbols are persisted for local research.", " 个自选标的已为本地研究持久化。");
  }
  if (row.id === "refresh") {
    if (row.detail.startsWith("Run watchlist cache refresh for ")) {
      return "当前研究上下文缺少匹配的刷新证据，请前往数据刷新运行自选缓存刷新。";
    }
    return "当前刷新证据需要复核，请前往数据刷新检查并重新刷新自选缓存。";
  }
  if (row.id === "calendar") {
    const detail = row.detail
      .replace("Asia/Shanghai", "上海时区")
      .replace("America/New_York", "纽约时区")
      .replace(/\bUTC\b/g, "协调世界时")
      .replace(/\bunknown\b/g, "未知时区")
      .replace(/\bfallback\b/g, "备用日历")
      .replace(/\bcore\b/g, "核心日历")
      .replace("next close", "下一次收盘")
      .replace("next open", "下一次开盘")
      .replace("continuous trading", "连续交易")
      .replace("no scheduled event", "无计划事件")
      .replace("Static session template only; exchange holiday calendar is not configured.", "仅静态时段模板；未配置交易所节假日历。")
      .replace("static-session-template", "静态时段模板");
    return /[A-Za-z_]{3,}/.test(detail)
      ? "当前交易日历信息需要复核，请打开交易日历查看市场时段。"
      : detail;
  }
  if (row.id === "instrument") {
    return row.detail
      .replace("Unknown", "未知标的")
      .replace("ashare", "A 股")
      .replace("crypto", "加密货币")
      .replace(/\bus\b/, "美股")
      .replace("watched", "个自选");
  }
  return row.detail
    .replace("Draft not saved", "草稿未保存")
    .replace("Unsaved changes since", "自上次保存后有未保存更改")
    .replace("Saved", "已保存")
    .replace("source requires review", "来源需复核")
    .replace("complete", "完整")
    .replace("review", "需复核")
    .replace("watched", "个自选")
    .replace("Latest cache", "最新缓存")
    .replace("latest timestamp unknown", "最新时间未知")
    .replace("age unknown", "缓存年龄未知")
    .replace("h old", " 小时前")
    .replace("Cache is stale", "缓存已过期")
    .replace("latest", "最新");
}

export function marketDataRefreshGuardLabel(i18n: AppI18n, guard: MarketDataRefreshGuard): string {
  if (guard.overrideApplied) {
    const reason = guard.overrideReason ?? (i18n.locale === "zh-CN" ? "已记录人工确认" : "operator confirmation recorded");
    return i18n.locale === "zh-CN"
      ? `数据源冷却已手动覆盖：${reason}。本次刷新仍会执行。`
      : `Provider cooldown manually overridden: ${reason}. This refresh can proceed.`;
  }
  const affectedSymbols = guard.affectedSymbols.length
    ? guard.affectedSymbols.slice(0, 3).join("/")
    : i18n.locale === "zh-CN"
      ? "当前市场"
      : "current market";
  const retryAfter =
    guard.retryAfterSeconds > 0
      ? i18n.locale === "zh-CN"
        ? `${guard.retryAfterSeconds} 秒`
        : `${guard.retryAfterSeconds}s`
      : i18n.locale === "zh-CN"
        ? "稍后"
        : "later";
  return i18n.locale === "zh-CN"
    ? `数据源冷却：${affectedSymbols} 暂停手动刷新，建议 ${retryAfter} 后再试。`
    : `Provider cooldown: ${affectedSymbols} manual refresh is paused; retry after ${retryAfter}.`;
}
