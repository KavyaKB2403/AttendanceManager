Attendance Manager

A full-stack Attendance & Salary Management System built with:

Backend: FastAPI (Python)

Frontend: React / Next.js

Database: MySQL

This system simplifies attendance tracking, salary calculation, and employee management for organizations.

🚀 Features

🔑 Authentication – Secure login & registration (JWT-based)

👨‍💼 Employee Management – Add, update, and manage employees

🕒 Attendance Tracking – Mark daily attendance, track history

📊 Reports & Analytics – Salary reports, attendance charts, and insights

⚡ Role-Based Access – Separate roles for Admin, HR, and Employees

📩 Email Notifications (optional)

🛠️ Tech Stack

Frontend

React / Next.js

TailwindCSS + shadcn/ui

Axios (API calls)

Backend

FastAPI (Python)

SQLAlchemy (ORM)

JWT Auth

Database

MySQL

📂 Project Structure
AttendanceManager/
│── backend/        # FastAPI backend (APIs, DB models, auth)
│── frontend/       # React/Next.js frontend (UI, pages, components)
│── .env.example    # Example environment file
│── README.md       # Documentation

⚙️ Setup
Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

Frontend
cd frontend
npm install
npm run dev

Database (MySQL)

Create a database and update .env with:

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=yourpassword
DB_NAME=attendance_db

📦 Deployment

Frontend → Vercel / Netlify

Backend → Render / Railway / AWS

Database → Railway (Free MySQL) / PlanetScale