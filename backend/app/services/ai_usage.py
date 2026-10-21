from datetime import datetime, timezone
from sqlalchemy import case, update
from fastapi import HTTPException
from sqlmodel import Session
from ..models import User
from .subscriptions import PLAN_LIMITS, effective_tier


def reserve_query(session: Session, user: User):
    today = datetime.now(timezone.utc).date()
    limit = PLAN_LIMITS[effective_tier(user)]["ai_queries_daily"]
    count = case((User.last_ai_query_date == today, User.ai_queries_today), else_=0)
    statement = update(User).where(User.id == user.id)
    if limit != -1:
        statement = statement.where(count < limit)
    result = session.execute(
        statement.values(
            ai_queries_today=count + 1, last_ai_query_date=today
        ).execution_options(synchronize_session=False)
    )
    session.commit()
    if result.rowcount != 1:
        raise HTTPException(
            status_code=402, detail="Your daily AI usage limit has been reached."
        )
    return today


def refund_query(session: Session, user: User, reserved_day):
    # The date guard prevents a failed request from decrementing a new day's usage.
    session.execute(
        update(User)
        .where(
            User.id == user.id,
            User.last_ai_query_date == reserved_day,
            User.ai_queries_today > 0,
        )
        .values(ai_queries_today=User.ai_queries_today - 1)
        .execution_options(synchronize_session=False)
    )
    session.commit()
