import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Integer, Boolean, Numeric, Date, DateTime
from sqlalchemy.orm import relationship
from app.core.db import Base


class AcademicSemester(Base):
    __tablename__ = "academic_semesters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    academic_year = Column(String(20), nullable=False)  # e.g. "2026-2027"
    semester_number = Column(Integer, nullable=False)   # 1 to 8
    title = Column(String(100), nullable=False)         # e.g. "Monsoon 2026"
    is_active = Column(Boolean, default=False, nullable=False, index=True)
    registration_start_date = Column(Date, nullable=True)
    registration_end_date = Column(Date, nullable=True)
    default_registration_fee = Column(Numeric(10, 2), nullable=False, default=45000.00)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    registrations = relationship("SemesterRegistration", back_populates="semester")
    dues = relationship("StudentDues", back_populates="semester")
