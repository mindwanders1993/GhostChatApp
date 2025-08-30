from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.models.chat import ChatRoom, ChatRoomCreate, ChatRoomResponse, JoinRoomRequest, LeaveRoomRequest
from app.models.message import MessageResponse
from app.models.user import User
from app.services.chat_service import ChatService
from app.middleware.auth_middleware import require_user, require_age_verification
from app.database import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/public-rooms", response_model=List[dict])
async def get_public_rooms(
    db: AsyncSession = Depends(get_db)
):
    """Get all public chat rooms with stats"""
    try:
        rooms = await ChatService.get_public_rooms_with_stats(db)
        return rooms
    except Exception as e:
        logger.error(f"Failed to get public rooms: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get public rooms"
        )

@router.post("/rooms", response_model=dict)
async def create_chat_room(
    room_data: ChatRoomCreate,
    current_user: User = Depends(require_age_verification),
    db: AsyncSession = Depends(get_db)
):
    """Create a new chat room"""
    try:
        room = await ChatService.create_room(db, room_data, str(current_user.id))
        return {
            "message": "Room created successfully",
            "room": room.to_dict()
        }
    except Exception as e:
        logger.error(f"Failed to create room: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create room"
        )

@router.get("/rooms/{room_id}", response_model=dict)
async def get_chat_room(
    room_id: str,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Get chat room details"""
    try:
        room = await ChatService.get_room(db, room_id)
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found"
            )
        
        return {
            "room": room.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get room {room_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get room"
        )

@router.post("/rooms/{room_id}/join")
async def join_chat_room(
    room_id: str,
    current_user: User = Depends(require_age_verification),
    db: AsyncSession = Depends(get_db)
):
    """Join a chat room"""
    try:
        success = await ChatService.join_room(db, room_id, str(current_user.id))
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to join room"
            )
        
        return {"message": "Joined room successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to join room {room_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join room"
        )

@router.post("/rooms/{room_id}/leave")
async def leave_chat_room(
    room_id: str,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Leave a chat room"""
    try:
        success = await ChatService.leave_room(db, room_id, str(current_user.id))
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to leave room"
            )
        
        return {"message": "Left room successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to leave room {room_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to leave room"
        )

@router.get("/rooms/{room_id}/messages", response_model=List[MessageResponse])
async def get_room_messages(
    room_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Get messages for a room"""
    try:
        messages = await ChatService.get_room_messages(db, room_id, str(current_user.id), limit, None)
        return [
            MessageResponse(
                id=str(msg.id),
                room_id=str(msg.room_id),
                sender_id=str(msg.sender_id),
                content=msg.content,
                message_type=msg.message_type,
                metadata=msg.message_metadata,
                sent_at=msg.sent_at,
                expires_at=msg.expires_at
            )
            for msg in messages
        ]
    except Exception as e:
        logger.error(f"Failed to get messages for room {room_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get messages"
        )

@router.get("/rooms", response_model=List[dict])
async def get_user_rooms(
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's chat rooms"""
    try:
        rooms = await ChatService.get_user_rooms(db, str(current_user.id))
        return [room.to_dict() for room in rooms]
    except Exception as e:
        logger.error(f"Failed to get user rooms: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get rooms"
        )

@router.get("/public-rooms", response_model=List[dict])
async def get_public_rooms(
    db: AsyncSession = Depends(get_db)
):
    """Get all public rooms with stats for room listing"""
    try:
        rooms = await ChatService.get_public_rooms_with_stats(db)
        return rooms
    except Exception as e:
        logger.error(f"Failed to get public rooms: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get public rooms"
        )