from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, MatchingPreferences
from app.services.matching_service import MatchingService
from app.middleware.auth_middleware import require_age_verification
from app.database import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/find")
async def find_match(
    preferences: MatchingPreferences,
    current_user: User = Depends(require_age_verification),
    db: AsyncSession = Depends(get_db)
):
    """Find a chat partner based on preferences"""
    try:
        match_result = await MatchingService.find_match(
            db, str(current_user.id), preferences
        )
        
        if match_result["status"] == "found":
            return {
                "status": "found",
                "match_id": match_result["match_id"],
                "partner": match_result["partner"],
                "room_id": match_result["room_id"]
            }
        else:
            return match_result  # Return the service result directly
    except Exception as e:
        logger.error(f"Matching failed for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Matching service failed"
        )

@router.get("/status")
async def get_matching_status(
    current_user: User = Depends(require_age_verification),
    db: AsyncSession = Depends(get_db)
):
    """Get current matching status"""
    try:
        status_info = await MatchingService.get_matching_status(
            db, str(current_user.id)
        )
        return status_info
    except Exception as e:
        logger.error(f"Failed to get matching status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get matching status"
        )

@router.delete("/cancel")
async def cancel_matching(
    current_user: User = Depends(require_age_verification),
    db: AsyncSession = Depends(get_db)
):
    """Cancel current matching search"""
    try:
        success = await MatchingService.cancel_matching(db, str(current_user.id))
        if success:
            return {"message": "Matching cancelled"}
        else:
            return {"message": "No active matching to cancel"}
    except Exception as e:
        logger.error(f"Failed to cancel matching: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel matching"
        )

@router.put("/preferences")
async def update_matching_preferences(
    preferences: MatchingPreferences,
    current_user: User = Depends(require_age_verification),
    db: AsyncSession = Depends(get_db)
):
    """Update user's matching preferences"""
    try:
        # Update user preferences
        current_user.preferences = preferences.dict()
        await db.commit()
        
        return {"message": "Preferences updated successfully"}
    except Exception as e:
        logger.error(f"Failed to update preferences: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preferences"
        )