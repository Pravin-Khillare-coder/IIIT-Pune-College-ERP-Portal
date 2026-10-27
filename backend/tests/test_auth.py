def test_student_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "student.rahul@iiitp.ac.in",
            "password": "Student@123",
            "expected_role": "STUDENT"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "STUDENT"
    assert data["email"] == "student.rahul@iiitp.ac.in"


def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "student.rahul@iiitp.ac.in",
            "password": "WrongPassword123"
        }
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_role_mismatch_rejection(client):
    # Student trying to log in expecting ADMIN role
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "student.rahul@iiitp.ac.in",
            "password": "Student@123",
            "expected_role": "ADMIN"
        }
    )
    assert response.status_code == 403
    assert "Authorization failure" in response.json()["detail"]


def test_get_me_authenticated(client):
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@iiitp.ac.in", "password": "Admin@123"}
    )
    token = login_resp.json()["access_token"]

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@iiitp.ac.in"
    assert data["role"] == "ADMIN"
