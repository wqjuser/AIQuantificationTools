import { Panel } from "../../components/AppPanel";
import { type AppI18n } from "../../lib/i18n";
import { AuditEventHistoryPagination } from "../../lib/terminal-api";
import { ResearchRunExportIndexRow, ResearchRunImportAuditEvent, ResearchRunImportAuditFilter, buildResearchRunImportAuditAggregation, buildResearchRunImportUndoConfirmation, filterResearchRunExportIndexRows, filterResearchRunImportAuditEvents } from "../../lib/terminal-workbench";
import { researchExportIndexDate, researchExportIndexDetail, researchExportIndexStatusLabel, researchImportAuditDetailLabel, researchImportAuditFailureBucketLabel, researchImportAuditRecoveryLabel, researchImportAuditStageLabel, researchImportAuditSummaryLabel, researchImportAuditTimeLabel, researchImportBlockedEvidenceBucketLabel, researchImportUndoConfirmationDetail, researchImportUndoConfirmationMessage, researchImportVerifiedReportSignatureBucketLabel } from "./AuditLedgerFormatters";
import { researchImportVerifiedReportSignatureLabel } from "./ResearchPackageFormatters";
import { Check, Copy, RefreshCw, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ResearchRunImportAuditEventPanel({
  className,
  copiedEvidenceEventId,
  events,
  focusedEventId,
  i18n,
  isLoading,
  onCopyEvidenceAnchor,
  onInspectRunPackage,
  onNextPage,
  onPreviousPage,
  onQueryChange,
  onReplayRollbackRun,
  onUndoImport,
  pagination,
  query
}: {
  className?: string;
  copiedEvidenceEventId: string | null;
  events: ResearchRunImportAuditEvent[];
  focusedEventId: string | null;
  i18n: AppI18n;
  isLoading: boolean;
  onCopyEvidenceAnchor: (event: ResearchRunImportAuditEvent) => void;
  onInspectRunPackage: (event: ResearchRunImportAuditEvent) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onQueryChange: (query: string) => void;
  onReplayRollbackRun: (runId: string) => void;
  onUndoImport: (undoToken: string, expectedRunId: string) => void;
  pagination: AuditEventHistoryPagination | null;
  query: string;
}) {
  const [stageFilter, setStageFilter] = useState<ResearchRunImportAuditFilter>("all");
  const [pendingImportUndoToken, setPendingImportUndoToken] = useState<string | null>(null);
  const focusedEventRef = useRef<HTMLElement | null>(null);
  const aggregation = buildResearchRunImportAuditAggregation(events);
  const filteredEvents = filterResearchRunImportAuditEvents(events, "", stageFilter);
  const pageStart = pagination && pagination.total > 0 ? pagination.offset + 1 : 0;
  const pageEnd = pagination ? Math.min(pagination.offset + events.length, pagination.total) : filteredEvents.length;
  const pageLabel = pagination ? `${pageStart}-${pageEnd}/${pagination.total}` : `${filteredEvents.length}/${events.length}`;
  const canPageBack = Boolean(pagination && pagination.offset > 0);
  const canPageForward = Boolean(pagination && pagination.offset + pagination.limit < pagination.total);
  const filters: Array<{ id: ResearchRunImportAuditFilter; label: string; count: number }> = [
    { id: "all", label: i18n.locale === "zh-CN" ? "全部" : "All", count: aggregation.total },
    { id: "needs-review", label: i18n.locale === "zh-CN" ? "待复核" : "Needs review", count: aggregation.needsReview },
    { id: "undoable", label: i18n.locale === "zh-CN" ? "可撤销" : "Undoable", count: aggregation.undoable },
    { id: "recoverable", label: i18n.locale === "zh-CN" ? "可恢复" : "Recoverable", count: aggregation.recoverable },
    { id: "undone", label: i18n.locale === "zh-CN" ? "已撤销" : "Undone", count: aggregation.undone }
  ];

  useEffect(() => {
    if (!focusedEventId) {
      return;
    }
    focusedEventRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focusedEventId, filteredEvents.length, stageFilter]);

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "导入审计流水" : "Import Audit Ledger"}
      subtitle={i18n.locale === "zh-CN" ? "记录外部复现包的预检、阻断、确认和失败" : "Track preflight, blocked, applied, and failed imports"}
      className={className}
    >
      <div className="research-import-events">
        <div className="research-import-events-toolbar">
          <div className="research-import-events-summary">
            <span>
              {i18n.locale === "zh-CN" ? "已确认" : "Applied"} <strong>{aggregation.confirmed}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "阻断" : "Blocked"} <strong>{aggregation.blocked}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "失败" : "Failed"} <strong>{aggregation.failed + aggregation.undoFailed}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "撤销失败" : "Undo failed"} <strong>{aggregation.undoFailed}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "事件" : "Events"} <strong>{aggregation.total}</strong>
            </span>
          </div>
          <input
            aria-label={i18n.locale === "zh-CN" ? "搜索导入审计流水" : "Search import audit ledger"}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={i18n.locale === "zh-CN" ? "搜索文件 / run / contract / exportPath" : "Search file / run / contract / exportPath"}
            type="search"
            value={query}
          />
        </div>
        {pagination ? (
          <div className="research-import-events-pagination">
            <button disabled={!canPageBack || isLoading} onClick={onPreviousPage} type="button">
              {i18n.locale === "zh-CN" ? "上一页" : "Prev"}
            </button>
            <span>{isLoading ? (i18n.locale === "zh-CN" ? "加载中" : "Loading") : pageLabel}</span>
            <button disabled={!canPageForward || isLoading} onClick={onNextPage} type="button">
              {i18n.locale === "zh-CN" ? "下一页" : "Next"}
            </button>
          </div>
        ) : null}
        <div className="research-import-events-filters" aria-label={i18n.locale === "zh-CN" ? "导入审计阶段筛选" : "Import audit stage filters"}>
          {filters.map((filter) => (
            <button
              data-active={stageFilter === filter.id}
              key={filter.id}
              onClick={() => setStageFilter(filter.id)}
              type="button"
            >
              <span>{filter.label}</span>
              <strong>{filter.count}</strong>
            </button>
          ))}
        </div>
        {aggregation.failureBuckets.length || aggregation.blockedEvidenceBuckets.length || aggregation.verifiedReportSignatureBuckets.length ? (
          <div className="research-import-failure-buckets">
            {aggregation.failureBuckets.map((bucket) => (
              <article className={`research-import-failure-bucket ${bucket.tone}`} key={bucket.category}>
                <span>{researchImportAuditFailureBucketLabel(i18n, bucket)}</span>
                <strong>{bucket.count}</strong>
                <small>
                  {bucket.latestFileName} · {bucket.latestRunId}
                </small>
                <p>{researchImportAuditRecoveryLabel(i18n, bucket.recoveryHint)}</p>
              </article>
            ))}
            {aggregation.blockedEvidenceBuckets.map((bucket) => (
              <article className={`research-import-failure-bucket ${bucket.tone}`} key={`blocked-${bucket.category}`}>
                <span>{researchImportBlockedEvidenceBucketLabel(i18n, bucket)}</span>
                <strong>{bucket.count}</strong>
                <small>
                  {bucket.latestFileName} · {bucket.latestRunId}
                </small>
                <p>
                  {bucket.latestExportPath} · {bucket.latestDetail}
                </p>
              </article>
            ))}
            {aggregation.verifiedReportSignatureBuckets.map((bucket) => (
              <article
                className={`research-import-failure-bucket research-import-verification-bucket ${bucket.tone}`}
                key={`verified-${bucket.status}`}
              >
                <span>{researchImportVerifiedReportSignatureBucketLabel(i18n, bucket)}</span>
                <strong>{bucket.count}</strong>
                <small>
                  {bucket.latestFileName} · {bucket.latestRunId}
                </small>
                <p>
                  {bucket.latestExportPath} · {bucket.latestReason}
                </p>
              </article>
            ))}
          </div>
        ) : null}
        <div className="research-import-events-list">
          {filteredEvents.length ? (
            filteredEvents.map((event) => {
              const undoConfirmation = buildResearchRunImportUndoConfirmation(event);
              const isConfirmingUndo = pendingImportUndoToken === undoConfirmation?.undoToken;
              const canInspectRunPackage = event.stage === "confirmed" || event.stage === "undone" || event.stage === "undo-failed";
              const isEvidenceAnchorCopied = copiedEvidenceEventId === event.id;
              const isFocusedEvent = focusedEventId === event.id;
              return (
                <article
                  className={`research-import-event-row ${event.tone} ${event.stage} ${isFocusedEvent ? "focused" : ""}`}
                  key={event.id}
                  ref={isFocusedEvent ? focusedEventRef : undefined}
                >
                  <span>{researchImportAuditStageLabel(i18n, event.stage)}</span>
                  <strong>
                    {event.fileName}
                    <small>{event.runId}</small>
                  </strong>
                  <p>
                    <b>{researchImportAuditSummaryLabel(i18n, event.summary)}</b>
                    <small>{researchImportAuditDetailLabel(i18n, event.detail)}</small>
                    {event.blockedRows.length ? (
                      <small>
                        {event.blockedRows
                          .map((row) => `${row.label}: ${row.incoming}`)
                          .join(" · ")}
                      </small>
                    ) : null}
                    {event.artifactRows.length ? (
                      <small>
                        {event.artifactRows
                          .map((row) => `${row.label}: ${row.incoming}`)
                          .join(" · ")}
                      </small>
                    ) : null}
                    {event.verifiedReportSignatures.length ? (
                      <small>
                        {event.verifiedReportSignatures
                          .map(
                            (row) =>
                              `${researchImportVerifiedReportSignatureLabel(i18n, row)}: ${researchImportAuditDetailLabel(i18n, row.detail)}`
                          )
                          .join(" · ")}
                      </small>
                    ) : null}
                    <em>{event.exportPath}</em>
                  </p>
                  <em>
                    {event.blockedCount}/{event.changeCount}
                  </em>
                  <div className="research-import-event-recovery">
                    <small>{researchImportAuditRecoveryLabel(i18n, event.recoveryHint)}</small>
                    <button onClick={() => onCopyEvidenceAnchor(event)} type="button">
                      {isEvidenceAnchorCopied ? <Check size={13} /> : <Copy size={13} />}
                      {isEvidenceAnchorCopied
                        ? i18n.locale === "zh-CN"
                          ? "已复制"
                          : "Copied"
                        : i18n.locale === "zh-CN"
                          ? "复制锚点"
                          : "Copy anchor"}
                    </button>
                    {canInspectRunPackage ? (
                      <button onClick={() => onInspectRunPackage(event)} type="button">
                        {i18n.locale === "zh-CN" ? "打开证据" : "Open evidence"}
                      </button>
                    ) : null}
                    {event.stage !== "undone" && event.undoToken && undoConfirmation ? (
                      isConfirmingUndo ? (
                        <div className="research-import-undo-confirmation">
                          <strong>{researchImportUndoConfirmationMessage(i18n, undoConfirmation.message)}</strong>
                          <span>{researchImportUndoConfirmationDetail(i18n, undoConfirmation.detail)}</span>
                          <div className="research-import-undo-confirmation-actions">
                            <button
                              onClick={() => {
                                onUndoImport(undoConfirmation.undoToken, undoConfirmation.runId);
                                setPendingImportUndoToken(null);
                              }}
                              type="button"
                            >
                              {i18n.locale === "zh-CN" ? "确认撤销" : "Confirm undo"}
                            </button>
                            <button onClick={() => setPendingImportUndoToken(null)} type="button">
                              {i18n.locale === "zh-CN" ? "取消" : "Cancel"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setPendingImportUndoToken(event.undoToken);
                          }}
                          type="button"
                        >
                          {i18n.locale === "zh-CN" ? "撤销导入" : "Undo import"}
                        </button>
                      )
                    ) : null}
                    {event.rollbackTargetRunId ? (
                      <button
                        onClick={() => {
                          if (event.rollbackTargetRunId) {
                            onReplayRollbackRun(event.rollbackTargetRunId);
                          }
                        }}
                        type="button"
                      >
                        {i18n.locale === "zh-CN" ? "回放旧 run" : "Replay previous"}
                      </button>
                    ) : null}
                  </div>
                  <time dateTime={event.createdAt}>{researchImportAuditTimeLabel(event.createdAt)}</time>
                </article>
              );
            })
          ) : (
            <article className="research-import-event-row empty">
              <span>{i18n.locale === "zh-CN" ? "暂无事件" : "No events"}</span>
              <strong>
                {i18n.locale === "zh-CN" ? "选择外部复现包" : "Choose an external package"}
                <small>{i18n.locale === "zh-CN" ? "预检后会记录流水" : "Events appear after preflight"}</small>
              </strong>
              <p>
                <b>{i18n.locale === "zh-CN" ? "等待导入动作" : "Waiting for import action"}</b>
                <small>
                  {i18n.locale === "zh-CN"
                    ? "导入流水会写入后端审计库，并保留恢复提示。"
                    : "This ledger writes to the backend audit store and keeps recovery hints."}
                </small>
              </p>
              <em>0/0</em>
              <div className="research-import-event-recovery">
                <small>{i18n.locale === "zh-CN" ? "等待预检" : "Awaiting preflight"}</small>
              </div>
              <time>-</time>
            </article>
          )}
        </div>
      </div>
    </Panel>
  );
}

export function ResearchRunExportIndexPanel({
  className,
  i18n,
  isLoading,
  onIndexPackages,
  rows
}: {
  className?: string;
  i18n: AppI18n;
  isLoading: boolean;
  onIndexPackages: () => void;
  rows: ResearchRunExportIndexRow[];
}) {
  const [query, setQuery] = useState("");
  const filteredRows = filterResearchRunExportIndexRows(rows, query);
  const blockedCount = rows.filter((row) => row.status === "blocked").length;
  const reviewCount = rows.filter((row) => row.status === "review").length;
  const readyCount = rows.filter((row) => row.status === "ready").length;

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "近期复现包索引" : "Recent Export Package Index"}
      subtitle={i18n.locale === "zh-CN" ? "跨运行搜索 run、hash、artifact 与执行交接" : "Search runs, hashes, artifacts, and handoff"}
      className={className}
      action={
        <button className="report-export-button" disabled={isLoading} onClick={onIndexPackages} type="button">
          {isLoading ? <RefreshCw className="spin" size={13} /> : <Search size={13} />}
          <span>{i18n.locale === "zh-CN" ? "索引近期包" : "Index recent"}</span>
        </button>
      }
    >
      <div className="research-export-index">
        <div className="research-export-index-toolbar">
          <div className="research-export-index-summary">
            <span>
              {i18n.locale === "zh-CN" ? "实盘就绪" : "Live ready"} <strong>{readyCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "待复核" : "Review"} <strong>{reviewCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "阻断" : "Blocked"} <strong>{blockedCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "已索引" : "Indexed"} <strong>{rows.length}</strong>
            </span>
          </div>
          <input
            aria-label={i18n.locale === "zh-CN" ? "搜索近期复现包索引" : "Search recent export package index"}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={i18n.locale === "zh-CN" ? "搜索 run / 标的 / hash / 阻断原因" : "Search run / symbol / hash / block reason"}
            type="search"
            value={query}
          />
        </div>
        <div className="research-export-index-list">
          {filteredRows.length ? (
            filteredRows.map((row) => (
              <article className={`research-export-index-row ${row.tone} ${row.status}`} key={row.id}>
                <span>
                  <strong>{row.context}</strong>
                  <em>{row.runId}</em>
                </span>
                <small>{row.strategyRevision}</small>
                <strong>{researchExportIndexDetail(i18n, row.detail)}</strong>
                <em>{row.artifacts}</em>
                <small>{row.execution}</small>
                <b>{researchExportIndexStatusLabel(i18n, row.status)}</b>
                <p>
                  {row.integrity} · {row.dataHash} · {row.exportPath} · {researchExportIndexDate(i18n, row.exportedAt)}
                </p>
              </article>
            ))
          ) : (
            <article className="research-export-index-row empty">
              <span>
                <strong>{i18n.locale === "zh-CN" ? "暂无索引" : "No index"}</strong>
                <em>{i18n.locale === "zh-CN" ? "先点击索引近期包" : "Click Index recent first"}</em>
              </span>
              <small>-</small>
              <strong>{i18n.locale === "zh-CN" ? "还没有加载近期复现包。" : "No recent export packages have been loaded."}</strong>
              <em>-</em>
              <small>-</small>
              <b>{i18n.locale === "zh-CN" ? "等待" : "Waiting"}</b>
              <p>{i18n.locale === "zh-CN" ? "索引只读取运行历史中的复现包，不会修改审计记录。" : "Indexing reads packages from run history without changing audit records."}</p>
            </article>
          )}
        </div>
      </div>
    </Panel>
  );
}
