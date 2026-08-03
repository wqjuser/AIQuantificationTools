from __future__ import annotations

import re
from collections.abc import Mapping, Sequence
from typing import Any

from quant_core.ai_review_stage3 import contains_ai_review_secret_text
from quant_core.canonical import canonical_sha256

from . import contracts
from .common import _as_utc, _finite_or_none, _parse_datetime
from .contracts import _HAN_TEXT, _HORIZON_LABELS

def _normalize_news(
    value: Any,
    *,
    cutoff: datetime,
    prefix: str,
) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    cutoff_utc = _as_utc(cutoff)
    normalized: list[dict[str, Any]] = []
    seen: set[str] = set()
    for raw in value:
        if not isinstance(raw, Mapping):
            continue
        headline = re.sub(r"\s+", " ", str(raw.get("headline") or "")).strip()
        published = _parse_datetime(raw.get("publishedAt"))
        if not headline or published is None or published > cutoff_utc:
            continue
        identifier = str(raw.get("id") or canonical_sha256(headline)[:16])
        evidence_id = f"news-{prefix}-{identifier}"
        if evidence_id in seen:
            continue
        seen.add(evidence_id)
        normalized.append(
            {
                "evidenceId": evidence_id,
                "headline": headline[:240],
                "summary": re.sub(
                    r"\s+",
                    " ",
                    str(raw.get("summary") or ""),
                ).strip()[:280],
                "publishedAt": published.isoformat(),
                "source": str(raw.get("source") or "unknown")[:80],
                "scope": str(raw.get("scope") or ""),
                "url": (
                    str(raw.get("url"))
                    if isinstance(raw.get("url"), str)
                    and str(raw.get("url")).startswith(("http://", "https://"))
                    else None
                ),
            }
        )
    return normalized

def _attach_news(
    candidates: Sequence[dict[str, Any]],
    news: Mapping[str, Sequence[Mapping[str, Any]]],
) -> None:
    market_references = [
        str(item["evidenceId"])
        for item in news.get("market", [])
        if isinstance(item, Mapping) and item.get("evidenceId")
    ]
    for candidate in candidates:
        own = news.get(str(candidate["evidenceId"]), [])
        candidate["newsReferences"] = list(
            dict.fromkeys(
                [
                    candidate["evidenceId"],
                    *market_references,
                    *[
                        str(item["evidenceId"])
                        for item in own
                        if isinstance(item, Mapping) and item.get("evidenceId")
                    ],
                ]
            )
        )

def _public_candidate(candidate: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "evidenceId": candidate["evidenceId"],
        "market": candidate["market"],
        "symbol": candidate["symbol"],
        "name": candidate["name"],
        "score": candidate["score"],
        "pillarScores": dict(candidate["pillarScores"]),
        "fundamentalPeriod": candidate["fundamentalPeriod"],
        "dataGaps": list(candidate["dataGaps"]),
    }

def _baseline_recommendations(
    candidates: Sequence[Mapping[str, Any]],
    *,
    horizon: str,
) -> list[dict[str, Any]]:
    recommendations: list[dict[str, Any]] = []
    for index, candidate in enumerate(candidates, start=1):
        market = str(candidate["market"])
        tier = "priority_research" if index <= 3 else "watch"
        recommendations.append(
            _recommendation(
                candidate,
                {
                    "rank": index,
                    "tier": tier,
                    "reasons": [
                        f"确定性风格评分位列第 {index}，适合优先进入既有研究链。",
                        f"观察周期固定为 {_HORIZON_LABELS[market][horizon]}。",
                    ],
                    "risks": (
                        ["历史波动和基本面事实不能保证未来表现。"]
                        + (
                            ["存在已披露的数据缺口，研究时需继续核验。"]
                            if candidate["dataGaps"]
                            else []
                        )
                    ),
                    "evidenceReferences": list(candidate["newsReferences"]),
                    "summary": "这是确定性研究候选，不构成买卖或仓位建议。",
                },
            )
        )
    return recommendations

def _recommendation(
    candidate: Mapping[str, Any],
    assessment: Mapping[str, Any],
) -> dict[str, Any]:
    return {
        **_public_candidate(candidate),
        "rank": int(assessment["rank"]),
        "tier": str(assessment["tier"]),
        "reasons": [str(item) for item in assessment["reasons"]],
        "risks": [str(item) for item in assessment["risks"]],
        "evidenceReferences": [
            str(item) for item in assessment["evidenceReferences"]
        ],
        "summary": str(assessment["summary"]),
    }

def _external_evidence(
    candidates: Sequence[Mapping[str, Any]],
    *,
    request: Mapping[str, Any],
    news: Mapping[str, Sequence[Mapping[str, Any]]],
    market_context: Mapping[str, Any],
    market_snapshot: Mapping[str, Any],
) -> dict[str, Any]:
    normalized_context = {
        field: value
        for field in (
            "universeCount",
            "advancing",
            "declining",
            "flat",
            "totalAmount",
        )
        if (value := _finite_or_none(market_context.get(field))) is not None
    }
    return {
        "market": request["market"],
        "profile": request["profile"],
        "horizon": request["horizon"],
        "horizonLabel": _HORIZON_LABELS[str(request["market"])][
            str(request["horizon"])
        ],
        "weightsVersion": contracts._WEIGHTS_VERSION,
        "candidates": [
            {
                "evidenceId": item["evidenceId"],
                "market": item["market"],
                "symbol": item["symbol"],
                "name": item["name"],
                "deterministicScore": item["score"],
                "pillarScores": item["pillarScores"],
                "technicalFactors": item["factors"],
                "fundamentalFacts": item["fundamental"],
                "fundamentalPeriod": item["fundamentalPeriod"],
                "dataGaps": item["dataGaps"],
                "evidenceReferences": item["newsReferences"],
            }
            for item in candidates
        ],
        "marketContext": {
            "overview": normalized_context,
            "snapshotIdentity": {
                "snapshotHash": market_snapshot.get("snapshotHash"),
                "observedAt": market_snapshot.get("observedAt"),
                "source": market_snapshot.get("source"),
                "freshness": market_snapshot.get("freshness"),
            },
        },
        "marketNews": [
            {
                "evidenceId": item["evidenceId"],
                "headline": item["headline"],
                "summary": item["summary"],
                "publishedAt": item["publishedAt"],
                "source": item["source"],
            }
            for item in news.get("market", [])
        ],
        "candidateNews": [
            {
                "candidateEvidenceId": candidate["evidenceId"],
                "items": [
                    {
                        "evidenceId": item["evidenceId"],
                        "headline": item["headline"],
                        "summary": item["summary"],
                        "publishedAt": item["publishedAt"],
                        "source": item["source"],
                    }
                    for item in news.get(str(candidate["evidenceId"]), [])
                ],
            }
            for candidate in candidates[:10]
        ],
        "safetyBoundary": {
            "researchOnly": True,
            "tradingAuthority": False,
            "routingAuthority": False,
        },
    }

def _failed_generation(
    provider_id: str,
    provider_status: Any,
    error_code: str,
) -> dict[str, Any]:
    return {
        "requestedProvider": provider_id,
        "usedProvider": "local",
        "status": "failed",
        "fallbackUsed": True,
        "model": getattr(provider_status, "model", None),
        "sanitizedBaseUrl": getattr(
            provider_status,
            "sanitized_base_url",
            None,
        ),
        "latencyMs": 0,
        "externalDataApproved": True,
        "outboundFields": [],
        "errorCode": error_code,
    }

def _provider_identity(
    registry: AiReviewProviderRegistry,
    provider_id: str,
) -> dict[str, Any]:
    status = next(
        (
            item
            for item in registry.statuses()
            if item.provider_id == provider_id
        ),
        None,
    )
    return {
        "providerId": provider_id,
        "configured": bool(status.configured) if status is not None else False,
        "model": status.model if status is not None else None,
        "sanitizedBaseUrl": (
            status.sanitized_base_url if status is not None else None
        ),
    }

def _validated_chinese_text_list(value: Any, *, maximum: int) -> list[str]:
    if not isinstance(value, list) or not 1 <= len(value) <= maximum:
        raise ValueError("market_ai_selection_output_invalid")
    normalized: list[str] = []
    for item in value:
        if (
            not isinstance(item, str)
            or not item.strip()
            or len(item.strip()) > 180
            or not _HAN_TEXT.search(item)
        ):
            raise ValueError("market_ai_selection_output_invalid")
        normalized.append(item.strip())
    return normalized

def _contains_secret_text(value: Any) -> bool:
    if isinstance(value, str):
        return contains_ai_review_secret_text(value)
    if isinstance(value, Mapping):
        return any(_contains_secret_text(item) for item in value.values())
    if isinstance(value, (list, tuple)):
        return any(_contains_secret_text(item) for item in value)
    return False

def _exclusion(
    candidate: Mapping[str, Any],
    code: str,
    detail: str,
) -> dict[str, Any]:
    return {
        "market": str(candidate.get("market") or ""),
        "symbol": str(candidate.get("symbol") or ""),
        "name": str(candidate.get("name") or ""),
        "reason": detail,
    }
