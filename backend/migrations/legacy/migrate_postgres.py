from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
"""
Migration script to add profile_pic column to the user table in PostgreSQL.
Run this script with your DATABASE_URL environment variable set to your Render PostgreSQL URL.
"""
import os
import sys
from sqlalchemy import create_engine, text, inspect

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    print("\nUsage:")
    print("  Set DATABASE_URL to your Render PostgreSQL connection string, then run:")
    print("  python add_profile_pic_postgres.py")
    sys.exit(1)

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

try:
    print(f"Connecting to database...")
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:

        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("user")]

        if "profile_pic" in columns:
            print(" Column 'profile_pic' already exists in 'user' table.")
        else:
            print("Adding 'profile_pic' column to 'user' table...")

            conn.execute(text('ALTER TABLE "user" ADD COLUMN profile_pic TEXT'))
            conn.commit()

            print(" Column 'profile_pic' added successfully!")

        print("\nChecking for gamification columns...")
        expected_columns = ["reputation_points", "total_messages", "helpful_votes"]
        missing_columns = [col for col in expected_columns if col not in columns]

        if missing_columns:
            print(f"  Missing columns: {', '.join(missing_columns)}")
            print("Adding missing columns...")

            for col in missing_columns:
                conn.execute(
                    text(f'ALTER TABLE "user" ADD COLUMN {col} INTEGER DEFAULT 0')
                )

            conn.commit()
            print(" All gamification columns added!")
        else:
            print(" All gamification columns exist!")

except Exception as e:
    print(f"\n Error: {e}")
    print("\nMake sure:")
    print("  1. Your DATABASE_URL is correct")
    print("  2. The database is accessible")
    print("  3. The 'user' table exists")
    sys.exit(1)

print("\n Migration completed successfully!")
