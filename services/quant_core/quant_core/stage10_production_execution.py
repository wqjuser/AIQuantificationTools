from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
import sqlite3
from typing import Any, Callable

from quant_core.audit_events import AuditEventStore
from quant_core.binance_spot_orders import (
    binance_spot_account_identity_fingerprint,
    check_spot_account_coverage,
    create_spot_market_order,
    fetch_spot_order,
    order_not_found as _order_not_found,
    prepare_spot_market_order,
    positive_int as _positive_int,
    positive_number as _positive_number,
)
from quant_core.execution_adapter_health import probe_ccxt_production_readonly
from quant_core.stage9_production_admission import (
    validate_production_order_admission_candidate,
    validate_production_order_admission_review,
)
PRODUCTION_EXECUTION_CONFIRMATION_IDS = [
    "real-funds-risk-understood",
    "stage9-candidate-and-review-verified",
    "dedicated-production-trading-credential-isolated",
    "withdrawal-and-transfer-disabled",
    "production-kill-switch-required-before-live-route",
]
_ATTEMPT_BLOCKER = "stage10_production_route_not_implemented"
_PREFLIGHT_TTL = timedelta(minutes=10)
_PERMISSION_VERIFICATION_TTL = timedelta(minutes=5)
_ACCOUNT_LEASE_TTL = timedelta(minutes=5)
_TRADING_API_KEY_ENV = "CCXT_PRODUCTION_TRADING_API_KEY"
_TRADING_SECRET_ENV = "CCXT_PRODUCTION_TRADING_SECRET"
_LIVE_MODE_ENV = "AIQT_ENABLE_PRODUCTION_TRADING"
_CCXT_UNSET = object()
_BOUNDARY = {
    "deterministicOnly": True,
    "productionTradingCredentialsRead": False,
    "productionNetworkAccessed": False,
    "orderSubmissionEnabled": False,
    "orderRoutingEnabled": False,
    "liveTradingAllowed": False,
    "liveOrderSubmitted": False,
    "liveRouteExecuted": False,
    "liveBlockedBoundary": True,
}


def build_production_trading_credential_preflight(
    *,
    environ: dict[str, str] | None = None,
    operator: str,
    checked_at: str | None = None,
) -> dict[str, Any]:
    env = environ if environ is not None else os.environ
    operator = operator.strip() if isinstance(operator, str) else ""
    if not operator:
        raise ValueError("stage10_production_trading_credential_preflight_operator_required")
    checked = _utc(checked_at or datetime.now(timezone.utc).isoformat())
    api_key = str(env.get(_TRADING_API_KEY_ENV, "")).strip()
    secret = str(env.get(_TRADING_SECRET_ENV, "")).strip()
    readonly_values = {
        str(env.get("CCXT_PRODUCTION_READONLY_API_KEY", "")).strip(),
        str(env.get("CCXT_PRODUCTION_READONLY_SECRET", "")).strip(),
    } - {""}
    sandbox_values = {
        str(env.get("CCXT_SANDBOX_API_KEY", "")).strip(),
        str(env.get("CCXT_SANDBOX_SECRET", "")).strip(),
    } - {""}
    configured = bool(api_key and secret)
    isolated_from_readonly = configured and api_key not in readonly_values and secret not in readonly_values
    isolated_from_sandbox = configured and api_key not in sandbox_values and secret not in sandbox_values
    spot_only = (str(env.get("CCXT_DEFAULT_TYPE", "spot")).strip().lower() or "spot") == "spot"
    blockers = []
    if not configured:
        blockers.append("stage10_production_trading_credentials_missing")
    if configured and (not isolated_from_readonly or not isolated_from_sandbox):
        blockers.append("stage10_production_trading_credentials_not_isolated")
    if not spot_only:
        blockers.append("stage10_production_spot_required")
    body = {
        "kind": "aiqt.stage10ProductionTradingCredentialPreflight",
        "schemaVersion": 1,
        "checkedAt": checked.isoformat(),
        "expiresAt": (checked + _PREFLIGHT_TTL).isoformat(),
        "operator": operator,
        "status": "blocked" if blockers else "configured_offline",
        "apiKeySource": _TRADING_API_KEY_ENV if api_key else None,
        "secretSource": _TRADING_SECRET_ENV if secret else None,
        "apiKeyConfigured": bool(api_key),
        "secretConfigured": bool(secret),
        "isolatedFromReadOnly": isolated_from_readonly,
        "isolatedFromSandbox": isolated_from_sandbox,
        "spotOnly": spot_only,
        "permissionsVerified": False,
        "credentialMaterialInspectedLocally": True,
        "credentialMaterialPersisted": False,
        "networkCallCount": 0,
        "blockedReasons": blockers,
        "productionAuthorizationEffective": False,
        "productionNetworkAccessed": False,
        "orderSubmissionEnabled": False,
        "liveTradingAllowed": False,
        "liveOrderSubmitted": False,
        "liveRouteExecuted": False,
        "liveBlockedBoundary": True,
    }
    identity = _hash(body)
    value = {
        **body,
        "preflightId": f"stage10-production-execution-credential-preflight-{identity[:24]}",
    }
    value["preflightHash"] = _hash(value)
    return validate_production_trading_credential_preflight(value)


def validate_production_trading_credential_preflight(value: Any) -> dict[str, Any]:
    fields = {
        "kind",
        "schemaVersion",
        "preflightId",
        "preflightHash",
        "checkedAt",
        "expiresAt",
        "operator",
        "status",
        "apiKeySource",
        "secretSource",
        "apiKeyConfigured",
        "secretConfigured",
        "isolatedFromReadOnly",
        "isolatedFromSandbox",
        "spotOnly",
        "permissionsVerified",
        "credentialMaterialInspectedLocally",
        "credentialMaterialPersisted",
        "networkCallCount",
        "blockedReasons",
        "productionAuthorizationEffective",
        "productionNetworkAccessed",
        "orderSubmissionEnabled",
        "liveTradingAllowed",
        "liveOrderSubmitted",
        "liveRouteExecuted",
        "liveBlockedBoundary",
    }
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("stage10_production_trading_credential_preflight_fields_invalid")
    if (
        value["kind"] != "aiqt.stage10ProductionTradingCredentialPreflight"
        or value["schemaVersion"] != 1
        or value["status"] not in {"configured_offline", "blocked"}
        or not isinstance(value["operator"], str)
        or not value["operator"].strip()
        or not isinstance(value["preflightId"], str)
        or not value["preflightId"].startswith(
            "stage10-production-execution-credential-preflight-"
        )
        or not _is_hash(value["preflightHash"])
    ):
        raise ValueError("stage10_production_trading_credential_preflight_schema_invalid")
    checked = _utc(value["checkedAt"])
    if _utc(value["expiresAt"]) != checked + _PREFLIGHT_TTL:
        raise ValueError("stage10_production_trading_credential_preflight_time_invalid")
    for field in (
        "apiKeyConfigured",
        "secretConfigured",
        "isolatedFromReadOnly",
        "isolatedFromSandbox",
        "spotOnly",
    ):
        if type(value[field]) is not bool:
            raise ValueError("stage10_production_trading_credential_preflight_flags_invalid")
    if (
        value["apiKeySource"] != (_TRADING_API_KEY_ENV if value["apiKeyConfigured"] else None)
        or value["secretSource"] != (_TRADING_SECRET_ENV if value["secretConfigured"] else None)
        or value["permissionsVerified"] is not False
        or value["credentialMaterialInspectedLocally"] is not True
        or value["credentialMaterialPersisted"] is not False
        or value["networkCallCount"] != 0
        or value["productionAuthorizationEffective"] is not False
        or value["productionNetworkAccessed"] is not False
        or value["orderSubmissionEnabled"] is not False
        or value["liveTradingAllowed"] is not False
        or value["liveOrderSubmitted"] is not False
        or value["liveRouteExecuted"] is not False
        or value["liveBlockedBoundary"] is not True
        or not isinstance(value["blockedReasons"], list)
        or any(not isinstance(item, str) or not item for item in value["blockedReasons"])
        or (value["status"] == "configured_offline" and value["blockedReasons"])
        or (value["status"] == "blocked" and not value["blockedReasons"])
        or (
            value["status"] == "configured_offline"
            and not all(
                value[field]
                for field in (
                    "apiKeyConfigured",
                    "secretConfigured",
                    "isolatedFromReadOnly",
                    "isolatedFromSandbox",
                    "spotOnly",
                )
            )
        )
    ):
        raise ValueError("stage10_production_trading_credential_preflight_boundary_invalid")
    expected_id = (
        "stage10-production-execution-credential-preflight-"
        + _hash(
            {
                key: item
                for key, item in value.items()
                if key not in {"preflightId", "preflightHash"}
            }
        )[:24]
    )
    if value["preflightId"] != expected_id or value["preflightHash"] != _hash(
        {key: item for key, item in value.items() if key != "preflightHash"}
    ):
        raise ValueError("stage10_production_trading_credential_preflight_hash_invalid")
    return json.loads(json.dumps(value))


def production_trading_credential_preflight_to_audit_event(
    value: dict[str, Any],
) -> dict[str, Any]:
    preflight = validate_production_trading_credential_preflight(value)
    return {
        "schemaVersion": 1,
        "eventId": preflight["preflightId"],
        "eventType": "stage10_production_trading_credential_preflight",
        "runId": "",
        "createdAt": preflight["checkedAt"],
        "stage": "stage10-production-trading-credential-preflight",
        "source": preflight["operator"],
        "summary": f"Stage 10 production trading credential preflight {preflight['status']}.",
        "detail": "Only local configuration isolation was checked; permissions and production access remain unverified.",
        "metadata": {"snapshot": preflight},
    }


def production_trading_credential_preflight_from_audit_event(
    event: Any,
) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "stage10_production_trading_credential_preflight":
        return None
    metadata = getattr(event, "metadata", None)
    try:
        return validate_production_trading_credential_preflight(
            metadata.get("snapshot") if isinstance(metadata, dict) else None
        )
    except ValueError:
        return None


def build_production_trading_permission_verification(
    credential_preflight: dict[str, Any],
    *,
    environ: dict[str, str] | None = None,
    operator: str,
    exchange_factory: Any = None,
    verified_at: str | None = None,
) -> dict[str, Any]:
    preflight = validate_production_trading_credential_preflight(credential_preflight)
    env = dict(environ if environ is not None else os.environ)
    operator = operator.strip() if isinstance(operator, str) else ""
    if not operator:
        raise ValueError("stage10_production_trading_permission_verification_operator_required")
    verified = _utc(verified_at or datetime.now(timezone.utc).isoformat())
    if (
        preflight["status"] != "configured_offline"
        or not _utc(preflight["checkedAt"]) <= verified <= _utc(preflight["expiresAt"])
    ):
        raise ValueError("stage10_production_trading_credential_preflight_expired")
    current = build_production_trading_credential_preflight(
        environ=env,
        operator=str(preflight["operator"]),
        checked_at=str(preflight["checkedAt"]),
    )
    if current != preflight:
        raise ValueError("stage10_production_trading_credential_configuration_changed")

    env["CCXT_PRODUCTION_READONLY_API_KEY"] = str(
        env.get(_TRADING_API_KEY_ENV, "")
    ).strip()
    env["CCXT_PRODUCTION_READONLY_SECRET"] = str(
        env.get(_TRADING_SECRET_ENV, "")
    ).strip()
    probe = probe_ccxt_production_readonly(
        adapter_id="stage10-production-trading-permission-verification",
        exchange_id="binance",
        environ=env,
        exchange_factory=exchange_factory,
        generated_at=verified,
    )
    permissions = {
        key: value is True
        for key, value in (
            probe.metadata.get("apiPermissions", {})
            if isinstance(probe.metadata.get("apiPermissions"), dict)
            else {}
        ).items()
    }
    expected_permission_fields = {
        "readingEnabled",
        "spotTradingEnabled",
        "marginTradingEnabled",
        "futuresTradingEnabled",
        "optionsTradingEnabled",
        "withdrawalsEnabled",
        "internalTransferEnabled",
        "universalTransferEnabled",
    }
    permissions = {
        field: permissions.get(field, False)
        for field in sorted(expected_permission_fields)
    }
    authoritative = probe.metadata.get("permissionsAuthoritative") is True
    unsafe = any(
        permissions[field]
        for field in (
            "marginTradingEnabled",
            "futuresTradingEnabled",
            "optionsTradingEnabled",
            "withdrawalsEnabled",
            "internalTransferEnabled",
            "universalTransferEnabled",
        )
    )
    blockers = []
    if "production_readonly_permission_check_failed" in probe.blocked_reasons:
        blockers.append("stage10_production_trading_permission_check_failed")
    elif "production_readonly_binance_region_restricted" in probe.blocked_reasons:
        blockers.append("stage10_production_binance_region_restricted")
    elif "production_readonly_load_markets_failed" in probe.blocked_reasons:
        blockers.append("stage10_production_market_access_failed")
    elif not probe.capabilities.get("apiRestrictions"):
        blockers.append("stage10_production_trading_permission_endpoint_unavailable")
    elif not authoritative:
        blockers.append("stage10_production_trading_permissions_incomplete")
    elif not permissions["readingEnabled"] or not permissions["spotTradingEnabled"] or unsafe:
        blockers.append("stage10_production_trading_permissions_invalid")
    body = {
        "kind": "aiqt.stage10ProductionTradingPermissionVerification",
        "schemaVersion": 1,
        "preflightId": preflight["preflightId"],
        "preflightHash": preflight["preflightHash"],
        "verifiedAt": verified.isoformat(),
        "expiresAt": (verified + _PERMISSION_VERIFICATION_TTL).isoformat(),
        "operator": operator,
        "status": "blocked" if blockers else "verified",
        "exchangeId": "binance",
        "marketCount": probe.market_count,
        "permissionEndpointVerified": bool(probe.capabilities.get("apiRestrictions")),
        "permissionsAuthoritative": authoritative,
        "permissions": permissions,
        "blockedReasons": blockers,
        "credentialMaterialInspectedLocally": True,
        "credentialMaterialPersisted": False,
        "productionTradingCredentialsRead": True,
        "productionNetworkAccessed": bool(
            probe.market_count or probe.capabilities.get("apiRestrictions")
        ),
        "mutationCallCount": 0,
        "orderSubmissionEnabled": False,
        "productionAuthorizationEffective": False,
        "liveTradingAllowed": False,
        "liveOrderSubmitted": False,
        "liveRouteExecuted": False,
        "liveBlockedBoundary": True,
    }
    identity = _hash(body)
    value = {
        **body,
        "verificationId": (
            f"stage10-production-execution-permission-verification-{identity[:24]}"
        ),
    }
    value["verificationHash"] = _hash(value)
    return validate_production_trading_permission_verification(value)


def validate_production_trading_permission_verification(value: Any) -> dict[str, Any]:
    fields = {
        "kind",
        "schemaVersion",
        "verificationId",
        "verificationHash",
        "preflightId",
        "preflightHash",
        "verifiedAt",
        "expiresAt",
        "operator",
        "status",
        "exchangeId",
        "marketCount",
        "permissionEndpointVerified",
        "permissionsAuthoritative",
        "permissions",
        "blockedReasons",
        "credentialMaterialInspectedLocally",
        "credentialMaterialPersisted",
        "productionTradingCredentialsRead",
        "productionNetworkAccessed",
        "mutationCallCount",
        "orderSubmissionEnabled",
        "productionAuthorizationEffective",
        "liveTradingAllowed",
        "liveOrderSubmitted",
        "liveRouteExecuted",
        "liveBlockedBoundary",
    }
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("stage10_production_trading_permission_verification_fields_invalid")
    if (
        value["kind"] != "aiqt.stage10ProductionTradingPermissionVerification"
        or value["schemaVersion"] != 1
        or value["status"] not in {"verified", "blocked"}
        or value["exchangeId"] != "binance"
        or not isinstance(value["verificationId"], str)
        or not value["verificationId"].startswith(
            "stage10-production-execution-permission-verification-"
        )
        or not _is_hash(value["verificationHash"])
        or not isinstance(value["preflightId"], str)
        or not value["preflightId"].startswith(
            "stage10-production-execution-credential-preflight-"
        )
        or not _is_hash(value["preflightHash"])
        or not isinstance(value["operator"], str)
        or not value["operator"].strip()
        or not isinstance(value["marketCount"], int)
        or isinstance(value["marketCount"], bool)
        or value["marketCount"] < 0
    ):
        raise ValueError("stage10_production_trading_permission_verification_schema_invalid")
    verified = _utc(value["verifiedAt"])
    if _utc(value["expiresAt"]) != verified + _PERMISSION_VERIFICATION_TTL:
        raise ValueError("stage10_production_trading_permission_verification_time_invalid")
    permission_fields = {
        "readingEnabled",
        "spotTradingEnabled",
        "marginTradingEnabled",
        "futuresTradingEnabled",
        "optionsTradingEnabled",
        "withdrawalsEnabled",
        "internalTransferEnabled",
        "universalTransferEnabled",
    }
    if (
        not isinstance(value["permissions"], dict)
        or set(value["permissions"]) != permission_fields
        or any(type(item) is not bool for item in value["permissions"].values())
        or type(value["permissionEndpointVerified"]) is not bool
        or type(value["permissionsAuthoritative"]) is not bool
        or not isinstance(value["blockedReasons"], list)
        or any(not isinstance(item, str) or not item for item in value["blockedReasons"])
        or (value["status"] == "verified" and value["blockedReasons"])
        or (value["status"] == "blocked" and not value["blockedReasons"])
    ):
        raise ValueError("stage10_production_trading_permission_verification_permissions_invalid")
    permissions = value["permissions"]
    if value["status"] == "verified" and (
        value["permissionEndpointVerified"] is not True
        or value["permissionsAuthoritative"] is not True
        or permissions["readingEnabled"] is not True
        or permissions["spotTradingEnabled"] is not True
        or any(
            permissions[field]
            for field in permission_fields
            - {"readingEnabled", "spotTradingEnabled"}
        )
    ):
        raise ValueError("stage10_production_trading_permission_verification_authority_invalid")
    if (
        value["credentialMaterialInspectedLocally"] is not True
        or value["credentialMaterialPersisted"] is not False
        or value["productionTradingCredentialsRead"] is not True
        or type(value["productionNetworkAccessed"]) is not bool
        or value["mutationCallCount"] != 0
        or value["orderSubmissionEnabled"] is not False
        or value["productionAuthorizationEffective"] is not False
        or value["liveTradingAllowed"] is not False
        or value["liveOrderSubmitted"] is not False
        or value["liveRouteExecuted"] is not False
        or value["liveBlockedBoundary"] is not True
    ):
        raise ValueError("stage10_production_trading_permission_verification_boundary_invalid")
    expected_id = (
        "stage10-production-execution-permission-verification-"
        + _hash(
            {
                key: item
                for key, item in value.items()
                if key not in {"verificationId", "verificationHash"}
            }
        )[:24]
    )
    if value["verificationId"] != expected_id or value["verificationHash"] != _hash(
        {key: item for key, item in value.items() if key != "verificationHash"}
    ):
        raise ValueError("stage10_production_trading_permission_verification_hash_invalid")
    return json.loads(json.dumps(value))


def production_trading_permission_verification_to_audit_event(
    value: dict[str, Any],
) -> dict[str, Any]:
    verification = validate_production_trading_permission_verification(value)
    return {
        "schemaVersion": 1,
        "eventId": verification["verificationId"],
        "eventType": "stage10_production_trading_permission_verification",
        "runId": "",
        "createdAt": verification["verifiedAt"],
        "stage": "stage10-production-trading-permission-verification",
        "source": verification["operator"],
        "summary": f"Stage 10 production trading permission verification {verification['status']}.",
        "detail": "The check reads Binance API restrictions only; order, transfer, and withdrawal mutations remain disabled.",
        "metadata": {"snapshot": verification},
    }


def production_trading_permission_verification_from_audit_event(
    event: Any,
) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "stage10_production_trading_permission_verification":
        return None
    metadata = getattr(event, "metadata", None)
    try:
        return validate_production_trading_permission_verification(
            metadata.get("snapshot") if isinstance(metadata, dict) else None
        )
    except ValueError:
        return None


def build_production_execution_control(
    *,
    action: str,
    operator: str,
    reason: str,
    credential_preflight: dict[str, Any] | None = None,
    permission_verification: dict[str, Any] | None = None,
    previous_control_id: str | None = None,
    recorded_at: str | None = None,
) -> dict[str, Any]:
    action = action.strip() if isinstance(action, str) else ""
    operator = operator.strip() if isinstance(operator, str) else ""
    reason = reason.strip() if isinstance(reason, str) else ""
    if action not in {"revoke", "restore"} or not operator or not reason:
        raise ValueError("stage10_production_execution_control_request_invalid")
    recorded = _utc(recorded_at or datetime.now(timezone.utc).isoformat())
    preflight = (
        validate_production_trading_credential_preflight(credential_preflight)
        if credential_preflight is not None
        else None
    )
    verification = (
        validate_production_trading_permission_verification(permission_verification)
        if permission_verification is not None
        else None
    )
    if action == "restore" and (
        preflight is None
        or preflight["status"] != "configured_offline"
        or not _utc(preflight["checkedAt"]) <= recorded <= _utc(preflight["expiresAt"])
        or verification is None
        or verification["status"] != "verified"
        or verification["preflightId"] != preflight["preflightId"]
        or verification["preflightHash"] != preflight["preflightHash"]
        or not _utc(verification["verifiedAt"]) <= recorded <= _utc(verification["expiresAt"])
    ):
        raise ValueError("stage10_production_execution_control_permission_verification_required")
    if action == "revoke" and (preflight is not None or verification is not None):
        raise ValueError("stage10_production_execution_control_revoke_preflight_invalid")
    body = {
        "kind": "aiqt.stage10ProductionExecutionControl",
        "schemaVersion": 1,
        "action": action,
        "status": "revoked" if action == "revoke" else "active",
        "triggered": action == "revoke",
        "operator": operator,
        "reason": reason,
        "recordedAt": recorded.isoformat(),
        "credentialPreflightId": preflight["preflightId"] if preflight else None,
        "credentialPreflightHash": preflight["preflightHash"] if preflight else None,
        "permissionVerificationId": verification["verificationId"] if verification else None,
        "permissionVerificationHash": verification["verificationHash"] if verification else None,
        "previousControlId": previous_control_id,
        "deterministicGateActive": action == "restore",
        "productionAuthorizationEffective": False,
        **_BOUNDARY,
    }
    identity = _hash(body)
    value = {
        **body,
        "controlId": f"stage10-production-execution-control-{identity[:24]}",
    }
    value["controlHash"] = _hash(value)
    return validate_production_execution_control(value)


def validate_production_execution_control(value: Any) -> dict[str, Any]:
    fields = {
        "kind",
        "schemaVersion",
        "controlId",
        "controlHash",
        "action",
        "status",
        "triggered",
        "operator",
        "reason",
        "recordedAt",
        "credentialPreflightId",
        "credentialPreflightHash",
        "permissionVerificationId",
        "permissionVerificationHash",
        "previousControlId",
        "deterministicGateActive",
        "productionAuthorizationEffective",
        *_BOUNDARY,
    }
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("stage10_production_execution_control_fields_invalid")
    action = value["action"]
    if (
        value["kind"] != "aiqt.stage10ProductionExecutionControl"
        or value["schemaVersion"] != 1
        or action not in {"revoke", "restore"}
        or value["status"] != ("revoked" if action == "revoke" else "active")
        or value["triggered"] is not (action == "revoke")
        or value["deterministicGateActive"] is not (action == "restore")
        or value["productionAuthorizationEffective"] is not False
        or not isinstance(value["controlId"], str)
        or not value["controlId"].startswith("stage10-production-execution-control-")
        or not _is_hash(value["controlHash"])
    ):
        raise ValueError("stage10_production_execution_control_schema_invalid")
    for field in ("operator", "reason"):
        if not isinstance(value[field], str) or not value[field].strip():
            raise ValueError("stage10_production_execution_control_identity_invalid")
    if value["previousControlId"] is not None and (
        not isinstance(value["previousControlId"], str)
        or not value["previousControlId"].startswith("stage10-production-execution-control-")
    ):
        raise ValueError("stage10_production_execution_control_identity_invalid")
    if action == "restore":
        if (
            not isinstance(value["credentialPreflightId"], str)
            or not value["credentialPreflightId"].startswith(
                "stage10-production-execution-credential-preflight-"
            )
            or not _is_hash(value["credentialPreflightHash"])
            or not isinstance(value["permissionVerificationId"], str)
            or not value["permissionVerificationId"].startswith(
                "stage10-production-execution-permission-verification-"
            )
            or not _is_hash(value["permissionVerificationHash"])
        ):
            raise ValueError("stage10_production_execution_control_preflight_invalid")
    elif any(
        value[field] is not None
        for field in (
            "credentialPreflightId",
            "credentialPreflightHash",
            "permissionVerificationId",
            "permissionVerificationHash",
        )
    ):
        raise ValueError("stage10_production_execution_control_preflight_invalid")
    _utc(value["recordedAt"])
    _validate_boundary(value, "stage10_production_execution_control_boundary_invalid")
    expected_id = (
        "stage10-production-execution-control-"
        + _hash(
            {
                key: item
                for key, item in value.items()
                if key not in {"controlId", "controlHash"}
            }
        )[:24]
    )
    if value["controlId"] != expected_id or value["controlHash"] != _hash(
        {key: item for key, item in value.items() if key != "controlHash"}
    ):
        raise ValueError("stage10_production_execution_control_hash_invalid")
    return json.loads(json.dumps(value))


def production_execution_control_to_audit_event(value: dict[str, Any]) -> dict[str, Any]:
    control = validate_production_execution_control(value)
    return {
        "schemaVersion": 1,
        "eventId": control["controlId"],
        "eventType": "stage10_production_execution_control",
        "runId": "",
        "createdAt": control["recordedAt"],
        "stage": "stage10-production-execution-control",
        "source": control["operator"],
        "summary": f"Stage 10 deterministic execution control {control['status']}.",
        "detail": "The control never enables production credentials, network access, or order submission.",
        "metadata": {"snapshot": control},
    }


def production_execution_control_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "stage10_production_execution_control":
        return None
    metadata = getattr(event, "metadata", None)
    try:
        return validate_production_execution_control(
            metadata.get("snapshot") if isinstance(metadata, dict) else None
        )
    except ValueError:
        return None


def build_production_execution_authorization(
    candidate: dict[str, Any],
    review: dict[str, Any],
    *,
    operator: str,
    reason: str,
    confirmations: dict[str, Any],
    authorized_at: str | None = None,
) -> dict[str, Any]:
    candidate = validate_production_order_admission_candidate(candidate)
    review = validate_production_order_admission_review(review)
    operator = operator.strip() if isinstance(operator, str) else ""
    reason = reason.strip() if isinstance(reason, str) else ""
    if not operator or not reason:
        raise ValueError("stage10_production_execution_operator_and_reason_required")
    if (
        review["outcome"] != "approved"
        or review["baseRunId"] != candidate["baseRunId"]
        or review["candidateId"] != candidate["candidateId"]
        or review["candidateHash"] != candidate["candidateHash"]
        or review["stage8ContinuityHash"] != candidate["stage8ContinuityHash"]
    ):
        raise ValueError("stage10_approved_stage9_review_required")
    if not isinstance(confirmations, dict) or set(confirmations) != set(
        PRODUCTION_EXECUTION_CONFIRMATION_IDS
    ):
        raise ValueError("stage10_production_execution_confirmations_invalid")
    if any(confirmations[item] is not True for item in PRODUCTION_EXECUTION_CONFIRMATION_IDS):
        raise ValueError("stage10_production_execution_confirmations_incomplete")

    authorized = _utc(authorized_at or datetime.now(timezone.utc).isoformat())
    if not _utc(review["reviewedAt"]) <= authorized <= _utc(candidate["expiresAt"]):
        raise ValueError("stage10_production_execution_candidate_expired")
    orders = _production_orders(candidate)
    orders_hash = _hash(orders)
    authorization_id = _authorization_id(candidate["candidateHash"], review["reviewHash"], orders_hash)
    value = {
        "kind": "aiqt.stage10ProductionExecutionAuthorization",
        "schemaVersion": 1,
        "authorizationId": authorization_id,
        "authorizedAt": authorized.isoformat(),
        "expiresAt": candidate["expiresAt"],
        "baseRunId": candidate["baseRunId"],
        "candidateId": candidate["candidateId"],
        "candidateHash": candidate["candidateHash"],
        "admissionReviewId": review["reviewId"],
        "admissionReviewHash": review["reviewHash"],
        "stage8ContinuityHash": candidate["stage8ContinuityHash"],
        "orders": orders,
        "ordersHash": orders_hash,
        "operator": operator,
        "reason": reason,
        "confirmedScopeIds": list(PRODUCTION_EXECUTION_CONFIRMATION_IDS),
        "status": "deterministic_execution_authorized",
        "deterministicAuthorizationEffective": True,
        "productionAuthorizationEffective": False,
        **_BOUNDARY,
    }
    value["authorizationHash"] = _hash(value)
    return validate_production_execution_authorization(value)


def validate_production_execution_authorization(value: Any) -> dict[str, Any]:
    fields = {
        "kind",
        "schemaVersion",
        "authorizationId",
        "authorizationHash",
        "authorizedAt",
        "expiresAt",
        "baseRunId",
        "candidateId",
        "candidateHash",
        "admissionReviewId",
        "admissionReviewHash",
        "stage8ContinuityHash",
        "orders",
        "ordersHash",
        "operator",
        "reason",
        "confirmedScopeIds",
        "status",
        "deterministicAuthorizationEffective",
        "productionAuthorizationEffective",
        *_BOUNDARY,
    }
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("stage10_production_execution_authorization_fields_invalid")
    if (
        value["kind"] != "aiqt.stage10ProductionExecutionAuthorization"
        or value["schemaVersion"] != 1
        or value["status"] != "deterministic_execution_authorized"
        or value["confirmedScopeIds"] != PRODUCTION_EXECUTION_CONFIRMATION_IDS
        or value["deterministicAuthorizationEffective"] is not True
        or value["productionAuthorizationEffective"] is not False
    ):
        raise ValueError("stage10_production_execution_authorization_schema_invalid")
    for field in (
        "authorizationId",
        "baseRunId",
        "candidateId",
        "admissionReviewId",
        "operator",
        "reason",
    ):
        if not isinstance(value[field], str) or not value[field].strip():
            raise ValueError("stage10_production_execution_authorization_identity_invalid")
    for field in (
        "authorizationHash",
        "candidateHash",
        "admissionReviewHash",
        "stage8ContinuityHash",
        "ordersHash",
    ):
        if not _is_hash(value[field]):
            raise ValueError("stage10_production_execution_authorization_hash_invalid")
    if _utc(value["authorizedAt"]) > _utc(value["expiresAt"]):
        raise ValueError("stage10_production_execution_authorization_time_invalid")
    _validate_boundary(value, "stage10_production_execution_authorization_boundary_invalid")
    _validate_production_orders(value["orders"])
    if value["ordersHash"] != _hash(value["orders"]):
        raise ValueError("stage10_production_execution_orders_hash_invalid")
    expected_id = _authorization_id(
        value["candidateHash"], value["admissionReviewHash"], value["ordersHash"]
    )
    if value["authorizationId"] != expected_id:
        raise ValueError("stage10_production_execution_authorization_identity_invalid")
    if value["authorizationHash"] != _hash(
        {key: item for key, item in value.items() if key != "authorizationHash"}
    ):
        raise ValueError("stage10_production_execution_authorization_hash_invalid")
    return json.loads(json.dumps(value))


def production_execution_authorization_to_audit_event(
    value: dict[str, Any],
) -> dict[str, Any]:
    authorization = validate_production_execution_authorization(value)
    return {
        "schemaVersion": 1,
        "eventId": authorization["authorizationId"],
        "eventType": "stage10_production_execution_authorization",
        "runId": authorization["baseRunId"],
        "createdAt": authorization["authorizedAt"],
        "stage": "stage10-production-execution-authorization",
        "source": authorization["operator"],
        "summary": "Authorized the deterministic Stage 10 production execution path.",
        "detail": "Production credentials, network access, and order submission remain disabled.",
        "metadata": {"snapshot": authorization},
    }


def production_execution_authorization_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "stage10_production_execution_authorization":
        return None
    metadata = getattr(event, "metadata", None)
    try:
        return validate_production_execution_authorization(
            metadata.get("snapshot") if isinstance(metadata, dict) else None
        )
    except ValueError:
        return None


def build_production_execution_attempt(
    authorization: dict[str, Any],
    *,
    operator: str,
    attempted_at: str | None = None,
) -> dict[str, Any]:
    authorization = validate_production_execution_authorization(authorization)
    operator = operator.strip() if isinstance(operator, str) else ""
    if not operator:
        raise ValueError("stage10_production_execution_attempt_operator_required")
    attempted = _utc(attempted_at or datetime.now(timezone.utc).isoformat())
    if not _utc(authorization["authorizedAt"]) <= attempted <= _utc(authorization["expiresAt"]):
        raise ValueError("stage10_production_execution_authorization_expired")
    attempt_id = _attempt_id(authorization["authorizationHash"])
    value = {
        "kind": "aiqt.stage10ProductionExecutionAttempt",
        "schemaVersion": 1,
        "attemptId": attempt_id,
        "attemptedAt": attempted.isoformat(),
        "baseRunId": authorization["baseRunId"],
        "authorizationId": authorization["authorizationId"],
        "authorizationHash": authorization["authorizationHash"],
        "operator": operator,
        "status": "blocked_before_network",
        "adapterMode": "deterministic-fail-closed",
        "blocker": _ATTEMPT_BLOCKER,
        "networkCallCount": 0,
        "orders": [
            {
                **order,
                "state": "blocked_before_network",
                "attempt": 0,
                "exchangeEvidence": {},
                "blocker": _ATTEMPT_BLOCKER,
            }
            for order in authorization["orders"]
        ],
        **_BOUNDARY,
    }
    value["attemptHash"] = _hash(value)
    return validate_production_execution_attempt(value)


def validate_production_execution_attempt(value: Any) -> dict[str, Any]:
    fields = {
        "kind",
        "schemaVersion",
        "attemptId",
        "attemptHash",
        "attemptedAt",
        "baseRunId",
        "authorizationId",
        "authorizationHash",
        "operator",
        "status",
        "adapterMode",
        "blocker",
        "networkCallCount",
        "orders",
        *_BOUNDARY,
    }
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("stage10_production_execution_attempt_fields_invalid")
    if (
        value["kind"] != "aiqt.stage10ProductionExecutionAttempt"
        or value["schemaVersion"] != 1
        or value["status"] != "blocked_before_network"
        or value["adapterMode"] != "deterministic-fail-closed"
        or value["blocker"] != _ATTEMPT_BLOCKER
        or value["networkCallCount"] != 0
    ):
        raise ValueError("stage10_production_execution_attempt_schema_invalid")
    for field in ("attemptId", "baseRunId", "authorizationId", "operator"):
        if not isinstance(value[field], str) or not value[field].strip():
            raise ValueError("stage10_production_execution_attempt_identity_invalid")
    for field in ("attemptHash", "authorizationHash"):
        if not _is_hash(value[field]):
            raise ValueError("stage10_production_execution_attempt_hash_invalid")
    _utc(value["attemptedAt"])
    _validate_boundary(value, "stage10_production_execution_attempt_boundary_invalid")
    if (
        not isinstance(value["orders"], list)
        or len(value["orders"]) != 1
        or value["orders"][0].get("state") != "blocked_before_network"
        or value["orders"][0].get("attempt") != 0
        or value["orders"][0].get("exchangeEvidence") != {}
        or value["orders"][0].get("blocker") != _ATTEMPT_BLOCKER
    ):
        raise ValueError("stage10_production_execution_attempt_orders_invalid")
    _validate_production_orders(
        [
            {
                key: item
                for key, item in value["orders"][0].items()
                if key not in {"state", "attempt", "exchangeEvidence", "blocker"}
            }
        ]
    )
    if value["attemptId"] != _attempt_id(value["authorizationHash"]):
        raise ValueError("stage10_production_execution_attempt_identity_invalid")
    if value["attemptHash"] != _hash(
        {key: item for key, item in value.items() if key != "attemptHash"}
    ):
        raise ValueError("stage10_production_execution_attempt_hash_invalid")
    return json.loads(json.dumps(value))


def production_execution_attempt_to_audit_event(value: dict[str, Any]) -> dict[str, Any]:
    attempt = validate_production_execution_attempt(value)
    return {
        "schemaVersion": 1,
        "eventId": attempt["attemptId"],
        "eventType": "stage10_production_execution_attempt",
        "runId": attempt["baseRunId"],
        "createdAt": attempt["attemptedAt"],
        "stage": "stage10-production-execution-attempt",
        "source": attempt["operator"],
        "summary": "Blocked the deterministic Stage 10 execution attempt before network access.",
        "detail": "No production credential was read and no production order was submitted.",
        "metadata": {"snapshot": attempt},
    }


def production_execution_attempt_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "stage10_production_execution_attempt":
        return None
    metadata = getattr(event, "metadata", None)
    try:
        return validate_production_execution_attempt(
            metadata.get("snapshot") if isinstance(metadata, dict) else None
        )
    except ValueError:
        return None


class BinanceSpotProductionTradingRoute:
    def __init__(
        self,
        *,
        env: dict[str, str] | None = None,
        exchange_factory: Any = None,
        ccxt_module: Any = _CCXT_UNSET,
    ) -> None:
        self.env = dict(os.environ if env is None else env)
        self.exchange_factory = exchange_factory
        self.ccxt_module = ccxt_module
        self._exchange: Any | None = None

    def status(self) -> dict[str, bool]:
        return {
            "enabled": str(self.env.get(_LIVE_MODE_ENV, "")).strip().lower()
            in {"1", "true", "yes", "on"},
            "credentialsConfigured": bool(
                str(self.env.get(_TRADING_API_KEY_ENV, "")).strip()
                and str(self.env.get(_TRADING_SECRET_ENV, "")).strip()
            ),
        }

    def require_enabled(self) -> None:
        status = self.status()
        if not status["enabled"]:
            raise ValueError("stage10_production_live_mode_disabled")
        self._require_configured()

    def _require_configured(self) -> None:
        status = self.status()
        if not status["credentialsConfigured"]:
            raise ValueError("stage10_production_trading_credentials_missing")
        preflight = build_production_trading_credential_preflight(
            environ=self.env,
            operator="runtime-route",
        )
        if preflight["blockedReasons"]:
            raise ValueError(preflight["blockedReasons"][0])

    def exchange(self) -> Any:
        self.require_enabled()
        return self._exchange_client()

    def _reconciliation_exchange(self) -> Any:
        self._require_configured()
        return self._exchange_client()

    def account_identity_fingerprint(self) -> str:
        balance = self._reconciliation_exchange().fetch_balance()
        return binance_spot_account_identity_fingerprint(balance)

    def _exchange_client(self) -> Any:
        if self._exchange is not None:
            return self._exchange
        if (str(self.env.get("CCXT_DEFAULT_TYPE", "spot")).strip().lower() or "spot") != "spot":
            raise ValueError("stage10_production_spot_required")
        config: dict[str, Any] = {
            "apiKey": str(self.env[_TRADING_API_KEY_ENV]).strip(),
            "secret": str(self.env[_TRADING_SECRET_ENV]).strip(),
            "enableRateLimit": True,
            "timeout": _positive_int(self.env.get("CCXT_TIMEOUT"), 10_000),
            "options": {
                "defaultType": "spot",
                "fetchMarkets": {"types": ["spot"]},
                "fetchMargins": False,
            },
        }
        https_proxy = (
            self.env.get("HTTPS_PROXY") or self.env.get("https_proxy") or ""
        ).strip()
        if https_proxy:
            config["httpsProxy"] = https_proxy
        if self.exchange_factory is not None:
            exchange = self.exchange_factory("binance", config)
        else:
            ccxt = self._load_ccxt()
            exchange_class = getattr(ccxt, "binance", None)
            if exchange_class is None:
                raise RuntimeError("stage10_binance_exchange_unavailable")
            exchange = exchange_class(config)
        self._exchange = exchange
        return exchange

    def create_market_order(self, order: dict[str, Any]) -> dict[str, Any]:
        self._validate_new_order(order)
        return create_spot_market_order(
            self.exchange(),
            order,
            market_or_balance_error="stage10_auto_live_market_or_balance_unavailable",
            balance_error="stage10_production_balance_insufficient",
            max_buy_notional=10,
            notional_error="stage10_auto_live_order_notional_exceeded",
        )

    def prepare_market_order(self, order: dict[str, Any]) -> dict[str, Any]:
        self._validate_new_order(
            {"clientOrderId": "aiqt-auto-preflight", **order}
        )
        return prepare_spot_market_order(
            self.exchange(),
            order,
            market_or_balance_error="stage10_auto_live_market_or_balance_unavailable",
            balance_error="stage10_production_balance_insufficient",
            max_buy_notional=10,
            notional_error="stage10_auto_live_order_notional_exceeded",
        )

    def _validate_new_order(self, order: dict[str, Any]) -> None:
        requested_notional, risk_budget_notional = self._validate_order(order)
        if order["side"] == "buy" and (
            requested_notional > 10 or risk_budget_notional > 10
        ):
            raise ValueError("stage10_auto_live_order_notional_exceeded")

    def account_coverage(
        self,
        expected_position: float,
        required_quote: float,
    ) -> dict[str, Any]:
        return check_spot_account_coverage(
            self.exchange(),
            symbol="BTC/USDT",
            expected_base=expected_position,
            required_quote=required_quote,
        )

    def verify_current_restrictions(self) -> dict[str, bool]:
        exchange = self.exchange()
        reader = next(
            (
                getattr(exchange, name)
                for name in (
                    "sapi_get_account_apirestrictions",
                    "sapiGetAccountApiRestrictions",
                )
                if callable(getattr(exchange, name, None))
            ),
            None,
        )
        if reader is None:
            raise ValueError("stage10_production_trading_permission_endpoint_unavailable")
        restrictions = reader()
        if not isinstance(restrictions, dict):
            raise ValueError("stage10_production_trading_permissions_incomplete")
        unsafe = any(
            restrictions.get(field) is True
            for field in (
                "enableMargin",
                "enableFutures",
                "enableVanillaOptions",
                "enableWithdrawals",
                "enableInternalTransfer",
                "permitsUniversalTransfer",
            )
        )
        if (
            restrictions.get("enableReading") is not True
            or restrictions.get("enableSpotAndMarginTrading") is not True
            or restrictions.get("ipRestrict") is not True
            or unsafe
        ):
            raise ValueError("stage10_production_trading_permissions_or_ip_invalid")
        return {
            "readingEnabled": True,
            "spotTradingEnabled": True,
            "ipRestricted": True,
            "dangerousPermissionsDisabled": True,
        }

    @staticmethod
    def _validate_order(order: dict[str, Any]) -> tuple[float, float]:
        required = {
            "clientOrderId",
            "symbol",
            "side",
            "quantity",
            "referencePrice",
            "notionalValue",
            "riskBudgetNotional",
        }
        if (
            not isinstance(order, dict)
            or set(order) != required
            or order["symbol"] != "BTC/USDT"
            or order["side"] not in {"buy", "sell"}
            or not isinstance(order["clientOrderId"], str)
            or not 1 <= len(order["clientOrderId"]) <= 36
            or any(
                not (character.isalnum() or character in "-_.")
                for character in order["clientOrderId"]
            )
        ):
            raise ValueError("stage10_auto_live_order_invalid")
        requested_notional = _positive_number(order["notionalValue"], "notionalValue")
        risk_budget_notional = _positive_number(
            order["riskBudgetNotional"],
            "riskBudgetNotional",
        )
        _positive_number(order["quantity"], "quantity")
        _positive_number(order["referencePrice"], "referencePrice")
        return requested_notional, risk_budget_notional

    def fetch_order(
        self,
        order: dict[str, Any],
        exchange_order_id: str | None = None,
    ) -> dict[str, Any]:
        self._validate_order(order)
        return fetch_spot_order(self.exchange(), order, exchange_order_id)

    def fetch_order_for_reconciliation(
        self,
        order: dict[str, Any],
        exchange_order_id: str | None = None,
    ) -> dict[str, Any]:
        self._validate_order(order)
        return fetch_spot_order(
            self._reconciliation_exchange(), order, exchange_order_id
        )

    def _load_ccxt(self) -> Any:
        if self.ccxt_module is not _CCXT_UNSET:
            if self.ccxt_module is None:
                raise RuntimeError("stage10_ccxt_dependency_required")
            return self.ccxt_module
        try:
            import ccxt  # type: ignore
        except ImportError as error:
            raise RuntimeError("stage10_ccxt_dependency_required") from error
        return ccxt


class DeterministicProductionExecutionAdapter:
    def execute(
        self,
        authorization: dict[str, Any],
        *,
        operator: str,
        attempted_at: str | None = None,
    ) -> dict[str, Any]:
        return build_production_execution_attempt(
            authorization,
            operator=operator,
            attempted_at=attempted_at,
        )


class Stage10ProductionExecutionService:
    def __init__(
        self,
        audit_store: AuditEventStore,
        adapter: Any = None,
        auto_route: BinanceSpotProductionTradingRoute | None = None,
        acquire_account_lease: Callable[[str], bool] | None = None,
        release_account_lease: Callable[[str], None] | None = None,
    ) -> None:
        self.audit_store = audit_store
        self.adapter = adapter or DeterministicProductionExecutionAdapter()
        self.auto_route = auto_route
        if (acquire_account_lease is None) != (release_account_lease is None):
            raise ValueError("stage10_account_lease_callbacks_incomplete")
        self._account_lease_acquire = acquire_account_lease
        self._account_lease_release = release_account_lease
        self.execution_guard: Callable[[], bool] | None = None
        if acquire_account_lease is None:
            self._init_account_lease()

    def record_credential_preflight(self, value: dict[str, Any]) -> dict[str, Any]:
        preflight = validate_production_trading_credential_preflight(value)
        event, _created = self.audit_store.record_if_absent(
            production_trading_credential_preflight_to_audit_event(preflight)
        )
        if production_trading_credential_preflight_from_audit_event(event) != preflight:
            raise ValueError("stage10_production_trading_credential_preflight_conflict")
        return preflight

    def get_credential_preflight(self, preflight_id: str) -> dict[str, Any]:
        event = self.audit_store.get(preflight_id)
        preflight = (
            production_trading_credential_preflight_from_audit_event(event) if event else None
        )
        if preflight is None or event.metadata.get("detached") is True:
            raise ValueError("stage10_production_trading_credential_preflight_not_found")
        return preflight

    def latest_credential_preflight(self) -> dict[str, Any] | None:
        events = self.audit_store.list_recent(
            event_type="stage10_production_trading_credential_preflight",
            limit=1,
        )
        if not events:
            return None
        return self.get_credential_preflight(events[0].event_id)

    def record_permission_verification(self, value: dict[str, Any]) -> dict[str, Any]:
        verification = validate_production_trading_permission_verification(value)
        event, _created = self.audit_store.record_if_absent(
            production_trading_permission_verification_to_audit_event(verification)
        )
        if production_trading_permission_verification_from_audit_event(event) != verification:
            raise ValueError("stage10_production_trading_permission_verification_conflict")
        return verification

    def get_permission_verification(self, verification_id: str) -> dict[str, Any]:
        event = self.audit_store.get(verification_id)
        verification = (
            production_trading_permission_verification_from_audit_event(event) if event else None
        )
        if verification is None or event.metadata.get("detached") is True:
            raise ValueError("stage10_production_trading_permission_verification_not_found")
        return verification

    def latest_permission_verification(self) -> dict[str, Any] | None:
        events = self.audit_store.list_recent(
            event_type="stage10_production_trading_permission_verification",
            limit=1,
        )
        if not events:
            return None
        return self.get_permission_verification(events[0].event_id)

    def control(self) -> dict[str, Any]:
        events = self.audit_store.list_recent(
            event_type="stage10_production_execution_control",
            limit=1,
        )
        if not events:
            return {
                "enabled": True,
                "triggered": True,
                "status": "revoked",
                "reason": "safe_default",
                "productionAuthorizationEffective": False,
                "liveTradingAllowed": False,
                "liveBlockedBoundary": True,
            }
        control = production_execution_control_from_audit_event(events[0])
        if control is None or events[0].metadata.get("detached") is True:
            raise ValueError("stage10_production_execution_control_invalid")
        return control

    def set_control(
        self,
        *,
        action: str,
        operator: str,
        reason: str,
        credential_preflight_id: str | None = None,
        permission_verification_id: str | None = None,
        recorded_at: str | None = None,
    ) -> dict[str, Any]:
        current = self.control()
        preflight = (
            self.get_credential_preflight(credential_preflight_id)
            if credential_preflight_id
            else None
        )
        verification = (
            self.get_permission_verification(permission_verification_id)
            if permission_verification_id
            else None
        )
        control = build_production_execution_control(
            action=action,
            operator=operator,
            reason=reason,
            credential_preflight=preflight,
            permission_verification=verification,
            previous_control_id=current.get("controlId"),
            recorded_at=recorded_at,
        )
        event, _created = self.audit_store.record_if_absent(
            production_execution_control_to_audit_event(control)
        )
        if production_execution_control_from_audit_event(event) != control:
            raise ValueError("stage10_production_execution_control_conflict")
        return control

    def record_authorization(self, authorization: dict[str, Any]) -> dict[str, Any]:
        authorization = validate_production_execution_authorization(authorization)
        event, _created = self.audit_store.record_if_absent(
            production_execution_authorization_to_audit_event(authorization)
        )
        if production_execution_authorization_from_audit_event(event) != authorization:
            raise ValueError("stage10_production_execution_authorization_conflict")
        return authorization

    def get_authorization(self, authorization_id: str) -> dict[str, Any]:
        event = self.audit_store.get(authorization_id)
        authorization = (
            production_execution_authorization_from_audit_event(event) if event else None
        )
        if authorization is None or event.metadata.get("detached") is True:
            raise ValueError("stage10_production_execution_authorization_not_found")
        return authorization

    def attempt(
        self,
        authorization_id: str,
        *,
        operator: str,
        attempted_at: str | None = None,
    ) -> dict[str, Any]:
        operator = operator.strip() if isinstance(operator, str) else ""
        if not operator:
            raise ValueError("stage10_production_execution_attempt_operator_required")
        authorization = self.get_authorization(authorization_id)
        attempt_id = _attempt_id(authorization["authorizationHash"])
        existing_event = self.audit_store.get(attempt_id)
        existing = (
            production_execution_attempt_from_audit_event(existing_event)
            if existing_event and existing_event.metadata.get("detached") is not True
            else None
        )
        if existing is not None:
            if existing["authorizationId"] != authorization_id or existing["operator"] != operator:
                raise ValueError("stage10_production_execution_attempt_conflict")
            return existing
        self._require_active_control()
        self._acquire_account_lease(attempt_id)
        try:
            existing_event = self.audit_store.get(attempt_id)
            existing = (
                production_execution_attempt_from_audit_event(existing_event)
                if existing_event and existing_event.metadata.get("detached") is not True
                else None
            )
            if existing is not None:
                if existing["authorizationId"] != authorization_id or existing["operator"] != operator:
                    raise ValueError("stage10_production_execution_attempt_conflict")
                return existing
            attempt = self.adapter.execute(
                authorization,
                operator=operator,
                attempted_at=attempted_at,
            )
            event, _created = self.audit_store.record_if_absent(
                production_execution_attempt_to_audit_event(attempt)
            )
            if production_execution_attempt_from_audit_event(event) != attempt:
                raise ValueError("stage10_production_execution_attempt_conflict")
            return attempt
        finally:
            self._release_account_lease(attempt_id)

    def auto_live_status(self) -> dict[str, Any]:
        route = self.auto_route.status() if self.auto_route is not None else {
            "enabled": False,
            "credentialsConfigured": False,
        }
        control = self.control()
        control_recorded_active = (
            control["status"] == "active" and control["triggered"] is False
        )
        blocking_reason = None
        evidence_fresh = False
        if self.auto_route is None:
            blocking_reason = "stage10_production_live_route_unavailable"
        elif route["enabled"] is not True:
            blocking_reason = "stage10_production_live_route_disabled"
        elif route["credentialsConfigured"] is not True:
            blocking_reason = "stage10_production_trading_credentials_not_configured"
        elif not control_recorded_active:
            blocking_reason = "stage10_production_execution_kill_switch_triggered"
        else:
            try:
                self._require_active_control()
                evidence_fresh = True
            except ValueError as error:
                blocking_reason = str(error)
        return {
            **route,
            "controlActive": control_recorded_active and evidence_fresh,
            "controlRecordedActive": control_recorded_active,
            "controlId": control.get("controlId"),
            "evidenceFresh": evidence_fresh,
            "blockingReason": blocking_reason,
            "triggered": control["triggered"],
        }

    def authorize_auto_session(self) -> dict[str, Any]:
        if self.auto_route is None:
            raise ValueError("stage10_production_live_route_unavailable")
        self.auto_route.require_enabled()
        self._require_active_control()
        return {
            **self.control(),
            "autoRouteSafety": self.auto_route.verify_current_restrictions(),
        }

    def require_auto_session(self, control_id: str) -> None:
        if self.auto_route is None:
            raise ValueError("stage10_production_live_route_unavailable")
        self.auto_route.require_enabled()
        control = self.control()
        if (
            control["status"] != "active"
            or control["triggered"] is not False
            or not control_id
            or control.get("controlId") != control_id
        ):
            raise ValueError("stage10_production_execution_kill_switch_triggered")

    def verify_auto_account_coverage(
        self,
        expected_position: float,
        required_quote: float,
        *,
        control_id: str,
        operator: str,
    ) -> dict[str, Any]:
        if not isinstance(operator, str) or not operator.strip():
            raise ValueError("stage10_auto_live_operator_required")
        self.require_auto_session(control_id)
        assert self.auto_route is not None
        holder = "aiqt-auto-account-check"
        self._acquire_account_lease(holder)
        try:
            return self.auto_route.account_coverage(
                expected_position,
                required_quote,
            )
        finally:
            self._release_account_lease(holder)

    def prepare_auto_market_order(
        self,
        order: dict[str, Any],
        *,
        control_id: str,
        operator: str,
    ) -> dict[str, Any]:
        if not isinstance(operator, str) or not operator.strip():
            raise ValueError("stage10_auto_live_operator_required")
        self.require_auto_session(control_id)
        assert self.auto_route is not None
        holder = "aiqt-auto-order-preparation"
        self._acquire_account_lease(holder)
        try:
            self.auto_route.verify_current_restrictions()
            return self.auto_route.prepare_market_order(order)
        finally:
            self._release_account_lease(holder)

    def submit_auto_market_order(
        self,
        order: dict[str, Any],
        *,
        control_id: str,
        operator: str,
    ) -> dict[str, Any]:
        operator = operator.strip() if isinstance(operator, str) else ""
        if not operator:
            raise ValueError("stage10_auto_live_operator_required")
        self.require_auto_session(control_id)
        assert self.auto_route is not None
        client_order_id = str(order.get("clientOrderId") or "")
        if not client_order_id:
            raise ValueError("stage10_auto_live_order_invalid")
        self._acquire_account_lease(client_order_id)
        try:
            self._require_execution_guard()
            try:
                evidence = {
                    **self.auto_route.fetch_order(order),
                    "operation": "query",
                }
            except Exception as query_error:
                if not _order_not_found(query_error):
                    evidence = _unknown_live_evidence(query_error, "query")
                else:
                    self.auto_route.verify_current_restrictions()
                    self._require_execution_guard()
                    self._record_auto_live_transition(
                        order,
                        {
                            "state": "submission_pending",
                            "operation": "create",
                            "error": "",
                        },
                        operator=operator,
                    )
                    try:
                        self._require_execution_guard()
                        evidence = {
                            **self.auto_route.create_market_order(order),
                            "operation": "create",
                        }
                    except Exception as create_error:
                        try:
                            evidence = {
                                **self.auto_route.fetch_order(order),
                                "operation": "query",
                            }
                        except Exception:
                            evidence = _unknown_live_evidence(create_error, "create")
                    if evidence["state"] in {"open", "partially_filled"}:
                        try:
                            evidence = {
                                **self.auto_route.fetch_order(
                                    order,
                                    evidence.get("exchangeOrderId"),
                                ),
                                "operation": "query",
                            }
                        except Exception:
                            pass
            self._require_execution_guard()
            self._record_auto_live_transition(order, evidence, operator=operator)
            return evidence
        finally:
            self._release_account_lease(client_order_id)

    def reconcile_auto_market_order(
        self,
        order: dict[str, Any],
        evidence: dict[str, Any],
        *,
        operator: str,
    ) -> dict[str, Any]:
        operator = operator.strip() if isinstance(operator, str) else ""
        if not operator:
            raise ValueError("stage10_auto_live_operator_required")
        if self.auto_route is None:
            raise ValueError("stage10_production_live_route_unavailable")
        client_order_id = str(order.get("clientOrderId") or "")
        if not client_order_id:
            raise ValueError("stage10_auto_live_order_invalid")
        self._acquire_account_lease(client_order_id)
        try:
            self._require_execution_guard()
            try:
                current = {
                    **self.auto_route.fetch_order_for_reconciliation(
                        order,
                        evidence.get("exchangeOrderId"),
                    ),
                    "operation": "query",
                }
            except Exception as error:
                current = _unknown_live_evidence(error, "query")
            self._require_execution_guard()
            self._record_auto_live_transition(order, current, operator=operator)
            return current
        finally:
            self._release_account_lease(client_order_id)

    def _record_auto_live_transition(
        self,
        order: dict[str, Any],
        evidence: dict[str, Any],
        *,
        operator: str,
    ) -> None:
        self._require_execution_guard()
        now = datetime.now(timezone.utc).isoformat()
        identity = _hash(
            {
                "clientOrderId": order.get("clientOrderId"),
                "state": evidence.get("state"),
                "operation": evidence.get("operation"),
                "exchangeOrderId": evidence.get("exchangeOrderId"),
            }
        )
        self.audit_store.record_if_absent(
            {
                "schemaVersion": 1,
                "eventId": (
                    f"stage10-production-execution-auto-"
                    f"{order.get('clientOrderId')}-{identity[:12]}"
                ),
                "eventType": "stage10_auto_live_order_transition",
                "runId": "",
                "createdAt": now,
                "stage": "stage10-auto-live-order-transition",
                "source": operator,
                "summary": (
                    f"Production auto order entered {evidence.get('state', 'unknown')}."
                ),
                "detail": "Binance Spot production order evidence; credentials are not persisted.",
                "metadata": {
                    "order": order,
                    "evidence": evidence,
                    "liveTradingAllowed": True,
                    "liveRouteExecuted": evidence.get("operation") in {"create", "query"},
                    "liveBlockedBoundary": False,
                },
            }
        )

    def _require_active_control(self) -> None:
        control = self.control()
        if control["status"] != "active" or control["triggered"] is not False:
            raise ValueError("stage10_production_execution_kill_switch_triggered")
        preflight = self.get_credential_preflight(str(control["credentialPreflightId"]))
        verification = self.get_permission_verification(
            str(control["permissionVerificationId"])
        )
        if (
            preflight["preflightHash"] != control["credentialPreflightHash"]
            or preflight["status"] != "configured_offline"
            or datetime.now(timezone.utc) > _utc(preflight["expiresAt"])
            or verification["verificationHash"] != control["permissionVerificationHash"]
            or verification["preflightId"] != preflight["preflightId"]
            or verification["preflightHash"] != preflight["preflightHash"]
            or verification["status"] != "verified"
            or datetime.now(timezone.utc) > _utc(verification["expiresAt"])
        ):
            raise ValueError("stage10_production_execution_control_evidence_stale")

    def _init_account_lease(self) -> None:
        connection = sqlite3.connect(self.audit_store.path)
        try:
            connection.execute(
                """
                create table if not exists stage10_execution_account_lease (
                    singleton integer primary key check (singleton = 1),
                    holder text not null,
                    expires_at text not null
                )
                """
            )
            connection.commit()
        finally:
            connection.close()

    def _acquire_account_lease(self, holder: str) -> None:
        if self._account_lease_acquire is not None:
            if not self._account_lease_acquire(holder):
                raise ValueError("stage10_production_execution_account_lease_active")
            return
        now = datetime.now(timezone.utc)
        connection = sqlite3.connect(self.audit_store.path, timeout=5)
        try:
            connection.execute("begin immediate")
            row = connection.execute(
                "select holder, expires_at from stage10_execution_account_lease where singleton = 1"
            ).fetchone()
            if row is not None and _utc(row[1]) > now:
                raise ValueError("stage10_production_execution_account_lease_active")
            connection.execute(
                """
                insert into stage10_execution_account_lease (singleton, holder, expires_at)
                values (1, ?, ?)
                on conflict(singleton) do update set
                    holder = excluded.holder,
                    expires_at = excluded.expires_at
                """,
                (holder, (now + _ACCOUNT_LEASE_TTL).isoformat()),
            )
            connection.commit()
        except sqlite3.OperationalError as error:
            raise ValueError("stage10_production_execution_account_lease_active") from error
        finally:
            connection.close()

    def _release_account_lease(self, holder: str) -> None:
        if self._account_lease_release is not None:
            self._account_lease_release(holder)
            return
        connection = sqlite3.connect(self.audit_store.path)
        try:
            connection.execute(
                "delete from stage10_execution_account_lease where singleton = 1 and holder = ?",
                (holder,),
            )
            connection.commit()
        finally:
            connection.close()

    def _require_execution_guard(self) -> None:
        if self.execution_guard is not None and not self.execution_guard():
            raise RuntimeError("public_lease_lost")


def _production_orders(candidate: dict[str, Any]) -> list[dict[str, Any]]:
    orders = [order for order in candidate["orders"] if order["symbol"] == "BTC/USDT"]
    if (
        len(orders) != 1
        or orders[0]["type"] != "limit"
        or orders[0]["timeInForce"] != "GTC"
        or float(orders[0]["notionalValue"]) > 10
    ):
        raise ValueError("stage10_single_btc_order_required")
    source = orders[0]
    identity = _hash(
        {
            "candidateHash": candidate["candidateHash"],
            "sourceOrderId": source["orderId"],
        }
    )
    return [
        {
            "sourceOrderId": source["orderId"],
            "orderId": f"stage10-production-order-{identity[:24]}",
            "clientOrderId": f"aiqt-s10-{identity[:24]}",
            "symbol": source["symbol"],
            "side": source["side"],
            "type": source["type"],
            "timeInForce": source["timeInForce"],
            "quantity": source["quantity"],
            "price": source["price"],
            "notionalValue": source["notionalValue"],
        }
    ]


def _validate_production_orders(value: Any) -> None:
    fields = {
        "sourceOrderId",
        "orderId",
        "clientOrderId",
        "symbol",
        "side",
        "type",
        "timeInForce",
        "quantity",
        "price",
        "notionalValue",
    }
    if not isinstance(value, list) or len(value) != 1:
        raise ValueError("stage10_single_btc_order_required")
    order = value[0]
    if (
        not isinstance(order, dict)
        or set(order) != fields
        or order["symbol"] != "BTC/USDT"
        or order["side"] not in {"buy", "sell"}
        or order["type"] != "limit"
        or order["timeInForce"] != "GTC"
        or not all(
            isinstance(order[field], str) and order[field].strip()
            for field in ("sourceOrderId", "orderId", "clientOrderId")
        )
        or not _positive(order["quantity"])
        or not _positive(order["price"])
        or not _positive(order["notionalValue"])
        or float(order["notionalValue"]) > 10
    ):
        raise ValueError("stage10_single_btc_order_required")


def _authorization_id(candidate_hash: str, review_hash: str, orders_hash: str) -> str:
    identity = hashlib.sha256(f"{candidate_hash}:{review_hash}:{orders_hash}".encode()).hexdigest()
    return f"stage10-production-execution-auth-{identity[:24]}"


def _attempt_id(authorization_hash: str) -> str:
    identity = hashlib.sha256(authorization_hash.encode()).hexdigest()
    return f"stage10-production-execution-attempt-{identity[:24]}"


def _unknown_live_evidence(error: Exception, operation: str) -> dict[str, Any]:
    return {
        "exchangeOrderId": "",
        "clientOrderId": "",
        "state": "reconciliation_required",
        "filledQuantity": 0.0,
        "remainingQuantity": 0.0,
        "averagePrice": 0.0,
        "exchangeStatus": "",
        "timestamp": None,
        "operation": operation,
        "error": str(error)[:240],
    }


def _validate_boundary(value: dict[str, Any], error: str) -> None:
    if any(value.get(field) is not expected for field, expected in _BOUNDARY.items()):
        raise ValueError(error)


def _positive(value: Any) -> bool:
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and float(value) > 0
    )


def _utc(value: Any) -> datetime:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("stage10_production_execution_timestamp_invalid")
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        raise ValueError("stage10_production_execution_timestamp_invalid")
    return parsed.astimezone(timezone.utc)


def _is_hash(value: Any) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(
        character in "0123456789abcdef" for character in value
    )


def _hash(value: Any) -> str:
    return hashlib.sha256(
        json.dumps(value, allow_nan=False, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
