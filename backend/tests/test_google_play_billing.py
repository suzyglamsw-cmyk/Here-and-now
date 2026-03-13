"""
Google Play Billing API Tests
Testing Google Play in-app purchases and subscriptions verification.
Backend is running in test mode (IS_TEST_BUILD=true) with mock Google Play service.
"""

import pytest
import requests
import os
import uuid

# Get base URL from environment variable
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable is required")


class TestGooglePlayStatus:
    """Test /api/google-play/status endpoint"""
    
    def test_google_play_status_returns_config(self):
        """GET /api/google-play/status returns configuration status"""
        response = requests.get(f"{BASE_URL}/api/google-play/status")
        assert response.status_code == 200
        data = response.json()
        
        # Since no credentials file is configured, google_play_service is None
        # So configured should be False
        assert "configured" in data
        assert data["configured"] == False  # No credentials file present
        
        # Without credentials, package_name and products should be None/empty
        assert data.get("package_name") is None
        assert data.get("products") == []
        print(f"✓ Google Play status endpoint working: configured={data['configured']}")


class TestGooglePlayPurchaseVerification:
    """Test /api/google-play/verify-purchase endpoint (test mode)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Register a test user for authenticated requests"""
        self.unique_email = f"test_gp_{uuid.uuid4().hex[:8]}@test.com"
        self.password = "testpass123"
        
        # Register user
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.unique_email,
            "password": self.password,
            "display_name": "GP Test User"
        })
        
        if reg_response.status_code == 200:
            self.token = reg_response.json()["token"]
            self.user_id = reg_response.json()["user"]["id"]
        elif reg_response.status_code == 400:  # Email exists, try login
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": self.unique_email,
                "password": self.password
            })
            assert login_response.status_code == 200
            self.token = login_response.json()["token"]
            self.user_id = login_response.json()["user"]["id"]
        else:
            pytest.fail(f"Failed to register/login: {reg_response.status_code}")
        
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_verify_purchase_requires_auth(self):
        """POST /api/google-play/verify-purchase requires authentication"""
        response = requests.post(f"{BASE_URL}/api/google-play/verify-purchase", json={
            "package_name": "com.hereandnow.app",
            "product_id": "tokens_5",
            "purchase_token": "test_token_123",
            "purchase_type": "product"
        })
        assert response.status_code == 403  # No auth header
        print("✓ Verify purchase requires authentication")
    
    def test_verify_token_purchase_test_mode(self):
        """POST /api/google-play/verify-purchase works in test mode for tokens"""
        # Get initial token balance
        user_response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert user_response.status_code == 200
        initial_balance = user_response.json().get("token_balance", 0)
        
        # Verify a token purchase
        response = requests.post(
            f"{BASE_URL}/api/google-play/verify-purchase",
            json={
                "package_name": "com.hereandnow.app",
                "product_id": "tokens_5",
                "purchase_token": f"test_token_{uuid.uuid4().hex}",
                "purchase_type": "product"
            },
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["product_id"] == "tokens_5"
        assert data["test_mode"] == True
        assert data["purchase_state"] == 0  # Purchased
        print(f"✓ Token purchase verification in test mode: {data}")
        
        # Verify tokens were granted
        user_response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        new_balance = user_response.json().get("token_balance", 0)
        assert new_balance == initial_balance + 5
        print(f"✓ Tokens granted: {initial_balance} -> {new_balance}")
    
    def test_verify_premium_subscription_test_mode(self):
        """POST /api/google-play/verify-purchase works in test mode for subscriptions"""
        # Get initial premium status
        user_response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        initial_premium = user_response.json().get("is_premium", False)
        
        # Verify a premium subscription purchase
        response = requests.post(
            f"{BASE_URL}/api/google-play/verify-purchase",
            json={
                "package_name": "com.hereandnow.app",
                "product_id": "premium_monthly",
                "purchase_token": f"test_sub_token_{uuid.uuid4().hex}",
                "purchase_type": "subscription"
            },
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
        assert data["product_id"] == "premium_monthly"
        assert data["test_mode"] == True
        print(f"✓ Premium subscription verification in test mode: {data}")
        
        # Verify premium was granted
        user_response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert user_response.json().get("is_premium") == True
        assert user_response.json().get("premium_expires_at") is not None
        print(f"✓ Premium status activated")
    
    def test_verify_unknown_product_fails(self):
        """POST /api/google-play/verify-purchase fails for unknown product"""
        response = requests.post(
            f"{BASE_URL}/api/google-play/verify-purchase",
            json={
                "package_name": "com.hereandnow.app",
                "product_id": "unknown_product",
                "purchase_token": "test_token_123",
                "purchase_type": "product"
            },
            headers=self.headers
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "Unknown product ID" in data.get("detail", "")
        print("✓ Unknown product verification correctly rejected")


class TestGooglePlayAcknowledge:
    """Test /api/google-play/acknowledge endpoint (test mode)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Register a test user"""
        self.unique_email = f"test_gp_ack_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.unique_email,
            "password": "testpass123",
            "display_name": "GP Ack Test"
        })
        if reg_response.status_code == 200:
            self.token = reg_response.json()["token"]
        else:
            pytest.fail(f"Registration failed: {reg_response.status_code}")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_acknowledge_works_in_test_mode(self):
        """POST /api/google-play/acknowledge works in test mode"""
        response = requests.post(
            f"{BASE_URL}/api/google-play/acknowledge",
            json={
                "package_name": "com.hereandnow.app",
                "subscription_id": "premium_monthly",
                "purchase_token": "test_ack_token_123"
            },
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["acknowledged"] == True
        assert data["test_mode"] == True
        print("✓ Acknowledge works in test mode")


class TestGooglePlayConsume:
    """Test /api/google-play/consume endpoint (test mode)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Register a test user"""
        self.unique_email = f"test_gp_consume_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.unique_email,
            "password": "testpass123",
            "display_name": "GP Consume Test"
        })
        if reg_response.status_code == 200:
            self.token = reg_response.json()["token"]
        else:
            pytest.fail(f"Registration failed: {reg_response.status_code}")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_consume_works_in_test_mode(self):
        """POST /api/google-play/consume works in test mode"""
        response = requests.post(
            f"{BASE_URL}/api/google-play/consume",
            json={
                "package_name": "com.hereandnow.app",
                "product_id": "tokens_5",
                "purchase_token": "test_consume_token_123",
                "purchase_type": "product"
            },
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["consumed"] == True
        assert data["test_mode"] == True
        print("✓ Consume works in test mode")


class TestGooglePlaySubscriptionStatus:
    """Test /api/google-play/subscription-status endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Register a test user"""
        self.unique_email = f"test_gp_sub_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.unique_email,
            "password": "testpass123",
            "display_name": "GP Sub Test"
        })
        if reg_response.status_code == 200:
            self.token = reg_response.json()["token"]
            self.user_id = reg_response.json()["user"]["id"]
        else:
            pytest.fail(f"Registration failed: {reg_response.status_code}")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_subscription_status_requires_auth(self):
        """GET /api/google-play/subscription-status requires authentication"""
        response = requests.get(f"{BASE_URL}/api/google-play/subscription-status")
        assert response.status_code == 403
        print("✓ Subscription status requires auth")
    
    def test_subscription_status_no_subscription(self):
        """GET /api/google-play/subscription-status returns false when no subscription"""
        response = requests.get(
            f"{BASE_URL}/api/google-play/subscription-status",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["has_subscription"] == False
        assert data.get("source") is None
        print("✓ Subscription status correctly shows no subscription")
    
    def test_subscription_status_after_purchase(self):
        """GET /api/google-play/subscription-status returns subscription info after purchase"""
        # First make a purchase
        purchase_token = f"test_sub_for_status_{uuid.uuid4().hex}"
        requests.post(
            f"{BASE_URL}/api/google-play/verify-purchase",
            json={
                "package_name": "com.hereandnow.app",
                "product_id": "premium_monthly",
                "purchase_token": purchase_token,
                "purchase_type": "subscription"
            },
            headers=self.headers
        )
        
        # Check subscription status
        response = requests.get(
            f"{BASE_URL}/api/google-play/subscription-status",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["has_subscription"] == True
        assert data["source"] == "google_play"
        assert data["product_id"] == "premium_monthly"
        print(f"✓ Subscription status shows active subscription: {data}")


class TestGooglePlayPurchaseHistory:
    """Test /api/google-play/purchases endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Register a test user"""
        self.unique_email = f"test_gp_history_{uuid.uuid4().hex[:8]}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.unique_email,
            "password": "testpass123",
            "display_name": "GP History Test"
        })
        if reg_response.status_code == 200:
            self.token = reg_response.json()["token"]
        else:
            pytest.fail(f"Registration failed: {reg_response.status_code}")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_purchases_requires_auth(self):
        """GET /api/google-play/purchases requires authentication"""
        response = requests.get(f"{BASE_URL}/api/google-play/purchases")
        assert response.status_code == 403
        print("✓ Purchase history requires auth")
    
    def test_purchases_empty_for_new_user(self):
        """GET /api/google-play/purchases returns empty list for new user"""
        response = requests.get(
            f"{BASE_URL}/api/google-play/purchases",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
        print("✓ Purchase history empty for new user")
    
    def test_purchases_shows_purchase_history(self):
        """GET /api/google-play/purchases shows purchases after making some"""
        # Make a token purchase
        requests.post(
            f"{BASE_URL}/api/google-play/verify-purchase",
            json={
                "package_name": "com.hereandnow.app",
                "product_id": "tokens_15",
                "purchase_token": f"test_history_token_{uuid.uuid4().hex}",
                "purchase_type": "product"
            },
            headers=self.headers
        )
        
        # Make a subscription purchase
        requests.post(
            f"{BASE_URL}/api/google-play/verify-purchase",
            json={
                "package_name": "com.hereandnow.app",
                "product_id": "premium_yearly",
                "purchase_token": f"test_history_sub_{uuid.uuid4().hex}",
                "purchase_type": "subscription"
            },
            headers=self.headers
        )
        
        # Check purchase history
        response = requests.get(
            f"{BASE_URL}/api/google-play/purchases",
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2
        
        # Check that purchases are in the history
        product_ids = [p["product_id"] for p in data]
        assert "tokens_15" in product_ids
        assert "premium_yearly" in product_ids
        print(f"✓ Purchase history shows {len(data)} purchases")


class TestGooglePlayWebhook:
    """Test /api/google-play/webhook endpoint (no auth required)"""
    
    def test_webhook_handles_empty_request(self):
        """POST /api/google-play/webhook handles empty request"""
        response = requests.post(
            f"{BASE_URL}/api/google-play/webhook",
            json={}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("✓ Webhook handles empty request")
    
    def test_webhook_handles_invalid_json(self):
        """POST /api/google-play/webhook handles invalid message format"""
        response = requests.post(
            f"{BASE_URL}/api/google-play/webhook",
            json={"message": {"data": "not-valid-base64"}}
        )
        
        # Should return 200 with error in response
        assert response.status_code == 200
        data = response.json()
        # Could be success:false with error or handled gracefully
        print(f"✓ Webhook handles invalid format: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
