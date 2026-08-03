from __future__ import annotations

from datetime import datetime, timezone
import json
from typing import Any, Mapping, MutableMapping

from quant_core.outbound_security import validate_user_outbound_url
from quant_core.settings import (
    PlatformSettingsRecord,
    _PUBLIC_SETTING_SPECS,
    _SECRET_SETTING_SPECS,
    _mask_secret,
    _public_setting_for_payload,
    _validate_clear_secrets,
    _validate_public_settings,
    _validate_secret_updates,
)
from quant_core.tenant_storage import TenantSettingsStore


class TenantPlatformSettingsAdapter:
    def __init__(
        self,
        settings: TenantSettingsStore,
        *,
        allowed_outbound_origins: tuple[str, ...] = (),
    ) -> None:
        self.settings = settings
        self.allowed_outbound_origins = allowed_outbound_origins

    def effective_environment(self, environment: Mapping[str, str]) -> dict[str, str]:
        effective = dict(environment)
        record = self._load()
        if record is None:
            return effective
        for key, value in {**record.public_values, **record.secret_values}.items():
            if value:
                effective[key] = value
            else:
                effective.pop(key, None)
        return effective

    def apply_to_environment(self, environment: MutableMapping[str, str]) -> bool:
        record = self._load()
        if record is None:
            return False
        for key, value in {**record.public_values, **record.secret_values}.items():
            if value:
                environment[key] = value
            else:
                environment.pop(key, None)
        return True

    def configuration_payload(
        self,
        environment: Mapping[str, str],
        *,
        restart_required: bool = False,
    ) -> dict[str, Any]:
        record = self._load()
        public_values = record.public_values if record else {
            env_key: str(environment.get(env_key, default))
            for env_key, default in _PUBLIC_SETTING_SPECS.values()
        }
        secret_values = record.secret_values if record else {
            env_key: "" for env_key in _SECRET_SETTING_SPECS.values()
        }
        return {
            "source": "database" if record else "defaults",
            "revision": record.revision if record else 0,
            "updatedAt": record.updated_at if record else None,
            "restartRequired": restart_required,
            "values": {
                field: _public_setting_for_payload(
                    field,
                    public_values.get(env_key, default),
                )
                for field, (env_key, default) in _PUBLIC_SETTING_SPECS.items()
            },
            "secrets": {
                field: {
                    "configured": bool(secret_values.get(env_key, "")),
                    "masked": _mask_secret(secret_values.get(env_key, "")),
                }
                for field, env_key in _SECRET_SETTING_SPECS.items()
            },
        }

    def save(
        self,
        configuration: object,
        secret_updates: object,
        clear_secrets: object,
        environment: Mapping[str, str],
    ) -> PlatformSettingsRecord:
        public_updates = _validate_public_settings(configuration)
        secret_changes = _validate_secret_updates(secret_updates)
        cleared = _validate_clear_secrets(clear_secrets)
        if set(secret_changes) & cleared:
            raise ValueError("secret_cannot_be_updated_and_cleared")
        self._validate_public_urls(public_updates, secret_changes, environment)
        current = self._load()
        public_values = (
            dict(current.public_values)
            if current
            else {
                env_key: str(environment.get(env_key, default))
                for env_key, default in _PUBLIC_SETTING_SPECS.values()
            }
        )
        secret_values = (
            dict(current.secret_values)
            if current
            else {env_key: "" for env_key in _SECRET_SETTING_SPECS.values()}
        )
        for field, value in public_updates.items():
            public_values[_PUBLIC_SETTING_SPECS[field][0]] = str(value)
        for field, value in secret_changes.items():
            secret_values[_SECRET_SETTING_SPECS[field]] = value
        for field in cleared:
            secret_values[_SECRET_SETTING_SPECS[field]] = ""
        record = PlatformSettingsRecord(
            revision=current.revision + 1 if current else 1,
            public_values=public_values,
            secret_values=secret_values,
            updated_at=datetime.now(timezone.utc).isoformat(),
        )
        self.settings.set(
            "platform-settings",
            json.dumps(
                {
                    "revision": record.revision,
                    "publicValues": record.public_values,
                    "secretValues": record.secret_values,
                    "updatedAt": record.updated_at,
                },
                ensure_ascii=False,
                sort_keys=True,
            ),
        )
        return record

    def _load(self) -> PlatformSettingsRecord | None:
        raw = self.settings.get("platform-settings")
        if not raw:
            return None
        payload = json.loads(raw)
        if not isinstance(payload, dict):
            raise ValueError("platform_settings_record_invalid")
        public_values = payload.get("publicValues")
        secret_values = payload.get("secretValues")
        if not isinstance(public_values, dict) or not isinstance(secret_values, dict):
            raise ValueError("platform_settings_record_invalid")
        return PlatformSettingsRecord(
            int(payload.get("revision") or 0),
            {str(key): str(value) for key, value in public_values.items()},
            {str(key): str(value) for key, value in secret_values.items()},
            str(payload.get("updatedAt") or ""),
        )

    def _validate_public_urls(
        self,
        public_values: Mapping[str, object],
        secret_values: Mapping[str, str],
        environment: Mapping[str, str],
    ) -> None:
        ollama = str(public_values.get("ollamaBaseUrl") or "")
        admin_ollama = str(environment.get("OLLAMA_BASE_URL") or "http://127.0.0.1:11434")
        if ollama != admin_ollama:
            raise ValueError("ollamaBaseUrl_admin_only")
        if secret_values.get("freeStockdbUrl") or secret_values.get("httpsProxy"):
            raise ValueError("platform_network_setting_admin_only")
        for value in (
            str(public_values.get("openaiCompatibleBaseUrl") or ""),
            str(secret_values.get("monitoringWebhookUrl") or ""),
        ):
            if value:
                validate_user_outbound_url(value, self.allowed_outbound_origins)
