import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { stage10ConfirmationIds } from "../lib/stage10-production-execution";
import type { AutoTradingSnapshot } from "../pages/shared/auto-trading-contract";
import {
  ExecutionStage10ProductionExecutionSection,
  isAutoLiveSessionRenewalAvailable,
} from "./ExecutionStage10ProductionExecutionSection";

describe("ExecutionStage10ProductionExecutionSection", () => {
  test("starts from the audited credential gate before auto live trading", () => {
    const html = renderToStaticMarkup(
      <ExecutionStage10ProductionExecutionSection
        baseUrl="http://127.0.0.1:8765"
        onAutoLiveAuthorized={() => undefined}
      />
    );

    expect(html).toContain("生产实盘 · 权限与急停");
    expect(html).not.toContain("阶段 10");
    expect(html).toContain("检查专用交易凭据");
    expect(html).toContain("生产权限与急停全程受控");
    expect(html).toContain("正在读取生产执行控制状态");
    expect(html).toContain("生产权限与急停状态");
    expect(html).toContain("实名操作人在本窗口显式授权或续期生产会话");
    expect(html).not.toContain("真实资金二次确认");
    expect(html).toContain('id="execution-live-trading-gate"');
    expect(html).toContain('tabindex="-1"');
    expect(stage10ConfirmationIds).toHaveLength(5);
  });

  test("keeps an active production session distinct from evidence renewal", () => {
    const html = renderToStaticMarkup(
      <ExecutionStage10ProductionExecutionSection
        autoTradingSnapshot={{
          state: {
            enabled: true,
            executionMode: "live",
            liveAuthorizedUntil: "2026-07-31T05:40:50Z",
            liveConfirmed: true,
            liveSessionTtlHours: 24,
          },
          productionLive: {
            enabled: true,
            credentialsConfigured: true,
            controlActive: true,
            triggered: false,
          },
          liveTradingAllowed: true,
        } as AutoTradingSnapshot}
        baseUrl="http://127.0.0.1:8765"
        onAutoLiveAuthorized={() => undefined}
      />,
    );

    expect(html).toContain("生产会话有效至");
    expect(html).toContain("续期或重新授权前需更新权限与急停证据");
    expect(html).toContain("当前会话有效 · 续期证据读取中");
    expect(html).not.toContain("执行权限已撤销");
    expect(html).not.toContain("急停保护已生效");
    expect(html).not.toContain("先到设置开启生产实盘总开关");
    expect(html).not.toContain("先到自动交易控制台选择生产实盘并保存开启");
    expect(html).toContain("生产会话授权与续期");
    expect(html).toContain("确认并续期生产会话");
    expect(html).not.toContain("启动生产实盘自动交易");
  });

  test("offers an explicit production start after route and control are ready", () => {
    for (const state of [
      { enabled: true, executionMode: "paper" },
      { enabled: true, executionMode: "testnet" },
      { enabled: false, executionMode: "live" },
    ] as const) {
      const html = renderToStaticMarkup(
        <ExecutionStage10ProductionExecutionSection
          autoTradingSnapshot={{
            state,
            productionLive: {
              enabled: true,
              credentialsConfigured: true,
              controlActive: true,
              triggered: false,
            },
            liveTradingAllowed: false,
          } as AutoTradingSnapshot}
          baseUrl="http://127.0.0.1:8765"
          onAutoLiveAuthorized={() => undefined}
        />,
      );

      expect(html).toContain("启动生产实盘自动交易");
      expect(html).toContain("确认并启动生产实盘");
      expect(html).toContain("确认后将启动生产实盘后台监控，可能在下一周期评估并提交真实委托；不会立即评估");
      expect(html).not.toContain("先到自动交易控制台选择生产实盘并保存开启");
      expect(html).not.toContain("确认并续期生产会话");
    }
  });

  test("fails closed when the automatic trading snapshot is unavailable", () => {
    const html = renderToStaticMarkup(
      <ExecutionStage10ProductionExecutionSection
        autoTradingSnapshot={null}
        baseUrl="http://127.0.0.1:8765"
        onAutoLiveAuthorized={() => undefined}
      />,
    );

    expect(html).toContain("自动交易状态暂不可用，无法启动或续期生产会话");
    expect(html).not.toContain("确认并启动生产实盘");
    expect(html).not.toContain("确认并续期生产会话");
  });

  test("does not offer production start while execution control is inactive", () => {
    const html = renderToStaticMarkup(
      <ExecutionStage10ProductionExecutionSection
        autoTradingSnapshot={{
          state: { enabled: true, executionMode: "paper" },
          productionLive: {
            enabled: true,
            credentialsConfigured: true,
            controlActive: false,
            triggered: false,
          },
          liveTradingAllowed: false,
        } as AutoTradingSnapshot}
        baseUrl="http://127.0.0.1:8765"
        onAutoLiveAuthorized={() => undefined}
      />,
    );

    expect(html).not.toContain("确认并启动生产实盘");
    expect(html).not.toContain("确认并续期生产会话");
  });

  test("guides a disabled production route before changing automatic trading mode", () => {
    const html = renderToStaticMarkup(
      <ExecutionStage10ProductionExecutionSection
        autoTradingSnapshot={{
          state: { enabled: true, executionMode: "paper" },
          productionLive: {
            enabled: false,
            credentialsConfigured: true,
            controlActive: true,
            triggered: false,
          },
          liveTradingAllowed: false,
        } as AutoTradingSnapshot}
        baseUrl="http://127.0.0.1:8765"
        onAutoLiveAuthorized={() => undefined}
      />,
    );

    expect(html).toContain("先到设置开启生产实盘总开关");
    expect(html).not.toContain("先到自动交易控制台选择生产实盘并保存开启");
    expect(html).not.toContain("确认并启动生产实盘");
    expect(html).not.toContain("确认并续期生产会话");
  });

  test("requires the production trading master switch before session renewal", () => {
    const snapshotWithProductionTrading = (enabled: boolean) => ({
      state: { enabled: true, executionMode: "live" },
      productionLive: {
        enabled,
        credentialsConfigured: true,
        controlActive: true,
        triggered: false,
      },
      liveTradingAllowed: false,
    } as AutoTradingSnapshot);
    const renderSnapshot = (snapshot: AutoTradingSnapshot) => renderToStaticMarkup(
      <ExecutionStage10ProductionExecutionSection
        autoTradingSnapshot={snapshot}
        baseUrl="http://127.0.0.1:8765"
        onAutoLiveAuthorized={() => undefined}
      />,
    );
    const disabledSnapshot = snapshotWithProductionTrading(false);
    const enabledSnapshot = snapshotWithProductionTrading(true);
    const disabled = renderSnapshot(disabledSnapshot);
    const enabled = renderSnapshot(enabledSnapshot);

    expect(isAutoLiveSessionRenewalAvailable(disabledSnapshot, true)).toBe(false);
    expect(isAutoLiveSessionRenewalAvailable(enabledSnapshot, true)).toBe(true);
    expect(isAutoLiveSessionRenewalAvailable(enabledSnapshot, false)).toBe(false);
    expect(disabled).toContain("先到设置开启生产实盘总开关");
    expect(disabled).not.toContain("确认并启动生产实盘");
    expect(disabled).not.toContain("确认并续期生产会话");
    expect(enabled).not.toContain("先到设置开启生产实盘总开关");
    expect(enabled).not.toContain("先到自动交易控制台选择生产实盘并保存开启");
    expect(enabled).toContain("确认并续期生产会话");
    expect(enabled).not.toContain("确认并启动生产实盘");
  });
});
