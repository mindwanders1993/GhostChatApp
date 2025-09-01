import redis.asyncio as redis
import json
import time
import secrets
import os
from typing import Dict, List, Optional, Set
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

class RedisManager:
    def __init__(self, redis_url: str = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://redis:6379")
        self.redis: Optional[redis.Redis] = None
        
        # TTL Constants (in seconds)
        self.SESSION_TTL = 900      # 15 minutes
        self.MESSAGE_TTL = 86400    # 24 hours  
        self.ROOM_TTL = 604800      # 7 days for persistent rooms (24x7)
        self.PUBLIC_ROOM_TTL = -1   # Never expire for public rooms
        self.ACTIVE_USERS_TTL = 86400  # 24 hours

    async def connect(self):
        try:
            self.redis = redis.from_url(
                self.redis_url,
                decode_responses=True,
                retry_on_timeout=True,
                socket_keepalive=True
            )
            await self.redis.ping()
            logger.info("Connected to Redis successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def disconnect(self):
        if self.redis:
            await self.redis.close()
            logger.info("Disconnected from Redis")

    async def create_ghost_session(self, ghost_id: str, preferences: dict = None) -> None:
        session_data = {
            "ghost_id": ghost_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_activity": datetime.now(timezone.utc).isoformat(),
            "active": True
        }
        
        if preferences:
            session_data.update(preferences)
        
        await self.redis.setex(
            f"users:{ghost_id}",
            self.SESSION_TTL,
            json.dumps(session_data)
        )
        
        await self.redis.sadd("active_users", ghost_id)
        await self.redis.expire("active_users", self.ACTIVE_USERS_TTL)
        
        logger.info(f"Created session for ghost {ghost_id}")

    async def update_ghost_activity(self, ghost_id: str) -> None:
        session_key = f"users:{ghost_id}"
        session_data_str = await self.redis.get(session_key)
        
        if session_data_str:
            session_data = json.loads(session_data_str)
            session_data["last_activity"] = datetime.now(timezone.utc).isoformat()
            
            await self.redis.setex(
                session_key,
                self.SESSION_TTL,
                json.dumps(session_data)
            )

    async def get_ghost_session(self, ghost_id: str) -> Optional[Dict]:
        session_data_str = await self.redis.get(f"users:{ghost_id}")
        if session_data_str:
            return json.loads(session_data_str)
        return None

    async def send_message(self, ghost_id: str, room_id: str, content: str) -> Dict:
        message_id = f"msg_{int(time.time()*1000)}_{secrets.token_hex(4)}"
        message_data = {
            "id": message_id,
            "sender": ghost_id,
            "content": content,
            "room_id": room_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        message_key = f"messages:{room_id}:{message_id}"
        await self.redis.setex(
            message_key,
            self.MESSAGE_TTL,
            json.dumps(message_data)
        )
        
        await self.redis.lpush(f"room_messages:{room_id}", message_key)
        await self.redis.expire(f"room_messages:{room_id}", self.ROOM_TTL)
        
        await self.update_ghost_activity(ghost_id)
        
        logger.info(f"Message {message_id} sent by {ghost_id} to room {room_id}")
        return message_data

    async def get_room_messages(self, room_id: str, limit: int = 50) -> List[Dict]:
        message_keys = await self.redis.lrange(f"room_messages:{room_id}", 0, limit - 1)
        messages = []
        
        for key in message_keys:
            message_data_str = await self.redis.get(key)
            if message_data_str:
                messages.append(json.loads(message_data_str))
        
        return messages

    async def create_room(self, creator_ghost_id: str, room_name: Optional[str] = None, room_data: Optional[Dict] = None) -> Dict:
        room_id = f"room_{int(time.time())}_{secrets.token_hex(6)}"
        
        base_room_data = {
            "id": room_id,
            "name": room_name or f"Room {room_id[-6:]}",
            "created_by": creator_ghost_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "participant_count": 0,
            "heat_level": 0.5,
            "is_public": True,
            "is_private": False,
            "participants": []
        }
        
        # Add additional room data if provided
        if room_data:
            base_room_data.update(room_data)
        
        room_data = base_room_data
        
        # Set room TTL based on type
        is_public = room_data.get('is_public', False)
        room_ttl = self.PUBLIC_ROOM_TTL if is_public else self.ROOM_TTL
        
        if is_public:
            # Public rooms persist indefinitely
            await self.redis.set(
                f"rooms:{room_id}",
                json.dumps(room_data)
            )
        else:
            await self.redis.setex(
                f"rooms:{room_id}",
                room_ttl,
                json.dumps(room_data)
            )
        
        await self.redis.sadd("all_rooms", room_id)
        await self.redis.expire("all_rooms", self.ROOM_TTL)
        
        logger.info(f"Room {room_id} created by {creator_ghost_id}")
        return room_data

    async def create_private_room(self, ghost1_id: str, ghost2_id: str) -> Dict:
        """Create or get existing private room between two users"""
        # Sort IDs to ensure consistent room ID regardless of who initiates
        sorted_ids = sorted([ghost1_id, ghost2_id])
        room_id = f"dm_{sorted_ids[0]}_{sorted_ids[1]}"
        
        # Check if private room already exists
        existing_room = await self.redis.get(f"rooms:{room_id}")
        if existing_room:
            return json.loads(existing_room)
        
        # Get display names for both users
        ghost1_session = await self.get_ghost_session(ghost1_id)
        ghost2_session = await self.get_ghost_session(ghost2_id)
        
        ghost1_display = ghost1_session.get('custom_name') if ghost1_session else f"Ghost#{ghost1_id[-4:]}"
        ghost2_display = ghost2_session.get('custom_name') if ghost2_session else f"Ghost#{ghost2_id[-4:]}"
        
        room_data = {
            "id": room_id,
            "name": f"Private: {ghost1_display} & {ghost2_display}",
            "created_by": ghost1_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "participant_count": 0,
            "heat_level": 0.0,
            "is_public": False,
            "is_private": True,
            "participants": sorted_ids,
            "room_type": "private_message"
        }
        
        # Store the private room (no TTL - persists like public rooms)
        await self.redis.set(f"rooms:{room_id}", json.dumps(room_data))
        
        # Add to special private rooms set (not public rooms list)
        await self.redis.sadd("private_rooms", room_id)
        
        # Automatically add both users as members of the private room
        await self.redis.sadd(f"room_members:{room_id}", ghost1_id)
        await self.redis.sadd(f"room_members:{room_id}", ghost2_id)
        await self.redis.expire(f"room_members:{room_id}", self.ROOM_TTL)
        
        logger.info(f"Private room {room_id} created between {ghost1_id} and {ghost2_id} with auto-membership")
        return room_data

    async def get_user_private_rooms(self, ghost_id: str) -> List[Dict]:
        """Get all private rooms for a specific user"""
        all_private_rooms = await self.redis.smembers("private_rooms")
        user_private_rooms = []
        
        for room_id in all_private_rooms:
            if ghost_id in room_id:  # Room ID contains user's ghost ID
                room_data_str = await self.redis.get(f"rooms:{room_id}")
                if room_data_str:
                    user_private_rooms.append(json.loads(room_data_str))
        
        # Sort by most recent activity
        return sorted(user_private_rooms, key=lambda x: x.get("created_at", ""), reverse=True)

    async def join_room(self, ghost_id: str, room_id: str) -> None:
        await self.redis.sadd(f"room_members:{room_id}", ghost_id)
        await self.redis.expire(f"room_members:{room_id}", self.ROOM_TTL)
        
        participant_count = await self.redis.scard(f"room_members:{room_id}")
        
        room_data_str = await self.redis.get(f"rooms:{room_id}")
        if room_data_str:
            room_data = json.loads(room_data_str)
            room_data["participant_count"] = participant_count
            await self.redis.setex(
                f"rooms:{room_id}",
                self.ROOM_TTL,
                json.dumps(room_data)
            )
        
        logger.info(f"Ghost {ghost_id} joined room {room_id}")

    async def leave_room(self, ghost_id: str, room_id: str) -> None:
        await self.redis.srem(f"room_members:{room_id}", ghost_id)
        
        participant_count = await self.redis.scard(f"room_members:{room_id}")
        
        # Get room info to check if it's public/persistent
        room_data_str = await self.redis.get(f"rooms:{room_id}")
        if room_data_str:
            room_data = json.loads(room_data_str)
            room_data["participant_count"] = participant_count
            
            # Only delete room if it's private AND has no members
            # Public rooms persist even when empty
            if participant_count == 0 and not room_data.get("is_public", False):
                await self.delete_room(room_id)
            else:
                # Update room data - public rooms persist indefinitely
                if room_data.get("is_public", False):
                    await self.redis.set(f"rooms:{room_id}", json.dumps(room_data))
                else:
                    await self.redis.setex(
                        f"rooms:{room_id}",
                        self.ROOM_TTL,
                        json.dumps(room_data)
                    )
        
        logger.info(f"Ghost {ghost_id} left room {room_id}")

    async def get_room_members(self, room_id: str) -> Set[str]:
        members = await self.redis.smembers(f"room_members:{room_id}")
        return set(members)

    async def get_all_rooms(self) -> List[Dict]:
        room_ids = await self.redis.smembers("all_rooms")
        rooms = []
        
        for room_id in room_ids:
            room_data_str = await self.redis.get(f"rooms:{room_id}")
            if room_data_str:
                rooms.append(json.loads(room_data_str))
        
        return sorted(rooms, key=lambda x: x.get("participant_count", 0), reverse=True)

    async def delete_room(self, room_id: str) -> None:
        pipeline = self.redis.pipeline()
        pipeline.delete(f"rooms:{room_id}")
        pipeline.delete(f"room_members:{room_id}")
        pipeline.delete(f"room_messages:{room_id}")
        pipeline.srem("all_rooms", room_id)
        
        message_keys = await self.redis.keys(f"messages:{room_id}:*")
        if message_keys:
            pipeline.delete(*message_keys)
        
        await pipeline.execute()
        logger.info(f"Room {room_id} deleted completely")

    async def delete_ghost_data(self, ghost_id: str) -> None:
        pipeline = self.redis.pipeline()
        
        ghost_keys = await self.redis.keys(f"*{ghost_id}*")
        if ghost_keys:
            pipeline.delete(*ghost_keys)
        
        pipeline.srem("active_users", ghost_id)
        
        all_rooms = await self.redis.smembers("all_rooms")
        for room_id in all_rooms:
            pipeline.srem(f"room_members:{room_id}", ghost_id)
        
        await pipeline.execute()
        logger.info(f"All data for ghost {ghost_id} deleted")

    async def get_active_ghost_count(self) -> int:
        return await self.redis.scard("active_users")

    async def get_room_count(self) -> int:
        return await self.redis.scard("all_rooms")

    async def delete_user_messages_from_room(self, ghost_id: str, room_id: str) -> int:
        """Delete all messages by a specific user from a room"""
        message_keys = await self.redis.lrange(f"room_messages:{room_id}", 0, -1)
        deleted_count = 0
        
        for message_key in message_keys:
            message_data_str = await self.redis.get(message_key)
            if message_data_str:
                message_data = json.loads(message_data_str)
                if message_data.get('sender') == ghost_id:
                    await self.redis.delete(message_key)
                    await self.redis.lrem(f"room_messages:{room_id}", 1, message_key)
                    deleted_count += 1
        
        logger.info(f"Deleted {deleted_count} messages by {ghost_id} from room {room_id}")
        return deleted_count

    async def delete_user_data_from_all_rooms(self, ghost_id: str) -> int:
        """Delete all messages by a user from all rooms they've participated in"""
        all_rooms = await self.redis.smembers("all_rooms")
        total_deleted = 0
        
        for room_id in all_rooms:
            deleted_count = await self.delete_user_messages_from_room(ghost_id, room_id)
            total_deleted += deleted_count
        
        logger.info(f"Deleted total {total_deleted} messages by {ghost_id} from all rooms")
        return total_deleted

    async def get_user_message_count_in_room(self, ghost_id: str, room_id: str) -> int:
        """Get count of messages by a user in a specific room"""
        message_keys = await self.redis.lrange(f"room_messages:{room_id}", 0, -1)
        user_message_count = 0
        
        for message_key in message_keys:
            message_data_str = await self.redis.get(message_key)
            if message_data_str:
                message_data = json.loads(message_data_str)
                if message_data.get('sender') == ghost_id:
                    user_message_count += 1
        
        return user_message_count

    async def get_user_rooms(self, ghost_id: str) -> set:
        """Get all rooms that a user is currently a member of (public and private)"""
        user_rooms = set()
        
        # Check public rooms
        all_public_rooms = await self.redis.smembers("all_rooms")
        for room_id in all_public_rooms:
            is_member = await self.redis.sismember(f"room_members:{room_id}", ghost_id)
            if is_member:
                user_rooms.add(room_id)
        
        # Check private rooms
        all_private_rooms = await self.redis.smembers("private_rooms")
        for room_id in all_private_rooms:
            is_member = await self.redis.sismember(f"room_members:{room_id}", ghost_id)
            if is_member:
                user_rooms.add(room_id)
        
        return user_rooms

    async def cleanup_expired_data(self) -> None:
        all_rooms = await self.redis.smembers("all_rooms")
        for room_id in all_rooms:
            room_data_str = await self.redis.get(f"rooms:{room_id}")
            if not room_data_str:
                await self.redis.srem("all_rooms", room_id)
        
        logger.info("Completed Redis cleanup")