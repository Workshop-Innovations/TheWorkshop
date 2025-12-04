from sqlmodel import Session, select, create_engine
from app.schemas import SessionLog, Task, User
from app.main import settings

engine = create_engine(settings.DATABASE_URL)

def verify_data():
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        print(f"Total Users: {len(users)}")
        for user in users:
            print(f"User: {user.email} (ID: {user.id})")
            
            logs = session.exec(select(SessionLog).where(SessionLog.user_id == user.id)).all()
            print(f"  - Session Logs: {len(logs)}")
            for log in logs:
                print(f"    - {log.session_type}: {log.minutes_spent} min at {log.completion_time}")
                
            tasks = session.exec(select(Task).where(Task.owner_id == user.id)).all()
            print(f"  - Tasks: {len(tasks)}")
            for task in tasks:
                print(f"    - {task.title}: Completed={task.completed}")

if __name__ == "__main__":
    verify_data()
