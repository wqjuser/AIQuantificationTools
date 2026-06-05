from __future__ import annotations

import hashlib
import hmac
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from quant_core.audit_events import AuditEventRecord, audit_event_record_to_payload


SIGNABLE_REPORT_EVENT_TYPES = {"audit_evidence_report", "backtest_report"}


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


def _raise_if_rotation_plan_leaks_secret(registry: AuditSigningKeyRegistry, rotation_plan: dict[str, Any]) -> None:
    serialized = json.dumps(rotation_plan, ensure_ascii=False, sort_keys=True)
    for key in registry.keys:
        if key.secret and key.secret in serialized:
            raise ValueError("audit_signing_key_rotation_plan_secret_leak")
