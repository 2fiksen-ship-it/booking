#!/usr/bin/env python3
"""
Service Installments Module Testing
Testing the NEW SERVICE INSTALLMENTS MODULE implementation as requested in review
"""

import requests
import sys
import json
from datetime import datetime, timedelta
from urllib.parse import quote

class InstallmentTester:
    def __init__(self):
        # Get backend URL from environment
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip()
                    break
        
        self.api_url = f"{self.base_url}/api"
        self.token = None
        self.current_user = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, test_name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        self.tests_run += 1
        
        url = f"{self.api_url}/{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        
        print(f"\n🔍 Testing {test_name}...")
        print(f"   URL: {url}")
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            if response.status_code == expected_status:
                print(f"✅ Passed - Status: {response.status_code}")
                self.tests_passed += 1
                
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict):
                        print(f"   Response: dict")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    else:
                        print(f"   Response: {type(response_data).__name__}")
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, None
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
            return False, None

    def test_login(self, email, password):
        """Test user login"""
        print(f"\n🔐 Testing login for: {email}")
        
        success, response = self.run_test(
            f"Login ({email})",
            "POST",
            "auth/login",
            200,
            {"email": email, "password": password}
        )
        
        if success and response:
            self.token = response.get('access_token')
            self.current_user = response.get('user', {})
            print(f"   User: {self.current_user.get('name')} ({self.current_user.get('role')})")
            print(f"   Agency: {self.current_user.get('agency_id')}")
            return True
        
        return False

    def test_service_installments_module(self):
        """Test the NEW SERVICE INSTALLMENTS MODULE implementation"""
        print(f"\n💰 Testing SERVICE INSTALLMENTS MODULE (Review Request)...")
        print(f"   Testing comprehensive installment system with custom dates, partial payments, and plan management")
        
        results = {}
        
        # Step 1: Login as Agency Staff
        print(f"\n   1. Agency Staff Login (staff1@tlemcen.sanhaja.com / staff123)...")
        auth_success = self.test_login('staff1@tlemcen.sanhaja.com', 'staff123')
        results['agency_staff_login'] = auth_success
        
        if not auth_success:
            print("   ❌ CRITICAL: Agency Staff login failed - cannot proceed with installment tests")
            return results
            
        print(f"   ✅ Agency Staff authenticated successfully")
        
        # Step 2: Create a Service Sale first
        print(f"\n   2. Creating Service Sale for Installment Testing...")
        
        service_sale_data = {
            "service_name": "عمرة اقتصادية - تقسيط",
            "client_name": "أحمد محمد - عميل التقسيط",
            "amount": 120000.0,
            "notes": "خدمة عمرة للاختبار نظام التقسيط"
        }
        
        success, sale_response = self.run_test(
            "Create Service Sale for Installments",
            "POST",
            "service-sales",
            200,
            data=service_sale_data
        )
        results['create_service_sale'] = success
        
        if not success:
            print("   ❌ CRITICAL: Cannot create service sale")
            return results
        
        sale_id = sale_response.get('id')
        print(f"   ✅ Service sale created successfully (ID: {sale_id})")
        
        # Step 3: Test Installment Plan Creation with Custom Dates
        print(f"\n   3. Testing Installment Plan Creation with Custom Dates...")
        
        today = datetime.now()
        installment_dates = [
            (today + timedelta(days=30)).isoformat(),
            (today + timedelta(days=75)).isoformat(),
            (today + timedelta(days=120)).isoformat(),
            (today + timedelta(days=180)).isoformat()
        ]
        
        installment_plan_data = {
            "service_sale_id": sale_id,
            "number_of_installments": 4,
            "start_date": today.isoformat(),
            "installment_dates": installment_dates,
            "notes": "خطة تقسيط مخصصة بتواريخ غير منتظمة"
        }
        
        success, plan_response = self.run_test(
            "Create Installment Plan with Custom Dates",
            "POST",
            f"service-sales/{sale_id}/installment-plan",
            200,
            data=installment_plan_data
        )
        results['create_installment_plan'] = success
        
        if not success:
            print("   ❌ CRITICAL: Cannot create installment plan")
            return results
        
        plan_id = plan_response.get('id')
        print(f"   ✅ Installment plan created successfully (ID: {plan_id})")
        print(f"   Total amount: {plan_response.get('total_amount')} DZD")
        
        # Step 4: Test Get Installment Plan
        print(f"\n   4. Testing Get Installment Plan...")
        
        success, retrieved_plan = self.run_test(
            "Get Installment Plan",
            "GET",
            f"service-sales/{sale_id}/installment-plan",
            200
        )
        results['get_installment_plan'] = success
        
        if success:
            print(f"   ✅ Plan status: {retrieved_plan.get('status')}")
            print(f"   ✅ Number of installments: {retrieved_plan.get('number_of_installments')}")
        
        # Step 5: Test Get Installment Payments
        print(f"\n   5. Testing Get Installment Payments...")
        
        success, payments_list = self.run_test(
            "Get Installment Payments",
            "GET",
            f"installment-plans/{plan_id}/payments",
            200
        )
        results['get_installment_payments'] = success
        
        if success:
            print(f"   ✅ Number of payments: {len(payments_list)}")
            
            # Verify payments are sorted by installment_number
            installment_numbers = [p.get('installment_number') for p in payments_list]
            is_sorted = installment_numbers == sorted(installment_numbers)
            results['payments_sorted'] = is_sorted
            
            if is_sorted:
                print(f"   ✅ Payments correctly sorted: {installment_numbers}")
            else:
                print(f"   ❌ Payments not properly sorted: {installment_numbers}")
            
            # Store first payment for testing
            first_payment_id = payments_list[0].get('id') if payments_list else None
            first_payment_amount = payments_list[0].get('original_amount') if payments_list else 0
            
        # Step 6: Test Partial Payment (using query parameters)
        print(f"\n   6. Testing PARTIAL Payment of Installment...")
        
        if first_payment_id:
            partial_amount = first_payment_amount / 2
            notes_encoded = quote("دفعة جزئية - نصف القسط الأول")
            
            success, payment_response = self.run_test(
                "Make Partial Payment",
                "PUT",
                f"installment-payments/{first_payment_id}/pay?paid_amount={partial_amount}&notes={notes_encoded}",
                200
            )
            results['partial_payment'] = success
            
            if success:
                print(f"   ✅ Partial payment processed successfully")
                print(f"   Paid amount: {payment_response.get('paid_amount')} DZD")
                print(f"   Remaining amount: {payment_response.get('remaining_amount')} DZD")
                print(f"   Status: {payment_response.get('status')}")
                
                # Verify status changed to 'partial'
                if payment_response.get('status') == 'partial':
                    print(f"   ✅ Status correctly changed to 'partial'")
                    results['partial_status_correct'] = True
                else:
                    print(f"   ❌ Status should be 'partial', got: {payment_response.get('status')}")
                    results['partial_status_correct'] = False
        
        # Step 7: Test Full Payment of Remaining Amount
        print(f"\n   7. Testing Full Payment of Remaining Amount...")
        
        if first_payment_id and success:
            remaining_amount = payment_response.get('remaining_amount', 0)
            notes_encoded = quote("إكمال دفع القسط الأول")
            
            success, full_payment_response = self.run_test(
                "Complete First Installment Payment",
                "PUT",
                f"installment-payments/{first_payment_id}/pay?paid_amount={remaining_amount}&notes={notes_encoded}",
                200
            )
            results['complete_payment'] = success
            
            if success:
                print(f"   ✅ Full payment completed successfully")
                print(f"   Status: {full_payment_response.get('status')}")
                
                # Verify status changed to 'paid'
                if full_payment_response.get('status') == 'paid':
                    print(f"   ✅ Status correctly changed to 'paid'")
                    results['paid_status_correct'] = True
                else:
                    print(f"   ❌ Status should be 'paid', got: {full_payment_response.get('status')}")
                    results['paid_status_correct'] = False
        
        # Step 8: Test Plan Cancellation
        print(f"\n   8. Testing Plan Cancellation...")
        
        # Create another service sale for cancellation test
        test_sale_data = {
            "service_name": "خدمة اختبار الإلغاء",
            "client_name": "عميل اختبار الإلغاء",
            "amount": 60000.0,
            "notes": "خدمة لاختبار إلغاء خطة التقسيط"
        }
        
        success, test_sale_response = self.run_test(
            "Create Test Service Sale for Cancellation",
            "POST",
            "service-sales",
            200,
            data=test_sale_data
        )
        
        if success:
            test_sale_id = test_sale_response.get('id')
            
            # Create test installment plan
            test_plan_data = {
                "service_sale_id": test_sale_id,
                "number_of_installments": 2,
                "start_date": today.isoformat(),
                "installment_dates": [
                    (today + timedelta(days=30)).isoformat(),
                    (today + timedelta(days=60)).isoformat()
                ],
                "notes": "خطة تقسيط للاختبار الإلغاء"
            }
            
            success, test_plan_response = self.run_test(
                "Create Test Installment Plan for Cancellation",
                "POST",
                f"service-sales/{test_sale_id}/installment-plan",
                200,
                data=test_plan_data
            )
            
            if success:
                test_plan_id = test_plan_response.get('id')
                reason_encoded = quote("إلغاء لأغراض الاختبار")
                
                # Test cancellation (using query parameters)
                success, cancel_response = self.run_test(
                    "Cancel Installment Plan",
                    "PUT",
                    f"installment-plans/{test_plan_id}/cancel?reason={reason_encoded}",
                    200
                )
                results['cancel_plan'] = success
                
                if success:
                    print(f"   ✅ Plan cancellation successful")
                    print(f"   Response: {cancel_response.get('message')}")
        
        # Step 9: Test Installment Status Report
        print(f"\n   9. Testing Installment Status Report...")
        
        success, report_response = self.run_test(
            "Generate Installment Status Report",
            "GET",
            "reports/installment-status",
            200
        )
        results['installment_status_report'] = success
        
        if success:
            print(f"   ✅ Installment status report generated successfully")
            grand_totals = report_response.get('grand_totals', {})
            
            print(f"   Total clients: {grand_totals.get('total_clients', 0)}")
            print(f"   Total plans: {grand_totals.get('total_plans', 0)}")
            print(f"   Active plans: {grand_totals.get('active_plans', 0)}")
            print(f"   Total due: {grand_totals.get('total_due', 0)} DZD")
            print(f"   Total paid: {grand_totals.get('total_paid', 0)} DZD")
        
        # Step 10: Test Role-Based Access Control
        print(f"\n   10. Testing Role-Based Access Control...")
        
        # Test General Accountant Access
        print(f"\n   10a. Testing General Accountant Access...")
        ga_auth_success = self.test_login('generalaccountant@sanhaja.com', 'acc123')
        
        if ga_auth_success:
            print(f"   ✅ General Accountant authenticated")
            
            success, ga_report = self.run_test(
                "General Accountant - Installment Status Report",
                "GET",
                "reports/installment-status",
                200
            )
            results['ga_installment_access'] = success
            
            if success:
                print(f"   ✅ General Accountant can access installment reports")
        
        # Test Super Admin Access
        print(f"\n   10b. Testing Super Admin Access...")
        sa_auth_success = self.test_login('superadmin@sanhaja.com', 'super123')
        
        if sa_auth_success:
            print(f"   ✅ Super Admin authenticated")
            
            success, sa_report = self.run_test(
                "Super Admin - Installment Status Report",
                "GET",
                "reports/installment-status",
                200
            )
            results['sa_installment_access'] = success
            
            if success:
                print(f"   ✅ Super Admin can access all installment reports")
        
        # Step 11: Test Overdue Check
        print(f"\n   11. Testing Overdue Installments Check (Super Admin Only)...")
        
        if sa_auth_success:
            success, overdue_response = self.run_test(
                "Check Overdue Installments",
                "POST",
                "admin/check-overdue-installments",
                200
            )
            results['check_overdue'] = success
            
            if success:
                print(f"   ✅ Overdue installments check completed")
                print(f"   Updated installments: {overdue_response.get('overdue_count', 0)}")
        
        # Step 12: Test Advanced Features Summary
        print(f"\n   12. Testing Advanced Features Summary...")
        
        results['flexible_dates'] = results.get('create_installment_plan', False)
        results['partial_payments'] = results.get('partial_payment', False) and results.get('complete_payment', False)
        results['plan_status_management'] = results.get('cancel_plan', False)
        
        print(f"   ✅ Flexible Date Setting: {'Working' if results['flexible_dates'] else 'Failed'}")
        print(f"   ✅ Partial Payment Support: {'Working' if results['partial_payments'] else 'Failed'}")
        print(f"   ✅ Plan Status Management: {'Working' if results['plan_status_management'] else 'Failed'}")
        
        return results

if __name__ == "__main__":
    tester = InstallmentTester()
    results = tester.test_service_installments_module()
    
    # Print summary
    print(f"\n{'='*80}")
    print(f"🎯 SERVICE INSTALLMENTS MODULE TESTING SUMMARY")
    print(f"{'='*80}")
    print(f"Total Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "No tests run")
    
    # Print detailed results
    if isinstance(results, dict):
        passed = sum(1 for v in results.values() if v is True)
        total = len(results)
        print(f"Detailed Results: {passed}/{total} ({(passed/total*100):.1f}%)" if total > 0 else "No detailed results")
        
        # Show failed tests
        failed_tests = [k for k, v in results.items() if v is False]
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test}")
        
        # Show passed tests
        passed_tests = [k for k, v in results.items() if v is True]
        if passed_tests:
            print(f"\n✅ Passed Tests:")
            for test in passed_tests:
                print(f"   - {test}")
    
    print(f"{'='*80}")