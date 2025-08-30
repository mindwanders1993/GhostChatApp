# General-Purpose Chat Application - Technical Requirements Document

## 1. Executive Summary

This document defines the technical architecture, infrastructure requirements, and implementation specifications for developing a scalable, real-time chat application using FastAPI for the backend, React with TypeScript for the frontend, and PostgreSQL as the primary database. The system will support thousands of concurrent users across multiple chat rooms with text, voice, and video communication capabilities.

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Clients   │    │   Mobile Apps    │    │   Admin Panel   │
│   (Browser)     │    │  (iOS/Android)   │    │   (Web-based)   │
└─────────┬───────┘    └────────┬─────────┘    └─────────┬───────┘
          │                     │                        │
          └─────────────────────┼────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │    Load Balancer      │
                    │     (NGINX/AWS)       │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │   Application Layer   │
                    │    (FastAPI/Python)   │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
    ┌─────────┴─────────┐ ┌─────┴─────┐ ┌───────┴───────┐
    │   WebSocket       │ │  REST API │ │  Media Server │
    │   Server          │ │  Server   │ │  (WebRTC)     │
    │  (FastAPI WS)     │ │ (FastAPI) │ │               │
    └─────────┬─────────┘ └─────┬─────┘ └───────┬───────┘
              │                 │               │
              └─────────────────┼───────────────┘
                                │
                    ┌───────────┴───────────┐
                    │    Database Layer     │
                    │  Redis + PostgreSQL   │
                    │                       │
                    └───────────────────────┘
```

### 2.2 Technology Stack

#### 2.2.1 Frontend Technologies
- **Framework**: React.js 18+ with TypeScript 5+
- **State Management**: Zustand / Redux Toolkit with TypeScript
- **UI Components**: Material-UI v5 / Ant Design with TypeScript support
- **Real-time Communication**: Native WebSocket API with TypeScript types
- **WebRTC**: Simple-peer with TypeScript definitions for voice/video
- **Build Tool**: Vite with TypeScript support
- **CSS**: Styled-components / TailwindCSS with TypeScript
- **HTTP Client**: Axios with TypeScript interfaces
- **Form Handling**: React Hook Form with TypeScript validation
- **Testing**: Jest + React Testing Library + TypeScript

#### 2.2.2 Backend Technologies
- **Runtime**: Python 3.11+ with asyncio support
- **Framework**: FastAPI 0.104+ with async/await
- **Real-time Engine**: FastAPI WebSocket with connection manager
- **Authentication**: FastAPI Security + JWT + OAuth2
- **File Upload**: FastAPI File handling + Pillow (image processing)
- **Validation**: Pydantic v2 models with automatic validation
- **ORM**: SQLAlchemy 2.0+ with async support
- **Database Migrations**: Alembic
- **Logging**: Python logging + Structlog
- **API Documentation**: FastAPI automatic OpenAPI/Swagger
- **Testing**: Pytest + HTTPX + AsyncIO testing

#### 2.2.3 Database Technologies
- **Primary Database**: PostgreSQL 15+ with asyncpg driver (user data, rooms, messages)
- **Cache Layer**: Redis 7+ (sessions, real-time data, WebSocket connections)
- **Message Queue**: Redis Pub/Sub with FastAPI background tasks
- **Connection Pooling**: SQLAlchemy async connection pool
- **File Storage**: AWS S3 / Google Cloud Storage with FastAPI integration
- **Database Migrations**: Alembic with async support
- **Search Engine**: PostgreSQL Full-Text Search / Elasticsearch (optional)

#### 2.2.4 Infrastructure
- **Containerization**: Docker + Docker Compose with multi-stage builds
- **Orchestration**: Kubernetes (production) with FastAPI-specific configurations
- **Load Balancer**: NGINX / AWS Application Load Balancer with WebSocket support
- **CDN**: Cloudflare / AWS CloudFront for static React assets
- **Monitoring**: Prometheus + Grafana with FastAPI metrics
- **Error Tracking**: Sentry with FastAPI integration
- **CI/CD**: GitHub Actions / GitLab CI with Python/Node.js pipelines
- **Process Management**: Gunicorn + Uvicorn workers for FastAPI

## 3. Detailed Technical Specifications

### 3.1 Database Design

#### 3.1.1 PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    avatar_url VARCHAR(500),
    birth_date DATE,
    gender VARCHAR(20),
    location VARCHAR(100),
    bio TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_moderator BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add updated_at trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Chat rooms table
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    topic TEXT,
    category VARCHAR(50),
    is_private BOOLEAN DEFAULT FALSE,
    max_users INTEGER DEFAULT 500,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id),
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- text, image, file, system
    file_url VARCHAR(500),
    reply_to UUID REFERENCES messages(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    room_id UUID REFERENCES chat_rooms(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP
);

-- Friends system
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    friend_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id)
);

-- User preferences
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) UNIQUE,
    interface_size INTEGER DEFAULT 16,
    message_size INTEGER DEFAULT 14,
    userlist_size INTEGER DEFAULT 16,
    font_family VARCHAR(50) DEFAULT 'Default',
    show_avatars BOOLEAN DEFAULT TRUE,
    show_timestamps BOOLEAN DEFAULT TRUE,
    sound_notifications BOOLEAN DEFAULT TRUE,
    message_colors BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.1.2 Redis Data Structures

```javascript
// Active users in rooms
ROOM_USERS:{roomId} = SET of userIds

// User presence
USER_PRESENCE:{userId} = {
  status: 'online|away|offline',
  lastSeen: timestamp,
  currentRoom: roomId
}

// Real-time message cache (last 100 messages per room)
ROOM_MESSAGES:{roomId} = LIST of message objects

// Active private conversations
PRIVATE_CHAT:{userId1}:{userId2} = LIST of messages

// User session data
SESSION:{sessionId} = {
  userId: string,
  userData: object,
  socketIds: array
}

// Rate limiting
RATE_LIMIT:{userId}:{action} = counter with TTL
```

### 3.2 API Specifications

#### 3.2.1 REST API Endpoints

```javascript
// Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/verify

// Users
GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/:userId
POST   /api/users/upload-avatar
GET    /api/users/preferences
PUT    /api/users/preferences

// Chat Rooms
GET    /api/rooms                 // List all rooms with filters
POST   /api/rooms                 // Create new room
GET    /api/rooms/:roomId          // Get room details
PUT    /api/rooms/:roomId          // Update room (owner only)
DELETE /api/rooms/:roomId          // Delete room (owner only)
GET    /api/rooms/:roomId/messages // Get message history
GET    /api/rooms/:roomId/users    // Get room participants

// Friends
GET    /api/friends                // Get friends list
POST   /api/friends/request        // Send friend request
POST   /api/friends/accept         // Accept friend request
DELETE /api/friends/:friendId      // Remove friend
POST   /api/friends/block          // Block user

// Media
POST   /api/media/upload           // Upload files/images
GET    /api/media/:fileId          // Get media file

// Moderation
POST   /api/moderation/report      // Report user/message
GET    /api/moderation/reports     // Get reports (moderators)
POST   /api/moderation/action      // Take moderation action
```

#### 3.2.2 WebSocket Events

```javascript
// Client to Server Events
'join_room'        // Join a chat room
'leave_room'       // Leave a chat room
'send_message'     // Send chat message
'send_private'     // Send private message
'typing_start'     // Start typing indicator
'typing_stop'      // Stop typing indicator
'voice_offer'      // WebRTC voice call offer
'voice_answer'     // WebRTC voice call answer
'voice_ice'        // WebRTC ICE candidate
'user_status'      // Update user status

// Server to Client Events
'room_joined'      // Successfully joined room
'room_left'        // Successfully left room
'new_message'      // New message in room
'private_message'  // New private message
'user_joined'      // User joined room
'user_left'        // User left room
'user_typing'      // User typing indicator
'user_status'      // User status update
'room_update'      // Room information update
'error'            // Error message
'notification'     // System notification
```

### 3.3 Real-time Communication

#### 3.3.1 WebSocket Implementation

```python
# FastAPI WebSocket Manager
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
import json
import asyncio

class WebSocketManager:
    def __init__(self):
        # Store active connections: room_id -> set of websockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Store user connections: user_id -> websocket
        self.user_connections: Dict[str, WebSocket] = {}
        
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.user_connections[user_id] = websocket
        
    async def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.user_connections:
            del self.user_connections[user_id]
        # Remove from all rooms
        for room_connections in self.active_connections.values():
            room_connections.discard(websocket)
            
    async def join_room(self, websocket: WebSocket, user_id: str, room_id: str):
        if room_id not in self.active_connections:
            self.active_connections[room_id] = set()
        self.active_connections[room_id].add(websocket)
        
        # Notify other users in room
        await self.broadcast_to_room(room_id, {
            "type": "user_joined",
            "user_id": user_id,
            "room_id": room_id
        }, exclude=websocket)
        
    async def leave_room(self, websocket: WebSocket, user_id: str, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].discard(websocket)
            
        # Notify other users in room
        await self.broadcast_to_room(room_id, {
            "type": "user_left", 
            "user_id": user_id,
            "room_id": room_id
        }, exclude=websocket)
        
    async def broadcast_to_room(self, room_id: str, message: dict, exclude: WebSocket = None):
        if room_id in self.active_connections:
            disconnected = set()
            for websocket in self.active_connections[room_id]:
                if websocket != exclude:
                    try:
                        await websocket.send_text(json.dumps(message))
                    except:
                        disconnected.add(websocket)
            
            # Clean up disconnected websockets
            self.active_connections[room_id] -= disconnected

# WebSocket endpoint implementation
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, token: str = None):
    # Authenticate user
    try:
        user = await authenticate_websocket_user(token)
        if user.id != user_id:
            await websocket.close(code=1008, reason="Unauthorized")
            return
    except:
        await websocket.close(code=1008, reason="Authentication failed")
        return
        
    manager = get_websocket_manager()
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message["type"] == "join_room":
                await manager.join_room(websocket, user_id, message["room_id"])
                
            elif message["type"] == "send_message":
                # Rate limiting check
                if await check_rate_limit(user_id, "message", 60, 60):  # 60 messages per minute
                    # Save message to database
                    saved_message = await save_message_to_db(message)
                    # Broadcast to room
                    await manager.broadcast_to_room(message["room_id"], {
                        "type": "new_message",
                        "message": saved_message
                    })
                    
    except WebSocketDisconnect:
        await manager.disconnect(websocket, user_id)
```

#### 3.3.2 WebRTC Implementation

```python
# WebRTC signaling through FastAPI WebSocket
class WebRTCSignalingManager:
    def __init__(self, websocket_manager: WebSocketManager):
        self.websocket_manager = websocket_manager
        self.active_calls: Dict[str, Dict] = {}
        
    async def handle_call_offer(self, caller_id: str, target_id: str, offer_data: dict):
        """Handle WebRTC call offer"""
        call_id = f"{caller_id}_{target_id}_{int(time.time())}"
        self.active_calls[call_id] = {
            "caller_id": caller_id,
            "target_id": target_id,
            "status": "calling"
        }
        
        if target_id in self.websocket_manager.user_connections:
            target_ws = self.websocket_manager.user_connections[target_id]
            await target_ws.send_text(json.dumps({
                "type": "call_offer",
                "call_id": call_id,
                "caller_id": caller_id,
                "offer": offer_data
            }))
            
    async def handle_call_answer(self, call_id: str, callee_id: str, answer_data: dict):
        """Handle WebRTC call answer"""
        if call_id in self.active_calls:
            call_info = self.active_calls[call_id]
            caller_id = call_info["caller_id"]
            
            if caller_id in self.websocket_manager.user_connections:
                caller_ws = self.websocket_manager.user_connections[caller_id]
                await caller_ws.send_text(json.dumps({
                    "type": "call_answer",
                    "call_id": call_id,
                    "callee_id": callee_id,
                    "answer": answer_data
                }))
                
            self.active_calls[call_id]["status"] = "connected"
            
    async def handle_ice_candidate(self, call_id: str, from_user_id: str, candidate_data: dict):
        """Handle ICE candidate exchange"""
        if call_id in self.active_calls:
            call_info = self.active_calls[call_id]
            # Send to the other participant
            target_id = call_info["target_id"] if from_user_id == call_info["caller_id"] else call_info["caller_id"]
            
            if target_id in self.websocket_manager.user_connections:
                target_ws = self.websocket_manager.user_connections[target_id]
                await target_ws.send_text(json.dumps({
                    "type": "ice_candidate",
                    "call_id": call_id,
                    "from_user_id": from_user_id,
                    "candidate": candidate_data
                }))
```

### 3.4 Security Specifications

#### 3.4.1 Authentication & Authorization

```python
# FastAPI JWT token structure with Pydantic
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

class TokenData(BaseModel):
    user_id: str
    username: str
    role: str  # "user", "moderator", "admin"
    exp: datetime
    iat: datetime

# Password hashing with passlib
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# JWT token creation
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Rate limiting configuration with Redis
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Rate limits applied as decorators
@app.post("/auth/login")
@limiter.limit("5/15minutes")  # 5 attempts per 15 minutes
async def login(request: Request, user_data: UserLogin):
    pass

@app.post("/auth/register")
@limiter.limit("3/hour")  # 3 attempts per hour
async def register(request: Request, user_data: UserCreate):
    pass
```

#### 3.4.2 Input Validation & Sanitization

```python
# Pydantic models for validation
from pydantic import BaseModel, validator, Field
from typing import Optional
import uuid
import bleach

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    room_id: uuid.UUID
    reply_to: Optional[uuid.UUID] = None
    
    @validator('content')
    def sanitize_content(cls, v):
        # XSS protection using bleach
        allowed_tags = ['b', 'i', 'u', 'em', 'strong']
        allowed_attributes = {}
        return bleach.clean(v, tags=allowed_tags, attributes=allowed_attributes)

class MessageResponse(BaseModel):
    id: uuid.UUID
    content: str
    room_id: uuid.UUID
    user_id: uuid.UUID
    username: str
    created_at: datetime
    reply_to: Optional[uuid.UUID] = None
    
    class Config:
        from_attributes = True

# SQL injection prevention with SQLAlchemy ORM
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID):
    # SQLAlchemy automatically handles parameterized queries
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

# Input validation in FastAPI endpoints
@app.post("/api/messages", response_model=MessageResponse)
async def create_message(
    message: MessageCreate,  # Automatic validation
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Message content is already sanitized by Pydantic validator
    db_message = Message(
        content=message.content,
        room_id=message.room_id,
        user_id=current_user.id,
        reply_to=message.reply_to
    )
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    return db_message
```

#### 3.4.3 File Upload Security

```python
# File upload handling with FastAPI
from fastapi import UploadFile, File, HTTPException
from typing import List
import aiofiles
import magic
from PIL import Image
import uuid
import os

class FileUploadConfig:
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_FILES = 5
    ALLOWED_TYPES = {
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'text/plain', 'application/pdf'
    }
    UPLOAD_DIR = "uploads"

async def validate_file(file: UploadFile) -> bool:
    """Validate file type and size"""
    # Check file size
    content = await file.read()
    if len(content) > FileUploadConfig.MAX_FILE_SIZE:
        raise HTTPException(400, "File too large")
    
    # Reset file position
    await file.seek(0)
    
    # Verify MIME type using python-magic
    mime_type = magic.from_buffer(content[:2048], mime=True)
    if mime_type not in FileUploadConfig.ALLOWED_TYPES:
        raise HTTPException(400, f"File type {mime_type} not allowed")
    
    return True

@app.post("/api/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    if len(files) > FileUploadConfig.MAX_FILES:
        raise HTTPException(400, "Too many files")
    
    uploaded_files = []
    
    for file in files:
        await validate_file(file)
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        safe_filename = f"{file_id}{file_extension}"
        file_path = os.path.join(FileUploadConfig.UPLOAD_DIR, safe_filename)
        
        # Save file asynchronously
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # If it's an image, create thumbnail
        if file.content_type.startswith('image/'):
            try:
                with Image.open(file_path) as img:
                    img.thumbnail((300, 300))
                    thumbnail_path = os.path.join(
                        FileUploadConfig.UPLOAD_DIR, 
                        f"thumb_{safe_filename}"
                    )
                    img.save(thumbnail_path)
            except Exception:
                pass  # Thumbnail creation failed, continue
        
        uploaded_files.append({
            "id": file_id,
            "filename": file.filename,
            "size": len(content),
            "content_type": file.content_type,
            "url": f"/api/media/{file_id}"
        })
    
    return {"files": uploaded_files}

# File virus scanning with ClamAV (optional)
import clamd

async def scan_file_for_virus(file_path: str) -> bool:
    """Scan file for viruses using ClamAV"""
    try:
        cd = clamd.ClamdUnixSocket()
        result = cd.scan(file_path)
        return result is None  # None means clean
    except Exception:
        # If ClamAV is not available, log warning and allow file
        logger.warning(f"Virus scanning unavailable for {file_path}")
        return True
```

### 3.5 Performance Requirements

#### 3.5.1 Scalability Metrics
- **Concurrent Users**: Support 10,000+ simultaneous connections
- **Message Throughput**: Handle 1,000+ messages per second
- **Response Time**: API responses under 200ms (95th percentile)
- **WebSocket Latency**: Under 50ms for real-time messages
- **Database Queries**: Under 100ms for complex queries

#### 3.5.2 Caching Strategy

```python
# Multi-level caching with FastAPI and Redis
from functools import lru_cache
from redis.asyncio import Redis
import json
from typing import Optional, Any

class CacheManager:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        
    # L1: In-memory cache using functools.lru_cache
    @lru_cache(maxsize=1000)
    async def get_user_permissions(self, user_id: str) -> dict:
        """Cache user permissions in memory"""
        # This will be cached in memory automatically
        pass
    
    # L2: Redis cache with different TTLs
    async def get_from_cache(self, key: str) -> Optional[Any]:
        """Get data from Redis cache"""
        cached_data = await self.redis.get(key)
        if cached_data:
            return json.loads(cached_data)
        return None
    
    async def set_cache(self, key: str, value: Any, ttl: int):
        """Set data in Redis cache with TTL"""
        await self.redis.setex(key, ttl, json.dumps(value, default=str))
    
    # Cache strategies
    async def cache_user_session(self, user_id: str, session_data: dict):
        await self.set_cache(f"session:{user_id}", session_data, 3600)  # 1 hour
    
    async def cache_room_data(self, room_id: str, room_data: dict):
        await self.set_cache(f"room:{room_id}", room_data, 1800)  # 30 minutes
    
    async def cache_message_history(self, room_id: str, messages: list):
        await self.set_cache(f"messages:{room_id}", messages, 300)  # 5 minutes
    
    async def cache_user_preferences(self, user_id: str, preferences: dict):
        await self.set_cache(f"prefs:{user_id}", preferences, 7200)  # 2 hours

# FastAPI dependency for cache
async def get_cache_manager() -> CacheManager:
    redis_client = Redis.from_url("redis://localhost:6379")
    return CacheManager(redis_client)

# Usage in FastAPI endpoints with caching
@app.get("/api/rooms/{room_id}")
async def get_room(
    room_id: str,
    cache: CacheManager = Depends(get_cache_manager),
    db: AsyncSession = Depends(get_db)
):
    # Try cache first
    cached_room = await cache.get_from_cache(f"room:{room_id}")
    if cached_room:
        return cached_room
    
    # If not in cache, get from database
    room = await get_room_from_db(db, room_id)
    if room:
        await cache.cache_room_data(room_id, room.dict())
    return room
```

#### 3.5.3 Database Optimization

```sql
-- Indexing strategy
CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC);
CREATE INDEX idx_messages_user_created ON messages(user_id, created_at DESC);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_chat_rooms_category ON chat_rooms(category);
CREATE INDEX idx_user_sessions_room_joined ON user_sessions(room_id, joined_at);

-- Partitioning for messages table (monthly partitions)
CREATE TABLE messages_y2024m01 PARTITION OF messages
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 3.6 Monitoring & Logging

#### 3.6.1 Application Monitoring

```python
# Prometheus metrics for FastAPI
from prometheus_client import Counter, Gauge, Histogram, generate_latest
from fastapi import Response
import time

# Define metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

active_users_total = Gauge(
    'active_users_total',
    'Total active users'
)

messages_sent_total = Counter(
    'messages_sent_total',
    'Total messages sent',
    ['room_type']
)

http_response_time_seconds = Histogram(
    'http_response_time_seconds',
    'HTTP response times in seconds',
    buckets=[0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
)

websocket_connections = Gauge(
    'websocket_connections_active',
    'Active WebSocket connections'
)

# Middleware for automatic metrics collection
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    # Record metrics
    process_time = time.time() - start_time
    http_requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    http_response_time_seconds.observe(process_time)
    
    return response

# Metrics endpoint
@app.get("/metrics")
async def get_metrics():
    return Response(
        content=generate_latest().decode('utf-8'),
        media_type="text/plain"
    )

# Custom metrics in business logic
async def send_message_to_room(message: MessageCreate, room_id: str):
    # Business logic here...
    
    # Record message sent
    room_type = await get_room_type(room_id)
    messages_sent_total.labels(room_type=room_type).inc()
    
# WebSocket connection tracking
class MetricsWebSocketManager(WebSocketManager):
    async def connect(self, websocket: WebSocket, user_id: str):
        await super().connect(websocket, user_id)
        websocket_connections.inc()
        
    async def disconnect(self, websocket: WebSocket, user_id: str):
        await super().disconnect(websocket, user_id)
        websocket_connections.dec()
```

#### 3.6.2 Structured Logging

```python
# Structured logging with Python's logging and structlog
import logging
import structlog
from fastapi import Request
import sys
import json
from datetime import datetime

# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

# Get logger
logger = structlog.get_logger("chat-app")

# Configure Python logging
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler(sys.stdout)
    ]
)

# Logging middleware for FastAPI
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start_time = datetime.utcnow()
    
    response = await call_next(request)
    
    process_time = (datetime.utcnow() - start_time).total_seconds()
    
    # Log request/response
    logger.info(
        "HTTP request processed",
        method=request.method,
        url=str(request.url),
        status_code=response.status_code,
        process_time=process_time,
        user_agent=request.headers.get("user-agent"),
        client_ip=request.client.host if request.client else None
    )
    
    return response

# Usage in business logic
async def user_joined_room(user_id: str, room_id: str, request: Request):
    logger.info(
        "User joined room",
        user_id=user_id,
        room_id=room_id,
        user_agent=request.headers.get("user-agent"),
        client_ip=request.client.host if request.client else None,
        timestamp=datetime.utcnow().isoformat()
    )

# Error logging
async def handle_error(error: Exception, context: dict):
    logger.error(
        "Application error occurred",
        error_type=type(error).__name__,
        error_message=str(error),
        context=context,
        exc_info=True
    )
```

### 3.7 Deployment Architecture

#### 3.7.1 Docker Configuration

```dockerfile
# Multi-stage Dockerfile for FastAPI application
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN addgroup --system --gid 1001 fastapi \
    && adduser --system --uid 1001 --gid 1001 --no-create-home fastapi

# Production stage
FROM base as production

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .
RUN chown -R fastapi:fastapi /app

USER fastapi

EXPOSE 8000

# Use Gunicorn with Uvicorn workers for production
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]

# Development stage
FROM base as development

WORKDIR /app

# Install development dependencies
COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements-dev.txt

COPY . .
RUN chown -R fastapi:fastapi /app

USER fastapi

EXPOSE 8000

# Use Uvicorn with auto-reload for development
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

#### 3.7.2 Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fastapi-chat-app
  labels:
    app: fastapi-chat-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fastapi-chat-app
  template:
    metadata:
      labels:
        app: fastapi-chat-app
    spec:
      containers:
      - name: fastapi-chat-app
        image: fastapi-chat-app:latest
        ports:
        - containerPort: 8000
          name: http
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: app-secret
              key: secret-key
        - name: ENVIRONMENT
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: uploads
          mountPath: /app/uploads
      volumes:
      - name: uploads
        persistentVolumeClaim:
          claimName: uploads-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: fastapi-chat-service
spec:
  selector:
    app: fastapi-chat-app
  ports:
  - port: 80
    targetPort: 8000
    protocol: TCP
    name: http
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fastapi-chat-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/websocket-services: fastapi-chat-service
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
spec:
  tls:
  - hosts:
    - chat.example.com
    secretName: chat-tls
  rules:
  - host: chat.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: fastapi-chat-service
            port:
              number: 80
```

### 3.8 Testing Strategy

#### 3.8.1 Testing Framework Setup

```javascript
# pytest configuration (pytest.ini)
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --cov=app
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
    -v
asyncio_mode = auto

# Testing configuration with pytest and FastAPI
import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import get_db
from app.models import Base

# Test database setup
TEST_DATABASE_URL = "postgresql+asyncpg://test_user:test_pass@localhost:5433/test_chat_db"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)

@pytest.fixture(scope="session")
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session(setup_test_db):
    async with TestSessionLocal() as session:
        yield session

@pytest.fixture
async def client(db_session):
    def get_test_db():
        return db_session
    
    app.dependency_overrides[get_db] = get_test_db
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

# API testing example
@pytest.mark.asyncio
class TestChatAPI:
    async def test_create_room(self, client: AsyncClient, auth_headers):
        """Test creating a new chat room"""
        room_data = {
            "name": "Test Room",
            "topic": "Testing",
            "category": "general"
        }
        
        response = await client.post(
            "/api/rooms",
            json=room_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Room"
        assert data["topic"] == "Testing"
        assert data["category"] == "general"
        
    async def test_send_message(self, client: AsyncClient, auth_headers, test_room):
        """Test sending a message to a room"""
        message_data = {
            "content": "Hello, World!",
            "room_id": str(test_room.id)
        }
        
        response = await client.post(
            "/api/messages",
            json=message_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["content"] == "Hello, World!"
        assert data["room_id"] == str(test_room.id)
        
    async def test_websocket_connection(self, client: AsyncClient):
        """Test WebSocket connection"""
        with client.websocket_connect("/ws/test-user?token=valid-jwt") as websocket:
            # Test joining room
            websocket.send_json({
                "type": "join_room",
                "room_id": "test-room-id"
            })
            
            # Should receive confirmation
            data = websocket.receive_json()
            assert data["type"] == "room_joined"
```

#### 3.8.2 Load Testing

```javascript
# Load testing with Locust for FastAPI
from locust import HttpUser, task, between
import json
import websocket
import threading
import time

class ChatUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Called when a user starts"""
        # Login and get JWT token
        response = self.client.post("/api/auth/login", json={
            "username": f"testuser_{self.environment.runner.user_count}",
            "password": "testpass123"
        })
        
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            # Register new user if login fails
            register_response = self.client.post("/api/auth/register", json={
                "username": f"testuser_{self.environment.runner.user_count}",
                "email": f"test{self.environment.runner.user_count}@example.com",
                "password": "testpass123"
            })
            if register_response.status_code == 201:
                login_response = self.client.post("/api/auth/login", json={
                    "username": f"testuser_{self.environment.runner.user_count}",
                    "password": "testpass123"
                })
                self.token = login_response.json()["access_token"]
                self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)
    def get_rooms(self):
        """Get list of available rooms"""
        self.client.get("/api/rooms", headers=self.headers)
    
    @task(2)
    def create_room(self):
        """Create a new chat room"""
        room_data = {
            "name": f"Load Test Room {time.time()}",
            "topic": "Load testing",
            "category": "general"
        }
        self.client.post("/api/rooms", json=room_data, headers=self.headers)
    
    @task(5)
    def send_message(self):
        """Send a message to a room"""
        message_data = {
            "content": f"Load test message at {time.time()}",
            "room_id": "550e8400-e29b-41d4-a716-446655440000"  # Default room ID
        }
        self.client.post("/api/messages", json=message_data, headers=self.headers)
    
    @task(1)
    def get_user_profile(self):
        """Get user profile"""
        self.client.get("/api/users/profile", headers=self.headers)
    
    @task(1)
    def websocket_interaction(self):
        """Test WebSocket connection and messaging"""
        def on_message(ws, message):
            data = json.loads(message)
            # Handle different message types
            pass
        
        def on_error(ws, error):
            pass
        
        def on_close(ws, close_status_code, close_msg):
            pass
        
        def on_open(ws):
            # Join a room
            ws.send(json.dumps({
                "type": "join_room",
                "room_id": "550e8400-e29b-41d4-a716-446655440000"
            }))
            
            # Send a few messages
            for i in range(3):
                time.sleep(1)
                ws.send(json.dumps({
                    "type": "send_message",
                    "room_id": "550e8400-e29b-41d4-a716-446655440000",
                    "content": f"WebSocket message {i}"
                }))
        
        ws_url = f"ws://localhost:8000/ws/testuser_{self.environment.runner.user_count}?token={self.token}"
        ws = websocket.WebSocketApp(
            ws_url,
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )
        
        # Run WebSocket in a separate thread for a short time
        ws_thread = threading.Thread(target=lambda: ws.run_forever())
        ws_thread.daemon = True
        ws_thread.start()
        time.sleep(10)  # Keep connection open for 10 seconds
        ws.close()

# Run with: locust -f load_test.py --host=http://localhost:8000
```

## 4. Development Guidelines

### 4.1 Code Quality Standards
- **Black**: Python code formatting with 88 character line length
- **isort**: Import sorting and organization
- **Flake8**: Python linting and style checking
- **MyPy**: Static type checking for Python
- **Pre-commit**: Git hooks for automated code quality checks
- **Pydantic**: Runtime data validation and settings management
- **Type Hints**: Full type annotations for all Python code
- **Code Coverage**: Minimum 80% test coverage with pytest-cov
- **Bandit**: Security linting for Python code

### 4.2 Git Workflow
- **Branching**: GitFlow with feature, develop, and main branches
- **Commit Messages**: Conventional commits format
- **Pull Requests**: Required reviews and automated testing
- **Continuous Integration**: Automated testing and deployment

### 4.3 Documentation
- **API Documentation**: OpenAPI/Swagger specifications
- **Code Documentation**: JSDoc for complex functions
- **Architecture Decision Records**: Document major technical decisions
- **Deployment Guide**: Step-by-step deployment instructions

## 5. Security Considerations

### 5.1 Data Protection
- **Encryption**: TLS 1.3 for data in transit
- **At-rest Encryption**: Database and file storage encryption
- **Key Management**: Secure key rotation and storage
- **Privacy**: GDPR-compliant data handling

### 5.2 Application Security
- **OWASP Top 10**: Protection against common vulnerabilities
- **Security Headers**: Implement all recommended security headers
- **Content Security Policy**: Strict CSP to prevent XSS
- **Regular Updates**: Keep all dependencies up to date

## 6. Maintenance & Support

### 6.1 Backup Strategy
- **Database Backups**: Daily automated backups with point-in-time recovery
- **File Storage**: Redundant storage with versioning
- **Configuration**: Version-controlled infrastructure as code

### 6.2 Disaster Recovery
- **RTO**: 4 hours maximum recovery time objective
- **RPO**: 1 hour maximum recovery point objective
- **Failover**: Automated failover to backup systems
- **Testing**: Quarterly disaster recovery testing

---

*This technical specification provides the foundation for building a robust, scalable, and secure general-purpose chat application using FastAPI for the backend, React with TypeScript for the frontend, and PostgreSQL as the primary database.*