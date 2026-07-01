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

from quant_core.stage1_bootstrap_preflight import (  # noqa: E402
    DEFAULT_STAGE1_BOOTSTRAP_PREFLIGHT_REPORT_PATH,
    load_stage1_bootstrap_preflight_status,
    validate_stage1_bootstrap_preflight,
    write_stage1_bootstrap_preflight,
)


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build or validate the local Stage 1 bootstrap preflight.")
    parser.add_argument("--project-root", default=str(Path(__file__).resolve().parents[1]), help="Repository root.")
    parser.add_argument("--output", default=str(DEFAULT_STAGE1_BOOTSTRAP_PREFLIGHT_REPORT_PATH), help="Preflight output path.")
    parser.add_argument("--validate", help="Validate an existing Stage 1 bootstrap preflight path.")
    parser.add_argument("--print-json", action="store_true", help="Print the full preflight JSON.")
    args = parser.parse_args(argv)

    project_root = Path(args.project_root).resolve()
    if args.validate:
        preflight = load_stage1_bootstrap_preflight_status(_resolve_under_root(project_root, Path(args.validate)))
        summary = validate_stage1_bootstrap_preflight(preflight)
        if args.print_json:
            print(json.dumps(preflight, ensure_ascii=False, indent=2))
        else:
            print(f"{summary} input={args.validate}")
        return 0

    preflight = write_stage1_bootstrap_preflight(
        project_root=project_root,
        output_path=Path(args.output),
    )
    if args.print_json:
        print(json.dumps(preflight, ensure_ascii=False, indent=2))
    else:
        print(
            "stage1 bootstrap preflight "
            f"status={preflight['status']} ready={preflight['readyCount']}/{preflight['totalCount']} "
            f"next={preflight['nextAction']} output={Path(args.output)}"
        )
    return 0


def _resolve_under_root(project_root: Path, path: Path) -> Path:
    return path if path.is_absolute() else project_root / path


if __name__ == "__main__":
    raise SystemExit(main())
