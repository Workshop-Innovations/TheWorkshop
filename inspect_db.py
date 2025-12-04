import sqlite3

conn = sqlite3.connect('backend/database.db')
cursor = conn.cursor()

print("--- Message Table Schema ---")
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='message'")
print(cursor.fetchone()[0])

print("\n--- MessageVote Table Schema ---")
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='messagevote'")
print(cursor.fetchone()[0])

conn.close()
