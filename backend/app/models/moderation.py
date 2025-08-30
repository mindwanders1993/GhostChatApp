from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from app.database import Base
import re


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reported_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    message_id = Column(UUID(as_uuid=True), nullable=True)
    room_id = Column(UUID(as_uuid=True), ForeignKey("chat_rooms.id", ondelete="SET NULL"), nullable=True)
    reason = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="pending", index=True)  # 'pending', 'reviewing', 'resolved', 'dismissed'
    priority = Column(String(10), default="medium", index=True)  # 'low', 'medium', 'high', 'critical'
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)
    moderator_notes = Column(Text, nullable=True)

    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reports_made")
    reported_user = relationship("User", foreign_keys=[reported_user_id], back_populates="reports_received")
    room = relationship("ChatRoom", back_populates="reports")

    def __repr__(self):
        return f"<Report(id={self.id}, reason={self.reason}, status={self.status})>"

    def to_dict(self):
        return {
            "id": str(self.id),
            "reporter_id": str(self.reporter_id) if self.reporter_id else None,
            "reported_user_id": str(self.reported_user_id) if self.reported_user_id else None,
            "message_id": str(self.message_id) if self.message_id else None,
            "room_id": str(self.room_id) if self.room_id else None,
            "reason": self.reason,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "moderator_notes": self.moderator_notes
        }


# UserBlock model moved to app.models.safety to avoid duplicate declarations


# Pydantic models for API
class ReportCreate(BaseModel):
    reported_user_id: str
    reason: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    message_id: Optional[str] = None
    room_id: Optional[str] = None

    @validator('reason')
    def validate_reason(cls, v):
        valid_reasons = [
            'harassment', 'inappropriate_content', 'spam', 'threats',
            'underage', 'impersonation', 'other'
        ]
        if v not in valid_reasons:
            raise ValueError(f'Reason must be one of: {", ".join(valid_reasons)}')
        return v

class ReportResponse(BaseModel):
    id: str
    reporter_id: Optional[str]
    reported_user_id: Optional[str]
    message_id: Optional[str]
    room_id: Optional[str]
    reason: str
    description: Optional[str]
    status: str
    priority: str
    created_at: datetime
    resolved_at: Optional[datetime]
    moderator_notes: Optional[str]

class UserBlockCreate(BaseModel):
    blocked_user_id: str
    reason: Optional[str] = Field(None, max_length=255)

class UserBlockResponse(BaseModel):
    id: str
    blocker_id: str
    blocked_id: str
    reason: Optional[str]
    created_at: datetime

class ModerationResult(BaseModel):
    is_safe: bool
    confidence: float
    reasons: List[str]
    action: str  # 'allow', 'warn_user', 'filter_content', 'block_user'

class ContentAnalysis(BaseModel):
    content: str
    content_type: str = "text"  # 'text', 'image', 'file'
    metadata: Optional[Dict[str, Any]] = None

class ModerationAction(BaseModel):
    action_type: str = Field(..., pattern="^(warn|filter|block|ban|dismiss)$")
    reason: str = Field(..., min_length=1, max_length=255)
    notes: Optional[str] = Field(None, max_length=1000)
    duration_hours: Optional[int] = None  # For temporary actions

class SafetyTip(BaseModel):
    title: str
    description: str
    icon: str

class CrisisResource(BaseModel):
    title: str
    contact: str
    description: str