from fastapi import APIRouter, Depends, status
from sqlmodel import Session, select, col
from datetime import datetime, timezone
from ..database import get_session
from ..schemas import KeepAlive

router = APIRouter(
    prefix="/api/system",
    tags=["System"],
    responses={404: {"description": "Not found"}},
)

@router.get("/health", status_code=status.HTTP_200_OK, summary="Health check (no DB)")
async def health_check():
    """Lightweight health check that confirms the backend process is alive."""
    return {"status": "ok"}

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
async def ping_database(session: Session = Depends(get_session)):
    """
    Writes to the KeepAlive table so the Supabase free-tier database stays active.
    Called by an external cron job (e.g., cron-job.org) every 3-4 minutes.
    Prunes old rows to prevent unbounded table growth.
    """
    return _ping(session)

@router.get("/ping", status_code=status.HTTP_200_OK, summary="GET ping for cron services")
async def ping_database_get(session: Session = Depends(get_session)):
    """GET variant so cron-job.org (which defaults to GET) can call it without config."""
    return _ping(session)
