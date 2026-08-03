from __future__ import annotations

from ipaddress import ip_address
from quant_core.ai_review_runs import (
    AiReviewRunRecord,
    AuthoritativeAiReviewRunRecord,
)
from urllib.parse import (
    parse_qs,
    unquote,
    urlparse,
)

def _validated_ai_review_http_request(payload: dict[str, object]) -> dict[str, object]:
    fields = {
        "primaryExperimentId",
        "comparisonExperimentIds",
        "providerId",
        "externalDataApproved",
    }
    comparison_ids = payload.get("comparisonExperimentIds")
    if (
        set(payload) != fields
        or not isinstance(payload.get("primaryExperimentId"), str)
        or not isinstance(comparison_ids, list)
        or any(not isinstance(item, str) for item in comparison_ids)
        or not isinstance(payload.get("providerId"), str)
        or type(payload.get("externalDataApproved")) is not bool
    ):
        raise ValueError("invalid_ai_review_request")
    return payload


def _validated_ai_review_query(raw_query: str) -> dict[str, object]:
    values = parse_qs(raw_query, keep_blank_values=True)
    allowed = {"runId", "experimentId", "limit", "offset", "query"}
    if not set(values) <= allowed or any(len(items) != 1 for items in values.values()):
        raise ValueError("invalid_ai_review_query")
    try:
        limit = int(values.get("limit", ["20"])[0])
        offset = int(values.get("offset", ["0"])[0])
    except ValueError:
        raise ValueError("invalid_ai_review_query") from None
    if not 1 <= limit <= 50 or offset < 0:
        raise ValueError("invalid_ai_review_query")
    return {
        "runId": values.get("runId", [""])[0].strip() or None,
        "experimentId": values.get("experimentId", [""])[0].strip() or None,
        "limit": limit,
        "offset": offset,
        "query": values.get("query", [""])[0].strip(),
    }


def _ai_review_decision_route_id(path: str) -> str | None:
    prefix = "/api/ai-reviews/"
    suffix = "/decisions"
    if not path.startswith(prefix) or not path.endswith(suffix):
        return None
    ai_review_id = unquote(path[len(prefix) : -len(suffix)]).strip()
    return ai_review_id if ai_review_id and "/" not in ai_review_id else ""


def _ai_research_evidence_route_id(path: str) -> str | None:
    prefix = "/api/ai-reviews/"
    suffix = "/research-evidence"
    if not path.startswith(prefix) or not path.endswith(suffix):
        return None
    ai_review_id = unquote(path[len(prefix) : -len(suffix)]).strip()
    return ai_review_id if ai_review_id and "/" not in ai_review_id else ""


def _optional_dependency_install_route_dependency(path: str) -> str | None:
    prefix = "/api/settings/dependencies/"
    suffix = "/install"
    if not path.startswith(prefix) or not path.endswith(suffix):
        return None
    dependency = unquote(path[len(prefix) : -len(suffix)]).strip().lower()
    return dependency if dependency and "/" not in dependency else ""


def _optional_dependency_install_request_allowed(
    *,
    intent: str | None,
    fetch_site: str | None,
    origin: str | None,
    host: str | None,
) -> bool:
    if intent != "settings-ui" or fetch_site not in {"same-origin", "same-site"}:
        return False
    origin_hostname = urlparse(origin or "").hostname
    request_hostname = urlparse(f"//{host or ''}").hostname
    if not origin_hostname or not request_hostname:
        return False
    return origin_hostname == request_hostname or (
        _is_loopback_hostname(origin_hostname) and _is_loopback_hostname(request_hostname)
    )


def _is_loopback_hostname(hostname: str) -> bool:
    if hostname == "localhost" or hostname.endswith(".localhost"):
        return True
    try:
        return ip_address(hostname).is_loopback
    except ValueError:
        return False


def _ai_review_http_projection(
    record: AiReviewRunRecord | AuthoritativeAiReviewRunRecord,
) -> dict[str, object]:
    return {**record.record, "authority": record.authority}


def _is_ai_review_conflict(code: str) -> bool:
    return any(
        token in code
        for token in ("conflict", "evidence", "lineage", "hash_mismatch", "not_authoritative")
    )


def _ai_review_error_detail(code: str) -> str:
    details = {
        "invalid_ai_review_request": "AI review request fields are invalid.",
        "invalid_ai_review_query": "AI review query parameters are invalid.",
        "invalid_ai_review_decision_request": "AI review decision request fields are invalid.",
        "ai_review_not_found": "AI review was not found.",
        "ai_review_not_authoritative": "AI review decisions require an authoritative review.",
        "decision_conflict": "The decision does not supersede the current latest decision.",
    }
    return details.get(code, "Stored AI review evidence conflicts with the requested operation.")


def _ai_research_m4_error_status(code: str) -> int:
    if code.endswith("_not_found"):
        return 404
    if any(
        token in code
        for token in (
            "horizon_not_reached",
            "context_mismatch",
            "coverage_missing",
            "binding_invalid",
            "hash_mismatch",
            "multi_view_not_allowed",
        )
    ):
        return 409
    return 400


def _ai_research_m4_error_detail(code: str) -> str:
    details = {
        "ai_research_review_not_found": "The authoritative AI review was not found.",
        "ai_research_source_run_not_found": "The source research run was not found.",
        "ai_research_evidence_not_found": "The M4 research evidence was not found.",
        "ai_research_outcome_run_not_found": "The audited outcome run was not found.",
        "ai_research_benchmark_run_not_found": "The audited benchmark run was not found.",
        "ai_research_horizon_not_reached": "The declared recommendation horizon has not been reached.",
        "ai_research_outcome_context_mismatch": "The outcome run does not match the original research context.",
        "ai_research_benchmark_context_mismatch": "The benchmark run does not match the original market and timeframe.",
        "ai_research_benchmark_coverage_missing": "The benchmark run does not cover the recommendation horizon.",
        "multi_view_not_allowed_for_timeframe": "Multi-view research is limited to daily or weekly research.",
    }
    return details.get(code, "The M4 AI research request or stored evidence is invalid.")


def _ai_review_read_error_code(error: ValueError) -> str:
    code = str(error)
    if code in {
        "ai_review_evidence_hash_mismatch",
        "ai_review_external_assessment_invalid",
        "ai_review_record_conflict",
        "ai_review_record_hash_mismatch",
    }:
        return code
    return "ai_review_record_conflict"
