import sys
import os

# Add current directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import create_db_and_tables
from create_admin import create_admin_user
from seed_from_text import main as seed_content

def main():
    print("=== Supabase/Database Setup ===\n")
    
    print("1. Creating database tables...")
    try:
        create_db_and_tables()
        print("   Tables created successfully.")
    except Exception as e:
        print(f"   Error creating tables: {e}")
        # We might continue if it's just that they already exist, 
        # but usually SQLModel matches them up.
        
    print("\n2. Creating Admin User...")
    try:
        # Using default credentials found in previous scripts for consistency
        create_admin_user("admin", "a@gmail.com", "admin123")
    except Exception as e:
        print(f"   Error creating admin: {e}")

    print("\n3. Seeding Content (Subjects/Topics/Papers)...")
    try:
        seed_content()
    except Exception as e:
        print(f"   Error seeding content: {e}")

    print("\n=== Setup Complete! ===")
    print("You can now start the backend with: uvicorn app.main:app --reload")

if __name__ == "__main__":
    main()
