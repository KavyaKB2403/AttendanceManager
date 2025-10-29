import logging
import os
from datetime import date, timedelta, datetime
from typing import List, Optional

import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Query
from sqlalchemy.orm import Session

# Make sure all necessary imports are present
from db import get_db
from models.models import Holiday, Settings, User, Employee, AttendanceRecord, AttendanceStatus # Changed CompanySettings to Settings, added Employee, AttendanceRecord, AttendanceStatus
from routers.auth import get_effective_user_id, require_admin
from schemas.schemas import HolidayOut, SettingsOut, HolidayCreate

# --- Cloudinary Configuration ---
# Uses the environment variables from your Render dashboard
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)
# print(cloudinary.config().cloud_name)
# print(cloudinary.config().api_key)
# print(cloudinary.config().api_secret)

router = APIRouter(prefix="/settings", tags=["settings"])
logger = logging.getLogger(__name__)

# --- Helper Function (Unchanged) ---
def generate_sunday_holidays(db: Session, effective_user_id: User):
    today = date.today()
    start_date = date(today.year, 1, 1)
    end_date = date(today.year + 1, 12, 31)
    current_date = start_date
    while current_date <= end_date:
        if current_date.weekday() == 6:
            existing = db.query(Holiday).filter(Holiday.user_id == effective_user_id.id, Holiday.date == current_date).first()
            if not existing:
                db.add(Holiday(date=current_date, name="Sunday Holiday", user_id=effective_user_id.id))
        current_date += timedelta(days=1)
    db.commit()

# --- Holiday Endpoints (Unchanged) ---
@router.post("/holidays", response_model=HolidayOut)
def add_holiday(
    name: str = Form(...),
    date_str: str = Form(..., alias="date"), # <--- Accept date as string (date_str)
    override_past_attendance_str: Optional[str] = Form(False, alias="override_past_attendance"),
    db: Session = Depends(get_db),
    effective_user_id: User = Depends(get_effective_user_id)
):
    # 1. Manually coerce the date string to a Python date object
    try:
        holiday_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")
    
    override_past_attendance = (
        override_past_attendance_str is not None and 
        override_past_attendance_str.lower() == "true"
    )
    
    today = date.today()
    is_past_holiday = holiday_date < today

    # 2. Create Holiday Record (using the coerced holiday_date)
    hol = Holiday(date=holiday_date, name=name, user_id=effective_user_id.id)
    db.add(hol)
    
    # 3. Fetch eligible employees
    eligible_employees = db.query(Employee).filter(
        Employee.status == "active",
        Employee.last_updated_by == effective_user_id.id,
        Employee.date_of_joining <= holiday_date # Use the coerced date
    ).all()

    # 4. Prepare Attendance Records (Simplified for clarity, using the atomic logic)
    attendance_records_to_process = []
    
    for emp in eligible_employees:
        existing_attendance = db.query(AttendanceRecord).filter(
            AttendanceRecord.employee_id == emp.id,
            AttendanceRecord.date == holiday_date
        ).first()

        create_record = False
        update_record = False

        if is_past_holiday:
            # Check the boolean value of override_past_attendance
            if override_past_attendance:
                update_record = existing_attendance is not None
                create_record = existing_attendance is None
            elif not existing_attendance:
                create_record = True
        else: # Future holiday
            if not existing_attendance:
                create_record = True
        
        if create_record:
            # Create a new attendance record
            attendance_records_to_process.append(AttendanceRecord(
                date=holiday_date,
                status=AttendanceStatus.Present,
                manual_overtime_hours=0.0,
                late_hours=0.0,
                employee_id=emp.id,
                user_id=effective_user_id.id
            ))
        elif update_record and existing_attendance:
            # Update existing record (tracked by the session)
            existing_attendance.status = AttendanceStatus.Present
            existing_attendance.manual_overtime_hours = 0.0
            existing_attendance.late_hours = 0.0

    # 5. Atomic Commit
    if attendance_records_to_process:
        db.add_all(attendance_records_to_process)
    
    try:
        db.commit() 
        db.refresh(hol)
        return hol
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to add holiday and/or attendance records: {e}", exc_info=True)
        # The 422 error is gone, now this will handle any remaining DB errors
        raise HTTPException(status_code=500, detail="An internal error occurred while processing the holiday and attendance records.")

@router.get("/holidays", response_model=List[HolidayOut])
def list_holidays(db: Session = Depends(get_db), effective_user_id: User = Depends(get_effective_user_id)):
    # Determine the user ID to use for fetching holidays
    # If effective_user_id is staff, use the ID of the admin who created them
    # Otherwise, use effective_user_id.id (for admins)
    user_id_for_holidays = effective_user_id.created_by_admin_id if effective_user_id.role == "staff" else effective_user_id.id
    
    if not user_id_for_holidays:
        # This case should ideally not happen if staff users are always linked to an admin
        # but good for safety.
        raise HTTPException(status_code=400, detail="Could not determine user for fetching holidays.")

    return db.query(Holiday).filter(Holiday.user_id == user_id_for_holidays).order_by(Holiday.date.asc()).all()

@router.delete("/holidays/{holiday_id}")
def delete_holiday(
    holiday_id: int,
    revert_attendance: Optional[bool] = Query(False), # New parameter for reverting attendance
    db: Session = Depends(get_db),
    effective_user_id: User = Depends(get_effective_user_id)
):
    hol = db.get(Holiday, holiday_id)
    if not hol or hol.user_id != effective_user_id.id:
        raise HTTPException(status_code=404, detail="Holiday not found")

    if revert_attendance:
        # Find and delete attendance records that were automatically generated for this holiday
        db.query(AttendanceRecord).filter(
            AttendanceRecord.employee_id.in_(
                db.query(Employee.id).filter(
                    Employee.last_updated_by == effective_user_id.id,
                    Employee.date_of_joining <= hol.date
                )
            ),
            AttendanceRecord.date == hol.date,
            AttendanceRecord.status == AttendanceStatus.Present,
            AttendanceRecord.manual_overtime_hours == 0.0,
            AttendanceRecord.late_hours == 0.0,
        ).delete(synchronize_session=False)

    db.delete(hol); db.commit(); return {"ok": True}

# --- Company Settings Endpoints (Corrected and Final) ---

@router.get("/company", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db), effective_user_id: User = Depends(get_effective_user_id)):
    """
    Fetches the company settings. The URL from the database is now the
    full, permanent Cloudinary URL, so we can return it directly.
    """
    settings = db.query(Settings).filter(Settings.user_id == effective_user_id.id).first()
    if not settings:
        settings = Settings(user_id=effective_user_id.id)
        db.add(settings); db.commit(); db.refresh(settings)
    
    # We can return the ORM object directly, FastAPI handles the conversion to SettingsOut
    return settings

# This is the single endpoint that now handles both text and logo updates.
# Your separate /company/logo endpoint is no longer needed.
@router.post("/company", response_model=SettingsOut)
def set_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    effective_user_id: User = Depends(get_effective_user_id),
    company_name: str = Form(...),
    standard_work_hours_per_day: float = Form(...),
    currency: str = Form(...),
    overtime_multiplier: float = Form(...),
    mark_sundays_as_holiday: bool = Form(...),
    company_logo: Optional[UploadFile] = File(None)
):
    logger.info(f"Effective user ID {effective_user_id.id} received set_settings payload.")
    try:
        s = db.query(Settings).filter(Settings.user_id == effective_user_id.id).first()
        if not s:
            s = Settings(user_id=effective_user_id.id)
            db.add(s)

        # Update text fields
        s.company_name = company_name
        s.standard_work_hours_per_day = standard_work_hours_per_day
        s.currency = currency
        s.overtime_multiplier = overtime_multiplier
        
        if mark_sundays_as_holiday and not s.mark_sundays_as_holiday:
            generate_sunday_holidays(db, effective_user_id)
        s.mark_sundays_as_holiday = mark_sundays_as_holiday

        # If a new logo is provided, upload it to Cloudinary
        if company_logo:
            upload_result = cloudinary.uploader.upload(
                company_logo.file,
                folder="attendance_manager_logos",
                public_id=f"company_logo_{effective_user_id.id}"
            )
            s.company_logo_url = upload_result.get("secure_url")

        db.commit()
        db.refresh(s)

        # This manually creates the SettingsOut object, just like your original code.
        # This directly addresses your concern.
        return SettingsOut(
            user_id=s.user_id,
            standard_work_hours_per_day=s.standard_work_hours_per_day,
            currency=s.currency,
            company_name=s.company_name,
            overtime_multiplier=s.overtime_multiplier,
            mark_sundays_as_holiday=s.mark_sundays_as_holiday,
            company_logo_url=s.company_logo_url
        )

    except Exception as e:
        db.rollback()
        logger.error(f"Error in set_settings for user {effective_user_id.id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save settings.")
