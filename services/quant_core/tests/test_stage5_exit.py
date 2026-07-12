from __future__ import annotations

import copy
import json
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from http.client import HTTPConnection
from http.server import HTTPServer
from threading import Thread

from quant_core.stage5_exit import (
    STAGE5_EXIT_SOURCE_SPECS,
    build_stage5_exit_acceptance_manifest,
    load_stage5_exit_acceptance_status,
    validate_stage5_exit_acceptance_manifest,
    write_stage5_exit_acceptance_report,
)


class Stage5ExitAcceptanceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for index, (_source_id, relative_path) in enumerate(STAGE5_EXIT_SOURCE_SPECS):
            path = self.root / relative_path
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps({"evidence": index}) + "\n", encoding="utf-8")

    def build(self) -> dict[str, object]:
        return build_stage5_exit_acceptance_manifest(
            repo_root=self.root,
            stage5_base_run_id="run-stage5-complete",
            generated_at=datetime(2026, 7, 12, 8, 0, tzinfo=timezone.utc),
        )

    def test_build_validate_and_readback_acceptance(self) -> None:
        manifest = self.build()
        report = self.root / "data/stage5-exit-acceptance.json"
        write_stage5_exit_acceptance_report(report, manifest)

        summary = validate_stage5_exit_acceptance_manifest(
            manifest,
            repo_root=self.root,
            verify_sources=True,
        )
        status = load_stage5_exit_acceptance_status(report)

        self.assertIn("artifacts=7", summary)
        self.assertEqual(status["status"], "accepted")
        self.assertEqual(status["artifactCount"], 7)
        self.assertTrue(status["paperOnly"])
        self.assertTrue(status["liveBlockedBoundary"])
        self.assertFalse(status["authorizationEffective"])
        self.assertFalse(status["orderSubmissionEnabled"])

    def test_rejects_rehashed_safety_or_source_identity_tampering(self) -> None:
        manifest = self.build()
        unsafe = copy.deepcopy(manifest)
        unsafe["liveTradingAllowed"] = True
        unsafe["exitHash"] = self._rehash(unsafe)
        with self.assertRaisesRegex(ValueError, "safety boundary"):
            validate_stage5_exit_acceptance_manifest(unsafe)

        reordered = copy.deepcopy(manifest)
        reordered["sourceArtifacts"] = list(reversed(reordered["sourceArtifacts"]))
        reordered["exitHash"] = self._rehash(reordered)
        with self.assertRaisesRegex(ValueError, "source artifacts"):
            validate_stage5_exit_acceptance_manifest(reordered)

    def test_readback_fails_closed_when_source_file_changes(self) -> None:
        report = self.root / "data/stage5-exit-acceptance.json"
        write_stage5_exit_acceptance_report(report, self.build())
        changed = self.root / STAGE5_EXIT_SOURCE_SPECS[0][1]
        changed.write_text('{"evidence":"changed"}\n', encoding="utf-8")

        status = load_stage5_exit_acceptance_status(report)

        self.assertEqual(status["status"], "invalid")
        self.assertFalse(status["available"])
        self.assertIn("source changed", status["reason"])

    def test_invalid_status_normalizes_malformed_identity_fields(self) -> None:
        report = self.root / "data/stage5-exit-acceptance.json"
        malformed = self.build()
        malformed["generatedAt"] = {"unsafe": True}
        malformed["stage5BaseRunId"] = 42
        malformed["exitHash"] = ["unsafe"]
        report.write_text(json.dumps(malformed), encoding="utf-8")

        status = load_stage5_exit_acceptance_status(report)

        self.assertEqual(status["status"], "invalid")
        self.assertIsNone(status["generatedAt"])
        self.assertIsNone(status["stage5BaseRunId"])
        self.assertIsNone(status["exitHash"])

    def test_latest_api_returns_validated_exit_status(self) -> None:
        from quant_core.api import QuantApiHandler

        report = self.root / "data/stage5-exit-acceptance.json"
        write_stage5_exit_acceptance_report(report, self.build())

        class TestHandler(QuantApiHandler):
            stage5_exit_acceptance_report_path = report

        server = HTTPServer(("127.0.0.1", 0), TestHandler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
        try:
            connection.request("GET", "/api/stage5/exit-acceptance/latest")
            response = connection.getresponse()
            payload = json.loads(response.read().decode("utf-8"))
        finally:
            connection.close()
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["acceptance"]["status"], "accepted")
        self.assertEqual(payload["acceptance"]["stage5BaseRunId"], "run-stage5-complete")
        self.assertEqual(payload["acceptance"]["artifactCount"], 7)
        self.assertFalse(payload["acceptance"]["liveTradingAllowed"])

    @staticmethod
    def _rehash(manifest: dict[str, object]) -> str:
        import hashlib

        payload = {key: value for key, value in manifest.items() if key != "exitHash"}
        canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


if __name__ == "__main__":
    unittest.main()
