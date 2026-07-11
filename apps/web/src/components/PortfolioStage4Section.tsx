import type { createI18n } from "../lib/i18n";
import type { Stage4PortfolioGoldenPath, Stage4PortfolioWorkflow } from "../lib/portfolio-stage4";

type AppI18n = ReturnType<typeof createI18n>;

const stepKeys = {
  "portfolio-build": "portfolio.stage4.step.portfolioBuild",
  "risk-review": "portfolio.stage4.step.riskReview",
  "operator-approval": "portfolio.stage4.step.operatorApproval",
  "paper-simulation": "portfolio.stage4.step.paperSimulation",
  "account-replay": "portfolio.stage4.step.accountReplay"
} as const;

const actionKeys = {
  "run-portfolio-backtest": "portfolio.stage4.action.runBacktest",
  "record-paper-order-batch": "portfolio.stage4.action.recordBatch",
  "review-portfolio-risk": "portfolio.stage4.action.reviewRisk",
  "review-portfolio-orders": "portfolio.stage4.action.reviewOrders",
  "review-route-risk": "portfolio.stage4.action.reviewRouteRisk",
  "simulate-portfolio-batch": "portfolio.stage4.action.simulateBatch",
  "refresh-account-replay": "portfolio.stage4.action.refreshReplay",
  "record-stage4-workflow": "portfolio.stage4.action.recordWorkflow"
} as const;

const blockerKeys = {
  "portfolio-missing": "portfolio.stage4.blocker.portfolioMissing",
  "paper-batch-missing": "portfolio.stage4.blocker.batchMissing",
  "risk-rejected": "portfolio.stage4.blocker.riskRejected",
  "risk-review-required": "portfolio.stage4.blocker.riskReview",
  "mixed-batch": "portfolio.stage4.blocker.mixedBatch",
  "operator-rejected": "portfolio.stage4.blocker.operatorRejected",
  "operator-approval-required": "portfolio.stage4.blocker.operatorApproval",
  "route-risk-blocked": "portfolio.stage4.blocker.routeRisk",
  "paper-simulation-missing": "portfolio.stage4.blocker.simulationMissing",
  "account-replay-missing": "portfolio.stage4.blocker.replayMissing",
  "authoritative-workflow-missing": "portfolio.stage4.blocker.workflowMissing",
  "stale-base-run": "portfolio.stage4.blocker.staleRun"
} as const;

export function PortfolioStage4Section({
  busy = false,
  error,
  goldenPath,
  i18n,
  onPrimaryAction,
  workflow
}: {
  busy?: boolean;
  error?: string | null;
  goldenPath: Stage4PortfolioGoldenPath;
  i18n: AppI18n;
  onPrimaryAction: (actionId: string) => void;
  workflow: Stage4PortfolioWorkflow | null;
}) {
  const actionId = goldenPath.primaryActionId;
  const actionKey = actionId ? actionKeys[actionId as keyof typeof actionKeys] : undefined;
  const disabled = busy || goldenPath.status === "blocked";
  const disabledReason = busy
    ? i18n.t("portfolio.stage4.busy")
    : goldenPath.blockers.map((blocker) => blockerText(i18n, blocker)).join("；");

  return (
    <section className={`portfolio-stage4-section ${goldenPath.status}`} aria-labelledby="portfolio-stage4-title">
      <header className="portfolio-stage4-header">
        <div>
          <span>{i18n.t("portfolio.stage4.eyebrow")}</span>
          <h2 id="portfolio-stage4-title">{i18n.t("portfolio.stage4.title")}</h2>
          <p>{i18n.t("portfolio.stage4.subtitle")}</p>
        </div>
        <strong className="portfolio-stage4-boundary">{i18n.t("portfolio.stage4.boundary")}</strong>
      </header>
      <ol className="portfolio-stage4-steps">
        {goldenPath.steps.map((step, index) => (
          <li className={`portfolio-stage4-step ${step.status}`} key={step.id} aria-current={step.id === goldenPath.currentStepId ? "step" : undefined}>
            <span>{index + 1}</span>
            <strong>{i18n.t(stepKeys[step.id as keyof typeof stepKeys] ?? "portfolio.stage4.step.unknown")}</strong>
            <small>{step.passed ? i18n.t("portfolio.stage4.passed") : blockerText(i18n, step.detail)}</small>
          </li>
        ))}
      </ol>
      {goldenPath.blockers.length || error ? (
        <p className="portfolio-stage4-blocker" role="status">
          {[...goldenPath.blockers.map((blocker) => blockerText(i18n, blocker)), error].filter(Boolean).join("；")}
        </p>
      ) : null}
      {actionId && actionKey ? (
        <div className="portfolio-stage4-actions">
          <button
            aria-describedby={disabled ? "portfolio-stage4-disabled-reason" : undefined}
            className="portfolio-stage4-primary"
            data-testid="portfolio-stage4-primary"
            disabled={disabled}
            onClick={() => onPrimaryAction(actionId)}
            type="button"
          >
            {i18n.t(actionKey)}
          </button>
          {disabled ? <small id="portfolio-stage4-disabled-reason">{disabledReason}</small> : null}
        </div>
      ) : null}
      <details className="portfolio-stage4-evidence">
        <summary>{i18n.t("portfolio.stage4.evidence")}</summary>
        <dl>
          <div><dt>{i18n.t("portfolio.stage4.workflowId")}</dt><dd>{workflow?.workflowId ?? "-"}</dd></div>
          <div><dt>{i18n.t("portfolio.stage4.workflowHash")}</dt><dd className="portfolio-stage4-hash">{workflow?.workflowHash ?? "-"}</dd></div>
        </dl>
        <p>{i18n.t("portfolio.stage4.safety")}</p>
      </details>
    </section>
  );
}

function blockerText(i18n: AppI18n, blocker: string): string {
  if (blocker === "Complete") return i18n.t("portfolio.stage4.passed");
  if (blocker === "Pending") return i18n.t("portfolio.stage4.pending");
  return i18n.t(blockerKeys[blocker as keyof typeof blockerKeys] ?? "portfolio.stage4.pending");
}
