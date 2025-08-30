from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://chatuser:chatpass@localhost:5432/chatapp"
    
    # Redis
    redis_url: str = "redis://:redispass@localhost:6379"
    
    # Security
    secret_key: str = "your-super-secret-key-change-this-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 1440  # 24 hours for better user experience
    
    # Environment
    environment: str = "development"
    
    # Content Moderation
    moderation_api_url: Optional[str] = None
    moderation_api_key: Optional[str] = None
    
    # AWS (for image moderation)
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-east-1"
    
    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:3001"
    
    # Rate Limiting
    rate_limit_per_minute: int = 100
    
    # WebSocket
    max_connections_per_user: int = 5
    
    # Logging
    log_level: str = "INFO"
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore"  # Ignore extra fields from environment
    }


# Create settings instance
settings = Settings()

# Rate limiting configuration
RATE_LIMITS = {
    'auth/register': '5/minute',
    'auth/refresh': '10/minute', 
    'matching/find': '3/minute',
    'chat/rooms': '20/minute',
    'moderation/reports': '5/minute',
    'default': '100/minute'
}

# WebSocket rate limiting
WEBSOCKET_LIMITS = {
    'send_message': '30/minute',
    'typing_start': '60/minute',
    'join_room': '10/minute'
}

# Community guidelines
COMMUNITY_GUIDELINES = {
    "respect": {
        "title": "Treat others with respect",
        "description": "Be kind, considerate, and respectful to all users",
        "examples": [
            "Use appropriate language",
            "Respect different opinions and perspectives", 
            "No harassment, bullying, or personal attacks"
        ],
        "violations": ["harassment", "bullying", "hate_speech"]
    },
    "privacy": {
        "title": "Protect privacy and anonymity", 
        "description": "Respect the anonymous nature of the platform",
        "examples": [
            "Don't ask for or share personal information",
            "Don't attempt to identify other users",
            "Respect others' decision to remain anonymous"
        ],
        "violations": ["doxxing", "privacy_violation", "personal_info_sharing"]
    },
    "appropriate_content": {
        "title": "Keep content appropriate",
        "description": "Share content suitable for all adult users",
        "examples": [
            "No explicit sexual content",
            "No graphic violence or disturbing content", 
            "No illegal activities or substances"
        ],
        "violations": ["explicit_content", "violence", "illegal_activity"]
    },
    "no_spam": {
        "title": "No spam or advertising",
        "description": "Keep conversations genuine and meaningful",
        "examples": [
            "Don't send repetitive messages",
            "No commercial advertising",
            "No links to external sites (unless relevant)"
        ],
        "violations": ["spam", "advertising", "repetitive_content"]
    },
    "safety": {
        "title": "Prioritize safety",
        "description": "Help maintain a safe environment for everyone",
        "examples": [
            "Report inappropriate behavior",
            "Block users who make you uncomfortable",
            "Don't engage with suspicious or harmful content"
        ],
        "violations": ["threats", "self_harm", "dangerous_behavior"]
    }
}