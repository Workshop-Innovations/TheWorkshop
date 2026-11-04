import os
import logging
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Request, UploadFile, status
from sqlmodel import Session, select
from typing import List, Optional
from uuid import uuid4
from ..database import get_session
from ..schemas import User, UserResponse, UserUpdate
from ..dependencies import get_current_admin_user, get_current_user, is_official_email
from ..utils import get_password_hash, get_supabase
from ..rate_limit import limiter, user_or_ip, UPLOAD_LIMIT
from ..email_service import email_verification_enabled, send_verification_email
from pydantic import BaseModel, EmailStr

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/users",
    tags=["users"]
)

@router.get("/", response_model=List[UserResponse], summary="List all users (Admin)")
async def list_users(
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    List all users. Only accessible by admins.
    """
    users = session.exec(select(User)).all()
    return users

@router.patch("/me", response_model=UserResponse, summary="Update current user profile")
async def update_current_user(
    user_update: UserUpdate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Update the current user's profile information.
    """
    user_data = user_update.model_dump(exclude_unset=True)

    # Unique columns: return a clean 409 instead of an IntegrityError 500
    if user_data.get("username") and user_data["username"] != current_user.username:
        if session.exec(select(User).where(User.username == user_data["username"])).first():
            raise HTTPException(status_code=409, detail="Username already taken")
    if user_data.get("email") and user_data["email"] != current_user.email:
        if session.exec(select(User).where(User.email == user_data["email"])).first():
            raise HTTPException(status_code=409, detail="Email already registered")
        if is_official_email(user_data["email"]) and current_user.role != "admin":
            raise HTTPException(status_code=400, detail="@workshop.com.ng addresses must sign in with Google.")

    email_changed = bool(user_data.get("email")) and user_data["email"] != current_user.email

    for key, value in user_data.items():
        setattr(current_user, key, value)

    # A new address has to be confirmed before it can be used to sign in
    if email_changed and email_verification_enabled():
        current_user.email_verified = False

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    if email_changed and not current_user.email_verified:
        background_tasks.add_task(
            send_verification_email, current_user.id, current_user.email, current_user.username
        )
    return current_user

# --- Profile pictures (stored in Supabase Storage, only the URL in the database) ---

AVATAR_BUCKET = os.getenv("AVATAR_BUCKET", "avatars")
MAX_AVATAR_BYTES = 2 * 1024 * 1024  # 2MB
_AVATAR_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}

def _avatar_path_from_url(url: Optional[str]) -> Optional[str]:
    """The storage path of a picture we uploaded earlier, so it can be removed."""
    marker = f"/storage/v1/object/public/{AVATAR_BUCKET}/"
    if url and marker in url:
        return url.split(marker, 1)[1].split("?", 1)[0]
    return None

def _remove_old_avatar(sb, url: Optional[str]) -> None:
    path = _avatar_path_from_url(url)
    if path:
        try:
            sb.storage.from_(AVATAR_BUCKET).remove([path])
        except Exception:
            logger.warning("Could not delete old profile picture %s", path)

@router.post("/me/profile-pic", response_model=UserResponse, summary="Upload a profile picture")
@limiter.limit(UPLOAD_LIMIT, key_func=user_or_ip)
async def upload_profile_pic(
    request: Request,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Stores the image in Supabase Storage and saves only its URL on the user
    (base64 images in the user table made every user query slow)."""
    sb = get_supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="File storage is not configured.")
    ext = _AVATAR_TYPES.get((file.content_type or "").lower())
    if not ext:
        raise HTTPException(status_code=400, detail="Please upload a JPG, PNG, WebP or GIF image.")
    data = await file.read()
    if len(data) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=413, detail="Image too large. Maximum size is 2MB.")

    path = f"{current_user.id}/{uuid4().hex}{ext}"
    try:
        sb.storage.from_(AVATAR_BUCKET).upload(
            path, data, file_options={"content-type": file.content_type, "cache-control": "31536000"}
        )
    except Exception:
        logger.exception("Profile picture upload failed")
        raise HTTPException(status_code=502, detail="Could not store the image. Please try again.")

    old_url = current_user.profile_pic
    current_user.profile_pic = sb.storage.from_(AVATAR_BUCKET).get_public_url(path)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    _remove_old_avatar(sb, old_url)
    return current_user

@router.delete("/me/profile-pic", response_model=UserResponse, summary="Remove your profile picture")
async def delete_profile_pic(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    old_url = current_user.profile_pic
    current_user.profile_pic = None
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    sb = get_supabase()
    if sb:
        _remove_old_avatar(sb, old_url)
    return current_user

@router.put("/{user_id}/role", response_model=UserResponse, summary="Update user role (Admin)")
async def update_user_role(
    user_id: str,
    role: str,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Update a user's role (e.g. 'admin', 'user'). Only accessible by admins.
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'user'")
        
    user.role = role
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

class UserCreateAdmin(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "user"

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Create a new user (Admin)")
async def create_user(
    user_in: UserCreateAdmin,
    session: Session = Depends(get_session),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Create a new user with a specific role. Only accessible by admins.
    """
    # Check if username or email exists
    existing_user = session.exec(select(User).where(
        (User.email == user_in.email) | (User.username == user_in.username)
    )).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or Email already registered")

    if user_in.role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'user'")

    hashed_password = get_password_hash(user_in.password)
    user = User(
        id=str(uuid4()),
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        role=user_in.role,
        is_active=True,
        email_verified=True,  # created by an admin, who vouches for the address
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
