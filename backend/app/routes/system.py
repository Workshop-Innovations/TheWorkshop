import os
import logging
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlmodel import Session, select, col, text
from datetime import datetime, timezone
from ..database import get_session
from ..schemas import KeepAlive

logger = logging.getLogger(__name__)

PING_SECRET = os.getenv("PING_SECRET", "")

router = APIRouter(
    prefix="/api/system",
    tags=["System"],
    responses={404: {"description": "Not found"}},
)

@router.get("/health", status_code=status.HTTP_200_OK, summary="Health check with DB connectivity")
async def health_check(session: Session = Depends(get_session)):
    try:
        session.exec(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception:
        logger.exception("Health check DB failure")
        return {"status": "degraded", "database": "unreachable"}

def _verify_ping_secret(x_ping_secret: Optional[str] = Header(None)) -> None:
    if PING_SECRET and x_ping_secret != PING_SECRET:
        raise HTTPException(status_code=403, detail="Invalid or missing ping secret")


def _ping(session: Session) -> dict:
    keep_alive = KeepAlive(timestamp=datetime.now(timezone.utc))
    session.add(keep_alive)
    session.flush()

    old_rows = session.exec(
        select(KeepAlive)
        .order_by(col(KeepAlive.timestamp).desc())
        .offset(50)
    ).all()
    for row in old_rows:
        session.delete(row)

    session.commit()

    return {"status": "alive", "timestamp": keep_alive.timestamp}

@router.post("/ping", status_code=status.HTTP_200_OK, summary="Ping backend to keep Supabase active")
async def ping_database(
    session: Session = Depends(get_session),
    _: None = Depends(_verify_ping_secret),
):
    """
    Writes to the KeepAlive table so the Supabase free-tier database stays active.
    Called by an external cron job (e.g., cron-job.org) every 3-4 minutes.
    Requires X-Ping-Secret header when PING_SECRET env var is set.
    """
    return _ping(session)

@router.get("/ping", status_code=status.HTTP_200_OK, summary="GET ping for cron services")
async def ping_database_get(
    session: Session = Depends(get_session),
    _: None = Depends(_verify_ping_secret),
):
    """GET variant so cron-job.org (which defaults to GET) can call it without config."""
    return _ping(session)
