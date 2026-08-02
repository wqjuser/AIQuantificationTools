import { Panel } from "./AppPanel";
import type { AppI18n } from "../lib/i18n";
import type { HandoffNotesResult, ResearchNoteResult } from "../lib/terminal-api";
import type { TerminalWorkspace } from "../lib/terminal-workbench";

function ResearchNotesPanel({
  className,
  draft,
  i18n,
  isSaving,
  note,
  onChange,
  onSave,
  workspace
}: {
  className?: string;
  draft: string;
  i18n: AppI18n;
  isSaving: boolean;
  note: ResearchNoteResult;
  onChange: (value: string) => void;
  onSave: () => void;
  workspace: TerminalWorkspace;
}) {
  const updatedAt = note.note?.updatedAt
    ? new Date(note.note.updatedAt).toLocaleString(i18n.locale === "zh-CN" ? "zh-CN" : "en-US")
    : null;
  const statusText = note.source === "core"
    ? updatedAt ?? (i18n.locale === "zh-CN" ? "尚未保存" : "Not saved yet")
    : note.error ?? (i18n.locale === "zh-CN" ? "本地核心不可用" : "Core unavailable");

  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "研究笔记" : "Research Notes"}
      subtitle={`${workspace.selectedInstrument.symbol} · ${workspace.selectedTimeframe}`}
      className={className}
    >
      <div className="research-note-editor">
        <textarea
          aria-label={i18n.locale === "zh-CN" ? "研究笔记" : "Research note"}
          maxLength={20000}
          onChange={(event) => onChange(event.target.value)}
          placeholder={
            i18n.locale === "zh-CN"
              ? "记录这个标的、周期、数据质量、观察假设或后续验证点。"
              : "Capture thesis, data quality, observations, or follow-up checks for this context."
          }
          value={draft}
        />
        <div className="research-note-meta">
          <span>{statusText}</span>
          <button disabled={isSaving} onClick={onSave} type="button">
            {isSaving ? (i18n.locale === "zh-CN" ? "保存中" : "Saving") : i18n.locale === "zh-CN" ? "保存笔记" : "Save note"}
          </button>
        </div>
      </div>
    </Panel>
  );
}

function HandoffNotesPanel({
  className,
  draft,
  i18n,
  isSaving,
  notes,
  onChange,
  onSave,
  runId
}: {
  className?: string;
  draft: string;
  i18n: AppI18n;
  isSaving: boolean;
  notes: HandoffNotesResult;
  onChange: (value: string) => void;
  onSave: () => void;
  runId: string | null;
}) {
  const recentNotes = notes.handoffNotes.slice(0, 3);
  const statusText =
    notes.source === "core"
      ? runId
        ? i18n.locale === "zh-CN"
          ? `${notes.pagination?.total ?? notes.handoffNotes.length} 条交接`
          : `${notes.pagination?.total ?? notes.handoffNotes.length} handoff notes`
        : i18n.locale === "zh-CN"
          ? "先生成研究运行"
          : "Run required"
      : notes.error ?? (i18n.locale === "zh-CN" ? "本地核心不可用" : "Core unavailable");
  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "交接备注" : "Handoff Notes"}
      subtitle={runId ? `${i18n.locale === "zh-CN" ? "绑定运行" : "Bound run"} · ${runId}` : i18n.locale === "zh-CN" ? "等待研究运行" : "Waiting for run"}
      className={className}
    >
      <div className="handoff-note-panel">
        <div className="handoff-note-list">
          {recentNotes.length ? (
            recentNotes.map((note) => (
              <article className="handoff-note-item" key={note.noteId}>
                <div>
                  <strong>{note.author || (i18n.locale === "zh-CN" ? "本地操作者" : "Local operator")}</strong>
                  <span>{new Date(note.updatedAt).toLocaleString(i18n.locale === "zh-CN" ? "zh-CN" : "en-US")}</span>
                </div>
                <p>{note.body}</p>
              </article>
            ))
          ) : (
            <div className="handoff-note-empty">
              {runId
                ? i18n.locale === "zh-CN"
                  ? "还没有交接备注。"
                  : "No handoff notes yet."
                : i18n.locale === "zh-CN"
                  ? "先运行流水线，备注会绑定到审计运行。"
                  : "Run the pipeline first; notes bind to the audited run."}
            </div>
          )}
        </div>
        <textarea
          aria-label={i18n.locale === "zh-CN" ? "交接备注" : "Handoff note"}
          disabled={!runId}
          maxLength={20000}
          onChange={(event) => onChange(event.target.value)}
          placeholder={
            i18n.locale === "zh-CN"
              ? "给明天的自己或同伴写清：需要复核什么、不能做什么、下一步证据在哪里。"
              : "Tell the next operator what to recheck, what not to do, and where the evidence lives."
          }
          value={draft}
        />
        <div className="research-note-meta">
          <span>{statusText}</span>
          <button disabled={isSaving || !runId || !draft.trim()} onClick={onSave} type="button">
            {isSaving ? (i18n.locale === "zh-CN" ? "保存中" : "Saving") : i18n.locale === "zh-CN" ? "保存交接" : "Save handoff"}
          </button>
        </div>
      </div>
    </Panel>
  );
}
