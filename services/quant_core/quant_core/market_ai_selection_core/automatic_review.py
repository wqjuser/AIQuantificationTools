from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime, timedelta
import time
from threading import Event, Thread
from typing import Any, Callable

from quant_core.canonical import (
    DATA_SNAPSHOT_HASH_VERSION,
    canonical_data_hash,
    canonical_sha256,
    normalize_snapshot_bars,
)
from quant_core.domain import DataQuality, MarketDataRequest, OHLCVBar
from quant_core.runs import ResearchRunAudit

from .audit_validation import (
    _market_ai_selection_benchmark_run_hash,
    _market_ai_selection_run_hash,
)
from .candidate_scoring import _completed_daily_bars
from .common import _as_utc
from .contracts import MarketAiSelectionError
from .research_value import BENCHMARK_POLICY_VERSION, BENCHMARK_SYMBOLS


class _AutomaticReviewMixin:
    def review_due_selections(
        self,
        *,
        lease_guard: Callable[[], bool] | None = None,
    ) -> dict[str, Any]:
        _require_lease(lease_guard)
        evaluated_at = _as_utc(self.clock())
        records = self._automatic_selection_events()
        reviews: list[dict[str, Any]] = []
        items: list[dict[str, Any]] = []
        benchmarks: dict[str, tuple[ResearchRunAudit | None, str | None]] = {}
        for record in reversed(records):
            _require_lease(lease_guard)
            artifact = record.metadata.get("artifact")
            selection_id = str(
                artifact.get("selectionId") if isinstance(artifact, Mapping) else ""
            ).strip()
            request = artifact.get("request") if isinstance(artifact, Mapping) else None
            market = str(request.get("market") if isinstance(request, Mapping) else "").strip()
            if not selection_id or market not in BENCHMARK_SYMBOLS:
                continue
            if market not in benchmarks:
                benchmarks[market] = self._fixed_benchmark_run(
                    market=market,
                    evaluated_at=evaluated_at,
                    lease_guard=lease_guard,
                )
            benchmark_run, reason = benchmarks[market]
            if benchmark_run is None:
                item = {
                    "selectionId": selection_id,
                    "status": "data_insufficient",
                    "reason": reason or "benchmark_bars_unavailable",
                }
                self._record_review_attempt(
                    item,
                    evaluated_at=evaluated_at,
                    lease_guard=lease_guard,
                )
                items.append(item)
                continue
            try:
                review = self._record_review(
                    selection_id,
                    benchmark_run=benchmark_run,
                    bound_runs=(),
                    require_research_binding=False,
                    evaluated_at=evaluated_at,
                    benchmark_policy_version=BENCHMARK_POLICY_VERSION,
                    lease_guard=lease_guard,
                )
            except MarketAiSelectionError as error:
                item = {
                    "selectionId": selection_id,
                    "status": "data_insufficient",
                    "reason": error.code,
                }
                self._record_review_attempt(
                    item,
                    evaluated_at=evaluated_at,
                    lease_guard=lease_guard,
                )
                items.append(item)
                continue
            reviews.append(review)
            items.append(
                {
                    "selectionId": selection_id,
                    "status": (
                        "observing"
                        if review["summary"]["observingCount"]
                        and not review["summary"]["maturedCount"]
                        else "data_insufficient"
                        if review["summary"]["dataInsufficientCount"]
                        and not review["summary"]["benchmarkSampleCount"]
                        else "reviewed"
                    ),
                    "reviewId": review["reviewId"],
                }
            )
        return {
            "schemaVersion": 1,
            "recordType": "aiqt.marketAiSelectionAutomaticReviewRun",
            "generatedAt": evaluated_at.isoformat(),
            "benchmarkPolicyVersion": BENCHMARK_POLICY_VERSION,
            "selectionCount": len(items),
            "reviewedCount": sum(item["status"] == "reviewed" for item in items),
            "observingCount": sum(item["status"] == "observing" for item in items),
            "dataInsufficientCount": sum(
                item["status"] == "data_insufficient" for item in items
            ),
            "items": items,
            "reviews": reviews,
            "boundary": {
                "researchOnly": True,
                "selectionCreated": False,
                "aiCalled": False,
                "researchStarted": False,
                "watchlistModified": False,
                "orderSubmissionAllowed": False,
                "routeExecuted": False,
            },
        }

    def _automatic_selection_events(self) -> list[Any]:
        records: list[Any] = []
        while True:
            page = self.audit_store.list_recent(
                event_type="market_ai_selection",
                run_id_is_null=True,
                limit=50,
                offset=len(records),
            )
            records.extend(page)
            if len(page) < 50:
                return records

    def _fixed_benchmark_run(
        self,
        *,
        market: str,
        evaluated_at: datetime,
        lease_guard: Callable[[], bool] | None = None,
    ) -> tuple[ResearchRunAudit | None, str | None]:
        if self.run_store is None:
            return None, "market_ai_selection_review_store_unavailable"
        symbol = BENCHMARK_SYMBOLS[market]
        try:
            bars, quality = self.review_kline_loader(
                MarketDataRequest(
                    market=market,
                    symbol=symbol,
                    timeframe="1d",
                    end=evaluated_at,
                ),
                500,
            )
        except Exception:
            return None, "benchmark_bars_unavailable"
        if not isinstance(quality, DataQuality) or not quality.is_complete:
            return None, "benchmark_bars_incomplete"
        if any(
            not isinstance(bar, OHLCVBar)
            or bar.market != market
            or bar.symbol != symbol
            or bar.timeframe != "1d"
            for bar in bars
        ):
            return None, "benchmark_bar_context_mismatch"
        completed = _completed_daily_bars(bars, cutoff=evaluated_at)
        if not completed:
            return None, "benchmark_same_period_coverage_missing"
        try:
            normalized = normalize_snapshot_bars(completed[-500:])
        except ValueError:
            return None, "review_bar_window_invalid"
        data_hash = canonical_data_hash(normalized)
        source = quality.origin_source or quality.source
        identity = {
            "benchmarkPolicyVersion": BENCHMARK_POLICY_VERSION,
            "market": market,
            "symbol": symbol,
            "timeframe": "1d",
            "dataHash": data_hash,
            "source": source,
            "adjustmentMode": quality.adjustment_mode,
        }
        run_id = f"market-ai-benchmark-{canonical_sha256(identity)[:32]}"
        created_at = _as_utc(completed[-1].timestamp) + timedelta(days=1)
        _require_lease(lease_guard)
        self.run_store.record(
            ResearchRunAudit(
                run_id=run_id,
                created_at=created_at,
                market=market,
                symbol=symbol,
                timeframe="1d",
                strategy_name="AI 选股固定基准",
                strategy_revision=BENCHMARK_POLICY_VERSION,
                data_rows=len(normalized),
                metrics={},
                decisions=[],
                execution_mode="research_only",
                data_quality={
                    "source": source,
                    "isComplete": True,
                    "warnings": list(quality.warnings),
                    "rows": len(normalized),
                    "adjustmentMode": quality.adjustment_mode,
                    "freshness": quality.freshness,
                },
                data_snapshot={
                    "source": source,
                    "isComplete": True,
                    "warnings": list(quality.warnings),
                    "rows": len(normalized),
                    "start": normalized[0]["timestamp"],
                    "end": normalized[-1]["timestamp"],
                    "hash": data_hash,
                    "hashVersion": DATA_SNAPSHOT_HASH_VERSION,
                    "bars": normalized,
                    "adjustmentMode": quality.adjustment_mode,
                },
            )
        )
        stored = self.run_store.get(run_id)
        if stored is None:
            return None, "market_ai_selection_review_store_unavailable"
        self._record_benchmark_attestation(
            stored,
            data_hash=data_hash,
            lease_guard=lease_guard,
        )
        return stored, None

    def _record_benchmark_attestation(
        self,
        run: ResearchRunAudit,
        *,
        data_hash: str,
        lease_guard: Callable[[], bool] | None = None,
    ) -> None:
        benchmark = {
            "benchmarkPolicyVersion": BENCHMARK_POLICY_VERSION,
            "auditHashVersion": "aiqt-market-benchmark-v2",
            "runId": run.run_id,
            "market": run.market,
            "symbol": run.symbol,
            "timeframe": run.timeframe,
            "auditHash": _market_ai_selection_benchmark_run_hash(run),
            "dataHash": data_hash,
        }
        event_id = benchmark_attestation_event_id(run.run_id)
        _require_lease(lease_guard)
        stored, _ = self.audit_store.record_if_absent(
            {
                "schemaVersion": 1,
                "eventId": event_id,
                "eventType": "market_ai_selection_benchmark_snapshot",
                "runId": None,
                "createdAt": run.created_at.isoformat(),
                "stage": "market_ai_selection_review",
                "source": "fixed-benchmark-policy",
                "summary": "AI 选股固定基准快照已锁定。",
                "detail": f"policy={BENCHMARK_POLICY_VERSION} researchOnly=true",
                "metadata": {"benchmark": benchmark},
            }
        )
        if (
            stored.event_id != event_id
            or stored.event_type != "market_ai_selection_benchmark_snapshot"
            or stored.run_id is not None
            or stored.stage != "market_ai_selection_review"
            or stored.source != "fixed-benchmark-policy"
            or not has_fixed_benchmark_attestation(
                self.audit_store,
                run,
                policy_version=BENCHMARK_POLICY_VERSION,
            )
        ):
            raise MarketAiSelectionError(
                "market_ai_selection_review_benchmark_audit_conflict",
                409,
                "固定基准审计记录与当前快照冲突。",
            )

    def _record_review_attempt(
        self,
        item: Mapping[str, Any],
        *,
        evaluated_at: datetime,
        lease_guard: Callable[[], bool] | None = None,
    ) -> None:
        identity = {
            "selectionId": item["selectionId"],
            "benchmarkPolicyVersion": BENCHMARK_POLICY_VERSION,
            "reason": item["reason"],
        }
        event_id = f"market-ai-selection-review-attempt-{canonical_sha256(identity)[:32]}"
        _require_lease(lease_guard)
        self.audit_store.record_if_absent(
            {
                "schemaVersion": 1,
                "eventId": event_id,
                "eventType": "market_ai_selection_review_attempt",
                "runId": None,
                "createdAt": evaluated_at.isoformat(),
                "stage": "market_ai_selection_review",
                "source": "fixed-benchmark-policy",
                "summary": "AI 选股到期复盘数据不足。",
                "detail": f"reason={item['reason']} researchOnly=true",
                "metadata": {"attempt": {**identity, "researchOnly": True}},
            }
        )


def benchmark_attestation_event_id(run_id: str) -> str:
    return f"market-ai-selection-benchmark-{run_id}"


def _require_lease(lease_guard: Callable[[], bool] | None) -> None:
    if lease_guard is not None and not lease_guard():
        raise RuntimeError("public_lease_lost")


def has_fixed_benchmark_attestation(
    audit_store: Any,
    run: ResearchRunAudit,
    *,
    policy_version: str = BENCHMARK_POLICY_VERSION,
) -> bool:
    record = audit_store.get(benchmark_attestation_event_id(run.run_id))
    benchmark = record.metadata.get("benchmark") if record is not None else None
    audit_hash_version = (
        benchmark.get("auditHashVersion") if isinstance(benchmark, Mapping) else None
    )
    expected_audit_hash = (
        _market_ai_selection_benchmark_run_hash(run)
        if audit_hash_version == "aiqt-market-benchmark-v2"
        else _market_ai_selection_run_hash(run)
        if audit_hash_version is None
        else ""
    )
    return bool(
        record is not None
        and record.event_type == "market_ai_selection_benchmark_snapshot"
        and record.run_id is None
        and record.stage == "market_ai_selection_review"
        and record.source == "fixed-benchmark-policy"
        and isinstance(benchmark, Mapping)
        and benchmark.get("benchmarkPolicyVersion") == policy_version
        and run.strategy_revision == policy_version
        and benchmark.get("runId") == run.run_id
        and benchmark.get("market") == run.market
        and benchmark.get("symbol") == run.symbol
        and benchmark.get("timeframe") == run.timeframe
        and benchmark.get("auditHash") == expected_audit_hash
        and benchmark.get("dataHash") == run.data_snapshot.get("hash")
    )


class MarketAiSelectionReviewRunner:
    def __init__(
        self,
        review_once: Callable[[], Any],
        *,
        interval_seconds: float = 21_600,
        acquire_lease: Callable[[], bool] | None = None,
    ) -> None:
        if interval_seconds <= 0:
            raise ValueError("market_ai_selection_review_interval_must_be_positive")
        self.review_once = review_once
        self.interval_seconds = interval_seconds
        self.acquire_lease = acquire_lease or (lambda: True)
        self._stopped = Event()
        self._thread: Thread | None = None

    @property
    def running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def start(self) -> None:
        if self.running:
            return
        self._stopped.clear()
        self._thread = Thread(
            target=self._run,
            name="market-ai-selection-review-runner",
            daemon=True,
        )
        self._thread.start()

    def stop(self, timeout: float = 5) -> None:
        self._stopped.set()
        thread = self._thread
        if thread is None:
            return
        thread.join(timeout=max(0, timeout))
        if not thread.is_alive():
            self._thread = None

    def _run(self) -> None:
        while not self._stopped.is_set():
            if self.acquire_lease():
                try:
                    self.review_once()
                except Exception:
                    pass
            finished_at = time.monotonic()
            while not self._stopped.is_set():
                remaining = self.interval_seconds - (time.monotonic() - finished_at)
                if remaining <= 0:
                    break
                self._stopped.wait(min(1.0, remaining))
