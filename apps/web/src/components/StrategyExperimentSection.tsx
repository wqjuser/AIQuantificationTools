import type { createI18n } from "../lib/i18n";
import type {
  StrategyExperimentCandidate,
  StrategyExperimentDetail,
  StrategyExperimentDimension,
  StrategyExperimentGuardrails,
  StrategyExperimentListItem,
  StrategyExperimentMetricSet,
  StrategyExperimentWalkForward
} from "../lib/terminal-workbench";

export interface StrategyExperimentSectionProps {
  i18n: ReturnType<typeof createI18n>;
  dimensions: StrategyExperimentDimension[];
  guardrails: StrategyExperimentGuardrails;
  walkForward: StrategyExperimentWalkForward | null;
  history: StrategyExperimentListItem[];
  active: StrategyExperimentDetail | null;
  running: boolean;
  error: string | null;
  onDimensionsChange: (value: StrategyExperimentDimension[]) => void;
  onGuardrailsChange: (value: StrategyExperimentGuardrails) => void;
  onWalkForwardChange: (value: StrategyExperimentWalkForward | null) => void;
  onRun: () => void;
  onInspect: (experimentId: string) => void;
  onReplay: (experimentId: string) => void;
  onExport: (experiment: StrategyExperimentDetail) => void;
  onLoadCandidate: (candidateId: string) => void;
}

export function StrategyExperimentSection({
  active,
  dimensions,
  error,
  guardrails,
  history,
  i18n,
  onDimensionsChange,
  onExport,
  onGuardrailsChange,
  onInspect,
  onLoadCandidate,
  onReplay,
  onRun,
  onWalkForwardChange,
  running,
  walkForward
}: StrategyExperimentSectionProps) {
  const selectedCandidate = active?.candidates.find(
    (candidate) => candidate.candidateId === active.selectedCandidateId
  );
  const evaluationBudget = dimensions.reduce(
    (budget, dimension) => budget * Math.max(1, dimension.values.length),
    dimensions.length ? 1 : 0
  );

  const updateDimensionValue = (dimensionIndex: number, valueIndex: number, value: number) => {
    onDimensionsChange(
      dimensions.map((dimension, index) =>
        index === dimensionIndex
          ? {
              ...dimension,
              values: dimension.values.map((current, candidateIndex) =>
                candidateIndex === valueIndex ? value : current
              )
            }
          : dimension
      )
    );
  };

  return (
    <section className="backtest-report-section strategy-experiment-section">
      <header className="strategy-experiment-heading">
        <div>
          <span>{i18n.t("strategyExperiment.title")}</span>
          <strong>{i18n.t("strategyExperiment.subtitle")}</strong>
        </div>
        <div className="strategy-experiment-actions">
          <span>{i18n.t("strategyExperiment.budget")}: {evaluationBudget}</span>
          <button disabled={running || !dimensions.length} onClick={onRun} type="button">
            {running ? i18n.t("strategyExperiment.running") : i18n.t("strategyExperiment.run")}
          </button>
          <button disabled={running || !active} onClick={() => active && onExport(active)} type="button">
            {i18n.t("strategyExperiment.export")}
          </button>
        </div>
      </header>

      {error ? <p className="strategy-experiment-error" role="alert">{error}</p> : null}

      <div className="strategy-experiment-config">
        <section>
          <div className="strategy-experiment-subtitle">
            <span>{i18n.t("strategyExperiment.dimensions")}</span>
            <strong>{dimensions.length}</strong>
          </div>
          <div className="strategy-experiment-dimensions">
            {dimensions.length ? dimensions.map((dimension, dimensionIndex) => (
              <fieldset key={`${dimension.conditionSide}:${dimension.conditionIndex}:${dimension.parameter}`}>
                <legend>
                  {i18n.t(
                    dimension.conditionSide === "entry"
                      ? "strategyExperiment.entry"
                      : "strategyExperiment.exit"
                  )} #{dimension.conditionIndex + 1} · {dimension.parameter}
                </legend>
                <div className="strategy-experiment-values">
                  {dimension.values.map((value, valueIndex) => (
                    <label key={`${dimensionIndex}:${valueIndex}`}>
                      <span>{i18n.t("strategyExperiment.value")} {valueIndex + 1}</span>
                      <input
                        min={dimension.parameter === "window" ? 1 : 0}
                        max={dimension.parameter === "window" ? 250 : 100}
                        onChange={(event) => updateDimensionValue(
                          dimensionIndex,
                          valueIndex,
                          Number(event.currentTarget.value)
                        )}
                        step={dimension.parameter === "window" ? 1 : 0.1}
                        type="number"
                        value={value}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            )) : (
              <p className="strategy-experiment-empty">{i18n.t("strategyExperiment.persistedEvidenceRequired")}</p>
            )}
          </div>
        </section>

        <section className="strategy-experiment-guardrails">
          <div className="strategy-experiment-subtitle">
            <span>{i18n.t("strategyExperiment.guardrails")}</span>
          </div>
          <label>
            <span>{i18n.t("strategyExperiment.minimumTrades")}</span>
            <input
              min={0}
              onChange={(event) => onGuardrailsChange({
                ...guardrails,
                minimumTradeCount: Number(event.currentTarget.value)
              })}
              step={1}
              type="number"
              value={guardrails.minimumTradeCount}
            />
          </label>
          <label>
            <span>{i18n.t("strategyExperiment.maximumDrawdown")}</span>
            <input
              min={0}
              max={100}
              onChange={(event) => onGuardrailsChange({
                ...guardrails,
                maximumDrawdownPct: event.currentTarget.value === "" ? null : Number(event.currentTarget.value)
              })}
              step={0.1}
              type="number"
              value={guardrails.maximumDrawdownPct ?? ""}
            />
          </label>
          <label className="strategy-experiment-toggle">
            <input
              checked={walkForward !== null}
              onChange={(event) => onWalkForwardChange(
                event.currentTarget.checked ? { trainBars: 40, validationBars: 10, stepBars: 10 } : null
              )}
              type="checkbox"
            />
            <span>{i18n.t("strategyExperiment.walkForward")}</span>
          </label>
          {walkForward ? (
            <div className="strategy-experiment-walk-forward">
              {(["trainBars", "validationBars", "stepBars"] as const).map((field) => (
                <label key={field}>
                  <span>{i18n.t(`strategyExperiment.${field}`)}</span>
                  <input
                    min={1}
                    onChange={(event) => onWalkForwardChange({
                      ...walkForward,
                      [field]: Number(event.currentTarget.value)
                    })}
                    step={1}
                    type="number"
                    value={walkForward[field]}
                  />
                </label>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <section className="strategy-experiment-history">
        <div className="strategy-experiment-subtitle">
          <span>{i18n.t("strategyExperiment.history")}</span>
          <strong>{history.length}</strong>
        </div>
        <div className="strategy-experiment-history-list">
          {history.length ? history.map((experiment) => (
            <article
              aria-current={active?.experimentId === experiment.experimentId ? "true" : undefined}
              key={experiment.experimentId}
            >
              <div>
                <strong>{experiment.experimentId}</strong>
                <span>{experiment.symbol} · {experiment.timeframe} · {experiment.strategyRevision}</span>
                <small>
                  {i18n.t(
                    experiment.status === "completed"
                      ? "strategyExperiment.completed"
                      : "strategyExperiment.failed"
                  )} · {i18n.t("strategyExperiment.budget")}: {experiment.definition.evaluationBudget}
                </small>
              </div>
              <div className="strategy-experiment-history-actions">
                <button disabled={running} onClick={() => onInspect(experiment.experimentId)} type="button">
                  {i18n.t("strategyExperiment.inspect")}
                </button>
                <button disabled={running} onClick={() => onReplay(experiment.experimentId)} type="button">
                  {i18n.t("strategyExperiment.replay")}
                </button>
              </div>
            </article>
          )) : (
            <p className="strategy-experiment-empty">{i18n.t("strategyExperiment.noHistory")}</p>
          )}
        </div>
      </section>

      {active ? (
        <section className="strategy-experiment-detail">
          <div className="strategy-experiment-subtitle">
            <span>{i18n.t("strategyExperiment.detail")}</span>
            <strong>{active.experimentId}</strong>
          </div>
          <dl className="strategy-experiment-hashes">
            <div><dt>{i18n.t("strategyExperiment.definitionHash")}</dt><dd>{active.definitionHash}</dd></div>
            <div><dt>{i18n.t("strategyExperiment.resultHash")}</dt><dd>{active.resultHash ?? "N/A"}</dd></div>
            <div><dt>{i18n.t("strategyExperiment.dataHash")}</dt><dd>{active.snapshot.canonicalDataHash}</dd></div>
            <div><dt>{i18n.t("strategyExperiment.holdout")}</dt><dd>{holdoutLabel(i18n, active.holdoutStatus)}</dd></div>
          </dl>

          {selectedCandidate ? (
            <article className="strategy-experiment-selected-evidence">
              <span>{i18n.t("strategyExperiment.selectedTestEvidence")}</span>
              <strong>{selectedCandidate.candidateId}</strong>
              <p>{metricSummary(i18n, selectedCandidate.testMetrics)}</p>
            </article>
          ) : null}

          <div className="strategy-experiment-candidates">
            <table>
              <thead>
                <tr>
                  <th>{i18n.t("strategyExperiment.candidate")}</th>
                  <th>{i18n.t("strategyExperiment.train")}</th>
                  <th>{i18n.t("strategyExperiment.validation")}</th>
                  <th>{i18n.t("strategyExperiment.test")}</th>
                  <th>{i18n.t("strategyExperiment.eligibility")}</th>
                  <th>{i18n.t("strategyExperiment.rank")}</th>
                  <th>{i18n.t("strategyExperiment.action")}</th>
                </tr>
              </thead>
              <tbody>
                {active.candidates.map((candidate) => (
                  <CandidateRow
                    candidate={candidate}
                    i18n={i18n}
                    key={candidate.candidateId}
                    onLoadCandidate={onLoadCandidate}
                    running={running}
                    selected={candidate.candidateId === active.selectedCandidateId}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {!active.candidates.length ? (
            <p className="strategy-experiment-empty">{i18n.t("strategyExperiment.noCandidates")}</p>
          ) : null}
        </section>
      ) : (
        <p className="strategy-experiment-empty">{i18n.t("strategyExperiment.persistedEvidenceRequired")}</p>
      )}
    </section>
  );
}

function CandidateRow({
  candidate,
  i18n,
  onLoadCandidate,
  running,
  selected
}: {
  candidate: StrategyExperimentCandidate;
  i18n: ReturnType<typeof createI18n>;
  onLoadCandidate: (candidateId: string) => void;
  running: boolean;
  selected: boolean;
}) {
  return (
    <tr className={selected ? "selected" : ""}>
      <td data-label={i18n.t("strategyExperiment.candidate")}>
        <strong>{candidate.candidateId}</strong>
        <small>{candidate.parameters.map((parameter) => `${parameter.conditionSide[0]}${parameter.conditionIndex + 1}.${parameter.parameter}=${parameter.value}`).join(" · ")}</small>
      </td>
      <td data-label={i18n.t("strategyExperiment.train")}>{metricSummary(i18n, candidate.trainMetrics)}</td>
      <td data-label={i18n.t("strategyExperiment.validation")}>{metricSummary(i18n, candidate.validationMetrics)}</td>
      <td data-label={i18n.t("strategyExperiment.test")}>{metricSummary(i18n, candidate.testMetrics)}</td>
      <td data-label={i18n.t("strategyExperiment.eligibility")}>
        {i18n.t(candidate.eligible ? "strategyExperiment.eligible" : "strategyExperiment.ineligible")}
      </td>
      <td data-label={i18n.t("strategyExperiment.rank")}>{candidate.rank ?? "—"}</td>
      <td data-label={i18n.t("strategyExperiment.action")}>
        <button
          disabled={running || !candidate.eligible}
          onClick={() => onLoadCandidate(candidate.candidateId)}
          type="button"
        >
          {i18n.t("strategyExperiment.loadDraft")}
        </button>
      </td>
    </tr>
  );
}

function metricSummary(
  i18n: ReturnType<typeof createI18n>,
  metrics: StrategyExperimentMetricSet | null
): string {
  return metrics
    ? `${i18n.t("strategyExperiment.return")}: ${metrics.totalReturnPct.toFixed(2)}% · ${i18n.t("strategyExperiment.maximumDrawdown")}: ${metrics.maxDrawdownPct.toFixed(2)}% · ${i18n.t("strategyExperiment.trades")}: ${metrics.tradeCount}`
    : "—";
}

function holdoutLabel(
  i18n: ReturnType<typeof createI18n>,
  status: StrategyExperimentDetail["holdoutStatus"]
): string {
  if (status === "consumed") {
    return i18n.t("strategyExperiment.holdoutConsumedStatus");
  }
  if (status === "consumed_by_other_definition") {
    return i18n.t("strategyExperiment.holdoutConsumedOther");
  }
  return i18n.t("strategyExperiment.holdoutUnconsumed");
}
