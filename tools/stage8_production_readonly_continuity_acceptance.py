from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen

try:
    from tools.stage7_production_readonly_acceptance import _hash, _is_hash, _run, _wait_for_api
except ModuleNotFoundError:
    from stage7_production_readonly_acceptance import _hash, _is_hash, _run, _wait_for_api


BOUNDARY = {
    "productionReadOnly": True,
    "accountDataAccessed": False,
    "liveTradingAllowed": False,
    "orderRoutingEnabled": False,
    "liveOrderSubmitted": False,
    "liveRouteExecuted": False,
    "liveBlockedBoundary": True,
}


def _api(method: str, path: str, payload: dict[str, Any] | None = None) -> tuple[int, dict[str, Any]]:
    request = Request(
        f"http://127.0.0.1:8765{path}",
        data=json.dumps(payload).encode() if payload is not None else None,
        method=method,
        headers={"Content-Type": "application/json"} if payload is not None else {},
    )
    try:
        with urlopen(request, timeout=20) as response:
            return response.status, json.load(response)
    except HTTPError as error:
        return error.code, json.loads(error.read())


def _container_revoke() -> dict[str, Any]:
    initial_status, initial = _api("GET", "/api/execution/stage8/production-readonly-continuity")
    revoke_status, revoked = _api(
        "POST",
        "/api/execution/stage8/production-readonly-access-controls",
        {"action": "revoke", "operator": "stage8-acceptance", "reason": "acceptance drill", "productionRouteReviewId": None},
    )
    stage7_status, stage7 = _api(
        "POST",
        "/api/execution/stage7/production-readonly-probes",
        {"productionRouteReviewId": "not-used", "operator": "stage8-acceptance", "eligibilityConfirmed": True},
    )
    restore_status, restore = _api(
        "POST",
        "/api/execution/stage8/production-readonly-access-controls",
        {"action": "restore", "operator": "stage8-acceptance", "reason": "invalid recovery drill", "productionRouteReviewId": "missing"},
    )
    return {
        "initialStatus": initial_status,
        "initialContinuity": initial.get("productionReadonlyContinuity"),
        "revokeStatus": revoke_status,
        "control": revoked.get("productionReadonlyAccessControl"),
        "revokedContinuity": revoked.get("productionReadonlyContinuity"),
        "stage7Status": stage7_status,
        "stage7Blockers": stage7.get("blockers"),
        "restoreStatus": restore_status,
        "restoreBlockers": restore.get("blockers"),
    }


def _container_readback() -> dict[str, Any]:
    status, payload = _api("GET", "/api/execution/stage8/production-readonly-continuity")
    return {"status": status, "continuity": payload.get("productionReadonlyContinuity")}


def _manifest(exercise: dict[str, Any], readback: dict[str, Any]) -> dict[str, Any]:
    initial = exercise.get("initialContinuity") if isinstance(exercise.get("initialContinuity"), dict) else {}
    control = exercise.get("control") if isinstance(exercise.get("control"), dict) else {}
    continuity = exercise.get("revokedContinuity") if isinstance(exercise.get("revokedContinuity"), dict) else {}
    recovered = readback.get("continuity") if isinstance(readback.get("continuity"), dict) else {}
    checks = [
        {"id": "initial-state-missing", "passed": exercise.get("initialStatus") == 200 and initial.get("status") == "missing" and initial.get("accessState") == "active" and initial.get("accessControl") is None},
        {"id": "manual-revoke-recorded", "passed": exercise.get("revokeStatus") == 201 and control.get("status") == "revoked"},
        {"id": "stage7-blocked-before-network", "passed": exercise.get("stage7Status") == 409 and exercise.get("stage7Blockers") == ["stage8_production_readonly_access_revoked"]},
        {"id": "invalid-restore-refused", "passed": exercise.get("restoreStatus") == 409 and continuity.get("status") == "revoked"},
        {"id": "api-restart-readback", "passed": readback.get("status") == 200 and recovered.get("accessControl", {}).get("controlHash") == control.get("controlHash")},
        {"id": "production-order-routing-disabled", "passed": continuity.get("orderRoutingEnabled") is False},
    ]
    value = {
        "kind": "aiqt.stage8ProductionReadonlyContinuityAcceptance",
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "accepted" if all(check["passed"] for check in checks) else "blocked",
        "checks": checks,
        "controlId": control.get("controlId", ""),
        "controlHash": control.get("controlHash", ""),
        "restartReadbackHash": recovered.get("accessControl", {}).get("controlHash", ""),
        "continuityStatus": recovered.get("status", ""),
        "productionNetworkReached": False,
        **BOUNDARY,
    }
    value["manifestHash"] = _hash(value)
    return value


def validate(value: Any) -> str:
    fields = {
        "kind", "schemaVersion", "generatedAt", "status", "checks", "controlId", "controlHash",
        "restartReadbackHash", "continuityStatus", "productionNetworkReached", "manifestHash", *BOUNDARY,
    }
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("stage8 production read-only continuity acceptance fields are invalid")
    if value["kind"] != "aiqt.stage8ProductionReadonlyContinuityAcceptance" or value["schemaVersion"] != 1:
        raise ValueError("stage8 production read-only continuity acceptance schema is invalid")
    generated_at = datetime.fromisoformat(value["generatedAt"])
    if generated_at.tzinfo is None or generated_at.utcoffset() is None or value["status"] != "accepted":
        raise ValueError("stage8 production read-only continuity acceptance status is invalid")
    expected = {
        "initial-state-missing", "manual-revoke-recorded", "stage7-blocked-before-network",
        "invalid-restore-refused", "api-restart-readback", "production-order-routing-disabled",
    }
    if not isinstance(value["checks"], list) or {row.get("id") for row in value["checks"] if isinstance(row, dict)} != expected or any(
        not isinstance(row, dict) or set(row) != {"id", "passed"} or row["passed"] is not True
        for row in value["checks"]
    ):
        raise ValueError("stage8 production read-only continuity acceptance check failed")
    if not value["controlId"] or not _is_hash(value["controlHash"]) or value["controlHash"] != value["restartReadbackHash"]:
        raise ValueError("stage8 production read-only continuity restart readback is invalid")
    if value["continuityStatus"] != "revoked" or value["productionNetworkReached"] is not False:
        raise ValueError("stage8 production read-only continuity safety state is invalid")
    for field, expected_value in BOUNDARY.items():
        if value[field] is not expected_value:
            raise ValueError(f"stage8 production read-only continuity {field} is immutable")
    if value["manifestHash"] != _hash({key: item for key, item in value.items() if key != "manifestHash"}):
        raise ValueError("stage8 production read-only continuity manifest hash is invalid")
    return "stage8 production-readonly continuity=accepted restartExact=true liveBlocked=true"


def _orchestrate(repo: Path, report: Path, *, build: bool) -> dict[str, Any]:
    env = dict(os.environ)
    env["COMPOSE_PROJECT_NAME"] = "stage8-readonly-continuity"
    env["INSTALL_DATA_DEPS"] = "true"
    try:
        _run(["docker", "compose", "up", "-d", *(["--build"] if build else []), "api"], repo, env)
        _wait_for_api(repo, env)
        output = _run([
            "docker", "compose", "exec", "-T", "api", "python", "tools/stage8_production_readonly_continuity_acceptance.py",
            "--container-revoke",
        ], repo, env)
        exercise = json.loads(next(line for line in reversed(output.splitlines()) if line.startswith("{")))
        _run(["docker", "compose", "restart", "api"], repo, env)
        _wait_for_api(repo, env)
        output = _run([
            "docker", "compose", "exec", "-T", "api", "python", "tools/stage8_production_readonly_continuity_acceptance.py",
            "--container-readback",
        ], repo, env)
        readback = json.loads(next(line for line in reversed(output.splitlines()) if line.startswith("{")))
        manifest = _manifest(exercise, readback)
        validate(manifest)
        report.parent.mkdir(parents=True, exist_ok=True)
        report.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        return manifest
    finally:
        _run(["docker", "compose", "down", "-v"], repo, env)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", type=Path, default=Path("data/stage8-production-readonly-continuity.json"))
    parser.add_argument("--validate", type=Path)
    parser.add_argument("--no-build", action="store_true")
    parser.add_argument("--container-revoke", action="store_true")
    parser.add_argument("--container-readback", action="store_true")
    args = parser.parse_args()
    if args.validate:
        print(validate(json.loads(args.validate.read_text())))
        return 0
    if args.container_revoke:
        value = _container_revoke()
    elif args.container_readback:
        value = _container_readback()
    else:
        value = _orchestrate(Path(__file__).resolve().parents[1], args.report, build=not args.no_build)
    print(json.dumps(value, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
