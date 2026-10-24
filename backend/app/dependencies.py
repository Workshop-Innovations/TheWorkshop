"""
Authentication dependencies and shared configuration for FastAPI.
Separated from main.py to avoid circular imports with route modules.
"""
import os
import logging
from typing import Optional
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import Session, select
from pydantic import BaseModel

from .database import get_session
from .schemas import User

logger = logging.getLogger(__name__)

_DEV_SECRET = "dev-only-secret-change-in-production"

# --- Unified Configuration Settings ---
class Settings(BaseModel):
    SECRET_KEY: str = os.getenv("SECRET_KEY", _DEV_SECRET)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./database.db")
    FRONTEND_URLS: str = os.getenv("FRONTEND_URLS", "http://localhost:5173,http://localhost:3000")

settings = Settings()

_is_production = os.getenv("RENDER") or os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("FLY_APP_NAME") or os.getenv("ENV", "").lower() == "production"
if settings.SECRET_KEY == _DEV_SECRET:
    if _is_production:
        raise RuntimeError("SECRET_KEY is not set or is the dev default. Refusing to start in production.")
    logger.warning("⚠️  Using default SECRET_KEY — set a strong key via environment variable for production!")

# --- OAuth2PasswordBearer for token extraction ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# --- JWT Utility Functions ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_user_from_token(session: Session, token: Optional[str]) -> Optional[User]:
    """
    Decode a JWT and return the matching active user, or None.
    Shared by HTTP auth, WebSocket auth and query-param auth (file downloads).

    New tokens carry the immutable user id in "uid". Tokens issued before that
    change only carry the username in "sub"; they are still honoured until they expire.
    """
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

    user_id = payload.get("uid")
    if user_id:
        user = session.get(User, user_id)
    else:
        username = payload.get("sub")
        if not username:
            return None
        user = session.exec(select(User).where(User.username == username)).first()

    if user is None or not user.is_active:
        return None
    return user

# --- Dependency to get the current user from the token ---
async def get_current_user(
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    user = get_user_from_token(session, token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    """
    Dependency to ensure the current user is an admin.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource"
        )
    return current_user
