from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import Event, Thread
import tempfile
import time
import unittest

from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

from quant_core.public_background import PublicBackgroundRunner
from quant_core.ai_review_providers import AiReviewProviderRegistry
from quant_core.audit_events import AuditEventStore
from quant_core.auto_paper_trading import AutoPaperTradingService
from quant_core.public_identity import PublicIdentityStore
from quant_core.public_schema import create_public_schema


class FakeTenantApi:
    def __init__(self):
        self.reviews = []
        self.trading = []

    def review_due_selections(self, tenant, *, lease_guard=None, lease_fence=None):
        if lease_guard is not None and not lease_guard():
            raise RuntimeError("public_lease_lost")
        self.reviews.append(tenant)

    def process_auto_trading_once(self, tenant, *, lease_guard=None, lease_fence=None):
        if lease_guard is not None and not lease_guard():
            raise RuntimeError("public_lease_lost")
        self.trading.append(tenant)


class PublicBackgroundRunnerTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite+pysqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        create_public_schema(self.engine)
        identities = PublicIdentityStore(self.engine)
        now = datetime(2026, 8, 3, tzinfo=timezone.utc)
        for subject in ("a", "b"):
            identities.register_login(
                issuer="https://identity.example.com",
                subject=subject,
                email=f"{subject}@example.com",
                email_verified=True,
                now=now,
            )

    def tearDown(self):
        self.engine.dispose()

    def test_each_active_tenant_is_processed_without_browser_session(self):
        api = FakeTenantApi()
        runner = PublicBackgroundRunner(self.engine, api)

        self.assertEqual(runner.run_selection_reviews_once(), 2)
        self.assertEqual(runner.run_auto_trading_once(), 2)
        self.assertEqual({item.email for item in api.reviews}, {"a@example.com", "b@example.com"})
        self.assertTrue(all(not item.reauthenticated_recently() for item in api.trading))

    def test_expired_worker_cannot_commit_after_another_runner_takes_the_lease(self):
        with tempfile.TemporaryDirectory() as tmp:
            engine = create_engine(f"sqlite+pysqlite:///{Path(tmp) / 'public.sqlite'}")
            create_public_schema(engine)
            PublicIdentityStore(engine).register_login(
                issuer="https://identity.example.com",
                subject="single",
                email="single@example.com",
                email_verified=True,
                now=datetime(2026, 8, 3, tzinfo=timezone.utc),
            )
            old = PublicBackgroundRunner(engine, FakeTenantApi())
            new = PublicBackgroundRunner(engine, FakeTenantApi())
            old.leases.ttl = new.leases.ttl = timedelta(milliseconds=60)
            old.leases.renew = lambda *args, **kwargs: False
            started = Event()
            committed: list[str] = []
            old_result: list[int] = []

            def slow_operation(_tenant, guard, _fence):
                started.set()
                time.sleep(0.15)
                if not guard():
                    raise RuntimeError("public_lease_lost")
                committed.append("old")

            thread = Thread(
                target=lambda: old_result.append(
                    old._run_for_active_tenants("task", slow_operation)
                )
            )
            thread.start()
            self.assertTrue(started.wait(1))
            time.sleep(0.08)
            new_result = new._run_for_active_tenants(
                "task",
                lambda _tenant, guard, _fence: committed.append("new") if guard() else None,
            )
            thread.join(1)
            engine.dispose()

        self.assertEqual(old_result, [0])
        self.assertEqual(new_result, 1)
        self.assertEqual(committed, ["new"])

    def test_real_auto_service_checks_lease_before_external_order_route(self):
        class Sandbox:
            called = False

            def submit_auto_market_order(self, order):
                self.called = True
                return {"state": "filled"}

        with tempfile.TemporaryDirectory() as tmp:
            sandbox = Sandbox()
            service = AutoPaperTradingService(
                AuditEventStore(Path(tmp) / "audit.sqlite"),
                AiReviewProviderRegistry.from_environment({}),
                sandbox=sandbox,
            )
            service.execution_guard = lambda: False

            with self.assertRaisesRegex(RuntimeError, "public_lease_lost"):
                service._route_order(
                    {"executionMode": "testnet", "testnetConfirmed": True},
                    {
                        "orderIntentId": "intent",
                        "symbol": "BTC/USDT",
                        "side": "buy",
                        "quantity": 0.001,
                        "referencePrice": 10_000,
                        "notionalValue": 10,
                    },
                    {},
                )
            self.assertFalse(sandbox.called)


if __name__ == "__main__":
    unittest.main()
