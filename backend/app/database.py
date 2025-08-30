from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
import asyncio
import redis.asyncio as redis
from app.config import settings

# Create async engine for PostgreSQL
engine = create_async_engine(
    settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.environment == "development",
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

# Session factory
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Base class for models
Base = declarative_base()

# Redis connection
redis_client = None

async def get_redis():
    """Get Redis connection"""
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.redis_url, decode_responses=True)
    return redis_client

async def get_db():
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        # Import all models to ensure they are registered
        from app.models import user, chat, message, moderation
        await conn.run_sync(Base.metadata.create_all)

async def close_db():
    """Close database connections"""
    await engine.dispose()
    if redis_client:
        await redis_client.close()

# Database utilities
class DatabaseManager:
    def __init__(self):
        self.engine = engine
        self.SessionLocal = AsyncSessionLocal
    
    async def health_check(self) -> bool:
        """Check if database is healthy"""
        try:
            async with self.SessionLocal() as session:
                await session.execute("SELECT 1")
                return True
        except Exception:
            return False
    
    async def cleanup_expired_data(self):
        """Clean up expired messages and sessions"""
        from app.models.message import Message
        from app.models.user import User
        from sqlalchemy import delete, text
        from datetime import datetime, timedelta
        
        async with self.SessionLocal() as session:
            # Delete expired messages
            await session.execute(
                delete(Message).where(Message.expires_at < datetime.utcnow())
            )
            
            # Delete inactive user sessions (24+ hours old)
            cutoff_time = datetime.utcnow() - timedelta(hours=24)
            await session.execute(
                delete(User).where(User.last_active < cutoff_time)
            )
            
            await session.commit()

# Create database manager instance
db_manager = DatabaseManager()