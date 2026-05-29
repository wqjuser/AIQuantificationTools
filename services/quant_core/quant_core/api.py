from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from quant_core.adapters import DemoMarketDataAdapter
from quant_core.ai import LocalResearchAssistant
from quant_core.backtest import BacktestEngine
from quant_core.cache import MarketDataCache
from quant_core.domain import AiResearchRequest, Condition, MarketDataRequest, RiskRules, StrategyConfig
from quant_core.execution import (
    PaperExecutionStore,
    build_promotion_candidate,
    create_paper_execution_from_audit,
    paper_execution_payload_to_record,
    paper_execution_record_to_payload,
)
from quant_core.live_quotes import QuantDingerLiveQuoteAdapter, market_quotes_to_payload, workspace_with_live_quotes
from quant_core.market_klines import QuantDingerKlineAdapter, market_klines_to_payload
from quant_core.market_search import MarketSymbolSearchAdapter, market_search_to_payload
from quant_core.research import run_terminal_research, strategy_config_from_snapshot
from quant_core.research_notes import ResearchNoteStore, research_note_to_payload
from quant_core.runs import (
    ResearchRunStore,
    research_run_audit_to_payload,
    research_run_audits_to_payload,
    research_run_export_to_payload,
    research_run_import_paper_executions,
    research_run_import_to_audit,
)
from quant_core.strategy_library import (
    StrategyLibraryStore,
    strategy_library_record_to_payload,
    strategy_library_records_to_payload,
)
from quant_core.terminal import StrategySnapshot, build_terminal_workspace, terminal_workspace_to_payload


def _json_default(value):
    if isinstance(value, datetime):
        return value.isoformat()
    if hasattr(value, "__dataclass_fields__"):
        return asdict(value)
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def _response(payload: object) -> bytes:
    return json.dumps(payload, ensure_ascii=False, default=_json_default).encode("utf-8")


class QuantApiHandler(BaseHTTPRequestHandler):
    cache = MarketDataCache(Path("data/market.sqlite"))
    adapter = DemoMarketDataAdapter()
    assistant = LocalResearchAssistant()
    engine = BacktestEngine()
    run_store = ResearchRunStore(Path("data/research_runs.sqlite"))
    paper_execution_store = PaperExecutionStore(Path("data/paper_executions.sqlite"))
    strategy_store = StrategyLibraryStore(Path("data/strategies.sqlite"))
    note_store = ResearchNoteStore(Path("data/research_notes.sqlite"))
    quote_adapter = QuantDingerLiveQuoteAdapter()
    kline_adapter = QuantDingerKlineAdapter(fallback_adapter=adapter)
    search_adapter = MarketSymbolSearchAdapter()

    def do_OPTIONS(self) -> None:
        self._send_json({})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/strategies":
            try:
                payload = self._read_json_body()
                market = str(payload.get("market") or "ashare")
                symbol = str(payload.get("symbol") or "600000")
                timeframe = str(payload.get("timeframe") or "1d")
                snapshot = _strategy_snapshot_from_payload(payload.get("strategy"))
                strategy = strategy_config_from_snapshot(snapshot, market=market, symbol=symbol, timeframe=timeframe)
                audit_run_id = str(payload.get("auditRunId") or "").strip() or None
                record = self.strategy_store.save(strategy, audit_run_id=audit_run_id)
            except ValueError as error:
                self._send_json({"error": "invalid_strategy", "detail": str(error)}, status=400)
                return
            self._send_json({"strategy": strategy_library_record_to_payload(record)}, status=201)
            return
        if parsed.path == "/api/research/notes":
            try:
                payload = self._read_json_body()
                note = self.note_store.save(
                    market=str(payload.get("market") or ""),
                    symbol=str(payload.get("symbol") or ""),
                    timeframe=str(payload.get("timeframe") or ""),
                    body=str(payload.get("body") or ""),
                )
            except ValueError as error:
                self._send_json({"error": "invalid_research_note", "detail": str(error)}, status=400)
                return
            self._send_json({"note": research_note_to_payload(note)}, status=201)
            return
        if parsed.path == "/api/research/runs/import":
            try:
                payload = self._read_json_body()
                audit = research_run_import_to_audit(payload)
                paper_executions = research_run_import_paper_executions(payload, run_id=audit.run_id)
                paper_execution_records = [
                    paper_execution_payload_to_record(execution_payload) for execution_payload in paper_executions
                ]
            except ValueError as error:
                self._send_json({"error": "invalid_research_run_export", "detail": str(error)}, status=400)
                return
            self.run_store.record(audit)
            for execution_record in paper_execution_records:
                self.paper_execution_store.record(execution_record)
            self._send_json({"run": research_run_audit_to_payload(audit, include_data_snapshot=True)}, status=201)
            return
        if parsed.path.startswith("/api/research/runs/") and parsed.path.endswith("/paper-executions"):
            run_id = unquote(parsed.path.removeprefix("/api/research/runs/").removesuffix("/paper-executions")).strip()
            audit = self.run_store.get(run_id) if run_id else None
            if not audit:
                self._send_json({"error": "research_run_not_found", "runId": run_id}, status=404)
                return
            try:
                execution = create_paper_execution_from_audit(audit)
            except ValueError as error:
                self._send_json({"error": "invalid_paper_execution", "detail": str(error)}, status=400)
                return
            self.paper_execution_store.record(execution)
            executions = self.paper_execution_store.list_by_run(run_id, limit=20)
            self._send_json(
                {
                    "execution": paper_execution_record_to_payload(execution),
                    "promotion": build_promotion_candidate(audit, executions),
                },
                status=201,
            )
            return
        self._send_json({"error": "not_found"}, status=404)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self._send_json({"status": "ok", "service": "quant-core"})
            return
        if parsed.path == "/api/demo":
            query = parse_qs(parsed.query)
            payload = self._demo_payload(
                market=query.get("market", ["ashare"])[0],
                symbol=query.get("symbol", ["600000"])[0],
                timeframe=query.get("timeframe", ["1d"])[0],
            )
            self._send_json(payload)
            return
        if parsed.path == "/api/workspace":
            workspace, _quotes = workspace_with_live_quotes(build_terminal_workspace(), self.quote_adapter)
            self._send_json(terminal_workspace_to_payload(workspace))
            return
        if parsed.path == "/api/market/quotes":
            query = parse_qs(parsed.query)
            workspace = build_terminal_workspace()
            instruments = workspace.watchlist
            market = query.get("market", [""])[0]
            symbol = query.get("symbol", [""])[0]
            if market and symbol:
                instruments = [instrument for instrument in instruments if instrument.market == market and instrument.symbol == symbol]
                if not instruments:
                    from quant_core.terminal import Instrument

                    instruments = [Instrument(symbol=symbol, name=symbol, market=market, change_pct=0.0)]
            quotes = self.quote_adapter.fetch_quotes(instruments)
            self._send_json(market_quotes_to_payload(quotes))
            return
        if parsed.path == "/api/market/search":
            query = parse_qs(parsed.query)
            market = query.get("market", ["ashare"])[0]
            search_query = query.get("query", [""])[0]
            limit = _parse_search_limit(query.get("limit", ["8"])[0])
            results = self.search_adapter.search(market=market, query=search_query, limit=limit)
            self._send_json(market_search_to_payload(market, search_query, results))
            return
        if parsed.path == "/api/market/klines":
            query = parse_qs(parsed.query)
            market = query.get("market", ["ashare"])[0]
            symbol = query.get("symbol", ["600000"])[0]
            timeframe = query.get("timeframe", ["1d"])[0]
            limit = _parse_kline_limit(query.get("limit", ["160"])[0])
            request = MarketDataRequest(
                market=market,
                symbol=symbol,
                timeframe=timeframe,
                end=_parse_kline_end(query.get("end", [""])[0]),
            )
            bars, quality = self.kline_adapter.fetch_ohlcv(request, limit=limit)
            self.cache.upsert_bars(bars)
            self._send_json(market_klines_to_payload(market, symbol, timeframe, bars, quality))
            return
        if parsed.path == "/api/strategies":
            query = parse_qs(parsed.query)
            market = query.get("market", [""])[0].strip() or None
            symbol = query.get("symbol", [""])[0].strip() or None
            limit = _parse_limit(query.get("limit", ["20"])[0])
            records = self.strategy_store.list_recent(market=market, symbol=symbol, limit=limit)
            self._send_json(strategy_library_records_to_payload(records))
            return
        if parsed.path.startswith("/api/strategies/"):
            revision = unquote(parsed.path.removeprefix("/api/strategies/")).strip()
            record = self.strategy_store.get(revision)
            if not record:
                self._send_json({"error": "strategy_not_found", "revision": revision}, status=404)
                return
            self._send_json({"strategy": strategy_library_record_to_payload(record)})
            return
        if parsed.path == "/api/research/notes":
            query = parse_qs(parsed.query)
            try:
                note = self.note_store.get(
                    market=query.get("market", ["ashare"])[0],
                    symbol=query.get("symbol", ["600000"])[0],
                    timeframe=query.get("timeframe", ["1d"])[0],
                )
            except ValueError as error:
                self._send_json({"error": "invalid_research_note", "detail": str(error)}, status=400)
                return
            self._send_json({"note": research_note_to_payload(note)})
            return
        if parsed.path == "/api/research/run":
            query = parse_qs(parsed.query)
            market = query.get("market", ["ashare"])[0]
            symbol = query.get("symbol", ["600000"])[0]
            timeframe = query.get("timeframe", ["1d"])[0]
            research_note = research_note_to_payload(
                self.note_store.get(market=market, symbol=symbol, timeframe=timeframe)
            )
            workspace = run_terminal_research(
                market=market,
                symbol=symbol,
                timeframe=timeframe,
                adapter=self.kline_adapter,
                assistant=self.assistant,
                engine=_backtest_engine_from_query(query),
                cache=self.cache,
                run_store=self.run_store,
                data_limit=_parse_research_data_limit(query.get("limit", ["500"])[0]),
                strategy_snapshot=_strategy_snapshot_from_query(query),
                research_note=research_note,
            )
            if workspace.research_run:
                strategy = strategy_config_from_snapshot(
                    workspace.strategy,
                    market=workspace.selected_instrument.market,
                    symbol=workspace.selected_instrument.symbol,
                    timeframe=workspace.selected_timeframe,
                )
                self.strategy_store.save(strategy, audit_run_id=workspace.research_run.run_id)
            self._send_json(terminal_workspace_to_payload(workspace))
            return
        if parsed.path.startswith("/api/research/runs/") and parsed.path.endswith("/paper-executions"):
            run_id = unquote(parsed.path.removeprefix("/api/research/runs/").removesuffix("/paper-executions")).strip()
            audit = self.run_store.get(run_id) if run_id else None
            if not audit:
                self._send_json({"error": "research_run_not_found", "runId": run_id}, status=404)
                return
            executions = self.paper_execution_store.list_by_run(run_id, limit=20)
            self._send_json({"executions": [paper_execution_record_to_payload(execution) for execution in executions]})
            return
        if parsed.path.startswith("/api/research/runs/") and parsed.path.endswith("/promotion"):
            run_id = unquote(parsed.path.removeprefix("/api/research/runs/").removesuffix("/promotion")).strip()
            audit = self.run_store.get(run_id) if run_id else None
            if not audit:
                self._send_json({"error": "research_run_not_found", "runId": run_id}, status=404)
                return
            executions = self.paper_execution_store.list_by_run(run_id, limit=20)
            self._send_json({"promotion": build_promotion_candidate(audit, executions)})
            return
        if parsed.path.startswith("/api/research/runs/") and parsed.path.endswith("/export"):
            run_id = unquote(parsed.path.removeprefix("/api/research/runs/").removesuffix("/export")).strip()
            audit = self.run_store.get(run_id) if run_id else None
            if not audit:
                self._send_json({"error": "research_run_not_found", "runId": run_id}, status=404)
                return
            executions = [
                paper_execution_record_to_payload(execution)
                for execution in self.paper_execution_store.list_by_run(run_id, limit=20)
            ]
            promotion_candidate = build_promotion_candidate(audit, self.paper_execution_store.list_by_run(run_id, limit=20))
            self._send_json(
                {
                    "export": research_run_export_to_payload(
                        audit,
                        paper_executions=executions,
                        promotion_candidate=promotion_candidate,
                    )
                }
            )
            return
        if parsed.path.startswith("/api/research/runs/"):
            run_id = unquote(parsed.path.removeprefix("/api/research/runs/")).strip()
            audit = self.run_store.get(run_id) if run_id else None
            if not audit:
                self._send_json({"error": "research_run_not_found", "runId": run_id}, status=404)
                return
            self._send_json({"run": research_run_audit_to_payload(audit, include_data_snapshot=True)})
            return
        if parsed.path == "/api/research/runs":
            query = parse_qs(parsed.query)
            limit = _parse_limit(query.get("limit", ["10"])[0])
            self._send_json(research_run_audits_to_payload(self.run_store.list_recent(limit=limit)))
            return
        self._send_json({"error": "not_found"}, status=404)

    def _demo_payload(self, market: str, symbol: str, timeframe: str) -> dict[str, object]:
        request = MarketDataRequest(
            market=market,
            symbol=symbol,
            timeframe=timeframe,
            end=datetime.now(timezone.utc),
        )
        bars, quality = self.adapter.fetch_ohlcv(request)
        self.cache.upsert_bars(bars)
        strategy = StrategyConfig(
            name="SMA trend demo",
            market=market,
            symbols=[symbol],
            timeframe=timeframe,
            entry_conditions=[Condition(kind="close_above_sma", params={"window": 20})],
            exit_conditions=[Condition(kind="close_below_sma", params={"window": 20})],
            risk=RiskRules(position_pct=0.8, stop_loss_pct=0.08, take_profit_pct=0.18, max_drawdown_pct=0.2),
        )
        result = self.engine.run(strategy, bars)
        report = self.assistant.analyze(
            AiResearchRequest(
                strategy_name=result.strategy_name,
                market=result.market,
                risk_preference="balanced",
                metrics=result.metrics,
                notes=quality.warnings,
            )
        )
        return {
            "quality": quality,
            "strategy": json.loads(strategy.to_json()),
            "backtest": result,
            "aiReport": report,
            "bars": bars[-80:],
        }

    def _send_json(self, payload: object, status: int = 200) -> None:
        body = _response(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self) -> dict[str, object]:
        content_length = int(self.headers.get("Content-Length", "0") or "0")
        if content_length <= 0:
            raise ValueError("request_body_required")
        if content_length > 10_000_000:
            raise ValueError("request_body_too_large")
        raw = self.rfile.read(content_length)
        try:
            payload = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError as error:
            raise ValueError("request_body_must_be_json") from error
        if not isinstance(payload, dict):
            raise ValueError("request_body_must_be_object")
        return payload

    def log_message(self, format: str, *args) -> None:
        return


def run(host: str = "127.0.0.1", port: int = 8765) -> None:
    server = HTTPServer((host, port), QuantApiHandler)
    print(f"quant-core API listening on http://{host}:{port}")
    server.serve_forever()


def _parse_limit(raw: str) -> int:
    try:
        value = int(raw)
    except ValueError:
        return 10
    return max(1, min(value, 50))


def _parse_kline_limit(raw: str) -> int:
    try:
        value = int(raw)
    except ValueError:
        return 160
    return max(1, min(value, 500))


def _parse_research_data_limit(raw: str) -> int:
    try:
        value = int(raw)
    except ValueError:
        return 500
    return max(1, min(value, 500))


def _strategy_snapshot_from_query(query: dict[str, list[str]]) -> StrategySnapshot | None:
    strategy_keys = ["strategyName", "strategyEntry", "strategyExit", "strategyPosition", "strategyRisk"]
    if not any(key in query for key in strategy_keys):
        return None
    return StrategySnapshot(
        name=query.get("strategyName", ["SMA trend demo"])[0].strip() or "SMA trend demo",
        entry=query.get("strategyEntry", ["Close > SMA20"])[0].strip() or "Close > SMA20",
        exit=query.get("strategyExit", ["Close < SMA20, stop loss, take profit, or end of backtest"])[0].strip()
        or "Close < SMA20, stop loss, take profit, or end of backtest",
        position=query.get("strategyPosition", ["80% max capital allocation"])[0].strip() or "80% max capital allocation",
        risk=query.get("strategyRisk", ["Stop -8%, take profit +18%, drawdown guard 20%, paper only"])[0].strip()
        or "Stop -8%, take profit +18%, drawdown guard 20%, paper only",
    )


def _strategy_snapshot_from_payload(value: object) -> StrategySnapshot:
    if not isinstance(value, dict):
        raise ValueError("strategy_payload_required")
    return StrategySnapshot(
        name=str(value.get("name") or "SMA trend demo").strip() or "SMA trend demo",
        entry=str(value.get("entry") or "Close > SMA20").strip() or "Close > SMA20",
        exit=str(value.get("exit") or "Close < SMA20, stop loss, take profit, or end of backtest").strip()
        or "Close < SMA20, stop loss, take profit, or end of backtest",
        position=str(value.get("position") or "80% max capital allocation").strip() or "80% max capital allocation",
        risk=str(value.get("risk") or "Stop -8%, take profit +18%, drawdown guard 20%, paper only").strip()
        or "Stop -8%, take profit +18%, drawdown guard 20%, paper only",
    )


def _parse_kline_end(raw: str) -> datetime | None:
    value = raw.strip()
    if not value:
        return None
    try:
        timestamp = float(value)
        if timestamp > 10**12:
            timestamp /= 1000
        return datetime.fromtimestamp(timestamp, tz=timezone.utc)
    except ValueError:
        pass
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _parse_search_limit(raw: str) -> int:
    try:
        value = int(raw)
    except ValueError:
        return 8
    return max(1, min(value, 20))


def _backtest_engine_from_query(query: dict[str, list[str]]) -> BacktestEngine:
    initial_cash = _parse_positive_float(query.get("initialCash", ["100000"])[0], default=100_000)
    fee_bps = _parse_bps(query.get("feeBps", ["3"])[0], default=3)
    slippage_bps = _parse_bps(query.get("slippageBps", ["2"])[0], default=2)
    return BacktestEngine(initial_cash=initial_cash, fee_rate=fee_bps / 10_000, slippage_rate=slippage_bps / 10_000)


def _parse_positive_float(raw: str, *, default: float) -> float:
    try:
        value = float(raw)
    except ValueError:
        return default
    return value if value > 0 else default


def _parse_bps(raw: str, *, default: float) -> float:
    try:
        value = float(raw)
    except ValueError:
        return default
    if value < 0:
        return default
    return min(value, 1_000)


if __name__ == "__main__":
    run()
