from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
from models.models import Employee, User
from schemas.schemas import EmployeeCreate, EmployeeUpdate, EmployeeOut
from routers.auth import get_current_user, require_admin, get_effective_user_id
from typing import List
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/employees", tags=["employees"])

@router.post("/", response_model=EmployeeOut)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db), current_admin_user: User = Depends(require_admin), effective_user_id: int = Depends(get_effective_user_id)):
    logger.info(f"Effective user ID {effective_user_id} received employee creation payload: {payload.model_dump()}")
    try:
        emp = Employee(
            name=payload.name,
            monthly_salary=payload.monthly_salary,
            date_of_joining=payload.date_of_joining,
            bank_account=payload.bank_account, # Renamed from email
            position=payload.position,
            department=payload.department,
            user_id=effective_user_id # Associate with the effective user
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
def list_employees(db: Session = Depends(get_db), effective_user_id: int = Depends(get_effective_user_id)):
    # All users (Admin or Staff) will only see employees associated with their effective_user_id
    return db.query(Employee).filter(Employee.user_id == effective_user_id).all()

@router.put("/{emp_id}", response_model=EmployeeOut)
def update_employee(emp_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db), current_admin_user: User = Depends(require_admin), effective_user_id: int = Depends(get_effective_user_id)):
    emp = db.get(Employee, emp_id)
    # Ensure the employee belongs to the effective user's data domain
    if not emp or emp.user_id != effective_user_id:
        raise HTTPException(status_code=404, detail="Employee not found or not associated with your data")
    emp.name = payload.name
    emp.monthly_salary = payload.monthly_salary
    emp.date_of_joining = payload.date_of_joining
    emp.bank_account = payload.bank_account # Renamed from email
    emp.position = payload.position
    emp.department = payload.department
    db.commit(); db.refresh(emp); return emp

@router.delete("/{emp_id}")
def delete_employee(emp_id: int, db: Session = Depends(get_db), current_admin_user: User = Depends(require_admin), effective_user_id: int = Depends(get_effective_user_id)):
    logger.info(f"Effective user ID {effective_user_id} attempting to delete employee with ID: {emp_id}")
    emp = db.get(Employee, emp_id)
    # Ensure the employee belongs to the effective user's data domain
    if not emp or emp.user_id != effective_user_id:
        logger.warning(f"Backend: Employee with ID {emp_id} not found or not associated with effective user ID {effective_user_id} for deletion.")
        raise HTTPException(status_code=404, detail="Employee not found or not associated with your data")
    try:
        db.delete(emp)
        db.commit()
        logger.info(f"Backend: Successfully deleted employee with ID: {emp.id} by effective user ID {effective_user_id}")
        return {"ok": True}
    except Exception as e:
        db.rollback()
        logger.error(f"Backend: Failed to delete employee with ID {emp_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete employee: {e}")
