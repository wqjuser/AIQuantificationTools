from __future__ import annotations

import math
from collections.abc import Mapping, Sequence
from datetime import datetime
from typing import Any, Callable

from quant_core.canonical import canonical_sha256, normalize_snapshot_bars
from quant_core.data_foundation import market_data_gap_count
from quant_core.domain import DataQuality, MarketDataRequest, OHLCVBar
from quant_core.runs import ResearchRunAudit

from .audit_validation import (
    _market_ai_selection_review_boundary,
    _market_ai_selection_review_summary,
    _market_ai_selection_benchmark_run_hash,
    _market_ai_selection_run_hash,
    _public_market_ai_selection_review,
)
from .candidate_scoring import _completed_daily_bars
from .common import _as_utc, _finite_or_none, _parse_datetime
from .contracts import _REVIEW_SCHEMA_VERSION, MarketAiSelectionError
from .research_evidence import resolve_market_ai_selection_research_evidence

class _ReviewMixin:
    def review(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        if not isinstance(payload, Mapping) or set(payload) != {
            "selectionId",
            "benchmarkRunId",
        }:
            raise MarketAiSelectionError(
                "invalid_market_ai_selection_review_request",
                400,
                "复盘请求只能提交选股记录与已审计基准运行身份。",
            )
        selection_id = str(payload.get("selectionId") or "").strip()
        benchmark_run_id = str(payload.get("benchmarkRunId") or "").strip()
        if not selection_id or not benchmark_run_id:
            raise MarketAiSelectionError(
                "invalid_market_ai_selection_review_request",
                400,
                "请选择选股记录与已审计基准运行。",
            )
        if self.run_store is None:
            raise MarketAiSelectionError(
                "market_ai_selection_review_store_unavailable",
                503,
                "研究审计存储暂不可用。",
            )
        try:
            benchmark_run = self.run_store.get(benchmark_run_id)
            bound_runs = self.run_store.list_by_market_ai_selection(selection_id)
        except ValueError as error:
            raise MarketAiSelectionError(
                "market_ai_selection_review_research_binding_invalid",
                409,
                "研究运行与已绑定 AI 选股证据的上下文或哈希不一致。",
            ) from error
        if benchmark_run is None:
            raise MarketAiSelectionError(
                "market_ai_selection_review_benchmark_not_found",
                404,
                "未找到已审计基准研究运行。",
            )
        return self._record_review(
            selection_id,
            benchmark_run=benchmark_run,
            bound_runs=bound_runs,
            require_research_binding=True,
            evaluated_at=_as_utc(self.clock()),
        )

    def _record_review(
        self,
        selection_id: str,
        *,
        benchmark_run: ResearchRunAudit,
        bound_runs: Sequence[ResearchRunAudit],
        require_research_binding: bool,
        evaluated_at: datetime,
        benchmark_policy_version: str | None = None,
        lease_guard: Callable[[], bool] | None = None,
    ) -> dict[str, Any]:
        evidence_rows = self._review_evidence(selection_id)
        market = evidence_rows[0]["market"]
        if (
            benchmark_run.market != market
            or benchmark_run.timeframe != "1d"
            or _as_utc(benchmark_run.created_at) > evaluated_at
        ):
            raise MarketAiSelectionError(
                "market_ai_selection_review_benchmark_context_mismatch",
                409,
                "基准研究运行与选股市场或日线周期不一致。",
            )
        if (
            benchmark_run.data_quality.get("isComplete") is not True
            or benchmark_run.data_snapshot.get("isComplete") is not True
        ):
            raise MarketAiSelectionError(
                "market_ai_selection_review_benchmark_incomplete",
                409,
                "基准研究运行缺少完整的已审计数据快照。",
            )
        items = [
            self._review_item(
                evidence,
                bound_runs=bound_runs,
                benchmark_run=benchmark_run,
                evaluated_at=evaluated_at,
                require_research_binding=require_research_binding,
            )
            for evidence in evidence_rows
        ]
        summary = _market_ai_selection_review_summary(items)
        automatic_fields = (
            {
                "reviewMode": "automatic_fixed_benchmark",
                "benchmarkPolicyVersion": benchmark_policy_version,
            }
            if benchmark_policy_version
            else {}
        )
        identity = {
            "selectionId": selection_id,
            "selectionRecordHash": evidence_rows[0]["selectionRecordHash"],
            "benchmarkRunId": benchmark_run.run_id,
            "benchmarkAuditHash": (
                _market_ai_selection_benchmark_run_hash(benchmark_run)
                if benchmark_policy_version
                else _market_ai_selection_run_hash(benchmark_run)
            ),
            "items": items,
            "summary": summary,
            **automatic_fields,
        }
        review_id = f"market-ai-selection-review-{canonical_sha256(identity)[:32]}"
        artifact_without_hash: dict[str, Any] = {
            "schemaVersion": _REVIEW_SCHEMA_VERSION,
            "recordType": "aiqt.marketAiSelectionReview",
            "reviewId": review_id,
            "selectionId": selection_id,
            "selectionRecordHash": evidence_rows[0]["selectionRecordHash"],
            "createdAt": evaluated_at.isoformat(),
            "market": market,
            "timeframe": "1d",
            "benchmark": {
                "runId": benchmark_run.run_id,
                "symbol": benchmark_run.symbol,
                "auditHash": identity["benchmarkAuditHash"],
            },
            "items": items,
            "summary": summary,
            "boundary": _market_ai_selection_review_boundary(),
            **automatic_fields,
        }
        artifact = {
            **artifact_without_hash,
            "recordHash": canonical_sha256(artifact_without_hash),
        }
        audit_summary = "AI 选股到期表现已按已审计基准复盘。"
        audit_detail = (
            f"matured={summary['maturedCount']} "
            f"observing={summary['observingCount']} "
            f"insufficient={summary['dataInsufficientCount']} "
            "researchOnly=true"
        )
        if lease_guard is not None and not lease_guard():
            raise RuntimeError("public_lease_lost")
        stored, _ = self.audit_store.record_if_absent(
            {
                "schemaVersion": 1,
                "eventId": review_id,
                "eventType": "market_ai_selection_review",
                "runId": None,
                "createdAt": artifact["createdAt"],
                "stage": "market_ai_selection_review",
                "source": "audited-selection-and-market-data",
                "summary": audit_summary,
                "detail": audit_detail,
                "metadata": {"review": artifact},
            }
        )
        stored_review = stored.metadata.get("review")
        if (
            stored.event_id != review_id
            or stored.event_type != "market_ai_selection_review"
            or stored.run_id is not None
            or stored.stage != "market_ai_selection_review"
            or stored.source != "audited-selection-and-market-data"
            or stored.summary != audit_summary
            or stored.detail != audit_detail
            or set(stored.metadata) != {"review"}
            or not isinstance(stored_review, Mapping)
            or stored_review.get("reviewId") != review_id
            or stored_review.get("recordHash")
            != canonical_sha256(
                {key: value for key, value in stored_review.items() if key != "recordHash"}
            )
            or {
                key: value
                for key, value in stored_review.items()
                if key not in {"createdAt", "recordHash"}
            }
            != {
                key: value
                for key, value in artifact.items()
                if key not in {"createdAt", "recordHash"}
            }
            or _parse_datetime(stored_review.get("createdAt"))
            != _as_utc(stored.created_at)
        ):
            raise MarketAiSelectionError(
                "market_ai_selection_review_audit_conflict",
                409,
                "已有复盘审计记录与当前证据冲突。",
            )
        return _public_market_ai_selection_review(stored_review)

    def _review_evidence(self, selection_id: str) -> list[dict[str, Any]]:
            record = self.audit_store.get(f"market-ai-selection-{selection_id}")
            artifact = record.metadata.get("artifact") if record is not None else None
            result = artifact.get("result") if isinstance(artifact, Mapping) else None
            recommendations = (
                result.get("recommendations") if isinstance(result, Mapping) else None
            )
            candidates = (
                artifact.get("evidenceCandidates")
                if isinstance(artifact, Mapping)
                else None
            )
            if (
                record is None
                or record.event_type != "market_ai_selection"
                or not isinstance(recommendations, Sequence)
                or isinstance(recommendations, (str, bytes))
                or not isinstance(candidates, Sequence)
                or isinstance(candidates, (str, bytes))
                or not recommendations
            ):
                raise MarketAiSelectionError(
                    "market_ai_selection_review_source_not_found",
                    404,
                    "未找到可复盘的受保护 AI 选股记录。",
                )
            evidence_rows: list[dict[str, Any]] = []
            try:
                for recommendation in recommendations:
                    if not isinstance(recommendation, Mapping):
                        raise ValueError("market_ai_selection_origin_invalid")
                    evidence_id = str(recommendation.get("evidenceId") or "")
                    candidate = next(
                        (
                            row
                            for row in candidates
                            if isinstance(row, Mapping)
                            and str(row.get("evidenceId") or "") == evidence_id
                        ),
                        None,
                    )
                    if candidate is None:
                        raise ValueError("market_ai_selection_origin_candidate_mismatch")
                    evidence = resolve_market_ai_selection_research_evidence(
                        {
                            "selectionId": selection_id,
                            "candidateEvidenceId": evidence_id,
                        },
                        audit_store=self.audit_store,
                        market=str(candidate.get("market") or ""),
                        symbol=str(candidate.get("symbol") or ""),
                        timeframe="1d",
                    )
                    if evidence is None:
                        raise ValueError("market_ai_selection_origin_invalid")
                    evidence_rows.append(evidence)
            except ValueError as error:
                raise MarketAiSelectionError(
                    "market_ai_selection_review_source_invalid",
                    409,
                    "AI 选股审计证据结构或哈希校验失败。",
                ) from error
            return sorted(evidence_rows, key=lambda item: item["rank"])

    def _review_item(
            self,
            evidence: Mapping[str, Any],
            *,
            bound_runs: Sequence[ResearchRunAudit],
            benchmark_run: ResearchRunAudit,
            evaluated_at: datetime,
            require_research_binding: bool,
        ) -> dict[str, Any]:
            base = {
                "candidateEvidenceId": evidence["candidateEvidenceId"],
                "rank": evidence["rank"],
                "tier": evidence["tier"],
                "market": evidence["market"],
                "symbol": evidence["symbol"],
                "timeframe": "1d",
                "horizon": evidence["horizon"],
                "horizonBars": evidence["horizonBars"],
                "referenceAt": evidence["referenceAt"],
                "referencePrice": evidence["referencePrice"],
            }
            matching_runs = [
                run
                for run in bound_runs
                if run.data_snapshot.get("marketAiSelectionEvidence") == evidence
                and _as_utc(run.created_at) <= evaluated_at
            ]
            if require_research_binding and not matching_runs:
                return {
                    **base,
                    "status": "data_insufficient",
                    "reason": "research_evidence_not_bound",
                }
            if matching_runs:
                base["researchRunId"] = matching_runs[0].run_id
            try:
                bars, quality = self.review_kline_loader(
                    MarketDataRequest(
                        market=evidence["market"],
                        symbol=evidence["symbol"],
                        timeframe="1d",
                        end=evaluated_at,
                    ),
                    500,
                )
            except Exception:
                return {
                    **base,
                    "status": "data_insufficient",
                    "reason": "outcome_bars_unavailable",
                }
            if not isinstance(quality, DataQuality) or not quality.is_complete:
                return {
                    **base,
                    "status": "data_insufficient",
                    "reason": "outcome_bars_incomplete",
                }
            if any(
                not isinstance(bar, OHLCVBar)
                or bar.market != evidence["market"]
                or bar.symbol != evidence["symbol"]
                or bar.timeframe != "1d"
                for bar in bars
            ):
                return {
                    **base,
                    "status": "data_insufficient",
                    "reason": "outcome_bar_context_mismatch",
                }
            reference_at = _parse_datetime(evidence["referenceAt"])
            if reference_at is None:
                return {
                    **base,
                    "status": "data_insufficient",
                    "reason": "reference_time_invalid",
                }
            reference_price = _finite_or_none(evidence["referencePrice"])
            completed_window = _completed_daily_bars(bars, cutoff=evaluated_at)
            completed = [
                bar
                for bar in completed_window
                if _as_utc(bar.timestamp) > reference_at
            ]
            horizon_bars = int(evidence["horizonBars"])
            matured_fields = (
                {"completedBars": horizon_bars, "remainingBars": 0}
                if len(completed) >= horizon_bars
                else {}
            )
            reference_bar = next(
                (
                    bar
                    for bar in completed_window
                    if _as_utc(bar.timestamp) == reference_at
                ),
                None,
            )
            if reference_bar is None:
                return {
                    **base,
                    **matured_fields,
                    "status": "data_insufficient",
                    "reason": "outcome_reference_bar_missing",
                }
            if (
                reference_price is None
                or reference_price <= 0
                or not math.isclose(
                    float(reference_bar.close),
                    reference_price,
                    rel_tol=1e-9,
                    abs_tol=1e-9,
                )
            ):
                return {
                    **base,
                    **matured_fields,
                    "status": "data_insufficient",
                    "reason": "outcome_reference_price_mismatch",
                }
            if len(completed) < horizon_bars:
                return {
                    **base,
                    "status": "observing",
                    "completedBars": len(completed),
                    "remainingBars": horizon_bars - len(completed),
                }
            outcome_bars = completed[:horizon_bars]
            if evidence["market"] == "crypto" and market_data_gap_count(
                MarketDataRequest(
                    market=evidence["market"],
                    symbol=evidence["symbol"],
                    timeframe="1d",
                    start=reference_at,
                    end=_as_utc(outcome_bars[-1].timestamp),
                ),
                [reference_bar, *outcome_bars],
            ):
                return {
                    **base,
                    "completedBars": horizon_bars,
                    "remainingBars": 0,
                    "status": "data_insufficient",
                    "reason": "outcome_bar_gap",
                }
            outcome_price = _finite_or_none(outcome_bars[-1].close)
            if outcome_price is None or outcome_price <= 0:
                return {
                    **base,
                    "completedBars": horizon_bars,
                    "remainingBars": 0,
                    "status": "data_insufficient",
                    "reason": "review_price_invalid",
                }
            try:
                normalized_outcome_bars = normalize_snapshot_bars(outcome_bars)
                outcome_hash = canonical_sha256(normalized_outcome_bars)
            except ValueError:
                return {
                    **base,
                    "completedBars": horizon_bars,
                    "remainingBars": 0,
                    "status": "data_insufficient",
                    "reason": "review_bar_window_invalid",
                }
            outcome_at = _as_utc(outcome_bars[-1].timestamp)
            return_pct = round((outcome_price / reference_price - 1) * 100, 6)
            matured = {
                **base,
                "completedBars": horizon_bars,
                "remainingBars": 0,
                "outcomeAt": outcome_at.isoformat(),
                "outcomePrice": outcome_price,
                "returnPct": return_pct,
                "absoluteHit": return_pct > 0,
                "outcomeSource": quality.origin_source or quality.source,
                "outcomeAdjustmentMode": quality.adjustment_mode,
                "outcomeDataHash": outcome_hash,
                "outcomeBars": normalized_outcome_bars,
            }
            return self._completed_review_item(
                matured,
                evidence=evidence,
                benchmark_run=benchmark_run,
                evaluated_at=evaluated_at,
                outcome_timestamps=tuple(
                    _as_utc(bar.timestamp) for bar in outcome_bars
                ),
            )

    def _completed_review_item(
            self,
            base: Mapping[str, Any],
            *,
            evidence: Mapping[str, Any],
            benchmark_run: ResearchRunAudit,
            evaluated_at: datetime,
            outcome_timestamps: Sequence[datetime],
        ) -> dict[str, Any]:
            if benchmark_run.symbol == evidence["symbol"]:
                return {
                    **base,
                    "status": "data_insufficient",
                    "reason": "benchmark_must_use_different_symbol",
                }
            snapshot = benchmark_run.data_snapshot
            quality = benchmark_run.data_quality
            raw_bars = snapshot.get("bars") if isinstance(snapshot, Mapping) else None
            try:
                benchmark_bars = normalize_snapshot_bars(raw_bars) if isinstance(raw_bars, list) else []
            except ValueError:
                benchmark_bars = []
            if (
                not benchmark_bars
                or snapshot.get("hash") != canonical_sha256(benchmark_bars)
                or quality.get("isComplete") is not True
            ):
                return {
                    **base,
                    "status": "data_insufficient",
                    "reason": "benchmark_bars_incomplete",
                }
            benchmark_adjustment_mode = str(
                snapshot.get("adjustmentMode") or quality.get("adjustmentMode") or ""
            )
            if benchmark_adjustment_mode != base["outcomeAdjustmentMode"]:
                return {
                    **base,
                    "status": "data_insufficient",
                    "reason": "benchmark_adjustment_mode_mismatch",
                }
            if (
                benchmark_run.market != evidence["market"]
                or benchmark_run.symbol == evidence["symbol"]
                or benchmark_run.timeframe != "1d"
            ):
                return {
                    **base,
                    "status": "data_insufficient",
                    "reason": "benchmark_bar_context_mismatch",
                }
            reference_at = _parse_datetime(evidence["referenceAt"])
            outcome_at = _parse_datetime(base["outcomeAt"])
            if reference_at is None or outcome_at is None:
                return {
                    **base,
                    "status": "data_insufficient",
                    "reason": "review_bar_window_invalid",
                }
            benchmark_by_time = {
                parsed: bar
                for bar in benchmark_bars
                if (parsed := _parse_datetime(bar.get("timestamp"))) is not None
                and parsed <= evaluated_at
            }
            benchmark_start = benchmark_by_time.get(reference_at)
            benchmark_end = benchmark_by_time.get(outcome_at)
            if benchmark_start is None or benchmark_end is None:
                return {
                    **base,
                    "status": "data_insufficient",
                    "reason": "benchmark_same_period_coverage_missing",
                }
            if evidence["market"] != "crypto" and tuple(
                timestamp
                for timestamp in sorted(benchmark_by_time)
                if reference_at < timestamp <= outcome_at
            ) != tuple(outcome_timestamps):
                outcome_fields = {
                    "outcomeAt",
                    "outcomePrice",
                    "returnPct",
                    "absoluteHit",
                    "outcomeSource",
                    "outcomeAdjustmentMode",
                    "outcomeDataHash",
                    "outcomeBars",
                }
                return {
                    **{
                        key: value
                        for key, value in base.items()
                        if key not in outcome_fields
                    },
                    "status": "data_insufficient",
                    "reason": "outcome_bar_gap",
                }
            benchmark_start_price = _finite_or_none(benchmark_start.get("close"))
            benchmark_end_price = _finite_or_none(benchmark_end.get("close"))
            if (
                benchmark_start_price is None
                or benchmark_start_price <= 0
                or benchmark_end_price is None
                or benchmark_end_price <= 0
            ):
                return {
                    **base,
                    "status": "data_insufficient",
                    "reason": "review_price_invalid",
                }
            try:
                normalized_benchmark_bars = normalize_snapshot_bars(
                    [benchmark_start, benchmark_end]
                )
                benchmark_hash = canonical_sha256(normalized_benchmark_bars)
            except ValueError:
                return {
                    **base,
                    "status": "data_insufficient",
                    "reason": "review_bar_window_invalid",
                }
            benchmark_return_pct = round(
                (benchmark_end_price / benchmark_start_price - 1) * 100,
                6,
            )
            relative_return_pct = round(float(base["returnPct"]) - benchmark_return_pct, 6)
            return {
                **base,
                "status": "completed",
                "benchmarkRunId": benchmark_run.run_id,
                "benchmarkSymbol": benchmark_run.symbol,
                "benchmarkReferencePrice": benchmark_start_price,
                "benchmarkOutcomePrice": benchmark_end_price,
                "benchmarkReturnPct": benchmark_return_pct,
                "relativeReturnPct": relative_return_pct,
                "benchmarkHit": relative_return_pct > 0,
                "benchmarkSource": str(quality.get("source") or snapshot.get("source") or ""),
                "benchmarkAdjustmentMode": benchmark_adjustment_mode,
                "benchmarkDataHash": benchmark_hash,
                "benchmarkBars": normalized_benchmark_bars,
            }
