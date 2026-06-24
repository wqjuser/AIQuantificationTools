from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from quant_core.p1_acceptance import load_p1_acceptance_report, validate_p1_acceptance_manifest
from quant_core.p2_acceptance import load_p2_pre_live_acceptance_report, validate_p2_pre_live_acceptance_manifest
from quant_core.p2_paper_replay import load_p2_paper_replay_report, validate_p2_paper_replay_manifest


DEFAULT_P2_READINESS_ACCEPTANCE_REPORT_PATH = Path("data") / "p2-readiness-acceptance.json"
P2_READINESS_ACCEPTANCE_REQUIRED_CHECKS = {
    "p1-acceptance",
    "paper-execution-replay",
    "pre-live-checklist",
    "p2-pre-live-manifest",
    "readiness-evidence-coverage",
    "live-blocked-boundary",
}


def build_p2_readiness_acceptance_manifest(
    *,
    base_url: str = "",
    run_id: str = "run-p2-readiness",
    p1_acceptance_manifest: dict[str, Any],
    p1_acceptance_path: Path,
    p2_pre_live_acceptance_manifest: dict[str, Any],
    p2_pre_live_acceptance_path: Path,
    p2_paper_replay_manifest: dict[str, Any],
    p2_paper_replay_path: Path,
    operator_runbook_audit_event_id: str | None = None,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    validate_p1_acceptance_manifest(p1_acceptance_manifest)
    paper_replay_summary = validate_p2_paper_replay_manifest(p2_paper_replay_manifest)
    pre_live_summary = validate_p2_pre_live_acceptance_manifest(p2_pre_live_acceptance_manifest)

    p1_run_id = _required_string_field(p1_acceptance_manifest, "runId", "P1 acceptance manifest runId is required")
    pre_live_run_id = _required_string_field(
        p2_pre_live_acceptance_manifest,
        "runId",
        "P2 pre-live acceptance manifest runId is required",
    )
    paper_replay_run_id = _required_string_field(
        p2_paper_replay_manifest,
        "runId",
        "P2 paper replay manifest runId is required",
    )
    market = _required_string_field(
        p2_pre_live_acceptance_manifest,
        "market",
        "P2 pre-live acceptance manifest market is required",
    )
    symbol = _required_string_field(
        p2_pre_live_acceptance_manifest,
        "symbol",
        "P2 pre-live acceptance manifest symbol is required",
    )
    timeframe = _required_string_field(
        p2_pre_live_acceptance_manifest,
        "timeframe",
        "P2 pre-live acceptance manifest timeframe is required",
    )
    adapter_id = _required_string_field(
        p2_pre_live_acceptance_manifest,
        "adapterId",
        "P2 pre-live acceptance manifest adapterId is required",
    )

    _assert_same_manifest_field(market, p2_paper_replay_manifest, "market", label="P2 paper replay manifest")
    _assert_same_manifest_field(symbol, p2_paper_replay_manifest, "symbol", label="P2 paper replay manifest")
    _assert_same_manifest_field(timeframe, p2_paper_replay_manifest, "timeframe", label="P2 paper replay manifest")
    _assert_same_manifest_field(adapter_id, p2_paper_replay_manifest, "adapterId", label="P2 paper replay manifest")
    _assert_same_manifest_field(market, p1_acceptance_manifest, "queuedMarket", label="P1 acceptance manifest")
    _assert_same_manifest_field(symbol, p1_acceptance_manifest, "queuedSymbol", label="P1 acceptance manifest")
    _assert_same_manifest_field(timeframe, p1_acceptance_manifest, "timeframe", label="P1 acceptance manifest")

    selected_run_id = str(run_id or "").strip() or "run-p2-readiness"
    operator_event_id = (
        str(operator_runbook_audit_event_id or "").strip()
        or f"operator-runbook-report-{adapter_id}-{symbol}-{timeframe}-{selected_run_id}"
    )
    criterion_ids = [
        "p1-acceptance",
        "paper-execution-replay",
        "pre-live-checklist",
        "p2-pre-live-manifest",
        "readiness-evidence-coverage",
        "live-blocked-boundary",
    ]
    manifest_paths = {
        "p1Acceptance": str(p1_acceptance_path),
        "p2PreLiveAcceptance": str(p2_pre_live_acceptance_path),
        "p2PaperReplay": str(p2_paper_replay_path),
    }
    checks = [
        {
            "id": "p1-acceptance",
            "status": "passed",
            "summary": "P1 research workflow acceptance is valid and live trading remains blocked.",
            "evidenceId": manifest_paths["p1Acceptance"],
        },
        {
            "id": "paper-execution-replay",
            "status": "passed",
            "summary": paper_replay_summary,
            "evidenceId": manifest_paths["p2PaperReplay"],
        },
        {
            "id": "pre-live-checklist",
            "status": "passed",
            "summary": (
                "P2 pre-live checklist evidence is present for manual review; "
                f"promotionStatus={_string_field(p2_pre_live_acceptance_manifest, 'promotionStatus') or 'unknown'}"
            ),
            "evidenceId": pre_live_run_id,
        },
        {
            "id": "p2-pre-live-manifest",
            "status": "passed",
            "summary": pre_live_summary,
            "evidenceId": manifest_paths["p2PreLiveAcceptance"],
        },
        {
            "id": "readiness-evidence-coverage",
            "status": "passed",
            "summary": "P1 acceptance, P2 paper replay, P2 pre-live manifest, and operator runbook evidence are traceable.",
            "evidenceId": "p2-evidence-coverage",
        },
        {
            "id": "live-blocked-boundary",
            "status": "passed",
            "summary": "No direct order submission, live order, route execution, or live trading is allowed.",
            "evidenceId": "forced-platform-boundary",
        },
    ]
    manifest = {
        "kind": "aiqt.p2ReadinessAcceptanceManifest",
        "schemaVersion": 1,
        "generatedAt": (generated_at or datetime.now(timezone.utc)).isoformat(),
        "status": "accepted",
        "baseUrl": str(base_url or ""),
        "market": market,
        "symbol": symbol,
        "timeframe": timeframe,
        "runId": selected_run_id,
        "adapterId": adapter_id,
        "p1AcceptanceRunId": p1_run_id,
        "p2PreLiveAcceptanceRunId": pre_live_run_id,
        "p2PaperReplayRunId": paper_replay_run_id,
        "operatorRunbookAuditEventId": operator_event_id,
        "readinessCoverageStatus": "covered",
        "acceptedCriterionCount": len(criterion_ids),
        "totalCriterionCount": len(criterion_ids),
        "blockingCriterionCount": 0,
        "criterionIds": criterion_ids,
        "auditEventIds": _unique_strings(
            [
                f"p1-acceptance-{p1_run_id}",
                *_string_list(p2_paper_replay_manifest.get("auditEventIds")),
                *_string_list(p2_pre_live_acceptance_manifest.get("auditEventIds")),
                operator_event_id,
            ]
        ),
        "manifestPaths": manifest_paths,
        "paperOnly": True,
        "orderSubmissionEnabled": False,
        "liveTradingAllowed": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
        "liveBlockedBoundary": True,
        "checkCount": len(checks),
        "checks": checks,
    }
    validate_p2_readiness_acceptance_manifest(manifest)
    return manifest


def build_p2_readiness_acceptance_manifest_from_reports(
    *,
    p1_acceptance_report: Path,
    p2_pre_live_acceptance_report: Path,
    p2_paper_replay_report: Path,
    base_url: str = "",
    run_id: str = "run-p2-readiness",
    operator_runbook_audit_event_id: str | None = None,
) -> dict[str, Any]:
    return build_p2_readiness_acceptance_manifest(
        base_url=base_url,
        run_id=run_id,
        p1_acceptance_manifest=load_p1_acceptance_report(p1_acceptance_report),
        p1_acceptance_path=Path(p1_acceptance_report),
        p2_pre_live_acceptance_manifest=load_p2_pre_live_acceptance_report(p2_pre_live_acceptance_report),
        p2_pre_live_acceptance_path=Path(p2_pre_live_acceptance_report),
        p2_paper_replay_manifest=load_p2_paper_replay_report(p2_paper_replay_report),
        p2_paper_replay_path=Path(p2_paper_replay_report),
        operator_runbook_audit_event_id=operator_runbook_audit_event_id,
    )


def write_p2_readiness_acceptance_report(path: Path, manifest: dict[str, Any]) -> Path:
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return destination


def load_p2_readiness_acceptance_report(
    path: Path = DEFAULT_P2_READINESS_ACCEPTANCE_REPORT_PATH,
) -> dict[str, Any]:
    try:
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise FileNotFoundError(f"P2 readiness acceptance report not found at {path}") from error
    except json.JSONDecodeError as error:
        raise ValueError(f"P2 readiness acceptance report is not valid JSON: {error}") from error
    if not isinstance(payload, dict):
        raise ValueError("P2 readiness acceptance report must be a JSON object")
    return payload


def validate_p2_readiness_acceptance_manifest(manifest: Any) -> str:
    if not isinstance(manifest, dict):
        raise ValueError("P2 readiness acceptance manifest must be an object")
    if manifest.get("kind") != "aiqt.p2ReadinessAcceptanceManifest":
        raise ValueError("P2 readiness acceptance manifest kind must be aiqt.p2ReadinessAcceptanceManifest")
    if manifest.get("schemaVersion") != 1:
        raise ValueError("P2 readiness acceptance manifest schemaVersion must be 1")
    if manifest.get("status") != "accepted":
        raise ValueError("P2 readiness acceptance manifest status must be accepted")

    run_id = _required_string_field(manifest, "runId", "P2 readiness acceptance manifest runId is required")
    _required_string_field(manifest, "market", "P2 readiness acceptance manifest market is required")
    _required_string_field(manifest, "symbol", "P2 readiness acceptance manifest symbol is required")
    _required_string_field(manifest, "timeframe", "P2 readiness acceptance manifest timeframe is required")
    _required_string_field(manifest, "adapterId", "P2 readiness acceptance manifest adapterId is required")
    coverage_status = _required_string_field(
        manifest,
        "readinessCoverageStatus",
        "P2 readiness acceptance manifest readinessCoverageStatus is required",
    )
    if coverage_status != "covered":
        raise ValueError("P2 readiness acceptance manifest readinessCoverageStatus must be covered")

    accepted_criteria = _int_field(manifest, "acceptedCriterionCount")
    total_criteria = _int_field(manifest, "totalCriterionCount")
    blocking_criteria = _int_field(manifest, "blockingCriterionCount")
    if total_criteria <= 0:
        raise ValueError("P2 readiness acceptance manifest totalCriterionCount must be positive")
    if accepted_criteria != total_criteria:
        raise ValueError("P2 readiness acceptance manifest acceptedCriterionCount must equal totalCriterionCount")
    if blocking_criteria != 0:
        raise ValueError("P2 readiness acceptance manifest blockingCriterionCount must be zero")

    criterion_ids = _string_list(manifest.get("criterionIds"))
    if len(criterion_ids) != total_criteria:
        raise ValueError("P2 readiness acceptance manifest criterionIds must match totalCriterionCount")
    audit_event_ids = _string_list(manifest.get("auditEventIds"))
    if not audit_event_ids:
        raise ValueError("P2 readiness acceptance manifest auditEventIds must be non-empty")
    manifest_paths = manifest.get("manifestPaths")
    if not isinstance(manifest_paths, dict):
        raise ValueError("P2 readiness acceptance manifest manifestPaths must be an object")
    for field in ("p1Acceptance", "p2PreLiveAcceptance", "p2PaperReplay"):
        if not _string_field(manifest_paths, field):
            raise ValueError(f"P2 readiness acceptance manifest manifestPaths.{field} is required")

    if manifest.get("paperOnly") is not True:
        raise ValueError("P2 readiness acceptance manifest must be paper-only")
    if (
        manifest.get("orderSubmissionEnabled") is not False
        or manifest.get("liveTradingAllowed") is not False
        or manifest.get("liveOrderSubmitted") is not False
        or manifest.get("routeExecuted") is not False
        or manifest.get("liveBlockedBoundary") is not True
    ):
        raise ValueError("P2 readiness acceptance manifest live-blocked boundary is not enforced")

    checks = manifest.get("checks")
    if not isinstance(checks, list) or not checks:
        raise ValueError("P2 readiness acceptance manifest checks must be a non-empty list")
    if _int_field(manifest, "checkCount") != len(checks):
        raise ValueError("P2 readiness acceptance manifest checkCount does not match checks")

    check_ids: list[str] = []
    for check in checks:
        if not isinstance(check, dict):
            raise ValueError("P2 readiness acceptance manifest check must be an object")
        check_id = str(check.get("id") or "").strip()
        if not check_id:
            raise ValueError("P2 readiness acceptance manifest check id is required")
        if check.get("status") != "passed":
            raise ValueError(f"P2 readiness acceptance manifest check {check_id} did not pass")
        if not str(check.get("summary") or "").strip():
            raise ValueError(f"P2 readiness acceptance manifest check {check_id} summary is required")
        if not str(check.get("evidenceId") or "").strip():
            raise ValueError(f"P2 readiness acceptance manifest check {check_id} evidenceId is required")
        check_ids.append(check_id)

    missing_checks = P2_READINESS_ACCEPTANCE_REQUIRED_CHECKS.difference(check_ids)
    if missing_checks:
        raise ValueError(
            f"P2 readiness acceptance manifest missing required checks: {', '.join(sorted(missing_checks))}"
        )

    return (
        f"p2 readiness acceptance manifest run={run_id} "
        f"criteria={accepted_criteria}/{total_criteria} blockers={blocking_criteria} liveBlocked=True"
    )


def load_p2_readiness_acceptance_status(
    path: Path = DEFAULT_P2_READINESS_ACCEPTANCE_REPORT_PATH,
) -> dict[str, Any]:
    source_path = Path(path)
    try:
        manifest = load_p2_readiness_acceptance_report(source_path)
        summary = validate_p2_readiness_acceptance_manifest(manifest)
    except FileNotFoundError as error:
        return _p2_readiness_acceptance_status(
            None,
            status="missing",
            available=False,
            source_path=source_path,
            summary="P2 readiness acceptance manifest is missing.",
            reason=str(error),
        )
    except ValueError as error:
        manifest = _read_manifest_for_invalid_status(source_path)
        return _p2_readiness_acceptance_status(
            manifest,
            status="invalid",
            available=False,
            source_path=source_path,
            summary="P2 readiness acceptance manifest is invalid.",
            reason=str(error),
        )

    return _p2_readiness_acceptance_status(
        manifest,
        status="accepted",
        available=True,
        source_path=source_path,
        summary=summary,
        reason="",
    )


def _read_manifest_for_invalid_status(source_path: Path) -> dict[str, Any] | None:
    try:
        payload = json.loads(source_path.read_text(encoding="utf-8"))
    except Exception:
        return None
    return payload if isinstance(payload, dict) else None


def _p2_readiness_acceptance_status(
    manifest: dict[str, Any] | None,
    *,
    status: str,
    available: bool,
    source_path: Path,
    summary: str,
    reason: str,
) -> dict[str, Any]:
    check_ids = _p2_readiness_acceptance_check_ids(manifest)
    return {
        "kind": "aiqt.p2ReadinessAcceptanceStatus",
        "schemaVersion": 1,
        "status": status,
        "available": available,
        "sourcePath": str(source_path),
        "summary": summary,
        "reason": reason,
        "generatedAt": _string_field(manifest, "generatedAt"),
        "runId": _string_field(manifest, "runId"),
        "market": _string_field(manifest, "market"),
        "symbol": _string_field(manifest, "symbol"),
        "timeframe": _string_field(manifest, "timeframe"),
        "adapterId": _string_field(manifest, "adapterId"),
        "p1AcceptanceRunId": _string_field(manifest, "p1AcceptanceRunId"),
        "p2PreLiveAcceptanceRunId": _string_field(manifest, "p2PreLiveAcceptanceRunId"),
        "p2PaperReplayRunId": _string_field(manifest, "p2PaperReplayRunId"),
        "operatorRunbookAuditEventId": _string_field(manifest, "operatorRunbookAuditEventId"),
        "readinessCoverageStatus": _string_field(manifest, "readinessCoverageStatus"),
        "acceptedCriterionCount": _int_field(manifest, "acceptedCriterionCount") if manifest else 0,
        "totalCriterionCount": _int_field(manifest, "totalCriterionCount") if manifest else 0,
        "blockingCriterionCount": _int_field(manifest, "blockingCriterionCount") if manifest else 0,
        "criterionIds": _string_list(manifest.get("criterionIds")) if manifest else [],
        "auditEventIds": _string_list(manifest.get("auditEventIds")) if manifest else [],
        "manifestPaths": _manifest_paths_payload(manifest.get("manifestPaths") if manifest else None),
        "checkCount": len(check_ids),
        "requiredCheckCount": len(P2_READINESS_ACCEPTANCE_REQUIRED_CHECKS),
        "checkIds": check_ids,
        "paperOnly": bool(manifest.get("paperOnly")) if manifest else False,
        "orderSubmissionEnabled": bool(manifest.get("orderSubmissionEnabled")) if manifest else False,
        "liveTradingAllowed": bool(manifest.get("liveTradingAllowed")) if manifest else False,
        "liveOrderSubmitted": bool(manifest.get("liveOrderSubmitted")) if manifest else False,
        "routeExecuted": bool(manifest.get("routeExecuted")) if manifest else False,
        "liveBlockedBoundary": bool(manifest.get("liveBlockedBoundary")) if manifest else False,
        "manifest": manifest,
    }


def _p2_readiness_acceptance_check_ids(manifest: dict[str, Any] | None) -> list[str]:
    if not manifest:
        return []
    checks = manifest.get("checks")
    if not isinstance(checks, list):
        return []
    return [
        str(check.get("id") or "").strip()
        for check in checks
        if isinstance(check, dict) and str(check.get("id") or "").strip()
    ]


def _manifest_paths_payload(manifest_paths: Any) -> dict[str, str | None]:
    return {
        "p1Acceptance": _string_field(manifest_paths, "p1Acceptance"),
        "p2PreLiveAcceptance": _string_field(manifest_paths, "p2PreLiveAcceptance"),
        "p2PaperReplay": _string_field(manifest_paths, "p2PaperReplay"),
    }


def _required_string_field(manifest: dict[str, Any], field: str, message: str) -> str:
    value = _string_field(manifest, field)
    if not value:
        raise ValueError(message)
    return value


def _assert_same_manifest_field(expected: str, manifest: dict[str, Any], field: str, *, label: str) -> None:
    actual = _required_string_field(manifest, field, f"{label} {field} is required")
    if actual != expected:
        raise ValueError(f"Invalid P2 readiness acceptance inputs: {label}.{field} {actual} != {expected}")


def _string_field(manifest: Any, field: str) -> str | None:
    if not isinstance(manifest, dict):
        return None
    value = manifest.get(field)
    return str(value).strip() if value is not None and str(value).strip() else None


def _int_field(manifest: Any, field: str) -> int:
    if not isinstance(manifest, dict):
        return 0
    try:
        return int(manifest.get(field, 0))
    except (TypeError, ValueError):
        return 0


def _string_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def _unique_strings(values: list[str | None]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        normalized = str(value or "").strip()
        if normalized and normalized not in seen:
            seen.add(normalized)
            result.append(normalized)
    return result
