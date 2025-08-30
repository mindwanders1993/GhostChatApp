from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
import json
import asyncio
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.services.chat_service import ChatService
from app.services.moderation_service import moderation_service
from app.middleware.rate_limit import websocket_rate_limiter
from app.database import get_redis, get_db
from app.models.user import User

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for real-time chat"""
    
    def __init__(self):
        # Active WebSocket connections: {user_id: websocket}
        self.active_connections: Dict[str, WebSocket] = {}
        
        # Room connections: {room_id: set of user_ids}
        self.room_connections: Dict[str, Set[str]] = {}
        
        # User to rooms mapping: {user_id: set of room_ids}
        self.user_rooms: Dict[str, Set[str]] = {}
        
        # Typing indicators: {room_id: {user_id: timestamp}}
        self.typing_indicators: Dict[str, Dict[str, datetime]] = {}
        
        # User info cache: {user_id: {nickname, last_fetched}}
        self.user_cache: Dict[str, Dict] = {}
    
    async def get_user_info(self, user_id: str) -> Dict:
        """Get user information with caching"""
        # Check cache first (cache for 5 minutes)
        if user_id in self.user_cache:
            cache_entry = self.user_cache[user_id]
            if (datetime.utcnow() - cache_entry['last_fetched']).seconds < 300:
                return cache_entry
        
        try:
            # Fetch from database
            async for db in get_db():
                result = await db.execute(select(User).where(User.id == user_id))
                user = result.scalar_one_or_none()
                if user:
                    user_info = {
                        'nickname': user.nickname or f'User{str(user.id)[:8]}',
                        'last_fetched': datetime.utcnow()
                    }
                    self.user_cache[user_id] = user_info
                    return user_info
                break
        except Exception as e:
            logger.error(f"Failed to get user info for {user_id}: {str(e)}")
        
        # Fallback
        return {'nickname': f'User{str(user_id)[:8]}', 'last_fetched': datetime.utcnow()}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept WebSocket connection and start listening"""
        await websocket.accept()
        
        # Store connection
        self.active_connections[user_id] = websocket
        self.user_rooms[user_id] = set()
        
        logger.info(f"User {user_id} connected via WebSocket")
        
        try:
            await self._listen_for_messages(websocket, user_id)
        except WebSocketDisconnect:
            logger.info(f"User {user_id} disconnected")
        except Exception as e:
            logger.error(f"WebSocket error for user {user_id}: {str(e)}")
        finally:
            await self.disconnect(user_id)
    
    async def disconnect(self, user_id: str):
        """Disconnect user and clean up"""
        try:
            # Remove from active connections
            if user_id in self.active_connections:
                del self.active_connections[user_id]
            
            # Remove from all rooms and notify others
            if user_id in self.user_rooms:
                user_room_ids = self.user_rooms[user_id].copy()
                for room_id in user_room_ids:
                    await self._leave_room_internal(user_id, room_id)
                del self.user_rooms[user_id]
            
            # Clear typing indicators
            for room_id in self.typing_indicators:
                if user_id in self.typing_indicators[room_id]:
                    del self.typing_indicators[room_id][user_id]
                    # Notify others that user stopped typing
                    await self._broadcast_to_room(room_id, {
                        "type": "typing_indicator",
                        "user_id": user_id,
                        "is_typing": False
                    }, exclude_user=user_id)
            
            logger.info(f"User {user_id} fully disconnected")
            
        except Exception as e:
            logger.error(f"Error during disconnect for user {user_id}: {str(e)}")
    
    async def join_room(self, user_id: str, room_id: str):
        """Add user to room"""
        try:
            # Add to room connections
            if room_id not in self.room_connections:
                self.room_connections[room_id] = set()
            
            self.room_connections[room_id].add(user_id)
            self.user_rooms[user_id].add(room_id)
            
            # Get user info for broadcast
            user_info = await self.get_user_info(user_id)
            
            # Notify other users in room
            await self._broadcast_to_room(room_id, {
                "type": "user_joined",
                "user_id": user_id,
                "user_nickname": user_info['nickname'],
                "room_id": room_id,
                "timestamp": datetime.utcnow().isoformat()
            }, exclude_user=user_id)
            
            # Send confirmation to user
            await self.send_message(user_id, {
                "type": "room_joined",
                "room_id": room_id,
                "message": "Successfully joined room"
            })
            
            logger.info(f"User {user_id} joined room {room_id}")
            
        except Exception as e:
            logger.error(f"Error joining room {room_id} for user {user_id}: {str(e)}")
    
    async def leave_room(self, user_id: str, room_id: str, reason: str = "user_left"):
        """Remove user from room"""
        await self._leave_room_internal(user_id, room_id, reason)
    
    async def _leave_room_internal(self, user_id: str, room_id: str, reason: str = "user_left"):
        """Internal room leaving logic"""
        try:
            # Remove from room connections
            if room_id in self.room_connections:
                self.room_connections[room_id].discard(user_id)
                
                # Clean up empty rooms
                if not self.room_connections[room_id]:
                    del self.room_connections[room_id]
            
            # Remove from user rooms
            if user_id in self.user_rooms:
                self.user_rooms[user_id].discard(room_id)
            
            # Clear typing indicators
            if room_id in self.typing_indicators:
                if user_id in self.typing_indicators[room_id]:
                    del self.typing_indicators[room_id][user_id]
            
            # Get user info for broadcast
            user_info = await self.get_user_info(user_id)
            
            # Notify other users in room
            await self._broadcast_to_room(room_id, {
                "type": "user_left",
                "user_id": user_id,
                "user_nickname": user_info['nickname'],
                "room_id": room_id,
                "reason": reason,
                "timestamp": datetime.utcnow().isoformat()
            }, exclude_user=user_id)
            
            logger.info(f"User {user_id} left room {room_id} (reason: {reason})")
            
        except Exception as e:
            logger.error(f"Error leaving room {room_id} for user {user_id}: {str(e)}")
    
    async def send_message(self, user_id: str, message: dict):
        """Send message to specific user"""
        if user_id in self.active_connections:
            try:
                websocket = self.active_connections[user_id]
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to send message to user {user_id}: {str(e)}")
                # Connection might be dead, clean up
                await self.disconnect(user_id)
    
    async def _broadcast_to_room(self, room_id: str, message: dict, exclude_user: str = None):
        """Broadcast message to all users in room"""
        if room_id not in self.room_connections:
            return
        
        tasks = []
        for user_id in self.room_connections[room_id]:
            if user_id != exclude_user:
                tasks.append(self.send_message(user_id, message))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _listen_for_messages(self, websocket: WebSocket, user_id: str):
        """Listen for incoming WebSocket messages"""
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                await self._handle_message(user_id, message)
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                await self.send_message(user_id, {
                    "type": "error",
                    "message": "Invalid JSON format"
                })
            except Exception as e:
                logger.error(f"Error processing message from user {user_id}: {str(e)}")
                await self.send_message(user_id, {
                    "type": "error",
                    "message": "Message processing failed"
                })
    
    async def _handle_message(self, user_id: str, message: dict):
        """Handle incoming WebSocket message"""
        message_type = message.get("type")
        
        # Rate limiting check
        if not await websocket_rate_limiter.check_limit(user_id, message_type):
            await self.send_message(user_id, {
                "type": "error",
                "message": "Rate limit exceeded"
            })
            return
        
        try:
            if message_type == "join_room":
                room_id = message.get("room_id")
                if room_id:
                    await self.join_room(user_id, room_id)
            
            elif message_type == "leave_room":
                room_id = message.get("room_id")
                reason = message.get("reason", "user_left")
                if room_id:
                    await self.leave_room(user_id, room_id, reason)
            
            elif message_type == "send_message":
                await self._handle_chat_message(user_id, message)
            
            elif message_type == "edit_message":
                await self._handle_edit_message(user_id, message)
            
            elif message_type == "delete_message":
                await self._handle_delete_message(user_id, message)
            
            elif message_type == "send_whisper":
                await self._handle_whisper_message(user_id, message)
            
            elif message_type == "send_reply":
                await self._handle_reply_message(user_id, message)
            
            elif message_type == "add_reaction":
                await self._handle_add_reaction(user_id, message)
            
            elif message_type == "remove_reaction":
                await self._handle_remove_reaction(user_id, message)
            
            elif message_type == "typing_start":
                await self._handle_typing_indicator(user_id, message, True)
            
            elif message_type == "typing_stop":
                await self._handle_typing_indicator(user_id, message, False)
            
            elif message_type == "get_online_users":
                await self._handle_get_online_users(user_id, message)
            
            elif message_type == "get_user_mentions":
                await self._handle_get_mentions(user_id, message)
            
            elif message_type == "get_user_whispers":
                await self._handle_get_whispers(user_id, message)
            
            elif message_type == "update_presence":
                await self._handle_presence_update(user_id, message)
            
            elif message_type == "ping":
                await self.send_message(user_id, {"type": "pong"})
            
            else:
                await self.send_message(user_id, {
                    "type": "error",
                    "message": f"Unknown message type: {message_type}"
                })
        
        except Exception as e:
            logger.error(f"Error handling message type {message_type} from user {user_id}: {str(e)}")
            await self.send_message(user_id, {
                "type": "error",
                "message": "Message handling failed"
            })
    
    async def _handle_chat_message(self, user_id: str, message: dict):
        """Handle chat message sending"""
        room_id = message.get("room_id")
        content = message.get("content")
        message_type = message.get("message_type", "text")
        formatting = message.get("formatting")
        
        if not room_id or not content:
            await self.send_message(user_id, {
                "type": "error",
                "message": "Room ID and content are required"
            })
            return
        
        # Check if user is in the room
        if room_id not in self.user_rooms.get(user_id, set()):
            await self.send_message(user_id, {
                "type": "error",
                "message": "You are not in this room"
            })
            return
        
        # Content moderation check
        moderation_result = await moderation_service.check_content(content)
        if not moderation_result.is_safe:
            await self.send_message(user_id, {
                "type": "moderation_warning",
                "message": "Your message contains inappropriate content and was not sent",
                "reasons": moderation_result.reasons
            })
            return
        
        # Process mentioned users if any
        mentioned_users = message.get("mentioned_users", [])
        
        # Process and store message (using ChatService)
        try:
            chat_message = await ChatService.create_message(
                room_id=room_id,
                sender_id=user_id,
                content=content,
                message_type=message_type,
                formatting=formatting
            )
            
            # Get user info for broadcast
            user_info = await self.get_user_info(user_id)
            
            # Broadcast message to room
            await self._broadcast_to_room(room_id, {
                "type": "message_received",
                "id": str(chat_message.id),
                "room_id": room_id,
                "sender_id": user_id,
                "sender_nickname": user_info['nickname'],
                "content": content,
                "message_type": message_type,
                "formatting": formatting,
                "mentioned_users": mentioned_users,
                "is_whisper": False,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Send notifications to mentioned users
            for mentioned_user_id in mentioned_users:
                if mentioned_user_id != user_id and mentioned_user_id in self.active_connections:
                    await self.send_message(mentioned_user_id, {
                        "type": "mention_notification",
                        "mentioning_user": user_info['nickname'],
                        "message_content": content[:100] + "..." if len(content) > 100 else content,
                        "room_id": room_id
                    })
            
        except Exception as e:
            logger.error(f"Failed to process chat message: {str(e)}")
            await self.send_message(user_id, {
                "type": "error",
                "message": "Failed to send message"
            })
    
    async def _handle_typing_indicator(self, user_id: str, message: dict, is_typing: bool):
        """Handle typing indicators"""
        room_id = message.get("room_id")
        
        if not room_id or room_id not in self.user_rooms.get(user_id, set()):
            return
        
        # Update typing indicators
        if room_id not in self.typing_indicators:
            self.typing_indicators[room_id] = {}
        
        if is_typing:
            self.typing_indicators[room_id][user_id] = datetime.utcnow()
        else:
            self.typing_indicators[room_id].pop(user_id, None)
        
        # Broadcast to room
        await self._broadcast_to_room(room_id, {
            "type": "typing_indicator",
            "room_id": room_id,
            "user_id": user_id,
            "is_typing": is_typing
        }, exclude_user=user_id)
    
    async def get_room_users(self, room_id: str) -> List[str]:
        """Get list of users in room"""
        return list(self.room_connections.get(room_id, set()))
    
    async def get_user_rooms(self, user_id: str) -> List[str]:
        """Get list of rooms user is in"""
        return list(self.user_rooms.get(user_id, set()))
    
    async def is_user_online(self, user_id: str) -> bool:
        """Check if user is online"""
        return user_id in self.active_connections
    
    async def _handle_whisper_message(self, user_id: str, message: dict):
        """Handle whisper message sending"""
        room_id = message.get("room_id")
        content = message.get("content")
        whisper_to_id = message.get("whisper_to_id")
        
        if not room_id or not content or not whisper_to_id:
            await self.send_message(user_id, {
                "type": "error",
                "message": "Room ID, content, and whisper_to_id are required"
            })
            return
        
        # Check if both users are in the room
        if (room_id not in self.user_rooms.get(user_id, set()) or 
            room_id not in self.user_rooms.get(whisper_to_id, set())):
            await self.send_message(user_id, {
                "type": "error",
                "message": "Both users must be in the room for whispers"
            })
            return
        
        # Content moderation check
        moderation_result = await moderation_service.check_content(content)
        if not moderation_result.is_safe:
            await self.send_message(user_id, {
                "type": "moderation_warning",
                "message": "Your whisper contains inappropriate content and was not sent",
                "reasons": moderation_result.reasons
            })
            return
        
        # Get user info
        sender_info = await self.get_user_info(user_id)
        receiver_info = await self.get_user_info(whisper_to_id)
        
        # Create whisper message data
        whisper_data = {
            "type": "whisper_received",
            "id": f"whisper_{datetime.utcnow().timestamp()}",
            "room_id": room_id,
            "sender_id": user_id,
            "sender_nickname": sender_info['nickname'],
            "whisper_to_id": whisper_to_id,
            "whisper_to_nickname": receiver_info['nickname'],
            "content": content,
            "message_type": "whisper",
            "is_whisper": True,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to both sender and receiver only
        await self.send_message(user_id, whisper_data)
        await self.send_message(whisper_to_id, whisper_data)
    
    async def _handle_reply_message(self, user_id: str, message: dict):
        """Handle reply message sending"""
        room_id = message.get("room_id")
        content = message.get("content")
        reply_to_id = message.get("reply_to_id")
        mentioned_users = message.get("mentioned_users", [])
        
        if not room_id or not content or not reply_to_id:
            await self.send_message(user_id, {
                "type": "error",
                "message": "Room ID, content, and reply_to_id are required"
            })
            return
        
        # Check if user is in the room
        if room_id not in self.user_rooms.get(user_id, set()):
            await self.send_message(user_id, {
                "type": "error",
                "message": "You are not in this room"
            })
            return
        
        # Content moderation check
        moderation_result = await moderation_service.check_content(content)
        if not moderation_result.is_safe:
            await self.send_message(user_id, {
                "type": "moderation_warning",
                "message": "Your reply contains inappropriate content and was not sent",
                "reasons": moderation_result.reasons
            })
            return
        
        # Get user info
        user_info = await self.get_user_info(user_id)
        
        # Create reply message data
        reply_data = {
            "type": "reply_received",
            "id": f"reply_{datetime.utcnow().timestamp()}",
            "room_id": room_id,
            "sender_id": user_id,
            "sender_nickname": user_info['nickname'],
            "content": content,
            "message_type": "text",
            "reply_to_id": reply_to_id,
            "mentioned_users": mentioned_users,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Broadcast to room
        await self._broadcast_to_room(room_id, reply_data)
        
        # Send notifications to mentioned users
        for mentioned_user_id in mentioned_users:
            if mentioned_user_id != user_id and mentioned_user_id in self.active_connections:
                await self.send_message(mentioned_user_id, {
                    "type": "mention_notification",
                    "mentioning_user": user_info['nickname'],
                    "message_content": content[:100] + "..." if len(content) > 100 else content,
                    "room_id": room_id
                })
    
    async def _handle_add_reaction(self, user_id: str, message: dict):
        """Handle adding reaction to message"""
        message_id = message.get("message_id")
        emoji = message.get("emoji")
        room_id = message.get("room_id")
        
        if not message_id or not emoji or not room_id:
            await self.send_message(user_id, {
                "type": "error",
                "message": "Message ID, emoji, and room ID are required"
            })
            return
        
        # Check if user is in the room
        if room_id not in self.user_rooms.get(user_id, set()):
            await self.send_message(user_id, {
                "type": "error",
                "message": "You are not in this room"
            })
            return
        
        # Get user info
        user_info = await self.get_user_info(user_id)
        
        # Broadcast reaction to room
        await self._broadcast_to_room(room_id, {
            "type": "reaction_added",
            "message_id": message_id,
            "user_id": user_id,
            "user_nickname": user_info['nickname'],
            "emoji": emoji,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    async def _handle_remove_reaction(self, user_id: str, message: dict):
        """Handle removing reaction from message"""
        message_id = message.get("message_id")
        emoji = message.get("emoji")
        room_id = message.get("room_id")
        
        if not message_id or not emoji or not room_id:
            await self.send_message(user_id, {
                "type": "error",
                "message": "Message ID, emoji, and room ID are required"
            })
            return
        
        # Check if user is in the room
        if room_id not in self.user_rooms.get(user_id, set()):
            await self.send_message(user_id, {
                "type": "error",
                "message": "You are not in this room"
            })
            return
        
        # Get user info
        user_info = await self.get_user_info(user_id)
        
        # Broadcast reaction removal to room
        await self._broadcast_to_room(room_id, {
            "type": "reaction_removed",
            "message_id": message_id,
            "user_id": user_id,
            "user_nickname": user_info['nickname'],
            "emoji": emoji,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    async def _handle_get_online_users(self, user_id: str, message: dict):
        """Handle request for online users in room"""
        room_id = message.get("room_id")
        
        if not room_id:
            await self.send_message(user_id, {
                "type": "error",
                "message": "Room ID is required"
            })
            return
        
        # Check if user is in the room
        if room_id not in self.user_rooms.get(user_id, set()):
            await self.send_message(user_id, {
                "type": "error",
                "message": "You are not in this room"
            })
            return
        
        # Get online users in room
        online_users = []
        room_user_ids = self.room_connections.get(room_id, set())
        
        for room_user_id in room_user_ids:
            if room_user_id in self.active_connections:
                user_info = await self.get_user_info(room_user_id)
                is_typing = room_id in self.typing_indicators and room_user_id in self.typing_indicators[room_id]
                
                online_users.append({
                    "user_id": room_user_id,
                    "user_nickname": user_info['nickname'],
                    "is_online": True,
                    "is_typing": is_typing,
                    "last_seen": datetime.utcnow().isoformat()
                })
        
        await self.send_message(user_id, {
            "type": "online_users_list",
            "room_id": room_id,
            "users": online_users,
            "count": len(online_users)
        })
    
    async def _handle_get_mentions(self, user_id: str, message: dict):
        """Handle request for user mentions"""
        # This would typically query the database for mentions
        # For now, send back empty list
        await self.send_message(user_id, {
            "type": "user_mentions",
            "mentions": [],
            "count": 0
        })
    
    async def _handle_get_whispers(self, user_id: str, message: dict):
        """Handle request for user whispers"""
        room_id = message.get("room_id")
        
        # This would typically query the database for whispers
        # For now, send back empty list
        await self.send_message(user_id, {
            "type": "user_whispers",
            "room_id": room_id,
            "whispers": [],
            "count": 0
        })
    
    async def _handle_presence_update(self, user_id: str, message: dict):
        """Handle user presence update"""
        room_id = message.get("room_id")
        status_message = message.get("status_message")
        
        # Update presence information
        user_info = await self.get_user_info(user_id)
        
        # Broadcast presence update to room if specified
        if room_id and room_id in self.user_rooms.get(user_id, set()):
            await self._broadcast_to_room(room_id, {
                "type": "presence_updated",
                "user_id": user_id,
                "user_nickname": user_info['nickname'],
                "is_online": True,
                "status_message": status_message,
                "timestamp": datetime.utcnow().isoformat()
            }, exclude_user=user_id)

    async def _handle_edit_message(self, user_id: str, message: dict):
        """Handle message editing"""
        message_id = message.get("message_id")
        content = message.get("content")
        formatting = message.get("formatting")
        
        if not message_id or not content:
            await self.send_message(user_id, {
                "type": "error",
                "message": "Message ID and content are required"
            })
            return
            
        try:
            # TODO: Update message in database with new content and formatting
            # For now, just broadcast the edit
            user_info = await self.get_user_info(user_id)
            
            # Broadcast edit to all users in relevant rooms
            await self._broadcast_to_all({
                "type": "message_edited",
                "message_id": message_id,
                "content": content,
                "formatting": formatting,
                "edited_by": user_id,
                "editor_nickname": user_info['nickname'],
                "timestamp": datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Failed to edit message: {str(e)}")
            await self.send_message(user_id, {
                "type": "error",
                "message": "Failed to edit message"
            })

    async def _handle_delete_message(self, user_id: str, message: dict):
        """Handle message deletion"""
        message_id = message.get("message_id")
        
        if not message_id:
            await self.send_message(user_id, {
                "type": "error",
                "message": "Message ID is required"
            })
            return
            
        try:
            # TODO: Mark message as deleted in database
            # For now, just broadcast the deletion
            user_info = await self.get_user_info(user_id)
            
            # Broadcast deletion to all users
            await self._broadcast_to_all({
                "type": "message_deleted",
                "message_id": message_id,
                "deleted_by": user_id,
                "deleter_nickname": user_info['nickname'],
                "timestamp": datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Failed to delete message: {str(e)}")
            await self.send_message(user_id, {
                "type": "error",
                "message": "Failed to delete message"
            })

    async def _broadcast_to_all(self, message: dict):
        """Broadcast message to all connected users"""
        tasks = []
        for user_id in self.active_connections:
            tasks.append(self.send_message(user_id, message))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

# Create global connection manager instance
manager = ConnectionManager()