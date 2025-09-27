import enum
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date, datetime
from backend.db import get_db
from backend.models.models import AttendanceRecord, Employee, Holiday, AttendanceStatus, Settings
from backend.schemas.schemas import AttendanceCreate, AttendanceOut
from backend.routers.auth import get_current_user, require_admin, get_effective_user_id # Import get_effective_user_id
from typing import List, Optional
import logging
from backend.models.models import User # Added missing import for User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/attendance", tags=["attendance"])

def is_holiday(db: Session, day: date, effective_user_id: int) -> Optional[Holiday]: # Use effective_user_id
    return db.query(Holiday).filter(Holiday.user_id == effective_user_id, Holiday.date == day).first()

def get_settings_hours(db: Session, effective_user_id: int) -> float: # Use effective_user_id
    s = db.query(Settings).filter(Settings.user_id == effective_user_id).first()
    return s.standard_work_hours_per_day if s else 8.0

@router.post("/", response_model=AttendanceOut)
def upsert_attendance(payload: AttendanceCreate, db: Session = Depends(get_db), current_admin_user: User = Depends(require_admin), effective_user_id: int = Depends(get_effective_user_id)):
    emp = db.get(Employee, payload.employee_id)
    if not emp or emp.user_id != effective_user_id: raise HTTPException(status_code=404, detail="Employee not found or not associated with your data")

    logger.info(f"Effective user ID {effective_user_id} received attendance payload: {payload.model_dump()}")

    auto_ot = 0.0
    hol = is_holiday(db, payload.date, effective_user_id)
    if hol and payload.status == "Present":
        auto_ot = get_settings_hours(db, effective_user_id)
    rec = db.query(AttendanceRecord).filter(AttendanceRecord.employee_id==payload.employee_id, AttendanceRecord.date==payload.date).first()
    if rec:
        rec.status = AttendanceStatus(payload.status)
        rec.manual_overtime_hours = payload.manual_overtime_hours
        rec.automatic_overtime_hours = auto_ot
        rec.late_hours = payload.late_hours # Save late hours
    else:
        rec = AttendanceRecord(date=payload.date, status=AttendanceStatus(payload.status),
                               manual_overtime_hours=payload.manual_overtime_hours,
                               automatic_overtime_hours=auto_ot,
                               late_hours=payload.late_hours, # Save late hours
                               employee_id=payload.employee_id, user_id=effective_user_id) # Associate with the effective user
        db.add(rec)
    try:
        db.commit()
        db.refresh(rec)
        logger.info(f"Successfully upserted attendance record for employee {payload.employee_id} on {payload.date} by effective user ID {effective_user_id}")
        return rec
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to upsert attendance record: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save attendance record")

@router.get("/", response_model=List[AttendanceOut])
def list_attendance(employee_id: Optional[int] = None,
                    start: Optional[date] = Query(None), end: Optional[date] = Query(None),
                    db: Session = Depends(get_db), effective_user_id: int = Depends(get_effective_user_id)):
    q = db.query(AttendanceRecord).filter(AttendanceRecord.user_id == effective_user_id)
    if employee_id: q = q.filter(AttendanceRecord.employee_id == employee_id)
    if start: q = q.filter(AttendanceRecord.date >= start)
    if end: q = q.filter(AttendanceRecord.date <= end)
    return q.order_by(AttendanceRecord.date.desc()).all()
