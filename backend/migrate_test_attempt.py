import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE pastpaper ADD COLUMN duration_minutes INTEGER DEFAULT 60")
    print("Added duration_minutes")
except Exception as e:
    print(f"Error adding column: {e}")

try:
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS testattempt (
        id VARCHAR NOT NULL, 
        user_id VARCHAR NOT NULL, 
        paper_id VARCHAR NOT NULL, 
        score FLOAT, 
        answers_data VARCHAR, 
        feedback_data VARCHAR, 
        created_at DATETIME NOT NULL, 
        PRIMARY KEY (id), 
        FOREIGN KEY(user_id) REFERENCES user (id), 
        FOREIGN KEY(paper_id) REFERENCES pastpaper (id)
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_testattempt_user_id ON testattempt (user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_testattempt_paper_id ON testattempt (paper_id)")
    print("Created testattempt table")
except Exception as e:
    print(f"Error creating table: {e}")

conn.commit()
conn.close()
