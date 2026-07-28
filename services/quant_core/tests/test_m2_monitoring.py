from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timedelta, timezone
from http.client import HTTPConnection
from http.server import HTTPServer
from pathlib import Path
import json
import tempfile
from threading import Thread
import time
import unittest
from unittest.mock import patch

from quant_core.audit_events import AuditEventStore
from quant_core.api import QuantApiHandler
from quant_core.monitoring import (
    MonitoringRunner,
    MonitoringService,
    build_webhook_notifier,
    next_eligible_run,
)


def auto_state(**overrides):
    now = datetime(2026, 7, 28, 8, tzinfo=timezone.utc)
    state = {
        "enabled": True,
        "executionMode": "testnet",
        "market": "crypto",
        "symbol": "BTC/USDT",
        "timeframe": "1m",
        "runnerState": "running",
        "runnerIntervalSeconds": 35,
        "runnerCycleCount": 10,
        "consecutiveRunnerFailures": 0,
        "lastRunnerCycleAt": now.isoformat(),
        "lastRunnerSuccessAt": now.isoformat(),
        "lastRunnerErrorAt": None,
        "lastRunnerError": None,
        "status": "monitoring",
        "detail": "自动交易后台运行正常。",
        "lastTestnetOrder": None,
        "lastLiveOrder": None,
    }
    state.update(overrides)
    return {"state": state}


class M2MonitoringTests(unittest.TestCase):
    def test_incident_notification_is_deduplicated_and_recovery_is_sent_once(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            sent = []
            service = MonitoringService(
                store,
                notifier=sent.append,
                channel={"configured": True, "status": "ready"},
            )
            started = datetime(2026, 7, 28, 8, tzinfo=timezone.utc)
            blocked = auto_state(
                status="account_mismatch",
                detail="quote balance does not cover the next order",
            )

            with patch(
                "quant_core.monitoring._now",
                return_value=started,
            ):
                first = service.evaluate(blocked)
                service.evaluate(blocked)

            self.assertEqual(len(sent), 1)
            self.assertEqual(
                sent[0]["incidentKey"],
                "auto-trading:account_mismatch",
            )
            self.assertEqual(sent[0]["lifecycle"], "active")
            self.assertEqual(len(first["activeIncidents"]), 1)

            recovered = auto_state(
                lastRunnerCycleAt=(started + timedelta(seconds=30)).isoformat(),
                lastRunnerSuccessAt=(started + timedelta(seconds=30)).isoformat(),
            )
            with patch(
                "quant_core.monitoring._now",
                return_value=started + timedelta(seconds=30),
            ):
                service.evaluate(recovered)
                final = service.evaluate(recovered)

            self.assertEqual(len(sent), 2)
            self.assertEqual(sent[1]["lifecycle"], "recovered")
            self.assertEqual(final["activeIncidents"], [])
            self.assertEqual(
                final["incidents"][0]["status"],
                "resolved",
            )
            self.assertEqual(len(final["notifications"]), 2)

    def test_resolved_incident_can_open_again_as_a_new_occurrence(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            sent = []
            started = datetime(2026, 7, 28, 8, tzinfo=timezone.utc)
            service = MonitoringService(
                store,
                notifier=sent.append,
                channel={"configured": True, "status": "ready"},
            )

            with patch(
                "quant_core.monitoring._now",
                return_value=started,
            ):
                service.evaluate(auto_state(status="data_blocked"))
            with patch(
                "quant_core.monitoring._now",
                return_value=started + timedelta(minutes=1),
            ):
                service.evaluate(auto_state(
                    lastRunnerCycleAt=(
                        started + timedelta(minutes=1)
                    ).isoformat(),
                ))

            restarted = MonitoringService(
                store,
                notifier=sent.append,
                channel={"configured": True, "status": "ready"},
            )
            with patch(
                "quant_core.monitoring._now",
                return_value=started + timedelta(minutes=2),
            ):
                snapshot = restarted.evaluate(auto_state(
                    status="data_blocked",
                    lastRunnerCycleAt=(
                        started + timedelta(minutes=2)
                    ).isoformat(),
                ))

            self.assertEqual([item["lifecycle"] for item in sent], [
                "active",
                "recovered",
                "active",
            ])
            self.assertEqual(
                snapshot["activeIncidents"][0]["occurrenceCount"],
                2,
            )
            self.assertEqual(len({
                item["dedupeKey"] for item in sent
            }), 3)

    def test_active_incident_stays_deduplicated_after_service_restart(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            sent = []
            MonitoringService(
                store,
                notifier=sent.append,
                channel={"configured": True, "status": "ready"},
            ).evaluate(auto_state(status="order_rejected"))

            MonitoringService(
                store,
                notifier=sent.append,
                channel={"configured": True, "status": "ready"},
            ).evaluate(auto_state(status="order_rejected"))

            self.assertEqual(len(sent), 1)
            self.assertEqual(
                sent[0]["incidentKey"],
                "auto-trading:order_rejected",
            )

    def test_server_incidents_cover_pending_orders_runtime_and_permission_blockers(self):
        cases = [
            (
                auto_state(
                    status="order_pending",
                    lastTestnetOrder={"state": "reconciliation_required"},
                ),
                "auto-trading:pending-order",
            ),
            (
                auto_state(
                    lastRunnerCycleAt="2026-07-28T07:55:00+00:00",
                ),
                "auto-trading:heartbeat_stale",
            ),
            (
                auto_state(runnerState="stopped"),
                "auto-trading:runner_stopped",
            ),
            (
                auto_state(
                    status="risk_paused",
                    detail="production permission drift",
                ),
                "auto-trading:risk_paused",
            ),
        ]
        observed_at = datetime(2026, 7, 28, 8, tzinfo=timezone.utc)

        for index, (snapshot, expected_key) in enumerate(cases):
            with self.subTest(expected_key=expected_key):
                with tempfile.TemporaryDirectory() as directory:
                    store = AuditEventStore(
                        Path(directory) / f"audit-{index}.sqlite"
                    )
                    service = MonitoringService(store)
                    with patch(
                        "quant_core.monitoring._now",
                        return_value=observed_at,
                    ):
                        result = service.evaluate(snapshot)
                    self.assertIn(
                        expected_key,
                        {
                            item["incidentKey"]
                            for item in result["activeIncidents"]
                        },
                    )

    def test_notification_failure_does_not_change_trading_state_or_incident_audit(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")

            def fail(_payload):
                raise RuntimeError("webhook unavailable")

            service = MonitoringService(
                store,
                notifier=fail,
                channel={"configured": True, "status": "ready"},
            )
            snapshot = auto_state(
                status="risk_paused",
                detail="production permission drift",
            )
            original = deepcopy(snapshot)

            result = service.evaluate(snapshot)

            self.assertEqual(snapshot, original)
            self.assertEqual(len(result["activeIncidents"]), 1)
            self.assertEqual(
                result["notifications"][0]["metadata"]["deliveryStatus"],
                "failed",
            )
            self.assertEqual(
                result["job"]["deliveryFailureCount"],
                1,
            )
            self.assertFalse(result["tradingActionsAvailable"])

    def test_runner_persists_job_and_observed_state_without_a_browser(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = MonitoringService(store)
            runner = MonitoringRunner(
                service,
                auto_state,
                interval_seconds=0.01,
            )

            runner.start()
            try:
                deadline = time.monotonic() + 0.5
                while time.monotonic() < deadline:
                    if service.snapshot()["job"]["cycleCount"] >= 1:
                        break
                    time.sleep(0.01)
                else:
                    self.fail("monitoring runner did not record a cycle")
            finally:
                runner.stop()

            restored = MonitoringService(store).snapshot()
            self.assertGreaterEqual(restored["job"]["cycleCount"], 1)
            self.assertIsNotNone(restored["job"]["lastCycleAt"])
            self.assertIsNotNone(restored["job"]["lastSuccessAt"])
            self.assertIsNotNone(restored["job"]["nextEligibleRunAt"])
            self.assertEqual(
                restored["observedJobs"][0]["jobId"],
                "auto-trading:crypto:BTC-USDT:1m",
            )
            self.assertEqual(
                restored["observedJobs"][0]["scheduleKind"],
                "continuous",
            )

    def test_monitoring_job_persists_last_error_and_recovers_consecutive_failures(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = MonitoringService(store)
            service.record_runner_state("running", 35)
            failed = service.record_cycle("temporary monitoring failure")

            self.assertEqual(failed["consecutiveFailures"], 1)
            self.assertEqual(
                failed["lastError"],
                "temporary monitoring failure",
            )
            self.assertIsNotNone(failed["nextEligibleRunAt"])

            recovered = MonitoringService(store).record_cycle()
            restored = MonitoringService(store).snapshot()["job"]

            self.assertEqual(recovered["consecutiveFailures"], 0)
            self.assertIsNotNone(recovered["lastSuccessAt"])
            self.assertEqual(
                restored["lastError"],
                "temporary monitoring failure",
            )

    def test_schedule_uses_continuous_crypto_and_existing_ashare_calendar(self):
        now = datetime(2026, 7, 27, 1, tzinfo=timezone.utc)

        crypto = next_eligible_run(
            "crypto",
            now,
            interval_seconds=35,
        )
        ashare = next_eligible_run(
            "ashare",
            now,
            interval_seconds=35,
        )

        self.assertEqual(crypto["scheduleKind"], "continuous")
        self.assertEqual(
            crypto["nextEligibleRunAt"],
            (now + timedelta(seconds=35)).isoformat(),
        )
        self.assertEqual(ashare["scheduleKind"], "market_calendar")
        self.assertEqual(
            datetime.fromisoformat(ashare["nextEligibleRunAt"]),
            datetime.fromisoformat("2026-07-27T09:30:00+08:00"),
        )

    def test_webhook_notifier_posts_redacted_event_payload_without_exposing_url(self):
        calls = []

        class Response:
            status = 204

            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return None

        def fake_urlopen(request, *, timeout):
            calls.append((request, timeout))
            return Response()

        notifier, channel = build_webhook_notifier({
            "AIQT_MONITORING_WEBHOOK_URL": "https://hooks.example.test/secret",
            "AIQT_MONITORING_WEBHOOK_TIMEOUT_SECONDS": "7",
        })

        with patch(
            "quant_core.monitoring.urlopen",
            side_effect=fake_urlopen,
        ):
            assert notifier is not None
            notifier({
                "schemaVersion": 1,
                "incidentKey": "auto-trading:data_blocked",
                "lifecycle": "active",
            })

        request, timeout = calls[0]
        self.assertEqual(timeout, 7)
        self.assertEqual(request.method, "POST")
        self.assertEqual(
            json.loads(request.data),
            {
                "schemaVersion": 1,
                "incidentKey": "auto-trading:data_blocked",
                "lifecycle": "active",
            },
        )
        self.assertEqual(channel, {
            "type": "webhook",
            "configured": True,
            "status": "ready",
            "configurationError": None,
        })
        self.assertNotIn("url", channel)
        with patch(
            "quant_core.monitoring.urlopen",
            side_effect=RuntimeError(
                "failed to reach https://hooks.example.test/secret"
            ),
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                "^monitoring_webhook_request_failed:RuntimeError$",
            ) as raised:
                notifier({
                    "schemaVersion": 1,
                    "incidentKey": "auto-trading:data_blocked",
                    "lifecycle": "active",
                })
        self.assertNotIn("hooks.example", str(raised.exception))

    def test_invalid_webhook_configuration_fails_closed(self):
        notifier, channel = build_webhook_notifier({
            "AIQT_MONITORING_WEBHOOK_URL": "file:///tmp/notify",
        })

        self.assertIsNone(notifier)
        self.assertFalse(channel["configured"])
        self.assertEqual(channel["status"], "invalid")

    def test_read_only_monitoring_api_returns_persisted_job_and_incidents(self):
        with tempfile.TemporaryDirectory() as directory:
            store = AuditEventStore(Path(directory) / "audit.sqlite")
            service = MonitoringService(store)
            service.record_runner_state("running", 35)
            service.evaluate(auto_state(status="data_blocked"))
            service.record_cycle()

            class Handler(QuantApiHandler):
                audit_event_store = store
                monitoring_environ = {}

            server = HTTPServer(("127.0.0.1", 0), Handler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=5)
            try:
                connection.request("GET", "/api/operations/monitoring")
                response = connection.getresponse()
                payload = json.loads(response.read())
            finally:
                connection.close()
                server.shutdown()
                server.server_close()
                thread.join(timeout=5)

            self.assertEqual(response.status, 200)
            self.assertEqual(payload["schemaVersion"], 1)
            self.assertEqual(payload["status"], "attention")
            self.assertEqual(payload["job"]["jobId"], "server-monitoring")
            self.assertEqual(
                payload["observedJobs"][0]["jobId"],
                "auto-trading:crypto:BTC-USDT:1m",
            )
            self.assertEqual(
                payload["activeIncidents"][0]["incidentKey"],
                "auto-trading:data_blocked",
            )
            self.assertFalse(payload["tradingActionsAvailable"])


if __name__ == "__main__":
    unittest.main()
