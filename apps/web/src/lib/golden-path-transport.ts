import type {
  Market,
  Timeframe
} from "./terminal-workbench";
import {
  buildApiUrl,
  defaultFetcher,
  type WorkspaceFetcher
} from "./terminal-api-http";
import {
  isMarket,
  isTimeframe,
  type TerminalResearchParams
} from "./terminal-api-contract";

type ResearchTimeframe = Timeframe;
type WorkspaceSource = "core" | "fallback";

export type GoldenPathOverallStatus = "ready" | "review" | "blocked";
export type GoldenPathStepStatus = "passed" | "review" | "blocked";
export type GoldenPathWorkspaceStatus = "ready" | "needs_run" | "blocked";

export interface GoldenPathNextAction {
  id: string;
  label: string;
  targetWorkspace: string;
  reason: string;
}

export interface GoldenPathStep {
  id: string;
  label: string;
  status: GoldenPathStepStatus;
  passed: boolean;
  detail: string;
  actionId: string | null;
}

export interface GoldenPathWorkspace {
  id: string;
  label: string;
  status: GoldenPathWorkspaceStatus;
  current: boolean;
  stepIds: string[];
  reason: string;
  actionId: string | null;
}

export interface GoldenPathSummary {
  totalSteps: number;
  passedSteps: number;
  reviewSteps: number;
  blockedSteps: number;
  currentStepLabel: string | null;
  nextActionId: string | null;
  liveTradingAllowed: boolean;
}

export interface GoldenPathRunbookItem {
  stepId: string;
  label: string;
  workspaceId: string;
  status: GoldenPathStepStatus;
  current: boolean;
  passed: boolean;
  detail: string;
  blocker: string | null;
  actionId: string | null;
  actionLabel: string | null;
  targetWorkspace: string | null;
}

export interface GoldenPathStatus {
  schemaVersion: 1;
  market: Market;
  symbol: string;
  timeframe: ResearchTimeframe;
  status: GoldenPathOverallStatus;
  currentStepId: string | null;
  latestRunId: string | null;
  nextAction: GoldenPathNextAction | null;
  summary: GoldenPathSummary;
  runbook: GoldenPathRunbookItem[];
  workspaces: GoldenPathWorkspace[];
  steps: GoldenPathStep[];
}

export interface GoldenPathStatusResult {
  goldenPath?: GoldenPathStatus;
  source: WorkspaceSource;
  error?: string;
}

export function buildGoldenPathStatusUrl(baseUrl: string, params: TerminalResearchParams): string {
  return buildApiUrl(baseUrl, "api/golden-path/status", (url) => {
    url.searchParams.set("market", params.market);
    url.searchParams.set("symbol", params.symbol);
    url.searchParams.set("timeframe", params.timeframe);
  });
}

export async function loadGoldenPathStatus(
  baseUrl: string,
  params: TerminalResearchParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<GoldenPathStatusResult> {
  try {
    const response = await fetcher(buildGoldenPathStatusUrl(baseUrl, params));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isGoldenPathStatusPayload(payload)) {
      throw new Error("Invalid golden path status contract");
    }
    return {
      goldenPath: payload.goldenPath,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown golden path status error"
    };
  }
}

function isGoldenPathStatusPayload(value: unknown): value is { goldenPath: GoldenPathStatus } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { goldenPath?: unknown };
  return isGoldenPathStatus(payload.goldenPath);
}

function isGoldenPathStatus(value: unknown): value is GoldenPathStatus {
  if (!value || typeof value !== "object") {
    return false;
  }
  const status = value as Partial<GoldenPathStatus>;
  return (
    status.schemaVersion === 1 &&
    isMarket(status.market) &&
    typeof status.symbol === "string" &&
    isTimeframe(status.timeframe) &&
    isGoldenPathOverallStatus(status.status) &&
    (status.currentStepId === null || typeof status.currentStepId === "string") &&
    (status.latestRunId === null || typeof status.latestRunId === "string") &&
    (status.nextAction === null || isGoldenPathNextAction(status.nextAction)) &&
    isGoldenPathSummary(status.summary) &&
    Array.isArray(status.runbook) &&
    status.runbook.every(isGoldenPathRunbookItem) &&
    Array.isArray(status.workspaces) &&
    status.workspaces.every(isGoldenPathWorkspace) &&
    Array.isArray(status.steps) &&
    status.steps.every(isGoldenPathStep)
  );
}

function isGoldenPathOverallStatus(value: unknown): value is GoldenPathOverallStatus {
  return value === "ready" || value === "review" || value === "blocked";
}

function isGoldenPathStep(value: unknown): value is GoldenPathStep {
  if (!value || typeof value !== "object") {
    return false;
  }
  const step = value as Partial<GoldenPathStep>;
  return (
    typeof step.id === "string" &&
    typeof step.label === "string" &&
    isGoldenPathStepStatus(step.status) &&
    typeof step.passed === "boolean" &&
    typeof step.detail === "string" &&
    (step.actionId === null || typeof step.actionId === "string")
  );
}

function isGoldenPathStepStatus(value: unknown): value is GoldenPathStepStatus {
  return value === "passed" || value === "review" || value === "blocked";
}

function isGoldenPathWorkspace(value: unknown): value is GoldenPathWorkspace {
  if (!value || typeof value !== "object") {
    return false;
  }
  const workspace = value as Partial<GoldenPathWorkspace>;
  return (
    typeof workspace.id === "string" &&
    typeof workspace.label === "string" &&
    isGoldenPathWorkspaceStatus(workspace.status) &&
    typeof workspace.current === "boolean" &&
    Array.isArray(workspace.stepIds) &&
    workspace.stepIds.every((stepId) => typeof stepId === "string") &&
    typeof workspace.reason === "string" &&
    (workspace.actionId === null || typeof workspace.actionId === "string")
  );
}

function isGoldenPathWorkspaceStatus(value: unknown): value is GoldenPathWorkspaceStatus {
  return value === "ready" || value === "needs_run" || value === "blocked";
}

function isGoldenPathSummary(value: unknown): value is GoldenPathSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<GoldenPathSummary>;
  return (
    typeof summary.totalSteps === "number" &&
    typeof summary.passedSteps === "number" &&
    typeof summary.reviewSteps === "number" &&
    typeof summary.blockedSteps === "number" &&
    (summary.currentStepLabel === null || typeof summary.currentStepLabel === "string") &&
    (summary.nextActionId === null || typeof summary.nextActionId === "string") &&
    typeof summary.liveTradingAllowed === "boolean"
  );
}

function isGoldenPathRunbookItem(value: unknown): value is GoldenPathRunbookItem {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as Partial<GoldenPathRunbookItem>;
  return (
    typeof item.stepId === "string" &&
    typeof item.label === "string" &&
    typeof item.workspaceId === "string" &&
    isGoldenPathStepStatus(item.status) &&
    typeof item.current === "boolean" &&
    typeof item.passed === "boolean" &&
    typeof item.detail === "string" &&
    (item.blocker === null || typeof item.blocker === "string") &&
    (item.actionId === null || typeof item.actionId === "string") &&
    (item.actionLabel === null || typeof item.actionLabel === "string") &&
    (item.targetWorkspace === undefined || item.targetWorkspace === null || typeof item.targetWorkspace === "string")
  );
}

function isGoldenPathNextAction(value: unknown): value is GoldenPathNextAction {
  if (!value || typeof value !== "object") {
    return false;
  }
  const action = value as Partial<GoldenPathNextAction>;
  return (
    typeof action.id === "string" &&
    typeof action.label === "string" &&
    typeof action.targetWorkspace === "string" &&
    typeof action.reason === "string"
  );
}
