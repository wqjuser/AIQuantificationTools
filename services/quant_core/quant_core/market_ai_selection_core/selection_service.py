from __future__ import annotations

from collections.abc import Mapping, Sequence
from concurrent.futures import ThreadPoolExecutor, wait
from datetime import datetime
from typing import Any

from quant_core.canonical import canonical_sha256, normalize_snapshot_bars
from quant_core.domain import DataQuality, MarketDataRequest
from quant_core.market_discovery import MarketDiscoveryQuery

from . import contracts
from .audit_validation import _market_ai_selection_boundary
from .candidate_scoring import (
    _completed_daily_bars,
    _market_ai_selection_v1_data_gaps,
    _normalize_market_candidate,
    _prefilter_candidates,
    _score_candidates,
    _stock_valuation,
    _technical_factors,
    _validate_fundamental,
)
from .common import (
    _as_utc,
    _finite_or_none,
    _parse_datetime,
    _positive_number,
    _us_quote_is_fresh,
)
from .contracts import (
    _CRYPTO_WEIGHTS,
    _DAILY_BAR_COUNT,
    _EVIDENCE_BUDGET_SECONDS,
    _INITIAL_CANDIDATE_LIMIT,
    _SELECTION_SCHEMA_VERSION,
    _STOCK_WEIGHTS,
    MarketAiSelectionError,
    validate_market_ai_selection_request,
)
from .recommendations import (
    _attach_news,
    _exclusion,
    _provider_identity,
    _public_candidate,
)

class _SelectionMixin:
    def select(self, payload: Mapping[str, Any]) -> dict[str, Any]:
            request = validate_market_ai_selection_request(payload)
            requested_at = _as_utc(self.clock())
            source_candidates, market_snapshot, market_context, source_exclusions = (
                self._authoritative_candidates(request, generated_at=requested_at)
            )
            generated_at = max(requested_at, _as_utc(self.clock()))
            evidence_deadline = self.monotonic() + _EVIDENCE_BUDGET_SECONDS
            initial_candidates = [dict(item) for item in source_candidates]
            initial_keys = {
                (str(item["market"]), str(item["symbol"]))
                for item in initial_candidates
            }
            initial_candidates.extend(
                {
                    "market": exclusion["market"],
                    "symbol": exclusion["symbol"],
                    "name": exclusion["name"],
                }
                for exclusion in source_exclusions
                if (str(exclusion["market"]), str(exclusion["symbol"]))
                not in initial_keys
            )
            prefiltered, prefilter_exclusions = _prefilter_candidates(
                source_candidates,
                market=request["market"],
            )
            exclusions = [*source_exclusions, *prefilter_exclusions]
            if not prefiltered:
                raise MarketAiSelectionError(
                    "market_ai_selection_no_candidates",
                    409,
                    "当前筛选条件没有可用于证据组装的权威候选。",
                )
            try:
                source_timed_out, source_coverage, source_warnings = (
                    self._prepare_fundamental_sources(
                        prefiltered,
                        market=str(request["market"]),
                        cutoff=generated_at,
                        deadline=evidence_deadline,
                    )
                )
            except Exception as error:
                raise MarketAiSelectionError(
                    "market_ai_selection_fundamental_source_unavailable",
                    502,
                    "必需基本面数据源暂不可用。",
                ) from error
            if source_coverage is not None:
                market_context = {
                    **market_context,
                    "fundamentalSourceCoverage": source_coverage,
                }
            market_snapshot["warnings"] = list(
                dict.fromkeys([*market_snapshot["warnings"], *source_warnings])
            )

            evidence, evidence_exclusions, evidence_timed_out = self._assemble_evidence(
                prefiltered,
                request=request,
                generated_at=generated_at,
                deadline=evidence_deadline,
            )
            timed_out = source_timed_out or evidence_timed_out
            exclusions.extend(evidence_exclusions)
            if not evidence:
                leading_reason = (
                    evidence_exclusions[0]["reason"]
                    if evidence_exclusions
                    else "缺少合格证据。"
                )
                raise MarketAiSelectionError(
                    "market_ai_selection_no_eligible_candidates",
                    409,
                    "当前候选均未通过证据门槛，未调用 AI。"
                    f"首要原因：{leading_reason}",
                )

            scored = _score_candidates(
                evidence,
                market=request["market"],
                profile=request["profile"],
            )
            news, news_warnings = self._load_news(
                scored[:10],
                request=request,
                generated_at=generated_at,
                deadline=evidence_deadline,
            )
            _attach_news(scored, news)

            provider_identity = _provider_identity(
                self.provider_registry,
                str(request["providerId"]),
            )
            selection_identity = {
                "schemaVersion": _SELECTION_SCHEMA_VERSION,
                "request": dict(request),
                "providerIdentity": dict(provider_identity),
                "marketSnapshot": {
                    **market_snapshot,
                    "warnings": list(market_snapshot["warnings"]),
                },
                "marketContext": dict(market_context),
                "newsHash": canonical_sha256(news),
                "newsWarnings": list(news_warnings),
                "exclusions": list(exclusions),
                "timedOut": timed_out,
                "weightsVersion": contracts._WEIGHTS_VERSION,
                "evidence": [
                    {
                        "evidenceId": item["evidenceId"],
                        "evidenceHash": item["evidenceHash"],
                        "newsReferences": item["newsReferences"],
                    }
                    for item in scored
                ],
            }
            evidence_identity = canonical_sha256(selection_identity)
            selection_id = f"selection-v{_SELECTION_SCHEMA_VERSION}-{evidence_identity[:20]}"
            audit_event_id = f"market-ai-selection-{selection_id}"
            try:
                existing = self.audit_store.get(audit_event_id)
            except Exception as error:
                raise MarketAiSelectionError(
                    "market_ai_selection_audit_unavailable",
                    503,
                    "AI 选股审计存储暂不可用。",
                ) from error
            if (
                existing is not None
                and existing.event_type == "market_ai_selection"
                and isinstance(existing.metadata.get("artifact"), Mapping)
            ):
                stored_result = existing.metadata["artifact"].get("result")
                if isinstance(stored_result, Mapping):
                    return dict(stored_result)

            baseline = [_public_candidate(item) for item in scored]
            recommendations, generation = self._generate_recommendations(
                scored,
                request=request,
                news=news,
                market_context=market_context,
                market_snapshot=market_snapshot,
            )
            warnings = list(market_snapshot["warnings"])
            warnings.extend(news_warnings)
            if timed_out:
                warnings.append("证据组装达到 20 秒预算，已使用按时完成的候选。")
            if generation["status"] == "failed":
                warnings.append("AI 分析失败，已返回确定性基准榜。")
            warnings = list(dict.fromkeys(warnings))
            market_snapshot["warnings"] = warnings
            status = "partial" if warnings else "complete"
            boundary = _market_ai_selection_boundary()
            result: dict[str, Any] = {
                "selectionId": selection_id,
                "status": "partial" if status == "partial" else "completed",
                "generatedAt": generated_at.isoformat(),
                "marketSnapshot": market_snapshot,
                "baselineCandidates": baseline,
                "recommendations": recommendations,
                "exclusions": exclusions,
                "generation": generation,
                "auditEventId": audit_event_id,
                "boundary": boundary,
            }
            artifact_without_hash: dict[str, Any] = {
                "schemaVersion": _SELECTION_SCHEMA_VERSION,
                "recordType": "aiqt.marketAiSelection",
                "selectionId": selection_id,
                "generatedAt": generated_at.isoformat(),
                "request": request,
                "marketSnapshot": market_snapshot,
                "marketContext": market_context,
                "weightsVersion": contracts._WEIGHTS_VERSION,
                "selectionIdentity": selection_identity,
                "providerIdentity": provider_identity,
                "weights": (
                    _CRYPTO_WEIGHTS[request["profile"]]
                    if request["market"] == "crypto"
                    else _STOCK_WEIGHTS[request["profile"]]
                ),
                "initialCandidates": initial_candidates,
                "evidenceCandidates": scored,
                "newsEvidence": news,
                "exclusions": exclusions,
                "generation": generation,
                "boundary": boundary,
                "nextAction": "用户可逐只选择“开始研究”进入既有研究链。",
                "result": result,
            }
            artifact = {
                **artifact_without_hash,
                "recordHash": canonical_sha256(artifact_without_hash),
            }
            try:
                stored, _ = self.audit_store.record_if_absent(
                    {
                        "schemaVersion": 1,
                        "eventId": audit_event_id,
                        "eventType": "market_ai_selection",
                        "runId": None,
                        "createdAt": generated_at.isoformat(),
                        "stage": "market_ai_selection",
                        "source": "market-ai-selection",
                        "summary": "AI 选股研究候选证据已冻结。",
                        "detail": (
                            f"{request['market']} {request['profile']} "
                            f"{len(recommendations)} 个研究候选；不构成交易授权。"
                        ),
                        "metadata": {"artifact": artifact},
                    }
                )
            except Exception as error:
                raise MarketAiSelectionError(
                    "market_ai_selection_audit_unavailable",
                    503,
                    "AI 选股审计存储暂不可用。",
                ) from error
            stored_artifact = stored.metadata.get("artifact")
            if isinstance(stored_artifact, Mapping):
                stored_result = stored_artifact.get("result")
                if isinstance(stored_result, Mapping):
                    return dict(stored_result)
            return result

    def _authoritative_candidates(
            self,
            request: Mapping[str, Any],
            *,
            generated_at: datetime,
        ) -> tuple[
            list[dict[str, Any]],
            dict[str, Any],
            dict[str, Any],
            list[dict[str, Any]],
        ]:
            market = str(request["market"])
            if market == "us":
                try:
                    instruments = [
                        item
                        for item in self.watchlist_store.list_instruments()
                        if getattr(item, "market", None) == "us"
                    ][:_INITIAL_CANDIDATE_LIMIT]
                except Exception as error:
                    raise MarketAiSelectionError(
                        "market_ai_selection_watchlist_unavailable",
                        502,
                        "美股自选池暂不可用。",
                    ) from error
                candidates: list[dict[str, Any]] = []
                exclusions: list[dict[str, Any]] = []
                quote_times: list[datetime] = []
                for item in instruments:
                    quote_at = (
                        _as_utc(item.quote_as_of)
                        if isinstance(item.quote_as_of, datetime)
                        else None
                    )
                    candidate_identity = {
                        "market": "us",
                        "symbol": str(item.symbol).strip().upper(),
                        "name": str(item.name).strip(),
                    }
                    if quote_at is None:
                        exclusions.append(
                            _exclusion(
                                candidate_identity,
                                "us_quote_timestamp_missing",
                                "美股自选报价缺少真实更新时间。",
                            )
                        )
                        continue
                    if quote_at > generated_at:
                        exclusions.append(
                            _exclusion(
                                candidate_identity,
                                "us_quote_timestamp_future",
                                "美股自选报价时间晚于选股截止时间。",
                            )
                        )
                        continue
                    if not _us_quote_is_fresh(
                        quote_at,
                        cutoff=generated_at,
                    ):
                        exclusions.append(
                            _exclusion(
                                candidate_identity,
                                "us_quote_stale",
                                "美股自选报价不满足当前交易时段的新鲜度要求。",
                            )
                        )
                        continue
                    quote_times.append(quote_at)
                    candidates.append(
                        {
                        "market": "us",
                        "symbol": str(item.symbol).strip().upper(),
                        "name": str(item.name).strip(),
                        "price": _finite_or_none(item.price),
                        "changePct": _finite_or_none(item.change_pct),
                        "amount": None,
                        "turnoverRate": None,
                        "peRatio": None,
                        "pbRatio": None,
                        "marketCap": None,
                        "source": str(item.quote_source or "watchlist"),
                        "observedAt": quote_at.isoformat(),
                        }
                    )
                if not candidates:
                    reason = (
                        exclusions[0]["reason"]
                        if exclusions
                        else "美股自选池没有候选。"
                    )
                    raise MarketAiSelectionError(
                        "market_ai_selection_watchlist_quotes_stale",
                        409,
                        f"美股自选池没有新鲜权威报价。首要原因：{reason}",
                    )
                snapshot_hash = canonical_sha256(candidates)
                snapshot = {
                    "snapshotHash": snapshot_hash,
                    "observedAt": max(quote_times).isoformat(),
                    "source": "watchlist",
                    "freshness": "fresh",
                    "warnings": list(
                        dict.fromkeys(
                            [
                                "美股首版仅覆盖当前自选池，不代表全市场。",
                                *(
                                    [
                                        f"已排除 {len(exclusions)} 个报价缺失、未来或过期的美股自选标的。"
                                    ]
                                    if exclusions
                                    else []
                                ),
                            ]
                        )
                    ),
                }
                return (
                    candidates,
                    snapshot,
                    {"universeCount": len(candidates)},
                    exclusions,
                )

            discovery = request["discovery"]
            try:
                result = self.discovery_service.discover(
                    MarketDiscoveryQuery(
                        market=market,
                        query=discovery["query"],
                        min_change_pct=discovery["minChangePct"],
                        max_change_pct=discovery["maxChangePct"],
                        min_amount=discovery["minAmount"],
                        min_turnover_rate=discovery["minTurnoverRate"],
                        max_pe=discovery["maxPe"],
                        sort=discovery["sort"],
                        direction=discovery["direction"],
                        limit=_INITIAL_CANDIDATE_LIMIT,
                    )
                )
            except MarketAiSelectionError:
                raise
            except Exception as error:
                raise MarketAiSelectionError(
                    "market_ai_selection_snapshot_unavailable",
                    502,
                    "权威市场候选暂不可用。",
                ) from error
            if not isinstance(result, Mapping) or result.get("market") != market:
                raise MarketAiSelectionError(
                    "market_ai_selection_snapshot_unavailable",
                    502,
                    "权威市场候选返回了无效市场快照。",
                )
            freshness = str(result.get("freshness") or "unknown")
            if freshness != "fresh":
                raise MarketAiSelectionError(
                    "market_ai_selection_snapshot_stale",
                    409,
                    "市场快照已过期，请刷新市场数据后重试。",
                )
            observed_at = _parse_datetime(result.get("observedAt"))
            if observed_at is None:
                raise MarketAiSelectionError(
                    "market_ai_selection_snapshot_timestamp_invalid",
                    409,
                    "权威市场快照缺少可验证的观察时间。",
                )
            if observed_at > max(generated_at, _as_utc(self.clock())):
                raise MarketAiSelectionError(
                    "market_ai_selection_snapshot_timestamp_invalid",
                    409,
                    "权威市场快照观察时间晚于选股截止时间。",
                )
            raw_items = result.get("items")
            if not isinstance(raw_items, list):
                raise MarketAiSelectionError(
                    "market_ai_selection_snapshot_unavailable",
                    502,
                    "权威市场快照未提供候选列表。",
                )
            candidates = [
                item
                for raw in raw_items[:_INITIAL_CANDIDATE_LIMIT]
                if (item := _normalize_market_candidate(raw, market=market)) is not None
            ]
            snapshot_hash = str(result.get("snapshotHash") or "")
            if not snapshot_hash:
                snapshot_hash = canonical_sha256(candidates)
            snapshot = {
                "snapshotHash": snapshot_hash,
                "observedAt": observed_at.isoformat(),
                "source": str(result.get("source") or "unknown"),
                "freshness": freshness,
                "warnings": [
                    str(item)
                    for item in result.get("warnings", [])
                    if isinstance(item, str) and item.strip()
                ],
            }
            context = result.get("overview")
            return (
                candidates,
                snapshot,
                dict(context) if isinstance(context, Mapping) else {},
                [],
            )

    def _assemble_evidence(
            self,
            candidates: Sequence[Mapping[str, Any]],
            *,
            request: Mapping[str, Any],
            generated_at: datetime,
            deadline: float,
        ) -> tuple[list[dict[str, Any]], list[dict[str, Any]], bool]:
            if self.monotonic() >= deadline:
                return (
                    [],
                    [
                        _exclusion(
                            candidate,
                            "evidence_timeout",
                            "证据组装达到 20 秒预算。",
                        )
                        for candidate in candidates
                    ],
                    True,
                )
            executor = ThreadPoolExecutor(
                max_workers=min(4, len(candidates)),
                thread_name_prefix="market-ai-evidence",
            )
            futures: dict[Future[Any], Mapping[str, Any]] = {
                executor.submit(
                    self._candidate_evidence,
                    candidate,
                    request=request,
                    generated_at=generated_at,
                    deadline=deadline,
                ): candidate
                for candidate in candidates
            }
            completed, pending = wait(
                futures,
                timeout=max(0.0, deadline - self.monotonic()),
            )
            evidence: list[dict[str, Any]] = []
            exclusions: list[dict[str, Any]] = []
            for future, candidate in futures.items():
                if future in pending:
                    exclusions.append(
                        _exclusion(candidate, "evidence_timeout", "证据组装超时。")
                    )
                    continue
                try:
                    value = future.result()
                except Exception:
                    value = (
                        None,
                        "evidence_source_failed",
                        "日 K 线或基本面数据源暂不可用。",
                    )
                item, code, detail = value
                if item is None:
                    exclusions.append(_exclusion(candidate, code, detail))
                else:
                    evidence.append(item)
            for future in pending:
                future.cancel()
            executor.shutdown(wait=False, cancel_futures=True)
            evidence.sort(
                key=lambda item: next(
                    index
                    for index, candidate in enumerate(candidates)
                    if candidate["symbol"] == item["symbol"]
                )
            )
            return evidence, exclusions, bool(pending)

    def _candidate_evidence(
            self,
            candidate: Mapping[str, Any],
            *,
            request: Mapping[str, Any],
            generated_at: datetime,
            deadline: float,
        ) -> tuple[dict[str, Any] | None, str, str]:
            bars, quality = self.kline_loader(
                MarketDataRequest(
                    market=request["market"],
                    symbol=str(candidate["symbol"]),
                    timeframe="1d",
                    end=generated_at,
                ),
                _DAILY_BAR_COUNT + 5,
            )
            if not isinstance(quality, DataQuality) or not quality.is_complete:
                return None, "daily_bars_incomplete", "日 K 线质量检查未通过。"
            completed = _completed_daily_bars(bars, cutoff=generated_at)
            if len(completed) < _DAILY_BAR_COUNT:
                return (
                    None,
                    "daily_bars_insufficient",
                    f"仅有 {len(completed)} 根已完成日 K 线，需要 {_DAILY_BAR_COUNT} 根。",
                )
            completed = completed[-_DAILY_BAR_COUNT:]
            normalized_bars = normalize_snapshot_bars(completed)
            factors = _technical_factors(completed)
            fundamental = self._load_fundamental(
                candidate,
                market=str(request["market"]),
                cutoff=generated_at,
                deadline=deadline,
            )
            valid, code, detail = _validate_fundamental(
                fundamental,
                market=str(request["market"]),
                profile=str(request["profile"]),
                candidate=candidate,
                cutoff=generated_at,
            )
            if not valid:
                return None, code, detail
            normalized_fundamental = dict(fundamental or {})
            if request["market"] != "crypto":
                normalized_fundamental["valuation"] = _stock_valuation(
                    candidate,
                    normalized_fundamental,
                )
                if request["profile"] == "value" and not any(
                    _positive_number(normalized_fundamental["valuation"].get(field))
                    for field in ("peRatio", "pbRatio", "psRatio")
                ):
                    return (
                        None,
                        "valuation_missing",
                        "价值风格至少需要一个可复算的市盈率、市净率或市销率。",
                    )
            evidence_id = (
                f"candidate-{request['market']}-"
                f"{str(candidate['symbol']).replace('/', '-').casefold()}"
            )
            evidence_hash = canonical_sha256(
                {
                    "candidate": candidate,
                    "dailyBars": normalized_bars,
                    "factors": factors,
                    "fundamental": normalized_fundamental,
                }
            )
            fundamental_period = (
                str(normalized_fundamental.get("currentPeriod") or "")
                if request["market"] != "crypto"
                else str(normalized_fundamental.get("observedAt") or "")
            )
            return (
                {
                    "evidenceId": evidence_id,
                    "evidenceHash": evidence_hash,
                    "market": request["market"],
                    "symbol": candidate["symbol"],
                    "name": candidate["name"],
                    "snapshot": dict(candidate),
                    "dailyBars": normalized_bars,
                    "factors": factors,
                    "fundamental": normalized_fundamental,
                    "fundamentalPeriod": fundamental_period,
                    "dataGaps": _market_ai_selection_v1_data_gaps(
                        normalized_fundamental,
                        market=str(request["market"]),
                    ),
                    "newsReferences": [],
                },
                "",
                "",
            )
