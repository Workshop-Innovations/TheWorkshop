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
    
    user = session.exec(select(User).where(User.email == username)).first()
    return user

@router.websocket("/ws/community/{channel_slug}")
async def websocket_endpoint(
    websocket: WebSocket, 
    channel_slug: str,
    token: str = Query(...),
    session: Session = Depends(get_session)
):
    """
    WebSocket endpoint for real-time community chat.
    Authenticates user via token query parameter and manages connection.
    """
    # Authenticate user
    user = await get_current_user_ws(session, token)
    if not user:
        # Close connection with policy violation if authentication fails
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Connection accepted in manager.connect if we called it, 
    # but manager.connect does await websocket.accept()
    # So we prefer to let manager handle accept or do it here?
    # Let's check manager implementation.
    
    # In websocket_manager.py:
    # async def connect(self, websocket: WebSocket, channel: str):
    #     await websocket.accept()
    #     ...
    
    await manager.connect(websocket, channel_slug)
    
    try:
        while True:
            # Keep the connection alive and listen for messages
            # In a real app, you might want to handle incoming messages here too
            # For now we mostly use it for broadcasting *to* clients
            data = await websocket.receive_text()
            
            # Optional: Process incoming messages if the client sends any
            # For example, typing indicators, etc.
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel_slug)
