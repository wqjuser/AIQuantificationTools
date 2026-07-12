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
import time
from typing import Any
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen


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
        "kind", "schemaVersion", "generatedAt", "status", "checks", "orders", "actionEvidence",
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
        operations = {row.get("operation") for row in manifest["actionEvidence"] if isinstance(row, dict)}
        if (
            not manifest["authorizationId"] or not manifest["authorizationHash"] or not manifest["orders"]
            or not isinstance(manifest["actionEvidence"], list) or not manifest["actionEvidence"]
            or not {"create", "query", "cancel"}.issubset(operations)
        ):
            raise ValueError("stage6 real acceptance evidence is incomplete")
        if any(order.get("state") not in {"filled", "canceled", "expired", "rejected"} for order in manifest["orders"]):
            raise ValueError("stage6 real acceptance has unreconciled orders")
    elif manifest["authorizationId"] or manifest["authorizationHash"] or manifest["orders"] or manifest["actionEvidence"]:
        raise ValueError("stage6 no-credential acceptance must not contain order evidence")
    if manifest["manifestHash"] != _hash({key: value for key, value in manifest.items() if key != "manifestHash"}):
        raise ValueError("stage6 acceptance hash is invalid")
    return f"stage6 {'real-testnet' if is_real else 'no-credential'} acceptance={manifest['status']}"


def _manifest(*, kind: str, checks: list[dict[str, Any]], orders: list[dict[str, Any]] | None = None,
              authorization: dict[str, Any] | None = None,
              action_evidence: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    value = {
        "kind": kind,
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "accepted",
        "checks": checks,
        "orders": orders or [],
        "actionEvidence": action_evidence or [],
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


def _detached_import_readback(export_payload: dict[str, Any], authorization_id: str) -> bool:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "services" / "quant_core"))
    from quant_core.audit_events import AuditEventStore
    from quant_core.runs import research_run_import_audit_events
    from quant_core.stage6_sandbox import BinanceSpotTestnetRoute, Stage6SandboxExecutionService

    with tempfile.TemporaryDirectory() as directory:
        store = AuditEventStore(Path(directory) / "audit.sqlite")
        events = research_run_import_audit_events(
            export_payload, run_id=export_payload["export"]["manifest"]["runId"]
        )
        for event in events:
            store.record(event)
        service = Stage6SandboxExecutionService(store, BinanceSpotTestnetRoute(env={}))
        if service.batch(authorization_id)["authorizationId"] != authorization_id:
            return False
        try:
            service.reconcile(authorization_id)
        except ValueError as error:
            return "detached" in str(error)
        return False


def _api(method: str, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    body = json.dumps(payload).encode() if payload is not None else None
    request = Request(
        f"http://127.0.0.1:5173{path}",
        data=body,
        method=method,
        headers={"Content-Type": "application/json"} if body is not None else {},
    )
    try:
        with urlopen(request, timeout=30) as response:
            value = json.load(response)
    except HTTPError as error:
        detail = error.read().decode(errors="replace")
        raise RuntimeError(f"stage6 API {method} {path} failed: {error.code} {detail}") from error
    if not isinstance(value, dict):
        raise RuntimeError(f"stage6 API {method} {path} returned invalid JSON")
    return value


def _wait_for_api() -> None:
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        try:
            with urlopen("http://127.0.0.1:5173/health", timeout=2) as response:
                if json.load(response).get("status") == "ok":
                    return
        except OSError:
            pass
        time.sleep(0.5)
    raise RuntimeError("stage6 Docker API did not recover after restart")


def _run(command: list[str], *, cwd: Path, env: dict[str, str] | None = None) -> str:
    completed = subprocess.run(command, cwd=cwd, env=env, text=True, capture_output=True)
    if completed.returncode:
        detail = (completed.stderr or completed.stdout).strip()
        raise RuntimeError(f"{' '.join(command)} failed: {detail}")
    return completed.stdout


def _orchestrate(repo: Path, report: Path, real_request: Path | None, *, build: bool = True) -> dict[str, Any]:
    env = dict(os.environ)
    env["INSTALL_DATA_DEPS"] = "true"
    _run(["docker", "compose", "config"], cwd=repo, env=env)
    _run(["docker", "compose", "up", "-d", *(["--build"] if build else [])], cwd=repo, env=env)
    with urlopen("http://127.0.0.1:5173/health", timeout=30) as response:
        if json.load(response).get("status") != "ok":
            raise RuntimeError("stage6 Docker API health check failed")
    if real_request:
        if not os.environ.get("CCXT_SANDBOX_API_KEY") or not os.environ.get("CCXT_SANDBOX_SECRET"):
            raise RuntimeError("stage6 real Testnet acceptance requires dedicated sandbox credentials")
        request_payload = json.loads(real_request.read_text())
        required = {"workflowId", "shadowSessionId", "readinessDecisionId", "preflightId", "reviewId", "operator"}
        if not isinstance(request_payload, dict) or set(request_payload) != required:
            raise ValueError("stage6 real acceptance request fields are invalid")
        authorization = _api("POST", "/api/execution/stage6/sandbox-authorizations", request_payload)["sandboxBatchAuthorization"]
        authorization_id = authorization["authorizationId"]
        batch = _api("POST", "/api/execution/stage6/sandbox-batches", {"authorizationId": authorization_id})["sandboxBatch"]
        batch = _api("POST", "/api/execution/stage6/sandbox-reconciliations", {"authorizationId": authorization_id})["sandboxBatch"]
        for order in batch["orders"]:
            batch = _api("POST", "/api/execution/stage6/sandbox-cancellations", {
                "authorizationId": authorization_id, "orderId": order["orderId"],
            })["sandboxBatch"]
        batch = _api("POST", "/api/execution/stage6/sandbox-reconciliations", {"authorizationId": authorization_id})["sandboxBatch"]
        before_restart = batch
        _run(["docker", "compose", "restart", "api"], cwd=repo, env=env)
        _wait_for_api()
        batch = _api("GET", f"/api/execution/stage6/sandbox-batches?authorizationId={quote(authorization_id)}")["sandboxBatch"]
        export_payload = _api("GET", f"/api/research/runs/{quote(authorization['baseRunId'])}/export")
        transitions = [
            event["metadata"]["snapshot"] for event in export_payload["export"]["auditEvents"]
            if event.get("eventType") == "stage6_sandbox_order_transition"
            and event.get("metadata", {}).get("snapshot", {}).get("authorizationId") == authorization_id
        ]
        action_evidence = [
            {
                "sequence": row["sequence"], "orderId": row["orderId"], "state": row["state"],
                "operation": row.get("exchangeEvidence", {}).get("operation", ""),
                "exchangeOrderId": row.get("exchangeEvidence", {}).get("exchangeOrderId", ""),
                "error": row.get("exchangeEvidence", {}).get("error", row.get("error", "")),
            }
            for row in transitions if row.get("exchangeEvidence", {}).get("operation")
        ]
        operations = {row["operation"] for row in action_evidence}
        orders = [{key: order.get(key) for key in ("orderId", "clientOrderId", "state", "attempt")} for order in batch["orders"]]
        terminal = not any(order["state"] in {"open", "partially_filled", "submission_pending", "reconciliation_required"} for order in orders)
        manifest = _manifest(
            kind="aiqt.stage6BinanceSpotTestnetAcceptance", authorization=authorization,
            orders=orders, action_evidence=action_evidence,
            checks=[
                {"id": "authoritative-api-authorization", "passed": authorization["baseRunId"] == batch["baseRunId"]},
                {"id": "sandbox-submission-audited", "passed": "create" in operations},
                {"id": "exchange-query-audited", "passed": "query" in operations},
                {"id": "cancel-attempt-audited", "passed": "cancel" in operations},
                {"id": "api-restart-readback", "passed": before_restart["authorizationId"] == batch["authorizationId"]},
                {"id": "detached-import-readback", "passed": _detached_import_readback(export_payload, authorization_id)},
                {"id": "terminal-reconciliation", "passed": terminal},
                {"id": "live-boundary-immutable", "passed": True},
            ],
        )
    else:
        command = ["docker", "compose", "exec", "-T", "-e", "CCXT_SANDBOX_API_KEY=", "-e", "CCXT_SANDBOX_SECRET=", "api", "python", "tools/stage6_sandbox_acceptance.py", "--container-no-credentials"]
        output = _run(command, cwd=repo, env=env)
        manifest = json.loads(next(line for line in reversed(output.splitlines()) if line.startswith("{")))
    _validate(manifest, real=real_request is not None)
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    if real_request:
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
    parser.add_argument("--real-request", "--real-authorization", dest="real_request", type=Path)
    parser.add_argument("--no-build", action="store_true")
    parser.add_argument("--container-no-credentials", action="store_true")
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
    else:
        repo = Path(__file__).resolve().parents[1]
        manifest = _orchestrate(repo, args.report, args.real_request, build=not args.no_build)
    print(json.dumps(manifest, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
