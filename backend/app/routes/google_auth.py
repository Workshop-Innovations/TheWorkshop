"""
Google OAuth sign-in: the frontend obtains an ID token via Google Identity Services
and POSTs it here.  We verify the token with Google's public keys and either log in
the existing user or create a new account automatically.
"""
import os
import logging
from uuid import uuid4
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from ..database import get_session
from ..schemas import User, Token, Community, CommunityMember
from ..dependencies import settings, create_access_token
from ..utils import get_password_hash

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


class GoogleLoginRequest(BaseModel):
    credential: str  # the ID token from Google Identity Services


@router.post("/google", response_model=Token, summary="Sign in with Google")
async def google_login(body: GoogleLoginRequest, session: Session = Depends(get_session)):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in is not configured on this server.",
        )

    try:
        idinfo = google_id_token.verify_oauth2_token(
            body.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential.",
        )

    email = idinfo.get("email")
    if not email or not idinfo.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email is not verified.",
        )

    user = session.exec(select(User).where(User.email == email)).first()

    if not user:
        base_username = email.split("@")[0]
        username = base_username
        counter = 1
        while session.exec(select(User).where(User.username == username)).first():
            username = f"{base_username}{counter}"
            counter += 1

        user = User(
            id=str(uuid4()),
            username=username,
            email=email,
            hashed_password=get_password_hash(str(uuid4())),
            is_active=True,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        workshop = session.exec(select(Community).where(Community.name == "The Workshop")).first()
        if workshop:
            existing = session.exec(
                select(CommunityMember).where(
                    CommunityMember.community_id == workshop.id,
                    CommunityMember.user_id == user.id,
                )
            ).first()
            if not existing:
                session.add(CommunityMember(community_id=workshop.id, user_id=user.id, role="member"))
                session.commit()

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is deactivated.")

    access_token = create_access_token(
        data={"sub": user.username, "uid": user.id},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}
