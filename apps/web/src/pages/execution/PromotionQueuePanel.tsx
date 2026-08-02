import { Panel } from "../../components/AppPanel";
import type { AppI18n } from "../../lib/i18n";
import type {
  ExecutionAdapterCertificationApplyRow,
  ExecutionAdapterCertificationRow,
  ExecutionAdapterControlledRestartEvidenceRow,
  ExecutionAdapterEnvironmentBindingRow,
  ExecutionAdapterHumanConfirmationRow,
  ExecutionAdapterOpsStateRow,
  ExecutionAdapterOrchestrationDryRunRow,
  ExecutionAdapterOrchestrationExecutionRow,
  ExecutionAdapterPaperExecutionRow,
  ExecutionAdapterPaperOrderLifecycleRow,
  ExecutionAdapterPaperRouteRunbookRow,
  ExecutionAdapterProductionRouteReviewRow,
  ExecutionAdapterRestartAcceptanceRow,
  ExecutionAdapterRuntimeReloadAcceptanceRow,
  ExecutionAdapterRuntimeReloadExecutionRow,
  ExecutionAdapterRuntimeReloadPlanRow,
  ExecutionAdapterSandboxOrderSchemaDryRunRow,
  ExecutionAdapterSandboxProbeExecutionRow,
  ExecutionAdapterSandboxProbePlanRow,
  ExecutionAdapterSandboxProbeReviewRow,
  ExecutionAdapterSecretManifestValidationRow,
  ExecutionAdapterSecretMaterializationRow,
  ExecutionAdapterSecretReferenceRow,
  PreLiveReadinessChecklist,
  PromotionQueueStage,
  PromotionReadiness,
} from "../../lib/terminal-workbench";
import {
  adapterCertificationBoundaryLabel,
  adapterCertificationAdapterName,
  adapterCertificationApplyBlockerSummary,
  adapterCertificationApplyConfirmationSummary,
  adapterCertificationApplyModeLabel,
  adapterCertificationApplyStatusLabel,
  adapterCertificationCheckSummary,
  adapterCertificationStatusLabel,
  adapterControlledRestartEvidenceConfirmationSummary,
  adapterControlledRestartEvidenceStatusLabel,
  adapterEnvironmentBindingConfirmationSummary,
  adapterEnvironmentBindingStatusLabel,
  adapterHumanConfirmationConfirmationSummary,
  adapterHumanConfirmationStatusLabel,
  adapterOpsStateBoundaryLabel,
  adapterOpsStateConfirmationSummary,
  adapterOpsStateStatusLabel,
  adapterOrchestrationDryRunConfirmationSummary,
  adapterOrchestrationDryRunStatusLabel,
  adapterOrchestrationExecutionConfirmationSummary,
  adapterOrchestrationExecutionStatusLabel,
  adapterPaperExecutionBoundaryLabel,
  adapterPaperExecutionConfirmationSummary,
  adapterPaperExecutionStatusLabel,
  adapterPaperOrderLifecycleBoundaryLabel,
  adapterPaperOrderLifecycleConfirmationSummary,
  adapterPaperOrderLifecycleStatusLabel,
  adapterPaperRouteRunbookBoundaryLabel,
  adapterPaperRouteRunbookConfirmationSummary,
  adapterPaperRouteRunbookStatusLabel,
  adapterProductionRouteReviewConfirmationSummary,
  adapterProductionRouteReviewStatusLabel,
  adapterRestartAcceptanceConfirmationSummary,
  adapterRestartAcceptanceStatusLabel,
  adapterRuntimeReloadAcceptanceConfirmationSummary,
  adapterRuntimeReloadAcceptanceStatusLabel,
  adapterRuntimeReloadExecutionConfirmationSummary,
  adapterRuntimeReloadExecutionStatusLabel,
  adapterRuntimeReloadPlanConfirmationSummary,
  adapterRuntimeReloadPlanStatusLabel,
  adapterSandboxOrderSchemaDryRunBoundaryLabel,
  adapterSandboxOrderSchemaDryRunConfirmationSummary,
  adapterSandboxOrderSchemaDryRunStatusLabel,
  adapterSandboxProbeExecutionConfirmationSummary,
  adapterSandboxProbeExecutionStatusLabel,
  adapterSandboxProbePlanConfirmationSummary,
  adapterSandboxProbePlanStatusLabel,
  adapterSandboxProbeReviewConfirmationSummary,
  adapterSandboxProbeReviewStatusLabel,
  adapterSecretManifestValidationCoverageSummary,
  adapterSecretManifestValidationStatusLabel,
  adapterSecretMaterializationConfirmationSummary,
  adapterSecretMaterializationStatusLabel,
  adapterSecretReferenceConfirmationSummary,
  adapterSecretReferenceStatusLabel,
} from "./AdapterFormatters";

export function PromotionQueuePanel({
  adapterCertificationApplyRows,
  adapterControlledRestartEvidenceRows,
  adapterEnvironmentBindingRows,
  adapterHumanConfirmationRows,
  adapterOrchestrationDryRunRows,
  adapterOrchestrationExecutionRows,
  adapterRestartAcceptanceRows,
  adapterRuntimeReloadAcceptanceRows,
  adapterRuntimeReloadExecutionRows,
  adapterRuntimeReloadPlanRows,
  adapterSandboxProbeExecutionRows,
  adapterSandboxProbePlanRows,
  adapterSandboxProbeReviewRows,
  adapterProductionRouteReviewRows,
  adapterSandboxOrderSchemaDryRunRows,
  adapterPaperOrderLifecycleRows,
  adapterPaperRouteRunbookRows,
  adapterOpsStateRows,
  adapterPaperExecutionRows,
  adapterSecretManifestValidationRows,
  adapterSecretMaterializationRows,
  adapterSecretReferenceRows,
  adapterCertificationRows,
  className,
  i18n,
  preLiveChecklist,
  readiness
}: {
  adapterCertificationApplyRows: ExecutionAdapterCertificationApplyRow[];
  adapterControlledRestartEvidenceRows: ExecutionAdapterControlledRestartEvidenceRow[];
  adapterEnvironmentBindingRows: ExecutionAdapterEnvironmentBindingRow[];
  adapterHumanConfirmationRows: ExecutionAdapterHumanConfirmationRow[];
  adapterOrchestrationDryRunRows: ExecutionAdapterOrchestrationDryRunRow[];
  adapterOrchestrationExecutionRows: ExecutionAdapterOrchestrationExecutionRow[];
  adapterRestartAcceptanceRows: ExecutionAdapterRestartAcceptanceRow[];
  adapterRuntimeReloadAcceptanceRows: ExecutionAdapterRuntimeReloadAcceptanceRow[];
  adapterRuntimeReloadExecutionRows: ExecutionAdapterRuntimeReloadExecutionRow[];
  adapterRuntimeReloadPlanRows: ExecutionAdapterRuntimeReloadPlanRow[];
  adapterSandboxProbeExecutionRows: ExecutionAdapterSandboxProbeExecutionRow[];
  adapterSandboxProbePlanRows: ExecutionAdapterSandboxProbePlanRow[];
  adapterSandboxProbeReviewRows: ExecutionAdapterSandboxProbeReviewRow[];
  adapterProductionRouteReviewRows: ExecutionAdapterProductionRouteReviewRow[];
  adapterSandboxOrderSchemaDryRunRows: ExecutionAdapterSandboxOrderSchemaDryRunRow[];
  adapterPaperOrderLifecycleRows: ExecutionAdapterPaperOrderLifecycleRow[];
  adapterPaperRouteRunbookRows: ExecutionAdapterPaperRouteRunbookRow[];
  adapterOpsStateRows: ExecutionAdapterOpsStateRow[];
  adapterPaperExecutionRows: ExecutionAdapterPaperExecutionRow[];
  adapterSecretManifestValidationRows: ExecutionAdapterSecretManifestValidationRow[];
  adapterSecretMaterializationRows: ExecutionAdapterSecretMaterializationRow[];
  adapterSecretReferenceRows: ExecutionAdapterSecretReferenceRow[];
  adapterCertificationRows: ExecutionAdapterCertificationRow[];
  className?: string;
  i18n: AppI18n;
  preLiveChecklist: PreLiveReadinessChecklist;
  readiness: PromotionReadiness;
}) {
  const recentCertificationRows = adapterCertificationRows.slice(0, 3);
  const recentApplyRows = adapterCertificationApplyRows.slice(0, 3);
  const recentRestartEvidenceRows = adapterControlledRestartEvidenceRows.slice(0, 3);
  const recentRestartAcceptanceRows = adapterRestartAcceptanceRows.slice(0, 3);
  const recentEnvironmentBindingRows = adapterEnvironmentBindingRows.slice(0, 3);
  const recentRuntimeReloadPlanRows = adapterRuntimeReloadPlanRows.slice(0, 3);
  const recentRuntimeReloadExecutionRows = adapterRuntimeReloadExecutionRows.slice(0, 3);
  const recentRuntimeReloadAcceptanceRows = adapterRuntimeReloadAcceptanceRows.slice(0, 3);
  const recentOrchestrationDryRunRows = adapterOrchestrationDryRunRows.slice(0, 3);
  const recentOrchestrationExecutionRows = adapterOrchestrationExecutionRows.slice(0, 3);
  const recentHumanConfirmationRows = adapterHumanConfirmationRows.slice(0, 3);
  const recentSandboxProbePlanRows = adapterSandboxProbePlanRows.slice(0, 3);
  const recentSandboxProbeExecutionRows = adapterSandboxProbeExecutionRows.slice(0, 3);
  const recentSandboxProbeReviewRows = adapterSandboxProbeReviewRows.slice(0, 3);
  const recentProductionRouteReviewRows = adapterProductionRouteReviewRows.slice(0, 3);
  const recentSandboxOrderSchemaDryRunRows = adapterSandboxOrderSchemaDryRunRows.slice(0, 3);
  const recentPaperOrderLifecycleRows = adapterPaperOrderLifecycleRows.slice(0, 3);
  const recentPaperRouteRunbookRows = adapterPaperRouteRunbookRows.slice(0, 3);
  const recentAdapterOpsStateRows = adapterOpsStateRows.slice(0, 3);
  const recentAdapterPaperExecutionRows = adapterPaperExecutionRows.slice(0, 3);
  const recentSecretReferenceRows = adapterSecretReferenceRows.slice(0, 3);
  const recentSecretMaterializationRows = adapterSecretMaterializationRows.slice(0, 3);
  const recentSecretManifestValidationRows = adapterSecretManifestValidationRows.slice(0, 3);
  return (
    <Panel
      title={i18n.locale === "zh-CN" ? "晋级队列" : "Promotion Queue"}
      subtitle={i18n.locale === "zh-CN" ? "模拟盘到实盘准备" : "Paper to live readiness"}
      className={className}
    >
      <div className={`promotion-queue ${readiness.status}`}>
        <div className="promotion-summary">
          <span>{promotionStatusLabel(i18n, readiness.status)}</span>
          <strong>{promotionHeadline(i18n, readiness.headline)}</strong>
          <p>{promotionSummaryText(i18n, readiness.summary)}</p>
        </div>
        <div className={`pre-live-checklist ${preLiveChecklist.tone}`}>
          <div className="pre-live-checklist-summary">
            <span>{preLiveChecklistStatusLabel(i18n, preLiveChecklist.status)}</span>
            <strong>{preLiveChecklistHeadline(i18n, preLiveChecklist.headline)}</strong>
            <p>{preLiveChecklistSummary(i18n, preLiveChecklist.summary)}</p>
          </div>
          <em className="pre-live-checklist-count">
            {preLiveChecklist.passedCount}/{preLiveChecklist.totalCount}
          </em>
          <div className="pre-live-checklist-row-list">
            {preLiveChecklist.items.map((item) => (
              <article className={`pre-live-checklist-row ${item.tone}`} key={item.id}>
                <span>{preLiveChecklistItemLabel(i18n, item)}</span>
                <strong>{preLiveChecklistItemEvidence(i18n, item.evidence)}</strong>
                <em>{promotionStageStatusLabel(i18n, item.state)}</em>
                <p>{preLiveChecklistItemDetail(i18n, item.detail)}</p>
              </article>
            ))}
          </div>
          <small>{preLiveChecklistBoundary(i18n, preLiveChecklist)}</small>
        </div>
        <div className="promotion-stage-list">
          {readiness.stages.map((stage) => (
            <article className={`promotion-stage ${stage.tone}`} key={stage.id}>
              <span>{promotionStageLabel(i18n, stage)}</span>
              <strong>{promotionStageValue(i18n, stage.value)}</strong>
              <em>{promotionStageStatusLabel(i18n, stage.status)}</em>
              <p>{promotionStageDetail(i18n, stage.detail)}</p>
            </article>
          ))}
        </div>
        {recentCertificationRows.length ? (
          <div className="promotion-certification-evidence">
            <span>
              {i18n.locale === "zh-CN" ? "最近适配器认证证据" : "Recent adapter certification evidence"}
            </span>
            {recentCertificationRows.map((row) => (
              <article className={`promotion-certification-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterCertificationStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{promotionCertificationBoundaryLabel(i18n, row.boundary)}</p>
                <em>
                  {adapterCertificationCheckSummary(i18n, row.checkSummary)} · {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentSecretReferenceRows.length ? (
          <div className="promotion-secret-reference-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近密钥引用证据" : "Recent secret reference evidence"}</span>
            {recentSecretReferenceRows.map((row) => (
              <article className={`promotion-secret-reference-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterSecretReferenceStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterSecretReferenceConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} · {row.backend} ·{" "}
                  {row.envVarSummary} · {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentSecretMaterializationRows.length ? (
          <div className="promotion-secret-materialization-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近密钥物化证据" : "Recent secret materialization evidence"}</span>
            {recentSecretMaterializationRows.map((row) => (
              <article className={`promotion-secret-materialization-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterSecretMaterializationStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterSecretMaterializationConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} · {row.backend} ·{" "}
                  {row.envVarSummary} · {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentSecretManifestValidationRows.length ? (
          <div className="promotion-secret-manifest-validation-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近密钥清单验证证据" : "Recent secret manifest validation evidence"}</span>
            {recentSecretManifestValidationRows.map((row) => (
              <article className={`promotion-secret-manifest-validation-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterSecretManifestValidationStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterSecretManifestValidationCoverageSummary(i18n, row.envCoverageSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} · {row.backend} ·{" "}
                  {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentEnvironmentBindingRows.length ? (
          <div className="promotion-environment-binding-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近环境绑定证据" : "Recent environment binding evidence"}</span>
            {recentEnvironmentBindingRows.map((row) => (
              <article className={`promotion-environment-binding-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterEnvironmentBindingStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterEnvironmentBindingConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.bindingMode)} · {row.envVarSummary} ·{" "}
                  {row.manifestValidationId ? `${row.manifestValidationId} · ` : ""}
                  {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentRuntimeReloadPlanRows.length ? (
          <div className="promotion-runtime-reload-plan-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近运行时重载计划" : "Recent runtime reload plan evidence"}</span>
            {recentRuntimeReloadPlanRows.map((row) => (
              <article className={`promotion-runtime-reload-plan-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterRuntimeReloadPlanStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterRuntimeReloadPlanConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.reloadMode)} · {row.maintenanceWindowId} ·{" "}
                  {row.manifestValidationId ? `${row.manifestValidationId} · ` : ""}
                  {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentRuntimeReloadExecutionRows.length ? (
          <div className="promotion-runtime-reload-execution-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近运行时重载执行证据" : "Recent runtime reload execution evidence"}</span>
            {recentRuntimeReloadExecutionRows.map((row) => (
              <article className={`promotion-runtime-reload-execution-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterRuntimeReloadExecutionStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterRuntimeReloadExecutionConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.executionMode)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.reloadMode)} · {row.maintenanceWindowId} ·{" "}
                  {row.manifestValidationId ? `${row.manifestValidationId} · ` : ""}
                  {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentRuntimeReloadAcceptanceRows.length ? (
          <div className="promotion-runtime-reload-acceptance-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近运行时重载最终验收" : "Recent runtime reload acceptance evidence"}</span>
            {recentRuntimeReloadAcceptanceRows.map((row) => (
              <article className={`promotion-runtime-reload-acceptance-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterRuntimeReloadAcceptanceStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterRuntimeReloadAcceptanceConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.acceptanceMode)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.executionMode)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.reloadMode)} · {row.maintenanceWindowId} ·{" "}
                  {row.manifestValidationId ? `${row.manifestValidationId} · ` : ""}
                  {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentOrchestrationDryRunRows.length ? (
          <div className="promotion-orchestration-dry-run-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近适配器编排 dry-run" : "Recent adapter orchestration dry run"}</span>
            {recentOrchestrationDryRunRows.map((row) => (
              <article className={`promotion-orchestration-dry-run-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterOrchestrationDryRunStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterOrchestrationDryRunConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.orchestrationMode)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.acceptanceMode)} · {row.maintenanceWindowId} ·{" "}
                  {row.manifestValidationId ? `${row.manifestValidationId} · ` : ""}
                  {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        <div className="promotion-orchestration-execution-evidence">
          <span>{i18n.locale === "zh-CN" ? "最近受控编排执行证据" : "Recent controlled orchestration execution"}</span>
          {recentOrchestrationExecutionRows.length ? (
            recentOrchestrationExecutionRows.map((row) => (
              <article className={`promotion-orchestration-execution-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterOrchestrationExecutionStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterOrchestrationExecutionConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.orchestrationExecutionMode)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.orchestrationMode)} · {row.maintenanceWindowId} ·{" "}
                  {row.manifestValidationId ? `${row.manifestValidationId} · ` : ""}
                  {row.auditEventId}
                </em>
              </article>
            ))
          ) : (
            <p className="promotion-orchestration-execution-empty">
              {i18n.locale === "zh-CN"
                ? "等待受控编排执行证据。先在设置中完成适配器编排 dry-run，再记录不会连接券商或下单的受控执行证据。"
                : "Waiting for controlled orchestration execution evidence. Complete an adapter orchestration dry run in Settings, then record controlled evidence that does not connect to brokers or place orders."}
            </p>
          )}
        </div>
        <div className="promotion-human-confirmation-evidence">
          <span>{i18n.locale === "zh-CN" ? "最近最终人工确认" : "Recent final human confirmation"}</span>
          {recentHumanConfirmationRows.length ? (
            recentHumanConfirmationRows.map((row) => (
              <article className={`promotion-human-confirmation-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterHumanConfirmationStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterHumanConfirmationConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.confirmationMode)} ·{" "}
                  {row.manifestValidationId ? `${row.manifestValidationId} · ` : ""}
                  {row.auditEventId}
                </em>
              </article>
            ))
          ) : (
            <p className="promotion-human-confirmation-empty">
              {i18n.locale === "zh-CN"
                ? "等待最终人工确认。受控编排执行证据记录后，需要在设置中完成五项人工确认。"
                : "Waiting for final human confirmation. After controlled execution evidence is recorded, complete the five manual checks in Settings."}
            </p>
          )}
        </div>
        <div className="promotion-sandbox-probe-plan-evidence">
          <span>{i18n.locale === "zh-CN" ? "最近 sandbox 探针计划" : "Recent sandbox probe plan"}</span>
          {recentSandboxProbePlanRows.length ? (
            recentSandboxProbePlanRows.map((row) => (
              <article className={`promotion-sandbox-probe-plan-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterSandboxProbePlanStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterSandboxProbePlanConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.probeMode)} ·{" "}
                  {row.manifestValidationId ? `${row.manifestValidationId} · ` : ""}
                  {row.auditEventId}
                </em>
              </article>
            ))
          ) : (
            <p className="promotion-sandbox-probe-plan-empty">
              {i18n.locale === "zh-CN"
                ? "等待 sandbox/testnet 探针计划。最终人工确认后，先记录受控测试计划，仍不连接券商或提交订单。"
                : "Waiting for a sandbox/testnet probe plan. After final human confirmation, record the controlled test plan before any broker connection or order submission."}
            </p>
          )}
        </div>
        <div className="promotion-sandbox-probe-execution-evidence">
          <span>{i18n.locale === "zh-CN" ? "最近 sandbox 探针执行" : "Recent sandbox probe execution"}</span>
          {recentSandboxProbeExecutionRows.length ? (
            recentSandboxProbeExecutionRows.map((row) => (
              <article className={`promotion-sandbox-probe-execution-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterSandboxProbeExecutionStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterSandboxProbeExecutionConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.probeExecutionMode)} ·{" "}
                  {row.manifestValidationId ? `${row.manifestValidationId} · ` : ""}
                  {row.auditEventId}
                </em>
              </article>
            ))
          ) : (
            <p className="promotion-sandbox-probe-execution-empty">
              {i18n.locale === "zh-CN"
                ? "等待只读 sandbox/testnet 探针执行。计划记录后，只能记录握手和订单 schema 证据，不提交任何订单。"
                : "Waiting for read-only sandbox/testnet probe execution. After planning, record handshake and order-schema evidence only, with no order submission."}
            </p>
          )}
        </div>
        <div className="promotion-sandbox-probe-review-evidence">
          <span>{i18n.locale === "zh-CN" ? "最近 sandbox 探针复核" : "Recent sandbox probe review"}</span>
          {recentSandboxProbeReviewRows.length ? (
            recentSandboxProbeReviewRows.map((row) => (
              <article className={`promotion-sandbox-probe-review-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterSandboxProbeReviewStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterSandboxProbeReviewConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.reviewMode)} ·{" "}
                  {row.manifestValidationId ? `${row.manifestValidationId} · ` : ""}
                  {row.auditEventId}
                </em>
              </article>
            ))
          ) : (
            <p className="promotion-sandbox-probe-review-empty">
              {i18n.locale === "zh-CN"
                ? "等待 sandbox/testnet 探针复核。只读执行证据记录后，需要复核证据归档、schema 风险和生产路由阻断状态。"
              : "Waiting for sandbox/testnet probe review. After read-only execution evidence is recorded, review archived evidence, schema risk, and production-route blocking."}
            </p>
          )}
        </div>
        <div className="promotion-production-route-review-evidence">
          <span>{i18n.locale === "zh-CN" ? "最近生产路由策略复核" : "Recent production route review"}</span>
          {recentProductionRouteReviewRows.length ? (
            recentProductionRouteReviewRows.map((row) => (
              <article className={`promotion-production-route-review-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterProductionRouteReviewStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterProductionRouteReviewConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.reviewMode)} ·{" "}
                  {row.manifestValidationId ? `${row.manifestValidationId} · ` : ""}
                  {row.auditEventId}
                </em>
              </article>
            ))
          ) : (
            <p className="promotion-production-route-review-empty">
              {i18n.locale === "zh-CN"
                ? "等待生产路由策略复核。sandbox 探针复核后，需要复核急停、限额、路由禁用和回滚责任。"
              : "Waiting for production route policy review. After sandbox probe review, verify kill switch, limits, disabled routing, and rollback ownership."}
            </p>
          )}
        </div>
        {recentSandboxOrderSchemaDryRunRows.length ? (
          <div className="promotion-sandbox-order-schema-dry-run-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近订单 schema dry-run" : "Recent order schema dry-run"}</span>
            {recentSandboxOrderSchemaDryRunRows.map((row) => (
              <article className={`promotion-sandbox-order-schema-dry-run-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterSandboxOrderSchemaDryRunStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterSandboxOrderSchemaDryRunConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.dryRunMode)} · {row.orderIntentSummary} ·{" "}
                  {adapterSandboxOrderSchemaDryRunBoundaryLabel(i18n, row.boundary)} ·{" "}
                  {row.manifestValidationId ? `${row.manifestValidationId} · ` : ""}
                  {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentPaperOrderLifecycleRows.length ? (
          <div className="promotion-paper-order-lifecycle-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近 paper 订单 lifecycle" : "Recent paper order lifecycle"}</span>
            {recentPaperOrderLifecycleRows.map((row) => (
              <article className={`promotion-paper-order-lifecycle-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterPaperOrderLifecycleStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterPaperOrderLifecycleConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} · {row.lifecycleStepSummary} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.lifecycleMode)} · {row.orderIntentSummary} ·{" "}
                  {adapterPaperOrderLifecycleBoundaryLabel(i18n, row.boundary)} ·{" "}
                  {row.manifestValidationId ? `${row.manifestValidationId} · ` : ""}
                  {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentPaperRouteRunbookRows.length ? (
          <div className="promotion-paper-route-runbook-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近 paper 路由 runbook" : "Recent paper route runbook"}</span>
            {recentPaperRouteRunbookRows.map((row) => (
              <article className={`promotion-paper-route-runbook-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterPaperRouteRunbookStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterPaperRouteRunbookConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} · {row.runbookStepSummary} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.runbookMode)} · {row.orderIntentSummary} ·{" "}
                  {adapterPaperRouteRunbookBoundaryLabel(i18n, row.boundary)} ·{" "}
                  {row.manifestValidationId ? `${row.manifestValidationId} · ` : ""}
                  {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentAdapterOpsStateRows.length ? (
          <div className="promotion-adapter-ops-state-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近适配器 ops state" : "Recent adapter ops state"}</span>
            {recentAdapterOpsStateRows.map((row) => (
              <article className={`promotion-adapter-ops-state-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterOpsStateStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterOpsStateConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} · {row.opsStepSummary} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.opsMode)} · {row.orderIntentSummary} ·{" "}
                  {adapterOpsStateBoundaryLabel(i18n, row.boundary)} ·{" "}
                  {row.manifestValidationId ? `${row.manifestValidationId} · ` : ""}
                  {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentAdapterPaperExecutionRows.length ? (
          <div className="promotion-adapter-paper-execution-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近适配器模拟执行" : "Recent adapter paper execution"}</span>
            {recentAdapterPaperExecutionRows.map((row) => (
              <article className={`promotion-adapter-paper-execution-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterPaperExecutionStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterPaperExecutionConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} · {row.paperExecutionStepSummary} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.paperExecutionMode)} · {row.fillSummary} ·{" "}
                  {adapterPaperExecutionBoundaryLabel(i18n, row.boundary)} ·{" "}
                  {row.manifestValidationId ? `${row.manifestValidationId} · ` : ""}
                  {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentApplyRows.length ? (
          <div className="promotion-certification-apply-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近应用预检证据" : "Recent apply preflight evidence"}</span>
            {recentApplyRows.map((row) => (
              <article className={`promotion-certification-apply-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterCertificationApplyStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterCertificationApplyConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.applyMode)} · {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentRestartEvidenceRows.length ? (
          <div className="promotion-controlled-restart-evidence">
            <span>{i18n.locale === "zh-CN" ? "最近受控重启证据" : "Recent controlled restart evidence"}</span>
            {recentRestartEvidenceRows.map((row) => (
              <article className={`promotion-controlled-restart-evidence-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterControlledRestartEvidenceStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterControlledRestartEvidenceConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.evidenceMode)} · {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
        {recentRestartAcceptanceRows.length ? (
          <div className="promotion-restart-acceptance">
            <span>{i18n.locale === "zh-CN" ? "最近重启后验收证据" : "Recent restart acceptance evidence"}</span>
            {recentRestartAcceptanceRows.map((row) => (
              <article className={`promotion-restart-acceptance-row ${row.tone}`} key={row.id}>
                <strong>
                  {adapterCertificationAdapterName(i18n, row.adapterId)} ·{" "}
                  {adapterRestartAcceptanceStatusLabel(i18n, row.statusLabel)}
                </strong>
                <p>{adapterRestartAcceptanceConfirmationSummary(i18n, row.confirmationSummary)}</p>
                <em>
                  {adapterCertificationApplyBlockerSummary(i18n, row.blockerSummary)} ·{" "}
                  {adapterCertificationApplyModeLabel(i18n, row.acceptanceMode)} · {row.auditEventId}
                </em>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

function promotionStatusLabel(i18n: AppI18n, status: PromotionReadiness["status"]): string {
  if (i18n.locale === "en-US") {
    return status.replaceAll("_", " ");
  }
  return {
    blocked: "晋级阻断",
    paper_pending: "等待模拟成交",
    certification_pending: "等待认证",
    live_ready: "实盘准备就绪"
  }[status];
}

function promotionHeadline(i18n: AppI18n, headline: string): string {
  if (i18n.locale === "en-US") {
    return headline;
  }
  return {
    "Promotion queue blocked": "晋级队列阻断",
    "Paper execution required": "需要模拟执行",
    "Live promotion pending certification": "等待实盘认证",
    "Live promotion ready": "实盘晋级就绪"
  }[headline] ?? headline;
}

function promotionSummaryText(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  return summary
    .replace(
      "A strategy needs audited evidence and risk approval before it can enter execution promotion.",
      "策略需要先绑定审计证据并通过风控审批，才能进入执行晋级。"
    )
    .replace(
      "The audited run is risk-approved for paper trading, but no filled paper execution is bound yet.",
      "审计运行已通过模拟盘风控审批，但尚未绑定已成交模拟执行。"
    )
    .replace(
      "Paper execution has passed, but live routing stays blocked until adapter certification and human confirmation pass.",
      "模拟执行已经通过；实盘通道仍需适配器认证和人工确认。"
    )
    .replace(
      "Audited evidence, paper execution, certified adapter, and human confirmation are all bound.",
      "审计证据、模拟执行、认证适配器和人工确认均已绑定。"
    );
}

function promotionStageLabel(i18n: AppI18n, stage: PromotionQueueStage): string {
  if (i18n.locale === "en-US") {
    return stage.label;
  }
  return {
    "audited-run": "审计运行",
    "risk-approval": "风控审批",
    "paper-execution": "模拟执行",
    "adapter-certification": "适配器认证",
    "human-confirmation": "人工确认"
  }[stage.id];
}

function promotionStageValue(i18n: AppI18n, value: string): string {
  if (i18n.locale === "en-US") {
    return value;
  }
  const filledOrders = value.match(/^(\d+) filled orders?$/);
  if (filledOrders) {
    return `${filledOrders[1]} 笔已成交`;
  }
  const certifiedAdapters = value.match(/^(\d+) certified live adapters?$/);
  if (certifiedAdapters) {
    return `${certifiedAdapters[1]} 个认证实盘适配器`;
  }
  return value
    .replace("No audited run", "缺少审计运行")
    .replace("paper approved", "模拟已批准")
    .replace("live approved", "实盘已批准")
    .replace("risk blocked", "风控阻断")
    .replace("No paper fill", "缺少模拟成交")
    .replace("manual approval recorded", "人工确认已记录")
    .replace("manual approval required", "需要人工确认");
}

function promotionStageStatusLabel(i18n: AppI18n, status: PromotionQueueStage["status"]): string {
  if (i18n.locale === "en-US") {
    return status;
  }
  return { passed: "通过", blocked: "阻断", review: "复核" }[status];
}

function promotionStageDetail(i18n: AppI18n, detail: string): string {
  if (i18n.locale === "en-US") {
    return detail;
  }
  const boundRun = detail.match(/^(\d+) (.+) bars are bound to the promotion queue\.$/);
  if (boundRun) {
    return `${boundRun[1]} 根 ${boundRun[2]} K线已绑定到晋级队列。`;
  }
  const paperSnapshot = detail.match(/^Paper snapshot (.+) passed local risk checks before live promotion\.$/);
  if (paperSnapshot) {
    return `模拟快照 ${paperSnapshot[1]} 已在实盘晋级前通过本地风控检查。`;
  }
  return detail
    .replace("Run Pipeline before a strategy can enter the promotion queue.", "策略进入晋级队列前需要先运行流水线。")
    .replace("Audited strategy risk configuration is incomplete; paper-to-live promotion is blocked.", "审计策略风控配置不完整，模拟到实盘晋级已阻断。")
    .replace("Paper execution exists, but a filled order and passing risk check are both required.", "已有模拟执行，但仍需要已成交委托和通过的风控检查。")
    .replace("Submit a paper order from the active audited run before live promotion review.", "实盘晋级评审前，请先基于当前审计运行提交模拟委托。")
    .replace("A certified live adapter is available for the selected market.", "当前市场已有可用的认证实盘适配器。")
    .replace("Live adapters remain interface-only or configuration-required until certification passes.", "认证通过前，实盘适配器仍保持仅接口或需配置状态。")
    .replace("A human operator confirmed this promotion path.", "人工操作员已确认该晋级路径。")
    .replace("Live promotion requires explicit human confirmation after adapter certification.", "适配器认证后，实盘晋级仍需要明确人工确认。")
    .replace("Bind an audited run before paper or live execution.", "先绑定审计运行，再进入模拟或实盘执行。");
}

function preLiveChecklistStatusLabel(i18n: AppI18n, status: PreLiveReadinessChecklist["status"]): string {
  if (i18n.locale === "en-US") {
    return status.replaceAll("_", " ");
  }
  return {
    blocked: "实盘前阻断",
    paper_pending: "等待模拟证据",
    evidence_pending: "等待准入证据",
    operator_pending: "等待人工确认",
    manual_route_ready: "人工路由候选"
  }[status];
}

function preLiveChecklistHeadline(i18n: AppI18n, headline: string): string {
  if (i18n.locale === "en-US") {
    return headline;
  }
  return {
    "Pre-live checklist complete": "实盘前清单完成",
    "Pre-live paper evidence pending": "等待模拟执行证据",
    "Pre-live operator confirmation pending": "等待人工确认",
    "Pre-live evidence pending": "等待实盘前准入证据",
    "Pre-live readiness blocked": "实盘前准入阻断"
  }[headline] ?? headline;
}

function preLiveChecklistSummary(i18n: AppI18n, summary: string): string {
  if (i18n.locale === "en-US") {
    return summary;
  }
  const manualReady = summary.match(
    /^(\d+)\/(\d+) gates passed; ready for manual route review only\. Direct order submission remains disabled\.$/
  );
  if (manualReady) {
    return `${manualReady[1]}/${manualReady[2]} 个闸门通过；仅可进入人工路由复核。直接下单仍禁用。`;
  }
  const nextAction = summary.match(
    /^(\d+)\/(\d+) gates passed; next action (.+)\. Direct order submission remains disabled\.$/
  );
  if (nextAction) {
    return `${nextAction[1]}/${nextAction[2]} 个闸门通过；下一步 ${preLiveChecklistNextAction(i18n, nextAction[3])}。直接下单仍禁用。`;
  }
  return summary.replace("Direct order submission remains disabled.", "直接下单仍禁用。");
}

function preLiveChecklistNextAction(i18n: AppI18n, action: string): string {
  const [id, ...evidenceParts] = action.split(": ");
  const evidence = evidenceParts.join(": ");
  const label = preLiveChecklistItemIdLabel(i18n, id);
  return evidence ? `${label} · ${promotionStageValue(i18n, evidence)}` : label;
}

function preLiveChecklistItemIdLabel(i18n: AppI18n, id: string): string {
  if (i18n.locale === "en-US") {
    return id.replaceAll("-", " ");
  }
  return {
    "audited-run": "审计运行",
    "risk-approval": "风控审批",
    "paper-execution": "模拟执行",
    "paper-execution-replay": "模拟执行回放",
    "adapter-certification": "适配器认证",
    "human-confirmation": "人工确认"
  }[id] ?? id;
}

function preLiveChecklistItemLabel(
  i18n: AppI18n,
  item: PreLiveReadinessChecklist["items"][number]
): string {
  if (i18n.locale === "en-US") {
    return item.label;
  }
  return preLiveChecklistItemIdLabel(i18n, item.id);
}

function preLiveChecklistItemEvidence(i18n: AppI18n, evidence: string): string {
  return promotionStageValue(i18n, evidence);
}

function preLiveChecklistItemDetail(i18n: AppI18n, detail: string): string {
  return promotionStageDetail(i18n, detail);
}

function preLiveChecklistBoundary(i18n: AppI18n, checklist: PreLiveReadinessChecklist): string {
  if (i18n.locale === "en-US") {
    return checklist.manualRouteCandidate
      ? "All gates are present for manual route review only; direct order submission and live trading remain disabled."
      : "This is still a paper and audit control surface; direct order submission and live trading remain disabled.";
  }
  return checklist.manualRouteCandidate
    ? "所有闸门仅满足人工路由复核；直接下单和实盘交易仍禁用。"
    : "当前仍是模拟盘和审计控制面；直接下单和实盘交易仍禁用。";
}

function promotionCertificationBoundaryLabel(i18n: AppI18n, boundary: string): string {
  if (i18n.locale === "en-US") {
    return boundary;
  }
  return adapterCertificationBoundaryLabel(i18n, boundary);
}
