import uvicorn
import os
import logging # Import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # Import StaticFiles
from db import Base, engine
# import models so SQLAlchemy sees them (models define Base subclasses)
from models import models  # noqa: F401
from routers import auth, employees, attendance, settings as settings_router, reports, admin # Import admin router
from dotenv import load_dotenv

load_dotenv()

# Configure basic logging
logging.basicConfig(level=logging.INFO) # Configure logging to show INFO level and above

app = FastAPI(title="Attendance & Salary API", version="0.1.0", redirect_slashes=False)


# Get allowed origins from an environment variable
# Example value: "https://your-vercel-app.vercel.app,http://localhost:3000"
allowed_origins_str = os.getenv("BASE_URL", "")
origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin]
print("Origins:", origins)
# If no origins are specified in the environment, default to localhost for development
if not origins:
    origins = [
        "http://localhost:3000",
        "http://localhost:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables (SQLite or configured DB) if they don't exist
# Base.metadata.create_all(bind=engine)
app.mount("/static", StaticFiles(directory="static"), name="static") # Mount static files
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
