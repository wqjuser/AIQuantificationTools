from __future__ import annotations

from datetime import datetime, timedelta, timezone
import unittest

from sqlalchemy import create_engine, func, insert, select
from sqlalchemy.pool import StaticPool

from quant_core.public_identity import (
    AuthenticationError,
    PublicIdentityStore,
    PublicSessionStore,
)
from quant_core.public_schema import (
    create_public_schema,
    oidc_transactions,
    public_sessions,
)


UTC = timezone.utc


class PublicIdentityTest(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = create_engine(
            "sqlite+pysqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        create_public_schema(self.engine)
        self.identities = PublicIdentityStore(self.engine)
        self.sessions = PublicSessionStore(self.engine)
        self.now = datetime(2026, 8, 3, 8, 0, tzinfo=UTC)

    def tearDown(self) -> None:
        self.engine.dispose()

    def test_verified_oidc_login_registers_one_stable_owner(self) -> None:
        first = self.identities.register_login(
            issuer="https://identity.example.com",
            subject="subject-1",
            email="user@example.com",
            email_verified=True,
            now=self.now,
        )
        repeated = self.identities.register_login(
            issuer="https://identity.example.com/",
            subject="subject-1",
            email="new-address@example.com",
            email_verified=True,
            now=self.now + timedelta(minutes=1),
        )

        self.assertEqual(first.owner_id, repeated.owner_id)
        self.assertEqual(repeated.email, "new-address@example.com")
        self.assertEqual(repeated.status, "active")

    def test_unverified_email_is_rejected(self) -> None:
        with self.assertRaisesRegex(AuthenticationError, "email_not_verified"):
            self.identities.register_login(
                issuer="https://identity.example.com",
                subject="subject-1",
                email="user@example.com",
                email_verified=False,
                now=self.now,
            )

    def test_session_tokens_are_hashed_and_csrf_is_bound_to_the_session(self) -> None:
        user = self._register_user()
        credentials = self.sessions.create(user.owner_id, now=self.now)

        context = self.sessions.authenticate(
            credentials.session_token,
            csrf_token=credentials.csrf_token,
            require_csrf=True,
            now=self.now + timedelta(minutes=1),
        )
        self.assertEqual(context.owner_id, user.owner_id)
        self.assertEqual(context.authenticated_actor, "user@example.com")
        self.assertTrue(context.reauthenticated_recently(now=self.now + timedelta(minutes=4)))
        self.assertFalse(context.reauthenticated_recently(now=self.now + timedelta(minutes=6)))

        with self.engine.connect() as connection:
            row = connection.execute(select(public_sessions)).mappings().one()
        self.assertNotIn(credentials.session_token, str(row))
        self.assertNotIn(credentials.csrf_token, str(row))

        with self.assertRaisesRegex(AuthenticationError, "csrf_invalid"):
            self.sessions.authenticate(
                credentials.session_token,
                csrf_token="wrong",
                require_csrf=True,
                now=self.now + timedelta(minutes=2),
            )

    def test_session_has_idle_and_absolute_expiry_and_can_be_revoked(self) -> None:
        user = self._register_user()
        idle = self.sessions.create(user.owner_id, now=self.now)
        with self.assertRaisesRegex(AuthenticationError, "session_expired"):
            self.sessions.authenticate(
                idle.session_token,
                now=self.now + timedelta(minutes=31),
            )

        absolute = self.sessions.create(user.owner_id, now=self.now)
        with self.assertRaisesRegex(AuthenticationError, "session_expired"):
            self.sessions.authenticate(
                absolute.session_token,
                now=self.now + timedelta(hours=12, seconds=1),
            )

        revoked = self.sessions.create(user.owner_id, now=self.now)
        self.sessions.revoke(revoked.session_token, now=self.now + timedelta(minutes=1))
        with self.assertRaisesRegex(AuthenticationError, "session_invalid"):
            self.sessions.authenticate(revoked.session_token, now=self.now + timedelta(minutes=2))

    def test_disabled_user_cannot_use_an_existing_session(self) -> None:
        user = self._register_user()
        credentials = self.sessions.create(user.owner_id, now=self.now)
        self.identities.disable(user.owner_id, now=self.now + timedelta(minutes=1))

        with self.assertRaisesRegex(AuthenticationError, "user_disabled"):
            self.sessions.authenticate(credentials.session_token, now=self.now + timedelta(minutes=2))

    def test_identity_rebind_preserves_owner_and_revokes_existing_sessions(self) -> None:
        user = self._register_user()
        credentials = self.sessions.create(user.owner_id, now=self.now)
        with self.engine.begin() as connection:
            connection.execute(
                insert(oidc_transactions).values(
                    state_hash=b"x" * 32,
                    encrypted_payload=b"pending-login",
                    created_at=self.now,
                    expires_at=self.now + timedelta(minutes=10),
                )
            )

        migrated = self.identities.rebind_identity(
            owner_id=user.owner_id,
            expected_issuer="https://identity.example.com",
            expected_subject="subject-1",
            issuer="https://auth.example.com/realms/aiqt",
            subject="keycloak-user-id",
            email="new-address@example.com",
            now=self.now + timedelta(minutes=1),
        )

        self.assertEqual(migrated.owner_id, user.owner_id)
        self.assertEqual(migrated.issuer, "https://auth.example.com/realms/aiqt")
        self.assertEqual(migrated.subject, "keycloak-user-id")
        self.assertEqual(migrated.email, "new-address@example.com")
        with self.assertRaisesRegex(AuthenticationError, "session_invalid"):
            self.sessions.authenticate(
                credentials.session_token,
                now=self.now + timedelta(minutes=2),
            )
        self.assertEqual(
            self.identities.require_active_identity(
                issuer="https://auth.example.com/realms/aiqt",
                subject="keycloak-user-id",
            ).owner_id,
            user.owner_id,
        )
        with self.assertRaisesRegex(AuthenticationError, "user_not_found"):
            self.identities.require_active_identity(
                issuer="https://identity.example.com",
                subject="subject-1",
            )
        with self.engine.connect() as connection:
            pending_transactions = connection.execute(
                select(func.count()).select_from(oidc_transactions)
            ).scalar_one()
        self.assertEqual(pending_transactions, 0)
        with self.engine.begin() as connection:
            connection.execute(
                insert(oidc_transactions).values(
                    state_hash=b"y" * 32,
                    encrypted_payload=b"new-login-after-migration",
                    created_at=self.now + timedelta(minutes=2),
                    expires_at=self.now + timedelta(minutes=12),
                )
            )

        replayed = self.identities.rebind_identity(
            owner_id=user.owner_id,
            expected_issuer="https://identity.example.com",
            expected_subject="subject-1",
            issuer="https://auth.example.com/realms/aiqt",
            subject="keycloak-user-id",
            email="new-address@example.com",
            now=self.now + timedelta(minutes=2),
        )
        self.assertEqual(replayed, migrated)
        with self.engine.connect() as connection:
            pending_transactions = connection.execute(
                select(func.count()).select_from(oidc_transactions)
            ).scalar_one()
        self.assertEqual(pending_transactions, 1)

    def test_same_email_never_merges_distinct_oidc_identities(self) -> None:
        first = self._register_user()
        second = self.identities.register_login(
            issuer="https://auth.example.com/realms/aiqt",
            subject="different-subject",
            email=first.email,
            email_verified=True,
            now=self.now,
        )

        self.assertNotEqual(first.owner_id, second.owner_id)

    def test_identity_rebind_fails_closed_on_stale_source_or_target_collision(self) -> None:
        first = self._register_user()
        second = self.identities.register_login(
            issuer="https://auth.example.com/realms/aiqt",
            subject="keycloak-user-id",
            email="second@example.com",
            email_verified=True,
            now=self.now,
        )

        with self.assertRaisesRegex(AuthenticationError, "identity_migration_conflict"):
            self.identities.rebind_identity(
                owner_id=first.owner_id,
                expected_issuer="https://wrong.example.com",
                expected_subject="subject-1",
                issuer="https://auth.example.com/realms/aiqt",
                subject="unused-keycloak-user-id",
                email="user@example.com",
                now=self.now + timedelta(minutes=1),
            )
        with self.assertRaisesRegex(AuthenticationError, "identity_migration_conflict"):
            self.identities.rebind_identity(
                owner_id=first.owner_id,
                expected_issuer="https://identity.example.com",
                expected_subject="subject-1",
                issuer=second.issuer,
                subject=second.subject,
                email="user@example.com",
                now=self.now + timedelta(minutes=1),
            )

    def _register_user(self):
        return self.identities.register_login(
            issuer="https://identity.example.com",
            subject="subject-1",
            email="user@example.com",
            email_verified=True,
            now=self.now,
        )


if __name__ == "__main__":
    unittest.main()
