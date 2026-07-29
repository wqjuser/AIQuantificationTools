import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { WorkspaceFetcher } from "../lib/terminal-api";
import {
  AutoTradingLedger,
  AutoTradingRiskOverview,
  AutoTradingRuntimeHealth,
  AutoTradingServerMonitoring,
  authorizeAutoLiveSession,
  autoTradingActionPath,
  autoTradingAttention,
  autoTradingDailyDrawdown,
  autoTradingErrorMessage,
  autoTradingNotification,
  autoTradingProfitDrawdown,
  ExecutionAutoPaperTradingSection,
  hasUnresolvedAutoOrder
} from "./ExecutionAutoPaperTradingSection";

describe("ExecutionAutoPaperTradingSection", () => {
  it("offers paper, testnet, and explicitly confirmed production modes", () => {
    const html = renderToStaticMarkup(
      <ExecutionAutoPaperTradingSection baseUrl="http://127.0.0.1:8765" />
    );

    expect(html).toContain("纸面模拟");
    expect(html).toContain("Binance Spot Testnet");
    expect(html).toContain("Binance Spot 生产实盘");
    expect(html).toContain("保存并开启");
    expect(html).toContain("触发涨跌幅 %（0.05–20）");
    expect(html).toContain("生产实盘会使用真实资金");
    expect(html).toContain("由后端每 35 秒");
    expect(html).toContain("关闭页面后仍会继续");
    expect(html).toContain("系统通知不可用");
    expect(html).toContain("M2 · 服务端告警");
  });

  it("renders the separate dynamic-trading workspace from the same auto-trading controls", () => {
    const html = renderToStaticMarkup(
      <ExecutionAutoPaperTradingSection
        baseUrl="http://127.0.0.1:8765"
        chart={<div>真实行情图</div>}
        instruments={[
          { symbol: "BTC/USDT", name: "Bitcoin", market: "crypto", changePct: 1.2, price: 64000 },
          { symbol: "600000", name: "浦发银行", market: "ashare", changePct: -0.4, price: 9.12 }
        ]}
        selectedSymbol="600000"
        variant="workspace"
        workflowGuide={<div>自动交易流程</div>}
      />
    );

    expect(html).toContain("动态交易");
    expect(html).toContain("完整进程");
    expect(html).toContain("真实行情图");
    expect(html).toContain("BTC/USDT");
    expect(html).toContain("600000 · 行情观察");
    expect(html).toContain("自动交易目标仍为 BTC/USDT");
    expect(html).toContain("自动交易控制");
    expect(html).toContain("运行状态");
    expect(html).toContain("风险参数");
    expect(html).toContain("授权证据");
    expect(html).toContain("亏损回撤");
    expect(html).toContain("盈利回撤");
    expect(html).toContain("小时额度");
    expect(html).toContain("连续失败");
    expect(html).toContain("保存并开启");
    expect(html).toContain("当前持仓");
    expect(html).toContain("委托意图");
    expect(html).toContain("最近成交");
    expect(html).toContain("执行链");
    expect(html).toContain("账户与风险");
    expect(html).toContain("不使用杠杆");
  });

  it("reauthorizes the current live session without switching mode or enabling monitoring", async () => {
    const calls: Array<[string, RequestInit | undefined]> = [];
    const fetcher: WorkspaceFetcher = async (url, init) => {
      calls.push([String(url), init]);
      return {
        json: async () => ({ liveTradingAllowed: true }),
        ok: true
      } as Response;
    };

    await authorizeAutoLiveSession("http://127.0.0.1:8765", " wenqingjie ", fetcher);

    expect(calls).toHaveLength(1);
    const [url, init] = calls[0];
    expect(url).toBe("http://127.0.0.1:8765/api/execution/auto-paper-trading");
    expect(JSON.parse(String(init?.body))).toEqual({
      liveConfirmed: true,
      liveOperator: "wenqingjie"
    });
  });

  it("recognizes only unresolved testnet and production orders for manual reconciliation", () => {
    expect(hasUnresolvedAutoOrder({
      executionMode: "live",
      lastLiveOrder: { state: "reconciliation_required" },
      lastTestnetOrder: null
    })).toBe(true);
    expect(hasUnresolvedAutoOrder({
      executionMode: "testnet",
      lastLiveOrder: null,
      lastTestnetOrder: { state: "filled" }
    })).toBe(false);
    expect(hasUnresolvedAutoOrder({
      executionMode: "paper",
      lastLiveOrder: null,
      lastTestnetOrder: null
    })).toBe(false);
  });

  it("uses the read-only reconciliation endpoint while an order is unresolved", () => {
    expect(autoTradingActionPath({
      executionMode: "live",
      lastLiveOrder: { state: "submission_pending" },
      lastTestnetOrder: null
    })).toBe("api/execution/auto-paper-trading/reconciliations");
    expect(autoTradingActionPath({
      executionMode: "live",
      lastLiveOrder: { state: "filled" },
      lastTestnetOrder: null
    })).toBe("api/execution/auto-paper-trading/evaluations");
  });

  it("explains account, authorization, and reconciliation blockers in plain Chinese", () => {
    expect(autoTradingAttention({
      status: "account_mismatch",
      detail: "account mismatch",
      executionMode: "live",
      lastLiveOrder: null,
      lastTestnetOrder: null,
      lastAccountCheck: {
        positionCovered: true,
        quoteCovered: false,
        unexpectedOpenAutoOrderCount: 0
      }
    })).toEqual({
      tone: "danger",
      title: "账户资产不足",
      detail: "可用 USDT 不足以覆盖下一笔预算。请补足资产或核对本地策略账本后重新检查。"
    });
    expect(autoTradingAttention({
      status: "account_mismatch",
      detail: "orphan order",
      executionMode: "testnet",
      lastLiveOrder: null,
      lastTestnetOrder: null,
      lastAccountCheck: {
        positionCovered: true,
        quoteCovered: true,
        unexpectedOpenAutoOrderCount: 1
      }
    })).toEqual({
      tone: "danger",
      title: "发现未记录的自动挂单",
      detail: "发现 1 笔未记录的自动挂单。请先在交易所核对并处理，再重新检查。"
    });
    expect(autoTradingAttention({
      status: "risk_paused",
      detail: "生产实盘会话未授权或已过期。",
      executionMode: "live",
      lastLiveOrder: null,
      lastTestnetOrder: null,
      lastAccountCheck: null
    })?.title).toBe("风险保护已暂停新交易");
    expect(autoTradingAttention({
      status: "order_pending",
      detail: "等待查询",
      executionMode: "testnet",
      lastLiveOrder: null,
      lastTestnetOrder: { state: "reconciliation_required" },
      lastAccountCheck: null
    })).toEqual({
      tone: "warning",
      title: "上一笔委托等待对账",
      detail: "系统已停止新委托；可点击“立即对账”查询原订单。"
    });
  });

  it("shows the latest automatic decision, trade cost, fee, mode, profit, and order state", () => {
    const html = renderToStaticMarkup(
      <AutoTradingLedger
        history={[{
          eventId: "auto-testnet-trade-1",
          createdAt: "2026-07-27T08:00:00Z",
          metadata: {
            executionMode: "testnet",
            side: "buy",
            symbol: "BTC/USDT",
            quantity: 0.00015,
            price: 65199.23,
            notional: 9.7798845,
            fee: 0.0097,
            feeEstimated: false,
            providerId: "openai-compatible",
            confidence: 0.82,
            reason: "五根涨幅超过阈值"
          }
        }]}
        state={{
          executionMode: "testnet",
          lastDecision: {
            action: "buy",
            confidence: 0.82,
            reason: "五根涨幅超过阈值",
            providerId: "openai-compatible",
            evaluatedAt: "2026-07-27T08:00:00Z"
          },
          lastDecisionContract: {
            contractVersion: "aiqt-decision-v1",
            strategyRevision: "strategy-revision-1",
            marketSnapshot: {
              snapshotHash: "snapshot-hash-1",
              dataHash: "data-hash-1",
              market: "crypto",
              symbol: "BTC/USDT",
              timeframe: "1m",
              dataSource: "ccxt",
              barCount: 6,
              latestBarAt: "2026-07-27T08:00:00Z"
            },
            decisionProposal: {
              proposalId: "proposal-1",
              snapshotHash: "snapshot-hash-1",
              strategyRevision: "strategy-revision-1",
              source: "ai",
              providerId: "openai-compatible",
              action: "buy",
              confidence: 0.82,
              reason: "五根涨幅超过阈值",
              proposedAt: "2026-07-27T08:00:00Z"
            },
            signal: {
              signalId: "signal-1",
              proposalId: "proposal-1",
              snapshotHash: "snapshot-hash-1",
              strategyId: "auto-pct-v1",
              strategyRevision: "strategy-revision-1",
              horizon: "1m",
              evaluatedBarAt: "2026-07-27T08:00:00Z",
              expiresAt: "2026-07-27T08:01:00Z",
              action: "buy",
              confidence: 0.82,
              reason: "五根涨幅超过阈值",
              generatedAt: "2026-07-27T08:00:00Z"
            },
            portfolioTarget: {
              portfolioTargetId: "target-1",
              signalId: "signal-1",
              symbol: "BTC/USDT",
              currentQuantity: 0,
              targetQuantity: 0.00015,
              deltaQuantity: 0.00015,
              referencePrice: 65199.23,
              targetNotional: 9.7798845
            },
            riskAdjustedTarget: {
              riskAdjustedTargetId: "risk-target-1",
              portfolioTargetId: "target-1",
              decision: "preserve",
              requestedTargetQuantity: 0.00015,
              approvedTargetQuantity: 0.00015,
              approvedDeltaQuantity: 0.00015,
              approvedNotional: 9.7798845,
              reason: "当前风险边界允许保持组合目标。"
            },
            orderIntent: {
              orderIntentId: "order-intent-1",
              marketSnapshotHash: "snapshot-hash-1",
              strategyRevision: "strategy-revision-1",
              proposalId: "proposal-1",
              signalId: "signal-1",
              portfolioTargetId: "target-1",
              riskAdjustedTargetId: "risk-target-1",
              accountCheckId: "account-check-1",
              symbol: "BTC/USDT",
              side: "buy",
              type: "market",
              quantity: 0.00015,
              referencePrice: 65199.23,
              notionalValue: 9.7798845,
              marketRules: {
                source: "ccxt",
                quantityPrecision: 0.000001,
                pricePrecision: 0.01,
                minimumQuantity: 0.00001,
                minimumNotional: 1
              },
              executionAssumptions: {
                feeRate: 0.001,
                feeEstimated: true,
                slippageBps: null,
                slippageModel: "venue_market_fill"
              }
            }
          },
          lastOrderResult: {
            orderResultId: "order-result-1",
            orderIntentId: "order-intent-1",
            executionMode: "testnet",
            state: "filled",
            clientOrderId: "aiqt-auto-t-1",
            externalOrderId: "testnet-order-1",
            filledQuantity: 0.00015,
            remainingQuantity: 0,
            averagePrice: 65199.23,
            filledNotional: 9.7798845,
            fees: [{ currency: "USDT", cost: 0.00977988 }],
            feeEstimated: false,
            error: ""
          },
          lastLiveOrder: null,
          lastTestnetOrder: { state: "filled" },
          position: 0.00015,
          realizedPnl: 1.25
        }}
      />
    );

    expect(html).toContain("自动交易运行台账");
    expect(html).toContain("测试网");
    expect(html).toContain("买入 · 82%");
    expect(html).toContain("已实现盈亏");
    expect(html).toContain("+1.25 USDT");
    expect(html).toContain("已成交");
    expect(html).toContain("BTC/USDT");
    expect(html).toContain("65,199.23");
    expect(html).toContain("9.78 USDT");
    expect(html).toContain("0.0097 USDT · 交易所实报");
    expect(html).toContain("OpenAI 兼容服务");
    expect(html).toContain("五根涨幅超过阈值");
    expect(html).toContain("决策证据链");
    expect(html).toContain("snapshot-hash");
    expect(html).toContain("AI 提案");
    expect(html).toContain("标准信号");
    expect(html).toContain("组合目标");
    expect(html).toContain("0.00015 BTC");
    expect(html).toContain("风险调整");
    expect(html).toContain("保持目标");
    expect(html).toContain("当前风险边界允许保持组合目标");
    expect(html).toContain("订单意图");
    expect(html).toContain("买入 0.00015 BTC");
    expect(html).toContain("市价委托 · 9.78 USDT");
    expect(html).toContain("数量精度 0.000001 · 最小量 0.00001 · 最小金额 1.00");
    expect(html).toContain("费率 0.100% · 滑点按成交回执");
    expect(html).toContain("订单结果");
    expect(html).toContain("成交 0.00015 BTC · 9.78 USDT");
  });

  it("shows when an untradeable remainder was released from the strategy ledger", () => {
    const html = renderToStaticMarkup(
      <AutoTradingLedger
        history={[]}
        state={{
          executionMode: "testnet",
          lastDecision: null,
          lastDecisionContract: null,
          lastLiveOrder: null,
          lastTestnetOrder: null,
          lastOrderResult: null,
          lastDustDisposition: {
            executionMode: "testnet",
            symbol: "BTC/USDT",
            quantity: 0.00001,
            referencePrice: 63_500,
            estimatedNotional: 0.635,
            reason: "stage6_sandbox_cost_below_minimum",
            releasedAt: "2026-07-29T00:00:00+08:00",
            orderSubmitted: false
          },
          position: 0,
          realizedPnl: 0
        }}
      />
    );

    expect(html).toContain("尘埃仓位已释放");
    expect(html).toContain("0.00001 BTC");
    expect(html).toContain("0.64 USDT");
    expect(html).toContain("未提交交易所委托");
  });

  it("shows the exchange-reported fee currency when valuation is estimated", () => {
    const html = renderToStaticMarkup(
      <AutoTradingLedger
        history={[{
          eventId: "auto-testnet-trade-bnb-fee",
          createdAt: "2026-07-27T08:00:00Z",
          metadata: {
            executionMode: "testnet",
            side: "buy",
            symbol: "BTC/USDT",
            quantity: 0.00015,
            price: 65199.23,
            notional: 9.7798845,
            fee: 0.0097,
            feeEstimated: true,
            feeBreakdown: [{ currency: "BNB", cost: 0.00001 }],
            providerId: "rules",
            confidence: 0.82,
            reason: "五根涨幅超过阈值"
          }
        }]}
        state={{
          executionMode: "testnet",
          lastDecision: null,
          lastLiveOrder: null,
          lastTestnetOrder: { state: "filled" },
          position: 0.00015,
          realizedPnl: 0
        }}
      />
    );

    expect(html).toContain("0.0097 USDT · 估算");
    expect(html).toContain("实扣 0.00001 BNB");
  });

  it("uses a plain Chinese label for the built-in rules decision source", () => {
    const html = renderToStaticMarkup(
      <AutoTradingLedger
        history={[]}
        state={{
          executionMode: "testnet",
          lastDecision: {
            action: "hold",
            confidence: 1,
            reason: "涨跌幅尚未达到触发线",
            providerId: "rules"
          },
          lastLiveOrder: null,
          lastTestnetOrder: null,
          position: 0,
          realizedPnl: 0
        }}
      />
    );

    expect(html).toContain("规则引擎");
    expect(html).not.toContain(">rules<");
  });

  it("shows the active loss, frequency, exit-price, account, and authorization boundaries", () => {
    const html = renderToStaticMarkup(
      <AutoTradingRiskOverview state={{
        executionMode: "live",
        equity: 98.5,
        dailyStartEquity: 100,
        dailyPeakEquity: 102,
        dailyLossDrawdownPct: 1.5,
        dailyProfitDrawdownPct: 3.4314,
        dailyLossLimitPct: 2,
        dailyProfitDrawdownLimitPct: 4,
        dailyRiskHaltReason: null,
        maxTradesPerHour: 3,
        tradeTimestamps: [
          "2026-07-27T07:40:00Z",
          "2026-07-27T07:50:00Z"
        ],
        position: 0.001,
        avgCost: 65000,
        stopLossPct: 1,
        takeProfitPct: 2,
        lastAccountCheck: {
          accountCovered: true,
          checkedAt: "2026-07-27T08:00:00Z",
          positionCovered: true,
          quoteCovered: true,
          unexpectedOpenAutoOrderCount: 0
        },
        liveConfirmed: true,
        liveSessionTtlHours: 8,
        liveAuthorizedUntil: "2026-07-27T12:00:00Z"
      }} />
    );

    expect(html).toContain("风险边界");
    expect(html).toContain("亏损回撤");
    expect(html).toContain("1.50% / 2.00%");
    expect(html).toContain("盈利回撤");
    expect(html).toContain("3.43% / 4.00%");
    expect(html).toContain("剩余 1 次");
    expect(html).toContain("止损 64,350");
    expect(html).toContain("止盈 66,300");
    expect(html).toContain("账户覆盖");
    expect(html).toContain("已通过");
    expect(html).toContain("生产授权");
    expect(html).toContain("有效至");
    expect(html).toContain("达到上限后仅暂停买入与加仓");
  });

  it("shows permanent production authorization when the configured duration is zero", () => {
    const html = renderToStaticMarkup(
      <AutoTradingRiskOverview state={{
        executionMode: "live",
        equity: 100,
        dailyStartEquity: 100,
        dailyPeakEquity: 100,
        dailyLossDrawdownPct: 0,
        dailyProfitDrawdownPct: 0,
        dailyLossLimitPct: 2,
        dailyProfitDrawdownLimitPct: 2,
        dailyRiskHaltReason: null,
        maxTradesPerHour: 3,
        tradeTimestamps: [],
        position: 0,
        avgCost: 0,
        stopLossPct: 1,
        takeProfitPct: 2,
        lastAccountCheck: null,
        liveConfirmed: true,
        liveSessionTtlHours: 0,
        liveAuthorizedUntil: null,
      }} />
    );

    expect(html).toContain("永久有效");
    expect(html).toContain("手动暂停或急停前持续有效");
  });

  it("excludes released exchange dust from the strategy loss boundary", () => {
    expect(autoTradingDailyDrawdown({
      dailyStartEquity: 94.8945792,
      dailyReleasedDustNotional: 1.908372,
      equity: 92.9780776
    })).toBeCloseTo(0.0087, 4);
  });

  it("calculates profit drawdown only after equity formed a profit peak", () => {
    expect(autoTradingProfitDrawdown({
      dailyStartEquity: 100,
      dailyPeakEquity: 105,
      equity: 102
    })).toBeCloseTo(2.8571, 4);
    expect(autoTradingProfitDrawdown({
      dailyStartEquity: 100,
      dailyPeakEquity: 100,
      equity: 98
    })).toBe(0);
  });

  it("shows a healthy backend heartbeat and recovered failure history", () => {
    const html = renderToStaticMarkup(
      <AutoTradingRuntimeHealth
        nowMs={Date.parse("2026-07-27T08:01:00Z")}
        state={{
          runnerState: "running",
          runnerIntervalSeconds: 35,
          runnerCycleCount: 42,
          consecutiveRunnerFailures: 0,
          lastRunnerCycleAt: "2026-07-27T08:00:50Z",
          lastRunnerSuccessAt: "2026-07-27T08:00:50Z",
          lastRunnerErrorAt: "2026-07-27T07:55:00Z"
        }}
      />
    );

    expect(html).toContain("后台运行正常");
    expect(html).toContain("已完成 42 轮");
    expect(html).toContain("上次异常已恢复");
  });

  it("warns when a running backend stops reporting heartbeats", () => {
    const html = renderToStaticMarkup(
      <AutoTradingRuntimeHealth
        nowMs={Date.parse("2026-07-27T08:03:00Z")}
        state={{
          runnerState: "running",
          runnerIntervalSeconds: 35,
          runnerCycleCount: 42,
          consecutiveRunnerFailures: 0,
          lastRunnerCycleAt: "2026-07-27T08:00:00Z",
          lastRunnerSuccessAt: "2026-07-27T08:00:00Z",
          lastRunnerErrorAt: null
        }}
      />
    );

    expect(html).toContain("后台心跳已中断");
    expect(html).not.toContain("后台运行正常");
  });

  it("leads with the persisted server incident and keeps technical evidence disclosed", () => {
    const html = renderToStaticMarkup(
      <AutoTradingServerMonitoring
        snapshot={{
          schemaVersion: 1,
          status: "attention",
          reason: "1 个服务端事件待恢复",
          nextAction: "在执行中心使用“立即对账”核对原订单。",
          job: {
            jobId: "server-monitoring",
            runnerState: "running",
            cycleCount: 42,
            consecutiveFailures: 0,
            lastCycleAt: "2026-07-28T08:00:00Z",
            lastSuccessAt: "2026-07-28T08:00:00Z",
            lastErrorAt: null,
            lastError: null,
            nextEligibleRunAt: "2026-07-28T08:00:35Z",
            deliveryFailureCount: 0,
            lastDeliveryErrorAt: null,
            lastDeliveryError: null,
            health: { status: "running", detail: "服务端监控正常。" }
          },
          observedJobs: [{
            jobId: "auto-trading:crypto:BTC-USDT:1m",
            status: "order_pending",
            runnerState: "running",
            scheduleKind: "continuous",
            calendarStatus: "always_open",
            lastCycleAt: "2026-07-28T08:00:00Z",
            lastSuccessAt: "2026-07-28T08:00:00Z",
            lastErrorAt: null,
            lastError: null,
            consecutiveFailures: 0,
            nextEligibleRunAt: "2026-07-28T08:00:35Z"
          }],
          activeIncidents: [{
            incidentId: "incident-1",
            incidentKey: "auto-trading:pending-order",
            status: "active",
            severity: "warning",
            title: "自动委托等待对账",
            detail: "系统将继续只读查询原订单，新委托保持阻断。",
            nextAction: "在执行中心使用“立即对账”核对原订单。",
            openedAt: "2026-07-28T08:00:00Z",
            resolvedAt: null,
            occurrenceCount: 1
          }],
          incidents: [],
          notifications: [],
          channel: {
            type: "webhook",
            configured: true,
            status: "ready",
            configurationError: null
          },
          tradingActionsAvailable: false
        }}
      />
    );

    expect(html).toContain("自动委托等待对账");
    expect(html).toContain("下一步：在执行中心使用“立即对账”核对原订单。");
    expect(html).toContain("Webhook 已就绪");
    expect(html).toContain('title="服务端监控正常。"');
    expect(html).toContain("<details>");
    expect(html).toContain("任务 ID：server-monitoring");
    expect(html).not.toContain("<button");
  });

  it("shows notification-channel failures without adding a trading action", () => {
    const html = renderToStaticMarkup(
      <AutoTradingServerMonitoring error="服务端告警状态读取失败。" />
    );

    expect(html).toContain("监控状态读取失败");
    expect(html).toContain("服务端告警状态读取失败。");
    expect(html).not.toContain("<button");
  });

  it("builds one stable notification for an unresolved order", () => {
    expect(autoTradingNotification({
      status: "order_pending",
      detail: "等待查询",
      executionMode: "testnet",
      lastLiveOrder: null,
      lastTestnetOrder: { state: "reconciliation_required" },
      lastAccountCheck: null,
      runnerState: "running",
      runnerIntervalSeconds: 35,
      runnerCycleCount: 42,
      consecutiveRunnerFailures: 0,
      lastRunnerCycleAt: "2026-07-27T08:00:50Z",
      lastRunnerSuccessAt: "2026-07-27T08:00:50Z",
      lastRunnerErrorAt: null
    }, Date.parse("2026-07-27T08:01:00Z"))).toEqual({
      key: "attention:order_pending:reconciliation_required",
      title: "上一笔委托等待对账",
      body: "系统已停止新委托；可点击“立即对账”查询原订单。"
    });
  });

  it("builds a notification when the backend heartbeat is stale", () => {
    expect(autoTradingNotification({
      status: "monitoring",
      detail: "自动监控中",
      executionMode: "testnet",
      lastLiveOrder: null,
      lastTestnetOrder: null,
      lastAccountCheck: null,
      runnerState: "running",
      runnerIntervalSeconds: 35,
      runnerCycleCount: 42,
      consecutiveRunnerFailures: 0,
      lastRunnerCycleAt: "2026-07-27T08:00:00Z",
      lastRunnerSuccessAt: "2026-07-27T08:00:00Z",
      lastRunnerErrorAt: null
    }, Date.parse("2026-07-27T08:03:00Z"))).toEqual({
      key: "runner:stale",
      title: "后台心跳已中断",
      body: "自动交易后台已超过 105 秒未上报心跳。"
    });
  });

  it("builds one stable notification when the status API cannot be read", () => {
    expect(autoTradingNotification(
      undefined,
      Date.parse("2026-07-27T08:03:00Z"),
      "无法连接自动交易服务，请检查本地 API 是否运行。"
    )).toEqual({
      key: "connection:api",
      title: "自动交易服务连接中断",
      body: "无法连接自动交易服务，请检查本地 API 是否运行。"
    });
  });

  it("translates browser connection failures into actionable Chinese", () => {
    expect(autoTradingErrorMessage(new TypeError("Failed to fetch")))
      .toBe("无法连接自动交易服务，请检查本地 API 是否运行。");
    expect(autoTradingErrorMessage(new Error("triggerPct_out_of_range")))
      .toBe("触发涨跌幅必须在 0.05% 到 20% 之间");
  });
});
