import json
from datetime import datetime, timezone
from types import SimpleNamespace
from sqlmodel import Session, select
from app.database import engine
from app.models import User, TutorDocument
from app.routes import tutor, flashcards
from app.services import documents


def learner(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "learner",
            "email": "learner@example.com",
            "password": "synthetic-test-123",
        },
    )
    assert response.status_code == 201
    token = client.post(
        "/api/v1/auth/login",
        json={"username": "learner", "password": "synthetic-test-123"},
    ).json()["access_token"]
    headers = {"Authorization": "Bearer " + token}
    document = client.post(
        "/api/v1/tutor/upload",
        headers=headers,
        files={"file": ("notes.txt", b"Four is twice two.", "text/plain")},
    )
    assert document.status_code == 200
    return response.json()["id"], headers, document.json()["id"]


class FakeModels:
    def __init__(self, data):
        self.data, self.calls = data, 0

    async def generate_content(self, **kwargs):
        self.calls += 1
        return SimpleNamespace(text=json.dumps(self.data))


def test_generation_routes_share_daily_limit(client, monkeypatch):
    user_id, headers, document = learner(client)
    model = FakeModels([])
    monkeypatch.setattr(
        tutor, "client", SimpleNamespace(aio=SimpleNamespace(models=model))
    )
    with Session(engine) as session:
        user = session.get(User, user_id)
        user.ai_queries_today = 5
        user.last_ai_query_date = datetime.now(timezone.utc).date()
        session.add(user)
        session.commit()
    for path in ["/generate/quiz", "/generate/flashcards", "/chat"]:
        result = client.post(
            "/api/v1/tutor" + path,
            headers=headers,
            json={"document_id": document, "message": "Explain this."},
        )
        assert result.status_code == 402
    assert model.calls == 0


def test_generated_quiz_validates_answers_and_refunds_failures(client, monkeypatch):
    user_id, headers, document = learner(client)
    model = FakeModels(
        [
            {
                "question": "Twice two?",
                "options": ["4", "5"],
                "correct_answer": "secret-invalid-value",
            }
        ]
    )
    monkeypatch.setattr(
        tutor, "client", SimpleNamespace(aio=SimpleNamespace(models=model))
    )
    failed = client.post(
        "/api/v1/tutor/generate/quiz", headers=headers, json={"document_id": document}
    )
    assert failed.status_code == 502
    assert "secret-invalid-value" not in failed.text
    with Session(engine) as session:
        assert session.get(User, user_id).ai_queries_today == 0
    model.data = [
        {
            "question": "Twice two?",
            "options": ["4", "5", "6", "7"],
            "correct_answer": "4",
        }
    ]
    result = client.post(
        "/api/v1/tutor/generate/quiz", headers=headers, json={"document_id": document}
    )
    assert result.status_code == 200
    with Session(engine) as session:
        assert session.get(User, user_id).ai_queries_today == 1


def test_upload_types_limits_and_missing_storage(client, monkeypatch):
    _, headers, _ = learner(client)
    for name, data, expected in [
        ("script.exe", b"not a document", 415),
        ("bad.txt", b"\xff", 415),
        ("large.txt", b"x" * 200001, 413),
        ("bad.pdf", b"not a pdf", 400),
    ]:
        assert (
            client.post(
                "/api/v1/tutor/upload", headers=headers, files={"file": (name, data)}
            ).status_code
            == expected
        )
    monkeypatch.setattr(
        documents.pypdf,
        "PdfReader",
        lambda _: SimpleNamespace(
            pages=[SimpleNamespace(extract_text=lambda: "Readable text")]
        ),
    )
    with Session(engine) as session:
        before = len(session.exec(select(TutorDocument)).all())
    result = client.post(
        "/api/v1/tutor/upload",
        headers=headers,
        files={"file": ("valid.pdf", b"stubbed PDF parser", "application/pdf")},
    )
    assert result.status_code == 503
    with Session(engine) as session:
        assert len(session.exec(select(TutorDocument)).all()) == before


def test_file_generation_saves_valid_cards_and_cleans_provider_file(
    client, monkeypatch
):
    user_id, headers, _ = learner(client)
    removed = []

    class Files:
        async def upload(self, **kwargs):
            return SimpleNamespace(name="synthetic-file")

        async def delete(self, name):
            removed.append(name)

    provider = SimpleNamespace(
        aio=SimpleNamespace(
            files=Files(),
            models=FakeModels([{"question": "Twice two?", "answer": "4"}]),
        )
    )
    monkeypatch.setattr(flashcards, "client", provider)
    result = client.post(
        "/api/v1/flashcards/generate/file",
        headers=headers,
        data={"title": "Numbers", "category": "Maths"},
        files={"file": ("notes.txt", b"Four is twice two.", "text/plain")},
    )
    assert result.status_code == 201
    assert result.json()["flashcards"][0]["answer"] == "4"
    assert removed == ["synthetic-file"]
    with Session(engine) as session:
        assert session.get(User, user_id).ai_queries_today == 1


def test_models_are_separate_from_api_schemas():
    from app import models, schemas

    assert not hasattr(schemas, "User")
    first = models.User(
        username="one", email="one@example.com", hashed_password="synthetic"
    )
    second = models.User(
        username="two", email="two@example.com", hashed_password="synthetic"
    )
    assert first.id and first.id != second.id
    assert models.User.__module__.startswith("app.models.")
    assert schemas.UserResponse.__module__.startswith("app.schemas.")


def test_payment_policy_rejects_replayed_reference(client):
    from app.services.subscriptions import _apply_payment

    user_id, _, _ = learner(client)
    with Session(engine) as session:
        user = session.get(User, user_id)
        assert _apply_payment(session, user, "synthetic-reference", "pro", 95000, None)
        expiry = user.subscription_expiry
        assert not _apply_payment(
            session, user, "synthetic-reference", "pro", 95000, None
        )
        assert user.subscription_expiry == expiry
