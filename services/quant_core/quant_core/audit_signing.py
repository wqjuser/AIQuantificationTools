from __future__ import annotations

import hashlib
import hmac
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from quant_core.audit_events import AuditEventRecord, audit_event_record_to_payload


@dataclass(frozen=True)
class AuditReportVerification:
    status: str
    reason: str


class AuditReportSigner:
    algorithm = "hmac-sha256"

    def __init__(self, *, secret: str, key_id: str, signer: str, chain_id: str) -> None:
        self.secret = secret.strip()
        self.key_id = key_id.strip() or "local-audit-key"
        self.signer = signer.strip() or "Local Audit Key"
        self.chain_id = chain_id.strip() or "audit-chain-local"
        if not self.secret:
            raise ValueError("audit_signing_secret_required")

    def sign_event(self, record: AuditEventRecord, *, signed_at: datetime | None = None) -> dict[str, Any]:
        self._validate_report_event(record)
        timestamp = (signed_at or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat()
        signature = {
            "status": "verified",
            "algorithm": self.algorithm,
            "chainId": self.chain_id,
            "keyId": self.key_id,
            "signer": self.signer,
            "signedAt": timestamp,
            "verifiedAt": timestamp,
            "value": self._signature_value(record),
        }
        return self._event_payload_with_signature(record, signature)

    def verify_event(self, record: AuditEventRecord, *, verified_at: datetime | None = None) -> tuple[AuditReportVerification, dict[str, Any]]:
        self._validate_report_event(record)
        signature = _dict_or_empty(record.metadata.get("signature"))
        timestamp = (verified_at or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat()
        verification = self._verify_signature(record, signature)
        updated_signature = {
            **signature,
            "algorithm": str(signature.get("algorithm") or self.algorithm),
            "chainId": str(signature.get("chainId") or self.chain_id),
            "keyId": str(signature.get("keyId") or self.key_id),
            "signer": str(signature.get("signer") or self.signer),
            "status": verification.status,
            "verifiedAt": timestamp,
        }
        if verification.status == "invalid":
            updated_signature["invalidReason"] = verification.reason
        else:
            updated_signature.pop("invalidReason", None)
        return verification, self._event_payload_with_signature(record, updated_signature)

    def _verify_signature(self, record: AuditEventRecord, signature: dict[str, Any]) -> AuditReportVerification:
        if not signature:
            return AuditReportVerification(status="invalid", reason="signature_missing")
        if str(signature.get("algorithm") or "") != self.algorithm:
            return AuditReportVerification(status="invalid", reason="unsupported_signature_algorithm")
        if str(signature.get("keyId") or "") != self.key_id:
            return AuditReportVerification(status="invalid", reason="signature_key_mismatch")
        value = str(signature.get("value") or "")
        if not value:
            return AuditReportVerification(status="invalid", reason="signature_missing")
        expected = self._signature_value(record)
        if not hmac.compare_digest(value, expected):
            return AuditReportVerification(status="invalid", reason="signature_mismatch")
        return AuditReportVerification(status="verified", reason="signature_verified")

    def _signature_value(self, record: AuditEventRecord) -> str:
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
        return hmac.new(self.secret.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()

    def _validate_report_event(self, record: AuditEventRecord) -> None:
        if record.event_type != "audit_evidence_report":
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


def _required_metadata_text(record: AuditEventRecord, key: str) -> str:
    value = record.metadata.get(key)
    text = value.strip() if isinstance(value, str) else ""
    if not text:
        raise ValueError(f"audit_report_{key}_required")
    return text


def _dict_or_empty(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}
