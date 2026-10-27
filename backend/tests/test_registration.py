import io
from app.models.payment import DocumentType


def test_get_current_registration(client):
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "student.rahul@iiitp.ac.in", "password": "Student@123"}
    )
    token = login_resp.json()["access_token"]

    response = client.get(
        "/api/v1/registrations/current",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["student_name"] == "Rahul Sharma"
    assert data["mis_number"] == "112203045"
    assert data["status"] == "DRAFT"


def test_save_registration_draft(client):
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "student.rahul@iiitp.ac.in", "password": "Student@123"}
    )
    token = login_resp.json()["access_token"]

    response = client.post(
        "/api/v1/registrations/draft",
        json={
            "contact_number": "9876543210",
            "emergency_contact": "9876543211",
            "is_hosteller": True,
            "abc_id": "ABC-12345-6789"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["contact_number"] == "9876543210"
    assert data["is_hosteller"] is True
    assert data["abc_id"] == "ABC-12345-6789"


def test_submit_registration_missing_documents_rejection(client):
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "student.priya@iiitp.ac.in", "password": "Student@123"}
    )
    token = login_resp.json()["access_token"]

    # First fetch current registration to initialize draft
    client.get(
        "/api/v1/registrations/current",
        headers={"Authorization": f"Bearer {token}"}
    )

    # Attempt submit without uploading required documents
    response = client.post(
        "/api/v1/registrations/submit",
        json={
            "contact_number": "9876543210",
            "emergency_contact": "9876543211",
            "abc_id": "ABC-99999-8888",
            "is_hosteller": False,
            "declaration_confirmed": True
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 400
    assert "mandatory" in response.json()["detail"]


def test_document_upload_and_submission_workflow(client):
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "student.priya@iiitp.ac.in", "password": "Student@123"}
    )
    token = login_resp.json()["access_token"]

    # 1. Fetch registration draft
    reg_resp = client.get(
        "/api/v1/registrations/current",
        headers={"Authorization": f"Bearer {token}"}
    )
    reg_id = reg_resp.json()["id"]

    # 2. Upload mandatory documents for Non-Hosteller (Registration Receipt, Anti-Ragging, ABC Card)
    docs_to_upload = [
        DocumentType.REGISTRATION_RECEIPT.value,
        DocumentType.ANTI_RAGGING.value,
        DocumentType.ABC_CARD.value
    ]

    for doc_type in docs_to_upload:
        dummy_file = io.BytesIO(b"%PDF-1.4 dummy pdf document content for verification")
        dummy_file.name = f"{doc_type.lower()}.pdf"
        
        upload_resp = client.post(
            "/api/v1/documents/upload",
            data={
                "registration_id": reg_id,
                "document_type": doc_type
            },
            files={"file": (dummy_file.name, dummy_file, "application/pdf")},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert upload_resp.status_code == 200

    # 3. Submit registration (Non-Hosteller route -> Direct PENDING_FACULTY)
    submit_resp = client.post(
        "/api/v1/registrations/submit",
        json={
            "contact_number": "9876543210",
            "emergency_contact": "9876543211",
            "abc_id": "ABC-99999-8888",
            "is_hosteller": False,
            "declaration_confirmed": True
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert submit_resp.status_code == 200
    data = submit_resp.json()
    assert data["status"] == "PENDING_FACULTY"
    assert data["is_hosteller"] is False
    assert len(data["documents"]) == 3
