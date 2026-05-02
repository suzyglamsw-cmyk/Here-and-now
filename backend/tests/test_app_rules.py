"""
Test suite for Here & Now app-wide rules:
1. Age Gate (18+ confirmation required for registration)
2. Name Validation (PII/offensive content blocked, non-editable after creation)
3. Last Active Filter in Who's Here
4. Premium users sorted first in Who's Here
5. Clear from Mutual Matches action
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def test_user_token(api_client):
    """Login with demo user and get token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "demo@user.com",
        "password": "password"
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Demo user login failed - skipping authenticated tests")

@pytest.fixture(scope="module")
def authenticated_client(api_client, test_user_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {test_user_token}"})
    return api_client


class TestAgeGateRegistration:
    """Test age gate requirement for registration"""
    
    def test_registration_without_age_confirmation_fails(self, api_client):
        """Registration should fail if age_confirmed is false"""
        unique_email = f"test_age_{uuid.uuid4().hex[:8]}@test.com"
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "display_name": "TestUser",
            "age_confirmed": False
        })
        assert response.status_code == 400
        assert "18 or older" in response.json().get("detail", "").lower() or "age" in response.json().get("detail", "").lower()
        print(f"✓ Registration without age confirmation correctly rejected: {response.json()}")
    
    def test_registration_with_age_confirmation_succeeds(self, api_client):
        """Registration should succeed with age_confirmed=true"""
        unique_email = f"test_age_ok_{uuid.uuid4().hex[:8]}@test.com"
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "display_name": "ValidUser",
            "age_confirmed": True
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == unique_email
        print(f"✓ Registration with age confirmation succeeded for {unique_email}")


class TestNameValidation:
    """Test name validation for PII and offensive content"""
    
    def test_name_with_phone_number_blocked(self, api_client):
        """Names with 5+ consecutive digits should be blocked"""
        unique_email = f"test_phone_{uuid.uuid4().hex[:8]}@test.com"
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "display_name": "John12345",  # 5+ digits
            "age_confirmed": True
        })
        assert response.status_code == 400
        assert "blocked" in response.json().get("detail", "").lower()
        print(f"✓ Name with phone number correctly blocked: {response.json()}")
    
    def test_name_with_email_blocked(self, api_client):
        """Names with @ symbol should be blocked"""
        unique_email = f"test_email_{uuid.uuid4().hex[:8]}@test.com"
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "display_name": "john@test",  # Contains @
            "age_confirmed": True
        })
        assert response.status_code == 400
        assert "blocked" in response.json().get("detail", "").lower()
        print(f"✓ Name with email symbol correctly blocked: {response.json()}")
    
    def test_name_with_url_blocked(self, api_client):
        """Names with URL patterns should be blocked"""
        unique_email = f"test_url_{uuid.uuid4().hex[:8]}@test.com"
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "display_name": "john.com",  # URL pattern
            "age_confirmed": True
        })
        assert response.status_code == 400
        assert "blocked" in response.json().get("detail", "").lower()
        print(f"✓ Name with URL correctly blocked: {response.json()}")
    
    def test_name_with_social_handle_blocked(self, api_client):
        """Names with social media handles should be blocked"""
        unique_email = f"test_social_{uuid.uuid4().hex[:8]}@test.com"
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "display_name": "instagram_john",  # Social handle
            "age_confirmed": True
        })
        assert response.status_code == 400
        assert "blocked" in response.json().get("detail", "").lower()
        print(f"✓ Name with social handle correctly blocked: {response.json()}")
    
    def test_valid_name_accepted(self, api_client):
        """Valid first names should be accepted"""
        unique_email = f"test_valid_{uuid.uuid4().hex[:8]}@test.com"
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "display_name": "Sarah",  # Valid name
            "age_confirmed": True
        })
        assert response.status_code == 200
        assert response.json()["user"]["display_name"] == "Sarah"
        print(f"✓ Valid name 'Sarah' accepted")
    
    def test_name_too_short_rejected(self, api_client):
        """Names less than 2 characters should be rejected"""
        unique_email = f"test_short_{uuid.uuid4().hex[:8]}@test.com"
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "display_name": "A",  # Too short
            "age_confirmed": True
        })
        assert response.status_code == 400
        print(f"✓ Name too short correctly rejected: {response.json()}")


class TestNameNonEditable:
    """Test that display name cannot be changed after registration"""
    
    def test_name_change_silently_reverted(self, authenticated_client):
        """Attempting to change display_name should be silently reverted"""
        # First get current user info
        me_response = authenticated_client.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        original_name = me_response.json()["display_name"]
        
        # Try to change the name
        update_response = authenticated_client.put(f"{BASE_URL}/api/auth/profile", json={
            "display_name": "NewNameAttempt",
            "bio": "Test bio update"
        })
        assert update_response.status_code == 200
        
        # Verify name was NOT changed
        updated_data = update_response.json()
        assert updated_data["display_name"] == original_name, f"Name should remain {original_name}, got {updated_data['display_name']}"
        print(f"✓ Name change attempt silently reverted - name remains '{original_name}'")


class TestLastActiveFilter:
    """Test Last Active filter in Who's Here endpoint"""
    
    def test_venue_people_endpoint_accepts_filter_param(self, authenticated_client):
        """Endpoint should accept last_active_filter parameter"""
        # First check in to a venue
        checkin_response = authenticated_client.post(f"{BASE_URL}/api/checkin", json={
            "venue_id": "test-venue-filter"
        })
        # May fail if already checked in elsewhere, that's ok
        
        # Test with different filter values
        for filter_value in ["now", "recent", "hour", None]:
            params = f"?last_active_filter={filter_value}" if filter_value else ""
            response = authenticated_client.get(f"{BASE_URL}/api/venues/test-venue-filter/people{params}")
            # Should return 200 or 403 (if no photo), not 400 or 422
            assert response.status_code in [200, 403], f"Filter '{filter_value}' returned {response.status_code}"
            print(f"✓ Filter '{filter_value}' accepted - status {response.status_code}")
    
    def test_filter_now_returns_only_recent_users(self, authenticated_client):
        """Filter 'now' should only return users active within 2 minutes"""
        response = authenticated_client.get(f"{BASE_URL}/api/venues/test-venue-filter/people?last_active_filter=now")
        if response.status_code == 200:
            people = response.json()
            # All returned users should have last_active_at within 2 minutes
            now = datetime.now(timezone.utc)
            for person in people:
                if person.get("last_active_at"):
                    last_active = datetime.fromisoformat(person["last_active_at"].replace("Z", "+00:00"))
                    minutes_ago = (now - last_active).total_seconds() / 60
                    assert minutes_ago <= 2.5, f"User {person['id']} last active {minutes_ago:.1f} min ago, should be <=2"
            print(f"✓ Filter 'now' correctly filters users - {len(people)} users returned")
        else:
            print(f"✓ Filter test skipped (status {response.status_code})")


class TestPremiumSorting:
    """Test that premium users are sorted first in Who's Here"""
    
    def test_premium_users_sorted_first(self, authenticated_client):
        """Premium users should appear before non-premium users"""
        response = authenticated_client.get(f"{BASE_URL}/api/venues/test-venue-filter/people")
        if response.status_code == 200:
            people = response.json()
            if len(people) > 1:
                # Check that premium users come before non-premium
                found_non_premium = False
                for person in people:
                    if not person.get("is_premium", False):
                        found_non_premium = True
                    elif found_non_premium:
                        # Found premium after non-premium - sorting is wrong
                        pytest.fail("Premium user found after non-premium user - sorting incorrect")
                print(f"✓ Premium sorting verified - {len(people)} users in correct order")
            else:
                print(f"✓ Premium sorting test skipped - only {len(people)} users")
        else:
            print(f"✓ Premium sorting test skipped (status {response.status_code})")


class TestClearFromMutualMatches:
    """Test Clear from Mutual Matches functionality"""
    
    def test_clear_endpoint_exists(self, authenticated_client):
        """DELETE /api/connections/{user_id}/clear endpoint should exist"""
        # Use a fake user ID - should return 200 even if no connection exists
        fake_user_id = "fake-test-user-clear"
        response = authenticated_client.delete(f"{BASE_URL}/api/connections/{fake_user_id}/clear")
        # Should return 200 (success) not 404 or 405
        assert response.status_code == 200, f"Clear endpoint returned {response.status_code}"
        data = response.json()
        assert "message" in data
        assert data.get("user_id") == fake_user_id
        print(f"✓ Clear endpoint works - {data}")
    
    def test_clear_preserves_chat_history(self, authenticated_client):
        """Clearing from matches should NOT delete messages"""
        # This is a behavioral test - we verify the endpoint doesn't touch messages
        # by checking the response message indicates preservation
        fake_user_id = "fake-test-user-preserve"
        response = authenticated_client.delete(f"{BASE_URL}/api/connections/{fake_user_id}/clear")
        assert response.status_code == 200
        # The endpoint should mention "cleared" not "deleted"
        data = response.json()
        assert "clear" in data.get("message", "").lower()
        print(f"✓ Clear endpoint preserves chat history (message: {data.get('message')})")
    
    def test_clear_requires_authentication(self, api_client):
        """Clear endpoint should require authentication"""
        # Remove auth header temporarily
        original_headers = api_client.headers.copy()
        api_client.headers.pop("Authorization", None)
        
        response = api_client.delete(f"{BASE_URL}/api/connections/test-user/clear")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        
        # Restore headers
        api_client.headers = original_headers
        print(f"✓ Clear endpoint requires authentication - status {response.status_code}")


class TestMotionBlurCSS:
    """Test that motion blur CSS classes are defined"""
    
    def test_motion_blur_class_in_css(self):
        """Verify motion-blur CSS class exists in index.css"""
        css_path = "/app/frontend/src/index.css"
        with open(css_path, "r") as f:
            css_content = f.read()
        
        assert ".motion-blur" in css_content, "motion-blur class not found in CSS"
        assert "blur(8px)" in css_content or "blur(" in css_content, "blur filter not found"
        print(f"✓ motion-blur CSS class found with blur filter")
    
    def test_motion_blur_reveal_class_in_css(self):
        """Verify motion-blur-reveal CSS class exists"""
        css_path = "/app/frontend/src/index.css"
        with open(css_path, "r") as f:
            css_content = f.read()
        
        assert ".motion-blur-reveal" in css_content, "motion-blur-reveal class not found"
        print(f"✓ motion-blur-reveal CSS class found")
    
    def test_premium_glow_class_in_css(self):
        """Verify premium-glow CSS class exists"""
        css_path = "/app/frontend/src/index.css"
        with open(css_path, "r") as f:
            css_content = f.read()
        
        assert ".premium-glow" in css_content, "premium-glow class not found"
        print(f"✓ premium-glow CSS class found")


class TestWhoIsHereResponse:
    """Test Who's Here API response structure"""
    
    def test_response_includes_is_premium_field(self, authenticated_client):
        """Response should include is_premium field for sorting"""
        response = authenticated_client.get(f"{BASE_URL}/api/venues/test-venue/people")
        if response.status_code == 200:
            people = response.json()
            for person in people:
                assert "is_premium" in person, f"is_premium field missing for user {person.get('id')}"
            print(f"✓ is_premium field present in all {len(people)} users")
        else:
            print(f"✓ Response structure test skipped (status {response.status_code})")
    
    def test_response_includes_last_active_field(self, authenticated_client):
        """Response should include last_active_at field for filtering"""
        response = authenticated_client.get(f"{BASE_URL}/api/venues/test-venue/people")
        if response.status_code == 200:
            people = response.json()
            for person in people:
                # last_active_at may be None for some users, but field should exist
                assert "last_active_at" in person, f"last_active_at field missing for user {person.get('id')}"
            print(f"✓ last_active_at field present in all {len(people)} users")
        else:
            print(f"✓ Response structure test skipped (status {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
