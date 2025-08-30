# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GhostChatApp is an anonymous chat application built with React/TypeScript frontend, FastAPI backend, and PostgreSQL database. The application emphasizes privacy, security, and real-time communication with comprehensive moderation features.

## Development Commands

### Frontend (React/TypeScript)
```bash
cd frontend
npm install                    # Install dependencies
npm start                      # Development server (http://localhost:3000)
npm run build                  # Production build
npm test                       # Run tests
npm run test:ci                # Run tests in CI mode with coverage
npm run lint                   # ESLint check
npm run lint:fix               # Auto-fix ESLint issues
```

### Backend (FastAPI/Python)
```bash
cd backend
pip install -r requirements.txt    # Install dependencies
uvicorn main:app --reload          # Development server (http://localhost:8000)
pytest                            # Run all tests
pytest tests/ -v --cov=app        # Run tests with coverage
pytest -m unit                    # Run unit tests only
pytest -m integration             # Run integration tests only
pytest -m websocket               # Run WebSocket tests only
```

### Docker Development
```bash
docker-compose up --build         # Start all services in development
docker-compose down               # Stop all services
docker-compose logs backend       # View backend logs
docker-compose exec db psql -U chatuser -d chatapp  # Access database
```

### Production Deployment
```bash
docker-compose -f docker-compose.prod.yml up --build
./scripts/deploy.sh production    # Full deployment script
./scripts/backup.sh --upload-s3   # Database backup
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18+ with TypeScript, Material-UI v5, Redux Toolkit
- **Backend**: FastAPI with Python 3.11+, SQLAlchemy, Socket.io
- **Database**: PostgreSQL 15+ with Redis for caching/sessions
- **Real-time**: WebSocket connections via Socket.io
- **Authentication**: JWT tokens with anonymous user system

### Key Services
- **Authentication Service**: Anonymous user registration and session management
- **Chat Service**: Real-time messaging and room management  
- **Matching Service**: User pairing algorithms and preferences
- **Moderation Service**: Multi-layer content filtering and safety
- **WebSocket Manager**: Real-time bidirectional communication

### Database Design
- **Temporary Storage**: Messages auto-deleted after 24 hours
- **Anonymous Users**: No PII stored, session-based authentication
- **Privacy-First**: Automatic cleanup of inactive sessions
- **PostgreSQL Extensions**: UUID generation, scheduled cleanup functions

## Project Structure

```
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/         # SQLAlchemy database models
│   │   ├── routers/        # API endpoint definitions
│   │   ├── services/       # Business logic layer
│   │   ├── websocket/      # WebSocket connection management
│   │   ├── middleware/     # Security, rate limiting, CORS
│   │   └── utils/          # Shared utilities
│   ├── tests/              # Backend test suite
│   ├── main.py             # FastAPI application entry point
│   └── pytest.ini         # Test configuration
├── frontend/               # React TypeScript frontend  
│   ├── src/
│   │   ├── components/     # React components organized by feature
│   │   ├── hooks/          # Custom React hooks (useSocket, redux)
│   │   ├── store/          # Redux store and slices
│   │   ├── types/          # TypeScript type definitions
│   │   └── services/       # API service layer
│   └── package.json
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment  
├── nginx.prod.conf         # Production nginx configuration
└── scripts/               # Deployment and maintenance scripts
```

## Key Implementation Details

### WebSocket Architecture
- **Connection Management**: Centralized manager handles all WebSocket connections
- **Room-based Messaging**: Users join rooms for private/group chats
- **Real-time Events**: Typing indicators, user presence, message delivery
- **Session Persistence**: WebSocket state tied to user sessions

### Security Implementation
- **Anonymous Authentication**: JWT tokens with rotating anonymous IDs
- **Content Moderation**: Multi-stage pipeline with AI and rule-based filtering
- **Rate Limiting**: API and WebSocket endpoints protected
- **Privacy Protection**: No persistent user data, automatic cleanup

### Frontend State Management
- **Redux Toolkit**: Centralized state management with slices for auth, chat, matching, UI
- **RTK Query**: API state management and caching
- **WebSocket Integration**: Real-time updates integrated with Redux state

### Content Moderation Pipeline
1. **Basic Filtering**: Profanity, spam, and threat detection
2. **AI Analysis**: External toxicity detection service
3. **Image Moderation**: AWS Rekognition for media content
4. **Human Review**: Escalation system for complex cases

## Testing Strategy

### Backend Testing
- **Unit Tests**: Individual service and utility testing
- **Integration Tests**: API endpoint testing with test database
- **WebSocket Tests**: Real-time communication testing
- **Coverage Requirements**: Minimum 80% code coverage

### Frontend Testing  
- **Component Tests**: React Testing Library for UI components
- **Hook Tests**: Custom hooks testing with mock providers
- **Integration Tests**: Full user flow testing
- **E2E Tests**: Cypress for critical user journeys

## Development Guidelines

### Code Organization
- **Feature-based Structure**: Components grouped by functionality (Auth, Chat, Matching)
- **Service Layer**: Separate API calls from components  
- **Type Safety**: Comprehensive TypeScript interfaces and strict mode
- **Error Handling**: Consistent error boundaries and user feedback

### Database Patterns
- **Temporary Data**: All user data has expiration timestamps
- **UUID Primary Keys**: For security and scalability
- **Soft Deletes**: Track deletion for audit purposes where needed
- **Automated Cleanup**: Scheduled tasks for expired data removal

### Security Best Practices
- **Input Validation**: Pydantic models for all API inputs
- **SQL Injection Protection**: SQLAlchemy ORM usage
- **XSS Prevention**: Content sanitization on both ends
- **CORS Configuration**: Restricted origins for production

## Common Development Tasks

### Adding New API Endpoints
1. Define Pydantic models in `backend/app/models/`
2. Create router in `backend/app/routers/`
3. Add business logic to `backend/app/services/`
4. Write tests in `backend/tests/`
5. Update frontend API service in `frontend/src/services/api.ts`

### Adding New React Components
1. Create component in appropriate `frontend/src/components/` subfolder
2. Define TypeScript interfaces in `frontend/src/types/`
3. Add Redux slice if state management needed
4. Write component tests with React Testing Library
5. Update routing if necessary

### WebSocket Event Handling
1. Define event types in WebSocket manager (`backend/app/websocket/manager.py`)
2. Add client-side handling in `frontend/src/hooks/useSocket.ts`
3. Update Redux slices for state synchronization
4. Test real-time functionality end-to-end

## Deployment Notes

### Environment Configuration
- **Development**: Uses docker-compose.yml with hot reload
- **Production**: Uses docker-compose.prod.yml with optimized builds
- **Environment Variables**: Configured via .env files
- **SSL/TLS**: Required for production WebSocket connections

### Monitoring and Observability
- **Prometheus Metrics**: Custom metrics for application performance
- **Grafana Dashboards**: Pre-configured dashboards for monitoring
- **Log Aggregation**: Structured JSON logging with rotation
- **Health Checks**: Endpoint monitoring for all services

### Scaling Considerations
- **Horizontal Scaling**: Backend designed for multiple instances
- **Database Read Replicas**: Configured for high read loads
- **Redis Clustering**: Session storage can be distributed
- **CDN Integration**: Static assets served via CDN in production