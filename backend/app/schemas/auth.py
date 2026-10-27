from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    expected_role: Optional[UserRole] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: str
    full_name: str
    email: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True


class StudentProfileOut(BaseModel):
    id: str
    mis_number: str
    department: str
    current_semester: int
    academic_year: str
    faculty_advisor_id: Optional[str] = None
    faculty_advisor_name: Optional[str] = None
    is_hosteller_eligible: bool

    class Config:
        from_attributes = True


class UserDetailOut(UserOut):
    student_profile: Optional[StudentProfileOut] = None
    department: Optional[str] = None
    assigned_hostels: Optional[list] = None
