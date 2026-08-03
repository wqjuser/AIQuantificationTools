from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4
from quant_core.execution_adapter_health import validate_execution_adapter_health_probe_evidence
from .common import (
    _coerce_optional_datetime,
    _redact_secret_fields,
)
from .contracts import (
    ExecutionAdapterSandboxProbeExecutionResult,
)

__all__ = [
    '_execution_adapter_authoritative_health_ready',
    '_execution_adapter_sandbox_probe_execution_specs',
    'build_execution_adapter_sandbox_probe_execution',
    'execution_adapter_sandbox_probe_execution_payload_from_audit_event',
    'execution_adapter_sandbox_probe_execution_to_audit_event_payload',
    'execution_adapter_sandbox_probe_execution_to_payload',
]

def build_execution_adapter_sandbox_probe_execution(
    sandbox_probe_plan: dict[str, Any],
    *,
    health_probe_evidence: dict[str, Any] | None = None,
    adapter_id: str = "",
    probe_execution_mode: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | str | None = None,
    sandbox_probe_execution_id: str | None = None,
) -> ExecutionAdapterSandboxProbeExecutionResult:
    if not isinstance(sandbox_probe_plan, dict):
        raise ValueError("execution_adapter_sandbox_probe_plan_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    sandbox_probe_plan_id = str(sandbox_probe_plan.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(sandbox_probe_plan.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(sandbox_probe_plan.get("orchestrationExecutionId") or "").strip()
    dry_run_id = str(sandbox_probe_plan.get("dryRunId") or "").strip()
    acceptance_id = str(sandbox_probe_plan.get("acceptanceId") or "").strip()
    execution_id = str(sandbox_probe_plan.get("executionId") or "").strip()
    plan_id = str(sandbox_probe_plan.get("planId") or "").strip()
    binding_id = str(sandbox_probe_plan.get("bindingId") or "").strip()
    materialization_id = str(sandbox_probe_plan.get("materializationId") or "").strip()
    manifest_validation_id = str(sandbox_probe_plan.get("manifestValidationId") or "").strip()
    plan_adapter_id = str(sandbox_probe_plan.get("adapterId") or "").strip()
    requested_adapter_id = str(adapter_id or plan_adapter_id).strip()
    market = str(sandbox_probe_plan.get("market") or "").strip()
    route = str(sandbox_probe_plan.get("route") or "").strip()
    normalized_probe_execution_mode = str(probe_execution_mode or "manual_readonly_sandbox_probe").strip()
    probe_mode = str(sandbox_probe_plan.get("probeMode") or "").strip()
    confirmation_mode = str(sandbox_probe_plan.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(sandbox_probe_plan.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(sandbox_probe_plan.get("orchestrationMode") or "").strip()
    acceptance_mode = str(sandbox_probe_plan.get("acceptanceMode") or "").strip()
    execution_mode = str(sandbox_probe_plan.get("executionMode") or "").strip()
    reload_mode = str(sandbox_probe_plan.get("reloadMode") or "").strip()
    maintenance_window_id = str(sandbox_probe_plan.get("maintenanceWindowId") or "").strip()
    binding_mode = str(sandbox_probe_plan.get("bindingMode") or "").strip()
    manifest_path = str(sandbox_probe_plan.get("manifestPath") or "").strip()
    required_env_vars = [
        str(item).strip()
        for item in sandbox_probe_plan.get("requiredEnvVars", [])
        if isinstance(item, str) and item.strip()
    ]

    if not sandbox_probe_plan_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_plan_id_required")
    if not human_confirmation_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_human_confirmation_id_required")
    if not orchestration_execution_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_orchestration_execution_id_required")
    if not dry_run_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_dry_run_id_required")
    if not acceptance_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_acceptance_id_required")
    if not execution_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_execution_id_required")
    if not plan_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_reload_plan_id_required")
    if not binding_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_binding_id_required")
    if not materialization_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_materialization_id_required")
    if not plan_adapter_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_adapter_id_required")
    if not requested_adapter_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_adapter_id_required")
    if requested_adapter_id != plan_adapter_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_adapter_mismatch")
    if not market:
        raise ValueError("execution_adapter_sandbox_probe_execution_market_required")
    if route not in {"paper", "live"}:
        raise ValueError("execution_adapter_sandbox_probe_execution_route_invalid")
    if not normalized_probe_execution_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_mode_required")
    if not probe_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_probe_mode_required")
    if not confirmation_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_confirmation_mode_required")
    if not orchestration_execution_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_orchestration_execution_mode_required")
    if not orchestration_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_orchestration_mode_required")
    if not acceptance_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_acceptance_mode_required")
    if not execution_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_reload_execution_mode_required")
    if not reload_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_reload_mode_required")
    if not maintenance_window_id:
        raise ValueError("execution_adapter_sandbox_probe_execution_window_required")
    if not binding_mode:
        raise ValueError("execution_adapter_sandbox_probe_execution_binding_mode_required")
    if not manifest_path:
        raise ValueError("execution_adapter_sandbox_probe_execution_manifest_path_required")
    if not required_env_vars:
        raise ValueError("execution_adapter_sandbox_probe_execution_required_env_vars_required")

    health_evidence = None
    health_evidence_error = ""
    try:
        health_evidence = validate_execution_adapter_health_probe_evidence(health_probe_evidence)
    except ValueError as error:
        health_evidence_error = str(error)
    authoritative_health_ready = _execution_adapter_authoritative_health_ready(
        health_evidence, adapter_id=plan_adapter_id, market=market
    )

    blocked_reasons = []
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in _execution_adapter_sandbox_probe_execution_specs():
        confirmed = authoritative_health_ready if payload_key in {
            "readonlyHandshakeCaptured", "accountSnapshotRedacted"
        } else bool(confirmations.get(payload_key))
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if str(sandbox_probe_plan.get("status") or "") != "probe_plan_recorded":
        blocked_reasons.append("sandbox_probe_execution_plan_not_recorded")
    if not manifest_validation_id:
        blocked_reasons.append("sandbox_probe_execution_manifest_validation_missing")
    if route != "live":
        blocked_reasons.append("sandbox_probe_execution_route_not_live")
    if health_evidence_error == "execution_adapter_health_evidence_required":
        blocked_reasons.append("sandbox_probe_execution_authoritative_health_missing")
    elif health_evidence_error:
        blocked_reasons.append("sandbox_probe_execution_authoritative_health_invalid")
    elif health_evidence and health_evidence["adapterId"] != plan_adapter_id:
        blocked_reasons.append("sandbox_probe_execution_authoritative_health_adapter_mismatch")
    elif not authoritative_health_ready:
        blocked_reasons.append("sandbox_probe_execution_authoritative_health_not_ready")

    recorded = _coerce_optional_datetime(
        recorded_at,
        error_code="execution_adapter_sandbox_probe_execution_recorded_at_invalid",
        fallback=datetime.now(timezone.utc),
    )
    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return ExecutionAdapterSandboxProbeExecutionResult(
        sandbox_probe_execution_id=str(
            sandbox_probe_execution_id
            or f"execution-adapter-sandbox-probe-execution-{sandbox_probe_plan_id}-{uuid4()}"
        ),
        sandbox_probe_plan_id=sandbox_probe_plan_id,
        human_confirmation_id=human_confirmation_id,
        orchestration_execution_id=orchestration_execution_id,
        dry_run_id=dry_run_id,
        acceptance_id=acceptance_id,
        execution_id=execution_id,
        plan_id=plan_id,
        binding_id=binding_id,
        materialization_id=materialization_id,
        manifest_validation_id=manifest_validation_id,
        adapter_id=plan_adapter_id,
        market=market,
        route=route,
        status="blocked" if unique_blocked_reasons else "probe_execution_recorded",
        operator=str(operator or "local-operator").strip() or "local-operator",
        recorded_at=recorded or datetime.now(timezone.utc),
        probe_execution_mode=normalized_probe_execution_mode,
        probe_mode=probe_mode,
        confirmation_mode=confirmation_mode,
        orchestration_execution_mode=orchestration_execution_mode,
        orchestration_mode=orchestration_mode,
        acceptance_mode=acceptance_mode,
        execution_mode=execution_mode,
        reload_mode=reload_mode,
        maintenance_window_id=maintenance_window_id,
        binding_mode=binding_mode,
        manifest_path=manifest_path,
        required_env_vars=required_env_vars,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata={
            **_redact_secret_fields(metadata or {}),
            **({"authoritativeHealthProbe": health_evidence} if health_evidence else {}),
        },
        live_trading_allowed=False,
    )


def execution_adapter_sandbox_probe_execution_to_payload(
    result: ExecutionAdapterSandboxProbeExecutionResult,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
        "sandboxProbePlanId": result.sandbox_probe_plan_id,
        "humanConfirmationId": result.human_confirmation_id,
        "orchestrationExecutionId": result.orchestration_execution_id,
        "dryRunId": result.dry_run_id,
        "acceptanceId": result.acceptance_id,
        "executionId": result.execution_id,
        "planId": result.plan_id,
        "bindingId": result.binding_id,
        "materializationId": result.materialization_id,
        "manifestValidationId": result.manifest_validation_id,
        "adapterId": result.adapter_id,
        "market": result.market,
        "route": result.route,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "probeExecutionMode": result.probe_execution_mode,
        "probeMode": result.probe_mode,
        "confirmationMode": result.confirmation_mode,
        "orchestrationExecutionMode": result.orchestration_execution_mode,
        "orchestrationMode": result.orchestration_mode,
        "acceptanceMode": result.acceptance_mode,
        "executionMode": result.execution_mode,
        "reloadMode": result.reload_mode,
        "maintenanceWindowId": result.maintenance_window_id,
        "bindingMode": result.binding_mode,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": list(result.required_env_vars),
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def execution_adapter_sandbox_probe_execution_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "execution_adapter_sandbox_probe_execution":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    sandbox_probe_execution_id = str(metadata.get("sandboxProbeExecutionId") or getattr(event, "event_id", "")).strip()
    sandbox_probe_plan_id = str(metadata.get("sandboxProbePlanId") or "").strip()
    human_confirmation_id = str(metadata.get("humanConfirmationId") or "").strip()
    orchestration_execution_id = str(metadata.get("orchestrationExecutionId") or "").strip()
    dry_run_id = str(metadata.get("dryRunId") or "").strip()
    acceptance_id = str(metadata.get("acceptanceId") or "").strip()
    execution_id = str(metadata.get("executionId") or "").strip()
    plan_id = str(metadata.get("planId") or "").strip()
    binding_id = str(metadata.get("bindingId") or "").strip()
    materialization_id = str(metadata.get("materializationId") or "").strip()
    manifest_validation_id = str(metadata.get("manifestValidationId") or "").strip()
    adapter_id = str(metadata.get("adapterId") or "").strip()
    market = str(metadata.get("market") or "").strip()
    route = str(metadata.get("route") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    probe_execution_mode = str(metadata.get("probeExecutionMode") or "manual_readonly_sandbox_probe").strip()
    probe_mode = str(metadata.get("probeMode") or "").strip()
    confirmation_mode = str(metadata.get("confirmationMode") or "").strip()
    orchestration_execution_mode = str(metadata.get("orchestrationExecutionMode") or "").strip()
    orchestration_mode = str(metadata.get("orchestrationMode") or "").strip()
    acceptance_mode = str(metadata.get("acceptanceMode") or "").strip()
    execution_mode = str(metadata.get("executionMode") or "").strip()
    reload_mode = str(metadata.get("reloadMode") or "").strip()
    maintenance_window_id = str(metadata.get("maintenanceWindowId") or "").strip()
    binding_mode = str(metadata.get("bindingMode") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    if (
        not sandbox_probe_execution_id
        or not sandbox_probe_plan_id
        or not human_confirmation_id
        or not orchestration_execution_id
        or not dry_run_id
        or not acceptance_id
        or not execution_id
        or not plan_id
        or not binding_id
        or not materialization_id
    ):
        return None
    if not adapter_id:
        return None
    if route not in {"paper", "live"}:
        return None
    if status not in {"blocked", "probe_execution_recorded"}:
        return None
    required_env_vars = [
        str(name).strip()
        for name in metadata.get("requiredEnvVars", [])
        if isinstance(name, str) and name.strip()
    ]
    confirmed_ids = {
        str(item)
        for item in metadata.get("confirmedConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_ids = {
        str(item)
        for item in metadata.get("requiredConfirmationIds", [])
        if isinstance(item, str) and item.strip()
    }
    required_confirmations = []
    for confirmation_id, _payload_key, label, _blocked_reason in _execution_adapter_sandbox_probe_execution_specs():
        if required_ids and confirmation_id not in required_ids:
            continue
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmation_id in confirmed_ids else "missing",
            }
        )

    recorded_at = getattr(event, "created_at", None)
    if isinstance(recorded_at, datetime):
        recorded_at_value = recorded_at.isoformat()
    else:
        recorded_at_value = datetime.now(timezone.utc).isoformat()

    result = {
        "schemaVersion": 1,
        "sandboxProbeExecutionId": sandbox_probe_execution_id,
        "sandboxProbePlanId": sandbox_probe_plan_id,
        "humanConfirmationId": human_confirmation_id,
        "orchestrationExecutionId": orchestration_execution_id,
        "dryRunId": dry_run_id,
        "acceptanceId": acceptance_id,
        "executionId": execution_id,
        "planId": plan_id,
        "bindingId": binding_id,
        "materializationId": materialization_id,
        "manifestValidationId": manifest_validation_id,
        "adapterId": adapter_id,
        "market": market,
        "route": route,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "probeExecutionMode": probe_execution_mode,
        "probeMode": probe_mode,
        "confirmationMode": confirmation_mode,
        "orchestrationExecutionMode": orchestration_execution_mode,
        "orchestrationMode": orchestration_mode,
        "acceptanceMode": acceptance_mode,
        "executionMode": execution_mode,
        "reloadMode": reload_mode,
        "maintenanceWindowId": maintenance_window_id,
        "bindingMode": binding_mode,
        "manifestPath": manifest_path,
        "requiredEnvVars": required_env_vars,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": [
            str(reason)
            for reason in metadata.get("blockedReasons", [])
            if isinstance(reason, str) and reason.strip()
        ],
        "metadata": _redact_secret_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }
    health_evidence = result["metadata"].get("authoritativeHealthProbe")
    if health_evidence is not None:
        try:
            validated_health_evidence = validate_execution_adapter_health_probe_evidence(health_evidence)
        except ValueError:
            return None
        if not _execution_adapter_authoritative_health_ready(
            validated_health_evidence, adapter_id=adapter_id, market=market
        ) and status == "probe_execution_recorded":
            return None
    elif status == "probe_execution_recorded":
        return None
    return result


def execution_adapter_sandbox_probe_execution_to_audit_event_payload(
    result: ExecutionAdapterSandboxProbeExecutionResult,
) -> dict[str, Any]:
    status_label = "blocked" if result.status == "blocked" else "recorded"
    return {
        "schemaVersion": 1,
        "eventId": result.sandbox_probe_execution_id,
        "eventType": "execution_adapter_sandbox_probe_execution",
        "runId": "",
        "createdAt": result.recorded_at.isoformat(),
        "stage": "execution-adapter-sandbox-probe-execution",
        "source": "execution-adapter-ledger",
        "summary": f"{result.adapter_id} adapter sandbox probe execution {status_label} as {result.status}.",
        "detail": "Sandbox probe execution records read-only handshake and order-schema evidence only; order submission and live trading remain blocked.",
        "metadata": _redact_secret_fields(
            {
                "sandboxProbeExecutionId": result.sandbox_probe_execution_id,
                "sandboxProbePlanId": result.sandbox_probe_plan_id,
                "humanConfirmationId": result.human_confirmation_id,
                "orchestrationExecutionId": result.orchestration_execution_id,
                "dryRunId": result.dry_run_id,
                "acceptanceId": result.acceptance_id,
                "executionId": result.execution_id,
                "planId": result.plan_id,
                "bindingId": result.binding_id,
                "materializationId": result.materialization_id,
                "manifestValidationId": result.manifest_validation_id,
                "adapterId": result.adapter_id,
                "market": result.market,
                "route": result.route,
                "status": result.status,
                "operator": result.operator,
                "recordedAt": result.recorded_at.isoformat(),
                "probeExecutionMode": result.probe_execution_mode,
                "probeMode": result.probe_mode,
                "confirmationMode": result.confirmation_mode,
                "orchestrationExecutionMode": result.orchestration_execution_mode,
                "orchestrationMode": result.orchestration_mode,
                "acceptanceMode": result.acceptance_mode,
                "executionMode": result.execution_mode,
                "reloadMode": result.reload_mode,
                "maintenanceWindowId": result.maintenance_window_id,
                "bindingMode": result.binding_mode,
                "manifestPath": result.manifest_path,
                "requiredEnvVars": list(result.required_env_vars),
                "blockedReasons": result.blocked_reasons,
                "requiredConfirmationIds": [item["id"] for item in result.required_confirmations],
                "confirmedConfirmationIds": [
                    item["id"] for item in result.required_confirmations if item.get("status") == "confirmed"
                ],
                "metadata": result.metadata,
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _execution_adapter_sandbox_probe_execution_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "probe-plan-reviewed",
            "probePlanReviewed",
            "Sandbox probe plan was reviewed before execution evidence was recorded",
            "sandbox_probe_execution_plan_not_reviewed",
        ),
        (
            "readonly-handshake-captured",
            "readonlyHandshakeCaptured",
            "Read-only sandbox or testnet handshake evidence was captured",
            "sandbox_probe_execution_readonly_handshake_missing",
        ),
        (
            "account-snapshot-redacted",
            "accountSnapshotRedacted",
            "Account snapshot evidence is redacted and contains no secret values",
            "sandbox_probe_execution_account_snapshot_not_redacted",
        ),
        (
            "order-schema-validated",
            "orderSchemaValidated",
            "Order schema validation was performed without submitting an order",
            "sandbox_probe_execution_order_schema_not_validated",
        ),
        (
            "operator-confirmed-no-orders-submitted",
            "operatorConfirmedNoOrdersSubmitted",
            "Operator confirmed no sandbox, paper, or live orders were submitted",
            "sandbox_probe_execution_no_order_boundary_missing",
        ),
    ]


def _execution_adapter_authoritative_health_ready(
    evidence: dict[str, Any] | None,
    *,
    adapter_id: str,
    market: str,
) -> bool:
    if not evidence:
        return False
    checks = {row["id"]: row["status"] for row in evidence["checks"]}
    return bool(
        adapter_id == "ccxt-live"
        and evidence["adapterId"] == "ccxt-live"
        and market == "crypto"
        and evidence["status"] == "ready"
        and evidence["accountSyncState"] == "ready"
        and not evidence["blockedReasons"]
        and all(
            checks.get(check_id) == "passed"
            for check_id in ("sandbox-mode", "markets-loaded", "account-sync", "order-routing-disabled")
        )
    )
