import type { MarketAiSelectionResearchOrigin } from "../../lib/terminal-api";
import {
  buildP0CurrentGapActionUrlSearch,
  buildTerminalWorkspace,
  replaceStrategyExperimentIdInUrl,
  resolveMarketAiSelectionResearchOriginUrlState,
  resolveProductWorkAreaSelection,
  resolveResearchContextUrlState,
  resolveSavedResearchWorkspaceId,
  resolveWatchlistCacheRefreshRunIdFromUrl,
  workspaceWithResearchContextUrlState,
  type Market,
  type ProductWorkAreaId,
  type ResearchContextUrlState,
  type TerminalWorkspace
} from "../../lib/terminal-workbench";
import { productWorkAreaIds, workflowStepIds } from "./navigation";

export interface InitialImportAuditEvidenceDeepLink {
  auditEventId: string | null;
  exportPath: string;
  focusQuery: string;
  runId: string;
}

export interface InitialPaperExecutionDeepLink {
  executionId: string;
  runId: string;
}

export type ImportAuditEvidenceDeepLinkStatus = InitialImportAuditEvidenceDeepLink & {
  error: string | null;
  status: "idle" | "loading" | "loaded" | "failed";
};

export type PaperExecutionDeepLinkStatus = InitialPaperExecutionDeepLink & {
  error: string | null;
  status: "idle" | "loading" | "loaded" | "failed";
};

export function resolveInitialWorkAreaId(fallback: ProductWorkAreaId): ProductWorkAreaId {
  if (typeof window === "undefined") {
    return fallback;
  }
  const workspaceParam = new URLSearchParams(window.location.search).get("workspace");
  if (workspaceParam && productWorkAreaIds.includes(workspaceParam as ProductWorkAreaId)) {
    return workspaceParam as ProductWorkAreaId;
  }
  const workflowParam = new URLSearchParams(window.location.search).get("workflow");
  const legacyWorkflowMap: Record<string, ProductWorkAreaId> = {
    research: "research",
    strategy: "strategy",
    backtest: "backtest",
    "agent-review": "ai-review",
    paper: "execution"
  };
  return workflowParam && workflowStepIds.includes(workflowParam as (typeof workflowStepIds)[number])
    ? legacyWorkflowMap[workflowParam] ?? fallback
    : fallback;
}

export function resolveInitialImportAuditEventId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const auditEvent = new URLSearchParams(window.location.search).get("auditEvent");
  return auditEvent?.trim() || null;
}

export function resolveInitialAdapterPaperExecutionAuditEventId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const auditEvent = new URLSearchParams(window.location.search).get("adapterPaperExecutionAuditEvent");
  return auditEvent?.trim() || null;
}

export function resolveInitialImportAuditEvidenceQuery(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("auditEvent")?.trim() ||
    params.get("exportPath")?.trim() ||
    params.get("runId")?.trim() ||
    ""
  );
}

export function resolveInitialAuditEvidenceReportQuery(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const params = new URLSearchParams(window.location.search);
  return params.get("auditReportQuery")?.trim() || "";
}

export function resolveInitialImportAuditEvidenceDeepLink(): InitialImportAuditEvidenceDeepLink | null {
  if (typeof window === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get("paperExecution")?.trim()) {
    return null;
  }
  if (params.get("workspace") === "ai-review") {
    return null;
  }
  const runId = params.get("runId")?.trim();
  if (!runId) {
    return null;
  }
  const exportPath = params.get("exportPath")?.trim() || `manifest:${runId}`;
  return {
    auditEventId: params.get("auditEvent")?.trim() || null,
    exportPath,
    focusQuery: researchRunImportAuditEvidenceAnchorQuery(runId, exportPath),
    runId
  };
}

export function resolveInitialPaperExecutionDeepLink(): InitialPaperExecutionDeepLink | null {
  if (typeof window === "undefined") {
    return null;
  }
  const params = new URLSearchParams(window.location.search);
  const executionId = params.get("paperExecution")?.trim();
  const runId = params.get("runId")?.trim();
  if (!executionId || !runId) {
    return null;
  }
  return { executionId, runId };
}

export function resolveInitialWatchlistCacheRefreshRunId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return resolveWatchlistCacheRefreshRunIdFromUrl(window.location.search);
}

export function resolveInitialResearchContextUrlState(): ResearchContextUrlState | null {
  if (typeof window === "undefined") {
    return null;
  }
  return resolveResearchContextUrlState(window.location.search);
}

export function resolveInitialMarketAiSelectionResearchOrigin():
  | (MarketAiSelectionResearchOrigin & { market: Market; symbol: string })
  | null {
  if (typeof window === "undefined") {
    return null;
  }
  const origin = resolveMarketAiSelectionResearchOriginUrlState(window.location.search);
  return origin
    ? {
        selectionId: origin.selectionId,
        candidateEvidenceId: origin.candidateEvidenceId,
        market: origin.market,
        symbol: origin.symbol,
      }
    : null;
}

export function hasExplicitResearchContextUrl(): boolean {
  return Boolean(resolveInitialResearchContextUrlState());
}

export function buildInitialTerminalWorkspace(): TerminalWorkspace {
  return workspaceWithResearchContextUrlState(buildTerminalWorkspace(), resolveInitialResearchContextUrlState());
}

export function replaceWatchlistCacheRefreshRunUrlParam(runId: string | null): void {
  if (typeof window === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  if (runId) {
    url.searchParams.set("watchlistRefreshRun", runId);
  } else {
    url.searchParams.delete("watchlistRefreshRun");
  }
  const search = url.searchParams.toString();
  window.history.replaceState({}, "", `${url.pathname}${search ? `?${search}` : ""}${url.hash}`);
}

export function replaceStrategyExperimentUrlParam(experimentId: string | null): void {
  if (typeof window === "undefined") {
    return;
  }
  window.history.replaceState({}, "", replaceStrategyExperimentIdInUrl(window.location.href, experimentId));
}

export function replaceAuditEvidenceReportQueryUrlParam(query: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const normalizedQuery = query.trim();
  const url = new URL(window.location.href);
  if (normalizedQuery) {
    url.searchParams.set("workspace", "audit");
    url.searchParams.set("auditReportQuery", normalizedQuery);
  } else {
    url.searchParams.delete("auditReportQuery");
  }
  const search = url.searchParams.toString();
  window.history.replaceState({}, "", `${url.pathname}${search ? `?${search}` : ""}${url.hash}`);
}

export function replaceAdapterPaperExecutionEvidenceUrlParam(eventId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  const normalizedEventId = eventId.trim();
  if (normalizedEventId) {
    url.searchParams.set("workspace", "settings");
    url.searchParams.set("adapterPaperExecutionAuditEvent", normalizedEventId);
  } else {
    url.searchParams.delete("adapterPaperExecutionAuditEvent");
  }
  const search = url.searchParams.toString();
  window.history.replaceState({}, "", `${url.pathname}${search ? `?${search}` : ""}${url.hash}`);
}

export function buildExecutionAdapterPaperExecutionEvidenceUrl(eventId: string): string {
  const normalizedEventId = eventId.trim();
  const url =
    typeof window === "undefined"
      ? new URL("http://127.0.0.1/")
      : new URL(window.location.href);
  url.search = "";
  url.searchParams.set("workspace", "settings");
  if (normalizedEventId) {
    url.searchParams.set("adapterPaperExecutionAuditEvent", normalizedEventId);
  }
  url.hash = "";
  return typeof window === "undefined" ? `?${url.searchParams.toString()}` : url.toString();
}

export function buildStage1P0WorkspaceShareUrl(workspaceLink: string): string {
  const normalizedLink = workspaceLink.trim();
  if (!normalizedLink || typeof window === "undefined") {
    return normalizedLink;
  }

  try {
    const shareUrl = new URL(normalizedLink, window.location.href);
    shareUrl.hash = "";
    return shareUrl.toString();
  } catch {
    return normalizedLink;
  }
}

export function replaceP0CurrentGapActionUrlSearch(search: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const normalizedSearch = buildP0CurrentGapActionUrlSearch(search);
  if (!normalizedSearch) {
    return;
  }
  const url = new URL(window.location.href);
  url.search = `?${normalizedSearch}`;
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function resolveInitialWorkAreaSelection(workspace: TerminalWorkspace) {
  return resolveProductWorkAreaSelection(
    workspace,
    resolveInitialWorkAreaId(resolveSavedResearchWorkspaceId(workspace, "market"))
  );
}

export function hasExplicitWorkAreaUrl(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.has("workspace") || params.has("workflow");
}

export function researchRunImportAuditEvidenceAnchorQuery(runId: string, exportPath: string): string {
  const normalizedExportPath = exportPath.trim();
  if (normalizedExportPath.startsWith("manifest:")) {
    return runId;
  }
  return normalizedExportPath || runId;
}
