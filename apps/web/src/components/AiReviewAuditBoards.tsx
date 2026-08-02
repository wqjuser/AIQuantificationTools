import type { AppI18n } from "../lib/i18n";
import type { AiReviewRunHistoryPagination, AiReviewRunRecordEnvelope } from "../lib/terminal-api";
import type {
  AiReviewAuditTimelineItem,
  AiReviewCitation,
  AiReviewDossier,
  AiReviewExportEvidenceIndexRow,
  AiReviewRecordDriftRow,
  ProductWorkAreaId,
  RiskApprovalGate,
  RiskApprovalSummary
} from "../lib/terminal-workbench";

export function AiReviewDossierBoard({ dossier, i18n }: { dossier: AiReviewDossier; i18n: AppI18n }) {
  return (
    <div className="ai-dossier">
      <div className={`ai-dossier-head ${dossier.status}`}>
        <span>{i18n.locale === "zh-CN" ? "AI 评审档案" : "AI review dossier"}</span>
        <strong>{aiDossierText(i18n, dossier.headline)}</strong>
        <p>{aiDossierText(i18n, dossier.summary)}</p>
      </div>
      <div className="ai-dossier-grid">
        {dossier.citations.map((citation) => (
          <article className={`ai-dossier-card ${citation.tone}`} key={citation.id}>
            <span>{aiCitationLabel(i18n, citation)}</span>
            <strong>{aiCitationValue(i18n, citation)}</strong>
            <p>{aiCitationDetail(i18n, citation)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function AiReviewRunRecordHistory({
  i18n,
  isLoading,
  onNextPage,
  onPreviousPage,
  onSelectRecord,
  pagination,
  query,
  records,
  selectedRecordId,
  totalRecords
}: {
  i18n: AppI18n;
  isLoading?: boolean;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  onSelectRecord?: (recordId: string) => void;
  pagination?: AiReviewRunHistoryPagination | null;
  query: string;
  records: AiReviewRunRecordEnvelope[];
  selectedRecordId?: string | null;
  totalRecords: number;
}) {
  const visibleRecords = records.slice(0, 3);
  const isSelectable = Boolean(onSelectRecord);
  const RecordTag = isSelectable ? "button" : "article";
  const pageStart = pagination && pagination.total > 0 ? pagination.offset + 1 : 0;
  const pageEnd = pagination ? Math.min(pagination.offset + records.length, pagination.total) : records.length;
  const countLabel = pagination
    ? `${pageStart}-${pageEnd}/${pagination.total}`
    : records.length !== totalRecords
      ? `${records.length}/${totalRecords}`
      : `${totalRecords}`;
  const canPageBack = Boolean(pagination && onPreviousPage && pagination.offset > 0);
  const canPageForward = Boolean(pagination && onNextPage && pagination.offset + pagination.limit < pagination.total);
  const emptyTitle =
    totalRecords > 0 ? (i18n.locale === "zh-CN" ? "没有匹配记录" : "No matching records") : i18n.t("aiReview.noSavedRecords");
  const emptyDetail =
    totalRecords > 0
      ? i18n.locale === "zh-CN"
        ? `未找到匹配「${query}」的已保存 AI 评审记录。`
        : `No saved AI review record matches "${query}".`
      : i18n.t("aiReview.noSavedRecordsDetail");

  return (
    <div className="ai-review-records">
      <div className="agent-rounds-title">
        <span>{i18n.t("aiReview.savedRecords")}</span>
        <strong>{countLabel}</strong>
      </div>
      {pagination ? (
        <div className="ai-review-record-pagination">
          <button disabled={!canPageBack || isLoading} onClick={onPreviousPage} type="button">
            {i18n.locale === "zh-CN" ? "上一页" : "Prev"}
          </button>
          <span>{isLoading ? (i18n.locale === "zh-CN" ? "加载中" : "Loading") : countLabel}</span>
          <button disabled={!canPageForward || isLoading} onClick={onNextPage} type="button">
            {i18n.locale === "zh-CN" ? "下一页" : "Next"}
          </button>
        </div>
      ) : null}
      {visibleRecords.length ? (
        visibleRecords.map((item) => (
          <RecordTag
            className={`ai-review-record ${item.record.status}${
              isSelectable && item.aiReviewId === selectedRecordId ? " selected" : ""
            }`}
            key={item.aiReviewId}
            onClick={isSelectable ? () => onSelectRecord?.(item.aiReviewId) : undefined}
            {...(isSelectable ? { type: "button" as const } : {})}
          >
            <header>
              <strong>{item.record.strategyRevision}</strong>
              <span>{formatChartDate(item.createdAt)}</span>
            </header>
            <p>{aiDossierText(i18n, item.record.dossier.headline)}</p>
            <small>
              {item.record.summary.citationCount} {i18n.t("aiReview.citations")} · {item.record.summary.roundCount}{" "}
              {i18n.t("aiReview.rounds")} ·{" "}
              {item.record.summary.liveExecutionBlocked ? i18n.t("aiReview.boundary") : item.record.executionMode}
            </small>
          </RecordTag>
        ))
      ) : (
        <article className="ai-review-record empty">
          <strong>{emptyTitle}</strong>
          <p>{emptyDetail}</p>
        </article>
      )}
    </div>
  );
}

export function AiReviewAuditComparison({
  currentCitationCount,
  currentRunId,
  currentStatus,
  currentStrategyRevision,
  i18n,
  latestRecord,
  liveExecutionBlocked,
  roundCount
}: {
  currentCitationCount: number;
  currentRunId: string | null;
  currentStatus: AiReviewDossier["status"];
  currentStrategyRevision: string;
  i18n: AppI18n;
  latestRecord: AiReviewRunRecordEnvelope | null;
  liveExecutionBlocked: boolean;
  roundCount: number;
}) {
  const emptyValue = i18n.locale === "zh-CN" ? "未保存" : "Not saved";
  const currentRunLabel = currentRunId ?? (i18n.locale === "zh-CN" ? "等待审计运行" : "Pending audited run");
  const selectedRecordLabel = i18n.locale === "zh-CN" ? "选中保存" : "Selected saved";
  const savedRecord = latestRecord?.record ?? null;
  const rows = [
    {
      id: "run",
      label: i18n.locale === "zh-CN" ? "审计运行" : "Audit run",
      current: currentRunLabel,
      saved: latestRecord?.runId ?? emptyValue,
      changed: Boolean(currentRunId && latestRecord && currentRunId !== latestRecord.runId)
    },
    {
      id: "revision",
      label: i18n.locale === "zh-CN" ? "策略版本" : "Strategy revision",
      current: currentStrategyRevision,
      saved: savedRecord?.strategyRevision ?? emptyValue,
      changed: Boolean(savedRecord && currentStrategyRevision !== savedRecord.strategyRevision)
    },
    {
      id: "status",
      label: i18n.locale === "zh-CN" ? "档案状态" : "Dossier status",
      current: aiReviewAuditStatusLabel(i18n, currentStatus),
      saved: savedRecord ? aiReviewAuditStatusLabel(i18n, savedRecord.status) : emptyValue,
      changed: Boolean(savedRecord && currentStatus !== savedRecord.status)
    },
    {
      id: "citations",
      label: i18n.locale === "zh-CN" ? "引用证据" : "Citations",
      current: currentCitationCount.toLocaleString(i18n.locale),
      saved: savedRecord ? savedRecord.summary.citationCount.toLocaleString(i18n.locale) : emptyValue,
      changed: Boolean(savedRecord && currentCitationCount !== savedRecord.summary.citationCount)
    },
    {
      id: "rounds",
      label: i18n.locale === "zh-CN" ? "委员会轮次" : "Committee rounds",
      current: roundCount.toLocaleString(i18n.locale),
      saved: savedRecord ? savedRecord.summary.roundCount.toLocaleString(i18n.locale) : emptyValue,
      changed: Boolean(savedRecord && roundCount !== savedRecord.summary.roundCount)
    },
    {
      id: "boundary",
      label: i18n.locale === "zh-CN" ? "实盘边界" : "Live boundary",
      current: aiReviewAuditBoundaryLabel(i18n, liveExecutionBlocked),
      saved: savedRecord ? aiReviewAuditBoundaryLabel(i18n, savedRecord.summary.liveExecutionBlocked) : emptyValue,
      changed: Boolean(savedRecord && liveExecutionBlocked !== savedRecord.summary.liveExecutionBlocked)
    }
  ];

  return (
    <div className="audit-ai-comparison">
      <div className="agent-rounds-title">
        <span>{i18n.locale === "zh-CN" ? "证据对照" : "Evidence Comparison"}</span>
        <strong>{latestRecord ? formatChartDate(latestRecord.createdAt) : emptyValue}</strong>
      </div>
      <div className="audit-ai-comparison-grid">
        <div className="audit-ai-comparison-row audit-ai-comparison-head">
          <span>{i18n.locale === "zh-CN" ? "维度" : "Dimension"}</span>
          <span>{i18n.locale === "zh-CN" ? "当前证据" : "Current evidence"}</span>
          <span>{selectedRecordLabel}</span>
        </div>
        {rows.map((row) => (
          <article className={`audit-ai-comparison-row ${row.changed ? "changed" : "matched"}`} key={row.id}>
            <span>{row.label}</span>
            <strong>{row.current}</strong>
            <em>{row.saved}</em>
          </article>
        ))}
      </div>
    </div>
  );
}

export function AiReviewRiskReferenceBoard({ approval, i18n }: { approval: RiskApprovalSummary; i18n: AppI18n }) {
  return (
    <div className={`audit-ai-risk-reference ${approval.status}`}>
      <div className="agent-rounds-title">
        <span>{i18n.locale === "zh-CN" ? "风控引用" : "Risk References"}</span>
        <strong>{riskApprovalHeadline(i18n, approval)}</strong>
      </div>
      <p>{riskApprovalSummaryText(i18n, approval)}</p>
      <div className="audit-ai-risk-gates">
        {approval.gates.map((gate) => (
          <article className={`audit-ai-risk-gate ${gate.tone}`} key={gate.id}>
            <span>{riskApprovalGateLabel(i18n, gate)}</span>
            <strong>{riskApprovalGateValue(i18n, gate)}</strong>
            <em>{riskApprovalGateStatus(i18n, gate.status)}</em>
            <p>{riskApprovalGateDetail(i18n, gate)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function AiReviewRecordDriftSummary({
  i18n,
  onQueryChange,
  query,
  rows,
  totalRows
}: {
  i18n: AppI18n;
  onQueryChange: (query: string) => void;
  query: string;
  rows: AiReviewRecordDriftRow[];
  totalRows: number;
}) {
  const visibleRows = rows.slice(0, 5);
  const driftCount = rows.filter((row) => row.status === "drift").length;
  const countLabel = rows.length !== totalRows ? `${rows.length}/${totalRows}` : `${totalRows}`;
  const summaryValue = totalRows
    ? `${countLabel} · ${
        driftCount
          ? i18n.locale === "zh-CN"
            ? `${driftCount} 漂移`
            : `${driftCount} drift`
          : i18n.locale === "zh-CN"
            ? "全部匹配"
            : "All matched"
      }`
    : i18n.locale === "zh-CN"
      ? "无记录"
      : "No records";

  return (
    <div className="audit-ai-drift-summary">
      <div className="audit-ai-drift-toolbar">
        <div className="agent-rounds-title">
          <span>{i18n.locale === "zh-CN" ? "保存记录漂移" : "Saved Record Drift"}</span>
          <strong>{summaryValue}</strong>
        </div>
        <input
          className="audit-ai-drift-search"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={i18n.locale === "zh-CN" ? "搜索版本、ID、漂移原因" : "Search revision, ID, drift reason"}
          type="search"
          value={query}
        />
      </div>
      <div className="audit-ai-drift-list">
        {visibleRows.length ? (
          visibleRows.map((row) => (
            <article className={`audit-ai-drift-row ${row.status}`} key={row.aiReviewId}>
              <span>
                <strong>{row.strategyRevision}</strong>
                <em>{formatChartDate(row.createdAt)}</em>
              </span>
              <p>{aiReviewDriftReasonText(i18n, row)}</p>
              <strong>{aiReviewDriftStatusText(i18n, row)}</strong>
            </article>
          ))
        ) : (
          <article className="audit-ai-drift-row empty">
            <span>
              <strong>
                {totalRows ? (i18n.locale === "zh-CN" ? "没有匹配记录" : "No matching records") : i18n.t("aiReview.noSavedRecords")}
              </strong>
              <em>{query ? query : i18n.locale === "zh-CN" ? "等待保存" : "Waiting"}</em>
            </span>
            <p>
              {totalRows
                ? i18n.locale === "zh-CN"
                  ? "换一个关键词，或清空搜索查看全部保存记录。"
                  : "Try another keyword, or clear search to see all saved records."
                : i18n.t("aiReview.noSavedRecordsDetail")}
            </p>
            <strong>{i18n.locale === "zh-CN" ? "未开始" : "Pending"}</strong>
          </article>
        )}
      </div>
    </div>
  );
}

export function AiReviewAuditTimelineBoard({
  i18n,
  items,
  onSelectRecord,
  onSelectWorkspace
}: {
  i18n: AppI18n;
  items: AiReviewAuditTimelineItem[];
  onSelectRecord: (recordId: string) => void;
  onSelectWorkspace: (workspaceId: ProductWorkAreaId) => void;
}) {
  function handleTimelineAction(item: AiReviewAuditTimelineItem) {
    if (item.targetRecordId) {
      onSelectRecord(item.targetRecordId);
      return;
    }
    if (item.targetWorkspaceId) {
      onSelectWorkspace(item.targetWorkspaceId);
    }
  }

  return (
    <div className="audit-ai-timeline">
      <div className="agent-rounds-title">
        <span>{i18n.locale === "zh-CN" ? "审计时间线" : "Audit Timeline"}</span>
        <strong>{items.length}</strong>
      </div>
      <div className="audit-ai-timeline-list">
        {items.map((item) => (
          <article className={`audit-ai-timeline-row ${item.status} ${item.tone}`} key={item.id}>
            <span>{auditTimelineKindLabel(i18n, item.kind)}</span>
            <strong>{auditTimelineValue(i18n, item)}</strong>
            <em>{item.reference}</em>
            <button className="audit-ai-timeline-action" onClick={() => handleTimelineAction(item)} type="button">
              {auditTimelineActionLabel(i18n, item)}
            </button>
            <small className="audit-ai-timeline-anchor">{item.exportAnchor}</small>
            <p>{auditTimelineDetail(i18n, item)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function AiReviewExportEvidenceIndexBoard({
  i18n,
  onQueryChange,
  query,
  rows,
  totalRows
}: {
  i18n: AppI18n;
  onQueryChange: (query: string) => void;
  query: string;
  rows: AiReviewExportEvidenceIndexRow[];
  totalRows: number;
}) {
  return (
    <div className="audit-ai-evidence-index">
      <div className="agent-rounds-title">
        <span>{i18n.locale === "zh-CN" ? "导出证据索引" : "Export Evidence Index"}</span>
        <strong>{rows.length !== totalRows ? `${rows.length}/${totalRows}` : totalRows}</strong>
      </div>
      <div className="audit-ai-evidence-index-toolbar">
        <input
          aria-label={i18n.locale === "zh-CN" ? "搜索导出证据索引" : "Search export evidence index"}
          className="audit-ai-evidence-index-search"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={i18n.locale === "zh-CN" ? "搜索 anchor / exportPath / 引用" : "Search anchor / exportPath / reference"}
          type="search"
          value={query}
        />
      </div>
      <div className="audit-ai-evidence-index-list">
        {rows.length ? (
          rows.map((row) => (
            <article className={`audit-ai-evidence-index-row ${row.tone}`} key={row.id}>
              <span>{aiReviewEvidenceIndexGroupLabel(i18n, row.group)}</span>
              <strong>{row.anchor}</strong>
              <em>{row.exportPath}</em>
              <small>{row.reference}</small>
              <p>{aiReviewEvidenceIndexDetail(i18n, row.detail)}</p>
            </article>
          ))
        ) : (
          <article className="audit-ai-evidence-index-row empty">
            <span>{i18n.locale === "zh-CN" ? "无匹配" : "No match"}</span>
            <strong>{i18n.locale === "zh-CN" ? "清空搜索查看全部锚点" : "Clear search to see all anchors"}</strong>
            <em>-</em>
            <p>{i18n.locale === "zh-CN" ? "当前查询没有命中导出证据索引。" : "The current query did not match the export evidence index."}</p>
          </article>
        )}
      </div>
    </div>
  );
}

function auditTimelineKindLabel(i18n: AppI18n, kind: AiReviewAuditTimelineItem["kind"]): string {
  if (i18n.locale === "en-US") {
    return (
      {
        "current-evidence": "Current evidence",
        "citation-bundle-evidence": "Citation bundle",
        "strategy-revision-evidence": "Strategy revision",
        "committee-rounds-evidence": "Committee rounds",
        "decision-log-evidence": "Decision log",
        "ai-boundary-evidence": "AI boundary",
        "data-snapshot-evidence": "Data snapshot",
        "data-preparation-evidence": "Data preparation",
        "paper-execution-preparation-evidence": "Paper preparation",
        "market-calendar-evidence": "Market calendar",
        "saved-review": "Saved review",
        "risk-approval": "Risk approval"
      } satisfies Record<AiReviewAuditTimelineItem["kind"], string>
    )[kind];
  }
  return (
    {
      "current-evidence": "当前证据",
      "citation-bundle-evidence": "引用证据",
      "strategy-revision-evidence": "策略版本",
      "committee-rounds-evidence": "委员会轮次",
      "decision-log-evidence": "决策日志",
      "ai-boundary-evidence": "AI 边界",
      "data-snapshot-evidence": "数据快照",
      "data-preparation-evidence": "数据准备",
      "paper-execution-preparation-evidence": "模拟执行数据准备",
      "market-calendar-evidence": "交易日历",
      "saved-review": "保存评审",
      "risk-approval": "风控审批"
    } satisfies Record<AiReviewAuditTimelineItem["kind"], string>
  )[kind];
}

function auditTimelineValue(i18n: AppI18n, item: AiReviewAuditTimelineItem): string {
  if (i18n.locale === "en-US") {
    return item.value;
  }
  return item.value
    .replace("Current audit evidence", "当前审计证据")
    .replace("Saved AI review", "保存 AI 评审")
    .replace("Paper execution approved", "模拟执行已审批")
    .replace("Risk approval blocked", "风控审批阻断")
    .replace("Certified live route ready", "认证实盘通道就绪")
    .replace("Risk approval", "风控审批")
    .replace("citations", "条引用")
    .replace("rounds", "轮")
    .replace("no audited run", "无审计运行");
}

function auditTimelineDetail(i18n: AppI18n, item: AiReviewAuditTimelineItem): string {
  if (i18n.locale === "en-US") {
    return item.detail;
  }
  return item.detail
    .replace("Audited evidence required", "需要先绑定审计证据")
    .replace("Bind an audited run before paper or live execution.", "先绑定审计运行，再进入模拟或实盘执行。")
    .replace("Evidence dossier is ready", "证据档案已就绪")
    .replace("Evidence dossier blocked", "证据档案阻断")
    .replace("Paper execution approved", "模拟执行已审批")
    .replace("Risk approval blocked", "风控审批阻断")
    .replace("Certified live route ready", "认证实盘通道就绪")
    .replace("can stage paper orders", "可提交模拟委托")
    .replace("live trading remains blocked", "实盘仍保持阻断")
    .replace("needs risk review before staging execution", "提交执行前仍需风控复核");
}

function auditTimelineActionLabel(i18n: AppI18n, item: AiReviewAuditTimelineItem): string {
  if (i18n.locale === "en-US") {
    return item.actionLabel;
  }
  return item.actionLabel
    .replace("Open backtest evidence", "查看回测证据")
    .replace("Compare saved review", "对照保存评审")
    .replace("Open execution approval", "查看执行审批");
}

function aiReviewEvidenceIndexGroupLabel(
  i18n: AppI18n,
  group: AiReviewExportEvidenceIndexRow["group"]
): string {
  if (i18n.locale === "en-US") {
    return (
      {
        "current-record": "Current record",
        "saved-record": "Saved record",
        timeline: "Timeline",
        "package-authoritative-review": i18n.t("archive.aiReview.group.authoritative"),
        "package-decision": i18n.t("archive.aiReview.group.decision")
      } satisfies Record<AiReviewExportEvidenceIndexRow["group"], string>
    )[group];
  }
  return (
    {
      "current-record": "当前记录",
      "saved-record": "保存记录",
      timeline: "审计时间线",
      "package-authoritative-review": i18n.t("archive.aiReview.group.authoritative"),
      "package-decision": i18n.t("archive.aiReview.group.decision")
    } satisfies Record<AiReviewExportEvidenceIndexRow["group"], string>
  )[group];
}

function aiReviewEvidenceIndexDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  return detail
    .replace("Current AI review record", "当前 AI 评审记录")
    .replace("Saved AI review record", "保存 AI 评审记录")
    .replace("provider ", "provider ")
    .replace("status ", "状态 ")
    .replace("assessment ", "评估 ")
    .replace("operator ", "操作人 ")
    .replace("Evidence dossier is ready", "证据档案已就绪")
    .replace("Evidence dossier blocked", "证据档案阻断")
    .replace("Paper execution approved", "模拟执行已审批")
    .replace("Risk approval blocked", "风控审批阻断")
    .replace("live trading remains blocked", "实盘仍保持阻断");
}

function aiReviewDriftStatusText(i18n: AppI18n, row: AiReviewRecordDriftRow): string {
  if (row.status === "matched") {
    return i18n.locale === "zh-CN" ? "匹配" : "Matched";
  }
  return i18n.locale === "zh-CN" ? `${row.driftCount} 项漂移` : `${row.driftCount} drift`;
}

function aiReviewDriftReasonText(i18n: AppI18n, row: AiReviewRecordDriftRow): string {
  if (!row.driftReasons.length) {
    return i18n.locale === "zh-CN"
      ? `引用 ${row.citationCount} 条 · 委员会 ${row.roundCount} 轮 · ${aiReviewAuditBoundaryLabel(i18n, row.liveExecutionBlocked)}`
      : `${row.citationCount} citations · ${row.roundCount} rounds · ${aiReviewAuditBoundaryLabel(
          i18n,
          row.liveExecutionBlocked
        )}`;
  }
  return row.driftReasons.map((reason) => aiReviewDriftReasonLabel(i18n, reason)).join(i18n.locale === "zh-CN" ? "、" : ", ");
}

function aiReviewDriftReasonLabel(i18n: AppI18n, reason: AiReviewRecordDriftRow["driftReasons"][number]): string {
  if (i18n.locale === "en-US") {
    return (
      {
        run: "run",
        strategy: "strategy revision",
        status: "dossier status",
        citations: "citations",
        rounds: "committee rounds",
        boundary: "live boundary"
      } satisfies Record<AiReviewRecordDriftRow["driftReasons"][number], string>
    )[reason];
  }
  return (
    {
      run: "审计运行",
      strategy: "策略版本",
      status: "档案状态",
      citations: "引用证据",
      rounds: "委员会轮次",
      boundary: "实盘边界"
    } satisfies Record<AiReviewRecordDriftRow["driftReasons"][number], string>
  )[reason];
}

function aiReviewAuditStatusLabel(i18n: AppI18n, status: AiReviewDossier["status"]): string {
  if (status === "ready") {
    return i18n.locale === "zh-CN" ? "可评审" : "Ready";
  }
  return i18n.locale === "zh-CN" ? "阻断" : "Blocked";
}

function aiReviewAuditBoundaryLabel(i18n: AppI18n, blocked: boolean): string {
  if (blocked) {
    return i18n.locale === "zh-CN" ? "仅模拟盘" : "Paper only";
  }
  return i18n.locale === "zh-CN" ? "实盘闸门开启" : "Live gates open";
}

export function riskApprovalHeadline(i18n: AppI18n, approval: RiskApprovalSummary): string {
  if (i18n.locale === "en-US") {
    return approval.headline;
  }
  return {
    "Risk approval blocked": "风控审批阻断",
    "Paper execution approved": "模拟执行已批准",
    "Certified live route ready": "认证实盘通道就绪"
  }[approval.headline] ?? approval.headline;
}

export function riskApprovalSummaryText(i18n: AppI18n, approval: RiskApprovalSummary): string {
  if (i18n.locale === "en-US") {
    return approval.summary;
  }
  const paperReady = approval.summary.match(
    /^Audited run (.+) can stage paper orders; live trading remains blocked until (\d+) gates pass\.$/
  );
  if (paperReady) {
    return `审计运行 ${paperReady[1]} 可创建模拟委托；实盘仍需 ${paperReady[2]} 个闸门通过。`;
  }
  const liveReady = approval.summary.match(/^Audited run (.+) can route through certified live execution\.$/);
  if (liveReady) {
    return `审计运行 ${liveReady[1]} 可进入认证实盘通道。`;
  }
  const blockedRun = approval.summary.match(/^Audited run (.+) needs risk review before staging execution\.$/);
  if (blockedRun) {
    return `审计运行 ${blockedRun[1]} 需要风控复核后才能进入执行。`;
  }
  return approval.summary.replace("Bind an audited run before paper or live execution.", "先绑定审计运行，再进入模拟或实盘执行。");
}

export function riskApprovalGateLabel(i18n: AppI18n, gate: RiskApprovalGate): string {
  if (i18n.locale === "en-US") {
    return gate.label;
  }
  return {
    "audited-run": "审计运行",
    "ai-evidence": "AI 证据",
    "data-quality": "数据质量",
    "position-limit": "仓位上限",
    "drawdown-limit": "回撤闸门",
    "execution-route": "执行通道"
  }[gate.id];
}

export function riskApprovalGateValue(i18n: AppI18n, gate: RiskApprovalGate): string {
  if (i18n.locale === "en-US") {
    return gate.value;
  }
  return gate.value
    .replace("No audited run", "缺少审计运行")
    .replace("Evidence dossier blocked", "证据包阻断")
    .replace("Evidence locked", "证据已锁定")
    .replace("Not attached", "未附加")
    .replace("complete", "完整")
    .replace("review", "复核")
    .replace("paper blocked", "模拟阻断")
    .replace("paper only", "仅模拟盘")
    .replace("data blocked", "数据阻断")
    .replace("certified live", "认证实盘")
    .replace("cap", "上限")
    .replace("guard", "闸门");
}

export function riskApprovalGateStatus(i18n: AppI18n, status: RiskApprovalGate["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { passed: "通过", blocked: "阻断", review: "复核" }[status];
}

export function riskApprovalGateDetail(i18n: AppI18n, gate: RiskApprovalGate): string {
  if (i18n.locale === "en-US") {
    return gate.detail;
  }
  const liveBlocked = gate.detail.match(/^Paper route can stage; (\d+) live gates still blocked\.$/);
  if (liveBlocked) {
    return `模拟通道可创建委托；仍有 ${liveBlocked[1]} 个实盘闸门阻断。`;
  }
  return gate.detail
    .replace("Run Pipeline must produce a reproducible research run before execution.", "执行前必须先由流水线生成可复现研究运行。")
    .replace("Run Pipeline before agent debate, explanation, or strategy promotion.", "先运行流水线，再进行智能体辩论、解释或策略晋级。")
    .replace(
      "Audited run metadata did not include data quality; rerun pipeline before paper execution.",
      "审计运行缺少数据质量元数据；请重新运行流水线后再进入模拟执行。"
    )
    .replace(
      /^Paper execution requires complete audited market data; current source (.+) is review-only\.$/u,
      "模拟执行要求完整的审计行情数据；当前来源 $1 仅可复核。"
    )
    .replace(/(\d+) rows are approved for paper execution; (.+)\./u, "$1 行数据已允许进入模拟执行；$2。")
    .replace("Position cap is parsed but cannot be approved without audited evidence.", "已解析仓位上限，但缺少审计证据时不能批准。")
    .replace("Drawdown is provisional until a run snapshot is bound.", "绑定运行快照前，回撤仅作为临时参考。")
    .replace("Paper route waits for audited evidence; live route remains gated.", "模拟通道等待审计证据；实盘通道继续受闸门限制。")
    .replace("Sizing uses the current strategy position guardrail.", "下单规模使用当前策略仓位护栏。")
    .replace("Audited drawdown is inside the configured guardrail.", "审计回撤位于已配置护栏内。")
    .replace("Audited drawdown breaches the configured guardrail.", "审计回撤突破已配置护栏。")
    .replace("All execution gates passed; live route is available after human confirmation.", "全部执行闸门已通过；人工确认后可使用实盘通道。")
    .replace("bars", "根K线")
    .replace("paper_only", "仅模拟盘")
    .replace("certified_live", "认证实盘")
    .replace("blocked_live", "实盘阻断");
}

function aiDossierText(i18n: AppI18n, text: string): string {
  if (i18n.locale === "en-US") {
    return text;
  }
  if (text === "Audited evidence required") {
    return "需要审计证据";
  }
  if (text === "Run Pipeline before agent debate, explanation, or strategy promotion.") {
    return "运行流水线后，才能进行智能体辩论、解释或策略晋级。";
  }
  const bound = text.match(/^AI review bound to (.+)$/);
  if (bound) {
    return `AI 评审已绑定 ${bound[1]}`;
  }
  const summary = text.match(/^Agents may explain evidence for (.+), but live execution remains gated\.$/);
  if (summary) {
    return `智能体可以解释 ${summary[1]} 的证据，但实盘执行仍受闸门限制。`;
  }
  return text;
}

export function aiCitationLabel(i18n: AppI18n, citation: AiReviewCitation): string {
  if (i18n.locale === "en-US") {
    return citation.label;
  }
  return (
    {
      run: "运行编号",
      metrics: "回测指标",
      "benchmark": "基准 Alpha",
      "parameter-scan": "持久化策略实验",
      strategy: "策略版本",
      "data-quality": "数据质量",
      "research-note": "研究笔记",
      "risk-gates": "风控闸门"
    }[citation.id] ?? citation.label
  );
}

export function aiCitationValue(i18n: AppI18n, citation: AiReviewCitation): string {
  if (i18n.locale === "en-US") {
    return citation.value;
  }
  if (citation.id === "parameter-scan") {
    return citation.value;
  }
  if (citation.value === "Missing audited run") {
    return "缺少审计运行";
  }
  if (citation.value === "Unavailable") {
    return "不可用";
  }
  if (citation.value === "Not attached") {
    return "未附加";
  }
  if (citation.value === "Locked note snapshot") {
    return "已锁定笔记快照";
  }
  return citation.value
    .replace("candidate for re-audit", "复审候选")
    .replace("No candidate cleared for re-audit", "暂无通过复审候选")
    .replace("Live gates open", "实盘闸门已开启")
    .replace("complete", "完整")
    .replace("review", "需复核")
    .replace("trades", "笔交易")
    .replace("blocked gates", "个阻断闸门");
}

export function aiCitationDetail(i18n: AppI18n, citation: AiReviewCitation): string {
  if (i18n.locale === "en-US") {
    return citation.detail;
  }
  if (citation.id === "parameter-scan") {
    return citation.detail;
  }
  const detail = citation.detail;
  const benchmark = detail.match(/^Strategy (.+) vs buy-and-hold (.+) over (\d+) audited bars\.$/);
  if (benchmark) {
    return `策略 ${benchmark[1]} 对比买入持有 ${benchmark[2]} · ${benchmark[3]} 根审计K线`;
  }
  if (detail === "Benchmark comparison waits for an audited data snapshot.") {
    return "基准对比等待审计数据快照。";
  }
  return detail
    .replace("No reproducible backtest is bound to this context.", "当前上下文尚未绑定可复现回测。")
    .replace("Data quality is only trusted after an audited run is loaded.", "数据质量只在加载审计运行后可信。")
    .replace("Run metadata did not include data quality details.", "运行元数据未包含数据质量详情。")
    .replace("no guaranteed outcome.", "不保证结果。")
    .replace("this is not investment advice.", "这不是投资建议。")
    .replace("Current parameter row is missing from the locked scan.", "锁定扫描中缺少当前参数行。")
    .replace("is the top non-current candidate for re-audit", "是排名最高的非当前复审候选")
    .replace("No non-current candidate is available for re-audit", "暂无非当前参数可进入复审")
    .replace("on the locked snapshot.", "，基于锁定快照。")
    .replace("drawdown-risk rows", "条回撤风险行")
    .replace("positive rows", "条正向行")
    .replace("candidates", "个候选")
    .replace("Current", "当前")
    .replace("ranks", "排名")
    .replace("Win rate", "胜率")
    .replace("rows", "行")
    .replace("warnings", "条告警")
    .replace("warning", "条告警")
    .replace("bars", "根K线")
    .replace("paper_only", "仅模拟盘")
    .replace("certified_live", "认证实盘")
    .replace("blocked_live", "实盘阻断")
    .replace("Adapter certified: blocked", "适配器认证：阻断")
    .replace("Risk approved: blocked", "风控审批：阻断")
    .replace("Human confirmed: blocked", "人工确认：阻断")
    .replace("Adapter certified: passed", "适配器认证：通过")
    .replace("Risk approved: passed", "风控审批：通过")
    .replace("Human confirmed: passed", "人工确认：通过");
}

export function formatChartDate(timestamp: string): string {
  return timestamp.slice(0, 10);
}
