from __future__ import annotations

from ..support.stage5 import _parse_limit
from ..support.transport import _execution_adapter_secret_store_root
from quant_core.audit_events import audit_event_record_to_payload
from quant_core.execution import (
    build_execution_adapter_environment_binding,
    build_execution_adapter_secret_manifest_validation,
    build_execution_adapter_secret_materialization,
    build_execution_adapter_secret_reference,
    execution_adapter_environment_binding_payload_from_audit_event,
    execution_adapter_environment_binding_to_audit_event_payload,
    execution_adapter_environment_binding_to_payload,
    execution_adapter_secret_manifest_validation_payload_from_audit_event,
    execution_adapter_secret_manifest_validation_to_audit_event_payload,
    execution_adapter_secret_manifest_validation_to_payload,
    execution_adapter_secret_materialization_payload_from_audit_event,
    execution_adapter_secret_materialization_to_audit_event_payload,
    execution_adapter_secret_materialization_to_payload,
    execution_adapter_secret_reference_payload_from_audit_event,
    execution_adapter_secret_reference_to_audit_event_payload,
    execution_adapter_secret_reference_to_payload,
    materialize_execution_adapter_secret_manifest,
)
from urllib.parse import parse_qs

def post_execution_adapter_secret_references(self, parsed):
    try:
        payload = self._read_json_body()
        secret_reference = build_execution_adapter_secret_reference(
            adapter_id=str(payload.get("adapterId") or ""),
            market=str(payload.get("market") or ""),
            route=str(payload.get("route") or ""),
            reference_name=str(payload.get("referenceName") or ""),
            backend=str(payload.get("backend") or ""),
            required_env_vars=payload.get("requiredEnvVars") if isinstance(payload.get("requiredEnvVars"), list) else [],
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_secret_reference", "detail": str(error)}, status=400)
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_secret_reference_to_audit_event_payload(secret_reference)
    )
    self._send_json(
        {
            "adapterSecretReference": execution_adapter_secret_reference_to_payload(secret_reference),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if secret_reference.status == "blocked" else 201,
    )
    return


def post_execution_adapter_secret_materializations(self, parsed):
    payload = self._read_json_body()
    reference_id = str(payload.get("referenceId") or "").strip()
    reference_event = self.audit_event_store.get(reference_id)
    secret_reference = (
        execution_adapter_secret_reference_payload_from_audit_event(reference_event) if reference_event else None
    )
    if not secret_reference:
        self._send_json(
            {"error": "execution_adapter_secret_reference_not_found", "referenceId": reference_id},
            status=404,
        )
        return
    try:
        materialization = build_execution_adapter_secret_materialization(
            secret_reference,
            adapter_id=str(payload.get("adapterId") or ""),
            manifest_path=str(payload.get("manifestPath") or ""),
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_secret_materialization", "detail": str(error)}, status=400)
        return
    materialize_execution_adapter_secret_manifest(
        materialization,
        secret_store_root=_execution_adapter_secret_store_root(self.audit_event_store),
    )
    audit_event = self.audit_event_store.record(
        execution_adapter_secret_materialization_to_audit_event_payload(materialization)
    )
    self._send_json(
        {
            "adapterSecretMaterialization": execution_adapter_secret_materialization_to_payload(materialization),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if materialization.status == "blocked" else 201,
    )
    return


def post_execution_adapter_secret_manifest_validations(self, parsed):
    payload = self._read_json_body()
    materialization_id = str(payload.get("materializationId") or "").strip()
    materialization_event = self.audit_event_store.get(materialization_id)
    materialization = (
        execution_adapter_secret_materialization_payload_from_audit_event(materialization_event)
        if materialization_event
        else None
    )
    if not materialization:
        self._send_json(
            {
                "error": "execution_adapter_secret_materialization_not_found",
                "materializationId": materialization_id,
            },
            status=404,
        )
        return
    try:
        validation = build_execution_adapter_secret_manifest_validation(
            materialization,
            adapter_id=str(payload.get("adapterId") or ""),
            manifest_path=str(payload.get("manifestPath") or ""),
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
            secret_store_root=_execution_adapter_secret_store_root(self.audit_event_store),
        )
    except ValueError as error:
        self._send_json(
            {"error": "invalid_execution_adapter_secret_manifest_validation", "detail": str(error)},
            status=400,
        )
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_secret_manifest_validation_to_audit_event_payload(validation)
    )
    self._send_json(
        {
            "adapterSecretManifestValidation": execution_adapter_secret_manifest_validation_to_payload(validation),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if validation.status == "blocked" else 201,
    )
    return


def post_execution_adapter_environment_bindings(self, parsed):
    payload = self._read_json_body()
    manifest_validation_id = str(payload.get("manifestValidationId") or "").strip()
    manifest_validation = None
    if manifest_validation_id:
        validation_event = self.audit_event_store.get(manifest_validation_id)
        manifest_validation = (
            execution_adapter_secret_manifest_validation_payload_from_audit_event(validation_event)
            if validation_event
            else None
        )
        if not manifest_validation:
            self._send_json(
                {
                    "error": "execution_adapter_secret_manifest_validation_not_found",
                    "manifestValidationId": manifest_validation_id,
                },
                status=404,
            )
            return
    materialization_id = str(payload.get("materializationId") or "").strip()
    if not materialization_id and manifest_validation:
        materialization_id = str(manifest_validation.get("materializationId") or "").strip()
    materialization_event = self.audit_event_store.get(materialization_id)
    materialization = (
        execution_adapter_secret_materialization_payload_from_audit_event(materialization_event)
        if materialization_event
        else None
    )
    if not materialization:
        self._send_json(
            {
                "error": "execution_adapter_secret_materialization_not_found",
                "materializationId": materialization_id,
            },
            status=404,
        )
        return
    try:
        environment_binding = build_execution_adapter_environment_binding(
            materialization,
            adapter_id=str(payload.get("adapterId") or ""),
            binding_mode=str(payload.get("bindingMode") or "container_env_reference"),
            manifest_validation=manifest_validation,
            confirmations=payload.get("confirmations") if isinstance(payload.get("confirmations"), dict) else {},
            operator=str(payload.get("operator") or "local-operator"),
            metadata=payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {},
        )
    except ValueError as error:
        self._send_json({"error": "invalid_execution_adapter_environment_binding", "detail": str(error)}, status=400)
        return
    audit_event = self.audit_event_store.record(
        execution_adapter_environment_binding_to_audit_event_payload(environment_binding)
    )
    self._send_json(
        {
            "adapterEnvironmentBinding": execution_adapter_environment_binding_to_payload(environment_binding),
            "auditEvent": audit_event_record_to_payload(audit_event),
        },
        status=409 if environment_binding.status == "blocked" else 201,
    )
    return


def get_execution_adapter_secret_references(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_secret_reference_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    reference_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_secret_reference",
        limit=50,
        query=adapter_id,
    )
    secret_references = []
    for event in reference_events:
        payload = execution_adapter_secret_reference_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            secret_references.append(payload)
        if len(secret_references) >= limit:
            break
    self._send_json({"adapterSecretReferences": secret_references})
    return


def get_execution_adapter_secret_materializations(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_secret_materialization_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    materialization_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_secret_materialization",
        limit=50,
        query=adapter_id,
    )
    materializations = []
    for event in materialization_events:
        payload = execution_adapter_secret_materialization_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            materializations.append(payload)
        if len(materializations) >= limit:
            break
    self._send_json({"adapterSecretMaterializations": materializations})
    return


def get_execution_adapter_secret_manifest_validations(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_secret_manifest_validation_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    validation_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_secret_manifest_validation",
        limit=50,
        query=adapter_id,
    )
    validations = []
    for event in validation_events:
        payload = execution_adapter_secret_manifest_validation_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            validations.append(payload)
        if len(validations) >= limit:
            break
    self._send_json({"adapterSecretManifestValidations": validations})
    return


def get_execution_adapter_environment_bindings(self, parsed):
    query = parse_qs(parsed.query)
    adapter_id = query.get("adapterId", [""])[0].strip()
    if not adapter_id:
        self._send_json({"error": "execution_adapter_environment_binding_adapter_id_required"}, status=400)
        return
    limit = _parse_limit(query.get("limit", ["20"])[0])
    binding_events = self.audit_event_store.list_recent(
        event_type="execution_adapter_environment_binding",
        limit=50,
        query=adapter_id,
    )
    environment_bindings = []
    for event in binding_events:
        payload = execution_adapter_environment_binding_payload_from_audit_event(event)
        if payload and payload.get("adapterId") == adapter_id:
            environment_bindings.append(payload)
        if len(environment_bindings) >= limit:
            break
    self._send_json({"adapterEnvironmentBindings": environment_bindings})
    return
