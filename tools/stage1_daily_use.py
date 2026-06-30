from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Sequence


def ensure_quant_core_import_path(project_root: Path | None = None) -> None:
    root = project_root or Path(__file__).resolve().parents[1]
    quant_core_root = root / "services" / "quant_core"
    if quant_core_root.exists() and str(quant_core_root) not in sys.path:
        sys.path.insert(0, str(quant_core_root))


ensure_quant_core_import_path()

from quant_core.stage1_daily_use import (  # noqa: E402
    DEFAULT_STAGE1_DAILY_USE_REPORT_PATH,
    build_stage1_daily_use_report,
    load_stage1_daily_use_report,
    validate_stage1_daily_use_report,
    write_stage1_daily_use_report,
)


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build or validate the local Stage 1 daily-use report.")
    parser.add_argument("--project-root", default=str(Path(__file__).resolve().parents[1]), help="Repository root.")
    parser.add_argument("--output", default=str(DEFAULT_STAGE1_DAILY_USE_REPORT_PATH), help="Report output path.")
    parser.add_argument("--validate", help="Validate an existing Stage 1 daily-use report path.")
    parser.add_argument("--p0-acceptance", help="P0 acceptance manifest path.")
    parser.add_argument("--p1-acceptance", help="P1 acceptance manifest path.")
    parser.add_argument("--desktop-release", help="Desktop release manifest path.")
    parser.add_argument("--print-json", action="store_true", help="Print the full report JSON.")
    args = parser.parse_args(argv)

    project_root = Path(args.project_root).resolve()
    if args.validate:
        report = load_stage1_daily_use_report(_resolve_under_root(project_root, Path(args.validate)))
        summary = validate_stage1_daily_use_report(report)
        if args.print_json:
            print(json.dumps(report, ensure_ascii=False, indent=2))
        else:
            print(f"{summary} input={args.validate}")
        return 0

    report = write_stage1_daily_use_report(
        project_root=project_root,
        output_path=Path(args.output),
        p0_path=Path(args.p0_acceptance) if args.p0_acceptance else None,
        p1_path=Path(args.p1_acceptance) if args.p1_acceptance else None,
        desktop_path=Path(args.desktop_release) if args.desktop_release else None,
    )
    if args.print_json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(
            "stage1 daily-use report "
            f"status={report['status']} ready={report['readyCount']}/{report['totalCount']} output={Path(args.output)}"
        )
    return 0


def _resolve_under_root(project_root: Path, path: Path) -> Path:
    return path if path.is_absolute() else project_root / path


if __name__ == "__main__":
    raise SystemExit(main())
