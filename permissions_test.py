#!/usr/bin/env python3
"""
Urgent Permissions Issue Test
Testing: Agency staff getting super_admin permissions instead of agency_staff
"""

import requests
import json
from datetime import datetime

class PermissionsIssueTester:
    def __init__(self, base_url="https://travel-ops-manager.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.current_user = None
        
    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
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

    def test_urgent_permissions_issue(self):
        """Test urgent permissions issue: Agency staff getting super_admin permissions instead of agency_staff"""
        print(f"\n🚨 URGENT PERMISSIONS ISSUE TESTING")
        print(f"   Issue: User created with 'agency_staff' role gets 'super_admin' permissions")
        print(f"   Testing: Create user → Verify role in DB → Test login → Test permissions")
        
        results = {}
        test_user_email = f"teststaff@agency.com"
        test_user_password = "test123"
        created_user_id = None
        
        # Step 1: Login as Super Admin to create new user
        print(f"\n   1. Super Admin Login (superadmin@sanhaja.com/super123)...")
        auth_success = self.test_login('superadmin@sanhaja.com', 'super123')
        results['super_admin_login'] = auth_success
        
        if not auth_success:
            print("   ❌ CRITICAL: Super Admin login failed - cannot proceed")
            return results
            
        print(f"   ✅ Super Admin authenticated successfully")
        
        # Get available agencies to use one for the test user
        success, agencies = self.run_test(
            "Get Agencies for User Creation",
            "GET",
            "agencies",
            200
        )
        
        if not success or not agencies:
            print("   ❌ CRITICAL: Cannot get agencies - cannot proceed")
            return results
            
        test_agency_id = agencies[0]['id']  # Use first agency
        test_agency_name = agencies[0].get('name', 'Unknown')
        print(f"   Using agency: {test_agency_name} (ID: {test_agency_id})")
        
        # Step 2: Create new user with agency_staff role
        print(f"\n   2. Creating new user with 'agency_staff' role...")
        success, response = self.run_test(
            "Create Agency Staff User",
            "POST",
            "users",
            200,
            data={
                "name": "موظف تجريبي",
                "email": test_user_email,
                "password": test_user_password,
                "role": "agency_staff",
                "agency_id": test_agency_id
            }
        )
        results['create_user'] = success
        
        if success:
            print(f"   ✅ User created successfully")
            if 'id' in response:
                created_user_id = response['id']
                print(f"   User ID: {created_user_id}")
            else:
                print(f"   Response: {response}")
        else:
            print(f"   ❌ CRITICAL: User creation failed - cannot proceed")
            return results
        
        # Step 3: Verify role in database by getting user info
        print(f"\n   3. Verifying role saved correctly in database...")
        success, users_list = self.run_test(
            "Get All Users to Verify Role",
            "GET",
            "users",
            200
        )
        results['verify_role_in_db'] = success
        
        if success:
            # Find our test user
            test_user_in_db = None
            for user in users_list:
                if user.get('email') == test_user_email:
                    test_user_in_db = user
                    break
            
            if test_user_in_db:
                db_role = test_user_in_db.get('role')
                db_agency_id = test_user_in_db.get('agency_id')
                
                print(f"   User found in database:")
                print(f"   - Email: {test_user_in_db.get('email')}")
                print(f"   - Role: {db_role}")
                print(f"   - Agency ID: {db_agency_id}")
                
                if db_role == "agency_staff":
                    print(f"   ✅ PASS: Role correctly saved as 'agency_staff'")
                    results['role_saved_correctly'] = True
                else:
                    print(f"   ❌ CRITICAL BUG: Role saved as '{db_role}' instead of 'agency_staff'")
                    results['role_saved_correctly'] = False
                
                if db_agency_id == test_agency_id:
                    print(f"   ✅ PASS: Agency ID correctly saved")
                    results['agency_saved_correctly'] = True
                else:
                    print(f"   ❌ FAIL: Agency ID incorrect")
                    results['agency_saved_correctly'] = False
            else:
                print(f"   ❌ CRITICAL: Test user not found in database")
                results['role_saved_correctly'] = False
                results['agency_saved_correctly'] = False
        
        # Step 4: Test login with new user
        print(f"\n   4. Testing login with new user...")
        auth_success = self.test_login(test_user_email, test_user_password)
        results['new_user_login'] = auth_success
        
        if auth_success:
            print(f"   ✅ New user login successful")
            
            # Check role in login response
            login_role = self.current_user.get('role')
            login_agency_id = self.current_user.get('agency_id')
            
            print(f"   Login response:")
            print(f"   - Name: {self.current_user.get('name')}")
            print(f"   - Email: {self.current_user.get('email')}")
            print(f"   - Role: {login_role}")
            print(f"   - Agency ID: {login_agency_id}")
            
            if login_role == "agency_staff":
                print(f"   ✅ PASS: Login returns correct role 'agency_staff'")
                results['login_role_correct'] = True
            else:
                print(f"   ❌ CRITICAL BUG: Login returns role '{login_role}' instead of 'agency_staff'")
                results['login_role_correct'] = False
                
            if login_agency_id == test_agency_id:
                print(f"   ✅ PASS: Login returns correct agency ID")
                results['login_agency_correct'] = True
            else:
                print(f"   ❌ FAIL: Login returns incorrect agency ID")
                results['login_agency_correct'] = False
        else:
            print(f"   ❌ CRITICAL: New user login failed")
            return results
        
        # Step 5: Test permissions - Should NOT be able to access /users (403)
        print(f"\n   5. Testing permissions - Should NOT access /users endpoint...")
        success, response = self.run_test(
            "Agency Staff - Access Users (Should Fail)",
            "GET",
            "users",
            403
        )
        results['users_access_denied'] = success
        
        if success:
            print(f"   ✅ PASS: Agency staff correctly denied access to /users (403)")
        else:
            print(f"   ❌ CRITICAL BUG: Agency staff can access /users (should be 403)")
        
        # Step 6: Test permissions - Should only access their agency data
        print(f"\n   6. Testing agency data isolation...")
        
        # Test clients access (should only see their agency)
        success, clients = self.run_test(
            "Agency Staff - Get Clients (Own Agency Only)",
            "GET",
            "clients",
            200
        )
        results['clients_access'] = success
        
        if success:
            print(f"   ✅ Agency staff can access clients")
            print(f"   Clients visible: {len(clients)}")
            
            # Check if all clients belong to their agency
            if clients:
                agency_ids = set(client.get('agency_id') for client in clients)
                if len(agency_ids) == 1 and test_agency_id in agency_ids:
                    print(f"   ✅ PASS: Only sees clients from their own agency")
                    results['agency_isolation'] = True
                else:
                    print(f"   ❌ BUG: Sees clients from {len(agency_ids)} agencies (should be 1)")
                    results['agency_isolation'] = False
            else:
                print(f"   ✅ No clients visible (acceptable for new agency)")
                results['agency_isolation'] = True
        
        # Step 7: Test Super Admin functions should be denied
        print(f"\n   7. Testing Super Admin functions should be denied...")
        
        # Try to create another user (should fail)
        success, response = self.run_test(
            "Agency Staff - Create User (Should Fail)",
            "POST",
            "users",
            403,
            data={
                "name": "Should Fail",
                "email": "shouldfail@test.com",
                "password": "test123",
                "role": "agency_staff",
                "agency_id": test_agency_id
            }
        )
        results['user_creation_denied'] = success
        
        if success:
            print(f"   ✅ PASS: Agency staff correctly denied user creation (403)")
        else:
            print(f"   ❌ CRITICAL BUG: Agency staff can create users (should be 403)")
        
        # Try to access agencies endpoint (should be restricted)
        success, agencies_response = self.run_test(
            "Agency Staff - Get Agencies",
            "GET",
            "agencies",
            200
        )
        
        if success:
            print(f"   ✅ Agency staff can access agencies")
            print(f"   Agencies visible: {len(agencies_response)}")
            
            if len(agencies_response) == 1:
                print(f"   ✅ PASS: Only sees their own agency")
                results['agencies_isolation'] = True
            else:
                print(f"   ❌ BUG: Sees {len(agencies_response)} agencies (should be 1)")
                results['agencies_isolation'] = False
        
        # Step 8: Clean up - Delete test user (login as Super Admin first)
        print(f"\n   8. Cleaning up test user...")
        if self.test_login('superadmin@sanhaja.com', 'super123'):
            if created_user_id:
                success, response = self.run_test(
                    "Delete Test User",
                    "DELETE",
                    f"users/{created_user_id}",
                    200
                )
                if success:
                    print(f"   ✅ Test user cleaned up successfully")
                else:
                    print(f"   ⚠️  Could not delete test user (manual cleanup needed)")
        
        return results

def main():
    tester = PermissionsIssueTester()
    
    # Run the urgent permissions issue test
    print("🚨 Starting URGENT Permissions Issue Testing...")
    print("=" * 80)
    
    results = tester.test_urgent_permissions_issue()
    
    # Print summary
    print(f"\n" + "=" * 80)
    print(f"🚨 URGENT PERMISSIONS ISSUE TEST SUMMARY")
    print(f"=" * 80)
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result is True)
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {total_tests - passed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "No tests run")
    
    print(f"\nDetailed Results:")
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} {test_name}")
    
    # Analyze the specific issue
    print(f"\n" + "=" * 80)
    print(f"🔍 PERMISSIONS ISSUE ANALYSIS")
    print(f"=" * 80)
    
    critical_issues = []
    
    # Check if role is saved correctly
    if not results.get('role_saved_correctly', False):
        critical_issues.append("❌ CRITICAL: Role not saved correctly in database")
    
    # Check if login returns correct role
    if not results.get('login_role_correct', False):
        critical_issues.append("❌ CRITICAL: Login returns wrong role")
    
    # Check if permissions are enforced
    if not results.get('users_access_denied', False):
        critical_issues.append("❌ CRITICAL: Agency staff can access /users endpoint")
    
    if not results.get('user_creation_denied', False):
        critical_issues.append("❌ CRITICAL: Agency staff can create users")
    
    # Check agency isolation
    if not results.get('agency_isolation', False):
        critical_issues.append("❌ CRITICAL: Agency data isolation not working")
    
    if critical_issues:
        print(f"\n🚨 CRITICAL PERMISSIONS ISSUES FOUND:")
        for issue in critical_issues:
            print(f"  {issue}")
        
        print(f"\n🔧 RECOMMENDED ACTIONS:")
        print(f"  1. Check user creation endpoint in backend/server.py")
        print(f"  2. Verify role assignment logic")
        print(f"  3. Check authentication middleware")
        print(f"  4. Verify permission decorators")
        print(f"  5. Test role-based access control")
        
        print(f"\n⚠️  SECURITY RISK: Agency staff users may have elevated permissions!")
    else:
        print(f"\n✅ NO CRITICAL PERMISSIONS ISSUES FOUND")
        print(f"   The permissions system is working correctly.")
        print(f"   Agency staff users have appropriate restricted access.")
    
    if passed_tests == total_tests:
        print(f"\n🎉 ALL TESTS PASSED! Permissions system is working correctly.")
    elif passed_tests >= total_tests * 0.8:
        print(f"\n⚠️  MOSTLY WORKING: {passed_tests}/{total_tests} tests passed. Minor issues detected.")
    else:
        print(f"\n❌ CRITICAL ISSUES: Only {passed_tests}/{total_tests} tests passed. Major fixes needed.")

if __name__ == "__main__":
    main()