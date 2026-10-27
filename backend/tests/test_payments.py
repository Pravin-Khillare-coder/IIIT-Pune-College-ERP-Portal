import io
from app.models.payment import DocumentType


def test_payment_receipt_verification_flow(client):
    # 1. Login as Student and upload receipt
    student_login = client.post(
        "/api/v1/auth/login",
        json={"email": "student.priya@iiitp.ac.in", "password": "Student@123"}
    )
    student_token = student_login.json()["access_token"]

    reg_resp = client.get(
        "/api/v1/registrations/current",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    reg_id = reg_resp.json()["id"]

    dummy_file = io.BytesIO(b"%PDF-1.4 payment receipt test content")
    dummy_file.name = "receipt.pdf"
    
    upload_resp = client.post(
        "/api/v1/documents/upload",
        data={
            "registration_id": reg_id,
            "document_type": DocumentType.REGISTRATION_RECEIPT.value
        },
        files={"file": (dummy_file.name, dummy_file, "application/pdf")},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert upload_resp.status_code == 200

    # 2. Login as Admin and query pending receipts
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@iiitp.ac.in", "password": "Admin@123"}
    )
    admin_token = admin_login.json()["access_token"]

    pending_resp = client.get(
        "/api/v1/payments/receipts/pending",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert pending_resp.status_code == 200
    receipts = pending_resp.json()
    assert len(receipts) >= 1

    receipt_id = receipts[0]["id"]

    # 3. Reject receipt without reason -> Expect 400
    reject_bad = client.post(
        f"/api/v1/payments/receipts/{receipt_id}/verify",
        json={"action": "REJECT"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert reject_bad.status_code == 400

    # 4. Verify receipt successfully -> Expect 200
    verify_resp = client.post(
        f"/api/v1/payments/receipts/{receipt_id}/verify",
        json={"action": "VERIFY", "transaction_reference": "SBI-TXN-998877"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert verify_resp.status_code == 200
    assert "VERIFIED" in verify_resp.json()["detail"]
