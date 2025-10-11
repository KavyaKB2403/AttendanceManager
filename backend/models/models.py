from sqlalchemy import Column, Integer, String, Date, Enum, ForeignKey, Float, DateTime, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from db import Base
import enum
from datetime import datetime

class AttendanceStatus(str, enum.Enum):
    Present = "Present"
    Absent = "Absent"
    HALF_DAY = "Half-day"

class UserRole(str, enum.Enum):
    Admin = "admin"
    Staff = "staff"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, values_callable=lambda obj: [e.value for e in obj]), default=UserRole.Admin, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)
    created_by_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True) # For staff, links to admin who created them

    employees = relationship("Employee", back_populates="owner", cascade="all, delete-orphan", foreign_keys="Employee.user_id")
    holidays = relationship("Holiday", back_populates="owner", cascade="all, delete-orphan")
    settings = relationship("Settings", back_populates="owner", uselist=False, cascade="all, delete-orphan")
    password_resets = relationship("PasswordReset", back_populates="user", cascade="all, delete-orphan")

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    monthly_salary = Column(Float, nullable=False)
    date_of_joining = Column(Date, nullable=True)
    bank_account = Column(String(120), nullable=True) # Renamed from email
    position = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # New fields for status and simple audit/salary effectivity
    status = Column(String(20), default="active", nullable=False)
    salary_effective_from = Column(Date, nullable=True)
    inactive_from = Column(Date, nullable=True)
    last_updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    last_updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="employees", foreign_keys=[user_id])
    # Optional relationship to the user who last updated the record
    last_updated_by_user = relationship("User", foreign_keys=[last_updated_by])
    attendance = relationship("AttendanceRecord", back_populates="employee", cascade="all,delete")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True, nullable=False)
    status = Column(Enum(AttendanceStatus, values_callable=lambda obj: [e.value for e in obj]), nullable=False) # Store enum value
    manual_overtime_hours = Column(Float, default=0.0)
    automatic_overtime_hours = Column(Float, default=0.0)
    late_hours = Column(Float, default=0.0) # Added late_hours column
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    employee = relationship("Employee", back_populates="attendance")

    __table_args__ = (UniqueConstraint('date', 'employee_id', name='_uniq_employee_date'),)

class Holiday(Base):
    __tablename__ = "holidays"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=False, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    owner = relationship("User", back_populates="holidays")

class Settings(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    standard_work_hours_per_day = Column(Float, default=8.0, nullable=False)
    currency = Column(String(10), default="INR", nullable=False) # Added currency column
    company_name = Column(String(255), nullable=True) # Added company_name column
    overtime_multiplier = Column(Float, default=1.5, nullable=False) # Added overtime_multiplier column
    mark_sundays_as_holiday = Column(Boolean, default=False, nullable=False) # Added mark_sundays_as_holiday column
    owner = relationship("User", back_populates="settings")
    company_logo_url = Column(String(255), nullable=True)

class PasswordReset(Base):
    __tablename__ = "password_resets"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    user = relationship("User", back_populates="password_resets")
