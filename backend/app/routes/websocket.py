import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from sqlmodel import Session

from ..websocket_manager import manager
from ..database import engine
from ..dependencies import get_user_from_token

logger = logging.getLogger(__name__)

router = APIRouter()

# TODO: Migrate to ticket-based auth — exchange JWT for a short-lived
# one-time ticket via a REST endpoint, then pass only the ticket in the
# query string. This avoids logging long-lived JWTs in server/proxy logs.

@router.websocket("/ws/community/global")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    WebSocket endpoint for real-time global community chat.
    Authenticates user via token query parameter and manages connection.
    Tracks user as online while connected.
    """
    with Session(engine) as session:
        user = get_user_from_token(session, token)
        user_id = user.id if user else None

    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Connection manager handles online status broadcast inside connect()
    await manager.connect(websocket, user_id)

    try:
        while True:
            # Keep connection alive; listen for any client pings
            await websocket.receive_text()
            # Could handle typing indicators here in the future
    except WebSocketDisconnect:
        pass
    finally:
        # Runs on any exit (including unexpected errors) so the user isn't left "online"
        await manager.disconnect(user_id, websocket)
