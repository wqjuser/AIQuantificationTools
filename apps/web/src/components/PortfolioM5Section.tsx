import { AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";
import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import {
  buildPortfolioRiskAssessmentDraft,
  type PortfolioRiskAssessment,
  type PortfolioRiskAssessmentRequest,
  type PortfolioRiskCheck,
} from "../lib/portfolio-m5";
import type { Stage4PortfolioWorkflow } from "../lib/portfolio-stage4";

interface PortfolioM5SectionProps {
  assessment: PortfolioRiskAssessment | null;
  busy: boolean;
  error?: string | null;
  onAssess?: (request: PortfolioRiskAssessmentRequest) => void;
  workflow: Stage4PortfolioWorkflow | null;
}

const CHECK_LABELS: Record<string, string> = {
  account_reconciliation: "账户 / 本地组合匹配",
  cash_preservation: "现金守恒",
  max_drawdown: "组合最大回撤",
  daily_loss: "账户当日损失",
  trade_rate: "账户当日交易频率",
  total_exposure: "组合总暴露",
  symbol_concentration: "单一标的集中度",
  industry_concentration: "行业集中度",
  market_concentration: "市场集中度",
  currency_concentration: "币种集中度",
  correlation_concentration: "相关性集中度",
  risk_contribution: "风险贡献集中度",
};

const DIMENSION_LABELS = {
  industry: "行业",
  market: "市场",
  currency: "币种",
};

export function PortfolioM5Section({
  assessment,
  busy,
  error,
  onAssess,
  workflow,
}: PortfolioM5SectionProps) {
  const [draft, setDraft] = useState<PortfolioRiskAssessmentRequest | null>(
    workflow ? buildPortfolioRiskAssessmentDraft(workflow) : null,
  );

  useEffect(() => {
    setDraft(workflow ? buildPortfolioRiskAssessmentDraft(workflow) : null);
  }, [workflow?.workflowId]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (draft && onAssess && !busy) onAssess(draft);
  };
  const statusLabel =
    assessment?.batch.status === "blocked"
      ? "批次已阻断"
      : assessment?.batch.status === "reduced"
        ? "目标已下调"
        : assessment
          ? "候选可复核"
          : "等待评估";

  return (
    <section aria-labelledby="portfolio-m5-title" className="design-surface-panel portfolio-m5-section">
      <header className="portfolio-m5-header">
        <div>
          <span className="portfolio-m5-kicker">M5 · 真实组合与风险</span>
          <h2 id="portfolio-m5-title">账户、目标与批次风险</h2>
          <p>只读取 Stage 4 纸面账户回放；评估不会批准、提交或路由任何订单。</p>
        </div>
        <span className={`portfolio-m5-status ${assessment?.batch.status ?? "pending"}`}>
          <ShieldCheck aria-hidden="true" size={15} />
          {statusLabel}
        </span>
      </header>

      {error ? (
        <div className="portfolio-m5-error" role="alert">
          <AlertTriangle aria-hidden="true" size={16} />
          {error}
        </div>
      ) : null}

      <form className="portfolio-m5-form" onSubmit={submit}>
        <div className="portfolio-m5-classifications">
          <strong>持仓分类</strong>
          {draft?.classifications.map((row, index) => (
            <div className="portfolio-m5-classification-row" key={row.symbol}>
              <span>{row.symbol}</span>
              <label>
                行业
                <input
                  aria-label={`${row.symbol} 行业`}
                  maxLength={100}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            classifications: current.classifications.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, industry: event.target.value } : item,
                            ),
                          }
                        : current,
                    )
                  }
                  required
                  value={row.industry}
                />
              </label>
              <label>
                币种
                <input
                  aria-label={`${row.symbol} 币种`}
                  maxLength={20}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            classifications: current.classifications.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, currency: event.target.value.toUpperCase() } : item,
                            ),
                          }
                        : current,
                    )
                  }
                  required
                  value={row.currency}
                />
              </label>
            </div>
          ))}
          {!draft ? <p>先完成并保存 Stage 4 权威组合工作流。</p> : null}
        </div>

        <div className="portfolio-m5-observations">
          <label>
            当日损失（%）
            <input
              min="0"
              max="100"
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        observations: {
                          ...current.observations,
                          dailyLossPct: event.target.valueAsNumber,
                        },
                      }
                    : current,
                )
              }
              required
              step="0.01"
              type="number"
              value={draft?.observations.dailyLossPct ?? 0}
            />
          </label>
          <label>
            今日交易次数
            <input
              min="0"
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        observations: {
                          ...current.observations,
                          tradesToday: event.target.valueAsNumber,
                        },
                      }
                    : current,
                )
              }
              required
              step="1"
              type="number"
              value={draft?.observations.tradesToday ?? 0}
            />
          </label>
          <button disabled={!draft || !workflow || busy || !onAssess} type="submit">
            {busy ? <RefreshCw aria-hidden="true" className="spin" size={14} /> : <ShieldCheck aria-hidden="true" size={14} />}
            {busy ? "评估中" : "运行组合风险评估"}
          </button>
        </div>

        {draft ? (
          <details className="portfolio-m5-limits">
            <summary>组合限额</summary>
            <div>
              <LimitInput draft={draft} field="maxDrawdownPct" label="最大回撤 %" setDraft={setDraft} />
              <LimitInput draft={draft} field="maxDailyLossPct" label="最大日损 %" setDraft={setDraft} />
              <LimitInput draft={draft} field="maxTradesPerDay" label="每日交易次数" setDraft={setDraft} step={1} />
              <LimitInput draft={draft} field="maxTotalExposureWeight" label="总暴露" setDraft={setDraft} />
              <LimitInput draft={draft} field="maxSymbolWeight" label="单标的" setDraft={setDraft} />
              <LimitInput draft={draft} field="maxIndustryWeight" label="单行业" setDraft={setDraft} />
              <LimitInput draft={draft} field="maxMarketWeight" label="单市场" setDraft={setDraft} />
              <LimitInput draft={draft} field="maxCurrencyWeight" label="单币种" setDraft={setDraft} />
              <LimitInput draft={draft} field="maxCorrelation" label="最大相关性" setDraft={setDraft} />
              <LimitInput draft={draft} field="maxRiskContributionPct" label="最大风险贡献 %" setDraft={setDraft} />
            </div>
          </details>
        ) : null}
      </form>

      {assessment ? (
        <>
          <div className="portfolio-m5-summary">
            <Summary label="账户权益" value={money(assessment.account.equity)} />
            <Summary label="当前现金" value={weight(assessment.cash.currentWeight)} />
            <Summary label="风险调整暴露" value={weight(assessment.summary.adjustedTargetExposureWeight)} />
            <Summary label="候选调仓" value={`${assessment.summary.proposedTradeCount} 笔`} />
            <Summary label="下调目标" value={`${assessment.summary.reducedTargetCount} 项`} />
            <Summary label="阻断检查" value={`${assessment.summary.blockedCheckCount} 项`} />
          </div>
          {assessment.account.unmatchedSymbols.length ? (
            <div className="portfolio-m5-error" role="alert">
              <AlertTriangle aria-hidden="true" size={16} />
              账户存在未匹配持仓：{assessment.account.unmatchedSymbols.join("、")}。整个候选批次已阻断，
              不会越过这些持仓生成可执行批次。
            </div>
          ) : null}

          <div className="portfolio-m5-table-block">
            <h3>当前权重、目标与调仓候选</h3>
            <div className="portfolio-m5-table-scroll">
              <table className="design-table">
                <thead>
                  <tr>
                    <th>代码</th>
                    <th>当前</th>
                    <th>目标</th>
                    <th>风险调整目标</th>
                    <th>漂移</th>
                    <th>建议调仓</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {assessment.allocations.map((row) => (
                    <tr key={row.symbol}>
                      <td>{row.symbol}</td>
                      <td>{weight(row.currentWeight)}</td>
                      <td>{weight(row.targetWeight)}</td>
                      <td>{weight(row.adjustedTargetWeight)}</td>
                      <td>{row.driftPct.toFixed(2)}%</td>
                      <td className={row.proposedDeltaValue >= 0 ? "up" : "down"}>
                        {row.side === "hold" ? "无需调仓" : `${row.side === "buy" ? "买入" : "卖出"} ${money(Math.abs(row.proposedDeltaValue))}`}
                      </td>
                      <td><RiskStatus status={row.status === "blocked" ? "blocked" : row.adjustedTargetWeight < row.targetWeight ? "reduced" : "passed"} /></td>
                    </tr>
                  ))}
                  <tr>
                    <td>现金</td>
                    <td>{weight(assessment.cash.currentWeight)}</td>
                    <td>{weight(assessment.cash.targetWeight)}</td>
                    <td>{weight(assessment.cash.adjustedTargetWeight)}</td>
                    <td>—</td>
                    <td>{money(Math.abs(assessment.cash.proposedDeltaValue))}</td>
                    <td><RiskStatus status="passed" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="portfolio-m5-two-column">
            <div className="portfolio-m5-table-block">
              <h3>行业 / 市场 / 币种暴露</h3>
              <div className="portfolio-m5-table-scroll">
                <table className="design-table">
                  <thead>
                    <tr>
                      <th>维度</th><th>分组</th><th>当前</th><th>目标</th><th>调整后</th><th>限额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessment.exposures.map((row) => (
                      <tr key={`${row.dimension}:${row.group}`}>
                        <td>{DIMENSION_LABELS[row.dimension]}</td>
                        <td>{row.group}</td>
                        <td>{weight(row.currentWeight)}</td>
                        <td>{weight(row.targetWeight)}</td>
                        <td>{weight(row.adjustedTargetWeight)}</td>
                        <td>{weight(row.limit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="portfolio-m5-table-block design-risk-ledger">
              <h3>组合级风险检查</h3>
              <div className="portfolio-m5-table-scroll">
                <table className="design-table">
                  <thead>
                    <tr><th>检查</th><th>数值</th><th>限额</th><th>状态</th><th>原因</th></tr>
                  </thead>
                  <tbody>
                    {assessment.checks.map((check) => (
                      <tr key={check.checkId}>
                        <td>{CHECK_LABELS[check.checkId] ?? check.checkId}</td>
                        <td>{checkValue(check, check.value)}</td>
                        <td>{checkValue(check, check.limit)}</td>
                        <td><RiskStatus status={check.status} /></td>
                        <td>{check.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="portfolio-m5-table-block">
            <h3>相关性与标的风险贡献</h3>
            <div className="portfolio-m5-table-scroll">
              <table className="design-table">
                <thead>
                  <tr><th>类型</th><th>对象</th><th>数值</th><th>限额</th><th>状态</th></tr>
                </thead>
                <tbody>
                  {assessment.correlations.map((row) => (
                    <tr key={`correlation:${row.leftSymbol}:${row.rightSymbol}`}>
                      <td>正相关性</td>
                      <td>{row.leftSymbol} / {row.rightSymbol}</td>
                      <td>{row.correlation.toFixed(2)}</td>
                      <td>{row.limit.toFixed(2)}</td>
                      <td><RiskStatus status={row.status} /></td>
                    </tr>
                  ))}
                  {assessment.riskContributions.map((row) => (
                    <tr key={`risk:${row.symbol}`}>
                      <td>风险贡献</td>
                      <td>{row.symbol}</td>
                      <td>{row.contributionPct.toFixed(2)}%</td>
                      <td>{row.limitPct.toFixed(2)}%</td>
                      <td><RiskStatus status={row.status} /></td>
                    </tr>
                  ))}
                  {!assessment.correlations.length && !assessment.riskContributions.length ? (
                    <tr><td className="design-empty" colSpan={5}>当前组合没有可展示的相关性或风险贡献结果。</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="portfolio-m5-empty">
          权威 Stage 4 工作流就绪后，可在此生成可审计的 M5 组合风险评估。
        </div>
      )}
    </section>
  );
}

function LimitInput({
  draft,
  field,
  label,
  setDraft,
  step = 0.01,
}: {
  draft: PortfolioRiskAssessmentRequest;
  field: keyof PortfolioRiskAssessmentRequest["limits"];
  label: string;
  setDraft: Dispatch<SetStateAction<PortfolioRiskAssessmentRequest | null>>;
  step?: number;
}) {
  return (
    <label>
      {label}
      <input
        max={field.startsWith("max") && field.endsWith("Weight") || field === "maxCorrelation" ? 1 : undefined}
        min={field === "maxTradesPerDay" ? 1 : 0.01}
        onChange={(event) =>
          setDraft((current) =>
            current
              ? {
                  ...current,
                  limits: { ...current.limits, [field]: event.target.valueAsNumber },
                }
              : current,
          )
        }
        required
        step={step}
        type="number"
        value={draft.limits[field]}
      />
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <span><small>{label}</small><strong>{value}</strong></span>;
}

function RiskStatus({ status }: { status: "passed" | "reduced" | "blocked" }) {
  return (
    <span className={`portfolio-m5-check-status ${status}`}>
      {status === "blocked" ? "阻断" : status === "reduced" ? "已下调" : "通过"}
    </span>
  );
}

function checkValue(check: PortfolioRiskCheck, value: number): string {
  if (check.unit === "weight") return weight(value);
  if (check.unit === "pct") return `${value.toFixed(2)}%`;
  if (check.unit === "correlation") return value.toFixed(2);
  return String(value);
}

function weight(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function money(value: number): string {
  return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}
