import type { ResearchOpsQueue, ResearchOpsQueueAction, ResearchOpsQueueRow, ResearchOpsQueueStage, ScannerCandidate } from "../audit/execution-contracts";
import { timestampSortValue } from "../audit/signing-key-ledger";
import type { ResearchRunAudit, TerminalWorkspace } from "../core/workspace-contracts";
import { buildResearchWorkspaceStateDraft, researchWorkspaceStateMatchesDraft } from "../core/workspace-operations";
import { buildResearchOpsQueueSummary, researchOpsActionLabel, researchOpsQueueDetail, researchOpsQueueSort } from "../portfolio/risk-and-ops-builders";
import type { ResearchContextEvidenceRow, ResearchContextReadinessReportArchive, ResearchContextReadinessReportFileNameInput, ResearchContextReadinessReportInput, ResearchPipelineLockedPreparationEvidence, ResearchPipelinePreflight, ResearchPipelinePreflightIssue, ResearchPipelinePreparationEvidenceSelection, WatchlistCacheRefreshCoverageRow, WatchlistCacheRefreshHistoryRow, WatchlistCacheRefreshItemRow, WatchlistCacheRefreshItemSnapshot, WatchlistCacheRefreshRunSnapshot } from "./workspace-contracts";
import type { ResearchContextReadinessCacheContext, ResearchContextReadinessRow, ResearchContextReadinessStatus } from "../stage1/archive-contracts";
import type { ProductWorkAreaId, Timeframe } from "../stage1/foundation-contracts";
import type { Instrument } from "../stage1/review-contracts";
import { markdownTable } from "../strategy/backtest-builders";
import { buildResearchRunContextBinding, strategyContextLabel } from "../strategy/experiment-builders";

export function buildRefreshEvidenceReadinessRow(
  workspace: TerminalWorkspace,
  runs: WatchlistCacheRefreshRunSnapshot[]
): ResearchContextReadinessRow {
  const instrument = workspace.selectedInstrument;
  const timeframe = workspace.selectedTimeframe;
  const context = strategyContextLabel(instrument.market, instrument.symbol, timeframe);
  const matching = runs
    .flatMap((run) =>
      run.items.map((item) => ({
        run,
        item
      }))
    )
    .find(
      ({ item }) =>
        item.market === instrument.market &&
        item.symbol === instrument.symbol &&
        item.timeframe === timeframe
    );

  if (!matching) {
    return {
      id: "refresh",
      label: "Refresh evidence",
      value: "no matching refresh",
      detail: `Run watchlist cache refresh for ${context} before relying on this context.`,
      status: "review",
      tone: "warning",
      action: "refresh-watchlist-cache",
      evidenceRunId: undefined
    };
  }

  const warnings = matching.item.quality.warnings.filter((warning) => warning.trim());
  const source = matching.item.quality.source || "unknown";
  const sourceNeedsReview = isReviewRequiredKlineSource(source);
  const isReady =
    matching.item.status === "refreshed" &&
    matching.item.quality.isComplete &&
    warnings.length === 0 &&
    !sourceNeedsReview;
  const rowsCached = Math.max(0, Math.floor(matching.item.upsertedRows || 0));

  return {
    id: "refresh",
    label: "Refresh evidence",
    value: `${matching.item.status} · ${matching.run.runId}`,
    detail: isReady
      ? `${matching.run.createdAt} · ${source} · ${rowsCached} rows cached`
      : `${matching.run.createdAt} · ${source} · ${rowsCached} rows cached · ${refreshEvidenceReviewReason(
          matching.item,
          sourceNeedsReview,
          warnings
        )}`,
    status: isReady ? "ready" : "review",
    tone: isReady ? "positive" : "warning",
    action: isReady ? undefined : "refresh-watchlist-cache",
    evidenceRunId: matching.run.runId
  };
}

export function refreshEvidenceReviewReason(
  item: WatchlistCacheRefreshItemSnapshot,
  sourceNeedsReview: boolean,
  warnings: string[]
): string {
  if (item.error) {
    return item.error;
  }
  if (item.status !== "refreshed") {
    return `refresh ${item.status}`;
  }
  if (!item.quality.isComplete) {
    return "refresh quality incomplete";
  }
  if (warnings[0]) {
    return warnings[0];
  }
  if (sourceNeedsReview) {
    return "source requires review";
  }
  return "refresh requires review";
}

export function buildWatchlistReadinessRow(
  workspace: TerminalWorkspace,
  hasUnsavedChanges: boolean
): ResearchContextReadinessRow {
  const watchedCount = workspace.watchlist.length;
  return {
    id: "watchlist",
    label: "Watchlist state",
    value: hasUnsavedChanges ? "unsaved changes" : "saved",
    detail: hasUnsavedChanges
      ? `Save ${watchedCount} watched symbols before relying on this research context.`
      : `${watchedCount} watched symbols are persisted for local research.`,
    status: hasUnsavedChanges ? "review" : "ready",
    tone: hasUnsavedChanges ? "warning" : "positive",
    action: hasUnsavedChanges ? "save-watchlist" : undefined
  };
}

export function buildResearchWorkspaceReadinessRow(
  workspace: TerminalWorkspace,
  activeWorkAreaId: ProductWorkAreaId
): ResearchContextReadinessRow {
  const draft = buildResearchWorkspaceStateDraft(workspace, activeWorkAreaId);
  const savedState = workspace.researchWorkspaceState ?? null;
  const isSaved = researchWorkspaceStateMatchesDraft(savedState, draft);
  const context = `${strategyContextLabel(draft.market, draft.symbol, draft.timeframe)} · ${draft.workspaceId}`;
  const value = isSaved ? "saved" : savedState ? "unsaved changes" : "not saved";
  const detail = isSaved
    ? `Saved ${savedState?.updatedAt ?? "time unknown"} · ${draft.workspaceId} entry`
    : `Save ${context} before relying on this workspace context.`;

  return {
    id: "workspace",
    label: "Workspace state",
    value,
    detail,
    status: isSaved ? "ready" : "review",
    tone: isSaved ? "positive" : "warning",
    action: isSaved ? undefined : "save-workspace"
  };
}

export function buildResearchContextEvidenceRows(workspace: TerminalWorkspace): ResearchContextEvidenceRow[] {
  const binding = buildResearchRunContextBinding(workspace);
  const status: ResearchContextReadinessStatus =
    binding.status === "matched" ? "ready" : binding.status === "mismatched" ? "blocked" : "review";
  const tone: ResearchContextEvidenceRow["tone"] =
    status === "ready" ? "positive" : status === "blocked" ? "risk" : "warning";

  return [
    {
      id: "audit-run",
      label: "Audited run",
      value: binding.runId ?? "no audited run",
      detail: binding.detail,
      status,
      tone
    }
  ];
}

export function buildWatchlistCacheRefreshHistoryRows(
  runs: WatchlistCacheRefreshRunSnapshot[],
  limit = 4,
  selectedRunId: string | null = null
): WatchlistCacheRefreshHistoryRow[] {
  const boundedLimit = Math.max(1, Math.min(limit, 8));
  return runs.slice(0, boundedLimit).map((run) => {
    const total = Math.max(0, run.summary.totalSymbols);
    const refreshed = Math.max(0, run.summary.refreshed);
    const skipped = Math.max(0, run.summary.skipped);
    const failed = Math.max(0, run.summary.failed);
    const tone: WatchlistCacheRefreshHistoryRow["tone"] = failed > 0 ? "risk" : skipped > 0 ? "warning" : "positive";
    const overrideDetail = run.overrideAuditEventId ? ` · override ${run.overrideAuditEventId}` : "";
    return {
      id: run.runId,
      runId: run.runId,
      createdAt: run.createdAt,
      timeframe: run.timeframe,
      label: `${run.runId} · ${run.timeframe}`,
      total,
      refreshed,
      skipped,
      failed,
      upsertedRows: Math.max(0, run.summary.upsertedRows),
      value: `${refreshed}/${total} refreshed`,
      detail: `${Math.max(0, run.summary.upsertedRows)} rows cached · ${skipped} skipped · ${failed} failed${overrideDetail}`,
      selected: selectedRunId === run.runId,
      tone
    };
  });
}

export function resolveWatchlistCacheRefreshRunSelection(
  runs: WatchlistCacheRefreshRunSnapshot[],
  selectedRunId: string | null | undefined
): WatchlistCacheRefreshRunSnapshot | null {
  if (!runs.length) {
    return null;
  }
  return runs.find((run) => run.runId === selectedRunId) ?? runs[0] ?? null;
}

export function normalizeWatchlistCacheRefreshRunId(runId: string | null | undefined): string | null {
  const trimmedRunId = runId?.trim() ?? "";
  return /^[A-Za-z0-9._:-]{1,120}$/.test(trimmedRunId) ? trimmedRunId : null;
}

export function normalizeAiReviewRunId(runId: string | null | undefined): string | null {
  const trimmedRunId = runId?.trim() ?? "";
  return /^run-[A-Za-z0-9][A-Za-z0-9._:-]{0,115}$/.test(trimmedRunId) ? trimmedRunId : null;
}

export function resolveAiReviewRunIdFromUrl(
  search: string | URLSearchParams | null | undefined
): string | null {
  if (!search) {
    return null;
  }
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  const runIds = params.getAll("runId");
  const workspaceId = params.get("workspace");
  const restoresRun = workspaceId === "ai-review" || (workspaceId === "execution" && !params.has("paperExecution"));
  return restoresRun && runIds.length === 1
    ? normalizeAiReviewRunId(runIds[0])
    : null;
}

export function replaceAiReviewRunIdInUrl(
  href: string,
  nextWorkspaceId: ProductWorkAreaId,
  runId: string | null | undefined
): string {
  const url = new URL(href);
  if (nextWorkspaceId === "ai-review" || (nextWorkspaceId === "execution" && !url.searchParams.has("paperExecution"))) {
    url.searchParams.delete("runId");
    const normalizedRunId = normalizeAiReviewRunId(runId);
    if (normalizedRunId) {
      url.searchParams.set("runId", normalizedRunId);
    }
  } else if (
    (nextWorkspaceId === "audit" &&
      !url.searchParams.has("exportPath") &&
      !url.searchParams.has("auditEvent")) ||
    (nextWorkspaceId === "execution" && !url.searchParams.has("paperExecution")) ||
    (nextWorkspaceId !== "audit" && nextWorkspaceId !== "execution")
  ) {
    url.searchParams.delete("runId");
  }
  return url.toString();
}

export function resolveWatchlistCacheRefreshRunIdFromUrl(search: string | URLSearchParams | null | undefined): string | null {
  if (!search) {
    return null;
  }
  const params =
    search instanceof URLSearchParams
      ? search
      : new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  return normalizeWatchlistCacheRefreshRunId(params.get("watchlistRefreshRun"));
}

export function buildWatchlistCacheRefreshItemRows(
  run: WatchlistCacheRefreshRunSnapshot | null | undefined
): WatchlistCacheRefreshItemRow[] {
  if (!run) {
    return [];
  }

  return run.items.map((item) => {
    const upsertedRows = Math.max(0, item.upsertedRows);
    const rows = Math.max(0, item.quality.rows);
    const source = item.quality.source || "unknown";
    const firstWarning = item.quality.warnings.find((warning) => warning.trim().length > 0);
    const detail =
      item.error ??
      (firstWarning ? `${source} · ${firstWarning}` : `${source} · ${item.quality.isComplete ? "complete" : "incomplete"}`);
    const tone: WatchlistCacheRefreshItemRow["tone"] =
      item.status === "failed" ? "risk" : item.status === "skipped" ? "warning" : "positive";

    return {
      id: `${run.runId}:${item.market}:${item.symbol}`,
      market: item.market,
      symbol: item.symbol,
      name: item.name || item.symbol,
      timeframe: item.timeframe,
      instrument: {
        symbol: item.symbol,
        name: item.name || item.symbol,
        market: item.market,
        changePct: 0
      },
      status: item.status,
      statusLabel: item.status,
      source,
      rows,
      upsertedRows,
      value: `${upsertedRows} rows cached`,
      detail,
      tone
    };
  });
}

export function buildWatchlistCacheRefreshCoverageRow(
  run: WatchlistCacheRefreshRunSnapshot | null | undefined,
  workspace: TerminalWorkspace
): WatchlistCacheRefreshCoverageRow | null {
  if (!run) {
    return null;
  }

  const instrument = workspace.selectedInstrument;
  const timeframe = workspace.selectedTimeframe;
  const context = strategyContextLabel(instrument.market, instrument.symbol, timeframe);
  const matching = run.items.find(
    (item) => item.market === instrument.market && item.symbol === instrument.symbol && item.timeframe === timeframe
  );

  if (!matching) {
    return {
      id: `${run.runId}:coverage`,
      runId: run.runId,
      label: "Selected refresh coverage",
      value: "not current context",
      detail: `Selected run does not include ${context}; choose a matching run or refresh the watchlist cache.`,
      status: "review",
      tone: "warning",
      canOpenResearch: false
    };
  }

  const warnings = matching.quality.warnings.filter((warning) => warning.trim());
  const source = matching.quality.source || "unknown";
  const sourceNeedsReview = isReviewRequiredKlineSource(source);
  const isReady =
    matching.status === "refreshed" &&
    matching.quality.isComplete &&
    warnings.length === 0 &&
    !sourceNeedsReview;
  const rowsCached = Math.max(0, Math.floor(matching.upsertedRows || 0));
  const baseDetail = `${matching.symbol} · ${matching.timeframe} covered by ${source} · ${rowsCached} rows cached`;

  return {
    id: `${run.runId}:coverage`,
    runId: run.runId,
    label: "Selected refresh coverage",
    value: `${isReady ? "covered" : "review"} · ${matching.status}`,
    detail: isReady ? baseDetail : `${baseDetail} · ${refreshEvidenceReviewReason(matching, sourceNeedsReview, warnings)}`,
    status: isReady ? "ready" : "review",
    tone: isReady ? "positive" : "warning",
    canOpenResearch: true
  };
}

export function buildResearchPipelinePreflight(rows: ResearchContextReadinessRow[]): ResearchPipelinePreflight {
  const lockedPreparationEvidence = buildLockedPreparationEvidence(rows);
  const issues = rows
    .flatMap<ResearchPipelinePreflightIssue>((row) =>
      row.status === "ready"
        ? []
        : [
            {
              id: row.id,
              label: row.label,
              value: row.value,
              detail: row.detail,
              status: row.status,
              action: row.action
            }
          ]
    );
  const blockedIssues = issues.filter((issue) => issue.status === "blocked");
  const primaryAction = issues.find((issue) => issue.action)?.action;

  if (blockedIssues.length) {
    return {
      status: "blocked",
      canRun: false,
      requiresConfirmation: false,
      summary: `Fix ${blockedIssues.length} blocked research context ${blockedIssues.length === 1 ? "gate" : "gates"} before running the pipeline.`,
      primaryAction,
      issues,
      lockedPreparationEvidence
    };
  }

  if (issues.length) {
    return {
      status: "review",
      canRun: true,
      requiresConfirmation: true,
      summary: `Review ${issues.length} research context ${issues.length === 1 ? "gate" : "gates"} before running the pipeline.`,
      primaryAction,
      issues,
      lockedPreparationEvidence
    };
  }

  return {
    status: "ready",
    canRun: true,
    requiresConfirmation: false,
    summary: "Research context is ready for pipeline run.",
    issues: [],
    lockedPreparationEvidence
  };
}

export function buildResearchContextReadinessReportMarkdown(input: ResearchContextReadinessReportInput): string {
  const rows = [...input.rows];
  const evidenceRows = [...(input.evidenceRows ?? [])];
  const preflight = input.preflight ?? buildResearchPipelinePreflight(rows);
  const generatedAt = input.generatedAt?.trim() || new Date().toISOString();
  const context = strategyContextLabel(
    input.workspace.selectedInstrument.market,
    input.workspace.selectedInstrument.symbol,
    input.workspace.selectedTimeframe
  );
  const readyCount = rows.filter((row) => row.status === "ready").length;
  const reviewCount = rows.filter((row) => row.status === "review").length;
  const blockedCount = rows.filter((row) => row.status === "blocked").length;
  const readinessTable = markdownTable(
    ["Gate", "Status", "Value", "Detail", "Action"],
    rows.map((row) => [row.label, row.status, row.value, row.detail, row.action ?? "-"])
  );
  const evidenceSection = evidenceRows.length
    ? [
        "## Evidence",
        "",
        markdownTable(
          ["Evidence", "Status", "Value", "Detail"],
          evidenceRows.map((row) => [row.label, row.status, row.value, row.detail])
        )
      ].join("\n")
    : "## Evidence\n\nNo additional research evidence rows are attached.";
  const lockedPreparationEvidence = preflight.lockedPreparationEvidence?.runId ?? "none";
  const contextLink = input.contextLink?.trim();
  const nextAction = preflight.primaryAction ?? "none";
  const openIssuesSection = preflight.issues.length
    ? [
        "## Open Issues",
        "",
        markdownTable(
          ["Gate", "Status", "Value", "Action", "Detail"],
          preflight.issues.map((issue) => [
            issue.label,
            issue.status,
            issue.value,
            issue.action ?? "review",
            issue.detail
          ])
        )
      ].join("\n")
    : "## Open Issues\n\nNo open research context issues.";

  return [
    "# AIQuant Research Context Readiness",
    "",
    `Generated at: \`${generatedAt}\``,
    `Context: \`${context}\``,
    ...(contextLink ? [`Context link: ${contextLink}`] : []),
    `Preflight: \`${preflight.status}\` · ${preflight.summary}`,
    `Next action: \`${nextAction}\``,
    `Readiness gates: \`${readyCount} ready / ${reviewCount} review / ${blockedCount} blocked\``,
    `Locked preparation evidence: \`${lockedPreparationEvidence}\``,
    "",
    "## Readiness Gates",
    "",
    readinessTable,
    "",
    openIssuesSection,
    "",
    evidenceSection,
    "",
    "Boundary: This report is research context evidence only; it does not route orders, provide investment advice, or unlock live trading."
  ].join("\n");
}

export function buildResearchContextReadinessReportFileName(
  input: ResearchContextReadinessReportFileNameInput
): string {
  const market = safeResearchContextReportFileNameToken(input.workspace.selectedInstrument.market);
  const symbol = safeResearchContextReportFileNameToken(input.workspace.selectedInstrument.symbol);
  const timeframe = safeResearchContextReportFileNameToken(input.workspace.selectedTimeframe);
  const timestamp = researchContextReadinessReportTimestampToken(input.generatedAt);

  return ["aiquant", "research", "context", market, symbol, timeframe, timestamp].join("-") + ".md";
}

export async function buildResearchContextReadinessReportArchive(
  input: ResearchContextReadinessReportInput
): Promise<ResearchContextReadinessReportArchive> {
  const rows = [...input.rows];
  const generatedAt = input.generatedAt?.trim() || new Date().toISOString();
  const preflight = input.preflight ?? buildResearchPipelinePreflight(rows);
  const contentMarkdown = buildResearchContextReadinessReportMarkdown({
    ...input,
    generatedAt,
    preflight,
    rows
  });
  const readinessCounts = {
    ready: rows.filter((row) => row.status === "ready").length,
    review: rows.filter((row) => row.status === "review").length,
    blocked: rows.filter((row) => row.status === "blocked").length
  };

  return {
    fileName: buildResearchContextReadinessReportFileName({ generatedAt, workspace: input.workspace }),
    contentMarkdown,
    contentSha256: {
      algorithm: "sha256",
      hash: await sha256TextHex(contentMarkdown)
    },
    generatedAt,
    context: {
      market: input.workspace.selectedInstrument.market,
      symbol: input.workspace.selectedInstrument.symbol,
      timeframe: input.workspace.selectedTimeframe
    },
    preflightStatus: preflight.status,
    nextAction: preflight.primaryAction ?? "none",
    lockedPreparationEvidenceRunId: preflight.lockedPreparationEvidence?.runId ?? null,
    readinessCounts,
    contextLink: input.contextLink?.trim() || null
  };
}

export function resolveResearchPipelinePreparationEvidenceRunId(
  input: ResearchPipelinePreparationEvidenceSelection
): string | null {
  const lockedRunId = input.preflight.lockedPreparationEvidence?.runId.trim() ?? "";
  return lockedRunId || null;
}

export function researchPipelineDataSnapshotLogLabel(
  context: string,
  preflight: ResearchPipelinePreflight | null | undefined
): string {
  const base = `Data snapshot prepared for ${context}`;
  const lockedRunId = preflight?.lockedPreparationEvidence?.runId.trim() ?? "";
  return lockedRunId ? `${base} · prep ${lockedRunId}` : base;
}

export function buildLockedPreparationEvidence(rows: ResearchContextReadinessRow[]): ResearchPipelineLockedPreparationEvidence | null {
  const refreshRow = rows.find((row) => row.id === "refresh");
  if (!refreshRow || refreshRow.status !== "ready" || !refreshRow.evidenceRunId) {
    return null;
  }
  return {
    runId: refreshRow.evidenceRunId,
    label: refreshRow.label,
    value: refreshRow.value,
    detail: refreshRow.detail
  };
}

export function readinessTone(status: ResearchContextReadinessStatus): "positive" | "warning" | "risk" {
  if (status === "ready") {
    return "positive";
  }
  return status === "review" ? "warning" : "risk";
}

export function researchContextReadinessReportTimestampToken(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  const generatedAt = trimmed ? new Date(trimmed) : new Date();
  if (Number.isNaN(generatedAt.getTime())) {
    return "report";
  }

  return generatedAt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function safeResearchContextReportFileNameToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";
}

export async function sha256TextHex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function isReviewRequiredKlineSource(source: string): boolean {
  const normalized = source.trim().toLowerCase();
  return normalized === "demo-fallback" || normalized === "unknown";
}

export function cacheReadinessDetail(cache: ResearchContextReadinessCacheContext | null, rowCount: number): string {
  if (!cache || rowCount <= 0 || cache.freshness === "empty") {
    return "No current-timeframe cache coverage yet. Use search suggestion refresh or refresh current cache before audited research.";
  }
  const age = typeof cache.ageHours === "number" && Number.isFinite(cache.ageHours) ? Math.max(0, cache.ageHours) : null;
  const ageLabel = age === null ? "age unknown" : `${Number.isInteger(age) ? age : age.toFixed(1)}h old`;
  const latest = cache.latestTimestamp || "latest timestamp unknown";
  if (cache.freshness === "fresh") {
    return `Ready for audited research · Latest cache ${latest} · ${ageLabel}`;
  }
  return `Cache is ${cache.freshness}. Refresh from search suggestions or current cache before audited research · latest ${latest} · ${ageLabel}`;
}

export function buildScannerCandidates(workspace: TerminalWorkspace): ScannerCandidate[] {
  return [...workspace.watchlist]
    .map((instrument) => {
      const changePct = Number.isFinite(instrument.changePct) ? instrument.changePct : 0;
      const score = Math.max(0, Math.min(100, Math.round(50 + changePct * 8)));
      const signal: ScannerCandidate["signal"] =
        changePct >= 1 ? "Momentum watch" : changePct < 0 ? "Risk review" : "Baseline watch";
      const risk: ScannerCandidate["risk"] = instrument.market === "crypto" || changePct < 0 ? "medium" : "low";
      return {
        instrument,
        signal,
        risk,
        score,
        note:
          signal === "Momentum watch"
            ? "Price momentum is stronger than the local watchlist baseline."
            : signal === "Risk review"
              ? "Negative change needs risk review before promotion."
              : "Stable candidate ready for factor checks."
      };
    })
    .sort((left, right) => right.score - left.score);
}

export function buildResearchOpsQueueRows({
  workspace,
  runHistory = [],
  watchlistRefreshRuns = []
}: {
  workspace: TerminalWorkspace;
  runHistory?: ResearchRunAudit[];
  watchlistRefreshRuns?: WatchlistCacheRefreshRunSnapshot[];
}): ResearchOpsQueue {
  const timeframe = workspace.selectedTimeframe;
  const instruments = researchOpsQueueInstruments(workspace);
  const sortedRuns = [...runHistory].sort((left, right) => timestampSortValue(right.createdAt) - timestampSortValue(left.createdAt));
  const sortedRefreshRuns = [...watchlistRefreshRuns].sort(
    (left, right) => timestampSortValue(right.createdAt) - timestampSortValue(left.createdAt)
  );
  const rows = instruments
    .map((instrument) => {
      const latestRun =
        sortedRuns.find(
          (run) => run.market === instrument.market && run.symbol === instrument.symbol && run.timeframe === timeframe
        ) ?? null;
      const latestCache = latestWatchlistCacheItemForInstrument(sortedRefreshRuns, instrument, timeframe);
      const cacheReady = researchOpsCacheReady(latestCache?.item ?? null);
      const cacheIssue = researchOpsCacheIssue(latestCache?.item ?? null);
      const stage: ResearchOpsQueueStage = !cacheReady
        ? "needs_data"
        : !latestRun
          ? "ready_for_pipeline"
          : latestRun.aiReport
            ? "paper_candidate"
            : "needs_ai_review";
      const status: ResearchContextReadinessStatus =
        stage === "needs_data" ? (latestCache?.item?.status === "failed" ? "blocked" : "review") : "ready";
      const tone: ResearchOpsQueueRow["tone"] =
        stage === "needs_data" ? (status === "blocked" ? "risk" : "warning") : "positive";
      const nextActionId: ResearchOpsQueueAction =
        stage === "needs_data"
          ? "refresh-watchlist-cache"
          : stage === "ready_for_pipeline"
            ? "run-pipeline"
            : stage === "needs_ai_review"
              ? "run-ai-review"
              : "review-production-handoff";
      const cacheRows = Math.max(0, latestCache?.item?.quality.rows ?? latestCache?.item?.upsertedRows ?? 0);
      return {
        id: `${instrument.market}:${instrument.symbol}:${timeframe}`,
        instrument,
        market: instrument.market,
        symbol: instrument.symbol,
        name: instrument.name || instrument.symbol,
        timeframe,
        stage,
        status,
        tone,
        nextActionId,
        nextActionLabel: researchOpsActionLabel(nextActionId),
        latestRunId: latestRun?.runId ?? null,
        latestCacheRunId: latestCache?.run.runId ?? null,
        cacheSource: latestCache?.item?.quality.source || "none",
        cacheRows,
        detail: researchOpsQueueDetail(stage, instrument, timeframe, latestRun, latestCache?.item ?? null, cacheIssue),
        selected: instrument.market === workspace.selectedInstrument.market && instrument.symbol === workspace.selectedInstrument.symbol
      } satisfies ResearchOpsQueueRow;
    })
    .sort(researchOpsQueueSort);

  return {
    rows,
    summary: buildResearchOpsQueueSummary(rows)
  };
}

export function researchOpsQueueInstruments(workspace: TerminalWorkspace): Instrument[] {
  const byKey = new Map<string, Instrument>();
  const addInstrument = (instrument: Instrument) => {
    byKey.set(`${instrument.market}:${instrument.symbol}`, instrument);
  };
  addInstrument(workspace.selectedInstrument);
  workspace.watchlist.forEach(addInstrument);
  return Array.from(byKey.values());
}

export function latestWatchlistCacheItemForInstrument(
  runs: WatchlistCacheRefreshRunSnapshot[],
  instrument: Pick<Instrument, "market" | "symbol">,
  timeframe: Timeframe
): { run: WatchlistCacheRefreshRunSnapshot; item: WatchlistCacheRefreshItemSnapshot } | null {
  for (const run of runs) {
    const item = run.items.find(
      (candidate) =>
        candidate.market === instrument.market && candidate.symbol === instrument.symbol && candidate.timeframe === timeframe
    );
    if (item) {
      return { run, item };
    }
  }
  return null;
}

export function researchOpsCacheReady(item: WatchlistCacheRefreshItemSnapshot | null): boolean {
  if (!item || item.status !== "refreshed" || item.upsertedRows <= 0 || !item.quality.isComplete) {
    return false;
  }
  if (item.quality.warnings.some((warning) => warning.trim())) {
    return false;
  }
  return !isReviewRequiredKlineSource(item.quality.source);
}

export function researchOpsCacheIssue(item: WatchlistCacheRefreshItemSnapshot | null): string {
  if (!item) {
    return "No watchlist cache refresh evidence for this timeframe.";
  }
  if (item.error) {
    return item.error;
  }
  const warning = item.quality.warnings.find((value) => value.trim());
  if (warning) {
    return warning;
  }
  if (item.status !== "refreshed") {
    return `Cache refresh status is ${item.status}.`;
  }
  if (!item.quality.isComplete) {
    return `${item.quality.source || "unknown"} returned incomplete data.`;
  }
  if (item.upsertedRows <= 0) {
    return "Cache refresh did not upsert rows.";
  }
  if (isReviewRequiredKlineSource(item.quality.source)) {
    return `${item.quality.source || "unknown"} cache requires review before audited research.`;
  }
  return "Cache evidence is ready.";
}
