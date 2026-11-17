"""Persistent rate limit counters for Render."""
from alembic import op
import sqlalchemy as sa

revision='9a21_render_rate_limits'
down_revision='73b3ed9fd274'
branch_labels=None
depends_on=None

def upgrade():
    op.create_table('rate_limit_bucket',
        sa.Column('key',sa.String(64),primary_key=True),
        sa.Column('count',sa.Integer(),nullable=False),
        sa.Column('expires',sa.BigInteger(),nullable=False))
    op.create_index('ix_rate_limit_bucket_expires','rate_limit_bucket',['expires'])

def downgrade():
    op.drop_index('ix_rate_limit_bucket_expires',table_name='rate_limit_bucket')
    op.drop_table('rate_limit_bucket')
