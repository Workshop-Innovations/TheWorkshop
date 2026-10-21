from typing import Optional, List
from datetime import datetime, timezone
from uuid import uuid4
from sqlmodel import Field, SQLModel, Relationship

from sqlalchemy import Column, String


class TutorDocument(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    filename: str
    content: str = Field(sa_column=Column(String))
    file_path: Optional[str] = Field(default=None)
    file_type: str = Field(default="text")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Subject(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str = Field(index=True, unique=True)
    description: Optional[str] = None

    topics: List["Topic"] = Relationship(back_populates="subject")
    papers: List["PastPaper"] = Relationship(back_populates="subject")


class Topic(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    subject_id: str = Field(foreign_key="subject.id", index=True)
    title: str
    summary_content: str = Field(sa_column=Column(String))
    order: int = Field(default=0)

    subject: Optional[Subject] = Relationship(back_populates="topics")


class PastPaper(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    subject_id: str = Field(foreign_key="subject.id", index=True)
    title: str
    year: str
    exam_type: str
    file_path: Optional[str] = None
    content: Optional[str] = Field(default=None, sa_column=Column(String))
    duration_minutes: Optional[int] = Field(default=60)

    subject: Optional[Subject] = Relationship(back_populates="papers")


class TestAttempt(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    paper_id: str = Field(foreign_key="pastpaper.id", index=True)
    score: Optional[float] = None
    answers_data: Optional[str] = Field(default=None, sa_column=Column(String))
    feedback_data: Optional[str] = Field(default=None, sa_column=Column(String))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
