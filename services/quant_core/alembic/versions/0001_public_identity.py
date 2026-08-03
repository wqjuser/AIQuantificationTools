"""Create public identity and coordination tables."""

from alembic import op
import sqlalchemy as sa


revision = "0001_public_identity"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "public_users",
        sa.Column("owner_id", sa.String(36), primary_key=True),
        sa.Column("issuer", sa.String(500), nullable=False),
        sa.Column("subject", sa.String(500), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("issuer", "subject", name="uq_public_users_identity"),
        sa.CheckConstraint("status IN ('active', 'disabled')", name="ck_public_users_status"),
    )
    op.create_table(
        "public_sessions",
        sa.Column("token_hash", sa.LargeBinary(32), primary_key=True),
        sa.Column("owner_id", sa.String(36), sa.ForeignKey("public_users.owner_id", ondelete="CASCADE"), nullable=False),
        sa.Column("csrf_hash", sa.LargeBinary(32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("idle_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("absolute_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reauthenticated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
    )
    op.create_table(
        "oidc_transactions",
        sa.Column("state_hash", sa.LargeBinary(32), primary_key=True),
        sa.Column("encrypted_payload", sa.LargeBinary(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "public_rate_limits",
        sa.Column("scope", sa.String(32), primary_key=True),
        sa.Column("subject", sa.String(256), primary_key=True),
        sa.Column("window_started_at", sa.BigInteger(), primary_key=True),
        sa.Column("request_count", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "public_leases",
        sa.Column("owner_id", sa.String(36), primary_key=True),
        sa.Column("task_key", sa.String(128), primary_key=True),
        sa.Column("holder_id", sa.String(128), nullable=False),
        sa.Column("lease_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("public_leases")
    op.drop_table("public_rate_limits")
    op.drop_table("oidc_transactions")
    op.drop_table("public_sessions")
    op.drop_table("public_users")
