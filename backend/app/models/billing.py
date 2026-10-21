from typing import Optional
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class PaymentTransaction(SQLModel, table=True):
    """A Paystack transaction that has already been applied to a user's subscription.
    The unique reference makes verify/webhook processing idempotent, so one payment
    can't be replayed to extend a subscription again."""

    id: Optional[int] = Field(default=None, primary_key=True)
    reference: str = Field(unique=True, index=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    plan: str
    amount: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
