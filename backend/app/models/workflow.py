import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.db import Base


class WorkflowAction(str, enum.Enum):
    SUBMIT = "SUBMIT"
    APPROVE = "APPROVE"
    RETURN_DISCREPANCY = "RETURN_DISCREPANCY"
    REJECT = "REJECT"
    RESUBMIT = "RESUBMIT"


class ApprovalHistory(Base):
    __tablename__ = "approval_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    registration_id = Column(String(36), ForeignKey("semester_registrations.id"), nullable=False)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action = Column(Enum(WorkflowAction), nullable=False)
    from_stage = Column(String(50), nullable=False)
    to_stage = Column(String(50), nullable=False)
    comments = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    registration = relationship("SemesterRegistration", back_populates="approval_history")
    actor = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    target_entity = Column(String(100), nullable=False)
    target_id = Column(String(36), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    actor = relationship("User")


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
