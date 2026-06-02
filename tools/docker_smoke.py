from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Sequence
from urllib.error import URLError
from urllib.request import urlopen


def compose_up_args(build: bool = True) -> list[str]:
    args = ["docker", "compose", "up", "-d"]
    if build:
        args.append("--build")
    return args


def validate_workspace_payload(payload: Any) -> str:
    if not isinstance(payload, dict):
        raise RuntimeError("Invalid /api/workspace response: body is not an object")
    selected = payload.get("selectedInstrument")
    watchlist = payload.get("watchlist")
    schema_version = payload.get("schemaVersion")
    if schema_version != 1 or not isinstance(selected, dict) or not isinstance(watchlist, list):
        raise RuntimeError("Invalid /api/workspace response: missing schema, selected instrument, or watchlist")
    symbol = selected.get("symbol")
    if not isinstance(symbol, str) or not symbol.strip():
        raise RuntimeError("Invalid /api/workspace response: selected instrument symbol is missing")
    return f"workspace schema={schema_version} selected={symbol} watchlist={len(watchlist)}"


def validate_health_payload(payload: Any) -> str:
    if not isinstance(payload, dict) or payload.get("status") != "ok" or payload.get("service") != "quant-core":
        raise RuntimeError("Invalid /health response")
    return f"health status={payload['status']} service={payload['service']}"


def request_json(url: str, timeout_seconds: int) -> Any:
    with urlopen(url, timeout=timeout_seconds) as response:
        return json.loads(response.read().decode("utf-8"))


def request_text(url: str, timeout_seconds: int) -> str:
    with urlopen(url, timeout=timeout_seconds) as response:
        return response.read().decode("utf-8", errors="replace")


def wait_for_json(url: str, timeout_seconds: int) -> Any:
    deadline = time.time() + timeout_seconds
    last_error: Exception | None = None
    while time.time() < deadline:
        try:
            return request_json(url, timeout_seconds=5)
        except (OSError, URLError, json.JSONDecodeError) as error:
            last_error = error
            time.sleep(1)
    raise RuntimeError(f"Timed out waiting for JSON from {url}: {last_error}")


def wait_for_text(url: str, timeout_seconds: int) -> str:
    deadline = time.time() + timeout_seconds
    last_error: Exception | None = None
    while time.time() < deadline:
        try:
            return request_text(url, timeout_seconds=5)
        except (OSError, URLError) as error:
            last_error = error
            time.sleep(1)
    raise RuntimeError(f"Timed out waiting for text from {url}: {last_error}")


def join_url(base_url: str, path: str) -> str:
    return f"{base_url.rstrip('/')}/{path.lstrip('/')}"


def run_command(args: Sequence[str], cwd: Path, check: bool = True) -> subprocess.CompletedProcess[str]:
    print(f"$ {' '.join(args)}")
    result = subprocess.run(args, cwd=cwd, check=False, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if check and result.returncode:
        if result.stdout:
            print(result.stdout, end="" if result.stdout.endswith("\n") else "\n")
        raise subprocess.CalledProcessError(result.returncode, args, output=result.stdout)
    return result


def run_smoke(repo_root: Path, base_url: str, timeout_seconds: int, build: bool, down: bool) -> None:
    try:
        run_command(["docker", "compose", "config"], cwd=repo_root)
        run_command(compose_up_args(build=build), cwd=repo_root)

        health_payload = wait_for_json(join_url(base_url, "/health"), timeout_seconds)
        print(validate_health_payload(health_payload))

        index_html = wait_for_text(base_url, timeout_seconds)
        if "AI Quantification Tools" not in index_html:
            raise RuntimeError("Invalid web response: missing AI Quantification Tools title")
        print(f"web status=ok url={base_url}")

        workspace_payload = wait_for_json(join_url(base_url, "/api/workspace"), timeout_seconds)
        print(validate_workspace_payload(workspace_payload))
    finally:
        if down:
            run_command(["docker", "compose", "down"], cwd=repo_root, check=False)


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run a Docker Compose smoke test for AIQuantificationTools.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8080", help="Web service URL to verify.")
    parser.add_argument("--timeout", type=int, default=90, help="Seconds to wait for services to become reachable.")
    parser.add_argument("--no-build", action="store_true", help="Start Compose without rebuilding images.")
    parser.add_argument("--down", action="store_true", help="Run docker compose down after the smoke test.")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    repo_root = Path(__file__).resolve().parents[1]
    run_smoke(
        repo_root=repo_root,
        base_url=args.base_url,
        timeout_seconds=max(1, args.timeout),
        build=not args.no_build,
        down=args.down,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
