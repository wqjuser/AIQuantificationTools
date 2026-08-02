import type { Market } from "./terminal-workbench";
import {
  buildApiUrl,
  defaultFetcher,
  type WorkspaceFetcher
} from "./terminal-api-http";
import {
  isMarket,
  isNumberRecord
} from "./terminal-api-contract";
import {
  isPlatformSettingsTone,
  type PlatformSettingsStatusTone
} from "./platform-settings";

type WorkspaceSource = "core" | "fallback";

export type ExecutionAdapterLedgerState =
  | "paper_ready"
  | "live_ready"
  | "live_blocked"
  | "config_required"
  | "blocked"
  | string;

export interface ExecutionAdapterLedgerGate {
  id: string;
  label: string;
  passed: boolean;
  reason: string;
}

export interface ExecutionAdapterLedgerEvent {
  eventId: string;
  adapterId: string;
  timestamp: string;
  state: ExecutionAdapterLedgerState;
  label: string;
  actor: string;
  source: string;
  reason: string;
  liveTradingAllowed: boolean;
}

export interface ExecutionAdapterLedgerAdapter {
  id: string;
  market: Market | "multi";
  adapter: string;
  route: "paper" | "live";
  status: PlatformSettingsStatusTone;
  certification: string;
  currentState: ExecutionAdapterLedgerState;
  liveTradingAllowed: boolean;
  note: string;
  nextStep: string;
  gates: ExecutionAdapterLedgerGate[];
  events: ExecutionAdapterLedgerEvent[];
}

export interface ExecutionAdapterLedgerSummary {
  adapterCount: number;
  liveAdapterCount: number;
  certifiedLiveAdapters: number;
  paperReadyAdapters: number;
  blockedLiveAdapters: number;
  configRequiredAdapters: number;
  requiredGateCount: number;
  stateCounts?: Record<string, number>;
}

export interface ExecutionAdapterLedger {
  schemaVersion: 1;
  generatedAt: string;
  mode: "execution_adapter_state_ledger";
  liveTradingAllowed: boolean;
  requiredGates: string[];
  summary: ExecutionAdapterLedgerSummary;
  adapters: ExecutionAdapterLedgerAdapter[];
}

export interface ExecutionAdapterLedgerResult {
  adapterLedger?: ExecutionAdapterLedger;
  source: WorkspaceSource;
  error?: string;
}

export function buildExecutionAdapterLedgerUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/execution/adapter-ledger");
}

export async function loadExecutionAdapterLedger(
  baseUrl: string,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ExecutionAdapterLedgerResult> {
  try {
    const response = await fetcher(buildExecutionAdapterLedgerUrl(baseUrl));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isExecutionAdapterLedgerPayload(payload)) {
      throw new Error("Invalid execution adapter ledger contract");
    }
    return {
      adapterLedger: payload.adapterLedger,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown execution adapter ledger error"
    };
  }
}

function isExecutionAdapterLedgerPayload(value: unknown): value is { adapterLedger: ExecutionAdapterLedger } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { adapterLedger?: unknown };
  return isExecutionAdapterLedger(payload.adapterLedger);
}

function isExecutionAdapterLedger(value: unknown): value is ExecutionAdapterLedger {
  if (!value || typeof value !== "object") {
    return false;
  }
  const ledger = value as Partial<ExecutionAdapterLedger>;
  return (
    ledger.schemaVersion === 1 &&
    typeof ledger.generatedAt === "string" &&
    ledger.mode === "execution_adapter_state_ledger" &&
    typeof ledger.liveTradingAllowed === "boolean" &&
    Array.isArray(ledger.requiredGates) &&
    ledger.requiredGates.every((gate) => typeof gate === "string") &&
    isExecutionAdapterLedgerSummary(ledger.summary) &&
    Array.isArray(ledger.adapters) &&
    ledger.adapters.every(isExecutionAdapterLedgerAdapter)
  );
}

function isExecutionAdapterLedgerSummary(value: unknown): value is ExecutionAdapterLedgerSummary {
  if (!value || typeof value !== "object") {
    return false;
  }
  const summary = value as Partial<ExecutionAdapterLedgerSummary>;
  return (
    typeof summary.adapterCount === "number" &&
    typeof summary.liveAdapterCount === "number" &&
    typeof summary.certifiedLiveAdapters === "number" &&
    typeof summary.paperReadyAdapters === "number" &&
    typeof summary.blockedLiveAdapters === "number" &&
    typeof summary.configRequiredAdapters === "number" &&
    typeof summary.requiredGateCount === "number" &&
    (summary.stateCounts === undefined || isNumberRecord(summary.stateCounts))
  );
}

function isExecutionAdapterLedgerAdapter(value: unknown): value is ExecutionAdapterLedgerAdapter {
  if (!value || typeof value !== "object") {
    return false;
  }
  const adapter = value as Partial<ExecutionAdapterLedgerAdapter>;
  return (
    typeof adapter.id === "string" &&
    (isMarket(adapter.market) || adapter.market === "multi") &&
    typeof adapter.adapter === "string" &&
    (adapter.route === "paper" || adapter.route === "live") &&
    isPlatformSettingsTone(adapter.status) &&
    typeof adapter.certification === "string" &&
    typeof adapter.currentState === "string" &&
    typeof adapter.liveTradingAllowed === "boolean" &&
    typeof adapter.note === "string" &&
    typeof adapter.nextStep === "string" &&
    Array.isArray(adapter.gates) &&
    adapter.gates.every(isExecutionAdapterLedgerGate) &&
    Array.isArray(adapter.events) &&
    adapter.events.every(isExecutionAdapterLedgerEvent)
  );
}

function isExecutionAdapterLedgerGate(value: unknown): value is ExecutionAdapterLedgerGate {
  if (!value || typeof value !== "object") {
    return false;
  }
  const gate = value as Partial<ExecutionAdapterLedgerGate>;
  return (
    typeof gate.id === "string" &&
    typeof gate.label === "string" &&
    typeof gate.passed === "boolean" &&
    typeof gate.reason === "string"
  );
}

function isExecutionAdapterLedgerEvent(value: unknown): value is ExecutionAdapterLedgerEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  const event = value as Partial<ExecutionAdapterLedgerEvent>;
  return (
    typeof event.eventId === "string" &&
    typeof event.adapterId === "string" &&
    typeof event.timestamp === "string" &&
    typeof event.state === "string" &&
    typeof event.label === "string" &&
    typeof event.actor === "string" &&
    typeof event.source === "string" &&
    typeof event.reason === "string" &&
    typeof event.liveTradingAllowed === "boolean"
  );
}
