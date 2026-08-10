from __future__ import annotations

import json
from dataclasses import replace
from datetime import datetime, timezone
import os
from pathlib import Path
import unittest

import httpx
from mcp import Client, StdioServerParameters
from mcp.client.stdio import stdio_client

from quant_core.mcp_service import (
    McpServiceSettings,
    QuantApiClient,
    QuantApiError,
    create_mcp_server,
)
from quant_core.mcp_service.cli import transport_security_settings


UTC = timezone.utc


class _ApiFixture:
    def __init__(self) -> None:
        self.requests: list[tuple[str, str, dict[str, object] | None]] = []
        self.responses: dict[tuple[str, str], tuple[int, dict[str, object]]] = {}

    def respond(
        self,
        method: str,
        path: str,
        payload: dict[str, object],
        *,
        status: int = 200,
    ) -> None:
        self.responses[(method, path)] = (status, payload)

    def __call__(self, request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content) if request.content else None
        self.requests.append((request.method, str(request.url), body))
        response = self.responses.get((request.method, request.url.path))
        if response is None:
            return httpx.Response(
                404,
                json={"error": "not_found", "detail": request.url.path},
            )
        status, payload = response
        return httpx.Response(status, json=payload)


def _settings(*, writes: bool = False) -> McpServiceSettings:
    return McpServiceSettings(
        api_base_url="http://quant.test",
        api_cookie=None,
        api_csrf_token=None,
        api_origin=None,
        transport="stdio",
        host="127.0.0.1",
        port=8766,
        operator="MCP Researcher",
        research_writes_enabled=writes,
        request_timeout_seconds=10.0,
    )


class McpServiceTest(unittest.IsolatedAsyncioTestCase):
    async def _client(self, fixture: _ApiFixture, *, writes: bool = False):
        settings = _settings(writes=writes)
        api = QuantApiClient(
            settings,
            transport=httpx.MockTransport(fixture),
        )
        return Client(
            create_mcp_server(settings=settings, api=api),
            raise_exceptions=False,
        )

    async def test_discovery_exposes_research_surface_and_no_execution_controls(self) -> None:
        fixture = _ApiFixture()
        client_context = await self._client(fixture)
        async with client_context as client:
            tools = await client.list_tools()
            resources = await client.list_resources()
            templates = await client.list_resource_templates()
            forged_launch = await client.call_tool(
                "aiqt_launch_strategy_research",
                {
                    "proposal_id": "strategy-research-proposal-" + "a" * 24,
                    "confirmed": True,
                    "operator": "browser-forged",
                },
            )

        tool_names = {tool.name for tool in tools.tools}
        self.assertEqual(
            tool_names,
            {
                "aiqt_get_system_status",
                "aiqt_search_instruments",
                "aiqt_read_market_context",
                "aiqt_select_research_candidates",
                "aiqt_list_research_runs",
                "aiqt_get_research_run",
                "aiqt_create_registered_research",
                "aiqt_propose_strategy_research",
                "aiqt_launch_strategy_research",
                "aiqt_get_strategy_research",
                "aiqt_create_ai_review",
                "aiqt_get_paper_status",
                "aiqt_list_research_audit_events",
            },
        )
        forbidden = (
            "promotion",
            "bind",
            "enable",
            "live",
            "testnet",
            "order",
            "secret",
            "stage10",
            "reconcile",
            "evaluation",
        )
        self.assertFalse(
            any(term in name for name in tool_names for term in forbidden)
        )
        launch = next(
            tool for tool in tools.tools
            if tool.name == "aiqt_launch_strategy_research"
        )
        self.assertNotIn("operator", launch.input_schema.get("properties", {}))
        self.assertNotIn("confirmed", launch.input_schema.get("properties", {}))
        self.assertTrue(launch.annotations.destructive_hint)
        for tool in tools.tools:
            self.assertNotIn(
                "external_data_approved",
                tool.input_schema.get("properties", {}),
            )
            self.assertNotIn("provider_id", tool.input_schema.get("properties", {}))
        self.assertTrue(forged_launch.is_error)
        self.assertFalse(launch.annotations.read_only_hint)
        self.assertEqual(
            {str(resource.uri) for resource in resources.resources},
            {
                "aiqt://capabilities",
                "aiqt://safety",
                "aiqt://strategy-research/capabilities",
                "aiqt://paper/status",
            },
        )
        self.assertEqual(
            {template.uri_template for template in templates.resource_templates},
            {
                "aiqt://research/runs/{run_id}",
                "aiqt://strategy-research/experiments/{experiment_id}",
                "aiqt://ai-reviews/{review_id}",
            },
        )

    async def test_system_status_and_market_context_use_fixed_api_routes(self) -> None:
        fixture = _ApiFixture()
        fixture.respond("GET", "/health", {"status": "ok", "service": "quant-core"})
        fixture.respond(
            "GET",
            "/api/execution/auto-paper-trading",
            {
                "state": {
                    "enabled": True,
                    "status": "monitoring",
                    "executionMode": "paper",
                    "market": "crypto",
                    "symbol": "BTC/USDT",
                    "timeframe": "1m",
                },
                "strategyBinding": {
                    "kind": "forward_trial",
                    "revision": "abc123",
                    "status": "ready",
                    "paperOnly": True,
                },
                "paperOnly": True,
                "sandboxOnly": False,
                "sandboxOrderSubmissionEnabled": False,
                "sandboxRouteExecuted": False,
                "liveTradingAllowed": False,
                "orderSubmissionEnabled": False,
                "routeExecuted": False,
                "liveBlockedBoundary": True,
            },
        )
        fixture.respond("GET", "/api/market/quotes", {"quotes": [{"price": 65000}]})
        fixture.respond("GET", "/api/market/klines", {"bars": [{"close": 65000}]})
        fixture.respond("GET", "/api/market/data-readiness", {"readiness": {"ready": True}})
        fixture.respond("GET", "/api/market/calendar", {"calendar": {"status": "open"}})

        client_context = await self._client(fixture)
        async with client_context as client:
            status = await client.call_tool("aiqt_get_system_status", {})
            market = await client.call_tool(
                "aiqt_read_market_context",
                {
                    "market": "crypto",
                    "symbol": "BTC/USDT",
                    "timeframe": "1m",
                    "limit": 160,
                    "include_calendar": True,
                },
            )

        self.assertFalse(status.is_error)
        self.assertEqual(status.structured_content["data"]["health"]["status"], "ok")
        self.assertTrue(status.structured_content["data"]["paper"]["available"])
        self.assertFalse(status.structured_content["boundary"]["liveTradingAllowed"])
        self.assertFalse(market.is_error)
        self.assertEqual(market.structured_content["data"]["klines"]["bars"][0]["close"], 65000)
        requested_paths = [httpx.URL(url).path for _method, url, _body in fixture.requests]
        self.assertEqual(
            requested_paths,
            [
                "/health",
                "/api/execution/auto-paper-trading",
                "/api/market/quotes",
                "/api/market/klines",
                "/api/market/data-readiness",
                "/api/market/calendar",
            ],
        )

    async def test_registered_research_derives_server_window_and_never_uploads_strategy(self) -> None:
        fixture = _ApiFixture()
        fixture.respond(
            "GET",
            "/api/strategy-research/capabilities",
            {
                "capabilities": [
                    {
                        "templateId": "regime-breakout-v2",
                        "market": "crypto",
                        "symbol": "BTC/USDT",
                        "timeframe": "1m",
                        "sealedData": {
                            "minimumRows": 142919,
                            "minimumPreRollRows": 13319,
                            "developmentScoringRows": 103680,
                            "withheldRows": 25920,
                        },
                    }
                ]
            },
        )
        fixture.respond(
            "POST",
            "/api/p0/pipeline",
            {
                "status": "audited_run_created",
                "runId": "run-1",
                "paperOnly": True,
                "liveTradingAllowed": False,
                "orderSubmitted": False,
                "routeExecuted": False,
            },
            status=201,
        )

        client_context = await self._client(fixture, writes=True)
        async with client_context as client:
            result = await client.call_tool(
                "aiqt_create_registered_research",
                {
                    "registered_template_id": "regime-breakout-v2",
                    "end_exclusive": "2026-08-10T00:00:00Z",
                },
            )

        self.assertFalse(result.is_error)
        method, _url, body = fixture.requests[-1]
        self.assertEqual(method, "POST")
        self.assertEqual(
            set(body or {}),
            {
                "market",
                "symbol",
                "timeframe",
                "registeredTemplateId",
                "sealedDataset",
            },
        )
        self.assertNotIn("strategyConfig", body or {})
        self.assertNotIn("assumptions", body or {})
        self.assertEqual(
            body["sealedDataset"],
            {
                "start": "2026-05-02T18:01:00+00:00",
                "developmentEndExclusive": "2026-07-23T00:00:00+00:00",
                "endExclusive": "2026-08-10T00:00:00+00:00",
            },
        )

    async def test_research_writes_are_disabled_by_default(self) -> None:
        fixture = _ApiFixture()
        client_context = await self._client(fixture)
        async with client_context as client:
            result = await client.call_tool(
                "aiqt_propose_strategy_research",
                {
                    "source_run_id": "run-1",
                    "goal": "find a robust registered strategy",
                },
            )

        self.assertTrue(result.is_error)
        self.assertIn("mcp_research_writes_disabled", result.content[0].text)
        self.assertEqual(fixture.requests, [])

    async def test_launch_injects_configured_operator_after_process_authorization(self) -> None:
        fixture = _ApiFixture()
        fixture.respond(
            "POST",
            "/api/strategy-research/launches",
            {"launch": {"experimentId": "experiment-1", "status": "pending"}},
            status=201,
        )
        client_context = await self._client(fixture, writes=True)
        async with client_context as client:
            launched = await client.call_tool(
                "aiqt_launch_strategy_research",
                {"proposal_id": "strategy-research-proposal-" + "a" * 24},
            )

        self.assertFalse(launched.is_error)
        self.assertEqual(len(fixture.requests), 1)
        self.assertEqual(
            fixture.requests[0][2],
            {
                "proposalId": "strategy-research-proposal-" + "a" * 24,
                "operator": "MCP Researcher",
                "confirmed": True,
            },
        )

    async def test_upstream_errors_are_safe_mcp_errors(self) -> None:
        fixture = _ApiFixture()
        fixture.respond(
            "GET",
            "/api/research/runs/missing",
            {
                "error": "research_run_not_found",
                "detail": (
                    "run does not exist; upstream=https://private.example/run?token=secret-token; "
                    "Authorization_Header=Bearer-private"
                ),
            },
            status=404,
        )
        client_context = await self._client(fixture)
        async with client_context as client:
            result = await client.call_tool(
                "aiqt_get_research_run",
                {"run_id": "missing"},
            )

        self.assertTrue(result.is_error)
        self.assertIn("research_run_not_found", result.content[0].text)
        self.assertNotIn("http://quant.test", result.content[0].text)
        self.assertNotIn("private.example", result.content[0].text)
        self.assertNotIn("secret-token", result.content[0].text)
        self.assertNotIn("Bearer-private", result.content[0].text)

    async def test_research_outputs_remove_secret_key_variants(self) -> None:
        fixture = _ApiFixture()
        fixture.respond(
            "GET",
            "/api/research/runs/run-1",
            {
                "run": {
                    "runId": "run-1",
                    "accessToken": "access-secret",
                    "authorization": "Bearer private",
                    "Authorization_Header": "Bearer private-header",
                    "apiKeyValue": "api-secret",
                    "credentials": "credential-secret",
                    "message": "Authorization: Bearer sk-real-secret",
                    "quoteWarning": "fetch failed: https://example.test/quote?symbol=X&token=VERYSECRET123",
                    "refreshWarning": "refresh_token=refresh-secret-value",
                    "clientWarning": "client_secret=client-secret-value",
                    "researchNote": {
                        "body": "OPENAI_API_KEY=sk-proj-private-note",
                    },
                    "nested": {
                        "privateKey": "private-secret",
                        "withheldBars": [{"close": 2}],
                        "safeDevelopmentHash": "safe-hash",
                    },
                }
            },
        )
        client_context = await self._client(fixture)
        async with client_context as client:
            result = await client.call_tool(
                "aiqt_get_research_run",
                {"run_id": "run-1"},
            )

        encoded = json.dumps(result.structured_content)
        self.assertNotIn("access-secret", encoded)
        self.assertNotIn("Bearer private", encoded)
        self.assertNotIn("private-header", encoded)
        self.assertNotIn("api-secret", encoded)
        self.assertNotIn("sk-real-secret", encoded)
        self.assertNotIn("VERYSECRET123", encoded)
        self.assertNotIn("refresh-secret-value", encoded)
        self.assertNotIn("client-secret-value", encoded)
        self.assertNotIn("sk-proj-private-note", encoded)
        self.assertNotIn("researchNote", encoded)
        self.assertNotIn("private-secret", encoded)
        self.assertNotIn("credential-secret", encoded)
        self.assertNotIn('"close": 2', encoded)
        self.assertIn("safe-hash", encoded)

    async def test_dot_segment_artifact_identifiers_are_rejected(self) -> None:
        fixture = _ApiFixture()
        api = QuantApiClient(
            _settings(),
            transport=httpx.MockTransport(fixture),
        )
        try:
            with self.assertRaisesRegex(QuantApiError, "mcp_identifier_invalid"):
                await api.get_ai_review("..")
        finally:
            await api.aclose()

        self.assertEqual(fixture.requests, [])

    async def test_research_resources_remove_inline_and_withheld_data(self) -> None:
        fixture = _ApiFixture()
        fixture.respond(
            "GET",
            "/api/research/runs/run-1",
            {
                "run": {
                    "runId": "run-1",
                    "metrics": {"totalReturnPct": 1.2},
                    "dataSnapshot": {
                        "bars": [{"close": 1}],
                        "testHash": "secret-test-hash",
                        "datasetHash": "secret-dataset-hash",
                        "canonicalHash": "safe-development-hash",
                    },
                }
            },
        )
        client_context = await self._client(fixture)
        async with client_context as client:
            result = await client.read_resource("aiqt://research/runs/run-1")

        payload = json.loads(result.contents[0].text)
        self.assertEqual(payload["schemaVersion"], "aiqt.mcp.v1")
        self.assertTrue(payload["boundary"]["researchOnly"])
        snapshot = payload["data"]["run"]["dataSnapshot"]
        self.assertEqual(snapshot, {"canonicalHash": "safe-development-hash"})

    async def test_every_api_backed_resource_uses_the_research_envelope(self) -> None:
        fixture = _ApiFixture()
        fixture.respond("GET", "/api/strategy-research/capabilities", {"capabilities": []})
        fixture.respond(
            "GET",
            "/api/execution/auto-paper-trading",
            {"state": {"executionMode": "live"}},
        )
        fixture.respond("GET", "/api/strategy-research/experiments/experiment-1", {"experiment": {}})
        fixture.respond("GET", "/api/ai-reviews/review-1", {"review": {}})
        client_context = await self._client(fixture)
        async with client_context as client:
            resources = [
                await client.read_resource("aiqt://strategy-research/capabilities"),
                await client.read_resource("aiqt://paper/status"),
                await client.read_resource("aiqt://strategy-research/experiments/experiment-1"),
                await client.read_resource("aiqt://ai-reviews/review-1"),
            ]

        for result in resources:
            payload = json.loads(result.contents[0].text)
            self.assertEqual(payload["schemaVersion"], "aiqt.mcp.v1")
            self.assertEqual(payload["status"], "completed")
            self.assertTrue(payload["boundary"]["researchOnly"])

    async def test_selection_and_audit_keep_research_boundary(self) -> None:
        fixture = _ApiFixture()
        fixture.respond(
            "POST",
            "/api/market/ai-selections",
            {
                "selectionId": "selection-1",
                "boundary": {
                    "researchOnly": True,
                    "orderSubmissionAllowed": False,
                    "routeExecuted": False,
                },
            },
            status=201,
        )
        fixture.respond(
            "GET",
            "/api/audit/events",
            {"events": [{"eventType": "strategy_research_proposal"}]},
        )
        client_context = await self._client(fixture, writes=True)
        async with client_context as client:
            selection = await client.call_tool(
                "aiqt_select_research_candidates",
                {
                    "market": "crypto",
                    "profile": "trend",
                    "horizon": "medium",
                },
            )
            audit = await client.call_tool(
                "aiqt_list_research_audit_events",
                {"event_type": "strategy_research_proposal"},
            )
            forbidden = await client.call_tool(
                "aiqt_list_research_audit_events",
                {"event_type": "stage10_production_execution_attempt"},
            )

        self.assertFalse(selection.is_error)
        self.assertFalse(audit.is_error)
        self.assertTrue(forbidden.is_error)
        self.assertEqual(
            fixture.requests[0][2],
            {
                "market": "crypto",
                "universeMode": "discovery",
                "discovery": {
                    "query": "",
                    "minChangePct": None,
                    "maxChangePct": None,
                    "minAmount": None,
                    "minTurnoverRate": None,
                    "maxPe": None,
                    "sort": "changePct",
                    "direction": "desc",
                },
                "profile": "trend",
                "horizon": "medium",
                "providerId": "local",
                "externalDataApproved": False,
            },
        )
        self.assertEqual(len(fixture.requests), 2)

    async def test_untrusted_paper_runtime_fails_closed_without_live_details(self) -> None:
        fixture = _ApiFixture()
        fixture.respond(
            "GET",
            "/api/execution/auto-paper-trading",
            {
                "state": {
                    "executionMode": "live",
                    "lastLiveOrder": {"id": "private-order"},
                },
                "paperOnly": False,
                "liveTradingAllowed": True,
                "orderSubmissionEnabled": True,
                "routeExecuted": True,
                "liveBlockedBoundary": False,
            },
        )
        client_context = await self._client(fixture)
        async with client_context as client:
            result = await client.call_tool("aiqt_get_paper_status", {})

        self.assertFalse(result.is_error)
        self.assertEqual(
            result.structured_content["data"],
            {
                "available": False,
                "status": "unavailable",
                "reason": "paper_runtime_boundary_untrusted",
            },
        )
        self.assertNotIn("private-order", json.dumps(result.structured_content))

    async def test_paper_runtime_with_non_paper_binding_fails_closed(self) -> None:
        fixture = _ApiFixture()
        fixture.respond(
            "GET",
            "/api/execution/auto-paper-trading",
            {
                "state": {"enabled": False, "executionMode": "paper"},
                "strategyBinding": {"kind": "library", "paperOnly": False},
                "paperOnly": True,
                "sandboxOnly": False,
                "sandboxOrderSubmissionEnabled": False,
                "sandboxRouteExecuted": False,
                "liveTradingAllowed": False,
                "orderSubmissionEnabled": False,
                "routeExecuted": False,
                "liveBlockedBoundary": True,
            },
        )
        client_context = await self._client(fixture)
        async with client_context as client:
            result = await client.call_tool("aiqt_get_paper_status", {})

        self.assertFalse(result.structured_content["data"]["available"])

    async def test_streamable_http_rejects_forged_host_and_origin(self) -> None:
        settings = replace(
            _settings(),
            transport="streamable-http",
            host="0.0.0.0",
        )
        server = create_mcp_server(settings=settings)
        app = server.streamable_http_app(
            host=settings.host,
            streamable_http_path="/mcp",
            transport_security=transport_security_settings(),
        )
        transport = httpx.ASGITransport(app=app)
        async with app.router.lifespan_context(app):
            async with httpx.AsyncClient(
                transport=transport,
                base_url="http://127.0.0.1:8766",
            ) as client:
                forged_host = await client.post(
                    "/mcp",
                    headers={"Host": "evil.example:8766"},
                    json={},
                )
                forged_origin = await client.post(
                    "/mcp",
                    headers={
                        "Host": "127.0.0.1:8766",
                        "Origin": "http://evil.example",
                    },
                    json={},
                )

        self.assertEqual(forged_host.status_code, 421)
        self.assertEqual(forged_origin.status_code, 403)

    async def test_stdio_entrypoint_is_discoverable_by_a_real_client(self) -> None:
        root = Path(__file__).resolve().parents[3]
        params = StdioServerParameters(
            command=str(root / ".venv" / "bin" / "python"),
            args=[str(root / "tools" / "run_quant_mcp.py")],
            env={
                **os.environ,
                "PYTHONPATH": f"{root}:{root / 'services' / 'quant_core'}",
                "AIQT_MCP_API_BASE_URL": "http://127.0.0.1:9",
                "AIQT_MCP_ENABLE_RESEARCH_WRITES": "false",
            },
        )
        async with Client(stdio_client(params)) as client:
            tools = await client.list_tools()
            safety = await client.read_resource("aiqt://safety")

        self.assertIn("aiqt_read_market_context", {tool.name for tool in tools.tools})
        self.assertFalse(json.loads(safety.contents[0].text)["boundary"]["liveTradingAllowed"])


class McpServiceSettingsTest(unittest.TestCase):
    def test_environment_defaults_are_loopback_and_read_only(self) -> None:
        settings = McpServiceSettings.from_environment({})

        self.assertEqual(settings.api_base_url, "http://127.0.0.1:8765")
        self.assertEqual(settings.transport, "stdio")
        self.assertEqual(settings.host, "127.0.0.1")
        self.assertFalse(settings.research_writes_enabled)

    def test_environment_rejects_credential_urls_and_header_injection(self) -> None:
        with self.assertRaisesRegex(ValueError, "mcp_api_base_url_invalid"):
            McpServiceSettings.from_environment(
                {"AIQT_MCP_API_BASE_URL": "https://user:pass@example.com"}
            )
        with self.assertRaisesRegex(ValueError, "mcp_api_header_invalid"):
            McpServiceSettings.from_environment(
                {"AIQT_MCP_API_COOKIE": "safe\r\nX-Forged: true"}
            )

    def test_non_loopback_http_requires_explicit_controlled_network_opt_in(self) -> None:
        with self.assertRaisesRegex(ValueError, "mcp_non_loopback_http_forbidden"):
            McpServiceSettings.from_environment(
                {
                    "AIQT_MCP_TRANSPORT": "streamable-http",
                    "AIQT_MCP_HOST": "0.0.0.0",
                }
            )

        settings = McpServiceSettings.from_environment(
            {
                "AIQT_MCP_TRANSPORT": "streamable-http",
                "AIQT_MCP_HOST": "0.0.0.0",
                "AIQT_MCP_ALLOW_NON_LOOPBACK_HTTP": "true",
            }
        )

        self.assertEqual(settings.host, "0.0.0.0")


if __name__ == "__main__":
    unittest.main()
