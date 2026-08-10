from __future__ import annotations

import json
import tempfile
import unittest
from datetime import datetime, timezone
from http.client import HTTPConnection
from http.server import HTTPServer
from pathlib import Path
from threading import Thread

from quant_core.api import QuantApiHandler
from quant_core.audit_events import AuditEventStore
from quant_core.runs import research_run_import_audit_events


class StrategyResearchAuditEventProtectionTests(unittest.TestCase):
    def test_legacy_stage5_probe_import_requires_v1_identity_and_run_binding(self) -> None:
        legacy = self._event(
            "probe-execution-legacy-1",
            "execution_adapter_sandbox_probe_execution",
        )
        legacy.update(
            stage="execution-adapter-sandbox-probe-execution",
            source="execution-adapter-ledger",
            metadata={
                "sandboxProbeExecutionId": "probe-execution-legacy-1",
                "paperOnly": True,
                "liveTradingAllowed": False,
            },
        )

        imported = research_run_import_audit_events(
            {"export": {"auditEvents": [legacy]}},
            run_id="run-strategy-research-protection",
        )

        self.assertTrue(imported[0]["metadata"]["detached"])
        for field, value in (
            ("eventType", "attacker_controlled_event"),
            ("runId", ""),
        ):
            with self.subTest(field=field):
                forged = {**legacy, field: value}
                with self.assertRaisesRegex(
                    ValueError,
                    "production_authority_audit_event_import_forbidden",
                ):
                    research_run_import_audit_events(
                        {"export": {"auditEvents": [forged]}},
                    )

        forged_identity = {
            **legacy,
            "metadata": {
                **legacy["metadata"],
                "sandboxProbeExecutionId": "probe-execution-forged",
            },
        }
        with self.assertRaisesRegex(
            ValueError,
            "production_authority_audit_event_import_forbidden",
        ):
            research_run_import_audit_events(
                {"export": {"auditEvents": [forged_identity]}},
                run_id="run-strategy-research-protection",
            )

    def test_research_package_cannot_preoccupy_strategy_research_audit_namespace(self) -> None:
        protected = (
            self._event("attacker-type-only", "strategy_research_proposal"),
            self._event(
                "strategy-research-proposal-0123456789abcdef01234567",
                "attacker_controlled_event",
            ),
            self._event(
                "strategy-research-launch-experiment-0123456789abcdef01234567",
                "attacker_controlled_event",
            ),
            self._event(
                "strategy-research-proposal-0123456789abcdef01234567",
                "execution_adapter_sandbox_probe_execution",
            ),
        )

        for event in protected:
            with self.subTest(event_type=event["eventType"], event_id=event["eventId"]):
                with self.assertRaisesRegex(
                    ValueError,
                    "production_authority_audit_event_import_forbidden",
                ):
                    research_run_import_audit_events(
                        {"export": {"auditEvents": [event]}},
                        run_id="run-strategy-research-protection",
                    )

    def test_generic_post_cannot_create_preoccupy_or_overwrite_research_events(self) -> None:
        protected = (
            (
                "strategy_research_proposal",
                "strategy-research-proposal-0123456789abcdef01234567",
            ),
            (
                "strategy_research_launch",
                "strategy-research-launch-experiment-0123456789abcdef01234567",
            ),
        )
        with tempfile.TemporaryDirectory() as directory:
            audit_store = AuditEventStore(Path(directory) / "audit.sqlite")

            class TestHandler(QuantApiHandler):
                def log_message(self, format, *args):
                    del format, args

            TestHandler.audit_event_store = audit_store
            server = HTTPServer(("127.0.0.1", 0), TestHandler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                for event_type, event_id in protected:
                    with self.subTest(event_type=event_type, attack="create"):
                        create_id = f"attacker-create-{event_type}"
                        status, _payload = self._post(
                            server,
                            self._event(create_id, event_type),
                        )
                        self.assertEqual(status, 400)
                        self.assertIsNone(audit_store.get(create_id))

                    with self.subTest(event_type=event_type, attack="preoccupy"):
                        status, _payload = self._post(
                            server,
                            self._event(event_id, "attacker_controlled_event"),
                        )
                        self.assertEqual(status, 400)
                        self.assertIsNone(audit_store.get(event_id))

                    legitimate = self._event(event_id, event_type)
                    audit_store.record(legitimate)
                    with self.subTest(event_type=event_type, attack="overwrite"):
                        status, _payload = self._post(
                            server,
                            {
                                **self._event(event_id, "attacker_controlled_event"),
                                "summary": "attacker overwrite",
                            },
                        )
                        self.assertEqual(status, 400)
                        stored = audit_store.get(event_id)
                        self.assertIsNotNone(stored)
                        self.assertEqual(stored.event_type, event_type)
                        self.assertEqual(stored.summary, legitimate["summary"])
            finally:
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

    @staticmethod
    def _event(event_id: str, event_type: str) -> dict[str, object]:
        return {
            "schemaVersion": 1,
            "eventId": event_id,
            "eventType": event_type,
            "runId": "run-strategy-research-protection",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "stage": "strategy-research",
            "source": "test",
            "summary": "legitimate research event",
            "detail": "generic audit writes must not control this event identity",
            "metadata": {},
        }

    @staticmethod
    def _post(server: HTTPServer, payload: dict[str, object]):
        connection = HTTPConnection(
            server.server_address[0],
            server.server_address[1],
            timeout=5,
        )
        try:
            connection.request(
                "POST",
                "/api/audit/events",
                body=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )
            response = connection.getresponse()
            return response.status, json.loads(response.read().decode("utf-8"))
        finally:
            connection.close()


if __name__ == "__main__":
    unittest.main()
