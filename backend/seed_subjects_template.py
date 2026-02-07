from sqlmodel import Session, select, SQLModel
from app.schemas import Subject, Topic

# --- PASTE YOUR MARKDOWN CONTENT HERE ---
# Format:
# "Subject Name": {
#     "Topic Title 1": r"""
# Content for topic 1...
# You can use LaTeX: $E=mc^2$
# """,
#     "Topic Title 2": r"""
# Content for topic 2...
# """
# }

SUBJECT_DATA = {
    "Mathematics": {
        "Algebra": r"""
## Quadratic Equations
The general form is $ax^2 + bx + c = 0$.

The quadratic formula is:
$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
""",
        "Calculus": r"""
## Differentiation
The derivative of $x^n$ is $nx^{n-1}$.
"""
    }
}

def seed_subjects(session: Session):
    for subject_name, topics in SUBJECT_DATA.items():
        # Check if subject exists
        subject = session.exec(select(Subject).where(Subject.name == subject_name)).first()
        if not subject:
            subject = Subject(name=subject_name, description=f"Past papers and summaries for {subject_name}")
            session.add(subject)
            session.commit()
            session.refresh(subject)
            print(f"Created subject: {subject.name}")
        
        for topic_title, content in topics.items():
            # Check if topic exists
            # Note: This query assumes topics are unique per subject, which they should be
            # You might need to adjust logic if you want to update existing topics
            pass 
            # (Simplifying for template)
