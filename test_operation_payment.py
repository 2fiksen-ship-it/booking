#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class OperationPaymentTester:
    def __init__(self, base_url="https://travel-agency-hub-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.current_user = None
        self.tests_run = 0
        self.tests_passed = 0

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

    def test_new_operation_payment_integration(self):
        """Test NEW OPERATION-PAYMENT INTEGRATION system as requested in review"""
        print(f"\n💰 Testing NEW OPERATION-PAYMENT INTEGRATION SYSTEM (Review Request)...")
        print(f"   Testing operation-payment integration and updated permissions")
        
        results = {}
        
        # Step 1: Test Agency Staff Access Control (staff1@tlemcen.sanhaja.com / staff123)
        print(f"\n   1. Testing Agency Staff Access Control (staff1@tlemcen.sanhaja.com / staff123)...")
        auth_success = self.test_login('staff1@tlemcen.sanhaja.com', 'staff123')
        results['agency_staff_login'] = auth_success
        
        if not auth_success:
            print("   ❌ CRITICAL: Agency Staff login failed - cannot proceed with tests")
            return results
            
        print(f"   ✅ Agency Staff authenticated successfully")
        print(f"   User: {self.current_user.get('name')} ({self.current_user.get('role')})")
        print(f"   Agency: {self.current_user.get('agency_id')}")
        
        # Test 1a: Agency Staff should be BLOCKED from GET /api/invoices (403)
        print(f"\n   1a. Testing Agency Staff BLOCKED from GET /api/invoices (should be 403)...")
        success, response = self.run_test(
            "Agency Staff - Get Invoices (Should be BLOCKED)",
            "GET",
            "invoices",
            403
        )
        results['staff_blocked_invoices'] = success
        if success:
            print(f"   ✅ PASS: Agency Staff correctly blocked from invoices access (403)")
        else:
            print(f"   ❌ FAIL: Agency Staff should be blocked from invoices access")
        
        # Test 1b: Agency Staff should be BLOCKED from GET /api/bookings (403)
        print(f"\n   1b. Testing Agency Staff BLOCKED from GET /api/bookings (should be 403)...")
        success, response = self.run_test(
            "Agency Staff - Get Bookings (Should be BLOCKED)",
            "GET",
            "bookings",
            403
        )
        results['staff_blocked_bookings'] = success
        if success:
            print(f"   ✅ PASS: Agency Staff correctly blocked from bookings access (403)")
        else:
            print(f"   ❌ FAIL: Agency Staff should be blocked from bookings access")
        
        # Test 1c: Agency Staff should have access to GET /api/payments (only operation payments)
        print(f"\n   1c. Testing Agency Staff access to GET /api/payments (should only show operation payments)...")
        success, payments_data = self.run_test(
            "Agency Staff - Get Payments (Operation payments only)",
            "GET",
            "payments",
            200
        )
        results['staff_payments_access'] = success
        
        if success:
            print(f"   ✅ Agency Staff can access payments endpoint")
            print(f"   Total payments visible: {len(payments_data)}")
            
            # Verify only operation payments are visible (should have daily_operation_id)
            operation_payments = [p for p in payments_data if p.get('daily_operation_id')]
            invoice_payments = [p for p in payments_data if p.get('invoice_id')]
            
            print(f"   Operation payments: {len(operation_payments)}")
            print(f"   Invoice payments: {len(invoice_payments)}")
            
            if len(invoice_payments) == 0:
                print(f"   ✅ PASS: Agency Staff sees only operation payments (no invoice payments)")
                results['staff_operation_payments_only'] = True
            else:
                print(f"   ❌ FAIL: Agency Staff should not see invoice payments")
                results['staff_operation_payments_only'] = False
        
        # Test 1d: Agency Staff should have access to GET /api/daily-operations
        print(f"\n   1d. Testing Agency Staff access to GET /api/daily-operations (should work normally)...")
        success, operations_data = self.run_test(
            "Agency Staff - Get Daily Operations",
            "GET",
            "daily-operations",
            200
        )
        results['staff_daily_operations_access'] = success
        
        if success:
            print(f"   ✅ Agency Staff can access daily operations endpoint")
            print(f"   Total operations visible: {len(operations_data)}")
        
        # Step 2: Test General Accountant Permissions
        print(f"\n   2. Testing General Accountant Permissions (generalaccountant@sanhaja.com / acc123)...")
        auth_success = self.test_login('generalaccountant@sanhaja.com', 'acc123')
        results['general_accountant_login'] = auth_success
        
        if auth_success:
            print(f"   ✅ General Accountant authenticated successfully")
            
            # Test 2a: General Accountant should have access to GET /api/invoices
            success, invoices_data = self.run_test(
                "General Accountant - Get Invoices (Should work)",
                "GET",
                "invoices",
                200
            )
            results['accountant_invoices_access'] = success
            if success:
                print(f"   ✅ General Accountant can access invoices ({len(invoices_data)} invoices)")
            
            # Test 2b: General Accountant should have access to GET /api/bookings
            success, bookings_data = self.run_test(
                "General Accountant - Get Bookings (Should work)",
                "GET",
                "bookings",
                200
            )
            results['accountant_bookings_access'] = success
            if success:
                print(f"   ✅ General Accountant can access bookings ({len(bookings_data)} bookings)")
            
            # Test 2c: General Accountant should have access to GET /api/payments
            success, payments_data = self.run_test(
                "General Accountant - Get Payments (Should work)",
                "GET",
                "payments",
                200
            )
            results['accountant_payments_access'] = success
            if success:
                print(f"   ✅ General Accountant can access payments ({len(payments_data)} payments)")
        
        # Step 3: Test Operation-Payment Integration - Create test operation first
        print(f"\n   3. Testing Operation-Payment Integration...")
        
        # Login back as agency staff to create operation
        auth_success = self.test_login('staff1@tlemcen.sanhaja.com', 'staff123')
        
        if auth_success:
            # Get a service and client for creating operation
            success, services_data = self.run_test(
                "Get Services for Operation",
                "GET",
                "services",
                200
            )
            
            success2, clients_data = self.run_test(
                "Get Clients for Operation",
                "GET",
                "clients",
                200
            )
            
            if success and success2 and services_data and clients_data:
                service_id = services_data[0]['id']
                client_id = clients_data[0]['id']
                
                # Create a daily operation
                operation_data = {
                    "service_id": service_id,
                    "client_id": client_id,
                    "base_price": 100000.0,  # 100,000 DZD
                    "discount_amount": 0.0,
                    "notes": "Test operation for payment integration"
                }
                
                success, operation_response = self.run_test(
                    "Create Daily Operation for Payment Testing",
                    "POST",
                    "daily-operations",
                    200,
                    data=operation_data
                )
                results['create_test_operation'] = success
                
                if success:
                    operation_id = operation_response['id']
                    print(f"   ✅ Test operation created: {operation_id}")
                    
                    # Test 3a: Add Payment to Operation (POST /api/daily-operations/{id}/payments)
                    print(f"\n   3a. Testing Add Payment to Operation...")
                    
                    payment_data = {
                        "method": "cash",
                        "amount": 50000.0,  # 50,000 DZD (partial payment)
                        "payment_date": datetime.now().isoformat(),
                        "notes": "Partial payment for operation"
                    }
                    
                    success, payment_response = self.run_test(
                        "Add Payment to Operation",
                        "POST",
                        f"daily-operations/{operation_id}/payments",
                        200,
                        data=payment_data
                    )
                    results['add_payment_to_operation'] = success
                    
                    if success:
                        payment_id = payment_response['id']
                        print(f"   ✅ Payment added to operation: {payment_id}")
                        print(f"   Payment amount: {payment_response['amount']} DZD")
                        
                        # Test validation - try to add payment exceeding remaining amount
                        print(f"\n   3a-validation. Testing payment validation (exceeding remaining amount)...")
                        
                        invalid_payment_data = {
                            "method": "cash",
                            "amount": 60000.0,  # 60,000 DZD (exceeds remaining 50,000)
                            "payment_date": datetime.now().isoformat(),
                            "notes": "Invalid payment - exceeds remaining"
                        }
                        
                        success, response = self.run_test(
                            "Add Invalid Payment (Exceeds Remaining)",
                            "POST",
                            f"daily-operations/{operation_id}/payments",
                            400,
                            data=invalid_payment_data
                        )
                        results['payment_validation'] = success
                        if success:
                            print(f"   ✅ Payment validation working - correctly rejects excessive amounts")
                        
                        # Test 3b: Get Operation Payments (GET /api/daily-operations/{id}/payments)
                        print(f"\n   3b. Testing Get Operation Payments...")
                        
                        success, payments_list = self.run_test(
                            "Get Operation Payments",
                            "GET",
                            f"daily-operations/{operation_id}/payments",
                            200
                        )
                        results['get_operation_payments'] = success
                        
                        if success:
                            print(f"   ✅ Retrieved operation payments: {len(payments_list)} payments")
                            if payments_list:
                                print(f"   First payment: {payments_list[0]['amount']} DZD")
                        
                        # Test 3c: Get Payment Status (GET /api/daily-operations/{id}/payment-status)
                        print(f"\n   3c. Testing Get Operation Payment Status...")
                        
                        success, status_response = self.run_test(
                            "Get Operation Payment Status",
                            "GET",
                            f"daily-operations/{operation_id}/payment-status",
                            200
                        )
                        results['get_payment_status'] = success
                        
                        if success:
                            print(f"   ✅ Payment status retrieved successfully")
                            print(f"   Total Amount: {status_response['total_amount']} DZD")
                            print(f"   Total Paid: {status_response['total_paid']} DZD")
                            print(f"   Remaining Amount: {status_response['remaining_amount']} DZD")
                            print(f"   Payment Status: {status_response['payment_status']}")
                            
                            # Verify calculations
                            expected_remaining = 100000.0 - 50000.0  # 50,000 DZD remaining
                            if abs(status_response['remaining_amount'] - expected_remaining) < 0.01:
                                print(f"   ✅ Payment calculations are correct")
                                results['payment_calculations_correct'] = True
                            else:
                                print(f"   ❌ Payment calculations incorrect")
                                results['payment_calculations_correct'] = False
                            
                            # Verify status is "partially_paid"
                            if status_response['payment_status'] == 'partially_paid':
                                print(f"   ✅ Payment status correctly shows 'partially_paid'")
                                results['payment_status_correct'] = True
                            else:
                                print(f"   ❌ Payment status should be 'partially_paid'")
                                results['payment_status_correct'] = False
                        
                        # Test 3d: Staff can only add payments to their own operations
                        print(f"\n   3d. Testing staff can only add payments to their own operations...")
                        
                        # Login as different staff member
                        other_staff_success = self.test_login('staff2@tlemcen.sanhaja.com', 'staff123')
                        
                        if other_staff_success:
                            # Try to add payment to operation created by staff1
                            success, response = self.run_test(
                                "Other Staff - Add Payment to Different Staff Operation (Should Fail)",
                                "POST",
                                f"daily-operations/{operation_id}/payments",
                                403,
                                data=payment_data
                            )
                            results['staff_own_operations_only'] = success
                            if success:
                                print(f"   ✅ Staff correctly blocked from adding payments to other staff operations")
                        
                        # Test 3e: General Accountant can add payments to any operation
                        print(f"\n   3e. Testing General Accountant can add payments to any operation...")
                        
                        accountant_success = self.test_login('generalaccountant@sanhaja.com', 'acc123')
                        
                        if accountant_success:
                            remaining_payment_data = {
                                "method": "bank",
                                "amount": 50000.0,  # Remaining 50,000 DZD
                                "payment_date": datetime.now().isoformat(),
                                "notes": "Final payment by accountant"
                            }
                            
                            success, payment_response = self.run_test(
                                "General Accountant - Add Payment to Any Operation",
                                "POST",
                                f"daily-operations/{operation_id}/payments",
                                200,
                                data=remaining_payment_data
                            )
                            results['accountant_any_operation'] = success
                            
                            if success:
                                print(f"   ✅ General Accountant can add payments to any operation")
                                
                                # Test final payment status
                                success, final_status = self.run_test(
                                    "Get Final Payment Status",
                                    "GET",
                                    f"daily-operations/{operation_id}/payment-status",
                                    200
                                )
                                
                                if success:
                                    print(f"   Final Status: {final_status['payment_status']}")
                                    print(f"   Final Remaining: {final_status['remaining_amount']} DZD")
                                    
                                    if final_status['payment_status'] == 'fully_paid':
                                        print(f"   ✅ Operation now shows 'fully_paid' status")
                                        results['fully_paid_status'] = True
                                    else:
                                        print(f"   ❌ Operation should show 'fully_paid' status")
                                        results['fully_paid_status'] = False
        
        # Step 4: Test End-to-End Operation Payment Flow
        print(f"\n   4. Testing End-to-End Operation Payment Flow...")
        
        # Login as agency staff for complete workflow
        auth_success = self.test_login('staff1@tlemcen.sanhaja.com', 'staff123')
        
        if auth_success and services_data and clients_data:
            # Create new operation for end-to-end test
            e2e_operation_data = {
                "service_id": services_data[0]['id'],
                "client_id": clients_data[0]['id'],
                "base_price": 75000.0,  # 75,000 DZD
                "discount_amount": 0.0,
                "notes": "End-to-end payment flow test"
            }
            
            success, e2e_operation = self.run_test(
                "E2E - Create Daily Operation",
                "POST",
                "daily-operations",
                200,
                data=e2e_operation_data
            )
            
            if success:
                e2e_operation_id = e2e_operation['id']
                print(f"   ✅ E2E Operation created: {e2e_operation_id}")
                
                # Step 4a: Add partial payment
                partial_payment = {
                    "method": "cash",
                    "amount": 25000.0,  # 25,000 DZD
                    "payment_date": datetime.now().isoformat(),
                    "notes": "First partial payment"
                }
                
                success, _ = self.run_test(
                    "E2E - Add Partial Payment",
                    "POST",
                    f"daily-operations/{e2e_operation_id}/payments",
                    200,
                    data=partial_payment
                )
                
                if success:
                    # Step 4b: Verify partially paid status
                    success, status = self.run_test(
                        "E2E - Verify Partially Paid Status",
                        "GET",
                        f"daily-operations/{e2e_operation_id}/payment-status",
                        200
                    )
                    
                    if success and status['payment_status'] == 'partially_paid':
                        print(f"   ✅ E2E - Operation correctly shows 'partially_paid'")
                        
                        # Step 4c: Add remaining payment
                        remaining_payment = {
                            "method": "bank",
                            "amount": 50000.0,  # Remaining 50,000 DZD
                            "payment_date": datetime.now().isoformat(),
                            "notes": "Final payment"
                        }
                        
                        success, _ = self.run_test(
                            "E2E - Add Remaining Payment",
                            "POST",
                            f"daily-operations/{e2e_operation_id}/payments",
                            200,
                            data=remaining_payment
                        )
                        
                        if success:
                            # Step 4d: Verify fully paid status
                            success, final_status = self.run_test(
                                "E2E - Verify Fully Paid Status",
                                "GET",
                                f"daily-operations/{e2e_operation_id}/payment-status",
                                200
                            )
                            
                            if success and final_status['payment_status'] == 'fully_paid':
                                print(f"   ✅ E2E - Operation correctly shows 'fully_paid'")
                                results['e2e_workflow_complete'] = True
                            else:
                                print(f"   ❌ E2E - Final status should be 'fully_paid'")
                                results['e2e_workflow_complete'] = False
        
        return results

if __name__ == "__main__":
    tester = OperationPaymentTester()
    
    print("🚀 Starting NEW OPERATION-PAYMENT INTEGRATION Testing...")
    print("=" * 80)
    
    results = tester.test_new_operation_payment_integration()
    
    # Print final summary
    print(f"\n" + "="*80)
    print(f"FINAL TEST SUMMARY")
    print(f"="*80)
    print(f"Total Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "No tests run")
    
    # Detailed results
    print(f"\n📊 Detailed Results:")
    passed_tests = []
    failed_tests = []
    
    for key, value in results.items():
        status = '✅' if value else '❌'
        print(f"   {status} {key}: {value}")
        if value:
            passed_tests.append(key)
        else:
            failed_tests.append(key)
    
    if tester.tests_passed == tester.tests_run:
        print(f"\n🎉 ALL TESTS PASSED!")
    else:
        failed = tester.tests_run - tester.tests_passed
        print(f"\n⚠️  {failed} tests failed")
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test}")
    
    print(f"="*80)