from datetime import datetime, timezone, timedelta
from typing import Optional
from ..models import User, PaymentTransaction
from sqlmodel import Session, select

PLAN_PRICES = {"pro": 95000, "premium": 200000, "max": 450000}

PLAN_LIMITS = {
    "basic": {"ai_queries_daily": 5, "name": "Basic"},
    "pro": {"ai_queries_daily": 50, "name": "Pro"},
    "premium": {"ai_queries_daily": -1, "name": "Premium"},
    "max": {"ai_queries_daily": -1, "name": "Max"},
}


def _as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """DB drivers may return naive datetimes (SQLite, TIMESTAMP WITHOUT TIME ZONE);
    treat those as UTC so comparisons with aware datetimes don't raise TypeError."""
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def is_subscription_expired(user: User) -> bool:
    expiry = _as_utc(user.subscription_expiry)
    return bool(
        user.subscription_tier != "basic"
        and expiry
        and expiry < datetime.now(timezone.utc)
    )


def effective_tier(user: User) -> str:
    """The tier the user is actually entitled to right now (expired plans count as basic)."""
    tier = user.subscription_tier or "basic"
    if tier not in PLAN_LIMITS or is_subscription_expired(user):
        return "basic"
    return tier


def _apply_payment(
    session: Session,
    user: User,
    reference: str,
    plan: str,
    amount: int,
    customer_code: Optional[str],
) -> bool:
    """Upgrade the user for a successful payment. Returns False if this reference
    was already applied (idempotency guard against replays and verify+webhook double-processing).
    """
    already = session.exec(
        select(PaymentTransaction).where(PaymentTransaction.reference == reference)
    ).first()
    if already:
        return False

    now = datetime.now(timezone.utc)
    current_expiry = _as_utc(user.subscription_expiry)
    base = (
        current_expiry
        if (current_expiry and current_expiry > now and user.subscription_tier == plan)
        else now
    )

    user.subscription_tier = plan
    user.subscription_expiry = base + timedelta(days=30)
    if customer_code:
        user.paystack_customer_id = customer_code

    session.add(
        PaymentTransaction(
            reference=reference, user_id=user.id, plan=plan, amount=amount
        )
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return True
