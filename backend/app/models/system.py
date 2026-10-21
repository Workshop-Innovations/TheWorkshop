from typing import Optional
from datetime import datetime, timezone
from uuid import uuid4
from sqlmodel import Field, SQLModel


class KeepAlive(SQLModel, table=True):
    """Table to be pinged by cron jobs to keep Supabase active."""

    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
