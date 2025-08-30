import re
import asyncio
import hashlib
from typing import List, Dict, Optional, Any
import aiohttp
from datetime import datetime
from app.models.moderation import ModerationResult, ContentAnalysis
from app.config import settings
from app.database import get_redis
import logging

logger = logging.getLogger(__name__)

class ProfanityFilter:
    """Basic profanity filter"""
    
    def __init__(self):
        # Basic profanity word list (extend this in production)
        self.profane_words = {
            'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard',
            'cunt', 'whore', 'slut', 'fag', 'retard', 'nigger'
        }
        
        # Severity levels
        self.severity_map = {
            'mild': ['damn', 'shit'],
            'moderate': ['fuck', 'bitch', 'asshole', 'bastard'],
            'severe': ['cunt', 'whore', 'slut', 'fag', 'retard', 'nigger']
        }
    
    def analyze(self, text: str) -> float:
        """Analyze text for profanity, return score 0-1"""
        if not text:
            return 0.0
        
        text_lower = text.lower()
        words = re.findall(r'\b\w+\b', text_lower)
        
        profane_count = 0
        max_severity = 0
        
        for word in words:
            if word in self.profane_words:
                profane_count += 1
                
                # Determine severity
                if word in self.severity_map['severe']:
                    max_severity = max(max_severity, 3)
                elif word in self.severity_map['moderate']:
                    max_severity = max(max_severity, 2)
                elif word in self.severity_map['mild']:
                    max_severity = max(max_severity, 1)
        
        if profane_count == 0:
            return 0.0
        
        # Calculate score based on frequency and severity
        frequency_score = min(profane_count / len(words), 1.0)
        severity_score = max_severity / 3.0
        
        return min(frequency_score * 0.5 + severity_score * 0.5, 1.0)

class SpamDetector:
    """Spam detection service"""
    
    def __init__(self):
        self.spam_patterns = [
            r'(?i)(https?://|www\.)\S+',  # URLs
            r'(?i)\b(\w+\.){2,}\w+\b',    # Multiple dots (spam pattern)
            r'(?i)(.)\1{5,}',             # Repeated characters
            r'(?i)\b(buy|sell|cheap|free|money|click|visit)\b.*\b(now|here|link)\b',  # Commercial spam
            r'(?i)\b(urgent|limited|offer|deal)\b',  # Urgency spam
        ]
    
    def analyze(self, text: str) -> float:
        """Analyze text for spam patterns, return score 0-1"""
        if not text:
            return 0.0
        
        spam_indicators = 0
        total_patterns = len(self.spam_patterns)
        
        for pattern in self.spam_patterns:
            if re.search(pattern, text):
                spam_indicators += 1
        
        return spam_indicators / total_patterns if total_patterns > 0 else 0

class ToxicityClassifier:
    """Mock toxicity classifier (replace with real AI service)"""
    
    def __init__(self):
        # Toxic patterns for basic detection
        self.toxic_patterns = [
            r'(?i)\b(kill\s+yourself|suicide|die)\b',
            r'(?i)\b(hate\s+you|stupid|idiot|moron)\b',
            r'(?i)\b(threat|threaten|harm|hurt)\b.*\b(you|family)\b',
            r'(?i)\b(doxx|dox|address|phone)\b',
        ]
    
    async def classify(self, text: str) -> Dict[str, float]:
        """Classify text toxicity (mock implementation)"""
        toxicity_score = 0.0
        
        for pattern in self.toxic_patterns:
            if re.search(pattern, text):
                toxicity_score += 0.3
        
        return {
            "toxicity": min(toxicity_score, 1.0),
            "severe_toxicity": min(toxicity_score * 1.5, 1.0),
            "identity_attack": 0.0,
            "insult": min(toxicity_score * 0.8, 1.0),
            "threat": min(toxicity_score * 1.2, 1.0)
        }

class ImageModerator:
    """Image moderation service (mock implementation)"""
    
    async def moderate_image(self, image_data: bytes) -> ModerationResult:
        """Moderate image content"""
        # This is a mock implementation
        # In production, integrate with AWS Rekognition or similar
        
        # Generate hash for caching
        image_hash = hashlib.md5(image_data).hexdigest()
        
        # Check cache first
        redis = await get_redis()
        cached_result = await redis.get(f"image_moderation:{image_hash}")
        
        if cached_result:
            import json
            result_data = json.loads(cached_result)
            return ModerationResult(**result_data)
        
        # Mock analysis (always safe for demo)
        result = ModerationResult(
            is_safe=True,
            confidence=0.9,
            reasons=[],
            action="allow"
        )
        
        # Cache result for 1 hour
        await redis.setex(
            f"image_moderation:{image_hash}",
            3600,
            result.json()
        )
        
        return result

class ModerationService:
    """Main moderation service"""
    
    def __init__(self):
        self.profanity_filter = ProfanityFilter()
        self.toxicity_model = ToxicityClassifier()
        self.spam_detector = SpamDetector()
        self.image_moderator = ImageModerator()
        self.cache_ttl = 3600  # 1 hour cache
    
    async def check_content(self, content: str) -> ModerationResult:
        """Comprehensive content moderation check"""
        if not content or not content.strip():
            return ModerationResult(is_safe=True, confidence=1.0, reasons=[], action="allow")
        
        # Check cache first
        content_hash = hashlib.sha256(content.encode()).hexdigest()
        redis = await get_redis()
        cached_result = await redis.get(f"moderation:{content_hash}")
        
        if cached_result:
            import json
            result_data = json.loads(cached_result)
            return ModerationResult(**result_data)
        
        # Run all checks in parallel
        try:
            results = await asyncio.gather(
                self._check_profanity(content),
                self._check_spam(content),
                self._check_toxicity(content),
                return_exceptions=True
            )
            
            profanity_score = results[0] if not isinstance(results[0], Exception) else 0
            spam_score = results[1] if not isinstance(results[1], Exception) else 0
            toxicity_score = results[2] if not isinstance(results[2], Exception) else 0
            
        except Exception as e:
            logger.error(f"Content moderation failed: {str(e)}")
            # Default to safe if moderation fails
            return ModerationResult(is_safe=True, confidence=0.0, reasons=["moderation_error"], action="allow")
        
        # Calculate overall score and determine action
        overall_score = max(profanity_score, spam_score, toxicity_score)
        
        result = ModerationResult(
            is_safe=overall_score < 0.5,
            confidence=overall_score,
            reasons=self._get_violation_reasons(profanity_score, spam_score, toxicity_score),
            action=self._determine_action(overall_score)
        )
        
        # Cache result
        await redis.setex(
            f"moderation:{content_hash}",
            self.cache_ttl,
            result.json()
        )
        
        return result
    
    async def _check_profanity(self, content: str) -> float:
        """Check for profanity and inappropriate language"""
        return self.profanity_filter.analyze(content)
    
    async def _check_spam(self, content: str) -> float:
        """Check for spam patterns"""
        return self.spam_detector.analyze(content)
    
    async def _check_toxicity(self, content: str) -> float:
        """Check toxicity using AI model"""
        try:
            result = await self.toxicity_model.classify(content)
            return result.get("toxicity", 0)
        except Exception as e:
            logger.error(f"Toxicity check failed: {str(e)}")
            return 0  # Default to safe if service fails
    
    def _get_violation_reasons(self, profanity: float, spam: float, toxicity: float) -> List[str]:
        """Get specific violation reasons"""
        reasons = []
        if profanity > 0.5:
            reasons.append("inappropriate_language")
        if spam > 0.5:
            reasons.append("spam_detected")
        if toxicity > 0.5:
            reasons.append("toxic_content")
        return reasons
    
    def _determine_action(self, score: float) -> str:
        """Determine moderation action based on score"""
        if score >= 0.9:
            return "block_user"
        elif score >= 0.7:
            return "filter_content"
        elif score >= 0.5:
            return "warn_user"
        else:
            return "allow"
    
    async def moderate_image(self, image_data: bytes) -> ModerationResult:
        """Moderate image content"""
        return await self.image_moderator.moderate_image(image_data)
    
    async def analyze_user_behavior(self, user_id: str, recent_messages: List[str]) -> Dict[str, Any]:
        """Analyze user behavior patterns"""
        if not recent_messages:
            return {"risk_score": 0.0, "patterns": []}
        
        # Calculate average moderation scores
        total_score = 0.0
        pattern_counts = {
            "profanity": 0,
            "spam": 0,
            "toxicity": 0
        }
        
        for message in recent_messages:
            result = await self.check_content(message)
            total_score += result.confidence
            
            for reason in result.reasons:
                if "inappropriate_language" in reason:
                    pattern_counts["profanity"] += 1
                elif "spam" in reason:
                    pattern_counts["spam"] += 1
                elif "toxic" in reason:
                    pattern_counts["toxicity"] += 1
        
        avg_score = total_score / len(recent_messages) if recent_messages else 0.0
        
        # Determine risk level
        risk_level = "low"
        if avg_score > 0.7:
            risk_level = "high"
        elif avg_score > 0.4:
            risk_level = "medium"
        
        return {
            "user_id": user_id,
            "risk_score": avg_score,
            "risk_level": risk_level,
            "message_count": len(recent_messages),
            "pattern_counts": pattern_counts,
            "recommended_action": self._determine_action(avg_score)
        }
    
    async def get_moderation_stats(self) -> Dict[str, Any]:
        """Get moderation statistics"""
        redis = await get_redis()
        
        try:
            # Get cache keys for moderation results
            moderation_keys = await redis.keys("moderation:*")
            
            total_checks = len(moderation_keys)
            safe_count = 0
            violation_types = {}
            
            for key in moderation_keys[:100]:  # Sample for performance
                try:
                    cached_result = await redis.get(key)
                    if cached_result:
                        import json
                        result = json.loads(cached_result)
                        
                        if result.get("is_safe"):
                            safe_count += 1
                        
                        for reason in result.get("reasons", []):
                            violation_types[reason] = violation_types.get(reason, 0) + 1
                            
                except Exception:
                    continue
            
            safety_rate = (safe_count / total_checks * 100) if total_checks > 0 else 100
            
            return {
                "total_content_checks": total_checks,
                "safety_rate_percentage": round(safety_rate, 2),
                "violation_breakdown": violation_types,
                "most_common_violation": max(violation_types.items(), key=lambda x: x[1])[0] if violation_types else None
            }
            
        except Exception as e:
            logger.error(f"Failed to get moderation stats: {str(e)}")
            return {"error": "Failed to retrieve statistics"}
    
    @staticmethod
    async def create_report(db, reporter_id: str, report_data) -> bool:
        """Create a new report"""
        try:
            from app.models.moderation import Report
            from sqlalchemy import select
            import uuid
            
            report = Report(
                reporter_id=uuid.UUID(reporter_id),
                reported_user_id=uuid.UUID(report_data.reported_user_id),
                message_id=uuid.UUID(report_data.message_id) if report_data.message_id else None,
                room_id=uuid.UUID(report_data.room_id) if report_data.room_id else None,
                reason=report_data.reason,
                description=report_data.description
            )
            
            db.add(report)
            await db.commit()
            
            logger.info(f"Report created by user {reporter_id} against {report_data.reported_user_id}")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to create report: {str(e)}")
            return False
    
    @staticmethod
    async def block_user(db, blocker_id: str, blocked_id: str, reason: str = None) -> bool:
        """Block a user"""
        try:
            from app.models.safety import UserBlock
            import uuid
            
            # Check if already blocked
            from sqlalchemy import select
            result = await db.execute(
                select(UserBlock).where(
                    UserBlock.blocker_id == uuid.UUID(blocker_id),
                    UserBlock.blocked_id == uuid.UUID(blocked_id)
                )
            )
            
            if result.scalar_one_or_none():
                return True  # Already blocked
            
            block = UserBlock(
                blocker_id=uuid.UUID(blocker_id),
                blocked_id=uuid.UUID(blocked_id),
                reason=reason
            )
            
            db.add(block)
            await db.commit()
            
            logger.info(f"User {blocker_id} blocked user {blocked_id}")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to block user: {str(e)}")
            return False
    
    @staticmethod
    async def get_user_blocks(db, user_id: str):
        """Get user's blocks"""
        try:
            from app.models.safety import UserBlock
            from sqlalchemy import select
            import uuid
            
            result = await db.execute(
                select(UserBlock).where(UserBlock.blocker_id == uuid.UUID(user_id))
            )
            return result.scalars().all()
            
        except Exception as e:
            logger.error(f"Failed to get user blocks: {str(e)}")
            return []
    
    @staticmethod
    async def unblock_user(db, blocker_id: str, block_id: str) -> bool:
        """Unblock a user"""
        try:
            from app.models.safety import UserBlock
            from sqlalchemy import select, delete
            import uuid
            
            await db.execute(
                delete(UserBlock).where(
                    UserBlock.id == uuid.UUID(block_id),
                    UserBlock.blocker_id == uuid.UUID(blocker_id)
                )
            )
            await db.commit()
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to unblock user: {str(e)}")
            return False

# Create global moderation service instance
moderation_service = ModerationService()