from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from typing import Any

from quant_core.stage5_exit import validate_stage5_exit_acceptance_manifest


DEFAULT_STAGE6_EXIT_ACCEPTANCE_REPORT_PATH = Path("data/stage6-exit-acceptance.json")
SOURCES = (
    ("stage5-exit", "data/stage5-exit-acceptance.json"),
    ("stage6-no-credential", "data/stage6-sandbox-safety.json"),
    ("stage6-real-testnet", "data/stage6-binance-spot-testnet.json"),
)
SAFETY = {
    "sandboxOnly": True,
    "sandboxOrderSubmissionAllowed": True,
    "sandboxOrderSubmitted": True,
    "sandboxRouteExecuted": True,
    "liveTradingAllowed": False,
    "liveOrderSubmissionAllowed": False,
    "liveOrderSubmitted": False,
    "liveRouteExecuted": False,
    "liveBlockedBoundary": True,
}


def build_stage6_exit_acceptance_manifest(repo_root: Path) -> dict[str, Any]:
    root = Path(repo_root)
    stage5 = _load(root / SOURCES[0][1])
    no_credentials = _load(root / SOURCES[1][1])
    real = _load(root / SOURCES[2][1])
    validate_stage5_exit_acceptance_manifest(stage5, repo_root=root, verify_sources=True)
    _validate_stage6_source(no_credentials, real=False)
    _validate_stage6_source(real, real=True)
    value = {
        "kind": "aiqt.stage6ExitAcceptance",
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "accepted_for_maintenance",
        "authorizationId": real["authorizationId"],
        "sourceArtifacts": [
            {"id": source_id, "path": path, "sha256": hashlib.sha256((root / path).read_bytes()).hexdigest()}
            for source_id, path in SOURCES
        ],
        **SAFETY,
    }
    value["exitHash"] = _hash(value)
    validate_stage6_exit_acceptance_manifest(value, repo_root=root, verify_sources=True)
    return value


def validate_stage6_exit_acceptance_manifest(
    value: Any, *, repo_root: Path | None = None, verify_sources: bool = False
) -> str:
    fields = {
        "kind", "schemaVersion", "generatedAt", "status", "authorizationId", "sourceArtifacts",
        "exitHash", *SAFETY,
    }
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("Stage 6 exit acceptance fields are invalid")
    if (
        value["kind"] != "aiqt.stage6ExitAcceptance" or value["schemaVersion"] != 1
        or value["status"] != "accepted_for_maintenance" or not str(value["authorizationId"]).strip()
    ):
        raise ValueError("Stage 6 exit acceptance identity is invalid")
    _utc(value["generatedAt"])
    if any(value[field] is not expected for field, expected in SAFETY.items()):
        raise ValueError("Stage 6 exit acceptance safety boundary is invalid")
    expected = [{"id": source_id, "path": path} for source_id, path in SOURCES]
    sources = value["sourceArtifacts"]
    if (
        not isinstance(sources, list) or len(sources) != len(expected)
        or any(not isinstance(row, dict) or set(row) != {"id", "path", "sha256"}
               or row["id"] != wanted["id"] or row["path"] != wanted["path"] or not _sha(row["sha256"])
               for row, wanted in zip(sources, expected, strict=True))
    ):
        raise ValueError("Stage 6 exit acceptance sources are invalid")
    if value["exitHash"] != _hash(value):
        raise ValueError("Stage 6 exit acceptance hash is invalid")
    if verify_sources:
        if repo_root is None:
            raise ValueError("Stage 6 exit acceptance repo root is required")
        root = Path(repo_root)
        for source in sources:
            if hashlib.sha256((root / source["path"]).read_bytes()).hexdigest() != source["sha256"]:
                raise ValueError(f"Stage 6 exit acceptance source changed: {source['path']}")
        stage5, no_credentials, real = (_load(root / source["path"]) for source in sources)
        validate_stage5_exit_acceptance_manifest(stage5, repo_root=root, verify_sources=True)
        _validate_stage6_source(no_credentials, real=False)
        _validate_stage6_source(real, real=True)
    return f"stage6 exit acceptance authorization={value['authorizationId']} status=maintenance liveBlocked=True"


def load_stage6_exit_acceptance_status(path: Path = DEFAULT_STAGE6_EXIT_ACCEPTANCE_REPORT_PATH) -> dict[str, Any]:
    source = Path(path)
    root = source.resolve().parent.parent if source.parent.name == "data" else Path.cwd()
    try:
        value = _load(source)
        summary = validate_stage6_exit_acceptance_manifest(value, repo_root=root, verify_sources=True)
    except FileNotFoundError as error:
        return _status("missing", False, source, None, "Stage 6 真实 Testnet 退出证据缺失。", str(error))
    except (OSError, ValueError, json.JSONDecodeError) as error:
        return _status("invalid", False, source, None, "Stage 6 退出证据无效。", str(error))
    return _status("accepted", True, source, value, summary, "")


def write_stage6_exit_acceptance_report(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n")


def _validate_stage6_source(value: dict[str, Any], *, real: bool) -> None:
    kind = "aiqt.stage6BinanceSpotTestnetAcceptance" if real else "aiqt.stage6SandboxSafetyAcceptance"
    if value.get("kind") != kind or value.get("schemaVersion") != 1 or value.get("status") != "accepted":
        raise ValueError("Stage 6 source acceptance identity is invalid")
    if value.get("sandboxOrderSubmissionAllowed") is not real:
        raise ValueError("Stage 6 source submission boundary is invalid")
    if value.get("sandboxOrderSubmitted") is not real or value.get("sandboxRouteExecuted") is not real:
        raise ValueError("Stage 6 source route evidence is invalid")
    for field, expected in {key: item for key, item in SAFETY.items() if key not in {
        "sandboxOrderSubmissionAllowed", "sandboxOrderSubmitted", "sandboxRouteExecuted"
    }}.items():
        if value.get(field) is not expected:
            raise ValueError("Stage 6 source live boundary is invalid")
    if value.get("manifestHash") != _hash(value, "manifestHash"):
        raise ValueError("Stage 6 source manifest hash is invalid")
    if real and (not value.get("authorizationId") or not value.get("orders")):
        raise ValueError("Stage 6 real Testnet evidence is incomplete")


def _status(status: str, available: bool, path: Path, value: dict[str, Any] | None, summary: str, reason: str) -> dict[str, Any]:
    return {
        "kind": "aiqt.stage6ExitAcceptanceStatus", "schemaVersion": 1, "status": status,
        "available": available, "sourcePath": str(path), "summary": summary, "reason": reason,
        "authorizationId": value.get("authorizationId") if value else None,
        "exitHash": value.get("exitHash") if value else None,
        "sandboxOrderSubmitted": value.get("sandboxOrderSubmitted") is True if value else False,
        "sandboxRouteExecuted": value.get("sandboxRouteExecuted") is True if value else False,
        "liveTradingAllowed": value.get("liveTradingAllowed") is True if value else False,
        "liveBlockedBoundary": value.get("liveBlockedBoundary") is True if value else True,
    }


def _load(path: Path) -> dict[str, Any]:
    value = json.loads(Path(path).read_text())
    if not isinstance(value, dict):
        raise ValueError("Stage 6 acceptance must be an object")
    return value


def _hash(value: dict[str, Any], omitted: str = "exitHash") -> str:
    return hashlib.sha256(json.dumps({key: item for key, item in value.items() if key != omitted},
                                     allow_nan=False, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def _sha(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(character in "0123456789abcdef" for character in value)


def _utc(value: Any) -> None:
    parsed = datetime.fromisoformat(value) if isinstance(value, str) else None
    if parsed is None or parsed.utcoffset() != timezone.utc.utcoffset(parsed):
        raise ValueError("Stage 6 timestamp is invalid")
