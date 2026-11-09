import sys
import os
from uuid import uuid4
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from app.main import app
from app.database import get_session
from app.dependencies import get_current_user
from app.schemas import User, SessionLog

engine = create_engine(
    "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
)
SQLModel.metadata.create_all(engine)


def _session():
    with Session(engine) as session:
        yield session


def _make_user(**kwargs) -> str:
    with Session(engine) as session:
        user = User(
            id=str(uuid4()), username=f"u{uuid4().hex[:8]}", email=f"{uuid4().hex[:8]}@example.com",
            hashed_password="x", **kwargs,
        )
        session.add(user)
        session.commit()
        return user.id


def _client_for(user_id: str) -> TestClient:
    def current_user(session: Session = __import__("fastapi").Depends(get_session)):
        return session.get(User, user_id)

    app.dependency_overrides[get_session] = _session
    app.dependency_overrides[get_current_user] = current_user
    app.router.on_startup.clear()
    return TestClient(app)


def test_new_user_starts_with_empty_walkthrough():
    client = _client_for(_make_user())
    data = client.get("/api/v1/users/me/onboarding").json()
    assert data["welcome_seen"] is False
    assert data["tour_status"] is None
    assert data["flags"] == []
    assert not any(data["checklist"].values())


def test_checklist_is_derived_from_user_data():
    uid = _make_user(profile_pic="https://example.com/a.png", study_goal="waec", total_messages=2)
    with Session(engine) as session:
        session.add(SessionLog(user_id=uid, minutes_spent=25, session_type="focus"))
        session.commit()
    checklist = _client_for(uid).get("/api/v1/users/me/onboarding").json()["checklist"]
    assert checklist == {
        "photo": True, "goal": True, "paper": False, "focus": True, "tutor": False, "community": True,
    }


def test_update_flags_tour_and_reset():
    client = _client_for(_make_user())
    res = client.patch("/api/v1/users/me/onboarding", json={
        "welcome_seen": True, "tour_status": "skipped",
        "add_flags": ["hint:community", "did:paper_opened", "hint:community"],
    })
    assert res.status_code == 200
    data = res.json()
    assert data["welcome_seen"] is True
    assert data["tour_status"] == "skipped"
    assert data["flags"] == ["hint:community", "did:paper_opened"]
    assert data["checklist"]["paper"] is True

    # Replaying the tour clears hints and tour status but keeps actions taken
    data = client.patch("/api/v1/users/me/onboarding", json={"reset": True}).json()
    assert data["tour_status"] is None
    assert data["flags"] == ["did:paper_opened"]


def test_rejects_unknown_values():
    client = _client_for(_make_user())
    assert client.patch("/api/v1/users/me/onboarding", json={"add_flags": ["hint:nope"]}).status_code == 422
    assert client.patch("/api/v1/users/me/onboarding", json={"tour_status": "maybe"}).status_code == 422
    assert client.patch("/api/v1/users/me", json={"study_goal": "nope"}).status_code == 422


def test_study_goal_can_be_set_after_google_signup():
    client = _client_for(_make_user())
    res = client.patch("/api/v1/users/me", json={"study_goal": "jamb"})
    assert res.status_code == 200
    assert res.json()["study_goal"] == "jamb"
