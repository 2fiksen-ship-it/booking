import requests
import sys
import json
from datetime import datetime, timedelta

class SanhajaAPITester:
    def __init__(self, base_url="https://agency-finance-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.current_user = None
        self.tests_run = 0
        self.tests_passed = 0
        
        # Test users - including the one from review request
        self.test_users = {
            'admin_user': {
                'email': 'admin@sanhaja-oran.dz',
                'password': 'admin123',
                'role': 'unknown',  # Will be determined after login
                'name': 'Admin User'
            },
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

    def test_hierarchical_permissions(self):
        """Test hierarchical permission system"""
        print(f"\n👑 Testing Hierarchical Permissions...")
        
        results = {}
        
        # Test Super Admin permissions
        print(f"\n   Testing Super Admin permissions...")
        if self.test_login(self.test_users['super_admin']['email'], 
                          self.test_users['super_admin']['password']):
            
            # Super Admin should see all agencies
            success, agencies = self.run_test("Super Admin - Get All Agencies", "GET", "agencies", 200)
            results['super_admin_agencies'] = success
            if success:
                print(f"   Super Admin sees {len(agencies)} agencies")
            
            # Super Admin should see all users
            success, users = self.run_test("Super Admin - Get All Users", "GET", "users", 200)
            results['super_admin_users'] = success
            if success:
                print(f"   Super Admin sees {len(users)} users")
            
            # Super Admin should see all clients
            success, clients = self.run_test("Super Admin - Get All Clients", "GET", "clients", 200)
            results['super_admin_clients'] = success
            if success:
                print(f"   Super Admin sees {len(clients)} clients")
        
        # Test General Accountant permissions
        print(f"\n   Testing General Accountant permissions...")
        if self.test_login(self.test_users['general_accountant']['email'], 
                          self.test_users['general_accountant']['password']):
            
            # General Accountant should see all agencies
            success, agencies = self.run_test("General Accountant - Get All Agencies", "GET", "agencies", 200)
            results['accountant_agencies'] = success
            if success:
                print(f"   General Accountant sees {len(agencies)} agencies")
            
            # General Accountant should see all clients for review
            success, clients = self.run_test("General Accountant - Get All Clients", "GET", "clients", 200)
            results['accountant_clients'] = success
            if success:
                print(f"   General Accountant sees {len(clients)} clients")
            
            # General Accountant should NOT be able to create users
            success, response = self.run_test("General Accountant - Create User (Should Fail)", 
                                            "POST", "users", 403,
                                            data={
                                                "name": "Test User",
                                                "email": "test@test.com", 
                                                "password": "test123",
                                                "role": "agency_staff",
                                                "agency_id": "test-agency"
                                            })
            results['accountant_no_user_creation'] = success
        
        # Test Agency Staff permissions and isolation
        print(f"\n   Testing Agency Staff permissions and isolation...")
        
        # Test Tlemcen staff
        if self.test_login(self.test_users['tlemcen_staff1']['email'], 
                          self.test_users['tlemcen_staff1']['password']):
            
            tlemcen_agency_id = self.current_user.get('agency_id')
            print(f"   Tlemcen Staff Agency ID: {tlemcen_agency_id}")
            
            # Should only see their agency
            success, agencies = self.run_test("Tlemcen Staff - Get Agencies", "GET", "agencies", 200)
            results['tlemcen_agencies'] = success
            if success and len(agencies) == 1:
                print(f"   ✅ Tlemcen staff sees only 1 agency (their own)")
                results['tlemcen_isolation'] = True
            else:
                print(f"   ❌ Tlemcen staff sees {len(agencies)} agencies (should be 1)")
                results['tlemcen_isolation'] = False
            
            # Get clients for Tlemcen
            success, tlemcen_clients = self.run_test("Tlemcen Staff - Get Clients", "GET", "clients", 200)
            results['tlemcen_clients'] = success
            if success:
                print(f"   Tlemcen staff sees {len(tlemcen_clients)} clients")
        
        # Test Oran staff for isolation
        if self.test_login(self.test_users['oran_staff1']['email'], 
                          self.test_users['oran_staff1']['password']):
            
            oran_agency_id = self.current_user.get('agency_id')
            print(f"   Oran Staff Agency ID: {oran_agency_id}")
            
            # Get clients for Oran
            success, oran_clients = self.run_test("Oran Staff - Get Clients", "GET", "clients", 200)
            results['oran_clients'] = success
            if success:
                print(f"   Oran staff sees {len(oran_clients)} clients")
            
            # Verify different agency IDs
            if tlemcen_agency_id and oran_agency_id and tlemcen_agency_id != oran_agency_id:
                print(f"   ✅ Agency isolation confirmed - different agency IDs")
                results['agency_isolation'] = True
            else:
                print(f"   ❌ Agency isolation failed - same or missing agency IDs")
                results['agency_isolation'] = False
        
        return results

    def test_daily_reports_workflow(self):
        """Test daily reports creation and approval workflow"""
        print(f"\n📊 Testing Daily Reports Workflow...")
        
        results = {}
        
        # Step 1: Agency staff creates daily report
        print(f"\n   Step 1: Agency staff creates daily report...")
        if self.test_login(self.test_users['tlemcen_staff1']['email'], 
                          self.test_users['tlemcen_staff1']['password']):
            
            agency_id = self.current_user.get('agency_id')
            report_date = datetime.now().strftime('%Y-%m-%d')
            
            # Create daily report
            success, response = self.run_test("Create Daily Report", 
                                            "POST", "daily-reports", 200,
                                            data={
                                                "agency_id": agency_id,
                                                "report_date": f"{report_date}T00:00:00Z",
                                                "total_income": 15000.0,
                                                "total_expenses": 8000.0,
                                                "transactions_count": 25,
                                                "notes": "تقرير يومي تجريبي"
                                            })
            results['create_report'] = success
            
            # Get daily reports (should see their own)
            success, reports = self.run_test("Get Daily Reports (Staff)", "GET", "daily-reports", 200)
            results['staff_get_reports'] = success
            if success:
                print(f"   Staff sees {len(reports)} reports")
        
        # Step 2: General Accountant approves report
        print(f"\n   Step 2: General Accountant reviews and approves...")
        if self.test_login(self.test_users['general_accountant']['email'], 
                          self.test_users['general_accountant']['password']):
            
            # Get all daily reports (should see all agencies)
            success, reports = self.run_test("Get All Daily Reports (Accountant)", "GET", "daily-reports", 200)
            results['accountant_get_reports'] = success
            if success:
                print(f"   General Accountant sees {len(reports)} reports from all agencies")
                
                # Find a pending report to approve
                pending_reports = [r for r in reports if r.get('status') == 'pending']
                if pending_reports:
                    report_id = pending_reports[0]['id']
                    
                    # Approve the report
                    success, response = self.run_test(f"Approve Daily Report {report_id}", 
                                                    "PUT", f"daily-reports/{report_id}/approve", 200,
                                                    data={
                                                        "action": "approve",
                                                        "notes": "تمت الموافقة من المحاسب العام"
                                                    })
                    results['approve_report'] = success
        
        # Step 3: Verify Super Admin can see everything
        print(f"\n   Step 3: Super Admin oversight...")
        if self.test_login(self.test_users['super_admin']['email'], 
                          self.test_users['super_admin']['password']):
            
            success, reports = self.run_test("Get All Daily Reports (Super Admin)", "GET", "daily-reports", 200)
            results['super_admin_reports'] = success
            if success:
                print(f"   Super Admin sees {len(reports)} reports")
                approved_reports = [r for r in reports if r.get('status') == 'approved']
                print(f"   Approved reports: {len(approved_reports)}")
        
        return results

    def test_user_management(self):
        """Test user management (Super Admin only)"""
        print(f"\n👥 Testing User Management...")
        
        results = {}
        
        # Test Super Admin can create users
        print(f"\n   Testing Super Admin user creation...")
        if self.test_login(self.test_users['super_admin']['email'], 
                          self.test_users['super_admin']['password']):
            
            # Get agencies first to use valid agency_id
            success, agencies = self.run_test("Get Agencies for User Creation", "GET", "agencies", 200)
            if success and agencies:
                agency_id = agencies[0]['id']
                
                # Create new user
                test_email = f"testuser_{datetime.now().strftime('%H%M%S')}@test.com"
                success, response = self.run_test("Super Admin - Create User", 
                                                "POST", "users", 200,
                                                data={
                                                    "name": "Test User",
                                                    "email": test_email,
                                                    "password": "test123",
                                                    "role": "agency_staff",
                                                    "agency_id": agency_id
                                                })
                results['super_admin_create_user'] = success
        
        # Test that General Accountant cannot create users
        print(f"\n   Testing General Accountant cannot create users...")
        if self.test_login(self.test_users['general_accountant']['email'], 
                          self.test_users['general_accountant']['password']):
            
            success, response = self.run_test("General Accountant - Create User (Should Fail)", 
                                            "POST", "users", 403,
                                            data={
                                                "name": "Test User",
                                                "email": "shouldfail@test.com",
                                                "password": "test123", 
                                                "role": "agency_staff",
                                                "agency_id": "any-id"
                                            })
            results['accountant_cannot_create_user'] = success
        
        # Test that Agency Staff cannot create users
        print(f"\n   Testing Agency Staff cannot create users...")
        if self.test_login(self.test_users['tlemcen_staff1']['email'], 
                          self.test_users['tlemcen_staff1']['password']):
            
            success, response = self.run_test("Agency Staff - Create User (Should Fail)", 
                                            "POST", "users", 403,
                                            data={
                                                "name": "Test User",
                                                "email": "shouldfail2@test.com",
                                                "password": "test123",
                                                "role": "agency_staff", 
                                                "agency_id": "any-id"
                                            })
            results['staff_cannot_create_user'] = success
        
        return results

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

    def test_basic_requirements(self):
        """Test the basic requirements from the review request"""
        print(f"\n🎯 Testing Basic Requirements from Review Request...")
        
        results = {}
        
        # Test 1: Authentication with admin@sanhaja-oran.dz / admin123
        print(f"\n   1. Testing Authentication with admin@sanhaja-oran.dz...")
        auth_success = self.test_login('admin@sanhaja-oran.dz', 'admin123')
        results['admin_login'] = auth_success
        
        if auth_success:
            # Test auth/me endpoint
            me_success = self.test_auth_me()
            results['auth_me'] = me_success
            
            # Test 2: Database connectivity via dashboard
            print(f"\n   2. Testing Database Connectivity...")
            dashboard_success = self.test_dashboard()
            results['database_connectivity'] = dashboard_success
            
            # Test 3: Basic CRUD endpoints
            print(f"\n   3. Testing Basic CRUD Endpoints...")
            
            # Test clients endpoint
            clients_success, clients_data = self.run_test(
                "Get Clients",
                "GET", 
                "clients",
                200
            )
            results['clients_endpoint'] = clients_success
            
            # Test suppliers endpoint  
            suppliers_success, suppliers_data = self.run_test(
                "Get Suppliers",
                "GET",
                "suppliers", 
                200
            )
            results['suppliers_endpoint'] = suppliers_success
            
            # Test 4: Role-based access - check what this user can access
            print(f"\n   4. Testing Role-based Access...")
            
            # Check agencies access
            agencies_success, agencies_data = self.run_test(
                "Get Agencies (Role Check)",
                "GET",
                "agencies",
                200
            )
            results['agencies_access'] = agencies_success
            
            if agencies_success:
                print(f"   User can access {len(agencies_data)} agencies")
                
            # Check users access
            users_success, users_data = self.run_test(
                "Get Users (Role Check)", 
                "GET",
                "users",
                200
            )
            results['users_access'] = users_success
            
            if users_success:
                print(f"   User can access {len(users_data)} users")
        
        return results

def main():
    print("🚀 Starting Sanhaja Travel Agencies Backend API Testing...")
    print("نظام محاسبة وكالات صنهاجة للسفر - اختبار واجهات برمجة التطبيقات")
    print("=" * 80)
    
    tester = SanhajaAPITester()
    
    # Test Basic Requirements First
    print("\n" + "="*80)
    print("اختبار المتطلبات الأساسية من طلب المراجعة")
    print("TESTING BASIC REQUIREMENTS FROM REVIEW REQUEST")
    print("="*80)
    
    basic_results = tester.test_basic_requirements()
    
    # Only run full tests if basic authentication works
    if basic_results.get('admin_login'):
        # Test 1: Authentication for all user types
        print("\n" + "="*80)
        print("المرحلة الأولى: اختبار المصادقة للتسلسل الهرمي")
        print("PHASE 1: HIERARCHICAL AUTHENTICATION TESTING")
        print("="*80)
        
        auth_results = {}
        
        # Test admin user first
        print(f"\n🔐 Testing Admin User (admin@sanhaja-oran.dz)...")
        auth_results['admin_user'] = tester.test_login(
            tester.test_users['admin_user']['email'], 
            tester.test_users['admin_user']['password']
        )
        
        # Test Super Admin login
        print(f"\n🔐 Testing Super Admin (المدير العام)...")
        auth_results['super_admin'] = tester.test_login(
            tester.test_users['super_admin']['email'], 
            tester.test_users['super_admin']['password']
        )
        
        # Test General Accountant login  
        print(f"\n🔐 Testing General Accountant (المحاسب العام)...")
        auth_results['general_accountant'] = tester.test_login(
            tester.test_users['general_accountant']['email'], 
            tester.test_users['general_accountant']['password']
        )
        
        # Test Agency Staff logins
        print(f"\n🔐 Testing Agency Staff (موظفي الوكالات)...")
        for key in ['tlemcen_staff1', 'oran_staff1', 'maghnia_staff1']:
            user = tester.test_users[key]
            print(f"\n   Testing {user['agency']} staff...")
            auth_results[key] = tester.test_login(user['email'], user['password'])
        
        # Test 2: Basic CRUD Operations with admin user
        print("\n" + "="*80)
        print("المرحلة الثانية: اختبار العمليات الأساسية")
        print("PHASE 2: BASIC CRUD OPERATIONS TESTING")
        print("="*80)
        
        # Login as admin user for CRUD testing
        tester.test_login(tester.test_users['admin_user']['email'], 
                         tester.test_users['admin_user']['password'])
        crud_results = tester.test_crud_endpoints()
        
        # Test 3: Error Handling
        print("\n" + "="*80)
        print("المرحلة الثالثة: اختبار معالجة الأخطاء")
        print("PHASE 3: ERROR HANDLING TESTING")
        print("="*80)
        
        error_handling_results = tester.test_error_handling()
        
        # Final Results Summary
        print("\n" + "="*80)
        print("النتائج النهائية - FINAL RESULTS")
        print("="*80)
        
        print(f"📊 إجمالي الاختبارات: {tester.tests_run}")
        print(f"📊 Total Tests: {tester.tests_run}")
        print(f"✅ الاختبارات الناجحة: {tester.tests_passed}")
        print(f"✅ Passed Tests: {tester.tests_passed}")
        print(f"🎯 معدل النجاح: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
        print(f"🎯 Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
        
        # Basic Requirements Results
        print(f"\n🎯 نتائج المتطلبات الأساسية - Basic Requirements Results:")
        basic_keys = [
            ('admin_login', 'Admin Login (admin@sanhaja-oran.dz)'),
            ('auth_me', 'Get Current User Info'),
            ('database_connectivity', 'Database Connectivity (Dashboard)'),
            ('clients_endpoint', 'Clients Endpoint'),
            ('suppliers_endpoint', 'Suppliers Endpoint'),
            ('agencies_access', 'Agencies Access'),
            ('users_access', 'Users Access')
        ]
        
        for key, description in basic_keys:
            if key in basic_results:
                status = "✅" if basic_results[key] else "❌"
                print(f"   {status} {description}")
        
        # Authentication Results
        print(f"\n🔐 نتائج المصادقة - Authentication Results:")
        for role, success in auth_results.items():
            status = "✅" if success else "❌"
            role_name = tester.test_users.get(role, {}).get('name', role)
            print(f"   {status} {role_name} ({role})")
        
        # CRUD Results
        print(f"\n📋 نتائج العمليات الأساسية - CRUD Operations:")
        for endpoint, success in crud_results.items():
            status = "✅" if success else "❌"
            print(f"   {status} {endpoint}")
        
        # Error Handling
        print(f"\n🚫 معالجة الأخطاء - Error Handling: {'✅' if error_handling_results else '❌'}")
        
        # Summary of Critical Issues
        print(f"\n⚠️  القضايا الحرجة - Critical Issues:")
        critical_issues = []
        
        if not basic_results.get('admin_login'):
            critical_issues.append("❌ Admin login failed (admin@sanhaja-oran.dz)")
        if not basic_results.get('database_connectivity'):
            critical_issues.append("❌ Database connectivity issues")
        if not basic_results.get('clients_endpoint'):
            critical_issues.append("❌ Clients endpoint not working")
        if not basic_results.get('suppliers_endpoint'):
            critical_issues.append("❌ Suppliers endpoint not working")
        
        if critical_issues:
            for issue in critical_issues:
                print(f"   {issue}")
        else:
            print("   ✅ No critical issues found!")
        
        return 0 if len(critical_issues) == 0 else 1
    
    else:
        print("\n❌ Basic authentication failed - cannot proceed with full testing")
        print("   Check if admin@sanhaja-oran.dz user exists with password admin123")
        return 1

if __name__ == "__main__":
    sys.exit(main())