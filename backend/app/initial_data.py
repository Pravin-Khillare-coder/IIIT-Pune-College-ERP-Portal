import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.core.db import engine as default_engine, SessionLocal as DefaultSessionLocal, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.profile import StudentProfile, FacultyProfile
from app.models.hostel import Hostel, HostelStaffAssignment, GenderCategory, StaffRole
from app.models.semester import AcademicSemester
from app.models.payment import StudentDues
from app.models.workflow import SystemSettings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("erp.initial_data")


def seed_db(db_session: Optional[Session] = None, bind_engine=default_engine):
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=bind_engine)
    
    close_session = False
    if db_session is None:
        db = DefaultSessionLocal()
        close_session = True
    else:
        db = db_session

    try:
        # 1. System Settings
        settings_data = [
            ("SBI_COLLECT_URL", "https://www.onlinesbi.sbi/sbicollect/", "Official SBI Collect Fee Payment Portal URL"),
            ("ANTI_RAGGING_FORM_URL", "https://www.antiragging.in/", "Official Anti-Ragging Affidavit Undertaking Portal URL"),
            ("REGISTRATION_FEE_DEFAULT", "45000.00", "Default semester registration fee in INR"),
            ("HOSTEL_FEE_DEFAULT", "25000.00", "Default hostel fee per semester in INR"),
        ]
        for key, value, desc in settings_data:
            existing = db.query(SystemSettings).filter(SystemSettings.key == key).first()
            if not existing:
                db.add(SystemSettings(key=key, value=value, description=desc))
        db.commit()

        # 2. Hostels
        hostels_list = [
            ("Indrayani — Girls Hostel", GenderCategory.GIRLS, 25000.00),
            ("Sindhu — Girls Hostel", GenderCategory.GIRLS, 25000.00),
            ("Brahmaputra — Boys Hostel", GenderCategory.BOYS, 25000.00),
            ("Krishna — Boys Hostel", GenderCategory.BOYS, 25000.00),
            ("Godavari — Boys Hostel", GenderCategory.BOYS, 25000.00),
        ]
        hostel_map = {}
        for name, gender, fee in hostels_list:
            hostel = db.query(Hostel).filter(Hostel.name == name).first()
            if not hostel:
                hostel = Hostel(name=name, gender_category=gender, hostel_fee_per_semester=fee, is_active=True)
                db.add(hostel)
                db.flush()
            hostel_map[name] = hostel
        db.commit()

        # 3. Active Academic Semester
        active_semester = db.query(AcademicSemester).filter(
            AcademicSemester.title == "Monsoon 2026"
        ).first()
        if not active_semester:
            active_semester = AcademicSemester(
                academic_year="2026-2027",
                semester_number=5,
                title="Monsoon 2026",
                is_active=True,
                default_registration_fee=45000.00
            )
            db.add(active_semester)
            db.flush()
        db.commit()

        # Helper for creating users
        def get_or_create_user(email: str, name: str, password: str, role: UserRole) -> User:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(
                    email=email,
                    full_name=name,
                    password_hash=get_password_hash(password),
                    role=role,
                    is_active=True
                )
                db.add(u)
                db.flush()
            return u

        # 4. Admin User
        admin_user = get_or_create_user("admin@iiitp.ac.in", "System Administrator", "Admin@123", UserRole.ADMIN)

        # 5. Faculty Advisors
        advisor_cs = get_or_create_user("advisor.cs@iiitp.ac.in", "Dr. Rajesh Kumar (CS Advisor)", "Advisor@123", UserRole.FACULTY_ADVISOR)
        if not db.query(FacultyProfile).filter(FacultyProfile.user_id == advisor_cs.id).first():
            db.add(FacultyProfile(user_id=advisor_cs.id, department="Computer Science & Engineering", designation="Associate Professor"))

        advisor_ece = get_or_create_user("advisor.ece@iiitp.ac.in", "Dr. Ananya Deshmukh (ECE Advisor)", "Advisor@123", UserRole.FACULTY_ADVISOR)
        if not db.query(FacultyProfile).filter(FacultyProfile.user_id == advisor_ece.id).first():
            db.add(FacultyProfile(user_id=advisor_ece.id, department="Electronics & Communication Engineering", designation="Professor"))

        db.commit()

        # 6. Hostel Staff & Wardens
        staff_indrayani = get_or_create_user("staff.indrayani@iiitp.ac.in", "Sunita Patil (Indrayani Staff)", "Staff@123", UserRole.HOSTEL_STAFF)
        warden_indrayani = get_or_create_user("warden.indrayani@iiitp.ac.in", "Dr. Meena Joshi (Indrayani Warden)", "Warden@123", UserRole.HOSTEL_WARDEN)

        staff_brahmaputra = get_or_create_user("staff.brahmaputra@iiitp.ac.in", "Ramesh Shinde (Brahmaputra Staff)", "Staff@123", UserRole.HOSTEL_STAFF)
        warden_brahmaputra = get_or_create_user("warden.brahmaputra@iiitp.ac.in", "Dr. Suresh More (Brahmaputra Warden)", "Warden@123", UserRole.HOSTEL_WARDEN)

        # Assignments
        indrayani_hostel = hostel_map["Indrayani — Girls Hostel"]
        brahmaputra_hostel = hostel_map["Brahmaputra — Boys Hostel"]

        if not db.query(HostelStaffAssignment).filter(HostelStaffAssignment.user_id == staff_indrayani.id).first():
            db.add(HostelStaffAssignment(user_id=staff_indrayani.id, hostel_id=indrayani_hostel.id, staff_role=StaffRole.STAFF))

        if not db.query(HostelStaffAssignment).filter(HostelStaffAssignment.user_id == warden_indrayani.id).first():
            db.add(HostelStaffAssignment(user_id=warden_indrayani.id, hostel_id=indrayani_hostel.id, staff_role=StaffRole.WARDEN))

        if not db.query(HostelStaffAssignment).filter(HostelStaffAssignment.user_id == staff_brahmaputra.id).first():
            db.add(HostelStaffAssignment(user_id=staff_brahmaputra.id, hostel_id=brahmaputra_hostel.id, staff_role=StaffRole.STAFF))

        if not db.query(HostelStaffAssignment).filter(HostelStaffAssignment.user_id == warden_brahmaputra.id).first():
            db.add(HostelStaffAssignment(user_id=warden_brahmaputra.id, hostel_id=brahmaputra_hostel.id, staff_role=StaffRole.WARDEN))

        db.commit()

        # 7. Demo Students
        # Student 1: Rahul Sharma (Hosteller)
        student_rahul_user = get_or_create_user("student.rahul@iiitp.ac.in", "Rahul Sharma", "Student@123", UserRole.STUDENT)
        student_rahul_profile = db.query(StudentProfile).filter(StudentProfile.user_id == student_rahul_user.id).first()
        if not student_rahul_profile:
            student_rahul_profile = StudentProfile(
                user_id=student_rahul_user.id,
                mis_number="112203045",
                department="Computer Science & Engineering",
                current_semester=5,
                academic_year="2026-2027",
                faculty_advisor_id=advisor_cs.id,
                is_hosteller_eligible=True
            )
            db.add(student_rahul_profile)
            db.flush()

        # Student 2: Priya Verma (Non-Hosteller)
        student_priya_user = get_or_create_user("student.priya@iiitp.ac.in", "Priya Verma", "Student@123", UserRole.STUDENT)
        student_priya_profile = db.query(StudentProfile).filter(StudentProfile.user_id == student_priya_user.id).first()
        if not student_priya_profile:
            student_priya_profile = StudentProfile(
                user_id=student_priya_user.id,
                mis_number="112203088",
                department="Electronics & Communication Engineering",
                current_semester=5,
                academic_year="2026-2027",
                faculty_advisor_id=advisor_ece.id,
                is_hosteller_eligible=True
            )
            db.add(student_priya_profile)
            db.flush()

        db.commit()

        # 8. Outstanding Dues Seed for Rahul
        existing_due = db.query(StudentDues).filter(StudentDues.student_id == student_rahul_profile.id).first()
        if not existing_due:
            db.add(StudentDues(
                student_id=student_rahul_profile.id,
                semester_id=active_semester.id,
                fee_category="Library Fine",
                amount_due=500.00,
                is_cleared=False,
                remarks="Overdue book return fine (Central Library)"
            ))

        db.commit()
        logger.info("Database successfully seeded with demo accounts & master records!")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
        raise e
    finally:
        if close_session:
            db.close()


if __name__ == "__main__":
    seed_db()
