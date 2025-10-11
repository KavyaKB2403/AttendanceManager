import logging
import os
from datetime import date, timedelta
from typing import List, Optional

import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

# Make sure all necessary imports are present
from db import get_db
from models.models import Holiday, Settings, User
from routers.auth import get_effective_user_id, require_admin
from schemas.schemas import HolidayCreate, HolidayOut, SettingsOut

# --- Cloudinary Configuration ---
# Uses the environment variables from your Render dashboard
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)
print(cloudinary.config().cloud_name)
print(cloudinary.config().api_key)
print(cloudinary.config().api_secret)

router = APIRouter(prefix="/settings", tags=["settings"])
logger = logging.getLogger(__name__)

# --- Helper Function (Unchanged) ---
def generate_sunday_holidays(db: Session, effective_user_id: int):
    today = date.today()
    start_date = date(today.year, 1, 1)
    end_date = date(today.year + 1, 12, 31)
    current_date = start_date
    while current_date <= end_date:
        if current_date.weekday() == 6:
            existing = db.query(Holiday).filter(Holiday.user_id == effective_user_id, Holiday.date == current_date).first()
            if not existing:
                db.add(Holiday(date=current_date, name="Sunday Holiday", user_id=effective_user_id))
        current_date += timedelta(days=1)
    db.commit()

# --- Holiday Endpoints (Unchanged) ---
@router.post("/holidays", response_model=HolidayOut)
def add_holiday(payload: HolidayCreate, db: Session = Depends(get_db), effective_user_id: int = Depends(get_effective_user_id)):
    hol = Holiday(date=payload.date, name=payload.name, user_id=effective_user_id)
    db.add(hol); db.commit(); db.refresh(hol); return hol

@router.get("/holidays", response_model=List[HolidayOut])
def list_holidays(db: Session = Depends(get_db), effective_user_id: int = Depends(get_effective_user_id)):
    return db.query(Holiday).filter(Holiday.user_id == effective_user_id).order_by(Holiday.date.asc()).all()

@router.delete("/holidays/{holiday_id}")
def delete_holiday(holiday_id: int, db: Session = Depends(get_db), effective_user_id: int = Depends(get_effective_user_id)):
    hol = db.get(Holiday, holiday_id)
    if not hol or hol.user_id != effective_user_id:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db.delete(hol); db.commit(); return {"ok": True}

# --- Company Settings Endpoints (Corrected and Final) ---

@router.get("/company", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db), effective_user_id: int = Depends(get_effective_user_id)):
    """
    Fetches the company settings. The URL from the database is now the
    full, permanent Cloudinary URL, so we can return it directly.
    """
    settings = db.query(Settings).filter(Settings.user_id == effective_user_id).first()
    if not settings:
        settings = Settings(user_id=effective_user_id)
        db.add(settings); db.commit(); db.refresh(settings)
    
    # We can return the ORM object directly, FastAPI handles the conversion to SettingsOut
    return settings

# This is the single endpoint that now handles both text and logo updates.
# Your separate /company/logo endpoint is no longer needed.
@router.post("/company", response_model=SettingsOut)
def set_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    effective_user_id: int = Depends(get_effective_user_id),
    company_name: str = Form(...),
    standard_work_hours_per_day: float = Form(...),
    currency: str = Form(...),
    overtime_multiplier: float = Form(...),
    mark_sundays_as_holiday: bool = Form(...),
    company_logo: Optional[UploadFile] = File(None)
):
    logger.info(f"Effective user ID {effective_user_id} received set_settings payload.")
    try:
        s = db.query(Settings).filter(Settings.user_id == effective_user_id).first()
        if not s:
            s = Settings(user_id=effective_user_id)
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
                public_id=f"company_logo_{effective_user_id}"
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
        logger.error(f"Error in set_settings for user {effective_user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save settings.")
