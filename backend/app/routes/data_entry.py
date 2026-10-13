import os
import hmac
import httpx
from fastapi import APIRouter, Depends, HTTPException, Header, UploadFile, File, Form
from sqlmodel import Session
from app.database import get_session
from app.schemas import PastPaper

router = APIRouter(
    prefix="/api/v1/data-entry",
    tags=["Data Entry"]
)

def verify_admin_token(x_admin_token: str = Header(...)):
    # The token must come from the environment — never hardcode it in source control.
    # If DATA_ENTRY_TOKEN is unset the endpoint is disabled (fail closed).
    expected = os.getenv("DATA_ENTRY_TOKEN")
    if not expected:
        raise HTTPException(status_code=503, detail="Data entry is not configured on this server.")
    if not hmac.compare_digest(x_admin_token.encode(), expected.encode()):
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
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Check configuration before writing anything, so a misconfigured server
    # doesn't leave orphaned "processing" papers behind.
    modal_url = os.environ.get("MODAL_PAPER_PROCESSOR_URL")
    if not modal_url:
        raise HTTPException(status_code=500, detail="MODAL_PAPER_PROCESSOR_URL is not configured.")

    file_bytes = await file.read()

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

    try:
        async with httpx.AsyncClient() as client:
            files = {'file': (file.filename, file_bytes, 'application/pdf')}
            data = {'paper_id': paper.id}
            headers = {}
            shared_secret = os.environ.get("MODAL_SHARED_SECRET")
            if shared_secret:
                headers["X-Workshop-Secret"] = shared_secret

            response = await client.post(modal_url, data=data, files=files, headers=headers, timeout=30.0)
            response.raise_for_status()

    except Exception as e:
        # Roll back the placeholder so it doesn't sit in the list forever as "processing"
        session.delete(paper)
        session.commit()
        raise HTTPException(status_code=500, detail=f"Failed to trigger Modal processing: {str(e)}")

    return {
        "message": "File uploaded successfully. Processing has started in the background via Modal.",
        "paper_id": paper.id
    }
