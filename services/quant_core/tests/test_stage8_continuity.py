from __future__ import annotations

from datetime import datetime, timedelta, timezone
from http.client import HTTPConnection
from http.server import HTTPServer
import json
from pathlib import Path
import tempfile
from threading import Thread
import unittest
from unittest.mock import patch

from quant_core.api import QuantApiHandler
from quant_core.audit_events import AuditEventStore
from quant_core.execution_adapter_health import production_readonly_probe_to_evidence, probe_ccxt_production_readonly
from quant_core.stage8_continuity import (
    build_production_readonly_access_control,
    build_production_readonly_continuity,
    validate_production_readonly_access_control,
    validate_production_readonly_continuity,
)


class _Exchange:
    def __init__(self, _config, *, unsafe: bool = False):
        self.unsafe = unsafe

    def load_markets(self):
        return {"BTC/USDT": {}}

    def sapi_get_account_apirestrictions(self):
        return {
            "enableReading": True,
            "enableSpotAndMarginTrading": self.unsafe,
            "enableMargin": False,
            "enableFutures": False,
            "enableVanillaOptions": False,
            "enableWithdrawals": False,
            "enableInternalTransfer": False,
            "permitsUniversalTransfer": False,
        }

    def fetch_balance(self, _params):
        return {"total": {}, "info": {"accountType": "SPOT"}}


def _probe(generated_at: datetime, *, unsafe: bool = False):
    probe = probe_ccxt_production_readonly(
        adapter_id="ccxt-live",
        exchange_id="binance",
        environ={
            "CCXT_PRODUCTION_READONLY_API_KEY": "key",
            "CCXT_PRODUCTION_READONLY_SECRET": "secret",
        },
        exchange_factory=lambda _exchange_id, config: _Exchange(config, unsafe=unsafe),
        generated_at=generated_at,
    )
    return production_readonly_probe_to_evidence(
        probe,
        stage6_exit_hash="a" * 64,
        production_route_review_id="route-review-1",
        operator="operator",
        eligibility_confirmed=True,
    )


class Stage8ContinuityTests(unittest.TestCase):
    def test_continuity_classifies_current_stale_blocked_and_revoked(self):
        now = datetime(2026, 7, 13, 12, 0, tzinfo=timezone.utc)
        ready = _probe(now - timedelta(hours=1))
        current = build_production_readonly_continuity(
            latest_probe=ready,
            access_control=None,
            stage6_hash_matches=True,
            route_review_current=True,
            route_review_recorded_at=(now - timedelta(hours=2)).isoformat(),
            generated_at=now,
        )
        stale = build_production_readonly_continuity(
            latest_probe=ready,
            access_control=None,
            stage6_hash_matches=True,
            route_review_current=False,
            route_review_recorded_at=(now - timedelta(hours=25)).isoformat(),
            generated_at=now,
        )
        blocked = build_production_readonly_continuity(
            latest_probe=_probe(now, unsafe=True),
            access_control=None,
            stage6_hash_matches=True,
            route_review_current=True,
            route_review_recorded_at=now.isoformat(),
            generated_at=now,
        )
        revoked_control = build_production_readonly_access_control(
            action="revoke", operator="operator", reason="incident", recorded_at=now
        )
        revoked = build_production_readonly_continuity(
            latest_probe=ready,
            access_control=revoked_control,
            stage6_hash_matches=True,
            route_review_current=True,
            route_review_recorded_at=now.isoformat(),
            generated_at=now,
        )

        self.assertEqual(current["status"], "current")
        self.assertEqual(stale["status"], "stale")
        self.assertEqual(blocked["status"], "blocked")
        self.assertTrue(blocked["permissionDrift"])
        self.assertEqual(revoked["status"], "revoked")
        self.assertEqual(validate_production_readonly_continuity(current), current)
        with self.assertRaisesRegex(ValueError, "continuity_hash_invalid"):
            validate_production_readonly_continuity({**current, "continuityHash": "0" * 64})
        with self.assertRaisesRegex(ValueError, "access_control_hash_invalid"):
            validate_production_readonly_access_control({**revoked_control, "reason": "tampered"})

    def test_api_persists_revoke_and_blocks_stage7_before_network(self):
        factory_called = False

        def forbidden_factory(_exchange_id, _config):
            nonlocal factory_called
            factory_called = True
            raise AssertionError("production network must remain blocked")

        class Handler(QuantApiHandler):
            execution_adapter_health_exchange_factory = forbidden_factory
            execution_adapter_health_environ = {
                "CCXT_PRODUCTION_READONLY_API_KEY": "configured",
                "CCXT_PRODUCTION_READONLY_SECRET": "configured",
            }

        with tempfile.TemporaryDirectory() as tmp:
            Handler.audit_event_store = AuditEventStore(Path(tmp) / "audit.sqlite")
            Handler.stage6_exit_acceptance_report_path = Path(tmp) / "missing-stage6.json"
            server = HTTPServer(("127.0.0.1", 0), Handler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
            try:
                missing_status, missing = self._request(
                    connection, "GET", "/api/execution/stage8/production-readonly-continuity"
                )
                revoke_status, revoked = self._request(
                    connection,
                    "POST",
                    "/api/execution/stage8/production-readonly-access-controls",
                    {"action": "revoke", "operator": "operator", "reason": "incident", "productionRouteReviewId": None},
                )
                repeat_status, repeated = self._request(
                    connection,
                    "POST",
                    "/api/execution/stage8/production-readonly-access-controls",
                    {"action": "revoke", "operator": "operator", "reason": "incident", "productionRouteReviewId": None},
                )
                changed_status, changed = self._request(
                    connection,
                    "POST",
                    "/api/execution/stage8/production-readonly-access-controls",
                    {"action": "revoke", "operator": "operator", "reason": "second incident", "productionRouteReviewId": None},
                )
                stage7_status, stage7 = self._request(
                    connection,
                    "POST",
                    "/api/execution/stage7/production-readonly-probes",
                    {"productionRouteReviewId": "missing", "operator": "operator", "eligibilityConfirmed": True},
                )
                restore_status, restore = self._request(
                    connection,
                    "POST",
                    "/api/execution/stage8/production-readonly-access-controls",
                    {"action": "restore", "operator": "operator", "reason": "recovered", "productionRouteReviewId": "missing"},
                )
                readback_status, readback = self._request(
                    connection, "GET", "/api/execution/stage8/production-readonly-continuity"
                )
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        first_control = revoked["productionReadonlyAccessControl"]
        control = changed["productionReadonlyAccessControl"]
        self.assertEqual((missing_status, missing["productionReadonlyContinuity"]["status"]), (200, "missing"))
        self.assertEqual(revoke_status, 201)
        self.assertEqual(repeat_status, 200)
        self.assertEqual(repeated["productionReadonlyAccessControl"]["controlHash"], first_control["controlHash"])
        self.assertEqual(changed_status, 201)
        self.assertEqual(control["previousControlId"], first_control["controlId"])
        self.assertEqual(stage7_status, 409)
        self.assertEqual(stage7["blockers"], ["stage8_production_readonly_access_revoked"])
        self.assertEqual(restore_status, 409)
        self.assertIn("current ccxt-live production route review", restore["blockers"][0])
        self.assertEqual(readback_status, 200)
        self.assertEqual(readback["productionReadonlyContinuity"]["accessControl"]["controlHash"], control["controlHash"])
        self.assertFalse(factory_called)

    def test_restore_requires_current_route_review_and_links_previous_control(self):
        class Handler(QuantApiHandler):
            pass

        current_review = {
            "status": "route_review_recorded",
            "adapterId": "ccxt-live",
            "market": "crypto",
            "route": "live",
            "maintenanceWindowId": "window-1",
            "recordedAt": datetime.now(timezone.utc).isoformat(),
        }
        with tempfile.TemporaryDirectory() as tmp:
            Handler.audit_event_store = AuditEventStore(Path(tmp) / "audit.sqlite")
            Handler.stage6_exit_acceptance_report_path = Path(tmp) / "missing-stage6.json"
            Handler.audit_event_store.record({
                "schemaVersion": 1,
                "eventId": "route-review-1",
                "eventType": "execution_adapter_production_route_review",
                "runId": "",
                "createdAt": current_review["recordedAt"],
                "stage": "execution-adapter-production-route-review",
                "source": "operator",
                "summary": "recorded",
                "detail": "recorded",
                "metadata": {},
            })
            server = HTTPServer(("127.0.0.1", 0), Handler)
            thread = Thread(target=server.serve_forever, daemon=True)
            with patch(
                "quant_core.api.execution_adapter_production_route_review_payload_from_audit_event",
                return_value=current_review,
            ):
                thread.start()
                connection = HTTPConnection(server.server_address[0], server.server_address[1], timeout=5)
                try:
                    _, revoked = self._request(
                        connection,
                        "POST",
                        "/api/execution/stage8/production-readonly-access-controls",
                        {"action": "revoke", "operator": "operator", "reason": "incident", "productionRouteReviewId": None},
                    )
                    status, restored = self._request(
                        connection,
                        "POST",
                        "/api/execution/stage8/production-readonly-access-controls",
                        {"action": "restore", "operator": "operator", "reason": "recovered", "productionRouteReviewId": "route-review-1"},
                    )
                finally:
                    connection.close()
                    server.shutdown()
                    thread.join(timeout=5)
                    server.server_close()

        previous = revoked["productionReadonlyAccessControl"]
        control = restored["productionReadonlyAccessControl"]
        self.assertEqual(status, 201)
        self.assertEqual(control["status"], "active")
        self.assertEqual(control["previousControlId"], previous["controlId"])
        self.assertEqual(control["productionRouteReviewId"], "route-review-1")

    def test_acceptance_manifest_rejects_boundary_tampering(self):
        from tools.stage8_production_readonly_continuity_acceptance import _manifest, validate

        control = build_production_readonly_access_control(
            action="revoke", operator="operator", reason="acceptance"
        )
        continuity = build_production_readonly_continuity(
            latest_probe=None,
            access_control=control,
            stage6_hash_matches=False,
            route_review_current=False,
            route_review_recorded_at=None,
        )
        initial = build_production_readonly_continuity(
            latest_probe=None,
            access_control=None,
            stage6_hash_matches=False,
            route_review_current=False,
            route_review_recorded_at=None,
        )
        manifest = _manifest({
            "initialStatus": 200,
            "initialContinuity": initial,
            "revokeStatus": 201,
            "control": control,
            "revokedContinuity": continuity,
            "stage7Status": 409,
            "stage7Blockers": ["stage8_production_readonly_access_revoked"],
            "restoreStatus": 409,
        }, {"status": 200, "continuity": continuity})

        self.assertIn("accepted", validate(manifest))
        self.assertEqual(_manifest({
            "initialStatus": 200,
            "initialContinuity": continuity,
            "revokeStatus": 201,
            "control": control,
            "revokedContinuity": continuity,
            "stage7Status": 409,
            "stage7Blockers": ["stage8_production_readonly_access_revoked"],
            "restoreStatus": 409,
        }, {"status": 200, "continuity": continuity})["status"], "blocked")
        with self.assertRaisesRegex(ValueError, "liveTradingAllowed is immutable"):
            validate({**manifest, "liveTradingAllowed": True})

    def test_real_recovery_manifest_rebuilds_existing_stage7_and_stage8_evidence(self):
        from tools.stage8_production_readonly_continuity_acceptance import _hash, _real_manifest, validate

        now = datetime(2026, 7, 13, 12, 0, tzinfo=timezone.utc)
        initial_probe = _probe(now - timedelta(hours=1))
        recovery_probe = _probe(now)
        initial = build_production_readonly_continuity(
            latest_probe=initial_probe,
            access_control=None,
            stage6_hash_matches=True,
            route_review_current=True,
            route_review_recorded_at=now.isoformat(),
            generated_at=now,
        )
        revoke = build_production_readonly_access_control(
            action="revoke", operator="operator", reason="recovery drill", recorded_at=now
        )
        restore = build_production_readonly_access_control(
            action="restore",
            operator="operator",
            reason="recovered",
            previous_control_id=revoke["controlId"],
            production_route_review_id="route-review-1",
            recorded_at=now,
        )
        recovered = build_production_readonly_continuity(
            latest_probe=recovery_probe,
            access_control=restore,
            stage6_hash_matches=True,
            route_review_current=True,
            route_review_recorded_at=now.isoformat(),
            generated_at=now,
        )
        manifest = _real_manifest({
            "initialStatus": 200,
            "initialContinuity": initial,
            "revokeStatus": 201,
            "revokeControl": revoke,
            "blockedProbeStatus": 409,
            "blockedProbeReasons": ["stage8_production_readonly_access_revoked"],
            "restoreStatus": 201,
            "restoreControl": restore,
            "recoveryProbeStatus": 201,
            "recoveryProbe": recovery_probe,
            "continuityStatus": 200,
            "recoveredContinuity": recovered,
        }, {"status": 200, "continuity": recovered, "probe": recovery_probe})

        self.assertIn("recovery=accepted", validate(manifest))
        tampered = {
            **manifest,
            "apiPermissions": {**manifest["apiPermissions"], "spotTradingEnabled": True},
        }
        tampered["manifestHash"] = _hash({
            key: value for key, value in tampered.items() if key != "manifestHash"
        })
        with self.assertRaisesRegex(ValueError, "permissions are invalid"):
            validate(tampered)
        wrong_chain = {**manifest, "restorePreviousControlId": manifest["restoreControlId"]}
        wrong_chain["manifestHash"] = _hash({
            key: value for key, value in wrong_chain.items() if key != "manifestHash"
        })
        with self.assertRaisesRegex(ValueError, "source chain is invalid"):
            validate(wrong_chain)

    def test_real_recovery_rejects_route_drift_before_revoke(self):
        from tools.stage8_production_readonly_continuity_acceptance import _container_real_recovery

        with tempfile.TemporaryDirectory() as tmp:
            request = Path(tmp) / "request.json"
            request.write_text(json.dumps({
                "productionRouteReviewId": "route-review-2",
                "operator": "operator",
                "eligibilityConfirmed": True,
            }))
            with patch(
                "tools.stage8_production_readonly_continuity_acceptance._api",
                return_value=(200, {"productionReadonlyContinuity": {
                    "status": "current",
                    "latestProbe": {"productionRouteReviewId": "route-review-1"},
                }}),
            ) as api:
                with self.assertRaisesRegex(RuntimeError, "must match the current probe route review"):
                    _container_real_recovery(request)

        self.assertEqual(api.call_count, 1)

    def test_real_recovery_re_revokes_when_post_restore_probe_fails(self):
        from tools.stage8_production_readonly_continuity_acceptance import _container_real_recovery

        with tempfile.TemporaryDirectory() as tmp:
            request = Path(tmp) / "request.json"
            request.write_text(json.dumps({
                "productionRouteReviewId": "route-review-1",
                "operator": "operator",
                "eligibilityConfirmed": True,
            }))
            responses = [
                (200, {"productionReadonlyContinuity": {
                    "status": "current",
                    "latestProbe": {"productionRouteReviewId": "route-review-1"},
                }}),
                (201, {"productionReadonlyAccessControl": {"status": "revoked"}}),
                (409, {"blockers": ["stage8_production_readonly_access_revoked"]}),
                (201, {"productionReadonlyAccessControl": {"status": "active"}}),
                (409, {"blockers": ["production_readonly_permissions_unsafe"]}),
                (200, {"productionReadonlyContinuity": {"status": "blocked"}}),
                (201, {"productionReadonlyAccessControl": {"status": "revoked"}}),
            ]
            with patch(
                "tools.stage8_production_readonly_continuity_acceptance._api",
                side_effect=responses,
            ) as api:
                with self.assertRaisesRegex(RuntimeError, "probe was not ready"):
                    _container_real_recovery(request)

        self.assertEqual(api.call_args_list[-1].args[:2], (
            "POST", "/api/execution/stage8/production-readonly-access-controls"
        ))
        self.assertEqual(api.call_args_list[-1].args[2]["action"], "revoke")

    def test_real_recovery_re_revokes_when_restore_response_is_lost(self):
        from tools.stage8_production_readonly_continuity_acceptance import _container_real_recovery

        with tempfile.TemporaryDirectory() as tmp:
            request = Path(tmp) / "request.json"
            request.write_text(json.dumps({
                "productionRouteReviewId": "route-review-1",
                "operator": "operator",
                "eligibilityConfirmed": True,
            }))
            responses = [
                (200, {"productionReadonlyContinuity": {
                    "status": "current",
                    "latestProbe": {"productionRouteReviewId": "route-review-1"},
                }}),
                (201, {"productionReadonlyAccessControl": {"status": "revoked"}}),
                (409, {"blockers": ["stage8_production_readonly_access_revoked"]}),
                RuntimeError("restore response lost"),
                (201, {"productionReadonlyAccessControl": {"status": "revoked"}}),
            ]
            with patch(
                "tools.stage8_production_readonly_continuity_acceptance._api",
                side_effect=responses,
            ) as api:
                with self.assertRaisesRegex(RuntimeError, "restore response lost"):
                    _container_real_recovery(request)

        self.assertEqual(api.call_args_list[-1].args[2]["action"], "revoke")

    @staticmethod
    def _request(connection, method, path, payload=None):
        connection.request(
            method,
            path,
            body=json.dumps(payload) if payload is not None else None,
            headers={"Content-Type": "application/json"} if payload is not None else {},
        )
        response = connection.getresponse()
        return response.status, json.loads(response.read())


if __name__ == "__main__":
    unittest.main()
