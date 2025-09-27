CREATE TYPE attendance_status AS ENUM ('Present', 'Absent', 'Half-day');
CREATE TYPE user_role AS ENUM ('admin', 'staff');

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  role user_role NOT NULL DEFAULT 'admin'
);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  bank_account VARCHAR(120) NULL, # Renamed from email
  position VARCHAR(100) NULL,
  department VARCHAR(100) NULL,
  monthly_salary DOUBLE PRECISION NOT NULL,
  date_of_joining DATE NULL,
  user_id INT NOT NULL,
  CONSTRAINT fk_user
      FOREIGN KEY(user_id) 
	  REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  status attendance_status NOT NULL,
  manual_overtime_hours DOUBLE PRECISION DEFAULT 0,
  automatic_overtime_hours DOUBLE PRECISION DEFAULT 0,
  late_hours REAL NOT NULL DEFAULT 0.0,
  employee_id INT NOT NULL,
  user_id INT NOT NULL,
  CONSTRAINT _uniq_employee_date UNIQUE (date, employee_id),
  CONSTRAINT fk_employee
      FOREIGN KEY(employee_id) 
	  REFERENCES employees(id),
  CONSTRAINT fk_user_attendance
      FOREIGN KEY(user_id) 
	  REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  name VARCHAR(120) NOT NULL,
  user_id INT NOT NULL,
  CONSTRAINT fk_user_holiday
      FOREIGN KEY(user_id) 
	  REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  company_name VARCHAR(255) NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  mark_sundays_as_holiday BOOLEAN NOT NULL DEFAULT FALSE,
  overtime_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.5,
  standard_work_hours_per_day DOUBLE PRECISION NOT NULL DEFAULT 8.0,
  CONSTRAINT fk_user_settings
      FOREIGN KEY(user_id) 
	  REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_user_password_reset
      FOREIGN KEY(user_id) 
	  REFERENCES users(id)
);
