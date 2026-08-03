from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from uuid import uuid4

from sqlalchemy import delete, insert, select, update
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError

from quant_core.public_schema import public_sessions, public_users
from quant_core.tenancy import TenantContext, _aware


class AuthenticationError(ValueError):
    pass


@dataclass(frozen=True)
class PublicUser:
    owner_id: str
    issuer: str
    subject: str
    email: str
    status: str


@dataclass(frozen=True)
class SessionCredentials:
    session_token: str
    csrf_token: str
    absolute_expires_at: datetime


class PublicIdentityStore:
    def __init__(self, engine: Engine):
        self.engine = engine

    def register_login(
        self,
        *,
        issuer: str,
        subject: str,
        email: str,
        email_verified: bool,
        now: datetime | None = None,
    ) -> PublicUser:
        if not email_verified:
            raise AuthenticationError("email_not_verified")
        normalized_issuer = issuer.rstrip("/")
        normalized_subject = subject.strip()
        normalized_email = email.strip().lower()
        if not normalized_issuer or not normalized_subject or "@" not in normalized_email:
            raise AuthenticationError("oidc_identity_invalid")
        timestamp = now or datetime.now(timezone.utc)
        owner_id = str(uuid4())
        try:
            with self.engine.begin() as connection:
                connection.execute(
                    insert(public_users).values(
                        owner_id=owner_id,
                        issuer=normalized_issuer,
                        subject=normalized_subject,
                        email=normalized_email,
                        status="active",
                        created_at=timestamp,
                        updated_at=timestamp,
                    )
                )
        except IntegrityError:
            pass
        with self.engine.begin() as connection:
            row = connection.execute(
                select(public_users).where(
                    public_users.c.issuer == normalized_issuer,
                    public_users.c.subject == normalized_subject,
                )
            ).mappings().one()
            if row["status"] != "active":
                raise AuthenticationError("user_disabled")
            if row["email"] != normalized_email:
                connection.execute(
                    update(public_users)
                    .where(public_users.c.owner_id == row["owner_id"])
                    .values(email=normalized_email, updated_at=timestamp)
                )
                row = {**row, "email": normalized_email, "updated_at": timestamp}
        return _user(row)

    def disable(self, owner_id: str, *, now: datetime | None = None) -> None:
        with self.engine.begin() as connection:
            changed = connection.execute(
                update(public_users)
                .where(public_users.c.owner_id == owner_id)
                .values(status="disabled", updated_at=now or datetime.now(timezone.utc))
            ).rowcount
        if changed != 1:
            raise AuthenticationError("user_not_found")

    def list_active(self) -> list[PublicUser]:
        with self.engine.connect() as connection:
            rows = connection.execute(
                select(public_users)
                .where(public_users.c.status == "active")
                .order_by(public_users.c.created_at, public_users.c.owner_id)
            ).mappings()
            return [_user(row) for row in rows]


class PublicSessionStore:
    absolute_ttl = timedelta(hours=12)
    idle_ttl = timedelta(minutes=30)

    def __init__(self, engine: Engine):
        self.engine = engine

    def create(self, owner_id: str, *, now: datetime | None = None) -> SessionCredentials:
        timestamp = now or datetime.now(timezone.utc)
        session_token = secrets.token_urlsafe(32)
        csrf_token = secrets.token_urlsafe(32)
        absolute_expires_at = timestamp + self.absolute_ttl
        with self.engine.begin() as connection:
            status = connection.execute(
                select(public_users.c.status).where(public_users.c.owner_id == owner_id)
            ).scalar_one_or_none()
            if status != "active":
                raise AuthenticationError("user_disabled" if status else "user_not_found")
            connection.execute(
                insert(public_sessions).values(
                    token_hash=_hash(session_token),
                    owner_id=owner_id,
                    csrf_hash=_hash(csrf_token),
                    created_at=timestamp,
                    last_seen_at=timestamp,
                    idle_expires_at=timestamp + self.idle_ttl,
                    absolute_expires_at=absolute_expires_at,
                    reauthenticated_at=timestamp,
                )
            )
        return SessionCredentials(session_token, csrf_token, absolute_expires_at)

    def authenticate(
        self,
        session_token: str,
        *,
        csrf_token: str | None = None,
        require_csrf: bool = False,
        now: datetime | None = None,
    ) -> TenantContext:
        timestamp = now or datetime.now(timezone.utc)
        token_hash = _hash(session_token)
        with self.engine.begin() as connection:
            row = connection.execute(
                select(
                    public_sessions,
                    public_users.c.issuer,
                    public_users.c.subject,
                    public_users.c.email,
                    public_users.c.status,
                )
                .join(public_users, public_users.c.owner_id == public_sessions.c.owner_id)
                .where(public_sessions.c.token_hash == token_hash)
            ).mappings().one_or_none()
            if row is None or row["revoked_at"] is not None:
                raise AuthenticationError("session_invalid")
            if row["status"] != "active":
                raise AuthenticationError("user_disabled")
            if timestamp > _aware(row["idle_expires_at"]) or timestamp > _aware(row["absolute_expires_at"]):
                connection.execute(delete(public_sessions).where(public_sessions.c.token_hash == token_hash))
                raise AuthenticationError("session_expired")
            if require_csrf and (not csrf_token or not secrets.compare_digest(_hash(csrf_token), row["csrf_hash"])):
                raise AuthenticationError("csrf_invalid")
            next_idle = min(timestamp + self.idle_ttl, _aware(row["absolute_expires_at"]))
            connection.execute(
                update(public_sessions)
                .where(public_sessions.c.token_hash == token_hash)
                .values(last_seen_at=timestamp, idle_expires_at=next_idle)
            )
        return TenantContext(
            owner_id=row["owner_id"],
            issuer=row["issuer"],
            subject=row["subject"],
            email=row["email"],
            reauthenticated_at=_aware(row["reauthenticated_at"]),
        )

    def revoke(self, session_token: str, *, now: datetime | None = None) -> None:
        with self.engine.begin() as connection:
            connection.execute(
                update(public_sessions)
                .where(public_sessions.c.token_hash == _hash(session_token))
                .values(revoked_at=now or datetime.now(timezone.utc))
            )

    def issue_csrf(self, session_token: str, *, now: datetime | None = None) -> tuple[TenantContext, str]:
        timestamp = now or datetime.now(timezone.utc)
        context = self.authenticate(session_token, now=timestamp)
        csrf_token = secrets.token_urlsafe(32)
        with self.engine.begin() as connection:
            connection.execute(
                update(public_sessions)
                .where(public_sessions.c.token_hash == _hash(session_token))
                .values(csrf_hash=_hash(csrf_token))
            )
        return context, csrf_token

    def mark_reauthenticated(
        self,
        session_token: str,
        owner_id: str,
        *,
        now: datetime | None = None,
    ) -> SessionCredentials:
        timestamp = now or datetime.now(timezone.utc)
        context = self.authenticate(session_token, now=timestamp)
        if context.owner_id != owner_id:
            raise AuthenticationError("reauthentication_identity_mismatch")
        csrf_token = secrets.token_urlsafe(32)
        with self.engine.begin() as connection:
            row = connection.execute(
                select(public_sessions.c.absolute_expires_at).where(
                    public_sessions.c.token_hash == _hash(session_token)
                )
            ).one()
            connection.execute(
                update(public_sessions)
                .where(public_sessions.c.token_hash == _hash(session_token))
                .values(reauthenticated_at=timestamp, csrf_hash=_hash(csrf_token))
            )
        return SessionCredentials(session_token, csrf_token, _aware(row.absolute_expires_at))


def _hash(value: str) -> bytes:
    return hashlib.sha256(value.encode()).digest()


def _user(row) -> PublicUser:
    return PublicUser(
        owner_id=row["owner_id"],
        issuer=row["issuer"],
        subject=row["subject"],
        email=row["email"],
        status=row["status"],
    )
