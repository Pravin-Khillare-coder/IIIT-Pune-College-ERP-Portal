import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_roles
from app.models.user import User, UserRole
from app.models.profile import StudentProfile
from app.models.semester import AcademicSemester
from app.models.hostel import Hostel
from app.models.registration import SemesterRegistration, RegistrationDetails, RegistrationStatus
from app.models.payment import FeeRecord, PaymentReceipt, Document, StudentDues, FeeCategory, VerificationStatus, DocumentType
from app.models.workflow import ApprovalHistory, WorkflowAction, Notification
from app.schemas.registration import (
    DraftRegistrationRequest,
    SubmitRegistrationRequest,
    RegistrationDetailOut,
    DocumentOut,
    FeeRecordOut,
    PaymentReceiptOut,
    ApprovalHistoryOut
)

router = APIRouter()


def _format_registration_response(reg: SemesterRegistration, db: Session) -> RegistrationDetailOut:
    student_profile = reg.student
    student_user = student_profile.user
    advisor_name = student_profile.faculty_advisor.full_name if student_profile.faculty_advisor else None
    hostel_name = reg.hostel.name if reg.hostel else None

    details = reg.details
    contact_number = details.contact_number if details else None
    emergency_contact = details.emergency_contact if details else None
    abc_id = details.abc_id if details else None

    doc_outs = [
        DocumentOut(
            id=d.id,
            document_type=d.document_type,
            original_filename=d.original_filename,
            file_size_bytes=d.file_size_bytes,
            mime_type=d.mime_type,
            uploaded_at=d.uploaded_at
        ) for d in reg.documents
    ]

    fee_outs = [
        FeeRecordOut(
            id=f.id,
            fee_category=f.fee_category,
            amount_due=float(f.amount_due),
            amount_paid=float(f.amount_paid),
            status=f.status
        ) for f in reg.fee_records
    ]

    receipt_outs = [
        PaymentReceiptOut(
            id=pr.id,
            fee_record_id=pr.fee_record_id,
            document_id=pr.document_id,
            transaction_reference=pr.transaction_reference,
            payment_date=pr.payment_date,
            verification_status=pr.verification_status,
            rejection_reason=pr.rejection_reason
        ) for pr in reg.payment_receipts
    ]

    history_outs = [
        ApprovalHistoryOut(
            id=ah.id,
            actor_role=ah.actor_role,
            action=ah.action.value,
            from_stage=ah.from_stage,
            to_stage=ah.to_stage,
            comments=ah.comments,
            timestamp=ah.timestamp
        ) for ah in reg.approval_history
    ]

    latest_rejection_entry = None
    for h in sorted(reg.approval_history, key=lambda x: x.timestamp, reverse=True):
        if h.action in [WorkflowAction.RETURN_DISCREPANCY, WorkflowAction.REJECT] or h.to_stage in [
            RegistrationStatus.RETURNED_FOR_CORRECTION.value,
            RegistrationStatus.REJECTED.value
        ]:
            latest_rejection_entry = h
            break

    latest_rejection_reason = latest_rejection_entry.comments if latest_rejection_entry else None
    latest_rejection_role = latest_rejection_entry.actor_role if latest_rejection_entry else None

    return RegistrationDetailOut(
        id=reg.id,
        application_number=reg.application_number,
        student_id=student_profile.id,
        student_name=student_user.full_name,
        mis_number=student_profile.mis_number,
        department=student_profile.department,
        current_semester=student_profile.current_semester,
        academic_year=student_profile.academic_year,
        faculty_advisor_name=advisor_name,
        semester_title=reg.semester.title,
        hostel_id=reg.hostel_id,
        hostel_name=hostel_name,
        is_hosteller=reg.is_hosteller,
        status=reg.status,
        submitted_at=reg.submitted_at,
        final_approved_at=reg.final_approved_at,
        contact_number=contact_number,
        emergency_contact=emergency_contact,
        abc_id=abc_id,
        documents=doc_outs,
        fee_records=fee_outs,
        receipts=receipt_outs,
        approval_history=history_outs,
        latest_rejection_reason=latest_rejection_reason,
        latest_rejection_role=latest_rejection_role
    )


@router.get("/current", response_model=RegistrationDetailOut)
def get_current_registration(
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db)
):
    """Fetch current active semester registration or draft for student."""
    student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not student_profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    active_semester = db.query(AcademicSemester).filter(AcademicSemester.is_active == True).first()
    if not active_semester:
        raise HTTPException(status_code=404, detail="No active academic semester configured.")

    registration = db.query(SemesterRegistration).filter(
        SemesterRegistration.student_id == student_profile.id,
        SemesterRegistration.semester_id == active_semester.id
    ).first()

    if not registration:
        # Create initial draft registration
        app_num = f"IIITP-2026-REG-{uuid.uuid4().hex[:6].upper()}"
        registration = SemesterRegistration(
            application_number=app_num,
            student_id=student_profile.id,
            semester_id=active_semester.id,
            is_hosteller=False,
            status=RegistrationStatus.DRAFT
        )
        db.add(registration)
        db.flush()

        details = RegistrationDetails(registration_id=registration.id)
        db.add(details)

        # Initialize registration fee record
        fee_reg = FeeRecord(
            registration_id=registration.id,
            fee_category=FeeCategory.REGISTRATION,
            amount_due=active_semester.default_registration_fee,
            amount_paid=0.0,
            status=VerificationStatus.PENDING
        )
        db.add(fee_reg)

        db.commit()
        db.refresh(registration)

    return _format_registration_response(registration, db)


@router.post("/draft", response_model=RegistrationDetailOut)
def save_registration_draft(
    payload: DraftRegistrationRequest,
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db)
):
    """Save or update multi-step registration draft."""
    student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    active_semester = db.query(AcademicSemester).filter(AcademicSemester.is_active == True).first()

    registration = db.query(SemesterRegistration).filter(
        SemesterRegistration.student_id == student_profile.id,
        SemesterRegistration.semester_id == active_semester.id
    ).first()

    if not registration:
        app_num = f"IIITP-2026-REG-{uuid.uuid4().hex[:6].upper()}"
        registration = SemesterRegistration(
            application_number=app_num,
            student_id=student_profile.id,
            semester_id=active_semester.id,
            status=RegistrationStatus.DRAFT
        )
        db.add(registration)
        db.flush()

    if registration.status not in [RegistrationStatus.DRAFT, RegistrationStatus.RETURNED_FOR_CORRECTION, RegistrationStatus.REJECTED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot edit registration in state '{registration.status.value}' after submission."
        )

    registration.is_hosteller = payload.is_hosteller
    if payload.is_hosteller:
        if payload.hostel_id:
            hostel = db.query(Hostel).filter(Hostel.id == payload.hostel_id).first()
            if not hostel or not hostel.is_active:
                raise HTTPException(status_code=400, detail="Invalid or inactive hostel selected.")
            registration.hostel_id = hostel.id
            
            # Ensure hostel fee record exists
            hostel_fee_rec = db.query(FeeRecord).filter(
                FeeRecord.registration_id == registration.id,
                FeeRecord.fee_category == FeeCategory.HOSTEL
            ).first()
            if not hostel_fee_rec:
                db.add(FeeRecord(
                    registration_id=registration.id,
                    fee_category=FeeCategory.HOSTEL,
                    amount_due=hostel.hostel_fee_per_semester,
                    amount_paid=0.0,
                    status=VerificationStatus.PENDING
                ))
    else:
        registration.hostel_id = None
        # Remove hostel fee record if user switched to non-hosteller
        db.query(FeeRecord).filter(
            FeeRecord.registration_id == registration.id,
            FeeRecord.fee_category == FeeCategory.HOSTEL
        ).delete()

    details = db.query(RegistrationDetails).filter(RegistrationDetails.registration_id == registration.id).first()
    if not details:
        details = RegistrationDetails(registration_id=registration.id)
        db.add(details)

    details.contact_number = payload.contact_number
    details.emergency_contact = payload.emergency_contact
    details.abc_id = payload.abc_id

    db.commit()
    db.refresh(registration)
    return _format_registration_response(registration, db)


@router.post("/submit", response_model=RegistrationDetailOut)
def submit_registration(
    payload: SubmitRegistrationRequest,
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db)
):
    """Final backend validation and workflow submission for student registration."""
    student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    active_semester = db.query(AcademicSemester).filter(AcademicSemester.is_active == True).first()

    registration = db.query(SemesterRegistration).filter(
        SemesterRegistration.student_id == student_profile.id,
        SemesterRegistration.semester_id == active_semester.id
    ).first()

    if not registration:
        raise HTTPException(status_code=404, detail="No registration draft found.")

    if registration.status not in [RegistrationStatus.DRAFT, RegistrationStatus.RETURNED_FOR_CORRECTION, RegistrationStatus.REJECTED]:
        raise HTTPException(status_code=400, detail="Registration has already been submitted.")

    # 1. Validate required documents
    uploaded_doc_types = {d.document_type for d in registration.documents}

    if DocumentType.REGISTRATION_RECEIPT not in uploaded_doc_types:
        raise HTTPException(status_code=400, detail="Registration fee payment receipt upload is mandatory.")

    if DocumentType.ANTI_RAGGING not in uploaded_doc_types:
        raise HTTPException(status_code=400, detail="Anti-ragging form / undertaking upload is mandatory.")

    if DocumentType.ABC_CARD not in uploaded_doc_types:
        raise HTTPException(status_code=400, detail="DigiLocker ABC ID card document upload is mandatory.")

    # 2. Check Hosteller specific validations
    if payload.is_hosteller:
        if not payload.hostel_id:
            raise HTTPException(status_code=400, detail="Hostel selection is required for hosteller students.")
        if DocumentType.HOSTEL_RECEIPT not in uploaded_doc_types:
            raise HTTPException(status_code=400, detail="Hostel fee payment receipt upload is mandatory for hostellers.")
        registration.hostel_id = payload.hostel_id
        registration.is_hosteller = True
    else:
        registration.is_hosteller = False
        registration.hostel_id = None

    # 3. Check Outstanding Dues validation
    dues = db.query(StudentDues).filter(
        StudentDues.student_id == student_profile.id,
        StudentDues.is_cleared == False
    ).all()
    if dues and DocumentType.DUES_RECEIPT not in uploaded_doc_types:
        raise HTTPException(
            status_code=400,
            detail="Student has outstanding dues. Dues payment receipt upload is mandatory."
        )

    # Update Registration Details
    details = db.query(RegistrationDetails).filter(RegistrationDetails.registration_id == registration.id).first()
    if not details:
        details = RegistrationDetails(registration_id=registration.id)
        db.add(details)
    details.contact_number = payload.contact_number
    details.emergency_contact = payload.emergency_contact
    details.abc_id = payload.abc_id

    # Route initial workflow stage based on Hosteller vs Non-Hosteller policy
    previous_stage = registration.status.value
    if payload.is_hosteller:
        next_stage = RegistrationStatus.PENDING_HOSTEL_STAFF
    else:
        next_stage = RegistrationStatus.PENDING_FACULTY

    registration.status = next_stage
    registration.submitted_at = datetime.now(timezone.utc)

    # Log Approval History Entry
    is_resubmission = previous_stage in [RegistrationStatus.RETURNED_FOR_CORRECTION.value, RegistrationStatus.REJECTED.value]
    action_type = WorkflowAction.RESUBMIT if is_resubmission else WorkflowAction.SUBMIT
    submission_comment = (
        payload.resolution_comments.strip()
        if payload.resolution_comments and payload.resolution_comments.strip()
        else ("Resubmitted registration with cleared discrepancies." if is_resubmission else "Submitted registration application with mandatory verified document uploads.")
    )

    history_entry = ApprovalHistory(
        registration_id=registration.id,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        action=action_type,
        from_stage=previous_stage,
        to_stage=next_stage.value,
        comments=submission_comment
    )
    db.add(history_entry)

    if is_resubmission:
        db.add(Notification(
            user_id=current_user.id,
            title="Registration Resubmitted",
            message=f"Your registration application ({registration.application_number}) has been resubmitted to clear previous discrepancies and is currently awaiting verification."
        ))

    db.commit()
    db.refresh(registration)
    return _format_registration_response(registration, db)


@router.get("/history", response_model=List[RegistrationDetailOut])
def get_registration_history(
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db)
):
    """Retrieve previous semester registration records for student."""
    student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    registrations = db.query(SemesterRegistration).filter(
        SemesterRegistration.student_id == student_profile.id
    ).order_by(SemesterRegistration.created_at.desc()).all()

    return [_format_registration_response(r, db) for r in registrations]


@router.get("/{id}", response_model=RegistrationDetailOut)
def get_registration_by_id(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch complete registration details by ID (with authorization check)."""
    registration = db.query(SemesterRegistration).filter(SemesterRegistration.id == id).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration application not found.")

    # Authorization Check: Students can only view their own registration
    if current_user.role == UserRole.STUDENT:
        if registration.student.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied. You cannot view another student's registration.")

    return _format_registration_response(registration, db)
