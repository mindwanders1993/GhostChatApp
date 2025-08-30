from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import secrets
import hashlib
from typing import Optional, Dict, Any
from app.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def generate_anonymous_id() -> str:
    """Generate a unique anonymous ID"""
    random_bytes = secrets.token_bytes(16)
    return f"anon_{hashlib.md5(random_bytes).hexdigest()[:27]}"

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expiration_minutes)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None

def generate_session_token() -> str:
    """Generate a secure session token"""
    return secrets.token_urlsafe(32)

def hash_content(content: str) -> str:
    """Generate hash of content for caching moderation results"""
    return hashlib.sha256(content.encode()).hexdigest()

class SecurityUtils:
    @staticmethod
    def sanitize_input(text: str) -> str:
        """Sanitize user input to prevent XSS"""
        import re
        
        # Remove HTML tags
        text = re.sub(r'<[^>]*>', '', text)
        
        # Remove javascript: protocols
        text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
        
        # Remove event handlers
        text = re.sub(r'on\w+\s*=', '', text, flags=re.IGNORECASE)
        
        return text.strip()
    
    @staticmethod
    def validate_nickname(nickname: str) -> bool:
        """Validate nickname format"""
        import re
        return bool(re.match(r'^[a-zA-Z0-9_-]+$', nickname)) and len(nickname) >= 2
    
    @staticmethod
    def is_safe_url(url: str) -> bool:
        """Check if URL is safe (basic validation)"""
        import re
        
        # Allow only http/https URLs
        if not re.match(r'^https?://', url):
            return False
            
        # Block potentially dangerous domains (basic list)
        dangerous_patterns = [
            r'\.exe\b', r'\.scr\b', r'\.bat\b', r'\.com\b',
            r'malware', r'phishing', r'spam'
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, url, re.IGNORECASE):
                return False
                
        return True