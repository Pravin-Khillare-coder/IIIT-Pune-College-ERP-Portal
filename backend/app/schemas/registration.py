from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, Field
from app.models.registration import RegistrationStatus
from app.models.payment import FeeCategory, VerificationStatus, DocumentType


class DraftRegistrationRequest(BaseModel):
    contact_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    abc_id: Optional[str] = None
    is_hosteller: bool = False
    hostel_id: Optional[str] = None


class SubmitRegistrationRequest(BaseModel):
    contact_number: str = Field(..., min_length=10, max_length=15)
    emergency_contact: str = Field(..., min_length=10, max_length=15)
    abc_id: str = Field(..., min_length=5, max_length=50)
    is_hosteller: bool
    hostel_id: Optional[str] = None
    declaration_confirmed: bool = True
    resolution_comments: Optional[str] = Field(None, description="Optional explanation or remarks on how discrepancy was cleared")



class DocumentOut(BaseModel):
    id: str
    document_type: DocumentType
    original_filename: str
    file_size_bytes: int
    mime_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class FeeRecordOut(BaseModel):
    id: str
    fee_category: FeeCategory
    amount_due: float
    amount_paid: float
    status: VerificationStatus

    class Config:
        from_attributes = True


class PaymentReceiptOut(BaseModel):
    id: str
    fee_record_id: str
    document_id: str
    transaction_reference: Optional[str] = None
    payment_date: Optional[date] = None
    verification_status: VerificationStatus
    rejection_reason: Optional[str] = None

    class Config:
        from_attributes = True


class ApprovalHistoryOut(BaseModel):
    id: str
    actor_role: str
    action: str
    from_stage: str
    to_stage: str
    comments: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class RegistrationDetailOut(BaseModel):
    id: str
    application_number: str
    student_id: str
    student_name: str
    mis_number: str
    department: str
    current_semester: int
    academic_year: str
    faculty_advisor_name: Optional[str] = None
    semester_title: str
    hostel_id: Optional[str] = None
    hostel_name: Optional[str] = None
    is_hosteller: bool
    status: RegistrationStatus
    submitted_at: Optional[datetime] = None
    final_approved_at: Optional[datetime] = None
    contact_number: Optional[str] = None
    emergency_contact: Optional[str] = None
    abc_id: Optional[str] = None
    documents: List[DocumentOut] = []
    fee_records: List[FeeRecordOut] = []
    receipts: List[PaymentReceiptOut] = []
    approval_history: List[ApprovalHistoryOut] = []
    latest_rejection_reason: Optional[str] = None
    latest_rejection_role: Optional[str] = None

    class Config:
        from_attributes = True
