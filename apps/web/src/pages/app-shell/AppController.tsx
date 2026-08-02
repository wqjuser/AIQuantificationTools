import { AppShellView } from "./view/AppShellView";
import type { AppControllerBindings } from "./controller/bindings";
import { useExecutionStateActions } from "../execution/controller/execution-state-actions";
import { useAppKernel } from "./controller/app-kernel";
import { useAutomationActions } from "./controller/automation-actions";
import { usePreliveActions } from "../execution/controller/prelive-actions";
import { useAuditStateActions } from "../audit/controller/audit-state-actions";
import { useAuditLinkActions } from "../audit/controller/audit-link-actions";
import { useMarketStateActions } from "../market/controller/market-state-actions";
import { useVisibleDataActions } from "./controller/visible-data-actions";
import { useResearchStateActions } from "../research/controller/research-state-actions";
import { useEvidencePackageActions } from "../audit/controller/evidence-package-actions";
import { usePaperExecutionActions } from "../execution/controller/paper-execution-actions";
import { useStrategyStateActions } from "../strategy/controller/strategy-state-actions";
import { useAiReviewStateActions } from "../ai-review/controller/review-state-actions";
import { usePortablePackageActions } from "./controller/portable-package-actions";
import { useRunHistoryActions } from "../research/controller/run-history-actions";
import { useImportRollbackActions } from "../audit/controller/import-rollback-actions";
import { useAuditExportActions } from "./controller/audit-export-actions";
import { useWatchlistActions } from "../market/controller/watchlist-actions";
import { useStrategyGovernanceActions } from "../strategy/controller/strategy-governance-actions";
import { usePaperExecutionDeepLink } from "../execution/controller/paper-execution-deep-link";
import { usePortfolioStateActions } from "../portfolio/controller/portfolio-state-actions";
import { usePortfolioWorkflowActions } from "../portfolio/controller/portfolio-workflow-actions";
import { useStageGateActions } from "../execution/controller/stage-gate-actions";
import { useAiReviewReadiness } from "../ai-review/controller/review-readiness";
import { useSettingsController } from "../settings/controller/settings-controller";
import { useAdapterEvidenceActions } from "../execution/controller/adapter-evidence-actions";
import { useNavigationActions } from "./controller/navigation-actions";
import { useMarketNavigationActions } from "../market/controller/market-navigation-actions";
import { useAdapterAuditActions } from "../execution/controller/adapter-audit-actions";
import { useResearchWorkflowActions } from "../research/controller/research-workflow-actions";
import { useWorkflowActions } from "./controller/workflow-actions";
import { useOperatorRunbookActions } from "../audit/controller/operator-runbook-actions";
import { usePaperOpsActions } from "../portfolio/controller/paper-ops-actions";
import { useExecutionReadinessModel } from "../execution/controller/execution-readiness-model";
import { useReadinessReviewModel } from "./controller/readiness-review-model";
import { useStage1ReviewActions } from "./controller/stage1-review-actions";
import { useP2ReviewActions } from "./controller/p2-review-actions";
import { useStage1HandoffActions } from "../research/controller/stage1-handoff-actions";
import { useWorkspaceRuntimeEffects } from "./controller/workspace-runtime-effects";
import { useDomainRuntimeEffects } from "./controller/domain-runtime-effects";
import { useAutomationRuntimeEffect } from "./controller/automation-runtime-effect";

function extendController<T extends object, U extends object>(
  controller: T,
  extension: U
): asserts controller is T & U {
  Object.assign(controller, extension);
}

export function App() {
  const controller: Record<never, never> = {};
  extendController(controller, useExecutionStateActions(controller));
  extendController(controller, useAppKernel(controller));
  extendController(controller, useAutomationActions(controller));
  extendController(controller, usePreliveActions(controller));
  extendController(controller, useAuditStateActions(controller));
  extendController(controller, useAuditLinkActions(controller));
  extendController(controller, useMarketStateActions(controller));
  extendController(controller, useVisibleDataActions(controller));
  extendController(controller, useResearchStateActions(controller));
  extendController(controller, useEvidencePackageActions(controller));
  extendController(controller, usePaperExecutionActions(controller));
  extendController(controller, useStrategyStateActions(controller));
  extendController(controller, useAiReviewStateActions(controller));
  extendController(controller, usePortablePackageActions(controller));
  extendController(controller, useRunHistoryActions(controller));
  extendController(controller, useImportRollbackActions(controller));
  extendController(controller, useAuditExportActions(controller));
  extendController(controller, useWatchlistActions(controller));
  extendController(controller, useStrategyGovernanceActions(controller));
  extendController(controller, usePaperExecutionDeepLink(controller));
  extendController(controller, usePortfolioStateActions(controller));
  extendController(controller, usePortfolioWorkflowActions(controller));
  extendController(controller, useStageGateActions(controller));
  extendController(controller, useAiReviewReadiness(controller));
  extendController(controller, useSettingsController(controller));
  extendController(controller, useAdapterEvidenceActions(controller));
  extendController(controller, useNavigationActions(controller));
  extendController(controller, useMarketNavigationActions(controller));
  extendController(controller, useAdapterAuditActions(controller));
  extendController(controller, useResearchWorkflowActions(controller));
  extendController(controller, useWorkflowActions(controller));
  extendController(controller, useOperatorRunbookActions(controller));
  extendController(controller, usePaperOpsActions(controller));
  extendController(controller, useExecutionReadinessModel(controller));
  extendController(controller, useReadinessReviewModel(controller));
  extendController(controller, useStage1ReviewActions(controller));
  extendController(controller, useP2ReviewActions(controller));
  extendController(controller, useStage1HandoffActions(controller));
  useWorkspaceRuntimeEffects(controller);
  useDomainRuntimeEffects(controller);
  useAutomationRuntimeEffect(controller);
  const completeController: AppControllerBindings = controller;
  return <AppShellView controller={completeController} />;
}
