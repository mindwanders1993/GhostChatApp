# Ultra-Ephemeral Anonymous Chat MVP

A privacy-focused anonymous chat application with aggressive data destruction, built according to the ephemeral chat bible specifications.

## 🔒 Privacy Features

- **15-minute sessions** - Your identity self-destructs automatically
- **24-hour messages** - All conversations vanish completely  
- **No personal data** - Zero email, phone, or tracking required
- **Anonymous by design** - Cryptographically secure temporary IDs
- **Instant self-destruct** - Users can destroy all data immediately
- **Redis-only storage** - No persistent database, automatic TTL

## 🚀 Tech Stack

### Backend
- **Framework**: FastAPI with native WebSocket support
- **Storage**: Redis 7+ (ONLY - no persistent database)
- **Language**: Python 3.11+
- **Real-time**: Native WebSocket connections

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Zustand (lightweight)
- **Styling**: Tailwind CSS
- **Build Tool**: Create React App

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Development**: Hot reload for both frontend/backend
- **Production**: Optimized multi-stage builds

## Quick Start

### Development

```bash
# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Redis: localhost:6379
```

### Production

```bash
# Deploy to production
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🏗️ Architecture

- **Backend**: FastAPI with WebSocket support, Redis-only storage
- **Frontend**: React 18+ with TypeScript, Zustand state management, Tailwind CSS
- **Real-time**: Native WebSocket connections with auto-reconnection
- **Security**: Proof-of-work anti-spam, session-based authentication
- **Data**: All data expires automatically, no persistent storage

## 📁 Project Structure

```
├── backend/                 # FastAPI backend
│   ├── main.py             # Application entry point
│   ├── ghost_identity.py   # Anonymous identity management
│   ├── redis_manager.py    # Redis operations with TTL
│   ├── websocket_manager.py # WebSocket connection handling
│   ├── destruction_engine.py # Data destruction engine
│   ├── proof_of_work.py    # Anti-spam system
│   └── requirements.txt    # Python dependencies
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks (WebSocket)
│   │   ├── pages/          # Landing and Chat pages
│   │   ├── store/          # Zustand state management
│   │   ├── types/          # TypeScript definitions
│   │   └── App.tsx         # Main application
│   └── package.json        # Node.js dependencies
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
└── ephemeral-chat-bible.md # Original specification
```

## 🔧 API Endpoints

- `POST /api/ghost` - Create anonymous ghost identity
- `POST /api/ghost/{ghost_id}/destroy` - Destroy ghost completely
- `GET /api/stats` - Get platform statistics
- `GET /api/health` - Health check
- `WS /ws/{ghost_id}` - WebSocket connection

## 📱 WebSocket Events

**Client → Server:**
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room  
- `send_message` - Send message to room
- `create_room` - Create new room
- `typing` - Send typing indicator

**Server → Client:**
- `room_joined` - Room join confirmation
- `new_message` - New message in room
- `ghost_joined/left` - User join/leave notifications
- `typing_indicator` - Typing status updates

## ⚡ Key Features Implemented

✅ **Ghost Identity System** - Cryptographically secure anonymous IDs  
✅ **Redis TTL Management** - All data auto-expires  
✅ **WebSocket Real-time** - Instant messaging with auto-reconnection  
✅ **Data Destruction** - Complete user data elimination  
✅ **Proof-of-Work** - SHA-256 based anti-spam system  
✅ **Session Management** - 15-minute automatic logout  
✅ **Room System** - Dynamic chat room creation/joining  
✅ **UI Components** - Ghost identity, destruction timer, self-destruct button  
✅ **Docker Environment** - Full containerization for dev/prod  

## 🛡️ Security Measures

- No persistent database (Redis-only with TTL)
- Automatic session expiration (15 minutes)
- Message auto-deletion (24 hours maximum)
- Anonymous identity generation
- Proof-of-work challenge system
- Client-side anti-screenshot protection
- Complete data destruction on demand

## 🚨 Privacy Warnings

- This is an experimental platform designed for maximum privacy
- All data is automatically destroyed - there is no recovery
- While built for anonymity, never share sensitive personal information
- Client-side protections can be bypassed by determined actors

## 📋 Pending Tasks

The following features are outlined in the ephemeral chat bible but not yet implemented:

- Comprehensive test suite
- Advanced content moderation
- Mobile PWA optimization  
- End-to-end encryption
- Onion routing integration
- Behavioral thermodynamics (heat/entropy system)

## 🔬 Development Commands

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend  
cd frontend
npm install
npm start

# Redis
docker run -p 6379:6379 redis:7-alpine
```

---

**⚠️ Remember**: This platform proves that meaningful digital communication can exist without surveillance capitalism. Every interaction reinforces user sovereignty and radical privacy.