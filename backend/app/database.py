from sqlmodel import create_engine, Session, SQLModel
from .config import settings

# --- Database Engine and Session Setup ---
# Use connect_args for SQLite to allow multiple threads to access the database
# Only apply to SQLite, which is for local development
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
engine = create_engine(settings.DATABASE_URL, echo=True, connect_args=connect_args)

def create_db_and_tables():
    # This function creates all tables defined as SQLModel(table=True)
    SQLModel.metadata.create_all(engine)

# Dependency to get a database session
def get_session():
    with Session(engine) as session:
        yield session
