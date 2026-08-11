from __future__ import annotations

import base64
from dataclasses import dataclass
from typing import Mapping
from urllib.parse import urlparse


class DeploymentConfigurationError(ValueError):
    pass


@dataclass(frozen=True)
class DeploymentConfig:
    mode: str
    database_url: str | None = None
    public_origin: str | None = None
    oidc_issuer: str | None = None
    oidc_client_id: str | None = None
    oidc_client_secret: str | None = None
    settings_master_key: str | None = None
    claude_connect_enabled: bool = False

    @property
    def tenant_id(self) -> str | None:
        return "local" if self.mode == "local" else None

    @property
    def authentication_required(self) -> bool:
        return self.mode == "public"

    @property
    def oidc_callback_url(self) -> str | None:
        return f"{self.public_origin}/api/auth/callback" if self.public_origin else None


def load_deployment_config(environment: Mapping[str, str]) -> DeploymentConfig:
    mode = str(environment.get("AIQT_DEPLOYMENT_MODE", "local")).strip().lower() or "local"
    if mode not in {"local", "public"}:
        raise DeploymentConfigurationError("AIQT_DEPLOYMENT_MODE must be local or public")
    if mode == "local":
        return DeploymentConfig(mode="local")

    return _load_public_config(
        environment,
        require_oidc_client=True,
        require_settings_master_key=True,
    )


def load_public_resource_config(environment: Mapping[str, str]) -> DeploymentConfig:
    mode = str(environment.get("AIQT_DEPLOYMENT_MODE", "")).strip().lower()
    if mode != "public":
        raise DeploymentConfigurationError("AIQT_DEPLOYMENT_MODE must be public")
    for forbidden_secret in (
        "AIQT_OIDC_CLIENT_SECRET",
        "AIQT_SETTINGS_MASTER_KEY",
    ):
        if str(environment.get(forbidden_secret, "")).strip():
            raise DeploymentConfigurationError(
                f"{forbidden_secret} must not be set in the public MCP process"
            )
    return _load_public_config(
        environment,
        require_oidc_client=False,
        require_settings_master_key=False,
    )


def _load_public_config(
    environment: Mapping[str, str],
    *,
    require_oidc_client: bool,
    require_settings_master_key: bool,
) -> DeploymentConfig:
    names = [
        "AIQT_DATABASE_URL",
        "AIQT_PUBLIC_ORIGIN",
        "AIQT_OIDC_ISSUER",
    ]
    if require_oidc_client:
        names.extend(("AIQT_OIDC_CLIENT_ID", "AIQT_OIDC_CLIENT_SECRET"))
    if require_settings_master_key:
        names.append("AIQT_SETTINGS_MASTER_KEY")

    values = {
        name: str(environment.get(name, "")).strip()
        for name in names
    }
    for name, value in values.items():
        if not value:
            raise DeploymentConfigurationError(f"{name} is required in public mode")

    database_url = values["AIQT_DATABASE_URL"]
    if urlparse(database_url).scheme not in {"postgresql", "postgresql+psycopg"}:
        raise DeploymentConfigurationError("AIQT_DATABASE_URL must use PostgreSQL")
    public_origin = _https_url(values["AIQT_PUBLIC_ORIGIN"], "AIQT_PUBLIC_ORIGIN", origin=True)
    oidc_issuer = _https_url(values["AIQT_OIDC_ISSUER"], "AIQT_OIDC_ISSUER").rstrip("/")
    settings_master_key = values.get("AIQT_SETTINGS_MASTER_KEY")
    if settings_master_key:
        _validate_master_key(settings_master_key)
    return DeploymentConfig(
        mode="public",
        database_url=database_url,
        public_origin=public_origin,
        oidc_issuer=oidc_issuer,
        oidc_client_id=values.get("AIQT_OIDC_CLIENT_ID"),
        oidc_client_secret=values.get("AIQT_OIDC_CLIENT_SECRET"),
        settings_master_key=settings_master_key,
        claude_connect_enabled=environment.get("AIQT_CLAUDE_CONNECT_ENABLED") == "true",
    )


def _https_url(value: str, name: str, *, origin: bool = False) -> str:
    parsed = urlparse(value)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.query
        or parsed.fragment
        or (origin and parsed.path not in {"", "/"})
    ):
        raise DeploymentConfigurationError(f"{name} must be a valid HTTPS {'origin' if origin else 'URL'}")
    return value.rstrip("/")


def _validate_master_key(value: str) -> None:
    try:
        decoded = base64.urlsafe_b64decode(value.encode())
    except (ValueError, base64.binascii.Error) as error:
        raise DeploymentConfigurationError("AIQT_SETTINGS_MASTER_KEY must be URL-safe base64") from error
    if len(decoded) != 32:
        raise DeploymentConfigurationError("AIQT_SETTINGS_MASTER_KEY must decode to 32 bytes")
