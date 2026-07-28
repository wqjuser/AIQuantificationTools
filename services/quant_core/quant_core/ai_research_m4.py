from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any, Callable

from quant_core.ai_review_runs import (
    AiReviewRunStore,
    AuthoritativeAiReviewRunRecord,
    contains_secret_like_archive_text,
)
from quant_core.audit_events import AuditEventStore
from quant_core.canonical import canonical_json, canonical_sha256
from quant_core.runs import ResearchRunAudit, ResearchRunStore


_CLAIM_KINDS = {"fact", "calculation", "assumption", "model_inference"}
_FINANCIAL_FACT_IDS = {
    "revenue",
    "net_profit",
    "operating_cash_flow",
    "total_assets",
    "shareholders_equity",
    "eps",
}
_LONG_HORIZON_TIMEFRAMES = {"1d", "1w"}
_RESEARCH_BOUNDARY = {
    "researchContextOnly": True,
    "affectsRisk": False,
    "affectsAuthorization": False,
    "affectsPermissions": False,
    "affectsOrderRouting": False,
}


class AiResearchM4Service:
    def __init__(
        self,
        *,
        review_store: AiReviewRunStore,
        run_store: ResearchRunStore,
        audit_store: AuditEventStore,
        now: Callable[[], datetime] | None = None,
    ) -> None:
        self.review_store = review_store
        self.run_store = run_store
        self.audit_store = audit_store
        self.now = now or (lambda: datetime.now(timezone.utc))

    def create_evidence(self, ai_review_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        review = self.review_store.get(ai_review_id)
        if not isinstance(review, AuthoritativeAiReviewRunRecord):
            raise ValueError("ai_research_review_not_found")
        request = _validate_evidence_request(payload)
        source_run = self.run_store.get(review.run_id)
        if source_run is None:
            raise ValueError("ai_research_source_run_not_found")
        _validate_review_run_binding(review.record, source_run)

        request_hash = canonical_sha256(
            {
                "reviewRecordHash": review.record_hash,
                "request": request,
            }
        )
        event_id = f"ai-research-evidence-{request_hash[:32]}"
        existing = self.audit_store.get(event_id)
        if existing is not None:
            return validate_ai_research_evidence(existing.metadata.get("artifact"))

        created_at = _utc(self.now())
        financial = build_financial_fact_report(
            source_run.market,
            request["financialFacts"],
        )
        claims = build_labeled_claims(review.record)
        information_richness = build_information_richness(
            claims,
            review.record,
            financial,
        )
        investment_certainty = build_investment_certainty(review.record, financial)
        multi_view = build_multi_view(
            review.record,
            timeframe=source_run.timeframe,
            enabled=request["multiViewEnabled"],
        )
        recommendation = build_research_recommendation(
            review.record,
            source_run,
            request["recommendation"],
        )
        prior_lessons = self._prior_outcome_lessons(source_run, created_at)

        artifact: dict[str, Any] = {
            "schemaVersion": 1,
            "recordType": "aiqt.aiResearchEvidence",
            "researchEvidenceId": event_id,
            "aiReviewId": review.ai_review_id,
            "sourceRunId": source_run.run_id,
            "createdAt": created_at.isoformat(),
            "market": source_run.market,
            "symbol": source_run.symbol,
            "timeframe": source_run.timeframe,
            "snapshotHash": recommendation["snapshotHash"],
            "claims": claims,
            "informationRichness": information_richness,
            "investmentCertainty": investment_certainty,
            "financialFactReport": financial,
            "multiView": multi_view,
            "recommendation": recommendation,
            "priorOutcomeLessons": prior_lessons,
            "boundary": dict(_RESEARCH_BOUNDARY),
        }
        artifact["recordHash"] = canonical_sha256(artifact)
        artifact = validate_ai_research_evidence(artifact)
        stored, _ = self.audit_store.record_if_absent(
            {
                "schemaVersion": 1,
                "eventId": event_id,
                "eventType": "ai_research_evidence",
                "runId": source_run.run_id,
                "createdAt": artifact["createdAt"],
                "stage": "m4-ai-research",
                "source": "ai-review",
                "summary": f"Recorded M4 research evidence for {review.ai_review_id}.",
                "detail": (
                    f"claims={len(claims)} financial={financial['status']} "
                    f"multiView={multi_view['status']} liveBlocked=true"
                ),
                "metadata": {"artifact": artifact},
            }
        )
        return validate_ai_research_evidence(stored.metadata.get("artifact"))

    def get_latest(self, ai_review_id: str) -> dict[str, Any] | None:
        review = self.review_store.get(ai_review_id)
        if not isinstance(review, AuthoritativeAiReviewRunRecord):
            raise ValueError("ai_research_review_not_found")
        events = self.audit_store.list_recent(
            run_id=review.run_id,
            event_type="ai_research_evidence",
            limit=50,
        )
        for event in events:
            artifact = validate_ai_research_evidence(event.metadata.get("artifact"))
            if artifact["aiReviewId"] == ai_review_id:
                return artifact
        return None

    def list_outcomes(self, ai_review_id: str) -> list[dict[str, Any]]:
        review = self.review_store.get(ai_review_id)
        if not isinstance(review, AuthoritativeAiReviewRunRecord):
            raise ValueError("ai_research_review_not_found")
        events = self.audit_store.list_recent(
            run_id=review.run_id,
            event_type="ai_research_outcome",
            limit=50,
        )
        outcomes = [
            validate_ai_research_outcome(event.metadata.get("outcome"))
            for event in events
        ]
        return [item for item in outcomes if item["aiReviewId"] == ai_review_id]

    def evaluate_outcome(self, payload: dict[str, Any]) -> dict[str, Any]:
        request = _validate_outcome_request(payload)
        evidence_event = self.audit_store.get(request["researchEvidenceId"])
        if evidence_event is None or evidence_event.event_type != "ai_research_evidence":
            raise ValueError("ai_research_evidence_not_found")
        evidence = validate_ai_research_evidence(evidence_event.metadata.get("artifact"))
        outcome_run = self.run_store.get(request["outcomeRunId"])
        benchmark_run = self.run_store.get(request["benchmarkRunId"])
        if outcome_run is None:
            raise ValueError("ai_research_outcome_run_not_found")
        if benchmark_run is None:
            raise ValueError("ai_research_benchmark_run_not_found")

        result = evaluate_recommendation_outcome(
            evidence,
            outcome_run,
            benchmark_run,
        )
        identity_hash = canonical_sha256(
            {
                "researchEvidenceId": evidence["researchEvidenceId"],
                "outcomeSnapshotHash": result["outcomeSnapshotHash"],
                "benchmarkSnapshotHash": result["benchmarkSnapshotHash"],
                "outcomeAt": result["outcomeAt"],
            }
        )
        event_id = f"ai-research-outcome-{identity_hash[:32]}"
        existing = self.audit_store.get(event_id)
        if existing is not None:
            return validate_ai_research_outcome(existing.metadata.get("outcome"))

        outcome: dict[str, Any] = {
            "schemaVersion": 1,
            "recordType": "aiqt.aiResearchOutcome",
            "outcomeId": event_id,
            "researchEvidenceId": evidence["researchEvidenceId"],
            "recommendationId": evidence["recommendation"]["recommendationId"],
            "aiReviewId": evidence["aiReviewId"],
            "sourceRunId": evidence["sourceRunId"],
            "snapshotHash": evidence["snapshotHash"],
            "createdAt": _utc(self.now()).isoformat(),
            "status": "completed",
            **result,
            "lesson": _outcome_lesson(result),
            "boundary": dict(_RESEARCH_BOUNDARY),
        }
        outcome["recordHash"] = canonical_sha256(outcome)
        outcome = validate_ai_research_outcome(outcome)
        stored, _ = self.audit_store.record_if_absent(
            {
                "schemaVersion": 1,
                "eventId": event_id,
                "eventType": "ai_research_outcome",
                "runId": evidence["sourceRunId"],
                "createdAt": outcome["createdAt"],
                "stage": "m4-ai-research-outcome",
                "source": "audited-research-runs",
                "summary": f"Evaluated M4 recommendation {outcome['recommendationId']}.",
                "detail": (
                    f"rawReturn={outcome['rawReturnPct']} "
                    f"benchmark={outcome['benchmarkReturnPct']} alpha={outcome['alphaPct']} "
                    "researchContextOnly=true"
                ),
                "metadata": {"outcome": outcome},
            }
        )
        return validate_ai_research_outcome(stored.metadata.get("outcome"))

    def _prior_outcome_lessons(
        self,
        source_run: ResearchRunAudit,
        created_at: datetime,
    ) -> list[dict[str, Any]]:
        events = self.audit_store.list_recent(
            event_type="ai_research_outcome",
            limit=50,
        )
        lessons: list[dict[str, Any]] = []
        for event in events:
            outcome = validate_ai_research_outcome(event.metadata.get("outcome"))
            if (
                event.created_at >= created_at
                or outcome["market"] != source_run.market
                or outcome["symbol"] != source_run.symbol
                or outcome["timeframe"] != source_run.timeframe
            ):
                continue
            lessons.append(
                {
                    "outcomeId": outcome["outcomeId"],
                    "recommendationId": outcome["recommendationId"],
                    "outcomeAt": outcome["outcomeAt"],
                    "stanceAdjustedReturnPct": outcome["stanceAdjustedReturnPct"],
                    "alphaPct": outcome["alphaPct"],
                    "lesson": outcome["lesson"],
                }
            )
            if len(lessons) == 5:
                break
        return lessons


def build_financial_fact_report(
    market: str,
    facts: list[dict[str, Any]],
) -> dict[str, Any]:
    if market != "ashare":
        if facts:
            raise ValueError("financial_facts_only_supported_for_ashare")
        return {
            "status": "not_applicable",
            "facts": [],
            "valuesMerged": False,
            "summary": "当前市场不适用 A 股财务事实双来源验证。",
        }
    rows = [_financial_fact_row(item) for item in facts]
    statuses = {row["status"] for row in rows}
    status = (
        "unavailable"
        if not rows
        else "blocked"
        if "blocked" in statuses
        else "warning"
        if "warning" in statuses
        else "agreement"
    )
    summary = {
        "unavailable": "尚未提供两项独立来源，财务事实验证不可用。",
        "blocked": "至少一项财务事实存在材料差异、单位或报告期冲突。",
        "warning": "财务事实存在需人工复核的来源差异。",
        "agreement": "已提供的财务事实在两项独立来源之间一致。",
    }[status]
    return {
        "status": status,
        "facts": rows,
        "valuesMerged": False,
        "summary": summary,
    }


def build_labeled_claims(review: dict[str, Any]) -> list[dict[str, Any]]:
    items = review["evidenceBundle"]["evidenceItems"]
    context = next(item for item in items if item["kind"] == "experiment_context")
    quality = next(item for item in items if item["kind"] == "data_quality")
    strategy = next(item for item in items if item["kind"] == "strategy_definition")
    candidates = [
        item for item in items
        if item["kind"] == "candidate_metrics" and item["value"].get("selected") is True
    ]
    candidate = candidates[0] if candidates else next(
        item for item in items if item["kind"] == "candidate_metrics"
    )
    context_value = context["value"]
    quality_value = quality["value"]
    strategy_value = strategy["value"]
    metrics = candidate["value"]["validationMetrics"]
    assessment = review["externalAssessment"].get("assessment") or review["deterministicAssessment"]
    claims = [
        _claim(
            "fact",
            (
                f"审计上下文为 {context_value['market']} · {context_value['symbol']} · "
                f"{context_value['timeframe']}，数据 {quality_value['rows']} 行，"
                f"完整性为 {quality_value['isComplete']}。"
            ),
            [context["id"], quality["id"]],
        ),
        _claim(
            "calculation",
            (
                f"选中候选的验证期收益为 {metrics['totalReturnPct']}%，"
                f"最大回撤为 {metrics['maxDrawdownPct']}%，交易数为 {metrics['tradeCount']}。"
            ),
            [candidate["id"]],
        ),
        _claim(
            "assumption",
            (
                f"研究假设沿用策略 {strategy_value['name']} · {strategy_value['revision']} "
                f"及其既有入场、退出和风险参数。"
            ),
            [strategy["id"]],
        ),
        _claim(
            "model_inference",
            str(assessment["summary"]),
            sorted({reference for risk in assessment["risks"] for reference in risk["evidenceReferences"]})
            or [item["id"] for item in items],
        ),
    ]
    return claims


def build_information_richness(
    claims: list[dict[str, Any]],
    review: dict[str, Any],
    financial: dict[str, Any],
) -> dict[str, Any]:
    claim_coverage = len({item["kind"] for item in claims}) / len(_CLAIM_KINDS)
    evidence_kinds = {
        item["kind"] for item in review["evidenceBundle"]["evidenceItems"]
    }
    evidence_coverage = min(1.0, len(evidence_kinds) / 4)
    financial_score = 1.0 if financial["status"] == "agreement" else 0.5 if financial["status"] == "warning" else 0.0
    external_score = 1.0 if review["externalAssessment"]["status"] == "completed" else 0.0
    score = round(
        claim_coverage * 40
        + evidence_coverage * 20
        + financial_score * 20
        + external_score * 20
    )
    level = "high" if score >= 75 else "medium" if score >= 40 else "low"
    gaps = list(review["deterministicAssessment"]["evidenceGaps"])
    if financial["status"] in {"unavailable", "blocked"}:
        gaps.append(financial["summary"])
    if review["externalAssessment"]["status"] != "completed":
        gaps.append("外部模型评审未完成，当前仅保留确定性评审证据。")
    return {
        "score": score,
        "level": level,
        "claimKindCount": len({item["kind"] for item in claims}),
        "evidenceKindCount": len(evidence_kinds),
        "gaps": _unique_text(gaps),
        "basis": "只评价证据种类、来源覆盖和缺口，不代表投资确定性。",
    }


def build_investment_certainty(
    review: dict[str, Any],
    financial: dict[str, Any],
) -> dict[str, Any]:
    assessment = review["externalAssessment"].get("assessment") or review["deterministicAssessment"]
    material_risk = any(item["severity"] in {"high", "critical"} for item in assessment["risks"])
    medium = (
        assessment["stance"] == "supported"
        and assessment["consistency"] == "consistent"
        and not material_risk
        and financial["status"] != "blocked"
    )
    return {
        "level": "medium" if medium else "low",
        "basis": (
            f"评审立场={assessment['stance']}，一致性={assessment['consistency']}，"
            f"材料风险={'存在' if material_risk else '未发现'}；最高只评为 medium。"
        ),
        "derivedFromInformationRichness": False,
    }


def build_multi_view(
    review: dict[str, Any],
    *,
    timeframe: str,
    enabled: bool,
) -> dict[str, Any]:
    if not enabled:
        return {"status": "disabled", "engine": "not_run", "roles": []}
    if timeframe not in _LONG_HORIZON_TIMEFRAMES:
        raise ValueError("multi_view_not_allowed_for_timeframe")
    assessment = review["externalAssessment"].get("assessment") or review["deterministicAssessment"]
    engine = (
        "existing_external_assessment"
        if review["externalAssessment"]["status"] == "completed"
        else "deterministic_evidence_projection"
    )
    evidence_ids = [item["id"] for item in review["evidenceBundle"]["evidenceItems"]]
    risk = assessment["risks"][0] if assessment["risks"] else None
    bearish_references = risk["evidenceReferences"] if risk else evidence_ids
    return {
        "status": "completed",
        "engine": engine,
        "roles": [
            {
                "role": "bullish",
                "thesis": assessment["summary"],
                "evidenceReferences": evidence_ids,
            },
            {
                "role": "bearish",
                "thesis": risk["message"] if risk else "现有证据未排除策略失效与样本外退化风险。",
                "evidenceReferences": bearish_references,
            },
            {
                "role": "neutral",
                "thesis": (
                    assessment["evidenceGaps"][0]
                    if assessment["evidenceGaps"]
                    else assessment["watchItems"][0]
                    if assessment["watchItems"]
                    else "保持观察，等待新增审计证据。"
                ),
                "evidenceReferences": evidence_ids,
            },
        ],
    }


def build_research_recommendation(
    review: dict[str, Any],
    run: ResearchRunAudit,
    request: dict[str, Any],
) -> dict[str, Any]:
    bars = _snapshot_bars(run)
    reference = bars[-1]
    snapshot_hash = _snapshot_hash(run)
    seed = {
        "aiReviewId": review["aiReviewId"],
        "snapshotHash": snapshot_hash,
        "stance": request["stance"],
        "horizonBars": request["horizonBars"],
    }
    return {
        "recommendationId": f"research-recommendation-{canonical_sha256(seed)[:32]}",
        "stance": request["stance"],
        "declaredHorizonBars": request["horizonBars"],
        "timeframe": run.timeframe,
        "referenceAt": reference["timestamp"],
        "referencePrice": _finite_number(reference.get("close"), "reference_price_invalid"),
        "snapshotHash": snapshot_hash,
        "aiReviewId": review["aiReviewId"],
        "researchOnly": True,
    }


def evaluate_recommendation_outcome(
    evidence: dict[str, Any],
    outcome_run: ResearchRunAudit,
    benchmark_run: ResearchRunAudit,
) -> dict[str, Any]:
    if (
        outcome_run.market != evidence["market"]
        or outcome_run.symbol != evidence["symbol"]
        or outcome_run.timeframe != evidence["timeframe"]
    ):
        raise ValueError("ai_research_outcome_context_mismatch")
    if (
        benchmark_run.market != evidence["market"]
        or benchmark_run.timeframe != evidence["timeframe"]
        or benchmark_run.symbol == evidence["symbol"]
    ):
        raise ValueError("ai_research_benchmark_context_mismatch")

    recommendation = evidence["recommendation"]
    reference_at = _parse_datetime(recommendation["referenceAt"])
    outcome_bars = [
        bar for bar in _snapshot_bars(outcome_run)
        if _parse_datetime(bar["timestamp"]) > reference_at
    ]
    horizon = recommendation["declaredHorizonBars"]
    if len(outcome_bars) < horizon:
        raise ValueError("ai_research_horizon_not_reached")
    horizon_bars = outcome_bars[:horizon]
    final_bar = horizon_bars[-1]
    outcome_at = _parse_datetime(final_bar["timestamp"])
    reference_price = recommendation["referencePrice"]
    final_price = _finite_number(final_bar.get("close"), "outcome_price_invalid")
    raw_return = _pct(final_price / reference_price - 1)
    stance = recommendation["stance"]
    stance_adjusted_return = raw_return if stance == "bullish" else -raw_return if stance == "bearish" else 0.0
    adverse = _adverse_excursion(stance, reference_price, horizon_bars)

    benchmark_bars = _snapshot_bars(benchmark_run)
    benchmark_start_candidates = [
        bar for bar in benchmark_bars
        if _parse_datetime(bar["timestamp"]) <= reference_at
    ]
    benchmark_end_candidates = [
        bar for bar in benchmark_bars
        if _parse_datetime(bar["timestamp"]) <= outcome_at
    ]
    if not benchmark_start_candidates or not benchmark_end_candidates:
        raise ValueError("ai_research_benchmark_coverage_missing")
    benchmark_start = benchmark_start_candidates[-1]
    benchmark_end = benchmark_end_candidates[-1]
    if _parse_datetime(benchmark_end["timestamp"]) <= _parse_datetime(benchmark_start["timestamp"]):
        raise ValueError("ai_research_benchmark_coverage_missing")
    benchmark_return = _pct(
        _finite_number(benchmark_end.get("close"), "benchmark_price_invalid")
        / _finite_number(benchmark_start.get("close"), "benchmark_price_invalid")
        - 1
    )
    return {
        "market": evidence["market"],
        "symbol": evidence["symbol"],
        "timeframe": evidence["timeframe"],
        "stance": stance,
        "horizonBars": horizon,
        "referenceAt": recommendation["referenceAt"],
        "outcomeAt": final_bar["timestamp"],
        "referencePrice": reference_price,
        "outcomePrice": final_price,
        "rawReturnPct": raw_return,
        "stanceAdjustedReturnPct": stance_adjusted_return,
        "adverseExcursionPct": adverse,
        "benchmarkRunId": benchmark_run.run_id,
        "benchmarkSymbol": benchmark_run.symbol,
        "benchmarkReturnPct": benchmark_return,
        "alphaPct": _pct(raw_return - benchmark_return, already_pct=True),
        "outcomeRunId": outcome_run.run_id,
        "outcomeSnapshotHash": _snapshot_hash(outcome_run),
        "benchmarkSnapshotHash": _snapshot_hash(benchmark_run),
    }


def validate_ai_research_evidence(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict) or value.get("schemaVersion") != 1:
        raise ValueError("ai_research_evidence_invalid")
    if value.get("recordType") != "aiqt.aiResearchEvidence":
        raise ValueError("ai_research_evidence_invalid")
    required = {
        "schemaVersion",
        "recordType",
        "researchEvidenceId",
        "aiReviewId",
        "sourceRunId",
        "createdAt",
        "market",
        "symbol",
        "timeframe",
        "snapshotHash",
        "claims",
        "informationRichness",
        "investmentCertainty",
        "financialFactReport",
        "multiView",
        "recommendation",
        "priorOutcomeLessons",
        "boundary",
        "recordHash",
    }
    if set(value) != required:
        raise ValueError("ai_research_evidence_invalid")
    _parse_datetime(value["createdAt"])
    _required_text_fields(
        value,
        "researchEvidenceId",
        "aiReviewId",
        "sourceRunId",
        "market",
        "symbol",
        "timeframe",
        "snapshotHash",
        "recordHash",
    )
    _required_hash_fields(value, "snapshotHash", "recordHash")
    claims = value["claims"]
    if not isinstance(claims, list) or {
        item.get("kind") for item in claims if isinstance(item, dict)
    } != _CLAIM_KINDS:
        raise ValueError("ai_research_evidence_invalid")
    for claim in claims:
        if not isinstance(claim, dict) or set(claim) != {
            "claimId",
            "kind",
            "text",
            "evidenceReferences",
        }:
            raise ValueError("ai_research_evidence_invalid")
        _required_text_fields(claim, "claimId", "text")
        if (
            claim["kind"] not in _CLAIM_KINDS
            or not isinstance(claim["evidenceReferences"], list)
            or not claim["evidenceReferences"]
            or any(not isinstance(item, str) or not item.strip() for item in claim["evidenceReferences"])
        ):
            raise ValueError("ai_research_evidence_invalid")
    _validate_information_richness(value["informationRichness"])
    _validate_investment_certainty(value["investmentCertainty"])
    _validate_financial_fact_report(value["financialFactReport"], market=value["market"])
    _validate_multi_view(value["multiView"], timeframe=value["timeframe"])
    _validate_recommendation(
        value["recommendation"],
        ai_review_id=value["aiReviewId"],
        snapshot_hash=value["snapshotHash"],
        timeframe=value["timeframe"],
    )
    _validate_prior_lessons(value["priorOutcomeLessons"])
    if value["boundary"] != _RESEARCH_BOUNDARY:
        raise ValueError("ai_research_boundary_invalid")
    expected_hash = canonical_sha256({key: item for key, item in value.items() if key != "recordHash"})
    if value["recordHash"] != expected_hash:
        raise ValueError("ai_research_record_hash_mismatch")
    return _canonical_copy(value)


def validate_ai_research_outcome(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict) or value.get("schemaVersion") != 1:
        raise ValueError("ai_research_outcome_invalid")
    if value.get("recordType") != "aiqt.aiResearchOutcome" or value.get("status") != "completed":
        raise ValueError("ai_research_outcome_invalid")
    required = {
        "schemaVersion",
        "recordType",
        "outcomeId",
        "researchEvidenceId",
        "recommendationId",
        "aiReviewId",
        "sourceRunId",
        "snapshotHash",
        "createdAt",
        "status",
        "market",
        "symbol",
        "timeframe",
        "stance",
        "horizonBars",
        "referenceAt",
        "outcomeAt",
        "referencePrice",
        "outcomePrice",
        "rawReturnPct",
        "stanceAdjustedReturnPct",
        "adverseExcursionPct",
        "benchmarkRunId",
        "benchmarkSymbol",
        "benchmarkReturnPct",
        "alphaPct",
        "outcomeRunId",
        "outcomeSnapshotHash",
        "benchmarkSnapshotHash",
        "lesson",
        "boundary",
        "recordHash",
    }
    if set(value) != required:
        raise ValueError("ai_research_outcome_invalid")
    _required_text_fields(
        value,
        "outcomeId",
        "researchEvidenceId",
        "recommendationId",
        "aiReviewId",
        "sourceRunId",
        "snapshotHash",
        "market",
        "symbol",
        "timeframe",
        "benchmarkRunId",
        "benchmarkSymbol",
        "outcomeRunId",
        "outcomeSnapshotHash",
        "benchmarkSnapshotHash",
        "lesson",
        "recordHash",
    )
    for field in ("createdAt", "referenceAt", "outcomeAt"):
        _parse_datetime(value[field])
    if _parse_datetime(value["outcomeAt"]) <= _parse_datetime(value["referenceAt"]):
        raise ValueError("ai_research_outcome_invalid")
    for field in (
        "referencePrice",
        "outcomePrice",
        "rawReturnPct",
        "stanceAdjustedReturnPct",
        "adverseExcursionPct",
        "benchmarkReturnPct",
        "alphaPct",
    ):
        _finite_number(value[field], "ai_research_outcome_invalid")
    if value["referencePrice"] <= 0 or value["outcomePrice"] <= 0:
        raise ValueError("ai_research_outcome_invalid")
    if (
        value["stance"] not in {"bullish", "bearish", "neutral"}
        or type(value["horizonBars"]) is not int
        or not 1 <= value["horizonBars"] <= 250
    ):
        raise ValueError("ai_research_outcome_invalid")
    _required_hash_fields(
        value,
        "snapshotHash",
        "outcomeSnapshotHash",
        "benchmarkSnapshotHash",
        "recordHash",
    )
    if value["boundary"] != _RESEARCH_BOUNDARY:
        raise ValueError("ai_research_boundary_invalid")
    expected_hash = canonical_sha256({key: item for key, item in value.items() if key != "recordHash"})
    if value["recordHash"] != expected_hash:
        raise ValueError("ai_research_record_hash_mismatch")
    return _canonical_copy(value)


def _validate_information_richness(value: Any) -> None:
    if not isinstance(value, dict) or set(value) != {
        "score",
        "level",
        "claimKindCount",
        "evidenceKindCount",
        "gaps",
        "basis",
    }:
        raise ValueError("ai_research_evidence_invalid")
    if (
        type(value["score"]) is not int
        or not 0 <= value["score"] <= 100
        or value["level"] not in {"low", "medium", "high"}
        or type(value["claimKindCount"]) is not int
        or not 1 <= value["claimKindCount"] <= 4
        or type(value["evidenceKindCount"]) is not int
        or value["evidenceKindCount"] < 1
        or not isinstance(value["gaps"], list)
        or any(not isinstance(item, str) or not item.strip() for item in value["gaps"])
    ):
        raise ValueError("ai_research_evidence_invalid")
    _required_text_fields(value, "basis")


def _validate_investment_certainty(value: Any) -> None:
    if (
        not isinstance(value, dict)
        or set(value) != {"level", "basis", "derivedFromInformationRichness"}
        or value["level"] not in {"low", "medium"}
        or value["derivedFromInformationRichness"] is not False
    ):
        raise ValueError("ai_research_evidence_invalid")
    _required_text_fields(value, "basis")


def _validate_financial_fact_report(value: Any, *, market: str) -> None:
    if not isinstance(value, dict) or set(value) != {
        "status",
        "facts",
        "valuesMerged",
        "summary",
    }:
        raise ValueError("ai_research_evidence_invalid")
    if value["valuesMerged"] is not False or not isinstance(value["facts"], list):
        raise ValueError("ai_research_evidence_invalid")
    source_facts = []
    for row in value["facts"]:
        if not isinstance(row, dict) or set(row) != {
            "factId",
            "label",
            "period",
            "unit",
            "primary",
            "comparison",
            "relativeDifferencePct",
            "warningThresholdPct",
            "blockedThresholdPct",
            "status",
            "mismatchReasons",
            "valuesMerged",
        }:
            raise ValueError("ai_research_evidence_invalid")
        source = {
            key: row[key]
            for key in ("factId", "label", "period", "unit", "primary", "comparison")
        }
        normalized = _validate_financial_fact(source)
        if canonical_json(_financial_fact_row(normalized)) != canonical_json(row):
            raise ValueError("ai_research_evidence_invalid")
        source_facts.append(normalized)
    if canonical_json(build_financial_fact_report(market, source_facts)) != canonical_json(value):
        raise ValueError("ai_research_evidence_invalid")


def _validate_multi_view(value: Any, *, timeframe: str) -> None:
    if not isinstance(value, dict) or set(value) != {"status", "engine", "roles"}:
        raise ValueError("ai_research_evidence_invalid")
    roles = value["roles"]
    if not isinstance(roles, list):
        raise ValueError("ai_research_evidence_invalid")
    if value["status"] == "disabled":
        if value["engine"] != "not_run" or roles:
            raise ValueError("ai_research_evidence_invalid")
        return
    if (
        value["status"] != "completed"
        or value["engine"] not in {
            "existing_external_assessment",
            "deterministic_evidence_projection",
        }
        or timeframe not in _LONG_HORIZON_TIMEFRAMES
        or [item.get("role") for item in roles if isinstance(item, dict)]
        != ["bullish", "bearish", "neutral"]
    ):
        raise ValueError("ai_research_evidence_invalid")
    for role in roles:
        if not isinstance(role, dict) or set(role) != {
            "role",
            "thesis",
            "evidenceReferences",
        }:
            raise ValueError("ai_research_evidence_invalid")
        _required_text_fields(role, "thesis")
        if (
            not isinstance(role["evidenceReferences"], list)
            or not role["evidenceReferences"]
            or any(not isinstance(item, str) or not item.strip() for item in role["evidenceReferences"])
        ):
            raise ValueError("ai_research_evidence_invalid")


def _validate_recommendation(
    value: Any,
    *,
    ai_review_id: str,
    snapshot_hash: str,
    timeframe: str,
) -> None:
    if not isinstance(value, dict) or set(value) != {
        "recommendationId",
        "stance",
        "declaredHorizonBars",
        "timeframe",
        "referenceAt",
        "referencePrice",
        "snapshotHash",
        "aiReviewId",
        "researchOnly",
    }:
        raise ValueError("ai_research_evidence_invalid")
    _required_text_fields(value, "recommendationId")
    _parse_datetime(value["referenceAt"])
    if (
        value["stance"] not in {"bullish", "bearish", "neutral"}
        or type(value["declaredHorizonBars"]) is not int
        or not 1 <= value["declaredHorizonBars"] <= 250
        or value["timeframe"] != timeframe
        or value["snapshotHash"] != snapshot_hash
        or value["aiReviewId"] != ai_review_id
        or value["researchOnly"] is not True
        or _finite_number(value["referencePrice"], "ai_research_evidence_invalid") <= 0
    ):
        raise ValueError("ai_research_evidence_invalid")


def _validate_prior_lessons(value: Any) -> None:
    if not isinstance(value, list) or len(value) > 5:
        raise ValueError("ai_research_evidence_invalid")
    fields = {
        "outcomeId",
        "recommendationId",
        "outcomeAt",
        "stanceAdjustedReturnPct",
        "alphaPct",
        "lesson",
    }
    for item in value:
        if not isinstance(item, dict) or set(item) != fields:
            raise ValueError("ai_research_evidence_invalid")
        _required_text_fields(item, "outcomeId", "recommendationId", "lesson")
        _parse_datetime(item["outcomeAt"])
        _finite_number(item["stanceAdjustedReturnPct"], "ai_research_evidence_invalid")
        _finite_number(item["alphaPct"], "ai_research_evidence_invalid")


def _validate_evidence_request(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict) or set(payload) != {
        "recommendation",
        "multiViewEnabled",
        "financialFacts",
    }:
        raise ValueError("invalid_ai_research_evidence_request")
    recommendation = payload.get("recommendation")
    if not isinstance(recommendation, dict) or set(recommendation) != {"stance", "horizonBars"}:
        raise ValueError("invalid_ai_research_evidence_request")
    stance = recommendation.get("stance")
    horizon = recommendation.get("horizonBars")
    if stance not in {"bullish", "bearish", "neutral"} or type(horizon) is not int or not 1 <= horizon <= 250:
        raise ValueError("invalid_ai_research_evidence_request")
    if type(payload.get("multiViewEnabled")) is not bool:
        raise ValueError("invalid_ai_research_evidence_request")
    facts = payload.get("financialFacts")
    if not isinstance(facts, list) or len(facts) > len(_FINANCIAL_FACT_IDS):
        raise ValueError("invalid_ai_research_evidence_request")
    normalized_facts = [_validate_financial_fact(item) for item in facts]
    identities = [(item["factId"], item["period"]) for item in normalized_facts]
    if len(identities) != len(set(identities)):
        raise ValueError("financial_fact_duplicate")
    return {
        "recommendation": {"stance": stance, "horizonBars": horizon},
        "multiViewEnabled": payload["multiViewEnabled"],
        "financialFacts": normalized_facts,
    }


def _validate_financial_fact(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != {
        "factId",
        "label",
        "period",
        "unit",
        "primary",
        "comparison",
    }:
        raise ValueError("financial_fact_invalid")
    if value.get("factId") not in _FINANCIAL_FACT_IDS:
        raise ValueError("financial_fact_invalid")
    label = _bounded_text(value.get("label"), 80, "financial_fact_invalid")
    period = _bounded_text(value.get("period"), 40, "financial_fact_invalid")
    unit = _bounded_text(value.get("unit"), 24, "financial_fact_invalid")
    primary = _validate_financial_observation(value.get("primary"))
    comparison = _validate_financial_observation(value.get("comparison"))
    if primary["source"].casefold() == comparison["source"].casefold():
        raise ValueError("financial_fact_sources_not_independent")
    return {
        "factId": value["factId"],
        "label": label,
        "period": period,
        "unit": unit,
        "primary": primary,
        "comparison": comparison,
    }


def _validate_financial_observation(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != {
        "source",
        "value",
        "period",
        "unit",
        "observedAt",
    }:
        raise ValueError("financial_fact_invalid")
    source = _bounded_text(value.get("source"), 80, "financial_fact_invalid")
    period = _bounded_text(value.get("period"), 40, "financial_fact_invalid")
    unit = _bounded_text(value.get("unit"), 24, "financial_fact_invalid")
    observed_at = value.get("observedAt")
    if not isinstance(observed_at, str):
        raise ValueError("financial_fact_invalid")
    _parse_datetime(observed_at)
    return {
        "source": source,
        "value": _finite_number(value.get("value"), "financial_fact_invalid"),
        "period": period,
        "unit": unit,
        "observedAt": observed_at,
    }


def _financial_fact_row(value: dict[str, Any]) -> dict[str, Any]:
    primary = value["primary"]
    comparison = value["comparison"]
    mismatch_reasons = []
    if (
        primary["period"] != value["period"]
        or comparison["period"] != value["period"]
        or primary["period"] != comparison["period"]
    ):
        mismatch_reasons.append("reporting_period_mismatch")
    if (
        primary["unit"] != value["unit"]
        or comparison["unit"] != value["unit"]
        or primary["unit"] != comparison["unit"]
    ):
        mismatch_reasons.append("unit_mismatch")
    denominator = max(abs(primary["value"]), abs(comparison["value"]), 1e-12)
    relative_difference_pct = round(
        abs(primary["value"] - comparison["value"]) / denominator * 100,
        6,
    )
    status = (
        "blocked"
        if mismatch_reasons
        else "agreement"
        if relative_difference_pct <= 0.5
        else "warning"
        if relative_difference_pct <= 5
        else "blocked"
    )
    return {
        **value,
        "relativeDifferencePct": relative_difference_pct,
        "warningThresholdPct": 0.5,
        "blockedThresholdPct": 5.0,
        "status": status,
        "mismatchReasons": mismatch_reasons,
        "valuesMerged": False,
    }


def _validate_outcome_request(payload: Any) -> dict[str, str]:
    if not isinstance(payload, dict) or set(payload) != {
        "researchEvidenceId",
        "outcomeRunId",
        "benchmarkRunId",
    }:
        raise ValueError("invalid_ai_research_outcome_request")
    _required_text_fields(payload, "researchEvidenceId", "outcomeRunId", "benchmarkRunId")
    return {key: payload[key].strip() for key in payload}


def _validate_review_run_binding(
    review: dict[str, Any],
    run: ResearchRunAudit,
) -> None:
    primary = review["primaryExperiment"]
    if primary["sourceRunId"] != run.run_id or primary["snapshotId"] != _snapshot_hash(run):
        raise ValueError("ai_research_review_run_binding_invalid")


def _snapshot_bars(run: ResearchRunAudit) -> list[dict[str, Any]]:
    bars = run.data_snapshot.get("bars")
    if not isinstance(bars, list) or not bars:
        raise ValueError("ai_research_snapshot_bars_missing")
    return bars


def _snapshot_hash(run: ResearchRunAudit) -> str:
    value = run.data_snapshot.get("snapshotHash") or run.data_snapshot.get("hash")
    if not isinstance(value, str) or len(value) != 64:
        raise ValueError("ai_research_snapshot_hash_missing")
    return value


def _claim(kind: str, text: str, evidence_references: list[str]) -> dict[str, Any]:
    seed = {"kind": kind, "text": text, "evidenceReferences": evidence_references}
    return {
        "claimId": f"claim-{canonical_sha256(seed)[:24]}",
        **seed,
    }


def _outcome_lesson(result: dict[str, Any]) -> str:
    if result["stanceAdjustedReturnPct"] > 0 and result["alphaPct"] > 0:
        return "该观点在声明周期内取得正向观点收益与正 alpha；仅作为后续研究证据。"
    if result["stanceAdjustedReturnPct"] < 0:
        return "该观点在声明周期内方向失效；后续研究应优先复核反例与失效条件。"
    return "该观点在声明周期内未形成明确优势；后续研究应保持低确定性并补充证据。"


def _adverse_excursion(
    stance: str,
    reference_price: float,
    bars: list[dict[str, Any]],
) -> float:
    lows = [_finite_number(bar.get("low"), "outcome_price_invalid") for bar in bars]
    highs = [_finite_number(bar.get("high"), "outcome_price_invalid") for bar in bars]
    if stance == "bullish":
        return _pct(min(0.0, min(low / reference_price - 1 for low in lows)))
    if stance == "bearish":
        return _pct(-max(0.0, max(high / reference_price - 1 for high in highs)))
    excursion = max(
        max(abs(low / reference_price - 1) for low in lows),
        max(abs(high / reference_price - 1) for high in highs),
    )
    return _pct(-excursion)


def _pct(value: float, *, already_pct: bool = False) -> float:
    return round(value if already_pct else value * 100, 6)


def _required_text_fields(value: dict[str, Any], *fields: str) -> None:
    if any(not isinstance(value.get(field), str) or not value[field].strip() for field in fields):
        raise ValueError("ai_research_text_field_invalid")


def _required_hash_fields(value: dict[str, Any], *fields: str) -> None:
    if any(
        not isinstance(value.get(field), str)
        or len(value[field]) != 64
        or any(character not in "0123456789abcdef" for character in value[field])
        for field in fields
    ):
        raise ValueError("ai_research_hash_invalid")


def _bounded_text(value: Any, maximum: int, code: str) -> str:
    if not isinstance(value, str):
        raise ValueError(code)
    normalized = value.strip()
    if (
        not normalized
        or len(normalized) > maximum
        or contains_secret_like_archive_text(normalized)
    ):
        raise ValueError(code)
    return normalized


def _finite_number(value: Any, code: str) -> float:
    if type(value) not in {int, float} or not math.isfinite(float(value)):
        raise ValueError(code)
    return float(value)


def _parse_datetime(value: Any) -> datetime:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("ai_research_datetime_invalid")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise ValueError("ai_research_datetime_invalid") from None
    if parsed.tzinfo is None:
        raise ValueError("ai_research_datetime_invalid")
    return parsed.astimezone(timezone.utc)


def _utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        raise ValueError("ai_research_datetime_invalid")
    return value.astimezone(timezone.utc)


def _unique_text(items: list[Any]) -> list[str]:
    return list(dict.fromkeys(str(item).strip() for item in items if str(item).strip()))


def _canonical_copy(value: dict[str, Any]) -> dict[str, Any]:
    import json

    return json.loads(canonical_json(value))
