from __future__ import annotations

import copy
import importlib.util
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[3]
SCRIPT_PATH = ROOT / "tools" / "apply_keycloak_claude_cimd.py"
FIRST_BROKER_LOGIN_EXECUTIONS_PATH = (
    "/admin/realms/aiqt/authentication/flows/"
    "first%20broker%20login/executions"
)


def _safe_first_broker_login_executions() -> list[dict]:
    return [
        {
            "id": "flow-user-creation-or-linking",
            "level": 0,
            "authenticationFlow": True,
            "displayName": "User creation or linking",
            "requirement": "REQUIRED",
        },
        {
            "id": "flow-handle-existing-account",
            "level": 1,
            "authenticationFlow": True,
            "displayName": "Handle Existing Account",
            "requirement": "ALTERNATIVE",
        },
        {
            "id": "execution-confirm-link",
            "level": 2,
            "displayName": "Confirm link existing account",
            "providerId": "idp-confirm-link",
            "requirement": "REQUIRED",
        },
        {
            "id": "flow-account-verification-options",
            "level": 2,
            "authenticationFlow": True,
            "displayName": "Account verification options",
            "requirement": "REQUIRED",
        },
        {
            "id": "execution-email-verification",
            "level": 3,
            "displayName": "Verify existing account by Email",
            "providerId": "idp-email-verification",
            "requirement": "ALTERNATIVE",
        },
    ]


def _load_script():
    spec = importlib.util.spec_from_file_location(
        "apply_keycloak_claude_cimd",
        SCRIPT_PATH,
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("keycloak CIMD migration script is unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FakeKeycloakAdminClient:
    def __init__(
        self,
        *,
        realm: dict,
        client: dict,
        scope_payloads: dict[str, dict],
        identity_provider: dict | None,
        first_broker_login_executions: list[dict] | None = None,
        codex_client: dict | None = None,
        default_scopes: set[str] | None = None,
        optional_scopes: set[str] | None = None,
    ) -> None:
        self.realm = copy.deepcopy(realm)
        self.client = copy.deepcopy(client)
        self.codex_client = copy.deepcopy(codex_client)
        self.identity_provider = copy.deepcopy(identity_provider)
        self.first_broker_login_executions = copy.deepcopy(
            first_broker_login_executions
            if first_broker_login_executions is not None
            else _safe_first_broker_login_executions()
        )
        self.client_default_scopes = set(client.get("defaultClientScopes", []))
        self.client_optional_scopes = set(client.get("optionalClientScopes", []))
        self.codex_default_scopes = set(
            codex_client.get("defaultClientScopes", []) if codex_client else []
        )
        self.codex_optional_scopes = set(
            codex_client.get("optionalClientScopes", []) if codex_client else []
        )
        self.scopes = {
            "basic": "scope-basic",
            "profile": "scope-profile",
            "aiqt:research:read": "scope-research",
            "offline_access": "scope-offline",
        }
        self.default_scopes = set(default_scopes or {"basic"})
        self.optional_scopes = set(optional_scopes or {"offline_access"})
        self.scope_payloads = copy.deepcopy(scope_payloads)
        self.puts: list[tuple[str, dict]] = []
        self.posts: list[tuple[str, dict]] = []
        self.deletes: list[str] = []

    def get_json(self, path: str):
        if path == "/admin/realms/aiqt":
            return copy.deepcopy(self.realm)
        if path.startswith("/admin/realms/aiqt/clients?clientId="):
            requested_id = path.partition("=")[2]
            if self.codex_client and requested_id == self.codex_client["clientId"]:
                return [
                    {
                        "id": self.codex_client["id"],
                        "clientId": self.codex_client["clientId"],
                    }
                ]
            return (
                [{"id": self.client["id"], "clientId": self.client["clientId"]}]
                if requested_id == self.client["clientId"]
                else []
            )
        if path == f"/admin/realms/aiqt/clients/{self.client['id']}":
            return {
                **copy.deepcopy(self.client),
                "defaultClientScopes": sorted(self.client_default_scopes),
                "optionalClientScopes": sorted(self.client_optional_scopes),
            }
        if self.codex_client and path == (
            f"/admin/realms/aiqt/clients/{self.codex_client['id']}"
        ):
            return {
                **copy.deepcopy(self.codex_client),
                "defaultClientScopes": sorted(self.codex_default_scopes),
                "optionalClientScopes": sorted(self.codex_optional_scopes),
            }
        if path == "/admin/realms/aiqt/client-scopes":
            return [
                {"id": scope_id, "name": name}
                for name, scope_id in self.scopes.items()
            ]
        if path == "/admin/realms/aiqt/identity-provider/instances":
            return (
                [copy.deepcopy(self.identity_provider)]
                if self.identity_provider is not None
                else []
            )
        if path == FIRST_BROKER_LOGIN_EXECUTIONS_PATH:
            return copy.deepcopy(self.first_broker_login_executions)
        for name, scope_id in self.scopes.items():
            if path == f"/admin/realms/aiqt/client-scopes/{scope_id}":
                return copy.deepcopy(self.scope_payloads[name])
        if path == "/admin/realms/aiqt/default-default-client-scopes":
            return [
                {"id": self.scopes[name], "name": name}
                for name in sorted(self.default_scopes)
            ]
        if path == "/admin/realms/aiqt/default-optional-client-scopes":
            return [
                {"id": self.scopes[name], "name": name}
                for name in sorted(self.optional_scopes)
            ]
        raise AssertionError(f"unexpected GET {path}")

    def put_json(self, path: str, payload: dict | None = None) -> None:
        self.puts.append((path, copy.deepcopy(payload or {})))
        if path == "/admin/realms/aiqt":
            assert payload is not None
            self.realm = copy.deepcopy(payload)
            return
        if path == f"/admin/realms/aiqt/clients/{self.client['id']}":
            assert payload is not None
            self.client = {
                **copy.deepcopy(payload),
                "defaultClientScopes": sorted(self.client_default_scopes),
                "optionalClientScopes": sorted(self.client_optional_scopes),
            }
            return
        if self.codex_client and path == (
            f"/admin/realms/aiqt/clients/{self.codex_client['id']}"
        ):
            assert payload is not None
            self.codex_client = {
                **copy.deepcopy(payload),
                "defaultClientScopes": sorted(self.codex_default_scopes),
                "optionalClientScopes": sorted(self.codex_optional_scopes),
            }
            return
        if path == "/admin/realms/aiqt/identity-provider/instances/google":
            assert payload is not None and self.identity_provider is not None
            internal_id = self.identity_provider.get("internalId")
            self.identity_provider = {
                **copy.deepcopy(payload),
                **({"internalId": internal_id} if internal_id else {}),
            }
            return
        for name, scope_id in self.scopes.items():
            scope_path = f"/admin/realms/aiqt/client-scopes/{scope_id}"
            mapper_prefix = f"{scope_path}/protocol-mappers/models/"
            if path == scope_path:
                assert payload is not None
                current_mappers = self.scope_payloads[name].get("protocolMappers", [])
                self.scope_payloads[name] = {
                    **copy.deepcopy(payload),
                    "protocolMappers": current_mappers,
                }
                return
            if path.startswith(mapper_prefix):
                assert payload is not None
                mapper_id = path.removeprefix(mapper_prefix)
                mappers = self.scope_payloads[name].setdefault("protocolMappers", [])
                index = next(
                    index
                    for index, mapper in enumerate(mappers)
                    if mapper.get("id") == mapper_id
                )
                mappers[index] = copy.deepcopy(payload)
                return
        for collection, prefix in (
            (
                self.client_default_scopes,
                f"/admin/realms/aiqt/clients/{self.client['id']}/default-client-scopes/",
            ),
            (
                self.client_optional_scopes,
                f"/admin/realms/aiqt/clients/{self.client['id']}/optional-client-scopes/",
            ),
            *(
                (
                    (
                        self.codex_default_scopes,
                        f"/admin/realms/aiqt/clients/{self.codex_client['id']}/default-client-scopes/",
                    ),
                    (
                        self.codex_optional_scopes,
                        f"/admin/realms/aiqt/clients/{self.codex_client['id']}/optional-client-scopes/",
                    ),
                )
                if self.codex_client
                else ()
            ),
            (self.default_scopes, "/admin/realms/aiqt/default-default-client-scopes/"),
            (self.optional_scopes, "/admin/realms/aiqt/default-optional-client-scopes/"),
        ):
            if path.startswith(prefix):
                scope_id = path.removeprefix(prefix)
                collection.add(
                    next(
                        name
                        for name, value in self.scopes.items()
                        if value == scope_id
                    )
                )
                return
        raise AssertionError(f"unexpected PUT {path}")

    def post_json(self, path: str, payload: dict) -> None:
        self.posts.append((path, copy.deepcopy(payload)))
        if path == "/admin/realms/aiqt/clients":
            self.codex_client = {"id": "client-codex-uuid", **copy.deepcopy(payload)}
            self.codex_default_scopes = set(self.default_scopes)
            self.codex_optional_scopes = set(self.optional_scopes)
            return
        if path == "/admin/realms/aiqt/identity-provider/instances":
            self.identity_provider = {
                "internalId": "google-provider-uuid",
                **copy.deepcopy(payload),
            }
            return
        for name, scope_id in self.scopes.items():
            if path == f"/admin/realms/aiqt/client-scopes/{scope_id}/protocol-mappers/models":
                mappers = self.scope_payloads[name].setdefault("protocolMappers", [])
                mappers.append({"id": f"generated-{len(mappers)}", **copy.deepcopy(payload)})
                return
        raise AssertionError(f"unexpected POST {path}")

    def delete(self, path: str) -> None:
        self.deletes.append(path)
        for name, scope_id in self.scopes.items():
            mapper_prefix = (
                f"/admin/realms/aiqt/client-scopes/{scope_id}/protocol-mappers/models/"
            )
            if path.startswith(mapper_prefix):
                mapper_id = path.removeprefix(mapper_prefix)
                mappers = self.scope_payloads[name].setdefault("protocolMappers", [])
                self.scope_payloads[name]["protocolMappers"] = [
                    mapper for mapper in mappers if mapper.get("id") != mapper_id
                ]
                return
        for collection, prefix in (
            (
                self.client_default_scopes,
                f"/admin/realms/aiqt/clients/{self.client['id']}/default-client-scopes/",
            ),
            (
                self.client_optional_scopes,
                f"/admin/realms/aiqt/clients/{self.client['id']}/optional-client-scopes/",
            ),
            *(
                (
                    (
                        self.codex_default_scopes,
                        f"/admin/realms/aiqt/clients/{self.codex_client['id']}/default-client-scopes/",
                    ),
                    (
                        self.codex_optional_scopes,
                        f"/admin/realms/aiqt/clients/{self.codex_client['id']}/optional-client-scopes/",
                    ),
                )
                if self.codex_client
                else ()
            ),
            (self.default_scopes, "/admin/realms/aiqt/default-default-client-scopes/"),
            (self.optional_scopes, "/admin/realms/aiqt/default-optional-client-scopes/"),
        ):
            if path.startswith(prefix):
                scope_id = path.removeprefix(prefix)
                collection.remove(
                    next(
                        name
                        for name, value in self.scopes.items()
                        if value == scope_id
                    )
                )
                return
        raise AssertionError(f"unexpected DELETE {path}")


class KeycloakClaudeCimdMigrationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.script = _load_script()
        cls.template_path = ROOT / "deploy" / "keycloak" / "realm-aiqt.json"
        cls.template = cls.script.load_template(cls.template_path)
        cls.environment = {
            "AIQT_KEYCLOAK_SMTP_HOST": "smtp.example.com",
            "AIQT_KEYCLOAK_SMTP_PORT": "587",
            "AIQT_KEYCLOAK_SMTP_FROM": "accounts@example.com",
            "AIQT_KEYCLOAK_SMTP_USERNAME": "smtp-user",
            "AIQT_KEYCLOAK_SMTP_PASSWORD": "smtp-secret-value",
            "AIQT_KEYCLOAK_SMTP_TLS_MODE": "starttls",
            "AIQT_KEYCLOAK_GOOGLE_CLIENT_ID": "google-client-id",
            "AIQT_KEYCLOAK_GOOGLE_CLIENT_SECRET": "google-secret-value",
        }
        cls.desired = cls.script.desired_configuration(
            cls.template,
            public_origin="https://research.example.com",
            environment=cls.environment,
        )

    def _scope_payloads(self, *, research_audience: str | None = None) -> dict[str, dict]:
        payloads: dict[str, dict] = {
            name: {
                "id": f"scope-{name}",
                **copy.deepcopy(fields),
            }
            for name, fields in self.desired.scope_fields.items()
        }
        for name, payload in payloads.items():
            for index, mapper in enumerate(payload["protocolMappers"]):
                mapper["id"] = f"mapper-{name}-{index}"
        if research_audience is not None:
            payloads["aiqt:research:read"]["protocolMappers"][0]["config"][
                "included.custom.audience"
            ] = research_audience
        payloads["offline_access"] = {
            "id": "scope-offline_access",
            "name": "offline_access",
            "protocol": "openid-connect",
            "attributes": {},
            "protocolMappers": [],
        }
        payloads["profile"] = {
            "id": "scope-profile",
            "name": "profile",
            "protocol": "openid-connect",
            "attributes": {},
            "protocolMappers": [],
        }
        return payloads

    def _legacy_client(self) -> dict:
        template_client = next(
            item
            for item in self.template["clients"]
            if item["clientId"]
            == "https://claude.ai/oauth/mcp-oauth-client-metadata"
        )
        client = copy.deepcopy(template_client)
        client["id"] = "client-uuid"
        client["clientId"] = "aiqt-mcp"
        client["attributes"].pop("cimd.cache.expiry.time.in.sec")
        client["redirectUris"] = []
        client["optionalClientScopes"] = ["aiqt:research:read"]
        client["attributes"] = {
            **client["attributes"],
            "client.use.lightweight.access.token.enabled": "false",
        }
        return client

    def _codex_client(self) -> dict:
        return {
            "id": "client-codex-uuid",
            **copy.deepcopy(self.desired.codex_client_fields),
        }

    def _google_provider(self) -> dict:
        return {
            "internalId": "google-provider-uuid",
            **copy.deepcopy(self.desired.identity_provider_fields),
        }

    def test_desired_configuration_includes_the_fixed_codex_cli_client(self) -> None:
        self.assertEqual(
            self.desired.codex_client_fields["clientId"],
            "aiqt-codex-cli",
        )
        self.assertEqual(
            self.desired.codex_client_fields["redirectUris"],
            ["http://127.0.0.1:5555/callback/bu3ea_gsmDzo"],
        )
        self.assertEqual(
            self.desired.codex_client_fields["optionalClientScopes"],
            ["aiqt:research:read", "offline_access"],
        )

    def test_desired_configuration_materializes_registration_mail_and_google(self) -> None:
        self.assertEqual(
            self.desired.realm_fields,
            {
                "registrationAllowed": True,
                "registrationEmailAsUsername": True,
                "verifyEmail": True,
                "resetPasswordAllowed": True,
                "internationalizationEnabled": True,
                "supportedLocales": ["zh-CN"],
                "defaultLocale": "zh-CN",
                "loginTheme": "aiqt",
                "smtpServer": {
                    "host": "smtp.example.com",
                    "port": "587",
                    "from": "accounts@example.com",
                    "auth": "true",
                    "user": "smtp-user",
                    "password": "smtp-secret-value",
                    "starttls": "true",
                    "ssl": "false",
                },
                "clientProfiles": self.template["clientProfiles"],
                "clientPolicies": self.template["clientPolicies"],
            },
        )
        self.assertEqual(
            self.desired.identity_provider_fields["config"],
            {
                "clientId": "google-client-id",
                "clientSecret": "google-secret-value",
                "defaultScope": "openid profile email",
                "syncMode": "IMPORT",
                "useJwksUrl": "true",
            },
        )
        self.assertTrue(self.desired.identity_provider_fields["enabled"])
        self.assertTrue(self.desired.identity_provider_fields["trustEmail"])
        self.assertFalse(self.desired.identity_provider_fields["storeToken"])
        self.assertFalse(
            self.desired.identity_provider_fields["authenticateByDefault"]
        )
        self.assertEqual(
            self.desired.identity_provider_fields["firstBrokerLoginFlowAlias"],
            "first broker login",
        )
        self.assertNotIn("autoLink", self.desired.identity_provider_fields)
        self.assertNotIn(
            "autoLink",
            self.desired.identity_provider_fields["config"],
        )

    def test_check_fails_when_google_is_missing_and_apply_creates_it_once(self) -> None:
        client = FakeKeycloakAdminClient(
            realm={"realm": "aiqt", **copy.deepcopy(self.desired.realm_fields)},
            client={"id": "client-uuid", **copy.deepcopy(self.desired.client_fields)},
            identity_provider=None,
            codex_client=self._codex_client(),
            scope_payloads=self._scope_payloads(),
            default_scopes={"basic"},
            optional_scopes={"aiqt:research:read"},
        )

        with self.assertRaisesRegex(
            self.script.CimdConfigurationDrift,
            "keycloak_claude_cimd_migration_required",
        ):
            self.script.reconcile(client, self.desired, apply=False)

        self.assertEqual(
            self.script.reconcile(client, self.desired, apply=True),
            "updated",
        )
        self.assertEqual(self.script.reconcile(client, self.desired, apply=True), "ready")
        self.assertEqual(
            [
                path
                for path, _ in client.posts
                if path == "/admin/realms/aiqt/identity-provider/instances"
            ],
            ["/admin/realms/aiqt/identity-provider/instances"],
        )
        self.assertEqual(client.identity_provider["internalId"], "google-provider-uuid")

    def test_apply_repairs_google_in_place_without_touching_users(self) -> None:
        google = self._google_provider()
        google["storeToken"] = True
        google["authenticateByDefault"] = True
        google["firstBrokerLoginFlowAlias"] = "auto-link-existing-user"
        google["config"]["clientSecret"] = "stale-secret"
        google["config"]["syncMode"] = "FORCE"
        client = FakeKeycloakAdminClient(
            realm={"realm": "aiqt", **copy.deepcopy(self.desired.realm_fields)},
            client={"id": "client-uuid", **copy.deepcopy(self.desired.client_fields)},
            identity_provider=google,
            codex_client=self._codex_client(),
            scope_payloads=self._scope_payloads(),
            default_scopes={"basic"},
            optional_scopes={"aiqt:research:read"},
        )

        self.assertEqual(
            self.script.reconcile(client, self.desired, apply=True),
            "updated",
        )
        self.assertEqual(self.script.reconcile(client, self.desired, apply=False), "ready")
        self.assertEqual(client.identity_provider["internalId"], "google-provider-uuid")
        self.assertFalse(client.identity_provider["storeToken"])
        self.assertFalse(client.identity_provider["authenticateByDefault"])
        self.assertEqual(
            client.identity_provider["firstBrokerLoginFlowAlias"],
            "first broker login",
        )
        self.assertEqual(
            [path for path, _ in client.puts].count(
                "/admin/realms/aiqt/identity-provider/instances/google"
            ),
            1,
        )
        mutation_paths = [path for path, _ in client.puts + client.posts] + client.deletes
        self.assertFalse(any("/users" in path for path in mutation_paths))

    def test_check_accepts_keycloak_masked_google_secret(self) -> None:
        google = self._google_provider()
        google["config"]["clientSecret"] = "**********"
        client = FakeKeycloakAdminClient(
            realm={"realm": "aiqt", **copy.deepcopy(self.desired.realm_fields)},
            client={"id": "client-uuid", **copy.deepcopy(self.desired.client_fields)},
            identity_provider=google,
            codex_client=self._codex_client(),
            scope_payloads=self._scope_payloads(),
            default_scopes={"basic"},
            optional_scopes={"aiqt:research:read"},
        )

        self.assertEqual(self.script.reconcile(client, self.desired, apply=False), "ready")
        self.assertEqual(client.puts, [])
        self.assertEqual(client.posts, [])
        self.assertEqual(client.deletes, [])

    def test_check_accepts_keycloak_masked_smtp_password(self) -> None:
        realm = {"realm": "aiqt", **copy.deepcopy(self.desired.realm_fields)}
        realm["smtpServer"]["password"] = "**********"
        client = FakeKeycloakAdminClient(
            realm=realm,
            client={"id": "client-uuid", **copy.deepcopy(self.desired.client_fields)},
            identity_provider=self._google_provider(),
            codex_client=self._codex_client(),
            scope_payloads=self._scope_payloads(),
            default_scopes={"basic"},
            optional_scopes={"aiqt:research:read"},
        )

        self.assertEqual(self.script.reconcile(client, self.desired, apply=False), "ready")
        self.assertEqual(client.puts, [])
        self.assertEqual(client.posts, [])
        self.assertEqual(client.deletes, [])

    def test_apply_rewrites_masked_smtp_and_google_secrets_without_touching_users(self) -> None:
        realm = {"realm": "aiqt", **copy.deepcopy(self.desired.realm_fields)}
        realm["smtpServer"]["password"] = "**********"
        google = self._google_provider()
        google["config"]["clientSecret"] = "**********"
        client = FakeKeycloakAdminClient(
            realm=realm,
            client={"id": "client-uuid", **copy.deepcopy(self.desired.client_fields)},
            identity_provider=google,
            codex_client=self._codex_client(),
            scope_payloads=self._scope_payloads(),
            default_scopes={"basic"},
            optional_scopes={"aiqt:research:read"},
        )

        self.assertEqual(self.script.reconcile(client, self.desired, apply=True), "updated")
        self.assertEqual(
            [path for path, _ in client.puts],
            [
                "/admin/realms/aiqt",
                "/admin/realms/aiqt/identity-provider/instances/google",
            ],
        )
        self.assertEqual(
            client.realm["smtpServer"]["password"],
            "smtp-secret-value",
        )
        self.assertEqual(
            client.identity_provider["config"]["clientSecret"],
            "google-secret-value",
        )
        mutation_paths = [path for path, _ in client.puts + client.posts] + client.deletes
        self.assertFalse(any("/users" in path for path in mutation_paths))

    def test_first_broker_login_rejects_auto_link_and_missing_verification(self) -> None:
        unsafe_flows = {
            "auto-link-provider": [
                *_safe_first_broker_login_executions(),
                {
                    "id": "execution-auto-link",
                    "level": 1,
                    "displayName": "Automatically set existing user",
                    "providerId": "idp-auto-link",
                    "requirement": "ALTERNATIVE",
                },
            ],
            "auto-link-display-name": [
                *_safe_first_broker_login_executions(),
                {
                    "id": "execution-unknown-auto-link",
                    "level": 1,
                    "displayName": "Automatically set existing user",
                    "providerId": "custom-authenticator",
                    "requirement": "ALTERNATIVE",
                },
            ],
            "missing-confirm-link": [
                execution
                for execution in _safe_first_broker_login_executions()
                if execution.get("providerId") != "idp-confirm-link"
            ],
            "disabled-email-verification": [
                {
                    **execution,
                    **(
                        {"requirement": "DISABLED"}
                        if execution.get("providerId") == "idp-email-verification"
                        else {}
                    ),
                }
                for execution in _safe_first_broker_login_executions()
            ],
        }

        for name, executions in unsafe_flows.items():
            for apply in (False, True):
                with self.subTest(name=name, apply=apply):
                    client = FakeKeycloakAdminClient(
                        realm={
                            "realm": "aiqt",
                            **copy.deepcopy(self.desired.realm_fields),
                        },
                        client={
                            "id": "client-uuid",
                            **copy.deepcopy(self.desired.client_fields),
                        },
                        identity_provider=self._google_provider(),
                        first_broker_login_executions=executions,
                        codex_client=self._codex_client(),
                        scope_payloads=self._scope_payloads(),
                        default_scopes={"basic"},
                        optional_scopes={"aiqt:research:read"},
                    )

                    with self.assertRaisesRegex(
                        self.script.CimdConfigurationDrift,
                        "keycloak_first_broker_login_flow_unsafe",
                    ):
                        self.script.reconcile(client, self.desired, apply=apply)
                    self.assertEqual(client.puts, [])
                    self.assertEqual(client.posts, [])
                    self.assertEqual(client.deletes, [])

    def test_desired_configuration_rejects_missing_secrets_and_invalid_smtp_tls(self) -> None:
        invalid_environments = []
        for name in (
            "AIQT_KEYCLOAK_SMTP_HOST",
            "AIQT_KEYCLOAK_SMTP_PASSWORD",
        ):
            environment = dict(self.environment)
            environment[name] = ""
            invalid_environments.append(
                (environment, "keycloak_deployment_environment_required")
            )
        for missing in (
            "AIQT_KEYCLOAK_GOOGLE_CLIENT_ID",
            "AIQT_KEYCLOAK_GOOGLE_CLIENT_SECRET",
        ):
            environment = dict(self.environment)
            environment[missing] = ""
            invalid_environments.append(
                (environment, "keycloak_deployment_environment_required")
            )
        for mode in ("", "none", "true"):
            environment = dict(self.environment)
            environment["AIQT_KEYCLOAK_SMTP_TLS_MODE"] = mode
            invalid_environments.append((environment, "keycloak_smtp_tls_mode_invalid"))
        for port in ("0", "65536", "submission"):
            environment = dict(self.environment)
            environment["AIQT_KEYCLOAK_SMTP_PORT"] = port
            invalid_environments.append((environment, "keycloak_smtp_port_invalid"))

        for environment, error in invalid_environments:
            with self.subTest(environment=environment), self.assertRaisesRegex(
                ValueError,
                error,
            ):
                self.script.desired_configuration(
                    self.template,
                    public_origin="https://research.example.com",
                    environment=environment,
                )

    def test_check_fails_when_codex_is_missing_and_apply_creates_it_once(self) -> None:
        realm = {"realm": "aiqt", **copy.deepcopy(self.desired.realm_fields)}
        client_payload = {
            "id": "client-uuid",
            **copy.deepcopy(self.desired.client_fields),
        }
        client = FakeKeycloakAdminClient(
            realm=realm,
            client=client_payload,
            identity_provider=self._google_provider(),
            scope_payloads=self._scope_payloads(),
            default_scopes={"basic"},
            optional_scopes={"aiqt:research:read"},
        )

        with self.assertRaisesRegex(
            self.script.CimdConfigurationDrift,
            "keycloak_claude_cimd_migration_required",
        ):
            self.script.reconcile(client, self.desired, apply=False)

        self.assertEqual(
            self.script.reconcile(client, self.desired, apply=True),
            "updated",
        )
        self.assertEqual(self.script.reconcile(client, self.desired, apply=True), "ready")
        self.assertEqual(
            [path for path, _ in client.posts if path == "/admin/realms/aiqt/clients"],
            ["/admin/realms/aiqt/clients"],
        )
        self.assertEqual(client.codex_default_scopes, {"basic"})
        self.assertEqual(
            client.codex_optional_scopes,
            {"aiqt:research:read", "offline_access"},
        )

    def test_apply_repairs_the_existing_codex_client_in_place(self) -> None:
        codex = self._codex_client()
        codex["redirectUris"] = ["http://127.0.0.1:5555/wrong"]
        codex["attributes"]["pkce.code.challenge.method"] = "plain"
        codex["attributes"]["oauth2.device.authorization.grant.enabled"] = "true"
        codex["attributes"]["oidc.ciba.grant.enabled"] = "true"
        codex["optionalClientScopes"] = ["aiqt:research:read"]
        client = FakeKeycloakAdminClient(
            realm={"realm": "aiqt", **copy.deepcopy(self.desired.realm_fields)},
            client={"id": "client-uuid", **copy.deepcopy(self.desired.client_fields)},
            identity_provider=self._google_provider(),
            codex_client=codex,
            scope_payloads=self._scope_payloads(),
            default_scopes={"basic"},
            optional_scopes={"aiqt:research:read"},
        )

        self.assertEqual(
            self.script.reconcile(client, self.desired, apply=True),
            "updated",
        )
        self.assertEqual(
            self.script.reconcile(client, self.desired, apply=False),
            "ready",
        )
        self.assertIn(
            "/admin/realms/aiqt/clients/client-codex-uuid",
            [path for path, _ in client.puts],
        )
        self.assertEqual(
            client.codex_client["attributes"]["oauth2.device.authorization.grant.enabled"],
            "false",
        )
        self.assertEqual(
            client.codex_client["attributes"]["oidc.ciba.grant.enabled"],
            "false",
        )
        self.assertFalse(
            any(path == "/admin/realms/aiqt/clients/client-codex-uuid" for path in client.deletes)
        )

    def test_check_fails_closed_when_an_existing_realm_has_not_been_migrated(self) -> None:
        client = FakeKeycloakAdminClient(
            realm={"realm": "aiqt", "displayName": "existing"},
            client=self._legacy_client(),
            identity_provider=self._google_provider(),
            codex_client=self._codex_client(),
            scope_payloads=self._scope_payloads(
                research_audience="https://evil.example/mcp",
            ),
        )

        with self.assertRaisesRegex(
            self.script.CimdConfigurationDrift,
            "keycloak_claude_cimd_migration_required",
        ):
            self.script.reconcile(client, self.desired, apply=False)

        self.assertEqual(client.puts, [])

    def test_apply_converges_the_existing_realm_and_is_idempotent(self) -> None:
        client = FakeKeycloakAdminClient(
            realm={"realm": "aiqt", "displayName": "existing"},
            client=self._legacy_client(),
            identity_provider=self._google_provider(),
            codex_client=self._codex_client(),
            scope_payloads=self._scope_payloads(
                research_audience="https://evil.example/mcp",
            ),
        )

        first = self.script.reconcile(client, self.desired, apply=True)
        second = self.script.reconcile(client, self.desired, apply=True)
        checked = self.script.reconcile(client, self.desired, apply=False)

        self.assertEqual(first, "updated")
        self.assertEqual(second, "ready")
        self.assertEqual(checked, "ready")
        self.assertEqual(len(client.puts), 5)
        self.assertEqual(len(client.deletes), 1)
        for field, value in self.desired.realm_fields.items():
            self.assertEqual(client.realm[field], value)
        for field, value in self.desired.client_fields.items():
            if field in {"defaultClientScopes", "optionalClientScopes"}:
                continue
            if field == "attributes":
                for attribute, attribute_value in value.items():
                    self.assertEqual(client.client[field][attribute], attribute_value)
            else:
                self.assertEqual(client.client[field], value)
        self.assertEqual(client.default_scopes, {"basic"})
        self.assertEqual(
            client.client_optional_scopes,
            {"aiqt:research:read", "offline_access"},
        )
        self.assertEqual(client.optional_scopes, {"aiqt:research:read"})
        self.assertEqual(client.realm["displayName"], "existing")
        self.assertEqual(client.client["id"], "client-uuid")
        self.assertEqual(
            client.client["clientId"],
            "https://claude.ai/oauth/mcp-oauth-client-metadata",
        )
        self.assertEqual(
            client.scope_payloads["aiqt:research:read"]["protocolMappers"][0][
                "config"
            ]["included.custom.audience"],
            "https://research.example.com/mcp",
        )

    def test_check_accepts_keycloak_normalized_client_attributes(self) -> None:
        realm = {
            "realm": "aiqt",
            **copy.deepcopy(self.desired.realm_fields),
        }
        client_payload = {
            "id": "client-uuid",
            "clientId": "https://claude.ai/oauth/mcp-oauth-client-metadata",
            **copy.deepcopy(self.desired.client_fields),
        }
        client_payload["attributes"]["client.use.lightweight.access.token.enabled"] = "false"
        client = FakeKeycloakAdminClient(
            realm=realm,
            client=client_payload,
            identity_provider=self._google_provider(),
            codex_client=self._codex_client(),
            scope_payloads=self._scope_payloads(),
            default_scopes={"basic"},
            optional_scopes={"aiqt:research:read"},
        )

        self.assertEqual(
            self.script.reconcile(client, self.desired, apply=False),
            "ready",
        )
        self.assertEqual(client.puts, [])
        self.assertEqual(client.deletes, [])

    def test_check_detects_and_apply_repairs_a_drifted_mcp_audience(self) -> None:
        realm = {"realm": "aiqt", **copy.deepcopy(self.desired.realm_fields)}
        client_payload = {
            "id": "client-uuid",
            "clientId": "https://claude.ai/oauth/mcp-oauth-client-metadata",
            **copy.deepcopy(self.desired.client_fields),
        }
        client = FakeKeycloakAdminClient(
            realm=realm,
            client=client_payload,
            identity_provider=self._google_provider(),
            codex_client=self._codex_client(),
            scope_payloads=self._scope_payloads(
                research_audience="https://evil.example/mcp",
            ),
            default_scopes={"basic"},
            optional_scopes={"aiqt:research:read"},
        )

        with self.assertRaisesRegex(
            self.script.CimdConfigurationDrift,
            "keycloak_claude_cimd_migration_required",
        ):
            self.script.reconcile(client, self.desired, apply=False)

        self.assertEqual(
            self.script.reconcile(client, self.desired, apply=True),
            "updated",
        )
        self.assertEqual(
            self.script.reconcile(client, self.desired, apply=False),
            "ready",
        )
        self.assertEqual(
            client.scope_payloads["aiqt:research:read"]["protocolMappers"][0][
                "config"
            ]["included.custom.audience"],
            "https://research.example.com/mcp",
        )

    def test_apply_restores_missing_and_removes_extra_scope_mappers(self) -> None:
        realm = {"realm": "aiqt", **copy.deepcopy(self.desired.realm_fields)}
        client_payload = {
            "id": "client-uuid",
            "clientId": "https://claude.ai/oauth/mcp-oauth-client-metadata",
            **copy.deepcopy(self.desired.client_fields),
        }
        scope_payloads = self._scope_payloads()
        scope_payloads["basic"].pop("protocolMappers")
        scope_payloads["aiqt:research:read"]["protocolMappers"].append(
            {
                "id": "mapper-extra",
                "name": "unexpected-claim",
                "protocol": "openid-connect",
                "protocolMapper": "oidc-hardcoded-claim-mapper",
                "consentRequired": False,
                "config": {"claim.name": "unexpected"},
            }
        )
        client = FakeKeycloakAdminClient(
            realm=realm,
            client=client_payload,
            identity_provider=self._google_provider(),
            codex_client=self._codex_client(),
            scope_payloads=scope_payloads,
            default_scopes={"basic"},
            optional_scopes={"aiqt:research:read"},
        )

        self.assertEqual(
            self.script.reconcile(client, self.desired, apply=True),
            "updated",
        )
        self.assertEqual(
            self.script.reconcile(client, self.desired, apply=False),
            "ready",
        )
        self.assertEqual(len(client.posts), 2)
        self.assertEqual(
            {payload["name"] for _, payload in client.posts},
            {"sub", "auth_time"},
        )
        self.assertIn(
            "/admin/realms/aiqt/client-scopes/scope-research/"
            "protocol-mappers/models/mapper-extra",
            client.deletes,
        )

    def test_public_origin_must_be_a_canonical_https_origin(self) -> None:
        for invalid in (
            "",
            "http://research.example.com",
            "https://research.example.com/path",
            "https://user@research.example.com",
        ):
            with self.subTest(origin=invalid), self.assertRaisesRegex(
                ValueError,
                "public_origin_invalid",
            ):
                self.script.desired_configuration(
                    self.template,
                    public_origin=invalid,
                    environment=self.environment,
                )

    def test_admin_credentials_can_only_be_sent_to_the_internal_keycloak_service(self) -> None:
        for invalid in (
            "https://auth.example.com",
            "http://evil.example:8080",
            "http://keycloak:9999",
            "http://keycloak:8080/path",
        ):
            with self.subTest(server=invalid), self.assertRaisesRegex(
                ValueError,
                "keycloak_admin_server_invalid",
            ):
                self.script.validate_admin_server(invalid)

        self.assertEqual(
            self.script.validate_admin_server("http://keycloak:8080"),
            "http://keycloak:8080",
        )
        self.assertEqual(
            self.script.validate_admin_server("http://127.0.0.1:8080"),
            "http://127.0.0.1:8080",
        )


if __name__ == "__main__":
    unittest.main()
