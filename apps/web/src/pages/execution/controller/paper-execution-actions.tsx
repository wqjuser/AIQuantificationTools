import { runP0PaperSimulation } from "../../../lib/terminal-api";
import { buildP0PaperExecutionPreflight, buildPaperExecutionSummaryTiles, ExecutionAdapterPaperExecutionRow } from "../../../lib/terminal-workbench";
import { quantCoreBaseUrl } from "../../app-shell/initial-state";
import { formatPlainNumber } from "../../shared/number-formatters";
import { buildExecutionAdapterPaperExecutionAuditQuery } from "../audit-query";
import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activeLoopStepId" | "activeWorkAreaId" | "activeWorkflowStageId" | "copyAuditReportLedgerQueryLink" | "currentResearchRunId" | "error" | "executionAdapterPreLiveRunbookAuditCoverage" | "goldenPath" | "isSubmittingPaperExecution" | "p0PaperSimulationRecord" | "paperExecutionRecord" | "promotionCandidateRecord" | "researchRunContextBinding" | "riskApprovalSummary" | "setActiveLoopStepId" | "setActiveWorkAreaId" | "setActiveWorkflowStageId" | "setIsSubmittingPaperExecution" | "setP0PaperSimulationRecord" | "setPaperExecutionRecord" | "setPromotionCandidateRecord" | "setWorkspaceState" | "source" | "statusLabel" | "workspace">;
type Result = Pick<AppControllerBindings, "activePaperExecutionRecord" | "paperExecutionSummaryTiles" | "p0PaperExecutionPreflight" | "submitPaperExecution" | "copyExecutionAdapterPreLiveRunbookAuditLink" | "copyExecutionAdapterPaperExecutionAuditLink">;

export function usePaperExecutionActions(controller: Dependencies): Result {
  const {
    activeLoopStepId, activeWorkAreaId, activeWorkflowStageId, copyAuditReportLedgerQueryLink, currentResearchRunId, error,
    executionAdapterPreLiveRunbookAuditCoverage, goldenPath, isSubmittingPaperExecution, p0PaperSimulationRecord, paperExecutionRecord, promotionCandidateRecord,
    researchRunContextBinding, riskApprovalSummary, setActiveLoopStepId, setActiveWorkAreaId, setActiveWorkflowStageId, setIsSubmittingPaperExecution,
    setP0PaperSimulationRecord, setPaperExecutionRecord, setPromotionCandidateRecord, setWorkspaceState, source, statusLabel,
    workspace
  } = controller;
  const activePaperExecutionRecord =
      paperExecutionRecord?.runId && paperExecutionRecord.runId === currentResearchRunId ? paperExecutionRecord : null;
  const paperExecutionSummaryTiles = buildPaperExecutionSummaryTiles(workspace, activePaperExecutionRecord);
  const p0PaperExecutionPreflight = buildP0PaperExecutionPreflight({
      goldenPath,
      paperExecution: activePaperExecutionRecord,
      researchBinding: researchRunContextBinding,
      riskApproval: riskApprovalSummary
    });
  const submitPaperExecution = useCallback(async (runIdOverride?: string) => {
      const runId = runIdOverride ?? currentResearchRunId;
      if (!runId) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Paper execution failed",
          error: researchRunContextBinding.status === "mismatched" ? researchRunContextBinding.detail : "Run the pipeline before submitting a paper execution."
        }));
        return;
      }

      setIsSubmittingPaperExecution(true);
      try {
        const result = await runP0PaperSimulation(quantCoreBaseUrl, {
          runId,
          market: workspace.researchRun?.market ?? workspace.selectedInstrument.market,
          symbol: workspace.researchRun?.symbol ?? workspace.selectedInstrument.symbol,
          timeframe: workspace.researchRun?.timeframe ?? workspace.selectedTimeframe
        });
        if (result.source === "fallback" || !result.execution || !result.simulation) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Paper execution failed",
            error: result.error ?? "Paper execution failed"
          }));
          return;
        }

        setPaperExecutionRecord(result.execution);
        setP0PaperSimulationRecord(result.simulation);
        setPromotionCandidateRecord(result.promotion ?? null);
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `P0 paper simulation recorded · ${result.simulatedFill?.orderId ?? result.execution?.executionId} · ${formatPlainNumber(result.simulatedFill?.quantity ?? 0)} @ ${formatPlainNumber(result.simulatedFill?.fillPrice ?? 0)}`,
          error: undefined
        }));
        setActiveWorkAreaId("execution");
        setActiveLoopStepId("paper");
        setActiveWorkflowStageId("execution");
      } finally {
        setIsSubmittingPaperExecution(false);
      }
    }, [
      currentResearchRunId,
      researchRunContextBinding.detail,
      researchRunContextBinding.status,
      workspace.researchRun?.market,
      workspace.researchRun?.symbol,
      workspace.researchRun?.timeframe,
      workspace.selectedInstrument.market,
      workspace.selectedInstrument.symbol,
      workspace.selectedTimeframe
    ]);
  const copyExecutionAdapterPreLiveRunbookAuditLink = useCallback(async () => {
      const query = executionAdapterPreLiveRunbookAuditCoverage.query;
      if (!query) {
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Pre-live runbook audit link copy failed",
          error: "No matching pre-live runbook report has been recorded yet."
        }));
        return;
      }
      await copyAuditReportLedgerQueryLink(query);
    }, [copyAuditReportLedgerQueryLink, executionAdapterPreLiveRunbookAuditCoverage.query]);
  const copyExecutionAdapterPaperExecutionAuditLink = useCallback(
      async (row: ExecutionAdapterPaperExecutionRow) => {
        await copyAuditReportLedgerQueryLink(buildExecutionAdapterPaperExecutionAuditQuery(row));
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Adapter paper execution audit link copy requested",
          error: undefined
        }));
      },
      [copyAuditReportLedgerQueryLink]
    );
  return {
    activePaperExecutionRecord, paperExecutionSummaryTiles, p0PaperExecutionPreflight, submitPaperExecution, copyExecutionAdapterPreLiveRunbookAuditLink, copyExecutionAdapterPaperExecutionAuditLink
  };
}
