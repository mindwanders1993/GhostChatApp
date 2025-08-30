from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import json
from app.models.user import User, UserCreate, UserSession
from app.utils.security import generate_anonymous_id, create_access_token, verify_token, generate_session_token
from app.database import get_redis
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class AuthService:
    @staticmethod
    async def create_anonymous_user(db: AsyncSession, user_data: UserCreate) -> User:
        """Create a new anonymous user"""
        try:
            # Generate anonymous ID
            anonymous_id = generate_anonymous_id()
            
            # Create user
            user = User(
                anonymous_id=anonymous_id,
                nickname=user_data.nickname,
                age_verified=user_data.age_verified,
                gender=user_data.gender,
                location=user_data.location,
                preferences=user_data.preferences or {},
                session_token=generate_session_token()
            )
            
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
            logger.info(f"Created anonymous user: {user.anonymous_id}")
            return user
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to create user: {str(e)}")
            raise

    @staticmethod
    async def create_session(user: User) -> Dict[str, Any]:
        """Create a user session and JWT token"""
        try:
            # Create JWT token
            token_data = {
                "sub": user.anonymous_id,
                "user_id": str(user.id),
                "session_id": user.session_token,
                "scope": ["chat:read", "chat:write", "user:profile"]
            }
            
            access_token = create_access_token(token_data)
            
            # Store session in Redis
            redis = await get_redis()
            session_data = UserSession(
                user_id=str(user.id),
                anonymous_id=user.anonymous_id,
                session_id=user.session_token,
                created_at=datetime.utcnow(),
                last_activity=datetime.utcnow(),
                permissions=["chat:read", "chat:write", "user:profile"]
            )
            
            await redis.setex(
                f"session:{user.session_token}",
                settings.jwt_expiration_minutes * 60,
                json.dumps(session_data.dict(), default=str)
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "expires_in": settings.jwt_expiration_minutes * 60,
                "user": user.to_dict()
            }
            
        except Exception as e:
            logger.error(f"Failed to create session: {str(e)}")
            raise

    @staticmethod
    async def validate_session(token: str) -> Optional[UserSession]:
        """Validate session token and return user session"""
        try:
            # Decode JWT token
            payload = verify_token(token)
            if not payload:
                return None
            
            session_id = payload.get("session_id")
            if not session_id:
                return None
            
            # Get session from Redis
            redis = await get_redis()
            session_data = await redis.get(f"session:{session_id}")
            
            if not session_data:
                return None
            
            session = UserSession(**json.loads(session_data))
            
            # Update last activity and extend session
            session.last_activity = datetime.utcnow()
            await redis.setex(
                f"session:{session_id}",
                settings.jwt_expiration_minutes * 60,
                json.dumps(session.dict(), default=str)
            )
            
            return session
            
        except Exception as e:
            logger.error(f"Session validation failed: {str(e)}")
            return None

    @staticmethod
    async def refresh_token(db: AsyncSession, current_token: str) -> Optional[str]:
        """Refresh JWT token"""
        try:
            payload = verify_token(current_token)
            if not payload:
                return None
            
            user_id = payload.get("user_id")
            if not user_id:
                return None
            
            # Get user from database
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            
            if not user or not user.is_active:
                return None
            
            # Update last activity
            user.last_active = datetime.utcnow()
            await db.commit()
            
            # Create new token
            token_data = {
                "sub": user.anonymous_id,
                "user_id": str(user.id),
                "session_id": user.session_token,
                "scope": ["chat:read", "chat:write", "user:profile"]
            }
            
            return create_access_token(token_data)
            
        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            return None

    @staticmethod
    async def logout_user(db: AsyncSession, token: str) -> bool:
        """Logout user and invalidate session"""
        try:
            payload = verify_token(token)
            if not payload:
                return False
            
            session_id = payload.get("session_id")
            user_id = payload.get("user_id")
            
            if session_id:
                # Remove session from Redis
                redis = await get_redis()
                await redis.delete(f"session:{session_id}")
            
            if user_id:
                # Update user in database
                result = await db.execute(select(User).where(User.id == user_id))
                user = result.scalar_one_or_none()
                
                if user:
                    user.session_token = None
                    user.last_active = datetime.utcnow()
                    await db.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Logout failed: {str(e)}")
            return False

    @staticmethod
    async def cleanup_expired_sessions():
        """Clean up expired sessions (background task)"""
        try:
            redis = await get_redis()
            
            # Get all session keys
            session_keys = await redis.keys("session:*")
            
            for key in session_keys:
                session_data = await redis.get(key)
                if session_data:
                    session = UserSession(**json.loads(session_data))
                    
                    # Check if session is expired (24+ hours old)
                    if datetime.utcnow() - session.last_activity > timedelta(hours=24):
                        await redis.delete(key)
                        logger.info(f"Cleaned up expired session: {key}")
                        
        except Exception as e:
            logger.error(f"Session cleanup failed: {str(e)}")

    @staticmethod
    async def get_user_by_session(db: AsyncSession, session: UserSession) -> Optional[User]:
        """Get user by session"""
        try:
            result = await db.execute(select(User).where(User.id == session.user_id))
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Failed to get user by session: {str(e)}")
            return None