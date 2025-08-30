"""
Safety API Router
Handles user blocking, reporting, and safety endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.services.auth_service import AuthService
from app.services.safety_service import SafetyService
from app.models.safety import (
    BlockUserRequest, UnblockUserRequest, ReportUserRequest, 
    BlockedUser, ReportResponse, SafetyStatsResponse
)
# Rate limiting is handled within the SafetyService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/safety", tags=["safety"])
security = HTTPBearer()


async def get_current_user(token: str = Depends(security), db: AsyncSession = Depends(get_db)):
    """Dependency to get current authenticated user"""
    try:
        session = await AuthService.validate_session(token.credentials)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        return session.user_id
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


@router.post("/block", status_code=status.HTTP_201_CREATED)
async def block_user(
    request: BlockUserRequest,
    current_user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Block a user"""
    try:
        # Rate limiting check
        if not await SafetyService.check_rate_limit(current_user_id, "block", limit=10, window=3600):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many block requests. Please try again later."
            )
        
        # Block the user
        block = await SafetyService.block_user(
            db, current_user_id, request.user_id, request.reason
        )
        
        return {
            "message": "User blocked successfully",
            "block_id": str(block.id),
            "blocked_user_id": request.user_id,
            "reason": request.reason
        }
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Block user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to block user"
        )


@router.delete("/block", status_code=status.HTTP_200_OK)
async def unblock_user(
    request: UnblockUserRequest,
    current_user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Unblock a user"""
    try:
        success = await SafetyService.unblock_user(db, current_user_id, request.user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Block not found"
            )
        
        return {
            "message": "User unblocked successfully",
            "unblocked_user_id": request.user_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unblock user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unblock user"
        )


@router.get("/blocked", response_model=List[BlockedUser])
async def get_blocked_users(
    current_user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get list of blocked users"""
    try:
        blocks = await SafetyService.get_blocked_users(db, current_user_id)
        
        return [
            BlockedUser(
                id=str(block.id),
                blocked_id=str(block.blocked_id),
                reason=block.reason,
                created_at=block.created_at
            )
            for block in blocks
        ]
        
    except Exception as e:
        logger.error(f"Get blocked users error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get blocked users"
        )


@router.post("/report", status_code=status.HTTP_201_CREATED)
async def report_user(
    request: ReportUserRequest,
    current_user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Report a user or message"""
    try:
        # Rate limiting check
        if not await SafetyService.check_rate_limit(current_user_id, "report", limit=5, window=3600):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many reports. Please try again later."
            )
        
        # Create report
        report = await SafetyService.report_user(db, current_user_id, request)
        
        return {
            "message": "Report submitted successfully",
            "report_id": str(report.id),
            "report_type": report.report_type,
            "status": report.status
        }
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Report user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit report"
        )


@router.get("/reports", response_model=List[ReportResponse])
async def get_user_reports(
    current_user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's reports"""
    try:
        reports = await SafetyService.get_user_reports(db, current_user_id)
        
        return [
            ReportResponse(
                id=str(report.id),
                report_type=report.report_type,
                reason=report.reason,
                status=report.status,
                created_at=report.created_at,
                reviewed_at=report.reviewed_at
            )
            for report in reports
        ]
        
    except Exception as e:
        logger.error(f"Get user reports error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get reports"
        )


@router.get("/stats", response_model=SafetyStatsResponse)
async def get_safety_stats(
    current_user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get safety statistics"""
    try:
        stats = await SafetyService.get_safety_stats(db, current_user_id)
        
        return SafetyStatsResponse(**stats)
        
    except Exception as e:
        logger.error(f"Get safety stats error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get safety statistics"
        )


@router.post("/check-blocked/{user_id}")
async def check_user_blocked(
    user_id: str,
    current_user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Check if a specific user is blocked"""
    try:
        is_blocked = await SafetyService.is_user_blocked(db, current_user_id, user_id)
        
        return {
            "user_id": user_id,
            "is_blocked": is_blocked
        }
        
    except Exception as e:
        logger.error(f"Check blocked user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check block status"
        )