import type { BrokerAdapterRow } from "../audit/execution-contracts";
import type { ExecutionAdapterEnvironmentBindingRow, ExecutionAdapterOrchestrationDryRunRow, ExecutionAdapterOrchestrationExecutionRow, ExecutionAdapterRuntimeReloadAcceptanceRow, ExecutionAdapterRuntimeReloadExecutionRow, ExecutionAdapterRuntimeReloadPlanRow, ExecutionAdapterSecretManifestValidationRow, ExecutionAdapterSecretMaterializationRow, ExecutionAdapterSecretReferenceRow } from "./adapter-contracts";
import type { ExecutionAdapterChainHealthRollup, ExecutionAdapterChainHealthStage, ExecutionAdapterChainHealthStageId, ExecutionAdapterChainHealthStatus, ExecutionAdapterHealthProbeRow, ExecutionAdapterHealthProbeSnapshot, ExecutionAdapterOpsStateRow, ExecutionAdapterOpsStateSnapshot, ExecutionAdapterPaperExecutionRow, ExecutionAdapterPaperExecutionSnapshot } from "./ops-contracts";
import type { ExecutionAdapterHumanConfirmationRow, ExecutionAdapterPaperOrderLifecycleRow, ExecutionAdapterPaperOrderLifecycleSnapshot, ExecutionAdapterPaperRouteRunbookRow, ExecutionAdapterPaperRouteRunbookSnapshot, ExecutionAdapterProductionRouteReviewRow, ExecutionAdapterSandboxOrderSchemaDryRunRow, ExecutionAdapterSandboxProbeExecutionRow, ExecutionAdapterSandboxProbePlanRow, ExecutionAdapterSandboxProbeReviewRow } from "./validation-contracts";
import type { Market } from "../stage1/foundation-contracts";
import { executionAdapterHealthProbeCheckSummary, executionAdapterHealthProbeCredentialSummary, executionAdapterHealthProbeRouteReviewSummary, executionAdapterHealthProbeStatusLabel, executionAdapterHealthProbeTone, executionAdapterOpsStateBoundary, executionAdapterOpsStateConfirmationSummary, executionAdapterOpsStateStatusLabel, executionAdapterOpsStateStepSummary, executionAdapterOpsStateTone, executionAdapterPaperExecutionBoundary, executionAdapterPaperExecutionConfirmationSummary, executionAdapterPaperExecutionFillSummary, executionAdapterPaperExecutionStatusLabel, executionAdapterPaperExecutionStepSummary, executionAdapterPaperExecutionTone, executionAdapterPaperOrderLifecycleConfirmationSummary, executionAdapterPaperOrderLifecycleStatusLabel, executionAdapterPaperOrderLifecycleStepSummary, executionAdapterPaperOrderLifecycleTone, executionAdapterPaperRouteRunbookBoundary, executionAdapterPaperRouteRunbookConfirmationSummary, executionAdapterPaperRouteRunbookStatusLabel, executionAdapterPaperRouteRunbookStepSummary, executionAdapterPaperRouteRunbookTone, executionAdapterSandboxOrderIntentSummary, executionAdapterSecretReferenceBlockerSummary, executionAdapterSecretReferenceEnvVarSummary, formatAssumptionCurrency } from "../strategy/workflow-builders";

export function buildExecutionAdapterPaperOrderLifecycleRows(
  lifecycles: ExecutionAdapterPaperOrderLifecycleSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterPaperOrderLifecycleRow[] {
  return (lifecycles ?? [])
    .map((row) => ({
      id: row.paperOrderLifecycleId,
      sandboxOrderSchemaDryRunId: row.sandboxOrderSchemaDryRunId,
      productionRouteReviewId: row.productionRouteReviewId,
      sandboxProbeReviewId: row.sandboxProbeReviewId,
      sandboxProbeExecutionId: row.sandboxProbeExecutionId,
      sandboxProbePlanId: row.sandboxProbePlanId,
      humanConfirmationId: row.humanConfirmationId,
      orchestrationExecutionId: row.orchestrationExecutionId,
      dryRunId: row.dryRunId,
      acceptanceId: row.acceptanceId,
      executionId: row.executionId,
      planId: row.planId,
      bindingId: row.bindingId,
      materializationId: row.materializationId,
      manifestValidationId: row.manifestValidationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterPaperOrderLifecycleStatusLabel(row.status),
      lifecycleMode: row.lifecycleMode,
      dryRunMode: row.dryRunMode,
      reviewMode: row.reviewMode,
      sandboxReviewMode: row.sandboxReviewMode,
      probeExecutionMode: row.probeExecutionMode,
      probeMode: row.probeMode,
      confirmationMode: row.confirmationMode,
      orchestrationExecutionMode: row.orchestrationExecutionMode,
      orchestrationMode: row.orchestrationMode,
      acceptanceMode: row.acceptanceMode,
      executionMode: row.executionMode,
      reloadMode: row.reloadMode,
      maintenanceWindowId: row.maintenanceWindowId,
      bindingMode: row.bindingMode,
      manifestPath: row.manifestPath,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      orderIntentSummary: executionAdapterSandboxOrderIntentSummary(row.orderIntent),
      lifecycleStepSummary: executionAdapterPaperOrderLifecycleStepSummary(row.lifecycleSteps),
      orderSubmitted: row.orderSubmitted,
      liveOrderSubmitted: row.liveOrderSubmitted,
      confirmationSummary: executionAdapterPaperOrderLifecycleConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: row.liveOrderSubmitted
        ? "Live order submission detected · blocked"
        : row.liveTradingAllowed
          ? "Live trading allowed"
          : row.paperOnly
            ? "Paper lifecycle recorded · no live order submitted · live trading blocked"
            : "No live order submitted · live trading blocked",
      auditEventId: row.paperOrderLifecycleId,
      tone: executionAdapterPaperOrderLifecycleTone(row.status, row.liveOrderSubmitted)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterPaperRouteRunbookRows(
  runbooks: ExecutionAdapterPaperRouteRunbookSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterPaperRouteRunbookRow[] {
  return (runbooks ?? [])
    .map((row) => ({
      id: row.paperRouteRunbookId,
      paperOrderLifecycleId: row.paperOrderLifecycleId,
      sandboxOrderSchemaDryRunId: row.sandboxOrderSchemaDryRunId,
      productionRouteReviewId: row.productionRouteReviewId,
      sandboxProbeReviewId: row.sandboxProbeReviewId,
      sandboxProbeExecutionId: row.sandboxProbeExecutionId,
      sandboxProbePlanId: row.sandboxProbePlanId,
      humanConfirmationId: row.humanConfirmationId,
      orchestrationExecutionId: row.orchestrationExecutionId,
      dryRunId: row.dryRunId,
      acceptanceId: row.acceptanceId,
      executionId: row.executionId,
      planId: row.planId,
      bindingId: row.bindingId,
      materializationId: row.materializationId,
      manifestValidationId: row.manifestValidationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterPaperRouteRunbookStatusLabel(row.status),
      runbookMode: row.runbookMode,
      lifecycleMode: row.lifecycleMode,
      dryRunMode: row.dryRunMode,
      reviewMode: row.reviewMode,
      sandboxReviewMode: row.sandboxReviewMode,
      probeExecutionMode: row.probeExecutionMode,
      probeMode: row.probeMode,
      confirmationMode: row.confirmationMode,
      orchestrationExecutionMode: row.orchestrationExecutionMode,
      orchestrationMode: row.orchestrationMode,
      acceptanceMode: row.acceptanceMode,
      executionMode: row.executionMode,
      reloadMode: row.reloadMode,
      maintenanceWindowId: row.maintenanceWindowId,
      bindingMode: row.bindingMode,
      manifestPath: row.manifestPath,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      orderIntentSummary: executionAdapterSandboxOrderIntentSummary(row.orderIntent),
      lifecycleStepSummary: executionAdapterPaperOrderLifecycleStepSummary(row.lifecycleSteps),
      runbookStepSummary: executionAdapterPaperRouteRunbookStepSummary(row.runbookSteps),
      orderSubmitted: row.orderSubmitted,
      liveOrderSubmitted: row.liveOrderSubmitted,
      routeExecuted: row.routeExecuted,
      confirmationSummary: executionAdapterPaperRouteRunbookConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: executionAdapterPaperRouteRunbookBoundary(row),
      auditEventId: row.paperRouteRunbookId,
      tone: executionAdapterPaperRouteRunbookTone(row.status, row.routeExecuted)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterOpsStateRows(
  states: ExecutionAdapterOpsStateSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterOpsStateRow[] {
  return (states ?? [])
    .map((row) => ({
      id: row.adapterOpsStateId,
      paperRouteRunbookId: row.paperRouteRunbookId,
      paperOrderLifecycleId: row.paperOrderLifecycleId,
      sandboxOrderSchemaDryRunId: row.sandboxOrderSchemaDryRunId,
      productionRouteReviewId: row.productionRouteReviewId,
      sandboxProbeReviewId: row.sandboxProbeReviewId,
      sandboxProbeExecutionId: row.sandboxProbeExecutionId,
      sandboxProbePlanId: row.sandboxProbePlanId,
      humanConfirmationId: row.humanConfirmationId,
      orchestrationExecutionId: row.orchestrationExecutionId,
      dryRunId: row.dryRunId,
      acceptanceId: row.acceptanceId,
      executionId: row.executionId,
      planId: row.planId,
      bindingId: row.bindingId,
      materializationId: row.materializationId,
      manifestValidationId: row.manifestValidationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterOpsStateStatusLabel(row.status),
      opsMode: row.opsMode,
      runbookMode: row.runbookMode,
      lifecycleMode: row.lifecycleMode,
      dryRunMode: row.dryRunMode,
      reviewMode: row.reviewMode,
      sandboxReviewMode: row.sandboxReviewMode,
      probeExecutionMode: row.probeExecutionMode,
      probeMode: row.probeMode,
      confirmationMode: row.confirmationMode,
      orchestrationExecutionMode: row.orchestrationExecutionMode,
      orchestrationMode: row.orchestrationMode,
      acceptanceMode: row.acceptanceMode,
      executionMode: row.executionMode,
      reloadMode: row.reloadMode,
      maintenanceWindowId: row.maintenanceWindowId,
      bindingMode: row.bindingMode,
      manifestPath: row.manifestPath,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      orderIntentSummary: executionAdapterSandboxOrderIntentSummary(row.orderIntent),
      lifecycleStepSummary: executionAdapterPaperOrderLifecycleStepSummary(row.lifecycleSteps),
      runbookStepSummary: executionAdapterPaperRouteRunbookStepSummary(row.runbookSteps),
      opsStepSummary: executionAdapterOpsStateStepSummary(row.opsSteps),
      orderSubmitted: row.orderSubmitted,
      liveOrderSubmitted: row.liveOrderSubmitted,
      routeExecuted: row.routeExecuted,
      confirmationSummary: executionAdapterOpsStateConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: executionAdapterOpsStateBoundary(row),
      auditEventId: row.adapterOpsStateId,
      tone: executionAdapterOpsStateTone(row)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterPaperExecutionRows(
  executions: ExecutionAdapterPaperExecutionSnapshot[] | null | undefined,
  limit = 8
): ExecutionAdapterPaperExecutionRow[] {
  return (executions ?? [])
    .map((row) => ({
      id: row.adapterPaperExecutionId,
      adapterOpsStateId: row.adapterOpsStateId,
      paperRouteRunbookId: row.paperRouteRunbookId,
      paperOrderLifecycleId: row.paperOrderLifecycleId,
      sandboxOrderSchemaDryRunId: row.sandboxOrderSchemaDryRunId,
      productionRouteReviewId: row.productionRouteReviewId,
      sandboxProbeReviewId: row.sandboxProbeReviewId,
      sandboxProbeExecutionId: row.sandboxProbeExecutionId,
      sandboxProbePlanId: row.sandboxProbePlanId,
      humanConfirmationId: row.humanConfirmationId,
      orchestrationExecutionId: row.orchestrationExecutionId,
      dryRunId: row.dryRunId,
      acceptanceId: row.acceptanceId,
      executionId: row.executionId,
      planId: row.planId,
      bindingId: row.bindingId,
      materializationId: row.materializationId,
      manifestValidationId: row.manifestValidationId,
      adapterId: row.adapterId,
      market: row.market,
      route: row.route,
      timestamp: row.recordedAt,
      status: row.status,
      statusLabel: executionAdapterPaperExecutionStatusLabel(row.status),
      paperExecutionMode: row.paperExecutionMode,
      opsMode: row.opsMode,
      runbookMode: row.runbookMode,
      lifecycleMode: row.lifecycleMode,
      dryRunMode: row.dryRunMode,
      reviewMode: row.reviewMode,
      sandboxReviewMode: row.sandboxReviewMode,
      probeExecutionMode: row.probeExecutionMode,
      probeMode: row.probeMode,
      confirmationMode: row.confirmationMode,
      orchestrationExecutionMode: row.orchestrationExecutionMode,
      orchestrationMode: row.orchestrationMode,
      acceptanceMode: row.acceptanceMode,
      executionMode: row.executionMode,
      reloadMode: row.reloadMode,
      maintenanceWindowId: row.maintenanceWindowId,
      bindingMode: row.bindingMode,
      manifestPath: row.manifestPath,
      envVarSummary: executionAdapterSecretReferenceEnvVarSummary(row.requiredEnvVars),
      orderIntentSummary: executionAdapterSandboxOrderIntentSummary(row.orderIntent),
      lifecycleStepSummary: executionAdapterPaperOrderLifecycleStepSummary(row.lifecycleSteps),
      runbookStepSummary: executionAdapterPaperRouteRunbookStepSummary(row.runbookSteps),
      opsStepSummary: executionAdapterOpsStateStepSummary(row.opsSteps),
      paperExecutionStepSummary: executionAdapterPaperExecutionStepSummary(row.paperExecutionSteps),
      fillSummary: executionAdapterPaperExecutionFillSummary(row.simulatedFill),
      simulatedSymbol: row.simulatedFill.symbol,
      simulatedSide: row.simulatedFill.side,
      simulatedQuantity: row.simulatedFill.quantity,
      paperFillRecorded: row.paperFillRecorded,
      orderSubmitted: row.orderSubmitted,
      liveOrderSubmitted: row.liveOrderSubmitted,
      routeExecuted: row.routeExecuted,
      confirmationSummary: executionAdapterPaperExecutionConfirmationSummary(row.requiredConfirmations),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(row.blockedReasons),
      boundary: executionAdapterPaperExecutionBoundary(row),
      auditEventId: row.adapterPaperExecutionId,
      tone: executionAdapterPaperExecutionTone(row)
    }))
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))
    .slice(0, Math.max(1, limit));
}

export function buildExecutionAdapterHealthProbeRows(
  probe: ExecutionAdapterHealthProbeSnapshot | null | undefined
): ExecutionAdapterHealthProbeRow[] {
  if (!probe) {
    return [];
  }
  return [
    {
      id: probe.probeId,
      adapterId: probe.adapterId,
      provider: probe.provider,
      exchangeId: probe.exchangeId,
      mode: probe.mode,
      timestamp: probe.generatedAt,
      status: probe.status,
      statusLabel: executionAdapterHealthProbeStatusLabel(probe.status),
      marketSummary: `${formatAssumptionCurrency(probe.marketCount)} markets`,
      credentialSummary: executionAdapterHealthProbeCredentialSummary(probe.credentials),
      accountSyncSummary: probe.accountSyncState,
      routeReviewSummary: executionAdapterHealthProbeRouteReviewSummary(probe),
      checkSummary: executionAdapterHealthProbeCheckSummary(probe.checks),
      blockerSummary: executionAdapterSecretReferenceBlockerSummary(probe.blockedReasons),
      boundary:
        probe.paperOnly && !probe.liveTradingAllowed && !probe.orderRoutingEnabled
          ? "Paper only · order routing disabled"
          : "Live trading blocked",
      tone: executionAdapterHealthProbeTone(probe.status),
      checks: probe.checks
    }
  ];
}

export type ExecutionAdapterChainRow = {
  adapterId: string;
  auditEventId?: string;
  blockerSummary?: string;
  boundary?: string;
  id: string;
  market: Market | "multi";
  route: "paper" | "live";
  status: string;
  statusLabel?: string;
  timestamp: string;
  tone?: "positive" | "warning" | "neutral" | "risk";
  liveOrderSubmitted?: boolean;
  orderSubmitted?: boolean;
  paperFillRecorded?: boolean;
  routeExecuted?: boolean;
};

export interface ExecutionAdapterChainStageDefinition {
  id: ExecutionAdapterChainHealthStageId;
  label: string;
  rows: ReadonlyArray<ExecutionAdapterChainRow>;
  recordedStatuses: string[];
  requiresPaperFill?: boolean;
  unsafeWhenOrderSubmitted?: boolean;
  unsafeWhenLiveOrderSubmitted?: boolean;
  unsafeWhenRouteExecuted?: boolean;
}

export function buildExecutionAdapterChainHealthRollups({
  adapterOpsStateRows = [],
  adapterPaperExecutionRows = [],
  brokerRows = [],
  environmentBindingRows = [],
  humanConfirmationRows = [],
  orchestrationDryRunRows = [],
  orchestrationExecutionRows = [],
  paperOrderLifecycleRows = [],
  paperRouteRunbookRows = [],
  productionRouteReviewRows = [],
  runtimeReloadAcceptanceRows = [],
  runtimeReloadExecutionRows = [],
  runtimeReloadPlanRows = [],
  sandboxOrderSchemaDryRunRows = [],
  sandboxProbeExecutionRows = [],
  sandboxProbePlanRows = [],
  sandboxProbeReviewRows = [],
  secretManifestValidationRows = [],
  secretMaterializationRows = [],
  secretReferenceRows = []
}: {
  adapterOpsStateRows?: ReadonlyArray<ExecutionAdapterOpsStateRow>;
  adapterPaperExecutionRows?: ReadonlyArray<ExecutionAdapterPaperExecutionRow>;
  brokerRows?: ReadonlyArray<BrokerAdapterRow>;
  environmentBindingRows?: ReadonlyArray<ExecutionAdapterEnvironmentBindingRow>;
  humanConfirmationRows?: ReadonlyArray<ExecutionAdapterHumanConfirmationRow>;
  orchestrationDryRunRows?: ReadonlyArray<ExecutionAdapterOrchestrationDryRunRow>;
  orchestrationExecutionRows?: ReadonlyArray<ExecutionAdapterOrchestrationExecutionRow>;
  paperOrderLifecycleRows?: ReadonlyArray<ExecutionAdapterPaperOrderLifecycleRow>;
  paperRouteRunbookRows?: ReadonlyArray<ExecutionAdapterPaperRouteRunbookRow>;
  productionRouteReviewRows?: ReadonlyArray<ExecutionAdapterProductionRouteReviewRow>;
  runtimeReloadAcceptanceRows?: ReadonlyArray<ExecutionAdapterRuntimeReloadAcceptanceRow>;
  runtimeReloadExecutionRows?: ReadonlyArray<ExecutionAdapterRuntimeReloadExecutionRow>;
  runtimeReloadPlanRows?: ReadonlyArray<ExecutionAdapterRuntimeReloadPlanRow>;
  sandboxOrderSchemaDryRunRows?: ReadonlyArray<ExecutionAdapterSandboxOrderSchemaDryRunRow>;
  sandboxProbeExecutionRows?: ReadonlyArray<ExecutionAdapterSandboxProbeExecutionRow>;
  sandboxProbePlanRows?: ReadonlyArray<ExecutionAdapterSandboxProbePlanRow>;
  sandboxProbeReviewRows?: ReadonlyArray<ExecutionAdapterSandboxProbeReviewRow>;
  secretManifestValidationRows?: ReadonlyArray<ExecutionAdapterSecretManifestValidationRow>;
  secretMaterializationRows?: ReadonlyArray<ExecutionAdapterSecretMaterializationRow>;
  secretReferenceRows?: ReadonlyArray<ExecutionAdapterSecretReferenceRow>;
}): ExecutionAdapterChainHealthRollup[] {
  const stageDefinitions: ExecutionAdapterChainStageDefinition[] = [
    {
      id: "secret-reference",
      label: "Secret reference",
      rows: secretReferenceRows,
      recordedStatuses: ["reference_recorded"]
    },
    {
      id: "secret-materialization",
      label: "Secret materialization",
      rows: secretMaterializationRows,
      recordedStatuses: ["manifest_recorded"]
    },
    {
      id: "secret-manifest-validation",
      label: "Secret manifest validation",
      rows: secretManifestValidationRows,
      recordedStatuses: ["validated"]
    },
    {
      id: "environment-binding",
      label: "Environment binding",
      rows: environmentBindingRows,
      recordedStatuses: ["binding_recorded"]
    },
    {
      id: "runtime-reload-plan",
      label: "Runtime reload plan",
      rows: runtimeReloadPlanRows,
      recordedStatuses: ["plan_recorded"]
    },
    {
      id: "runtime-reload-execution",
      label: "Runtime reload execution",
      rows: runtimeReloadExecutionRows,
      recordedStatuses: ["execution_recorded"]
    },
    {
      id: "runtime-reload-acceptance",
      label: "Runtime reload acceptance",
      rows: runtimeReloadAcceptanceRows,
      recordedStatuses: ["acceptance_recorded"]
    },
    {
      id: "orchestration-dry-run",
      label: "Orchestration dry-run",
      rows: orchestrationDryRunRows,
      recordedStatuses: ["dry_run_recorded"]
    },
    {
      id: "orchestration-execution",
      label: "Orchestration execution",
      rows: orchestrationExecutionRows,
      recordedStatuses: ["execution_recorded"]
    },
    {
      id: "human-confirmation",
      label: "Human confirmation",
      rows: humanConfirmationRows,
      recordedStatuses: ["confirmation_recorded"]
    },
    {
      id: "sandbox-probe-plan",
      label: "Sandbox probe plan",
      rows: sandboxProbePlanRows,
      recordedStatuses: ["probe_plan_recorded"]
    },
    {
      id: "sandbox-probe-execution",
      label: "Sandbox probe execution",
      rows: sandboxProbeExecutionRows,
      recordedStatuses: ["probe_execution_recorded"]
    },
    {
      id: "sandbox-probe-review",
      label: "Sandbox probe review",
      rows: sandboxProbeReviewRows,
      recordedStatuses: ["probe_review_recorded"]
    },
    {
      id: "production-route-review",
      label: "Production route review",
      rows: productionRouteReviewRows,
      recordedStatuses: ["route_review_recorded"]
    },
    {
      id: "sandbox-order-schema-dry-run",
      label: "Sandbox order schema dry-run",
      rows: sandboxOrderSchemaDryRunRows,
      recordedStatuses: ["schema_dry_run_recorded"],
      unsafeWhenOrderSubmitted: true
    },
    {
      id: "paper-order-lifecycle",
      label: "Paper order lifecycle",
      rows: paperOrderLifecycleRows,
      recordedStatuses: ["lifecycle_recorded"],
      unsafeWhenLiveOrderSubmitted: true
    },
    {
      id: "paper-route-runbook",
      label: "Paper route runbook",
      rows: paperRouteRunbookRows,
      recordedStatuses: ["runbook_recorded"],
      unsafeWhenLiveOrderSubmitted: true,
      unsafeWhenRouteExecuted: true
    },
    {
      id: "ops-state",
      label: "Adapter ops state",
      rows: adapterOpsStateRows,
      recordedStatuses: ["ops_state_recorded"],
      unsafeWhenLiveOrderSubmitted: true,
      unsafeWhenRouteExecuted: true
    },
    {
      id: "adapter-paper-execution",
      label: "Adapter paper execution",
      rows: adapterPaperExecutionRows,
      recordedStatuses: ["paper_execution_recorded"],
      requiresPaperFill: true,
      unsafeWhenLiveOrderSubmitted: true,
      unsafeWhenRouteExecuted: true
    }
  ];
  const routeIndex = new Map<
    string,
    {
      adapterId: string;
      adapterName: string;
      market: Market | "multi";
    }
  >();

  for (const row of brokerRows) {
    if (row.route === "live" && row.id !== "paper-local") {
      routeIndex.set(`${row.id}:live`, {
        adapterId: row.id,
        adapterName: row.adapter,
        market: row.market
      });
    }
  }
  for (const stage of stageDefinitions) {
    for (const row of stage.rows) {
      if (row.route === "live" && row.adapterId !== "paper-local") {
        routeIndex.set(`${row.adapterId}:live`, {
          adapterId: row.adapterId,
          adapterName: row.adapterId,
          market: row.market
        });
      }
    }
  }

  return [...routeIndex.values()]
    .map((route) => {
      const stages = stageDefinitions.map((stage) =>
        buildExecutionAdapterChainHealthStage(route.adapterId, stage)
      );
      const recordedStages = stages.filter((stage) => stage.status === "recorded");
      const blocker =
        stages.find((stage) => stage.status === "unsafe" || stage.status === "blocked") ??
        stages.find((stage) => stage.status === "missing") ??
        null;
      const latestEvidence =
        recordedStages
          .filter((stage) => stage.timestamp)
          .sort(
            (left, right) =>
              (right.timestamp ?? "").localeCompare(left.timestamp ?? "") ||
              (right.evidenceId ?? "").localeCompare(left.evidenceId ?? "")
          )[0] ?? null;
      const status = executionAdapterChainHealthStatus(stages, blocker);
      const tone: ExecutionAdapterChainHealthRollup["tone"] =
        status === "paper_ready" ? "positive" : status === "blocked" ? "risk" : "warning";
      return {
        id: `${route.adapterId}:live`,
        adapterId: route.adapterId,
        adapterName: route.adapterName,
        market: route.market,
        route: "live" as const,
        status,
        headline: executionAdapterChainHealthHeadline(status, route.adapterName),
        detail: executionAdapterChainHealthDetail(status, route.adapterName, blocker),
        completedStageCount: recordedStages.length,
        totalStageCount: stages.length,
        blockerStageId: blocker?.id ?? null,
        blockerLabel: blocker?.label ?? null,
        latestEvidenceId: latestEvidence?.evidenceId ?? null,
        latestEvidenceTimestamp: latestEvidence?.timestamp ?? null,
        latestAuditEventId: latestEvidence?.auditEventId ?? null,
        manualRouteCandidate: status === "paper_ready",
        orderSubmissionEnabled: false as const,
        liveTradingAllowed: false as const,
        stages,
        tone
      };
    })
    .sort((left, right) => {
      const statusOrder: Record<ExecutionAdapterChainHealthStatus, number> = {
        blocked: 0,
        in_progress: 1,
        empty: 2,
        paper_ready: 3
      };
      return statusOrder[left.status] - statusOrder[right.status] || left.adapterId.localeCompare(right.adapterId);
    });
}

export function buildExecutionAdapterChainHealthStage(
  adapterId: string,
  definition: ExecutionAdapterChainStageDefinition
): ExecutionAdapterChainHealthStage {
  const row = latestExecutionAdapterChainRow(definition.rows, adapterId);
  if (!row) {
    return {
      id: definition.id,
      label: definition.label,
      status: "missing",
      evidenceId: null,
      auditEventId: null,
      timestamp: null,
      detail: `${definition.label} evidence has not been recorded.`,
      blocker: `${definition.label} evidence is missing.`,
      tone: "warning"
    };
  }
  const unsafeReasons = executionAdapterChainUnsafeReasons(row, definition);
  if (unsafeReasons.length > 0) {
    return {
      id: definition.id,
      label: definition.label,
      status: "unsafe",
      evidenceId: row.id,
      auditEventId: row.auditEventId ?? row.id,
      timestamp: row.timestamp,
      detail: `${row.statusLabel || row.status} · ${unsafeReasons.join(", ")}`,
      blocker: unsafeReasons.join(", "),
      tone: "risk"
    };
  }
  if (definition.recordedStatuses.includes(row.status)) {
    return {
      id: definition.id,
      label: definition.label,
      status: "recorded",
      evidenceId: row.id,
      auditEventId: row.auditEventId ?? row.id,
      timestamp: row.timestamp,
      detail: `${row.statusLabel || row.status} · ${row.boundary || "live trading blocked"}`,
      blocker: null,
      tone: "positive"
    };
  }
  return {
    id: definition.id,
    label: definition.label,
    status: "blocked",
    evidenceId: row.id,
    auditEventId: row.auditEventId ?? row.id,
    timestamp: row.timestamp,
    detail: `${row.statusLabel || row.status} · ${row.blockerSummary || "blocked"}`,
    blocker: row.blockerSummary || `${definition.label} is blocked.`,
    tone: "risk"
  };
}

export function latestExecutionAdapterChainRow<T extends ExecutionAdapterChainRow>(
  rows: ReadonlyArray<T>,
  adapterId: string
): T | null {
  return (
    rows
      .filter((row) => row.route === "live" && row.adapterId === adapterId)
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function executionAdapterChainUnsafeReasons(
  row: ExecutionAdapterChainRow,
  definition: ExecutionAdapterChainStageDefinition
): string[] {
  const reasons: string[] = [];
  if (definition.requiresPaperFill && row.paperFillRecorded !== true) {
    reasons.push("paper fill is not recorded");
  }
  if (definition.unsafeWhenOrderSubmitted && row.orderSubmitted) {
    reasons.push("order submission must stay disabled");
  }
  if (definition.unsafeWhenLiveOrderSubmitted && row.liveOrderSubmitted) {
    reasons.push("live order submission is not allowed");
  }
  if (definition.unsafeWhenRouteExecuted && row.routeExecuted) {
    reasons.push("route execution is not allowed");
  }
  return reasons;
}

export function executionAdapterChainHealthStatus(
  stages: ExecutionAdapterChainHealthStage[],
  blocker: ExecutionAdapterChainHealthStage | null
): ExecutionAdapterChainHealthStatus {
  if (blocker?.status === "blocked" || blocker?.status === "unsafe") {
    return "blocked";
  }
  if (stages.every((stage) => stage.status === "recorded")) {
    return "paper_ready";
  }
  if (stages.every((stage) => stage.status === "missing")) {
    return "empty";
  }
  return "in_progress";
}

export function executionAdapterChainHealthHeadline(status: ExecutionAdapterChainHealthStatus, adapterName: string): string {
  if (status === "paper_ready") {
    return `${adapterName} paper-only chain ready for manual review`;
  }
  if (status === "blocked") {
    return `${adapterName} adapter chain blocked`;
  }
  if (status === "in_progress") {
    return `${adapterName} adapter chain in progress`;
  }
  return `${adapterName} adapter chain not started`;
}

export function executionAdapterChainHealthDetail(
  status: ExecutionAdapterChainHealthStatus,
  adapterName: string,
  blocker: ExecutionAdapterChainHealthStage | null
): string {
  if (status === "paper_ready") {
    return `${adapterName} has a complete paper-only pre-live adapter chain; manual route review is required and live trading remains blocked.`;
  }
  if (blocker) {
    return `${blocker.label}: ${blocker.blocker || blocker.detail}. Live trading remains blocked.`;
  }
  return `${adapterName} has no pre-live adapter evidence yet. Start with secret reference evidence; live trading remains blocked.`;
}
