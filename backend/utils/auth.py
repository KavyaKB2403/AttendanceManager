from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from pwdlib import PasswordHash
import os
from passlib.context import CryptContext

from models.models import User, Settings, Employee # Import Employee
from schemas.schemas import TokenData
import os # Import os for environment variables
import logging

# Use Argon2 for password hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

logger = logging.getLogger(__name__)

# --- Password Functions ---
def hash_password(pw: str) -> str:
    """Hashes a password using the pwd_context."""
    return pwd_context.hash(pw)

def verify_password(pw: str, hashed: str) -> bool:
    """Verifies a password against a hash using the pwd_context."""
    return pwd_context.verify(pw, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24)))) # Using os.getenv
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, os.getenv("SECRET_KEY", "super-secret-key"), algorithm=os.getenv("ALGORITHM", "HS256")) # Using os.getenv
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY"), algorithm=os.getenv("ALGORITHM", "HS256")) # Using os.getenv
        return payload.get("sub")
    except JWTError:
        return None
