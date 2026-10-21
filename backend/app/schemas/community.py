from pydantic import Field
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, field_validator


class CommunityCreate(BaseModel):
    name: str
    icon: Optional[str] = None


class CommunityResponse(BaseModel):
    id: str
    name: str
    icon: Optional[str] = None
    owner_id: str
    join_code: str
    created_at: datetime
    member_count: int = 0

    model_config = {"from_attributes": True}


class CommunityMemberResponse(BaseModel):
    id: int
    user_id: str
    user_email: Optional[str] = None
    user_profile_pic: Optional[str] = None
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class ChannelCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    channel_type: str = "text"


class ChannelResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    channel_type: str = "text"
    community_id: Optional[str] = None
    study_group_id: Optional[str] = None

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

    @field_validator("content")
    @classmethod
    def validate_content(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty")
        if len(v) > 4000:
            raise ValueError("Message exceeds maximum length of 4000 characters")
        return v


class MessageResponse(BaseModel):
    id: int
    content: str
    timestamp: datetime
    user_id: str
    channel_id: str
    user_email: Optional[str] = None
    user_profile_pic: Optional[str] = None

    score: int = 0
    user_vote: int = 0

    parent_id: Optional[int] = None
    reply_count: int = 0

    model_config = {"from_attributes": True}


class ThreadResponse(BaseModel):
    """Response containing a parent message and its replies."""

    parent: MessageResponse
    replies: List[MessageResponse] = Field(default_factory=list)
    total_replies: int = 0


class DMConversationResponse(BaseModel):
    id: str
    other_user_id: str
    other_user_email: Optional[str] = None
    other_user_profile_pic: Optional[str] = None
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DMMessageCreate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty")
        if len(v) > 4000:
            raise ValueError("Message exceeds maximum length of 4000 characters")
        return v


class DMMessageResponse(BaseModel):
    id: int
    content: str
    timestamp: datetime
    sender_id: str
    sender_email: Optional[str] = None
    sender_profile_pic: Optional[str] = None
    conversation_id: str

    model_config = {"from_attributes": True}


class StudyGroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = True
    max_members: int = 20


class StudyGroupResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    community_id: str
    creator_id: str
    is_public: bool
    max_members: int
    created_at: datetime
    member_count: int = 0
    is_member: bool = False

    model_config = {"from_attributes": True}


class StudyGroupMemberResponse(BaseModel):
    id: int
    user_id: str
    user_email: Optional[str] = None
    user_profile_pic: Optional[str] = None
    role: str
    status: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class StudyGroupDetailResponse(StudyGroupResponse):
    members: List[StudyGroupMemberResponse] = Field(default_factory=list)


class SharedNoteCreate(BaseModel):
    title: str
    content: Optional[str] = ""


class SharedNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    version: int


class SharedNoteResponse(BaseModel):
    id: str
    title: str
    content: str
    channel_id: str
    created_by: str
    updated_at: datetime
    version: int
    creator_email: Optional[str] = None

    model_config = {"from_attributes": True}


class PeerReviewSubmissionCreate(BaseModel):
    title: str
    content: Optional[str] = None
    file_url: Optional[str] = None


class PeerReviewFeedbackCreate(BaseModel):
    rating: int
    comments: str


class PeerReviewSubmissionResponse(BaseModel):
    id: str
    channel_id: str
    author_id: str
    author_email: Optional[str]
    title: str
    content: Optional[str]
    file_url: Optional[str]
    created_at: datetime
    feedback_count: int = 0
    average_rating: Optional[float] = None

    model_config = {"from_attributes": True}


class PeerReviewFeedbackResponse(BaseModel):
    id: str
    submission_id: str
    reviewer_id: str
    reviewer_email: Optional[str]
    rating: int
    comments: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChannelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class StudyGroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    max_members: Optional[int] = None
