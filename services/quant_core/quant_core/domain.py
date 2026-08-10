from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any, Literal

Market = Literal["ashare", "us", "crypto"]
Timeframe = Literal["1d", "1w", "1m", "5m", "15m", "30m", "60m"]
OrderSide = Literal["buy", "sell"]


def _canonical_json(payload: dict[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _encode(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if hasattr(value, "__dataclass_fields__"):
        return {key: _encode(item) for key, item in asdict(value).items()}
    if isinstance(value, list):
        return [_encode(item) for item in value]
    if isinstance(value, dict):
        return {key: _encode(item) for key, item in value.items()}
    return value


@dataclass(frozen=True)
class OHLCVBar:
    symbol: str
    market: Market
    timeframe: Timeframe
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float

    def to_record(self) -> dict[str, Any]:
        return _encode(self)

    @classmethod
    def from_record(cls, record: dict[str, Any]) -> "OHLCVBar":
        payload = dict(record)
        if isinstance(payload["timestamp"], str):
            payload["timestamp"] = datetime.fromisoformat(payload["timestamp"])
        return cls(**payload)


@dataclass(frozen=True)
class DataQuality:
    source: str
    is_complete: bool
    warnings: list[str] = field(default_factory=list)
    rows: int = 0
    observed_at: datetime | None = None
    market_time: datetime | None = None
    calendar_id: str | None = None
    adjustment_mode: str = "none"
    freshness: str = "unknown"
    coverage: dict[str, Any] = field(default_factory=dict)
    canonical_hash: str = ""
    issues: list[dict[str, Any]] = field(default_factory=list)
    origin_source: str | None = None


@dataclass(frozen=True)
class MarketDataRequest:
    market: Market
    symbol: str
    timeframe: Timeframe
    start: datetime | None = None
    end: datetime | None = None
    api_key: str | None = None


@dataclass(frozen=True)
class MarketQuote:
    market: Market
    symbol: str
    price: float
    change: float
    change_pct: float
    source: str
    as_of: datetime
    high: float = 0.0
    low: float = 0.0
    open: float = 0.0
    previous_close: float = 0.0
    is_live: bool = True
    warning: str | None = None


@dataclass(frozen=True)
class Condition:
    kind: str
    params: dict[str, float | int | str] = field(default_factory=dict)


@dataclass(frozen=True)
class RegimeFilter:
    timeframe: Timeframe
    close_above_sma_window: int
    sma_slope_lookback_bars: int


@dataclass(frozen=True)
class BreakoutRule:
    lookback_bars: int
    exclude_signal_bar: bool
    one_shot_per_event: bool


@dataclass(frozen=True)
class VolumeConfirmationRule:
    sma_window: int
    multiplier: float
    exclude_signal_bar: bool


@dataclass(frozen=True)
class AtrExitRule:
    window: int
    smoothing: str
    initial_multiple: float
    trailing_multiple: float
    trailing_starts_after_profit: bool
    trailing_activation: str
    anchor: str
    never_loosen: bool


@dataclass(frozen=True)
class HoldingRule:
    max_bars: int
    exit_only_without_positive_progress: bool
    progress_definition: str


@dataclass(frozen=True)
class CooldownRule:
    bars: int
    starts_after: str
    requires_new_breakout_event: bool


@dataclass(frozen=True)
class RegimeBreakoutPolicy:
    decision_timeframe: Timeframe
    completed_bars_only: bool
    fill_timing: str
    regime: RegimeFilter
    breakout: BreakoutRule
    volume: VolumeConfirmationRule
    atr: AtrExitRule
    holding: HoldingRule
    cooldown: CooldownRule
    kind: str = "regime_breakout_v2"


@dataclass(frozen=True)
class RiskRules:
    position_pct: float = 1.0
    stop_loss_pct: float | None = None
    take_profit_pct: float | None = None
    max_drawdown_pct: float | None = None
    risk_budget_pct: float | None = None
    daily_loss_limit_pct: float | None = None
    max_trade_groups_per_hour: int | None = None
    max_entry_notional_quote: float | None = None
    exit_notional_cap_quote: float | None = None


@dataclass(frozen=True)
class StrategyConfig:
    name: str
    market: Market
    symbols: list[str]
    timeframe: Timeframe
    entry_conditions: list[Condition]
    exit_conditions: list[Condition]
    risk: RiskRules = field(default_factory=RiskRules)
    version: int = 1
    policy: RegimeBreakoutPolicy | None = None
    revision: str = field(init=False)

    def __post_init__(self) -> None:
        object.__setattr__(self, "revision", self._revision())

    def _payload(self) -> dict[str, Any]:
        risk_payload: dict[str, Any] = {
            "position_pct": self.risk.position_pct,
            "stop_loss_pct": self.risk.stop_loss_pct,
            "take_profit_pct": self.risk.take_profit_pct,
            "max_drawdown_pct": self.risk.max_drawdown_pct,
        }
        for key in (
            "risk_budget_pct",
            "daily_loss_limit_pct",
            "max_trade_groups_per_hour",
            "max_entry_notional_quote",
            "exit_notional_cap_quote",
        ):
            value = getattr(self.risk, key)
            if value is not None or (
                self.version == 2
                and key in {"max_entry_notional_quote", "exit_notional_cap_quote"}
            ):
                risk_payload[key] = value
        payload = {
            "name": self.name,
            "market": self.market,
            "symbols": self.symbols,
            "timeframe": self.timeframe,
            "entry_conditions": [_encode(condition) for condition in self.entry_conditions],
            "exit_conditions": [_encode(condition) for condition in self.exit_conditions],
            "risk": risk_payload,
            "version": self.version,
        }
        if self.policy is not None:
            payload["policy"] = _encode(self.policy)
        return payload

    def _revision(self) -> str:
        return hashlib.sha256(_canonical_json(self._payload()).encode("utf-8")).hexdigest()[:12]

    def to_json(self) -> str:
        payload = self._payload()
        payload["revision"] = self.revision
        return json.dumps(payload, ensure_ascii=False, sort_keys=True)

    @classmethod
    def from_json(cls, raw: str) -> "StrategyConfig":
        payload = json.loads(raw)
        payload.pop("revision", None)
        payload["entry_conditions"] = [Condition(**condition) for condition in payload["entry_conditions"]]
        payload["exit_conditions"] = [Condition(**condition) for condition in payload["exit_conditions"]]
        payload["risk"] = RiskRules(**payload["risk"])
        policy = payload.get("policy")
        if isinstance(policy, dict):
            payload["policy"] = RegimeBreakoutPolicy(
                decision_timeframe=policy["decision_timeframe"],
                completed_bars_only=policy["completed_bars_only"],
                fill_timing=policy["fill_timing"],
                regime=RegimeFilter(**policy["regime"]),
                breakout=BreakoutRule(**policy["breakout"]),
                volume=VolumeConfirmationRule(**policy["volume"]),
                atr=AtrExitRule(**policy["atr"]),
                holding=HoldingRule(**policy["holding"]),
                cooldown=CooldownRule(**policy["cooldown"]),
                kind=policy.get("kind", "regime_breakout_v2"),
            )
        return cls(**payload)


@dataclass(frozen=True)
class Trade:
    symbol: str
    side: OrderSide
    timestamp: datetime
    price: float
    quantity: float
    fee: float
    reason: str
    proposal_id: str | None = None
    signal_id: str | None = None
    snapshot_hash: str | None = None


@dataclass(frozen=True)
class EquityPoint:
    timestamp: datetime
    equity: float


@dataclass(frozen=True)
class BacktestMetrics:
    total_return_pct: float
    annual_return_pct: float
    max_drawdown_pct: float
    win_rate_pct: float
    profit_factor: float
    trade_count: int
    round_trip_count: int = 0


@dataclass(frozen=True)
class BacktestRun:
    strategy_name: str
    strategy_revision: str
    symbol: str
    market: Market
    timeframe: Timeframe
    metrics: BacktestMetrics
    trades: list[Trade]
    equity_curve: list[EquityPoint]
    data_quality: DataQuality


@dataclass(frozen=True)
class AiResearchRequest:
    strategy_name: str
    market: Market
    risk_preference: str
    metrics: BacktestMetrics
    notes: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class AiResearchReport:
    summary: str
    risks: list[str]
    improvements: list[str]
    disclaimer: str


@dataclass(frozen=True)
class OrderResult:
    order_id: str
    symbol: str
    side: OrderSide
    quantity: float
    price: float
    status: Literal["filled", "rejected"]
    reason: str
    timestamp: datetime


@dataclass(frozen=True)
class PaperAccount:
    cash: float
    positions: dict[str, float]
    equity: float
