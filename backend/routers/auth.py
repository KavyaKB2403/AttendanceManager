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
from models.models import User, PasswordReset, UserRole, Employee, Settings # Changed CompanySettings to Settings
from schemas.schemas import UserCreate, UserLogin, UserOut, EmailSchema, PasswordResetRequest, TokenData # Import TokenData
from utils.auth import hash_password, verify_password # Remove create_token, verify_token from here, will redefine
from typing import Optional, Tuple # Import Tuple
from jose import jwt, JWTError # Import jwt and JWTError
from fastapi.security import OAuth2PasswordBearer # Import OAuth2PasswordBearer
import os # Import os for environment variables

router = APIRouter(prefix="/auth", tags=["auth"])

# Redefine create_access_token here to include employee_id
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24)))) # Using os.getenv
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, os.getenv("SECRET_KEY", "super-secret-key"), algorithm=os.getenv("ALGORITHM", "HS256")) # Using os.getenv with default
    return encoded_jwt

# Redefine get_current_user and related dependencies
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/signin") # Define oauth2_scheme

# This dependency ensures only authenticated users can access the route.
def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY", "super-secret-key"), algorithms=[os.getenv("ALGORITHM", "HS256")]) # Using os.getenv with default
        user_id: str = payload.get("id")
        user_email: str = payload.get("sub")
        user_name: str = payload.get("name")
        is_admin: bool = payload.get("admin", False)
        employee_id: Optional[int] = payload.get("employee_id") # Extract employee_id

        if user_id is None or user_email is None:
            raise credentials_exception
        token_data = TokenData(id=user_id, email=user_email, name=user_name, is_admin=is_admin, employee_id=employee_id)
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.id == token_data.id).first()
    if user is None:
        raise credentials_exception
    return user

# This dependency requires admin role
def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.admin: # Check the `role` attribute on the User object
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized. Admin privileges required."
        )
    return current_user

# This dependency gets the effective user ID for data filtering (admin can act for others, staff for themselves)
def get_effective_user_id(
    current_user: User = Depends(get_current_user), # Use get_current_user to get the full user object
):
    # If the user is an admin, they can potentially view/manage data for any employee.
    # For now, we return the admin's own ID. Further logic might be needed if admins
    # can specify an employee_id to view.
    if current_user.role == UserRole.admin:
        return current_user
    
    # If the user is a staff member, they can only view/manage their own data.
    # The employee_id is stored in the JWT for staff users.
    if current_user.role == UserRole.staff:
        return current_user # Return the full user object for staff to access employee_id later

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized."
    )

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
    role = UserRole.admin if (payload.role or "admin") == "admin" else UserRole.staff
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

    logger.info(f"SignIn: User {user.email} (ID: {user.id}, Role: {user.role.value}) logged in.")

    # Determine which user's settings to fetch (admin's own or the admin who created a staff user)
    settings_user_id = user.created_by_admin_id if user.role == UserRole.staff and user.created_by_admin_id else user.id
    logger.info(f"SignIn: Calculated settings_user_id: {settings_user_id}")
    
    # Fetch company settings for company_logo_url
    company_settings = db.query(Settings).filter(Settings.user_id == settings_user_id).first()
    company_logo_url = company_settings.company_logo_url if company_settings else None
    logger.info(f"SignIn: Fetched company_settings: {company_settings.company_name if company_settings else 'None'} (URL: {company_logo_url})")

    # Fetch employee_id if the user is a staff member
    employee_id = None
    if user.role == UserRole.staff:
        employee = db.query(Employee).filter(Employee.user_id == user.id).first()
        if employee:
            employee_id = employee.id

    token = create_access_token(
        data={
            "sub": user.email,
            "id": user.id,
            "name": user.name,
            "admin": user.role == UserRole.admin,
            "employee_id": employee_id, # Include employee_id in the token
            "company_name": company_settings.company_name if company_settings else None, # Include company_name
            "company_logo_url": company_logo_url,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        },
        expires_delta=timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24)))) # Using os.getenv
    )
    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value,
            "employee_id": employee_id, # Include employee_id in the user object
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None, # Include last_login_at
        },
    }

# ----------------------------
# CURRENT USER (NEW)
# ----------------------------
@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user

# ----------------------------
# HELPERS
# ----------------------------
# The get_current_user, require_admin, and get_effective_user_id functions are now redefined above.

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
    reset_link = f"{os.getenv('CORS_ORIGINS')}/reset-password?token={token}" # Using os.getenv
    sender_email = os.getenv("EMAIL_USERNAME") # Using os.getenv
    receiver_email = user.email
    password = os.getenv("EMAIL_PASSWORD") # Using os.getenv
    smtp_server = os.getenv("EMAIL_SERVER") # Using os.getenv
    smtp_port = int(os.getenv("EMAIL_PORT", 587)) # Using os.getenv

    # Validate environment variables
    if not sender_email:
        logger.error("EMAIL_USERNAME is not set in environment variables.")
        raise HTTPException(status_code=500, detail="Email sender not configured.")
    if not password:
        logger.error("EMAIL_PASSWORD is not set in environment variables.")
        raise HTTPException(status_code=500, detail="Email password not configured.")
    if not smtp_server:
        logger.error("EMAIL_SERVER is not set in environment variables.")
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
