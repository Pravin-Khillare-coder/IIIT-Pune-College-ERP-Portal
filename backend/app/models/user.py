import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.db import Base


class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    HOSTEL_STAFF = "HOSTEL_STAFF"
    HOSTEL_WARDEN = "HOSTEL_WARDEN"
    FACULTY_ADVISOR = "FACULTY_ADVISOR"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, foreign_keys="StudentProfile.user_id")
    faculty_profile = relationship("FacultyProfile", back_populates="user", uselist=False, foreign_keys="FacultyProfile.user_id")
    hostel_assignments = relationship("HostelStaffAssignment", back_populates="user")
    advised_students = relationship("StudentProfile", back_populates="faculty_advisor", foreign_keys="StudentProfile.faculty_advisor_id")
