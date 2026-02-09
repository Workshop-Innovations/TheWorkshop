from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from ..database import get_session
from ..schemas import User, UserResponse, UserUpdate
from ..dependencies import get_current_admin_user, get_current_user
from ..utils import get_password_hash
from pydantic import BaseModel, EmailStr

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
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Update the current user's profile information.
    """
    user_data = user_update.model_dump(exclude_unset=True)
    for key, value in user_data.items():
        setattr(current_user, key, value)
    
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
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
    
    hashed_password = get_password_hash(user_in.password)
    user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        role=user_in.role,
        is_active=True
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
