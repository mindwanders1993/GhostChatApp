from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional
import asyncio
import logging
import os

from ghost_identity import GhostIdentityManager
from redis_manager import RedisManager
from websocket_manager import WebSocketManager
from destruction_engine import DestructionEngine
from proof_of_work import ProofOfWorkManager

# Configure logging once to prevent duplication from uvicorn reload
root_logger = logging.getLogger()

# Clear any existing handlers to prevent duplication
for handler in root_logger.handlers[:]:
    root_logger.removeHandler(handler)

# Configure logging with single handler
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    force=True
)

logger = logging.getLogger(__name__)

async def initialize_default_rooms():
    """Create default public rooms if they don't exist"""
    logger.info("Initializing default rooms...")
    default_rooms = [
        {
            "name": "🍿 Lounge",
            "description": "General chat and casual conversations. Jump in and say hello!"
        },
        {
            "name": "💻 Tech Talk", 
            "description": "Discuss programming, tech news, gadgets, and all things technology"
        },
        {
            "name": "🎮 Gaming Zone",
            "description": "Gaming discussions, reviews, tips, and finding gaming buddies"
        },
        {
            "name": "🎬 Movies & TV",
            "description": "Share reviews, recommendations, and discuss the latest shows and films"
        },
        {
            "name": "🎵 Music Corner",
            "description": "Share your favorite music, discover new artists, and discuss concerts"
        },
        {
            "name": "📚 Books & Literature", 
            "description": "Book recommendations, reading discussions, and literary conversations"
        },
        {
            "name": "🌍 Travel Stories",
            "description": "Share travel experiences, get destination advice, and wanderlust tales"
        },
        {
            "name": "💪 Fitness & Health",
            "description": "Workout tips, healthy living, mental wellness, and motivation"
        },
        {
            "name": "🎨 Creative Corner",
            "description": "Art, design, photography, writing, and all creative endeavors"
        },
        {
            "name": "🤔 Deep Thoughts",
            "description": "Philosophy, life discussions, and meaningful conversations"
        },
        {
            "name": "☕ Coffee Break",
            "description": "Quick chats, daily life, work stories, and casual banter"
        },
        {
            "name": "🔮 Random Chat",
            "description": "Completely random topics, fun conversations, and anything goes!"
        }
    ]
    
    system_ghost_id = "system_ghost_initializer"
    
    for room_data in default_rooms:
        try:
            # Check if room with this name already exists
            existing_rooms = await redis_manager.get_all_rooms()
            room_exists = any(room["name"] == room_data["name"] for room in existing_rooms)
            
            if not room_exists:
                room_options = {
                    "description": room_data["description"],
                    "is_public": True
                }
                created_room = await redis_manager.create_room(
                    system_ghost_id, 
                    room_data["name"], 
                    room_options
                )
                logger.info(f"Created default room: {room_data['name']}")
        except Exception as e:
            logger.error(f"Failed to create room {room_data['name']}: {e}")
    
    logger.info(f"Completed initializing {len(default_rooms)} default rooms")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await redis_manager.connect()
    await initialize_default_rooms()
    asyncio.create_task(destruction_engine.start_cleanup_task())
    pow_manager.start_cleanup()
    yield
    pow_manager.stop_cleanup()
    await redis_manager.disconnect()

app = FastAPI(
    title="GhostChatApp",
    description="Anonymous chat with aggressive data destruction",
    version="1.0.0",
    lifespan=lifespan
)

class UserPreferences(BaseModel):
    custom_name: str
    age: Optional[str] = None
    gender: Optional[str] = None
    country: Optional[str] = None
    avatar_id: Optional[str] = "ghost"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_manager = RedisManager()
ghost_manager = GhostIdentityManager()
ws_manager = WebSocketManager(redis_manager, ghost_manager)
destruction_engine = DestructionEngine(redis_manager)
pow_manager = ProofOfWorkManager()

@app.websocket("/ws/{ghost_id}")
async def websocket_endpoint(websocket: WebSocket, ghost_id: str):
    try:
        await ws_manager.connect(ghost_id, websocket)
        
        while True:
            data = await websocket.receive_json()
            await ws_manager.handle_message(ghost_id, data)
            
    except WebSocketDisconnect:
        logger.info(f"Ghost {ghost_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for {ghost_id}: {e}")
    finally:
        await ws_manager.disconnect(ghost_id)

@app.get("/api/health")
async def health_check():
    return {"status": "alive", "message": "GhostChatApp is running"}

@app.get("/api/stats")
async def get_stats():
    active_ghosts = await redis_manager.get_active_ghost_count()
    total_rooms = await redis_manager.get_room_count()
    
    return {
        "active_ghosts": active_ghosts,
        "total_rooms": total_rooms,
        "message": "All data is ephemeral"
    }

@app.post("/api/ghost")
async def create_ghost(preferences: UserPreferences):
    ghost_id = ghost_manager.generate_ghost_id()
    await redis_manager.create_ghost_session(ghost_id, preferences.dict())
    
    display_name = preferences.custom_name or ghost_manager.get_display_name(ghost_id)
    avatar_data = ghost_manager.get_avatar_data(ghost_id, preferences.avatar_id, preferences.custom_name)
    
    return {
        "ghost_id": ghost_id,
        "display_name": display_name,
        "custom_name": preferences.custom_name,
        "age": preferences.age,
        "gender": preferences.gender,
        "country": preferences.country,
        "avatar": avatar_data,
        "session_ttl": 900  # 15 minutes
    }

@app.post("/api/ghost/{ghost_id}/destroy")
async def destroy_ghost(ghost_id: str):
    await destruction_engine.destroy_ghost_completely(ghost_id)
    return {"message": "Ghost destroyed completely"}

@app.post("/api/ghost/{ghost_id}/delete-room-data/{room_id}")
async def delete_user_data_from_room(ghost_id: str, room_id: str):
    """Delete only this user's messages from a specific room"""
    deleted_count = await redis_manager.delete_user_messages_from_room(ghost_id, room_id)
    return {
        "message": f"Deleted {deleted_count} messages from room",
        "deleted_count": deleted_count,
        "room_id": room_id
    }

@app.post("/api/ghost/{ghost_id}/delete-all-room-data")
async def delete_user_data_from_all_rooms(ghost_id: str):
    """Delete this user's messages from all rooms"""
    deleted_count = await redis_manager.delete_user_data_from_all_rooms(ghost_id)
    return {
        "message": f"Deleted {deleted_count} messages from all rooms",
        "deleted_count": deleted_count
    }

@app.get("/api/ghost/{ghost_id}/room-data/{room_id}")
async def get_user_room_data(ghost_id: str, room_id: str):
    """Get information about user's data in a specific room"""
    message_count = await redis_manager.get_user_message_count_in_room(ghost_id, room_id)
    return {
        "ghost_id": ghost_id,
        "room_id": room_id,
        "message_count": message_count,
        "can_delete": message_count > 0
    }

@app.get("/api/proof-of-work/{ghost_id}")
async def get_proof_of_work_challenge(ghost_id: str):
    challenge = await pow_manager.generate_challenge(ghost_id)
    return challenge

@app.post("/api/proof-of-work/{ghost_id}/verify")
async def verify_proof_of_work(ghost_id: str, solution: dict):
    is_valid = await pow_manager.verify_solution(ghost_id, solution)
    return {"valid": is_valid}

@app.post("/api/ghost/{ghost_id}/private-room")
async def create_private_room(ghost_id: str, target_ghost: dict):
    """Create or get existing private room between two users"""
    target_ghost_id = target_ghost.get("target_ghost_id")
    
    if not target_ghost_id:
        return {"error": "target_ghost_id is required"}, 400
    
    if ghost_id == target_ghost_id:
        return {"error": "Cannot create private room with yourself"}, 400
    
    room_data = await redis_manager.create_private_room(ghost_id, target_ghost_id)
    return {
        "room": room_data,
        "message": "Private room created successfully"
    }

@app.get("/api/ghost/{ghost_id}/private-rooms")
async def get_user_private_rooms(ghost_id: str):
    """Get all private rooms for a user"""
    private_rooms = await redis_manager.get_user_private_rooms(ghost_id)
    return {
        "private_rooms": private_rooms,
        "count": len(private_rooms)
    }

# Message Reaction Endpoints
@app.post("/api/message/{message_id}/reaction")
async def add_message_reaction(message_id: str, reaction_data: dict):
    """Add a reaction to a message"""
    ghost_id = reaction_data.get("ghost_id")
    emoji = reaction_data.get("emoji")
    
    if not ghost_id or not emoji:
        return {"error": "ghost_id and emoji are required"}, 400
    
    # Verify ghost session exists
    session = await redis_manager.get_ghost_session(ghost_id)
    if not session:
        return {"error": "Invalid ghost session"}, 401
    
    reactions = await redis_manager.add_message_reaction(message_id, ghost_id, emoji)
    return {
        "message_id": message_id,
        "reactions": reactions,
        "success": True
    }

@app.delete("/api/message/{message_id}/reaction")
async def remove_message_reaction(message_id: str, reaction_data: dict):
    """Remove a reaction from a message"""
    ghost_id = reaction_data.get("ghost_id")
    emoji = reaction_data.get("emoji")
    
    if not ghost_id or not emoji:
        return {"error": "ghost_id and emoji are required"}, 400
    
    # Verify ghost session exists
    session = await redis_manager.get_ghost_session(ghost_id)
    if not session:
        return {"error": "Invalid ghost session"}, 401
    
    reactions = await redis_manager.remove_message_reaction(message_id, ghost_id, emoji)
    return {
        "message_id": message_id,
        "reactions": reactions,
        "success": True
    }

@app.get("/api/message/{message_id}/reactions")
async def get_message_reactions(message_id: str):
    """Get all reactions for a message"""
    reactions = await redis_manager.get_message_reactions(message_id)
    return {
        "message_id": message_id,
        "reactions": reactions
    }

@app.get("/api/message/{message_id}/status")
async def get_message_status(message_id: str, room_id: str):
    """Get status information for a specific message"""
    status = await redis_manager.get_message_status(message_id, room_id)
    if not status:
        return {"error": "Message not found"}
    
    return {
        "message_id": message_id,
        "room_id": room_id,
        "status": status
    }

@app.get("/api/ghost/{ghost_id}/last-seen")
async def get_user_last_seen(ghost_id: str, room_id: str = None):
    """Get user's last seen timestamp"""
    last_seen = await redis_manager.get_user_last_seen(ghost_id, room_id)
    return {
        "ghost_id": ghost_id,
        "room_id": room_id,
        "last_seen": last_seen
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)