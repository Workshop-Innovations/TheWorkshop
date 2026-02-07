from fastapi import APIRouter, Depends, status
from sqlmodel import Session, select
from datetime import datetime, timezone
from ..database import get_session
from ..schemas import KeepAlive

router = APIRouter(
    prefix="/api/system",
    tags=["System"],
    responses={404: {"description": "Not found"}},
)

@router.post("/ping", status_code=status.HTTP_200_OK, summary="Ping backend to keep Supabase active")
async def ping_database(session: Session = Depends(get_session)):
    """
    Updates the KeepAlive table to ensure the database remains active.
    Intended to be called by a cron job (e.g., cron-job.org).
    """
    # Create a new KeepAlive entry
    keep_alive = KeepAlive(timestamp=datetime.now(timezone.utc))
    session.add(keep_alive)
    
    # Optional: Clean up old entries to prevent table bloat (keep last 1000 or so)
    # For now, we'll just insert. A separate cleanup job or logic could be added if needed,
    # but for a simple keep-alive, inserting is fine. 
    # Actually, let's just keep one row and update it to be cleaner?
    # But the requirement was "ping", and a log is nice.
    # Let's stick to insert for now, it's safer and gives a history.
    
    session.commit()
    
    return {"status": "alive", "timestamp": keep_alive.timestamp}
