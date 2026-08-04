from __future__ import annotations

import base64
from http.client import HTTPConnection
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from threading import Thread
import unittest

from quant_core.deployment import DeploymentConfigurationError, load_deployment_config
from quant_core.http_api.support.handler_transport import HandlerTransportMixin
from quant_core.http_api.routes.dispatch import RouteDispatchMixin


class DeploymentConfigurationTest(unittest.TestCase):
    def test_local_mode_is_the_default_single_tenant_mode(self) -> None:
        config = load_deployment_config({})

        self.assertEqual(config.mode, "local")
        self.assertEqual(config.tenant_id, "local")
        self.assertFalse(config.authentication_required)

    def test_public_mode_requires_every_security_boundary(self) -> None:
        required = {
            "AIQT_DATABASE_URL": "postgresql+psycopg://aiqt:secret@postgres/aiqt",
            "AIQT_PUBLIC_ORIGIN": "https://research.example.com",
            "AIQT_OIDC_ISSUER": "https://identity.example.com",
            "AIQT_OIDC_CLIENT_ID": "aiqt",
            "AIQT_OIDC_CLIENT_SECRET": "oidc-secret",
            "AIQT_SETTINGS_MASTER_KEY": base64.urlsafe_b64encode(b"x" * 32).decode(),
        }

        for missing in required:
            environment = {"AIQT_DEPLOYMENT_MODE": "public", **required}
            del environment[missing]
            with self.subTest(missing=missing), self.assertRaisesRegex(
                DeploymentConfigurationError,
                missing,
            ):
                load_deployment_config(environment)

    def test_public_mode_accepts_only_https_and_postgresql(self) -> None:
        environment = {
            "AIQT_DEPLOYMENT_MODE": "public",
            "AIQT_DATABASE_URL": "postgresql+psycopg://aiqt:secret@postgres/aiqt",
            "AIQT_PUBLIC_ORIGIN": "https://research.example.com",
            "AIQT_OIDC_ISSUER": "https://identity.example.com",
            "AIQT_OIDC_CLIENT_ID": "aiqt",
            "AIQT_OIDC_CLIENT_SECRET": "oidc-secret",
            "AIQT_SETTINGS_MASTER_KEY": base64.urlsafe_b64encode(b"x" * 32).decode(),
        }

        config = load_deployment_config(environment)

        self.assertEqual(config.mode, "public")
        self.assertTrue(config.authentication_required)
        self.assertEqual(config.public_origin, "https://research.example.com")
        self.assertEqual(config.oidc_callback_url, "https://research.example.com/api/auth/callback")

        invalid_values = {
            "AIQT_DATABASE_URL": "sqlite:///data.sqlite",
            "AIQT_PUBLIC_ORIGIN": "http://research.example.com",
            "AIQT_OIDC_ISSUER": "http://identity.example.com",
        }
        for name, value in invalid_values.items():
            invalid = {**environment, name: value}
            with self.subTest(name=name), self.assertRaises(DeploymentConfigurationError):
                load_deployment_config(invalid)

    def test_public_origin_must_be_an_origin_not_a_url_prefix(self) -> None:
        environment = {
            "AIQT_DEPLOYMENT_MODE": "public",
            "AIQT_DATABASE_URL": "postgresql+psycopg://aiqt:secret@postgres/aiqt",
            "AIQT_PUBLIC_ORIGIN": "https://research.example.com/app",
            "AIQT_OIDC_ISSUER": "https://identity.example.com",
            "AIQT_OIDC_CLIENT_ID": "aiqt",
            "AIQT_OIDC_CLIENT_SECRET": "oidc-secret",
            "AIQT_SETTINGS_MASTER_KEY": base64.urlsafe_b64encode(b"x" * 32).decode(),
        }

        with self.assertRaisesRegex(DeploymentConfigurationError, "AIQT_PUBLIC_ORIGIN"):
            load_deployment_config(environment)

    def test_invalid_deployment_mode_fails_closed(self) -> None:
        with self.assertRaisesRegex(DeploymentConfigurationError, "AIQT_DEPLOYMENT_MODE"):
            load_deployment_config({"AIQT_DEPLOYMENT_MODE": "staging"})

    def test_local_http_responses_do_not_emit_wildcard_cors(self) -> None:
        class Handler(HandlerTransportMixin, BaseHTTPRequestHandler):
            def do_GET(self) -> None:
                self._send_json({"ok": True})

        server = HTTPServer(("127.0.0.1", 0), Handler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        connection = HTTPConnection(*server.server_address, timeout=5)
        try:
            connection.request("GET", "/health")
            response = connection.getresponse()
            response.read()
        finally:
            connection.close()
            server.shutdown()
            thread.join(timeout=5)
            server.server_close()

        self.assertEqual(response.status, 200)
        self.assertIsNone(response.getheader("Access-Control-Allow-Origin"))
        self.assertEqual(response.getheader("X-Content-Type-Options"), "nosniff")
        self.assertIn("frame-ancestors", response.getheader("Content-Security-Policy") or "")

    def test_local_auth_probe_is_successful_without_creating_a_session(self) -> None:
        class Handler(RouteDispatchMixin):
            path = "/api/auth/session"

            def _send_json(self, payload, status=200):
                self.response = (status, payload)

        handler = Handler()
        handler.do_GET()

        self.assertEqual(
            handler.response,
            (200, {"deploymentMode": "local", "authenticated": False}),
        )

    def test_default_compose_binds_web_to_loopback(self) -> None:
        compose = (Path(__file__).resolve().parents[3] / "compose.yaml").read_text()

        self.assertIn('"127.0.0.1:${AIQT_WEB_PORT:-5173}:80"', compose)
        self.assertNotIn('- "${AIQT_WEB_PORT:-5173}:80"', compose)

    def test_public_compose_exposes_only_caddy_and_includes_postgresql_migration(self) -> None:
        root = Path(__file__).resolve().parents[3]
        overlay = (root / "compose.public.yaml").read_text()
        caddyfile = (root / "deploy" / "Caddyfile").read_text()

        self.assertIn("AIQT_DEPLOYMENT_MODE: public", overlay)
        self.assertIn(
            "AIQT_OUTBOUND_ORIGIN_ALLOWLIST: ${AIQT_OUTBOUND_ORIGIN_ALLOWLIST:-}",
            overlay,
        )
        self.assertIn("postgres:", overlay)
        self.assertIn("service_completed_successfully", overlay)
        self.assertIn('"80:80"', overlay)
        self.assertIn('"443:443"', overlay)
        self.assertIn("reverse_proxy api:8765", caddyfile)
        self.assertIn("reverse_proxy web:80", caddyfile)


if __name__ == "__main__":
    unittest.main()
