"""
Test Friends Management Features:
1. Friends filter in WhosHere.js (frontend-only filter)
2. Friends tab in Connections.js with Hide/Unhide/Remove actions
3. API endpoints: hide-from-matches, unhide-from-matches, DELETE /friends/{friend_id}
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestFriendsManagementAPIs:
    """Test Friends Management API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data - create test users and authenticate"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Create unique test users
        self.test_id = str(uuid.uuid4())[:8]
        self.user1_email = f"friends_test_user1_{self.test_id}@example.com"
        self.user2_email = f"friends_test_user2_{self.test_id}@example.com"
        self.password = "TestPass123!"
        
        # Register and login user 1
        self.user1_token = self._register_and_login(self.user1_email, "TestUser1")
        self.user1_id = self._get_user_id(self.user1_token)
        
        # Register and login user 2
        self.user2_token = self._register_and_login(self.user2_email, "TestUser2")
        self.user2_id = self._get_user_id(self.user2_token)
        
        yield
        
        # Cleanup is handled by test database
    
    def _register_and_login(self, email, display_name):
        """Helper to register and login a user"""
        # Try to register
        register_resp = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": self.password,
            "display_name": display_name,
            "age_confirmed": True,
            "date_of_birth": "1990-01-15"
        })
        
        if register_resp.status_code == 200:
            return register_resp.json().get("token")
        
        # If registration failed (e.g., email exists), try login
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": self.password
        })
        
        if login_resp.status_code == 200:
            return login_resp.json().get("token")
        
        # If both failed, skip the test
        pytest.skip(f"Could not register or login: register={register_resp.status_code}, login={login_resp.status_code}")
    
    def _get_user_id(self, token):
        """Get user ID from token"""
        resp = self.session.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200
        return resp.json().get("id")
    
    def _make_friends(self, user1_token, user1_id, user2_token, user2_id):
        """Helper to make two users friends"""
        # User1 sends friend request to User2
        resp = self.session.post(
            f"{BASE_URL}/api/friends/add",
            json={"user_id": user2_id},
            headers={"Authorization": f"Bearer {user1_token}"}
        )
        # May fail if chat not unlocked - that's expected
        if resp.status_code != 200:
            return False
        
        # Get the friend request ID
        requests_resp = self.session.get(
            f"{BASE_URL}/api/friends/requests",
            headers={"Authorization": f"Bearer {user2_token}"}
        )
        if requests_resp.status_code != 200:
            return False
        
        incoming = requests_resp.json().get("incoming", [])
        friend_request = next((r for r in incoming if r.get("user_id") == user1_id), None)
        if not friend_request:
            return False
        
        # User2 accepts friend request
        accept_resp = self.session.post(
            f"{BASE_URL}/api/friends/respond/{friend_request['id']}?accept=true",
            headers={"Authorization": f"Bearer {user2_token}"}
        )
        return accept_resp.status_code == 200
    
    # =========================================================================
    # Test: Hide from Matches API
    # =========================================================================
    
    def test_hide_from_matches_endpoint_exists(self):
        """Test POST /api/connections/{user_id}/hide-from-matches endpoint exists"""
        resp = self.session.post(
            f"{BASE_URL}/api/connections/{self.user2_id}/hide-from-matches",
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        # Should return 200 (success) or already hidden message
        assert resp.status_code == 200, f"Hide from matches failed: {resp.status_code} - {resp.text}"
        data = resp.json()
        assert "message" in data or "Hidden" in str(data)
        print(f"PASSED: Hide from matches endpoint works - {data}")
    
    def test_hide_from_matches_idempotent(self):
        """Test hiding same user twice is idempotent"""
        # Hide first time
        resp1 = self.session.post(
            f"{BASE_URL}/api/connections/{self.user2_id}/hide-from-matches",
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        assert resp1.status_code == 200
        
        # Hide second time - should still succeed
        resp2 = self.session.post(
            f"{BASE_URL}/api/connections/{self.user2_id}/hide-from-matches",
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        assert resp2.status_code == 200
        print("PASSED: Hide from matches is idempotent")
    
    # =========================================================================
    # Test: Unhide from Matches API
    # =========================================================================
    
    def test_unhide_from_matches_endpoint_exists(self):
        """Test DELETE /api/connections/{user_id}/unhide-from-matches endpoint exists"""
        # First hide the user
        self.session.post(
            f"{BASE_URL}/api/connections/{self.user2_id}/hide-from-matches",
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        
        # Then unhide
        resp = self.session.delete(
            f"{BASE_URL}/api/connections/{self.user2_id}/unhide-from-matches",
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        assert resp.status_code == 200, f"Unhide from matches failed: {resp.status_code} - {resp.text}"
        data = resp.json()
        assert "message" in data
        print(f"PASSED: Unhide from matches endpoint works - {data}")
    
    def test_unhide_non_hidden_user(self):
        """Test unhiding a user that was never hidden"""
        # Unhide without hiding first
        resp = self.session.delete(
            f"{BASE_URL}/api/connections/{self.user2_id}/unhide-from-matches",
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        # Should return 200 with "was not hidden" message
        assert resp.status_code == 200
        print("PASSED: Unhide non-hidden user returns success")
    
    # =========================================================================
    # Test: Get Hidden from Matches List
    # =========================================================================
    
    def test_get_hidden_from_matches_list(self):
        """Test GET /api/connections/hidden-from-matches returns hidden users"""
        # Hide user2
        self.session.post(
            f"{BASE_URL}/api/connections/{self.user2_id}/hide-from-matches",
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        
        # Get hidden list
        resp = self.session.get(
            f"{BASE_URL}/api/connections/hidden-from-matches",
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        assert resp.status_code == 200, f"Get hidden list failed: {resp.status_code}"
        data = resp.json()
        assert isinstance(data, list)
        
        # Check user2 is in the list
        hidden_ids = [h.get("user_id") for h in data]
        assert self.user2_id in hidden_ids, f"User2 not in hidden list: {hidden_ids}"
        print(f"PASSED: Hidden from matches list contains hidden user - {len(data)} hidden users")
    
    # =========================================================================
    # Test: Remove Friend API
    # =========================================================================
    
    def test_remove_friend_endpoint_exists(self):
        """Test DELETE /api/friends/{friend_id} endpoint exists"""
        # Try to remove a friend (may fail if not friends, but endpoint should exist)
        resp = self.session.delete(
            f"{BASE_URL}/api/friends/{self.user2_id}",
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        # Should return 200 (success) or 404 (not friends)
        assert resp.status_code in [200, 404], f"Remove friend unexpected status: {resp.status_code} - {resp.text}"
        print(f"PASSED: Remove friend endpoint exists - status {resp.status_code}")
    
    # =========================================================================
    # Test: Friends List API
    # =========================================================================
    
    def test_friends_list_endpoint(self):
        """Test GET /api/friends/list returns friends"""
        resp = self.session.get(
            f"{BASE_URL}/api/friends/list",
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        assert resp.status_code == 200, f"Friends list failed: {resp.status_code}"
        data = resp.json()
        assert isinstance(data, list)
        print(f"PASSED: Friends list endpoint works - {len(data)} friends")
    
    def test_friends_list_structure(self):
        """Test friends list returns expected fields"""
        resp = self.session.get(
            f"{BASE_URL}/api/friends/list",
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        assert resp.status_code == 200
        data = resp.json()
        
        # If there are friends, check structure
        if len(data) > 0:
            friend = data[0]
            expected_fields = ["id", "display_name"]
            for field in expected_fields:
                assert field in friend, f"Missing field: {field}"
            print(f"PASSED: Friends list has expected structure")
        else:
            print("PASSED: Friends list is empty (no friends to check structure)")
    
    # =========================================================================
    # Test: Hide/Unhide Flow
    # =========================================================================
    
    def test_hide_unhide_flow(self):
        """Test complete hide -> verify hidden -> unhide -> verify unhidden flow"""
        # 1. Hide user2
        hide_resp = self.session.post(
            f"{BASE_URL}/api/connections/{self.user2_id}/hide-from-matches",
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        assert hide_resp.status_code == 200
        
        # 2. Verify user2 is in hidden list
        list_resp = self.session.get(
            f"{BASE_URL}/api/connections/hidden-from-matches",
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        assert list_resp.status_code == 200
        hidden_ids = [h.get("user_id") for h in list_resp.json()]
        assert self.user2_id in hidden_ids, "User should be in hidden list after hiding"
        
        # 3. Unhide user2
        unhide_resp = self.session.delete(
            f"{BASE_URL}/api/connections/{self.user2_id}/unhide-from-matches",
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        assert unhide_resp.status_code == 200
        
        # 4. Verify user2 is NOT in hidden list
        list_resp2 = self.session.get(
            f"{BASE_URL}/api/connections/hidden-from-matches",
            headers={"Authorization": f"Bearer {self.user1_token}"}
        )
        assert list_resp2.status_code == 200
        hidden_ids2 = [h.get("user_id") for h in list_resp2.json()]
        assert self.user2_id not in hidden_ids2, "User should NOT be in hidden list after unhiding"
        
        print("PASSED: Complete hide/unhide flow works correctly")
    
    # =========================================================================
    # Test: Authentication Required
    # =========================================================================
    
    def test_hide_requires_auth(self):
        """Test hide-from-matches requires authentication"""
        resp = self.session.post(
            f"{BASE_URL}/api/connections/{self.user2_id}/hide-from-matches"
        )
        assert resp.status_code in [401, 403], f"Should require auth: {resp.status_code}"
        print("PASSED: Hide from matches requires authentication")
    
    def test_unhide_requires_auth(self):
        """Test unhide-from-matches requires authentication"""
        resp = self.session.delete(
            f"{BASE_URL}/api/connections/{self.user2_id}/unhide-from-matches"
        )
        assert resp.status_code in [401, 403], f"Should require auth: {resp.status_code}"
        print("PASSED: Unhide from matches requires authentication")
    
    def test_friends_list_requires_auth(self):
        """Test friends list requires authentication"""
        resp = self.session.get(f"{BASE_URL}/api/friends/list")
        assert resp.status_code in [401, 403], f"Should require auth: {resp.status_code}"
        print("PASSED: Friends list requires authentication")


class TestFriendsFilterInWhosHere:
    """Test that Friends filter option exists in WhosHere match filter"""
    
    def test_friends_filter_option_in_match_filter(self):
        """
        Verify the 'friends' filter option is defined in MATCH_FILTER_OPTIONS.
        This is a code review test - the actual filtering is frontend-only.
        """
        # Read WhosHere.js and verify friends filter exists
        import subprocess
        result = subprocess.run(
            ["grep", "-n", "friends", "/app/frontend/src/pages/WhosHere.js"],
            capture_output=True,
            text=True
        )
        
        # Check that 'friends' is in MATCH_FILTER_OPTIONS
        assert "friends" in result.stdout, "Friends filter not found in WhosHere.js"
        assert "MATCH_FILTER_OPTIONS" in result.stdout or "value: \"friends\"" in result.stdout.lower() or "'friends'" in result.stdout
        print("PASSED: Friends filter option exists in WhosHere.js")
    
    def test_friends_filter_logic_exists(self):
        """Verify the friends filter logic exists in WhosHere.js"""
        import subprocess
        result = subprocess.run(
            ["grep", "-n", "friendIds", "/app/frontend/src/pages/WhosHere.js"],
            capture_output=True,
            text=True
        )
        
        assert "friendIds" in result.stdout, "friendIds state not found in WhosHere.js"
        print("PASSED: friendIds state exists for friends filtering")


class TestConnectionsPageFriendsTab:
    """Test Friends tab implementation in Connections.js"""
    
    def test_friends_tab_exists(self):
        """Verify Friends tab button exists with correct data-testid"""
        import subprocess
        result = subprocess.run(
            ["grep", "-n", "friends-tab", "/app/frontend/src/pages/Connections.js"],
            capture_output=True,
            text=True
        )
        
        assert "friends-tab" in result.stdout, "Friends tab data-testid not found"
        print("PASSED: Friends tab exists with data-testid='friends-tab'")
    
    def test_hide_friend_button_exists(self):
        """Verify Hide Friend button exists with correct data-testid"""
        import subprocess
        result = subprocess.run(
            ["grep", "-n", "hide-friend-", "/app/frontend/src/pages/Connections.js"],
            capture_output=True,
            text=True
        )
        
        assert "hide-friend-" in result.stdout, "Hide friend button data-testid not found"
        print("PASSED: Hide friend button exists with data-testid pattern")
    
    def test_unhide_friend_button_exists(self):
        """Verify Unhide Friend button exists with correct data-testid"""
        import subprocess
        result = subprocess.run(
            ["grep", "-n", "unhide-friend-", "/app/frontend/src/pages/Connections.js"],
            capture_output=True,
            text=True
        )
        
        assert "unhide-friend-" in result.stdout, "Unhide friend button data-testid not found"
        print("PASSED: Unhide friend button exists with data-testid pattern")
    
    def test_remove_friend_button_exists(self):
        """Verify Remove Friend button exists with correct data-testid"""
        import subprocess
        result = subprocess.run(
            ["grep", "-n", "remove-friend-", "/app/frontend/src/pages/Connections.js"],
            capture_output=True,
            text=True
        )
        
        assert "remove-friend-" in result.stdout, "Remove friend button data-testid not found"
        print("PASSED: Remove friend button exists with data-testid pattern")
    
    def test_hidden_friends_section_exists(self):
        """Verify Hidden Friends section exists with correct data-testid"""
        import subprocess
        result = subprocess.run(
            ["grep", "-n", "hidden-friends-section", "/app/frontend/src/pages/Connections.js"],
            capture_output=True,
            text=True
        )
        
        assert "hidden-friends-section" in result.stdout, "Hidden friends section data-testid not found"
        print("PASSED: Hidden friends section exists with data-testid")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
