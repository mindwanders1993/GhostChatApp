from sqlalchemy import Column, String, Boolean, Integer, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anonymous_id = Column(String(32), unique=True, nullable=False, index=True)
    nickname = Column(String(50), nullable=True)
    age_verified = Column(Boolean, default=False, nullable=False)
    gender = Column(String(20), nullable=True)
    location = Column(String(100), nullable=True)
    preferences = Column(JSON, nullable=True)
    karma_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow, index=True)
    session_token = Column(String(255), nullable=True, index=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    room_participants = relationship("RoomParticipant", back_populates="user")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_whispers = relationship("Message", foreign_keys="Message.whisper_to_id")
    reports_made = relationship("Report", foreign_keys="Report.reporter_id", back_populates="reporter")
    reports_received = relationship("Report", foreign_keys="Report.reported_user_id", back_populates="reported_user")
    blocks_made = relationship("UserBlock", foreign_keys="UserBlock.blocker_id", back_populates="blocker")
    blocks_received = relationship("UserBlock", foreign_keys="UserBlock.blocked_id", back_populates="blocked")

    def __repr__(self):
        return f"<User(id={self.id}, anonymous_id={self.anonymous_id}, nickname={self.nickname})>"

    def to_dict(self):
        return {
            "id": str(self.id),
            "anonymous_id": self.anonymous_id,
            "nickname": self.nickname,
            "karma_score": self.karma_score,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_active": self.last_active.isoformat() if self.last_active else None
        }


# Pydantic models for API
class UserCreate(BaseModel):
    nickname: str
    age_verified: bool
    gender: Optional[str] = None
    location: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class UserResponse(BaseModel):
    id: str
    anonymous_id: str
    nickname: Optional[str]
    karma_score: int
    is_active: bool
    created_at: Optional[datetime]

class UserUpdate(BaseModel):
    nickname: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class MatchingPreferences(BaseModel):
    age_range: List[int] = [18, 35]
    interests: List[str] = []
    language: str = "en"
    location: Optional[str] = None

class UserSession(BaseModel):
    user_id: str
    anonymous_id: str
    session_id: str
    created_at: datetime
    last_activity: datetime
    permissions: List[str]