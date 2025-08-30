# GhostChatApp - Code Architecture & Modular Development Guide

## 📋 Current Directory Structure Overview

```
GhostChatApp/
├── 🏗️ BACKEND (FastAPI + Python)
│   ├── app/
│   │   ├── 🔧 config.py                    # App configuration
│   │   ├── 💾 database.py                  # Database connection
│   │   ├── 🛡️ middleware/                   # Security & rate limiting
│   │   │   ├── auth_middleware.py          # JWT authentication
│   │   │   ├── rate_limit.py              # API rate limiting
│   │   │   └── security.py                # CORS, security headers
│   │   ├── 📊 models/                      # Database models
│   │   │   ├── user.py                     # User model
│   │   │   ├── chat.py                     # Chat room model
│   │   │   ├── message.py                  # Message model
│   │   │   ├── moderation.py               # Content moderation
│   │   │   └── safety.py                   # Safety reports
│   │   ├── 🌐 routers/                     # API endpoints
│   │   │   ├── auth.py                     # Authentication routes
│   │   │   ├── chat.py                     # Chat management
│   │   │   ├── matching.py                 # User matching
│   │   │   ├── moderation.py               # Content moderation
│   │   │   └── safety.py                   # Safety reporting
│   │   ├── ⚙️ services/                    # Business logic
│   │   │   ├── auth_service.py             # User authentication
│   │   │   ├── chat_service.py             # Chat operations
│   │   │   ├── matching_service.py         # User pairing
│   │   │   ├── moderation_service.py       # Content filtering
│   │   │   ├── presence_service.py         # User presence
│   │   │   └── safety_service.py           # Safety reporting
│   │   ├── 🔌 websocket/                   # Real-time communication
│   │   │   ├── manager.py                  # WebSocket manager
│   │   │   └── socketio_manager.py         # Socket.IO implementation
│   │   └── 🛠️ utils/                       # Utilities
│   │       └── security.py                # Security utilities
│   └── main.py                            # FastAPI entry point
│
├── 🖥️ FRONTEND (React + TypeScript)
│   ├── src/
│   │   ├── 🧩 components/                  # React components
│   │   │   ├── App.tsx                     # Main app component
│   │   │   ├── Auth/                       # Authentication UI
│   │   │   │   └── RegisterScreen.tsx      # User registration
│   │   │   ├── Chat/                       # Chat interfaces
│   │   │   │   ├── WhatsAppStyleChat.tsx   # Main chat UI
│   │   │   │   ├── EnhancedChatInterface.tsx
│   │   │   │   ├── EnhancedMessageBubble.tsx
│   │   │   │   └── SimpleChatInterface.tsx
│   │   │   ├── Common/                     # Shared components
│   │   │   │   ├── ConnectionStatus.tsx    # Connection indicator
│   │   │   │   ├── EncryptionIndicator.tsx # Encryption status
│   │   │   │   ├── NotificationSystem.tsx  # Toast notifications
│   │   │   │   ├── PrivacyProtection.tsx   # Privacy features
│   │   │   │   └── UserActionMenu.tsx      # User actions
│   │   │   ├── Landing/                    # Landing page
│   │   │   │   └── LandingPage.tsx         # App intro
│   │   │   ├── MessageComposer/            # Message input
│   │   │   │   └── RichTextComposer.tsx    # Rich text editor
│   │   │   └── Rooms/                      # Room management
│   │   │       └── RoomsPage.tsx           # Room selection
│   │   ├── 🎣 hooks/                       # Custom hooks
│   │   │   ├── redux.ts                    # Redux hooks
│   │   │   ├── useEncryption.ts            # Encryption logic
│   │   │   └── useSocket.ts                # WebSocket connection
│   │   ├── 🔌 services/                    # API layer
│   │   │   └── api.ts                      # API client
│   │   ├── 🏪 store/                       # State management
│   │   │   ├── store.ts                    # Redux store
│   │   │   └── slices/                     # Redux slices
│   │   │       ├── authSlice.ts            # Authentication state
│   │   │       ├── chatSlice.ts            # Chat state
│   │   │       ├── matchingSlice.ts        # Matching state
│   │   │       └── uiSlice.ts              # UI state
│   │   ├── 📝 types/                       # TypeScript definitions
│   │   │   └── chat.ts                     # Chat types
│   │   └── 🛠️ utils/                       # Utilities
│   │       ├── encryption.ts               # Client-side encryption
│   │       └── messageFormatting.ts        # Message formatting
│   └── package.json
│
├── 🐳 DEPLOYMENT
│   ├── docker-compose.yml                  # Development environment
│   ├── docker-compose.prod.yml             # Production environment
│   └── scripts/                            # Deployment scripts
│
└── 📚 DOCUMENTATION
    ├── CLAUDE.md                           # Development guide
    ├── README.md                           # Project overview
    └── *.md files                          # Various docs
```

## 🎯 Feature-to-File Mapping Guide

### 🔐 **AUTHENTICATION MODULE**
**Files to modify for auth features:**
- **Backend**: `backend/app/routers/auth.py:1-200` (API endpoints)
- **Backend**: `backend/app/services/auth_service.py:1-150` (business logic)
- **Backend**: `backend/app/models/user.py:1-100` (user data model)
- **Frontend**: `frontend/src/components/Auth/RegisterScreen.tsx:1-250` (UI)
- **Frontend**: `frontend/src/store/slices/authSlice.ts:1-180` (state)

### 💬 **CHAT MODULE**
**Files to modify for chat features:**
- **Backend**: `backend/app/routers/chat.py:1-300` (REST API)
- **Backend**: `backend/app/services/chat_service.py:1-400` (chat logic)
- **Backend**: `backend/app/websocket/socketio_manager.py:1-350` (real-time)
- **Backend**: `backend/app/models/message.py:1-120` (message model)
- **Frontend**: `frontend/src/components/Chat/WhatsAppStyleChat.tsx:1-500` (main UI)
- **Frontend**: `frontend/src/store/slices/chatSlice.ts:1-250` (chat state)
- **Frontend**: `frontend/src/hooks/useSocket.ts:1-200` (WebSocket hook)

### 🤝 **MATCHING MODULE**
**Files to modify for user matching:**
- **Backend**: `backend/app/routers/matching.py:1-150` (matching API)
- **Backend**: `backend/app/services/matching_service.py:1-200` (pairing logic)
- **Frontend**: `frontend/src/store/slices/matchingSlice.ts:1-120` (matching state)

### 🛡️ **MODERATION MODULE**
**Files to modify for content moderation:**
- **Backend**: `backend/app/routers/moderation.py:1-180` (moderation API)
- **Backend**: `backend/app/services/moderation_service.py:1-300` (filtering logic)
- **Backend**: `backend/app/models/moderation.py:1-80` (moderation model)

### 🔒 **SECURITY MODULE**
**Files to modify for security features:**
- **Backend**: `backend/app/middleware/security.py:1-150` (security middleware)
- **Backend**: `backend/app/middleware/rate_limit.py:1-100` (rate limiting)
- **Backend**: `backend/app/utils/security.py:1-120` (security utilities)
- **Frontend**: `frontend/src/utils/encryption.ts:1-150` (client encryption)
- **Frontend**: `frontend/src/hooks/useEncryption.ts:1-100` (encryption hook)

### 🎨 **UI/UX MODULE**
**Files to modify for UI/UX improvements:**
- **Frontend**: `frontend/src/components/Common/` (shared components)
- **Frontend**: `frontend/src/store/slices/uiSlice.ts:1-100` (UI state)
- **Frontend**: `frontend/src/components/App.tsx:1-140` (theme & layout)

## 🚀 Quick Navigation for Common Tasks

### 📝 **Adding a New Message Feature**
1. **Backend Model**: `backend/app/models/message.py:15-50`
2. **Backend Service**: `backend/app/services/chat_service.py:100-200`
3. **Backend API**: `backend/app/routers/chat.py:50-150`
4. **Frontend Types**: `frontend/src/types/chat.ts:1-50`
5. **Frontend Component**: `frontend/src/components/Chat/WhatsAppStyleChat.tsx:200-400`
6. **Frontend State**: `frontend/src/store/slices/chatSlice.ts:80-150`

### 🔧 **Modifying Authentication**
1. **Backend Auth Service**: `backend/app/services/auth_service.py:1-150`
2. **Backend Auth Routes**: `backend/app/routers/auth.py:1-200`
3. **Frontend Auth Component**: `frontend/src/components/Auth/RegisterScreen.tsx:1-250`
4. **Frontend Auth State**: `frontend/src/store/slices/authSlice.ts:1-180`

### 🌐 **Adding New API Endpoints**
1. **Create Router**: `backend/app/routers/[feature].py`
2. **Add Service Logic**: `backend/app/services/[feature]_service.py`
3. **Register in**: `backend/main.py:78-82`
4. **Frontend API Client**: `frontend/src/services/api.ts:1-200`

### 🎭 **UI Component Changes**
1. **Shared Components**: `frontend/src/components/Common/`
2. **Feature Components**: `frontend/src/components/[Feature]/`
3. **State Management**: `frontend/src/store/slices/[feature]Slice.ts`
4. **Custom Hooks**: `frontend/src/hooks/`

## 📋 Modular Development Checklist

### ✅ **Before Making Changes**
- [ ] Identify the feature module from the mapping above
- [ ] Check related files in both backend and frontend
- [ ] Review existing patterns in similar files
- [ ] Update TypeScript types if needed

### ✅ **Development Process**
- [ ] Backend: Models → Services → Routes → Tests
- [ ] Frontend: Types → State → Components → Integration
- [ ] Test changes with: `npm test` (frontend) and `pytest` (backend)
- [ ] Run linting: `npm run lint` (frontend)

### ✅ **File Upload to AI Guidelines**
When uploading files to AI tools, use this priority order:
1. **Single Feature**: Upload the specific file from the mapping above
2. **Cross-Feature**: Upload related service + component files
3. **Full Context**: Include the main file + its immediate dependencies

## 💡 **Key Architecture Insights**

Your GhostChatApp follows a clean **modular architecture** with clear separation of concerns:

**Backend (FastAPI)**: Layered architecture - Models → Services → Routes → WebSocket  
**Frontend (React)**: Component-based with Redux state management + custom hooks

**Most frequently modified files for features:**
- **Chat features**: `backend/app/services/chat_service.py` + `frontend/src/components/Chat/WhatsAppStyleChat.tsx`
- **Auth features**: `backend/app/services/auth_service.py` + `frontend/src/store/slices/authSlice.ts`  
- **UI changes**: `frontend/src/components/` + `frontend/src/store/slices/uiSlice.ts`

This modular structure makes it easy to upload specific files to AI tools for targeted improvements without overwhelming context.

## 📂 **File Size Reference for AI Uploads**

### 🔥 **High Priority Files (Most frequently modified)**
- `backend/app/services/chat_service.py` (~400 lines) - Chat business logic
- `frontend/src/components/Chat/WhatsAppStyleChat.tsx` (~500 lines) - Main chat UI
- `backend/app/websocket/socketio_manager.py` (~350 lines) - Real-time messaging
- `frontend/src/store/slices/chatSlice.ts` (~250 lines) - Chat state management

### 📋 **Medium Priority Files**
- `backend/app/services/auth_service.py` (~150 lines) - Authentication logic
- `frontend/src/components/Auth/RegisterScreen.tsx` (~250 lines) - Registration UI
- `backend/app/routers/chat.py` (~300 lines) - Chat API endpoints
- `frontend/src/hooks/useSocket.ts` (~200 lines) - WebSocket integration

### 🛠️ **Configuration & Setup Files**
- `backend/main.py` (~130 lines) - FastAPI application setup
- `frontend/src/components/App.tsx` (~140 lines) - Main React app component
- `backend/app/config.py` - Application configuration
- `frontend/src/store/store.ts` (~25 lines) - Redux store setup

## 🎯 **Development Workflow Tips**

1. **Start with the service layer** for backend features
2. **Define TypeScript types first** for frontend features  
3. **Use the line number references** when asking AI for specific changes
4. **Test incrementally** - don't change multiple modules at once
5. **Follow the existing patterns** in similar files

---

*Generated: 2025-08-30*  
*For: GhostChatApp modular development*