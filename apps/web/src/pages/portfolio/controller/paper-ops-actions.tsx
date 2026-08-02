import { PortfolioPaperOpsQueueRow } from "../../../lib/terminal-workbench";
import { replaceAuditEvidenceReportQueryUrlParam } from "../../app-shell/url-state";
import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activeLoopStepId" | "activeWorkAreaId" | "activeWorkflowStageId" | "auditEvidenceReportOffset" | "auditEvidenceReportQuery" | "error" | "portfolioPaperOrderApprovalRows" | "portfolioPaperOrderAuditOffset" | "portfolioPaperOrderAuditQuery" | "selectProductWorkArea" | "setActiveLoopStepId" | "setActiveWorkAreaId" | "setActiveWorkflowStageId" | "setAuditEvidenceReportOffset" | "setAuditEvidenceReportQuery" | "setPortfolioPaperOrderAuditOffset" | "setPortfolioPaperOrderAuditQuery" | "setWorkspaceState" | "simulatePortfolioPaperOrder" | "source" | "statusLabel" | "updatePortfolioPaperOrderAuditQuery" | "workspace">;
type Result = Pick<AppControllerBindings, "runPortfolioPaperOpsQueueAction" | "focusPortfolioOrderStateAuditQuery">;

export function usePaperOpsActions(controller: Dependencies): Result {
  const {
    activeLoopStepId, activeWorkAreaId, activeWorkflowStageId, auditEvidenceReportOffset, auditEvidenceReportQuery, error,
    portfolioPaperOrderApprovalRows, portfolioPaperOrderAuditOffset, portfolioPaperOrderAuditQuery, selectProductWorkArea, setActiveLoopStepId, setActiveWorkAreaId,
    setActiveWorkflowStageId, setAuditEvidenceReportOffset, setAuditEvidenceReportQuery, setPortfolioPaperOrderAuditOffset, setPortfolioPaperOrderAuditQuery, setWorkspaceState,
    simulatePortfolioPaperOrder, source, statusLabel, updatePortfolioPaperOrderAuditQuery, workspace
  } = controller;
  const runPortfolioPaperOpsQueueAction = useCallback(
      (row: PortfolioPaperOpsQueueRow) => {
        if (!row.canRunAction) {
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: "Portfolio paper ops action blocked",
            error: row.detail
          }));
          return;
        }

        if (row.nextActionId === "simulate-order" && row.orderId) {
          const approval = portfolioPaperOrderApprovalRows.find(
            (candidate) => candidate.batchId === row.batchId && candidate.orderId === row.orderId
          );
          if (!approval) {
            setWorkspaceState((current) => ({
              ...current,
              statusLabel: "Portfolio paper simulation unavailable",
              error: "Approval evidence is missing for this paper order."
            }));
            return;
          }
          void simulatePortfolioPaperOrder(approval);
          selectProductWorkArea("execution");
          setWorkspaceState((current) => ({
            ...current,
            statusLabel: `Portfolio paper simulation queued · ${row.orderId}`,
            error: undefined
          }));
          return;
        }

        if (row.focusQuery) {
          updatePortfolioPaperOrderAuditQuery(row.focusQuery);
        }
        selectProductWorkArea(row.nextActionId === "open-portfolio" ? "portfolio" : "audit");
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: `Portfolio paper ops opened · ${row.statusLabel}`,
          error: undefined
        }));
      },
      [portfolioPaperOrderApprovalRows, selectProductWorkArea, simulatePortfolioPaperOrder, updatePortfolioPaperOrderAuditQuery]
    );
  const focusPortfolioOrderStateAuditQuery = useCallback(
      (query: string) => {
        const normalizedQuery = query.trim();
        if (!normalizedQuery) {
          selectProductWorkArea("audit");
          return;
        }
        setAuditEvidenceReportQuery(normalizedQuery);
        setAuditEvidenceReportOffset(0);
        setPortfolioPaperOrderAuditQuery(normalizedQuery);
        setPortfolioPaperOrderAuditOffset(0);
        replaceAuditEvidenceReportQueryUrlParam(normalizedQuery);
        setActiveWorkAreaId("audit");
        setActiveLoopStepId("backtest");
        setActiveWorkflowStageId("execution");
        setWorkspaceState((current) => ({
          ...current,
          statusLabel: "Portfolio order state evidence selected",
          error: undefined
        }));
      },
      [selectProductWorkArea]
    );
  return {
    runPortfolioPaperOpsQueueAction, focusPortfolioOrderStateAuditQuery
  };
}
