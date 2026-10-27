import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.db import Base


class RegistrationStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    PENDING_HOSTEL_STAFF = "PENDING_HOSTEL_STAFF"
    PENDING_WARDEN = "PENDING_WARDEN"
    PENDING_FACULTY = "PENDING_FACULTY"
    RETURNED_FOR_CORRECTION = "RETURNED_FOR_CORRECTION"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class SemesterRegistration(Base):
    __tablename__ = "semester_registrations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    application_number = Column(String(50), unique=True, index=True, nullable=False)
    student_id = Column(String(36), ForeignKey("student_profiles.id"), nullable=False)
    semester_id = Column(String(36), ForeignKey("academic_semesters.id"), nullable=False)
    hostel_id = Column(String(36), ForeignKey("hostels.id"), nullable=True)
    is_hosteller = Column(Boolean, default=False, nullable=False)
    status = Column(Enum(RegistrationStatus), default=RegistrationStatus.DRAFT, nullable=False, index=True)
    submitted_at = Column(DateTime, nullable=True)
    final_approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    student = relationship("StudentProfile", back_populates="registrations")
    semester = relationship("AcademicSemester", back_populates="registrations")
    hostel = relationship("Hostel", back_populates="registrations")
    details = relationship("RegistrationDetails", back_populates="registration", uselist=False)
    fee_records = relationship("FeeRecord", back_populates="registration")
    documents = relationship("Document", back_populates="registration")
    payment_receipts = relationship("PaymentReceipt", back_populates="registration")
    approval_history = relationship("ApprovalHistory", back_populates="registration")


class RegistrationDetails(Base):
    __tablename__ = "registration_details"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_id = Column(String(36), ForeignKey("semester_registrations.id"), unique=True, nullable=False)
    contact_number = Column(String(20), nullable=True)
    emergency_contact = Column(String(20), nullable=True)
    abc_id = Column(String(50), nullable=True)
    additional_info = Column(JSON, nullable=True)

    registration = relationship("SemesterRegistration", back_populates="details")
