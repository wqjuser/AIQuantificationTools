from __future__ import annotations

import base64
import secrets

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF


class TenantSecretCipher:
    def __init__(self, encoded_master_key: str):
        self.master_key = base64.urlsafe_b64decode(encoded_master_key.encode())
        if len(self.master_key) != 32:
            raise ValueError("master key must decode to 32 bytes")

    def encrypt(
        self,
        owner_id: str,
        setting: str,
        value: str,
        *,
        key_version: int,
    ) -> bytes:
        nonce = secrets.token_bytes(12)
        return nonce + AESGCM(self._owner_key(owner_id)).encrypt(
            nonce,
            value.encode(),
            self._aad(owner_id, setting, key_version),
        )

    def decrypt(
        self,
        owner_id: str,
        setting: str,
        encrypted: bytes,
        *,
        key_version: int,
    ) -> str:
        return AESGCM(self._owner_key(owner_id)).decrypt(
            encrypted[:12],
            encrypted[12:],
            self._aad(owner_id, setting, key_version),
        ).decode()

    def _owner_key(self, owner_id: str) -> bytes:
        return HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b"aiqt-tenant-secret-v1",
            info=owner_id.encode(),
        ).derive(self.master_key)

    @staticmethod
    def _aad(owner_id: str, setting: str, key_version: int) -> bytes:
        return f"{owner_id}\0{setting}\0{key_version}".encode()
