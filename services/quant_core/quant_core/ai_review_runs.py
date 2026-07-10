from __future__ import annotations

import json
import re
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from quant_core.canonical import canonical_json, canonical_sha256


_V2_BOUNDARY = {
    "purpose": "research_evidence_review_only",
    "paperOnly": True,
    "liveTradingAllowed": False,
    "orderSubmissionAllowed": False,
}
_V2_EVIDENCE_BOUNDARY = {
    "paperOnly": True,
    "liveTradingAllowed": False,
    "orderSubmissionAllowed": False,
}
_V2_EXPERIMENT_FIELDS = (
    "experimentId",
    "sourceRunId",
    "strategyRevision",
    "snapshotId",
    "definitionHash",
    "resultHash",
    "selectedCandidateId",
    "candidateRevision",
    "canonicalDataHash",
)
_V2_HASH_EXPERIMENT_FIELDS = {
    "snapshotId",
    "definitionHash",
    "resultHash",
    "canonicalDataHash",
}
_V2_RECORD_FIELDS = {
    "schemaVersion",
    "recordType",
    "aiReviewId",
    "createdAt",
    "mode",
    "primaryExperiment",
    "comparisonExperiments",
    "strategyLineageKey",
    "evidenceBundle",
    "evidenceHash",
    "deterministicAssessment",
    "externalAssessment",
    "boundary",
    "recordHash",
}
_V2_EVIDENCE_FIELDS = {
    "schemaVersion",
    "mode",
    "primaryExperiment",
    "comparisonExperiments",
    "strategyLineageKey",
    "evidenceItems",
    "safetyBoundary",
    "evidenceHash",
}
_V2_EXTERNAL_FIELDS = {
    "status",
    "provider",
    "model",
    "sanitizedBaseUrl",
    "endpointHash",
    "promptTemplateVersion",
    "outputSchemaVersion",
    "renderedPrompt",
    "renderedPromptHash",
    "evidenceHash",
    "requestHash",
    "responseHash",
    "assessment",
    "usage",
    "latencyMs",
    "error",
}
_V2_USAGE_FIELDS = {"inputTokens", "outputTokens", "totalTokens"}
_V2_PROVIDER_IDS = {"local", "openai", "openai-compatible", "ollama"}
_V2_PROMPT_TEMPLATE_VERSION = "aiqt-ai-review-v1"
_V2_OUTPUT_SCHEMA_VERSION = "aiqt-ai-review-assessment-v1"
_V2_OPENAI_BASE_URL = "https://api.openai.com/v1"
_V2_OPENAI_ENDPOINT = "https://api.openai.com/v1/responses"
_V2_REVIEW_ID_PATTERN = re.compile(r"^ai-review-[0-9a-f]{32}$")
_V2_SAFE_ERROR_CODE_PATTERN = re.compile(r"^[a-z][a-z0-9_]{0,99}$")
_V2_SECRET_ASSIGNMENT_PATTERN = re.compile(
    r"\b(?:access[_ -]?token|token|secret|api[_ -]?key|password|authorization|private[_ -]?key)\b\s*[:=]\s*\S+",
    re.IGNORECASE,
)
_V2_ERROR_SECRET_PATTERN = re.compile(
    r"(?:access[_ -]?token|api[_ -]?key|private[_ -]?key|authorization|password|bearer|secret|\bsk-(?:proj-)?[a-z0-9_-]{8,}\b)",
    re.IGNORECASE,
)
_SELECT_COLUMNS = (
    "ai_review_id, run_id, created_at, record_json, schema_version, "
    "primary_experiment_id, evidence_hash, record_hash, authority"
)


@dataclass(frozen=True)
class AiReviewRunRecord:
    ai_review_id: str
    run_id: str
    created_at: datetime
    record: dict[str, Any]

    @property
    def authority(self) -> Literal["legacy"]:
        return "legacy"


@dataclass(frozen=True)
class AuthoritativeAiReviewRunRecord:
    ai_review_id: str
    run_id: str
    primary_experiment_id: str
    created_at: datetime
    evidence_hash: str
    record_hash: str
    record: dict[str, Any]

    @property
    def authority(self) -> Literal["authoritative"]:
        return "authoritative"


class AiReviewRunStore:
    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.path, timeout=30)

    def _init_schema(self) -> None:
        connection = self._connect()
        try:
            connection.execute("begin immediate")
            connection.execute(
                """
                create table if not exists ai_review_runs (
                    ai_review_id text primary key,
                    run_id text not null,
                    created_at text not null,
                    record_json text not null
                )
                """
            )
            columns = {str(row[1]) for row in connection.execute("pragma table_info(ai_review_runs)")}
            migrations = {
                "schema_version": "alter table ai_review_runs add column schema_version integer",
                "primary_experiment_id": "alter table ai_review_runs add column primary_experiment_id text",
                "evidence_hash": "alter table ai_review_runs add column evidence_hash text",
                "record_hash": "alter table ai_review_runs add column record_hash text",
                "authority": "alter table ai_review_runs add column authority text",
            }
            for column, statement in migrations.items():
                if column not in columns:
                    connection.execute(statement)
            for statement in (
                "create index if not exists idx_ai_review_runs_created_at on ai_review_runs(created_at desc)",
                "create index if not exists idx_ai_review_runs_run_id on ai_review_runs(run_id)",
                "create index if not exists idx_ai_review_runs_primary_experiment_id "
                "on ai_review_runs(primary_experiment_id)",
                "create index if not exists idx_ai_review_runs_record_hash on ai_review_runs(record_hash)",
                "create index if not exists idx_ai_review_runs_run_id_created_at "
                "on ai_review_runs(run_id, created_at desc)",
            ):
                connection.execute(statement)
            connection.commit()
        except BaseException:
            connection.rollback()
            raise
        finally:
            connection.close()

    def record(self, record: dict[str, Any]) -> AiReviewRunRecord:
        normalized = _normalize_ai_review_record(record)
        stored = AiReviewRunRecord(
            ai_review_id=str(normalized["aiReviewId"]),
            run_id=str(normalized["runId"]),
            created_at=_parse_datetime(str(normalized["createdAt"])),
            record=normalized,
        )
        connection = self._connect()
        try:
            connection.execute("begin immediate")
            row = connection.execute(
                f"select {_SELECT_COLUMNS} from ai_review_runs where ai_review_id = ?",
                (stored.ai_review_id,),
            ).fetchone()
            if row is not None and _row_has_v2_identity(row):
                raise ValueError("ai_review_record_conflict")
            connection.execute(
                """
                insert into ai_review_runs (
                    ai_review_id,
                    run_id,
                    created_at,
                    record_json
                )
                values (?, ?, ?, ?)
                on conflict(ai_review_id) do update set
                    run_id = excluded.run_id,
                    created_at = excluded.created_at,
                    record_json = excluded.record_json
                """,
                (
                    stored.ai_review_id,
                    stored.run_id,
                    stored.created_at.isoformat(),
                    json.dumps(stored.record, ensure_ascii=False, sort_keys=True),
                ),
            )
            connection.commit()
        except BaseException:
            connection.rollback()
            raise
        finally:
            connection.close()
        return stored

    def record_v2(self, record: dict[str, Any]) -> AuthoritativeAiReviewRunRecord:
        stored = _authoritative_ai_review_run_record(record)
        connection = self._connect()
        try:
            connection.execute("begin immediate")
            row = connection.execute(
                f"select {_SELECT_COLUMNS} from ai_review_runs where ai_review_id = ?",
                (stored.ai_review_id,),
            ).fetchone()
            if row is not None:
                try:
                    existing = _row_to_ai_review_run_record(row)
                except (TypeError, ValueError):
                    raise ValueError("ai_review_record_conflict") from None
                if (
                    isinstance(existing, AuthoritativeAiReviewRunRecord)
                    and existing.record_hash == stored.record_hash
                ):
                    connection.commit()
                    return existing
                raise ValueError("ai_review_record_conflict")
            connection.execute(
                """
                insert into ai_review_runs (
                    ai_review_id,
                    run_id,
                    created_at,
                    record_json,
                    schema_version,
                    primary_experiment_id,
                    evidence_hash,
                    record_hash,
                    authority
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    stored.ai_review_id,
                    stored.run_id,
                    stored.created_at.isoformat(),
                    canonical_json(stored.record),
                    2,
                    stored.primary_experiment_id,
                    stored.evidence_hash,
                    stored.record_hash,
                    stored.authority,
                ),
            )
            connection.commit()
            return stored
        except BaseException:
            connection.rollback()
            raise
        finally:
            connection.close()

    def get(self, ai_review_id: str) -> AiReviewRunRecord | AuthoritativeAiReviewRunRecord | None:
        connection = self._connect()
        try:
            row = connection.execute(
                f"select {_SELECT_COLUMNS} from ai_review_runs where ai_review_id = ?",
                (ai_review_id,),
            ).fetchone()
        finally:
            connection.close()
        return _row_to_ai_review_run_record(row) if row is not None else None

    def list_recent(
        self,
        *,
        run_id: str | None = None,
        experiment_id: str | None = None,
        limit: int = 20,
        offset: int = 0,
        query: str = "",
    ) -> list[AiReviewRunRecord | AuthoritativeAiReviewRunRecord]:
        bounded_limit = _bounded_limit(limit)
        bounded_offset = max(0, int(_number_or_default(offset, 0)))
        filter_sql, parameters = _filter_parameters(
            run_id=run_id,
            experiment_id=experiment_id,
            query=query,
        )
        connection = self._connect()
        try:
            rows = connection.execute(
                f"""
                select {_SELECT_COLUMNS}
                from ai_review_runs
                where {filter_sql}
                order by created_at desc, ai_review_id
                limit ?
                offset ?
                """,
                (*parameters, bounded_limit, bounded_offset),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_ai_review_run_record(row) for row in rows]

    def list_by_run(
        self,
        run_id: str,
        limit: int = 20,
        offset: int = 0,
        query: str = "",
    ) -> list[AiReviewRunRecord | AuthoritativeAiReviewRunRecord]:
        return self.list_recent(run_id=run_id, limit=limit, offset=offset, query=query)

    def list_by_experiment(
        self,
        experiment_id: str,
        limit: int = 20,
        offset: int = 0,
        query: str = "",
    ) -> list[AuthoritativeAiReviewRunRecord]:
        return [
            record
            for record in self.list_recent(
                experiment_id=experiment_id,
                limit=limit,
                offset=offset,
                query=query,
            )
            if isinstance(record, AuthoritativeAiReviewRunRecord)
        ]

    def list_all_by_run(
        self,
        run_id: str,
    ) -> list[AiReviewRunRecord | AuthoritativeAiReviewRunRecord]:
        connection = self._connect()
        try:
            rows = connection.execute(
                f"""
                select {_SELECT_COLUMNS}
                from ai_review_runs
                where run_id = ?
                order by created_at desc, ai_review_id
                """,
                (run_id,),
            ).fetchall()
        finally:
            connection.close()
        return [_row_to_ai_review_run_record(row) for row in rows]

    def count_recent(
        self,
        *,
        run_id: str | None = None,
        experiment_id: str | None = None,
        query: str = "",
    ) -> int:
        filter_sql, parameters = _filter_parameters(
            run_id=run_id,
            experiment_id=experiment_id,
            query=query,
        )
        connection = self._connect()
        try:
            row = connection.execute(
                f"""
                select count(*)
                from ai_review_runs
                where {filter_sql}
                """,
                parameters,
            ).fetchone()
        finally:
            connection.close()
        return int(row[0]) if row else 0

    def count_by_run(self, run_id: str, query: str = "") -> int:
        return self.count_recent(run_id=run_id, query=query)

    def delete_by_run(self, run_id: str) -> None:
        connection = self._connect()
        try:
            connection.execute("delete from ai_review_runs where run_id = ?", (run_id,))
            connection.commit()
        finally:
            connection.close()


def ai_review_run_record_to_payload(record: AiReviewRunRecord) -> dict[str, Any]:
    return {
        "aiReviewId": record.ai_review_id,
        "runId": record.run_id,
        "createdAt": record.created_at.isoformat(),
        "record": record.record,
    }


def _normalize_ai_review_record(value: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("ai_review_record_must_be_object")
    if int(_number_or_default(value.get("schemaVersion"), 0)) != 1:
        raise ValueError("unsupported_ai_review_schema_version")
    if value.get("recordType") != "aiqt.aiReviewRun":
        raise ValueError("unsupported_ai_review_record_type")

    ai_review_id = str(value.get("aiReviewId") or "").strip()
    run_id = str(value.get("runId") or "").strip()
    created_at = str(value.get("createdAt") or "").strip()
    boundary = str(value.get("boundary") or "").strip()
    if not ai_review_id:
        raise ValueError("ai_review_id_required")
    if not run_id:
        raise ValueError("run_id_required")
    if not created_at:
        raise ValueError("created_at_required")
    _parse_datetime(created_at)
    if not boundary:
        raise ValueError("ai_review_boundary_required")

    return {
        **value,
        "schemaVersion": 1,
        "recordType": "aiqt.aiReviewRun",
        "aiReviewId": ai_review_id,
        "runId": run_id,
        "createdAt": created_at,
        "status": str(value.get("status") or "ready"),
        "summary": _dict_or_empty(value.get("summary")),
        "dossier": _dict_or_empty(value.get("dossier")),
        "citations": _list_or_empty(value.get("citations")),
        "rounds": _list_or_empty(value.get("rounds")),
        "decisionLog": _list_or_empty(value.get("decisionLog")),
        "boundary": boundary,
    }


def _authoritative_ai_review_run_record(value: Any) -> AuthoritativeAiReviewRunRecord:
    normalized = _normalize_authoritative_ai_review_record(value)
    primary_experiment = normalized["primaryExperiment"]
    return AuthoritativeAiReviewRunRecord(
        ai_review_id=normalized["aiReviewId"],
        run_id=primary_experiment["sourceRunId"],
        primary_experiment_id=primary_experiment["experimentId"],
        created_at=_parse_datetime(normalized["createdAt"]),
        evidence_hash=normalized["evidenceHash"],
        record_hash=normalized["recordHash"],
        record=normalized,
    )


def _normalize_authoritative_ai_review_record(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("ai_review_record_must_be_object")
    if type(value.get("schemaVersion")) is not int or value.get("schemaVersion") != 2:
        raise ValueError("unsupported_ai_review_schema_version")
    if value.get("recordType") != "aiqt.aiReviewRun":
        raise ValueError("unsupported_ai_review_record_type")
    actual_fields = set(value)
    if actual_fields - _V2_RECORD_FIELDS or (
        _V2_RECORD_FIELDS - actual_fields
    ) - {"recordHash", "evidenceHash"}:
        raise ValueError("ai_review_record_invalid")

    ai_review_id = _required_string(value, "aiReviewId", "ai_review_id_required")
    if not _V2_REVIEW_ID_PATTERN.fullmatch(ai_review_id):
        raise ValueError("ai_review_id_invalid")
    created_at = _required_string(value, "createdAt", "created_at_required")
    _canonical_utc_datetime(created_at)
    mode = value.get("mode")
    if mode not in {"single", "comparison"}:
        raise ValueError("ai_review_mode_invalid")

    primary_experiment = _experiment_reference(value.get("primaryExperiment"))
    raw_comparisons = value.get("comparisonExperiments")
    if not isinstance(raw_comparisons, list):
        raise ValueError("ai_review_comparison_experiments_invalid")
    comparison_experiments = [_experiment_reference(item) for item in raw_comparisons]
    comparison_ids = [item["experimentId"] for item in comparison_experiments]
    if (
        len(comparison_experiments) > 4
        or len(set(comparison_ids)) != len(comparison_ids)
        or primary_experiment["experimentId"] in comparison_ids
        or (mode == "single" and comparison_experiments)
        or (mode == "comparison" and not comparison_experiments)
    ):
        raise ValueError("ai_review_comparison_experiments_invalid")

    strategy_lineage_key = _required_hash(
        value.get("strategyLineageKey"),
        "ai_review_strategy_lineage_key_invalid",
    )
    evidence_hash = _required_hash(
        value.get("evidenceHash"),
        "ai_review_evidence_hash_required",
    )
    evidence_bundle = validate_ai_review_evidence_bundle(value.get("evidenceBundle"))
    bundle_hash = evidence_bundle["evidenceHash"]
    if evidence_hash != bundle_hash:
        raise ValueError("ai_review_evidence_hash_mismatch")
    if (
        evidence_bundle.get("schemaVersion") != 1
        or evidence_bundle.get("mode") != mode
        or evidence_bundle.get("strategyLineageKey") != strategy_lineage_key
        or canonical_json(evidence_bundle.get("primaryExperiment")) != canonical_json(primary_experiment)
        or canonical_json(evidence_bundle.get("comparisonExperiments"))
        != canonical_json(comparison_experiments)
    ):
        raise ValueError("ai_review_evidence_binding_invalid")
    known_evidence_ids = frozenset(
        item["id"] for item in evidence_bundle["evidenceItems"]
    )
    from quant_core.ai_review_stage3 import validate_assessment

    try:
        validate_assessment(value.get("deterministicAssessment"), known_evidence_ids)
    except (TypeError, ValueError) as error:
        raise ValueError("ai_review_deterministic_assessment_invalid") from error
    _validate_external_assessment(
        value.get("externalAssessment"),
        evidence_hash=evidence_hash,
        known_evidence_ids=known_evidence_ids,
    )
    _validate_exact_boundary(value.get("boundary"), _V2_BOUNDARY)

    record_hash = _required_hash(
        value.get("recordHash"),
        "ai_review_record_hash_required",
    )
    expected_record_hash = canonical_sha256(
        {key: item for key, item in value.items() if key != "recordHash"}
    )
    if record_hash != expected_record_hash:
        raise ValueError("ai_review_record_hash_mismatch")

    normalized = json.loads(canonical_json(value))
    normalized["aiReviewId"] = ai_review_id
    normalized["createdAt"] = created_at
    return normalized


def _experiment_reference(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("ai_review_experiment_reference_invalid")
    if set(value) != {*_V2_EXPERIMENT_FIELDS, "dataRange"}:
        raise ValueError("ai_review_experiment_reference_invalid")
    for field in _V2_EXPERIMENT_FIELDS:
        _required_string(value, field, "ai_review_experiment_reference_invalid")
    for field in _V2_HASH_EXPERIMENT_FIELDS:
        _required_hash(value[field], "ai_review_experiment_reference_invalid")
    data_range = value.get("dataRange")
    if not isinstance(data_range, dict) or set(data_range) != {"startAt", "endAt"}:
        raise ValueError("ai_review_experiment_reference_invalid")
    start_at = _required_string(data_range, "startAt", "ai_review_experiment_reference_invalid")
    end_at = _required_string(data_range, "endAt", "ai_review_experiment_reference_invalid")
    if _parse_datetime(start_at) > _parse_datetime(end_at):
        raise ValueError("ai_review_experiment_reference_invalid")
    return value


def validate_ai_review_evidence_bundle(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != _V2_EVIDENCE_FIELDS:
        raise ValueError("ai_review_evidence_bundle_invalid")
    if type(value.get("schemaVersion")) is not int or value.get("schemaVersion") != 1:
        raise ValueError("ai_review_evidence_bundle_invalid")
    mode = value.get("mode")
    if mode not in {"single", "comparison"}:
        raise ValueError("ai_review_evidence_bundle_invalid")
    primary = _experiment_reference(value.get("primaryExperiment"))
    comparisons_value = value.get("comparisonExperiments")
    if not isinstance(comparisons_value, list):
        raise ValueError("ai_review_comparison_experiments_invalid")
    comparisons = [_experiment_reference(item) for item in comparisons_value]
    comparison_ids = [item["experimentId"] for item in comparisons]
    if (
        len(comparisons) > 4
        or len(comparison_ids) != len(set(comparison_ids))
        or primary["experimentId"] in comparison_ids
        or (mode == "single" and comparisons)
        or (mode == "comparison" and not comparisons)
    ):
        raise ValueError("ai_review_comparison_experiments_invalid")
    _required_hash(
        value.get("strategyLineageKey"),
        "ai_review_strategy_lineage_key_invalid",
    )
    evidence_items = value.get("evidenceItems")
    if not isinstance(evidence_items, list) or not evidence_items:
        raise ValueError("ai_review_evidence_items_invalid")
    evidence_ids: list[str] = []
    for item in evidence_items:
        if not isinstance(item, dict) or set(item) != {"id", "kind", "value"}:
            raise ValueError("ai_review_evidence_items_invalid")
        evidence_ids.append(_required_string(item, "id", "ai_review_evidence_items_invalid"))
        _required_string(item, "kind", "ai_review_evidence_items_invalid")
        if not isinstance(item.get("value"), dict):
            raise ValueError("ai_review_evidence_items_invalid")
    if len(evidence_ids) != len(set(evidence_ids)):
        raise ValueError("ai_review_evidence_items_invalid")
    _validate_exact_boundary(value.get("safetyBoundary"), _V2_EVIDENCE_BOUNDARY)
    evidence_hash = _required_hash(
        value.get("evidenceHash"),
        "ai_review_evidence_hash_required",
    )
    try:
        expected_hash = canonical_sha256(
            {key: item for key, item in value.items() if key != "evidenceHash"}
        )
    except (TypeError, ValueError) as error:
        raise ValueError("ai_review_evidence_bundle_invalid") from error
    if evidence_hash != expected_hash:
        raise ValueError("ai_review_evidence_hash_mismatch")
    return json.loads(canonical_json(value))


def expected_ai_review_provider_endpoint(
    provider_id: Any,
    sanitized_base_url: Any,
) -> str | None:
    if provider_id == "local":
        if sanitized_base_url is not None:
            raise ValueError("ai_review_provider_provenance_invalid")
        return None
    if provider_id not in _V2_PROVIDER_IDS or not isinstance(sanitized_base_url, str):
        raise ValueError("ai_review_provider_provenance_invalid")
    from quant_core.ai_review_providers import sanitize_base_url

    if not sanitized_base_url or sanitize_base_url(sanitized_base_url) != sanitized_base_url:
        raise ValueError("ai_review_provider_provenance_invalid")
    if provider_id == "openai":
        if sanitized_base_url != _V2_OPENAI_BASE_URL:
            raise ValueError("ai_review_provider_provenance_invalid")
        return _V2_OPENAI_ENDPOINT
    suffix = "/chat/completions" if provider_id == "openai-compatible" else "/api/chat"
    return sanitized_base_url.rstrip("/") + suffix


def _validate_external_assessment(
    value: Any,
    *,
    evidence_hash: str,
    known_evidence_ids: frozenset[str],
) -> None:
    if not isinstance(value, dict) or set(value) != _V2_EXTERNAL_FIELDS:
        raise ValueError("ai_review_external_assessment_invalid")
    status = value.get("status")
    provider = value.get("provider")
    if status not in {"completed", "failed", "skipped"} or provider not in _V2_PROVIDER_IDS:
        raise ValueError("ai_review_external_assessment_invalid")
    if value.get("promptTemplateVersion") != _V2_PROMPT_TEMPLATE_VERSION:
        raise ValueError("ai_review_external_assessment_invalid")
    if value.get("outputSchemaVersion") != _V2_OUTPUT_SCHEMA_VERSION:
        raise ValueError("ai_review_external_assessment_invalid")
    rendered_prompt = value.get("renderedPrompt")
    if not isinstance(rendered_prompt, str):
        raise ValueError("ai_review_external_assessment_invalid")
    if value.get("renderedPromptHash") != canonical_sha256(rendered_prompt):
        raise ValueError("ai_review_external_assessment_invalid")
    if value.get("evidenceHash") != evidence_hash:
        raise ValueError("ai_review_external_assessment_invalid")
    latency_ms = value.get("latencyMs")
    if type(latency_ms) is not int or latency_ms < 0:
        raise ValueError("ai_review_external_assessment_invalid")

    model = value.get("model")
    safe_base = value.get("sanitizedBaseUrl")
    if status == "skipped":
        if (
            provider != "local"
            or model is not None
            or safe_base is not None
            or rendered_prompt != ""
            or latency_ms != 0
            or any(
                value.get(field) is not None
                for field in (
                    "endpointHash",
                    "requestHash",
                    "responseHash",
                    "assessment",
                    "usage",
                    "error",
                )
            )
        ):
            raise ValueError("ai_review_external_assessment_invalid")
        expected_ai_review_provider_endpoint(provider, safe_base)
        return

    if provider == "local":
        raise ValueError("ai_review_external_assessment_invalid")
    error = value.get("error")
    if status == "failed" and _is_unconfigured_error(error):
        if (
            value.get("endpointHash") is not None
            or value.get("requestHash") is not None
            or value.get("responseHash") is not None
            or value.get("assessment") is not None
            or value.get("usage") is not None
            or latency_ms != 0
        ):
            raise ValueError("ai_review_external_assessment_invalid")
        if model is not None:
            _validate_nonempty_string(model, "ai_review_external_assessment_invalid")
        if safe_base is not None:
            expected_ai_review_provider_endpoint(provider, safe_base)
        _validate_external_error(error)
        return

    _validate_nonempty_string(model, "ai_review_external_assessment_invalid")
    expected_endpoint = expected_ai_review_provider_endpoint(provider, safe_base)
    endpoint_hash = _required_hash(
        value.get("endpointHash"),
        "ai_review_external_assessment_invalid",
    )
    if endpoint_hash != canonical_sha256(expected_endpoint):
        raise ValueError("ai_review_external_assessment_invalid")
    expected_request_hash = canonical_sha256(
        {
            "provider": provider,
            "model": model,
            "endpointHash": endpoint_hash,
            "promptTemplateVersion": value["promptTemplateVersion"],
            "outputSchemaVersion": value["outputSchemaVersion"],
            "renderedPromptHash": value["renderedPromptHash"],
            "evidenceHash": evidence_hash,
        }
    )
    if value.get("requestHash") != expected_request_hash:
        raise ValueError("ai_review_external_assessment_invalid")

    if status == "failed":
        if (
            value.get("responseHash") is not None
            or value.get("assessment") is not None
            or value.get("usage") is not None
        ):
            raise ValueError("ai_review_external_assessment_invalid")
        _validate_external_error(error)
        return

    if error is not None:
        raise ValueError("ai_review_external_assessment_invalid")
    from quant_core.ai_review_stage3 import validate_assessment

    try:
        assessment = validate_assessment(value.get("assessment"), known_evidence_ids)
    except (TypeError, ValueError) as validation_error:
        raise ValueError("ai_review_external_assessment_invalid") from validation_error
    usage = _validate_usage(value.get("usage"))
    expected_response_hash = canonical_sha256(
        {"assessment": assessment, "usage": usage}
    )
    if value.get("responseHash") != expected_response_hash:
        raise ValueError("ai_review_external_assessment_invalid")


def _validate_usage(value: Any) -> dict[str, int]:
    if not isinstance(value, dict) or not set(value) <= _V2_USAGE_FIELDS:
        raise ValueError("ai_review_external_assessment_invalid")
    if any(type(item) is not int or item < 0 for item in value.values()):
        raise ValueError("ai_review_external_assessment_invalid")
    return value


def _is_unconfigured_error(value: Any) -> bool:
    return isinstance(value, dict) and value.get("code") == "ai_review_provider_not_configured"


def _validate_external_error(value: Any) -> None:
    if not isinstance(value, dict) or set(value) != {"code", "message"}:
        raise ValueError("ai_review_external_assessment_invalid")
    code = value.get("code")
    message = value.get("message")
    if not isinstance(code, str) or not _V2_SAFE_ERROR_CODE_PATTERN.fullmatch(code):
        raise ValueError("ai_review_external_assessment_invalid")
    if (
        not isinstance(message, str)
        or not message
        or message != message.strip()
        or len(message) > 500
    ):
        raise ValueError("ai_review_external_assessment_invalid")
    if any(
        pattern.search(message)
        for pattern in (
            _V2_SECRET_ASSIGNMENT_PATTERN,
            _V2_ERROR_SECRET_PATTERN,
        )
    ):
        raise ValueError("ai_review_external_assessment_invalid")


def _validate_exact_boundary(value: Any, expected: dict[str, Any]) -> None:
    if not isinstance(value, dict) or set(value) != set(expected):
        raise ValueError("ai_review_boundary_invalid")
    for key, expected_value in expected.items():
        item = value.get(key)
        if isinstance(expected_value, bool):
            if type(item) is not bool or item is not expected_value:
                raise ValueError("ai_review_boundary_invalid")
        elif type(item) is not type(expected_value) or item != expected_value:
            raise ValueError("ai_review_boundary_invalid")


def _validate_nonempty_string(value: Any, code: str) -> str:
    if not isinstance(value, str) or not value or value != value.strip():
        raise ValueError(code)
    return value


def _canonical_utc_datetime(value: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError as error:
        raise ValueError("created_at_invalid") from error
    if parsed.tzinfo is None or parsed.utcoffset() != timezone.utc.utcoffset(parsed):
        raise ValueError("created_at_invalid")
    if parsed.isoformat() != value:
        raise ValueError("created_at_invalid")
    return parsed


def _required_string(value: dict[str, Any], field: str, code: str) -> str:
    item = value.get(field)
    if not isinstance(item, str) or not item.strip() or item != item.strip():
        raise ValueError(code)
    return item


def _required_hash(value: Any, code: str) -> str:
    if (
        not isinstance(value, str)
        or len(value) != 64
        or any(character not in "0123456789abcdef" for character in value)
    ):
        raise ValueError(code)
    return value


def _row_to_ai_review_run_record(
    row: tuple[Any, ...],
) -> AiReviewRunRecord | AuthoritativeAiReviewRunRecord:
    decoded = json.loads(row[3])
    if _row_has_v2_identity(row, decoded):
        return _authoritative_ai_review_run_record(decoded)
    record = _dict_or_empty(decoded)
    return AiReviewRunRecord(
        ai_review_id=str(row[0]),
        run_id=str(row[1]),
        created_at=_parse_datetime(str(row[2])),
        record=record,
    )


def _row_has_v2_identity(row: tuple[Any, ...], record: Any = None) -> bool:
    if _row_has_authoritative_query_columns(row):
        return True
    if record is None:
        try:
            record = json.loads(row[3])
        except (json.JSONDecodeError, TypeError):
            return False
    return isinstance(record, dict) and record.get("schemaVersion") == 2


def _row_has_authoritative_query_columns(row: tuple[Any, ...]) -> bool:
    return any(value is not None for value in row[4:9])


def _parse_datetime(value: str) -> datetime:
    normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _dict_or_empty(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _list_or_empty(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _number_or_default(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _bounded_limit(value: int) -> int:
    return max(1, min(int(_number_or_default(value, 20)), 50))


def _filter_parameters(
    *,
    run_id: str | None,
    experiment_id: str | None,
    query: str,
) -> tuple[str, tuple[Any, ...]]:
    filters: list[str] = []
    parameters: list[Any] = []
    if run_id is not None:
        filters.append("run_id = ?")
        parameters.append(run_id)
    if experiment_id is not None:
        filters.append("primary_experiment_id = ?")
        parameters.append(experiment_id)
    normalized_query = str(query or "").strip()
    if normalized_query:
        filters.append("(lower(ai_review_id) like ? or lower(record_json) like ?)")
        like_query = f"%{normalized_query.lower()}%"
        parameters.extend((like_query, like_query))
    return " and ".join(filters) or "1 = 1", tuple(parameters)
