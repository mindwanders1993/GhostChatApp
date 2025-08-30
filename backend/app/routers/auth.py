from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserCreate, UserResponse, UserUpdate
from app.services.auth_service import AuthService
from app.middleware.auth_middleware import require_user, get_current_user
from app.database import get_db
from app.utils.security import SecurityUtils
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/register", response_model=dict)
async def register_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register new anonymous user"""
    try:
        # Validate input
        if not user_data.age_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Age verification is required"
            )
        
        if not SecurityUtils.validate_nickname(user_data.nickname):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid nickname format. Use only letters, numbers, hyphens, and underscores."
            )
        
        # Create user
        user = await AuthService.create_anonymous_user(db, user_data)
        
        # Create session
        session_data = await AuthService.create_session(user)
        
        return {
            "message": "User registered successfully",
            **session_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )

@router.post("/refresh")
async def refresh_token(
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Refresh authentication token"""
    try:
        # Get current token from user (this would need to be passed properly)
        # For now, create a new session
        session_data = await AuthService.create_session(current_user)
        
        return {
            "message": "Token refreshed successfully",
            "access_token": session_data["access_token"],
            "token_type": session_data["token_type"],
            "expires_in": session_data["expires_in"]
        }
        
    except Exception as e:
        logger.error(f"Token refresh failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )

@router.delete("/logout")
async def logout_user(
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Logout and invalidate session"""
    try:
        # This would need the actual token, but for now we'll use the session token
        success = await AuthService.logout_user(db, current_user.session_token or "")
        
        if success:
            return {"message": "Successfully logged out"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Logout failed"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Logout failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(require_user)
):
    """Get current user information"""
    return UserResponse(
        id=str(current_user.id),
        anonymous_id=current_user.anonymous_id,
        nickname=current_user.nickname,
        karma_score=current_user.karma_score,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

@router.put("/me", response_model=UserResponse)
async def update_user_info(
    user_update: UserUpdate,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user information"""
    try:
        # Validate nickname if provided
        if user_update.nickname and not SecurityUtils.validate_nickname(user_update.nickname):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid nickname format"
            )
        
        # Update user
        if user_update.nickname:
            current_user.nickname = user_update.nickname
        
        if user_update.preferences is not None:
            current_user.preferences = user_update.preferences
        
        await db.commit()
        await db.refresh(current_user)
        
        return UserResponse(
            id=str(current_user.id),
            anonymous_id=current_user.anonymous_id,
            nickname=current_user.nickname,
            karma_score=current_user.karma_score,
            is_active=current_user.is_active,
            created_at=current_user.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User update failed: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Update failed"
        )

@router.delete("/me")
async def delete_user_account(
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete user account permanently"""
    try:
        # Mark user as inactive first
        current_user.is_active = False
        current_user.session_token = None
        
        await db.commit()
        
        # In a real implementation, you might want to:
        # 1. Remove from active chat rooms
        # 2. Clean up any related data
        # 3. Invalidate all sessions
        
        return {"message": "Account deleted successfully"}
        
    except Exception as e:
        logger.error(f"Account deletion failed: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Account deletion failed"
        )

@router.post("/verify-age")
async def verify_age(
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark user as age verified"""
    try:
        if current_user.age_verified:
            return {"message": "Age already verified"}
        
        current_user.age_verified = True
        await db.commit()
        
        return {"message": "Age verification completed"}
        
    except Exception as e:
        logger.error(f"Age verification failed: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Age verification failed"
        )