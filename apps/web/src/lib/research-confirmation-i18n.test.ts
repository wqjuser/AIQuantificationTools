import { describe, expect, test } from "vitest";
import {
  researchContextReadinessDetail,
  researchContextReadinessValue
} from "../App";
import { createI18n } from "./i18n";

describe("research confirmation localization", () => {
  const i18n = createI18n("zh-CN");

  test("renders every confirmation value in Chinese", () => {
    expect(researchContextReadinessValue(i18n, {
      id: "calendar",
      value: "closed · after_hours"
    })).toBe("休市 · 盘后");
    expect(researchContextReadinessValue(i18n, {
      id: "watchlist",
      value: "unsaved changes"
    })).toBe("未保存更改");
    expect(researchContextReadinessValue(i18n, {
      id: "note",
      value: "not saved"
    })).toBe("未保存");
    expect(researchContextReadinessValue(i18n, {
      id: "workspace",
      value: "not saved"
    })).toBe("未保存");
  });

  test("renders confirmation guidance without raw domain English", () => {
    expect(researchContextReadinessDetail(i18n, {
      id: "calendar",
      detail:
        "Asia/Shanghai · next open 2026-07-20T09:30:00+08:00 · Static session template only; exchange holiday calendar is not configured."
    })).toBe(
      "上海时区 · 下一次开盘 2026-07-20T09:30:00+08:00 · 仅静态时段模板；未配置交易所节假日历。"
    );
    expect(researchContextReadinessDetail(i18n, {
      id: "calendar",
      detail: "unknown · no scheduled event · fallback"
    })).toBe("未知时区 · 无计划事件 · 备用日历");
    expect(researchContextReadinessDetail(i18n, {
      id: "calendar",
      detail: "America/New_York · next open 2026-07-20T09:30:00-04:00 · provider warning"
    })).toBe("当前交易日历信息需要复核，请打开交易日历查看市场时段。");
    expect(researchContextReadinessDetail(i18n, {
      id: "workspace",
      detail: "Save ASHARE · 600000 · 1d · research before relying on this workspace context."
    })).toBe("保存 A 股 · 600000 · 日 K · 研究入口 后再信任这个工作区上下文。");
    expect(researchContextReadinessDetail(i18n, {
      id: "klines",
      detail: "demo-fallback review · upstream timeout"
    })).toBe("当前 K 线数据质量需要复核，请前往数据刷新检查并重试。");
    expect(researchContextReadinessDetail(i18n, {
      id: "refresh",
      detail: "2026-07-17T12:00:00+08:00 · unknown · 0 rows cached · upstream failed"
    })).toBe("当前刷新证据需要复核，请前往数据刷新检查并重新刷新自选缓存。");
    expect(researchContextReadinessDetail(i18n, {
      id: "refresh",
      detail: "Run watchlist cache refresh for ASHARE · 600000 · 1d before relying on this context."
    })).toBe("当前研究上下文缺少匹配的刷新证据，请前往数据刷新运行自选缓存刷新。");
    expect(researchContextReadinessDetail(i18n, {
      id: "note",
      detail: "network unavailable"
    })).toBe("研究笔记尚未保存，请填写并保存后继续。");
  });
});
