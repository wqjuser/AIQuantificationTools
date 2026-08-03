from __future__ import annotations


def _bounded_int(raw: str, default: int, minimum: int, maximum: int) -> int:
    try:
        value = int(raw)
    except ValueError:
        return default
    return max(minimum, min(value, maximum))


def _parse_limit(raw: str) -> int:
    return _bounded_int(raw, 10, 1, 50)


def _parse_offset(raw: str) -> int:
    try:
        value = int(raw)
    except ValueError:
        return 0
    return max(0, value)


def _parse_kline_limit(raw: str) -> int:
    return _bounded_int(raw, 160, 1, 500)


def _parse_research_data_limit(raw: str) -> int:
    return _bounded_int(raw, 500, 1, 500)
