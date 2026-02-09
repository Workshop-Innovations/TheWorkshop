from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship # Import Relationship
from pydantic import EmailStr, BaseModel
from datetime import datetime, date
from uuid import uuid4 # Import uuid4 for generating UUIDs

# --- User Models ---

# This is our database model for users
class User(SQLModel, table=True):
    id: Optional[str] = Field(default=None, primary_key=True, nullable=False) # Use str for UUIDs
    username: str = Field(unique=True, index=True) # Username must be unique
    email: EmailStr = Field(unique=True, index=True) # Email must be unique
    hashed_password: str # Store the hashed password
    is_active: bool = Field(default=True) # Field is for SQLModel specific column options
    role: str = Field(default="user") # "user" or "admin"
    profile_pic: Optional[str] = Field(default=None) # URL or Base64 string of profile picture
    
    # Gamification fields
    reputation_points: int = Field(default=0)  # Karma from upvotes received
    total_messages: int = Field(default=0)  # Total messages sent
    helpful_votes: int = Field(default=0)  # How many times user's content was upvoted
    
    # Relationships
    sessions: List["SessionLog"] = Relationship(back_populates="user")
    tasks: List["Task"] = Relationship(back_populates="owner")
    messages: List["Message"] = Relationship(back_populates="user")
    user_badges: List["UserBadge"] = Relationship(back_populates="user")
    # flashcard_sets: List["FlashcardSet"] = Relationship(back_populates="user") # Commented out legacy relationship


# Schema for user creation (what the frontend sends for registration)
class UserCreate(BaseModel): # Inherit from BaseModel for input validation
    username: str
    email: EmailStr
    password: str

# Schema for user login (what the frontend sends for login)
class UserLogin(BaseModel): # Inherit from BaseModel
    username: str
    password: str

# Schema for user updates (what the frontend sends for updating profile)
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    profile_pic: Optional[str] = None

# Schema for user response (what the backend sends back after creation/retrieval)
class UserResponse(BaseModel): # Inherit from BaseModel for API response
    id: str
    username: str
    email: EmailStr
    is_active: bool
    role: str = "user"
    profile_pic: Optional[str] = None

    model_config = {"from_attributes": True}


# Schema for JWT token response
class Token(BaseModel): # Inherit from BaseModel
    access_token: str
    token_type: str = "bearer"

# Schema for generic messages (e.g., error messages)
class Message(BaseModel): # Inherit from BaseModel
    content: str

# --- Pomodoro Session Log Models (NEW) ---

class SessionLog(SQLModel, table=True):
    """Database model to store completed Pomodoro sessions for progress tracking."""
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    
    # Time spent in minutes for this session (e.g., 25 for a focus session)
    minutes_spent: int = Field(default=0, nullable=False)
    
    # Type of session: 'focus', 'short_break', or 'long_break'
    session_type: str = Field(nullable=False, max_length=20)
    
    # Timestamp when the session was completed (for daily grouping)
    completion_time: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    
    # Foreign Key to link the session log back to the User
    user_id: str = Field(foreign_key="user.id", index=True, nullable=False) 

    # Define relationship back to the User
    user: Optional[User] = Relationship(back_populates="sessions")

# Pydantic model for receiving data to create a log
class SessionLogCreate(BaseModel):
    minutes_spent: int
    session_type: str

# Pydantic model for responding with the created log
class SessionLogResponse(BaseModel):
    id: str
    minutes_spent: int
    session_type: str
    completion_time: datetime
    user_id: str
    
    model_config = {"from_attributes": True}

# --- Task Models ---

# This is our database model for tasks
class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True) # Auto-incrementing integer ID
    title: str = Field(index=True) # Index for faster lookup
    description: Optional[str] = None
    completed: bool = Field(default=False)
    priority: str = Field(default="medium", max_length=50) # Added max_length
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False) # Store creation time
    due_date: Optional[datetime] = None # Can be null

    # Foreign key relationship to User
    owner_id: str = Field(foreign_key="user.id", index=True, nullable=False) # Link to User.id

    # Optional: If you want to load the owner object directly
    owner: Optional[User] = Relationship(back_populates="tasks") # Changed relationship name to 'owner' for clarity

# Schema for creating a task (what the frontend sends for creating a task)
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    completed: Optional[bool] = False
    priority: Optional[str] = "medium"
    due_date: Optional[datetime] = None # Use datetime for consistency

# Schema for updating a task (what the frontend sends for updating a task)
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None

# Schema for responding with a task (what the backend sends back)
class TaskResponse(BaseModel): # Use TaskResponse for clarity instead of TaskInDB
    id: int
    title: str
    description: Optional[str] = None
    completed: bool
    priority: str
    created_at: datetime
    due_date: Optional[datetime] = None
    owner_id: str # Include owner_id in the response

    model_config = {"from_attributes": True} # Enable Pydantic to read from ORM models

# --- Community / Chat Models ---

from sqlalchemy import Column, String

# NEW: Community (like a Discord Server)
class Community(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str = Field(index=True)
    icon: Optional[str] = None  # URL to icon image
    owner_id: str = Field(foreign_key="user.id", index=True)
    join_code: str = Field(default_factory=lambda: str(uuid4())[:8], unique=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    channels: List["Channel"] = Relationship(back_populates="community")
    members: List["CommunityMember"] = Relationship(back_populates="community")

# NEW: Community Membership (links users to communities)
class CommunityMember(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    community_id: str = Field(foreign_key="community.id", index=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    role: str = Field(default="member")  # "owner", "admin", "member"
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    
    community: Optional["Community"] = Relationship(back_populates="members")
    user: Optional[User] = Relationship()

class MessageVote(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    value: int # 1 for upvote, -1 for downvote
    
    user_id: str = Field(foreign_key="user.id", index=True)
    message_id: int = Field(foreign_key="message.id", index=True)
    
    user: Optional[User] = Relationship()
    message: Optional["Message"] = Relationship(back_populates="votes")

class Channel(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str = Field(index=True)
    slug: str = Field(unique=True, index=True)
    description: Optional[str] = None
    channel_type: str = Field(default="text")  # "text", "voice"
    community_id: Optional[str] = Field(default=None, foreign_key="community.id", index=True)
    study_group_id: Optional[str] = Field(default=None, foreign_key="studygroup.id", index=True)
    
    community: Optional["Community"] = Relationship(back_populates="channels")
    messages: List["Message"] = Relationship(back_populates="channel")

class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    channel_id: str = Field(foreign_key="channel.id", index=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    
    # Threading support
    parent_id: Optional[int] = Field(default=None, foreign_key="message.id", index=True)
    reply_count: int = Field(default=0)  # Number of direct replies
    
    channel: Optional[Channel] = Relationship(back_populates="messages")
    user: Optional[User] = Relationship(back_populates="messages")
    votes: List["MessageVote"] = Relationship(back_populates="message")

# --- Direct Message Models ---

class DMConversation(SQLModel, table=True):
    """A DM conversation between two users."""
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user1_id: str = Field(foreign_key="user.id", index=True)
    user2_id: str = Field(foreign_key="user.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    messages: List["DMMessage"] = Relationship(back_populates="conversation")

class DMMessage(SQLModel, table=True):
    """A message within a DM conversation."""
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    sender_id: str = Field(foreign_key="user.id", index=True)
    conversation_id: str = Field(foreign_key="dmconversation.id", index=True)
    
    conversation: Optional[DMConversation] = Relationship(back_populates="messages")

# --- Pydantic Schemas for Community ---

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

    model_config = {"from_attributes": True}

class MessageCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None  # For threaded replies

class MessageResponse(BaseModel):
    id: int
    content: str
    timestamp: datetime
    user_id: str
    channel_id: str
    user_email: Optional[str] = None
    
    # Voting fields
    score: int = 0
    user_vote: int = 0 # 0 = none, 1 = upvote, -1 = downvote
    
    # Threading fields
    parent_id: Optional[int] = None
    reply_count: int = 0

    model_config = {"from_attributes": True}

class ThreadResponse(BaseModel):
    """Response containing a parent message and its replies."""
    parent: MessageResponse
    replies: List[MessageResponse] = []
    total_replies: int = 0

# --- DM Pydantic Schemas ---

class DMConversationResponse(BaseModel):
    id: str
    other_user_id: str
    other_user_email: Optional[str] = None
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

class DMMessageCreate(BaseModel):
    content: str

class DMMessageResponse(BaseModel):
    id: int
    content: str
    timestamp: datetime
    sender_id: str
    sender_email: Optional[str] = None
    conversation_id: str
    
    model_config = {"from_attributes": True}

# --- Gamification Models ---

class Badge(SQLModel, table=True):
    """Badges that users can earn for achievements."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)  # e.g., "Top Contributor", "Streak Master"
    description: str  # What the badge is for
    icon: str = Field(default="🏆")  # Emoji or icon URL
    category: str = Field(default="general")  # general, contributor, helper, streak
    criteria_type: str  # "reputation", "messages", "upvotes", "streak"
    criteria_value: int  # Threshold to earn (e.g., 100 reputation points)
    tier: str = Field(default="bronze")  # bronze, silver, gold, platinum
    
    user_badges: List["UserBadge"] = Relationship(back_populates="badge")

class UserBadge(SQLModel, table=True):
    """Junction table for users and their earned badges."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    badge_id: int = Field(foreign_key="badge.id", index=True)
    earned_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: Optional["User"] = Relationship(back_populates="user_badges")
    badge: Optional["Badge"] = Relationship(back_populates="user_badges")

# --- Gamification Pydantic Schemas ---

class BadgeResponse(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    category: str
    tier: str
    earned_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

class UserReputationResponse(BaseModel):
    user_id: str
    email: str
    reputation_points: int
    total_messages: int
    helpful_votes: int
    badges: List[BadgeResponse] = []
    rank: int = 0
    
    model_config = {"from_attributes": True}

class LeaderboardEntryResponse(BaseModel):
    rank: int
    user_id: str
    email: str
    reputation_points: int
    total_messages: int
    helpful_votes: int
    badge_count: int = 0
    top_badge: Optional[str] = None
    
    model_config = {"from_attributes": True}

class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntryResponse]
    total_users: int
    period: str = "all_time"  # "weekly", "monthly", "all_time"

# --- Study Group Models ---

class StudyGroup(SQLModel, table=True):
    """A student-led study group within a community."""
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str = Field(index=True)
    description: Optional[str] = None
    community_id: str = Field(foreign_key="community.id", index=True)
    creator_id: str = Field(foreign_key="user.id", index=True)
    is_public: bool = Field(default=True)  # Can anyone join?
    max_members: int = Field(default=20)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    members: List["StudyGroupMember"] = Relationship(back_populates="group")

class StudyGroupMember(SQLModel, table=True):
    """Membership in a study group."""
    id: Optional[int] = Field(default=None, primary_key=True)
    group_id: str = Field(foreign_key="studygroup.id", index=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    role: str = Field(default="member")  # "leader", "moderator", "member"
    status: str = Field(default="approved") # "approved", "pending"
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    
    group: Optional["StudyGroup"] = Relationship(back_populates="members")
    user: Optional[User] = Relationship()

# --- Study Group Pydantic Schemas ---

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
    role: str
    status: str
    joined_at: datetime
    
    model_config = {"from_attributes": True}

class StudyGroupDetailResponse(StudyGroupResponse):
    members: List[StudyGroupMemberResponse] = []

# --- Shared Notes Models ---

class SharedNote(SQLModel, table=True):
    """Collaborative notes within a community channel."""
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    title: str
    content: str = Field(sa_column_kwargs={"default": ""}) # Markdown content
    channel_id: str = Field(foreign_key="channel.id", index=True)
    created_by: str = Field(foreign_key="user.id", index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    version: int = Field(default=1) # Optimistic locking
    
    # Relationships
    channel: Optional["Channel"] = Relationship()
    creator: Optional[User] = Relationship()

class SharedNoteCreate(BaseModel):
    title: str
    content: Optional[str] = ""

class SharedNoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    version: int # Required for optimistic locking

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

# --- Peer Review Models ---

class PeerReviewSubmission(SQLModel, table=True):
    """A submission of work for peer review."""
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    channel_id: str = Field(foreign_key="channel.id", index=True)
    author_id: str = Field(foreign_key="user.id", index=True)
    title: str
    content: Optional[str] = None # Description or text content
    file_url: Optional[str] = None # Link to external file/doc
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    author: Optional[User] = Relationship()
    feedback: List["PeerReviewFeedback"] = Relationship(back_populates="submission")

class PeerReviewFeedback(SQLModel, table=True):
    """Feedback on a peer review submission."""
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    submission_id: str = Field(foreign_key="peerreviewsubmission.id", index=True)
    reviewer_id: str = Field(foreign_key="user.id", index=True)
    rating: int = Field(ge=1, le=5) # 1-5 stars
    comments: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    submission: Optional[PeerReviewSubmission] = Relationship(back_populates="feedback")
    reviewer: Optional[User] = Relationship()

class PeerReviewSubmissionCreate(BaseModel):
    title: str
    content: Optional[str] = None
    file_url: Optional[str] = None

class PeerReviewFeedbackCreate(BaseModel):
    rating: int
    comments: str

class PeerReviewFeedbackResponse(BaseModel):
    id: str
    submission_id: str
    reviewer_id: str
    reviewer_email: Optional[str]
    rating: int
    comments: str
    created_at: datetime
    
    model_config = {"from_attributes": True}

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

# --- Flashcard Models ---

# Legacy Models (Renamed to avoid conflict, but kept for reference)
class FlashcardSetLegacy(SQLModel, table=True):
    __tablename__ = "flashcardset_legacy" # Explicit table name to avoid conflicts if needed
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    title: str
    category: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: str = Field(foreign_key="user.id", index=True)
    
    # user: Optional[User] = Relationship(back_populates="flashcard_sets") # Commented out to avoid relationship conflicts
    flashcards: List["FlashcardLegacy"] = Relationship(back_populates="flashcard_set")

class FlashcardLegacy(SQLModel, table=True):
    __tablename__ = "flashcard_legacy"
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    question: str
    answer: str
    set_id: str = Field(foreign_key="flashcardset_legacy.id", index=True)
    
    flashcard_set: Optional[FlashcardSetLegacy] = Relationship(back_populates="flashcards")



# Schema for Make.com response validation
class FlashcardContent(BaseModel):
    term: str
    definition: str


# Legacy Response Models (kept if needed for old endpoints, but updated references)
class FlashcardSetResponse(BaseModel):
    id: str
    title: str
    category: str
    created_at: datetime
    
    model_config = {"from_attributes": True}

class FlashcardLegacyResponse(BaseModel):
    id: str
    question: str
    answer: str
    
    model_config = {"from_attributes": True}

class FlashcardSetDetailResponse(FlashcardSetResponse):
    flashcards: List[FlashcardLegacyResponse]


# New SQLModel: FlashcardCollection
class FlashcardCollection(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    name: str = Field(nullable=False) # e.g., "Cards from Chemistry 101 Notes"
    file_source: str = Field(nullable=False) # The URL of the PDF/file used
    date_created: datetime = Field(default_factory=datetime.utcnow)
    
    cards: List["FlashcardCard"] = Relationship(back_populates="collection")

# New SQLModel: FlashcardCard (The individual Q/A pair)
class FlashcardCard(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    collection_id: str = Field(foreign_key="flashcardcollection.id", index=True)
    term: str = Field(nullable=False) # Question
    definition: str = Field(nullable=False) # Answer
    
    collection: Optional[FlashcardCollection] = Relationship(back_populates="cards")

# Schema for data sent from frontend to FastAPI
class FileGenerationRequest(BaseModel):
    file_url: str # The publicly accessible link to the PDF/document
    file_name: str # The name of the file (for collection naming)

class FlashcardCardResponse(BaseModel):
    id: str
    term: str
    definition: str
    
    model_config = {"from_attributes": True}

class FlashcardCollectionResponse(BaseModel):
    id: str
    name: str
    file_source: str
    date_created: datetime
    
    model_config = {"from_attributes": True}

    cards: List[FlashcardCardResponse]


# --- AI Tutor Models ---

class TutorDocument(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    filename: str
    content: str = Field(sa_column=Column(String)) # Use generic String, or Text for large content if supported by dialect
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TutorChatRequest(BaseModel):
    document_id: str
    message: str
    history: List[dict] = [] # List of {role: "user"|"model", parts: ["text"]}

class TutorChatResponse(BaseModel):
    response: str

# --- Subject and Past Paper Models ---

class Subject(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str = Field(index=True, unique=True)
    description: Optional[str] = None
    
    topics: List["Topic"] = Relationship(back_populates="subject")
    papers: List["PastPaper"] = Relationship(back_populates="subject")

# --- Subject Schemas ---

class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Topic(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    subject_id: str = Field(foreign_key="subject.id", index=True)
    title: str
    summary_content: str = Field(sa_column=Column(String)) # Markdown + LaTeX content
    order: int = Field(default=0) # For sorting topics
    
    subject: Optional[Subject] = Relationship(back_populates="topics")

# --- Topic Schemas ---

class TopicCreate(BaseModel):
    subject_id: str
    title: str
    summary_content: str
    order: Optional[int] = 0

class TopicUpdate(BaseModel):
    subject_id: Optional[str] = None
    title: Optional[str] = None
    summary_content: Optional[str] = None
    order: Optional[int] = None

class PastPaper(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    subject_id: str = Field(foreign_key="subject.id", index=True)
    title: str # e.g. "Mathematics 2023"
    year: str
    exam_type: str # WAEC, JAMB, NECO
    file_path: Optional[str] = None # e.g. "mathematics_2023.pdf" - relative to static/papers folder
    content: Optional[str] = Field(default=None, sa_column=Column(String)) # Markdown content for text-based papers
    
    subject: Optional[Subject] = Relationship(back_populates="papers")

# --- Past Paper Schemas ---

class PastPaperCreate(BaseModel):
    subject_id: str
    title: str
    year: str
    exam_type: str
    file_path: Optional[str] = None
    content: Optional[str] = None

class PastPaperUpdate(BaseModel):
    subject_id: Optional[str] = None
    title: Optional[str] = None
    year: Optional[str] = None
    exam_type: Optional[str] = None
    file_path: Optional[str] = None
    content: Optional[str] = None

# --- Subject/Paper Pydantic Schemas ---

class TopicSummaryResponse(BaseModel):
    id: str
    title: str
    order: int
    
    model_config = {"from_attributes": True}

class TopicResponse(BaseModel):
    id: str
    title: str
    summary_content: str
    order: int
    
    model_config = {"from_attributes": True}

class PastPaperResponse(BaseModel):
    id: str
    title: str
    year: str
    exam_type: str
    file_path: Optional[str] = None
    content: Optional[str] = None
    
    model_config = {"from_attributes": True}

class SubjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    topics: List[TopicSummaryResponse] = []
    papers: List[PastPaperResponse] = []
    
    model_config = {"from_attributes": True}



# --- System Models ---

class KeepAlive(SQLModel, table=True):
    """Table to be pinged by cron jobs to keep Supabase active."""
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
