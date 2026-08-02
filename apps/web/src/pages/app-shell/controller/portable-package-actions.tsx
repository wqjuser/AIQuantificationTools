import { createAiReviewRequestCoordinator } from "../../../lib/ai-review-stage3";
import { buildP0PlatformReadinessReportAuditEvent, importResearchRunExport, loadAiReviewArchiveImportSnapshot, loadHandoffNotes, loadLatestResearchRunPaperExecution, loadResearchRunPromotion, marketKlinesFromResearchRunAudit, normalizeResearchRunExportPackagePayload, ResearchRunExportPackage, saveAuditEvent, withVerifiedResearchRunExportPackageReportSignatures } from "../../../lib/terminal-api";
import { BacktestAssumptionField, buildAuditReplayWorkflowState, buildBacktestRunComparisonMatrixRows, buildBacktestRunComparisonMatrixSummary, buildP0CompletionChecklist, buildP0GoldenPathJourney, buildP0PlatformReadinessReportMarkdown, buildPaperPositionRows, buildPromotionReadiness, buildResearchRunComparisonRows, buildResearchRunImportAuditEvent, buildResearchRunImportDiffRows, ResearchRunAudit, verifyStage5SandboxReadinessDecisionHashes, workspaceFromResearchRunAudit, workspaceWithBacktestAssumption } from "../../../lib/terminal-workbench";
import { mergeAuditEvidenceReportEvent } from "../../audit/event-merges";
import { paperTradingRowsFromExecutionRecord } from "../../execution/ExecutionFormatters";
import { AUDIT_REPORT_EVENTS_PAGE_SIZE, quantCoreBaseUrl } from "../initial-state";
import { type ChangeEvent, useCallback, useMemo } from "react";
import type { AppControllerBindings } from "./bindings";

type Dependencies = Pick<AppControllerBindings, "activeAiReviewRunRecords" | "activeLoopStepId" | "activePaperExecutionRecord" | "activeWorkAreaId" | "activeWorkflowStageId" | "aiReviewRunRecords" | "aiReviewStage3RequestCoordinatorRef" | "appendResearchRunImportAuditEvent" | "auditEvidenceReportEvents" | "brokerAdapterRows" | "copiedP0ReadinessReport" | "currentResearchRunId" | "currentResearchRunIdRef" | "error" | "executionAdapterCertificationApplyRows" | "executionAdapterCertificationRows" | "executionAdapterControlledRestartEvidenceRows" | "executionAdapterEnvironmentBindingRows" | "executionAdapterHumanConfirmationRows" | "executionAdapterOpsStateRows" | "executionAdapterPaperExecutionRows" | "executionAdapterPaperOrderLifecycleRows" | "executionAdapterPaperRouteRunbookRows" | "executionAdapterProductionRouteReviewRows" | "executionAdapterRestartAcceptanceRows" | "executionAdapterRuntimeReloadAcceptanceRows" | "executionAdapterRuntimeReloadExecutionRows" | "executionAdapterRuntimeReloadPlanRows" | "executionAdapterSandboxOrderSchemaDryRunRows" | "executionAdapterSandboxProbeExecutionRows" | "executionAdapterSandboxProbeReviewRows" | "executionAdapterSecretMaterializationRows" | "executionAdapterSecretReferenceRows" | "exportPackageRequestCoordinatorRef" | "goldenPath" | "handoffNotesState" | "i18n" | "indexedExportPackages" | "inspectedExportArchiveSnapshot" | "inspectedExportPackage" | "isApplyingImportPackage" | "isInspectingExportPackage" | "isRunning" | "klinesState" | "manualSelectionVersionRef" | "p0ActionOutcomeEvidenceLink" | "p0PaperExecutionPreflight" | "p0PaperSimulationRecord" | "p0PlatformActionOutcome" | "p0PlatformBacklogItems" | "p0PlatformReadinessSummary" | "paperExecutionRecord" | "paperTradingRows" | "pendingImportPackage" | "productWorkAreas" | "promotionCandidateRecord" | "refreshAiReviewRunHistory" | "refreshRunHistory" | "researchNoteDraft" | "researchNoteDraftRef" | "researchNoteState" | "resetAiReviewHistoryState" | "runHistory" | "savingP0ReadinessReport" | "setActiveLoopStepId" | "setActiveWorkAreaId" | "setActiveWorkflowStageId" | "setAiReviewRunRecords" | "setAuditEvidenceReportEvents" | "setCopiedP0ReadinessReport" | "setHandoffNotesState" | "setIndexedExportPackages" | "setInspectedExportArchiveSnapshot" | "setInspectedExportPackage" | "setIsApplyingImportPackage" | "setIsInspectingExportPackage" | "setIsRunning" | "setKlinesState" | "setP0PaperSimulationRecord" | "setPaperExecutionRecord" | "setPendingImportPackage" | "setPromotionCandidateRecord" | "setResearchNoteDraft" | "setResearchNoteState" | "setRunHistoryState" | "setSavingP0ReadinessReport" | "setStrategyExperimentActive" | "setStrategyLibraryState" | "setWorkflowRunState" | "setWorkspaceState" | "source" | "statusLabel" | "strategyExperimentActive" | "strategyExperimentActiveRef" | "strategyExperimentI18nRef" | "strategyExperimentSourceKeyRef" | "strategyExperimentUsableSourceKey" | "strategyExperimentWorkspaceRef" | "strategyLibraryState" | "updateResearchNoteDraft" | "visibleStrategyLibrary" | "workflowRunIdRef" | "workflowRunState" | "workspace">;
type Result = Pick<AppControllerBindings, "activeP0PaperSimulationRecord" | "activePromotionCandidateRecord" | "paperPositionRows" | "persistedPaperTradingRows" | "visiblePaperTradingRows" | "backtestRunComparisonMatrixRows" | "backtestRunComparisonMatrixSummary" | "promotionReadiness" | "runComparisonRows" | "p0PortablePackageReady" | "p0CompletionChecklist" | "p0GoldenPathJourney" | "p0PlatformReadinessReportMarkdown" | "importRunExportFile" | "confirmPendingImportPackage" | "cancelPendingImportPackage" | "updateBacktestAssumption" | "copyP0ReadinessReport" | "downloadP0ReadinessReport" | "saveP0ReadinessReport">;

export function usePortablePackageActions(controller: Dependencies): Result {
  const {
    activeAiReviewRunRecords, activeLoopStepId, activePaperExecutionRecord, activeWorkAreaId, activeWorkflowStageId, aiReviewRunRecords,
    aiReviewStage3RequestCoordinatorRef, appendResearchRunImportAuditEvent, auditEvidenceReportEvents, brokerAdapterRows, copiedP0ReadinessReport, currentResearchRunId,
    currentResearchRunIdRef, error, executionAdapterCertificationApplyRows, executionAdapterCertificationRows, executionAdapterControlledRestartEvidenceRows, executionAdapterEnvironmentBindingRows,
    executionAdapterHumanConfirmationRows, executionAdapterOpsStateRows, executionAdapterPaperExecutionRows, executionAdapterPaperOrderLifecycleRows, executionAdapterPaperRouteRunbookRows, executionAdapterProductionRouteReviewRows,
    executionAdapterRestartAcceptanceRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadPlanRows, executionAdapterSandboxOrderSchemaDryRunRows, executionAdapterSandboxProbeExecutionRows,
    executionAdapterSandboxProbeReviewRows, executionAdapterSecretMaterializationRows, executionAdapterSecretReferenceRows, exportPackageRequestCoordinatorRef, goldenPath, handoffNotesState,
    i18n, indexedExportPackages, inspectedExportArchiveSnapshot, inspectedExportPackage, isApplyingImportPackage, isInspectingExportPackage,
    isRunning, klinesState, manualSelectionVersionRef, p0ActionOutcomeEvidenceLink, p0PaperExecutionPreflight, p0PaperSimulationRecord,
    p0PlatformActionOutcome, p0PlatformBacklogItems, p0PlatformReadinessSummary, paperExecutionRecord, paperTradingRows, pendingImportPackage,
    productWorkAreas, promotionCandidateRecord, refreshAiReviewRunHistory, refreshRunHistory, researchNoteDraft, researchNoteDraftRef,
    researchNoteState, resetAiReviewHistoryState, runHistory, savingP0ReadinessReport, setActiveLoopStepId, setActiveWorkAreaId,
    setActiveWorkflowStageId, setAiReviewRunRecords, setAuditEvidenceReportEvents, setCopiedP0ReadinessReport, setHandoffNotesState, setIndexedExportPackages,
    setInspectedExportArchiveSnapshot, setInspectedExportPackage, setIsApplyingImportPackage, setIsInspectingExportPackage, setIsRunning, setKlinesState,
    setP0PaperSimulationRecord, setPaperExecutionRecord, setPendingImportPackage, setPromotionCandidateRecord, setResearchNoteDraft, setResearchNoteState,
    setRunHistoryState, setSavingP0ReadinessReport, setStrategyExperimentActive, setStrategyLibraryState, setWorkflowRunState, setWorkspaceState,
    source, statusLabel, strategyExperimentActive, strategyExperimentActiveRef, strategyExperimentI18nRef, strategyExperimentSourceKeyRef,
    strategyExperimentUsableSourceKey, strategyExperimentWorkspaceRef, strategyLibraryState, updateResearchNoteDraft, visibleStrategyLibrary, workflowRunIdRef,
    workflowRunState, workspace
  } = controller;
  researchNoteDraftRef.current = researchNoteDraft;
  if (aiReviewStage3RequestCoordinatorRef.current === null) {
      aiReviewStage3RequestCoordinatorRef.current = createAiReviewRequestCoordinator();
    }
  strategyExperimentI18nRef.current = i18n;
  currentResearchRunIdRef.current = currentResearchRunId;
  strategyExperimentSourceKeyRef.current = strategyExperimentUsableSourceKey;
  strategyExperimentWorkspaceRef.current = workspace;
  strategyExperimentActiveRef.current = strategyExperimentActive;
  const activeP0PaperSimulationRecord =
      p0PaperSimulationRecord?.runId && p0PaperSimulationRecord.runId === currentResearchRunId
        ? p0PaperSimulationRecord
        : null;
  const activePromotionCandidateRecord =
      promotionCandidateRecord?.runId && promotionCandidateRecord.runId === currentResearchRunId ? promotionCandidateRecord : null;
  const paperPositionRows = buildPaperPositionRows(workspace, activePaperExecutionRecord);
  const persistedPaperTradingRows = activePaperExecutionRecord
      ? paperTradingRowsFromExecutionRecord(activePaperExecutionRecord)
      : null;
  const visiblePaperTradingRows = persistedPaperTradingRows ?? paperTradingRows;
  const backtestRunComparisonMatrixRows = buildBacktestRunComparisonMatrixRows(runHistory, currentResearchRunId);
  const backtestRunComparisonMatrixSummary = buildBacktestRunComparisonMatrixSummary(backtestRunComparisonMatrixRows);
  const promotionReadiness =
      activePromotionCandidateRecord ??
      buildPromotionReadiness(workspace, activePaperExecutionRecord, brokerAdapterRows, executionAdapterCertificationRows, executionAdapterCertificationApplyRows, executionAdapterControlledRestartEvidenceRows, executionAdapterRestartAcceptanceRows, executionAdapterSecretReferenceRows, executionAdapterSecretMaterializationRows, executionAdapterEnvironmentBindingRows, executionAdapterRuntimeReloadPlanRows, executionAdapterRuntimeReloadExecutionRows, executionAdapterRuntimeReloadAcceptanceRows, executionAdapterHumanConfirmationRows, executionAdapterSandboxProbeExecutionRows, executionAdapterPaperExecutionRows, executionAdapterSandboxProbeReviewRows, executionAdapterProductionRouteReviewRows, executionAdapterSandboxOrderSchemaDryRunRows, executionAdapterPaperOrderLifecycleRows, executionAdapterPaperRouteRunbookRows, executionAdapterOpsStateRows);
  const runComparisonRows = buildResearchRunComparisonRows(runHistory);
  const p0PortablePackageReady = useMemo(() => {
      const matchesCurrentRun = (exportPackage: ResearchRunExportPackage | null | undefined) =>
        Boolean(
          exportPackage &&
            exportPackage.manifest.runId === currentResearchRunId &&
            exportPackage.p0PackageCompleteness?.ready &&
            exportPackage.p0PackageCompleteness.liveBlockedBoundary &&
            !exportPackage.p0PackageCompleteness.liveTradingAllowed
        );
      return matchesCurrentRun(inspectedExportPackage) || indexedExportPackages.some(matchesCurrentRun);
    }, [currentResearchRunId, indexedExportPackages, inspectedExportPackage]);
  const p0CompletionChecklist = useMemo(
      () =>
        buildP0CompletionChecklist({
          automatedTestsVerified: false,
          exportImportReady: p0PortablePackageReady,
          goldenPath,
          outcome: p0PlatformActionOutcome,
          paperPreflight: p0PaperExecutionPreflight,
          productWorkAreaCount: productWorkAreas.length,
          replayReady: Boolean(
            currentResearchRunId &&
              (activeAiReviewRunRecords.length > 0 ||
                Boolean(activePaperExecutionRecord?.executionId) ||
                p0PortablePackageReady)
          ),
          strategyVersionReady:
            Boolean(workspace.researchRun?.strategyConfig) ||
            visibleStrategyLibrary.some(
              (item) => item.status === "audited" && Boolean(item.auditRunId) && item.auditRunId === workspace.researchRun?.runId
            ),
          summary: p0PlatformReadinessSummary
        }),
      [
        activeAiReviewRunRecords.length,
        activePaperExecutionRecord?.executionId,
        currentResearchRunId,
        goldenPath,
        p0PortablePackageReady,
        p0PaperExecutionPreflight,
        p0PlatformActionOutcome,
        p0PlatformReadinessSummary,
        productWorkAreas.length,
        visibleStrategyLibrary,
        workspace.researchRun?.runId,
        workspace.researchRun?.strategyConfig
      ]
    );
  const p0GoldenPathJourney = useMemo(
      () =>
        buildP0GoldenPathJourney({
          completionChecklist: p0CompletionChecklist,
          goldenPath,
          outcome: p0PlatformActionOutcome,
          paperPreflight: p0PaperExecutionPreflight,
          summary: p0PlatformReadinessSummary
        }),
      [
        goldenPath,
        p0CompletionChecklist,
        p0PaperExecutionPreflight,
        p0PlatformActionOutcome,
        p0PlatformReadinessSummary
      ]
    );
  const p0PlatformReadinessReportMarkdown = useMemo(
      () =>
        buildP0PlatformReadinessReportMarkdown({
          backlogItems: p0PlatformBacklogItems,
          completionChecklist: p0CompletionChecklist,
          evidenceLink: p0ActionOutcomeEvidenceLink,
          outcome: p0PlatformActionOutcome,
          paperPreflight: p0PaperExecutionPreflight,
          summary: p0PlatformReadinessSummary
        }),
      [
        p0ActionOutcomeEvidenceLink,
        p0CompletionChecklist,
        p0PlatformActionOutcome,
        p0PlatformBacklogItems,
        p0PaperExecutionPreflight,
        p0PlatformReadinessSummary
      ]
    );
  const importRunExportFile = useCallback(
      async (event: ChangeEvent<HTMLInputElement>) => {
        const requestCoordinator = exportPackageRequestCoordinatorRef.current;
        const requestId = requestCoordinator.begin();
        setIsInspectingExportPackage(false);
        const input = event.currentTarget;
        const file = input.files?.[0];
        input.value = "";
        if (!file) {
          return;
        }
        const previousRunId = workspace.researchRun?.runId ?? null;

        try {
          const fileText = await file.text();
          if (!requestCoordinator.isCurrent(requestId)) {
            return;
          }
          const parsed = JSON.parse(fileText) as unknown;
          let exportPackage = normalizeResearchRunExportPackagePayload(parsed);
          if (!exportPackage) {
            if (!requestCoordinator.isCurrent(requestId)) {
              return;
            }
            appendResearchRunImportAuditEvent(
              buildResearchRunImportAuditEvent({
                error: "Invalid research run export contract",
                exportPackage: null,
                fileName: file.name,
                previousRunId,
                rows: [],
                stage: "failed"
              })
            );
            setPendingImportPackage(null);
            setInspectedExportPackage(null);
            setInspectedExportArchiveSnapshot(null);
            setWorkspaceState((current) => ({
              ...current,
              statusLabel: "Research run import failed",
              error: "Invalid research run export contract"
            }));
            return;
          }
          exportPackage = await withVerifiedResearchRunExportPackageReportSignatures(quantCoreBaseUrl, exportPackage);
          await verifyStage5SandboxReadinessDecisionHashes(exportPackage);
          if (!requestCoordinator.isCurrent(requestId)) {
            return;
          }
          const aiReviewArchiveSnapshot = await loadAiReviewArchiveImportSnapshot(
            quantCoreBaseUrl,
            exportPackage
          );
          if (!requestCoordinator.isCurrent(requestId)) {
            return;
          }

          const previewRows = buildResearchRunImportDiffRows({
            aiReviewArchiveReadbackErrors: aiReviewArchiveSnapshot.readbackErrors,
            aiReviewDecisions: aiReviewArchiveSnapshot.aiReviewDecisions,
            aiReviewRecords: activeAiReviewRunRecords,
            authoritativeAiReviewRecords: aiReviewArchiveSnapshot.authoritativeAiReviewRecords,
            exportPackage,
            legacyAiReviewIds: aiReviewArchiveSnapshot.legacyAiReviewIds,
            paperExecution: activePaperExecutionRecord,
            workspace
          });
          const previewBlocked = previewRows.some((row) => row.status === "blocked");
          if (!requestCoordinator.isCurrent(requestId)) {
            return;
          }
          appendResearchRunImportAuditEvent(
            buildResearchRunImportAuditEvent({
              exportPackage,
              fileName: file.name,
              previousRunId,
              rows: previewRows,
              stage: "preview"
            })
          );
          setPendingImportPackage({ aiReviewArchiveSnapshot, exportPackage, fileName: file.name });
          setInspectedExportPackage(exportPackage);
          setInspectedExportArchiveSnapshot(null);
          setActiveWorkAreaId("audit");
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: previewBlocked ? "Research run import preview blocked" : "Research run import preview ready",
            error: undefined
          }));
        } catch (importError) {
          if (!requestCoordinator.isCurrent(requestId)) {
            return;
          }
          appendResearchRunImportAuditEvent(
            buildResearchRunImportAuditEvent({
              error: importError instanceof Error ? importError.message : "Research run import failed",
              exportPackage: null,
              fileName: file.name,
              previousRunId,
              rows: [],
              stage: "failed"
            })
          );
          setPendingImportPackage(null);
          setInspectedExportPackage(null);
          setInspectedExportArchiveSnapshot(null);
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Research run import failed",
            error: importError instanceof Error ? importError.message : "Research run import failed"
          }));
        }
      },
      [activeAiReviewRunRecords, activePaperExecutionRecord, appendResearchRunImportAuditEvent, workspace]
    );
  const confirmPendingImportPackage = useCallback(async () => {
      if (!pendingImportPackage) {
        return;
      }

      const importRows = buildResearchRunImportDiffRows({
        aiReviewArchiveReadbackErrors: pendingImportPackage.aiReviewArchiveSnapshot.readbackErrors,
        aiReviewDecisions: pendingImportPackage.aiReviewArchiveSnapshot.aiReviewDecisions,
        aiReviewRecords: activeAiReviewRunRecords,
        authoritativeAiReviewRecords: pendingImportPackage.aiReviewArchiveSnapshot.authoritativeAiReviewRecords,
        exportPackage: pendingImportPackage.exportPackage,
        legacyAiReviewIds: pendingImportPackage.aiReviewArchiveSnapshot.legacyAiReviewIds,
        paperExecution: activePaperExecutionRecord,
        workspace
      });
      const previousRunId = workspace.researchRun?.runId ?? null;
      if (importRows.some((row) => row.status === "blocked")) {
        appendResearchRunImportAuditEvent(
          buildResearchRunImportAuditEvent({
            exportPackage: pendingImportPackage.exportPackage,
            fileName: pendingImportPackage.fileName,
            previousRunId,
            rows: importRows,
            stage: "preview"
          })
        );
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research run import preview blocked",
          error: "Research run import is blocked by unresolved package conflicts"
        }));
        return;
      }
      const importVersion = manualSelectionVersionRef.current + 1;
      manualSelectionVersionRef.current = importVersion;
      workflowRunIdRef.current += 1;
      setIsApplyingImportPackage(true);
      setIsRunning(false);
      setPaperExecutionRecord(null);
      setPromotionCandidateRecord(null);
      resetAiReviewHistoryState();

      try {
        const result = await importResearchRunExport(quantCoreBaseUrl, pendingImportPackage.exportPackage);
        if (manualSelectionVersionRef.current !== importVersion) {
          return;
        }
        if (result.source === "fallback" || !result.run) {
          appendResearchRunImportAuditEvent(
            buildResearchRunImportAuditEvent({
              error: result.error ?? "Research run import failed",
              exportPackage: pendingImportPackage.exportPackage,
              fileName: pendingImportPackage.fileName,
              previousRunId,
              rows: importRows,
              stage: "failed"
            })
          );
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Research run import failed",
            error: result.error ?? "Research run import failed"
          }));
          return;
        }
        const importedKlines = marketKlinesFromResearchRunAudit(result.run);
        appendResearchRunImportAuditEvent(
          buildResearchRunImportAuditEvent({
            exportPackage: pendingImportPackage.exportPackage,
            fileName: pendingImportPackage.fileName,
            previousRunId,
            rows: importRows,
            stage: "confirmed",
            undoToken: result.undoToken ?? result.undo?.undoToken ?? null
          })
        );
        setWorkspaceState((current) => ({
          workspace: workspaceFromResearchRunAudit(current.workspace, result.run as ResearchRunAudit),
          source: "core",
          statusLabel: "Research run import ready",
          error: undefined
        }));
        if (importedKlines) {
          setKlinesState(importedKlines);
        }
        if (result.note) {
          setResearchNoteState({
            note: result.note,
            source: "core"
          });
          updateResearchNoteDraft(result.note.body);
        } else if (result.run.researchNote?.body) {
          setResearchNoteState({
            note: result.run.researchNote,
            source: "core"
          });
          updateResearchNoteDraft(result.run.researchNote.body);
        }
        if (result.strategies?.length) {
          setStrategyLibraryState((current) => ({
            strategies: [
              ...result.strategies!,
              ...current.strategies.filter(
                (existing) => !result.strategies!.some((restored) => restored.revision === existing.revision)
              )
            ],
            source: "core",
            error: undefined
          }));
        }
        const [paperHistory, promotionHistory, aiReviewHistory, handoffHistory] = await Promise.all([
          loadLatestResearchRunPaperExecution(quantCoreBaseUrl, result.run.runId),
          loadResearchRunPromotion(quantCoreBaseUrl, result.run.runId),
          refreshAiReviewRunHistory(result.run.runId, { offset: 0, query: "" }),
          loadHandoffNotes(quantCoreBaseUrl, "research_run", result.run.runId)
        ]);
        if (manualSelectionVersionRef.current !== importVersion) {
          return;
        }
        setPendingImportPackage(null);
        setPaperExecutionRecord(paperHistory.execution ?? null);
        setPromotionCandidateRecord(promotionHistory.promotion ?? null);
        setAiReviewRunRecords(aiReviewHistory.aiReviews);
        setHandoffNotesState(handoffHistory);
        if (paperHistory.execution) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Paper execution history loaded",
            error: undefined
          }));
        } else if (aiReviewHistory.aiReviews.length) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "AI review records loaded",
            error: undefined
          }));
        }
        setActiveWorkAreaId("audit");
        setActiveLoopStepId("backtest");
        setActiveWorkflowStageId("execution");
        setWorkflowRunState(buildAuditReplayWorkflowState(result.run));
        await refreshRunHistory();
      } catch (importError) {
        if (manualSelectionVersionRef.current !== importVersion) {
          return;
        }
        appendResearchRunImportAuditEvent(
          buildResearchRunImportAuditEvent({
            error: importError instanceof Error ? importError.message : "Research run import failed",
            exportPackage: pendingImportPackage.exportPackage,
            fileName: pendingImportPackage.fileName,
            previousRunId,
            rows: importRows,
            stage: "failed"
          })
        );
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Research run import failed",
          error: importError instanceof Error ? importError.message : "Research run import failed"
        }));
      } finally {
        if (manualSelectionVersionRef.current === importVersion) {
          setIsApplyingImportPackage(false);
        }
      }
    }, [
      activeAiReviewRunRecords,
      activePaperExecutionRecord,
      appendResearchRunImportAuditEvent,
      pendingImportPackage,
      refreshAiReviewRunHistory,
      refreshRunHistory,
      resetAiReviewHistoryState,
      updateResearchNoteDraft,
      workspace
    ]);
  const cancelPendingImportPackage = useCallback(() => {
      if (pendingImportPackage) {
        appendResearchRunImportAuditEvent(
          buildResearchRunImportAuditEvent({
            exportPackage: pendingImportPackage.exportPackage,
            fileName: pendingImportPackage.fileName,
            previousRunId: workspace.researchRun?.runId ?? null,
            rows: buildResearchRunImportDiffRows({
              aiReviewArchiveReadbackErrors: pendingImportPackage.aiReviewArchiveSnapshot.readbackErrors,
              aiReviewDecisions: pendingImportPackage.aiReviewArchiveSnapshot.aiReviewDecisions,
              aiReviewRecords: activeAiReviewRunRecords,
              authoritativeAiReviewRecords: pendingImportPackage.aiReviewArchiveSnapshot.authoritativeAiReviewRecords,
              exportPackage: pendingImportPackage.exportPackage,
              legacyAiReviewIds: pendingImportPackage.aiReviewArchiveSnapshot.legacyAiReviewIds,
              paperExecution: activePaperExecutionRecord,
              workspace
            }),
            stage: "cancelled"
          })
        );
      }
      setPendingImportPackage(null);
      setInspectedExportPackage(null);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "Research run import preview cancelled",
        error: undefined
      }));
    }, [
      activeAiReviewRunRecords,
      activePaperExecutionRecord,
      appendResearchRunImportAuditEvent,
      pendingImportPackage,
      workspace
    ]);
  const updateBacktestAssumption = useCallback((field: BacktestAssumptionField, value: number) => {
      manualSelectionVersionRef.current += 1;
      setPaperExecutionRecord(null);
      setPromotionCandidateRecord(null);
      resetAiReviewHistoryState();
      setWorkspaceState((current) => ({
        workspace: workspaceWithBacktestAssumption(current.workspace, field, value),
        source: "core",
        statusLabel: "Backtest assumptions edited"
      }));
      setActiveWorkAreaId("backtest");
      setActiveLoopStepId("backtest");
      setActiveWorkflowStageId("backtest");
    }, []);
  const copyP0ReadinessReport = useCallback(async () => {
      if (!navigator.clipboard?.writeText) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P0 readiness report copy failed",
          error: "Clipboard is unavailable"
        }));
        return;
      }

      await navigator.clipboard.writeText(p0PlatformReadinessReportMarkdown);
      setCopiedP0ReadinessReport(true);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P0 readiness report copied",
        error: undefined
      }));
    }, [p0PlatformReadinessReportMarkdown]);
  const downloadP0ReadinessReport = useCallback(() => {
      const objectUrl = URL.createObjectURL(
        new Blob([p0PlatformReadinessReportMarkdown], { type: "text/markdown;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "p0-readiness-report.md";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setWorkspaceState((current) => ({
        ...current,
        statusLabel: "P0 readiness report download ready",
        error: undefined
      }));
    }, [p0PlatformReadinessReportMarkdown]);
  const saveP0ReadinessReport = useCallback(async () => {
      setSavingP0ReadinessReport(true);
      try {
        const auditEvent = await buildP0PlatformReadinessReportAuditEvent({
          backlogItems: p0PlatformBacklogItems,
          completionChecklist: p0CompletionChecklist,
          evidenceLink: p0ActionOutcomeEvidenceLink,
          markdown: p0PlatformReadinessReportMarkdown,
          outcome: p0PlatformActionOutcome,
          paperPreflight: p0PaperExecutionPreflight,
          summary: p0PlatformReadinessSummary
        });
        const result = await saveAuditEvent(quantCoreBaseUrl, auditEvent);
        if (result.source === "core" && result.event) {
          setAuditEvidenceReportEvents((current) =>
            mergeAuditEvidenceReportEvent(current, result.event!).slice(0, AUDIT_REPORT_EVENTS_PAGE_SIZE)
          );
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "P0 readiness report saved to audit ledger",
            error: undefined
          }));
          return;
        }

        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "P0 readiness report ledger save failed",
          error: result.error ?? "P0 readiness report ledger save failed"
        }));
      } finally {
        setSavingP0ReadinessReport(false);
      }
    }, [
      p0ActionOutcomeEvidenceLink,
      p0CompletionChecklist,
      p0PlatformActionOutcome,
      p0PlatformBacklogItems,
      p0PaperExecutionPreflight,
      p0PlatformReadinessReportMarkdown,
      p0PlatformReadinessSummary,
      quantCoreBaseUrl
    ]);
  return {
    activeP0PaperSimulationRecord, activePromotionCandidateRecord, paperPositionRows, persistedPaperTradingRows, visiblePaperTradingRows, backtestRunComparisonMatrixRows,
    backtestRunComparisonMatrixSummary, promotionReadiness, runComparisonRows, p0PortablePackageReady, p0CompletionChecklist, p0GoldenPathJourney,
    p0PlatformReadinessReportMarkdown, importRunExportFile, confirmPendingImportPackage, cancelPendingImportPackage, updateBacktestAssumption, copyP0ReadinessReport,
    downloadP0ReadinessReport, saveP0ReadinessReport
  };
}
