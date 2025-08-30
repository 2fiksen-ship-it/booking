import requests
import sys
import json
from datetime import datetime, timedelta

class SanhajaAPITester:
    def __init__(self, base_url="https://sanhaja-travel.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.current_user = None
        self.tests_run = 0
        self.tests_passed = 0
        
        # Correct user hierarchy for testing
        self.test_users = {
            'super_admin': {
                'email': 'superadmin@sanhaja.com',
                'password': 'super123',
                'role': 'super_admin',
                'name': 'المدير العام'
            },
            'general_accountant': {
                'email': 'generalaccountant@sanhaja.com', 
                'password': 'acc123',
                'role': 'general_accountant',
                'name': 'المحاسب العام'
            },
            'tlemcen_staff1': {
                'email': 'staff1@tlemcen.sanhaja.com',
                'password': 'staff123',
                'role': 'agency_staff',
                'agency': 'تلمسان'
            },
            'tlemcen_staff2': {
                'email': 'staff2@tlemcen.sanhaja.com',
                'password': 'staff123',
                'role': 'agency_staff',
                'agency': 'تلمسان'
            },
            'oran_staff1': {
                'email': 'staff1@oran.sanhaja.com',
                'password': 'staff123',
                'role': 'agency_staff',
                'agency': 'وهران'
            },
            'maghnia_staff1': {
                'email': 'staff1@maghnia.sanhaja.com',
                'password': 'staff123',
                'role': 'agency_staff',
                'agency': 'مغنية'
            }
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
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
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(response_data) < 5:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    else:
                        print(f"   Response: {type(response_data).__name__}")
                except:
                    print(f"   Response: Non-JSON content")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:200]}")

            return success, response.json() if response.content else {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self, email, password):
        """Test login and get token"""
        print(f"\n🔐 Testing login for: {email}")
        success, response = self.run_test(
            f"Login ({email})",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.current_user = response.get('user', {})
            print(f"   User: {self.current_user.get('name')} ({self.current_user.get('role')})")
            print(f"   Agency: {self.current_user.get('agency_id')}")
            return True
        return False

    def test_auth_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_dashboard(self):
        """Test dashboard statistics"""
        success, response = self.run_test(
            "Dashboard Statistics",
            "GET",
            "dashboard",
            200
        )
        if success:
            expected_keys = ['today_income', 'unpaid_invoices', 'week_bookings', 'cashbox_balance']
            for key in expected_keys:
                if key not in response:
                    print(f"   ⚠️  Missing key: {key}")
                else:
                    print(f"   {key}: {response[key]}")
        return success

    def test_crud_endpoints(self):
        """Test CRUD operations for all entities"""
        endpoints = [
            'agencies',
            'users', 
            'clients',
            'suppliers',
            'bookings',
            'invoices',
            'payments'
        ]
        
        results = {}
        for endpoint in endpoints:
            print(f"\n📋 Testing {endpoint.upper()} endpoints...")
            
            # Test GET (list)
            success, response = self.run_test(
                f"Get {endpoint}",
                "GET",
                endpoint,
                200
            )
            results[f"get_{endpoint}"] = success
            
            if success and isinstance(response, list):
                print(f"   Found {len(response)} {endpoint}")
                if len(response) > 0:
                    print(f"   Sample item keys: {list(response[0].keys())}")
        
        return results

    def test_agency_isolation(self):
        """Test that users only see their agency's data"""
        print(f"\n🏢 Testing Agency Isolation...")
        
        # Test with different Algerian agency users
        test_users = [
            ("admin@tlemcen.sanhaja.com", "admin123", "تلمسان"),
            ("admin@oran.sanhaja.com", "admin123", "وهران"),
        ]
        
        agency_data = {}
        
        for email, password, city in test_users:
            print(f"\n   Testing isolation for {city}...")
            if self.test_login(email, password):
                # Get clients for this agency
                success, clients = self.run_test(
                    f"Get Clients for {city}",
                    "GET",
                    "clients",
                    200
                )
                if success:
                    agency_data[city] = {
                        'agency_id': self.current_user.get('agency_id'),
                        'clients_count': len(clients) if isinstance(clients, list) else 0
                    }
                    print(f"   {city} Agency ID: {agency_data[city]['agency_id']}")
                    print(f"   {city} Clients: {agency_data[city]['clients_count']}")
        
        # Verify different agencies have different data
        if len(agency_data) >= 2:
            agencies = list(agency_data.keys())
            agency1, agency2 = agencies[0], agencies[1]
            
            if agency_data[agency1]['agency_id'] != agency_data[agency2]['agency_id']:
                print(f"✅ Agency isolation working - different agency IDs")
                return True
            else:
                print(f"❌ Agency isolation failed - same agency IDs")
                return False
        
        return False

    def test_error_handling(self):
        """Test error handling"""
        print(f"\n🚫 Testing Error Handling...")
        
        # Test invalid login
        success, _ = self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,
            data={"email": "invalid@test.com", "password": "wrong"}
        )
        
        # Test unauthorized access (without token)
        old_token = self.token
        self.token = None
        success2, _ = self.run_test(
            "Unauthorized Access",
            "GET",
            "dashboard",
            401
        )
        self.token = old_token
        
        return success and success2

def main():
    print("🚀 Starting Sanhaja Travel Agencies API Testing...")
    print("=" * 60)
    
    tester = SanhajaAPITester()
    
    # Test 1: Basic Authentication
    print("\n" + "="*60)
    print("PHASE 1: AUTHENTICATION TESTING")
    print("="*60)
    
    if not tester.test_login("admin@tlemcen.sanhaja.com", "admin123"):
        print("❌ Login failed, stopping tests")
        return 1
    
    # Test current user endpoint
    tester.test_auth_me()
    
    # Test 2: Dashboard
    print("\n" + "="*60)
    print("PHASE 2: DASHBOARD TESTING")
    print("="*60)
    
    tester.test_dashboard()
    
    # Test 3: CRUD Operations
    print("\n" + "="*60)
    print("PHASE 3: CRUD OPERATIONS TESTING")
    print("="*60)
    
    crud_results = tester.test_crud_endpoints()
    
    # Test 4: Agency Isolation
    print("\n" + "="*60)
    print("PHASE 4: MULTI-AGENCY ISOLATION TESTING")
    print("="*60)
    
    isolation_success = tester.test_agency_isolation()
    
    # Test 5: Error Handling
    print("\n" + "="*60)
    print("PHASE 5: ERROR HANDLING TESTING")
    print("="*60)
    
    # Re-login for error testing
    tester.test_login("admin@rabat.sanhaja.com", "admin123")
    error_handling_success = tester.test_error_handling()
    
    # Final Results
    print("\n" + "="*60)
    print("FINAL RESULTS")
    print("="*60)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"🎯 Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    print(f"\n📋 CRUD Results:")
    for endpoint, success in crud_results.items():
        status = "✅" if success else "❌"
        print(f"   {status} {endpoint}")
    
    print(f"\n🏢 Agency Isolation: {'✅' if isolation_success else '❌'}")
    print(f"🚫 Error Handling: {'✅' if error_handling_success else '❌'}")
    
    # Test different user roles
    print(f"\n👥 Testing Different User Roles:")
    role_tests = [
        ("admin@rabat.sanhaja.com", "admin123", "Admin"),
        ("accountant@rabat.sanhaja.com", "acc123", "Accountant"),
        ("agent@rabat.sanhaja.com", "agent123", "Agent")
    ]
    
    for email, password, role in role_tests:
        if tester.test_login(email, password):
            print(f"   ✅ {role} login successful")
        else:
            print(f"   ❌ {role} login failed")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())