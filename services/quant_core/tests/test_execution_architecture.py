from __future__ import annotations

import ast
from pathlib import Path
import unittest

from quant_core import execution


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = PACKAGE_ROOT.parents[1]
EXECUTION_MODULE = PACKAGE_ROOT / "quant_core" / "execution.py"
EXECUTION_INTERNAL_ROOT = PACKAGE_ROOT / "quant_core" / "execution_core"


class ExecutionArchitectureTests(unittest.TestCase):
    def test_execution_modules_stay_below_one_thousand_lines(self) -> None:
        paths = [EXECUTION_MODULE]
        if EXECUTION_INTERNAL_ROOT.exists():
            paths.extend(EXECUTION_INTERNAL_ROOT.rglob("*.py"))

        oversized = {
            str(path.relative_to(REPOSITORY_ROOT)): len(path.read_text().splitlines())
            for path in paths
            if len(path.read_text().splitlines()) >= 1_000
        }

        self.assertEqual(oversized, {})

    def test_internal_modules_do_not_import_compatibility_seam(self) -> None:
        offenders: list[str] = []
        if EXECUTION_INTERNAL_ROOT.exists():
            for path in EXECUTION_INTERNAL_ROOT.rglob("*.py"):
                tree = ast.parse(path.read_text())
                for node in ast.walk(tree):
                    if isinstance(node, ast.ImportFrom) and node.module == "quant_core.execution":
                        offenders.append(str(path.relative_to(REPOSITORY_ROOT)))
                    if isinstance(node, ast.Import):
                        if any(alias.name == "quant_core.execution" for alias in node.names):
                            offenders.append(str(path.relative_to(REPOSITORY_ROOT)))

        self.assertEqual(offenders, [])

    def test_repository_imports_resolve_through_compatibility_seam(self) -> None:
        missing: set[str] = set()
        source_roots = [REPOSITORY_ROOT / "services", REPOSITORY_ROOT / "tools"]
        for source_root in source_roots:
            for path in source_root.rglob("*.py"):
                tree = ast.parse(path.read_text())
                for node in ast.walk(tree):
                    if not isinstance(node, ast.ImportFrom) or node.module != "quant_core.execution":
                        continue
                    missing.update(alias.name for alias in node.names if not hasattr(execution, alias.name))

        self.assertEqual(missing, set())


if __name__ == "__main__":
    unittest.main()
