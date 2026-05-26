import { buildTerminalWorkspace, Market, TerminalWorkspace } from "./terminal-workbench";

export const defaultQuantCoreBaseUrl = "http://127.0.0.1:8765";
export type ResearchTimeframe = "1d" | "1m" | "5m" | "15m" | "30m" | "60m";

export type WorkspaceSource = "core" | "fallback";

export interface WorkspaceLoadResult {
  workspace: TerminalWorkspace;
  source: WorkspaceSource;
  statusLabel: string;
  error?: string;
}

export interface WorkspaceResponse {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
}

export type WorkspaceFetcher = (url: string) => Promise<WorkspaceResponse>;

export interface TerminalResearchParams {
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
}

const defaultFetcher: WorkspaceFetcher = async (url) => fetch(url);

export function resolveQuantCoreBaseUrl(env: { VITE_QUANT_API_BASE?: string }): string {
  const configured = env.VITE_QUANT_API_BASE?.trim();
  return configured ? configured : defaultQuantCoreBaseUrl;
}

export function buildWorkspaceUrl(baseUrl: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL("api/workspace", normalizedBase).toString();
}

export function buildResearchRunUrl(
  baseUrl: string,
  market: Market,
  symbol: string,
  timeframe: ResearchTimeframe
): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL("api/research/run", normalizedBase);
  url.searchParams.set("market", market);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("timeframe", timeframe);
  return url.toString();
}

export async function loadTerminalWorkspace(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<WorkspaceLoadResult> {
  try {
    const response = await fetcher(buildWorkspaceUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isTerminalWorkspace(payload)) {
      throw new Error("Invalid terminal workspace contract");
    }
    return {
      workspace: payload,
      source: "core",
      statusLabel: "Core connected"
    };
  } catch (error) {
    return {
      workspace: buildTerminalWorkspace(),
      source: "fallback",
      statusLabel: "Offline snapshot",
      error: error instanceof Error ? error.message : "Unknown workspace load error"
    };
  }
}

export async function runTerminalResearch(
  baseUrl: string,
  params: TerminalResearchParams,
  currentWorkspace: TerminalWorkspace,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<WorkspaceLoadResult> {
  try {
    const response = await fetcher(buildResearchRunUrl(baseUrl, params.market, params.symbol, params.timeframe));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isTerminalWorkspace(payload)) {
      throw new Error("Invalid terminal research contract");
    }
    return {
      workspace: payload,
      source: "core",
      statusLabel: "Research run complete"
    };
  } catch (error) {
    return {
      workspace: currentWorkspace,
      source: "fallback",
      statusLabel: "Research run failed",
      error: error instanceof Error ? error.message : "Unknown research run error"
    };
  }
}

function isTerminalWorkspace(value: unknown): value is TerminalWorkspace {
  if (!value || typeof value !== "object") {
    return false;
  }
  const workspace = value as Partial<TerminalWorkspace>;
  return (
    workspace.schemaVersion === 1 &&
    Boolean(workspace.selectedInstrument?.symbol) &&
    Array.isArray(workspace.watchlist) &&
    Array.isArray(workspace.quantLoop) &&
    Array.isArray(workspace.modules) &&
    Array.isArray(workspace.panels) &&
    Array.isArray(workspace.agents) &&
    Boolean(workspace.execution) &&
    Array.isArray(workspace.execution?.gates) &&
    Boolean(workspace.strategy) &&
    Array.isArray(workspace.metrics) &&
    Array.isArray(workspace.decisionLog) &&
    Array.isArray(workspace.workflowNodes)
  );
}
