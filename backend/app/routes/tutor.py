from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session, select
from typing import List, Optional
import os
import json
import io
import pypdf
from google import genai
from uuid import uuid4
from datetime import datetime, timezone
from pydantic import BaseModel

from ..database import get_session
from ..dependencies import get_current_user
from ..schemas import User, TutorDocument, TutorChatRequest, TutorChatResponse

router = APIRouter(
    prefix="/api/v1/tutor",
    tags=["tutor"]
)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)

# --- Request/Response Schemas for Generation ---
class GenerateRequest(BaseModel):
    document_id: str

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str

class QuizResponse(BaseModel):
    questions: List[QuizQuestion]

class FlashcardItem(BaseModel):
    term: str
    definition: str

class FlashcardsResponse(BaseModel):
    flashcards: List[FlashcardItem]

class DocumentContentResponse(BaseModel):
    id: str
    filename: str
    content: str
    created_at: datetime

# --- Endpoints ---

@router.post("/upload", response_model=dict)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Upload a text or PDF file for the AI Tutor."""
    content = ""
    filename = file.filename.lower() if file.filename else ""

    try:
        content_bytes = await file.read()
        
        if filename.endswith(".pdf"):
            try:
                pdf_reader = pypdf.PdfReader(io.BytesIO(content_bytes))
                for page in pdf_reader.pages:
                    text = page.extract_text()
                    if text:
                        content += text + "\n"
            except Exception as e:
                print(f"PDF Extraction Error: {e}")
                raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
        else:
            # Assume text/markdown
            content = content_bytes.decode("utf-8", errors="ignore")

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=400, detail="Could not read file.")

    if not content.strip():
        raise HTTPException(status_code=400, detail="File is empty or could not be parsed.")

    doc = TutorDocument(
        id=str(uuid4()),
        user_id=current_user.id,
        filename=file.filename,
        content=content,
        created_at=datetime.now(timezone.utc)
    )
    session.add(doc)
    session.commit()
    session.refresh(doc)

    return {"id": doc.id, "filename": doc.filename}

@router.get("/documents", response_model=List[dict])
async def get_documents(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get a list of all uploaded documents for the current user."""
    docs = session.exec(select(TutorDocument).where(TutorDocument.user_id == current_user.id)).all()
    return [{"id": d.id, "filename": d.filename, "created_at": d.created_at} for d in docs]

@router.get("/documents/{document_id}", response_model=DocumentContentResponse)
async def get_document_content(
    document_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get the full content of a specific document."""
    doc = session.exec(
        select(TutorDocument).where(
            TutorDocument.id == document_id,
            TutorDocument.user_id == current_user.id
        )
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return DocumentContentResponse(
        id=doc.id,
        filename=doc.filename,
        content=doc.content,
        created_at=doc.created_at
    )

@router.post("/chat", response_model=TutorChatResponse)
async def chat_with_tutor(
    request: TutorChatRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Chat with the AI Tutor about the document content."""
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured.")

    doc = session.exec(
        select(TutorDocument).where(
            TutorDocument.id == request.document_id,
            TutorDocument.user_id == current_user.id
        )
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    context_prompt = (
        f"You are a helpful AI Tutor. You are answering questions based on the following document context. "
        f"If the answer is not in the document, try to answer generally but mention you are going outside the context.\n\n"
        f"Document Content:\n{doc.content[:30000]}\n\n"
    )

    # Convert frontend history dicts to proper google.genai SDK Content format
    # Frontend sends: {role: "user"|"model", parts: ["text"]}
    # SDK expects:    {role: "user"|"model", parts: [{text: "text"}]}
    formatted_history = []
    for entry in request.history:
        role = entry.get("role", "user")
        parts = entry.get("parts", [])
        text_parts = [
            {"text": p} if isinstance(p, str) else p for p in parts
        ]
        formatted_history.append({"role": role, "parts": text_parts})

    try:
        chat = client.chats.create(model='gemini-2.0-flash', history=formatted_history)
        response = chat.send_message(context_prompt + f"Question: {request.message}")
        return TutorChatResponse(response=response.text)
    except Exception as e:
        print(f"Chat error (falling back to single-shot): {e}")
        # Fallback to single generation if chat fails
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=context_prompt + f"Question: {request.message}"
        )
        return TutorChatResponse(response=response.text)


@router.post("/generate/quiz", response_model=QuizResponse)
async def generate_quiz(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Generate a multiple-choice quiz from the document content."""
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured.")

    doc = session.exec(
        select(TutorDocument).where(
            TutorDocument.id == request.document_id,
            TutorDocument.user_id == current_user.id
        )
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    prompt = (
        f"Based on the following document content, generate exactly 10 multiple-choice quiz questions. "
        f"Each question MUST have exactly 4 options (A, B, C, D) and one correct answer. "
        f"Return the output strictly as a JSON list of objects with keys: 'question', 'options' (a list of 4 strings), and 'correct_answer' (the text of the correct option).\n\n"
        f"Document Content:\n{doc.content[:20000]}"
    )

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )
        quiz_data = json.loads(response.text)
        
        if not isinstance(quiz_data, list):
            if "questions" in quiz_data:
                quiz_data = quiz_data["questions"]
            else:
                raise ValueError("Expected a list of questions")
        
        return QuizResponse(questions=[QuizQuestion(**q) for q in quiz_data])
    except Exception as e:
        print(f"Quiz Generation Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Quiz generation failed: {str(e)}")


@router.post("/generate/flashcards", response_model=FlashcardsResponse)
async def generate_flashcards(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Generate flashcards (term/definition pairs) from the document content."""
    if not client:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured.")

    doc = session.exec(
        select(TutorDocument).where(
            TutorDocument.id == request.document_id,
            TutorDocument.user_id == current_user.id
        )
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    prompt = (
        f"Based on the following document content, generate exactly 15 flashcards for studying. "
        f"Each flashcard should have a 'term' (a key concept, word, or question) and a 'definition' (the explanation or answer). "
        f"Return the output strictly as a JSON list of objects with keys: 'term' and 'definition'.\n\n"
        f"Document Content:\n{doc.content[:20000]}"
    )

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )
        flashcards_data = json.loads(response.text)
        
        if not isinstance(flashcards_data, list):
            if "flashcards" in flashcards_data:
                flashcards_data = flashcards_data["flashcards"]
            else:
                raise ValueError("Expected a list of flashcards")
        
        return FlashcardsResponse(flashcards=[FlashcardItem(**f) for f in flashcards_data])
    except Exception as e:
        print(f"Flashcard Generation Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Flashcard generation failed: {str(e)}")
