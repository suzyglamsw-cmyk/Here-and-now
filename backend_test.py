import requests
import sys
from datetime import datetime
import uuid

class MidnightSocialAPITester:
    def __init__(self, base_url="https://spontaneous-venue.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        self.test_user_password = "TestPass123!"
        self.test_user_name = f"TestUser{uuid.uuid4().hex[:6]}"

    def run_test(self, name, method, endpoint, expected_status, data=None, requires_auth=True):
        """Run a single API test"""
        url = f"{self.api_base}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if requires_auth and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.status_code != 204:  # Not No Content
                    try:
                        return success, response.json()
                    except:
                        return success, response.text
                return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_msg = response.json()
                    print(f"   Error: {error_msg}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": self.test_user_email,
                "password": self.test_user_password,
                "display_name": self.test_user_name
            },
            requires_auth=False
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": self.test_user_email,
                "password": self.test_user_password
            },
            requires_auth=False
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_get_current_user(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_update_profile(self):
        """Test update user profile"""
        success, response = self.run_test(
            "Update Profile",
            "PUT",
            "auth/profile",
            200,
            data={
                "display_name": f"Updated{self.test_user_name}",
                "bio": "Test bio for midnight social",
                "interests": ["music", "dancing", "socializing"]
            }
        )
        return success

    def test_toggle_visibility(self):
        """Test toggle user visibility"""
        success, response = self.run_test(
            "Toggle Visibility",
            "PUT",
            "auth/visibility",
            200
        )
        return success

    def test_seed_venues(self):
        """Test seed venues endpoint"""
        success, response = self.run_test(
            "Seed Venues",
            "POST",
            "seed",
            200,
            requires_auth=False
        )
        return success

    def test_get_venues(self):
        """Test get venues list"""
        success, response = self.run_test(
            "Get Venues",
            "GET",
            "venues",
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            self.test_venue_id = response[0]['id']
            return True
        return False

    def test_check_in_venue(self):
        """Test check in to venue"""
        if not hasattr(self, 'test_venue_id'):
            print("❌ No venue ID available for check-in test")
            return False
            
        success, response = self.run_test(
            "Check In to Venue",
            "POST",
            f"checkin/{self.test_venue_id}",
            200
        )
        return success

    def test_get_current_checkin(self):
        """Test get current check-in"""
        success, response = self.run_test(
            "Get Current Checkin",
            "GET",
            "checkin/current",
            200
        )
        return success

    def test_get_people_at_venue(self):
        """Test get people at venue"""
        if not hasattr(self, 'test_venue_id'):
            print("❌ No venue ID available for people test")
            return False
            
        success, response = self.run_test(
            "Get People at Venue",
            "GET",
            f"venues/{self.test_venue_id}/people",
            200
        )
        return success

    def test_get_connections(self):
        """Test get user connections"""
        success, response = self.run_test(
            "Get Connections",
            "GET",
            "connections",
            200
        )
        return success

    def test_get_notifications(self):
        """Test get notifications"""
        success, response = self.run_test(
            "Get Notifications",
            "GET",
            "notifications",
            200
        )
        return success

    def test_get_drink_tokens(self):
        """Test get received drink tokens"""
        success, response = self.run_test(
            "Get Drink Tokens",
            "GET",
            "drink-tokens/received",
            200
        )
        return success

    def test_check_out(self):
        """Test check out from venue"""
        success, response = self.run_test(
            "Check Out from Venue",
            "POST",
            "checkout",
            200
        )
        return success

    def test_delete_account(self):
        """Test delete user account"""
        success, response = self.run_test(
            "Delete Account",
            "DELETE",
            "auth/account",
            200
        )
        return success

def main():
    """Run all API tests"""
    print("🚀 Starting Midnight Social API Tests")
    print("=" * 50)
    
    tester = MidnightSocialAPITester()
    
    # Test sequence
    tests = [
        ("Seed Venues", tester.test_seed_venues),
        ("User Registration", tester.test_user_registration),
        ("Get Current User", tester.test_get_current_user),
        ("Update Profile", tester.test_update_profile),
        ("Toggle Visibility", tester.test_toggle_visibility),
        ("Get Venues", tester.test_get_venues),
        ("Check In to Venue", tester.test_check_in_venue),
        ("Get Current Checkin", tester.test_get_current_checkin),
        ("Get People at Venue", tester.test_get_people_at_venue),
        ("Get Connections", tester.test_get_connections),
        ("Get Notifications", tester.test_get_notifications),
        ("Get Drink Tokens", tester.test_get_drink_tokens),
        ("Check Out from Venue", tester.test_check_out),
        ("User Login", tester.test_user_login),
        ("Delete Account", tester.test_delete_account),
    ]
    
    print(f"\nTest User: {tester.test_user_email}")
    print(f"Password: {tester.test_user_password}")
    print(f"Display Name: {tester.test_user_name}")
    
    failed_tests = []
    for test_name, test_func in tests:
        if not test_func():
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"   - {test}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n✨ Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())