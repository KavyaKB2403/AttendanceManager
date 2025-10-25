from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
from models.models import Employee, User
from schemas.schemas import EmployeeCreate, EmployeeUpdate, EmployeeOut
from routers.auth import get_current_user, require_admin, get_effective_user_id
from typing import List
import logging
from datetime import datetime, date

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/employees", tags=["employees"])

@router.post("/", response_model=EmployeeOut)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db), current_admin_user: User = Depends(require_admin), effective_user_id: User = Depends(get_effective_user_id)):
    logger.info(f"Effective user ID {effective_user_id.id} received employee creation payload: {payload.model_dump()}")
    try:
        emp = Employee(
            name=payload.name,
            monthly_salary=payload.monthly_salary,
            date_of_joining=payload.date_of_joining,
            bank_account=payload.bank_account, # Renamed from email
            position=payload.position,
            department=payload.department,
            user_id=None, # Initially unlinked to a staff user
            last_updated_by=current_admin_user.id # Admin who created this employee
        )
        logger.info(f"Employee object before add: monthly_salary={emp.monthly_salary}, date_of_joining={emp.date_of_joining}, bank_account={emp.bank_account}")
        db.add(emp)
        db.flush() # Flush to get default values from DB before commit and refresh
        db.commit()
        db.refresh(emp)
        logger.info(f"Employee object after refresh: monthly_salary={emp.monthly_salary}, date_of_joining={emp.date_of_joining}, bank_account={emp.bank_account}")
        logger.info(f"Successfully created employee with ID: {emp.id}")
        return emp
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create employee: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create employee: {e}")

@router.get("/", response_model=List[EmployeeOut])
def list_employees(db: Session = Depends(get_db), effective_user_id: User = Depends(get_effective_user_id)):
    if effective_user_id.is_admin():
        # Admins see all employees they created/manage (including unlinked ones)
        employees = db.query(Employee).filter(Employee.last_updated_by == effective_user_id.id).all()
    else:
        # Staff users only see their own employee record
        employees = db.query(Employee).filter(Employee.user_id == effective_user_id.id).all()
    
    for emp in employees:
        if emp.created_at is None:
            emp.created_at = datetime.utcnow()
        if emp.last_updated_at is None:
            emp.last_updated_at = datetime.utcnow()
    return employees

@router.put("/{emp_id}", response_model=EmployeeOut)
def update_employee(emp_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db), current_admin_user: User = Depends(require_admin), effective_user_id: User = Depends(get_effective_user_id)):
    emp = db.get(Employee, emp_id)
    print(emp, emp.last_updated_at, effective_user_id.id)
    # Ensure the employee belongs to the effective user's data domain
    if not emp or emp.last_updated_at != effective_user_id.id:
        raise HTTPException(status_code=404, detail="Employee not found or not associated with your data")
    if payload.name is not None:
        emp.name = payload.name
    if payload.monthly_salary is not None:
        emp.monthly_salary = payload.monthly_salary
    if payload.date_of_joining is not None:
        emp.date_of_joining = payload.date_of_joining
    if payload.bank_account is not None:
        emp.bank_account = payload.bank_account # Renamed from email
    if payload.position is not None:
        emp.position = payload.position
    if payload.department is not None:
        emp.department = payload.department
    if getattr(payload, "salary_effective_from", None) is not None:
        emp.salary_effective_from = payload.salary_effective_from
    if getattr(payload, "status", None) is not None:
        # Track inactive_from when flipping to inactive
        prev_status = emp.status
        emp.status = payload.status
        if payload.status == "inactive" and prev_status != "inactive" and emp.inactive_from is None:
            emp.inactive_from = date.today()
        if payload.status == "active":
            emp.inactive_from = None
    emp.last_updated_by = current_admin_user.id
    emp.last_updated_at = datetime.utcnow()
    db.commit(); db.refresh(emp); return emp

@router.delete("/{emp_id}")
def delete_employee(emp_id: int, db: Session = Depends(get_db), current_admin_user: User = Depends(require_admin), effective_user_id: User = Depends(get_effective_user_id)):
    logger.info(f"Effective user ID {effective_user_id.id} attempting to delete employee with ID: {emp_id}")
    emp = db.get(Employee, emp_id)
    # Ensure the employee belongs to the effective user's data domain
    if not emp or emp.user_id != effective_user_id.id:
        logger.warning(f"Backend: Employee with ID {emp_id} not found or not associated with effective user ID {effective_user_id.id} for deletion.")
        raise HTTPException(status_code=404, detail="Employee not found or not associated with your data")
    try:
        db.delete(emp)
        db.commit()
        logger.info(f"Backend: Successfully deleted employee with ID: {emp.id} by effective user ID {effective_user_id.id}")
        return {"ok": True}
    except Exception as e:
        db.rollback()
        logger.error(f"Backend: Failed to delete employee with ID {emp_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete employee: {e}")
