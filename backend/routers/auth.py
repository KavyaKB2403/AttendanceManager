from fastapi import APIRouter, Depends, HTTPException, Header, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta, timezone # Import timezone
import secrets
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging # Correct logging import

# Get logger instance for this module
logger = logging.getLogger(__name__)

from dotenv import load_dotenv

load_dotenv() # Ensure .env is loaded in this router as well for debugging

from db import get_db
from models.models import User, PasswordReset, UserRole
from schemas.schemas import UserCreate, UserLogin, UserOut, EmailSchema, PasswordResetRequest
from utils.auth import hash_password, verify_password, create_token, verify_token
from typing import Optional, Tuple # Import Tuple

router = APIRouter(prefix="/auth", tags=["auth"])

# ----------------------------
# SIGN UP
# ----------------------------
@router.options("/signup")
def signup_options():
    return Response(status_code=status.HTTP_204_NO_CONTENT)
@router.post("/signup", response_model=UserOut)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    logger.info(f"Attempting to sign up with email: {payload.email}") # Add logging for debugging
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    role = UserRole.Admin if (payload.role or "admin") == "admin" else UserRole.Staff
    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# ----------------------------
# SIGN IN
# ----------------------------
@router.post("/signin")
def signin(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user.last_login_at = datetime.now(timezone.utc) # Update last_login_at
    db.commit()
    db.refresh(user)

    token = create_token(sub=str(user.id), role=user.role.value, last_login_at=user.last_login_at) # Pass the user's role and last_login_at
    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None, # Include last_login_at
        },
    }

# ----------------------------
# CURRENT USER (NEW)
# ----------------------------
@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(lambda: get_current_user())):
    return current_user

# ----------------------------
# HELPERS
# ----------------------------
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Tuple[User, int]: # Modified return type
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    user_id_from_token = verify_token(authorization.split(" ")[1])
    if not user_id_from_token:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.get(User, int(user_id_from_token))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Determine the effective_user_id based on role
    if user.role == UserRole.Admin:
        effective_user_id = user.id
    elif user.role == UserRole.Staff:
        # Staff should see data associated with the admin who created them
        if not user.created_by_admin_id:
            # This case should ideally not happen if staff creation is enforced correctly
            logger.error(f"Staff user {user.email} has no created_by_admin_id. Defaulting to own ID.")
            effective_user_id = user.id # Fallback, but indicates an issue
        else:
            effective_user_id = user.created_by_admin_id
    else:
        # Default case, e.g., if new roles are added
        effective_user_id = user.id
    
    return user, effective_user_id

def require_admin(user_tuple: Tuple[User, int] = Depends(get_current_user)) -> User:
    user, _ = user_tuple # Unpack the user object, ignore effective_user_id for admin check
    logger.info(f"Checking authorization for user {user.email}, role: {user.role.value}")
    if user.role != UserRole.Admin:
        raise HTTPException(status_code=403, detail="Admin role required")
    return user

def get_effective_user_id(user_tuple: Tuple[User, int] = Depends(get_current_user)) -> int:
    _, effective_user_id = user_tuple
    return effective_user_id

# ----------------------------
# PASSWORD RESET
# ----------------------------
@router.post("/forgot-password")
def forgot_password(email_data: EmailSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email_data.email).first()
    if not user:
        # don't reveal user existence
        return {"ok": True}
    token = secrets.token_urlsafe(32)
    pr = PasswordReset(
        user_id=user.id,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1), # Make expires_at UTC-aware
    )
    db.add(pr)
    db.commit()

    # Send email with token link
    reset_link = f"{os.getenv('BASE_URL')}/reset-password?token={token}"
    sender_email = os.getenv("EMAIL_USERNAME")
    receiver_email = user.email
    password = os.getenv("EMAIL_PASSWORD")
    smtp_server = os.getenv("EMAIL_SERVER")
    smtp_port = int(os.getenv("EMAIL_PORT", 587))

    # Validate environment variables
    if not sender_email:
        logger.error("EMAIL_USERNAME is not set in .env or environment variables.")
        raise HTTPException(status_code=500, detail="Email sender not configured.")
    if not password:
        logger.error("EMAIL_PASSWORD is not set in .env or environment variables.")
        raise HTTPException(status_code=500, detail="Email password not configured.")
    if not smtp_server:
        logger.error("EMAIL_SERVER is not set in .env or environment variables.")
        raise HTTPException(status_code=500, detail="SMTP server not configured.")

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = receiver_email
    msg["Subject"] = "Password Reset Request"
    body = f"Hi {user.email},<br><br>You have requested a password reset. Please use the following link to reset your password: <a href=\"{reset_link}\">{reset_link}</a><br><br>This link will expire in 1 hour.<br><br>If you did not request this, please ignore this email.<br><br>Best regards,<br>The Attendance Manager Team"
    msg.attach(MIMEText(body, "html"))

    try:
        logger.info(f"Attempting to connect to SMTP server: {smtp_server}:{smtp_port}")
        logger.info(f"Using sender email: {sender_email}")
        # WARNING: Do NOT log passwords in production!
        logger.info(f"Using email password (first 3 chars): {password[:3]}...")
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.connect(smtp_server, smtp_port)
            server.ehlo()
            server.starttls()
            server.login(sender_email, password)
            server.send_message(msg) # Re-inserted the send message call
            logger.info(f"Password reset email sent to {user.email}") # Changed print to logger.info
            return {"ok": True, "message": "Password reset link sent to your email."}
    except Exception as e:
        logger.error(f"Failed to send email to {user.email}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to send password reset email.")

@router.post("/reset-password")
def reset_password(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    pr = (
        db.query(PasswordReset)
        .filter(and_(PasswordReset.token == payload.token, PasswordReset.used == False))
        .first()
    )
    logger.info(f"Reset password attempt for token: {payload.token}")
    if pr:
        logger.info(f"PasswordReset record found: id={pr.id}, expires_at={pr.expires_at}, used={pr.used}")
        logger.info(f"Current UTC time: {datetime.now(timezone.utc)}")

    if not pr or pr.expires_at < datetime.now(timezone.utc):
        logger.warning(f"Invalid or expired token for payload.token={payload.token}. PR found: {pr is not None}. Expired: {pr and pr.expires_at < datetime.now(timezone.utc)}")
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    user = db.get(User, pr.user_id)
    if not user:
        logger.warning(f"User not found for pr.user_id={pr.user_id}")
        raise HTTPException(status_code=400, detail="User not found")
    user.password_hash = hash_password(payload.new_password)
    pr.used = True
    db.commit()
    logger.info(f"Password successfully reset for user ID: {user.id}")
    return {"ok": True}
