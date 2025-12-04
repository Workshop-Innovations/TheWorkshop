from sqlmodel import SQLModel, create_engine, Session, select
from app.schemas import Channel, Message, MessageVote
from app.main import settings

# Setup DB connection
connect_args = {"check_same_thread": False}
engine = create_engine(settings.DATABASE_URL, echo=True, connect_args=connect_args)

def reset_community_tables():
    print("Dropping community tables...")
    # Drop tables in order of dependency
    MessageVote.__table__.drop(engine, checkfirst=True)
    Message.__table__.drop(engine, checkfirst=True)
    Channel.__table__.drop(engine, checkfirst=True)
    
    print("Recreating tables...")
    SQLModel.metadata.create_all(engine)
    
    print("Seeding channels...")
    with Session(engine) as session:
        default_channels = [
            Channel(name="General", slug="general", description="General discussion"),
            Channel(name="Pomodoro Talk", slug="pomodoro-talk", description="Discuss Pomodoro techniques"),
            Channel(name="Off Topic", slug="off-topic", description="Anything goes")
        ]
        for channel in default_channels:
            session.add(channel)
        session.commit()
        print("Seeding complete.")

if __name__ == "__main__":
    reset_community_tables()
