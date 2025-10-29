from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import get_db # Your dependency for getting the DB session

router = APIRouter()

@router.get("/health-check")
def health_check(db: Session = Depends(get_db)):
    """
    A simple endpoint to verify the service is up and the DB is connected.
    """
    try:
        # Execute a harmless, fast query to check DB connectivity
        db.execute(text('SELECT 1'))
        return {"status": "ok", "database_status": "connected"}
    except Exception as e:
        # If the DB connection fails, this endpoint will return an error
        raise HTTPException(
            status_code=503, # Service Unavailable
            detail=f"Database connection failed: {e}"
        )
