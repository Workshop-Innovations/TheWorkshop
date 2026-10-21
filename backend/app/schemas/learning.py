from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, model_validator


class TutorChatRequest(BaseModel):
    document_id: str
    message: str = Field(min_length=1, max_length=4000)
    history: List[dict] = Field(default_factory=list, max_length=40)


class TutorChatResponse(BaseModel):
    response: str


class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class TopicCreate(BaseModel):
    subject_id: str
    title: str
    summary_content: str
    order: Optional[int] = 0


class TopicUpdate(BaseModel):
    subject_id: Optional[str] = None
    title: Optional[str] = None
    summary_content: Optional[str] = None
    order: Optional[int] = None


class PastPaperCreate(BaseModel):
    subject_id: str
    title: str
    year: str
    exam_type: str
    file_path: Optional[str] = None
    content: Optional[str] = None
    duration_minutes: Optional[int] = 60


class PastPaperUpdate(BaseModel):
    subject_id: Optional[str] = None
    title: Optional[str] = None
    year: Optional[str] = None
    exam_type: Optional[str] = None
    file_path: Optional[str] = None
    content: Optional[str] = None
    duration_minutes: Optional[int] = None


class TopicSummaryResponse(BaseModel):
    id: str
    title: str
    order: int

    model_config = {"from_attributes": True}


class TopicResponse(BaseModel):
    id: str
    subject_id: str
    title: str
    summary_content: str
    order: int

    model_config = {"from_attributes": True}


class PastPaperResponse(BaseModel):
    id: str
    subject_id: str
    title: str
    year: str
    exam_type: str
    file_path: Optional[str] = None
    content: Optional[str] = None
    duration_minutes: Optional[int] = 60

    model_config = {"from_attributes": True}


class TestAttemptCreate(BaseModel):
    paper_id: str
    answers_data: Optional[str] = None


class TestAttemptResponse(BaseModel):
    id: str
    user_id: str
    paper_id: str
    score: Optional[float] = None
    answers_data: Optional[str] = None
    feedback_data: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SubjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    topics: List[TopicSummaryResponse] = Field(default_factory=list)
    papers: List[PastPaperResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class GenerateRequest(BaseModel):
    document_id: str


class QuizQuestion(BaseModel):
    question: str
    options: List[str] = Field(min_length=4, max_length=4)
    correct_answer: str

    @model_validator(mode="after")
    def valid_answer(self):
        if len(set(self.options)) != 4 or any(
            not option.strip() for option in self.options
        ):
            raise ValueError("Options must contain four distinct nonempty choices")
        if self.correct_answer not in self.options:
            raise ValueError("The answer must match one of the choices")
        return self


class QuizResponse(BaseModel):
    questions: List[QuizQuestion] = Field(min_length=1, max_length=10)


class FlashcardItem(BaseModel):
    term: str = Field(min_length=1, max_length=1000)
    definition: str = Field(min_length=1, max_length=4000)


class FlashcardsResponse(BaseModel):
    flashcards: List[FlashcardItem] = Field(min_length=1, max_length=30)


class DocumentContentResponse(BaseModel):
    id: str
    filename: str
    content: str
    file_path: Optional[str]
    file_type: str
    created_at: datetime
