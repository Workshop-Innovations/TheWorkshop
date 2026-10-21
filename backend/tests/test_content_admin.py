from uuid import uuid4
from sqlmodel import Session, select
from app.database import engine
from app.models import User
from app.utils import get_password_hash


def get_admin_token(client):
    with Session(engine) as session:

        admin = session.exec(select(User).where(User.username == "testadmin")).first()
        if not admin:
            admin = User(
                id=str(uuid4()),
                username="testadmin",
                email="admin@test.com",
                hashed_password=get_password_hash("password"),
                role="admin",
                is_active=True,
            )
            session.add(admin)
            session.commit()
            session.refresh(admin)

    response = client.post(
        "/api/v1/auth/login", json={"username": "testadmin", "password": "password"}
    )
    return response.json()["access_token"]


def test_subject_crud(client):
    token = get_admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/subjects",
        json={"name": "Test Subject 101", "description": "Intro to Testing"},
        headers=headers,
    )
    assert response.status_code == 201
    subject_id = response.json()["id"]
    assert response.json()["name"] == "Test Subject 101"

    response = client.put(
        f"/api/v1/subjects/{subject_id}",
        json={"name": "Test Subject 102", "description": "Advanced Testing"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Test Subject 102"
    assert response.json()["description"] == "Advanced Testing"

    response = client.delete(f"/api/v1/subjects/{subject_id}", headers=headers)
    assert response.status_code == 204

    response = client.get(f"/api/v1/subjects/{subject_id}")
    assert response.status_code == 404


def test_topic_crud(client):
    token = get_admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    sub_res = client.post(
        "/api/v1/subjects",
        json={"name": "Topic Subject", "description": "For Topics"},
        headers=headers,
    )
    subject_id = sub_res.json()["id"]

    response = client.post(
        "/api/v1/topics",
        json={
            "subject_id": subject_id,
            "title": "Topic 1",
            "summary_content": "Content",
            "order": 1,
        },
        headers=headers,
    )
    assert response.status_code == 201
    topic_id = response.json()["id"]

    response = client.put(
        f"/api/v1/topics/{topic_id}", json={"title": "Topic 1 Updated"}, headers=headers
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Topic 1 Updated"

    response = client.delete(f"/api/v1/topics/{topic_id}", headers=headers)
    assert response.status_code == 204


def test_paper_crud(client):
    token = get_admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    sub_res = client.post(
        "/api/v1/subjects",
        json={"name": "Paper Subject", "description": "For Papers"},
        headers=headers,
    )
    subject_id = sub_res.json()["id"]

    response = client.post(
        "/api/v1/papers",
        json={
            "subject_id": subject_id,
            "title": "2023 Exam",
            "year": "2023",
            "exam_type": "WAEC",
        },
        headers=headers,
    )
    assert response.status_code == 201
    paper_id = response.json()["id"]

    response = client.put(
        f"/api/v1/papers/{paper_id}",
        json={"title": "2023 Exam Updated"},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["title"] == "2023 Exam Updated"

    response = client.delete(f"/api/v1/papers/{paper_id}", headers=headers)
    assert response.status_code == 204
