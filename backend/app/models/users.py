from typing import TYPE_CHECKING
from typing import Optional, List
from datetime import datetime, date
from uuid import uuid4
from sqlmodel import Field, SQLModel, Relationship
from pydantic import EmailStr


if TYPE_CHECKING:
    from .productivity import SessionLog, Task
    from .community import Message
    from .gamification import UserBadge


class User(SQLModel, table=True):
    id: str = Field(
        default_factory=lambda: str(uuid4()), primary_key=True, nullable=False
    )
    username: str = Field(unique=True, index=True)
    email: EmailStr = Field(unique=True, index=True)
    hashed_password: str
    is_active: bool = Field(
        default=True
    )  # Field is for SQLModel specific column options
    role: str = Field(default="user")
    profile_pic: Optional[str] = Field(default=None)
    study_goal: Optional[str] = Field(default=None)

    reputation_points: int = Field(default=0)
    total_messages: int = Field(default=0)
    helpful_votes: int = Field(default=0)

    subscription_tier: str = Field(default="basic")
    subscription_expiry: Optional[datetime] = None
    paystack_customer_id: Optional[str] = None
    paystack_subscription_code: Optional[str] = None

    ai_queries_today: int = Field(default=0)
    last_ai_query_date: Optional[date] = None

    sessions: List["SessionLog"] = Relationship(back_populates="user")
    tasks: List["Task"] = Relationship(back_populates="owner")
    messages: List["Message"] = Relationship(back_populates="user")
    user_badges: List["UserBadge"] = Relationship(back_populates="user")
