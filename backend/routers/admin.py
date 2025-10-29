from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db import get_db
from models.models import User, UserRole, Employee, Settings # Changed CompanySettings to Settings
from schemas.schemas import UserOut, StaffCreatedOut, UserCreate, EmployeeOut
from routers.auth import create_access_token, require_admin, hash_password, get_effective_user_id # require_admin for authz, hash_password for new users
from datetime import datetime, timedelta, timezone
import secrets
import logging
from typing import List, Optional
from sqlalchemy import or_

import os # Import os for environment variables
import string
import random

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_db), Depends(require_admin)] # All routes here require admin
)

# Implement "Add Staff" endpoint
@router.post("/staff", response_model=StaffCreatedOut) # Use StaffCreatedOut
async def create_staff(
    payload: UserCreate, # Payload now includes employee_id and email
    db: Session = Depends(get_db),
    current_admin_user: User = Depends(require_admin),
):
    # logger.info(f"Admin user {current_admin_user.email} attempting to create staff: {payload.email}")

    # Check if an employee with the provided employee_id exists
    employee = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Check if the employee is already linked to a user account
    if employee.user_id:
        raise HTTPException(status_code=400, detail="Employee is already associated with a user account")

    # Check if a user with the given email already exists
    existing_user = db.query(User).filter(User.email == payload.email).first()

    temp_password = None
    if existing_user:
        # Link existing user to the employee
        if existing_user.role != "staff":
            raise HTTPException(status_code=400, detail="Existing user is not a staff member. Cannot link.")
        user_to_link = existing_user
        # logger.info(f"Linking existing staff user {existing_user.email} to employee {employee.name}")
    else:
        # Create a new user with 'staff' role
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        password_hash = hash_password(temp_password)
        new_staff_user = User(
            name=payload.name,
            email=payload.email,
            password_hash=password_hash, # Reverted to password_hash
            role="staff",  # Explicitly set role to staff
            created_by_admin_id=current_admin_user.id, # Link staff to the creating admin
        )
        db.add(new_staff_user)
        db.flush() # Flush to get the new_staff_user.id
        user_to_link = new_staff_user
        # logger.info(f"Staff user {new_staff_user.email} created with ID: {new_staff_user.id}")

    # Link the user to the employee
    employee.user_id = user_to_link.id
    db.add(employee)
    db.commit()
    db.refresh(user_to_link)
    db.refresh(employee)

    # Fetch company settings for company_logo_url
    company_settings = db.query(Settings).filter(Settings.user_id == current_admin_user.id).first() # Filter by current admin's user_id
    company_logo_url = company_settings.company_logo_url if company_settings else None

    # Generate a new token that includes employee_id for staff
    access_token_expires = timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24))) # Using os.getenv
    access_token = create_access_token(
        data={
            "sub": user_to_link.email,
            "id": user_to_link.id,
            "name": user_to_link.name,
            "admin": user_to_link.role == "admin",
            "employee_id": employee.id if user_to_link.role == "staff" else None, # Include employee_id
            "company_logo_url": company_logo_url,
            "last_login_at": user_to_link.last_login_at.isoformat() if user_to_link.last_login_at else None,
        },
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "id": user_to_link.id,
        "name": user_to_link.name,
        "email": user_to_link.email,
        "role": user_to_link.role.value,
        "created_at": user_to_link.created_at,
        "temp_password": temp_password # Return temporary password only if a new user was created
    }

@router.get("/staff", response_model=list[UserOut])
async def list_staff(
    db: Session = Depends(get_db),
    current_admin_user: User = Depends(require_admin),
):
    # logger.info(f"Admin user {current_admin_user.email} attempting to list staff users.")
    # Filter staff by the current admin's ID or if they are linked to an employee
    staff_users = db.query(User).filter(
        User.role == UserRole.staff,
        User.created_by_admin_id == current_admin_user.id
    ).all()
    
    # Convert UserRole enum to string value for Pydantic validation
    for user in staff_users:
        user.role = user.role.value

    return staff_users

@router.get("/employees/available", response_model=list[EmployeeOut])
async def list_available_employees(
    db: Session = Depends(get_db),
    current_admin_user: User = Depends(require_admin), # Only admins can see available employees
):
    # logger.info(f"Admin user {current_admin_user.email} attempting to list available employees.")
    # logger.info(f"Filtering available employees for admin ID: {current_admin_user.id}")
    # Fetch employees that are not yet linked to any user account and belong to the current admin
    available_employees = db.query(Employee).filter(
        Employee.user_id == None,  # Not yet linked to a staff user
        Employee.last_updated_by == current_admin_user.id  # Created/managed by this admin
    ).all()
    # logger.info(f"Found {len(available_employees)} available employees after filtering.")
    return available_employees

@router.post("/staff/{user_id}/reset-password", response_model=dict)
async def reset_staff_password(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin_user: User = Depends(require_admin) # Ensures only Admin can access
):
    # logger.info(f"Admin user {current_admin_user.email} attempting to reset password for user ID: {user_id}")

    user_to_reset = db.get(User, user_id)
    if not user_to_reset:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if user_to_reset.role == UserRole.admin:
        raise HTTPException(status_code=403, detail="Cannot reset password for another Admin user via this endpoint.")

    # Generate a new strong, temporary password
    new_temp_password_plain = secrets.token_urlsafe(16)
    password_hash = hash_password(new_temp_password_plain)

    user_to_reset.password_hash = password_hash # Reverted to password_hash
    db.commit()
    db.refresh(user_to_reset)

    # logger.info(f"Password reset for staff user ID: {user_id}. New temporary password generated.")

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
    # logger.info(f"Admin user {current_admin_user.email} attempting to delete user ID: {user_id}")

    user_to_delete = db.get(User, user_id)
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found.")
    
    # Ensure the user to delete is a staff member associated with an employee under the current admin's management
    employee_associated = db.query(Employee).filter(
        Employee.user_id == user_to_delete.id,
        Employee.user_id == current_admin_user.id # Ensure this employee belongs to the admin's set of managed employees
    ).first()
    if not employee_associated and user_to_delete.created_by_admin_id != current_admin_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this staff user.")

    if user_to_delete.role == UserRole.admin:
        raise HTTPException(status_code=403, detail="Cannot delete an Admin user.")
    
    if user_to_delete.id == current_admin_user.id:
        raise HTTPException(status_code=403, detail="Cannot delete your own Admin account.")

    db.delete(user_to_delete)
    db.commit()

    # logger.info(f"Staff user ID: {user_id} deleted successfully.")
    return # FastAPI automatically handles 204 No Content for empty return
