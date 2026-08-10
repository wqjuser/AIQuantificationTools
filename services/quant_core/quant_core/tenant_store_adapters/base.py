from __future__ import annotations

from typing import Any

from quant_core.canonical import canonical_sha256
from quant_core.tenant_model_codec import decode_tenant_model, encode_tenant_model
from quant_core.tenant_storage import TenantRecordStore, TenantRecordVersion


class TenantModelRepository:
    def __init__(self, records: TenantRecordStore, kind: str):
        self.records = records
        self.kind = kind

    def put(self, record_id: str, value: Any) -> Any:
        payload = _payload(value)
        self.records.put(
            self.kind,
            record_id,
            payload,
            canonical_hash=_payload_hash(payload),
        )
        return value

    def put_many(self, records: list[tuple[str, Any]]) -> list[Any]:
        payloads = [_payload(value) for _record_id, value in records]
        self.records.put_many(
            [
                (self.kind, record_id, payload)
                for (record_id, _value), payload in zip(
                    records,
                    payloads,
                    strict=True,
                )
            ],
            canonical_hashes=[_payload_hash(payload) for payload in payloads],
        )
        return [value for _record_id, value in records]

    def put_if_absent(self, record_id: str, value: Any) -> tuple[Any, bool]:
        payload = _payload(value)
        stored, created = self.records.put_if_absent(
            self.kind,
            record_id,
            payload,
            canonical_hash=_payload_hash(payload),
        )
        return _model(stored), created

    def compare_and_swap_model(
        self,
        record_id: str,
        *,
        expected_version: TenantRecordVersion,
        value: Any,
    ) -> bool:
        payload = _payload(value)
        return self.records.compare_and_swap_payload_version(
            self.kind,
            record_id,
            payload,
            expected_version=expected_version,
            canonical_hash=_payload_hash(payload),
        )

    def compare_and_swap_field(
        self,
        record_id: str,
        *,
        field: str,
        expected: str | None,
        value: Any,
    ) -> bool:
        payload = _payload(value)
        return self.records.compare_and_swap_payload_field(
            self.kind,
            record_id,
            payload,
            path=("model", "fields", field),
            expected=expected,
            canonical_hash=_payload_hash(payload),
        )

    def compare_and_swap_model_field(
        self,
        record_id: str,
        *,
        path: tuple[str, ...],
        expected: str | None,
        value: Any,
    ) -> bool:
        payload = _payload(value)
        return self.records.compare_and_swap_payload_field(
            self.kind,
            record_id,
            payload,
            path=("model", "fields", *path),
            expected=expected,
            canonical_hash=_payload_hash(payload),
        )

    def get(self, record_id: str) -> Any | None:
        payload = self.records.get(self.kind, record_id)
        return _model(payload) if payload is not None else None

    def get_versioned(
        self,
        record_id: str,
    ) -> tuple[Any, TenantRecordVersion] | None:
        stored = self.records.get_versioned(self.kind, record_id)
        return (_model(stored[0]), stored[1]) if stored is not None else None

    def all(self) -> list[Any]:
        return [_model(payload) for payload in self.records.list(self.kind, limit=100_000)]

    def delete(self, record_id: str) -> None:
        self.records.delete(self.kind, record_id)

    def delete_where(self, predicate) -> None:
        for value in self.all():
            if predicate(value):
                self.delete(_record_id(value))


def _model(payload: dict[str, object]) -> Any:
    if set(payload) != {"model"}:
        raise ValueError("tenant_model_record_invalid")
    return decode_tenant_model(payload["model"])


def _payload(value: Any) -> dict[str, object]:
    return {"model": encode_tenant_model(value)}


def _payload_hash(payload: dict[str, object]) -> str:
    return canonical_sha256(payload)


def _record_id(value: Any) -> str:
    for name in (
        "event_id",
        "run_id",
        "ai_review_id",
        "decision_id",
        "undo_token",
        "revision",
        "note_id",
        "batch_id",
        "approval_id",
        "simulation_id",
        "execution_id",
        "certification_id",
    ):
        candidate = getattr(value, name, None)
        if candidate:
            return str(candidate)
    raise ValueError("tenant_model_record_id_missing")
