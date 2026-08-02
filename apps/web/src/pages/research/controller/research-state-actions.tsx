import { type AiReviewProviderId, type AiReviewProviderStatus } from "../../../lib/ai-review-stage3";
import { generateResearchNoteDraft, HandoffNotesResult, isResearchNoteDraftStreamCurrent, loadHandoffNotes, loadResearchNote, loadResearchRunHistory, ResearchNoteResult, saveHandoffNote, saveResearchNote, saveResearchWorkspaceState } from "../../../lib/terminal-api";
import { buildAuditEvidenceReportLedgerRowResearchContextReportQuery, buildResearchContextEvidenceRows, buildResearchContextReportCoverageForContext, buildResearchRunContextBinding, buildResearchRunExportBrowserRows, buildResearchRunExportIndexRows, buildResearchWorkspaceStateDraft, researchWorkspaceStateMatchesDraft, Timeframe, workspaceWithSavedResearchWorkspaceState } from "../../../lib/terminal-workbench";
import { initialHandoffNotesState, initialResearchNoteState, initialRunHistoryState, quantCoreBaseUrl } from "../../app-shell/initial-state";
import { hasExplicitWorkAreaUrl } from "../../app-shell/url-state";
import { waitForNextPaint } from "../../app-shell/workflow-runtime";
import { useCallback, useMemo, useRef, useState } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activeWorkAreaId" | "auditEvidenceReportLedgerRows" | "copyAuditReportLedgerEvidenceLink" | "copyAuditReportLedgerQueryLink" | "error" | "indexedExportPackages" | "initialImportAuditEvidenceDeepLink" | "inspectedExportPackage" | "setActiveWorkAreaId" | "setIndexedExportPackages" | "setInspectedExportPackage" | "setWorkspaceState" | "source" | "statusLabel" | "workspace" | "workspaceRef">;
type Result = Pick<AppControllerBindings, "runHistory" | "setRunHistoryState" | "researchNoteState" | "setResearchNoteState" | "handoffNotesState" | "setHandoffNotesState" | "researchNoteDraft" | "setResearchNoteDraft" | "researchNoteProviders" | "setResearchNoteProviders" | "researchNoteProviderId" | "setResearchNoteProviderId" | "researchNoteExternalDataApproved" | "setResearchNoteExternalDataApproved" | "researchNoteGenerationError" | "setResearchNoteGenerationError" | "researchNoteGenerationStatus" | "setResearchNoteGenerationStatus" | "handoffNoteDraft" | "setHandoffNoteDraft" | "isSavingResearchNote" | "setIsSavingResearchNote" | "isGeneratingResearchNoteDraft" | "setIsGeneratingResearchNoteDraft" | "isSavingHandoffNote" | "setIsSavingHandoffNote" | "isSavingResearchWorkspace" | "setIsSavingResearchWorkspace" | "isResearchPipelineConfirmationOpen" | "setIsResearchPipelineConfirmationOpen" | "researchCompletionNotice" | "setResearchCompletionNotice" | "researchPipelineConfirmationDialogRef" | "researchPipelineConfirmationCancelButtonRef" | "copiedStage1P0DailyUseHandoff" | "setCopiedStage1P0DailyUseHandoff" | "copiedResearchContextLink" | "setCopiedResearchContextLink" | "copiedResearchContextReadinessReport" | "setCopiedResearchContextReadinessReport" | "researchRunExportBrowserQuery" | "setResearchRunExportBrowserQuery" | "researchNoteDraftRef" | "researchNoteDraftVersionRef" | "researchNoteDraftGenerationRequestIdRef" | "researchNoteDraftGenerationAbortControllerRef" | "applyGeneratedResearchNoteDraft" | "updateResearchNoteDraft" | "editResearchNoteDraft" | "savedResearchWorkspaceSelectionAppliedRef" | "researchContextLinkCopyResetTimerRef" | "researchContextReadinessReportCopyResetTimerRef" | "canSaveResearchWorkspace" | "currentResearchWorkspaceStateDraft" | "isResearchWorkspaceSaved" | "researchRunContextBinding" | "currentResearchRunId" | "currentResearchRunIdRef" | "researchRunExportBrowserRows" | "researchRunExportIndexRows" | "researchContextReportCoverage" | "latestResearchContextReadinessReport" | "latestOtherResearchContextReadinessReport" | "researchContextEvidenceRows" | "refreshRunHistory" | "refreshResearchNote" | "refreshHandoffNotes" | "saveCurrentResearchNote" | "generateCurrentResearchNoteDraft" | "selectResearchNoteProvider" | "saveCurrentHandoffNote" | "saveCurrentResearchWorkspace" | "copyLatestResearchContextReportLink" | "copyLatestOtherResearchContextReportAuditLink"> & Pick<AppControllerBindings, "dismissResearchCompletionNotice" | "closeResearchPipelinePreflight" | "approveResearchNoteExternalData">;

export function useResearchStateActions(controller: Dependencies): Result {
  const {
    activeWorkAreaId, auditEvidenceReportLedgerRows, copyAuditReportLedgerEvidenceLink, copyAuditReportLedgerQueryLink, error, indexedExportPackages,
    initialImportAuditEvidenceDeepLink, inspectedExportPackage, setActiveWorkAreaId, setIndexedExportPackages, setInspectedExportPackage, setWorkspaceState,
    source, statusLabel, workspace, workspaceRef
  } = controller;
  const [{ runs: runHistory }, setRunHistoryState] = useState(initialRunHistoryState);
  const [researchNoteState, setResearchNoteState] = useState<ResearchNoteResult>(initialResearchNoteState);
  const [handoffNotesState, setHandoffNotesState] = useState<HandoffNotesResult>(initialHandoffNotesState);
  const [researchNoteDraft, setResearchNoteDraft] = useState("");
  const [researchNoteProviders, setResearchNoteProviders] = useState<AiReviewProviderStatus[]>([
      {
        providerId: "local",
        configured: true,
        model: null,
        sanitizedBaseUrl: null
      }
    ]);
  const [researchNoteProviderId, setResearchNoteProviderId] = useState<AiReviewProviderId>("local");
  const [researchNoteExternalDataApproved, setResearchNoteExternalDataApproved] = useState(false);
  const [researchNoteGenerationError, setResearchNoteGenerationError] = useState<string | null>(null);
  const [researchNoteGenerationStatus, setResearchNoteGenerationStatus] = useState<string | null>(null);
  const [handoffNoteDraft, setHandoffNoteDraft] = useState("");
  const [isSavingResearchNote, setIsSavingResearchNote] = useState(false);
  const [isGeneratingResearchNoteDraft, setIsGeneratingResearchNoteDraft] = useState(false);
  const [isSavingHandoffNote, setIsSavingHandoffNote] = useState(false);
  const [isSavingResearchWorkspace, setIsSavingResearchWorkspace] = useState(false);
  const [isResearchPipelineConfirmationOpen, setIsResearchPipelineConfirmationOpen] = useState(false);
  const closeResearchPipelinePreflight = useCallback(
    () => setIsResearchPipelineConfirmationOpen(false),
    [],
  );
  const [researchCompletionNotice, setResearchCompletionNotice] = useState<{
      dataRows: number;
      instrumentName: string;
      readbackReady: boolean;
      runId: string;
      symbol: string;
      timeframe: Timeframe;
  } | null>(null);
  const dismissResearchCompletionNotice = useCallback(() => setResearchCompletionNotice(null), []);
  const approveResearchNoteExternalData = useCallback((approved: boolean) => {
    setResearchNoteExternalDataApproved(approved);
    setResearchNoteGenerationError(null);
    setResearchNoteGenerationStatus(null);
  }, []);
  const researchPipelineConfirmationDialogRef = useRef<HTMLDialogElement | null>(null);
  const researchPipelineConfirmationCancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const [copiedStage1P0DailyUseHandoff, setCopiedStage1P0DailyUseHandoff] = useState(false);
  const [copiedResearchContextLink, setCopiedResearchContextLink] = useState(false);
  const [copiedResearchContextReadinessReport, setCopiedResearchContextReadinessReport] = useState(false);
  const [researchRunExportBrowserQuery, setResearchRunExportBrowserQuery] = useState(initialImportAuditEvidenceDeepLink?.focusQuery ?? "");
  const researchNoteDraftRef = useRef(researchNoteDraft);
  const researchNoteDraftVersionRef = useRef(0);
  const researchNoteDraftGenerationRequestIdRef = useRef(0);
  const researchNoteDraftGenerationAbortControllerRef = useRef<AbortController | null>(null);
  const applyGeneratedResearchNoteDraft = useCallback((body: string) => {
      researchNoteDraftRef.current = body;
      setResearchNoteDraft(body);
    }, []);
  const updateResearchNoteDraft = useCallback((body: string) => {
      researchNoteDraftVersionRef.current += 1;
      researchNoteDraftRef.current = body;
      setResearchNoteDraft(body);
    }, []);
  const editResearchNoteDraft = useCallback((body: string) => {
      if (researchNoteDraftGenerationAbortControllerRef.current) {
        researchNoteDraftGenerationAbortControllerRef.current.abort();
        researchNoteDraftGenerationAbortControllerRef.current = null;
        researchNoteDraftGenerationRequestIdRef.current += 1;
        setIsGeneratingResearchNoteDraft(false);
        setResearchNoteGenerationError(null);
        setResearchNoteGenerationStatus("检测到手动编辑，已停止 AI 生成并保留当前内容。");
      }
      updateResearchNoteDraft(body);
    }, [updateResearchNoteDraft]);
  const savedResearchWorkspaceSelectionAppliedRef = useRef(hasExplicitWorkAreaUrl());
  const researchContextLinkCopyResetTimerRef = useRef<number | null>(null);
  const researchContextReadinessReportCopyResetTimerRef = useRef<number | null>(null);
  const canSaveResearchWorkspace = activeWorkAreaId === "market" || activeWorkAreaId === "research";
  const currentResearchWorkspaceStateDraft = useMemo(
      () => buildResearchWorkspaceStateDraft(workspace, activeWorkAreaId),
      [
        activeWorkAreaId,
        workspace.selectedInstrument.market,
        workspace.selectedInstrument.name,
        workspace.selectedInstrument.symbol,
        workspace.selectedTimeframe
      ]
    );
  const isResearchWorkspaceSaved = researchWorkspaceStateMatchesDraft(
      workspace.researchWorkspaceState,
      currentResearchWorkspaceStateDraft
    );
  const researchRunContextBinding = buildResearchRunContextBinding(workspace);
  const currentResearchRunId = researchRunContextBinding.canUseRun ? workspace.researchRun?.runId : null;
  const currentResearchRunIdRef = useRef(currentResearchRunId);
  const researchRunExportBrowserRows = buildResearchRunExportBrowserRows(inspectedExportPackage);
  const researchRunExportIndexRows = buildResearchRunExportIndexRows(indexedExportPackages);
  const researchContextReportCoverage = useMemo(
      () =>
        buildResearchContextReportCoverageForContext(auditEvidenceReportLedgerRows, {
          market: workspace.selectedInstrument.market,
          symbol: workspace.selectedInstrument.symbol,
          timeframe: workspace.selectedTimeframe
        }),
      [
        auditEvidenceReportLedgerRows,
        workspace.selectedInstrument.market,
        workspace.selectedInstrument.symbol,
        workspace.selectedTimeframe
      ]
    );
  const latestResearchContextReadinessReport = useMemo(() => {
      const row = researchContextReportCoverage.latestMatchingReport;
      if (!row) {
        return null;
      }
      return {
        linkSearch: row.researchContextLinkDecodedSearch || row.researchContextLinkSearch,
        preflightStatus: row.researchContextPreflightStatus,
        preparationEvidenceRunId: row.researchContextPreparationEvidenceRunId,
        query: buildAuditEvidenceReportLedgerRowResearchContextReportQuery(row),
        runId: row.runId,
        shortHash: row.shortHash
      };
    }, [
      researchContextReportCoverage.latestMatchingReport
    ]);
  const latestOtherResearchContextReadinessReport = useMemo(() => {
      const row = researchContextReportCoverage.latestOtherReport;
      if (!row) {
        return null;
      }
      return {
        contextLabel: [row.researchContextMarket, row.researchContextSymbol, row.researchContextTimeframe]
          .filter(Boolean)
          .join(" · "),
        query: buildAuditEvidenceReportLedgerRowResearchContextReportQuery(row),
        runId: row.runId,
        shortHash: row.shortHash
      };
    }, [
      researchContextReportCoverage.latestOtherReport
    ]);
  const researchContextEvidenceRows = buildResearchContextEvidenceRows(workspace);
  const refreshRunHistory = useCallback(async () => {
      const result = await loadResearchRunHistory(quantCoreBaseUrl, 50);
      setRunHistoryState(result);
      return result;
    }, []);
  const refreshResearchNote = useCallback(async () => {
      const result = await loadResearchNote(quantCoreBaseUrl, {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe
      });
      setResearchNoteState(result);
      updateResearchNoteDraft(result.note?.body ?? "");
    }, [
      updateResearchNoteDraft,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]);
  const refreshHandoffNotes = useCallback(async () => {
      const runId = workspace.researchRun?.runId;
      if (!runId) {
        setHandoffNotesState(initialHandoffNotesState);
        setHandoffNoteDraft("");
        return;
      }
      const result = await loadHandoffNotes(quantCoreBaseUrl, "research_run", runId);
      setHandoffNotesState(result);
    }, [workspace.researchRun?.runId]);
  const saveCurrentResearchNote = useCallback(async () => {
      setIsSavingResearchNote(true);
      const result = await saveResearchNote(quantCoreBaseUrl, {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe,
        body: researchNoteDraft
      });
      setResearchNoteState(result);
      if (result.note) {
        updateResearchNoteDraft(result.note.body);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research note saved",
          error: undefined
        }));
      } else {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research note save failed",
          error: result.error ?? "Research note save failed"
        }));
      }
      setIsSavingResearchNote(false);
    }, [
      researchNoteDraft,
      updateResearchNoteDraft,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]);
  const generateCurrentResearchNoteDraft = useCallback(async () => {
      const selectedProvider = researchNoteProviders.find(
        (provider) => provider.providerId === researchNoteProviderId
      );
      if (
        isGeneratingResearchNoteDraft
        || !selectedProvider?.configured
        || (researchNoteProviderId !== "local" && !researchNoteExternalDataApproved)
      ) {
        return;
      }
      const requestId = researchNoteDraftGenerationRequestIdRef.current + 1;
      researchNoteDraftGenerationRequestIdRef.current = requestId;
      researchNoteDraftGenerationAbortControllerRef.current?.abort();
      const controller = new AbortController();
      researchNoteDraftGenerationAbortControllerRef.current = controller;
      const context = {
        market: workspace.selectedInstrument.market,
        symbol: workspace.selectedInstrument.symbol,
        timeframe: workspace.selectedTimeframe
      };
      const draftVersionBeforeRequest = researchNoteDraftVersionRef.current;
      const streamIdentity = {
        requestId,
        draftVersion: draftVersionBeforeRequest,
        ...context
      };
      const draftBeforeRequest = researchNoteDraftRef.current;
      const draftWasEmptyBeforeRequest = draftBeforeRequest.trim().length === 0;
      const externalDataApprovedForRequest = researchNoteExternalDataApproved;
      if (researchNoteProviderId !== "local") {
        setResearchNoteExternalDataApproved(false);
      }
      setIsGeneratingResearchNoteDraft(true);
      setResearchNoteGenerationError(null);
      setResearchNoteGenerationStatus("正在连接 AI，内容将直接写入编辑框，完成前不可保存。");
      const result = await generateResearchNoteDraft(
        quantCoreBaseUrl,
        {
          ...context,
          providerId: researchNoteProviderId,
          externalDataApproved: externalDataApprovedForRequest
        },
        undefined,
        {
          signal: controller.signal,
          onDraft: async (body, streamedResult) => {
            const latestWorkspace = workspaceRef.current;
            if (
              !isResearchNoteDraftStreamCurrent(
                streamIdentity,
                {
                  requestId: researchNoteDraftGenerationRequestIdRef.current,
                  draftVersion: researchNoteDraftVersionRef.current,
                  market: latestWorkspace.selectedInstrument.market,
                  symbol: latestWorkspace.selectedInstrument.symbol,
                  timeframe: latestWorkspace.selectedTimeframe
                },
                controller.signal.aborted
              )
            ) {
              controller.abort();
              return;
            }
            if (
              streamedResult
              && (
                streamedResult.generation?.status === "failed"
                || streamedResult.generation?.fallbackUsed
              )
            ) {
              if (!draftWasEmptyBeforeRequest) {
                return;
              }
            }
            applyGeneratedResearchNoteDraft(body);
            setResearchNoteGenerationStatus(
              streamedResult
                ? "正在写入本地安全草稿，完成前不可保存。"
                : "AI 正在写入研究笔记，完成前不可保存。"
            );
            await waitForNextPaint();
          },
          onReset: async () => {
            const latestWorkspace = workspaceRef.current;
            if (
              !isResearchNoteDraftStreamCurrent(
                streamIdentity,
                {
                  requestId: researchNoteDraftGenerationRequestIdRef.current,
                  draftVersion: researchNoteDraftVersionRef.current,
                  market: latestWorkspace.selectedInstrument.market,
                  symbol: latestWorkspace.selectedInstrument.symbol,
                  timeframe: latestWorkspace.selectedTimeframe
                },
                controller.signal.aborted
              )
            ) {
              controller.abort();
              return;
            }
            applyGeneratedResearchNoteDraft(draftBeforeRequest);
            setResearchNoteGenerationStatus("外部草稿未通过完整校验，正在切换安全本地草稿。");
            await waitForNextPaint();
          }
        }
      );
      if (researchNoteDraftGenerationRequestIdRef.current !== requestId) {
        return;
      }
      if (researchNoteDraftGenerationAbortControllerRef.current === controller) {
        researchNoteDraftGenerationAbortControllerRef.current = null;
      }
      setIsGeneratingResearchNoteDraft(false);
      const latestWorkspace = workspaceRef.current;
      if (
        !isResearchNoteDraftStreamCurrent(
          streamIdentity,
          {
            requestId: researchNoteDraftGenerationRequestIdRef.current,
            draftVersion: researchNoteDraftVersionRef.current,
            market: latestWorkspace.selectedInstrument.market,
            symbol: latestWorkspace.selectedInstrument.symbol,
            timeframe: latestWorkspace.selectedTimeframe
          },
          controller.signal.aborted
        )
      ) {
        setResearchNoteGenerationStatus("研究上下文或草稿已变化，本次生成结果未覆盖当前内容。");
        return;
      }
      if (result.source !== "core" || !result.draft || !result.generation) {
        applyGeneratedResearchNoteDraft(draftBeforeRequest);
        setResearchNoteGenerationError(
          result.error
            ? `草稿生成失败：${result.error}。原内容已保留。`
            : "草稿生成失败，原内容已保留。"
        );
        return;
      }
      if (result.generation.status === "failed" || result.generation.fallbackUsed) {
        if (draftWasEmptyBeforeRequest) {
          applyGeneratedResearchNoteDraft(result.draft.body);
          setResearchNoteGenerationStatus(
            result.generation.warning
              ?? "外部模型生成失败，已使用本地结构化草稿，尚未保存。"
          );
          return;
        }
        applyGeneratedResearchNoteDraft(draftBeforeRequest);
        setResearchNoteGenerationError(
          "外部模型生成失败，本次未替换当前草稿。请重新授权后重试，或切换到本地基线生成。"
        );
        return;
      }
      applyGeneratedResearchNoteDraft(result.draft.body);
      setResearchNoteGenerationStatus(
        result.generation.warning
          ?? (result.generation.status === "completed"
            ? "AI 草稿已生成，尚未保存。"
            : "本地结构化草稿已生成，尚未保存。")
      );
    }, [
      applyGeneratedResearchNoteDraft,
      isGeneratingResearchNoteDraft,
      researchNoteExternalDataApproved,
      researchNoteProviderId,
      researchNoteProviders,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]);
  const selectResearchNoteProvider = useCallback((providerId: AiReviewProviderId) => {
      const provider = researchNoteProviders.find((item) => item.providerId === providerId);
      if (!provider?.configured || isGeneratingResearchNoteDraft) {
        return;
      }
      researchNoteDraftGenerationRequestIdRef.current += 1;
      setResearchNoteProviderId(providerId);
      setResearchNoteExternalDataApproved(false);
      setResearchNoteGenerationError(null);
      setResearchNoteGenerationStatus(null);
    }, [isGeneratingResearchNoteDraft, researchNoteProviders]);
  const saveCurrentHandoffNote = useCallback(async () => {
      const runId = workspace.researchRun?.runId;
      if (!runId) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Handoff note needs a research run",
          error: "Run Pipeline before saving handoff notes."
        }));
        return;
      }
      setIsSavingHandoffNote(true);
      const result = await saveHandoffNote(quantCoreBaseUrl, {
        subjectType: "research_run",
        subjectId: runId,
        body: handoffNoteDraft,
        author: "local-operator",
        sourceWorkspace: activeWorkAreaId
      });
      if (result.source === "core") {
        const refreshed = await loadHandoffNotes(quantCoreBaseUrl, "research_run", runId);
        setHandoffNotesState(refreshed);
        setHandoffNoteDraft("");
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Handoff note saved",
          error: undefined
        }));
      } else {
        setHandoffNotesState(result);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Handoff note save failed",
          error: result.error ?? "Handoff note save failed"
        }));
      }
      setIsSavingHandoffNote(false);
    }, [activeWorkAreaId, handoffNoteDraft, workspace.researchRun?.runId]);
  const saveCurrentResearchWorkspace = useCallback(async () => {
      setIsSavingResearchWorkspace(true);
      const result = await saveResearchWorkspaceState(
        quantCoreBaseUrl,
        currentResearchWorkspaceStateDraft
      );
      setWorkspaceState((current) => ({
        workspace:
          result.source === "core" && result.state
            ? workspaceWithSavedResearchWorkspaceState(current.workspace, result.state)
            : current.workspace,
        source: result.source,
        statusLabel: result.source === "core" ? "Research workspace saved" : "Research workspace save failed",
        error: result.error
      }));
      setIsSavingResearchWorkspace(false);
    }, [currentResearchWorkspaceStateDraft]);
  const copyLatestResearchContextReportLink = useCallback(() => {
      const search = latestResearchContextReadinessReport?.linkSearch ?? "";
      if (!search) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research context report link copy failed",
          error: "No recorded research context report link is available."
        }));
        return;
      }
      void copyAuditReportLedgerEvidenceLink(search);
    }, [latestResearchContextReadinessReport?.linkSearch, copyAuditReportLedgerEvidenceLink]);
  const copyLatestOtherResearchContextReportAuditLink = useCallback(async () => {
      const query = latestOtherResearchContextReadinessReport?.query ?? "";
      if (!query.trim() || !navigator.clipboard?.writeText) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Other research context report link copy failed",
          error: "Clipboard is unavailable or no other research context report query is available."
        }));
        return;
      }
      await copyAuditReportLedgerQueryLink(query);
    }, [latestOtherResearchContextReadinessReport?.query, copyAuditReportLedgerQueryLink]);
  return {
    runHistory, setRunHistoryState, researchNoteState, setResearchNoteState, handoffNotesState, setHandoffNotesState,
    researchNoteDraft, setResearchNoteDraft, researchNoteProviders, setResearchNoteProviders, researchNoteProviderId, setResearchNoteProviderId,
    researchNoteExternalDataApproved, setResearchNoteExternalDataApproved, researchNoteGenerationError, setResearchNoteGenerationError, researchNoteGenerationStatus, setResearchNoteGenerationStatus,
    handoffNoteDraft, setHandoffNoteDraft, isSavingResearchNote, setIsSavingResearchNote, isGeneratingResearchNoteDraft, setIsGeneratingResearchNoteDraft,
    isSavingHandoffNote, setIsSavingHandoffNote, isSavingResearchWorkspace, setIsSavingResearchWorkspace, isResearchPipelineConfirmationOpen, setIsResearchPipelineConfirmationOpen,
    researchCompletionNotice, setResearchCompletionNotice, researchPipelineConfirmationDialogRef, researchPipelineConfirmationCancelButtonRef, copiedStage1P0DailyUseHandoff, setCopiedStage1P0DailyUseHandoff,
    copiedResearchContextLink, setCopiedResearchContextLink, copiedResearchContextReadinessReport, setCopiedResearchContextReadinessReport, researchRunExportBrowserQuery, setResearchRunExportBrowserQuery,
    researchNoteDraftRef, researchNoteDraftVersionRef, researchNoteDraftGenerationRequestIdRef, researchNoteDraftGenerationAbortControllerRef, applyGeneratedResearchNoteDraft, updateResearchNoteDraft,
    editResearchNoteDraft, savedResearchWorkspaceSelectionAppliedRef, researchContextLinkCopyResetTimerRef, researchContextReadinessReportCopyResetTimerRef, canSaveResearchWorkspace, currentResearchWorkspaceStateDraft,
    isResearchWorkspaceSaved, researchRunContextBinding, currentResearchRunId, currentResearchRunIdRef, researchRunExportBrowserRows, researchRunExportIndexRows,
    researchContextReportCoverage, latestResearchContextReadinessReport, latestOtherResearchContextReadinessReport, researchContextEvidenceRows, refreshRunHistory, refreshResearchNote,
    refreshHandoffNotes, saveCurrentResearchNote, generateCurrentResearchNoteDraft, selectResearchNoteProvider, saveCurrentHandoffNote, saveCurrentResearchWorkspace,
    copyLatestResearchContextReportLink, copyLatestOtherResearchContextReportAuditLink,
    dismissResearchCompletionNotice, closeResearchPipelinePreflight, approveResearchNoteExternalData
  };
}
