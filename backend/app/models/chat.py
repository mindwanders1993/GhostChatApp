from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid
from pydantic import BaseModel
from typing import Optional, List
from app.database import Base


class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_type = Column(String(20), nullable=False, index=True)  # 'private', 'public', 'group'
    name = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    max_participants = Column(Integer, default=2)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    # Relationships
    participants = relationship("RoomParticipant", back_populates="room")
    messages = relationship("Message", back_populates="room")
    reports = relationship("Report", back_populates="room")

    def __repr__(self):
        return f"<ChatRoom(id={self.id}, type={self.room_type}, name={self.name})>"

    def to_dict(self):
        return {
            "id": str(self.id),
            "room_type": self.room_type,
            "name": self.name,
            "description": self.description,
            "max_participants": self.max_participants,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None
        }


class RoomParticipant(Base):
    __tablename__ = "room_participants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = Column(UUID(as_uuid=True), ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    joined_at = Column(DateTime, default=datetime.utcnow)
    left_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(String(20), default="member")  # 'member', 'moderator', 'admin'

    # Relationships
    room = relationship("ChatRoom", back_populates="participants")
    user = relationship("User", back_populates="room_participants")

    def __repr__(self):
        return f"<RoomParticipant(room_id={self.room_id}, user_id={self.user_id}, role={self.role})>"

    def to_dict(self):
        return {
            "id": str(self.id),
            "room_id": str(self.room_id),
            "user_id": str(self.user_id),
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
            "left_at": self.left_at.isoformat() if self.left_at else None,
            "is_active": self.is_active,
            "role": self.role
        }


# Pydantic models for API
class ChatRoomCreate(BaseModel):
    room_type: str = "private"
    name: Optional[str] = None
    description: Optional[str] = None
    max_participants: int = 2

class ChatRoomResponse(BaseModel):
    id: str
    room_type: str
    name: Optional[str]
    description: Optional[str]
    max_participants: int
    is_active: bool
    created_at: Optional[datetime]
    expires_at: Optional[datetime]
    participants: Optional[List[dict]] = []

class RoomParticipantCreate(BaseModel):
    room_id: str
    user_id: str
    role: str = "member"

class RoomParticipantResponse(BaseModel):
    id: str
    room_id: str
    user_id: str
    joined_at: Optional[datetime]
    left_at: Optional[datetime]
    is_active: bool
    role: str

class JoinRoomRequest(BaseModel):
    room_id: str

class LeaveRoomRequest(BaseModel):
    room_id: str
    reason: Optional[str] = None