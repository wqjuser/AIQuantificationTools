import { createI18n } from "../../lib/i18n";

export const terminalSurfaceZh = createI18n("zh-CN");

export function formatPrice(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return Math.abs(value) >= 1 || value === 0
    ? value.toFixed(2)
    : value.toLocaleString("zh-CN", { maximumFractionDigits: 8 });
}

export function marketDiscoveryNumber(
  value: number | null,
  suffix = "",
  maximumFractionDigits = 2,
) {
  return value === null
    ? "—"
    : `${value.toLocaleString("zh-CN", { maximumFractionDigits })}${suffix}`;
}

export function connectorTimestamp(value: string | null | undefined): string {
  if (!value) return "暂无成功证据";
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? value : timestamp.toLocaleString("zh-CN");
}
