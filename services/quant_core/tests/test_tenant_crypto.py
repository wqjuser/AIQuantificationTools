from __future__ import annotations

import base64
import unittest

from cryptography.exceptions import InvalidTag

from quant_core.tenant_crypto import TenantSecretCipher


class TenantSecretCipherTest(unittest.TestCase):
    def test_ciphertext_is_bound_to_owner_setting_and_key_version(self) -> None:
        cipher = TenantSecretCipher(base64.urlsafe_b64encode(b"m" * 32).decode())
        encrypted = cipher.encrypt("owner-a", "openai-api-key", "secret", key_version=1)

        self.assertNotIn(b"secret", encrypted)
        self.assertEqual(
            cipher.decrypt("owner-a", "openai-api-key", encrypted, key_version=1),
            "secret",
        )
        for owner, setting, version in (
            ("owner-b", "openai-api-key", 1),
            ("owner-a", "binance-key", 1),
            ("owner-a", "openai-api-key", 2),
        ):
            with self.subTest(owner=owner, setting=setting, version=version), self.assertRaises(InvalidTag):
                cipher.decrypt(owner, setting, encrypted, key_version=version)


if __name__ == "__main__":
    unittest.main()
