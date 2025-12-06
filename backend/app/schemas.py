from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship # Import Relationship
from pydantic import EmailStr, BaseModel
from datetime import datetime, date
from uuid import uuid4 # Import uuid4 for generating UUIDs

# --- User Models ---

# This is our database model for users
class User(SQLModel, table=True):
    id: Optional[str] = Field(default=None, primary_key=True, nullable=False) # Use str for UUIDs
    email: EmailStr = Field(unique=True, index=True) # Email must be unique and indexed for fast lookup
    hashed_password: str # Store the hashed password
    is_active: bool = Field(default=True) # Field is for SQLModel specific column options
    
    # NEW: Define relationship to SessionLog and Task
    sessions: List["SessionLog"] = Relationship(back_populates="user")
    tasks: List["Task"] = Relationship(back_populates="owner")
    messages: List["Message"] = Relationship(back_populates="user")
    messages: List["Message"] = Relationship(back_populates="user")
    # flashcard_sets: List["FlashcardSet"] = Relationship(back_populates="user") # Commented out legacy relationship


# Schema for user creation (what the frontend sends for registration)
class UserCreate(BaseModel): # Inherit from BaseModel for input validation
    email: EmailStr
    password: str

# Schema for user login (what the frontend sends for login)
class UserLogin(BaseModel): # Inherit from BaseModel
    email: EmailStr
    password: str

# Schema for user response (what the backend sends back after creation/retrieval)
class UserResponse(BaseModel): # Inherit from BaseModel for API response
    id: str
    email: EmailStr
    is_active: bool

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
    
    messages: List["Message"] = Relationship(back_populates="channel")

class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    channel_id: str = Field(foreign_key="channel.id", index=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    
    channel: Optional[Channel] = Relationship(back_populates="messages")
    user: Optional[User] = Relationship(back_populates="messages")
    votes: List["MessageVote"] = Relationship(back_populates="message")

class ChannelCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None

class ChannelResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None

class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: int
    content: str
    timestamp: datetime
    user_id: str
    channel_id: str
    user_email: Optional[str] = None
    
    # New fields for voting
    score: int = 0
    user_vote: int = 0 # 0 = none, 1 = upvote, -1 = downvote

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

class FlashcardCollectionDetailResponse(FlashcardCollectionResponse):
    cards: List[FlashcardCardResponse]

