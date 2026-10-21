from typing import List
from datetime import datetime
from pydantic import BaseModel, Field


class FlashcardContent(BaseModel):
    term: str
    definition: str


class FlashcardSetResponse(BaseModel):
    id: str
    title: str
    category: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FlashcardLegacyResponse(BaseModel):
    id: str
    question: str
    answer: str

    model_config = {"from_attributes": True}


class FlashcardSetDetailResponse(FlashcardSetResponse):
    flashcards: List[FlashcardLegacyResponse]


class FileGenerationRequest(BaseModel):
    file_url: str
    file_name: str


class FlashcardCardResponse(BaseModel):
    id: str
    term: str
    definition: str

    model_config = {"from_attributes": True}


class FlashcardCollectionResponse(BaseModel):
    id: str
    name: str
    file_source: str
    date_created: datetime
    cards: List[FlashcardCardResponse]

    model_config = {"from_attributes": True}


class GeneratedCard(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    answer: str = Field(min_length=1, max_length=8000)
