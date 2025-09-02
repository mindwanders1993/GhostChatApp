import asyncio
import logging
from typing import List
from redis_manager import RedisManager

logger = logging.getLogger(__name__)

class DestructionEngine:
    def __init__(self, redis_manager: RedisManager):
        self.redis_manager = redis_manager
        self.cleanup_interval = 300  # 5 minutes
        self.running = False

    async def destroy_ghost_completely(self, ghost_id: str) -> None:
        try:
            logger.info(f"Initiating complete destruction for ghost {ghost_id}")
            
            await self.redis_manager.delete_ghost_data(ghost_id)
            
            logger.info(f"Ghost {ghost_id} completely destroyed - all traces removed")
            
        except Exception as e:
            logger.error(f"Failed to destroy ghost {ghost_id}: {e}")
            raise

    async def emergency_destruction(self) -> None:
        try:
            logger.warning("EMERGENCY DESTRUCTION INITIATED - All data will be purged")
            
            await self.redis_manager.redis.flushall()
            
            logger.warning("EMERGENCY DESTRUCTION COMPLETE - All data purged")
            
        except Exception as e:
            logger.error(f"Emergency destruction failed: {e}")
            raise

    async def start_cleanup_task(self) -> None:
        if self.running:
            logger.warning("Cleanup task already running")
            return
            
        self.running = True
        logger.info("Starting continuous cleanup task")
        
        while self.running:
            try:
                await self._perform_cleanup()
                await asyncio.sleep(self.cleanup_interval)
                
            except asyncio.CancelledError:
                logger.info("Cleanup task cancelled")
                break
            except Exception as e:
                logger.error(f"Cleanup task error: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retry

    async def stop_cleanup_task(self) -> None:
        self.running = False
        logger.info("Cleanup task stopped")

    async def _perform_cleanup(self) -> None:
        try:
            await self.redis_manager.cleanup_expired_data()
            
            await self._cleanup_orphaned_rooms()
            await self._cleanup_empty_sets()
            await self._cleanup_orphaned_reactions()
            
            logger.info("Cleanup cycle completed")
            
        except Exception as e:
            logger.error(f"Cleanup cycle failed: {e}")

    async def _cleanup_orphaned_rooms(self) -> None:
        all_rooms = await self.redis_manager.redis.smembers("all_rooms")
        rooms_to_remove = []
        
        for room_id in all_rooms:
            room_exists = await self.redis_manager.redis.exists(f"rooms:{room_id}")
            if not room_exists:
                rooms_to_remove.append(room_id)
        
        if rooms_to_remove:
            await self.redis_manager.redis.srem("all_rooms", *rooms_to_remove)
            logger.info(f"Removed {len(rooms_to_remove)} orphaned room references")

    async def _cleanup_empty_sets(self) -> None:
        all_rooms = await self.redis_manager.redis.smembers("all_rooms")
        
        for room_id in all_rooms:
            member_count = await self.redis_manager.redis.scard(f"room_members:{room_id}")
            if member_count == 0:
                # Check if this is a public room - if so, preserve it
                room_data_str = await self.redis_manager.redis.get(f"rooms:{room_id}")
                if room_data_str:
                    import json
                    room_data = json.loads(room_data_str)
                    # Don't delete public rooms or private rooms even if they're empty
                    if room_data.get("is_public", False) or room_data.get("is_private", False):
                        continue
                        
                await self.redis_manager.delete_room(room_id)

    async def _cleanup_orphaned_reactions(self) -> None:
        """Clean up reactions for messages that no longer exist"""
        try:
            # Get all reaction keys
            reaction_keys = await self.redis_manager.redis.keys("reactions:*")
            display_keys = await self.redis_manager.redis.keys("reaction_names:*")
            
            orphaned_reactions = 0
            orphaned_displays = 0
            
            # Clean up reaction keys
            for key in reaction_keys:
                # Extract message ID from key: reactions:message_id:emoji
                parts = key.split(':')
                if len(parts) >= 2:
                    message_id = parts[1]
                    
                    # Check if the message still exists
                    message_keys = await self.redis_manager.redis.keys(f"messages:*:{message_id}")
                    if not message_keys:
                        # Message doesn't exist, remove the reaction
                        await self.redis_manager.redis.delete(key)
                        orphaned_reactions += 1
            
            # Clean up display name keys
            for key in display_keys:
                # Extract message ID from key: reaction_names:message_id:emoji
                parts = key.split(':')
                if len(parts) >= 2:
                    message_id = parts[1]
                    
                    # Check if the message still exists
                    message_keys = await self.redis_manager.redis.keys(f"messages:*:{message_id}")
                    if not message_keys:
                        # Message doesn't exist, remove the display names
                        await self.redis_manager.redis.delete(key)
                        orphaned_displays += 1
            
            if orphaned_reactions > 0 or orphaned_displays > 0:
                logger.info(f"Cleaned up {orphaned_reactions} orphaned reactions and {orphaned_displays} display mappings")
                
        except Exception as e:
            logger.error(f"Error cleaning up orphaned reactions: {e}")

    async def get_destruction_report(self) -> dict:
        try:
            active_ghosts = await self.redis_manager.get_active_ghost_count()
            total_rooms = await self.redis_manager.get_room_count()
            
            # Get key counts for different data types
            user_keys = await self.redis_manager.redis.keys("users:*")
            message_keys = await self.redis_manager.redis.keys("messages:*")
            room_keys = await self.redis_manager.redis.keys("rooms:*")
            
            return {
                "active_ghosts": active_ghosts,
                "total_rooms": total_rooms,
                "user_sessions": len(user_keys),
                "stored_messages": len(message_keys),
                "room_metadata": len(room_keys),
                "cleanup_interval_seconds": self.cleanup_interval,
                "destruction_engine_active": self.running,
                "message": "All data has expiration times - nothing persists beyond TTL"
            }
            
        except Exception as e:
            logger.error(f"Failed to generate destruction report: {e}")
            return {
                "error": "Could not generate destruction report",
                "message": "Destruction engine may be experiencing issues"
            }

    async def verify_ghost_destruction(self, ghost_id: str) -> dict:
        try:
            # Search for any remaining traces of the ghost
            ghost_keys = await self.redis_manager.redis.keys(f"*{ghost_id}*")
            
            is_in_active_users = await self.redis_manager.redis.sismember("active_users", ghost_id)
            
            # Check if ghost is in any room member lists
            all_rooms = await self.redis_manager.redis.smembers("all_rooms")
            rooms_with_ghost = []
            
            for room_id in all_rooms:
                is_member = await self.redis_manager.redis.sismember(f"room_members:{room_id}", ghost_id)
                if is_member:
                    rooms_with_ghost.append(room_id)
            
            destruction_complete = (
                len(ghost_keys) == 0 and 
                not is_in_active_users and 
                len(rooms_with_ghost) == 0
            )
            
            return {
                "ghost_id": ghost_id,
                "destruction_complete": destruction_complete,
                "remaining_keys": len(ghost_keys),
                "in_active_users": is_in_active_users,
                "rooms_with_membership": rooms_with_ghost,
                "verification_timestamp": asyncio.get_event_loop().time()
            }
            
        except Exception as e:
            logger.error(f"Failed to verify ghost destruction for {ghost_id}: {e}")
            return {
                "ghost_id": ghost_id,
                "destruction_complete": False,
                "error": str(e)
            }

    async def schedule_delayed_destruction(self, ghost_id: str, delay_seconds: int) -> None:
        logger.info(f"Scheduling delayed destruction for {ghost_id} in {delay_seconds} seconds")
        
        async def delayed_destroy():
            await asyncio.sleep(delay_seconds)
            await self.destroy_ghost_completely(ghost_id)
        
        asyncio.create_task(delayed_destroy())

    async def force_ttl_expiration(self, pattern: str = "*") -> dict:
        try:
            keys_to_expire = await self.redis_manager.redis.keys(pattern)
            expired_count = 0
            
            for key in keys_to_expire:
                await self.redis_manager.redis.expire(key, 1)  # Expire in 1 second
                expired_count += 1
            
            logger.warning(f"Forced TTL expiration on {expired_count} keys matching pattern: {pattern}")
            
            return {
                "forced_expiration": True,
                "keys_affected": expired_count,
                "pattern": pattern,
                "warning": "Data will expire in 1 second"
            }
            
        except Exception as e:
            logger.error(f"Failed to force TTL expiration: {e}")
            return {
                "forced_expiration": False,
                "error": str(e)
            }