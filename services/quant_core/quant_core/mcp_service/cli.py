from __future__ import annotations

import os
from urllib.parse import urlparse

from mcp.server.transport_security import TransportSecuritySettings
from sqlalchemy import create_engine

from quant_core.deployment import load_deployment_config, load_public_resource_config

from .config import McpServiceSettings
from .public import PublicMcpAuthConfig, create_public_mcp_server
from .server import create_mcp_server


def transport_security_settings(
    public_auth: PublicMcpAuthConfig | None = None,
) -> TransportSecuritySettings:
    if public_auth is not None:
        parsed = urlparse(public_auth.resource_url)
        hostname = str(parsed.hostname or "")
        if not hostname:
            raise ValueError("mcp_oauth_resource_invalid")
        origin = f"{parsed.scheme}://{parsed.netloc}"
        hosts = [parsed.netloc]
        if parsed.port is None:
            hosts.append(f"{hostname}:443")
        return TransportSecuritySettings(
            enable_dns_rebinding_protection=True,
            allowed_hosts=hosts,
            allowed_origins=[origin],
        )
    return TransportSecuritySettings(
        enable_dns_rebinding_protection=True,
        allowed_hosts=["127.0.0.1:*", "localhost:*", "[::1]:*"],
        allowed_origins=[
            "http://127.0.0.1:*",
            "http://localhost:*",
            "http://[::1]:*",
        ],
    )


def run() -> None:
    settings = McpServiceSettings.from_environment()
    deployment = (
        load_public_resource_config(os.environ)
        if str(os.environ.get("AIQT_DEPLOYMENT_MODE", "local")).strip().lower()
        == "public"
        else load_deployment_config(os.environ)
    )
    public_auth: PublicMcpAuthConfig | None = None
    engine = None
    if deployment.mode == "public":
        if settings.transport != "streamable-http":
            raise ValueError("mcp_public_transport_invalid")
        public_auth = PublicMcpAuthConfig.from_environment(deployment, os.environ)
        engine = create_engine(deployment.database_url or "", pool_pre_ping=True)
        server = create_public_mcp_server(
            settings=settings,
            deployment=deployment,
            engine=engine,
            auth_config=public_auth,
        )
    else:
        server = create_mcp_server(settings=settings)
    if settings.transport == "stdio":
        server.run(transport="stdio")
        return
    try:
        server.run(
            transport="streamable-http",
            host=settings.host,
            port=settings.port,
            streamable_http_path="/mcp",
            stateless_http=public_auth is not None,
            transport_security=transport_security_settings(public_auth),
        )
    finally:
        if engine is not None:
            engine.dispose()


if __name__ == "__main__":
    run()
