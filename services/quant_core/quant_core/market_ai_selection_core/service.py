from __future__ import annotations

import time
from collections.abc import Callable, Mapping
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Any

from quant_core.ai_review_providers import AiReviewProviderRegistry
from quant_core.audit_events import AuditEventStore
from quant_core.runs import ResearchRunStore

from .common import _default_fetch_json
from .automatic_review import _AutomaticReviewMixin
from .contracts import FundamentalLoader, JsonFetcher, KlineLoader, Monotonic, Sleeper, Clock
from .fundamental_service import _FundamentalMixin
from .generation_service import _GenerationMixin
from .review_service import _ReviewMixin
from .selection_service import _SelectionMixin
from .statistics_service import _QualityStatisticsMixin

class MarketAiSelectionService(
    _QualityStatisticsMixin,
    _AutomaticReviewMixin,
    _ReviewMixin,
    _SelectionMixin,
    _FundamentalMixin,
    _GenerationMixin,
):
    def __init__(
            self,
            *,
            discovery_service: Any,
            market_information_service: Any | None,
            kline_loader: KlineLoader,
            watchlist_store: Any,
            audit_store: AuditEventStore,
            provider_registry: AiReviewProviderRegistry,
            run_store: ResearchRunStore | None = None,
            review_kline_loader: KlineLoader | None = None,
            fundamental_loaders: Mapping[str, FundamentalLoader] | None = None,
            sec_user_agent: str = "",
            fetch_json: JsonFetcher | None = None,
            clock: Clock | None = None,
            monotonic: Monotonic | None = None,
            sleep: Sleeper | None = None,
        ) -> None:
            self.discovery_service = discovery_service
            self.market_information_service = market_information_service
            self.kline_loader = kline_loader
            self.watchlist_store = watchlist_store
            self.audit_store = audit_store
            self.provider_registry = provider_registry
            self.run_store = run_store
            self.review_kline_loader = review_kline_loader or kline_loader
            self.fundamental_loaders = dict(fundamental_loaders or {})
            self.sec_user_agent = sec_user_agent.strip()
            self.fetch_json = fetch_json or _default_fetch_json
            self._uses_default_fetch_json = fetch_json is None
            self.clock = clock or (lambda: datetime.now(timezone.utc))
            self.monotonic = monotonic or time.monotonic
            self.sleep = sleep or time.sleep
            self._cache: dict[str, tuple[datetime, Any]] = {}
            self._cache_lock = Lock()
            self._source_lock = Lock()
            self._runtime_lock = Lock()
            self._sec_request_lock = Lock()
            self._sec_last_request_at: float | None = None

    def update_runtime(
            self,
            *,
            provider_registry: AiReviewProviderRegistry,
            sec_user_agent: str,
        ) -> None:
            with self._runtime_lock:
                self.provider_registry = provider_registry
                self.sec_user_agent = sec_user_agent.strip()

    def _cache_get(
            self,
            key: str,
            *,
            ttl: timedelta,
            now: datetime,
        ) -> Any | None:
            with self._cache_lock:
                cached = self._cache.get(key)
                if (
                    cached is None
                    or now < cached[0]
                    or now - cached[0] >= ttl
                ):
                    return None
                return cached[1]

    def _cache_put(self, key: str, value: Any, *, now: datetime) -> None:
            with self._cache_lock:
                self._cache[key] = (now, value)

    def _read_json(
            self,
            url: str,
            headers: Mapping[str, str],
            *,
            deadline: float | None,
        ) -> Any:
            if deadline is None:
                return self.fetch_json(url, headers)
            remaining = deadline - self.monotonic()
            if remaining <= 0:
                raise TimeoutError("market_ai_selection_evidence_deadline_exceeded")
            if self._uses_default_fetch_json:
                return self.fetch_json(url, headers, min(10.0, remaining))
            return self.fetch_json(url, headers)

    def _read_sec_json(
            self,
            url: str,
            headers: Mapping[str, str],
            *,
            deadline: float,
        ) -> Any:
            with self._sec_request_lock:
                now = self.monotonic()
                if self._sec_last_request_at is not None:
                    delay = max(0.0, self._sec_last_request_at + 0.125 - now)
                    if delay > 0:
                        if now + delay >= deadline:
                            raise TimeoutError(
                                "market_ai_selection_evidence_deadline_exceeded"
                            )
                        self.sleep(delay)
                        now = self.monotonic()
                if now >= deadline:
                    raise TimeoutError(
                        "market_ai_selection_evidence_deadline_exceeded"
                    )
                self._sec_last_request_at = now
            return self._read_json(url, headers, deadline=deadline)

    def _shared_source(
            self,
            key: str,
            *,
            ttl: timedelta,
            now: datetime,
            loader: Callable[[], Any],
        ) -> Any:
            cached = self._cache_get(key, ttl=ttl, now=now)
            if cached is not None:
                return cached
            with self._source_lock:
                cached = self._cache_get(key, ttl=ttl, now=now)
                if cached is not None:
                    return cached
                value = loader()
                self._cache_put(key, value, now=now)
                return value
