from __future__ import annotations

import unittest

from quant_core.sec_edgar import is_valid_sec_edgar_user_agent


class SecEdgarUserAgentTests(unittest.TestCase):
    def test_requires_bounded_contact_information_without_control_characters(self) -> None:
        for value in (
            "AIQT ops@example.com",
            "AIQT ops@example.test",
            "AIQT https://example.com/contact",
            "  AIQT ops@example.com  ",
        ):
            with self.subTest(value=value):
                self.assertTrue(is_valid_sec_edgar_user_agent(value))

        for value in (
            "",
            "AIQT contact@example",
            "AIQT http://localhost",
            "AI量化 ops@example.com",
            "AIQT ops@example.com\rInjected: value",
            "AIQT ops@example.com\nInjected: value",
            "x" * 256 + "@example.com",
        ):
            with self.subTest(value=value):
                self.assertFalse(is_valid_sec_edgar_user_agent(value))


if __name__ == "__main__":
    unittest.main()
