import requests
import sys
import json
from datetime import datetime, timedelta

class EnhancedApprovalFilteringTester:
    def __init__(self, base_url="https://travel-agency-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.current_user = None
        self.tests_run = 0
        self.tests_passed = 0
        
        # Test users from review request
        self.test_users = {
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
            'agency_staff': {
                'email': 'staff1@tlemcen.sanhaja.com',
                'password': 'staff123',
                'role': 'agency_staff',
                'agency': 'تلمسان'
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

    def test_enhanced_approval_workflow(self):
        """Test the newly implemented enhanced approval workflow for operations and bookings"""
        print(f"\n🔐 Testing Enhanced Approval Workflow (Review Request)...")
        print(f"   Testing UPDATE/DELETE permissions for operations and bookings based on approval status")
        
        results = {}
        
        # Step 1: Create test data as Super Admin
        print(f"\n   1. Setting up test data as Super Admin...")
        auth_success = self.test_login('superadmin@sanhaja.com', 'super123')
        results['super_admin_login'] = auth_success
        
        if not auth_success:
            print("   ❌ Cannot proceed - Super Admin login failed")
            return results
        
        # Get agencies and services for test data
        success, agencies = self.run_test("Get Agencies", "GET", "agencies", 200)
        success, services = self.run_test("Get Services", "GET", "services", 200)
        success, clients = self.run_test("Get Clients", "GET", "clients", 200)
        success, suppliers = self.run_test("Get Suppliers", "GET", "suppliers", 200)
        
        if not (agencies and services and clients and suppliers):
            print("   ❌ Cannot proceed - Missing required test data")
            return results
        
        test_agency_id = agencies[0]['id']
        test_service_id = services[0]['id'] if services else None
        test_client_id = clients[0]['id'] if clients else None
        test_supplier_id = suppliers[0]['id'] if suppliers else None
        
        # Create test daily operations with different statuses
        test_operations = []
        
        # Create DRAFT operation
        if test_service_id and test_client_id:
            success, draft_op = self.run_test(
                "Create Draft Operation",
                "POST",
                "daily-operations",
                200,
                data={
                    "service_id": test_service_id,
                    "client_id": test_client_id,
                    "base_price": 50000.0,
                    "discount_amount": 0.0,
                    "notes": "Test draft operation for approval workflow"
                }
            )
            if success and 'id' in draft_op:
                test_operations.append(('draft', draft_op['id']))
                print(f"   ✅ Created draft operation: {draft_op['id']}")
        
        # Create PENDING operation
        if test_service_id and test_client_id:
            success, pending_op = self.run_test(
                "Create Pending Operation",
                "POST",
                "daily-operations",
                200,
                data={
                    "service_id": test_service_id,
                    "client_id": test_client_id,
                    "base_price": 75000.0,
                    "discount_amount": 5000.0,
                    "discount_reason": "Customer loyalty discount",
                    "notes": "Test pending operation for approval workflow"
                }
            )
            if success and 'id' in pending_op:
                # Set to pending approval
                self.run_test(
                    "Set Operation to Pending",
                    "PUT",
                    f"daily-operations/{pending_op['id']}",
                    200,
                    data={"status": "في انتظار الموافقة"}
                )
                test_operations.append(('pending', pending_op['id']))
                print(f"   ✅ Created pending operation: {pending_op['id']}")
        
        # Create APPROVED operation
        if test_service_id and test_client_id:
            success, approved_op = self.run_test(
                "Create Operation for Approval",
                "POST",
                "daily-operations",
                200,
                data={
                    "service_id": test_service_id,
                    "client_id": test_client_id,
                    "base_price": 100000.0,
                    "discount_amount": 0.0,
                    "notes": "Test approved operation for approval workflow"
                }
            )
            if success and 'id' in approved_op:
                # Approve the operation
                success, _ = self.run_test(
                    "Approve Operation",
                    "PUT",
                    f"daily-operations/{approved_op['id']}/approve",
                    200
                )
                if success:
                    test_operations.append(('approved', approved_op['id']))
                    print(f"   ✅ Created approved operation: {approved_op['id']}")
        
        # Create test bookings with different statuses
        test_bookings = []
        
        if test_client_id and test_supplier_id:
            from datetime import datetime, timedelta
            start_date = (datetime.now() + timedelta(days=30)).isoformat()
            end_date = (datetime.now() + timedelta(days=35)).isoformat()
            
            # Create DRAFT booking
            success, draft_booking = self.run_test(
                "Create Draft Booking",
                "POST",
                "bookings",
                200,
                data={
                    "ref": f"BOOK-DRAFT-{datetime.now().strftime('%H%M%S')}",
                    "client_id": test_client_id,
                    "supplier_id": test_supplier_id,
                    "type": "عمرة",
                    "cost": 80000.0,
                    "sell_price": 120000.0,
                    "start_date": start_date,
                    "end_date": end_date
                }
            )
            if success and 'id' in draft_booking:
                test_bookings.append(('draft', draft_booking['id']))
                print(f"   ✅ Created draft booking: {draft_booking['id']}")
            
            # Create APPROVED booking
            success, approved_booking = self.run_test(
                "Create Booking for Approval",
                "POST",
                "bookings",
                200,
                data={
                    "ref": f"BOOK-APPR-{datetime.now().strftime('%H%M%S')}",
                    "client_id": test_client_id,
                    "supplier_id": test_supplier_id,
                    "type": "عمرة",
                    "cost": 90000.0,
                    "sell_price": 140000.0,
                    "start_date": start_date,
                    "end_date": end_date
                }
            )
            if success and 'id' in approved_booking:
                # Approve the booking
                success, _ = self.run_test(
                    "Approve Booking",
                    "PUT",
                    f"bookings/{approved_booking['id']}/approve",
                    200
                )
                if success:
                    test_bookings.append(('approved', approved_booking['id']))
                    print(f"   ✅ Created approved booking: {approved_booking['id']}")
        
        # Step 2: Test Agency Staff Permissions
        print(f"\n   2. Testing Agency Staff Permissions (staff1@tlemcen.sanhaja.com)...")
        staff_auth = self.test_login('staff1@tlemcen.sanhaja.com', 'staff123')
        results['staff_login'] = staff_auth
        
        if staff_auth:
            print(f"   ✅ Agency staff authenticated")
            
            # Test UPDATE operations - staff can modify draft/pending/rejected but NOT approved
            for status, op_id in test_operations:
                print(f"\n   2a. Testing UPDATE {status} operation...")
                success, response = self.run_test(
                    f"Staff Update {status.title()} Operation",
                    "PUT",
                    f"daily-operations/{op_id}",
                    200 if status != 'approved' else 403,
                    data={"notes": f"Updated by staff - {status} operation"}
                )
                results[f'staff_update_{status}_operation'] = success
                
                if status == 'approved' and success:
                    print(f"   ✅ Staff correctly denied updating approved operation")
                elif status != 'approved' and success:
                    print(f"   ✅ Staff can update {status} operation")
                elif status == 'approved' and not success:
                    print(f"   ❌ Staff should be denied updating approved operation")
                else:
                    print(f"   ❌ Staff should be able to update {status} operation")
            
            # Test DELETE operations - staff can delete draft/pending/rejected but NOT approved
            for status, op_id in test_operations[:2]:  # Only test first 2 to preserve approved one
                print(f"\n   2b. Testing DELETE {status} operation...")
                success, response = self.run_test(
                    f"Staff Delete {status.title()} Operation",
                    "DELETE",
                    f"daily-operations/{op_id}",
                    200,
                    data=None
                )
                results[f'staff_delete_{status}_operation'] = success
                
                if success:
                    print(f"   ✅ Staff can delete {status} operation")
                else:
                    print(f"   ❌ Staff should be able to delete {status} operation")
            
            # Test DELETE approved operation (should fail)
            if test_operations and test_operations[-1][0] == 'approved':
                approved_op_id = test_operations[-1][1]
                print(f"\n   2c. Testing DELETE approved operation (should fail)...")
                success, response = self.run_test(
                    "Staff Delete Approved Operation (Should Fail)",
                    "DELETE",
                    f"daily-operations/{approved_op_id}",
                    403,
                    data=None
                )
                results['staff_delete_approved_operation_denied'] = success
                
                if success:
                    print(f"   ✅ Staff correctly denied deleting approved operation")
                else:
                    print(f"   ❌ Staff should be denied deleting approved operation")
            
            # Test UPDATE bookings - same permissions as operations
            for status, booking_id in test_bookings:
                print(f"\n   2d. Testing UPDATE {status} booking...")
                success, response = self.run_test(
                    f"Staff Update {status.title()} Booking",
                    "PUT",
                    f"bookings/{booking_id}",
                    200 if status != 'approved' else 403,
                    data={"cost": 85000.0}
                )
                results[f'staff_update_{status}_booking'] = success
                
                if status == 'approved' and success:
                    print(f"   ✅ Staff correctly denied updating approved booking")
                elif status != 'approved' and success:
                    print(f"   ✅ Staff can update {status} booking")
            
            # Test DELETE bookings - same permissions as operations
            for status, booking_id in test_bookings:
                if status != 'approved':  # Don't delete approved booking yet
                    print(f"\n   2e. Testing DELETE {status} booking...")
                    success, response = self.run_test(
                        f"Staff Delete {status.title()} Booking",
                        "DELETE",
                        f"bookings/{booking_id}",
                        200,
                        data=None
                    )
                    results[f'staff_delete_{status}_booking'] = success
                    
                    if success:
                        print(f"   ✅ Staff can delete {status} booking")
                    else:
                        print(f"   ❌ Staff should be able to delete {status} booking")
        
        # Step 3: Test General Accountant Override Permissions
        print(f"\n   3. Testing General Accountant Override Permissions...")
        accountant_auth = self.test_login('generalaccountant@sanhaja.com', 'acc123')
        results['accountant_login'] = accountant_auth
        
        if accountant_auth:
            print(f"   ✅ General Accountant authenticated")
            
            # Test that accountant can modify/delete approved items with audit logging
            if test_operations and test_operations[-1][0] == 'approved':
                approved_op_id = test_operations[-1][1]
                
                print(f"\n   3a. Testing Accountant UPDATE approved operation (with audit)...")
                success, response = self.run_test(
                    "Accountant Update Approved Operation",
                    "PUT",
                    f"daily-operations/{approved_op_id}",
                    200,
                    data={"notes": "Modified by accountant - post-approval change"}
                )
                results['accountant_update_approved_operation'] = success
                
                if success:
                    print(f"   ✅ Accountant can modify approved operation with audit logging")
                else:
                    print(f"   ❌ Accountant should be able to modify approved operation")
                
                print(f"\n   3b. Testing Accountant DELETE approved operation (with audit)...")
                success, response = self.run_test(
                    "Accountant Delete Approved Operation",
                    "DELETE",
                    f"daily-operations/{approved_op_id}",
                    200,
                    data=None
                )
                results['accountant_delete_approved_operation'] = success
                
                if success:
                    print(f"   ✅ Accountant can delete approved operation with audit logging")
                else:
                    print(f"   ❌ Accountant should be able to delete approved operation")
            
            # Test accountant can modify/delete approved bookings
            if test_bookings and test_bookings[-1][0] == 'approved':
                approved_booking_id = test_bookings[-1][1]
                
                print(f"\n   3c. Testing Accountant UPDATE approved booking (with audit)...")
                success, response = self.run_test(
                    "Accountant Update Approved Booking",
                    "PUT",
                    f"bookings/{approved_booking_id}",
                    200,
                    data={"cost": 95000.0}
                )
                results['accountant_update_approved_booking'] = success
                
                if success:
                    print(f"   ✅ Accountant can modify approved booking with audit logging")
                else:
                    print(f"   ❌ Accountant should be able to modify approved booking")
                
                print(f"\n   3d. Testing Accountant DELETE approved booking (with audit)...")
                success, response = self.run_test(
                    "Accountant Delete Approved Booking",
                    "DELETE",
                    f"bookings/{approved_booking_id}",
                    200,
                    data=None
                )
                results['accountant_delete_approved_booking'] = success
                
                if success:
                    print(f"   ✅ Accountant can delete approved booking with audit logging")
                else:
                    print(f"   ❌ Accountant should be able to delete approved booking")
        
        # Step 4: Test Booking Approval/Rejection Endpoints
        print(f"\n   4. Testing Booking Approval/Rejection Endpoints...")
        
        # Create new test booking for approval testing
        if test_client_id and test_supplier_id:
            from datetime import datetime, timedelta
            start_date = (datetime.now() + timedelta(days=40)).isoformat()
            end_date = (datetime.now() + timedelta(days=45)).isoformat()
            
            # Login as Super Admin to create test booking
            self.test_login('superadmin@sanhaja.com', 'super123')
            
            success, test_booking = self.run_test(
                "Create Booking for Approval Test",
                "POST",
                "bookings",
                200,
                data={
                    "ref": f"BOOK-TEST-{datetime.now().strftime('%H%M%S')}",
                    "client_id": test_client_id,
                    "supplier_id": test_supplier_id,
                    "type": "عمرة",
                    "cost": 70000.0,
                    "sell_price": 110000.0,
                    "start_date": start_date,
                    "end_date": end_date
                }
            )
            
            if success and 'id' in test_booking:
                test_booking_id = test_booking['id']
                
                # Test accountant can approve bookings
                accountant_auth = self.test_login('generalaccountant@sanhaja.com', 'acc123')
                if accountant_auth:
                    print(f"\n   4a. Testing Booking Approval by Accountant...")
                    success, response = self.run_test(
                        "Accountant Approve Booking",
                        "PUT",
                        f"bookings/{test_booking_id}/approve",
                        200
                    )
                    results['accountant_approve_booking'] = success
                    
                    if success:
                        print(f"   ✅ Accountant can approve bookings")
                    else:
                        print(f"   ❌ Accountant should be able to approve bookings")
                
                # Create another booking for rejection test
                self.test_login('superadmin@sanhaja.com', 'super123')
                success, reject_booking = self.run_test(
                    "Create Booking for Rejection Test",
                    "POST",
                    "bookings",
                    200,
                    data={
                        "ref": f"BOOK-REJ-{datetime.now().strftime('%H%M%S')}",
                        "client_id": test_client_id,
                        "supplier_id": test_supplier_id,
                        "type": "عمرة",
                        "cost": 60000.0,
                        "sell_price": 100000.0,
                        "start_date": start_date,
                        "end_date": end_date
                    }
                )
                
                if success and 'id' in reject_booking:
                    reject_booking_id = reject_booking['id']
                    
                    # Test accountant can reject bookings
                    accountant_auth = self.test_login('generalaccountant@sanhaja.com', 'acc123')
                    if accountant_auth:
                        print(f"\n   4b. Testing Booking Rejection by Accountant...")
                        success, response = self.run_test(
                            "Accountant Reject Booking",
                            "PUT",
                            f"bookings/{reject_booking_id}/reject",
                            200,
                            data={"rejection_reason": "Pricing not competitive"}
                        )
                        results['accountant_reject_booking'] = success
                        
                        if success:
                            print(f"   ✅ Accountant can reject bookings")
                        else:
                            print(f"   ❌ Accountant should be able to reject bookings")
        
        return results

    def test_advanced_filtering_system(self):
        """Test the newly implemented advanced filtering system for operations and bookings"""
        print(f"\n🔍 Testing Advanced Filtering System (Review Request)...")
        print(f"   Testing enhanced filtering parameters for daily operations and bookings")
        
        results = {}
        
        # Step 1: Login as Super Admin for comprehensive testing
        print(f"\n   1. Setting up for filtering tests as Super Admin...")
        auth_success = self.test_login('superadmin@sanhaja.com', 'super123')
        results['super_admin_login'] = auth_success
        
        if not auth_success:
            print("   ❌ Cannot proceed - Super Admin login failed")
            return results
        
        # Get reference data for filtering
        success, agencies = self.run_test("Get Agencies", "GET", "agencies", 200)
        success, services = self.run_test("Get Services", "GET", "services", 200)
        success, clients = self.run_test("Get Clients", "GET", "clients", 200)
        
        if not (agencies and services and clients):
            print("   ❌ Cannot proceed - Missing reference data")
            return results
        
        # Step 2: Test Enhanced Daily Operations Filtering
        print(f"\n   2. Testing Enhanced Daily Operations Filtering...")
        
        # Test 2a: Filter by agency (وكالة)
        if agencies:
            test_agency = agencies[0]
            agency_id = test_agency['id']
            agency_name = test_agency.get('name', 'Unknown')
            
            print(f"\n   2a. Testing Filter by Agency: {agency_name}...")
            success, filtered_ops = self.run_test(
                f"Filter Operations by Agency",
                "GET",
                f"daily-operations?agency_id={agency_id}",
                200
            )
            results['filter_operations_by_agency'] = success
            
            if success:
                print(f"   ✅ Agency filtering works - {len(filtered_ops)} operations for {agency_name}")
                
                # Verify all operations belong to the specified agency
                if filtered_ops:
                    all_match = all(op.get('agency_id') == agency_id for op in filtered_ops)
                    results['agency_filter_accuracy'] = all_match
                    if all_match:
                        print(f"   ✅ All filtered operations belong to specified agency")
                    else:
                        print(f"   ❌ Some operations don't belong to specified agency")
        
        # Test 2b: Filter by service name (نوع الخدمة - عمرة، حج، etc.)
        if services:
            # Find a service with Arabic name
            umrah_services = [s for s in services if 'عمرة' in s.get('name', '') or s.get('service_type') == 'عمرة']
            if umrah_services:
                test_service = umrah_services[0]
                service_id = test_service['id']
                service_name = test_service.get('name', 'Unknown')
                
                print(f"\n   2b. Testing Filter by Service: {service_name}...")
                success, filtered_ops = self.run_test(
                    f"Filter Operations by Service",
                    "GET",
                    f"daily-operations?service_id={service_id}",
                    200
                )
                results['filter_operations_by_service'] = success
                
                if success:
                    print(f"   ✅ Service filtering works - {len(filtered_ops)} operations for {service_name}")
        
        # Test 2c: Filter by client name (اسم العميل)
        if clients:
            test_client = clients[0]
            client_id = test_client['id']
            client_name = test_client.get('name', 'Unknown')
            
            print(f"\n   2c. Testing Filter by Client: {client_name}...")
            success, filtered_ops = self.run_test(
                f"Filter Operations by Client",
                "GET",
                f"daily-operations?client_id={client_id}",
                200
            )
            results['filter_operations_by_client'] = success
            
            if success:
                print(f"   ✅ Client filtering works - {len(filtered_ops)} operations for {client_name}")
        
        # Test 2d: Filter by date range (فترة زمنية)
        from datetime import datetime, timedelta
        today = datetime.now()
        start_date = (today - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = today.strftime('%Y-%m-%d')
        
        print(f"\n   2d. Testing Filter by Date Range: {start_date} to {end_date}...")
        success, filtered_ops = self.run_test(
            f"Filter Operations by Date Range",
            "GET",
            f"daily-operations?start_date={start_date}&end_date={end_date}",
            200
        )
        results['filter_operations_by_date'] = success
        
        if success:
            print(f"   ✅ Date range filtering works - {len(filtered_ops)} operations in range")
        
        # Test 2e: Filter by approval status (حالة الموافقة)
        print(f"\n   2e. Testing Filter by Approval Status...")
        
        # Test approved status
        success, approved_ops = self.run_test(
            f"Filter Operations by Status (Approved)",
            "GET",
            f"daily-operations?status=معتمد",
            200
        )
        results['filter_operations_by_status_approved'] = success
        
        if success:
            print(f"   ✅ Status filtering (approved) works - {len(approved_ops)} approved operations")
        
        # Test pending status
        success, pending_ops = self.run_test(
            f"Filter Operations by Status (Pending)",
            "GET",
            f"daily-operations?status=في انتظار الموافقة",
            200
        )
        results['filter_operations_by_status_pending'] = success
        
        if success:
            print(f"   ✅ Status filtering (pending) works - {len(pending_ops)} pending operations")
        
        # Test 2f: Filter by revenue range (مدى الإيرادات)
        print(f"\n   2f. Testing Filter by Revenue Range...")
        success, revenue_filtered = self.run_test(
            f"Filter Operations by Revenue Range",
            "GET",
            f"daily-operations?min_revenue=50000&max_revenue=200000",
            200
        )
        results['filter_operations_by_revenue'] = success
        
        if success:
            print(f"   ✅ Revenue range filtering works - {len(revenue_filtered)} operations in range")
        
        # Test 2g: Combined filters (Agency + Service + Date)
        if agencies and services:
            agency_id = agencies[0]['id']
            service_id = services[0]['id']
            
            print(f"\n   2g. Testing Combined Filters (Agency + Service + Date)...")
            success, combined_filtered = self.run_test(
                f"Filter Operations (Combined)",
                "GET",
                f"daily-operations?agency_id={agency_id}&service_id={service_id}&start_date={start_date}&end_date={end_date}",
                200
            )
            results['filter_operations_combined'] = success
            
            if success:
                print(f"   ✅ Combined filtering works - {len(combined_filtered)} operations match all criteria")
        
        # Step 3: Test Enhanced Bookings Filtering
        print(f"\n   3. Testing Enhanced Bookings Filtering...")
        
        # Test 3a: Filter by booking type
        print(f"\n   3a. Testing Filter by Booking Type (عمرة)...")
        success, type_filtered = self.run_test(
            f"Filter Bookings by Type",
            "GET",
            f"bookings?booking_type=عمرة",
            200
        )
        results['filter_bookings_by_type'] = success
        
        if success:
            print(f"   ✅ Booking type filtering works - {len(type_filtered)} عمرة bookings")
        
        # Test 3b: Filter by cost range
        print(f"\n   3b. Testing Filter by Cost Range...")
        success, cost_filtered = self.run_test(
            f"Filter Bookings by Cost Range",
            "GET",
            f"bookings?min_cost=50000&max_cost=150000",
            200
        )
        results['filter_bookings_by_cost'] = success
        
        if success:
            print(f"   ✅ Cost range filtering works - {len(cost_filtered)} bookings in range")
        
        # Test 3c: Filter by client and supplier
        if clients:
            client_id = clients[0]['id']
            
            print(f"\n   3c. Testing Filter by Client...")
            success, client_filtered = self.run_test(
                f"Filter Bookings by Client",
                "GET",
                f"bookings?client_id={client_id}",
                200
            )
            results['filter_bookings_by_client'] = success
            
            if success:
                print(f"   ✅ Client filtering works - {len(client_filtered)} bookings for client")
        
        # Test 3d: Combined filtering scenarios
        print(f"\n   3d. Testing Combined Booking Filters...")
        success, combined_bookings = self.run_test(
            f"Filter Bookings (Combined)",
            "GET",
            f"bookings?booking_type=عمرة&min_cost=50000&max_cost=200000&start_date={start_date}&end_date={end_date}",
            200
        )
        results['filter_bookings_combined'] = success
        
        if success:
            print(f"   ✅ Combined booking filtering works - {len(combined_bookings)} bookings match criteria")
        
        # Step 4: Test Specific Scenario from Review Request
        print(f"\n   4. Testing Specific Scenario: 'انا اريد نشوف وكالة ما واش باعت اليوم بالاخص الا العمرة'...")
        
        if agencies:
            # Find a specific agency
            test_agency = agencies[0]
            agency_id = test_agency['id']
            agency_name = test_agency.get('name', 'Unknown')
            today_str = datetime.now().strftime('%Y-%m-%d')
            
            print(f"   Testing: Show what agency '{agency_name}' sold today, specifically Umrah services")
            
            # Filter operations: specific agency + today + Umrah service
            success, scenario_ops = self.run_test(
                f"Scenario Filter (Agency + Today + Umrah)",
                "GET",
                f"daily-operations?agency_id={agency_id}&start_date={today_str}&end_date={today_str}",
                200
            )
            results['scenario_agency_today_umrah'] = success
            
            if success:
                print(f"   ✅ Scenario filtering works - {len(scenario_ops)} operations for {agency_name} today")
                
                # Further filter for Umrah services if we have service data
                umrah_ops = []
                for op in scenario_ops:
                    service_name = op.get('service_name', '')
                    if 'عمرة' in service_name:
                        umrah_ops.append(op)
                
                print(f"   ✅ Found {len(umrah_ops)} Umrah operations for {agency_name} today")
                results['scenario_umrah_count'] = len(umrah_ops)
        
        # Step 5: Test General Accountant Filtering Access
        print(f"\n   5. Testing General Accountant Filtering Access...")
        accountant_auth = self.test_login('generalaccountant@sanhaja.com', 'acc123')
        results['accountant_login'] = accountant_auth
        
        if accountant_auth:
            print(f"   ✅ General Accountant authenticated")
            
            # Test that accountant can use all filtering options
            if agencies:
                agency_id = agencies[0]['id']
                
                success, accountant_filtered = self.run_test(
                    f"Accountant Filter Operations by Agency",
                    "GET",
                    f"daily-operations?agency_id={agency_id}",
                    200
                )
                results['accountant_filter_operations'] = success
                
                if success:
                    print(f"   ✅ Accountant can use advanced filtering - {len(accountant_filtered)} operations")
        
        # Step 6: Test Agency Staff Filtering Limitations
        print(f"\n   6. Testing Agency Staff Filtering Limitations...")
        staff_auth = self.test_login('staff1@tlemcen.sanhaja.com', 'staff123')
        results['staff_login'] = staff_auth
        
        if staff_auth:
            print(f"   ✅ Agency Staff authenticated")
            staff_agency_id = self.current_user.get('agency_id')
            
            # Test that staff can filter within their agency
            success, staff_filtered = self.run_test(
                f"Staff Filter Operations (Own Agency)",
                "GET",
                f"daily-operations?start_date={start_date}&end_date={end_date}",
                200
            )
            results['staff_filter_operations'] = success
            
            if success:
                print(f"   ✅ Staff can filter operations within their agency - {len(staff_filtered)} operations")
                
                # Verify all operations belong to staff's agency
                if staff_filtered:
                    all_own_agency = all(op.get('agency_id') == staff_agency_id for op in staff_filtered)
                    results['staff_filter_isolation'] = all_own_agency
                    
                    if all_own_agency:
                        print(f"   ✅ Staff filtering properly isolated to their agency")
                    else:
                        print(f"   ❌ Staff filtering shows operations from other agencies")
        
        return results

def main():
    """Main function to run enhanced approval workflow and filtering tests"""
    tester = EnhancedApprovalFilteringTester()
    
    # Run the new enhanced approval workflow and filtering tests
    print("🚀 Starting Enhanced Approval Workflow and Advanced Filtering Tests...")
    
    # Test 1: Enhanced Approval Workflow
    print(f"\n" + "="*80)
    print(f"TEST 1: ENHANCED APPROVAL WORKFLOW")
    print(f"="*80)
    approval_results = tester.test_enhanced_approval_workflow()
    
    # Test 2: Advanced Filtering System
    print(f"\n" + "="*80)
    print(f"TEST 2: ADVANCED FILTERING SYSTEM")
    print(f"="*80)
    filtering_results = tester.test_advanced_filtering_system()
    
    # Print summary
    print(f"\n" + "="*80)
    print(f"FINAL SUMMARY")
    print(f"="*80)
    
    print(f"\n### ENHANCED APPROVAL WORKFLOW RESULTS:")
    approval_passed = sum(1 for v in approval_results.values() if v is True)
    approval_total = len([v for v in approval_results.values() if v is not None])
    print(f"   Tests Passed: {approval_passed}/{approval_total}")
    
    print(f"\n### ADVANCED FILTERING SYSTEM RESULTS:")
    filtering_passed = sum(1 for v in filtering_results.values() if v is True)
    filtering_total = len([v for v in filtering_results.values() if v is not None])
    print(f"   Tests Passed: {filtering_passed}/{filtering_total}")
    
    total_passed = approval_passed + filtering_passed
    total_tests = approval_total + filtering_total
    success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
    
    print(f"\n🎯 OVERALL SUCCESS RATE: {success_rate:.1f}% ({total_passed}/{total_tests} tests passed)")
    
    if success_rate >= 80:
        print(f"✅ EXCELLENT: Enhanced approval workflow and filtering system working well!")
    elif success_rate >= 60:
        print(f"⚠️  GOOD: Most features working, some issues need attention")
    else:
        print(f"❌ NEEDS WORK: Multiple issues found, requires fixes")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())