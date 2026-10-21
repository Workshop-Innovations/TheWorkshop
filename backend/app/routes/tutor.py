from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select
from typing import List, Optional
import os
import json
from google import genai
from uuid import uuid4
from datetime import datetime, timezone

from ..database import get_session
from ..dependencies import get_current_user, get_user_from_token
from ..models import User, TutorDocument
from ..schemas import TutorChatRequest, TutorChatResponse
from ..services.ai_usage import reserve_query, refund_query
from ..schemas.learning import (
    GenerateRequest,
    QuizQuestion,
    QuizResponse,
    FlashcardItem,
    FlashcardsResponse,
    DocumentContentResponse,
)
from ..services.documents import extract_document
from starlette.concurrency import run_in_threadpool
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/tutor", tags=["tutor"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
else:
    logger.info("AI tutor is disabled: GEMINI_API_KEY is not configured")

MAX_HISTORY_TURNS = 20


@router.post("/upload", response_model=dict)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Upload a text or PDF file for the AI Tutor."""
    filename = (file.filename or "").replace("\\", "/").rsplit("/", 1)[-1]
    if not filename or len(filename) > 255:
        raise HTTPException(status_code=400, detail="Provide a valid filename.")
    content_bytes = await file.read(10 * 1024 * 1024 + 1)
    if len(content_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413, detail="Documents must be 10 MB or smaller."
        )
    content, file_type = await run_in_threadpool(
        extract_document, filename, content_bytes
    )
    doc_id = str(uuid4())
    file_path = None
    if file_type == "pdf":
        url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY")
        if not url or not key:
            raise HTTPException(
                status_code=503,
                detail="PDF storage is unavailable. Upload text or Markdown instead.",
            )
        file_path = f"{doc_id}.pdf"

        def store_pdf():
            from supabase import create_client

            create_client(url, key).storage.from_("tutor_documents").upload(
                file_path,
                content_bytes,
                file_options={"content-type": "application/pdf"},
            )

        try:
            await run_in_threadpool(store_pdf)
        except Exception:
            logger.exception("Tutor PDF storage failed")
            raise HTTPException(
                status_code=503, detail="Document storage is unavailable. Please retry."
            )

    doc = TutorDocument(
        id=doc_id,
        user_id=current_user.id,
        filename=filename,
        content=content,
        file_path=file_path,
        file_type=file_type,
        created_at=datetime.now(timezone.utc),
    )
    session.add(doc)
    session.commit()
    session.refresh(doc)

    return {"id": doc.id, "filename": doc.filename, "file_type": doc.file_type}


@router.get("/documents", response_model=List[dict])
async def get_documents(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get a list of all uploaded documents for the current user."""
    docs = session.exec(
        select(TutorDocument).where(TutorDocument.user_id == current_user.id)
    ).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "created_at": d.created_at,
        }
        for d in docs
    ]


@router.get("/documents/{document_id}", response_model=DocumentContentResponse)
async def get_document_content(
    document_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get the full content of a specific document."""
    doc = session.exec(
        select(TutorDocument).where(
            TutorDocument.id == document_id, TutorDocument.user_id == current_user.id
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
        created_at=doc.created_at,
    )


@router.get("/files/{document_id}")
async def serve_document_file(
    document_id: str,
    token: Optional[str] = None,
    session: Session = Depends(get_session),
):
    """Serve the original PDF file for embedding. Accepts token as query parameter."""
    user = get_user_from_token(session, token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    doc = session.exec(
        select(TutorDocument).where(
            TutorDocument.id == document_id, TutorDocument.user_id == user.id
        )
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if not doc.file_path:
        raise HTTPException(status_code=404, detail="File path not found for document.")

    from supabase import create_client, Client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")

    if not url or not key:
        raise HTTPException(status_code=500, detail="Supabase not configured.")

    supabase: Client = create_client(url, key)

    res = supabase.storage.from_("tutor_documents").create_signed_url(doc.file_path, 60)

    if isinstance(res, dict) and "signedURL" in res:
        signed_url = res["signedURL"]
    elif hasattr(res, "signed_url"):
        signed_url = res.signed_url
    else:
        signed_url = str(res)

    if not signed_url or "error" in signed_url.lower():
        raise HTTPException(status_code=404, detail="Could not generate signed URL.")

    from fastapi.responses import RedirectResponse

    return RedirectResponse(url=signed_url)


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Delete a document and its associated file from storage."""
    doc = session.exec(
        select(TutorDocument).where(
            TutorDocument.id == document_id, TutorDocument.user_id == current_user.id
        )
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if doc.file_path:
        try:
            from supabase import create_client, Client

            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_KEY")
            if url and key:
                supabase: Client = create_client(url, key)
                supabase.storage.from_("tutor_documents").remove([doc.file_path])
        except Exception as e:
            print(f"Warning: Could not delete file from storage: {e}")

    session.delete(doc)
    session.commit()


@router.post("/chat", response_model=TutorChatResponse)
async def chat_with_tutor(
    request: TutorChatRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Chat with the AI Tutor about the document content."""
    if not client:
        raise HTTPException(
            status_code=503,
            detail="AI Tutor is not configured. Please contact the administrator.",
        )

    doc = session.exec(
        select(TutorDocument).where(
            TutorDocument.id == request.document_id,
            TutorDocument.user_id == current_user.id,
        )
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    context_prompt = (
        f"You are a helpful AI Tutor. You are answering questions based on the following document context. "
        f"If the answer is not in the document, try to answer generally but mention you are going outside the context.\n\n"
        f"Document Content:\n{doc.content[:30000]}\n\n"
    )

    formatted_history = []
    for entry in request.history[-MAX_HISTORY_TURNS:]:
        role = entry.get("role", "user")
        parts = entry.get("parts", [])
        text_parts = [{"text": p} if isinstance(p, str) else p for p in parts]
        formatted_history.append({"role": role, "parts": text_parts})

    reserved_day = reserve_query(session, current_user)
    try:

        chat = client.aio.chats.create(
            model="gemini-2.5-flash", history=formatted_history
        )
        response = await chat.send_message(
            context_prompt + f"Question: {request.message}"
        )

        return TutorChatResponse(response=response.text)
    except Exception as e:
        refund_query(session, current_user, reserved_day)
        logger.exception("Tutor chat failed")
        raise HTTPException(
            status_code=502, detail="The tutor could not respond. Please retry."
        )


@router.post("/generate/quiz", response_model=QuizResponse)
async def generate_quiz(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Generate a multiple-choice quiz from the document content."""
    if not client:
        raise HTTPException(
            status_code=503,
            detail="AI Quiz generator is not configured. Please contact the administrator.",
        )

    doc = session.exec(
        select(TutorDocument).where(
            TutorDocument.id == request.document_id,
            TutorDocument.user_id == current_user.id,
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

    reserved_day = reserve_query(session, current_user)
    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={"response_mime_type": "application/json"},
        )
        quiz_data = json.loads(response.text)

        if not isinstance(quiz_data, list):
            if "questions" in quiz_data:
                quiz_data = quiz_data["questions"]
            else:
                raise ValueError("Expected a list of questions")

        return QuizResponse(questions=[QuizQuestion(**q) for q in quiz_data])
    except Exception as e:
        refund_query(session, current_user, reserved_day)
        logger.exception("Quiz generation failed")
        raise HTTPException(
            status_code=502,
            detail="The generated quiz was unavailable or invalid. Please retry.",
        )


@router.post("/generate/flashcards", response_model=FlashcardsResponse)
async def generate_flashcards(
    request: GenerateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Generate flashcards (term/definition pairs) from the document content."""
    if not client:
        raise HTTPException(
            status_code=503,
            detail="AI Flashcard generator is not configured. Please contact the administrator.",
        )

    doc = session.exec(
        select(TutorDocument).where(
            TutorDocument.id == request.document_id,
            TutorDocument.user_id == current_user.id,
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

    reserved_day = reserve_query(session, current_user)
    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={"response_mime_type": "application/json"},
        )
        flashcards_data = json.loads(response.text)

        if not isinstance(flashcards_data, list):
            if "flashcards" in flashcards_data:
                flashcards_data = flashcards_data["flashcards"]
            else:
                raise ValueError("Expected a list of flashcards")

        return FlashcardsResponse(
            flashcards=[FlashcardItem(**f) for f in flashcards_data]
        )
    except Exception as e:
        refund_query(session, current_user, reserved_day)
        logger.exception("Flashcard generation failed")
        raise HTTPException(
            status_code=502,
            detail="The generated flashcards were unavailable or invalid. Please retry.",
        )
