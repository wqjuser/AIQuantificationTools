from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from quant_core.adapters import DemoMarketDataAdapter
from quant_core.ai import LocalResearchAssistant
from quant_core.backtest import BacktestEngine
from quant_core.cache import MarketDataCache
from quant_core.domain import AiResearchRequest, Condition, MarketDataRequest, RiskRules, StrategyConfig
from quant_core.terminal import build_terminal_workspace, terminal_workspace_to_payload


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

    def do_OPTIONS(self) -> None:
        self._send_json({})

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
            self._send_json(terminal_workspace_to_payload(build_terminal_workspace()))
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
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args) -> None:
        return


def run(host: str = "127.0.0.1", port: int = 8765) -> None:
    server = HTTPServer((host, port), QuantApiHandler)
    print(f"quant-core API listening on http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
