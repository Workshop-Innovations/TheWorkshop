"""
Migration script to add subscription and usage limit columns to the User table.
Run this once: python migrate_subscriptions.py
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
# This allows ALTER TABLE to run through the pooler
if "supabase" in DATABASE_URL or "pooler" in DATABASE_URL:
    print("NOTE: Supabase detected. For schema changes, please use the Supabase SQL Editor.")
    print("Run the contents of migrate_subscriptions.sql in the Supabase SQL Editor instead.")
    print("File: backend/migrate_subscriptions.sql")
    sys.exit(0)

print(f"Connecting to: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'local/sqlite'}")

NEW_COLUMNS = [
    ("subscription_tier",       "VARCHAR DEFAULT 'basic'"),
    ("subscription_expiry",     "DATETIME"),
    ("paystack_customer_id",    "VARCHAR"),
    ("paystack_subscription_code", "VARCHAR"),
    ("ai_queries_today",        "INTEGER DEFAULT 0"),
    ("last_ai_query_date",      "DATE"),
]

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        for col_name, col_def in NEW_COLUMNS:
            # Check if column already exists
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
