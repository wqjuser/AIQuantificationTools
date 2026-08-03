from __future__ import annotations

import ipaddress
from http.client import HTTPSConnection
import ssl
import socket
from typing import Callable, Iterable
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import Request


class OutboundUrlError(ValueError):
    pass


def validate_user_outbound_url(
    url: str,
    allowed_origins: Iterable[str],
    *,
    resolver: Callable = socket.getaddrinfo,
) -> str:
    _validated_target(url, allowed_origins, resolver=resolver)
    return url


def _validated_target(
    url: str,
    allowed_origins: Iterable[str],
    *,
    resolver: Callable,
) -> tuple[str, int, tuple[str, ...]]:
    if len(url) > 2_048:
        raise OutboundUrlError("url_too_long")
    parsed = urlparse(url)
    if parsed.scheme != "https":
        raise OutboundUrlError("https_required")
    if not parsed.hostname or parsed.username is not None or parsed.password is not None or parsed.fragment:
        raise OutboundUrlError("url_invalid")
    try:
        port = parsed.port or 443
    except ValueError as error:
        raise OutboundUrlError("url_invalid") from error
    allowed = {_origin(value) for value in allowed_origins}
    if _origin(url) not in allowed:
        raise OutboundUrlError("origin_not_allowed")
    try:
        addresses = resolver(parsed.hostname, port, type=socket.SOCK_STREAM)
    except OSError as error:
        raise OutboundUrlError("dns_resolution_failed") from error
    if not addresses:
        raise OutboundUrlError("dns_resolution_failed")
    resolved = tuple(sorted({item[4][0].split("%", 1)[0] for item in addresses}))
    for address in resolved:
        try:
            parsed_address = ipaddress.ip_address(address)
        except ValueError as error:
            raise OutboundUrlError("dns_address_invalid") from error
        if not parsed_address.is_global:
            raise OutboundUrlError("address_not_public")
    return parsed.hostname, port, resolved


class _PinnedHttpsConnection(HTTPSConnection):
    def __init__(self, hostname: str, address: str, port: int, timeout: float):
        super().__init__(
            hostname,
            port=port,
            timeout=timeout,
            context=ssl.create_default_context(),
        )
        self._validated_address = address

    def connect(self) -> None:
        self.sock = socket.create_connection(
            (self._validated_address, self.port),
            self.timeout,
            self.source_address,
        )
        self.sock = self._context.wrap_socket(self.sock, server_hostname=self.host)


class _PinnedResponse:
    def __init__(self, response, connection: HTTPSConnection):
        self._response = response
        self._connection = connection

    def __getattr__(self, name):
        return getattr(self._response, name)

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        self.close()

    def close(self) -> None:
        self._response.close()
        self._connection.close()


def open_user_outbound_request(
    request: Request,
    allowed_origins: Iterable[str],
    *,
    timeout: float,
    resolver: Callable = socket.getaddrinfo,
):
    hostname, port, addresses = _validated_target(
        request.full_url,
        allowed_origins,
        resolver=resolver,
    )
    parsed = urlparse(request.full_url)
    path = parsed.path or "/"
    if parsed.query:
        path += f"?{parsed.query}"
    last_error: OSError | None = None
    for address in addresses:
        connection = _PinnedHttpsConnection(hostname, address, port, timeout)
        try:
            connection.request(
                request.get_method(),
                path,
                body=request.data,
                headers=dict(request.header_items()),
            )
            response = _PinnedResponse(connection.getresponse(), connection)
        except OSError as error:
            connection.close()
            last_error = error
            continue
        if 300 <= response.status:
            raise HTTPError(
                request.full_url,
                response.status,
                response.reason,
                response.headers,
                response,
            )
        return response
    raise last_error or OutboundUrlError("connection_failed")


def _origin(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname:
        return ""
    try:
        port = parsed.port
    except ValueError:
        return ""
    suffix = f":{port}" if port and port != 443 else ""
    return f"https://{parsed.hostname.lower()}{suffix}"
