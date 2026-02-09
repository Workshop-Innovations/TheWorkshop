import sqlite3
import os

db_path = "database.db"

if not os.path.exists(db_path):
    print(f"Database file {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if column exists
    cursor.execute("PRAGMA table_info(user)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if "profile_pic" in columns:
        print("Column 'profile_pic' already exists in 'user' table.")
    else:
        print("Adding 'profile_pic' column to 'user' table...")
        cursor.execute("ALTER TABLE user ADD COLUMN profile_pic TEXT")
        conn.commit()
        print("Column added successfully.")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
