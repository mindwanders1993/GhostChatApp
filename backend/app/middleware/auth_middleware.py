from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.services.auth_service import AuthService
from app.models.user import User, UserSession
from app.database import get_db
import logging

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)

async def get_current_user_session(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[UserSession]:
    """Get current user session from token"""
    if not credentials:
        return None
    
    session = await AuthService.validate_session(credentials.credentials)
    return session

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    session: Optional[UserSession] = Depends(get_current_user_session)
) -> Optional[User]:
    """Get current user from session"""
    if not session:
        return None
    
    user = await AuthService.get_user_by_session(db, session)
    return user

async def require_auth(
    session: Optional[UserSession] = Depends(get_current_user_session)
) -> UserSession:
    """Require authentication - raise 401 if not authenticated"""
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return session

async def require_user(
    db: AsyncSession = Depends(get_db),
    session: UserSession = Depends(require_auth)
) -> User:
    """Require authenticated user - raise 401 if user not found"""
    user = await AuthService.get_user_by_session(db, session)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user

async def require_age_verification(
    user: User = Depends(require_user)
) -> User:
    """Require age verification - raise 403 if not verified"""
    if not user.age_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Age verification required"
        )
    return user

class AuthMiddleware:
    """Authentication middleware for route protection"""
    
    @staticmethod
    def optional_auth():
        """Optional authentication - returns None if not authenticated"""
        return Depends(get_current_user_session)
    
    @staticmethod
    def required_auth():
        """Required authentication - raises 401 if not authenticated"""
        return Depends(require_auth)
    
    @staticmethod
    def required_user():
        """Required user - raises 401 if user not found"""
        return Depends(require_user)
    
    @staticmethod
    def verified_user():
        """Required age-verified user - raises 403 if not verified"""
        return Depends(require_age_verification)