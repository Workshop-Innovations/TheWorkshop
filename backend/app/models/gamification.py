from typing import TYPE_CHECKING
from typing import Optional, List
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel, Relationship


if TYPE_CHECKING:
    from .users import User


class Badge(SQLModel, table=True):
    """Badges that users can earn for achievements."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    description: str
    icon: str = Field(default="")
    category: str = Field(default="general")
    criteria_type: str
    criteria_value: int
    tier: str = Field(default="bronze")

    user_badges: List["UserBadge"] = Relationship(back_populates="badge")


class UserBadge(SQLModel, table=True):
    """Junction table for users and their earned badges."""

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    badge_id: int = Field(foreign_key="badge.id", index=True)
    earned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    user: Optional["User"] = Relationship(back_populates="user_badges")
    badge: Optional["Badge"] = Relationship(back_populates="user_badges")
