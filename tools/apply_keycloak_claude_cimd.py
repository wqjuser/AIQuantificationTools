from __future__ import annotations

import argparse
import base64
import copy
from getpass import getpass
import hashlib
import json
import os
from pathlib import Path
import sys
from typing import Any, Mapping, NamedTuple
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TEMPLATE = PROJECT_ROOT / "deploy" / "keycloak" / "realm-aiqt.json"
_REALM_PATH = "/admin/realms/aiqt"
_CLAUDE_HOSTED_CLIENT_ID = "https://claude.ai/oauth/mcp-oauth-client-metadata"
_CODEX_CLI_CLIENT_ID = "aiqt-codex-cli"
_LEGACY_MCP_CLIENT_ID = "aiqt-mcp"
_GOOGLE_IDENTITY_PROVIDER_ALIAS = "google"
_FIRST_BROKER_LOGIN_EXECUTIONS_PATH = (
    f"{_REALM_PATH}/authentication/flows/first%20broker%20login/executions"
)
_MASKED_SECRET = "**********"

_REALM_FIELDS = (
    "registrationAllowed",
    "registrationEmailAsUsername",
    "verifyEmail",
    "resetPasswordAllowed",
    "internationalizationEnabled",
    "supportedLocales",
    "defaultLocale",
    "loginTheme",
    "smtpServer",
    "clientProfiles",
    "clientPolicies",
)
_CLIENT_FIELDS = (
    "clientId",
    "name",
    "enabled",
    "protocol",
    "clientAuthenticatorType",
    "publicClient",
    "bearerOnly",
    "standardFlowEnabled",
    "implicitFlowEnabled",
    "directAccessGrantsEnabled",
    "serviceAccountsEnabled",
    "consentRequired",
    "fullScopeAllowed",
    "redirectUris",
    "webOrigins",
    "attributes",
    "defaultClientScopes",
    "optionalClientScopes",
)


class CimdConfigurationDrift(RuntimeError):
    pass


class DesiredConfiguration(NamedTuple):
    realm_fields: dict[str, Any]
    identity_provider_fields: dict[str, Any]
    client_fields: dict[str, Any]
    codex_client_fields: dict[str, Any]
    scope_fields: dict[str, dict[str, Any]]
    default_scope_names: frozenset[str]
    optional_scope_names: frozenset[str]


class CurrentConfiguration(NamedTuple):
    realm: dict[str, Any]
    identity_provider: dict[str, Any] | None
    client: dict[str, Any]
    client_id: str
    scope_ids: dict[str, str]
    scope_payloads: dict[str, dict[str, Any]]
    client_default_scope_names: frozenset[str]
    client_optional_scope_names: frozenset[str]
    codex_client: dict[str, Any] | None
    codex_client_id: str | None
    codex_default_scope_names: frozenset[str]
    codex_optional_scope_names: frozenset[str]
    default_scope_names: frozenset[str]
    optional_scope_names: frozenset[str]


def load_template(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict) or payload.get("realm") != "aiqt":
        raise ValueError("keycloak_realm_template_invalid")
    return payload


def validate_public_origin(value: str) -> str:
    parsed = urlsplit(value)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.path not in {"", "/"}
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError("public_origin_invalid")
    return value.rstrip("/")


def _materialize_public_origin(value: Any, public_origin: str) -> Any:
    if isinstance(value, dict):
        return {
            key: _materialize_public_origin(item, public_origin)
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [_materialize_public_origin(item, public_origin) for item in value]
    if isinstance(value, str):
        return value.replace("${AIQT_PUBLIC_ORIGIN}", public_origin)
    return copy.deepcopy(value)


def _deployment_environment(source: Mapping[str, str]) -> dict[str, str]:
    required = (
        "AIQT_KEYCLOAK_SMTP_HOST",
        "AIQT_KEYCLOAK_SMTP_PORT",
        "AIQT_KEYCLOAK_SMTP_FROM",
        "AIQT_KEYCLOAK_SMTP_USERNAME",
        "AIQT_KEYCLOAK_SMTP_PASSWORD",
        "AIQT_KEYCLOAK_GOOGLE_CLIENT_ID",
        "AIQT_KEYCLOAK_GOOGLE_CLIENT_SECRET",
    )
    values = {
        name: value
        for name in required
        if isinstance((value := source.get(name)), str) and value
    }
    if len(values) != len(required):
        raise ValueError("keycloak_deployment_environment_required")
    try:
        port = int(values["AIQT_KEYCLOAK_SMTP_PORT"])
    except ValueError as error:
        raise ValueError("keycloak_smtp_port_invalid") from error
    if not 1 <= port <= 65535:
        raise ValueError("keycloak_smtp_port_invalid")
    tls_mode = source.get("AIQT_KEYCLOAK_SMTP_TLS_MODE")
    if tls_mode not in {"starttls", "ssl"}:
        raise ValueError("keycloak_smtp_tls_mode_invalid")
    return {
        **values,
        "AIQT_KEYCLOAK_SMTP_STARTTLS": str(tls_mode == "starttls").lower(),
        "AIQT_KEYCLOAK_SMTP_SSL": str(tls_mode == "ssl").lower(),
    }


def _materialize_environment(value: Any, environment: Mapping[str, str]) -> Any:
    if isinstance(value, dict):
        return {
            key: _materialize_environment(item, environment)
            for key, item in value.items()
        }
    if isinstance(value, list):
        return [_materialize_environment(item, environment) for item in value]
    if isinstance(value, str):
        for name, replacement in environment.items():
            value = value.replace(f"${{{name}}}", replacement)
    return copy.deepcopy(value)


def desired_configuration(
    template: Mapping[str, Any],
    *,
    public_origin: str,
    environment: Mapping[str, str] | None = None,
) -> DesiredConfiguration:
    canonical_origin = validate_public_origin(public_origin)
    deployment_environment = _deployment_environment(
        os.environ if environment is None else environment
    )
    clients = template.get("clients")
    if not isinstance(clients, list):
        raise ValueError("keycloak_realm_template_invalid")
    mcp_clients = [
        item
        for item in clients
        if isinstance(item, dict) and item.get("clientId") == _CLAUDE_HOSTED_CLIENT_ID
    ]
    if len(mcp_clients) != 1:
        raise ValueError("keycloak_realm_template_invalid")
    mcp_client = mcp_clients[0]
    codex_clients = [
        item
        for item in clients
        if isinstance(item, dict) and item.get("clientId") == _CODEX_CLI_CLIENT_ID
    ]
    if len(codex_clients) != 1:
        raise ValueError("keycloak_realm_template_invalid")
    codex_client = codex_clients[0]
    identity_providers = template.get("identityProviders")
    google_providers = (
        [
            item
            for item in identity_providers
            if isinstance(item, dict)
            and item.get("alias") == _GOOGLE_IDENTITY_PROVIDER_ALIAS
        ]
        if isinstance(identity_providers, list)
        else []
    )
    if len(google_providers) != 1:
        raise ValueError("keycloak_realm_template_invalid")
    client_scopes = template.get("clientScopes")
    if not isinstance(client_scopes, list):
        raise ValueError("keycloak_realm_template_invalid")
    try:
        realm_fields = {
            field: _materialize_environment(
                template[field],
                deployment_environment,
            )
            for field in _REALM_FIELDS
        }
        identity_provider_fields = _materialize_environment(
            google_providers[0],
            deployment_environment,
        )
        client_fields = {
            field: copy.deepcopy(mcp_client[field])
            for field in _CLIENT_FIELDS
        }
        codex_client_fields = {
            field: copy.deepcopy(codex_client[field])
            for field in _CLIENT_FIELDS
        }
    except KeyError as error:
        raise ValueError("keycloak_realm_template_invalid") from error
    callback_id = base64.urlsafe_b64encode(
        hashlib.sha256(f"{canonical_origin}/mcp".encode()).digest()[:9]
    ).decode("ascii").rstrip("=")
    codex_client_fields["redirectUris"] = [
        f"http://127.0.0.1:5555/callback/{callback_id}"
    ]
    desired_scope_names = _string_set(
        [
            *_string_set(
                template.get("defaultDefaultClientScopes"),
                "keycloak_realm_template_invalid",
            ),
            *_string_set(
                template.get("defaultOptionalClientScopes"),
                "keycloak_realm_template_invalid",
            ),
        ],
        "keycloak_realm_template_invalid",
    )
    named_scopes = [
        item
        for item in client_scopes
        if isinstance(item, dict) and isinstance(item.get("name"), str)
    ]
    scopes_by_name = {item["name"]: item for item in named_scopes}
    if len(scopes_by_name) != len(named_scopes):
        raise ValueError("keycloak_realm_template_invalid")
    if set(desired_scope_names) != set(scopes_by_name).intersection(desired_scope_names):
        raise ValueError("keycloak_realm_template_invalid")
    scope_fields = {
        name: _materialize_public_origin(scopes_by_name[name], canonical_origin)
        for name in sorted(desired_scope_names)
    }
    return DesiredConfiguration(
        realm_fields=realm_fields,
        identity_provider_fields=identity_provider_fields,
        client_fields=client_fields,
        codex_client_fields=codex_client_fields,
        scope_fields=scope_fields,
        default_scope_names=_string_set(
            template.get("defaultDefaultClientScopes"),
            "keycloak_realm_template_invalid",
        ),
        optional_scope_names=_string_set(
            template.get("defaultOptionalClientScopes"),
            "keycloak_realm_template_invalid",
        ),
    )


def _string_set(value: Any, error_code: str) -> frozenset[str]:
    if (
        not isinstance(value, list)
        or not value
        or any(not isinstance(item, str) or not item for item in value)
        or len(set(value)) != len(value)
    ):
        raise ValueError(error_code)
    return frozenset(value)


def validate_admin_server(value: str) -> str:
    parsed = urlsplit(value)
    if (
        parsed.scheme != "http"
        or parsed.hostname not in {"keycloak", "127.0.0.1"}
        or parsed.port != 8080
        or parsed.username is not None
        or parsed.password is not None
        or parsed.path not in {"", "/"}
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError("keycloak_admin_server_invalid")
    return f"http://{parsed.hostname}:8080"


class KeycloakAdminClient:
    def __init__(self, *, server: str, access_token: str, timeout_seconds: float = 10) -> None:
        self.server = validate_admin_server(server)
        if not access_token:
            raise ValueError("keycloak_admin_access_token_invalid")
        self.access_token = access_token
        self.timeout_seconds = timeout_seconds

    def get_json(self, path: str) -> Any:
        return self._request_json("GET", path)

    def put_json(self, path: str, payload: Mapping[str, Any] | None = None) -> None:
        self._request_json("PUT", path, payload)

    def post_json(self, path: str, payload: Mapping[str, Any]) -> None:
        self._request_json("POST", path, payload)

    def delete(self, path: str) -> None:
        self._request_json("DELETE", path)

    def _request_json(
        self,
        method: str,
        path: str,
        payload: Mapping[str, Any] | None = None,
    ) -> Any:
        if not path.startswith("/admin/realms/aiqt"):
            raise ValueError("keycloak_admin_path_invalid")
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        request = Request(
            f"{self.server}{path}",
            data=data,
            method=method,
            headers={
                "Accept": "application/json",
                "Authorization": f"Bearer {self.access_token}",
                **({"Content-Type": "application/json"} if data is not None else {}),
            },
        )
        try:
            with urlopen(request, timeout=self.timeout_seconds) as response:
                body = response.read()
        except (HTTPError, URLError, TimeoutError) as error:
            raise RuntimeError("keycloak_admin_request_failed") from error
        if not body:
            return None
        try:
            return json.loads(body)
        except json.JSONDecodeError as error:
            raise RuntimeError("keycloak_admin_response_invalid") from error


def authenticate_admin(
    *,
    server: str,
    username: str,
    password: str,
    timeout_seconds: float = 10,
) -> str:
    internal_server = validate_admin_server(server)
    if not username.strip() or not password:
        raise ValueError("keycloak_admin_credentials_required")
    request = Request(
        f"{internal_server}/realms/master/protocol/openid-connect/token",
        data=urlencode(
            {
                "client_id": "admin-cli",
                "grant_type": "password",
                "username": username,
                "password": password,
            }
        ).encode("ascii"),
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urlopen(request, timeout=timeout_seconds) as response:
            payload = json.loads(response.read())
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
        raise RuntimeError("keycloak_admin_authentication_failed") from error
    token = payload.get("access_token") if isinstance(payload, dict) else None
    if not isinstance(token, str) or not token:
        raise RuntimeError("keycloak_admin_authentication_failed")
    return token


def _scope_map(value: Any) -> dict[str, str]:
    if not isinstance(value, list):
        raise CimdConfigurationDrift("keycloak_client_scopes_invalid")
    result: dict[str, str] = {}
    for item in value:
        name = item.get("name") if isinstance(item, dict) else None
        scope_id = item.get("id") if isinstance(item, dict) else None
        if (
            not isinstance(name, str)
            or not name
            or not isinstance(scope_id, str)
            or not scope_id
            or name in result
        ):
            raise CimdConfigurationDrift("keycloak_client_scopes_invalid")
        result[name] = scope_id
    return result


def _read_current(
    client: Any,
    desired: DesiredConfiguration,
) -> CurrentConfiguration:
    realm = client.get_json(_REALM_PATH)
    found = client.get_json(
        f"{_REALM_PATH}/clients?clientId={_CLAUDE_HOSTED_CLIENT_ID}",
    )
    legacy = client.get_json(
        f"{_REALM_PATH}/clients?clientId={_LEGACY_MCP_CLIENT_ID}",
    )
    codex_found = client.get_json(
        f"{_REALM_PATH}/clients?clientId={_CODEX_CLI_CLIENT_ID}",
    )
    identity_providers = client.get_json(
        f"{_REALM_PATH}/identity-provider/instances",
    )
    first_broker_login_executions = client.get_json(
        _FIRST_BROKER_LOGIN_EXECUTIONS_PATH,
    )
    if (
        not isinstance(realm, dict)
        or not isinstance(found, list)
        or not isinstance(legacy, list)
        or not isinstance(codex_found, list)
        or not isinstance(identity_providers, list)
        or len(codex_found) > 1
    ):
        raise CimdConfigurationDrift("keycloak_aiqt_mcp_client_invalid")
    google_providers = [
        item
        for item in identity_providers
        if isinstance(item, dict)
        and item.get("alias") == _GOOGLE_IDENTITY_PROVIDER_ALIAS
    ]
    if len(google_providers) > 1:
        raise CimdConfigurationDrift("keycloak_google_identity_provider_invalid")
    _validate_first_broker_login_executions(first_broker_login_executions)
    candidates = [*found, *legacy]
    if len(candidates) != 1:
        raise CimdConfigurationDrift("keycloak_aiqt_mcp_client_invalid")
    client_id = candidates[0].get("id") if isinstance(candidates[0], dict) else None
    if not isinstance(client_id, str) or not client_id:
        raise CimdConfigurationDrift("keycloak_aiqt_mcp_client_invalid")
    current_client = client.get_json(f"{_REALM_PATH}/clients/{client_id}")
    if (
        not isinstance(current_client, dict)
        or current_client.get("clientId")
        not in {_CLAUDE_HOSTED_CLIENT_ID, _LEGACY_MCP_CLIENT_ID}
    ):
        raise CimdConfigurationDrift("keycloak_aiqt_mcp_client_invalid")
    codex_client_id = None
    codex_client = None
    if codex_found:
        codex_client_id = (
            codex_found[0].get("id") if isinstance(codex_found[0], dict) else None
        )
        if not isinstance(codex_client_id, str) or not codex_client_id:
            raise CimdConfigurationDrift("keycloak_codex_cli_client_invalid")
        codex_client = client.get_json(
            f"{_REALM_PATH}/clients/{codex_client_id}",
        )
        if (
            not isinstance(codex_client, dict)
            or codex_client.get("clientId") != _CODEX_CLI_CLIENT_ID
        ):
            raise CimdConfigurationDrift("keycloak_codex_cli_client_invalid")
    scope_ids = _scope_map(client.get_json(f"{_REALM_PATH}/client-scopes"))
    scope_payloads: dict[str, dict[str, Any]] = {}
    for name in desired.scope_fields:
        scope_id = scope_ids.get(name)
        if scope_id is None:
            continue
        payload = client.get_json(f"{_REALM_PATH}/client-scopes/{scope_id}")
        if not isinstance(payload, dict) or payload.get("name") != name:
            raise CimdConfigurationDrift("keycloak_client_scopes_invalid")
        scope_payloads[name] = payload
    default_scopes = _scope_map(
        client.get_json(f"{_REALM_PATH}/default-default-client-scopes"),
    )
    optional_scopes = _scope_map(
        client.get_json(f"{_REALM_PATH}/default-optional-client-scopes"),
    )
    return CurrentConfiguration(
        realm=realm,
        identity_provider=(google_providers[0] if google_providers else None),
        client=current_client,
        client_id=client_id,
        scope_ids=scope_ids,
        scope_payloads=scope_payloads,
        client_default_scope_names=_string_set(
            current_client.get("defaultClientScopes"),
            "keycloak_aiqt_mcp_client_invalid",
        ),
        client_optional_scope_names=_string_set(
            current_client.get("optionalClientScopes"),
            "keycloak_aiqt_mcp_client_invalid",
        ),
        codex_client=codex_client,
        codex_client_id=codex_client_id,
        codex_default_scope_names=(
            _string_set(
                codex_client.get("defaultClientScopes"),
                "keycloak_codex_cli_client_invalid",
            )
            if codex_client is not None
            else frozenset()
        ),
        codex_optional_scope_names=(
            _string_set(
                codex_client.get("optionalClientScopes"),
                "keycloak_codex_cli_client_invalid",
            )
            if codex_client is not None
            else frozenset()
        ),
        default_scope_names=frozenset(default_scopes),
        optional_scope_names=frozenset(optional_scopes),
    )


def _validate_first_broker_login_executions(value: Any) -> None:
    if (
        not isinstance(value, list)
        or not value
        or any(not isinstance(item, Mapping) for item in value)
    ):
        raise CimdConfigurationDrift("keycloak_first_broker_login_flow_unsafe")
    executions: list[Mapping[str, Any]] = value
    if any(
        execution.get("providerId") == "idp-auto-link"
        or (
            isinstance(execution.get("displayName"), str)
            and execution["displayName"].casefold()
            == "automatically set existing user"
        )
        for execution in executions
    ):
        raise CimdConfigurationDrift("keycloak_first_broker_login_flow_unsafe")

    def has_execution(
        *,
        provider_id: str | None = None,
        display_name: str | None = None,
        authentication_flow: bool,
        level: int,
        requirement: str,
    ) -> bool:
        matches = [
            execution
            for execution in executions
            if (
                execution.get("authenticationFlow") is True
                if authentication_flow
                else execution.get("authenticationFlow") is not True
            )
            and execution.get("level") == level
            and execution.get("requirement") == requirement
            and (provider_id is None or execution.get("providerId") == provider_id)
            and (display_name is None or execution.get("displayName") == display_name)
        ]
        return len(matches) == 1

    safe = (
        has_execution(
            display_name="User creation or linking",
            authentication_flow=True,
            level=0,
            requirement="REQUIRED",
        )
        and has_execution(
            display_name="Handle Existing Account",
            authentication_flow=True,
            level=1,
            requirement="ALTERNATIVE",
        )
        and has_execution(
            provider_id="idp-confirm-link",
            authentication_flow=False,
            level=2,
            requirement="REQUIRED",
        )
        and has_execution(
            display_name="Account verification options",
            authentication_flow=True,
            level=2,
            requirement="REQUIRED",
        )
        and has_execution(
            provider_id="idp-email-verification",
            authentication_flow=False,
            level=3,
            requirement="ALTERNATIVE",
        )
    )
    if not safe:
        raise CimdConfigurationDrift("keycloak_first_broker_login_flow_unsafe")


def _realm_matches(current: Mapping[str, Any], desired: Mapping[str, Any]) -> bool:
    for field, value in desired.items():
        current_value = current.get(field)
        if field != "smtpServer":
            if current_value != value:
                return False
            continue
        if not isinstance(current_value, Mapping) or not isinstance(value, Mapping):
            return False
        for key, item in value.items():
            if key == "password" and current_value.get(key) == _MASKED_SECRET:
                continue
            if current_value.get(key) != item:
                return False
    return True


def _client_matches(current: Mapping[str, Any], desired: Mapping[str, Any]) -> bool:
    for field, value in desired.items():
        if field in {"defaultClientScopes", "optionalClientScopes"}:
            continue
        current_value = current.get(field)
        if field == "attributes":
            if not isinstance(current_value, Mapping) or not isinstance(value, Mapping):
                return False
            if any(current_value.get(key) != item for key, item in value.items()):
                return False
        elif current_value != value:
            return False
    return True


def _identity_provider_matches(
    current: Mapping[str, Any],
    desired: Mapping[str, Any],
) -> bool:
    for field, value in desired.items():
        current_value = current.get(field)
        if field != "config":
            if current_value != value:
                return False
            continue
        if not isinstance(current_value, Mapping) or not isinstance(value, Mapping):
            return False
        for key, item in value.items():
            if key == "clientSecret" and current_value.get(key) == _MASKED_SECRET:
                continue
            if current_value.get(key) != item:
                return False
    return True


def _mapper_matches(current: Mapping[str, Any], desired: Mapping[str, Any]) -> bool:
    return all(
        current.get(field) == value
        for field, value in desired.items()
        if field != "id"
    ) and set(current).issubset({*desired, "id"})


def _scope_matches(current: Mapping[str, Any], desired: Mapping[str, Any]) -> bool:
    desired_core = {
        field: value
        for field, value in desired.items()
        if field != "protocolMappers"
    }
    if any(current.get(field) != value for field, value in desired_core.items()):
        return False
    current_mappers = current.get("protocolMappers", [])
    desired_mappers = desired.get("protocolMappers")
    if not isinstance(current_mappers, list) or not isinstance(desired_mappers, list):
        return False
    current_by_name = {
        mapper.get("name"): mapper
        for mapper in current_mappers
        if isinstance(mapper, dict) and isinstance(mapper.get("name"), str)
    }
    desired_by_name = {
        mapper.get("name"): mapper
        for mapper in desired_mappers
        if isinstance(mapper, dict) and isinstance(mapper.get("name"), str)
    }
    if (
        len(current_by_name) != len(current_mappers)
        or len(desired_by_name) != len(desired_mappers)
        or set(current_by_name) != set(desired_by_name)
    ):
        return False
    return all(
        _mapper_matches(current_by_name[name], desired_mapper)
        for name, desired_mapper in desired_by_name.items()
    )


def _scope_payloads_match(
    current: Mapping[str, Mapping[str, Any]],
    desired: Mapping[str, Mapping[str, Any]],
) -> bool:
    return set(current) == set(desired) and all(
        _scope_matches(current[name], desired_scope)
        for name, desired_scope in desired.items()
    )


def _sync_scope_payloads(
    client: Any,
    *,
    current: CurrentConfiguration,
    desired: Mapping[str, Mapping[str, Any]],
) -> None:
    missing = set(desired).difference(current.scope_ids)
    if missing:
        raise CimdConfigurationDrift("keycloak_required_client_scope_missing")
    for name, desired_scope in desired.items():
        scope_id = current.scope_ids[name]
        current_scope = current.scope_payloads.get(name)
        if not isinstance(current_scope, dict):
            raise CimdConfigurationDrift("keycloak_client_scopes_invalid")
        desired_core = {
            field: copy.deepcopy(value)
            for field, value in desired_scope.items()
            if field != "protocolMappers"
        }
        if any(current_scope.get(field) != value for field, value in desired_core.items()):
            client.put_json(
                f"{_REALM_PATH}/client-scopes/{scope_id}",
                {**current_scope, **desired_core},
            )

        current_mappers = current_scope.get("protocolMappers", [])
        desired_mappers = desired_scope.get("protocolMappers")
        if not isinstance(current_mappers, list) or not isinstance(desired_mappers, list):
            raise CimdConfigurationDrift("keycloak_client_scopes_invalid")
        current_by_name = {
            mapper.get("name"): mapper
            for mapper in current_mappers
            if isinstance(mapper, dict) and isinstance(mapper.get("name"), str)
        }
        desired_by_name = {
            mapper.get("name"): mapper
            for mapper in desired_mappers
            if isinstance(mapper, dict) and isinstance(mapper.get("name"), str)
        }
        if (
            len(current_by_name) != len(current_mappers)
            or len(desired_by_name) != len(desired_mappers)
        ):
            raise CimdConfigurationDrift("keycloak_client_scope_mappers_invalid")
        mapper_path = f"{_REALM_PATH}/client-scopes/{scope_id}/protocol-mappers/models"
        for mapper_name in sorted(set(current_by_name) - set(desired_by_name)):
            mapper_id = current_by_name[mapper_name].get("id")
            if not isinstance(mapper_id, str) or not mapper_id:
                raise CimdConfigurationDrift("keycloak_client_scope_mappers_invalid")
            client.delete(f"{mapper_path}/{mapper_id}")
        for mapper_name, desired_mapper in desired_by_name.items():
            current_mapper = current_by_name.get(mapper_name)
            if current_mapper is None:
                client.post_json(mapper_path, copy.deepcopy(desired_mapper))
                continue
            if _mapper_matches(current_mapper, desired_mapper):
                continue
            mapper_id = current_mapper.get("id")
            if not isinstance(mapper_id, str) or not mapper_id:
                raise CimdConfigurationDrift("keycloak_client_scope_mappers_invalid")
            client.put_json(
                f"{mapper_path}/{mapper_id}",
                {"id": mapper_id, **copy.deepcopy(desired_mapper)},
            )


def _sync_default_scopes(
    client: Any,
    *,
    prefix: str,
    current: frozenset[str],
    desired: frozenset[str],
    scope_ids: Mapping[str, str],
) -> None:
    missing_scope_ids = desired.difference(scope_ids)
    if missing_scope_ids:
        raise CimdConfigurationDrift("keycloak_required_client_scope_missing")
    for name in sorted(current - desired):
        scope_id = scope_ids.get(name)
        if not scope_id:
            raise CimdConfigurationDrift("keycloak_client_scopes_invalid")
        client.delete(f"{_REALM_PATH}/{prefix}/{scope_id}")
    for name in sorted(desired - current):
        client.put_json(f"{_REALM_PATH}/{prefix}/{scope_ids[name]}")


def reconcile(
    client: Any,
    desired: DesiredConfiguration,
    *,
    apply: bool,
) -> str:
    current = _read_current(client, desired)
    realm_ready = _realm_matches(current.realm, desired.realm_fields)
    smtp_secret_masked = (
        isinstance(current.realm.get("smtpServer"), Mapping)
        and current.realm["smtpServer"].get("password") == _MASKED_SECRET
    )
    identity_provider_ready = (
        current.identity_provider is not None
        and _identity_provider_matches(
            current.identity_provider,
            desired.identity_provider_fields,
        )
    )
    google_secret_masked = (
        current.identity_provider is not None
        and isinstance(current.identity_provider.get("config"), Mapping)
        and current.identity_provider["config"].get("clientSecret")
        == _MASKED_SECRET
    )
    client_ready = _client_matches(current.client, desired.client_fields)
    codex_ready = (
        current.codex_client is not None
        and _client_matches(current.codex_client, desired.codex_client_fields)
        and current.codex_default_scope_names
        == frozenset(desired.codex_client_fields["defaultClientScopes"])
        and current.codex_optional_scope_names
        == frozenset(desired.codex_client_fields["optionalClientScopes"])
    )
    scopes_ready = (
        current.client_default_scope_names
        == frozenset(desired.client_fields["defaultClientScopes"])
        and current.client_optional_scope_names
        == frozenset(desired.client_fields["optionalClientScopes"])
        and current.default_scope_names == desired.default_scope_names
        and current.optional_scope_names == desired.optional_scope_names
        and _scope_payloads_match(current.scope_payloads, desired.scope_fields)
    )
    if (
        realm_ready
        and identity_provider_ready
        and client_ready
        and codex_ready
        and scopes_ready
        and (not apply or not smtp_secret_masked)
        and (not apply or not google_secret_masked)
    ):
        return "ready"
    if not apply:
        raise CimdConfigurationDrift("keycloak_claude_cimd_migration_required")

    if not realm_ready or smtp_secret_masked:
        client.put_json(
            _REALM_PATH,
            {**current.realm, **copy.deepcopy(desired.realm_fields)},
        )
    if current.identity_provider is None:
        client.post_json(
            f"{_REALM_PATH}/identity-provider/instances",
            copy.deepcopy(desired.identity_provider_fields),
        )
        current = _read_current(client, desired)
    elif not identity_provider_ready or google_secret_masked:
        desired_provider = copy.deepcopy(desired.identity_provider_fields)
        desired_provider["config"] = {
            **(
                current.identity_provider.get("config")
                if isinstance(current.identity_provider.get("config"), dict)
                else {}
            ),
            **desired_provider["config"],
        }
        client.put_json(
            f"{_REALM_PATH}/identity-provider/instances/"
            f"{_GOOGLE_IDENTITY_PROVIDER_ALIAS}",
            {**current.identity_provider, **desired_provider},
        )
    if not client_ready:
        desired_client = copy.deepcopy(desired.client_fields)
        desired_client["attributes"] = {
            **(
                current.client.get("attributes")
                if isinstance(current.client.get("attributes"), dict)
                else {}
            ),
            **desired_client["attributes"],
        }
        client.put_json(
            f"{_REALM_PATH}/clients/{current.client_id}",
            {**current.client, **desired_client},
        )
    if current.codex_client is None:
        client.post_json(
            f"{_REALM_PATH}/clients",
            copy.deepcopy(desired.codex_client_fields),
        )
        current = _read_current(client, desired)
    elif not codex_ready:
        desired_codex = copy.deepcopy(desired.codex_client_fields)
        desired_codex["attributes"] = {
            **(
                current.codex_client.get("attributes")
                if isinstance(current.codex_client.get("attributes"), dict)
                else {}
            ),
            **desired_codex["attributes"],
        }
        client.put_json(
            f"{_REALM_PATH}/clients/{current.codex_client_id}",
            {**current.codex_client, **desired_codex},
        )
    if not _scope_payloads_match(current.scope_payloads, desired.scope_fields):
        _sync_scope_payloads(
            client,
            current=current,
            desired=desired.scope_fields,
        )
    _sync_default_scopes(
        client,
        prefix=f"clients/{current.client_id}/default-client-scopes",
        current=current.client_default_scope_names,
        desired=frozenset(desired.client_fields["defaultClientScopes"]),
        scope_ids=current.scope_ids,
    )
    _sync_default_scopes(
        client,
        prefix=f"clients/{current.client_id}/optional-client-scopes",
        current=current.client_optional_scope_names,
        desired=frozenset(desired.client_fields["optionalClientScopes"]),
        scope_ids=current.scope_ids,
    )
    if current.codex_client_id is None:
        raise CimdConfigurationDrift("keycloak_codex_cli_client_invalid")
    _sync_default_scopes(
        client,
        prefix=f"clients/{current.codex_client_id}/default-client-scopes",
        current=current.codex_default_scope_names,
        desired=frozenset(desired.codex_client_fields["defaultClientScopes"]),
        scope_ids=current.scope_ids,
    )
    _sync_default_scopes(
        client,
        prefix=f"clients/{current.codex_client_id}/optional-client-scopes",
        current=current.codex_optional_scope_names,
        desired=frozenset(desired.codex_client_fields["optionalClientScopes"]),
        scope_ids=current.scope_ids,
    )
    if not scopes_ready:
        _sync_default_scopes(
            client,
            prefix="default-default-client-scopes",
            current=current.default_scope_names,
            desired=desired.default_scope_names,
            scope_ids=current.scope_ids,
        )
        _sync_default_scopes(
            client,
            prefix="default-optional-client-scopes",
            current=current.optional_scope_names,
            desired=desired.optional_scope_names,
            scope_ids=current.scope_ids,
        )

    verified = _read_current(client, desired)
    if (
        not _realm_matches(verified.realm, desired.realm_fields)
        or verified.identity_provider is None
        or not _identity_provider_matches(
            verified.identity_provider,
            desired.identity_provider_fields,
        )
        or not _client_matches(verified.client, desired.client_fields)
        or verified.codex_client is None
        or not _client_matches(verified.codex_client, desired.codex_client_fields)
        or not _scope_payloads_match(verified.scope_payloads, desired.scope_fields)
        or verified.client_default_scope_names
        != frozenset(desired.client_fields["defaultClientScopes"])
        or verified.client_optional_scope_names
        != frozenset(desired.client_fields["optionalClientScopes"])
        or verified.codex_default_scope_names
        != frozenset(desired.codex_client_fields["defaultClientScopes"])
        or verified.codex_optional_scope_names
        != frozenset(desired.codex_client_fields["optionalClientScopes"])
        or verified.default_scope_names != desired.default_scope_names
        or verified.optional_scope_names != desired.optional_scope_names
    ):
        raise CimdConfigurationDrift("keycloak_claude_cimd_verification_failed")
    return "updated"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Check or apply the restricted Claude CIMD configuration to the aiqt realm.",
    )
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--check", action="store_true", help="Fail if the realm is not ready.")
    action.add_argument(
        "--apply",
        action="store_true",
        help="Apply and verify the exact repository profile.",
    )
    parser.add_argument("--server", default="http://keycloak:8080")
    parser.add_argument("--username", required=True)
    parser.add_argument("--template", type=Path, default=DEFAULT_TEMPLATE)
    parser.add_argument("--public-origin", default=os.environ.get("AIQT_PUBLIC_ORIGIN", ""))
    args = parser.parse_args()

    password = getpass("Keycloak administrator password: ")
    try:
        server = validate_admin_server(args.server)
        desired = desired_configuration(
            load_template(args.template),
            public_origin=args.public_origin,
        )
        token = authenticate_admin(
            server=server,
            username=args.username,
            password=password,
        )
        status = reconcile(
            KeycloakAdminClient(server=server, access_token=token),
            desired,
            apply=args.apply,
        )
    except (CimdConfigurationDrift, RuntimeError, ValueError) as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(2) from error
    finally:
        password = ""
    print(f"keycloak_claude_cimd_{status}")


if __name__ == "__main__":
    main()
