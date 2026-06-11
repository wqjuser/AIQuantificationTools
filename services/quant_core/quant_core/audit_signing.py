from __future__ import annotations

import hashlib
import hmac
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from quant_core.audit_events import AuditEventRecord, audit_event_record_to_payload


SIGNABLE_REPORT_EVENT_TYPES = {"audit_evidence_report", "backtest_report", "portfolio_report"}
AUDIT_REPORT_IMPORT_VERIFICATION_INVALID_REASON = "audit_report_import_verification_invalid"


@dataclass(frozen=True)
class AuditReportVerification:
    status: str
    reason: str


@dataclass(frozen=True)
class AuditSigningKey:
    key_id: str
    signer: str
    secret: str
    chain_id: str
    status: str
    source: str
    created_at: str | None = None
    activated_at: str | None = None
    retired_at: str | None = None

    algorithm = "hmac-sha256"

    @property
    def can_sign(self) -> bool:
        return self.status == "active" and bool(self.secret)

    @property
    def can_verify(self) -> bool:
        return self.status != "revoked" and bool(self.secret)

    @property
    def fingerprint(self) -> str:
        return hashlib.sha256(self.secret.encode("utf-8")).hexdigest()[:16]

    def to_payload(self) -> dict[str, Any]:
        return {
            "keyId": self.key_id,
            "signer": self.signer,
            "algorithm": self.algorithm,
            "chainId": self.chain_id,
            "status": self.status,
            "source": self.source,
            "fingerprint": self.fingerprint,
            "canSign": self.can_sign,
            "canVerify": self.can_verify,
            "createdAt": self.created_at,
            "activatedAt": self.activated_at,
            "retiredAt": self.retired_at,
        }


@dataclass(frozen=True)
class AuditSigningKeyControlledRestartEvidence:
    evidence_id: str
    apply_event_id: str
    current_active_key_id: str
    current_active_key_fingerprint: str
    proposed_active_key_id: str
    proposed_signer: str
    proposed_chain_id: str
    status: str
    operator: str
    recorded_at: datetime
    evidence_mode: str
    restart_required: bool
    required_confirmations: list[dict[str, str]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]


@dataclass(frozen=True)
class AuditSigningKeySecretMaterialization:
    materialization_id: str
    plan_event_id: str
    current_active_key_id: str
    current_active_key_fingerprint: str
    proposed_active_key_id: str
    proposed_signer: str
    proposed_chain_id: str
    status: str
    operator: str
    recorded_at: datetime
    materialization_mode: str
    backend: str
    manifest_path: str
    required_env_vars: list[str]
    secret_placeholder_names: list[str]
    required_confirmations: list[dict[str, str]]
    blocked_reasons: list[str]
    metadata: dict[str, Any]


class AuditSigningKeyRegistry:
    def __init__(self, keys: list[AuditSigningKey]) -> None:
        if not keys:
            raise ValueError("audit_signing_key_required")
        active_keys = [key for key in keys if key.status == "active"]
        if not active_keys:
            raise ValueError("audit_signing_active_key_required")
        self.keys = keys
        self.active_key = active_keys[0]

    @classmethod
    def from_config(
        cls,
        *,
        secret: str,
        key_id: str,
        signer: str,
        chain_id: str,
        keys_json: str = "",
    ) -> "AuditSigningKeyRegistry":
        active_key = AuditSigningKey(
            key_id=key_id.strip() or "local-audit-key",
            signer=signer.strip() or "Local Audit Key",
            secret=secret.strip(),
            chain_id=chain_id.strip() or "audit-chain-local",
            status="active",
            source="env" if secret.strip() else "missing",
            activated_at=datetime.now(timezone.utc).isoformat(),
        )
        if not active_key.secret:
            raise ValueError("audit_signing_secret_required")
        keys = [active_key]
        for item in _parse_registry_items(keys_json):
            key = _signing_key_from_payload(item)
            if key.key_id != active_key.key_id:
                keys.append(key)
        return cls(keys)

    def find(self, key_id: str) -> AuditSigningKey | None:
        normalized_key_id = key_id.strip()
        if not normalized_key_id:
            return None
        return next((key for key in self.keys if key.key_id == normalized_key_id), None)

    def to_payload(self) -> dict[str, Any]:
        return {
            "schemaVersion": 1,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "activeKeyId": self.active_key.key_id,
            "rotationRequired": self.active_key.key_id == "local-audit-key"
            or self.active_key.secret == "local-dev-audit-secret",
            "keys": [key.to_payload() for key in self.keys],
        }


class AuditReportSigner:
    algorithm = "hmac-sha256"

    def __init__(
        self,
        *,
        secret: str,
        key_id: str,
        signer: str,
        chain_id: str,
        keys_json: str = "",
        registry: AuditSigningKeyRegistry | None = None,
    ) -> None:
        self.registry = registry or AuditSigningKeyRegistry.from_config(
            secret=secret,
            key_id=key_id,
            signer=signer,
            chain_id=chain_id,
            keys_json=keys_json,
        )
        self.key_id = self.registry.active_key.key_id
        self.signer = self.registry.active_key.signer
        self.chain_id = self.registry.active_key.chain_id

    def sign_event(self, record: AuditEventRecord, *, signed_at: datetime | None = None) -> dict[str, Any]:
        self._validate_report_event(record)
        self._validate_signing_policy(record)
        key = self.registry.active_key
        timestamp = (signed_at or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat()
        signature = {
            "status": "verified",
            "algorithm": self.algorithm,
            "chainId": key.chain_id,
            "keyFingerprint": key.fingerprint,
            "keyId": key.key_id,
            "signer": key.signer,
            "signedAt": timestamp,
            "verifiedAt": timestamp,
            "value": self._signature_value(record, key),
        }
        return self._event_payload_with_signature(record, signature)

    def verify_event(self, record: AuditEventRecord, *, verified_at: datetime | None = None) -> tuple[AuditReportVerification, dict[str, Any]]:
        self._validate_report_event(record)
        signature = _dict_or_empty(record.metadata.get("signature"))
        key = self._key_for_signature(signature)
        timestamp = (verified_at or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat()
        verification = self._verify_signature(record, signature, key)
        updated_signature = {
            **signature,
            "algorithm": str(signature.get("algorithm") or self.algorithm),
            "chainId": str(signature.get("chainId") or (key.chain_id if key else self.chain_id)),
            "keyFingerprint": str(signature.get("keyFingerprint") or (key.fingerprint if key else "")),
            "keyId": str(signature.get("keyId") or (key.key_id if key else self.key_id)),
            "signer": str(signature.get("signer") or (key.signer if key else self.signer)),
            "status": verification.status,
            "verifiedAt": timestamp,
        }
        if verification.status == "invalid":
            updated_signature["invalidReason"] = verification.reason
        else:
            updated_signature.pop("invalidReason", None)
        return verification, self._event_payload_with_signature(record, updated_signature)

    def verify_report_artifact(
        self, report: dict[str, Any], *, verified_at: datetime | None = None
    ) -> tuple[AuditReportVerification, dict[str, Any]]:
        record = audit_report_event_record_from_package_report(report)
        return self.verify_event(record, verified_at=verified_at)

    def revoke_event(
        self,
        record: AuditEventRecord,
        *,
        reason: str,
        revoked_at: datetime | None = None,
    ) -> tuple[AuditReportVerification, dict[str, Any]]:
        self._validate_report_event(record)
        signature = _dict_or_empty(record.metadata.get("signature"))
        key = self._key_for_signature(signature)
        verification = self._verify_signature(record, signature, key)
        if verification.status != "verified":
            raise ValueError(verification.reason)
        timestamp = (revoked_at or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat()
        updated_signature = {
            **signature,
            "status": "revoked",
            "revokedAt": timestamp,
            "revokedReason": reason.strip() or "manual audit revocation",
        }
        updated_signature.pop("invalidReason", None)
        return AuditReportVerification(status="invalid", reason="signature_revoked"), self._event_payload_with_signature(
            record, updated_signature
        )

    def _key_for_signature(self, signature: dict[str, Any]) -> AuditSigningKey | None:
        key_id = str(signature.get("keyId") or self.key_id)
        return self.registry.find(key_id)

    def _verify_signature(
        self, record: AuditEventRecord, signature: dict[str, Any], key: AuditSigningKey | None
    ) -> AuditReportVerification:
        if not signature:
            return AuditReportVerification(status="invalid", reason="signature_missing")
        if str(signature.get("status") or "") == "revoked":
            return AuditReportVerification(status="invalid", reason="signature_revoked")
        if str(signature.get("algorithm") or "") != self.algorithm:
            return AuditReportVerification(status="invalid", reason="unsupported_signature_algorithm")
        if key is None or str(signature.get("keyId") or "") != key.key_id:
            return AuditReportVerification(status="invalid", reason="signature_key_mismatch")
        if not key.can_verify:
            return AuditReportVerification(status="invalid", reason="signature_key_unavailable")
        value = str(signature.get("value") or "")
        if not value:
            return AuditReportVerification(status="invalid", reason="signature_missing")
        expected = self._signature_value(record, key)
        if not hmac.compare_digest(value, expected):
            return AuditReportVerification(status="invalid", reason="signature_mismatch")
        return AuditReportVerification(status="verified", reason="signature_verified")

    def _signature_value(self, record: AuditEventRecord, key: AuditSigningKey) -> str:
        message = "\n".join(
            [
                "aiqt.auditReport.v1",
                record.event_id,
                record.run_id or "",
                _required_metadata_text(record, "artifactKind"),
                _required_metadata_text(record, "fileName"),
                _required_metadata_text(record, "contentSha256"),
            ]
        )
        return hmac.new(key.secret.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()

    def _validate_report_event(self, record: AuditEventRecord) -> None:
        if record.event_type not in SIGNABLE_REPORT_EVENT_TYPES:
            raise ValueError("audit_report_event_required")
        content_sha256 = _required_metadata_text(record, "contentSha256")
        if len(content_sha256) != 64 or any(character not in "0123456789abcdefABCDEF" for character in content_sha256):
            raise ValueError("audit_report_hash_invalid")

    def _validate_signing_policy(self, record: AuditEventRecord) -> None:
        if record.event_type != "audit_evidence_report":
            return
        invalid_count = record.metadata.get("importVerificationInvalid")
        if isinstance(invalid_count, bool):
            return
        if isinstance(invalid_count, (int, float)) and invalid_count > 0:
            raise ValueError(AUDIT_REPORT_IMPORT_VERIFICATION_INVALID_REASON)

    def _event_payload_with_signature(self, record: AuditEventRecord, signature: dict[str, Any]) -> dict[str, Any]:
        payload = audit_event_record_to_payload(record)
        payload["metadata"] = {**record.metadata, "signature": signature}
        return payload


def audit_report_verification_to_payload(verification: AuditReportVerification) -> dict[str, str]:
    return {"status": verification.status, "reason": verification.reason}


def audit_report_event_record_from_package_report(report: dict[str, Any]) -> AuditEventRecord:
    if not isinstance(report, dict):
        raise ValueError("audit_report_package_report_required")
    artifact_kind = _required_report_text(report, "kind")
    event_type = _report_event_type_for_artifact_kind(artifact_kind)
    signature = _dict_or_empty(report.get("signature"))
    event_id = _required_signature_text(signature, "eventId")
    run_id = _required_report_text(report, "runId")
    file_name = _required_report_text(report, "fileName")
    content_sha256 = _dict_or_empty(report.get("contentSha256"))
    content_algorithm = _required_report_text(content_sha256, "algorithm")
    content_hash = _required_report_text(content_sha256, "hash")
    generated_at = _parse_report_generated_at(str(report.get("generatedAt") or ""))
    return AuditEventRecord(
        event_id=event_id,
        event_type=event_type,
        run_id=run_id,
        created_at=generated_at,
        stage="generated",
        source="package",
        summary=f"{artifact_kind} package report signature checked",
        detail=f"{file_name} · {content_algorithm} {content_hash[:12]}",
        metadata={
            "artifactKind": artifact_kind,
            "fileName": file_name,
            "contentSha256": content_hash,
            "contentSha256Algorithm": content_algorithm,
            "signature": signature,
        },
    )


def _report_event_type_for_artifact_kind(artifact_kind: str) -> str:
    if artifact_kind == "aiqt.auditReport":
        return "audit_evidence_report"
    if artifact_kind == "aiqt.backtestReport":
        return "backtest_report"
    if artifact_kind == "aiqt.portfolioReport":
        return "portfolio_report"
    raise ValueError("audit_report_artifact_kind_required")


def audit_signing_key_registry_to_payload(registry: AuditSigningKeyRegistry) -> dict[str, Any]:
    return registry.to_payload()


def audit_signing_key_rotation_plan_to_payload(
    registry: AuditSigningKeyRegistry,
    *,
    proposed_key_id: str = "",
    proposed_signer: str = "",
    proposed_chain_id: str = "",
) -> dict[str, Any]:
    generated_at = datetime.now(timezone.utc).isoformat()
    active_key = registry.active_key
    next_key_id = proposed_key_id.strip() or f"{active_key.key_id}-next"
    next_signer = proposed_signer.strip() or active_key.signer
    next_chain_id = proposed_chain_id.strip() or f"{active_key.chain_id}-next"
    blocked_reasons: list[str] = []
    if next_key_id == active_key.key_id:
        blocked_reasons.append("proposed_key_matches_current_active_key")
    if any(key.key_id == next_key_id and key.key_id != active_key.key_id for key in registry.keys):
        blocked_reasons.append("proposed_key_already_exists_in_registry")

    legacy_template = json.dumps(
        [
            {
                "keyId": active_key.key_id,
                "signer": active_key.signer,
                "chainId": active_key.chain_id,
                "status": "retired",
                "source": "rotation-plan",
                "fingerprint": active_key.fingerprint,
                "retiredAt": generated_at,
                "secret": "<copy-current-AIQT_AUDIT_SIGNING_SECRET-locally>",
            }
        ],
        ensure_ascii=False,
        separators=(",", ":"),
    )

    return {
        "schemaVersion": 1,
        "generatedAt": generated_at,
        "currentActiveKey": {
            "keyId": active_key.key_id,
            "signer": active_key.signer,
            "chainId": active_key.chain_id,
            "fingerprint": active_key.fingerprint,
        },
        "proposedActiveKey": {
            "keyId": next_key_id,
            "signer": next_signer,
            "chainId": next_chain_id,
        },
        "rotationRequired": registry.to_payload()["rotationRequired"],
        "requiresRestart": True,
        "environmentUpdates": [
            {"name": "AIQT_AUDIT_SIGNING_KEY_ID", "value": next_key_id, "sensitivity": "public"},
            {"name": "AIQT_AUDIT_SIGNER_NAME", "value": next_signer, "sensitivity": "public"},
            {"name": "AIQT_AUDIT_CHAIN_ID", "value": next_chain_id, "sensitivity": "public"},
            {"name": "AIQT_AUDIT_SIGNING_SECRET", "value": "<set-new-key-material-outside-ui>", "sensitivity": "secret"},
            {"name": "AIQT_AUDIT_SIGNING_KEYS_JSON", "value": legacy_template, "sensitivity": "secret"},
        ],
        "legacyRegistryTemplate": legacy_template,
        "steps": [
            {
                "id": "set-new-active-key",
                "title": "Set new active signing key",
                "detail": "Update active signing key environment variables with new locally generated key material.",
                "status": "manual",
            },
            {
                "id": "retire-current-key",
                "title": "Retire current key into legacy registry",
                "detail": "Keep the current active key in AIQT_AUDIT_SIGNING_KEYS_JSON so old reports remain verifiable.",
                "status": "required",
            },
            {
                "id": "restart-core",
                "title": "Restart local core",
                "detail": "Restart API and web containers after changing signing environment variables.",
                "status": "required",
            },
            {
                "id": "verify-legacy-reports",
                "title": "Verify legacy reports",
                "detail": "Run Audit report verification on old signed reports before removing any retired key.",
                "status": "required",
            },
        ],
        "blockedReasons": blocked_reasons,
    }


def audit_signing_key_rotation_apply_to_payload(
    registry: AuditSigningKeyRegistry,
    *,
    rotation_plan: dict[str, Any],
    confirmations: dict[str, Any],
) -> dict[str, Any]:
    if not isinstance(rotation_plan, dict):
        raise ValueError("audit_signing_key_rotation_plan_required")
    if not isinstance(confirmations, dict):
        confirmations = {}

    _raise_if_rotation_plan_leaks_secret(registry, rotation_plan)

    generated_at = datetime.now(timezone.utc).isoformat()
    current_key = _dict_or_empty(rotation_plan.get("currentActiveKey"))
    proposed_key = _dict_or_empty(rotation_plan.get("proposedActiveKey"))
    current_key_id = _payload_text(current_key, "keyId")
    current_fingerprint = _payload_text(current_key, "fingerprint")
    proposed_key_id = _payload_text(proposed_key, "keyId")
    proposed_signer = _payload_text(proposed_key, "signer")
    proposed_chain_id = _payload_text(proposed_key, "chainId")
    blocked_reasons = _payload_string_list(rotation_plan.get("blockedReasons"))

    if current_key_id != registry.active_key.key_id:
        blocked_reasons.append("current_key_mismatch")
    if current_fingerprint != registry.active_key.fingerprint:
        blocked_reasons.append("current_key_fingerprint_mismatch")
    if not proposed_key_id:
        blocked_reasons.append("proposed_key_required")
    if proposed_key_id == registry.active_key.key_id:
        blocked_reasons.append("proposed_key_matches_current_active_key")
    if proposed_key_id and registry.find(proposed_key_id):
        blocked_reasons.append("proposed_key_already_exists_in_registry")

    confirmation_specs = [
        (
            "new-secret-material-stored",
            "newSecretMaterialStored",
            "New signing secret generated and stored outside the UI",
            "new_secret_material_not_confirmed",
        ),
        (
            "legacy-secret-stored",
            "legacySecretStored",
            "Current active secret copied into the legacy registry outside the UI",
            "legacy_secret_not_confirmed",
        ),
        (
            "operator-reviewed-plan",
            "operatorReviewedPlan",
            "Operator reviewed key ids, fingerprints, and restart impact",
            "operator_review_not_confirmed",
        ),
    ]
    required_confirmations = []
    for confirmation_id, payload_key, label, blocked_reason in confirmation_specs:
        confirmed = _payload_bool(confirmations, payload_key)
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    environment_updates = rotation_plan.get("environmentUpdates")
    environment_update_names = []
    secret_placeholder_names = []
    if isinstance(environment_updates, list):
        for update in environment_updates:
            if not isinstance(update, dict):
                continue
            name = _payload_text(update, "name")
            if name:
                environment_update_names.append(name)
            if _payload_text(update, "sensitivity") == "secret" and name:
                secret_placeholder_names.append(name)

    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    return {
        "schemaVersion": 1,
        "generatedAt": generated_at,
        "status": "blocked" if unique_blocked_reasons else "ready_for_restart",
        "applyMode": "manual_secret_store",
        "auditEventType": "audit_signing_key_rotation_apply",
        "currentActiveKeyId": registry.active_key.key_id,
        "currentActiveKeyFingerprint": registry.active_key.fingerprint,
        "proposedActiveKeyId": proposed_key_id,
        "proposedSigner": proposed_signer,
        "proposedChainId": proposed_chain_id,
        "restartRequired": bool(rotation_plan.get("requiresRestart", True)),
        "requiredConfirmations": required_confirmations,
        "blockedReasons": unique_blocked_reasons,
        "environmentUpdateNames": environment_update_names,
        "secretPlaceholderNames": secret_placeholder_names,
    }


def audit_signing_key_controlled_restart_evidence_to_payload(
    apply_event: AuditEventRecord,
    *,
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | None = None,
    evidence_id: str | None = None,
) -> dict[str, Any]:
    result = build_audit_signing_key_controlled_restart_evidence(
        apply_event,
        confirmations=confirmations,
        operator=operator,
        metadata=metadata,
        recorded_at=recorded_at,
        evidence_id=evidence_id,
    )
    return _audit_signing_key_controlled_restart_evidence_payload(result)


def build_audit_signing_key_controlled_restart_evidence(
    apply_event: AuditEventRecord,
    *,
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | None = None,
    evidence_id: str | None = None,
) -> AuditSigningKeyControlledRestartEvidence:
    if apply_event.event_type != "audit_signing_key_rotation_apply":
        raise ValueError("audit_signing_key_rotation_apply_event_required")
    if not isinstance(confirmations, dict):
        confirmations = {}
    apply_metadata = apply_event.metadata if isinstance(apply_event.metadata, dict) else {}
    current_key_id = _payload_text(apply_metadata, "currentActiveKeyId")
    current_fingerprint = _payload_text(apply_metadata, "currentActiveKeyFingerprint")
    proposed_key_id = _payload_text(apply_metadata, "proposedActiveKeyId")
    proposed_signer = _payload_text(apply_metadata, "proposedSigner")
    proposed_chain_id = _payload_text(apply_metadata, "proposedChainId")
    if not current_key_id:
        raise ValueError("audit_signing_key_rotation_apply_current_key_required")
    if not proposed_key_id:
        raise ValueError("audit_signing_key_rotation_apply_proposed_key_required")

    blocked_reasons: list[str] = []
    required_confirmations: list[dict[str, str]] = []
    for confirmation_id, payload_key, label, blocked_reason in _audit_signing_key_controlled_restart_confirmation_specs():
        confirmed = _payload_bool(confirmations, payload_key)
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    if _payload_text(apply_metadata, "status") != "ready_for_restart":
        blocked_reasons.append("rotation_apply_not_ready_for_restart")
    restart_required = bool(apply_metadata.get("restartRequired", True))
    if not restart_required:
        blocked_reasons.append("controlled_restart_not_required")

    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    normalized_operator = str(operator or "local-operator").strip() or "local-operator"
    return AuditSigningKeyControlledRestartEvidence(
        evidence_id=str(evidence_id or f"audit-signing-key-controlled-restart-{proposed_key_id}-{uuid4()}"),
        apply_event_id=apply_event.event_id,
        current_active_key_id=current_key_id,
        current_active_key_fingerprint=current_fingerprint,
        proposed_active_key_id=proposed_key_id,
        proposed_signer=proposed_signer,
        proposed_chain_id=proposed_chain_id,
        status="blocked" if unique_blocked_reasons else "evidence_recorded",
        operator=normalized_operator,
        recorded_at=(recorded_at or datetime.now(timezone.utc)).astimezone(timezone.utc),
        evidence_mode="manual_controlled_restart",
        restart_required=restart_required,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_sensitive_fields(metadata or {}),
    )


def audit_signing_key_controlled_restart_evidence_to_audit_event_payload(
    evidence: dict[str, Any],
) -> dict[str, Any]:
    evidence_id = _payload_text(evidence, "evidenceId")
    if not evidence_id:
        raise ValueError("audit_signing_key_controlled_restart_evidence_id_required")
    created_at = _parse_report_generated_at(_payload_text(evidence, "recordedAt"))
    blocked_reasons = _payload_string_list(evidence.get("blockedReasons"))
    required_confirmations = evidence.get("requiredConfirmations") if isinstance(evidence.get("requiredConfirmations"), list) else []
    confirmed_ids = [
        _payload_text(item, "id")
        for item in required_confirmations
        if isinstance(item, dict) and _payload_text(item, "id") and _payload_text(item, "status") == "confirmed"
    ]
    required_ids = [
        _payload_text(item, "id")
        for item in required_confirmations
        if isinstance(item, dict) and _payload_text(item, "id")
    ]
    return {
        "schemaVersion": 1,
        "eventId": evidence_id,
        "eventType": "audit_signing_key_controlled_restart_evidence",
        "runId": "audit-signing-key-rotation",
        "createdAt": created_at.isoformat(),
        "stage": _payload_text(evidence, "status") or "blocked",
        "source": "audit-signing-key-ledger",
        "summary": f"Audit signing key controlled restart evidence recorded for {_payload_text(evidence, 'proposedActiveKeyId')}.",
        "detail": "Controlled restart evidence records operator confirmations only; signing secrets and live trading remain outside this API.",
        "metadata": _redact_sensitive_fields(
            {
                "evidenceId": evidence_id,
                "applyEventId": _payload_text(evidence, "applyEventId"),
                "currentActiveKeyId": _payload_text(evidence, "currentActiveKeyId"),
                "currentActiveKeyFingerprint": _payload_text(evidence, "currentActiveKeyFingerprint"),
                "proposedActiveKeyId": _payload_text(evidence, "proposedActiveKeyId"),
                "proposedSigner": _payload_text(evidence, "proposedSigner"),
                "proposedChainId": _payload_text(evidence, "proposedChainId"),
                "status": _payload_text(evidence, "status") or "blocked",
                "operator": _payload_text(evidence, "operator") or "local-operator",
                "evidenceMode": _payload_text(evidence, "evidenceMode") or "manual_controlled_restart",
                "restartRequired": bool(evidence.get("restartRequired", True)),
                "blockedReasons": blocked_reasons,
                "requiredConfirmationIds": required_ids,
                "confirmedConfirmationIds": confirmed_ids,
                "metadata": evidence.get("metadata") if isinstance(evidence.get("metadata"), dict) else {},
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _audit_signing_key_controlled_restart_evidence_payload(
    result: AuditSigningKeyControlledRestartEvidence,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "evidenceId": result.evidence_id,
        "applyEventId": result.apply_event_id,
        "currentActiveKeyId": result.current_active_key_id,
        "currentActiveKeyFingerprint": result.current_active_key_fingerprint,
        "proposedActiveKeyId": result.proposed_active_key_id,
        "proposedSigner": result.proposed_signer,
        "proposedChainId": result.proposed_chain_id,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "evidenceMode": result.evidence_mode,
        "restartRequired": result.restart_required,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def _audit_signing_key_controlled_restart_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "restart-window-executed",
            "restartWindowExecuted",
            "Controlled restart window was executed",
            "restart_window_not_confirmed",
        ),
        (
            "rollback-plan-confirmed",
            "rollbackPlanConfirmed",
            "Rollback plan is available and confirmed",
            "rollback_plan_not_confirmed",
        ),
        (
            "post-restart-validation-passed",
            "postRestartValidationPassed",
            "Post-restart validation passed",
            "post_restart_validation_not_confirmed",
        ),
        (
            "operator-reviewed-restart-logs",
            "operatorReviewedRestartLogs",
            "Operator reviewed restart logs and signing key status",
            "restart_logs_not_confirmed",
        ),
    ]


def build_audit_signing_key_secret_materialization(
    plan_event: AuditEventRecord,
    *,
    backend: str = "",
    manifest_path: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | None = None,
    materialization_id: str | None = None,
) -> AuditSigningKeySecretMaterialization:
    if plan_event.event_type != "audit_signing_key_rotation_plan":
        raise ValueError("audit_signing_key_rotation_plan_event_required")
    if not isinstance(confirmations, dict):
        confirmations = {}
    plan_metadata = plan_event.metadata if isinstance(plan_event.metadata, dict) else {}
    current_key_id = _payload_text(plan_metadata, "currentKeyId") or _payload_text(plan_metadata, "currentActiveKeyId")
    current_fingerprint = _payload_text(plan_metadata, "currentKeyFingerprint") or _payload_text(
        plan_metadata, "currentActiveKeyFingerprint"
    )
    proposed_key_id = _payload_text(plan_metadata, "proposedKeyId") or _payload_text(plan_metadata, "proposedActiveKeyId")
    proposed_signer = _payload_text(plan_metadata, "proposedSigner")
    proposed_chain_id = _payload_text(plan_metadata, "proposedChainId")
    required_env_vars = _payload_string_list(plan_metadata.get("environmentUpdateNames"))
    secret_placeholder_names = _payload_string_list(plan_metadata.get("secretPlaceholderNames"))
    if not required_env_vars:
        required_env_vars = list(secret_placeholder_names)
    normalized_backend = str(backend or "").strip()
    normalized_manifest_path = str(manifest_path or "").strip()

    if not current_key_id:
        raise ValueError("audit_signing_key_secret_materialization_current_key_required")
    if not current_fingerprint:
        raise ValueError("audit_signing_key_secret_materialization_current_fingerprint_required")
    if not proposed_key_id:
        raise ValueError("audit_signing_key_secret_materialization_proposed_key_required")
    if not normalized_backend:
        raise ValueError("audit_signing_key_secret_materialization_backend_required")
    if not normalized_manifest_path:
        raise ValueError("audit_signing_key_secret_materialization_manifest_path_required")
    if not required_env_vars:
        raise ValueError("audit_signing_key_secret_materialization_required_env_vars_required")

    blocked_reasons: list[str] = _payload_string_list(plan_metadata.get("blockedReasons"))
    if plan_event.stage != "prepared":
        blocked_reasons.append("secret_materialization_plan_not_prepared")
    required_confirmations: list[dict[str, str]] = []
    for confirmation_id, payload_key, label, blocked_reason in _audit_signing_key_secret_materialization_confirmation_specs():
        confirmed = _payload_bool(confirmations, payload_key)
        required_confirmations.append(
            {
                "id": confirmation_id,
                "label": label,
                "status": "confirmed" if confirmed else "missing",
            }
        )
        if not confirmed:
            blocked_reasons.append(blocked_reason)

    unique_blocked_reasons = list(dict.fromkeys(blocked_reasons))
    normalized_operator = str(operator or "local-operator").strip() or "local-operator"
    return AuditSigningKeySecretMaterialization(
        materialization_id=str(
            materialization_id or f"audit-signing-key-secret-materialization-{proposed_key_id}-{uuid4()}"
        ),
        plan_event_id=plan_event.event_id,
        current_active_key_id=current_key_id,
        current_active_key_fingerprint=current_fingerprint,
        proposed_active_key_id=proposed_key_id,
        proposed_signer=proposed_signer,
        proposed_chain_id=proposed_chain_id,
        status="blocked" if unique_blocked_reasons else "manifest_recorded",
        operator=normalized_operator,
        recorded_at=(recorded_at or datetime.now(timezone.utc)).astimezone(timezone.utc),
        materialization_mode="local_secret_store_manifest",
        backend=normalized_backend,
        manifest_path=normalized_manifest_path,
        required_env_vars=required_env_vars,
        secret_placeholder_names=secret_placeholder_names,
        required_confirmations=required_confirmations,
        blocked_reasons=unique_blocked_reasons,
        metadata=_redact_sensitive_fields(metadata or {}),
    )


def audit_signing_key_secret_materialization_to_payload(
    plan_event: AuditEventRecord,
    *,
    backend: str = "",
    manifest_path: str = "",
    confirmations: dict[str, Any] | None = None,
    operator: str = "local-operator",
    metadata: dict[str, Any] | None = None,
    recorded_at: datetime | None = None,
    materialization_id: str | None = None,
) -> dict[str, Any]:
    result = build_audit_signing_key_secret_materialization(
        plan_event,
        backend=backend,
        manifest_path=manifest_path,
        confirmations=confirmations,
        operator=operator,
        metadata=metadata,
        recorded_at=recorded_at,
        materialization_id=materialization_id,
    )
    return _audit_signing_key_secret_materialization_payload(result)


def audit_signing_key_secret_materialization_payload_from_audit_event(event: Any) -> dict[str, Any] | None:
    if getattr(event, "event_type", "") != "audit_signing_key_secret_materialization":
        return None
    metadata = getattr(event, "metadata", {})
    if not isinstance(metadata, dict):
        return None
    materialization_id = str(metadata.get("materializationId") or getattr(event, "event_id", "")).strip()
    plan_event_id = str(metadata.get("planEventId") or "").strip()
    current_key_id = str(metadata.get("currentActiveKeyId") or "").strip()
    current_fingerprint = str(metadata.get("currentActiveKeyFingerprint") or "").strip()
    proposed_key_id = str(metadata.get("proposedActiveKeyId") or "").strip()
    proposed_signer = str(metadata.get("proposedSigner") or "").strip()
    proposed_chain_id = str(metadata.get("proposedChainId") or "").strip()
    status = str(metadata.get("status") or "").strip()
    operator = str(metadata.get("operator") or "local-operator").strip() or "local-operator"
    materialization_mode = str(metadata.get("materializationMode") or "local_secret_store_manifest").strip()
    backend = str(metadata.get("backend") or "").strip()
    manifest_path = str(metadata.get("manifestPath") or "").strip()
    required_env_vars = _payload_string_list(metadata.get("requiredEnvVars"))
    secret_placeholder_names = _payload_string_list(metadata.get("secretPlaceholderNames"))
    if (
        not materialization_id
        or not plan_event_id
        or not current_key_id
        or not current_fingerprint
        or not proposed_key_id
        or not materialization_mode
        or not backend
        or not manifest_path
        or not required_env_vars
    ):
        return None
    if status not in {"blocked", "manifest_recorded"}:
        return None

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
    required_confirmations: list[dict[str, str]] = []
    for confirmation_id, _payload_key, label, _blocked_reason in _audit_signing_key_secret_materialization_confirmation_specs():
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
    recorded_at_value = recorded_at.isoformat() if isinstance(recorded_at, datetime) else datetime.now(timezone.utc).isoformat()
    return {
        "schemaVersion": 1,
        "materializationId": materialization_id,
        "planEventId": plan_event_id,
        "currentActiveKeyId": current_key_id,
        "currentActiveKeyFingerprint": current_fingerprint,
        "proposedActiveKeyId": proposed_key_id,
        "proposedSigner": proposed_signer,
        "proposedChainId": proposed_chain_id,
        "status": status,
        "operator": operator,
        "recordedAt": recorded_at_value,
        "materializationMode": materialization_mode,
        "backend": backend,
        "manifestPath": manifest_path,
        "requiredEnvVars": required_env_vars,
        "secretPlaceholderNames": secret_placeholder_names,
        "requiredConfirmations": required_confirmations,
        "blockedReasons": _payload_string_list(metadata.get("blockedReasons")),
        "metadata": _redact_sensitive_fields(metadata.get("metadata") if isinstance(metadata.get("metadata"), dict) else {}),
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def audit_signing_key_secret_materialization_to_audit_event_payload(
    materialization: dict[str, Any],
) -> dict[str, Any]:
    materialization_id = _payload_text(materialization, "materializationId")
    if not materialization_id:
        raise ValueError("audit_signing_key_secret_materialization_id_required")
    created_at = _parse_report_generated_at(_payload_text(materialization, "recordedAt"))
    required_confirmations = (
        materialization.get("requiredConfirmations") if isinstance(materialization.get("requiredConfirmations"), list) else []
    )
    required_ids = [
        _payload_text(item, "id")
        for item in required_confirmations
        if isinstance(item, dict) and _payload_text(item, "id")
    ]
    confirmed_ids = [
        _payload_text(item, "id")
        for item in required_confirmations
        if isinstance(item, dict) and _payload_text(item, "id") and _payload_text(item, "status") == "confirmed"
    ]
    proposed_key_id = _payload_text(materialization, "proposedActiveKeyId")
    return {
        "schemaVersion": 1,
        "eventId": materialization_id,
        "eventType": "audit_signing_key_secret_materialization",
        "runId": "audit-signing-key-rotation",
        "createdAt": created_at.isoformat(),
        "stage": "audit-signing-key-secret-materialization",
        "source": "audit-signing-key-ledger",
        "summary": f"Audit signing key secret materialization manifest recorded for {proposed_key_id}.",
        "detail": "Secret materialization records a local manifest reference only; raw signing secrets and live trading remain blocked.",
        "metadata": _redact_sensitive_fields(
            {
                "materializationId": materialization_id,
                "planEventId": _payload_text(materialization, "planEventId"),
                "currentActiveKeyId": _payload_text(materialization, "currentActiveKeyId"),
                "currentActiveKeyFingerprint": _payload_text(materialization, "currentActiveKeyFingerprint"),
                "proposedActiveKeyId": proposed_key_id,
                "proposedSigner": _payload_text(materialization, "proposedSigner"),
                "proposedChainId": _payload_text(materialization, "proposedChainId"),
                "status": _payload_text(materialization, "status") or "blocked",
                "operator": _payload_text(materialization, "operator") or "local-operator",
                "materializationMode": _payload_text(materialization, "materializationMode")
                or "local_secret_store_manifest",
                "backend": _payload_text(materialization, "backend"),
                "manifestPath": _payload_text(materialization, "manifestPath"),
                "requiredEnvVars": _payload_string_list(materialization.get("requiredEnvVars")),
                "secretPlaceholderNames": _payload_string_list(materialization.get("secretPlaceholderNames")),
                "blockedReasons": _payload_string_list(materialization.get("blockedReasons")),
                "requiredConfirmationIds": required_ids,
                "confirmedConfirmationIds": confirmed_ids,
                "metadata": materialization.get("metadata") if isinstance(materialization.get("metadata"), dict) else {},
                "liveTradingAllowed": False,
                "paperOnly": True,
            }
        ),
    }


def _audit_signing_key_secret_materialization_payload(
    result: AuditSigningKeySecretMaterialization,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "materializationId": result.materialization_id,
        "planEventId": result.plan_event_id,
        "currentActiveKeyId": result.current_active_key_id,
        "currentActiveKeyFingerprint": result.current_active_key_fingerprint,
        "proposedActiveKeyId": result.proposed_active_key_id,
        "proposedSigner": result.proposed_signer,
        "proposedChainId": result.proposed_chain_id,
        "status": result.status,
        "operator": result.operator,
        "recordedAt": result.recorded_at.isoformat(),
        "materializationMode": result.materialization_mode,
        "backend": result.backend,
        "manifestPath": result.manifest_path,
        "requiredEnvVars": result.required_env_vars,
        "secretPlaceholderNames": result.secret_placeholder_names,
        "requiredConfirmations": result.required_confirmations,
        "blockedReasons": result.blocked_reasons,
        "metadata": result.metadata,
        "liveTradingAllowed": False,
        "paperOnly": True,
    }


def _audit_signing_key_secret_materialization_confirmation_specs() -> list[tuple[str, str, str, str]]:
    return [
        (
            "local-secret-store-write-verified",
            "localSecretStoreWriteVerified",
            "Local secret-store write was verified",
            "secret_materialization_local_store_not_verified",
        ),
        (
            "raw-secret-boundary-confirmed",
            "noRawSecretInPayload",
            "No raw secret is present in this payload",
            "secret_materialization_raw_secret_boundary_not_confirmed",
        ),
        (
            "env-binding-plan-documented",
            "envBindingPlanDocumented",
            "Environment binding plan is documented",
            "secret_materialization_env_binding_plan_missing",
        ),
        (
            "rollback-plan-documented",
            "rollbackPlanDocumented",
            "Rollback plan is documented",
            "secret_materialization_rollback_plan_missing",
        ),
    ]


def _required_metadata_text(record: AuditEventRecord, key: str) -> str:
    value = record.metadata.get(key)
    text = value.strip() if isinstance(value, str) else ""
    if not text:
        raise ValueError(f"audit_report_{key}_required")
    return text


def _required_report_text(container: dict[str, Any], key: str) -> str:
    value = container.get(key)
    text = value.strip() if isinstance(value, str) else ""
    if not text:
        raise ValueError(f"audit_report_{key}_required")
    return text


def _required_signature_text(signature: dict[str, Any], key: str) -> str:
    value = signature.get(key)
    text = value.strip() if isinstance(value, str) else ""
    if not text:
        raise ValueError(f"audit_report_signature_{key}_required")
    return text


def _parse_report_generated_at(value: str) -> datetime:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return datetime.now(timezone.utc)


def _dict_or_empty(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _parse_registry_items(keys_json: str) -> list[dict[str, Any]]:
    if not keys_json.strip():
        return []
    try:
        payload = json.loads(keys_json)
    except json.JSONDecodeError as error:
        raise ValueError("audit_signing_keys_json_invalid") from error
    if not isinstance(payload, list):
        raise ValueError("audit_signing_keys_json_must_be_list")
    return [item for item in payload if isinstance(item, dict)]


def _signing_key_from_payload(item: dict[str, Any]) -> AuditSigningKey:
    key_id = _payload_text(item, "keyId")
    secret = _payload_text(item, "secret")
    if not key_id:
        raise ValueError("audit_signing_key_id_required")
    if not secret:
        raise ValueError("audit_signing_key_secret_required")
    status = _payload_text(item, "status") or "retired"
    if status not in {"active", "retired", "revoked"}:
        status = "retired"
    return AuditSigningKey(
        key_id=key_id,
        signer=_payload_text(item, "signer") or key_id,
        secret=secret,
        chain_id=_payload_text(item, "chainId") or "audit-chain-local",
        status=status,
        source=_payload_text(item, "source") or "registry",
        created_at=_payload_optional_text(item, "createdAt"),
        activated_at=_payload_optional_text(item, "activatedAt"),
        retired_at=_payload_optional_text(item, "retiredAt"),
    )


def _payload_text(item: dict[str, Any], key: str) -> str:
    value = item.get(key)
    return value.strip() if isinstance(value, str) else ""


def _payload_bool(item: dict[str, Any], key: str) -> bool:
    return item.get(key) is True


def _payload_optional_text(item: dict[str, Any], key: str) -> str | None:
    text = _payload_text(item, key)
    return text or None


def _payload_string_list(value: Any) -> list[str]:
    return [item for item in value if isinstance(item, str)] if isinstance(value, list) else []


def _redact_sensitive_fields(value: Any) -> Any:
    if isinstance(value, dict):
        redacted: dict[str, Any] = {}
        for key, item in value.items():
            normalized_key = str(key).replace("_", "").replace("-", "").lower()
            if any(token in normalized_key for token in ("secret", "token", "apikey", "privatekey", "password")):
                redacted[str(key)] = "[redacted]"
            else:
                redacted[str(key)] = _redact_sensitive_fields(item)
        return redacted
    if isinstance(value, list):
        return [_redact_sensitive_fields(item) for item in value]
    return value


def _raise_if_rotation_plan_leaks_secret(registry: AuditSigningKeyRegistry, rotation_plan: dict[str, Any]) -> None:
    serialized = json.dumps(rotation_plan, ensure_ascii=False, sort_keys=True)
    for key in registry.keys:
        if key.secret and key.secret in serialized:
            raise ValueError("audit_signing_key_rotation_plan_secret_leak")
