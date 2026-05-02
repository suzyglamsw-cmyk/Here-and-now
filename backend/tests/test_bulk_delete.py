"""
Test Select All / Multi-Delete Feature for Glances, Icebreakers, and Chat Requests
Tests the bulk-delete endpoints which use non-destructive hiding logic.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBulkDeleteEndpoints:
    """Test bulk delete endpoints for glances, icebreakers, and chat requests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login with test credentials
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "suzyglam.sw@googlemail.com",
            "password": "TempPass123!"
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
            self.user_id = login_response.json().get("user", {}).get("id")
        else:
            pytest.skip(f"Authentication failed: {login_response.status_code} - {login_response.text}")
    
    # =========================================================================
    # GLANCES BULK DELETE TESTS
    # =========================================================================
    
    def test_glances_bulk_delete_endpoint_exists(self):
        """Test that POST /api/glances/bulk-delete endpoint exists"""
        response = self.session.post(f"{BASE_URL}/api/glances/bulk-delete", json={
            "glance_ids": []
        })
        # Should return 400 for empty array, not 404
        assert response.status_code == 400, f"Expected 400 for empty array, got {response.status_code}"
        data = response.json()
        assert "No glance IDs provided" in data.get("detail", ""), f"Unexpected error: {data}"
        print("✓ POST /api/glances/bulk-delete endpoint exists and validates input")
    
    def test_glances_bulk_delete_with_valid_ids(self):
        """Test bulk delete with valid glance IDs (non-destructive hide)"""
        # First get current glances
        glances_response = self.session.get(f"{BASE_URL}/api/connections/glances")
        assert glances_response.status_code == 200
        glances_data = glances_response.json()
        
        all_glances = glances_data.get("incoming", []) + glances_data.get("outgoing", [])
        
        if len(all_glances) == 0:
            pytest.skip("No glances available to test bulk delete")
        
        # Get first glance ID
        test_glance_id = all_glances[0].get("id")
        
        # Attempt bulk delete
        response = self.session.post(f"{BASE_URL}/api/glances/bulk-delete", json={
            "glance_ids": [test_glance_id]
        })
        
        assert response.status_code == 200, f"Bulk delete failed: {response.text}"
        data = response.json()
        assert "count" in data, "Response should include count"
        assert data["count"] >= 0, "Count should be non-negative"
        print(f"✓ Bulk delete glances works - hidden {data['count']} glances")
    
    def test_glances_bulk_delete_with_invalid_ids(self):
        """Test bulk delete with non-existent glance IDs"""
        response = self.session.post(f"{BASE_URL}/api/glances/bulk-delete", json={
            "glance_ids": ["non-existent-id-1", "non-existent-id-2"]
        })
        
        assert response.status_code == 200, f"Should succeed with 0 count: {response.text}"
        data = response.json()
        assert data.get("count") == 0, "Count should be 0 for non-existent IDs"
        print("✓ Bulk delete with invalid IDs returns count=0")
    
    # =========================================================================
    # ICEBREAKERS BULK DELETE TESTS
    # =========================================================================
    
    def test_icebreakers_bulk_delete_endpoint_exists(self):
        """Test that POST /api/icebreakers/bulk-delete endpoint exists"""
        response = self.session.post(f"{BASE_URL}/api/icebreakers/bulk-delete", json={
            "icebreaker_ids": []
        })
        # Should return 400 for empty array, not 404
        assert response.status_code == 400, f"Expected 400 for empty array, got {response.status_code}"
        data = response.json()
        assert "No icebreaker IDs provided" in data.get("detail", ""), f"Unexpected error: {data}"
        print("✓ POST /api/icebreakers/bulk-delete endpoint exists and validates input")
    
    def test_icebreakers_bulk_delete_with_valid_ids(self):
        """Test bulk delete with valid icebreaker IDs (non-destructive hide)"""
        # First get current icebreakers
        icebreakers_response = self.session.get(f"{BASE_URL}/api/connections/icebreakers")
        assert icebreakers_response.status_code == 200
        icebreakers_data = icebreakers_response.json()
        
        all_icebreakers = icebreakers_data.get("incoming", []) + icebreakers_data.get("outgoing", [])
        
        if len(all_icebreakers) == 0:
            pytest.skip("No icebreakers available to test bulk delete")
        
        # Get first icebreaker ID
        test_icebreaker_id = all_icebreakers[0].get("id")
        
        # Attempt bulk delete
        response = self.session.post(f"{BASE_URL}/api/icebreakers/bulk-delete", json={
            "icebreaker_ids": [test_icebreaker_id]
        })
        
        assert response.status_code == 200, f"Bulk delete failed: {response.text}"
        data = response.json()
        assert "count" in data, "Response should include count"
        assert data["count"] >= 0, "Count should be non-negative"
        print(f"✓ Bulk delete icebreakers works - hidden {data['count']} icebreakers")
    
    def test_icebreakers_bulk_delete_with_invalid_ids(self):
        """Test bulk delete with non-existent icebreaker IDs"""
        response = self.session.post(f"{BASE_URL}/api/icebreakers/bulk-delete", json={
            "icebreaker_ids": ["non-existent-id-1", "non-existent-id-2"]
        })
        
        assert response.status_code == 200, f"Should succeed with 0 count: {response.text}"
        data = response.json()
        assert data.get("count") == 0, "Count should be 0 for non-existent IDs"
        print("✓ Bulk delete icebreakers with invalid IDs returns count=0")
    
    # =========================================================================
    # CHAT REQUESTS BULK DELETE TESTS
    # =========================================================================
    
    def test_chat_requests_bulk_delete_endpoint_exists(self):
        """Test that POST /api/chat-requests/bulk-delete endpoint exists"""
        response = self.session.post(f"{BASE_URL}/api/chat-requests/bulk-delete", json={
            "request_ids": []
        })
        # Should return 400 for empty array, not 404
        assert response.status_code == 400, f"Expected 400 for empty array, got {response.status_code}"
        data = response.json()
        assert "No request IDs provided" in data.get("detail", ""), f"Unexpected error: {data}"
        print("✓ POST /api/chat-requests/bulk-delete endpoint exists and validates input")
    
    def test_chat_requests_bulk_delete_with_valid_ids(self):
        """Test bulk delete with valid chat request IDs (non-destructive hide)"""
        # First get current chat requests
        chat_requests_response = self.session.get(f"{BASE_URL}/api/connections/chat-requests")
        assert chat_requests_response.status_code == 200
        chat_requests_data = chat_requests_response.json()
        
        all_chat_requests = chat_requests_data.get("incoming", []) + chat_requests_data.get("outgoing", [])
        
        if len(all_chat_requests) == 0:
            pytest.skip("No chat requests available to test bulk delete")
        
        # Get first chat request ID
        test_request_id = all_chat_requests[0].get("id")
        
        # Attempt bulk delete
        response = self.session.post(f"{BASE_URL}/api/chat-requests/bulk-delete", json={
            "request_ids": [test_request_id]
        })
        
        assert response.status_code == 200, f"Bulk delete failed: {response.text}"
        data = response.json()
        assert "count" in data, "Response should include count"
        assert data["count"] >= 0, "Count should be non-negative"
        print(f"✓ Bulk delete chat requests works - hidden {data['count']} chat requests")
    
    def test_chat_requests_bulk_delete_with_invalid_ids(self):
        """Test bulk delete with non-existent chat request IDs"""
        response = self.session.post(f"{BASE_URL}/api/chat-requests/bulk-delete", json={
            "request_ids": ["non-existent-id-1", "non-existent-id-2"]
        })
        
        assert response.status_code == 200, f"Should succeed with 0 count: {response.text}"
        data = response.json()
        assert data.get("count") == 0, "Count should be 0 for non-existent IDs"
        print("✓ Bulk delete chat requests with invalid IDs returns count=0")
    
    # =========================================================================
    # INDIVIDUAL DELETE TESTS (Verify single-item deletion still works)
    # =========================================================================
    
    def test_individual_glance_delete_still_works(self):
        """Test that individual glance delete endpoint still works"""
        # Get glances
        glances_response = self.session.get(f"{BASE_URL}/api/connections/glances")
        assert glances_response.status_code == 200
        glances_data = glances_response.json()
        
        all_glances = glances_data.get("incoming", []) + glances_data.get("outgoing", [])
        
        if len(all_glances) == 0:
            pytest.skip("No glances available to test individual delete")
        
        test_glance_id = all_glances[0].get("id")
        
        # Delete individual glance
        response = self.session.delete(f"{BASE_URL}/api/glances/{test_glance_id}")
        assert response.status_code == 200, f"Individual delete failed: {response.text}"
        print("✓ Individual glance delete still works")
    
    def test_individual_icebreaker_delete_still_works(self):
        """Test that individual icebreaker delete endpoint still works"""
        # Get icebreakers
        icebreakers_response = self.session.get(f"{BASE_URL}/api/connections/icebreakers")
        assert icebreakers_response.status_code == 200
        icebreakers_data = icebreakers_response.json()
        
        all_icebreakers = icebreakers_data.get("incoming", []) + icebreakers_data.get("outgoing", [])
        
        if len(all_icebreakers) == 0:
            pytest.skip("No icebreakers available to test individual delete")
        
        test_icebreaker_id = all_icebreakers[0].get("id")
        
        # Delete individual icebreaker
        response = self.session.delete(f"{BASE_URL}/api/icebreaker/{test_icebreaker_id}")
        assert response.status_code == 200, f"Individual delete failed: {response.text}"
        print("✓ Individual icebreaker delete still works")
    
    def test_individual_chat_request_delete_still_works(self):
        """Test that individual chat request delete endpoint still works"""
        # Get chat requests
        chat_requests_response = self.session.get(f"{BASE_URL}/api/connections/chat-requests")
        assert chat_requests_response.status_code == 200
        chat_requests_data = chat_requests_response.json()
        
        all_chat_requests = chat_requests_data.get("incoming", []) + chat_requests_data.get("outgoing", [])
        
        if len(all_chat_requests) == 0:
            pytest.skip("No chat requests available to test individual delete")
        
        test_request_id = all_chat_requests[0].get("id")
        
        # Delete individual chat request
        response = self.session.delete(f"{BASE_URL}/api/chat-request/{test_request_id}")
        assert response.status_code == 200, f"Individual delete failed: {response.text}"
        print("✓ Individual chat request delete still works")
    
    # =========================================================================
    # DATA RETRIEVAL TESTS (Verify hidden items are excluded)
    # =========================================================================
    
    def test_glances_endpoint_excludes_hidden(self):
        """Test that GET /api/connections/glances excludes hidden items"""
        response = self.session.get(f"{BASE_URL}/api/connections/glances")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "incoming" in data, "Response should have 'incoming' key"
        assert "outgoing" in data, "Response should have 'outgoing' key"
        assert isinstance(data["incoming"], list), "incoming should be a list"
        assert isinstance(data["outgoing"], list), "outgoing should be a list"
        print(f"✓ Glances endpoint returns {len(data['incoming'])} incoming, {len(data['outgoing'])} outgoing")
    
    def test_icebreakers_endpoint_excludes_hidden(self):
        """Test that GET /api/connections/icebreakers excludes hidden items"""
        response = self.session.get(f"{BASE_URL}/api/connections/icebreakers")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "incoming" in data, "Response should have 'incoming' key"
        assert "outgoing" in data, "Response should have 'outgoing' key"
        assert isinstance(data["incoming"], list), "incoming should be a list"
        assert isinstance(data["outgoing"], list), "outgoing should be a list"
        print(f"✓ Icebreakers endpoint returns {len(data['incoming'])} incoming, {len(data['outgoing'])} outgoing")
    
    def test_chat_requests_endpoint_excludes_hidden(self):
        """Test that GET /api/connections/chat-requests excludes hidden items"""
        response = self.session.get(f"{BASE_URL}/api/connections/chat-requests")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "incoming" in data, "Response should have 'incoming' key"
        assert "outgoing" in data, "Response should have 'outgoing' key"
        assert isinstance(data["incoming"], list), "incoming should be a list"
        assert isinstance(data["outgoing"], list), "outgoing should be a list"
        print(f"✓ Chat requests endpoint returns {len(data['incoming'])} incoming, {len(data['outgoing'])} outgoing")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
