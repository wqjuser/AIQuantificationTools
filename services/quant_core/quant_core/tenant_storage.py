from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
from typing import Callable

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.engine import Connection, Engine
from sqlalchemy.exc import IntegrityError

from quant_core.public_coordination import PublicLeaseStore
from quant_core.public_schema import (
    production_account_claims,
    tenant_records,
    tenant_settings,
)
from quant_core.tenant_crypto import TenantSecretCipher
from quant_core.tenancy import TenantContext


class ProductionAccountClaimError(ValueError):
    pass


class TenantRecordStore:
    def __init__(self, engine: Engine, owner_id: str):
        self.engine = engine
        self.owner_id = owner_id
        self.write_fence: Callable[[Connection], bool] | None = None

    def require_write_fence(self, connection: Connection) -> None:
        if self.write_fence is not None and not self.write_fence(connection):
            raise RuntimeError("public_lease_lost")

    def put(
        self,
        record_kind: str,
        record_id: str,
        payload: dict[str, object],
        *,
        canonical_hash: str | None = None,
        now: datetime | None = None,
    ) -> dict[str, object]:
        timestamp = now or datetime.now(timezone.utc)
        clean_payload, statement = self._put_statement(
            record_kind,
            record_id,
            payload,
            canonical_hash=canonical_hash,
            timestamp=timestamp,
        )
        with self.engine.begin() as connection:
            self.require_write_fence(connection)
            connection.execute(statement)
        return clean_payload

    def put_many(
        self,
        records: list[tuple[str, str, dict[str, object]]],
        *,
        now: datetime | None = None,
    ) -> list[dict[str, object]]:
        timestamp = now or datetime.now(timezone.utc)
        prepared = [
            self._put_statement(kind, record_id, payload, timestamp=timestamp)
            for kind, record_id, payload in records
        ]
        with self.engine.begin() as connection:
            self.require_write_fence(connection)
            for _payload, statement in prepared:
                connection.execute(statement)
        return [payload for payload, _statement in prepared]

    def _put_statement(
        self,
        record_kind: str,
        record_id: str,
        payload: dict[str, object],
        *,
        canonical_hash: str | None = None,
        timestamp: datetime,
    ):
        clean_payload = json.loads(json.dumps(payload, ensure_ascii=False))
        insert_factory = (
            postgresql_insert
            if self.engine.dialect.name == "postgresql"
            else sqlite_insert
        )
        statement = insert_factory(tenant_records).values(
            owner_id=self.owner_id,
            record_kind=record_kind,
            record_id=record_id,
            payload=clean_payload,
            canonical_hash=canonical_hash,
            created_at=timestamp,
            updated_at=timestamp,
        )
        return clean_payload, statement.on_conflict_do_update(
            index_elements=["owner_id", "record_kind", "record_id"],
            set_={
                "payload": clean_payload,
                "canonical_hash": canonical_hash,
                "updated_at": timestamp,
            },
        )

    def put_if_absent(
        self,
        record_kind: str,
        record_id: str,
        payload: dict[str, object],
        *,
        canonical_hash: str | None = None,
        now: datetime | None = None,
    ) -> tuple[dict[str, object], bool]:
        timestamp = now or datetime.now(timezone.utc)
        clean_payload = json.loads(json.dumps(payload, ensure_ascii=False))
        insert_factory = (
            postgresql_insert
            if self.engine.dialect.name == "postgresql"
            else sqlite_insert
        )
        statement = (
            insert_factory(tenant_records)
            .values(
                owner_id=self.owner_id,
                record_kind=record_kind,
                record_id=record_id,
                payload=clean_payload,
                canonical_hash=canonical_hash,
                created_at=timestamp,
                updated_at=timestamp,
            )
            .on_conflict_do_nothing(
                index_elements=["owner_id", "record_kind", "record_id"]
            )
        )
        with self.engine.begin() as connection:
            self.require_write_fence(connection)
            created = connection.execute(statement).rowcount == 1
        stored = self.get(record_kind, record_id)
        if stored is None:
            raise RuntimeError("tenant_record_insert_conflict_without_record")
        return stored, created

    def get(self, record_kind: str, record_id: str) -> dict[str, object] | None:
        with self.engine.connect() as connection:
            payload = connection.execute(
                select(tenant_records.c.payload).where(
                    tenant_records.c.owner_id == self.owner_id,
                    tenant_records.c.record_kind == record_kind,
                    tenant_records.c.record_id == record_id,
                )
            ).scalar_one_or_none()
        return json.loads(json.dumps(payload, ensure_ascii=False)) if payload is not None else None

    def list(self, record_kind: str, *, limit: int = 100) -> list[dict[str, object]]:
        with self.engine.connect() as connection:
            rows = connection.execute(
                select(tenant_records.c.payload)
                .where(
                    tenant_records.c.owner_id == self.owner_id,
                    tenant_records.c.record_kind == record_kind,
                )
                .order_by(tenant_records.c.updated_at.desc())
                # ponytail: tenant histories are low-volume today; add cursor
                # pagination before any tenant approaches this explicit ceiling.
                .limit(max(1, min(limit, 100_000)))
            ).scalars().all()
        return [json.loads(json.dumps(payload, ensure_ascii=False)) for payload in rows]

    def delete(self, record_kind: str, record_id: str) -> None:
        with self.engine.begin() as connection:
            self.require_write_fence(connection)
            connection.execute(
                delete(tenant_records).where(
                    tenant_records.c.owner_id == self.owner_id,
                    tenant_records.c.record_kind == record_kind,
                    tenant_records.c.record_id == record_id,
                )
            )


class TenantSettingsStore:
    def __init__(self, engine: Engine, owner_id: str, cipher: TenantSecretCipher):
        self.engine = engine
        self.owner_id = owner_id
        self.cipher = cipher

    def set(
        self,
        name: str,
        value: str,
        *,
        key_version: int = 1,
        now: datetime | None = None,
    ) -> None:
        timestamp = now or datetime.now(timezone.utc)
        encrypted = self.cipher.encrypt(self.owner_id, name, value, key_version=key_version)
        insert_factory = postgresql_insert if self.engine.dialect.name == "postgresql" else sqlite_insert
        statement = insert_factory(tenant_settings).values(
            owner_id=self.owner_id,
            setting_name=name,
            key_version=key_version,
            encrypted_value=encrypted,
            updated_at=timestamp,
        )
        statement = statement.on_conflict_do_update(
            index_elements=["owner_id", "setting_name"],
            set_={
                "key_version": key_version,
                "encrypted_value": encrypted,
                "updated_at": timestamp,
            },
        )
        with self.engine.begin() as connection:
            connection.execute(statement)

    def get(self, name: str) -> str | None:
        with self.engine.connect() as connection:
            row = connection.execute(
                select(tenant_settings.c.key_version, tenant_settings.c.encrypted_value).where(
                    tenant_settings.c.owner_id == self.owner_id,
                    tenant_settings.c.setting_name == name,
                )
            ).one_or_none()
        if row is None:
            return None
        return self.cipher.decrypt(
            self.owner_id,
            name,
            row.encrypted_value,
            key_version=row.key_version,
        )


class ProductionAccountClaimStore:
    def __init__(self, engine: Engine):
        self.engine = engine

    def claim(self, owner_id: str, fingerprint: str, *, now: datetime | None = None) -> bool:
        try:
            with self.engine.begin() as connection:
                insert_factory = postgresql_insert if self.engine.dialect.name == "postgresql" else sqlite_insert
                created = connection.execute(
                    insert_factory(production_account_claims)
                    .values(
                        fingerprint=fingerprint,
                        owner_id=owner_id,
                        claimed_at=now or datetime.now(timezone.utc),
                    )
                    .on_conflict_do_nothing(index_elements=["fingerprint"])
                    .returning(production_account_claims.c.fingerprint)
                ).scalar_one_or_none()
        except IntegrityError as error:
            raise ProductionAccountClaimError("production_account_already_claimed") from error
        with self.engine.connect() as connection:
            claimed_owner = connection.execute(
                select(production_account_claims.c.owner_id).where(
                    production_account_claims.c.fingerprint == fingerprint
                )
            ).scalar_one()
        if claimed_owner != owner_id:
            raise ProductionAccountClaimError("production_account_already_claimed")
        return created is not None

    def release(self, owner_id: str, fingerprint: str) -> None:
        with self.engine.begin() as connection:
            connection.execute(
                delete(production_account_claims).where(
                    production_account_claims.c.owner_id == owner_id,
                    production_account_claims.c.fingerprint == fingerprint,
                )
            )

    def release_owner(self, owner_id: str) -> None:
        with self.engine.begin() as connection:
            connection.execute(
                delete(production_account_claims).where(
                    production_account_claims.c.owner_id == owner_id,
                )
            )


@dataclass(frozen=True)
class TenantStoreBundle:
    context: TenantContext
    records: TenantRecordStore
    settings: TenantSettingsStore
    leases: PublicLeaseStore
    production_accounts: ProductionAccountClaimStore

    @classmethod
    def create(
        cls,
        engine: Engine,
        context: TenantContext,
        cipher: TenantSecretCipher,
    ) -> "TenantStoreBundle":
        return cls(
            context=context,
            records=TenantRecordStore(engine, context.owner_id),
            settings=TenantSettingsStore(engine, context.owner_id, cipher),
            leases=PublicLeaseStore(engine),
            production_accounts=ProductionAccountClaimStore(engine),
        )
