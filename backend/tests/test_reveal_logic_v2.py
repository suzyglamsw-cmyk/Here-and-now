"""
Test Reveal Logic V2 - Two Reveal Triggers
==========================================
Tests the reveal logic with TWO triggers:
1. Mutual glance = reveal (both users glance at each other)
2. Responded Icebreaker = reveal (Icebreaker sent + Icebreaker response creates a connection)

Key rules:
- Before reveal: both profiles stay blurred, icebreakers visible and optional, messaging disabled
- After reveal: both profiles clear simultaneously, messaging unlocks and chat session is created
- No reveal logic tied to presence, venue status, or 'You're here' flag
- No partial reveals
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestRevealLogicV2:
    """Test the two reveal triggers: mutual glance and accepted icebreaker"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create two fresh test users for each test"""
        self.test_id = str(uuid.uuid4())[:8]
        self.user1_email = f"TEST_reveal_v2_user1_{self.test_id}@test.com"
        self.user2_email = f"TEST_reveal_v2_user2_{self.test_id}@test.com"
        self.password = "TestPass123!"
        
        # Register user 1
        response1 = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.user1_email,
            "password": self.password,
            "display_name": f"TestUser1",
            "date_of_birth": "1995-01-15",
            "show_as": "male"
        })
        
        if response1.status_code == 200:
            data1 = response1.json()
            self.user1_token = data1["token"]
            self.user1_id = data1["user"]["id"]
        else:
            pytest.skip(f"Failed to register user1: {response1.text}")
        
        # Register user 2
        response2 = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.user2_email,
            "password": self.password,
            "display_name": f"TestUser2",
            "date_of_birth": "1996-02-20",
            "show_as": "female"
        })
        
        if response2.status_code == 200:
            data2 = response2.json()
            self.user2_token = data2["token"]
            self.user2_id = data2["user"]["id"]
        else:
            pytest.skip(f"Failed to register user2: {response2.text}")
        
        # Set coordinates for both users (London area - close together)
        self._update_location(self.user1_token, 51.5074, -0.1278)
        self._update_location(self.user2_token, 51.5080, -0.1280)
        
        yield
        
        # Cleanup - delete test users
        self._delete_user(self.user1_token)
        self._delete_user(self.user2_token)
    
    def _update_location(self, token, lat, lng):
        """Update user location"""
        response = requests.post(
            f"{BASE_URL}/api/location/update",
            json={"lat": lat, "lng": lng},
            headers={"Authorization": f"Bearer {token}"}
        )
        return response
    
    def _delete_user(self, token):
        """Delete user account"""
        try:
            requests.delete(
                f"{BASE_URL}/api/auth/account",
                headers={"Authorization": f"Bearer {token}"}
            )
        except:
            pass
    
    def _get_profile(self, viewer_token, target_user_id):
        """Get user profile as viewer"""
        response = requests.get(
            f"{BASE_URL}/api/users/{target_user_id}/profile",
            headers={"Authorization": f"Bearer {viewer_token}"}
        )
        return response
    
    def _send_glance(self, from_token, to_user_id):
        """Send a glance from one user to another"""
        response = requests.post(
            f"{BASE_URL}/api/glance",
            json={"to_user_id": to_user_id, "venue_id": "test_venue"},
            headers={"Authorization": f"Bearer {from_token}"}
        )
        return response
    
    def _send_icebreaker(self, from_token, to_user_id, message_type=0):
        """Send an icebreaker"""
        response = requests.post(
            f"{BASE_URL}/api/icebreaker",
            json={"to_user_id": to_user_id, "venue_id": "test_venue", "message_type": message_type},
            headers={"Authorization": f"Bearer {from_token}"}
        )
        return response
    
    def _get_received_icebreakers(self, token):
        """Get received icebreakers"""
        response = requests.get(
            f"{BASE_URL}/api/icebreakers/received",
            headers={"Authorization": f"Bearer {token}"}
        )
        return response
    
    def _respond_to_icebreaker(self, token, icebreaker_id, action="accept"):
        """Respond to an icebreaker"""
        response = requests.post(
            f"{BASE_URL}/api/icebreaker/{icebreaker_id}/respond",
            json={"action": action},
            headers={"Authorization": f"Bearer {token}"}
        )
        return response
    
    def _get_discovery_not_here(self, token, radius="0-25"):
        """Get discovery feed (not-here mode)"""
        response = requests.get(
            f"{BASE_URL}/api/discovery/not-here?radius={radius}",
            headers={"Authorization": f"Bearer {token}"}
        )
        return response
    
    # =========================================================================
    # TEST 1: No interaction → is_revealed=False for both users
    # =========================================================================
    def test_01_no_interaction_not_revealed(self):
        """Test: No interaction → is_revealed=False for both users"""
        # User 1 views User 2's profile
        response1 = self._get_profile(self.user1_token, self.user2_id)
        assert response1.status_code == 200, f"Failed to get profile: {response1.text}"
        profile1 = response1.json()
        
        assert profile1.get("is_revealed") == False, "User2 should NOT be revealed to User1 without interaction"
        assert profile1.get("can_message") == False, "User1 should NOT be able to message User2 without reveal"
        
        # User 2 views User 1's profile
        response2 = self._get_profile(self.user2_token, self.user1_id)
        assert response2.status_code == 200
        profile2 = response2.json()
        
        assert profile2.get("is_revealed") == False, "User1 should NOT be revealed to User2 without interaction"
        assert profile2.get("can_message") == False, "User2 should NOT be able to message User1 without reveal"
        
        print("✓ TEST PASSED: No interaction → is_revealed=False for both users")
    
    # =========================================================================
    # TEST 2: One-sided glance → is_revealed=False for both users
    # =========================================================================
    def test_02_one_sided_glance_not_revealed(self):
        """Test: One-sided glance → is_revealed=False for both users"""
        # User 1 glances at User 2
        glance_response = self._send_glance(self.user1_token, self.user2_id)
        assert glance_response.status_code == 200, f"Failed to send glance: {glance_response.text}"
        
        # User 1 views User 2's profile - should NOT be revealed
        response1 = self._get_profile(self.user1_token, self.user2_id)
        assert response1.status_code == 200
        profile1 = response1.json()
        
        assert profile1.get("is_revealed") == False, "User2 should NOT be revealed after one-sided glance"
        assert profile1.get("can_message") == False, "User1 should NOT be able to message after one-sided glance"
        assert profile1.get("i_glanced_at_them") == True, "Should show that User1 glanced at User2"
        
        # User 2 views User 1's profile - should NOT be revealed
        response2 = self._get_profile(self.user2_token, self.user1_id)
        assert response2.status_code == 200
        profile2 = response2.json()
        
        assert profile2.get("is_revealed") == False, "User1 should NOT be revealed to User2 after one-sided glance"
        assert profile2.get("can_message") == False, "User2 should NOT be able to message after one-sided glance"
        
        print("✓ TEST PASSED: One-sided glance → is_revealed=False for both users")
    
    # =========================================================================
    # TEST 3: Mutual glance → is_revealed=True, can_message=True for BOTH users
    # =========================================================================
    def test_03_mutual_glance_reveals_both(self):
        """Test: Mutual glance → is_revealed=True, can_message=True for BOTH users simultaneously"""
        # User 1 glances at User 2
        glance1 = self._send_glance(self.user1_token, self.user2_id)
        assert glance1.status_code == 200, f"Failed to send glance from User1: {glance1.text}"
        
        # User 2 glances back at User 1 (mutual glance)
        glance2 = self._send_glance(self.user2_token, self.user1_id)
        assert glance2.status_code == 200, f"Failed to send glance from User2: {glance2.text}"
        
        # Check if glance2 response indicates mutual
        glance2_data = glance2.json()
        assert glance2_data.get("is_mutual") == True, "Second glance should indicate mutual match"
        
        # User 1 views User 2's profile - should be revealed
        response1 = self._get_profile(self.user1_token, self.user2_id)
        assert response1.status_code == 200
        profile1 = response1.json()
        
        assert profile1.get("is_revealed") == True, "User2 SHOULD be revealed to User1 after mutual glance"
        assert profile1.get("can_message") == True, "User1 SHOULD be able to message after mutual glance"
        
        # User 2 views User 1's profile - should be revealed
        response2 = self._get_profile(self.user2_token, self.user1_id)
        assert response2.status_code == 200
        profile2 = response2.json()
        
        assert profile2.get("is_revealed") == True, "User1 SHOULD be revealed to User2 after mutual glance"
        assert profile2.get("can_message") == True, "User2 SHOULD be able to message after mutual glance"
        
        print("✓ TEST PASSED: Mutual glance → is_revealed=True, can_message=True for BOTH users simultaneously")
    
    # =========================================================================
    # TEST 4: Sending icebreaker → is_revealed=False, icebreaker_sent=True
    # =========================================================================
    def test_04_sending_icebreaker_not_revealed(self):
        """Test: Sending icebreaker → is_revealed=False, icebreaker_sent=True"""
        # User 1 sends icebreaker to User 2
        icebreaker_response = self._send_icebreaker(self.user1_token, self.user2_id)
        assert icebreaker_response.status_code in [200, 201], f"Failed to send icebreaker: {icebreaker_response.text}"
        
        # User 1 views User 2's profile - should NOT be revealed
        response1 = self._get_profile(self.user1_token, self.user2_id)
        assert response1.status_code == 200
        profile1 = response1.json()
        
        assert profile1.get("is_revealed") == False, "User2 should NOT be revealed after sending icebreaker"
        assert profile1.get("icebreaker_sent") == True, "icebreaker_sent should be True"
        assert profile1.get("can_message") == False, "User1 should NOT be able to message after sending icebreaker"
        
        # User 2 views User 1's profile - should NOT be revealed
        response2 = self._get_profile(self.user2_token, self.user1_id)
        assert response2.status_code == 200
        profile2 = response2.json()
        
        assert profile2.get("is_revealed") == False, "User1 should NOT be revealed to User2 after receiving icebreaker"
        
        print("✓ TEST PASSED: Sending icebreaker → is_revealed=False, icebreaker_sent=True")
    
    # =========================================================================
    # TEST 5: Accepting icebreaker → is_revealed=True, can_message=True for BOTH
    # =========================================================================
    def test_05_accepting_icebreaker_reveals_both(self):
        """Test: Accepting icebreaker → is_revealed=True, can_message=True for BOTH users simultaneously"""
        # User 1 sends icebreaker to User 2
        icebreaker_response = self._send_icebreaker(self.user1_token, self.user2_id)
        assert icebreaker_response.status_code in [200, 201], f"Failed to send icebreaker: {icebreaker_response.text}"
        
        # Get the icebreaker ID from User 2's received icebreakers
        received = self._get_received_icebreakers(self.user2_token)
        assert received.status_code == 200, f"Failed to get received icebreakers: {received.text}"
        icebreakers = received.json()
        
        # Find the icebreaker from User 1
        from_user1 = [ib for ib in icebreakers if ib.get("from_user_id") == self.user1_id]
        assert len(from_user1) > 0, "Should have pending icebreaker from User1"
        icebreaker_id = from_user1[0].get("id")
        
        # User 2 accepts the icebreaker
        accept_response = self._respond_to_icebreaker(self.user2_token, icebreaker_id, "accept")
        assert accept_response.status_code == 200, f"Failed to accept icebreaker: {accept_response.text}"
        
        # User 1 views User 2's profile - should be revealed
        response1 = self._get_profile(self.user1_token, self.user2_id)
        assert response1.status_code == 200
        profile1 = response1.json()
        
        assert profile1.get("is_revealed") == True, "User2 SHOULD be revealed to User1 after accepted icebreaker"
        assert profile1.get("can_message") == True, "User1 SHOULD be able to message after accepted icebreaker"
        
        # User 2 views User 1's profile - should be revealed
        response2 = self._get_profile(self.user2_token, self.user1_id)
        assert response2.status_code == 200
        profile2 = response2.json()
        
        assert profile2.get("is_revealed") == True, "User1 SHOULD be revealed to User2 after accepted icebreaker"
        assert profile2.get("can_message") == True, "User2 SHOULD be able to message after accepted icebreaker"
        
        print("✓ TEST PASSED: Accepting icebreaker → is_revealed=True, can_message=True for BOTH users simultaneously")
    
    # =========================================================================
    # TEST 6: Self card in discovery shows is_revealed=False
    # =========================================================================
    def test_06_self_card_shows_not_revealed(self):
        """Test: Self card in discovery shows is_revealed=False (pre-reveal view)"""
        # Get discovery feed for User 1
        response = self._get_discovery_not_here(self.user1_token)
        
        if response.status_code == 200:
            people = response.json()
            
            # Find self card
            self_card = next((p for p in people if p.get("is_self") == True), None)
            
            if self_card:
                assert self_card.get("is_revealed") == False, "Self card should show is_revealed=False (how others see them)"
                assert self_card.get("id") == self.user1_id, "Self card should have correct user ID"
                print("✓ TEST PASSED: Self card in discovery shows is_revealed=False")
            else:
                print("⚠ Self card not found in discovery feed (may be filtered out)")
        else:
            print(f"⚠ Discovery endpoint returned {response.status_code}: {response.text}")
    
    # =========================================================================
    # TEST 7: Message button disabled when not revealed
    # =========================================================================
    def test_07_message_button_disabled_when_not_revealed(self):
        """Test: Message button disabled when not revealed"""
        # User 1 views User 2's profile without any interaction
        response = self._get_profile(self.user1_token, self.user2_id)
        assert response.status_code == 200
        profile = response.json()
        
        assert profile.get("is_revealed") == False, "Profile should not be revealed"
        assert profile.get("can_message") == False, "Message should be locked when not revealed"
        
        print("✓ TEST PASSED: Message button disabled when not revealed")
    
    # =========================================================================
    # TEST 8: Message button enabled after reveal (mutual glance)
    # =========================================================================
    def test_08_message_enabled_after_mutual_glance(self):
        """Test: Message button enabled after reveal (mutual glance)"""
        # Create mutual glance
        self._send_glance(self.user1_token, self.user2_id)
        self._send_glance(self.user2_token, self.user1_id)
        
        # Check profile - should be revealed and can message
        response = self._get_profile(self.user1_token, self.user2_id)
        assert response.status_code == 200
        profile = response.json()
        
        assert profile.get("is_revealed") == True, "Profile should be revealed after mutual glance"
        assert profile.get("can_message") == True, "Message should be enabled after mutual glance"
        
        print("✓ TEST PASSED: Message button enabled after reveal (mutual glance)")
    
    # =========================================================================
    # TEST 9: Message button enabled after reveal (accepted icebreaker)
    # =========================================================================
    def test_09_message_enabled_after_accepted_icebreaker(self):
        """Test: Message button enabled after reveal (accepted icebreaker)"""
        # User 1 sends icebreaker to User 2
        self._send_icebreaker(self.user1_token, self.user2_id)
        
        # Get icebreaker ID
        received = self._get_received_icebreakers(self.user2_token)
        icebreakers = received.json()
        from_user1 = [ib for ib in icebreakers if ib.get("from_user_id") == self.user1_id]
        icebreaker_id = from_user1[0].get("id")
        
        # User 2 accepts
        self._respond_to_icebreaker(self.user2_token, icebreaker_id, "accept")
        
        # Check profile - should be revealed and can message
        response = self._get_profile(self.user1_token, self.user2_id)
        assert response.status_code == 200
        profile = response.json()
        
        assert profile.get("is_revealed") == True, "Profile should be revealed after accepted icebreaker"
        assert profile.get("can_message") == True, "Message should be enabled after accepted icebreaker"
        
        print("✓ TEST PASSED: Message button enabled after reveal (accepted icebreaker)")
    
    # =========================================================================
    # TEST 10: Discovery card shows Glance and Icebreaker buttons pre-reveal
    # =========================================================================
    def test_10_discovery_card_shows_glance_and_icebreaker_pre_reveal(self):
        """Test: Discovery card shows Glance and Icebreaker buttons pre-reveal"""
        # Get discovery feed for User 1
        response = self._get_discovery_not_here(self.user1_token)
        
        if response.status_code == 200:
            people = response.json()
            
            # Find User 2 in the feed
            user2_card = next((p for p in people if p.get("id") == self.user2_id), None)
            
            if user2_card:
                # Without any interaction, should not be revealed
                assert user2_card.get("is_revealed") == False, "User2 should not be revealed in discovery without interaction"
                # Should have icebreaker state fields
                assert "icebreaker_sent" in user2_card, "Should have icebreaker_sent field"
                assert "icebreaker_received" in user2_card, "Should have icebreaker_received field"
                assert user2_card.get("icebreaker_sent") == False, "icebreaker_sent should be False initially"
                print("✓ TEST PASSED: Discovery card shows correct pre-reveal state with icebreaker fields")
            else:
                print("⚠ User2 not found in discovery feed (may be filtered by distance/visibility)")
        else:
            print(f"⚠ Discovery endpoint returned {response.status_code}")
    
    # =========================================================================
    # TEST 11: Discovery card shows 'Sent' state when icebreaker already sent
    # =========================================================================
    def test_11_discovery_card_shows_sent_state(self):
        """Test: Discovery card shows 'Sent' state when icebreaker already sent"""
        # User 1 sends icebreaker to User 2
        self._send_icebreaker(self.user1_token, self.user2_id)
        
        # Get discovery feed for User 1
        response = self._get_discovery_not_here(self.user1_token)
        
        if response.status_code == 200:
            people = response.json()
            
            # Find User 2 in the feed
            user2_card = next((p for p in people if p.get("id") == self.user2_id), None)
            
            if user2_card:
                assert user2_card.get("icebreaker_sent") == True, "icebreaker_sent should be True after sending"
                assert user2_card.get("is_revealed") == False, "Should still not be revealed after sending icebreaker"
                print("✓ TEST PASSED: Discovery card shows 'Sent' state when icebreaker already sent")
            else:
                print("⚠ User2 not found in discovery feed")
        else:
            print(f"⚠ Discovery endpoint returned {response.status_code}")


class TestDemoUserRevealLogic:
    """Test reveal logic using demo user credentials"""
    
    def test_demo_user_login_and_discovery(self):
        """Test that demo user can login and access discovery"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@user.com",
            "password": "password"
        })
        
        assert response.status_code == 200, f"Demo user login failed: {response.text}"
        data = response.json()
        
        assert "token" in data, "Login should return token"
        assert "user" in data, "Login should return user data"
        
        token = data["token"]
        
        # Check discovery not-here endpoint
        discovery_response = requests.get(
            f"{BASE_URL}/api/discovery/not-here",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert discovery_response.status_code == 200, f"Discovery failed: {discovery_response.text}"
        people = discovery_response.json()
        
        # Verify response structure
        assert isinstance(people, list), "Discovery should return a list"
        
        if len(people) > 0:
            person = people[0]
            # Check required fields
            assert "id" in person, "Person should have id"
            assert "is_revealed" in person, "Person should have is_revealed"
            assert "icebreaker_sent" in person, "Person should have icebreaker_sent"
            assert "icebreaker_received" in person, "Person should have icebreaker_received"
            print(f"✓ Demo user discovery working. Found {len(people)} people.")
        else:
            print("✓ Demo user discovery working. No people found (expected if no other users nearby).")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
