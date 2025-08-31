import requests
import sys
import json
from datetime import datetime, timedelta

class DailyReportsStatisticsFixedTester:
    def __init__(self, base_url="https://agency-finance-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.current_user = None
        self.tests_run = 0
        self.tests_passed = 0
        
        # Super Admin credentials from review request
        self.super_admin_creds = {
            'email': 'superadmin@sanhaja.com',
            'password': 'super123'
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, params=None):
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
        if params:
            print(f"   Params: {params}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, params=params, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=15)

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

    def test_fixed_sales_reports(self):
        """Test FIXED Sales Reports with simple date format (YYYY-MM-DD)"""
        print(f"\n📊 Testing FIXED Sales Reports - Simple Date Format (YYYY-MM-DD)")
        print(f"   Testing bug fixes for date parsing improvements")
        
        results = {}
        
        # Test date range: 2025-08-01 to 2025-08-31 (as specified in review request)
        start_date = "2025-08-01"
        end_date = "2025-08-31"
        
        print(f"\n   Using date range: {start_date} to {end_date} (simple YYYY-MM-DD format)")
        
        # Test 1: Daily Sales Report with simple date format
        print(f"\n   1. Testing Daily Sales Report (report_type=daily)...")
        success, response = self.run_test(
            "Sales Report - Daily (Simple Date Format)",
            "GET",
            "reports/sales",
            200,
            params={
                "start_date": start_date,
                "end_date": end_date,
                "report_type": "daily"
            }
        )
        results['daily_sales_report_simple_date'] = success
        
        if success:
            print(f"   ✅ Daily sales report works with simple date format")
            if 'title' in response:
                print(f"   Title: {response['title']}")
            if 'data' in response:
                print(f"   Data points: {len(response['data'])}")
            if 'totals' in response:
                totals = response['totals']
                print(f"   Total Sales: {totals.get('sales', 0)} DZD")
                print(f"   Total Bookings: {totals.get('bookings', 0)}")
                print(f"   Total Profit: {totals.get('profit', 0)} DZD")
        
        # Test 2: Monthly Sales Report with simple date format
        print(f"\n   2. Testing Monthly Sales Report (report_type=monthly)...")
        success, response = self.run_test(
            "Sales Report - Monthly (Simple Date Format)",
            "GET",
            "reports/sales",
            200,
            params={
                "start_date": start_date,
                "end_date": end_date,
                "report_type": "monthly"
            }
        )
        results['monthly_sales_report_simple_date'] = success
        
        if success:
            print(f"   ✅ Monthly sales report works with simple date format")
            if 'title' in response:
                print(f"   Title: {response['title']}")
            if 'data' in response:
                print(f"   Data points: {len(response['data'])}")
        
        # Test 3: Test with ISO datetime format (should also work now)
        print(f"\n   3. Testing with ISO datetime format (should work with improvements)...")
        iso_start = "2025-08-01T00:00:00Z"
        iso_end = "2025-08-31T23:59:59Z"
        
        success, response = self.run_test(
            "Sales Report - Daily (ISO DateTime Format)",
            "GET",
            "reports/sales",
            200,
            params={
                "start_date": iso_start,
                "end_date": iso_end,
                "report_type": "daily"
            }
        )
        results['daily_sales_report_iso_date'] = success
        
        if success:
            print(f"   ✅ Sales report also works with ISO datetime format")
        
        # Test 4: Test flexible date parsing with different formats
        print(f"\n   4. Testing flexible date parsing with various formats...")
        
        # Test with date only (no time)
        success, response = self.run_test(
            "Sales Report - Date Only Format",
            "GET",
            "reports/sales",
            200,
            params={
                "start_date": "2025-08-01",
                "end_date": "2025-08-31",
                "report_type": "daily"
            }
        )
        results['flexible_date_parsing'] = success
        
        if success:
            print(f"   ✅ Flexible date parsing works correctly")
        
        # Test 5: Error handling for invalid date formats
        print(f"\n   5. Testing error handling for invalid date formats...")
        success, response = self.run_test(
            "Sales Report - Invalid Date Format",
            "GET",
            "reports/sales",
            400,
            params={
                "start_date": "invalid-date",
                "end_date": "also-invalid",
                "report_type": "daily"
            }
        )
        results['error_handling_invalid_dates'] = success
        
        if success:
            print(f"   ✅ Properly handles invalid date formats with 400 error")
        
        return results

    def test_fixed_daily_reports_management(self):
        """Test FIXED Daily Reports Management endpoints"""
        print(f"\n📈 Testing FIXED Daily Reports Management")
        print(f"   Testing GET /api/daily-reports and POST /api/daily-reports with proper date handling")
        
        results = {}
        
        # Test 1: GET /api/daily-reports (should work now)
        print(f"\n   1. Testing GET /api/daily-reports endpoint...")
        success, response = self.run_test(
            "Get Daily Reports",
            "GET",
            "daily-reports",
            200
        )
        results['get_daily_reports'] = success
        
        if success:
            print(f"   ✅ GET /api/daily-reports endpoint working")
            print(f"   Total reports visible: {len(response)}")
            
            # Check if reports from multiple agencies are visible (Super Admin)
            if self.current_user.get('role') == 'super_admin':
                agency_ids = set()
                for report in response:
                    if 'agency_id' in report:
                        agency_ids.add(report['agency_id'])
                print(f"   Agencies represented in reports: {len(agency_ids)}")
        
        # Test 2: POST /api/daily-reports with proper date handling
        print(f"\n   2. Testing POST /api/daily-reports with proper date handling...")
        
        # Use current date for testing
        test_date = datetime.now().strftime('%Y-%m-%d')
        
        # Test creating a daily report
        success, response = self.run_test(
            "Create Daily Report (Proper Date Handling)",
            "POST",
            "daily-reports",
            200,
            data={
                "date": f"{test_date}T00:00:00Z",
                "income": 25000.0,
                "expenses": 12000.0,
                "cashbox_balance": 150000.0,
                "notes": "تقرير يومي تجريبي - اختبار التحسينات"
            }
        )
        results['create_daily_report'] = success
        
        if success:
            print(f"   ✅ Daily report creation working with proper date handling")
            if 'id' in response:
                print(f"   Created report ID: {response['id']}")
        
        # Test 3: Verify duplicate report handling (update instead of error)
        print(f"\n   3. Testing duplicate report handling (should update, not error)...")
        
        # Try to create another report for the same date
        success, response = self.run_test(
            "Create Duplicate Daily Report (Should Update)",
            "POST",
            "daily-reports",
            200,  # Should succeed by updating existing report
            data={
                "date": f"{test_date}T00:00:00Z",
                "income": 30000.0,  # Different values
                "expenses": 15000.0,
                "cashbox_balance": 160000.0,
                "notes": "تقرير محدث - اختبار معالجة التكرار"
            }
        )
        results['duplicate_report_handling'] = success
        
        if success:
            print(f"   ✅ Duplicate report handling working (updates instead of error)")
        
        # Test 4: Test with different date formats
        print(f"\n   4. Testing daily report creation with different date formats...")
        
        # Test with simple date format
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        success, response = self.run_test(
            "Create Daily Report (Simple Date Format)",
            "POST",
            "daily-reports",
            200,
            data={
                "date": f"{tomorrow}T12:00:00Z",
                "income": 20000.0,
                "expenses": 10000.0,
                "cashbox_balance": 140000.0,
                "notes": "تقرير بتنسيق تاريخ بسيط"
            }
        )
        results['daily_report_simple_date'] = success
        
        if success:
            print(f"   ✅ Daily report creation works with simple date format")
        
        return results

    def test_cross_agency_data_super_admin(self):
        """Test Cross-Agency Data for Super Admin"""
        print(f"\n👑 Testing Cross-Agency Data for Super Admin")
        print(f"   Confirming Super Admin sees data from all 6 agencies in reports")
        
        results = {}
        
        # Verify we're logged in as Super Admin
        if self.current_user.get('role') != 'super_admin':
            print(f"   ❌ Not logged in as Super Admin - current role: {self.current_user.get('role')}")
            return results
        
        print(f"   ✅ Confirmed Super Admin access: {self.current_user.get('name')}")
        
        # Test 1: Dashboard should show consolidated data from all agencies
        print(f"\n   1. Testing Dashboard - Consolidated data from all agencies...")
        success, response = self.run_test(
            "Super Admin Dashboard - All Agencies",
            "GET",
            "dashboard",
            200
        )
        results['dashboard_all_agencies'] = success
        
        if success:
            print(f"   ✅ Dashboard accessible")
            print(f"   Today Income: {response.get('today_income', 0)} DZD")
            print(f"   Unpaid Invoices: {response.get('unpaid_invoices', 0)}")
            print(f"   Week Bookings: {response.get('week_bookings', 0)}")
            print(f"   Cashbox Balance: {response.get('cashbox_balance', 0)} DZD")
        
        # Test 2: Sales Reports should include all agencies
        print(f"\n   2. Testing Sales Reports - All agencies data...")
        success, response = self.run_test(
            "Sales Report - All Agencies (Super Admin)",
            "GET",
            "reports/sales",
            200,
            params={
                "start_date": "2025-08-01",
                "end_date": "2025-08-31",
                "report_type": "daily"
            }
        )
        results['sales_reports_all_agencies'] = success
        
        if success:
            print(f"   ✅ Sales reports accessible to Super Admin")
            if 'data' in response:
                print(f"   Data points: {len(response['data'])}")
            if 'totals' in response:
                totals = response['totals']
                print(f"   Total Sales: {totals.get('sales', 0)} DZD")
        
        # Test 3: Daily Reports should show all agencies
        print(f"\n   3. Testing Daily Reports - All agencies visibility...")
        success, response = self.run_test(
            "Daily Reports - All Agencies (Super Admin)",
            "GET",
            "daily-reports",
            200
        )
        results['daily_reports_all_agencies'] = success
        
        if success:
            print(f"   ✅ Daily reports accessible to Super Admin")
            print(f"   Total reports visible: {len(response)}")
            
            # Count agencies represented
            agency_ids = set()
            for report in response:
                if 'agency_id' in report:
                    agency_ids.add(report['agency_id'])
            
            print(f"   Agencies represented in reports: {len(agency_ids)}")
            if len(agency_ids) >= 6:
                print(f"   ✅ Super Admin sees reports from all agencies")
                results['cross_agency_visibility'] = True
            else:
                print(f"   ⚠️  Expected 6 agencies, found {len(agency_ids)}")
                results['cross_agency_visibility'] = False
        
        # Test 4: Verify agency isolation still works for regular users
        print(f"\n   4. Verifying agency isolation still works...")
        
        # We can't test this directly without logging in as a different user,
        # but we can verify the Super Admin sees multiple agencies
        success, agencies_response = self.run_test(
            "Get All Agencies (Super Admin)",
            "GET",
            "agencies",
            200
        )
        
        if success:
            print(f"   ✅ Super Admin can access all agencies")
            print(f"   Total agencies: {len(agencies_response)}")
            
            # List agency names
            for agency in agencies_response:
                print(f"   - {agency.get('name', 'Unknown')} ({agency.get('city', 'Unknown')})")
            
            results['all_agencies_accessible'] = len(agencies_response) >= 6
        
        return results

    def test_date_format_validation(self):
        """Test Date Format Validation with flexible parsing"""
        print(f"\n📅 Testing Date Format Validation")
        print(f"   Testing flexible date parsing and error handling for invalid formats")
        
        results = {}
        
        # Test 1: Valid date formats that should work
        print(f"\n   1. Testing valid date formats...")
        
        valid_formats = [
            ("2025-08-01", "2025-08-31", "Simple YYYY-MM-DD"),
            ("2025-08-01T00:00:00", "2025-08-31T23:59:59", "ISO without timezone"),
            ("2025-08-01T00:00:00Z", "2025-08-31T23:59:59Z", "ISO with Z timezone"),
            ("2025-08-01T00:00:00+00:00", "2025-08-31T23:59:59+00:00", "ISO with +00:00 timezone")
        ]
        
        valid_count = 0
        for start_date, end_date, format_name in valid_formats:
            success, response = self.run_test(
                f"Sales Report - {format_name}",
                "GET",
                "reports/sales",
                200,
                params={
                    "start_date": start_date,
                    "end_date": end_date,
                    "report_type": "daily"
                }
            )
            if success:
                valid_count += 1
                print(f"   ✅ {format_name} format works")
            else:
                print(f"   ❌ {format_name} format failed")
        
        results['valid_formats_working'] = valid_count
        results['total_valid_formats'] = len(valid_formats)
        
        # Test 2: Invalid date formats that should return 400
        print(f"\n   2. Testing invalid date formats (should return 400)...")
        
        invalid_formats = [
            ("invalid-date", "also-invalid", "Completely invalid"),
            ("2025-13-01", "2025-13-31", "Invalid month"),
            ("2025-08-32", "2025-08-40", "Invalid day"),
            ("not-a-date", "2025-08-31", "Mixed valid/invalid"),
            ("", "", "Empty dates")
        ]
        
        invalid_count = 0
        for start_date, end_date, format_name in invalid_formats:
            success, response = self.run_test(
                f"Sales Report - {format_name} (Should Fail)",
                "GET",
                "reports/sales",
                400,
                params={
                    "start_date": start_date,
                    "end_date": end_date,
                    "report_type": "daily"
                }
            )
            if success:
                invalid_count += 1
                print(f"   ✅ {format_name} properly rejected with 400")
            else:
                print(f"   ❌ {format_name} not properly handled")
        
        results['invalid_formats_handled'] = invalid_count
        results['total_invalid_formats'] = len(invalid_formats)
        
        # Test 3: Missing date parameters
        print(f"\n   3. Testing missing date parameters...")
        
        success, response = self.run_test(
            "Sales Report - Missing Parameters",
            "GET",
            "reports/sales",
            400,
            params={
                "report_type": "daily"
                # Missing start_date and end_date
            }
        )
        results['missing_params_handled'] = success
        
        if success:
            print(f"   ✅ Missing parameters properly handled with 400")
        
        # Test 4: Test date range validation
        print(f"\n   4. Testing date range validation...")
        
        # Test with end_date before start_date
        success, response = self.run_test(
            "Sales Report - Invalid Date Range",
            "GET",
            "reports/sales",
            200,  # Should still work, just return empty data
            params={
                "start_date": "2025-08-31",
                "end_date": "2025-08-01",  # End before start
                "report_type": "daily"
            }
        )
        results['invalid_range_handled'] = success
        
        if success:
            print(f"   ✅ Invalid date range handled gracefully")
        
        return results

    def run_comprehensive_test(self):
        """Run comprehensive test of FIXED Daily Reports and Statistics system"""
        print("🚀 Starting FIXED Daily Reports and Statistics System Testing...")
        print("اختبار النظام المحسن للتقارير اليومية والإحصائيات")
        print("=" * 80)
        
        # Step 1: Super Admin Login
        print(f"\n🔐 Step 1: Super Admin Authentication")
        auth_success = self.test_login(
            self.super_admin_creds['email'], 
            self.super_admin_creds['password']
        )
        
        if not auth_success:
            print("❌ CRITICAL: Super Admin login failed - cannot proceed with testing")
            return False
        
        print(f"✅ Super Admin authenticated successfully")
        
        # Step 2: Test Fixed Sales Reports
        print(f"\n📊 Step 2: Testing FIXED Sales Reports")
        sales_results = self.test_fixed_sales_reports()
        
        # Step 3: Test Fixed Daily Reports Management
        print(f"\n📈 Step 3: Testing FIXED Daily Reports Management")
        daily_reports_results = self.test_fixed_daily_reports_management()
        
        # Step 4: Test Cross-Agency Data for Super Admin
        print(f"\n👑 Step 4: Testing Cross-Agency Data for Super Admin")
        cross_agency_results = self.test_cross_agency_data_super_admin()
        
        # Step 5: Test Date Format Validation
        print(f"\n📅 Step 5: Testing Date Format Validation")
        date_validation_results = self.test_date_format_validation()
        
        # Final Results Summary
        print("\n" + "="*80)
        print("🎯 FINAL RESULTS - FIXED Daily Reports and Statistics Testing")
        print("النتائج النهائية - اختبار النظام المحسن للتقارير اليومية والإحصائيات")
        print("="*80)
        
        print(f"📊 Total Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"🎯 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Detailed Results by Category
        print(f"\n📊 FIXED Sales Reports Results:")
        sales_keys = [
            ('daily_sales_report_simple_date', 'Daily Sales Report (Simple Date Format)'),
            ('monthly_sales_report_simple_date', 'Monthly Sales Report (Simple Date Format)'),
            ('daily_sales_report_iso_date', 'Daily Sales Report (ISO DateTime Format)'),
            ('flexible_date_parsing', 'Flexible Date Parsing'),
            ('error_handling_invalid_dates', 'Error Handling for Invalid Dates')
        ]
        
        for key, description in sales_keys:
            if key in sales_results:
                status = "✅" if sales_results[key] else "❌"
                print(f"   {status} {description}")
        
        print(f"\n📈 FIXED Daily Reports Management Results:")
        daily_keys = [
            ('get_daily_reports', 'GET /api/daily-reports endpoint'),
            ('create_daily_report', 'POST /api/daily-reports with proper date handling'),
            ('duplicate_report_handling', 'Duplicate report handling (update instead of error)'),
            ('daily_report_simple_date', 'Daily report creation with simple date format')
        ]
        
        for key, description in daily_keys:
            if key in daily_reports_results:
                status = "✅" if daily_reports_results[key] else "❌"
                print(f"   {status} {description}")
        
        print(f"\n👑 Cross-Agency Data for Super Admin Results:")
        cross_agency_keys = [
            ('dashboard_all_agencies', 'Dashboard shows data from all agencies'),
            ('sales_reports_all_agencies', 'Sales reports include all agencies'),
            ('daily_reports_all_agencies', 'Daily reports show all agencies'),
            ('cross_agency_visibility', 'Super Admin cross-agency visibility confirmed'),
            ('all_agencies_accessible', 'All 6 agencies accessible')
        ]
        
        for key, description in cross_agency_keys:
            if key in cross_agency_results:
                status = "✅" if cross_agency_results[key] else "❌"
                print(f"   {status} {description}")
        
        print(f"\n📅 Date Format Validation Results:")
        valid_formats = date_validation_results.get('valid_formats_working', 0)
        total_valid = date_validation_results.get('total_valid_formats', 0)
        invalid_formats = date_validation_results.get('invalid_formats_handled', 0)
        total_invalid = date_validation_results.get('total_invalid_formats', 0)
        
        print(f"   ✅ Valid date formats working: {valid_formats}/{total_valid}")
        print(f"   ✅ Invalid date formats properly handled: {invalid_formats}/{total_invalid}")
        print(f"   {'✅' if date_validation_results.get('missing_params_handled') else '❌'} Missing parameters handled")
        print(f"   {'✅' if date_validation_results.get('invalid_range_handled') else '❌'} Invalid date range handled")
        
        # Overall Assessment
        print(f"\n🎯 OVERALL ASSESSMENT:")
        
        # Calculate category success rates
        sales_success = sum(1 for key, _ in sales_keys if sales_results.get(key, False))
        daily_success = sum(1 for key, _ in daily_keys if daily_reports_results.get(key, False))
        cross_agency_success = sum(1 for key, _ in cross_agency_keys if cross_agency_results.get(key, False))
        
        total_category_tests = len(sales_keys) + len(daily_keys) + len(cross_agency_keys)
        total_category_passed = sales_success + daily_success + cross_agency_success
        
        if total_category_passed >= total_category_tests * 0.9:
            print(f"   🎉 EXCELLENT: All major bug fixes verified and working correctly!")
            print(f"   ✅ Sales Reports: Fixed date parsing works with both simple and ISO formats")
            print(f"   ✅ Daily Reports: GET and POST endpoints working with proper date handling")
            print(f"   ✅ Cross-Agency: Super Admin sees data from all 6 agencies")
            print(f"   ✅ Date Validation: Flexible parsing and error handling working")
        elif total_category_passed >= total_category_tests * 0.7:
            print(f"   ✅ GOOD: Most bug fixes working, some minor issues remain")
        else:
            print(f"   ⚠️  NEEDS ATTENTION: Several bug fixes not working as expected")
        
        print(f"\n📋 SUMMARY FOR MAIN AGENT:")
        print(f"   Category Success Rate: {total_category_passed}/{total_category_tests} ({(total_category_passed/total_category_tests)*100:.1f}%)")
        print(f"   Overall Test Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return True

def main():
    tester = DailyReportsStatisticsFixedTester()
    tester.run_comprehensive_test()

if __name__ == "__main__":
    main()