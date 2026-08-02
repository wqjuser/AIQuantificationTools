import { type AppI18n } from "../../lib/i18n";
import { ScannerCandidate } from "../../lib/terminal-workbench";

export function scannerSignalLabel(i18n: AppI18n, signal: ScannerCandidate["signal"]): string {
  if (i18n.locale === "en-US") {
    return signal;
  }
  return {
    "Momentum watch": "动量观察",
    "Baseline watch": "基准观察",
    "Risk review": "风险复核"
  }[signal];
}
