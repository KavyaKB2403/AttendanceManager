import enum
from sqlalchemy import Column, Integer, String, Date, Enum as ENUM, ForeignKey, Float, DateTime, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from db import Base
from datetime import datetime
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM # <-- New Import

class AttendanceStatus(str, enum.Enum):
    Present = "Present"
    Absent = "Absent"
    HALF_DAY = "HALF_DAY"

class UserRole(str, enum.Enum):
    admin = "admin"
    staff = "staff"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False) # Changed from hashed_password
    role = Column(ENUM(UserRole), default=UserRole.staff, nullable=False) # Use UserRole Enum and default to staff
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True) # Last login timestamp
    created_by_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True) # For staff, links to admin who created them

    # One-to-one relationship with Employee (a User can be linked to one Employee)
    employee_obj = relationship("Employee", back_populates="user_rel", uselist=False, foreign_keys="Employee.user_id") # Explicit foreign_keys

    # This relationship is for admins creating other users
    created_staff = relationship("User", backref="creator", remote_side=[id], foreign_keys="User.created_by_admin_id") # Explicit foreign_keys

    holidays = relationship("Holiday", back_populates="owner", cascade="all, delete-orphan")
    settings = relationship("Settings", back_populates="owner", uselist=False, cascade="all, delete-orphan") # Changed here
    password_resets = relationship("PasswordReset", back_populates="user", cascade="all, delete-orphan")

    def is_admin(self):
        return self.role == UserRole.admin

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    # Optional one-to-one link to a User (staff member)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True) # Allow null for unlinked employees
    name = Column(String(255), index=True, nullable=False)
    monthly_salary = Column(Float, nullable=False)
    date_of_joining = Column(Date, nullable=True)
    bank_account = Column(String(120), nullable=True)
    position = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    status = Column(String(20), default="active", nullable=False)
    salary_effective_from = Column(Date, nullable=True)
    inactive_from = Column(Date, nullable=True)
    last_updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False) # Added created_at
    last_updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # One-to-one relationship back to User (staff member)
    user_rel = relationship("User", back_populates="employee_obj", foreign_keys=[user_id])
    
    # Relationship to the user who last updated the record
    last_updated_by_user = relationship("User", foreign_keys=[last_updated_by])
    
    attendance = relationship("AttendanceRecord", back_populates="employee", cascade="all,delete")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True, nullable=False)
    # --- CHANGE HERE ---
    # Use the SQLAlchemy generic Enum for standard operations
    # AND specify the PostgreSQL type name exactly as it exists in the database.
    status = Column(
        ENUM(AttendanceStatus, name='attendance_status', create_type=False), # <-- Specify name and disable auto-create
        nullable=False
    )
    # --- END CHANGE ---
    manual_overtime_hours = Column(Float, default=0.0)
    late_hours = Column(Float, default=0.0)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    # The user_id here refers to the user who marked the attendance, not the employee's linked user
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True) # Changed to marked_by_user_id

    employee = relationship("Employee", back_populates="attendance")
    marked_by_user = relationship("User") # Add relationship for who marked it

    __table_args__ = (UniqueConstraint('date', 'employee_id', name='_uniq_employee_date'),)

class Holiday(Base):
    __tablename__ = "holidays"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=False, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False) # User who owns this holiday setting
    owner = relationship("User", back_populates="holidays")

class Settings(Base): # Renamed from CompanySettings
    __tablename__ = "settings" # Corrected table name
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False) # User who owns these settings
    standard_work_hours_per_day = Column(Float, default=8.0, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    company_name = Column(String(255), nullable=True)
    overtime_multiplier = Column(Float, default=1.5, nullable=False)
    mark_sundays_as_holiday = Column(Boolean, default=False, nullable=False)
    owner = relationship("User", back_populates="settings") # Update back_populates to "settings"
    company_logo_url = Column(String(255), nullable=True)

class PasswordReset(Base):
    __tablename__ = "password_resets"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    user = relationship("User", back_populates="password_resets")
