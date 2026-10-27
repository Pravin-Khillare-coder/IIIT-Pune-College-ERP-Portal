import io
from app.models.payment import DocumentType
from app.models.registration import RegistrationStatus


def test_rejection_notification_and_discrepancy_clear_flow(client):
    # 1. Login as Student (Rahul)
    student_login = client.post(
        "/api/v1/auth/login",
        json={"email": "student.rahul@iiitp.ac.in", "password": "Student@123"}
    )
    assert student_login.status_code == 200
    student_token = student_login.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # Fetch current registration
    reg_resp = client.get("/api/v1/registrations/current", headers=student_headers)
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    reg_id = reg_data["id"]

    # Upload required non-hosteller documents
    for doc_type in [DocumentType.REGISTRATION_RECEIPT.value, DocumentType.ANTI_RAGGING.value, DocumentType.ABC_CARD.value, DocumentType.DUES_RECEIPT.value]:
        dummy_file = io.BytesIO(b"%PDF-1.4 sample file")
        dummy_file.name = f"{doc_type.lower()}.pdf"
        up_resp = client.post(
            "/api/v1/documents/upload",
            data={"registration_id": reg_id, "document_type": doc_type},
            files={"file": (dummy_file.name, dummy_file, "application/pdf")},
            headers=student_headers
        )
        assert up_resp.status_code == 200

    # Submit registration (Non-Hosteller -> PENDING_FACULTY)
    submit_resp = client.post(
        "/api/v1/registrations/submit",
        json={
            "contact_number": "9876543210",
            "emergency_contact": "9876543211",
            "abc_id": "ABC-11223-4455",
            "is_hosteller": False,
            "declaration_confirmed": True
        },
        headers=student_headers
    )
    assert submit_resp.status_code == 200
    assert submit_resp.json()["status"] == "PENDING_FACULTY"

    # 2. Login as Faculty Advisor (CS Advisor)
    advisor_login = client.post(
        "/api/v1/auth/login",
        json={"email": "advisor.cs@iiitp.ac.in", "password": "Advisor@123"}
    )
    assert advisor_login.status_code == 200
    advisor_token = advisor_login.json()["access_token"]
    advisor_headers = {"Authorization": f"Bearer {advisor_token}"}

    # Check pending list
    pending_resp = client.get("/api/v1/workflow/pending", headers=advisor_headers)
    assert pending_resp.status_code == 200
    pending_list = pending_resp.json()
    assert any(p["id"] == reg_id for p in pending_list)

    # Rejection without reason must fail
    fail_review = client.post(
        "/api/v1/workflow/review",
        json={
            "registration_id": reg_id,
            "action": "RETURN_DISCREPANCY",
            "comments": ""
        },
        headers=advisor_headers
    )
    assert fail_review.status_code == 400

    # Reviewer returns form with discrepancy reason
    discrepancy_reason = "Payment receipt UTR is illegible. Please re-upload clear transaction slip."
    review_resp = client.post(
        "/api/v1/workflow/review",
        json={
            "registration_id": reg_id,
            "action": "RETURN_DISCREPANCY",
            "comments": discrepancy_reason
        },
        headers=advisor_headers
    )
    assert review_resp.status_code == 200
    assert review_resp.json()["status"] == "RETURNED_FOR_CORRECTION"

    # 3. Verify Student received notification
    notifs_resp = client.get("/api/v1/notifications/", headers=student_headers)
    assert notifs_resp.status_code == 200
    notifs = notifs_resp.json()
    assert len(notifs) >= 1
    rejection_notif = next((n for n in notifs if "Discrepancy Raised" in n["title"]), None)
    assert rejection_notif is not None
    assert discrepancy_reason in rejection_notif["message"]
    assert rejection_notif["is_read"] is False

    # Mark notification as read
    mark_read = client.patch(f"/api/v1/notifications/{rejection_notif['id']}/read", headers=student_headers)
    assert mark_read.status_code == 200
    assert mark_read.json()["is_read"] is True

    # Check student current registration has discrepancy reason attached
    reg_check = client.get("/api/v1/registrations/current", headers=student_headers)
    assert reg_check.status_code == 200
    assert reg_check.json()["status"] == "RETURNED_FOR_CORRECTION"
    assert reg_check.json()["latest_rejection_reason"] == discrepancy_reason

    # 4. Student clears discrepancy: re-uploads document and resubmits
    re_upload = client.post(
        "/api/v1/documents/upload",
        data={"registration_id": reg_id, "document_type": DocumentType.REGISTRATION_RECEIPT.value},
        files={"file": ("new_clear_receipt.pdf", io.BytesIO(b"%PDF-1.4 revised clear receipt"), "application/pdf")},
        headers=student_headers
    )
    assert re_upload.status_code == 200

    # Resubmit with resolution comments
    resubmit_resp = client.post(
        "/api/v1/registrations/submit",
        json={
            "contact_number": "9876543210",
            "emergency_contact": "9876543211",
            "abc_id": "ABC-11223-4455",
            "is_hosteller": False,
            "declaration_confirmed": True,
            "resolution_comments": "Uploaded revised clear SBI Collect fee receipt."
        },
        headers=student_headers
    )
    assert resubmit_resp.status_code == 200
    assert resubmit_resp.json()["status"] == "PENDING_FACULTY"

    # Student receives confirmation of resubmission
    notifs_after = client.get("/api/v1/notifications/", headers=student_headers)
    resubmit_notif = next((n for n in notifs_after.json() if "Resubmitted" in n["title"]), None)
    assert resubmit_notif is not None
