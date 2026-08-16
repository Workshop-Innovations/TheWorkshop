from datetime import datetime
from typing import List, Optional
import json
import re
import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select, desc
from ..database import get_session
from ..schemas import (
    Subject, SubjectResponse, Topic, TopicResponse, PastPaper, PastPaperResponse, 
    TopicSummaryResponse, User,
    SubjectCreate, SubjectUpdate, TopicCreate, TopicUpdate, PastPaperCreate, PastPaperUpdate,
    TestAttempt, TestAttemptCreate, TestAttemptResponse
)
from ..dependencies import get_current_user, get_current_admin_user # Import admin dependency

router = APIRouter(prefix="/api/v1", tags=["Subjects & Content"])

# --- Public Endpoints ---

@router.get("/subjects", response_model=List[SubjectResponse], summary="Get all subjects")
async def get_subjects(session: Session = Depends(get_session)):
    """
    Get all subjects and their topics/past papers.
    """
    subjects = session.exec(select(Subject)).all()
    # Pydantic will handle the conversion to SubjectResponse, utilizing the relationships
    return subjects

@router.get("/subjects/{subject_id}", response_model=SubjectResponse, summary="Get a specific subject")
async def get_subject(subject_id: str, session: Session = Depends(get_session)):
    subject = session.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

@router.get("/papers", response_model=List[PastPaperResponse])
async def get_papers(
    subject: Optional[str] = None,
    year: Optional[str] = None,
    exam: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """Get past papers, optionally filtered by subject name, year, or exam type."""
    query = select(PastPaper)
    
    if subject:
        # Join with Subject table to filter by name if needed, or just specific ID
        # Here assuming filtering by subject name for simplicity in query params
        query = query.join(Subject).where(Subject.name.ilike(f"%{subject}%"))
    if year:
        query = query.where(PastPaper.year == year)
    if exam:
         query = query.where(PastPaper.exam_type == exam)
         
    papers = session.exec(query).all()
    return papers

@router.get("/topics", response_model=List[TopicResponse], summary="Get all topics")
async def get_topics(session: Session = Depends(get_session)):
    """
    Get all topics (Subject Modules).
    """
    topics = session.exec(select(Topic)).all()
    return topics

@router.get("/topics/{topic_id}", response_model=TopicResponse)
async def get_topic(topic_id: str, session: Session = Depends(get_session)):
    """Get a specific topic by ID with full content."""
    topic = session.exec(select(Topic).where(Topic.id == topic_id)).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic

@router.get("/papers/{paper_id}", response_model=PastPaperResponse, summary="Get full past paper")
async def get_past_paper(paper_id: str, session: Session = Depends(get_session)):
    """
    Fetch a specific past paper including its content.
    """
    paper = session.get(PastPaper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Past Paper not found")
    return paper

# --- Admin Endpoints ---

# Subject CRUD
@router.post("/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED, summary="Create a new subject (Admin)")
async def create_subject(
    subject: SubjectCreate, 
    current_user: User = Depends(get_current_admin_user), 
    session: Session = Depends(get_session)
):
    db_subject = Subject.model_validate(subject)
    session.add(db_subject)
    session.commit()
    session.refresh(db_subject)
    return db_subject

@router.put("/subjects/{subject_id}", response_model=SubjectResponse, summary="Update a subject (Admin)")
async def update_subject(
    subject_id: str,
    subject_update: SubjectUpdate,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    db_subject = session.get(Subject, subject_id)
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    subject_data = subject_update.model_dump(exclude_unset=True)
    for key, value in subject_data.items():
        setattr(db_subject, key, value)
            
    session.add(db_subject)
    session.commit()
    session.refresh(db_subject)
    return db_subject

@router.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a subject (Admin)")
async def delete_subject(
    subject_id: str, 
    current_user: User = Depends(get_current_admin_user), 
    session: Session = Depends(get_session)
):
    subject = session.get(Subject, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    session.delete(subject)
    session.commit()

# Topic CRUD
@router.post("/topics", response_model=TopicResponse, status_code=status.HTTP_201_CREATED, summary="Create a new topic (Admin)")
async def create_topic(
    topic: TopicCreate, 
    current_user: User = Depends(get_current_admin_user), 
    session: Session = Depends(get_session)
):
    db_topic = Topic.model_validate(topic)
    session.add(db_topic)
    session.commit()
    session.refresh(db_topic)
    return db_topic

@router.put("/topics/{topic_id}", response_model=TopicResponse, summary="Update a topic (Admin)")
async def update_topic(
    topic_id: str,
    topic_update: TopicUpdate,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    db_topic = session.get(Topic, topic_id)
    if not db_topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    topic_data = topic_update.model_dump(exclude_unset=True)
    for key, value in topic_data.items():
        if key != 'id': 
            setattr(db_topic, key, value)
            
    session.add(db_topic)
    session.commit()
    session.refresh(db_topic)
    return db_topic

@router.delete("/topics/{topic_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a topic (Admin)")
async def delete_topic(
    topic_id: str, 
    current_user: User = Depends(get_current_admin_user), 
    session: Session = Depends(get_session)
):
    topic = session.get(Topic, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    session.delete(topic)
    session.commit()

# Past Paper CRUD
@router.post("/papers", response_model=PastPaperResponse, status_code=status.HTTP_201_CREATED, summary="Create a past paper (Admin)")
async def create_paper(
    paper: PastPaperCreate, 
    current_user: User = Depends(get_current_admin_user), 
    session: Session = Depends(get_session)
):
    db_paper = PastPaper.model_validate(paper)
    session.add(db_paper)
    session.commit()
    session.refresh(db_paper)
    return db_paper

@router.put("/papers/{paper_id}", response_model=PastPaperResponse, summary="Update a past paper (Admin)")
async def update_paper(
    paper_id: str,
    paper_update: PastPaperUpdate,
    current_user: User = Depends(get_current_admin_user),
    session: Session = Depends(get_session)
):
    db_paper = session.get(PastPaper, paper_id)
    if not db_paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    paper_data = paper_update.model_dump(exclude_unset=True)
    for key, value in paper_data.items():
        if key != 'id':
             setattr(db_paper, key, value)

    session.add(db_paper)
    session.commit()
    session.refresh(db_paper)
    return db_paper

@router.delete("/papers/{paper_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a past paper (Admin)")
async def delete_paper(
    paper_id: str, 
    current_user: User = Depends(get_current_admin_user), 
    session: Session = Depends(get_session)
):
    paper = session.get(PastPaper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    # Cascade delete associated test attempts
    attempts = session.exec(select(TestAttempt).where(TestAttempt.paper_id == paper_id)).all()
    for attempt in attempts:
        session.delete(attempt)
        
    session.delete(paper)
    session.commit()

# --- Test Attempts & Grading ---

@router.get("/papers/{paper_id}/attempts", response_model=List[TestAttemptResponse], summary="Get user's attempts for a paper")
async def get_test_attempts(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    attempts = session.exec(
        select(TestAttempt).where(
            TestAttempt.paper_id == paper_id,
            TestAttempt.user_id == current_user.id
        ).order_by(TestAttempt.created_at.desc())
    ).all()
    return attempts

@router.post("/papers/{paper_id}/grade", response_model=TestAttemptResponse, summary="Grade paper using AI and save attempt")
async def grade_paper(
    paper_id: str,
    attempt_data: TestAttemptCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    paper = session.get(PastPaper, paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    answers_dict = {}
    if attempt_data.answers_data:
        try:
            answers_dict = json.loads(attempt_data.answers_data)
        except json.JSONDecodeError:
            pass

    # Extract marking scheme (everything after ## ANSWERS)
    content = paper.content or ""
    answer_split = re.split(r'\n#{1,3}\s*ANSWER(?:S|\s+BANK)?\s*\n', content, flags=re.IGNORECASE)
    rubric = answer_split[1] if len(answer_split) > 1 else ""

    # Call Modal AI grader endpoint
    modal_url = os.getenv("MODAL_GRADER_URL", "")
    feedback_data = {"overall_feedback": "AI grading unavailable — no MODAL_GRADER_URL configured."}
    score = 0.0

    if modal_url and rubric:
        try:
            async with httpx.AsyncClient() as client:
                ai_response = await client.post(
                    modal_url,
                    json={"user_answers": answers_dict, "rubric": rubric},
                    timeout=45.0
                )
                ai_response.raise_for_status()
                ai_result = ai_response.json()
                score = float(ai_result.get("total_score", 0.0))
                feedback_data = ai_result.get("feedback", feedback_data)
        except httpx.TimeoutException:
            feedback_data = {"overall_feedback": "AI grader timed out. Your answers have been saved."}
        except Exception as e:
            print(f"[grade_paper] Modal call failed: {e}")
            feedback_data = {"overall_feedback": f"AI grading failed: {str(e)}. Your answers have been saved."}
    
    db_attempt = TestAttempt(
        user_id=current_user.id,
        paper_id=paper_id,
        score=score,
        answers_data=attempt_data.answers_data,
        feedback_data=json.dumps(feedback_data)
    )
    
    session.add(db_attempt)
    session.commit()
    session.refresh(db_attempt)
    
    return db_attempt
