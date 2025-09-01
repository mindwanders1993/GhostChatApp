import secrets
import time
import hashlib
from typing import Dict, Tuple, Optional

class GhostIdentityManager:
    def __init__(self):
        self.colors = [
            "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", 
            "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
            "#BB8FCE", "#85C1E9", "#F8C471", "#82E0AA"
        ]
        
        self.ghost_names = [
            "Phantom", "Specter", "Wraith", "Spirit", "Shade",
            "Apparition", "Poltergeist", "Banshee", "Ghoul", "Revenant",
            "Wisp", "Ethereal", "Vapor", "Mist", "Echo"
        ]
        
        self.avatars = {
            'ghost': {'emoji': '👻', 'background_color': '#6366F1'},
            'skull': {'emoji': '💀', 'background_color': '#EF4444'},
            'ninja': {'emoji': '🥷', 'background_color': '#374151'},
            'alien': {'emoji': '👽', 'background_color': '#10B981'},
            'robot': {'emoji': '🤖', 'background_color': '#3B82F6'},
            'wizard': {'emoji': '🧙', 'background_color': '#8B5CF6'},
            'vampire': {'emoji': '🧛', 'background_color': '#DC2626'},
            'devil': {'emoji': '😈', 'background_color': '#F59E0B'},
            'demon': {'emoji': '👹', 'background_color': '#EF4444'},
            'ogre': {'emoji': '👺', 'background_color': '#059669'},
            'clown': {'emoji': '🤡', 'background_color': '#EC4899'},
            'pirate': {'emoji': '🏴‍☠️', 'background_color': '#1F2937'},
        }

    def generate_ghost_id(self) -> str:
        timestamp = int(time.time() * 1000)
        random_component = secrets.token_hex(8)
        return f"ghost_{timestamp}_{random_component}"

    def get_display_name(self, ghost_id: str) -> str:
        hash_obj = hashlib.md5(ghost_id.encode())
        hash_int = int(hash_obj.hexdigest(), 16)
        
        name_index = hash_int % len(self.ghost_names)
        number = (hash_int // len(self.ghost_names)) % 9999 + 1
        
        return f"{self.ghost_names[name_index]}#{number:04d}"

    def get_avatar_data(self, ghost_id: str, avatar_id: Optional[str] = None, custom_name: Optional[str] = None) -> Dict[str, str]:
        if avatar_id and avatar_id in self.avatars:
            avatar_info = self.avatars[avatar_id]
            initials = custom_name[:2].upper() if custom_name else self.get_display_name(ghost_id)[:2].upper()
            
            return {
                "background_color": avatar_info['background_color'],
                "text_color": "#FFFFFF",
                "initials": initials,
                "avatar_id": avatar_id,
                "emoji": avatar_info['emoji']
            }
        else:
            # Fallback to hash-based avatar
            hash_obj = hashlib.md5(ghost_id.encode())
            hash_int = int(hash_obj.hexdigest(), 16)
            
            color_index = hash_int % len(self.colors)
            
            return {
                "background_color": self.colors[color_index],
                "text_color": "#FFFFFF" if self._is_dark_color(self.colors[color_index]) else "#000000",
                "initials": custom_name[:2].upper() if custom_name else self.get_display_name(ghost_id)[:2].upper()
            }

    def _is_dark_color(self, hex_color: str) -> bool:
        hex_color = hex_color.lstrip('#')
        r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        brightness = (r * 299 + g * 587 + b * 114) / 1000
        return brightness < 128

    def extract_short_id(self, ghost_id: str) -> str:
        if "_" in ghost_id:
            return ghost_id.split("_")[-1][-4:]
        return ghost_id[-4:]

    def is_valid_ghost_id(self, ghost_id: str) -> bool:
        if not ghost_id or not isinstance(ghost_id, str):
            return False
        
        if not ghost_id.startswith("ghost_"):
            return False
            
        parts = ghost_id.split("_")
        if len(parts) != 3:
            return False
            
        try:
            timestamp = int(parts[1])
            hex_component = parts[2]
            
            if len(hex_component) != 16:
                return False
                
            int(hex_component, 16)
            
            current_time = int(time.time() * 1000)
            if timestamp > current_time:
                return False
                
            return True
            
        except (ValueError, IndexError):
            return False