from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import os
import sys
from sqlmodel import create_engine, text
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("DATABASE_URL not found in environment variables.")
    sys.exit(1)

print(
    f"Connecting to database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'local/sqlite'}"
)

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:

        try:
            result = connection.execute(text("SELECT profile_pic FROM user LIMIT 1"))
            print("Column 'profile_pic' already exists.")
        except Exception:
            print("Column 'profile_pic' likely missing. Attempting to add it...")
            try:

                if "postgres" in DATABASE_URL:
                    connection.rollback()

                connection.execute(
                    text("ALTER TABLE user ADD COLUMN profile_pic VARCHAR")
                )
                connection.commit()
                print("Successfully added 'profile_pic' column to 'user' table.")
            except Exception as e:
                print(f"Failed to add column: {e}")

                import traceback

                traceback.print_exc()

except Exception as e:
    print(f"Database connection failed: {e}")
