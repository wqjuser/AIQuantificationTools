from __future__ import annotations

import json
from pathlib import Path
import unittest


class KeycloakDeploymentContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.root = Path(__file__).resolve().parents[3]

    def test_public_compose_bootstraps_keycloak_in_an_isolated_schema(self) -> None:
        overlay = (self.root / "compose.public.yaml").read_text()

        self.assertIn("keycloak-postgres:", overlay)
        self.assertIn("POSTGRES_DB: keycloak", overlay)
        self.assertIn("POSTGRES_USER: keycloak", overlay)
        self.assertIn("AIQT_KEYCLOAK_DATABASE_PASSWORD", overlay)
        self.assertIn("keycloak-postgres:/var/lib/postgresql/data", overlay)
        self.assertIn("keycloak-schema:", overlay)
        self.assertIn("CREATE SCHEMA IF NOT EXISTS keycloak AUTHORIZATION keycloak", overlay)
        self.assertIn(
            "keycloak:\n    image: quay.io/keycloak/keycloak:26.7.0@sha256:0f198be292568439d700cdbfb893e69a6009bb43a94a06a945b1d3d506c76b13",
            overlay,
        )
        self.assertIn("KC_DB_URL: jdbc:postgresql://keycloak-postgres:5432/keycloak", overlay)
        self.assertIn("KC_DB_SCHEMA: keycloak", overlay)
        self.assertNotIn("KC_HTTP_RELATIVE_PATH:", overlay)
        self.assertIn("KC_HOSTNAME: ${AIQT_AUTH_ORIGIN:?set AIQT_AUTH_ORIGIN}", overlay)
        self.assertNotIn("KC_BOOTSTRAP_ADMIN_USERNAME", overlay)
        self.assertNotIn("KC_BOOTSTRAP_ADMIN_PASSWORD", overlay)
        self.assertIn("AIQT_KEYCLOAK_WEB_CLIENT_SECRET", overlay)
        self.assertIn("./deploy/keycloak/realm-aiqt.json:/opt/keycloak/data/import/aiqt-realm.json:ro", overlay)
        self.assertIn('command: ["start", "--import-realm"]', overlay)
        self.assertIn(
            "AIQT_OIDC_ISSUER: ${AIQT_AUTH_ORIGIN:?set AIQT_AUTH_ORIGIN}/realms/aiqt",
            overlay,
        )
        self.assertIn("AIQT_OIDC_CLIENT_ID: aiqt-web", overlay)
        caddy = overlay.split("\n  caddy:\n", 1)[1].split("\nvolumes:\n", 1)[0]
        self.assertIn(
            "AIQT_AUTH_ORIGIN: ${AIQT_AUTH_ORIGIN:?set AIQT_AUTH_ORIGIN}",
            caddy,
        )

        bootstrap = (self.root / "compose.keycloak-bootstrap.yaml").read_text()
        self.assertIn("keycloak:", bootstrap)
        self.assertIn(
            "KC_BOOTSTRAP_ADMIN_USERNAME: ${AIQT_KEYCLOAK_BOOTSTRAP_ADMIN_USERNAME:?set AIQT_KEYCLOAK_BOOTSTRAP_ADMIN_USERNAME}",
            bootstrap,
        )
        self.assertIn(
            "KC_BOOTSTRAP_ADMIN_PASSWORD: ${AIQT_KEYCLOAK_BOOTSTRAP_ADMIN_PASSWORD:?set AIQT_KEYCLOAK_BOOTSTRAP_ADMIN_PASSWORD}",
            bootstrap,
        )

    def test_imported_realm_pre_registers_only_pkce_authorization_code_clients(self) -> None:
        realm = json.loads(
            (self.root / "deploy" / "keycloak" / "realm-aiqt.json").read_text()
        )

        self.assertEqual(realm["realm"], "aiqt")
        self.assertTrue(realm["enabled"])
        self.assertFalse(realm["registrationAllowed"])
        self.assertEqual(
            realm["passwordPolicy"],
            "hashAlgorithm(argon2) and length(15) and notUsername and notEmail and passwordHistory(5)",
        )

        clients = {client["clientId"]: client for client in realm["clients"]}
        self.assertEqual(set(clients), {"admin-cli", "aiqt-web", "aiqt-mcp"})

        admin_cli = clients["admin-cli"]
        self.assertFalse(admin_cli["enabled"])
        self.assertFalse(admin_cli["standardFlowEnabled"])
        self.assertFalse(admin_cli["implicitFlowEnabled"])
        self.assertFalse(admin_cli["directAccessGrantsEnabled"])
        self.assertFalse(admin_cli["serviceAccountsEnabled"])

        web = clients["aiqt-web"]
        self.assertFalse(web["publicClient"])
        self.assertEqual(web["secret"], "${AIQT_KEYCLOAK_WEB_CLIENT_SECRET}")
        self.assertEqual(
            web["redirectUris"],
            ["${AIQT_PUBLIC_ORIGIN}/api/auth/callback"],
        )
        self.assertEqual(
            web["attributes"]["post.logout.redirect.uris"],
            "${AIQT_PUBLIC_ORIGIN}",
        )

        mcp = clients["aiqt-mcp"]
        self.assertTrue(mcp["publicClient"])
        self.assertNotIn("secret", mcp)
        self.assertEqual(mcp["redirectUris"], [])
        self.assertIn("aiqt:research:read", mcp["optionalClientScopes"])

        for client in (web, mcp):
            with self.subTest(client=client["clientId"]):
                self.assertTrue(client["standardFlowEnabled"])
                self.assertFalse(client["implicitFlowEnabled"])
                self.assertFalse(client["directAccessGrantsEnabled"])
                self.assertFalse(client["serviceAccountsEnabled"])
                self.assertEqual(
                    client["attributes"]["pkce.code.challenge.method"],
                    "S256",
                )

    def test_research_scope_adds_only_the_canonical_mcp_audience(self) -> None:
        realm = json.loads(
            (self.root / "deploy" / "keycloak" / "realm-aiqt.json").read_text()
        )
        scopes = {scope["name"]: scope for scope in realm["clientScopes"]}

        research = scopes["aiqt:research:read"]
        self.assertEqual(research["protocol"], "openid-connect")
        self.assertEqual(len(research["protocolMappers"]), 1)
        mapper = research["protocolMappers"][0]
        self.assertEqual(mapper["protocolMapper"], "oidc-audience-mapper")
        self.assertEqual(
            mapper["config"]["included.custom.audience"],
            "${AIQT_PUBLIC_ORIGIN}/mcp",
        )
        self.assertEqual(mapper["config"]["access.token.claim"], "true")
        self.assertEqual(mapper["config"]["id.token.claim"], "false")

    def test_realm_defines_the_identity_scopes_used_by_web_login_and_mcp(self) -> None:
        realm = json.loads(
            (self.root / "deploy" / "keycloak" / "realm-aiqt.json").read_text()
        )
        scopes = {scope["name"]: scope for scope in realm["clientScopes"]}

        self.assertIn("basic", scopes)
        self.assertIn("profile", scopes)
        self.assertIn("email", scopes)
        basic_mappers = {
            mapper["name"]: mapper for mapper in scopes["basic"]["protocolMappers"]
        }
        self.assertEqual(set(basic_mappers), {"sub", "auth_time"})
        self.assertEqual(
            basic_mappers["sub"]["protocolMapper"],
            "oidc-sub-mapper",
        )
        self.assertEqual(
            basic_mappers["sub"]["config"]["access.token.claim"],
            "true",
        )
        self.assertEqual(
            basic_mappers["auth_time"]["config"]["claim.name"],
            "auth_time",
        )
        self.assertEqual(
            basic_mappers["auth_time"]["config"]["id.token.claim"],
            "true",
        )
        email_claims = {
            mapper["config"]["claim.name"]: mapper
            for mapper in scopes["email"]["protocolMappers"]
        }
        self.assertEqual(set(email_claims), {"email", "email_verified"})
        self.assertEqual(
            email_claims["email"]["protocolMapper"],
            "oidc-usermodel-property-mapper",
        )
        self.assertEqual(email_claims["email"]["config"]["id.token.claim"], "true")
        self.assertEqual(
            email_claims["email_verified"]["protocolMapper"],
            "oidc-usermodel-property-mapper",
        )
        self.assertEqual(
            email_claims["email_verified"]["config"]["id.token.claim"],
            "true",
        )
        self.assertEqual(
            email_claims["email_verified"]["config"]["jsonType.label"],
            "boolean",
        )
        profile_mapper = scopes["profile"]["protocolMappers"][0]
        self.assertEqual(
            profile_mapper["protocolMapper"],
            "oidc-usermodel-property-mapper",
        )

        clients = {client["clientId"]: client for client in realm["clients"]}
        self.assertEqual(
            clients["aiqt-web"]["defaultClientScopes"],
            ["basic", "profile", "email"],
        )
        self.assertEqual(
            clients["aiqt-mcp"]["defaultClientScopes"],
            ["basic"],
        )

    def test_caddy_exposes_login_but_blocks_admin_and_dynamic_registration(self) -> None:
        caddy = (self.root / "deploy" / "Caddyfile").read_text()

        self.assertIn("{$AIQT_AUTH_ORIGIN} {", caddy)
        public_site, auth_site = caddy.split("{$AIQT_AUTH_ORIGIN} {", 1)
        self.assertNotIn("reverse_proxy keycloak:8080", public_site)

        admin_matcher = (
            "@keycloakAdmin path /admin /admin/* /realms/master /realms/master/*"
        )
        registration_matcher = (
            "@keycloakRegistration path /realms/aiqt/clients-registrations "
            "/realms/aiqt/clients-registrations/*"
        )
        public_matcher = (
            "@keycloakPublic path /.well-known /.well-known/* /realms/aiqt "
            "/realms/aiqt/* /resources /resources/*"
        )
        self.assertIn(admin_matcher, auth_site)
        self.assertIn(registration_matcher, auth_site)
        self.assertIn(public_matcher, auth_site)
        self.assertIn("reverse_proxy keycloak:8080", auth_site)
        self.assertLess(auth_site.index(admin_matcher), auth_site.index(public_matcher))
        self.assertLess(
            auth_site.index(registration_matcher),
            auth_site.index(public_matcher),
        )
        self.assertGreaterEqual(auth_site.count("respond 404"), 3)

    def test_operations_runbook_uses_quiet_rendering_and_a_realm_scoped_admin(self) -> None:
        runbook = (self.root / "docs" / "public-deployment.md").read_text()

        self.assertLess(runbook.index("## 1. 配置环境"), runbook.index("## 2. 准备自托管 Keycloak"))
        self.assertIn("install -m 600 .env.example .env", runbook)
        self.assertIn("stat -c '%a' .env", runbook)
        self.assertIn(
            "--rolename view-realm --rolename manage-realm",
            runbook,
        )
        self.assertIn(
            "docker compose -f compose.yaml -f compose.public.yaml config --quiet",
            runbook,
        )
        self.assertNotIn(
            "docker compose -f compose.yaml -f compose.public.yaml config\n",
            runbook,
        )
        self.assertLess(
            runbook.index("up -d --no-build caddy"),
            runbook.index("此时立即在受控公网环境验证"),
        )
        self.assertIn("AIQT_BACKUP_AGE_RECIPIENT", runbook)
        self.assertIn("AIQT_BACKUP_AGE_IDENTITY_FILE", runbook)
        self.assertIn("aiqt-keycloak-restore-verify", runbook)
        self.assertIn("keycloak_restore_verify", runbook)
        self.assertIn("静态加密的块设备或云盘", runbook)
        self.assertIn("run --rm --no-deps api", runbook)
        self.assertNotIn('--database-url "$AIQT_DATABASE_URL"', runbook)
        self.assertIn("'firstName=<given-name>'", runbook)


if __name__ == "__main__":
    unittest.main()
