from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from backend.db import get_db
from backend.models.models import Holiday, Settings
from backend.schemas.schemas import HolidayCreate, HolidayOut, SettingsIn, SettingsOut
from backend.routers.auth import get_current_user, require_admin, get_effective_user_id # Import get_effective_user_id
from typing import List, Optional
from datetime import date, timedelta
import logging # Import logging
import os # Import os for file operations
import shutil # Import shutil for file operations
from pathlib import Path # Import Path
from backend.models.models import User # Import User
from starlette.requests import Request # Import Request

router = APIRouter(prefix="/settings", tags=["settings"])

logger = logging.getLogger(__name__) # Initialize logger

BASE_DIR = Path(__file__).resolve().parent.parent # Get the backend directory
UPLOAD_DIR = BASE_DIR / "static" / "uploads"

def generate_sunday_holidays(db: Session, effective_user_id: int):
    today = date.today()
    start_date = date(today.year, 1, 1) # Start from beginning of current year
    end_date = date(today.year + 1, 12, 31) # End of next year

    current_date = start_date
    while current_date <= end_date:
        if current_date.weekday() == 6: # Sunday is 6
            existing_holiday = db.query(Holiday).filter(
                Holiday.user_id == effective_user_id,
                Holiday.date == current_date
            ).first()
            if not existing_holiday:
                sunday_holiday = Holiday(date=current_date, name="Sunday Holiday", user_id=effective_user_id)
                db.add(sunday_holiday)
        current_date += timedelta(days=1)
    db.commit() # Commit all generated holidays at once

@router.on_event("startup")
def on_startup():
    os.makedirs(UPLOAD_DIR, exist_ok=True)

async def save_upload_file(upload_file: UploadFile, user_id: int) -> str:
    # Create a unique filename based on user_id and original filename
    file_extension = os.path.splitext(upload_file.filename)[1]
    unique_filename = f"company_logo_{user_id}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename # Use Path object for joining

    # Save the file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)

    return f"/static/uploads/{unique_filename}" # Return relative URL for storage, will be fully qualified on retrieval


@router.post("/company/logo", response_model=SettingsOut)
async def upload_company_logo(
    request: Request, # Move request to the beginning
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin_user: User = Depends(require_admin),
    effective_user_id: int = Depends(get_effective_user_id)
):
    logger.info(f"Admin user {current_admin_user.id} ({current_admin_user.email}) attempting to upload company logo for effective user ID {effective_user_id}")
    try:
        # Save the uploaded file
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"company_logo_{effective_user_id}{file_extension}"
        logo_url_relative = await save_upload_file(file, effective_user_id)

        # Update the settings with the new logo URL
        settings = db.query(Settings).filter(Settings.user_id == effective_user_id).first()
        if not settings:
            settings = Settings(user_id=effective_user_id)
            db.add(settings)

        settings.company_logo_url = logo_url_relative # Store the relative URL
        db.commit()
        db.refresh(settings)

        # Construct the full URL for the response
        full_logo_url = str(request.url_for("static", path=f"/uploads/{unique_filename}")) if settings.company_logo_url else None

        logger.info(f"Company logo uploaded and settings updated for effective user ID {effective_user_id}. Logo URL: {full_logo_url}")
        return SettingsOut(user_id=settings.user_id, standard_work_hours_per_day=settings.standard_work_hours_per_day, currency=settings.currency, company_name=settings.company_name, overtime_multiplier=settings.overtime_multiplier, mark_sundays_as_holiday=settings.mark_sundays_as_holiday, company_logo_url=full_logo_url)

    except Exception as e:
        db.rollback()
        logger.error(f"Error uploading company logo for effective user ID {effective_user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to upload logo: {e}")

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
    if not hol or hol.user_id != effective_user_id: raise HTTPException(status_code=404, detail="Holiday not found or not associated with your data")
    db.delete(hol); db.commit(); return {"ok": True}

@router.get("/company", response_model=SettingsOut)
def get_settings(request: Request, db: Session = Depends(get_db), effective_user_id: int = Depends(get_effective_user_id)): # Inject Request and reorder
    s = db.query(Settings).filter(Settings.user_id == effective_user_id).first()
    if not s:
        s = Settings(user_id=effective_user_id)  # defaults
        db.add(s); db.commit(); db.refresh(s)
    
    full_logo_url = None
    if s.company_logo_url:
        # Extract the unique filename from the stored relative path
        unique_filename = os.path.basename(s.company_logo_url)
        full_logo_url = str(request.url_for("static", path=f"/uploads/{unique_filename}"))

    return SettingsOut(user_id=s.user_id, standard_work_hours_per_day=s.standard_work_hours_per_day, currency=s.currency, company_name=s.company_name, overtime_multiplier=s.overtime_multiplier, mark_sundays_as_holiday=s.mark_sundays_as_holiday, company_logo_url=full_logo_url)

@router.post("/company", response_model=SettingsOut)
def set_settings(request: Request, payload: SettingsIn, db: Session = Depends(get_db), effective_user_id: int = Depends(get_effective_user_id)): # Inject Request and reorder
    logger.info(f"Effective user ID {effective_user_id} received set settings payload: {payload.dict()}") # Use logger.info
    try:
        s = db.query(Settings).filter(Settings.user_id == effective_user_id).first()
        if not s:
            s = Settings(user_id=effective_user_id)
            db.add(s)
        s.standard_work_hours_per_day = payload.standard_work_hours_per_day
        s.currency = payload.currency # Save currency
        s.company_name = payload.company_name # Save company name
        s.overtime_multiplier = payload.overtime_multiplier # Save overtime multiplier
        
        # Check if mark_sundays_as_holiday is enabled and was previously disabled
        if payload.mark_sundays_as_holiday and not s.mark_sundays_as_holiday:
            generate_sunday_holidays(db, effective_user_id)

        s.mark_sundays_as_holiday = payload.mark_sundays_as_holiday # Save mark_sundays_as_holiday
        db.commit(); db.refresh(s)
        
        full_logo_url = None
        if s.company_logo_url:
            # Extract the unique filename from the stored relative path
            unique_filename = os.path.basename(s.company_logo_url)
            full_logo_url = str(request.url_for("static", path=f"/uploads/{unique_filename}"))

        return SettingsOut(user_id=s.user_id, standard_work_hours_per_day=s.standard_work_hours_per_day, currency=s.currency, company_name=s.company_name, overtime_multiplier=s.overtime_multiplier, mark_sundays_as_holiday=s.mark_sundays_as_holiday, company_logo_url=full_logo_url)
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving settings for effective user ID {effective_user_id}: {e}", exc_info=True) # Use logger.error
        raise HTTPException(status_code=500, detail=f"Failed to save settings: {e}")
