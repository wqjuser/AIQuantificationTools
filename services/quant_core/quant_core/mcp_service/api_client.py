from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime, timedelta, timezone
import math
import re
from typing import Any
from urllib.parse import quote

import httpx

from quant_core.ai_review_runs import contains_secret_like_archive_text

from .config import McpServiceSettings


UTC = timezone.utc
_IDENTIFIER = re.compile(r"^[A-Za-z0-9_.:-]{1,200}$")
_MCP_SECRET_TEXT_PATTERN = re.compile(
    r"(?:^|[?&;\s])(?:access[_ -]?token|api[_ -]?key|authorization|client[_ -]?secret|"
    r"cookie|csrf(?:[_ -]?token)?|password|private[_ -]?key|refresh[_ -]?token|secret|token)"
    r"\s*[:=]\s*[^&;\s]+",
    re.IGNORECASE,
)
_RESEARCH_AUDIT_EVENT_TYPES = frozenset(
    {
        "ai_research_evidence",
        "ai_research_outcome",
        "market_ai_selection",
        "market_ai_selection_benchmark_snapshot",
        "market_ai_selection_review",
        "market_ai_selection_review_attempt",
        "strategy_research_launch",
        "strategy_research_proposal",
    }
)
_REDACTED_KEYS = frozenset(
    {
        "accountfingerprint",
        "apikey",
        "bars",
        "claimtoken",
        "cookie",
        "credentials",
        "csrf",
        "datasethash",
        "ownerid",
        "password",
        "researchnote",
        "secret",
        "testbars",
        "testhash",
        "token",
        "withheldbars",
    }
)


class QuantApiError(RuntimeError):
    def __init__(
        self,
        code: str,
        detail: str,
        *,
        status_code: int | None = None,
        retryable: bool = False,
    ) -> None:
        super().__init__(code)
        self.code = code
        self.detail = detail
        self.status_code = status_code
        self.retryable = retryable


class QuantApiClient:
    def __init__(
        self,
        settings: McpServiceSettings,
        *,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        headers = {"Accept": "application/json"}
        if settings.api_cookie:
            headers["Cookie"] = settings.api_cookie
        if settings.api_csrf_token:
            headers["X-AIQT-CSRF"] = settings.api_csrf_token
        if settings.api_origin:
            headers["Origin"] = settings.api_origin
        self._client = httpx.AsyncClient(
            base_url=settings.api_base_url,
            headers=headers,
            timeout=settings.request_timeout_seconds,
            follow_redirects=False,
            transport=transport,
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def get(self, path: str, *, params: Mapping[str, object] | None = None) -> dict[str, Any]:
        return await self._request("GET", path, params=params)

    async def post(self, path: str, payload: Mapping[str, object]) -> dict[str, Any]:
        return await self._request("POST", path, payload=payload)

    async def health(self) -> dict[str, Any]:
        return await self.get("/health")

    async def paper_status(self) -> dict[str, Any]:
        payload = await self.get("/api/execution/auto-paper-trading")
        return safe_paper_projection(payload)

    async def search_instruments(
        self,
        *,
        market: str,
        query: str,
        limit: int,
        timeframe: str,
    ) -> dict[str, Any]:
        return redact_for_research(
            await self.get(
                "/api/market/search",
                params={
                    "market": market,
                    "query": query,
                    "limit": limit,
                    "timeframe": timeframe,
                },
            )
        )

    async def market_context(
        self,
        *,
        market: str,
        symbol: str,
        timeframe: str,
        limit: int,
        end: str | None,
        include_calendar: bool,
    ) -> dict[str, Any]:
        shared: dict[str, object] = {
            "market": market,
            "symbol": symbol,
            "timeframe": timeframe,
        }
        kline_params = {**shared, "limit": limit}
        if end:
            kline_params["end"] = end
        quotes = await self.get(
            "/api/market/quotes",
            params={"market": market, "symbol": symbol},
        )
        klines = await self.get("/api/market/klines", params=kline_params)
        readiness = await self.get("/api/market/data-readiness", params=shared)
        payload: dict[str, Any] = {
            "quotes": quotes,
            "klines": klines,
            "readiness": readiness,
        }
        if include_calendar:
            payload["calendar"] = await self.get(
                "/api/market/calendar",
                params={"market": market},
            )
        return redact_for_research(payload, allow_bars=True)

    async def list_research_runs(self, *, limit: int) -> dict[str, Any]:
        return redact_for_research(
            await self.get("/api/research/runs", params={"limit": limit})
        )

    async def get_research_run(self, run_id: str) -> dict[str, Any]:
        return redact_for_research(
            await self.get(f"/api/research/runs/{_encoded_id(run_id)}")
        )

    async def strategy_research_capabilities(self) -> dict[str, Any]:
        return redact_for_research(
            await self.get("/api/strategy-research/capabilities")
        )

    async def create_registered_research(
        self,
        *,
        registered_template_id: str,
        end_exclusive: str | None,
    ) -> dict[str, Any]:
        capabilities = await self.strategy_research_capabilities()
        registered = capabilities.get("capabilities")
        if not isinstance(registered, list):
            raise QuantApiError(
                "strategy_research_capabilities_invalid",
                "Registered strategy capabilities are unavailable.",
            )
        capability = next(
            (
                item
                for item in registered
                if isinstance(item, Mapping)
                and item.get("templateId") == registered_template_id
            ),
            None,
        )
        if capability is None:
            raise QuantApiError(
                "strategy_research_template_unknown",
                "The registered strategy template was not found.",
            )
        sealed = capability.get("sealedData")
        if not isinstance(sealed, Mapping):
            raise QuantApiError(
                "strategy_research_capabilities_invalid",
                "The registered template has no sealed data contract.",
            )
        minimum_rows = _positive_int(sealed.get("minimumRows"))
        withheld_rows = _positive_int(sealed.get("withheldRows"))
        end = _minute_boundary(end_exclusive)
        start = end - timedelta(minutes=minimum_rows)
        development_end = end - timedelta(minutes=withheld_rows)
        payload = {
            "market": _required_string(capability.get("market"), "market"),
            "symbol": _required_string(capability.get("symbol"), "symbol"),
            "timeframe": _required_string(capability.get("timeframe"), "timeframe"),
            "registeredTemplateId": registered_template_id,
            "sealedDataset": {
                "start": start.isoformat(),
                "developmentEndExclusive": development_end.isoformat(),
                "endExclusive": end.isoformat(),
            },
        }
        return redact_for_research(await self.post("/api/p0/pipeline", payload))

    async def select_research_candidates(self, payload: Mapping[str, object]) -> dict[str, Any]:
        return redact_for_research(await self.post("/api/market/ai-selections", payload))

    async def propose_strategy_research(self, payload: Mapping[str, object]) -> dict[str, Any]:
        return redact_for_research(
            await self.post("/api/strategy-research/proposals", payload)
        )

    async def launch_strategy_research(self, payload: Mapping[str, object]) -> dict[str, Any]:
        return redact_for_research(
            await self.post("/api/strategy-research/launches", payload)
        )

    async def get_strategy_research(self, experiment_id: str) -> dict[str, Any]:
        return redact_for_research(
            await self.get(
                f"/api/strategy-research/experiments/{_encoded_id(experiment_id)}"
            )
        )

    async def create_ai_review(self, payload: Mapping[str, object]) -> dict[str, Any]:
        return redact_for_research(await self.post("/api/ai-reviews", payload))

    async def get_ai_review(self, review_id: str) -> dict[str, Any]:
        return redact_for_research(
            await self.get(f"/api/ai-reviews/{_encoded_id(review_id)}")
        )

    async def list_research_audit_events(
        self,
        *,
        event_type: str,
        run_id: str | None,
        limit: int,
        offset: int,
    ) -> dict[str, Any]:
        if event_type not in _RESEARCH_AUDIT_EVENT_TYPES:
            raise QuantApiError(
                "mcp_audit_event_type_forbidden",
                "Only research audit event types are available through MCP.",
            )
        params: dict[str, object] = {
            "eventType": event_type,
            "limit": limit,
            "offset": offset,
        }
        if run_id:
            _encoded_id(run_id)
            params["runId"] = run_id
        return redact_for_research(await self.get("/api/audit/events", params=params))

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: Mapping[str, object] | None = None,
        payload: Mapping[str, object] | None = None,
    ) -> dict[str, Any]:
        try:
            response = await self._client.request(
                method,
                path,
                params=params,
                json=payload,
            )
        except (httpx.TimeoutException, httpx.NetworkError) as error:
            raise QuantApiError(
                "quant_api_unavailable",
                "The Quant Core API is unavailable.",
                retryable=True,
            ) from error
        try:
            body = response.json()
        except ValueError as error:
            raise QuantApiError(
                "quant_api_response_invalid",
                "The Quant Core API returned an invalid response.",
                status_code=response.status_code,
            ) from error
        if not isinstance(body, dict):
            raise QuantApiError(
                "quant_api_response_invalid",
                "The Quant Core API returned an invalid response.",
                status_code=response.status_code,
            )
        if response.is_error:
            code = body.get("error")
            detail = body.get("detail")
            raise QuantApiError(
                str(code) if isinstance(code, str) and code else "quant_api_request_failed",
                _safe_detail(detail),
                status_code=response.status_code,
                retryable=response.status_code in {429, 502, 503, 504},
            )
        return body


def safe_paper_projection(payload: Mapping[str, Any]) -> dict[str, Any]:
    state = payload.get("state")
    binding = payload.get("strategyBinding")
    binding_trusted = binding is None or (
        isinstance(binding, Mapping)
        and binding.get("kind") in {"builtin", "forward_trial", "library"}
        and binding.get("paperOnly") is True
    )
    trusted = (
        isinstance(state, Mapping)
        and isinstance(state.get("enabled"), bool)
        and state.get("executionMode") == "paper"
        and payload.get("paperOnly") is True
        and payload.get("sandboxOnly") is False
        and payload.get("sandboxOrderSubmissionEnabled") is False
        and payload.get("sandboxRouteExecuted") is False
        and payload.get("liveTradingAllowed") is False
        and payload.get("orderSubmissionEnabled") is False
        and payload.get("routeExecuted") is False
        and payload.get("liveBlockedBoundary") is True
        and binding_trusted
    )
    if not trusted:
        return {
            "available": False,
            "status": "unavailable",
            "reason": "paper_runtime_boundary_untrusted",
        }
    safe_state = {
        key: state.get(key)
        for key in (
            "enabled",
            "status",
            "executionMode",
            "market",
            "symbol",
            "timeframe",
        )
    }
    safe_binding = None
    if isinstance(binding, Mapping):
        safe_binding = {
            key: binding.get(key)
            for key in ("kind", "revision", "status", "paperOnly")
        }
    return {
        "available": True,
        "state": safe_state,
        "strategyBinding": safe_binding,
        "boundary": {
            "paperOnly": True,
            "sandboxOrderSubmissionEnabled": False,
            "sandboxRouteExecuted": False,
            "liveTradingAllowed": False,
            "orderSubmissionEnabled": False,
            "routeExecuted": False,
            "liveBlockedBoundary": True,
        },
    }


def redact_for_research(value: Any, *, allow_bars: bool = False) -> Any:
    if isinstance(value, Mapping):
        return {
            str(key): redact_for_research(item, allow_bars=allow_bars)
            for key, item in value.items()
            if (
                not _redacted_key(key)
                or allow_bars and _normalized_key(key) == "bars"
            )
        }
    if isinstance(value, list):
        return [redact_for_research(item, allow_bars=allow_bars) for item in value]
    if isinstance(value, tuple):
        return [redact_for_research(item, allow_bars=allow_bars) for item in value]
    if isinstance(value, str):
        if (
            contains_secret_like_archive_text(value)
            or _MCP_SECRET_TEXT_PATTERN.search(value)
        ):
            return "[redacted]"
    return value


def _normalized_key(value: object) -> str:
    return re.sub(r"[^a-z0-9]", "", str(value).lower())


def _redacted_key(value: object) -> bool:
    normalized = _normalized_key(value)
    if normalized in _REDACTED_KEYS:
        return True
    if any(
        marker in normalized
        for marker in (
            "apikey",
            "authorization",
            "cookie",
            "credential",
            "csrf",
            "password",
            "privatekey",
            "secret",
            "token",
        )
    ):
        return True
    return normalized.endswith(
        (
            "apikey",
            "authorization",
            "cookie",
            "credential",
            "credentials",
            "password",
            "privatekey",
            "secret",
            "token",
        )
    )


def _encoded_id(value: object) -> str:
    if (
        not isinstance(value, str)
        or value in {".", ".."}
        or not _IDENTIFIER.fullmatch(value)
    ):
        raise QuantApiError("mcp_identifier_invalid", "The artifact identifier is invalid.")
    return quote(value, safe="")


def _required_string(value: object, field: str) -> str:
    if not isinstance(value, str) or not value.strip() or value.strip() != value:
        raise QuantApiError(
            "strategy_research_capabilities_invalid",
            f"The registered template {field} is invalid.",
        )
    return value


def _positive_int(value: object) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise QuantApiError(
            "strategy_research_capabilities_invalid",
            "The registered template row contract is invalid.",
        )
    return value


def _minute_boundary(value: str | None) -> datetime:
    if value is None:
        return datetime.now(UTC).replace(second=0, microsecond=0)
    if not isinstance(value, str) or not value.strip() or value.strip() != value:
        raise QuantApiError("mcp_end_exclusive_invalid", "end_exclusive is invalid.")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise QuantApiError("mcp_end_exclusive_invalid", "end_exclusive is invalid.") from error
    if parsed.tzinfo is None or parsed.second != 0 or parsed.microsecond != 0:
        raise QuantApiError(
            "mcp_end_exclusive_invalid",
            "end_exclusive must be an exact timezone-aware minute boundary.",
        )
    normalized = parsed.astimezone(UTC)
    if normalized > datetime.now(UTC).replace(second=0, microsecond=0):
        raise QuantApiError(
            "mcp_end_exclusive_in_future",
            "end_exclusive cannot be in the future.",
        )
    return normalized


def _safe_detail(_value: object) -> str:
    return "The Quant Core request was blocked."
