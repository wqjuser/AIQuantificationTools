from __future__ import annotations

from datetime import datetime, timezone
import logging
import os
from threading import Event, Thread
import time
import traceback
from typing import Callable, Mapping
from uuid import uuid4

from sqlalchemy.engine import Connection, Engine

from quant_core.public_coordination import PublicLeaseStore
from quant_core.public_identity import PublicIdentityStore, PublicUser
from quant_core.public_tenant_api import PublicTenantApi
from quant_core.tenancy import TenantContext


LOGGER = logging.getLogger("uvicorn.error")


class PublicBackgroundRunner:
    def __init__(
        self,
        engine: Engine,
        tenant_api: PublicTenantApi,
        *,
        environment: Mapping[str, str] | None = None,
    ) -> None:
        source = environment or os.environ
        self.engine = engine
        self.tenant_api = tenant_api
        self.identities = PublicIdentityStore(engine)
        self.leases = PublicLeaseStore(engine)
        self.holder_id = f"public-background-{uuid4().hex}"
        self.selection_interval = _interval(
            source.get("AIQT_MARKET_AI_SELECTION_REVIEW_INTERVAL_SECONDS"),
            21_600,
            60,
            86_400,
        )
        self.auto_interval = _interval(
            source.get("AIQT_AUTO_TRADING_INTERVAL_SECONDS"),
            35,
            5,
            3_600,
        )
        self._stopped = Event()
        self._thread: Thread | None = None

    @property
    def running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def start(self) -> None:
        if self.running:
            return
        self._stopped.clear()
        self._thread = Thread(
            target=self._run,
            name="public-tenant-background-runner",
            daemon=True,
        )
        self._thread.start()

    def stop(self, timeout: float = 5) -> None:
        self._stopped.set()
        thread = self._thread
        if thread is None:
            return
        thread.join(max(0, timeout))
        if not thread.is_alive():
            self._thread = None

    def run_selection_reviews_once(self) -> int:
        completed = self._run_for_active_tenants(
            "market-ai-selection-review",
            lambda tenant, guard, fence: self.tenant_api.review_due_selections(
                tenant, lease_guard=guard, lease_fence=fence
            ),
        )
        LOGGER.info(
            "public background selection review cycle completed tenant_count=%d",
            completed,
        )
        return completed

    def run_auto_trading_once(self) -> int:
        return self._run_for_active_tenants(
            "auto-trading",
            lambda tenant, guard, fence: self.tenant_api.process_auto_trading_once(
                tenant, lease_guard=guard, lease_fence=fence
            ),
        )

    def _run_for_active_tenants(
        self,
        task_key: str,
        operation: Callable[
            [TenantContext, Callable[[], bool], Callable[[Connection], bool]],
            object,
        ],
    ) -> int:
        completed = 0
        for user in self.identities.list_active():
            if not self.leases.acquire(user.owner_id, task_key, self.holder_id):
                continue
            renew_stop = Event()
            lease_lost = Event()
            renewer = Thread(
                target=self._renew_lease,
                args=(renew_stop, lease_lost, user.owner_id, task_key),
                daemon=True,
            )
            renewer.start()
            try:
                operation(
                    _tenant_context(user),
                    lambda owner_id=user.owner_id: not lease_lost.is_set()
                    and self.leases.is_held(owner_id, task_key, self.holder_id),
                    lambda connection, owner_id=user.owner_id: not lease_lost.is_set()
                    and self.leases.is_held(
                        owner_id,
                        task_key,
                        self.holder_id,
                        connection=connection,
                    ),
                )
                completed += 1
            except Exception as error:
                _log_task_failure(
                    task_key,
                    error,
                    scope="tenant",
                    owner_id=user.owner_id,
                )
            finally:
                renew_stop.set()
                renewer.join(timeout=1)
                self.leases.release(user.owner_id, task_key, self.holder_id)
        return completed

    def _renew_lease(
        self,
        stopped: Event,
        lost: Event,
        owner_id: str,
        task_key: str,
    ) -> None:
        interval = max(0.01, self.leases.ttl.total_seconds() / 3)
        while not stopped.wait(interval):
            try:
                renewed = self.leases.renew(owner_id, task_key, self.holder_id)
            except Exception as error:
                lost.set()
                _log_task_failure(
                    task_key,
                    error,
                    scope="lease-renewal",
                    owner_id=owner_id,
                )
                return
            if not renewed:
                lost.set()
                return

    def _run(self) -> None:
        next_selection = 0.0
        next_auto = 0.0
        while not self._stopped.is_set():
            now = time.monotonic()
            if now >= next_selection:
                try:
                    self.run_selection_reviews_once()
                except Exception as error:
                    _log_task_failure(
                        "market-ai-selection-review",
                        error,
                        scope="scheduler",
                    )
                next_selection = time.monotonic() + self.selection_interval
            if now >= next_auto:
                try:
                    self.run_auto_trading_once()
                except Exception as error:
                    _log_task_failure("auto-trading", error, scope="scheduler")
                next_auto = time.monotonic() + self.auto_interval
            self._stopped.wait(max(0.1, min(next_selection, next_auto) - time.monotonic()))


def _tenant_context(user: PublicUser) -> TenantContext:
    return TenantContext(
        owner_id=user.owner_id,
        issuer=user.issuer,
        subject=user.subject,
        email=user.email,
        # Background reconciliation is intentionally independent of a browser session.
        reauthenticated_at=datetime(1970, 1, 1, tzinfo=timezone.utc),
    )


def _log_task_failure(
    task_key: str,
    error: Exception,
    *,
    scope: str,
    owner_id: str = "-",
) -> None:
    stack = " > ".join(
        f"{os.path.basename(frame.filename)}:{frame.lineno}:{frame.name}"
        for frame in traceback.extract_tb(error.__traceback__)
    )
    LOGGER.error(
        "public background task failed task=%s scope=%s owner_id=%s "
        "error_type=%s stack=%s",
        task_key,
        scope,
        owner_id,
        type(error).__name__,
        stack or "unavailable",
    )


def _interval(raw: str | None, default: int, minimum: int, maximum: int) -> int:
    try:
        value = int(raw or "")
    except ValueError:
        return default
    return value if minimum <= value <= maximum else default
