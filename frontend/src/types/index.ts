export type UserRole = 'STUDENT' | 'HOSTEL_STAFF' | 'HOSTEL_WARDEN' | 'FACULTY_ADVISOR' | 'ADMIN';

export type RegistrationStatus =
  | 'NOT_STARTED'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_HOSTEL_STAFF'
  | 'PENDING_WARDEN'
  | 'PENDING_FACULTY'
  | 'RETURNED_FOR_CORRECTION'
  | 'APPROVED'
  | 'REJECTED';

export type FeeCategory = 'REGISTRATION' | 'HOSTEL' | 'DUES';
export type VerificationStatus = 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type DocumentType = 'REGISTRATION_RECEIPT' | 'HOSTEL_RECEIPT' | 'DUES_RECEIPT' | 'ANTI_RAGGING' | 'ABC_CARD';

export interface StudentProfile {
  id: string;
  mis_number: string;
  department: string;
  current_semester: number;
  academic_year: string;
  faculty_advisor_id?: string;
  faculty_advisor_name?: string;
  is_hosteller_eligible: boolean;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  student_profile?: StudentProfile;
  department?: string;
  assigned_hostels?: Array<{ hostel_id: string; hostel_name: string; role: string }>;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  user_id: string;
  full_name: string;
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  expected_role?: UserRole;
}
