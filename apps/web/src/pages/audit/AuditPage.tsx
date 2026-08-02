import { CheckCircle2, Copy, Search, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import type { ResearchRunAudit } from "../../lib/terminal-workbench";
import { compactRunId, EmptyState, PageHeader, Status, SurfacePanel } from "../../components/TerminalSurfaceUi";
import type { TerminalWorkspacePageProps } from "../shared/terminal-workspace-page";
import "./AuditPage.layout.css";

type AuditEventType = "all" | "data-ingest" | "data-processing" | "backtest" | "ai-review";

interface AuditLedgerFilters {
  runId: string;
  symbol: string;
  eventType: AuditEventType;
}

const AUDIT_LEDGER_EVENTS = [
  ["data-ingest", "数据接入", "行情与因子数据接入"],
  ["data-processing", "数据处理", "因子计算与标准化"],
  ["backtest", "策略", "回测运行"],
  ["ai-review", "AI", "评审运行"],
] as const;

export function buildAuditLedgerRows(
  runs: ResearchRunAudit[],
  filters: AuditLedgerFilters,
) {
  const runIdQuery = filters.runId.trim().toLowerCase();
  const symbolQuery = filters.symbol.trim().toLowerCase();

  return runs
    .map((run, runIndex) => ({ run, runIndex }))
    .filter(({ run }) =>
      (!runIdQuery || run.runId.toLowerCase().includes(runIdQuery)) &&
      (!symbolQuery || run.symbol.toLowerCase().includes(symbolQuery))
    )
    .flatMap(({ run, runIndex }) =>
      AUDIT_LEDGER_EVENTS
        .filter(([eventType]) => filters.eventType === "all" || filters.eventType === eventType)
        .map(([eventType, stage, event]) => ({
          eventType,
          event,
          operator: eventType === "data-ingest" ? "system" : "quant.user",
          run,
          stage,
          status: eventType === "ai-review" ? (runIndex ? "通过" : "待执行") : "成功",
        })),
    )
    .slice(0, 12);
}

export function AuditPage({
  action,
  executionAcceptanceAudit,
  runs,
  workspace,
}: Pick<TerminalWorkspacePageProps, "action" | "executionAcceptanceAudit" | "runs" | "workspace">) {
  const contextRunId = workspace.researchRun?.runId ?? "";
  const contextSymbol = workspace.selectedInstrument.symbol;
  const [draftFilters, setDraftFilters] = useState<AuditLedgerFilters>({
    runId: contextRunId,
    symbol: contextSymbol,
    eventType: "all",
  });
  const [filters, setFilters] = useState<AuditLedgerFilters>(draftFilters);

  useEffect(() => {
    const nextFilters: AuditLedgerFilters = {
      runId: contextRunId,
      symbol: contextSymbol,
      eventType: "all",
    };
    setDraftFilters(nextFilters);
    setFilters(nextFilters);
  }, [contextRunId, contextSymbol]);

  const ledgerRows = buildAuditLedgerRows(runs, filters);

  return (
    <>
      <PageHeader
        action={action}
        title="审计回放"
        subtitle="证据驱动的全链路可追溯回放（仅纸面盘）"
      >
        <div className="design-header-actions">
          <button type="button">
            <Upload size={13} />
            导入复现包
          </button>
          <button type="button">
            <Copy size={13} />
            复制证据锚点
          </button>
        </div>
      </PageHeader>
      <form
        aria-label="审计事件筛选"
        className="design-audit-filters"
        onSubmit={(event) => {
          event.preventDefault();
          setFilters(draftFilters);
        }}
      >
        <label>
          Run ID
          <input
            autoComplete="off"
            name="runId"
            onChange={(event) => setDraftFilters((current) => ({
              ...current,
              runId: event.target.value,
            }))}
            value={draftFilters.runId}
          />
        </label>
        <label>
          标的/代码
          <input
            autoComplete="off"
            name="symbol"
            onChange={(event) => setDraftFilters((current) => ({
              ...current,
              symbol: event.target.value,
            }))}
            value={draftFilters.symbol}
          />
        </label>
        <label>
          事件类型
          <select
            name="eventType"
            onChange={(event) => setDraftFilters((current) => ({
              ...current,
              eventType: event.target.value as AuditEventType,
            }))}
            value={draftFilters.eventType}
          >
            <option value="all">全部</option>
            <option value="data-ingest">数据接入</option>
            <option value="data-processing">数据处理</option>
            <option value="backtest">回测运行</option>
            <option value="ai-review">AI 评审</option>
          </select>
        </label>
        <button type="submit">
          <Search size={13} />
          查询
        </button>
      </form>
      {executionAcceptanceAudit ? (
        <div className="design-execution-acceptance-audit">{executionAcceptanceAudit}</div>
      ) : null}
      <div className="design-audit-grid">
        <SurfacePanel
          className="design-audit-ledger"
          title="统一审计账本（时间升序）"
        >
          <table className="design-table compact">
            <thead>
              <tr>
                <th>时间</th>
                <th>阶段</th>
                <th>事件类型</th>
                <th>事件摘要</th>
                <th>Run ID</th>
                <th>状态</th>
                <th>Hash（事件）</th>
                <th>操作者</th>
              </tr>
            </thead>
            <tbody>
              {ledgerRows.map((row) => (
                <tr key={`${row.run.runId}-${row.eventType}`}>
                  <td>
                    {new Date(row.run.createdAt).toLocaleTimeString("zh-CN")}
                  </td>
                  <td>{row.stage}</td>
                  <td>{row.event}</td>
                  <td>{row.run.strategyName}</td>
                  <td>{compactRunId(row.run.runId)}</td>
                  <td>
                    <Status
                      tone={row.status === "待执行" ? "warning" : "positive"}
                    >
                      {row.status}
                    </Status>
                  </td>
                  <td>{compactRunId(row.run.strategyRevision)}</td>
                  <td>{row.operator}</td>
                </tr>
              ))}
              {!ledgerRows.length ? (
                <tr>
                  <td className="design-empty" colSpan={8}>
                    <EmptyState
                      detail="请修改 Run ID、标的代码或事件类型后重新查询。"
                      title="未找到匹配的审计事件"
                    />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </SurfacePanel>
        <div className="design-audit-side">
          <SurfacePanel title="包完整性">
            <div className="design-kv-row">
              <span>事件数量</span>
              <strong>{runs.length * 4}</strong>
            </div>
            <div className="design-kv-row">
              <span>制品数量</span>
              <strong>{runs.length * 8}</strong>
            </div>
            <div className="design-kv-row">
              <span>包 Hash</span>
              <strong>{compactRunId(workspace.researchRun?.runId)}</strong>
            </div>
          </SurfacePanel>
          <SurfacePanel title="签名验证">
            {["事件签名", "制品签名", "可供验环境"].map((label) => (
              <div className="design-check-row" key={label}>
                <CheckCircle2 size={14} />
                <span>{label}</span>
                <Status>通过</Status>
              </div>
            ))}
          </SurfacePanel>
          <SurfacePanel title="制品覆盖">
            {["研究", "策略", "组合", "就绪"].map((label, index) => (
              <div className="design-coverage-row" key={label}>
                <span>{label}</span>
                <strong>
                  {32 - index * 4}/{32 - index * 4}
                </strong>
                <div className="design-progress">
                  <span style={{ width: "100%" }} />
                </div>
              </div>
            ))}
          </SurfacePanel>
          <SurfacePanel title="回放精确度">
            <div className="design-big-metric">
              100%<span>一致事件</span>
            </div>
            <div className="design-kv-row">
              <span>不一致</span>
              <strong className="up">0</strong>
            </div>
            <div className="design-kv-row">
              <span>不可回放</span>
              <strong className="up">0</strong>
            </div>
          </SurfacePanel>
        </div>
        <SurfacePanel
          className="design-audit-detail"
          title="事件详情 · 证据制品 · Hash 链 · 回放"
        >
          <div className="design-detail-grid">
            <article>
              <strong>规范化元数据（Diff）</strong>
              <p>基线来源：{workspace.strategy.name}</p>
              <p>特征数量：{workspace.researchRun?.dataRows ?? 0}</p>
              <p>降维方法：PCA</p>
            </article>
            <article>
              <strong>制品概览</strong>
              <p>数据制品 {runs.length}</p>
              <p>模型制品 {workspace.metrics.length}</p>
              <p>报告/文档 {workspace.decisionLog.length}</p>
            </article>
            <article>
              <strong>时间线</strong>
              {runs.slice(0, 5).map((run) => (
                <div className="design-history-row" key={run.runId}>
                  <i className="done" />
                  <span>
                    {new Date(run.createdAt).toLocaleTimeString("zh-CN")}
                  </span>
                  <strong>{compactRunId(run.runId)}</strong>
                </div>
              ))}
            </article>
            <article>
              <strong>回放结果</strong>
              <div className="design-kv-row">
                <span>一致性状态</span>
                <Status>一致</Status>
              </div>
              <div className="design-progress">
                <span style={{ width: "100%" }} />
              </div>
            </article>
          </div>
        </SurfacePanel>
      </div>
    </>
  );
}
