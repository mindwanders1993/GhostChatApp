# GhostChatApp - Quick Start Guide

This guide will help you get the GhostChatApp anonymous chat application running locally for development.

## ✨ What You Get

Based on your functional requirements, this GhostChatApp implementation includes:

### ✅ Core Features Implemented

1. **🏠 Landing Page**
   - Complete overview of anonymity and privacy features
   - List of available chat rooms with descriptions  
   - Community rules and safety guidelines
   - **Enter Chat** button to start the journey

2. **🏠 Chat Rooms Listing**
   - Real-time room statistics (user counts, activity)
   - Security level indicators (high/medium/standard)
   - Room descriptions and tags
   - **Join Room** button for each room

3. **👤 Guest Access Form**
   - Username/nickname input with validation
   - Gender selection (Male, Female, Other, Prefer not to say)
   - Age verification (18+ required) with checkbox
   - Location detection and manual selection
   - Terms & Conditions acceptance
   - **Chat as Guest** button

4. **💬 Real-time Chat Interface**
   - Text messaging with real-time delivery
   - **Media Support**: Images, GIFs, audio clips, URLs
   - **User Tagging**: @username functionality with highlighting
   - **Online Users Panel**: See who's in the room, click to tag or private message
   - Typing indicators and timestamps
   - Message auto-deletion after 24 hours

5. **🔒 Privacy & Security**
   - No personal data storage
   - Anonymous sessions with JWT tokens
   - Real-time moderation and content filtering
   - Secure WebSocket connections
   - Automatic cleanup of expired data

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended for easy setup)
- **Node.js 18+** (for frontend development)
- **Python 3.11+** (for backend development)
- **PostgreSQL 15+** (if running without Docker)
- **Redis 7+** (if running without Docker)

### Option 1: Docker Setup (Recommended)

1. **Clone and navigate to project:**
   ```bash
   cd /Users/mrrobot/Desktop/GhostChatApp
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Option 2: Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:socket_app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start  # Runs on http://localhost:3000
```

## 🎯 Test the Complete User Journey

1. **Visit Landing Page**: http://localhost:3000
   - Explore the features overview
   - Read the community guidelines
   - Click **"Enter Chat Rooms"**

2. **Browse Available Rooms**
   - See live room statistics
   - Check security levels and descriptions
   - Click **"Join Room"** on any room

3. **Complete Registration**
   - Step 1: Choose username, verify age 18+
   - Step 2: Select gender and location
   - Step 3: Accept community guidelines and terms
   - Click **"Join Chat Room"**

4. **Experience Real-time Chat**
   - Send text messages instantly
   - Try media features: click attachment icon for images/audio
   - Test URL sharing: paste any URL
   - Tag users: type @username (use online users panel)
   - View online users: click People icon in header

## 🔧 Key Features to Test

### **Media Sharing**
- Click attachment icon (📎) in chat input
- Select "Image" to share pictures or GIFs
- Select "Audio" to share audio files  
- Click "Share Link" to send URLs
- URLs are auto-detected and formatted

### **User Tagging**
- In public rooms, click People icon to see online users
- Click "@" next to any user to tag them
- Messages with @username are highlighted in blue
- Tagged users get special formatting in messages

### **Room Features**
- Real-time user counts and activity updates
- Security levels (high/medium/standard) with visual indicators
- Automatic room creation on startup
- Message history with timestamps
- Typing indicators

## 📋 Default Rooms Available

The app creates these public rooms automatically:

1. **💬 General Lounge** (200 max users)
2. **🎮 Gaming Hub** (150 max users)
3. **🎵 Music Corner** (100 max users)
4. **🎬 Movie Talk** (100 max users)
5. **💻 Tech Discussion** (120 max users)
6. **💭 Random Thoughts** (150 max users)

## 🧪 Testing & Development

### Run Tests
```bash
# Backend tests
cd backend && pytest

# Frontend tests  
cd frontend && npm test

# Full integration test
./scripts/test_modules_1-4.sh
```

### Monitor Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

## 🔒 Security Features Active

- **Anonymous Authentication**: JWT tokens, no PII stored
- **Content Moderation**: Multi-layer filtering
- **Rate Limiting**: API and WebSocket protection
- **Auto-cleanup**: Messages deleted after 24 hours
- **Input Validation**: All user inputs sanitized
- **CORS Protection**: Restricted origins in production

## 🌐 Environment Variables

Key settings in `.env`:
```bash
# Backend
DATABASE_URL=postgresql://chatuser:chatpass@localhost:5432/chatapp
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
CORS_ORIGINS=http://localhost:3000

# Frontend  
REACT_APP_API_URL=http://localhost:8000
```

## 📱 Multi-room Support

Users can:
- Join multiple public rooms simultaneously
- Switch between rooms using navigation
- Start private conversations from public rooms
- See typing indicators and user presence per room
- Access room-specific user lists and tagging

## 🚨 Important Notes

- **Age Verification Required**: All users must confirm 18+ years old
- **Anonymous by Design**: No real personal data is stored
- **Temporary Messages**: Auto-deleted after 24 hours
- **Real-time Updates**: User counts and activity are live
- **Content Moderation**: AI-powered safety filtering active

## 🆘 Troubleshooting

### Common Issues

1. **Docker not starting**: Ensure Docker Desktop is running
2. **Port conflicts**: Check ports 3000, 8000, 5432, 6379 are available
3. **Database connection**: Wait for PostgreSQL to fully initialize
4. **WebSocket errors**: Ensure Redis is running for session storage

### Reset Everything
```bash
docker-compose down -v  # Removes all data
docker-compose up --build  # Fresh start
```

## 🎉 Success!

If everything is working, you should be able to:
- ✅ Browse the landing page with full feature descriptions
- ✅ See live room listings with user counts  
- ✅ Complete the 3-step registration process
- ✅ Join public rooms and see real-time messages
- ✅ Share images, audio, and URLs in chat
- ✅ Tag users with @username functionality
- ✅ View online users and start interactions

The application now fully implements your functional requirements for an anonymous chat platform with comprehensive features for safe, private, real-time communication!