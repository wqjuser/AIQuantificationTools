from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from quant_core.ai_review_providers import contains_prohibited_output
from quant_core.ai_review_stage3 import assert_external_evidence_safe

from .contracts import _AI_TIERS, _HAN_TEXT
from .recommendations import _contains_secret_text, _validated_chinese_text_list

def validate_market_ai_selection_output(
    value: Mapping[str, Any],
    known_evidence_ids: frozenset[str],
    *,
    candidate_evidence_ids: frozenset[str] | None = None,
) -> dict[str, Any]:
    if (
        not isinstance(value, Mapping)
        or set(value) != {"selections"}
        or contains_prohibited_output(value)
        or _contains_secret_text(value)
    ):
        raise ValueError("market_ai_selection_output_invalid")
    assert_external_evidence_safe(value)
    selections = value.get("selections")
    if not isinstance(selections, list) or not 1 <= len(selections) <= 5:
        raise ValueError("market_ai_selection_output_invalid")
    allowed_candidates = candidate_evidence_ids or known_evidence_ids
    normalized: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    seen_ranks: set[int] = set()
    for raw in selections:
        if not isinstance(raw, Mapping) or set(raw) != {
            "evidenceId",
            "rank",
            "tier",
            "reasons",
            "risks",
            "evidenceReferences",
            "summary",
        }:
            raise ValueError("market_ai_selection_output_invalid")
        evidence_id = raw.get("evidenceId")
        rank = raw.get("rank")
        tier = raw.get("tier")
        if (
            not isinstance(evidence_id, str)
            or evidence_id not in allowed_candidates
            or evidence_id in seen_ids
            or type(rank) is not int
            or rank < 1
            or rank > len(selections)
            or rank in seen_ranks
            or not isinstance(tier, str)
            or tier not in _AI_TIERS
        ):
            raise ValueError("market_ai_selection_output_invalid")
        reasons = _validated_chinese_text_list(raw.get("reasons"), maximum=4)
        risks = _validated_chinese_text_list(raw.get("risks"), maximum=4)
        references = raw.get("evidenceReferences")
        summary = raw.get("summary")
        if (
            not isinstance(references, list)
            or not 1 <= len(references) <= 8
            or len(set(references)) != len(references)
            or any(
                not isinstance(item, str) or item not in known_evidence_ids
                for item in references
            )
            or evidence_id not in references
            or not isinstance(summary, str)
            or not summary.strip()
            or len(summary.strip()) > 240
            or not _HAN_TEXT.search(summary)
        ):
            raise ValueError("market_ai_selection_output_invalid")
        seen_ids.add(evidence_id)
        seen_ranks.add(rank)
        normalized.append(
            {
                "evidenceId": evidence_id,
                "rank": rank,
                "tier": tier,
                "reasons": reasons,
                "risks": risks,
                "evidenceReferences": list(references),
                "summary": summary.strip(),
            }
        )
    if seen_ranks != set(range(1, len(selections) + 1)):
        raise ValueError("market_ai_selection_output_invalid")
    normalized.sort(key=lambda item: item["rank"])
    return {"selections": normalized}
