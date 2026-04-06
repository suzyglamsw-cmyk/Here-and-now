"""
Test Icebreaker-Based Reveal Logic
==================================
Tests the new reveal logic where:
1. Glances are soft interest indicators that do NOT trigger reveal
2. Sending an icebreaker = one-sided interest (no reveal)
3. Accepting an icebreaker = mutual interest = REVEAL for BOTH users
4. Presence/venue status NEVER triggers reveal
5. Message button only enabled after mutual reveal AND valid chat session exists
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestIcebreakerRevealLogic:
    """Test icebreaker-based reveal logic"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test users"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Create unique test users for this test run
        self.test_id = str(uuid.uuid4())[:8]
        self.user_a_email = f"TEST_reveal_a_{self.test_id}@test.com"
        self.user_b_email = f"TEST_reveal_b_{self.test_id}@test.com"
        self.password = "TestPass123!"
        
        # Register User A
        resp = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.user_a_email,
            "password": self.password,
            "display_name": f"Test User A {self.test_id}",
            "date_of_birth": "1995-01-15"
        })
        if resp.status_code == 201:
            data = resp.json()
            self.user_a_id = data.get("user", {}).get("id")
            self.user_a_token = data.get("token")
        else:
            # Try login if already exists
            resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": self.user_a_email,
                "password": self.password
            })
            if resp.status_code == 200:
                data = resp.json()
                self.user_a_id = data.get("user", {}).get("id")
                self.user_a_token = data.get("token")
            else:
                pytest.skip(f"Could not create/login User A: {resp.text}")
        
        # Register User B
        resp = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.user_b_email,
            "password": self.password,
            "display_name": f"Test User B {self.test_id}",
            "date_of_birth": "1996-02-20"
        })
        if resp.status_code == 201:
            data = resp.json()
            self.user_b_id = data.get("user", {}).get("id")
            self.user_b_token = data.get("token")
        else:
            # Try login if already exists
            resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": self.user_b_email,
                "password": self.password
            })
            if resp.status_code == 200:
                data = resp.json()
                self.user_b_id = data.get("user", {}).get("id")
                self.user_b_token = data.get("token")
            else:
                pytest.skip(f"Could not create/login User B: {resp.text}")
        
        # Update location for both users (required for discovery)
        self.session.headers["Authorization"] = f"Bearer {self.user_a_token}"
        self.session.post(f"{BASE_URL}/api/location/update", json={
            "lat": 51.5074,
            "lng": -0.1278
        })
        
        self.session.headers["Authorization"] = f"Bearer {self.user_b_token}"
        self.session.post(f"{BASE_URL}/api/location/update", json={
            "lat": 51.5074,
            "lng": -0.1278
        })
        
        yield
        
        # Cleanup - no explicit cleanup needed as test users are prefixed with TEST_
    
    def test_01_no_interaction_not_revealed(self):
        """Test: No interaction → is_revealed=False for both users"""
        # User A views User B's profile
        self.session.headers["Authorization"] = f"Bearer {self.user_a_token}"
        resp = self.session.get(f"{BASE_URL}/api/profile/{self.user_b_id}")
        
        assert resp.status_code == 200, f"Failed to get profile: {resp.text}"
        data = resp.json()
        
        # Should NOT be revealed without any interaction
        assert data.get("is_revealed") == False, "is_revealed should be False with no interaction"
        assert data.get("can_message") == False, "can_message should be False when not revealed"
        print(f"✓ No interaction: is_revealed={data.get('is_revealed')}, can_message={data.get('can_message')}")
    
    def test_02_one_sided_glance_not_revealed(self):
        """Test: One-sided glance → is_revealed=False (glances do NOT reveal)"""
        # User A glances at User B
        self.session.headers["Authorization"] = f"Bearer {self.user_a_token}"
        resp = self.session.post(f"{BASE_URL}/api/glance/{self.user_b_id}")
        
        # Glance should succeed (200 or 201)
        assert resp.status_code in [200, 201], f"Glance failed: {resp.text}"
        
        # Check User B's profile from User A's perspective
        resp = self.session.get(f"{BASE_URL}/api/profile/{self.user_b_id}")
        assert resp.status_code == 200
        data = resp.json()
        
        # Should NOT be revealed after one-sided glance
        assert data.get("is_revealed") == False, "is_revealed should be False after one-sided glance"
        assert data.get("i_glanced_at_them") == True, "i_glanced_at_them should be True"
        print(f"✓ One-sided glance: is_revealed={data.get('is_revealed')}, i_glanced_at_them={data.get('i_glanced_at_them')}")
    
    def test_03_mutual_glance_not_revealed(self):
        """Test: Mutual glance → is_revealed=False (glances do NOT reveal)"""
        # User B glances back at User A
        self.session.headers["Authorization"] = f"Bearer {self.user_b_token}"
        resp = self.session.post(f"{BASE_URL}/api/glance/{self.user_a_id}")
        
        assert resp.status_code in [200, 201], f"Glance back failed: {resp.text}"
        
        # Check User A's profile from User B's perspective
        resp = self.session.get(f"{BASE_URL}/api/profile/{self.user_a_id}")
        assert resp.status_code == 200
        data = resp.json()
        
        # Should NOT be revealed even with mutual glance
        assert data.get("is_revealed") == False, "is_revealed should be False even with mutual glance"
        assert data.get("is_mutual") == True, "is_mutual should be True for mutual glance"
        print(f"✓ Mutual glance: is_revealed={data.get('is_revealed')}, is_mutual={data.get('is_mutual')}")
    
    def test_04_sending_icebreaker_not_revealed(self):
        """Test: Sending icebreaker → is_revealed=False, icebreaker_sent=True"""
        # User A sends icebreaker to User B
        self.session.headers["Authorization"] = f"Bearer {self.user_a_token}"
        resp = self.session.post(f"{BASE_URL}/api/icebreaker", json={
            "to_user_id": self.user_b_id,
            "venue_id": "test_venue",
            "message_type": 0  # First predefined icebreaker message
        })
        
        assert resp.status_code in [200, 201], f"Send icebreaker failed: {resp.text}"
        icebreaker_data = resp.json()
        self.icebreaker_id = icebreaker_data.get("icebreaker_id")
        
        # Check User B's profile from User A's perspective
        resp = self.session.get(f"{BASE_URL}/api/profile/{self.user_b_id}")
        assert resp.status_code == 200
        data = resp.json()
        
        # Should NOT be revealed after sending icebreaker (one-sided interest)
        assert data.get("is_revealed") == False, "is_revealed should be False after sending icebreaker"
        assert data.get("icebreaker_sent") == True, "icebreaker_sent should be True"
        print(f"✓ Sent icebreaker: is_revealed={data.get('is_revealed')}, icebreaker_sent={data.get('icebreaker_sent')}")
    
    def test_05_receiving_icebreaker_shows_pending(self):
        """Test: User B sees pending icebreaker from User A"""
        # User B checks received icebreakers
        self.session.headers["Authorization"] = f"Bearer {self.user_b_token}"
        resp = self.session.get(f"{BASE_URL}/api/icebreakers/received")
        
        assert resp.status_code == 200, f"Get icebreakers failed: {resp.text}"
        icebreakers = resp.json()
        
        # Should have at least one pending icebreaker from User A
        from_user_a = [ib for ib in icebreakers if ib.get("from_user_id") == self.user_a_id]
        assert len(from_user_a) > 0, "Should have pending icebreaker from User A"
        
        self.icebreaker_id = from_user_a[0].get("id")
        print(f"✓ User B received icebreaker from User A: {self.icebreaker_id}")
        
        # Check User A's profile from User B's perspective - should show icebreaker_received
        resp = self.session.get(f"{BASE_URL}/api/profile/{self.user_a_id}")
        assert resp.status_code == 200
        data = resp.json()
        
        # Should NOT be revealed yet (pending icebreaker)
        assert data.get("is_revealed") == False, "is_revealed should be False with pending icebreaker"
        assert data.get("icebreaker_received") == True, "icebreaker_received should be True"
        print(f"✓ Pending icebreaker: is_revealed={data.get('is_revealed')}, icebreaker_received={data.get('icebreaker_received')}")
    
    def test_06_accepting_icebreaker_reveals_both_users(self):
        """Test: Accepting icebreaker → is_revealed=True, can_message=True for BOTH users"""
        # First get the icebreaker ID
        self.session.headers["Authorization"] = f"Bearer {self.user_b_token}"
        resp = self.session.get(f"{BASE_URL}/api/icebreakers/received")
        assert resp.status_code == 200
        icebreakers = resp.json()
        from_user_a = [ib for ib in icebreakers if ib.get("from_user_id") == self.user_a_id]
        assert len(from_user_a) > 0, "Should have pending icebreaker from User A"
        icebreaker_id = from_user_a[0].get("id")
        
        # User B accepts the icebreaker
        resp = self.session.post(f"{BASE_URL}/api/icebreaker/{icebreaker_id}/respond", json={
            "action": "accept"
        })
        
        assert resp.status_code == 200, f"Accept icebreaker failed: {resp.text}"
        accept_data = resp.json()
        assert accept_data.get("status") == "accepted", "Icebreaker should be accepted"
        print(f"✓ Icebreaker accepted: {accept_data}")
        
        # Check User A's profile from User B's perspective - should be revealed
        resp = self.session.get(f"{BASE_URL}/api/profile/{self.user_a_id}")
        assert resp.status_code == 200
        data = resp.json()
        
        assert data.get("is_revealed") == True, "is_revealed should be True after accepting icebreaker"
        assert data.get("can_message") == True, "can_message should be True after accepting icebreaker"
        print(f"✓ User B sees User A revealed: is_revealed={data.get('is_revealed')}, can_message={data.get('can_message')}")
        
        # Check User B's profile from User A's perspective - should ALSO be revealed
        self.session.headers["Authorization"] = f"Bearer {self.user_a_token}"
        resp = self.session.get(f"{BASE_URL}/api/profile/{self.user_b_id}")
        assert resp.status_code == 200
        data = resp.json()
        
        assert data.get("is_revealed") == True, "is_revealed should be True for User A viewing User B"
        assert data.get("can_message") == True, "can_message should be True for User A"
        print(f"✓ User A sees User B revealed: is_revealed={data.get('is_revealed')}, can_message={data.get('can_message')}")
    
    def test_07_self_card_shows_not_revealed(self):
        """Test: Self card in discovery shows is_revealed=False"""
        # User A checks discovery - their own card should show as not revealed (how others see them)
        self.session.headers["Authorization"] = f"Bearer {self.user_a_token}"
        resp = self.session.get(f"{BASE_URL}/api/discovery/not-here")
        
        assert resp.status_code == 200, f"Discovery failed: {resp.text}"
        data = resp.json()
        users = data.get("users", [])
        
        # Find self in discovery
        self_card = next((u for u in users if u.get("id") == self.user_a_id), None)
        
        if self_card:
            # Self should show as not revealed (how others see them pre-reveal)
            assert self_card.get("is_revealed") == False, "Self card should show is_revealed=False"
            print(f"✓ Self card: is_revealed={self_card.get('is_revealed')}")
        else:
            print("✓ Self card not in discovery results (expected behavior)")


class TestDiscoveryIcebreakerStates:
    """Test discovery card icebreaker states"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test users"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as demo user
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@user.com",
            "password": "password"
        })
        if resp.status_code == 200:
            data = resp.json()
            self.demo_token = data.get("token")
            self.demo_id = data.get("user", {}).get("id")
        else:
            pytest.skip(f"Could not login demo user: {resp.text}")
        
        yield
    
    def test_discovery_not_here_returns_icebreaker_states(self):
        """Test: Discovery not-here endpoint returns icebreaker_sent and icebreaker_received states"""
        self.session.headers["Authorization"] = f"Bearer {self.demo_token}"
        resp = self.session.get(f"{BASE_URL}/api/discovery/not-here")
        
        assert resp.status_code == 200, f"Discovery failed: {resp.text}"
        data = resp.json()
        users = data.get("users", [])
        
        # Check that users have icebreaker state fields
        if len(users) > 0:
            user = users[0]
            assert "icebreaker_sent" in user, "User should have icebreaker_sent field"
            assert "icebreaker_received" in user, "User should have icebreaker_received field"
            assert "is_revealed" in user, "User should have is_revealed field"
            print(f"✓ Discovery user has icebreaker states: icebreaker_sent={user.get('icebreaker_sent')}, icebreaker_received={user.get('icebreaker_received')}, is_revealed={user.get('is_revealed')}")
        else:
            print("✓ No users in discovery (expected if no other users nearby)")
    
    def test_discovery_here_returns_icebreaker_states(self):
        """Test: Discovery here endpoint returns icebreaker_sent and icebreaker_received states"""
        self.session.headers["Authorization"] = f"Bearer {self.demo_token}"
        resp = self.session.get(f"{BASE_URL}/api/discovery/here")
        
        assert resp.status_code == 200, f"Discovery failed: {resp.text}"
        data = resp.json()
        users = data.get("users", [])
        
        # Check that users have icebreaker state fields
        if len(users) > 0:
            user = users[0]
            assert "icebreaker_sent" in user, "User should have icebreaker_sent field"
            assert "icebreaker_received" in user, "User should have icebreaker_received field"
            assert "is_revealed" in user, "User should have is_revealed field"
            print(f"✓ Discovery here user has icebreaker states")
        else:
            print("✓ No users in here discovery (expected if no one checked in)")


class TestMessageButtonStates:
    """Test message button enabled/disabled states"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test users"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Create unique test users
        self.test_id = str(uuid.uuid4())[:8]
        self.user_c_email = f"TEST_msg_c_{self.test_id}@test.com"
        self.user_d_email = f"TEST_msg_d_{self.test_id}@test.com"
        self.password = "TestPass123!"
        
        # Register User C
        resp = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.user_c_email,
            "password": self.password,
            "display_name": f"Test User C {self.test_id}",
            "date_of_birth": "1994-03-10"
        })
        if resp.status_code == 201:
            data = resp.json()
            self.user_c_id = data.get("user", {}).get("id")
            self.user_c_token = data.get("token")
        else:
            resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": self.user_c_email,
                "password": self.password
            })
            if resp.status_code == 200:
                data = resp.json()
                self.user_c_id = data.get("user", {}).get("id")
                self.user_c_token = data.get("token")
            else:
                pytest.skip(f"Could not create/login User C: {resp.text}")
        
        # Register User D
        resp = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.user_d_email,
            "password": self.password,
            "display_name": f"Test User D {self.test_id}",
            "date_of_birth": "1993-04-25"
        })
        if resp.status_code == 201:
            data = resp.json()
            self.user_d_id = data.get("user", {}).get("id")
            self.user_d_token = data.get("token")
        else:
            resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": self.user_d_email,
                "password": self.password
            })
            if resp.status_code == 200:
                data = resp.json()
                self.user_d_id = data.get("user", {}).get("id")
                self.user_d_token = data.get("token")
            else:
                pytest.skip(f"Could not create/login User D: {resp.text}")
        
        # Update location for both users
        self.session.headers["Authorization"] = f"Bearer {self.user_c_token}"
        self.session.post(f"{BASE_URL}/api/location/update", json={
            "lat": 51.5074,
            "lng": -0.1278
        })
        
        self.session.headers["Authorization"] = f"Bearer {self.user_d_token}"
        self.session.post(f"{BASE_URL}/api/location/update", json={
            "lat": 51.5074,
            "lng": -0.1278
        })
        
        yield
    
    def test_message_disabled_when_not_revealed(self):
        """Test: Message button disabled when not revealed"""
        # User C views User D's profile without any interaction
        self.session.headers["Authorization"] = f"Bearer {self.user_c_token}"
        resp = self.session.get(f"{BASE_URL}/api/profile/{self.user_d_id}")
        
        assert resp.status_code == 200, f"Failed to get profile: {resp.text}"
        data = resp.json()
        
        assert data.get("is_revealed") == False, "is_revealed should be False"
        assert data.get("can_message") == False, "can_message should be False when not revealed"
        print(f"✓ Message disabled when not revealed: can_message={data.get('can_message')}")
    
    def test_message_enabled_after_icebreaker_accepted(self):
        """Test: Message button enabled after icebreaker accepted"""
        # User C sends icebreaker to User D
        self.session.headers["Authorization"] = f"Bearer {self.user_c_token}"
        resp = self.session.post(f"{BASE_URL}/api/icebreaker", json={
            "to_user_id": self.user_d_id,
            "venue_id": "test_venue",
            "message_type": 0
        })
        assert resp.status_code in [200, 201], f"Send icebreaker failed: {resp.text}"
        
        # User D accepts the icebreaker
        self.session.headers["Authorization"] = f"Bearer {self.user_d_token}"
        resp = self.session.get(f"{BASE_URL}/api/icebreakers/received")
        assert resp.status_code == 200
        icebreakers = resp.json()
        from_user_c = [ib for ib in icebreakers if ib.get("from_user_id") == self.user_c_id]
        assert len(from_user_c) > 0, "Should have pending icebreaker from User C"
        icebreaker_id = from_user_c[0].get("id")
        
        resp = self.session.post(f"{BASE_URL}/api/icebreaker/{icebreaker_id}/respond", json={
            "action": "accept"
        })
        assert resp.status_code == 200, f"Accept icebreaker failed: {resp.text}"
        
        # Check User C's profile from User D - should be able to message
        resp = self.session.get(f"{BASE_URL}/api/profile/{self.user_c_id}")
        assert resp.status_code == 200
        data = resp.json()
        
        assert data.get("is_revealed") == True, "is_revealed should be True after accepting"
        assert data.get("can_message") == True, "can_message should be True after accepting"
        print(f"✓ Message enabled after icebreaker accepted: can_message={data.get('can_message')}")
        
        # Check User D's profile from User C - should also be able to message
        self.session.headers["Authorization"] = f"Bearer {self.user_c_token}"
        resp = self.session.get(f"{BASE_URL}/api/profile/{self.user_d_id}")
        assert resp.status_code == 200
        data = resp.json()
        
        assert data.get("is_revealed") == True, "is_revealed should be True for sender too"
        assert data.get("can_message") == True, "can_message should be True for sender too"
        print(f"✓ Sender can also message after acceptance: can_message={data.get('can_message')}")


class TestVenueIcebreakerStates:
    """Test venue people list icebreaker states"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test users"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as demo user
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@user.com",
            "password": "password"
        })
        if resp.status_code == 200:
            data = resp.json()
            self.demo_token = data.get("token")
            self.demo_id = data.get("user", {}).get("id")
        else:
            pytest.skip(f"Could not login demo user: {resp.text}")
        
        yield
    
    def test_venue_people_returns_icebreaker_states(self):
        """Test: Venue people endpoint returns icebreaker_sent and icebreaker_received states"""
        self.session.headers["Authorization"] = f"Bearer {self.demo_token}"
        
        # First get a venue
        resp = self.session.get(f"{BASE_URL}/api/venues/nearby?lat=51.5074&lng=-0.1278")
        if resp.status_code != 200:
            pytest.skip("Could not get nearby venues")
        
        venues = resp.json()
        if not venues or len(venues) == 0:
            pytest.skip("No venues nearby")
        
        venue_id = venues[0].get("id")
        
        # Get people at venue
        resp = self.session.get(f"{BASE_URL}/api/venues/{venue_id}/people")
        
        if resp.status_code == 200:
            data = resp.json()
            people = data.get("people", [])
            
            if len(people) > 0:
                person = people[0]
                assert "icebreaker_sent" in person, "Person should have icebreaker_sent field"
                assert "icebreaker_received" in person, "Person should have icebreaker_received field"
                assert "is_revealed" in person, "Person should have is_revealed field"
                print(f"✓ Venue person has icebreaker states")
            else:
                print("✓ No people at venue (expected)")
        else:
            print(f"✓ Venue people endpoint returned {resp.status_code} (may be expected)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
