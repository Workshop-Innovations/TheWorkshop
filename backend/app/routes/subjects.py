from datetime import datetime
from typing import List, Optional
import json
import re
import os
import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status, BackgroundTasks
from sqlmodel import Session, select, desc, func
from ..database import get_session
from ..schemas import (
    Subject, SubjectResponse, Topic, TopicResponse, PastPaper, PastPaperResponse, 
    TopicSummaryResponse, PastPaperSummaryResponse, User,
    SubjectCreate, SubjectUpdate, TopicCreate, TopicUpdate, PastPaperCreate, PastPaperUpdate,
    TestAttempt, TestAttemptCreate, TestAttemptResponse
)
from ..dependencies import get_current_user, get_current_admin_user
from ..rate_limit import limiter, user_or_ip, AI_LIMIT
from ..cache import cached, invalidate_content, CONTENT_PREFIX

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Subjects & Content"])

# --- Public Endpoints ---
# Content changes only when an admin edits it, so these reads are cached in memory
# (see cache.py) and every admin write below calls invalidate_content().

def _paper_summaries(session: Session, subject_ids=None) -> List[PastPaperSummaryResponse]:
    """Papers without their content column (it can be very large)."""
    has_content = func.coalesce(func.length(PastPaper.content), 0) > 0
    query = select(
        PastPaper.id, PastPaper.subject_id, PastPaper.title, PastPaper.year,
        PastPaper.exam_type, PastPaper.file_path, PastPaper.duration_minutes, has_content,
    )
    if subject_ids is not None:
        query = query.where(PastPaper.subject_id.in_(subject_ids))
    return [
        PastPaperSummaryResponse(
            id=r[0], subject_id=r[1], title=r[2], year=r[3], exam_type=r[4],
            file_path=r[5], duration_minutes=r[6], has_content=bool(r[7]),
        )
        for r in session.exec(query).all()
    ]

def _subject_responses(session: Session, subjects) -> List[dict]:
    """Subjects with topic titles and paper summaries, using 3 queries total
    (instead of loading every topic/paper relationship one subject at a time)."""
    ids = [s.id for s in subjects]
    if not ids:
        return []
    topics: dict = {}
    for t in session.exec(
        select(Topic.id, Topic.subject_id, Topic.title, Topic.order)
        .where(Topic.subject_id.in_(ids))
        .order_by(Topic.order)
    ).all():
        topics.setdefault(t[1], []).append(TopicSummaryResponse(id=t[0], title=t[2], order=t[3]))
    papers: dict = {}
    for p in _paper_summaries(session, ids):
        papers.setdefault(p.subject_id, []).append(p)
    return [
        SubjectResponse(
            id=s.id, name=s.name, description=s.description,
            topics=topics.get(s.id, []), papers=papers.get(s.id, []),
        ).model_dump(mode="json")
        for s in subjects
    ]

@router.get("/subjects", response_model=List[SubjectResponse], summary="Get all subjects")
async def get_subjects(
    limit: Optional[int] = Query(default=None, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
):
    """
    Get subjects with their topic titles and past-paper summaries (no paper content;
    fetch /papers/{id} for that). Optional `limit`/`offset` for pagination.
    """
    def load():
        query = select(Subject).offset(offset)
        if limit:
            query = query.order_by(Subject.id).limit(limit)  # stable order for paging
        return _subject_responses(session, session.exec(query).all())
    return cached(f"{CONTENT_PREFIX}subjects:{limit}:{offset}", load)

@router.get("/subjects/{subject_id}", response_model=SubjectResponse, summary="Get a specific subject")
async def get_subject(subject_id: str, session: Session = Depends(get_session)):
    def load():
        subject = session.get(Subject, subject_id)
        return _subject_responses(session, [subject])[0] if subject else None
    result = cached(f"{CONTENT_PREFIX}subject:{subject_id}", load)
    if result is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    return result

@router.get("/papers", response_model=List[PastPaperResponse])
async def get_papers(
    subject: Optional[str] = None,
    year: Optional[str] = None,
    exam: Optional[str] = None,
    include_content: bool = Query(default=True, description="false = skip the large content field (use has_content)"),
    limit: Optional[int] = Query(default=None, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session)
):
    """Get past papers, optionally filtered by subject name, year, or exam type.
    Pass include_content=false for list views (much smaller and cached)."""
    if include_content:
        query = select(PastPaper)
    else:
        has_content = func.coalesce(func.length(PastPaper.content), 0) > 0
        query = select(
            PastPaper.id, PastPaper.subject_id, PastPaper.title, PastPaper.year,
            PastPaper.exam_type, PastPaper.file_path, PastPaper.duration_minutes, has_content,
        )

    if subject:
        query = query.join(Subject, PastPaper.subject_id == Subject.id).where(Subject.name.ilike(f"%{subject}%"))
    if year:
        query = query.where(PastPaper.year == year)
    if exam:
        query = query.where(PastPaper.exam_type == exam)
    query = query.offset(offset)
    if limit:
        query = query.order_by(PastPaper.id).limit(limit)

    if include_content:
        # Full content isn't cached (it's large and would sit in every worker's memory)
        return session.exec(query).all()

    def load():
        return [
            PastPaperResponse(
                id=r[0], subject_id=r[1], title=r[2], year=r[3], exam_type=r[4],
                file_path=r[5], duration_minutes=r[6], has_content=bool(r[7]),
            ).model_dump(mode="json")
            for r in session.exec(query).all()
        ]
    return cached(f"{CONTENT_PREFIX}papers:{subject}:{year}:{exam}:{limit}:{offset}", load)

@router.get("/topics", response_model=List[TopicResponse], summary="Get all topics")
async def get_topics(
    limit: Optional[int] = Query(default=None, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(get_session),
):
    """
    Get all topics (Subject Modules). Optional `limit`/`offset` for pagination.
    """
    def load():
        query = select(Topic).offset(offset)
        if limit:
            query = query.order_by(Topic.id).limit(limit)
        return [TopicResponse.model_validate(t).model_dump(mode="json") for t in session.exec(query).all()]
    return cached(f"{CONTENT_PREFIX}topics:{limit}:{offset}", load)

@router.get("/topics/{topic_id}", response_model=TopicResponse)
async def get_topic(topic_id: str, session: Session = Depends(get_session)):
    """Get a specific topic by ID with full content."""
    def load():
        topic = session.get(Topic, topic_id)
        return TopicResponse.model_validate(topic).model_dump(mode="json") if topic else None
    result = cached(f"{CONTENT_PREFIX}topic:{topic_id}", load)
    if result is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return result

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
    invalidate_content()
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
    invalidate_content()
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

    # Delete children first, topics/papers/attempts have FKs to this subject,
    # so deleting the subject alone fails on Postgres once it has content.
    papers = session.exec(select(PastPaper).where(PastPaper.subject_id == subject_id)).all()
    for paper in papers:
        for attempt in session.exec(select(TestAttempt).where(TestAttempt.paper_id == paper.id)).all():
            session.delete(attempt)
        session.delete(paper)
    for topic in session.exec(select(Topic).where(Topic.subject_id == subject_id)).all():
        session.delete(topic)

    session.delete(subject)
    session.commit()
    invalidate_content()

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
    invalidate_content()
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
    invalidate_content()
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
    invalidate_content()

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
    invalidate_content()
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
    invalidate_content()
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
    invalidate_content()

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
@limiter.limit(AI_LIMIT, key_func=user_or_ip)
async def grade_paper(
    request: Request,
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
    feedback_data = {"overall_feedback": "AI grading unavailable, no MODAL_GRADER_URL configured."}
    score = 0.0

    if modal_url and rubric:
        try:
            async with httpx.AsyncClient() as client:
                shared_secret = os.getenv("MODAL_SHARED_SECRET")
                ai_response = await client.post(
                    modal_url,
                    json={"user_answers": answers_dict, "rubric": rubric},
                    headers={"X-Workshop-Secret": shared_secret} if shared_secret else {},
                    timeout=45.0
                )
                ai_response.raise_for_status()
                ai_result = ai_response.json()
                score = float(ai_result.get("total_score", 0.0))
                feedback_data = ai_result.get("feedback", feedback_data)
        except httpx.TimeoutException:
            feedback_data = {"overall_feedback": "AI grader timed out. Your answers have been saved."}
        except Exception as e:
            logger.exception("Modal grading call failed")
            feedback_data = {"overall_feedback": "AI grading failed. Your answers have been saved."}
    
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
