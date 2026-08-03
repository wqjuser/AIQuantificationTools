from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from typing import Any
from quant_core.domain import OrderResult, PaperAccount

__all__ = [
    '_coerce_optional_datetime',
    '_count_label',
    '_enum_value',
    '_execution_adapter_certification_status',
    '_is_secret_key',
    '_json_object_from_text',
    '_non_negative_number',
    '_normalize_execution_adapter_certification_checks',
    '_parse_payload_datetime',
    '_payload_to_order',
    '_redact_secret_fields',
    '_round_number',
    '_sorted_counts',
    '_strict_positive_number',
]

def _strict_positive_number(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(number) or number <= 0:
        return None
    return number


def _round_number(value: Any) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = 0.0
    if not math.isfinite(number):
        number = 0.0
    rounded = round(number, 6)
    return 0.0 if rounded == -0.0 else rounded


def _count_label(count: int, singular: str) -> str:
    return f"{count} {singular}" if count == 1 else f"{count} {singular}s"


def _json_object_from_text(value: str) -> dict[str, Any]:
    try:
        payload = json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return {}
    return dict(payload) if isinstance(payload, dict) else {}


def _payload_to_order(payload: dict[str, Any]) -> OrderResult:
    return OrderResult(
        order_id=str(payload.get("orderId", "")),
        symbol=str(payload.get("symbol", "")),
        side=str(payload.get("side", "buy")),
        quantity=float(payload.get("quantity", 0)),
        price=float(payload.get("price", 0)),
        status=str(payload.get("status", "rejected")),
        reason=str(payload.get("reason", "")),
        timestamp=datetime.fromisoformat(str(payload.get("timestamp"))),
    )


def _normalize_execution_adapter_certification_checks(checks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized = []
    for index, check in enumerate(checks):
        if not isinstance(check, dict):
            raise ValueError("execution_adapter_certification_check_must_be_object")
        check_id = str(check.get("id") or f"check-{index + 1}").strip()
        status = _enum_value(
            check.get("status") or "review",
            {"passed", "blocked", "failed", "review"},
            "execution_adapter_certification_check_status_invalid",
        )
        metadata = check.get("metadata") if isinstance(check.get("metadata"), dict) else {}
        normalized.append(
            {
                "id": check_id,
                "label": str(check.get("label") or check_id.replace("-", " ").title()),
                "status": status,
                "detail": str(check.get("detail") or ""),
                "metadata": _redact_secret_fields(metadata),
            }
        )
    return normalized


def _execution_adapter_certification_status(checks: list[dict[str, Any]]) -> str:
    statuses = {str(check.get("status") or "") for check in checks}
    if "blocked" in statuses:
        return "blocked"
    if "failed" in statuses:
        return "failed"
    if checks and statuses == {"passed"}:
        return "passed"
    return "review"


def _coerce_optional_datetime(value: datetime | str | None, *, error_code: str, fallback: datetime | None) -> datetime | None:
    if value is None:
        return fallback
    if isinstance(value, datetime):
        return value
    return _parse_payload_datetime(value, error_code)


def _redact_secret_fields(value: Any) -> Any:
    if isinstance(value, dict):
        redacted = {}
        for key, item in value.items():
            text_key = str(key)
            redacted[text_key] = "[redacted]" if _is_secret_key(text_key) else _redact_secret_fields(item)
        return redacted
    if isinstance(value, list):
        return [_redact_secret_fields(item) for item in value]
    return value


def _is_secret_key(key: str) -> bool:
    normalized = key.replace("_", "").replace("-", "").lower()
    return any(marker in normalized for marker in ("secret", "token", "apikey", "privatekey", "password"))


def _sorted_counts(values: Any) -> dict[str, int]:
    counts: dict[str, int] = {}
    for value in values:
        counts[value] = counts.get(value, 0) + 1
    return {key: counts[key] for key in sorted(counts)}


def _enum_value(value: Any, allowed: set[str], error_code: str) -> str:
    normalized = str(value or "").strip()
    if normalized not in allowed:
        raise ValueError(error_code)
    return normalized


def _parse_payload_datetime(value: Any, error_code: str) -> datetime:
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError(error_code) from error


def _non_negative_number(value: Any, error_code: str) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError) as error:
        raise ValueError(error_code) from error
    if not math.isfinite(number) or number < 0:
        raise ValueError(error_code)
    return number
