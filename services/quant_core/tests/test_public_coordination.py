from __future__ import annotations

from datetime import datetime, timedelta, timezone
import unittest

from sqlalchemy import create_engine, func, select
from sqlalchemy.pool import StaticPool

from quant_core.public_coordination import PublicLeaseStore, PublicRateLimiter, RateLimitPolicy
from quant_core.public_identity import PublicIdentityStore
from quant_core.public_schema import create_public_schema, public_rate_limits
from quant_core.tenant_storage import TenantRecordStore


UTC = timezone.utc


class PublicCoordinationTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine(
            "sqlite+pysqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        create_public_schema(self.engine)
        self.now = datetime(2026, 8, 3, 8, 0, tzinfo=UTC)

    def tearDown(self) -> None:
        self.engine.dispose()

    def test_rate_limits_are_database_backed_and_windowed(self) -> None:
        limiter = PublicRateLimiter(self.engine)
        policy = RateLimitPolicy(limit=2, window=timedelta(minutes=1))

        self.assertTrue(limiter.check("mutation", "owner-a", policy, now=self.now).allowed)
        self.assertTrue(limiter.check("mutation", "owner-a", policy, now=self.now).allowed)
        blocked = limiter.check("mutation", "owner-a", policy, now=self.now)
        self.assertFalse(blocked.allowed)
        self.assertGreater(blocked.retry_after_seconds, 0)
        self.assertTrue(
            limiter.check("mutation", "owner-a", policy, now=self.now + timedelta(minutes=1)).allowed
        )
        self.assertTrue(limiter.check("mutation", "owner-b", policy, now=self.now).allowed)
        with self.engine.connect() as connection:
            owner_a_rows = connection.execute(
                select(func.count()).select_from(public_rate_limits).where(
                    public_rate_limits.c.scope == "mutation",
                    public_rate_limits.c.subject == "owner-a",
                )
            ).scalar_one()
        self.assertEqual(owner_a_rows, 1)

    def test_rate_limit_environment_can_only_tighten_defaults(self) -> None:
        defaults = RateLimitPolicy.from_environment({})
        tightened = RateLimitPolicy.from_environment(
            {
                "AIQT_RATE_LIMIT_LOGIN_15M": "3",
                "AIQT_RATE_LIMIT_MUTATIONS_1M": "10",
                "AIQT_RATE_LIMIT_AI_1H": "4",
                "AIQT_RATE_LIMIT_IMPORT_1H": "2",
            }
        )
        attempted_disable = RateLimitPolicy.from_environment({"AIQT_RATE_LIMIT_LOGIN_15M": "0"})

        self.assertEqual(defaults["login"].limit, 10)
        self.assertEqual(tightened["login"].limit, 3)
        self.assertEqual(tightened["mutation"].limit, 10)
        self.assertEqual(tightened["ai"].limit, 4)
        self.assertEqual(tightened["import"].limit, 2)
        self.assertEqual(attempted_disable["login"].limit, 10)

    def test_lease_is_unique_per_tenant_task_and_expires(self) -> None:
        leases = PublicLeaseStore(self.engine)

        self.assertTrue(leases.acquire("owner-a", "selection-review", "worker-1", now=self.now))
        self.assertFalse(leases.acquire("owner-a", "selection-review", "worker-2", now=self.now))
        self.assertTrue(leases.acquire("owner-b", "selection-review", "worker-2", now=self.now))
        self.assertTrue(
            leases.acquire(
                "owner-a",
                "selection-review",
                "worker-2",
                now=self.now + timedelta(minutes=6),
            )
        )

    def test_lease_holder_can_renew_before_expiry(self) -> None:
        leases = PublicLeaseStore(self.engine, ttl=timedelta(minutes=5))
        self.assertTrue(leases.acquire("owner-a", "review", "worker-1", now=self.now))
        self.assertTrue(
            leases.renew(
                "owner-a",
                "review",
                "worker-1",
                now=self.now + timedelta(minutes=4),
            )
        )
        self.assertFalse(
            leases.acquire(
                "owner-a",
                "review",
                "worker-2",
                now=self.now + timedelta(minutes=6),
            )
        )

    def test_tenant_write_is_fenced_in_the_same_database_transaction(self) -> None:
        user = PublicIdentityStore(self.engine).register_login(
            issuer="https://identity.example.com",
            subject="fenced-owner",
            email="fenced@example.com",
            email_verified=True,
        )
        leases = PublicLeaseStore(self.engine)
        records = TenantRecordStore(self.engine, user.owner_id)
        self.assertTrue(leases.acquire(user.owner_id, "auto", "worker"))
        records.write_fence = lambda connection: leases.is_held(
            user.owner_id,
            "auto",
            "worker",
            connection=connection,
        )
        records.put("auto_trading_state", "current", {"state": "monitoring"})
        leases.release(user.owner_id, "auto", "worker")

        with self.assertRaisesRegex(RuntimeError, "public_lease_lost"):
            records.put("auto_trading_state", "current", {"state": "traded"})


if __name__ == "__main__":
    unittest.main()
