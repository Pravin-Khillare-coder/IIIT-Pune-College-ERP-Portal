from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.security import create_access_token, verify_password
from app.models.user import User, UserRole
from app.models.hostel import HostelStaffAssignment
from app.schemas.auth import LoginRequest, TokenResponse, UserDetailOut, StudentProfileOut

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password, validating optional role expectation."""
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact system administrator."
        )

    # If login page expected a specific role, verify role match
    if request.expected_role and user.role != request.expected_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Authorization failure: Account email is associated with role '{user.role.value}', not '{request.expected_role.value}'."
        )

    access_token = create_access_token(subject=user.id, role=user.role.value)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email
    )


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """Logout endpoint."""
    return {"detail": "Successfully logged out."}


@router.get("/me", response_model=UserDetailOut)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch profile details for the currently logged-in user."""
    student_profile_out = None
    department = None
    assigned_hostels = []

    if current_user.role == UserRole.STUDENT and current_user.student_profile:
        sp = current_user.student_profile
        advisor_name = sp.faculty_advisor.full_name if sp.faculty_advisor else None
        student_profile_out = StudentProfileOut(
            id=sp.id,
            mis_number=sp.mis_number,
            department=sp.department,
            current_semester=sp.current_semester,
            academic_year=sp.academic_year,
            faculty_advisor_id=sp.faculty_advisor_id,
            faculty_advisor_name=advisor_name,
            is_hosteller_eligible=sp.is_hosteller_eligible
        )
        department = sp.department
    elif current_user.role in [UserRole.HOSTEL_STAFF, UserRole.HOSTEL_WARDEN]:
        assignments = db.query(HostelStaffAssignment).filter(
            HostelStaffAssignment.user_id == current_user.id
        ).all()
        assigned_hostels = [
            {"hostel_id": a.hostel_id, "hostel_name": a.hostel.name, "role": a.staff_role.value}
            for a in assignments
        ]
    elif current_user.role == UserRole.FACULTY_ADVISOR and current_user.faculty_profile:
        department = current_user.faculty_profile.department

    return UserDetailOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        student_profile=student_profile_out,
        department=department,
        assigned_hostels=assigned_hostels
    )
