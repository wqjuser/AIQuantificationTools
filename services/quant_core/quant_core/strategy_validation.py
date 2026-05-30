from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Literal

from quant_core.domain import Market, StrategyConfig, Timeframe
from quant_core.research import strategy_config_from_snapshot, strategy_config_to_payload
from quant_core.terminal import StrategySnapshot

StrategyGateStatus = Literal["passed", "review", "blocked"]
StrategyGateTone = Literal["positive", "warning", "risk"]
StrategyValidationStatus = Literal["ready", "review", "blocked"]


@dataclass(frozen=True)
class StrategyValidationGate:
    id: Literal["schema", "risk", "execution", "audit"]
    label: Literal["Strategy schema", "Risk controls", "Execution mode", "Audit evidence"]
    value: str
    detail: str
    status: StrategyGateStatus
    tone: StrategyGateTone


@dataclass(frozen=True)
class StrategyValidation:
    status: StrategyValidationStatus
    gates: list[StrategyValidationGate]
    strategy: StrategyConfig


def validate_strategy_snapshot(
    snapshot: StrategySnapshot,
    *,
    market: Market,
    symbol: str,
    timeframe: Timeframe,
    audit_run_id: str | None = None,
) -> StrategyValidation:
    strategy = strategy_config_from_snapshot(snapshot, market=market, symbol=symbol, timeframe=timeframe)
    entry_window = _sma_window(snapshot.entry)
    exit_window = _sma_window(snapshot.exit)
    schema_is_ready = (
        entry_window is not None
        and exit_window is not None
        and not _is_pending_text(snapshot.entry)
        and not _is_pending_text(snapshot.exit)
    )
    risk_values = _risk_values(snapshot)
    risk_is_ready = (
        not _is_pending_text(snapshot.position)
        and not _is_pending_text(snapshot.risk)
        and all(value is not None and value > 0 for value in risk_values)
    )
    paper_only = not re.search(r"\blive\b|实盘", snapshot.risk, flags=re.IGNORECASE) or re.search(
        r"paper only|模拟", snapshot.risk, flags=re.IGNORECASE
    )
    blocked = not schema_is_ready or not risk_is_ready
    audit_is_ready = bool((audit_run_id or "").strip())

    gates = [
        StrategyValidationGate(
            id="schema",
            label="Strategy schema",
            value=f"SMA{entry_window} / SMA{exit_window}" if schema_is_ready else "pending",
            detail=(
                "Entry and exit conditions are structured."
                if schema_is_ready
                else "Structured entry and exit rules are required before audit."
            ),
            status="passed" if schema_is_ready else "blocked",
            tone="positive" if schema_is_ready else "risk",
        ),
        StrategyValidationGate(
            id="risk",
            label="Risk controls",
            value=_risk_value_label(risk_values) if risk_is_ready else "pending",
            detail=(
                "Position, stop, take profit, and drawdown guards are parseable."
                if risk_is_ready
                else "Position sizing and risk guardrails must be explicit."
            ),
            status="passed" if risk_is_ready else "blocked",
            tone="positive" if risk_is_ready else "risk",
        ),
        StrategyValidationGate(
            id="execution",
            label="Execution mode",
            value="paper only" if paper_only else "live gated",
            detail="Live routing stays blocked until adapter, risk, and human gates pass.",
            status="passed" if paper_only else "review",
            tone="positive" if paper_only else "warning",
        ),
        StrategyValidationGate(
            id="audit",
            label="Audit evidence",
            value=audit_run_id if audit_is_ready else ("blocked" if blocked else "needs run"),
            detail=(
                "This draft is bound to a reproducible audit run."
                if audit_is_ready
                else (
                    "Fix blocked gates before running an audit pipeline."
                    if blocked
                    else "Run Pipeline to bind this draft to a reproducible audit run."
                )
            ),
            status="passed" if audit_is_ready else ("blocked" if blocked else "review"),
            tone="positive" if audit_is_ready else ("risk" if blocked else "warning"),
        ),
    ]

    if any(gate.status == "blocked" for gate in gates):
        status: StrategyValidationStatus = "blocked"
    elif all(gate.status == "passed" for gate in gates):
        status = "ready"
    else:
        status = "review"
    return StrategyValidation(status=status, gates=gates, strategy=strategy)


def strategy_validation_to_payload(validation: StrategyValidation) -> dict[str, Any]:
    return {
        "status": validation.status,
        "revision": validation.strategy.revision,
        "gates": [
            {
                "id": gate.id,
                "label": gate.label,
                "value": gate.value,
                "detail": gate.detail,
                "status": gate.status,
                "tone": gate.tone,
            }
            for gate in validation.gates
        ],
        "strategyConfig": strategy_config_to_payload(validation.strategy),
    }


def _is_pending_text(text: str) -> bool:
    return text.startswith("Pending") or text.startswith("Run Pipeline")


def _sma_window(text: str) -> int | None:
    match = re.search(r"sma\s*(\d+)", text, flags=re.IGNORECASE)
    if not match:
        return None
    return max(1, min(int(match.group(1)), 250))


def _risk_values(snapshot: StrategySnapshot) -> tuple[float | None, float | None, float | None, float | None]:
    return (
        _first_percent(snapshot.position),
        _percent_near_keywords(snapshot.risk, ["stop", "止损"]),
        _percent_near_keywords(snapshot.risk, ["take profit", "take-profit", "止盈"]),
        _percent_near_keywords(snapshot.risk, ["drawdown", "回撤"]),
    )


def _first_percent(text: str) -> float | None:
    match = re.search(r"(\d+(?:\.\d+)?)\s*%", text)
    return float(match.group(1)) if match else None


def _percent_near_keywords(text: str, keywords: list[str]) -> float | None:
    normalized = text.lower()
    for match in re.finditer(r"([+-]?\d+(?:\.\d+)?)\s*%", normalized):
        prefix = normalized[max(0, match.start() - 36) : match.start()]
        if any(keyword in prefix for keyword in keywords):
            return abs(float(match.group(1)))
    return None


def _risk_value_label(values: tuple[float | None, float | None, float | None, float | None]) -> str:
    return " / ".join(f"{_format_percent(value)}%" for value in values if value is not None)


def _format_percent(value: float) -> str:
    return f"{value:g}"
