import pytest
import asyncio
from httpx import AsyncClient
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import Mock

from backend.main import app
from backend.app.database import get_db, Base
from backend.app.config import settings

# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False}
)

TestAsyncSessionLocal = sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def setup_database():
    """Set up test database."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session(setup_database):
    """Create a test database session."""
    async with TestAsyncSessionLocal() as session:
        yield session
        await session.rollback()

@pytest.fixture
async def client(db_session):
    """Create a test client with database dependency override."""
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://testserver") as ac:
        yield ac
    
    app.dependency_overrides.clear()

@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    redis_mock = Mock()
    redis_mock.get.return_value = None
    redis_mock.set.return_value = True
    redis_mock.setex.return_value = True
    redis_mock.delete.return_value = True
    redis_mock.keys.return_value = []
    return redis_mock

@pytest.fixture
def mock_websocket():
    """Mock WebSocket connection."""
    ws_mock = Mock()
    ws_mock.accept.return_value = None
    ws_mock.send_text.return_value = None
    ws_mock.receive_text.return_value = '{"type": "test"}'
    ws_mock.close.return_value = None
    return ws_mock

@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "nickname": "testuser",
        "age_verified": True,
        "preferences": {
            "age_range": [18, 35],
            "interests": ["music", "gaming"],
            "language": "en"
        }
    }

@pytest.fixture
def sample_message_data():
    """Sample message data for testing."""
    return {
        "room_id": "test-room-id",
        "content": "Hello, world!",
        "message_type": "text"
    }

@pytest.fixture
def sample_matching_preferences():
    """Sample matching preferences for testing."""
    return {
        "age_range": [20, 30],
        "interests": ["technology", "movies"],
        "language": "en"
    }