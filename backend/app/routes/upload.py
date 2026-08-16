import os
import re
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlmodel import Session
from ..database import get_session
from ..schemas import User, PastPaper
from ..dependencies import get_current_admin_user

router = APIRouter(prefix="/api/v1", tags=["Uploads"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads", "diagrams")

@router.post("/papers/{paper_id}/diagram/{placeholder}", summary="Upload a diagram for a past paper")
async def upload_diagram(
    paper_id: str,
    placeholder: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    """
    Uploads an image for a diagram placeholder in a Past Paper and replaces the placeholder 
    in the markdown content with the actual image URL.
    """
    # 1. Fetch the paper
    paper = session.get(PastPaper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    if not paper.content:
        raise HTTPException(status_code=400, detail="Paper has no content")

    # 2. Ensure upload directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # 3. Save the file
    file_ext = os.path.splitext(file.filename)[1]
    if not file_ext:
        file_ext = ".png" # default if no extension
        
    unique_filename = f"{paper_id}_{placeholder}_{uuid4().hex[:8]}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
    # 4. Generate URL
    image_url = f"/static/uploads/diagrams/{unique_filename}"
    
    # 5. Replace placeholder in content
    # Look for [DIAGRAM:placeholder]
    # We use regex to replace it with ![DIAGRAM:placeholder](image_url)
    
    pattern = re.compile(r'(?<!\!)\[DIAGRAM:' + re.escape(placeholder) + r'\]')
    new_content, count = pattern.subn(f"![DIAGRAM:{placeholder}]({image_url})", paper.content)
    
    # If the exact unlinked placeholder wasn't found, maybe they are trying to replace an existing one?
    if count == 0:
        pattern_linked = re.compile(r'\!\[DIAGRAM:' + re.escape(placeholder) + r'\]\([^)]+\)')
        new_content, count_linked = pattern_linked.subn(f"![DIAGRAM:{placeholder}]({image_url})", paper.content)

    paper.content = new_content
    session.add(paper)
    session.commit()
    session.refresh(paper)
    
    return {
        "message": "Upload successful",
        "url": image_url,
        "placeholder": placeholder,
        "paper_id": paper_id
    }
