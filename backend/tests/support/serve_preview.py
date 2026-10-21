"""Serve an isolated synthetic API on loopback. No .env or production services.
Run from repository root: python backend/tests/support/serve_preview.py
The database is deleted when this process exits. Never run this as a deployment.
"""

import os
import sys
from uuid import uuid4
from pathlib import Path
from tempfile import TemporaryDirectory

# python-dotenv 1.1.0 does not support PYTHON_DOTENV_DISABLED. Block it explicitly

import dotenv

dotenv.load_dotenv = lambda *args, **kwargs: False

for key in list(os.environ):
    if (
        key.startswith(("GEMINI_", "SUPABASE_", "MODAL_", "PAYSTACK_", "DATA_ENTRY_"))
        or key == "ADMIN_EMAIL"
    ):
        os.environ.pop(key)

with TemporaryDirectory(prefix="workshop-preview-") as directory:
    os.environ.update(
        PYTHON_DOTENV_DISABLED="1",
        APP_ENV="test",
        DATABASE_URL="sqlite:///" + str(Path(directory) / "fixture.db"),
        SECRET_KEY="synthetic-local-preview-key-never-deploy",
        FRONTEND_URLS="http://127.0.0.1:4180,http://127.0.0.1:4181,http://localhost:4181,http://localhost:8000",
    )
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    from sqlmodel import SQLModel, Session
    from app.database import engine
    from app.models import User, SessionLog
    from app.utils import get_password_hash
    from app.main import app
    import uvicorn

    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        user = User(
            id=str(uuid4()),
            username="previewlearner",
            email="previewlearner@example.com",
            hashed_password=get_password_hash("synthetic-audit-123"),
            role="admin",
            profile_pic='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32"%3E%3Crect width="32" height="32" fill="%23154c79"/%3E%3C/svg%3E',
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        for i in range(100):
            session.add(
                SessionLog(
                    user_id=user.id, minutes_spent=25 + i % 3 * 5, session_type="focus"
                )
            )
        session.commit()
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")
