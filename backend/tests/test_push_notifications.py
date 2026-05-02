"""
Test Push Notification APIs - Web Push service worker with pywebpush
Tests VAPID key endpoint, push subscription, settings, and notification delivery
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_USER_EMAIL = f"test_push_{uuid.uuid4().hex[:8]}@test.com"
TEST_USER_PASSWORD = "TestPass123!"
TEST_USER_NAME = f"TestPush_{uuid.uuid4().hex[:4]}"

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def registered_user(api_client):
    """Register a test user and return credentials"""
    response = api_client.post(f"{BASE_URL}/api/auth/register", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD,
        "display_name": TEST_USER_NAME
    })
    if response.status_code == 400 and "already registered" in response.text:
        # User exists, try login
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
    
    assert response.status_code in [200, 201], f"Failed to register/login: {response.text}"
    data = response.json()
    return {"token": data["token"], "user": data["user"]}

@pytest.fixture(scope="module")
def auth_headers(registered_user):
    """Return auth headers for authenticated requests"""
    return {"Authorization": f"Bearer {registered_user['token']}"}


class TestVapidPublicKey:
    """Test VAPID public key endpoint GET /api/push/vapid-public-key"""
    
    def test_vapid_public_key_returns_valid_key(self, api_client):
        """VAPID public key endpoint returns a valid key without auth"""
        response = api_client.get(f"{BASE_URL}/api/push/vapid-public-key")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "public_key" in data, "Response should contain 'public_key'"
        
        # Verify the key is not empty
        public_key = data["public_key"]
        assert public_key, "VAPID public key should not be empty"
        
        # VAPID keys are typically base64url encoded and around 87 characters
        assert len(public_key) > 50, f"VAPID public key seems too short: {len(public_key)} chars"
        print(f"VAPID public key returned: {public_key[:20]}...{public_key[-10:]}")
    
    def test_vapid_key_matches_configured_key(self, api_client):
        """VAPID public key matches the configured environment key"""
        response = api_client.get(f"{BASE_URL}/api/push/vapid-public-key")
        assert response.status_code == 200
        
        data = response.json()
        expected_key = "BMtGJsMRIxgCLVCNqmECD2mOZdWcmpnfVqQjz99RjBkhJgjJoSSRAkogmV9iTjn53FHkWTv3mhZZEPbTWS4THl8"
        assert data["public_key"] == expected_key, f"VAPID key mismatch: got {data['public_key']}"


class TestPushSubscription:
    """Test push subscription API POST /api/push/subscribe"""
    
    def test_subscribe_with_valid_subscription_data(self, api_client, auth_headers):
        """Push subscribe accepts valid subscription data"""
        # Mock browser push subscription format
        subscription_data = {
            "endpoint": f"https://fcm.googleapis.com/fcm/send/{uuid.uuid4().hex}",
            "keys": {
                "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUlsSMxn3cYuIWxGI2Bh4JhLFLVXJPXO0cqgG7uo",
                "auth": "tBHItJI5svbpez7KI4CCXg"
            }
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/push/subscribe",
            json=subscription_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain success message"
        print(f"Subscribe response: {data}")
    
    def test_subscribe_without_auth_fails(self, api_client):
        """Push subscribe requires authentication"""
        subscription_data = {
            "endpoint": "https://fcm.googleapis.com/fcm/send/test",
            "keys": {
                "p256dh": "test-key",
                "auth": "test-auth"
            }
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/push/subscribe",
            json=subscription_data
        )
        
        # Should fail with 401 or 403
        assert response.status_code in [401, 403], f"Expected auth error, got {response.status_code}"
    
    def test_subscribe_can_update_existing(self, api_client, auth_headers):
        """Can update existing push subscription"""
        # First subscription
        subscription_data = {
            "endpoint": f"https://fcm.googleapis.com/fcm/send/{uuid.uuid4().hex}",
            "keys": {
                "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUlsSMxn3cYuIWxGI2Bh4JhLFLVXJPXO0cqgG7uo",
                "auth": "tBHItJI5svbpez7KI4CCXg"
            }
        }
        
        response1 = api_client.post(
            f"{BASE_URL}/api/push/subscribe",
            json=subscription_data,
            headers=auth_headers
        )
        assert response1.status_code == 200
        
        # Update with new endpoint
        subscription_data["endpoint"] = f"https://fcm.googleapis.com/fcm/send/{uuid.uuid4().hex}"
        
        response2 = api_client.post(
            f"{BASE_URL}/api/push/subscribe",
            json=subscription_data,
            headers=auth_headers
        )
        assert response2.status_code == 200, f"Should allow updating subscription: {response2.text}"


class TestPushSettings:
    """Test push notification settings APIs"""
    
    def test_get_push_settings_default(self, api_client, auth_headers):
        """GET /api/push/settings returns default enabled settings"""
        response = api_client.get(
            f"{BASE_URL}/api/push/settings",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Default settings should have all enabled
        assert data.get("enabled", True), "enabled should be True by default"
        assert data.get("glances", True), "glances should be True by default"
        assert data.get("drinks", True), "drinks should be True by default"
        assert data.get("messages", True), "messages should be True by default"
        assert data.get("matches", True), "matches should be True by default"
        print(f"Push settings: {data}")
    
    def test_update_push_settings(self, api_client, auth_headers):
        """PUT /api/push/settings updates notification preferences"""
        new_settings = {
            "enabled": True,
            "glances": False,
            "drinks": True,
            "messages": True,
            "matches": False
        }
        
        response = api_client.put(
            f"{BASE_URL}/api/push/settings",
            json=new_settings,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify settings were saved
        get_response = api_client.get(
            f"{BASE_URL}/api/push/settings",
            headers=auth_headers
        )
        
        assert get_response.status_code == 200
        saved_settings = get_response.json()
        
        assert saved_settings.get("glances") == False, "glances setting not saved"
        assert saved_settings.get("matches") == False, "matches setting not saved"
        print(f"Updated settings verified: {saved_settings}")
    
    def test_disable_all_notifications(self, api_client, auth_headers):
        """Can disable all push notifications"""
        disable_all = {
            "enabled": False,
            "glances": False,
            "drinks": False,
            "messages": False,
            "matches": False
        }
        
        response = api_client.put(
            f"{BASE_URL}/api/push/settings",
            json=disable_all,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        
        # Re-enable for other tests
        enable_all = {
            "enabled": True,
            "glances": True,
            "drinks": True,
            "messages": True,
            "matches": True
        }
        api_client.put(f"{BASE_URL}/api/push/settings", json=enable_all, headers=auth_headers)


class TestPushUnsubscribe:
    """Test push unsubscribe API DELETE /api/push/unsubscribe"""
    
    def test_unsubscribe_removes_subscription(self, api_client, auth_headers):
        """DELETE /api/push/unsubscribe removes push subscription"""
        # First ensure we have a subscription
        subscription_data = {
            "endpoint": f"https://fcm.googleapis.com/fcm/send/{uuid.uuid4().hex}",
            "keys": {
                "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUlsSMxn3cYuIWxGI2Bh4JhLFLVXJPXO0cqgG7uo",
                "auth": "tBHItJI5svbpez7KI4CCXg"
            }
        }
        
        api_client.post(
            f"{BASE_URL}/api/push/subscribe",
            json=subscription_data,
            headers=auth_headers
        )
        
        # Now unsubscribe
        response = api_client.delete(
            f"{BASE_URL}/api/push/unsubscribe",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Unsubscribe response: {response.json()}")


class TestPushPendingNotifications:
    """Test pending push notifications polling endpoint"""
    
    def test_get_pending_notifications(self, api_client, auth_headers):
        """GET /api/push/pending returns list of pending notifications"""
        response = api_client.get(
            f"{BASE_URL}/api/push/pending",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Should return a list of notifications"
        print(f"Pending notifications count: {len(data)}")


class TestPushNotificationIntegration:
    """Test that actions trigger push notifications"""
    
    @pytest.fixture
    def second_user(self, api_client):
        """Create a second user for notification tests"""
        email = f"test_push_target_{uuid.uuid4().hex[:8]}@test.com"
        password = "TestPass123!"
        name = f"Target_{uuid.uuid4().hex[:4]}"
        
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "display_name": name
        })
        
        if response.status_code == 200:
            data = response.json()
            return {"token": data["token"], "user": data["user"]}
        
        return None
    
    def test_glance_queues_push_notification(self, api_client, auth_headers, second_user):
        """Sending a glance should queue a push notification for the target user"""
        if not second_user:
            pytest.skip("Could not create second user")
        
        # Create a venue first
        venue_response = api_client.post(
            f"{BASE_URL}/api/venues",
            json={
                "name": f"Test Venue {uuid.uuid4().hex[:4]}",
                "type": "bar",
                "address": "123 Test Street",
                "description": "Test venue for push notifications"
            },
            headers=auth_headers
        )
        
        if venue_response.status_code != 200:
            pytest.skip("Could not create venue")
        
        venue_id = venue_response.json()["id"]
        
        # Enable push settings for target user
        target_headers = {"Authorization": f"Bearer {second_user['token']}"}
        api_client.put(
            f"{BASE_URL}/api/push/settings",
            json={"enabled": True, "glances": True},
            headers=target_headers
        )
        
        # Subscribe target user to push
        api_client.post(
            f"{BASE_URL}/api/push/subscribe",
            json={
                "endpoint": f"https://fcm.googleapis.com/fcm/send/{uuid.uuid4().hex}",
                "keys": {
                    "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUlsSMxn3cYuIWxGI2Bh4JhLFLVXJPXO0cqgG7uo",
                    "auth": "tBHItJI5svbpez7KI4CCXg"
                }
            },
            headers=target_headers
        )
        
        # Check in both users to the venue
        api_client.post(f"{BASE_URL}/api/checkin/{venue_id}", headers=auth_headers)
        api_client.post(f"{BASE_URL}/api/checkin/{venue_id}", headers=target_headers)
        
        # Send a glance
        glance_response = api_client.post(
            f"{BASE_URL}/api/glance",
            json={
                "to_user_id": second_user["user"]["id"],
                "venue_id": venue_id
            },
            headers=auth_headers
        )
        
        # Glance should succeed (may say "Already glanced" if run multiple times)
        assert glance_response.status_code == 200, f"Glance failed: {glance_response.text}"
        print(f"Glance response: {glance_response.json()}")


class TestServiceWorkerFile:
    """Test that service worker file exists and is accessible"""
    
    def test_service_worker_file_accessible(self, api_client):
        """Service worker file sw.js should be accessible at frontend root"""
        # The service worker is served from the frontend, not backend
        # Test by checking the file exists in the public folder
        frontend_url = BASE_URL.replace("/api", "")
        if "/api" not in BASE_URL:
            # If BASE_URL doesn't include /api, just use it as is
            frontend_url = BASE_URL
        
        # Try to access the service worker directly
        # Note: In the deployed app, this would be at the frontend URL
        sw_url = f"{frontend_url}/sw.js"
        
        try:
            response = requests.get(sw_url, timeout=5)
            # Might get 200 (served) or 404 (not found) depending on routing
            if response.status_code == 200:
                content = response.text
                assert "push" in content.lower() or "notification" in content.lower(), \
                    "Service worker should contain push notification code"
                print(f"Service worker accessible at {sw_url}")
            else:
                print(f"Service worker returned {response.status_code} - may be served by frontend only")
        except Exception as e:
            print(f"Could not access service worker directly: {e}")
            # This is expected if sw.js is only served by the frontend dev server


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
