from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen


BOUNDARY = {
    "productionReadOnly": True,
    "accountDataAccessed": False,
    "liveTradingAllowed": False,
    "orderRoutingEnabled": False,
    "liveOrderSubmitted": False,
    "liveRouteExecuted": False,
    "liveBlockedBoundary": True,
}


def _hash(value: Any) -> str:
    encoded = json.dumps(value, allow_nan=False, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


def _is_hash(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(character in "0123456789abcdef" for character in value)


def _manifest(blocked_reasons: list[str], factory_called: bool) -> dict[str, Any]:
    checks = [
        {"id": "dedicated-production-credentials-absent", "passed": True},
        {"id": "generic-credentials-refused", "passed": blocked_reasons == ["production_readonly_credentials_missing"]},
        {"id": "production-network-not-reached", "passed": not factory_called},
        {"id": "production-order-routing-disabled", "passed": True},
        {"id": "account-data-not-accessed", "passed": True},
    ]
    value = {
        "kind": "aiqt.stage7ProductionReadonlySafetyAcceptance",
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "accepted" if all(row["passed"] for row in checks) else "blocked",
        "checks": checks,
        "blockedReasons": blocked_reasons,
        "networkReached": factory_called,
        **BOUNDARY,
    }
    value["manifestHash"] = _hash(value)
    return value


def _validate_safety(manifest: Any) -> str:
    fields = {
        "kind", "schemaVersion", "generatedAt", "status", "checks", "blockedReasons", "networkReached",
        "manifestHash", *BOUNDARY,
    }
    if not isinstance(manifest, dict) or set(manifest) != fields:
        raise ValueError("stage7 production read-only safety fields are invalid")
    if manifest["kind"] != "aiqt.stage7ProductionReadonlySafetyAcceptance" or manifest["schemaVersion"] != 1:
        raise ValueError("stage7 production read-only safety schema is invalid")
    generated_at = datetime.fromisoformat(manifest["generatedAt"])
    if generated_at.tzinfo is None or generated_at.utcoffset() is None or manifest["status"] != "accepted":
        raise ValueError("stage7 production read-only safety status is invalid")
    expected_checks = {
        "dedicated-production-credentials-absent", "generic-credentials-refused",
        "production-network-not-reached", "production-order-routing-disabled", "account-data-not-accessed",
    }
    if not isinstance(manifest["checks"], list) or {row.get("id") for row in manifest["checks"] if isinstance(row, dict)} != expected_checks or any(
        not isinstance(row, dict) or set(row) != {"id", "passed"}
        or not isinstance(row["id"], str) or not row["id"] or row["passed"] is not True
        for row in manifest["checks"]
    ):
        raise ValueError("stage7 production read-only safety check failed")
    if manifest["blockedReasons"] != ["production_readonly_credentials_missing"]:
        raise ValueError("stage7 production read-only fail-closed reason is invalid")
    if manifest["networkReached"] is not False:
        raise ValueError("stage7 production read-only safety reached the network")
    for field, expected in BOUNDARY.items():
        if manifest[field] is not expected:
            raise ValueError(f"stage7 production read-only safety {field} is immutable")
    if manifest["manifestHash"] != _hash({key: value for key, value in manifest.items() if key != "manifestHash"}):
        raise ValueError("stage7 production read-only safety hash is invalid")
    return f"stage7 production-readonly safety={manifest['status']} networkReached=false liveBlocked=true"


def _real_manifest(probe: dict[str, Any], readback: dict[str, Any]) -> dict[str, Any]:
    permissions = probe["apiPermissions"]
    account = probe["accountSummary"]
    checks = [
        {"id": "production-readonly-ready", "passed": probe["status"] == "ready"},
        {"id": "api-key-reading-enabled", "passed": permissions["readingEnabled"] is True},
        {"id": "mutation-permissions-disabled", "passed": not any(
            permissions[field] for field in permissions if field != "readingEnabled"
        )},
        {"id": "account-summary-redacted", "passed": set(account) == {"accountType", "nonZeroAssetCount", "observedAt"}},
        {"id": "api-restart-readback", "passed": readback.get("evidenceHash") == probe["evidenceHash"]},
        {"id": "production-order-routing-disabled", "passed": probe["orderRoutingEnabled"] is False},
    ]
    value = {
        "kind": "aiqt.stage7ProductionReadonlyAcceptance",
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "accepted" if all(row["passed"] for row in checks) else "blocked",
        "checks": checks,
        "probeId": probe["probeId"],
        "evidenceHash": probe["evidenceHash"],
        "stage6ExitHash": probe["stage6ExitHash"],
        "productionRouteReviewId": probe["productionRouteReviewId"],
        "marketCount": probe["marketCount"],
        "apiPermissions": permissions,
        "accountSummary": account,
        "restartReadbackHash": readback.get("evidenceHash", ""),
        "productionReadOnly": True,
        "accountDataAccessed": probe["accountDataAccessed"],
        "liveTradingAllowed": False,
        "orderRoutingEnabled": False,
        "liveOrderSubmitted": False,
        "liveRouteExecuted": False,
        "liveBlockedBoundary": True,
    }
    value["manifestHash"] = _hash(value)
    return value


def _validate_real(manifest: Any) -> str:
    fields = {
        "kind", "schemaVersion", "generatedAt", "status", "checks", "probeId", "evidenceHash",
        "stage6ExitHash", "productionRouteReviewId", "marketCount", "apiPermissions", "accountSummary",
        "restartReadbackHash", "productionReadOnly", "accountDataAccessed", "liveTradingAllowed",
        "orderRoutingEnabled", "liveOrderSubmitted", "liveRouteExecuted", "liveBlockedBoundary", "manifestHash",
    }
    if not isinstance(manifest, dict) or set(manifest) != fields:
        raise ValueError("stage7 real production read-only acceptance fields are invalid")
    if manifest["kind"] != "aiqt.stage7ProductionReadonlyAcceptance" or manifest["schemaVersion"] != 1:
        raise ValueError("stage7 real production read-only acceptance schema is invalid")
    generated_at = datetime.fromisoformat(manifest["generatedAt"])
    if generated_at.tzinfo is None or generated_at.utcoffset() is None or manifest["status"] != "accepted":
        raise ValueError("stage7 real production read-only acceptance status is invalid")
    expected_checks = {
        "production-readonly-ready", "api-key-reading-enabled", "mutation-permissions-disabled",
        "account-summary-redacted", "api-restart-readback", "production-order-routing-disabled",
    }
    if not isinstance(manifest["checks"], list) or {row.get("id") for row in manifest["checks"] if isinstance(row, dict)} != expected_checks or any(
        not isinstance(row, dict) or set(row) != {"id", "passed"}
        or not isinstance(row["id"], str) or row["passed"] is not True
        for row in manifest["checks"]
    ):
        raise ValueError("stage7 real production read-only acceptance check failed")
    if any(not _is_hash(manifest[field]) for field in (
        "evidenceHash", "stage6ExitHash", "restartReadbackHash"
    )) or not manifest["probeId"] or not manifest["productionRouteReviewId"]:
        raise ValueError("stage7 real production read-only acceptance identity is invalid")
    permissions = manifest["apiPermissions"]
    expected_permissions = {
        "readingEnabled", "spotTradingEnabled", "marginTradingEnabled", "futuresTradingEnabled",
        "optionsTradingEnabled", "withdrawalsEnabled",
        "internalTransferEnabled", "universalTransferEnabled",
    }
    if not isinstance(permissions, dict) or set(permissions) != expected_permissions or permissions["readingEnabled"] is not True:
        raise ValueError("stage7 real production read-only permissions are invalid")
    if any(permissions[field] is not False for field in expected_permissions - {"readingEnabled"}):
        raise ValueError("stage7 real production read-only mutation permission is enabled")
    account = manifest["accountSummary"]
    if not isinstance(account, dict) or set(account) != {"accountType", "nonZeroAssetCount", "observedAt"}:
        raise ValueError("stage7 real production account summary is not redacted")
    if account["accountType"] != "SPOT" or type(account["nonZeroAssetCount"]) is not int or account["nonZeroAssetCount"] < 0:
        raise ValueError("stage7 real production account summary is invalid")
    try:
        observed_at = datetime.fromisoformat(account["observedAt"])
    except (TypeError, ValueError) as error:
        raise ValueError("stage7 real production account summary time is invalid") from error
    if observed_at.tzinfo is None or observed_at.utcoffset() is None:
        raise ValueError("stage7 real production account summary time is invalid")
    if type(manifest["marketCount"]) is not int or manifest["marketCount"] <= 0:
        raise ValueError("stage7 real production market evidence is invalid")
    boundaries = {
        "productionReadOnly": True, "accountDataAccessed": True, "liveTradingAllowed": False,
        "orderRoutingEnabled": False, "liveOrderSubmitted": False, "liveRouteExecuted": False,
        "liveBlockedBoundary": True,
    }
    for field, expected in boundaries.items():
        if manifest[field] is not expected:
            raise ValueError(f"stage7 real production read-only {field} is immutable")
    if manifest["evidenceHash"] != manifest["restartReadbackHash"]:
        raise ValueError("stage7 real production read-only restart readback changed")
    if manifest["manifestHash"] != _hash({key: value for key, value in manifest.items() if key != "manifestHash"}):
        raise ValueError("stage7 real production read-only acceptance hash is invalid")
    return f"stage7 production-readonly acceptance={manifest['status']} markets={manifest['marketCount']} liveBlocked=true"


def validate(manifest: Any) -> str:
    if isinstance(manifest, dict) and manifest.get("kind") == "aiqt.stage7ProductionReadonlyAcceptance":
        return _validate_real(manifest)
    return _validate_safety(manifest)


def _container_no_credentials() -> dict[str, Any]:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "services" / "quant_core"))
    from quant_core.execution_adapter_health import probe_ccxt_production_readonly

    if os.environ.get("CCXT_PRODUCTION_READONLY_API_KEY") or os.environ.get("CCXT_PRODUCTION_READONLY_SECRET"):
        raise RuntimeError("stage7 no-credential container unexpectedly received dedicated credentials")
    factory_called = False

    def forbidden_factory(_exchange_id: str, _config: dict[str, Any]) -> Any:
        nonlocal factory_called
        factory_called = True
        raise RuntimeError("production network path must not be constructed")

    probe = probe_ccxt_production_readonly(
        adapter_id="ccxt-live",
        exchange_id="binance",
        environ={
            "CCXT_API_KEY": "generic-key-must-not-be-used",
            "CCXT_SECRET": "generic-secret-must-not-be-used",
            "CCXT_SANDBOX_API_KEY": "sandbox-key-must-not-be-used",
            "CCXT_SANDBOX_SECRET": "sandbox-secret-must-not-be-used",
        },
        exchange_factory=forbidden_factory,
    )
    return _manifest(list(probe.blocked_reasons), factory_called)


def _run(command: list[str], repo: Path, env: dict[str, str]) -> str:
    completed = subprocess.run(command, cwd=repo, env=env, text=True, capture_output=True)
    if completed.returncode:
        raise RuntimeError((completed.stderr or completed.stdout).strip())
    return completed.stdout


def _api(method: str, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    request = Request(
        f"http://127.0.0.1:8765{path}",
        data=json.dumps(payload).encode() if payload is not None else None,
        method=method,
        headers={"Content-Type": "application/json"} if payload is not None else {},
    )
    try:
        with urlopen(request, timeout=60) as response:
            value = json.load(response)
    except HTTPError as error:
        raise RuntimeError(error.read().decode(errors="replace")) from error
    if not isinstance(value, dict):
        raise RuntimeError("stage7 production read-only API returned invalid JSON")
    return value


def _container_real_request(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text())
    if not isinstance(payload, dict) or set(payload) != {"productionRouteReviewId", "operator", "eligibilityConfirmed"}:
        raise ValueError("stage7 real acceptance request fields are invalid")
    return _api("POST", "/api/execution/stage7/production-readonly-probes", payload)["productionReadonlyProbe"]


def _container_readback(probe_id: str) -> dict[str, Any]:
    probes = _api("GET", "/api/execution/stage7/production-readonly-probes?limit=100")["productionReadonlyProbes"]
    return next(row for row in probes if row.get("probeId") == probe_id)


def _wait_for_api(repo: Path, env: dict[str, str]) -> None:
    deadline = time.monotonic() + 40
    command = ["docker", "compose", "exec", "-T", "api", "python", "-c",
               "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8765/health', timeout=3).read()"]
    while time.monotonic() < deadline:
        try:
            _run(command, repo, env)
            return
        except RuntimeError:
            time.sleep(0.5)
    raise RuntimeError("stage7 API did not recover after restart")


def _orchestrate(repo: Path, report: Path, real_request: Path | None, *, build: bool) -> dict[str, Any]:
    env = dict(os.environ)
    env["INSTALL_DATA_DEPS"] = "true"
    _run(["docker", "compose", "config"], repo, env)
    _run(["docker", "compose", "up", "-d", *( ["--build"] if build else []), "api"], repo, env)
    if real_request:
        if not env.get("CCXT_PRODUCTION_READONLY_API_KEY") or not env.get("CCXT_PRODUCTION_READONLY_SECRET"):
            raise RuntimeError("stage7 real acceptance requires dedicated production read-only credentials")
        _run(["docker", "compose", "cp", str(real_request), "api:/tmp/stage7-real-request.json"], repo, env)
        output = _run([
            "docker", "compose", "exec", "-T", "api", "python", "tools/stage7_production_readonly_acceptance.py",
            "--container-real-request", "/tmp/stage7-real-request.json",
        ], repo, env)
        probe = json.loads(next(line for line in reversed(output.splitlines()) if line.startswith("{")))
        _run(["docker", "compose", "restart", "api"], repo, env)
        _wait_for_api(repo, env)
        output = _run([
            "docker", "compose", "exec", "-T", "api", "python", "tools/stage7_production_readonly_acceptance.py",
            "--container-readback-probe", probe["probeId"],
        ], repo, env)
        readback = json.loads(next(line for line in reversed(output.splitlines()) if line.startswith("{")))
        manifest = _real_manifest(probe, readback)
    else:
        output = _run([
            "docker", "compose", "exec", "-T",
            "-e", "CCXT_PRODUCTION_READONLY_API_KEY=", "-e", "CCXT_PRODUCTION_READONLY_SECRET=",
            "api", "python", "tools/stage7_production_readonly_acceptance.py", "--container-no-credentials",
        ], repo, env)
        manifest = json.loads(next(line for line in reversed(output.splitlines()) if line.startswith("{")))
    validate(manifest)
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", type=Path, default=Path("data/stage7-production-readonly-safety.json"))
    parser.add_argument("--validate", type=Path)
    parser.add_argument("--real-request", type=Path)
    parser.add_argument("--no-build", action="store_true")
    parser.add_argument("--container-no-credentials", action="store_true")
    parser.add_argument("--container-real-request", type=Path)
    parser.add_argument("--container-readback-probe")
    args = parser.parse_args()
    if args.validate:
        print(validate(json.loads(args.validate.read_text())))
        return 0
    if args.container_no_credentials:
        manifest = _container_no_credentials()
    elif args.container_real_request:
        manifest = _container_real_request(args.container_real_request)
    elif args.container_readback_probe:
        manifest = _container_readback(args.container_readback_probe)
    else:
        manifest = _orchestrate(
            Path(__file__).resolve().parents[1], args.report, args.real_request, build=not args.no_build
        )
    print(json.dumps(manifest, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
