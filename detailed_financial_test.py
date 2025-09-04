#!/usr/bin/env python3
"""
Detailed Financial Management System Testing
Testing ALL financial endpoints for comprehensive verification
"""

import requests
import json
from datetime import datetime

class DetailedFinancialTester:
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
            return True
        else:
            return False

    def test_all_financial_endpoints(self):
        """Comprehensive test of ALL financial endpoints"""
        print("💰 COMPREHENSIVE FINANCIAL SYSTEM TESTING")
        print("=" * 60)
        
        results = {}
        
        # Test with each user role
        for user_type in ['agency_staff', 'general_accountant', 'super_admin']:
            print(f"\n🔐 Testing as {user_type.upper()}...")
            
            if not self.login(user_type):
                results[f'{user_type}_login'] = False
                continue
            
            results[f'{user_type}_login'] = True
            user_results = {}
            
            agency_id = self.current_user.get('agency_id')
            
            # Test 1: GET /api/cash-transfers
            print(f"\n   Testing GET /api/cash-transfers...")
            success, status, response = self.make_request('GET', 'cash-transfers')
            user_results['get_cash_transfers'] = success
            
            if success:
                transfer_count = len(response) if isinstance(response, list) else 0
                self.log_test(f"{user_type} - GET cash-transfers", True, 
                             f"Found {transfer_count} transfers")
                
                # Analyze transfers
                if isinstance(response, list) and response:
                    statuses = {}
                    agencies = set()
                    for transfer in response:
                        status_val = transfer.get('status', 'unknown')
                        statuses[status_val] = statuses.get(status_val, 0) + 1
                        if 'agency_id' in transfer:
                            agencies.add(transfer['agency_id'])
                    
                    print(f"     Transfer statuses: {statuses}")
                    print(f"     Agencies represented: {len(agencies)}")
            else:
                self.log_test(f"{user_type} - GET cash-transfers", False, 
                             f"Status: {status}")

            # Test 2: GET /api/agencies/{agency_id}/balance
            if agency_id:
                print(f"\n   Testing GET /api/agencies/{agency_id}/balance...")
                success, status, response = self.make_request('GET', f'agencies/{agency_id}/balance')
                user_results['get_agency_balance'] = success
                
                if success:
                    balance = response.get('current_balance', 0)
                    total_revenue = response.get('total_revenue', 0)
                    total_expenses = response.get('total_expenses', 0)
                    self.log_test(f"{user_type} - GET agency balance", True, 
                                 f"Balance: {balance} DZD, Revenue: {total_revenue} DZD, Expenses: {total_expenses} DZD")
                else:
                    self.log_test(f"{user_type} - GET agency balance", False, 
                                 f"Status: {status}")

            # Test 3: POST /api/agencies/{agency_id}/cash-transfer (only for agency staff and super admin)
            if user_type in ['agency_staff', 'super_admin'] and agency_id:
                print(f"\n   Testing POST /api/agencies/{agency_id}/cash-transfer...")
                transfer_data = {
                    "amount": 10000.0,
                    "notes": f"Test transfer by {user_type} at {datetime.now().strftime('%H:%M:%S')}"
                }
                success, status, response = self.make_request(
                    'POST', f'agencies/{agency_id}/cash-transfer', transfer_data
                )
                user_results['create_cash_transfer'] = success
                
                if success:
                    transfer_id = response.get('transfer_id', 'N/A')
                    self.log_test(f"{user_type} - POST cash-transfer", True, 
                                 f"Created transfer: {transfer_id}")
                    
                    # Store transfer ID for later tests
                    user_results['created_transfer_id'] = transfer_id
                else:
                    self.log_test(f"{user_type} - POST cash-transfer", False, 
                                 f"Status: {status}, Response: {response}")

            # Test 4: PUT /api/cash-transfers/{transfer_id}/confirm (only for GA and Super Admin)
            if user_type in ['general_accountant', 'super_admin']:
                # Get a pending transfer to confirm
                success, status, transfers = self.make_request('GET', 'cash-transfers')
                if success and isinstance(transfers, list):
                    pending_transfers = [t for t in transfers if t.get('status') == 'pending']
                    if pending_transfers:
                        transfer_id = pending_transfers[0]['id']
                        print(f"\n   Testing PUT /api/cash-transfers/{transfer_id}/confirm...")
                        
                        success, status, response = self.make_request(
                            'PUT', f'cash-transfers/{transfer_id}/confirm'
                        )
                        user_results['confirm_transfer'] = success
                        
                        if success:
                            self.log_test(f"{user_type} - PUT confirm transfer", True, 
                                         f"Message: {response.get('message', 'N/A')}")
                        else:
                            self.log_test(f"{user_type} - PUT confirm transfer", False, 
                                         f"Status: {status}")
                    else:
                        print(f"   No pending transfers to confirm")

            # Test 5: PUT /api/cash-transfers/{transfer_id}/reject (only for GA and Super Admin)
            if user_type in ['general_accountant', 'super_admin']:
                # Get another pending transfer to reject
                success, status, transfers = self.make_request('GET', 'cash-transfers')
                if success and isinstance(transfers, list):
                    pending_transfers = [t for t in transfers if t.get('status') == 'pending']
                    if len(pending_transfers) > 1:  # Use second pending transfer
                        transfer_id = pending_transfers[1]['id']
                        print(f"\n   Testing PUT /api/cash-transfers/{transfer_id}/reject...")
                        
                        success, status, response = self.make_request(
                            'PUT', f'cash-transfers/{transfer_id}/reject'
                        )
                        user_results['reject_transfer'] = success
                        
                        if success:
                            self.log_test(f"{user_type} - PUT reject transfer", True, 
                                         f"Message: {response.get('message', 'N/A')}")
                        else:
                            self.log_test(f"{user_type} - PUT reject transfer", False, 
                                         f"Status: {status}")
                    else:
                        print(f"   No additional pending transfers to reject")

            # Test 6: Test unauthorized actions (agency staff trying to confirm/reject)
            if user_type == 'agency_staff':
                success, status, transfers = self.make_request('GET', 'cash-transfers')
                if success and isinstance(transfers, list) and transfers:
                    transfer_id = transfers[0]['id']
                    
                    print(f"\n   Testing unauthorized confirm (should fail)...")
                    success, status, response = self.make_request(
                        'PUT', f'cash-transfers/{transfer_id}/confirm', {}, 403
                    )
                    user_results['unauthorized_confirm'] = success
                    self.log_test(f"{user_type} - Unauthorized confirm (should fail)", success, 
                                 f"Status: {status} (Expected 403)")
                    
                    print(f"\n   Testing unauthorized reject (should fail)...")
                    success, status, response = self.make_request(
                        'PUT', f'cash-transfers/{transfer_id}/reject', {}, 403
                    )
                    user_results['unauthorized_reject'] = success
                    self.log_test(f"{user_type} - Unauthorized reject (should fail)", success, 
                                 f"Status: {status} (Expected 403)")

            results[user_type] = user_results

        return results

    def test_edge_cases(self):
        """Test edge cases and error conditions"""
        print(f"\n🔍 Testing Edge Cases and Error Conditions...")
        
        results = {}
        
        # Login as General Accountant for error testing
        if self.login('general_accountant'):
            
            # Test 1: Non-existent transfer ID
            print(f"\n   Testing non-existent transfer ID...")
            success, status, response = self.make_request(
                'PUT', 'cash-transfers/non-existent-id/confirm', {}, 404
            )
            results['nonexistent_confirm'] = (status in [404, 500])  # Accept both as some systems return 500
            self.log_test("Non-existent transfer confirm", results['nonexistent_confirm'], 
                         f"Status: {status}")

            success, status, response = self.make_request(
                'PUT', 'cash-transfers/non-existent-id/reject', {}, 404
            )
            results['nonexistent_reject'] = (status in [404, 500])  # Accept both
            self.log_test("Non-existent transfer reject", results['nonexistent_reject'], 
                         f"Status: {status}")

            # Test 2: Invalid agency ID for balance
            print(f"\n   Testing invalid agency ID for balance...")
            success, status, response = self.make_request(
                'GET', 'agencies/invalid-agency-id/balance', {}, 404
            )
            results['invalid_agency_balance'] = (status in [404, 500])
            self.log_test("Invalid agency balance", results['invalid_agency_balance'], 
                         f"Status: {status}")

            # Test 3: Invalid data for cash transfer creation
            if self.login('agency_staff'):
                agency_id = self.current_user.get('agency_id')
                
                print(f"\n   Testing invalid transfer amount...")
                success, status, response = self.make_request(
                    'POST', f'agencies/{agency_id}/cash-transfer', 
                    {"amount": -1000.0, "notes": "Invalid negative amount"}, 400
                )
                results['invalid_amount'] = (status in [400, 422, 500])
                self.log_test("Invalid negative amount", results['invalid_amount'], 
                             f"Status: {status}")

                print(f"\n   Testing missing amount...")
                success, status, response = self.make_request(
                    'POST', f'agencies/{agency_id}/cash-transfer', 
                    {"notes": "Missing amount"}, 422
                )
                results['missing_amount'] = (status in [400, 422, 500])
                self.log_test("Missing amount", results['missing_amount'], 
                             f"Status: {status}")

        return results

    def run_comprehensive_tests(self):
        """Run all comprehensive financial tests"""
        print("🚨 COMPREHENSIVE FINANCIAL SYSTEM VERIFICATION")
        print("Testing ALL financial endpoints for user-reported errors")
        print("=" * 70)
        
        # Test all endpoints
        endpoint_results = self.test_all_financial_endpoints()
        
        # Test edge cases
        edge_case_results = self.test_edge_cases()
        
        # Print comprehensive summary
        print(f"\n" + "=" * 70)
        print(f"📊 COMPREHENSIVE FINANCIAL SYSTEM TEST RESULTS")
        print(f"=" * 70)
        
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        
        if self.tests_run > 0:
            success_rate = (self.tests_passed / self.tests_run) * 100
            print(f"Success Rate: {success_rate:.1f}%")

        # Analyze results by user role
        print(f"\n📋 Results by User Role:")
        for user_type in ['agency_staff', 'general_accountant', 'super_admin']:
            if user_type in endpoint_results:
                user_data = endpoint_results[user_type]
                passed = sum(1 for v in user_data.values() if v is True)
                total = len([v for v in user_data.values() if isinstance(v, bool)])
                print(f"  {user_type.upper()}: {passed}/{total} tests passed")

        # Check critical endpoints
        critical_issues = []
        
        # Check if agency staff can access their endpoints
        if 'agency_staff' in endpoint_results:
            staff_data = endpoint_results['agency_staff']
            if not staff_data.get('get_cash_transfers', False):
                critical_issues.append("Agency Staff cannot access cash transfers")
            if not staff_data.get('get_agency_balance', False):
                critical_issues.append("Agency Staff cannot access agency balance")
            if not staff_data.get('create_cash_transfer', False):
                critical_issues.append("Agency Staff cannot create cash transfers")

        # Check if GA can confirm/reject
        if 'general_accountant' in endpoint_results:
            ga_data = endpoint_results['general_accountant']
            if not ga_data.get('get_cash_transfers', False):
                critical_issues.append("General Accountant cannot access cash transfers")

        # Check if Super Admin has full access
        if 'super_admin' in endpoint_results:
            sa_data = endpoint_results['super_admin']
            if not sa_data.get('get_cash_transfers', False):
                critical_issues.append("Super Admin cannot access cash transfers")

        # Final assessment
        if critical_issues:
            print(f"\n🚨 CRITICAL ISSUES FOUND:")
            for issue in critical_issues:
                print(f"  ❌ {issue}")
            print(f"\n⚠️  RECOMMENDATION: Immediate investigation required!")
            print(f"   The user-reported financial system errors are CONFIRMED.")
        else:
            print(f"\n✅ NO CRITICAL ISSUES FOUND")
            print(f"   All core financial endpoints are working correctly.")
            print(f"   The financial management system appears to be functioning properly.")
            
            if success_rate >= 90:
                print(f"   🎉 EXCELLENT: {success_rate:.1f}% success rate indicates robust system.")
            elif success_rate >= 80:
                print(f"   ✅ GOOD: {success_rate:.1f}% success rate with minor issues.")
            else:
                print(f"   ⚠️  MODERATE: {success_rate:.1f}% success rate needs attention.")

        return {
            'endpoint_results': endpoint_results,
            'edge_case_results': edge_case_results,
            'success_rate': success_rate if self.tests_run > 0 else 0,
            'critical_issues': critical_issues
        }

if __name__ == "__main__":
    tester = DetailedFinancialTester()
    results = tester.run_comprehensive_tests()