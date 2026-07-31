from __future__ import annotations

import re


_CONTACT_PATTERN = re.compile(
    r"(?:[\w.+-]+@(?:[\w-]+\.)+[A-Za-z]{2,}"
    r"|https?://(?:[\w-]+\.)+[A-Za-z]{2,}(?::\d+)?(?:/\S*)?)",
    re.IGNORECASE,
)


def is_valid_sec_edgar_user_agent(value: str) -> bool:
    normalized = value.strip()
    return (
        8 <= len(normalized) <= 255
        and normalized.isascii()
        and not any(ord(character) < 32 or ord(character) == 127 for character in normalized)
        and _CONTACT_PATTERN.search(normalized) is not None
    )
