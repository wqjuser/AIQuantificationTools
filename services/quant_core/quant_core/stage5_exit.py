from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_STAGE5_EXIT_ACCEPTANCE_REPORT_PATH = Path("data") / "stage5-exit-acceptance.json"
STAGE5_EXIT_SOURCE_SPECS = (
    ("stage3-ai-review", "data/stage3-ai-review.json"),
    ("stage4-portfolio-paper", "data/stage4-portfolio-paper.json"),
    ("stage5-shadow-execution", "data/stage5-shadow-execution.json"),
    ("stage5-sandbox-readiness", "data/stage5-sandbox-readiness.json"),
    ("stage5-sandbox-readonly-probe", "data/stage5-sandbox-readonly-probe.json"),
    ("stage5-sandbox-authorization-preflight", "data/stage5-sandbox-authorization-preflight.json"),
    ("stage5-sandbox-authorization-review", "data/stage5-sandbox-authorization-review.json"),
)
_SAFETY = {
    "paperOnly": True,
    "authorizationEffective": False,
    "sandboxOrderSubmissionAllowed": False,
    "liveTradingAllowed": False,
    "orderSubmissionEnabled": False,
    "routeExecuted": False,
    "liveBlockedBoundary": True,
}
_FIELDS = {
    "kind",
    "schemaVersion",
    "generatedAt",
    "status",
    "stage5BaseRunId",
    "sourceArtifacts",
    "checks",
    *_SAFETY,
    "exitHash",
}


def build_stage5_exit_acceptance_manifest(
    *,
    repo_root: Path,
    stage5_base_run_id: str,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    root = Path(repo_root)
    run_id = str(stage5_base_run_id or "").strip()
    if not run_id:
        raise ValueError("Stage 5 exit acceptance stage5BaseRunId is required")
    sources = [
        {"id": source_id, "path": relative_path, "sha256": _file_sha256(root / relative_path)}
        for source_id, relative_path in STAGE5_EXIT_SOURCE_SPECS
    ]
    manifest: dict[str, Any] = {
        "kind": "aiqt.stage5ExitAcceptance",
        "schemaVersion": 1,
        "generatedAt": (generated_at or datetime.now(timezone.utc)).isoformat(),
        "status": "accepted_for_maintenance",
        "stage5BaseRunId": run_id,
        "sourceArtifacts": sources,
        "checks": [
            {"id": source_id, "status": "passed", "evidenceId": relative_path}
            for source_id, relative_path in STAGE5_EXIT_SOURCE_SPECS
        ],
        **_SAFETY,
    }
    manifest["exitHash"] = _manifest_hash(manifest)
    validate_stage5_exit_acceptance_manifest(manifest, repo_root=root, verify_sources=True)
    return manifest


def validate_stage5_exit_acceptance_manifest(
    manifest: Any,
    *,
    repo_root: Path | None = None,
    verify_sources: bool = False,
) -> str:
    if not isinstance(manifest, dict) or set(manifest) != _FIELDS:
        raise ValueError("Stage 5 exit acceptance manifest fields are invalid")
    if (
        manifest["kind"] != "aiqt.stage5ExitAcceptance"
        or type(manifest["schemaVersion"]) is not int
        or manifest["schemaVersion"] != 1
        or manifest["status"] != "accepted_for_maintenance"
        or not isinstance(manifest["stage5BaseRunId"], str)
        or not manifest["stage5BaseRunId"].strip()
    ):
        raise ValueError("Stage 5 exit acceptance manifest identity is invalid")
    _canonical_utc(manifest["generatedAt"])
    if any(manifest[field] is not expected for field, expected in _SAFETY.items()):
        raise ValueError("Stage 5 exit acceptance safety boundary is invalid")

    expected_sources = [
        {"id": source_id, "path": relative_path}
        for source_id, relative_path in STAGE5_EXIT_SOURCE_SPECS
    ]
    sources = manifest["sourceArtifacts"]
    if (
        not isinstance(sources, list)
        or len(sources) != len(expected_sources)
        or any(
            not isinstance(source, dict)
            or set(source) != {"id", "path", "sha256"}
            or source.get("id") != expected["id"]
            or source.get("path") != expected["path"]
            or not _is_sha256(source.get("sha256"))
            for source, expected in zip(sources, expected_sources, strict=True)
        )
    ):
        raise ValueError("Stage 5 exit acceptance source artifacts are invalid")

    expected_checks = [
        {"id": source_id, "status": "passed", "evidenceId": relative_path}
        for source_id, relative_path in STAGE5_EXIT_SOURCE_SPECS
    ]
    if manifest["checks"] != expected_checks:
        raise ValueError("Stage 5 exit acceptance checks are invalid")
    if not _is_sha256(manifest["exitHash"]) or manifest["exitHash"] != _manifest_hash(manifest):
        raise ValueError("Stage 5 exit acceptance hash is invalid")

    if verify_sources:
        if repo_root is None:
            raise ValueError("Stage 5 exit acceptance repo root is required for source verification")
        root = Path(repo_root)
        for source in sources:
            if _file_sha256(root / source["path"]) != source["sha256"]:
                raise ValueError(f"Stage 5 exit acceptance source changed: {source['path']}")
    return (
        f"stage5 exit acceptance run={manifest['stage5BaseRunId']} "
        f"artifacts={len(sources)} status=maintenance liveBlocked=True"
    )


def write_stage5_exit_acceptance_report(path: Path, manifest: dict[str, Any]) -> Path:
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return destination


def load_stage5_exit_acceptance_report(path: Path) -> dict[str, Any]:
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("Stage 5 exit acceptance manifest must be an object")
    return payload


def load_stage5_exit_acceptance_status(
    path: Path = DEFAULT_STAGE5_EXIT_ACCEPTANCE_REPORT_PATH,
) -> dict[str, Any]:
    source_path = Path(path)
    repo_root = source_path.resolve().parent.parent if source_path.parent.name == "data" else Path.cwd()
    try:
        manifest = load_stage5_exit_acceptance_report(source_path)
        summary = validate_stage5_exit_acceptance_manifest(
            manifest,
            repo_root=repo_root,
            verify_sources=True,
        )
    except FileNotFoundError as error:
        return _status(None, source_path, "missing", False, "Stage 5 exit acceptance manifest is missing.", str(error))
    except (OSError, ValueError, json.JSONDecodeError) as error:
        return _status(
            _read_invalid(source_path),
            source_path,
            "invalid",
            False,
            "Stage 5 exit acceptance manifest is invalid.",
            str(error),
        )
    return _status(manifest, source_path, "accepted", True, summary, "")


def _status(
    manifest: dict[str, Any] | None,
    source_path: Path,
    status: str,
    available: bool,
    summary: str,
    reason: str,
) -> dict[str, Any]:
    sources = manifest.get("sourceArtifacts") if isinstance(manifest, dict) else []
    return {
        "kind": "aiqt.stage5ExitAcceptanceStatus",
        "schemaVersion": 1,
        "status": status,
        "available": available,
        "sourcePath": str(source_path),
        "summary": summary,
        "reason": reason,
        "generatedAt": _optional_string(manifest, "generatedAt"),
        "stage5BaseRunId": _optional_string(manifest, "stage5BaseRunId"),
        "artifactCount": len(sources) if isinstance(sources, list) else 0,
        "exitHash": _optional_string(manifest, "exitHash"),
        "paperOnly": manifest.get("paperOnly") is True if isinstance(manifest, dict) else False,
        "authorizationEffective": manifest.get("authorizationEffective") is True if isinstance(manifest, dict) else False,
        "sandboxOrderSubmissionAllowed": manifest.get("sandboxOrderSubmissionAllowed") is True if isinstance(manifest, dict) else False,
        "liveTradingAllowed": manifest.get("liveTradingAllowed") is True if isinstance(manifest, dict) else False,
        "orderSubmissionEnabled": manifest.get("orderSubmissionEnabled") is True if isinstance(manifest, dict) else False,
        "routeExecuted": manifest.get("routeExecuted") is True if isinstance(manifest, dict) else False,
        "liveBlockedBoundary": manifest.get("liveBlockedBoundary") is True if isinstance(manifest, dict) else False,
    }


def _manifest_hash(manifest: dict[str, Any]) -> str:
    payload = {key: value for key, value in manifest.items() if key != "exitHash"}
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _file_sha256(path: Path) -> str:
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def _is_sha256(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(character in "0123456789abcdef" for character in value)


def _canonical_utc(value: Any) -> None:
    try:
        parsed = datetime.fromisoformat(value) if isinstance(value, str) else None
    except ValueError:
        parsed = None
    if parsed is None or parsed.utcoffset() != timezone.utc.utcoffset(parsed) or parsed.isoformat() != value:
        raise ValueError("Stage 5 exit acceptance generatedAt is not canonical UTC")


def _read_invalid(path: Path) -> dict[str, Any] | None:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None
    return payload if isinstance(payload, dict) else None


def _optional_string(manifest: dict[str, Any] | None, field: str) -> str | None:
    if not isinstance(manifest, dict):
        return None
    value = manifest.get(field)
    return value if isinstance(value, str) and value.strip() else None
