import {
  buildTerminalWorkspace,
  workspaceWithPrimaryWorkflows,
  type Market,
  type TerminalWorkspace,
  type Timeframe
} from "./terminal-workbench";
import {
  buildApiUrl,
  defaultFetcher,
  type WorkspaceFetcher
} from "./terminal-api-http";
import {
  isMarket,
  isTimeframe
} from "./terminal-api-contract";

export const defaultQuantCoreBaseUrl = "/";
export type ResearchTimeframe = Timeframe;

export type WorkspaceSource = "core" | "fallback";

export interface WorkspaceLoadResult {
  workspace: TerminalWorkspace;
  source: WorkspaceSource;
  statusLabel: string;
  error?: string;
}

export interface WatchlistSaveResult {
  watchlist: TerminalWorkspace["watchlist"];
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchWorkspaceState {
  market: Market;
  symbol: string;
  name: string;
  timeframe: ResearchTimeframe;
  workspaceId: "market" | "research";
  updatedAt?: string;
}

export interface ResearchWorkspaceStateSaveResult {
  state?: ResearchWorkspaceState;
  source: WorkspaceSource;
  error?: string;
}

export function resolveQuantCoreBaseUrl(env: { VITE_QUANT_API_BASE?: string }): string {
  const configured = env.VITE_QUANT_API_BASE?.trim();
  return configured ? configured : defaultQuantCoreBaseUrl;
}

export function buildWorkspaceUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/workspace");
}

export function buildWatchlistUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/watchlist");
}

export function buildResearchWorkspaceStateUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/research/workspace-state");
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
      workspace: workspaceWithPrimaryWorkflows(payload),
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

export async function saveWatchlist(
  baseUrl: string,
  watchlist: TerminalWorkspace["watchlist"],
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<WatchlistSaveResult> {
  try {
    const response = await fetcher(buildWatchlistUrl(baseUrl), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        watchlist: watchlist.map((instrument) => ({
          market: instrument.market,
          symbol: instrument.symbol,
          name: instrument.name,
          price: instrument.price,
          changePct: instrument.changePct,
          quoteSource: instrument.quoteSource,
          quoteAsOf: instrument.quoteAsOf
        }))
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isWatchlistPayload(payload)) {
      throw new Error("Invalid watchlist contract");
    }
    return {
      watchlist: payload.watchlist,
      source: "core"
    };
  } catch (error) {
    return {
      watchlist,
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown watchlist save error"
    };
  }
}

export async function saveResearchWorkspaceState(
  baseUrl: string,
  state: Omit<ResearchWorkspaceState, "updatedAt">,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchWorkspaceStateSaveResult> {
  try {
    const response = await fetcher(buildResearchWorkspaceStateUrl(baseUrl), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchWorkspaceStatePayload(payload)) {
      throw new Error("Invalid research workspace state contract");
    }
    return {
      state: payload.state,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research workspace state save error"
    };
  }
}

export function isTerminalWorkspace(value: unknown): value is TerminalWorkspace {
  if (!value || typeof value !== "object") {
    return false;
  }
  const workspace = value as Partial<TerminalWorkspace>;
  return (
    workspace.schemaVersion === 1 &&
    Boolean(workspace.selectedInstrument?.symbol) &&
    isTimeframe(workspace.selectedTimeframe) &&
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

function isWatchlistPayload(value: unknown): value is Pick<WatchlistSaveResult, "watchlist"> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<WatchlistSaveResult>;
  return Array.isArray(payload.watchlist) && payload.watchlist.every(isWatchlistInstrument);
}

function isWatchlistInstrument(value: unknown): value is TerminalWorkspace["watchlist"][number] {
  if (!value || typeof value !== "object") {
    return false;
  }
  const instrument = value as Partial<TerminalWorkspace["watchlist"][number]>;
  return (
    (instrument.market === "ashare" || instrument.market === "us" || instrument.market === "crypto") &&
    typeof instrument.symbol === "string" &&
    instrument.symbol.length > 0 &&
    typeof instrument.name === "string" &&
    typeof instrument.changePct === "number"
  );
}

function isResearchWorkspaceStatePayload(value: unknown): value is Pick<ResearchWorkspaceStateSaveResult, "state"> {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as Partial<ResearchWorkspaceStateSaveResult>;
  return payload.state === undefined || isResearchWorkspaceState(payload.state);
}

function isResearchWorkspaceState(value: unknown): value is ResearchWorkspaceState {
  if (!value || typeof value !== "object") {
    return false;
  }
  const state = value as Partial<ResearchWorkspaceState>;
  return (
    isMarket(state.market) &&
    typeof state.symbol === "string" &&
    state.symbol.length > 0 &&
    typeof state.name === "string" &&
    isTimeframe(state.timeframe) &&
    (state.workspaceId === "market" || state.workspaceId === "research") &&
    (state.updatedAt === undefined || typeof state.updatedAt === "string")
  );
}
