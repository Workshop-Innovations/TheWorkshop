from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlmodel import Session, select
from typing import List
import os
from google import genai
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
import tempfile
import shutil
import json

router = APIRouter(
    prefix="/api/v1/flashcards",
    tags=["flashcards"]
)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)


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
    if not client:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Gemini API Key not configured."
        )

    # Validate file type
    # For now, Gemini supports PDF, text, images, etc. We'll focus on PDF and text.
    supported_types = ["application/pdf", "text/plain", "text/csv", "application/json"]
    if file.content_type not in supported_types and not file.content_type.startswith("image/"):
         raise HTTPException(
             status_code=status.HTTP_400_BAD_REQUEST,
             detail=f"Unsupported file type: {file.content_type}. Supported types: PDF, text, CSV, JSON, and images."
         )

    # Save uploaded file to a temporary file because genai.upload_file requires a path
    suffix = f".{file.filename.split('.')[-1]}" if '.' in file.filename else ".tmp"
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_path = tmp_file.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save temporary file: {str(e)}")

    try:
        # Upload to Gemini
        uploaded_file = client.files.upload(path=tmp_path, config={'mime_type': file.content_type})
        
        prompt = (
            "Generate exactly 20 question-and-answer pairs based on the content of the attached file. "
            "Return the output strictly as a JSON list of objects, where each object has 'question' and 'answer' keys. "
            "Example: [{\"question\": \"What is X?\", \"answer\": \"X is Y\"}]"
        )
        
        # Generate content with file and prompt
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[uploaded_file, prompt],
            config={"response_mime_type": "application/json"}
        )
        
        generated_text = response.text
        
        # Clean up Gemini file (optional)
        # client.files.delete(name=uploaded_file.name) 
        
    except Exception as e:
        print(f"Gemini API Error: {e}")
        try:
            os.remove(tmp_path)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"AI Generation failed: {str(e)}")
    
    # Clean up local temp file
    try:
        os.remove(tmp_path)
    except:
        pass

    # Parse JSON
    try:
        flashcards_data = json.loads(generated_text)
        if hasattr(flashcards_data, "cards"): # Handle if struct is nested (some models do this)
             flashcards_data = flashcards_data.cards
        
        if not isinstance(flashcards_data, list):
             # Try to find a list in the dictionary if it returned an object
             if isinstance(flashcards_data, dict):
                 for key in flashcards_data:
                     if isinstance(flashcards_data[key], list):
                         flashcards_data = flashcards_data[key]
                         break
             
        if not isinstance(flashcards_data, list):
             raise ValueError("JSON output is not a list")

    except Exception as e:
        print(f"JSON Parsing Error: {e}, Content: {generated_text}")
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
        # Robustly handle keys
        q = card_data.get("question") or card_data.get("term") or card_data.get("q")
        a = card_data.get("answer") or card_data.get("definition") or card_data.get("a")
        
        if q and a:
            card = FlashcardLegacy(
                id=str(uuid4()),
                question=str(q),
                answer=str(a),
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
