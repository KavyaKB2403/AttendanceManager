from fastapi import APIRouter, Depends, Response, Query
from sqlalchemy.orm import Session
from datetime import date, datetime
from calendar import monthrange
from backend.db import get_db
from backend.models.models import Employee, AttendanceRecord, Settings
from backend.schemas.schemas import SalaryRow
from backend.routers.auth import get_current_user, get_effective_user_id # Import get_effective_user_id
from typing import List, Optional
import csv
import io

router = APIRouter(prefix="/reports", tags=["reports"])

def month_dates(year: int, month: int):
    days = monthrange(year, month)[1]
    return [date(year, month, d) for d in range(1, days+1)]

@router.get("/salary", response_model=List[SalaryRow])
def salary_report(month: str = Query(..., description="YYYY-MM"), db: Session = Depends(get_db), effective_user_id: int = Depends(get_effective_user_id)):
    year, mon = map(int, month.split("-"))
    settings = db.query(Settings).filter(Settings.user_id == effective_user_id).first()
    std_hours = settings.standard_work_hours_per_day if settings else 8.0
    from datetime import timedelta
    dates = month_dates(year, mon)
    total_calendar_days_in_month = monthrange(year, mon)[1]

    out: List[SalaryRow] = []
    emps = db.query(Employee).filter(Employee.user_id == effective_user_id).all()
    for e in emps:
        # Attendance in month
        recs = db.query(AttendanceRecord).filter(AttendanceRecord.employee_id == e.id, AttendanceRecord.date >= dates[0], AttendanceRecord.date <= dates[-1]).all()
        days_present = sum(1 for r in recs if r.status.value == "Present")
        half_days = sum(1 for r in recs if r.status.value == "Half-day")
        total_ot = sum((r.manual_overtime_hours or 0.0) + (r.automatic_overtime_hours or 0.0) for r in recs)
        total_late = sum((r.late_hours or 0.0) for r in recs) # Sum late hours
        hourly_rate = (e.monthly_salary or 0.0) / max(1, total_calendar_days_in_month * std_hours)
        regular_hours = days_present * std_hours + half_days * (std_hours / 2.0) # Regular hours calculation remains based on standard_work_hours_per_day
        total_hours_worked = regular_hours + total_ot - total_late # Deduct late hours
        total_payable = hourly_rate * total_hours_worked
        out.append(SalaryRow(
            employee_id=e.id, name=e.name, base_monthly_salary=e.monthly_salary,
            days_present=days_present, half_days=half_days,
            total_overtime_hours=round(total_ot,2), total_late_hours=round(total_late,2), hourly_rate=round(hourly_rate,2),
            total_hours_worked=round(total_hours_worked,2), total_payable_salary=round(total_payable,2),
        ))
    return out

@router.get("/salary.csv")
def salary_report_csv(month: str, db: Session = Depends(get_db), effective_user_id: int = Depends(get_effective_user_id)):
    data = salary_report(month, db, effective_user_id) # Pass effective_user_id
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Employee ID","Name","Base Monthly Salary","Days Present","Half Days","Total OT (h)","Total Late (h)","Hourly Rate","Total Hours Worked","Total Payable Salary"])
    for row in data:
        writer.writerow([row.employee_id, row.name, row.base_monthly_salary, row.days_present, row.half_days, row.total_overtime_hours, row.total_late_hours, row.hourly_rate, row.total_hours_worked, row.total_payable_salary])
    csv_bytes = buf.getvalue().encode("utf-8")
    return Response(content=csv_bytes, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=salary_{month}.csv"})
