import os
import re
from uuid import uuid4
import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from sqlmodel import Session
from supabase import create_client, Client
from ..database import get_session
from ..schemas import User, PastPaper
from ..dependencies import get_current_admin_user

router = APIRouter(prefix="/api/v1", tags=["Uploads"])

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

MODAL_UPSCALER_URL = os.getenv("MODAL_UPSCALER_URL")

async def upscale_and_replace_image(image_bytes: bytes, file_path: str):
    """
    Background task to send image to Modal upscaler and overwrite in Supabase.
    """
    if not MODAL_UPSCALER_URL:
        print("MODAL_UPSCALER_URL not set, skipping upscale.")
        return
        
    try:
        # Send raw image bytes to Modal upscaler
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                MODAL_UPSCALER_URL,
                content=image_bytes,
                headers={"Content-Type": "application/octet-stream"}
            )
            
            if response.status_code == 200:
                upscaled_bytes = response.content
                print(f"Successfully upscaled {file_path}. Uploading to Supabase...")
                # Overwrite in Supabase
                res = supabase.storage.from_("diagrams").upload(
                    file_path,
                    upscaled_bytes,
                    file_options={"cache-control": "3600", "upsert": "true"}
                )
                print(f"Upscaled image saved to Supabase: {res}")
            else:
                print(f"Modal upscaler failed: {response.text}")
    except Exception as e:
        print(f"Background upscaling error: {str(e)}")

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
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase Storage not configured.")

    # 1. Fetch the paper
    paper = session.get(PastPaper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    if not paper.content:
        raise HTTPException(status_code=400, detail="Paper has no content")

    # 2. Read file
    file_ext = os.path.splitext(file.filename)[1]
    if not file_ext:
        file_ext = ".png" # default if no extension
        
    unique_filename = f"{paper_id}_{placeholder}_{uuid4().hex[:8]}{file_ext}"
    
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")
        
    # 3. Upload to Supabase immediately (raw image)
    try:
        supabase.storage.from_("diagrams").upload(
            unique_filename,
            content,
            file_options={"cache-control": "3600", "upsert": "true"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload to Supabase: {str(e)}")
        
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
