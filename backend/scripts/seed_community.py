from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
"""
Seed script to create a default community.
Run from the backend directory: python seed_community.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from app.database import engine
from app.models import User, Community, Channel, CommunityMember


def seed_default_community():
    with Session(engine) as session:

        existing = session.exec(select(Community)).first()
        if existing:
            print(f"Community already exists: {existing.name}. Skipping seed.")
            return

        print("Seeding default community...")

        owner = session.exec(select(User)).first()
        if not owner:
            print("No users found! Please register a user first.")
            return

        community = Community(name="The Workshop Campus", owner_id=owner.id)
        session.add(community)
        session.commit()
        session.refresh(community)

        member = CommunityMember(
            community_id=community.id, user_id=owner.id, role="owner"
        )
        session.add(member)
        session.commit()

        print(f"Created community: {community.name} (Code: {community.join_code})")
        print(f"Owner: {owner.email}")


if __name__ == "__main__":
    seed_default_community()
