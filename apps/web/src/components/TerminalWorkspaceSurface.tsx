import type { ReactNode } from "react";
import { AiReviewPage } from "../pages/ai-review/AiReviewPage";
import { AuditPage } from "../pages/audit/AuditPage";
import { BacktestPage } from "../pages/backtest/BacktestPage";
import { ExecutionPage } from "../pages/execution/ExecutionPage";
import { MarketInformationPage } from "../pages/market-information/MarketInformationPage";
import { MarketPage } from "../pages/market/MarketPage";
import { PortfolioPage } from "../pages/portfolio/PortfolioPage";
import { ResearchPage } from "../pages/research/ResearchPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { StrategyPage } from "../pages/strategy/StrategyPage";
import {
  terminalWorkspacePageTitles,
  type TerminalWorkspacePageProps,
} from "../pages/shared/terminal-workspace-page";

export type { TerminalWorkspaceSurfaceAction } from "../pages/shared/terminal-workspace-page";
export { buildAuditLedgerRows } from "../pages/audit/AuditPage";
export { hasPlatformSettingsConfigurationChanges } from "../pages/settings/SettingsPage.helpers";

export function TerminalWorkspaceSurface(props: TerminalWorkspacePageProps) {
  let content: ReactNode;
  switch (props.activeWorkAreaId) {
    case "market":
      content = (
        <MarketPage
          key={props.workspace.selectedInstrument.market === "crypto" ? "crypto" : "ashare"}
          {...props}
        />
      );
      break;
    case "market-information":
      content = <MarketInformationPage {...props} />;
      break;
    case "research":
      content = <ResearchPage {...props} />;
      break;
    case "strategy":
      content = <StrategyPage {...props} />;
      break;
    case "backtest":
      content = <BacktestPage {...props} />;
      break;
    case "ai-review": {
      const handoff = props.productionStrategyHandoff;
      content = (
        <AiReviewPage
          action={props.action}
          aiReview={props.aiReview}
          productionStrategyHandoff={handoff ? {
            binding: handoff.binding,
            errorLabel: handoff.errorLabel,
            onOpenDynamicTrading: handoff.onOpenDynamicTrading,
            result: handoff.result,
            switchBlockedReasonLabel: handoff.switchBlockedReasonLabel,
          } : undefined}
          workspace={props.workspace}
        />
      );
      break;
    }
    case "portfolio":
      content = <PortfolioPage {...props} />;
      break;
    case "execution":
      content = <ExecutionPage {...props} />;
      break;
    case "audit":
      content = <AuditPage {...props} />;
      break;
    case "settings":
      content = <SettingsPage {...props} />;
      break;
    default:
      content = null;
  }
  return (
    <section
      className={`terminal-design-surface surface-${props.activeWorkAreaId}`}
      aria-label={terminalWorkspacePageTitles[props.activeWorkAreaId]}
      onScroll={(event) => props.onScrollPositionChange(event.currentTarget.scrollTop)}
      ref={props.surfaceRef}
    >
      {props.workflowGuide}
      {content}
    </section>
  );
}
