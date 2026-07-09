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

# --- Unified Configuration Settings ---
class Settings(BaseModel):
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-only-secret-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours for MVP (was 30 min)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./database.db")
    FRONTEND_URLS: str = os.getenv("FRONTEND_URLS", "http://localhost:5173,http://localhost:3000")

settings = Settings()

# Warn if using default secret key
if settings.SECRET_KEY == "dev-only-secret-change-in-production":
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
    to_encode.update({"exp": expire})  # Pass datetime directly, not .timestamp()
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# --- Dependency to get the current user from the token ---
async def get_current_user(
    session: Session = Depends(get_session),
    token: str = Depends(oauth2_scheme)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = session.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise credentials_exception
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
