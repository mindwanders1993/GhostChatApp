import socketio
import asyncio
import logging
from typing import Dict, List, Set
from datetime import datetime
from app.services.auth_service import AuthService
from app.services.chat_service import ChatService
from app.services.moderation_service import moderation_service
from app.middleware.rate_limit import websocket_rate_limiter
from app.database import get_db

logger = logging.getLogger(__name__)

class SocketIOManager:
    """Socket.IO WebSocket manager for real-time chat"""
    
    def __init__(self):
        # Create Socket.IO server
        self.sio = socketio.AsyncServer(
            cors_allowed_origins="*",
            logger=True,
            engineio_logger=True,
            async_mode='asgi'
        )
        
        # Connection tracking
        self.active_connections: Dict[str, str] = {}  # session_id -> user_id
        self.user_sessions: Dict[str, str] = {}      # user_id -> session_id
        self.room_connections: Dict[str, Set[str]] = {}  # room_id -> set of user_ids
        self.user_rooms: Dict[str, Set[str]] = {}        # user_id -> set of room_ids
        self.typing_indicators: Dict[str, Dict[str, datetime]] = {}  # room_id -> {user_id: timestamp}
        
        # Register event handlers
        self._register_handlers()
    
    def _register_handlers(self):
        """Register Socket.IO event handlers"""
        
        @self.sio.event
        async def connect(sid, environ, auth):
            """Handle client connection"""
            try:
                # Extract token from auth
                token = auth.get('token') if auth else None
                if not token:
                    logger.warning(f"Connection {sid} rejected: No token provided")
                    await self.sio.disconnect(sid)
                    return False
                
                # Validate session
                session = await AuthService.validate_session(token)
                if not session:
                    logger.warning(f"Connection {sid} rejected: Invalid token")
                    await self.sio.disconnect(sid)
                    return False
                
                user_id = session.user_id
                
                # Store connection mapping
                self.active_connections[sid] = user_id
                self.user_sessions[user_id] = sid
                self.user_rooms[user_id] = set()
                
                logger.info(f"User {user_id} connected via Socket.IO (session: {sid})")
                
                # Send connection confirmation
                await self.sio.emit('connected', {
                    'status': 'connected',
                    'user_id': user_id,
                    'timestamp': datetime.utcnow().isoformat()
                }, room=sid)
                
                return True
                
            except Exception as e:
                logger.error(f"Connection error for {sid}: {str(e)}")
                await self.sio.disconnect(sid)
                return False
        
        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection"""
            try:
                user_id = self.active_connections.get(sid)
                if user_id:
                    await self._handle_disconnect(user_id, sid)
                logger.info(f"Session {sid} (user: {user_id}) disconnected")
            except Exception as e:
                logger.error(f"Disconnect error for {sid}: {str(e)}")
        
        @self.sio.event
        async def join_room(sid, data):
            """Handle join room request"""
            try:
                user_id = self.active_connections.get(sid)
                if not user_id:
                    return {'error': 'Not authenticated'}
                
                room_id = data.get('room_id')
                if not room_id:
                    return {'error': 'Room ID required'}
                
                await self._join_room(user_id, room_id, sid)
                return {'status': 'joined', 'room_id': room_id}
                
            except Exception as e:
                logger.error(f"Join room error for {sid}: {str(e)}")
                return {'error': 'Failed to join room'}
        
        @self.sio.event
        async def leave_room(sid, data):
            """Handle leave room request"""
            try:
                user_id = self.active_connections.get(sid)
                if not user_id:
                    return {'error': 'Not authenticated'}
                
                room_id = data.get('room_id')
                reason = data.get('reason', 'user_left')
                
                if not room_id:
                    return {'error': 'Room ID required'}
                
                await self._leave_room(user_id, room_id, reason, sid)
                return {'status': 'left', 'room_id': room_id}
                
            except Exception as e:
                logger.error(f"Leave room error for {sid}: {str(e)}")
                return {'error': 'Failed to leave room'}
        
        @self.sio.event
        async def send_message(sid, data):
            """Handle send message request"""
            try:
                user_id = self.active_connections.get(sid)
                if not user_id:
                    return {'error': 'Not authenticated'}
                
                # Rate limiting check
                if not await websocket_rate_limiter.check_limit(user_id, 'send_message'):
                    return {'error': 'Rate limit exceeded'}
                
                room_id = data.get('room_id')
                content = data.get('content')
                message_type = data.get('message_type', 'text')
                
                if not room_id or not content:
                    return {'error': 'Room ID and content are required'}
                
                # Check if user is in the room
                if room_id not in self.user_rooms.get(user_id, set()):
                    return {'error': 'You are not in this room'}
                
                # Content moderation check
                moderation_result = await moderation_service.check_content(content)
                if not moderation_result.is_safe:
                    await self.sio.emit('moderation_warning', {
                        'message': 'Your message contains inappropriate content and was not sent',
                        'reasons': moderation_result.reasons
                    }, room=sid)
                    return {'error': 'Content moderation blocked message'}
                
                # Create and broadcast message
                formatting = data.get('formatting')
                # Support for encrypted messages
                is_encrypted = data.get('is_encrypted', False)
                encryption_iv = data.get('encryption_iv')
                encryption_key_id = data.get('encryption_key_id')
                
                message_id = await self._broadcast_message(
                    user_id, room_id, content, message_type, formatting,
                    is_encrypted=is_encrypted,
                    encryption_iv=encryption_iv,
                    encryption_key_id=encryption_key_id
                )
                
                return {
                    'status': 'sent',
                    'message_id': message_id,
                    'timestamp': datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Send message error for {sid}: {str(e)}")
                return {'error': 'Failed to send message'}
        
        @self.sio.event
        async def typing_start(sid, data):
            """Handle typing start indicator"""
            try:
                user_id = self.active_connections.get(sid)
                if not user_id:
                    return
                
                room_id = data.get('room_id')
                if not room_id or room_id not in self.user_rooms.get(user_id, set()):
                    return
                
                await self._handle_typing_indicator(user_id, room_id, True)
                
            except Exception as e:
                logger.error(f"Typing start error for {sid}: {str(e)}")
        
        @self.sio.event
        async def typing_stop(sid, data):
            """Handle typing stop indicator"""
            try:
                user_id = self.active_connections.get(sid)
                if not user_id:
                    return
                
                room_id = data.get('room_id')
                if not room_id or room_id not in self.user_rooms.get(user_id, set()):
                    return
                
                await self._handle_typing_indicator(user_id, room_id, False)
                
            except Exception as e:
                logger.error(f"Typing stop error for {sid}: {str(e)}")
        
        @self.sio.event
        async def ping(sid, data):
            """Handle ping for connection health check"""
            await self.sio.emit('pong', {'timestamp': datetime.utcnow().isoformat()}, room=sid)
        
        @self.sio.event
        async def edit_message(sid, data):
            """Handle message editing"""
            try:
                user_id = self.active_connections.get(sid)
                if not user_id:
                    return {'error': 'Not authenticated'}
                
                # Rate limiting check
                if not await websocket_rate_limiter.check_limit(user_id, 'edit_message'):
                    return {'error': 'Rate limit exceeded'}
                
                message_id = data.get('message_id')
                new_content = data.get('content')
                formatting = data.get('formatting')
                room_id = data.get('room_id')
                
                if not message_id or not new_content or not room_id:
                    return {'error': 'Message ID, content, and room ID are required'}
                
                # Check if user is in the room
                if room_id not in self.user_rooms.get(user_id, set()):
                    return {'error': 'You are not in this room'}
                
                # Content moderation check
                moderation_result = await moderation_service.check_content(new_content)
                if not moderation_result.is_safe:
                    await self.sio.emit('moderation_warning', {
                        'message': 'Your edited message contains inappropriate content',
                        'reasons': moderation_result.reasons
                    }, room=sid)
                    return {'error': 'Content moderation blocked message edit'}
                
                # Update message in database
                async for db in get_db():
                    try:
                        updated_message = await ChatService.edit_message(
                            db, message_id, user_id, new_content, formatting
                        )
                        if not updated_message:
                            return {'error': 'Message not found or you cannot edit this message'}
                        
                        # Broadcast edit to room
                        await self._broadcast_to_room(room_id, 'message_edited', {
                            'message_id': message_id,
                            'room_id': room_id,
                            'sender_id': user_id,
                            'content': new_content,
                            'formatting': formatting,
                            'edited_at': datetime.utcnow().isoformat(),
                            'is_edited': True
                        })
                        
                        return {
                            'status': 'edited',
                            'message_id': message_id,
                            'timestamp': datetime.utcnow().isoformat()
                        }
                        
                    except Exception as db_error:
                        logger.error(f"Database error editing message: {str(db_error)}")
                        return {'error': 'Failed to update message'}
                    finally:
                        await db.close()
                        break
                        
            except Exception as e:
                logger.error(f"Edit message error for {sid}: {str(e)}")
                return {'error': 'Failed to edit message'}
        
        @self.sio.event
        async def delete_message(sid, data):
            """Handle message deletion"""
            try:
                user_id = self.active_connections.get(sid)
                if not user_id:
                    return {'error': 'Not authenticated'}
                
                # Rate limiting check
                if not await websocket_rate_limiter.check_limit(user_id, 'delete_message'):
                    return {'error': 'Rate limit exceeded'}
                
                message_id = data.get('message_id')
                room_id = data.get('room_id')
                
                if not message_id or not room_id:
                    return {'error': 'Message ID and room ID are required'}
                
                # Check if user is in the room
                if room_id not in self.user_rooms.get(user_id, set()):
                    return {'error': 'You are not in this room'}
                
                # Delete message in database
                async for db in get_db():
                    try:
                        deleted = await ChatService.delete_message(db, message_id, user_id)
                        if not deleted:
                            return {'error': 'Message not found or you cannot delete this message'}
                        
                        # Broadcast deletion to room
                        await self._broadcast_to_room(room_id, 'message_deleted', {
                            'message_id': message_id,
                            'room_id': room_id,
                            'deleted_by': user_id,
                            'timestamp': datetime.utcnow().isoformat()
                        })
                        
                        return {
                            'status': 'deleted',
                            'message_id': message_id,
                            'timestamp': datetime.utcnow().isoformat()
                        }
                        
                    except Exception as db_error:
                        logger.error(f"Database error deleting message: {str(db_error)}")
                        return {'error': 'Failed to delete message'}
                    finally:
                        await db.close()
                        break
                        
            except Exception as e:
                logger.error(f"Delete message error for {sid}: {str(e)}")
                return {'error': 'Failed to delete message'}
    
    async def _handle_disconnect(self, user_id: str, sid: str):
        """Handle user disconnection cleanup"""
        try:
            # Remove from active connections
            self.active_connections.pop(sid, None)
            self.user_sessions.pop(user_id, None)
            
            # Leave all rooms
            if user_id in self.user_rooms:
                user_room_ids = self.user_rooms[user_id].copy()
                for room_id in user_room_ids:
                    await self._leave_room(user_id, room_id, "user_disconnected", sid)
                del self.user_rooms[user_id]
            
            # Clear typing indicators
            for room_id in self.typing_indicators:
                if user_id in self.typing_indicators[room_id]:
                    del self.typing_indicators[room_id][user_id]
                    # Notify others that user stopped typing
                    await self._broadcast_to_room(room_id, 'typing_indicator', {
                        'user_id': user_id,
                        'is_typing': False,
                        'room_id': room_id
                    }, exclude_user=user_id)
            
            logger.info(f"User {user_id} fully disconnected")
            
        except Exception as e:
            logger.error(f"Error during disconnect cleanup for user {user_id}: {str(e)}")
    
    async def _join_room(self, user_id: str, room_id: str, sid: str):
        """Add user to room"""
        try:
            # Add to Socket.IO room
            await self.sio.enter_room(sid, room_id)
            
            # Update tracking
            if room_id not in self.room_connections:
                self.room_connections[room_id] = set()
            
            self.room_connections[room_id].add(user_id)
            self.user_rooms[user_id].add(room_id)
            
            # Notify other users in room
            await self._broadcast_to_room(room_id, 'user_joined', {
                'user_id': user_id,
                'room_id': room_id,
                'timestamp': datetime.utcnow().isoformat()
            }, exclude_user=user_id)
            
            logger.info(f"User {user_id} joined room {room_id}")
            
        except Exception as e:
            logger.error(f"Error joining room {room_id} for user {user_id}: {str(e)}")
    
    async def _leave_room(self, user_id: str, room_id: str, reason: str, sid: str):
        """Remove user from room"""
        try:
            # Leave Socket.IO room
            await self.sio.leave_room(sid, room_id)
            
            # Update tracking
            if room_id in self.room_connections:
                self.room_connections[room_id].discard(user_id)
                
                # Clean up empty rooms
                if not self.room_connections[room_id]:
                    del self.room_connections[room_id]
            
            if user_id in self.user_rooms:
                self.user_rooms[user_id].discard(room_id)
            
            # Clear typing indicators
            if room_id in self.typing_indicators:
                self.typing_indicators[room_id].pop(user_id, None)
            
            # Notify other users in room
            await self._broadcast_to_room(room_id, 'user_left', {
                'user_id': user_id,
                'room_id': room_id,
                'reason': reason,
                'timestamp': datetime.utcnow().isoformat()
            }, exclude_user=user_id)
            
            logger.info(f"User {user_id} left room {room_id} (reason: {reason})")
            
        except Exception as e:
            logger.error(f"Error leaving room {room_id} for user {user_id}: {str(e)}")
    
    async def _broadcast_message(self, user_id: str, room_id: str, content: str, message_type: str, formatting: dict = None,
                               is_encrypted: bool = False, encryption_iv: str = None, encryption_key_id: str = None) -> str:
        """Create and broadcast message to room"""
        try:
            # Save message to database
            async for db in get_db():
                try:
                    message = await ChatService.create_message(
                        db, room_id, user_id, content, message_type, formatting=formatting,
                        is_encrypted=is_encrypted, encryption_iv=encryption_iv, encryption_key_id=encryption_key_id
                    )
                    
                    message_data = {
                        'id': str(message.id),
                        'room_id': room_id,
                        'sender_id': user_id,
                        'sender_nickname': message.sender.nickname if message.sender else None,
                        'content': content,
                        'message_type': message_type,
                        'formatting': formatting,
                        'is_encrypted': is_encrypted,
                        'encryption_iv': encryption_iv,
                        'encryption_key_id': encryption_key_id,
                        'timestamp': message.sent_at.isoformat(),
                        'is_edited': False
                    }
                    
                    # Broadcast to room (including sender for confirmation)
                    await self._broadcast_to_room(room_id, 'message_received', message_data)
                    
                    logger.info(f"Broadcasted message in room {room_id} from user {user_id}")
                    return str(message.id)
                    
                except Exception as db_error:
                    logger.error(f"Database error creating message: {str(db_error)}")
                    # Fallback to in-memory message for WebSocket demo
                    message_id = f"msg_{datetime.utcnow().timestamp()}"
                    message_data = {
                        'id': message_id,
                        'room_id': room_id,
                        'sender_id': user_id,
                        'content': content,
                        'message_type': message_type,
                        'formatting': formatting,
                        'timestamp': datetime.utcnow().isoformat(),
                        'is_edited': False
                    }
                    await self._broadcast_to_room(room_id, 'message_received', message_data)
                    return message_id
                finally:
                    await db.close()
                    break
            
        except Exception as e:
            logger.error(f"Failed to broadcast message: {str(e)}")
            raise
    
    async def _handle_typing_indicator(self, user_id: str, room_id: str, is_typing: bool):
        """Handle typing indicators"""
        try:
            # Update typing indicators
            if room_id not in self.typing_indicators:
                self.typing_indicators[room_id] = {}
            
            if is_typing:
                self.typing_indicators[room_id][user_id] = datetime.utcnow()
            else:
                self.typing_indicators[room_id].pop(user_id, None)
            
            # Broadcast to room
            await self._broadcast_to_room(room_id, 'typing_indicator', {
                'room_id': room_id,
                'user_id': user_id,
                'is_typing': is_typing
            }, exclude_user=user_id)
            
        except Exception as e:
            logger.error(f"Error handling typing indicator: {str(e)}")
    
    async def _broadcast_to_room(self, room_id: str, event: str, data: dict, exclude_user: str = None):
        """Broadcast event to all users in room"""
        try:
            if room_id not in self.room_connections:
                return
            
            # Send to all users in room via Socket.IO room
            # Note: exclude_user is not used with Socket.IO room broadcasts
            await self.sio.emit(event, data, room=room_id)
            
        except Exception as e:
            logger.error(f"Failed to broadcast to room {room_id}: {str(e)}")
    
    async def send_to_user(self, user_id: str, event: str, data: dict):
        """Send event to specific user"""
        try:
            session_id = self.user_sessions.get(user_id)
            if session_id:
                await self.sio.emit(event, data, room=session_id)
        except Exception as e:
            logger.error(f"Failed to send to user {user_id}: {str(e)}")
    
    def get_connected_users(self) -> List[str]:
        """Get list of connected user IDs"""
        return list(self.user_sessions.keys())
    
    def get_room_users(self, room_id: str) -> List[str]:
        """Get list of users in room"""
        return list(self.room_connections.get(room_id, set()))
    
    def is_user_online(self, user_id: str) -> bool:
        """Check if user is online"""
        return user_id in self.user_sessions

# Create global Socket.IO manager instance
socketio_manager = SocketIOManager()