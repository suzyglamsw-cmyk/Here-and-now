"""
Test GPS Enforcement for Discovery Endpoints
Tests that discovery endpoints require strict GPS coordinates and return 400 when missing.
"""
import pytest
import requests
import uuid
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestGPSEnforcement:
    """Tests for strict GPS coordinate enforcement in discovery endpoints"""
    
    @pytest.fixture(scope="class")
    def demo_user_token(self):
        """Get token for demo user (has coordinates)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@user.com",
            "password": "password"
        })
        assert response.status_code == 200, f"Demo login failed: {response.text}"
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def new_user_without_coords(self):
        """Create a new user without GPS coordinates"""
        unique_email = f"test_no_coords_{uuid.uuid4().hex[:8]}@test.com"
        
        # Register new user (date_of_birth is required)
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "display_name": "Test No Coords",
            "date_of_birth": "1990-01-15"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Add a profile photo (required for discovery)
        token = data["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Update profile with avatar_url to bypass photo requirement
        response = requests.put(f"{BASE_URL}/api/auth/profile", 
            headers=headers,
            json={"avatar_url": "https://example.com/test.jpg"}
        )
        
        return {
            "token": token,
            "user_id": data["user"]["id"],
            "email": unique_email
        }
    
    # =========================================================================
    # Test 1: /api/discovery/not-here returns 400 when user has no lat/lng
    # =========================================================================
    def test_discovery_not_here_requires_coordinates(self, new_user_without_coords):
        """Discovery not-here should return 400 when user has no GPS coordinates"""
        headers = {"Authorization": f"Bearer {new_user_without_coords['token']}"}
        
        response = requests.get(f"{BASE_URL}/api/discovery/not-here", headers=headers)
        
        # Should return 400 because user has no coordinates
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        # Verify error message mentions location/GPS
        error_detail = response.json().get("detail", "")
        assert "location" in error_detail.lower() or "gps" in error_detail.lower(), \
            f"Error message should mention location/GPS: {error_detail}"
        
        print(f"✓ /discovery/not-here correctly returns 400 for user without coordinates")
        print(f"  Error message: {error_detail}")
    
    # =========================================================================
    # Test 2: /api/discovery/here returns 400 when user has no lat/lng
    # =========================================================================
    def test_discovery_here_requires_coordinates(self, new_user_without_coords):
        """Discovery here should return 400 when user has no GPS coordinates"""
        headers = {"Authorization": f"Bearer {new_user_without_coords['token']}"}
        
        response = requests.get(f"{BASE_URL}/api/discovery/here", headers=headers)
        
        # Should return 400 because user has no coordinates
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        # Verify error message mentions location/GPS
        error_detail = response.json().get("detail", "")
        assert "location" in error_detail.lower() or "gps" in error_detail.lower(), \
            f"Error message should mention location/GPS: {error_detail}"
        
        print(f"✓ /discovery/here correctly returns 400 for user without coordinates")
        print(f"  Error message: {error_detail}")
    
    # =========================================================================
    # Test 3: /api/location/update endpoint saves user coordinates
    # =========================================================================
    def test_location_update_saves_coordinates(self, new_user_without_coords):
        """Location update endpoint should save user's GPS coordinates"""
        headers = {"Authorization": f"Bearer {new_user_without_coords['token']}"}
        
        # Update location
        test_lat = 40.7128
        test_lng = -74.0060
        
        response = requests.post(f"{BASE_URL}/api/location/update", 
            headers=headers,
            json={"lat": test_lat, "lng": test_lng}
        )
        
        assert response.status_code == 200, f"Location update failed: {response.text}"
        
        data = response.json()
        assert data.get("lat") == test_lat, f"Returned lat doesn't match: {data}"
        assert data.get("lng") == test_lng, f"Returned lng doesn't match: {data}"
        
        print(f"✓ /location/update correctly saves coordinates")
        print(f"  Saved: lat={test_lat}, lng={test_lng}")
    
    # =========================================================================
    # Test 4: Discovery works after coordinates are updated
    # =========================================================================
    def test_discovery_works_after_location_update(self, new_user_without_coords):
        """Discovery should work after user updates their location"""
        headers = {"Authorization": f"Bearer {new_user_without_coords['token']}"}
        
        # First update location (in case previous test didn't run)
        test_lat = 40.7128
        test_lng = -74.0060
        
        response = requests.post(f"{BASE_URL}/api/location/update", 
            headers=headers,
            json={"lat": test_lat, "lng": test_lng}
        )
        assert response.status_code == 200, f"Location update failed: {response.text}"
        
        # Now try discovery/not-here - should work
        response = requests.get(f"{BASE_URL}/api/discovery/not-here", headers=headers)
        
        # Should return 200 (or 403 if no photo, but NOT 400 for missing location)
        assert response.status_code in [200, 403], \
            f"Expected 200 or 403, got {response.status_code}: {response.text}"
        
        if response.status_code == 403:
            # 403 is acceptable if it's about photo requirement, not location
            error_detail = response.json().get("detail", "")
            assert "photo" in error_detail.lower(), \
                f"403 should be about photo, not location: {error_detail}"
            print(f"✓ /discovery/not-here returns 403 for photo requirement (location check passed)")
        else:
            print(f"✓ /discovery/not-here works after location update (status 200)")
            print(f"  Found {len(response.json())} people")
    
    # =========================================================================
    # Test 5: Demo user with coordinates can access discovery
    # =========================================================================
    def test_demo_user_can_access_discovery(self, demo_user_token):
        """Demo user (who has coordinates) should be able to access discovery"""
        headers = {"Authorization": f"Bearer {demo_user_token}"}
        
        # Test not-here
        response = requests.get(f"{BASE_URL}/api/discovery/not-here", headers=headers)
        assert response.status_code == 200, f"Demo user discovery/not-here failed: {response.text}"
        print(f"✓ Demo user can access /discovery/not-here (found {len(response.json())} people)")
        
        # Test here
        response = requests.get(f"{BASE_URL}/api/discovery/here", headers=headers)
        assert response.status_code == 200, f"Demo user discovery/here failed: {response.text}"
        print(f"✓ Demo user can access /discovery/here (found {len(response.json())} people)")
    
    # =========================================================================
    # Test 6: Verify demo user has coordinates stored
    # =========================================================================
    def test_demo_user_has_coordinates(self, demo_user_token):
        """Verify demo user has lat/lng coordinates stored"""
        headers = {"Authorization": f"Bearer {demo_user_token}"}
        
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200, f"Failed to get user profile: {response.text}"
        
        user = response.json()
        lat = user.get("lat")
        lng = user.get("lng")
        
        print(f"  Demo user coordinates: lat={lat}, lng={lng}")
        
        # Demo user should have coordinates (as mentioned in context: 51.5074, -0.1278)
        assert lat is not None, "Demo user should have lat coordinate"
        assert lng is not None, "Demo user should have lng coordinate"
        
        print(f"✓ Demo user has coordinates stored: lat={lat}, lng={lng}")


class TestLocationUpdateEndpoint:
    """Additional tests for /api/location/update endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for testing"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@user.com",
            "password": "password"
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_location_update_requires_auth(self):
        """Location update should require authentication"""
        response = requests.post(f"{BASE_URL}/api/location/update", json={
            "lat": 40.7128,
            "lng": -74.0060
        })
        
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403, 422], \
            f"Expected auth error, got {response.status_code}: {response.text}"
        print(f"✓ /location/update requires authentication (status {response.status_code})")
    
    def test_location_update_validates_coordinates(self, auth_token):
        """Location update should validate coordinate values"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Test with missing lat
        response = requests.post(f"{BASE_URL}/api/location/update", 
            headers=headers,
            json={"lng": -74.0060}
        )
        assert response.status_code == 422, f"Should reject missing lat: {response.text}"
        print(f"✓ /location/update rejects missing lat")
        
        # Test with missing lng
        response = requests.post(f"{BASE_URL}/api/location/update", 
            headers=headers,
            json={"lat": 40.7128}
        )
        assert response.status_code == 422, f"Should reject missing lng: {response.text}"
        print(f"✓ /location/update rejects missing lng")
    
    def test_location_update_accepts_valid_coordinates(self, auth_token):
        """Location update should accept valid coordinates"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Test with valid coordinates
        response = requests.post(f"{BASE_URL}/api/location/update", 
            headers=headers,
            json={"lat": 51.5074, "lng": -0.1278}  # London coordinates
        )
        assert response.status_code == 200, f"Should accept valid coordinates: {response.text}"
        
        data = response.json()
        assert "lat" in data
        assert "lng" in data
        print(f"✓ /location/update accepts valid coordinates")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
