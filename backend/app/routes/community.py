from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, or_, and_, desc, func
from ..database import get_session
from ..dependencies import get_current_user
from ..schemas import (
    User, 
    Community, CommunityCreate, CommunityResponse, 
    CommunityMember, CommunityMemberResponse,
    Channel, ChannelCreate, ChannelResponse,
    Message, MessageCreate, MessageResponse, MessageVote, ThreadResponse,
    DMConversation, DMConversationResponse,
    DMMessage, DMMessageCreate, DMMessageResponse,
    Badge, UserBadge, BadgeResponse,
    UserReputationResponse, LeaderboardEntryResponse, LeaderboardResponse,
    StudyGroup, StudyGroupMember, StudyGroupCreate, 
    StudyGroupResponse, StudyGroupMemberResponse, StudyGroupDetailResponse,
    SharedNote, SharedNoteCreate, SharedNoteUpdate, SharedNoteResponse,
    PeerReviewSubmission, PeerReviewFeedback,
    PeerReviewSubmissionCreate, PeerReviewFeedbackCreate,
    PeerReviewSubmissionResponse, PeerReviewFeedbackResponse,
)
from ..websocket_manager import manager
from uuid import uuid4
import re

router = APIRouter(
    prefix="/api/v1/community",
    tags=["community"]
)

# ==================== COMMUNITY ENDPOINTS ====================

@router.post("/communities", response_model=CommunityResponse, status_code=status.HTTP_201_CREATED)
async def create_community(
    community_data: CommunityCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new community (server) with default channels."""
    db_community = Community(
        name=community_data.name,
        icon=community_data.icon,
        owner_id=current_user.id
    )
    session.add(db_community)
    session.commit()
    session.refresh(db_community)
    
    # Auto-add owner as member with "owner" role
    membership = CommunityMember(
        community_id=db_community.id,
        user_id=current_user.id,
        role="owner"
    )
    session.add(membership)
    
    # Create default channels so messages are always DB-backed
    default_channels = [
        {"name": "welcome",          "description": "Welcome to the community!"},
        {"name": "announcements",    "description": "Important announcements"},
        {"name": "general",          "description": "General discussion"},
        {"name": "off-topic",        "description": "Casual conversation"},
        {"name": "homework-help",    "description": "Get help with homework"},
        {"name": "resource-sharing", "description": "Share useful resources"},
    ]
    
    for ch_data in default_channels:
        channel = Channel(
            name=ch_data["name"],
            slug=f"{db_community.id[:8]}-{ch_data['name']}",
            description=ch_data["description"],
            community_id=db_community.id
        )
        session.add(channel)
    
    session.commit()
    
    return CommunityResponse(
        id=db_community.id,
        name=db_community.name,
        icon=db_community.icon,
        owner_id=db_community.owner_id,
        join_code=db_community.join_code,
        created_at=db_community.created_at,
        member_count=1
    )

@router.get("/communities", response_model=List[CommunityResponse])
async def get_user_communities(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get the main community, creating it and adding the user if necessary."""
    # Find the main community
    main_comm = session.exec(select(Community).where(Community.name == "The Workshop")).first()
    
    if not main_comm:
        main_comm = Community(
            name="The Workshop",
            icon="🛠️",
            owner_id=current_user.id
        )
        session.add(main_comm)
        session.commit()
        session.refresh(main_comm)
        
        # Create default channels
        default_channels = [
            {"name": "general",          "description": "General discussion"},
            {"name": "homework-help",    "description": "Get help with homework"},
            {"name": "resource-sharing", "description": "Share useful resources"},
        ]
        for ch_data in default_channels:
            channel = Channel(
                name=ch_data["name"],
                slug=f"workshop-{ch_data['name']}",
                description=ch_data["description"],
                community_id=main_comm.id
            )
            session.add(channel)
        session.commit()

    # Ensure user is a member
    membership = session.exec(
        select(CommunityMember)
        .where(CommunityMember.community_id == main_comm.id)
        .where(CommunityMember.user_id == current_user.id)
    ).first()
    
    if not membership:
        membership = CommunityMember(
            community_id=main_comm.id,
            user_id=current_user.id,
            role="member"
        )
        session.add(membership)
        session.commit()

    member_count = len(session.exec(
        select(CommunityMember).where(CommunityMember.community_id == main_comm.id)
    ).all())
    
    return [CommunityResponse(
        id=main_comm.id,
        name=main_comm.name,
        icon=main_comm.icon,
        owner_id=main_comm.owner_id,
        join_code=main_comm.join_code,
        created_at=main_comm.created_at,
        member_count=member_count
    )]

@router.post("/communities/join")
async def join_community(
    join_code: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Join a community using its join code."""
    community = session.exec(
        select(Community).where(Community.join_code == join_code)
    ).first()
    
    if not community:
        raise HTTPException(status_code=404, detail="Invalid join code")
    
    # Check if already a member
    existing = session.exec(
        select(CommunityMember)
        .where(CommunityMember.community_id == community.id)
        .where(CommunityMember.user_id == current_user.id)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already a member of this community")
    
    membership = CommunityMember(
        community_id=community.id,
        user_id=current_user.id,
        role="member"
    )
    session.add(membership)
    session.commit()
    
    return {"message": "Successfully joined community", "community_id": community.id}

@router.get("/communities/{community_id}", response_model=CommunityResponse)
async def get_community(
    community_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific community's details."""
    community = session.get(Community, community_id)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    member_count = len(session.exec(
        select(CommunityMember).where(CommunityMember.community_id == community.id)
    ).all())
    
    return CommunityResponse(
        id=community.id,
        name=community.name,
        icon=community.icon,
        owner_id=community.owner_id,
        join_code=community.join_code,
        created_at=community.created_at,
        member_count=member_count
    )

@router.get("/communities/{community_id}/members", response_model=List[CommunityMemberResponse])
async def get_community_members(
    community_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all members of a community."""
    members = session.exec(
        select(CommunityMember).where(CommunityMember.community_id == community_id)
    ).all()
    
    result = []
    for member in members:
        user = session.get(User, member.user_id)
        result.append(CommunityMemberResponse(
            id=member.id,
            user_id=member.user_id,
            user_email=user.email if user else None,
            user_profile_pic=user.profile_pic if user else None,
            role=member.role,
            joined_at=member.joined_at
        ))
    
    return result

# ==================== CHANNEL ENDPOINTS ====================

@router.get("/communities/{community_id}/channels", response_model=List[ChannelResponse])
async def get_community_channels(
    community_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all channels in a community."""
    channels = session.exec(
        select(Channel).where(Channel.community_id == community_id)
    ).all()
    
    # Get user's group memberships in this community to filter private group channels
    my_group_ids = session.exec(
        select(StudyGroupMember.group_id)
        .join(StudyGroup)
        .where(StudyGroup.community_id == community_id)
        .where(StudyGroupMember.user_id == current_user.id)
    ).all()
    
    visible_channels = []
    for ch in channels:
        # If it's a study group channel, check membership
        if ch.study_group_id:
            if ch.study_group_id in my_group_ids:
                visible_channels.append(ch)
        else:
            visible_channels.append(ch)

    return [ChannelResponse(
        id=ch.id,
        name=ch.name,
        slug=ch.slug,
        description=ch.description,
        channel_type=ch.channel_type,
        community_id=ch.community_id,
        study_group_id=ch.study_group_id
    ) for ch in visible_channels]

@router.post("/communities/{community_id}/channels", response_model=ChannelResponse, status_code=status.HTTP_201_CREATED)
async def create_channel(
    community_id: str,
    channel_data: ChannelCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new channel in a community."""
    community = session.get(Community, community_id)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    # Generate a unique slug
    base_slug = re.sub(r'[^a-z0-9-]', '', channel_data.name.lower().replace(' ', '-'))
    slug = f"{community_id[:8]}-{base_slug}"
    
    channel = Channel(
        name=channel_data.name,
        slug=slug,
        description=channel_data.description,
        channel_type=channel_data.channel_type,
        community_id=community_id
    )
    session.add(channel)
    session.commit()
    session.refresh(channel)
    
    return ChannelResponse(
        id=channel.id,
        name=channel.name,
        slug=channel.slug,
        description=channel.description,
        channel_type=channel.channel_type,
        community_id=channel.community_id
    )

# ==================== MESSAGE ENDPOINTS ====================

@router.get("/channels/{channel_id}/messages", response_model=List[MessageResponse])
async def get_channel_messages(
    channel_id: str,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get messages from a channel."""
    channel = session.get(Channel, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    messages = session.exec(
        select(Message)
        .where(Message.channel_id == channel_id)
        .order_by(Message.timestamp.desc())
        .limit(limit)
    ).all()
    
    response_messages = []
    for msg in messages:
        score = sum(v.value for v in msg.votes) if msg.votes else 0
        user_vote = next((v.value for v in msg.votes if v.user_id == current_user.id), 0) if msg.votes else 0
        user = session.get(User, msg.user_id)
        
        response_messages.append(MessageResponse(
            id=msg.id,
            content=msg.content,
            timestamp=msg.timestamp,
            user_id=msg.user_id,
            channel_id=msg.channel_id,
            user_email=user.email if user else None,
            user_profile_pic=user.profile_pic if user else None,
            score=score,
            user_vote=user_vote
        ))
    
    return list(reversed(response_messages))

@router.post("/channels/{channel_id}/messages", response_model=MessageResponse)
async def create_message(
    channel_id: str,
    message_data: MessageCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Send a message to a channel."""
    channel = session.get(Channel, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    db_message = Message(
        content=message_data.content,
        channel_id=channel_id,
        user_id=current_user.id
    )
    session.add(db_message)
    
    # Increment user's message count for badges
    current_user.total_messages += 1
    session.add(current_user)
    
    session.commit()
    session.refresh(db_message)
    
    # Check for new badges
    await check_and_award_badges(session, current_user)
    
    # Broadcast via WebSocket
    await manager.broadcast_all(
        {
            "type": "message",
            "id": db_message.id,
            "content": db_message.content,
            "user_id": db_message.user_id,
            "channel_id": db_message.channel_id,
            "timestamp": db_message.timestamp.isoformat(),
            "user_email": current_user.email,
            "user_profile_pic": current_user.profile_pic
        }
    )
    
    return MessageResponse(
        id=db_message.id,
        content=db_message.content,
        timestamp=db_message.timestamp,
        user_id=db_message.user_id,
        channel_id=db_message.channel_id,
        user_email=current_user.email,
        user_profile_pic=current_user.profile_pic,
        score=0,
        user_vote=0
    )

@router.post("/channels/{channel_id}/messages/{message_id}/vote", response_model=MessageResponse)
async def vote_message(
    channel_id: str,
    message_id: int,
    vote_value: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Vote on a message. Updates author's reputation."""
    if vote_value not in (-1, 0, 1):
        raise HTTPException(status_code=400, detail="vote_value must be -1, 0, or 1")
    
    message = session.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Get message author for reputation update
    message_author = session.get(User, message.user_id)
    
    existing_vote = session.exec(
        select(MessageVote)
        .where(MessageVote.user_id == current_user.id)
        .where(MessageVote.message_id == message_id)
    ).first()
    
    old_vote_value = existing_vote.value if existing_vote else 0
    
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
    
    # Update message author's reputation based on vote change
    if message_author and message_author.id != current_user.id:
        vote_delta = vote_value - old_vote_value
        message_author.reputation_points = max(0, message_author.reputation_points + vote_delta)
        # Only count upvotes received (positive votes) for the helpful_votes badge metric
        if vote_value == 1 and old_vote_value != 1:
            message_author.helpful_votes += 1
        elif vote_value != 1 and old_vote_value == 1 and message_author.helpful_votes > 0:
            message_author.helpful_votes -= 1
        session.add(message_author)
        
        # Check for badge achievements after reputation update
        await check_and_award_badges(session, message_author)
    
    session.commit()
    session.refresh(message)
    
    score = sum(v.value for v in message.votes) if message.votes else 0
    user = session.get(User, message.user_id)
    
    return MessageResponse(
        id=message.id,
        content=message.content,
        timestamp=message.timestamp,
        user_id=message.user_id,
        channel_id=message.channel_id,
        user_email=user.email if user else None,
        user_profile_pic=user.profile_pic if user else None,
        score=score,
        user_vote=vote_value,
        parent_id=message.parent_id,
        reply_count=message.reply_count
    )

# ==================== MESSAGE EDIT / DELETE ====================

@router.put("/channels/{channel_id}/messages/{message_id}", response_model=MessageResponse)
async def edit_message(
    channel_id: str,
    message_id: int,
    message_data: MessageCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Edit a message. Only the author can edit their own messages."""
    message = session.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit your own messages")

    message.content = message_data.content
    session.add(message)
    session.commit()
    session.refresh(message)

    user = session.get(User, message.user_id)
    score = sum(v.value for v in message.votes) if message.votes else 0
    user_vote = next((v.value for v in message.votes if v.user_id == current_user.id), 0) if message.votes else 0

    channel = session.get(Channel, channel_id)
    await manager.broadcast_all(
        {
            "type": "message_edited",
            "id": message.id,
            "content": message.content,
            "channel_id": channel_id,
        }
    )

    return MessageResponse(
        id=message.id,
        content=message.content,
        timestamp=message.timestamp,
        user_id=message.user_id,
        channel_id=message.channel_id,
        user_email=user.email if user else None,
        user_profile_pic=user.profile_pic if user else None,
        score=score,
        user_vote=user_vote,
        parent_id=message.parent_id,
        reply_count=message.reply_count
    )

@router.delete("/channels/{channel_id}/messages/{message_id}")
async def delete_message(
    channel_id: str,
    message_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a message. Author, community owner, or admins can delete."""
    message = session.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Check permission: author OR community owner/admin
    if message.user_id != current_user.id:
        channel = session.get(Channel, channel_id)
        if channel and channel.community_id:
            membership = session.exec(
                select(CommunityMember)
                .where(CommunityMember.community_id == channel.community_id)
                .where(CommunityMember.user_id == current_user.id)
                .where(CommunityMember.role.in_(["owner", "admin"]))
            ).first()
            if not membership:
                raise HTTPException(status_code=403, detail="You can only delete your own messages")
        else:
            raise HTTPException(status_code=403, detail="You can only delete your own messages")

    # Delete all votes on this message first
    votes = session.exec(select(MessageVote).where(MessageVote.message_id == message_id)).all()
    for vote in votes:
        session.delete(vote)

    # Cascade-delete all child replies and their votes
    child_replies = session.exec(
        select(Message).where(Message.parent_id == message_id)
    ).all()
    for reply in child_replies:
        child_votes = session.exec(select(MessageVote).where(MessageVote.message_id == reply.id)).all()
        for cv in child_votes:
            session.delete(cv)
        session.delete(reply)

    # Decrement parent reply count if this is a reply
    if message.parent_id:
        parent = session.get(Message, message.parent_id)
        if parent and parent.reply_count > 0:
            parent.reply_count -= 1
            session.add(parent)

    session.delete(message)
    session.commit()

    channel = session.get(Channel, channel_id)
    await manager.broadcast_all(
        {
            "type": "message_deleted",
            "id": message_id,
            "channel_id": channel_id,
        }
    )

    return {"message": "Message deleted successfully"}

# ==================== THREADED DISCUSSIONS ====================

@router.post("/channels/{channel_id}/messages/{message_id}/reply", response_model=MessageResponse)
async def create_reply(
    channel_id: str,
    message_id: int,
    message_data: MessageCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a reply to a message (threaded discussion)."""
    parent_message = session.get(Message, message_id)
    if not parent_message:
        raise HTTPException(status_code=404, detail="Parent message not found")
    
    channel = session.get(Channel, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    # Create reply
    reply = Message(
        content=message_data.content,
        channel_id=channel_id,
        user_id=current_user.id,
        parent_id=message_id
    )
    session.add(reply)
    
    # Increment parent's reply count
    parent_message.reply_count += 1
    session.add(parent_message)
    
    # Increment user's message count
    current_user.total_messages += 1
    session.add(current_user)
    
    session.commit()
    session.refresh(reply)
    
    # Check for badges
    await check_and_award_badges(session, current_user)
    
    # Broadcast via WebSocket
    await manager.broadcast_all(
        {
            "type": "reply",
            "id": reply.id,
            "content": reply.content,
            "user_id": reply.user_id,
            "channel_id": reply.channel_id,
            "parent_id": reply.parent_id,
            "timestamp": reply.timestamp.isoformat(),
            "user_email": current_user.email,
            "user_profile_pic": current_user.profile_pic
        }
    )
    
    return MessageResponse(
        id=reply.id,
        content=reply.content,
        timestamp=reply.timestamp,
        user_id=reply.user_id,
        channel_id=reply.channel_id,
        user_email=current_user.email,
        user_profile_pic=current_user.profile_pic,
        score=0,
        user_vote=0,
        parent_id=reply.parent_id,
        reply_count=0
    )

@router.get("/channels/{channel_id}/messages/{message_id}/thread", response_model=ThreadResponse)
async def get_thread(
    channel_id: str,
    message_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a message thread (parent + all replies)."""
    parent_message = session.get(Message, message_id)
    if not parent_message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Get parent message response
    parent_user = session.get(User, parent_message.user_id)
    parent_score = sum(v.value for v in parent_message.votes) if parent_message.votes else 0
    parent_vote = next((v.value for v in parent_message.votes if v.user_id == current_user.id), 0) if parent_message.votes else 0
    
    parent_response = MessageResponse(
        id=parent_message.id,
        content=parent_message.content,
        timestamp=parent_message.timestamp,
        user_id=parent_message.user_id,
        channel_id=parent_message.channel_id,
        user_email=parent_user.email if parent_user else None,
        user_profile_pic=parent_user.profile_pic if parent_user else None,
        score=parent_score,
        user_vote=parent_vote,
        parent_id=parent_message.parent_id,
        reply_count=parent_message.reply_count
    )
    
    # Get replies
    replies = session.exec(
        select(Message)
        .where(Message.parent_id == message_id)
        .order_by(Message.timestamp)
    ).all()
    
    reply_responses = []
    for reply in replies:
        reply_user = session.get(User, reply.user_id)
        reply_score = sum(v.value for v in reply.votes) if reply.votes else 0
        reply_vote = next((v.value for v in reply.votes if v.user_id == current_user.id), 0) if reply.votes else 0
        
        reply_responses.append(MessageResponse(
            id=reply.id,
            content=reply.content,
            timestamp=reply.timestamp,
            user_id=reply.user_id,
            channel_id=reply.channel_id,
            user_email=reply_user.email if reply_user else None,
            user_profile_pic=reply_user.profile_pic if reply_user else None,
            score=reply_score,
            user_vote=reply_vote,
            parent_id=reply.parent_id,
            reply_count=reply.reply_count
        ))
    
    return ThreadResponse(
        parent=parent_response,
        replies=reply_responses,
        total_replies=len(reply_responses)
    )

# ==================== DIRECT MESSAGE ENDPOINTS ====================

@router.get("/dms", response_model=List[DMConversationResponse])
async def get_dm_conversations(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all DM conversations for the current user."""
    conversations = session.exec(
        select(DMConversation).where(
            or_(
                DMConversation.user1_id == current_user.id,
                DMConversation.user2_id == current_user.id
            )
        )
    ).all()
    
    result = []
    for conv in conversations:
        other_user_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id
        other_user = session.get(User, other_user_id)
        
        # Get last message
        last_msg = session.exec(
            select(DMMessage)
            .where(DMMessage.conversation_id == conv.id)
            .order_by(DMMessage.timestamp.desc())
            .limit(1)
        ).first()
        
        result.append(DMConversationResponse(
            id=conv.id,
            other_user_id=other_user_id,
            other_user_email=other_user.email if other_user else None,
            other_user_profile_pic=other_user.profile_pic if other_user else None,
            last_message=last_msg.content if last_msg else None,
            last_message_time=last_msg.timestamp if last_msg else None
        ))
    
    return result

@router.post("/dms/{user_id}", response_model=DMConversationResponse)
async def start_dm_conversation(
    user_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Start or get existing DM conversation with a user."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot DM yourself")
    
    other_user = session.get(User, user_id)
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check for existing conversation
    existing = session.exec(
        select(DMConversation).where(
            or_(
                and_(DMConversation.user1_id == current_user.id, DMConversation.user2_id == user_id),
                and_(DMConversation.user1_id == user_id, DMConversation.user2_id == current_user.id)
            )
        )
    ).first()
    
    if existing:
        return DMConversationResponse(
            id=existing.id,
            other_user_id=user_id,
            other_user_email=other_user.email,
            other_user_profile_pic=other_user.profile_pic,
            last_message=None,
            last_message_time=None
        )
    
    # Create new conversation
    conv = DMConversation(
        user1_id=current_user.id,
        user2_id=user_id
    )
    session.add(conv)
    session.commit()
    session.refresh(conv)
    
    return DMConversationResponse(
        id=conv.id,
        other_user_id=user_id,
        other_user_email=other_user.email,
        other_user_profile_pic=other_user.profile_pic,
        last_message=None,
        last_message_time=None
    )

@router.get("/dms/{conversation_id}/messages", response_model=List[DMMessageResponse])
async def get_dm_messages(
    conversation_id: str,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get messages from a DM conversation."""
    conversation = session.get(DMConversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Verify user is part of conversation
    if current_user.id not in [conversation.user1_id, conversation.user2_id]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    messages = session.exec(
        select(DMMessage)
        .where(DMMessage.conversation_id == conversation_id)
        .order_by(DMMessage.timestamp.desc())
        .limit(limit)
    ).all()
    
    result = []
    for msg in messages:
        sender = session.get(User, msg.sender_id)
        result.append(DMMessageResponse(
            id=msg.id,
            content=msg.content,
            timestamp=msg.timestamp,
            sender_id=msg.sender_id,
            sender_email=sender.email if sender else None,
            sender_profile_pic=sender.profile_pic if sender else None,
            conversation_id=msg.conversation_id
        ))
    
    return list(reversed(result))

@router.post("/dms/{conversation_id}/messages", response_model=DMMessageResponse)
async def send_dm_message(
    conversation_id: str,
    message_data: DMMessageCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Send a DM message."""
    conversation = session.get(DMConversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Verify user is part of conversation
    if current_user.id not in [conversation.user1_id, conversation.user2_id]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    msg = DMMessage(
        content=message_data.content,
        sender_id=current_user.id,
        conversation_id=conversation_id
    )
    session.add(msg)
    session.commit()
    session.refresh(msg)
    
    # Broadcast via WebSocket (using conversation_id as channel)
    await manager.send_personal_message(
        {
            "type": "dm_message",
            "id": msg.id,
            "content": msg.content,
            "sender_id": msg.sender_id,
            "conversation_id": msg.conversation_id,
            "timestamp": msg.timestamp.isoformat(),
            "sender_email": current_user.email,
            "sender_profile_pic": current_user.profile_pic
        }, conversation.user1_id)
    if conversation.user1_id != conversation.user2_id:
        await manager.send_personal_message(
            {
            "type": "dm_message",
            "id": msg.id,
            "content": msg.content,
            "sender_id": msg.sender_id,
            "conversation_id": msg.conversation_id,
            "timestamp": msg.timestamp.isoformat(),
            "sender_email": current_user.email,
            "sender_profile_pic": current_user.profile_pic
        }, conversation.user2_id)
    
    return DMMessageResponse(
        id=msg.id,
        content=msg.content,
        timestamp=msg.timestamp,
        sender_id=msg.sender_id,
        sender_email=current_user.email,
        sender_profile_pic=current_user.profile_pic,
        conversation_id=msg.conversation_id
    )

# ==================== USER SEARCH ====================

@router.get("/users/search")
async def search_users(
    q: str = Query(..., min_length=1),
    limit: int = 20,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Search users by username or email prefix for DM friend search."""
    search_term = f"%{q.lower()}%"
    users = session.exec(
        select(User)
        .where(
            or_(
                User.username.ilike(search_term),
                User.email.ilike(search_term)
            )
        )
        .where(User.id != current_user.id)
        .where(User.is_active == True)
        .limit(limit)
    ).all()

    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "profile_pic": u.profile_pic,
            "reputation_points": u.reputation_points,
        }
        for u in users
    ]

@router.get("/communities/{community_id}/join-code")
async def get_community_join_code(
    community_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get the join code for a community (members only)."""
    community = session.get(Community, community_id)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    # Verify user is a member
    membership = session.exec(
        select(CommunityMember)
        .where(CommunityMember.community_id == community_id)
        .where(CommunityMember.user_id == current_user.id)
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="You must be a member to see the join code")

    return {"join_code": community.join_code, "community_name": community.name}

# ==================== LEGACY ENDPOINTS (for backwards compatibility) ====================

@router.get("/channels", response_model=List[ChannelResponse])
async def get_channels(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all channels (legacy - returns channels without community)."""
    channels = session.exec(select(Channel)).all()
    
    if not channels:
        # Create default channels for backwards compatibility
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
        channels = default_channels
    
    return [ChannelResponse(
        id=ch.id,
        name=ch.name,
        slug=ch.slug,
        description=ch.description,
        channel_type=ch.channel_type if hasattr(ch, 'channel_type') else "text",
        community_id=ch.community_id if hasattr(ch, 'community_id') else None
    ) for ch in channels]

@router.get("/channels/{channel_slug}/messages", response_model=List[MessageResponse])
async def get_messages_by_slug(
    channel_slug: str,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get messages from a channel by slug (legacy endpoint)."""
    channel = session.exec(select(Channel).where(Channel.slug == channel_slug)).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    messages = session.exec(
        select(Message)
        .where(Message.channel_id == channel.id)
        .order_by(Message.timestamp.desc())
        .limit(limit)
    ).all()
    
    response_messages = []
    for msg in messages:
        score = sum(v.value for v in msg.votes) if msg.votes else 0
        user_vote = next((v.value for v in msg.votes if v.user_id == current_user.id), 0) if msg.votes else 0
        user = session.get(User, msg.user_id)
        
        response_messages.append(MessageResponse(
            id=msg.id,
            content=msg.content,
            timestamp=msg.timestamp,
            user_id=msg.user_id,
            channel_id=msg.channel_id,
            user_email=user.email if user else None,
            user_profile_pic=user.profile_pic if user else None,
            score=score,
            user_vote=user_vote
        ))
    
    return list(reversed(response_messages))

@router.post("/channels/{channel_slug}/messages", response_model=MessageResponse)
async def create_message_by_slug(
    channel_slug: str,
    message_data: MessageCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a message in a channel by slug (legacy endpoint)."""
    channel = session.exec(select(Channel).where(Channel.slug == channel_slug)).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    db_message = Message(
        content=message_data.content,
        channel_id=channel.id,
        user_id=current_user.id
    )
    session.add(db_message)
    
    # Track stats (same as primary endpoint)
    current_user.total_messages += 1
    session.add(current_user)
    
    session.commit()
    session.refresh(db_message)
    
    # Award badges
    await check_and_award_badges(session, current_user)
    
    await manager.broadcast_all(
        {
            "type": "message",
            "id": db_message.id,
            "content": db_message.content,
            "user_id": db_message.user_id,
            "channel_id": db_message.channel_id,
            "timestamp": db_message.timestamp.isoformat(),
            "user_email": current_user.email
        }
    )
    
    return MessageResponse(
        id=db_message.id,
        content=db_message.content,
        timestamp=db_message.timestamp,
        user_id=db_message.user_id,
        channel_id=db_message.channel_id,
        user_email=current_user.email,
        user_profile_pic=current_user.profile_pic,
        score=0,
        user_vote=0
    )

@router.post("/channels/{channel_slug}/messages/{message_id}/vote", response_model=MessageResponse)
async def vote_message_by_slug(
    channel_slug: str,
    message_id: int,
    vote_value: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Vote on a message (legacy endpoint)."""
    channel = session.exec(select(Channel).where(Channel.slug == channel_slug)).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    message = session.get(Message, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
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
    
    score = sum(v.value for v in message.votes) if message.votes else 0
    user = session.get(User, message.user_id)
    
    await manager.broadcast_all(
        {
            "type": "vote_update",
            "message_id": message_id,
            "channel_id": channel.id,
            "score": score
        }
    )
    
    return MessageResponse(
        id=message.id,
        content=message.content,
        timestamp=message.timestamp,
        user_id=message.user_id,
        channel_id=message.channel_id,
        user_email=user.email if user else None,
        user_profile_pic=user.profile_pic if user else None,
        score=score,
        user_vote=vote_value
    )

@router.get("/users/online")
async def get_online_users(
    current_user: User = Depends(get_current_user)
):
    """Get list of online users."""
    return manager.online_users_list

# ==================== GAMIFICATION HELPER FUNCTIONS ====================

async def check_and_award_badges(session: Session, user: User):
    """Check if user qualifies for any new badges and award them."""
    # Get all badges user doesn't have yet
    user_badge_ids = [ub.badge_id for ub in session.exec(
        select(UserBadge).where(UserBadge.user_id == user.id)
    ).all()]
    
    all_badges = session.exec(select(Badge)).all()
    
    for badge in all_badges:
        if badge.id in user_badge_ids:
            continue  # Already has this badge
        
        qualified = False
        if badge.criteria_type == "reputation" and user.reputation_points >= badge.criteria_value:
            qualified = True
        elif badge.criteria_type == "messages" and user.total_messages >= badge.criteria_value:
            qualified = True
        elif badge.criteria_type == "upvotes" and user.helpful_votes >= badge.criteria_value:
            qualified = True
        
        if qualified:
            new_badge = UserBadge(user_id=user.id, badge_id=badge.id)
            session.add(new_badge)
    
    session.commit()

# ==================== GAMIFICATION ENDPOINTS ====================

@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    limit: int = 20,
    period: str = "all_time",  # "weekly", "monthly", "all_time"
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get the community leaderboard sorted by reputation, filtered by period."""
    from datetime import datetime, timezone, timedelta
    
    # Build base query
    base_query = select(User).where(User.is_active == True)
    
    # Apply period filter: for weekly/monthly, filter by messages sent recently
    # We approximate by using reputation earned. True per-period tracking would
    # require a separate stats table; here we use the User fields directly.
    # For "all_time" we just rank by total reputation.
    # For weekly/monthly we rank by message count as a proxy (sent in period).
    # Full implementation: filter users who sent messages in the period.
    now = datetime.now(timezone.utc)
    
    if period == "this_week":
        since = now - timedelta(days=7)
        # Get user IDs who sent messages in the last 7 days
        active_user_ids = session.exec(
            select(Message.user_id)
            .where(Message.timestamp >= since)
            .distinct()
        ).all()
        base_query = base_query.where(User.id.in_(active_user_ids))
    elif period == "this_month":
        since = now - timedelta(days=30)
        active_user_ids = session.exec(
            select(Message.user_id)
            .where(Message.timestamp >= since)
            .distinct()
        ).all()
        base_query = base_query.where(User.id.in_(active_user_ids))
    
    users = session.exec(
        base_query.order_by(desc(User.reputation_points)).limit(limit)
    ).all()
    
    entries = []
    for rank, user in enumerate(users, 1):
        # Efficient badge count using COUNT
        badge_count = session.exec(
            select(func.count(UserBadge.id)).where(UserBadge.user_id == user.id)
        ).one()
        
        # Get top 3 badges (highest criteria_value = most prestigious)
        top_badge_rows = session.exec(
            select(Badge)
            .join(UserBadge, UserBadge.badge_id == Badge.id)
            .where(UserBadge.user_id == user.id)
            .order_by(desc(Badge.criteria_value))
            .limit(3)
        ).all()
        
        top_badges = [
            BadgeResponse(
                id=b.id,
                name=b.name,
                description=b.description,
                icon=b.icon,
                category=b.category,
                tier=b.tier
            ) for b in top_badge_rows
        ]
        
        entries.append(LeaderboardEntryResponse(
            rank=rank,
            user_id=user.id,
            email=user.email,
            profile_pic=user.profile_pic,
            reputation_points=user.reputation_points,
            total_messages=user.total_messages,
            helpful_votes=user.helpful_votes,
            badge_count=badge_count,
            top_badges=top_badges
        ))
    
    # Efficient total count
    total_users = session.exec(
        select(func.count(User.id)).where(User.is_active == True)
    ).one()
    
    return LeaderboardResponse(
        leaderboard=entries,
        total_users=total_users,
        period=period
    )

@router.get("/users/{user_id}/reputation", response_model=UserReputationResponse)
async def get_user_reputation(
    user_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a user's reputation details and badges."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's badges
    user_badges = session.exec(
        select(UserBadge).where(UserBadge.user_id == user_id)
    ).all()
    
    badges = []
    for ub in user_badges:
        badge = session.get(Badge, ub.badge_id)
        if badge:
            badges.append(BadgeResponse(
                id=badge.id,
                name=badge.name,
                description=badge.description,
                icon=badge.icon,
                category=badge.category,
                tier=badge.tier,
                earned_at=ub.earned_at
            ))
    
    # Efficient rank calculation using COUNT
    higher_ranked = session.exec(
        select(func.count(User.id))
        .where(User.reputation_points > user.reputation_points)
        .where(User.is_active == True)
    ).one()
    rank = higher_ranked + 1
    
    return UserReputationResponse(
        user_id=user.id,
        email=user.email,
        profile_pic=user.profile_pic,
        reputation_points=user.reputation_points,
        total_messages=user.total_messages,
        helpful_votes=user.helpful_votes,
        badges=badges,
        rank=rank
    )

@router.get("/users/me/reputation", response_model=UserReputationResponse)
async def get_my_reputation(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get current user's reputation details and badges."""
    return await get_user_reputation(current_user.id, session, current_user)

@router.get("/badges", response_model=List[BadgeResponse])
async def get_all_badges(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all available badges."""
    badges = session.exec(select(Badge)).all()
    return [
        BadgeResponse(
            id=b.id,
            name=b.name,
            description=b.description,
            icon=b.icon,
            category=b.category,
            tier=b.tier
        ) for b in badges
    ]

@router.post("/badges/seed", status_code=status.HTTP_201_CREATED)
async def seed_default_badges(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Seed default badges (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    default_badges = [
        # Reputation badges
        Badge(name="Rising Star", description="Earned 10 reputation points", icon="⭐", 
              category="reputation", criteria_type="reputation", criteria_value=10, tier="bronze"),
        Badge(name="Community Voice", description="Earned 50 reputation points", icon="🌟",
              category="reputation", criteria_type="reputation", criteria_value=50, tier="silver"),
        Badge(name="Top Contributor", description="Earned 100 reputation points", icon="💫",
              category="reputation", criteria_type="reputation", criteria_value=100, tier="gold"),
        Badge(name="Community Legend", description="Earned 500 reputation points", icon="🏆",
              category="reputation", criteria_type="reputation", criteria_value=500, tier="platinum"),
        
        # Helper badges (upvotes received)
        Badge(name="Helpful Hand", description="Received 5 upvotes on your answers", icon="🤝",
              category="helper", criteria_type="upvotes", criteria_value=5, tier="bronze"),
        Badge(name="Expert Mentor", description="Received 25 upvotes on your answers", icon="🎓",
              category="helper", criteria_type="upvotes", criteria_value=25, tier="silver"),
        Badge(name="Knowledge Guide", description="Received 100 upvotes on your answers", icon="📚",
              category="helper", criteria_type="upvotes", criteria_value=100, tier="gold"),
        
        # Participation badges
        Badge(name="First Words", description="Sent your first 10 messages", icon="💬",
              category="contributor", criteria_type="messages", criteria_value=10, tier="bronze"),
        Badge(name="Active Participant", description="Sent 50 messages", icon="🗣️",
              category="contributor", criteria_type="messages", criteria_value=50, tier="silver"),
        Badge(name="Conversation Master", description="Sent 200 messages", icon="🎤",
              category="contributor", criteria_type="messages", criteria_value=200, tier="gold"),
    ]
    
    added_count = 0
    for badge in default_badges:
        existing = session.exec(select(Badge).where(Badge.name == badge.name)).first()
        if not existing:
            session.add(badge)
            added_count += 1
    
    session.commit()
    return {"message": f"Seeded {added_count} new badges", "total_badges": len(default_badges)}

# ==================== STUDY GROUP ENDPOINTS ====================

@router.post("/communities/{community_id}/groups", response_model=StudyGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_study_group(
    community_id: str,
    group_data: StudyGroupCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new study group within a community."""
    community = session.get(Community, community_id)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    # Verify user is a member of the community
    membership = session.exec(
        select(CommunityMember)
        .where(CommunityMember.community_id == community_id)
        .where(CommunityMember.user_id == current_user.id)
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Must be a community member to create groups")
    
    study_group = StudyGroup(
        name=group_data.name,
        description=group_data.description,
        community_id=community_id,
        creator_id=current_user.id,
        is_public=group_data.is_public,
        max_members=group_data.max_members
    )
    session.add(study_group)
    session.commit()
    session.refresh(study_group)
    
    # Auto-add creator as leader
    leader_membership = StudyGroupMember(
        group_id=study_group.id,
        user_id=current_user.id,
        role="leader"
    )
    session.add(leader_membership)
    session.commit()
    
    # Create a private channel for the study group
    group_channel = Channel(
        name=f"🔒 {study_group.name}", # Visual indicator
        slug=f"group-{study_group.id}", # Unique slug
        description=f"Private channel for {study_group.name}",
        community_id=community_id,
        study_group_id=study_group.id,
        channel_type="text"
    )
    session.add(group_channel)
    session.commit()
    
    return StudyGroupResponse(
        id=study_group.id,
        name=study_group.name,
        description=study_group.description,
        community_id=study_group.community_id,
        creator_id=study_group.creator_id,
        is_public=study_group.is_public,
        max_members=study_group.max_members,
        created_at=study_group.created_at,
        member_count=1,
        is_member=True
    )

@router.get("/communities/{community_id}/groups", response_model=List[StudyGroupResponse])
async def get_community_study_groups(
    community_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all study groups in a community."""
    groups = session.exec(
        select(StudyGroup).where(StudyGroup.community_id == community_id)
    ).all()
    
    result = []
    for group in groups:
        # Count only approved members (not pending)
        member_count = session.exec(
            select(func.count(StudyGroupMember.id))
            .where(StudyGroupMember.group_id == group.id)
            .where(StudyGroupMember.status == "approved")
        ).one()
        
        is_member = session.exec(
            select(StudyGroupMember)
            .where(StudyGroupMember.group_id == group.id)
            .where(StudyGroupMember.user_id == current_user.id)
            .where(StudyGroupMember.status == "approved")
        ).first() is not None
        
        result.append(StudyGroupResponse(
            id=group.id,
            name=group.name,
            description=group.description,
            community_id=group.community_id,
            creator_id=group.creator_id,
            is_public=group.is_public,
            max_members=group.max_members,
            created_at=group.created_at,
            member_count=member_count,
            is_member=is_member
        ))
    
    return result

@router.get("/groups/{group_id}", response_model=StudyGroupDetailResponse)
async def get_study_group(
    group_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get details of a specific study group."""
    group = session.get(StudyGroup, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    
    members = session.exec(
        select(StudyGroupMember).where(StudyGroupMember.group_id == group_id)
    ).all()
    
    member_responses = []
    for member in members:
        user = session.get(User, member.user_id)
        member_responses.append(StudyGroupMemberResponse(
            id=member.id,
            user_id=member.user_id,
            user_email=user.email if user else None,
            user_profile_pic=user.profile_pic if user else None,
            role=member.role,
            status=member.status,
            joined_at=member.joined_at
        ))
    
    is_member = any(m.user_id == current_user.id for m in members)
    
    return StudyGroupDetailResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        community_id=group.community_id,
        creator_id=group.creator_id,
        is_public=group.is_public,
        max_members=group.max_members,
        created_at=group.created_at,
        member_count=len(members),
        is_member=is_member,
        members=member_responses
    )

@router.post("/groups/{group_id}/join")
async def join_study_group(
    group_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Join a study group."""
    group = session.get(StudyGroup, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    
    # Check if already a member
    existing = session.exec(
        select(StudyGroupMember)
        .where(StudyGroupMember.group_id == group_id)
        .where(StudyGroupMember.user_id == current_user.id)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already a member of this group")
    
    # Check member limit — count only approved members
    current_members = session.exec(
        select(func.count(StudyGroupMember.id))
        .where(StudyGroupMember.group_id == group_id)
        .where(StudyGroupMember.status == "approved")
    ).one()
    
    if current_members >= group.max_members:
        raise HTTPException(status_code=400, detail="Study group is full")
    
    # Check if group is public
    status = "approved"
    if not group.is_public:
        status = "pending"
        # raise HTTPException(status_code=403, detail="This is a private group")
    
    membership = StudyGroupMember(
        group_id=group_id,
        user_id=current_user.id,
        role="member",
        status=status
    )
    session.add(membership)
    session.commit()
    
    message = "Successfully joined study group" if status == "approved" else "Request to join sent"
    return {"message": message, "group_id": group_id, "status": status}

@router.put("/groups/{group_id}/members/{user_id}")
async def update_group_member_status(
    group_id: str,
    user_id: str,
    status_update: dict, # {"status": "approved"}
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update a member's status (approve join request) or role."""
    # Verify leader
    leader_membership = session.exec(
        select(StudyGroupMember)
        .where(StudyGroupMember.group_id == group_id)
        .where(StudyGroupMember.user_id == current_user.id)
        .where(StudyGroupMember.role == "leader")
    ).first()
    
    if not leader_membership:
        raise HTTPException(status_code=403, detail="Only leaders can update members")
        
    member = session.exec(
        select(StudyGroupMember)
        .where(StudyGroupMember.group_id == group_id)
        .where(StudyGroupMember.user_id == user_id)
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
        
    if "status" in status_update:
        member.status = status_update["status"]
    
    # helper for role updates later
    if "role" in status_update:
         member.role = status_update["role"]
         
    session.add(member)
    session.commit()
    
    return {"message": "Member updated successfully"}

@router.delete("/groups/{group_id}/leave")
async def leave_study_group(
    group_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Leave a study group."""
    membership = session.exec(
        select(StudyGroupMember)
        .where(StudyGroupMember.group_id == group_id)
        .where(StudyGroupMember.user_id == current_user.id)
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Not a member of this group")
    
    # Prevent leader from leaving (they must delete or transfer)
    if membership.role == "leader":
        raise HTTPException(status_code=400, detail="Group leader cannot leave. Delete the group or transfer leadership first.")
    
    session.delete(membership)
    session.commit()
    
    return {"message": "Successfully left study group"}

@router.delete("/groups/{group_id}/members/{user_id}")
async def remove_group_member(
    group_id: str,
    user_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Remove a member from a study group (leader only)."""
    # Get group to check leader
    group = session.get(StudyGroup, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
        
    # Verify current user is leader
    leader_membership = session.exec(
        select(StudyGroupMember)
        .where(StudyGroupMember.group_id == group_id)
        .where(StudyGroupMember.user_id == current_user.id)
        .where(StudyGroupMember.role == "leader")
    ).first()
    
    if not leader_membership:
        raise HTTPException(status_code=403, detail="Only group leaders can remove members")
    
    # Get member to remove
    member_to_remove = session.exec(
        select(StudyGroupMember)
        .where(StudyGroupMember.group_id == group_id)
        .where(StudyGroupMember.user_id == user_id)
    ).first()
    
    if not member_to_remove:
        raise HTTPException(status_code=404, detail="Member not found in this group")
        
    # Cannot remove self (use leave endpoint) or other leaders (if multiple leaders existed)
    if member_to_remove.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself. Use leave endpoint instead.")
        
    session.delete(member_to_remove)
    session.commit()
    
    return {"message": "Successfully removed member from group"}

@router.get("/users/me/groups", response_model=List[StudyGroupResponse])
async def get_my_study_groups(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all study groups the current user is a member of."""
    memberships = session.exec(
        select(StudyGroupMember).where(StudyGroupMember.user_id == current_user.id)
    ).all()
    
    result = []
    for membership in memberships:
        group = session.get(StudyGroup, membership.group_id)
        if group:
            member_count = session.exec(
                select(func.count(StudyGroupMember.id))
                .where(StudyGroupMember.group_id == group.id)
                .where(StudyGroupMember.status == "approved")
            ).one()
            
            result.append(StudyGroupResponse(
                id=group.id,
                name=group.name,
                description=group.description,
                community_id=group.community_id,
                creator_id=group.creator_id,
                is_public=group.is_public,
                max_members=group.max_members,
                created_at=group.created_at,
                member_count=member_count,
                is_member=True
            ))
    
    return result

# ==================== CHANNEL MANAGEMENT ====================

from pydantic import BaseModel as PydanticBaseModel

class ChannelUpdate(PydanticBaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

@router.put("/channels/{channel_id}", response_model=ChannelResponse)
async def update_channel(
    channel_id: str,
    update_data: ChannelUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Rename or update a channel (community owner/admin only)."""
    channel = session.get(Channel, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    if channel.community_id:
        membership = session.exec(
            select(CommunityMember)
            .where(CommunityMember.community_id == channel.community_id)
            .where(CommunityMember.user_id == current_user.id)
            .where(CommunityMember.role.in_(["owner", "admin"]))
        ).first()
        if not membership:
            raise HTTPException(status_code=403, detail="Only community owners and admins can rename channels")
    
    if update_data.name:
        channel.name = update_data.name
        channel.slug = update_data.name.lower().replace(" ", "-")
    if update_data.description is not None:
        channel.description = update_data.description
    
    session.add(channel)
    session.commit()
    session.refresh(channel)
    
    return ChannelResponse(
        id=channel.id,
        name=channel.name,
        slug=channel.slug,
        description=channel.description,
        channel_type=channel.channel_type,
        community_id=channel.community_id,
        study_group_id=channel.study_group_id
    )

@router.delete("/channels/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_channel(
    channel_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a channel and all its messages (community owner/admin only)."""
    channel = session.get(Channel, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    if channel.community_id:
        membership = session.exec(
            select(CommunityMember)
            .where(CommunityMember.community_id == channel.community_id)
            .where(CommunityMember.user_id == current_user.id)
            .where(CommunityMember.role.in_(["owner", "admin"]))
        ).first()
        if not membership:
            raise HTTPException(status_code=403, detail="Only community owners and admins can delete channels")
    
    # Delete all messages and their votes
    messages = session.exec(select(Message).where(Message.channel_id == channel_id)).all()
    for msg in messages:
        votes = session.exec(select(MessageVote).where(MessageVote.message_id == msg.id)).all()
        for v in votes:
            session.delete(v)
        session.delete(msg)
    
    # Delete shared notes in this channel
    notes = session.exec(select(SharedNote).where(SharedNote.channel_id == channel_id)).all()
    for note in notes:
        session.delete(note)
    
    session.delete(channel)
    session.commit()

# ==================== STUDY GROUP MANAGEMENT ====================

class StudyGroupUpdate(PydanticBaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    max_members: Optional[int] = None

@router.put("/groups/{group_id}", response_model=StudyGroupResponse)
async def update_study_group(
    group_id: str,
    update_data: StudyGroupUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update study group info (leader only)."""
    group = session.get(StudyGroup, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    
    leader = session.exec(
        select(StudyGroupMember)
        .where(StudyGroupMember.group_id == group_id)
        .where(StudyGroupMember.user_id == current_user.id)
        .where(StudyGroupMember.role == "leader")
    ).first()
    if not leader:
        raise HTTPException(status_code=403, detail="Only the group leader can edit group details")
    
    if update_data.name is not None: group.name = update_data.name
    if update_data.description is not None: group.description = update_data.description
    if update_data.is_public is not None: group.is_public = update_data.is_public
    if update_data.max_members is not None: group.max_members = update_data.max_members
    
    session.add(group)
    session.commit()
    session.refresh(group)
    
    member_count = session.exec(
        select(func.count(StudyGroupMember.id))
        .where(StudyGroupMember.group_id == group_id)
        .where(StudyGroupMember.status == "approved")
    ).one()
    
    return StudyGroupResponse(
        id=group.id, name=group.name, description=group.description,
        community_id=group.community_id, creator_id=group.creator_id,
        is_public=group.is_public, max_members=group.max_members,
        created_at=group.created_at, member_count=member_count, is_member=True
    )

@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_study_group(
    group_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a study group (leader only). Also removes the private channel."""
    group = session.get(StudyGroup, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
    
    leader = session.exec(
        select(StudyGroupMember)
        .where(StudyGroupMember.group_id == group_id)
        .where(StudyGroupMember.user_id == current_user.id)
        .where(StudyGroupMember.role == "leader")
    ).first()
    if not leader:
        raise HTTPException(status_code=403, detail="Only the group leader can delete the group")
    
    # Delete all memberships
    members = session.exec(select(StudyGroupMember).where(StudyGroupMember.group_id == group_id)).all()
    for m in members:
        session.delete(m)
    
    # Delete private channel and its messages
    group_channel = session.exec(
        select(Channel).where(Channel.study_group_id == group_id)
    ).first()
    if group_channel:
        msgs = session.exec(select(Message).where(Message.channel_id == group_channel.id)).all()
        for msg in msgs:
            votes = session.exec(select(MessageVote).where(MessageVote.message_id == msg.id)).all()
            for v in votes: session.delete(v)
            session.delete(msg)
        session.delete(group_channel)
    
    session.delete(group)
    session.commit()

# ==================== SHARED NOTES ENDPOINTS ====================

@router.get("/channels/{channel_id}/notes", response_model=List[SharedNoteResponse])
async def get_channel_notes(
    channel_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all shared notes for a channel."""
    channel = session.get(Channel, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    notes = session.exec(
        select(SharedNote)
        .where(SharedNote.channel_id == channel_id)
        .order_by(desc(SharedNote.updated_at))
    ).all()
    
    result = []
    for note in notes:
        creator = session.get(User, note.created_by)
        result.append(SharedNoteResponse(
            id=note.id,
            title=note.title,
            content=note.content or "",
            channel_id=note.channel_id,
            created_by=note.created_by,
            updated_at=note.updated_at,
            version=note.version,
            creator_email=creator.email if creator else None
        ))
    return result

@router.post("/channels/{channel_id}/notes", response_model=SharedNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_channel_note(
    channel_id: str,
    note_data: SharedNoteCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new shared note in a channel."""
    from datetime import datetime, timezone
    channel = session.get(Channel, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    note = SharedNote(
        title=note_data.title,
        content=note_data.content or "",
        channel_id=channel_id,
        created_by=current_user.id,
        updated_at=datetime.now(timezone.utc),
        version=1
    )
    session.add(note)
    session.commit()
    session.refresh(note)
    
    return SharedNoteResponse(
        id=note.id, title=note.title, content=note.content or "",
        channel_id=note.channel_id, created_by=note.created_by,
        updated_at=note.updated_at, version=note.version,
        creator_email=current_user.email
    )

@router.put("/notes/{note_id}", response_model=SharedNoteResponse)
async def update_channel_note(
    note_id: str,
    update_data: SharedNoteUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update a shared note (optimistic locking via version)."""
    from datetime import datetime, timezone
    note = session.get(SharedNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Optimistic locking: reject if client's version doesn't match current
    if update_data.version != note.version:
        raise HTTPException(
            status_code=409,
            detail="Version conflict: note was edited by someone else. Please refresh."
        )
    
    if update_data.title is not None: note.title = update_data.title
    if update_data.content is not None: note.content = update_data.content
    note.version += 1
    note.updated_at = datetime.now(timezone.utc)
    
    session.add(note)
    session.commit()
    session.refresh(note)
    
    creator = session.get(User, note.created_by)
    return SharedNoteResponse(
        id=note.id, title=note.title, content=note.content or "",
        channel_id=note.channel_id, created_by=note.created_by,
        updated_at=note.updated_at, version=note.version,
        creator_email=creator.email if creator else None
    )

# ==================== PEER REVIEW ENDPOINTS ====================

@router.get("/channels/{channel_id}/submissions", response_model=List[PeerReviewSubmissionResponse])
async def get_channel_submissions(
    channel_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all peer review submissions for a channel."""
    channel = session.get(Channel, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    submissions = session.exec(
        select(PeerReviewSubmission)
        .where(PeerReviewSubmission.channel_id == channel_id)
        .order_by(desc(PeerReviewSubmission.created_at))
    ).all()
    
    result = []
    for sub in submissions:
        author = session.get(User, sub.author_id)
        fb_count = session.exec(
            select(func.count(PeerReviewFeedback.id))
            .where(PeerReviewFeedback.submission_id == sub.id)
        ).one()
        avg_rating = session.exec(
            select(func.avg(PeerReviewFeedback.rating))
            .where(PeerReviewFeedback.submission_id == sub.id)
        ).one()
        result.append(PeerReviewSubmissionResponse(
            id=sub.id, channel_id=sub.channel_id, author_id=sub.author_id,
            author_email=author.email if author else None,
            title=sub.title, content=sub.content, file_url=sub.file_url,
            created_at=sub.created_at,
            feedback_count=fb_count,
            average_rating=float(avg_rating) if avg_rating else None
        ))
    return result

@router.post("/channels/{channel_id}/submissions", response_model=PeerReviewSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    channel_id: str,
    data: PeerReviewSubmissionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Submit work for peer review."""
    channel = session.get(Channel, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    submission = PeerReviewSubmission(
        channel_id=channel_id,
        author_id=current_user.id,
        title=data.title,
        content=data.content,
        file_url=data.file_url
    )
    session.add(submission)
    session.commit()
    session.refresh(submission)
    
    return PeerReviewSubmissionResponse(
        id=submission.id, channel_id=submission.channel_id,
        author_id=submission.author_id, author_email=current_user.email,
        title=submission.title, content=submission.content,
        file_url=submission.file_url, created_at=submission.created_at,
        feedback_count=0, average_rating=None
    )

@router.get("/submissions/{submission_id}/feedback", response_model=List[PeerReviewFeedbackResponse])
async def get_submission_feedback(
    submission_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all feedback for a submission."""
    submission = session.get(PeerReviewSubmission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    feedbacks = session.exec(
        select(PeerReviewFeedback)
        .where(PeerReviewFeedback.submission_id == submission_id)
        .order_by(desc(PeerReviewFeedback.created_at))
    ).all()
    
    result = []
    for fb in feedbacks:
        reviewer = session.get(User, fb.reviewer_id)
        result.append(PeerReviewFeedbackResponse(
            id=fb.id, submission_id=fb.submission_id, reviewer_id=fb.reviewer_id,
            reviewer_email=reviewer.email if reviewer else None,
            rating=fb.rating, comments=fb.comments, created_at=fb.created_at
        ))
    return result

@router.post("/submissions/{submission_id}/feedback", response_model=PeerReviewFeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    submission_id: str,
    data: PeerReviewFeedbackCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Submit feedback on a peer review submission."""
    submission = session.get(PeerReviewSubmission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Cannot review your own submission
    if submission.author_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot review your own submission")
    
    # Cannot submit duplicate feedback
    existing = session.exec(
        select(PeerReviewFeedback)
        .where(PeerReviewFeedback.submission_id == submission_id)
        .where(PeerReviewFeedback.reviewer_id == current_user.id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this submission")
    
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    feedback = PeerReviewFeedback(
        submission_id=submission_id,
        reviewer_id=current_user.id,
        rating=data.rating,
        comments=data.comments
    )
    session.add(feedback)
    session.commit()
    session.refresh(feedback)
    
    return PeerReviewFeedbackResponse(
        id=feedback.id, submission_id=feedback.submission_id,
        reviewer_id=feedback.reviewer_id, reviewer_email=current_user.email,
        rating=feedback.rating, comments=feedback.comments, created_at=feedback.created_at
    )
