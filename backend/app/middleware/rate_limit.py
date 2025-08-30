from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
from typing import Dict, Optional
from app.database import get_redis
from app.config import settings, RATE_LIMITS
import logging

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware"""
    
    def __init__(self, app, default_calls: int = 100, default_period: int = 60):
        super().__init__(app)
        self.default_calls = default_calls
        self.default_period = default_period
        self.rate_limits = RATE_LIMITS
    
    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting"""
        
        # Skip rate limiting for health checks and static files
        if request.url.path in ["/health", "/metrics"] or request.url.path.startswith("/static"):
            return await call_next(request)
        
        # Get client identifier
        client_id = self._get_client_identifier(request)
        
        # Get rate limit for endpoint
        endpoint = self._get_endpoint_key(request.url.path)
        calls, period = self._parse_rate_limit(self.rate_limits.get(endpoint, self.rate_limits["default"]))
        
        # Check rate limit
        if not await self._check_rate_limit(client_id, endpoint, calls, period):
            return Response(
                content="Rate limit exceeded",
                status_code=429,
                headers={
                    "X-RateLimit-Limit": str(calls),
                    "X-RateLimit-Period": str(period),
                    "Retry-After": str(period)
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = await self._get_remaining_requests(client_id, endpoint, calls, period)
        response.headers["X-RateLimit-Limit"] = str(calls)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Period"] = str(period)
        
        return response
    
    def _get_client_identifier(self, request: Request) -> str:
        """Get client identifier for rate limiting"""
        # Try to get user ID from headers (if authenticated)
        auth_header = request.headers.get("authorization")
        if auth_header:
            # In a real implementation, you'd decode the JWT to get user ID
            # For now, use the full auth header as identifier
            return f"user:{auth_header}"
        
        # Fall back to IP address
        client_ip = request.client.host
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        return f"ip:{client_ip}"
    
    def _get_endpoint_key(self, path: str) -> str:
        """Get endpoint key for rate limiting"""
        # Remove /api/v1 prefix and parameters
        path = path.replace("/api/v1/", "")
        
        # Match specific endpoints
        if path.startswith("auth/"):
            if "register" in path:
                return "auth/register"
            elif "refresh" in path:
                return "auth/refresh"
            return "auth/default"
        elif path.startswith("matching/"):
            if "find" in path:
                return "matching/find"
            return "matching/default"
        elif path.startswith("chat/"):
            return "chat/rooms"
        elif path.startswith("moderation/"):
            if "reports" in path:
                return "moderation/reports"
            return "moderation/default"
        
        return "default"
    
    def _parse_rate_limit(self, rate_limit_str: str) -> tuple:
        """Parse rate limit string like '5/minute' to (5, 60)"""
        calls_str, period_str = rate_limit_str.split("/")
        calls = int(calls_str)
        
        period_map = {
            "second": 1,
            "minute": 60,
            "hour": 3600,
            "day": 86400
        }
        
        period = period_map.get(period_str, 60)
        return calls, period
    
    async def _check_rate_limit(self, client_id: str, endpoint: str, calls: int, period: int) -> bool:
        """Check if request is within rate limit"""
        try:
            redis = await get_redis()
            key = f"rate_limit:{client_id}:{endpoint}"
            
            current = await redis.get(key)
            if current is None:
                # First request in this period
                await redis.setex(key, period, 1)
                return True
            else:
                current_count = int(current)
                if current_count >= calls:
                    return False
                else:
                    await redis.incr(key)
                    return True
                    
        except Exception as e:
            logger.error(f"Rate limit check failed: {str(e)}")
            # Allow request if Redis is down
            return True
    
    async def _get_remaining_requests(self, client_id: str, endpoint: str, calls: int, period: int) -> int:
        """Get remaining requests for client"""
        try:
            redis = await get_redis()
            key = f"rate_limit:{client_id}:{endpoint}"
            
            current = await redis.get(key)
            if current is None:
                return calls - 1  # First request was just made
            else:
                return max(0, calls - int(current))
                
        except Exception as e:
            logger.error(f"Failed to get remaining requests: {str(e)}")
            return 0

class WebSocketRateLimit:
    """Rate limiting for WebSocket connections"""
    
    def __init__(self):
        self.limits = {
            'send_message': (30, 60),      # 30 messages per minute
            'typing_start': (60, 60),      # 60 typing events per minute
            'join_room': (10, 60),         # 10 room joins per minute
        }
    
    async def check_limit(self, user_id: str, event_type: str) -> bool:
        """Check WebSocket event rate limit"""
        if event_type not in self.limits:
            return True
        
        calls, period = self.limits[event_type]
        
        try:
            redis = await get_redis()
            key = f"ws_rate_limit:{user_id}:{event_type}"
            
            current = await redis.get(key)
            if current is None:
                await redis.setex(key, period, 1)
                return True
            else:
                current_count = int(current)
                if current_count >= calls:
                    return False
                else:
                    await redis.incr(key)
                    return True
                    
        except Exception as e:
            logger.error(f"WebSocket rate limit check failed: {str(e)}")
            return True

# Create global instance
websocket_rate_limiter = WebSocketRateLimit()