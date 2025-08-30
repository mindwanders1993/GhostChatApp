from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from app.database import Base
import re


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = Column(UUID(as_uuid=True), ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default="text")  # 'text', 'image', 'file', 'emoji', 'whisper'
    
    # Reply functionality
    reply_to_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=True)
    
    # Whisper/private messaging in public chat
    whisper_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    is_whisper = Column(Boolean, default=False)
    
    # User mentions (store as array of user IDs)
    mentioned_users = Column(ARRAY(UUID(as_uuid=True)), default=list)
    
    # Message status and delivery
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime, nullable=True)
    delivery_status = Column(String(20), default="sent")  # 'sending', 'sent', 'delivered', 'read'
    
    # Rich text formatting
    formatting = Column(JSON, nullable=True)
    
    # End-to-end encryption support
    is_encrypted = Column(Boolean, default=False)
    encryption_iv = Column(String(255), nullable=True)  # Base64 encoded IV
    encryption_key_id = Column(String(255), nullable=True)  # Key identifier for decryption
    
    message_metadata = Column(JSON, nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow, index=True)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(hours=24), index=True)

    # Relationships
    room = relationship("ChatRoom", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    whisper_to = relationship("User", foreign_keys=[whisper_to_id])
    reply_to = relationship("Message", remote_side=[id], backref="replies")
    
    # Reactions
    reactions = relationship("MessageReaction", back_populates="message", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Message(id={self.id}, room_id={self.room_id}, type={self.message_type})>"

    def to_dict(self):
        return {
            "id": str(self.id),
            "room_id": str(self.room_id),
            "sender_id": str(self.sender_id),
            "sender_nickname": self.sender.nickname if self.sender else None,
            "content": self.content,
            "message_type": self.message_type,
            "reply_to_id": str(self.reply_to_id) if self.reply_to_id else None,
            "reply_to": self.reply_to.to_dict() if self.reply_to else None,
            "whisper_to_id": str(self.whisper_to_id) if self.whisper_to_id else None,
            "whisper_to_nickname": self.whisper_to.nickname if self.whisper_to else None,
            "is_whisper": self.is_whisper,
            "mentioned_users": [str(uid) for uid in self.mentioned_users] if self.mentioned_users else [],
            "is_edited": self.is_edited,
            "edited_at": self.edited_at.isoformat() if self.edited_at else None,
            "delivery_status": self.delivery_status,
            "formatting": self.formatting,
            "is_encrypted": self.is_encrypted,
            "encryption_iv": self.encryption_iv,
            "encryption_key_id": self.encryption_key_id,
            "metadata": self.message_metadata,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "reactions": [r.to_dict() for r in self.reactions] if self.reactions else []
        }

    @property
    def is_expired(self):
        return self.expires_at and datetime.utcnow() > self.expires_at


class MessageReaction(Base):
    __tablename__ = "message_reactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    emoji = Column(String(20), nullable=False)  # 👍, ❤️, 😂, etc.
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    message = relationship("Message", back_populates="reactions")
    user = relationship("User")

    def to_dict(self):
        return {
            "id": str(self.id),
            "message_id": str(self.message_id),
            "user_id": str(self.user_id),
            "user_nickname": self.user.nickname if self.user else None,
            "emoji": self.emoji,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class UserPresence(Base):
    __tablename__ = "user_presence"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    room_id = Column(UUID(as_uuid=True), ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=True)
    is_online = Column(Boolean, default=False)
    is_typing = Column(Boolean, default=False)
    last_seen = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)
    status_message = Column(String(100), nullable=True)

    # Relationships
    user = relationship("User")
    room = relationship("ChatRoom")

    def to_dict(self):
        return {
            "user_id": str(self.user_id),
            "user_nickname": self.user.nickname if self.user else None,
            "room_id": str(self.room_id) if self.room_id else None,
            "is_online": self.is_online,
            "is_typing": self.is_typing,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
            "status_message": self.status_message
        }


# Pydantic models for API
class MessageCreate(BaseModel):
    room_id: str = Field(..., pattern="^[0-9a-f-]{36}$")
    content: str = Field(..., min_length=1, max_length=1000)
    message_type: str = Field(default="text", pattern="^(text|image|file|emoji|whisper)$")
    reply_to_id: Optional[str] = Field(None, pattern="^[0-9a-f-]{36}$")
    whisper_to_id: Optional[str] = Field(None, pattern="^[0-9a-f-]{36}$")
    mentioned_users: Optional[List[str]] = []
    formatting: Optional[Dict[str, Any]] = None
    is_encrypted: Optional[bool] = False
    encryption_iv: Optional[str] = None
    encryption_key_id: Optional[str] = None
    message_metadata: Optional[Dict[str, Any]] = None

    @validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError('Content cannot be empty')
        
        # Remove potential XSS attempts
        v = re.sub(r'<[^>]*>', '', v)
        v = re.sub(r'javascript:', '', v, flags=re.IGNORECASE)
        v = re.sub(r'on\w+\s*=', '', v, flags=re.IGNORECASE)
        
        return v.strip()

    @validator('mentioned_users')
    def validate_mentioned_users(cls, v):
        if v and len(v) > 10:  # Limit mentions
            raise ValueError('Maximum 10 mentions per message')
        return v or []

class MessageResponse(BaseModel):
    id: str
    room_id: str
    sender_id: str
    sender_nickname: Optional[str]
    content: str
    message_type: str
    reply_to_id: Optional[str]
    reply_to: Optional[Dict[str, Any]]  # Nested message for replies
    whisper_to_id: Optional[str]
    whisper_to_nickname: Optional[str]
    is_whisper: bool
    mentioned_users: List[str]
    is_edited: bool
    edited_at: Optional[datetime]
    delivery_status: str
    formatting: Optional[Dict[str, Any]]
    is_encrypted: bool
    encryption_iv: Optional[str]
    encryption_key_id: Optional[str]
    message_metadata: Optional[Dict[str, Any]]
    sent_at: datetime
    expires_at: Optional[datetime]
    reactions: List[Dict[str, Any]]

class MessageUpdate(BaseModel):
    content: Optional[str] = None
    message_metadata: Optional[Dict[str, Any]] = None

class TypingIndicator(BaseModel):
    room_id: str
    user_id: str
    is_typing: bool

class MessageHistory(BaseModel):
    room_id: str
    messages: List[MessageResponse]
    total_count: int
    has_more: bool

class MessageReactionCreate(BaseModel):
    message_id: str = Field(..., pattern="^[0-9a-f-]{36}$")
    emoji: str = Field(..., min_length=1, max_length=20)

class MessageReactionResponse(BaseModel):
    id: str
    message_id: str
    user_id: str
    user_nickname: Optional[str]
    emoji: str
    created_at: datetime

class UserPresenceResponse(BaseModel):
    user_id: str
    user_nickname: Optional[str]
    room_id: Optional[str]
    is_online: bool
    is_typing: bool
    last_seen: datetime
    last_activity: datetime
    status_message: Optional[str]

class UserPresenceUpdate(BaseModel):
    room_id: Optional[str] = None
    is_typing: Optional[bool] = None
    status_message: Optional[str] = Field(None, max_length=100)

class WhisperMessage(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)
    whisper_to_id: str = Field(..., pattern="^[0-9a-f-]{36}$")

class MentionUser(BaseModel):
    user_id: str = Field(..., pattern="^[0-9a-f-]{36}$")
    nickname: str
    start_index: int
    end_index: int