"""
Migration script to add study_goal column to the User table.
Run this once: python migrate_study_goal.py
"""
import os
import sys
from sqlmodel import create_engine, text
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# For Supabase: bypass statement timeout by appending options
if "supabase" in DATABASE_URL or "pooler" in DATABASE_URL:
    print("NOTE: Supabase detected. For schema changes, please use the Supabase SQL Editor.")
    print("Run the contents of migrate_study_goal.sql in the Supabase SQL Editor instead.")
    print("File: backend/migrate_study_goal.sql")
    sys.exit(0)

print(f"Connecting to: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'local/sqlite'}")

NEW_COLUMNS = [
    ("study_goal", "VARCHAR"),
]

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        for col_name, col_def in NEW_COLUMNS:
            try:
                conn.execute(text(f'SELECT "{col_name}" FROM "user" LIMIT 1'))
                print(f"  Column '{col_name}' already exists. Skipping.")
            except Exception:
                try:
                    conn.rollback()
                except Exception:
                    pass
                try:
                    conn.execute(text(f'ALTER TABLE "user" ADD COLUMN "{col_name}" {col_def}'))
                    conn.commit()
                    print(f"  OK - Added column '{col_name}'")
                except Exception as e:
                    print(f"  FAIL - Failed to add column '{col_name}': {e}")
                    try:
                        conn.rollback()
                    except Exception:
                        pass

    print("\nMigration complete.")

except Exception as e:
    print(f"Database connection failed: {e}")
    import traceback
    traceback.print_exc()
