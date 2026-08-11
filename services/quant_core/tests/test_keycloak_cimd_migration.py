from __future__ import annotations

import copy
import importlib.util
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[3]
SCRIPT_PATH = ROOT / "tools" / "apply_keycloak_claude_cimd.py"


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
        default_scopes: set[str] | None = None,
        optional_scopes: set[str] | None = None,
    ) -> None:
        self.realm = copy.deepcopy(realm)
        self.client = copy.deepcopy(client)
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
        if path == "/admin/realms/aiqt/clients?clientId=aiqt-mcp":
            return [{"id": self.client["id"], "clientId": "aiqt-mcp"}]
        if path == f"/admin/realms/aiqt/clients/{self.client['id']}":
            return copy.deepcopy(self.client)
        if path == "/admin/realms/aiqt/client-scopes":
            return [
                {"id": scope_id, "name": name}
                for name, scope_id in self.scopes.items()
            ]
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
            self.client = copy.deepcopy(payload)
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
        cls.desired = cls.script.desired_configuration(
            cls.template,
            public_origin="https://research.example.com",
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
            if item["clientId"] == "aiqt-mcp"
        )
        client = copy.deepcopy(template_client)
        client["id"] = "client-uuid"
        client["redirectUris"] = []
        client["attributes"] = {
            **client["attributes"],
            "client.use.lightweight.access.token.enabled": "false",
        }
        return client

    def test_check_fails_closed_when_an_existing_realm_has_not_been_migrated(self) -> None:
        client = FakeKeycloakAdminClient(
            realm={"realm": "aiqt", "displayName": "existing"},
            client=self._legacy_client(),
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
        self.assertEqual(len(client.puts), 4)
        self.assertEqual(len(client.deletes), 1)
        for field, value in self.desired.realm_fields.items():
            self.assertEqual(client.realm[field], value)
        for field, value in self.desired.client_fields.items():
            if field == "attributes":
                for attribute, attribute_value in value.items():
                    self.assertEqual(client.client[field][attribute], attribute_value)
            else:
                self.assertEqual(client.client[field], value)
        self.assertEqual(client.default_scopes, {"basic"})
        self.assertEqual(client.optional_scopes, {"aiqt:research:read"})
        self.assertEqual(client.realm["displayName"], "existing")
        self.assertEqual(client.client["id"], "client-uuid")
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
            "clientId": "aiqt-mcp",
            **copy.deepcopy(self.desired.client_fields),
        }
        client_payload["attributes"]["client.use.lightweight.access.token.enabled"] = "false"
        client = FakeKeycloakAdminClient(
            realm=realm,
            client=client_payload,
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
            "clientId": "aiqt-mcp",
            **copy.deepcopy(self.desired.client_fields),
        }
        client = FakeKeycloakAdminClient(
            realm=realm,
            client=client_payload,
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
            "clientId": "aiqt-mcp",
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
