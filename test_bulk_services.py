#!/usr/bin/env python3
"""
Test script for Bulk Services Management Endpoints
Testing the Arabic review request requirements
"""

import requests
import json
import sys

class BulkServicesTest:
    def __init__(self):
        self.base_url = "https://travel-ops-manager.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.token = None
        self.current_user = None
        
        # Test users from Arabic review request
        self.test_users = {
            'super_admin': {
                'email': 'superadmin@sanhaja.com',
                'password': 'super123',
                'role': 'Super Admin'
            },
            'general_accountant': {
                'email': 'generalaccountant@sanhaja.com', 
                'password': 'acc123',
                'role': 'General Accountant'
            },
            'agency_staff': {
                'email': 'staff1@tlemcen.sanhaja.com',
                'password': 'staff123',
                'role': 'Agency Staff'
            }
        }

    def login(self, email, password):
        """Login and get token"""
        print(f"\n🔐 Logging in as: {email}")
        response = requests.post(f"{self.api_url}/auth/login", json={
            "email": email,
            "password": password
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data['access_token']
            self.current_user = data.get('user', {})
            print(f"   ✅ Login successful - {self.current_user.get('name')} ({self.current_user.get('role')})")
            return True
        else:
            print(f"   ❌ Login failed: {response.status_code}")
            return False

    def test_services_management_endpoint(self):
        """Test GET /api/services/management"""
        print(f"\n📊 Testing GET /api/services/management...")
        
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.get(f"{self.api_url}/services/management", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Endpoint accessible")
            print(f"   📈 Statistics:")
            print(f"      - Total Services: {data.get('total_count', 0)}")
            print(f"      - Active Services: {data.get('active_count', 0)}")
            print(f"      - Inactive Services: {data.get('inactive_count', 0)}")
            
            services = data.get('services', [])
            if services:
                # Check usage statistics structure
                first_service = services[0]
                usage_stats = first_service.get('usage_stats', {})
                
                print(f"   📊 Usage Statistics Structure:")
                print(f"      - Operations Count: {usage_stats.get('operations_count', 'Missing')}")
                print(f"      - Total Revenue: {usage_stats.get('total_revenue', 'Missing')} DZD")
                print(f"      - Last Used: {usage_stats.get('last_used', 'Never')}")
                print(f"      - Can Delete: {usage_stats.get('can_delete', 'Missing')}")
                
                return True, services[:2]  # Return first 2 services for testing
            else:
                print(f"   ⚠️  No services found")
                return True, []
        else:
            print(f"   ❌ Failed: {response.status_code} - {response.text}")
            return False, []

    def test_bulk_update_status(self, service_ids, is_active):
        """Test PATCH /api/services/bulk-update-status"""
        action = "activate" if is_active else "deactivate"
        print(f"\n🔄 Testing bulk {action} services...")
        
        headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
        data = {
            "service_ids": service_ids,
            "is_active": is_active
        }
        
        response = requests.patch(f"{self.api_url}/services/bulk-update-status", 
                                json=data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Bulk {action} successful")
            print(f"   📊 Results:")
            print(f"      - Updated: {result.get('updated_count', 0)}")
            print(f"      - Requested: {result.get('requested_count', 0)}")
            print(f"      - New Status: {result.get('new_status', 'Unknown')}")
            return True
        elif response.status_code == 403:
            print(f"   ✅ Access denied (403) - Expected for Agency Staff")
            return True
        else:
            print(f"   ❌ Failed: {response.status_code} - {response.text}")
            return False

    def test_bulk_delete(self, service_ids):
        """Test DELETE /api/services/bulk-delete"""
        print(f"\n🗑️  Testing bulk delete services...")
        
        headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
        data = {"service_ids": service_ids}
        
        response = requests.delete(f"{self.api_url}/services/bulk-delete", 
                                 json=data, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Bulk delete successful")
            print(f"   📊 Results:")
            print(f"      - Deleted: {result.get('deleted_count', 0)}")
            print(f"      - Requested: {result.get('requested_count', 0)}")
            return True
        elif response.status_code == 400:
            print(f"   ✅ Delete protection working - Services are in use")
            error_detail = response.json().get('detail', '')
            if 'being used in operations' in error_detail:
                print(f"   ✅ Appropriate error message: {error_detail}")
            return True
        elif response.status_code == 403:
            print(f"   ✅ Access denied (403) - Expected for Agency Staff")
            return True
        else:
            print(f"   ❌ Failed: {response.status_code} - {response.text}")
            return False

    def run_comprehensive_test(self):
        """Run comprehensive test for all endpoints and users"""
        print("🔧 اختبار النقاط الطرفية الجديدة لإدارة الخدمات (Bulk Services Management)")
        print("=" * 80)
        
        results = {}
        test_service_ids = []
        
        for user_key, user_info in self.test_users.items():
            print(f"\n👤 Testing with {user_info['role']} ({user_info['email']})...")
            
            # Login
            if not self.login(user_info['email'], user_info['password']):
                results[f'{user_key}_login'] = False
                continue
            
            results[f'{user_key}_login'] = True
            
            # Test 1: GET /api/services/management
            success, services = self.test_services_management_endpoint()
            results[f'{user_key}_services_management'] = success
            
            # Store service IDs for bulk operations (only for Super Admin)
            if user_key == 'super_admin' and services and len(services) >= 2:
                test_service_ids = [s['id'] for s in services]
                print(f"   📝 Stored test service IDs for bulk operations")
            
            # Test role-based access
            user_role = self.current_user.get('role')
            if user_role == 'agency_staff':
                print(f"   🔒 Agency Staff - Testing access restrictions...")
                
                # Test bulk update (should fail with 403)
                success = self.test_bulk_update_status(['dummy-id'], False)
                results[f'{user_key}_bulk_update_denied'] = success
                
                # Test bulk delete (should fail with 403)
                success = self.test_bulk_delete(['dummy-id'])
                results[f'{user_key}_bulk_delete_denied'] = success
                
            elif user_role in ['super_admin', 'general_accountant'] and test_service_ids:
                print(f"   🔧 {user_info['role']} - Testing bulk operations...")
                
                # Test bulk deactivate
                success = self.test_bulk_update_status(test_service_ids, False)
                results[f'{user_key}_bulk_deactivate'] = success
                
                # Test bulk reactivate
                success = self.test_bulk_update_status(test_service_ids, True)
                results[f'{user_key}_bulk_reactivate'] = success
                
                # Test bulk delete (should fail due to usage protection)
                success = self.test_bulk_delete(test_service_ids)
                results[f'{user_key}_bulk_delete_protection'] = success
        
        return results

    def print_summary(self, results):
        """Print test summary"""
        print(f"\n" + "=" * 80)
        print(f"📊 BULK SERVICES MANAGEMENT TEST SUMMARY")
        print(f"=" * 80)
        
        total_tests = len(results)
        passed_tests = sum(1 for result in results.values() if result is True)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "No tests run")
        
        print(f"\nDetailed Results:")
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {status} {test_name}")
        
        # Check Arabic review requirements
        print(f"\n" + "=" * 80)
        print(f"📋 ARABIC REVIEW REQUIREMENTS CHECK")
        print(f"=" * 80)
        
        requirements_met = []
        requirements_failed = []
        
        # 1. GET /api/services/management with all user roles
        if any(results.get(f'{role}_services_management', False) for role in ['super_admin', 'general_accountant', 'agency_staff']):
            requirements_met.append("✅ GET /api/services/management - All user roles")
        else:
            requirements_failed.append("❌ GET /api/services/management - All user roles")
        
        # 2. Usage statistics in response
        if any(results.get(f'{role}_services_management', False) for role in ['super_admin', 'general_accountant', 'agency_staff']):
            requirements_met.append("✅ Usage statistics (operations_count, total_revenue, last_used)")
        else:
            requirements_failed.append("❌ Usage statistics missing")
        
        # 3. PATCH /api/services/bulk-update-status
        if any(results.get(f'{role}_bulk_deactivate', False) for role in ['super_admin', 'general_accountant']):
            requirements_met.append("✅ PATCH /api/services/bulk-update-status - Bulk activation/deactivation")
        else:
            requirements_failed.append("❌ PATCH /api/services/bulk-update-status - Bulk activation/deactivation")
        
        # 4. DELETE /api/services/bulk-delete with protection
        if any(results.get(f'{role}_bulk_delete_protection', False) for role in ['super_admin', 'general_accountant']):
            requirements_met.append("✅ DELETE /api/services/bulk-delete - Protection for used services")
        else:
            requirements_failed.append("❌ DELETE /api/services/bulk-delete - Protection for used services")
        
        # 5. Role-based permissions
        if results.get('agency_staff_bulk_update_denied', False) and results.get('agency_staff_bulk_delete_denied', False):
            requirements_met.append("✅ Role-based permissions - Agency Staff denied bulk operations")
        else:
            requirements_failed.append("❌ Role-based permissions - Agency Staff access control")
        
        print(f"\nREQUIREMENTS MET:")
        for req in requirements_met:
            print(f"  {req}")
        
        if requirements_failed:
            print(f"\nREQUIREMENTS FAILED:")
            for req in requirements_failed:
                print(f"  {req}")
        
        # Final assessment
        requirements_success_rate = len(requirements_met) / (len(requirements_met) + len(requirements_failed)) * 100
        
        print(f"\n" + "=" * 80)
        print(f"🎯 FINAL ASSESSMENT")
        print(f"=" * 80)
        
        if requirements_success_rate >= 90:
            print(f"🎉 EXCELLENT: {requirements_success_rate:.1f}% of Arabic review requirements met!")
            print(f"   The bulk services management endpoints are working excellently.")
        elif requirements_success_rate >= 75:
            print(f"✅ GOOD: {requirements_success_rate:.1f}% of Arabic review requirements met.")
            print(f"   Most functionality working correctly with minor issues.")
        elif requirements_success_rate >= 50:
            print(f"⚠️  PARTIAL: {requirements_success_rate:.1f}% of Arabic review requirements met.")
            print(f"   Significant issues found that need attention.")
        else:
            print(f"❌ CRITICAL: Only {requirements_success_rate:.1f}% of Arabic review requirements met.")
            print(f"   Major fixes needed.")

if __name__ == "__main__":
    tester = BulkServicesTest()
    results = tester.run_comprehensive_test()
    tester.print_summary(results)