from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends, status
from sqlmodel import Session, select
from jose import jwt, JWTError

from ..websocket_manager import manager
from ..database import get_session
from ..schemas import User
from ..dependencies import settings

router = APIRouter()

async def get_current_user_ws(
    session: Session,
    token: str
):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    
    user = session.exec(select(User).where(User.username == username)).first()
    return user

@router.websocket("/ws/community/global")
async def websocket_endpoint(
    websocket: WebSocket, 
    token: str = Query(...),
    session: Session = Depends(get_session)
):
    """
    WebSocket endpoint for real-time global community chat.
    Authenticates user via token query parameter and manages connection.
    Tracks user as online while connected.
    """
    # Authenticate user
    user = await get_current_user_ws(session, token)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Connection manager handles online status broadcast inside connect()
    await manager.connect(websocket, user.id)
    
    try:
        while True:
            # Keep connection alive; listen for any client pings
            data = await websocket.receive_text()
            # Could handle typing indicators here in the future
            
    except WebSocketDisconnect:
        # Connection manager handles offline status broadcast inside disconnect()
        await manager.disconnect(user.id)
