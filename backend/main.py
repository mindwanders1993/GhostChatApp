from fastapi import FastAPI, WebSocket, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn
import asyncio
from contextlib import asynccontextmanager

from app.routers import auth, chat, matching, moderation, safety
from app.websocket.socketio_manager import socketio_manager
import socketio
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security import SecurityMiddleware, CORSSecurityMiddleware, RequestLoggingMiddleware
from app.database import init_db, close_db, get_db
from app.config import settings
from app.services.auth_service import AuthService
from app.services.chat_service import ChatService
from app.utils.security import verify_token

import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting GhostChatApp...")
    await init_db()
    logger.info("Database initialized")
    
    # Initialize default public rooms
    try:
        async for db in get_db():
            await ChatService.create_default_public_rooms(db)
            logger.info("Default public rooms created/verified")
            break
    except Exception as e:
        logger.error(f"Failed to create default public rooms: {str(e)}")
    
    # Start background tasks
    asyncio.create_task(cleanup_task())
    
    yield
    
    # Shutdown
    logger.info("Shutting down GhostChatApp...")
    await close_db()
    logger.info("Database connections closed")

app = FastAPI(
    title="GhostChatApp API",
    description="Secure anonymous chat application API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Create Socket.IO ASGI app
socket_app = socketio.ASGIApp(socketio_manager.sio, app)

# Add middleware (order matters!)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityMiddleware)
app.add_middleware(
    CORSSecurityMiddleware,
    allowed_origins=settings.cors_origins.split(","),
    allow_credentials=True
)
app.add_middleware(RateLimitMiddleware)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(matching.router, prefix="/api/v1/matching", tags=["Matching"])
app.include_router(moderation.router, prefix="/api/v1/moderation", tags=["Moderation"])
app.include_router(safety.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to GhostChatApp",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    from datetime import datetime
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0"
    }

# Socket.IO is handled by socketio_manager - no WebSocket endpoint needed

async def cleanup_task():
    """Background cleanup task"""
    while True:
        try:
            # Run cleanup every 5 minutes
            await asyncio.sleep(300)
            
            # Clean up expired sessions
            await AuthService.cleanup_expired_sessions()
            logger.info("Completed session cleanup")
            
            # Add other cleanup tasks here
            
        except Exception as e:
            logger.error(f"Cleanup task error: {str(e)}")
            await asyncio.sleep(60)  # Wait 1 minute before retry

if __name__ == "__main__":
    uvicorn.run(
        "main:socket_app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disable reload for Socket.IO compatibility
        log_level="info"
    )