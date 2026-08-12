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
        self.assertIn(
            'command: ["start", "--features=cimd", "--import-realm"]',
            overlay,
        )
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

    def test_public_keycloak_enables_cimd_without_enabling_dynamic_registration(self) -> None:
        overlay = (self.root / "compose.public.yaml").read_text()
        caddy = (self.root / "deploy" / "Caddyfile").read_text()
        api_dockerfile = (self.root / "Dockerfile.api").read_text()

        self.assertIn(
            'command: ["start", "--features=cimd", "--import-realm"]',
            overlay,
        )
        self.assertIn(
            "@keycloakRegistration path /realms/aiqt/clients-registrations "
            "/realms/aiqt/clients-registrations/*",
            caddy,
        )
        registration_handler = caddy.split("@keycloakRegistration", 1)[1].split(
            "@keycloakPublic", 1
        )[0]
        self.assertIn("respond 404", registration_handler)
        self.assertNotIn("reverse_proxy", registration_handler)
        self.assertIn(
            "COPY deploy/keycloak/realm-aiqt.json deploy/keycloak/realm-aiqt.json",
            api_dockerfile,
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
        self.assertEqual(
            set(clients),
            {
                "admin-cli",
                "aiqt-web",
                "aiqt-codex-cli",
                "https://claude.ai/oauth/mcp-oauth-client-metadata",
            },
        )

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

        mcp = clients["https://claude.ai/oauth/mcp-oauth-client-metadata"]
        self.assertTrue(mcp["publicClient"])
        self.assertNotIn("secret", mcp)
        self.assertEqual(
            mcp["redirectUris"],
            [
                "https://claude.ai/api/mcp/auth_callback",
            ],
        )
        self.assertNotIn("*", "".join(mcp["redirectUris"]))
        self.assertIn("aiqt:research:read", mcp["optionalClientScopes"])
        self.assertIn("offline_access", mcp["optionalClientScopes"])
        self.assertEqual(
            mcp["attributes"]["cimd.cache.expiry.time.in.sec"],
            "2147483647",
        )

        codex = clients["aiqt-codex-cli"]
        self.assertTrue(codex["publicClient"])
        self.assertNotIn("secret", codex)
        self.assertEqual(
            codex["redirectUris"],
            ["http://127.0.0.1:5555/callback/sbmemyhC9-Ja"],
        )
        self.assertEqual(
            codex["optionalClientScopes"],
            ["aiqt:research:read", "offline_access"],
        )
        self.assertEqual(
            codex["attributes"]["oauth2.device.authorization.grant.enabled"],
            "false",
        )
        self.assertEqual(
            codex["attributes"]["oidc.ciba.grant.enabled"],
            "false",
        )

        for client in (web, mcp, codex):
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

    def test_realm_allows_only_restricted_claude_cimd_clients(self) -> None:
        realm = json.loads(
            (self.root / "deploy" / "keycloak" / "realm-aiqt.json").read_text()
        )

        self.assertFalse(realm["registrationAllowed"])
        self.assertEqual(realm["defaultDefaultClientScopes"], ["basic"])
        self.assertEqual(
            realm["defaultOptionalClientScopes"],
            ["aiqt:research:read"],
        )

        profiles = {
            profile["name"]: profile
            for profile in realm["clientProfiles"]["profiles"]
        }
        self.assertEqual(
            set(profiles),
            {"claude-cimd-profile", "reject-non-public-cimd-profile"},
        )
        executors = {
            executor["executor"]: executor.get("configuration", {})
            for executor in profiles["claude-cimd-profile"]["executors"]
        }
        self.assertEqual(
            set(executors),
            {
                "client-id-metadata-document",
                "pkce-enforcer",
                "reject-implicit-grant",
                "reject-ropc-grant",
                "full-scope-disabled",
                "consent-required",
            },
        )
        metadata = executors["client-id-metadata-document"]
        self.assertFalse(metadata["cimd-allow-http-scheme"])
        self.assertEqual(
            metadata["cimd-allow-permitted-domains"],
            ["claude.ai", "localhost", "127.0.0.1"],
        )
        self.assertFalse(metadata["cimd-restrict-same-domain"])
        self.assertFalse(metadata["only-allow-confidential-client"])
        self.assertEqual(
            metadata["cimd-required-properties"],
            [
                "client_name",
                "redirect_uris",
                "grant_types",
                "response_types",
                "token_endpoint_auth_method",
            ],
        )
        self.assertNotIn("secure-redirect-uris-enforcer", executors)
        self.assertEqual(executors["pkce-enforcer"]["auto-configure"], "true")
        self.assertEqual(
            executors["reject-implicit-grant"]["auto-configure"],
            "true",
        )
        self.assertEqual(executors["reject-ropc-grant"]["auto-configure"], "true")
        self.assertEqual(executors["full-scope-disabled"]["auto-configure"], "true")
        self.assertEqual(executors["consent-required"]["auto-configure"], "true")
        self.assertEqual(
            profiles["reject-non-public-cimd-profile"]["executors"],
            [{"executor": "reject-request", "configuration": {}}],
        )

        policies = {
            policy["name"]: policy
            for policy in realm["clientPolicies"]["policies"]
        }
        self.assertEqual(
            set(policies),
            {
                "allow-official-claude-cimd",
                "reject-confidential-claude-cimd",
                "reject-bearer-only-claude-cimd",
            },
        )
        for policy in policies.values():
            self.assertTrue(policy["enabled"])
            self.assertEqual(policy["mode"], "STRICT")
            client_id_condition = policy["conditions"][0]
            self.assertEqual(client_id_condition["condition"], "client-id-uri")
            self.assertEqual(
                client_id_condition["configuration"],
                {
                    "client-id-uri-scheme": ["https"],
                    "client-id-uri-allow-permitted-domains": ["claude.ai"],
                },
            )
        self.assertEqual(
            policies["allow-official-claude-cimd"]["profiles"],
            ["claude-cimd-profile"],
        )
        for access_type, policy_name in (
            ("confidential", "reject-confidential-claude-cimd"),
            ("bearer-only", "reject-bearer-only-claude-cimd"),
        ):
            self.assertEqual(
                policies[policy_name]["conditions"][1],
                {
                    "condition": "client-access-type",
                    "configuration": {"type": [access_type]},
                },
            )
            self.assertEqual(
                policies[policy_name]["profiles"],
                ["reject-non-public-cimd-profile"],
            )

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
            clients["https://claude.ai/oauth/mcp-oauth-client-metadata"][
                "defaultClientScopes"
            ],
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
