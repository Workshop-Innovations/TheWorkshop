from pydantic import Field
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class BadgeResponse(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    category: str
    tier: str
    earned_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserReputationResponse(BaseModel):
    user_id: str
    email: str
    profile_pic: Optional[str] = None
    reputation_points: int
    total_messages: int
    helpful_votes: int
    badges: List[BadgeResponse] = Field(default_factory=list)
    rank: int = 0

    model_config = {"from_attributes": True}


class LeaderboardEntryResponse(BaseModel):
    rank: int
    user_id: str
    email: str
    profile_pic: Optional[str] = None
    reputation_points: int
    total_messages: int
    helpful_votes: int
    badge_count: int = 0
    top_badges: List["BadgeResponse"] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class LeaderboardResponse(BaseModel):
    leaderboard: List[LeaderboardEntryResponse]
    total_users: int
    period: str = "all_time"
