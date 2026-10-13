from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from sqlmodel import Session

from ..websocket_manager import manager
from ..database import engine
from ..dependencies import get_user_from_token

router = APIRouter()

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
    # Authenticate with a short-lived session. Using Depends(get_session) here would
    # hold a pooled DB connection open for the whole lifetime of the socket, and a
    # handful of open tabs would exhaust the pool for every HTTP request.
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
