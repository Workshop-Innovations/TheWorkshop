from sqlmodel import Session, select
from app.database import engine
from app.schemas import User
import sys

def promote_to_admin(email: str):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if not user:
            print(f"User with email {email} not found.")
            return

        user.role = "admin"
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"Successfully promoted {user.email} to admin!")

if __name__ == "__main__":
    target_email = "a@gmail.com"
    if len(sys.argv) > 1:
        target_email = sys.argv[1]
    
    promote_to_admin(target_email)
