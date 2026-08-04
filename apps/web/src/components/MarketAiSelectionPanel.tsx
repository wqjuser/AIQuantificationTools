import { RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  MarketAiSelectionDiscovery,
  MarketAiSelectionHorizon,
  MarketAiSelectionProfile,
  MarketAiSelectionQualityStatistics,
  MarketAiSelectionReview,
  MarketAiSelectionReviewRequest,
  MarketAiSelectionRequest,
  MarketAiSelectionResearchOrigin,
  MarketAiSelectionResult,
} from "../lib/terminal-api";
import type {
  AiReviewProviderId,
  AiReviewProviderStatus,
} from "../lib/ai-review-stage3";
import type { Instrument, Market } from "../lib/terminal-workbench";
import {
  aiProviderLabels,
  compactRunId,
  Status,
  SurfacePanel,
} from "./TerminalSurfaceUi";

export interface MarketAiSelectionController {
  error?: string;
  isLoading: boolean;
  onResearchInstrument: (
    instrument: Instrument,
    origin: MarketAiSelectionResearchOrigin,
  ) => void;
  onRun: (request: MarketAiSelectionRequest, requestKey: string) => void;
  onViewInstrument: (instrument: Instrument) => void;
  requestKey: string | null;
  result: MarketAiSelectionResult | null;
  review?: {
    error?: string;
    isLoading: boolean;
    onRun: (request: MarketAiSelectionReviewRequest) => void;
    result: MarketAiSelectionReview | null;
  };
  statistics?: {
    error?: string;
    isLoading: boolean;
    onRefresh: () => void;
    result: MarketAiSelectionQualityStatistics | null;
  };
}

export const marketAiSelectionProfileLabels: Record<MarketAiSelectionProfile, string> = {
  balanced: "均衡",
  quality_growth: "质量成长",
  value: "价值",
  trend: "趋势",
};

export const marketAiSelectionHorizonLabels: Record<MarketAiSelectionHorizon, string> = {
  short: "短期",
  medium: "中期",
  long: "长期",
};

const pillarLabels: Record<string, string> = {
  quality: "质量",
  growth: "成长",
  valuation: "估值",
  trend: "趋势",
  liquidityRisk: "流动性与风险",
  liquidity_risk: "流动性与风险",
  maturity: "资产成熟度",
  supply: "供应结构",
  liquidity: "流动性",
  risk: "风险",
};

const reviewReasonLabels: Record<string, string> = {
  research_evidence_not_bound: "尚未绑定研究证据",
  outcome_bars_unavailable: "到期 K 线暂不可用",
  outcome_bars_incomplete: "到期 K 线数据不完整",
  outcome_bar_context_mismatch: "到期 K 线上下文不一致",
  outcome_reference_bar_missing: "到期 K 线缺少冻结参考日",
  outcome_reference_price_mismatch: "冻结参考价与当前 K 线口径不一致",
  outcome_bar_gap: "持有周期 K 线存在无法确认的缺口",
  reference_time_invalid: "参考时间无效",
  benchmark_must_use_different_symbol: "基准必须使用不同标的",
  benchmark_bars_unavailable: "基准 K 线暂不可用",
  benchmark_bars_incomplete: "基准 K 线数据不完整",
  benchmark_adjustment_mode_mismatch: "标的与基准复权口径不一致",
  benchmark_bar_context_mismatch: "基准 K 线上下文不一致",
  benchmark_same_period_coverage_missing: "基准缺少同周期端点",
  review_price_invalid: "到期价格数据无效",
  review_bar_window_invalid: "到期 K 线窗口校验失败",
};

const researchValueStatusLabels = {
  insufficient_sample: "样本不足",
  collecting: "持续采集中",
  stable_positive: "已证明稳定研究价值",
  not_stable: "尚未形成稳定正价值",
} as const;

function hitRate(hits: number, samples: number, rate: number | null): string {
  return `${hits} / ${samples} · ${rate === null ? "—" : `${rate.toFixed(1)}%`}`;
}

function percentage(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function instrumentFor(
  item: MarketAiSelectionResult["baselineCandidates"][number],
): Instrument {
  return {
    market: item.market,
    symbol: item.symbol,
    name: item.name,
    changePct: 0,
    quoteSource: "AI 选股研究候选",
  };
}

export function MarketAiSelectionPanel({
  discovery,
  initialMarket,
  providers,
  selection,
}: {
  discovery: MarketAiSelectionDiscovery;
  initialMarket: Market;
  providers: AiReviewProviderStatus[];
  selection?: MarketAiSelectionController;
}) {
  const [market, setMarket] = useState<Market>(initialMarket);
  const [profile, setProfile] = useState<MarketAiSelectionProfile>("balanced");
  const [horizon, setHorizon] = useState<MarketAiSelectionHorizon>("medium");
  const [providerId, setProviderId] = useState<AiReviewProviderId>("local");
  const [externalDataApproved, setExternalDataApproved] = useState(false);
  const [reviewSelectionId, setReviewSelectionId] = useState(
    selection?.result?.selectionId ?? selection?.review?.result?.selectionId ?? "",
  );
  const [reviewBenchmarkRunId, setReviewBenchmarkRunId] = useState(
    selection?.review?.result?.benchmark.runId ?? "",
  );
  const [reviewSubmittedKey, setReviewSubmittedKey] = useState<string | null>(null);

  useEffect(() => {
    if (selection?.result?.selectionId) {
      setReviewSelectionId(selection.result.selectionId);
    }
  }, [selection?.result?.selectionId]);

  useEffect(() => {
    if (market === "crypto" && profile !== "balanced" && profile !== "trend") {
      setProfile("balanced");
    }
  }, [market, profile]);

  useEffect(() => {
    const selectedProvider = providers.find((provider) => provider.providerId === providerId);
    if (!selectedProvider?.configured) {
      setProviderId("local");
      setExternalDataApproved(false);
    }
  }, [providers, providerId]);

  const request: MarketAiSelectionRequest = {
    market,
    universeMode: market === "us" ? "watchlist" : "discovery",
    discovery: market === "us" ? {} : {
      ...discovery,
      minTurnoverRate: market === "crypto" ? undefined : discovery.minTurnoverRate,
      maxPe: market === "crypto" ? undefined : discovery.maxPe,
      sort: market === "crypto"
        && discovery.sort !== "changePct"
        && discovery.sort !== "amount"
        ? "changePct"
        : discovery.sort,
    },
    profile,
    horizon,
    providerId,
    externalDataApproved: providerId !== "local" && externalDataApproved,
  };
  const requestKey = JSON.stringify(request);
  const result = selection?.result ?? null;
  const isStale = Boolean(result && selection?.requestKey !== requestKey);
  const provider = providers.find((item) => item.providerId === providerId);
  const availableProviders = providers.length > 0
    ? providers
    : [{
        providerId: "local" as const,
        configured: true,
        model: null,
        sanitizedBaseUrl: null,
      }];
  const canRun = Boolean(
    selection
    && !selection.isLoading
    && (
      providerId === "local"
      || (provider?.configured && externalDataApproved)
    ),
  );
  const rows = result?.recommendations.length
    ? result.recommendations.map((recommendation) => ({
        candidate: recommendation,
        recommendation,
      }))
    : (result?.baselineCandidates ?? []).slice(0, 5).map((candidate) => ({
        candidate,
        recommendation: null,
      }));
  const reviewInputKey = `${reviewSelectionId.trim()}\u0000${reviewBenchmarkRunId.trim()}`;
  const reviewResult = selection?.review?.result;
  const visibleReviewResult = reviewResult?.selectionId === reviewSelectionId.trim()
    && reviewResult.benchmark.runId === reviewBenchmarkRunId.trim()
      ? reviewResult
      : null;

  return (
    <SurfacePanel
      className="design-market-ai-selection"
      title="AI 选股"
      subtitle="后端重新生成权威候选并冻结证据；结果仅用于优先研究，不会加入自选或触发交易"
    >
      <div aria-label="AI 选股市场" className="design-market-ai-market-tabs" role="group">
        {([
          ["ashare", "A 股全市场"],
          ["crypto", "Binance USDT"],
          ["us", "美股自选池"],
        ] as const).map(([value, label]) => (
          <button
            aria-pressed={market === value}
            className={market === value ? "active" : ""}
            key={value}
            onClick={() => setMarket(value)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <div className="design-market-ai-controls">
        <label>
          <span>风格档案</span>
          <select
            onChange={(event) => setProfile(event.currentTarget.value as MarketAiSelectionProfile)}
            value={profile}
          >
            <option value="balanced">均衡</option>
            {market !== "crypto" ? (
              <>
                <option value="quality_growth">质量成长</option>
                <option value="value">价值</option>
              </>
            ) : null}
            <option value="trend">趋势</option>
          </select>
        </label>
        <label>
          <span>研究周期</span>
          <select
            onChange={(event) => setHorizon(event.currentTarget.value as MarketAiSelectionHorizon)}
            value={horizon}
          >
            <option value="short">短期</option>
            <option value="medium">中期</option>
            <option value="long">长期</option>
          </select>
        </label>
        <label>
          <span>AI 服务</span>
          <select
            onChange={(event) => {
              setProviderId(event.currentTarget.value as AiReviewProviderId);
              setExternalDataApproved(false);
            }}
            value={providerId}
          >
            {availableProviders.map((item) => (
              <option
                disabled={!item.configured}
                key={item.providerId}
                value={item.providerId}
              >
                {aiProviderLabels[item.providerId]}
                {item.configured ? "" : "（未配置）"}
              </option>
            ))}
          </select>
        </label>
        <label className="design-market-ai-approval">
          <input
            checked={externalDataApproved}
            disabled={providerId === "local"}
            onChange={(event) => setExternalDataApproved(event.currentTarget.checked)}
            type="checkbox"
          />
          <span>允许向所选外部服务发送冻结后的研究证据字段</span>
        </label>
        <button
          className="design-primary-action"
          disabled={!canRun}
          onClick={() => selection?.onRun(request, requestKey)}
          type="button"
        >
          <Sparkles aria-hidden="true" size={14} />
          {selection?.isLoading ? "分析中…" : "AI 分析当前候选"}
        </button>
      </div>
      {providerId === "local" ? (
        <p className="design-market-ai-hint">
          本地基线不向外发送数据，将返回可复算的确定性研究排名。
        </p>
      ) : !provider?.configured ? (
        <p className="design-market-ai-state risk" role="alert">
          所选 AI 服务尚未配置，请先在设置页完成配置。
        </p>
      ) : !externalDataApproved ? (
        <p className="design-market-ai-hint">
          使用外部 AI 前需明确确认本次研究证据外发。
        </p>
      ) : null}
      {selection?.isLoading ? (
        <p className="design-market-ai-state" role="status">
          正在由后端生成权威候选、冻结证据并调用所选模型…
        </p>
      ) : null}
      {selection?.error ? (
        <p className="design-market-ai-state risk" role="alert">
          AI 选股未完成：{selection.error}。原条件筛选结果仍可继续使用。
        </p>
      ) : null}
      {result ? (
        <div className={`design-market-ai-result${isStale ? " stale" : ""}`}>
          <header className="design-market-ai-result-header">
            <div>
              <strong>
                {result.generation.status === "completed"
                  ? "AI 研究候选"
                  : result.generation.status === "failed"
                    ? "AI 分析失败，显示确定性基准"
                    : "确定性基准候选"}
              </strong>
              <span>
                {result.status === "partial" ? "部分数据" : "完整结果"}
                {" · "}{rows.length} 个候选
                {" · "}快照 {compactRunId(result.marketSnapshot.snapshotHash)}
              </span>
            </div>
            <span title={result.auditEventId}>审计 {compactRunId(result.auditEventId)}</span>
          </header>
          {isStale ? (
            <p className="design-market-ai-state warning" role="status">
              市场、筛选条件、风格、周期或 AI 服务已改变，旧结果已失效，请重新分析。
            </p>
          ) : null}
          {result.marketSnapshot.warnings.length > 0 ? (
            <ul className="design-market-screener-warnings">
              {result.marketSnapshot.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          ) : null}
          {rows.length === 0 ? (
            <p className="design-market-ai-state">
              当前没有可展示的研究候选；已排除 {result.exclusions.length} 项。
            </p>
          ) : (
            <div className="design-market-ai-results">
              {rows.map(({ candidate, recommendation }, index) => {
                const instrument = instrumentFor(candidate);
                const tierLabel = recommendation?.tier === "priority_research"
                  ? "优先研究"
                  : recommendation?.tier === "watch"
                    ? "观察"
                    : recommendation?.tier === "insufficient_evidence"
                      ? "证据不足"
                      : "基准候选";
                return (
                  <article key={candidate.evidenceId}>
                    <header>
                      <span className="design-market-ai-rank">{recommendation?.rank ?? index + 1}</span>
                      <div>
                        <strong>{candidate.symbol} · {candidate.name}</strong>
                        <span>{tierLabel}</span>
                      </div>
                      <strong className="design-market-ai-score">{candidate.score.toFixed(1)}</strong>
                    </header>
                    <div className="design-market-ai-pillars">
                      {Object.entries(candidate.pillarScores).map(([pillar, score]) => (
                        <span key={pillar}>
                          {pillarLabels[pillar] ?? pillar}<strong>{score.toFixed(1)}</strong>
                        </span>
                      ))}
                    </div>
                    <dl>
                      <div>
                        <dt>基本面期间</dt>
                        <dd>{candidate.fundamentalPeriod || "不适用"}</dd>
                      </div>
                      {recommendation?.summary ? (
                        <div><dt>研究摘要</dt><dd>{recommendation.summary}</dd></div>
                      ) : null}
                    </dl>
                    {recommendation?.reasons.length ? (
                      <p><strong>优先理由：</strong>{recommendation.reasons.join("；")}</p>
                    ) : null}
                    {recommendation?.risks.length ? (
                      <p className="risk"><strong>主要风险：</strong>{recommendation.risks.join("；")}</p>
                    ) : null}
                    {candidate.dataGaps.length ? (
                      <p className="warning"><strong>数据缺口：</strong>{candidate.dataGaps.join("；")}</p>
                    ) : null}
                    {recommendation?.evidenceReferences.length ? (
                      <small>证据引用 {recommendation.evidenceReferences.join(" · ")}</small>
                    ) : null}
                    <footer>
                      <button
                        className="design-link-button"
                        disabled={isStale}
                        onClick={() => selection?.onViewInstrument(instrument)}
                        type="button"
                      >
                        查看行情
                      </button>
                      <button
                        className="design-link-button"
                        disabled={isStale}
                        onClick={() => selection?.onResearchInstrument(instrument, {
                          selectionId: result.selectionId,
                          candidateEvidenceId: candidate.evidenceId,
                        })}
                        type="button"
                      >
                        开始研究
                      </button>
                    </footer>
                  </article>
                );
              })}
            </div>
          )}
          {result.exclusions.length > 0 ? (
            <details className="design-market-ai-exclusions">
              <summary>已排除 {result.exclusions.length} 项</summary>
              <ul>
                {result.exclusions.map((item, index) => (
                  <li key={`${item.market}-${item.symbol}-${index}`}>
                    {item.symbol} / {item.name} · {item.reason}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          <p className="design-market-ai-boundary">
            本结果仅切换研究上下文，不修改自选、风控、自动交易或订单路由。
          </p>
        </div>
      ) : null}
      <div className="design-market-ai-review">
        <header className="design-market-ai-review-header">
          <div>
            <strong>到期收益与基准复盘</strong>
            <span>只读取受保护选股证据、已绑定研究证据与服务端已完成日 K</span>
          </div>
          {visibleReviewResult ? (
            <span title={visibleReviewResult.reviewId}>审计 {compactRunId(visibleReviewResult.reviewId)}</span>
          ) : null}
        </header>
        <form
          aria-label="AI 选股到期复盘"
          className="design-market-ai-review-form"
          onSubmit={(event) => {
            event.preventDefault();
            const selectionId = reviewSelectionId.trim();
            const benchmarkRunId = reviewBenchmarkRunId.trim();
            if (selectionId && benchmarkRunId) {
              setReviewSubmittedKey(`${selectionId}\u0000${benchmarkRunId}`);
              selection?.review?.onRun({ selectionId, benchmarkRunId });
            }
          }}
        >
          <label>
            <span>选股记录 ID</span>
            <input
              onChange={(event) => setReviewSelectionId(event.currentTarget.value)}
              placeholder="selection-…"
              value={reviewSelectionId}
            />
          </label>
          <label>
            <span>基准研究运行 ID</span>
            <input
              onChange={(event) => setReviewBenchmarkRunId(event.currentTarget.value)}
              placeholder="run-…"
              value={reviewBenchmarkRunId}
            />
          </label>
          <button
            className="design-secondary-action"
            disabled={
              !selection?.review
              || selection.review.isLoading
              || !reviewSelectionId.trim()
              || !reviewBenchmarkRunId.trim()
            }
            type="submit"
          >
            <RefreshCw
              aria-hidden="true"
              className={selection?.review?.isLoading ? "spin" : undefined}
              size={13}
            />
            {selection?.review?.isLoading ? "复盘中…" : "运行复盘"}
          </button>
        </form>
        <p className="design-market-ai-hint">
          基准由已审计研究运行明确指定；浏览器不提交价格、收益、K 线或命中事实。
        </p>
        {selection?.review?.error && reviewSubmittedKey === reviewInputKey ? (
          <p className="design-market-ai-state risk" role="alert">
            复盘未完成：{selection.review.error}
          </p>
        ) : null}
        {visibleReviewResult ? (
          <div className="design-market-ai-review-result">
            <div className="design-market-ai-review-summary">
              <span>推荐数 {visibleReviewResult.summary.recommendationCount}</span>
              <span>已到期 {visibleReviewResult.summary.maturedCount}</span>
              <span>观察中 {visibleReviewResult.summary.observingCount}</span>
              <span>数据不足 {visibleReviewResult.summary.dataInsufficientCount}</span>
              <strong>
                绝对收益命中 {hitRate(
                  visibleReviewResult.summary.absoluteHitCount,
                  visibleReviewResult.summary.absoluteSampleCount,
                  visibleReviewResult.summary.absoluteHitRatePct,
                )}
              </strong>
              <strong>
                相对基准命中 {hitRate(
                  visibleReviewResult.summary.benchmarkHitCount,
                  visibleReviewResult.summary.benchmarkSampleCount,
                  visibleReviewResult.summary.benchmarkHitRatePct,
                )}
              </strong>
            </div>
            <div className="design-market-ai-results design-market-ai-review-items">
              {visibleReviewResult.items.map((item) => (
                <article key={item.candidateEvidenceId}>
                  <header>
                    <span className="design-market-ai-rank">{item.rank}</span>
                    <div>
                      <strong>{item.symbol}</strong>
                      <span>
                        {marketAiSelectionHorizonLabels[item.horizon]}
                        {" · 持有周期目标 "}{item.horizonBars} 根已完成日 K
                      </span>
                    </div>
                    <Status tone={item.status === "completed"
                      ? "positive"
                      : item.status === "observing" ? "warning" : "risk"}
                    >
                      {item.status === "completed"
                        ? "已到期"
                        : item.status === "observing" ? "观察中" : "数据不足"}
                    </Status>
                  </header>
                  {item.status === "completed" ? (
                    <dl>
                      <div><dt>到期收益</dt><dd>{percentage(item.returnPct)}</dd></div>
                      <div>
                        <dt>同周期基准</dt>
                        <dd>
                          基准 {item.benchmarkSymbol} {percentage(item.benchmarkReturnPct)}
                          {" · "}相对 {percentage(item.relativeReturnPct)}
                        </dd>
                      </div>
                    </dl>
                  ) : item.status === "observing" ? (
                    <p className="warning">
                      已完成 {item.completedBars} 根，还需 {item.remainingBars} 根已完成日 K。
                    </p>
                  ) : (
                    <>
                      {typeof item.returnPct === "number" ? (
                        <dl><div><dt>到期收益</dt><dd>{percentage(item.returnPct)}</dd></div></dl>
                      ) : null}
                      <p className="risk">
                        {item.completedBars === item.horizonBars ? "持有周期已到期；" : ""}
                        {reviewReasonLabels[item.reason] ?? item.reason}
                      </p>
                    </>
                  )}
                  <small>
                    参考 {new Date(item.referenceAt).toLocaleDateString("zh-CN")}
                    {" · "}证据 {compactRunId(item.candidateEvidenceId)}
                  </small>
                </article>
              ))}
            </div>
            <p className="design-market-ai-boundary">
              仅用于研究复盘；不生成买卖、仓位、授权、风控或订单指令。
            </p>
          </div>
        ) : null}
      </div>
      <div className="design-market-ai-review">
        <header className="design-market-ai-review-header">
          <div>
            <strong>选股质量统计</strong>
            <span>仅回放受保护选股与到期复盘审计，不接受浏览器收益事实</span>
          </div>
          <button
            className="design-link-button"
            disabled={selection?.statistics?.isLoading}
            onClick={selection?.statistics?.onRefresh}
            type="button"
          >
            <RefreshCw
              aria-hidden="true"
              className={selection?.statistics?.isLoading ? "spin" : undefined}
              size={12}
            />
            {selection?.statistics?.isLoading ? "刷新中…" : "刷新统计"}
          </button>
        </header>
        {selection?.statistics?.isLoading && !selection.statistics.result ? (
          <p className="design-market-ai-state" role="status">正在回放审计统计…</p>
        ) : null}
        {selection?.statistics?.error ? (
          <p className="design-market-ai-state risk" role="alert">
            质量统计未刷新：{selection.statistics.error}
          </p>
        ) : null}
        {selection?.statistics?.result ? (
          <div className="design-market-ai-review-result">
            <div className="design-market-ai-review-summary">
              <span>已审计选股 {selection.statistics.result.selectionCount}</span>
              <strong>
                候选合格 {hitRate(
                  selection.statistics.result.candidateQualification.qualifiedCount,
                  selection.statistics.result.candidateQualification.sampleCount,
                  selection.statistics.result.candidateQualification.ratePct,
                )}
              </strong>
              <strong>
                选股运行数据源降级 {hitRate(
                  selection.statistics.result.dataSourceDegradation.degradedCount,
                  selection.statistics.result.dataSourceDegradation.sampleCount,
                  selection.statistics.result.dataSourceDegradation.ratePct,
                )}
              </strong>
              <strong>
                AI 成功 {hitRate(
                  selection.statistics.result.aiSuccess.successCount,
                  selection.statistics.result.aiSuccess.sampleCount,
                  selection.statistics.result.aiSuccess.ratePct,
                )}
              </strong>
            </div>
            <details className="design-market-ai-exclusions">
              <summary>
                主要排除原因 · 排除样本 {selection.statistics.result.majorExclusions.excludedCount}
              </summary>
              {selection.statistics.result.majorExclusions.reasons.length ? (
                <ul>
                  {selection.statistics.result.majorExclusions.reasons.map((item) => (
                    <li key={item.reason}>
                      {item.reason} · {hitRate(
                        item.count,
                        selection.statistics?.result?.majorExclusions.excludedCount ?? 0,
                        item.ratePct,
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </details>
            <div className="design-market-ai-results design-market-ai-review-items">
              {selection.statistics.result.stylePerformance.map((item, index) => (
                <article key={item.profile}>
                  <header>
                    <span className="design-market-ai-rank">{index + 1}</span>
                    <div>
                      <strong>{marketAiSelectionProfileLabels[item.profile]}</strong>
                      <span>
                        {marketAiSelectionProfileLabels[item.profile]}
                        {" · 选股 "}{item.selectionCount}
                        {" · 已复盘 "}{item.reviewedSelectionCount}
                      </span>
                    </div>
                    <Status tone={item.absoluteSampleCount ? "positive" : "neutral"}>
                      n={item.absoluteSampleCount}
                    </Status>
                  </header>
                  <dl>
                    <div>
                      <dt>绝对收益命中</dt>
                      <dd>{hitRate(item.absoluteHitCount, item.absoluteSampleCount, item.absoluteHitRatePct)}</dd>
                    </div>
                    <div>
                      <dt>相对基准命中</dt>
                      <dd>{hitRate(item.benchmarkHitCount, item.benchmarkSampleCount, item.benchmarkHitRatePct)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
            {selection.statistics.result.researchValueCohorts?.length ? (
              <details className="design-market-ai-exclusions">
                <summary>
                  稳定研究价值 · {selection.statistics.result.researchValueCohorts.length} 个独立 cohort
                </summary>
                <div className="design-market-ai-results design-market-ai-review-items">
                  {selection.statistics.result.researchValueCohorts.map((cohort) => (
                    <article key={cohort.cohortId}>
                      <header>
                        <div>
                          <strong>
                            {cohort.market === "ashare" ? "A 股" : cohort.market === "us" ? "美股" : "加密资产"}
                            {" · "}{marketAiSelectionProfileLabels[cohort.profile]}
                          </strong>
                          <span>
                            {marketAiSelectionHorizonLabels[cohort.horizon]}
                            {" · "}{cohort.weightsVersion} · 基准 {cohort.benchmarkSymbol}
                          </span>
                        </div>
                        <Status tone={cohort.status === "stable_positive" ? "positive" : "neutral"}>
                          {researchValueStatusLabels[cohort.status]}
                        </Status>
                      </header>
                      <dl>
                        <div><dt>非重叠到期批次</dt><dd>n={cohort.nonOverlappingSampleCount} · 重叠 {cohort.overlappingSampleCount}</dd></div>
                        <div><dt>固定基准覆盖</dt><dd>{cohort.benchmarkSampleCount} / {cohort.recommendationSampleCount} · {cohort.benchmarkCoveragePct?.toFixed(1) ?? "—"}%</dd></div>
                        <div><dt>批次相对命中</dt><dd>{hitRate(cohort.relativeHitCount, cohort.nonOverlappingSampleCount, cohort.relativeHitRatePct)}</dd></div>
                        <div><dt>95% Wilson 下界</dt><dd>{cohort.relativeHitWilsonLowerPct?.toFixed(1) ?? "—"}%</dd></div>
                        <div><dt>批次中位 alpha</dt><dd>{cohort.medianBatchAlphaPct === null ? "—" : percentage(cohort.medianBatchAlphaPct)}</dd></div>
                        <div><dt>自然月覆盖</dt><dd>{cohort.calendarMonthCount} 个月</dd></div>
                      </dl>
                    </article>
                  ))}
                </div>
              </details>
            ) : null}
            <p className="design-market-ai-boundary">
              仅汇总受保护审计样本；不自动加入观察池、运行研究或连接订单与生产交易。
            </p>
          </div>
        ) : null}
      </div>
    </SurfacePanel>
  );
}
