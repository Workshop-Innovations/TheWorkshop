from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, desc
from typing import List
from datetime import datetime
from uuid import uuid4

from ..schemas import (
    User, SharedNote, SharedNoteCreate, SharedNoteUpdate, SharedNoteResponse
)
from ..database import get_session
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/api/v1/community",
    tags=["community"]
)

@router.post("/channels/{channel_id}/notes", response_model=SharedNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_shared_note(
    channel_id: str,
    note_data: SharedNoteCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new shared note in a channel."""
    # Verify channel exists (optional but good)
    # channel = session.get(Channel, channel_id)
    # if not channel: ...
    
    note = SharedNote(
        title=note_data.title,
        content=note_data.content or "",
        channel_id=channel_id,
        created_by=current_user.id
    )
    
    session.add(note)
    session.commit()
    session.refresh(note)
    
    return SharedNoteResponse(
        id=note.id,
        title=note.title,
        content=note.content,
        channel_id=note.channel_id,
        created_by=note.created_by,
        updated_at=note.updated_at,
        version=note.version,
        creator_email=current_user.email
    )

@router.get("/channels/{channel_id}/notes", response_model=List[SharedNoteResponse])
async def get_channel_notes(
    channel_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all shared notes in a channel."""
    notes = session.exec(
        select(SharedNote)
        .where(SharedNote.channel_id == channel_id)
        .order_by(desc(SharedNote.updated_at))
    ).all()
    
    results = []
    for note in notes:
        # Fetch creator email efficiently (n+1 problem, but fine for now)
        creator = session.get(User, note.created_by)
        results.append(SharedNoteResponse(
            id=note.id,
            title=note.title,
            content=note.content,
            channel_id=note.channel_id,
            created_by=note.created_by,
            updated_at=note.updated_at,
            version=note.version,
            creator_email=creator.email if creator else None
        ))
    
    return results

@router.get("/notes/{note_id}", response_model=SharedNoteResponse)
async def get_note(
    note_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific note."""
    note = session.get(SharedNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    creator = session.get(User, note.created_by)
    return SharedNoteResponse(
        id=note.id,
        title=note.title,
        content=note.content,
        channel_id=note.channel_id,
        created_by=note.created_by,
        updated_at=note.updated_at,
        version=note.version,
        creator_email=creator.email if creator else None
    )

@router.put("/notes/{note_id}", response_model=SharedNoteResponse)
async def update_note(
    note_id: str,
    note_update: SharedNoteUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update a note content (with optimistic locking)."""
    note = session.get(SharedNote, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Check version for conflict
    if note.version != note_update.version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Note has been modified by someone else. Please refresh."
        )
    
    if note_update.title is not None:
        note.title = note_update.title
    
    if note_update.content is not None:
        note.content = note_update.content
        
    note.version += 1 # Increment version
    note.updated_at = datetime.utcnow()
    
    session.add(note)
    session.commit()
    session.refresh(note)
    
    creator = session.get(User, note.created_by)
    return SharedNoteResponse(
        id=note.id,
        title=note.title,
        content=note.content,
        channel_id=note.channel_id,
        created_by=note.created_by,
        updated_at=note.updated_at,
        version=note.version,
        creator_email=creator.email if creator else None
    )
