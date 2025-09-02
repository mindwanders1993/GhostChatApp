import asyncio
import json
import logging
from typing import Dict, Set, Optional
from fastapi import WebSocket
from redis_manager import RedisManager
from ghost_identity import GhostIdentityManager

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self, redis_manager: RedisManager, ghost_manager: GhostIdentityManager):
        self.redis_manager = redis_manager
        self.ghost_manager = ghost_manager
        self.active_connections: Dict[str, WebSocket] = {}
        self.ghost_rooms: Dict[str, Set[str]] = {}
        self.heartbeat_tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, ghost_id: str, websocket: WebSocket):
        if not self.ghost_manager.is_valid_ghost_id(ghost_id):
            await websocket.close(code=1008, reason="Invalid ghost ID")
            return

        # Close any existing connection for this ghost
        if ghost_id in self.active_connections:
            try:
                old_websocket = self.active_connections[ghost_id]
                await old_websocket.close(code=1000, reason="New connection established")
            except:
                pass  # Ignore errors closing old connection
            
            # Cancel old heartbeat task
            if ghost_id in self.heartbeat_tasks:
                self.heartbeat_tasks[ghost_id].cancel()

        await websocket.accept()
        
        # Check if this is a reconnection (ghost was previously connected)
        was_previously_connected = ghost_id in self.active_connections
        
        self.active_connections[ghost_id] = websocket
        
        # Only restore room memberships for actual reconnections, not new connections
        if was_previously_connected:
            user_rooms = await self.redis_manager.get_user_rooms(ghost_id)
            self.ghost_rooms[ghost_id] = user_rooms
            logger.info(f"Restored {len(user_rooms)} room memberships for reconnection {ghost_id}: {user_rooms}")
        else:
            self.ghost_rooms[ghost_id] = set()
            logger.info(f"New connection for {ghost_id}, starting with empty room set")
        
        # Only create session if it doesn't exist, otherwise just update activity
        existing_session = await self.redis_manager.get_ghost_session(ghost_id)
        if not existing_session:
            await self.redis_manager.create_ghost_session(ghost_id)
        else:
            await self.redis_manager.update_ghost_activity(ghost_id)
        
        self.heartbeat_tasks[ghost_id] = asyncio.create_task(
            self._heartbeat_loop(ghost_id)
        )
        
        # Get display name (custom name if available, otherwise auto-generated)
        session = await self.redis_manager.get_ghost_session(ghost_id)
        display_name = session.get('custom_name') if session else None
        if not display_name:
            display_name = self.ghost_manager.get_display_name(ghost_id)
        
        await self._send_personal_message(ghost_id, {
            "type": "connection_established",
            "ghost_id": ghost_id,
            "display_name": display_name,
            "avatar": self.ghost_manager.get_avatar_data(ghost_id),
            "session_ttl": 900
        })
        
        logger.info(f"Ghost {ghost_id} connected")

    async def disconnect(self, ghost_id: str):
        if ghost_id in self.active_connections:
            try:
                # Leave all rooms properly
                for room_id in list(self.ghost_rooms.get(ghost_id, [])):
                    await self._leave_room(ghost_id, room_id)
                
                # Cancel heartbeat task
                if ghost_id in self.heartbeat_tasks:
                    self.heartbeat_tasks[ghost_id].cancel()
                    del self.heartbeat_tasks[ghost_id]
                
                # Close WebSocket connection if still open
                websocket = self.active_connections[ghost_id]
                if websocket and hasattr(websocket, 'client_state') and websocket.client_state.name == 'CONNECTED':
                    try:
                        await websocket.close(code=1000, reason="Server disconnect")
                    except:
                        pass  # Ignore errors during close
                
                # Clean up connection tracking
                del self.active_connections[ghost_id]
                if ghost_id in self.ghost_rooms:
                    del self.ghost_rooms[ghost_id]
                
                logger.info(f"Ghost {ghost_id} disconnected")
                
            except Exception as e:
                logger.error(f"Error during disconnect for {ghost_id}: {e}")
                # Still clean up tracking even if there was an error
                self.active_connections.pop(ghost_id, None)
                self.ghost_rooms.pop(ghost_id, None)
                if ghost_id in self.heartbeat_tasks:
                    self.heartbeat_tasks[ghost_id].cancel()
                    del self.heartbeat_tasks[ghost_id]

    async def handle_message(self, ghost_id: str, data: Dict):
        try:
            message_type = data.get("type")
            logger.info(f"WebSocket message from {ghost_id}: type={message_type}, data={data}")
            
            if message_type == "join_room":
                await self._handle_join_room(ghost_id, data)
            elif message_type == "leave_room":
                await self._handle_leave_room(ghost_id, data)
            elif message_type == "send_message":
                await self._handle_send_message(ghost_id, data)
            elif message_type == "create_room":
                await self._handle_create_room(ghost_id, data)
            elif message_type == "list_rooms":
                await self._handle_list_rooms(ghost_id)
            elif message_type == "ping":
                await self._handle_ping(ghost_id)
            elif message_type == "typing":
                await self._handle_typing(ghost_id, data)
            elif message_type == "add_reaction":
                await self._handle_add_reaction(ghost_id, data)
            elif message_type == "remove_reaction":
                await self._handle_remove_reaction(ghost_id, data)
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except Exception as e:
            logger.error(f"Error handling message from {ghost_id}: {e}")
            await self._send_error(ghost_id, "Message processing failed")

    async def _handle_join_room(self, ghost_id: str, data: Dict):
        room_id = data.get("room_id")
        logger.info(f"JOIN ROOM: ghost {ghost_id} attempting to join room {room_id}")
        
        if not room_id:
            logger.error(f"JOIN ROOM ERROR: No room ID provided by {ghost_id}")
            await self._send_error(ghost_id, "Room ID is required")
            return

        # Ensure ghost_rooms entry exists
        if ghost_id not in self.ghost_rooms:
            self.ghost_rooms[ghost_id] = set()
            
        # Leave all other rooms first to ensure clean room switching
        current_rooms = self.ghost_rooms.get(ghost_id, set()).copy()
        for current_room_id in current_rooms:
            if current_room_id != room_id:
                await self.redis_manager.leave_room(ghost_id, current_room_id)
                self.ghost_rooms[ghost_id].discard(current_room_id)
                logger.info(f"LEFT ROOM: ghost {ghost_id} left room {current_room_id} for clean switch")

        await self.redis_manager.join_room(ghost_id, room_id)
        self.ghost_rooms[ghost_id].add(room_id)
        logger.info(f"JOIN ROOM SUCCESS: ghost {ghost_id} joined room {room_id}")
        
        messages = await self.redis_manager.get_room_messages(room_id, limit=50)
        room_members = await self.redis_manager.get_room_members(room_id)
        
        # Get display names for all members
        members_with_names = []
        for member_id in room_members:
            member_session = await self.redis_manager.get_ghost_session(member_id)
            member_display = member_session.get('custom_name') if member_session else None
            if not member_display:
                member_display = self.ghost_manager.get_display_name(member_id)
            
            members_with_names.append({
                "ghost_id": member_id,
                "display_name": member_display
            })
        
        await self._send_personal_message(ghost_id, {
            "type": "room_joined",
            "room_id": room_id,
            "messages": messages,
            "members": members_with_names
        })
        
        # Get custom display name for join notification
        session = await self.redis_manager.get_ghost_session(ghost_id)
        display_name = session.get('custom_name') if session else None
        if not display_name:
            display_name = self.ghost_manager.get_display_name(ghost_id)
        
        await self._broadcast_to_room(room_id, {
            "type": "ghost_joined",
            "ghost_id": ghost_id,
            "display_name": display_name
        }, exclude_ghost=ghost_id)

    async def _handle_leave_room(self, ghost_id: str, data: Dict):
        room_id = data.get("room_id")
        if not room_id:
            return
        
        await self._leave_room(ghost_id, room_id)

    async def _leave_room(self, ghost_id: str, room_id: str):
        await self.redis_manager.leave_room(ghost_id, room_id)
        
        if ghost_id in self.ghost_rooms:
            self.ghost_rooms[ghost_id].discard(room_id)
        
        await self._send_personal_message(ghost_id, {
            "type": "room_left",
            "room_id": room_id
        })
        
        # Get custom display name for leave notification
        session = await self.redis_manager.get_ghost_session(ghost_id)
        display_name = session.get('custom_name') if session else None
        if not display_name:
            display_name = self.ghost_manager.get_display_name(ghost_id)
        
        await self._broadcast_to_room(room_id, {
            "type": "ghost_left",
            "ghost_id": ghost_id,
            "display_name": display_name
        }, exclude_ghost=ghost_id)

    async def _handle_send_message(self, ghost_id: str, data: Dict):
        room_id = data.get("room_id")
        content = data.get("content")
        
        if not room_id or not content:
            await self._send_error(ghost_id, "Room ID and content are required")
            return
        
        if room_id not in self.ghost_rooms.get(ghost_id, set()):
            await self._send_error(ghost_id, "You are not in this room")
            return
        
        if len(content.strip()) == 0 or len(content) > 1000:
            await self._send_error(ghost_id, "Invalid message content")
            return
        
        message = await self.redis_manager.send_message(ghost_id, room_id, content.strip())
        
        # Get user session to get custom name
        session = await self.redis_manager.get_ghost_session(ghost_id)
        sender_display = session.get('custom_name') if session else None
        if not sender_display:
            sender_display = self.ghost_manager.get_display_name(ghost_id)
        
        await self._broadcast_to_room(room_id, {
            "type": "new_message",
            "message": {
                **message,
                "sender_display": sender_display
            }
        })

    async def _handle_create_room(self, ghost_id: str, data: Dict):
        room_name = data.get("room_name")
        room_options = data.get("room_options", {})
        
        room_data = await self.redis_manager.create_room(ghost_id, room_name, room_options)
        
        await self._send_personal_message(ghost_id, {
            "type": "room_created",
            "room": room_data
        })

    async def _handle_list_rooms(self, ghost_id: str):
        rooms = await self.redis_manager.get_all_rooms()
        
        await self._send_personal_message(ghost_id, {
            "type": "room_list",
            "rooms": rooms
        })

    async def _handle_ping(self, ghost_id: str):
        await self.redis_manager.update_ghost_activity(ghost_id)
        await self._send_personal_message(ghost_id, {
            "type": "pong",
            "timestamp": asyncio.get_event_loop().time()
        })

    async def _handle_typing(self, ghost_id: str, data: Dict):
        room_id = data.get("room_id")
        is_typing = data.get("is_typing", False)
        
        if room_id and room_id in self.ghost_rooms.get(ghost_id, set()):
            # Get custom display name for typing indicator
            session = await self.redis_manager.get_ghost_session(ghost_id)
            display_name = session.get('custom_name') if session else None
            if not display_name:
                display_name = self.ghost_manager.get_display_name(ghost_id)
            
            await self._broadcast_to_room(room_id, {
                "type": "typing_indicator",
                "ghost_id": ghost_id,
                "display_name": display_name,
                "is_typing": is_typing
            }, exclude_ghost=ghost_id)

    async def _send_personal_message(self, ghost_id: str, message: Dict):
        if ghost_id in self.active_connections:
            try:
                await self.active_connections[ghost_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to send message to {ghost_id}: {e}")
                await self.disconnect(ghost_id)

    async def _broadcast_to_room(self, room_id: str, message: Dict, exclude_ghost: Optional[str] = None):
        room_members = await self.redis_manager.get_room_members(room_id)
        
        for member_ghost_id in room_members:
            if member_ghost_id != exclude_ghost and member_ghost_id in self.active_connections:
                await self._send_personal_message(member_ghost_id, message)

    async def _send_error(self, ghost_id: str, error_message: str):
        await self._send_personal_message(ghost_id, {
            "type": "error",
            "message": error_message
        })

    async def _heartbeat_loop(self, ghost_id: str):
        try:
            while ghost_id in self.active_connections:
                await asyncio.sleep(45)  # Heartbeat every 45 seconds (less aggressive)
                
                if ghost_id not in self.active_connections:
                    break
                
                # Check if connection is still valid
                websocket = self.active_connections.get(ghost_id)
                if not websocket or websocket.client_state.name != 'CONNECTED':
                    break
                    
                try:
                    await websocket.send_text(json.dumps({
                        "type": "heartbeat",
                        "timestamp": asyncio.get_event_loop().time()
                    }))
                    await self.redis_manager.update_ghost_activity(ghost_id)
                except Exception as e:
                    logger.warning(f"Heartbeat failed for {ghost_id}: {e}")
                    await self.disconnect(ghost_id)
                    break
                    
        except asyncio.CancelledError:
            logger.debug(f"Heartbeat cancelled for {ghost_id}")
        except Exception as e:
            logger.error(f"Heartbeat error for {ghost_id}: {e}")

    async def broadcast_stats_update(self):
        active_ghosts = await self.redis_manager.get_active_ghost_count()
        total_rooms = await self.redis_manager.get_room_count()
        
        stats_message = {
            "type": "stats_update",
            "active_ghosts": active_ghosts,
            "total_rooms": total_rooms
        }
        
        for ghost_id in list(self.active_connections.keys()):
            await self._send_personal_message(ghost_id, stats_message)

    async def _handle_add_reaction(self, ghost_id: str, data: Dict):
        """Handle adding a reaction to a message"""
        message_id = data.get("message_id")
        emoji = data.get("emoji")
        room_id = data.get("room_id")
        
        if not message_id or not emoji or not room_id:
            await self._send_error(ghost_id, "message_id, emoji, and room_id are required")
            return
        
        # Verify user is in the room
        if room_id not in self.ghost_rooms.get(ghost_id, set()):
            await self._send_error(ghost_id, "You are not in this room")
            return
        
        try:
            reactions = await self.redis_manager.add_message_reaction(message_id, ghost_id, emoji)
            
            # Broadcast reaction update to all room members
            await self._broadcast_to_room(room_id, {
                "type": "message_reaction",
                "message_id": message_id,
                "action": "add",
                "emoji": emoji,
                "ghost_id": ghost_id,
                "reactions": reactions
            })
            
            logger.info(f"Ghost {ghost_id} added reaction {emoji} to message {message_id}")
            
        except Exception as e:
            logger.error(f"Error adding reaction: {e}")
            await self._send_error(ghost_id, "Failed to add reaction")

    async def _handle_remove_reaction(self, ghost_id: str, data: Dict):
        """Handle removing a reaction from a message"""
        message_id = data.get("message_id")
        emoji = data.get("emoji")
        room_id = data.get("room_id")
        
        if not message_id or not emoji or not room_id:
            await self._send_error(ghost_id, "message_id, emoji, and room_id are required")
            return
        
        # Verify user is in the room
        if room_id not in self.ghost_rooms.get(ghost_id, set()):
            await self._send_error(ghost_id, "You are not in this room")
            return
        
        try:
            reactions = await self.redis_manager.remove_message_reaction(message_id, ghost_id, emoji)
            
            # Broadcast reaction update to all room members
            await self._broadcast_to_room(room_id, {
                "type": "message_reaction",
                "message_id": message_id,
                "action": "remove",
                "emoji": emoji,
                "ghost_id": ghost_id,
                "reactions": reactions
            })
            
            logger.info(f"Ghost {ghost_id} removed reaction {emoji} from message {message_id}")
            
        except Exception as e:
            logger.error(f"Error removing reaction: {e}")
            await self._send_error(ghost_id, "Failed to remove reaction")