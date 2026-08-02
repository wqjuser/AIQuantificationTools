import { Panel } from "../../components/AppPanel";
import type { AppI18n } from "../../lib/i18n";
import type {
  BrokerAdapterRow,
  PaperExecutionSummaryTile,
  PaperTradingRow,
  RiskApprovalSummary,
  TerminalWorkspace,
} from "../../lib/terminal-workbench";
import {
  brokerAdapterName,
  brokerCertificationLabel,
  brokerNextStepLabel,
  brokerRouteLabel,
  brokerStatusLabel,
} from "./AdapterFormatters";
import { ExecutionPanel } from "./ExecutionPanel";

export function BrokerWorkspace({
  adapterRows,
  executionRows,
  i18n,
  isSubmittingPaperExecution,
  onSubmitPaperExecution,
  riskApproval,
  summaryTiles,
  workspace
}: {
  adapterRows: BrokerAdapterRow[];
  executionRows: PaperTradingRow[];
  i18n: AppI18n;
  isSubmittingPaperExecution: boolean;
  onSubmitPaperExecution: () => void;
  riskApproval: RiskApprovalSummary;
  summaryTiles: PaperExecutionSummaryTile[];
  workspace: TerminalWorkspace;
}) {
  return (
    <>
      <BrokerAdapterPanel adapterRows={adapterRows} className="module-workspace-panel" i18n={i18n} />
      <ExecutionPanel
        approval={riskApproval}
        i18n={i18n}
        isSubmitting={isSubmittingPaperExecution}
        onSubmit={onSubmitPaperExecution}
        rows={executionRows}
        summaryTiles={summaryTiles}
        workspace={workspace}
      />
    </>
  );
}

function BrokerAdapterPanel({
  adapterRows,
  className,
  i18n
}: {
  adapterRows: BrokerAdapterRow[];
  className?: string;
  i18n: AppI18n;
}) {
  return (
    <Panel title={i18n.t("module.broker.title")} subtitle={i18n.t("module.broker.subtitle")} className={className}>
      <div className="broker-adapter-table">
        <div className="broker-adapter-row broker-adapter-head">
          <span>{i18n.t("broker.adapter")}</span>
          <span>{i18n.t("broker.market")}</span>
          <span>{i18n.t("broker.route")}</span>
          <span>{i18n.t("broker.status")}</span>
          <span>{i18n.t("broker.certification")}</span>
          <span>{i18n.t("broker.nextStep")}</span>
        </div>
        {adapterRows.map((row) => (
          <article className={`broker-adapter-row ${row.tone}`} key={row.id}>
            <span>{brokerAdapterName(i18n, row)}</span>
            <span>{i18n.marketLabel(row.market)}</span>
            <span>{brokerRouteLabel(i18n, row.route)}</span>
            <span>{brokerStatusLabel(i18n, row.status)}</span>
            <span>{brokerCertificationLabel(i18n, row.certification)}</span>
            <span>{brokerNextStepLabel(i18n, row.nextStep)}</span>
          </article>
        ))}
      </div>
    </Panel>
  );
}
