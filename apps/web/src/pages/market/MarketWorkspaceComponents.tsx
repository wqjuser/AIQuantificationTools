import { Panel } from "../../components/AppPanel";
import { type AppI18n } from "../../lib/i18n";
import { PlatformSettingsStatus } from "../../lib/terminal-api";
import { ScannerCandidate, TerminalWorkspace, buildMarketDataProviderHealthTrendRows, buildMarketDataProviderHealthTrendSummary } from "../../lib/terminal-workbench";
import { providerHealthTrendCategoryLabel, providerHealthTrendLatestLabel, providerHealthTrendMomentumLabel, providerHealthTrendWindowLabel } from "../settings/SettingsFormatters";
import { riskLabel } from "../strategy/StrategyFormatters";
import { scannerSignalLabel } from "./ScannerFormatters";
import { Search } from "lucide-react";

export function ScannerWorkspace({
  candidates,
  className = "module-workspace-panel",
  i18n,
  onSelectInstrument
}: {
  candidates: ScannerCandidate[];
  className?: string;
  i18n: AppI18n;
  onSelectInstrument: (instrument: TerminalWorkspace["selectedInstrument"]) => void;
}) {
  return (
    <Panel title={i18n.t("module.scanner.title")} subtitle={i18n.t("module.scanner.subtitle")} className={className}>
      <div className="module-toolbar">
        <span>
          {i18n.t("module.scanner.filters")}: {i18n.strategyText("watchlist · momentum · risk")}
        </span>
        <strong>{candidates.length}</strong>
      </div>
      <div className="scanner-table">
        <div className="scanner-row scanner-head">
          <span>{i18n.t("chart.symbol")}</span>
          <span>{i18n.t("module.scanner.score")}</span>
          <span>{i18n.t("module.scanner.signal")}</span>
          <span>{i18n.t("module.scanner.risk")}</span>
          <span>{i18n.t("module.scanner.research")}</span>
        </div>
        {candidates.map((candidate) => (
          <div className="scanner-row" key={`${candidate.instrument.market}-${candidate.instrument.symbol}`}>
            <span>
              <strong>{candidate.instrument.symbol}</strong>
              <em>{i18n.instrumentName(candidate.instrument.name)}</em>
            </span>
            <span>
              <b>{candidate.score}</b>
              <i style={{ width: `${candidate.score}%` }} />
            </span>
            <span>{scannerSignalLabel(i18n, candidate.signal)}</span>
            <span className={`risk-chip ${candidate.risk}`}>{riskLabel(i18n, candidate.risk)}</span>
            <button onClick={() => onSelectInstrument(candidate.instrument)} type="button">
              <Search size={14} />
              {i18n.t("module.scanner.research")}
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function MarketDataProviderHealthTrendStrip({
  health,
  i18n
}: {
  health: PlatformSettingsStatus["marketDataAdapters"][number]["externalTelemetry"]["providerHealth"];
  i18n: AppI18n;
}) {
  const rows = buildMarketDataProviderHealthTrendRows(health);
  const summary = buildMarketDataProviderHealthTrendSummary(health);
  return (
    <div className={`provider-health-trend ${summary.tone}`} title={summary.detail}>
      <div className="provider-health-trend-summary">
        <span>{i18n.locale === "zh-CN" ? "Provider 趋势" : "Provider trend"}</span>
        <strong>{providerHealthTrendMomentumLabel(i18n, summary.momentum)}</strong>
        <em>
          {summary.totalErrors.toLocaleString(i18n.locale === "zh-CN" ? "zh-CN" : "en-US")}{" "}
          {i18n.locale === "zh-CN" ? "次错误" : "errors"} ·{" "}
          {providerHealthTrendLatestLabel(i18n, summary.latestErrorAt)}
        </em>
      </div>
      <div className="provider-health-trend-bars">
        {rows.map((row) => (
          <div
            className={`provider-health-trend-window level-${row.intensityLevel} ${row.tone}`}
            key={`provider-health-trend-${row.id}`}
            title={`${providerHealthTrendWindowLabel(i18n, row.id)} · ${row.errorCount} · ${providerHealthTrendCategoryLabel(i18n, row.dominantCategory)}`}
          >
            <span>{providerHealthTrendWindowLabel(i18n, row.id)}</span>
            <strong>{row.errorCount.toLocaleString(i18n.locale === "zh-CN" ? "zh-CN" : "en-US")}</strong>
            <i className="provider-health-trend-track">
              <b className="provider-health-trend-fill" />
            </i>
            <em>{providerHealthTrendCategoryLabel(i18n, row.dominantCategory)}</em>
          </div>
        ))}
      </div>
    </div>
  );
}
