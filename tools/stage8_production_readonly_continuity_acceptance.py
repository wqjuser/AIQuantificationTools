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

REAL_BOUNDARY = {**BOUNDARY, "accountDataAccessed": True}


def _api(method: str, path: str, payload: dict[str, Any] | None = None) -> tuple[int, dict[str, Any]]:
    request = Request(
        f"http://127.0.0.1:8765{path}",
        data=json.dumps(payload).encode() if payload is not None else None,
        method=method,
        headers={"Content-Type": "application/json"} if payload is not None else {},
    )
    try:
        with urlopen(request, timeout=60) as response:
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


def _real_fail_closed(operator: str) -> dict[str, Any]:
    status, payload = _api(
        "POST", "/api/execution/stage8/production-readonly-access-controls",
        {"action": "revoke", "operator": operator, "reason": "stage8 real recovery failed", "productionRouteReviewId": None},
    )
    control = payload.get("productionReadonlyAccessControl")
    if status not in {200, 201} or not isinstance(control, dict) or control.get("status") != "revoked":
        raise RuntimeError("stage8 real recovery could not restore fail-closed access")
    return control


def _container_real_recovery(path: Path) -> dict[str, Any]:
    request = json.loads(path.read_text())
    if not isinstance(request, dict) or set(request) != {
        "productionRouteReviewId", "operator", "eligibilityConfirmed"
    } or request.get("eligibilityConfirmed") is not True:
        raise ValueError("stage8 real recovery request fields are invalid")
    route_review_id = request.get("productionRouteReviewId")
    operator = request.get("operator")
    if not isinstance(route_review_id, str) or not route_review_id.strip() or not isinstance(operator, str) or not operator.strip():
        raise ValueError("stage8 real recovery request identity is invalid")
    initial_status, initial = _api("GET", "/api/execution/stage8/production-readonly-continuity")
    initial_continuity = initial.get("productionReadonlyContinuity")
    if initial_status != 200 or not isinstance(initial_continuity, dict) or initial_continuity.get("status") != "current":
        raise RuntimeError("stage8 real recovery requires current production read-only continuity")
    initial_probe = initial_continuity.get("latestProbe")
    if not isinstance(initial_probe, dict) or initial_probe.get("productionRouteReviewId") != route_review_id.strip():
        raise RuntimeError("stage8 real recovery request must match the current probe route review")
    revoke_status, revoked = _api(
        "POST", "/api/execution/stage8/production-readonly-access-controls",
        {"action": "revoke", "operator": operator.strip(), "reason": "stage8 real recovery acceptance", "productionRouteReviewId": None},
    )
    revoke_control = revoked.get("productionReadonlyAccessControl")
    if revoke_status != 201 or not isinstance(revoke_control, dict) or revoke_control.get("status") != "revoked":
        raise RuntimeError("stage8 real recovery revoke was not recorded")
    blocked_status, blocked = _api(
        "POST", "/api/execution/stage7/production-readonly-probes", request,
    )
    if blocked_status != 409 or blocked.get("blockers") != ["stage8_production_readonly_access_revoked"]:
        raise RuntimeError("stage8 real recovery revoke did not block Stage 7 before network")
    try:
        restore_status, restored = _api(
            "POST", "/api/execution/stage8/production-readonly-access-controls",
            {"action": "restore", "operator": operator.strip(), "reason": "stage8 real recovery accepted", "productionRouteReviewId": route_review_id.strip()},
        )
        restore_control = restored.get("productionReadonlyAccessControl")
        if restore_status != 201 or not isinstance(restore_control, dict) or restore_control.get("status") != "active":
            raise RuntimeError("stage8 real recovery restore was not recorded")
        probe_status, probe = _api(
            "POST", "/api/execution/stage7/production-readonly-probes", request,
        )
        recovery_probe = probe.get("productionReadonlyProbe")
        continuity_status, continuity = _api("GET", "/api/execution/stage8/production-readonly-continuity")
        recovered_continuity = continuity.get("productionReadonlyContinuity")
        if probe_status != 201 or not isinstance(recovery_probe, dict) or recovery_probe.get("status") != "ready" or recovery_probe.get("accountDataAccessed") is not True:
            raise RuntimeError("stage8 real recovery probe was not ready")
        if continuity_status != 200 or not isinstance(recovered_continuity, dict) or recovered_continuity.get("status") != "current":
            raise RuntimeError("stage8 real recovery continuity was not restored")
    except Exception:
        _real_fail_closed(operator.strip())
        raise
    return {
        "initialStatus": initial_status,
        "initialContinuity": initial_continuity,
        "revokeStatus": revoke_status,
        "revokeControl": revoke_control,
        "blockedProbeStatus": blocked_status,
        "blockedProbeReasons": blocked.get("blockers"),
        "restoreStatus": restore_status,
        "restoreControl": restore_control,
        "recoveryProbeStatus": probe_status,
        "recoveryProbe": recovery_probe,
        "continuityStatus": continuity_status,
        "recoveredContinuity": recovered_continuity,
    }


def _container_real_fail_closed(path: Path) -> dict[str, Any]:
    request = json.loads(path.read_text())
    operator = request.get("operator") if isinstance(request, dict) else None
    if not isinstance(operator, str) or not operator.strip():
        raise ValueError("stage8 real recovery fail-close operator is invalid")
    return _real_fail_closed(operator.strip())


def _container_real_readback(probe_id: str) -> dict[str, Any]:
    status, payload = _api("GET", "/api/execution/stage8/production-readonly-continuity")
    probes_status, probes = _api("GET", "/api/execution/stage7/production-readonly-probes?limit=100")
    probe = next(
        (row for row in probes.get("productionReadonlyProbes", []) if row.get("probeId") == probe_id),
        None,
    )
    return {
        "status": status if probes_status == 200 else probes_status,
        "continuity": payload.get("productionReadonlyContinuity"),
        "probe": probe,
    }


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


def _real_manifest(exercise: dict[str, Any], readback: dict[str, Any]) -> dict[str, Any]:
    initial = exercise.get("initialContinuity") if isinstance(exercise.get("initialContinuity"), dict) else {}
    revoke = exercise.get("revokeControl") if isinstance(exercise.get("revokeControl"), dict) else {}
    restore = exercise.get("restoreControl") if isinstance(exercise.get("restoreControl"), dict) else {}
    probe = exercise.get("recoveryProbe") if isinstance(exercise.get("recoveryProbe"), dict) else {}
    continuity = exercise.get("recoveredContinuity") if isinstance(exercise.get("recoveredContinuity"), dict) else {}
    restarted = readback.get("continuity") if isinstance(readback.get("continuity"), dict) else {}
    restarted_probe = readback.get("probe") if isinstance(readback.get("probe"), dict) else {}
    permissions = probe.get("apiPermissions") if isinstance(probe.get("apiPermissions"), dict) else {}
    account = probe.get("accountSummary") if isinstance(probe.get("accountSummary"), dict) else {}
    checks = [
        {"id": "initial-continuity-current", "passed": exercise.get("initialStatus") == 200 and initial.get("status") == "current"},
        {"id": "manual-revoke-recorded", "passed": exercise.get("revokeStatus") == 201 and revoke.get("status") == "revoked"},
        {"id": "stage7-blocked-before-network", "passed": exercise.get("blockedProbeStatus") == 409 and exercise.get("blockedProbeReasons") == ["stage8_production_readonly_access_revoked"]},
        {"id": "current-review-restored", "passed": exercise.get("restoreStatus") == 201 and restore.get("status") == "active" and restore.get("previousControlId") == revoke.get("controlId") and restore.get("productionRouteReviewId") == probe.get("productionRouteReviewId")},
        {"id": "recovery-probe-ready", "passed": exercise.get("recoveryProbeStatus") == 201 and probe.get("status") == "ready" and probe.get("accountDataAccessed") is True},
        {"id": "mutation-permissions-disabled", "passed": permissions.get("readingEnabled") is True and not any(value for key, value in permissions.items() if key != "readingEnabled")},
        {"id": "continuity-restored-current", "passed": continuity.get("status") == "current" and continuity.get("latestProbe", {}).get("evidenceHash") == probe.get("evidenceHash") and continuity.get("accessControl", {}).get("controlHash") == restore.get("controlHash")},
        {"id": "api-restart-readback", "passed": readback.get("status") == 200 and restarted.get("status") == "current" and restarted.get("latestProbe", {}).get("evidenceHash") == probe.get("evidenceHash") and restarted.get("accessControl", {}).get("controlHash") == restore.get("controlHash") and restarted_probe.get("evidenceHash") == probe.get("evidenceHash")},
        {"id": "account-summary-redacted", "passed": set(account) == {"accountType", "nonZeroAssetCount", "observedAt"}},
        {"id": "production-order-routing-disabled", "passed": probe.get("orderRoutingEnabled") is False and continuity.get("orderRoutingEnabled") is False},
    ]
    value = {
        "kind": "aiqt.stage8ProductionReadonlyRecoveryAcceptance",
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "accepted" if all(check["passed"] for check in checks) else "blocked",
        "checks": checks,
        "initialProbeId": initial.get("latestProbe", {}).get("probeId", ""),
        "initialEvidenceHash": initial.get("latestProbe", {}).get("evidenceHash", ""),
        "initialProductionRouteReviewId": initial.get("latestProbe", {}).get("productionRouteReviewId", ""),
        "revokeControlId": revoke.get("controlId", ""),
        "revokeControlHash": revoke.get("controlHash", ""),
        "restoreControlId": restore.get("controlId", ""),
        "restoreControlHash": restore.get("controlHash", ""),
        "restorePreviousControlId": restore.get("previousControlId", ""),
        "recoveryProbeId": probe.get("probeId", ""),
        "recoveryEvidenceHash": probe.get("evidenceHash", ""),
        "restartProbeHash": restarted_probe.get("evidenceHash", ""),
        "restartControlHash": restarted.get("accessControl", {}).get("controlHash", ""),
        "productionRouteReviewId": probe.get("productionRouteReviewId", ""),
        "marketCount": probe.get("marketCount", 0),
        "apiPermissions": permissions,
        "accountSummary": account,
        "continuityStatus": restarted.get("status", ""),
        "revokeBlockedBeforeNetwork": exercise.get("blockedProbeStatus") == 409,
        "productionNetworkReached": True,
        **REAL_BOUNDARY,
        "accountDataAccessed": probe.get("accountDataAccessed"),
    }
    value["manifestHash"] = _hash(value)
    return value


def validate(value: Any) -> str:
    if isinstance(value, dict) and value.get("kind") == "aiqt.stage8ProductionReadonlyRecoveryAcceptance":
        return _validate_real(value)
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


def _validate_real(value: Any) -> str:
    fields = {
        "kind", "schemaVersion", "generatedAt", "status", "checks", "initialProbeId",
        "initialEvidenceHash", "initialProductionRouteReviewId", "revokeControlId",
        "revokeControlHash", "restoreControlId", "restoreControlHash", "restorePreviousControlId",
        "recoveryProbeId", "recoveryEvidenceHash", "restartProbeHash",
        "restartControlHash", "productionRouteReviewId", "marketCount", "apiPermissions",
        "accountSummary", "continuityStatus", "revokeBlockedBeforeNetwork",
        "productionNetworkReached", "manifestHash", *REAL_BOUNDARY,
    }
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("stage8 real production read-only recovery fields are invalid")
    if value["kind"] != "aiqt.stage8ProductionReadonlyRecoveryAcceptance" or value["schemaVersion"] != 1:
        raise ValueError("stage8 real production read-only recovery schema is invalid")
    generated_at = datetime.fromisoformat(value["generatedAt"])
    if generated_at.tzinfo is None or generated_at.utcoffset() is None or value["status"] != "accepted":
        raise ValueError("stage8 real production read-only recovery status is invalid")
    expected_checks = {
        "initial-continuity-current", "manual-revoke-recorded", "stage7-blocked-before-network",
        "current-review-restored", "recovery-probe-ready", "mutation-permissions-disabled",
        "continuity-restored-current", "api-restart-readback", "account-summary-redacted",
        "production-order-routing-disabled",
    }
    if not isinstance(value["checks"], list) or {row.get("id") for row in value["checks"] if isinstance(row, dict)} != expected_checks or any(
        not isinstance(row, dict) or set(row) != {"id", "passed"} or row["passed"] is not True
        for row in value["checks"]
    ):
        raise ValueError("stage8 real production read-only recovery check failed")
    identity_fields = {
        "initialProbeId", "initialProductionRouteReviewId", "revokeControlId", "restoreControlId",
        "restorePreviousControlId", "recoveryProbeId", "productionRouteReviewId",
    }
    hash_fields = {
        "initialEvidenceHash", "revokeControlHash", "restoreControlHash", "recoveryEvidenceHash",
        "restartProbeHash", "restartControlHash",
    }
    if any(not isinstance(value[field], str) or not value[field] for field in identity_fields) or any(
        not _is_hash(value[field]) for field in hash_fields
    ):
        raise ValueError("stage8 real production read-only recovery identity is invalid")
    if value["initialProbeId"] == value["recoveryProbeId"] or value["revokeControlId"] == value["restoreControlId"]:
        raise ValueError("stage8 real production read-only recovery did not create new evidence")
    if value["initialEvidenceHash"] == value["recoveryEvidenceHash"] or value["initialProductionRouteReviewId"] != value["productionRouteReviewId"] or value["restorePreviousControlId"] != value["revokeControlId"]:
        raise ValueError("stage8 real production read-only recovery source chain is invalid")
    if value["recoveryEvidenceHash"] != value["restartProbeHash"] or value["restoreControlHash"] != value["restartControlHash"]:
        raise ValueError("stage8 real production read-only recovery restart readback changed")
    permissions = value["apiPermissions"]
    expected_permissions = {
        "readingEnabled", "spotTradingEnabled", "marginTradingEnabled", "futuresTradingEnabled",
        "optionsTradingEnabled", "withdrawalsEnabled", "internalTransferEnabled",
        "universalTransferEnabled",
    }
    if not isinstance(permissions, dict) or set(permissions) != expected_permissions or permissions["readingEnabled"] is not True or any(
        permissions[field] is not False for field in expected_permissions - {"readingEnabled"}
    ):
        raise ValueError("stage8 real production read-only recovery permissions are invalid")
    account = value["accountSummary"]
    if not isinstance(account, dict) or set(account) != {"accountType", "nonZeroAssetCount", "observedAt"} or account["accountType"] != "SPOT" or type(account["nonZeroAssetCount"]) is not int or account["nonZeroAssetCount"] < 0:
        raise ValueError("stage8 real production read-only recovery account summary is invalid")
    try:
        observed_at = datetime.fromisoformat(account["observedAt"])
    except (TypeError, ValueError) as error:
        raise ValueError("stage8 real production read-only recovery account summary time is invalid") from error
    if observed_at.tzinfo is None or observed_at.utcoffset() is None:
        raise ValueError("stage8 real production read-only recovery account summary time is invalid")
    if type(value["marketCount"]) is not int or value["marketCount"] <= 0 or value["continuityStatus"] != "current":
        raise ValueError("stage8 real production read-only recovery continuity is invalid")
    if value["revokeBlockedBeforeNetwork"] is not True or value["productionNetworkReached"] is not True:
        raise ValueError("stage8 real production read-only recovery network evidence is invalid")
    for field, expected in REAL_BOUNDARY.items():
        if value[field] is not expected:
            raise ValueError(f"stage8 real production read-only recovery {field} is immutable")
    if value["manifestHash"] != _hash({key: item for key, item in value.items() if key != "manifestHash"}):
        raise ValueError("stage8 real production read-only recovery manifest hash is invalid")
    return f"stage8 production-readonly recovery={value['status']} markets={value['marketCount']} restartExact=true liveBlocked=true"


def _orchestrate(repo: Path, report: Path, real_request: Path | None, *, build: bool) -> dict[str, Any]:
    env = dict(os.environ)
    env["INSTALL_DATA_DEPS"] = "true"
    exercise: dict[str, Any] | None = None
    if not real_request:
        env["COMPOSE_PROJECT_NAME"] = "stage8-readonly-continuity"
    try:
        _run(["docker", "compose", "up", "-d", *(["--build"] if build else []), "api"], repo, env)
        _wait_for_api(repo, env)
        if real_request:
            _run(["docker", "compose", "cp", str(real_request), "api:/tmp/stage8-real-request.json"], repo, env)
            output = _run([
                "docker", "compose", "exec", "-T", "api", "python",
                "tools/stage8_production_readonly_continuity_acceptance.py",
                "--container-real-recovery", "/tmp/stage8-real-request.json",
            ], repo, env)
        else:
            output = _run([
                "docker", "compose", "exec", "-T", "api", "python",
                "tools/stage8_production_readonly_continuity_acceptance.py", "--container-revoke",
            ], repo, env)
        exercise = json.loads(next(line for line in reversed(output.splitlines()) if line.startswith("{")))
        _run(["docker", "compose", "restart", "api"], repo, env)
        _wait_for_api(repo, env)
        readback_command = [
            "docker", "compose", "exec", "-T", "api", "python",
            "tools/stage8_production_readonly_continuity_acceptance.py",
            "--container-real-readback", exercise["recoveryProbe"]["probeId"],
        ] if real_request else [
            "docker", "compose", "exec", "-T", "api", "python",
            "tools/stage8_production_readonly_continuity_acceptance.py", "--container-readback",
        ]
        output = _run(readback_command, repo, env)
        readback = json.loads(next(line for line in reversed(output.splitlines()) if line.startswith("{")))
        manifest = _real_manifest(exercise, readback) if real_request else _manifest(exercise, readback)
        validate(manifest)
        report.parent.mkdir(parents=True, exist_ok=True)
        report.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        return manifest
    except Exception:
        if real_request and exercise is not None:
            _wait_for_api(repo, env)
            _run([
                "docker", "compose", "exec", "-T", "api", "python",
                "tools/stage8_production_readonly_continuity_acceptance.py",
                "--container-real-fail-closed", "/tmp/stage8-real-request.json",
            ], repo, env)
        raise
    finally:
        if not real_request:
            _run(["docker", "compose", "down", "-v"], repo, env)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", type=Path, default=Path("data/stage8-production-readonly-continuity.json"))
    parser.add_argument("--validate", type=Path)
    parser.add_argument("--real-request", type=Path)
    parser.add_argument("--no-build", action="store_true")
    parser.add_argument("--container-revoke", action="store_true")
    parser.add_argument("--container-readback", action="store_true")
    parser.add_argument("--container-real-recovery", type=Path)
    parser.add_argument("--container-real-readback")
    parser.add_argument("--container-real-fail-closed", type=Path)
    args = parser.parse_args()
    if args.validate:
        print(validate(json.loads(args.validate.read_text())))
        return 0
    if args.container_revoke:
        value = _container_revoke()
    elif args.container_readback:
        value = _container_readback()
    elif args.container_real_recovery:
        value = _container_real_recovery(args.container_real_recovery)
    elif args.container_real_readback:
        value = _container_real_readback(args.container_real_readback)
    elif args.container_real_fail_closed:
        value = _container_real_fail_closed(args.container_real_fail_closed)
    else:
        value = _orchestrate(
            Path(__file__).resolve().parents[1], args.report, args.real_request, build=not args.no_build
        )
    print(json.dumps(value, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
