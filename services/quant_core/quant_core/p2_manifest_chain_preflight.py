from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from quant_core.p1_acceptance import (
    DEFAULT_P1_ACCEPTANCE_REPORT_PATH,
    load_p1_acceptance_report,
    validate_p1_acceptance_manifest,
)
from quant_core.p2_acceptance import (
    DEFAULT_P2_PRE_LIVE_ACCEPTANCE_REPORT_PATH,
    load_p2_pre_live_acceptance_report,
    validate_p2_pre_live_acceptance_manifest,
)
from quant_core.p2_paper_replay import (
    DEFAULT_P2_PAPER_REPLAY_REPORT_PATH,
    load_p2_paper_replay_report,
    validate_p2_paper_replay_manifest,
)
from quant_core.p2_readiness_acceptance import (
    DEFAULT_P2_READINESS_ACCEPTANCE_REPORT_PATH,
    load_p2_readiness_acceptance_report,
    validate_p2_readiness_acceptance_manifest,
)


DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH = Path("data") / "p2-chain-preflight.json"
P2_MANIFEST_CHAIN_STAGE_IDS = [
    "p1-acceptance",
    "p2-paper-replay",
    "p2-pre-live-acceptance",
    "p2-readiness-acceptance",
]
P2_MANIFEST_CHAIN_STAGE_COMMANDS = {
    "p1-acceptance": ("run-p1-acceptance", "npm run docker:smoke:p1 -- --no-build"),
    "p2-paper-replay": ("run-p2-paper-replay", "npm run docker:smoke:p2:paper-replay -- --no-build"),
    "p2-pre-live-acceptance": ("run-p2-pre-live", "npm run docker:smoke:p2:pre-live -- --no-build"),
    "p2-readiness-acceptance": ("run-p2-readiness", "npm run docker:smoke:p2 -- --no-build"),
}


def build_p2_manifest_chain_preflight(
    *,
    p1_acceptance_report: Path = DEFAULT_P1_ACCEPTANCE_REPORT_PATH,
    p2_paper_replay_report: Path = DEFAULT_P2_PAPER_REPLAY_REPORT_PATH,
    p2_pre_live_acceptance_report: Path = DEFAULT_P2_PRE_LIVE_ACCEPTANCE_REPORT_PATH,
    p2_readiness_acceptance_report: Path = DEFAULT_P2_READINESS_ACCEPTANCE_REPORT_PATH,
) -> dict[str, Any]:
    stages = [
        _p2_manifest_chain_stage(
            stage_id="p1-acceptance",
            label="P1 acceptance",
            path=Path(p1_acceptance_report),
            loader=load_p1_acceptance_report,
            validator=validate_p1_acceptance_manifest,
        ),
        _p2_manifest_chain_stage(
            stage_id="p2-paper-replay",
            label="P2 paper replay",
            path=Path(p2_paper_replay_report),
            loader=load_p2_paper_replay_report,
            validator=validate_p2_paper_replay_manifest,
        ),
        _p2_manifest_chain_stage(
            stage_id="p2-pre-live-acceptance",
            label="P2 pre-live acceptance",
            path=Path(p2_pre_live_acceptance_report),
            loader=load_p2_pre_live_acceptance_report,
            validator=validate_p2_pre_live_acceptance_manifest,
        ),
        _p2_manifest_chain_stage(
            stage_id="p2-readiness-acceptance",
            label="P2 readiness acceptance",
            path=Path(p2_readiness_acceptance_report),
            loader=load_p2_readiness_acceptance_report,
            validator=validate_p2_readiness_acceptance_manifest,
        ),
    ]
    valid_stage_count = sum(1 for stage in stages if stage["status"] == "valid")
    first_blocker = next((stage for stage in stages if stage["status"] != "valid"), None)
    blocker_ids = [stage["id"] for stage in stages if stage["status"] != "valid"]
    ready = first_blocker is None
    manifest = {
        "kind": "aiqt.p2ManifestChainPreflight",
        "schemaVersion": 1,
        "status": "ready" if ready else "blocked",
        "ready": ready,
        "validStageCount": valid_stage_count,
        "totalStageCount": len(stages),
        "blockerIds": blocker_ids,
        "nextAction": "" if ready else str(first_blocker["nextAction"]),
        "nextCommand": "" if ready else str(first_blocker["nextCommand"]),
        "stages": stages,
        "paperOnly": True,
        "orderSubmissionEnabled": False,
        "liveTradingAllowed": False,
        "liveOrderSubmitted": False,
        "routeExecuted": False,
        "liveBlockedBoundary": True,
    }
    validate_p2_manifest_chain_preflight(manifest)
    return manifest


def write_p2_manifest_chain_preflight_report(
    path: Path = DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH,
    manifest: dict[str, Any] | None = None,
) -> Path:
    output_path = Path(path)
    payload = manifest if manifest is not None else build_p2_manifest_chain_preflight()
    validate_p2_manifest_chain_preflight(payload)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return output_path


def p2_manifest_chain_preflight_to_audit_event_payload(
    manifest: dict[str, Any],
    *,
    source_path: Path = DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH,
    created_at: datetime | None = None,
) -> dict[str, Any]:
    validate_p2_manifest_chain_preflight(manifest)
    normalized = json.dumps(manifest, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]
    generated_at = created_at or datetime.now(timezone.utc)
    status = _string_field(manifest, "status") or "blocked"
    valid_stage_count = _int_field(manifest, "validStageCount")
    total_stage_count = _int_field(manifest, "totalStageCount")
    next_action = _string_field(manifest, "nextAction") or "none"
    blocker_ids = _string_list(manifest.get("blockerIds"))
    stage_statuses = [
        {
            "id": _string_field(stage, "id") or "",
            "status": _string_field(stage, "status") or "",
            "path": _string_field(stage, "path") or "",
            "nextAction": _string_field(stage, "nextAction") or "",
        }
        for stage in _dict_list(manifest.get("stages"))
    ]
    first_blocker = blocker_ids[0] if blocker_ids else ""
    return {
        "schemaVersion": 1,
        "eventId": f"p2-chain-preflight-{digest}",
        "eventType": "p2_manifest_chain_preflight",
        "runId": None,
        "createdAt": generated_at.isoformat(),
        "stage": "p2",
        "source": "core-service",
        "summary": (
            f"P2 manifest chain preflight {status} "
            f"{valid_stage_count}/{total_stage_count} next={next_action}"
        ),
        "detail": (
            f"First blocker: {first_blocker or 'none'}; report: {source_path}; "
            "live trading and direct order submission remain blocked."
        ),
        "metadata": {
            "reportKind": "p2_manifest_chain_preflight",
            "manifestKind": _string_field(manifest, "kind") or "aiqt.p2ManifestChainPreflight",
            "sourcePath": str(source_path),
            "preflightStatus": status,
            "ready": bool(manifest.get("ready")),
            "validStageCount": valid_stage_count,
            "totalStageCount": total_stage_count,
            "blockerIds": blocker_ids,
            "nextAction": _string_field(manifest, "nextAction") or "",
            "nextCommand": _string_field(manifest, "nextCommand") or "",
            "stageStatuses": stage_statuses,
            "paperOnly": bool(manifest.get("paperOnly")),
            "orderSubmissionEnabled": bool(manifest.get("orderSubmissionEnabled")),
            "liveTradingAllowed": bool(manifest.get("liveTradingAllowed")),
            "liveOrderSubmitted": bool(manifest.get("liveOrderSubmitted")),
            "routeExecuted": bool(manifest.get("routeExecuted")),
            "liveBlockedBoundary": bool(manifest.get("liveBlockedBoundary")),
            "manifestSha256": hashlib.sha256(normalized.encode("utf-8")).hexdigest(),
        },
    }


def load_p2_manifest_chain_preflight_report(
    path: Path = DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH,
) -> dict[str, Any]:
    try:
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise FileNotFoundError(f"P2 manifest chain preflight report not found at {path}") from error
    except json.JSONDecodeError as error:
        raise ValueError(f"P2 manifest chain preflight report is not valid JSON: {error}") from error
    if not isinstance(payload, dict):
        raise ValueError("P2 manifest chain preflight report must be a JSON object")
    return payload


def _p2_manifest_chain_stage(
    *,
    stage_id: str,
    label: str,
    path: Path,
    loader: Any,
    validator: Any,
) -> dict[str, Any]:
    next_action, next_command = P2_MANIFEST_CHAIN_STAGE_COMMANDS[stage_id]
    try:
        manifest = loader(path)
        summary = validator(manifest)
    except FileNotFoundError as error:
        return {
            "id": stage_id,
            "label": label,
            "status": "missing",
            "path": str(path),
            "summary": "",
            "reason": str(error),
            "nextAction": next_action,
            "nextCommand": next_command,
        }
    except ValueError as error:
        return {
            "id": stage_id,
            "label": label,
            "status": "invalid",
            "path": str(path),
            "summary": "",
            "reason": str(error),
            "nextAction": next_action,
            "nextCommand": next_command,
        }
    return {
        "id": stage_id,
        "label": label,
        "status": "valid",
        "path": str(path),
        "summary": summary,
        "reason": "",
        "nextAction": "",
        "nextCommand": "",
    }


def validate_p2_manifest_chain_preflight(manifest: Any) -> str:
    if not isinstance(manifest, dict):
        raise ValueError("P2 manifest chain preflight must be an object")
    if manifest.get("kind") != "aiqt.p2ManifestChainPreflight":
        raise ValueError("P2 manifest chain preflight kind must be aiqt.p2ManifestChainPreflight")
    if manifest.get("schemaVersion") != 1:
        raise ValueError("P2 manifest chain preflight schemaVersion must be 1")

    status = _required_string_field(manifest, "status", "P2 manifest chain preflight status is required")
    if status not in {"ready", "blocked"}:
        raise ValueError("P2 manifest chain preflight status must be ready or blocked")
    if manifest.get("paperOnly") is not True:
        raise ValueError("P2 manifest chain preflight must be paper-only")
    if (
        manifest.get("orderSubmissionEnabled") is not False
        or manifest.get("liveTradingAllowed") is not False
        or manifest.get("liveOrderSubmitted") is not False
        or manifest.get("routeExecuted") is not False
        or manifest.get("liveBlockedBoundary") is not True
    ):
        raise ValueError("P2 manifest chain preflight live-blocked boundary is not enforced")

    stages = manifest.get("stages")
    if not isinstance(stages, list) or not stages:
        raise ValueError("P2 manifest chain preflight stages must be a non-empty list")
    total_stage_count = _int_field(manifest, "totalStageCount")
    valid_stage_count = _int_field(manifest, "validStageCount")
    if total_stage_count != len(stages):
        raise ValueError("P2 manifest chain preflight totalStageCount does not match stages")
    if total_stage_count != len(P2_MANIFEST_CHAIN_STAGE_IDS):
        raise ValueError("P2 manifest chain preflight must include all expected P2 chain stages")

    stage_ids: list[str] = []
    non_valid_stage_ids: list[str] = []
    calculated_valid_count = 0
    for stage in stages:
        if not isinstance(stage, dict):
            raise ValueError("P2 manifest chain preflight stage must be an object")
        stage_id = _required_string_field(stage, "id", "P2 manifest chain preflight stage id is required")
        stage_ids.append(stage_id)
        stage_status = _required_string_field(
            stage,
            "status",
            f"P2 manifest chain preflight stage {stage_id} status is required",
        )
        if stage_status not in {"valid", "missing", "invalid"}:
            raise ValueError(f"P2 manifest chain preflight stage {stage_id} status is invalid")
        _required_string_field(stage, "label", f"P2 manifest chain preflight stage {stage_id} label is required")
        _required_string_field(stage, "path", f"P2 manifest chain preflight stage {stage_id} path is required")
        if stage_status == "valid":
            calculated_valid_count += 1
        else:
            non_valid_stage_ids.append(stage_id)
            _required_string_field(
                stage,
                "reason",
                f"P2 manifest chain preflight stage {stage_id} reason is required",
            )
            _required_string_field(
                stage,
                "nextAction",
                f"P2 manifest chain preflight stage {stage_id} nextAction is required",
            )
            _required_string_field(
                stage,
                "nextCommand",
                f"P2 manifest chain preflight stage {stage_id} nextCommand is required",
            )

    if stage_ids != P2_MANIFEST_CHAIN_STAGE_IDS:
        raise ValueError("P2 manifest chain preflight stages are out of order or incomplete")
    if valid_stage_count != calculated_valid_count:
        raise ValueError("P2 manifest chain preflight validStageCount does not match stages")
    blocker_ids = _string_list(manifest.get("blockerIds"))
    if blocker_ids != non_valid_stage_ids:
        raise ValueError("P2 manifest chain preflight blockerIds do not match non-valid stages")

    ready = bool(manifest.get("ready"))
    if status == "ready":
        if not ready or blocker_ids or valid_stage_count != total_stage_count:
            raise ValueError("P2 manifest chain preflight ready status is inconsistent")
        if _string_field(manifest, "nextAction") or _string_field(manifest, "nextCommand"):
            raise ValueError("P2 manifest chain preflight ready status must not include a next action")
    else:
        if ready or not blocker_ids or valid_stage_count >= total_stage_count:
            raise ValueError("P2 manifest chain preflight blocked status is inconsistent")
        first_blocker = next(stage for stage in stages if stage.get("status") != "valid")
        if _string_field(manifest, "nextAction") != _string_field(first_blocker, "nextAction"):
            raise ValueError("P2 manifest chain preflight nextAction does not match first blocker")
        if _string_field(manifest, "nextCommand") != _string_field(first_blocker, "nextCommand"):
            raise ValueError("P2 manifest chain preflight nextCommand does not match first blocker")

    next_action = _string_field(manifest, "nextAction") or "none"
    return f"p2 manifest chain preflight status={status} valid={valid_stage_count}/{total_stage_count} next={next_action}"


def load_p2_manifest_chain_preflight_status(
    path: Path = DEFAULT_P2_MANIFEST_CHAIN_PREFLIGHT_REPORT_PATH,
) -> dict[str, Any]:
    source_path = Path(path)
    try:
        manifest = load_p2_manifest_chain_preflight_report(source_path)
        summary = validate_p2_manifest_chain_preflight(manifest)
    except FileNotFoundError as error:
        next_action, next_command = P2_MANIFEST_CHAIN_STAGE_COMMANDS["p1-acceptance"]
        return _p2_manifest_chain_preflight_status(
            None,
            status="missing",
            available=False,
            source_path=source_path,
            summary="P2 manifest chain preflight is missing.",
            reason=str(error),
            ready=False,
            valid_stage_count=0,
            total_stage_count=len(P2_MANIFEST_CHAIN_STAGE_IDS),
            blocker_ids=[],
            next_action=next_action,
            next_command=next_command,
            stages=[],
        )
    except ValueError as error:
        manifest = _read_manifest_for_invalid_status(source_path)
        return _p2_manifest_chain_preflight_status(
            manifest,
            status="invalid",
            available=False,
            source_path=source_path,
            summary="P2 manifest chain preflight is invalid.",
            reason=str(error),
        )

    return _p2_manifest_chain_preflight_status(
        manifest,
        status=str(manifest.get("status") or ""),
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


def _p2_manifest_chain_preflight_status(
    manifest: dict[str, Any] | None,
    *,
    status: str,
    available: bool,
    source_path: Path,
    summary: str,
    reason: str,
    ready: bool | None = None,
    valid_stage_count: int | None = None,
    total_stage_count: int | None = None,
    blocker_ids: list[str] | None = None,
    next_action: str | None = None,
    next_command: str | None = None,
    stages: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    return {
        "kind": "aiqt.p2ManifestChainPreflightStatus",
        "schemaVersion": 1,
        "status": status,
        "available": available,
        "sourcePath": str(source_path),
        "summary": summary,
        "reason": reason,
        "ready": bool(_bool_field(manifest, "ready")) if ready is None else ready,
        "validStageCount": _int_field(manifest, "validStageCount") if valid_stage_count is None else valid_stage_count,
        "totalStageCount": _int_field(manifest, "totalStageCount") if total_stage_count is None else total_stage_count,
        "blockerIds": _string_list(manifest.get("blockerIds")) if blocker_ids is None and manifest else blocker_ids or [],
        "nextAction": _string_field(manifest, "nextAction") or next_action or "",
        "nextCommand": _string_field(manifest, "nextCommand") or next_command or "",
        "stages": _stage_payloads(manifest.get("stages")) if stages is None and manifest else stages or [],
        "paperOnly": bool(manifest.get("paperOnly")) if manifest else False,
        "orderSubmissionEnabled": bool(manifest.get("orderSubmissionEnabled")) if manifest else False,
        "liveTradingAllowed": bool(manifest.get("liveTradingAllowed")) if manifest else False,
        "liveOrderSubmitted": bool(manifest.get("liveOrderSubmitted")) if manifest else False,
        "routeExecuted": bool(manifest.get("routeExecuted")) if manifest else False,
        "liveBlockedBoundary": bool(manifest.get("liveBlockedBoundary")) if manifest else False,
        "manifest": manifest,
    }


def _stage_payloads(stages: Any) -> list[dict[str, str]]:
    if not isinstance(stages, list):
        return []
    payloads: list[dict[str, str]] = []
    for stage in stages:
        if not isinstance(stage, dict):
            continue
        payloads.append(
            {
                "id": _string_field(stage, "id") or "",
                "label": _string_field(stage, "label") or "",
                "status": _string_field(stage, "status") or "",
                "path": _string_field(stage, "path") or "",
                "summary": _string_field(stage, "summary") or "",
                "reason": _string_field(stage, "reason") or "",
                "nextAction": _string_field(stage, "nextAction") or "",
                "nextCommand": _string_field(stage, "nextCommand") or "",
            }
        )
    return payloads


def _required_string_field(manifest: dict[str, Any], field: str, message: str) -> str:
    value = _string_field(manifest, field)
    if not value:
        raise ValueError(message)
    return value


def _string_field(manifest: Any, field: str) -> str | None:
    if not isinstance(manifest, dict):
        return None
    value = manifest.get(field)
    return str(value).strip() if value is not None and str(value).strip() else None


def _bool_field(manifest: Any, field: str) -> bool:
    return bool(manifest.get(field)) if isinstance(manifest, dict) else False


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


def _dict_list(value: object) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]
