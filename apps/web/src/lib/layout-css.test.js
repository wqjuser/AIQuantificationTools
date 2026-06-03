import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const styles = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const viteConfig = readFileSync(new URL("../../vite.config.ts", import.meta.url), "utf8");

function cssBlock(selector) {
  return cssBlocks(selector)[0] ?? "";
}

function cssBlocks(selector) {
  const blocks = [];
  let fromIndex = 0;
  while (fromIndex < styles.length) {
    const start = styles.indexOf(`${selector} {`, fromIndex);
    if (start < 0) {
      break;
    }
    const bodyStart = styles.indexOf("{", start);
    const bodyEnd = styles.indexOf("}", bodyStart);
    blocks.push(styles.slice(bodyStart + 1, bodyEnd));
    fromIndex = bodyEnd + 1;
  }
  return blocks;
}

function hasCssDeclaration(selector, declaration) {
  return cssBlocks(selector).some((block) => block.includes(declaration));
}

function hasExactCssDeclaration(selector, declaration) {
  return cssBlocks(selector).some((block) =>
    block
      .split(";")
      .map((line) => `${line.trim()};`)
      .includes(declaration)
  );
}

function hasCssBlockWith(selector, declarations) {
  return cssBlocks(selector).some((block) => declarations.every((declaration) => block.includes(declaration)));
}

function sourceBetween(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  if (start < 0) {
    return "";
  }
  const end = appSource.indexOf(endMarker, start);
  return end < 0 ? appSource.slice(start) : appSource.slice(start, end + endMarker.length);
}

describe("terminal layout css", () => {
  test("splits production vendor dependencies instead of emitting one large entry chunk", () => {
    expect(viteConfig).toContain("manualChunks: vendorChunkName");
    expect(viteConfig).toContain('return "vendor-charts";');
    expect(viteConfig).toContain('return "vendor-icons";');
    expect(viteConfig).toContain('return "vendor-react";');
    expect(viteConfig).not.toContain("chunkSizeWarningLimit");
  });

  test("uses product work areas as the primary left navigation", () => {
    const leftRailSource = sourceBetween('<aside className="left-rail">', "</aside>");

    expect(appSource).toContain("buildProductWorkAreas(workspace)");
    expect(appSource).toContain("resolveInitialWorkAreaId");
    expect(appSource).toContain('new URLSearchParams(window.location.search).get("workspace")');
    expect(appSource).toContain("productWorkAreas.map");
    expect(leftRailSource).toContain('className={`work-area-button');
    expect(leftRailSource).toContain("i18n.productWorkAreaLabel");
    expect(leftRailSource).toContain("i18n.productWorkAreaDescription");
    expect(leftRailSource).not.toContain("workspace.quantLoop.map");
  });

  test("uses the left rail for actionable product work areas instead of passive module switching", () => {
    const leftRailSource = sourceBetween('<aside className="left-rail">', "</aside>");

    expect(appSource).toContain("resolveInitialWorkAreaId");
    expect(appSource).toContain('url.searchParams.set("workspace", activeWorkAreaId)');
    expect(appSource).toContain('url.searchParams.delete("workflow")');
    expect(leftRailSource).toContain('className="work-area-index"');
    expect(leftRailSource).toContain('className="work-area-copy"');
    expect(leftRailSource).toContain('className="work-area-status"');
    expect(leftRailSource).toContain('activeWorkAreaId === area.id ? "selected active" : ""');
    expect(leftRailSource).not.toContain('i18n.t("section.terminalModules")');
    expect(leftRailSource).not.toContain('className="module-list"');
    expect(appSource).toContain("renderActiveProductWorkspace()");
  });

  test("uses the document as the single desktop scroll surface", () => {
    expect(appSource).not.toContain('<aside className="agent-rail">');
    expect(cssBlock(".terminal-shell")).toContain("min-height: 100vh;");
    expect(cssBlock(".terminal-shell")).toContain("grid-template-columns: 184px minmax(0, 1fr);");
    expect(cssBlock(".terminal-shell")).toContain("overflow: visible;");
    expect(hasExactCssDeclaration(".terminal-shell", "height: 100vh;")).toBe(false);
    expect(cssBlock(".terminal-shell")).not.toContain("overflow: hidden;");
    expect(cssBlock(".left-rail")).not.toContain("max-height: 100vh;");
    expect(cssBlock(".left-rail")).not.toContain("overflow: auto;");
    expect(cssBlock(".terminal-main")).not.toContain("max-height: 100vh;");
    expect(cssBlock(".terminal-main")).not.toContain("overflow: auto;");
    expect(cssBlock(".terminal-main")).toContain("grid-template-rows: auto auto auto;");
    expect(cssBlock(".brand > div")).toContain("display: block;");
    expect(cssBlock(".work-area-button")).toContain("grid-template-columns: auto minmax(0, 1fr) auto;");
    expect(cssBlock(".work-area-copy")).toContain("display: block;");
    expect(hasCssDeclaration(".work-area-copy small", "display: none;")).toBe(true);
  });

  test("keeps blocked product work areas clickable so users can inspect gate reasons", () => {
    const leftRailSource = sourceBetween('<aside className="left-rail">', "</aside>");

    expect(leftRailSource).not.toContain('disabled={area.status === "blocked"}');
    expect(cssBlock(".work-area-button.blocked")).toContain("border-color: #7a3a32;");
  });

  test("resets the active workflow when timeframe changes invalidate audited context", () => {
    const selectTimeframeSource = sourceBetween("const selectTimeframe = useCallback", "setWorkflowRunState(createWorkflowRunState());");

    expect(selectTimeframeSource).toContain('setActiveLoopStepId("research");');
    expect(selectTimeframeSource).toContain('setActiveWorkflowStageId("data");');
  });

  test("keeps market context in one compact desktop band above the workflow", () => {
    expect(appSource).toContain('className="terminal-overview-grid market-tape"');
    expect(cssBlock(".terminal-overview-grid")).toContain(
      "grid-template-columns: minmax(220px, 0.65fr) minmax(500px, 1.7fr) minmax(300px, 0.9fr);"
    );
    expect(cssBlock(".terminal-overview-grid")).toContain("align-items: stretch;");
    expect(cssBlock(".terminal-overview-grid .watchlist-strip")).toContain("grid-template-columns: repeat(4, minmax(0, 1fr));");
    expect(cssBlock(".terminal-overview-grid .metrics-row")).toContain("grid-template-columns: repeat(4, minmax(0, 1fr));");
    expect(cssBlock(".terminal-overview-grid .ticker,\n.terminal-overview-grid .metric-card")).toContain("min-height: 42px;");
    expect(cssBlock(".terminal-overview-grid .module-focus-card")).toContain("min-height: 42px;");
    expect(cssBlock(".terminal-overview-grid .module-focus-card .run-button.compact")).toContain("white-space: nowrap;");
    expect(cssBlock(".terminal-overview-grid .metric-card span")).toContain("white-space: nowrap;");
    expect(
      hasCssBlockWith("  .terminal-overview-grid", [
        "grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.65fr);"
      ])
    ).toBe(true);
    expect(hasCssBlockWith("  .terminal-overview-grid .metrics-row", ["grid-row: 1 / span 2;"])).toBe(true);
  });

  test("renders the golden path runbook as a compact task checklist", () => {
    expect(appSource).toContain("buildGoldenPathRunbookPreview(goldenPath)");
    expect(appSource).toContain('className="golden-path-runbook"');
    expect(appSource).toContain('className={`golden-path-runbook-item ${item.status}');
    expect(appSource).toContain("onClick={() => selectProductWorkArea(item.workspaceId as ProductWorkAreaId)}");
    expect(appSource).toContain('type="button"');
    expect(appSource).toContain("goldenPathRunbookPreview.map");
    expect(cssBlock(".golden-path-runbook")).toContain("display: grid;");
    expect(cssBlock(".golden-path-runbook-item")).toContain("grid-template-columns: auto minmax(0, 1fr) auto;");
    expect(cssBlock(".golden-path-runbook-item")).toContain("cursor: pointer;");
  });

  test("renders the active work-area golden path context inside the task card", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("buildGoldenPathWorkspaceContext(goldenPath, activeWorkAreaId)");
    expect(appSource).toContain("activeWorkspaceContext");
    expect(appSource).toContain("runWorkspaceContextAction");
    expect(appSource).toContain("runGoldenPathActionById");
    expect(overviewSource).toContain('className={`workspace-gate-summary ${activeWorkspaceContext.status}`}');
    expect(overviewSource).toContain("goldenPathWorkspaceContextLabel");
    expect(overviewSource).toContain("goldenPathWorkspaceContextDetail");
    expect(overviewSource).toContain('className="workspace-gate-action"');
    expect(overviewSource).toContain("disabled={isWorkspaceContextActionDisabled}");
    expect(overviewSource).toContain("onClick={runWorkspaceContextAction}");
    expect(cssBlock(".workspace-gate-summary")).toContain("display: grid;");
    expect(cssBlock(".workspace-gate-summary")).toContain("grid-template-columns: auto minmax(0, 1fr) auto;");
    expect(cssBlock(".workspace-gate-action")).toContain("cursor: pointer;");
  });

  test("renders a full golden path runbook board in the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');

    expect(appSource).toContain("function GoldenPathRunbookPanel");
    expect(appSource).toContain("isGoldenPathActionDisabledById");
    expect(auditWorkspaceSource).toContain("<GoldenPathRunbookPanel");
    expect(auditWorkspaceSource).toContain("runbook={goldenPath?.runbook ?? []}");
    expect(auditWorkspaceSource).toContain("onSelectWorkspace={selectProductWorkArea}");
    expect(auditWorkspaceSource).toContain("onRunAction={runGoldenPathActionById}");
    expect(auditWorkspaceSource).toContain("isActionDisabled={isGoldenPathActionDisabledById}");
    expect(appSource).toContain("const isRunbookActionDisabled = !canRunAction || isActionDisabled(item.actionId);");
    expect(appSource).toContain("disabled={isRunbookActionDisabled}");
    expect(appSource).toContain("isGoldenPathActionDisabledById(goldenPathActionId)");
    expect(appSource).toContain("isGoldenPathActionDisabledById(workspaceContextActionId)");
    expect(cssBlock(".workflow-runbook-panel")).toContain("grid-area: runbook;");
    expect(cssBlock(".audit-runbook-panel")).toContain("align-self: start;");
    expect(cssBlock(".audit-runbook-list")).toContain("display: grid;");
    expect(cssBlock(".audit-runbook-row")).toContain("grid-template-columns: auto minmax(0, 1fr) auto auto;");
    expect(cssBlock(".audit-runbook-actions")).toContain("display: flex;");
    expect(hasCssBlockWith(".audit-layout", ['"runbook workflow"', '"history decision"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"runbook"', '"workflow"', '"history"', '"decision"'])).toBe(true);
  });

  test("renders AI review audit trail inside the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');

    expect(appSource).toContain("function AiReviewAuditTrailPanel");
    expect(auditWorkspaceSource).toContain("<AiReviewAuditTrailPanel");
    expect(auditWorkspaceSource).toContain("dossier={aiReviewDossier}");
    expect(auditWorkspaceSource).toContain("riskApproval={riskApprovalSummary}");
    expect(auditWorkspaceSource).toContain("records={activeAiReviewRunRecords}");
    expect(auditWorkspaceSource).toContain('className="workflow-ai-audit-panel"');
    expect(appSource).toContain("<AiReviewRunRecordHistory");
    expect(appSource).toContain("dossier.citations.map");
    expect(cssBlock(".workflow-ai-audit-panel")).toContain("grid-area: ai;");
    expect(cssBlock(".audit-ai-trail-grid")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-trail-grid")).toContain("grid-template-columns: minmax(280px, 0.75fr) minmax(0, 1.25fr);");
    expect(cssBlock(".audit-ai-citation-list")).toContain("display: grid;");
    expect(hasCssBlockWith(".audit-layout", ['"runbook workflow"', '"history decision"', '"ai ai"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"runbook"', '"workflow"', '"history"', '"decision"', '"ai"'])).toBe(true);
  });

  test("renders risk approval references in the AI review audit trail", () => {
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function AgentEvidenceBoard");
    const riskReferenceSource = sourceBetween("function AiReviewRiskReferenceBoard", "function AiReviewRecordDriftSummary");

    expect(appSource).toContain("function AiReviewRiskReferenceBoard");
    expect(auditPanelSource).toContain("riskApproval");
    expect(auditPanelSource).toContain("<AiReviewRiskReferenceBoard");
    expect(auditPanelSource).toContain("approval={riskApproval}");
    expect(riskReferenceSource).toContain("approval.gates.map");
    expect(riskReferenceSource).toContain("riskApprovalHeadline(i18n, approval)");
    expect(riskReferenceSource).toContain("riskApprovalSummaryText(i18n, approval)");
    expect(riskReferenceSource).toContain("riskApprovalGateLabel(i18n, gate)");
    expect(riskReferenceSource).toContain("riskApprovalGateStatus(i18n, gate.status)");
    expect(cssBlock(".audit-ai-risk-reference")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-risk-reference")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".audit-ai-risk-gates")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-risk-gate")).toContain("grid-template-columns: minmax(120px, 0.7fr) minmax(0, 1fr) auto;");
  });

  test("compares current AI review evidence with the latest saved audit record", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function AgentEvidenceBoard");

    expect(appSource).toContain("function AiReviewAuditComparison");
    expect(auditWorkspaceSource).toContain("currentRunId={workspace.researchRun?.runId ?? null}");
    expect(auditWorkspaceSource).toContain('currentStrategyRevision={workspace.researchRun?.strategyRevision ?? "draft"}');
    expect(auditWorkspaceSource).toContain("liveExecutionBlocked={!workspace.execution.liveEnabled}");
    expect(auditWorkspaceSource).toContain("roundCount={agentCommitteeRounds.length}");
    expect(auditPanelSource).toContain("const latestRecord = records[0] ?? null;");
    expect(auditPanelSource).toContain("<AiReviewAuditComparison");
    expect(auditPanelSource).toContain("const selectedRecord = records.find((record) => record.aiReviewId === selectedRecordId) ?? latestRecord;");
    expect(auditPanelSource).toContain("latestRecord={selectedRecord}");
    expect(auditPanelSource).toContain("currentCitationCount={dossier.citations.length}");
    expect(auditPanelSource).toContain("currentStatus={dossier.status}");
    expect(auditPanelSource).toContain("roundCount={roundCount}");
    expect(cssBlock(".audit-ai-comparison")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".audit-ai-comparison-grid")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-comparison-row")).toContain(
      "grid-template-columns: minmax(96px, 0.58fr) minmax(0, 1fr) minmax(0, 1fr);"
    );
  });

  test("summarizes drift across saved AI review records in the audit trail", () => {
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function AgentEvidenceBoard");

    expect(appSource).toContain("buildAiReviewRecordDriftRows");
    expect(appSource).toContain("function AiReviewRecordDriftSummary");
    expect(auditPanelSource).toContain("const driftRows = buildAiReviewRecordDriftRows");
    expect(auditPanelSource).toContain("<AiReviewRecordDriftSummary");
    expect(auditPanelSource).toContain("rows={filteredDriftRows}");
    expect(cssBlock(".audit-ai-drift-summary")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".audit-ai-drift-list")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-drift-row")).toContain(
      "grid-template-columns: minmax(130px, 0.75fr) minmax(0, 1fr) auto;"
    );
    expect(hasCssDeclaration(".audit-ai-drift-row", "grid-template-columns: 1fr;")).toBe(true);
  });

  test("filters saved AI review drift rows from the audit trail", () => {
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function AgentEvidenceBoard");
    const driftSummarySource = sourceBetween("function AiReviewRecordDriftSummary", "function AiReviewAuditTrailPanel");

    expect(appSource).toContain("filterAiReviewRecordDriftRows");
    expect(auditPanelSource).toContain('const [driftQuery, setDriftQuery] = useState("");');
    expect(auditPanelSource).toContain("const filteredDriftRows = filterAiReviewRecordDriftRows(driftRows, driftQuery);");
    expect(auditPanelSource).toContain("onQueryChange={setDriftQuery}");
    expect(auditPanelSource).toContain("query={driftQuery}");
    expect(auditPanelSource).toContain("totalRows={driftRows.length}");
    expect(driftSummarySource).toContain('type="search"');
    expect(driftSummarySource).toContain('className="audit-ai-drift-search"');
    expect(driftSummarySource).toContain("rows.length !== totalRows");
    expect(cssBlock(".audit-ai-drift-toolbar")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-drift-search")).toContain("min-width: 0;");
  });

  test("applies the AI review audit search to saved record history", () => {
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function AgentEvidenceBoard");
    const recordHistorySource = sourceBetween("function AiReviewRunRecordHistory", "function AiReviewAuditComparison");

    expect(auditPanelSource).toContain("const filteredRecordIds = new Set(filteredDriftRows.map((row) => row.aiReviewId));");
    expect(auditPanelSource).toContain("const filteredRecords = records.filter((record) => filteredRecordIds.has(record.aiReviewId));");
    expect(auditPanelSource).toContain("records={filteredRecords}");
    expect(auditPanelSource).toContain("totalRecords={records.length}");
    expect(auditPanelSource).toContain("query={driftQuery}");
    expect(recordHistorySource).toContain("totalRecords");
    expect(recordHistorySource).toContain("records.length !== totalRecords");
    expect(recordHistorySource).toContain("No matching records");
  });

  test("lets the audit workspace compare against a selected AI review record", () => {
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function AgentEvidenceBoard");
    const recordHistorySource = sourceBetween("function AiReviewRunRecordHistory", "function AiReviewAuditComparison");
    const comparisonSource = sourceBetween("function AiReviewAuditComparison", "function AiReviewRecordDriftSummary");

    expect(auditPanelSource).toContain('const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);');
    expect(auditPanelSource).toContain("const selectedRecord = records.find((record) => record.aiReviewId === selectedRecordId) ?? latestRecord;");
    expect(auditPanelSource).toContain("latestRecord={selectedRecord}");
    expect(auditPanelSource).toContain("onSelectRecord={setSelectedRecordId}");
    expect(auditPanelSource).toContain("selectedRecordId={selectedRecord?.aiReviewId ?? null}");
    expect(recordHistorySource).toContain("onSelectRecord");
    expect(recordHistorySource).toContain("selectedRecordId");
    expect(recordHistorySource).toContain("button");
    expect(recordHistorySource).toContain("isSelectable && item.aiReviewId === selectedRecordId");
    expect(recordHistorySource).toContain("onClick={isSelectable ? () => onSelectRecord?.(item.aiReviewId) : undefined}");
    expect(comparisonSource).toContain("selectedRecordLabel");
    expect(comparisonSource).toContain("Selected saved");
    expect(cssBlock("button.ai-review-record")).toContain("cursor: pointer;");
    expect(cssBlock(".ai-review-record.selected")).toContain("border-color: rgba(76, 201, 173, 0.72);");
  });

  test("passes explicit count and query props to every AI review record history", () => {
    const recordHistoryUsages = appSource.match(/<AiReviewRunRecordHistory[\s\S]*?\/>/g) ?? [];

    expect(recordHistoryUsages).toHaveLength(2);
    recordHistoryUsages.forEach((usage) => {
      expect(usage).toContain("query=");
      expect(usage).toContain("records=");
      expect(usage).toContain("totalRecords=");
    });
  });

  test("keeps saved AI review records read-only outside the audit selector", () => {
    const agentPanelSource = sourceBetween("const renderAgentPanel", "const renderWorkflowNodesPanel");
    const recordHistorySource = sourceBetween("function AiReviewRunRecordHistory", "function AiReviewAuditComparison");

    expect(agentPanelSource).not.toContain("onSelectRecord={() => undefined}");
    expect(recordHistorySource).toContain("const isSelectable = Boolean(onSelectRecord);");
    expect(recordHistorySource).toContain("const RecordTag = isSelectable ? \"button\" : \"article\";");
    expect(recordHistorySource).toContain("onClick={isSelectable ? () => onSelectRecord?.(item.aiReviewId) : undefined}");
    expect(cssBlock(".ai-review-record")).toContain("cursor: default;");
    expect(cssBlock("button.ai-review-record")).toContain("cursor: pointer;");
  });

  test("keeps workflow pages explicit and avoids passive all-in-one watchlist layout", () => {
    expect(appSource).toContain('"chart-panel workflow-chart-panel"');
    expect(appSource).toContain('"strategy-panel workflow-strategy-panel"');
    expect(appSource).toContain('activeLoopStepId === "agent-review"');
    expect(appSource).toContain('runAiWorkbenchAction("debate")');
    expect(appSource).toContain('setActiveLoopStepId(action === "strategy-draft" ? "strategy" : "agent-review")');
    expect(appSource).toContain('renderWorkflowNodesPanel("workflow-nodes-panel")');
    expect(appSource).toContain("buildWorkflowStages(workspace, workflowRunState)");
    expect(appSource).toContain('className="workflow-backtest-panel"');
    expect(appSource).toContain('executionClassName="workflow-execution-panel"');
    expect(appSource).toContain('"workflow-agent-panel"');
    expect(appSource).toContain('className="workflow-decision-panel"');
    expect(appSource).toContain('className="workflow-history-panel"');
    expect(cssBlock(".terminal-panel")).toContain("grid-template-rows: auto auto;");
    expect(cssBlock(".terminal-panel")).toContain("min-height: auto;");
    expect(cssBlock(".terminal-panel")).not.toContain("min-height: 0;");
    expect(cssBlock(".workflow-layout")).toContain("grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);");
    expect(cssBlock(".strategy-layout")).toContain("grid-template-areas:");
    expect(
      hasCssBlockWith(".strategy-layout", [
        '"chart strategy"',
        '"workflow strategy"',
        '"ai strategy"',
        '"decision strategy"'
      ])
    ).toBe(true);
    expect(hasCssBlockWith(".research-layout", ['"chart scanner"', '"chart note"', '"decision workflow"'])).toBe(true);
    expect(hasCssBlockWith(".backtest-layout", ['"backtest workflow"', '"history history"', '"ai ai"'])).toBe(true);
    expect(hasCssBlockWith(".agent-review-layout", ['"ai workflow"', '"decision history"'])).toBe(true);
    expect(cssBlock(".paper-layout")).toContain(
      "grid-template-columns: minmax(720px, 1.15fr) minmax(380px, 0.65fr) minmax(320px, 0.45fr);"
    );
    expect(hasCssBlockWith(".paper-layout", ['"execution portfolio broker"'])).toBe(true);
    expect(cssBlock(".workflow-backtest-panel")).toContain("grid-area: backtest;");
    expect(cssBlock(".workflow-nodes-panel")).toContain("grid-area: workflow;");
    expect(cssBlock(".workflow-agent-panel")).toContain("grid-area: ai;");
    expect(cssBlock(".workflow-scanner-panel .scanner-head")).toContain("display: none;");
    expect(cssBlock(".workflow-scanner-panel .scanner-row")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(cssBlock(".workflow-broker-panel .broker-adapter-head")).toContain("display: none;");
    expect(cssBlock(".workflow-broker-panel .broker-adapter-row")).toContain(
      "grid-template-columns: minmax(0, 1fr) auto;"
    );
    expect(cssBlock(".workflow-portfolio-panel .paper-position-row")).toContain(
      "grid-template-columns: minmax(72px, 0.9fr) minmax(46px, 0.48fr) minmax(48px, 0.5fr) minmax(58px, 0.58fr) minmax(48px, 0.5fr);"
    );
    expect(cssBlock(".workflow-portfolio-panel .paper-position-row span:nth-child(3),\n.workflow-portfolio-panel .paper-position-row span:nth-child(5),\n.workflow-portfolio-panel .paper-position-row span:nth-child(6)")).toContain(
      "display: none;"
    );
    expect(cssBlock(".workflow-decision-panel")).toContain("grid-area: decision;");
    expect(cssBlock(".workflow-history-panel")).toContain("grid-area: history;");
    expect(cssBlock(".center-grid")).toContain("align-content: start;");
    expect(cssBlock(".workflow-execution-panel")).toContain("grid-area: execution;");
    expect(cssBlock(".chart-panel")).not.toContain("min-height: clamp(520px, 56vh, 720px);");
    expect(cssBlock(".chart-panel")).toContain("min-height: clamp(400px, 44vh, 560px);");
    expect(cssBlock(".chart-panel")).toContain("grid-area: chart;");
    expect(cssBlock(".chart-panel")).toContain("grid-template-rows: auto minmax(0, 1fr);");
    expect(cssBlock(".research-layout .workflow-chart-panel")).toContain("align-self: stretch;");
    expect(cssBlock(".strategy-panel")).not.toContain("min-height: clamp(520px, 56vh, 720px);");
    expect(cssBlock(".strategy-panel")).toContain("align-self: start;");
    expect(cssBlock(".strategy-panel")).toContain("grid-area: strategy;");
    expect(cssBlock(".strategy-panel")).toContain("grid-template-rows: auto auto;");
    expect(cssBlock(".strategy-panel")).not.toContain("overflow: hidden;");
    expect(cssBlock(".strategy-panel .strategy-workbench")).not.toContain("overflow: auto;");
    expect(cssBlock(".strategy-panel .strategy-rule-row")).toContain("grid-template-columns:");
    expect(cssBlock(".strategy-panel .strategy-rule-row")).toContain("minmax(0, 1.2fr)");
    expect(cssBlock(".module-workspace-grid")).toContain("grid-template-rows: minmax(0, 1fr);");
    expect(cssBlock(".workflow-nodes-panel")).toContain("align-self: start;");
    expect(cssBlock(".workflow-decision-panel")).toContain("align-self: start;");
    expect(hasCssDeclaration(".watchlist-ai-panel .agent-rounds", "grid-template-columns: repeat(2, minmax(0, 1fr));")).toBe(
      true
    );
    expect(cssBlock(".watchlist-ai-panel .agent-rounds-title")).toContain("grid-column: 1 / -1;");
  });

  test("renders distinct product work-area compositions", () => {
    expect(appSource).toContain("renderActiveProductWorkspace()");
    expect(appSource).toContain('activeWorkAreaId === "market"');
    expect(appSource).toContain('activeWorkAreaId === "settings"');
    expect(appSource).toContain("MarketDataHealthPanel");
    expect(appSource).toContain("PlatformSettingsPanel");
    expect(cssBlock(".product-workspace-layout")).toContain("display: grid;");
  });

  test("lets the market work area refresh the selected cache context", () => {
    const marketWorkspaceSource = sourceBetween('if (activeWorkAreaId === "market")', 'if (activeWorkAreaId === "strategy")');
    const healthPanelSource = sourceBetween("function MarketDataHealthPanel", "function ResearchNotesPanel");

    expect(appSource).toContain("refreshSelectedMarketCache");
    expect(marketWorkspaceSource).toContain("activeCacheContext");
    expect(marketWorkspaceSource).toContain("onRefreshCache={refreshSelectedMarketCache}");
    expect(healthPanelSource).toContain("market-cache-refresh");
    expect(healthPanelSource).toContain("刷新当前缓存");
    expect(cssBlock(".market-cache-refresh")).toContain("display: inline-flex;");
  });

  test("lets the market work area refresh watchlist cache as a batch", () => {
    const marketWorkspaceSource = sourceBetween('if (activeWorkAreaId === "market")', 'if (activeWorkAreaId === "strategy")');
    const healthPanelSource = sourceBetween("function MarketDataHealthPanel", "function ResearchNotesPanel");

    expect(appSource).toContain("refreshWatchlistMarketCache");
    expect(appSource).toContain("watchlistCacheSummary");
    expect(marketWorkspaceSource).toContain("onRefreshWatchlistCache={refreshWatchlistMarketCache}");
    expect(healthPanelSource).toContain("market-cache-bulk-refresh");
    expect(healthPanelSource).toContain("刷新自选缓存");
    expect(cssBlock(".market-cache-actions")).toContain("display: flex;");
    expect(cssBlock(".market-cache-bulk-refresh")).toContain("display: inline-flex;");
  });

  test("renders the strategy lab as a structured rule builder", () => {
    expect(appSource).toContain("buildStrategyRuleDraft(workspace)");
    expect(appSource).toContain("buildStrategyReadinessGates(workspace)");
    expect(appSource).toContain("validateStrategySnapshot");
    expect(appSource).toContain("workspaceWithStrategyRuleDraftField");
    expect(appSource).toContain("buildStrategyTemplateOptions");
    expect(appSource).toContain("workspaceWithStrategyTemplate");
    expect(appSource).toContain("StrategyTemplatePicker");
    expect(appSource).toContain("StrategyConditionField");
    expect(appSource).toContain("StrategyVolumeConfirmField");
    expect(appSource).toContain("StrategyRsiConfirmField");
    expect(appSource).toContain('field="entryKind"');
    expect(appSource).toContain('field="exitKind"');
    expect(appSource).toContain('field="entryRsiConfirm"');
    expect(appSource).toContain('field="entryVolumeConfirm"');
    expect(appSource).toContain('thresholdField="entryRsiThreshold"');
    expect(appSource).toContain('windowField="entryRsiWindow"');
    expect(appSource).toContain('windowField="entryVolumeWindow"');
    expect(appSource).toContain('thresholdField="entryThreshold"');
    expect(appSource).toContain('thresholdField="exitThreshold"');
    expect(appSource).toContain('windowField="entryWindow"');
    expect(appSource).toContain('windowField="exitWindow"');
    expect(appSource).toContain("strategy-draft-grid");
    expect(appSource).toContain("strategy-template-grid");
    expect(appSource).toContain("strategy-condition-select");
    expect(appSource).toContain("strategy-volume-toggle");
    expect(appSource).toContain("strategy-rsi-toggle");
    expect(appSource).toContain("strategy-generated-snapshot");
    expect(appSource).toContain("readinessGates={strategyReadinessGates}");
    expect(appSource).toContain("validationSource={strategyValidationState.source}");
    expect(appSource).toContain('className="strategy-readiness-list"');
    expect(appSource).toContain('className="strategy-validation-source"');
    expect(styles).toContain(".strategy-draft-grid");
    expect(styles).toContain(".strategy-template-grid");
    expect(styles).toContain(".strategy-template-card");
    expect(styles).toContain(".strategy-condition-select");
    expect(styles).toContain(".strategy-threshold-field");
    expect(styles).toContain(".strategy-volume-toggle");
    expect(styles).toContain(".strategy-rsi-toggle");
    expect(styles).toContain(".strategy-generated-snapshot");
    expect(styles).toContain(".strategy-readiness-gate");
    expect(styles).toContain(".strategy-validation-source");
  });

  test("preflights strategy readiness before launching the research pipeline", () => {
    const runPipelineSource = sourceBetween("const runPipeline = useCallback", "const replayRun = useCallback");

    expect(runPipelineSource).toContain("validateStrategySnapshot(quantCoreBaseUrl");
    expect(runPipelineSource).toContain('preflight.validation?.status === "blocked"');
    expect(runPipelineSource).toContain('setActiveWorkAreaId("strategy")');
    expect(runPipelineSource).toContain("setStrategyValidationState(preflight)");
    expect(runPipelineSource).toContain("Strategy preflight blocked");
  });

  test("preflights strategy readiness before saving a strategy version", () => {
    const saveStrategySource = sourceBetween("const saveCurrentStrategyVersion = useCallback", "const saveCurrentResearchNote");

    expect(saveStrategySource).toContain("validateStrategySnapshot(quantCoreBaseUrl");
    expect(saveStrategySource).toContain('preflight.validation?.status === "blocked"');
    expect(saveStrategySource).toContain("setStrategyValidationState(preflight)");
    expect(saveStrategySource).toContain("Strategy version blocked by readiness gates");
    expect(saveStrategySource).toContain("saveStrategySnapshot(quantCoreBaseUrl");
  });

  test("renders strategy library save and reload controls", () => {
    const runPipelineSource = sourceBetween("const runPipeline = useCallback", "const replayRun = useCallback");

    expect(appSource).toContain("loadStrategyLibrary");
    expect(appSource).toContain("saveStrategySnapshot");
    expect(appSource).toContain("buildStrategyVersionDiffRows");
    expect(appSource).toContain("saveCurrentStrategyVersion");
    expect(appSource).toContain("loadSavedStrategyVersion");
    expect(appSource).toContain("workspaceWithStrategyLibraryItem");
    expect(appSource).toContain('i18n.t("strategy.context")');
    expect(appSource).toContain('i18n.t("strategy.auditRun")');
    expect(appSource).toContain('i18n.t("strategy.diff")');
    expect(appSource).toContain('className="strategy-library-diff"');
    expect(appSource).toContain('i18n.t("strategy.loadedVersion")');
    expect(runPipelineSource).toContain("await refreshStrategyLibrary();");
    expect(appSource).toContain('className="strategy-library-list"');
    expect(appSource).toContain('className="strategy-library-actions"');
    expect(styles).toContain(".strategy-library-list");
    expect(styles).toContain(".strategy-library-card");
    expect(styles).toContain(".strategy-library-card small");
    expect(styles).toContain(".strategy-diff-chip.warning");
  });

  test("renders a persistent research note panel for the selected context", () => {
    expect(appSource).toContain("loadResearchNote");
    expect(appSource).toContain("saveResearchNote");
    expect(appSource).toContain("ResearchNotesPanel");
    expect(appSource).toContain('className="workflow-note-panel"');
    expect(appSource).toContain('className="research-note-editor"');
    expect(styles).toContain(".workflow-note-panel");
    expect(styles).toContain(".research-note-editor");
    expect(styles).toContain(".research-note-meta");
  });

  test("renders the backtest lab as an auditable evidence report", () => {
    expect(appSource).toContain("buildBacktestReport(workspace)");
    expect(appSource).toContain("buildBacktestParameterScanRows(workspace)");
    expect(appSource).toContain("workspaceWithBacktestParameterCandidate");
    expect(appSource).toContain("buildBacktestReportMarkdown(workspace)");
    expect(appSource).toContain("<BacktestReportPanel");
    expect(appSource).toContain("onExportMarkdown={exportBacktestReportMarkdown}");
    expect(appSource).toContain('className="backtest-report"');
    expect(appSource).toContain('className="report-export-button"');
    expect(appSource).toContain('className="backtest-report-hero"');
    expect(appSource).toContain('className="backtest-benchmark-strip"');
    expect(appSource).toContain('className="backtest-report-grid"');
    expect(appSource).toContain('className="backtest-report-section"');
    expect(appSource).toContain('className="backtest-report-section parameter-scan-section"');
    expect(appSource).toContain('className="parameter-scan-table"');
    expect(appSource).toContain('i18n.t("backtest.stageCandidate")');
    expect(appSource).toContain("buildBacktestEvidenceCards(workspace)");
    expect(appSource).toContain("buildBacktestReadinessGates(workspace)");
    expect(appSource).toContain("evidenceCards={backtestEvidenceCards}");
    expect(appSource).toContain("readinessGates={backtestReadinessGates}");
    expect(appSource).toContain('className="backtest-evidence-grid"');
    expect(appSource).toContain('className="backtest-readiness-list"');
    expect(appSource).toContain('className="backtest-diagnostic-strip"');
    expect(styles).toContain(".backtest-evidence-grid");
    expect(styles).toContain(".backtest-readiness-list");
    expect(styles).toContain(".backtest-diagnostic-strip");
    expect(styles).toContain(".backtest-report");
    expect(styles).toContain(".backtest-report-hero");
    expect(styles).toContain(".backtest-benchmark-strip");
    expect(styles).toContain(".backtest-report-grid");
    expect(styles).toContain(".parameter-scan-table");
    expect(styles).toContain(".parameter-scan-row");
    expect(styles).toContain(".parameter-scan-row button");
    expect(styles).toContain(".report-export-button");
  });

  test("collapses the terminal and workflow grid before cards become squeezed", () => {
    expect(styles).toContain("@media (max-width: 1180px)");
    expect(
      hasCssBlockWith("@media (max-width: 1180px) {\n  .terminal-shell", [
        "grid-template-columns: 68px minmax(0, 1fr);",
        "height: auto;"
      ])
    ).toBe(true);
    expect(hasCssBlockWith("  .left-rail", ["position: sticky;", "height: 100vh;"])).toBe(true);
    expect(hasCssBlockWith("  .loop-step", ["min-height: 50px;", "padding: 7px 5px;"])).toBe(true);
    expect(
      hasCssBlockWith(
        "  .loop-step-copy,\n  .work-area-copy,\n  .work-area-status,\n  .workflow-next-action,\n  .left-rail .workspace-card",
        ["display: none;"]
      )
    ).toBe(true);
    expect(hasCssBlockWith("  .terminal-topbar", ["min-height: auto;", "padding: 8px 10px;"])).toBe(true);
    expect(hasCssDeclaration("  .center-grid,\n  .workflow-layout", "grid-template-columns: 1fr;")).toBe(true);
  });

  test("keeps AI review inside workflow pages instead of a separate global strip", () => {
    expect(appSource).not.toContain("<AssistantCommandStrip");
    expect(appSource).not.toContain("function AssistantCommandStrip");
    expect(appSource).not.toContain("function NewsWorkspace");
    expect(appSource).not.toContain("function WorkflowWorkspace");
    expect(appSource).toContain("const renderAgentPanel");
    expect(appSource).toContain('className="agent-panel-body"');
    expect(appSource).toContain('className="workflow-decision-panel"');
    expect(appSource).toContain('className="workflow-history-panel"');
    expect(appSource).toContain('className="history-panel-body"');
    expect(cssBlock(".workflow-agent-panel")).toContain("grid-area: ai;");
    expect(cssBlock(".agent-panel-body")).not.toContain("overflow: auto;");
    expect(cssBlock(".decision-panel")).not.toContain("max-height:");
    expect(cssBlock(".decision-log")).not.toContain("overflow: auto;");
    expect(cssBlock(".history-panel")).not.toContain("height: clamp(");
    expect(cssBlock(".history-panel")).not.toContain("overflow: hidden;");
    expect(cssBlock(".history-panel-body")).not.toContain("overflow: auto;");
  });

  test("renders AI review as an evidence-locked dossier", () => {
    expect(appSource).toContain("buildAiReviewDossier(workspace)");
    expect(appSource).toContain("buildAiReviewReportMarkdown(workspace)");
    expect(appSource).toContain("exportAiReviewMarkdown");
    expect(appSource).toContain('i18n.t("aiReview.exportMarkdown")');
    expect(appSource).toContain("<AiReviewDossierBoard");
    expect(appSource).toContain('"benchmark": "基准 Alpha"');
    expect(appSource).toContain('className="ai-dossier"');
    expect(appSource).toContain('className="ai-dossier-grid"');
    expect(appSource).toContain('className={`ai-dossier-card');
    expect(styles).toContain(".ai-dossier");
    expect(styles).toContain(".ai-dossier-grid");
    expect(styles).toContain(".ai-dossier-card");
  });

  test("renders execution approval as a shared risk gate before paper orders", () => {
    expect(appSource).toContain("buildRiskApprovalSummary(workspace)");
    expect(appSource).toContain("<RiskApprovalBoard");
    expect(appSource).toContain("approval={riskApprovalSummary}");
    expect(appSource).toContain('className={`risk-approval');
    expect(appSource).toContain('className="risk-approval-grid"');
    expect(appSource).toContain('className={`risk-approval-gate');
    expect(styles).toContain(".risk-approval");
    expect(styles).toContain(".risk-approval-grid");
    expect(styles).toContain(".risk-approval-gate");
  });

  test("renders paper execution account summaries from persisted execution records", () => {
    expect(appSource).toContain("buildPaperExecutionSummaryTiles(workspace, activePaperExecutionRecord)");
    expect(appSource).toContain("buildPaperPositionRows(workspace, activePaperExecutionRecord)");
    expect(appSource).toContain("summaryTiles={paperExecutionSummaryTiles}");
    expect(appSource).toContain("paperExecutionTileValue");
    expect(appSource).not.toContain('value={i18n.t("execution.paperAccount")}');
    expect(cssBlock(".execution-tile p")).toContain("overflow-wrap: anywhere;");
    expect(cssBlock(".execution-tile.positive")).toContain("border-left-color: #4cc9ad;");
    expect(cssBlock(".execution-tile.warning")).toContain("border-left-color: #e8be62;");
  });

  test("renders execution promotion readiness as a separate queue after paper execution", () => {
    expect(appSource).toContain("buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows)");
    expect(appSource).toContain("loadResearchRunPromotion(quantCoreBaseUrl");
    expect(appSource).toContain("setPromotionCandidateRecord(result.promotion ?? null)");
    expect(appSource).toContain("activePromotionCandidateRecord ?? buildPromotionReadiness");
    expect(appSource).toContain("<PromotionQueuePanel");
    expect(appSource).toContain("readiness={promotionReadiness}");
    expect(appSource).toContain('className="promotion-stage-list"');
    expect(appSource).toContain('className={`promotion-stage');
    expect(styles).toContain(".promotion-queue");
    expect(styles).toContain(".promotion-stage-list");
    expect(styles).toContain(".promotion-stage");
    expect(cssBlock(".workflow-promotion-panel")).toContain("grid-area: promotion;");
    expect(hasCssBlockWith(".execution-layout", ['"execution broker"', '"promotion broker"'])).toBe(true);
  });

  test("renders platform settings from local-core status when available", () => {
    expect(appSource).toContain("loadPlatformSettings(quantCoreBaseUrl)");
    expect(appSource).toContain("settingsStatus.settings");
    expect(appSource).toContain("settings={settingsStatus.settings}");
    expect(appSource).toContain("settings?.dataSources");
    expect(appSource).toContain("settings?.executionAdapters");
    expect(appSource).toContain('className="settings-source-list"');
    expect(appSource).toContain('className={`settings-source-row');
    expect(styles).toContain(".settings-source-list");
    expect(styles).toContain(".settings-source-row");
  });

  test("keeps history replay and export as separate compact row actions", () => {
    expect(appSource).toContain("onExport={onExport}");
    expect(appSource).toContain('className="history-row-actions"');
    expect(appSource).toContain('i18n.t("history.export")');
    expect(cssBlock(".history-row")).toContain("cursor: default;");
    expect(cssBlock(".history-row-actions")).toContain("display: flex;");
    expect(cssBlock(".history-row-actions button")).toContain("min-height: 28px;");
  });

  test("keeps research run import as a compact history panel action", () => {
    expect(appSource).toContain('i18n.t("history.import")');
    expect(appSource).toContain('className="history-import-input"');
    expect(appSource).toContain('type="file"');
    expect(cssBlock(".history-panel-actions")).toContain("display: flex;");
    expect(cssBlock(".history-import-button")).toContain("min-height: 30px;");
    expect(cssBlock(".history-import-input")).toContain("display: none;");
  });
});
