import enum
import uuid
from sqlalchemy import Column, String, Boolean, Numeric, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.db import Base


class GenderCategory(str, enum.Enum):
    GIRLS = "GIRLS"
    BOYS = "BOYS"


class StaffRole(str, enum.Enum):
    STAFF = "STAFF"
    WARDEN = "WARDEN"


class Hostel(Base):
    __tablename__ = "hostels"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False, index=True)
    gender_category = Column(Enum(GenderCategory), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    hostel_fee_per_semester = Column(Numeric(10, 2), nullable=False, default=25000.00)

    staff_assignments = relationship("HostelStaffAssignment", back_populates="hostel")
    registrations = relationship("SemesterRegistration", back_populates="hostel")


class HostelStaffAssignment(Base):
    __tablename__ = "hostel_staff_assignments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    hostel_id = Column(String(36), ForeignKey("hostels.id"), nullable=False)
    staff_role = Column(Enum(StaffRole), nullable=False)

    user = relationship("User", back_populates="hostel_assignments")
    hostel = relationship("Hostel", back_populates="staff_assignments")
