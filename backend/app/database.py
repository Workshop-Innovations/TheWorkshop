"""
Database configuration and session management.
Separated from main.py to avoid circular imports with route modules.
"""

import os
from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

_echo = os.getenv("SQL_ECHO", "false").lower() == "true"
engine = create_engine(DATABASE_URL, echo=_echo, connect_args=connect_args)


def create_db_and_tables():
    """Creates all tables defined as SQLModel(table=True)"""
    from . import models  # noqa: F401 - register all SQLModel tables before create_all

    SQLModel.metadata.create_all(engine)


def get_session():
    """Dependency to get a database session"""
    with Session(engine) as session:
        yield session
