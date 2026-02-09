import os
import sys
from sqlmodel import create_engine, text
from dotenv import load_dotenv

# Add the parent directory to sys.path to allow importing from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("DATABASE_URL not found in environment variables.")
    sys.exit(1)

print(f"Connecting to database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'local/sqlite'}")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        # Check if column exists in user table (Postgres/SQLite compatible check)
        # Note: This is a simplified check. Ideally use Alembic.
        
        # Check for user table
        try:
            result = connection.execute(text("SELECT profile_pic FROM user LIMIT 1"))
            print("Column 'profile_pic' already exists.")
        except Exception:
            print("Column 'profile_pic' likely missing. Attempting to add it...")
            try:
                # Rollback current transaction if any (needed for Postgres after error)
                if 'postgres' in DATABASE_URL:
                    connection.rollback()
                
                connection.execute(text("ALTER TABLE user ADD COLUMN profile_pic VARCHAR"))
                connection.commit()
                print("Successfully added 'profile_pic' column to 'user' table.")
            except Exception as e:
                print(f"Failed to add column: {e}")
                # Print more details if possible
                import traceback
                traceback.print_exc()

except Exception as e:
    print(f"Database connection failed: {e}")
