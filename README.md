# GhostChatApp - Anonymous Chat Application

A secure, anonymous chat application built with React, FastAPI, and PostgreSQL. Designed for privacy-first communication with comprehensive moderation and safety features.

## Features

- **Anonymous Communication**: No personal information required
- **Real-time Messaging**: WebSocket-powered instant messaging
- **Smart Matching**: Interest-based user pairing
- **Content Moderation**: AI-powered safety features
- **Privacy Protection**: End-to-end encryption and temporary storage
- **Mobile Responsive**: Progressive Web App (PWA) support

## Tech Stack

### Frontend
- React 18.2+ with TypeScript
- Material-UI (MUI) v5
- Redux Toolkit + RTK Query
- Socket.io-client
- Vite build tool

### Backend
- FastAPI 0.104+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Socket.io for WebSocket

### Infrastructure
- Docker & Docker Compose
- Nginx (production)
- Prometheus & Grafana (monitoring)

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd GhostChatApp
```

2. Start with Docker Compose:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Project Structure

```
GhostChatApp/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── routers/        # API routes
│   │   ├── services/       # Business logic
│   │   ├── websocket/      # WebSocket handling
│   │   └── utils/          # Utilities
│   ├── tests/              # Backend tests
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── store/          # Redux store
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utilities
│   └── package.json
├── docker-compose.yml      # Docker configuration
└── README.md
```

## API Documentation

The API documentation is available at `/docs` when the backend is running. Key endpoints include:

- `POST /api/v1/auth/register` - Anonymous user registration
- `POST /api/v1/matching/find` - Find chat partner
- `GET /api/v1/chat/rooms/{id}` - Get chat room details
- `POST /api/v1/moderation/reports` - Report user/content

## Security Features

- **Anonymous Authentication**: JWT tokens with no PII
- **Content Moderation**: Multi-layer filtering system
- **Rate Limiting**: API and WebSocket protection
- **Input Validation**: Comprehensive sanitization
- **Privacy Protection**: Temporary data storage only

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run the test suite: `npm test` and `pytest`
5. Submit a pull request

## Deployment

For production deployment, see the deployment documentation in `/docs/deployment.md`.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in `/docs`
- Review the API documentation at `/docs` endpoint