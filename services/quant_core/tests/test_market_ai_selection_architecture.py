from __future__ import annotations

import ast
from pathlib import Path
import unittest

from quant_core import market_ai_selection


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = PACKAGE_ROOT.parents[1]
MARKET_AI_SELECTION_MODULE = PACKAGE_ROOT / "quant_core" / "market_ai_selection.py"
MARKET_AI_SELECTION_INTERNAL_ROOT = (
    PACKAGE_ROOT / "quant_core" / "market_ai_selection_core"
)
COMPATIBILITY_SYMBOLS = {
    "MARKET_AI_SELECTION_OUTPUT_SCHEMA",
    "Clock",
    "FundamentalLoader",
    "JsonFetcher",
    "KlineLoader",
    "MarketAiSelectionError",
    "MarketAiSelectionService",
    "Monotonic",
    "Sleeper",
    "build_coingecko_binance_mapping",
    "compare_stock_fundamental_sources",
    "parse_ashare_financial_reports",
    "parse_sec_companyfacts",
    "resolve_market_ai_selection_research_evidence",
    "validate_market_ai_selection_output",
    "validate_market_ai_selection_request",
}


class MarketAiSelectionArchitectureTests(unittest.TestCase):
    def test_modules_stay_below_one_thousand_lines(self) -> None:
        paths = [MARKET_AI_SELECTION_MODULE]
        if MARKET_AI_SELECTION_INTERNAL_ROOT.exists():
            paths.extend(MARKET_AI_SELECTION_INTERNAL_ROOT.rglob("*.py"))

        oversized = {
            str(path.relative_to(REPOSITORY_ROOT)): len(path.read_text().splitlines())
            for path in paths
            if len(path.read_text().splitlines()) >= 1_000
        }
        self.assertEqual(oversized, {})

    def test_internal_modules_do_not_import_compatibility_seam(self) -> None:
        offenders: list[str] = []
        if MARKET_AI_SELECTION_INTERNAL_ROOT.exists():
            for path in MARKET_AI_SELECTION_INTERNAL_ROOT.rglob("*.py"):
                tree = ast.parse(path.read_text())
                for node in ast.walk(tree):
                    if (
                        isinstance(node, ast.ImportFrom)
                        and node.module == "quant_core.market_ai_selection"
                    ):
                        offenders.append(str(path.relative_to(REPOSITORY_ROOT)))
                    if isinstance(node, ast.Import) and any(
                        alias.name == "quant_core.market_ai_selection"
                        for alias in node.names
                    ):
                        offenders.append(str(path.relative_to(REPOSITORY_ROOT)))

        self.assertEqual(offenders, [])

    def test_internal_modules_are_named_by_responsibility(self) -> None:
        numbered = [
            str(path.relative_to(REPOSITORY_ROOT))
            for path in MARKET_AI_SELECTION_INTERNAL_ROOT.rglob("*.py")
            if any(
                part.isdigit() or part.removeprefix("part").isdigit()
                for part in path.stem.split("_")
            )
        ] if MARKET_AI_SELECTION_INTERNAL_ROOT.exists() else []
        self.assertEqual(numbered, [])

    def test_compatibility_symbols_remain_importable(self) -> None:
        self.assertEqual(set(market_ai_selection.__all__), COMPATIBILITY_SYMBOLS)
        missing = sorted(
            name for name in COMPATIBILITY_SYMBOLS
            if not hasattr(market_ai_selection, name)
        )
        self.assertEqual(missing, [])


if __name__ == "__main__":
    unittest.main()
