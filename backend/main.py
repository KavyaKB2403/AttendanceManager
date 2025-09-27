import uvicorn
import logging # Import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # Import StaticFiles
from backend.db import Base, engine
# import models so SQLAlchemy sees them (models define Base subclasses)
from backend.models import models  # noqa: F401
from backend.routers import auth, employees, attendance, settings as settings_router, reports, admin # Import admin router
from dotenv import load_dotenv

load_dotenv()

# Configure basic logging
logging.basicConfig(level=logging.INFO) # Configure logging to show INFO level and above

app = FastAPI(title="Attendance & Salary API", version="0.1.0", redirect_slashes=False)

app.mount("/static", StaticFiles(directory="backend/static"), name="static") # Mount static files

origins = [
    "http://localhost:3000",  # React frontend
    "http://localhost:8000",  # FastAPI backend itself
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Create database tables (SQLite or configured DB) if they don't exist
Base.metadata.create_all(bind=engine)

# Routers
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(settings_router.router)
app.include_router(reports.router)
app.include_router(admin.router) # Include the new admin router

@app.get("/")
def root():
    return {"status": "ok"}

if __name__ == "__main__":
    # For local development
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
