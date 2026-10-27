from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ReviewRegistrationRequest(BaseModel):
    registration_id: str
    action: str = Field(..., description="Action to take: APPROVE, RETURN_DISCREPANCY, or REJECT")
    comments: Optional[str] = Field(None, description="Discrepancy / rejection reason (mandatory for rejection/discrepancy)")


class PendingRegistrationOut(BaseModel):
    id: str
    application_number: str
    student_name: str
    mis_number: str
    department: str
    current_semester: int
    is_hosteller: bool
    hostel_name: Optional[str] = None
    status: str
    submitted_at: Optional[datetime] = None
    latest_rejection_reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
