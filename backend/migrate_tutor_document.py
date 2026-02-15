"""
Migration script to add file_path and file_type columns to TutorDocument table.
Run this locally (SQLite) or on Render (PostgreSQL) depending on your DATABASE_URL.
"""
import os
import sys

# Detect database type from DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///database.db")

if DATABASE_URL.startswith("postgres"):
    # PostgreSQL migration
    print("Detected PostgreSQL database")
    
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    from sqlalchemy import create_engine, text, inspect
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            inspector = inspect(engine)
            
            # Check if tutordocument table exists
            if 'tutordocument' not in inspector.get_table_names():
                print("⚠️  tutordocument table does not exist. It will be created on first run.")
                sys.exit(0)
            
            columns = [col['name'] for col in inspector.get_columns('tutordocument')]
            
            if 'file_path' in columns and 'file_type' in columns:
                print("✅ Columns already exist!")
            else:
                print("Adding columns to tutordocument table...")
                
                if 'file_path' not in columns:
                    conn.execute(text("ALTER TABLE tutordocument ADD COLUMN file_path TEXT"))
                    print("✅ Added file_path column")
                
                if 'file_type' not in columns:
                    conn.execute(text("ALTER TABLE tutordocument ADD COLUMN file_type TEXT DEFAULT 'text'"))
                    print("✅ Added file_type column")
                
                conn.commit()
                print("🎉 Migration completed!")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

else:
    # SQLite migration
    print("Detected SQLite database")
    import sqlite3
    
    db_path = DATABASE_URL.replace("sqlite:///", "")
    
    if not os.path.exists(db_path):
        print(f"⚠️  Database file {db_path} not found. It will be created on first run.")
        sys.exit(0)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='tutordocument'")
        if not cursor.fetchone():
            print("⚠️  tutordocument table does not exist. It will be created on first run.")
            conn.close()
            sys.exit(0)
        
        cursor.execute("PRAGMA table_info(tutordocument)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'file_path' in columns and 'file_type' in columns:
            print("✅ Columns already exist!")
        else:
            print("Adding columns to tutordocument table...")
            
            if 'file_path' not in columns:
                cursor.execute("ALTER TABLE tutordocument ADD COLUMN file_path TEXT")
                print("✅ Added file_path column")
            
            if 'file_type' not in columns:
                cursor.execute("ALTER TABLE tutordocument ADD COLUMN file_type TEXT DEFAULT 'text'")
                print("✅ Added file_type column")
            
            conn.commit()
            print("🎉 Migration completed!")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

print("\n📝 Next steps:")
print("1. Restart your backend server")
print("2. Upload a PDF to test the new PDF viewer")
print("3. For Render deployment, run this script with DATABASE_URL set to your Render PostgreSQL URL")
