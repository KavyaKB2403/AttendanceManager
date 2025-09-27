-- MySQL schema (created automatically by SQLAlchemy on first run, but kept for reference)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NULL,
  position VARCHAR(100) NULL,
  department VARCHAR(100) NULL,
  monthly_salary DOUBLE NOT NULL,
  date_of_joining DATE NULL,
  user_id INT NOT NULL,
  INDEX(user_id)
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  status ENUM('Present','Absent','Half-day') NOT NULL,
  manual_overtime_hours DOUBLE DEFAULT 0,
  automatic_overtime_hours DOUBLE DEFAULT 0,
  late_hours FLOAT NOT NULL DEFAULT 0.0,
  employee_id INT NOT NULL,
  user_id INT NOT NULL,
  UNIQUE KEY _uniq_employee_date (date, employee_id)
);

CREATE TABLE IF NOT EXISTS holidays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  name VARCHAR(120) NOT NULL,
  user_id INT NOT NULL
);

-- Extended MySQL schema
ALTER TABLE users ADD COLUMN role ENUM('admin','staff') NOT NULL DEFAULT 'admin';

CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  company_name VARCHAR(255) NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  mark_sundays_as_holiday BOOLEAN NOT NULL DEFAULT FALSE,
  overtime_multiplier FLOAT NOT NULL DEFAULT 1.5,
  standard_work_hours_per_day DOUBLE NOT NULL DEFAULT 8.0
);

CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0
);