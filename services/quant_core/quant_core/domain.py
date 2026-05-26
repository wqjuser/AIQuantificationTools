from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime
from typing import Any, Literal

Market = Literal["ashare", "us", "crypto"]
Timeframe = Literal["1d", "1m", "5m", "15m", "30m", "60m"]
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


@dataclass(frozen=True)
class MarketDataRequest:
    market: Market
    symbol: str
    timeframe: Timeframe
    start: datetime | None = None
    end: datetime | None = None
    api_key: str | None = None


@dataclass(frozen=True)
class Condition:
    kind: str
    params: dict[str, float | int | str] = field(default_factory=dict)


@dataclass(frozen=True)
class RiskRules:
    position_pct: float = 1.0
    stop_loss_pct: float | None = None
    take_profit_pct: float | None = None
    max_drawdown_pct: float | None = None


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
    revision: str = field(init=False)

    def __post_init__(self) -> None:
        object.__setattr__(self, "revision", self._revision())

    def _payload(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "market": self.market,
            "symbols": self.symbols,
            "timeframe": self.timeframe,
            "entry_conditions": [_encode(condition) for condition in self.entry_conditions],
            "exit_conditions": [_encode(condition) for condition in self.exit_conditions],
            "risk": _encode(self.risk),
            "version": self.version,
        }

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
