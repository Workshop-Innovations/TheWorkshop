"""
Database configuration and session management.
Separated from main.py to avoid circular imports with route modules.
"""
import os
import logging
from sqlmodel import Session, SQLModel, create_engine

logger = logging.getLogger(__name__)

# --- Configuration ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

# Fix for Heroku/Supabase postgres:// URLs
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

IS_SQLITE = DATABASE_URL.startswith("sqlite")

# echo=False in production to avoid logging every SQL statement
_echo = os.getenv("SQL_ECHO", "false").lower() == "true"

if IS_SQLITE:
    # Local development: allow the connection to be shared across threads
    engine = create_engine(DATABASE_URL, echo=_echo, connect_args={"check_same_thread": False})
else:
    # Explicit pool sizing. The ceiling is per process, so with gunicorn's 4 workers
    # the defaults allow 4 x (5 + 5) = 40 connections, inside Supabase's free-tier
    # limit (~60) with room for migrations/dashboards. Tune with env vars if needed.
    engine = create_engine(
        DATABASE_URL,
        echo=_echo,
        pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "5")),
        pool_timeout=30,      # seconds to wait for a free connection before erroring
        pool_pre_ping=True,   # test connections before use; Supabase drops idle ones
        pool_recycle=300,     # replace connections older than 5 minutes
    )


def create_db_and_tables():
    """Creates all tables defined as SQLModel(table=True), then applies small
    schema upgrades that create_all() can't do on existing tables."""
    SQLModel.metadata.create_all(engine)
    _apply_migrations()


# Columns added after the tables first shipped: (table, column, SQL type + default)
_NEW_COLUMNS = [
    # Existing accounts predate verification, so they default to verified
    ("user", "email_verified", "BOOLEAN NOT NULL DEFAULT TRUE"),
    # Soft deletes: a timestamp instead of removing the row
    ("message", "deleted_at", "TIMESTAMP NULL"),
    ("sharednote", "deleted_at", "TIMESTAMP NULL"),
    ("studygroup", "deleted_at", "TIMESTAMP NULL"),
    # Lets the same finished pomodoro be logged from two devices without double-counting
    ("sessionlog", "session_key", "VARCHAR(64) NULL"),
]

# Composite indexes for the most common query shapes: (name, table, columns)
_NEW_INDEXES = [
    ("ix_message_channel_timestamp", "message", "channel_id, timestamp"),
    ("ix_dmmessage_conversation_timestamp", "dmmessage", "conversation_id, timestamp"),
    ("ix_messagevote_user_message", "messagevote", "user_id, message_id"),
    ("ix_sessionlog_user_completion", "sessionlog", "user_id, completion_time"),
    ("ix_sessionlog_user_session_key", "sessionlog", "user_id, session_key"),
]


def _apply_migrations():
    """
    Idempotent schema upgrades, safe to run on every startup and from several
    gunicorn workers at once (each statement tolerates "already exists").
    """
    from sqlalchemy import inspect, text

    is_pg = engine.dialect.name == "postgresql"
    inspector = inspect(engine)

    for table, column, ddl in _NEW_COLUMNS:
        if not inspector.has_table(table):
            continue
        if column in {c["name"] for c in inspector.get_columns(table)}:
            continue
        if_not_exists = "IF NOT EXISTS " if is_pg else ""
        try:
            with engine.begin() as conn:
                conn.execute(text(f'ALTER TABLE "{table}" ADD COLUMN {if_not_exists}{column} {ddl}'))
            logger.info("Added column %s.%s", table, column)
        except Exception:
            # Another worker added it first
            if column not in {c["name"] for c in inspect(engine).get_columns(table)}:
                raise

    for name, table, columns in _NEW_INDEXES:
        if not inspector.has_table(table):
            continue
        try:
            with engine.begin() as conn:
                conn.execute(text(f'CREATE INDEX IF NOT EXISTS {name} ON "{table}" ({columns})'))
        except Exception:
            logger.exception("Could not create index %s", name)


def get_session():
    """Dependency to get a database session"""
    with Session(engine) as session:
        yield session
