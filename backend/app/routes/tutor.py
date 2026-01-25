from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session, select
from typing import List
import os
import google.generativeai as genai
from uuid import uuid4
from datetime import datetime, timezone

from ..database import get_session
from ..dependencies import get_current_user
from ..schemas import User, TutorDocument, TutorChatRequest, TutorChatResponse

router = APIRouter(
    prefix="/api/v1/tutor",
    tags=["tutor"]
)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

@router.post("/upload", response_model=dict)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Read file content
    content = ""
    # Simple text extraction
    try:
        content_bytes = await file.read()
        content = content_bytes.decode("utf-8", errors="ignore") # Ignore errors for MVP
    except Exception as e:
        raise HTTPException(status_code=400, detail="Could not read file.")

    if not content:
        raise HTTPException(status_code=400, detail="File is empty.")

    # Save to DB
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
    docs = session.exec(select(TutorDocument).where(TutorDocument.user_id == current_user.id)).all()
    return [{"id": d.id, "filename": d.filename, "created_at": d.created_at} for d in docs]

@router.post("/chat", response_model=TutorChatResponse)
async def chat_with_tutor(
    request: TutorChatRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Fetch content
    doc = session.exec(select(TutorDocument).where(TutorDocument.id == request.document_id, TutorDocument.user_id == current_user.id)).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # Construct history
    # Gemini history format: history=[{'role': 'user', 'parts': ['...']}, ...]
    chat_history = []
    # System instruction / Context injection
    context_prompt = (
        f"You are a helpful AI Tutor. You are answering questions based on the following document context. "
        f"If the answer is not in the document, try to answer generally but mention you are going outside the context.\n\n"
        f"Document Content:\n{doc.content[:30000]}\n\n" # Limit context
    )
    
    # Prepend context to the first message or history
    # Actually, easiest is to start a chat session with history
    try:
        chat = model.start_chat(history=request.history)
        response = chat.send_message(context_prompt + f"Question: {request.message}")
        return TutorChatResponse(response=response.text)
    except Exception as e:
        # Fallback if history is invalid or other error
        # Try single generation
        response = model.generate_content(context_prompt + f"Question: {request.message}")
        return TutorChatResponse(response=response.text)
