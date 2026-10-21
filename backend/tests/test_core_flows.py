from sqlmodel import Session
from app.database import engine
from app.models import User


def account(client, name):
    created = client.post(
        "/api/v1/auth/register",
        json={
            "username": name,
            "email": name + "@example.com",
            "password": "synthetic-test-123",
        },
    )
    assert created.status_code == 201
    login = client.post(
        "/api/v1/auth/login", json={"username": name, "password": "synthetic-test-123"}
    )
    assert login.status_code == 200
    return created.json(), {"Authorization": "Bearer " + login.json()["access_token"]}


def test_summary_accuracy_and_ownership(client):
    _, a = account(client, "alpha")
    _, b = account(client, "beta")
    assert client.get("/api/v1/log/summary").status_code == 401
    for minutes, kind in [(25, "focus"), (45, "pomodoro"), (5, "short_break")]:
        assert (
            client.post(
                "/api/v1/log/session",
                headers=a,
                json={"minutes_spent": minutes, "session_type": kind},
            ).status_code
            == 201
        )
    assert client.get("/api/v1/log/summary", headers=a).json() == {
        "total_completed_sessions": 2,
        "total_focus_minutes": 70,
    }
    assert client.get("/api/v1/log/summary", headers=b).json() == {
        "total_completed_sessions": 0,
        "total_focus_minutes": 0,
    }
    assert (
        client.post(
            "/api/v1/log/session",
            headers=a,
            json={"minutes_spent": 0, "session_type": "focus"},
        ).status_code
        == 422
    )


def test_profile_validation_persistence_and_auth(client):
    user, a = account(client, "alpha")
    _, b = account(client, "beta")
    assert (
        client.patch(
            "/api/v1/users/me", headers=a, json={"username": "beta"}
        ).status_code
        == 409
    )
    for change in [
        {"username": None},
        {"username": "   "},
        {"username": "x" * 51},
        {"email": None},
        {"email": "invalid"},
    ]:
        assert (
            client.patch("/api/v1/users/me", headers=a, json=change).status_code == 422
        )
    changed = client.patch(
        "/api/v1/users/me",
        headers=a,
        json={
            "username": "renamed",
            "email": "renamed@example.com",
            "profile_pic": None,
        },
    )
    assert changed.status_code == 200
    assert changed.json()["id"] == user["id"]
    assert client.get("/api/v1/users/me", headers=a).json()["username"] == "renamed"
    assert client.get("/api/v1/users/me", headers=b).json()["username"] == "beta"
    assert (
        client.post(
            "/api/v1/auth/login", json={"username": "renamed", "password": "wrong"}
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/api/v1/auth/login",
            json={"username": "renamed", "password": "synthetic-test-123"},
        ).status_code
        == 200
    )
    assert (
        client.post("/api/v1/subjects", headers=b, json={"name": "Denied"}).status_code
        == 403
    )


def test_communities_survive_reload_and_messages_persist(client):
    _, a = account(client, "alpha")
    _, b = account(client, "beta")
    community = client.post(
        "/api/v1/community/communities", headers=a, json={"name": "Exam cohort"}
    ).json()
    listed = client.get("/api/v1/community/communities", headers=a)
    assert listed.status_code == 200
    assert community["id"] in [c["id"] for c in listed.json()]
    for resource in ["members", "channels"]:
        assert (
            client.get(
                f"/api/v1/community/communities/{community['id']}/{resource}", headers=b
            ).status_code
            == 403
        )
    channels = client.get(
        f"/api/v1/community/communities/{community['id']}/channels", headers=a
    ).json()
    channel = channels[0]["id"]
    path = f"/api/v1/community/channels/{channel}/messages"
    assert client.get(path, headers=b).status_code == 403
    assert client.post(path, headers=b, json={"content": "Denied"}).status_code == 403
    sent = client.post(path, headers=a, json={"content": "A persisted message"})
    assert sent.status_code == 200
    assert sent.json()["id"] in [m["id"] for m in client.get(path, headers=a).json()]
    assert (
        client.post(
            "/api/v1/community/communities/join",
            params={"join_code": community["join_code"]},
            headers=b,
        ).status_code
        == 200
    )
    assert community["id"] in [
        c["id"] for c in client.get("/api/v1/community/communities", headers=b).json()
    ]


def test_dm_and_document_ownership(client):
    first, a = account(client, "alpha")
    second, b = account(client, "beta")
    _, c = account(client, "gamma")
    dm = client.post("/api/v1/community/dms/" + second["id"], headers=a).json()
    path = f"/api/v1/community/dms/{dm['id']}/messages"
    assert (
        client.post(path, headers=a, json={"content": "Private message"}).status_code
        == 200
    )
    assert len(client.get(path, headers=b).json()) == 1
    assert client.get(path, headers=c).status_code == 403
    doc = client.post(
        "/api/v1/tutor/upload",
        headers=a,
        files={"file": ("source.txt", b"Synthetic study text.", "text/plain")},
    )
    assert doc.status_code == 200
    assert (
        client.get("/api/v1/tutor/documents/" + doc.json()["id"], headers=b).status_code
        == 404
    )
    with Session(engine) as session:
        user = session.get(User, first["id"])
        user.is_active = False
        session.add(user)
        session.commit()
    assert client.get("/api/v1/users/me", headers=a).status_code == 401


def test_liveness(client):
    assert client.get("/healthz").json() == {"status": "ok"}


def test_production_config_fails_closed():
    import os
    import subprocess
    import sys
    from pathlib import Path

    env = dict(
        os.environ,
        APP_ENV="production",
        SECRET_KEY="synthetic-config-secret-at-least-32-characters",
        FRONTEND_URLS="https://preview.example.com",
    )
    cases = [
        {"DATABASE_URL": "sqlite:///:memory:"},
        {
            "DATABASE_URL": "postgresql://synthetic:synthetic@127.0.0.1/unused",
            "SECRET_KEY": "short",
        },
        {
            "DATABASE_URL": "postgresql://synthetic:synthetic@127.0.0.1/unused",
            "FRONTEND_URLS": "*",
        },
    ]
    for values in cases:
        result = subprocess.run(
            [
                sys.executable,
                "-c",
                "import dotenv; dotenv.load_dotenv=lambda *a,**k:False; import app.dependencies",
            ],
            env={**env, **values},
            capture_output=True,
            text=True,
            timeout=15,
            cwd=Path(__file__).resolve().parents[1],
        )
        assert result.returncode != 0
        assert "RuntimeError" in result.stderr
