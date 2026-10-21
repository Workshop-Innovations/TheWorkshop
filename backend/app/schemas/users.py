from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, field_validator


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    study_goal: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, max_length=50)
    email: Optional[EmailStr] = None
    profile_pic: Optional[str] = None

    @field_validator("username", "email")
    @classmethod
    def validate_identity(cls, value):
        if value is None or not str(value).strip():
            raise ValueError("Username and email cannot be empty")
        if len(str(value)) > 254:
            raise ValueError("Value is too long")
        return str(value).strip()


class UserResponse(BaseModel):
    id: str
    username: str
    email: EmailStr
    is_active: bool
    role: str = "user"
    profile_pic: Optional[str] = None
    study_goal: Optional[str] = None
    subscription_tier: str = "basic"
    subscription_expiry: Optional[datetime] = None
    ai_queries_today: int = 0

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GenericMessage(BaseModel):
    content: str


class UserCreateAdmin(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "user"
