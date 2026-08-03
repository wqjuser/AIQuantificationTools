from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Mapping

from sqlalchemy import delete, or_, select, update
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.engine import Connection, Engine

from quant_core.public_schema import public_leases, public_rate_limits


@dataclass(frozen=True)
class RateLimitPolicy:
    limit: int
    window: timedelta

    @classmethod
    def from_environment(cls, environment: Mapping[str, str]) -> dict[str, "RateLimitPolicy"]:
        definitions = {
            "login": ("AIQT_RATE_LIMIT_LOGIN_15M", 10, timedelta(minutes=15)),
            "mutation": ("AIQT_RATE_LIMIT_MUTATIONS_1M", 60, timedelta(minutes=1)),
            "ai": ("AIQT_RATE_LIMIT_AI_1H", 10, timedelta(hours=1)),
            "import": ("AIQT_RATE_LIMIT_IMPORT_1H", 5, timedelta(hours=1)),
        }
        return {
            scope: cls(_tightened_limit(environment.get(name), default), window)
            for scope, (name, default, window) in definitions.items()
        }


@dataclass(frozen=True)
class RateLimitDecision:
    allowed: bool
    retry_after_seconds: int


class PublicRateLimiter:
    def __init__(self, engine: Engine):
        self.engine = engine

    def check(
        self,
        scope: str,
        subject: str,
        policy: RateLimitPolicy,
        *,
        now: datetime | None = None,
    ) -> RateLimitDecision:
        timestamp = now or datetime.now(timezone.utc)
        window_seconds = int(policy.window.total_seconds())
        window_started_at = int(timestamp.timestamp()) // window_seconds * window_seconds
        expires_at = datetime.fromtimestamp(window_started_at + window_seconds, tz=timezone.utc)
        insert_factory = postgresql_insert if self.engine.dialect.name == "postgresql" else sqlite_insert
        statement = insert_factory(public_rate_limits).values(
            scope=scope,
            subject=subject,
            window_started_at=window_started_at,
            request_count=1,
            expires_at=expires_at,
        )
        statement = statement.on_conflict_do_update(
            index_elements=["scope", "subject", "window_started_at"],
            set_={"request_count": public_rate_limits.c.request_count + 1},
        ).returning(public_rate_limits.c.request_count)
        with self.engine.begin() as connection:
            connection.execute(
                delete(public_rate_limits).where(
                    public_rate_limits.c.expires_at <= timestamp
                )
            )
            count = connection.execute(statement).scalar_one()
        return RateLimitDecision(
            allowed=count <= policy.limit,
            retry_after_seconds=max(1, int((expires_at - timestamp).total_seconds())),
        )


class PublicLeaseStore:
    def __init__(self, engine: Engine, *, ttl: timedelta = timedelta(minutes=5)):
        self.engine = engine
        self.ttl = ttl

    def acquire(
        self,
        owner_id: str,
        task_key: str,
        holder_id: str,
        *,
        now: datetime | None = None,
    ) -> bool:
        timestamp = now or datetime.now(timezone.utc)
        insert_factory = postgresql_insert if self.engine.dialect.name == "postgresql" else sqlite_insert
        statement = insert_factory(public_leases).values(
            owner_id=owner_id,
            task_key=task_key,
            holder_id=holder_id,
            lease_expires_at=timestamp + self.ttl,
            updated_at=timestamp,
        )
        statement = statement.on_conflict_do_update(
            index_elements=["owner_id", "task_key"],
            set_={
                "holder_id": holder_id,
                "lease_expires_at": timestamp + self.ttl,
                "updated_at": timestamp,
            },
            where=or_(
                public_leases.c.lease_expires_at <= timestamp,
                public_leases.c.holder_id == holder_id,
            ),
        ).returning(public_leases.c.holder_id)
        with self.engine.begin() as connection:
            acquired_by = connection.execute(statement).scalar_one_or_none()
        return acquired_by == holder_id

    def release(self, owner_id: str, task_key: str, holder_id: str) -> None:
        from sqlalchemy import delete

        with self.engine.begin() as connection:
            connection.execute(
                delete(public_leases).where(
                    public_leases.c.owner_id == owner_id,
                    public_leases.c.task_key == task_key,
                    public_leases.c.holder_id == holder_id,
                )
            )

    def renew(
        self,
        owner_id: str,
        task_key: str,
        holder_id: str,
        *,
        now: datetime | None = None,
    ) -> bool:
        timestamp = now or datetime.now(timezone.utc)
        with self.engine.begin() as connection:
            renewed = connection.execute(
                update(public_leases)
                .where(
                    public_leases.c.owner_id == owner_id,
                    public_leases.c.task_key == task_key,
                    public_leases.c.holder_id == holder_id,
                    public_leases.c.lease_expires_at > timestamp,
                )
                .values(
                    lease_expires_at=timestamp + self.ttl,
                    updated_at=timestamp,
                )
            ).rowcount
        return renewed == 1

    def is_held(
        self,
        owner_id: str,
        task_key: str,
        holder_id: str,
        *,
        now: datetime | None = None,
        connection: Connection | None = None,
    ) -> bool:
        timestamp = now or datetime.now(timezone.utc)
        statement = select(public_leases.c.holder_id).where(
            public_leases.c.owner_id == owner_id,
            public_leases.c.task_key == task_key,
            public_leases.c.holder_id == holder_id,
            public_leases.c.lease_expires_at > timestamp,
        )
        if connection is not None:
            if connection.dialect.name == "postgresql":
                statement = statement.with_for_update()
            return connection.execute(statement).scalar_one_or_none() == holder_id
        with self.engine.connect() as opened:
            return opened.execute(
                statement
            ).scalar_one_or_none() == holder_id


def _tightened_limit(raw: str | None, default: int) -> int:
    try:
        configured = int(raw or "")
    except ValueError:
        return default
    return min(default, configured) if configured > 0 else default
