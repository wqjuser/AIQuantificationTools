from __future__ import annotations

import ipaddress
import json
import os
import re
import socket
import time
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from http.client import HTTPException
from typing import Any, Literal, Protocol
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, quote, unquote, urlsplit, urlunsplit
from urllib.request import Request, urlopen

from quant_core.ai_review_stage3 import validate_assessment


ProviderId = Literal["local", "openai", "openai-compatible", "ollama"]

OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
OPENAI_BASE_URL = "https://api.openai.com/v1"
CONNECT_TIMEOUT_SECONDS = 5.0
OVERALL_TIMEOUT_SECONDS = 30.0
MAX_RESPONSE_BYTES = 65_536
MAX_OUTPUT_TOKENS = 1_200
MAX_ERROR_DETAIL_CHARS = 500

_ERROR_CODES = {
    "timeout",
    "http_error",
    "response_too_large",
    "invalid_json",
    "invalid_schema",
    "unknown_evidence_reference",
}
_SECRET_KEY_PARTS = (
    "secret",
    "token",
    "apikey",
    "privatekey",
    "password",
    "authorization",
)
_SAFE_NEGATION_PATTERNS = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"(?:不要|不得|禁止)\s*下单",
        r"不\s*保证收益",
        r"无\s*收益保证",
        r"\bno\s+target\s+price\b",
        r"\bdo\s+not\s+place\s+orders?\b",
    )
)
_PROHIBITED_OUTPUT_PATTERNS = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"(?:建议|立即|请|应该|应当)\s*(?:买入|卖出|下单)",
        r"(?:买入|卖出)\s*\d+(?:\.\d+)?\s*股",
        r"目标价",
        r"仓位指令",
        r"(?:把|将)?\s*仓位\s*(?:提高|提升|增加|降低|降至|设为|调整)\s*(?:到|至|为)?\s*\d+(?:\.\d+)?\s*%",
        r"收益保证",
        r"保证收益",
        r"收益\s*(?:是)?\s*(?:有)?\s*保证",
        r"\bsubmit\s+(?:an?\s+)?order\b",
        r"\bplace\s+(?:an?\s+)?order\b",
        r"\b(?:buy|sell)\s+\d+(?:\.\d+)?\s*(?:shares?|units?)\b",
        r"\btarget\s+price\b",
        r"\bposition\s+instruction\b",
        r"\b(?:increase|raise|reduce|lower|set|adjust)\s+(?:the\s+)?position(?:\s+size)?\s+(?:to|at)\s+\d+(?:\.\d+)?\s*%",
        r"\bguaranteed?\s+returns?\b",
        r"\breturns?\s+guarantee\b",
        r"\breturns?\s+(?:is|are)\s+guaranteed\b",
    )
)
_FINAL_PROVIDER_ENDPOINTS = ("/chat/completions", "/api/chat")
_URL_PATH_SAFE = "/:@-._~!$&'()*+,;=%"


@dataclass(frozen=True)
class ProviderStatus:
    provider_id: ProviderId
    configured: bool
    model: str | None
    sanitized_base_url: str | None


@dataclass(frozen=True)
class ProviderAttempt:
    provider_id: ProviderId
    model: str
    sanitized_base_url: str
    assessment: dict[str, Any]
    usage: dict[str, int]
    latency_ms: int


class AiReviewProviderError(ValueError):
    def __init__(
        self,
        code: str,
        detail: Any,
        *,
        sensitive_values: Iterable[str] = (),
    ) -> None:
        if code not in _ERROR_CODES:
            raise ValueError("unsupported_provider_error_code")
        bounded_detail = sanitize_error_detail(
            detail,
            sensitive_values=sensitive_values,
        )
        super().__init__(bounded_detail)
        self.code = code
        self.detail = bounded_detail


class AiReviewProvider(Protocol):
    def assess(
        self,
        *,
        rendered_prompt: str,
        output_schema: Mapping[str, Any],
        known_evidence_ids: frozenset[str],
    ) -> ProviderAttempt: ...


def sanitize_base_url(value: str) -> str | None:
    try:
        parsed = urlsplit(value)
        hostname = parsed.hostname
        port = parsed.port
    except ValueError:
        return None
    if not parsed.scheme or not hostname:
        return None
    safe_host = f"[{hostname}]" if ":" in hostname else hostname
    netloc = f"{safe_host}:{port}" if port is not None else safe_host
    return urlunsplit((parsed.scheme, netloc, parsed.path, "", ""))


def sanitize_error_detail(
    value: Any,
    *,
    sensitive_values: Iterable[str] = (),
) -> str:
    sanitized = _redact_sensitive_fields(
        _redact_sensitive_values(value, sensitive_values)
    )
    if isinstance(sanitized, (Mapping, list, tuple)):
        detail = json.dumps(sanitized, ensure_ascii=False, default=str)
    else:
        detail = str(sanitized)
    return detail[:MAX_ERROR_DETAIL_CHARS] or "provider_error"


@dataclass(frozen=True)
class OpenAiResponsesProvider:
    api_key: str = field(repr=False)
    model: str

    def assess(
        self,
        *,
        rendered_prompt: str,
        output_schema: Mapping[str, Any],
        known_evidence_ids: frozenset[str],
    ) -> ProviderAttempt:
        started = time.monotonic()
        response = _post_json(
            OPENAI_RESPONSES_URL,
            {
                "model": self.model,
                "input": rendered_prompt,
                "text": {
                    "format": {
                        "type": "json_schema",
                        "name": "ai_review_assessment",
                        "strict": True,
                        "schema": dict(output_schema),
                    }
                },
                "max_output_tokens": MAX_OUTPUT_TOKENS,
            },
            authorization=f"Bearer {self.api_key}",
        )
        content = _openai_output_text(response)
        assessment = _validated_assessment(content, known_evidence_ids)
        usage = _normalized_usage(
            response.get("usage") if isinstance(response, Mapping) else None,
            "input_tokens",
            "output_tokens",
            "total_tokens",
        )
        return ProviderAttempt(
            provider_id="openai",
            model=self.model,
            sanitized_base_url=OPENAI_BASE_URL,
            assessment=assessment,
            usage=usage,
            latency_ms=_elapsed_ms(started),
        )


@dataclass(frozen=True)
class OpenAiCompatibleProvider:
    base_url: str = field(repr=False)
    api_key: str = field(repr=False)
    model: str

    def assess(
        self,
        *,
        rendered_prompt: str,
        output_schema: Mapping[str, Any],
        known_evidence_ids: frozenset[str],
    ) -> ProviderAttempt:
        started = time.monotonic()
        response = _post_json(
            self.base_url.rstrip("/") + "/chat/completions",
            {
                "model": self.model,
                "messages": [{"role": "user", "content": rendered_prompt}],
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "ai_review_assessment",
                        "strict": True,
                        "schema": dict(output_schema),
                    },
                },
                "max_tokens": MAX_OUTPUT_TOKENS,
            },
            authorization=f"Bearer {self.api_key}",
        )
        content = _compatible_output_text(response)
        assessment = _validated_assessment(content, known_evidence_ids)
        usage = _normalized_usage(
            response.get("usage") if isinstance(response, Mapping) else None,
            "prompt_tokens",
            "completion_tokens",
            "total_tokens",
        )
        return ProviderAttempt(
            provider_id="openai-compatible",
            model=self.model,
            sanitized_base_url=sanitize_base_url(self.base_url) or "",
            assessment=assessment,
            usage=usage,
            latency_ms=_elapsed_ms(started),
        )


@dataclass(frozen=True)
class OllamaChatProvider:
    base_url: str = field(repr=False)
    model: str

    def assess(
        self,
        *,
        rendered_prompt: str,
        output_schema: Mapping[str, Any],
        known_evidence_ids: frozenset[str],
    ) -> ProviderAttempt:
        started = time.monotonic()
        response = _post_json(
            self.base_url.rstrip("/") + "/api/chat",
            {
                "model": self.model,
                "messages": [{"role": "user", "content": rendered_prompt}],
                "format": dict(output_schema),
                "stream": False,
                "options": {"num_predict": MAX_OUTPUT_TOKENS},
            },
        )
        content = _ollama_output_text(response)
        assessment = _validated_assessment(content, known_evidence_ids)
        usage = _normalized_usage(response, "prompt_eval_count", "eval_count", None)
        return ProviderAttempt(
            provider_id="ollama",
            model=self.model,
            sanitized_base_url=sanitize_base_url(self.base_url) or "",
            assessment=assessment,
            usage=usage,
            latency_ms=_elapsed_ms(started),
        )


class AiReviewProviderRegistry:
    def __init__(
        self,
        statuses: tuple[ProviderStatus, ...],
        providers: Mapping[ProviderId, AiReviewProvider],
    ) -> None:
        self._statuses = statuses
        self._providers = dict(providers)

    @classmethod
    def from_environment(cls) -> AiReviewProviderRegistry:
        openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
        openai_model = os.environ.get("OPENAI_MODEL", "").strip()
        compatible_base = os.environ.get("OPENAI_COMPATIBLE_BASE_URL", "").strip()
        compatible_key = os.environ.get("OPENAI_COMPATIBLE_API_KEY", "").strip()
        compatible_model = os.environ.get("OPENAI_COMPATIBLE_MODEL", "").strip()
        ollama_base = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434").strip()
        ollama_model = os.environ.get("OLLAMA_MODEL", "").strip()

        providers: dict[ProviderId, AiReviewProvider] = {}
        compatible_safe_base = _validated_provider_base_url(compatible_base)
        ollama_safe_base = _validated_provider_base_url(ollama_base)
        openai_configured = bool(openai_key and openai_model)
        compatible_configured = bool(
            compatible_safe_base and compatible_key and compatible_model
        )
        ollama_configured = bool(ollama_safe_base and ollama_model)
        if openai_configured:
            providers["openai"] = OpenAiResponsesProvider(openai_key, openai_model)
        if compatible_configured:
            providers["openai-compatible"] = OpenAiCompatibleProvider(
                compatible_base,
                compatible_key,
                compatible_model,
            )
        if ollama_configured:
            providers["ollama"] = OllamaChatProvider(ollama_base, ollama_model)

        return cls(
            (
                ProviderStatus("local", True, None, None),
                ProviderStatus("openai", openai_configured, openai_model or None, OPENAI_BASE_URL),
                ProviderStatus(
                    "openai-compatible",
                    compatible_configured,
                    compatible_model or None,
                    compatible_safe_base,
                ),
                ProviderStatus(
                    "ollama",
                    ollama_configured,
                    ollama_model or None,
                    ollama_safe_base,
                ),
            ),
            providers,
        )

    def statuses(self) -> tuple[ProviderStatus, ...]:
        return self._statuses

    def get(self, provider_id: ProviderId) -> AiReviewProvider | None:
        if provider_id == "local":
            return None
        if provider_id not in {"openai", "openai-compatible", "ollama"}:
            raise ValueError("unsupported_ai_review_provider")
        return self._providers.get(provider_id)

    def __repr__(self) -> str:
        return f"AiReviewProviderRegistry(statuses={self._statuses!r})"


def _post_json(
    url: str,
    payload: Mapping[str, Any],
    *,
    authorization: str | None = None,
) -> Mapping[str, Any]:
    sensitive_values = _request_sensitive_values(url, authorization)
    headers = {"Content-Type": "application/json"}
    if authorization is not None:
        headers["Authorization"] = authorization
    request = Request(
        url,
        data=json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    deadline = time.monotonic() + OVERALL_TIMEOUT_SECONDS
    # ponytail: urllib exposes one socket timeout, not separate DNS/connect/total
    # cancellation. Keep one request, cap its socket work, and tighten reads to
    # the remaining total deadline; add a transport dependency only if exact
    # DNS/connect cancellation becomes a measured requirement.
    socket_timeout = min(CONNECT_TIMEOUT_SECONDS, OVERALL_TIMEOUT_SECONDS)
    response: Any | None = None
    failure: AiReviewProviderError | None = None
    try:
        response = urlopen(request, timeout=socket_timeout)
    except HTTPError as error:
        detail = _http_error_detail(error, deadline)
        try:
            error.close()
        except (HTTPException, OSError):
            pass
        failure = AiReviewProviderError(
            "http_error",
            detail,
            sensitive_values=sensitive_values,
        )
    except HTTPException:
        failure = AiReviewProviderError("http_error", "provider_request_failed")
    except (TimeoutError, socket.timeout):
        failure = AiReviewProviderError("timeout", "provider_request_timed_out")
    except URLError as error:
        code = "timeout" if _is_timeout(error.reason) else "http_error"
        failure = AiReviewProviderError(code, f"provider_request_{code}")
    except (OSError, ValueError):
        failure = AiReviewProviderError("http_error", "provider_request_failed")
    if failure is not None:
        raise failure
    if response is None:
        raise AiReviewProviderError("http_error", "provider_response_missing")

    failure = None
    try:
        with response:
            raw = _read_bounded(response, deadline)
    except (TimeoutError, socket.timeout):
        failure = AiReviewProviderError("timeout", "provider_response_timed_out")
    except HTTPException:
        failure = AiReviewProviderError("http_error", "provider_response_failed")
    except OSError:
        failure = AiReviewProviderError("http_error", "provider_response_failed")
    if failure is not None:
        raise failure

    failure = None
    parsed: Any = None
    try:
        parsed = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        failure = AiReviewProviderError("invalid_json", "provider_response_invalid_json")
    if failure is not None:
        raise failure
    if not isinstance(parsed, Mapping):
        raise AiReviewProviderError("invalid_schema", "provider_response_must_be_object")
    return parsed


def _read_bounded(response: Any, deadline: float) -> bytes:
    chunks: list[bytes] = []
    total = 0
    while True:
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise AiReviewProviderError("timeout", "provider_response_timed_out")
        _set_response_socket_timeout(response, min(CONNECT_TIMEOUT_SECONDS, remaining))
        chunk = response.read(min(8_192, MAX_RESPONSE_BYTES + 1 - total))
        if not chunk:
            return b"".join(chunks)
        chunks.append(chunk)
        total += len(chunk)
        if total > MAX_RESPONSE_BYTES:
            raise AiReviewProviderError("response_too_large", "provider_response_exceeds_65536_bytes")


def _set_response_socket_timeout(response: Any, timeout: float) -> None:
    stream = getattr(response, "fp", None)
    for _ in range(2):
        raw = getattr(stream, "raw", None)
        sock = getattr(raw, "_sock", None)
        if sock is not None:
            sock.settimeout(max(timeout, 0.001))
            return
        stream = getattr(stream, "fp", None)


def _http_error_detail(error: HTTPError, deadline: float) -> Any:
    try:
        raw = _read_bounded(error, deadline)
        parsed = json.loads(raw.decode("utf-8"))
    except (
        AiReviewProviderError,
        HTTPException,
        UnicodeDecodeError,
        json.JSONDecodeError,
        OSError,
    ):
        parsed = None
    detail: dict[str, Any] = {"status": error.code}
    if isinstance(parsed, (Mapping, list)):
        detail["body"] = parsed
    return detail


def _openai_output_text(response: Mapping[str, Any]) -> str:
    output = response.get("output")
    if isinstance(output, list):
        for item in output:
            if not isinstance(item, Mapping) or item.get("type") != "message":
                continue
            content = item.get("content")
            if not isinstance(content, list):
                continue
            for part in content:
                if isinstance(part, Mapping) and part.get("type") == "output_text" and isinstance(part.get("text"), str):
                    return part["text"]
    raise AiReviewProviderError("invalid_schema", "openai_output_text_missing")


def _compatible_output_text(response: Mapping[str, Any]) -> str:
    choices = response.get("choices")
    if isinstance(choices, list) and choices and isinstance(choices[0], Mapping):
        message = choices[0].get("message")
        if isinstance(message, Mapping) and isinstance(message.get("content"), str):
            return message["content"]
    raise AiReviewProviderError("invalid_schema", "compatible_output_text_missing")


def _ollama_output_text(response: Mapping[str, Any]) -> str:
    message = response.get("message")
    if isinstance(message, Mapping) and isinstance(message.get("content"), str):
        return message["content"]
    raise AiReviewProviderError("invalid_schema", "ollama_output_text_missing")


def _validated_assessment(content: str, known_evidence_ids: frozenset[str]) -> dict[str, Any]:
    failure: AiReviewProviderError | None = None
    payload: Any = None
    try:
        payload = json.loads(content)
    except json.JSONDecodeError:
        failure = AiReviewProviderError("invalid_json", "provider_assessment_invalid_json")
    if failure is not None:
        raise failure
    if not isinstance(payload, Mapping):
        raise AiReviewProviderError("invalid_schema", "provider_assessment_must_be_object")

    assessment: dict[str, Any] | None = None
    failure = None
    try:
        assessment = validate_assessment(payload, known_evidence_ids)
    except ValueError as error:
        code = (
            "unknown_evidence_reference"
            if str(error) == "assessment_evidence_reference_unknown"
            else "invalid_schema"
        )
        failure = AiReviewProviderError(code, str(error))
    if failure is not None:
        raise failure
    if assessment is None:
        raise AiReviewProviderError("invalid_schema", "provider_assessment_missing")
    if _contains_prohibited_output(assessment):
        raise AiReviewProviderError("invalid_schema", "provider_assessment_contains_execution_semantics")
    return assessment


def _normalized_usage(
    usage: Any,
    input_key: str,
    output_key: str,
    total_key: str | None,
) -> dict[str, int]:
    source = usage if isinstance(usage, Mapping) else {}
    input_tokens = _non_negative_int(source.get(input_key))
    output_tokens = _non_negative_int(source.get(output_key))
    total_tokens = _non_negative_int(source.get(total_key)) if total_key else None
    if total_tokens is None and input_tokens is not None and output_tokens is not None:
        total_tokens = input_tokens + output_tokens
    normalized = {
        "inputTokens": input_tokens,
        "outputTokens": output_tokens,
        "totalTokens": total_tokens,
    }
    return {key: value for key, value in normalized.items() if value is not None}


def _non_negative_int(value: Any) -> int | None:
    return value if isinstance(value, int) and not isinstance(value, bool) and value >= 0 else None


def _contains_prohibited_output(value: Any) -> bool:
    if isinstance(value, str):
        normalized = value
        for pattern in _SAFE_NEGATION_PATTERNS:
            normalized = pattern.sub("", normalized)
        return any(
            pattern.search(normalized)
            for pattern in _PROHIBITED_OUTPUT_PATTERNS
        )
    if isinstance(value, Mapping):
        return any(_contains_prohibited_output(item) for item in value.values())
    if isinstance(value, (list, tuple)):
        return any(_contains_prohibited_output(item) for item in value)
    return False


def _redact_sensitive_fields(value: Any) -> Any:
    if isinstance(value, Mapping):
        redacted: dict[str, Any] = {}
        for key, item in value.items():
            name = str(key)
            redacted[name] = (
                "[REDACTED]"
                if _is_sensitive_key(name)
                else _redact_sensitive_fields(item)
            )
        return redacted
    if isinstance(value, (list, tuple)):
        return [_redact_sensitive_fields(item) for item in value]
    return value


def _redact_sensitive_values(
    value: Any,
    sensitive_values: Iterable[str],
) -> Any:
    secrets = tuple(
        sorted(
            {item for item in sensitive_values if item},
            key=len,
            reverse=True,
        )
    )
    if isinstance(value, str):
        for secret in secrets:
            value = value.replace(secret, "[REDACTED]")
        return value
    if isinstance(value, Mapping):
        return {
            key: _redact_sensitive_values(item, secrets)
            for key, item in value.items()
        }
    if isinstance(value, (list, tuple)):
        return [_redact_sensitive_values(item, secrets) for item in value]
    return value


def _request_sensitive_values(
    url: str,
    authorization: str | None,
) -> tuple[str, ...]:
    values: list[str] = []
    if authorization:
        values.append(authorization)
        _, separator, credential = authorization.partition(" ")
        if separator and credential:
            values.append(credential)
    try:
        parsed = urlsplit(url)
    except ValueError:
        return tuple(values)
    for item in (parsed.username, parsed.password):
        if item:
            values.extend((item, unquote(item)))
    for key, item in parse_qsl(parsed.query, keep_blank_values=False):
        if _is_sensitive_key(key) and item:
            values.append(item)
    return tuple(values)


def _validated_provider_base_url(value: str) -> str | None:
    try:
        parsed = urlsplit(value)
        hostname = parsed.hostname
        _ = parsed.port
    except (UnicodeError, ValueError):
        return None
    if (
        parsed.scheme.casefold() not in {"http", "https"}
        or not hostname
        or not _is_valid_hostname(hostname)
        or parsed.username is not None
        or parsed.password is not None
        or parsed.query
        or parsed.fragment
        or not _is_valid_raw_url_path(value)
        or any(
            parsed.path.rstrip("/").endswith(endpoint)
            for endpoint in _FINAL_PROVIDER_ENDPOINTS
        )
    ):
        return None
    return sanitize_base_url(value)


def _is_valid_raw_url_path(value: str) -> bool:
    authority_start = value.find("://") + 3
    path_start = value.find("/", authority_start)
    if path_start < 0:
        return True
    path = value[path_start:]
    return not re.search(r"%(?![0-9a-f]{2})", path, re.IGNORECASE) and path == quote(
        path,
        safe=_URL_PATH_SAFE,
    )


def _is_valid_hostname(value: str) -> bool:
    try:
        ipaddress.ip_address(value)
        return True
    except ValueError:
        pass
    try:
        hostname = value.encode("idna").decode("ascii").rstrip(".")
    except UnicodeError:
        return False
    if not hostname or len(hostname) > 253:
        return False
    return all(
        re.fullmatch(
            r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?",
            label,
            re.IGNORECASE,
        )
        for label in hostname.split(".")
    )


def _is_sensitive_key(value: Any) -> bool:
    normalized = re.sub(r"[^a-z0-9]", "", str(value).casefold())
    return any(part in normalized for part in _SECRET_KEY_PARTS)


def _is_timeout(reason: Any) -> bool:
    return isinstance(reason, (TimeoutError, socket.timeout)) or "timed out" in str(reason).casefold()


def _elapsed_ms(started: float) -> int:
    return max(0, round((time.monotonic() - started) * 1_000))
