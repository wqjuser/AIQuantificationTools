from __future__ import annotations


def _parse_limit(raw: str) -> int:
    try:
        value = int(raw)
    except ValueError:
        return 10
    return max(1, min(value, 50))


def _parse_offset(raw: str) -> int:
    try:
        value = int(raw)
    except ValueError:
        return 0
    return max(0, value)


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
