from __future__ import annotations

import copy
from http.client import HTTPConnection
from http.server import HTTPServer
import json
from pathlib import Path
import sys
import tempfile
from threading import Thread
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.quant_core.tests import test_stage4_portfolio as stage4_tests
from services.quant_core.tests import test_quant_core as quant_core_tests
from quant_core.stage5_shadow import (
    build_stage5_shadow_session,
    stage5_shadow_session_hash,
    stage5_shadow_session_to_audit_event,
    validate_stage5_shadow_session,
)


def stage4_workflow(workflow_id: str = "stage4-workflow-1") -> dict:
    fixture = stage4_tests.Stage4PortfolioWorkflowSnapshotTest()
    fixture.setUp()
    for order, simulation in zip(fixture.batch["orders"], fixture.simulations, strict=True):
        order.update(
            side=simulation["side"],
            quantity=simulation["quantity"],
            notionalValue=simulation["notionalValue"],
        )
    return fixture.build(workflow_id=workflow_id)


class Stage5ShadowSessionTest(unittest.TestCase):
    def test_builds_stable_client_order_ids_and_reconciles_without_routing(self) -> None:
        workflow = stage4_workflow()
        first = build_stage5_shadow_session(workflow, generated_at="2026-07-11T10:00:00+00:00")
        second = build_stage5_shadow_session(workflow, generated_at="2026-07-11T10:01:00+00:00")

        self.assertEqual(first["status"], "reconciled")
        self.assertEqual(
            [order["clientOrderId"] for order in first["orders"]],
            [order["clientOrderId"] for order in second["orders"]],
        )
        self.assertEqual([order["state"] for order in first["orders"]], ["shadow_acknowledged"] * 2)
        self.assertTrue(first["killSwitch"]["enabled"])
        self.assertFalse(first["killSwitch"]["triggered"])
        self.assertTrue(first["shadowOnly"])
        self.assertFalse(first["orderSubmissionEnabled"])
        self.assertFalse(first["routeExecuted"])

    def test_timeout_recovers_on_second_attempt_with_same_idempotency_keys(self) -> None:
        workflow = stage4_workflow()
        first = build_stage5_shadow_session(
            workflow, failure_mode="timeout_once", attempt=1,
            generated_at="2026-07-11T10:00:00+00:00",
        )
        recovered = build_stage5_shadow_session(
            workflow, failure_mode="timeout_once", attempt=2,
            generated_at="2026-07-11T10:01:00+00:00",
        )

        self.assertEqual(first["status"], "recoverable_failure")
        self.assertEqual(recovered["status"], "reconciled")
        self.assertEqual(first["sessionKey"], recovered["sessionKey"])
        self.assertEqual(
            [order["clientOrderId"] for order in first["orders"]],
            [order["clientOrderId"] for order in recovered["orders"]],
        )

    def test_failure_injection_fails_closed_and_tampering_is_rejected(self) -> None:
        for failure_mode in ("adapter_rejected", "reconciliation_mismatch", "kill_switch"):
            with self.subTest(failure_mode=failure_mode):
                session = build_stage5_shadow_session(stage4_workflow(), failure_mode=failure_mode)
                self.assertEqual(session["status"], "blocked")
                self.assertFalse(session["reconciliation"]["reconciled"])

        session = build_stage5_shadow_session(stage4_workflow())
        for field, value in (
            ("liveTradingAllowed", True),
            ("orderSubmissionEnabled", True),
            ("routeExecuted", True),
            ("shadowOnly", False),
        ):
            with self.subTest(field=field):
                tampered = copy.deepcopy(session)
                tampered[field] = value
                tampered["sessionHash"] = stage5_shadow_session_hash(tampered)
                with self.assertRaises(ValueError):
                    validate_stage5_shadow_session(tampered)
        for mutate in (
            lambda value: value["orders"][0]["transitions"].append(
                {"state": "live_submitted", "at": value["generatedAt"]}
            ),
            lambda value: value["reconciliation"].update({"grossNotional": 1}),
            lambda value: value["killSwitch"].update({"triggered": True}),
        ):
            with self.subTest(mutate=mutate):
                tampered = copy.deepcopy(session)
                mutate(tampered)
                tampered["sessionHash"] = stage5_shadow_session_hash(tampered)
                with self.assertRaises(ValueError):
                    validate_stage5_shadow_session(tampered)

    def test_all_failure_modes_have_exact_fail_closed_states(self) -> None:
        expected = {
            "none": ("reconciled", ["shadow_acknowledged"] * 2, "shadow_projection_matches_stage4", False),
            "timeout_once": ("recoverable_failure", ["timeout", "not_attempted"], "shadow_timeout_retry_required", False),
            "adapter_rejected": ("blocked", ["rejected"] * 2, "shadow_orders_blocked", False),
            "reconciliation_mismatch": (
                "blocked", ["shadow_acknowledged"] * 2, "shadow_reconciliation_mismatch", False,
            ),
            "kill_switch": ("blocked", ["blocked"] * 2, "shadow_orders_blocked", True),
        }
        for index, (failure_mode, (status, states, reason, triggered)) in enumerate(expected.items()):
            with self.subTest(failure_mode=failure_mode):
                session = build_stage5_shadow_session(
                    stage4_workflow(f"stage4-workflow-{index}"), failure_mode=failure_mode,
                )
                self.assertEqual(session["status"], status)
                self.assertEqual([order["state"] for order in session["orders"]], states)
                self.assertEqual(session["reconciliation"]["reason"], reason)
                self.assertIs(session["killSwitch"]["triggered"], triggered)
    def test_api_is_idempotent_and_recovers_timeout_from_audit_store(self) -> None:
        from quant_core.api import QuantApiHandler, _stage5_shadow_sessions
        from quant_core.audit_events import AuditEventStore

        workflow = stage4_workflow()
        blocked_workflow = stage4_workflow("stage4-workflow-blocked")
        with tempfile.TemporaryDirectory() as tmp:
            store = AuditEventStore(Path(tmp) / "audit.sqlite")
            store.record(
                {
                    "schemaVersion": 1,
                    "eventId": workflow["workflowId"],
                    "eventType": "stage4_portfolio_workflow",
                    "runId": workflow["baseRunId"],
                    "createdAt": workflow["generatedAt"],
                    "stage": "stage4-portfolio-workflow",
                    "source": "test",
                    "summary": "Stage 4 source.",
                    "detail": "Authoritative source.",
                    "metadata": {"snapshot": workflow},
                }
            )
            store.record(
                {
                    "schemaVersion": 1,
                    "eventId": blocked_workflow["workflowId"],
                    "eventType": "stage4_portfolio_workflow",
                    "runId": blocked_workflow["baseRunId"],
                    "createdAt": blocked_workflow["generatedAt"],
                    "stage": "stage4-portfolio-workflow",
                    "source": "test",
                    "summary": "Stage 4 blocked source.",
                    "detail": "Authoritative blocked source.",
                    "metadata": {"snapshot": blocked_workflow},
                }
            )

            class Handler(QuantApiHandler):
                audit_event_store = store

            server = HTTPServer(("127.0.0.1", 0), Handler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=5)
            request = {
                "baseRunId": workflow["baseRunId"],
                "workflowHash": workflow["workflowHash"],
                "failureMode": "timeout_once",
                "operator": "test-operator",
            }
            try:
                responses = []
                for _ in range(3):
                    body = json.dumps(request).encode()
                    connection.request(
                        "POST", "/api/execution/shadow-sessions", body=body,
                        headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                    )
                    response = connection.getresponse()
                    responses.append((response.status, json.loads(response.read())))
                connection.request(
                    "GET", f"/api/execution/shadow-sessions?baseRunId={workflow['baseRunId']}&limit=10"
                )
                response = connection.getresponse()
                listed = json.loads(response.read())["shadowSessions"]
                connection.request("GET", "/api/execution/shadow-sessions?limit=0")
                malformed = connection.getresponse()
                malformed_payload = json.loads(malformed.read())
                blocked_request = {
                    "baseRunId": blocked_workflow["baseRunId"],
                    "workflowHash": blocked_workflow["workflowHash"],
                    "failureMode": "adapter_rejected",
                    "operator": "test-operator",
                }
                blocked_responses = []
                for _ in range(2):
                    body = json.dumps(blocked_request).encode()
                    connection.request(
                        "POST", "/api/execution/shadow-sessions", body=body,
                        headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                    )
                    response = connection.getresponse()
                    blocked_responses.append((response.status, json.loads(response.read())))
                switched = {**blocked_request, "failureMode": "kill_switch"}
                body = json.dumps(switched).encode()
                connection.request(
                    "POST", "/api/execution/shadow-sessions", body=body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                )
                switched_response = connection.getresponse()
                switched_payload = json.loads(switched_response.read())
                stored_count = store.count(event_type="stage5_shadow_execution_session")
                tampered = copy.deepcopy(listed[0])
                tampered["orders"][0]["quantity"] += 1
                tampered["sessionHash"] = stage5_shadow_session_hash(tampered)
                store.record(stage5_shadow_session_to_audit_event(tampered, "tamper-test"))
                with self.assertRaisesRegex(ValueError, "does not match source workflow"):
                    _stage5_shadow_sessions(store, workflow["baseRunId"], workflow["workflowHash"])
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual([status for status, _ in responses], [201, 201, 200])
        self.assertEqual((malformed.status, malformed_payload["error"]), (400, "invalid_stage5_shadow_session_query"))
        self.assertEqual([payload["shadowSession"]["attempt"] for _, payload in responses], [1, 2, 2])
        self.assertEqual([session["attempt"] for session in listed], [2, 1])
        self.assertEqual([status for status, _ in blocked_responses], [201, 200])
        self.assertEqual(
            [payload["shadowSession"]["sessionHash"] for _, payload in blocked_responses],
            [blocked_responses[0][1]["shadowSession"]["sessionHash"]] * 2,
        )
        self.assertEqual((switched_response.status, switched_payload["error"]), (400, "invalid_stage5_shadow_session"))
        self.assertEqual(stored_count, 3)

    def test_acceptance_manifest_rejects_unsafe_or_non_idempotent_evidence(self) -> None:
        from tools import docker_smoke

        failure_drills = []
        expected_hashes = []
        for index, failure_mode in enumerate(
            ("none", "timeout_once", "adapter_rejected", "reconciliation_mismatch", "kill_switch")
        ):
            workflow = stage4_workflow(f"stage4-workflow-{failure_mode}")
            first = build_stage5_shadow_session(workflow, failure_mode=failure_mode, attempt=1)
            retry = (
                build_stage5_shadow_session(workflow, failure_mode=failure_mode, attempt=2)
                if failure_mode == "timeout_once"
                else copy.deepcopy(first)
            )
            failure_drills.append(
                {
                    "failureMode": failure_mode,
                    "workflow": workflow,
                    "firstSession": first,
                    "retrySession": retry,
                    "retryCreated": failure_mode == "timeout_once",
                }
            )
            expected_hashes.append(first["sessionHash"])
            if failure_mode == "timeout_once":
                expected_hashes.append(retry["sessionHash"])
        expected_hashes.sort()
        manifest = docker_smoke.build_stage5_shadow_acceptance_manifest(
            failure_drills=failure_drills,
            restart_readback={
                "expectedSessionCount": 6,
                "actualSessionCount": 6,
                "expectedSessionHashes": expected_hashes,
                "actualSessionHashes": expected_hashes,
            },
            export_readback={
                "exportArtifactCount": 6,
                "importedArtifactCount": 6,
                "readbackArtifactCount": 6,
                "exportSessionHashes": expected_hashes,
                "importedSessionHashes": expected_hashes,
                "readbackSessionHashes": expected_hashes,
            },
        )
        self.assertIn("liveBlocked=True", docker_smoke.validate_stage5_shadow_acceptance_manifest(manifest))

        for mutate in (
            lambda value: value.update({"orderSubmissionEnabled": True}),
            lambda value: value["failureDrills"].pop(),
            lambda value: value["failureDrills"][2].update({"retryCreated": True}),
            lambda value: value["failureDrills"][1]["retrySession"].update({"sessionHash": "0" * 64}),
            lambda value: value["restartReadback"].update({"actualSessionCount": 5}),
        ):
            with self.subTest(mutate=mutate):
                tampered = copy.deepcopy(manifest)
                mutate(tampered)
                with self.assertRaises(RuntimeError):
                    docker_smoke.validate_stage5_shadow_acceptance_manifest(tampered)

    def test_export_import_counts_and_rebuilds_shadow_sessions_from_stage4_workflow(self) -> None:
        from quant_core.runs import (
            research_run_export_to_payload,
            research_run_import_audit_events,
            research_run_import_portfolio_paper_order_simulations,
            research_run_import_to_audit,
        )

        workflow = stage4_workflow()
        attempts = [
            build_stage5_shadow_session(workflow, failure_mode="timeout_once", attempt=1),
            build_stage5_shadow_session(workflow, failure_mode="timeout_once", attempt=2),
        ]
        events = [
            {
                "schemaVersion": 1,
                "eventId": workflow["workflowId"],
                "eventType": "stage4_portfolio_workflow",
                "runId": workflow["baseRunId"],
                "createdAt": workflow["generatedAt"],
                "stage": "stage4-portfolio-workflow",
                "source": "test",
                "summary": "Stage 4 source.",
                "detail": "Authoritative workflow.",
                "metadata": {"snapshot": workflow},
            },
            *(stage5_shadow_session_to_audit_event(session, "test") for session in attempts),
        ]
        audit = quant_core_tests.QuantCoreContractTest()._sample_research_run_audit(
            run_id="run-a", strategy_revision="rev-run-a"
        )
        exported = research_run_export_to_payload(audit, audit_events=events)

        self.assertEqual(exported["manifest"]["artifactCounts"]["stage5ShadowSessions"], 2)
        imported = research_run_import_to_audit(exported)
        imported_events = research_run_import_audit_events(exported, run_id=imported.run_id)
        self.assertEqual(
            [event["metadata"]["snapshot"]["sessionHash"] for event in imported_events[1:]],
            [session["sessionHash"] for session in attempts],
        )

        bad_count = copy.deepcopy(exported)
        bad_count.pop("integrity")
        bad_count["manifest"]["artifactCounts"]["stage5ShadowSessions"] = 1
        with self.assertRaisesRegex(ValueError, "artifact_count_stage5_shadow_sessions_mismatch"):
            research_run_import_to_audit(bad_count)

        missing_workflow = research_run_export_to_payload(audit, audit_events=events[1:])
        with self.assertRaisesRegex(ValueError, "stage5_shadow_source_workflow_missing"):
            research_run_import_to_audit(missing_workflow)

        imported_simulations = research_run_import_portfolio_paper_order_simulations(
            {
                "portfolioPaperOrderSimulations": [
                    {
                        **workflow["simulations"][0],
                        "routeRisk": workflow["simulations"][0]["routeRisk"],
                    }
                ]
            },
            base_run_id=workflow["baseRunId"],
        )
        self.assertEqual(imported_simulations[0]["routeRisk"], workflow["simulations"][0]["routeRisk"])

        tampered = copy.deepcopy(exported)
        tampered.pop("integrity")
        session = tampered["auditEvents"][1]["metadata"]["snapshot"]
        session["orders"][0]["quantity"] += 1
        session["sessionHash"] = stage5_shadow_session_hash(session)
        with self.assertRaisesRegex(ValueError, "stage5_shadow_session_source_mismatch"):
            research_run_import_to_audit(tampered)


if __name__ == "__main__":
    unittest.main()
