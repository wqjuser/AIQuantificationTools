from __future__ import annotations

from mcp.server.transport_security import TransportSecuritySettings

from .config import McpServiceSettings
from .server import create_mcp_server


def transport_security_settings() -> TransportSecuritySettings:
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
    server = create_mcp_server(settings=settings)
    if settings.transport == "stdio":
        server.run(transport="stdio")
        return
    server.run(
        transport="streamable-http",
        host=settings.host,
        port=settings.port,
        streamable_http_path="/mcp",
        transport_security=transport_security_settings(),
    )


if __name__ == "__main__":
    run()
