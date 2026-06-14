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
    expect(leftRailSource).toContain("i18n.productWorkAreaDeliveryStage");
    expect(leftRailSource).toContain("i18n.productDevelopmentStageStatus");
    expect(leftRailSource).not.toContain("workspace.quantLoop.map");
  });

  test("shows selected timeframe cache coverage in market search suggestions", () => {
    const symbolSwitcherSource = sourceBetween('<form className="symbol-switcher"', "</form>");

    expect(appSource).toContain("loadMarketSearch(quantCoreBaseUrl, { market: marketDraft, query, limit: 8, timeframe: workspace.selectedTimeframe })");
    expect(symbolSwitcherSource).toContain("suggestion.cache");
    expect(symbolSwitcherSource).toContain("marketSearchCacheSummary(i18n, suggestion.cache)");
    expect(styles).toContain(".symbol-suggestion-cache");
  });

  test("lets stale or empty market search suggestions refresh cache without nested buttons", () => {
    const symbolSwitcherSource = sourceBetween('<form className="symbol-switcher"', "</form>");

    expect(appSource).toContain("const refreshSearchSuggestionCache = useCallback(");
    expect(appSource).toContain("await refreshCacheContext({");
    expect(appSource).toContain("timeframe: workspace.selectedTimeframe");
    expect(symbolSwitcherSource).toContain('className="symbol-suggestion-row"');
    expect(symbolSwitcherSource).toContain('className="symbol-suggestion-select"');
    expect(symbolSwitcherSource).toContain("canRefreshSearchSuggestionCache(suggestion)");
    expect(symbolSwitcherSource).toContain("refreshSearchSuggestionCache(suggestion)");
    expect(symbolSwitcherSource).toContain('className="symbol-suggestion-refresh"');
    expect(styles).toContain(".symbol-suggestion-row");
    expect(styles).toContain(".symbol-suggestion-refresh");
  });

  test("uses the left rail for actionable product work areas instead of passive module switching", () => {
    const leftRailSource = sourceBetween('<aside className="left-rail">', "</aside>");

    expect(appSource).toContain("resolveInitialWorkAreaId");
    expect(appSource).toContain('url.searchParams.set("workspace", activeWorkAreaId)');
    expect(appSource).toContain('url.searchParams.delete("workflow")');
    expect(leftRailSource).toContain('className="work-area-index"');
    expect(leftRailSource).toContain('className="work-area-copy"');
    expect(leftRailSource).toContain('className="work-area-status"');
    expect(leftRailSource).toContain('className="work-area-stage"');
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
    expect(cssBlock(".work-area-stage")).toContain("display: flex;");
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

  test("renders P0 platform readiness as a compact product gap summary", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("buildP0PlatformReadinessSummary(goldenPath)");
    expect(appSource).toContain("p0PlatformReadinessSummary");
    expect(overviewSource).toContain('className={`p0-readiness-summary ${p0PlatformReadinessSummary.state}`}');
    expect(overviewSource).toContain("p0PlatformReadinessHeadline");
    expect(overviewSource).toContain("p0PlatformReadinessDetail");
    expect(overviewSource).toContain("p0PlatformReadinessLiveBoundary");
    expect(overviewSource).toContain('className="p0-readiness-meter"');
    expect(overviewSource).toContain('style={{ width: `${p0PlatformReadinessSummary.progressPct}%` }}');
    expect(cssBlock(".p0-readiness-summary")).toContain("display: grid;");
    expect(cssBlock(".p0-readiness-summary")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(cssBlock(".p0-readiness-meter")).toContain("height: 5px;");
    expect(cssBlock(".p0-readiness-meter span")).toContain("transition: width 0.2s ease;");
  });

  test("renders P0 readiness backlog items as actionable workspace shortcuts", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("buildP0PlatformBacklogItems(goldenPath)");
    expect(appSource).toContain("p0PlatformBacklogItems");
    expect(overviewSource).toContain('className="p0-readiness-backlog"');
    expect(overviewSource).toContain("p0PlatformBacklogItems.map");
    expect(overviewSource).toContain("p0PlatformBacklogPriorityLabel");
    expect(overviewSource).toContain("selectProductWorkArea");
    expect(overviewSource).toContain("targetWorkspaceId");
    expect(cssBlock(".p0-readiness-backlog")).toContain("display: grid;");
    expect(cssBlock(".p0-readiness-backlog-row")).toContain("grid-template-columns: auto minmax(0, 1fr) auto auto;");
    expect(cssBlock(".p0-readiness-backlog-open,\n.p0-readiness-backlog-action")).toContain("cursor: pointer;");
  });

  test("renders P0 readiness backlog rows with separate gated actions", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(overviewSource).toContain('className={`p0-readiness-backlog-row ${item.priority}`}');
    expect(overviewSource).toContain('className="p0-readiness-backlog-open"');
    expect(overviewSource).toContain("selectProductWorkArea(targetWorkspaceId)");
    expect(overviewSource).toContain("const isP0BacklogActionDisabled = !item.actionId || isGoldenPathActionDisabledById(item.actionId);");
    expect(overviewSource).toContain('className="p0-readiness-backlog-action"');
    expect(overviewSource).toContain("disabled={isP0BacklogActionDisabled}");
    expect(overviewSource).toContain("runGoldenPathActionById(item.actionId, item.targetWorkspaceId ?? item.workspaceId)");
    expect(cssBlock(".p0-readiness-backlog-row")).toContain("display: grid;");
    expect(cssBlock(".p0-readiness-backlog-row")).toContain("grid-template-columns: auto minmax(0, 1fr) auto auto;");
    expect(cssBlock(".p0-readiness-backlog-open,\n.p0-readiness-backlog-action")).toContain("cursor: pointer;");
    expect(cssBlock(".p0-readiness-backlog-action:disabled")).toContain("cursor: not-allowed;");
  });

  test("renders compact P0 backlog action hints for disabled or preflighted rows", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(overviewSource).toContain("const p0BacklogActionHint = p0PlatformBacklogActionHint(");
    expect(overviewSource).toContain("isP0BacklogActionDisabled");
    expect(overviewSource).toContain("researchPipelinePreflight");
    expect(overviewSource).toContain('className={`p0-readiness-backlog-hint ${researchPipelinePreflight.status}`}');
    expect(overviewSource).toContain("{p0BacklogActionHint}");
    expect(appSource).toContain("function p0PlatformBacklogActionHint(");
    expect(appSource).toContain("goldenPathActionPreflightHint(i18n, item.actionId, preflight)");
    expect(appSource).toContain('item.actionId === "submit-paper-order"');
    expect(cssBlock(".p0-readiness-backlog-hint")).toContain("grid-column: 2 / -1;");
    expect(cssBlock(".p0-readiness-backlog-hint")).toContain("color: #8fa0b2;");
  });

  test("renders the latest P0 action outcome beside the readiness backlog", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("buildP0PlatformActionOutcome({");
    expect(appSource).toContain("buildP0PlatformActionOutcomeEvidenceLink(p0PlatformActionOutcome)");
    expect(appSource).toContain("goldenPath");
    expect(appSource).toContain("paperExecution: paperExecutionRecord");
    expect(appSource).toContain("statusLabel");
    expect(appSource).toContain("const [copiedP0ActionOutcomeEvidenceId, setCopiedP0ActionOutcomeEvidenceId]");
    expect(overviewSource).toContain('className={`p0-action-outcome ${p0PlatformActionOutcome.tone}`}');
    expect(overviewSource).toContain("p0PlatformActionOutcomeLabel");
    expect(overviewSource).toContain("p0PlatformActionOutcomeDetail");
    expect(overviewSource).toContain("p0PlatformActionOutcomeNextStep");
    expect(overviewSource).toContain('className="p0-action-outcome-actions"');
    expect(overviewSource).toContain("copyP0ActionOutcomeEvidenceLink(p0PlatformActionOutcome)");
    expect(overviewSource).toContain("openP0ActionOutcomeEvidence(p0PlatformActionOutcome)");
    expect(cssBlock(".p0-action-outcome")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".p0-action-outcome")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
    expect(cssBlock(".p0-action-outcome-actions")).toContain("display: flex;");
    expect(cssBlock(".p0-action-outcome-actions")).toContain("gap: 4px;");
    expect(cssBlock(".p0-action-outcome button")).toContain("cursor: pointer;");
  });

  test("renders the P0 paper execution preflight inside the current task card", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("buildP0PaperExecutionPreflight({");
    expect(appSource).toContain("goldenPath");
    expect(appSource).toContain("paperExecution: activePaperExecutionRecord");
    expect(appSource).toContain("researchBinding: researchRunContextBinding");
    expect(appSource).toContain("riskApproval: riskApprovalSummary");
    expect(overviewSource).toContain('className={`p0-paper-preflight ${p0PaperExecutionPreflight.state}`}');
    expect(overviewSource).toContain("p0PaperExecutionPreflightHeadline");
    expect(overviewSource).toContain("p0PaperExecutionPreflightDetail");
    expect(overviewSource).toContain("p0PaperExecutionPreflight.primaryActionLabel");
    expect(overviewSource).toContain("p0PaperExecutionPreflight.primaryActionId");
    expect(overviewSource).toContain("runGoldenPathActionById(");
    expect(overviewSource).toContain("p0PaperExecutionPreflight.primaryActionTargetWorkspaceId");
    expect(overviewSource).toContain("selectProductWorkArea(p0PaperExecutionPreflight.primaryActionTargetWorkspaceId)");
    expect(overviewSource).toContain("p0PaperExecutionPreflight.gates.map");
    expect(overviewSource).toContain("p0PaperExecutionPreflightGateLabel");
    expect(overviewSource).toContain("p0PaperExecutionPreflightGateDetail");
    expect(cssBlock(".p0-paper-preflight")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".p0-paper-preflight")).toContain("display: grid;");
    expect(cssBlock(".p0-paper-preflight-action")).toContain("cursor: pointer;");
    expect(cssBlock(".p0-paper-preflight-action:disabled")).toContain("cursor: not-allowed;");
    expect(cssBlock(".p0-paper-preflight-gates")).toContain("display: grid;");
    expect(cssBlock(".p0-paper-preflight-gate")).toContain("border-left: 3px solid");
    expect(cssBlock(".p0-paper-preflight-gate.passed")).toContain("border-left-color: #4cc9ad;");
    expect(cssBlock(".p0-paper-preflight-gate.blocked")).toContain("border-left-color: #ff7f6d;");
  });

  test("renders copy and download actions for the P0 readiness report", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("buildP0PlatformReadinessReportMarkdown");
    expect(appSource).toContain("buildP0PlatformReadinessReportAuditEvent");
    expect(appSource).toContain("const [copiedP0ReadinessReport, setCopiedP0ReadinessReport]");
    expect(appSource).toContain("const [savingP0ReadinessReport, setSavingP0ReadinessReport]");
    expect(appSource).toContain("const p0PlatformReadinessReportMarkdown = useMemo(");
    expect(appSource).toContain("buildP0PlatformReadinessReportMarkdown({");
    expect(appSource).toContain("backlogItems: p0PlatformBacklogItems");
    expect(appSource).toContain("evidenceLink: p0ActionOutcomeEvidenceLink");
    expect(appSource).toContain("outcome: p0PlatformActionOutcome");
    expect(appSource).toContain("paperPreflight: p0PaperExecutionPreflight");
    expect(appSource).toContain("summary: p0PlatformReadinessSummary");
    expect(appSource).toContain("const copyP0ReadinessReport = useCallback(");
    expect(appSource).toContain("navigator.clipboard.writeText(p0PlatformReadinessReportMarkdown)");
    expect(appSource).toContain("setCopiedP0ReadinessReport(true)");
    expect(appSource).toContain("const downloadP0ReadinessReport = useCallback(");
    expect(appSource).toContain("new Blob([p0PlatformReadinessReportMarkdown], { type: \"text/markdown;charset=utf-8\" })");
    expect(appSource).toContain("p0-readiness-report.md");
    expect(appSource).toContain("const saveP0ReadinessReport = useCallback(");
    expect(appSource).toContain("await buildP0PlatformReadinessReportAuditEvent({");
    expect(appSource).toContain("paperPreflight: p0PaperExecutionPreflight");
    expect(appSource).toContain("await saveAuditEvent(quantCoreBaseUrl, auditEvent)");
    expect(appSource).toContain("setAuditEvidenceReportEvents((current) =>");
    expect(appSource).toContain("P0 readiness report saved to audit ledger");
    expect(overviewSource).toContain('className="p0-readiness-report-actions"');
    expect(overviewSource).toContain("copyP0ReadinessReport");
    expect(overviewSource).toContain("downloadP0ReadinessReport");
    expect(overviewSource).toContain("saveP0ReadinessReport");
    expect(overviewSource).toContain("savingP0ReadinessReport");
    expect(cssBlock(".p0-readiness-report-actions")).toContain("display: flex;");
    expect(cssBlock(".p0-readiness-report-actions")).toContain("gap: 4px;");
    expect(cssBlock(".p0-readiness-report-actions button")).toContain("cursor: pointer;");
  });

  test("echoes the latest saved P0 readiness report from the audit ledger", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("const auditEvidenceReportLedgerSummary = buildAuditEvidenceReportLedgerSummary(auditEvidenceReportLedgerRows);");
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidEventId");
    expect(overviewSource).toContain('className="p0-readiness-ledger-echo"');
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidShortHash");
    expect(overviewSource).toContain("auditEvidenceReportLedgerSummary.latestAuditAidReportQuery");
    expect(overviewSource).toContain("focusLatestP0ReadinessReport");
    expect(appSource).toContain("const focusLatestP0ReadinessReport = useCallback(");
    expect(appSource).toContain("setAuditEvidenceReportQuery(auditEvidenceReportLedgerSummary.latestAuditAidReportQuery)");
    expect(appSource).toContain('setActiveWorkAreaId("audit")');
    expect(cssBlock(".p0-readiness-ledger-echo")).toContain("display: grid;");
    expect(cssBlock(".p0-readiness-ledger-echo")).toContain("grid-template-columns: minmax(0, 1fr) auto;");
  });

  test("copies P0 action outcome evidence links without changing the evidence open path", () => {
    const copyHandlerSource = sourceBetween("const copyP0ActionOutcomeEvidenceLink = useCallback(", "const openP0ActionOutcomeEvidence = useCallback(");

    expect(copyHandlerSource).toContain("buildP0PlatformActionOutcomeEvidenceLink(outcome)");
    expect(copyHandlerSource).toContain("const url = new URL(window.location.href);");
    expect(copyHandlerSource).toContain("url.search = `?${link.search}`;");
    expect(copyHandlerSource).toContain("url.hash = \"\";");
    expect(copyHandlerSource).toContain("await navigator.clipboard.writeText(url.toString());");
    expect(copyHandlerSource).toContain("setCopiedP0ActionOutcomeEvidenceId(link.evidenceId);");
    expect(copyHandlerSource).toContain("setWorkspaceState((current) => ({");
  });

  test("opens P0 action outcomes by replaying audited run evidence before showing Audit", () => {
    const outcomeHandlerSource = sourceBetween("const openP0ActionOutcomeEvidence = useCallback(", "const runGoldenPathActionById = useCallback(");

    expect(outcomeHandlerSource).toContain('outcome.state === "audit_run"');
    expect(outcomeHandlerSource).toContain('outcome.state === "live_ready"');
    expect(outcomeHandlerSource).toContain("const evidenceId = outcome.evidenceId;");
    expect(outcomeHandlerSource).toContain("const historyRun = runHistory.find((run) => run.runId === evidenceId);");
    expect(outcomeHandlerSource).toContain("await replayRun(historyRun);");
    expect(outcomeHandlerSource).toContain("loadResearchRunDetail(quantCoreBaseUrl, evidenceId)");
    expect(outcomeHandlerSource).toContain("await replayRun(detail.run);");
    expect(outcomeHandlerSource).toContain("setResearchRunExportBrowserQuery(evidenceId);");
    expect(outcomeHandlerSource).toContain('setActiveWorkAreaId("execution");');
  });

  test("lets the Golden Path paper action rebind the latest audited run before submission", () => {
    const actionHandlerSource = sourceBetween("const runGoldenPathActionById = useCallback(", "const runGoldenPathAction = useCallback(");
    const disabledHandlerSource = sourceBetween("const isGoldenPathActionDisabledById = useCallback(", "const goldenPathActionId = goldenPath?.nextAction?.id;");

    expect(appSource).toContain("const ensureGoldenPathLatestRunBound = useCallback(");
    expect(appSource).toContain("goldenPath?.latestRunId");
    expect(appSource).toContain("loadResearchRunDetail(quantCoreBaseUrl, latestRunId)");
    expect(appSource).toContain("await replayRun(detail.run)");
    expect(actionHandlerSource).toContain('if (actionId === "submit-paper-order")');
    expect(actionHandlerSource).toContain("void (async () => {");
    expect(actionHandlerSource).toContain("const runWasAlreadyBound = researchRunContextBinding.canUseRun;");
    expect(actionHandlerSource).toContain("const runIsBound = await ensureGoldenPathLatestRunBound();");
    expect(actionHandlerSource).toContain("if (runWasAlreadyBound && runIsBound)");
    expect(disabledHandlerSource).toContain("const canRebindGoldenPathRun = Boolean(goldenPath?.latestRunId) && !researchRunContextBinding.canUseRun;");
    expect(disabledHandlerSource).toContain("return (");
    expect(disabledHandlerSource).toContain("isSubmittingPaperExecution ||");
    expect(disabledHandlerSource).toContain("(!canRebindGoldenPathRun &&");
    expect(disabledHandlerSource).toContain('riskApprovalSummary.status === "blocked"');
  });

  test("translates golden path cache readiness guidance for audited research", () => {
    expect(appSource).toContain("translateGoldenPathDetail");
    expect(appSource).toContain("fresh cached K-line rows are available for audited research");
    expect(appSource).toContain("cached rows are stale");
    expect(appSource).toContain("Refresh market data before audited research");
    expect(appSource).toContain("No cached K-line context exists for the selected instrument");
    expect(appSource).toContain("The selected context has no usable cached K-line rows");
    expect(appSource).toContain("no matching watchlist cache refresh evidence covers");
    expect(appSource).toContain("Matching watchlist cache refresh evidence");
    expect(appSource).toContain("可支撑审计研究");
    expect(appSource).toContain("先刷新行情数据后再运行审计研究");
    expect(appSource).toContain("当前标的还没有 K 线缓存上下文");
    expect(appSource).toContain("当前上下文没有可用 K 线缓存");
    expect(appSource).toContain("还没有匹配的自选刷新证据");
    expect(appSource).toContain("自选刷新证据");
  });

  test("renders the active work-area golden path context inside the task card", () => {
    const overviewSource = sourceBetween('<section className={`module-focus-card ${activeWorkflowAccent}`}>', "</section>");

    expect(appSource).toContain("buildGoldenPathWorkspaceContext(goldenPath, activeWorkAreaId)");
    expect(appSource).toContain("activeWorkspaceContext");
    expect(appSource).toContain("runWorkspaceContextAction");
    expect(appSource).toContain("runGoldenPathActionById");
    expect(appSource).toContain('if (actionId === "refresh-watchlist-cache")');
    expect(appSource).toContain("void refreshWatchlistMarketCache();");
    expect(appSource).toContain("isRefreshingWatchlistCache || Boolean(refreshingCacheKey)");
    expect(appSource).toContain("goldenPathActionPreflightHint");
    expect(overviewSource).toContain("goldenPathActionHint");
    expect(overviewSource).toContain('className={`golden-path-action-hint ${researchPipelinePreflight.status}`}');
    expect(overviewSource).toContain("workspaceContextActionHint");
    expect(overviewSource).toContain('className={`workspace-gate-preflight-hint ${researchPipelinePreflight.status}`}');
    expect(overviewSource).toContain('className={`workspace-gate-summary ${activeWorkspaceContext.status}`}');
    expect(overviewSource).toContain("goldenPathWorkspaceContextLabel");
    expect(overviewSource).toContain("goldenPathWorkspaceContextDetail");
    expect(overviewSource).toContain('className="workspace-gate-action"');
    expect(overviewSource).toContain("disabled={isWorkspaceContextActionDisabled}");
    expect(overviewSource).toContain("onClick={runWorkspaceContextAction}");
    expect(cssBlock(".workspace-gate-summary")).toContain("display: grid;");
    expect(cssBlock(".workspace-gate-summary")).toContain("grid-template-columns: auto minmax(0, 1fr) auto;");
    expect(cssBlock(".workspace-gate-action")).toContain("cursor: pointer;");
    expect(cssBlock(".golden-path-action-hint")).toContain("font-size: 0.76rem;");
    expect(cssBlock(".workspace-gate-preflight-hint")).toContain("grid-column: 1 / -1;");
  });

  test("renders a compact Stage 1 research context readiness checklist with calendar readiness", () => {
    const readinessBuilderSource = sourceBetween("const researchContextReadinessRows = buildResearchContextReadinessRows({", "});");

    expect(appSource).toContain("buildResearchContextReadinessRows");
    expect(appSource).toContain("function ResearchContextReadinessPanel");
    expect(appSource).toContain("<ResearchContextReadinessPanel");
    expect(readinessBuilderSource).toContain("marketCalendar: marketCalendarState.calendar");
    expect(appSource).toContain('className="research-context-checklist"');
    expect(appSource).toContain('className={`research-context-row ${row.tone}`}');
    expect(appSource).toContain("onRefreshCache={refreshSelectedMarketCache}");
    expect(appSource).toContain("onSaveNote={saveCurrentResearchNote}");
    expect(appSource).toContain('className="research-context-actions"');
    expect(appSource).toContain("researchContextReadinessActionLabel");
    expect(cssBlock(".research-context-checklist")).toContain("display: grid;");
    expect(cssBlock(".research-context-row")).toContain("grid-template-columns: auto minmax(0, 1fr) auto;");
    expect(cssBlock(".research-context-actions")).toContain("display: flex;");
  });

  test("renders a full golden path runbook board in the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');

    expect(appSource).toContain("function GoldenPathRunbookPanel");
    expect(appSource).toContain("isGoldenPathActionDisabledById");
    expect(auditWorkspaceSource).toContain("<GoldenPathRunbookPanel");
    expect(auditWorkspaceSource).toContain("runbook={goldenPath?.runbook ?? []}");
    expect(auditWorkspaceSource).toContain("preflight={researchPipelinePreflight}");
    expect(auditWorkspaceSource).toContain("onSelectWorkspace={selectProductWorkArea}");
    expect(auditWorkspaceSource).toContain("onRunAction={runGoldenPathActionById}");
    expect(auditWorkspaceSource).toContain("isActionDisabled={isGoldenPathActionDisabledById}");
    expect(appSource).toContain("const isRunbookActionDisabled = !canRunAction || isActionDisabled(item.actionId);");
    expect(appSource).toContain("const actionHint = goldenPathRunbookActionHint(");
    expect(appSource).toContain("isRunbookActionDisabled");
    expect(appSource).toContain("preflight");
    expect(appSource).toContain('className={`audit-runbook-action-hint ${actionHintTone}`}');
    expect(appSource).toContain("disabled={isRunbookActionDisabled}");
    expect(appSource).toContain("isGoldenPathActionDisabledById(goldenPathActionId)");
    expect(appSource).toContain("isGoldenPathActionDisabledById(workspaceContextActionId)");
    expect(cssBlock(".workflow-runbook-panel")).toContain("grid-area: runbook;");
    expect(cssBlock(".audit-runbook-panel")).toContain("align-self: start;");
    expect(cssBlock(".audit-runbook-list")).toContain("display: grid;");
    expect(cssBlock(".audit-runbook-row")).toContain("grid-template-columns: auto minmax(0, 1fr) auto auto;");
    expect(cssBlock(".audit-runbook-actions")).toContain("display: flex;");
    expect(cssBlock(".audit-runbook-action-hint")).toContain("grid-column: 2 / -1;");
    expect(cssBlock(".audit-runbook-action-hint")).toContain("color: #8fa0b2;");
    expect(appSource).toContain("function goldenPathRunbookActionHint(");
    expect(appSource).toContain("goldenPathActionPreflightHint(i18n, item.actionId, preflight)");
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

  test("renders an AI review audit timeline as approval references", () => {
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function aiReviewDriftStatusText");
    const timelineSource = sourceBetween("function AiReviewAuditTimelineBoard", "function AiReviewAuditTrailPanel");

    expect(appSource).toContain("buildAiReviewAuditTimelineItems");
    expect(appSource).toContain("function AiReviewAuditTimelineBoard");
    expect(auditPanelSource).toContain("const timelineItems = buildAiReviewAuditTimelineItems");
    expect(auditPanelSource).toContain("<AiReviewAuditTimelineBoard");
    expect(timelineSource).toContain("items.map");
    expect(timelineSource).toContain("item.reference");
    expect(timelineSource).toContain("item.exportAnchor");
    expect(timelineSource).toContain("audit-ai-timeline-anchor");
    expect(cssBlock(".audit-ai-timeline")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-timeline-row")).toContain(
      "grid-template-columns: minmax(118px, 0.45fr) minmax(0, 1fr) minmax(140px, 0.35fr) auto;"
    );
    expect(cssBlock(".audit-ai-timeline-anchor")).toContain("grid-column: 1 / -1;");
  });

  test("turns AI review audit timeline rows into workflow actions", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function aiReviewDriftStatusText");
    const timelineSource = sourceBetween("function AiReviewAuditTimelineBoard", "function AiReviewAuditTrailPanel");

    expect(auditWorkspaceSource).toContain("onSelectWorkspace={selectProductWorkArea}");
    expect(auditPanelSource).toContain("onSelectWorkspace");
    expect(auditPanelSource).toContain("onSelectRecord={setSelectedRecordId}");
    expect(timelineSource).toContain("function handleTimelineAction");
    expect(timelineSource).toContain("item.targetRecordId");
    expect(timelineSource).toContain("onSelectRecord(item.targetRecordId)");
    expect(timelineSource).toContain("item.targetWorkspaceId");
    expect(timelineSource).toContain("onSelectWorkspace(item.targetWorkspaceId)");
    expect(timelineSource).toContain("auditTimelineActionLabel");
    expect(cssBlock(".audit-ai-timeline-action")).toContain("cursor: pointer;");
  });

  test("renders an export evidence index in the AI review audit trail", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function aiReviewDriftStatusText");
    const evidenceIndexSource = sourceBetween("function AiReviewExportEvidenceIndexBoard", "function AiReviewAuditTrailPanel");

    expect(appSource).toContain("buildAiReviewExportEvidenceIndexRows");
    expect(appSource).toContain("filterAiReviewExportEvidenceIndexRows");
    expect(appSource).toContain("function AiReviewExportEvidenceIndexBoard");
    expect(auditWorkspaceSource).toContain("currentRecord={currentAiReviewRunRecord}");
    expect(auditPanelSource).toContain("const evidenceIndexRows = buildAiReviewExportEvidenceIndexRows");
    expect(auditPanelSource).toContain("const filteredEvidenceIndexRows = filterAiReviewExportEvidenceIndexRows");
    expect(auditPanelSource).toContain("<AiReviewExportEvidenceIndexBoard");
    expect(evidenceIndexSource).toContain("audit-ai-evidence-index-search");
    expect(evidenceIndexSource).toContain("rows.map");
    expect(evidenceIndexSource).toContain("row.anchor");
    expect(evidenceIndexSource).toContain("row.exportPath");
    expect(cssBlock(".audit-ai-evidence-index")).toContain("grid-column: 1 / -1;");
    expect(cssBlock(".audit-ai-evidence-index-toolbar")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-evidence-index-row")).toContain(
      "grid-template-columns: minmax(120px, 0.55fr) minmax(0, 1fr) minmax(180px, 0.7fr);"
    );
  });

  test("renders a research run export package preview in the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');

    expect(appSource).toContain("buildResearchRunExportPreviewRows");
    expect(appSource).toContain("filterResearchRunExportPreviewRows");
    expect(appSource).toContain("const researchRunExportPreviewRows = buildResearchRunExportPreviewRows");
    expect(appSource).toContain("function ResearchRunExportPreviewPanel");
    expect(auditWorkspaceSource).toContain("<ResearchRunExportPreviewPanel");
    expect(auditWorkspaceSource).toContain('className="workflow-export-preview-panel"');
    expect(auditWorkspaceSource).toContain("rows={researchRunExportPreviewRows}");
    expect(cssBlock(".workflow-export-preview-panel")).toContain("grid-area: export;");
    expect(cssBlock(".research-export-preview")).toContain("display: grid;");
    expect(cssBlock(".research-export-preview-toolbar")).toContain("display: grid;");
    expect(cssBlock(".research-export-preview-row")).toContain(
      "grid-template-columns: minmax(104px, 0.44fr) minmax(0, 1fr) minmax(76px, 0.28fr) minmax(126px, 0.46fr) auto;"
    );
    expect(hasCssBlockWith(".audit-layout", ['"runbook workflow"', '"history decision"', '"export export"', '"ai ai"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"runbook"', '"workflow"', '"history"', '"decision"', '"export"', '"ai"'])).toBe(true);
  });

  test("renders a research run export package browser in the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const exportBrowserPanelSource = sourceBetween("function ResearchRunExportPackageBrowserPanel", "function ResearchRunImportDiffPanel");
    const exportRunSource = sourceBetween("const exportRun = useCallback", "const inspectRunExportPackageByRunId");
    const runHistoryPanelSource = sourceBetween("function RunHistoryPanel", "function ExecutionPanel");
    const runHistoryRowSource = sourceBetween("function RunHistoryRow", "function RunComparisonBoard");

    expect(appSource).toContain("buildResearchRunExportBrowserRows");
    expect(appSource).toContain("buildAuditEvidenceReportMarkdown");
    expect(appSource).toContain("buildAuditEvidenceSummary");
    expect(appSource).toContain("buildResearchRunExportAuditReport");
    expect(appSource).toContain("buildAuditEvidenceReportAuditEvent");
    expect(appSource).toContain("withResearchRunExportAuditEvidenceArtifacts");
    expect(appSource).toContain("withResearchRunExportReportSignatures");
    expect(appSource).toContain("filterResearchRunExportBrowserRows");
    expect(appSource).toContain("const researchRunExportBrowserRows = buildResearchRunExportBrowserRows");
    expect(appSource).toContain("const auditEvidenceSummary = buildAuditEvidenceSummary");
    expect(appSource).toContain("importAuditEvents: researchRunImportAuditEvents");
    expect(appSource).toContain("const [copiedAuditEvidenceSummary, setCopiedAuditEvidenceSummary]");
    expect(appSource).toContain("const [copiedAuditEvidenceReport, setCopiedAuditEvidenceReport]");
    expect(appSource).toContain("const copyAuditEvidenceSummary = useCallback");
    expect(appSource).toContain("const copyAuditEvidenceReport = useCallback");
    expect(appSource).toContain("const persistAuditEvidenceReportEvent = useCallback");
    expect(appSource).toContain("const downloadAuditEvidenceReport = useCallback");
    expect(appSource).toContain("navigator.clipboard.writeText(auditEvidenceSummary.copyText)");
    expect(appSource).toContain("navigator.clipboard.writeText(buildAuditEvidenceReportMarkdown(auditEvidenceSummary))");
    expect(appSource).toContain("await buildResearchRunExportAuditReport(auditEvidenceSummary)");
    expect(appSource).toContain("saveAuditEvent(quantCoreBaseUrl, buildAuditEvidenceReportAuditEvent(auditReport, auditEvidenceSummary))");
    expect(appSource).toContain("type ImportAuditEvidenceDeepLinkStatus");
    expect(appSource).toContain("const [importAuditEvidenceDeepLinkStatus, setImportAuditEvidenceDeepLinkStatus]");
    expect(appSource).toContain('const [researchRunExportBrowserQuery, setResearchRunExportBrowserQuery] = useState(initialImportAuditEvidenceDeepLink?.focusQuery ?? "");');
    expect(appSource).toContain("function ResearchRunExportPackageBrowserPanel");
    expect(appSource).toContain("const inspectRunExportPackage = useCallback");
    expect(appSource).toContain("const loadImportAuditEvidenceDeepLink = useCallback");
    expect(exportRunSource).toContain("const exportPackage = await withResearchRunExportAuditEvidenceArtifacts");
    expect(exportRunSource).toContain('eventType: "audit_evidence_report,backtest_report"');
    expect(exportRunSource).toContain("const signedExportPackage");
    expect(exportRunSource).toContain("runHistory");
    expect(exportRunSource).toContain("persistAuditEvidenceReportEvent(exportPackage.auditReport);");
    expect(exportRunSource).toContain("JSON.stringify(signedExportPackage, null, 2)");
    expect(exportRunSource).toContain("[auditEvidenceSummary, persistAuditEvidenceReportEvent, quantCoreBaseUrl, runHistory]");
    expect(appSource).toContain('setImportAuditEvidenceDeepLinkStatus({ ...deepLink, status: "loading", error: null });');
    expect(appSource).toContain("const inspection = await inspectRunExportPackageByRunId(deepLink.runId);");
    expect(appSource).toContain('status: inspection.ok ? "loaded" : "failed"');
    expect(appSource).toContain("const retryImportAuditEvidenceDeepLink = useCallback");
    expect(auditWorkspaceSource).toContain("<ResearchRunExportPackageBrowserPanel");
    expect(auditWorkspaceSource).toContain('className="workflow-export-browser-panel"');
    expect(auditWorkspaceSource).toContain("deepLinkStatus={importAuditEvidenceDeepLinkStatus}");
    expect(auditWorkspaceSource).toContain("evidenceSummary={auditEvidenceSummary}");
    expect(auditWorkspaceSource).toContain("isEvidenceSummaryCopied={copiedAuditEvidenceSummary}");
    expect(auditWorkspaceSource).toContain("isEvidenceReportCopied={copiedAuditEvidenceReport}");
    expect(auditWorkspaceSource).toContain("onCopyEvidenceSummary={copyAuditEvidenceSummary}");
    expect(auditWorkspaceSource).toContain("onCopyEvidenceReport={copyAuditEvidenceReport}");
    expect(auditWorkspaceSource).toContain("onDownloadEvidenceReport={downloadAuditEvidenceReport}");
    expect(auditWorkspaceSource).toContain("onRetryDeepLink={retryImportAuditEvidenceDeepLink}");
    expect(auditWorkspaceSource).toContain("rows={researchRunExportBrowserRows}");
    expect(auditWorkspaceSource).toContain("isLoading={isInspectingExportPackage}");
    expect(auditWorkspaceSource).toContain("query={researchRunExportBrowserQuery}");
    expect(auditWorkspaceSource).toContain("onQueryChange={setResearchRunExportBrowserQuery}");
    expect(auditWorkspaceSource).toContain("onInspectExport={inspectRunExportPackage}");
    expect(exportBrowserPanelSource).toContain("query: string;");
    expect(exportBrowserPanelSource).toContain("evidenceSummary: AuditEvidenceSummary;");
    expect(exportBrowserPanelSource).toContain("isEvidenceSummaryCopied: boolean;");
    expect(exportBrowserPanelSource).toContain("isEvidenceReportCopied: boolean;");
    expect(exportBrowserPanelSource).toContain("onCopyEvidenceSummary: () => void;");
    expect(exportBrowserPanelSource).toContain("onCopyEvidenceReport: () => void;");
    expect(exportBrowserPanelSource).toContain("onDownloadEvidenceReport: () => void;");
    expect(exportBrowserPanelSource).toContain("deepLinkStatus?: ImportAuditEvidenceDeepLinkStatus | null;");
    expect(exportBrowserPanelSource).toContain("onRetryDeepLink?: () => void;");
    expect(exportBrowserPanelSource).toContain("research-audit-evidence-summary");
    expect(exportBrowserPanelSource).toContain("evidenceSummary.runId");
    expect(exportBrowserPanelSource).toContain("evidenceSummary.packageMatchedCount");
    expect(exportBrowserPanelSource).toContain("evidenceSummary.importDiffBlockedCount");
    expect(exportBrowserPanelSource).toContain("evidenceSummary.importVerificationVerifiedCount");
    expect(exportBrowserPanelSource).toContain("evidenceSummary.importVerificationInvalidCount");
    expect(exportBrowserPanelSource).toContain("onCopyEvidenceSummary");
    expect(exportBrowserPanelSource).toContain("onCopyEvidenceReport");
    expect(exportBrowserPanelSource).toContain("onDownloadEvidenceReport");
    expect(exportBrowserPanelSource).toContain("isEvidenceSummaryCopied");
    expect(exportBrowserPanelSource).toContain("isEvidenceReportCopied");
    expect(exportBrowserPanelSource).toContain("下载报告");
    expect(exportBrowserPanelSource).toContain("research-export-deep-link");
    expect(exportBrowserPanelSource).toContain("deepLinkStatus.status");
    expect(exportBrowserPanelSource).toContain("deepLinkStatus.runId");
    expect(exportBrowserPanelSource).toContain("deepLinkStatus.focusQuery");
    expect(exportBrowserPanelSource).toContain("onRetryDeepLink");
    expect(exportBrowserPanelSource).toContain("Retry");
    expect(exportBrowserPanelSource).toContain("onQueryChange: (query: string) => void;");
    expect(exportBrowserPanelSource).toContain("filterResearchRunExportBrowserRows(rows, query)");
    expect(exportBrowserPanelSource).toContain("onQueryChange(event.target.value)");
    expect(runHistoryPanelSource).toContain("onInspectExport");
    expect(runHistoryRowSource).toContain("onInspectExport(run)");
    expect(cssBlock(".workflow-export-browser-panel")).toContain("grid-area: package;");
    expect(cssBlock(".research-export-browser")).toContain("display: grid;");
    expect(cssBlock(".research-audit-evidence-summary")).toContain("display: grid;");
    expect(cssBlock(".research-audit-evidence-summary button")).toContain("display: inline-flex;");
    expect(cssBlock(".research-export-deep-link")).toContain("display: grid;");
    expect(cssBlock(".research-export-deep-link.failed")).toContain("border-left-color: #ff7f6d;");
    expect(cssBlock(".research-export-browser-row")).toContain(
      "grid-template-columns: minmax(116px, 0.5fr) minmax(0, 1fr) minmax(110px, 0.34fr) minmax(156px, 0.5fr) auto;"
    );
    expect(hasCssBlockWith(".audit-layout", ['"runbook workflow"', '"history decision"', '"export export"', '"package package"', '"ai ai"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"runbook"', '"history"', '"export"', '"workflow"', '"decision"', '"package"', '"ai"'])).toBe(true);
  });

  test("renders a recent export package index in the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');

    expect(appSource).toContain("buildResearchRunExportIndexRows");
    expect(appSource).toContain("filterResearchRunExportIndexRows");
    expect(appSource).toContain("const researchRunExportIndexRows = buildResearchRunExportIndexRows");
    expect(appSource).toContain("const indexRecentRunExportPackages = useCallback");
    expect(appSource).toContain("function ResearchRunExportIndexPanel");
    expect(auditWorkspaceSource).toContain("<ResearchRunExportIndexPanel");
    expect(auditWorkspaceSource).toContain('className="workflow-export-index-panel"');
    expect(auditWorkspaceSource).toContain("rows={researchRunExportIndexRows}");
    expect(auditWorkspaceSource).toContain("isLoading={isIndexingExportPackages}");
    expect(auditWorkspaceSource).toContain("onIndexPackages={indexRecentRunExportPackages}");
    expect(cssBlock(".workflow-export-index-panel")).toContain("grid-area: index;");
    expect(cssBlock(".research-export-index")).toContain("display: grid;");
    expect(cssBlock(".research-export-index-row")).toContain(
      "grid-template-columns: minmax(118px, 0.44fr) minmax(96px, 0.34fr) minmax(0, 1fr) minmax(146px, 0.48fr) minmax(132px, 0.38fr) auto;"
    );
    expect(hasCssBlockWith(".audit-layout", ['"runbook workflow"', '"history decision"', '"export export"', '"package package"', '"index index"', '"ai ai"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"runbook"', '"history"', '"export"', '"workflow"', '"decision"', '"package"', '"index"', '"ai"'])).toBe(true);
  });

  test("renders import diff guidance in the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const importDiffPanelSource = sourceBetween("function ResearchRunImportDiffPanel", "function ResearchRunImportAuditEventPanel");
    const importDiffLabelSource = sourceBetween("function researchImportDiffLabel", "function researchImportDiffStatusLabel");

    expect(appSource).toContain("buildResearchRunImportDiffRows");
    expect(appSource).toContain("filterResearchRunImportDiffRows");
    expect(appSource).toContain("const researchRunImportDiffRows = buildResearchRunImportDiffRows");
    expect(importDiffLabelSource).toContain('"audit-summary": "导入审计摘要"');
    expect(importDiffLabelSource).toContain('"audit-report": "导入审计报告"');
    expect(importDiffLabelSource).toContain('"backtest-report": "导入回测报告"');
    expect(appSource).toContain('const [researchRunImportDiffQuery, setResearchRunImportDiffQuery] = useState(initialImportAuditEvidenceDeepLink?.focusQuery ?? "");');
    expect(appSource).toContain("function ResearchRunImportDiffPanel");
    expect(auditWorkspaceSource).toContain("<ResearchRunImportDiffPanel");
    expect(auditWorkspaceSource).toContain('className="workflow-import-diff-panel"');
    expect(auditWorkspaceSource).toContain("rows={researchRunImportDiffRows}");
    expect(auditWorkspaceSource).toContain("query={researchRunImportDiffQuery}");
    expect(auditWorkspaceSource).toContain("onQueryChange={setResearchRunImportDiffQuery}");
    expect(importDiffPanelSource).toContain("query: string;");
    expect(importDiffPanelSource).toContain("onQueryChange: (query: string) => void;");
    expect(importDiffPanelSource).toContain("filterResearchRunImportDiffRows(rows, query)");
    expect(importDiffPanelSource).toContain("onQueryChange(event.target.value)");
    expect(cssBlock(".workflow-import-diff-panel")).toContain("grid-area: import-diff;");
    expect(cssBlock(".research-import-diff")).toContain("display: grid;");
    expect(cssBlock(".research-import-diff-row")).toContain("grid-template-columns: minmax(116px, 0.44fr) minmax(104px, 0.3fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.2fr);");
    expect(hasCssBlockWith(".audit-layout", ['"package package"', '"import-diff import-diff"', '"index index"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"package"', '"import-diff"', '"index"'])).toBe(true);
  });

  test("previews an imported research run export file before applying it", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const importFileSource = sourceBetween("const importRunExportFile = useCallback", "const confirmPendingImportPackage = useCallback");
    const confirmImportSource = sourceBetween("const confirmPendingImportPackage = useCallback", "const updateAiReviewHistoryQuery = useCallback");
    const importPanelSource = sourceBetween("function ResearchRunImportDiffPanel", "function ResearchRunExportIndexPanel");

    expect(appSource).toContain("normalizeResearchRunExportPackagePayload");
    expect(appSource).toContain("withVerifiedResearchRunExportPackageReportSignatures");
    expect(appSource).toContain("const [pendingImportPackage, setPendingImportPackage]");
    expect(appSource).toContain("const [isApplyingImportPackage, setIsApplyingImportPackage]");
    expect(appSource).toContain("exportPackage: pendingImportPackage?.exportPackage ?? inspectedExportPackage");
    expect(importFileSource).toContain("normalizeResearchRunExportPackagePayload(parsed)");
    expect(importFileSource).toContain("withVerifiedResearchRunExportPackageReportSignatures(quantCoreBaseUrl, exportPackage)");
    expect(importFileSource).toContain("setPendingImportPackage({ exportPackage, fileName: file.name })");
    expect(importFileSource).toContain("setInspectedExportPackage(exportPackage)");
    expect(importFileSource).not.toContain("importResearchRunExport");
    expect(confirmImportSource).toContain("importResearchRunExport(quantCoreBaseUrl, pendingImportPackage.exportPackage)");
    expect(auditWorkspaceSource).toContain("pendingFileName={pendingImportPackage?.fileName ?? null}");
    expect(auditWorkspaceSource).toContain("onConfirmImport={confirmPendingImportPackage}");
    expect(auditWorkspaceSource).toContain("onCancelImport={cancelPendingImportPackage}");
    expect(auditWorkspaceSource).toContain("isImporting={isApplyingImportPackage}");
    expect(importPanelSource).toContain("pendingFileName");
    expect(importPanelSource).toContain("research-import-diff-actions");
    expect(importPanelSource).toContain("onConfirmImport");
    expect(importPanelSource).toContain("onCancelImport");
    expect(cssBlock(".research-import-diff-actions")).toContain("display: flex;");
  });

  test("renders import audit events in the audit work area", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const importEventsPanelSource = sourceBetween("function ResearchRunImportAuditEventPanel", "function ResearchRunExportIndexPanel");

    expect(appSource).toContain("buildResearchRunImportAuditEvent");
    expect(appSource).toContain("buildResearchRunImportAuditAggregation");
    expect(appSource).toContain("buildResearchRunImportUndoAuditEvent");
    expect(appSource).toContain("buildResearchRunImportUndoConfirmation");
    expect(appSource).toContain("buildResearchRunImportUndoFailureAuditEvent");
    expect(appSource).toContain("undoResearchRunImport");
    expect(appSource).toContain("mergeResearchRunImportAuditEvents");
    expect(appSource).toContain("filterResearchRunImportAuditEvents");
    expect(appSource).toContain("const IMPORT_AUDIT_EVENTS_PAGE_SIZE = 12;");
    expect(appSource).toContain("const [researchRunImportAuditEvents, setResearchRunImportAuditEvents]");
    expect(appSource).toContain("const [researchRunImportAuditPagination, setResearchRunImportAuditPagination]");
    expect(appSource).toContain("function resolveInitialImportAuditEvidenceQuery(): string");
    expect(appSource).toContain("interface InitialImportAuditEvidenceDeepLink");
    expect(appSource).toContain("function resolveInitialImportAuditEvidenceDeepLink(): InitialImportAuditEvidenceDeepLink | null");
    expect(appSource).toContain("interface ResearchRunExportPackageInspectionResult");
    expect(appSource).toContain('new URLSearchParams(window.location.search).get("auditEvent")');
    expect(appSource).toContain('const runId = params.get("runId")?.trim();');
    expect(appSource).toContain('const exportPath = params.get("exportPath")?.trim() || `manifest:${runId}`;');
    expect(appSource).toContain("const initialImportAuditEvidenceDeepLink = resolveInitialImportAuditEvidenceDeepLink();");
    expect(appSource).toContain("const initialImportAuditEvidenceDeepLinkRef = useRef(initialImportAuditEvidenceDeepLink);");
    expect(appSource).toContain("const [researchRunImportAuditQuery, setResearchRunImportAuditQuery] = useState(resolveInitialImportAuditEvidenceQuery);");
    expect(appSource).toContain("const [researchRunImportAuditOffset, setResearchRunImportAuditOffset] = useState(0);");
    expect(appSource).toContain("const [focusedImportAuditEventId, setFocusedImportAuditEventId] = useState<string | null>(() => resolveInitialImportAuditEventId());");
    expect(appSource).toContain("const [copiedImportAuditEvidenceEventId, setCopiedImportAuditEvidenceEventId] = useState<string | null>(null);");
    expect(appSource).toContain("const [isLoadingResearchRunImportAudit, setIsLoadingResearchRunImportAudit] = useState(false);");
    expect(appSource).toContain("const researchRunImportAuditRequestIdRef = useRef(0);");
    expect(appSource).toContain("limit: IMPORT_AUDIT_EVENTS_PAGE_SIZE");
    expect(appSource).toContain("offset: researchRunImportAuditOffset");
    expect(appSource).toContain("query: researchRunImportAuditQuery.trim() || undefined");
    expect(appSource).toContain("setResearchRunImportAuditPagination(auditHistory.pagination ?? null)");
    expect(appSource).toContain("const copyResearchRunImportAuditEvidenceAnchor = useCallback");
    expect(appSource).toContain("const anchor = buildResearchRunImportAuditEvidenceUrl(event);");
    expect(appSource).toContain("navigator.clipboard.writeText(anchor)");
    expect(appSource).toContain("setCopiedImportAuditEvidenceEventId(event.id)");
    expect(appSource).toContain("function buildResearchRunImportAuditEvidenceUrl(event: ResearchRunImportAuditEvent): string");
    expect(appSource).toContain("blockedRows: event.blockedRows");
    expect(appSource).toContain("blockedRows: auditMetadataBlockedRows(record.metadata.blockedRows)");
    expect(appSource).toContain("function auditMetadataBlockedRows(value: unknown): ResearchRunImportAuditEvent[\"blockedRows\"]");
    expect(appSource).toContain("verifiedReportSignatures: event.verifiedReportSignatures");
    expect(appSource).toContain("verifiedReportSignatures: auditMetadataVerifiedReportSignatures(record.metadata.verifiedReportSignatures)");
    expect(appSource).toContain("function auditMetadataVerifiedReportSignatures(value: unknown): ResearchRunImportAuditEvent[\"verifiedReportSignatures\"]");
    expect(appSource).toContain("const inspectRunExportPackageByRunId = useCallback");
    expect(appSource).toContain("return { ok: false, error: errorMessage };");
    expect(appSource).toContain("return { ok: true };");
    expect(appSource).toContain("const inspectResearchRunImportAuditEvent = useCallback");
    expect(appSource).toContain("const deepLink = initialImportAuditEvidenceDeepLinkRef.current;");
    expect(appSource).toContain("initialImportAuditEvidenceDeepLinkRef.current = null;");
    expect(appSource).toContain("setResearchRunExportBrowserQuery(deepLink.focusQuery);");
    expect(appSource).toContain("setResearchRunImportDiffQuery(deepLink.focusQuery);");
    expect(appSource).toContain("void loadImportAuditEvidenceDeepLink(deepLink);");
    expect(appSource).toContain("function researchRunImportAuditEvidenceAnchorQuery(runId: string, exportPath: string): string");
    expect(appSource).toContain("function researchRunImportAuditEvidenceQuery(event: ResearchRunImportAuditEvent): string");
    expect(appSource).toContain("return researchRunImportAuditEvidenceAnchorQuery(event.runId, event.exportPath);");
    expect(appSource).toContain("inspectRunExportPackageByRunId(event.runId)");
    expect(appSource).toContain("const focusQuery = researchRunImportAuditEvidenceQuery(event);");
    expect(appSource).toContain("setResearchRunExportBrowserQuery(focusQuery);");
    expect(appSource).toContain("setResearchRunImportDiffQuery(focusQuery);");
    expect(appSource).toContain("function ResearchRunImportAuditEventPanel");
    expect(auditWorkspaceSource).toContain("<ResearchRunImportAuditEventPanel");
    expect(auditWorkspaceSource).toContain('className="workflow-import-events-panel"');
    expect(auditWorkspaceSource).toContain("events={researchRunImportAuditEvents}");
    expect(auditWorkspaceSource).toContain("pagination={researchRunImportAuditPagination}");
    expect(auditWorkspaceSource).toContain("query={researchRunImportAuditQuery}");
    expect(auditWorkspaceSource).toContain("isLoading={isLoadingResearchRunImportAudit}");
    expect(auditWorkspaceSource).toContain("onQueryChange={updateResearchRunImportAuditQuery}");
    expect(auditWorkspaceSource).toContain("onPreviousPage={previousResearchRunImportAuditPage}");
    expect(auditWorkspaceSource).toContain("onNextPage={nextResearchRunImportAuditPage}");
    expect(auditWorkspaceSource).toContain("onInspectRunPackage={inspectResearchRunImportAuditEvent}");
    expect(auditWorkspaceSource).toContain("onCopyEvidenceAnchor={copyResearchRunImportAuditEvidenceAnchor}");
    expect(auditWorkspaceSource).toContain("copiedEvidenceEventId={copiedImportAuditEvidenceEventId}");
    expect(auditWorkspaceSource).toContain("focusedEventId={focusedImportAuditEventId}");
    expect(auditWorkspaceSource).toContain("onReplayRollbackRun={replayImportRollbackRun}");
    expect(auditWorkspaceSource).toContain("onUndoImport={undoResearchRunImportEvent}");
    expect(importEventsPanelSource).toContain("research-import-events-summary");
    expect(importEventsPanelSource).toContain("const [stageFilter, setStageFilter]");
    expect(importEventsPanelSource).toContain('filterResearchRunImportAuditEvents(events, "", stageFilter)');
    expect(importEventsPanelSource).toContain("onQueryChange(event.target.value)");
    expect(importEventsPanelSource).toContain("const pageStart = pagination && pagination.total > 0 ? pagination.offset + 1 : 0;");
    expect(importEventsPanelSource).toContain("const canPageForward = Boolean(pagination && pagination.offset + pagination.limit < pagination.total);");
    expect(importEventsPanelSource).toContain("buildResearchRunImportAuditAggregation(events)");
    expect(importEventsPanelSource).toContain("research-import-events-filters");
    expect(importEventsPanelSource).toContain("data-active={stageFilter === filter.id}");
    expect(importEventsPanelSource).toContain("research-import-events-pagination");
    expect(importEventsPanelSource).toContain("onPreviousPage");
    expect(importEventsPanelSource).toContain("onNextPage");
    expect(importEventsPanelSource).toContain('const canInspectRunPackage = event.stage === "confirmed" || event.stage === "undone" || event.stage === "undo-failed";');
    expect(importEventsPanelSource).toContain("onInspectRunPackage(event)");
    expect(importEventsPanelSource).toContain("Open evidence");
    expect(importEventsPanelSource).toContain("copiedEvidenceEventId === event.id");
    expect(importEventsPanelSource).toContain("const focusedEventRef = useRef<HTMLElement | null>(null);");
    expect(importEventsPanelSource).toContain("focusedEventRef.current?.scrollIntoView({ block: \"center\", behavior: \"smooth\" });");
    expect(importEventsPanelSource).toContain("const isFocusedEvent = focusedEventId === event.id;");
    expect(importEventsPanelSource).toContain("ref={isFocusedEvent ? focusedEventRef : undefined}");
    expect(importEventsPanelSource).toContain('${isFocusedEvent ? "focused" : ""}');
    expect(importEventsPanelSource).toContain("onCopyEvidenceAnchor(event)");
    expect(importEventsPanelSource).toContain("Copy anchor");
    expect(importEventsPanelSource).toContain("Copied");
    expect(importEventsPanelSource).toContain("aggregation.failureBuckets");
    expect(importEventsPanelSource).toContain("aggregation.blockedEvidenceBuckets");
    expect(importEventsPanelSource).toContain("aggregation.verifiedReportSignatureBuckets");
    expect(importEventsPanelSource).toContain("researchImportBlockedEvidenceBucketLabel");
    expect(importEventsPanelSource).toContain("researchImportVerifiedReportSignatureBucketLabel");
    expect(appSource).toContain('"Import verification": "导入验签"');
    expect(importEventsPanelSource).toContain("bucket.latestExportPath");
    expect(importEventsPanelSource).toContain("bucket.latestDetail");
    expect(importEventsPanelSource).toContain("bucket.latestReason");
    expect(importEventsPanelSource).toContain("research-import-failure-buckets");
    expect(importEventsPanelSource).toContain("research-import-verification-bucket");
    expect(importEventsPanelSource).toContain("research-import-event-row");
    expect(importEventsPanelSource).toContain("event.recoveryHint");
    expect(importEventsPanelSource).toContain("event.blockedRows.length");
    expect(importEventsPanelSource).toContain("event.blockedRows");
    expect(importEventsPanelSource).toContain("`${row.label}: ${row.incoming}`");
    expect(importEventsPanelSource).toContain("event.undoToken");
    expect(importEventsPanelSource).toContain("pendingImportUndoToken");
    expect(importEventsPanelSource).toContain("buildResearchRunImportUndoConfirmation(event)");
    expect(importEventsPanelSource).toContain("setPendingImportUndoToken(event.undoToken)");
    expect(importEventsPanelSource).toContain("onUndoImport(undoConfirmation.undoToken, undoConfirmation.runId)");
    expect(importEventsPanelSource).toContain('event.stage !== "undone"');
    expect(appSource).toContain("buildResearchRunImportUndoFailureAuditEvent({");
    expect(importEventsPanelSource).toContain("aggregation.undoFailed");
    expect(importEventsPanelSource).toContain("onReplayRollbackRun(event.rollbackTargetRunId)");
    expect(importEventsPanelSource).toContain("research-import-event-recovery");
    expect(importEventsPanelSource).toContain("research-import-undo-confirmation");
    expect(cssBlock(".workflow-import-events-panel")).toContain("grid-area: import-events;");
    expect(cssBlock(".research-import-events")).toContain("display: grid;");
    expect(cssBlock(".research-import-events-filters")).toContain("display: flex;");
    expect(cssBlock(".research-import-events-pagination")).toContain("display: flex;");
    expect(cssBlock(".research-import-failure-buckets")).toContain("display: grid;");
    expect(cssBlock(".research-import-failure-bucket")).toContain("display: grid;");
    expect(cssBlock(".research-import-failure-bucket.positive")).toContain("border-left-color: #4cc9ad;");
    expect(cssBlock(".research-import-event-row")).toContain(
      "grid-template-columns: minmax(118px, 0.34fr) minmax(130px, 0.42fr) minmax(0, 1fr) minmax(132px, 0.36fr) minmax(92px, 0.24fr) auto;"
    );
    expect(cssBlock(".research-import-event-recovery")).toContain("display: flex;");
    expect(cssBlock(".research-import-undo-confirmation")).toContain("display: grid;");
    expect(cssBlock(".research-import-event-row.undo-failed")).toContain("border-left-color: #ff7f6d;");
    expect(cssBlock(".research-import-event-row.focused")).toContain("box-shadow:");
    expect(hasCssBlockWith(".audit-layout", ['"import-diff import-diff"', '"import-events import-events"', '"index index"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"import-diff"', '"import-events"', '"index"'])).toBe(true);
  });

  test("renders audit evidence report history from the backend ledger", () => {
    const auditWorkspaceSource = sourceBetween('if (activeWorkAreaId === "audit")', 'if (activeWorkAreaId === "settings")');
    const reportLedgerPanelSource = sourceBetween("function AuditEvidenceReportLedgerPanel", "function ResearchRunImportAuditEventPanel");
    const signingKeyPanelSource = sourceBetween("function AuditSigningKeyRegistryPanel", "function ResearchRunImportAuditEventPanel");

    expect(appSource).toContain("buildAuditEvidenceReportLedgerRows");
    expect(appSource).toContain("buildAuditEvidenceReportLedgerSummary");
    expect(appSource).toContain("buildAuditSigningKeyRotationChainSummary");
    expect(appSource).toContain("filterAuditEvidenceReportLedgerRows");
    expect(appSource).toContain("buildAuditSigningKeyRotationLedgerRows");
    expect(appSource).toContain("filterAuditSigningKeyRotationLedgerRows");
    expect(appSource).toContain("signAuditReportEvent");
    expect(appSource).toContain("verifyAuditReportEvent");
    expect(appSource).toContain("revokeAuditReportEvent");
    expect(appSource).toContain("loadAuditSigningKeys");
    expect(appSource).toContain("prepareAuditSigningKeyRotationPlan");
    expect(appSource).toContain("applyAuditSigningKeyRotationPlan");
    expect(appSource).toContain("recordAuditSigningKeyControlledRestartEvidence");
    expect(appSource).toContain("recordAuditSigningKeySecretMaterialization");
    expect(appSource).toContain("loadAuditSigningKeySecretMaterializations");
    expect(appSource).toContain("recordAuditSigningKeyEnvironmentBinding");
    expect(appSource).toContain("loadAuditSigningKeyEnvironmentBindings");
    expect(appSource).toContain("recordAuditSigningKeyRuntimeReloadExecution");
    expect(appSource).toContain("loadAuditSigningKeyRuntimeReloadExecutions");
    expect(appSource).toContain("recordAuditSigningKeyRotationAcceptance");
    expect(appSource).toContain("loadAuditSigningKeyRotationAcceptances");
    expect(appSource).toContain("buildAuditSigningKeyRotationPlanAuditEvent");
    expect(appSource).toContain("buildAuditSigningKeyRotationApplyAuditEvent");
    expect(appSource).toContain("AuditSigningKeyRegistryPanel");
    expect(appSource).toContain('eventType: "audit_evidence_report,backtest_report,portfolio_report,p0_readiness_report"');
    expect(appSource).toContain('eventType: "audit_signing_key_rotation_plan"');
    expect(appSource).toContain('eventType: "audit_signing_key_rotation_apply"');
    expect(appSource).toContain("const [auditEvidenceReportEvents, setAuditEvidenceReportEvents]");
    expect(appSource).toContain("const openAuditReportLedgerEvidenceLink = useCallback");
    expect(appSource).toContain("const copyAuditReportLedgerEvidenceLink = useCallback");
    expect(appSource).toContain("const [auditSigningKeyRotationEvents, setAuditSigningKeyRotationEvents]");
    expect(appSource).toContain("const [signingAuditReportEventId, setSigningAuditReportEventId]");
    expect(appSource).toContain("const [verifyingAuditReportEventId, setVerifyingAuditReportEventId]");
    expect(appSource).toContain("const [revokingAuditReportEventId, setRevokingAuditReportEventId]");
    expect(appSource).toContain("const [auditSigningKeyRegistry, setAuditSigningKeyRegistry]");
    expect(appSource).toContain("const [auditSigningKeyRotationPlan, setAuditSigningKeyRotationPlan]");
    expect(appSource).toContain("const [auditSigningKeyRotationApply, setAuditSigningKeyRotationApply]");
    expect(appSource).toContain("const [auditSigningKeyRotationApplyConfirmations, setAuditSigningKeyRotationApplyConfirmations]");
    expect(appSource).toContain("const [auditSigningKeyRestartEvidence, setAuditSigningKeyRestartEvidence]");
    expect(appSource).toContain("const [auditSigningKeyRestartEvidenceConfirmations, setAuditSigningKeyRestartEvidenceConfirmations]");
    expect(appSource).toContain("const [auditSigningKeySecretMaterialization, setAuditSigningKeySecretMaterialization]");
    expect(appSource).toContain("const [auditSigningKeySecretMaterializationConfirmations, setAuditSigningKeySecretMaterializationConfirmations]");
    expect(appSource).toContain("const [auditSigningKeyEnvironmentBinding, setAuditSigningKeyEnvironmentBinding]");
    expect(appSource).toContain("const [auditSigningKeyEnvironmentBindingConfirmations, setAuditSigningKeyEnvironmentBindingConfirmations]");
    expect(appSource).toContain("const [auditSigningKeyRuntimeReloadExecution, setAuditSigningKeyRuntimeReloadExecution]");
    expect(appSource).toContain("const [auditSigningKeyRuntimeReloadExecutionConfirmations, setAuditSigningKeyRuntimeReloadExecutionConfirmations]");
    expect(appSource).toContain("const [auditSigningKeyRotationAcceptance, setAuditSigningKeyRotationAcceptance]");
    expect(appSource).toContain("const [auditSigningKeyRotationAcceptanceConfirmations, setAuditSigningKeyRotationAcceptanceConfirmations]");
    expect(appSource).toContain("const [isRecordingAuditSigningKeyRotationAcceptance, setIsRecordingAuditSigningKeyRotationAcceptance]");
    expect(appSource).toContain("const [auditSigningKeyRotationPlanEventId, setAuditSigningKeyRotationPlanEventId]");
    expect(appSource).toContain("const [auditSigningKeyRotationLedgerStatus, setAuditSigningKeyRotationLedgerStatus]");
    expect(appSource).toContain("const refreshAuditEvidenceReportEvents = useCallback");
    expect(appSource).toContain("const auditEvidenceReportLedgerRows = buildAuditEvidenceReportLedgerRows");
    expect(appSource).toContain("const auditSigningKeyRotationChainSummary = buildAuditSigningKeyRotationChainSummary");
    expect(appSource).toContain("const auditSigningKeyRotationLedgerRows = filterAuditSigningKeyRotationLedgerRows");
    expect(appSource).toContain("setAuditEvidenceReportEvents((current) =>");
    expect(appSource).toContain("const signAuditEvidenceReportEvent = useCallback");
    expect(appSource).toContain("const verifyAuditEvidenceReportEvent = useCallback");
    expect(appSource).toContain("const revokeAuditEvidenceReportEvent = useCallback");
    expect(appSource).toContain("setAuditEvidenceReportEvents((current) => mergeAuditEvidenceReportEvent(current, result.event!))");
    expect(appSource).toContain('eventType: "audit_signing_key_environment_binding"');
    expect(appSource).toContain('eventType: "audit_signing_key_runtime_reload_execution"');
    expect(appSource).toContain('eventType: "audit_signing_key_rotation_acceptance"');
    expect(appSource).toContain("const recordAuditSigningKeyEnvironmentBindingForAudit = useCallback");
    expect(appSource).toContain("const recordAuditSigningKeyRuntimeReloadExecutionForAudit = useCallback");
    expect(appSource).toContain("const recordAuditSigningKeyRotationAcceptanceForAudit = useCallback");
    expect(auditWorkspaceSource).toContain("<AuditEvidenceReportLedgerPanel");
    expect(auditWorkspaceSource).toContain("<AuditSigningKeyRegistryPanel");
    expect(auditWorkspaceSource).toContain('className="workflow-report-ledger-panel"');
    expect(auditWorkspaceSource).toContain("rows={auditEvidenceReportLedgerRows}");
    expect(auditWorkspaceSource).toContain("pagination={auditEvidenceReportPagination}");
    expect(auditWorkspaceSource).toContain("query={auditEvidenceReportQuery}");
    expect(auditWorkspaceSource).toContain("isLoading={isLoadingAuditEvidenceReportEvents}");
    expect(auditWorkspaceSource).toContain("onQueryChange={updateAuditEvidenceReportQuery}");
    expect(auditWorkspaceSource).toContain("onOpenEvidenceLink={openAuditReportLedgerEvidenceLink}");
    expect(auditWorkspaceSource).toContain("onCopyEvidenceLink={copyAuditReportLedgerEvidenceLink}");
    expect(auditWorkspaceSource).toContain("onPreviousPage={previousAuditEvidenceReportPage}");
    expect(auditWorkspaceSource).toContain("onNextPage={nextAuditEvidenceReportPage}");
    expect(auditWorkspaceSource).toContain("onSignReport={signAuditEvidenceReportEvent}");
    expect(auditWorkspaceSource).toContain("onVerifyReport={verifyAuditEvidenceReportEvent}");
    expect(auditWorkspaceSource).toContain("onRevokeReport={revokeAuditEvidenceReportEvent}");
    expect(auditWorkspaceSource).toContain("signingEventId={signingAuditReportEventId}");
    expect(auditWorkspaceSource).toContain("verifyingEventId={verifyingAuditReportEventId}");
    expect(auditWorkspaceSource).toContain("registry={auditSigningKeyRegistry.registry}");
    expect(auditWorkspaceSource).toContain("rotationPlan={auditSigningKeyRotationPlan.rotationPlan}");
    expect(auditWorkspaceSource).toContain("rotationApply={auditSigningKeyRotationApply.rotationApply}");
    expect(auditWorkspaceSource).toContain("rotationApplyConfirmations={auditSigningKeyRotationApplyConfirmations}");
    expect(auditWorkspaceSource).toContain("restartEvidence={auditSigningKeyRestartEvidence.restartEvidence}");
    expect(auditWorkspaceSource).toContain("restartEvidenceConfirmations={auditSigningKeyRestartEvidenceConfirmations}");
    expect(auditWorkspaceSource).toContain("secretMaterialization={auditSigningKeySecretMaterialization.secretMaterialization}");
    expect(auditWorkspaceSource).toContain("secretMaterializationConfirmations={auditSigningKeySecretMaterializationConfirmations}");
    expect(auditWorkspaceSource).toContain("secretMaterializationPlanEventId={auditSigningKeyRotationPlanEventId}");
    expect(auditWorkspaceSource).toContain("environmentBinding={auditSigningKeyEnvironmentBinding.environmentBinding}");
    expect(auditWorkspaceSource).toContain("environmentBindingConfirmations={auditSigningKeyEnvironmentBindingConfirmations}");
    expect(auditWorkspaceSource).toContain("environmentBindingMaterializationId={auditSigningKeySecretMaterialization.secretMaterialization?.materializationId ?? null}");
    expect(auditWorkspaceSource).toContain("runtimeReloadExecution={auditSigningKeyRuntimeReloadExecution.runtimeReloadExecution}");
    expect(auditWorkspaceSource).toContain("runtimeReloadExecutionConfirmations={auditSigningKeyRuntimeReloadExecutionConfirmations}");
    expect(auditWorkspaceSource).toContain("runtimeReloadExecutionPlanId={auditSigningKeyRuntimeReloadPlan.runtimeReloadPlan?.planId ?? null}");
    expect(auditWorkspaceSource).toContain("rotationAcceptance={auditSigningKeyRotationAcceptance.rotationAcceptance}");
    expect(auditWorkspaceSource).toContain("rotationAcceptanceConfirmations={auditSigningKeyRotationAcceptanceConfirmations}");
    expect(auditWorkspaceSource).toContain("rotationAcceptanceError={auditSigningKeyRotationAcceptance.error}");
    expect(auditWorkspaceSource).toContain("rotationAcceptanceExecutionId={auditSigningKeyRuntimeReloadExecution.runtimeReloadExecution?.executionId ?? null}");
    expect(auditWorkspaceSource).toContain("rotationChainSummary={auditSigningKeyRotationChainSummary}");
    expect(auditWorkspaceSource).toContain("rotationLedgerStatus={auditSigningKeyRotationLedgerStatus}");
    expect(auditWorkspaceSource).toContain("rotationHistoryRows={auditSigningKeyRotationHistoryRows}");
    expect(auditWorkspaceSource).toContain("onApplyRotation={applyAuditSigningKeyRotationPlanForAudit}");
    expect(auditWorkspaceSource).toContain("onApplyConfirmationChange={updateAuditSigningKeyRotationApplyConfirmation}");
    expect(auditWorkspaceSource).toContain("onRecordRestartEvidence={recordAuditSigningKeyRestartEvidenceForAudit}");
    expect(auditWorkspaceSource).toContain("onRestartEvidenceConfirmationChange={updateAuditSigningKeyRestartEvidenceConfirmation}");
    expect(auditWorkspaceSource).toContain("onRecordSecretMaterialization={recordAuditSigningKeySecretMaterializationForAudit}");
    expect(auditWorkspaceSource).toContain("onSecretMaterializationConfirmationChange={updateAuditSigningKeySecretMaterializationConfirmation}");
    expect(auditWorkspaceSource).toContain("onRecordEnvironmentBinding={recordAuditSigningKeyEnvironmentBindingForAudit}");
    expect(auditWorkspaceSource).toContain("onEnvironmentBindingConfirmationChange={updateAuditSigningKeyEnvironmentBindingConfirmation}");
    expect(auditWorkspaceSource).toContain("onRecordRuntimeReloadExecution={recordAuditSigningKeyRuntimeReloadExecutionForAudit}");
    expect(auditWorkspaceSource).toContain("onRuntimeReloadExecutionConfirmationChange={updateAuditSigningKeyRuntimeReloadExecutionConfirmation}");
    expect(auditWorkspaceSource).toContain("onRecordRotationAcceptance={recordAuditSigningKeyRotationAcceptanceForAudit}");
    expect(auditWorkspaceSource).toContain("onRotationAcceptanceConfirmationChange={updateAuditSigningKeyRotationAcceptanceConfirmation}");
    expect(auditWorkspaceSource).toContain("isRecordingRotationAcceptance={isRecordingAuditSigningKeyRotationAcceptance}");
    expect(auditWorkspaceSource).toContain("source={auditSigningKeyRegistry.source}");
    expect(auditWorkspaceSource).toContain("error={auditSigningKeyRegistry.error}");
    expect(auditWorkspaceSource).toContain("onPrepareRotation={prepareAuditSigningKeyRotationPlanForAudit}");
    expect(auditWorkspaceSource).toContain("revokingEventId={revokingAuditReportEventId}");
    expect(reportLedgerPanelSource).toContain("buildAuditEvidenceReportLedgerSummary(rows)");
    expect(reportLedgerPanelSource).toContain("filterAuditEvidenceReportLedgerRows(rows, query)");
    expect(reportLedgerPanelSource).toContain("audit-report-ledger-summary");
    expect(reportLedgerPanelSource).toContain("summary.signingEligible");
    expect(reportLedgerPanelSource).toContain("summary.auditAid");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidRunId");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidEvidenceLink");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidPreflightActionLabel");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidPreflightAttention");
    expect(reportLedgerPanelSource).toContain("summary.latestAuditAidPreflightLabel");
    expect(reportLedgerPanelSource).toContain("summary.latestReportLabel");
    expect(reportLedgerPanelSource).toContain("summary.latestReportKind");
    expect(reportLedgerPanelSource).toContain("summary.latestReportQuery");
    expect(reportLedgerPanelSource).toContain("onQueryChange(summary.latestReportQuery)");
    expect(reportLedgerPanelSource).toContain("需签名");
    expect(reportLedgerPanelSource).toContain("Audit aids");
    expect(reportLedgerPanelSource).toContain("定位最新");
    expect(reportLedgerPanelSource).toContain("Focus latest");
    expect(reportLedgerPanelSource).toContain("最新辅助");
    expect(reportLedgerPanelSource).toContain("Latest aid");
    expect(reportLedgerPanelSource).toContain("最新预检");
    expect(reportLedgerPanelSource).toContain("Latest preflight");
    expect(reportLedgerPanelSource).toContain("下一步");
    expect(reportLedgerPanelSource).toContain("Next action");
    expect(reportLedgerPanelSource).toContain("预检关注");
    expect(reportLedgerPanelSource).toContain("Preflight attention");
    expect(reportLedgerPanelSource).toContain("打开最新辅助");
    expect(reportLedgerPanelSource).toContain("Open latest aid");
    expect(reportLedgerPanelSource).toContain("onOpenEvidenceLink(summary.latestAuditAidEvidenceLink)");
    expect(reportLedgerPanelSource).toContain("复制最新辅助");
    expect(reportLedgerPanelSource).toContain("Copy latest aid");
    expect(reportLedgerPanelSource).toContain("onCopyEvidenceLink(summary.latestAuditAidEvidenceLink)");
    expect(reportLedgerPanelSource).toContain("audit-report-ledger-pagination");
    expect(reportLedgerPanelSource).toContain("audit-report-ledger-row");
    expect(reportLedgerPanelSource).toContain("row.shortHash");
    expect(reportLedgerPanelSource).toContain("row.signatureLabel");
    expect(reportLedgerPanelSource).toContain("row.reportKind");
    expect(reportLedgerPanelSource).not.toContain('row.reportKind !== "audit_evidence_report"');
    expect(reportLedgerPanelSource).toContain("row.importVerificationDetail");
    expect(reportLedgerPanelSource).toContain("row.importVerificationInvalid > 0");
    expect(reportLedgerPanelSource).toContain("导入验签失败");
    expect(reportLedgerPanelSource).toContain("导入验签");
    expect(reportLedgerPanelSource).toContain("summary.importVerificationVerified");
    expect(reportLedgerPanelSource).toContain("summary.importVerificationInvalid");
    expect(reportLedgerPanelSource).toContain("row.signatureDetail");
    expect(reportLedgerPanelSource).toContain("row.chainId");
    expect(reportLedgerPanelSource).toContain("row.signatureDetail && row.chainId");
    expect(reportLedgerPanelSource).toContain('row.signatureStatus === "revoked" && row.signatureRevokedReason');
    expect(reportLedgerPanelSource).toContain("row.signatureSignedAt || row.signatureVerifiedAt");
    expect(reportLedgerPanelSource).toContain("row.focusQuery");
    expect(reportLedgerPanelSource).toContain("audit-report-ledger-actions");
    expect(reportLedgerPanelSource).toContain("onSignReport(row.id)");
    expect(reportLedgerPanelSource).toContain("onVerifyReport(row.id)");
    expect(reportLedgerPanelSource).toContain("onRevokeReport(row.id)");
    expect(reportLedgerPanelSource).toContain("row.evidenceLinkSearch");
    expect(reportLedgerPanelSource).toContain("row.evidenceLinkLabel");
    expect(reportLedgerPanelSource).toContain("row.evidenceLinkDecodedSearch");
    expect(reportLedgerPanelSource).toContain("row.paperPreflightLabel");
    expect(reportLedgerPanelSource).toContain('className="audit-report-ledger-preflight"');
    expect(reportLedgerPanelSource).toContain("onOpenEvidenceLink(row.evidenceLinkSearch)");
    expect(reportLedgerPanelSource).toContain("onCopyEvidenceLink(row.evidenceLinkSearch)");
    expect(reportLedgerPanelSource).toContain("打开证据");
    expect(reportLedgerPanelSource).toContain("Open evidence");
    expect(reportLedgerPanelSource).toContain("复制证据链接");
    expect(reportLedgerPanelSource).toContain("Copy evidence link");
    expect(reportLedgerPanelSource).toContain("signingEventId === row.id");
    expect(reportLedgerPanelSource).toContain("verifyingEventId === row.id");
    expect(reportLedgerPanelSource).toContain("revokingEventId === row.id");
    expect(reportLedgerPanelSource).toContain('row.signatureStatus === "revoked"');
    expect(signingKeyPanelSource).toContain("audit-signing-key-rotation-plan");
    expect(signingKeyPanelSource).toContain("rotationPlan.environmentUpdates");
    expect(signingKeyPanelSource).toContain("rotationPlan.legacyRegistryTemplate");
    expect(signingKeyPanelSource).toContain("audit-signing-key-rotation-ledger");
    expect(signingKeyPanelSource).toContain("audit-signing-key-rotation-history");
    expect(signingKeyPanelSource).toContain("rotationHistoryRows.map");
    expect(signingKeyPanelSource).toContain("rotationChainSummary.stages.map");
    expect(signingKeyPanelSource).toContain("audit-signing-key-rotation-chain");
    expect(signingKeyPanelSource).toContain("auditSigningKeyRotationChainHeadline");
    expect(signingKeyPanelSource).toContain("auditSigningKeyRotationChainStageLabel");
    expect(signingKeyPanelSource).toContain("audit-signing-key-rotation-apply");
    expect(signingKeyPanelSource).toContain("rotationApplyConfirmations");
    expect(signingKeyPanelSource).toContain("onApplyRotation");
    expect(signingKeyPanelSource).toContain("audit-signing-key-restart-evidence");
    expect(signingKeyPanelSource).toContain("restartEvidenceConfirmations");
    expect(signingKeyPanelSource).toContain("onRecordRestartEvidence");
    expect(signingKeyPanelSource).toContain("restartWindowExecuted");
    expect(signingKeyPanelSource).toContain("rollbackPlanConfirmed");
    expect(signingKeyPanelSource).toContain("postRestartValidationPassed");
    expect(signingKeyPanelSource).toContain("operatorReviewedRestartLogs");
    expect(signingKeyPanelSource).toContain("audit-signing-key-secret-materialization");
    expect(signingKeyPanelSource).toContain("secretMaterializationConfirmations");
    expect(signingKeyPanelSource).toContain("onRecordSecretMaterialization");
    expect(signingKeyPanelSource).toContain("localSecretStoreWriteVerified");
    expect(signingKeyPanelSource).toContain("noRawSecretInPayload");
    expect(signingKeyPanelSource).toContain("envBindingPlanDocumented");
    expect(signingKeyPanelSource).toContain("rollbackPlanDocumented");
    expect(signingKeyPanelSource).toContain("audit-signing-key-environment-binding");
    expect(signingKeyPanelSource).toContain("environmentBindingConfirmations");
    expect(signingKeyPanelSource).toContain("onRecordEnvironmentBinding");
    expect(signingKeyPanelSource).toContain("runtimeEnvMappingVerified");
    expect(signingKeyPanelSource).toContain("configReloadPlanDocumented");
    expect(signingKeyPanelSource).toContain("rollbackSnapshotRecorded");
    expect(signingKeyPanelSource).toContain("auditSigningKeyEnvironmentBindingStatusLabel");
    expect(signingKeyPanelSource).toContain("audit-signing-key-runtime-reload-execution");
    expect(signingKeyPanelSource).toContain("runtimeReloadExecutionConfirmations");
    expect(signingKeyPanelSource).toContain("onRecordRuntimeReloadExecution");
    expect(signingKeyPanelSource).toContain("preReloadHealthVerified");
    expect(signingKeyPanelSource).toContain("reloadActionRecorded");
    expect(signingKeyPanelSource).toContain("postReloadSmokePassed");
    expect(signingKeyPanelSource).toContain("rollbackReadinessConfirmed");
    expect(signingKeyPanelSource).toContain("operatorConfirmedLiveBlocked");
    expect(signingKeyPanelSource).toContain("auditSigningKeyRuntimeReloadExecutionStatusLabel");
    expect(signingKeyPanelSource).toContain("audit-signing-key-rotation-acceptance");
    expect(signingKeyPanelSource).toContain("rotationAcceptanceConfirmations");
    expect(signingKeyPanelSource).toContain("onRecordRotationAcceptance");
    expect(signingKeyPanelSource).toContain("executionEvidenceReviewed");
    expect(signingKeyPanelSource).toContain("signatureProbeVerified");
    expect(signingKeyPanelSource).toContain("legacyVerificationConfirmed");
    expect(signingKeyPanelSource).toContain("rollbackWindowStillOpen");
    expect(signingKeyPanelSource).toContain("operatorConfirmedActivationBlocked");
    expect(signingKeyPanelSource).toContain("auditSigningKeyRotationAcceptanceStatusLabel");
    expect(signingKeyPanelSource).toContain("rotationLedgerStatus");
    expect(signingKeyPanelSource).toContain("onPrepareRotation");
    expect(appSource).toContain('"Verified signature": "签名已验证"');
    expect(appSource).toContain('"Signed report hash": "报告 hash 已签名"');
    expect(appSource).toContain('"Revoked signature": "签名已撤销"');
    expect(cssBlock(".workflow-report-ledger-panel")).toContain("grid-area: reports;");
    expect(cssBlock(".workflow-signing-keys-panel")).toContain("grid-area: signing-keys;");
    expect(cssBlock(".audit-signing-key-grid")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-plan")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-ledger")).toContain("display: flex;");
    expect(cssBlock(".audit-signing-key-rotation-history")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-chain")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-chain-stages")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-chain-stage")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-history-row")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-apply")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-secret-materialization")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-environment-binding")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-runtime-reload-execution")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-acceptance")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-apply-checks")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-rotation-apply-result")).toContain("display: grid;");
    expect(cssBlock(".audit-signing-key-env-row")).toContain("display: grid;");
    expect(cssBlock(".audit-report-ledger")).toContain("display: grid;");
    expect(cssBlock(".audit-report-ledger-summary")).toContain("display: flex;");
    expect(cssBlock(".audit-report-ledger-pagination")).toContain("display: flex;");
    expect(cssBlock(".audit-report-ledger-actions")).toContain("display: flex;");
    expect(cssBlock(".audit-report-ledger-preflight")).toContain("border: 1px solid #266c60;");
    expect(cssBlock(".audit-report-ledger-row")).toContain(
      "grid-template-columns: minmax(118px, 0.34fr) minmax(170px, 0.5fr) minmax(0, 1fr) minmax(132px, 0.34fr) auto;"
    );
    expect(hasCssBlockWith(".audit-layout", ['"package package"', '"reports reports"', '"signing-keys signing-keys"', '"import-diff import-diff"'])).toBe(true);
    expect(hasCssBlockWith("  .audit-layout", ['"package"', '"reports"', '"signing-keys"', '"import-diff"'])).toBe(true);
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
    expect(auditPanelSource).toContain("const totalHistoryRecords = historyPagination?.total ?? records.length;");
    expect(auditPanelSource).toContain("<AiReviewRecordDriftSummary");
    expect(auditPanelSource).toContain("rows={driftRows}");
    expect(auditPanelSource).toContain("totalRows={totalHistoryRecords}");
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

    expect(auditPanelSource).not.toContain("filterAiReviewRecordDriftRows");
    expect(auditPanelSource).not.toContain('const [driftQuery, setDriftQuery] = useState("");');
    expect(auditPanelSource).toContain("onQueryChange={onHistoryQueryChange}");
    expect(auditPanelSource).toContain("query={historyQuery}");
    expect(auditPanelSource).toContain("totalRows={totalHistoryRecords}");
    expect(driftSummarySource).toContain('type="search"');
    expect(driftSummarySource).toContain('className="audit-ai-drift-search"');
    expect(driftSummarySource).toContain("rows.length !== totalRows");
    expect(cssBlock(".audit-ai-drift-toolbar")).toContain("display: grid;");
    expect(cssBlock(".audit-ai-drift-search")).toContain("min-width: 0;");
  });

  test("applies the AI review audit search to saved record history", () => {
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function AgentEvidenceBoard");
    const recordHistorySource = sourceBetween("function AiReviewRunRecordHistory", "function AiReviewAuditComparison");

    expect(auditPanelSource).toContain("records={records}");
    expect(auditPanelSource).toContain("totalRecords={totalHistoryRecords}");
    expect(auditPanelSource).toContain("query={historyQuery}");
    expect(auditPanelSource).toContain("pagination={historyPagination}");
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

  test("wires audit AI review history search to backend pagination", () => {
    const auditPanelSource = sourceBetween("function AiReviewAuditTrailPanel", "function aiReviewDriftStatusText");
    const recordHistorySource = sourceBetween("function AiReviewRunRecordHistory", "function AiReviewAuditComparison");

    expect(appSource).toContain("const AI_REVIEW_HISTORY_PAGE_SIZE = 5;");
    expect(appSource).toContain("const [aiReviewHistoryPagination, setAiReviewHistoryPagination]");
    expect(appSource).toContain('const [aiReviewHistoryQuery, setAiReviewHistoryQuery] = useState("");');
    expect(appSource).toContain("loadResearchRunAiReviews(quantCoreBaseUrl, runId, {");
    expect(appSource).toContain("limit: AI_REVIEW_HISTORY_PAGE_SIZE");
    expect(appSource).toContain("const offset = options.offset ?? aiReviewHistoryOffset;");
    expect(appSource).toContain("const query = options.query ?? aiReviewHistoryQuery;");
    expect(appSource).toContain("setAiReviewHistoryPagination(aiReviewHistory.pagination ?? null)");
    expect(auditPanelSource).toContain("historyPagination");
    expect(auditPanelSource).toContain("onHistoryQueryChange");
    expect(auditPanelSource).not.toContain("filterAiReviewRecordDriftRows");
    expect(recordHistorySource).toContain("onNextPage");
    expect(recordHistorySource).toContain("onPreviousPage");
    expect(recordHistorySource).toContain("ai-review-record-pagination");
    expect(cssBlock(".ai-review-record-pagination")).toContain("display: flex;");
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
    expect(
      hasCssBlockWith(".research-layout", [
        '"chart scanner"',
        '"chart readiness"',
        '"note workflow"',
        '"decision workflow"'
      ])
    ).toBe(true);
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
    expect(appSource).toContain("buildPortfolioBacktestReportMarkdown(portfolio, portfolioBacktestDraft)");
    expect(appSource).toContain("buildPortfolioBacktestReportAuditEvent({");
    expect(appSource).toContain("saveAuditEvent(quantCoreBaseUrl, portfolioReportAuditEvent)");
    expect(appSource).toContain("onExportPortfolioMarkdown={exportPortfolioBacktestMarkdown}");
    expect(appSource).toContain('i18n.t("portfolio.exportMarkdown")');
    expect(appSource).toContain("portfolio-report-action");
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
    expect(marketWorkspaceSource).toContain("refreshGuard={marketDataRefreshGuard}");
    expect(marketWorkspaceSource).toContain("onRefreshCache={refreshSelectedMarketCache}");
    expect(healthPanelSource).toContain("market-cache-refresh");
    expect(healthPanelSource).toContain("刷新当前缓存");
    expect(healthPanelSource).toContain("disabled={isRefreshingCache || isRefreshBlocked}");
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
    expect(healthPanelSource).toContain("!workspace.watchlist.length || isRefreshBlocked");
    expect(cssBlock(".market-cache-actions")).toContain("display: flex;");
    expect(cssBlock(".market-cache-bulk-refresh")).toContain("display: inline-flex;");
  });

  test("renders provider cooldown guard for manual market data refresh", () => {
    expect(appSource).toContain("buildMarketDataRefreshGuard(");
    expect(appSource).toContain("settingsStatus.settings?.marketDataAdapters");
    expect(appSource).toContain("marketDataRefreshGuardLabel(i18n, refreshGuard)");
    expect(appSource).toContain("数据源冷却");
    expect(appSource).toContain("Provider cooldown");
    expect(cssBlock(".market-refresh-guard-note")).toContain("background:");
    expect(cssBlock(".market-refresh-guard-note")).toContain("margin: 0 0 8px;");
  });

  test("renders selected market calendar session status in the market work area", () => {
    const marketWorkspaceSource = sourceBetween('if (activeWorkAreaId === "market")', 'if (activeWorkAreaId === "strategy")');

    expect(appSource).toContain("loadMarketCalendarStatus");
    expect(appSource).toContain("const [marketCalendarState, setMarketCalendarState]");
    expect(appSource).toContain("refreshMarketCalendarStatus");
    expect(appSource).toContain("workspace.selectedInstrument.market");
    expect(marketWorkspaceSource).toContain("<MarketCalendarStatusCard");
    expect(marketWorkspaceSource).toContain("calendar={marketCalendarState.calendar}");
    expect(appSource).toContain("function MarketCalendarStatusCard");
    expect(appSource).toContain("className={`market-calendar-card ${status} ${className ?? \"\"}`}");
    expect(appSource).toContain("marketCalendarStatusLabel");
    expect(cssBlock(".market-calendar-card")).toContain("display: grid;");
    expect(cssBlock(".market-calendar-grid")).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
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
    expect(appSource).toContain("buildBacktestRunComparisonMatrixRows(runHistory");
    expect(appSource).toContain("buildBacktestRunComparisonMatrixSummary(backtestRunComparisonMatrixRows)");
    expect(appSource).toContain("filterBacktestRunComparisonMatrixRows");
    expect(appSource).toContain("workspaceWithBacktestParameterCandidate");
    expect(appSource).toContain("buildBacktestReportMarkdown(workspace, runHistory)");
    expect(appSource).toContain("buildBacktestReportAuditEvent({");
    expect(appSource).toContain("saveAuditEvent(quantCoreBaseUrl, backtestReportAuditEvent)");
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
    expect(appSource).toContain("runComparisonMatrixRows={backtestRunComparisonMatrixRows}");
    expect(appSource).toContain("runComparisonMatrixSummary={backtestRunComparisonMatrixSummary}");
    expect(appSource).toContain('className="backtest-evidence-grid"');
    expect(appSource).toContain('className="backtest-run-comparison-matrix"');
    expect(appSource).toContain('className="backtest-readiness-list"');
    expect(appSource).toContain('className="backtest-diagnostic-strip"');
    expect(styles).toContain(".backtest-evidence-grid");
    expect(styles).toContain(".backtest-readiness-list");
    expect(styles).toContain(".backtest-diagnostic-strip");
    expect(styles).toContain(".backtest-report");
    expect(styles).toContain(".backtest-report-hero");
    expect(styles).toContain(".backtest-benchmark-strip");
    expect(styles).toContain(".backtest-report-grid");
    expect(styles).toContain(".backtest-run-comparison-matrix");
    expect(styles).toContain(".backtest-run-comparison-row");
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
        "  .loop-step-copy,\n  .work-area-copy,\n  .work-area-stage,\n  .work-area-status,\n  .workflow-next-action,\n  .left-rail .workspace-card",
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

  test("renders portfolio paper order approvals as operator actions", () => {
    expect(appSource).toContain("loadPortfolioPaperOrderApprovals");
    expect(appSource).toContain("recordPortfolioPaperOrderApproval");
    expect(appSource).toContain("buildPortfolioPaperOrderApprovalRows");
    expect(appSource).toContain("portfolioPaperOrderApprovalRows");
    expect(appSource).toContain("onApprovePortfolioOrder");
    expect(appSource).toContain("onRejectPortfolioOrder");
    expect(appSource).toContain('className="portfolio-order-approval"');
    expect(appSource).toContain('className={`portfolio-order-approval-row');
    expect(styles).toContain(".portfolio-order-approval");
    expect(styles).toContain(".portfolio-order-approval-actions");
  });

  test("renders portfolio paper order simulations as paper-only fills", () => {
    expect(appSource).toContain("loadPortfolioPaperOrderSimulations");
    expect(appSource).toContain("recordPortfolioPaperOrderSimulation");
    expect(appSource).toContain("portfolioPaperOrderSimulations");
    expect(appSource).toContain("onSimulatePortfolioOrder");
    expect(appSource).toContain("simulatingPortfolioOrderId");
    expect(appSource).toContain('className="portfolio-order-simulation"');
    expect(appSource).toContain('className="portfolio-order-simulation-list"');
    expect(styles).toContain(".portfolio-order-simulation");
    expect(styles).toContain(".portfolio-order-simulation-list");
  });

  test("renders the latest portfolio paper fill as a timeline focus cue", () => {
    expect(appSource).toContain("buildPortfolioPaperOrderLatestSimulationSummary");
    expect(appSource).toContain("portfolioPaperOrderSimulations");
    expect(appSource).toContain("portfolioPaperOrderReplay");
    expect(appSource).toContain("portfolioPaperOrderStateHistories");
    expect(appSource).toContain("portfolioOrderLatestSimulationSummary");
    expect(appSource).toContain("setPortfolioOrderFocusedStateId");
    expect(appSource).toContain('className={`portfolio-order-latest-simulation ${portfolioOrderLatestSimulationSummary.tone}`}');
    expect(appSource).toContain('className={`portfolio-order-state-row ${row.tone}${');
    expect(styles).toContain(".portfolio-order-latest-simulation");
    expect(styles).toContain(".portfolio-order-latest-simulation-action");
    expect(styles).toContain(".portfolio-order-state-row.focused");
  });

  test("renders portfolio paper simulation route checks before fills", () => {
    expect(appSource).toContain("buildPortfolioPaperOrderSimulationRouteRows");
    expect(appSource).toContain("portfolioPaperOrderSimulationRouteRows");
    expect(appSource).toContain("portfolioOrderSimulationRouteRows");
    expect(appSource).toContain('className="portfolio-simulation-route"');
    expect(appSource).toContain('className={`portfolio-simulation-route-row ${row.tone}`}');
    expect(styles).toContain(".portfolio-simulation-route");
    expect(styles).toContain(".portfolio-simulation-route-row");
  });

  test("renders portfolio paper order replay as account and position state", () => {
    expect(appSource).toContain("loadPortfolioPaperOrderReplay");
    expect(appSource).toContain("buildPortfolioPaperOrderReplaySummaryTiles(portfolioPaperOrderReplay)");
    expect(appSource).toContain("buildPortfolioPaperOrderReplayPositionRows(portfolioPaperOrderReplay)");
    expect(appSource).toContain("portfolioOrderReplaySummaryTiles");
    expect(appSource).toContain("portfolioOrderReplayPositionRows");
    expect(appSource).toContain('className="execution-grid portfolio-replay-grid"');
    expect(appSource).toContain('className="portfolio-order-replay"');
    expect(appSource).toContain('className="portfolio-order-replay-table"');
    expect(styles).toContain(".portfolio-replay-grid");
    expect(styles).toContain(".portfolio-order-replay");
    expect(styles).toContain(".portfolio-order-replay-row");
  });

  test("renders portfolio paper order state history as a compact timeline", () => {
    expect(appSource).toContain("loadPortfolioPaperOrderStateHistory");
    expect(appSource).toContain("buildPortfolioPaperOrderStateHistoryRows(portfolioPaperOrderStateHistories)");
    expect(appSource).toContain("portfolioOrderStateHistoryRows");
    expect(appSource).toContain('className="portfolio-order-state-history"');
    expect(appSource).toContain('className={`portfolio-order-state-row');
    expect(styles).toContain(".portfolio-order-state-history");
    expect(styles).toContain(".portfolio-order-state-row");
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

  test("restores paper execution context from a copied P0 execution evidence link", () => {
    const paperDeepLinkSource = sourceBetween("function resolveInitialPaperExecutionDeepLink()", "function resolveInitialWatchlistCacheRefreshRunId()");
    const loadPaperDeepLinkSource = sourceBetween("const loadPaperExecutionDeepLink = useCallback(", "const replayRun = useCallback(");

    expect(appSource).toContain("interface InitialPaperExecutionDeepLink");
    expect(appSource).toContain("type PaperExecutionDeepLinkStatus = InitialPaperExecutionDeepLink");
    expect(appSource).toContain("function resolveInitialPaperExecutionDeepLink(): InitialPaperExecutionDeepLink | null");
    expect(appSource).toContain('if (params.get("paperExecution")?.trim())');
    expect(paperDeepLinkSource).toContain('const executionId = params.get("paperExecution")?.trim();');
    expect(paperDeepLinkSource).toContain('const runId = params.get("runId")?.trim();');
    expect(paperDeepLinkSource).toContain("return { executionId, runId };");
    expect(appSource).toContain("const initialPaperExecutionDeepLink = resolveInitialPaperExecutionDeepLink();");
    expect(appSource).toContain("const initialPaperExecutionDeepLinkRef = useRef(initialPaperExecutionDeepLink);");
    expect(appSource).toContain("const [paperExecutionDeepLinkStatus, setPaperExecutionDeepLinkStatus]");
    expect(loadPaperDeepLinkSource).toContain("const detail = await loadResearchRunDetail(quantCoreBaseUrl, deepLink.runId);");
    expect(loadPaperDeepLinkSource).toContain('setPaperExecutionDeepLinkStatus({ ...deepLink, status: "loading", error: null });');
    expect(loadPaperDeepLinkSource).toContain("loadLatestResearchRunPaperExecution(quantCoreBaseUrl, auditedRun.runId)");
    expect(loadPaperDeepLinkSource).toContain("loadResearchRunPromotion(quantCoreBaseUrl, auditedRun.runId)");
    expect(loadPaperDeepLinkSource).toContain("paperHistory.execution?.executionId !== deepLink.executionId");
    expect(loadPaperDeepLinkSource).toContain('setPaperExecutionDeepLinkStatus({ ...deepLink, status: "failed", error: message });');
    expect(loadPaperDeepLinkSource).toContain('setPaperExecutionDeepLinkStatus({ ...deepLink, status: "loaded", error: null });');
    expect(loadPaperDeepLinkSource).toContain('setActiveWorkAreaId("execution");');
    expect(loadPaperDeepLinkSource).toContain('setActiveLoopStepId("paper");');
    expect(loadPaperDeepLinkSource).toContain("workspaceFromResearchRunAudit(current.workspace, auditedRun)");
    expect(appSource).toContain('className={`p0-paper-deep-link ${paperExecutionDeepLinkStatus.status}`}');
    expect(appSource).toContain("paperExecutionDeepLinkStatusLabel(i18n, paperExecutionDeepLinkStatus.status)");
    expect(styles).toContain(".p0-paper-deep-link");
    expect(styles).toContain(".p0-paper-deep-link.failed");
    expect(appSource).toContain("const deepLink = initialPaperExecutionDeepLinkRef.current;");
    expect(appSource).toContain("initialPaperExecutionDeepLinkRef.current = null;");
    expect(appSource).toContain("void loadPaperExecutionDeepLink(deepLink);");
  });

  test("gates paper execution actions by audit binding with Golden Path rebind recovery", () => {
    expect(appSource).toContain("buildResearchRunContextBinding");
    expect(appSource).toContain("const researchRunContextBinding = buildResearchRunContextBinding(workspace)");
    expect(appSource).toContain("const currentResearchRunId = researchRunContextBinding.canUseRun ? workspace.researchRun?.runId : null");
    expect(appSource).toContain("const canRebindGoldenPathRun = Boolean(goldenPath?.latestRunId) && !researchRunContextBinding.canUseRun;");
    expect(appSource).toContain("!canRebindGoldenPathRun &&");
    expect(appSource).toContain('riskApprovalSummary.status === "blocked"');
    expect(appSource).not.toContain("return isSubmittingPaperExecution || !workspace.researchRun?.runId");
  });

  test("renders execution promotion readiness as a separate queue after paper execution", () => {
    expect(appSource).toContain("buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows");
    expect(appSource).toContain("loadResearchRunPromotion(quantCoreBaseUrl");
    expect(appSource).toContain("setPromotionCandidateRecord(result.promotion ?? null)");
    expect(appSource).toContain("activePromotionCandidateRecord ??");
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

  test("renders promotion certification evidence from recorded adapter certifications", () => {
    expect(appSource).toContain(
      "buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows"
    );
    expect(appSource).toContain("adapterCertificationRows={executionAdapterCertificationRows}");
    expect(appSource).toContain("adapterCertificationApplyRows={executionAdapterCertificationApplyRows}");
    expect(appSource).toContain("adapterCertificationRows: ExecutionAdapterCertificationRow[]");
    expect(appSource).toContain("adapterCertificationApplyRows: ExecutionAdapterCertificationApplyRow[]");
    expect(appSource).toContain('className="promotion-certification-evidence"');
    expect(appSource).toContain('className={`promotion-certification-evidence-row');
    expect(appSource).toContain('className="promotion-certification-apply-evidence"');
    expect(appSource).toContain('className={`promotion-certification-apply-evidence-row');
    expect(appSource).toContain("promotionCertificationBoundaryLabel(i18n, row.boundary)");
    expect(appSource).toContain("adapterCertificationApplyStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterCertificationApplyConfirmationSummary(i18n, row.confirmationSummary)");
    expect(styles).toContain(".promotion-certification-evidence");
    expect(styles).toContain(".promotion-certification-evidence-row");
    expect(styles).toContain(".promotion-certification-apply-evidence");
    expect(styles).toContain(".promotion-certification-apply-evidence-row");
  });

  test("renders controlled restart evidence history in promotion queue", () => {
    expect(appSource).toContain("loadExecutionAdapterControlledRestartEvidence(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterControlledRestartEvidence(restartEvidenceResults.flatMap((result) => result.controlledRestartEvidence))"
    );
    expect(appSource).toContain(
      "buildExecutionAdapterControlledRestartEvidenceRows(executionAdapterControlledRestartEvidence)"
    );
    expect(appSource).toContain(
      "buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows"
    );
    expect(appSource).toContain(
      "adapterControlledRestartEvidenceRows={executionAdapterControlledRestartEvidenceRows}"
    );
    expect(appSource).toContain("adapterControlledRestartEvidenceRows: ExecutionAdapterControlledRestartEvidenceRow[]");
    expect(appSource).toContain('className="promotion-controlled-restart-evidence"');
    expect(appSource).toContain('className={`promotion-controlled-restart-evidence-row');
    expect(appSource).toContain("adapterControlledRestartEvidenceStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterControlledRestartEvidenceConfirmationSummary(i18n, row.confirmationSummary)");
    expect(styles).toContain(".promotion-controlled-restart-evidence");
    expect(styles).toContain(".promotion-controlled-restart-evidence-row");
  });

  test("renders restart acceptance history in promotion queue", () => {
    expect(appSource).toContain("loadExecutionAdapterRestartAcceptances(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterRestartAcceptances(restartAcceptanceResults.flatMap((result) => result.restartAcceptances))"
    );
    expect(appSource).toContain("buildExecutionAdapterRestartAcceptanceRows(executionAdapterRestartAcceptances)");
    expect(appSource).toContain(
      "buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows, executionAdapterRestartAcceptanceRows, executionAdapterSecretReferenceRows, executionAdapterSecretMaterializationRows, executionAdapterEnvironmentBindingRows, executionAdapterRuntimeReloadPlanRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterHumanConfirmationRows, executionAdapterSandboxProbeExecutionRows)"
    );
    expect(appSource).toContain("adapterRestartAcceptanceRows={executionAdapterRestartAcceptanceRows}");
    expect(appSource).toContain("adapterRestartAcceptanceRows: ExecutionAdapterRestartAcceptanceRow[]");
    expect(appSource).toContain('className="promotion-restart-acceptance"');
    expect(appSource).toContain('className={`promotion-restart-acceptance-row');
    expect(appSource).toContain("adapterRestartAcceptanceStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterRestartAcceptanceConfirmationSummary(i18n, row.confirmationSummary)");
    expect(styles).toContain(".promotion-restart-acceptance");
    expect(styles).toContain(".promotion-restart-acceptance-row");
  });

  test("renders secret reference history in promotion queue", () => {
    expect(appSource).toContain("loadExecutionAdapterSecretReferences(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterSecretReferences(secretReferenceResults.flatMap((result) => result.adapterSecretReferences))"
    );
    expect(appSource).toContain("buildExecutionAdapterSecretReferenceRows(executionAdapterSecretReferences)");
    expect(appSource).toContain(
      "buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows, executionAdapterRestartAcceptanceRows, executionAdapterSecretReferenceRows, executionAdapterSecretMaterializationRows, executionAdapterEnvironmentBindingRows, executionAdapterRuntimeReloadPlanRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterHumanConfirmationRows, executionAdapterSandboxProbeExecutionRows)"
    );
    expect(appSource).toContain("adapterSecretReferenceRows={executionAdapterSecretReferenceRows}");
    expect(appSource).toContain("adapterSecretReferenceRows: ExecutionAdapterSecretReferenceRow[]");
    expect(appSource).toContain('className="promotion-secret-reference-evidence"');
    expect(appSource).toContain('className={`promotion-secret-reference-evidence-row');
    expect(appSource).toContain("adapterSecretReferenceStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterSecretReferenceConfirmationSummary(i18n, row.confirmationSummary)");
    expect(styles).toContain(".promotion-secret-reference-evidence");
    expect(styles).toContain(".promotion-secret-reference-evidence-row");
  });

  test("renders secret materialization history in promotion queue", () => {
    expect(appSource).toContain("loadExecutionAdapterSecretMaterializations(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterSecretMaterializations(materializationResults.flatMap((result) => result.adapterSecretMaterializations))"
    );
    expect(appSource).toContain("buildExecutionAdapterSecretMaterializationRows(executionAdapterSecretMaterializations)");
    expect(appSource).toContain(
      "buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows, executionAdapterRestartAcceptanceRows, executionAdapterSecretReferenceRows, executionAdapterSecretMaterializationRows, executionAdapterEnvironmentBindingRows, executionAdapterRuntimeReloadPlanRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterHumanConfirmationRows, executionAdapterSandboxProbeExecutionRows)"
    );
    expect(appSource).toContain("adapterSecretMaterializationRows={executionAdapterSecretMaterializationRows}");
    expect(appSource).toContain("adapterSecretMaterializationRows: ExecutionAdapterSecretMaterializationRow[]");
    expect(appSource).toContain('className="promotion-secret-materialization-evidence"');
    expect(appSource).toContain('className={`promotion-secret-materialization-evidence-row');
    expect(appSource).toContain("adapterSecretMaterializationStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterSecretMaterializationConfirmationSummary(i18n, row.confirmationSummary)");
    expect(styles).toContain(".promotion-secret-materialization-evidence");
    expect(styles).toContain(".promotion-secret-materialization-evidence-row");
  });

  test("renders environment binding, runtime reload plan, runtime reload execution, and acceptance history in promotion queue", () => {
    expect(appSource).toContain("loadExecutionAdapterEnvironmentBindings(quantCoreBaseUrl");
    expect(appSource).toContain("loadExecutionAdapterRuntimeReloadPlans(quantCoreBaseUrl");
    expect(appSource).toContain("loadExecutionAdapterRuntimeReloadExecutions(quantCoreBaseUrl");
    expect(appSource).toContain("loadExecutionAdapterRuntimeReloadAcceptances(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterEnvironmentBindings(environmentBindingResults.flatMap((result) => result.adapterEnvironmentBindings))"
    );
    expect(appSource).toContain(
      "setExecutionAdapterRuntimeReloadPlans(runtimeReloadPlanResults.flatMap((result) => result.adapterRuntimeReloadPlans))"
    );
    expect(appSource).toContain(
      "setExecutionAdapterRuntimeReloadExecutions(runtimeReloadExecutionResults.flatMap((result) => result.adapterRuntimeReloadExecutions))"
    );
    expect(appSource).toContain(
      "setExecutionAdapterRuntimeReloadAcceptances(runtimeReloadAcceptanceResults.flatMap((result) => result.adapterRuntimeReloadAcceptances))"
    );
    expect(appSource).toContain("buildExecutionAdapterEnvironmentBindingRows(executionAdapterEnvironmentBindings)");
    expect(appSource).toContain("buildExecutionAdapterRuntimeReloadPlanRows(executionAdapterRuntimeReloadPlans)");
    expect(appSource).toContain("const executionAdapterRuntimeReloadExecutionRows = buildExecutionAdapterRuntimeReloadExecutionRows(");
    expect(appSource).toContain("executionAdapterRuntimeReloadExecutions");
    expect(appSource).toContain("const executionAdapterRuntimeReloadAcceptanceRows = buildExecutionAdapterRuntimeReloadAcceptanceRows(");
    expect(appSource).toContain("executionAdapterRuntimeReloadAcceptances");
    expect(appSource).toContain(
      "buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows, executionAdapterRestartAcceptanceRows, executionAdapterSecretReferenceRows, executionAdapterSecretMaterializationRows, executionAdapterEnvironmentBindingRows, executionAdapterRuntimeReloadPlanRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterHumanConfirmationRows, executionAdapterSandboxProbeExecutionRows)"
    );
    expect(appSource).toContain("adapterEnvironmentBindingRows={executionAdapterEnvironmentBindingRows}");
    expect(appSource).toContain("adapterRuntimeReloadPlanRows={executionAdapterRuntimeReloadPlanRows}");
    expect(appSource).toContain("adapterRuntimeReloadExecutionRows={executionAdapterRuntimeReloadExecutionRows}");
    expect(appSource).toContain("adapterRuntimeReloadAcceptanceRows={executionAdapterRuntimeReloadAcceptanceRows}");
    expect(appSource).toContain("adapterEnvironmentBindingRows: ExecutionAdapterEnvironmentBindingRow[]");
    expect(appSource).toContain("adapterRuntimeReloadPlanRows: ExecutionAdapterRuntimeReloadPlanRow[]");
    expect(appSource).toContain("adapterRuntimeReloadExecutionRows: ExecutionAdapterRuntimeReloadExecutionRow[]");
    expect(appSource).toContain("adapterRuntimeReloadAcceptanceRows: ExecutionAdapterRuntimeReloadAcceptanceRow[]");
    expect(appSource).toContain('className="promotion-environment-binding-evidence"');
    expect(appSource).toContain('className={`promotion-environment-binding-evidence-row');
    expect(appSource).toContain('className="promotion-runtime-reload-plan-evidence"');
    expect(appSource).toContain('className={`promotion-runtime-reload-plan-evidence-row');
    expect(appSource).toContain('className="promotion-runtime-reload-execution-evidence"');
    expect(appSource).toContain('className={`promotion-runtime-reload-execution-evidence-row');
    expect(appSource).toContain('className="promotion-runtime-reload-acceptance-evidence"');
    expect(appSource).toContain('className={`promotion-runtime-reload-acceptance-evidence-row');
    expect(appSource).toContain("adapterEnvironmentBindingStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterRuntimeReloadPlanStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterRuntimeReloadExecutionStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterRuntimeReloadExecutionConfirmationSummary(i18n, row.confirmationSummary)");
    expect(appSource).toContain("adapterRuntimeReloadAcceptanceStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterRuntimeReloadAcceptanceConfirmationSummary(i18n, row.confirmationSummary)");
    expect(styles).toContain(".promotion-environment-binding-evidence");
    expect(styles).toContain(".promotion-environment-binding-evidence-row");
    expect(styles).toContain(".promotion-runtime-reload-plan-evidence");
    expect(styles).toContain(".promotion-runtime-reload-plan-evidence-row");
    expect(styles).toContain(".promotion-runtime-reload-execution-evidence");
    expect(styles).toContain(".promotion-runtime-reload-execution-evidence-row");
    expect(styles).toContain(".promotion-runtime-reload-acceptance-evidence");
    expect(styles).toContain(".promotion-runtime-reload-acceptance-evidence-row");
  });

  test("renders runtime reload acceptance recording controls in platform settings", () => {
    expect(appSource).toContain("recordExecutionAdapterRuntimeReloadAcceptance,");
    expect(appSource).toContain("interface ExecutionAdapterRuntimeReloadAcceptanceConfirmations");
    expect(appSource).toContain(
      "const [adapterRuntimeReloadAcceptanceConfirmations, setAdapterRuntimeReloadAcceptanceConfirmations]"
    );
    expect(appSource).toContain(
      "const [recordingAdapterRuntimeReloadAcceptanceId, setRecordingAdapterRuntimeReloadAcceptanceId]"
    );
    expect(appSource).toContain("const updateAdapterRuntimeReloadAcceptanceConfirmation = useCallback");
    expect(appSource).toContain("const recordAdapterRuntimeReloadAcceptance = useCallback");
    expect(appSource).toContain("recordExecutionAdapterRuntimeReloadAcceptance(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterRuntimeReloadAcceptances((current) => ["
    );
    expect(appSource).toContain(
      "runtimeReloadAcceptanceConfirmations={adapterRuntimeReloadAcceptanceConfirmations}"
    );
    expect(appSource).toContain(
      "recordingRuntimeReloadAcceptanceId={recordingAdapterRuntimeReloadAcceptanceId}"
    );
    expect(appSource).toContain("runtimeReloadExecutionRows={executionAdapterRuntimeReloadExecutionRows}");
    expect(appSource).toContain("runtimeReloadAcceptanceRows={executionAdapterRuntimeReloadAcceptanceRows}");
    expect(appSource).toContain("onRecordRuntimeReloadAcceptance={recordAdapterRuntimeReloadAcceptance}");
    expect(appSource).toContain(
      "onRuntimeReloadAcceptanceConfirmationChange={updateAdapterRuntimeReloadAcceptanceConfirmation}"
    );
    expect(appSource).toContain("runtimeReloadAcceptanceConfirmations: Record<string, ExecutionAdapterRuntimeReloadAcceptanceConfirmations>");
    expect(appSource).toContain("runtimeReloadAcceptanceRows: ExecutionAdapterRuntimeReloadAcceptanceRow[]");
    expect(appSource).toContain("runtimeReloadExecutionRows: ExecutionAdapterRuntimeReloadExecutionRow[]");
    expect(appSource).toContain('className="adapter-runtime-reload-acceptance-list"');
    expect(appSource).toContain('className={`adapter-runtime-reload-acceptance-row');
    expect(appSource).toContain('className={`adapter-runtime-reload-acceptance-confirmation');
    expect(appSource).toContain("adapterRuntimeReloadAcceptanceStatusLabel(i18n, acceptance.statusLabel)");
    expect(appSource).toContain("adapterRuntimeReloadAcceptanceConfirmationSummary(i18n, acceptance.confirmationSummary)");
    expect(styles).toContain(".adapter-runtime-reload-acceptance-list");
    expect(styles).toContain(".adapter-runtime-reload-acceptance-row");
    expect(styles).toContain(".adapter-runtime-reload-acceptance-confirmation");
  });

  test("renders adapter orchestration dry run history in promotion queue", () => {
    expect(appSource).toContain("loadExecutionAdapterOrchestrationDryRuns(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterOrchestrationDryRuns(orchestrationDryRunResults.flatMap((result) => result.adapterOrchestrationDryRuns))"
    );
    expect(appSource).toContain("const executionAdapterOrchestrationDryRunRows = buildExecutionAdapterOrchestrationDryRunRows(");
    expect(appSource).toContain("executionAdapterOrchestrationDryRuns");
    expect(appSource).toContain("adapterOrchestrationDryRunRows={executionAdapterOrchestrationDryRunRows}");
    expect(appSource).toContain("adapterOrchestrationDryRunRows: ExecutionAdapterOrchestrationDryRunRow[]");
    expect(appSource).toContain('className="promotion-orchestration-dry-run-evidence"');
    expect(appSource).toContain('className={`promotion-orchestration-dry-run-evidence-row');
    expect(appSource).toContain("adapterOrchestrationDryRunStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterOrchestrationDryRunConfirmationSummary(i18n, row.confirmationSummary)");
    expect(styles).toContain(".promotion-orchestration-dry-run-evidence");
    expect(styles).toContain(".promotion-orchestration-dry-run-evidence-row");
  });

  test("renders adapter orchestration dry run recording controls in platform settings", () => {
    expect(appSource).toContain("recordExecutionAdapterOrchestrationDryRun,");
    expect(appSource).toContain("interface ExecutionAdapterOrchestrationDryRunConfirmations");
    expect(appSource).toContain(
      "const [adapterOrchestrationDryRunConfirmations, setAdapterOrchestrationDryRunConfirmations]"
    );
    expect(appSource).toContain(
      "const [recordingAdapterOrchestrationDryRunId, setRecordingAdapterOrchestrationDryRunId]"
    );
    expect(appSource).toContain("const updateAdapterOrchestrationDryRunConfirmation = useCallback");
    expect(appSource).toContain("const recordAdapterOrchestrationDryRun = useCallback");
    expect(appSource).toContain("recordExecutionAdapterOrchestrationDryRun(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterOrchestrationDryRuns((current) => [");
    expect(appSource).toContain(
      "orchestrationDryRunConfirmations={adapterOrchestrationDryRunConfirmations}"
    );
    expect(appSource).toContain(
      "recordingOrchestrationDryRunId={recordingAdapterOrchestrationDryRunId}"
    );
    expect(appSource).toContain("orchestrationDryRunRows={executionAdapterOrchestrationDryRunRows}");
    expect(appSource).toContain("onRecordOrchestrationDryRun={recordAdapterOrchestrationDryRun}");
    expect(appSource).toContain(
      "onOrchestrationDryRunConfirmationChange={updateAdapterOrchestrationDryRunConfirmation}"
    );
    expect(appSource).toContain("orchestrationDryRunConfirmations: Record<string, ExecutionAdapterOrchestrationDryRunConfirmations>");
    expect(appSource).toContain("orchestrationDryRunRows: ExecutionAdapterOrchestrationDryRunRow[]");
    expect(appSource).toContain('className="adapter-orchestration-dry-run-list"');
    expect(appSource).toContain('className={`adapter-orchestration-dry-run-row');
    expect(appSource).toContain('className={`adapter-orchestration-dry-run-confirmation');
    expect(appSource).toContain("adapterOrchestrationDryRunStatusLabel(i18n, dryRun.statusLabel)");
    expect(appSource).toContain("adapterOrchestrationDryRunConfirmationSummary(i18n, dryRun.confirmationSummary)");
    expect(styles).toContain(".adapter-orchestration-dry-run-list");
    expect(styles).toContain(".adapter-orchestration-dry-run-row");
    expect(styles).toContain(".adapter-orchestration-dry-run-confirmation");
  });

  test("renders adapter orchestration execution history in promotion queue", () => {
    expect(appSource).toContain("loadExecutionAdapterOrchestrationExecutions(quantCoreBaseUrl");
    expect(appSource).toContain(
      "setExecutionAdapterOrchestrationExecutions(orchestrationExecutionResults.flatMap((result) => result.adapterOrchestrationExecutions))"
    );
    expect(appSource).toContain("const executionAdapterOrchestrationExecutionRows = buildExecutionAdapterOrchestrationExecutionRows(");
    expect(appSource).toContain("executionAdapterOrchestrationExecutions");
    expect(appSource).toContain("adapterOrchestrationExecutionRows={executionAdapterOrchestrationExecutionRows}");
    expect(appSource).toContain("adapterOrchestrationExecutionRows: ExecutionAdapterOrchestrationExecutionRow[]");
    expect(appSource).toContain('className="promotion-orchestration-execution-evidence"');
    expect(appSource).toContain('className={`promotion-orchestration-execution-evidence-row');
    expect(appSource).toContain('className="promotion-orchestration-execution-empty"');
    expect(appSource).toContain("等待受控编排执行证据");
    expect(appSource).toContain("adapterOrchestrationExecutionStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterOrchestrationExecutionConfirmationSummary(i18n, row.confirmationSummary)");
    expect(styles).toContain(".promotion-orchestration-execution-evidence");
    expect(styles).toContain(".promotion-orchestration-execution-evidence-row");
    expect(styles).toContain(".promotion-orchestration-execution-empty");
  });

  test("renders adapter orchestration execution recording controls in platform settings", () => {
    expect(appSource).toContain("recordExecutionAdapterOrchestrationExecution,");
    expect(appSource).toContain("interface ExecutionAdapterOrchestrationExecutionConfirmations");
    expect(appSource).toContain(
      "const [adapterOrchestrationExecutionConfirmations, setAdapterOrchestrationExecutionConfirmations]"
    );
    expect(appSource).toContain(
      "const [recordingAdapterOrchestrationExecutionId, setRecordingAdapterOrchestrationExecutionId]"
    );
    expect(appSource).toContain("const updateAdapterOrchestrationExecutionConfirmation = useCallback");
    expect(appSource).toContain("const recordAdapterOrchestrationExecution = useCallback");
    expect(appSource).toContain("recordExecutionAdapterOrchestrationExecution(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterOrchestrationExecutions((current) => [");
    expect(appSource).toContain(
      "orchestrationExecutionConfirmations={adapterOrchestrationExecutionConfirmations}"
    );
    expect(appSource).toContain(
      "recordingOrchestrationExecutionId={recordingAdapterOrchestrationExecutionId}"
    );
    expect(appSource).toContain("orchestrationExecutionRows={executionAdapterOrchestrationExecutionRows}");
    expect(appSource).toContain("onRecordOrchestrationExecution={recordAdapterOrchestrationExecution}");
    expect(appSource).toContain(
      "onOrchestrationExecutionConfirmationChange={updateAdapterOrchestrationExecutionConfirmation}"
    );
    expect(appSource).toContain("orchestrationExecutionConfirmations: Record<string, ExecutionAdapterOrchestrationExecutionConfirmations>");
    expect(appSource).toContain("orchestrationExecutionRows: ExecutionAdapterOrchestrationExecutionRow[]");
    expect(appSource).toContain('className="adapter-orchestration-execution-list"');
    expect(appSource).toContain('className={`adapter-orchestration-execution-row');
    expect(appSource).toContain('className={`adapter-orchestration-execution-confirmation');
    expect(appSource).toContain("adapterOrchestrationExecutionStatusLabel(i18n, execution.statusLabel)");
    expect(appSource).toContain("adapterOrchestrationExecutionConfirmationSummary(i18n, execution.confirmationSummary)");
    expect(styles).toContain(".adapter-orchestration-execution-list");
    expect(styles).toContain(".adapter-orchestration-execution-row");
    expect(styles).toContain(".adapter-orchestration-execution-confirmation");
  });

  test("renders adapter human confirmation history and recording controls", () => {
    expect(appSource).toContain("loadExecutionAdapterHumanConfirmations(quantCoreBaseUrl");
    expect(appSource).toContain("recordExecutionAdapterHumanConfirmation,");
    expect(appSource).toContain(
      "setExecutionAdapterHumanConfirmations(humanConfirmationResults.flatMap((result) => result.adapterHumanConfirmations))"
    );
    expect(appSource).toContain("const executionAdapterHumanConfirmationRows = buildExecutionAdapterHumanConfirmationRows(");
    expect(appSource).toContain("executionAdapterHumanConfirmations");
    expect(appSource).toContain(
      "buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows, executionAdapterRestartAcceptanceRows, executionAdapterSecretReferenceRows, executionAdapterSecretMaterializationRows, executionAdapterEnvironmentBindingRows, executionAdapterRuntimeReloadPlanRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterHumanConfirmationRows, executionAdapterSandboxProbeExecutionRows)"
    );
    expect(appSource).toContain("adapterHumanConfirmationRows={executionAdapterHumanConfirmationRows}");
    expect(appSource).toContain("adapterHumanConfirmationRows: ExecutionAdapterHumanConfirmationRow[]");
    expect(appSource).toContain('className="promotion-human-confirmation-evidence"');
    expect(appSource).toContain('className={`promotion-human-confirmation-evidence-row');
    expect(appSource).toContain('className="promotion-human-confirmation-empty"');
    expect(appSource).toContain("等待最终人工确认");
    expect(appSource).toContain("adapterHumanConfirmationStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterHumanConfirmationConfirmationSummary(i18n, row.confirmationSummary)");
    expect(appSource).toContain("interface ExecutionAdapterHumanConfirmationConfirmations");
    expect(appSource).toContain(
      "const [adapterHumanConfirmationConfirmations, setAdapterHumanConfirmationConfirmations]"
    );
    expect(appSource).toContain(
      "const [recordingAdapterHumanConfirmationId, setRecordingAdapterHumanConfirmationId]"
    );
    expect(appSource).toContain("const updateAdapterHumanConfirmationConfirmation = useCallback");
    expect(appSource).toContain("const recordAdapterHumanConfirmation = useCallback");
    expect(appSource).toContain("recordExecutionAdapterHumanConfirmation(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterHumanConfirmations((current) => [");
    expect(appSource).toContain(
      "humanConfirmationConfirmations={adapterHumanConfirmationConfirmations}"
    );
    expect(appSource).toContain("recordingHumanConfirmationId={recordingAdapterHumanConfirmationId}");
    expect(appSource).toContain("humanConfirmationRows={executionAdapterHumanConfirmationRows}");
    expect(appSource).toContain("onRecordHumanConfirmation={recordAdapterHumanConfirmation}");
    expect(appSource).toContain(
      "onHumanConfirmationChange={updateAdapterHumanConfirmationConfirmation}"
    );
    expect(appSource).toContain("humanConfirmationConfirmations: Record<string, ExecutionAdapterHumanConfirmationConfirmations>");
    expect(appSource).toContain("humanConfirmationRows: ExecutionAdapterHumanConfirmationRow[]");
    expect(appSource).toContain('className="adapter-human-confirmation-list"');
    expect(appSource).toContain('className={`adapter-human-confirmation-row');
    expect(appSource).toContain('className={`adapter-human-confirmation-confirmation');
    expect(appSource).toContain("adapterHumanConfirmationStatusLabel(i18n, confirmation.statusLabel)");
    expect(appSource).toContain("adapterHumanConfirmationConfirmationSummary(i18n, confirmation.confirmationSummary)");
    expect(styles).toContain(".promotion-human-confirmation-evidence");
    expect(styles).toContain(".promotion-human-confirmation-evidence-row");
    expect(styles).toContain(".promotion-human-confirmation-empty");
    expect(styles).toContain(".adapter-human-confirmation-list");
    expect(styles).toContain(".adapter-human-confirmation-row");
    expect(styles).toContain(".adapter-human-confirmation-confirmation");
  });

  test("renders adapter sandbox probe plan history and recording controls", () => {
    expect(appSource).toContain("loadExecutionAdapterSandboxProbePlans(quantCoreBaseUrl");
    expect(appSource).toContain("recordExecutionAdapterSandboxProbePlan,");
    expect(appSource).toContain(
      "setExecutionAdapterSandboxProbePlans(sandboxProbePlanResults.flatMap((result) => result.adapterSandboxProbePlans))"
    );
    expect(appSource).toContain("const executionAdapterSandboxProbePlanRows = buildExecutionAdapterSandboxProbePlanRows(");
    expect(appSource).toContain("executionAdapterSandboxProbePlans");
    expect(appSource).toContain("adapterSandboxProbePlanRows={executionAdapterSandboxProbePlanRows}");
    expect(appSource).toContain("adapterSandboxProbePlanRows: ExecutionAdapterSandboxProbePlanRow[]");
    expect(appSource).toContain('className="promotion-sandbox-probe-plan-evidence"');
    expect(appSource).toContain('className={`promotion-sandbox-probe-plan-evidence-row');
    expect(appSource).toContain('className="promotion-sandbox-probe-plan-empty"');
    expect(appSource).toContain("等待 sandbox/testnet 探针计划");
    expect(appSource).toContain("adapterSandboxProbePlanStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterSandboxProbePlanConfirmationSummary(i18n, row.confirmationSummary)");
    expect(appSource).toContain("interface ExecutionAdapterSandboxProbePlanConfirmations");
    expect(appSource).toContain(
      "const [adapterSandboxProbePlanConfirmations, setAdapterSandboxProbePlanConfirmations]"
    );
    expect(appSource).toContain(
      "const [recordingAdapterSandboxProbePlanId, setRecordingAdapterSandboxProbePlanId]"
    );
    expect(appSource).toContain("const updateAdapterSandboxProbePlanConfirmation = useCallback");
    expect(appSource).toContain("const recordAdapterSandboxProbePlan = useCallback");
    expect(appSource).toContain("recordExecutionAdapterSandboxProbePlan(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterSandboxProbePlans((current) => [");
    expect(appSource).toContain(
      "sandboxProbePlanConfirmations={adapterSandboxProbePlanConfirmations}"
    );
    expect(appSource).toContain("recordingSandboxProbePlanId={recordingAdapterSandboxProbePlanId}");
    expect(appSource).toContain("sandboxProbePlanRows={executionAdapterSandboxProbePlanRows}");
    expect(appSource).toContain("onRecordSandboxProbePlan={recordAdapterSandboxProbePlan}");
    expect(appSource).toContain(
      "onSandboxProbePlanConfirmationChange={updateAdapterSandboxProbePlanConfirmation}"
    );
    expect(appSource).toContain("sandboxProbePlanConfirmations: Record<string, ExecutionAdapterSandboxProbePlanConfirmations>");
    expect(appSource).toContain("sandboxProbePlanRows: ExecutionAdapterSandboxProbePlanRow[]");
    expect(appSource).toContain('className="adapter-sandbox-probe-plan-list"');
    expect(appSource).toContain('className={`adapter-sandbox-probe-plan-row');
    expect(appSource).toContain('className={`adapter-sandbox-probe-plan-confirmation');
    expect(appSource).toContain("adapterSandboxProbePlanStatusLabel(i18n, probePlan.statusLabel)");
    expect(appSource).toContain("adapterSandboxProbePlanConfirmationSummary(i18n, probePlan.confirmationSummary)");
    expect(styles).toContain(".promotion-sandbox-probe-plan-evidence");
    expect(styles).toContain(".promotion-sandbox-probe-plan-evidence-row");
    expect(styles).toContain(".promotion-sandbox-probe-plan-empty");
    expect(styles).toContain(".adapter-sandbox-probe-plan-list");
    expect(styles).toContain(".adapter-sandbox-probe-plan-row");
    expect(styles).toContain(".adapter-sandbox-probe-plan-confirmation");
  });

  test("renders adapter sandbox probe execution history and recording controls", () => {
    expect(appSource).toContain("loadExecutionAdapterSandboxProbeExecutions(quantCoreBaseUrl");
    expect(appSource).toContain("recordExecutionAdapterSandboxProbeExecution,");
    expect(appSource).toContain(
      "setExecutionAdapterSandboxProbeExecutions("
    );
    expect(appSource).toContain("const executionAdapterSandboxProbeExecutionRows = buildExecutionAdapterSandboxProbeExecutionRows(");
    expect(appSource).toContain("executionAdapterSandboxProbeExecutions");
    expect(appSource).toContain(
      "buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows, executionAdapterRestartAcceptanceRows, executionAdapterSecretReferenceRows, executionAdapterSecretMaterializationRows, executionAdapterEnvironmentBindingRows, executionAdapterRuntimeReloadPlanRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterHumanConfirmationRows, executionAdapterSandboxProbeExecutionRows)"
    );
    expect(appSource).toContain("adapterSandboxProbeExecutionRows={executionAdapterSandboxProbeExecutionRows}");
    expect(appSource).toContain("adapterSandboxProbeExecutionRows: ExecutionAdapterSandboxProbeExecutionRow[]");
    expect(appSource).toContain('className="promotion-sandbox-probe-execution-evidence"');
    expect(appSource).toContain('className={`promotion-sandbox-probe-execution-evidence-row');
    expect(appSource).toContain('className="promotion-sandbox-probe-execution-empty"');
    expect(appSource).toContain("等待只读 sandbox/testnet 探针执行");
    expect(appSource).toContain("adapterSandboxProbeExecutionStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterSandboxProbeExecutionConfirmationSummary(i18n, row.confirmationSummary)");
    expect(appSource).toContain("interface ExecutionAdapterSandboxProbeExecutionConfirmations");
    expect(appSource).toContain(
      "const [adapterSandboxProbeExecutionConfirmations, setAdapterSandboxProbeExecutionConfirmations]"
    );
    expect(appSource).toContain(
      "const [recordingAdapterSandboxProbeExecutionId, setRecordingAdapterSandboxProbeExecutionId]"
    );
    expect(appSource).toContain("const updateAdapterSandboxProbeExecutionConfirmation = useCallback");
    expect(appSource).toContain("const recordAdapterSandboxProbeExecution = useCallback");
    expect(appSource).toContain("recordExecutionAdapterSandboxProbeExecution(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterSandboxProbeExecutions((current) => [");
    expect(appSource).toContain(
      "sandboxProbeExecutionConfirmations={adapterSandboxProbeExecutionConfirmations}"
    );
    expect(appSource).toContain("recordingSandboxProbeExecutionId={recordingAdapterSandboxProbeExecutionId}");
    expect(appSource).toContain("sandboxProbeExecutionRows={executionAdapterSandboxProbeExecutionRows}");
    expect(appSource).toContain("onRecordSandboxProbeExecution={recordAdapterSandboxProbeExecution}");
    expect(appSource).toContain(
      "onSandboxProbeExecutionConfirmationChange={updateAdapterSandboxProbeExecutionConfirmation}"
    );
    expect(appSource).toContain("sandboxProbeExecutionConfirmations: Record<string, ExecutionAdapterSandboxProbeExecutionConfirmations>");
    expect(appSource).toContain("sandboxProbeExecutionRows: ExecutionAdapterSandboxProbeExecutionRow[]");
    expect(appSource).toContain('className="adapter-sandbox-probe-execution-list"');
    expect(appSource).toContain('className={`adapter-sandbox-probe-execution-row');
    expect(appSource).toContain('className={`adapter-sandbox-probe-execution-confirmation');
    expect(appSource).toContain("adapterSandboxProbeExecutionStatusLabel(i18n, probeExecution.statusLabel)");
    expect(appSource).toContain("adapterSandboxProbeExecutionConfirmationSummary(i18n, probeExecution.confirmationSummary)");
    expect(styles).toContain(".promotion-sandbox-probe-execution-evidence");
    expect(styles).toContain(".promotion-sandbox-probe-execution-evidence-row");
    expect(styles).toContain(".promotion-sandbox-probe-execution-empty");
    expect(styles).toContain(".adapter-sandbox-probe-execution-list");
    expect(styles).toContain(".adapter-sandbox-probe-execution-row");
    expect(styles).toContain(".adapter-sandbox-probe-execution-confirmation");
  });

  test("renders adapter sandbox probe review history and recording controls", () => {
    expect(appSource).toContain("loadExecutionAdapterSandboxProbeReviews(quantCoreBaseUrl");
    expect(appSource).toContain("recordExecutionAdapterSandboxProbeReview,");
    expect(appSource).toContain(
      "setExecutionAdapterSandboxProbeReviews("
    );
    expect(appSource).toContain("const executionAdapterSandboxProbeReviewRows = buildExecutionAdapterSandboxProbeReviewRows(");
    expect(appSource).toContain("executionAdapterSandboxProbeReviews");
    expect(appSource).toContain("adapterSandboxProbeReviewRows={executionAdapterSandboxProbeReviewRows}");
    expect(appSource).toContain("adapterSandboxProbeReviewRows: ExecutionAdapterSandboxProbeReviewRow[]");
    expect(appSource).toContain('className="promotion-sandbox-probe-review-evidence"');
    expect(appSource).toContain('className={`promotion-sandbox-probe-review-evidence-row');
    expect(appSource).toContain('className="promotion-sandbox-probe-review-empty"');
    expect(appSource).toContain("等待 sandbox/testnet 探针复核");
    expect(appSource).toContain("adapterSandboxProbeReviewStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterSandboxProbeReviewConfirmationSummary(i18n, row.confirmationSummary)");
    expect(appSource).toContain("interface ExecutionAdapterSandboxProbeReviewConfirmations");
    expect(appSource).toContain(
      "const [adapterSandboxProbeReviewConfirmations, setAdapterSandboxProbeReviewConfirmations]"
    );
    expect(appSource).toContain(
      "const [recordingAdapterSandboxProbeReviewId, setRecordingAdapterSandboxProbeReviewId]"
    );
    expect(appSource).toContain("const updateAdapterSandboxProbeReviewConfirmation = useCallback");
    expect(appSource).toContain("const recordAdapterSandboxProbeReview = useCallback");
    expect(appSource).toContain("recordExecutionAdapterSandboxProbeReview(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterSandboxProbeReviews((current) => [");
    expect(appSource).toContain(
      "sandboxProbeReviewConfirmations={adapterSandboxProbeReviewConfirmations}"
    );
    expect(appSource).toContain("recordingSandboxProbeReviewId={recordingAdapterSandboxProbeReviewId}");
    expect(appSource).toContain("sandboxProbeReviewRows={executionAdapterSandboxProbeReviewRows}");
    expect(appSource).toContain("onRecordSandboxProbeReview={recordAdapterSandboxProbeReview}");
    expect(appSource).toContain(
      "onSandboxProbeReviewConfirmationChange={updateAdapterSandboxProbeReviewConfirmation}"
    );
    expect(appSource).toContain("sandboxProbeReviewConfirmations: Record<string, ExecutionAdapterSandboxProbeReviewConfirmations>");
    expect(appSource).toContain("sandboxProbeReviewRows: ExecutionAdapterSandboxProbeReviewRow[]");
    expect(appSource).toContain('className="adapter-sandbox-probe-review-list"');
    expect(appSource).toContain('className={`adapter-sandbox-probe-review-row');
    expect(appSource).toContain('className={`adapter-sandbox-probe-review-confirmation');
    expect(appSource).toContain("adapterSandboxProbeReviewStatusLabel(i18n, probeReview.statusLabel)");
    expect(appSource).toContain("adapterSandboxProbeReviewConfirmationSummary(i18n, probeReview.confirmationSummary)");
    expect(styles).toContain(".promotion-sandbox-probe-review-evidence");
    expect(styles).toContain(".promotion-sandbox-probe-review-evidence-row");
    expect(styles).toContain(".promotion-sandbox-probe-review-empty");
    expect(styles).toContain(".adapter-sandbox-probe-review-list");
    expect(styles).toContain(".adapter-sandbox-probe-review-row");
    expect(styles).toContain(".adapter-sandbox-probe-review-confirmation");
  });

  test("renders adapter production route review history and recording controls", () => {
    expect(appSource).toContain("loadExecutionAdapterProductionRouteReviews(quantCoreBaseUrl");
    expect(appSource).toContain("recordExecutionAdapterProductionRouteReview,");
    expect(appSource).toContain(
      "setExecutionAdapterProductionRouteReviews("
    );
    expect(appSource).toContain("const executionAdapterProductionRouteReviewRows = buildExecutionAdapterProductionRouteReviewRows(");
    expect(appSource).toContain("executionAdapterProductionRouteReviews");
    expect(appSource).toContain("adapterProductionRouteReviewRows={executionAdapterProductionRouteReviewRows}");
    expect(appSource).toContain("adapterProductionRouteReviewRows: ExecutionAdapterProductionRouteReviewRow[]");
    expect(appSource).toContain('className="promotion-production-route-review-evidence"');
    expect(appSource).toContain('className={`promotion-production-route-review-evidence-row');
    expect(appSource).toContain('className="promotion-production-route-review-empty"');
    expect(appSource).toContain("等待生产路由策略复核");
    expect(appSource).toContain("adapterProductionRouteReviewStatusLabel(i18n, row.statusLabel)");
    expect(appSource).toContain("adapterProductionRouteReviewConfirmationSummary(i18n, row.confirmationSummary)");
    expect(appSource).toContain("interface ExecutionAdapterProductionRouteReviewConfirmations");
    expect(appSource).toContain(
      "const [adapterProductionRouteReviewConfirmations, setAdapterProductionRouteReviewConfirmations]"
    );
    expect(appSource).toContain(
      "const [recordingAdapterProductionRouteReviewId, setRecordingAdapterProductionRouteReviewId]"
    );
    expect(appSource).toContain("const updateAdapterProductionRouteReviewConfirmation = useCallback");
    expect(appSource).toContain("const recordAdapterProductionRouteReview = useCallback");
    expect(appSource).toContain("recordExecutionAdapterProductionRouteReview(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterProductionRouteReviews((current) => [");
    expect(appSource).toContain(
      "productionRouteReviewConfirmations={adapterProductionRouteReviewConfirmations}"
    );
    expect(appSource).toContain("recordingProductionRouteReviewId={recordingAdapterProductionRouteReviewId}");
    expect(appSource).toContain("productionRouteReviewRows={executionAdapterProductionRouteReviewRows}");
    expect(appSource).toContain("onRecordProductionRouteReview={recordAdapterProductionRouteReview}");
    expect(appSource).toContain(
      "onProductionRouteReviewConfirmationChange={updateAdapterProductionRouteReviewConfirmation}"
    );
    expect(appSource).toContain("productionRouteReviewConfirmations: Record<string, ExecutionAdapterProductionRouteReviewConfirmations>");
    expect(appSource).toContain("productionRouteReviewRows: ExecutionAdapterProductionRouteReviewRow[]");
    expect(appSource).toContain('className="adapter-production-route-review-list"');
    expect(appSource).toContain('className={`adapter-production-route-review-row');
    expect(appSource).toContain('className={`adapter-production-route-review-confirmation');
    expect(appSource).toContain("adapterProductionRouteReviewStatusLabel(i18n, routeReview.statusLabel)");
    expect(appSource).toContain("adapterProductionRouteReviewConfirmationSummary(i18n, routeReview.confirmationSummary)");
    expect(styles).toContain(".promotion-production-route-review-evidence");
    expect(styles).toContain(".promotion-production-route-review-evidence-row");
    expect(styles).toContain(".promotion-production-route-review-empty");
    expect(styles).toContain(".adapter-production-route-review-list");
    expect(styles).toContain(".adapter-production-route-review-row");
    expect(styles).toContain(".adapter-production-route-review-confirmation");
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

  test("lets settings market data adapters open the matching cache workflow", () => {
    expect(appSource).toContain("resolveAdapterWorkflowInstrument(workspace, adapter.market)");
    expect(appSource).toContain("openMarketDataAdapterWorkflow");
    expect(appSource).toContain("onOpenMarketDataAdapterWorkflow={openMarketDataAdapterWorkflow}");
    expect(appSource).toContain("onOpenMarketDataAdapterWorkflow?:");
    expect(appSource).toContain("selectProductWorkArea(\"market\")");
    expect(appSource).toContain("onClick={() => onOpenMarketDataAdapterWorkflow(row)}");
    expect(appSource).toContain("打开缓存工作流");
    expect(appSource).toContain("Open cache workflow");
  });

  test("renders external source telemetry on settings market data adapters", () => {
    expect(appSource).toContain("marketDataAdapterExternalTelemetryLabel(i18n, row.externalTelemetry)");
    expect(appSource).toContain("marketDataAdapterInstallGuidanceLabel(i18n, row.externalTelemetry.installGuidance)");
    expect(appSource).toContain("marketDataAdapterProviderErrorLabel(i18n, row.externalTelemetry.lastProviderError)");
    expect(appSource).toContain("marketDataAdapterProviderHealthLabel(i18n, row.externalTelemetry.providerHealth)");
    expect(appSource).toContain("依赖可用");
    expect(appSource).toContain("Dependency ready");
    expect(appSource).toContain("依赖缺失");
    expect(appSource).toContain("Dependency missing");
    expect(appSource).toContain("健康");
    expect(appSource).toContain("Provider health");
    expect(appSource).toContain("建议退避");
    expect(appSource).toContain("Backoff");
    expect(appSource).toContain("最近错误");
    expect(appSource).toContain("Latest error");
    expect(appSource).toContain("marketDataAdapterProviderErrorCategoryLabel(i18n, error.category)");
    expect(appSource).toContain("限流");
    expect(appSource).toContain("Rate limit");
    expect(appSource).toContain("安装建议");
    expect(appSource).toContain("Install");
  });

  test("renders execution adapter state ledger as a compact settings audit rail", () => {
    expect(appSource).toContain("loadExecutionAdapterLedger(quantCoreBaseUrl)");
    expect(appSource).toContain("buildExecutionAdapterLedgerRows(executionAdapterLedger.adapterLedger)");
    expect(appSource).toContain("adapterLedgerRows={executionAdapterLedgerRows}");
    expect(appSource).toContain('className="adapter-ledger-list"');
    expect(appSource).toContain('className={`adapter-ledger-row');
    expect(appSource).toContain("adapterLedgerAdapterName(i18n, row)");
    expect(appSource).toContain("adapterLedgerGateSummary(i18n, row.gateSummary)");
    expect(appSource).toContain('"ashare-live": "A 股券商接口"');
    expect(appSource).toContain("合法券商适配器认证前，继续阻断 A 股实盘交易。");
    expect(appSource).toContain('gateSummary.replace("gates", "个闸门")');
    expect(styles).toContain(".adapter-ledger-list");
    expect(styles).toContain(".adapter-ledger-row");
  });

  test("renders ccxt sandbox health probe in settings", () => {
    expect(appSource).toContain("loadExecutionAdapterHealthProbe(quantCoreBaseUrl");
    expect(appSource).toContain("buildExecutionAdapterHealthProbeRows(executionAdapterHealthProbe.adapterHealthProbe)");
    expect(appSource).toContain("adapterHealthProbeRows={executionAdapterHealthProbeRows}");
    expect(appSource).toContain("onRefreshAdapterHealthProbe={refreshExecutionAdapterHealthProbe}");
    expect(appSource).toContain("isRefreshingAdapterHealthProbe={isRefreshingAdapterHealthProbe}");
    expect(appSource).toContain("adapterHealthProbeRows: ExecutionAdapterHealthProbeRow[]");
    expect(appSource).toContain('className="adapter-health-probe-list"');
    expect(appSource).toContain('className={`adapter-health-probe-row');
    expect(appSource).toContain('className="adapter-health-probe-checks"');
    expect(styles).toContain(".adapter-health-probe-list");
    expect(styles).toContain(".adapter-health-probe-row");
    expect(styles).toContain(".adapter-health-probe-checks");
  });

  test("renders execution adapter certification evidence controls in settings", () => {
    expect(appSource).toContain("loadExecutionAdapterCertifications(quantCoreBaseUrl");
    expect(appSource).toContain("recordExecutionAdapterCertification(quantCoreBaseUrl");
    expect(appSource).toContain("buildExecutionAdapterCertificationRows(executionAdapterCertifications)");
    expect(appSource).toContain("adapterCertificationRows={executionAdapterCertificationRows}");
    expect(appSource).toContain("onRecordAdapterCertification={recordAdapterCertificationEvidence}");
    expect(appSource).toContain("recordingAdapterCertificationId={recordingAdapterCertificationId}");
    expect(appSource).toContain('className="adapter-certification-button"');
    expect(appSource).toContain('className="adapter-certification-list"');
    expect(appSource).toContain('className={`adapter-certification-row');
    expect(appSource).not.toContain("secret-key");
    expect(styles).toContain(".adapter-certification-button");
    expect(styles).toContain(".adapter-certification-list");
    expect(styles).toContain(".adapter-certification-row");
  });

  test("renders execution adapter certification apply preflight controls in settings", () => {
    expect(appSource).toContain("loadExecutionAdapterCertificationApplies(quantCoreBaseUrl");
    expect(appSource).toContain("setExecutionAdapterCertificationApplies(applyResults.flatMap((result) => result.certificationApplies))");
    expect(appSource).toContain("recordExecutionAdapterCertificationApply(quantCoreBaseUrl");
    expect(appSource).toContain("buildExecutionAdapterCertificationApplyRows(executionAdapterCertificationApplies)");
    expect(appSource).toContain("adapterCertificationApplyRows={executionAdapterCertificationApplyRows}");
    expect(appSource).toContain("onApplyAdapterCertification={applyAdapterCertificationPreflight}");
    expect(appSource).toContain("applyingAdapterCertificationId={applyingAdapterCertificationId}");
    expect(appSource).toContain('className="adapter-certification-apply-button"');
    expect(appSource).toContain('className="adapter-certification-apply-list"');
    expect(appSource).toContain('className={`adapter-certification-apply-row');
    expect(styles).toContain(".adapter-certification-apply-button");
    expect(styles).toContain(".adapter-certification-apply-list");
    expect(styles).toContain(".adapter-certification-apply-row");
  });

  test("renders execution adapter certification apply confirmation checklist in settings", () => {
    expect(appSource).toContain("buildExecutionAdapterCertificationApplyConfirmationRows(");
    expect(appSource).toContain("createDefaultExecutionAdapterCertificationApplyConfirmations()");
    expect(appSource).toContain("adapterCertificationApplyConfirmations={adapterCertificationApplyConfirmations}");
    expect(appSource).toContain("onApplyConfirmationChange={updateAdapterCertificationApplyConfirmation}");
    expect(appSource).toContain("const confirmations = adapterCertificationApplyConfirmations[row.id]");
    expect(appSource).toContain("confirmations: confirmations");
    expect(appSource).toContain('className="adapter-certification-apply-confirmations"');
    expect(appSource).toContain('className={`adapter-certification-apply-confirmation');
    expect(appSource).toContain('type="checkbox"');
    expect(appSource).toContain("adapterCertificationApplyConfirmationLabel(i18n, confirmation.label)");
    expect(styles).toContain(".adapter-certification-apply-confirmations");
    expect(styles).toContain(".adapter-certification-apply-confirmation");
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
