"""Add admin password, contact details, and audit logs.

Revision ID: 002_admin_and_contact
Revises: 001_initial_schema
Create Date: 2026-11-01 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002_admin_and_contact"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add admin password and profile fields
    op.add_column("profiles", sa.Column("password_hash", sa.String(255), nullable=True))
    op.add_column("profiles", sa.Column("first_name", sa.String(128), nullable=True))
    op.add_column("profiles", sa.Column("last_name", sa.String(128), nullable=True))
    op.add_column("profiles", sa.Column("phone_number", sa.String(32), nullable=True))
    op.add_column("profiles", sa.Column("phone_shared_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_profiles_phone_number", "profiles", ["phone_number"])

    # 2. Create admin_audit_logs table
    op.create_table(
        "admin_audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "admin_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("profiles.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("target_id", sa.String(64), nullable=True),
        sa.Column("ip_address", sa.String(64), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_admin_audit_logs_action", "admin_audit_logs", ["action"])
    op.create_index("ix_admin_audit_logs_admin_id", "admin_audit_logs", ["admin_id"])
    op.create_index("ix_admin_audit_logs_created_at", "admin_audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("admin_audit_logs")
    op.drop_index("ix_profiles_phone_number", table_name="profiles")
    op.drop_column("profiles", "phone_shared_at")
    op.drop_column("profiles", "phone_number")
    op.drop_column("profiles", "last_name")
    op.drop_column("profiles", "first_name")
    op.drop_column("profiles", "password_hash")
