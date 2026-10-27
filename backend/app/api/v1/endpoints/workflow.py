from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_roles
from app.models.user import User, UserRole
from app.models.registration import SemesterRegistration, RegistrationStatus
from app.models.hostel import HostelStaffAssignment
from app.models.workflow import ApprovalHistory, WorkflowAction, Notification, AuditLog
from app.schemas.workflow import ReviewRegistrationRequest, PendingRegistrationOut

router = APIRouter()


@router.get("/pending", response_model=List[PendingRegistrationOut])
def get_pending_registrations(
    current_user: User = Depends(require_roles([
        UserRole.HOSTEL_STAFF,
        UserRole.HOSTEL_WARDEN,
        UserRole.FACULTY_ADVISOR,
        UserRole.ADMIN
    ])),
    db: Session = Depends(get_db)
):
    """Fetch pending registrations matching the reviewer role."""
    query = db.query(SemesterRegistration)

    if current_user.role == UserRole.HOSTEL_STAFF:
        assignments = db.query(HostelStaffAssignment).filter(
            HostelStaffAssignment.user_id == current_user.id
        ).all()
        hostel_ids = [a.hostel_id for a in assignments]
        if hostel_ids:
            query = query.filter(
                SemesterRegistration.status == RegistrationStatus.PENDING_HOSTEL_STAFF,
                SemesterRegistration.hostel_id.in_(hostel_ids)
            )
        else:
            query = query.filter(SemesterRegistration.status == RegistrationStatus.PENDING_HOSTEL_STAFF)

    elif current_user.role == UserRole.HOSTEL_WARDEN:
        assignments = db.query(HostelStaffAssignment).filter(
            HostelStaffAssignment.user_id == current_user.id
        ).all()
        hostel_ids = [a.hostel_id for a in assignments]
        if hostel_ids:
            query = query.filter(
                SemesterRegistration.status == RegistrationStatus.PENDING_WARDEN,
                SemesterRegistration.hostel_id.in_(hostel_ids)
            )
        else:
            query = query.filter(SemesterRegistration.status == RegistrationStatus.PENDING_WARDEN)

    elif current_user.role == UserRole.FACULTY_ADVISOR:
        # Match advisees or department advisees awaiting faculty approval
        query = query.filter(SemesterRegistration.status == RegistrationStatus.PENDING_FACULTY)

    elif current_user.role == UserRole.ADMIN:
        query = query.filter(
            SemesterRegistration.status.in_([
                RegistrationStatus.PENDING_HOSTEL_STAFF,
                RegistrationStatus.PENDING_WARDEN,
                RegistrationStatus.PENDING_FACULTY,
                RegistrationStatus.RETURNED_FOR_CORRECTION
            ])
        )

    registrations = query.order_by(SemesterRegistration.submitted_at.desc()).all()
    results = []

    for reg in registrations:
        student_prof = reg.student
        student_user = student_prof.user if student_prof else None
        hostel_name = reg.hostel.name if reg.hostel else None

        # Extract latest discrepancy comment if any
        latest_reason = None
        for h in sorted(reg.approval_history, key=lambda x: x.timestamp, reverse=True):
            if h.action in [WorkflowAction.RETURN_DISCREPANCY, WorkflowAction.REJECT] or h.to_stage in [
                RegistrationStatus.RETURNED_FOR_CORRECTION.value,
                RegistrationStatus.REJECTED.value
            ]:
                latest_reason = h.comments
                break

        results.append(PendingRegistrationOut(
            id=reg.id,
            application_number=reg.application_number,
            student_name=student_user.full_name if student_user else "N/A",
            mis_number=student_prof.mis_number if student_prof else "N/A",
            department=student_prof.department if student_prof else "N/A",
            current_semester=student_prof.current_semester if student_prof else 1,
            is_hosteller=reg.is_hosteller,
            hostel_name=hostel_name,
            status=reg.status.value,
            submitted_at=reg.submitted_at,
            latest_rejection_reason=latest_reason
        ))

    return results


@router.post("/review")
def review_registration(
    payload: ReviewRegistrationRequest,
    current_user: User = Depends(require_roles([
        UserRole.HOSTEL_STAFF,
        UserRole.HOSTEL_WARDEN,
        UserRole.FACULTY_ADVISOR,
        UserRole.ADMIN
    ])),
    db: Session = Depends(get_db)
):
    """Review, approve, or raise a discrepancy/reject a semester registration form."""
    registration = db.query(SemesterRegistration).filter(
        SemesterRegistration.id == payload.registration_id
    ).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration application not found.")

    student_user = registration.student.user if registration.student else None
    if not student_user:
        raise HTTPException(status_code=400, detail="Associated student account not found.")

    action_upper = payload.action.upper()
    previous_stage = registration.status.value

    if action_upper in ["RETURN_DISCREPANCY", "REJECT"]:
        if not payload.comments or not payload.comments.strip():
            raise HTTPException(
                status_code=400,
                detail="A clear discrepancy/rejection reason is mandatory so the student knows what to fix."
            )

        reason = payload.comments.strip()
        next_stage = RegistrationStatus.RETURNED_FOR_CORRECTION

        registration.status = next_stage

        # Record in ApprovalHistory
        history_entry = ApprovalHistory(
            registration_id=registration.id,
            actor_id=current_user.id,
            actor_role=current_user.role.value,
            action=WorkflowAction.RETURN_DISCREPANCY if action_upper == "RETURN_DISCREPANCY" else WorkflowAction.REJECT,
            from_stage=previous_stage,
            to_stage=next_stage.value,
            comments=reason
        )
        db.add(history_entry)

        # Notify student with rejection / discrepancy reason
        reviewer_title = current_user.role.value.replace("_", " ").title()
        notification = Notification(
            user_id=student_user.id,
            title="Registration Discrepancy Raised — Action Required",
            message=f"Your semester registration form ({registration.application_number}) has been returned with a discrepancy by {reviewer_title}. Reason: {reason}. Please clear this discrepancy and resubmit."
        )
        db.add(notification)

        # Audit log
        db.add(AuditLog(
            actor_id=current_user.id,
            action="RETURN_REGISTRATION_DISCREPANCY",
            target_entity="semester_registrations",
            target_id=registration.id,
            details={
                "application_number": registration.application_number,
                "reason": reason,
                "reviewer_role": current_user.role.value
            }
        ))

        db.commit()
        db.refresh(registration)

        return {
            "detail": f"Registration returned with discrepancy to student. Notification delivered.",
            "status": registration.status.value,
            "rejection_reason": reason
        }

    elif action_upper == "APPROVE":
        if registration.status == RegistrationStatus.PENDING_HOSTEL_STAFF:
            next_stage = RegistrationStatus.PENDING_WARDEN
            notif_msg = f"Hostel Staff verified your room and fee details for {registration.application_number}. Forwarded to Warden for clearance."
        elif registration.status == RegistrationStatus.PENDING_WARDEN:
            next_stage = RegistrationStatus.PENDING_FACULTY
            notif_msg = f"Hostel Warden approved your clearance for {registration.application_number}. Forwarded to your Faculty Advisor for final review."
        elif registration.status == RegistrationStatus.PENDING_FACULTY:
            next_stage = RegistrationStatus.APPROVED
            registration.final_approved_at = datetime.now(timezone.utc)
            notif_msg = f"Congratulations! Your semester registration ({registration.application_number}) has received final approval from your Faculty Advisor."
        elif current_user.role == UserRole.ADMIN:
            next_stage = RegistrationStatus.APPROVED
            registration.final_approved_at = datetime.now(timezone.utc)
            notif_msg = f"Your semester registration ({registration.application_number}) was approved by Administrator."
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot approve application currently in status '{registration.status.value}' with role '{current_user.role.value}'."
            )

        registration.status = next_stage

        history_entry = ApprovalHistory(
            registration_id=registration.id,
            actor_id=current_user.id,
            actor_role=current_user.role.value,
            action=WorkflowAction.APPROVE,
            from_stage=previous_stage,
            to_stage=next_stage.value,
            comments=payload.comments or "Verified and approved at this workflow stage."
        )
        db.add(history_entry)

        notification = Notification(
            user_id=student_user.id,
            title="Registration Approval Update",
            message=notif_msg
        )
        db.add(notification)

        db.add(AuditLog(
            actor_id=current_user.id,
            action="APPROVE_REGISTRATION_STAGE",
            target_entity="semester_registrations",
            target_id=registration.id,
            details={
                "application_number": registration.application_number,
                "from_stage": previous_stage,
                "to_stage": next_stage.value
            }
        ))

        db.commit()
        db.refresh(registration)

        return {
            "detail": f"Registration successfully advanced to {registration.status.value}.",
            "status": registration.status.value
        }
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported action '{payload.action}'. Supported actions: 'APPROVE', 'RETURN_DISCREPANCY', 'REJECT'."
        )
