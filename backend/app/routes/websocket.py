from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status, HTTPException
from sqlmodel import Session, select
from ..database import get_session
from ..dependencies import get_user_from_token
from ..websocket_manager import manager
from ..schemas import Channel

router = APIRouter()

@router.websocket("/ws/community/{channel_slug}")
async def websocket_endpoint(
    websocket: WebSocket,
    channel_slug: str,
    token: str = Query(...),
    session: Session = Depends(get_session)
):
    try:
        user = await get_user_from_token(token, session)
    except HTTPException:
        # Close connection if token is invalid
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Verify channel exists
    channel = session.exec(select(Channel).where(Channel.slug == channel_slug)).first()
    if not channel:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, channel_slug, user.id)
    
    # Broadcast user joined
    await manager.broadcast(
        {
            "type": "user_joined",
            "user_id": user.id,
            "user_email": user.email,
            "channel_slug": channel_slug
        },
        channel_slug
    )
    
    try:
        while True:
            # Wait for messages from the client (if any)
            # In this architecture, clients send messages via REST POST, 
            # so this might just be a keep-alive or for future features like typing indicators
            data = await websocket.receive_text()
            # Optional: Handle client messages sent via WS
            # await manager.broadcast(f"User {user.id} says: {data}", channel_slug)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel_slug, user.id)
        await manager.broadcast(
            {
                "type": "user_left",
                "user_id": user.id,
                "channel_slug": channel_slug
            },
            channel_slug
        )
