from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_roles
from app.models.user import User, UserRole
from app.models.profile import StudentProfile
from app.models.registration import SemesterRegistration
from app.models.payment import PaymentReceipt, FeeRecord, Document, VerificationStatus, FeeCategory, StudentDues
from app.models.workflow import Notification, AuditLog
from app.schemas.payment import VerifyReceiptRequest, PendingReceiptOut

router = APIRouter()


@router.get("/receipts/pending", response_model=List[PendingReceiptOut])
def get_pending_receipts(
    status_filter: Optional[VerificationStatus] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Retrieve submitted payment receipts for administrative/financial verification."""
    query = db.query(PaymentReceipt)
    if status_filter:
        query = query.filter(PaymentReceipt.verification_status == status_filter)

    receipts = query.order_by(PaymentReceipt.id.desc()).all()
    results = []

    for r in receipts:
        reg = r.registration
        student_prof = reg.student
        student_user = student_prof.user
        fee_rec = r.fee_record
        doc = r.document

        results.append(PendingReceiptOut(
            id=r.id,
            registration_id=reg.id,
            application_number=reg.application_number,
            student_name=student_user.full_name,
            mis_number=student_prof.mis_number,
            fee_category=fee_rec.fee_category,
            amount_due=float(fee_rec.amount_due),
            document_id=doc.id,
            document_filename=doc.original_filename,
            transaction_reference=r.transaction_reference,
            verification_status=r.verification_status,
            rejection_reason=r.rejection_reason,
            uploaded_at=doc.uploaded_at
        ))

    return results


@router.post("/receipts/{id}/verify")
def verify_or_reject_receipt(
    id: str,
    payload: VerifyReceiptRequest,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Verify or reject a student payment receipt."""
    receipt = db.query(PaymentReceipt).filter(PaymentReceipt.id == id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Payment receipt record not found.")

    fee_record = receipt.fee_record
    registration = receipt.registration
    student_user = registration.student.user

    action = payload.action.upper()
    if action == "VERIFY":
        receipt.verification_status = VerificationStatus.VERIFIED
        receipt.verified_by = current_user.id
        receipt.verified_at = datetime.now(timezone.utc)
        receipt.rejection_reason = None
        if payload.transaction_reference:
            receipt.transaction_reference = payload.transaction_reference

        fee_record.status = VerificationStatus.VERIFIED
        fee_record.amount_paid = fee_record.amount_due

        # Send notification to student
        db.add(Notification(
            user_id=student_user.id,
            title="Payment Receipt Verified",
            message=f"Your {fee_record.fee_category.value.replace('_', ' ')} receipt for registration {registration.application_number} has been verified."
        ))

        # Log audit entry
        db.add(AuditLog(
            actor_id=current_user.id,
            action="VERIFY_PAYMENT_RECEIPT",
            target_entity="payment_receipts",
            target_id=receipt.id,
            details={"application_number": registration.application_number, "fee_category": fee_record.fee_category.value}
        ))

    elif action == "REJECT":
        if not payload.rejection_reason:
            raise HTTPException(status_code=400, detail="Rejection reason is mandatory when rejecting a payment receipt.")

        receipt.verification_status = VerificationStatus.REJECTED
        receipt.verified_by = current_user.id
        receipt.verified_at = datetime.now(timezone.utc)
        receipt.rejection_reason = payload.rejection_reason

        fee_record.status = VerificationStatus.REJECTED

        # Send notification to student
        db.add(Notification(
            user_id=student_user.id,
            title="Payment Receipt Rejected",
            message=f"Your {fee_record.fee_category.value.replace('_', ' ')} receipt for registration {registration.application_number} was rejected. Reason: {payload.rejection_reason}"
        ))

        db.add(AuditLog(
            actor_id=current_user.id,
            action="REJECT_PAYMENT_RECEIPT",
            target_entity="payment_receipts",
            target_id=receipt.id,
            details={"application_number": registration.application_number, "reason": payload.rejection_reason}
        ))
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'VERIFY' or 'REJECT'.")

    db.commit()
    return {"detail": f"Receipt status successfully updated to {receipt.verification_status.value}."}


@router.get("/dues")
def get_student_dues(
    current_user: User = Depends(require_roles([UserRole.STUDENT])),
    db: Session = Depends(get_db)
):
    """Fetch uncleared financial dues records for logged-in student."""
    student_profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    dues = db.query(StudentDues).filter(
        StudentDues.student_id == student_profile.id,
        StudentDues.is_cleared == False
    ).all()

    return [
        {
            "id": d.id,
            "fee_category": d.fee_category,
            "amount_due": float(d.amount_due),
            "remarks": d.remarks,
            "is_cleared": d.is_cleared
        }
        for d in dues
    ]
