from typing import Optional
from datetime import datetime
from pydantic import BaseModel, field_validator


class SessionLogCreate(BaseModel):
    minutes_spent: int
    session_type: str

    @field_validator("minutes_spent")
    @classmethod
    def validate_minutes(cls, v):

        if v <= 0 or v > 240:
            raise ValueError("minutes_spent must be between 1 and 240")
        return v

    @field_validator("session_type")
    @classmethod
    def validate_session_type(cls, v):
        if v not in ("focus", "pomodoro", "short_break", "long_break"):
            raise ValueError(
                "session_type must be one of: focus, pomodoro, short_break, long_break"
            )
        return v


class SessionLogResponse(BaseModel):
    id: str
    minutes_spent: int
    session_type: str
    completion_time: datetime
    user_id: str

    model_config = {"from_attributes": True}


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    completed: Optional[bool] = False
    priority: Optional[str] = "medium"
    due_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    completed: bool
    priority: str
    created_at: datetime
    due_date: Optional[datetime] = None
    owner_id: str

    model_config = {"from_attributes": True}
