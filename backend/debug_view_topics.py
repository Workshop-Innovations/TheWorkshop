from sqlmodel import Session, select, create_engine
from seed_from_text import Subject, Topic, DATABASE_URL

engine = create_engine(DATABASE_URL)

with Session(engine) as session:
    subject = session.exec(select(Subject).where(Subject.name == "Mathematics")).first()
    if subject:
        print(f"Subject: {subject.name} (ID: {subject.id})")
        topics = session.exec(select(Topic).where(Topic.subject_id == subject.id)).all()
        print(f"Topic Count: {len(topics)}")
        for t in topics:
            print(f" - {t.title} ({len(t.summary_content)} chars)")
    else:
        print("Subject not found")
