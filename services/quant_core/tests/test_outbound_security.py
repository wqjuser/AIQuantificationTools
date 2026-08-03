from __future__ import annotations

import socket
import unittest
from io import BytesIO
from unittest.mock import patch

from urllib.error import HTTPError
from urllib.request import Request

from quant_core.outbound_security import (
    OutboundUrlError,
    open_user_outbound_request,
    validate_user_outbound_url,
)


def resolve_to(address: str):
    def resolver(host, port, *args, **kwargs):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (address, port))]

    return resolver


class OutboundSecurityTest(unittest.TestCase):
    def test_user_url_requires_allowlisted_https_origin_and_public_dns(self) -> None:
        allowed = {"https://api.example.com"}

        self.assertEqual(
            validate_user_outbound_url(
                "https://api.example.com/v1",
                allowed,
                resolver=resolve_to("93.184.216.34"),
            ),
            "https://api.example.com/v1",
        )
        blocked = (
            ("http://api.example.com/v1", "https_required", "93.184.216.34"),
            ("https://other.example.com/v1", "origin_not_allowed", "93.184.216.34"),
            ("https://api.example.com/v1", "address_not_public", "127.0.0.1"),
            ("https://api.example.com/v1", "address_not_public", "10.0.0.2"),
            ("https://api.example.com/v1", "address_not_public", "169.254.169.254"),
        )
        for url, error, address in blocked:
            with self.subTest(url=url, address=address), self.assertRaisesRegex(OutboundUrlError, error):
                validate_user_outbound_url(url, allowed, resolver=resolve_to(address))

    def test_request_uses_validated_ip_and_does_not_follow_redirects(self) -> None:
        class FakeSocket:
            def __init__(self):
                self.sent = b""

            def sendall(self, data):
                self.sent += data

            def makefile(self, *_args, **_kwargs):
                return BytesIO(
                    b"HTTP/1.1 302 Found\r\n"
                    b"Location: https://metadata.example/latest\r\n"
                    b"Content-Length: 0\r\n\r\n"
                )

            def close(self):
                return None

        fake_socket = FakeSocket()
        server_names = []

        class FakeContext:
            def wrap_socket(self, connection, *, server_hostname):
                server_names.append(server_hostname)
                return connection

        with patch(
            "quant_core.outbound_security.socket.create_connection",
            return_value=fake_socket,
        ) as connect, patch(
            "quant_core.outbound_security.ssl.create_default_context",
            return_value=FakeContext(),
        ), self.assertRaises(HTTPError) as raised:
            open_user_outbound_request(
                Request("https://api.example.com/v1"),
                {"https://api.example.com"},
                timeout=1,
                resolver=resolve_to("93.184.216.34"),
            )

        self.assertEqual(raised.exception.code, 302)
        raised.exception.close()
        connect.assert_called_once_with(("93.184.216.34", 443), 1, None)
        self.assertEqual(server_names, ["api.example.com"])

    def test_urllib_request_is_validated_before_credentials_are_sent(self) -> None:
        request = Request(
            "https://api.example.com/v1/chat/completions",
            headers={"Authorization": "Bearer secret"},
        )
        with self.assertRaisesRegex(OutboundUrlError, "address_not_public"):
            open_user_outbound_request(
                request,
                {"https://api.example.com"},
                timeout=1,
                resolver=resolve_to("127.0.0.1"),
            )


if __name__ == "__main__":
    unittest.main()
