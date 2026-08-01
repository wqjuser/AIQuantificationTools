import { useEffect, useMemo, useState } from "react";

import type { createI18n } from "../lib/i18n";
import {
  type AiResearchEvidence,
  type AiResearchOutcome,
  type AiResearchRecommendationStance,
  type FinancialFactId,
  type FinancialFactInput
} from "../lib/ai-research-m4";
import {
  createAiResearchEvidence,
  evaluateAiResearchOutcome,
  loadAiResearchEvidence
} from "../lib/terminal-api";
import type { AuthoritativeAiReviewRun } from "../lib/ai-review-stage3";
import type { ResearchRunAudit } from "../lib/terminal-workbench";

const financialFactLabels: Record<FinancialFactId, { zh: string; en: string }> = {
  revenue: { zh: "营业收入", en: "Revenue" },
  net_profit: { zh: "净利润", en: "Net profit" },
  operating_cash_flow: { zh: "经营现金流", en: "Operating cash flow" },
  total_assets: { zh: "总资产", en: "Total assets" },
  shareholders_equity: { zh: "股东权益", en: "Shareholders' equity" },
  eps: { zh: "每股收益", en: "EPS" }
};

interface FinancialFactDraft {
  factId: FinancialFactId;
  period: string;
  unit: string;
  comparisonPeriod: string;
  comparisonUnit: string;
  primarySource: string;
  primaryValue: string;
  comparisonSource: string;
  comparisonValue: string;
}

const initialFinancialDraft: FinancialFactDraft = {
  factId: "revenue",
  period: "",
  unit: "CNY_M",
  comparisonPeriod: "",
  comparisonUnit: "CNY_M",
  primarySource: "",
  primaryValue: "",
  comparisonSource: "",
  comparisonValue: ""
};

export function AiResearchM4Section({
  baseUrl,
  currentReview,
  i18n,
  runHistory
}: {
  baseUrl: string;
  currentReview: AuthoritativeAiReviewRun | null;
  i18n: ReturnType<typeof createI18n>;
  runHistory: ResearchRunAudit[];
}) {
  const zh = i18n.locale === "zh-CN";
  const copy = (chinese: string, english: string) => zh ? chinese : english;
  const [evidence, setEvidence] = useState<AiResearchEvidence | null>(null);
  const [outcomes, setOutcomes] = useState<AiResearchOutcome[]>([]);
  const [stance, setStance] = useState<AiResearchRecommendationStance>("neutral");
  const [horizonBars, setHorizonBars] = useState(20);
  const [multiViewEnabled, setMultiViewEnabled] = useState(true);
  const [financialFacts, setFinancialFacts] = useState<FinancialFactInput[]>([]);
  const [financialDraft, setFinancialDraft] = useState<FinancialFactDraft>(initialFinancialDraft);
  const [outcomeRunId, setOutcomeRunId] = useState("");
  const [benchmarkRunId, setBenchmarkRunId] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const context = useMemo(() => {
    const item = currentReview?.evidenceBundle.evidenceItems.find((candidate) =>
      candidate.kind === "experiment_context"
    );
    return {
      market: String(item?.value.market ?? ""),
      symbol: String(item?.value.symbol ?? ""),
      timeframe: String(item?.value.timeframe ?? "")
    };
  }, [currentReview]);
  const longHorizon = context.timeframe === "1d" || context.timeframe === "1w";
  const outcomeRuns = runHistory.filter((run) =>
    run.market === context.market
    && run.symbol === context.symbol
    && run.timeframe === context.timeframe
    && run.runId !== evidence?.sourceRunId
  );
  const benchmarkRuns = runHistory.filter((run) =>
    run.market === context.market
    && run.timeframe === context.timeframe
    && run.symbol !== context.symbol
  );

  useEffect(() => {
    setEvidence(null);
    setOutcomes([]);
    setError(null);
    setOutcomeRunId("");
    setBenchmarkRunId("");
    if (!currentReview) {
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    void loadAiResearchEvidence(baseUrl, currentReview.aiReviewId, controller.signal).then((result) => {
      if (controller.signal.aborted) {
        return;
      }
      setLoading(false);
      if (result.source !== "core") {
        setError(copy("M4 研究证据读取失败。", "Failed to load M4 research evidence."));
        return;
      }
      setEvidence(result.researchEvidence ?? null);
      setOutcomes(result.outcomes);
    });
    return () => controller.abort();
  }, [baseUrl, currentReview?.aiReviewId]);

  useEffect(() => {
    if (!longHorizon) {
      setMultiViewEnabled(false);
    }
  }, [longHorizon]);

  const addFinancialFact = () => {
    const primaryValue = Number(financialDraft.primaryValue);
    const comparisonValue = Number(financialDraft.comparisonValue);
    if (
      !financialDraft.period.trim()
      || !financialDraft.unit.trim()
      || !financialDraft.comparisonPeriod.trim()
      || !financialDraft.comparisonUnit.trim()
      || !financialDraft.primarySource.trim()
      || !financialDraft.comparisonSource.trim()
      || financialDraft.primarySource.trim().toLocaleLowerCase()
        === financialDraft.comparisonSource.trim().toLocaleLowerCase()
      || !Number.isFinite(primaryValue)
      || !Number.isFinite(comparisonValue)
    ) {
      setError(copy("请填写报告期、单位、两个不同来源和有效数值。", "Enter a period, unit, two distinct sources and valid values."));
      return;
    }
    if (financialFacts.some((item) =>
      item.factId === financialDraft.factId && item.period === financialDraft.period.trim()
    )) {
      setError(copy("同一财务事实和报告期只能添加一次。", "The same fact and period can only be added once."));
      return;
    }
    const observedAt = new Date().toISOString();
    const label = financialFactLabels[financialDraft.factId];
    setFinancialFacts((current) => [
      ...current,
      {
        factId: financialDraft.factId,
        label: zh ? label.zh : label.en,
        period: financialDraft.period.trim(),
        unit: financialDraft.unit.trim(),
        primary: {
          source: financialDraft.primarySource.trim(),
          value: primaryValue,
          period: financialDraft.period.trim(),
          unit: financialDraft.unit.trim(),
          observedAt
        },
        comparison: {
          source: financialDraft.comparisonSource.trim(),
          value: comparisonValue,
          period: financialDraft.comparisonPeriod.trim(),
          unit: financialDraft.comparisonUnit.trim(),
          observedAt
        }
      }
    ]);
    setFinancialDraft((current) => ({
      ...initialFinancialDraft,
      factId: current.factId,
      period: current.period,
      unit: current.unit,
      comparisonPeriod: current.comparisonPeriod,
      comparisonUnit: current.comparisonUnit
    }));
    setError(null);
  };

  const createEvidence = async () => {
    if (!currentReview || creating) {
      return;
    }
    setCreating(true);
    setError(null);
    const result = await createAiResearchEvidence(baseUrl, currentReview.aiReviewId, {
      recommendation: { stance, horizonBars },
      multiViewEnabled,
      financialFacts
    });
    setCreating(false);
    if (result.source !== "core" || !result.researchEvidence) {
      setError(copy(
        result.httpStatus === 409
          ? "当前周期或证据上下文不允许创建这份研究证据。"
          : "M4 研究证据创建失败，请检查输入。",
        "M4 research evidence could not be created for this context."
      ));
      return;
    }
    setEvidence(result.researchEvidence);
  };

  const evaluateOutcome = async () => {
    if (!evidence || !outcomeRunId || !benchmarkRunId || evaluating) {
      return;
    }
    setEvaluating(true);
    setError(null);
    const result = await evaluateAiResearchOutcome(baseUrl, {
      researchEvidenceId: evidence.researchEvidenceId,
      outcomeRunId,
      benchmarkRunId
    });
    setEvaluating(false);
    if (result.source !== "core" || !result.outcome) {
      setError(copy(
        result.httpStatus === 409
          ? "声明周期尚未到期，或后续运行/基准覆盖不足。"
          : "到期复盘失败，请检查后续运行和基准运行。",
        "The horizon is not complete or the audited outcome/benchmark coverage is insufficient."
      ));
      return;
    }
    setOutcomes((current) => [
      result.outcome!,
      ...current.filter((item) => item.outcomeId !== result.outcome!.outcomeId)
    ]);
  };

  return (
    <section className="ai-research-m4-section">
      <header className="ai-review-stage3-heading">
        <div>
          <span>{copy("M4 AI 研究闭环", "M4 AI research loop")}</span>
          <strong>{copy("证据标签、双源校验、多视角与到期复盘", "Claims, source checks, multi-view and outcomes")}</strong>
        </div>
        <span className="ai-review-stage3-boundary">
          {copy("仅研究 · 不影响风控与订单", "Research only · no risk or order effects")}
        </span>
      </header>

      {error ? <p className="ai-review-stage3-error" role="alert">{error}</p> : null}
      {!currentReview ? (
        <p className="ai-review-stage3-empty">
          {copy("先完成并加载一份权威 AI 评审。", "Complete and load an authoritative AI review first.")}
        </p>
      ) : (
        <>
          <div className="ai-review-stage3-grid">
            <section className="ai-review-stage3-card ai-research-m4-config">
              <h3>{copy("研究建议与周期", "Research recommendation")}</h3>
              <label>
                <span>{copy("研究观点", "Research stance")}</span>
                <select value={stance} onChange={(event) => setStance(event.target.value as AiResearchRecommendationStance)}>
                  <option value="bullish">{copy("看多", "Bullish")}</option>
                  <option value="bearish">{copy("看空", "Bearish")}</option>
                  <option value="neutral">{copy("中性", "Neutral")}</option>
                </select>
              </label>
              <label>
                <span>{copy("声明周期（已闭合 K 线）", "Declared horizon (closed bars)")}</span>
                <input
                  max={250}
                  min={1}
                  onChange={(event) => setHorizonBars(Math.max(1, Math.min(250, Number(event.target.value) || 1)))}
                  type="number"
                  value={horizonBars}
                />
              </label>
              <label className="ai-review-stage3-approval">
                <input
                  checked={multiViewEnabled}
                  data-testid="ai-research-m4-multi-view"
                  disabled={!longHorizon}
                  onChange={(event) => setMultiViewEnabled(event.target.checked)}
                  type="checkbox"
                />
                <span>{copy("启用看多 / 看空 / 中性三视角", "Enable bullish / bearish / neutral views")}</span>
              </label>
              {!longHorizon ? (
                <small>{copy("分钟级研究禁止多视角评审。", "Multi-view is blocked for minute-level research.")}</small>
              ) : null}
            </section>

            <section className="ai-review-stage3-card">
              <h3>{copy("A 股财务事实双来源", "A-share financial source check")}</h3>
              {context.market !== "ashare" ? (
                <p>{copy("当前市场不适用。", "Not applicable to this market.")}</p>
              ) : (
                <details className="ai-research-m4-financial">
                  <summary>{copy("添加独立来源观测", "Add independent observations")}</summary>
                  <div className="ai-research-m4-financial-grid">
                    <label>
                      <span>{copy("事实", "Fact")}</span>
                      <select
                        onChange={(event) => setFinancialDraft((current) => ({
                          ...current,
                          factId: event.target.value as FinancialFactId
                        }))}
                        value={financialDraft.factId}
                      >
                        {Object.entries(financialFactLabels).map(([id, label]) => (
                          <option key={id} value={id}>{zh ? label.zh : label.en}</option>
                        ))}
                      </select>
                    </label>
                    <Field
                      label={copy("报告期 A", "Period A")}
                      onChange={(value) => setFinancialDraft((current) => ({ ...current, period: value }))}
                      value={financialDraft.period}
                    />
                    <Field
                      label={copy("单位 A", "Unit A")}
                      onChange={(value) => setFinancialDraft((current) => ({ ...current, unit: value }))}
                      value={financialDraft.unit}
                    />
                    <Field
                      label={copy("来源 A", "Source A")}
                      onChange={(value) => setFinancialDraft((current) => ({ ...current, primarySource: value }))}
                      value={financialDraft.primarySource}
                    />
                    <Field
                      label={copy("数值 A", "Value A")}
                      onChange={(value) => setFinancialDraft((current) => ({ ...current, primaryValue: value }))}
                      type="number"
                      value={financialDraft.primaryValue}
                    />
                    <Field
                      label={copy("来源 B", "Source B")}
                      onChange={(value) => setFinancialDraft((current) => ({ ...current, comparisonSource: value }))}
                      value={financialDraft.comparisonSource}
                    />
                    <Field
                      label={copy("数值 B", "Value B")}
                      onChange={(value) => setFinancialDraft((current) => ({ ...current, comparisonValue: value }))}
                      type="number"
                      value={financialDraft.comparisonValue}
                    />
                    <Field
                      label={copy("报告期 B", "Period B")}
                      onChange={(value) => setFinancialDraft((current) => ({ ...current, comparisonPeriod: value }))}
                      value={financialDraft.comparisonPeriod}
                    />
                    <Field
                      label={copy("单位 B", "Unit B")}
                      onChange={(value) => setFinancialDraft((current) => ({ ...current, comparisonUnit: value }))}
                      value={financialDraft.comparisonUnit}
                    />
                  </div>
                  <div className="ai-review-stage3-actions">
                    <button
                      className="design-primary-action"
                      data-testid="ai-research-m4-add-financial"
                      onClick={addFinancialFact}
                      type="button"
                    >
                      {copy("添加事实", "Add fact")}
                    </button>
                  </div>
                </details>
              )}
              <div className="ai-research-m4-fact-list">
                {financialFacts.map((fact) => (
                  <article key={`${fact.factId}:${fact.period}`}>
                    <strong>{fact.label} · {fact.period}</strong>
                    <span>
                      {fact.primary.source} {fact.primary.value} {fact.primary.unit} · {fact.primary.period}
                      {" ↔ "}
                      {fact.comparison.source} {fact.comparison.value} {fact.comparison.unit} · {fact.comparison.period}
                    </span>
                    <button
                      aria-label={copy("删除财务事实", "Remove financial fact")}
                      onClick={() => setFinancialFacts((current) => current.filter((item) => item !== fact))}
                      type="button"
                    >
                      ×
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </div>
          <div className="ai-review-stage3-actions">
            <button
              className="design-primary-action"
              data-testid="ai-research-m4-create"
              disabled={creating || loading}
              onClick={() => void createEvidence()}
              type="button"
            >
              {creating ? copy("生成中…", "Creating…") : copy("生成 M4 研究证据", "Create M4 research evidence")}
            </button>
          </div>
        </>
      )}

      {loading ? <p className="ai-review-stage3-empty">{copy("正在读取 M4 证据…", "Loading M4 evidence…")}</p> : null}
      {evidence ? (
        <section className="ai-research-m4-result">
          <div className="ai-research-m4-score-grid">
            <article>
              <span>{copy("信息丰富度", "Information richness")}</span>
              <strong>{evidence.informationRichness.score} · {evidence.informationRichness.level}</strong>
              <p>{evidence.informationRichness.basis}</p>
            </article>
            <article>
              <span>{copy("投资确定性", "Investment certainty")}</span>
              <strong>{evidence.investmentCertainty.level}</strong>
              <p>{evidence.investmentCertainty.basis}</p>
            </article>
            <article className={evidence.financialFactReport.status}>
              <span>{copy("财务双源", "Financial sources")}</span>
              <strong>{evidence.financialFactReport.status}</strong>
              <p>{evidence.financialFactReport.summary}</p>
            </article>
          </div>

          <details open>
            <summary>{copy("事实 / 计算 / 假设 / 模型推断", "Facts / calculations / assumptions / model inferences")}</summary>
            <div className="ai-research-m4-claims">
              {evidence.claims.map((claim) => (
                <article className={claim.kind} key={claim.claimId}>
                  <span>{claimKindLabel(claim.kind, zh)}</span>
                  <p>{claim.text}</p>
                  <small>{claim.evidenceReferences.join(" · ")}</small>
                </article>
              ))}
            </div>
          </details>

          {evidence.financialFactReport.facts.length ? (
            <details>
              <summary>{copy("财务事实差异明细", "Financial fact differences")}</summary>
              <div className="ai-research-m4-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{copy("事实", "Fact")}</th>
                      <th>{copy("来源 A", "Source A")}</th>
                      <th>{copy("来源 B", "Source B")}</th>
                      <th>{copy("差异", "Difference")}</th>
                      <th>{copy("分类", "Class")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidence.financialFactReport.facts.map((fact) => (
                      <tr key={`${fact.factId}:${fact.period}`}>
                        <td>{fact.label} · {fact.period}</td>
                        <td>{fact.primary.source} · {fact.primary.value} {fact.primary.unit} · {fact.primary.period}</td>
                        <td>{fact.comparison.source} · {fact.comparison.value} {fact.comparison.unit} · {fact.comparison.period}</td>
                        <td>{fact.relativeDifferencePct}%</td>
                        <td>
                          {fact.status}
                          {fact.mismatchReasons.length ? ` · ${fact.mismatchReasons.join(", ")}` : ""}
                          {" · valuesMerged=false"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ) : null}

          {evidence.multiView.status === "completed" ? (
            <details>
              <summary>{copy("可选三视角评审", "Optional three-view review")}</summary>
              <div className="ai-research-m4-views">
                {evidence.multiView.roles.map((role) => (
                  <article className={role.role} key={role.role}>
                    <strong>{stanceLabel(role.role, zh)}</strong>
                    <p>{role.thesis}</p>
                    <small>{role.evidenceReferences.join(" · ")}</small>
                  </article>
                ))}
              </div>
            </details>
          ) : null}

          <section className="ai-research-m4-outcome">
            <h3>{copy("到期收益与基准复盘", "Horizon outcome evaluation")}</h3>
            <p>
              {stanceLabel(evidence.recommendation.stance, zh)} · {evidence.recommendation.declaredHorizonBars}{" "}
              {copy("根已闭合 K 线", "closed bars")} · {evidence.recommendation.referenceAt}
            </p>
            <div className="ai-review-stage3-grid">
              <label>
                <span>{copy("后续同标的审计运行", "Audited outcome run")}</span>
                <select onChange={(event) => setOutcomeRunId(event.target.value)} value={outcomeRunId}>
                  <option value="">{copy("请选择", "Select")}</option>
                  {outcomeRuns.map((run) => <option key={run.runId} value={run.runId}>{run.runId} · {run.createdAt}</option>)}
                </select>
              </label>
              <label>
                <span>{copy("同市场同周期基准运行", "Audited benchmark run")}</span>
                <select onChange={(event) => setBenchmarkRunId(event.target.value)} value={benchmarkRunId}>
                  <option value="">{copy("请选择", "Select")}</option>
                  {benchmarkRuns.map((run) => <option key={run.runId} value={run.runId}>{run.symbol} · {run.runId}</option>)}
                </select>
              </label>
            </div>
            {benchmarkRuns.length === 0 ? (
              <small>{copy("请先为同市场、同周期的独立基准标的生成研究运行。", "Create an audited run for an independent benchmark in the same market and timeframe.")}</small>
            ) : null}
            <div className="ai-review-stage3-actions">
              <button
                className="design-primary-action"
                disabled={!outcomeRunId || !benchmarkRunId || evaluating}
                onClick={() => void evaluateOutcome()}
                type="button"
              >
                {evaluating ? copy("复盘中…", "Evaluating…") : copy("执行到期复盘", "Evaluate outcome")}
              </button>
            </div>
            <div className="ai-research-m4-outcomes">
              {outcomes.map((outcome) => (
                <article key={outcome.outcomeId}>
                  <header>
                    <strong>{outcome.outcomeAt}</strong>
                    <span>{outcome.benchmarkSymbol}</span>
                  </header>
                  <dl>
                    <div><dt>{copy("原始收益", "Raw return")}</dt><dd>{outcome.rawReturnPct}%</dd></div>
                    <div><dt>{copy("观点收益", "Stance return")}</dt><dd>{outcome.stanceAdjustedReturnPct}%</dd></div>
                    <div><dt>{copy("不利波动", "Adverse excursion")}</dt><dd>{outcome.adverseExcursionPct}%</dd></div>
                    <div><dt>{copy("基准收益", "Benchmark return")}</dt><dd>{outcome.benchmarkReturnPct}%</dd></div>
                    <div><dt>Alpha</dt><dd>{outcome.alphaPct}%</dd></div>
                  </dl>
                  <p>{outcome.lesson}</p>
                </article>
              ))}
            </div>
          </section>

          {evidence.priorOutcomeLessons.length ? (
            <details>
              <summary>{copy("仅供未来研究的历史教训", "Prior lessons for future research only")}</summary>
              {evidence.priorOutcomeLessons.map((lesson) => (
                <p key={lesson.outcomeId}>{lesson.lesson}</p>
              ))}
            </details>
          ) : null}
          <p className="ai-review-stage3-boundary-detail">
            researchContextOnly=true · affectsRisk=false · affectsAuthorization=false · affectsPermissions=false · affectsOrderRouting=false
          </p>
        </section>
      ) : null}
    </section>
  );
}

function Field({
  label,
  onChange,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  value: string;
}) {
  return (
    <label>
      <span>{label}</span>
      <input onChange={(event) => onChange(event.target.value)} type={type} value={value} />
    </label>
  );
}

function claimKindLabel(kind: AiResearchEvidence["claims"][number]["kind"], zh: boolean): string {
  return ({
    fact: zh ? "事实" : "Fact",
    calculation: zh ? "计算" : "Calculation",
    assumption: zh ? "假设" : "Assumption",
    model_inference: zh ? "模型推断" : "Model inference"
  })[kind];
}

function stanceLabel(stance: AiResearchRecommendationStance, zh: boolean): string {
  return ({
    bullish: zh ? "看多" : "Bullish",
    bearish: zh ? "看空" : "Bearish",
    neutral: zh ? "中性" : "Neutral"
  })[stance];
}
