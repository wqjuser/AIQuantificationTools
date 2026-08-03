"""Index expired public rate-limit windows for bounded cleanup."""

from alembic import op


revision = "0003_rate_limit_expiry_index"
down_revision = "0002_tenant_storage"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_public_rate_limits_expires_at",
        "public_rate_limits",
        ["expires_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_public_rate_limits_expires_at", table_name="public_rate_limits")
