from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlmodel import Session, select
from typing import List
import os
import google.generativeai as genai
from uuid import uuid4
from datetime import datetime, timezone

from ..database import get_session
from ..dependencies import get_current_user
from ..schemas import (
    User, FlashcardSet, Flashcard, 
    FlashcardSetResponse, FlashcardResponse, FlashcardSetDetailResponse
)

router = APIRouter(
    prefix="/api/v1/flashcards",
    tags=["flashcards"]
)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

@router.post("/generate", response_model=FlashcardSetDetailResponse, status_code=status.HTTP_201_CREATED)
async def generate_flashcards(
    title: str = Form(...),
    category: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Gemini API Key not configured."
        )

    # Read file content
    content = ""
    if file.content_type == "application/pdf":
        try:
            content_bytes = await file.read()
            content = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
             raise HTTPException(status_code=400, detail="Only text files are supported for now (or text-based PDFs).")
    else:
        content_bytes = await file.read()
        try:
            content = content_bytes.decode("utf-8")
        except:
             raise HTTPException(status_code=400, detail="Could not decode file content.")

    if not content:
        raise HTTPException(status_code=400, detail="File is empty.")

    # Call Gemini
    model = genai.GenerativeModel('gemini-pro')
    
    prompt = (
        f"Generate exactly 50 question-and-answer pairs based on the following text. "
        f"Format the output as a single continuous string where pairs are separated by '|||' "
        f"and the question and answer are separated by ':::'. "
        f"Example: 'Question 1:::Answer 1|||Question 2:::Answer 2'. "
        f"Do not use JSON. Do not number them. Just the raw string.\n\n"
        f"Text: {content[:10000]}" # Limit context if needed
    )

    try:
        response = model.generate_content(prompt)
        generated_text = response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Generation failed: {str(e)}")

    # Parse response
    pairs = generated_text.split('|||')
    flashcards_data = []
    
    for pair in pairs:
        if ':::' in pair:
            q, a = pair.split(':::', 1)
            flashcards_data.append({"question": q.strip(), "answer": a.strip()})
    
    if not flashcards_data:
         raise HTTPException(status_code=500, detail="Failed to parse AI response.")

    # Create Set
    flashcard_set = FlashcardSet(
        id=str(uuid4()),
        title=title,
        category=category,
        user_id=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    session.add(flashcard_set)
    session.commit()
    session.refresh(flashcard_set)

    # Create Cards
    created_cards = []
    for card_data in flashcards_data:
        card = Flashcard(
            id=str(uuid4()),
            question=card_data["question"],
            answer=card_data["answer"],
            set_id=flashcard_set.id
        )
        session.add(card)
        created_cards.append(card)
    
    session.commit()
    
    # Construct response
    return FlashcardSetDetailResponse(
        id=flashcard_set.id,
        title=flashcard_set.title,
        category=flashcard_set.category,
        created_at=flashcard_set.created_at,
        flashcards=[FlashcardResponse.model_validate(c) for c in created_cards]
    )

@router.post("/sets", response_model=FlashcardSetResponse, status_code=status.HTTP_201_CREATED)
async def create_flashcard_set(
    flashcard_set_data: FlashcardSet, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    new_set = FlashcardSet(
        id=str(uuid4()),
        title=flashcard_set_data.title,
        category=flashcard_set_data.category,
        user_id=current_user.id,
        created_at=datetime.now(timezone.utc)
    )
    
    session.add(new_set)
    session.commit()
    session.refresh(new_set)
    return new_set

@router.get("/sets", response_model=List[FlashcardSetResponse])
async def get_flashcard_sets(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    sets = session.exec(select(FlashcardSet).where(FlashcardSet.user_id == current_user.id)).all()
    return sets

@router.get("/sets/{set_id}", response_model=FlashcardSetDetailResponse)
async def get_flashcard_set(
    set_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    flashcard_set = session.exec(select(FlashcardSet).where(FlashcardSet.id == set_id, FlashcardSet.user_id == current_user.id)).first()
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    return flashcard_set

@router.post("/sets/{set_id}/cards", response_model=FlashcardResponse, status_code=status.HTTP_201_CREATED)
async def create_flashcard(
    set_id: str,
    flashcard_data: Flashcard,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify set ownership
    flashcard_set = session.exec(select(FlashcardSet).where(FlashcardSet.id == set_id, FlashcardSet.user_id == current_user.id)).first()
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")

    new_card = Flashcard(
        id=str(uuid4()),
        question=flashcard_data.question,
        answer=flashcard_data.answer,
        set_id=set_id
    )
    
    session.add(new_card)
    session.commit()
    session.refresh(new_card)
    return new_card
