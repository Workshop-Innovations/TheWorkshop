from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from ..database import get_session
from ..dependencies import get_current_user
from ..schemas import (
    User, Channel, ChannelCreate, ChannelResponse,
    Message, MessageCreate, MessageResponse, MessageVote
)
from ..websocket_manager import manager
from uuid import uuid4

router = APIRouter(
    prefix="/api/v1/community",
    tags=["community"]
)

@router.get("/channels", response_model=List[ChannelResponse])
async def get_channels(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    channels = session.exec(select(Channel)).all()
    # If no channels exist, create default ones
    if not channels:
        default_channels = [
            Channel(name="General", slug="general", description="General discussion"),
            Channel(name="Pomodoro Talk", slug="pomodoro-talk", description="Discuss Pomodoro techniques"),
            Channel(name="Off Topic", slug="off-topic", description="Anything goes")
        ]
        for channel in default_channels:
            session.add(channel)
        session.commit()
        for channel in default_channels:
            session.refresh(channel)
        return default_channels
    return channels

@router.get("/channels/{channel_slug}/messages", response_model=List[MessageResponse])
async def get_messages(
    channel_slug: str,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    channel = session.exec(select(Channel).where(Channel.slug == channel_slug)).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    # Fetch last 100 messages
    messages = session.exec(
        select(Message)
        .where(Message.channel_id == channel.id)
        .order_by(Message.timestamp.desc())
        .limit(limit)
    ).all()

    
    response_messages = []
    for msg in messages:
        score = sum(v.value for v in msg.votes)
        user_vote = next((v.value for v in msg.votes if v.user_id == current_user.id), 0)
        
        response_messages.append(MessageResponse(
            id=msg.id,
            content=msg.content,
            timestamp=msg.timestamp,
            user_id=msg.user_id,
            channel_id=msg.channel_id,
            user_email=msg.user.email if msg.user else None,
            score=score,
            user_vote=user_vote
        ))

    # Reverse to show oldest first in chat
    return list(reversed(response_messages))

@router.post("/channels/{channel_slug}/messages", response_model=MessageResponse)
async def create_message(
    channel_slug: str,
    message_data: MessageCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    channel = session.exec(select(Channel).where(Channel.slug == channel_slug)).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    db_message = Message(
        content=message_data.content,
        channel_id=channel.id,
        user_id=current_user.id
    )
    session.add(db_message)
    session.commit()
    session.refresh(db_message)
    
    # Broadcast to WebSocket
    await manager.broadcast(
        {
            "type": "message",
            "id": db_message.id,
            "content": db_message.content,
            "user_id": db_message.user_id,
            "channel_id": db_message.channel_id,
            "timestamp": db_message.timestamp.isoformat(),
            "user_email": current_user.email # Optional: send user email for UI
        },
        channel_slug
    )
    
    return MessageResponse(
        id=db_message.id,
        content=db_message.content,
        timestamp=db_message.timestamp,
        user_id=db_message.user_id,
        channel_id=db_message.channel_id,
        user_email=current_user.email,
        score=0,
        user_vote=0
    )

@router.post("/channels/{channel_slug}/messages/{message_id}/vote", response_model=MessageResponse)
async def vote_message(
    channel_slug: str,
    message_id: int,
    vote_value: int, # 1, -1, or 0
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    channel = session.exec(select(Channel).where(Channel.slug == channel_slug)).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    message = session.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
        
    # Check for existing vote
    existing_vote = session.exec(
        select(MessageVote)
        .where(MessageVote.user_id == current_user.id)
        .where(MessageVote.message_id == message_id)
    ).first()
    
    if vote_value == 0:
        if existing_vote:
            session.delete(existing_vote)
    else:
        if existing_vote:
            existing_vote.value = vote_value
            session.add(existing_vote)
        else:
            new_vote = MessageVote(
                user_id=current_user.id,
                message_id=message_id,
                value=vote_value
            )
            session.add(new_vote)
            
    session.commit()
    session.refresh(message)
    
    # Recalculate for response
    score = sum(v.value for v in message.votes)
    user_vote = vote_value
    
    # Broadcast update (optional but good for real-time)
    await manager.broadcast(
        {
            "type": "vote_update",
            "message_id": message_id,
            "channel_id": channel.id,
            "score": score
        },
        channel_slug
    )

    return MessageResponse(
        id=message.id,
        content=message.content,
        timestamp=message.timestamp,
        user_id=message.user_id,
        channel_id=message.channel_id,
        user_email=message.user.email if message.user else None,
        score=score,
        user_vote=user_vote
    )

@router.get("/users/online")
async def get_online_users(
    current_user: User = Depends(get_current_user)
):
    # This is a simplified view. In a real app, we'd query the DB for user details based on IDs
    return list(manager.online_users.keys())
