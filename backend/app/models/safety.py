"""
Safety and Moderation Models
Provides user blocking, reporting, and safety features for the chat application.
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from app.database import Base


class UserBlock(Base):
    """User blocking relationships"""
    __tablename__ = "user_blocks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    blocker_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    blocked_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    blocker = relationship("User", foreign_keys=[blocker_id])
    blocked = relationship("User", foreign_keys=[blocked_id])
    
    __table_args__ = {'extend_existing': True}
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "blocker_id": str(self.blocker_id),
            "blocked_id": str(self.blocked_id),
            "reason": self.reason,
            "created_at": self.created_at.isoformat()
        }


class UserReport(Base):
    """User and content reporting system"""
    __tablename__ = "user_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reported_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    reported_message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=True, index=True)
    room_id = Column(UUID(as_uuid=True), ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=True, index=True)
    
    report_type = Column(String(50), nullable=False)  # 'harassment', 'spam', 'inappropriate', 'other'
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="pending")  # 'pending', 'reviewed', 'resolved', 'dismissed'
    
    # Additional context
    report_metadata = Column(JSON, nullable=True)  # Additional report context
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String(255), nullable=True)  # Admin/moderator ID
    resolution = Column(Text, nullable=True)
    
    __table_args__ = {'extend_existing': True}
    
    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id])
    reported_user = relationship("User", foreign_keys=[reported_user_id])
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "reporter_id": str(self.reporter_id),
            "reported_user_id": str(self.reported_user_id) if self.reported_user_id else None,
            "reported_message_id": str(self.reported_message_id) if self.reported_message_id else None,
            "room_id": str(self.room_id) if self.room_id else None,
            "report_type": self.report_type,
            "reason": self.reason,
            "status": self.status,
            "metadata": self.report_metadata,
            "created_at": self.created_at.isoformat(),
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "reviewed_by": self.reviewed_by,
            "resolution": self.resolution
        }


class SafetyLog(Base):
    """Log of safety actions taken"""
    __tablename__ = "safety_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    action_type = Column(String(50), nullable=False)  # 'block', 'report', 'warn', 'timeout'
    target_id = Column(UUID(as_uuid=True), nullable=True)  # Target user/message/room ID
    reason = Column(Text, nullable=True)
    safety_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    __table_args__ = {'extend_existing': True}
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id) if self.user_id else None,
            "action_type": self.action_type,
            "target_id": str(self.target_id) if self.target_id else None,
            "reason": self.reason,
            "metadata": self.safety_metadata,
            "created_at": self.created_at.isoformat()
        }


# Pydantic models for API
class BlockUserRequest(BaseModel):
    user_id: str = Field(..., pattern="^[0-9a-f-]{36}$", description="ID of user to block")
    reason: Optional[str] = Field(None, max_length=255, description="Reason for blocking")


class UnblockUserRequest(BaseModel):
    user_id: str = Field(..., pattern="^[0-9a-f-]{36}$", description="ID of user to unblock")


class ReportUserRequest(BaseModel):
    reported_user_id: Optional[str] = Field(None, pattern="^[0-9a-f-]{36}$")
    reported_message_id: Optional[str] = Field(None, pattern="^[0-9a-f-]{36}$")
    room_id: Optional[str] = Field(None, pattern="^[0-9a-f-]{36}$")
    report_type: str = Field(..., pattern="^(harassment|spam|inappropriate|threats|other)$")
    reason: str = Field(..., min_length=10, max_length=1000, description="Detailed reason for report")
    metadata: Optional[Dict[str, Any]] = None


class BlockedUser(BaseModel):
    id: str
    blocked_id: str
    reason: Optional[str]
    created_at: datetime


class ReportResponse(BaseModel):
    id: str
    report_type: str
    reason: str
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime]


class SafetyStatsResponse(BaseModel):
    total_blocks: int
    total_reports: int
    pending_reports: int
    resolved_reports: int
    user_blocked_count: int  # Number of users you've blocked
    user_reported_count: int  # Number of reports you've made