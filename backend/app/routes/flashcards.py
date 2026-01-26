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
    User, FlashcardSetLegacy, FlashcardLegacy,
    FlashcardSetResponse, FlashcardLegacyResponse, FlashcardSetDetailResponse,
    FlashcardCollection, FlashcardCard, FileGenerationRequest,
    FlashcardCollectionResponse, FlashcardCardResponse
)
from ..services.flashcard_service import fetch_cards_from_file

router = APIRouter(
    prefix="/api/v1/flashcards",
    tags=["flashcards"]
)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)



@router.post("/generate_from_file", response_model=FlashcardCollectionResponse, status_code=status.HTTP_201_CREATED)
async def generate_flashcards_from_file_url(
    request: FileGenerationRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Fetch from Make.com using file URL
    generated_cards = await fetch_cards_from_file(request.file_url, request.file_name, current_user.id)
    
    # Create Collection
    collection = FlashcardCollection(
        id=str(uuid4()),
        user_id=current_user.id,
        name=request.file_name,
        file_source=request.file_url,
        date_created=datetime.now(timezone.utc)
    )
    session.add(collection)
    session.commit()
    session.refresh(collection)
    
    # Create Cards
    saved_cards = []
    for card_data in generated_cards:
        new_card = FlashcardCard(
            id=str(uuid4()),
            collection_id=collection.id,
            term=card_data.term,
            definition=card_data.definition
        )
        session.add(new_card)
        saved_cards.append(new_card)
        
    session.commit()
    
    # Refresh to return full data
    session.refresh(collection)
    # We need to manually construct response or ensure relationships are loaded
    # SQLModel relationships are lazy by default, but session.refresh might not load them immediately if not accessed.
    # Let's query the cards to be safe or rely on response_model to trigger loading if configured.
    # For explicit loading:
    cards = session.exec(select(FlashcardCard).where(FlashcardCard.collection_id == collection.id)).all()
    
    return FlashcardCollectionResponse(
        id=collection.id,
        name=collection.name,
        file_source=collection.file_source,
        date_created=collection.date_created,
        cards=[FlashcardCardResponse.model_validate(c) for c in cards]
    )

@router.get("/collections", response_model=List[FlashcardCollectionResponse])
async def get_collections(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    collections = session.exec(select(FlashcardCollection).where(FlashcardCollection.user_id == current_user.id)).all()
    return collections

@router.get("/collections/{collection_id}", response_model=FlashcardCollectionResponse)
async def get_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    collection = session.exec(select(FlashcardCollection).where(FlashcardCollection.id == collection_id, FlashcardCollection.user_id == current_user.id)).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
        
    cards = session.exec(select(FlashcardCard).where(FlashcardCard.collection_id == collection_id)).all()
    
    return FlashcardCollectionResponse(
        id=collection.id,
        name=collection.name,
        file_source=collection.file_source,
        date_created=collection.date_created,
        cards=[FlashcardCardResponse.model_validate(c) for c in cards]
    )

@router.post("/generate/file", response_model=FlashcardSetDetailResponse, status_code=status.HTTP_201_CREATED)
async def generate_flashcards_from_file(
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
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = (
        f"Generate exactly 20 question-and-answer pairs based on the following text. "
        f"Return the output strictly as a JSON list of objects, where each object has 'question' and 'answer' keys. "
        f"Example: [{{\"question\": \"Q1\", \"answer\": \"A1\"}}, ...]\n\n"
        f"Text: {content[:15000]}" # Increased context limit
    )

    try:
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        generated_text = response.text
    except Exception as e:
        print(f"Gemini Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Generation failed: {str(e)}")

    # Parse response
    import json
    try:
        flashcards_data = json.loads(generated_text)
        if not isinstance(flashcards_data, list):
             # Handle case where it might be wrapped
             if "cards" in flashcards_data:
                 flashcards_data = flashcards_data["cards"]
             else:
                 raise ValueError("JSON is not a list")
    except Exception as e:
        print(f"Parsing Error: {e}, Content: {generated_text}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response. Please try again.")

    if not flashcards_data:
         raise HTTPException(status_code=500, detail="No flashcards generated.")

    # Create Set
    flashcard_set = FlashcardSetLegacy(
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
        card = FlashcardLegacy(
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
        flashcards=[FlashcardLegacyResponse.model_validate(c) for c in created_cards]
    )

@router.post("/sets", response_model=FlashcardSetResponse, status_code=status.HTTP_201_CREATED)
async def create_flashcard_set(
    flashcard_set_data: FlashcardSetLegacy, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    new_set = FlashcardSetLegacy(
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
    sets = session.exec(select(FlashcardSetLegacy).where(FlashcardSetLegacy.user_id == current_user.id)).all()
    return sets

@router.get("/sets/{set_id}", response_model=FlashcardSetDetailResponse)
async def get_flashcard_set(
    set_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    flashcard_set = session.exec(select(FlashcardSetLegacy).where(FlashcardSetLegacy.id == set_id, FlashcardSetLegacy.user_id == current_user.id)).first()
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    return flashcard_set

@router.post("/sets/{set_id}/cards", response_model=FlashcardLegacyResponse, status_code=status.HTTP_201_CREATED)
async def create_flashcard(
    set_id: str,
    flashcard_data: FlashcardLegacy,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify set ownership
    flashcard_set = session.exec(select(FlashcardSetLegacy).where(FlashcardSetLegacy.id == set_id, FlashcardSetLegacy.user_id == current_user.id)).first()
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")

    new_card = FlashcardLegacy(
        id=str(uuid4()),
        question=flashcard_data.question,
        answer=flashcard_data.answer,
        set_id=set_id
    )
    
    session.add(new_card)
    session.commit()
    session.refresh(new_card)
    return new_card
