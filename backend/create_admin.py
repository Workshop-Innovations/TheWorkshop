from sqlmodel import Session, select
from app.database import engine
from app.schemas import User
from passlib.context import CryptContext
from uuid import uuid4

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_user(username: str, email: str, password: str):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == username)).first()
        if user:
            print(f"User {username} already exists. Updating role...")
            user.role = "admin"
            session.add(user)
            session.commit()
            print("Role updated to admin.")
            return

        print(f"Creating new admin user: {username} ({email})")
        hashed_password = pwd_context.hash(password)
        new_user = User(
            id=str(uuid4()),
            username=username,
            email=email,
            hashed_password=hashed_password,
            is_active=True,
            role="admin"
        )
        session.add(new_user)
        session.commit()
        print(f"Successfully created admin user {username}")

if __name__ == "__main__":
    create_admin_user("admin", "a@gmail.com", "admin123")
