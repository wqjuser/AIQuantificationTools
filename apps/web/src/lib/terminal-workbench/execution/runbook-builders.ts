import type { TerminalWorkspace } from "../core/workspace-contracts";
import type { ExecutionAdapterCertificationApplyRow, ExecutionAdapterCertificationRow, ExecutionAdapterControlledRestartEvidenceRow, ExecutionAdapterEnvironmentBindingRow, ExecutionAdapterRestartAcceptanceRow, ExecutionAdapterRuntimeReloadExecutionRow, ExecutionAdapterRuntimeReloadPlanRow, ExecutionAdapterSecretMaterializationRow, ExecutionAdapterSecretReferenceRow } from "./adapter-contracts";
import type { ExecutionAdapterCertificationApplyConfirmationRow, ExecutionAdapterCertificationApplyConfirmations, ExecutionAdapterHealthProbeRow, ExecutionAdapterOpsStateRow, ExecutionAdapterPaperExecutionRow, ExecutionAdapterPreLiveRunbookStatus, ExecutionAdapterPreLiveRunbookStep, ExecutionAdapterPreLiveRunbookStepStatus, ExecutionAdapterPreLiveRunbookSummary } from "./ops-contracts";
import type { ExecutionAdapterPaperOrderLifecycleRow, ExecutionAdapterPaperRouteRunbookRow, ExecutionAdapterProductionRouteReviewRow, ExecutionAdapterSandboxOrderSchemaDryRunRow } from "./validation-contracts";
import type { ExecutionAdapterPreLiveRunbookInput } from "../stage1/archive-contracts";
import type { Market } from "../stage1/foundation-contracts";
import { markdownTable } from "../strategy/backtest-builders";

export function buildExecutionAdapterPreLiveRunbookSummary(
  input: ExecutionAdapterPreLiveRunbookInput
): ExecutionAdapterPreLiveRunbookSummary {
  const { workspace } = input;
  const market = workspace.selectedInstrument.market;
  const fallbackAdapterId = `${market}-live`;
  const latestCertificationCandidate = latestPreLiveScopedRow(workspace, input.certificationRows ?? []);
  const latestPaperExecutionCandidate = latestPreLiveScopedRow(workspace, input.paperExecutionRows ?? []);
  const latestOpsStateCandidate = latestPreLiveScopedRow(workspace, input.opsStateRows ?? []);
  const latestRunbookCandidate = latestPreLiveScopedRow(workspace, input.paperRouteRunbookRows ?? []);
  const latestRouteReviewCandidate = latestPreLiveScopedRow(workspace, input.productionRouteReviewRows ?? []);
  const latestLedgerCandidate = latestPreLiveScopedRow(workspace, input.adapterLedgerRows ?? []);
  const adapterId =
    latestPaperExecutionCandidate?.adapterId ??
    latestOpsStateCandidate?.adapterId ??
    latestRunbookCandidate?.adapterId ??
    latestRouteReviewCandidate?.adapterId ??
    latestCertificationCandidate?.adapterId ??
    latestLedgerCandidate?.adapterId ??
    fallbackAdapterId;

  const latestLedger = latestPreLiveScopedRow(workspace, input.adapterLedgerRows ?? [], adapterId);
  const latestCertification = latestPreLiveScopedRow(workspace, input.certificationRows ?? [], adapterId);
  const latestSecretManifestValidation = latestPreLiveScopedRow(
    workspace,
    input.secretManifestValidationRows ?? [],
    adapterId
  );
  const latestRuntimeReloadAcceptance = latestPreLiveScopedRow(
    workspace,
    input.runtimeReloadAcceptanceRows ?? [],
    adapterId
  );
  const latestHumanConfirmation = latestPreLiveScopedRow(workspace, input.humanConfirmationRows ?? [], adapterId);
  const latestProductionRouteReview = latestPreLiveScopedRow(
    workspace,
    input.productionRouteReviewRows ?? [],
    adapterId
  );
  const latestHealthProbe = latestPreLiveHealthProbeRow(input.healthProbeRows ?? [], adapterId);
  const latestSandboxOrderSchemaDryRun = latestPreLiveScopedRow(
    workspace,
    input.sandboxOrderSchemaDryRunRows ?? [],
    adapterId
  );
  const latestPaperOrderLifecycle = latestPreLiveScopedRow(
    workspace,
    input.paperOrderLifecycleRows ?? [],
    adapterId
  );
  const latestPaperRouteRunbook = latestPreLiveScopedRow(workspace, input.paperRouteRunbookRows ?? [], adapterId);
  const latestOpsState = latestPreLiveScopedRow(workspace, input.opsStateRows ?? [], adapterId);
  const latestPaperExecution = latestPreLiveScopedRow(workspace, input.paperExecutionRows ?? [], adapterId);

  const rows: ExecutionAdapterPreLiveRunbookStep[] = [
    latestLedger && !latestLedger.liveTradingAllowed
      ? preLiveStep({
          detail: `${latestLedger.reason} · ${latestLedger.gateSummary}`,
          evidenceId: latestLedger.id,
          evidenceTimestamp: latestLedger.timestamp,
          id: "adapter-state",
          label: "Adapter state ledger",
          nextStep: "Continue paper-only certification chain",
          status: "passed",
          value: latestLedger.label
        })
      : preLiveStep({
          detail: latestLedger?.liveTradingAllowed
            ? "Live trading is already allowed; pre-live runbook refuses to treat this as paper-only evidence."
            : `Settings has not loaded a live adapter state ledger for ${adapterId}.`,
          evidenceId: latestLedger?.id ?? null,
          evidenceTimestamp: latestLedger?.timestamp ?? null,
          id: "adapter-state",
          label: "Adapter state ledger",
          nextStep: "Refresh adapter state ledger in Settings",
          status: "blocked",
          value: latestLedger?.label ?? "No adapter state"
        }),
    latestCertification?.status === "passed"
      ? preLiveStep({
          detail: `${latestCertification.checkSummary} · ${latestCertification.boundary}`,
          evidenceId: latestCertification.auditEventId,
          evidenceTimestamp: latestCertification.timestamp,
          id: "adapter-certification",
          label: "Adapter certification",
          nextStep: "Validate local secret-store manifest",
          status: "passed",
          value: latestCertification.statusLabel
        })
      : preLiveStep({
          detail: latestCertification
            ? `${latestCertification.checkSummary} · ${latestCertification.boundary}`
            : `No live adapter certification evidence is bound for ${adapterId}.`,
          evidenceId: latestCertification?.auditEventId ?? null,
          evidenceTimestamp: latestCertification?.timestamp ?? null,
          id: "adapter-certification",
          label: "Adapter certification",
          nextStep: "Record adapter certification evidence",
          status: latestCertification?.status === "review" ? "review" : "blocked",
          value: latestCertification?.statusLabel ?? "No certification"
        }),
    latestSecretManifestValidation?.status === "validated"
      ? preLiveStep({
          detail: `${latestSecretManifestValidation.envCoverageSummary} · ${latestSecretManifestValidation.boundary}`,
          evidenceId: latestSecretManifestValidation.auditEventId,
          evidenceTimestamp: latestSecretManifestValidation.timestamp,
          id: "secret-manifest",
          label: "Secret manifest validation",
          nextStep: "Record runtime reload final acceptance",
          status: "passed",
          value: latestSecretManifestValidation.statusLabel
        })
      : preLiveStep({
          detail: latestSecretManifestValidation
            ? `${latestSecretManifestValidation.envCoverageSummary} · ${latestSecretManifestValidation.boundary}`
            : "No validated local secret-store manifest is bound.",
          evidenceId: latestSecretManifestValidation?.auditEventId ?? null,
          evidenceTimestamp: latestSecretManifestValidation?.timestamp ?? null,
          id: "secret-manifest",
          label: "Secret manifest validation",
          nextStep: "Validate local secret-store manifest",
          status: "blocked",
          value: latestSecretManifestValidation?.statusLabel ?? "No manifest validation"
        }),
    latestRuntimeReloadAcceptance?.status === "acceptance_recorded"
      ? preLiveStep({
          detail: `${latestRuntimeReloadAcceptance.confirmationSummary} · ${latestRuntimeReloadAcceptance.boundary}`,
          evidenceId: latestRuntimeReloadAcceptance.auditEventId,
          evidenceTimestamp: latestRuntimeReloadAcceptance.timestamp,
          id: "runtime-acceptance",
          label: "Runtime reload acceptance",
          nextStep: "Record final human confirmation",
          status: "passed",
          value: latestRuntimeReloadAcceptance.statusLabel
        })
      : preLiveStep({
          detail: latestRuntimeReloadAcceptance
            ? `${latestRuntimeReloadAcceptance.confirmationSummary} · ${latestRuntimeReloadAcceptance.boundary}`
            : "Runtime reload final acceptance has not been recorded.",
          evidenceId: latestRuntimeReloadAcceptance?.auditEventId ?? null,
          evidenceTimestamp: latestRuntimeReloadAcceptance?.timestamp ?? null,
          id: "runtime-acceptance",
          label: "Runtime reload acceptance",
          nextStep: "Record runtime reload final acceptance",
          status: "blocked",
          value: latestRuntimeReloadAcceptance?.statusLabel ?? "No runtime acceptance"
        }),
    latestHumanConfirmation?.status === "confirmation_recorded"
      ? preLiveStep({
          detail: `${latestHumanConfirmation.confirmationSummary} · ${latestHumanConfirmation.boundary}`,
          evidenceId: latestHumanConfirmation.auditEventId,
          evidenceTimestamp: latestHumanConfirmation.timestamp,
          id: "human-confirmation",
          label: "Final human confirmation",
          nextStep: "Record production route review and read-only health probe",
          status: "passed",
          value: latestHumanConfirmation.statusLabel
        })
      : preLiveStep({
          detail: latestHumanConfirmation
            ? `${latestHumanConfirmation.confirmationSummary} · ${latestHumanConfirmation.boundary}`
            : "Final human confirmation has not been recorded.",
          evidenceId: latestHumanConfirmation?.auditEventId ?? null,
          evidenceTimestamp: latestHumanConfirmation?.timestamp ?? null,
          id: "human-confirmation",
          label: "Final human confirmation",
          nextStep: "Record final human confirmation",
          status: "blocked",
          value: latestHumanConfirmation?.statusLabel ?? "No human confirmation"
        }),
    preLiveRouteReviewHealthStep(latestProductionRouteReview, latestHealthProbe),
    preLivePaperRehearsalStep({
      latestOpsState,
      latestPaperExecution,
      latestPaperOrderLifecycle,
      latestPaperRouteRunbook,
      latestSandboxOrderSchemaDryRun
    })
  ];
  const completedSteps = rows.filter((row) => row.status === "passed").length;
  const next = rows.find((row) => row.status !== "passed") ?? null;
  const status: ExecutionAdapterPreLiveRunbookStatus =
    completedSteps === rows.length ? "paper_rehearsal_ready" : next?.status === "review" ? "in_progress" : "blocked";
  return {
    adapterId,
    boundary: "Paper-only rehearsal · live routing remains blocked",
    completedSteps,
    headline:
      status === "paper_rehearsal_ready"
        ? "Paper rehearsal complete"
        : status === "in_progress"
          ? "Pre-live runbook in progress"
          : "Pre-live runbook blocked",
    market,
    nextStep: next?.nextStep ?? "Review paper rehearsal evidence before any separate live-route enablement",
    nextStepId: next?.id ?? null,
    rows,
    status,
    summary:
      status === "paper_rehearsal_ready"
        ? `${adapterId} has a complete paper-only pre-live rehearsal chain. Live routing is still blocked.`
        : `${adapterId} has ${completedSteps}/${rows.length} pre-live runbook gates complete.`,
    totalSteps: rows.length
  };
}

export interface ExecutionAdapterPreLiveRunbookMarkdownOptions {
  generatedAt?: string | null;
}

export function buildExecutionAdapterPreLiveRunbookMarkdown(
  runbook: ExecutionAdapterPreLiveRunbookSummary,
  options: ExecutionAdapterPreLiveRunbookMarkdownOptions = {}
): string {
  const generatedAt = options.generatedAt?.trim() || new Date().toISOString();
  const gateRows = runbook.rows.map((row) => [
    row.label,
    row.status,
    row.value,
    row.evidenceId ?? "not recorded",
    row.nextStep
  ]);
  const detailRows = runbook.rows.flatMap((row) => [
    `### ${row.label}`,
    "",
    `- Status: ${row.status}`,
    `- Value: ${row.value}`,
    `- Evidence: ${row.evidenceId ?? "not recorded"}`,
    `- Evidence timestamp: ${row.evidenceTimestamp ?? "not recorded"}`,
    `- Detail: ${row.detail}`,
    `- Next step: ${row.nextStep}`,
    ""
  ]);

  return [
    "# AIQuant Pre-live Runbook",
    "",
    `- Generated at: ${generatedAt}`,
    `- Adapter: \`${runbook.adapterId}\``,
    `- Market: \`${runbook.market}\``,
    `- Status: \`${runbook.status}\``,
    `- Completed gates: ${runbook.completedSteps}/${runbook.totalSteps}`,
    `- Next step: ${runbook.nextStep}`,
    `- Boundary: ${runbook.boundary}`,
    "",
    "## Summary",
    "",
    runbook.headline,
    "",
    runbook.summary,
    "",
    "## Gate Evidence",
    "",
    markdownTable(["Gate", "Status", "Value", "Evidence", "Next step"], gateRows),
    "",
    "## Details",
    "",
    ...detailRows,
    "This runbook is audit evidence only. It does not authorize live trading, submit orders, or provide investment advice."
  ].join("\n").trimEnd();
}

export function preLiveRouteReviewHealthStep(
  latestProductionRouteReview:
    | Pick<
        ExecutionAdapterProductionRouteReviewRow,
        "auditEventId" | "boundary" | "confirmationSummary" | "id" | "status" | "statusLabel" | "timestamp"
      >
    | null,
  latestHealthProbe:
    | Pick<ExecutionAdapterHealthProbeRow, "boundary" | "checkSummary" | "id" | "status" | "statusLabel" | "timestamp">
    | null
): ExecutionAdapterPreLiveRunbookStep {
  if (!latestProductionRouteReview || latestProductionRouteReview.status !== "route_review_recorded") {
    return preLiveStep({
      detail: latestProductionRouteReview
        ? `${latestProductionRouteReview.confirmationSummary} · ${latestProductionRouteReview.boundary}`
        : "Production route review has not been recorded.",
      evidenceId: latestProductionRouteReview?.auditEventId ?? null,
      evidenceTimestamp: latestProductionRouteReview?.timestamp ?? null,
      id: "route-review-health",
      label: "Route review and read-only health",
      nextStep: "Record production route review",
      status: "blocked",
      value: latestProductionRouteReview?.statusLabel ?? "No route review"
    });
  }
  if (!latestHealthProbe) {
    return preLiveStep({
      detail: `${latestProductionRouteReview.statusLabel} · ${latestProductionRouteReview.boundary}`,
      evidenceId: latestProductionRouteReview.auditEventId,
      evidenceTimestamp: latestProductionRouteReview.timestamp,
      id: "route-review-health",
      label: "Route review and read-only health",
      nextStep: "Run read-only adapter health probe",
      status: "review",
      value: "Route review recorded · health probe missing"
    });
  }
  const status: ExecutionAdapterPreLiveRunbookStepStatus = latestHealthProbe.status === "ready" ? "passed" : "review";
  return preLiveStep({
    detail: `${latestProductionRouteReview.statusLabel} · ${latestHealthProbe.statusLabel} · ${latestHealthProbe.boundary}`,
    evidenceId: latestProductionRouteReview.auditEventId,
    evidenceTimestamp:
      latestHealthProbe.timestamp > latestProductionRouteReview.timestamp
        ? latestHealthProbe.timestamp
        : latestProductionRouteReview.timestamp,
    id: "route-review-health",
    label: "Route review and read-only health",
    nextStep: status === "passed" ? "Record sandbox order schema dry-run" : "Resolve read-only health probe review items",
    status,
    value: status === "passed" ? "Route review + health ready" : latestHealthProbe.statusLabel
  });
}

export function preLivePaperRehearsalStep({
  latestOpsState,
  latestPaperExecution,
  latestPaperOrderLifecycle,
  latestPaperRouteRunbook,
  latestSandboxOrderSchemaDryRun
}: {
  latestOpsState:
    | Pick<ExecutionAdapterOpsStateRow, "auditEventId" | "boundary" | "id" | "opsStepSummary" | "status" | "statusLabel" | "timestamp">
    | null;
  latestPaperExecution:
    | Pick<
        ExecutionAdapterPaperExecutionRow,
        | "auditEventId"
        | "boundary"
        | "fillSummary"
        | "id"
        | "liveOrderSubmitted"
        | "orderSubmitted"
        | "paperFillRecorded"
        | "routeExecuted"
        | "status"
        | "statusLabel"
        | "timestamp"
      >
    | null;
  latestPaperOrderLifecycle:
    | Pick<
        ExecutionAdapterPaperOrderLifecycleRow,
        "auditEventId" | "boundary" | "id" | "lifecycleStepSummary" | "liveOrderSubmitted" | "status" | "statusLabel" | "timestamp"
      >
    | null;
  latestPaperRouteRunbook:
    | Pick<
        ExecutionAdapterPaperRouteRunbookRow,
        "auditEventId" | "boundary" | "id" | "routeExecuted" | "runbookStepSummary" | "status" | "statusLabel" | "timestamp"
      >
    | null;
  latestSandboxOrderSchemaDryRun:
    | Pick<
        ExecutionAdapterSandboxOrderSchemaDryRunRow,
        "auditEventId" | "boundary" | "id" | "orderIntentSummary" | "orderSubmitted" | "status" | "statusLabel" | "timestamp"
      >
    | null;
}): ExecutionAdapterPreLiveRunbookStep {
  if (
    latestPaperExecution?.status === "paper_execution_recorded" &&
    latestPaperExecution.paperFillRecorded &&
    !latestPaperExecution.orderSubmitted &&
    !latestPaperExecution.liveOrderSubmitted &&
    !latestPaperExecution.routeExecuted
  ) {
    return preLiveStep({
      detail: `${latestPaperExecution.fillSummary} · ${latestPaperExecution.boundary}`,
      evidenceId: latestPaperExecution.auditEventId,
      evidenceTimestamp: latestPaperExecution.timestamp,
      id: "paper-rehearsal",
      label: "Paper route rehearsal",
      nextStep: "Review paper rehearsal evidence before any separate live-route enablement",
      status: "passed",
      value: latestPaperExecution.statusLabel
    });
  }
  if (latestPaperExecution) {
    return preLiveStep({
      detail: `${latestPaperExecution.fillSummary} · ${latestPaperExecution.boundary}`,
      evidenceId: latestPaperExecution.auditEventId,
      evidenceTimestamp: latestPaperExecution.timestamp,
      id: "paper-rehearsal",
      label: "Paper route rehearsal",
      nextStep: "Regenerate adapter paper execution without order submission or route execution",
      status: "blocked",
      value: latestPaperExecution.statusLabel
    });
  }
  if (latestOpsState?.status === "ops_state_recorded") {
    return preLiveStep({
      detail: `${latestOpsState.opsStepSummary} · ${latestOpsState.boundary}`,
      evidenceId: latestOpsState.auditEventId,
      evidenceTimestamp: latestOpsState.timestamp,
      id: "paper-rehearsal",
      label: "Paper route rehearsal",
      nextStep: "Record adapter paper execution",
      status: "review",
      value: latestOpsState.statusLabel
    });
  }
  if (latestPaperRouteRunbook?.status === "runbook_recorded" && !latestPaperRouteRunbook.routeExecuted) {
    return preLiveStep({
      detail: `${latestPaperRouteRunbook.runbookStepSummary} · ${latestPaperRouteRunbook.boundary}`,
      evidenceId: latestPaperRouteRunbook.auditEventId,
      evidenceTimestamp: latestPaperRouteRunbook.timestamp,
      id: "paper-rehearsal",
      label: "Paper route rehearsal",
      nextStep: "Record adapter ops state",
      status: "review",
      value: latestPaperRouteRunbook.statusLabel
    });
  }
  if (latestPaperOrderLifecycle?.status === "lifecycle_recorded" && !latestPaperOrderLifecycle.liveOrderSubmitted) {
    return preLiveStep({
      detail: `${latestPaperOrderLifecycle.lifecycleStepSummary} · ${latestPaperOrderLifecycle.boundary}`,
      evidenceId: latestPaperOrderLifecycle.auditEventId,
      evidenceTimestamp: latestPaperOrderLifecycle.timestamp,
      id: "paper-rehearsal",
      label: "Paper route rehearsal",
      nextStep: "Record paper route runbook",
      status: "blocked",
      value: latestPaperOrderLifecycle.statusLabel
    });
  }
  if (latestSandboxOrderSchemaDryRun?.status === "schema_dry_run_recorded" && !latestSandboxOrderSchemaDryRun.orderSubmitted) {
    return preLiveStep({
      detail: `${latestSandboxOrderSchemaDryRun.orderIntentSummary} · ${latestSandboxOrderSchemaDryRun.boundary}`,
      evidenceId: latestSandboxOrderSchemaDryRun.auditEventId,
      evidenceTimestamp: latestSandboxOrderSchemaDryRun.timestamp,
      id: "paper-rehearsal",
      label: "Paper route rehearsal",
      nextStep: "Record paper order lifecycle",
      status: "blocked",
      value: latestSandboxOrderSchemaDryRun.statusLabel
    });
  }
  return preLiveStep({
    detail: "No sandbox order schema dry-run is bound to the paper rehearsal chain.",
    evidenceId: null,
    evidenceTimestamp: null,
    id: "paper-rehearsal",
    label: "Paper route rehearsal",
    nextStep: "Record sandbox order schema dry-run",
    status: "blocked",
    value: "No paper rehearsal evidence"
  });
}

export function preLiveStep({
  detail,
  evidenceId,
  evidenceTimestamp,
  id,
  label,
  nextStep,
  status,
  value
}: Omit<ExecutionAdapterPreLiveRunbookStep, "tone">): ExecutionAdapterPreLiveRunbookStep {
  return {
    detail,
    evidenceId,
    evidenceTimestamp,
    id,
    label,
    nextStep,
    status,
    tone: status === "passed" ? "positive" : status === "review" ? "warning" : "risk",
    value
  };
}

export function latestPreLiveScopedRow<
  T extends {
    adapterId: string;
    id: string;
    market: Market | "multi";
    route: "paper" | "live";
    timestamp: string;
  }
>(workspace: TerminalWorkspace, rows: ReadonlyArray<T>, adapterId?: string): T | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          (!adapterId || row.adapterId === adapterId)
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPreLiveHealthProbeRow<
  T extends {
    adapterId: string;
    id: string;
    timestamp: string;
  }
>(rows: ReadonlyArray<T>, adapterId: string): T | null {
  return (
    rows
      .filter((row) => row.adapterId === adapterId)
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function createDefaultExecutionAdapterCertificationApplyConfirmations(): ExecutionAdapterCertificationApplyConfirmations {
  return {
    secretReferenceStored: false,
    controlledRestartWindowApproved: false,
    operatorReviewedCertification: false
  };
}

export function buildExecutionAdapterCertificationApplyConfirmationRows(
  confirmations: Partial<ExecutionAdapterCertificationApplyConfirmations> | null | undefined = {}
): ExecutionAdapterCertificationApplyConfirmationRow[] {
  const values = {
    ...createDefaultExecutionAdapterCertificationApplyConfirmations(),
    ...(confirmations ?? {})
  };
  return [
    {
      id: "secret-reference-stored",
      key: "secretReferenceStored",
      label: "Secret-store reference saved",
      detail: "Confirm the real credential reference is stored outside this UI.",
      checked: values.secretReferenceStored,
      tone: values.secretReferenceStored ? "positive" : "neutral"
    },
    {
      id: "controlled-restart-window-approved",
      key: "controlledRestartWindowApproved",
      label: "Controlled restart window approved",
      detail: "Confirm an operator-approved restart window exists before applying.",
      checked: values.controlledRestartWindowApproved,
      tone: values.controlledRestartWindowApproved ? "positive" : "neutral"
    },
    {
      id: "operator-reviewed-certification",
      key: "operatorReviewedCertification",
      label: "Operator reviewed certification",
      detail: "Confirm the certification evidence and restart impact were reviewed.",
      checked: values.operatorReviewedCertification,
      tone: values.operatorReviewedCertification ? "positive" : "neutral"
    }
  ];
}

export function latestPromotionCertificationRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterCertificationRow[]
): ExecutionAdapterCertificationRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local"
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionCertificationApplyRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterCertificationApplyRow[],
  latestCertification: ExecutionAdapterCertificationRow | null
): ExecutionAdapterCertificationApplyRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestCertification ||
            (row.adapterId === latestCertification.adapterId && row.certificationId === latestCertification.id))
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionControlledRestartEvidenceRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterControlledRestartEvidenceRow[],
  latestCertification: ExecutionAdapterCertificationRow | null,
  latestApply: ExecutionAdapterCertificationApplyRow | null
): ExecutionAdapterControlledRestartEvidenceRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestCertification ||
            (row.adapterId === latestCertification.adapterId && row.certificationId === latestCertification.id)) &&
          (!latestApply || row.applyId === latestApply.id)
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionRestartAcceptanceRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterRestartAcceptanceRow[],
  latestCertification: ExecutionAdapterCertificationRow | null,
  latestApply: ExecutionAdapterCertificationApplyRow | null,
  latestRestartEvidence: ExecutionAdapterControlledRestartEvidenceRow | null
): ExecutionAdapterRestartAcceptanceRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestCertification ||
            (row.adapterId === latestCertification.adapterId && row.certificationId === latestCertification.id)) &&
          (!latestApply || row.applyId === latestApply.id) &&
          (!latestRestartEvidence || row.evidenceId === latestRestartEvidence.id)
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionSecretReferenceRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterSecretReferenceRow[]
): ExecutionAdapterSecretReferenceRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local"
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionSecretMaterializationRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterSecretMaterializationRow[],
  latestSecretReference: ExecutionAdapterSecretReferenceRow | null
): ExecutionAdapterSecretMaterializationRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestSecretReference ||
            (row.adapterId === latestSecretReference.adapterId && row.referenceId === latestSecretReference.id))
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionEnvironmentBindingRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterEnvironmentBindingRow[],
  latestSecretMaterialization: ExecutionAdapterSecretMaterializationRow | null
): ExecutionAdapterEnvironmentBindingRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestSecretMaterialization ||
            (row.adapterId === latestSecretMaterialization.adapterId &&
              row.materializationId === latestSecretMaterialization.id))
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionRuntimeReloadPlanRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterRuntimeReloadPlanRow[],
  latestSecretMaterialization: ExecutionAdapterSecretMaterializationRow | null,
  latestEnvironmentBinding: ExecutionAdapterEnvironmentBindingRow | null
): ExecutionAdapterRuntimeReloadPlanRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestSecretMaterialization ||
            (row.adapterId === latestSecretMaterialization.adapterId &&
              row.materializationId === latestSecretMaterialization.id)) &&
          (!latestEnvironmentBinding ||
            (row.adapterId === latestEnvironmentBinding.adapterId && row.bindingId === latestEnvironmentBinding.id))
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}

export function latestPromotionRuntimeReloadExecutionRow(
  workspace: TerminalWorkspace,
  rows: ExecutionAdapterRuntimeReloadExecutionRow[],
  latestSecretMaterialization: ExecutionAdapterSecretMaterializationRow | null,
  latestEnvironmentBinding: ExecutionAdapterEnvironmentBindingRow | null,
  latestRuntimeReloadPlan: ExecutionAdapterRuntimeReloadPlanRow | null
): ExecutionAdapterRuntimeReloadExecutionRow | null {
  return (
    rows
      .filter(
        (row) =>
          row.route === "live" &&
          (row.market === workspace.selectedInstrument.market || row.market === "multi") &&
          row.adapterId !== "paper-local" &&
          (!latestSecretMaterialization ||
            (row.adapterId === latestSecretMaterialization.adapterId &&
              row.materializationId === latestSecretMaterialization.id)) &&
          (!latestEnvironmentBinding ||
            (row.adapterId === latestEnvironmentBinding.adapterId && row.bindingId === latestEnvironmentBinding.id)) &&
          (!latestRuntimeReloadPlan ||
            (row.adapterId === latestRuntimeReloadPlan.adapterId && row.planId === latestRuntimeReloadPlan.id))
      )
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id.localeCompare(left.id))[0] ?? null
  );
}
