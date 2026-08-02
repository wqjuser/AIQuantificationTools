import { Panel } from "../../components/AppPanel";
import { type AppI18n } from "../../lib/i18n";
import { AuditEvidenceSummary, ResearchRunExportBrowserRow, ResearchRunExportPreviewRow, ResearchRunImportDiffRow, filterResearchRunExportBrowserRows, filterResearchRunExportPreviewRows, filterResearchRunImportDiffRows } from "../../lib/terminal-workbench";
import { type ImportAuditEvidenceDeepLinkStatus } from "../app-shell/url-state";
import { researchExportBrowserDetail, researchExportBrowserLabel, researchExportBrowserStatusLabel, researchExportDeepLinkStatusLabel, researchExportPreviewCount, researchExportPreviewDetail, researchExportPreviewLabel, researchExportPreviewStatusLabel, researchImportDiffDetail, researchImportDiffLabel, researchImportDiffStatusLabel, researchImportDiffValue } from "./ResearchPackageFormatters";
import { Copy, Download, RefreshCw, Upload } from "lucide-react";
import { useState } from "react";

export function ResearchRunExportPreviewPanel({
  className,
  i18n,
  rows
}: {
  className?: string;
  i18n: AppI18n;
  rows: ResearchRunExportPreviewRow[];
}) {
  const [query, setQuery] = useState("");
  const filteredRows = filterResearchRunExportPreviewRows(rows, query);
  const readyCount = rows.filter((row) => row.status === "ready").length;
  const blockedCount = rows.filter((row) => row.status === "blocked").length;

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "复现包预览" : "Export Package Preview"}
      subtitle={
        i18n.locale === "zh-CN"
          ? "研究运行、证据和执行闸门的导出就绪度"
          : "Export readiness for run evidence and execution gates"
      }
      className={className}
    >
      <div className="research-export-preview">
        <div className="research-export-preview-toolbar">
          <div className="research-export-preview-summary">
            <span>
              {i18n.locale === "zh-CN" ? "就绪" : "Ready"} <strong>{readyCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "阻断" : "Blocked"} <strong>{blockedCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "总项" : "Total"} <strong>{rows.length}</strong>
            </span>
          </div>
          <input
            aria-label={i18n.locale === "zh-CN" ? "搜索复现包预览" : "Search export package preview"}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={i18n.locale === "zh-CN" ? "搜索 artifact / anchor / exportPath" : "Search artifact / anchor / exportPath"}
            type="search"
            value={query}
          />
        </div>
        <div className="research-export-preview-list">
          {filteredRows.length ? (
            filteredRows.map((row) => (
              <article className={`research-export-preview-row ${row.tone} ${row.status}`} key={row.id}>
                <span>{researchExportPreviewLabel(i18n, row)}</span>
                <strong>{researchExportPreviewDetail(i18n, row.detail)}</strong>
                <em>{researchExportPreviewCount(i18n, row.count)}</em>
                <small>{row.exportPath}</small>
                <b>{researchExportPreviewStatusLabel(i18n, row.status)}</b>
                <p>{row.anchor}</p>
              </article>
            ))
          ) : (
            <article className="research-export-preview-row empty">
              <span>{i18n.locale === "zh-CN" ? "无匹配" : "No match"}</span>
              <strong>{i18n.locale === "zh-CN" ? "清空搜索查看全部导出项" : "Clear search to see every export item"}</strong>
              <em>-</em>
              <small>-</small>
              <b>{i18n.locale === "zh-CN" ? "过滤中" : "Filtered"}</b>
              <p>{i18n.locale === "zh-CN" ? "当前查询没有命中复现包预览。" : "The current query did not match this export package preview."}</p>
            </article>
          )}
        </div>
      </div>
    </Panel>
  );
}

export function ResearchRunExportPackageBrowserPanel({
  className,
  deepLinkStatus,
  evidenceSummary,
  i18n,
  isEvidenceReportCopied,
  isEvidenceSummaryCopied,
  isLoading,
  onCopyEvidenceReport,
  onCopyEvidenceSummary,
  onDownloadEvidenceReport,
  onRetryDeepLink,
  onQueryChange,
  query,
  rows
}: {
  className?: string;
  deepLinkStatus?: ImportAuditEvidenceDeepLinkStatus | null;
  evidenceSummary: AuditEvidenceSummary;
  i18n: AppI18n;
  isEvidenceReportCopied: boolean;
  isEvidenceSummaryCopied: boolean;
  isLoading: boolean;
  onCopyEvidenceReport: () => void;
  onCopyEvidenceSummary: () => void;
  onDownloadEvidenceReport: () => void;
  onRetryDeepLink?: () => void;
  onQueryChange: (query: string) => void;
  query: string;
  rows: ResearchRunExportBrowserRow[];
}) {
  const filteredRows = filterResearchRunExportBrowserRows(rows, query);
  const readyCount = rows.filter((row) => row.status === "ready").length;
  const blockedCount = rows.filter((row) => row.status === "blocked").length;
  const missingCount = rows.filter((row) => row.status === "missing").length;

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "复现包浏览器" : "Export Package Browser"}
      subtitle={
        i18n.locale === "zh-CN"
          ? "Manifest、integrity 与 artifact 数量校验"
          : "Manifest, integrity, and artifact count checks"
      }
      className={className}
      action={isLoading ? <RefreshCw className="spin" size={15} /> : undefined}
    >
      <div className="research-export-browser">
        <div className="research-export-browser-toolbar">
          <div className="research-export-browser-summary">
            <span>
              {i18n.locale === "zh-CN" ? "就绪" : "Ready"} <strong>{readyCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "缺失" : "Missing"} <strong>{missingCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "阻断" : "Blocked"} <strong>{blockedCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "总项" : "Total"} <strong>{rows.length}</strong>
            </span>
          </div>
          <input
            aria-label={i18n.locale === "zh-CN" ? "搜索复现包浏览器" : "Search export package browser"}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={i18n.locale === "zh-CN" ? "搜索 manifest / exportPath / 状态" : "Search manifest / exportPath / status"}
            type="search"
            value={query}
          />
        </div>
        <div className="research-audit-evidence-summary">
          <div>
            <span>{i18n.locale === "zh-CN" ? "审计摘要" : "Audit summary"}</span>
            <strong>{evidenceSummary.runId}</strong>
            <p>
              {i18n.locale === "zh-CN" ? "流水" : "Ledger"} {evidenceSummary.auditQuery || "-"} ·{" "}
              {i18n.locale === "zh-CN" ? "包命中" : "Package"} {evidenceSummary.packageMatchedCount}/
              {evidenceSummary.packageTotalCount} · {i18n.locale === "zh-CN" ? "Diff 阻断" : "Diff blocked"}{" "}
              {evidenceSummary.importDiffBlockedCount}
            </p>
            <em>
              {i18n.locale === "zh-CN" ? "当前焦点" : "Current focus"} {evidenceSummary.focusQuery || "-"} ·{" "}
              {i18n.locale === "zh-CN" ? "深链" : "Deep link"}{" "}
              {researchExportDeepLinkStatusLabel(i18n, evidenceSummary.deepLinkStatus)} ·{" "}
              {i18n.locale === "zh-CN" ? "验签" : "Verification"} {evidenceSummary.importVerificationVerifiedCount}/
              {evidenceSummary.importVerificationInvalidCount}
            </em>
          </div>
          <div className="research-audit-evidence-actions">
            <button onClick={onCopyEvidenceSummary} type="button">
              <Copy size={13} />
              {isEvidenceSummaryCopied
                ? i18n.locale === "zh-CN"
                  ? "已复制"
                  : "Copied"
                : i18n.locale === "zh-CN"
                  ? "复制摘要"
                  : "Copy summary"}
            </button>
            <button onClick={onCopyEvidenceReport} type="button">
              <Download size={13} />
              {isEvidenceReportCopied
                ? i18n.locale === "zh-CN"
                  ? "报告已复制"
                  : "Report copied"
                : i18n.locale === "zh-CN"
                  ? "复制报告"
                  : "Copy report"}
            </button>
            <button onClick={onDownloadEvidenceReport} type="button">
              <Download size={13} />
              {i18n.locale === "zh-CN" ? "下载报告" : "Download report"}
            </button>
          </div>
        </div>
        {deepLinkStatus ? (
          <div className={`research-export-deep-link ${deepLinkStatus.status}`}>
            <div>
              <span>{i18n.locale === "zh-CN" ? "审计深链" : "Audit deep link"}</span>
              <strong>{researchExportDeepLinkStatusLabel(i18n, deepLinkStatus.status)}</strong>
              <p>
                {deepLinkStatus.runId} · {deepLinkStatus.focusQuery}
              </p>
              {deepLinkStatus.error ? <em>{deepLinkStatus.error}</em> : null}
            </div>
            <button
              disabled={!onRetryDeepLink || deepLinkStatus.status === "loading" || isLoading}
              onClick={onRetryDeepLink}
              type="button"
            >
              <RefreshCw size={13} />
              {i18n.locale === "zh-CN" ? "重试" : "Retry"}
            </button>
          </div>
        ) : null}
        <div className="research-export-browser-list">
          {filteredRows.length ? (
            filteredRows.map((row) => (
              <article className={`research-export-browser-row ${row.tone} ${row.status}`} key={row.id}>
                <span>{researchExportBrowserLabel(i18n, row)}</span>
                <strong>{researchExportBrowserDetail(i18n, row.detail)}</strong>
                <em>{row.value}</em>
                <small>{row.exportPath}</small>
                <b>{researchExportBrowserStatusLabel(i18n, row.status)}</b>
              </article>
            ))
          ) : (
            <article className="research-export-browser-row empty">
              <span>{i18n.locale === "zh-CN" ? "无匹配" : "No match"}</span>
              <strong>{i18n.locale === "zh-CN" ? "清空搜索查看全部 manifest 项" : "Clear search to see every manifest item"}</strong>
              <em>-</em>
              <small>-</small>
              <b>{i18n.locale === "zh-CN" ? "过滤中" : "Filtered"}</b>
            </article>
          )}
        </div>
      </div>
    </Panel>
  );
}

export function ResearchRunImportDiffPanel({
  className,
  i18n,
  isImporting = false,
  onCancelImport,
  onConfirmImport,
  onQueryChange,
  pendingFileName,
  query,
  rows
}: {
  className?: string;
  i18n: AppI18n;
  isImporting?: boolean;
  onCancelImport?: () => void;
  onConfirmImport?: () => void;
  onQueryChange: (query: string) => void;
  pendingFileName?: string | null;
  query: string;
  rows: ResearchRunImportDiffRow[];
}) {
  const filteredRows = filterResearchRunImportDiffRows(rows, query);
  const changeCount = rows.filter((row) => row.status === "change" || row.status === "replace").length;
  const addCount = rows.filter((row) => row.status === "add").length;
  const blockedCount = rows.filter((row) => row.status === "blocked").length;
  const canConfirmImport = Boolean(pendingFileName && onConfirmImport) && blockedCount === 0;

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "导入影响预检" : "Import Impact Diff"}
      subtitle={i18n.locale === "zh-CN" ? "导入前对比当前工作区和复现包字段" : "Compare current workspace fields before import"}
      className={className}
    >
      <div className="research-import-diff">
        <div className="research-import-diff-toolbar">
          <div className="research-import-diff-summary">
            <span>
              {i18n.locale === "zh-CN" ? "变更" : "Changes"} <strong>{changeCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "新增" : "Adds"} <strong>{addCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "阻断" : "Blocked"} <strong>{blockedCount}</strong>
            </span>
            <span>
              {i18n.locale === "zh-CN" ? "字段" : "Fields"} <strong>{rows.length}</strong>
            </span>
          </div>
          <div className="research-import-diff-actions">
            <span>{pendingFileName ?? (i18n.locale === "zh-CN" ? "未选择外部文件" : "No external file")}</span>
            <button disabled={!pendingFileName || isImporting} onClick={onCancelImport} type="button">
              {i18n.locale === "zh-CN" ? "取消" : "Cancel"}
            </button>
            <button disabled={!canConfirmImport || isImporting} onClick={onConfirmImport} type="button">
              {isImporting ? <RefreshCw className="spin" size={13} /> : <Upload size={13} />}
              {i18n.locale === "zh-CN" ? "确认导入" : "Apply import"}
            </button>
          </div>
          <input
            aria-label={i18n.locale === "zh-CN" ? "搜索导入差异" : "Search import diff"}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={i18n.locale === "zh-CN" ? "搜索字段 / hash / exportPath / 状态" : "Search field / hash / exportPath / status"}
            type="search"
            value={query}
          />
        </div>
        <div className="research-import-diff-list">
          {filteredRows.length ? (
            filteredRows.map((row) => (
              <article className={`research-import-diff-row ${row.tone} ${row.status}`} key={row.id}>
                <span>{researchImportDiffLabel(i18n, row)}</span>
                <b>{researchImportDiffStatusLabel(i18n, row.status)}</b>
                <strong>{researchImportDiffValue(i18n, row.current)}</strong>
                <em>{researchImportDiffValue(i18n, row.incoming)}</em>
                <p>
                  {researchImportDiffDetail(i18n, row.detail)}
                  <small>{row.exportPath}</small>
                </p>
              </article>
            ))
          ) : (
            <article className="research-import-diff-row empty">
              <span>{i18n.locale === "zh-CN" ? "无匹配" : "No match"}</span>
              <b>{i18n.locale === "zh-CN" ? "过滤中" : "Filtered"}</b>
              <strong>-</strong>
              <em>-</em>
              <p>{i18n.locale === "zh-CN" ? "当前查询没有命中导入差异字段。" : "The current query did not match any import diff fields."}</p>
            </article>
          )}
        </div>
      </div>
    </Panel>
  );
}
