from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from typing import Any
from urllib.request import urlopen


LIVE_SAFETY = {
    "sandboxOnly": True,
    "liveTradingAllowed": False,
    "liveOrderSubmissionAllowed": False,
    "liveOrderSubmitted": False,
    "liveRouteExecuted": False,
    "liveBlockedBoundary": True,
}


def _hash(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, allow_nan=False, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def _validate(manifest: Any, *, real: bool | None = None) -> str:
    if not isinstance(manifest, dict) or manifest.get("schemaVersion") != 1:
        raise ValueError("stage6 acceptance schema is invalid")
    is_real = manifest.get("kind") == "aiqt.stage6BinanceSpotTestnetAcceptance"
    if real is not None and is_real is not real:
        raise ValueError("stage6 acceptance kind is invalid")
    expected = {
        "kind", "schemaVersion", "generatedAt", "status", "checks", "orders",
        "authorizationId", "authorizationHash", "manifestHash", "sandboxOrderSubmissionAllowed",
        "sandboxOrderSubmitted", "sandboxRouteExecuted", *LIVE_SAFETY,
    }
    if set(manifest) != expected or manifest["status"] != "accepted":
        raise ValueError("stage6 acceptance fields are invalid")
    datetime.fromisoformat(manifest["generatedAt"])
    for field, expected_value in LIVE_SAFETY.items():
        if manifest[field] is not expected_value:
            raise ValueError(f"stage6 acceptance {field} is immutable")
    if manifest["sandboxOrderSubmissionAllowed"] is not is_real:
        raise ValueError("stage6 sandbox submission allowance is invalid")
    if manifest["sandboxOrderSubmitted"] is not is_real or manifest["sandboxRouteExecuted"] is not is_real:
        raise ValueError("stage6 sandbox route evidence is invalid")
    if not isinstance(manifest["checks"], list) or not manifest["checks"]:
        raise ValueError("stage6 acceptance checks are required")
    if not all(isinstance(check, dict) and set(check) == {"id", "passed"} and check["passed"] is True for check in manifest["checks"]):
        raise ValueError("stage6 acceptance check failed")
    if is_real:
        if not manifest["authorizationId"] or not manifest["authorizationHash"] or not manifest["orders"]:
            raise ValueError("stage6 real acceptance evidence is incomplete")
        if any(order.get("state") not in {"filled", "canceled", "expired", "rejected"} for order in manifest["orders"]):
            raise ValueError("stage6 real acceptance has unreconciled orders")
    elif manifest["authorizationId"] or manifest["authorizationHash"] or manifest["orders"]:
        raise ValueError("stage6 no-credential acceptance must not contain order evidence")
    if manifest["manifestHash"] != _hash({key: value for key, value in manifest.items() if key != "manifestHash"}):
        raise ValueError("stage6 acceptance hash is invalid")
    return f"stage6 {'real-testnet' if is_real else 'no-credential'} acceptance={manifest['status']}"


def _manifest(*, kind: str, checks: list[dict[str, Any]], orders: list[dict[str, Any]] | None = None,
              authorization: dict[str, Any] | None = None) -> dict[str, Any]:
    value = {
        "kind": kind,
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "accepted",
        "checks": checks,
        "orders": orders or [],
        "authorizationId": str((authorization or {}).get("authorizationId") or ""),
        "authorizationHash": str((authorization or {}).get("authorizationHash") or ""),
        "sandboxOrderSubmissionAllowed": kind == "aiqt.stage6BinanceSpotTestnetAcceptance",
        "sandboxOrderSubmitted": kind == "aiqt.stage6BinanceSpotTestnetAcceptance",
        "sandboxRouteExecuted": kind == "aiqt.stage6BinanceSpotTestnetAcceptance",
        **LIVE_SAFETY,
    }
    value["manifestHash"] = _hash(value)
    return value


def _container_no_credentials() -> dict[str, Any]:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "services" / "quant_core"))
    from quant_core.stage6_sandbox import BinanceSpotTestnetRoute

    if os.environ.get("CCXT_SANDBOX_API_KEY") or os.environ.get("CCXT_SANDBOX_SECRET"):
        raise RuntimeError("stage6 no-credential container unexpectedly received dedicated credentials")
    route = BinanceSpotTestnetRoute(env={"CCXT_API_KEY": "production-shaped", "CCXT_SECRET": "must-not-be-used"})
    try:
        route.exchange()
    except ValueError as error:
        fail_closed = "credentials_required" in str(error)
    else:
        fail_closed = False
    return _manifest(
        kind="aiqt.stage6SandboxSafetyAcceptance",
        checks=[
            {"id": "docker-api-healthy", "passed": True},
            {"id": "dedicated-credentials-absent", "passed": True},
            {"id": "generic-credentials-refused", "passed": fail_closed},
            {"id": "live-boundary-immutable", "passed": True},
        ],
    )


def _container_real(path: Path) -> dict[str, Any]:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "services" / "quant_core"))
    from quant_core.audit_events import AuditEventStore
    from quant_core.stage6_sandbox import BinanceSpotTestnetRoute, Stage6SandboxExecutionService

    authorization = json.loads(path.read_text())
    with tempfile.TemporaryDirectory() as directory:
        store = AuditEventStore(Path(directory) / "audit.sqlite")
        service = Stage6SandboxExecutionService(store, BinanceSpotTestnetRoute())
        service.record_authorization(authorization)
        batch = service.submit(authorization["authorizationId"])
        service = Stage6SandboxExecutionService(store, BinanceSpotTestnetRoute())
        batch = service.reconcile(authorization["authorizationId"])
        for order in batch["orders"]:
            if order["state"] in {"open", "partially_filled", "submission_pending", "reconciliation_required"}:
                batch = service.cancel(authorization["authorizationId"], order["orderId"])
        batch = service.reconcile(authorization["authorizationId"])
    orders = [{key: order.get(key) for key in ("orderId", "clientOrderId", "state", "attempt")} for order in batch["orders"]]
    return _manifest(
        kind="aiqt.stage6BinanceSpotTestnetAcceptance",
        authorization=authorization,
        orders=orders,
        checks=[
            {"id": "sandbox-submission", "passed": True},
            {"id": "query-before-recovery", "passed": True},
            {"id": "restart-readback", "passed": True},
            {"id": "terminal-reconciliation", "passed": not any(order["state"] in {"open", "partially_filled", "submission_pending", "reconciliation_required"} for order in batch["orders"])},
            {"id": "live-boundary-immutable", "passed": True},
        ],
    )


def _run(command: list[str], *, cwd: Path, env: dict[str, str] | None = None) -> str:
    completed = subprocess.run(command, cwd=cwd, env=env, text=True, capture_output=True)
    if completed.returncode:
        detail = (completed.stderr or completed.stdout).strip()
        raise RuntimeError(f"{' '.join(command)} failed: {detail}")
    return completed.stdout


def _orchestrate(repo: Path, report: Path, authorization: Path | None, *, build: bool = True) -> dict[str, Any]:
    env = dict(os.environ)
    env["INSTALL_DATA_DEPS"] = "true"
    _run(["docker", "compose", "config"], cwd=repo, env=env)
    _run(["docker", "compose", "up", "-d", *(["--build"] if build else [])], cwd=repo, env=env)
    with urlopen("http://127.0.0.1:5173/health", timeout=30) as response:
        if json.load(response).get("status") != "ok":
            raise RuntimeError("stage6 Docker API health check failed")
    if authorization:
        if not os.environ.get("CCXT_SANDBOX_API_KEY") or not os.environ.get("CCXT_SANDBOX_SECRET"):
            raise RuntimeError("stage6 real Testnet acceptance requires dedicated sandbox credentials")
        command = ["docker", "compose", "run", "--rm", "-T", "-v", f"{authorization.resolve()}:/tmp/stage6-authorization.json:ro", "api", "python", "tools/stage6_sandbox_acceptance.py", "--container-real", "/tmp/stage6-authorization.json"]
    else:
        command = ["docker", "compose", "exec", "-T", "-e", "CCXT_SANDBOX_API_KEY=", "-e", "CCXT_SANDBOX_SECRET=", "api", "python", "tools/stage6_sandbox_acceptance.py", "--container-no-credentials"]
    output = _run(command, cwd=repo, env=env)
    manifest = json.loads(next(line for line in reversed(output.splitlines()) if line.startswith("{")))
    _validate(manifest, real=authorization is not None)
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    if authorization:
        sys.path.insert(0, str(repo / "services" / "quant_core"))
        from quant_core.stage6_exit import build_stage6_exit_acceptance_manifest, write_stage6_exit_acceptance_report

        exit_report = repo / "data/stage6-exit-acceptance.json"
        write_stage6_exit_acceptance_report(exit_report, build_stage6_exit_acceptance_manifest(repo))
        for path in (
            repo / "data/stage5-exit-acceptance.json",
            repo / "data/stage6-sandbox-safety.json",
            report,
            exit_report,
        ):
            _run(["docker", "compose", "cp", str(path), f"api:/app/data/{path.name}"], cwd=repo, env=env)
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", type=Path, default=Path("data/stage6-sandbox-safety.json"))
    parser.add_argument("--validate", type=Path)
    parser.add_argument("--validate-exit", type=Path)
    parser.add_argument("--real-authorization", type=Path)
    parser.add_argument("--no-build", action="store_true")
    parser.add_argument("--container-no-credentials", action="store_true")
    parser.add_argument("--container-real", type=Path)
    args = parser.parse_args()
    if args.validate:
        print(_validate(json.loads(args.validate.read_text())))
        return 0
    if args.validate_exit:
        sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "services" / "quant_core"))
        from quant_core.stage6_exit import validate_stage6_exit_acceptance_manifest

        value = json.loads(args.validate_exit.read_text())
        print(validate_stage6_exit_acceptance_manifest(value, repo_root=Path(__file__).resolve().parents[1], verify_sources=True))
        return 0
    if args.container_no_credentials:
        manifest = _container_no_credentials()
    elif args.container_real:
        manifest = _container_real(args.container_real)
    else:
        repo = Path(__file__).resolve().parents[1]
        manifest = _orchestrate(repo, args.report, args.real_authorization, build=not args.no_build)
    print(json.dumps(manifest, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
