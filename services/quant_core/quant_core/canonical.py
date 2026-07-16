from __future__ import annotations

import hashlib
import json
import math
from datetime import datetime, timezone
from typing import Any, cast

from quant_core.domain import Condition, Market, OHLCVBar, RiskRules, StrategyConfig, Timeframe


DATA_SNAPSHOT_HASH_VERSION = "aiqt-data-v2"
MAX_SNAPSHOT_BARS = 500

_SUPPORTED_MARKETS = {"ashare", "us", "crypto"}
_SUPPORTED_TIMEFRAMES = {"1d", "1w", "1m", "5m", "15m", "30m", "60m"}
_CONDITION_PARAMETERS = {
    "close_above_sma": ("window",),
    "close_below_sma": ("window",),
    "volume_above_sma": ("window",),
    "rsi_below": ("window", "threshold"),
    "rsi_above": ("window", "threshold"),
}


def _canonical_value(value: Any) -> Any:
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValueError("canonical_number_must_be_finite")
        if value == 0:
            return 0
        return int(value) if value.is_integer() else value
    if isinstance(value, list) or isinstance(value, tuple):
        return [_canonical_value(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _canonical_value(item) for key, item in value.items()}
    return value


def canonical_json(value: Any) -> str:
    return json.dumps(
        _canonical_value(value),
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    )


def canonical_sha256(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def normalize_snapshot_bars(bars: list[OHLCVBar | dict[str, Any]]) -> list[dict[str, Any]]:
    if len(bars) > MAX_SNAPSHOT_BARS:
        raise ValueError("data_snapshot_too_many_bars")

    normalized: list[tuple[datetime, dict[str, Any]]] = []
    timestamps: set[datetime] = set()
    for value in bars:
        record = value.to_record() if isinstance(value, OHLCVBar) else value
        if not isinstance(record, dict):
            raise ValueError("data_snapshot_bar_must_be_object")
        timestamp = _snapshot_timestamp(record.get("timestamp"))
        if timestamp in timestamps:
            raise ValueError("data_snapshot_duplicate_timestamp")
        timestamps.add(timestamp)

        open_price = _snapshot_number(record.get("open"), "price")
        high = _snapshot_number(record.get("high"), "price")
        low = _snapshot_number(record.get("low"), "price")
        close = _snapshot_number(record.get("close"), "price")
        volume = _snapshot_number(record.get("volume"), "volume")
        if high < max(open_price, low, close) or low > min(open_price, high, close):
            raise ValueError("data_snapshot_ohlc_relationship_invalid")

        normalized.append(
            (
                timestamp,
                {
                    "timestamp": timestamp.isoformat(),
                    "timestampMs": int(timestamp.timestamp() * 1000),
                    "open": open_price,
                    "high": high,
                    "low": low,
                    "close": close,
                    "volume": volume,
                },
            )
        )

    normalized.sort(key=lambda item: item[0])
    return [record for _, record in normalized]


def canonical_data_hash(bars: list[dict[str, Any]]) -> str:
    return canonical_sha256(bars)


def canonical_snapshot_id(*, market: str, symbol: str, timeframe: str, canonical_data_hash: str) -> str:
    return canonical_sha256(
        {
            "market": market,
            "symbol": symbol,
            "timeframe": timeframe,
            "canonicalDataHash": canonical_data_hash,
        }
    )


def snapshot_bars_to_ohlcv(
    bars: list[dict[str, Any]],
    *,
    market: str,
    symbol: str,
    timeframe: str,
) -> list[OHLCVBar]:
    _validate_strategy_context(market, symbol, timeframe)
    return [
        OHLCVBar(
            market=cast(Market, market),
            symbol=symbol,
            timeframe=cast(Timeframe, timeframe),
            timestamp=datetime.fromisoformat(bar["timestamp"]),
            open=float(bar["open"]),
            high=float(bar["high"]),
            low=float(bar["low"]),
            close=float(bar["close"]),
            volume=float(bar["volume"]),
        )
        for bar in normalize_snapshot_bars(bars)
    ]


def strategy_config_to_payload(strategy: StrategyConfig) -> dict[str, object]:
    return {
        "name": strategy.name,
        "revision": strategy.revision,
        "market": strategy.market,
        "symbols": list(strategy.symbols),
        "timeframe": strategy.timeframe,
        "version": strategy.version,
        "entryConditions": [_condition_payload(condition) for condition in strategy.entry_conditions],
        "exitConditions": [_condition_payload(condition) for condition in strategy.exit_conditions],
        "risk": {
            "positionPct": strategy.risk.position_pct,
            "stopLossPct": strategy.risk.stop_loss_pct,
            "takeProfitPct": strategy.risk.take_profit_pct,
            "maxDrawdownPct": strategy.risk.max_drawdown_pct,
        },
    }


def strategy_config_from_payload(payload: dict[str, Any]) -> StrategyConfig:
    if not isinstance(payload, dict):
        raise ValueError("strategy_config_must_be_object")
    market = str(payload.get("market") or "ashare")
    timeframe = str(payload.get("timeframe") or "1d")
    raw_symbols = payload.get("symbols", [])
    if not isinstance(raw_symbols, list):
        raise ValueError("strategy_symbols_must_be_array")
    symbols = [str(symbol).strip() for symbol in raw_symbols]
    if len(symbols) != 1 or not symbols[0]:
        raise ValueError("strategy_single_symbol_required")
    _validate_strategy_context(market, symbols[0], timeframe)

    try:
        version = int(payload.get("version") or 1)
    except (TypeError, ValueError) as error:
        raise ValueError("strategy_version_must_be_1") from error
    if version != 1:
        raise ValueError("strategy_version_must_be_1")

    risk = payload.get("risk") if isinstance(payload.get("risk"), dict) else {}
    position_pct = _risk_float(risk.get("positionPct", risk.get("position_pct", 1.0)))
    return StrategyConfig(
        name=str(payload.get("name") or "Imported strategy"),
        market=cast(Market, market),
        symbols=symbols,
        timeframe=cast(Timeframe, timeframe),
        entry_conditions=_conditions(payload.get("entryConditions", payload.get("entry_conditions", []))),
        exit_conditions=_conditions(payload.get("exitConditions", payload.get("exit_conditions", []))),
        risk=RiskRules(
            position_pct=position_pct,
            stop_loss_pct=_optional_float(risk.get("stopLossPct", risk.get("stop_loss_pct"))),
            take_profit_pct=_optional_float(risk.get("takeProfitPct", risk.get("take_profit_pct"))),
            max_drawdown_pct=_optional_float(risk.get("maxDrawdownPct", risk.get("max_drawdown_pct"))),
        ),
        version=version,
    )


def _snapshot_timestamp(value: Any) -> datetime:
    if isinstance(value, datetime):
        timestamp = value
    elif isinstance(value, str) and value.strip():
        try:
            timestamp = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
        except ValueError as error:
            raise ValueError("data_snapshot_timestamp_invalid") from error
    else:
        raise ValueError("data_snapshot_timestamp_invalid")
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=timezone.utc)
    return timestamp.astimezone(timezone.utc)


def _snapshot_number(value: Any, kind: str) -> int | float:
    if isinstance(value, bool):
        raise ValueError("data_snapshot_number_invalid")
    try:
        number = float(value)
    except (TypeError, ValueError) as error:
        raise ValueError("data_snapshot_number_invalid") from error
    if not math.isfinite(number):
        raise ValueError("data_snapshot_number_must_be_finite")
    if (kind == "price" and number <= 0) or (kind == "volume" and number < 0):
        raise ValueError(f"data_snapshot_{kind}_invalid")
    return int(number) if number.is_integer() else number


def _condition_payload(condition: Condition) -> dict[str, object]:
    return {"kind": condition.kind, "params": dict(condition.params)}


def _conditions(value: Any) -> list[Condition]:
    if not isinstance(value, list) or not value:
        raise ValueError("strategy_conditions_required")
    conditions: list[Condition] = []
    for item in value:
        if not isinstance(item, dict) or not isinstance(item.get("params"), dict):
            raise ValueError("strategy_condition_invalid")
        kind = str(item.get("kind") or "")
        required = _CONDITION_PARAMETERS.get(kind)
        if required is None:
            raise ValueError("strategy_condition_kind_unsupported")
        params = dict(item["params"])
        if any(parameter not in params for parameter in required):
            raise ValueError("strategy_condition_parameter_required")
        _validate_condition_parameters(kind, params)
        conditions.append(Condition(kind=kind, params=params))
    return conditions


def _validate_condition_parameters(kind: str, params: dict[str, Any]) -> None:
    window = _finite_number(params["window"], "strategy_condition_parameter_invalid")
    if not window.is_integer() or not 1 <= window <= 250:
        raise ValueError("strategy_condition_parameter_invalid")
    if kind in {"rsi_below", "rsi_above"}:
        threshold = _finite_number(params["threshold"], "strategy_condition_parameter_invalid")
        if not 0 <= threshold <= 100:
            raise ValueError("strategy_condition_parameter_invalid")


def _risk_float(value: Any) -> float:
    return _finite_number(value, "strategy_risk_must_be_finite")


def _optional_float(value: Any) -> float | None:
    if value is None:
        return None
    return _risk_float(value)


def _finite_number(value: Any, error_code: str) -> float:
    if isinstance(value, bool):
        raise ValueError(error_code)
    try:
        number = float(value)
    except (TypeError, ValueError) as error:
        raise ValueError(error_code) from error
    if not math.isfinite(number):
        raise ValueError(error_code)
    return number


def _validate_strategy_context(market: str, symbol: str, timeframe: str) -> None:
    if market not in _SUPPORTED_MARKETS:
        raise ValueError("strategy_market_unsupported")
    if timeframe not in _SUPPORTED_TIMEFRAMES:
        raise ValueError("strategy_timeframe_unsupported")
    if not symbol.strip():
        raise ValueError("strategy_single_symbol_required")
