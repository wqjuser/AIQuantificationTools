import { buildStage5ShadowState, runStage5SandboxAuthorizationPreflight, runStage5SandboxAuthorizationReview, runStage5SandboxReadinessDecision, runStage5ShadowSession } from "../../../lib/stage5-shadow";
import { authorizeStage6SandboxBatch, buildStage6GoldenPath, cancelStage6SandboxOrder, loadStage6SandboxBatch, reconcileStage6SandboxBatch, setStage6KillSwitch, submitStage6SandboxBatch } from "../../../lib/stage6-sandbox";
import { createStage9ProductionAdmissionCandidate, createStage9ProductionAdmissionReview, selectCurrentStage9ProductionAdmissionCandidate } from "../../../lib/stage9-production-admission";
import { buildPaperExecutionReplayGate } from "../../../lib/terminal-workbench";
import { quantCoreBaseUrl } from "../../app-shell/initial-state";
import { loadAutoTradingSnapshot } from "../../dynamic-trading/ExecutionAutoPaperTradingSection";
import { useCallback } from "react";
import type { AppControllerBindings } from "../../app-shell/controller/bindings";

type Dependencies = Pick<AppControllerBindings, "activePaperExecutionRecord" | "autoTradingSnapshot" | "currentResearchRunId" | "executionAdapterPaperExecutionRows" | "executionAdapterSandboxProbeExecutionRows" | "executionAdapterSandboxProbeReviewRows" | "isLiveTradingGateDialogOpen" | "isRunningStage5Shadow" | "isRunningStage6Sandbox" | "isRunningStage9ProductionAdmission" | "portfolioPaperOrderApprovalRows" | "portfolioPaperOrderLifecycleRows" | "portfolioPaperOrderReplay" | "portfolioPaperOrderSimulations" | "portfolioPaperOrderStateHistoryRows" | "portfolioStage4Workflow" | "setAutoTradingSnapshot" | "setIsLiveTradingGateDialogOpen" | "setIsRunningStage5Shadow" | "setIsRunningStage6Sandbox" | "setIsRunningStage9ProductionAdmission" | "setPortfolioPaperOrderReplay" | "setPortfolioPaperOrderSimulations" | "setStage5SandboxAuthorizationPreflights" | "setStage5SandboxAuthorizationReviews" | "setStage5SandboxReadinessDecisions" | "setStage5ShadowError" | "setStage5ShadowSessions" | "setStage6KillSwitchState" | "setStage6SandboxAuthorizations" | "setStage6SandboxBatch" | "setStage6SandboxError" | "setStage9ProductionAdmissionCandidates" | "setStage9ProductionAdmissionClock" | "setStage9ProductionAdmissionError" | "setStage9ProductionAdmissionReviews" | "stage5SandboxAuthorizationPreflights" | "stage5SandboxAuthorizationReviews" | "stage5SandboxReadinessDecisions" | "stage5ShadowError" | "stage5ShadowRequestIdRef" | "stage5ShadowSessions" | "stage6KillSwitch" | "stage6SandboxAuthorizations" | "stage6SandboxBatch" | "stage6SandboxError" | "stage9ProductionAdmissionCandidates" | "stage9ProductionAdmissionClock" | "stage9ProductionAdmissionError" | "stage9ProductionAdmissionReviews">;
type Result = Pick<AppControllerBindings, "paperExecutionReplayGate" | "stage5ShadowState" | "stage6SandboxAuthorization" | "stage6GoldenPath" | "stage9ProductionAdmissionCandidate" | "stage9ProductionAdmissionReview" | "stage9ProductionAdmissionExpiry" | "runStage5ShadowPrimaryAction" | "runStage6SandboxAction" | "runStage9ProductionAdmissionCandidateAction" | "runStage9ProductionAdmissionReviewAction" | "runStage6KillSwitchAction" | "openLiveTradingGate" | "executionLiveTradingAllowed">;

export function useStageGateActions(controller: Dependencies): Result {
  const {
    activePaperExecutionRecord, autoTradingSnapshot, currentResearchRunId, executionAdapterPaperExecutionRows, executionAdapterSandboxProbeExecutionRows, executionAdapterSandboxProbeReviewRows,
    isLiveTradingGateDialogOpen, isRunningStage5Shadow, isRunningStage6Sandbox, isRunningStage9ProductionAdmission, portfolioPaperOrderApprovalRows, portfolioPaperOrderLifecycleRows,
    portfolioPaperOrderReplay, portfolioPaperOrderSimulations, portfolioPaperOrderStateHistoryRows, portfolioStage4Workflow, setAutoTradingSnapshot, setIsLiveTradingGateDialogOpen,
    setIsRunningStage5Shadow, setIsRunningStage6Sandbox, setIsRunningStage9ProductionAdmission, setPortfolioPaperOrderReplay, setPortfolioPaperOrderSimulations, setStage5SandboxAuthorizationPreflights,
    setStage5SandboxAuthorizationReviews, setStage5SandboxReadinessDecisions, setStage5ShadowError, setStage5ShadowSessions, setStage6KillSwitchState, setStage6SandboxAuthorizations,
    setStage6SandboxBatch, setStage6SandboxError, setStage9ProductionAdmissionCandidates, setStage9ProductionAdmissionClock, setStage9ProductionAdmissionError, setStage9ProductionAdmissionReviews,
    stage5SandboxAuthorizationPreflights, stage5SandboxAuthorizationReviews, stage5SandboxReadinessDecisions, stage5ShadowError, stage5ShadowRequestIdRef, stage5ShadowSessions,
    stage6KillSwitch, stage6SandboxAuthorizations, stage6SandboxBatch, stage6SandboxError, stage9ProductionAdmissionCandidates, stage9ProductionAdmissionClock,
    stage9ProductionAdmissionError, stage9ProductionAdmissionReviews
  } = controller;
  const paperExecutionReplayGate = buildPaperExecutionReplayGate({
      adapterPaperExecutionRows: executionAdapterPaperExecutionRows,
      currentRunId: currentResearchRunId,
      paperExecution: activePaperExecutionRecord,
      portfolioApprovalRows: portfolioPaperOrderApprovalRows,
      portfolioOrderLifecycleRows: portfolioPaperOrderLifecycleRows,
      portfolioOrderReplay: portfolioPaperOrderReplay,
      portfolioOrderSimulations: portfolioPaperOrderSimulations,
      portfolioStateHistoryRows: portfolioPaperOrderStateHistoryRows
    });
  const stage5ShadowState = buildStage5ShadowState(
      portfolioStage4Workflow,
      stage5ShadowSessions,
      stage5SandboxReadinessDecisions,
      stage5SandboxAuthorizationPreflights,
      stage5SandboxAuthorizationReviews,
      executionAdapterSandboxProbeExecutionRows,
      executionAdapterSandboxProbeReviewRows
    );
  const stage6SandboxAuthorization = stage6SandboxAuthorizations.find((row) =>
      row.workflowHash === portfolioStage4Workflow?.workflowHash &&
      row.reviewHash === stage5ShadowState.authorizationReview?.reviewHash
    ) ?? null;
  const stage6GoldenPath = buildStage6GoldenPath(
      portfolioStage4Workflow,
      stage5ShadowState.session,
      stage5ShadowState.readinessDecision,
      stage5ShadowState.authorizationPreflight,
      stage5ShadowState.authorizationReview,
      stage6SandboxAuthorization,
      stage6SandboxBatch
    );
  const stage9ProductionAdmissionCandidate = selectCurrentStage9ProductionAdmissionCandidate(
      stage9ProductionAdmissionCandidates, stage6SandboxAuthorization?.authorizationId,
      stage9ProductionAdmissionClock
    );
  const stage9ProductionAdmissionReview = stage9ProductionAdmissionReviews.find((row) =>
      row.candidateId === stage9ProductionAdmissionCandidate?.candidateId
    ) ?? null;
  const stage9ProductionAdmissionExpiry = stage9ProductionAdmissionCandidate?.expiresAt ?? null;
  const runStage5ShadowPrimaryAction = useCallback(async (
      reviewInput?: { outcome: "approved" | "rejected"; reason: string }
    ) => {
      if (!portfolioStage4Workflow || isRunningStage5Shadow) return;
      const requestId = stage5ShadowRequestIdRef.current + 1;
      stage5ShadowRequestIdRef.current = requestId;
      setIsRunningStage5Shadow(true);
      setStage5ShadowError(null);
      if (stage5ShadowState.actionId === "record-stage5-sandbox-authorization-review") {
        const preflight = stage5ShadowState.authorizationPreflight;
        if (!preflight || !reviewInput?.reason.trim()) {
          setIsRunningStage5Shadow(false);
          setStage5ShadowError("Stage 5 sandbox authorization review reason is required");
          return;
        }
        const result = await runStage5SandboxAuthorizationReview(
          quantCoreBaseUrl, preflight, reviewInput.outcome, reviewInput.reason.trim()
        );
        if (stage5ShadowRequestIdRef.current !== requestId) return;
        setIsRunningStage5Shadow(false);
        if (!result.review) {
          setStage5ShadowError(result.error ?? "Stage 5 sandbox authorization review failed");
          return;
        }
        const review = result.review;
        setStage5SandboxAuthorizationReviews((current) => [
          review,
          ...current.filter((row) => row.reviewId !== review.reviewId)
        ]);
        return;
      }
      if (stage5ShadowState.actionId === "run-stage5-sandbox-authorization-preflight") {
        const decision = stage5ShadowState.readinessDecision;
        const executionId = stage5ShadowState.sandboxProbeExecutionId;
        const reviewId = stage5ShadowState.sandboxProbeReviewId;
        if (!decision || !executionId || !reviewId) {
          setIsRunningStage5Shadow(false);
          setStage5ShadowError("Stage 5 authoritative sandbox probe evidence is required");
          return;
        }
        const result = await runStage5SandboxAuthorizationPreflight(
          quantCoreBaseUrl, decision, executionId, reviewId
        );
        if (stage5ShadowRequestIdRef.current !== requestId) return;
        setIsRunningStage5Shadow(false);
        if (!result.preflight) {
          setStage5ShadowError(result.error ?? "Stage 5 sandbox authorization preflight failed");
          return;
        }
        const preflight = result.preflight;
        setStage5SandboxAuthorizationPreflights((current) => [
          preflight,
          ...current.filter((row) => row.preflightId !== preflight.preflightId)
        ]);
        return;
      }
      if (stage5ShadowState.actionId === "review-stage5-sandbox-readiness") {
        if (!stage5ShadowState.session) {
          setIsRunningStage5Shadow(false);
          setStage5ShadowError("Stage 5 reconciled shadow session is required");
          return;
        }
        const result = await runStage5SandboxReadinessDecision(
          quantCoreBaseUrl,
          portfolioStage4Workflow,
          stage5ShadowState.session
        );
        if (stage5ShadowRequestIdRef.current !== requestId) return;
        setIsRunningStage5Shadow(false);
        if (!result.decision) {
          setStage5ShadowError(result.error ?? "Stage 5 sandbox readiness review failed");
          return;
        }
        const decision = result.decision;
        setStage5SandboxReadinessDecisions((current) => [
          decision,
          ...current.filter((row) => row.decisionId !== decision.decisionId)
        ]);
        return;
      }
      const result = await runStage5ShadowSession(
        quantCoreBaseUrl,
        portfolioStage4Workflow,
        stage5ShadowState.session?.failureMode ?? "none"
      );
      if (stage5ShadowRequestIdRef.current !== requestId) return;
      setIsRunningStage5Shadow(false);
      if (!result.session) {
        setStage5ShadowError(result.error ?? "Stage 5 shadow validation failed");
        return;
      }
      const session = result.session;
      setStage5ShadowSessions((current) => [
        session,
        ...current.filter((row) => row.sessionId !== session.sessionId)
      ]);
    }, [isRunningStage5Shadow, portfolioStage4Workflow, stage5ShadowState]);
  const runStage6SandboxAction = useCallback(async () => {
      if (isRunningStage6Sandbox || !stage6GoldenPath.action) return;
      setIsRunningStage6Sandbox(true);
      setStage6SandboxError(null);
      try {
        if (stage6GoldenPath.action === "authorize") {
          const { session, readinessDecision, authorizationPreflight, authorizationReview } = stage5ShadowState;
          if (!portfolioStage4Workflow || !session || !readinessDecision || !authorizationPreflight || !authorizationReview) {
            throw new Error("Stage 4/5 权威证据链不完整");
          }
          const result = await authorizeStage6SandboxBatch(
            quantCoreBaseUrl, portfolioStage4Workflow, session, readinessDecision, authorizationPreflight, authorizationReview
          );
          if (!result.authorization) throw new Error(result.error ?? "Stage 6 批次授权失败");
          setStage6SandboxAuthorizations((current) => [
            result.authorization!, ...current.filter((row) => row.authorizationId !== result.authorization!.authorizationId)
          ]);
          setStage6SandboxBatch(null);
          return;
        }
        if (!stage6SandboxAuthorization) throw new Error("Stage 6 批次授权不存在");
        const result = stage6GoldenPath.action === "submit"
          ? await submitStage6SandboxBatch(quantCoreBaseUrl, stage6SandboxAuthorization.authorizationId)
          : stage6GoldenPath.action === "reconcile"
            ? await reconcileStage6SandboxBatch(quantCoreBaseUrl, stage6SandboxAuthorization.authorizationId)
            : await cancelStage6SandboxOrder(
                quantCoreBaseUrl,
                stage6SandboxAuthorization.authorizationId,
                stage6SandboxBatch?.orders.find((order) =>
                  ["submission_pending", "open", "partially_filled", "reconciliation_required"].includes(order.state)
                )?.orderId ?? ""
              );
        if (!result.batch) throw new Error(result.error ?? "Stage 6 Sandbox 操作失败");
        setStage6SandboxBatch(result.batch);
        setStage6KillSwitchState(result.batch.killSwitch);
      } catch (error) {
        setStage6SandboxError(error instanceof Error ? error.message : "Stage 6 Sandbox 操作失败");
      } finally {
        setIsRunningStage6Sandbox(false);
      }
    }, [
      isRunningStage6Sandbox,
      portfolioStage4Workflow,
      stage5ShadowState,
      stage6GoldenPath.action,
      stage6SandboxAuthorization,
      stage6SandboxBatch
    ]);
  const runStage9ProductionAdmissionCandidateAction = useCallback(async () => {
      if (isRunningStage9ProductionAdmission || !stage6SandboxAuthorization) return;
      setIsRunningStage9ProductionAdmission(true);
      setStage9ProductionAdmissionError(null);
      try {
        const result = await createStage9ProductionAdmissionCandidate(
          quantCoreBaseUrl, stage6SandboxAuthorization.authorizationId
        );
        if (!result.candidate) throw new Error(result.error ?? "Stage 9 准入候选生成失败");
        setStage9ProductionAdmissionCandidates((current) => [
          result.candidate!, ...current.filter((row) => row.candidateId !== result.candidate!.candidateId)
        ]);
      } catch (error) {
        setStage9ProductionAdmissionError(error instanceof Error ? error.message : "Stage 9 准入候选生成失败");
      } finally {
        setIsRunningStage9ProductionAdmission(false);
      }
    }, [isRunningStage9ProductionAdmission, stage6SandboxAuthorization]);
  const runStage9ProductionAdmissionReviewAction = useCallback(async (
      reviewer: string,
      outcome: "approved" | "rejected",
      reason: string
    ) => {
      if (isRunningStage9ProductionAdmission || !stage9ProductionAdmissionCandidate) return;
      setIsRunningStage9ProductionAdmission(true);
      setStage9ProductionAdmissionError(null);
      try {
        const result = await createStage9ProductionAdmissionReview(
          quantCoreBaseUrl, stage9ProductionAdmissionCandidate.candidateId, reviewer, outcome, reason
        );
        if (!result.review) throw new Error(result.error ?? "Stage 9 准入复核失败");
        setStage9ProductionAdmissionReviews((current) => [
          result.review!, ...current.filter((row) => row.reviewId !== result.review!.reviewId)
        ]);
      } catch (error) {
        setStage9ProductionAdmissionError(error instanceof Error ? error.message : "Stage 9 准入复核失败");
      } finally {
        setIsRunningStage9ProductionAdmission(false);
      }
    }, [isRunningStage9ProductionAdmission, stage9ProductionAdmissionCandidate]);
  const runStage6KillSwitchAction = useCallback(async (triggered: boolean) => {
      if (isRunningStage6Sandbox) return;
      setIsRunningStage6Sandbox(true);
      setStage6SandboxError(null);
      try {
        const result = await setStage6KillSwitch(quantCoreBaseUrl, triggered);
        if (!result.killSwitch) throw new Error(result.error ?? "Stage 6 Kill Switch 操作失败");
        setStage6KillSwitchState(result.killSwitch);
        if (stage6SandboxAuthorization) {
          const batchResult = await loadStage6SandboxBatch(quantCoreBaseUrl, stage6SandboxAuthorization.authorizationId);
          if (batchResult.batch) setStage6SandboxBatch(batchResult.batch);
        }
      } catch (error) {
        setStage6SandboxError(error instanceof Error ? error.message : "Stage 6 Kill Switch 操作失败");
      } finally {
        setIsRunningStage6Sandbox(false);
      }
    }, [isRunningStage6Sandbox, stage6SandboxAuthorization]);
  const openLiveTradingGate = useCallback(async () => {
      setAutoTradingSnapshot(null);
      try {
        setAutoTradingSnapshot(await loadAutoTradingSnapshot(quantCoreBaseUrl));
      } catch {
        setAutoTradingSnapshot(null);
      }
      setIsLiveTradingGateDialogOpen(true);
    }, [quantCoreBaseUrl]);
  const executionLiveTradingAllowed = autoTradingSnapshot?.liveTradingAllowed === true;
  return {
    paperExecutionReplayGate, stage5ShadowState, stage6SandboxAuthorization, stage6GoldenPath, stage9ProductionAdmissionCandidate, stage9ProductionAdmissionReview,
    stage9ProductionAdmissionExpiry, runStage5ShadowPrimaryAction, runStage6SandboxAction, runStage9ProductionAdmissionCandidateAction, runStage9ProductionAdmissionReviewAction, runStage6KillSwitchAction,
    openLiveTradingGate, executionLiveTradingAllowed
  };
}
