"""Create tenant record, setting, and production account boundaries."""

from alembic import op
import sqlalchemy as sa


revision = "0002_tenant_storage"
down_revision = "0001_public_identity"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tenant_records",
        sa.Column("owner_id", sa.String(36), sa.ForeignKey("public_users.owner_id", ondelete="CASCADE"), primary_key=True),
        sa.Column("record_kind", sa.String(64), primary_key=True),
        sa.Column("record_id", sa.String(512), primary_key=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("canonical_hash", sa.String(64)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "tenant_settings",
        sa.Column("owner_id", sa.String(36), sa.ForeignKey("public_users.owner_id", ondelete="CASCADE"), primary_key=True),
        sa.Column("setting_name", sa.String(128), primary_key=True),
        sa.Column("key_version", sa.Integer(), nullable=False),
        sa.Column("encrypted_value", sa.LargeBinary(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "production_account_claims",
        sa.Column("fingerprint", sa.String(256), primary_key=True),
        sa.Column("owner_id", sa.String(36), sa.ForeignKey("public_users.owner_id", ondelete="CASCADE"), nullable=False),
        sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("owner_id", name="uq_production_account_claim_owner"),
    )


def downgrade() -> None:
    op.drop_table("production_account_claims")
    op.drop_table("tenant_settings")
    op.drop_table("tenant_records")
