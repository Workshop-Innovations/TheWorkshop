import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from sqlmodel import Session
from app.database import get_session
from app.schemas import PastPaper

router = APIRouter(
    prefix="/api/v1/data-entry",
    tags=["Data Entry"]
)

ADMIN_TOKEN = "WorkshopTheGOAT"

def verify_admin_token(x_admin_token: str = Header(...)):
    if x_admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid admin token")
    return True

@router.post("/upload-paper")
async def upload_past_paper(
    subject_id: str = Form(...),
    title: str = Form(...),
    year: str = Form(...),
    exam_type: str = Form(...),
    duration_minutes: int = Form(60),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    is_admin: bool = Depends(verify_admin_token)
):
    """
    Upload a scanned PDF past paper. This creates a pending record in the database
    and sends the file to the Modal webhook for processing.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    # Create the PastPaper record with null content (indicating processing)
    paper = PastPaper(
        subject_id=subject_id,
        title=title,
        year=year,
        exam_type=exam_type,
        duration_minutes=duration_minutes,
        file_path=file.filename,
        content=None # Null content means it's still processing
    )
    session.add(paper)
    session.commit()
    session.refresh(paper)
    
    # Read the file bytes
    file_bytes = await file.read()
    
    # Send to Modal webhook
    modal_url = os.environ.get("MODAL_PAPER_PROCESSOR_URL")
    if not modal_url:
        raise HTTPException(status_code=500, detail="MODAL_PAPER_PROCESSOR_URL is not configured.")
        
    try:
        async with httpx.AsyncClient() as client:
            files = {'file': (file.filename, file_bytes, 'application/pdf')}
            data = {'paper_id': paper.id}
            
            response = await client.post(modal_url, data=data, files=files, timeout=30.0)
            response.raise_for_status()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger Modal processing: {str(e)}")
    
    return {
        "message": "File uploaded successfully. Processing has started in the background via Modal.",
        "paper_id": paper.id
    }

