from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, desc, func
from typing import List, Optional
from datetime import datetime

from ..schemas import (
    User, 
    PeerReviewSubmission, PeerReviewSubmissionCreate, PeerReviewSubmissionResponse,
    PeerReviewFeedback, PeerReviewFeedbackCreate, PeerReviewFeedbackResponse
)
from ..main import get_session, get_current_user

router = APIRouter(
    prefix="/api/v1/community",
    tags=["community"]
)

@router.post("/channels/{channel_id}/submissions", response_model=PeerReviewSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    channel_id: str,
    submission_data: PeerReviewSubmissionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Submit work for peer review."""
    submission = PeerReviewSubmission(
        channel_id=channel_id,
        author_id=current_user.id,
        title=submission_data.title,
        content=submission_data.content,
        file_url=submission_data.file_url
    )
    
    session.add(submission)
    session.commit()
    session.refresh(submission)
    
    return PeerReviewSubmissionResponse(
        id=submission.id,
        channel_id=submission.channel_id,
        author_id=submission.author_id,
        author_email=current_user.email,
        title=submission.title,
        content=submission.content,
        file_url=submission.file_url,
        created_at=submission.created_at,
        feedback_count=0,
        average_rating=None
    )

@router.get("/channels/{channel_id}/submissions", response_model=List[PeerReviewSubmissionResponse])
async def get_submissions(
    channel_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all peer review submissions in a channel."""
    submissions = session.exec(
        select(PeerReviewSubmission)
        .where(PeerReviewSubmission.channel_id == channel_id)
        .order_by(desc(PeerReviewSubmission.created_at))
    ).all()
    
    results = []
    for sub in submissions:
        author = session.get(User, sub.author_id)
        
        # Calculate stats
        feedback_stats = session.exec(
            select(
                func.count(PeerReviewFeedback.id),
                func.avg(PeerReviewFeedback.rating)
            ).where(PeerReviewFeedback.submission_id == sub.id)
        ).first()
        
        count = feedback_stats[0] if feedback_stats else 0
        avg_rating = feedback_stats[1] if feedback_stats and feedback_stats[1] else None
        
        results.append(PeerReviewSubmissionResponse(
            id=sub.id,
            channel_id=sub.channel_id,
            author_id=sub.author_id,
            author_email=author.email if author else None,
            title=sub.title,
            content=sub.content,
            file_url=sub.file_url,
            created_at=sub.created_at,
            feedback_count=count,
            average_rating=avg_rating
        ))
    
    return results

@router.post("/submissions/{submission_id}/feedback", response_model=PeerReviewFeedbackResponse, status_code=status.HTTP_201_CREATED)
async def add_feedback(
    submission_id: str,
    feedback_data: PeerReviewFeedbackCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Add feedback to a submission."""
    submission = session.get(PeerReviewSubmission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    if submission.author_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot review your own submission")
    
    # Check if already reviewed (optional, but good practice)
    existing_review = session.exec(
        select(PeerReviewFeedback)
        .where(PeerReviewFeedback.submission_id == submission_id)
        .where(PeerReviewFeedback.reviewer_id == current_user.id)
    ).first()
    
    if existing_review:
        raise HTTPException(status_code=400, detail="You have already reviewed this submission")
    
    feedback = PeerReviewFeedback(
        submission_id=submission_id,
        reviewer_id=current_user.id,
        rating=feedback_data.rating,
        comments=feedback_data.comments
    )
    
    session.add(feedback)
    session.commit()
    session.refresh(feedback)
    
    return PeerReviewFeedbackResponse(
        id=feedback.id,
        submission_id=feedback.submission_id,
        reviewer_id=feedback.reviewer_id,
        reviewer_email=current_user.email,
        rating=feedback.rating,
        comments=feedback.comments,
        created_at=feedback.created_at
    )

@router.get("/submissions/{submission_id}/feedback", response_model=List[PeerReviewFeedbackResponse])
async def get_submission_feedback(
    submission_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all feedback for a submission."""
    feedbacks = session.exec(
        select(PeerReviewFeedback)
        .where(PeerReviewFeedback.submission_id == submission_id)
        .order_by(desc(PeerReviewFeedback.created_at))
    ).all()
    
    results = []
    for fb in feedbacks:
        reviewer = session.get(User, fb.reviewer_id)
        results.append(PeerReviewFeedbackResponse(
            id=fb.id,
            submission_id=fb.submission_id,
            reviewer_id=fb.reviewer_id,
            reviewer_email=reviewer.email if reviewer else None,
            rating=fb.rating,
            comments=fb.comments,
            created_at=fb.created_at
        ))
    
    return results
