import enum
import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Integer, Boolean, Numeric, Enum, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from app.core.db import Base


class FeeCategory(str, enum.Enum):
    REGISTRATION = "REGISTRATION"
    HOSTEL = "HOSTEL"
    DUES = "DUES"


class VerificationStatus(str, enum.Enum):
    NOT_REQUIRED = "NOT_REQUIRED"
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class DocumentType(str, enum.Enum):
    REGISTRATION_RECEIPT = "REGISTRATION_RECEIPT"
    HOSTEL_RECEIPT = "HOSTEL_RECEIPT"
    DUES_RECEIPT = "DUES_RECEIPT"
    ANTI_RAGGING = "ANTI_RAGGING"
    ABC_CARD = "ABC_CARD"


class FeeRecord(Base):
    __tablename__ = "fee_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_id = Column(String(36), ForeignKey("semester_registrations.id"), nullable=False)
    fee_category = Column(Enum(FeeCategory), nullable=False)
    amount_due = Column(Numeric(10, 2), nullable=False, default=0.00)
    amount_paid = Column(Numeric(10, 2), nullable=False, default=0.00)
    status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False)

    registration = relationship("SemesterRegistration", back_populates="fee_records")
    receipts = relationship("PaymentReceipt", back_populates="fee_record")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_id = Column(String(36), ForeignKey("semester_registrations.id"), nullable=False)
    document_type = Column(Enum(DocumentType), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    registration = relationship("SemesterRegistration", back_populates="documents")
    receipt = relationship("PaymentReceipt", back_populates="document", uselist=False)


class PaymentReceipt(Base):
    __tablename__ = "payment_receipts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_id = Column(String(36), ForeignKey("semester_registrations.id"), nullable=False)
    fee_record_id = Column(String(36), ForeignKey("fee_records.id"), nullable=False)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False)
    transaction_reference = Column(String(100), nullable=True)
    payment_date = Column(Date, nullable=True)
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False)
    rejection_reason = Column(String(500), nullable=True)
    verified_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)

    registration = relationship("SemesterRegistration", back_populates="payment_receipts")
    fee_record = relationship("FeeRecord", back_populates="receipts")
    document = relationship("Document", back_populates="receipt")
    verifier = relationship("User")


class StudentDues(Base):
    __tablename__ = "student_dues"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("student_profiles.id"), nullable=False)
    semester_id = Column(String(36), ForeignKey("academic_semesters.id"), nullable=False)
    fee_category = Column(String(100), nullable=False)  # e.g., "Library Fine", "Lab Fees"
    amount_due = Column(Numeric(10, 2), nullable=False, default=0.00)
    is_cleared = Column(Boolean, default=False, nullable=False)
    remarks = Column(String(255), nullable=True)

    student = relationship("StudentProfile", back_populates="dues")
    semester = relationship("AcademicSemester", back_populates="dues")
