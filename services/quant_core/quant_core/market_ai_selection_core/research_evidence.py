from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

from quant_core.audit_events import AuditEventStore
from quant_core.canonical import canonical_sha256

from .audit_validation import (
    _market_ai_selection_id_matches_artifact,
    _valid_statistics_source_coverage,
)
from .candidate_scoring import _prefilter_candidates
from .common import _finite_or_none
from .contracts import (
    _AI_TIERS,
    _CRYPTO_PROFILES,
    _HORIZONS,
    _HORIZON_BARS,
    _RECOMMENDATION_LIMIT,
    _RESEARCH_ORIGIN_FIELDS,
    _SELECTION_SCHEMA_VERSION,
    _STOCK_PROFILES,
    MarketAiSelectionError,
)

def resolve_market_ai_selection_research_evidence(
    value: object,
    *,
    audit_store: AuditEventStore,
    market: str,
    symbol: str,
    timeframe: str,
) -> dict[str, Any] | None:
    if value is None:
        return None
    if not isinstance(value, Mapping) or set(value) != _RESEARCH_ORIGIN_FIELDS:
        raise ValueError("market_ai_selection_origin_invalid")

    selection_id = _required_research_origin_text(value, "selectionId")
    evidence_id = _required_research_origin_text(value, "candidateEvidenceId")
    audit_event_id = f"market-ai-selection-{selection_id}"
    try:
        record = audit_store.get(audit_event_id)
    except Exception as error:
        raise MarketAiSelectionError(
            "market_ai_selection_audit_unavailable",
            503,
            "AI 选股审计存储暂不可用。",
        ) from error
    if record is None or record.event_type != "market_ai_selection":
        raise ValueError("market_ai_selection_origin_not_found")

    artifact = record.metadata.get("artifact")
    schema_version = artifact.get("schemaVersion") if isinstance(artifact, Mapping) else None
    if (
        not isinstance(artifact, Mapping)
        or type(schema_version) is not int
        or schema_version not in {1, _SELECTION_SCHEMA_VERSION}
        or artifact.get("recordType") != "aiqt.marketAiSelection"
        or not _market_ai_selection_id_matches_artifact(selection_id, artifact)
    ):
        raise ValueError("market_ai_selection_origin_invalid")
    artifact_without_hash = {key: item for key, item in artifact.items() if key != "recordHash"}
    record_hash = str(artifact.get("recordHash") or "").strip()
    if not record_hash or record_hash != canonical_sha256(artifact_without_hash):
        raise ValueError("market_ai_selection_origin_hash_invalid")

    request = artifact.get("request")
    result = artifact.get("result")
    if not isinstance(request, Mapping) or not isinstance(result, Mapping):
        raise ValueError("market_ai_selection_origin_invalid")
    profile = str(request.get("profile") or "")
    horizon = str(request.get("horizon") or "")
    if (
        str(artifact.get("selectionId") or "") != selection_id
        or str(result.get("selectionId") or "") != selection_id
        or str(request.get("market") or "") != market
        or profile not in (_CRYPTO_PROFILES if market == "crypto" else _STOCK_PROFILES)
        or horizon not in _HORIZONS
        or timeframe != "1d"
    ):
        raise ValueError("market_ai_selection_origin_mismatch")
    if schema_version == _SELECTION_SCHEMA_VERSION:
        market_context = artifact.get("marketContext")
        source_coverage = (
            market_context.get("fundamentalSourceCoverage")
            if isinstance(market_context, Mapping)
            else None
        )
        if market == "crypto":
            initial_candidates = artifact.get("initialCandidates")
            if (
                not isinstance(initial_candidates, list)
                or not _valid_statistics_source_coverage(
                    source_coverage,
                    generated_at=str(artifact.get("generatedAt") or ""),
                )
                or source_coverage["sampleCount"]
                != len(_prefilter_candidates(initial_candidates, market=market)[0])
            ):
                raise ValueError("market_ai_selection_origin_invalid")
        elif source_coverage is not None:
            raise ValueError("market_ai_selection_origin_invalid")

    evidence_candidates = artifact.get("evidenceCandidates")
    recommendation_rows = result.get("recommendations")
    if not isinstance(evidence_candidates, Sequence) or isinstance(evidence_candidates, (str, bytes)):
        raise ValueError("market_ai_selection_origin_invalid")
    if not isinstance(recommendation_rows, Sequence) or isinstance(recommendation_rows, (str, bytes)):
        raise ValueError("market_ai_selection_origin_invalid")
    candidate = next(
        (
            row
            for row in evidence_candidates
            if isinstance(row, Mapping)
            and str(row.get("evidenceId") or "") == evidence_id
            and str(row.get("market") or "") == market
            and str(row.get("symbol") or "") == symbol
        ),
        None,
    )
    recommendation = next(
        (
            row
            for row in recommendation_rows
            if isinstance(row, Mapping) and str(row.get("evidenceId") or "") == evidence_id
        ),
        None,
    )
    if candidate is None or recommendation is None:
        raise ValueError("market_ai_selection_origin_candidate_mismatch")
    rank = recommendation.get("rank")
    tier = str(recommendation.get("tier") or "")
    market_snapshot = artifact.get("marketSnapshot")
    candidate_snapshot = candidate.get("snapshot")
    daily_bars = candidate.get("dailyBars")
    factors = candidate.get("factors")
    fundamental = candidate.get("fundamental")
    last_bar = daily_bars[-1] if isinstance(daily_bars, Sequence) and daily_bars else None
    reference_price = (
        _finite_or_none(last_bar.get("close"))
        if isinstance(last_bar, Mapping)
        else None
    )
    evidence_hash = str(candidate.get("evidenceHash") or "")
    expected_evidence_hash = (
        canonical_sha256(
            {
                "candidate": candidate_snapshot,
                "dailyBars": daily_bars,
                "factors": factors,
                "fundamental": fundamental,
            }
        )
        if isinstance(candidate_snapshot, Mapping)
        and isinstance(daily_bars, Sequence)
        and not isinstance(daily_bars, (str, bytes))
        and isinstance(factors, Mapping)
        and isinstance(fundamental, Mapping)
        else ""
    )
    market_snapshot_hash = (
        str(market_snapshot.get("snapshotHash") or "")
        if isinstance(market_snapshot, Mapping)
        else ""
    )
    reference_at = str(last_bar.get("timestamp") or "") if isinstance(last_bar, Mapping) else ""
    if (
        not isinstance(rank, int)
        or isinstance(rank, bool)
        or not 1 <= rank <= _RECOMMENDATION_LIMIT
        or tier not in _AI_TIERS
        or evidence_hash != expected_evidence_hash
        or len(market_snapshot_hash) != 64
        or not reference_at
        or reference_price is None
        or reference_price <= 0
    ):
        raise ValueError("market_ai_selection_origin_invalid")

    evidence = {
        "selectionId": selection_id,
        "auditEventId": audit_event_id,
        "candidateEvidenceId": evidence_id,
        "selectionRecordHash": record_hash,
        "candidateEvidenceHash": evidence_hash,
        "marketSnapshotHash": market_snapshot_hash,
        "market": market,
        "symbol": symbol,
        "timeframe": "1d",
        "profile": profile,
        "horizon": horizon,
        "horizonBars": _HORIZON_BARS[market][horizon],
        "rank": rank,
        "tier": tier,
        "referenceAt": reference_at,
        "referencePrice": reference_price,
        "generatedAt": str(artifact.get("generatedAt") or record.created_at.isoformat()),
        "researchOnly": True,
    }
    return {**evidence, "recordHash": canonical_sha256(evidence)}

def _required_research_origin_text(value: Mapping[str, Any], key: str) -> str:
    text = str(value.get(key) or "").strip()
    if not text:
        raise ValueError("market_ai_selection_origin_invalid")
    return text
