#!/usr/bin/env python3
"""
URGENT Financial Management System Testing
Testing the specific endpoints mentioned in the review request
"""

import requests
import json
from datetime import datetime

class FinancialSystemTester:
    def __init__(self):
        self.base_url = "https://travel-ops-manager.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.token = None
        self.current_user = None
        self.tests_run = 0
        self.tests_passed = 0
        
        # Test credentials
        self.test_users = {
            'agency_staff': {
                'email': 'staff1@tlemcen.sanhaja.com',
                'password': 'staff123'
            },
            'general_accountant': {
                'email': 'generalaccountant@sanhaja.com',
                'password': 'acc123'
            },
            'super_admin': {
                'email': 'superadmin@sanhaja.com',
                'password': 'super123'
            }
        }

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name}")
        if details:
            print(f"   {details}")

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make API request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

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
            
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"text": response.text[:200]}

            return success, response.status_code, response_data

        except requests.exceptions.RequestException as e:
            return False, 0, {"error": str(e)}
        except Exception as e:
            return False, 0, {"error": str(e)}

    def login(self, user_type):
        """Login with specified user type"""
        user = self.test_users[user_type]
        success, status, response = self.make_request(
            'POST', 'auth/login', 
            {"email": user['email'], "password": user['password']}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.current_user = response.get('user', {})
            self.log_test(f"Login as {user_type}", True, 
                         f"User: {self.current_user.get('name')} ({self.current_user.get('role')})")
            return True
        else:
            self.log_test(f"Login as {user_type}", False, f"Status: {status}, Response: {response}")
            return False

    def test_financial_endpoints(self):
        """Test the specific financial endpoints mentioned in review request"""
        print("🚨 URGENT: Testing Financial Management System Endpoints")
        print("=" * 60)
        
        results = {}
        transfer_id = None
        agency_id = None

        # Step 1: Login as Agency Staff to create a transfer
        print("\n1. Testing Agency Staff Access...")
        if not self.login('agency_staff'):
            return {"error": "Agency staff login failed"}
        
        agency_id = self.current_user.get('agency_id')
        
        # Test GET /api/agencies/{agency_id}/balance
        print(f"\n2. Testing GET /api/agencies/{agency_id}/balance...")
        success, status, response = self.make_request('GET', f'agencies/{agency_id}/balance')
        self.log_test("GET Agency Balance", success, 
                     f"Status: {status}, Balance: {response.get('current_balance', 'N/A')}")
        results['agency_balance'] = success

        # Test POST /api/agencies/{agency_id}/cash-transfer
        print(f"\n3. Testing POST /api/agencies/{agency_id}/cash-transfer...")
        transfer_data = {
            "amount": 25000.0,
            "notes": "URGENT TEST: Financial system verification"
        }
        success, status, response = self.make_request(
            'POST', f'agencies/{agency_id}/cash-transfer', transfer_data
        )
        
        if success and 'transfer_id' in response:
            transfer_id = response['transfer_id']
            self.log_test("POST Create Cash Transfer", True, 
                         f"Transfer ID: {transfer_id}")
        else:
            self.log_test("POST Create Cash Transfer", False, 
                         f"Status: {status}, Response: {response}")
        results['create_transfer'] = success

        # Test GET /api/cash-transfers
        print(f"\n4. Testing GET /api/cash-transfers (Agency Staff view)...")
        success, status, response = self.make_request('GET', 'cash-transfers')
        if success:
            transfer_count = len(response) if isinstance(response, list) else 0
            self.log_test("GET Cash Transfers (Agency Staff)", True, 
                         f"Found {transfer_count} transfers")
        else:
            self.log_test("GET Cash Transfers (Agency Staff)", False, 
                         f"Status: {status}, Response: {response}")
        results['get_transfers_staff'] = success

        # Step 2: Test Agency Staff cannot confirm/reject (should get 403)
        if transfer_id:
            print(f"\n5. Testing Agency Staff CANNOT confirm/reject transfers...")
            
            # Test confirm (should fail with 403)
            success, status, response = self.make_request(
                'PUT', f'cash-transfers/{transfer_id}/confirm', {}, 403
            )
            self.log_test("Agency Staff Confirm Transfer (Should Fail)", success, 
                         f"Status: {status} (Expected 403)")
            results['staff_cannot_confirm'] = success

            # Test reject (should fail with 403)
            success, status, response = self.make_request(
                'PUT', f'cash-transfers/{transfer_id}/reject', {}, 403
            )
            self.log_test("Agency Staff Reject Transfer (Should Fail)", success, 
                         f"Status: {status} (Expected 403)")
            results['staff_cannot_reject'] = success

        # Step 3: Login as General Accountant
        print(f"\n6. Testing General Accountant Access...")
        if not self.login('general_accountant'):
            results['ga_login_failed'] = True
            return results

        # Test GET /api/cash-transfers (General Accountant view)
        print(f"\n7. Testing GET /api/cash-transfers (General Accountant view)...")
        success, status, response = self.make_request('GET', 'cash-transfers')
        if success:
            transfer_count = len(response) if isinstance(response, list) else 0
            self.log_test("GET Cash Transfers (General Accountant)", True, 
                         f"Found {transfer_count} transfers")
            
            # Check if our test transfer is visible
            if transfer_id and isinstance(response, list):
                test_transfer = next((t for t in response if t.get('id') == transfer_id), None)
                if test_transfer:
                    self.log_test("Test Transfer Visible to GA", True, 
                                 f"Status: {test_transfer.get('status', 'unknown')}")
                else:
                    self.log_test("Test Transfer Visible to GA", False, "Transfer not found")
        else:
            self.log_test("GET Cash Transfers (General Accountant)", False, 
                         f"Status: {status}, Response: {response}")
        results['get_transfers_ga'] = success

        # Test PUT /api/cash-transfers/{transfer_id}/confirm
        if transfer_id:
            print(f"\n8. Testing PUT /api/cash-transfers/{transfer_id}/confirm...")
            success, status, response = self.make_request(
                'PUT', f'cash-transfers/{transfer_id}/confirm'
            )
            self.log_test("General Accountant Confirm Transfer", success, 
                         f"Status: {status}, Message: {response.get('message', 'N/A')}")
            results['ga_confirm_transfer'] = success

        # Step 4: Create another transfer to test rejection
        print(f"\n9. Creating second transfer for rejection test...")
        if self.login('agency_staff'):
            agency_id = self.current_user.get('agency_id')
            transfer_data = {
                "amount": 15000.0,
                "notes": "URGENT TEST: Second transfer for rejection"
            }
            success, status, response = self.make_request(
                'POST', f'agencies/{agency_id}/cash-transfer', transfer_data
            )
            
            second_transfer_id = None
            if success and 'transfer_id' in response:
                second_transfer_id = response['transfer_id']
                self.log_test("Create Second Transfer", True, 
                             f"Transfer ID: {second_transfer_id}")
            else:
                self.log_test("Create Second Transfer", False, 
                             f"Status: {status}")
            results['create_second_transfer'] = success

            # Step 5: Login as Super Admin and test rejection
            print(f"\n10. Testing Super Admin Rejection...")
            if self.login('super_admin') and second_transfer_id:
                
                # Test PUT /api/cash-transfers/{transfer_id}/reject
                success, status, response = self.make_request(
                    'PUT', f'cash-transfers/{second_transfer_id}/reject'
                )
                self.log_test("Super Admin Reject Transfer", success, 
                             f"Status: {status}, Message: {response.get('message', 'N/A')}")
                results['sa_reject_transfer'] = success

        # Step 6: Test error handling for non-existent transfers
        print(f"\n11. Testing Error Handling...")
        success, status, response = self.make_request(
            'PUT', 'cash-transfers/non-existent-id/confirm', {}, 404
        )
        self.log_test("Error Handling - Non-existent Transfer", success, 
                     f"Status: {status} (Expected 404)")
        results['error_handling'] = success

        return results

    def run_tests(self):
        """Run all financial system tests"""
        print("🚨 URGENT FINANCIAL SYSTEM TESTING")
        print("Testing endpoints reported by user as having errors")
        print("=" * 60)
        
        results = self.test_financial_endpoints()
        
        # Print summary
        print(f"\n" + "=" * 60)
        print(f"📊 FINANCIAL SYSTEM TEST RESULTS")
        print(f"=" * 60)
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        
        if self.tests_run > 0:
            success_rate = (self.tests_passed / self.tests_run) * 100
            print(f"Success Rate: {success_rate:.1f}%")
        
        # Detailed results
        print(f"\nDetailed Results:")
        for test_name, result in results.items():
            if isinstance(result, bool):
                status = "✅ PASS" if result else "❌ FAIL"
                print(f"  {status} {test_name}")
        
        # Critical issues check
        critical_endpoints = ['agency_balance', 'create_transfer', 'get_transfers_staff', 
                            'ga_confirm_transfer', 'sa_reject_transfer']
        
        critical_failures = []
        for endpoint in critical_endpoints:
            if not results.get(endpoint, False):
                critical_failures.append(endpoint)
        
        if critical_failures:
            print(f"\n🚨 CRITICAL ISSUES FOUND:")
            for failure in critical_failures:
                print(f"  ❌ {failure}")
            print(f"\n⚠️  RECOMMENDATION: Immediate investigation required!")
        else:
            print(f"\n✅ ALL CRITICAL ENDPOINTS WORKING")
            print(f"   Financial management system appears to be functioning correctly")
        
        return results

if __name__ == "__main__":
    tester = FinancialSystemTester()
    results = tester.run_tests()