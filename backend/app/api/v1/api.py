from fastapi import APIRouter
from app.api.v1.endpoints import auth, registrations, documents, payments, notifications, workflow, admin, hostels

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(registrations.router, prefix="/registrations", tags=["Semester Registrations"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments & Receipts"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(workflow.router, prefix="/workflow", tags=["Workflow & Approvals"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Portal"])
api_router.include_router(hostels.router, prefix="/hostels", tags=["Hostels"])

