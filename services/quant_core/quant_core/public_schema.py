from __future__ import annotations

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    LargeBinary,
    BigInteger,
    Integer,
    Index,
    MetaData,
    JSON,
    String,
    Table,
    UniqueConstraint,
)
from sqlalchemy.engine import Engine


public_metadata = MetaData()

public_users = Table(
    "public_users",
    public_metadata,
    Column("owner_id", String(36), primary_key=True),
    Column("issuer", String(500), nullable=False),
    Column("subject", String(500), nullable=False),
    Column("email", String(320), nullable=False),
    Column("status", String(16), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
    UniqueConstraint("issuer", "subject", name="uq_public_users_identity"),
    CheckConstraint("status IN ('active', 'disabled')", name="ck_public_users_status"),
)

public_sessions = Table(
    "public_sessions",
    public_metadata,
    Column("token_hash", LargeBinary(32), primary_key=True),
    Column("owner_id", String(36), ForeignKey("public_users.owner_id", ondelete="CASCADE"), nullable=False),
    Column("csrf_hash", LargeBinary(32), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("last_seen_at", DateTime(timezone=True), nullable=False),
    Column("idle_expires_at", DateTime(timezone=True), nullable=False),
    Column("absolute_expires_at", DateTime(timezone=True), nullable=False),
    Column("reauthenticated_at", DateTime(timezone=True), nullable=False),
    Column("revoked_at", DateTime(timezone=True)),
)

oidc_transactions = Table(
    "oidc_transactions",
    public_metadata,
    Column("state_hash", LargeBinary(32), primary_key=True),
    Column("encrypted_payload", LargeBinary, nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("expires_at", DateTime(timezone=True), nullable=False),
)

public_rate_limits = Table(
    "public_rate_limits",
    public_metadata,
    Column("scope", String(32), primary_key=True),
    Column("subject", String(256), primary_key=True),
    Column("window_started_at", BigInteger, primary_key=True),
    Column("request_count", Integer, nullable=False),
    Column("expires_at", DateTime(timezone=True), nullable=False),
)
Index("ix_public_rate_limits_expires_at", public_rate_limits.c.expires_at)

public_leases = Table(
    "public_leases",
    public_metadata,
    Column("owner_id", String(36), primary_key=True),
    Column("task_key", String(128), primary_key=True),
    Column("holder_id", String(128), nullable=False),
    Column("lease_expires_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

tenant_records = Table(
    "tenant_records",
    public_metadata,
    Column("owner_id", String(36), ForeignKey("public_users.owner_id", ondelete="CASCADE"), primary_key=True),
    Column("record_kind", String(64), primary_key=True),
    Column("record_id", String(512), primary_key=True),
    Column("payload", JSON, nullable=False),
    Column("canonical_hash", String(64)),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

tenant_settings = Table(
    "tenant_settings",
    public_metadata,
    Column("owner_id", String(36), ForeignKey("public_users.owner_id", ondelete="CASCADE"), primary_key=True),
    Column("setting_name", String(128), primary_key=True),
    Column("key_version", Integer, nullable=False),
    Column("encrypted_value", LargeBinary, nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

production_account_claims = Table(
    "production_account_claims",
    public_metadata,
    Column("fingerprint", String(256), primary_key=True),
    Column("owner_id", String(36), ForeignKey("public_users.owner_id", ondelete="CASCADE"), nullable=False),
    Column("claimed_at", DateTime(timezone=True), nullable=False),
    UniqueConstraint("owner_id", name="uq_production_account_claim_owner"),
)


def create_public_schema(engine: Engine) -> None:
    public_metadata.create_all(engine)
