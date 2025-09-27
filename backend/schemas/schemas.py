from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional, List, Literal
from fastapi import UploadFile # Added for file uploads
from backend.models.models import AttendanceStatus # Import AttendanceStatus

# Auth
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[Literal["admin","staff"]] = "admin"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    created_at: datetime
    last_login_at: Optional[datetime] = None # Add last_login_at

    class Config:
        from_attributes = True

class StaffCreatedOut(UserOut):
    temp_password: Optional[str] = None

class EmailSchema(BaseModel):
    email: EmailStr

class PasswordResetRequest(BaseModel):
    token: str
    new_password: str

class StaffCreate(BaseModel):
    name: str
    email: EmailStr

# Employee
class EmployeeBase(BaseModel):
    name: str
    monthly_salary: Optional[float] = 0.0 # Made optional with default
    date_of_joining: Optional[date] = None
    bank_account: Optional[str] = None # Renamed from email
    position: Optional[str] = None
    department: Optional[str] = None

class EmployeeCreate(EmployeeBase): ...
class EmployeeUpdate(EmployeeBase): ...

class EmployeeOut(EmployeeBase):
    id: int
    class Config:
        from_attributes = True

# Attendance
class AttendanceBase(BaseModel):
    date: date
    status: AttendanceStatus
    manual_overtime_hours: float = 0.0
    late_hours: Optional[float] = 0.0 # Added late_hours field

class AttendanceCreate(AttendanceBase):
    employee_id: int # employee_id should be here

# Schema for outputting attendance records, including the generated ID
class AttendanceOut(AttendanceBase):
    id: int
    employee_id: int # employee_id for output
    automatic_overtime_hours: float = 0.0
    late_hours: Optional[float] = 0.0 # Added late_hours field
    class Config:
        from_attributes = True

# Holiday
class HolidayBase(BaseModel):
    date: date
    name: str

class HolidayCreate(HolidayBase): ...
class HolidayOut(HolidayBase):
    id: int
    class Config:
        from_attributes = True

# Settings
class SettingsIn(BaseModel):
    standard_work_hours_per_day: float
    currency: Optional[str] = "INR" # Added currency field
    company_name: Optional[str] = None # Added company_name field
    overtime_multiplier: Optional[float] = None # Added overtime_multiplier field
    mark_sundays_as_holiday: Optional[bool] = False # Added mark_sundays_as_holiday field

class SettingsOut(SettingsIn):
    user_id: int
    company_logo_url: Optional[str] = None # Added for company logo
    class Config:
        from_attributes = True

# Company Logo
class CompanyLogoUpload(BaseModel):
    file: UploadFile

# Reports
class SalaryRow(BaseModel):
    employee_id: int
    name: str
    base_monthly_salary: float
    days_present: int
    half_days: int
    total_overtime_hours: float
    total_late_hours: float # Added total_late_hours field
    hourly_rate: float
    total_hours_worked: float
    total_payable_salary: float
