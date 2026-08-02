import { Panel } from "../../components/AppPanel";
import { type AppI18n } from "../../lib/i18n";
import { ResearchRunAudit, ResearchRunComparisonRow, TerminalWorkspace } from "../../lib/terminal-workbench";
import { historyComparisonDeltaLabel, historyComparisonLabel, historyComparisonValue, historyRunDetailLabel } from "./RunHistoryFormatters";
import { Download, Play, Search, Upload } from "lucide-react";
import { type ChangeEvent, useRef } from "react";

export function RunHistoryPanel({
  className,
  i18n,
  onExport,
  onInspectExport,
  onImportFile,
  onReplay,
  runComparisonRows,
  runHistory,
  workspace
}: {
  className?: string;
  i18n: AppI18n;
  onExport: (run: ResearchRunAudit) => void;
  onInspectExport: (run: ResearchRunAudit) => void;
  onImportFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onReplay: (run: ResearchRunAudit) => void;
  runComparisonRows: ResearchRunComparisonRow[];
  runHistory: ResearchRunAudit[];
  workspace: TerminalWorkspace;
}) {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  return (
    <Panel
      title={i18n.t("panel.history.title")}
      subtitle={i18n.t("panel.history.subtitle")}
      className={className}
      action={
        <div className="history-panel-actions">
          <input
            accept="application/json,.json"
            className="history-import-input"
            onChange={onImportFile}
            ref={importInputRef}
            type="file"
          />
          <button className="history-import-button" onClick={() => importInputRef.current?.click()} type="button">
            <Upload size={13} />
            <span>{i18n.t("history.import")}</span>
          </button>
        </div>
      }
    >
      <div className="history-panel-body">
        {runComparisonRows.length ? <RunComparisonBoard i18n={i18n} rows={runComparisonRows} /> : null}
        <div className="run-history">
          {runHistory.length ? (
            runHistory.map((run) => (
              <RunHistoryRow
                key={run.runId}
                i18n={i18n}
                run={run}
                isActive={workspace.researchRun?.runId === run.runId}
                onExport={onExport}
                onInspectExport={onInspectExport}
                onReplay={onReplay}
              />
            ))
          ) : (
            <span className="empty-state">{i18n.t("empty.noAuditedRuns")}</span>
          )}
        </div>
      </div>
    </Panel>
  );
}

export function RunHistoryRow({
  run,
  isActive,
  onExport,
  onInspectExport,
  onReplay,
  i18n
}: {
  run: ResearchRunAudit;
  isActive: boolean;
  onExport: (run: ResearchRunAudit) => void;
  onInspectExport: (run: ResearchRunAudit) => void;
  onReplay: (run: ResearchRunAudit) => void;
  i18n: AppI18n;
}) {
  return (
    <article
      aria-current={isActive ? "true" : undefined}
      className={`history-row ${isActive ? "active" : ""}`}
    >
      <button className="history-row-main" onClick={() => onReplay(run)} type="button">
        <strong>{i18n.researchRunHistoryLabel(run)}</strong>
        <span>{historyRunDetailLabel(i18n, run)}</span>
        <span>{run.runId}</span>
      </button>
      <div className="history-row-actions">
        <button onClick={() => onReplay(run)} type="button">
          <Play size={13} />
          <small>{isActive ? i18n.t("history.active") : i18n.t("history.replay")}</small>
        </button>
        <button onClick={() => onExport(run)} type="button">
          <Download size={13} />
          <small>{i18n.t("history.export")}</small>
        </button>
        <button onClick={() => onInspectExport(run)} type="button">
          <Search size={13} />
          <small>{i18n.locale === "zh-CN" ? "查看包" : "Inspect"}</small>
        </button>
      </div>
    </article>
  );
}

export function RunComparisonBoard({ i18n, rows }: { i18n: AppI18n; rows: ResearchRunComparisonRow[] }) {
  return (
    <div className="history-comparison">
      <div className="history-comparison-title">
        <span>{i18n.t("history.comparison")}</span>
        <strong>{rows.length}</strong>
      </div>
      <div className="history-comparison-grid">
        <div className="history-comparison-row history-comparison-head">
          <span>{i18n.t("history.delta")}</span>
          <span>{i18n.t("history.current")}</span>
          <span>{i18n.t("history.previous")}</span>
        </div>
        {rows.map((row) => (
          <article className={`history-comparison-row ${row.tone}`} key={row.id}>
            <span>
              <strong>{historyComparisonLabel(i18n, row.label)}</strong>
              <em>{historyComparisonDeltaLabel(i18n, row.delta)}</em>
            </span>
            <span>{historyComparisonValue(i18n, row.current)}</span>
            <span>{historyComparisonValue(i18n, row.previous)}</span>
          </article>
        ))}
      </div>
    </div>
  );
}
