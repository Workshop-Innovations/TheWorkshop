from typing import Optional, List
from datetime import datetime, timezone
from uuid import uuid4
from sqlmodel import Field, SQLModel, Relationship


class FlashcardSetLegacy(SQLModel, table=True):
    __tablename__ = "flashcardset_legacy"
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    title: str
    category: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_id: str = Field(foreign_key="user.id", index=True)

    flashcards: List["FlashcardLegacy"] = Relationship(back_populates="flashcard_set")


class FlashcardLegacy(SQLModel, table=True):
    __tablename__ = "flashcard_legacy"
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    question: str
    answer: str
    set_id: str = Field(foreign_key="flashcardset_legacy.id", index=True)

    flashcard_set: Optional[FlashcardSetLegacy] = Relationship(
        back_populates="flashcards"
    )


class FlashcardCollection(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    name: str = Field(nullable=False)
    file_source: str = Field(nullable=False)
    date_created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    cards: List["FlashcardCard"] = Relationship(back_populates="collection")


class FlashcardCard(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    collection_id: str = Field(foreign_key="flashcardcollection.id", index=True)
    term: str = Field(nullable=False)
    definition: str = Field(nullable=False)

    collection: Optional[FlashcardCollection] = Relationship(back_populates="cards")
