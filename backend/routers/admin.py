from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.db import get_db
from backend.models.models import User, UserRole
from backend.schemas.schemas import UserOut, StaffCreate, StaffCreatedOut # Import StaffCreatedOut
from backend.routers.auth import require_admin, hash_password # require_admin for authz, hash_password for new users
from datetime import datetime, timedelta, timezone
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_db), Depends(require_admin)] # All routes here require admin
)

# Implement "Add Staff" endpoint
@router.post("/staff", response_model=StaffCreatedOut) # Use StaffCreatedOut
async def create_staff(
    payload: StaffCreate,
    db: Session = Depends(get_db),
    current_admin_user: User = Depends(require_admin) # Ensures only Admin can access
):
    logger.info(f"Admin user {current_admin_user.email} attempting to create staff: {payload.email}")

    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    # Generate a strong, temporary password
    temp_password_plain = secrets.token_urlsafe(16) # 16 random bytes for a strong password
    hashed_password = hash_password(temp_password_plain)

    new_staff_user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hashed_password,
        role=UserRole.Staff, # Enforce Staff role
        created_by_admin_id=current_admin_user.id, # Link staff to the creating admin
    )

    db.add(new_staff_user)
    db.commit()
    db.refresh(new_staff_user)

    logger.info(f"Staff user {new_staff_user.email} created with ID: {new_staff_user.id}")

    # Return the new user and the plaintext temporary password (ONLY ONCE for Admin)
    # The frontend will need to display this to the Admin.
    # Using a dictionary to include temp_password since UserOut doesn't have it.
    return {
        "id": new_staff_user.id,
        "name": new_staff_user.name,
        "email": new_staff_user.email,
        "role": new_staff_user.role.value,
        "created_at": new_staff_user.created_at,
        "temp_password": temp_password_plain
    }

# Placeholder for future "List Staff" endpoint
@router.get("/staff", response_model=list[UserOut])
async def list_staff(
    db: Session = Depends(get_db),
    current_admin_user: User = Depends(require_admin) # Ensures only Admin can access
):
    logger.info(f"Admin user {current_admin_user.email} attempting to list staff users.")
    staff_users = db.query(User).filter(
        User.role == UserRole.Staff,
        User.created_by_admin_id == current_admin_user.id # Filter staff by the current admin's ID
    ).all()
    return staff_users

# Placeholder for future "Reset Staff Password" endpoint
@router.post("/staff/{user_id}/reset-password", response_model=dict)
async def reset_staff_password(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin_user: User = Depends(require_admin) # Ensures only Admin can access
):
    logger.info(f"Admin user {current_admin_user.email} attempting to reset password for user ID: {user_id}")

    user_to_reset = db.get(User, user_id)
    if not user_to_reset:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if user_to_reset.role == UserRole.Admin:
        raise HTTPException(status_code=403, detail="Cannot reset password for another Admin user via this endpoint.")

    # Generate a new strong, temporary password
    new_temp_password_plain = secrets.token_urlsafe(16)
    hashed_password = hash_password(new_temp_password_plain)

    user_to_reset.password_hash = hashed_password
    db.commit()
    db.refresh(user_to_reset)

    logger.info(f"Password reset for staff user ID: {user_id}. New temporary password generated.")

    # Return the new plaintext temporary password (ONLY ONCE for Admin)
    return {
        "ok": True,
        "message": f"Password for {user_to_reset.email} reset successfully.",
        "new_temporary_password": new_temp_password_plain
    }

@router.delete("/staff/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_staff(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin_user: User = Depends(require_admin)
):
    logger.info(f"Admin user {current_admin_user.email} attempting to delete user ID: {user_id}")

    user_to_delete = db.get(User, user_id)
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found.")

    if user_to_delete.role == UserRole.Admin:
        raise HTTPException(status_code=403, detail="Cannot delete an Admin user.")
    
    if user_to_delete.id == current_admin_user.id:
        raise HTTPException(status_code=403, detail="Cannot delete your own Admin account.")

    db.delete(user_to_delete)
    db.commit()

    logger.info(f"Staff user ID: {user_id} deleted successfully.")
    return # FastAPI automatically handles 204 No Content for empty return
