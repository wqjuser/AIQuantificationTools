from __future__ import annotations

import copy
import hashlib
from http.client import HTTPConnection
from http.server import HTTPServer
import json
from pathlib import Path
import tempfile
import unittest
from threading import Thread

from quant_core.stage5_exit import (
    STAGE5_EXIT_SOURCE_SPECS,
    build_stage5_exit_acceptance_manifest,
    write_stage5_exit_acceptance_report,
)
from quant_core.stage6_exit import (
    build_stage6_exit_acceptance_manifest,
    load_stage6_exit_acceptance_status,
    validate_stage6_exit_acceptance_manifest,
    write_stage6_exit_acceptance_report,
)


def _source(*, real: bool) -> dict:
    value = {
        "kind": "aiqt.stage6BinanceSpotTestnetAcceptance" if real else "aiqt.stage6SandboxSafetyAcceptance",
        "schemaVersion": 1, "generatedAt": "2026-07-12T10:00:00+00:00", "status": "accepted",
        "checks": [{"id": "accepted", "passed": True}], "orders": [{"state": "canceled"}] if real else [],
        "authorizationId": "stage6-auth-1" if real else "", "authorizationHash": "a" * 64 if real else "",
        "sandboxOrderSubmissionAllowed": real, "sandboxOrderSubmitted": real, "sandboxRouteExecuted": real,
        "sandboxOnly": True, "liveTradingAllowed": False, "liveOrderSubmissionAllowed": False,
        "liveOrderSubmitted": False, "liveRouteExecuted": False, "liveBlockedBoundary": True,
    }
    value["manifestHash"] = hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    return value


class Stage6ExitAcceptanceTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for index, (_source_id, relative_path) in enumerate(STAGE5_EXIT_SOURCE_SPECS):
            path = self.root / relative_path
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps({"evidence": index}))
        write_stage5_exit_acceptance_report(
            self.root / "data/stage5-exit-acceptance.json",
            build_stage5_exit_acceptance_manifest(repo_root=self.root, stage5_base_run_id="run-stage6"),
        )
        (self.root / "data/stage6-sandbox-safety.json").write_text(json.dumps(_source(real=False)))
        (self.root / "data/stage6-binance-spot-testnet.json").write_text(json.dumps(_source(real=True)))

    def test_build_readback_and_fail_closed_source_binding(self) -> None:
        report = self.root / "data/stage6-exit-acceptance.json"
        manifest = build_stage6_exit_acceptance_manifest(self.root)
        write_stage6_exit_acceptance_report(report, manifest)
        self.assertIn("status=maintenance", validate_stage6_exit_acceptance_manifest(
            manifest, repo_root=self.root, verify_sources=True
        ))
        self.assertEqual(load_stage6_exit_acceptance_status(report)["status"], "accepted")

        unsafe = copy.deepcopy(manifest)
        unsafe["liveTradingAllowed"] = True
        unsafe["exitHash"] = hashlib.sha256(json.dumps(
            {key: value for key, value in unsafe.items() if key != "exitHash"}, sort_keys=True, separators=(",", ":")
        ).encode()).hexdigest()
        with self.assertRaisesRegex(ValueError, "safety boundary"):
            validate_stage6_exit_acceptance_manifest(unsafe)

        (self.root / "data/stage6-binance-spot-testnet.json").write_text("{}")
        self.assertEqual(load_stage6_exit_acceptance_status(report)["status"], "invalid")

    def test_api_reports_missing_until_real_exit_manifest_exists(self) -> None:
        from quant_core.api import QuantApiHandler

        class Handler(QuantApiHandler):
            stage6_exit_acceptance_report_path = self.root / "data/missing-stage6-exit.json"

        server = HTTPServer(("127.0.0.1", 0), Handler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        connection = HTTPConnection(*server.server_address, timeout=5)
        try:
            connection.request("GET", "/api/stage6/exit-acceptance/latest")
            response = connection.getresponse()
            payload = json.loads(response.read())
        finally:
            connection.close()
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()
        self.assertEqual(response.status, 200)
        self.assertEqual(payload["acceptance"]["status"], "missing")
        self.assertTrue(payload["acceptance"]["liveBlockedBoundary"])


if __name__ == "__main__":
    unittest.main()
