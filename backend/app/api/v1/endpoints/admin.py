from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, require_roles
from app.models.user import User, UserRole
from app.models.profile import StudentProfile
from app.models.registration import SemesterRegistration, RegistrationStatus
from app.models.semester import AcademicSemester
from app.models.payment import StudentDues

router = APIRouter()


@router.get("/dashboard-stats")
def get_admin_dashboard_stats(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Retrieve aggregate statistics for the administrative dashboard."""
    active_sem = db.query(AcademicSemester).filter(AcademicSemester.is_active == True).first()
    active_sem_title = active_sem.title if active_sem else "Current Semester"

    total_students = db.query(StudentProfile).count()
    total_users = db.query(User).count()

    pending_staff = db.query(SemesterRegistration).filter(
        SemesterRegistration.status == RegistrationStatus.PENDING_HOSTEL_STAFF
    ).count()

    pending_warden = db.query(SemesterRegistration).filter(
        SemesterRegistration.status == RegistrationStatus.PENDING_WARDEN
    ).count()

    pending_advisor = db.query(SemesterRegistration).filter(
        SemesterRegistration.status == RegistrationStatus.PENDING_FACULTY
    ).count()

    returned_for_corr = db.query(SemesterRegistration).filter(
        SemesterRegistration.status == RegistrationStatus.RETURNED_FOR_CORRECTION
    ).count()

    approved_count = db.query(SemesterRegistration).filter(
        SemesterRegistration.status == RegistrationStatus.APPROVED
    ).count()

    # Sum pending dues
    dues_sum = db.query(func.sum(StudentDues.amount_due)).filter(
        StudentDues.is_cleared == False
    ).scalar() or 0.0

    return {
        "total_students": total_students,
        "total_users": total_users,
        "pending_staff_reviews": pending_staff,
        "pending_warden_reviews": pending_warden,
        "pending_advisor_reviews": pending_advisor,
        "returned_for_correction": returned_for_corr,
        "approved_registrations": approved_count,
        "total_dues_pending": float(dues_sum),
        "active_semester": active_sem_title
    }


@router.get("/registrations")
def get_all_registrations_admin(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Retrieve all semester registration applications for administrative oversight."""
    registrations = db.query(SemesterRegistration).order_by(
        SemesterRegistration.created_at.desc()
    ).all()

    results = []
    for reg in registrations:
        student_prof = reg.student
        student_user = student_prof.user if student_prof else None

        results.append({
            "id": reg.id,
            "application_number": reg.application_number,
            "status": reg.status.value,
            "created_at": reg.created_at.isoformat() if reg.created_at else None,
            "submitted_at": reg.submitted_at.isoformat() if reg.submitted_at else None,
            "student": {
                "user": {
                    "full_name": student_user.full_name if student_user else "N/A"
                },
                "mis_number": student_prof.mis_number if student_prof else "N/A",
                "department": student_prof.department if student_prof else "N/A",
                "current_semester": student_prof.current_semester if student_prof else 1
            },
            "hostel_name": reg.hostel.name if reg.hostel else None,
            "is_hosteller": reg.is_hosteller
        })

    return results
