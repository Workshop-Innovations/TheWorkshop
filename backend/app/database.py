"""
Database configuration and session management.
Separated from main.py to avoid circular imports with route modules.
"""
import os
from sqlmodel import Session, SQLModel, create_engine

# --- Configuration ---
# --- Configuration ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

# Fix for Heroku/Supabase postgres:// URLs
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Use connect_args for SQLite to allow multiple threads to access the database
# Only apply to SQLite, which is for local development
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, echo=True, connect_args=connect_args)

def create_db_and_tables():
    """Creates all tables defined as SQLModel(table=True)"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency to get a database session"""
    with Session(engine) as session:
        yield session
