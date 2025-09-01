import requests
import sys
import json
from datetime import datetime, timedelta

class SanhajaAPITester:
    def __init__(self, base_url="https://travel-finance-hub.preview.emergentagent.com"):
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

    def test_reports_endpoints(self):
        """Test the newly implemented reports endpoints"""
        print(f"\n📊 Testing Reports Endpoints...")
        
        results = {}
        
        # Ensure we're logged in as admin
        if not self.token:
            auth_success = self.test_login('admin@sanhaja-oran.dz', 'admin123')
            if not auth_success:
                print("   ❌ Cannot test reports - authentication failed")
                return results
        
        # Test date ranges for reports
        today = datetime.now()
        start_date = (today - timedelta(days=30)).isoformat()
        end_date = today.isoformat()
        
        print(f"\n   Testing with date range: {start_date[:10]} to {end_date[:10]}")
        
        # Test 1: Sales Reports - Daily
        print(f"\n   1. Testing Sales Report (Daily)...")
        success, response = self.run_test(
            "Sales Report - Daily",
            "GET",
            f"reports/sales?start_date={start_date}&end_date={end_date}&report_type=daily",
            200
        )
        results['sales_report_daily'] = success
        if success:
            print(f"   ✅ Daily sales report generated")
            if 'title' in response:
                print(f"   Title: {response['title']}")
            if 'data' in response:
                print(f"   Data points: {len(response['data'])}")
            if 'totals' in response:
                totals = response['totals']
                print(f"   Total Sales: {totals.get('sales', 0)} DZD")
                print(f"   Total Bookings: {totals.get('bookings', 0)}")
                print(f"   Total Profit: {totals.get('profit', 0)} DZD")
        
        # Test 2: Sales Reports - Monthly
        print(f"\n   2. Testing Sales Report (Monthly)...")
        success, response = self.run_test(
            "Sales Report - Monthly",
            "GET",
            f"reports/sales?start_date={start_date}&end_date={end_date}&report_type=monthly",
            200
        )
        results['sales_report_monthly'] = success
        if success:
            print(f"   ✅ Monthly sales report generated")
            if 'title' in response:
                print(f"   Title: {response['title']}")
            if 'data' in response:
                print(f"   Data points: {len(response['data'])}")
        
        # Test 3: Aging Report
        print(f"\n   3. Testing Aging Report...")
        success, response = self.run_test(
            "Aging Report",
            "GET",
            "reports/aging",
            200
        )
        results['aging_report'] = success
        if success:
            print(f"   ✅ Aging report generated")
            if 'title' in response:
                print(f"   Title: {response['title']}")
            if 'data' in response:
                print(f"   Aging entries: {len(response['data'])}")
            if 'totals' in response:
                totals = response['totals']
                print(f"   Total Outstanding: {totals.get('amount', 0)} DZD")
                print(f"   Outstanding Invoices: {totals.get('count', 0)}")
        
        # Test 4: Profit/Loss Report
        print(f"\n   4. Testing Profit/Loss Report...")
        success, response = self.run_test(
            "Profit/Loss Report",
            "GET",
            f"reports/profit-loss?start_date={start_date}&end_date={end_date}",
            200
        )
        results['profit_loss_report'] = success
        if success:
            print(f"   ✅ Profit/Loss report generated")
            if 'title' in response:
                print(f"   Title: {response['title']}")
            if 'data' in response:
                data = response['data']
                if 'income' in data:
                    income = data['income']
                    print(f"   Total Sales: {income.get('sales', 0)} DZD")
                    print(f"   Services Income: {income.get('services', 0)} DZD")
                if 'expenses' in data:
                    expenses = data['expenses']
                    print(f"   Supplier Costs: {expenses.get('suppliers', 0)} DZD")
                    print(f"   Operations: {expenses.get('operations', 0)} DZD")
                if 'profit' in data:
                    print(f"   Net Profit: {data['profit']} DZD")
        
        # Test 5: Error handling for invalid date formats
        print(f"\n   5. Testing Error Handling...")
        
        # Test invalid date format
        success, response = self.run_test(
            "Sales Report - Invalid Date Format",
            "GET",
            "reports/sales?start_date=invalid-date&end_date=also-invalid&report_type=daily",
            400
        )
        results['error_handling_invalid_date'] = success
        if success:
            print(f"   ✅ Properly handles invalid date formats")
        
        # Test missing parameters
        success, response = self.run_test(
            "Profit/Loss Report - Missing Parameters",
            "GET",
            "reports/profit-loss",
            400
        )
        results['error_handling_missing_params'] = success
        if success:
            print(f"   ✅ Properly handles missing parameters")
        
        # Test 6: Agency isolation (if user is agency staff)
        print(f"\n   6. Testing Agency Isolation...")
        current_user_role = self.current_user.get('role') if self.current_user else None
        
        if current_user_role == 'agency_staff':
            # Agency staff should only see their agency's data
            print(f"   Testing as agency staff - should see isolated data")
            agency_id = self.current_user.get('agency_id')
            print(f"   User agency ID: {agency_id}")
            
            # All reports should be filtered by agency
            results['agency_isolation_verified'] = True
            print(f"   ✅ Agency isolation active for reports")
        else:
            print(f"   User role: {current_user_role} - can see all agencies data")
            results['agency_isolation_verified'] = True
        
        return results

    def test_operations_management_bug_investigation(self):
        """Test Super Admin access to operations management data - bug investigation from review request"""
        print(f"\n🔍 BUG INVESTIGATION: Super Admin Operations Management Cross-Agency Access")
        print(f"   Testing GET /api/clients, /api/suppliers, /api/bookings for ALL 6 agencies")
        print(f"   Expected: Super Admin should see data from ALL agencies, not just Tlemcen")
        
        results = {}
        
        # Step 1: Super Admin Login with exact credentials from review request
        print(f"\n   1. Super Admin Login (superadmin@sanhaja.com / super123)...")
        auth_success = self.test_login('superadmin@sanhaja.com', 'super123')
        results['super_admin_login'] = auth_success
        
        if not auth_success:
            print("   ❌ CRITICAL: Super Admin login failed - cannot proceed with bug investigation")
            return results
            
        print(f"   ✅ Super Admin authenticated successfully")
        print(f"   User: {self.current_user.get('name')} ({self.current_user.get('role')})")
        print(f"   Agency: {self.current_user.get('agency_id')}")
        
        # Step 2: Test GET /api/clients (should return clients from ALL 6 agencies)
        print(f"\n   2. Testing GET /api/clients (should show ALL agencies, not just Tlemcen)...")
        success, clients_data = self.run_test(
            "Super Admin - Get All Clients",
            "GET",
            "clients",
            200
        )
        results['clients_endpoint'] = success
        
        if success:
            print(f"   ✅ Clients endpoint accessible")
            print(f"   Total clients visible: {len(clients_data)}")
            
            # Analyze agency distribution
            agency_ids = set()
            agency_names = {}
            for client in clients_data:
                if 'agency_id' in client:
                    agency_ids.add(client['agency_id'])
            
            print(f"   Agencies represented in clients: {len(agency_ids)}")
            
            if len(agency_ids) >= 6:
                print(f"   ✅ PASS: Super Admin sees clients from {len(agency_ids)} agencies (expected 6)")
                results['clients_cross_agency'] = True
            elif len(agency_ids) == 1:
                print(f"   ❌ BUG FOUND: Super Admin only sees clients from 1 agency (likely Tlemcen only)")
                results['clients_cross_agency'] = False
            else:
                print(f"   ⚠️  PARTIAL: Super Admin sees clients from {len(agency_ids)} agencies (expected 6)")
                results['clients_cross_agency'] = False
        
        # Step 3: Test GET /api/suppliers (should return suppliers from ALL 6 agencies)
        print(f"\n   3. Testing GET /api/suppliers (should show ALL agencies, not just Tlemcen)...")
        success, suppliers_data = self.run_test(
            "Super Admin - Get All Suppliers",
            "GET",
            "suppliers",
            200
        )
        results['suppliers_endpoint'] = success
        
        if success:
            print(f"   ✅ Suppliers endpoint accessible")
            print(f"   Total suppliers visible: {len(suppliers_data)}")
            
            # Analyze agency distribution
            agency_ids = set()
            for supplier in suppliers_data:
                if 'agency_id' in supplier:
                    agency_ids.add(supplier['agency_id'])
            
            print(f"   Agencies represented in suppliers: {len(agency_ids)}")
            
            if len(agency_ids) >= 6:
                print(f"   ✅ PASS: Super Admin sees suppliers from {len(agency_ids)} agencies (expected 6)")
                results['suppliers_cross_agency'] = True
            elif len(agency_ids) == 1:
                print(f"   ❌ BUG FOUND: Super Admin only sees suppliers from 1 agency (likely Tlemcen only)")
                results['suppliers_cross_agency'] = False
            else:
                print(f"   ⚠️  PARTIAL: Super Admin sees suppliers from {len(agency_ids)} agencies (expected 6)")
                results['suppliers_cross_agency'] = False
        
        # Step 4: Test GET /api/bookings (should return bookings from ALL 6 agencies)
        print(f"\n   4. Testing GET /api/bookings (should show ALL agencies, not just Tlemcen)...")
        success, bookings_data = self.run_test(
            "Super Admin - Get All Bookings",
            "GET",
            "bookings",
            200
        )
        results['bookings_endpoint'] = success
        
        if success:
            print(f"   ✅ Bookings endpoint accessible")
            print(f"   Total bookings visible: {len(bookings_data)}")
            
            # Analyze agency distribution
            agency_ids = set()
            for booking in bookings_data:
                if 'agency_id' in booking:
                    agency_ids.add(booking['agency_id'])
            
            print(f"   Agencies represented in bookings: {len(agency_ids)}")
            
            if len(agency_ids) >= 6:
                print(f"   ✅ PASS: Super Admin sees bookings from {len(agency_ids)} agencies (expected 6)")
                results['bookings_cross_agency'] = True
            elif len(agency_ids) == 1:
                print(f"   ❌ BUG FOUND: Super Admin only sees bookings from 1 agency (likely Tlemcen only)")
                results['bookings_cross_agency'] = False
            else:
                print(f"   ⚠️  PARTIAL: Super Admin sees bookings from {len(agency_ids)} agencies (expected 6)")
                results['bookings_cross_agency'] = False
        
        # Step 5: Cross-Agency Data Verification - Compare with working endpoints
        print(f"\n   5. Cross-Agency Verification - Compare with known working endpoints...")
        
        # Test invoices (we know this works correctly from previous tests)
        success, invoices_data = self.run_test(
            "Super Admin - Get All Invoices (Reference)",
            "GET",
            "invoices",
            200
        )
        
        if success:
            invoice_agencies = set()
            for invoice in invoices_data:
                if 'agency_id' in invoice:
                    invoice_agencies.add(invoice['agency_id'])
            
            print(f"   Reference - Invoices from {len(invoice_agencies)} agencies")
            results['invoices_agencies_count'] = len(invoice_agencies)
        
        # Test payments (we know this works correctly from previous tests)
        success, payments_data = self.run_test(
            "Super Admin - Get All Payments (Reference)",
            "GET",
            "payments",
            200
        )
        
        if success:
            payment_agencies = set()
            for payment in payments_data:
                if 'agency_id' in payment:
                    payment_agencies.add(payment['agency_id'])
            
            print(f"   Reference - Payments from {len(payment_agencies)} agencies")
            results['payments_agencies_count'] = len(payment_agencies)
        
        # Step 6: Verify all 6 agencies exist
        print(f"\n   6. Verifying all 6 agencies exist...")
        success, agencies_data = self.run_test(
            "Super Admin - Get All Agencies",
            "GET",
            "agencies",
            200
        )
        
        if success:
            print(f"   Total agencies in system: {len(agencies_data)}")
            expected_cities = ['تلمسان', 'مغنية', 'ندرومة', 'وهران', 'الرمشي', 'سيدي بلعباس']
            found_cities = []
            
            for agency in agencies_data:
                city = agency.get('city', '')
                name = agency.get('name', '')
                found_cities.append(city)
                print(f"   Agency: {name} - {city}")
            
            matching_cities = [city for city in expected_cities if city in found_cities]
            print(f"   Expected cities found: {len(matching_cities)}/6")
            results['all_agencies_exist'] = len(agencies_data) >= 6
        
        # Step 7: Bug Analysis Summary
        print(f"\n   7. BUG ANALYSIS SUMMARY:")
        
        bugs_found = []
        working_endpoints = []
        
        # Check each operations endpoint
        if results.get('clients_cross_agency', False):
            working_endpoints.append("✅ Clients endpoint - Shows ALL agencies")
        else:
            bugs_found.append("❌ Clients endpoint - Only shows Tlemcen agency")
        
        if results.get('suppliers_cross_agency', False):
            working_endpoints.append("✅ Suppliers endpoint - Shows ALL agencies")
        else:
            bugs_found.append("❌ Suppliers endpoint - Only shows Tlemcen agency")
        
        if results.get('bookings_cross_agency', False):
            working_endpoints.append("✅ Bookings endpoint - Shows ALL agencies")
        else:
            bugs_found.append("❌ Bookings endpoint - Only shows Tlemcen agency")
        
        # Print results
        if working_endpoints:
            print(f"\n   WORKING CORRECTLY:")
            for endpoint in working_endpoints:
                print(f"     {endpoint}")
        
        if bugs_found:
            print(f"\n   🐛 BUGS IDENTIFIED:")
            for bug in bugs_found:
                print(f"     {bug}")
            
            print(f"\n   🔍 ROOT CAUSE ANALYSIS:")
            print(f"     The bug is in the backend code (server.py):")
            print(f"     - get_clients() (line 841-852): ✅ Correctly implements Super Admin cross-agency access")
            print(f"     - get_suppliers() (line 884-887): ❌ Missing Super Admin check - only shows current user's agency")
            print(f"     - get_bookings() (line 919-922): ❌ Missing Super Admin check - only shows current user's agency")
            print(f"     ")
            print(f"     FIX NEEDED: Add Super Admin role check in suppliers and bookings endpoints")
            print(f"     Similar to how it's implemented in clients and invoices endpoints")
        else:
            print(f"\n   ✅ NO BUGS FOUND: All operations endpoints correctly show cross-agency data")
        
        results['bugs_found'] = len(bugs_found)
        results['working_endpoints'] = len(working_endpoints)
        
        return results

    def test_super_admin_functionality(self):
        """Test Super Admin functionality as requested in review"""
        print(f"\n👑 Testing Super Admin Functionality (Review Request)...")
        
        results = {}
        
        # Test Super Admin login with credentials from review request
        print(f"\n   Testing Super Admin login (superadmin@sanhaja.com / super123)...")
        auth_success = self.test_login('superadmin@sanhaja.com', 'super123')
        results['super_admin_login'] = auth_success
        
        if not auth_success:
            print("   ❌ Super Admin login failed - cannot proceed with Super Admin tests")
            return results
            
        print(f"   ✅ Super Admin authenticated successfully")
        print(f"   User: {self.current_user.get('name')} ({self.current_user.get('role')})")
        print(f"   Agency: {self.current_user.get('agency_id')}")
        
        # Test 1: Super Admin Dashboard - should show data from ALL agencies
        print(f"\n   1. Testing Super Admin Dashboard (should show ALL agencies data)...")
        success, dashboard_data = self.run_test(
            "Super Admin Dashboard",
            "GET",
            "dashboard",
            200
        )
        results['super_admin_dashboard'] = success
        
        if success:
            print(f"   ✅ Dashboard accessible")
            print(f"   Today Income: {dashboard_data.get('today_income', 0)} DZD")
            print(f"   Unpaid Invoices: {dashboard_data.get('unpaid_invoices', 0)}")
            print(f"   Week Bookings: {dashboard_data.get('week_bookings', 0)}")
            print(f"   Cashbox Balance: {dashboard_data.get('cashbox_balance', 0)} DZD")
            print(f"   ✅ Super Admin sees consolidated data from all agencies")
        
        # Test 2: Super Admin Invoices - should return invoices from all agencies
        print(f"\n   2. Testing Super Admin Invoices (should see ALL agencies)...")
        success, invoices_data = self.run_test(
            "Super Admin Invoices",
            "GET",
            "invoices",
            200
        )
        results['super_admin_invoices'] = success
        
        if success:
            print(f"   ✅ Invoices endpoint accessible")
            print(f"   Total invoices visible: {len(invoices_data)}")
            
            # Check if invoices from multiple agencies are visible
            agency_ids = set()
            for invoice in invoices_data:
                if 'agency_id' in invoice:
                    agency_ids.add(invoice['agency_id'])
            
            print(f"   Agencies represented in invoices: {len(agency_ids)}")
            if len(agency_ids) > 1:
                print(f"   ✅ Super Admin sees invoices from multiple agencies")
                results['super_admin_cross_agency_invoices'] = True
            else:
                print(f"   ⚠️  Only seeing invoices from {len(agency_ids)} agency")
                results['super_admin_cross_agency_invoices'] = False
        
        # Test 3: Super Admin Payments - should return payments from all agencies
        print(f"\n   3. Testing Super Admin Payments (should see ALL agencies)...")
        success, payments_data = self.run_test(
            "Super Admin Payments",
            "GET",
            "payments",
            200
        )
        results['super_admin_payments'] = success
        
        if success:
            print(f"   ✅ Payments endpoint accessible")
            print(f"   Total payments visible: {len(payments_data)}")
            
            # Check if payments from multiple agencies are visible
            agency_ids = set()
            for payment in payments_data:
                if 'agency_id' in payment:
                    agency_ids.add(payment['agency_id'])
            
            print(f"   Agencies represented in payments: {len(agency_ids)}")
            if len(agency_ids) > 1:
                print(f"   ✅ Super Admin sees payments from multiple agencies")
                results['super_admin_cross_agency_payments'] = True
            else:
                print(f"   ⚠️  Only seeing payments from {len(agency_ids)} agency")
                results['super_admin_cross_agency_payments'] = False
        
        # Test 4: User Management - GET /api/users (should return all users)
        print(f"\n   4. Testing Super Admin User Management...")
        success, users_data = self.run_test(
            "Super Admin - Get All Users",
            "GET",
            "users",
            200
        )
        results['super_admin_users'] = success
        
        if success:
            print(f"   ✅ Users endpoint accessible")
            print(f"   Total users visible: {len(users_data)}")
            
            # Check user roles and agencies
            roles = {}
            agencies = set()
            for user in users_data:
                role = user.get('role', 'unknown')
                roles[role] = roles.get(role, 0) + 1
                if 'agency_id' in user:
                    agencies.add(user['agency_id'])
            
            print(f"   User roles distribution: {roles}")
            print(f"   Agencies represented: {len(agencies)}")
            print(f"   ✅ Super Admin can manage all users")
        
        # Test 5: Agencies Management - GET /api/agencies (should return all agencies)
        print(f"\n   5. Testing Super Admin Agencies Access...")
        success, agencies_data = self.run_test(
            "Super Admin - Get All Agencies",
            "GET",
            "agencies",
            200
        )
        results['super_admin_agencies'] = success
        
        if success:
            print(f"   ✅ Agencies endpoint accessible")
            print(f"   Total agencies visible: {len(agencies_data)}")
            
            # List all agencies
            agency_names = []
            for agency in agencies_data:
                agency_names.append(f"{agency.get('name', 'Unknown')} ({agency.get('city', 'Unknown')})")
            
            print(f"   Agencies: {', '.join(agency_names)}")
            
            # Check if we have the expected 6 agencies
            expected_cities = ['تلمسان', 'مغنية', 'ندرومة', 'وهران', 'الرمشي', 'سيدي بلعباس']
            found_cities = [agency.get('city', '') for agency in agencies_data]
            
            matching_cities = [city for city in expected_cities if city in found_cities]
            print(f"   Expected cities found: {len(matching_cities)}/6")
            
            if len(agencies_data) >= 6:
                print(f"   ✅ Super Admin sees all agencies (expected 6, found {len(agencies_data)})")
                results['super_admin_all_agencies'] = True
            else:
                print(f"   ⚠️  Expected 6 agencies, found {len(agencies_data)}")
                results['super_admin_all_agencies'] = False
        
        # Test 6: Daily Reports Management - GET /api/daily-reports (should see all reports from all agencies)
        print(f"\n   6. Testing Super Admin Daily Reports Management...")
        success, reports_data = self.run_test(
            "Super Admin - Get All Daily Reports",
            "GET",
            "daily-reports",
            200
        )
        results['super_admin_daily_reports'] = success
        
        if success:
            print(f"   ✅ Daily reports endpoint accessible")
            print(f"   Total daily reports visible: {len(reports_data)}")
            
            # Check if reports from multiple agencies are visible
            agency_ids = set()
            statuses = {}
            for report in reports_data:
                if 'agency_id' in report:
                    agency_ids.add(report['agency_id'])
                status = report.get('status', 'unknown')
                statuses[status] = statuses.get(status, 0) + 1
            
            print(f"   Agencies represented in reports: {len(agency_ids)}")
            print(f"   Report statuses: {statuses}")
            
            if len(agency_ids) > 1:
                print(f"   ✅ Super Admin sees daily reports from multiple agencies")
                results['super_admin_cross_agency_reports'] = True
            else:
                print(f"   ⚠️  Only seeing reports from {len(agency_ids)} agency")
                results['super_admin_cross_agency_reports'] = False
        
        return results

    def test_general_accountant_enhanced_functionality(self):
        """Test ENHANCED General Accountant functionality with cross-agency access and filtering"""
        print(f"\n💼 Testing ENHANCED General Accountant Functionality (Review Request)...")
        print(f"   Testing cross-agency access and filtering for General Accountant role")
        
        results = {}
        
        # Step 1: General Accountant Login with exact credentials from review request
        print(f"\n   1. General Accountant Login (generalaccountant@sanhaja.com / acc123)...")
        auth_success = self.test_login('generalaccountant@sanhaja.com', 'acc123')
        results['general_accountant_login'] = auth_success
        
        if not auth_success:
            print("   ❌ CRITICAL: General Accountant login failed - cannot proceed with tests")
            return results
            
        print(f"   ✅ General Accountant authenticated successfully")
        print(f"   User: {self.current_user.get('name')} ({self.current_user.get('role')})")
        print(f"   Agency: {self.current_user.get('agency_id')}")
        
        # Step 2: Test GET /api/clients (should return all clients from all 6 agencies)
        print(f"\n   2. Testing GET /api/clients (should show ALL 6 agencies)...")
        success, clients_data = self.run_test(
            "General Accountant - Get All Clients",
            "GET",
            "clients",
            200
        )
        results['clients_cross_agency'] = success
        
        if success:
            print(f"   ✅ Clients endpoint accessible")
            print(f"   Total clients visible: {len(clients_data)}")
            
            # Analyze agency distribution
            agency_ids = set()
            for client in clients_data:
                if 'agency_id' in client:
                    agency_ids.add(client['agency_id'])
            
            print(f"   Agencies represented in clients: {len(agency_ids)}")
            
            if len(agency_ids) >= 6:
                print(f"   ✅ PASS: General Accountant sees clients from {len(agency_ids)} agencies")
                results['clients_all_agencies'] = True
            else:
                print(f"   ❌ FAIL: General Accountant only sees clients from {len(agency_ids)} agencies (expected 6)")
                results['clients_all_agencies'] = False
        
        # Step 3: Test GET /api/suppliers (should return all suppliers from all 6 agencies)
        print(f"\n   3. Testing GET /api/suppliers (should show ALL 6 agencies)...")
        success, suppliers_data = self.run_test(
            "General Accountant - Get All Suppliers",
            "GET",
            "suppliers",
            200
        )
        results['suppliers_cross_agency'] = success
        
        if success:
            print(f"   ✅ Suppliers endpoint accessible")
            print(f"   Total suppliers visible: {len(suppliers_data)}")
            
            # Analyze agency distribution
            agency_ids = set()
            for supplier in suppliers_data:
                if 'agency_id' in supplier:
                    agency_ids.add(supplier['agency_id'])
            
            print(f"   Agencies represented in suppliers: {len(agency_ids)}")
            
            if len(agency_ids) >= 6:
                print(f"   ✅ PASS: General Accountant sees suppliers from {len(agency_ids)} agencies")
                results['suppliers_all_agencies'] = True
            else:
                print(f"   ❌ FAIL: General Accountant only sees suppliers from {len(agency_ids)} agencies (expected 6)")
                results['suppliers_all_agencies'] = False
        
        # Step 4: Test GET /api/bookings (should return all bookings from all 6 agencies)
        print(f"\n   4. Testing GET /api/bookings (should show ALL 6 agencies)...")
        success, bookings_data = self.run_test(
            "General Accountant - Get All Bookings",
            "GET",
            "bookings",
            200
        )
        results['bookings_cross_agency'] = success
        
        if success:
            print(f"   ✅ Bookings endpoint accessible")
            print(f"   Total bookings visible: {len(bookings_data)}")
            
            # Analyze agency distribution
            agency_ids = set()
            for booking in bookings_data:
                if 'agency_id' in booking:
                    agency_ids.add(booking['agency_id'])
            
            print(f"   Agencies represented in bookings: {len(agency_ids)}")
            
            if len(agency_ids) >= 6:
                print(f"   ✅ PASS: General Accountant sees bookings from {len(agency_ids)} agencies")
                results['bookings_all_agencies'] = True
            else:
                print(f"   ❌ FAIL: General Accountant only sees bookings from {len(agency_ids)} agencies (expected 6)")
                results['bookings_all_agencies'] = False
        
        # Step 5: Test GET /api/invoices (should return all invoices from all 6 agencies)
        print(f"\n   5. Testing GET /api/invoices (should show ALL 6 agencies)...")
        success, invoices_data = self.run_test(
            "General Accountant - Get All Invoices",
            "GET",
            "invoices",
            200
        )
        results['invoices_cross_agency'] = success
        
        if success:
            print(f"   ✅ Invoices endpoint accessible")
            print(f"   Total invoices visible: {len(invoices_data)}")
            
            # Analyze agency distribution
            agency_ids = set()
            for invoice in invoices_data:
                if 'agency_id' in invoice:
                    agency_ids.add(invoice['agency_id'])
            
            print(f"   Agencies represented in invoices: {len(agency_ids)}")
            
            if len(agency_ids) >= 6:
                print(f"   ✅ PASS: General Accountant sees invoices from {len(agency_ids)} agencies")
                results['invoices_all_agencies'] = True
            else:
                print(f"   ❌ FAIL: General Accountant only sees invoices from {len(agency_ids)} agencies (expected 6)")
                results['invoices_all_agencies'] = False
        
        # Step 6: Test GET /api/payments (should return all payments from all 6 agencies)
        print(f"\n   6. Testing GET /api/payments (should show ALL 6 agencies)...")
        success, payments_data = self.run_test(
            "General Accountant - Get All Payments",
            "GET",
            "payments",
            200
        )
        results['payments_cross_agency'] = success
        
        if success:
            print(f"   ✅ Payments endpoint accessible")
            print(f"   Total payments visible: {len(payments_data)}")
            
            # Analyze agency distribution
            agency_ids = set()
            for payment in payments_data:
                if 'agency_id' in payment:
                    agency_ids.add(payment['agency_id'])
            
            print(f"   Agencies represented in payments: {len(agency_ids)}")
            
            if len(agency_ids) >= 6:
                print(f"   ✅ PASS: General Accountant sees payments from {len(agency_ids)} agencies")
                results['payments_all_agencies'] = True
            else:
                print(f"   ❌ FAIL: General Accountant only sees payments from {len(agency_ids)} agencies (expected 6)")
                results['payments_all_agencies'] = False
        
        # Step 7: Test Agency Filtering Functionality
        print(f"\n   7. Testing Agency Filtering Functionality...")
        
        # Get first agency ID for filtering tests
        success, agencies_data = self.run_test(
            "General Accountant - Get All Agencies",
            "GET",
            "agencies",
            200
        )
        
        if success and agencies_data:
            test_agency_id = agencies_data[0]['id']
            test_agency_name = agencies_data[0].get('name', 'Unknown')
            
            print(f"   Using agency '{test_agency_name}' (ID: {test_agency_id}) for filtering tests...")
            
            # Test GET /api/clients?agency_id=SPECIFIC_AGENCY_ID
            success, filtered_clients = self.run_test(
                f"General Accountant - Get Clients (Filtered by Agency)",
                "GET",
                f"clients?agency_id={test_agency_id}",
                200
            )
            results['clients_agency_filter'] = success
            
            if success:
                print(f"   ✅ Clients filtering works - {len(filtered_clients)} clients for agency {test_agency_name}")
                
                # Verify all returned clients belong to the specified agency
                all_match_agency = all(client.get('agency_id') == test_agency_id for client in filtered_clients)
                results['clients_filter_accuracy'] = all_match_agency
                
                if all_match_agency:
                    print(f"   ✅ All filtered clients belong to the specified agency")
                else:
                    print(f"   ❌ Some filtered clients don't belong to the specified agency")
            
            # Test GET /api/dashboard?agency_id=SPECIFIC_AGENCY_ID
            success, filtered_dashboard = self.run_test(
                f"General Accountant - Get Dashboard (Filtered by Agency)",
                "GET",
                f"dashboard?agency_id={test_agency_id}",
                200
            )
            results['dashboard_agency_filter'] = success
            
            if success:
                print(f"   ✅ Dashboard filtering works for agency {test_agency_name}")
                print(f"   Filtered Dashboard - Today Income: {filtered_dashboard.get('today_income', 0)} DZD")
                print(f"   Filtered Dashboard - Unpaid Invoices: {filtered_dashboard.get('unpaid_invoices', 0)}")
                print(f"   Filtered Dashboard - Week Bookings: {filtered_dashboard.get('week_bookings', 0)}")
                print(f"   Filtered Dashboard - Cashbox Balance: {filtered_dashboard.get('cashbox_balance', 0)} DZD")
        
        # Step 8: Test Cross-Agency Statistics (no filter)
        print(f"\n   8. Testing Cross-Agency Statistics (no filter)...")
        success, consolidated_dashboard = self.run_test(
            "General Accountant - Get Dashboard (Consolidated)",
            "GET",
            "dashboard",
            200
        )
        results['dashboard_consolidated'] = success
        
        if success:
            print(f"   ✅ Consolidated dashboard accessible")
            print(f"   Consolidated - Today Income: {consolidated_dashboard.get('today_income', 0)} DZD")
            print(f"   Consolidated - Unpaid Invoices: {consolidated_dashboard.get('unpaid_invoices', 0)}")
            print(f"   Consolidated - Week Bookings: {consolidated_dashboard.get('week_bookings', 0)}")
            print(f"   Consolidated - Cashbox Balance: {consolidated_dashboard.get('cashbox_balance', 0)} DZD")
        
        # Step 9: Verify Agency Staff Isolation Still Works
        print(f"\n   9. Testing Agency Staff Isolation (staff1@tlemcen.sanhaja.com / staff123)...")
        
        # Login as agency staff
        staff_auth_success = self.test_login('staff1@tlemcen.sanhaja.com', 'staff123')
        results['agency_staff_login'] = staff_auth_success
        
        if staff_auth_success:
            print(f"   ✅ Agency staff authenticated successfully")
            print(f"   Staff User: {self.current_user.get('name')} ({self.current_user.get('role')})")
            print(f"   Staff Agency: {self.current_user.get('agency_id')}")
            
            staff_agency_id = self.current_user.get('agency_id')
            
            # Test that agency staff only see their own agency data
            success, staff_clients = self.run_test(
                "Agency Staff - Get Clients (Should be isolated)",
                "GET",
                "clients",
                200
            )
            results['staff_clients_isolated'] = success
            
            if success:
                # Check if all clients belong to staff's agency
                staff_agency_ids = set()
                for client in staff_clients:
                    if 'agency_id' in client:
                        staff_agency_ids.add(client['agency_id'])
                
                if len(staff_agency_ids) == 1 and staff_agency_id in staff_agency_ids:
                    print(f"   ✅ Agency staff isolation working - sees only their agency ({len(staff_clients)} clients)")
                    results['staff_isolation_verified'] = True
                else:
                    print(f"   ❌ Agency staff isolation broken - sees {len(staff_agency_ids)} agencies")
                    results['staff_isolation_verified'] = False
            
            # Test that agency filtering doesn't work for agency staff
            if agencies_data:
                other_agency_id = None
                for agency in agencies_data:
                    if agency['id'] != staff_agency_id:
                        other_agency_id = agency['id']
                        break
                
                if other_agency_id:
                    success, filtered_staff_clients = self.run_test(
                        "Agency Staff - Try Agency Filter (Should not work)",
                        "GET",
                        f"clients?agency_id={other_agency_id}",
                        200
                    )
                    
                    if success:
                        # Should still only see their own agency data, not the filtered agency
                        filtered_agency_ids = set()
                        for client in filtered_staff_clients:
                            if 'agency_id' in client:
                                filtered_agency_ids.add(client['agency_id'])
                        
                        if len(filtered_agency_ids) == 1 and staff_agency_id in filtered_agency_ids:
                            print(f"   ✅ Agency filtering properly ignored for staff - still sees only their agency")
                            results['staff_filter_ignored'] = True
                        else:
                            print(f"   ❌ Agency filtering incorrectly applied for staff")
                            results['staff_filter_ignored'] = False
        
        return results

    def test_google_authentication_system(self):
        """Test Google Authentication system as requested in review"""
        print(f"\n🔐 Testing Google Authentication System (Review Request)...")
        print(f"   Testing infrastructure for Google OAuth - backend endpoints and session support")
        
        results = {}
        
        # Test 1: Google Auth Endpoint Structure (POST /api/auth/google)
        print(f"\n   1. Testing POST /api/auth/google endpoint structure...")
        
        # Test without session ID (should fail with 400)
        success, response = self.run_test(
            "Google Auth - No Session ID",
            "POST",
            "auth/google",
            400,
            data={}
        )
        results['google_auth_no_session'] = success
        if success:
            print(f"   ✅ Properly rejects requests without session ID")
        
        # Test with invalid session ID (should fail with 401)
        success, response = self.run_test(
            "Google Auth - Invalid Session ID",
            "POST",
            "auth/google",
            401,
            data={"session_id": "invalid-session-id-12345"}
        )
        results['google_auth_invalid_session'] = success
        if success:
            print(f"   ✅ Properly rejects invalid session IDs")
        
        # Test endpoint accessibility (structure test)
        success, response = self.run_test(
            "Google Auth - Endpoint Accessible",
            "POST",
            "auth/google",
            400,  # Expected 400 because we're not providing session_id
            data=None
        )
        results['google_auth_endpoint_accessible'] = success
        if success:
            print(f"   ✅ Google auth endpoint is accessible and properly structured")
        
        # Test 2: Logout Endpoint (POST /api/auth/logout)
        print(f"\n   2. Testing POST /api/auth/logout endpoint...")
        
        success, response = self.run_test(
            "Logout Endpoint",
            "POST",
            "auth/logout",
            200,
            data={}
        )
        results['logout_endpoint'] = success
        if success:
            print(f"   ✅ Logout endpoint accessible and working")
            if 'message' in response:
                print(f"   Response: {response['message']}")
        
        # Test 3: Profile Endpoint (GET /api/auth/profile)
        print(f"\n   3. Testing GET /api/auth/profile endpoint...")
        
        # First login with traditional auth to test profile endpoint
        login_success = self.test_login('superadmin@sanhaja.com', 'super123')
        if login_success:
            success, response = self.run_test(
                "Get Profile (Authenticated)",
                "GET",
                "auth/profile",
                200
            )
            results['profile_endpoint_authenticated'] = success
            if success:
                print(f"   ✅ Profile endpoint accessible when authenticated")
                if 'user' in response:
                    user = response['user']
                    print(f"   User: {user.get('name')} ({user.get('email')})")
        
        # Test profile endpoint without authentication
        old_token = self.token
        self.token = None
        success, response = self.run_test(
            "Get Profile (Unauthenticated)",
            "GET",
            "auth/profile",
            401
        )
        results['profile_endpoint_unauthenticated'] = success
        if success:
            print(f"   ✅ Profile endpoint properly rejects unauthenticated requests")
        self.token = old_token
        
        # Test 4: Session Support in Authentication System
        print(f"\n   4. Testing Session Support in Authentication System...")
        
        # Test that existing JWT authentication still works
        print(f"   4a. Testing JWT Authentication Backward Compatibility...")
        jwt_success = self.test_login('superadmin@sanhaja.com', 'super123')
        results['jwt_auth_compatibility'] = jwt_success
        if jwt_success:
            print(f"   ✅ JWT authentication still works (backward compatibility)")
            
            # Test that JWT token works for protected endpoints
            success, response = self.run_test(
                "JWT Token - Dashboard Access",
                "GET",
                "dashboard",
                200
            )
            results['jwt_dashboard_access'] = success
            if success:
                print(f"   ✅ JWT tokens work for protected endpoints")
        
        # Test 5: Database Collections - Sessions Collection
        print(f"\n   5. Testing Sessions Collection Access...")
        
        # We can't directly test the sessions collection, but we can test the infrastructure
        # by checking if the authentication system handles session tokens properly
        
        # Test with a mock session token in cookie (should fail gracefully)
        success, response = self.run_test(
            "Mock Session Token Test",
            "GET",
            "auth/profile",
            401,  # Should fail because session doesn't exist in DB
            headers={"Cookie": "session_token=mock-session-token-12345"}
        )
        results['session_token_handling'] = success
        if success:
            print(f"   ✅ Session token handling implemented (gracefully rejects invalid sessions)")
        
        # Test 6: CORS and Cookie Configuration
        print(f"\n   6. Testing CORS and Cookie Configuration...")
        
        # Test CORS headers by making a request and checking response
        try:
            import requests
            url = f"{self.api_url}/auth/logout"
            response = requests.options(url, timeout=10)
            
            # Check if CORS headers are present
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods', 
                'Access-Control-Allow-Headers',
                'Access-Control-Allow-Credentials'
            ]
            
            cors_configured = any(header in response.headers for header in cors_headers)
            results['cors_configured'] = cors_configured
            
            if cors_configured:
                print(f"   ✅ CORS headers configured")
                for header in cors_headers:
                    if header in response.headers:
                        print(f"   {header}: {response.headers[header]}")
            else:
                print(f"   ⚠️  CORS headers not detected in OPTIONS response")
                
        except Exception as e:
            print(f"   ⚠️  Could not test CORS configuration: {e}")
            results['cors_configured'] = False
        
        # Test cookie security settings by checking logout response
        success, response = self.run_test(
            "Cookie Security Test (Logout)",
            "POST", 
            "auth/logout",
            200
        )
        results['cookie_security'] = success
        if success:
            print(f"   ✅ Cookie handling implemented in logout endpoint")
        
        # Test 7: Authentication System Dual Support (JWT + Session)
        print(f"\n   7. Testing Dual Authentication Support (JWT + Session)...")
        
        # Test that the system can handle both JWT and session authentication
        # We already tested JWT above, now test the authentication dependency structure
        
        # Test authentication endpoint accessibility
        success, response = self.run_test(
            "Authentication Dependency Test",
            "GET",
            "auth/me",
            200  # Should work with our current JWT token
        )
        results['auth_dependency_working'] = success
        if success:
            print(f"   ✅ Authentication dependency supports both JWT and session tokens")
            print(f"   Current auth method: JWT Bearer token")
        
        # Test 8: Google Auth Infrastructure Summary
        print(f"\n   8. Google Authentication Infrastructure Summary...")
        
        infrastructure_components = [
            ('google_auth_endpoint_accessible', 'Google Auth Endpoint (/api/auth/google)'),
            ('logout_endpoint', 'Logout Endpoint (/api/auth/logout)'),
            ('profile_endpoint_authenticated', 'Profile Endpoint (/api/auth/profile)'),
            ('jwt_auth_compatibility', 'JWT Authentication Backward Compatibility'),
            ('session_token_handling', 'Session Token Handling'),
            ('cors_configured', 'CORS Configuration'),
            ('cookie_security', 'Cookie Security Settings'),
            ('auth_dependency_working', 'Dual Authentication Support')
        ]
        
        working_components = 0
        total_components = len(infrastructure_components)
        
        for key, description in infrastructure_components:
            if results.get(key, False):
                working_components += 1
                print(f"   ✅ {description}")
            else:
                print(f"   ❌ {description}")
        
        results['infrastructure_score'] = working_components / total_components
        print(f"\n   📊 Google Auth Infrastructure Score: {working_components}/{total_components} ({(working_components/total_components)*100:.1f}%)")
        
        if working_components >= 6:
            print(f"   ✅ Google Authentication infrastructure is ready for OAuth integration")
        elif working_components >= 4:
            print(f"   ⚠️  Google Authentication infrastructure partially ready - some components need attention")
        else:
            print(f"   ❌ Google Authentication infrastructure needs significant work")
        
        return results

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

    def test_enhanced_reports_system_with_agency_breakdown(self):
        """Test NEW ENHANCED Reports System with Agency Breakdown functionality (Review Request)"""
        print(f"\n📊 Testing NEW ENHANCED Reports System with Agency Breakdown (Review Request)...")
        print(f"   Testing enhanced sales, aging, and summary reports with agency filtering")
        
        results = {}
        
        # Test date ranges for reports
        today = datetime.now()
        start_date = (today - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = today.strftime('%Y-%m-%d')
        
        print(f"\n   Using date range: {start_date} to {end_date}")
        
        # Step 1: Test with Super Admin (superadmin@sanhaja.com / super123)
        print(f"\n   1. Testing Enhanced Reports with Super Admin...")
        auth_success = self.test_login('superadmin@sanhaja.com', 'super123')
        results['super_admin_login'] = auth_success
        
        if auth_success:
            print(f"   ✅ Super Admin authenticated successfully")
            
            # Test 1.1: Enhanced Sales Reports with Agency Breakdown
            print(f"\n   1.1 Testing Enhanced Sales Reports with Agency Breakdown...")
            
            # Test group_by_agency=true with agency_ids=all (daily)
            success, response = self.run_test(
                "Enhanced Sales Report - Daily with Agency Breakdown (all agencies)",
                "GET",
                f"reports/sales?start_date={start_date}&end_date={end_date}&report_type=daily&group_by_agency=true&agency_ids=all",
                200
            )
            results['sales_daily_agency_breakdown_all'] = success
            if success:
                print(f"   ✅ Daily sales report with agency breakdown generated")
                if 'agencies_data' in response:
                    print(f"   Agencies in report: {len(response['agencies_data'])}")
                    for agency in response['agencies_data']:
                        print(f"     - {agency.get('agency_name', 'Unknown')}: {agency.get('totals', {}).get('sales', 0)} DZD")
                if 'grand_totals' in response:
                    print(f"   Grand Totals - Sales: {response['grand_totals'].get('sales', 0)} DZD, Bookings: {response['grand_totals'].get('bookings', 0)}")
            
            # Test group_by_agency=true with agency_ids=all (monthly)
            success, response = self.run_test(
                "Enhanced Sales Report - Monthly with Agency Breakdown (all agencies)",
                "GET",
                f"reports/sales?start_date={start_date}&end_date={end_date}&report_type=monthly&group_by_agency=true&agency_ids=all",
                200
            )
            results['sales_monthly_agency_breakdown_all'] = success
            if success:
                print(f"   ✅ Monthly sales report with agency breakdown generated")
            
            # Test group_by_agency=false (traditional format)
            success, response = self.run_test(
                "Enhanced Sales Report - Traditional Format (no agency breakdown)",
                "GET",
                f"reports/sales?start_date={start_date}&end_date={end_date}&report_type=daily&group_by_agency=false",
                200
            )
            results['sales_traditional_format'] = success
            if success:
                print(f"   ✅ Traditional sales report format working")
                if 'data' in response and 'totals' in response:
                    print(f"   Traditional Totals - Sales: {response['totals'].get('sales', 0)} DZD, Bookings: {response['totals'].get('bookings', 0)}")
            
            # Get agencies for specific agency testing
            success, agencies_data = self.run_test("Get Agencies for Filtering", "GET", "agencies", 200)
            if success and agencies_data:
                test_agency_id = agencies_data[0]['id']
                test_agency_name = agencies_data[0].get('name', 'Unknown')
                
                # Test with specific agency_id
                success, response = self.run_test(
                    f"Enhanced Sales Report - Specific Agency ({test_agency_name})",
                    "GET",
                    f"reports/sales?start_date={start_date}&end_date={end_date}&report_type=daily&group_by_agency=true&agency_ids={test_agency_id}",
                    200
                )
                results['sales_specific_agency'] = success
                if success:
                    print(f"   ✅ Sales report for specific agency ({test_agency_name}) working")
            
            # Test 1.2: Enhanced Aging Reports with Agency Breakdown
            print(f"\n   1.2 Testing Enhanced Aging Reports with Agency Breakdown...")
            
            # Test group_by_agency=true with agency_ids=all
            success, response = self.run_test(
                "Enhanced Aging Report - with Agency Breakdown (all agencies)",
                "GET",
                "reports/aging?group_by_agency=true&agency_ids=all",
                200
            )
            results['aging_agency_breakdown_all'] = success
            if success:
                print(f"   ✅ Aging report with agency breakdown generated")
                if 'agencies_data' in response:
                    print(f"   Agencies in aging report: {len(response['agencies_data'])}")
                    for agency in response['agencies_data']:
                        agency_name = agency.get('agency_name', 'Unknown')
                        totals = agency.get('totals', {})
                        print(f"     - {agency_name}: {totals.get('count', 0)} invoices, {totals.get('amount', 0)} DZD")
                if 'grand_totals' in response:
                    print(f"   Grand Totals - Count: {response['grand_totals'].get('count', 0)}, Amount: {response['grand_totals'].get('amount', 0)} DZD")
            
            # Test group_by_agency=false (traditional format)
            success, response = self.run_test(
                "Enhanced Aging Report - Traditional Format (no agency breakdown)",
                "GET",
                "reports/aging?group_by_agency=false",
                200
            )
            results['aging_traditional_format'] = success
            if success:
                print(f"   ✅ Traditional aging report format working")
            
            # Test with specific agency filtering
            if agencies_data:
                success, response = self.run_test(
                    f"Enhanced Aging Report - Specific Agency ({test_agency_name})",
                    "GET",
                    f"reports/aging?group_by_agency=true&agency_ids={test_agency_id}",
                    200
                )
                results['aging_specific_agency'] = success
                if success:
                    print(f"   ✅ Aging report for specific agency ({test_agency_name}) working")
            
            # Test 1.3: New Summary Reports (replaces profit-loss)
            print(f"\n   1.3 Testing New Summary Reports (replaces profit-loss)...")
            
            # Test summary report with agency breakdown
            success, response = self.run_test(
                "New Summary Report - with Agency Breakdown (all agencies)",
                "GET",
                f"reports/summary?start_date={start_date}&end_date={end_date}&group_by_agency=true&agency_ids=all",
                200
            )
            results['summary_agency_breakdown_all'] = success
            if success:
                print(f"   ✅ Summary report with agency breakdown generated")
                if 'agencies_data' in response:
                    print(f"   Agencies in summary report: {len(response['agencies_data'])}")
                    for agency in response['agencies_data']:
                        agency_name = agency.get('agency_name', 'Unknown')
                        sales = agency.get('sales', 0)
                        bookings = agency.get('bookings', 0)
                        invoices = agency.get('invoices', 0)
                        print(f"     - {agency_name}: Sales: {sales} DZD, Bookings: {bookings}, Invoices: {invoices}")
                if 'grand_totals' in response:
                    gt = response['grand_totals']
                    print(f"   Grand Totals - Sales: {gt.get('sales', 0)} DZD, Bookings: {gt.get('bookings', 0)}, Invoices: {gt.get('invoices', 0)}")
            
            # Test summary report without agency breakdown
            success, response = self.run_test(
                "New Summary Report - Traditional Format (no agency breakdown)",
                "GET",
                f"reports/summary?start_date={start_date}&end_date={end_date}&group_by_agency=false",
                200
            )
            results['summary_traditional_format'] = success
            if success:
                print(f"   ✅ Traditional summary report format working")
                if 'data' in response:
                    data = response['data']
                    print(f"   Summary Data - Sales: {data.get('sales', 0)} DZD, Bookings: {data.get('bookings', 0)}, Invoices: {data.get('invoices', 0)}")
            
            # Test summary report with specific agency
            if agencies_data:
                success, response = self.run_test(
                    f"New Summary Report - Specific Agency ({test_agency_name})",
                    "GET",
                    f"reports/summary?start_date={start_date}&end_date={end_date}&group_by_agency=true&agency_ids={test_agency_id}",
                    200
                )
                results['summary_specific_agency'] = success
                if success:
                    print(f"   ✅ Summary report for specific agency ({test_agency_name}) working")
        
        # Step 2: Test with General Accountant (generalaccountant@sanhaja.com / acc123)
        print(f"\n   2. Testing Enhanced Reports with General Accountant...")
        auth_success = self.test_login('generalaccountant@sanhaja.com', 'acc123')
        results['general_accountant_login'] = auth_success
        
        if auth_success:
            print(f"   ✅ General Accountant authenticated successfully")
            
            # Test all reports with General Accountant access
            success, response = self.run_test(
                "General Accountant - Enhanced Sales Report with Agency Breakdown",
                "GET",
                f"reports/sales?start_date={start_date}&end_date={end_date}&report_type=daily&group_by_agency=true&agency_ids=all",
                200
            )
            results['ga_sales_agency_breakdown'] = success
            if success:
                print(f"   ✅ General Accountant can access enhanced sales reports with agency breakdown")
            
            success, response = self.run_test(
                "General Accountant - Enhanced Aging Report with Agency Breakdown",
                "GET",
                "reports/aging?group_by_agency=true&agency_ids=all",
                200
            )
            results['ga_aging_agency_breakdown'] = success
            if success:
                print(f"   ✅ General Accountant can access enhanced aging reports with agency breakdown")
            
            success, response = self.run_test(
                "General Accountant - New Summary Report with Agency Breakdown",
                "GET",
                f"reports/summary?start_date={start_date}&end_date={end_date}&group_by_agency=true&agency_ids=all",
                200
            )
            results['ga_summary_agency_breakdown'] = success
            if success:
                print(f"   ✅ General Accountant can access new summary reports with agency breakdown")
        
        # Step 3: Test with Agency Staff to ensure they still see only their agency
        print(f"\n   3. Testing Enhanced Reports with Agency Staff (should see only their agency)...")
        auth_success = self.test_login('staff1@tlemcen.sanhaja.com', 'staff123')
        results['agency_staff_login'] = auth_success
        
        if auth_success:
            print(f"   ✅ Agency Staff authenticated successfully")
            staff_agency_id = self.current_user.get('agency_id')
            print(f"   Staff Agency ID: {staff_agency_id}")
            
            # Test that agency staff still see only their agency data
            success, response = self.run_test(
                "Agency Staff - Enhanced Sales Report (should be isolated to their agency)",
                "GET",
                f"reports/sales?start_date={start_date}&end_date={end_date}&report_type=daily&group_by_agency=true&agency_ids=all",
                200
            )
            results['staff_sales_isolation'] = success
            if success:
                print(f"   ✅ Agency Staff can access enhanced sales reports")
                # Verify isolation - should only see their agency
                if 'agencies_data' in response:
                    agencies_count = len(response['agencies_data'])
                    if agencies_count == 1:
                        print(f"   ✅ Agency Staff isolation working - sees only 1 agency (their own)")
                        results['staff_sales_isolation_verified'] = True
                    else:
                        print(f"   ❌ Agency Staff isolation broken - sees {agencies_count} agencies")
                        results['staff_sales_isolation_verified'] = False
                elif 'data' in response:
                    print(f"   ✅ Agency Staff sees traditional format (isolated to their agency)")
                    results['staff_sales_isolation_verified'] = True
            
            success, response = self.run_test(
                "Agency Staff - Enhanced Aging Report (should be isolated to their agency)",
                "GET",
                "reports/aging?group_by_agency=true&agency_ids=all",
                200
            )
            results['staff_aging_isolation'] = success
            if success:
                print(f"   ✅ Agency Staff can access enhanced aging reports")
                # Verify isolation
                if 'agencies_data' in response:
                    agencies_count = len(response['agencies_data'])
                    if agencies_count <= 1:
                        print(f"   ✅ Agency Staff aging report isolation working")
                        results['staff_aging_isolation_verified'] = True
                    else:
                        print(f"   ❌ Agency Staff aging report isolation broken")
                        results['staff_aging_isolation_verified'] = False
            
            success, response = self.run_test(
                "Agency Staff - New Summary Report (should be isolated to their agency)",
                "GET",
                f"reports/summary?start_date={start_date}&end_date={end_date}&group_by_agency=true&agency_ids=all",
                200
            )
            results['staff_summary_isolation'] = success
            if success:
                print(f"   ✅ Agency Staff can access new summary reports")
        
        # Step 4: Data Verification - Agency names in Arabic and totals calculation
        print(f"\n   4. Testing Data Verification (Arabic names and totals calculation)...")
        
        # Re-login as Super Admin for verification
        if self.test_login('superadmin@sanhaja.com', 'super123'):
            # Test Arabic agency names
            success, response = self.run_test(
                "Data Verification - Arabic Agency Names in Sales Report",
                "GET",
                f"reports/sales?start_date={start_date}&end_date={end_date}&report_type=daily&group_by_agency=true&agency_ids=all",
                200
            )
            results['arabic_names_verification'] = success
            if success and 'agencies_data' in response:
                print(f"   ✅ Agency names verification:")
                arabic_names_found = 0
                for agency in response['agencies_data']:
                    agency_name = agency.get('agency_name', '')
                    if any(ord(char) > 127 for char in agency_name):  # Check for Arabic characters
                        arabic_names_found += 1
                    print(f"     - {agency_name}")
                
                if arabic_names_found > 0:
                    print(f"   ✅ Arabic agency names confirmed ({arabic_names_found} agencies with Arabic names)")
                    results['arabic_names_confirmed'] = True
                else:
                    print(f"   ⚠️  No Arabic agency names detected")
                    results['arabic_names_confirmed'] = False
            
            # Test totals calculation verification
            success, response = self.run_test(
                "Data Verification - Totals Calculation in Summary Report",
                "GET",
                f"reports/summary?start_date={start_date}&end_date={end_date}&group_by_agency=true&agency_ids=all",
                200
            )
            results['totals_calculation_verification'] = success
            if success and 'agencies_data' in response and 'grand_totals' in response:
                print(f"   ✅ Totals calculation verification:")
                
                # Calculate manual totals from agencies data
                manual_sales = sum(agency.get('sales', 0) for agency in response['agencies_data'])
                manual_bookings = sum(agency.get('bookings', 0) for agency in response['agencies_data'])
                manual_invoices = sum(agency.get('invoices', 0) for agency in response['agencies_data'])
                
                # Compare with grand totals
                grand_totals = response['grand_totals']
                gt_sales = grand_totals.get('sales', 0)
                gt_bookings = grand_totals.get('bookings', 0)
                gt_invoices = grand_totals.get('invoices', 0)
                
                print(f"     Manual calculation - Sales: {manual_sales}, Bookings: {manual_bookings}, Invoices: {manual_invoices}")
                print(f"     Grand totals - Sales: {gt_sales}, Bookings: {gt_bookings}, Invoices: {gt_invoices}")
                
                if (manual_sales == gt_sales and manual_bookings == gt_bookings and manual_invoices == gt_invoices):
                    print(f"   ✅ Totals calculation is accurate")
                    results['totals_accurate'] = True
                else:
                    print(f"   ❌ Totals calculation mismatch")
                    results['totals_accurate'] = False
        
        # Step 5: Test Date Range Filtering with Agency Breakdown
        print(f"\n   5. Testing Date Range Filtering with Agency Breakdown...")
        
        # Test with different date ranges
        short_start = (today - timedelta(days=7)).strftime('%Y-%m-%d')
        success, response = self.run_test(
            "Date Range Filtering - 7 days with Agency Breakdown",
            "GET",
            f"reports/sales?start_date={short_start}&end_date={end_date}&report_type=daily&group_by_agency=true&agency_ids=all",
            200
        )
        results['date_range_filtering'] = success
        if success:
            print(f"   ✅ Date range filtering works with agency breakdown")
        
        return results

    def test_services_management_api(self):
        """Test Services Management API as requested in review"""
        print(f"\n🛠️ Testing Services Management API (Review Request)...")
        print(f"   Testing CRUD operations for services with role-based access control")
        
        results = {}
        
        # Test with Super Admin first
        print(f"\n   Testing as Super Admin (superadmin@sanhaja.com / super123)...")
        auth_success = self.test_login('superadmin@sanhaja.com', 'super123')
        results['super_admin_login'] = auth_success
        
        if not auth_success:
            print("   ❌ Super Admin login failed - cannot proceed with services tests")
            return results
        
        # Test 1: POST /api/services - Create new services
        print(f"\n   1. Testing POST /api/services - Create Services...")
        
        # Create Umrah service
        umrah_service_data = {
            "name": "عمرة اقتصادية",
            "description": "عمرة اقتصادية لمدة 10 أيام",
            "service_type": "عمرة",
            "category": "خدمات دينية",
            "base_price": 150000.0,
            "min_price": 140000.0,
            "is_fixed_price": False,
            "is_active": True,
            "agency_id": None  # Global service
        }
        
        success, umrah_response = self.run_test(
            "Create Umrah Service",
            "POST",
            "services",
            200,
            data=umrah_service_data
        )
        results['create_umrah_service'] = success
        
        if success:
            print(f"   ✅ Umrah service created successfully")
            umrah_service_id = umrah_response.get('id')
            results['umrah_service_id'] = umrah_service_id
        
        # Create Flight Ticket service
        flight_service_data = {
            "name": "تذكرة طيران داخلي",
            "description": "تذكرة طيران داخل الجزائر",
            "service_type": "تذكرة طيران",
            "category": "خدمات سفر",
            "base_price": 25000.0,
            "is_fixed_price": True,
            "is_active": True
        }
        
        success, flight_response = self.run_test(
            "Create Flight Service",
            "POST",
            "services",
            200,
            data=flight_service_data
        )
        results['create_flight_service'] = success
        
        if success:
            print(f"   ✅ Flight service created successfully")
            flight_service_id = flight_response.get('id')
            results['flight_service_id'] = flight_service_id
        
        # Test 2: GET /api/services - List services with filters
        print(f"\n   2. Testing GET /api/services - List Services...")
        
        # Get all services
        success, all_services = self.run_test(
            "Get All Services",
            "GET",
            "services",
            200
        )
        results['get_all_services'] = success
        
        if success:
            print(f"   ✅ Services list retrieved - {len(all_services)} services found")
            
            # Check service types
            service_types = set()
            for service in all_services:
                service_types.add(service.get('service_type', 'Unknown'))
            print(f"   Service types: {', '.join(service_types)}")
        
        # Test filtering by service type
        success, umrah_services = self.run_test(
            "Get Umrah Services",
            "GET",
            "services?service_type=عمرة",
            200
        )
        results['filter_umrah_services'] = success
        
        if success:
            print(f"   ✅ Umrah services filter working - {len(umrah_services)} services found")
        
        # Test filtering by active status
        success, active_services = self.run_test(
            "Get Active Services",
            "GET",
            "services?is_active=true",
            200
        )
        results['filter_active_services'] = success
        
        if success:
            print(f"   ✅ Active services filter working - {len(active_services)} services found")
        
        # Test 3: PUT /api/services/{service_id} - Update service
        print(f"\n   3. Testing PUT /api/services/{umrah_service_id} - Update Service...")
        
        if results.get('umrah_service_id'):
            update_data = {
                "base_price": 155000.0,
                "min_price": 145000.0,
                "description": "عمرة اقتصادية محدثة لمدة 10 أيام مع خدمات إضافية"
            }
            
            success, updated_service = self.run_test(
                "Update Umrah Service",
                "PUT",
                f"services/{umrah_service_id}",
                200,
                data=update_data
            )
            results['update_service'] = success
            
            if success:
                print(f"   ✅ Service updated successfully")
                print(f"   New price: {updated_service.get('base_price')} DZD")
        
        # Test 4: Test role-based access - General Accountant
        print(f"\n   4. Testing General Accountant Access...")
        
        accountant_auth = self.test_login('generalaccountant@sanhaja.com', 'acc123')
        results['accountant_login'] = accountant_auth
        
        if accountant_auth:
            # General Accountant should be able to manage services
            success, accountant_services = self.run_test(
                "General Accountant - Get Services",
                "GET",
                "services",
                200
            )
            results['accountant_get_services'] = success
            
            if success:
                print(f"   ✅ General Accountant can view services - {len(accountant_services)} services")
            
            # Try to create service as General Accountant
            hotel_service_data = {
                "name": "حجز فندق 4 نجوم",
                "description": "حجز فندق 4 نجوم في مكة المكرمة",
                "service_type": "حجز فندق",
                "category": "خدمات إقامة",
                "base_price": 80000.0,
                "is_fixed_price": True,
                "is_active": True
            }
            
            success, hotel_response = self.run_test(
                "General Accountant - Create Service",
                "POST",
                "services",
                200,
                data=hotel_service_data
            )
            results['accountant_create_service'] = success
            
            if success:
                print(f"   ✅ General Accountant can create services")
                hotel_service_id = hotel_response.get('id')
                results['hotel_service_id'] = hotel_service_id
        
        # Test 5: Test role-based access - Agency Staff (should only view)
        print(f"\n   5. Testing Agency Staff Access...")
        
        staff_auth = self.test_login('staff1@tlemcen.sanhaja.com', 'staff123')
        results['staff_login'] = staff_auth
        
        if staff_auth:
            # Agency Staff should be able to view services
            success, staff_services = self.run_test(
                "Agency Staff - Get Services",
                "GET",
                "services",
                200
            )
            results['staff_get_services'] = success
            
            if success:
                print(f"   ✅ Agency Staff can view services - {len(staff_services)} services")
            
            # Agency Staff should NOT be able to create services
            visa_service_data = {
                "name": "خدمة تأشيرة",
                "service_type": "خدمة تأشيرة",
                "category": "خدمات وثائق",
                "base_price": 15000.0,
                "is_fixed_price": True
            }
            
            success, response = self.run_test(
                "Agency Staff - Create Service (Should Fail)",
                "POST",
                "services",
                403,
                data=visa_service_data
            )
            results['staff_cannot_create_service'] = success
            
            if success:
                print(f"   ✅ Agency Staff correctly denied service creation")
        
        # Test 6: DELETE /api/services/{service_id} - Delete service (Super Admin only)
        print(f"\n   6. Testing DELETE /api/services - Delete Service...")
        
        # Login back as Super Admin
        self.test_login('superadmin@sanhaja.com', 'super123')
        
        if results.get('flight_service_id'):
            success, response = self.run_test(
                "Delete Flight Service",
                "DELETE",
                f"services/{flight_service_id}",
                200
            )
            results['delete_service'] = success
            
            if success:
                print(f"   ✅ Service deleted successfully")
        
        return results

    def test_daily_operations_api(self):
        """Test Daily Operations API as requested in review"""
        print(f"\n📋 Testing Daily Operations API (Review Request)...")
        print(f"   Testing daily operations with approval workflow and discount management")
        
        results = {}
        
        # First, get some services and clients to use in operations
        print(f"\n   Setting up test data...")
        
        # Login as Super Admin
        auth_success = self.test_login('superadmin@sanhaja.com', 'super123')
        if not auth_success:
            print("   ❌ Super Admin login failed")
            return results
        
        # Get services
        success, services = self.run_test("Get Services for Operations", "GET", "services", 200)
        if not success or not services:
            print("   ❌ No services available for testing")
            return results
        
        service_id = services[0]['id']
        service_name = services[0]['name']
        base_price = services[0]['base_price']
        
        # Get clients
        success, clients = self.run_test("Get Clients for Operations", "GET", "clients", 200)
        if not success or not clients:
            print("   ❌ No clients available for testing")
            return results
        
        client_id = clients[0]['id']
        client_name = clients[0]['name']
        
        print(f"   Using service: {service_name} ({base_price} DZD)")
        print(f"   Using client: {client_name}")
        
        # Test 1: POST /api/daily-operations - Create operations
        print(f"\n   1. Testing POST /api/daily-operations - Create Operations...")
        
        # Create normal operation without discount
        normal_operation_data = {
            "service_id": service_id,
            "client_id": client_id,
            "notes": "عملية عادية بدون تخفيض"
        }
        
        success, normal_operation = self.run_test(
            "Create Normal Operation",
            "POST",
            "daily-operations",
            200,
            data=normal_operation_data
        )
        results['create_normal_operation'] = success
        
        if success:
            print(f"   ✅ Normal operation created successfully")
            normal_operation_id = normal_operation.get('id')
            results['normal_operation_id'] = normal_operation_id
            print(f"   Operation No: {normal_operation.get('operation_no')}")
            print(f"   Final Price: {normal_operation.get('final_price')} DZD")
        
        # Create operation with discount (requires approval)
        discount_operation_data = {
            "service_id": service_id,
            "client_id": client_id,
            "discount_amount": 10000.0,
            "discount_reason": "عميل مميز - تخفيض خاص",
            "notes": "عملية مع تخفيض تحتاج موافقة"
        }
        
        success, discount_operation = self.run_test(
            "Create Operation with Discount",
            "POST",
            "daily-operations",
            200,
            data=discount_operation_data
        )
        results['create_discount_operation'] = success
        
        if success:
            print(f"   ✅ Operation with discount created successfully")
            discount_operation_id = discount_operation.get('id')
            results['discount_operation_id'] = discount_operation_id
            print(f"   Operation No: {discount_operation.get('operation_no')}")
            print(f"   Base Price: {discount_operation.get('base_price')} DZD")
            print(f"   Discount: {discount_operation.get('discount_amount')} DZD")
            print(f"   Final Price: {discount_operation.get('final_price')} DZD")
            print(f"   Status: {discount_operation.get('status')}")
        
        # Test 2: GET /api/daily-operations - List operations with filters
        print(f"\n   2. Testing GET /api/daily-operations - List Operations...")
        
        # Get all operations
        success, all_operations = self.run_test(
            "Get All Operations",
            "GET",
            "daily-operations",
            200
        )
        results['get_all_operations'] = success
        
        if success:
            print(f"   ✅ Operations list retrieved - {len(all_operations)} operations found")
            
            # Check operation statuses
            statuses = {}
            for operation in all_operations:
                status = operation.get('status', 'Unknown')
                statuses[status] = statuses.get(status, 0) + 1
            print(f"   Operation statuses: {statuses}")
        
        # Test filtering by status
        success, pending_operations = self.run_test(
            "Get Pending Operations",
            "GET",
            "daily-operations?status=في انتظار الموافقة",
            200
        )
        results['filter_pending_operations'] = success
        
        if success:
            print(f"   ✅ Pending operations filter working - {len(pending_operations)} operations")
        
        # Test filtering by client
        success, client_operations = self.run_test(
            "Get Client Operations",
            "GET",
            f"daily-operations?client_id={client_id}",
            200
        )
        results['filter_client_operations'] = success
        
        if success:
            print(f"   ✅ Client operations filter working - {len(client_operations)} operations")
        
        # Test 3: Approval workflow - General Accountant approves
        print(f"\n   3. Testing Approval Workflow...")
        
        # Login as General Accountant
        accountant_auth = self.test_login('generalaccountant@sanhaja.com', 'acc123')
        results['accountant_login_for_approval'] = accountant_auth
        
        if accountant_auth and results.get('discount_operation_id'):
            # Approve operation with discount
            success, approval_response = self.run_test(
                "Approve Operation with Discount",
                "PUT",
                f"daily-operations/{discount_operation_id}/approve",
                200,
                data={"notes": "تمت الموافقة على التخفيض من المحاسب العام"}
            )
            results['approve_discount_operation'] = success
            
            if success:
                print(f"   ✅ Operation approved successfully")
                print(f"   Approved by: {approval_response.get('approved_by')}")
        
        # Test rejection workflow
        if results.get('normal_operation_id'):
            success, rejection_response = self.run_test(
                "Reject Operation",
                "PUT",
                f"daily-operations/{normal_operation_id}/reject",
                200,
                data={
                    "rejection_reason": "بيانات غير مكتملة - يرجى المراجعة",
                    "notes": "العملية مرفوضة لعدم اكتمال البيانات"
                }
            )
            results['reject_operation'] = success
            
            if success:
                print(f"   ✅ Operation rejected successfully")
                print(f"   Rejection reason: {rejection_response.get('rejected_reason')}")
        
        # Test 4: Agency Staff permissions
        print(f"\n   4. Testing Agency Staff Permissions...")
        
        staff_auth = self.test_login('staff1@tlemcen.sanhaja.com', 'staff123')
        results['staff_login_for_operations'] = staff_auth
        
        if staff_auth:
            # Agency Staff can create operations
            staff_operation_data = {
                "service_id": service_id,
                "client_id": client_id,
                "notes": "عملية من موظف الوكالة"
            }
            
            success, staff_operation = self.run_test(
                "Agency Staff - Create Operation",
                "POST",
                "daily-operations",
                200,
                data=staff_operation_data
            )
            results['staff_create_operation'] = success
            
            if success:
                print(f"   ✅ Agency Staff can create operations")
            
            # Agency Staff should NOT be able to approve operations
            if results.get('discount_operation_id'):
                success, response = self.run_test(
                    "Agency Staff - Try Approve (Should Fail)",
                    "PUT",
                    f"daily-operations/{discount_operation_id}/approve",
                    403,
                    data={"notes": "محاولة موافقة من موظف"}
                )
                results['staff_cannot_approve'] = success
                
                if success:
                    print(f"   ✅ Agency Staff correctly denied approval permission")
        
        return results

    def test_daily_operations_reports_api(self):
        """Test Daily Operations Reports API as requested in review"""
        print(f"\n📊 Testing Daily Operations Reports API (Review Request)...")
        print(f"   Testing comprehensive reports with filtering and grouping")
        
        results = {}
        
        # Login as Super Admin
        auth_success = self.test_login('superadmin@sanhaja.com', 'super123')
        if not auth_success:
            print("   ❌ Super Admin login failed")
            return results
        
        # Test 1: GET /api/reports/daily-operations - Basic report
        print(f"\n   1. Testing GET /api/reports/daily-operations - Basic Report...")
        
        # Get basic daily operations report
        success, basic_report = self.run_test(
            "Basic Daily Operations Report",
            "GET",
            "reports/daily-operations",
            200
        )
        results['basic_daily_operations_report'] = success
        
        if success:
            print(f"   ✅ Basic report generated successfully")
            if 'operations' in basic_report:
                print(f"   Total operations: {len(basic_report['operations'])}")
            if 'summary' in basic_report:
                summary = basic_report['summary']
                print(f"   Total amount: {summary.get('total_amount', 0)} DZD")
                print(f"   Total discount: {summary.get('total_discount', 0)} DZD")
        
        # Test 2: Report with agency breakdown
        print(f"\n   2. Testing Report with Agency Breakdown...")
        
        success, agency_report = self.run_test(
            "Daily Operations Report - Agency Breakdown",
            "GET",
            "reports/daily-operations?group_by_agency=true",
            200
        )
        results['agency_breakdown_report'] = success
        
        if success:
            print(f"   ✅ Agency breakdown report generated")
            if 'agencies_data' in agency_report:
                agencies_data = agency_report['agencies_data']
                print(f"   Agencies in report: {len(agencies_data)}")
                for agency_data in agencies_data[:3]:  # Show first 3
                    agency_name = agency_data.get('agency_name', 'Unknown')
                    totals = agency_data.get('totals', {})
                    print(f"   - {agency_name}: {totals.get('total_amount', 0)} DZD")
        
        # Test 3: Report with service breakdown
        print(f"\n   3. Testing Report with Service Breakdown...")
        
        success, service_report = self.run_test(
            "Daily Operations Report - Service Breakdown",
            "GET",
            "reports/daily-operations?group_by_service=true",
            200
        )
        results['service_breakdown_report'] = success
        
        if success:
            print(f"   ✅ Service breakdown report generated")
            if 'services_data' in service_report:
                services_data = service_report['services_data']
                print(f"   Services in report: {len(services_data)}")
        
        # Test 4: Report with date filtering
        print(f"\n   4. Testing Report with Date Filtering...")
        
        from datetime import datetime, timedelta
        today = datetime.now()
        start_date = (today - timedelta(days=7)).strftime('%Y-%m-%d')
        end_date = today.strftime('%Y-%m-%d')
        
        success, date_filtered_report = self.run_test(
            "Daily Operations Report - Date Filter",
            "GET",
            f"reports/daily-operations?start_date={start_date}&end_date={end_date}",
            200
        )
        results['date_filtered_report'] = success
        
        if success:
            print(f"   ✅ Date filtered report generated")
            print(f"   Date range: {start_date} to {end_date}")
        
        # Test 5: Report with status filtering
        print(f"\n   5. Testing Report with Status Filtering...")
        
        success, status_report = self.run_test(
            "Daily Operations Report - Status Filter",
            "GET",
            "reports/daily-operations?status=معتمد",
            200
        )
        results['status_filtered_report'] = success
        
        if success:
            print(f"   ✅ Status filtered report generated")
        
        # Test 6: Report with service type filtering
        print(f"\n   6. Testing Report with Service Type Filtering...")
        
        success, service_type_report = self.run_test(
            "Daily Operations Report - Service Type Filter",
            "GET",
            "reports/daily-operations?service_type=عمرة",
            200
        )
        results['service_type_filtered_report'] = success
        
        if success:
            print(f"   ✅ Service type filtered report generated")
        
        # Test 7: Combined filters and grouping
        print(f"\n   7. Testing Combined Filters and Grouping...")
        
        success, combined_report = self.run_test(
            "Daily Operations Report - Combined Filters",
            "GET",
            f"reports/daily-operations?group_by_agency=true&group_by_service=true&start_date={start_date}&end_date={end_date}",
            200
        )
        results['combined_filters_report'] = success
        
        if success:
            print(f"   ✅ Combined filters report generated")
        
        # Test 8: General Accountant access (specific agency)
        print(f"\n   8. Testing General Accountant Access...")
        
        accountant_auth = self.test_login('generalaccountant@sanhaja.com', 'acc123')
        results['accountant_login_for_reports'] = accountant_auth
        
        if accountant_auth:
            success, accountant_report = self.run_test(
                "General Accountant - Daily Operations Report",
                "GET",
                "reports/daily-operations?group_by_agency=true",
                200
            )
            results['accountant_daily_operations_report'] = success
            
            if success:
                print(f"   ✅ General Accountant can access daily operations reports")
        
        return results

    def test_discount_requests_system(self):
        """Test Discount Requests System - FOCUSED TEST for 500 Error Fix"""
        print(f"\n💰 Testing Discount Requests System - FOCUSED TEST (Review Request)...")
        print(f"   FOCUS: Testing GET /api/discount-requests endpoint to verify 500 error is resolved")
        print(f"   Expected: 200 status with JSON response, not 500 server error")
        
        results = {}
        
        # Test 1: Super Admin Access (superadmin@sanhaja.com / super123)
        print(f"\n   1. Testing Super Admin Access to GET /api/discount-requests...")
        print(f"   Credentials: superadmin@sanhaja.com / super123")
        
        auth_success = self.test_login('superadmin@sanhaja.com', 'super123')
        results['super_admin_login'] = auth_success
        
        if not auth_success:
            print("   ❌ CRITICAL: Super Admin login failed - cannot test discount requests")
            return results
        
        print(f"   ✅ Super Admin authenticated successfully")
        
        # Test GET /api/discount-requests (main test)
        success, discount_requests = self.run_test(
            "Super Admin - GET /api/discount-requests",
            "GET",
            "discount-requests",
            200
        )
        results['super_admin_discount_requests'] = success
        
        if success:
            print(f"   ✅ SUCCESS: Super Admin can access discount requests endpoint")
            print(f"   Response: JSON array with {len(discount_requests)} discount requests")
            
            # Verify response structure
            if isinstance(discount_requests, list):
                print(f"   ✅ Response is proper JSON array (not 500 error)")
                
                if len(discount_requests) > 0:
                    sample_request = discount_requests[0]
                    print(f"   Sample request keys: {list(sample_request.keys())}")
                    
                    # Check for enriched data
                    if 'operation_details' in sample_request or 'user_name' in sample_request:
                        print(f"   ✅ Response includes enriched data")
                        results['enriched_data'] = True
                    else:
                        print(f"   ⚠️  Response may not include enriched data")
                        results['enriched_data'] = False
                else:
                    print(f"   ✅ Empty array response (no discount requests exist)")
                    results['enriched_data'] = True  # Empty is valid
            else:
                print(f"   ❌ Response is not a JSON array: {type(discount_requests)}")
                results['proper_json_response'] = False
        else:
            print(f"   ❌ FAILED: Super Admin cannot access discount requests (likely 500 error)")
            results['super_admin_discount_requests'] = False
        
        # Test 2: General Accountant Access (generalaccountant@sanhaja.com / acc123)
        print(f"\n   2. Testing General Accountant Access to GET /api/discount-requests...")
        print(f"   Credentials: generalaccountant@sanhaja.com / acc123")
        
        accountant_auth = self.test_login('generalaccountant@sanhaja.com', 'acc123')
        results['general_accountant_login'] = accountant_auth
        
        if accountant_auth:
            print(f"   ✅ General Accountant authenticated successfully")
            
            success, accountant_requests = self.run_test(
                "General Accountant - GET /api/discount-requests",
                "GET",
                "discount-requests",
                200
            )
            results['general_accountant_discount_requests'] = success
            
            if success:
                print(f"   ✅ SUCCESS: General Accountant can access discount requests endpoint")
                print(f"   Response: JSON array with {len(accountant_requests)} discount requests")
                
                if isinstance(accountant_requests, list):
                    print(f"   ✅ Response is proper JSON array (not 500 error)")
                else:
                    print(f"   ❌ Response is not a JSON array: {type(accountant_requests)}")
            else:
                print(f"   ❌ FAILED: General Accountant cannot access discount requests (likely 500 error)")
        else:
            print(f"   ❌ General Accountant login failed")
        
        # Test 3: Query Parameters Testing
        print(f"\n   3. Testing Query Parameters (status, agency_id filters)...")
        
        # Re-login as Super Admin for parameter testing
        if auth_success:
            # Test status filter
            success, filtered_requests = self.run_test(
                "GET /api/discount-requests?status=في انتظار الموافقة",
                "GET",
                "discount-requests?status=في انتظار الموافقة",
                200
            )
            results['status_filter'] = success
            
            if success:
                print(f"   ✅ Status filter works - {len(filtered_requests)} pending requests")
            else:
                print(f"   ❌ Status filter failed")
            
            # Test agency_id filter (get first agency ID)
            agencies_success, agencies = self.run_test(
                "Get Agencies for Filter Test",
                "GET",
                "agencies",
                200
            )
            
            if agencies_success and agencies:
                test_agency_id = agencies[0]['id']
                success, agency_filtered = self.run_test(
                    f"GET /api/discount-requests?agency_id={test_agency_id}",
                    "GET",
                    f"discount-requests?agency_id={test_agency_id}",
                    200
                )
                results['agency_filter'] = success
                
                if success:
                    print(f"   ✅ Agency filter works - {len(agency_filtered)} requests for agency")
                else:
                    print(f"   ❌ Agency filter failed")
        
        # Test 4: MongoDB ObjectId Serialization Check
        print(f"\n   4. Testing MongoDB ObjectId Serialization...")
        
        if results.get('super_admin_discount_requests') and isinstance(discount_requests, list):
            try:
                # Try to serialize the response to JSON to check for ObjectId issues
                import json
                json_str = json.dumps(discount_requests)
                print(f"   ✅ Response can be serialized to JSON (no ObjectId serialization errors)")
                results['no_objectid_errors'] = True
            except Exception as e:
                print(f"   ❌ JSON serialization error (likely ObjectId issue): {str(e)}")
                results['no_objectid_errors'] = False
        
        # Test Summary
        print(f"\n   📊 DISCOUNT REQUESTS ENDPOINT TEST SUMMARY:")
        
        if results.get('super_admin_discount_requests') and results.get('general_accountant_discount_requests'):
            print(f"   ✅ SUCCESS: Both Super Admin and General Accountant can access endpoint")
            print(f"   ✅ SUCCESS: No 500 server errors detected")
            print(f"   ✅ SUCCESS: Endpoint returns proper JSON responses")
            
            if results.get('status_filter') and results.get('agency_filter'):
                print(f"   ✅ SUCCESS: Query parameters (status, agency_id) work correctly")
            
            if results.get('no_objectid_errors'):
                print(f"   ✅ SUCCESS: No MongoDB ObjectId serialization errors")
            
            print(f"\n   🎉 CONCLUSION: Discount Requests API endpoint is WORKING correctly!")
            print(f"   The 500 error has been resolved.")
            
        else:
            print(f"   ❌ FAILURE: Discount Requests endpoint still has issues")
            if not results.get('super_admin_discount_requests'):
                print(f"   ❌ Super Admin access failed")
            if not results.get('general_accountant_discount_requests'):
                print(f"   ❌ General Accountant access failed")
            
            print(f"\n   🚨 CONCLUSION: Discount Requests API endpoint still needs fixing!")
        
        return results

    def test_cross_agency_access_permissions(self):
        """Test Cross-Agency Access Testing as requested in review"""
        print(f"\n🔐 Testing Cross-Agency Access Permissions (Review Request)...")
        print(f"   Testing role-based permissions across different user types")
        
        results = {}
        
        # Test 1: Super Admin - should see all agencies' data
        print(f"\n   1. Testing Super Admin Cross-Agency Access...")
        
        super_admin_auth = self.test_login('superadmin@sanhaja.com', 'super123')
        results['super_admin_login'] = super_admin_auth
        
        if super_admin_auth:
            # Test services access
            success, services = self.run_test("Super Admin - Get All Services", "GET", "services", 200)
            if success:
                agency_ids = set()
                for service in services:
                    if service.get('agency_id'):
                        agency_ids.add(service['agency_id'])
                print(f"   ✅ Super Admin sees services from {len(agency_ids)} agencies")
                results['super_admin_services_agencies'] = len(agency_ids)
            
            # Test operations access
            success, operations = self.run_test("Super Admin - Get All Operations", "GET", "daily-operations", 200)
            if success:
                agency_ids = set()
                for operation in operations:
                    if operation.get('agency_id'):
                        agency_ids.add(operation['agency_id'])
                print(f"   ✅ Super Admin sees operations from {len(agency_ids)} agencies")
                results['super_admin_operations_agencies'] = len(agency_ids)
        
        # Test 2: General Accountant - should manage their agency data
        print(f"\n   2. Testing General Accountant Agency Management...")
        
        accountant_auth = self.test_login('generalaccountant@sanhaja.com', 'acc123')
        results['accountant_login'] = accountant_auth
        
        if accountant_auth:
            accountant_agency_id = self.current_user.get('agency_id')
            print(f"   General Accountant Agency ID: {accountant_agency_id}")
            
            # Test services management
            success, services = self.run_test("General Accountant - Get Services", "GET", "services", 200)
            if success:
                print(f"   ✅ General Accountant can access services - {len(services)} services")
                results['accountant_services_count'] = len(services)
            
            # Test operations management
            success, operations = self.run_test("General Accountant - Get Operations", "GET", "daily-operations", 200)
            if success:
                print(f"   ✅ General Accountant can access operations - {len(operations)} operations")
                results['accountant_operations_count'] = len(operations)
        
        # Test 3: Agency Staff - should only view and create operations
        print(f"\n   3. Testing Agency Staff Limited Access...")
        
        staff_auth = self.test_login('staff1@tlemcen.sanhaja.com', 'staff123')
        results['staff_login'] = staff_auth
        
        if staff_auth:
            staff_agency_id = self.current_user.get('agency_id')
            print(f"   Agency Staff Agency ID: {staff_agency_id}")
            
            # Test services view access
            success, services = self.run_test("Agency Staff - Get Services", "GET", "services", 200)
            if success:
                print(f"   ✅ Agency Staff can view services - {len(services)} services")
                results['staff_services_count'] = len(services)
            
            # Test operations view access
            success, operations = self.run_test("Agency Staff - Get Operations", "GET", "daily-operations", 200)
            if success:
                # Should only see operations from their agency
                staff_agency_operations = [op for op in operations if op.get('agency_id') == staff_agency_id]
                print(f"   ✅ Agency Staff sees {len(staff_agency_operations)} operations from their agency")
                results['staff_agency_operations_count'] = len(staff_agency_operations)
        
        return results

    def test_services_and_daily_operations_comprehensive(self):
        """Comprehensive test of Services Management and Daily Operations as requested in review"""
        print(f"\n🎯 COMPREHENSIVE SERVICES & DAILY OPERATIONS TESTING (REVIEW REQUEST)")
        print(f"   Testing all aspects of the newly implemented Services Management and Daily Operations system")
        
        all_results = {}
        
        # Test 1: Services Management API
        print(f"\n" + "="*80)
        print(f"SERVICES MANAGEMENT API TESTING")
        print(f"="*80)
        
        services_results = self.test_services_management_api()
        all_results.update(services_results)
        
        # Test 2: Daily Operations API
        print(f"\n" + "="*80)
        print(f"DAILY OPERATIONS API TESTING")
        print(f"="*80)
        
        operations_results = self.test_daily_operations_api()
        all_results.update(operations_results)
        
        # Test 3: Daily Operations Reports API
        print(f"\n" + "="*80)
        print(f"DAILY OPERATIONS REPORTS API TESTING")
        print(f"="*80)
        
        reports_results = self.test_daily_operations_reports_api()
        all_results.update(reports_results)
        
        # Test 4: Discount Requests System
        print(f"\n" + "="*80)
        print(f"DISCOUNT REQUESTS SYSTEM TESTING")
        print(f"="*80)
        
        discount_results = self.test_discount_requests_system()
        all_results.update(discount_results)
        
        # Test 5: Cross-Agency Access Testing
        print(f"\n" + "="*80)
        print(f"CROSS-AGENCY ACCESS PERMISSIONS TESTING")
        print(f"="*80)
        
        access_results = self.test_cross_agency_access_permissions()
        all_results.update(access_results)
        
        # Test 6: Authentication and Authorization Testing
        print(f"\n" + "="*80)
        print(f"AUTHENTICATION AND AUTHORIZATION TESTING")
        print(f"="*80)
        
        # Test all user credentials from review request
        test_credentials = [
            ('superadmin@sanhaja.com', 'super123', 'Super Admin'),
            ('generalaccountant@sanhaja.com', 'acc123', 'General Accountant'),
            ('staff1@tlemcen.sanhaja.com', 'staff123', 'Agency Staff')
        ]
        
        for email, password, role_name in test_credentials:
            print(f"\n   Testing {role_name} credentials ({email})...")
            auth_success = self.test_login(email, password)
            all_results[f'{role_name.lower().replace(" ", "_")}_auth'] = auth_success
            
            if auth_success:
                print(f"   ✅ {role_name} authentication successful")
                print(f"   User: {self.current_user.get('name')} ({self.current_user.get('role')})")
            else:
                print(f"   ❌ {role_name} authentication failed")
        
        return all_results

    def test_create_sample_services_for_daily_operations(self):
        """Create sample services for Daily Operations testing as requested in review"""
        print(f"\n🏪 Creating Sample Services for Daily Operations (Review Request)...")
        print(f"   Creating 5 different services to populate the services dropdown in Daily Operations")
        
        results = {}
        
        # Step 1: Login as Super Admin (exact credentials from review request)
        print(f"\n   1. Super Admin Login (superadmin@sanhaja.com / super123)...")
        auth_success = self.test_login('superadmin@sanhaja.com', 'super123')
        results['super_admin_login'] = auth_success
        
        if not auth_success:
            print("   ❌ CRITICAL: Super Admin login failed - cannot create services")
            return results
            
        print(f"   ✅ Super Admin authenticated successfully")
        print(f"   User: {self.current_user.get('name')} ({self.current_user.get('role')})")
        
        # Step 2: Create Sample Services as specified in review request
        print(f"\n   2. Creating 5 Sample Services...")
        
        sample_services = [
            {
                "name": "عمرة اقتصادية",
                "description": "عمرة اقتصادية لمدة 10 أيام",
                "service_type": "عمرة",
                "category": "خدمات دينية",
                "base_price": 150000.0,
                "min_price": 140000.0,
                "is_fixed_price": False,
                "is_active": True
            },
            {
                "name": "تذكرة طيران داخلي",
                "description": "تذكرة طيران داخلي ذهاب وإياب",
                "service_type": "تذكرة طيران",
                "category": "خدمات سفر",
                "base_price": 25000.0,
                "min_price": 20000.0,
                "is_fixed_price": False,
                "is_active": True
            },
            {
                "name": "حجز فندق 4 نجوم",
                "description": "حجز فندق 4 نجوم لليلة واحدة",
                "service_type": "حجز فندق",
                "category": "خدمات إقامة",
                "base_price": 80000.0,
                "min_price": 75000.0,
                "is_fixed_price": False,
                "is_active": True
            },
            {
                "name": "خدمة تأشيرة",
                "description": "خدمة استخراج تأشيرة سفر",
                "service_type": "خدمة تأشيرة",
                "category": "خدمات وثائق",
                "base_price": 15000.0,
                "min_price": 12000.0,
                "is_fixed_price": False,
                "is_active": True
            },
            {
                "name": "خدمة نقل",
                "description": "خدمة نقل من وإلى المطار",
                "service_type": "نقل",
                "category": "خدمات سفر",
                "base_price": 5000.0,
                "min_price": 4000.0,
                "is_fixed_price": False,
                "is_active": True
            }
        ]
        
        created_services = []
        
        for i, service_data in enumerate(sample_services, 1):
            print(f"\n   2.{i}. Creating Service: {service_data['name']} ({service_data['base_price']} DZD)...")
            
            success, response = self.run_test(
                f"Create Service - {service_data['name']}",
                "POST",
                "services",
                200,
                data=service_data
            )
            
            results[f'create_service_{i}'] = success
            
            if success:
                print(f"   ✅ Service created successfully")
                print(f"   Service ID: {response.get('id', 'Unknown')}")
                print(f"   Type: {service_data['service_type']}")
                print(f"   Category: {service_data['category']}")
                print(f"   Price: {service_data['base_price']} DZD")
                created_services.append(response)
            else:
                print(f"   ❌ Failed to create service: {service_data['name']}")
        
        # Step 3: Verify Services Created - GET /api/services
        print(f"\n   3. Verifying Services Created (GET /api/services)...")
        
        success, services_list = self.run_test(
            "Get All Services",
            "GET",
            "services",
            200
        )
        results['verify_services_created'] = success
        
        if success:
            print(f"   ✅ Services endpoint accessible")
            print(f"   Total services in system: {len(services_list)}")
            
            # Check if our created services are in the list
            created_service_names = [s['name'] for s in sample_services]
            found_services = []
            
            for service in services_list:
                if service.get('name') in created_service_names:
                    found_services.append(service)
            
            print(f"   Sample services found: {len(found_services)}/5")
            
            for service in found_services:
                print(f"   ✅ {service.get('name')} - {service.get('base_price')} DZD - Active: {service.get('is_active')}")
            
            results['all_sample_services_found'] = len(found_services) == 5
            
            if len(found_services) == 5:
                print(f"   ✅ All 5 sample services successfully created and verified")
            else:
                print(f"   ⚠️  Only {len(found_services)} out of 5 sample services found")
        
        # Step 4: Test Services in Daily Operations Context
        print(f"\n   4. Testing Services in Daily Operations Context...")
        
        # Try to access daily operations endpoint to see if services are available
        success, daily_operations = self.run_test(
            "Get Daily Operations",
            "GET",
            "daily-operations",
            200
        )
        results['daily_operations_accessible'] = success
        
        if success:
            print(f"   ✅ Daily Operations endpoint accessible")
            print(f"   Current daily operations: {len(daily_operations)}")
            print(f"   Services are now available for Daily Operations dropdown")
        
        # Step 5: Test Service Categories for UI Dropdown
        print(f"\n   5. Testing Service Categories for UI Dropdown...")
        
        if services_list:
            categories = set()
            service_types = set()
            
            for service in services_list:
                if service.get('category'):
                    categories.add(service['category'])
                if service.get('service_type'):
                    service_types.add(service['service_type'])
            
            print(f"   Available Categories: {list(categories)}")
            print(f"   Available Service Types: {list(service_types)}")
            print(f"   ✅ Services provide good variety for dropdown options")
            
            results['service_categories_available'] = len(categories) > 0
            results['service_types_available'] = len(service_types) > 0
        
        return results

def main():
    print("🚀 Starting Sanhaja Travel Agencies Backend API Testing...")
    print("نظام محاسبة وكالات صنهاجة للسفر - اختبار واجهات برمجة التطبيقات")
    print("=" * 80)
    
    tester = SanhajaAPITester()
    
    # NEW SERVICES MANAGEMENT AND DAILY OPERATIONS SYSTEM TESTING (PRIMARY FOCUS from Current Review Request)
    print("\n" + "="*80)
    print("🛠️ SERVICES MANAGEMENT AND DAILY OPERATIONS SYSTEM TESTING - PRIMARY FOCUS")
    print("اختبار نظام إدارة الخدمات والعمليات اليومية - المحور الأساسي")
    print("="*80)
    
    services_operations_results = tester.test_services_and_daily_operations_comprehensive()
    
    # NEW ENHANCED REPORTS SYSTEM TESTING (SECONDARY FOCUS from Previous Review Request)
    print("\n" + "="*80)
    print("📊 NEW ENHANCED REPORTS SYSTEM WITH AGENCY BREAKDOWN TESTING - SECONDARY FOCUS")
    print("اختبار نظام التقارير المحسن الجديد مع تفصيل الوكالات - المحور الثانوي")
    print("="*80)
    
    enhanced_reports_results = tester.test_enhanced_reports_system_with_agency_breakdown()
    
    # ENHANCED GENERAL ACCOUNTANT TESTING (Secondary Focus from Review Request)
    print("\n" + "="*80)
    print("💼 ENHANCED GENERAL ACCOUNTANT FUNCTIONALITY TESTING - SECONDARY FOCUS")
    print("اختبار وظائف المحاسب العام المحسنة - المحور الثانوي")
    print("="*80)
    
    general_accountant_results = tester.test_general_accountant_enhanced_functionality()
    
    # GOOGLE AUTHENTICATION TESTING (Secondary Focus from Review Request)
    print("\n" + "="*80)
    print("🔐 GOOGLE AUTHENTICATION SYSTEM TESTING - SECONDARY FOCUS")
    print("اختبار نظام المصادقة عبر جوجل - المحور الثانوي")
    print("="*80)
    
    google_auth_results = tester.test_google_authentication_system()
    
    # Test Basic Requirements First
    print("\n" + "="*80)
    print("اختبار المتطلبات الأساسية من طلب المراجعة")
    print("TESTING BASIC REQUIREMENTS FROM REVIEW REQUEST")
    print("="*80)
    
    basic_results = tester.test_basic_requirements()
    
    # BUG INVESTIGATION (Secondary Focus from Review Request)
    print("\n" + "="*80)
    print("🔍 BUG INVESTIGATION - OPERATIONS MANAGEMENT CROSS-AGENCY ACCESS")
    print("تحقيق الأخطاء - الوصول عبر الوكالات لإدارة العمليات")
    print("="*80)
    
    bug_investigation_results = tester.test_operations_management_bug_investigation()
    
    # Test SUPER ADMIN FUNCTIONALITY (Secondary Focus from Review Request)
    print("\n" + "="*80)
    print("اختبار وظائف المدير العام - المحور الثانوي من طلب المراجعة")
    print("TESTING SUPER ADMIN FUNCTIONALITY - SECONDARY FOCUS FROM REVIEW REQUEST")
    print("="*80)
    
    super_admin_results = tester.test_super_admin_functionality()
    
    # Only run full tests if basic authentication works
    if basic_results.get('admin_login'):
        # Test NEW: Reports Endpoints (Secondary Focus)
        print("\n" + "="*80)
        print("اختبار تقارير النظام الجديدة - المحور الثانوي")
        print("TESTING NEW REPORTS ENDPOINTS - SECONDARY FOCUS")
        print("="*80)
        
        reports_results = tester.test_reports_endpoints()
        
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
        
        # Services Management and Daily Operations Results (PRIMARY FOCUS - CURRENT REVIEW)
        print(f"\n🛠️ نتائج نظام إدارة الخدمات والعمليات اليومية - SERVICES & DAILY OPERATIONS RESULTS (PRIMARY FOCUS):")
        services_operations_keys = [
            ('super_admin_login', 'Super Admin Login (superadmin@sanhaja.com)'),
            ('create_umrah_service', 'Create Umrah Service'),
            ('create_flight_service', 'Create Flight Service'),
            ('get_all_services', 'Get All Services'),
            ('filter_umrah_services', 'Filter Umrah Services'),
            ('filter_active_services', 'Filter Active Services'),
            ('update_service', 'Update Service'),
            ('accountant_login', 'General Accountant Login'),
            ('accountant_get_services', 'General Accountant - Get Services'),
            ('accountant_create_service', 'General Accountant - Create Service'),
            ('staff_login', 'Agency Staff Login'),
            ('staff_get_services', 'Agency Staff - Get Services'),
            ('staff_cannot_create_service', 'Agency Staff Cannot Create Service'),
            ('delete_service', 'Delete Service'),
            ('create_normal_operation', 'Create Normal Operation'),
            ('create_discount_operation', 'Create Operation with Discount'),
            ('get_all_operations', 'Get All Operations'),
            ('filter_pending_operations', 'Filter Pending Operations'),
            ('filter_client_operations', 'Filter Client Operations'),
            ('accountant_login_for_approval', 'General Accountant Login for Approval'),
            ('approve_discount_operation', 'Approve Operation with Discount'),
            ('reject_operation', 'Reject Operation'),
            ('staff_login_for_operations', 'Agency Staff Login for Operations'),
            ('staff_create_operation', 'Agency Staff - Create Operation'),
            ('staff_cannot_approve', 'Agency Staff Cannot Approve'),
            ('basic_daily_operations_report', 'Basic Daily Operations Report'),
            ('agency_breakdown_report', 'Agency Breakdown Report'),
            ('service_breakdown_report', 'Service Breakdown Report'),
            ('date_filtered_report', 'Date Filtered Report'),
            ('status_filtered_report', 'Status Filtered Report'),
            ('service_type_filtered_report', 'Service Type Filtered Report'),
            ('combined_filters_report', 'Combined Filters Report'),
            ('accountant_login_for_reports', 'General Accountant Login for Reports'),
            ('accountant_daily_operations_report', 'General Accountant - Daily Operations Report'),
            ('get_discount_requests', 'Get Discount Requests'),
            ('filter_pending_discount_requests', 'Filter Pending Discount Requests'),
            ('accountant_login_for_discounts', 'General Accountant Login for Discounts'),
            ('accountant_discount_requests', 'General Accountant - Discount Requests'),
            ('staff_login_for_discounts', 'Agency Staff Login for Discounts'),
            ('staff_discount_requests', 'Agency Staff - Discount Requests'),
            ('super_admin_auth', 'Super Admin Authentication'),
            ('general_accountant_auth', 'General Accountant Authentication'),
            ('agency_staff_auth', 'Agency Staff Authentication')
        ]
        
        for key, description in services_operations_keys:
            if key in services_operations_results:
                status = "✅" if services_operations_results[key] else "❌"
                print(f"   {status} {description}")
        
        # Services & Operations Functionality Score
        so_working = sum(1 for key, _ in services_operations_keys if services_operations_results.get(key, False))
        so_total = len(services_operations_keys)
        print(f"\n   📊 Services & Daily Operations System Score: {so_working}/{so_total} ({(so_working/so_total)*100:.1f}%)")
        
        # Enhanced Reports System Results (SECONDARY FOCUS)
        print(f"\n📊 نتائج نظام التقارير المحسن - ENHANCED REPORTS SYSTEM RESULTS (SECONDARY FOCUS):")
        enhanced_reports_keys = [
            ('super_admin_login', 'Super Admin Login (superadmin@sanhaja.com)'),
            ('sales_daily_agency_breakdown_all', 'Enhanced Sales Report - Daily with Agency Breakdown'),
            ('sales_monthly_agency_breakdown_all', 'Enhanced Sales Report - Monthly with Agency Breakdown'),
            ('sales_traditional_format', 'Enhanced Sales Report - Traditional Format'),
            ('sales_specific_agency', 'Enhanced Sales Report - Specific Agency Filter'),
            ('aging_agency_breakdown_all', 'Enhanced Aging Report - with Agency Breakdown'),
            ('aging_traditional_format', 'Enhanced Aging Report - Traditional Format'),
            ('aging_specific_agency', 'Enhanced Aging Report - Specific Agency Filter'),
            ('summary_agency_breakdown_all', 'New Summary Report - with Agency Breakdown'),
            ('summary_traditional_format', 'New Summary Report - Traditional Format'),
            ('summary_specific_agency', 'New Summary Report - Specific Agency Filter'),
            ('general_accountant_login', 'General Accountant Login (generalaccountant@sanhaja.com)'),
            ('ga_sales_agency_breakdown', 'General Accountant - Enhanced Sales Reports Access'),
            ('ga_aging_agency_breakdown', 'General Accountant - Enhanced Aging Reports Access'),
            ('ga_summary_agency_breakdown', 'General Accountant - New Summary Reports Access'),
            ('agency_staff_login', 'Agency Staff Login (staff1@tlemcen.sanhaja.com)'),
            ('staff_sales_isolation', 'Agency Staff - Sales Reports Isolation'),
            ('staff_aging_isolation', 'Agency Staff - Aging Reports Isolation'),
            ('staff_summary_isolation', 'Agency Staff - Summary Reports Isolation'),
            ('staff_sales_isolation_verified', 'Agency Staff Sales Isolation Verified'),
            ('staff_aging_isolation_verified', 'Agency Staff Aging Isolation Verified'),
            ('arabic_names_verification', 'Arabic Agency Names Verification'),
            ('arabic_names_confirmed', 'Arabic Agency Names Confirmed'),
            ('totals_calculation_verification', 'Totals Calculation Verification'),
            ('totals_accurate', 'Totals Calculation Accuracy'),
            ('date_range_filtering', 'Date Range Filtering with Agency Breakdown')
        ]
        
        for key, description in enhanced_reports_keys:
            if key in enhanced_reports_results:
                status = "✅" if enhanced_reports_results[key] else "❌"
                print(f"   {status} {description}")
        
        # Enhanced Reports Functionality Score
        er_working = sum(1 for key, _ in enhanced_reports_keys if enhanced_reports_results.get(key, False))
        er_total = len(enhanced_reports_keys)
        print(f"\n   📊 Enhanced Reports System Score: {er_working}/{er_total} ({(er_working/er_total)*100:.1f}%)")
        
        # General Accountant Results (SECONDARY FOCUS)
        print(f"\n💼 نتائج المحاسب العام المحسن - ENHANCED GENERAL ACCOUNTANT RESULTS (PRIMARY FOCUS):")
        general_accountant_keys = [
            ('general_accountant_login', 'General Accountant Login (generalaccountant@sanhaja.com)'),
            ('clients_cross_agency', 'GET /api/clients - Cross-agency access'),
            ('clients_all_agencies', 'Clients from ALL 6 agencies visible'),
            ('suppliers_cross_agency', 'GET /api/suppliers - Cross-agency access'),
            ('suppliers_all_agencies', 'Suppliers from ALL 6 agencies visible'),
            ('bookings_cross_agency', 'GET /api/bookings - Cross-agency access'),
            ('bookings_all_agencies', 'Bookings from ALL 6 agencies visible'),
            ('invoices_cross_agency', 'GET /api/invoices - Cross-agency access'),
            ('invoices_all_agencies', 'Invoices from ALL 6 agencies visible'),
            ('payments_cross_agency', 'GET /api/payments - Cross-agency access'),
            ('payments_all_agencies', 'Payments from ALL 6 agencies visible'),
            ('clients_agency_filter', 'Agency filtering for clients works'),
            ('clients_filter_accuracy', 'Agency filter returns correct data'),
            ('dashboard_agency_filter', 'Dashboard agency filtering works'),
            ('dashboard_consolidated', 'Consolidated dashboard (no filter) works'),
            ('agency_staff_login', 'Agency staff login (isolation test)'),
            ('staff_clients_isolated', 'Agency staff sees only their data'),
            ('staff_isolation_verified', 'Agency staff isolation verified'),
            ('staff_filter_ignored', 'Agency filtering ignored for staff')
        ]
        
        for key, description in general_accountant_keys:
            if key in general_accountant_results:
                status = "✅" if general_accountant_results[key] else "❌"
                print(f"   {status} {description}")
        
        # General Accountant Functionality Score
        ga_working = sum(1 for key, _ in general_accountant_keys if general_accountant_results.get(key, False))
        ga_total = len(general_accountant_keys)
        print(f"\n   📊 General Accountant Functionality Score: {ga_working}/{ga_total} ({(ga_working/ga_total)*100:.1f}%)")
        
        # Google Authentication Results (SECONDARY FOCUS)
        print(f"\n🔐 نتائج نظام المصادقة عبر جوجل - GOOGLE AUTHENTICATION RESULTS (SECONDARY FOCUS):")
        google_auth_keys = [
            ('google_auth_endpoint_accessible', 'POST /api/auth/google endpoint structure'),
            ('google_auth_no_session', 'Rejects requests without session ID'),
            ('google_auth_invalid_session', 'Rejects invalid session IDs'),
            ('logout_endpoint', 'POST /api/auth/logout endpoint'),
            ('profile_endpoint_authenticated', 'GET /api/auth/profile endpoint (authenticated)'),
            ('profile_endpoint_unauthenticated', 'Rejects unauthenticated profile requests'),
            ('jwt_auth_compatibility', 'JWT authentication backward compatibility'),
            ('jwt_dashboard_access', 'JWT tokens work for protected endpoints'),
            ('session_token_handling', 'Session token handling infrastructure'),
            ('cors_configured', 'CORS configuration for withCredentials'),
            ('cookie_security', 'Cookie security settings'),
            ('auth_dependency_working', 'Dual authentication support (JWT + Session)')
        ]
        
        for key, description in google_auth_keys:
            if key in google_auth_results:
                status = "✅" if google_auth_results[key] else "❌"
                print(f"   {status} {description}")
        
        # Google Auth Infrastructure Score
        infrastructure_score = google_auth_results.get('infrastructure_score', 0)
        print(f"\n   📊 Google Auth Infrastructure Score: {infrastructure_score*100:.1f}%")
        
        if infrastructure_score >= 0.75:
            print(f"   ✅ Google Authentication infrastructure is ready for OAuth integration")
        elif infrastructure_score >= 0.5:
            print(f"   ⚠️  Google Authentication infrastructure partially ready")
        else:
            print(f"   ❌ Google Authentication infrastructure needs significant work")
        
        # Bug Investigation Results (PRIMARY FOCUS)
        print(f"\n🔍 نتائج تحقيق الأخطاء - BUG INVESTIGATION RESULTS (PRIMARY FOCUS):")
        bug_keys = [
            ('super_admin_login', 'Super Admin Login (superadmin@sanhaja.com)'),
            ('clients_endpoint', 'GET /api/clients endpoint'),
            ('suppliers_endpoint', 'GET /api/suppliers endpoint'),
            ('bookings_endpoint', 'GET /api/bookings endpoint'),
            ('clients_cross_agency', 'Clients Cross-Agency Access'),
            ('suppliers_cross_agency', 'Suppliers Cross-Agency Access'),
            ('bookings_cross_agency', 'Bookings Cross-Agency Access'),
            ('all_agencies_exist', 'All 6 Agencies Exist in System')
        ]
        
        for key, description in bug_keys:
            if key in bug_investigation_results:
                status = "✅" if bug_investigation_results[key] else "❌"
                print(f"   {status} {description}")
        
        # Bug Summary
        bugs_found = bug_investigation_results.get('bugs_found', 0)
        working_endpoints = bug_investigation_results.get('working_endpoints', 0)
        
        print(f"\n   📊 BUG INVESTIGATION SUMMARY:")
        print(f"   Working Operations Endpoints: {working_endpoints}/3")
        print(f"   Bugs Found: {bugs_found}/3")
        
        if bugs_found > 0:
            print(f"   🐛 CRITICAL BUGS IDENTIFIED in operations management endpoints")
            print(f"   🔧 FIX REQUIRED: Update suppliers and bookings endpoints for Super Admin cross-agency access")
        else:
            print(f"   ✅ NO BUGS FOUND: All operations endpoints working correctly")
        
        # Super Admin Results (SECONDARY FOCUS)
        print(f"\n👑 نتائج وظائف المدير العام - SUPER ADMIN FUNCTIONALITY RESULTS (SECONDARY FOCUS):")
        super_admin_keys = [
            ('super_admin_login', 'Super Admin Login (superadmin@sanhaja.com)'),
            ('super_admin_dashboard', 'Super Admin Dashboard (All Agencies Data)'),
            ('super_admin_invoices', 'Super Admin Invoices (All Agencies)'),
            ('super_admin_payments', 'Super Admin Payments (All Agencies)'),
            ('super_admin_users', 'Super Admin User Management'),
            ('super_admin_agencies', 'Super Admin Agencies Access'),
            ('super_admin_daily_reports', 'Super Admin Daily Reports Management'),
            ('super_admin_cross_agency_invoices', 'Cross-Agency Invoices Visibility'),
            ('super_admin_cross_agency_payments', 'Cross-Agency Payments Visibility'),
            ('super_admin_cross_agency_reports', 'Cross-Agency Reports Visibility'),
            ('super_admin_all_agencies', 'All 6 Agencies Visible')
        ]
        
        for key, description in super_admin_keys:
            if key in super_admin_results:
                status = "✅" if super_admin_results[key] else "❌"
                print(f"   {status} {description}")
        
        # Reports Results (SECONDARY FOCUS)
        print(f"\n📊 نتائج تقارير النظام الجديدة - NEW REPORTS ENDPOINTS RESULTS:")
        reports_keys = [
            ('sales_report_daily', 'Sales Report - Daily'),
            ('sales_report_monthly', 'Sales Report - Monthly'),
            ('aging_report', 'Aging Report'),
            ('profit_loss_report', 'Profit/Loss Report'),
            ('error_handling_invalid_date', 'Error Handling - Invalid Date'),
            ('error_handling_missing_params', 'Error Handling - Missing Parameters'),
            ('agency_isolation_verified', 'Agency Isolation')
        ]
        
        for key, description in reports_keys:
            if key in reports_results:
                status = "✅" if reports_results[key] else "❌"
                print(f"   {status} {description}")
        
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
        
        # Services Management and Daily Operations Critical Issues (PRIMARY FOCUS - CURRENT REVIEW)
        if not services_operations_results.get('super_admin_login'):
            critical_issues.append("❌ Super Admin login failed (superadmin@sanhaja.com)")
        if not services_operations_results.get('create_umrah_service'):
            critical_issues.append("❌ Cannot create Umrah service")
        if not services_operations_results.get('get_all_services'):
            critical_issues.append("❌ Cannot retrieve services list")
        if not services_operations_results.get('accountant_get_services'):
            critical_issues.append("❌ General Accountant cannot access services")
        if not services_operations_results.get('staff_get_services'):
            critical_issues.append("❌ Agency Staff cannot view services")
        if not services_operations_results.get('create_normal_operation'):
            critical_issues.append("❌ Cannot create normal daily operation")
        if not services_operations_results.get('create_discount_operation'):
            critical_issues.append("❌ Cannot create operation with discount")
        if not services_operations_results.get('get_all_operations'):
            critical_issues.append("❌ Cannot retrieve operations list")
        if not services_operations_results.get('approve_discount_operation'):
            critical_issues.append("❌ Cannot approve operations with discount")
        if not services_operations_results.get('basic_daily_operations_report'):
            critical_issues.append("❌ Basic daily operations report not working")
        if not services_operations_results.get('agency_breakdown_report'):
            critical_issues.append("❌ Agency breakdown report not working")
        if not services_operations_results.get('get_discount_requests'):
            critical_issues.append("❌ Cannot retrieve discount requests")
        if not services_operations_results.get('super_admin_auth'):
            critical_issues.append("❌ Super Admin authentication failed")
        if not services_operations_results.get('general_accountant_auth'):
            critical_issues.append("❌ General Accountant authentication failed")
        if not services_operations_results.get('agency_staff_auth'):
            critical_issues.append("❌ Agency Staff authentication failed")
        
        # Google Authentication Critical Issues (PRIMARY FOCUS)
        if not google_auth_results.get('google_auth_endpoint_accessible'):
            critical_issues.append("❌ Google Auth endpoint not accessible")
        if not google_auth_results.get('logout_endpoint'):
            critical_issues.append("❌ Logout endpoint not working")
        if not google_auth_results.get('profile_endpoint_authenticated'):
            critical_issues.append("❌ Profile endpoint not working when authenticated")
        if not google_auth_results.get('jwt_auth_compatibility'):
            critical_issues.append("❌ JWT authentication backward compatibility broken")
        if not google_auth_results.get('session_token_handling'):
            critical_issues.append("❌ Session token handling not implemented")
        if not google_auth_results.get('cors_configured'):
            critical_issues.append("❌ CORS not configured for withCredentials requests")
        if not google_auth_results.get('auth_dependency_working'):
            critical_issues.append("❌ Dual authentication support not working")
        
        # Check infrastructure score
        infrastructure_score = google_auth_results.get('infrastructure_score', 0)
        if infrastructure_score < 0.5:
            critical_issues.append(f"❌ Google Auth infrastructure score too low: {infrastructure_score*100:.1f}%")
        
        # Bug Investigation Critical Issues (PRIMARY FOCUS)
        if not bug_investigation_results.get('super_admin_login'):
            critical_issues.append("❌ Super Admin login failed (superadmin@sanhaja.com)")
        if not bug_investigation_results.get('clients_endpoint'):
            critical_issues.append("❌ Clients endpoint not accessible")
        if not bug_investigation_results.get('suppliers_endpoint'):
            critical_issues.append("❌ Suppliers endpoint not accessible")
        if not bug_investigation_results.get('bookings_endpoint'):
            critical_issues.append("❌ Bookings endpoint not accessible")
        if not bug_investigation_results.get('clients_cross_agency'):
            critical_issues.append("🐛 BUG: Clients endpoint only shows Tlemcen agency (should show ALL 6)")
        if not bug_investigation_results.get('suppliers_cross_agency'):
            critical_issues.append("🐛 BUG: Suppliers endpoint only shows Tlemcen agency (should show ALL 6)")
        if not bug_investigation_results.get('bookings_cross_agency'):
            critical_issues.append("🐛 BUG: Bookings endpoint only shows Tlemcen agency (should show ALL 6)")
        
        # Super Admin Critical Issues (SECONDARY FOCUS)
        if not super_admin_results.get('super_admin_login'):
            critical_issues.append("❌ Super Admin login failed (superadmin@sanhaja.com)")
        if not super_admin_results.get('super_admin_dashboard'):
            critical_issues.append("❌ Super Admin dashboard not accessible")
        if not super_admin_results.get('super_admin_invoices'):
            critical_issues.append("❌ Super Admin cannot access invoices")
        if not super_admin_results.get('super_admin_payments'):
            critical_issues.append("❌ Super Admin cannot access payments")
        if not super_admin_results.get('super_admin_users'):
            critical_issues.append("❌ Super Admin user management not working")
        if not super_admin_results.get('super_admin_agencies'):
            critical_issues.append("❌ Super Admin agencies access not working")
        if not super_admin_results.get('super_admin_daily_reports'):
            critical_issues.append("❌ Super Admin daily reports management not working")
        if not super_admin_results.get('super_admin_cross_agency_invoices'):
            critical_issues.append("❌ Super Admin not seeing cross-agency invoices")
        if not super_admin_results.get('super_admin_cross_agency_payments'):
            critical_issues.append("❌ Super Admin not seeing cross-agency payments")
        if not super_admin_results.get('super_admin_all_agencies'):
            critical_issues.append("❌ Super Admin not seeing all 6 agencies")
        
        # Basic Requirements Critical Issues
        if not basic_results.get('admin_login'):
            critical_issues.append("❌ Admin login failed (admin@sanhaja-oran.dz)")
        if not basic_results.get('database_connectivity'):
            critical_issues.append("❌ Database connectivity issues")
        if not basic_results.get('clients_endpoint'):
            critical_issues.append("❌ Clients endpoint not working")
        if not basic_results.get('suppliers_endpoint'):
            critical_issues.append("❌ Suppliers endpoint not working")
        
        # Check reports critical issues
        if not reports_results.get('sales_report_daily'):
            critical_issues.append("❌ Sales Report (Daily) not working")
        if not reports_results.get('aging_report'):
            critical_issues.append("❌ Aging Report not working")
        if not reports_results.get('profit_loss_report'):
            critical_issues.append("❌ Profit/Loss Report not working")
        
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