
import sys
import os
from uuid import uuid4
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, select
from app.main import app, get_session
from app.schemas import User, Subject, Topic, PastPaper
from app.utils import get_password_hash
from app.dependencies import get_current_user

# Setup in-memory SQLite database for testing
sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session_override():
    with Session(engine) as session:
        yield session

app.dependency_overrides[get_session] = get_session_override

# Disable startup events to prevent connecting to real DB
app.router.on_startup.clear()

client = TestClient(app)

# Helper to create an admin user and get token
def get_admin_token():
    with Session(engine) as session:
        # Check if admin exists
        admin = session.exec(select(User).where(User.username == "testadmin")).first()
        if not admin:
            admin = User(
                id=str(uuid4()),
                username="testadmin",
                email="admin@test.com",
                hashed_password=get_password_hash("password"),
                role="admin",
                is_active=True
            )
            session.add(admin)
            session.commit()
            session.refresh(admin)
    
    response = client.post("/api/v1/auth/login", json={"username": "testadmin", "password": "password"})
    return response.json()["access_token"]

def test_subject_crud():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Subject
    response = client.post("/api/v1/subjects", json={"name": "Test Subject 101", "description": "Intro to Testing"}, headers=headers)
    assert response.status_code == 201
    subject_id = response.json()["id"]
    assert response.json()["name"] == "Test Subject 101"

    # 2. Update Subject
    response = client.put(f"/api/v1/subjects/{subject_id}", json={"name": "Test Subject 102", "description": "Advanced Testing"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Test Subject 102"
    assert response.json()["description"] == "Advanced Testing"

    # 3. Delete Subject
    response = client.delete(f"/api/v1/subjects/{subject_id}", headers=headers)
    assert response.status_code == 204
    
    # 4. Verify Deletion
    response = client.get(f"/api/v1/subjects/{subject_id}")
    assert response.status_code == 404

def test_topic_crud():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create valid subject first
    sub_res = client.post("/api/v1/subjects", json={"name": "Topic Subject", "description": "For Topics"}, headers=headers)
    subject_id = sub_res.json()["id"]

    # 1. Create Topic
    response = client.post("/api/v1/topics", json={
        "subject_id": subject_id,
        "title": "Topic 1",
        "summary_content": "Content",
        "order": 1
    }, headers=headers)
    assert response.status_code == 201
    topic_id = response.json()["id"]

    # 2. Update Topic
    response = client.put(f"/api/v1/topics/{topic_id}", json={"title": "Topic 1 Updated"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["title"] == "Topic 1 Updated"

    # 3. Delete Topic
    response = client.delete(f"/api/v1/topics/{topic_id}", headers=headers)
    assert response.status_code == 204

def test_paper_crud():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create valid subject first
    sub_res = client.post("/api/v1/subjects", json={"name": "Paper Subject", "description": "For Papers"}, headers=headers)
    subject_id = sub_res.json()["id"]

    # 1. Create Paper
    response = client.post("/api/v1/papers", json={
        "subject_id": subject_id,
        "title": "2023 Exam",
        "year": "2023",
        "exam_type": "WAEC"
    }, headers=headers)
    assert response.status_code == 201
    paper_id = response.json()["id"]

    # 2. Update Paper
    response = client.put(f"/api/v1/papers/{paper_id}", json={"title": "2023 Exam Updated"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["title"] == "2023 Exam Updated"

    # 3. Delete Paper
    response = client.delete(f"/api/v1/papers/{paper_id}", headers=headers)
    assert response.status_code == 204

if __name__ == "__main__":
    # Ensure tables exist
    create_db_and_tables()
    
    try:
        test_subject_crud()
        print("Subject CRUD Passed")
        test_topic_crud()
        print("Topic CRUD Passed")
        test_paper_crud()
        print("Paper CRUD Passed")
    except Exception as e:
        print(f"Tests Failed: {e}")
