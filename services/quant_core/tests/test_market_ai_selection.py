from __future__ import annotations

import json
import sqlite3
import unittest
from contextlib import contextmanager
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Lock
from typing import Iterator
from urllib.parse import parse_qs, urlparse

from quant_core import market_ai_selection as market_ai_selection_module
from quant_core.ai_review_providers import (
    AiReviewProviderRegistry,
    ProviderAttempt,
    ProviderStatus,
)
from quant_core.audit_events import AuditEventStore
from quant_core.canonical import canonical_sha256
from quant_core.domain import DataQuality, MarketDataRequest, OHLCVBar
from quant_core.market_ai_selection import (
    MarketAiSelectionError,
    MarketAiSelectionService,
    build_coingecko_binance_mapping,
    compare_stock_fundamental_sources,
    parse_ashare_financial_reports,
    parse_sec_companyfacts,
    resolve_market_ai_selection_research_evidence,
    validate_market_ai_selection_output,
    validate_market_ai_selection_request,
)
from quant_core.runs import (
    ResearchRunAudit,
    ResearchRunStore,
    research_run_import_audit_events,
)
from quant_core.terminal import Instrument


NOW = datetime(2026, 7, 31, 15, tzinfo=timezone.utc)


class _Caught:
    value: BaseException


@contextmanager
def _raises(expected: type[BaseException]) -> Iterator[_Caught]:
    caught = _Caught()
    try:
        yield caught
    except expected as error:
        caught.value = error
    else:
        raise AssertionError(f"{expected.__name__} was not raised")


def _request(**overrides: object) -> dict[str, object]:
    value: dict[str, object] = {
        "market": "ashare",
        "universeMode": "discovery",
        "discovery": {},
        "profile": "balanced",
        "horizon": "medium",
        "providerId": "local",
        "externalDataApproved": False,
    }
    value.update(overrides)
    return value


def _rows(
    count: int = 25,
    *,
    market: str = "ashare",
) -> list[dict[str, object]]:
    return [
        {
            "market": market,
            "symbol": (
                f"{600000 + index}"
                if market == "ashare"
                else f"C{index:02d}/USDT"
            ),
            "name": f"候选{index}",
            "price": 10 + index,
            "changePct": index / 10,
            "volume": 10_000 + index,
            "amount": 1_000_000 - index,
            "turnoverRate": 2.0,
            "peRatio": 10.0 + index / 10,
            "pbRatio": 2.0,
            "marketCap": 1_000_000_000 + index,
            "source": "test-market",
            "observedAt": NOW.isoformat(),
        }
        for index in range(count)
    ]


def _bars(
    symbol: str,
    market: str,
    *,
    count: int = 185,
    last_at: datetime | None = None,
) -> list[OHLCVBar]:
    ending = last_at or (NOW - timedelta(days=2))
    start = ending - timedelta(days=count - 1)
    return [
        OHLCVBar(
            symbol=symbol,
            market=market,  # type: ignore[arg-type]
            timeframe="1d",
            timestamp=start + timedelta(days=index),
            open=100 + index * 0.1,
            high=101 + index * 0.1,
            low=99 + index * 0.1,
            close=100.5 + index * 0.1,
            volume=1_000 + index,
        )
        for index in range(count)
    ]


def _stock_fundamental(
    candidate: object,
    cutoff: datetime,
) -> dict[str, object]:
    return {
        "currentRevenue": 120.0,
        "previousRevenue": 100.0,
        "currentNetProfit": 12.0,
        "previousNetProfit": 10.0,
        "totalAssets": 300.0,
        "shareholdersEquity": 150.0,
        "currentPeriod": "2026-03-31T00:00:00+00:00",
        "previousPeriod": "2025-03-31T00:00:00+00:00",
        "disclosedAt": "2026-04-30T00:00:00+00:00",
        "source": "test-fundamental",
        "sourceVerification": {
            "status": "verified",
            "sources": ["source-a", "source-b"],
        },
        "conflict": False,
    }


class _Discovery:
    def __init__(
        self,
        rows: list[dict[str, object]],
        *,
        error: Exception | None = None,
        observed_at: object = NOW,
        snapshot_hash: str | None = None,
    ) -> None:
        self.rows = rows
        self.error = error
        self.observed_at = observed_at
        self.snapshot_hash = snapshot_hash
        self.queries: list[object] = []

    def discover(self, query: object) -> dict[str, object]:
        self.queries.append(query)
        if self.error is not None:
            raise self.error
        market = getattr(query, "market")
        return {
            "market": market,
            "items": self.rows,
            "overview": {
                "universeCount": len(self.rows),
                "advancing": len(self.rows),
                "declining": 0,
                "flat": 0,
                "totalAmount": sum(float(item["amount"]) for item in self.rows),
            },
            "source": "test-market",
            "observedAt": (
                self.observed_at.isoformat()
                if isinstance(self.observed_at, datetime)
                else self.observed_at
            ),
            "freshness": "fresh",
            "warnings": [],
            "snapshotHash": self.snapshot_hash or f"snapshot-{market}",
        }


class _News:
    def __init__(self) -> None:
        self.calls: list[object] = []

    def read(self, query: object) -> dict[str, object]:
        self.calls.append(query)
        return {
            "news": [],
            "warnings": [],
            "freshness": "fresh",
        }


class _RichNews(_News):
    def __init__(
        self,
        headline_suffix: str = "",
        summary: str = "仅用于研究证据核验。",
        warnings: list[str] | None = None,
    ) -> None:
        super().__init__()
        self.headline_suffix = headline_suffix
        self.summary = summary
        self.warnings = list(warnings or [])

    def read(self, query: object) -> dict[str, object]:
        self.calls.append(query)
        scope = getattr(query, "scope")
        symbol = getattr(query, "symbol")
        return {
            "news": [
                {
                    "id": f"{scope}-{symbol or 'market'}",
                    "headline": (
                        "权威市场环境更新"
                        if scope == "market"
                        else f"{symbol} 公司资讯"
                    )
                    + self.headline_suffix,
                    "summary": self.summary,
                    "publishedAt": "2026-07-30T00:00:00+00:00",
                    "source": "test-news",
                    "scope": scope,
                }
            ],
            "warnings": list(self.warnings),
            "freshness": "fresh",
        }


class _BlockingNews(_News):
    def read(self, query: object) -> dict[str, object]:
        self.calls.append(query)
        __import__("time").sleep(0.2)
        return {"news": [], "warnings": [], "freshness": "fresh"}


class _NoWatchlist:
    def list_instruments(self) -> list[Instrument]:
        raise AssertionError("watchlist_must_not_be_read")


class _Watchlist:
    def __init__(self, instruments: list[Instrument]) -> None:
        self.instruments = instruments

    def list_instruments(self) -> list[Instrument]:
        return list(self.instruments)


class _Provider:
    endpoint = "https://provider.test/v1"

    def __init__(self, *, invalid: bool = False) -> None:
        self.invalid = invalid
        self.calls = 0
        self.last_prompt: dict[str, object] | None = None

    def assess(self, **kwargs: object) -> ProviderAttempt:
        self.calls += 1
        prompt = json.loads(str(kwargs["rendered_prompt"]))
        self.last_prompt = prompt
        candidates = prompt["untrustedInput"]["candidates"]
        candidate = candidates[5]
        selection: dict[str, object] = {
            "evidenceId": candidate["evidenceId"],
            "rank": 1,
            "tier": "priority_research",
            "reasons": ["确定性证据完整，适合优先研究。"],
            "risks": ["历史波动风险仍需继续核验。"],
            "evidenceReferences": [candidate["evidenceId"]],
            "summary": "建议优先进入研究链并核验全部证据。",
        }
        if self.invalid:
            selection["targetPrice"] = 123
        assessment = {"selections": [selection]}
        validator = kwargs["response_validator"]
        normalized = validator(assessment, kwargs["known_evidence_ids"])
        return ProviderAttempt(
            provider_id="openai-compatible",
            model="test-model",
            sanitized_base_url="https://provider.test/v1",
            assessment=normalized,
            usage={"inputTokens": 10, "outputTokens": 5, "totalTokens": 15},
            latency_ms=12,
        )


def _registry(provider: _Provider | None = None) -> AiReviewProviderRegistry:
    return AiReviewProviderRegistry(
        (
            ProviderStatus("local", True, None, None),
            ProviderStatus(
                "openai-compatible",
                provider is not None,
                "test-model" if provider is not None else None,
                "https://provider.test/v1" if provider is not None else None,
            ),
        ),
        {"openai-compatible": provider} if provider is not None else {},
    )


def _service(
    tmp_path: object,
    *,
    discovery: _Discovery | None = None,
    news: object | None = None,
    watchlist: object | None = None,
    provider: _Provider | None = None,
    fundamental_loaders: dict[str, object] | None = None,
    kline_loader: object | None = None,
    sec_user_agent: str = "",
    fetch_json: object | None = None,
    monotonic: object | None = None,
    now: datetime = NOW,
    clock: object | None = None,
    run_store: ResearchRunStore | None = None,
    sleep: object | None = None,
) -> MarketAiSelectionService:
    def default_klines(request: object, limit: int) -> tuple[list[OHLCVBar], DataQuality]:
        market = getattr(request, "market")
        symbol = getattr(request, "symbol")
        bars = _bars(symbol, market)
        return bars, DataQuality(
            source="test-bars",
            is_complete=True,
            rows=len(bars),
            freshness="fresh",
        )

    return MarketAiSelectionService(
        discovery_service=discovery or _Discovery(_rows()),
        market_information_service=news if news is not None else _News(),
        kline_loader=kline_loader or default_klines,  # type: ignore[arg-type]
        watchlist_store=watchlist or _NoWatchlist(),
        audit_store=AuditEventStore(tmp_path / "audit.db"),  # type: ignore[operator]
        provider_registry=_registry(provider),
        fundamental_loaders=(
            fundamental_loaders  # type: ignore[arg-type]
            if fundamental_loaders is not None
            else {"ashare": _stock_fundamental}
        ),
        sec_user_agent=sec_user_agent,
        fetch_json=fetch_json,  # type: ignore[arg-type]
        clock=clock or (lambda: now),  # type: ignore[arg-type]
        monotonic=monotonic,  # type: ignore[arg-type]
        run_store=run_store,
        sleep=sleep,  # type: ignore[arg-type]
    )


def _record_review_run(
    store: ResearchRunStore,
    *,
    run_id: str,
    symbol: str,
    selection_evidence: dict[str, object] | None = None,
) -> None:
    bars = _bars(symbol, "ashare", count=5)
    store.record(
        ResearchRunAudit(
            run_id=run_id,
            created_at=NOW,
            market="ashare",
            symbol=symbol,
            timeframe="1d",
            strategy_name="SMA",
            strategy_revision="r1",
            data_rows=len(bars),
            metrics={},
            decisions=[],
            execution_mode="paper_only",
            data_quality={
                "source": "test-bars",
                "isComplete": True,
                "warnings": [],
                "rows": len(bars),
            },
            data_snapshot={
                "source": "test-bars",
                "isComplete": True,
                "warnings": [],
                "rows": len(bars),
                "start": bars[0].timestamp.isoformat(),
                "end": bars[-1].timestamp.isoformat(),
                "bars": [bar.to_record() for bar in bars],
                **(
                    {"marketAiSelectionEvidence": selection_evidence}
                    if selection_evidence is not None
                    else {}
                ),
            },
        )
    )


def _review_bar(
    symbol: str,
    timestamp: datetime,
    close: float,
) -> OHLCVBar:
    return OHLCVBar(
        symbol=symbol,
        market="ashare",
        timeframe="1d",
        timestamp=timestamp,
        open=close,
        high=close,
        low=close,
        close=close,
        volume=1_000,
    )


def test_request_is_strict_and_rejects_browser_candidates() -> None:
    request = validate_market_ai_selection_request(_request())
    assert request["discovery"]["sort"] == "changePct"
    with _raises(MarketAiSelectionError) as caught:
        validate_market_ai_selection_request(
            _request(discovery={"items": [{"symbol": "600000"}]})
        )
    assert caught.value.status == 400
    with _raises(MarketAiSelectionError):
        validate_market_ai_selection_request(
            _request(
                market="crypto",
                profile="value",
            )
        )
    with _raises(MarketAiSelectionError):
        validate_market_ai_selection_request(
            _request(
                providerId="openai-compatible",
                externalDataApproved=False,
            )
        )


def test_all_profiles_and_winsorized_scores_stay_in_zero_to_one_hundred() -> None:
    factors = {
        "return20Pct": 5.0,
        "return60Pct": 10.0,
        "volatility20Pct": 20.0,
        "sma20GapPct": 2.0,
        "sma60GapPct": 3.0,
        "rsi14": 55.0,
        "maxDrawdown60Pct": 8.0,
    }
    stock_candidates = [
        {
            "symbol": f"{600000 + index}",
            "fundamental": {
                "currentRevenue": 120.0 + index,
                "previousRevenue": 100.0,
                "currentNetProfit": 12.0 + index,
                "previousNetProfit": 10.0,
                "shareholdersEquity": 150.0,
                "valuation": {
                    "peRatio": 10.0 + index,
                    "pbRatio": 2.0 + index / 10,
                    "psRatio": 3.0 + index / 10,
                },
            },
            "factors": {**factors, "return20Pct": 5.0 + index},
            "snapshot": {"amount": 1_000_000.0 + index},
        }
        for index in range(6)
    ]
    for profile in ("balanced", "quality_growth", "value", "trend"):
        scored = market_ai_selection_module._score_candidates(
            stock_candidates,
            market="ashare",
            profile=profile,
        )
        assert len(scored) == 6
        assert all(0 <= item["score"] <= 100 for item in scored)
        assert all(
            0 <= score <= 100
            for item in scored
            for score in item["pillarScores"].values()
        )

    crypto_candidates = [
        {
            "symbol": f"C{index}/USDT",
            "fundamental": {
                "marketCap": 1_000_000.0 + index * 100_000,
                "circulatingSupply": 80_000.0,
                "totalSupply": 100_000.0,
                "maxSupply": 100_000.0,
                "fullyDilutedValuation": 1_200_000.0,
                "binanceQuoteVolume": 500_000.0 + index,
                "bidAskSpreadPct": 0.1 + index / 100,
            },
            "factors": {**factors, "return60Pct": 10.0 + index},
            "snapshot": {"amount": 500_000.0 + index},
        }
        for index in range(6)
    ]
    for profile in ("balanced", "trend"):
        scored = market_ai_selection_module._score_candidates(
            crypto_candidates,
            market="crypto",
            profile=profile,
        )
        assert len(scored) == 6
        assert all(0 <= item["score"] <= 100 for item in scored)
        assert all(
            0 <= score <= 100
            for item in scored
            for score in item["pillarScores"].values()
        )

    winsorized = market_ai_selection_module._winsorized_scores(
        [0.0, 1.0, 2.0, 3.0, 1_000.0]
    )
    assert winsorized[0] == 0.0
    assert winsorized[-1] == 100.0
    assert all(0 <= item <= 100 for item in winsorized)


def test_local_selection_uses_backend_100_to_20_to_5_and_audits(tmp_path: object) -> None:
    discovery = _Discovery(_rows())
    service = _service(tmp_path, discovery=discovery)

    result = service.select(_request())

    assert getattr(discovery.queries[0], "limit") == 100
    assert result["status"] == "completed"
    assert len(result["baselineCandidates"]) == 20
    assert len(result["recommendations"]) == 5
    assert len(result["exclusions"]) == 5
    assert set(result["exclusions"][0]) == {"market", "symbol", "name", "reason"}
    assert set(result["generation"]) == {
        "requestedProvider",
        "usedProvider",
        "status",
        "fallbackUsed",
        "model",
        "sanitizedBaseUrl",
        "latencyMs",
        "externalDataApproved",
        "outboundFields",
        "errorCode",
    }
    assert result["generation"]["status"] == "skipped"
    assert result["boundary"] == {
        "researchOnly": True,
        "watchlistModified": False,
        "researchStarted": False,
        "riskModified": False,
        "autoTradingModified": False,
        "orderSubmissionAllowed": False,
        "routeExecuted": False,
    }
    event = service.audit_store.get(result["auditEventId"])
    assert event is not None
    artifact = event.metadata["artifact"]
    assert artifact["recordType"] == "aiqt.marketAiSelection"
    assert artifact["recordHash"]
    assert len(artifact["evidenceCandidates"][0]["dailyBars"]) == 180


def test_quality_statistics_replay_audited_selection_metrics_and_samples(
    tmp_path: object,
) -> None:
    successful_provider = _Provider()
    failed_provider = _Provider(invalid=True)
    service = _service(tmp_path)
    balanced = service.select(_request(profile="balanced"))

    service.update_runtime(
        provider_registry=_registry(successful_provider),
        sec_user_agent="",
    )
    service.select(
        _request(
            profile="trend",
            providerId="openai-compatible",
            externalDataApproved=True,
        )
    )
    service.update_runtime(
        provider_registry=_registry(failed_provider),
        sec_user_agent="",
    )
    service.select(
        _request(
            profile="value",
            providerId="openai-compatible",
            externalDataApproved=True,
        )
    )

    def degraded_fundamental(
        candidate: object,
        cutoff: datetime,
    ) -> dict[str, object]:
        value = _stock_fundamental(candidate, cutoff)
        value["sourceVerification"] = {
            "status": "not_available",
            "sources": ["source-a"],
        }
        return value

    degraded_service = _service(
        tmp_path,
        fundamental_loaders={"ashare": degraded_fundamental},
    )
    degraded_service.select(_request(profile="quality_growth"))

    original_weights_version = market_ai_selection_module._WEIGHTS_VERSION  # noqa: SLF001
    market_ai_selection_module._WEIGHTS_VERSION = "market-ai-selection-v2"  # noqa: SLF001
    try:
        statistics = degraded_service.quality_statistics()
    finally:
        market_ai_selection_module._WEIGHTS_VERSION = original_weights_version  # noqa: SLF001

    assert statistics == {
        "schemaVersion": 1,
        "recordType": "aiqt.marketAiSelectionQualityStatistics",
        "generatedAt": NOW.isoformat(),
        "selectionCount": 4,
        "candidateQualification": {
            "qualifiedCount": 80,
            "sampleCount": 100,
            "ratePct": 80.0,
        },
        "majorExclusions": {
            "excludedCount": 20,
            "reasons": [
                {
                    "reason": balanced["exclusions"][0]["reason"],
                    "count": 20,
                    "ratePct": 100.0,
                }
            ],
        },
        "dataSourceDegradation": {
            "degradedCount": 1,
            "sampleCount": 4,
            "ratePct": 25.0,
        },
        "aiSuccess": {
            "successCount": 1,
            "sampleCount": 2,
            "ratePct": 50.0,
        },
        "stylePerformance": [
            {
                "profile": profile,
                "selectionCount": 1,
                "reviewedSelectionCount": 0,
                "absoluteHitCount": 0,
                "absoluteSampleCount": 0,
                "absoluteHitRatePct": None,
                "benchmarkHitCount": 0,
                "benchmarkSampleCount": 0,
                "benchmarkHitRatePct": None,
            }
            for profile in ("balanced", "quality_growth", "value", "trend")
        ],
        "boundary": {
            "researchOnly": True,
            "watchlistModified": False,
            "researchStarted": False,
            "riskModified": False,
            "autoTradingModified": False,
            "orderSubmissionAllowed": False,
            "routeExecuted": False,
        },
    }


def test_quality_statistics_reject_cross_context_audit_tampering(
    tmp_path: object,
) -> None:
    service = _service(
        tmp_path,
        discovery=_Discovery(_rows(), snapshot_hash="a" * 64),
    )
    selection = service.select(_request(profile="balanced"))
    event = service.audit_store.get(selection["auditEventId"])
    assert event is not None
    original = event.metadata["artifact"]
    for tampering in ("profile", "initial_partition", "extra_exclusion"):
        artifact = json.loads(json.dumps(original))
        if tampering == "profile":
            artifact["request"]["profile"] = "trend"
        elif tampering == "initial_partition":
            artifact["initialCandidates"] = artifact["initialCandidates"][1:]
        else:
            extra = {
                "market": "ashare",
                "symbol": "FAKE",
                "name": "伪造候选",
                "reason": "伪造排除原因。",
            }
            artifact["exclusions"].append(extra)
            artifact["result"]["exclusions"].append(extra)
        artifact["recordHash"] = canonical_sha256(
            {key: value for key, value in artifact.items() if key != "recordHash"}
        )
        connection = sqlite3.connect(tmp_path / "audit.db")  # type: ignore[operator]
        try:
            connection.execute(
                "update audit_events set metadata_json = ? where event_id = ?",
                (json.dumps({"artifact": artifact}), selection["auditEventId"]),
            )
            connection.commit()
        finally:
            connection.close()

        with _raises(MarketAiSelectionError) as caught:
            service.quality_statistics()

        assert caught.value.status == 409
        assert caught.value.code == "market_ai_selection_statistics_audit_invalid"


def test_selection_identity_is_recomputed_during_protected_replay(
    tmp_path: object,
) -> None:
    service = _service(tmp_path)
    result = service.select(_request())
    event = service.audit_store.get(result["auditEventId"])
    assert event is not None
    artifact = json.loads(json.dumps(event.metadata["artifact"]))
    candidate = artifact["evidenceCandidates"][0]
    candidate["dailyBars"][-1]["close"] = 999
    candidate["evidenceHash"] = canonical_sha256(
        {
            "candidate": candidate["snapshot"],
            "dailyBars": candidate["dailyBars"],
            "factors": candidate["factors"],
            "fundamental": candidate["fundamental"],
        }
    )
    forged_id = f"selection-v{artifact['schemaVersion']}-{'0' * 20}"
    assert forged_id != result["selectionId"]
    forged_event_id = f"market-ai-selection-{forged_id}"
    artifact["selectionId"] = forged_id
    artifact["result"]["selectionId"] = forged_id
    artifact["result"]["auditEventId"] = forged_event_id
    artifact["recordHash"] = canonical_sha256(
        {key: value for key, value in artifact.items() if key != "recordHash"}
    )
    connection = sqlite3.connect(tmp_path / "audit.db")  # type: ignore[operator]
    try:
        connection.execute(
            "update audit_events set event_id = ?, metadata_json = ? where event_id = ?",
            (
                forged_event_id,
                json.dumps({"artifact": artifact}),
                result["auditEventId"],
            ),
        )
        connection.commit()
    finally:
        connection.close()

    with _raises(MarketAiSelectionError) as caught:
        service.quality_statistics()
    assert caught.value.code == "market_ai_selection_statistics_audit_invalid"
    with _raises(ValueError):
        resolve_market_ai_selection_research_evidence(
            {
                "selectionId": forged_id,
                "candidateEvidenceId": candidate["evidenceId"],
            },
            audit_store=service.audit_store,
            market="ashare",
            symbol=candidate["symbol"],
            timeframe="1d",
        )


def test_real_http_handler_is_idempotent_and_rejects_browser_candidates(
    tmp_path: object,
) -> None:
    from http.client import HTTPConnection
    from http.server import HTTPServer
    from threading import Thread

    from quant_core.api import QuantApiHandler

    service = _service(tmp_path)
    registry = _registry()

    class TestHandler(QuantApiHandler):
        market_ai_selection_service = service

        def _effective_platform_settings_environment(self) -> dict[str, str]:
            return {}

        def _current_ai_review_provider_registry(self) -> AiReviewProviderRegistry:
            return registry

        def log_message(self, format: str, *args: object) -> None:
            return

    server = HTTPServer(("127.0.0.1", 0), TestHandler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    connection = HTTPConnection(
        server.server_address[0],
        server.server_address[1],
        timeout=5,
    )

    def post(body: dict[str, object]) -> tuple[int, dict[str, object]]:
        raw = json.dumps(body).encode("utf-8")
        connection.request(
            "POST",
            "/api/market/ai-selections",
            body=raw,
            headers={
                "Content-Type": "application/json",
                "Content-Length": str(len(raw)),
            },
        )
        response = connection.getresponse()
        return response.status, json.loads(response.read().decode("utf-8"))

    def get_statistics(path: str = "/api/market/ai-selection-statistics") -> tuple[int, dict[str, object]]:
        connection.request("GET", path)
        response = connection.getresponse()
        return response.status, json.loads(response.read().decode("utf-8"))

    try:
        first_status, first = post(_request())
        second_status, second = post(_request())
        invalid_status, invalid = post(
            _request(discovery={"items": [{"symbol": "browser-row"}]})
        )
        statistics_status, statistics_payload = get_statistics()
        invalid_statistics_query = get_statistics(
            "/api/market/ai-selection-statistics?returnPct=999"
        )
    finally:
        connection.close()
        server.shutdown()
        thread.join(timeout=5)
        server.server_close()

    assert first_status == second_status == 201
    assert first["selectionId"] == second["selectionId"]
    assert first["auditEventId"] == second["auditEventId"]
    assert first["boundary"]["watchlistModified"] is False
    assert first["boundary"]["researchStarted"] is False
    assert first["boundary"]["riskModified"] is False
    assert first["boundary"]["autoTradingModified"] is False
    assert first["boundary"]["orderSubmissionAllowed"] is False
    assert first["boundary"]["routeExecuted"] is False
    assert service.audit_store.count(event_type="market_ai_selection") == 1
    assert invalid_status == 400
    assert invalid["error"] == "invalid_market_ai_selection_discovery"
    assert statistics_status == 200
    assert set(statistics_payload) == {"statistics"}
    statistics = statistics_payload["statistics"]
    assert statistics["selectionCount"] == 1
    assert statistics["candidateQualification"] == {
        "qualifiedCount": 20,
        "sampleCount": 25,
        "ratePct": 80.0,
    }
    assert statistics["boundary"]["orderSubmissionAllowed"] is False
    assert invalid_statistics_query == (
        400,
        {
            "error": "invalid_market_ai_selection_statistics_query",
            "detail": "AI 选股质量统计不接受浏览器提供的统计事实。",
        },
    )


def test_external_ai_can_choose_candidate_six_and_is_idempotent(tmp_path: object) -> None:
    provider = _Provider()
    service = _service(tmp_path, provider=provider, news=_RichNews())
    request = _request(
        providerId="openai-compatible",
        externalDataApproved=True,
    )

    first = service.select(request)
    second = service.select(request)

    assert first == second
    assert provider.calls == 1
    assert first["generation"]["status"] == "completed"
    assert first["generation"]["usedProvider"] == "openai-compatible"
    recommendation = first["recommendations"][0]
    assert recommendation["evidenceId"] == first["baselineCandidates"][5]["evidenceId"]
    assert provider.last_prompt is not None
    outbound = provider.last_prompt["untrustedInput"]
    assert outbound["marketContext"]["overview"]["universeCount"] == 25
    assert outbound["marketContext"]["snapshotIdentity"]["snapshotHash"] == "snapshot-ashare"
    assert len(outbound["candidateNews"]) == 10
    assert all(item["items"] for item in outbound["candidateNews"])
    assert outbound["candidateNews"][0]["items"][0]["headline"]
    assert outbound["candidateNews"][0]["items"][0]["summary"] == "仅用于研究证据核验。"
    assert first["baselineCandidates"][10]["evidenceId"] not in {
        item["candidateEvidenceId"] for item in outbound["candidateNews"]
    }
    assert "市场环境" in first["generation"]["outboundFields"]
    assert "个股新闻" in first["generation"]["outboundFields"]


def test_invalid_ai_output_falls_back_without_claiming_ai_success(tmp_path: object) -> None:
    provider = _Provider(invalid=True)
    service = _service(tmp_path, provider=provider)

    result = service.select(
        _request(
            providerId="openai-compatible",
            externalDataApproved=True,
        )
    )

    assert result["status"] == "partial"
    assert result["generation"]["status"] == "failed"
    assert result["generation"]["usedProvider"] == "local"
    assert result["generation"]["fallbackUsed"] is True
    assert result["generation"]["errorCode"] == "market_ai_selection_provider_failed"
    assert result["recommendations"][0]["evidenceId"] == result["baselineCandidates"][0]["evidenceId"]


def test_provider_runtime_change_invalidates_old_fallback_identity(tmp_path: object) -> None:
    service = _service(tmp_path)
    request = _request(
        providerId="openai-compatible",
        externalDataApproved=True,
    )
    first = service.select(request)
    assert first["generation"]["status"] == "failed"

    provider = _Provider()
    service.update_runtime(
        provider_registry=_registry(provider),
        sec_user_agent="",
    )
    second = service.select(request)
    assert second["selectionId"] != first["selectionId"]
    assert second["generation"]["status"] == "completed"
    assert provider.calls == 1


def test_token_unlock_news_is_not_misclassified_as_a_secret(tmp_path: object) -> None:
    provider = _Provider()
    service = _service(
        tmp_path,
        provider=provider,
        news=_RichNews(summary="关注 token unlock schedule 对流通量的影响。"),
    )
    result = service.select(
        _request(
            providerId="openai-compatible",
            externalDataApproved=True,
        )
    )
    assert provider.calls == 1
    assert result["generation"]["status"] == "completed"


def test_actual_api_key_text_blocks_external_provider_call(tmp_path: object) -> None:
    provider = _Provider()
    service = _service(
        tmp_path,
        provider=provider,
        news=_RichNews(summary="api_key=top-secret-value"),
    )
    result = service.select(
        _request(
            providerId="openai-compatible",
            externalDataApproved=True,
        )
    )
    assert provider.calls == 0
    assert result["generation"]["status"] == "failed"
    assert result["generation"]["fallbackUsed"] is True


def test_no_eligible_candidate_returns_409_before_provider(tmp_path: object) -> None:
    provider = _Provider()
    service = _service(
        tmp_path,
        provider=provider,
        fundamental_loaders={"ashare": lambda candidate, cutoff: None},
    )
    with _raises(MarketAiSelectionError) as caught:
        service.select(
            _request(
                providerId="openai-compatible",
                externalDataApproved=True,
            )
        )
    assert caught.value.status == 409
    assert provider.calls == 0


def test_uncompleted_daily_bar_cannot_change_selection(tmp_path: object) -> None:
    def incomplete_klines(
        request: object,
        limit: int,
    ) -> tuple[list[OHLCVBar], DataQuality]:
        bars = _bars(
            getattr(request, "symbol"),
            getattr(request, "market"),
            count=180,
            last_at=NOW,
        )
        return bars, DataQuality(source="test", is_complete=True, rows=180)

    service = _service(tmp_path, kline_loader=incomplete_klines)
    with _raises(MarketAiSelectionError) as caught:
        service.select(_request())
    assert caught.value.status == 409
    assert "日 K 线" in caught.value.detail


def test_discovery_failure_is_normalized_to_502(tmp_path: object) -> None:
    service = _service(
        tmp_path,
        discovery=_Discovery([], error=RuntimeError("upstream secret detail")),
    )
    with _raises(MarketAiSelectionError) as caught:
        service.select(_request())
    assert caught.value.status == 502
    assert caught.value.code == "market_ai_selection_snapshot_unavailable"
    assert "secret" not in caught.value.detail


def test_discovery_requires_real_non_future_observed_at(tmp_path: object) -> None:
    for observed_at, expected_text in (
        (None, "缺少"),
        (NOW + timedelta(minutes=1), "晚于"),
    ):
        service = _service(
            tmp_path,
            discovery=_Discovery(_rows(), observed_at=observed_at),
        )
        with _raises(MarketAiSelectionError) as caught:
            service.select(_request())
        assert caught.value.status == 409
        assert caught.value.code == "market_ai_selection_snapshot_timestamp_invalid"
        assert expected_text in caught.value.detail

    moments = iter((NOW, NOW + timedelta(seconds=30), NOW + timedelta(seconds=30)))
    service = _service(
        tmp_path,
        discovery=_Discovery(
            _rows(),
            observed_at=NOW + timedelta(seconds=15),
        ),
        clock=lambda: next(moments),
    )
    result = service.select(_request())
    assert result["generatedAt"] == (NOW + timedelta(seconds=30)).isoformat()


def test_invalid_sec_user_agent_is_a_deterministic_exclusion(tmp_path: object) -> None:
    watchlist = _Watchlist(
        [
            Instrument(
                symbol="AAPL",
                name="Apple",
                market="us",
                change_pct=1.0,
                price=200.0,
                quote_source="finnhub",
                quote_as_of=NOW,
            )
        ]
    )
    service = _service(
        tmp_path,
        watchlist=watchlist,
        fundamental_loaders={},
        sec_user_agent="bad",
    )
    with _raises(MarketAiSelectionError) as caught:
        service.select(
            _request(
                market="us",
                universeMode="watchlist",
                discovery={},
            )
        )
    assert caught.value.status == 409
    assert "User-Agent" in caught.value.detail


def test_us_watchlist_rejects_stale_quote_timestamp(tmp_path: object) -> None:
    watchlist = _Watchlist(
        [
            Instrument(
                symbol="AAPL",
                name="Apple",
                market="us",
                change_pct=1.0,
                price=200.0,
                quote_source="finnhub",
                quote_as_of=NOW - timedelta(minutes=6),
            )
        ]
    )
    service = _service(
        tmp_path,
        watchlist=watchlist,
        fundamental_loaders={"us": _stock_fundamental},
    )
    with _raises(MarketAiSelectionError) as caught:
        service.select(
            _request(
                market="us",
                universeMode="watchlist",
                discovery={},
            )
        )
    assert caught.value.status == 409
    assert caught.value.code == "market_ai_selection_watchlist_quotes_stale"
    assert "新鲜度" in caught.value.detail


def test_us_watchlist_accepts_last_session_quote_on_weekend(tmp_path: object) -> None:
    weekend = datetime(2026, 8, 1, 15, tzinfo=timezone.utc)
    quote_at = datetime(2026, 7, 31, 19, 59, tzinfo=timezone.utc)
    watchlist = _Watchlist(
        [
            Instrument(
                symbol="AAPL",
                name="Apple",
                market="us",
                change_pct=1.0,
                price=200.0,
                quote_source="finnhub",
                quote_as_of=quote_at,
            )
        ]
    )
    def complete_fundamental(candidate: object, cutoff: datetime) -> dict[str, object]:
        return {**_stock_fundamental(candidate, cutoff), "sharesOutstanding": 1_000_000}

    service = _service(
        tmp_path,
        watchlist=watchlist,
        fundamental_loaders={"us": complete_fundamental},
        now=weekend,
    )
    result = service.select(
        _request(
            market="us",
            universeMode="watchlist",
            discovery={},
        )
    )
    assert result["marketSnapshot"]["observedAt"] == quote_at.isoformat()
    assert result["baselineCandidates"][0]["symbol"] == "AAPL"
    assert service.quality_statistics()["dataSourceDegradation"] == {
        "degradedCount": 0,
        "sampleCount": 1,
        "ratePct": 0.0,
    }

    mixed_service = _service(
        tmp_path,
        watchlist=_Watchlist(
            [
                *watchlist.instruments,
                Instrument(
                    symbol="MSFT",
                    name="Microsoft",
                    market="us",
                    change_pct=1.0,
                    price=500.0,
                    quote_source="finnhub",
                    quote_as_of=quote_at - timedelta(days=7),
                ),
            ]
        ),
        fundamental_loaders={"us": complete_fundamental},
        now=weekend,
    )
    mixed = mixed_service.select(
        _request(market="us", universeMode="watchlist", discovery={})
    )
    mixed_event = mixed_service.audit_store.get(mixed["auditEventId"])
    assert mixed_event is not None
    assert [
        item["symbol"]
        for item in mixed_event.metadata["artifact"]["initialCandidates"]
    ] == ["AAPL", "MSFT"]
    assert mixed_service.quality_statistics()["dataSourceDegradation"] == {
        "degradedCount": 1,
        "sampleCount": 2,
        "ratePct": 50.0,
    }

    legacy_artifact = json.loads(
        json.dumps(mixed_event.metadata["artifact"])
    )
    legacy_identity = {
        key: value
        for key, value in legacy_artifact.pop("selectionIdentity").items()
        if key != "schemaVersion"
    }
    legacy_identity["newsWarnings"] = [
        legacy_identity["marketSnapshot"]["warnings"][0]
    ]
    legacy_id = f"selection-{canonical_sha256(legacy_identity)[:20]}"
    legacy_event_id = f"market-ai-selection-{legacy_id}"
    legacy_artifact["schemaVersion"] = 1
    legacy_artifact["selectionId"] = legacy_id
    legacy_artifact["initialCandidates"] = [
        item
        for item in legacy_artifact["initialCandidates"]
        if item["symbol"] == "AAPL"
    ]
    legacy_artifact["result"]["selectionId"] = legacy_id
    legacy_artifact["result"]["auditEventId"] = legacy_event_id
    legacy_artifact["recordHash"] = canonical_sha256(
        {
            key: value
            for key, value in legacy_artifact.items()
            if key != "recordHash"
        }
    )
    connection = sqlite3.connect(tmp_path / "audit.db")  # type: ignore[operator]
    try:
        connection.execute(
            "update audit_events set event_id = ?, metadata_json = ? where event_id = ?",
            (
                legacy_event_id,
                json.dumps({"artifact": legacy_artifact}),
                mixed["auditEventId"],
            ),
        )
        connection.commit()
    finally:
        connection.close()
    assert mixed_service.quality_statistics()["selectionCount"] == 2

    boolean_schema = json.loads(json.dumps(legacy_artifact))
    boolean_schema["schemaVersion"] = True
    boolean_schema["recordHash"] = canonical_sha256(
        {key: value for key, value in boolean_schema.items() if key != "recordHash"}
    )
    connection = sqlite3.connect(tmp_path / "audit.db")  # type: ignore[operator]
    try:
        connection.execute(
            "update audit_events set metadata_json = ? where event_id = ?",
            (json.dumps({"artifact": boolean_schema}), legacy_event_id),
        )
        connection.commit()
    finally:
        connection.close()
    with _raises(MarketAiSelectionError):
        mixed_service.quality_statistics()
    recommendation = legacy_artifact["result"]["recommendations"][0]
    with _raises(ValueError):
        resolve_market_ai_selection_research_evidence(
            {
                "selectionId": legacy_id,
                "candidateEvidenceId": recommendation["evidenceId"],
            },
            audit_store=mixed_service.audit_store,
            market="us",
            symbol=recommendation["symbol"],
            timeframe="1d",
        )


def test_coingecko_mapping_is_exact_and_ambiguous_pairs_are_rejected() -> None:
    mapping = build_coingecko_binance_mapping(
        [
            {
                "base": "ABC",
                "target": "USDT",
                "coin_id": "alpha",
                "bid_ask_spread_percentage": 0.1,
            },
            {
                "base": "ABC",
                "target": "USDT",
                "coin_id": "another-alpha",
                "bid_ask_spread_percentage": 0.2,
            },
            {
                "base": "BTC",
                "target": "USDT",
                "coin_id": "bitcoin",
                "bid_ask_spread_percentage": 0.05,
            },
            {
                "base": "BTC",
                "target": "USDC",
                "coin_id": "bitcoin",
                "bid_ask_spread_percentage": 0.04,
            },
        ]
    )
    assert mapping["ABC/USDT"] == {
        "status": "ambiguous",
        "coinIds": ["alpha", "another-alpha"],
    }
    assert mapping["BTC/USDT"] == {
        "status": "mapped",
        "coinId": "bitcoin",
        "bidAskSpreadPct": 0.05,
    }


def test_crypto_mapping_and_market_facts_are_loaded_once_in_batches(
    tmp_path: object,
) -> None:
    rows = _rows(20, market="crypto")
    calls = {"tickers": 0, "markets": 0}
    lock = Lock()

    def fetch_json(url: str, headers: object) -> object:
        with lock:
            if "/exchanges/binance/tickers" in url:
                calls["tickers"] += 1
                return {
                    "tickers": [
                        {
                            "base": f"C{index:02d}",
                            "target": "USDT",
                            "coin_id": f"coin-{index}",
                            "bid_ask_spread_percentage": 0.1,
                            "last_fetch_at": NOW.isoformat(),
                            "is_stale": False,
                            "is_anomaly": False,
                        }
                        for index in range(20)
                    ]
                }
            if "/coins/markets" in url:
                calls["markets"] += 1
                ids = parse_qs(urlparse(url).query)["ids"][0].split(",")
                return [
                    {
                        "id": coin_id,
                        "market_cap": 1_000_000 + index,
                        "circulating_supply": 80_000,
                        "total_supply": 100_000,
                        "max_supply": 100_000,
                        "fully_diluted_valuation": 1_200_000,
                        "last_updated": NOW.isoformat(),
                    }
                    for index, coin_id in enumerate(ids)
                ]
        raise AssertionError(url)

    clock_calls = 0

    def advancing_clock() -> datetime:
        nonlocal clock_calls
        clock_calls += 1
        return NOW if clock_calls <= 3 else NOW + timedelta(seconds=1)

    service = _service(
        tmp_path,
        discovery=_Discovery(rows),
        fundamental_loaders={},
        fetch_json=fetch_json,
        clock=advancing_clock,
    )
    result = service.select(
        _request(
            market="crypto",
            discovery={},
            profile="balanced",
        )
    )
    assert result["status"] == "completed"
    assert len(result["baselineCandidates"]) == 20
    assert calls == {"tickers": 1, "markets": 1}
    event = service.audit_store.get(result["auditEventId"])
    assert event is not None
    assert event.metadata["artifact"]["marketContext"]["fundamentalSourceCoverage"] == {
        "provider": "coingecko-binance",
        "scope": "prefiltered_candidates",
        "observedAt": NOW.isoformat(),
        "sampleCount": 20,
        "mappedCount": 20,
        "ambiguousCount": 0,
        "missingCount": 0,
        "unresolvedCount": 0,
        "mappedRatePct": 100.0,
    }

    service.update_runtime(
        provider_registry=_registry(),
        sec_user_agent="AIQT ops@example.com",
    )
    assert service.select(
        _request(
            market="crypto",
            discovery={},
            profile="balanced",
        )
    ) == result
    assert calls == {"tickers": 1, "markets": 1}
    assert service.audit_store.count(event_type="market_ai_selection") == 1

    original = event.metadata["artifact"]
    assert original["schemaVersion"] == 2
    for downgrade in (False, True):
        forged = json.loads(json.dumps(original))
        forged["marketContext"].pop("fundamentalSourceCoverage")
        if downgrade:
            forged["schemaVersion"] = 1
        forged["recordHash"] = canonical_sha256(
            {key: value for key, value in forged.items() if key != "recordHash"}
        )
        connection = sqlite3.connect(tmp_path / "audit.db")  # type: ignore[operator]
        try:
            connection.execute(
                "update audit_events set metadata_json = ? where event_id = ?",
                (json.dumps({"artifact": forged}), result["auditEventId"]),
            )
            connection.commit()
        finally:
            connection.close()
        with _raises(MarketAiSelectionError) as caught:
            service.quality_statistics()
        assert caught.value.code == "market_ai_selection_statistics_audit_invalid"
        recommendation = result["recommendations"][0]
        with _raises(ValueError):
            resolve_market_ai_selection_research_evidence(
                {
                    "selectionId": result["selectionId"],
                    "candidateEvidenceId": recommendation["evidenceId"],
                },
                audit_store=service.audit_store,
                market="crypto",
                symbol=recommendation["symbol"],
                timeframe="1d",
            )


def test_crypto_selection_keeps_verified_mapping_when_later_page_fails(
    tmp_path: object,
) -> None:
    rows = _rows(20, market="crypto")
    calls = {"tickers": 0, "markets": 0}

    def fetch_json(url: str, headers: object) -> object:
        if "/exchanges/binance/tickers" in url:
            calls["tickers"] += 1
            if calls["tickers"] in {2, 5}:
                raise RuntimeError("coingecko_rate_limited")
            page = int(parse_qs(urlparse(url).query)["page"][0])
            mapped = [
                {
                    "base": f"C{index:02d}",
                    "target": "USDT",
                    "coin_id": f"coin-{index}",
                    "bid_ask_spread_percentage": 0.1,
                    "last_fetch_at": NOW.isoformat(),
                    "is_stale": False,
                    "is_anomaly": False,
                }
                for index in (range(5) if page == 1 else range(4, 20))
            ]
            if page == 1:
                return {"tickers": [*mapped, *([mapped[-1]] * 95)]}
            if calls["tickers"] == 6:
                return {
                    "tickers": [
                        {
                            **mapped[0],
                            "base": "C03",
                            "coin_id": "shifted-page-duplicate",
                        },
                        *mapped,
                    ]
                }
            return {
                "tickers": [
                    *mapped,
                    {
                        **mapped[-1],
                        "base": "ZZZ",
                        "coin_id": "zeta",
                    },
                ]
            }
        if "/coins/markets" in url:
            calls["markets"] += 1
            ids = parse_qs(urlparse(url).query)["ids"][0].split(",")
            return [
                {
                    "id": coin_id,
                    "market_cap": 1_000_000 + index,
                    "circulating_supply": 80_000,
                    "total_supply": 100_000,
                    "max_supply": 100_000,
                    "fully_diluted_valuation": 1_200_000,
                    "last_updated": NOW.isoformat(),
                }
                for index, coin_id in enumerate(ids)
            ]
        raise AssertionError(url)

    discovery = _Discovery(rows)
    service = _service(
        tmp_path,
        discovery=discovery,
        fundamental_loaders={},
        fetch_json=fetch_json,
    )

    result = service.select(
        _request(market="crypto", discovery={}, profile="balanced")
    )

    assert result["status"] == "partial"
    assert {item["symbol"] for item in result["baselineCandidates"]} == {
        "C00/USDT",
        "C01/USDT",
        "C02/USDT",
        "C03/USDT",
    }
    assert calls == {"tickers": 2, "markets": 1}
    event = service.audit_store.get(result["auditEventId"])
    assert event is not None
    coverage = event.metadata["artifact"]["marketContext"][
        "fundamentalSourceCoverage"
    ]
    assert coverage["sampleCount"] == 20
    assert coverage["mappedCount"] == 4
    assert coverage["unresolvedCount"] == 16

    resumed = service.select(
        _request(market="crypto", discovery={}, profile="balanced")
    )

    assert resumed["status"] == "partial"
    assert len(resumed["baselineCandidates"]) == 19
    assert calls == {"tickers": 3, "markets": 2}
    resumed_event = service.audit_store.get(resumed["auditEventId"])
    assert resumed_event is not None
    resumed_coverage = resumed_event.metadata["artifact"]["marketContext"][
        "fundamentalSourceCoverage"
    ]
    assert resumed_coverage["mappedCount"] == 19
    assert resumed_coverage["unresolvedCount"] == 1

    assert service.select(
        _request(market="crypto", discovery={}, profile="balanced")
    ) == resumed
    assert calls == {"tickers": 5, "markets": 2}

    with _raises(MarketAiSelectionError) as caught:
        service.select(
            _request(market="crypto", discovery={}, profile="balanced")
        )
    assert caught.value.code == "market_ai_selection_no_eligible_candidates"
    assert calls == {"tickers": 6, "markets": 2}

    discovery.rows = [{**rows[0], "symbol": "ZZZ/USDT"}]
    restarted = service.select(
        _request(market="crypto", discovery={}, profile="balanced")
    )

    assert restarted["status"] == "completed"
    assert [item["symbol"] for item in restarted["baselineCandidates"]] == [
        "ZZZ/USDT"
    ]
    assert calls == {"tickers": 8, "markets": 3}

    discovery.rows = rows
    restored = service.select(
        _request(market="crypto", discovery={}, profile="balanced")
    )
    assert restored["status"] == "completed"
    assert len(restored["baselineCandidates"]) == 20
    assert calls == {"tickers": 8, "markets": 4}


def test_crypto_rejects_future_or_stale_coingecko_source_facts(
    tmp_path: object,
) -> None:
    rows = _rows(20, market="crypto")

    for invalid_source in (
        "future_ticker",
        "stale_ticker",
        "anomalous_ticker",
        "missing_flags",
        "null_flags",
        "numeric_flags",
        "future_market",
        "stale_market",
    ):
        def fetch_json(url: str, headers: object) -> object:
            if "/exchanges/binance/tickers" in url:
                return {
                    "tickers": [
                        {
                            "base": f"C{index:02d}",
                            "target": "USDT",
                            "coin_id": f"coin-{index}",
                            "bid_ask_spread_percentage": 0.1,
                            "last_fetch_at": (
                                NOW + timedelta(days=1)
                                if invalid_source == "future_ticker"
                                else NOW
                            ).isoformat(),
                            **(
                                {}
                                if invalid_source == "missing_flags"
                                else {
                                    "is_stale": (
                                        None
                                        if invalid_source == "null_flags"
                                        else 0
                                        if invalid_source == "numeric_flags"
                                        else invalid_source == "stale_ticker"
                                    ),
                                    "is_anomaly": (
                                        None
                                        if invalid_source == "null_flags"
                                        else 0
                                        if invalid_source == "numeric_flags"
                                        else invalid_source == "anomalous_ticker"
                                    ),
                                }
                            ),
                        }
                        for index in range(20)
                    ]
                }
            if "/coins/markets" in url:
                ids = parse_qs(urlparse(url).query)["ids"][0].split(",")
                return [
                    {
                        "id": coin_id,
                        "market_cap": 1_000_000,
                        "circulating_supply": 80_000,
                        "total_supply": 100_000,
                        "max_supply": 100_000,
                        "fully_diluted_valuation": 1_200_000,
                        "last_updated": (
                            NOW + timedelta(days=1)
                            if invalid_source == "future_market"
                            else NOW - timedelta(minutes=6)
                            if invalid_source == "stale_market"
                            else NOW
                        ).isoformat(),
                    }
                    for coin_id in ids
                ]
            raise AssertionError(url)

        service = _service(
            tmp_path,
            discovery=_Discovery(rows),
            fundamental_loaders={},
            fetch_json=fetch_json,
        )
        with _raises(MarketAiSelectionError) as caught:
            service.select(
                _request(market="crypto", discovery={}, profile="balanced")
            )
        assert caught.value.code == "market_ai_selection_no_eligible_candidates"


def test_crypto_market_fact_omissions_are_negative_cached_idempotently(
    tmp_path: object,
) -> None:
    rows = _rows(20, market="crypto")
    calls = {"tickers": 0, "markets": 0}

    def fetch_json(url: str, headers: object) -> object:
        if "/exchanges/binance/tickers" in url:
            calls["tickers"] += 1
            return {
                "tickers": [
                    {
                        "base": f"C{index:02d}",
                        "target": "USDT",
                        "coin_id": f"coin-{index}",
                        "bid_ask_spread_percentage": 0.1,
                        "last_fetch_at": NOW.isoformat(),
                        "is_stale": False,
                        "is_anomaly": False,
                    }
                    for index in range(20)
                ]
            }
        if "/coins/markets" in url:
            calls["markets"] += 1
            ids = parse_qs(urlparse(url).query)["ids"][0].split(",")
            returned = ids[:-1] if calls["markets"] == 1 else ids
            return [
                {
                    "id": coin_id,
                    "market_cap": 1_000_000,
                    "circulating_supply": 80_000,
                    "total_supply": 100_000,
                    "max_supply": 100_000,
                    "fully_diluted_valuation": 1_200_000,
                    "last_updated": NOW.isoformat(),
                }
                for coin_id in returned
            ]
        raise AssertionError(url)

    service = _service(
        tmp_path,
        discovery=_Discovery(rows),
        fundamental_loaders={},
        fetch_json=fetch_json,
    )
    request = _request(market="crypto", discovery={}, profile="balanced")
    first = service.select(request)
    second = service.select(request)

    assert second == first
    assert calls == {"tickers": 1, "markets": 1}
    assert service.audit_store.count(event_type="market_ai_selection") == 1


def test_crypto_market_fact_source_failure_is_an_explicit_candidate_exclusion(
    tmp_path: object,
) -> None:
    rows = _rows(20, market="crypto")

    def fetch_json(url: str, headers: object) -> object:
        if "/exchanges/binance/tickers" in url:
            return {
                "tickers": [
                    {
                        "base": f"C{index:02d}",
                        "target": "USDT",
                        "coin_id": f"coin-{index}",
                        "bid_ask_spread_percentage": 0.1,
                        "last_fetch_at": NOW.isoformat(),
                        "is_stale": False,
                        "is_anomaly": False,
                    }
                    for index in range(20)
                ]
            }
        if "/coins/markets" in url:
            raise RuntimeError("coingecko_rate_limited")
        raise AssertionError(url)

    service = _service(
        tmp_path,
        discovery=_Discovery(rows),
        fundamental_loaders={},
        fetch_json=fetch_json,
    )

    with _raises(MarketAiSelectionError) as caught:
        service.select(
            _request(market="crypto", discovery={}, profile="balanced")
        )

    assert caught.value.code == "market_ai_selection_no_eligible_candidates"
    assert caught.value.status == 409
    assert "已映射币种缺少本次 CoinGecko 市场事实" in caught.value.detail


def test_crypto_market_fact_source_failure_is_not_reported_as_budget_timeout(
    tmp_path: object,
) -> None:
    rows = _rows(20, market="crypto")
    discovery = _Discovery(rows[:5])
    market_calls = 0

    def fetch_json(url: str, headers: object) -> object:
        nonlocal market_calls
        if "/exchanges/binance/tickers" in url:
            return {
                "tickers": [
                    {
                        "base": f"C{index:02d}",
                        "target": "USDT",
                        "coin_id": f"coin-{index}",
                        "bid_ask_spread_percentage": 0.1,
                        "last_fetch_at": NOW.isoformat(),
                        "is_stale": False,
                        "is_anomaly": False,
                    }
                    for index in range(20)
                ]
            }
        if "/coins/markets" in url:
            market_calls += 1
            if market_calls == 2:
                raise RuntimeError("coingecko_rate_limited")
            ids = parse_qs(urlparse(url).query)["ids"][0].split(",")
            return [
                {
                    "id": coin_id,
                    "market_cap": 1_000_000 + index,
                    "circulating_supply": 80_000,
                    "total_supply": 100_000,
                    "max_supply": 100_000,
                    "fully_diluted_valuation": 1_200_000,
                    "last_updated": NOW.isoformat(),
                }
                for index, coin_id in enumerate(ids)
            ]
        raise AssertionError(url)

    service = _service(
        tmp_path,
        discovery=discovery,
        fundamental_loaders={},
        fetch_json=fetch_json,
    )
    service.select(_request(market="crypto", discovery={}, profile="balanced"))
    discovery.rows = rows

    result = service.select(
        _request(market="crypto", discovery={}, profile="balanced")
    )

    assert result["status"] == "partial"
    assert len(result["baselineCandidates"]) == 5
    warnings = result["marketSnapshot"]["warnings"]
    assert "CoinGecko 市场事实源未完整返回，已排除缺失事实的候选。" in warnings
    assert not any("预算" in warning for warning in warnings)


def test_coingecko_mapping_detects_ambiguity_across_pages(tmp_path: object) -> None:
    calls = 0

    def fetch_json(url: str, headers: object) -> object:
        nonlocal calls
        calls += 1
        page = int(parse_qs(urlparse(url).query)["page"][0])
        if page == 1:
            return {
                "tickers": [
                    {
                        "base": "ABC",
                        "target": "USDT",
                        "coin_id": "alpha",
                        "bid_ask_spread_percentage": 0.1,
                        "last_fetch_at": NOW.isoformat(),
                        "is_stale": False,
                        "is_anomaly": False,
                    }
                    for _ in range(100)
                ]
            }
        return {
            "tickers": [
                {
                    "base": "ABC",
                    "target": "USDT",
                    "coin_id": "another-alpha",
                    "bid_ask_spread_percentage": 0.2,
                    "last_fetch_at": NOW.isoformat(),
                    "is_stale": False,
                    "is_anomaly": False,
                },
                {
                    "base": "ZZZ",
                    "target": "USDT",
                    "coin_id": "zeta",
                    "bid_ask_spread_percentage": 0.1,
                    "last_fetch_at": NOW.isoformat(),
                    "is_stale": False,
                    "is_anomaly": False,
                },
            ]
        }

    service = _service(tmp_path, fetch_json=fetch_json)
    mapping, timed_out = service._ensure_coingecko_mapping(  # noqa: SLF001
        {"ABC/USDT"},
        cutoff=NOW,
        deadline=service.monotonic() + 100.0,
    )
    assert timed_out is False
    assert calls == 2
    assert mapping["ABC/USDT"] == {
        "status": "ambiguous",
        "coinIds": ["alpha", "another-alpha"],
        "observedAt": NOW.isoformat(),
    }
    assert service._load_crypto_fundamental(  # noqa: SLF001
        {"symbol": "ABC/USDT"},
        cutoff=NOW,
    )["sourceStatus"] == "crypto_mapping_ambiguous"

    missing_service = _service(
        tmp_path,
        fetch_json=lambda _url, _headers: {
            "tickers": [
                {
                    "base": "BTC",
                    "target": "USDT",
                    "coin_id": "bitcoin",
                    "bid_ask_spread_percentage": 0.05,
                    "last_fetch_at": NOW.isoformat(),
                    "is_stale": False,
                    "is_anomaly": False,
                }
            ]
        },
    )
    missing_mapping, incomplete = missing_service._ensure_coingecko_mapping(  # noqa: SLF001
        {"ETH/USDT"},
        cutoff=NOW,
        deadline=missing_service.monotonic() + 100.0,
    )
    assert incomplete is False
    assert missing_mapping["ETH/USDT"] == {
        "status": "missing",
        "checkedAt": NOW.isoformat(),
    }
    assert missing_service._load_crypto_fundamental(  # noqa: SLF001
        {"symbol": "ETH/USDT"},
        cutoff=NOW,
    )["sourceStatus"] == "crypto_mapping_missing"
    assert missing_service._load_crypto_fundamental(  # noqa: SLF001
        {"symbol": "BTC/USDT"},
        cutoff=NOW,
    )["sourceStatus"] == "crypto_market_facts_missing"

    page_limit_calls = 0

    def unresolved_fetch(_url: str, _headers: object) -> object:
        nonlocal page_limit_calls
        page_limit_calls += 1
        return {
            "tickers": [
                {
                    "base": "AAA",
                    "target": "USDT",
                    "coin_id": "aaa",
                    "bid_ask_spread_percentage": 0.1,
                    "last_fetch_at": NOW.isoformat(),
                    "is_stale": False,
                    "is_anomaly": False,
                }
                for _ in range(100)
            ]
        }

    unresolved_service = _service(tmp_path, fetch_json=unresolved_fetch)
    unresolved_mapping, incomplete = unresolved_service._ensure_coingecko_mapping(  # noqa: SLF001
        {"ZZZ/USDT"},
        cutoff=NOW,
        deadline=unresolved_service.monotonic() + 100.0,
    )
    assert page_limit_calls == 20
    assert incomplete is True
    assert unresolved_mapping["ZZZ/USDT"] == {
        "status": "unresolved",
        "checkedAt": NOW.isoformat(),
    }

    current_pair = "AAA"
    rolling_calls = 0

    def rolling_fetch(_url: str, _headers: object) -> object:
        nonlocal rolling_calls
        rolling_calls += 1
        observed_at = NOW + timedelta(minutes=4 * (rolling_calls - 1))
        return {
            "tickers": [
                {
                    "base": current_pair,
                    "target": "USDT",
                    "coin_id": current_pair.casefold(),
                    "bid_ask_spread_percentage": 0.1,
                    "last_fetch_at": observed_at.isoformat(),
                    "is_stale": False,
                    "is_anomaly": False,
                }
            ]
        }

    rolling_service = _service(tmp_path, fetch_json=rolling_fetch)
    rolling_service._ensure_coingecko_mapping(  # noqa: SLF001
        {"AAA/USDT"}, cutoff=NOW, deadline=None
    )
    current_pair = "BBB"
    rolling_service._ensure_coingecko_mapping(  # noqa: SLF001
        {"BBB/USDT"}, cutoff=NOW + timedelta(minutes=4), deadline=None
    )
    current_pair = "AAA"
    refreshed, _ = rolling_service._ensure_coingecko_mapping(  # noqa: SLF001
        {"AAA/USDT"}, cutoff=NOW + timedelta(minutes=8), deadline=None
    )
    assert rolling_calls == 3
    assert refreshed["AAA/USDT"]["observedAt"] == (
        NOW + timedelta(minutes=8)
    ).isoformat()

    negative_pair = "ZZZ"
    negative_calls = 0

    def negative_fetch(_url: str, _headers: object) -> object:
        nonlocal negative_calls
        negative_calls += 1
        observed_at = NOW + timedelta(minutes=4 * (negative_calls - 1))
        return {
            "tickers": [
                {
                    "base": "BBB" if negative_calls == 2 else "AAA",
                    "target": "USDT",
                    "coin_id": "known",
                    "bid_ask_spread_percentage": 0.1,
                    "last_fetch_at": observed_at.isoformat(),
                    "is_stale": False,
                    "is_anomaly": False,
                }
            ]
        }

    negative_service = _service(tmp_path, fetch_json=negative_fetch)
    negative_service._ensure_coingecko_mapping(  # noqa: SLF001
        {f"{negative_pair}/USDT"}, cutoff=NOW, deadline=None
    )
    negative_service._ensure_coingecko_mapping(  # noqa: SLF001
        {"BBB/USDT"}, cutoff=NOW + timedelta(minutes=4), deadline=None
    )
    refreshed_negative, _ = negative_service._ensure_coingecko_mapping(  # noqa: SLF001
        {f"{negative_pair}/USDT"},
        cutoff=NOW + timedelta(minutes=8),
        deadline=None,
    )
    assert negative_calls == 3
    assert refreshed_negative["ZZZ/USDT"] == {
        "status": "missing",
        "checkedAt": (NOW + timedelta(minutes=8)).isoformat(),
    }


def test_cache_rejects_values_written_in_the_future(tmp_path: object) -> None:
    service = _service(tmp_path)
    service._cache_put(  # noqa: SLF001
        "future",
        {"value": 1},
        now=NOW + timedelta(hours=1),
    )
    assert (
        service._cache_get(  # noqa: SLF001
            "future",
            ttl=timedelta(hours=24),
            now=NOW,
        )
        is None
    )

    loader_calls = 0

    def fresh_crypto_fundamental(
        candidate: object,
        cutoff: datetime,
    ) -> dict[str, object]:
        nonlocal loader_calls
        loader_calls += 1
        return {
            "source": "coingecko+binance",
            "observedAt": cutoff.isoformat(),
            "mappingObservedAt": cutoff.isoformat(),
        }

    crypto_service = _service(
        tmp_path,
        fundamental_loaders={"crypto": fresh_crypto_fundamental},
    )
    crypto_service._cache_put(  # noqa: SLF001
        "fundamental:crypto:BTC/USDT",
        {
            "source": "coingecko+binance",
            "observedAt": (NOW - timedelta(minutes=4)).isoformat(),
            "mappingObservedAt": (NOW - timedelta(minutes=4)).isoformat(),
        },
        now=NOW,
    )
    refreshed_fundamental = crypto_service._load_fundamental(  # noqa: SLF001
        {"symbol": "BTC/USDT"},
        market="crypto",
        cutoff=NOW + timedelta(minutes=2),
        deadline=crypto_service.monotonic() + 1,
    )
    assert loader_calls == 1
    assert refreshed_fundamental == {
        "source": "coingecko+binance",
        "observedAt": (NOW + timedelta(minutes=2)).isoformat(),
        "mappingObservedAt": (NOW + timedelta(minutes=2)).isoformat(),
    }


def test_default_json_fetch_respects_remaining_deadline(tmp_path: object) -> None:
    service = _service(tmp_path)
    calls: list[float] = []

    def fetch_json(
        url: str,
        headers: object,
        timeout_seconds: float,
    ) -> dict[str, object]:
        calls.append(timeout_seconds)
        return {}

    service.fetch_json = fetch_json
    service.monotonic = lambda: 10.0
    assert service._read_json(  # noqa: SLF001
        "https://example.test/data",
        {},
        deadline=12.5,
    ) == {}
    assert calls == [2.5]
    with _raises(TimeoutError):
        service._read_json(  # noqa: SLF001
            "https://example.test/data",
            {},
            deadline=10.0,
        )
    assert calls == [2.5]


def test_sec_requests_are_rate_limited_to_eight_per_second(tmp_path: object) -> None:
    current = [0.0]
    starts: list[float] = []

    def monotonic() -> float:
        return current[0]

    def sleep(seconds: float) -> None:
        current[0] += seconds

    def fetch_json(url: str, headers: object) -> dict[str, object]:
        starts.append(current[0])
        return {}

    service = _service(
        tmp_path,
        fetch_json=fetch_json,
        monotonic=monotonic,
        sleep=sleep,
    )
    for index in range(9):
        service._read_sec_json(  # noqa: SLF001
            f"https://data.sec.gov/test/{index}",
            {},
            deadline=10.0,
        )
    assert len(starts) == 9
    assert all(
        later - earlier >= 0.125 - 1e-9
        for earlier, later in zip(starts, starts[1:])
    )
    assert sum(start < 1.0 for start in starts) <= 8


def test_sec_companyfacts_obeys_filing_cutoff() -> None:
    def duration(
        end: str,
        filed: str,
        value: float,
        fy: int,
    ) -> dict[str, object]:
        return {
            "start": f"{fy}-01-01",
            "end": end,
            "filed": filed,
            "val": value,
            "form": "10-K",
            "fy": fy,
            "fp": "FY",
        }

    def instant(end: str, filed: str, value: float, fy: int) -> dict[str, object]:
        return {
            "end": end,
            "filed": filed,
            "val": value,
            "form": "10-K",
            "fy": fy,
            "fp": "FY",
        }

    payload = {
        "facts": {
            "us-gaap": {
                "RevenueFromContractWithCustomerExcludingAssessedTax": {
                    "units": {
                        "USD": [
                            duration("2022-12-31", "2023-02-01", 80, 2022),
                            duration("2021-12-31", "2022-02-01", 70, 2021),
                        ]
                    }
                },
                "Revenues": {
                    "units": {
                        "USD": [
                            duration("2026-12-31", "2026-02-01", 999, 2026),
                            duration("2025-12-31", "2026-02-01", 120, 2025),
                            duration("2024-12-31", "2025-02-01", 100, 2024),
                        ]
                    }
                },
                "NetIncomeLoss": {
                    "units": {
                        "USD": [
                            duration("2025-12-31", "2026-02-01", 12, 2025),
                            duration("2024-12-31", "2025-02-01", 10, 2024),
                        ]
                    }
                },
                "Assets": {
                    "units": {
                        "USD": [
                            instant("2025-12-31", "2026-02-01", 300, 2025),
                            instant("2024-12-31", "2025-02-01", 280, 2024),
                        ]
                    }
                },
                "StockholdersEquity": {
                    "units": {
                        "USD": [
                            instant("2025-12-31", "2026-02-01", 150, 2025),
                            instant("2024-12-31", "2025-02-01", 140, 2024),
                        ]
                    }
                },
                "CommonStocksIncludingAdditionalPaidInCapital": {
                    "units": {
                        "USD": [instant("2025-12-31", "2026-02-01", 999, 2025)]
                    }
                },
            },
            "dei": {
                "EntityCommonStockSharesOutstanding": {
                    "units": {
                        "shares": [
                            instant("2025-12-31", "2026-02-01", 1234, 2025),
                            instant("2026-01-15", "2026-02-01", 5678, 2025),
                        ]
                    }
                }
            }
        }
    }
    parsed = parse_sec_companyfacts(
        payload,
        cutoff=datetime(2026, 3, 1, tzinfo=timezone.utc),
    )
    assert parsed is not None
    assert parsed["currentRevenue"] == 120
    assert parsed["previousRevenue"] == 100
    assert parsed["sharesOutstanding"] == 5678
    assert str(parsed["currentPeriod"]).startswith("2025-12-31")

    us_gaap_shares_payload = json.loads(json.dumps(payload))
    us_gaap_shares_payload["facts"].pop("dei")
    us_gaap_shares_payload["facts"]["us-gaap"]["CommonStockSharesOutstanding"] = {
        "units": {
            "shares": [instant("2025-12-31", "2026-02-01", 4321, 2025)]
        }
    }
    us_gaap_shares = parse_sec_companyfacts(
        us_gaap_shares_payload,
        cutoff=datetime(2026, 3, 1, tzinfo=timezone.utc),
    )
    assert us_gaap_shares is not None
    assert us_gaap_shares["sharesOutstanding"] == 4321

    stale_shares_payload = json.loads(json.dumps(payload))
    stale_shares_payload["facts"]["dei"][
        "EntityCommonStockSharesOutstanding"
    ]["units"]["shares"] = [
        instant("2019-03-18", "2019-04-01", 1, 2019)
    ]
    stale_shares = parse_sec_companyfacts(
        stale_shares_payload,
        cutoff=datetime(2026, 3, 1, tzinfo=timezone.utc),
    )
    assert stale_shares is not None
    assert stale_shares["sharesOutstanding"] is None
    valid, reason, _ = market_ai_selection_module._validate_fundamental(  # noqa: SLF001
        stale_shares,
        market="us",
        profile="value",
        candidate={"symbol": "FOX", "price": 200},
        cutoff=datetime(2026, 3, 1, tzinfo=timezone.utc),
    )
    assert valid is False
    assert reason == "valuation_missing"

    stale = {
        **parsed,
        "currentPeriod": "2024-03-31T00:00:00+00:00",
        "previousPeriod": "2023-03-31T00:00:00+00:00",
        "disclosedAt": "2024-05-01T00:00:00+00:00",
    }
    valid, reason, _ = market_ai_selection_module._validate_fundamental(  # noqa: SLF001
        stale,
        market="us",
        profile="balanced",
        candidate={"symbol": "AAPL", "price": 200},
        cutoff=datetime(2026, 3, 1, tzinfo=timezone.utc),
    )
    assert valid is False
    assert reason == "stock_fundamental_stale"


def test_ashare_source_comparison_verifies_or_blocks_conflict() -> None:
    income = [
        {
            "报告期": "2027-03-31",
            "公告日期": "2026-06-01",
            "营业总收入": 999,
            "归母净利润": 99,
            "币种": "CNY",
            "单位": "元",
        },
        {
            "报告期": "2026-03-31",
            "公告日期": "2026-04-30",
            "营业总收入": 120,
            "归属于母公司的净利润": 12,
            "币种": "CNY",
            "单位": "元",
        },
        {
            "报告期": "2025-03-31",
            "公告日期": "2025-04-30",
            "营业总收入": 100,
            "归母净利润": 10,
            "币种": "CNY",
            "单位": "元",
        },
    ]
    balance = [
        {
            "报告期": "2026-03-31",
            "公告日期": "2026-04-30",
            "总资产": 300,
            "归属于母公司股东的权益": 150,
            "币种": "CNY",
            "单位": "元",
        }
    ]
    primary = parse_ashare_financial_reports(income, balance, cutoff=NOW)
    assert primary is not None
    assert str(primary["currentPeriod"]).startswith("2026-03-31")
    secondary = parse_ashare_financial_reports(
        income,
        balance,
        cutoff=NOW,
        source="akshare-eastmoney-financial-report",
    )
    assert secondary is not None
    verified = compare_stock_fundamental_sources(
        primary,
        secondary,
    )
    assert verified["status"] == "verified"
    assert verified["sources"] == [
        "akshare-sina-financial-report",
        "akshare-eastmoney-financial-report",
    ]
    conflict = compare_stock_fundamental_sources(
        primary,
        {**primary, "currentRevenue": 1, "source": "secondary"},
    )
    assert conflict["status"] == "conflict"
    assert "currentRevenue" in conflict["mismatchedFields"]
    tolerance_edge = compare_stock_fundamental_sources(
        {**primary, "currentRevenue": 99},
        {**secondary, "currentRevenue": 100},
    )
    assert tolerance_edge["status"] == "verified"
    same_source = compare_stock_fundamental_sources(
        primary,
        {**secondary, "source": " AKSHARE-SINA-FINANCIAL-REPORT "},
    )
    assert same_source == {
        "status": "conflict",
        "sources": [
            "akshare-sina-financial-report",
            " AKSHARE-SINA-FINANCIAL-REPORT ",
        ],
        "reason": "sources_not_independent",
    }
    unit_conflict = compare_stock_fundamental_sources(
        {**primary, "monetaryUnit": "CNY"},
        {**secondary, "monetaryUnit": "CNY-thousands"},
    )
    assert unit_conflict == {
        "status": "conflict",
        "sources": [
            "akshare-sina-financial-report",
            "akshare-eastmoney-financial-report",
        ],
        "reason": "unit_mismatch",
    }
    usd = parse_ashare_financial_reports(
        [{**row, "币种": "USD", "单位": "美元"} for row in income],
        [{**row, "币种": "USD", "单位": "美元"} for row in balance],
        cutoff=NOW,
        source="usd-source",
    )
    assert usd is not None
    assert compare_stock_fundamental_sources(primary, usd)["reason"] == "unit_mismatch"

    scaled_income = [
        {
            **row,
            "营业总收入": row.get("营业总收入", 0) / 10_000,
            **(
                {"归母净利润": row["归母净利润"] / 10_000}
                if "归母净利润" in row
                else {}
            ),
            **(
                {
                    "归属于母公司的净利润": row[
                        "归属于母公司的净利润"
                    ]
                    / 10_000
                }
                if "归属于母公司的净利润" in row
                else {}
            ),
            "单位": "万元",
        }
        for row in income
    ]
    scaled_balance = [
        {
            **row,
            "总资产": row["总资产"] / 10_000,
            "归属于母公司股东的权益": row["归属于母公司股东的权益"]
            / 10_000,
            "单位": "万元",
        }
        for row in balance
    ]
    scaled = parse_ashare_financial_reports(
        scaled_income,
        scaled_balance,
        cutoff=NOW,
        source="scaled-source",
    )
    assert scaled is not None
    assert scaled["sourceMonetaryScale"] == 10_000
    assert compare_stock_fundamental_sources(primary, scaled)["status"] == "verified"


def test_ashare_fact_conflict_keeps_the_auditable_exclusion_cause(
    tmp_path: object,
) -> None:
    conflicts = {
        "600000": {
            "mismatchedFields": ["currentRevenue", "shareholdersEquity"],
        },
        "600001": {"reason": "sources_not_independent"},
        "600002": {"reason": "unit_unknown"},
        "600003": {"reason": "unit_mismatch"},
        "600004": {"reason": "report_period_mismatch"},
    }

    def conflicting_fundamental(
        candidate: object,
        cutoff: datetime,
    ) -> dict[str, object]:
        value = _stock_fundamental(candidate, cutoff)
        symbol = str(candidate["symbol"])  # type: ignore[index]
        if symbol in conflicts:
            value["conflict"] = True
            value["sourceVerification"] = {
                "status": "conflict",
                "sources": ["source-a", "source-b"],
                **conflicts[symbol],
            }
        return value

    service = _service(
        tmp_path,
        discovery=_Discovery(_rows(20)),
        fundamental_loaders={"ashare": conflicting_fundamental},
    )
    result = service.select(_request())
    expected = {
        "600000": "双源财务事实字段不一致：本期营收、股东权益。",
        "600001": "双源财务事实来源不独立。",
        "600002": "双源财务事实缺少可核验货币单位。",
        "600003": "双源财务事实货币单位不一致。",
        "600004": "双源财务事实报告期不一致。",
    }
    exclusions = {
        item["symbol"]: item["reason"]
        for item in result["exclusions"]
    }
    assert exclusions == expected
    event = service.audit_store.get(result["auditEventId"])
    assert event is not None
    assert event.metadata["artifact"]["exclusions"] == result["exclusions"]
    reasons = service.quality_statistics()["majorExclusions"]["reasons"]
    assert {item["reason"]: item["count"] for item in reasons} == {
        reason: 1 for reason in expected.values()
    }


def test_provider_output_rejects_unknown_reference_and_trade_field() -> None:
    with _raises(ValueError):
        validate_market_ai_selection_output(
            {
                "selections": [
                    {
                        "evidenceId": "candidate-a",
                        "rank": 1,
                        "tier": "priority_research",
                        "reasons": ["证据完整。"],
                        "risks": ["波动风险。"],
                        "evidenceReferences": ["unknown"],
                        "summary": "优先研究。",
                    }
                ]
            },
            frozenset({"candidate-a"}),
        )
    with _raises(ValueError):
        validate_market_ai_selection_output(
            {
                "selections": [
                    {
                        "evidenceId": "candidate-a",
                        "rank": 1,
                        "tier": "priority_research",
                        "reasons": ["证据完整。"],
                        "risks": ["波动风险。"],
                        "evidenceReferences": ["candidate-a"],
                        "summary": "优先研究。",
                        "order": "forbidden",
                    }
                ]
            },
            frozenset({"candidate-a"}),
        )


def test_news_loader_stops_when_shared_evidence_budget_is_exhausted(
    tmp_path: object,
) -> None:
    news = _News()
    service = _service(
        tmp_path,
        news=news,
        monotonic=lambda: 21.0,
    )
    payload, warnings = service._load_news(  # noqa: SLF001
        [],
        request=validate_market_ai_selection_request(_request()),
        generated_at=NOW,
        deadline=20.0,
    )
    assert payload["market"] == []
    assert news.calls == []
    assert "预算" in warnings[0]


def test_blocking_news_read_cannot_exceed_shared_budget(tmp_path: object) -> None:
    news = _BlockingNews()
    service = _service(tmp_path, news=news)
    started = __import__("time").monotonic()
    payload, warnings = service._load_news(  # noqa: SLF001
        [
            {
                "evidenceId": "candidate-ashare-600000",
                "symbol": "600000",
                "name": "候选",
            }
        ],
        request=validate_market_ai_selection_request(_request()),
        generated_at=NOW,
        deadline=service.monotonic() + 0.03,
    )
    elapsed = __import__("time").monotonic() - started
    assert elapsed < 0.15
    assert len(news.calls) == 1
    assert payload["market"] == []
    assert any("预算" in warning for warning in warnings)


def test_news_content_change_changes_selection_identity(tmp_path: object) -> None:
    news = _RichNews()
    service = _service(tmp_path, news=news)
    first = service.select(_request())
    news.headline_suffix = "（更新）"
    second = service.select(_request())
    assert first["selectionId"] != second["selectionId"]
    news.warnings = ["新闻上游部分降级。"]
    third = service.select(_request())
    assert second["selectionId"] != third["selectionId"]
    assert third["status"] == "partial"


def test_review_keeps_unreached_recommendations_observing_and_reports_sample_sizes(
    tmp_path: object,
) -> None:
    run_store = ResearchRunStore(tmp_path / "runs.db")  # type: ignore[operator]
    service = _service(
        tmp_path,
        run_store=run_store,
        discovery=_Discovery(_rows(), snapshot_hash="a" * 64),
    )
    selection = service.select(_request(horizon="short"))
    recommendation = selection["recommendations"][0]
    evidence = resolve_market_ai_selection_research_evidence(
        {
            "selectionId": selection["selectionId"],
            "candidateEvidenceId": recommendation["evidenceId"],
        },
        audit_store=service.audit_store,
        market=recommendation["market"],
        symbol=recommendation["symbol"],
        timeframe="1d",
    )
    assert evidence is not None
    _record_review_run(
        run_store,
        run_id="run-selected-candidate",
        symbol=recommendation["symbol"],
        selection_evidence=evidence,
    )
    _record_review_run(run_store, run_id="run-benchmark", symbol="000300")

    review = service.review(
        {
            "selectionId": selection["selectionId"],
            "benchmarkRunId": "run-benchmark",
        }
    )

    assert review["summary"] == {
        "recommendationCount": 5,
        "maturedCount": 0,
        "observingCount": 1,
        "dataInsufficientCount": 4,
        "absoluteHitCount": 0,
        "absoluteSampleCount": 0,
        "absoluteHitRatePct": None,
        "benchmarkHitCount": 0,
        "benchmarkSampleCount": 0,
        "benchmarkHitRatePct": None,
    }
    assert review["items"][0]["status"] == "observing"
    assert review["items"][0]["remainingBars"] == 5
    assert "returnPct" not in review["items"][0]
    assert review["boundary"]["researchOnly"] is True
    assert review["boundary"]["orderSubmissionAllowed"] is False


def test_review_calculates_expiry_idempotently_and_rejects_audit_conflicts(
    tmp_path: object,
) -> None:
    run_store = ResearchRunStore(tmp_path / "runs.db")  # type: ignore[operator]
    selected_symbol = {"value": ""}
    review_bars: dict[str, list[OHLCVBar]] = {}

    def load_klines(
        request: object,
        limit: int,
    ) -> tuple[list[OHLCVBar], DataQuality]:
        symbol = getattr(request, "symbol")
        bars = review_bars.get(symbol) or _bars(symbol, "ashare")
        return bars, DataQuality(
            source="local-cache",
            origin_source="test-bars",
            is_complete=True,
            rows=len(bars),
            adjustment_mode="qfq",
        )

    service = _service(
        tmp_path,
        run_store=run_store,
        discovery=_Discovery(_rows(), snapshot_hash="a" * 64),
        kline_loader=load_klines,
    )
    selection = service.select(_request(horizon="short"))
    recommendation = selection["recommendations"][0]
    selected_symbol["value"] = recommendation["symbol"]
    evidence = resolve_market_ai_selection_research_evidence(
        {
            "selectionId": selection["selectionId"],
            "candidateEvidenceId": recommendation["evidenceId"],
        },
        audit_store=service.audit_store,
        market="ashare",
        symbol=selected_symbol["value"],
        timeframe="1d",
    )
    assert evidence is not None
    _record_review_run(
        run_store,
        run_id="run-selected-candidate",
        symbol=selected_symbol["value"],
        selection_evidence=evidence,
    )
    _record_review_run(run_store, run_id="run-benchmark", symbol="000300")

    reference_at = datetime.fromisoformat(str(evidence["referenceAt"]))
    reference_price = float(evidence["referencePrice"])
    evaluated_at = reference_at + timedelta(days=7)
    outcome_price = round(reference_price * 1.1, 6)
    review_bars[selected_symbol["value"]] = [
        _review_bar(selected_symbol["value"], reference_at, reference_price),
        *[
            _review_bar(
                selected_symbol["value"],
                reference_at + timedelta(days=index),
                outcome_price if index == 5 else reference_price,
            )
            for index in range(1, 6)
        ],
        _review_bar(selected_symbol["value"], evaluated_at, reference_price * 9),
        _review_bar(
            selected_symbol["value"],
            evaluated_at + timedelta(days=1),
            reference_price * 10,
        ),
    ]
    review_bars["000300"] = [
        _review_bar("000300", reference_at, 200),
        *[
            _review_bar(
                "000300",
                reference_at + timedelta(days=index),
                204 if index == 5 else 200,
            )
            for index in range(1, 6)
        ],
        _review_bar("000300", evaluated_at, 900),
    ]
    service.clock = lambda: evaluated_at

    review = service.review(
        {
            "selectionId": selection["selectionId"],
            "benchmarkRunId": "run-benchmark",
        }
    )

    completed = review["items"][0]
    assert completed["status"] == "completed"
    assert completed["outcomeAt"] == (reference_at + timedelta(days=5)).isoformat()
    assert completed["returnPct"] == 10.0
    assert completed["outcomeSource"] == "test-bars"
    assert completed["benchmarkReturnPct"] == 2.0
    assert completed["benchmarkSource"] == "test-bars"
    assert completed["benchmarkReferencePrice"] == 200.0
    assert completed["benchmarkOutcomePrice"] == 204.0
    assert completed["relativeReturnPct"] == 8.0
    assert review["summary"]["absoluteSampleCount"] == 1
    assert review["summary"]["benchmarkSampleCount"] == 1
    assert service.review(
        {
            "selectionId": selection["selectionId"],
            "benchmarkRunId": "run-benchmark",
        }
    ) == review
    assert service.audit_store.count(event_type="market_ai_selection_review") == 1
    assert not any(
        event.event_type == "market_ai_selection_review"
        for event in service.audit_store.list_all_by_run("run-benchmark")
    )
    assert service.quality_statistics()["stylePerformance"][0] == {
        "profile": "balanced",
        "selectionCount": 1,
        "reviewedSelectionCount": 1,
        "absoluteHitCount": 1,
        "absoluteSampleCount": 1,
        "absoluteHitRatePct": 100.0,
        "benchmarkHitCount": 1,
        "benchmarkSampleCount": 1,
        "benchmarkHitRatePct": 100.0,
    }
    audited_event = service.audit_store.get(review["reviewId"])
    assert audited_event is not None
    audited_review = json.loads(json.dumps(audited_event.metadata["review"]))

    legacy_review = json.loads(json.dumps(audited_review))
    legacy_review["schemaVersion"] = 1
    legacy_review["items"][0].pop("benchmarkReferencePrice")
    legacy_review["items"][0].pop("benchmarkOutcomePrice")
    for item in legacy_review["items"]:
        item.pop("outcomeBars", None)
        item.pop("benchmarkBars", None)
    legacy_identity = {
        "selectionId": legacy_review["selectionId"],
        "selectionRecordHash": legacy_review["selectionRecordHash"],
        "benchmarkRunId": legacy_review["benchmark"]["runId"],
        "benchmarkAuditHash": legacy_review["benchmark"]["auditHash"],
        "items": legacy_review["items"],
        "summary": legacy_review["summary"],
    }
    legacy_review_id = (
        "market-ai-selection-review-"
        f"{canonical_sha256(legacy_identity)[:32]}"
    )
    legacy_review["reviewId"] = legacy_review_id
    legacy_review["recordHash"] = canonical_sha256(
        {key: value for key, value in legacy_review.items() if key != "recordHash"}
    )
    connection = sqlite3.connect(service.audit_store.path)
    try:
        connection.execute(
            "update audit_events set event_id = ?, metadata_json = ? where event_id = ?",
            (
                legacy_review_id,
                json.dumps({"review": legacy_review}),
                review["reviewId"],
            ),
        )
        connection.commit()
        assert service.quality_statistics()["stylePerformance"][0][
            "benchmarkSampleCount"
        ] == 1
        boolean_review = json.loads(json.dumps(legacy_review))
        boolean_review["schemaVersion"] = True
        boolean_review["recordHash"] = canonical_sha256(
            {
                key: value
                for key, value in boolean_review.items()
                if key != "recordHash"
            }
        )
        connection.execute(
            "update audit_events set metadata_json = ? where event_id = ?",
            (json.dumps({"review": boolean_review}), legacy_review_id),
        )
        connection.commit()
        with _raises(MarketAiSelectionError):
            service.quality_statistics()
        connection.execute(
            "update audit_events set event_id = ?, metadata_json = ? where event_id = ?",
            (
                review["reviewId"],
                json.dumps({"review": audited_review}),
                legacy_review_id,
            ),
        )
        connection.commit()
    finally:
        connection.close()

    for field, forged_value in (
        ("returnPct", 999.0),
        ("relativeReturnPct", -777.0),
    ):
        forged_outcome = json.loads(json.dumps(audited_review))
        forged_outcome["items"][0][field] = forged_value
        forged_identity = {
            "selectionId": forged_outcome["selectionId"],
            "selectionRecordHash": forged_outcome["selectionRecordHash"],
            "benchmarkRunId": forged_outcome["benchmark"]["runId"],
            "benchmarkAuditHash": forged_outcome["benchmark"]["auditHash"],
            "items": forged_outcome["items"],
            "summary": forged_outcome["summary"],
        }
        forged_review_id = (
            "market-ai-selection-review-"
            f"{canonical_sha256(forged_identity)[:32]}"
        )
        forged_outcome["reviewId"] = forged_review_id
        forged_outcome["recordHash"] = canonical_sha256(
            {
                key: value
                for key, value in forged_outcome.items()
                if key != "recordHash"
            }
        )
        connection = sqlite3.connect(service.audit_store.path)
        try:
            connection.execute(
                "update audit_events set event_id = ?, metadata_json = ? "
                "where event_id = ?",
                (
                    forged_review_id,
                    json.dumps({"review": forged_outcome}),
                    review["reviewId"],
                ),
            )
            connection.commit()
            with _raises(MarketAiSelectionError) as caught:
                service.quality_statistics()
            assert caught.value.code == "market_ai_selection_statistics_audit_invalid"
            connection.execute(
                "update audit_events set event_id = ?, metadata_json = ? "
                "where event_id = ?",
                (
                    review["reviewId"],
                    json.dumps({"review": audited_review}),
                    forged_review_id,
                ),
            )
            connection.commit()
        finally:
            connection.close()

    forged_prices = json.loads(json.dumps(audited_review))
    forged_item = forged_prices["items"][0]
    forged_item["outcomePrice"] = forged_item["referencePrice"] * 0.5
    forged_item["returnPct"] = -50.0
    forged_item["absoluteHit"] = False
    forged_item["relativeReturnPct"] = -52.0
    forged_item["benchmarkHit"] = False
    forged_prices["summary"] = (
        market_ai_selection_module._market_ai_selection_review_summary(  # noqa: SLF001
            forged_prices["items"]
        )
    )
    forged_identity = {
        "selectionId": forged_prices["selectionId"],
        "selectionRecordHash": forged_prices["selectionRecordHash"],
        "benchmarkRunId": forged_prices["benchmark"]["runId"],
        "benchmarkAuditHash": forged_prices["benchmark"]["auditHash"],
        "items": forged_prices["items"],
        "summary": forged_prices["summary"],
    }
    forged_prices_id = (
        "market-ai-selection-review-"
        f"{canonical_sha256(forged_identity)[:32]}"
    )
    forged_prices["reviewId"] = forged_prices_id
    forged_prices["recordHash"] = canonical_sha256(
        {key: value for key, value in forged_prices.items() if key != "recordHash"}
    )
    connection = sqlite3.connect(service.audit_store.path)
    try:
        connection.execute(
            "update audit_events set event_id = ?, metadata_json = ? where event_id = ?",
            (
                forged_prices_id,
                json.dumps({"review": forged_prices}),
                review["reviewId"],
            ),
        )
        connection.commit()
        with _raises(MarketAiSelectionError) as caught:
            service.quality_statistics()
        assert caught.value.code == "market_ai_selection_statistics_audit_invalid"
        connection.execute(
            "update audit_events set event_id = ?, metadata_json = ? where event_id = ?",
            (
                review["reviewId"],
                json.dumps({"review": audited_review}),
                forged_prices_id,
            ),
        )
        connection.commit()
    finally:
        connection.close()

    forged_subset = json.loads(json.dumps(audited_review))
    forged_subset["items"] = forged_subset["items"][:1]
    forged_subset["summary"] = (
        market_ai_selection_module._market_ai_selection_review_summary(  # noqa: SLF001
            forged_subset["items"]
        )
    )
    subset_identity = {
        "selectionId": forged_subset["selectionId"],
        "selectionRecordHash": forged_subset["selectionRecordHash"],
        "benchmarkRunId": forged_subset["benchmark"]["runId"],
        "benchmarkAuditHash": forged_subset["benchmark"]["auditHash"],
        "items": forged_subset["items"],
        "summary": forged_subset["summary"],
    }
    subset_review_id = (
        "market-ai-selection-review-"
        f"{canonical_sha256(subset_identity)[:32]}"
    )
    forged_subset["reviewId"] = subset_review_id
    forged_subset["recordHash"] = canonical_sha256(
        {key: value for key, value in forged_subset.items() if key != "recordHash"}
    )
    subset_detail = "matured=1 observing=0 insufficient=0 researchOnly=true"
    connection = sqlite3.connect(service.audit_store.path)
    try:
        connection.execute(
            "update audit_events set event_id = ?, detail = ?, metadata_json = ? "
            "where event_id = ?",
            (
                subset_review_id,
                subset_detail,
                json.dumps({"review": forged_subset}),
                review["reviewId"],
            ),
        )
        connection.commit()
        with _raises(MarketAiSelectionError) as caught:
            service.quality_statistics()
        assert caught.value.code == "market_ai_selection_statistics_audit_invalid"
        connection.execute(
            "update audit_events set event_id = ?, detail = ?, metadata_json = ? "
            "where event_id = ?",
            (
                review["reviewId"],
                "matured=1 observing=0 insufficient=4 researchOnly=true",
                json.dumps({"review": audited_review}),
                subset_review_id,
            ),
        )
        connection.commit()
    finally:
        connection.close()

    connection = sqlite3.connect(run_store.path)
    try:
        connection.execute(
            "update research_runs set symbol = ? where run_id = ?",
            ("600519", "run-selected-candidate"),
        )
        connection.commit()
        with _raises(MarketAiSelectionError) as caught:
            service.quality_statistics()
        assert caught.value.code == "market_ai_selection_statistics_audit_invalid"
        connection.execute(
            "update research_runs set symbol = ? where run_id = ?",
            (selected_symbol["value"], "run-selected-candidate"),
        )
        connection.commit()
    finally:
        connection.close()

    forged_benchmark = json.loads(json.dumps(audited_review))
    forged_benchmark["benchmark"]["symbol"] = "SPY"
    forged_benchmark["recordHash"] = canonical_sha256(
        {
            key: value
            for key, value in forged_benchmark.items()
            if key != "recordHash"
        }
    )
    connection = sqlite3.connect(service.audit_store.path)
    try:
        connection.execute(
            "update audit_events set metadata_json = ? where event_id = ?",
            (json.dumps({"review": forged_benchmark}), review["reviewId"]),
        )
        connection.commit()
        with _raises(MarketAiSelectionError) as caught:
            service.quality_statistics()
        assert caught.value.code == "market_ai_selection_statistics_audit_invalid"
        connection.execute(
            "update audit_events set metadata_json = ? where event_id = ?",
            (json.dumps({"review": audited_review}), review["reviewId"]),
        )
        connection.commit()
    finally:
        connection.close()

    review_bars["000300"] = [_review_bar("000300", reference_at, 200)]
    degraded = service.review(
        {
            "selectionId": selection["selectionId"],
            "benchmarkRunId": "run-benchmark",
        }
    )
    assert degraded["items"][0]["status"] == "data_insufficient"
    assert degraded["items"][0]["reason"] == "benchmark_same_period_coverage_missing"
    assert degraded["items"][0]["returnPct"] == 10.0
    assert degraded["summary"]["maturedCount"] == 1
    assert degraded["summary"]["absoluteSampleCount"] == 1
    assert degraded["summary"]["benchmarkSampleCount"] == 0

    completed_event = service.audit_store.get(review["reviewId"])
    assert completed_event is not None
    forged = json.loads(json.dumps(audited_review))
    forged["boundary"]["affectsRisk"] = True
    forged["recordHash"] = canonical_sha256(
        {key: value for key, value in forged.items() if key != "recordHash"}
    )
    connection = sqlite3.connect(service.audit_store.path)
    try:
        connection.execute(
            "update audit_events set metadata_json = ? where event_id = ?",
            (json.dumps({"review": forged}), review["reviewId"]),
        )
        connection.commit()
    finally:
        connection.close()
    review_bars["000300"] = [
        _review_bar("000300", reference_at, 200),
        *[
            _review_bar(
                "000300",
                reference_at + timedelta(days=index),
                204 if index == 5 else 200,
            )
            for index in range(1, 6)
        ],
        _review_bar("000300", evaluated_at, 900),
    ]
    with _raises(MarketAiSelectionError) as caught:
        service.review(
            {
                "selectionId": selection["selectionId"],
                "benchmarkRunId": "run-benchmark",
            }
        )
    assert caught.value.code == "market_ai_selection_review_audit_conflict"


def test_review_blocks_truncated_or_repriced_reference_windows(
    tmp_path: object,
) -> None:
    run_store = ResearchRunStore(tmp_path / "runs.db")  # type: ignore[operator]
    review_bars: dict[str, list[OHLCVBar]] = {}

    def load_klines(
        request: object,
        limit: int,
    ) -> tuple[list[OHLCVBar], DataQuality]:
        symbol = getattr(request, "symbol")
        bars = review_bars.get(symbol) or _bars(symbol, "ashare")
        limited = bars[-limit:]
        return limited, DataQuality(
            source="test-bars",
            is_complete=True,
            rows=len(limited),
            adjustment_mode="qfq",
        )

    service = _service(
        tmp_path,
        run_store=run_store,
        discovery=_Discovery(_rows(), snapshot_hash="a" * 64),
        kline_loader=load_klines,
    )
    selection = service.select(_request(horizon="short"))
    recommendation = selection["recommendations"][0]
    evidence = resolve_market_ai_selection_research_evidence(
        {
            "selectionId": selection["selectionId"],
            "candidateEvidenceId": recommendation["evidenceId"],
        },
        audit_store=service.audit_store,
        market="ashare",
        symbol=recommendation["symbol"],
        timeframe="1d",
    )
    assert evidence is not None
    _record_review_run(
        run_store,
        run_id="run-selected-candidate",
        symbol=recommendation["symbol"],
        selection_evidence=evidence,
    )
    _record_review_run(run_store, run_id="run-benchmark", symbol="000300")

    reference_at = datetime.fromisoformat(str(evidence["referenceAt"]))
    reference_price = float(evidence["referencePrice"])
    service.clock = lambda: reference_at + timedelta(days=520)
    review_bars[recommendation["symbol"]] = [
        _review_bar(recommendation["symbol"], reference_at, reference_price),
        *[
            _review_bar(
                recommendation["symbol"],
                reference_at + timedelta(days=index),
                reference_price * 2,
            )
            for index in range(1, 511)
        ],
    ]
    review_bars["000300"] = [
        _review_bar("000300", reference_at, 200),
        _review_bar("000300", reference_at + timedelta(days=5), 204),
    ]

    truncated = service.review(
        {
            "selectionId": selection["selectionId"],
            "benchmarkRunId": "run-benchmark",
        }
    )["items"][0]
    assert truncated["status"] == "data_insufficient"
    assert truncated["reason"] == "outcome_reference_bar_missing"
    assert "returnPct" not in truncated

    review_bars[recommendation["symbol"]] = [
        _review_bar(recommendation["symbol"], reference_at, reference_price * 0.5),
        *[
            _review_bar(
                recommendation["symbol"],
                reference_at + timedelta(days=index),
                reference_price,
            )
            for index in range(1, 6)
        ],
    ]
    repriced = service.review(
        {
            "selectionId": selection["selectionId"],
            "benchmarkRunId": "run-benchmark",
        }
    )["items"][0]
    assert repriced["status"] == "data_insufficient"
    assert repriced["reason"] == "outcome_reference_price_mismatch"
    assert "returnPct" not in repriced

    review_bars[recommendation["symbol"]] = [
        _review_bar(recommendation["symbol"], reference_at, reference_price),
        *[
            _review_bar(
                recommendation["symbol"],
                reference_at + timedelta(days=index),
                reference_price,
            )
            for index in (1, 2, 6, 7, 8)
        ],
    ]
    review_bars["000300"] = [
        _review_bar("000300", reference_at, 200),
        *[
            _review_bar("000300", reference_at + timedelta(days=index), 200)
            for index in (1, 2, 6, 7, 8, 9)
        ],
    ]
    service.clock = lambda: reference_at + timedelta(days=10)
    holiday_window = service.review(
        {
            "selectionId": selection["selectionId"],
            "benchmarkRunId": "run-benchmark",
        }
    )["items"][0]
    assert holiday_window["status"] == "completed"
    assert holiday_window["completedBars"] == 5
    assert holiday_window["returnPct"] == 0.0

    review_bars[recommendation["symbol"]][-1] = _review_bar(
        recommendation["symbol"],
        reference_at + timedelta(days=9),
        reference_price,
    )
    missing_session = service.review(
        {
            "selectionId": selection["selectionId"],
            "benchmarkRunId": "run-benchmark",
        }
    )["items"][0]
    assert missing_session["status"] == "data_insufficient"
    assert missing_session["reason"] == "outcome_bar_gap"
    assert missing_session["completedBars"] == 5
    assert "returnPct" not in missing_session


def test_review_cache_fallback_requires_single_snapshot_provenance(
    tmp_path: object,
) -> None:
    from quant_core.api import _fetch_market_klines_with_cache
    from quant_core.cache import MarketDataCache

    bars = _bars("600000", "ashare", count=20)
    request = MarketDataRequest(
        market="ashare",
        symbol="600000",
        timeframe="1d",
        end=NOW,
    )

    class Adapter:
        offline = False

        def fetch_ohlcv(
            self,
            request: MarketDataRequest,
            *,
            limit: int,
        ) -> tuple[list[OHLCVBar], DataQuality]:
            if self.offline:
                raise ValueError("offline")
            return bars[-limit:], DataQuality(
                source="test-upstream",
                is_complete=True,
                rows=min(limit, len(bars)),
                adjustment_mode="qfq",
            )

    adapter = Adapter()
    cache = MarketDataCache(tmp_path / "market.db")  # type: ignore[operator]
    _fetch_market_klines_with_cache(
        cache=cache,
        adapter=adapter,
        request=request,
        limit=20,
        require_cache_provenance=True,
    )
    cache.upsert_bars(bars)
    adapter.offline = True
    cached_bars, cached_quality = _fetch_market_klines_with_cache(
        cache=cache,
        adapter=adapter,
        request=request,
        limit=20,
        require_cache_provenance=True,
    )
    assert cached_bars == bars
    assert cached_quality.is_complete is True
    assert cached_quality.source == "local-cache"
    assert cached_quality.origin_source == "test-upstream"
    assert cached_quality.adjustment_mode == "qfq"

    cache.upsert_bars([replace(bars[0], close=bars[0].close + 0.1), *bars[1:]])
    _, changed_quality = _fetch_market_klines_with_cache(
        cache=cache,
        adapter=adapter,
        request=request,
        limit=20,
        require_cache_provenance=True,
    )
    assert changed_quality.is_complete is False
    assert "Persistent cache provenance is unavailable or mixed." in changed_quality.warnings

    unknown_cache = MarketDataCache(tmp_path / "unknown-market.db")  # type: ignore[operator]
    unknown_cache.upsert_bars(bars)
    _, unknown_quality = _fetch_market_klines_with_cache(
        cache=unknown_cache,
        adapter=adapter,
        request=request,
        limit=20,
        require_cache_provenance=True,
    )
    assert unknown_quality.is_complete is False
    assert "Persistent cache provenance is unavailable or mixed." in unknown_quality.warnings


def test_review_rejects_cross_context_tampering_in_bound_research_evidence(
    tmp_path: object,
) -> None:
    run_store = ResearchRunStore(tmp_path / "runs.db")  # type: ignore[operator]
    service = _service(
        tmp_path,
        run_store=run_store,
        discovery=_Discovery(_rows(), snapshot_hash="a" * 64),
    )
    selection = service.select(_request(horizon="short"))
    recommendation = selection["recommendations"][0]
    evidence = resolve_market_ai_selection_research_evidence(
        {
            "selectionId": selection["selectionId"],
            "candidateEvidenceId": recommendation["evidenceId"],
        },
        audit_store=service.audit_store,
        market="ashare",
        symbol=recommendation["symbol"],
        timeframe="1d",
    )
    assert evidence is not None
    _record_review_run(
        run_store,
        run_id="run-selected-candidate",
        symbol=recommendation["symbol"],
        selection_evidence=evidence,
    )
    _record_review_run(run_store, run_id="run-benchmark", symbol="000300")
    connection = sqlite3.connect(run_store.path)
    try:
        connection.execute(
            "update research_runs set symbol = ? where run_id = ?",
            ("600999", "run-selected-candidate"),
        )
        connection.commit()
    finally:
        connection.close()

    with _raises(MarketAiSelectionError) as caught:
        service.review(
            {
                "selectionId": selection["selectionId"],
                "benchmarkRunId": "run-benchmark",
            }
        )

    assert caught.value.status == 409
    assert caught.value.code == "market_ai_selection_review_research_binding_invalid"


def test_review_http_rejects_browser_return_facts_and_maps_missing_benchmark(
    tmp_path: object,
) -> None:
    from http.client import HTTPConnection
    from http.server import HTTPServer
    from threading import Thread

    from quant_core.api import QuantApiHandler

    run_store = ResearchRunStore(tmp_path / "runs.db")  # type: ignore[operator]
    service = _service(
        tmp_path,
        run_store=run_store,
        discovery=_Discovery(_rows(), snapshot_hash="a" * 64),
    )
    selection = service.select(_request(horizon="short"))
    registry = _registry()

    class TestHandler(QuantApiHandler):
        market_ai_selection_service = service

        def _effective_platform_settings_environment(self) -> dict[str, str]:
            return {}

        def _current_ai_review_provider_registry(self) -> AiReviewProviderRegistry:
            return registry

        def log_message(self, format: str, *args: object) -> None:
            return

    server = HTTPServer(("127.0.0.1", 0), TestHandler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    connection = HTTPConnection(
        server.server_address[0],
        server.server_address[1],
        timeout=5,
    )

    def post(body: dict[str, object]) -> tuple[int, dict[str, object]]:
        raw = json.dumps(body).encode("utf-8")
        connection.request(
            "POST",
            "/api/market/ai-selection-reviews",
            body=raw,
            headers={
                "Content-Type": "application/json",
                "Content-Length": str(len(raw)),
            },
        )
        response = connection.getresponse()
        return response.status, json.loads(response.read().decode("utf-8"))

    try:
        invalid = post(
            {
                "selectionId": selection["selectionId"],
                "benchmarkRunId": "run-browser",
                "returnPct": 99,
            }
        )
        missing = post(
            {
                "selectionId": selection["selectionId"],
                "benchmarkRunId": "run-missing",
            }
        )
    finally:
        connection.close()
        server.shutdown()
        thread.join(timeout=5)
        server.server_close()

    assert invalid == (
        400,
        {
            "error": "invalid_market_ai_selection_review_request",
            "detail": "复盘请求只能提交选股记录与已审计基准运行身份。",
        },
    )
    assert missing == (
        404,
        {
            "error": "market_ai_selection_review_benchmark_not_found",
            "detail": "未找到已审计基准研究运行。",
        },
    )


def test_review_audit_events_cannot_be_imported_from_the_browser() -> None:
    with _raises(ValueError) as caught:
        research_run_import_audit_events(
            {
                "auditEvents": [
                    {
                        "schemaVersion": 1,
                        "eventId": "market-ai-selection-review-forged",
                        "eventType": "market_ai_selection_review",
                        "runId": "run-benchmark",
                        "createdAt": NOW.isoformat(),
                        "stage": "market_ai_selection_review",
                        "source": "browser-import",
                        "summary": "forged",
                        "detail": "forged",
                        "metadata": {"review": {"returnPct": 999}},
                    }
                ]
            },
            run_id="run-benchmark",
        )
    assert str(caught.value) == "production_authority_audit_event_import_forbidden"


class MarketAiSelectionTests(unittest.TestCase):
    def _with_tmp(self, function: object) -> None:
        with TemporaryDirectory() as directory:
            function(Path(directory))  # type: ignore[operator]

    def test_request_is_strict_and_rejects_browser_candidates(self) -> None:
        test_request_is_strict_and_rejects_browser_candidates()

    def test_all_profiles_and_winsorized_scores_stay_in_zero_to_one_hundred(
        self,
    ) -> None:
        test_all_profiles_and_winsorized_scores_stay_in_zero_to_one_hundred()

    def test_local_selection_uses_backend_100_to_20_to_5_and_audits(self) -> None:
        self._with_tmp(test_local_selection_uses_backend_100_to_20_to_5_and_audits)

    def test_quality_statistics_replay_audited_selection_metrics_and_samples(
        self,
    ) -> None:
        self._with_tmp(
            test_quality_statistics_replay_audited_selection_metrics_and_samples
        )

    def test_quality_statistics_reject_cross_context_audit_tampering(self) -> None:
        self._with_tmp(test_quality_statistics_reject_cross_context_audit_tampering)

    def test_selection_identity_is_recomputed_during_protected_replay(self) -> None:
        self._with_tmp(test_selection_identity_is_recomputed_during_protected_replay)

    def test_real_http_handler_is_idempotent_and_rejects_browser_candidates(
        self,
    ) -> None:
        self._with_tmp(
            test_real_http_handler_is_idempotent_and_rejects_browser_candidates
        )

    def test_external_ai_can_choose_candidate_six_and_is_idempotent(self) -> None:
        self._with_tmp(test_external_ai_can_choose_candidate_six_and_is_idempotent)

    def test_invalid_ai_output_falls_back_without_claiming_ai_success(self) -> None:
        self._with_tmp(test_invalid_ai_output_falls_back_without_claiming_ai_success)

    def test_provider_runtime_change_invalidates_old_fallback_identity(self) -> None:
        self._with_tmp(
            test_provider_runtime_change_invalidates_old_fallback_identity
        )

    def test_token_unlock_news_is_not_misclassified_as_a_secret(self) -> None:
        self._with_tmp(test_token_unlock_news_is_not_misclassified_as_a_secret)

    def test_actual_api_key_text_blocks_external_provider_call(self) -> None:
        self._with_tmp(test_actual_api_key_text_blocks_external_provider_call)

    def test_no_eligible_candidate_returns_409_before_provider(self) -> None:
        self._with_tmp(test_no_eligible_candidate_returns_409_before_provider)

    def test_uncompleted_daily_bar_cannot_change_selection(self) -> None:
        self._with_tmp(test_uncompleted_daily_bar_cannot_change_selection)

    def test_discovery_failure_is_normalized_to_502(self) -> None:
        self._with_tmp(test_discovery_failure_is_normalized_to_502)

    def test_discovery_requires_real_non_future_observed_at(self) -> None:
        self._with_tmp(test_discovery_requires_real_non_future_observed_at)

    def test_invalid_sec_user_agent_is_a_deterministic_exclusion(self) -> None:
        self._with_tmp(test_invalid_sec_user_agent_is_a_deterministic_exclusion)

    def test_us_watchlist_rejects_stale_quote_timestamp(self) -> None:
        self._with_tmp(test_us_watchlist_rejects_stale_quote_timestamp)

    def test_us_watchlist_accepts_last_session_quote_on_weekend(self) -> None:
        self._with_tmp(test_us_watchlist_accepts_last_session_quote_on_weekend)

    def test_coingecko_mapping_is_exact_and_ambiguous_pairs_are_rejected(self) -> None:
        test_coingecko_mapping_is_exact_and_ambiguous_pairs_are_rejected()

    def test_crypto_mapping_and_market_facts_are_loaded_once_in_batches(self) -> None:
        self._with_tmp(test_crypto_mapping_and_market_facts_are_loaded_once_in_batches)

    def test_crypto_selection_keeps_verified_mapping_when_later_page_fails(
        self,
    ) -> None:
        self._with_tmp(
            test_crypto_selection_keeps_verified_mapping_when_later_page_fails
        )

    def test_crypto_rejects_future_or_stale_coingecko_source_facts(self) -> None:
        self._with_tmp(test_crypto_rejects_future_or_stale_coingecko_source_facts)

    def test_crypto_market_fact_omissions_are_negative_cached_idempotently(
        self,
    ) -> None:
        self._with_tmp(
            test_crypto_market_fact_omissions_are_negative_cached_idempotently
        )

    def test_crypto_market_fact_source_failure_is_an_explicit_candidate_exclusion(
        self,
    ) -> None:
        self._with_tmp(
            test_crypto_market_fact_source_failure_is_an_explicit_candidate_exclusion
        )

    def test_crypto_market_fact_source_failure_is_not_reported_as_budget_timeout(
        self,
    ) -> None:
        self._with_tmp(
            test_crypto_market_fact_source_failure_is_not_reported_as_budget_timeout
        )

    def test_coingecko_mapping_detects_ambiguity_across_pages(self) -> None:
        self._with_tmp(test_coingecko_mapping_detects_ambiguity_across_pages)

    def test_cache_rejects_values_written_in_the_future(self) -> None:
        self._with_tmp(test_cache_rejects_values_written_in_the_future)

    def test_default_json_fetch_respects_remaining_deadline(self) -> None:
        self._with_tmp(test_default_json_fetch_respects_remaining_deadline)

    def test_sec_requests_are_rate_limited_to_eight_per_second(self) -> None:
        self._with_tmp(test_sec_requests_are_rate_limited_to_eight_per_second)

    def test_sec_companyfacts_obeys_filing_cutoff(self) -> None:
        test_sec_companyfacts_obeys_filing_cutoff()

    def test_ashare_source_comparison_verifies_or_blocks_conflict(self) -> None:
        test_ashare_source_comparison_verifies_or_blocks_conflict()

    def test_ashare_fact_conflict_keeps_the_auditable_exclusion_cause(
        self,
    ) -> None:
        self._with_tmp(
            test_ashare_fact_conflict_keeps_the_auditable_exclusion_cause
        )

    def test_provider_output_rejects_unknown_reference_and_trade_field(self) -> None:
        test_provider_output_rejects_unknown_reference_and_trade_field()

    def test_news_loader_stops_when_shared_evidence_budget_is_exhausted(self) -> None:
        self._with_tmp(
            test_news_loader_stops_when_shared_evidence_budget_is_exhausted
        )

    def test_blocking_news_read_cannot_exceed_shared_budget(self) -> None:
        self._with_tmp(test_blocking_news_read_cannot_exceed_shared_budget)

    def test_news_content_change_changes_selection_identity(self) -> None:
        self._with_tmp(test_news_content_change_changes_selection_identity)

    def test_review_keeps_unreached_recommendations_observing_and_reports_sample_sizes(
        self,
    ) -> None:
        self._with_tmp(
            test_review_keeps_unreached_recommendations_observing_and_reports_sample_sizes
        )

    def test_review_calculates_expiry_idempotently_and_rejects_audit_conflicts(
        self,
    ) -> None:
        self._with_tmp(
            test_review_calculates_expiry_idempotently_and_rejects_audit_conflicts
        )

    def test_review_rejects_cross_context_tampering_in_bound_research_evidence(
        self,
    ) -> None:
        self._with_tmp(
            test_review_rejects_cross_context_tampering_in_bound_research_evidence
        )

    def test_review_blocks_truncated_or_repriced_reference_windows(self) -> None:
        self._with_tmp(test_review_blocks_truncated_or_repriced_reference_windows)

    def test_review_cache_fallback_requires_single_snapshot_provenance(self) -> None:
        self._with_tmp(
            test_review_cache_fallback_requires_single_snapshot_provenance
        )

    def test_review_http_rejects_browser_return_facts_and_maps_missing_benchmark(
        self,
    ) -> None:
        self._with_tmp(
            test_review_http_rejects_browser_return_facts_and_maps_missing_benchmark
        )

    def test_review_audit_events_cannot_be_imported_from_the_browser(self) -> None:
        test_review_audit_events_cannot_be_imported_from_the_browser()
