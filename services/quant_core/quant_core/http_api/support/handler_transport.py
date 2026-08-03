from __future__ import annotations

import json
import os
from .transport import _response
from datetime import (
    datetime,
    timezone,
)
from quant_core.domain import (
    AiResearchRequest,
    Condition,
    MarketDataRequest,
    RiskRules,
    StrategyConfig,
)
from quant_core.deployment import load_deployment_config

class HandlerTransportMixin:
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
        self._send_security_headers()
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        try:
            self.wfile.write(body)
        except OSError:
            # Browsers can intentionally abort a long-running AI request. Treat
            # that disconnect like the NDJSON transport does instead of letting
            # socketserver print a traceback for a successful cancellation.
            self.close_connection = True

    def _begin_ndjson_stream(self) -> None:
        self.send_response(200)
        self.send_header(
            "Content-Type",
            "application/x-ndjson; charset=utf-8",
        )
        self._send_security_headers()
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Accel-Buffering", "no")
        self.send_header("Connection", "close")
        self.end_headers()
        self.close_connection = True

    def _send_ndjson_event(self, payload: object) -> bool:
        try:
            self.wfile.write(_response(payload) + b"\n")
            self.wfile.flush()
        except OSError:
            return False
        return True

    def _send_security_headers(self) -> None:
        deployment = load_deployment_config(os.environ)
        request_origin = str(getattr(self, "headers", {}).get("Origin", "")).rstrip("/")
        if deployment.public_origin and request_origin == deployment.public_origin:
            self.send_header("Access-Control-Allow-Origin", deployment.public_origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type, X-AIQT-CSRF, X-AIQT-Install-Intent",
        )
        self.send_header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Content-Type-Options", "nosniff")
        if deployment.mode == "public":
            self.send_header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

    def _read_json_body(self) -> dict[str, object]:
        raw_content_length = self.headers.get("Content-Length")
        if raw_content_length is None:
            raise ValueError("request_body_required")
        if not raw_content_length.isascii() or not raw_content_length.isdecimal():
            raise ValueError("request_body_invalid_content_length")
        try:
            content_length = int(raw_content_length)
        except ValueError:
            raise ValueError("request_body_invalid_content_length") from None
        if content_length == 0:
            raise ValueError("request_body_required")
        if content_length > 10_000_000:
            raise ValueError("request_body_too_large")
        raw = self.rfile.read(content_length)
        if len(raw) != content_length:
            raise ValueError("request_body_incomplete")
        try:
            decoded = raw.decode("utf-8")
        except UnicodeDecodeError:
            raise ValueError("request_body_must_be_utf8") from None
        try:
            payload = json.loads(decoded)
        except json.JSONDecodeError:
            raise ValueError("request_body_must_be_json") from None
        if not isinstance(payload, dict):
            raise ValueError("request_body_must_be_object")
        return payload

    def log_message(self, format: str, *args) -> None:
        return
