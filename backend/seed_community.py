"""
Seed script to create a default community.
Run from the backend directory: python seed_community.py
"""
import sys
import os

# Ensure we can import from 'app'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from app.database import engine
from app.schemas import User, Community, Channel, CommunityMember

def seed_default_community():
    with Session(engine) as session:
        # Check if any community exists
        existing = session.exec(select(Community)).first()
        if existing:
            print(f"Community already exists: {existing.name}. Skipping seed.")
            return

        print("Seeding default community...")
        
        # Get a user to be the owner (first user found)
        owner = session.exec(select(User)).first()
        if not owner:
            print("No users found! Please register a user first.")
            return

        # Create Default Community
        community = Community(
            name="The Workshop Campus",
            owner_id=owner.id
        )
        session.add(community)
        session.commit()
        session.refresh(community)
        
        # Add owner as member
        member = CommunityMember(
            community_id=community.id,
            user_id=owner.id,
            role="owner"
        )
        session.add(member)
        session.commit()
        
        print(f"Created community: {community.name} (Code: {community.join_code})")
        print(f"Owner: {owner.email}")

if __name__ == "__main__":
    seed_default_community()
