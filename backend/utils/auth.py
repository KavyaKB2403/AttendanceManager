from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from pwdlib import PasswordHash # Keep this import
import os
# REMOVE: from passlib.context import CryptContext # This is no longer needed

from models.models import User, Settings, Employee
from schemas.schemas import TokenData
import os 
import logging

# Initialize pwdlib's PasswordHash with Argon2 as the default scheme.
# This replaces the passlib.context.CryptContext line.
pwd_context = PasswordHash.recommended()

logger = logging.getLogger(__name__)

# --- Password Functions ---
def hash_password(pw: str) -> str:
    """Hashes a password using the recommended Argon2 context from pwdlib."""
    # pwdlib handles the salt and rounds automatically
    return pwd_context.hash(pw)

def verify_password(pw: str, hashed: str) -> bool:
    """Verifies a password against a hash using the pwd_context."""
    # pwdlib's verify method returns True or False
    return pwd_context.verify(pw, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # NOTE: Using single quotes inside os.getenv to avoid f-string syntax error
        expire = datetime.utcnow() + timedelta(minutes=int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', str(60 * 24)))) 
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, os.getenv('SECRET_KEY', 'super-secret-key'), algorithm=os.getenv('ALGORITHM', 'HS256')) 
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, os.getenv('SECRET_KEY'), algorithm=os.getenv('ALGORITHM', 'HS256'))
        return payload.get("sub")
    except JWTError:
        return None
