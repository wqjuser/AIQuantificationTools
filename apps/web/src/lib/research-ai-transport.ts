import { isAiReviewProviderId, type AiReviewProviderId } from "./ai-review-stage3";
import {
  hasExactObjectKeys,
  isMarket,
  isTimeframe,
  type TerminalResearchParams
} from "./terminal-api-contract";
import {
  buildApiUrl,
  coreErrorDetail,
  defaultFetcher,
  resolveRequestOptions,
  type WorkspaceFetcher
} from "./terminal-api-http";
import {
  isStrategyValidation,
  type StrategyLibraryConfig,
  type StrategyValidation
} from "./strategy-transport";
import type { Market, StrategyRuleDraft, Timeframe } from "./terminal-workbench";

type WorkspaceSource = "core" | "fallback";

export interface ResearchNote {
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  body: string;
  updatedAt: string | null;
}

export interface ResearchNoteResult {
  note?: ResearchNote;
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchNoteDraft {
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  body: string;
}

export interface ResearchNoteDraftGeneration {
  requestedProvider: AiReviewProviderId;
  usedProvider: AiReviewProviderId;
  status: "completed" | "failed" | "skipped";
  fallbackUsed: boolean;
  model: string | null;
  sanitizedBaseUrl: string | null;
  latencyMs: number;
  warning: string | null;
  errorCode: string | null;
  externalDataApproved: boolean;
  outboundFields: string[];
}

export interface ResearchNoteDraftResult {
  draft?: ResearchNoteDraft;
  generation?: ResearchNoteDraftGeneration;
  boundary?: {
    draftOnly: true;
    saved: false;
    paperOnly: true;
    liveTradingAllowed: false;
    orderSubmissionAllowed: false;
  };
  source: WorkspaceSource;
  error?: string;
}

export interface StrategyAiDraftParams {
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  goal: string;
  currentDraft: StrategyRuleDraft;
  providerId: AiReviewProviderId;
  externalDataApproved: boolean;
}

export interface StrategyAiDraftCandidate {
  market: Market;
  symbol: string;
  timeframe: Timeframe;
  goal: string;
  draft: StrategyRuleDraft;
  reasons: string[];
}

export type StrategyAiDraftGeneration = ResearchNoteDraftGeneration;

export interface StrategyAiDraftBoundary {
  draftOnly: true;
  applied: false;
  saved: false;
  auditBound: false;
  paperOnly: true;
  liveTradingAllowed: false;
  orderSubmissionAllowed: false;
  orderSubmissionEnabled: false;
  routeExecuted: false;
  liveBlockedBoundary: true;
}

export interface StrategyAiDraftResult {
  candidate?: StrategyAiDraftCandidate;
  validation?: StrategyValidation;
  generation?: StrategyAiDraftGeneration;
  boundary?: StrategyAiDraftBoundary;
  source: WorkspaceSource;
  error?: string;
}

export interface ResearchNoteSaveParams extends TerminalResearchParams {
  body: string;
}

export interface ResearchNoteDraftParams extends TerminalResearchParams {
  providerId: AiReviewProviderId;
  externalDataApproved: boolean;
}

export interface ResearchNoteDraftStreamOptions {
  signal?: AbortSignal;
  onDraft?: (
    body: string,
    result?: ResearchNoteDraftResult
  ) => void | Promise<void>;
  onReset?: () => void | Promise<void>;
}

export interface ResearchNoteDraftStreamIdentity {
  requestId: number;
  draftVersion: number;
  market: Market;
  symbol: string;
  timeframe: Timeframe;
}

export function isResearchNoteDraftStreamCurrent(
  expected: ResearchNoteDraftStreamIdentity,
  current: ResearchNoteDraftStreamIdentity,
  aborted = false
): boolean {
  return !aborted
    && current.requestId === expected.requestId
    && current.draftVersion === expected.draftVersion
    && current.market === expected.market
    && current.symbol === expected.symbol
    && current.timeframe === expected.timeframe;
}

const RESEARCH_NOTE_DRAFT_STREAM_MAX_EVENTS = 512;
const RESEARCH_NOTE_DRAFT_STREAM_MAX_BYTES = 1_000_000;

export function buildStrategyAiDraftUrl(baseUrl: string): string {
  return buildApiUrl(baseUrl, "api/strategies/ai-drafts");
}

export function buildResearchNoteUrl(
  baseUrl: string,
  market: Market,
  symbol: string,
  timeframe: Timeframe
): string {
  return buildApiUrl(baseUrl, "api/research/notes", (url) => {
    url.searchParams.set("market", market);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("timeframe", timeframe);
  });
}

export async function loadResearchNote(
  baseUrl: string,
  params: TerminalResearchParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchNoteResult> {
  try {
    const response = await fetcher(buildResearchNoteUrl(baseUrl, params.market, params.symbol, params.timeframe));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchNotePayload(payload)) {
      throw new Error("Invalid research note contract");
    }
    return {
      note: payload.note,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research note load error"
    };
  }
}

export async function saveResearchNote(
  baseUrl: string,
  params: ResearchNoteSaveParams,
  fetcher: WorkspaceFetcher = defaultFetcher
): Promise<ResearchNoteResult> {
  try {
    const response = await fetcher(buildApiUrl(baseUrl, "api/research/notes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        market: params.market,
        symbol: params.symbol,
        timeframe: params.timeframe,
        body: params.body
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status ?? "error"}`);
    }
    const payload = await response.json();
    if (!isResearchNotePayload(payload)) {
      throw new Error("Invalid research note contract");
    }
    return {
      note: payload.note,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research note save error"
    };
  }
}

export async function generateStrategyAiDraft(
  baseUrl: string,
  params: StrategyAiDraftParams,
  signalOrFetcher?: AbortSignal | WorkspaceFetcher,
  maybeFetcher: WorkspaceFetcher = defaultFetcher
): Promise<StrategyAiDraftResult> {
  const { signal, fetcher } = resolveRequestOptions(signalOrFetcher, maybeFetcher);
  try {
    const response = await fetcher(buildStrategyAiDraftUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        market: params.market,
        symbol: params.symbol,
        timeframe: params.timeframe,
        goal: params.goal,
        currentDraft: params.currentDraft,
        providerId: params.providerId,
        externalDataApproved: params.externalDataApproved
      }),
      ...(signal ? { signal } : {})
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
    }
    if (!isStrategyAiDraftPayload(payload, params)) {
      throw new Error("Invalid AI strategy draft contract");
    }
    return {
      ...payload,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown AI strategy draft error"
    };
  }
}

export async function generateResearchNoteDraft(
  baseUrl: string,
  params: ResearchNoteDraftParams,
  fetcher: WorkspaceFetcher = defaultFetcher,
  streamOptions: ResearchNoteDraftStreamOptions = {}
): Promise<ResearchNoteDraftResult> {
  try {
    const response = await fetcher(buildApiUrl(baseUrl, "api/research/note-drafts"), {
      method: "POST",
      headers: {
        Accept: "application/x-ndjson",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        market: params.market,
        symbol: params.symbol,
        timeframe: params.timeframe,
        providerId: params.providerId,
        externalDataApproved: params.externalDataApproved
      }),
      ...(streamOptions.signal ? { signal: streamOptions.signal } : {})
    });
    if (!response.ok) {
      const payload = await response.json();
      throw new Error(coreErrorDetail(payload) ?? `HTTP ${response.status ?? "error"}`);
    }
    if (response.body) {
      return await readResearchNoteDraftStream(
        response.body,
        params,
        streamOptions
      );
    }
    const payload = await response.json();
    if (!isResearchNoteDraftPayload(payload)) {
      throw new Error("Invalid research note draft contract");
    }
    return {
      ...payload,
      source: "core"
    };
  } catch (error) {
    return {
      source: "fallback",
      error: error instanceof Error ? error.message : "Unknown research note draft error"
    };
  }
}

async function readResearchNoteDraftStream(
  body: ReadableStream<Uint8Array>,
  params: ResearchNoteDraftParams,
  streamOptions: ResearchNoteDraftStreamOptions
): Promise<ResearchNoteDraftResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventCount = 0;
  let receivedBytes = 0;
  let started = false;
  let completed = false;
  let accumulatedBody = "";
  let streamedDraftBody = "";
  let draftStreamStarted = false;
  let resetAfterDraft = false;
  let readyPayload: {
    draft: ResearchNoteDraft;
    generation: ResearchNoteDraftGeneration;
    boundary: NonNullable<ResearchNoteDraftResult["boundary"]>;
  } | null = null;

  const consumeLine = async (line: string) => {
    if (streamOptions.signal?.aborted) {
      throw new DOMException("Research note draft stream aborted", "AbortError");
    }
    if (!line.trim()) {
      return;
    }
    eventCount += 1;
    if (eventCount > RESEARCH_NOTE_DRAFT_STREAM_MAX_EVENTS) {
      throw new Error("Research note draft stream has too many events");
    }
    const parsed: unknown = JSON.parse(line);
    if (
      typeof parsed !== "object"
      || parsed === null
      || Array.isArray(parsed)
      || typeof (parsed as { type?: unknown }).type !== "string"
    ) {
      throw new Error("Invalid research note draft stream event");
    }
    const event = parsed as Record<string, unknown>;
    if (completed) {
      throw new Error("Research note draft stream continued after completion");
    }
    if (event.type === "started") {
      if (!hasExactObjectKeys(event, ["type"]) || started) {
        throw new Error("Invalid research note draft stream start");
      }
      started = true;
      return;
    }
    if (!started) {
      throw new Error("Research note draft stream did not start");
    }
    if (event.type === "error") {
      if (
        !hasExactObjectKeys(event, ["type", "error", "detail", "status"])
        || readyPayload
        || draftStreamStarted
        || typeof event.error !== "string"
        || !event.error.trim()
        || typeof event.detail !== "string"
        || !event.detail.trim()
        || !Number.isInteger(event.status)
      ) {
        throw new Error("Invalid research note draft stream error");
      }
      throw new Error(
        event.detail
      );
    }
    if (event.type === "draft") {
      if (
        !hasExactObjectKeys(event, ["type", "body"])
        || readyPayload
        || resetAfterDraft
        || typeof event.body !== "string"
        || !event.body.trim()
        || event.body.length <= streamedDraftBody.length
        || !event.body.startsWith(streamedDraftBody)
      ) {
        throw new Error("Invalid research note draft stream update");
      }
      draftStreamStarted = true;
      streamedDraftBody = event.body;
      await streamOptions.onDraft?.(streamedDraftBody);
      return;
    }
    if (event.type === "reset") {
      if (
        !hasExactObjectKeys(event, ["type"])
        || readyPayload
        || !draftStreamStarted
        || resetAfterDraft
      ) {
        throw new Error("Invalid research note draft stream reset");
      }
      resetAfterDraft = true;
      streamedDraftBody = "";
      await streamOptions.onReset?.();
      return;
    }
    if (event.type === "ready") {
      if (
        !hasExactObjectKeys(event, ["type", "payload"])
        || readyPayload
        || !isResearchNoteDraftPayload(event.payload)
      ) {
        throw new Error("Invalid research note draft stream payload");
      }
      if (
        event.payload.draft.market !== params.market
        || event.payload.draft.symbol !== params.symbol
        || event.payload.draft.timeframe !== params.timeframe
      ) {
        throw new Error("Research note draft stream context mismatch");
      }
      const completedExternally = event.payload.generation.status === "completed"
        && !event.payload.generation.fallbackUsed;
      const localBaseline = event.payload.generation.status === "skipped"
        && !event.payload.generation.fallbackUsed;
      const localFallback = event.payload.generation.status === "failed"
        && event.payload.generation.fallbackUsed;
      if (!completedExternally && !localBaseline && !localFallback) {
        throw new Error("Research note draft stream generation mismatch");
      }
      if (completedExternally) {
        if (
          resetAfterDraft
          || !draftStreamStarted
          || streamedDraftBody !== event.payload.draft.body
        ) {
          throw new Error("Research note draft stream update mismatch");
        }
      } else if (
        draftStreamStarted
        && (
          !resetAfterDraft
          || !localFallback
        )
      ) {
        throw new Error("Research note draft stream fallback mismatch");
      }
      readyPayload = event.payload;
      return;
    }
    if (event.type === "delta") {
      if (
        !hasExactObjectKeys(event, ["type", "text"])
        || !readyPayload
        || !(
          (
            readyPayload.generation.status === "skipped"
            && !readyPayload.generation.fallbackUsed
          )
          || (
            readyPayload.generation.status === "failed"
            && readyPayload.generation.fallbackUsed
          )
        )
        || typeof event.text !== "string"
        || !event.text
      ) {
        throw new Error("Invalid research note draft stream delta");
      }
      const nextBody = accumulatedBody + event.text;
      if (!readyPayload.draft.body.startsWith(nextBody)) {
        throw new Error("Research note draft stream body mismatch");
      }
      accumulatedBody = nextBody;
      await streamOptions.onDraft?.(accumulatedBody, {
        ...readyPayload,
        source: "core"
      });
      return;
    }
    if (event.type === "complete") {
      if (!hasExactObjectKeys(event, ["type"]) || !readyPayload) {
        throw new Error("Invalid research note draft stream completion");
      }
      const completedExternally = readyPayload.generation.status === "completed"
        && !readyPayload.generation.fallbackUsed;
      if (
        completedExternally
          ? streamedDraftBody !== readyPayload.draft.body
          : accumulatedBody !== readyPayload.draft.body
      ) {
        throw new Error("Research note draft stream body mismatch");
      }
      completed = true;
      return;
    }
    throw new Error("Unknown research note draft stream event");
  };

  try {
    while (true) {
      if (streamOptions.signal?.aborted) {
        throw new DOMException("Research note draft stream aborted", "AbortError");
      }
      const { done, value } = await reader.read();
      receivedBytes += value?.byteLength ?? 0;
      if (receivedBytes > RESEARCH_NOTE_DRAFT_STREAM_MAX_BYTES) {
        throw new Error("Research note draft stream is too large");
      }
      buffer += done
        ? decoder.decode()
        : decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        await consumeLine(line);
      }
      if (done) {
        if (buffer.trim()) {
          await consumeLine(buffer);
        }
        break;
      }
    }
    if (!completed || !readyPayload) {
      throw new Error("Research note draft stream ended before completion");
    }
  } catch (error) {
    try {
      await reader.cancel(error);
    } catch {
      // Preserve the original protocol or transport failure.
    }
    throw error;
  } finally {
    reader.releaseLock();
  }
  const finalPayload = readyPayload as {
    draft: ResearchNoteDraft;
    generation: ResearchNoteDraftGeneration;
    boundary: NonNullable<ResearchNoteDraftResult["boundary"]>;
  } | null;
  return {
    ...finalPayload!,
    source: "core"
  };
}

function isResearchNotePayload(value: unknown): value is { note: ResearchNote } {
  if (!value || typeof value !== "object") {
    return false;
  }
  const payload = value as { note?: unknown };
  return isResearchNote(payload.note);
}

function isResearchNote(value: unknown): value is ResearchNote {
  if (!value || typeof value !== "object") {
    return false;
  }
  const note = value as Partial<ResearchNote>;
  return (
    isMarket(note.market) &&
    typeof note.symbol === "string" &&
    isTimeframe(note.timeframe) &&
    typeof note.body === "string" &&
    (note.updatedAt === null || typeof note.updatedAt === "string")
  );
}

function isResearchNoteDraftPayload(value: unknown): value is {
  draft: ResearchNoteDraft;
  generation: ResearchNoteDraftGeneration;
  boundary: NonNullable<ResearchNoteDraftResult["boundary"]>;
} {
  if (!hasExactObjectKeys(value, ["draft", "generation", "boundary"])) {
    return false;
  }
  const { draft, generation, boundary } = value;
  if (
    !hasExactObjectKeys(draft, ["market", "symbol", "timeframe", "body"])
    || !isMarket(draft.market)
    || typeof draft.symbol !== "string"
    || !draft.symbol.trim()
    || !isTimeframe(draft.timeframe)
    || typeof draft.body !== "string"
    || !draft.body.trim()
    || !hasExactObjectKeys(generation, [
      "requestedProvider",
      "usedProvider",
      "status",
      "fallbackUsed",
      "model",
      "sanitizedBaseUrl",
      "latencyMs",
      "warning",
      "errorCode",
      "externalDataApproved",
      "outboundFields"
    ])
    || !isAiReviewProviderId(generation.requestedProvider)
    || !isAiReviewProviderId(generation.usedProvider)
    || !["completed", "failed", "skipped"].includes(String(generation.status))
    || typeof generation.fallbackUsed !== "boolean"
    || (generation.model !== null && typeof generation.model !== "string")
    || (generation.sanitizedBaseUrl !== null && typeof generation.sanitizedBaseUrl !== "string")
    || !Number.isInteger(generation.latencyMs)
    || Number(generation.latencyMs) < 0
    || (generation.warning !== null && typeof generation.warning !== "string")
    || (generation.errorCode !== null && typeof generation.errorCode !== "string")
    || typeof generation.externalDataApproved !== "boolean"
    || !Array.isArray(generation.outboundFields)
    || !generation.outboundFields.every((item) => typeof item === "string")
    || !hasExactObjectKeys(boundary, [
      "draftOnly",
      "saved",
      "paperOnly",
      "liveTradingAllowed",
      "orderSubmissionAllowed"
    ])
    || boundary.draftOnly !== true
    || boundary.saved !== false
    || boundary.paperOnly !== true
    || boundary.liveTradingAllowed !== false
    || boundary.orderSubmissionAllowed !== false
  ) {
    return false;
  }
  if (generation.requestedProvider === "local") {
    return generation.usedProvider === "local"
      && generation.status === "skipped"
      && generation.fallbackUsed === false
      && generation.externalDataApproved === false
      && generation.outboundFields.length === 0;
  }
  if (!generation.externalDataApproved || generation.outboundFields.length === 0) {
    return false;
  }
  return generation.status === "completed"
    ? generation.usedProvider === generation.requestedProvider
      && generation.fallbackUsed === false
      && generation.errorCode === null
    : generation.status === "failed"
      ? generation.usedProvider === "local"
        && generation.fallbackUsed === true
        && typeof generation.errorCode === "string"
        && generation.errorCode.length > 0
      : false;
}

function isStrategyAiDraftPayload(
  value: unknown,
  expected: StrategyAiDraftParams
): value is {
  candidate: StrategyAiDraftCandidate;
  validation: StrategyValidation;
  generation: StrategyAiDraftGeneration;
  boundary: StrategyAiDraftBoundary;
} {
  if (!hasExactObjectKeys(value, ["candidate", "validation", "generation", "boundary"])) {
    return false;
  }
  const { candidate, validation, generation, boundary } = value;
  if (
    !hasExactObjectKeys(candidate, ["market", "symbol", "timeframe", "goal", "draft", "reasons"])
    || candidate.market !== expected.market
    || candidate.symbol !== expected.symbol
    || candidate.timeframe !== expected.timeframe
    || candidate.goal !== expected.goal.trim()
    || !isStrategyAiRuleDraft(candidate.draft)
    || !isStrategyAiDraftReasons(candidate.reasons)
    || !hasExactObjectKeys(validation, ["status", "revision", "gates", "strategyConfig"])
    || !isStrategyValidation(validation)
    || validation.revision !== validation.strategyConfig.revision
    || validation.strategyConfig.market !== candidate.market
    || validation.strategyConfig.timeframe !== candidate.timeframe
    || validation.strategyConfig.symbols.length !== 1
    || validation.strategyConfig.symbols[0] !== candidate.symbol
    || validation.strategyConfig.name !== candidate.draft.name
    || !isStrategyAiDraftValidationConfig(candidate.draft, validation.strategyConfig)
    || !isStrategyAiDraftGeneration(generation, expected)
    || !hasExactObjectKeys(boundary, [
      "draftOnly",
      "applied",
      "saved",
      "auditBound",
      "paperOnly",
      "liveTradingAllowed",
      "orderSubmissionAllowed",
      "orderSubmissionEnabled",
      "routeExecuted",
      "liveBlockedBoundary"
    ])
    || boundary.draftOnly !== true
    || boundary.applied !== false
    || boundary.saved !== false
    || boundary.auditBound !== false
    || boundary.paperOnly !== true
    || boundary.liveTradingAllowed !== false
    || boundary.orderSubmissionAllowed !== false
    || boundary.orderSubmissionEnabled !== false
    || boundary.routeExecuted !== false
    || boundary.liveBlockedBoundary !== true
  ) {
    return false;
  }
  return true;
}

function isStrategyAiDraftValidationConfig(
  draft: StrategyRuleDraft,
  config: StrategyLibraryConfig
): boolean {
  const entryConditions: Array<{ kind: string; params: Record<string, number> }> = [
    draft.entryKind === "rsi_below"
      ? { kind: draft.entryKind, params: { window: draft.entryWindow, threshold: draft.entryThreshold } }
      : { kind: draft.entryKind, params: { window: draft.entryWindow } }
  ];
  if (draft.entryRsiConfirm) {
    entryConditions.push({
      kind: "rsi_above",
      params: { window: draft.entryRsiWindow, threshold: draft.entryRsiThreshold }
    });
  }
  if (draft.entryVolumeConfirm) {
    entryConditions.push({ kind: "volume_above_sma", params: { window: draft.entryVolumeWindow } });
  }
  const exitCondition: { kind: string; params: Record<string, number> } = draft.exitKind === "rsi_above"
    ? { kind: draft.exitKind, params: { window: draft.exitWindow, threshold: draft.exitThreshold } }
    : { kind: draft.exitKind, params: { window: draft.exitWindow } };
  return config.entryConditions.length === entryConditions.length
    && config.entryConditions.every((condition, index) =>
      isExactStrategyAiCondition(condition, entryConditions[index])
    )
    && config.exitConditions.length === 1
    && isExactStrategyAiCondition(config.exitConditions[0], exitCondition)
    && config.risk.positionPct === draft.positionPct / 100
    && config.risk.stopLossPct === draft.stopLossPct / 100
    && config.risk.takeProfitPct === draft.takeProfitPct / 100
    && config.risk.maxDrawdownPct === draft.maxDrawdownPct / 100;
}

function isExactStrategyAiCondition(
  actual: StrategyLibraryConfig["entryConditions"][number],
  expected: { kind: string; params: Record<string, number> }
): boolean {
  return actual.kind === expected.kind
    && Object.keys(actual.params).length === Object.keys(expected.params).length
    && Object.entries(expected.params).every(([key, value]) => actual.params[key] === value);
}

function isStrategyAiRuleDraft(value: unknown): value is StrategyRuleDraft {
  if (!hasExactObjectKeys(value, [
    "name",
    "entryKind",
    "entryWindow",
    "entryThreshold",
    "entryRsiConfirm",
    "entryRsiWindow",
    "entryRsiThreshold",
    "entryVolumeConfirm",
    "entryVolumeWindow",
    "exitKind",
    "exitWindow",
    "exitThreshold",
    "positionPct",
    "stopLossPct",
    "takeProfitPct",
    "maxDrawdownPct",
    "paperOnly"
  ])) {
    return false;
  }
  const windows = [value.entryWindow, value.entryRsiWindow, value.entryVolumeWindow, value.exitWindow];
  const thresholds = [value.entryThreshold, value.entryRsiThreshold, value.exitThreshold];
  const positivePercents = [value.positionPct, value.stopLossPct, value.takeProfitPct, value.maxDrawdownPct];
  return typeof value.name === "string"
    && value.name === value.name.trim()
    && value.name.length >= 1
    && value.name.length <= 80
    && !value.name.includes("\n")
    && (value.entryKind === "close_above_sma" || value.entryKind === "rsi_below")
    && (value.exitKind === "close_below_sma" || value.exitKind === "rsi_above")
    && typeof value.entryRsiConfirm === "boolean"
    && typeof value.entryVolumeConfirm === "boolean"
    && !(value.entryKind === "rsi_below" && value.entryRsiConfirm)
    && windows.every((item) => Number.isInteger(item) && Number(item) >= 1 && Number(item) <= 250)
    && thresholds.every((item) => typeof item === "number" && Number.isFinite(item) && item >= 0 && item <= 100)
    && positivePercents.every((item) => typeof item === "number" && Number.isFinite(item) && item > 0 && item <= 100)
    && value.paperOnly === true;
}

function isStrategyAiDraftReasons(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.length >= 3
    && value.length <= 6
    && value.every((reason) =>
      typeof reason === "string"
      && reason === reason.trim()
      && reason.length >= 1
      && reason.length <= 240
      && /\p{Script=Han}/u.test(reason)
    );
}

function isStrategyAiDraftGeneration(
  value: unknown,
  expected: StrategyAiDraftParams
): value is StrategyAiDraftGeneration {
  if (!hasExactObjectKeys(value, [
    "requestedProvider",
    "usedProvider",
    "status",
    "fallbackUsed",
    "model",
    "sanitizedBaseUrl",
    "latencyMs",
    "warning",
    "errorCode",
    "externalDataApproved",
    "outboundFields"
  ])) {
    return false;
  }
  if (
    !isAiReviewProviderId(value.requestedProvider)
    || !isAiReviewProviderId(value.usedProvider)
    || value.requestedProvider !== expected.providerId
    || typeof value.fallbackUsed !== "boolean"
    || (value.model !== null && typeof value.model !== "string")
    || (value.sanitizedBaseUrl !== null && typeof value.sanitizedBaseUrl !== "string")
    || !Number.isInteger(value.latencyMs)
    || Number(value.latencyMs) < 0
    || (value.warning !== null && typeof value.warning !== "string")
    || (value.errorCode !== null && typeof value.errorCode !== "string")
    || value.externalDataApproved !== expected.externalDataApproved
    || !Array.isArray(value.outboundFields)
    || !value.outboundFields.every((item) => typeof item === "string")
  ) {
    return false;
  }
  if (value.requestedProvider === "local") {
    return value.usedProvider === "local"
      && value.status === "skipped"
      && value.fallbackUsed === false
      && value.errorCode === null
      && value.externalDataApproved === false
      && value.outboundFields.length === 0;
  }
  const expectedOutboundFields = ["market", "symbol", "timeframe", "goal", "currentDraft"];
  if (
    !value.externalDataApproved
    || value.outboundFields.length !== expectedOutboundFields.length
    || !value.outboundFields.every((item, index) => item === expectedOutboundFields[index])
  ) {
    return false;
  }
  return value.status === "completed"
    ? value.usedProvider === value.requestedProvider
      && value.fallbackUsed === false
      && value.errorCode === null
    : value.status === "failed"
      ? value.usedProvider === "local"
        && value.fallbackUsed === true
        && typeof value.errorCode === "string"
        && value.errorCode.length > 0
      : false;
}
