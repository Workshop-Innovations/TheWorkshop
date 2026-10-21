"""Isolated test harness: never load .env, production data, or service credentials."""

import os
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

# python-dotenv 1.1.0 does not support PYTHON_DOTENV_DISABLED. Block it explicitly

import dotenv

dotenv.load_dotenv = lambda *args, **kwargs: False

import pytest

_sandbox = TemporaryDirectory(prefix="workshop-tests-")
for key in list(os.environ):
    if (
        key.startswith(("GEMINI_", "SUPABASE_", "MODAL_", "PAYSTACK_", "DATA_ENTRY_"))
        or key == "ADMIN_EMAIL"
    ):
        os.environ.pop(key)
os.environ.update(
    PYTHON_DOTENV_DISABLED="1",
    APP_ENV="test",
    DATABASE_URL="sqlite:///" + str(Path(_sandbox.name) / "tests.db"),
    SECRET_KEY="synthetic-test-key-never-used-in-production",
)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from sqlmodel import SQLModel
from app.main import app
from app.database import engine


@pytest.fixture
def client():

    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
