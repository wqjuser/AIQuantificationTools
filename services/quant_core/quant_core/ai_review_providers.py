from __future__ import annotations

import ipaddress
import json
import os
import queue
import re
import socket
import threading
import time
from collections.abc import Callable, Generator, Iterable, Iterator, Mapping
from dataclasses import dataclass, field
from http.client import HTTPException
from typing import Any, Literal, Protocol
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, quote, unquote, urlsplit, urlunsplit
from urllib.request import Request, urlopen

from quant_core.ai_review_stage3 import validate_assessment


ProviderId = Literal["local", "openai", "openai-compatible", "ollama"]
StructuredResponseValidator = Callable[
    [Mapping[str, Any], frozenset[str]],
    dict[str, Any],
]

OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
OPENAI_BASE_URL = "https://api.openai.com/v1"
CONNECT_TIMEOUT_SECONDS = 5.0
OVERALL_TIMEOUT_SECONDS = 30.0
MAX_RESPONSE_BYTES = 65_536
MAX_STREAM_RESPONSE_BYTES = 524_288
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
        r"(?:不要|不得|禁止)\s*(?:买入|卖出)[^。！？!?]*",
        r"(?:不要|不得|禁止)\s*(?:持有|做多|做空|开多|开空|平仓|止损|止盈)[^。！？!?]*",
        r"(?:不要|不得|禁止)\s*(?:把|将)?\s*仓位\s*(?:提高|提升|增加|降低|调整|设为)[^。！？!?]*",
        r"(?:不\s*建议|不要|不得|禁止)\s*(?:建仓|加仓|增持|减仓|减持|清仓)[^。！？!?]*",
        r"(?:不要|不得|禁止)\s*(?:把|将)?\s*(?:止损位|止盈位|止损价格|止盈价格)\s*(?:为|设为|设置为|定为|调整为)[^。！？!?]*",
        r"(?:不要|不得|禁止|不\s*建议|不\s*推荐)\s*(?:(?:以|在)\s*\d+(?:\.\d+)?\s*(?:元|美元)?\s*(?:附近|左右|上下|一带|价位|以下|以上|区间)?\s*(?:时|的时候)?\s*)?(?:逢低)?\s*(?:吸纳|买进|看多|看空|布局|抄底|持仓)[^。！？!?]*",
        r"不\s*保证收益",
        r"无\s*收益保证",
        r"\bno\s+target\s+price\b",
        r"\bdo\s+not\s+(?:buy|sell)\b[^.!?]*",
        r"\bdo\s+not\s+(?:go\s+(?:long|short)|open\s+(?:a\s+)?(?:long|short)|close\s+(?:the\s+)?position)\b[^.!?]*",
        r"\bdo\s+not\s+place\s+orders?\b",
        r"\bdo\s+not\s+(?:increase|raise|reduce|lower|set|adjust)\s+(?:the\s+)?position\b[^.!?]*",
    )
)
_SAFE_UNCONDITIONAL_NEGATION_PATTERNS = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"不\s*保证收益",
        r"无\s*收益保证",
        r"(?:不要|不得|禁止|不\s*建议|不\s*推荐)\s*(?:设置|设定|给出|提供)?\s*目标价",
        r"(?:不要|不得|禁止|不\s*建议|不\s*推荐)\s*(?:给出|提供)?\s*仓位指令",
        r"\bno\s+target\s+price\b",
        r"\bdo\s+not\s+(?:set|give|provide)\s+(?:a\s+)?target\s+price\b",
        r"\bdo\s+not\s+(?:give|provide)\s+(?:a\s+)?position\s+instruction\b",
        r"(?:未|没有|无|缺少)\s*(?:给出|提供|设置|设定)?\s*(?:目标价|仓位指令)(?:\s*(?:或|和|与)\s*(?:目标价|仓位指令))*",
        r"\bno\s+(?:target\s+price|position\s+instruction)(?:\s+(?:or|and)\s+(?:target\s+price|position\s+instruction))*\s+(?:is|are)\s+(?:provided|given|set)\b",
        r"\b(?:the\s+)?(?:target\s+price|position\s+instruction)(?:\s+(?:or|and)\s+(?:target\s+price|position\s+instruction))*\s+(?:is|are)\s+not\s+(?:provided|given|set)\b",
    )
)
_OUTPUT_CLAUSE_BOUNDARY = re.compile(
    r"[，,；;。！？!?\n]+|(?:但(?:是)?|然而|却|同时|并且|以及|且)|"
    r"并(?=\s*(?:保证|目标价|收益|建议|推荐|立即|请|应该|应当|可考虑|可以|可|"
    r"买入|卖出|买进|吸纳|布局|抄底|下单|建仓|加仓|增持|减仓|减持|清仓|"
    r"持有|持仓|看多|看空|做多|做空|开多|开空|平仓|止损|止盈))",
    re.IGNORECASE,
)
_EXECUTION_ACTION_VERB = re.compile(
    r"(?:(?:止损位|止盈位)\s*(?:设为|设置为|定为|调整为)|"
    r"(?:把|将)?\s*仓位\s*(?:提高|提升|增加|降低|调整|设为)|"
    r"买入|卖出|买进|吸纳|布局|抄底|下单|建仓|加仓|增持|减仓|减持|清仓|持有|持仓|"
    r"看多|看空|"
    r"做多|做空|开多|开空|平仓|止损|止盈|"
    r"\b(?:buy|sell|submit|place|go|open|close|increase|raise|reduce|lower|set|adjust)\b)",
    re.IGNORECASE,
)
_POSITIVE_EXECUTION_CUE = re.compile(
    r"^(?:建议|推荐|立即|请|应该|应当|可考虑|可以|可)",
    re.IGNORECASE,
)
_EXECUTION_META_REFERENCE = re.compile(
    rf"{_EXECUTION_ACTION_VERB.pattern}\s*"
    r"(?:条件|信号|规则|行为|建议|操作|原因|时机|价格|数量|逻辑|阈值|依据|证据|策略|回测|记录|历史|结构|比例|上限|风险|约束|参数|机制|指标|表现|结果|数据|样本|天数)",
    re.IGNORECASE,
)
_SAFE_EXECUTION_META_CLAUSE = re.compile(
    rf"(?:{_POSITIVE_EXECUTION_CUE.pattern}\s*)?"
    r"(?:(?:观察|关注|分析|复核|检查|评估|比较|记录|回测|验证|研究|未发现|没有|缺少)\s*)?"
    r"(?:(?:明确|潜在|历史|当前)的\s*)?"
    rf"(?:{_EXECUTION_META_REFERENCE.pattern})"
    r"(?:\s*(?:(?:尚未|仍未|未|已经|已|可能)?\s*"
    r"(?:出现|成立|有效|满足|触发|增强|减弱|变化)|"
    r"的(?:历史)?表现|的有效性|的可靠性))?",
    re.IGNORECASE,
)
_SAFE_RESEARCH_CONTEXT_PATTERNS = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"(?:(?:当前|历史|策略|证据(?:显示|记录)?|回测(?:中)?)(?:的)?\s*)?"
        rf"(?:(?:观察|关注|分析|复核|检查|评估|比较|记录|回测|验证|研究)\s*)?"
        rf"(?:{_EXECUTION_META_REFERENCE.pattern})"
        rf"(?:\s*(?:和|与|及)\s*(?:{_EXECUTION_META_REFERENCE.pattern}))*"
        r"(?:\s*(?:的(?:历史)?表现(?:有效|无效|稳定|不稳定)?|在(?:回测|历史|样本(?:内|外)?)(?:中|内)?(?:仍|依然)?(?:有效|无效|稳定|不稳定)|"
        r"(?:尚未|仍未|未|已经|已|可能)?\s*(?:出现|成立|有效|满足|触发|增强|减弱|变化)))?",
        r"(?:(?:当前|历史|策略(?:定义|配置)?|风险参数|证据(?:显示|记录)?|回测(?:中)?)(?:的)?\s*)"
        r"(?:仓位|持仓|持仓比例)(?:上限)?\s*(?:为|是)?\s*\d+(?:\.\d+)?\s*%",
        r"(?:仓位|持仓|持仓比例)上限\s*(?:为|是)?\s*\d+(?:\.\d+)?\s*%",
        r"(?:(?:monitor|review|analyze|check|evaluate|compare|record|backtest|validate|study)\s+(?:the\s+)?)?(?:the\s+)?"
        r"(?:buy|sell|position|stop[ -]?loss|take[ -]?profit)\s+"
        r"(?:signal|condition|rule|structure|ratio|limit|risk|constraint|parameter|metric|performance|result|data|sample)"
        r"(?:\s+(?:and|or)\s+(?:the\s+)?(?:buy|sell|position|stop[ -]?loss|take[ -]?profit)\s+"
        r"(?:signal|condition|rule|structure|ratio|limit|risk|constraint|parameter|metric|performance|result|data|sample))*"
        r"(?:\s+(?:is|are|was|were|remains?)\s+[^.!?]+)?",
        r"(?:the\s+)?evidence\s+(?:does\s+not|doesn't|fails?\s+to)\s+support\s+(?:an?\s+)?"
        r"(?:buy|sell|position|stop[ -]?loss|take[ -]?profit)\s+(?:signal|condition|rule)",
        r"(?:monitor|review|analyze|check|evaluate|compare|record|backtest|validate|study)\s+(?:the\s+)?"
        r"(?:buy|sell)\s+(?:and|or)\s+(?:buy|sell)\s+signals?",
    )
)
_UNCONDITIONAL_PROHIBITED_OUTPUT_PATTERNS = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"目标价",
        r"仓位指令",
        r"收益保证",
        r"保证收益",
        r"收益\s*(?:是)?\s*(?:有)?\s*保证",
        r"\btarget\s+price\b",
        r"\bposition\s+instruction\b",
        r"\bguaranteed?\s+returns?\b",
        r"\breturns?\s+guarantee\b",
        r"\breturns?\s+(?:is|are)\s+guaranteed\b",
    )
)
_PROHIBITED_OUTPUT_PATTERNS = tuple(
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"(?:买入|卖出|下单|建仓|加仓|增持|减仓|减持|清仓|持有|做多|做空|开多|开空|平仓|止损|止盈)\s*$",
        r"(?:买入|卖出)\s*\d+(?:\.\d+)?\s*股",
        r"(?:买入|卖出)\s*(?!(?:条件|信号|规则|行为|建议|操作|原因|时机|价格|数量|逻辑|阈值|依据|证据|策略|回测|记录|历史))(?:该标的|本标的|[A-Za-z0-9\u4e00-\u9fff]{2,32})(?:\s*[。！!，,；;]|$)",
        r"(?:建仓|加仓|增持|减仓|减持|清仓)\s*(?:到|至|为)?\s*\d+(?:\.\d+)?\s*%",
        r"(?:建仓|加仓|增持|减仓|减持|清仓)\s*(?!(?:条件|信号|规则|行为|建议|操作|原因|时机|价格|数量|逻辑|阈值|依据|证据|策略|回测|记录|历史))(?:该标的|本标的|[A-Za-z0-9\u4e00-\u9fff]{2,32})(?:\s*[。！!，,；;]|$)",
        r"(?:持有|做多|做空|开多|开空|平仓|止损|止盈)\s*(?!(?:条件|信号|规则|行为|建议|操作|原因|时机|价格|数量|逻辑|阈值|依据|证据|策略|回测|记录|历史))(?:该标的|本标的|[A-Za-z0-9\u4e00-\u9fff]{2,32})(?:\s*[。！!，,；;]|$)",
        r"目标价",
        r"仓位指令",
        r"(?:把|将)?\s*仓位\s*(?:提高|提升|增加|降低|降至|设为|调整)(?:\s*(?:到|至|为)?\s*(?:\d+(?:\.\d+)?\s*%|[一二三四五六七八九十两半]+成))?",
        r"(?:止损位|止盈位|止损价格|止盈价格)\s*(?:为|设为|设置为|定为|调整为)\s*\d+(?:\.\d+)?\s*(?:元|美元|%)?",
        r"(?:仓位|持仓|持仓比例)\s*(?:到|至|为)?\s*\d+(?:\.\d+)?\s*%",
        r"(?:买点|卖点|入场点|出场点|入场价|出场价)\s*(?:为|在|设为|设置为|定为)\s*\d+(?:\.\d+)?\s*(?:元|美元)?",
        r"收益保证",
        r"保证收益",
        r"收益\s*(?:是)?\s*(?:有)?\s*保证",
        r"\bsubmit\s+(?:an?\s+)?order\b",
        r"\bplace\s+(?:an?\s+)?order\b",
        r"\b(?:buy|sell)\b\s*$",
        r"\b(?:go\s+(?:long|short)|open\s+(?:a\s+)?(?:long|short)|close\s+(?:the\s+)?position)\b",
        r"\b(?:buy|sell)\s+\d+(?:\.\d+)?\s*(?:shares?|units?)\b",
        r"\b(?:buy|sell)\s+(?!(?:signal|condition|rule|logic|price|quantity)\b)(?:this|the|[A-Z][A-Za-z0-9.-]{1,15})\b",
        r"\btarget\s+price\b",
        r"\bposition\s+instruction\b",
        r"\b(?:increase|raise|reduce|lower|set|adjust)\s+(?:the\s+)?position(?:\s+size)?(?:\s+(?:to|at)\s+\d+(?:\.\d+)?\s*%)?",
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
    @property
    def endpoint(self) -> str: ...

    def assess(
        self,
        *,
        rendered_prompt: str,
        output_schema: Mapping[str, Any],
        known_evidence_ids: frozenset[str],
        response_validator: StructuredResponseValidator | None = None,
    ) -> ProviderAttempt: ...

    def stream_assessment(
        self,
        *,
        rendered_prompt: str,
        output_schema: Mapping[str, Any],
        known_evidence_ids: frozenset[str],
        cancelled: threading.Event | None = None,
        reasoning_effort: str | None = None,
        response_validator: StructuredResponseValidator | None = None,
    ) -> Generator[str, None, ProviderAttempt]: ...


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

    @property
    def endpoint(self) -> str:
        return OPENAI_RESPONSES_URL

    def assess(
        self,
        *,
        rendered_prompt: str,
        output_schema: Mapping[str, Any],
        known_evidence_ids: frozenset[str],
        response_validator: StructuredResponseValidator | None = None,
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
        assessment = _validated_assessment(
            content,
            known_evidence_ids,
            response_validator=response_validator,
        )
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

    def stream_assessment(
        self,
        *,
        rendered_prompt: str,
        output_schema: Mapping[str, Any],
        known_evidence_ids: frozenset[str],
        cancelled: threading.Event | None = None,
        reasoning_effort: str | None = None,
        response_validator: StructuredResponseValidator | None = None,
    ) -> Generator[str, None, ProviderAttempt]:
        started = time.monotonic()
        deltas: list[str] = []
        completed_response: Mapping[str, Any] | None = None
        for data in _iter_post_json_data(
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
                "stream": True,
            },
            authorization=f"Bearer {self.api_key}",
            framing="sse",
            cancelled=cancelled,
        ):
            if data == "[DONE]":
                continue
            event = _stream_json_object(data)
            event_type = event.get("type")
            if event_type == "response.output_text.delta":
                delta = event.get("delta")
                if not isinstance(delta, str):
                    raise AiReviewProviderError(
                        "invalid_schema",
                        "openai_stream_delta_invalid",
                    )
                if delta:
                    deltas.append(delta)
                    yield delta
            elif event_type == "response.completed":
                response = event.get("response")
                if isinstance(response, Mapping):
                    completed_response = response
                    break
            elif event_type in {"error", "response.failed"}:
                raise AiReviewProviderError("http_error", "provider_stream_failed")
            elif event_type == "response.incomplete":
                raise AiReviewProviderError(
                    "invalid_schema",
                    "provider_stream_incomplete",
                )
        if completed_response is None:
            raise AiReviewProviderError(
                "invalid_schema",
                "openai_stream_completion_missing",
            )
        content = _openai_output_text(completed_response)
        if content != "".join(deltas):
            raise AiReviewProviderError(
                "invalid_schema",
                "openai_stream_content_mismatch",
            )
        assessment = _validated_assessment(
            content,
            known_evidence_ids,
            response_validator=response_validator,
        )
        usage = _normalized_usage(
            completed_response.get("usage"),
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
    reasoning_effort: str | None = None

    @property
    def endpoint(self) -> str:
        return self.base_url.rstrip("/") + "/chat/completions"

    def assess(
        self,
        *,
        rendered_prompt: str,
        output_schema: Mapping[str, Any],
        known_evidence_ids: frozenset[str],
        response_validator: StructuredResponseValidator | None = None,
    ) -> ProviderAttempt:
        started = time.monotonic()
        response = _post_json(
            self.endpoint,
            _compatible_chat_payload(
                model=self.model,
                rendered_prompt=rendered_prompt,
                output_schema=output_schema,
                reasoning_effort=None,
                stream=False,
            ),
            authorization=f"Bearer {self.api_key}",
        )
        content = _compatible_output_text(response)
        assessment = _validated_assessment(
            content,
            known_evidence_ids,
            response_validator=response_validator,
        )
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

    def stream_assessment(
        self,
        *,
        rendered_prompt: str,
        output_schema: Mapping[str, Any],
        known_evidence_ids: frozenset[str],
        cancelled: threading.Event | None = None,
        reasoning_effort: str | None = None,
        response_validator: StructuredResponseValidator | None = None,
    ) -> Generator[str, None, ProviderAttempt]:
        started = time.monotonic()
        deadline = started + OVERALL_TIMEOUT_SECONDS
        requested_reasoning_effort = (
            reasoning_effort
            if reasoning_effort is not None
            else self.reasoning_effort
        )
        efforts = (
            (requested_reasoning_effort, None)
            if requested_reasoning_effort is not None
            else (None,)
        )
        for attempt_index, reasoning_effort in enumerate(efforts):
            deltas: list[str] = []
            usage_source: Mapping[str, Any] = {}
            completed = False
            try:
                events = _iter_post_json_data(
                    self.endpoint,
                    _compatible_chat_payload(
                        model=self.model,
                        rendered_prompt=rendered_prompt,
                        output_schema=output_schema,
                        reasoning_effort=reasoning_effort,
                        stream=True,
                    ),
                    authorization=f"Bearer {self.api_key}",
                    framing="sse",
                    cancelled=cancelled,
                    deadline=deadline,
                )
                for data in events:
                    if data == "[DONE]":
                        completed = True
                        break
                    event = _stream_json_object(data)
                    if "error" in event:
                        raise AiReviewProviderError(
                            "http_error",
                            event,
                            sensitive_values=(self.api_key,),
                        )
                    if isinstance(event.get("usage"), Mapping):
                        usage_source = event["usage"]
                    choices = event.get("choices")
                    if not isinstance(choices, list) or not choices:
                        continue
                    choice = choices[0]
                    if not isinstance(choice, Mapping):
                        raise AiReviewProviderError(
                            "invalid_schema",
                            "compatible_stream_choice_invalid",
                        )
                    delta_payload = choice.get("delta")
                    if isinstance(delta_payload, Mapping):
                        delta = delta_payload.get("content")
                        if delta is not None and not isinstance(delta, str):
                            raise AiReviewProviderError(
                                "invalid_schema",
                                "compatible_stream_delta_invalid",
                            )
                        if delta:
                            deltas.append(delta)
                            yield delta
                    if choice.get("finish_reason") is not None:
                        completed = True
                        break
            except AiReviewProviderError as error:
                if (
                    attempt_index == 0
                    and not deltas
                    and _should_retry_without_reasoning_effort(
                        error,
                        reasoning_effort=reasoning_effort,
                    )
                ):
                    continue
                raise
            if not completed:
                raise AiReviewProviderError(
                    "invalid_schema",
                    "compatible_stream_completion_missing",
                )
            content = "".join(deltas)
            assessment = _validated_assessment(
                content,
                known_evidence_ids,
                response_validator=response_validator,
            )
            usage = _normalized_usage(
                usage_source,
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
        raise AiReviewProviderError(
            "http_error",
            "compatible_stream_reasoning_fallback_failed",
        )


def _compatible_chat_payload(
    *,
    model: str,
    rendered_prompt: str,
    output_schema: Mapping[str, Any],
    reasoning_effort: str | None,
    stream: bool,
) -> dict[str, Any]:
    message = rendered_prompt
    if stream:
        message += "\n\n请只返回严格匹配以下 JSON Schema 的对象：\n" + json.dumps(
            dict(output_schema),
            ensure_ascii=False,
            separators=(",", ":"),
        )
    payload: dict[str, Any] = {
        "model": model,
        "messages": [{"role": "user", "content": message}],
        "response_format": (
            {"type": "json_object"}
            if stream
            else {
                "type": "json_schema",
                "json_schema": {
                    "name": "ai_review_assessment",
                    "strict": True,
                    "schema": dict(output_schema),
                },
            }
        ),
        "max_tokens": MAX_OUTPUT_TOKENS,
    }
    if reasoning_effort is not None:
        payload["reasoning_effort"] = reasoning_effort
    if stream:
        payload["stream"] = True
    return payload


def _should_retry_without_reasoning_effort(
    error: AiReviewProviderError,
    *,
    reasoning_effort: str | None,
) -> bool:
    if reasoning_effort is None or error.code != "http_error":
        return False
    detail = error.detail.casefold()
    return "reasoning_effort" in detail


@dataclass(frozen=True)
class OllamaChatProvider:
    base_url: str = field(repr=False)
    model: str

    @property
    def endpoint(self) -> str:
        return self.base_url.rstrip("/") + "/api/chat"

    def assess(
        self,
        *,
        rendered_prompt: str,
        output_schema: Mapping[str, Any],
        known_evidence_ids: frozenset[str],
        response_validator: StructuredResponseValidator | None = None,
    ) -> ProviderAttempt:
        started = time.monotonic()
        response = _post_json(
            self.endpoint,
            {
                "model": self.model,
                "messages": [{"role": "user", "content": rendered_prompt}],
                "format": dict(output_schema),
                "stream": False,
                "options": {"num_predict": MAX_OUTPUT_TOKENS},
            },
        )
        content = _ollama_output_text(response)
        assessment = _validated_assessment(
            content,
            known_evidence_ids,
            response_validator=response_validator,
        )
        usage = _normalized_usage(response, "prompt_eval_count", "eval_count", None)
        return ProviderAttempt(
            provider_id="ollama",
            model=self.model,
            sanitized_base_url=sanitize_base_url(self.base_url) or "",
            assessment=assessment,
            usage=usage,
            latency_ms=_elapsed_ms(started),
        )

    def stream_assessment(
        self,
        *,
        rendered_prompt: str,
        output_schema: Mapping[str, Any],
        known_evidence_ids: frozenset[str],
        cancelled: threading.Event | None = None,
        reasoning_effort: str | None = None,
        response_validator: StructuredResponseValidator | None = None,
    ) -> Generator[str, None, ProviderAttempt]:
        started = time.monotonic()
        deltas: list[str] = []
        completed_response: Mapping[str, Any] | None = None
        for data in _iter_post_json_data(
            self.endpoint,
            {
                "model": self.model,
                "messages": [{"role": "user", "content": rendered_prompt}],
                "format": dict(output_schema),
                "stream": True,
                "options": {"num_predict": MAX_OUTPUT_TOKENS},
            },
            framing="ndjson",
            cancelled=cancelled,
        ):
            event = _stream_json_object(data)
            if "error" in event:
                raise AiReviewProviderError("http_error", "provider_stream_failed")
            message = event.get("message")
            if isinstance(message, Mapping):
                delta = message.get("content")
                if delta is not None and not isinstance(delta, str):
                    raise AiReviewProviderError(
                        "invalid_schema",
                        "ollama_stream_delta_invalid",
                    )
                if delta:
                    deltas.append(delta)
                    yield delta
            if event.get("done") is True:
                completed_response = event
                break
        if completed_response is None:
            raise AiReviewProviderError(
                "invalid_schema",
                "ollama_stream_completion_missing",
            )
        content = "".join(deltas)
        assessment = _validated_assessment(
            content,
            known_evidence_ids,
            response_validator=response_validator,
        )
        usage = _normalized_usage(
            completed_response,
            "prompt_eval_count",
            "eval_count",
            None,
        )
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
        compatible_safe_base = validated_provider_base_url(compatible_base)
        ollama_safe_base = validated_provider_base_url(ollama_base)
        openai_configured = bool(openai_key and openai_model)
        compatible_configured = bool(
            compatible_safe_base and compatible_key and compatible_model
        )
        ollama_configured = bool(ollama_safe_base and ollama_model)
        if openai_configured:
            providers["openai"] = OpenAiResponsesProvider(openai_key, openai_model)
        if compatible_configured:
            providers["openai-compatible"] = OpenAiCompatibleProvider(
                compatible_safe_base or "",
                compatible_key,
                compatible_model,
            )
        if ollama_configured:
            providers["ollama"] = OllamaChatProvider(
                ollama_safe_base or "",
                ollama_model,
            )

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
    deadline = time.monotonic() + OVERALL_TIMEOUT_SECONDS
    completed = threading.Event()
    result: list[Mapping[str, Any] | Exception] = []

    def request_before_deadline() -> None:
        try:
            result.append(
                _post_json_before_deadline(
                    url,
                    payload,
                    authorization=authorization,
                    deadline=deadline,
                )
            )
        except Exception as error:
            result.append(error)
        finally:
            completed.set()

    # ponytail: a stdlib DNS/TLS call may finish later in this daemon after the
    # caller times out; use a cancellable transport only if hung threads become
    # observable. The caller still gets one request and a strict wall-clock cap.
    threading.Thread(
        target=request_before_deadline,
        name="ai-review-provider-request",
        daemon=True,
    ).start()
    if not completed.wait(max(0.0, deadline - time.monotonic())):
        raise AiReviewProviderError("timeout", "provider_request_timed_out")
    if not result:
        raise AiReviewProviderError("http_error", "provider_request_failed")
    outcome = result[0]
    if isinstance(outcome, Exception):
        raise outcome
    return outcome


_STREAM_END = object()


def _iter_post_json_data(
    url: str,
    payload: Mapping[str, Any],
    *,
    authorization: str | None = None,
    framing: Literal["sse", "ndjson"],
    cancelled: threading.Event | None = None,
    deadline: float | None = None,
) -> Iterator[str]:
    effective_deadline = (
        deadline
        if deadline is not None
        else time.monotonic() + OVERALL_TIMEOUT_SECONDS
    )
    stopped = threading.Event()
    items: queue.Queue[Any] = queue.Queue()
    response_lock = threading.Lock()
    active_response: list[Any] = []

    def track_response(response: Any | None) -> None:
        with response_lock:
            active_response.clear()
            if response is not None:
                active_response.append(response)

    def request_before_deadline() -> None:
        try:
            for item in _iter_post_json_data_before_deadline(
                url,
                payload,
                authorization=authorization,
                deadline=effective_deadline,
                framing=framing,
                stopped=stopped,
                on_response=track_response,
            ):
                if stopped.is_set():
                    break
                items.put(item)
        except Exception as error:
            items.put(error)
        finally:
            items.put(_STREAM_END)

    worker = threading.Thread(
        target=request_before_deadline,
        name="ai-review-provider-stream",
        daemon=True,
    )
    worker.start()
    try:
        while True:
            if cancelled is not None and cancelled.is_set():
                return
            remaining = effective_deadline - time.monotonic()
            if remaining <= 0:
                raise AiReviewProviderError("timeout", "provider_request_timed_out")
            try:
                item = items.get(timeout=min(0.1, remaining))
            except queue.Empty:
                continue
            if item is _STREAM_END:
                return
            if isinstance(item, Exception):
                raise item
            yield str(item)
    finally:
        stopped.set()
        with response_lock:
            response = active_response[0] if active_response else None
        if response is not None:
            _shutdown_response_socket(response)
        worker.join(timeout=0.25)
        if response is not None:
            try:
                response.close()
            except (HTTPException, OSError):
                pass
        if worker.is_alive():
            worker.join(timeout=0.25)


def _post_json_before_deadline(
    url: str,
    payload: Mapping[str, Any],
    *,
    authorization: str | None,
    deadline: float,
) -> Mapping[str, Any]:
    response = _open_post_json_response_before_deadline(
        url,
        payload,
        authorization=authorization,
        deadline=deadline,
    )
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


def _open_post_json_response_before_deadline(
    url: str,
    payload: Mapping[str, Any],
    *,
    authorization: str | None,
    deadline: float,
) -> Any:
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
    socket_timeout = deadline - time.monotonic()
    if socket_timeout <= 0:
        raise AiReviewProviderError("timeout", "provider_request_timed_out")
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
    return response


def _iter_post_json_data_before_deadline(
    url: str,
    payload: Mapping[str, Any],
    *,
    authorization: str | None,
    deadline: float,
    framing: Literal["sse", "ndjson"],
    stopped: threading.Event,
    on_response: Callable[[Any | None], None],
) -> Iterator[str]:
    response = _open_post_json_response_before_deadline(
        url,
        payload,
        authorization=authorization,
        deadline=deadline,
    )
    on_response(response)
    try:
        with response:
            lines = _iter_response_lines_bounded(
                response,
                deadline,
                stopped,
                max_bytes=MAX_STREAM_RESPONSE_BYTES,
            )
            if framing == "sse":
                yield from _iter_sse_data(lines)
            else:
                yield from _iter_ndjson_data(lines)
    except (TimeoutError, socket.timeout):
        raise AiReviewProviderError(
            "timeout",
            "provider_response_timed_out",
        ) from None
    except UnicodeDecodeError:
        raise AiReviewProviderError(
            "invalid_json",
            "provider_response_invalid_utf8",
        ) from None
    except (HTTPException, OSError):
        raise AiReviewProviderError(
            "http_error",
            "provider_response_failed",
        ) from None
    finally:
        on_response(None)


def _iter_response_lines_bounded(
    response: Any,
    deadline: float,
    stopped: threading.Event,
    *,
    max_bytes: int,
) -> Iterator[bytes]:
    pending = bytearray()
    total = 0
    while not stopped.is_set():
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise AiReviewProviderError("timeout", "provider_response_timed_out")
        _set_response_socket_timeout(response, min(CONNECT_TIMEOUT_SECONDS, remaining))
        chunk = response.readline(min(8_192, max_bytes + 1 - total))
        if not chunk:
            if pending:
                yield bytes(pending)
            return
        pending.extend(chunk)
        total += len(chunk)
        if total > max_bytes:
            raise AiReviewProviderError(
                "response_too_large",
                "provider_stream_response_too_large",
            )
        while b"\n" in pending:
            index = pending.index(b"\n")
            yield bytes(pending[:index])
            del pending[: index + 1]


def _iter_sse_data(lines: Iterable[bytes]) -> Iterator[str]:
    data_lines: list[str] = []
    for raw_line in lines:
        line = raw_line.decode("utf-8").removesuffix("\r")
        if not line:
            if data_lines:
                yield "\n".join(data_lines)
                data_lines.clear()
            continue
        if line.startswith(":"):
            continue
        field, separator, value = line.partition(":")
        if field == "data":
            data_lines.append(value[1:] if separator and value.startswith(" ") else value)
    if data_lines:
        yield "\n".join(data_lines)


def _iter_ndjson_data(lines: Iterable[bytes]) -> Iterator[str]:
    for raw_line in lines:
        line = raw_line.decode("utf-8").strip()
        if line:
            yield line


def _stream_json_object(data: str) -> Mapping[str, Any]:
    try:
        parsed = json.loads(data)
    except json.JSONDecodeError:
        raise AiReviewProviderError(
            "invalid_json",
            "provider_stream_event_invalid_json",
        ) from None
    if not isinstance(parsed, Mapping):
        raise AiReviewProviderError(
            "invalid_schema",
            "provider_stream_event_must_be_object",
        )
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
    sock = _response_socket(response)
    if sock is not None:
        sock.settimeout(max(timeout, 0.001))


def _shutdown_response_socket(response: Any) -> None:
    sock = _response_socket(response)
    if sock is None:
        return
    try:
        sock.shutdown(socket.SHUT_RDWR)
    except OSError:
        pass


def _response_socket(response: Any) -> Any | None:
    stream = getattr(response, "fp", None)
    for _ in range(2):
        raw = getattr(stream, "raw", None)
        sock = getattr(raw, "_sock", None)
        if sock is not None:
            return sock
        stream = getattr(stream, "fp", None)
    return None


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


def _validated_assessment(
    content: str,
    known_evidence_ids: frozenset[str],
    *,
    response_validator: StructuredResponseValidator | None = None,
) -> dict[str, Any]:
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
        validator = response_validator or validate_assessment
        assessment = validator(payload, known_evidence_ids)
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
    if response_validator is None and contains_prohibited_output(assessment):
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


def contains_prohibited_output(value: Any) -> bool:
    if isinstance(value, str):
        for clause in _OUTPUT_CLAUSE_BOUNDARY.split(value):
            normalized = clause.strip(" \t\r\n。！？!?.,，；;")
            if not normalized:
                continue
            safe_unconditional_negation = any(
                pattern.fullmatch(normalized)
                for pattern in _SAFE_UNCONDITIONAL_NEGATION_PATTERNS
            )
            if (
                not safe_unconditional_negation
                and any(
                    pattern.search(normalized)
                    for pattern in _UNCONDITIONAL_PROHIBITED_OUTPUT_PATTERNS
                )
            ):
                return True
            explicitly_safe = (
                len(_EXECUTION_ACTION_VERB.findall(normalized)) <= 1
                and any(pattern.fullmatch(normalized) for pattern in _SAFE_NEGATION_PATTERNS)
            )
            if (
                safe_unconditional_negation
                or explicitly_safe
                or _SAFE_EXECUTION_META_CLAUSE.fullmatch(normalized)
                or any(
                    pattern.fullmatch(normalized)
                    for pattern in _SAFE_RESEARCH_CONTEXT_PATTERNS
                )
            ):
                continue
            if _EXECUTION_ACTION_VERB.search(normalized):
                return True
            if any(pattern.search(normalized) for pattern in _PROHIBITED_OUTPUT_PATTERNS):
                return True
        return False
    if isinstance(value, Mapping):
        return any(contains_prohibited_output(item) for item in value.values())
    if isinstance(value, (list, tuple)):
        return any(contains_prohibited_output(item) for item in value)
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


def validated_provider_base_url(value: str) -> str | None:
    if "?" in value or "#" in value:
        return None
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
