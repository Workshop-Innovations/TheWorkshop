from typing import Optional, List
from datetime import datetime, timezone
from uuid import uuid4
from sqlmodel import Field, SQLModel, Relationship

from ..models.users import User


class Community(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str = Field(index=True)
    icon: Optional[str] = None
    owner_id: str = Field(foreign_key="user.id", index=True)
    join_code: str = Field(
        default_factory=lambda: str(uuid4())[:8], unique=True, index=True
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    channels: List["Channel"] = Relationship(back_populates="community")
    members: List["CommunityMember"] = Relationship(back_populates="community")


class CommunityMember(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    community_id: str = Field(foreign_key="community.id", index=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    role: str = Field(default="member")
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    community: Optional["Community"] = Relationship(back_populates="members")
    user: Optional[User] = Relationship()


class MessageVote(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    value: int

    user_id: str = Field(foreign_key="user.id", index=True)
    message_id: int = Field(foreign_key="message.id", index=True)

    user: Optional[User] = Relationship()
    message: Optional["Message"] = Relationship(back_populates="votes")


class Channel(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str = Field(index=True)
    slug: str = Field(unique=True, index=True)
    description: Optional[str] = None
    channel_type: str = Field(default="text")
    community_id: Optional[str] = Field(
        default=None, foreign_key="community.id", index=True
    )
    study_group_id: Optional[str] = Field(
        default=None, foreign_key="studygroup.id", index=True
    )

    community: Optional["Community"] = Relationship(back_populates="channels")
    messages: List["Message"] = Relationship(back_populates="channel")


class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    channel_id: str = Field(foreign_key="channel.id", index=True)
    user_id: str = Field(foreign_key="user.id", index=True)

    parent_id: Optional[int] = Field(default=None, foreign_key="message.id", index=True)
    reply_count: int = Field(default=0)

    channel: Optional[Channel] = Relationship(back_populates="messages")
    user: Optional[User] = Relationship(back_populates="messages")
    votes: List["MessageVote"] = Relationship(back_populates="message")


class DMConversation(SQLModel, table=True):
    """A DM conversation between two users."""

    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user1_id: str = Field(foreign_key="user.id", index=True)
    user2_id: str = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    messages: List["DMMessage"] = Relationship(back_populates="conversation")


class DMMessage(SQLModel, table=True):
    """A message within a DM conversation."""

    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sender_id: str = Field(foreign_key="user.id", index=True)
    conversation_id: str = Field(foreign_key="dmconversation.id", index=True)

    conversation: Optional[DMConversation] = Relationship(back_populates="messages")


class StudyGroup(SQLModel, table=True):
    """A student-led study group within a community."""

    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str = Field(index=True)
    description: Optional[str] = None
    community_id: str = Field(foreign_key="community.id", index=True)
    creator_id: str = Field(foreign_key="user.id", index=True)
    is_public: bool = Field(default=True)
    max_members: int = Field(default=20)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    members: List["StudyGroupMember"] = Relationship(back_populates="group")


class StudyGroupMember(SQLModel, table=True):
    """Membership in a study group."""

    id: Optional[int] = Field(default=None, primary_key=True)
    group_id: str = Field(foreign_key="studygroup.id", index=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    role: str = Field(default="member")
    status: str = Field(default="approved")
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    group: Optional["StudyGroup"] = Relationship(back_populates="members")
    user: Optional[User] = Relationship()


class SharedNote(SQLModel, table=True):
    """Collaborative notes within a community channel."""

    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    title: str
    content: str = Field(sa_column_kwargs={"default": ""})
    channel_id: str = Field(foreign_key="channel.id", index=True)
    created_by: str = Field(foreign_key="user.id", index=True)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    version: int = Field(default=1)

    channel: Optional["Channel"] = Relationship()
    creator: Optional[User] = Relationship()


class PeerReviewSubmission(SQLModel, table=True):
    """A submission of work for peer review."""

    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    channel_id: str = Field(foreign_key="channel.id", index=True)
    author_id: str = Field(foreign_key="user.id", index=True)
    title: str
    content: Optional[str] = None
    file_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    author: Optional[User] = Relationship()
    feedback: List["PeerReviewFeedback"] = Relationship(back_populates="submission")


class PeerReviewFeedback(SQLModel, table=True):
    """Feedback on a peer review submission."""

    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    submission_id: str = Field(foreign_key="peerreviewsubmission.id", index=True)
    reviewer_id: str = Field(foreign_key="user.id", index=True)
    rating: int = Field(ge=1, le=5)
    comments: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    submission: Optional[PeerReviewSubmission] = Relationship(back_populates="feedback")
    reviewer: Optional[User] = Relationship()
