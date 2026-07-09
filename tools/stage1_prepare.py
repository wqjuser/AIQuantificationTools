from __future__ import annotations

import argparse
import subprocess
from pathlib import Path
from typing import Callable, Sequence


Stage1CommandRunner = Callable[..., subprocess.CompletedProcess]


def build_stage1_prepare_plan(*, mode: str = "full") -> list[dict[str, object]]:
    if mode == "quick":
        return [
            _step("p0-acceptance-validate", "Validate P0 acceptance", ["npm", "run", "docker:smoke:p0:validate"]),
            _step("p1-acceptance-validate", "Validate P1 acceptance", ["npm", "run", "docker:smoke:p1:validate"]),
            _step("p2-paper-replay-validate", "Validate P2 paper replay", ["npm", "run", "docker:smoke:p2:paper-replay:validate"]),
            _step("p2-pre-live-validate", "Validate P2 pre-live acceptance", ["npm", "run", "docker:smoke:p2:pre-live:validate"]),
            _step("p2-readiness-validate", "Validate P2 readiness acceptance", ["npm", "run", "docker:smoke:p2:validate"]),
            _step("p2-chain-preflight", "Refresh P2 manifest chain preflight", ["npm", "run", "docker:smoke:p2:preflight"]),
            _step("desktop-release-record", "Refresh desktop release manifest", ["npm", "run", "desktop:release:record"]),
            *_stage1_report_steps(),
        ]
    if mode != "full":
        raise ValueError("Stage 1 prepare mode must be full or quick")
    return [
        _step("p0-acceptance", "Run P0 acceptance smoke", ["npm", "run", "docker:smoke:p0", "--", "--no-build", "--down"]),
        _step("p1-acceptance", "Run P1 acceptance smoke", ["npm", "run", "docker:smoke:p1", "--", "--no-build", "--down"]),
        _step("p2-readiness-chain", "Run P2 readiness chain smoke", ["npm", "run", "docker:smoke:p2:chain", "--", "--no-build"]),
        _step("p2-chain-preflight", "Refresh P2 manifest chain preflight", ["npm", "run", "docker:smoke:p2:preflight"]),
        _step("desktop-release", "Build and record desktop release", ["npm", "run", "desktop:release"]),
        *_stage1_report_steps(),
    ]


def run_stage1_prepare(
    *,
    mode: str = "full",
    dry_run: bool = False,
    cwd: Path | str | None = None,
    runner: Stage1CommandRunner = subprocess.run,
) -> int:
    project_root = Path(cwd or Path(__file__).resolve().parents[1])
    plan = build_stage1_prepare_plan(mode=mode)
    print(f"stage1 prepare mode={mode} steps={len(plan)}")
    for index, step in enumerate(plan, start=1):
        command = step["command"]
        if not isinstance(command, list):
            raise TypeError("Stage 1 prepare command must be a list")
        print(f"{index}. {step['id']}: {' '.join(str(part) for part in command)}")
        if not dry_run:
            runner(command, cwd=project_root, check=True)
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Prepare or validate the local Stage 1 daily-use evidence chain.")
    parser.add_argument("--project-root", default=str(Path(__file__).resolve().parents[1]), help="Repository root.")
    parser.add_argument("--mode", choices=["full", "quick"], default="full", help="Preparation mode.")
    parser.add_argument("--dry-run", action="store_true", help="Print commands without executing them.")
    args = parser.parse_args(argv)
    return run_stage1_prepare(mode=args.mode, dry_run=args.dry_run, cwd=Path(args.project_root))


def _stage1_report_steps() -> list[dict[str, object]]:
    return [
        _step("stage1-daily-use", "Refresh Stage 1 daily-use report", ["npm", "run", "stage1:daily"]),
        _step("stage1-bootstrap-preflight", "Refresh Stage 1 bootstrap preflight", ["npm", "run", "stage1:preflight"]),
        _step("stage1-daily-use-validate", "Validate Stage 1 daily-use report", ["npm", "run", "stage1:daily:validate"]),
        _step("stage1-bootstrap-preflight-validate", "Validate Stage 1 bootstrap preflight", ["npm", "run", "stage1:preflight:validate"]),
    ]


def _step(step_id: str, label: str, command: list[str]) -> dict[str, object]:
    return {"id": step_id, "label": label, "command": command}


if __name__ == "__main__":
    raise SystemExit(main())
