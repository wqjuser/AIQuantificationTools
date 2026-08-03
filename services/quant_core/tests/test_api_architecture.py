from __future__ import annotations

import ast
from pathlib import Path
import unittest


QUANT_CORE_ROOT = Path(__file__).resolve().parents[1] / "quant_core"
API_ENTRYPOINT = QUANT_CORE_ROOT / "api.py"
HTTP_API_ROOT = QUANT_CORE_ROOT / "http_api"
COMPATIBILITY_SYMBOLS = {
    "QuantApiHandler",
    "_adapter_error_message",
    "_adapter_error_target",
    "_backtest_engine_from_query",
    "_build_p0_ai_review_record",
    "_fetch_market_klines_with_cache",
    "_parse_kline_end",
    "_persist_research_run_import",
    "_stage5_sandbox_authorization_probe_execution",
    "_stage5_sandbox_authorization_sources_for_export",
    "_stage5_shadow_sessions",
    "_stage7_production_route_review_is_current",
    "_stage9_production_admission_candidate",
    "_stage9_production_admission_candidates",
    "_stage9_production_admission_reviews",
    "build_auto_paper_trading_runner",
    "evaluate_auto_paper_trading_once",
    "resolve_api_bind",
    "run",
}


def _python_files() -> list[Path]:
    return [API_ENTRYPOINT, *sorted(HTTP_API_ROOT.rglob("*.py"))]


class ApiArchitectureTest(unittest.TestCase):
    def test_http_api_files_stay_below_one_thousand_lines(self) -> None:
        oversized = {
            str(path.relative_to(QUANT_CORE_ROOT)): len(path.read_text().splitlines())
            for path in _python_files()
            if len(path.read_text().splitlines()) >= 1_000
        }
        self.assertEqual(oversized, {})

    def test_http_api_internal_modules_do_not_import_compatibility_entrypoint(self) -> None:
        reverse_imports: list[str] = []
        for path in sorted(HTTP_API_ROOT.rglob("*.py")):
            tree = ast.parse(path.read_text())
            if any(
                isinstance(node, ast.ImportFrom) and node.module == "quant_core.api"
                or isinstance(node, ast.Import)
                and any(alias.name == "quant_core.api" for alias in node.names)
                for node in ast.walk(tree)
            ):
                reverse_imports.append(str(path.relative_to(QUANT_CORE_ROOT)))
        self.assertEqual(reverse_imports, [])

    def test_http_api_has_no_numbered_slice_modules(self) -> None:
        numbered = [
            str(path.relative_to(QUANT_CORE_ROOT))
            for path in sorted(HTTP_API_ROOT.rglob("*.py"))
            if any(part.isdigit() or part.removeprefix("part").isdigit() for part in path.stem.split("_"))
        ]
        self.assertEqual(numbered, [])

    def test_api_compatibility_symbols_remain_importable(self) -> None:
        from quant_core import api

        self.assertEqual(set(api.__all__), set(COMPATIBILITY_SYMBOLS))
        missing = sorted(name for name in COMPATIBILITY_SYMBOLS if not hasattr(api, name))
        self.assertEqual(missing, [])
