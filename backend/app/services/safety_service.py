"""
Safety Service
Handles user blocking, reporting, and safety features.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete, func, desc
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
from app.models.safety import UserBlock, UserReport, SafetyLog, BlockUserRequest, ReportUserRequest
from app.models.user import User
from app.models.message import Message
from app.database import get_redis
import logging
import uuid

logger = logging.getLogger(__name__)


class SafetyService:
    """Service for user safety, blocking, and reporting"""
    
    @staticmethod
    async def block_user(db: AsyncSession, blocker_id: str, blocked_id: str, reason: Optional[str] = None) -> UserBlock:
        """Block a user"""
        try:
            # Prevent self-blocking
            if blocker_id == blocked_id:
                raise ValueError("Cannot block yourself")
            
            # Check if already blocked
            existing_block = await db.execute(
                select(UserBlock).where(
                    and_(
                        UserBlock.blocker_id == uuid.UUID(blocker_id),
                        UserBlock.blocked_id == uuid.UUID(blocked_id)
                    )
                )
            )
            if existing_block.scalar_one_or_none():
                raise ValueError("User is already blocked")
            
            # Create block
            block = UserBlock(
                blocker_id=uuid.UUID(blocker_id),
                blocked_id=uuid.UUID(blocked_id),
                reason=reason
            )
            
            db.add(block)
            await db.flush()
            
            # Log the action
            safety_log = SafetyLog(
                user_id=uuid.UUID(blocker_id),
                action_type="block",
                target_id=uuid.UUID(blocked_id),
                reason=reason,
                safety_metadata={"block_id": str(block.id)}
            )
            db.add(safety_log)
            
            await db.commit()
            logger.info(f"User {blocker_id} blocked user {blocked_id}")
            return block
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to block user {blocked_id}: {str(e)}")
            raise
    
    @staticmethod
    async def unblock_user(db: AsyncSession, blocker_id: str, blocked_id: str) -> bool:
        """Unblock a user"""
        try:
            # Find and delete the block
            result = await db.execute(
                delete(UserBlock).where(
                    and_(
                        UserBlock.blocker_id == uuid.UUID(blocker_id),
                        UserBlock.blocked_id == uuid.UUID(blocked_id)
                    )
                )
            )
            
            if result.rowcount == 0:
                return False  # No block found
            
            # Log the action
            safety_log = SafetyLog(
                user_id=uuid.UUID(blocker_id),
                action_type="unblock",
                target_id=uuid.UUID(blocked_id),
                reason="User unblocked"
            )
            db.add(safety_log)
            
            await db.commit()
            logger.info(f"User {blocker_id} unblocked user {blocked_id}")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to unblock user {blocked_id}: {str(e)}")
            raise
    
    @staticmethod
    async def is_user_blocked(db: AsyncSession, blocker_id: str, blocked_id: str) -> bool:
        """Check if a user is blocked"""
        try:
            result = await db.execute(
                select(UserBlock).where(
                    and_(
                        UserBlock.blocker_id == uuid.UUID(blocker_id),
                        UserBlock.blocked_id == uuid.UUID(blocked_id)
                    )
                )
            )
            return result.scalar_one_or_none() is not None
            
        except Exception as e:
            logger.error(f"Failed to check block status: {str(e)}")
            return False
    
    @staticmethod
    async def get_blocked_users(db: AsyncSession, user_id: str, limit: int = 50) -> List[UserBlock]:
        """Get list of users blocked by a user"""
        try:
            result = await db.execute(
                select(UserBlock)
                .where(UserBlock.blocker_id == uuid.UUID(user_id))
                .order_by(desc(UserBlock.created_at))
                .limit(limit)
            )
            return result.scalars().all()
            
        except Exception as e:
            logger.error(f"Failed to get blocked users: {str(e)}")
            return []
    
    @staticmethod
    async def report_user(db: AsyncSession, reporter_id: str, report_data: ReportUserRequest) -> UserReport:
        """Report a user or message"""
        try:
            # Validate that either user or message is being reported
            if not report_data.reported_user_id and not report_data.reported_message_id:
                raise ValueError("Must report either a user or a message")
            
            # Create report
            report = UserReport(
                reporter_id=uuid.UUID(reporter_id),
                reported_user_id=uuid.UUID(report_data.reported_user_id) if report_data.reported_user_id else None,
                reported_message_id=uuid.UUID(report_data.reported_message_id) if report_data.reported_message_id else None,
                room_id=uuid.UUID(report_data.room_id) if report_data.room_id else None,
                report_type=report_data.report_type,
                reason=report_data.reason,
                report_metadata=report_data.metadata
            )
            
            db.add(report)
            await db.flush()
            
            # Log the action
            safety_log = SafetyLog(
                user_id=uuid.UUID(reporter_id),
                action_type="report",
                target_id=uuid.UUID(report_data.reported_user_id) if report_data.reported_user_id else uuid.UUID(report_data.reported_message_id),
                reason=report_data.reason,
                safety_metadata={"report_id": str(report.id), "report_type": report_data.report_type}
            )
            db.add(safety_log)
            
            await db.commit()
            logger.info(f"User {reporter_id} reported {report_data.report_type}: {report.id}")
            return report
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to create report: {str(e)}")
            raise
    
    @staticmethod
    async def get_user_reports(db: AsyncSession, user_id: str, limit: int = 50) -> List[UserReport]:
        """Get reports made by a user"""
        try:
            result = await db.execute(
                select(UserReport)
                .where(UserReport.reporter_id == uuid.UUID(user_id))
                .order_by(desc(UserReport.created_at))
                .limit(limit)
            )
            return result.scalars().all()
            
        except Exception as e:
            logger.error(f"Failed to get user reports: {str(e)}")
            return []
    
    @staticmethod
    async def get_safety_stats(db: AsyncSession, user_id: str) -> Dict[str, int]:
        """Get safety statistics for a user"""
        try:
            # Count blocks made by user
            blocks_result = await db.execute(
                select(func.count(UserBlock.id)).where(UserBlock.blocker_id == uuid.UUID(user_id))
            )
            user_blocked_count = blocks_result.scalar() or 0
            
            # Count reports made by user
            reports_result = await db.execute(
                select(func.count(UserReport.id)).where(UserReport.reporter_id == uuid.UUID(user_id))
            )
            user_reported_count = reports_result.scalar() or 0
            
            # Get system-wide stats (for context)
            total_blocks_result = await db.execute(select(func.count(UserBlock.id)))
            total_blocks = total_blocks_result.scalar() or 0
            
            total_reports_result = await db.execute(select(func.count(UserReport.id)))
            total_reports = total_reports_result.scalar() or 0
            
            pending_reports_result = await db.execute(
                select(func.count(UserReport.id)).where(UserReport.status == "pending")
            )
            pending_reports = pending_reports_result.scalar() or 0
            
            resolved_reports_result = await db.execute(
                select(func.count(UserReport.id)).where(UserReport.status == "resolved")
            )
            resolved_reports = resolved_reports_result.scalar() or 0
            
            return {
                "total_blocks": total_blocks,
                "total_reports": total_reports,
                "pending_reports": pending_reports,
                "resolved_reports": resolved_reports,
                "user_blocked_count": user_blocked_count,
                "user_reported_count": user_reported_count
            }
            
        except Exception as e:
            logger.error(f"Failed to get safety stats: {str(e)}")
            return {
                "total_blocks": 0,
                "total_reports": 0,
                "pending_reports": 0,
                "resolved_reports": 0,
                "user_blocked_count": 0,
                "user_reported_count": 0
            }
    
    @staticmethod
    async def filter_blocked_messages(db: AsyncSession, user_id: str, messages: List[Dict]) -> List[Dict]:
        """Filter out messages from blocked users"""
        try:
            if not messages:
                return messages
            
            # Get list of blocked user IDs
            blocked_result = await db.execute(
                select(UserBlock.blocked_id).where(UserBlock.blocker_id == uuid.UUID(user_id))
            )
            blocked_user_ids = {str(row[0]) for row in blocked_result.fetchall()}
            
            # Filter messages
            filtered_messages = []
            for message in messages:
                sender_id = message.get('sender_id')
                if sender_id not in blocked_user_ids:
                    filtered_messages.append(message)
                else:
                    # Add placeholder for blocked message
                    filtered_messages.append({
                        **message,
                        'content': '[Message from blocked user]',
                        'is_blocked': True
                    })
            
            return filtered_messages
            
        except Exception as e:
            logger.error(f"Failed to filter blocked messages: {str(e)}")
            return messages
    
    @staticmethod
    async def check_rate_limit(user_id: str, action: str, limit: int = 5, window: int = 300) -> bool:
        """Check if user is rate limited for safety actions"""
        try:
            redis = await get_redis()
            key = f"safety_rate_limit:{user_id}:{action}"
            
            current = await redis.incr(key)
            if current == 1:
                await redis.expire(key, window)
            
            return current <= limit
            
        except Exception as e:
            logger.error(f"Failed to check rate limit: {str(e)}")
            return True  # Allow action if rate limiting fails
    
    @staticmethod
    async def log_safety_action(db: AsyncSession, user_id: str, action_type: str, 
                               target_id: Optional[str] = None, reason: Optional[str] = None, 
                               metadata: Optional[Dict[str, Any]] = None) -> SafetyLog:
        """Log a safety action"""
        try:
            log = SafetyLog(
                user_id=uuid.UUID(user_id) if user_id else None,
                action_type=action_type,
                target_id=uuid.UUID(target_id) if target_id else None,
                reason=reason,
                safety_metadata=metadata
            )
            
            db.add(log)
            await db.commit()
            return log
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to log safety action: {str(e)}")
            raise