import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.storage import storage_service
from app.models.user import User, UserRole
from app.models.registration import SemesterRegistration, RegistrationStatus
from app.models.payment import Document, DocumentType, FeeRecord, PaymentReceipt, FeeCategory, VerificationStatus
from app.schemas.registration import DocumentOut

router = APIRouter()

DOC_TYPE_FEE_MAP = {
    DocumentType.REGISTRATION_RECEIPT: FeeCategory.REGISTRATION,
    DocumentType.HOSTEL_RECEIPT: FeeCategory.HOSTEL,
    DocumentType.DUES_RECEIPT: FeeCategory.DUES,
}


@router.post("/upload", response_model=DocumentOut)
def upload_document(
    registration_id: str = Form(...),
    document_type: DocumentType = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload registration supporting document or payment receipt (supports re-upload/replacement)."""
    registration = db.query(SemesterRegistration).filter(SemesterRegistration.id == registration_id).first()
    if not registration:
        raise HTTPException(status_code=404, detail="Registration application not found.")

    # Authorization Check: Students can only upload to their own draft/returned registration
    if current_user.role == UserRole.STUDENT:
        if registration.student.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied. You cannot upload files for another student.")
        if registration.status not in [RegistrationStatus.DRAFT, RegistrationStatus.RETURNED_FOR_CORRECTION, RegistrationStatus.REJECTED]:
            raise HTTPException(status_code=400, detail=f"Cannot upload files when application status is '{registration.status.value}'.")

    # Save file to private storage directory
    original_filename, stored_filename, file_size = storage_service.save_file(
        file, subfolder=registration.application_number
    )
    file_path = storage_service.get_file_path(stored_filename, subfolder=registration.application_number)

    # Check if document of this type already exists for this registration
    doc = db.query(Document).filter(
        Document.registration_id == registration.id,
        Document.document_type == document_type
    ).first()

    if doc:
        # Remove old physical file from disk if path changed
        try:
            if doc.file_path != file_path and os.path.exists(doc.file_path):
                os.remove(doc.file_path)
        except Exception:
            pass
        # Update existing document metadata
        doc.original_filename = original_filename
        doc.stored_filename = stored_filename
        doc.file_path = file_path
        doc.file_size_bytes = file_size
        doc.mime_type = file.content_type or "application/octet-stream"
        doc.uploaded_at = datetime.now(timezone.utc)
    else:
        # Create new document record
        doc = Document(
            registration_id=registration.id,
            document_type=document_type,
            original_filename=original_filename,
            stored_filename=stored_filename,
            file_path=file_path,
            file_size_bytes=file_size,
            mime_type=file.content_type or "application/octet-stream"
        )
        db.add(doc)
    
    db.flush()

    # If document is a receipt, associate or update PaymentReceipt record
    if document_type in DOC_TYPE_FEE_MAP:
        fee_category = DOC_TYPE_FEE_MAP[document_type]
        fee_rec = db.query(FeeRecord).filter(
            FeeRecord.registration_id == registration.id,
            FeeRecord.fee_category == fee_category
        ).first()

        if not fee_rec:
            fee_rec = FeeRecord(
                registration_id=registration.id,
                fee_category=fee_category,
                amount_due=0.0,
                amount_paid=0.0,
                status=VerificationStatus.PENDING
            )
            db.add(fee_rec)
            db.flush()

        payment_receipt = db.query(PaymentReceipt).filter(
            PaymentReceipt.registration_id == registration.id,
            PaymentReceipt.fee_record_id == fee_rec.id
        ).first()

        if payment_receipt:
            payment_receipt.document_id = doc.id
            payment_receipt.verification_status = VerificationStatus.PENDING
            payment_receipt.rejection_reason = None
        else:
            payment_receipt = PaymentReceipt(
                registration_id=registration.id,
                fee_record_id=fee_rec.id,
                document_id=doc.id,
                verification_status=VerificationStatus.PENDING
            )
            db.add(payment_receipt)

    db.commit()
    db.refresh(doc)

    return DocumentOut(
        id=doc.id,
        document_type=doc.document_type,
        original_filename=doc.original_filename,
        file_size_bytes=doc.file_size_bytes,
        mime_type=doc.mime_type,
        uploaded_at=doc.uploaded_at
    )


@router.get("/{id}/download")
def download_document(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Secure private document download endpoint (verifies owner/reviewer authorization)."""
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Requested document not found.")

    registration = doc.registration

    # Authorization verification: Student owner or staff/warden/advisor/admin reviewer
    if current_user.role == UserRole.STUDENT:
        if registration.student.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied. You cannot download other students' private documents.")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File missing from storage disk.")

    return FileResponse(
        path=doc.file_path,
        filename=doc.original_filename,
        media_type=doc.mime_type
    )
