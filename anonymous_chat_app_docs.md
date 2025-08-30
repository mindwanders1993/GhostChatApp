# Anonymous Chat Application - Complete Documentation

## Table of Contents
1. [Project Discovery](#project-discovery)
2. [Market Research](#market-research)
3. [Functional Requirements](#functional-requirements)
4. [Technical Requirements](#technical-requirements)
5. [System Architecture](#system-architecture)
6. [High-Level Design](#high-level-design)
7. [Low-Level Design](#low-level-design)
8. [Database Design](#database-design)
9. [API Design](#api-design)
10. [Security & Privacy](#security-privacy)
11. [Moderation & Safety](#moderation-safety)
12. [Deployment Strategy](#deployment-strategy)

---

## Project Discovery

### Project Overview
An anonymous chat application that allows adults (18+) to connect and communicate with strangers without revealing their identity. The platform emphasizes privacy, security, and user safety while providing a seamless real-time messaging experience.

### Vision Statement
To create a secure, anonymous communication platform that enables meaningful connections while prioritizing user privacy and safety.

### Mission Statement
Provide a safe, anonymous space for adults to communicate, express themselves freely, and connect with others from around the world while maintaining the highest standards of privacy protection.

### Project Objectives
- **Primary**: Build a robust anonymous chat platform for adult users
- **Secondary**: Implement comprehensive safety and moderation systems
- **Tertiary**: Ensure scalability and high performance
- **Quaternary**: Maintain user privacy and data protection compliance

### Success Metrics
- Daily Active Users (DAU): 10,000+ within 6 months
- Message Throughput: 1M+ messages per day
- User Safety Score: 95% positive user safety ratings
- System Uptime: 99.9% availability
- Response Time: <200ms message delivery

---

## Market Research

### Competitive Analysis

**Direct Competitors:**
1. **Omegle** - Text/video chat with strangers
2. **Chatroulette** - Random video chat platform
3. **ifreechat.com** - Anonymous text chat rooms
4. **AntiChat** - Anonymous messaging with disappearing messages
5. **Twiq** - Anonymous local and global chat

**Indirect Competitors:**
1. **Discord** - Community-based chat
2. **Telegram** - Secure messaging
3. **WhatsApp** - Mainstream messaging
4. **Signal** - Privacy-focused messaging

### Market Gaps Identified
- **Lack of sophisticated moderation** in existing anonymous platforms
- **Poor mobile experience** on many anonymous chat sites
- **Limited customization options** for user experience
- **Inadequate safety features** for vulnerable users
- **Poor user retention** due to toxic environments

### Target Audience

**Primary Users:**
- **Age**: 18-35 years old
- **Demographics**: Tech-savvy individuals seeking anonymous connections
- **Psychographics**: Privacy-conscious, socially curious, seeking authentic connections
- **Geographic**: Global, English-speaking initially

**User Personas:**

1. **The Privacy Seeker** (25% of users)
   - Values anonymity above all
   - Concerned about digital footprint
   - Wants genuine conversations without judgment

2. **The Social Explorer** (40% of users)
   - Enjoys meeting new people
   - Seeks diverse perspectives
   - Values interesting conversations

3. **The Lonely Individual** (20% of users)
   - Seeking companionship
   - May have social anxiety
   - Needs emotional support

4. **The Thrill Seeker** (15% of users)
   - Enjoys unpredictability
   - Seeks excitement in conversations
   - Values spontaneous interactions

### Key Insights from Research
- 85% of adult chat users prioritize security over flashy bells and whistles
- Moderation ensures users feel welcome, safe, and respected while using your app
- Users expect messages to be delivered instantly – even with millions of concurrent users
- Chat moderation serves as the first line of defense against harassment, explicit content and any form of unwarranted behavior

---

## Functional Requirements

### Core Features

#### 1. User Management
- **FR-001**: Anonymous user registration with nickname only
- **FR-002**: No email or phone number required for registration
- **FR-003**: Temporary session-based authentication
- **FR-004**: User profile deletion without trace
- **FR-005**: Age verification (18+ only)
- **FR-006**: Multiple anonymous identities per device

#### 2. Chat Functionality
- **FR-007**: One-on-one anonymous chat
- **FR-008**: Public chat rooms by categories
- **FR-009**: Private group chats (up to 10 users)
- **FR-010**: Real-time message delivery (<200ms)
- **FR-011**: Message typing indicators
- **FR-012**: Message read receipts (optional)
- **FR-013**: Message history (session-based)
- **FR-014**: Emoji and GIF support
- **FR-015**: File sharing (images, audio, video)

#### 3. Matching System
- **FR-016**: Random user matching
- **FR-017**: Interest-based matching
- **FR-018**: Location-based matching (optional)
- **FR-019**: Age range filtering
- **FR-020**: Gender preference filtering
- **FR-021**: Language preference matching

#### 4. Privacy & Safety
- **FR-022**: End-to-end message encryption
- **FR-023**: Self-destructing messages (optional)
- **FR-024**: Screenshot prevention (mobile)
- **FR-025**: User blocking functionality
- **FR-026**: Report abuse mechanism
- **FR-027**: Emergency disconnect button
- **FR-028**: No message logging on servers

#### 5. Content Moderation
- **FR-029**: Automated content filtering
- **FR-030**: Real-time profanity detection
- **FR-031**: Image content moderation
- **FR-032**: Spam detection and prevention
- **FR-033**: Bot detection and blocking
- **FR-034**: Human moderator escalation
- **FR-035**: Community reporting system

### Advanced Features

#### 6. Gamification
- **FR-036**: Karma/reputation system
- **FR-037**: User achievements and badges
- **FR-038**: Daily connection goals
- **FR-039**: Conversation quality ratings
- **FR-040**: Anonymous leaderboards

#### 7. Customization
- **FR-041**: Chat themes and colors
- **FR-042**: Custom avatars (non-identifying)
- **FR-043**: Notification preferences
- **FR-044**: Language preferences
- **FR-045**: Chat room creation

#### 8. Premium Features
- **FR-046**: Priority matching
- **FR-047**: Advanced filtering options
- **FR-048**: Unlimited daily connections
- **FR-049**: Custom chat rooms
- **FR-050**: Message history backup

### User Stories

**As an anonymous user, I want to:**
- Connect with random strangers without revealing my identity
- Have conversations that disappear after the session ends
- Block users who make me uncomfortable
- Report inappropriate behavior easily
- Choose conversation partners based on interests
- Feel safe while exploring meaningful connections

**As a moderator, I want to:**
- Monitor conversations for harmful content
- Remove inappropriate users quickly
- Escalate serious violations to authorities
- Access analytical data about platform safety
- Implement temporary or permanent bans

---

## Technical Requirements

### Technology Stack

#### Frontend
- **Framework**: React 18.2+ with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: Redux Toolkit + RTK Query
- **Real-time**: Socket.io-client
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library
- **Deployment**: Vercel/Netlify

#### Backend
- **Framework**: FastAPI 0.104+
- **Language**: Python 3.11+
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Message Queue**: Redis Pub/Sub
- **WebSockets**: Socket.io
- **Authentication**: JWT + Sessions
- **Testing**: pytest + pytest-asyncio

#### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx
- **Load Balancer**: Nginx/HAProxy
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

#### Third-Party Services
- **Content Moderation**: AWS Rekognition + Custom ML models
- **Push Notifications**: Firebase Cloud Messaging
- **Analytics**: Google Analytics 4
- **Error Tracking**: Sentry
- **CDN**: CloudFlare

### Performance Requirements

#### Scalability
- **TR-001**: Support 10,000+ concurrent users
- **TR-002**: Handle 1M+ messages per day
- **TR-003**: Horizontal scaling capability
- **TR-004**: Database sharding support
- **TR-005**: CDN integration for global reach

#### Performance
- **TR-006**: Message delivery latency <200ms
- **TR-007**: API response time <100ms (95th percentile)
- **TR-008**: Page load time <2 seconds
- **TR-009**: WebSocket connection establishment <500ms
- **TR-010**: File upload speed 10MB/s minimum

#### Reliability
- **TR-011**: System uptime 99.9%
- **TR-012**: Database backup every 6 hours
- **TR-013**: Automatic failover capability
- **TR-014**: Zero-downtime deployments
- **TR-015**: Disaster recovery plan

### Security Requirements

#### Data Protection
- **TR-016**: End-to-end encryption for messages
- **TR-017**: TLS 1.3 for all connections
- **TR-018**: Password hashing with bcrypt
- **TR-019**: JWT token expiration (15 minutes)
- **TR-020**: API rate limiting (100 req/min per user)

#### Privacy Compliance
- **TR-021**: GDPR compliance
- **TR-022**: CCPA compliance
- **TR-023**: Data anonymization techniques
- **TR-024**: Right to be forgotten implementation
- **TR-025**: Consent management system

### Browser & Device Compatibility

#### Web Browsers
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Mobile browsers (iOS Safari, Android Chrome)
- WebSocket support required
- Local storage support required

#### Mobile Compatibility
- Progressive Web App (PWA) support
- Responsive design for all screen sizes
- Touch-friendly interface
- Offline message queuing

---

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Load Balancer │    │   Web Servers   │
│                 │    │                 │    │                 │
│  - React Web    │◄──►│   Nginx/HAProxy │◄──►│   FastAPI       │
│  - Mobile PWA   │    │                 │    │   Instances     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐             │
                       │   WebSocket     │◄────────────┘
                       │   Server        │
                       │   (Socket.io)   │
                       └─────────────────┘
                                │
        ┌──────────────────────────────────────────────┐
        │                                              │
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ PostgreSQL  │  │    Redis    │  │  Message    │  │   Content   │
│ Database    │  │   Cache     │  │   Queue     │  │ Moderation  │
│             │  │             │  │  (Redis)    │  │  Service    │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### Microservices Architecture

#### Core Services
1. **User Service** - User management and authentication
2. **Chat Service** - Message routing and room management
3. **Matching Service** - User pairing algorithms
4. **Moderation Service** - Content filtering and safety
5. **Notification Service** - Push notifications and alerts
6. **Analytics Service** - User behavior and platform metrics

#### Service Communication
- **Synchronous**: REST APIs for CRUD operations
- **Asynchronous**: Redis Pub/Sub for real-time events
- **WebSocket**: Real-time bidirectional communication

### Data Flow Architecture

#### Message Flow
1. User sends message via WebSocket
2. Message validated and encrypted
3. Content moderation check
4. Message stored temporarily
5. Delivered to recipient(s)
6. Delivery confirmation sent
7. Message auto-deleted after session

#### User Matching Flow
1. User requests new connection
2. Matching service finds compatible users
3. Chat room created
4. Users notified and connected
5. Conversation begins

---

## High-Level Design

### Component Architecture

#### Frontend Components
```
App
├── Authentication
│   ├── LoginComponent
│   ├── RegisterComponent
│   └── AgeVerification
├── Chat
│   ├── ChatRoomList
│   ├── ChatWindow
│   ├── MessageInput
│   ├── MessageList
│   └── UserActions
├── Matching
│   ├── MatchingPreferences
│   ├── FindPartner
│   └── MatchNotification
├── Profile
│   ├── AnonymousProfile
│   ├── Settings
│   └── Privacy
└── Moderation
    ├── ReportUser
    ├── BlockUser
    └── SafetyCenter
```

#### Backend Services
```
FastAPI Application
├── Authentication Service
│   ├── JWT Management
│   ├── Session Handling
│   └── Anonymous Registration
├── Chat Service
│   ├── Room Management
│   ├── Message Routing
│   └── Real-time Events
├── User Service
│   ├── Anonymous Profiles
│   ├── Preferences
│   └── Blocking/Reporting
├── Matching Service
│   ├── Algorithm Engine
│   ├── Filter Management
│   └── Queue Processing
└── Moderation Service
    ├── Content Filtering
    ├── Image Moderation
    └── Violation Handling
```

### API Design Pattern

#### RESTful Endpoints
```
POST   /api/v1/auth/register        # Anonymous registration
POST   /api/v1/auth/login          # Session login
DELETE /api/v1/auth/logout         # Session cleanup

GET    /api/v1/matching/find       # Find chat partner
POST   /api/v1/matching/preferences # Set preferences
DELETE /api/v1/matching/disconnect  # End connection

POST   /api/v1/chat/rooms          # Create chat room
GET    /api/v1/chat/rooms/:id      # Get room details
POST   /api/v1/chat/rooms/:id/join # Join room

POST   /api/v1/reports              # Report user/content
POST   /api/v1/blocks               # Block user
GET    /api/v1/safety/guidelines    # Safety information
```

#### WebSocket Events
```javascript
// Client to Server
'join_room'         // Join chat room
'leave_room'        // Leave chat room
'send_message'      // Send message
'typing_start'      // Start typing indicator
'typing_stop'       // Stop typing indicator
'disconnect_user'   // Disconnect from partner

// Server to Client
'message_received'  // New message
'user_joined'       // User joined room
'user_left'         // User left room
'typing_indicator'  // Someone is typing
'connection_ended'  // Chat ended
'moderation_alert'  // Content violation
```

### Security Architecture

#### Authentication Flow
```
1. User Registration
   ├── Generate anonymous ID
   ├── Create session token
   ├── Store minimal data
   └── Return auth credentials

2. Session Management
   ├── JWT token (short-lived)
   ├── Refresh token rotation
   ├── Session invalidation
   └── Auto-cleanup

3. Privacy Protection
   ├── No persistent user data
   ├── Encrypted message transport
   ├── Anonymous identifiers
   └── Session-based storage
```

#### Content Moderation Pipeline
```
Message Input
    ↓
Text Analysis
├── Profanity Detection
├── Spam Detection
├── Threat Assessment
└── Content Classification
    ↓
Image Moderation (if applicable)
├── NSFW Detection
├── Violence Detection
├── Inappropriate Content
└── Malware Scanning
    ↓
Risk Assessment
├── User History
├── Severity Scoring
├── Context Analysis
└── Decision Engine
    ↓
Action Taken
├── Allow Message
├── Filter Content
├── Warn User
├── Block User
└── Escalate to Human
```

---

## Low-Level Design

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anonymous_id VARCHAR(32) UNIQUE NOT NULL,
    nickname VARCHAR(50),
    age_verified BOOLEAN DEFAULT FALSE,
    preferences JSONB,
    karma_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_token VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_anonymous_id ON users(anonymous_id);
CREATE INDEX idx_users_session_token ON users(session_token);
CREATE INDEX idx_users_last_active ON users(last_active);
```

#### Chat Rooms Table
```sql
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type VARCHAR(20) NOT NULL, -- 'private', 'public', 'group'
    name VARCHAR(100),
    description TEXT,
    max_participants INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_chat_rooms_type ON chat_rooms(room_type);
CREATE INDEX idx_chat_rooms_active ON chat_rooms(is_active);
```

#### Room Participants Table
```sql
CREATE TABLE room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'member' -- 'member', 'moderator', 'admin'
);

CREATE INDEX idx_room_participants_room ON room_participants(room_id);
CREATE INDEX idx_room_participants_user ON room_participants(user_id);
```

#### Messages Table (Temporary Storage)
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file', 'emoji'
    metadata JSONB,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

CREATE INDEX idx_messages_room_time ON messages(room_id, sent_at);
CREATE INDEX idx_messages_expires ON messages(expires_at);

-- Auto-delete expired messages
CREATE OR REPLACE FUNCTION delete_expired_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM messages WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule('delete-expired-messages', '*/10 * * * *', 'SELECT delete_expired_messages();');
```

#### User Blocks Table
```sql
CREATE TABLE user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_user_blocks_unique ON user_blocks(blocker_id, blocked_id);
```

#### Reports Table
```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message_id UUID,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE SET NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewing', 'resolved', 'dismissed'
    priority VARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    moderator_notes TEXT
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_priority ON reports(priority);
CREATE INDEX idx_reports_created ON reports(created_at);
```

### API Implementation Details

#### FastAPI Main Application
```python
# main.py
from fastapi import FastAPI, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer
import uvicorn

from app.routers import auth, chat, matching, moderation
from app.websocket import websocket_manager
from app.middleware import RateLimitMiddleware, SecurityMiddleware
from app.database import init_db

app = FastAPI(
    title="Anonymous Chat API",
    description="Secure anonymous chat application API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "yourdomain.com"])
app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityMiddleware)

# Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(matching.router, prefix="/api/v1/matching", tags=["Matching"])
app.include_router(moderation.router, prefix="/api/v1/moderation", tags=["Moderation"])

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket_manager.connect(websocket, user_id)
```

#### Authentication Service
```python
# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from app.models.user import User, UserCreate, UserResponse
from app.services.auth_service import AuthService
from app.database import get_db

router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate, db = Depends(get_db)):
    """Register new anonymous user"""
    try:
        user = await AuthService.create_anonymous_user(db, user_data)
        return UserResponse.from_orm(user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/refresh")
async def refresh_token(token: str = Depends(security), db = Depends(get_db)):
    """Refresh authentication token"""
    try:
        new_token = await AuthService.refresh_token(db, token)
        return {"access_token": new_token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

@router.delete("/logout")
async def logout_user(token: str = Depends(security), db = Depends(get_db)):
    """Logout and invalidate session"""
    try:
        await AuthService.logout_user(db, token)
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
```

#### WebSocket Manager
```python
# app/websocket/manager.py
from typing import Dict, List
from fastapi import WebSocket
import json
import asyncio
from app.services.chat_service import ChatService
from app.services.moderation_service import ModerationService

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.room_connections: Dict[str, List[str]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        try:
            await self.listen_for_messages(websocket, user_id)
        except Exception as e:
            await self.disconnect(user_id)

    async def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        
        # Remove from all rooms
        for room_id, users in self.room_connections.items():
            if user_id in users:
                users.remove(user_id)
                await self.broadcast_to_room(room_id, {
                    "type": "user_left",
                    "user_id": user_id
                })

    async def join_room(self, user_id: str, room_id: str):
        if room_id not in self.room_connections:
            self.room_connections[room_id] = []
        
        if user_id not in self.room_connections[room_id]:
            self.room_connections[room_id].append(user_id)
            await self.broadcast_to_room(room_id, {
                "type": "user_joined",
                "user_id": user_id
            })

    async def send_message(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_text(json.dumps(message))

    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id in self.room_connections:
            tasks = []
            for user_id in self.room_connections[room_id]:
                tasks.append(self.send_message(user_id, message))
            await asyncio.gather(*tasks, return_exceptions=True)

    async def listen_for_messages(self, websocket: WebSocket, user_id: str):
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                await self.handle_message(user_id, message)
            except Exception as e:
                break

    async def handle_message(self, user_id: str, message: dict):
        message_type = message.get("type")
        
        if message_type == "send_message":
            # Content moderation check
            is_safe = await ModerationService.check_content(message.get("content"))
            if not is_safe:
                await self.send_message(user_id, {
                    "type": "moderation_warning",
                    "message": "Your message contains inappropriate content"
                })
                return
            
            # Process and broadcast message
            await ChatService.process_message(user_id, message)
            room_id = message.get("room_id")
            await self.broadcast_to_room(room_id, {
                "type": "message_received",
                "sender_id": user_id,
                "content": message.get("content"),
                "timestamp": message.get("timestamp")
            })
        
        elif message_type == "join_room":
            room_id = message.get("room_id")
            await self.join_room(user_id, room_id)
        
        elif message_type == "typing_start":
            room_id = message.get("room_id")
            await self.broadcast_to_room(room_id, {
                "type": "typing_indicator",
                "user_id": user_id,
                "is_typing": True
            })

manager = ConnectionManager()
```

#### Content Moderation Service
```python
# app/services/moderation_service.py
import re
import asyncio
from typing import List, Dict, Optional
import aiohttp
from app.models.moderation import ContentAnalysis, ModerationResult
from app.utils.profanity_filter import ProfanityFilter
from app.config import settings

class ModerationService:
    def __init__(self):
        self.profanity_filter = ProfanityFilter()
        self.toxicity_threshold = 0.7
        self.spam_patterns = [
            r'(?i)(https?://|www\.)\S+',  # URLs
            r'(?i)\b(\w+\.){2,}\w+\b',    # Multiple dots (spam pattern)
            r'(?i)(.)\1{5,}',             # Repeated characters
        ]

    async def check_content(self, content: str) -> ModerationResult:
        """Comprehensive content moderation check"""
        results = await asyncio.gather(
            self._check_profanity(content),
            self._check_spam(content),
            self._check_toxicity(content),
            return_exceptions=True
        )
        
        profanity_score = results[0] if not isinstance(results[0], Exception) else 0
        spam_score = results[1] if not isinstance(results[1], Exception) else 0
        toxicity_score = results[2] if not isinstance(results[2], Exception) else 0
        
        overall_score = max(profanity_score, spam_score, toxicity_score)
        
        return ModerationResult(
            is_safe=overall_score < 0.5,
            confidence=overall_score,
            reasons=self._get_violation_reasons(profanity_score, spam_score, toxicity_score),
            action_required=self._determine_action(overall_score)
        )

    async def _check_profanity(self, content: str) -> float:
        """Check for profanity and inappropriate language"""
        return self.profanity_filter.analyze(content)

    async def _check_spam(self, content: str) -> float:
        """Check for spam patterns"""
        spam_indicators = 0
        total_patterns = len(self.spam_patterns)
        
        for pattern in self.spam_patterns:
            if re.search(pattern, content):
                spam_indicators += 1
        
        return spam_indicators / total_patterns if total_patterns > 0 else 0

    async def _check_toxicity(self, content: str) -> float:
        """Check toxicity using external AI service"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{settings.MODERATION_API_URL}/analyze",
                    json={"text": content},
                    headers={"Authorization": f"Bearer {settings.MODERATION_API_KEY}"}
                ) as response:
                    data = await response.json()
                    return data.get("toxicity_score", 0)
        except Exception:
            return 0  # Default to safe if service unavailable

    def _get_violation_reasons(self, profanity: float, spam: float, toxicity: float) -> List[str]:
        """Get specific violation reasons"""
        reasons = []
        if profanity > 0.5:
            reasons.append("inappropriate_language")
        if spam > 0.5:
            reasons.append("spam_detected")
        if toxicity > 0.5:
            reasons.append("toxic_content")
        return reasons

    def _determine_action(self, score: float) -> str:
        """Determine moderation action based on score"""
        if score >= 0.9:
            return "block_user"
        elif score >= 0.7:
            return "filter_content"
        elif score >= 0.5:
            return "warn_user"
        else:
            return "allow"

    async def moderate_image(self, image_url: str) -> ModerationResult:
        """Moderate image content using AWS Rekognition"""
        try:
            # Implementation for image moderation
            # Using AWS Rekognition or similar service
            pass
        except Exception as e:
            return ModerationResult(is_safe=False, confidence=1.0, reasons=["moderation_error"])
```

#### React Frontend Components

```typescript
// src/types/chat.ts
export interface User {
  id: string;
  anonymousId: string;
  nickname: string;
  isOnline: boolean;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'emoji';
  timestamp: string;
  isDeleted?: boolean;
}

export interface ChatRoom {
  id: string;
  type: 'private' | 'public' | 'group';
  name?: string;
  participants: User[];
  lastMessage?: Message;
  isActive: boolean;
}

export interface MatchingPreferences {
  ageRange: [number, number];
  interests: string[];
  language: string;
  location?: string;
}
```

```tsx
// src/components/Chat/ChatWindow.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Avatar,
  Chip
} from '@mui/material';
import { Send, Block, Report, ExitToApp } from '@mui/icons-material';
import { useSocket } from '../../hooks/useSocket';
import { Message, User } from '../../types/chat';
import MessageList from './MessageList';
import TypingIndicator from './TypingIndicator';

interface ChatWindowProps {
  roomId: string;
  currentUser: User;
  partner?: User;
  onLeave: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  roomId,
  currentUser,
  partner,
  onLeave
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const { socket, sendMessage, isConnected } = useSocket(currentUser.id);

  useEffect(() => {
    if (socket) {
      socket.on('message_received', handleMessageReceived);
      socket.on('typing_indicator', handleTypingIndicator);
      socket.on('user_left', handleUserLeft);
      socket.on('moderation_warning', handleModerationWarning);

      // Join room
      socket.emit('join_room', { room_id: roomId });
    }

    return () => {
      if (socket) {
        socket.off('message_received');
        socket.off('typing_indicator');
        socket.off('user_left');
        socket.off('moderation_warning');
      }
    };
  }, [socket, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMessageReceived = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleTypingIndicator = (data: { user_id: string; is_typing: boolean }) => {
    if (data.user_id !== currentUser.id) {
      setPartnerTyping(data.is_typing);
    }
  };

  const handleUserLeft = () => {
    // Handle partner leaving
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      roomId,
      senderId: 'system',
      content: 'Your partner has left the chat',
      messageType: 'text',
      timestamp: new Date().toISOString()
    }]);
  };

  const handleModerationWarning = (data: { message: string }) => {
    // Show moderation warning
    alert(data.message);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return;

    const message: Omit<Message, 'id'> = {
      roomId,
      senderId: currentUser.id,
      content: newMessage.trim(),
      messageType: 'text',
      timestamp: new Date().toISOString()
    };

    // Optimistic update
    setMessages(prev => [...prev, { ...message, id: Date.now().toString() }]);
    
    // Send via WebSocket
    sendMessage({
      type: 'send_message',
      ...message
    });

    setNewMessage('');
    handleStopTyping();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit('typing_start', { room_id: roomId });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      socket?.emit('typing_stop', { room_id: roomId });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBlockUser = () => {
    if (partner && confirm('Are you sure you want to block this user?')) {
      // Implement block user functionality
      onLeave();
    }
  };

  const handleReportUser = () => {
    if (partner) {
      // Open report dialog
      // Implementation for reporting functionality
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ mr: 2 }}>
              {partner?.nickname?.[0]?.toUpperCase() || '?'}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {partner?.nickname || 'Anonymous User'}
              </Typography>
              {partner?.isOnline && (
                <Chip label="Online" size="small" color="success" />
              )}
            </Box>
          </Box>
          
          <Box>
            <IconButton onClick={handleReportUser} color="warning">
              <Report />
            </IconButton>
            <IconButton onClick={handleBlockUser} color="error">
              <Block />
            </IconButton>
            <IconButton onClick={onLeave} color="primary">
              <ExitToApp />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <MessageList
          messages={messages}
          currentUserId={currentUser.id}
        />
        {partnerTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={!isConnected}
            multiline
            maxRows={3}
          />
          <IconButton
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            color="primary"
            sx={{ ml: 1 }}
          >
            <Send />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatWindow;
```

```tsx
// src/components/Matching/MatchingInterface.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Slider,
  FormControlLabel,
  Switch,
  Chip,
  TextField
} from '@mui/material';
import { Search, Cancel } from '@mui/icons-material';
import { MatchingPreferences } from '../../types/chat';
import { useMatching } from '../../hooks/useMatching';

const MatchingInterface: React.FC = () => {
  const [preferences, setPreferences] = useState<MatchingPreferences>({
    ageRange: [18, 35],
    interests: [],
    language: 'en',
  });
  const [newInterest, setNewInterest] = useState('');
  
  const {
    isSearching,
    foundMatch,
    startMatching,
    cancelMatching,
    acceptMatch,
    declineMatch
  } = useMatching();

  const handleAgeRangeChange = (event: Event, newValue: number | number[]) => {
    setPreferences(prev => ({
      ...prev,
      ageRange: newValue as [number, number]
    }));
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && preferences.interests.length < 10) {
      setPreferences(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleStartMatching = () => {
    startMatching(preferences);
  };

  if (foundMatch) {
    return (
      <Card sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Match Found! 🎉
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            We found someone who matches your preferences.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={acceptMatch}
            >
              Start Chatting
            </Button>
            <Button
              variant="outlined"
              onClick={declineMatch}
            >
              Find Another
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (isSearching) {
    return (
      <Card sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Finding your perfect chat partner...
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            This may take a few seconds
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={cancelMatching}
          >
            Cancel Search
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Find Your Chat Partner
        </Typography>
        
        {/* Age Range */}
        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>Age Range: {preferences.ageRange[0]} - {preferences.ageRange[1]}</Typography>
          <Slider
            value={preferences.ageRange}
            onChange={handleAgeRangeChange}
            valueLabelDisplay="auto"
            min={18}
            max={80}
          />
        </Box>

        {/* Interests */}
        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>Interests (optional)</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {preferences.interests.map((interest) => (
              <Chip
                key={interest}
                label={interest}
                onDelete={() => handleRemoveInterest(interest)}
                size="small"
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Add interest..."
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
            />
            <Button onClick={handleAddInterest} disabled={!newInterest.trim()}>
              Add
            </Button>
          </Box>
        </Box>

        {/* Start Matching Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<Search />}
          onClick={handleStartMatching}
        >
          Find Chat Partner
        </Button>
      </CardContent>
    </Card>
  );
};

export default MatchingInterface;
```

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      Users      │    │   Chat Rooms    │    │    Messages     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ anonymous_id    │    │ room_type       │    │ room_id (FK)    │
│ nickname        │    │ name            │    │ sender_id (FK)  │
│ age_verified    │    │ description     │    │ content         │
│ preferences     │    │ max_participants│    │ message_type    │
│ karma_score     │    │ is_active       │    │ metadata        │
│ created_at      │    │ created_at      │    │ sent_at         │
│ last_active     │    │ expires_at      │    │ expires_at      │
│ session_token   │    └─────────────────┘    └─────────────────┘
│ is_active       │              │                        │
└─────────────────┘              │                        │
         │                       │                        │
         │                       │                        │
┌─────────────────┐              │              ┌─────────────────┐
│ Room Participants│◄─────────────┘              │   User Blocks   │
├─────────────────┤                             ├─────────────────┤
│ id (PK)         │                             │ id (PK)         │
│ room_id (FK)    │                             │ blocker_id (FK) │
│ user_id (FK)    │                             │ blocked_id (FK) │
│ joined_at       │                             │ reason          │
│ left_at         │                             │ created_at      │
│ is_active       │                             └─────────────────┘
│ role            │                                       │
└─────────────────┘                                       │
                                                          │
                                              ┌─────────────────┐
                                              │    Reports      │
                                              ├─────────────────┤
                                              │ id (PK)         │
                                              │ reporter_id (FK)│
                                              │ reported_user_id│
                                              │ message_id      │
                                              │ room_id (FK)    │
                                              │ reason          │
                                              │ description     │
                                              │ status          │
                                              │ priority        │
                                              │ created_at      │
                                              │ resolved_at     │
                                              │ moderator_notes │
                                              └─────────────────┘
```

### Data Storage Strategy

#### Message Storage
- **Temporary Storage**: Messages stored in PostgreSQL for 24 hours max
- **Auto-deletion**: Cron job removes expired messages every 10 minutes
- **No Long-term Storage**: Complete message deletion after session ends
- **Encryption**: All messages encrypted at rest and in transit

#### User Data Minimization
- **Anonymous IDs**: No personally identifiable information stored
- **Session-based**: User data tied to temporary sessions
- **Automatic Cleanup**: Inactive sessions deleted after 24 hours
- **No Persistent Profiles**: Users can delete account without trace

#### Redis Cache Strategy
```
Key Patterns:
- user:session:{session_token} -> User session data (15 min TTL)
- room:{room_id}:users -> List of active users in room (auto-expire)
- matching:queue:{preferences_hash} -> Matching queue (5 min TTL)
- moderation:cache:{content_hash} -> Cached moderation results (1 hour TTL)
- rate_limit:{user_id}:{endpoint} -> Rate limiting data (per window TTL)
```

---

## API Design

### REST API Endpoints

#### Authentication Endpoints
```
POST   /api/v1/auth/register
Request: {
  "nickname": "string",
  "age_verified": boolean,
  "preferences": {
    "age_range": [number, number],
    "interests": ["string"],
    "language": "string"
  }
}
Response: {
  "access_token": "string",
  "token_type": "bearer",
  "user": {
    "id": "string",
    "anonymous_id": "string",
    "nickname": "string"
  }
}

POST   /api/v1/auth/refresh
Request: Bearer token in header
Response: {
  "access_token": "string",
  "token_type": "bearer"
}

DELETE /api/v1/auth/logout
Request: Bearer token in header
Response: {
  "message": "Successfully logged out"
}
```

#### Matching Endpoints
```
POST   /api/v1/matching/find
Request: {
  "preferences": {
    "age_range": [number, number],
    "interests": ["string"],
    "language": "string"
  }
}
Response: {
  "status": "searching" | "found" | "timeout",
  "match_id": "string",
  "estimated_wait": number
}

GET    /api/v1/matching/status
Response: {
  "status": "searching" | "found" | "timeout",
  "match_id": "string",
  "partner": {
    "anonymous_id": "string",
    "nickname": "string"
  }
}

DELETE /api/v1/matching/cancel
Response: {
  "message": "Search cancelled"
}
```

#### Chat Endpoints
```
POST   /api/v1/chat/rooms
Request: {
  "type": "private" | "public" | "group",
  "name": "string",
  "max_participants": number
}
Response: {
  "room": {
    "id": "string",
    "type": "string",
    "name": "string",
    "created_at": "string"
  }
}

GET    /api/v1/chat/rooms/{room_id}
Response: {
  "room": {
    "id": "string",
    "type": "string",
    "name": "string",
    "participants": [
      {
        "anonymous_id": "string",
        "nickname": "string",
        "is_active": boolean
      }
    ]
  }
}

POST   /api/v1/chat/rooms/{room_id}/join
Response: {
  "message": "Joined successfully",
  "room": { ... }
}

DELETE /api/v1/chat/rooms/{room_id}/leave
Response: {
  "message": "Left successfully"
}
```

#### Moderation Endpoints
```
POST   /api/v1/moderation/reports
Request: {
  "reported_user_id": "string",
  "reason": "string",
  "description": "string",
  "message_id": "string",
  "room_id": "string"
}
Response: {
  "report_id": "string",
  "status": "submitted",
  "message": "Report submitted successfully"
}

POST   /api/v1/moderation/blocks
Request: {
  "blocked_user_id": "string",
  "reason": "string"
}
Response: {
  "message": "User blocked successfully"
}

GET    /api/v1/moderation/guidelines
Response: {
  "guidelines": [
    {
      "title": "string",
      "description": "string",
      "examples": ["string"]
    }
  ]
}
```

### WebSocket Event Documentation

#### Client to Server Events
```javascript
// Join a chat room
socket.emit('join_room', {
  room_id: 'string'
});

// Leave a chat room
socket.emit('leave_room', {
  room_id: 'string'
});

// Send a message
socket.emit('send_message', {
  room_id: 'string',
  content: 'string',
  message_type: 'text' | 'image' | 'file' | 'emoji',
  metadata: {}
});

// Typing indicators
socket.emit('typing_start', {
  room_id: 'string'
});

socket.emit('typing_stop', {
  room_id: 'string'
});

// Disconnect from partner
socket.emit('disconnect_user', {
  room_id: 'string',
  reason: 'string'
});
```

#### Server to Client Events
```javascript
// Message received
socket.on('message_received', {
  id: 'string',
  room_id: 'string',
  sender_id: 'string',
  content: 'string',
  message_type: 'string',
  timestamp: 'string'
});

// User joined room
socket.on('user_joined', {
  room_id: 'string',
  user_id: 'string',
  nickname: 'string'
});

// User left room
socket.on('user_left', {
  room_id: 'string',
  user_id: 'string',
  reason: 'string'
});

// Typing indicator
socket.on('typing_indicator', {
  room_id: 'string',
  user_id: 'string',
  is_typing: boolean
});

// Connection ended
socket.on('connection_ended', {
  room_id: 'string',
  reason: 'partner_left' | 'timeout' | 'violation'
});

// Moderation alert
socket.on('moderation_alert', {
  type: 'warning' | 'violation' | 'banned',
  message: 'string',
  action_required: boolean
});

// Match found
socket.on('match_found', {
  match_id: 'string',
  partner: {
    anonymous_id: 'string',
    nickname: 'string'
  },
  room_id: 'string'
});
```

### API Rate Limiting

```python
# Rate limiting configuration
RATE_LIMITS = {
    'auth/register': '5/minute',
    'auth/refresh': '10/minute',
    'matching/find': '3/minute',
    'chat/rooms': '20/minute',
    'moderation/reports': '5/minute',
    'default': '100/minute'
}

# WebSocket rate limiting
WEBSOCKET_LIMITS = {
    'send_message': '30/minute',
    'typing_start': '60/minute',
    'join_room': '10/minute'
}
```

---

## Security & Privacy

### Privacy-First Architecture

#### Data Minimization Principles
1. **No PII Collection**: No email, phone, or real names required
2. **Temporary Identifiers**: Anonymous IDs rotate frequently
3. **Session-Based Data**: All data tied to temporary sessions
4. **Automatic Deletion**: Data auto-deleted after inactivity
5. **No Persistent Tracking**: No cross-session user tracking

#### Encryption Strategy
```
┌─────────────────┐    TLS 1.3     ┌─────────────────┐
│   Client App    │◄──────────────►│   Load Balancer │
└─────────────────┘                └─────────────────┘
                                            │
                                    TLS 1.3 │
                                            ▼
                                   ┌─────────────────┐
                                   │  FastAPI Server │
                                   └─────────────────┘
                                            │
                                    Encrypted │
                                            ▼
                                   ┌─────────────────┐
                                   │   PostgreSQL    │
                                   │  (Encrypted)    │
                                   └─────────────────┘

Message Encryption Flow:
1. Client encrypts message with AES-256
2. TLS 1.3 transport encryption
3. Server-side validation and moderation
4. Encrypted storage in database
5. Automatic deletion after 24 hours
```

#### Authentication & Authorization

```python
# JWT Token Structure
{
  "sub": "anonymous_user_id",
  "iat": timestamp,
  "exp": timestamp + 900,  # 15 minutes
  "session_id": "unique_session_identifier",
  "scope": ["chat:read", "chat:write", "user:profile"]
}

# Session Management
class SessionManager:
    def __init__(self):
        self.active_sessions = {}
        self.session_timeout = 900  # 15 minutes
    
    async def create_session(self, user_data: dict) -> str:
        session_id = secrets.token_urlsafe(32)
        session_data = {
            "user_id": user_data["id"],
            "anonymous_id": user_data["anonymous_id"],
            "created_at": datetime.utcnow(),
            "last_activity": datetime.utcnow(),
            "permissions": ["chat:read", "chat:write"]
        }
        
        # Store in Redis with TTL
        await redis.setex(
            f"session:{session_id}",
            self.session_timeout,
            json.dumps(session_data)
        )
        
        return session_id
    
    async def validate_session(self, session_id: str) -> Optional[dict]:
        session_data = await redis.get(f"session:{session_id}")
        if session_data:
            data = json.loads(session_data)
            # Extend session if activity is recent
            await redis.expire(f"session:{session_id}", self.session_timeout)
            return data
        return None
```

### Security Headers & Middleware

```python
# security_middleware.py
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "connect-src 'self' ws: wss:; "
            "img-src 'self' data: blob:; "
            "media-src 'self' blob:"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), "
            "payment=(), usb=(), magnetometer=(), gyroscope=()"
        )
        
        return response

# Rate limiting middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = period
        
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"
        
        current = await redis.get(key)
        if current is None:
            await redis.setex(key, self.period, 1)
        else:
            current = int(current)
            if current >= self.calls:
                return Response(
                    status_code=429,
                    content="Rate limit exceeded"
                )
            await redis.incr(key)
            
        response = await call_next(request)
        return response
```

### Input Validation & Sanitization

```python
# validation.py
from pydantic import BaseModel, validator, Field
from typing import Optional, List
import re

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    message_type: str = Field(default="text", regex="^(text|image|file|emoji)$")
    room_id: str = Field(..., regex="^[0-9a-f-]{36}$")
    
    @validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError('Content cannot be empty')
        
        # Remove potential XSS attempts
        v = re.sub(r'<[^>]*>', '', v)
        v = re.sub(r'javascript:', '', v, flags=re.IGNORECASE)
        v = re.sub(r'on\w+\s*=', '', v, flags=re.IGNORECASE)
        
        return v.strip()

class UserRegistration(BaseModel):
    nickname: str = Field(..., min_length=2, max_length=50)
    age_verified: bool = Field(...)
    preferences: Optional[dict] = None
    
    @validator('nickname')
    def validate_nickname(cls, v):
        if not re.match(r'^[a-zA-Z0-9_-]+, v):
            raise ValueError('Nickname can only contain letters, numbers, hyphens, and underscores')
        return v
    
    @validator('age_verified')
    def validate_age(cls, v):
        if not v:
            raise ValueError('Age verification is required')
        return v
```

---

## Moderation & Safety

### Multi-Layer Moderation System

#### Automated Content Filtering
```python
# Advanced moderation pipeline
class ContentModerationPipeline:
    def __init__(self):
        self.profanity_filter = ProfanityFilter()
        self.toxicity_model = ToxicityClassifier()
        self.spam_detector = SpamDetector()
        self.image_moderator = ImageModerator()
        
    async def moderate_content(self, content: dict) -> ModerationResult:
        """Multi-stage content moderation"""
        
        # Stage 1: Basic filtering
        basic_result = await self._basic_filtering(content)
        if not basic_result.is_safe:
            return basic_result
            
        # Stage 2: AI-powered analysis
        ai_result = await self._ai_analysis(content)
        if not ai_result.is_safe:
            return ai_result
            
        # Stage 3: Context-aware moderation
        context_result = await self._context_analysis(content)
        
        return self._combine_results([basic_result, ai_result, context_result])
    
    async def _basic_filtering(self, content: dict) -> ModerationResult:
        """Basic rule-based filtering"""
        text = content.get('text', '')
        
        # Check for explicit profanity
        profanity_score = self.profanity_filter.check(text)
        
        # Check for spam patterns
        spam_score = self.spam_detector.analyze(text)
        
        # Check for prohibited content
        prohibited_patterns = [
            r'\b(?:suicide|kill\s+myself|end\s+my\s+life)\b',
            r'\b(?:buy|sell|trade)\s+(?:drugs|weapons|illegal)\b',
            r'\b(?:hack|crack|pirate)\b.*\b(?:software|games|movies)\b'
        ]
        
        threat_score = 0
        for pattern in prohibited_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                threat_score = 1.0
                break
        
        max_score = max(profanity_score, spam_score, threat_score)
        
        return ModerationResult(
            is_safe=max_score < 0.6,
            confidence=max_score,
            reasons=self._categorize_violations(profanity_score, spam_score, threat_score),
            action=self._determine_action(max_score)
        )
    
    async def _ai_analysis(self, content: dict) -> ModerationResult:
        """AI-powered toxicity detection"""
        try:
            result = await self.toxicity_model.classify(content['text'])
            return ModerationResult(
                is_safe=result['toxicity'] < 0.7,
                confidence=result['toxicity'],
                reasons=['toxicity'] if result['toxicity'] >= 0.7 else [],
                action=self._determine_action(result['toxicity'])
            )
        except Exception as e:
            # Fallback to safe if AI service fails
            return ModerationResult(is_safe=True, confidence=0.0, reasons=[], action='allow')
    
    async def _context_analysis(self, content: dict) -> ModerationResult:
        """Context-aware moderation based on conversation history"""
        # Analyze conversation patterns
        # Check for escalating behavior
        # Consider user history and karma
        return ModerationResult(is_safe=True, confidence=0.0, reasons=[], action='allow')
```

#### Image Moderation
```python
# image_moderation.py
import boto3
from PIL import Image
import hashlib

class ImageModerator:
    def __init__(self):
        self.rekognition = boto3.client('rekognition')
        self.moderation_cache = {}
    
    async def moderate_image(self, image_data: bytes) -> ModerationResult:
        """Moderate image content using AWS Rekognition"""
        
        # Generate hash for caching
        image_hash = hashlib.md5(image_data).hexdigest()
        
        # Check cache first
        if image_hash in self.moderation_cache:
            return self.moderation_cache[image_hash]
        
        try:
            # Analyze image with AWS Rekognition
            response = self.rekognition.detect_moderation_labels(
                Image={'Bytes': image_data},
                MinConfidence=60.0
            )
            
            violations = []
            max_confidence = 0
            
            for label in response['ModerationLabels']:
                if label['Confidence'] > 70:
                    violations.append(label['Name'].lower())
                    max_confidence = max(max_confidence, label['Confidence'] / 100)
            
            result = ModerationResult(
                is_safe=len(violations) == 0,
                confidence=max_confidence,
                reasons=violations,
                action=self._determine_image_action(violations, max_confidence)
            )
            
            # Cache result
            self.moderation_cache[image_hash] = result
            
            return result
            
        except Exception as e:
            # Default to unsafe for images if moderation fails
            return ModerationResult(
                is_safe=False,
                confidence=1.0,
                reasons=['moderation_error'],
                action='block'
            )
    
    def _determine_image_action(self, violations: List[str], confidence: float) -> str:
        """Determine action based on image violations"""
        high_risk_categories = ['explicit_nudity', 'graphic_violence', 'drugs']
        
        if any(cat in violations for cat in high_risk_categories):
            return 'block_user'
        elif violations and confidence > 0.8:
            return 'filter_content'
        elif violations:
            return 'warn_user'
        else:
            return 'allow'
```

#### Human Moderator Interface
```python
# moderator_dashboard.py
from fastapi import APIRouter, Depends, HTTPException
from app.models.moderation import ModerationQueue, ModerationAction
from app.services.auth_service import require_moderator

moderator_router = APIRouter(prefix="/api/v1/moderator")

@moderator_router.get("/queue")
async def get_moderation_queue(
    priority: str = "all",
    limit: int = 20,
    moderator = Depends(require_moderator)
):
    """Get pending moderation items"""
    
    queue_items = await ModerationQueue.get_pending_items(
        priority=priority,
        limit=limit
    )
    
    return {
        "items": queue_items,
        "total_pending": await ModerationQueue.count_pending(),
        "high_priority": await ModerationQueue.count_by_priority("high")
    }

@moderator_router.post("/action/{item_id}")
async def take_moderation_action(
    item_id: str,
    action: ModerationAction,
    moderator = Depends(require_moderator)
):
    """Take action on a moderation item"""
    
    result = await ModerationService.execute_action(
        item_id=item_id,
        action=action.action_type,
        reason=action.reason,
        moderator_id=moderator.id,
        notes=action.notes
    )
    
    if action.action_type == "ban_user":
        await NotificationService.notify_user_banned(
            user_id=result.target_user_id,
            reason=action.reason
        )
    
    return {"message": "Action completed successfully", "result": result}

@moderator_router.get("/analytics")
async def get_moderation_analytics(moderator = Depends(require_moderator)):
    """Get moderation analytics and metrics"""
    
    return {
        "daily_reports": await ModerationAnalytics.get_daily_report_count(),
        "resolution_time": await ModerationAnalytics.get_avg_resolution_time(),
        "violation_types": await ModerationAnalytics.get_violation_breakdown(),
        "moderator_performance": await ModerationAnalytics.get_moderator_metrics(),
        "user_safety_score": await ModerationAnalytics.calculate_safety_score()
    }
```

### Community Safety Features

#### User Reporting System
```tsx
// ReportUserDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Alert
} from '@mui/material';

interface ReportUserDialogProps {
  open: boolean;
  onClose: () => void;
  targetUserId: string;
  targetNickname: string;
}

const REPORT_REASONS = [
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'threats', label: 'Threats or violence' },
  { value: 'underage', label: 'Underage user' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Other (please describe)' }
];

const ReportUserDialog: React.FC<ReportUserDialogProps> = ({
  open,
  onClose,
  targetUserId,
  targetNickname
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      await fetch('/api/v1/moderation/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reported_user_id: targetUserId,
          reason: selectedReason,
          description: description.trim()
        })
      });

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setSelectedReason('');
        setDescription('');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Report User: {targetNickname}</DialogTitle>
      <DialogContent>
        {submitted ? (
          <Alert severity="success">
            Thank you for your report. Our moderation team will review it shortly.
          </Alert>
        ) : (
          <>
            <RadioGroup
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
            >
              {REPORT_REASONS.map((reason) => (
                <FormControlLabel
                  key={reason.value}
                  value={reason.value}
                  control={<Radio />}
                  label={reason.label}
                />
              ))}
            </RadioGroup>

            {(selectedReason === 'other' || selectedReason === 'harassment') && (
              <TextField
                fullWidth
                multiline
                rows={3}
                margin="normal"
                label="Additional details (optional)"
                placeholder="Please provide more details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                inputProps={{ maxLength: 500 }}
              />
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedReason || isSubmitting || submitted}
          variant="contained"
          color="error"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportUserDialog;
```

#### Safety Guidelines
```python
# Community guidelines and safety features
COMMUNITY_GUIDELINES = {
    "respect": {
        "title": "Treat others with respect",
        "description": "Be kind, considerate, and respectful to all users",
        "examples": [
            "Use appropriate language",
            "Respect different opinions and perspectives",
            "No harassment, bullying, or personal attacks"
        ],
        "violations": ["harassment", "bullying", "hate_speech"]
    },
    "privacy": {
        "title": "Protect privacy and anonymity",
        "description": "Respect the anonymous nature of the platform",
        "examples": [
            "Don't ask for or share personal information",
            "Don't attempt to identify other users",
            "Respect others' decision to remain anonymous"
        ],
        "violations": ["doxxing", "privacy_violation", "personal_info_sharing"]
    },
    "appropriate_content": {
        "title": "Keep content appropriate",
        "description": "Share content suitable for all adult users",
        "examples": [
            "No explicit sexual content",
            "No graphic violence or disturbing content",
            "No illegal activities or substances"
        ],
        "violations": ["explicit_content", "violence", "illegal_activity"]
    },
    "no_spam": {
        "title": "No spam or advertising",
        "description": "Keep conversations genuine and meaningful",
        "examples": [
            "Don't send repetitive messages",
            "No commercial advertising",
            "No links to external sites (unless relevant)"
        ],
        "violations": ["spam", "advertising", "repetitive_content"]
    },
    "safety": {
        "title": "Prioritize safety",
        "description": "Help maintain a safe environment for everyone",
        "examples": [
            "Report inappropriate behavior",
            "Block users who make you uncomfortable",
            "Don't engage with suspicious or harmful content"
        ],
        "violations": ["threats", "self_harm", "dangerous_behavior"]
    }
}

class SafetyCenter:
    @staticmethod
    async def get_safety_tips() -> List[dict]:
        return [
            {
                "title": "Trust Your Instincts",
                "description": "If something feels wrong, it probably is. Don't hesitate to end a conversation or block a user.",
                "icon": "warning"
            },
            {
                "title": "Keep It Anonymous",
                "description": "Never share personal information like your real name, location, phone number, or social media profiles.",
                "icon": "privacy"
            },
            {
                "title": "Report Bad Behavior",
                "description": "Help keep the community safe by reporting users who violate guidelines.",
                "icon": "report"
            },
            {
                "title": "Use Block Liberally",
                "description": "Don't feel bad about blocking users. It's better to be safe than sorry.",
                "icon": "block"
            },
            {
                "title": "Avoid External Links",
                "description": "Be cautious of users asking you to visit external websites or download files.",
                "icon": "link"
            }
        ]
    
    @staticmethod
    async def get_crisis_resources() -> List[dict]:
        return [
            {
                "title": "National Suicide Prevention Lifeline",
                "contact": "988",
                "description": "24/7 free and confidential support"
            },
            {
                "title": "Crisis Text Line",
                "contact": "Text HOME to 741741",
                "description": "24/7 crisis support via text message"
            },
            {
                "title": "RAINN National Sexual Assault Hotline",
                "contact": "1-800-656-4673",
                "description": "24/7 support for sexual assault survivors"
            }
        ]
```

---

## Deployment Strategy

### Infrastructure Architecture

#### Production Environment
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/chatapp
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
    depends_on:
      - db
      - redis
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.50'
          memory: 512M

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - REACT_APP_API_URL=https://api.yourdomain.com
      - REACT_APP_WS_URL=wss://api.yourdomain.com

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=chatapp
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          cpus: '0.25'
          memory: 256M

  monitoring:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

#### Nginx Configuration
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        least_conn;
        server backend_1:8000;
        server backend_2:8000;
        server backend_3:8000;
    }

    upstream websocket {
        ip_hash;  # Sticky sessions for WebSocket
        server backend_1:8000;
        server backend_2:8000;
        server backend_3:8000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=websocket:10m rate=5r/s;

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
        add_header X-XSS-Protection "1; mode=block";

        # Frontend
        location / {
            proxy_pass http://frontend:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket
        location /ws/ {
            limit_req zone=websocket burst=10 nodelay;
            proxy_pass http://websocket;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 86400;
        }
    }
}
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install backend dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    
    - name: Run backend tests
      run: |
        cd backend
        pytest tests/ -v --cov=app --cov-report=xml
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm run test:ci
    
    - name: Build frontend
      run: |
        cd frontend
        npm run build

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run security scan
      uses: securecodewarrior/github-action-add-sarif@v1
      with:
        sarif-file: 'security-scan-results.sarif'

  deploy:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        echo "Deploying to production server..."
        # Add deployment commands here
```

### Monitoring & Observability

#### Prometheus Metrics
```python
# metrics.py
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

# Metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency')
ACTIVE_CONNECTIONS = Gauge('websocket_connections_active', 'Active WebSocket connections')
MESSAGES_SENT = Counter('messages_sent_total', 'Total messages sent')
MODERATION_ACTIONS = Counter('moderation_actions_total', 'Total moderation actions', ['action_type'])
USER_REGISTRATIONS = Counter('user_registrations_total', 'Total user registrations')

class MetricsMiddleware:
    def __init__(self, app):
        self.app = app
        
    async def __call__(self, scope, receive, send):
        if scope['type'] == 'http':
            start_time = time.time()
            
            # Process request
            await self.app(scope, receive, send)
            
            # Record metrics
            duration = time.time() - start_time
            REQUEST_LATENCY.observe(duration)
            REQUEST_COUNT.labels(
                method=scope['method'],
                endpoint=scope['path'],
                status=200  # You'd get actual status from response
            ).inc()
        else:
            await self.app(scope, receive, send)

# Start metrics server
start_http_server(8001)
```

#### Logging Configuration
```python
# logging_config.py
import logging
import sys
from logging.handlers import RotatingFileHandler
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
            
        return json.dumps(log_entry)

def setup_logging():
    # Create formatters
    json_formatter = JSONFormatter()
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create handlers
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)
    
    file_handler = RotatingFileHandler(
        'logs/app.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(json_formatter)
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        handlers=[console_handler, file_handler]
    )
    
    # Configure specific loggers
    logging.getLogger('uvicorn').setLevel(logging.WARNING)
    logging.getLogger('websockets').setLevel(logging.WARNING)

setup_logging()
logger = logging.getLogger(__name__)
```

### Scaling Strategy

#### Horizontal Scaling Plan
```python
# Auto-scaling configuration
SCALING_RULES = {
    "backend_instances": {
        "min_replicas": 2,
        "max_replicas": 10,
        "target_cpu_utilization": 70,
        "target_memory_utilization": 80,
        "scale_up_threshold": {
            "cpu": 80,
            "memory": 85,
            "connections": 1000
        },
        "scale_down_threshold": {
            "cpu": 30,
            "memory": 40,
            "connections": 200
        }
    },
    "database_scaling": {
        "read_replicas": {
            "min": 1,
            "max": 3,
            "connection_threshold": 80
        },
        "connection_pooling": {
            "min_connections": 5,
            "max_connections": 20
        }
    },
    "redis_scaling": {
        "cluster_nodes": 3,
        "memory_threshold": 80,
        "connection_threshold": 1000
    }
}
```

This completes the comprehensive documentation for your anonymous chat application. The documentation covers all aspects from project discovery to deployment, providing you with a complete blueprint for building the application using React + TypeScript, FastAPI, PostgreSQL, and Material-UI.

The documentation includes:
- Market research and competitive analysis
- Detailed functional and technical requirements
- Complete system architecture with microservices design
- Database schemas and API specifications
- Frontend component architecture with TypeScript
- Security and privacy implementation details
- Multi-layer content moderation system
- Comprehensive deployment and monitoring strategy

You can use this documentation with Claude Code to systematically build your anonymous chat application. The documentation provides:

1. **Clear technical specifications** for the React + TypeScript + FastAPI + PostgreSQL stack
2. **Detailed code examples** and implementation patterns
3. **Security-first approach** with privacy protection measures
4. **Scalable architecture** designed for growth
5. **Production-ready deployment** configuration

Next steps for development:
1. Set up the development environment using the provided Docker configurations
2. Implement the core backend APIs following the FastAPI patterns shown
3. Build the React frontend components using the TypeScript interfaces
4. Integrate the WebSocket real-time messaging system
5. Implement the content moderation pipeline
6. Set up monitoring and deploy to production

The documentation serves as a comprehensive blueprint that covers all aspects needed to build a professional, secure, and scalable anonymous chat application.