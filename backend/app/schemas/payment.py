from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, Field
from app.models.payment import FeeCategory, VerificationStatus


class VerifyReceiptRequest(BaseModel):
    action: str = Field(..., description="VERIFY or REJECT")
    rejection_reason: Optional[str] = None
    transaction_reference: Optional[str] = None


class PendingReceiptOut(BaseModel):
    id: str
    registration_id: str
    application_number: str
    student_name: str
    mis_number: str
    fee_category: FeeCategory
    amount_due: float
    document_id: str
    document_filename: str
    transaction_reference: Optional[str] = None
    verification_status: VerificationStatus
    rejection_reason: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True
