from __future__ import annotations

from contextlib import asynccontextmanager
import json
import re
from typing import Any, Literal

from mcp import types
from mcp.server import MCPServer
from mcp.server.mcpserver.exceptions import ResourceError, ToolError

from .api_client import QuantApiClient, QuantApiError
from .config import McpServiceSettings


SCHEMA_VERSION = "aiqt.mcp.v1"
SERVICE_BOUNDARY: dict[str, object] = {
    "researchOnly": True,
    "paperStatusReadOnly": True,
    "promotionEnabled": False,
    "strategyBindingEnabled": False,
    "autoTradingControlEnabled": False,
    "testnetTradingAllowed": False,
    "liveTradingAllowed": False,
    "orderSubmissionAllowed": False,
    "routeExecuted": False,
}
_PROPOSAL_ID = re.compile(r"^strategy-research-proposal-[a-f0-9]{24}$")


def create_mcp_server(
    *,
    settings: McpServiceSettings,
    api: QuantApiClient | None = None,
) -> MCPServer:
    gateway = api or QuantApiClient(settings)

    @asynccontextmanager
    async def lifespan(_server: MCPServer):
        try:
            yield None
        finally:
            await gateway.aclose()

    server = MCPServer(
        name="ai-quantification-tools",
        title="AI Quantification Tools",
        version="1.0.0",
        description="Auditable quantitative market and strategy research MCP service.",
        instructions=(
            "Use these tools for market and strategy research only. Results are not investment "
            "advice or profit guarantees. This server cannot promote, bind, enable, route, or "
            "submit Testnet or Live orders. Research write tools may be disabled by the operator."
        ),
        lifespan=lifespan,
    )

    read_annotations = types.ToolAnnotations(
        readOnlyHint=True,
        destructiveHint=False,
        idempotentHint=True,
        openWorldHint=True,
    )
    research_write_annotations = types.ToolAnnotations(
        readOnlyHint=False,
        destructiveHint=False,
        idempotentHint=False,
        openWorldHint=True,
    )
    launch_annotations = types.ToolAnnotations(
        readOnlyHint=False,
        destructiveHint=True,
        idempotentHint=True,
        openWorldHint=False,
    )

    @server.tool(
        description="Check Quant Core health and return a fail-closed Paper runtime projection.",
        annotations=read_annotations,
    )
    async def aiqt_get_system_status() -> dict[str, Any]:
        try:
            return _completed(
                {
                    "health": await gateway.health(),
                    "paper": await gateway.paper_status(),
                }
            )
        except QuantApiError as error:
            _raise_tool_error(error)

    @server.tool(
        description="Search server-owned instrument data without starting research or trading.",
        annotations=read_annotations,
    )
    async def aiqt_search_instruments(
        market: Literal["ashare", "crypto", "us"],
        query: str,
        limit: int = 8,
        timeframe: str = "1d",
    ) -> dict[str, Any]:
        _bounded_text(query, "query", maximum=64, allow_empty=False)
        _bounded_text(timeframe, "timeframe", maximum=16, allow_empty=False)
        _bounded_integer(limit, "limit", 1, 20)
        try:
            return _completed(
                await gateway.search_instruments(
                    market=market,
                    query=query,
                    limit=limit,
                    timeframe=timeframe,
                )
            )
        except QuantApiError as error:
            _raise_tool_error(error)

    @server.tool(
        description=(
            "Read quotes, completed OHLCV bars, data readiness, and optionally the market calendar. "
            "This never submits an order."
        ),
        annotations=read_annotations,
    )
    async def aiqt_read_market_context(
        market: Literal["ashare", "crypto", "us"],
        symbol: str,
        timeframe: str,
        limit: int = 160,
        end: str | None = None,
        include_calendar: bool = False,
    ) -> dict[str, Any]:
        _bounded_text(symbol, "symbol", maximum=64, allow_empty=False)
        _bounded_text(timeframe, "timeframe", maximum=16, allow_empty=False)
        _bounded_integer(limit, "limit", 1, 500)
        if end is not None:
            _bounded_text(end, "end", maximum=64, allow_empty=False)
        try:
            return _completed(
                await gateway.market_context(
                    market=market,
                    symbol=symbol,
                    timeframe=timeframe,
                    limit=limit,
                    end=end,
                    include_calendar=include_calendar,
                )
            )
        except QuantApiError as error:
            _raise_tool_error(error)

    @server.tool(
        description=(
            "Rank server-discovered research candidates. This creates research-only audit evidence, "
            "does not modify a watchlist, start research, or trade."
        ),
        annotations=research_write_annotations,
    )
    async def aiqt_select_research_candidates(
        market: Literal["ashare", "crypto", "us"],
        profile: Literal["balanced", "quality_growth", "value", "trend"],
        horizon: Literal["short", "medium", "long"],
        query: str = "",
        min_change_pct: float | None = None,
        max_change_pct: float | None = None,
        min_amount: float | None = None,
        min_turnover_rate: float | None = None,
        max_pe: float | None = None,
        sort: str = "changePct",
        direction: Literal["asc", "desc"] = "desc",
    ) -> dict[str, Any]:
        _require_writes(settings)
        discovery = {
            "query": query,
            "minChangePct": min_change_pct,
            "maxChangePct": max_change_pct,
            "minAmount": min_amount,
            "minTurnoverRate": min_turnover_rate,
            "maxPe": max_pe,
            "sort": sort,
            "direction": direction,
        } if market != "us" else {}
        payload = {
            "market": market,
            "universeMode": "watchlist" if market == "us" else "discovery",
            "discovery": discovery,
            "profile": profile,
            "horizon": horizon,
            "providerId": "local",
            "externalDataApproved": False,
        }
        try:
            return _completed(await gateway.select_research_candidates(payload))
        except QuantApiError as error:
            _raise_tool_error(error)

    @server.tool(
        description="List recent auditable research runs without inline K-line bars.",
        annotations=read_annotations,
    )
    async def aiqt_list_research_runs(limit: int = 10) -> dict[str, Any]:
        _bounded_integer(limit, "limit", 1, 100)
        try:
            return _completed(await gateway.list_research_runs(limit=limit))
        except QuantApiError as error:
            _raise_tool_error(error)

    @server.tool(
        description="Read one auditable research run with sensitive and inline market data removed.",
        annotations=read_annotations,
    )
    async def aiqt_get_research_run(run_id: str) -> dict[str, Any]:
        try:
            return _completed(await gateway.get_research_run(run_id))
        except QuantApiError as error:
            _raise_tool_error(error)

    @server.tool(
        description=(
            "Create a sealed P0 research run from a server-registered strategy template. "
            "The server derives the full data window and fixed cost assumptions; no strategy, bars, "
            "returns, or risk fields are accepted. Requires operator-enabled MCP research writes."
        ),
        annotations=research_write_annotations,
    )
    async def aiqt_create_registered_research(
        registered_template_id: str,
        end_exclusive: str | None = None,
    ) -> dict[str, Any]:
        _require_writes(settings)
        _bounded_text(
            registered_template_id,
            "registered_template_id",
            maximum=128,
            allow_empty=False,
        )
        try:
            return _completed(
                await gateway.create_registered_research(
                    registered_template_id=registered_template_id,
                    end_exclusive=end_exclusive,
                )
            )
        except QuantApiError as error:
            _raise_tool_error(error)

    @server.tool(
        description=(
            "Ask the server-owned registered-template orchestrator to create an auditable strategy "
            "research proposal. This does not launch an experiment."
        ),
        annotations=research_write_annotations,
    )
    async def aiqt_propose_strategy_research(
        source_run_id: str,
        goal: str,
    ) -> dict[str, Any]:
        _require_writes(settings)
        _bounded_text(goal, "goal", minimum=4, maximum=1000, allow_empty=False)
        try:
            return _completed(
                await gateway.propose_strategy_research(
                    {
                        "sourceRunId": source_run_id,
                        "goal": goal,
                        "providerId": "local",
                        "externalDataApproved": False,
                    }
                )
            )
        except QuantApiError as error:
            _raise_tool_error(error)

    @server.tool(
        description=(
            "Launch the formal experiment for one persisted strategy research proposal. "
            "Requires the operator-enabled MCP write process and a configured operator. "
            "It does not promote, bind, enable, or trade the result."
        ),
        annotations=launch_annotations,
    )
    async def aiqt_launch_strategy_research(
        proposal_id: str,
    ) -> dict[str, Any]:
        _require_writes(settings)
        if not _PROPOSAL_ID.fullmatch(proposal_id):
            _raise_local_error(
                "mcp_proposal_id_invalid",
                "The proposal identifier is invalid.",
            )
        if not settings.operator:
            _raise_local_error(
                "mcp_operator_required",
                "AIQT_MCP_OPERATOR is required to launch strategy research.",
            )
        try:
            return _completed(
                await gateway.launch_strategy_research(
                    {
                        "proposalId": proposal_id,
                        "operator": settings.operator,
                        "confirmed": True,
                    }
                )
            )
        except QuantApiError as error:
            _raise_tool_error(error)

    @server.tool(
        description=(
            "Read the aggregate state of a strategy research experiment, including proposal, formal "
            "gate, review, library, and fail-closed Paper projections."
        ),
        annotations=read_annotations,
    )
    async def aiqt_get_strategy_research(experiment_id: str) -> dict[str, Any]:
        try:
            return _completed(await gateway.get_strategy_research(experiment_id))
        except QuantApiError as error:
            _raise_tool_error(error)

    @server.tool(
        description=(
            "Create an evidence-bound local AI review for a completed formal experiment. "
            "This cannot accept or promote its own review."
        ),
        annotations=research_write_annotations,
    )
    async def aiqt_create_ai_review(
        primary_experiment_id: str,
        comparison_experiment_ids: list[str] | None = None,
    ) -> dict[str, Any]:
        _require_writes(settings)
        comparisons = comparison_experiment_ids or []
        if len(comparisons) > 10 or len(set(comparisons)) != len(comparisons):
            _raise_local_error(
                "mcp_ai_review_comparisons_invalid",
                "Comparison experiment identifiers are invalid.",
            )
        try:
            return _completed(
                await gateway.create_ai_review(
                    {
                        "primaryExperimentId": primary_experiment_id,
                        "comparisonExperimentIds": comparisons,
                        "providerId": "local",
                        "externalDataApproved": False,
                    }
                )
            )
        except QuantApiError as error:
            _raise_tool_error(error)

    @server.tool(
        description="Read a fail-closed, redacted Paper runtime status. No control action is exposed.",
        annotations=read_annotations,
    )
    async def aiqt_get_paper_status() -> dict[str, Any]:
        try:
            return _completed(await gateway.paper_status())
        except QuantApiError as error:
            _raise_tool_error(error)

    @server.tool(
        description=(
            "List allowlisted research audit events only. Execution, secret, authorization, and "
            "production event namespaces are forbidden."
        ),
        annotations=read_annotations,
    )
    async def aiqt_list_research_audit_events(
        event_type: str,
        run_id: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> dict[str, Any]:
        _bounded_integer(limit, "limit", 1, 100)
        _bounded_integer(offset, "offset", 0, 100_000)
        try:
            return _completed(
                await gateway.list_research_audit_events(
                    event_type=event_type,
                    run_id=run_id,
                    limit=limit,
                    offset=offset,
                )
            )
        except QuantApiError as error:
            _raise_tool_error(error)

    @server.resource(
        "aiqt://capabilities",
        name="AIQT MCP capabilities",
        description="Stable MCP feature and safety capability manifest.",
        mime_type="application/json",
    )
    def capabilities_resource() -> str:
        return _json(
            {
                "schemaVersion": SCHEMA_VERSION,
                "service": "AI Quantification Tools",
                "domains": [
                    "market-data",
                    "ai-candidate-research",
                    "sealed-p0-research",
                    "strategy-research",
                    "formal-experiments",
                    "ai-review",
                    "research-audit",
                    "paper-status",
                ],
                "researchWritesEnabled": settings.research_writes_enabled,
                "transports": ["stdio", "streamable-http"],
                "boundary": SERVICE_BOUNDARY,
            }
        )

    @server.resource(
        "aiqt://safety",
        name="AIQT MCP safety boundary",
        description="Operations intentionally unavailable through MCP.",
        mime_type="application/json",
    )
    def safety_resource() -> str:
        return _json(
            {
                "schemaVersion": SCHEMA_VERSION,
                "boundary": SERVICE_BOUNDARY,
                "unavailableOperations": [
                    "strategy-promotion",
                    "strategy-binding",
                    "auto-trading-control",
                    "paper-evaluation",
                    "paper-reconciliation",
                    "testnet-trading",
                    "live-trading",
                    "order-submission",
                    "secret-management",
                    "audit-event-write",
                    "stage6-through-stage10",
                ],
                "disclaimer": "Research output is not investment advice or a profit guarantee.",
            }
        )

    @server.resource(
        "aiqt://strategy-research/capabilities",
        name="Registered strategy research capabilities",
        description="Server-owned templates, data requirements, and bounded parameter schemas.",
        mime_type="application/json",
    )
    async def strategy_research_capabilities_resource() -> str:
        try:
            return _json(_completed(await gateway.strategy_research_capabilities()))
        except QuantApiError as error:
            raise ResourceError(_error_json(error)) from error

    @server.resource(
        "aiqt://paper/status",
        name="Safe Paper status",
        description="Fail-closed Paper runtime projection without control capabilities.",
        mime_type="application/json",
    )
    async def paper_status_resource() -> str:
        try:
            return _json(_completed(await gateway.paper_status()))
        except QuantApiError as error:
            raise ResourceError(_error_json(error)) from error

    @server.resource(
        "aiqt://research/runs/{run_id}",
        name="Research run",
        description="One auditable research run with inline bars and sensitive fields removed.",
        mime_type="application/json",
    )
    async def research_run_resource(run_id: str) -> str:
        try:
            return _json(_completed(await gateway.get_research_run(run_id)))
        except QuantApiError as error:
            raise ResourceError(_error_json(error)) from error

    @server.resource(
        "aiqt://strategy-research/experiments/{experiment_id}",
        name="Strategy research aggregate",
        description="Aggregate proposal, experiment, review, library, and Paper state.",
        mime_type="application/json",
    )
    async def strategy_research_resource(experiment_id: str) -> str:
        try:
            return _json(_completed(await gateway.get_strategy_research(experiment_id)))
        except QuantApiError as error:
            raise ResourceError(_error_json(error)) from error

    @server.resource(
        "aiqt://ai-reviews/{review_id}",
        name="AI review",
        description="One evidence-bound AI review.",
        mime_type="application/json",
    )
    async def ai_review_resource(review_id: str) -> str:
        try:
            return _json(_completed(await gateway.get_ai_review(review_id)))
        except QuantApiError as error:
            raise ResourceError(_error_json(error)) from error

    return server


def _completed(data: object) -> dict[str, Any]:
    return {
        "schemaVersion": SCHEMA_VERSION,
        "status": "completed",
        "data": data,
        "boundary": dict(SERVICE_BOUNDARY),
    }


def _require_writes(settings: McpServiceSettings) -> None:
    if not settings.research_writes_enabled:
        _raise_local_error(
            "mcp_research_writes_disabled",
            "Set AIQT_MCP_ENABLE_RESEARCH_WRITES=true to allow research-only writes.",
        )


def _bounded_text(
    value: object,
    field: str,
    *,
    minimum: int = 0,
    maximum: int,
    allow_empty: bool,
) -> None:
    if not isinstance(value, str) or value.strip() != value:
        _raise_local_error("mcp_argument_invalid", f"{field} is invalid.")
    if (not allow_empty and not value) or len(value) < minimum or len(value) > maximum:
        _raise_local_error("mcp_argument_invalid", f"{field} is invalid.")


def _bounded_integer(value: object, field: str, minimum: int, maximum: int) -> None:
    if isinstance(value, bool) or not isinstance(value, int) or not minimum <= value <= maximum:
        _raise_local_error("mcp_argument_invalid", f"{field} is invalid.")


def _raise_local_error(code: str, detail: str) -> None:
    raise ToolError(
        _json(
            {
                "schemaVersion": SCHEMA_VERSION,
                "status": "blocked",
                "error": {
                    "code": code,
                    "detail": detail,
                    "retryable": False,
                },
                "boundary": SERVICE_BOUNDARY,
            }
        )
    )


def _raise_tool_error(error: QuantApiError) -> None:
    raise ToolError(_error_json(error)) from error


def _error_json(error: QuantApiError) -> str:
    return _json(
        {
            "schemaVersion": SCHEMA_VERSION,
            "status": "blocked",
            "error": {
                "code": error.code,
                "detail": error.detail,
                "retryable": error.retryable,
            },
            "boundary": SERVICE_BOUNDARY,
        }
    )


def _json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
