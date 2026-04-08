"""
Test Presence Logic and Mutual Exclusivity
Tests for:
1. Mutual exclusivity: Accessing /api/discovery/not-here should auto-checkout user from any active venue
2. Mutual exclusivity: Checking into a venue should set presence_status to 'here'
3. Self card visibility: Backend returns self card with is_self=true in venue people list
4. Self card visibility: Backend returns self card with is_self=true in Not Here mode
5. Auto-checkout: Checkins have expires_at field and is_checkin_valid properly validates expiry
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "suzyglam.sw@googlemail.com"
TEST_PASSWORD = "TempPass123!"

# Test venue ID (from problem statement)
TEST_VENUE_ID = "ChIJjzHtpwNveUgRiBzD0Ou1UmY"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for test user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    data = response.json()
    return data.get("token")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get auth headers for API calls"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="module")
def user_data(auth_token):
    """Get current user data"""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    if response.status_code != 200:
        pytest.skip(f"Failed to get user data: {response.status_code}")
    return response.json()


class TestMutualExclusivity:
    """Test mutual exclusivity between venue check-in and Not Here mode"""
    
    def test_checkin_sets_presence_to_here(self, auth_headers, user_data):
        """
        Test: Checking into a venue should set presence_status to 'here'
        """
        # First, ensure user is checked out
        checkout_response = requests.post(f"{BASE_URL}/api/checkout", headers=auth_headers)
        assert checkout_response.status_code == 200, f"Checkout failed: {checkout_response.text}"
        
        # Check in to a venue with location (using user's current location or default)
        user_lat = user_data.get("lat", 53.4808)  # Default to Manchester
        user_lng = user_data.get("lng", -2.2426)
        
        checkin_response = requests.post(
            f"{BASE_URL}/api/checkin/{TEST_VENUE_ID}",
            headers=auth_headers,
            json={"user_lat": user_lat, "user_lng": user_lng}
        )
        
        # Check-in might fail due to GPS distance - that's OK for this test
        # We're testing the presence logic, not GPS enforcement
        if checkin_response.status_code == 403:
            # GPS enforcement - skip this specific assertion but continue
            pytest.skip("GPS enforcement prevented check-in - cannot test presence change")
        
        assert checkin_response.status_code == 200, f"Check-in failed: {checkin_response.text}"
        
        # Verify presence status is now "here"
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert me_response.status_code == 200
        user = me_response.json()
        assert user.get("presence_status") == "here", f"Expected presence_status='here', got '{user.get('presence_status')}'"
    
    def test_not_here_auto_checkouts_from_venue(self, auth_headers, user_data):
        """
        Test: Accessing /api/discovery/not-here should auto-checkout user from any active venue
        """
        # First, try to check in to a venue
        user_lat = user_data.get("lat", 53.4808)
        user_lng = user_data.get("lng", -2.2426)
        
        # Update user location first
        requests.post(
            f"{BASE_URL}/api/location/update",
            headers=auth_headers,
            json={"lat": user_lat, "lng": user_lng}
        )
        
        # Try to check in (may fail due to GPS)
        checkin_response = requests.post(
            f"{BASE_URL}/api/checkin/{TEST_VENUE_ID}",
            headers=auth_headers,
            json={"user_lat": user_lat, "user_lng": user_lng}
        )
        
        # Check current checkin status
        current_checkin = requests.get(f"{BASE_URL}/api/checkin/current", headers=auth_headers)
        was_checked_in = current_checkin.status_code == 200 and current_checkin.json().get("checked_in", False)
        
        # Now access Not Here mode - this should auto-checkout
        not_here_response = requests.get(
            f"{BASE_URL}/api/discovery/not-here?radius=0-25",
            headers=auth_headers
        )
        
        # The endpoint might return 400 if no location, but should still process checkout
        # Accept 200 or 400 (location required error)
        assert not_here_response.status_code in [200, 400], f"Not Here endpoint failed: {not_here_response.text}"
        
        # Verify user is now checked out
        current_checkin_after = requests.get(f"{BASE_URL}/api/checkin/current", headers=auth_headers)
        assert current_checkin_after.status_code == 200
        checkin_data = current_checkin_after.json()
        
        # User should NOT be checked in anymore
        assert checkin_data.get("checked_in") == False, f"User should be checked out after accessing Not Here, but got: {checkin_data}"
    
    def test_not_here_sets_presence_to_not_here(self, auth_headers, user_data):
        """
        Test: Accessing Not Here mode should set presence_status to 'not_here'
        """
        # Update location first
        user_lat = user_data.get("lat", 53.4808)
        user_lng = user_data.get("lng", -2.2426)
        
        requests.post(
            f"{BASE_URL}/api/location/update",
            headers=auth_headers,
            json={"lat": user_lat, "lng": user_lng}
        )
        
        # Access Not Here mode
        not_here_response = requests.get(
            f"{BASE_URL}/api/discovery/not-here?radius=0-25",
            headers=auth_headers
        )
        
        # Verify presence status
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert me_response.status_code == 200
        user = me_response.json()
        assert user.get("presence_status") == "not_here", f"Expected presence_status='not_here', got '{user.get('presence_status')}'"


class TestSelfCardVisibility:
    """Test that self card is returned with is_self=true in people lists"""
    
    def test_self_card_in_not_here_mode(self, auth_headers, user_data):
        """
        Test: Backend returns self card with is_self=true in Not Here mode
        """
        # Update location first
        user_lat = user_data.get("lat", 53.4808)
        user_lng = user_data.get("lng", -2.2426)
        
        requests.post(
            f"{BASE_URL}/api/location/update",
            headers=auth_headers,
            json={"lat": user_lat, "lng": user_lng}
        )
        
        # Access Not Here mode
        not_here_response = requests.get(
            f"{BASE_URL}/api/discovery/not-here?radius=0-25",
            headers=auth_headers
        )
        
        if not_here_response.status_code == 400:
            pytest.skip("Location required for Not Here mode")
        
        assert not_here_response.status_code == 200, f"Not Here failed: {not_here_response.text}"
        
        people = not_here_response.json()
        
        # Find self card
        self_cards = [p for p in people if p.get("is_self") == True]
        
        assert len(self_cards) >= 1, f"Expected at least 1 self card with is_self=true, found {len(self_cards)}"
        
        self_card = self_cards[0]
        assert self_card.get("id") == user_data.get("id"), "Self card ID should match current user ID"
        assert self_card.get("is_self") == True, "Self card should have is_self=true"
    
    def test_self_card_in_venue_people_list(self, auth_headers, user_data):
        """
        Test: Backend returns self card with is_self=true in venue people list
        """
        # First, we need to be checked in at a venue
        user_lat = user_data.get("lat", 53.4808)
        user_lng = user_data.get("lng", -2.2426)
        
        # Try to check in
        checkin_response = requests.post(
            f"{BASE_URL}/api/checkin/{TEST_VENUE_ID}",
            headers=auth_headers,
            json={"user_lat": user_lat, "user_lng": user_lng}
        )
        
        if checkin_response.status_code == 403:
            pytest.skip("GPS enforcement prevented check-in - cannot test venue people list")
        
        assert checkin_response.status_code == 200, f"Check-in failed: {checkin_response.text}"
        
        # Get people at venue
        people_response = requests.get(
            f"{BASE_URL}/api/venues/{TEST_VENUE_ID}/people",
            headers=auth_headers
        )
        
        assert people_response.status_code == 200, f"Get people failed: {people_response.text}"
        
        people = people_response.json()
        
        # Find self card
        self_cards = [p for p in people if p.get("is_self") == True]
        
        assert len(self_cards) >= 1, f"Expected at least 1 self card with is_self=true in venue, found {len(self_cards)}"
        
        self_card = self_cards[0]
        assert self_card.get("id") == user_data.get("id"), "Self card ID should match current user ID"
        assert self_card.get("is_self") == True, "Self card should have is_self=true"
    
    def test_self_card_is_first_in_list(self, auth_headers, user_data):
        """
        Test: Self card should be first in the people list
        """
        # Update location
        user_lat = user_data.get("lat", 53.4808)
        user_lng = user_data.get("lng", -2.2426)
        
        requests.post(
            f"{BASE_URL}/api/location/update",
            headers=auth_headers,
            json={"lat": user_lat, "lng": user_lng}
        )
        
        # Access Not Here mode
        not_here_response = requests.get(
            f"{BASE_URL}/api/discovery/not-here?radius=0-25",
            headers=auth_headers
        )
        
        if not_here_response.status_code == 400:
            pytest.skip("Location required for Not Here mode")
        
        assert not_here_response.status_code == 200
        
        people = not_here_response.json()
        
        if len(people) > 0:
            first_person = people[0]
            assert first_person.get("is_self") == True, f"First person in list should be self card, got is_self={first_person.get('is_self')}"


class TestAutoCheckout:
    """Test auto-checkout functionality with expires_at field"""
    
    def test_checkin_has_expires_at_field(self, auth_headers, user_data):
        """
        Test: Checkins have expires_at field
        """
        # First checkout
        requests.post(f"{BASE_URL}/api/checkout", headers=auth_headers)
        
        # Check in
        user_lat = user_data.get("lat", 53.4808)
        user_lng = user_data.get("lng", -2.2426)
        
        checkin_response = requests.post(
            f"{BASE_URL}/api/checkin/{TEST_VENUE_ID}",
            headers=auth_headers,
            json={"user_lat": user_lat, "user_lng": user_lng}
        )
        
        if checkin_response.status_code == 403:
            pytest.skip("GPS enforcement prevented check-in")
        
        assert checkin_response.status_code == 200
        
        # Get current checkin
        current_response = requests.get(f"{BASE_URL}/api/checkin/current", headers=auth_headers)
        assert current_response.status_code == 200
        
        data = current_response.json()
        assert data.get("checked_in") == True
        
        checkin = data.get("checkin", {})
        assert "expires_at" in checkin, f"Checkin should have expires_at field, got: {checkin.keys()}"
        
        # Verify expires_at is a valid ISO timestamp
        expires_at = checkin.get("expires_at")
        assert expires_at is not None, "expires_at should not be None"
        
        # Try to parse it
        try:
            datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        except ValueError:
            pytest.fail(f"expires_at is not a valid ISO timestamp: {expires_at}")
    
    def test_heartbeat_extends_expiry(self, auth_headers, user_data):
        """
        Test: Heartbeat endpoint extends the expiry time
        """
        # First checkout and check in
        requests.post(f"{BASE_URL}/api/checkout", headers=auth_headers)
        
        user_lat = user_data.get("lat", 53.4808)
        user_lng = user_data.get("lng", -2.2426)
        
        checkin_response = requests.post(
            f"{BASE_URL}/api/checkin/{TEST_VENUE_ID}",
            headers=auth_headers,
            json={"user_lat": user_lat, "user_lng": user_lng}
        )
        
        if checkin_response.status_code == 403:
            pytest.skip("GPS enforcement prevented check-in")
        
        # Get initial expiry
        current1 = requests.get(f"{BASE_URL}/api/checkin/current", headers=auth_headers)
        initial_expires = current1.json().get("checkin", {}).get("expires_at")
        
        # Send heartbeat
        heartbeat_response = requests.post(f"{BASE_URL}/api/checkin/heartbeat", headers=auth_headers)
        assert heartbeat_response.status_code == 200
        
        heartbeat_data = heartbeat_response.json()
        assert heartbeat_data.get("active") == True, "Heartbeat should return active=True"
        assert "expires_at" in heartbeat_data, "Heartbeat should return new expires_at"
        
        # Verify expiry was extended
        new_expires = heartbeat_data.get("expires_at")
        assert new_expires is not None
        
        # The new expiry should be >= initial expiry
        initial_dt = datetime.fromisoformat(initial_expires.replace("Z", "+00:00"))
        new_dt = datetime.fromisoformat(new_expires.replace("Z", "+00:00"))
        assert new_dt >= initial_dt, "Heartbeat should extend or maintain expiry time"


class TestCheckoutButton:
    """Test checkout button behavior"""
    
    def test_checkout_endpoint_works(self, auth_headers):
        """
        Test: POST /api/checkout works correctly
        """
        # Checkout
        checkout_response = requests.post(f"{BASE_URL}/api/checkout", headers=auth_headers)
        assert checkout_response.status_code == 200
        
        data = checkout_response.json()
        assert "message" in data
        assert "Checked out" in data.get("message", "")
    
    def test_checkout_clears_checkin(self, auth_headers, user_data):
        """
        Test: Checkout clears the active check-in
        """
        # First check in
        user_lat = user_data.get("lat", 53.4808)
        user_lng = user_data.get("lng", -2.2426)
        
        checkin_response = requests.post(
            f"{BASE_URL}/api/checkin/{TEST_VENUE_ID}",
            headers=auth_headers,
            json={"user_lat": user_lat, "user_lng": user_lng}
        )
        
        if checkin_response.status_code == 403:
            pytest.skip("GPS enforcement prevented check-in")
        
        # Verify checked in
        current1 = requests.get(f"{BASE_URL}/api/checkin/current", headers=auth_headers)
        assert current1.json().get("checked_in") == True
        
        # Checkout
        checkout_response = requests.post(f"{BASE_URL}/api/checkout", headers=auth_headers)
        assert checkout_response.status_code == 200
        
        # Verify checked out
        current2 = requests.get(f"{BASE_URL}/api/checkin/current", headers=auth_headers)
        assert current2.json().get("checked_in") == False
    
    def test_checkout_sets_presence_to_not_here(self, auth_headers, user_data):
        """
        Test: Checkout sets presence_status to 'not_here'
        """
        # First check in
        user_lat = user_data.get("lat", 53.4808)
        user_lng = user_data.get("lng", -2.2426)
        
        checkin_response = requests.post(
            f"{BASE_URL}/api/checkin/{TEST_VENUE_ID}",
            headers=auth_headers,
            json={"user_lat": user_lat, "user_lng": user_lng}
        )
        
        if checkin_response.status_code == 403:
            pytest.skip("GPS enforcement prevented check-in")
        
        # Checkout
        requests.post(f"{BASE_URL}/api/checkout", headers=auth_headers)
        
        # Verify presence status
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert me_response.status_code == 200
        user = me_response.json()
        assert user.get("presence_status") == "not_here", f"Expected presence_status='not_here' after checkout, got '{user.get('presence_status')}'"


class TestCurrentCheckinEndpoint:
    """Test the /api/checkin/current endpoint"""
    
    def test_current_checkin_returns_venue_id(self, auth_headers, user_data):
        """
        Test: /api/checkin/current returns checkin with venue_id
        """
        # First check in
        user_lat = user_data.get("lat", 53.4808)
        user_lng = user_data.get("lng", -2.2426)
        
        checkin_response = requests.post(
            f"{BASE_URL}/api/checkin/{TEST_VENUE_ID}",
            headers=auth_headers,
            json={"user_lat": user_lat, "user_lng": user_lng}
        )
        
        if checkin_response.status_code == 403:
            pytest.skip("GPS enforcement prevented check-in")
        
        # Get current checkin
        current_response = requests.get(f"{BASE_URL}/api/checkin/current", headers=auth_headers)
        assert current_response.status_code == 200
        
        data = current_response.json()
        assert data.get("checked_in") == True
        
        checkin = data.get("checkin", {})
        assert "venue_id" in checkin, f"Checkin should have venue_id, got: {checkin.keys()}"
        assert checkin.get("venue_id") == TEST_VENUE_ID, f"venue_id should match, expected {TEST_VENUE_ID}, got {checkin.get('venue_id')}"
    
    def test_current_checkin_when_not_checked_in(self, auth_headers):
        """
        Test: /api/checkin/current returns checked_in=false when not checked in
        """
        # Checkout first
        requests.post(f"{BASE_URL}/api/checkout", headers=auth_headers)
        
        # Get current checkin
        current_response = requests.get(f"{BASE_URL}/api/checkin/current", headers=auth_headers)
        assert current_response.status_code == 200
        
        data = current_response.json()
        assert data.get("checked_in") == False, f"Expected checked_in=False, got {data}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
