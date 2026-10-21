import logging
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

from uuid import uuid4
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager

# SQLModel imports
from sqlmodel import Session, select
from sqlalchemy import func
from .database import engine, create_db_and_tables, get_session

from .models import (
    User,
    Task,
    SessionLog,
    Community,
    CommunityMember,
    Channel,
)
from .schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    GenericMessage,
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    SessionLogCreate,
    SessionLogResponse,
)

from .routes import (
    community,
    websocket,
    flashcards,
    tutor,
    subjects,
    users,
    system,
    subscriptions,
    upload,
    data_entry,
)
from .dependencies import get_current_user, settings, create_access_token

from .utils import verify_password, get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info("Application startup - Creating database tables...")
    create_db_and_tables()
    logger.info("Database tables created/checked.")

    with Session(engine) as session:
        user = session.exec(select(User).where(User.role == "admin")).first()

        workshop = session.exec(
            select(Community).where(Community.name == "The Workshop")
        ).first()
        if not workshop and user:
            workshop = Community(
                name="The Workshop",
                icon="",
                owner_id=user.id,
            )
            session.add(workshop)
            session.commit()
            session.refresh(workshop)

            if user:
                owner_membership = CommunityMember(
                    community_id=workshop.id, user_id=user.id, role="owner"
                )
                session.add(owner_membership)

            default_channels = [
                {"name": "welcome", "description": "Welcome to The Workshop!"},
                {"name": "announcements", "description": "Important announcements"},
                {"name": "general", "description": "General discussion"},
                {"name": "off-topic", "description": "Casual conversation"},
                {"name": "homework-help", "description": "Get help with homework"},
                {"name": "resource-sharing", "description": "Share useful resources"},
            ]
            for ch_data in default_channels:
                channel = Channel(
                    name=ch_data["name"],
                    slug=f"{workshop.id[:8]}-{ch_data['name']}",
                    description=ch_data["description"],
                    community_id=workshop.id,
                )
                session.add(channel)

            session.commit()
            logger.info("Created default community: The Workshop")
        elif workshop:
            logger.info("Default community 'The Workshop' already exists.")

        if workshop:
            all_users = session.exec(select(User)).all()
            existing_member_ids = {
                m.user_id
                for m in session.exec(
                    select(CommunityMember).where(
                        CommunityMember.community_id == workshop.id
                    )
                ).all()
            }
            added = 0
            for u in all_users:
                if u.id not in existing_member_ids:
                    session.add(
                        CommunityMember(
                            community_id=workshop.id,
                            user_id=u.id,
                            role="owner" if u.id == workshop.owner_id else "member",
                        )
                    )
                    added += 1
            if added:
                session.commit()
                logger.info(f"Backfilled {added} existing user(s) into The Workshop.")

    logger.info("All routers loaded. Application ready.")

    yield

    logger.info("Application shutdown.")


app = FastAPI(
    title="WorkShop Backend API",
    description="API for WorkShop SaaS application",
    version="0.1.0",
    lifespan=lifespan,
)

allowed_origins = [url.strip() for url in settings.FRONTEND_URLS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

app.include_router(community.router)
app.include_router(websocket.router)
app.include_router(flashcards.router)
app.include_router(tutor.router)
app.include_router(subjects.router)
app.include_router(users.router)
app.include_router(system.router)
app.include_router(subscriptions.router)
app.include_router(upload.router)
app.include_router(data_entry.router)

static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", summary="Root endpoint")
async def read_root():
    return {"message": "Welcome to the WorkShop Backend API!"}


@app.get("/api/message", response_model=GenericMessage, summary="Get a simple message")
async def get_simple_message():
    return {"content": "Hello from the FastAPI Python backend!"}


@app.post(
    "/api/v1/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register_user(user_data: UserCreate, session: Session = Depends(get_session)):
    """
    Registers a new user with the provided username, email and password, storing in the database.
    Auto-adds the user to The Workshop community.
    """
    existing_email = session.exec(
        select(User).where(User.email == user_data.email)
    ).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    existing_username = session.exec(
        select(User).where(User.username == user_data.username)
    ).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Username already taken"
        )

    hashed_password = get_password_hash(user_data.password)

    db_user = User(
        id=str(uuid4()),
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        study_goal=user_data.study_goal,
        is_active=True,
    )

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    workshop = session.exec(
        select(Community).where(Community.name == "The Workshop")
    ).first()
    if workshop:
        existing_member = session.exec(
            select(CommunityMember).where(
                CommunityMember.community_id == workshop.id,
                CommunityMember.user_id == db_user.id,
            )
        ).first()
        if not existing_member:
            membership = CommunityMember(
                community_id=workshop.id, user_id=db_user.id, role="member"
            )
            session.add(membership)
            session.commit()

    return db_user


@app.post(
    "/api/v1/auth/login",
    response_model=Token,
    summary="Login user and get access token",
)
async def login_for_access_token(
    user_data: UserLogin, session: Session = Depends(get_session)
):

    user = session.exec(
        select(User).where(
            (User.username == user_data.username) | (User.email == user_data.username)
        )
    ).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    access_token = create_access_token(
        data={"sub": user.username, "uid": user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get(
    "/api/v1/users/me",
    response_model=UserResponse,
    summary="Get current authenticated user",
)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Retrieves the details of the currently authenticated user. Requires a valid JWT token.
    """
    return current_user


@app.post(
    "/api/v1/log/session",
    response_model=SessionLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a completed Pomodoro session for progress tracking",
)
async def log_pomodoro_session(
    log_data: SessionLogCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Accepts time spent (in minutes) and session type ('focus', 'short_break', 'long_break')
    and saves the session log to the database linked to the current user.
    """
    if log_data.minutes_spent <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minutes spent must be greater than zero.",
        )

    db_log = SessionLog(
        id=str(uuid4()),
        minutes_spent=log_data.minutes_spent,
        session_type=log_data.session_type,
        user_id=current_user.id,
        completion_time=datetime.now(timezone.utc),
    )

    session.add(db_log)
    session.commit()
    session.refresh(db_log)

    return db_log


@app.get("/healthz", include_in_schema=False)
def health_check():
    """Process liveness only; no database writes or external service calls."""
    return {"status": "ok"}


@app.get("/api/v1/log/summary", summary="Get current user's focus totals")
def get_session_summary(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    count, minutes = session.exec(
        select(
            func.count(SessionLog.id),
            func.coalesce(func.sum(SessionLog.minutes_spent), 0),
        ).where(
            SessionLog.user_id == current_user.id,
            SessionLog.session_type.in_(["focus", "pomodoro"]),
        )
    ).one()
    return {"total_completed_sessions": count, "total_focus_minutes": minutes}


@app.get(
    "/api/v1/log/sessions",
    response_model=List[SessionLogResponse],
    summary="Get all session logs for the current user",
)
async def get_session_logs(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Retrieves all session logs for the current user, useful for progress tracking.
    """
    logs = session.exec(
        select(SessionLog).where(SessionLog.user_id == current_user.id)
    ).all()
    return logs


@app.post(
    "/api/v1/tasks/",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
)
async def create_task(
    task: TaskCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
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
        owner_id=current_user.id,
        created_at=datetime.now(timezone.utc),
    )

    session.add(db_task)
    session.commit()
    session.refresh(db_task)

    return db_task


@app.get(
    "/api/v1/tasks/",
    response_model=List[TaskResponse],
    summary="Get all tasks for the current user",
)
async def get_user_tasks(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Retrieves all tasks belonging to the currently authenticated user from the database.
    """
    tasks = session.exec(select(Task).where(Task.owner_id == current_user.id)).all()
    return tasks


@app.get(
    "/api/v1/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Get a single task by ID",
)
async def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
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
            detail="Task not found or you don't have access to it",
        )
    return task


@app.put(
    "/api/v1/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Update an existing task",
)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
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
            detail="Task not found or you don't have access to it",
        )

    task_data = task_update.model_dump(exclude_unset=True)
    for key, value in task_data.items():
        setattr(task, key, value)

    session.add(task)
    session.commit()
    session.refresh(task)

    return task


@app.delete(
    "/api/v1/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a task",
)
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
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
            detail="Task not found or you don't have access to it",
        )

    session.delete(task)
    session.commit()
