import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.db import Base


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    mis_number = Column(String(50), unique=True, index=True, nullable=False)
    department = Column(String(100), nullable=False)
    current_semester = Column(Integer, nullable=False, default=1)
    academic_year = Column(String(20), nullable=False)
    faculty_advisor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    is_hosteller_eligible = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="student_profile", foreign_keys=[user_id])
    faculty_advisor = relationship("User", back_populates="advised_students", foreign_keys=[faculty_advisor_id])
    registrations = relationship("SemesterRegistration", back_populates="student")
    dues = relationship("StudentDues", back_populates="student")


class FacultyProfile(Base):
    __tablename__ = "faculty_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    department = Column(String(100), nullable=False)
    designation = Column(String(100), nullable=False, default="Assistant Professor")

    user = relationship("User", back_populates="faculty_profile", foreign_keys=[user_id])
