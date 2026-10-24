from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlmodel import Session, select
from typing import List, Optional
import os
import json
import io
import logging
import pypdf
from google import genai
from uuid import uuid4
from datetime import datetime, timezone, date
from pydantic import BaseModel
import shutil
from pathlib import Path

from ..database import get_session
from ..dependencies import get_current_user, get_user_from_token
from ..schemas import User, TutorDocument, TutorChatRequest, TutorChatResponse
from ..utils import get_supabase
from .subscriptions import PLAN_LIMITS, effective_tier

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/tutor",
    tags=["tutor"]
)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not set. AI Tutor features will not work.")

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB

_get_supabase = get_supabase

# Removed local uploads directory creation

# Max chat turns from the client's history forwarded to the model per request
MAX_HISTORY_TURNS = 20


def check_ai_query_limit(session: Session, user: User) -> None:
    """Check and enforce the daily AI query limit. Increments the counter
    BEFORE the AI call to prevent race-condition bypass."""
    tier = effective_tier(user)
    daily_limit = PLAN_LIMITS[tier]["ai_queries_daily"]
    today = datetime.now(timezone.utc).date()

    if user.last_ai_query_date != today:
        user.ai_queries_today = 0
        user.last_ai_query_date = today

    if daily_limit != -1 and user.ai_queries_today >= daily_limit:
        raise HTTPException(
            status_code=402,
            detail=f"Daily AI query limit reached ({daily_limit}/day on {tier.title()} plan). Upgrade your plan to get more queries."
        )

    # Increment BEFORE the AI call to prevent concurrent-request bypass
    user.ai_queries_today += 1
    session.add(user)
    session.commit()


def rollback_ai_query(session: Session, user: User) -> None:
    """Decrement the counter if the AI call failed after we incremented it."""
    if user.ai_queries_today > 0:
        user.ai_queries_today -= 1
        session.add(user)
        session.commit()

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
    file_path: Optional[str]
    file_type: str
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
    file_path = None
    file_type = "text"

    try:
        content_bytes = await file.read()
        if len(content_bytes) > MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")
        
        if filename.endswith(".pdf"):
            file_type = "pdf"
            # Save the PDF file to Supabase
            doc_id = str(uuid4())
            file_path = f"{doc_id}_{file.filename}"
            
            sb = _get_supabase()
            if sb:
                sb.storage.from_("tutor_documents").upload(
                    file_path,
                    content_bytes,
                    file_options={"cache-control": "3600", "upsert": "true"}
                )
            else:
                logger.warning("Supabase not configured. Tutor docs won't be saved.")

            # Extract text for AI processing
            try:
                pdf_reader = pypdf.PdfReader(io.BytesIO(content_bytes))
                for page in pdf_reader.pages:
                    text = page.extract_text()
                    if text:
                        content += text + "\n"
            except Exception as e:
                logger.exception("PDF extraction failed")
                if sb:
                    sb.storage.from_("tutor_documents").remove([file_path])
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
        id=doc_id if file_type == "pdf" else str(uuid4()),
        user_id=current_user.id,
        filename=file.filename,
        content=content,
        file_path=file_path,
        file_type=file_type,
        created_at=datetime.now(timezone.utc)
    )
    session.add(doc)
    session.commit()
    session.refresh(doc)

    return {"id": doc.id, "filename": doc.filename, "file_type": doc.file_type}

@router.get("/documents", response_model=List[dict])
async def get_documents(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get a list of all uploaded documents for the current user."""
    docs = session.exec(select(TutorDocument).where(TutorDocument.user_id == current_user.id)).all()
    return [{
        "id": d.id, 
        "filename": d.filename, 
        "file_type": d.file_type,
        "created_at": d.created_at
    } for d in docs]

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
        file_path=doc.file_path,
        file_type=doc.file_type,
        created_at=doc.created_at
    )

@router.get("/files/{document_id}")
async def serve_document_file(
    document_id: str,
    token: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """Serve the original PDF file for embedding. Accepts token as query parameter."""
    user = get_user_from_token(session, token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    doc = session.exec(
        select(TutorDocument).where(
            TutorDocument.id == document_id,
            TutorDocument.user_id == user.id
        )
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    if not doc.file_path:
        raise HTTPException(status_code=404, detail="File path not found for document.")
    
    sb = _get_supabase()
    if not sb:
        raise HTTPException(status_code=500, detail="Supabase not configured.")

    # Generate signed url valid for 60 seconds
    res = sb.storage.from_("tutor_documents").create_signed_url(doc.file_path, 60)
    
    # create_signed_url returns a dict like {'signedURL': '...'} or {'error': '...'} in python client
    if isinstance(res, dict) and "signedURL" in res:
        signed_url = res["signedURL"]
    elif hasattr(res, "signed_url"):
         signed_url = res.signed_url
    else:
         signed_url = str(res) # Fallback if it returns the url directly
         
    if not signed_url or "error" in signed_url.lower():
        raise HTTPException(status_code=404, detail="Could not generate signed URL.")
        
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=signed_url)


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a document and its associated file from storage."""
    doc = session.exec(
        select(TutorDocument).where(
            TutorDocument.id == document_id,
            TutorDocument.user_id == current_user.id
        )
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Delete from Supabase storage if it's a PDF
    if doc.file_path:
        try:
            sb = _get_supabase()
            if sb:
                sb.storage.from_("tutor_documents").remove([doc.file_path])
        except Exception as e:
            logger.warning("Could not delete file from storage: %s", e)

    session.delete(doc)
    session.commit()


@router.post("/chat", response_model=TutorChatResponse)
async def chat_with_tutor(
    request: TutorChatRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Chat with the AI Tutor about the document content."""
    if not client:
        raise HTTPException(
            status_code=500, 
            detail="AI Tutor is not configured. Please contact the administrator."
        )

    # --- Subscription Limit Check (increments counter before AI call) ---
    check_ai_query_limit(session, current_user)

    doc = session.exec(
        select(TutorDocument).where(
            TutorDocument.id == request.document_id,
            TutorDocument.user_id == current_user.id
        )
    ).first()
    if not doc:
        rollback_ai_query(session, current_user)
        raise HTTPException(status_code=404, detail="Document not found.")

    context_prompt = (
        f"You are a helpful AI Tutor. You are answering questions based on the following document context. "
        f"If the answer is not in the document, try to answer generally but mention you are going outside the context.\n\n"
        f"Document Content:\n{doc.content[:30000]}\n\n"
    )

    # Convert frontend history to proper format.
    # Only the most recent turns are sent, to keep token cost per request bounded.
    formatted_history = []
    for entry in request.history[-MAX_HISTORY_TURNS:]:
        role = entry.get("role", "user")
        parts = entry.get("parts", [])
        text_parts = [
            {"text": p} if isinstance(p, str) else p for p in parts
        ]
        formatted_history.append({"role": role, "parts": text_parts})

    try:
        chat = client.aio.chats.create(model='gemini-2.5-flash', history=formatted_history)
        response = await chat.send_message(context_prompt + f"Question: {request.message}")
        return TutorChatResponse(response=response.text)
    except Exception as e:
        logger.exception("AI chat failed")
        rollback_ai_query(session, current_user)
        raise HTTPException(
            status_code=500,
            detail="An error occurred processing your request. Please try again."
        )


@router.post("/generate/quiz", response_model=QuizResponse)
async def generate_quiz(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Generate a multiple-choice quiz from the document content."""
    if not client:
        raise HTTPException(
            status_code=500,
            detail="AI Quiz generator is not configured. Please contact the administrator."
        )

    check_ai_query_limit(session, current_user)

    doc = session.exec(
        select(TutorDocument).where(
            TutorDocument.id == request.document_id,
            TutorDocument.user_id == current_user.id
        )
    ).first()
    if not doc:
        rollback_ai_query(session, current_user)
        raise HTTPException(status_code=404, detail="Document not found.")

    prompt = (
        f"Based on the following document content, generate exactly 10 multiple-choice quiz questions. "
        f"Each question MUST have exactly 4 options (A, B, C, D) and one correct answer. "
        f"Return the output strictly as a JSON list of objects with keys: 'question', 'options' (a list of 4 strings), and 'correct_answer' (the text of the correct option).\n\n"
        f"Document Content:\n{doc.content[:20000]}"
    )

    try:
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
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
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("AI quiz generation failed")
        rollback_ai_query(session, current_user)
        raise HTTPException(status_code=500, detail="AI quiz generation failed. Please try again.")


@router.post("/generate/flashcards", response_model=FlashcardsResponse)
async def generate_flashcards(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Generate flashcards (term/definition pairs) from the document content."""
    if not client:
        raise HTTPException(
            status_code=500,
            detail="AI Flashcard generator is not configured. Please contact the administrator."
        )

    check_ai_query_limit(session, current_user)

    doc = session.exec(
        select(TutorDocument).where(
            TutorDocument.id == request.document_id,
            TutorDocument.user_id == current_user.id
        )
    ).first()
    if not doc:
        rollback_ai_query(session, current_user)
        raise HTTPException(status_code=404, detail="Document not found.")

    prompt = (
        f"Based on the following document content, generate exactly 15 flashcards for studying. "
        f"Each flashcard should have a 'term' (a key concept, word, or question) and a 'definition' (the explanation or answer). "
        f"Return the output strictly as a JSON list of objects with keys: 'term' and 'definition'.\n\n"
        f"Document Content:\n{doc.content[:20000]}"
    )

    try:
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
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
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("AI flashcard generation failed")
        rollback_ai_query(session, current_user)
        raise HTTPException(status_code=500, detail="AI flashcard generation failed. Please try again.")
