from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict
import os
from dotenv import load_dotenv

# Load environment variables from .env file immediately
load_dotenv()

from uuid import uuid4
from datetime import datetime, timedelta, timezone 
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError, BaseModel, EmailStr

# Password hashing


# SQLModel imports
from sqlmodel import Field, Session, SQLModel, select
from .database import engine, create_db_and_tables, get_session

# --- IMPORTANT: Ensure you have a 'schemas.py' file in the same directory (app/)
from .schemas import (
    UserCreate, UserLogin, UserResponse, Token, User,
    Task, TaskCreate, TaskUpdate, TaskResponse,
    SessionLog, SessionLogCreate, SessionLogResponse,
    # Community Models
    Community, CommunityMember, Channel, Message, MessageVote,
    CommunityCreate, CommunityResponse, CommunityMemberResponse,
    ChannelCreate, ChannelResponse, MessageCreate, MessageResponse,
    # DM Models
    DMConversation, DMMessage,
    DMConversationResponse, DMMessageCreate, DMMessageResponse,
)

# Import new routers
from .routes import community, websocket, flashcards, tutor, notes, reviews, subjects, users, system

# Load environment variables from .env file
load_dotenv()

# --- Configuration Settings ---
class Settings(BaseModel):
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-for-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Prioritize DATABASE_URL from environment for production, fallback to SQLite for local dev
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./database.db") # Default to SQLite for local
    
    # FIX: Use FRONTEND_URLS to support local dev and live Render URL (comma-separated)
    FRONTEND_URLS: str = os.getenv("FRONTEND_URLS", "http://localhost:5173,http://localhost:3000") 

settings = Settings()

# --- Password Hashing Context ---
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") # Moved to .utils

# --- OAuth2PasswordBearer for token extraction ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# --- Password Utility Functions ---
from .utils import verify_password, get_password_hash

# --- JWT Utility Functions ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta # Use timezone.utc for consistency
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES) # Use timezone.utc for consistency
    to_encode.update({"exp": expire.timestamp()}) # Store as timestamp
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# --- Database Engine and Session Setup ---
# Imported from database.py to avoid circular imports

# --- Dependency to get the current user from the token ---
async def get_current_user(
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = session.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise credentials_exception
    return user


# --- FastAPI App Initialization ---
app = FastAPI(
    title="WorkShop Backend API",
    description="API for WorkShop SaaS application",
    version="0.1.0",
)

# --- CORS Configuration ---
# Convert the comma-separated string of FRONTEND_URLS into a list of strings
allowed_origins = [url.strip() for url in settings.FRONTEND_URLS.split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins, # Allow your frontend origin(s) from settings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- FastAPI Lifespan Events ---
@app.on_event("startup")
def on_startup():
    print("Application startup - Creating database tables...")
    create_db_and_tables()
    print("Database tables created/checked.")
    
    # Auto-promote a@gmail.com to admin
    with Session(engine) as session:
        admin_email = "a@gmail.com"
        user = session.exec(select(User).where(User.email == admin_email)).first()
        if user:
            if user.role != "admin":
                user.role = "admin"
                session.add(user)
                session.commit()
                print(f"User {admin_email} has been promoted to ADMIN.")
            else:
                print(f"User {admin_email} is already ADMIN.")
        else:
            print(f"Admin candidate {admin_email} not found. Register with this email to become admin.")

    print("Flashcards router loaded.")

from fastapi.staticfiles import StaticFiles

# --- Include New Routers ---
app.include_router(community.router)
app.include_router(websocket.router)
app.include_router(flashcards.router)
app.include_router(tutor.router)
app.include_router(notes.router)
app.include_router(reviews.router)
app.include_router(subjects.router)
app.include_router(users.router) # Include users router
app.include_router(system.router) # Include system router for KeepAlive

# --- Mount Static Files ---
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

# --- API Endpoints (Routes) ---

@app.get("/", summary="Root endpoint")
async def read_root():
    return {"message": "Welcome to the WorkShop Backend API!"}

@app.get("/api/message", response_model=Message, summary="Get a simple message")
async def get_simple_message():
    return {"content": "Hello from the FastAPI Python backend!"}

# --- User Authentication Endpoints (Using Database) ---

@app.post("/api/v1/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Register a new user")
async def register_user(user_data: UserCreate, session: Session = Depends(get_session)):
    """
    Registers a new user with the provided username, email and password, storing in the database.
    """
    existing_email = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
        
    existing_username = session.exec(select(User).where(User.username == user_data.username)).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken"
        )

    hashed_password = get_password_hash(user_data.password)

    db_user = User(
        id=str(uuid4()), # Generate a unique ID for the user
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        is_active=True # Default is_active to True
    )

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    return db_user

@app.post("/api/v1/auth/login", response_model=Token, summary="Login user and get access token")
async def login_for_access_token(user_data: UserLogin, session: Session = Depends(get_session)):
    print(f"Login attempt for: {user_data.username}")
    # Allow login with either username or email (flexible)
    user = session.exec(select(User).where(
        (User.username == user_data.username) | (User.email == user_data.username)
    )).first()
    
    if user:
        print(f"User found: {user.username}, Active: {user.is_active}")
    else:
        print("User not found via username/email search")

    if not user or not verify_password(user_data.password, user.hashed_password):
        print("Authentication failed: Invalid credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        print("Authentication failed: User inactive")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    # Store username in the subject
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/v1/users/me", response_model=UserResponse, summary="Get current authenticated user")
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Retrieves the details of the currently authenticated user. Requires a valid JWT token.
    """
    return current_user # current_user is already a User model instance from the database

# --- Pomodoro Session Logging Endpoint (NEW) ---
@app.post(
    "/api/v1/log/session", 
    response_model=SessionLogResponse, 
    status_code=status.HTTP_201_CREATED, 
    summary="Log a completed Pomodoro session for progress tracking"
)
async def log_pomodoro_session(
    log_data: SessionLogCreate, 
    current_user: User = Depends(get_current_user), # Requires authentication
    session: Session = Depends(get_session)
):
    """
    Accepts time spent (in minutes) and session type ('focus', 'short_break', 'long_break') 
    and saves the session log to the database linked to the current user.
    """
    if log_data.minutes_spent <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minutes spent must be greater than zero."
        )
        
    # Create the database record
    db_log = SessionLog(
        id=str(uuid4()),
        minutes_spent=log_data.minutes_spent,
        session_type=log_data.session_type,
        user_id=current_user.id, # Link to the current authenticated user's ID
        completion_time=datetime.now(timezone.utc)
    )

    session.add(db_log)
    session.commit()
    session.refresh(db_log)
    
    # Return the created log data
    return db_log


# --- Task Management Endpoints (Now using Database) ---

@app.post("/api/v1/tasks/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED, summary="Create a new task")
async def create_task(
    task: TaskCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session) # Add session dependency
):
    """
    Creates a new task for the current authenticated user and stores it in the database.
    """
    db_task = Task(
        title=task.title,
        description=task.description,
        completed=task.completed,
        priority=task.priority,
        due_date=task.due_date,
        owner_id=current_user.id, # Link task to the current user's ID
        created_at=datetime.now(timezone.utc) # Set creation time to UTC now
    )

    session.add(db_task)
    session.commit()
    session.refresh(db_task) # Refresh to get the auto-generated ID

    return db_task

@app.get("/api/v1/tasks/", response_model=List[TaskResponse], summary="Get all tasks for the current user")
async def get_user_tasks(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session) # Add session dependency
):
    """
    Retrieves all tasks belonging to the currently authenticated user from the database.
    """
    tasks = session.exec(
        select(Task).where(Task.owner_id == current_user.id)
    ).all()
    return tasks

@app.get("/api/v1/tasks/{task_id}", response_model=TaskResponse, summary="Get a single task by ID")
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session) # Add session dependency
):
    """
    Retrieves a single task by its ID, ensuring it belongs to the current user.
    """
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.owner_id == current_user.id)
    ).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or you don't have access to it"
        )
    return task

@app.put("/api/v1/tasks/{task_id}", response_model=TaskResponse, summary="Update an existing task")
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session) # Add session dependency
):
    """
    Updates an existing task for the current authenticated user.
    """
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.owner_id == current_user.id)
    ).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or you don't have access to it"
        )

    # Apply updates from task_update Pydantic model
    # Use exclude_unset=True to only update fields provided in the request
    task_data = task_update.model_dump(exclude_unset=True)
    for key, value in task_data.items():
        setattr(task, key, value)

    session.add(task) # Add the modified object back to the session
    session.commit() # Commit changes to the database
    session.refresh(task) # Refresh to load any potentially updated fields (like ORM defaults)

    return task

@app.delete("/api/v1/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a task")
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session) # Add session dependency
):
    """
    Deletes a task for the current authenticated user.
    """
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.owner_id == current_user.id)
    ).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or you don't have access to it"
        )

    session.delete(task)
    session.commit()
    # No return value for 204 No Content