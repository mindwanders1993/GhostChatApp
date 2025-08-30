from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.models.moderation import (
    Report, ReportCreate, ReportResponse, SafetyTip, CrisisResource
)
from app.models.safety import (
    UserBlock, BlockUserRequest, BlockedUser
)
from app.models.user import User
from app.services.moderation_service import ModerationService
from app.middleware.auth_middleware import require_user
from app.database import get_db
from app.config import COMMUNITY_GUIDELINES
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/reports", response_model=dict)
async def create_report(
    report_data: ReportCreate,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Report a user or content"""
    try:
        success = await ModerationService.create_report(
            db, str(current_user.id), report_data
        )
        
        if success:
            return {
                "message": "Report submitted successfully",
                "status": "submitted"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to submit report"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Report submission failed"
        )

@router.post("/blocks", response_model=dict)
async def block_user(
    block_data: BlockUserRequest,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Block a user"""
    try:
        success = await ModerationService.block_user(
            db, str(current_user.id), block_data.user_id, block_data.reason
        )
        
        if success:
            return {"message": "User blocked successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to block user"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to block user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User blocking failed"
        )

@router.get("/blocks", response_model=List[BlockedUser])
async def get_blocked_users(
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Get list of blocked users"""
    try:
        blocks = await ModerationService.get_user_blocks(db, str(current_user.id))
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
        logger.error(f"Failed to get blocked users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get blocked users"
        )

@router.delete("/blocks/{block_id}")
async def unblock_user(
    block_id: str,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Unblock a user"""
    try:
        success = await ModerationService.unblock_user(db, str(current_user.id), block_id)
        if success:
            return {"message": "User unblocked successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Block not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to unblock user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unblock failed"
        )

@router.get("/guidelines", response_model=dict)
async def get_community_guidelines():
    """Get community guidelines"""
    return {"guidelines": COMMUNITY_GUIDELINES}

@router.get("/safety-tips", response_model=List[SafetyTip])
async def get_safety_tips():
    """Get safety tips for users"""
    return [
        SafetyTip(
            title="Trust Your Instincts",
            description="If something feels wrong, it probably is. Don't hesitate to end a conversation or block a user.",
            icon="warning"
        ),
        SafetyTip(
            title="Keep It Anonymous",
            description="Never share personal information like your real name, location, phone number, or social media profiles.",
            icon="privacy"
        ),
        SafetyTip(
            title="Report Bad Behavior",
            description="Help keep the community safe by reporting users who violate guidelines.",
            icon="report"
        ),
        SafetyTip(
            title="Use Block Liberally",
            description="Don't feel bad about blocking users. It's better to be safe than sorry.",
            icon="block"
        ),
        SafetyTip(
            title="Avoid External Links",
            description="Be cautious of users asking you to visit external websites or download files.",
            icon="link"
        )
    ]

@router.get("/crisis-resources", response_model=List[CrisisResource])
async def get_crisis_resources():
    """Get crisis support resources"""
    return [
        CrisisResource(
            title="National Suicide Prevention Lifeline",
            contact="988",
            description="24/7 free and confidential support"
        ),
        CrisisResource(
            title="Crisis Text Line",
            contact="Text HOME to 741741",
            description="24/7 crisis support via text message"
        ),
        CrisisResource(
            title="RAINN National Sexual Assault Hotline",
            contact="1-800-656-4673",
            description="24/7 support for sexual assault survivors"
        )
    ]