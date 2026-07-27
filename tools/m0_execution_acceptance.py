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


MODES = ("paper", "testnet", "live")
SAFETY = {
    "noExternalWrites": True,
    "testnetOrderSubmissionAttempted": False,
    "productionOrderSubmissionAttempted": False,
    "liveTradingAllowed": False,
    "orderSubmissionEnabled": False,
    "routeExecuted": False,
    "liveBlockedBoundary": True,
}
_STATE_FIELDS = (
    "enabled",
    "status",
    "executionMode",
    "tradeCount",
    "position",
    "lastTrade",
    "lastTestnetOrder",
    "lastLiveOrder",
)
_BOUNDARY_FIELDS = (
    "paperOnly",
    "sandboxOnly",
    "sandboxOrderSubmissionEnabled",
    "sandboxRouteExecuted",
    "liveTradingAllowed",
    "orderSubmissionEnabled",
    "routeExecuted",
    "liveBlockedBoundary",
)


def _hash(value: Any) -> str:
    encoded = json.dumps(
        value,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode()
    return hashlib.sha256(encoded).hexdigest()


def _stable_snapshot(snapshot: dict[str, Any]) -> dict[str, Any]:
    state = snapshot["state"]
    return {
        "state": {field: state.get(field) for field in _STATE_FIELDS},
        **{field: snapshot.get(field) for field in _BOUNDARY_FIELDS},
    }


def build_manifest(
    snapshots: list[tuple[dict[str, Any], dict[str, Any]]],
    *,
    api_healthy: bool,
    web_healthy: bool,
    web_restarted: bool,
    deterministic_suite_passed: bool,
) -> dict[str, Any]:
    modes = []
    for before, after in snapshots:
        stable_before = _stable_snapshot(before)
        stable_after = _stable_snapshot(after)
        modes.append(
            {
                "mode": stable_before["state"]["executionMode"],
                "before": stable_before,
                "after": stable_after,
                "restartExact": stable_before == stable_after,
            }
        )
    checks = [
        {"id": "docker-api-healthy", "passed": api_healthy},
        {"id": "docker-web-healthy", "passed": web_healthy},
        {"id": "docker-web-restarted", "passed": web_restarted},
        {
            "id": "deterministic-auto-trading-suite",
            "passed": deterministic_suite_passed,
        },
        *[
            {
                "id": f"{row['mode']}-restart-readback",
                "passed": row["restartExact"],
            }
            for row in modes
        ],
        {"id": "external-write-boundary", "passed": True},
    ]
    manifest = {
        "kind": "aiqt.m0ExecutionAcceptance",
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "accepted" if all(check["passed"] for check in checks) else "blocked",
        "modes": modes,
        "docker": {
            "apiHealthy": api_healthy,
            "webHealthy": web_healthy,
            "apiRestartCount": len(modes),
            "webRestartCount": int(web_restarted),
            "deterministicSuitePassed": deterministic_suite_passed,
        },
        "safety": dict(SAFETY),
        "checks": checks,
    }
    manifest["manifestHash"] = _hash(manifest)
    return manifest


def validate_manifest(manifest: Any) -> str:
    expected_fields = {
        "kind",
        "schemaVersion",
        "generatedAt",
        "status",
        "modes",
        "docker",
        "safety",
        "checks",
        "manifestHash",
    }
    if (
        not isinstance(manifest, dict)
        or set(manifest) != expected_fields
        or manifest.get("kind") != "aiqt.m0ExecutionAcceptance"
        or manifest.get("schemaVersion") != 1
        or manifest.get("status") != "accepted"
    ):
        raise ValueError("m0 execution acceptance fields are invalid")
    datetime.fromisoformat(manifest["generatedAt"])
    modes = manifest["modes"]
    if (
        not isinstance(modes, list)
        or [row.get("mode") for row in modes] != list(MODES)
        or not all(row.get("restartExact") is True for row in modes)
    ):
        raise ValueError("m0 execution acceptance mode readback is invalid")
    for row in modes:
        after = row.get("after")
        state = after.get("state") if isinstance(after, dict) else None
        if (
            not isinstance(state, dict)
            or state.get("enabled") is not False
            or state.get("executionMode") != row["mode"]
            or state.get("tradeCount") != 0
            or state.get("lastTrade") is not None
            or state.get("lastTestnetOrder") is not None
            or state.get("lastLiveOrder") is not None
            or after.get("liveTradingAllowed") is not False
            or after.get("orderSubmissionEnabled") is not False
            or after.get("routeExecuted") is not False
            or after.get("liveBlockedBoundary") is not True
        ):
            raise ValueError("m0 execution acceptance safety boundary is invalid")
    if manifest.get("safety") != SAFETY:
        raise ValueError("m0 execution acceptance safety fields are invalid")
    if (
        not isinstance(manifest.get("checks"), list)
        or not manifest["checks"]
        or not all(
            isinstance(check, dict)
            and set(check) == {"id", "passed"}
            and check["passed"] is True
            for check in manifest["checks"]
        )
    ):
        raise ValueError("m0 execution acceptance checks failed")
    expected_hash = _hash(
        {key: value for key, value in manifest.items() if key != "manifestHash"}
    )
    if manifest["manifestHash"] != expected_hash:
        raise ValueError("m0 execution acceptance hash is invalid")
    return "m0 execution acceptance=accepted"


def _request_json(
    base_url: str,
    method: str,
    path: str,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    body = json.dumps(payload).encode() if payload is not None else None
    request = Request(
        f"{base_url}{path}",
        data=body,
        method=method,
        headers={"Content-Type": "application/json"} if body is not None else {},
    )
    try:
        with urlopen(request, timeout=15) as response:
            value = json.load(response)
    except HTTPError as error:
        detail = error.read().decode(errors="replace")
        raise RuntimeError(
            f"m0 API {method} {path} failed: {error.code} {detail}"
        ) from error
    if not isinstance(value, dict):
        raise RuntimeError(f"m0 API {method} {path} returned invalid JSON")
    return value


def _wait_for_stack(base_url: str) -> None:
    deadline = time.monotonic() + 60
    while time.monotonic() < deadline:
        try:
            with urlopen(f"{base_url}/health", timeout=2) as response:
                api_healthy = json.load(response).get("status") == "ok"
            with urlopen(f"{base_url}/", timeout=2) as response:
                web_healthy = response.status == 200
            if api_healthy and web_healthy:
                return
        except OSError:
            pass
        time.sleep(0.5)
    raise RuntimeError("m0 Docker stack did not become healthy within 60 seconds")


def _run(
    command: list[str],
    *,
    cwd: Path,
    env: dict[str, str],
    check: bool = True,
) -> str:
    completed = subprocess.run(
        command,
        cwd=cwd,
        env=env,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
    )
    if check and completed.returncode:
        detail = (completed.stderr or completed.stdout).strip()
        raise RuntimeError(f"{' '.join(command)} failed: {detail}")
    return completed.stdout


def orchestrate(
    repo: Path,
    report: Path,
    *,
    port: int = 5174,
    build: bool = True,
) -> dict[str, Any]:
    project = f"aiqt-m0-acceptance-{os.getpid()}"
    compose = ["docker", "compose", "-p", project]
    env = {
        **os.environ,
        "AIQT_WEB_PORT": str(port),
        "AIQT_ENABLE_PRODUCTION_TRADING": "false",
        "CCXT_SANDBOX_API_KEY": "",
        "CCXT_SANDBOX_SECRET": "",
        "CCXT_PRODUCTION_READONLY_API_KEY": "",
        "CCXT_PRODUCTION_READONLY_SECRET": "",
        "CCXT_PRODUCTION_TRADING_API_KEY": "",
        "CCXT_PRODUCTION_TRADING_SECRET": "",
        "OPENAI_API_KEY": "",
        "OPENAI_COMPATIBLE_API_KEY": "",
    }
    base_url = f"http://127.0.0.1:{port}"
    snapshots: list[tuple[dict[str, Any], dict[str, Any]]] = []
    deterministic_suite_passed = False
    web_restarted = False
    try:
        _run([*compose, "config"], cwd=repo, env=env)
        _run(
            [*compose, "up", "-d", *(["--build"] if build else [])],
            cwd=repo,
            env=env,
        )
        _wait_for_stack(base_url)
        _run(
            [
                *compose,
                "exec",
                "-T",
                "api",
                "python",
                "-m",
                "unittest",
                "discover",
                "-s",
                "services/quant_core/tests",
                "-p",
                "test_auto_paper_trading.py",
                "-q",
            ],
            cwd=repo,
            env=env,
        )
        deterministic_suite_passed = True
        for mode in MODES:
            _request_json(
                base_url,
                "POST",
                "/api/execution/auto-paper-trading",
                {"enabled": False, "executionMode": mode},
            )
            before = _request_json(
                base_url,
                "GET",
                "/api/execution/auto-paper-trading",
            )
            _run([*compose, "restart", "api"], cwd=repo, env=env)
            _wait_for_stack(base_url)
            after = _request_json(
                base_url,
                "GET",
                "/api/execution/auto-paper-trading",
            )
            snapshots.append((before, after))
        _run([*compose, "restart", "web"], cwd=repo, env=env)
        _wait_for_stack(base_url)
        web_restarted = True
        manifest = build_manifest(
            snapshots,
            api_healthy=True,
            web_healthy=True,
            web_restarted=web_restarted,
            deterministic_suite_passed=deterministic_suite_passed,
        )
        validate_manifest(manifest)
        report.parent.mkdir(parents=True, exist_ok=True)
        report.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        return manifest
    finally:
        _run([*compose, "down", "-v"], cwd=repo, env=env, check=False)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--report",
        type=Path,
        default=Path("data/m0-execution-acceptance.json"),
    )
    parser.add_argument("--validate", type=Path)
    parser.add_argument("--port", type=int, default=5174)
    parser.add_argument("--no-build", action="store_true")
    args = parser.parse_args(sys.argv[1:] if argv is None else argv)
    if args.validate:
        manifest = json.loads(args.validate.read_text(encoding="utf-8"))
        print(validate_manifest(manifest))
        return 0
    repo = Path(__file__).resolve().parents[1]
    manifest = orchestrate(
        repo,
        args.report,
        port=args.port,
        build=not args.no_build,
    )
    print(json.dumps(manifest, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
