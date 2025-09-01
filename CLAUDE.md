# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GhostChatApp is an ultra-ephemeral anonymous chat application with aggressive data destruction. Built with React/TypeScript frontend, FastAPI backend, and Redis-only storage (no persistent database). The application emphasizes radical privacy with 15-minute sessions and 24-hour message auto-deletion.

## Development Commands

### Frontend (React/TypeScript + Vite)
```bash
cd frontend
npm install                    # Install dependencies
npm run dev                    # Development server (http://localhost:3000)
npm run build                  # Production build
npm run test                   # Run tests with Vitest
npm run test:ui                # Run tests with UI
npm run lint                   # ESLint check
```

### Backend (FastAPI/Python)
```bash
cd backend
pip install -r requirements.txt    # Install dependencies
uvicorn main:app --reload          # Development server (http://localhost:8000)
pytest                            # Run all tests
pytest -v --cov=.                 # Run tests with coverage
pytest -m unit                    # Run unit tests only
pytest -m integration             # Run integration tests only
pytest -m websocket               # Run WebSocket tests only
```

### Docker Development (Recommended)
```bash
docker-compose up --build         # Start all services (Redis + Backend + Frontend)
docker-compose down               # Stop all services
docker-compose logs backend       # View backend logs
docker-compose logs frontend      # View frontend logs
```

### Production Deployment
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## Architecture Overview

### Core Philosophy
- **Privacy-First**: No persistent database, all data in Redis with TTL
- **Ephemeral**: 15-minute sessions, 24-hour message lifespan
- **Anonymous**: Cryptographically secure ghost identities
- **Real-time**: Native WebSocket connections with heartbeat

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Zustand + Tailwind CSS
- **Backend**: FastAPI + Python 3.11 + Native WebSockets
- **Storage**: Redis 7+ ONLY (no PostgreSQL or persistent DB)
- **Real-time**: WebSocket connections with automatic reconnection
- **Authentication**: Session-based with cryptographic ghost IDs

### Key Backend Components
- **main.py**: FastAPI application entry point with WebSocket endpoints
- **ghost_identity.py**: Anonymous identity generation and management
- **redis_manager.py**: Redis operations with TTL management
- **websocket_manager.py**: WebSocket connection and room management
- **destruction_engine.py**: Automated data cleanup and destruction
- **proof_of_work.py**: Anti-spam system using SHA-256 challenges

### Frontend Architecture
- **State Management**: Zustand (lightweight alternative to Redux)
- **Routing**: React Router for SPA navigation
- **Styling**: Tailwind CSS with modern chat UI components
- **WebSocket**: Custom hook with auto-reconnection and error handling
- **Components**: Feature-based organization (Ghost Identity, Chat, Rooms)

## Project Structure

```
├── backend/                    # FastAPI backend
│   ├── main.py                # Application entry point + API routes
│   ├── ghost_identity.py      # Anonymous identity management
│   ├── redis_manager.py       # Redis operations with TTL
│   ├── websocket_manager.py   # WebSocket connection handling
│   ├── destruction_engine.py  # Data destruction engine
│   ├── proof_of_work.py       # Anti-spam system
│   ├── requirements.txt       # Python dependencies
│   ├── pytest.ini            # Test configuration
│   └── tests/                 # Test suite
├── frontend/                  # React TypeScript frontend
│   ├── src/
│   │   ├── components/        # UI components (Ghost, Chat, Timer)
│   │   ├── hooks/            # Custom hooks (useWebSocket)
│   │   ├── pages/            # Landing, Chat, Rooms pages
│   │   ├── store/            # Zustand state management
│   │   ├── types/            # TypeScript type definitions
│   │   ├── __tests__/        # Frontend tests
│   │   └── App.tsx           # Main application component
│   ├── package.json          # Node.js dependencies
│   └── vite.config.ts        # Vite configuration
├── docker-compose.yml        # Development environment
├── docker-compose.prod.yml   # Production environment
└── ephemeral-chat-bible.md   # Original specification
```

## Key Implementation Details

### Redis-Only Data Storage
- **No Persistent Database**: All data stored in Redis with automatic TTL
- **Session TTL**: 15 minutes (900 seconds)
- **Message TTL**: 24 hours (86400 seconds)
- **Automatic Cleanup**: Destruction engine runs periodic cleanup
- **Memory Management**: 256MB Redis limit with LRU eviction

### Anonymous Ghost Identity System
- **Cryptographic IDs**: Secure random generation with timestamp
- **Custom Names**: Users can set display names (Alice, Bob)
- **Session Binding**: Ghost identity tied to Redis session
- **No PII**: Zero personal information stored or required

### WebSocket Real-time Architecture
- **Native WebSocket**: FastAPI native WebSocket support (not Socket.io)
- **Room-based Messaging**: Dynamic room creation and joining
- **Heartbeat System**: 30-second heartbeat with auto-reconnection
- **Connection Management**: Centralized WebSocket connection handling
- **Event Types**: join_room, send_message, typing, create_room, etc.

### Private Messaging System
- **Room-based Architecture**: Private chats as special 2-person rooms
- **Consistent Privacy**: Same 24h TTL as public rooms
- **API Endpoints**: `/api/ghost/{ghost_id}/private-room` for creation
- **Duplicate Prevention**: Returns existing room if already exists

### Modern Chat UI/UX
- **WhatsApp-style Bubbles**: Modern rounded message bubbles
- **Animated Typing Indicators**: Bouncing dots animation
- **Avatar System**: Consistent color-coded user avatars
- **Circular Send Button**: Modern paper plane icon
- **Tabbed Sidebar**: Public Rooms / Private Chats switching

## API Endpoints

### Core Endpoints
- `POST /api/ghost` - Create anonymous ghost identity with custom name
- `GET /api/stats` - Get platform statistics (active ghosts, rooms)
- `GET /api/health` - Health check endpoint
- `POST /api/ghost/{ghost_id}/destroy` - Complete data destruction
- `WS /ws/{ghost_id}` - WebSocket connection for real-time chat

### Private Messaging Endpoints
- `POST /api/ghost/{ghost_id}/private-room` - Create/get private room
- `GET /api/ghost/{ghost_id}/private-rooms` - List user's private conversations

### Data Management Endpoints
- `POST /api/ghost/{ghost_id}/delete-room-data/{room_id}` - Delete user messages from room
- `GET /api/ghost/{ghost_id}/room-data/{room_id}` - Get user message count

## WebSocket Event System

**Client → Server:**
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send message to room
- `create_room` - Create new room
- `typing` - Send typing indicator
- `list_rooms` - Request room list
- `ping` - Heartbeat ping

**Server → Client:**
- `connection_established` - Initial connection with ghost data
- `room_joined` - Room join confirmation with members and messages
- `room_left` - Room leave confirmation
- `new_message` - New message in room with sender display name
- `ghost_joined/ghost_left` - User join/leave notifications with display names
- `typing_indicator` - Typing status with user display name
- `room_created` - New room created confirmation
- `room_list` - Available rooms with metadata
- `heartbeat` - Server heartbeat
- `pong` - Response to ping
- `stats_update` - Platform statistics update
- `error` - Error message

## Testing Strategy

### Backend Testing (pytest)
- **Unit Tests**: Individual service and utility testing
- **Integration Tests**: API endpoint testing with Redis
- **WebSocket Tests**: Real-time communication testing
- **Markers**: Use `pytest -m unit`, `pytest -m integration`, `pytest -m websocket`

### Frontend Testing (Vitest)
- **Component Tests**: React component testing
- **Hook Tests**: Custom hooks testing (useWebSocket)
- **State Tests**: Zustand store testing
- **Type Tests**: TypeScript compilation tests

## Security and Privacy

### Data Destruction
- **Automatic TTL**: All Redis keys expire automatically
- **Manual Destruction**: Complete user data elimination on demand
- **No Persistent Storage**: Zero data survives Redis restart
- **Session Cleanup**: Orphaned sessions automatically removed

### Anti-Spam Measures
- **Proof-of-Work**: SHA-256 challenges for rate limiting
- **Connection Limits**: Max 100 concurrent connections
- **Message Validation**: Content length and format validation

### Privacy Protection
- **Anonymous by Design**: No email, phone, or tracking required
- **Session-based Auth**: No persistent user accounts
- **Cryptographic IDs**: Secure random ghost identity generation
- **Memory-only Storage**: All data in Redis RAM, no disk persistence

## Environment Configuration

### Development Environment Variables
```bash
REDIS_URL=redis://redis:6379
ENVIRONMENT=development
MAX_CONNECTIONS=100
MESSAGE_TTL=86400    # 24 hours
SESSION_TTL=900      # 15 minutes
```

### Frontend Environment Variables
```bash
VITE_WS_URL=ws://backend:8000    # WebSocket URL
VITE_API_URL=http://backend:8000 # API base URL
```

## Common Development Patterns

### Adding New WebSocket Events
1. Define event handling in `websocket_manager.py` `handle_message()`
2. Add client-side handling in `frontend/src/hooks/useWebSocket.ts`
3. Update TypeScript types in `frontend/src/types/index.ts`
4. Test WebSocket functionality with pytest markers

### Adding New API Endpoints
1. Add route function in `backend/main.py`
2. Add Redis operations in `redis_manager.py` if needed
3. Write tests in `backend/tests/`
4. Update frontend API calls if needed

### State Management Updates
1. Update Zustand store in `frontend/src/store/chatStore.ts`
2. Add TypeScript types in `frontend/src/types/index.ts`
3. Update components to use new state
4. Write tests for state changes

## Default Rooms

The application automatically creates these default public rooms:
- 🍿 Lounge - General chat and casual conversations
- 💻 Tech Talk - Programming and technology discussions
- 🎮 Gaming Zone - Gaming discussions and finding gaming buddies
- 🎬 Movies & TV - Entertainment discussions and recommendations
- 🎵 Music Corner - Music sharing and concert discussions
- 📚 Books & Literature - Book recommendations and literary conversations
- 🌍 Travel Stories - Travel experiences and destination advice
- 💪 Fitness & Health - Health, wellness and fitness discussions
- 🎨 Creative Corner - Art, design, and creative endeavors
- 🤔 Deep Thoughts - Philosophy and meaningful conversations
- ☕ Coffee Break - Work stories and casual banter
- 🔮 Random Chat - Completely random topics and fun conversations

## Important Notes

- **Data Recovery**: There is NO data recovery - all destruction is permanent
- **Session Management**: Users automatically log out after 15 minutes of inactivity
- **Memory Limits**: Redis configured with 256MB limit and LRU eviction
- **WebSocket Cleanup**: Some non-critical connection cleanup errors may appear in logs but don't affect functionality
- **Custom Names**: Users can set display names that persist during their session
- **Private Messaging**: Works through the same ephemeral architecture as public rooms