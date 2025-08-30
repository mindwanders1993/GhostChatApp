from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, or_, and_
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import json
from app.models.message import UserPresence, UserPresenceResponse, UserPresenceUpdate
from app.models.user import User
from app.models.chat import ChatRoom, RoomParticipant
from app.database import get_redis
import logging

logger = logging.getLogger(__name__)

class PresenceService:
    @staticmethod
    async def update_user_presence(
        db: AsyncSession, 
        user_id: str, 
        room_id: Optional[str] = None,
        is_online: bool = True,
        is_typing: bool = False,
        status_message: Optional[str] = None
    ) -> Optional[UserPresence]:
        """Update user presence information"""
        try:
            # Get or create user presence
            result = await db.execute(
                select(UserPresence).where(UserPresence.user_id == user_id)
            )
            presence = result.scalar_one_or_none()
            
            if not presence:
                presence = UserPresence(
                    user_id=user_id,
                    room_id=room_id,
                    is_online=is_online,
                    is_typing=is_typing,
                    status_message=status_message
                )
                db.add(presence)
            else:
                presence.room_id = room_id if room_id is not None else presence.room_id
                presence.is_online = is_online
                presence.is_typing = is_typing
                presence.status_message = status_message if status_message is not None else presence.status_message
                presence.last_activity = datetime.utcnow()
                
                if is_online:
                    presence.last_seen = datetime.utcnow()
            
            await db.commit()
            await db.refresh(presence)
            
            # Cache in Redis for quick access
            redis = await get_redis()
            presence_data = presence.to_dict()
            await redis.setex(
                f"presence:{user_id}",
                300,  # 5 minutes cache
                json.dumps(presence_data, default=str)
            )
            
            logger.info(f"Updated presence for user {user_id}: online={is_online}, typing={is_typing}")
            return presence
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to update presence for user {user_id}: {str(e)}")
            return None
    
    @staticmethod
    async def get_room_online_users(db: AsyncSession, room_id: str) -> List[UserPresenceResponse]:
        """Get all online users in a specific room"""
        try:
            # First try Redis cache
            redis = await get_redis()
            cache_key = f"room_users:{room_id}"
            cached_users = await redis.get(cache_key)
            
            if cached_users:
                users_data = json.loads(cached_users)
                return [UserPresenceResponse(**user) for user in users_data]
            
            # Query database
            query = (
                select(UserPresence, User.nickname)
                .join(User, UserPresence.user_id == User.id)
                .join(RoomParticipant, UserPresence.user_id == RoomParticipant.user_id)
                .where(
                    and_(
                        RoomParticipant.room_id == room_id,
                        RoomParticipant.is_active == True,
                        UserPresence.is_online == True,
                        UserPresence.last_activity > datetime.utcnow() - timedelta(minutes=5)
                    )
                )
            )
            
            result = await db.execute(query)
            online_users = []
            
            for presence, nickname in result:
                user_data = UserPresenceResponse(
                    user_id=str(presence.user_id),
                    user_nickname=nickname,
                    room_id=str(presence.room_id) if presence.room_id else None,
                    is_online=presence.is_online,
                    is_typing=presence.is_typing,
                    last_seen=presence.last_seen,
                    last_activity=presence.last_activity,
                    status_message=presence.status_message
                )
                online_users.append(user_data)
            
            # Cache for 30 seconds
            await redis.setex(
                cache_key,
                30,
                json.dumps([user.dict() for user in online_users], default=str)
            )
            
            return online_users
            
        except Exception as e:
            logger.error(f"Failed to get online users for room {room_id}: {str(e)}")
            return []
    
    @staticmethod
    async def get_typing_users(db: AsyncSession, room_id: str) -> List[Dict[str, Any]]:
        """Get users currently typing in a room"""
        try:
            query = (
                select(UserPresence, User.nickname)
                .join(User, UserPresence.user_id == User.id)
                .where(
                    and_(
                        UserPresence.room_id == room_id,
                        UserPresence.is_typing == True,
                        UserPresence.last_activity > datetime.utcnow() - timedelta(seconds=10)
                    )
                )
            )
            
            result = await db.execute(query)
            typing_users = []
            
            for presence, nickname in result:
                typing_users.append({
                    "user_id": str(presence.user_id),
                    "user_nickname": nickname,
                    "started_typing": presence.last_activity.isoformat()
                })
            
            return typing_users
            
        except Exception as e:
            logger.error(f"Failed to get typing users for room {room_id}: {str(e)}")
            return []
    
    @staticmethod
    async def set_user_offline(db: AsyncSession, user_id: str) -> bool:
        """Set user as offline"""
        try:
            await db.execute(
                update(UserPresence)
                .where(UserPresence.user_id == user_id)
                .values(
                    is_online=False,
                    is_typing=False,
                    last_seen=datetime.utcnow()
                )
            )
            await db.commit()
            
            # Remove from Redis cache
            redis = await get_redis()
            await redis.delete(f"presence:{user_id}")
            
            logger.info(f"Set user {user_id} offline")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to set user {user_id} offline: {str(e)}")
            return False
    
    @staticmethod
    async def cleanup_stale_presence():
        """Clean up stale presence data (background task)"""
        try:
            from app.database import async_session
            async with async_session() as db:
                # Set users offline who haven't been active in 5+ minutes
                stale_cutoff = datetime.utcnow() - timedelta(minutes=5)
                
                await db.execute(
                    update(UserPresence)
                    .where(UserPresence.last_activity < stale_cutoff)
                    .values(is_online=False, is_typing=False)
                )
                
                # Delete very old presence records (24+ hours)
                old_cutoff = datetime.utcnow() - timedelta(hours=24)
                
                await db.execute(
                    delete(UserPresence)
                    .where(UserPresence.last_activity < old_cutoff)
                )
                
                await db.commit()
                logger.info("Cleaned up stale presence data")
                
        except Exception as e:
            logger.error(f"Failed to cleanup stale presence: {str(e)}")
    
    @staticmethod
    async def get_user_presence(db: AsyncSession, user_id: str) -> Optional[UserPresenceResponse]:
        """Get specific user's presence"""
        try:
            # Try Redis cache first
            redis = await get_redis()
            cached_presence = await redis.get(f"presence:{user_id}")
            
            if cached_presence:
                presence_data = json.loads(cached_presence)
                return UserPresenceResponse(**presence_data)
            
            # Query database
            query = (
                select(UserPresence, User.nickname)
                .join(User, UserPresence.user_id == User.id)
                .where(UserPresence.user_id == user_id)
            )
            
            result = await db.execute(query)
            row = result.first()
            
            if row:
                presence, nickname = row
                return UserPresenceResponse(
                    user_id=str(presence.user_id),
                    user_nickname=nickname,
                    room_id=str(presence.room_id) if presence.room_id else None,
                    is_online=presence.is_online,
                    is_typing=presence.is_typing,
                    last_seen=presence.last_seen,
                    last_activity=presence.last_activity,
                    status_message=presence.status_message
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get presence for user {user_id}: {str(e)}")
            return None