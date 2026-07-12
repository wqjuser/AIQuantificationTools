from __future__ import annotations

import copy
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from http.client import HTTPConnection
from http.server import HTTPServer
import json
from pathlib import Path
import sys
import tempfile
from threading import Thread
from types import SimpleNamespace
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.quant_core.tests import test_stage4_portfolio as stage4_tests
from services.quant_core.tests import test_quant_core as quant_core_tests
from quant_core.execution import (
    build_portfolio_paper_order_replay,
    build_portfolio_paper_order_simulation_route_risk,
    portfolio_paper_order_payload_to_simulation,
)
from quant_core.stage5_shadow import (
    build_stage5_sandbox_authorization_preflight,
    build_stage5_sandbox_readiness_decision,
    build_stage5_shadow_session,
    stage5_sandbox_authorization_preflight_hash,
    stage5_sandbox_authorization_preflight_to_audit_event,
    stage5_sandbox_readiness_decision_hash,
    stage5_sandbox_readiness_decision_to_audit_event,
    stage5_shadow_session_hash,
    stage5_shadow_session_to_audit_event,
    validate_stage5_sandbox_authorization_preflight,
    validate_stage5_sandbox_readiness_decision,
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


def stage4_workflow_with_adapter_evidence(
    workflow_id: str = "stage4-workflow-readiness",
    *,
    market: str = "ashare",
    adapter_id: str = "ashare-live",
) -> tuple[dict, list[dict]]:
    if market == "ashare":
        workflow = stage4_workflow(workflow_id)
    else:
        fixture = stage4_tests.Stage4PortfolioWorkflowSnapshotTest()
        fixture.setUp()
        symbols = ("BTC/USDT", "ETH/USDT")
        fixture.portfolio["market"] = market
        for index, symbol in enumerate(symbols):
            fixture.portfolio_request["legs"][index].update(market=market, symbol=symbol)
            fixture.portfolio["legs"][index]["symbol"] = symbol
            fixture.batch["orders"][index]["symbol"] = symbol
            fixture.simulations[index]["symbol"] = symbol
        existing_simulations = []
        for simulation in fixture.simulations:
            simulation["routeRisk"] = build_portfolio_paper_order_simulation_route_risk(
                simulation,
                base_run_id=fixture.batch["baseRunId"],
                batch_id=fixture.batch["batchId"],
                existing_simulations=existing_simulations,
                route_risk={"initialCash": fixture.portfolio_request["initialCash"], **fixture.risk_template},
            )
            existing_simulations.append(portfolio_paper_order_payload_to_simulation(simulation))
        fixture.replay = build_portfolio_paper_order_replay(
            [portfolio_paper_order_payload_to_simulation(row) for row in fixture.simulations],
            base_run_id=fixture.batch["baseRunId"],
            initial_cash=fixture.portfolio_request["initialCash"],
            generated_at=datetime.fromisoformat(fixture.replay["generatedAt"]),
        )
        for order, simulation in zip(fixture.batch["orders"], fixture.simulations, strict=True):
            order.update(
                side=simulation["side"],
                quantity=simulation["quantity"],
                notionalValue=simulation["notionalValue"],
            )
        workflow = fixture.build(workflow_id=workflow_id)
    executions = []
    for index, simulation in enumerate(workflow["simulations"], start=1):
        execution_id = f"adapter-paper-execution-{index}"
        manifest_id = f"adapter-manifest-validation-{index}"
        evidence = {
            "adapterPaperExecutionId": execution_id,
            "manifestValidationId": manifest_id,
            "adapterId": adapter_id,
            "market": workflow["portfolio"]["market"],
            "symbol": simulation["symbol"],
            "side": simulation["side"],
            "quantity": simulation["quantity"],
            "route": "paper",
            "status": "paper_execution_recorded",
            "paperFillRecorded": True,
            "paperOnly": True,
            "orderSubmitted": False,
            "liveOrderSubmitted": False,
            "routeExecuted": False,
            "liveTradingAllowed": False,
        }
        simulation.update(
            adapterPaperExecutionId=execution_id,
            adapterManifestValidationId=manifest_id,
            adapterPaperExecutionEvidence=copy.deepcopy(evidence),
        )
        executions.append({
            **evidence,
            "recordedAt": "2026-07-11T09:00:00+00:00",
            "orderIntent": {
                "symbol": simulation["symbol"],
                "side": simulation["side"],
                "quantity": simulation["quantity"],
            },
        })
    workflow["replay"] = build_portfolio_paper_order_replay(
        [portfolio_paper_order_payload_to_simulation(row) for row in workflow["simulations"]],
        base_run_id=workflow["baseRunId"],
        initial_cash=workflow["portfolioRequest"]["initialCash"],
        generated_at=datetime.fromisoformat(workflow["replay"]["generatedAt"]),
    )
    workflow["workflowHash"] = stage4_tests.stage4_portfolio_workflow_hash(workflow)
    return workflow, executions


def adapter_paper_execution_audit_event(execution: dict, run_id: str = "") -> dict:
    execution_id = execution["adapterPaperExecutionId"]
    return {
        "schemaVersion": 1,
        "eventId": execution_id,
        "eventType": "execution_adapter_paper_execution",
        "runId": run_id,
        "createdAt": execution["recordedAt"],
        "stage": "execution-adapter-paper-execution",
        "source": "execution-adapter-ledger",
        "summary": f"{execution['adapterId']} adapter paper execution recorded.",
        "detail": "Local simulated fill only; no order submission.",
        "metadata": {
            "adapterPaperExecutionId": execution_id,
            "adapterOpsStateId": f"ops-{execution_id}",
            "manifestValidationId": execution["manifestValidationId"],
            "adapterId": execution["adapterId"],
            "market": execution["market"],
            "route": "paper",
            "status": "paper_execution_recorded",
            "operator": "test-operator",
            "recordedAt": execution["recordedAt"],
            "orderIntent": copy.deepcopy(execution["orderIntent"]),
        },
    }


def sandbox_probe_audit_events(health: dict) -> tuple[dict, dict]:
    shared = {
        "sandboxProbePlanId": "probe-plan-1",
        "humanConfirmationId": "human-confirmation-1",
        "orchestrationExecutionId": "orchestration-execution-1",
        "dryRunId": "dry-run-1",
        "acceptanceId": "acceptance-1",
        "executionId": "execution-1",
        "planId": "plan-1",
        "bindingId": "binding-1",
        "materializationId": "materialization-1",
        "manifestValidationId": "manifest-validation-1",
        "adapterId": "ccxt-live",
        "market": "crypto",
        "route": "live",
        "operator": "test-operator",
        "probeExecutionMode": "manual_readonly_sandbox_probe",
        "probeMode": "manual_sandbox_probe_plan",
        "confirmationMode": "manual_final_human_confirmation",
        "orchestrationExecutionMode": "manual_adapter_orchestration_execution",
        "orchestrationMode": "manual_adapter_orchestration_dry_run",
        "acceptanceMode": "manual_runtime_reload_acceptance",
        "executionMode": "manual_runtime_reload_execution",
        "reloadMode": "manual_runtime_reload_plan",
        "maintenanceWindowId": "window-1",
        "bindingMode": "env_ref_only",
        "manifestPath": "data/adapter-manifest.json",
        "requiredEnvVars": ["CCXT_BINANCE_API_KEY", "CCXT_BINANCE_SECRET"],
        "blockedReasons": [],
        "liveTradingAllowed": False,
        "paperOnly": True,
    }
    execution_id = "probe-execution-1"
    execution_time = health["generatedAt"]
    execution_confirmations = [
        "probe-plan-reviewed", "readonly-handshake-captured", "account-snapshot-redacted",
        "order-schema-validated", "operator-confirmed-no-orders-submitted",
    ]
    execution = {
        "schemaVersion": 1,
        "eventId": execution_id,
        "eventType": "execution_adapter_sandbox_probe_execution",
        "runId": "",
        "createdAt": execution_time,
        "stage": "execution-adapter-sandbox-probe-execution",
        "source": "execution-adapter-ledger",
        "summary": "ccxt-live adapter sandbox probe execution recorded.",
        "detail": "Read-only probe; order submission blocked.",
        "metadata": {
            **shared,
            "sandboxProbeExecutionId": execution_id,
            "status": "probe_execution_recorded",
            "recordedAt": execution_time,
            "requiredConfirmationIds": execution_confirmations,
            "confirmedConfirmationIds": execution_confirmations,
            "metadata": {"authoritativeHealthProbe": health},
        },
    }
    review_id = "probe-review-1"
    review_time = execution_time
    review_confirmations = [
        "probe-execution-reviewed", "readonly-evidence-matches-plan", "redacted-snapshot-archived",
        "order-schema-risk-reviewed", "production-route-still-blocked",
    ]
    review = {
        "schemaVersion": 1,
        "eventId": review_id,
        "eventType": "execution_adapter_sandbox_probe_review",
        "runId": "",
        "createdAt": review_time,
        "stage": "execution-adapter-sandbox-probe-review",
        "source": "execution-adapter-ledger",
        "summary": "ccxt-live adapter sandbox probe review recorded.",
        "detail": "Read-only review; order submission blocked.",
        "metadata": {
            **shared,
            "sandboxProbeReviewId": review_id,
            "sandboxProbeExecutionId": execution_id,
            "status": "probe_review_recorded",
            "recordedAt": review_time,
            "reviewMode": "manual_sandbox_probe_review",
            "requiredConfirmationIds": review_confirmations,
            "confirmedConfirmationIds": review_confirmations,
            "metadata": {},
        },
    }
    return execution, review


class Stage5ShadowSessionTest(unittest.TestCase):
    def test_sandbox_authorization_preflight_api_is_idempotent_and_recovers_from_sources(self) -> None:
        from quant_core.api import (
            QuantApiHandler,
            _stage5_sandbox_authorization_sources_for_export,
        )
        from quant_core.audit_events import AuditEventStore, audit_event_record_to_payload

        workflow, executions = stage4_workflow_with_adapter_evidence(
            market="crypto",
            adapter_id="ccxt-live",
        )
        now = datetime.now(timezone.utc)
        session = build_stage5_shadow_session(workflow, generated_at=workflow["generatedAt"])
        decision = build_stage5_sandbox_readiness_decision(
            workflow,
            session,
            executions,
            operator="test-operator",
            confirmed=True,
            generated_at=now.isoformat(),
        )
        health = quant_core_tests.QuantCoreContractTest()._ccxt_health_evidence(
            generated_at=now
        )
        probe_execution_event, probe_review_event = sandbox_probe_audit_events(health)
        with tempfile.TemporaryDirectory() as tmp:
            store = AuditEventStore(Path(tmp) / "audit.sqlite")
            store.record({
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
            })
            store.record(stage5_shadow_session_to_audit_event(session, "test"))
            for execution in executions:
                store.record(adapter_paper_execution_audit_event(execution, workflow["baseRunId"]))
            store.record(stage5_sandbox_readiness_decision_to_audit_event(decision))
            store.record(probe_execution_event)
            store.record(probe_review_event)
            for index in range(55):
                store.record({
                    "schemaVersion": 1,
                    "eventId": f"superseded-readiness-{index}",
                    "eventType": "stage5_sandbox_readiness_decision",
                    "runId": workflow["baseRunId"],
                    "createdAt": (now + timedelta(minutes=index + 1)).isoformat(),
                    "stage": "superseded-test-evidence",
                    "source": "test",
                    "summary": "Superseded readiness evidence.",
                    "detail": "Used to prove exact source recovery beyond the recent-event window.",
                    "metadata": {"snapshot": {"decisionHash": f"superseded-{index}"}},
                })

            class Handler(QuantApiHandler):
                audit_event_store = store

            server = HTTPServer(("127.0.0.1", 0), Handler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=5)
            payload = {
                "baseRunId": workflow["baseRunId"],
                "readinessDecisionHash": decision["decisionHash"],
                "sandboxProbeExecutionId": probe_execution_event["eventId"],
                "sandboxProbeReviewId": probe_review_event["eventId"],
                "operator": "test-operator",
                "confirmed": True,
            }
            try:
                responses = []
                for _ in range(2):
                    body = json.dumps(payload).encode()
                    connection.request(
                        "POST", "/api/execution/sandbox-authorization-preflights", body=body,
                        headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                    )
                    response = connection.getresponse()
                    responses.append((response.status, json.loads(response.read())))
                wrong_hash_body = json.dumps({
                    **payload,
                    "readinessDecisionHash": decision["workflowHash"],
                }).encode()
                connection.request(
                    "POST", "/api/execution/sandbox-authorization-preflights", body=wrong_hash_body,
                    headers={
                        "Content-Type": "application/json",
                        "Content-Length": str(len(wrong_hash_body)),
                    },
                )
                wrong_hash_response = connection.getresponse()
                wrong_hash_payload = json.loads(wrong_hash_response.read())
                connection.request(
                    "GET",
                    f"/api/execution/sandbox-authorization-preflights?baseRunId={workflow['baseRunId']}&limit=10",
                )
                listed_response = connection.getresponse()
                listed = json.loads(listed_response.read())
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()
            preflight_event = store.get(
                responses[0][1]["sandboxAuthorizationPreflight"]["preflightId"]
            )
            exported_events = _stage5_sandbox_authorization_sources_for_export(
                store,
                workflow["baseRunId"],
                [
                    audit_event_record_to_payload(event)
                    for event in store.list_all_by_run(workflow["baseRunId"])
                ],
            )

        self.assertEqual([status for status, _ in responses], [201, 200], responses)
        self.assertEqual(
            responses[0][1]["sandboxAuthorizationPreflight"]["preflightHash"],
            responses[1][1]["sandboxAuthorizationPreflight"]["preflightHash"],
        )
        self.assertEqual(listed_response.status, 200)
        self.assertEqual(len(listed["sandboxAuthorizationPreflights"]), 1)
        self.assertEqual(wrong_hash_response.status, 409, wrong_hash_payload)
        self.assertTrue(
            {
                workflow["workflowId"], session["sessionId"], decision["decisionId"],
                preflight_event.event_id, probe_execution_event["eventId"],
                probe_review_event["eventId"],
            }.issubset({event["eventId"] for event in exported_events})
        )

    def test_sandbox_authorization_preflight_rejects_probe_metadata_identity_tamper(self) -> None:
        from quant_core.api import _stage5_sandbox_authorization_probe_execution
        from quant_core.audit_events import AuditEventStore

        health = quant_core_tests.QuantCoreContractTest()._ccxt_health_evidence(
            generated_at=datetime.now(timezone.utc)
        )
        execution_event, _ = sandbox_probe_audit_events(health)
        execution_event["metadata"]["sandboxProbeExecutionId"] = "forged-probe-execution-id"
        with tempfile.TemporaryDirectory() as tmp:
            store = AuditEventStore(Path(tmp) / "audit.sqlite")
            event = store.record(execution_event)
            self.assertIsNone(_stage5_sandbox_authorization_probe_execution(event))

    def test_sandbox_authorization_preflight_replays_existing_artifact_after_freshness_window(self) -> None:
        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        workflow, executions = stage4_workflow_with_adapter_evidence(
            market="crypto", adapter_id="ccxt-live"
        )
        source_time = datetime.now(timezone.utc)
        artifact_time = source_time + timedelta(hours=1)
        session = build_stage5_shadow_session(workflow, generated_at=workflow["generatedAt"])
        decision = build_stage5_sandbox_readiness_decision(
            workflow, session, executions, operator="test-operator", confirmed=True,
            generated_at=source_time.isoformat(),
        )
        health = quant_core_tests.QuantCoreContractTest()._ccxt_health_evidence(
            generated_at=source_time
        )
        execution_event, review_event = sandbox_probe_audit_events(health)
        from quant_core.execution import (
            execution_adapter_sandbox_probe_execution_payload_from_audit_event,
            execution_adapter_sandbox_probe_review_payload_from_audit_event,
        )
        with tempfile.TemporaryDirectory() as tmp:
            store = AuditEventStore(Path(tmp) / "audit.sqlite")
            for event in (
                {
                    "schemaVersion": 1, "eventId": workflow["workflowId"],
                    "eventType": "stage4_portfolio_workflow", "runId": workflow["baseRunId"],
                    "createdAt": workflow["generatedAt"], "stage": "stage4-portfolio-workflow",
                    "source": "test", "summary": "Stage 4 source.", "detail": "Authoritative source.",
                    "metadata": {"snapshot": workflow},
                },
                stage5_shadow_session_to_audit_event(session, "test"),
                *(adapter_paper_execution_audit_event(item, workflow["baseRunId"]) for item in executions),
                stage5_sandbox_readiness_decision_to_audit_event(decision),
                execution_event,
                review_event,
            ):
                store.record(event)
            execution = execution_adapter_sandbox_probe_execution_payload_from_audit_event(
                store.get(execution_event["eventId"])
            )
            review = execution_adapter_sandbox_probe_review_payload_from_audit_event(
                store.get(review_event["eventId"])
            )
            with self.assertRaisesRegex(ValueError, "health evidence is stale"):
                build_stage5_sandbox_authorization_preflight(
                    decision, execution, review, operator="test-operator", confirmed=True,
                    generated_at=(source_time + timedelta(hours=25)).isoformat(),
                )
            preflight = build_stage5_sandbox_authorization_preflight(
                decision, execution, review, operator="test-operator", confirmed=True,
                generated_at=artifact_time.isoformat(),
            )
            store.record(stage5_sandbox_authorization_preflight_to_audit_event(preflight))
            for index in range(55):
                store.record({
                    "schemaVersion": 1,
                    "eventId": f"newer-preflight-{index}",
                    "eventType": "stage5_sandbox_authorization_preflight",
                    "runId": workflow["baseRunId"],
                    "createdAt": (artifact_time + timedelta(minutes=index + 1)).isoformat(),
                    "stage": "superseded-test-evidence",
                    "source": "test",
                    "summary": "Newer preflight evidence.",
                    "detail": "Used to prove exact idempotent recovery beyond the recent-event window.",
                    "metadata": {"snapshot": {"preflightId": f"newer-preflight-{index}"}},
                })

            class Handler(QuantApiHandler):
                audit_event_store = store

            server = HTTPServer(("127.0.0.1", 0), Handler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=5)
            body = json.dumps({
                "baseRunId": workflow["baseRunId"],
                "readinessDecisionHash": decision["decisionHash"],
                "sandboxProbeExecutionId": execution_event["eventId"],
                "sandboxProbeReviewId": review_event["eventId"],
                "operator": "test-operator", "confirmed": True,
            }).encode()
            try:
                connection.request(
                    "POST", "/api/execution/sandbox-authorization-preflights", body=body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                )
                response = connection.getresponse()
                payload = json.loads(response.read())
            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()

        self.assertEqual(response.status, 200, payload)
        self.assertEqual(payload["sandboxAuthorizationPreflight"], preflight)

    def test_export_import_rebuilds_sandbox_authorization_preflight_sources(self) -> None:
        from quant_core.execution import (
            execution_adapter_sandbox_probe_execution_payload_from_audit_event,
            execution_adapter_sandbox_probe_review_payload_from_audit_event,
        )
        from quant_core.runs import research_run_export_to_payload, research_run_import_to_audit

        workflow, executions = stage4_workflow_with_adapter_evidence(
            market="crypto", adapter_id="ccxt-live"
        )
        now = datetime.now(timezone.utc)
        session = build_stage5_shadow_session(workflow, generated_at=workflow["generatedAt"])
        decision = build_stage5_sandbox_readiness_decision(
            workflow, session, executions, operator="test-operator", confirmed=True,
            generated_at=now.isoformat(),
        )
        health = quant_core_tests.QuantCoreContractTest()._ccxt_health_evidence(generated_at=now)
        execution_event, review_event = sandbox_probe_audit_events(health)
        execution = execution_adapter_sandbox_probe_execution_payload_from_audit_event(
            SimpleNamespace(
                event_type=execution_event["eventType"], event_id=execution_event["eventId"],
                metadata=execution_event["metadata"], created_at=datetime.fromisoformat(execution_event["createdAt"]),
            )
        )
        review = execution_adapter_sandbox_probe_review_payload_from_audit_event(
            SimpleNamespace(
                event_type=review_event["eventType"], event_id=review_event["eventId"],
                metadata=review_event["metadata"], created_at=datetime.fromisoformat(review_event["createdAt"]),
            )
        )
        preflight = build_stage5_sandbox_authorization_preflight(
            decision, execution, review, operator="test-operator", confirmed=True,
            generated_at=now.isoformat(),
        )
        for event in (execution_event, review_event):
            event["runId"] = workflow["baseRunId"]
        events = [
            {
                "schemaVersion": 1, "eventId": workflow["workflowId"],
                "eventType": "stage4_portfolio_workflow", "runId": workflow["baseRunId"],
                "createdAt": workflow["generatedAt"], "stage": "stage4-portfolio-workflow",
                "source": "test", "summary": "Stage 4 source.", "detail": "Authoritative source.",
                "metadata": {"snapshot": workflow},
            },
            stage5_shadow_session_to_audit_event(session, "test"),
            stage5_sandbox_readiness_decision_to_audit_event(decision),
            execution_event,
            review_event,
            stage5_sandbox_authorization_preflight_to_audit_event(preflight),
        ]
        audit = quant_core_tests.QuantCoreContractTest()._sample_research_run_audit(
            run_id=workflow["baseRunId"], strategy_revision="rev-run-a"
        )
        audit = replace(audit, market="crypto", symbol="BTC/USDT")
        exported = research_run_export_to_payload(
            audit, adapter_paper_executions=executions, audit_events=events
        )

        self.assertEqual(
            exported["manifest"]["artifactCounts"]["stage5SandboxAuthorizationPreflights"], 1
        )
        research_run_import_to_audit(exported)

        missing_review = copy.deepcopy(exported)
        missing_review.pop("integrity")
        missing_review["auditEvents"] = [
            event for event in missing_review["auditEvents"]
            if event["eventType"] != "execution_adapter_sandbox_probe_review"
        ]
        missing_review["manifest"]["artifactCounts"]["auditEvents"] -= 1
        with self.assertRaisesRegex(ValueError, "stage5_sandbox_authorization_preflight_source_missing"):
            research_run_import_to_audit(missing_review)

        unsafe_review = copy.deepcopy(exported)
        unsafe_review.pop("integrity")
        next(
            event for event in unsafe_review["auditEvents"]
            if event["eventType"] == "execution_adapter_sandbox_probe_review"
        )["metadata"]["liveTradingAllowed"] = True
        with self.assertRaisesRegex(ValueError, "stage5_sandbox_authorization_preflight_source_missing"):
            research_run_import_to_audit(unsafe_review)

    def test_builds_sandbox_authorization_preflight_from_existing_authoritative_evidence(self) -> None:
        workflow, executions = stage4_workflow_with_adapter_evidence()
        session = build_stage5_shadow_session(workflow, generated_at=workflow["generatedAt"])
        decision = build_stage5_sandbox_readiness_decision(
            workflow,
            session,
            executions,
            operator="test-operator",
            confirmed=True,
            generated_at="2026-07-12T08:00:00+00:00",
        )
        decision.update(adapterId="ccxt-live", market="crypto")
        decision["decisionHash"] = stage5_sandbox_readiness_decision_hash(decision)
        health = quant_core_tests.QuantCoreContractTest()._ready_ccxt_health_evidence()
        execution = {
            "sandboxProbeExecutionId": "probe-execution-1",
            "adapterId": "ccxt-live",
            "market": "crypto",
            "route": "live",
            "status": "probe_execution_recorded",
            "recordedAt": "2026-07-12T08:01:00+00:00",
            "metadata": {"authoritativeHealthProbe": health},
        }
        review = {
            "sandboxProbeReviewId": "probe-review-1",
            "sandboxProbeExecutionId": execution["sandboxProbeExecutionId"],
            "adapterId": "ccxt-live",
            "market": "crypto",
            "route": "live",
            "status": "probe_review_recorded",
            "recordedAt": "2026-07-12T08:02:00+00:00",
            "requiredConfirmations": [{"id": "scope", "status": "confirmed"}],
        }

        preflight = build_stage5_sandbox_authorization_preflight(
            decision,
            execution,
            review,
            operator="test-operator",
            confirmed=True,
            generated_at="2026-07-12T08:03:00+00:00",
        )

        self.assertEqual(preflight["status"], "ready_for_separate_sandbox_authorization")
        self.assertTrue(preflight["humanAuthorizationRequired"])
        self.assertFalse(preflight["sandboxOrderSubmissionAllowed"])
        self.assertEqual(validate_stage5_sandbox_authorization_preflight(preflight), preflight)

        tampered = copy.deepcopy(preflight)
        tampered["orderSubmissionEnabled"] = True
        tampered["preflightHash"] = stage5_sandbox_authorization_preflight_hash(tampered)
        with self.assertRaisesRegex(ValueError, "orderSubmissionEnabled is immutable"):
            validate_stage5_sandbox_authorization_preflight(tampered)

        stale = copy.deepcopy(health)
        stale["generatedAt"] = "2026-07-10T08:00:00+00:00"
        stale["evidenceHash"] = "0" * 64
        with self.assertRaises(ValueError):
            build_stage5_sandbox_authorization_preflight(
                decision,
                {**execution, "metadata": {"authoritativeHealthProbe": stale}},
                review,
                operator="test-operator",
                confirmed=True,
                generated_at="2026-07-12T08:03:00+00:00",
            )

    def test_builds_minimal_sandbox_readiness_decision_from_authoritative_evidence(self) -> None:
        workflow, executions = stage4_workflow_with_adapter_evidence()
        session = build_stage5_shadow_session(
            workflow, generated_at=workflow["generatedAt"]
        )
        generated_at = (
            datetime.fromisoformat(workflow["generatedAt"]) + timedelta(minutes=1)
        ).isoformat()

        decision = build_stage5_sandbox_readiness_decision(
            workflow,
            session,
            executions,
            operator="test-operator",
            confirmed=True,
            generated_at=generated_at,
        )

        self.assertEqual(decision["status"], "ready_for_manually_authorized_sandbox_phase")
        self.assertEqual(decision["adapterId"], "ashare-live")
        self.assertEqual(
            decision["adapterPaperExecutionIds"],
            ["adapter-paper-execution-1", "adapter-paper-execution-2"],
        )
        self.assertFalse(decision["sandboxOrderSubmissionAllowed"])
        self.assertFalse(decision["orderSubmissionEnabled"])
        self.assertEqual(validate_stage5_sandbox_readiness_decision(decision), decision)

        tampered = copy.deepcopy(decision)
        tampered["adapterPaperExecutionIds"].reverse()
        tampered["decisionHash"] = stage5_sandbox_readiness_decision_hash(tampered)
        with self.assertRaises(ValueError):
            validate_stage5_sandbox_readiness_decision(tampered)

        wrong_intent = copy.deepcopy(executions)
        wrong_intent[0]["orderIntent"]["symbol"] = "000001"
        with self.assertRaisesRegex(ValueError, "order intent does not match"):
            build_stage5_sandbox_readiness_decision(
                workflow,
                session,
                wrong_intent,
                operator="test-operator",
                confirmed=True,
                generated_at=generated_at,
            )

        with self.assertRaisesRegex(ValueError, "source evidence is stale"):
            build_stage5_sandbox_readiness_decision(
                workflow,
                session,
                executions,
                operator="test-operator",
                confirmed=True,
                generated_at="2099-07-13T11:00:00+00:00",
            )

    def test_readiness_api_persists_idempotently_and_fails_closed_without_terminal_event(self) -> None:
        from quant_core.api import QuantApiHandler
        from quant_core.audit_events import AuditEventStore

        workflow, executions = stage4_workflow_with_adapter_evidence()
        session = build_stage5_shadow_session(workflow)
        with tempfile.TemporaryDirectory() as tmp:
            store = AuditEventStore(Path(tmp) / "audit.sqlite")
            store.record({
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
            })
            store.record(stage5_shadow_session_to_audit_event(session, "test"))
            class Handler(QuantApiHandler):
                audit_event_store = store

            server = HTTPServer(("127.0.0.1", 0), Handler)
            thread = Thread(target=server.serve_forever, daemon=True)
            thread.start()
            connection = HTTPConnection(*server.server_address, timeout=5)
            payload = {
                "baseRunId": workflow["baseRunId"],
                "workflowHash": workflow["workflowHash"],
                "sessionHash": session["sessionHash"],
                "operator": "test-operator",
                "confirmed": True,
            }
            try:
                body = json.dumps(payload).encode()
                connection.request(
                    "POST", "/api/execution/sandbox-readiness-decisions", body=body,
                    headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                )
                blocked_response = connection.getresponse()
                blocked = json.loads(blocked_response.read())
                for execution in executions:
                    store.record(adapter_paper_execution_audit_event(execution, workflow["baseRunId"]))

                responses = []
                for _ in range(2):
                    body = json.dumps(payload).encode()
                    connection.request(
                        "POST", "/api/execution/sandbox-readiness-decisions", body=body,
                        headers={"Content-Type": "application/json", "Content-Length": str(len(body))},
                    )
                    response = connection.getresponse()
                    responses.append((response.status, json.loads(response.read())))
                connection.request(
                    "GET", f"/api/execution/sandbox-readiness-decisions?baseRunId={workflow['baseRunId']}&limit=10"
                )
                listed_response = connection.getresponse()
                listed = json.loads(listed_response.read())

                malformed_event = stage5_sandbox_readiness_decision_to_audit_event(
                    responses[0][1]["sandboxReadinessDecision"]
                )
                malformed_event["stage"] = "stage5-shadow-execution"
                store.record(malformed_event)
                connection.request(
                    "GET", f"/api/execution/sandbox-readiness-decisions?baseRunId={workflow['baseRunId']}&limit=10"
                )
                malformed_response = connection.getresponse()
                malformed = json.loads(malformed_response.read())

            finally:
                connection.close()
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()
            stored_count = store.count(event_type="stage5_sandbox_readiness_decision")

        self.assertEqual([status for status, _ in responses], [201, 200])
        self.assertEqual(
            responses[0][1]["sandboxReadinessDecision"]["decisionHash"],
            responses[1][1]["sandboxReadinessDecision"]["decisionHash"],
        )
        self.assertEqual(listed_response.status, 200)
        self.assertEqual(len(listed["sandboxReadinessDecisions"]), 1)
        self.assertEqual(
            (malformed_response.status, malformed["error"]),
            (500, "invalid_stage5_sandbox_readiness_store"),
        )
        self.assertEqual((blocked_response.status, blocked["error"]), (409, "stage5_sandbox_readiness_blocked"))
        self.assertEqual(stored_count, 1)

    def test_export_import_rebuilds_readiness_decision_from_portable_sources(self) -> None:
        from quant_core.runs import (
            research_run_export_to_payload,
            research_run_import_audit_events,
            research_run_import_to_audit,
        )

        workflow, executions = stage4_workflow_with_adapter_evidence()
        session = build_stage5_shadow_session(workflow)
        decision = build_stage5_sandbox_readiness_decision(
            workflow,
            session,
            executions,
            operator="test-operator",
            confirmed=True,
        )
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
                "detail": "Authoritative source.",
                "metadata": {"snapshot": workflow},
            },
            stage5_shadow_session_to_audit_event(session, "test"),
            stage5_sandbox_readiness_decision_to_audit_event(decision),
        ]
        audit = quant_core_tests.QuantCoreContractTest()._sample_research_run_audit(
            run_id=workflow["baseRunId"], strategy_revision="rev-run-a"
        )
        exported = research_run_export_to_payload(
            audit,
            adapter_paper_executions=executions,
            audit_events=events,
        )

        self.assertEqual(exported["manifest"]["artifactCounts"]["stage5SandboxReadinessDecisions"], 1)
        imported = research_run_import_to_audit(exported)
        imported_events = research_run_import_audit_events(exported, run_id=imported.run_id)
        self.assertEqual(
            imported_events[-1]["metadata"]["snapshot"]["decisionHash"],
            decision["decisionHash"],
        )

        missing_adapter = copy.deepcopy(exported)
        missing_adapter.pop("integrity")
        missing_adapter["adapterPaperExecutions"] = []
        missing_adapter["manifest"]["artifactCounts"]["adapterPaperExecutions"] = 0
        with self.assertRaisesRegex(ValueError, "stage5_sandbox_readiness_adapter_evidence_missing"):
            research_run_import_to_audit(missing_adapter)

        wrong_source = copy.deepcopy(exported)
        wrong_source.pop("integrity")
        next(
            event for event in wrong_source["auditEvents"]
            if event["eventType"] == "stage5_sandbox_readiness_decision"
        )["source"] = "different-operator"
        with self.assertRaisesRegex(ValueError, "stage5_sandbox_readiness_audit_binding_mismatch"):
            research_run_import_to_audit(wrong_source)

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

    def test_sandbox_readiness_acceptance_manifest_rebuilds_all_sources(self) -> None:
        from tools import docker_smoke

        workflow, executions = stage4_workflow_with_adapter_evidence()
        session = build_stage5_shadow_session(workflow)
        decision = build_stage5_sandbox_readiness_decision(
            workflow, session, executions, operator="test-operator", confirmed=True
        )
        blockers = [
            {"mode": mode, "blocked": True}
            for mode in (
                "missing_adapter_event", "adapter_market_mismatch", "blocked_session",
                "unsafe_adapter_evidence", "decision_hash_tamper",
            )
        ]
        manifest = docker_smoke.build_stage5_sandbox_readiness_acceptance_manifest(
            workflow=workflow,
            shadow_session=session,
            adapter_paper_executions=executions,
            readiness_decision=decision,
            blocker_drills=blockers,
            restart_readback={
                "expectedDecisionCount": 1, "actualDecisionCount": 1,
                "expectedDecisionHashes": [decision["decisionHash"]],
                "actualDecisionHashes": [decision["decisionHash"]],
            },
            export_readback={
                "exportArtifactCount": 1, "importedArtifactCount": 1, "readbackArtifactCount": 1,
                "exportDecisionHashes": [decision["decisionHash"]],
                "importedDecisionHashes": [decision["decisionHash"]],
                "readbackDecisionHashes": [decision["decisionHash"]],
            },
        )
        self.assertIn(
            "sandboxOrderSubmissionAllowed=False",
            docker_smoke.validate_stage5_sandbox_readiness_acceptance_manifest(manifest),
        )

        unsafe = copy.deepcopy(manifest)
        unsafe["sandboxOrderSubmissionAllowed"] = True
        with self.assertRaises(RuntimeError):
            docker_smoke.validate_stage5_sandbox_readiness_acceptance_manifest(unsafe)

    def test_sandbox_readonly_probe_acceptance_requires_no_credentials_and_fail_closed_status(self) -> None:
        from tools import docker_smoke

        probe = {
            "schemaVersion": 1,
            "probeId": "execution-adapter-health-ccxt-live-no-credentials",
            "adapterId": "ccxt-live",
            "provider": "ccxt",
            "exchangeId": "binance",
            "mode": "sandbox",
            "status": "blocked",
            "generatedAt": "2026-07-12T08:00:00+00:00",
            "checks": [],
            "capabilities": {},
            "credentials": {
                "apiKeyConfigured": False,
                "apiKeySource": None,
                "secretConfigured": False,
                "secretSource": None,
                "passwordConfigured": False,
                "passwordSource": None,
            },
            "marketCount": 0,
            "exchangeStatus": None,
            "serverTimeMs": None,
            "accountSyncState": "blocked",
            "blockedReasons": ["ccxt_not_installed"],
            "metadata": {"readOnly": True},
            "paperOnly": True,
            "liveTradingAllowed": False,
            "orderRoutingEnabled": False,
        }
        manifest = docker_smoke.build_stage5_sandbox_readonly_probe_acceptance_manifest(probe)
        self.assertIn(
            "credentialsAbsent=True",
            docker_smoke.validate_stage5_sandbox_readonly_probe_acceptance_manifest(manifest),
        )

        for field, value in (
            ("probeDigest", "0" * 64),
            ("orderSubmissionEnabled", True),
        ):
            with self.subTest(field=field):
                tampered = copy.deepcopy(manifest)
                tampered[field] = value
                with self.assertRaises(RuntimeError):
                    docker_smoke.validate_stage5_sandbox_readonly_probe_acceptance_manifest(tampered)

        ready = copy.deepcopy(probe)
        ready["status"] = "ready"
        ready_manifest = docker_smoke.build_stage5_sandbox_readonly_probe_acceptance_manifest(ready)
        with self.assertRaises(RuntimeError):
            docker_smoke.validate_stage5_sandbox_readonly_probe_acceptance_manifest(ready_manifest)

        leaked = copy.deepcopy(probe)
        leaked["rawSecret"] = "must-not-enter-acceptance"
        leaked_manifest = docker_smoke.build_stage5_sandbox_readonly_probe_acceptance_manifest(leaked)
        with self.assertRaises(RuntimeError):
            docker_smoke.validate_stage5_sandbox_readonly_probe_acceptance_manifest(leaked_manifest)

        authorization_manifest = docker_smoke.build_stage5_sandbox_authorization_preflight_acceptance_manifest(
            base_run_id="run-a",
            readiness_decision_hash="a" * 64,
            readonly_probe_acceptance=manifest,
            request_status=409,
            request_payload={
                "error": "stage5_sandbox_authorization_preflight_blocked",
                "blockers": ["stage5 sandbox authorization preflight requires a recorded probe review"],
            },
            probe_execution={"sandboxProbeExecutionId": "execution-1", "status": "blocked"},
            probe_review={"sandboxProbeReviewId": "review-1", "status": "blocked"},
            preflight_count=0,
        )
        self.assertIn(
            "preflightCount=0",
            docker_smoke.validate_stage5_sandbox_authorization_preflight_acceptance_manifest(
                authorization_manifest
            ),
        )
        unsafe_authorization = copy.deepcopy(authorization_manifest)
        unsafe_authorization["sandboxOrderSubmissionAllowed"] = True
        with self.assertRaises(RuntimeError):
            docker_smoke.validate_stage5_sandbox_authorization_preflight_acceptance_manifest(
                unsafe_authorization
            )

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
    stage5_sandbox_authorization_preflight_hash,
    validate_stage5_sandbox_authorization_preflight,
