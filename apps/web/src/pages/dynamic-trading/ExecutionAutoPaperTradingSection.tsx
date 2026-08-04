import {
  Activity, Bot, ChevronRight, CirclePause, Play, RefreshCw, Save, ShieldCheck, WalletCards
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { buildApiUrl, type WorkspaceFetcher } from "../../lib/terminal-api";
import "./AutoTradingControls.layout.css";
import "./DynamicTradingControls.layout.css";
import "./DynamicTradingPage.layout.css";
import {
  authorizeAutoLiveSession, formatTime, liveAuthorizationLabel, startAutoLiveSession,
  type AutoTradingHistoryEvent, type AutoTradingSnapshot, type AutoTradingState
} from "../shared/auto-trading-contract";
import {
  AUTO_TRADING_STATUS_REFRESH_INTERVAL_MS, autoTradingActionPath, autoTradingAttention,
  autoTradingCycleCountdown, autoTradingDailyDrawdown, autoTradingErrorMessage,
  autoTradingNotification, autoTradingProfitDrawdown, autoTradingRuntimeHealth,
  decisionLabel, defaultDraft, defaultFetcher, executionModeLabel, formatFeeBreakdown, formatNumber,
  hasUnresolvedAutoOrder, isMonitoringSnapshot, money, numberValue, orderStateLabel,
  loadAutoTradingSnapshot, percent, percentRate, providerLabel, riskDecisionLabel,
  showBuiltInAutoTradingSignalControls, signedMoney, stringValue,
  type Draft, type DynamicTradingInstrument, type MonitoringSnapshot,
  type SystemNotificationPermission
} from "./auto-trading-model";
import {
  AutoTradingEconomicsSummary, AutoTradingLedger, AutoTradingProductionStrategyOverview,
  AutoTradingRiskOverview, AutoTradingRuntimeHealth, AutoTradingServerMonitoring
} from "./AutoTradingOverviewPanels";

export {
  authorizeAutoLiveSession, liveAuthorizationLabel, startAutoLiveSession,
  type AutoTradingEconomics, type AutoTradingSnapshot, type AutoTradingState
} from "../shared/auto-trading-contract";
export {
  AUTO_TRADING_STATUS_REFRESH_INTERVAL_MS, autoTradingActionPath, autoTradingAttention,
  autoTradingCycleCountdown, autoTradingDailyDrawdown, autoTradingErrorMessage,
  autoTradingNotification, autoTradingProfitDrawdown, autoTradingRuntimeHealth,
  hasUnresolvedAutoOrder, isMonitoringSnapshot, loadAutoTradingSnapshot,
  showBuiltInAutoTradingSignalControls, type DynamicTradingInstrument, type MonitoringSnapshot
} from "./auto-trading-model";
export {
  AutoTradingEconomicsSummary, AutoTradingLedger, AutoTradingProductionStrategyOverview,
  AutoTradingRiskOverview, AutoTradingRuntimeHealth, AutoTradingServerMonitoring
} from "./AutoTradingOverviewPanels";

export function ExecutionAutoPaperTradingSection({
  baseUrl,
  chart,
  fetcher = defaultFetcher,
  instruments = [],
  onOpenAudit,
  onOpenExecution,
  onSafetyChange,
  onSnapshotChange,
  onSelectInstrument,
  selectedSymbol,
  variant = "section",
  workflowGuide
}: {
  baseUrl: string;
  chart?: ReactNode;
  fetcher?: WorkspaceFetcher;
  instruments?: DynamicTradingInstrument[];
  onOpenAudit?: () => void;
  onOpenExecution?: () => void;
  onSafetyChange?: (
    executionMode: AutoTradingState["executionMode"],
    liveTradingAllowed: boolean
  ) => void;
  onSnapshotChange?: (snapshot: AutoTradingSnapshot | null) => void;
  onSelectInstrument?: (instrument: DynamicTradingInstrument) => void;
  selectedSymbol?: string;
  variant?: "section" | "workspace";
  workflowGuide?: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<AutoTradingSnapshot | null>(null);
  const [monitoring, setMonitoring] = useState<MonitoringSnapshot | null>(null);
  const [draft, setDraft] = useState<Draft>(defaultDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusReadError, setStatusReadError] = useState<string | null>(null);
  const [monitoringReadError, setMonitoringReadError] = useState<string | null>(null);
  const [testnetConfirmed, setTestnetConfirmed] = useState(false);
  const [liveConfirmed, setLiveConfirmed] = useState(false);
  const [instrumentFilter, setInstrumentFilter] = useState<"all" | "crypto" | "other">("all");
  const [controlTab, setControlTab] = useState<"runtime" | "risk" | "authorization">("runtime");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState<string | null>(null);
  const [clockNowMs, setClockNowMs] = useState(() => Date.now());
  const [notificationPermission, setNotificationPermission] = useState<SystemNotificationPermission>(
    () => typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const mountedRef = useRef(true);
  const snapshotReadRequestIdRef = useRef(0);
  const monitoringReadRequestIdRef = useRef(0);
  const requestInFlight = useRef(false);
  const lastNotificationKey = useRef<string | null>(null);
  const commitSnapshot = useCallback((next: AutoTradingSnapshot | null) => {
    if (!mountedRef.current) return;
    setSnapshot(next);
    onSnapshotChange?.(next);
  }, [onSnapshotChange]);

  const request = useCallback(async <T,>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetcher(buildApiUrl(baseUrl, path), init);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(
        typeof payload === "object" && payload && "detail" in payload
          ? String(payload.detail)
          : `HTTP ${response.status}`
      );
    }
    return payload as T;
  }, [baseUrl, fetcher]);

  const load = useCallback(async () => {
    const requestId = snapshotReadRequestIdRef.current + 1;
    snapshotReadRequestIdRef.current = requestId;
    try {
      const next = await loadAutoTradingSnapshot(baseUrl, fetcher);
      if (!mountedRef.current || snapshotReadRequestIdRef.current !== requestId) return;
      commitSnapshot(next);
      setDraft({
        triggerPct: next.state.triggerPct,
        orderNotional: next.state.orderNotional,
        stopLossPct: next.state.stopLossPct,
        takeProfitPct: next.state.takeProfitPct,
        dailyLossLimitPct: next.state.dailyLossLimitPct,
        dailyProfitDrawdownLimitPct: next.state.dailyProfitDrawdownLimitPct ?? 2,
        maxTradesPerHour: next.state.maxTradesPerHour,
        providerId: next.state.providerId,
        executionMode: next.state.executionMode,
        liveOperator: next.state.liveOperator
      });
      setTestnetConfirmed(next.state.testnetConfirmed);
      setLiveConfirmed(next.state.liveConfirmed);
      setError(null);
      setStatusReadError(null);
    } catch (loadError) {
      if (!mountedRef.current || snapshotReadRequestIdRef.current !== requestId) return;
      const detail = autoTradingErrorMessage(loadError);
      commitSnapshot(null);
      setError(detail);
      setStatusReadError(detail);
    }
  }, [baseUrl, commitSnapshot, fetcher]);

  const refreshMonitoring = useCallback(async () => {
    const requestId = monitoringReadRequestIdRef.current + 1;
    monitoringReadRequestIdRef.current = requestId;
    try {
      const next = await request<unknown>("api/operations/monitoring");
      if (!mountedRef.current || monitoringReadRequestIdRef.current !== requestId) return;
      if (!isMonitoringSnapshot(next)) throw new Error("operations_monitoring_snapshot_invalid");
      setMonitoring(next);
      setMonitoringReadError(null);
    } catch (monitoringError) {
      if (!mountedRef.current || monitoringReadRequestIdRef.current !== requestId) return;
      setMonitoringReadError(autoTradingErrorMessage(monitoringError));
    }
  }, [request]);

  const evaluate = useCallback(async () => {
    if (requestInFlight.current) {
      return;
    }
    requestInFlight.current = true;
    snapshotReadRequestIdRef.current += 1;
    setControlTab("runtime");
    setEvaluating(true);
    setEvaluationFeedback(null);
    try {
      const next = await request<AutoTradingSnapshot>(
        autoTradingActionPath(snapshot?.state),
        { method: "POST" }
      );
      if (!mountedRef.current) return;
      commitSnapshot(next);
      setEvaluationFeedback(
        `${hasUnresolvedAutoOrder(snapshot?.state) ? "对账" : "评估"}完成 · `
        + `${decisionLabel(next.state.lastDecision?.action)} · `
        + formatTime(next.state.lastDecision?.evaluatedAt ?? new Date().toISOString())
      );
      setError(null);
      setStatusReadError(null);
    } catch (evaluationError) {
      if (!mountedRef.current) return;
      setEvaluationFeedback(null);
      setError(autoTradingErrorMessage(evaluationError));
    } finally {
      if (mountedRef.current) setEvaluating(false);
      requestInFlight.current = false;
    }
  }, [commitSnapshot, request, snapshot?.state]);

  const refresh = useCallback(async () => {
    if (requestInFlight.current) return;
    const requestId = snapshotReadRequestIdRef.current + 1;
    snapshotReadRequestIdRef.current = requestId;
    try {
      const next = await loadAutoTradingSnapshot(baseUrl, fetcher);
      if (!mountedRef.current || snapshotReadRequestIdRef.current !== requestId) return;
      commitSnapshot(next);
      setError(null);
      setStatusReadError(null);
    } catch (refreshError) {
      if (!mountedRef.current || snapshotReadRequestIdRef.current !== requestId) return;
      const detail = autoTradingErrorMessage(refreshError);
      commitSnapshot(null);
      setError(detail);
      setStatusReadError(detail);
    }
  }, [baseUrl, commitSnapshot, fetcher]);

  const save = useCallback(async (enabled: boolean) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    snapshotReadRequestIdRef.current += 1;
    setBusy(true);
    try {
      const next = await request<AutoTradingSnapshot>("api/execution/auto-paper-trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, enabled, testnetConfirmed, liveConfirmed })
      });
      if (!mountedRef.current) return;
      commitSnapshot(next);
      setTestnetConfirmed(next.state.testnetConfirmed);
      setLiveConfirmed(next.state.liveConfirmed);
      setError(null);
      setStatusReadError(null);
    } catch (saveError) {
      if (!mountedRef.current) return;
      setError(autoTradingErrorMessage(saveError));
    } finally {
      if (mountedRef.current) setBusy(false);
      requestInFlight.current = false;
    }
  }, [commitSnapshot, draft, liveConfirmed, request, testnetConfirmed]);

  useEffect(() => {
    if (snapshot) onSafetyChange?.(snapshot.state.executionMode, snapshot.liveTradingAllowed);
  }, [onSafetyChange, snapshot]);
  useEffect(() => {
    mountedRef.current = true;
    void load();
    void refreshMonitoring();
    const intervalId = window.setInterval(() => {
      void refresh();
      void refreshMonitoring();
    }, AUTO_TRADING_STATUS_REFRESH_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      snapshotReadRequestIdRef.current += 1;
      monitoringReadRequestIdRef.current += 1;
      window.clearInterval(intervalId);
    };
  }, [load, refresh, refreshMonitoring]);
  useEffect(() => {
    setClockNowMs(Date.now());
    if (!snapshot?.state.enabled) return;
    const intervalId = window.setInterval(() => setClockNowMs(Date.now()), 1_000);
    return () => window.clearInterval(intervalId);
  }, [snapshot?.state.enabled]);

  const state = snapshot?.state;
  const notification = autoTradingNotification(state, Date.now(), statusReadError);
  useEffect(() => {
    if (notificationPermission !== "granted" || typeof Notification === "undefined") return;
    if (!notification) {
      lastNotificationKey.current = null;
      return;
    }
    if (lastNotificationKey.current === notification.key) return;
    try {
      new Notification(`自动交易：${notification.title}`, {
        body: notification.body,
        tag: `aiqt-auto-trading-${notification.key}`
      });
      lastNotificationKey.current = notification.key;
    } catch {
      setNotificationPermission(Notification.permission);
    }
  }, [notification, notificationPermission]);

  const enableNotifications = async () => {
    if (typeof Notification === "undefined") return;
    try {
      setNotificationPermission(await Notification.requestPermission());
    } catch {
      setNotificationPermission(Notification.permission);
    }
  };
  const hasUnresolvedOrder = hasUnresolvedAutoOrder(state);
  const attention = autoTradingAttention(state);
  const testnetMode = draft.executionMode === "testnet";
  const liveMode = draft.executionMode === "live";
  const modeLabel = liveMode ? "币安现货生产实盘"
    : testnetMode ? "币安现货测试网" : "模拟账户";
  const updateNumber = (key: keyof Draft, value: string) => {
    setDraft((current) => ({ ...current, [key]: Number(value) }));
  };

  if (variant === "workspace") {
    const runtime = autoTradingRuntimeHealth(state);
    const lossDrawdown = autoTradingDailyDrawdown(state);
    const profitDrawdown = autoTradingProfitDrawdown(state);
    const usedTrades = state?.tradeTimestamps.length ?? 0;
    const remainingTrades = Math.max(0, (state?.maxTradesPerHour ?? 0) - usedTrades);
    const contract = state?.lastDecisionContract;
    const orderIntent = contract?.orderIntent;
    const shownInstruments: DynamicTradingInstrument[] = instruments.length
      ? instruments
      : [{
          symbol: state?.symbol ?? "BTC/USDT",
          name: "Bitcoin",
          market: "crypto" as const,
          price: null,
          changePct: state?.windowChangePct ?? 0
        }];
    const filteredInstruments = shownInstruments.filter((instrument) =>
      instrumentFilter === "all"
      || (instrumentFilter === "crypto" ? instrument.market === "crypto" : instrument.market !== "crypto")
    );
    const activeInstrument = shownInstruments.find((instrument) => instrument.symbol === (selectedSymbol ?? state?.symbol))
      ?? shownInstruments[0];
    const viewingAutoSymbol = activeInstrument?.symbol === (state?.symbol ?? "BTC/USDT");
    const secondsUntilNextCycle = autoTradingCycleCountdown(state, clockNowMs);
    const currentOrderState = state?.lastOrderResult?.state
      ?? (state?.executionMode === "live" ? state.lastLiveOrder?.state : state?.lastTestnetOrder?.state);

    return (
      <section className="dynamic-trading-workspace" aria-labelledby="dynamic-trading-title">
        {workflowGuide ? (
          <details className="design-workflow-guide-disclosure">
            <summary>完整流程与审计证据</summary>
            {workflowGuide}
          </details>
        ) : null}
        <header className="dynamic-trading-heading">
          <div>
            <span>自动交易控制台</span>
            <h2 id="dynamic-trading-title">动态交易</h2>
            <p>查看自动策略从行情快照、AI 判断、风险调整到委托结果的完整进程。</p>
          </div>
          <div className="dynamic-trading-heading-status">
            <span className={`dynamic-trading-status ${runtime.tone}`}>
              <Activity size={13} />
              {runtime.title}
            </span>
            <span className={`dynamic-trading-status ${snapshot?.liveTradingAllowed ? "healthy" : "warning"}`}>
              <ShieldCheck size={13} />
              {snapshot?.liveTradingAllowed ? "生产会话有效" : "生产闸门保护中"}
            </span>
          </div>
        </header>

        <div className="dynamic-trading-terminal">
          <aside className="dynamic-trading-watchlist">
            <header>
              <div>
                <strong>策略标的</strong>
                <span>{shownInstruments.length} 个已关注</span>
              </div>
              <small>自动 / 观察</small>
            </header>
            <div aria-label="策略标的筛选" className="dynamic-trading-watchlist-tabs" role="tablist">
              <button aria-selected={instrumentFilter === "all"}
                className={instrumentFilter === "all" ? "active" : ""}
                onClick={() => setInstrumentFilter("all")} role="tab" type="button">全部</button>
              <button aria-selected={instrumentFilter === "crypto"}
                className={instrumentFilter === "crypto" ? "active" : ""}
                onClick={() => setInstrumentFilter("crypto")} role="tab" type="button">加密货币</button>
              <button aria-selected={instrumentFilter === "other"}
                className={instrumentFilter === "other" ? "active" : ""}
                onClick={() => setInstrumentFilter("other")} role="tab" type="button">其他市场</button>
            </div>
            <div className="dynamic-trading-watchlist-rows">
              {filteredInstruments.map((instrument) => {
                const active = instrument.symbol === activeInstrument?.symbol;
                return (
                  <button
                    className={active ? "active" : ""}
                    key={`${instrument.market}-${instrument.symbol}`}
                    onClick={() => onSelectInstrument?.(instrument)}
                    type="button"
                  >
                    <span>
                      <strong>{instrument.symbol}</strong>
                      <small>{instrument.name} · {instrument.market}</small>
                    </span>
                    <span>
                      <strong>{instrument.price?.toLocaleString("zh-CN", { maximumFractionDigits: 4 }) ?? "—"}</strong>
                      <small className={instrument.changePct < 0 ? "negative" : "positive"}>
                        {instrument.changePct >= 0 ? "+" : ""}{instrument.changePct.toFixed(2)}%
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
            <footer>
              <span>生产自动交易</span>
              <strong>{state?.symbol ?? "BTC/USDT"} · {state?.timeframe ?? "1m"}</strong>
              <small>其他标的仅用于行情观察，不会改变后端固定交易标的。</small>
            </footer>
          </aside>

          <section className="dynamic-trading-chart-panel">
            <header>
              <div>
                <span>
                  {activeInstrument?.symbol ?? state?.symbol ?? "BTC/USDT"} · {viewingAutoSymbol ? "现货自动标的" : "行情观察"}
                </span>
                <strong>
                  {activeInstrument?.price?.toLocaleString("zh-CN", { maximumFractionDigits: 4 }) ?? "—"}
                  <em className={(state?.windowChangePct ?? 0) < 0 ? "negative" : "positive"}>
                    {percent(state?.windowChangePct)}
                  </em>
                </strong>
              </div>
              <dl>
                <div>
                  <dt>时间周期</dt>
                  <dd>{state?.timeframe ?? "1m"}</dd>
                </div>
                <div>
                  <dt>最近判断</dt>
                  <dd>{viewingAutoSymbol ? decisionLabel(state?.lastDecision?.action) : "仅观察"}</dd>
                </div>
                <div>
                  <dt>置信度</dt>
                  <dd>{viewingAutoSymbol && state?.lastDecision ? `${Math.round(state.lastDecision.confidence * 100)}%` : "—"}</dd>
                </div>
                <div>
                  <dt>数据快照</dt>
                  <dd title={viewingAutoSymbol ? contract?.marketSnapshot.snapshotHash : undefined}>
                    {viewingAutoSymbol ? contract?.marketSnapshot.snapshotHash.slice(0, 10) ?? "等待评估" : "观察行情"}
                  </dd>
                </div>
              </dl>
            </header>
            <div className="dynamic-trading-chart">
              {chart ?? <span className="dynamic-trading-chart-empty">正在读取行情图表…</span>}
            </div>
            <footer>
              <span><i className="positive" /> 买入 / 上涨</span>
              <span><i className="negative" /> 卖出 / 下跌</span>
              <span><i className="decision" /> 自动决策</span>
              <small>
                {viewingAutoSymbol
                  ? state?.lastDecision?.reason ?? "等待首次自动评估后显示判断依据"
                  : `此标的仅用于行情观察；自动交易目标仍为 ${state?.symbol ?? "BTC/USDT"}。`}
              </small>
            </footer>
          </section>

          <aside className="dynamic-trading-control-panel">
            <header>
              <div>
                <strong>自动交易控制</strong>
                <span>后台持续运行</span>
              </div>
              <span className={`dynamic-trading-runner-dot ${state?.enabled ? "active" : ""}`} />
            </header>
            <div aria-label="控制信息分区" className="dynamic-trading-control-sections" role="tablist">
              <button aria-selected={controlTab === "runtime"}
                className={controlTab === "runtime" ? "active" : ""}
                onClick={() => setControlTab("runtime")} role="tab" type="button">运行状态</button>
              <button aria-selected={controlTab === "risk"}
                className={controlTab === "risk" ? "active" : ""}
                onClick={() => setControlTab("risk")} role="tab" type="button">风险参数</button>
              <button aria-selected={controlTab === "authorization"}
                className={controlTab === "authorization" ? "active" : ""}
                onClick={() => setControlTab("authorization")} role="tab" type="button">授权证据</button>
            </div>
            <div className="dynamic-trading-control-view" hidden={controlTab !== "runtime"}>
              <div className={`dynamic-trading-cycle ${state?.enabled ? "active" : ""}`}>
                <span>
                  <strong><Activity size={12} />{state?.enabled ? "监控运行中" : "监控已暂停"}</strong>
                  <small>{modeLabel}</small>
                </span>
                <span>
                  <strong>{secondsUntilNextCycle === null ? "—" : `${secondsUntilNextCycle}s`}</strong>
                  <small>
                    {state?.enabled ? "至下次评估" : "监控已暂停"} / {state?.runnerIntervalSeconds ?? 35}s
                  </small>
                </span>
              </div>
              <section className="dynamic-trading-decision-card">
                <span>最近自动判断</span>
                <strong>{decisionLabel(state?.lastDecision?.action)}</strong>
                <em>{state?.lastDecision ? `${Math.round(state.lastDecision.confidence * 100)}% 置信度` : "等待首次判断"}</em>
                <p aria-live="polite">{evaluationFeedback
                  ?? state?.lastDecision?.reason
                  ?? "后台完成下一轮评估后，将在这里展示判断理由。"}</p>
              </section>
            </div>

            <div className="dynamic-trading-control-view" hidden={controlTab !== "risk"}>
              <div className="dynamic-trading-control-form">
                <label>执行模式
                  <select value={draft.executionMode} onChange={(event) => {
                    const executionMode = event.target.value as Draft["executionMode"];
                    setDraft((current) => ({ ...current, executionMode }));
                    if (executionMode === "paper") setTestnetConfirmed(false);
                    if (executionMode !== "live") setLiveConfirmed(false);
                  }}>
                    <option value="paper">纸面模拟</option>
                    <option value="testnet">币安测试网</option>
                    <option value="live">币安生产实盘</option>
                  </select>
                </label>
                <label>AI 服务
                  <select value={draft.providerId}
                    onChange={(event) => setDraft((current) => ({ ...current, providerId: event.target.value }))}>
                    <option value="auto">自动选择</option>
                    {snapshot?.providers.map((provider) => (
                      <option disabled={!provider.configured} key={provider.providerId} value={provider.providerId}>
                        {providerLabel(provider.providerId)}{provider.configured ? "" : "（未配置）"}
                      </option>
                    ))}
                  </select>
                </label>
                <NumberField label="触发涨跌幅 %（0.05–20）" min={0.05} max={20} step={0.05}
                  value={draft.triggerPct} onChange={(value) => updateNumber("triggerPct", value)} />
                <NumberField label="单笔上限 USDT" min={1} max={10} step={1}
                  value={draft.orderNotional} onChange={(value) => updateNumber("orderNotional", value)} />
                <NumberField label="止损 %" min={0.1} max={20} step={0.1}
                  value={draft.stopLossPct} onChange={(value) => updateNumber("stopLossPct", value)} />
                <NumberField label="止盈 %" min={0.1} max={50} step={0.1}
                  value={draft.takeProfitPct} onChange={(value) => updateNumber("takeProfitPct", value)} />
                <NumberField label="亏损回撤上限 %" min={0.1} max={20} step={0.1}
                  value={draft.dailyLossLimitPct} onChange={(value) => updateNumber("dailyLossLimitPct", value)} />
                <NumberField label="盈利回撤上限 %" min={0.1} max={20} step={0.1}
                  value={draft.dailyProfitDrawdownLimitPct}
                  onChange={(value) => updateNumber("dailyProfitDrawdownLimitPct", value)} />
                <NumberField label="每小时最多成交" min={1} max={60} step={1}
                  value={draft.maxTradesPerHour} onChange={(value) => updateNumber("maxTradesPerHour", value)} />
              </div>
              <dl className="dynamic-trading-control-kpis">
                <div><dt>亏损回撤</dt><dd>{lossDrawdown.toFixed(2)}%</dd></div>
                <div><dt>盈利回撤</dt><dd>{profitDrawdown.toFixed(2)}%</dd></div>
                <div><dt>小时额度</dt><dd>{remainingTrades} / {state?.maxTradesPerHour ?? 0} 次</dd></div>
                <div><dt>连续失败</dt><dd>{state?.consecutiveRunnerFailures ?? 0} 次</dd></div>
              </dl>
            </div>

            <div className="dynamic-trading-control-view" hidden={controlTab !== "authorization"}>
              <div className={`dynamic-trading-authorization ${snapshot?.liveTradingAllowed ? "active" : ""}`}>
                <span>
                  {liveMode
                    ? snapshot?.liveTradingAllowed ? "生产授权有效" : "生产授权待确认"
                    : "当前为非生产模式"}
                </span>
                <strong>
                  {liveMode && snapshot?.liveTradingAllowed
                    ? liveAuthorizationLabel(state)
                    : liveMode ? "需实名操作人与真实资金确认" : modeLabel}
                </strong>
              </div>

              {testnetMode ? (
                <label className="dynamic-trading-confirmation">
                  <input checked={testnetConfirmed}
                    onChange={(event) => setTestnetConfirmed(event.target.checked)} type="checkbox" />
                  确认向币安测试网提交委托
                </label>
              ) : null}
              {liveMode && !snapshot?.liveTradingAllowed ? (
                <div className="dynamic-trading-live-confirmation">
                  <label>实名操作人
                    <input value={draft.liveOperator}
                      onChange={(event) => setDraft((current) => ({ ...current, liveOperator: event.target.value }))}
                      placeholder="用于生产审计" />
                  </label>
                  <label className="dynamic-trading-confirmation">
                    <input checked={liveConfirmed}
                      onChange={(event) => setLiveConfirmed(event.target.checked)} type="checkbox" />
                    确认使用真实资金，单笔新增风险不超过 10 USDT
                  </label>
                </div>
              ) : null}
            </div>

            <div className="dynamic-trading-control-actions">
              <button disabled={
                busy
                || evaluating
                || (testnetMode && !testnetConfirmed)
                || (liveMode && (!liveConfirmed || !draft.liveOperator.trim()))
              } onClick={() => void save(true)} type="button">
                <Save size={14} />
                {busy ? "保存中…" : state?.enabled ? "保存配置" : "保存并开启"}
              </button>
              <button aria-busy={evaluating}
                disabled={(!state?.enabled && !hasUnresolvedOrder) || busy || evaluating}
                onClick={() => void evaluate()} type="button">
                {hasUnresolvedOrder ? <RefreshCw size={14} /> : <Play size={14} />}
                {evaluating ? hasUnresolvedOrder ? "对账中…" : "评估中…"
                  : hasUnresolvedOrder ? "立即对账" : "立即评估"}
              </button>
              {state?.enabled ? (
                <button className="danger" disabled={busy || evaluating}
                  onClick={() => void save(false)} type="button">
                  <CirclePause size={14} />暂停
                </button>
              ) : null}
            </div>
            {error ? (
              <p className="dynamic-trading-error" role="alert">{error}</p>
            ) : null}
          </aside>
        </div>

        {attention ? (
          <div className={`dynamic-trading-alert ${attention.tone}`} role="alert">
            <strong>{attention.title}</strong>
            <span>{attention.detail}</span>
          </div>
        ) : null}

        <AutoTradingEconomicsSummary economics={snapshot?.economics} />

        <div className="dynamic-trading-bottom-grid">
          <section>
            <header><WalletCards size={14} /><strong>当前持仓</strong></header>
            <dl className="dynamic-trading-kpis">
              <div><dt>{state?.accountAuthority === "binance_spot" ? "Binance Spot 总净值" : "管理中策略权益"}</dt>
                <dd>{money(state?.accountEquity ?? state?.equity)} USDT</dd></div>
              <div><dt>{state?.accountAuthority === "binance_spot" ? "BTC 现货总量" : "持仓数量"}</dt>
                <dd>{formatNumber(state?.position)} BTC</dd></div>
              <div><dt>平均成本</dt><dd>{money(state?.avgCost)} USDT</dd></div>
              <div><dt>已实现盈亏</dt><dd className={(state?.realizedPnl ?? 0) < 0 ? "negative" : "positive"}>
                {signedMoney(state?.realizedPnl)} USDT
              </dd></div>
            </dl>
          </section>

          <section>
            <header><Bot size={14} /><strong>委托意图</strong></header>
            {orderIntent ? (
              <div className="dynamic-trading-order-card">
                <span>{orderIntent.symbol}</span>
                <strong className={orderIntent.side}>{orderIntent.side === "buy" ? "买入" : "卖出"}</strong>
                <p>{formatNumber(orderIntent.quantity)} BTC · {money(orderIntent.notionalValue)} USDT</p>
                <small>{orderStateLabel(currentOrderState)}</small>
              </div>
            ) : (
              <div className="dynamic-trading-empty">当前没有待提交的委托意图</div>
            )}
            <button className="dynamic-trading-link" onClick={onOpenExecution} type="button">
              查看执行准入 <ChevronRight size={13} />
            </button>
          </section>

          <section>
            <header><Activity size={14} /><strong>最近成交</strong></header>
            {snapshot?.history.length ? (
              <ol className="dynamic-trading-trades">
                {snapshot.history.slice(0, 4).map((event) => (
                  <li key={event.eventId}>
                    <span className={stringValue(event.metadata.side)}>
                      {stringValue(event.metadata.side) === "buy" ? "买入" : "卖出"}
                    </span>
                    <strong>{formatNumber(numberValue(event.metadata.price))}</strong>
                    <time dateTime={event.createdAt}>{formatTime(event.createdAt)}</time>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="dynamic-trading-empty">尚无自动成交</div>
            )}
            <button className="dynamic-trading-link" onClick={onOpenAudit} type="button">
              查看完整审计 <ChevronRight size={13} />
            </button>
          </section>

          <section>
            <header><ShieldCheck size={14} /><strong>执行链</strong></header>
            <ol className="dynamic-trading-chain">
              {[
                ["市场快照", contract?.marketSnapshot.snapshotHash],
                ["决策提案", contract?.decisionProposal.proposalId],
                ["标准信号", contract?.signal.signalId],
                ["风险调整", contract?.riskAdjustedTarget.riskAdjustedTargetId],
                ["订单结果", state?.lastOrderResult?.orderResultId]
              ].map(([label, value], index) => (
                <li className={value ? "complete" : ""} key={label}>
                  <span>{index + 1}</span>
                  <div><strong>{label}</strong><small title={value}>{value ? value.slice(0, 12) : "等待"}</small></div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <header><ShieldCheck size={14} /><strong>账户与风险</strong></header>
            <dl className="dynamic-trading-risk-list">
              <div><dt>Binance Spot 总净值</dt><dd>{money(state?.accountEquity ?? state?.equity)} USDT</dd></div>
              <div><dt>可用 USDT</dt><dd>{money(state?.availableCash ?? state?.cash)} USDT</dd></div>
              <div><dt>可用 BTC</dt><dd>{formatNumber(state?.lastAccountCheck?.accountSnapshot?.assets?.BTC?.free)} BTC</dd></div>
              <div><dt>亏损回撤</dt><dd>{lossDrawdown.toFixed(2)} / {(state?.dailyLossLimitPct ?? 0).toFixed(2)}%</dd></div>
              <div><dt>盈利回撤</dt><dd>{profitDrawdown.toFixed(2)} / {(state?.dailyProfitDrawdownLimitPct ?? 0).toFixed(2)}%</dd></div>
              <div><dt>小时额度</dt><dd>剩余 {remainingTrades} 次</dd></div>
              <div><dt>账户覆盖</dt><dd>{state?.lastAccountCheck?.accountCovered === true ? "已通过" : "待检查"}</dd></div>
              <div><dt>生产授权</dt><dd>{liveAuthorizationLabel(state)}</dd></div>
            </dl>
          </section>
        </div>

        <footer className="dynamic-trading-boundary">
          <span>现货自动交易 · 不使用杠杆 · 不做空</span>
          <span>关闭页面不影响后端运行；生产委托仍受权限、急停、风控和实名确认约束。</span>
        </footer>
      </section>
    );
  }

  const persistedExecutionMode = state?.executionMode ?? draft.executionMode;
  const persistedModeLabel = executionModeLabel(persistedExecutionMode);
  const persistedTestnetMode = persistedExecutionMode === "testnet";
  const persistedLiveMode = persistedExecutionMode === "live";
  const showBuiltInSignalControls = showBuiltInAutoTradingSignalControls(snapshot?.strategyBinding);
  const strategyBindingBlocked = snapshot?.strategyBinding?.status === "blocked";
  const runtimeContext = state
    ? `${state.symbol} · ${state.timeframe}，每 ${state.runnerIntervalSeconds} 秒自动评估`
    : "正在读取已保存的运行上下文";

  return (
    <section className={`execution-auto-paper ${state?.enabled ? "active" : ""}`}
      aria-labelledby="execution-auto-paper-title">
      <header>
        <div>
          <span>自动交易 · {persistedModeLabel}</span>
          <h2 id="execution-auto-paper-title">自动交易运行与委托控制</h2>
          <p>{runtimeContext}；当前生产策略生成信号后，由风控计算仓位并进入受控委托链。</p>
        </div>
        <strong>
          {state?.enabled
            ? state.runnerState === "running" ? "后端监控中" : "等待后端运行器"
            : "已暂停"} · {
            persistedLiveMode ? "生产实盘委托" : persistedTestnetMode ? "测试网委托" : "纸面模拟"
          }
        </strong>
      </header>

      <AutoTradingProductionStrategyOverview snapshot={snapshot} />
      <div className="execution-auto-runtime-tools">
        <AutoTradingRuntimeHealth state={state} />
        <button
          className="execution-auto-notification-toggle"
          disabled={notificationPermission !== "default"}
          onClick={() => void enableNotifications()}
          title="页面保持打开时，异常状态变化会发送一次系统通知"
          type="button"
        >
          {notificationPermission === "default" ? "开启系统提醒"
            : notificationPermission === "granted" ? "系统提醒已开启"
              : notificationPermission === "denied" ? "系统提醒已关闭" : "系统通知不可用"}
        </button>
      </div>
      <AutoTradingServerMonitoring
        error={monitoringReadError}
        snapshot={monitoring}
      />

      <div className="execution-auto-paper-metrics">
        <article><span>当前窗口涨跌幅</span><strong>{percent(state?.windowChangePct)}</strong></article>
        <article><span>最近判断</span><strong>{decisionLabel(state?.lastDecision?.action)}</strong></article>
        <article><span>策略权益</span><strong>{money(state?.equity)} USDT</strong></article>
        <article><span>累计成交</span><strong>{state?.tradeCount ?? 0} 笔</strong></article>
      </div>

      {attention ? (
        <div className={`execution-auto-paper-alert ${attention.tone}`} role="alert">
          <strong>{attention.title}</strong>
          <span>{attention.detail}</span>
        </div>
      ) : null}

      <AutoTradingRiskOverview state={state} />
      <AutoTradingLedger history={snapshot?.history ?? []} state={state} />

      <div className="execution-auto-paper-form">
        <label>执行模式
          <select value={draft.executionMode} onChange={(event) => {
            const executionMode = event.target.value as Draft["executionMode"];
            setDraft((current) => ({ ...current, executionMode }));
            if (executionMode === "paper") {
              setTestnetConfirmed(false);
            }
            if (executionMode !== "live") {
              setLiveConfirmed(false);
            }
          }}>
            <option value="paper">纸面模拟</option>
            <option value="testnet">币安现货测试网</option>
            <option value="live">币安现货生产实盘</option>
          </select>
        </label>
        {showBuiltInSignalControls ? (
          <>
            <label>智能决策服务
              <select value={draft.providerId}
                onChange={(event) => setDraft((current) => ({ ...current, providerId: event.target.value }))}>
                <option value="auto">自动选择已配置服务</option>
                {snapshot?.providers.map((provider) => (
                  <option disabled={!provider.configured} key={provider.providerId} value={provider.providerId}>
                    {providerLabel(provider.providerId)}{provider.configured ? "" : "（未配置）"}
                  </option>
                ))}
              </select>
            </label>
            <NumberField label="触发涨跌幅 %（0.05–20）" min={0.05} max={20} step={0.05}
              value={draft.triggerPct} onChange={(value) => updateNumber("triggerPct", value)} />
          </>
        ) : null}
        <NumberField label="单笔上限 USDT" min={1} max={10} step={1}
          value={draft.orderNotional} onChange={(value) => updateNumber("orderNotional", value)} />
        <NumberField label="止损 %" min={0.1} max={20} step={0.1}
          value={draft.stopLossPct} onChange={(value) => updateNumber("stopLossPct", value)} />
        <NumberField label="止盈 %" min={0.1} max={50} step={0.1}
          value={draft.takeProfitPct} onChange={(value) => updateNumber("takeProfitPct", value)} />
        <NumberField label="亏损回撤上限 %" min={0.1} max={20} step={0.1}
          value={draft.dailyLossLimitPct} onChange={(value) => updateNumber("dailyLossLimitPct", value)} />
        <NumberField label="盈利回撤上限 %" min={0.1} max={20} step={0.1}
          value={draft.dailyProfitDrawdownLimitPct}
          onChange={(value) => updateNumber("dailyProfitDrawdownLimitPct", value)} />
        <NumberField label="每小时最多成交" min={1} max={60} step={1}
          value={draft.maxTradesPerHour} onChange={(value) => updateNumber("maxTradesPerHour", value)} />
      </div>

      {testnetMode ? (
        <label className="execution-auto-paper-confirmation">
          <input checked={testnetConfirmed} onChange={(event) => setTestnetConfirmed(event.target.checked)}
            type="checkbox" />
          我确认自动策略会向币安现货测试网提交测试委托，并受测试网急停控制
        </label>
      ) : null}
      {liveMode ? (
        <div className="execution-auto-live-confirmation">
          <label>实名操作人
            <input value={draft.liveOperator}
              onChange={(event) => setDraft((current) => ({ ...current, liveOperator: event.target.value }))}
              placeholder="用于生产审计" />
          </label>
          <label className="execution-auto-paper-confirmation">
            <input checked={liveConfirmed} onChange={(event) => setLiveConfirmed(event.target.checked)}
              type="checkbox" />
            我确认自动策略会使用真实资金提交币安现货生产委托，单笔新增风险不超过 10 USDT
          </label>
          <small>
            还需先在下方生产交易控制链完成最新权限核验并恢复执行急停；授权时长由设置页控制。
          </small>
        </div>
      ) : null}

      <div className="execution-auto-paper-actions">
        <button disabled={
          busy
          || strategyBindingBlocked
          || (testnetMode && !testnetConfirmed)
          || (liveMode && (!liveConfirmed || !draft.liveOperator.trim()))
        } onClick={() => void save(true)} type="button">
          {busy ? "保存中…" : state?.enabled ? "保存参数"
            : liveMode ? "保存并开启生产实盘"
              : testnetMode ? "保存并开启测试网委托" : "保存并开启"}
        </button>
        <button disabled={
          (!state?.enabled && !hasUnresolvedOrder)
          || (strategyBindingBlocked && !hasUnresolvedOrder)
          || busy
        }
          onClick={() => void evaluate()} type="button">
          {hasUnresolvedOrder ? "立即对账" : "立即评估"}
        </button>
        {state?.enabled ? (
          <button className="danger" disabled={busy} onClick={() => void save(false)} type="button">暂停监控</button>
        ) : null}
      </div>

      <p className={error ? "execution-auto-paper-error" : undefined} role="status">
        {error ?? (state?.detail ? autoTradingErrorMessage(new Error(state.detail)) : "正在读取监控状态…")}
      </p>
      <small>
        后端运行器不依赖当前页面，关闭页面后仍会继续；
        {hasUnresolvedOrder ? "“立即对账”只查询既有委托，不会创建新委托。" : "“立即评估”只用于人工触发一次检查。"}
        低置信度不会被“必须不亏”条件拦截；数据异常、账户亏损上限、成交频率和测试网急停仍会暂停。
        测试网使用无价值资产；生产实盘会使用真实资金，并受生产急停和授权时长控制。
      </small>
    </section>
  );
}

function NumberField({
  label,
  max,
  min,
  onChange,
  step,
  value
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: string) => void;
  step: number;
  value: number;
}) {
  return (
    <label>{label}
      <input max={max} min={min} onChange={(event) => onChange(event.target.value)}
        step={step} type="number" value={value} />
    </label>
  );
}
