from ..schemas.flashcards import GeneratedCard
import logging
from ..services.ai_usage import reserve_query, refund_query
from starlette.concurrency import run_in_threadpool

logger = logging.getLogger(__name__)
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlmodel import Session, select
from typing import List
import os
from pathlib import Path
from google import genai
from uuid import uuid4
from datetime import datetime, timezone

from ..database import get_session
from ..dependencies import get_current_user
from ..models import (
    User,
    FlashcardSetLegacy,
    FlashcardLegacy,
    FlashcardCollection,
    FlashcardCard,
)
from ..schemas import (
    FlashcardSetResponse,
    FlashcardLegacyResponse,
    FlashcardSetDetailResponse,
    FlashcardCollectionResponse,
    FlashcardCardResponse,
)
import tempfile
import json

router = APIRouter(prefix="/api/v1/flashcards", tags=["flashcards"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)


@router.get("/collections", response_model=List[FlashcardCollectionResponse])
async def get_collections(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    collections = session.exec(
        select(FlashcardCollection).where(
            FlashcardCollection.user_id == current_user.id
        )
    ).all()
    return collections


@router.get("/collections/{collection_id}", response_model=FlashcardCollectionResponse)
async def get_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    collection = session.exec(
        select(FlashcardCollection).where(
            FlashcardCollection.id == collection_id,
            FlashcardCollection.user_id == current_user.id,
        )
    ).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    cards = session.exec(
        select(FlashcardCard).where(FlashcardCard.collection_id == collection_id)
    ).all()

    return FlashcardCollectionResponse(
        id=collection.id,
        name=collection.name,
        file_source=collection.file_source,
        date_created=collection.date_created,
        cards=[FlashcardCardResponse.model_validate(c) for c in cards],
    )


@router.post(
    "/generate/file",
    response_model=FlashcardSetDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_flashcards_from_file(
    title: str = Form(...),
    category: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if not client:
        raise HTTPException(
            status_code=503, detail="Flashcard generation is unavailable."
        )
    mime_type = file.content_type or ""
    supported = {"application/pdf", "text/plain", "text/csv", "application/json"}
    if mime_type not in supported and not mime_type.startswith("image/"):
        raise HTTPException(
            status_code=415, detail="Use a PDF, text, CSV, JSON or image file."
        )
    content = await file.read(10 * 1024 * 1024 + 1)
    if not content or len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413, detail="Use a nonempty file of 10 MB or smaller."
        )
    reserved_day = reserve_query(session, current_user)
    tmp_path, uploaded_file = None, None
    try:

        def write_temp():
            with tempfile.NamedTemporaryFile(delete=False) as temporary:
                temporary.write(content)
                return temporary.name

        tmp_path = await run_in_threadpool(write_temp)
        uploaded_file = await client.aio.files.upload(
            file=tmp_path, config={"mime_type": mime_type}
        )
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                uploaded_file,
                "Create 20 study flashcards from this file. Return a JSON list with nonempty question and answer strings.",
            ],
            config={"response_mime_type": "application/json"},
        )
        data = json.loads(response.text)
        if isinstance(data, dict):
            data = data.get("cards")
        if not isinstance(data, list) or not 1 <= len(data) <= 30:
            raise ValueError("Expected 1 to 30 flashcards")
        cards = [
            GeneratedCard(
                question=item.get("question") or item.get("term"),
                answer=item.get("answer") or item.get("definition"),
            )
            for item in data
        ]
    except Exception as exc:
        refund_query(session, current_user, reserved_day)
        logger.warning("Flashcard generation failed (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=502, detail="Flashcards could not be generated. Please retry."
        )
    finally:
        if tmp_path:
            Path(tmp_path).unlink(missing_ok=True)
        if uploaded_file:
            try:
                await client.aio.files.delete(name=uploaded_file.name)
            except Exception:
                logger.warning("Provider file cleanup failed")
    flashcard_set = FlashcardSetLegacy(
        title=title, category=category, user_id=current_user.id
    )
    created_cards = [
        FlashcardLegacy(
            question=card.question, answer=card.answer, set_id=flashcard_set.id
        )
        for card in cards
    ]
    try:
        session.add(flashcard_set)
        session.add_all(created_cards)
        session.commit()
        session.refresh(flashcard_set)
    except Exception:
        session.rollback()
        refund_query(session, current_user, reserved_day)
        logger.exception("Generated flashcards could not be saved")
        raise HTTPException(
            status_code=503, detail="Flashcards could not be saved. Please retry."
        )
    return FlashcardSetDetailResponse(
        id=flashcard_set.id,
        title=flashcard_set.title,
        category=flashcard_set.category,
        created_at=flashcard_set.created_at,
        flashcards=[
            FlashcardLegacyResponse.model_validate(card) for card in created_cards
        ],
    )


@router.post(
    "/sets", response_model=FlashcardSetResponse, status_code=status.HTTP_201_CREATED
)
async def create_flashcard_set(
    flashcard_set_data: FlashcardSetLegacy,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    new_set = FlashcardSetLegacy(
        id=str(uuid4()),
        title=flashcard_set_data.title,
        category=flashcard_set_data.category,
        user_id=current_user.id,
        created_at=datetime.now(timezone.utc),
    )

    session.add(new_set)
    session.commit()
    session.refresh(new_set)
    return new_set


@router.get("/sets", response_model=List[FlashcardSetResponse])
async def get_flashcard_sets(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    sets = session.exec(
        select(FlashcardSetLegacy).where(FlashcardSetLegacy.user_id == current_user.id)
    ).all()
    return sets


@router.get("/sets/{set_id}", response_model=FlashcardSetDetailResponse)
async def get_flashcard_set(
    set_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    flashcard_set = session.exec(
        select(FlashcardSetLegacy).where(
            FlashcardSetLegacy.id == set_id,
            FlashcardSetLegacy.user_id == current_user.id,
        )
    ).first()
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")
    return flashcard_set


@router.post(
    "/sets/{set_id}/cards",
    response_model=FlashcardLegacyResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_flashcard(
    set_id: str,
    flashcard_data: FlashcardLegacy,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):

    flashcard_set = session.exec(
        select(FlashcardSetLegacy).where(
            FlashcardSetLegacy.id == set_id,
            FlashcardSetLegacy.user_id == current_user.id,
        )
    ).first()
    if not flashcard_set:
        raise HTTPException(status_code=404, detail="Flashcard set not found")

    new_card = FlashcardLegacy(
        id=str(uuid4()),
        question=flashcard_data.question,
        answer=flashcard_data.answer,
        set_id=set_id,
    )

    session.add(new_card)
    session.commit()
    session.refresh(new_card)
    return new_card
