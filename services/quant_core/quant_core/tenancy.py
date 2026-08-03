from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone


@dataclass(frozen=True)
class TenantContext:
    owner_id: str
    issuer: str
    subject: str
    email: str
    reauthenticated_at: datetime

    @property
    def authenticated_actor(self) -> str:
        return self.email

    def reauthenticated_recently(
        self,
        *,
        now: datetime | None = None,
        maximum_age: timedelta = timedelta(minutes=5),
    ) -> bool:
        checked_at = now or datetime.now(timezone.utc)
        return checked_at - _aware(self.reauthenticated_at) <= maximum_age

    @classmethod
    def local(cls) -> "TenantContext":
        now = datetime.now(timezone.utc)
        return cls(
            owner_id="local",
            issuer="local",
            subject="local",
            email="local",
            reauthenticated_at=now,
        )


def _aware(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
