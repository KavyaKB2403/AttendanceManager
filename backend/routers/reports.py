from fastapi import APIRouter, Depends, Response, Query, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from calendar import monthrange
from db import get_db
from models.models import Employee, AttendanceRecord, Settings, Holiday, User # Changed CompanySettings to Settings
from schemas.schemas import SalaryRow
from routers.auth import get_current_user, get_effective_user_id # Import get_effective_user_id
from typing import List, Optional
import csv
import io
from fastapi.responses import Response
from io import StringIO
import calendar

router = APIRouter(prefix="/reports", tags=["reports"])

def month_dates(year: int, month: int):
    days = monthrange(year, month)[1]
    return [date(year, month, d) for d in range(1, days+1)]

# Helper to get the employee_id from user_id (if user is linked to an employee)
def get_employee_id_from_user_id(db: Session, user_id: int) -> Optional[int]:
    employee = db.query(Employee).filter(Employee.user_id == user_id).first()
    return employee.id if employee else None

@router.get("/salary", response_model=List[SalaryRow])
def salary_report(
    month: str = Query(..., description="YYYY-MM"),
    employee_id: Optional[int] = Query(None, description="Filter by a specific Employee ID"), # New optional parameter
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user_id), # Can be admin or staff user ID
):
    year, month_num = map(int, month.split("-"))
    num_days_in_month = calendar.monthrange(year, month_num)[1]
    first_day_of_month = date(year, month_num, 1)
    last_day_of_month = date(year, month_num, num_days_in_month)

    # Base query for employees
    query = db.query(Employee)

    # If the current_user is a staff member, restrict to their employee_id
    if current_user.role == "staff":
        staff_employee_id = get_employee_id_from_user_id(db, current_user.id)
        if not staff_employee_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff user not linked to an employee.")
        query = query.filter(Employee.id == staff_employee_id)
    else: # Admin user
        query = query.filter(Employee.last_updated_by == current_user.id) # Admins see employees they manage
        if employee_id: # Only apply employee_id filter for admin if provided
            query = query.filter(Employee.id == employee_id)

    employees = query.filter(Employee.status == "active").all()

    # Determine the user ID to use for fetching company settings and holidays
    # If current_user is staff, use the ID of the admin who created them
    # Otherwise, use current_user.id (for admins)
    effective_user_for_settings_holidays = current_user.created_by_admin_id if current_user.role == "staff" else current_user.id
    
    if not effective_user_for_settings_holidays:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not determine effective user for settings/holidays.")

    company_settings = db.query(Settings).filter(Settings.user_id == effective_user_for_settings_holidays).first()
    std_hours = company_settings.standard_work_hours_per_day if company_settings else 8.0
    dates = month_dates(year, month_num)
    total_calendar_days_in_month = monthrange(year, month_num)[1]
    # Load holidays for the effective user within the month
    month_start = date(year, month_num, 1)
    month_end = date(year, month_num, total_calendar_days_in_month)
    holiday_dates = set(h.date for h in db.query(Holiday).filter(Holiday.user_id == effective_user_for_settings_holidays, Holiday.date >= month_start, Holiday.date <= month_end).all())

    out: List[SalaryRow] = []
    for e in employees:
        # Attendance in month
        recs = db.query(AttendanceRecord).filter(AttendanceRecord.employee_id == e.id, AttendanceRecord.date >= dates[0], AttendanceRecord.date <= dates[-1]).all()
        
        normal_present_days = 0
        holiday_present_days_with_presence = 0
        
        for r in recs:
            if r.status.value == "Present":
                if r.date in holiday_dates:
                    holiday_present_days_with_presence += 1
                else:
                    normal_present_days += 1
        
        half_days = sum(1 for r in recs if r.status.value == "Half-day")
        total_ot = sum((r.manual_overtime_hours or 0.0) for r in recs)
        total_late = sum((r.late_hours or 0.0) for r in recs) # Sum late hours
        # Compute paid holidays on/after employee's joining date and before inactive_from if set
        # Ensure we don't double count holidays where employee was explicitly present
        actual_paid_holidays = {d for d in holiday_dates if 
                               (e.date_of_joining is None or d >= e.date_of_joining) and 
                               (e.inactive_from is None or d <= e.inactive_from) and 
                               d not in {r.date for r in recs if r.status.value == "Present"}} # Exclude holidays where employee was present

        paid_holiday_days = float(len(actual_paid_holidays)) + float(holiday_present_days_with_presence)
        work_days = float(normal_present_days) + 0.5 * float(half_days)
        total_paid_days = work_days + paid_holiday_days
        # Hourly rate based on full month capacity: total month days * standard hours
        hourly_rate = (e.monthly_salary or 0.0) / max(1.0, total_calendar_days_in_month * std_hours)
        # Regular hours calculation now uses distinct normal present days and paid holiday days
        regular_hours = (normal_present_days * std_hours) + (half_days * (std_hours / 2.0)) + (paid_holiday_days * std_hours)
        total_hours_worked = regular_hours + total_ot - total_late # Deduct late hours
        total_payable = hourly_rate * total_hours_worked
        out.append(SalaryRow(
            employee_id=e.id, name=e.name, base_monthly_salary=e.monthly_salary,
            days_present=normal_present_days, half_days=half_days, # Use normal_present_days
            work_days=round(work_days,2), paid_holiday_days=round(paid_holiday_days,2), total_paid_days=round(total_paid_days,2),
            total_overtime_hours=round(total_ot,2), total_late_hours=round(total_late,2), hourly_rate=round(hourly_rate,2),
            total_hours_worked=round(total_hours_worked,2), total_payable_salary=round(total_payable,2),
        ))
    return out

@router.get("/salary.csv")
def salary_report_csv(
    month: str,
    employee_id: Optional[int] = Query(None, description="Filter by a specific Employee ID for CSV export"), # New optional parameter
    db: Session = Depends(get_db),
    current_user: User = Depends(get_effective_user_id), # Can be admin or staff user ID
):
    data = salary_report(month, employee_id, db, current_user) # Pass employee_id and current_user
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Employee ID","Name","Base Monthly Salary","Days Present","Half Days","Work Days","Paid Holidays","Total Paid Days","Total OT (h)","Total Late (h)","Hourly Rate","Total Hours Worked","Total Payable Salary"])
    for row in data:
        writer.writerow([row.employee_id, row.name, row.base_monthly_salary, row.days_present, row.half_days, row.work_days, row.paid_holiday_days, row.total_paid_days, row.total_overtime_hours, row.total_late_hours, row.hourly_rate, row.total_hours_worked, row.total_payable_salary])
    csv_bytes = output.getvalue().encode("utf-8")
    return Response(content=csv_bytes, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=salary_{month}.csv"})
