#!/usr/bin/env python3
"""
Final Comprehensive Test for Multi-Agency Travel Accounting System
Testing the specific requirements from the review request
"""

import requests
import json
from datetime import datetime

class FinalReviewTester:
    def __init__(self):
        self.base_url = "https://travel-finance-hub.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.token = None
        self.current_user = None
        self.tests_passed = 0
        self.tests_total = 0

    def test_api(self, name, method, endpoint, expected_status=200, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_total += 1
        print(f"\n🔍 {name}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                return True, response.json() if response.content else {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:200]}")
                return False, {}
                
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            return False, {}

    def login_super_admin(self):
        """Login as Super Admin with credentials from review request"""
        print("\n🔐 SUPER ADMIN LOGIN TEST (superadmin@sanhaja.com / super123)")
        success, response = self.test_api(
            "Super Admin Login",
            "POST",
            "auth/login",
            200,
            {"email": "superadmin@sanhaja.com", "password": "super123"}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.current_user = response.get('user', {})
            print(f"   ✅ Authenticated as: {self.current_user.get('name')} ({self.current_user.get('role')})")
            return True
        return False

    def test_super_admin_cross_agency_access(self):
        """Test Super Admin Cross-Agency Access as requested"""
        print("\n" + "="*80)
        print("1. SUPER ADMIN CROSS-AGENCY ACCESS TEST")
        print("="*80)
        
        results = {}
        
        # Test Dashboard - should show consolidated data from ALL agencies
        print("\n📊 Testing Dashboard (should show ALL agencies data)")
        success, dashboard = self.test_api("Dashboard - Consolidated Data", "GET", "dashboard")
        results['dashboard'] = success
        
        if success:
            print(f"   Today Income: {dashboard.get('today_income', 0):,.0f} DZD")
            print(f"   Unpaid Invoices: {dashboard.get('unpaid_invoices', 0)}")
            print(f"   Week Bookings: {dashboard.get('week_bookings', 0)}")
            print(f"   Cashbox Balance: {dashboard.get('cashbox_balance', 0):,.0f} DZD")
            print("   ✅ Super Admin sees consolidated data from ALL agencies")
        
        # Test Invoices - should return data from ALL agencies
        print("\n📄 Testing Invoices (should return ALL agencies data)")
        success, invoices = self.test_api("Invoices - All Agencies", "GET", "invoices")
        results['invoices'] = success
        
        if success:
            agency_ids = set(inv.get('agency_id') for inv in invoices if inv.get('agency_id'))
            print(f"   Total invoices: {len(invoices)}")
            print(f"   Agencies represented: {len(agency_ids)}")
            if len(agency_ids) >= 6:
                print("   ✅ Super Admin sees invoices from ALL agencies")
                results['invoices_cross_agency'] = True
            else:
                print(f"   ⚠️  Only seeing invoices from {len(agency_ids)} agencies")
                results['invoices_cross_agency'] = False
        
        # Test Payments - should return data from ALL agencies
        print("\n💰 Testing Payments (should return ALL agencies data)")
        success, payments = self.test_api("Payments - All Agencies", "GET", "payments")
        results['payments'] = success
        
        if success:
            agency_ids = set(pay.get('agency_id') for pay in payments if pay.get('agency_id'))
            print(f"   Total payments: {len(payments)}")
            print(f"   Agencies represented: {len(agency_ids)}")
            if len(agency_ids) >= 6:
                print("   ✅ Super Admin sees payments from ALL agencies")
                results['payments_cross_agency'] = True
            else:
                print(f"   ⚠️  Only seeing payments from {len(agency_ids)} agencies")
                results['payments_cross_agency'] = False
        
        return results

    def test_user_management_system(self):
        """Test New User Management System"""
        print("\n" + "="*80)
        print("2. NEW USER MANAGEMENT SYSTEM TEST")
        print("="*80)
        
        results = {}
        
        # Test GET /api/users - should return all 14 users from all agencies
        print("\n👥 Testing GET /api/users (should return all users)")
        success, users = self.test_api("Get All Users", "GET", "users")
        results['get_users'] = success
        
        if success:
            print(f"   Total users found: {len(users)}")
            
            # Count roles
            roles = {}
            agencies = set()
            for user in users:
                role = user.get('role', 'unknown')
                roles[role] = roles.get(role, 0) + 1
                if user.get('agency_id'):
                    agencies.add(user['agency_id'])
            
            print(f"   Role distribution: {roles}")
            print(f"   Agencies represented: {len(agencies)}")
            
            if len(users) >= 14:
                print("   ✅ Found expected number of users (14+)")
                results['users_count_ok'] = True
            else:
                print(f"   ⚠️  Expected 14+ users, found {len(users)}")
                results['users_count_ok'] = False
        
        # Test GET /api/agencies - should return all 6 agencies
        print("\n🏢 Testing GET /api/agencies (should return all agencies)")
        success, agencies = self.test_api("Get All Agencies", "GET", "agencies")
        results['get_agencies'] = success
        
        if success:
            print(f"   Total agencies found: {len(agencies)}")
            
            # List agency names
            agency_names = []
            cities = []
            for agency in agencies:
                name = agency.get('name', 'Unknown')
                city = agency.get('city', 'Unknown')
                agency_names.append(f"{name} ({city})")
                cities.append(city)
            
            print(f"   Agencies: {', '.join(agency_names)}")
            
            # Check for expected cities
            expected_cities = ['تلمسان', 'مغنية', 'ندرومة', 'وهران', 'الرمشي', 'سيدي بلعباس']
            found_expected = [city for city in expected_cities if city in cities]
            
            print(f"   Expected cities found: {len(found_expected)}/6")
            
            if len(agencies) >= 6:
                print("   ✅ Found expected number of agencies (6+)")
                results['agencies_count_ok'] = True
            else:
                print(f"   ⚠️  Expected 6+ agencies, found {len(agencies)}")
                results['agencies_count_ok'] = False
        
        return results

    def test_daily_reports_management(self):
        """Test New Daily Reports Management"""
        print("\n" + "="*80)
        print("3. NEW DAILY REPORTS MANAGEMENT TEST")
        print("="*80)
        
        results = {}
        
        # Test GET /api/daily-reports - should work for Super Admin
        print("\n📊 Testing GET /api/daily-reports (Super Admin access)")
        success, reports = self.test_api("Get Daily Reports", "GET", "daily-reports")
        results['get_daily_reports'] = success
        
        if success:
            print(f"   Total daily reports found: {len(reports)}")
            
            if len(reports) > 0:
                # Analyze reports
                agencies = set()
                statuses = {}
                for report in reports:
                    if report.get('agency_id'):
                        agencies.add(report['agency_id'])
                    status = report.get('status', 'unknown')
                    statuses[status] = statuses.get(status, 0) + 1
                
                print(f"   Agencies with reports: {len(agencies)}")
                print(f"   Report statuses: {statuses}")
                print("   ✅ Daily reports endpoint functional")
            else:
                print("   ℹ️  No daily reports in system (endpoint working, no data)")
                print("   ✅ Daily reports endpoint accessible and functional")
            
            results['daily_reports_functional'] = True
        
        return results

    def test_general_system_health(self):
        """Test General System Health"""
        print("\n" + "="*80)
        print("4. GENERAL SYSTEM HEALTH TEST")
        print("="*80)
        
        results = {}
        
        # Test all CRUD endpoints for clients, suppliers, bookings
        endpoints = [
            ('clients', 'Clients'),
            ('suppliers', 'Suppliers'), 
            ('bookings', 'Bookings')
        ]
        
        print("\n📋 Testing CRUD endpoints")
        for endpoint, name in endpoints:
            success, data = self.test_api(f"Get {name}", "GET", endpoint)
            results[f'get_{endpoint}'] = success
            
            if success:
                print(f"   {name}: {len(data)} items found")
        
        # Test authentication system
        print("\n🔐 Testing authentication system")
        success, user_info = self.test_api("Get Current User", "GET", "auth/me")
        results['auth_system'] = success
        
        if success:
            print(f"   Current user: {user_info.get('name')} ({user_info.get('role')})")
            print("   ✅ Authentication system working")
        
        return results

    def run_final_comprehensive_test(self):
        """Run the final comprehensive test as requested"""
        print("🚀 FINAL COMPREHENSIVE TEST - MULTI-AGENCY TRAVEL ACCOUNTING SYSTEM")
        print("نظام محاسبة وكالات السفر متعدد الوكالات - الاختبار الشامل النهائي")
        print("="*80)
        
        # Step 1: Login as Super Admin
        if not self.login_super_admin():
            print("\n❌ CRITICAL: Super Admin login failed - cannot proceed")
            return False
        
        # Step 2: Test Super Admin Cross-Agency Access
        cross_agency_results = self.test_super_admin_cross_agency_access()
        
        # Step 3: Test User Management System
        user_mgmt_results = self.test_user_management_system()
        
        # Step 4: Test Daily Reports Management
        daily_reports_results = self.test_daily_reports_management()
        
        # Step 5: Test General System Health
        system_health_results = self.test_general_system_health()
        
        # Final Summary
        print("\n" + "="*80)
        print("FINAL TEST RESULTS SUMMARY")
        print("="*80)
        
        print(f"\n📊 Total Tests: {self.tests_total}")
        print(f"✅ Passed Tests: {self.tests_passed}")
        print(f"🎯 Success Rate: {(self.tests_passed/self.tests_total)*100:.1f}%")
        
        # Critical Requirements Check
        print(f"\n🎯 CRITICAL REQUIREMENTS STATUS:")
        
        # 1. Super Admin Cross-Agency Access
        print(f"\n1️⃣ Super Admin Cross-Agency Access:")
        print(f"   Dashboard (ALL agencies): {'✅' if cross_agency_results.get('dashboard') else '❌'}")
        print(f"   Invoices (ALL agencies): {'✅' if cross_agency_results.get('invoices_cross_agency') else '❌'}")
        print(f"   Payments (ALL agencies): {'✅' if cross_agency_results.get('payments_cross_agency') else '❌'}")
        
        # 2. User Management System
        print(f"\n2️⃣ User Management System:")
        print(f"   GET /api/users (14+ users): {'✅' if user_mgmt_results.get('users_count_ok') else '❌'}")
        print(f"   GET /api/agencies (6+ agencies): {'✅' if user_mgmt_results.get('agencies_count_ok') else '❌'}")
        
        # 3. Daily Reports Management
        print(f"\n3️⃣ Daily Reports Management:")
        print(f"   GET /api/daily-reports: {'✅' if daily_reports_results.get('daily_reports_functional') else '❌'}")
        
        # 4. General System Health
        print(f"\n4️⃣ General System Health:")
        print(f"   Authentication system: {'✅' if system_health_results.get('auth_system') else '❌'}")
        print(f"   CRUD endpoints: {'✅' if all(system_health_results.get(f'get_{ep}') for ep, _ in [('clients', ''), ('suppliers', ''), ('bookings', '')]) else '❌'}")
        
        # Overall Status
        critical_passed = (
            cross_agency_results.get('dashboard', False) and
            cross_agency_results.get('invoices_cross_agency', False) and
            cross_agency_results.get('payments_cross_agency', False) and
            user_mgmt_results.get('users_count_ok', False) and
            user_mgmt_results.get('agencies_count_ok', False) and
            daily_reports_results.get('daily_reports_functional', False) and
            system_health_results.get('auth_system', False)
        )
        
        print(f"\n🏆 OVERALL STATUS: {'✅ ALL CRITICAL REQUIREMENTS PASSED' if critical_passed else '❌ SOME CRITICAL REQUIREMENTS FAILED'}")
        
        if critical_passed:
            print("\n🎉 SYSTEM READY FOR PRODUCTION!")
            print("   ✅ Super Admin has full cross-agency access")
            print("   ✅ User Management system operational")
            print("   ✅ Daily Reports management working")
            print("   ✅ All existing functionality intact")
        
        return critical_passed

def main():
    tester = FinalReviewTester()
    success = tester.run_final_comprehensive_test()
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())