import enum
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from db import get_db
from models.models import AttendanceRecord, Employee, Holiday, AttendanceStatus, Settings, User # Changed CompanySettings to Settings
from schemas.schemas import AttendanceCreate, AttendanceOut
from routers.auth import require_admin, get_effective_user_id # Import get_effective_user_id
from typing import List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/attendance", tags=["attendance"])

# Helper to get the employee_id from user_id (if user is linked to an employee)
def get_employee_id_from_user_id(db: Session, user_id: int) -> Optional[int]:
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    return employee.id if employee else None

@router.post("/", response_model=AttendanceOut, status_code=status.HTTP_201_CREATED)
def upsert_attendance(payload: AttendanceCreate, db: Session = Depends(get_db), current_admin_user: User = Depends(require_admin), effective_user_id: User = Depends(get_effective_user_id)):
    # If the effective_user_id is a staff member, ensure they can only mark their own attendance
    if effective_user_id.role == "staff":
        staff_employee_id = get_employee_id_from_user_id(db, effective_user_id.id)
        if not staff_employee_id or staff_employee_id != payload.employee_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff can only mark their own attendance.")

    # For admin, check if the employee is managed by the current admin
    employee = db.query(Employee).filter(
        Employee.id == payload.employee_id,
        Employee.last_updated_by == current_admin_user.id # Admin can mark attendance for employees they manage
    ).first()
    if not employee or employee.status == "inactive":
        raise HTTPException(status_code=400, detail="Cannot mark attendance for inactive employee or employee not associated with your account")

    # logger.info(f"Effective user ID {effective_user_id.id} received attendance payload: {payload.model_dump()}")

    auto_ot = 0.0
    # Check if the date is a holiday
    is_holiday = db.query(Holiday).filter(
        Holiday.user_id == current_admin_user.id, Holiday.date == payload.date # Admins only see their own company's holidays
    ).first()
    
    # Removed automatic overtime marking on holidays
    # if is_holiday and payload.status == "Present":
    #     # Get standard work hours from Settings
    #     company_settings = db.query(Settings).filter(Settings.user_id == current_admin_user.id).first()
    #     auto_ot = company_settings.standard_work_hours_per_day if company_settings else 8.0
    
    rec = db.query(AttendanceRecord).filter(AttendanceRecord.employee_id==payload.employee_id, AttendanceRecord.date==payload.date).first()
    if rec:
        rec.status = AttendanceStatus(payload.status)
        rec.manual_overtime_hours = payload.manual_overtime_hours
        # Removed automatic_overtime_hours assignment
        rec.late_hours = payload.late_hours
    else:
        rec = AttendanceRecord(date=payload.date, status=AttendanceStatus(payload.status),
                               manual_overtime_hours=payload.manual_overtime_hours,
                               late_hours=payload.late_hours,
                               employee_id=payload.employee_id, user_id=effective_user_id.id)
        db.add(rec)
    try:
        db.commit()
        db.refresh(rec)
        # logger.info(f"Successfully upserted attendance record for employee {payload.employee_id} on {payload.date} by effective user ID {effective_user_id.id}")
        return rec
    except Exception as e:
        db.rollback()
        # logger.error(f"Failed to upsert attendance record: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save attendance record")

@router.get("/", response_model=List[AttendanceOut])
def list_attendance(
    employee_id: Optional[int] = Query(None, description="Filter by Employee ID"),
    start_date: Optional[date] = Query(None, description="Start date for filtering (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date for filtering (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user_id),
):
    query = db.query(AttendanceRecord).join(Employee, AttendanceRecord.employee_id == Employee.id)

    if current_user.role == "staff":
        staff_employee_id = get_employee_id_from_user_id(db, current_user.id)
        if not staff_employee_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff user not linked to an employee.")
        query = query.filter(AttendanceRecord.employee_id == staff_employee_id)
    else: # Admin user
        query = query.filter(Employee.last_updated_by == current_user.id) # Admin sees attendance for employees they manage
        if employee_id:
            query = query.filter(AttendanceRecord.employee_id == employee_id)

    if start_date:
        query = query.filter(AttendanceRecord.date >= start_date)
    if end_date:
        query = query.filter(AttendanceRecord.date <= end_date)

    return query.all()

@router.get("/{attendance_id}", response_model=AttendanceOut)
def get_attendance_by_id(attendance_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_effective_user_id)):
    query = db.query(AttendanceRecord).join(Employee, AttendanceRecord.employee_id == Employee.id)

    if current_user.role == "staff":
        staff_employee_id = get_employee_id_from_user_id(db, current_user.id)
        if not staff_employee_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff user not linked to an employee.")
        query = query.filter(AttendanceRecord.employee_id == staff_employee_id)
    else: # Admin user
        query = query.filter(Employee.last_updated_by == current_user.id)

    attendance = query.filter(AttendanceRecord.id == attendance_id).first()

    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found or not authorized")

    return attendance

@router.put("/{attendance_id}", response_model=AttendanceOut)
def update_attendance(attendance_id: int, payload: AttendanceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_effective_user_id)):
    query = db.query(AttendanceRecord).join(Employee, AttendanceRecord.employee_id == Employee.id)

    if current_user.role == "staff":
        staff_employee_id = get_employee_id_from_user_id(db, current_user.id)
        if not staff_employee_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff user not linked to an employee.")
        query = query.filter(AttendanceRecord.employee_id == staff_employee_id)
    else: # Admin user
        query = query.filter(Employee.last_updated_by == current_user.id)

    attendance_record = query.filter(AttendanceRecord.id == attendance_id).first()

    if not attendance_record:
        raise HTTPException(status_code=404, detail="Attendance record not found or not authorized to update.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(attendance_record, field, value)
    db.commit()
    db.refresh(attendance_record)
    return attendance_record

@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(attendance_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)): # Only admin can delete
    query = db.query(AttendanceRecord).join(Employee, AttendanceRecord.employee_id == Employee.id)

    # Admins can delete attendance for employees they manage
    query = query.filter(Employee.last_updated_by == current_user.id)

    attendance_record = query.filter(AttendanceRecord.id == attendance_id).first()

    if not attendance_record:
        raise HTTPException(status_code=404, detail="Attendance record not found or not authorized to delete.")
    db.delete(attendance_record)
    db.commit()
    return

@router.get("/weekly_summary", response_model=List[dict])
def get_weekly_attendance_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user_id),
):
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)

    query = db.query(AttendanceRecord).join(Employee, AttendanceRecord.employee_id == Employee.id)

    if current_user.role == "staff":
        staff_employee_id = get_employee_id_from_user_id(db, current_user.id)
        if not staff_employee_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff user not linked to an employee.")
        query = query.filter(AttendanceRecord.employee_id == staff_employee_id)
    else: # Admin user
        query = query.filter(Employee.last_updated_by == current_user.id)

    records = query.filter(
        AttendanceRecord.date >= start_of_week,
        AttendanceRecord.date <= end_of_week
    ).all()
    return records
