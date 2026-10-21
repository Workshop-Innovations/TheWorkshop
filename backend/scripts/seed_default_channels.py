from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
"""
One-time migration: Add default channels to existing communities that don't have them.
Run with: python seed_default_channels.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from sqlmodel import Session, select
from app.database import engine
from app.models import Community, Channel

DEFAULT_CHANNELS = [
    {"name": "welcome", "description": "Welcome to the community!"},
    {"name": "announcements", "description": "Important announcements"},
    {"name": "general", "description": "General discussion"},
    {"name": "off-topic", "description": "Casual conversation"},
    {"name": "homework-help", "description": "Get help with homework"},
    {"name": "resource-sharing", "description": "Share useful resources"},
]


def seed_channels():
    with Session(engine) as session:
        communities = session.exec(select(Community)).all()

        if not communities:
            print("No communities found. Nothing to do.")
            return

        for community in communities:

            existing = session.exec(
                select(Channel).where(Channel.community_id == community.id)
            ).all()
            existing_names = {ch.name for ch in existing}

            created = 0
            for ch_data in DEFAULT_CHANNELS:
                if ch_data["name"] not in existing_names:
                    channel = Channel(
                        name=ch_data["name"],
                        slug=f"{community.id[:8]}-{ch_data['name']}",
                        description=ch_data["description"],
                        community_id=community.id,
                    )
                    session.add(channel)
                    created += 1

            if created > 0:
                print(f"   {community.name}: Created {created} new channels")
            else:
                print(f"  – {community.name}: All default channels already exist")

        session.commit()
        print("\nDone! All communities now have default channels.")


if __name__ == "__main__":
    print("Seeding default channels for existing communities...\n")
    seed_channels()
