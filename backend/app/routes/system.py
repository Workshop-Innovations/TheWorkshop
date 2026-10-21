from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from datetime import datetime, timezone
from ..database import get_session
from ..models import KeepAlive

router = APIRouter(
    prefix="/api/system",
    tags=["System"],
    responses={404: {"description": "Not found"}},
)


@router.post(
    "/ping",
    status_code=status.HTTP_200_OK,
    summary="Ping backend to keep Supabase active",
)
async def ping_database(session: Session = Depends(get_session)):
    """
    Updates the KeepAlive table to ensure the database remains active.
    Intended to be called by a cron job (e.g., cron-job.org).
    """

    keep_alive = KeepAlive(timestamp=datetime.now(timezone.utc))
    session.add(keep_alive)

    session.commit()

    return {"status": "alive", "timestamp": keep_alive.timestamp}
