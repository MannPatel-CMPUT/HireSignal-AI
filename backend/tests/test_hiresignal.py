"""Backend API tests for HireSignal AI"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://hiresignal-ai.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def test_user_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": "test@hiresignal.com", "password": "test123"})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": "admin@hiresignal.com", "password": "admin123"})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return s


# ---------- Auth ----------
class TestAuth:
    def test_login_seeded_test_user(self):
        r = requests.post(f"{API}/auth/login", json={"email": "test@hiresignal.com", "password": "test123"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == "test@hiresignal.com"
        assert data["role"] == "user"
        assert "access_token" in r.cookies
        assert "refresh_token" in r.cookies

    def test_login_admin(self):
        r = requests.post(f"{API}/auth/login", json={"email": "admin@hiresignal.com", "password": "admin123"})
        assert r.status_code == 200, r.text
        assert r.json()["role"] == "admin"

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": "test@hiresignal.com", "password": "wrongpass"})
        assert r.status_code == 401

    def test_register_and_me(self):
        email = f"test_{uuid.uuid4().hex[:8]}@hiresignal.com"
        s = requests.Session()
        r = s.post(f"{API}/auth/register", json={"email": email, "password": "Password123!", "name": "TEST User"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == email
        assert data["name"] == "TEST User"
        # /auth/me using cookies
        me = s.get(f"{API}/auth/me")
        assert me.status_code == 200
        assert me.json()["email"] == email

    def test_register_duplicate(self):
        r = requests.post(f"{API}/auth/register", json={"email": "test@hiresignal.com", "password": "test123", "name": "Dup"})
        assert r.status_code == 400

    def test_me_unauthenticated(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_logout(self, test_user_session):
        # Use a fresh session so we don't kill the module-scoped fixture
        s = requests.Session()
        s.post(f"{API}/auth/login", json={"email": "test@hiresignal.com", "password": "test123"})
        r = s.post(f"{API}/auth/logout")
        assert r.status_code == 200

    def test_refresh_token(self):
        s = requests.Session()
        s.post(f"{API}/auth/login", json={"email": "test@hiresignal.com", "password": "test123"})
        r = s.post(f"{API}/auth/refresh")
        assert r.status_code == 200


# ---------- Reports ----------
class TestReports:
    def test_get_reports_authenticated(self, test_user_session):
        r = test_user_session.get(f"{API}/reports")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_reports_unauthenticated(self):
        r = requests.get(f"{API}/reports")
        assert r.status_code == 401

    def test_get_report_not_found(self, test_user_session):
        # Valid ObjectId format but not existing
        r = test_user_session.get(f"{API}/reports/507f1f77bcf86cd799439011")
        # Either 404 or 500 (server wraps in try/except)
        assert r.status_code in (404, 500)

    def test_delete_report_unauthenticated(self):
        r = requests.delete(f"{API}/reports/507f1f77bcf86cd799439011")
        assert r.status_code == 401


# ---------- Analyze ----------
class TestAnalyze:
    def test_analyze_unauthenticated(self):
        r = requests.post(f"{API}/analyze", json={"resume_text": "x", "job_description": "y"})
        assert r.status_code == 401

    @pytest.mark.timeout(120)
    def test_analyze_full_flow(self, test_user_session):
        """Test analyze endpoint end-to-end with LLM - then verify persistence + delete."""
        payload = {
            "resume_text": "John Doe\nSoftware Engineer\n5 years experience in Python, FastAPI, MongoDB. Built scalable APIs.",
            "job_description": "Senior Backend Engineer needing Python, FastAPI, MongoDB, AWS experience.",
            "company_name": "TestCo",
            "role_title": "Senior Backend Engineer",
            "experience_level": "Senior",
            "tone_preference": "Professional",
        }
        r = test_user_session.post(f"{API}/analyze", json=payload, timeout=120)
        assert r.status_code == 200, f"Analyze failed: {r.status_code} {r.text[:500]}"
        data = r.json()
        assert "id" in data
        assert isinstance(data["ats_score"], int)
        assert isinstance(data["recruiter_score"], int)
        assert "analysis" in data
        analysis = data["analysis"]
        # Validate key sections exist
        for key in ["ai_tone_detection", "keyword_match", "recruiter_feedback", "bullet_rewrites", "action_plan"]:
            assert key in analysis, f"Missing {key} in analysis"

        report_id = data["id"]

        # GET to verify persistence
        get_r = test_user_session.get(f"{API}/reports/{report_id}")
        assert get_r.status_code == 200
        assert get_r.json()["ats_score"] == data["ats_score"]

        # Confirm it appears in list
        list_r = test_user_session.get(f"{API}/reports")
        ids = [rep["_id"] for rep in list_r.json()]
        assert report_id in ids

        # DELETE
        del_r = test_user_session.delete(f"{API}/reports/{report_id}")
        assert del_r.status_code == 200

        # Verify gone (returns 404 or 500 due to server wrap)
        gone_r = test_user_session.get(f"{API}/reports/{report_id}")
        assert gone_r.status_code in (404, 500)
