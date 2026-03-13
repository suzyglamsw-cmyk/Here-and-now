"""
Test suite for new features:
- Forgot Password flow (request + reset password)
- Friends API (get friends, get requests)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestForgotPassword:
    """Test forgot password flow - request reset and actual reset"""
    
    @pytest.fixture(scope="class")
    def test_user(self):
        """Create a test user for password reset tests"""
        unique_id = str(uuid.uuid4())[:8]
        email = f"TEST_pwreset_{unique_id}@test.com"
        password = "TestPass123!"
        
        # Register user
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "display_name": f"PWReset User {unique_id}"
        })
        
        if response.status_code != 200:
            pytest.skip(f"Failed to create test user: {response.text}")
        
        data = response.json()
        return {
            "email": email,
            "password": password,
            "user": data.get("user"),
            "token": data.get("token")
        }
    
    def test_forgot_password_valid_email(self, test_user):
        """Test forgot password with valid email returns success"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": test_user["email"]
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        # In dev mode, reset_token is returned
        assert "reset_token" in data
        assert len(data["reset_token"]) > 0
        print(f"✓ Forgot password request successful for {test_user['email']}")
        
        # Store token for next test
        test_user["reset_token"] = data["reset_token"]
    
    def test_forgot_password_invalid_email(self):
        """Test forgot password with non-existent email still returns 200 (security)"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": "nonexistent_email_12345@nowhere.com"
        })
        
        # Should return 200 to not reveal if email exists
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Forgot password with invalid email handled correctly (doesn't reveal email existence)")
    
    def test_reset_password_flow(self, test_user):
        """Test complete password reset flow"""
        # First request reset token
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": test_user["email"]
        })
        assert response.status_code == 200
        reset_token = response.json().get("reset_token")
        assert reset_token is not None
        
        # Now reset password
        new_password = "NewTestPass456!"
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": reset_token,
            "new_password": new_password
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Password reset successful")
        
        # Verify can login with new password
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_user["email"],
            "password": new_password
        })
        
        assert login_response.status_code == 200
        assert "token" in login_response.json()
        print("✓ Login with new password successful")
    
    def test_reset_password_invalid_token(self):
        """Test reset password with invalid token fails"""
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": "invalid-token-12345",
            "new_password": "SomePassword123"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print("✓ Reset password with invalid token correctly rejected")


class TestFriendsAPI:
    """Test Friends API endpoints"""
    
    @pytest.fixture(scope="class")
    def authenticated_user(self):
        """Create and authenticate a test user"""
        unique_id = str(uuid.uuid4())[:8]
        email = f"TEST_friends_{unique_id}@test.com"
        password = "TestPass123!"
        
        # Register user
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "display_name": f"Friends User {unique_id}"
        })
        
        if response.status_code != 200:
            pytest.skip(f"Failed to create test user: {response.text}")
        
        data = response.json()
        return {
            "email": email,
            "password": password,
            "user": data.get("user"),
            "token": data.get("token")
        }
    
    def test_get_friends_empty_for_new_user(self, authenticated_user):
        """Test GET /friends returns empty array for new user"""
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.get(f"{BASE_URL}/api/friends", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0  # New user should have no friends
        print("✓ GET /friends returns empty array for new user")
    
    def test_get_friend_requests_empty_for_new_user(self, authenticated_user):
        """Test GET /friends/requests returns empty array for new user"""
        headers = {"Authorization": f"Bearer {authenticated_user['token']}"}
        response = requests.get(f"{BASE_URL}/api/friends/requests", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0  # New user should have no pending requests
        print("✓ GET /friends/requests returns empty array for new user")
    
    def test_friends_endpoint_requires_auth(self):
        """Test friends endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/friends")
        
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403]
        print("✓ GET /friends correctly requires authentication")
    
    def test_friend_requests_endpoint_requires_auth(self):
        """Test friend requests endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/friends/requests")
        
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403]
        print("✓ GET /friends/requests correctly requires authentication")


class TestPremiumPageAfterFix:
    """Verify Premium page still works after iteration_3 fix"""
    
    def test_premium_status_endpoint(self):
        """Test /premium/status endpoint"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Register user first
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_premium_{unique_id}@test.com",
            "password": "TestPass123!",
            "display_name": f"Premium Test {unique_id}"
        })
        
        if register_response.status_code != 200:
            pytest.skip("Failed to register test user")
        
        token = register_response.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/premium/status", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "packages" in data
        assert isinstance(data["packages"], list)
        print("✓ Premium status endpoint works correctly")
    
    def test_premium_packages_endpoint(self):
        """Test /premium/packages endpoint"""
        response = requests.get(f"{BASE_URL}/api/premium/packages")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # Should have at least monthly and yearly
        print("✓ Premium packages endpoint works correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
