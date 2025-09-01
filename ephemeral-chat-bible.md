# Ultra-Ephemeral Anonymous Chat - Development Bible v1.0

## Executive Summary

**Project Name**: Ultra-Ephemeral Anonymous Chat  
**Core Mission**: Create a communication platform where users exist without digital traces, maintaining complete anonymity and absolute control over their data lifecycle.  
**Development Phase**: MVP (4-6 weeks)  
**Architecture**: Redis-only backend with FastAPI, React frontend  
**Key Innovation**: Technical impossibility of surveillance through aggressive data destruction

---

## Core Principles (Never Compromise These)

1. **No Personal Information Ever**: Never collect emails, phones, names, or any identifying information
2. **Automatic Destruction**: All data must have TTL and auto-destruct
3. **Anonymous by Design**: Users are "ghosts" with cryptographically secure temporary IDs
4. **User Sovereignty**: Users can destroy all their data instantly at any time
5. **No Tracking Possible**: Architecture prevents tracking, not policy

---

## MVP Technical Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Storage**: Redis 7+ (ONLY - no persistent database)
- **Real-time**: Native WebSocket
- **Deployment**: Docker containers

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand (lightweight)
- **Styling**: Tailwind CSS
- **WebSocket Client**: Native WebSocket API

### DevOps
- **Containerization**: Docker & Docker Compose
- **Development**: Hot reload for both frontend/backend
- **Production**: Single container deployment initially

---

## Data Architecture

### Redis Key Structure
```
users:{ghost_id}                 -> User session data (TTL: 15 minutes)
messages:{room_id}:{timestamp}   -> Message data (TTL: 24 hours)
rooms:{room_id}                  -> Room metadata (TTL: 24 hours)
active_users                     -> Set of active ghost IDs (TTL: 24 hours)
room_members:{room_id}           -> Set of room participants (TTL: 24 hours)
```

### Data TTL Rules
- **Active Session**: 15 minutes (resets on activity)
- **Idle Grace Period**: 1-2 hours after last activity
- **Messages**: 24 hours maximum
- **Rooms**: 24 hours or until empty
- **Everything on Logout**: Immediate destruction

---

## MVP Features (Priority Order)

### Phase 1: Core Infrastructure (Week 1-2)

#### 1. Anonymous Identity System
```python
# Implementation Requirements:
- Generate ghost_TIMESTAMP_RANDOM identifiers
- No persistence between sessions
- Visual representation (color/avatar from ID hash)
- Display format: "Ghost#1234" (last 4 chars of ID)
```

#### 2. WebSocket Connection Manager
```python
# Core Functions:
- Handle connect/disconnect with automatic cleanup
- Maintain connection pool in memory
- Heartbeat/ping-pong for connection health
- Automatic reconnection logic on frontend
```

#### 3. Redis Data Manager
```python
# Essential Operations:
- Set all data with TTL
- Atomic operations for consistency
- Pipeline for batch operations
- Automatic cleanup of expired keys
```

### Phase 2: Messaging System (Week 2-3)

#### 4. Basic Message Send/Receive
```python
# Message Structure:
{
    "id": "msg_timestamp_random",
    "sender": "ghost_id",
    "content": "text",
    "room_id": "room_id",
    "timestamp": "ISO-8601",
    "ttl": 86400  # 24 hours in seconds
}
```

#### 5. Room Creation and Management
```python
# Room Structure:
{
    "id": "room_timestamp_random",
    "name": "optional_name",
    "created_by": "ghost_id",
    "created_at": "ISO-8601",
    "participant_count": 0,
    "heat_level": 0.5,  # 0-1 scale
    "ttl": 86400
}
```

#### 6. Real-time Message Broadcasting
- WebSocket message distribution to room participants
- Optimistic UI updates on frontend
- Message delivery confirmation
- Connection state management

### Phase 3: Privacy Features (Week 3-4)

#### 7. Data Destruction Engine
```python
# Destruction Triggers:
- User logout (immediate)
- Session timeout (15 minutes)
- Manual destruction command
- Room emptiness detection
```

#### 8. Activity Monitoring
```python
# Track Without Storing:
- Last activity timestamp
- Active/idle state detection
- Grace period management
- Auto-logout on extended idle
```

#### 9. Simple Proof-of-Work
```python
# Anti-Spam Implementation:
- SHA-256 challenge generation
- Difficulty: 4 leading zeros initially
- Client-side computation
- Server-side verification
```

### Phase 4: User Interface (Week 4-5)

#### 10. Essential Pages
1. **Landing Page** (`/`)
   - Platform explanation
   - "Enter Anonymously" button
   - Active ghosts counter

2. **Main Chat** (`/chat`)
   - Room list (left sidebar)
   - Message area (center)
   - Participants list (right sidebar)
   - Self-destruct button (header)

3. **Privacy Controls** (`/privacy`)
   - Session timer display
   - Destruction controls
   - Data footprint indicator

#### 11. Core UI Components
```typescript
// Required Components:
- GhostIdentity: Display current ghost ID and avatar
- DestructionTimer: Countdown to auto-destruction
- MessageList: Ephemeral message display
- RoomCard: Room preview with heat indicator
- SelfDestructButton: Prominent destruction control
```

#### 12. Anti-Screenshot Protection (Basic)
```javascript
// Basic Protection Measures:
- Disable right-click context menu
- Prevent text selection on messages
- Block print screen (where possible)
- Detect developer tools opening
```

### Phase 5: Polish & Stabilization (Week 5-6)

#### 13. Error Handling & Recovery
- WebSocket reconnection logic
- Redis connection pooling
- Graceful degradation
- User-friendly error messages

#### 14. Performance Optimization
- Message pagination/virtualization
- Lazy loading for rooms
- Redis pipelining
- Frontend bundle optimization

#### 15. Basic Analytics (Privacy-Preserving)
```python
# Anonymous Metrics Only:
- Total active ghosts count
- Messages per hour (aggregate)
- Room creation rate
- Average session duration (anonymous)
```

---

## Critical Implementation Details

### Ghost ID Generation
```python
import secrets
import time

def generate_ghost_id() -> str:
    timestamp = int(time.time() * 1000)
    random_component = secrets.token_hex(8)
    return f"ghost_{timestamp}_{random_component}"
```

### Message Handling with TTL
```python
async def send_message(ghost_id: str, room_id: str, content: str):
    message_id = f"msg_{int(time.time()*1000)}_{secrets.token_hex(4)}"
    message_data = {
        "id": message_id,
        "sender": ghost_id,
        "content": content,
        "room_id": room_id,
        "timestamp": datetime.now().isoformat()
    }
    
    # Store with 24-hour TTL
    await redis.setex(
        f"messages:{room_id}:{message_id}",
        86400,  # 24 hours
        json.dumps(message_data)
    )
    
    # Broadcast to room participants
    await broadcast_to_room(room_id, message_data)
```

### User Destruction
```python
async def destroy_user_completely(ghost_id: str):
    # Get all user's data keys
    user_keys = await redis.keys(f"*{ghost_id}*")
    
    # Delete all keys atomically
    if user_keys:
        await redis.delete(*user_keys)
    
    # Remove from active users
    await redis.srem("active_users", ghost_id)
    
    # Close WebSocket connection
    await close_user_connection(ghost_id)
```

### Frontend WebSocket Manager
```typescript
class EphemeralWebSocket {
    private ws: WebSocket | null = null;
    private ghostId: string;
    private reconnectAttempts = 0;
    
    constructor() {
        this.ghostId = this.generateGhostId();
        this.connect();
    }
    
    private connect() {
        this.ws = new WebSocket(`ws://localhost:8000/ws/${this.ghostId}`);
        
        this.ws.onopen = () => {
            console.log('Connected as:', this.ghostId);
            this.reconnectAttempts = 0;
            this.startDestructionTimer();
        };
        
        this.ws.onclose = () => {
            this.handleDisconnection();
        };
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        this.ws.onmessage = (event) => {
            this.handleMessage(JSON.parse(event.data));
        };
    }
    
    private startDestructionTimer() {
        setTimeout(() => {
            this.destroy();
        }, 15 * 60 * 1000); // 15 minutes
    }
    
    public destroy() {
        if (this.ws) {
            this.ws.close();
        }
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/farewell';
    }
}
```

---

## Development Workflow

### Local Development Setup
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install fastapi uvicorn redis websockets
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev

# Redis
docker run -p 6379:6379 redis:7-alpine
```

### Docker Development
```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_WS_URL=ws://localhost:8000
```

---

## File Structure

```
ephemeral-chat/
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── websocket_manager.py    # WebSocket handling
│   ├── redis_manager.py        # Redis operations
│   ├── ghost_identity.py       # Identity management
│   ├── destruction_engine.py   # Data destruction logic
│   ├── proof_of_work.py        # Anti-spam system
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Chat.tsx
│   │   │   └── Privacy.tsx
│   │   ├── components/
│   │   │   ├── GhostIdentity.tsx
│   │   │   ├── DestructionTimer.tsx
│   │   │   ├── MessageList.tsx
│   │   │   └── SelfDestructButton.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   └── useDestruction.ts
│   │   └── utils/
│   │       ├── ghostId.ts
│   │       └── proofOfWork.ts
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

---

## Testing Strategy

### Unit Tests (Week 5)
- Ghost ID generation uniqueness
- TTL enforcement on all Redis operations
- Message broadcasting logic
- Destruction completeness

### Integration Tests (Week 5-6)
- WebSocket connection lifecycle
- User session management
- Room creation and destruction
- Full user journey test

### Security Tests (Week 6)
- Proof-of-work validation
- Anti-screenshot measures
- Data destruction verification
- Anonymous identity unlinkability

---

## Deployment Checklist

### Pre-Deployment
- [ ] All data has TTL configured
- [ ] Destruction endpoints tested
- [ ] WebSocket reconnection working
- [ ] Redis memory limits configured
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Error logging configured

### Production Configuration
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    image: ephemeral-chat:latest
    ports:
      - "80:80"
    environment:
      - REDIS_URL=redis://redis:6379
      - ENVIRONMENT=production
      - MAX_CONNECTIONS=1000
      - MESSAGE_TTL=86400
      - SESSION_TTL=900
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure
        max_attempts: 3
```

---

## Success Metrics

### Technical KPIs
- Sub-100ms message delivery
- 100% data destruction on logout
- Zero data persisting beyond TTL
- <1% WebSocket disconnection rate

### User Experience KPIs
- <3 second page load
- <500ms UI response time
- Zero personal data collection
- 100% anonymous interactions

---

## Non-Negotiable Rules

1. **Never store data without TTL**
2. **Never collect personal information**
3. **Always destroy on user logout**
4. **No data survives beyond 24 hours**
5. **Ghost IDs are never linkable**
6. **Destruction is always irreversible**
7. **Privacy over features always**
8. **Anonymous by default, always**

---

## Quick Reference Commands

```bash
# Start development
docker-compose -f docker-compose.dev.yml up

# Run tests
pytest backend/tests/
npm test

# Build for production
docker build -t ephemeral-chat .

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Monitor Redis
redis-cli MONITOR

# Check Redis memory
redis-cli INFO memory

# Destroy all data (emergency)
redis-cli FLUSHALL
```

---

## Next Steps After MVP

1. Behavioral thermodynamics (heat/entropy)
2. Advanced trust network
3. Phantom mode (read-once messages)
4. Onion routing integration
5. Mobile PWA optimization
6. Cryptographic erasure proofs
7. Decentralized architecture

---

**Remember**: This platform proves that meaningful digital communication can exist without surveillance capitalism. Every line of code should reinforce user sovereignty and radical privacy.