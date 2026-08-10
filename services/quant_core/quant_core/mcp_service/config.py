from __future__ import annotations

from dataclasses import dataclass
import ipaddress
import os
from urllib.parse import urlsplit


_TRUE_VALUES = frozenset({"1", "true", "yes", "on"})


@dataclass(frozen=True)
class McpServiceSettings:
    api_base_url: str
    api_cookie: str | None
    api_csrf_token: str | None
    api_origin: str | None
    transport: str
    host: str
    port: int
    operator: str | None
    research_writes_enabled: bool
    request_timeout_seconds: float

    @classmethod
    def from_environment(
        cls,
        environ: dict[str, str] | None = None,
    ) -> "McpServiceSettings":
        source = os.environ if environ is None else environ
        base_url = _validated_base_url(
            source.get("AIQT_MCP_API_BASE_URL", "http://127.0.0.1:8765")
        )
        transport = source.get("AIQT_MCP_TRANSPORT", "stdio").strip().lower()
        if transport not in {"stdio", "streamable-http"}:
            raise ValueError("mcp_transport_invalid")
        host = source.get("AIQT_MCP_HOST", "127.0.0.1").strip()
        if not host:
            raise ValueError("mcp_host_invalid")
        non_loopback_allowed = (
            source.get("AIQT_MCP_ALLOW_NON_LOOPBACK_HTTP", "")
            .strip()
            .lower()
            in _TRUE_VALUES
        )
        if (
            transport == "streamable-http"
            and not _is_loopback_host(host)
            and not non_loopback_allowed
        ):
            raise ValueError("mcp_non_loopback_http_forbidden")
        port = _bounded_int(source.get("AIQT_MCP_PORT", "8766"), 1, 65_535)
        timeout = _bounded_float(
            source.get("AIQT_MCP_REQUEST_TIMEOUT_SECONDS", "600"),
            1.0,
            3_600.0,
        )
        operator = source.get("AIQT_MCP_OPERATOR", "").strip() or None
        return cls(
            api_base_url=base_url,
            api_cookie=_optional_header(source.get("AIQT_MCP_API_COOKIE")),
            api_csrf_token=_optional_header(source.get("AIQT_MCP_API_CSRF_TOKEN")),
            api_origin=_optional_origin(source.get("AIQT_MCP_API_ORIGIN")),
            transport=transport,
            host=host,
            port=port,
            operator=operator,
            research_writes_enabled=(
                source.get("AIQT_MCP_ENABLE_RESEARCH_WRITES", "")
                .strip()
                .lower()
                in _TRUE_VALUES
            ),
            request_timeout_seconds=timeout,
        )


def _validated_base_url(value: object) -> str:
    if not isinstance(value, str):
        raise ValueError("mcp_api_base_url_invalid")
    normalized = value.strip().rstrip("/")
    parsed = urlsplit(normalized)
    if (
        parsed.scheme not in {"http", "https"}
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError("mcp_api_base_url_invalid")
    return normalized


def _optional_origin(value: object) -> str | None:
    if value in {None, ""}:
        return None
    normalized = _validated_base_url(value)
    parsed = urlsplit(normalized)
    if parsed.path not in {"", "/"}:
        raise ValueError("mcp_api_origin_invalid")
    return normalized


def _optional_header(value: object) -> str | None:
    if value in {None, ""}:
        return None
    if not isinstance(value, str):
        raise ValueError("mcp_api_header_invalid")
    normalized = value.strip()
    if not normalized or any(character in normalized for character in "\r\n"):
        raise ValueError("mcp_api_header_invalid")
    return normalized


def _bounded_int(value: object, minimum: int, maximum: int) -> int:
    try:
        normalized = int(str(value))
    except (TypeError, ValueError) as error:
        raise ValueError("mcp_integer_setting_invalid") from error
    if normalized < minimum or normalized > maximum:
        raise ValueError("mcp_integer_setting_invalid")
    return normalized


def _bounded_float(value: object, minimum: float, maximum: float) -> float:
    try:
        normalized = float(str(value))
    except (TypeError, ValueError) as error:
        raise ValueError("mcp_number_setting_invalid") from error
    if normalized < minimum or normalized > maximum:
        raise ValueError("mcp_number_setting_invalid")
    return normalized


def _is_loopback_host(value: str) -> bool:
    if value.lower() == "localhost":
        return True
    normalized = value.removeprefix("[").removesuffix("]")
    try:
        return ipaddress.ip_address(normalized).is_loopback
    except ValueError:
        return False
