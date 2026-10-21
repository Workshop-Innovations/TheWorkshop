from typing import Optional
from datetime import datetime, timezone
from uuid import uuid4
from sqlmodel import Field, SQLModel, Relationship

from ..models.users import User


class SessionLog(SQLModel, table=True):
    """Database model to store completed Pomodoro sessions for progress tracking."""

    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)

    minutes_spent: int = Field(default=0, nullable=False)

    session_type: str = Field(nullable=False, max_length=20)

    completion_time: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), nullable=False
    )

    user_id: str = Field(foreign_key="user.id", index=True, nullable=False)

    user: Optional[User] = Relationship(back_populates="sessions")


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    description: Optional[str] = None
    completed: bool = Field(default=False)
    priority: str = Field(default="medium", max_length=50)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), nullable=False
    )
    due_date: Optional[datetime] = None

    owner_id: str = Field(foreign_key="user.id", index=True, nullable=False)

    owner: Optional[User] = Relationship(back_populates="tasks")
