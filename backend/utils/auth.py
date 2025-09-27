from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.hash import bcrypt
import os

JWT_SECRET = os.getenv("JWT_SECRET", "change_me_super_secret")
JWT_ALG = os.getenv("JWT_ALG", "HS256")

def hash_password(pw: str) -> str:
    return bcrypt.hash(pw)

def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.verify(pw, hashed)

def create_token(sub: str, role: Optional[str] = None, last_login_at: Optional[datetime] = None, expires_minutes: int = 60*24) -> str:
    payload = {"sub": sub, "exp": datetime.utcnow() + timedelta(minutes=expires_minutes)}
    if role:
        payload["admin"] = (role == "admin") # Assuming 'admin' role corresponds to 'admin: true' in token
    if last_login_at:
        payload["last_login_at"] = last_login_at.isoformat()
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def verify_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return payload.get("sub")
    except JWTError:
        return None
