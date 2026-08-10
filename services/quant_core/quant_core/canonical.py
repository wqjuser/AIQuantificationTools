from __future__ import annotations

import hashlib
import json
import math
from datetime import datetime, timedelta, timezone
from typing import Any, cast

from quant_core.domain import (
    AtrExitRule,
    BreakoutRule,
    Condition,
    CooldownRule,
    HoldingRule,
    Market,
    OHLCVBar,
    RegimeBreakoutPolicy,
    RegimeFilter,
    RiskRules,
    StrategyConfig,
    Timeframe,
    VolumeConfirmationRule,
)


DATA_SNAPSHOT_HASH_VERSION = "aiqt-data-v2"
CHUNKED_DATA_SNAPSHOT_HASH_VERSION = "aiqt-data-v3-chunked"
MAX_SNAPSHOT_BARS = 500

_SUPPORTED_MARKETS = {"ashare", "us", "crypto"}
_SUPPORTED_TIMEFRAMES = {"1d", "1w", "1m", "5m", "15m", "30m", "60m"}
_TIMEFRAME_SECONDS = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "30m": 1_800,
    "60m": 3_600,
    "1d": 86_400,
    "1w": 604_800,
}
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


def normalize_snapshot_bar_chunks(
    chunks: list[list[OHLCVBar]],
    *,
    market: str,
    symbol: str,
    timeframe: str,
) -> dict[str, Any]:
    _validate_strategy_context(market, symbol, timeframe)
    if not isinstance(chunks, list) or not chunks:
        raise ValueError("data_snapshot_chunks_required")
    step = timedelta(seconds=_TIMEFRAME_SECONDS[timeframe])
    normalized_chunks: list[dict[str, Any]] = []
    flattened: list[dict[str, Any]] = []
    previous_timestamp: datetime | None = None
    timestamps: set[datetime] = set()

    for index, chunk in enumerate(chunks):
        if not isinstance(chunk, list) or not chunk:
            raise ValueError("data_snapshot_chunk_empty")
        if len(chunk) > MAX_SNAPSHOT_BARS:
            raise ValueError("data_snapshot_chunk_too_many_bars")
        if not all(isinstance(bar, OHLCVBar) for bar in chunk):
            raise ValueError("data_snapshot_chunk_bar_must_be_ohlcv")
        if {
            (bar.market, bar.symbol, bar.timeframe)
            for bar in chunk
        } != {(market, symbol, timeframe)}:
            raise ValueError("data_snapshot_context_mismatch")

        raw_timestamps = [_snapshot_timestamp(bar.timestamp) for bar in chunk]
        previous_timestamp = _validate_chunk_timestamps(
            raw_timestamps,
            previous_timestamp=previous_timestamp,
            timestamps=timestamps,
            step=step,
        )
        normalized = normalize_snapshot_bars(chunk)
        chunk_start = str(normalized[0]["timestamp"])
        chunk_end_exclusive = (
            _snapshot_timestamp(normalized[-1]["timestamp"]) + step
        ).isoformat()
        normalized_chunks.append({
            "index": index,
            "start": chunk_start,
            "endExclusive": chunk_end_exclusive,
            "rows": len(normalized),
            "hash": canonical_data_hash(normalized),
            "bars": normalized,
        })
        flattened.extend(normalized)

    payload = {
        "hashVersion": CHUNKED_DATA_SNAPSHOT_HASH_VERSION,
        "market": market,
        "symbol": symbol,
        "timeframe": timeframe,
        "rows": len(flattened),
        "start": flattened[0]["timestamp"],
        "endExclusive": (
            _snapshot_timestamp(flattened[-1]["timestamp"]) + step
        ).isoformat(),
        "chunks": normalized_chunks,
        "hash": canonical_data_hash(flattened),
    }
    verify_chunked_data_snapshot(
        payload,
        market=market,
        symbol=symbol,
        timeframe=timeframe,
    )
    return payload


def flatten_chunked_data_snapshot(
    snapshot: dict[str, Any],
    *,
    market: str,
    symbol: str,
    timeframe: str,
) -> list[dict[str, Any]]:
    if not isinstance(snapshot, dict):
        raise ValueError("data_snapshot_chunked_must_be_object")
    if snapshot.get("hashVersion") != CHUNKED_DATA_SNAPSHOT_HASH_VERSION:
        raise ValueError("data_snapshot_chunked_hash_version_invalid")
    _validate_strategy_context(market, symbol, timeframe)
    if (
        snapshot.get("market") != market
        or snapshot.get("symbol") != symbol
        or snapshot.get("timeframe") != timeframe
    ):
        raise ValueError("data_snapshot_context_mismatch")
    raw_chunks = snapshot.get("chunks")
    if not isinstance(raw_chunks, list) or not raw_chunks:
        raise ValueError("data_snapshot_chunks_required")

    step = timedelta(seconds=_TIMEFRAME_SECONDS[timeframe])
    flattened: list[dict[str, Any]] = []
    previous_timestamp: datetime | None = None
    timestamps: set[datetime] = set()
    for expected_index, raw_chunk in enumerate(raw_chunks):
        if not isinstance(raw_chunk, dict):
            raise ValueError("data_snapshot_chunk_must_be_object")
        bars = raw_chunk.get("bars")
        if not isinstance(bars, list) or not bars:
            raise ValueError("data_snapshot_chunk_empty")
        if len(bars) > MAX_SNAPSHOT_BARS:
            raise ValueError("data_snapshot_chunk_too_many_bars")
        chunk_index = raw_chunk.get("index")
        if (
            isinstance(chunk_index, bool)
            or not isinstance(chunk_index, int)
            or chunk_index != expected_index
        ):
            raise ValueError("data_snapshot_chunk_index_invalid")
        if str(raw_chunk.get("hash") or "") != canonical_data_hash(bars):
            raise ValueError("data_snapshot_chunk_hash_mismatch")
        normalized = normalize_snapshot_bars(bars)
        if normalized != bars:
            raise ValueError("data_snapshot_chunk_not_canonical")
        chunk_rows = raw_chunk.get("rows")
        if (
            isinstance(chunk_rows, bool)
            or not isinstance(chunk_rows, int)
            or chunk_rows != len(normalized)
        ):
            raise ValueError("data_snapshot_chunk_rows_mismatch")
        chunk_start = str(normalized[0]["timestamp"])
        chunk_end_exclusive = (
            _snapshot_timestamp(normalized[-1]["timestamp"]) + step
        ).isoformat()
        if (
            raw_chunk.get("start") != chunk_start
            or raw_chunk.get("endExclusive") != chunk_end_exclusive
        ):
            raise ValueError("data_snapshot_chunk_range_mismatch")
        chunk_timestamps = [_snapshot_timestamp(bar["timestamp"]) for bar in normalized]
        previous_timestamp = _validate_chunk_timestamps(
            chunk_timestamps,
            previous_timestamp=previous_timestamp,
            timestamps=timestamps,
            step=step,
        )
        flattened.extend(normalized)

    snapshot_rows = snapshot.get("rows")
    if (
        isinstance(snapshot_rows, bool)
        or not isinstance(snapshot_rows, int)
        or snapshot_rows != len(flattened)
    ):
        raise ValueError("data_snapshot_rows_mismatch")
    if snapshot.get("start") != flattened[0]["timestamp"]:
        raise ValueError("data_snapshot_range_mismatch")
    expected_end_exclusive = (
        _snapshot_timestamp(flattened[-1]["timestamp"]) + step
    ).isoformat()
    if snapshot.get("endExclusive") != expected_end_exclusive:
        raise ValueError("data_snapshot_range_mismatch")
    if str(snapshot.get("hash") or "") != canonical_data_hash(flattened):
        raise ValueError("data_snapshot_hash_mismatch")
    return flattened


def verify_chunked_data_snapshot(
    snapshot: dict[str, Any],
    *,
    market: str,
    symbol: str,
    timeframe: str,
) -> dict[str, Any]:
    flatten_chunked_data_snapshot(
        snapshot,
        market=market,
        symbol=symbol,
        timeframe=timeframe,
    )
    return snapshot


def _validate_chunk_timestamps(
    values: list[datetime],
    *,
    previous_timestamp: datetime | None,
    timestamps: set[datetime],
    step: timedelta,
) -> datetime:
    for timestamp in values:
        if timestamp in timestamps:
            raise ValueError("data_snapshot_duplicate_timestamp")
        if previous_timestamp is not None:
            if timestamp < previous_timestamp:
                raise ValueError("data_snapshot_timestamp_disorder")
            if timestamp != previous_timestamp + step:
                raise ValueError("data_snapshot_missing_bar_gap")
        timestamps.add(timestamp)
        previous_timestamp = timestamp
    if previous_timestamp is None:
        raise ValueError("data_snapshot_chunk_empty")
    return previous_timestamp


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
    risk: dict[str, object] = {
        "positionPct": strategy.risk.position_pct,
        "stopLossPct": strategy.risk.stop_loss_pct,
        "takeProfitPct": strategy.risk.take_profit_pct,
        "maxDrawdownPct": strategy.risk.max_drawdown_pct,
    }
    optional_risk_fields = {
        "riskBudgetPct": strategy.risk.risk_budget_pct,
        "dailyLossLimitPct": strategy.risk.daily_loss_limit_pct,
        "maxTradeGroupsPerHour": strategy.risk.max_trade_groups_per_hour,
        "maxEntryNotionalQuote": strategy.risk.max_entry_notional_quote,
        "exitNotionalCapQuote": strategy.risk.exit_notional_cap_quote,
    }
    for key, value in optional_risk_fields.items():
        if value is not None or (
            strategy.version == 2
            and key in {"maxEntryNotionalQuote", "exitNotionalCapQuote"}
        ):
            risk[key] = value
    payload: dict[str, object] = {
        "name": strategy.name,
        "revision": strategy.revision,
        "market": strategy.market,
        "symbols": list(strategy.symbols),
        "timeframe": strategy.timeframe,
        "version": strategy.version,
        "entryConditions": [_condition_payload(condition) for condition in strategy.entry_conditions],
        "exitConditions": [_condition_payload(condition) for condition in strategy.exit_conditions],
        "risk": risk,
    }
    if strategy.policy is not None:
        payload["policy"] = _regime_breakout_policy_payload(strategy.policy)
    return payload


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

    raw_version = payload.get("version", 1)
    try:
        version = int(raw_version or 1)
    except (TypeError, ValueError) as error:
        raise ValueError("strategy_version_must_be_1_or_2") from error
    if version not in {1, 2}:
        raise ValueError("strategy_version_must_be_1_or_2")

    if version == 2:
        if isinstance(raw_version, bool) or not isinstance(raw_version, int) or raw_version != 2:
            raise ValueError("strategy_version_must_be_1_or_2")
        root_keys = {
            "name",
            "market",
            "symbols",
            "timeframe",
            "version",
            "entryConditions",
            "exitConditions",
            "risk",
            "policy",
        }
        if frozenset(payload) not in {
            frozenset(root_keys),
            frozenset({*root_keys, "revision"}),
        }:
            raise ValueError("regime_breakout_v2_fields_invalid")
        if not isinstance(payload.get("name"), str) or not payload["name"].strip():
            raise ValueError("regime_breakout_v2_fields_invalid")

    risk = payload.get("risk") if isinstance(payload.get("risk"), dict) else {}
    if version == 2 and set(risk) != {
        "positionPct",
        "riskBudgetPct",
        "stopLossPct",
        "takeProfitPct",
        "maxDrawdownPct",
        "dailyLossLimitPct",
        "maxTradeGroupsPerHour",
        "maxEntryNotionalQuote",
        "exitNotionalCapQuote",
    }:
        raise ValueError("regime_breakout_v2_risk_fields_invalid")
    position_pct = _risk_float(risk.get("positionPct", risk.get("position_pct", 1.0)))
    if version == 1:
        entry_conditions = _conditions(payload.get("entryConditions", payload.get("entry_conditions", [])))
        exit_conditions = _conditions(payload.get("exitConditions", payload.get("exit_conditions", [])))
        policy = None
    else:
        entry_conditions = _empty_conditions(payload.get("entryConditions", payload.get("entry_conditions", [])))
        exit_conditions = _empty_conditions(payload.get("exitConditions", payload.get("exit_conditions", [])))
        policy = _regime_breakout_policy_from_payload(payload.get("policy"))

    strategy = StrategyConfig(
        name=str(payload.get("name") or "Imported strategy"),
        market=cast(Market, market),
        symbols=symbols,
        timeframe=cast(Timeframe, timeframe),
        entry_conditions=entry_conditions,
        exit_conditions=exit_conditions,
        risk=RiskRules(
            position_pct=position_pct,
            stop_loss_pct=_optional_float(risk.get("stopLossPct", risk.get("stop_loss_pct"))),
            take_profit_pct=_optional_float(risk.get("takeProfitPct", risk.get("take_profit_pct"))),
            max_drawdown_pct=_optional_float(risk.get("maxDrawdownPct", risk.get("max_drawdown_pct"))),
            risk_budget_pct=_optional_float(risk.get("riskBudgetPct", risk.get("risk_budget_pct"))),
            daily_loss_limit_pct=_optional_float(
                risk.get("dailyLossLimitPct", risk.get("daily_loss_limit_pct"))
            ),
            max_trade_groups_per_hour=_optional_int(
                risk.get("maxTradeGroupsPerHour", risk.get("max_trade_groups_per_hour"))
            ),
            max_entry_notional_quote=_optional_float(
                risk.get("maxEntryNotionalQuote", risk.get("max_entry_notional_quote"))
            ),
            exit_notional_cap_quote=_optional_float(
                risk.get("exitNotionalCapQuote", risk.get("exit_notional_cap_quote"))
            ),
        ),
        version=version,
        policy=policy,
    )
    if version == 2:
        _validate_regime_breakout_strategy(strategy)
    return strategy


def _regime_breakout_policy_payload(policy: RegimeBreakoutPolicy) -> dict[str, object]:
    return {
        "kind": policy.kind,
        "decisionTimeframe": policy.decision_timeframe,
        "completedBarsOnly": policy.completed_bars_only,
        "fillTiming": policy.fill_timing,
        "regime": {
            "timeframe": policy.regime.timeframe,
            "closeAboveSmaWindow": policy.regime.close_above_sma_window,
            "smaSlopeLookbackBars": policy.regime.sma_slope_lookback_bars,
        },
        "breakout": {
            "lookbackBars": policy.breakout.lookback_bars,
            "excludeSignalBar": policy.breakout.exclude_signal_bar,
            "oneShotPerEvent": policy.breakout.one_shot_per_event,
        },
        "volume": {
            "smaWindow": policy.volume.sma_window,
            "multiplier": policy.volume.multiplier,
            "excludeSignalBar": policy.volume.exclude_signal_bar,
        },
        "atr": {
            "window": policy.atr.window,
            "smoothing": policy.atr.smoothing,
            "initialMultiple": policy.atr.initial_multiple,
            "trailingMultiple": policy.atr.trailing_multiple,
            "trailingStartsAfterProfit": policy.atr.trailing_starts_after_profit,
            "trailingActivation": policy.atr.trailing_activation,
            "anchor": policy.atr.anchor,
            "neverLoosen": policy.atr.never_loosen,
        },
        "holding": {
            "maxBars": policy.holding.max_bars,
            "exitOnlyWithoutPositiveProgress": policy.holding.exit_only_without_positive_progress,
            "progressDefinition": policy.holding.progress_definition,
        },
        "cooldown": {
            "bars": policy.cooldown.bars,
            "startsAfter": policy.cooldown.starts_after,
            "requiresNewBreakoutEvent": policy.cooldown.requires_new_breakout_event,
        },
    }


def _regime_breakout_policy_from_payload(value: Any) -> RegimeBreakoutPolicy:
    policy = _object_with_keys(
        value,
        "strategy_policy_invalid",
        {
            "kind",
            "decisionTimeframe",
            "completedBarsOnly",
            "fillTiming",
            "regime",
            "breakout",
            "volume",
            "atr",
            "holding",
            "cooldown",
        },
    )
    if policy["kind"] != "regime_breakout_v2":
        raise ValueError("strategy_policy_kind_unsupported")
    regime = _object_with_keys(
        policy["regime"],
        "strategy_policy_regime_invalid",
        {"timeframe", "closeAboveSmaWindow", "smaSlopeLookbackBars"},
    )
    breakout = _object_with_keys(
        policy["breakout"],
        "strategy_policy_breakout_invalid",
        {"lookbackBars", "excludeSignalBar", "oneShotPerEvent"},
    )
    volume = _object_with_keys(
        policy["volume"],
        "strategy_policy_volume_invalid",
        {"smaWindow", "multiplier", "excludeSignalBar"},
    )
    atr = _object_with_keys(
        policy["atr"],
        "strategy_policy_atr_invalid",
        {
            "window",
            "smoothing",
            "initialMultiple",
            "trailingMultiple",
            "trailingStartsAfterProfit",
            "trailingActivation",
            "anchor",
            "neverLoosen",
        },
    )
    holding = _object_with_keys(
        policy["holding"],
        "strategy_policy_holding_invalid",
        {"maxBars", "exitOnlyWithoutPositiveProgress", "progressDefinition"},
    )
    cooldown = _object_with_keys(
        policy["cooldown"],
        "strategy_policy_cooldown_invalid",
        {"bars", "startsAfter", "requiresNewBreakoutEvent"},
    )
    return RegimeBreakoutPolicy(
        kind=str(policy["kind"]),
        decision_timeframe=cast(Timeframe, str(policy["decisionTimeframe"])),
        completed_bars_only=_strict_bool(policy["completedBarsOnly"], "strategy_policy_invalid"),
        fill_timing=str(policy["fillTiming"]),
        regime=RegimeFilter(
            timeframe=cast(Timeframe, str(regime["timeframe"])),
            close_above_sma_window=_bounded_int(
                regime["closeAboveSmaWindow"], minimum=2, maximum=500, error_code="strategy_policy_regime_invalid"
            ),
            sma_slope_lookback_bars=_bounded_int(
                regime["smaSlopeLookbackBars"], minimum=1, maximum=50, error_code="strategy_policy_regime_invalid"
            ),
        ),
        breakout=BreakoutRule(
            lookback_bars=_bounded_int(
                breakout["lookbackBars"], minimum=2, maximum=250, error_code="strategy_policy_breakout_invalid"
            ),
            exclude_signal_bar=_strict_bool(breakout["excludeSignalBar"], "strategy_policy_breakout_invalid"),
            one_shot_per_event=_strict_bool(breakout["oneShotPerEvent"], "strategy_policy_breakout_invalid"),
        ),
        volume=VolumeConfirmationRule(
            sma_window=_bounded_int(
                volume["smaWindow"], minimum=2, maximum=250, error_code="strategy_policy_volume_invalid"
            ),
            multiplier=_positive_float(volume["multiplier"], "strategy_policy_volume_invalid"),
            exclude_signal_bar=_strict_bool(volume["excludeSignalBar"], "strategy_policy_volume_invalid"),
        ),
        atr=AtrExitRule(
            window=_bounded_int(atr["window"], minimum=2, maximum=250, error_code="strategy_policy_atr_invalid"),
            smoothing=str(atr["smoothing"]),
            initial_multiple=_positive_float(atr["initialMultiple"], "strategy_policy_atr_invalid"),
            trailing_multiple=_positive_float(atr["trailingMultiple"], "strategy_policy_atr_invalid"),
            trailing_starts_after_profit=_strict_bool(
                atr["trailingStartsAfterProfit"], "strategy_policy_atr_invalid"
            ),
            trailing_activation=str(atr["trailingActivation"]),
            anchor=str(atr["anchor"]),
            never_loosen=_strict_bool(atr["neverLoosen"], "strategy_policy_atr_invalid"),
        ),
        holding=HoldingRule(
            max_bars=_bounded_int(
                holding["maxBars"], minimum=1, maximum=10_000, error_code="strategy_policy_holding_invalid"
            ),
            exit_only_without_positive_progress=_strict_bool(
                holding["exitOnlyWithoutPositiveProgress"], "strategy_policy_holding_invalid"
            ),
            progress_definition=str(holding["progressDefinition"]),
        ),
        cooldown=CooldownRule(
            bars=_bounded_int(
                cooldown["bars"], minimum=0, maximum=10_000, error_code="strategy_policy_cooldown_invalid"
            ),
            starts_after=str(cooldown["startsAfter"]),
            requires_new_breakout_event=_strict_bool(
                cooldown["requiresNewBreakoutEvent"], "strategy_policy_cooldown_invalid"
            ),
        ),
    )


def _validate_regime_breakout_strategy(strategy: StrategyConfig) -> None:
    policy = strategy.policy
    if policy is None:
        raise ValueError("strategy_policy_required")
    if strategy.market != "crypto" or strategy.symbols != ["BTC/USDT"] or strategy.timeframe != "1m":
        raise ValueError("regime_breakout_v2_context_unsupported")
    if policy.decision_timeframe != "5m" or policy.regime.timeframe != "60m":
        raise ValueError("regime_breakout_v2_timeframes_invalid")
    if not policy.completed_bars_only or policy.fill_timing != "next_completed_bar_open":
        raise ValueError("regime_breakout_v2_timing_invalid")
    if not policy.breakout.exclude_signal_bar or not policy.breakout.one_shot_per_event:
        raise ValueError("regime_breakout_v2_breakout_semantics_invalid")
    if not policy.volume.exclude_signal_bar:
        raise ValueError("regime_breakout_v2_volume_semantics_invalid")
    if (
        policy.atr.smoothing != "wilder"
        or not policy.atr.trailing_starts_after_profit
        or policy.atr.trailing_activation != "positive_close"
        or policy.atr.anchor != "highest_high_since_entry"
        or not policy.atr.never_loosen
    ):
        raise ValueError("regime_breakout_v2_atr_semantics_invalid")
    if (
        not policy.holding.exit_only_without_positive_progress
        or policy.holding.progress_definition != "highest_close_above_entry"
    ):
        raise ValueError("regime_breakout_v2_holding_semantics_invalid")
    if policy.cooldown.starts_after != "filled_exit" or not policy.cooldown.requires_new_breakout_event:
        raise ValueError("regime_breakout_v2_cooldown_semantics_invalid")
    risk = strategy.risk
    if risk.stop_loss_pct is not None or risk.take_profit_pct is not None:
        raise ValueError("regime_breakout_v2_fixed_exit_risk_forbidden")
    for value in (
        risk.position_pct,
        risk.risk_budget_pct,
        risk.max_drawdown_pct,
        risk.daily_loss_limit_pct,
    ):
        if value is None or not 0 < value <= 1:
            raise ValueError("regime_breakout_v2_risk_invalid")
    if risk.max_trade_groups_per_hour is None or risk.max_trade_groups_per_hour < 1:
        raise ValueError("regime_breakout_v2_risk_invalid")
    if (
        risk.max_entry_notional_quote is not None
        and risk.max_entry_notional_quote <= 0
    ):
        raise ValueError("regime_breakout_v2_risk_invalid")
    if risk.exit_notional_cap_quote is not None:
        raise ValueError("regime_breakout_v2_exit_cap_forbidden")


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


def _empty_conditions(value: Any) -> list[Condition]:
    if not isinstance(value, list) or value:
        raise ValueError("regime_breakout_v2_conditions_must_be_empty")
    return []


def _object_with_keys(value: Any, error_code: str, keys: set[str]) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != keys:
        raise ValueError(error_code)
    return value


def _strict_bool(value: Any, error_code: str) -> bool:
    if not isinstance(value, bool):
        raise ValueError(error_code)
    return value


def _bounded_int(value: Any, *, minimum: int, maximum: int, error_code: str) -> int:
    number = _finite_number(value, error_code)
    if not number.is_integer() or not minimum <= number <= maximum:
        raise ValueError(error_code)
    return int(number)


def _positive_float(value: Any, error_code: str) -> float:
    number = _finite_number(value, error_code)
    if number <= 0:
        raise ValueError(error_code)
    return number


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


def _optional_int(value: Any) -> int | None:
    if value is None:
        return None
    number = _risk_float(value)
    if not number.is_integer():
        raise ValueError("strategy_risk_integer_required")
    return int(number)


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
