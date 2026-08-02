import { Locale, supportedLocales } from "../../../lib/i18n";
import { Market } from "../../../lib/terminal-workbench";
import { DEFAULT_TEXT_SCALE, MAX_TEXT_SCALE, MIN_TEXT_SCALE } from "../../../lib/theme";
import { researchPipelineLockedEvidenceLabel, researchPipelineLockedEvidenceTitle, researchPipelinePreflightStatusLabel } from "../../research/ResearchPipelineFormatters";
import { cacheContextKey, canRefreshSearchSuggestionCache, marketSearchCacheSummary, marketSearchRefreshLabel } from "../../settings/SettingsFormatters";
import { timeframeOptions } from "../initial-state";
import { Activity, Copy, Database, Languages, Moon, Play, RefreshCw, Search, Sun, Timer, Type } from "lucide-react";
import type { AppControllerBindings } from "../controller/bindings";

export type TerminalTopbarViewModel = Pick<AppControllerBindings,
    "activeWorkArea" | "changeLocale" | "changeMarketDraft" | "changeSymbolDraft" | "changeTextScale" | "colorScheme" | "colorSchemeToggleLabel" | "copiedResearchContextLink" | "copyResearchContextLink" | "currentExecutionModeLabel" | "currentExecutionTone" | "currentLiveBadgeLabel" | "error" | "footerLiveTradingAllowed" | "i18n" | "isRefreshing" | "isRunning" | "isSearchOpen" | "isSymbolSearching" | "locale" | "marketDraft" | "openSymbolSearch" | "refreshSearchSuggestionCache" | "refreshingCacheKey" | "researchPipelinePreflight" | "runPipeline" | "searchSuggestions" | "selectSearchSuggestion" | "selectTimeframe" | "source" | "statusLabel" | "submitSymbol" | "symbolDraft" | "textScale" | "textScalePercent" | "toggleColorScheme" | "workspace"
  >;

type TerminalTopbarProps = { controller: TerminalTopbarViewModel };

export function TerminalTopbar({ controller }: TerminalTopbarProps) {
  const {
    activeWorkArea, changeLocale, changeMarketDraft, changeSymbolDraft, changeTextScale,
    colorScheme, colorSchemeToggleLabel, copiedResearchContextLink, copyResearchContextLink,
    currentExecutionModeLabel, currentExecutionTone, currentLiveBadgeLabel, error, footerLiveTradingAllowed,
    i18n, isRefreshing, isRunning, isSearchOpen, isSymbolSearching,
    locale, marketDraft, openSymbolSearch, refreshSearchSuggestionCache, refreshingCacheKey, researchPipelinePreflight,
    runPipeline, searchSuggestions, selectSearchSuggestion, selectTimeframe,
    source, statusLabel, submitSymbol, symbolDraft, textScale,
    textScalePercent, toggleColorScheme, workspace
  } = controller;
  return (
    <header className="terminal-topbar">
              <div className="terminal-global-tape" aria-label="全球市场快照">
                {workspace.watchlist.slice(0, 3).map((instrument) => (
                  <span key={`${instrument.market}-${instrument.symbol}`}>
                    {i18n.instrumentName(instrument.name)} <em>
                      {instrument.price?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}
                      {" "}{instrument.changePct >= 0 ? "+" : ""}{instrument.changePct.toFixed(2)}%
                    </em>
                  </span>
                ))}
                <span
                  className="terminal-data-fresh"
                  title={source === "core" ? "前台页面约每 35 秒自动刷新" : "当前使用本地快照"}
                >
                  <Activity size={12} />{source === "core" ? "行情自动刷新" : "本地快照"}
                </span>
              </div>
              <div className="terminal-route-heading">
                <p className="section-label">
                  {workspace.selectedInstrument.symbol} · {i18n.marketLabel(workspace.selectedInstrument.market)} · {workspace.selectedTimeframe}
                </p>
                <h1>
                  {activeWorkArea ? i18n.productWorkAreaLabel(activeWorkArea) : i18n.t("topbar.eyebrow")}
                  <small>{i18n.instrumentName(workspace.selectedInstrument.name)}</small>
                </h1>
              </div>
              <div className="topbar-actions">
                <form className="symbol-switcher" onSubmit={submitSymbol} aria-label={i18n.t("aria.symbolSwitcher")}>
                  <select
                    aria-label={i18n.t("symbol.market")}
                    onChange={(event) => changeMarketDraft(event.currentTarget.value as Market)}
                    value={marketDraft}
                  >
                    {(["ashare", "us", "crypto"] as Market[]).map((market) => (
                      <option key={market} value={market}>
                        {i18n.marketLabel(market)}
                      </option>
                    ))}
                  </select>
                  <div className="symbol-field">
                    <input
                      aria-label={i18n.t("symbol.placeholder")}
                      autoComplete="off"
                      id="terminal-symbol-input"
                      onChange={(event) => {
                        changeSymbolDraft(event.currentTarget.value);
                      }}
                      onFocus={() => {
                        if (symbolDraft.trim()) {
                          openSymbolSearch();
                        }
                      }}
                      placeholder={i18n.t("symbol.placeholder")}
                      value={symbolDraft}
                    />
                    {isSearchOpen && symbolDraft.trim() ? (
                      <div className="symbol-suggestions">
                        {isSymbolSearching ? (
                          <span className="symbol-suggestion-state">{i18n.t("symbol.searching")}</span>
                        ) : null}
                        {!isSymbolSearching && searchSuggestions.length
                          ? searchSuggestions.map((suggestion) => (
                              <div className="symbol-suggestion-row" key={`${suggestion.market}-${suggestion.symbol}-${suggestion.source}`}>
                                <button
                                  className="symbol-suggestion-select"
                                  onClick={() => selectSearchSuggestion(suggestion)}
                                  type="button"
                                >
                                  <span>
                                    <strong>{suggestion.symbol}</strong>
                                    <em>{suggestion.name}</em>
                                  </span>
                                  <span className="symbol-suggestion-meta">
                                    <small className="symbol-suggestion-venue">
                                      {suggestion.exchange ? `${suggestion.exchange} · ` : ""}
                                      {suggestion.source}
                                    </small>
                                    {suggestion.cache ? (
                                      <>
                                        <span aria-hidden="true" className="symbol-suggestion-divider">·</span>
                                        <small className={`symbol-suggestion-cache ${suggestion.cache.freshness}`}>
                                          {marketSearchCacheSummary(i18n, suggestion.cache)}
                                        </small>
                                      </>
                                    ) : null}
                                  </span>
                                </button>
                                {canRefreshSearchSuggestionCache(suggestion) ? (
                                  <button
                                    className="symbol-suggestion-refresh"
                                    aria-label={`${marketSearchRefreshLabel(i18n, suggestion)} ${suggestion.symbol}`}
                                    disabled={
                                      refreshingCacheKey ===
                                      cacheContextKey({
                                        market: suggestion.market,
                                        symbol: suggestion.symbol,
                                        timeframe: workspace.selectedTimeframe
                                      })
                                    }
                                    onClick={() => void refreshSearchSuggestionCache(suggestion)}
                                    type="button"
                                  >
                                    <RefreshCw size={12} />
                                    {marketSearchRefreshLabel(i18n, suggestion)}
                                  </button>
                                ) : null}
                              </div>
                            ))
                          : null}
                        {!isSymbolSearching && !searchSuggestions.length ? (
                          <span className="symbol-suggestion-state">{i18n.t("symbol.noResults")}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <button type="submit">
                    <Search size={15} />
                    {i18n.t("action.switchSymbol")}
                  </button>
                </form>
                <span className={`terminal-paper-badge ${currentExecutionTone}`}>
                  {currentExecutionModeLabel}
                </span>
                <span className={`terminal-live-badge ${footerLiveTradingAllowed ? "authorized" : ""}`}>
                  {currentLiveBadgeLabel}
                </span>
                <button
                  className="context-link-button"
                  onClick={() => void copyResearchContextLink()}
                  title={`${workspace.selectedInstrument.market} · ${workspace.selectedInstrument.symbol} · ${workspace.selectedTimeframe}`}
                  type="button"
                >
                  <Copy size={14} />
                  {copiedResearchContextLink ? i18n.t("action.researchContextLinkCopied") : i18n.t("action.copyResearchContextLink")}
                </button>
                <span className={`status-pill ${source === "core" ? "ok" : "paper"}`} title={error}>
                  {i18n.statusLabel(statusLabel)}
                </span>
                <span className="status-pill paper">{i18n.executionMode(workspace.execution)}</span>
                {researchPipelinePreflight.lockedPreparationEvidence ? (
                  <span
                    className="status-pill evidence-lock"
                    title={researchPipelineLockedEvidenceTitle(i18n, researchPipelinePreflight)}
                  >
                    <Database size={14} />
                    {researchPipelineLockedEvidenceLabel(i18n, researchPipelinePreflight)}
                  </span>
                ) : null}
                <div className="locale-control" aria-label={i18n.t("aria.language")}>
                  <Languages size={15} />
                  <select
                    aria-label={i18n.t("aria.language")}
                    className="locale-select"
                    onChange={(event) => changeLocale(event.currentTarget.value as Locale)}
                    value={locale}
                  >
                    {supportedLocales.map((candidate) => (
                      <option key={candidate} value={candidate}>
                        {i18n.localeOptionLabel(candidate)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="timeframe-control" aria-label={i18n.t("aria.timeframe")}>
                  <Timer size={15} />
                  {timeframeOptions.map((timeframe) => (
                    <button
                      className={workspace.selectedTimeframe === timeframe ? "active" : ""}
                      key={timeframe}
                      onClick={() => selectTimeframe(timeframe)}
                    >
                      {timeframe}
                    </button>
                  ))}
                </div>
                <button
                  className="run-button"
                  disabled={isRefreshing || isRunning || !researchPipelinePreflight.canRun}
                  onClick={() => void runPipeline()}
                  title={researchPipelinePreflightStatusLabel(i18n, researchPipelinePreflight)}
                >
                  {isRefreshing || isRunning ? <RefreshCw className="spin" size={17} /> : <Play size={17} />}
                  {i18n.t("action.runPipeline")}
                </button>
                <details className="text-scale-control">
                  <summary
                    aria-label={i18n.locale === "zh-CN" ? "调整文字大小" : "Adjust text size"}
                    className="panel-icon-button"
                    title={i18n.locale === "zh-CN" ? `文字大小 ${textScalePercent}%` : `Text size ${textScalePercent}%`}
                  >
                    <Type size={16} />
                  </summary>
                  <div className="text-scale-popover">
                    <label htmlFor="terminal-text-scale">
                      <span>{i18n.locale === "zh-CN" ? "文字大小" : "Text size"}</span>
                      <strong>{textScalePercent}%</strong>
                    </label>
                    <input
                      aria-label={i18n.locale === "zh-CN" ? "文字大小比例" : "Text size percentage"}
                      aria-valuetext={`${textScalePercent}%`}
                      id="terminal-text-scale"
                      max={MAX_TEXT_SCALE}
                      min={MIN_TEXT_SCALE}
                      onInput={(event) => changeTextScale(Number(event.currentTarget.value))}
                      step={0.05}
                      type="range"
                      value={textScale}
                    />
                    <div aria-label={i18n.locale === "zh-CN" ? "文字大小快捷档位" : "Text size presets"} className="text-scale-presets">
                      {[MIN_TEXT_SCALE, 1.25, MAX_TEXT_SCALE].map((scale) => (
                        <button
                          aria-pressed={textScale === scale}
                          className={textScale === scale ? "active" : ""}
                          key={scale}
                          onClick={() => changeTextScale(scale)}
                          type="button"
                        >
                          {Math.round(scale * 100)}%
                        </button>
                      ))}
                    </div>
                    <footer>
                      <small>{i18n.locale === "zh-CN" ? "仅保存在当前设备" : "Saved on this device only"}</small>
                      <button onClick={() => changeTextScale(DEFAULT_TEXT_SCALE)} type="button">
                        {i18n.locale === "zh-CN" ? "恢复默认" : "Reset"}
                      </button>
                    </footer>
                  </div>
                </details>
                <button
                  aria-label={colorSchemeToggleLabel}
                  className="panel-icon-button theme-toggle-button"
                  onClick={toggleColorScheme}
                  title={colorSchemeToggleLabel}
                  type="button"
                >
                  {colorScheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              </div>
            </header>
  );
}
