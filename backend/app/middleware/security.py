from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging
import time

logger = logging.getLogger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    """Security headers middleware"""
    
    async def dispatch(self, request: Request, call_next):
        """Add security headers to response"""
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "connect-src 'self' ws: wss:; "
            "img-src 'self' data: blob:; "
            "media-src 'self' blob:"
        )
        
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions Policy (formerly Feature Policy)
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), "
            "payment=(), usb=(), magnetometer=(), gyroscope=()"
        )
        
        # Remove server information
        if "server" in response.headers:
            del response.headers["server"]
        
        return response

class CORSSecurityMiddleware(BaseHTTPMiddleware):
    """Enhanced CORS middleware with security considerations"""
    
    def __init__(self, app, allowed_origins: list = None, allow_credentials: bool = True):
        super().__init__(app)
        self.allowed_origins = allowed_origins or ["http://localhost:3000", "https://yourdomain.com"]
        self.allow_credentials = allow_credentials
    
    async def dispatch(self, request: Request, call_next):
        """Handle CORS with security checks"""
        
        origin = request.headers.get("origin")
        
        # Handle preflight requests
        if request.method == "OPTIONS":
            response = Response()
            
            if origin and self._is_origin_allowed(origin):
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
                
                if self.allow_credentials:
                    response.headers["Access-Control-Allow-Credentials"] = "true"
                    
                response.headers["Access-Control-Max-Age"] = "86400"  # 24 hours
                
            return response
        
        # Process actual request
        response = await call_next(request)
        
        # Add CORS headers to response
        if origin and self._is_origin_allowed(origin):
            response.headers["Access-Control-Allow-Origin"] = origin
            
            if self.allow_credentials:
                response.headers["Access-Control-Allow-Credentials"] = "true"
                
            # Expose headers that the frontend can access
            response.headers["Access-Control-Expose-Headers"] = (
                "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Period"
            )
        
        return response
    
    def _is_origin_allowed(self, origin: str) -> bool:
        """Check if origin is in allowed list"""
        return origin in self.allowed_origins

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Request logging middleware for security monitoring"""
    
    async def dispatch(self, request: Request, call_next):
        """Log requests for security monitoring"""
        start_time = time.time()
        
        # Log request
        logger.info(f"Request: {request.method} {request.url.path} from {request.client.host}")
        
        # Check for suspicious patterns
        self._check_suspicious_request(request)
        
        response = await call_next(request)
        
        # Log response
        duration = time.time() - start_time
        logger.info(f"Response: {response.status_code} in {duration:.3f}s")
        
        return response
    
    def _check_suspicious_request(self, request: Request):
        """Check for suspicious request patterns"""
        suspicious_patterns = [
            "script", "javascript:", "onload", "onerror", "eval(",
            "../", "..\\", "/etc/passwd", "cmd.exe", "powershell"
        ]
        
        # Check URL path
        path_lower = request.url.path.lower()
        for pattern in suspicious_patterns:
            if pattern in path_lower:
                logger.warning(f"Suspicious pattern '{pattern}' in URL: {request.url.path}")
                break
        
        # Check query parameters
        for param, value in request.query_params.items():
            value_lower = str(value).lower()
            for pattern in suspicious_patterns:
                if pattern in value_lower:
                    logger.warning(f"Suspicious pattern '{pattern}' in query param {param}: {value}")
                    break
        
        # Check headers for injection attempts
        for header_name, header_value in request.headers.items():
            header_lower = str(header_value).lower()
            for pattern in suspicious_patterns:
                if pattern in header_lower:
                    logger.warning(f"Suspicious pattern '{pattern}' in header {header_name}: {header_value}")
                    break

