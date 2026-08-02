import { Panel } from "../../components/AppPanel";
import { type AppI18n } from "../../lib/i18n";
import { AgentCommitteeRound, AiEvidenceCard, TerminalWorkspace } from "../../lib/terminal-workbench";
import { agentEvidenceDetail, agentEvidenceLabel, agentEvidenceValue, agentPhaseLabel, agentRoundEvidence, agentRoundThesis, agentVerdictLabel } from "./AgentFormatters";

export function AgentEvidenceBoard({ cards, i18n }: { cards: AiEvidenceCard[]; i18n: AppI18n }) {
  return (
    <div className="agent-evidence">
      <div className="agent-rounds-title">
        <span>{i18n.t("panel.agent.evidence")}</span>
        <strong>{cards.length}</strong>
      </div>
      <div className="agent-evidence-grid">
        {cards.map((card) => (
          <article className={`agent-evidence-card ${card.tone}`} key={card.id}>
            <span>{agentEvidenceLabel(i18n, card)}</span>
            <strong>{agentEvidenceValue(i18n, card)}</strong>
            <p>{agentEvidenceDetail(i18n, card)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function AgentCommitteeBoard({ i18n, rounds }: { i18n: AppI18n; rounds: AgentCommitteeRound[] }) {
  return (
    <div className="agent-rounds">
      <div className="agent-rounds-title">
        <span>{i18n.t("panel.agent.rounds")}</span>
        <strong>{rounds.length}</strong>
      </div>
      {rounds.map((round) => (
        <article className={`agent-round ${round.tone}`} key={round.id}>
          <header>
            <span>{agentPhaseLabel(i18n, round.phase)}</span>
            <strong>{i18n.decisionAgent(round.agent)}</strong>
            <em>{round.confidence}%</em>
          </header>
          <p>{agentRoundThesis(i18n, round)}</p>
          <small>
            {agentVerdictLabel(i18n, round.verdict)} · {agentRoundEvidence(i18n, round.evidence)}
          </small>
        </article>
      ))}
    </div>
  );
}

export function DecisionLogPanel({
  className,
  entries,
  i18n
}: {
  className?: string;
  entries: TerminalWorkspace["decisionLog"];
  i18n: AppI18n;
}) {
  return (
    <Panel title={i18n.t("panel.decision.title")} subtitle={i18n.t("panel.decision.subtitle")} className={className}>
      <div className="decision-log">
        {entries.map((entry) => (
          <article className={`decision-entry ${entry.tone}`} key={`${entry.agent}-${entry.message}`}>
            <strong>{i18n.decisionAgent(entry.agent)}</strong>
            <p>{i18n.decisionMessage(entry.message)}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}
