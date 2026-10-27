from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.hostel import Hostel

router = APIRouter()


@router.get("/")
def get_hostels(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Retrieve list of active hostels for selection."""
    hostels = db.query(Hostel).filter(Hostel.is_active == True).all()
    return [
        {
            "id": h.id,
            "name": h.name,
            "gender_category": h.gender_category.value,
            "hostel_fee_per_semester": float(h.hostel_fee_per_semester)
        }
        for h in hostels
    ]
