import os
import re
import logging
from uuid import uuid4
import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from sqlmodel import Session
from ..database import get_session
from ..schemas import User, PastPaper
from ..dependencies import get_current_admin_user
from ..utils import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Uploads"])

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'}

_get_supabase = get_supabase

MODAL_UPSCALER_URL = os.getenv("MODAL_UPSCALER_URL")

async def upscale_and_replace_image(image_bytes: bytes, file_path: str):
    """
    Background task to send image to Modal upscaler and overwrite in Supabase.
    """
    if not MODAL_UPSCALER_URL:
        logger.info("MODAL_UPSCALER_URL not set, skipping upscale.")
        return

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                MODAL_UPSCALER_URL,
                content=image_bytes,
                headers={"Content-Type": "application/octet-stream"}
            )

            if response.status_code == 200:
                upscaled_bytes = response.content
                logger.info("Successfully upscaled %s. Uploading to Supabase...", file_path)
                res = _get_supabase().storage.from_("diagrams").upload(
                    file_path,
                    upscaled_bytes,
                    file_options={"cache-control": "3600", "upsert": "true"}
                )
                logger.info("Upscaled image saved to Supabase: %s", res)
            else:
                logger.error("Modal upscaler failed: %s", response.text)
    except Exception as e:
        logger.exception("Background upscaling error")

@router.post("/papers/{paper_id}/diagram/{placeholder}", summary="Upload a diagram for a past paper")
async def upload_diagram(
    paper_id: str,
    placeholder: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """
    Uploads an image for a diagram placeholder in a Past Paper and replaces the placeholder 
    in the markdown content with the actual image URL.
    """
    supabase = _get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase Storage not configured.")

    # 1. Fetch the paper
    paper = session.get(PastPaper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    if not paper.content:
        raise HTTPException(status_code=400, detail="Paper has no content")

    # 2. Read and validate file
    file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if not file_ext:
        file_ext = ".png"
    if file_ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file_ext}' not allowed. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        )

    unique_filename = f"{paper_id}_{placeholder}_{uuid4().hex[:8]}{file_ext}"

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail="Failed to read file.")

    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")
        
    # 3. Upload to Supabase immediately (raw image)
    try:
        supabase.storage.from_("diagrams").upload(
            unique_filename,
            content,
            file_options={"cache-control": "3600", "upsert": "true"}
        )
    except Exception as e:
        logger.exception("Failed to upload to Supabase")
        raise HTTPException(status_code=500, detail="Failed to upload file. Please try again.")
        
    # 4. Generate Public URL
    image_url = supabase.storage.from_("diagrams").get_public_url(unique_filename)
    
    # 5. Queue Background Upscale
    background_tasks.add_task(upscale_and_replace_image, content, unique_filename)
    
    # 6. Replace placeholder in content
    pattern = re.compile(r'(?<!\!)\[DIAGRAM:' + re.escape(placeholder) + r'\]')
    new_content, count = pattern.subn(f"![DIAGRAM:{placeholder}]({image_url})", paper.content)
    
    if count == 0:
        pattern_linked = re.compile(r'\!\[DIAGRAM:' + re.escape(placeholder) + r'\]\([^)]+\)')
        new_content, count_linked = pattern_linked.subn(f"![DIAGRAM:{placeholder}]({image_url})", paper.content)

    paper.content = new_content
    session.add(paper)
    session.commit()
    session.refresh(paper)
    
    return {
        "message": "Upload successful. Upscaling in background.",
        "url": image_url,
        "placeholder": placeholder,
        "paper_id": paper_id
    }
