from __future__ import annotations

from dataclasses import replace
from datetime import datetime, timezone
from typing import Any, Iterable, Mapping

from quant_core.adapter_error_ledger import MarketDataAdapterErrorEvent
from quant_core.audit_events import (
    AuditEventRecord,
    _normalize_audit_event,
    _normalized_to_audit_event_record,
)
from quant_core.cache_refresh_runs import WatchlistCacheRefreshRun
from quant_core.canonical import strategy_config_to_payload
from quant_core.domain import StrategyConfig
from quant_core.handoff_notes import (
    HandoffNote,
    _normalize_body as _normalize_handoff_body,
    _normalize_datetime,
    _normalize_note_id,
    _normalize_short_text,
    _normalize_subject,
    _optional_text,
)
from quant_core.http_api.support.research_import_codecs import (
    _research_run_audit_from_payload,
)
from quant_core.research_import_undo import ResearchRunImportUndoRecord
from quant_core.research_notes import (
    ResearchNote,
    _normalize_body as _normalize_research_body,
    _normalize_context,
)
from quant_core.runs import (
    ResearchRunAudit,
    research_run_audit_to_payload,
)
from quant_core.strategy_library import (
    StrategyLibraryRecord,
    _normalize_strategy_config_payload,
)
from quant_core.terminal import Instrument
from quant_core.watchlist import normalize_watchlist
from quant_core.workspace_state import (
    ResearchWorkspaceState,
    research_workspace_state_from_payload,
)

from .base import TenantModelRepository


class TenantAuditEventStore:
    def __init__(self, repository: TenantModelRepository):
        self.repository = repository

    def record(self, event: dict[str, Any]) -> AuditEventRecord:
        return self.record_many([event])[0]

    def record_many(self, events: list[dict[str, Any]]) -> list[AuditEventRecord]:
        stored = [
            _normalized_to_audit_event_record(_normalize_audit_event(event))
            for event in events
        ]
        return self.repository.put_many(
            [(record.event_id, record) for record in stored]
        )

    def record_if_absent(
        self,
        event: dict[str, Any],
    ) -> tuple[AuditEventRecord, bool]:
        candidate = _normalized_to_audit_event_record(_normalize_audit_event(event))
        return self.repository.put_if_absent(candidate.event_id, candidate)

    def get(self, event_id: str) -> AuditEventRecord | None:
        return self.repository.get(str(event_id or "").strip())

    def list_recent(
        self,
        *,
        run_id: str | None = None,
        run_id_is_null: bool = False,
        event_type: str | None = None,
        stage: str | None = None,
        source: str | None = None,
        limit: int = 20,
        offset: int = 0,
        query: str = "",
    ) -> list[AuditEventRecord]:
        event_types = {
            value.strip()
            for value in str(event_type or "").split(",")
            if value.strip()
        }
        needle = query.strip().casefold()
        records = [
            record
            for record in self.repository.all()
            if (run_id is None or record.run_id == run_id)
            and (not run_id_is_null or record.run_id is None)
            and (not event_types or record.event_type in event_types)
            and (stage is None or record.stage == stage)
            and (source is None or record.source == source)
            and (
                not needle
                or needle
                in " ".join(
                    (
                        record.event_id,
                        record.event_type,
                        record.run_id or "",
                        record.stage,
                        record.source,
                        record.summary,
                        record.detail,
                    )
                ).casefold()
            )
        ]
        records.sort(key=lambda record: record.created_at, reverse=True)
        start = max(0, int(offset))
        return records[start : start + max(1, min(int(limit), 50))]

    def list_all_by_run(self, run_id: str) -> list[AuditEventRecord]:
        records = [record for record in self.repository.all() if record.run_id == run_id]
        return sorted(records, key=lambda record: record.created_at, reverse=True)

    def delete_by_run(self, run_id: str) -> None:
        for record in self.list_all_by_run(run_id):
            self.repository.delete(record.event_id)

    def count(
        self,
        *,
        run_id: str | None = None,
        event_type: str | None = None,
        query: str = "",
    ) -> int:
        return len(
            self.list_recent(
                run_id=run_id,
                event_type=event_type,
                query=query,
                limit=50,
            )
        ) if len(self.repository.all()) <= 50 else sum(
            (run_id is None or record.run_id == run_id)
            and (event_type is None or record.event_type == event_type)
            and (
                not query.strip()
                or query.strip().casefold()
                in f"{record.event_id} {record.summary} {record.detail}".casefold()
            )
            for record in self.repository.all()
        )


class TenantResearchRunStore:
    def __init__(self, repository: TenantModelRepository):
        self.repository = repository

    def record(self, audit: ResearchRunAudit) -> None:
        normalized = _research_run_audit_from_payload(
            research_run_audit_to_payload(audit, include_data_snapshot=True)
        )
        self.repository.put(normalized.run_id, normalized)

    def get(self, run_id: str) -> ResearchRunAudit | None:
        return self.repository.get(str(run_id or "").strip())

    def list_recent(self, limit: int = 20) -> list[ResearchRunAudit]:
        records = sorted(
            self.repository.all(),
            key=lambda record: record.created_at,
            reverse=True,
        )
        return records[: max(1, min(int(limit), 100))]

    def list_by_market_ai_selection(self, selection_id: str) -> list[ResearchRunAudit]:
        records = [
            record
            for record in self.repository.all()
            if record.data_snapshot.get("marketAiSelectionEvidence", {}).get(
                "selectionId"
            )
            == str(selection_id or "").strip()
        ]
        return sorted(records, key=lambda record: record.created_at, reverse=True)

    def delete(self, run_id: str) -> None:
        self.repository.delete(str(run_id or "").strip())


class TenantWatchlistStore:
    def __init__(self, repository: TenantModelRepository):
        self.repository = repository

    def list_instruments(self) -> list[Instrument]:
        value = self.repository.get("current")
        return list(value or [])

    def replace_all(self, instruments: Iterable[Instrument]) -> list[Instrument]:
        normalized = normalize_watchlist(instruments)
        self.repository.put("current", normalized)
        return normalized


class TenantWorkspaceStateStore:
    def __init__(self, repository: TenantModelRepository):
        self.repository = repository

    def get(self) -> ResearchWorkspaceState | None:
        return self.repository.get("current")

    def save(self, payload: Mapping[str, object]) -> ResearchWorkspaceState:
        state = research_workspace_state_from_payload(payload)
        return self.repository.put("current", state)


class TenantResearchNoteStore:
    def __init__(self, repository: TenantModelRepository):
        self.repository = repository

    @staticmethod
    def _id(market: str, symbol: str, timeframe: str) -> str:
        return f"{market}\x1f{symbol}\x1f{timeframe}"

    def get(self, *, market: str, symbol: str, timeframe: str) -> ResearchNote:
        existing = self.get_existing(market=market, symbol=symbol, timeframe=timeframe)
        if existing is not None:
            return existing
        market, symbol, timeframe = _normalize_context(market, symbol, timeframe)
        return ResearchNote(market, symbol, timeframe, "", None)

    def get_existing(
        self,
        *,
        market: str,
        symbol: str,
        timeframe: str,
    ) -> ResearchNote | None:
        market, symbol, timeframe = _normalize_context(market, symbol, timeframe)
        return self.repository.get(self._id(market, symbol, timeframe))

    def save(
        self,
        *,
        market: str,
        symbol: str,
        timeframe: str,
        body: str,
        updated_at: datetime | None = None,
    ) -> ResearchNote:
        market, symbol, timeframe = _normalize_context(market, symbol, timeframe)
        note = ResearchNote(
            market,
            symbol,
            timeframe,
            _normalize_research_body(body),
            updated_at or datetime.now(timezone.utc),
        )
        return self.repository.put(self._id(market, symbol, timeframe), note)

    def delete(self, *, market: str, symbol: str, timeframe: str) -> None:
        market, symbol, timeframe = _normalize_context(market, symbol, timeframe)
        self.repository.delete(self._id(market, symbol, timeframe))


class TenantHandoffNoteStore:
    def __init__(self, repository: TenantModelRepository):
        self.repository = repository

    def save(
        self,
        *,
        subject_type: str,
        subject_id: str,
        body: str,
        author: str = "local-operator",
        source_workspace: str = "local",
        note_id: str | None = None,
        updated_at: datetime | None = None,
        audit_event_id: str | None = None,
    ) -> HandoffNote:
        subject_type, subject_id = _normalize_subject(subject_type, subject_id)
        note = HandoffNote(
            _normalize_note_id(note_id),
            subject_type,
            subject_id,
            _normalize_handoff_body(body),
            _normalize_short_text(author, default="local-operator"),
            _normalize_short_text(source_workspace, default="local"),
            _normalize_datetime(updated_at) or datetime.now(timezone.utc),
            _optional_text(audit_event_id),
        )
        return self.repository.put(note.note_id, note)

    def restore(self, note: HandoffNote) -> HandoffNote:
        return self.repository.put(note.note_id, note)

    def get(self, note_id: str) -> HandoffNote | None:
        return self.repository.get(str(note_id or "").strip())

    def list_by_subject(
        self,
        *,
        subject_type: str,
        subject_id: str,
        limit: int = 50,
    ) -> list[HandoffNote]:
        subject_type, subject_id = _normalize_subject(subject_type, subject_id)
        records = [
            note
            for note in self.repository.all()
            if note.subject_type == subject_type and note.subject_id == subject_id
        ]
        records.sort(key=lambda note: (note.updated_at, note.note_id), reverse=True)
        return records[: max(1, min(int(limit), 200))]

    def count_by_subject(self, *, subject_type: str, subject_id: str) -> int:
        return len(
            self.list_by_subject(
                subject_type=subject_type,
                subject_id=subject_id,
                limit=200,
            )
        )

    def list_by_run(self, run_id: str, *, limit: int = 50) -> list[HandoffNote]:
        return self.list_by_subject(
            subject_type="research_run",
            subject_id=run_id,
            limit=limit,
        )

    def delete(self, note_id: str) -> None:
        self.repository.delete(str(note_id or "").strip())

    def delete_by_subject(self, *, subject_type: str, subject_id: str) -> None:
        for note in self.list_by_subject(
            subject_type=subject_type,
            subject_id=subject_id,
            limit=200,
        ):
            self.repository.delete(note.note_id)


class TenantImportUndoStore:
    def __init__(self, repository: TenantModelRepository):
        self.repository = repository

    def record(
        self,
        *,
        run_id: str,
        snapshot: dict[str, Any],
        created_at: datetime | None = None,
        undo_token: str | None = None,
    ) -> ResearchRunImportUndoRecord:
        from uuid import uuid4

        record = ResearchRunImportUndoRecord(
            undo_token or f"import-undo-{uuid4().hex}",
            run_id,
            created_at or datetime.now(timezone.utc),
            None,
            dict(snapshot),
        )
        return self.repository.put(record.undo_token, record)

    def get(self, undo_token: str | None) -> ResearchRunImportUndoRecord | None:
        return self.repository.get(str(undo_token or "").strip())

    def mark_consumed(
        self,
        undo_token: str,
        *,
        consumed_at: datetime | None = None,
    ) -> ResearchRunImportUndoRecord | None:
        record = self.get(undo_token)
        if record is None:
            return None
        return self.repository.put(
            record.undo_token,
            replace(record, consumed_at=consumed_at or datetime.now(timezone.utc)),
        )


class TenantStrategyStore:
    def __init__(self, repository: TenantModelRepository):
        self.repository = repository

    def save(
        self,
        strategy: StrategyConfig,
        *,
        audit_run_id: str | None = None,
        created_at: datetime | None = None,
    ) -> StrategyLibraryRecord:
        return self.save_payload(
            strategy_config_to_payload(strategy),
            audit_run_id=audit_run_id,
            created_at=created_at,
        )

    def save_payload(
        self,
        strategy_config: dict[str, Any],
        *,
        audit_run_id: str | None = None,
        created_at: datetime | None = None,
    ) -> StrategyLibraryRecord:
        config = _normalize_strategy_config_payload(strategy_config)
        revision = str(config.get("revision") or "").strip()
        if not revision:
            raise ValueError("strategy_revision_required")
        existing = self.get(revision)
        final_run_id = audit_run_id or (existing.audit_run_id if existing else None)
        symbols = config.get("symbols") if isinstance(config.get("symbols"), list) else []
        record = StrategyLibraryRecord(
            strategy_id=f"strategy-{revision}",
            created_at=existing.created_at if existing else created_at or datetime.now(timezone.utc),
            name=str(config.get("name") or "Imported strategy"),
            revision=revision,
            market=str(config.get("market") or "ashare"),
            symbol=str(symbols[0] if symbols else ""),
            timeframe=str(config.get("timeframe") or "1d"),
            version=int(config.get("version") or 1),
            status="audited" if final_run_id else "draft",
            audit_run_id=final_run_id,
            strategy_config=config,
        )
        return self.repository.put(revision, record)

    def list_recent(
        self,
        *,
        market: str | None = None,
        symbol: str | None = None,
        limit: int = 20,
    ) -> list[StrategyLibraryRecord]:
        records = [
            record
            for record in self.repository.all()
            if (market is None or record.market == market)
            and (symbol is None or record.symbol == symbol)
        ]
        records.sort(key=lambda record: record.created_at, reverse=True)
        return records[: max(1, min(int(limit), 100))]

    def get(self, revision: str) -> StrategyLibraryRecord | None:
        return self.repository.get(str(revision or "").strip())

    def restore(self, record: StrategyLibraryRecord) -> StrategyLibraryRecord:
        return self.repository.put(record.revision, record)

    def delete(self, revision: str) -> None:
        self.repository.delete(str(revision or "").strip())


class TenantSimpleRecordStore:
    def __init__(self, repository: TenantModelRepository, id_field: str):
        self.repository = repository
        self.id_field = id_field

    def record(self, value: Any) -> Any:
        return self.repository.put(str(getattr(value, self.id_field)), value)

    def get(self, record_id: str | None) -> Any | None:
        return self.repository.get(str(record_id or "").strip())

    def list_recent(self, limit: int = 10, **filters: Any) -> list[Any]:
        records = [
            record
            for record in self.repository.all()
            if all(value is None or getattr(record, key, None) == value for key, value in filters.items())
        ]
        records.sort(
            key=lambda record: getattr(record, "created_at", datetime.min.replace(tzinfo=timezone.utc)),
            reverse=True,
        )
        return records[: max(1, min(int(limit), 100))]
