import requests
import sys
import json
from datetime import datetime

class HomeBizAPITester:
    def __init__(self, base_url="https://homemade-market.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")

            return success, response.json() if response.text and response.text.strip() and response.headers.get('content-type', '').startswith('application/json') else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root Endpoint",
            "GET",
            "api",
            404  # This might return 404, which is fine - just checking connectivity
        )
        # For connectivity test, we accept both 200 and 404
        if not success:
            # Try alternative endpoint
            success2, response2 = self.run_test(
                "Backend Health Check",
                "GET",
                "api/subscription/packages",
                200
            )
            return success2
        return success

    def test_register_buyer(self):
        """Test buyer registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"buyer_{timestamp}@test.com",
            "password": "TestPass123!",
            "name": f"Test Buyer {timestamp}",
            "role": "buyer"
        }
        
        success, response = self.run_test(
            "Register Buyer",
            "POST",
            "api/auth/register",
            200,
            data=test_data
        )
        
        if success and 'access_token' in response:
            print(f"   ✅ Buyer registered successfully")
            return True, response
        return False, {}

    def test_register_seller(self):
        """Test seller registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"seller_{timestamp}@test.com",
            "password": "TestPass123!",
            "name": f"Test Seller {timestamp}",
            "role": "seller"
        }
        
        success, response = self.run_test(
            "Register Seller",
            "POST",
            "api/auth/register",
            200,
            data=test_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            print(f"   ✅ Seller registered and token stored")
            return True, response
        return False, {}

    def test_login(self, email, password):
        """Test login functionality"""
        success, response = self.run_test(
            "Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            print(f"   ✅ Login successful, token stored")
            return True
        return False

    def test_subscription_packages(self):
        """Test getting subscription packages"""
        success, response = self.run_test(
            "Get Subscription Packages",
            "GET",
            "api/subscription/packages",
            200
        )
        
        if success and isinstance(response, dict):
            print(f"   ✅ Found {len(response)} subscription packages")
            return True
        return False

    def test_current_subscription(self):
        """Test getting current subscription (requires seller token)"""
        if not self.token or not self.user_data or self.user_data.get('role') != 'seller':
            print("   ⚠️  Skipping - requires seller authentication")
            return True
            
        success, response = self.run_test(
            "Get Current Subscription",
            "GET",
            "api/subscription/current",
            200
        )
        return success

    def test_businesses_list(self):
        """Test getting businesses list"""
        success, response = self.run_test(
            "Get Businesses List",
            "GET",
            "api/businesses",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Found {len(response)} businesses")
            return True
        return False

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "api/auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrongpassword"}
        )
        return success

    def test_duplicate_registration(self):
        """Test registering with existing email"""
        test_data = {
            "email": "duplicate@test.com",
            "password": "TestPass123!",
            "name": "Test User",
            "role": "buyer"
        }
        
        # First registration should succeed
        success1, _ = self.run_test(
            "First Registration",
            "POST",
            "api/auth/register",
            200,
            data=test_data
        )
        
        # Second registration should fail
        success2, _ = self.run_test(
            "Duplicate Registration",
            "POST",
            "api/auth/register",
            400,
            data=test_data
        )
        
        return success1 and success2

def main():
    print("🚀 Starting HomeBiz Directory API Tests")
    print("=" * 50)
    
    tester = HomeBizAPITester()
    
    # Test basic connectivity
    if not tester.test_root_endpoint():
        print("❌ Root endpoint failed - API may be down")
        return 1

    # Test authentication endpoints
    print("\n📝 Testing Authentication...")
    
    # Test buyer registration
    buyer_success, buyer_data = tester.test_register_buyer()
    
    # Test seller registration
    seller_success, seller_data = tester.test_register_seller()
    
    # Test login with seller credentials
    if seller_success:
        login_success = tester.test_login(
            seller_data['user']['email'], 
            "TestPass123!"
        )
    
    # Test invalid login
    tester.test_invalid_login()
    
    # Test duplicate registration
    tester.test_duplicate_registration()

    # Test subscription endpoints
    print("\n💳 Testing Subscription Endpoints...")
    tester.test_subscription_packages()
    tester.test_current_subscription()

    # Test business endpoints
    print("\n🏪 Testing Business Endpoints...")
    tester.test_businesses_list()

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_tests} test(s) failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())