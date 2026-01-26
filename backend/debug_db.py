from sqlmodel import create_engine, inspect, text

# Adjust path if needed, assuming running from backend dir
sqlite_url = "sqlite:///./database.db"
engine = create_engine(sqlite_url)

def inspect_db():
    print("Inspecting database...")
    insp = inspect(engine)
    tables = insp.get_table_names()
    print(f"Tables found: {tables}")
    
    if "user" in tables:
        print("User table exists.")
        with engine.connect() as conn:
            result = conn.execute(text("SELECT count(*) FROM user"))
            count = result.scalar()
            print(f"User count: {count}")
            
            # Check columns
            columns = [c['name'] for c in insp.get_columns("user")]
            print(f"User columns: {columns}")
    else:
        print("User table DOES NOT exist.")

if __name__ == "__main__":
    inspect_db()
