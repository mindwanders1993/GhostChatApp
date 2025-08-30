from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, delete, or_
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from app.models.chat import ChatRoom, RoomParticipant, ChatRoomCreate
from app.models.message import Message, MessageCreate
from app.models.user import User
from app.database import get_db, get_redis
import logging
import uuid

logger = logging.getLogger(__name__)

class ChatService:
    """Service for chat room and message management"""
    
    @staticmethod
    async def create_room(db: AsyncSession, room_data: ChatRoomCreate, creator_id: str) -> ChatRoom:
        """Create a new chat room"""
        try:
            # Create room
            room = ChatRoom(
                room_type=room_data.room_type,
                name=room_data.name,
                description=room_data.description,
                max_participants=room_data.max_participants
            )
            
            # Set expiration for private rooms (24 hours)
            if room_data.room_type == "private":
                room.expires_at = datetime.utcnow() + timedelta(hours=24)
            
            db.add(room)
            await db.flush()  # Get the room ID
            
            # Add creator as participant
            participant = RoomParticipant(
                room_id=room.id,
                user_id=uuid.UUID(creator_id),
                role="admin" if room_data.room_type != "private" else "member"
            )
            
            db.add(participant)
            await db.commit()
            await db.refresh(room)
            
            logger.info(f"Created room {room.id} by user {creator_id}")
            return room
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to create room: {str(e)}")
            raise
    
    @staticmethod
    async def get_room(db: AsyncSession, room_id: str) -> Optional[ChatRoom]:
        """Get room by ID with participants"""
        try:
            result = await db.execute(
                select(ChatRoom)
                .options(joinedload(ChatRoom.participants).joinedload(RoomParticipant.user))
                .where(ChatRoom.id == room_id)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Failed to get room {room_id}: {str(e)}")
            return None
    
    @staticmethod
    async def join_room(db: AsyncSession, room_id: str, user_id: str) -> bool:
        """Add user to room"""
        try:
            # Check if room exists and has space
            room = await ChatService.get_room(db, room_id)
            if not room or not room.is_active:
                return False
            
            # Check if room is full
            active_participants = len([p for p in room.participants if p.is_active])
            if active_participants >= room.max_participants:
                return False
            
            # Check if user is already in room
            existing_participant = None
            for participant in room.participants:
                if str(participant.user_id) == user_id:
                    existing_participant = participant
                    break
            
            if existing_participant:
                if existing_participant.is_active:
                    return True  # Already in room
                else:
                    # Reactivate participation
                    existing_participant.is_active = True
                    existing_participant.left_at = None
            else:
                # Create new participation
                participant = RoomParticipant(
                    room_id=uuid.UUID(room_id),
                    user_id=uuid.UUID(user_id),
                    role="member"
                )
                db.add(participant)
            
            await db.commit()
            logger.info(f"User {user_id} joined room {room_id}")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to join room {room_id} for user {user_id}: {str(e)}")
            return False
    
    @staticmethod
    async def leave_room(db: AsyncSession, room_id: str, user_id: str) -> bool:
        """Remove user from room"""
        try:
            # Find participant
            result = await db.execute(
                select(RoomParticipant)
                .where(
                    and_(
                        RoomParticipant.room_id == room_id,
                        RoomParticipant.user_id == user_id,
                        RoomParticipant.is_active == True
                    )
                )
            )
            participant = result.scalar_one_or_none()
            
            if not participant:
                return False
            
            # Mark as left
            participant.is_active = False
            participant.left_at = datetime.utcnow()
            
            await db.commit()
            logger.info(f"User {user_id} left room {room_id}")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to leave room {room_id} for user {user_id}: {str(e)}")
            return False
    
    @staticmethod
    async def create_message(db: AsyncSession, room_id: str, sender_id: str, content: str, 
                           message_type: str = "text", formatting: dict = None,
                           is_encrypted: bool = False, encryption_iv: str = None, 
                           encryption_key_id: str = None) -> Message:
        """Create a new message with database storage"""
        try:
            # Create message
            message = Message(
                room_id=uuid.UUID(room_id),
                sender_id=uuid.UUID(sender_id),
                content=content,
                message_type=message_type,
                formatting=formatting,
                is_encrypted=is_encrypted,
                encryption_iv=encryption_iv,
                encryption_key_id=encryption_key_id,
                sent_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(hours=24)
            )
            
            db.add(message)
            await db.flush()  # Get the message ID
            
            # Load sender information
            await db.refresh(message, ['sender'])
            
            await db.commit()
            
            logger.info(f"Created {'encrypted' if is_encrypted else 'plaintext'} message in room {room_id} from user {sender_id}")
            return message
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to create message: {str(e)}")
            raise
    
    @staticmethod
    async def create_message_full(db: AsyncSession, message_data: MessageCreate, sender_id: str) -> Message:
        """Create a new message with full database storage"""
        try:
            # Verify user is in the room
            result = await db.execute(
                select(RoomParticipant)
                .where(
                    and_(
                        RoomParticipant.room_id == message_data.room_id,
                        RoomParticipant.user_id == sender_id,
                        RoomParticipant.is_active == True
                    )
                )
            )
            
            if not result.scalar_one_or_none():
                raise ValueError("User not in room")
            
            # Validate reply_to_id if provided
            reply_to = None
            if message_data.reply_to_id:
                reply_result = await db.execute(
                    select(Message).where(Message.id == message_data.reply_to_id)
                )
                reply_to = reply_result.scalar_one_or_none()
                if not reply_to:
                    raise ValueError("Reply target message not found")
            
            # Validate whisper_to_id if provided
            whisper_to = None
            if message_data.whisper_to_id:
                whisper_result = await db.execute(
                    select(User).where(User.id == message_data.whisper_to_id)
                )
                whisper_to = whisper_result.scalar_one_or_none()
                if not whisper_to:
                    raise ValueError("Whisper target user not found")
                
                # Verify whisper target is in the room
                whisper_participant = await db.execute(
                    select(RoomParticipant)
                    .where(
                        and_(
                            RoomParticipant.room_id == message_data.room_id,
                            RoomParticipant.user_id == message_data.whisper_to_id,
                            RoomParticipant.is_active == True
                        )
                    )
                )
                if not whisper_participant.scalar_one_or_none():
                    raise ValueError("Whisper target user not in room")
            
            # Process mentioned users
            mentioned_user_ids = []
            if message_data.mentioned_users:
                for user_id in message_data.mentioned_users:
                    user_result = await db.execute(
                        select(User).where(User.id == user_id)
                    )
                    if user_result.scalar_one_or_none():
                        mentioned_user_ids.append(uuid.UUID(user_id))
            
            # Create message
            message = Message(
                room_id=uuid.UUID(message_data.room_id),
                sender_id=uuid.UUID(sender_id),
                content=message_data.content,
                message_type=message_data.message_type,
                reply_to_id=uuid.UUID(message_data.reply_to_id) if message_data.reply_to_id else None,
                whisper_to_id=uuid.UUID(message_data.whisper_to_id) if message_data.whisper_to_id else None,
                is_whisper=bool(message_data.whisper_to_id),
                mentioned_users=mentioned_user_ids,
                formatting=message_data.formatting,
                message_metadata=message_data.message_metadata
            )
            
            db.add(message)
            await db.commit()
            await db.refresh(message)
            
            logger.info(f"Created message {message.id} in room {message_data.room_id}")
            return message
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to create message: {str(e)}")
            raise
    
    @staticmethod
    async def edit_message(
        db: AsyncSession,
        message_id: str,
        user_id: str,
        new_content: str,
        formatting: dict = None
    ) -> Optional[Message]:
        """Edit an existing message"""
        try:
            # Find the message and verify ownership
            result = await db.execute(
                select(Message)
                .options(joinedload(Message.sender))
                .where(
                    and_(
                        Message.id == uuid.UUID(message_id),
                        Message.sender_id == uuid.UUID(user_id)
                    )
                )
            )
            message = result.scalar_one_or_none()
            
            if not message:
                return None
            
            # Update message content and formatting
            message.content = new_content
            message.formatting = formatting
            message.is_edited = True
            message.edited_at = datetime.utcnow()
            
            await db.commit()
            await db.refresh(message)
            
            logger.info(f"Edited message {message_id} by user {user_id}")
            return message
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to edit message {message_id}: {str(e)}")
            raise
    
    @staticmethod
    async def delete_message(
        db: AsyncSession,
        message_id: str,
        user_id: str
    ) -> bool:
        """Delete a message (soft delete by marking as deleted)"""
        try:
            # Find the message and verify ownership
            result = await db.execute(
                select(Message)
                .where(
                    and_(
                        Message.id == uuid.UUID(message_id),
                        Message.sender_id == uuid.UUID(user_id)
                    )
                )
            )
            message = result.scalar_one_or_none()
            
            if not message:
                return False
            
            # Soft delete by updating content
            message.content = "[Message deleted]"
            message.message_type = "deleted"
            message.formatting = None
            message.is_edited = True
            message.edited_at = datetime.utcnow()
            
            await db.commit()
            
            logger.info(f"Deleted message {message_id} by user {user_id}")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to delete message {message_id}: {str(e)}")
            return False
    
    @staticmethod
    async def get_room_messages(
        db: AsyncSession,
        room_id: str,
        user_id: str,
        limit: int = 50,
        before_message_id: Optional[str] = None
    ) -> List[Message]:
        """Get messages from room (with pagination)"""
        try:
            # Verify user is in room
            result = await db.execute(
                select(RoomParticipant)
                .where(
                    and_(
                        RoomParticipant.room_id == room_id,
                        RoomParticipant.user_id == user_id,
                        RoomParticipant.is_active == True
                    )
                )
            )
            
            if not result.scalar_one_or_none():
                return []
            
            # Build query
            query = select(Message).where(Message.room_id == room_id)
            
            if before_message_id:
                query = query.where(Message.sent_at < (
                    select(Message.sent_at).where(Message.id == before_message_id)
                ))
            
            query = query.order_by(desc(Message.sent_at)).limit(limit)
            
            result = await db.execute(query)
            messages = result.scalars().all()
            
            # Return in chronological order (oldest first)
            return list(reversed(messages))
            
        except Exception as e:
            logger.error(f"Failed to get messages for room {room_id}: {str(e)}")
            return []
    
    @staticmethod
    async def get_user_rooms(db: AsyncSession, user_id: str) -> List[ChatRoom]:
        """Get rooms user is currently in"""
        try:
            result = await db.execute(
                select(ChatRoom)
                .join(RoomParticipant)
                .where(
                    and_(
                        RoomParticipant.user_id == user_id,
                        RoomParticipant.is_active == True,
                        ChatRoom.is_active == True
                    )
                )
                .options(joinedload(ChatRoom.participants))
            )
            
            return result.scalars().unique().all()
            
        except Exception as e:
            logger.error(f"Failed to get user rooms for {user_id}: {str(e)}")
            return []
    
    @staticmethod
    async def cleanup_expired_rooms(db: AsyncSession):
        """Clean up expired rooms and inactive participants"""
        try:
            # Get expired rooms
            result = await db.execute(
                select(ChatRoom)
                .where(
                    and_(
                        ChatRoom.expires_at.is_not(None),
                        ChatRoom.expires_at < datetime.utcnow()
                    )
                )
            )
            
            expired_rooms = result.scalars().all()
            
            for room in expired_rooms:
                room.is_active = False
                logger.info(f"Deactivated expired room {room.id}")
            
            await db.commit()
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to cleanup expired rooms: {str(e)}")
    
    @staticmethod
    async def get_room_stats(db: AsyncSession, room_id: str) -> Dict[str, Any]:
        """Get room statistics"""
        try:
            room = await ChatService.get_room(db, room_id)
            if not room:
                return {}
            
            # Count active participants
            active_participants = len([p for p in room.participants if p.is_active])
            
            # Count messages (from last 24 hours)
            result = await db.execute(
                select(Message)
                .where(
                    and_(
                        Message.room_id == room_id,
                        Message.sent_at > datetime.utcnow() - timedelta(hours=24)
                    )
                )
            )
            message_count = len(result.scalars().all())
            
            return {
                "room_id": str(room.id),
                "active_participants": active_participants,
                "total_participants": len(room.participants),
                "message_count_24h": message_count,
                "created_at": room.created_at,
                "expires_at": room.expires_at
            }
            
        except Exception as e:
            logger.error(f"Failed to get room stats for {room_id}: {str(e)}")
            return {}
    
    @staticmethod
    async def get_public_rooms_with_stats(db: AsyncSession) -> List[Dict[str, Any]]:
        """Get all public rooms with current statistics for room listing"""
        try:
            # Get all active public rooms
            result = await db.execute(
                select(ChatRoom)
                .options(joinedload(ChatRoom.participants))
                .where(
                    and_(
                        ChatRoom.room_type == "public",
                        ChatRoom.is_active == True
                    )
                )
            )
            
            rooms = result.scalars().unique().all()
            room_data = []
            
            for room in rooms:
                # Count active participants
                active_participants = len([p for p in room.participants if p.is_active])
                
                # Get last activity
                last_message_result = await db.execute(
                    select(Message)
                    .where(Message.room_id == room.id)
                    .order_by(desc(Message.sent_at))
                    .limit(1)
                )
                last_message = last_message_result.scalar_one_or_none()
                
                # Calculate last activity time
                last_activity = "Just created"
                if last_message:
                    time_diff = datetime.utcnow() - last_message.sent_at
                    if time_diff.seconds < 60:
                        last_activity = f"{time_diff.seconds} seconds ago"
                    elif time_diff.seconds < 3600:
                        last_activity = f"{time_diff.seconds // 60} minutes ago"
                    else:
                        last_activity = f"{time_diff.seconds // 3600} hours ago"
                
                # Determine security level based on moderation settings
                security_level = "high" if room.max_participants <= 100 else "medium"
                
                # Create room data
                room_info = {
                    "id": str(room.id),
                    "name": room.name,
                    "description": room.description,
                    "icon": "💬",  # Default icon, could be stored in room metadata
                    "userCount": active_participants,
                    "maxParticipants": room.max_participants,
                    "roomType": room.room_type,
                    "isActive": room.is_active,
                    "lastActivity": last_activity,
                    "securityLevel": security_level,
                    "tags": ["general", "public"]  # Default tags, could be stored in room metadata
                }
                
                room_data.append(room_info)
            
            return room_data
            
        except Exception as e:
            logger.error(f"Failed to get public rooms with stats: {str(e)}")
            return []
    
    @staticmethod
    async def create_default_public_rooms(db: AsyncSession):
        """Create default public rooms if they don't exist"""
        try:
            default_rooms = [
                {
                    "name": "General Lounge",
                    "description": "Open discussion for everyone. Share your thoughts, experiences, and connect with people from around the world.",
                    "max_participants": 200,
                    "icon": "💬"
                },
                {
                    "name": "Gaming Hub", 
                    "description": "Discuss your favorite games, find gaming partners, share tips and tricks.",
                    "max_participants": 150,
                    "icon": "🎮"
                },
                {
                    "name": "Music Corner",
                    "description": "Share and discover new music, discuss artists, albums, and concerts.",
                    "max_participants": 100,
                    "icon": "🎵"
                },
                {
                    "name": "Movie Talk",
                    "description": "Chat about movies, TV shows, reviews, and recommendations.",
                    "max_participants": 100,
                    "icon": "🎬"
                },
                {
                    "name": "Tech Discussion",
                    "description": "Technology talks, programming discussions, and innovation sharing.",
                    "max_participants": 120,
                    "icon": "💻"
                },
                {
                    "name": "Random Thoughts",
                    "description": "Share your random ideas, philosophical thoughts, and deep conversations.",
                    "max_participants": 150,
                    "icon": "💭"
                }
            ]
            
            for room_data in default_rooms:
                # Check if room already exists
                existing_room = await db.execute(
                    select(ChatRoom)
                    .where(
                        and_(
                            ChatRoom.name == room_data["name"],
                            ChatRoom.room_type == "public"
                        )
                    )
                )
                
                if not existing_room.scalar_one_or_none():
                    # Create the room
                    room = ChatRoom(
                        room_type="public",
                        name=room_data["name"],
                        description=room_data["description"],
                        max_participants=room_data["max_participants"]
                    )
                    db.add(room)
                    logger.info(f"Created default public room: {room_data['name']}")
            
            await db.commit()
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to create default public rooms: {str(e)}")
            raise
    
    @staticmethod
    async def add_message_reaction(
        db: AsyncSession, 
        message_id: str, 
        user_id: str, 
        emoji: str
    ) -> bool:
        """Add reaction to a message"""
        try:
            from app.models.message import MessageReaction
            
            # Check if reaction already exists
            existing_reaction = await db.execute(
                select(MessageReaction)
                .where(
                    and_(
                        MessageReaction.message_id == message_id,
                        MessageReaction.user_id == user_id,
                        MessageReaction.emoji == emoji
                    )
                )
            )
            
            if existing_reaction.scalar_one_or_none():
                return True  # Already reacted
            
            # Create new reaction
            reaction = MessageReaction(
                message_id=uuid.UUID(message_id),
                user_id=uuid.UUID(user_id),
                emoji=emoji
            )
            
            db.add(reaction)
            await db.commit()
            
            logger.info(f"Added reaction {emoji} to message {message_id} by user {user_id}")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to add reaction: {str(e)}")
            return False
    
    @staticmethod
    async def remove_message_reaction(
        db: AsyncSession,
        message_id: str,
        user_id: str,
        emoji: str
    ) -> bool:
        """Remove reaction from a message"""
        try:
            from app.models.message import MessageReaction
            
            await db.execute(
                delete(MessageReaction)
                .where(
                    and_(
                        MessageReaction.message_id == message_id,
                        MessageReaction.user_id == user_id,
                        MessageReaction.emoji == emoji
                    )
                )
            )
            
            await db.commit()
            logger.info(f"Removed reaction {emoji} from message {message_id} by user {user_id}")
            return True
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to remove reaction: {str(e)}")
            return False
    
    @staticmethod
    async def get_message_with_context(
        db: AsyncSession,
        message_id: str,
        user_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get message with full context (replies, reactions, mentions)"""
        try:
            from app.models.message import MessageReaction
            
            # Get the message with relationships
            result = await db.execute(
                select(Message)
                .options(
                    joinedload(Message.sender),
                    joinedload(Message.reply_to),
                    joinedload(Message.whisper_to),
                    joinedload(Message.reactions).joinedload(MessageReaction.user)
                )
                .where(Message.id == message_id)
            )
            
            message = result.scalar_one_or_none()
            if not message:
                return None
            
            # Check if user can see this message (whisper visibility)
            if message.is_whisper:
                if str(message.sender_id) != user_id and str(message.whisper_to_id) != user_id:
                    return None  # User cannot see this whisper
            
            # Build full message data
            message_data = message.to_dict()
            
            # Get replies to this message
            replies_result = await db.execute(
                select(Message)
                .options(joinedload(Message.sender))
                .where(Message.reply_to_id == message_id)
                .order_by(Message.sent_at)
            )
            
            replies = []
            for reply in replies_result.scalars():
                # Check whisper visibility for replies
                if reply.is_whisper:
                    if str(reply.sender_id) != user_id and str(reply.whisper_to_id) != user_id:
                        continue
                replies.append(reply.to_dict())
            
            message_data["replies"] = replies
            message_data["reply_count"] = len(replies)
            
            return message_data
            
        except Exception as e:
            logger.error(f"Failed to get message with context {message_id}: {str(e)}")
            return None
    
    @staticmethod
    async def search_room_messages(
        db: AsyncSession,
        room_id: str,
        user_id: str,
        search_term: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Search messages in a room"""
        try:
            # Verify user is in room
            participant_check = await db.execute(
                select(RoomParticipant)
                .where(
                    and_(
                        RoomParticipant.room_id == room_id,
                        RoomParticipant.user_id == user_id,
                        RoomParticipant.is_active == True
                    )
                )
            )
            
            if not participant_check.scalar_one_or_none():
                return []
            
            # Search messages
            query = (
                select(Message)
                .options(joinedload(Message.sender))
                .where(
                    and_(
                        Message.room_id == room_id,
                        Message.content.ilike(f"%{search_term}%")
                    )
                )
                .order_by(desc(Message.sent_at))
                .limit(limit)
            )
            
            result = await db.execute(query)
            messages = []
            
            for message in result.scalars():
                # Check whisper visibility
                if message.is_whisper:
                    if str(message.sender_id) != user_id and str(message.whisper_to_id) != user_id:
                        continue
                
                messages.append(message.to_dict())
            
            return messages
            
        except Exception as e:
            logger.error(f"Failed to search messages in room {room_id}: {str(e)}")
            return []
    
    @staticmethod
    async def get_user_mentions(
        db: AsyncSession,
        user_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get messages where user is mentioned"""
        try:
            # Query messages where user is mentioned
            query = (
                select(Message)
                .options(
                    joinedload(Message.sender),
                    joinedload(Message.room)
                )
                .where(Message.mentioned_users.any(uuid.UUID(user_id)))
                .order_by(desc(Message.sent_at))
                .limit(limit)
            )
            
            result = await db.execute(query)
            mentions = []
            
            for message in result.scalars():
                mention_data = message.to_dict()
                mention_data["room_name"] = message.room.name if message.room else "Unknown Room"
                mentions.append(mention_data)
            
            return mentions
            
        except Exception as e:
            logger.error(f"Failed to get mentions for user {user_id}: {str(e)}")
            return []
    
    @staticmethod
    async def get_user_whispers(
        db: AsyncSession,
        user_id: str,
        room_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get whispers sent to or from a user"""
        try:
            query = (
                select(Message)
                .options(
                    joinedload(Message.sender),
                    joinedload(Message.whisper_to),
                    joinedload(Message.room)
                )
                .where(
                    and_(
                        Message.is_whisper == True,
                        or_(
                            Message.sender_id == user_id,
                            Message.whisper_to_id == user_id
                        )
                    )
                )
            )
            
            if room_id:
                query = query.where(Message.room_id == room_id)
            
            query = query.order_by(desc(Message.sent_at)).limit(limit)
            
            result = await db.execute(query)
            whispers = []
            
            for message in result.scalars():
                whisper_data = message.to_dict()
                whisper_data["room_name"] = message.room.name if message.room else "Unknown Room"
                whispers.append(whisper_data)
            
            return whispers
            
        except Exception as e:
            logger.error(f"Failed to get whispers for user {user_id}: {str(e)}")
            return []