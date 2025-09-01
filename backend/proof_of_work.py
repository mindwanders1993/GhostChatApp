import hashlib
import secrets
import time
import asyncio
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class ProofOfWorkManager:
    def __init__(self, difficulty: int = 4, ttl: int = 300):
        self.difficulty = difficulty  # Number of leading zeros required
        self.ttl = ttl  # Challenge TTL in seconds (5 minutes)
        self.challenges: Dict[str, Dict] = {}
        self.cleanup_task = None

    def start_cleanup(self):
        if not self.cleanup_task:
            self.cleanup_task = asyncio.create_task(self._cleanup_expired_challenges())

    async def generate_challenge(self, ghost_id: str) -> Dict[str, any]:
        challenge_id = secrets.token_hex(16)
        random_data = secrets.token_hex(32)
        timestamp = int(time.time())
        
        challenge_data = {
            "challenge_id": challenge_id,
            "ghost_id": ghost_id,
            "random_data": random_data,
            "difficulty": self.difficulty,
            "timestamp": timestamp,
            "expires_at": timestamp + self.ttl
        }
        
        self.challenges[challenge_id] = challenge_data
        
        logger.info(f"Generated PoW challenge for ghost {ghost_id} with difficulty {self.difficulty}")
        
        return {
            "challenge_id": challenge_id,
            "random_data": random_data,
            "difficulty": self.difficulty,
            "expires_in": self.ttl,
            "target": "0" * self.difficulty,
            "instructions": f"Find a nonce such that sha256(random_data + nonce) starts with {self.difficulty} zeros"
        }

    async def verify_solution(self, ghost_id: str, solution: Dict) -> bool:
        try:
            challenge_id = solution.get("challenge_id")
            nonce = solution.get("nonce")
            
            if not challenge_id or not nonce:
                logger.warning(f"Invalid solution format from ghost {ghost_id}")
                return False
            
            if challenge_id not in self.challenges:
                logger.warning(f"Challenge {challenge_id} not found for ghost {ghost_id}")
                return False
            
            challenge_data = self.challenges[challenge_id]
            
            if challenge_data["ghost_id"] != ghost_id:
                logger.warning(f"Ghost ID mismatch for challenge {challenge_id}")
                return False
            
            current_time = int(time.time())
            if current_time > challenge_data["expires_at"]:
                logger.warning(f"Expired challenge {challenge_id} from ghost {ghost_id}")
                del self.challenges[challenge_id]
                return False
            
            # Verify the proof of work
            random_data = challenge_data["random_data"]
            combined_data = f"{random_data}{nonce}"
            hash_result = hashlib.sha256(combined_data.encode()).hexdigest()
            
            required_zeros = "0" * self.difficulty
            is_valid = hash_result.startswith(required_zeros)
            
            if is_valid:
                logger.info(f"Valid PoW solution from ghost {ghost_id} for challenge {challenge_id}")
                del self.challenges[challenge_id]  # Remove used challenge
            else:
                logger.warning(f"Invalid PoW solution from ghost {ghost_id} for challenge {challenge_id}")
            
            return is_valid
            
        except Exception as e:
            logger.error(f"Error verifying PoW solution from ghost {ghost_id}: {e}")
            return False

    async def is_solution_required(self, ghost_id: str) -> bool:
        # For MVP, we'll require PoW for all message sends
        # In production, this could be based on rate limiting or suspicious activity
        return True

    async def get_challenge_stats(self) -> Dict:
        current_time = int(time.time())
        active_challenges = len([
            c for c in self.challenges.values() 
            if c["expires_at"] > current_time
        ])
        expired_challenges = len(self.challenges) - active_challenges
        
        return {
            "active_challenges": active_challenges,
            "expired_challenges": expired_challenges,
            "difficulty": self.difficulty,
            "ttl_seconds": self.ttl,
            "target_solve_time": f"~{2 ** (self.difficulty - 1)} attempts"
        }

    async def adjust_difficulty(self, new_difficulty: int) -> None:
        if 1 <= new_difficulty <= 8:  # Reasonable range
            old_difficulty = self.difficulty
            self.difficulty = new_difficulty
            logger.info(f"PoW difficulty adjusted from {old_difficulty} to {new_difficulty}")
        else:
            logger.warning(f"Invalid difficulty level: {new_difficulty}. Must be between 1 and 8")

    async def _cleanup_expired_challenges(self) -> None:
        while True:
            try:
                current_time = int(time.time())
                expired_challenges = []
                
                for challenge_id, challenge_data in self.challenges.items():
                    if current_time > challenge_data["expires_at"]:
                        expired_challenges.append(challenge_id)
                
                for challenge_id in expired_challenges:
                    del self.challenges[challenge_id]
                
                if expired_challenges:
                    logger.info(f"Cleaned up {len(expired_challenges)} expired PoW challenges")
                
                await asyncio.sleep(60)  # Cleanup every minute
                
            except asyncio.CancelledError:
                logger.info("PoW cleanup task cancelled")
                break
            except Exception as e:
                logger.error(f"PoW cleanup error: {e}")
                await asyncio.sleep(60)

    def stop_cleanup(self):
        if self.cleanup_task:
            self.cleanup_task.cancel()
            self.cleanup_task = None

    async def create_adaptive_challenge(self, ghost_id: str, recent_activity: int = 0) -> Dict[str, any]:
        # Adaptive difficulty based on recent activity (simple implementation)
        adaptive_difficulty = self.difficulty
        
        if recent_activity > 10:  # High activity
            adaptive_difficulty = min(self.difficulty + 1, 6)
        elif recent_activity > 5:  # Medium activity  
            adaptive_difficulty = self.difficulty
        else:  # Low activity
            adaptive_difficulty = max(self.difficulty - 1, 2)
        
        challenge_id = secrets.token_hex(16)
        random_data = secrets.token_hex(32)
        timestamp = int(time.time())
        
        challenge_data = {
            "challenge_id": challenge_id,
            "ghost_id": ghost_id,
            "random_data": random_data,
            "difficulty": adaptive_difficulty,
            "timestamp": timestamp,
            "expires_at": timestamp + self.ttl,
            "adaptive": True
        }
        
        self.challenges[challenge_id] = challenge_data
        
        logger.info(f"Generated adaptive PoW challenge for ghost {ghost_id} with difficulty {adaptive_difficulty}")
        
        return {
            "challenge_id": challenge_id,
            "random_data": random_data,
            "difficulty": adaptive_difficulty,
            "expires_in": self.ttl,
            "target": "0" * adaptive_difficulty,
            "adaptive": True,
            "instructions": f"Find a nonce such that sha256(random_data + nonce) starts with {adaptive_difficulty} zeros"
        }