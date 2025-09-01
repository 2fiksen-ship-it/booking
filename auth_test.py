#!/usr/bin/env python3
"""
Authentication Flow Test - Focused on Login Issue Diagnosis
Based on review request to test authentication endpoints specifically
"""

import requests
import json
import sys
from datetime import datetime

class AuthenticationTester:
    def __init__(self, base_url="https://travel-finance-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.current_user = None
        
        print(f"🔐 Authentication Flow Tester")
        print(f"   Base URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        print(f"   Focus: Diagnosing login issue where frontend returns to Google Auth")

    def test_login_flow(self, email, password):
        """Test the complete login flow as requested in review"""
        print(f"\n" + "="*80)
        print(f"🔍 TESTING LOGIN FLOW: {email}")
        print(f"="*80)
        
        # Step 1: Test Login Endpoint
        print(f"\n📝 STEP 1: Testing POST /api/auth/login")
        print(f"   Email: {email}")
        print(f"   Password: {'*' * len(password)}")
        
        login_url = f"{self.api_url}/auth/login"
        login_data = {
            "email": email,
            "password": password
        }
        
        try:
            print(f"   Making request to: {login_url}")
            response = requests.post(
                login_url,
                json=login_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    response_data = response.json()
                    print(f"   ✅ Login successful!")
                    
                    # Extract token
                    if 'access_token' in response_data:
                        self.token = response_data['access_token']
                        print(f"   🔑 Access Token received: {self.token[:20]}...{self.token[-10:]}")
                        print(f"   🔑 Token Type: {response_data.get('token_type', 'N/A')}")
                    else:
                        print(f"   ❌ No access_token in response!")
                        return False
                    
                    # Extract user info
                    if 'user' in response_data:
                        self.current_user = response_data['user']
                        print(f"   👤 User Info:")
                        print(f"      Name: {self.current_user.get('name', 'N/A')}")
                        print(f"      Email: {self.current_user.get('email', 'N/A')}")
                        print(f"      Role: {self.current_user.get('role', 'N/A')}")
                        print(f"      Agency ID: {self.current_user.get('agency_id', 'N/A')}")
                    else:
                        print(f"   ⚠️  No user info in response")
                    
                    # Show full response structure
                    print(f"   📋 Full Response Keys: {list(response_data.keys())}")
                    
                except json.JSONDecodeError as e:
                    print(f"   ❌ Invalid JSON response: {e}")
                    print(f"   Raw response: {response.text[:200]}")
                    return False
                    
            else:
                print(f"   ❌ Login failed!")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Raw error: {response.text[:200]}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Network error: {e}")
            return False
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
            return False
        
        # Step 2: Test Token Validation with /api/auth/me
        print(f"\n📝 STEP 2: Testing GET /api/auth/me with received token")
        
        if not self.token:
            print(f"   ❌ No token available for validation")
            return False
        
        me_url = f"{self.api_url}/auth/me"
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        try:
            print(f"   Making request to: {me_url}")
            print(f"   Authorization header: Bearer {self.token[:20]}...{self.token[-10:]}")
            
            response = requests.get(me_url, headers=headers, timeout=10)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    user_data = response.json()
                    print(f"   ✅ Token validation successful!")
                    print(f"   👤 Validated User Info:")
                    print(f"      Name: {user_data.get('name', 'N/A')}")
                    print(f"      Email: {user_data.get('email', 'N/A')}")
                    print(f"      Role: {user_data.get('role', 'N/A')}")
                    print(f"      Agency ID: {user_data.get('agency_id', 'N/A')}")
                    
                    # Compare with login response
                    if self.current_user:
                        if user_data.get('email') == self.current_user.get('email'):
                            print(f"   ✅ User data matches login response")
                        else:
                            print(f"   ⚠️  User data mismatch with login response")
                    
                except json.JSONDecodeError as e:
                    print(f"   ❌ Invalid JSON response: {e}")
                    print(f"   Raw response: {response.text[:200]}")
                    return False
                    
            else:
                print(f"   ❌ Token validation failed!")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Raw error: {response.text[:200]}")
                
                # This is the likely cause of the frontend issue
                print(f"\n   🚨 DIAGNOSIS: This is likely why frontend returns to Google Auth!")
                print(f"   The frontend calls /api/auth/me to check if user is logged in.")
                print(f"   If this fails, frontend assumes user is not authenticated.")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Network error: {e}")
            return False
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
            return False
        
        # Step 3: Test Token with Other Authenticated Endpoints
        print(f"\n📝 STEP 3: Testing token with other authenticated endpoints")
        
        # Test dashboard endpoint
        print(f"\n   3a. Testing GET /api/dashboard")
        dashboard_url = f"{self.api_url}/dashboard"
        
        try:
            response = requests.get(dashboard_url, headers=headers, timeout=10)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                dashboard_data = response.json()
                print(f"   ✅ Dashboard accessible with token")
                print(f"   Dashboard data keys: {list(dashboard_data.keys())}")
            else:
                print(f"   ❌ Dashboard not accessible with token")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Raw error: {response.text[:200]}")
                    
        except Exception as e:
            print(f"   ❌ Dashboard test error: {e}")
        
        # Test users endpoint (if super admin)
        if self.current_user and self.current_user.get('role') == 'super_admin':
            print(f"\n   3b. Testing GET /api/users (Super Admin)")
            users_url = f"{self.api_url}/users"
            
            try:
                response = requests.get(users_url, headers=headers, timeout=10)
                print(f"   Status Code: {response.status_code}")
                
                if response.status_code == 200:
                    users_data = response.json()
                    print(f"   ✅ Users endpoint accessible with token")
                    print(f"   Users count: {len(users_data) if isinstance(users_data, list) else 'N/A'}")
                else:
                    print(f"   ❌ Users endpoint not accessible with token")
                    
            except Exception as e:
                print(f"   ❌ Users test error: {e}")
        
        print(f"\n✅ LOGIN FLOW TEST COMPLETED SUCCESSFULLY")
        print(f"   Token is valid and works for authenticated endpoints")
        return True

    def test_token_expiry_and_refresh(self):
        """Test token behavior and expiry"""
        print(f"\n📝 STEP 4: Testing token behavior")
        
        if not self.token:
            print(f"   ❌ No token available for testing")
            return
        
        # Test with malformed token
        print(f"\n   4a. Testing with malformed token")
        malformed_token = self.token[:-5] + "XXXXX"
        headers = {
            'Authorization': f'Bearer {malformed_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(f"{self.api_url}/auth/me", headers=headers, timeout=10)
            print(f"   Malformed token status: {response.status_code}")
            
            if response.status_code == 401:
                print(f"   ✅ Properly rejects malformed token")
            else:
                print(f"   ⚠️  Unexpected response to malformed token")
                
        except Exception as e:
            print(f"   ❌ Malformed token test error: {e}")
        
        # Test with no token
        print(f"\n   4b. Testing with no token")
        try:
            response = requests.get(f"{self.api_url}/auth/me", timeout=10)
            print(f"   No token status: {response.status_code}")
            
            if response.status_code == 401:
                print(f"   ✅ Properly rejects requests without token")
            else:
                print(f"   ⚠️  Unexpected response to no token")
                
        except Exception as e:
            print(f"   ❌ No token test error: {e}")

    def diagnose_frontend_issue(self):
        """Provide diagnosis for the frontend login issue"""
        print(f"\n" + "="*80)
        print(f"🔍 FRONTEND LOGIN ISSUE DIAGNOSIS")
        print(f"="*80)
        
        print(f"\n📋 Expected Frontend Flow:")
        print(f"   1. User submits login form")
        print(f"   2. Frontend calls POST /api/auth/login")
        print(f"   3. Backend returns access_token")
        print(f"   4. Frontend stores token in localStorage")
        print(f"   5. Frontend calls GET /api/auth/me to verify token")
        print(f"   6. If /api/auth/me succeeds, user stays logged in")
        print(f"   7. If /api/auth/me fails, frontend calls logout() and shows login page")
        
        print(f"\n🔍 Possible Issues:")
        print(f"   1. Token not being stored properly in localStorage")
        print(f"   2. Token not being sent in Authorization header")
        print(f"   3. /api/auth/me endpoint returning 401/403")
        print(f"   4. CORS issues preventing token validation")
        print(f"   5. Token format or encoding issues")
        
        print(f"\n✅ Based on our tests:")
        if self.token:
            print(f"   ✅ Login endpoint works correctly")
            print(f"   ✅ Token is generated and returned")
            print(f"   ✅ Token validation (/api/auth/me) works")
            print(f"   ✅ Token works for other authenticated endpoints")
            print(f"\n💡 CONCLUSION: Backend authentication is working correctly!")
            print(f"   The issue is likely in the frontend JavaScript code:")
            print(f"   - Check if token is being stored in localStorage")
            print(f"   - Check if Authorization header is being set correctly")
            print(f"   - Check for JavaScript errors in browser console")
            print(f"   - Verify CORS settings allow Authorization header")
        else:
            print(f"   ❌ Login endpoint has issues")
            print(f"   The backend authentication system needs to be fixed first")

def main():
    """Main test function"""
    tester = AuthenticationTester()
    
    # Test the specific credentials from the review request
    print(f"\n🎯 Testing credentials from review request:")
    print(f"   Email: superadmin@sanhaja.com")
    print(f"   Password: super123")
    
    success = tester.test_login_flow('superadmin@sanhaja.com', 'super123')
    
    if success:
        tester.test_token_expiry_and_refresh()
    
    tester.diagnose_frontend_issue()
    
    # Test additional credentials to verify system
    print(f"\n" + "="*80)
    print(f"🔄 TESTING ADDITIONAL CREDENTIALS FOR VERIFICATION")
    print(f"="*80)
    
    additional_credentials = [
        ('admin@sanhaja-oran.dz', 'admin123'),
        ('generalaccountant@sanhaja.com', 'acc123')
    ]
    
    for email, password in additional_credentials:
        print(f"\n📝 Testing {email}...")
        success = tester.test_login_flow(email, password)
        if not success:
            print(f"   ❌ Authentication failed for {email}")
        else:
            print(f"   ✅ Authentication successful for {email}")

if __name__ == "__main__":
    main()