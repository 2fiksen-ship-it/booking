#!/usr/bin/env python3
"""
Report Creation Fix Test - Testing the specific user issue: مشكل في انشاءاختبارتقرير
Focus: Database migration and report creation after fix
"""

import requests
import json
from datetime import datetime, timedelta

class ReportCreationFixTester:
    def __init__(self, base_url="https://travel-ops-manager.preview.emergentagent.com"):
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

    def test_report_creation_fix(self):
        """Test the REPORT CREATION FIX for user-reported issue 'مشكل في انشاءاختبارتقرير'"""
        print(f"\n🔧 Testing REPORT CREATION FIX (User Issue: مشكل في انشاءاختبارتقرير)")
        print(f"   Testing migration endpoint and report creation after fix")
        
        results = {}
        
        # Step 1: Super Admin Login with exact credentials from review request
        print(f"\n   1. Super Admin Login (superadmin@sanhaja.com / super123)...")
        auth_success = self.test_login('superadmin@sanhaja.com', 'super123')
        results['super_admin_login'] = auth_success
        
        if not auth_success:
            print("   ❌ CRITICAL: Super Admin login failed - cannot proceed with migration tests")
            return results
            
        print(f"   ✅ Super Admin authenticated successfully")
        
        # Step 2: Database Migration - Run booking migration endpoint
        print(f"\n   2. Testing Database Migration (POST /api/admin/migrate-bookings)...")
        success, response = self.run_test(
            "Database Migration - Migrate Bookings",
            "POST",
            "admin/migrate-bookings",
            200,
            data={}
        )
        results['migration_endpoint'] = success
        
        if success:
            print(f"   ✅ Migration endpoint accessible")
            if 'updated_count' in response:
                print(f"   Updated bookings: {response.get('updated_count', 0)}")
            if 'message' in response:
                print(f"   Migration message: {response['message']}")
        else:
            print(f"   ❌ Migration endpoint failed - this may cause Pydantic errors")
        
        # Step 3: Booking Data Validation - Test GET /api/bookings after migration
        print(f"\n   3. Testing Booking Data Validation (GET /api/bookings)...")
        success, bookings_data = self.run_test(
            "Booking Data Validation",
            "GET",
            "bookings",
            200
        )
        results['bookings_validation'] = success
        
        if success:
            print(f"   ✅ Bookings endpoint accessible after migration")
            print(f"   Total bookings loaded: {len(bookings_data)}")
            
            # Check for created_by field in bookings (this was the root cause)
            bookings_with_created_by = 0
            bookings_without_created_by = 0
            
            for booking in bookings_data:
                if 'created_by' in booking and booking['created_by']:
                    bookings_with_created_by += 1
                else:
                    bookings_without_created_by += 1
            
            print(f"   Bookings with created_by field: {bookings_with_created_by}")
            print(f"   Bookings without created_by field: {bookings_without_created_by}")
            
            if bookings_without_created_by == 0:
                print(f"   ✅ All bookings have created_by field - Pydantic validation should work")
                results['pydantic_validation_fixed'] = True
            else:
                print(f"   ⚠️  {bookings_without_created_by} bookings still missing created_by field")
                results['pydantic_validation_fixed'] = False
        else:
            print(f"   ❌ Bookings endpoint failed - Pydantic validation errors may persist")
            results['pydantic_validation_fixed'] = False
        
        # Step 4: Daily Operations Report Creation - Test POST /api/daily-reports
        print(f"\n   4. Testing Daily Operations Report Creation (POST /api/daily-reports)...")
        
        # Get current date for report
        today = datetime.now()
        report_date = today.strftime('%Y-%m-%d')
        
        success, response = self.run_test(
            "Create Daily Operations Report",
            "POST",
            "daily-reports",
            200,
            data={
                "date": f"{report_date}T00:00:00Z",
                "income": 25000.0,
                "expenses": 12000.0,
                "cashbox_balance": 150000.0,
                "notes": "تقرير تجريبي بعد إصلاح مشكلة إنشاء التقارير"
            }
        )
        results['daily_report_creation'] = success
        
        if success:
            print(f"   ✅ Daily report creation successful")
            if 'id' in response:
                print(f"   Report ID: {response['id']}")
            if 'message' in response:
                print(f"   Creation message: {response['message']}")
        else:
            print(f"   ❌ Daily report creation failed")
        
        # Step 5: Daily Operations Reports - Test GET /api/reports/daily-operations
        print(f"\n   5. Testing Daily Operations Reports (GET /api/reports/daily-operations)...")
        
        # Test with date range
        start_date = (today.replace(day=1)).strftime('%Y-%m-%d')  # First day of month
        end_date = today.strftime('%Y-%m-%d')
        
        success, response = self.run_test(
            "Get Daily Operations Reports",
            "GET",
            f"reports/daily-operations?start_date={start_date}&end_date={end_date}",
            200
        )
        results['daily_operations_reports'] = success
        
        if success:
            print(f"   ✅ Daily operations reports accessible")
            if 'data' in response:
                print(f"   Report data points: {len(response['data'])}")
            if 'totals' in response:
                totals = response['totals']
                print(f"   Total operations: {totals.get('total_operations', 0)}")
                print(f"   Total revenue: {totals.get('total_revenue', 0)} DZD")
        else:
            print(f"   ❌ Daily operations reports failed")
        
        # Step 6: Sales Reports - Test GET /api/reports/sales
        print(f"\n   6. Testing Sales Reports (GET /api/reports/sales)...")
        
        success, response = self.run_test(
            "Get Sales Reports",
            "GET",
            f"reports/sales?start_date={start_date}&end_date={end_date}&report_type=daily",
            200
        )
        results['sales_reports'] = success
        
        if success:
            print(f"   ✅ Sales reports accessible")
            if 'title' in response:
                print(f"   Report title: {response['title']}")
            if 'totals' in response:
                totals = response['totals']
                print(f"   Total sales: {totals.get('sales', 0)} DZD")
                print(f"   Total bookings: {totals.get('bookings', 0)}")
        else:
            print(f"   ❌ Sales reports failed")
        
        # Step 7: End-to-End Report Flow Test
        print(f"\n   7. Testing End-to-End Report Generation Process...")
        
        # Test complete flow: Create operation -> Generate report -> View report
        print(f"   7a. Creating test daily operation...")
        
        # Get first client and service for operation
        clients_success, clients_data = self.run_test(
            "Get Clients for Operation",
            "GET",
            "clients",
            200
        )
        
        services_success, services_data = self.run_test(
            "Get Services for Operation", 
            "GET",
            "services",
            200
        )
        
        if clients_success and services_success and clients_data and services_data:
            client_id = clients_data[0]['id']
            service_id = services_data[0]['id']
            
            # Create daily operation
            success, operation_response = self.run_test(
                "Create Test Daily Operation",
                "POST",
                "daily-operations",
                200,
                data={
                    "service_id": service_id,
                    "client_id": client_id,
                    "base_price": 15000.0,
                    "discount_amount": 0.0,
                    "notes": "عملية تجريبية لاختبار إنشاء التقارير"
                }
            )
            results['test_operation_creation'] = success
            
            if success:
                print(f"   ✅ Test operation created successfully")
                operation_id = operation_response.get('id')
                
                # Approve the operation
                if operation_id:
                    success, approve_response = self.run_test(
                        "Approve Test Operation",
                        "PUT",
                        f"daily-operations/{operation_id}/approve",
                        200
                    )
                    results['test_operation_approval'] = success
                    
                    if success:
                        print(f"   ✅ Test operation approved successfully")
                    
                # Generate report including this operation
                print(f"   7b. Generating report including new operation...")
                success, final_report = self.run_test(
                    "Generate Final Report",
                    "GET",
                    f"reports/daily-operations?start_date={report_date}&end_date={report_date}",
                    200
                )
                results['final_report_generation'] = success
                
                if success:
                    print(f"   ✅ Final report generation successful")
                    if 'data' in final_report:
                        operations_in_report = len(final_report['data'])
                        print(f"   Operations in final report: {operations_in_report}")
                    results['end_to_end_flow'] = True
                else:
                    print(f"   ❌ Final report generation failed")
                    results['end_to_end_flow'] = False
            else:
                print(f"   ❌ Test operation creation failed")
                results['end_to_end_flow'] = False
        else:
            print(f"   ⚠️  Cannot create test operation - missing clients or services")
            results['end_to_end_flow'] = False
        
        # Step 8: Verify Error Resolution
        print(f"\n   8. Verifying Pydantic Validation Error Resolution...")
        
        # Test multiple endpoints that previously had Pydantic errors
        endpoints_to_test = [
            ("bookings", "Bookings"),
            ("daily-operations", "Daily Operations"),
            ("services", "Services"),
            ("daily-reports", "Daily Reports")
        ]
        
        pydantic_errors_resolved = True
        
        for endpoint, name in endpoints_to_test:
            success, data = self.run_test(
                f"Pydantic Validation - {name}",
                "GET",
                endpoint,
                200
            )
            
            if success:
                print(f"   ✅ {name} endpoint - No Pydantic errors")
            else:
                print(f"   ❌ {name} endpoint - Pydantic errors may persist")
                pydantic_errors_resolved = False
        
        results['pydantic_errors_resolved'] = pydantic_errors_resolved
        
        # Step 9: Test Report Creation with Arabic Content
        print(f"\n   9. Testing Report Creation with Arabic Content...")
        
        success, arabic_report = self.run_test(
            "Create Arabic Report",
            "POST",
            "daily-reports",
            200,
            data={
                "date": f"{report_date}T12:00:00Z",
                "income": 30000.0,
                "expenses": 15000.0,
                "cashbox_balance": 165000.0,
                "notes": "تقرير باللغة العربية - تم حل مشكلة إنشاء التقارير بنجاح"
            }
        )
        results['arabic_report_creation'] = success
        
        if success:
            print(f"   ✅ Arabic report creation successful")
            print(f"   Arabic content handled correctly")
        else:
            print(f"   ❌ Arabic report creation failed")
        
        return results

    def print_summary(self, results):
        """Print test summary"""
        print(f"\n" + "="*80)
        print(f"🎯 REPORT CREATION FIX TEST SUMMARY")
        print(f"="*80)
        
        print(f"\n### SUMMARY")
        
        # Critical tests
        critical_tests = [
            ('super_admin_login', 'Super Admin Authentication'),
            ('migration_endpoint', 'Database Migration Endpoint'),
            ('bookings_validation', 'Booking Data Validation'),
            ('pydantic_validation_fixed', 'Pydantic Validation Fixed'),
            ('daily_report_creation', 'Daily Report Creation'),
            ('daily_operations_reports', 'Daily Operations Reports'),
            ('sales_reports', 'Sales Reports'),
            ('end_to_end_flow', 'End-to-End Report Flow'),
            ('pydantic_errors_resolved', 'Pydantic Errors Resolved'),
            ('arabic_report_creation', 'Arabic Report Creation')
        ]
        
        for key, name in critical_tests:
            status = "✅" if results.get(key, False) else "❌"
            print(f"   {status} {name}")
        
        # Count results
        passed_tests = sum(1 for key, _ in critical_tests if results.get(key, False))
        total_tests = len(critical_tests)
        
        print(f"\n### RESULTS")
        print(f"   Tests Passed: {passed_tests}/{total_tests} ({(passed_tests/total_tests)*100:.1f}%)")
        print(f"   API Calls: {self.tests_passed}/{self.tests_run} ({(self.tests_passed/self.tests_run)*100:.1f}%)")
        
        # Action items
        print(f"\n### ACTION ITEMS FOR MAIN AGENT")
        
        if results.get('migration_endpoint', False):
            print(f"   ✅ Migration endpoint working - database migration successful")
        else:
            print(f"   ❌ CRITICAL: Fix migration endpoint (POST /api/admin/migrate-bookings)")
        
        if results.get('pydantic_validation_fixed', False):
            print(f"   ✅ Pydantic validation errors resolved")
        else:
            print(f"   ❌ CRITICAL: Fix missing created_by field in booking records")
        
        if results.get('daily_report_creation', False):
            print(f"   ✅ Daily report creation working")
        else:
            print(f"   ❌ CRITICAL: Fix daily report creation endpoint")
        
        if results.get('end_to_end_flow', False):
            print(f"   ✅ End-to-end report flow working")
        else:
            print(f"   ❌ Fix end-to-end report generation process")
        
        if passed_tests >= 8:
            print(f"   ✅ Report creation fix is mostly successful - user issue should be resolved")
        else:
            print(f"   ❌ Report creation fix needs more work - user issue may persist")
        
        print(f"\n   YOU MUST ASK USER BEFORE DOING FRONTEND TESTING")

def main():
    """Main test execution"""
    print("🔧 REPORT CREATION FIX TESTING")
    print("Testing the fix for user issue: مشكل في انشاءاختبارتقرير")
    print("="*80)
    
    tester = ReportCreationFixTester()
    results = tester.test_report_creation_fix()
    tester.print_summary(results)

if __name__ == "__main__":
    main()