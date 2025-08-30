import asyncio
import json
import hashlib
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from app.models.user import User, MatchingPreferences
from app.database import get_redis
from app.services.chat_service import ChatService
import logging
import uuid

logger = logging.getLogger(__name__)

class MatchingService:
    """User matching service for anonymous chat"""
    
    matching_timeout = 30  # seconds
    max_queue_time = 300   # 5 minutes max in queue
    
    @staticmethod
    async def find_match(
        db,
        user_id: str,
        preferences: MatchingPreferences
    ) -> Dict[str, Any]:
        """Find a match for user based on preferences"""
        try:
            redis = await get_redis()
            
            # Create preference hash for matching
            pref_hash = MatchingService._hash_preferences(preferences)
            
            # Check if user is already in queue
            existing_queue = await redis.get(f"matching_user:{user_id}")
            if existing_queue:
                return {"status": "already_searching", "message": "Already searching for match"}
            
            # Look for existing matches in queue
            match_found = await MatchingService._find_existing_match(pref_hash, user_id)
            
            if match_found:
                # Create chat room and return match info
                room_id = await MatchingService._create_match_room(
                    user_id, 
                    match_found["user_id"], 
                    db
                )
                
                return {
                    "status": "found",
                    "match_id": str(uuid.uuid4()),
                    "partner": {
                        "anonymous_id": match_found.get("anonymous_id", "anonymous"),
                        "nickname": match_found.get("nickname", "Anonymous User")
                    },
                    "room_id": room_id
                }
            else:
                # Add to matching queue
                await MatchingService._add_to_queue(user_id, preferences, pref_hash)
                
                return {
                    "status": "searching",
                    "estimated_wait": 15,  # seconds
                    "message": "Searching for compatible partner..."
                }
                
        except Exception as e:
            logger.error(f"Matching failed for user {user_id}: {str(e)}")
            return {
                "status": "error",
                "message": "Matching service temporarily unavailable"
            }
    
    @staticmethod
    async def cancel_matching(db, user_id: str) -> bool:
        """Cancel user's matching request"""
        try:
            redis = await get_redis()
            
            # Remove from user matching
            user_queue = await redis.get(f"matching_user:{user_id}")
            if user_queue:
                queue_data = json.loads(user_queue)
                pref_hash = queue_data.get("preference_hash")
                
                # Remove from preference queue
                if pref_hash:
                    await redis.lrem(f"matching_queue:{pref_hash}", 1, user_id)
                
                # Remove user queue entry
                await redis.delete(f"matching_user:{user_id}")
                
                logger.info(f"Cancelled matching for user {user_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to cancel matching for user {user_id}: {str(e)}")
            return False
    
    @staticmethod
    async def get_matching_status(db, user_id: str) -> Dict[str, Any]:
        """Get current matching status for user"""
        try:
            redis = await get_redis()
            
            user_queue = await redis.get(f"matching_user:{user_id}")
            if not user_queue:
                return {"status": "not_searching"}
            
            queue_data = json.loads(user_queue)
            started_at = datetime.fromisoformat(queue_data["started_at"])
            elapsed = (datetime.utcnow() - started_at).seconds
            
            # Check for timeout
            if elapsed > MatchingService.max_queue_time:
                await MatchingService.cancel_matching(db, user_id)
                return {
                    "status": "timeout",
                    "message": "No compatible partners found. Please try again."
                }
            
            return {
                "status": "searching",
                "elapsed_seconds": elapsed,
                "estimated_remaining": max(0, 30 - elapsed)
            }
            
        except Exception as e:
            logger.error(f"Failed to get matching status for user {user_id}: {str(e)}")
            return {"status": "error"}
    
    @staticmethod
    async def _find_existing_match(pref_hash: str, current_user_id: str) -> Optional[Dict[str, Any]]:
        """Find existing user in queue with compatible preferences"""
        try:
            redis = await get_redis()
            
            # Check direct preference match
            queue_key = f"matching_queue:{pref_hash}"
            potential_match = await redis.lpop(queue_key)
            
            if potential_match and potential_match != current_user_id:
                # Get match user data
                match_data = await redis.get(f"matching_user:{potential_match}")
                if match_data:
                    # Remove match from their queue
                    await redis.delete(f"matching_user:{potential_match}")
                    
                    match_info = json.loads(match_data)
                    return {
                        "user_id": potential_match,
                        "anonymous_id": match_info.get("anonymous_id"),
                        "nickname": match_info.get("nickname"),
                        "preferences": match_info.get("preferences")
                    }
            
            # If no direct match, try compatible preferences
            # This could be expanded with more sophisticated matching logic
            compatible_hashes = MatchingService._get_compatible_preference_hashes(pref_hash)
            
            for comp_hash in compatible_hashes:
                comp_queue_key = f"matching_queue:{comp_hash}"
                potential_match = await redis.lpop(comp_queue_key)
                
                if potential_match and potential_match != current_user_id:
                    match_data = await redis.get(f"matching_user:{potential_match}")
                    if match_data:
                        await redis.delete(f"matching_user:{potential_match}")
                        
                        match_info = json.loads(match_data)
                        return {
                            "user_id": potential_match,
                            "anonymous_id": match_info.get("anonymous_id"),
                            "nickname": match_info.get("nickname"),
                            "preferences": match_info.get("preferences")
                        }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to find existing match: {str(e)}")
            return None
    
    @staticmethod
    async def _add_to_queue(user_id: str, preferences: MatchingPreferences, pref_hash: str):
        """Add user to matching queue"""
        try:
            redis = await get_redis()
            
            # Store user in matching queue
            queue_data = {
                "user_id": user_id,
                "anonymous_id": f"anon_{user_id[:8]}",  # Mock anonymous ID
                "nickname": f"User_{user_id[:8]}",      # Mock nickname
                "preferences": preferences.dict(),
                "preference_hash": pref_hash,
                "started_at": datetime.utcnow().isoformat()
            }
            
            # Store user data
            await redis.setex(
                f"matching_user:{user_id}",
                MatchingService.max_queue_time,
                json.dumps(queue_data)
            )
            
            # Add to preference-based queue
            await redis.lpush(f"matching_queue:{pref_hash}", user_id)
            await redis.expire(f"matching_queue:{pref_hash}", MatchingService.max_queue_time)
            
            logger.info(f"Added user {user_id} to matching queue")
            
        except Exception as e:
            logger.error(f"Failed to add user {user_id} to queue: {str(e)}")
            raise
    
    @staticmethod
    async def _create_match_room(user1_id: str, user2_id: str, db) -> str:
        """Create a private chat room for matched users"""
        try:
            # This would use the actual ChatService in production
            room_id = str(uuid.uuid4())
            
            # TODO: Create actual room using ChatService.create_room()
            # For now, return mock room ID
            
            logger.info(f"Created match room {room_id} for users {user1_id} and {user2_id}")
            return room_id
            
        except Exception as e:
            logger.error(f"Failed to create match room: {str(e)}")
            raise
    
    @staticmethod
    def _hash_preferences(preferences: MatchingPreferences) -> str:
        """Create hash for preferences to group similar users"""
        # Normalize preferences for hashing
        normalized = {
            "age_range_start": preferences.age_range[0] // 5 * 5,  # Round to nearest 5
            "age_range_end": preferences.age_range[1] // 5 * 5,
            "language": preferences.language,
            "interests": sorted(preferences.interests[:3])  # Take first 3 interests
        }
        
        pref_string = json.dumps(normalized, sort_keys=True)
        return hashlib.md5(pref_string.encode()).hexdigest()[:8]
    
    @staticmethod
    def _get_compatible_preference_hashes(base_hash: str) -> List[str]:
        """Get list of compatible preference hashes for broader matching"""
        # This is a simplified implementation
        # In production, this would implement more sophisticated compatibility logic
        
        compatible_hashes = []
        
        # For demo, just return some variations
        # Real implementation would calculate based on preference similarity
        base_chars = list(base_hash)
        
        # Create variations by changing 1-2 characters
        for i in range(min(2, len(base_chars))):
            variation = base_chars.copy()
            variation[i] = 'x' if variation[i] != 'x' else 'y'
            compatible_hashes.append(''.join(variation))
        
        return compatible_hashes[:3]  # Limit to 3 variations
    
    @staticmethod
    async def get_queue_statistics() -> Dict[str, Any]:
        """Get matching queue statistics"""
        try:
            redis = await get_redis()
            
            # Get all matching user keys
            user_keys = await redis.keys("matching_user:*")
            
            # Get all queue keys
            queue_keys = await redis.keys("matching_queue:*")
            
            total_users_waiting = len(user_keys)
            total_preference_queues = len(queue_keys)
            
            # Calculate average wait times (simplified)
            total_wait_time = 0
            valid_waits = 0
            
            for user_key in user_keys[:20]:  # Sample for performance
                try:
                    user_data = await redis.get(user_key)
                    if user_data:
                        data = json.loads(user_data)
                        started_at = datetime.fromisoformat(data["started_at"])
                        wait_time = (datetime.utcnow() - started_at).seconds
                        total_wait_time += wait_time
                        valid_waits += 1
                except Exception:
                    continue
            
            avg_wait_time = (total_wait_time / valid_waits) if valid_waits > 0 else 0
            
            return {
                "users_in_queue": total_users_waiting,
                "preference_groups": total_preference_queues,
                "average_wait_seconds": round(avg_wait_time, 1),
                "queue_health": "good" if avg_wait_time < 60 else "slow"
            }
            
        except Exception as e:
            logger.error(f"Failed to get queue statistics: {str(e)}")
            return {"error": "Failed to retrieve statistics"}
    
    @staticmethod
    async def cleanup_expired_queue_entries(db):
        """Clean up expired queue entries (background task)"""
        try:
            redis = await get_redis()
            
            # Get all user matching entries
            user_keys = await redis.keys("matching_user:*")
            
            expired_count = 0
            for user_key in user_keys:
                try:
                    user_data = await redis.get(user_key)
                    if user_data:
                        data = json.loads(user_data)
                        started_at = datetime.fromisoformat(data["started_at"])
                        
                        # Remove entries older than max queue time
                        if (datetime.utcnow() - started_at).seconds > MatchingService.max_queue_time:
                            user_id = data["user_id"]
                            await MatchingService.cancel_matching(db, user_id)
                            expired_count += 1
                            
                except Exception as e:
                    logger.warning(f"Failed to process queue entry {user_key}: {str(e)}")
                    continue
            
            if expired_count > 0:
                logger.info(f"Cleaned up {expired_count} expired queue entries")
                
        except Exception as e:
            logger.error(f"Queue cleanup failed: {str(e)}")

# Create global matching service instance
matching_service = MatchingService()