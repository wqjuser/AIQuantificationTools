from __future__ import annotations

from typing import Any

from quant_core.tenant_model_codec import decode_tenant_model, encode_tenant_model
from quant_core.tenant_storage import TenantRecordStore


class TenantModelRepository:
    def __init__(self, records: TenantRecordStore, kind: str):
        self.records = records
        self.kind = kind

    def put(self, record_id: str, value: Any) -> Any:
        self.records.put(
            self.kind,
            record_id,
            {"model": encode_tenant_model(value)},
        )
        return value

    def put_many(self, records: list[tuple[str, Any]]) -> list[Any]:
        self.records.put_many(
            [
                (self.kind, record_id, {"model": encode_tenant_model(value)})
                for record_id, value in records
            ]
        )
        return [value for _record_id, value in records]

    def put_if_absent(self, record_id: str, value: Any) -> tuple[Any, bool]:
        stored, created = self.records.put_if_absent(
            self.kind,
            record_id,
            {"model": encode_tenant_model(value)},
        )
        return _model(stored), created

    def get(self, record_id: str) -> Any | None:
        payload = self.records.get(self.kind, record_id)
        return _model(payload) if payload is not None else None

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
