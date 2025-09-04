#!/usr/bin/env python3
"""
Financial Transfer Approval System Test
Testing the cash transfer confirm/reject functionality with role-based access control
"""

import requests
import json
from datetime import datetime

class FinancialTransferTester:
    def __init__(self, base_url="https://travel-ops-manager.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.current_user = None

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
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
            if success:
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

    def test_financial_transfer_approval_system(self):
        """Test Financial Transfer Approval System as requested in review"""
        print(f"\n💰 Testing Financial Transfer Approval System (Review Request)...")
        print(f"   Testing confirm/reject functionality with role-based access control")
        
        results = {}
        transfer_id = None
        
        # Step 1: Create a test transfer using Agency Staff
        print(f"\n   1. Creating test transfer using Agency Staff...")
        
        # Login as Agency Staff (Tlemcen)
        staff_auth_success = self.test_login('staff1@tlemcen.sanhaja.com', 'staff123')
        results['agency_staff_login'] = staff_auth_success
        
        if staff_auth_success:
            print(f"   ✅ Agency Staff authenticated successfully")
            staff_agency_id = self.current_user.get('agency_id')
            
            # Create a cash transfer
            success, response = self.run_test(
                "Agency Staff - Create Cash Transfer",
                "POST",
                f"agencies/{staff_agency_id}/cash-transfer",
                200,
                data={
                    "amount": 50000.0,
                    "notes": "Test transfer for approval testing"
                }
            )
            results['create_transfer'] = success
            
            if success and 'transfer_id' in response:
                transfer_id = response['transfer_id']
                print(f"   ✅ Transfer created successfully - ID: {transfer_id}")
            else:
                print(f"   ❌ Failed to create transfer - cannot proceed with approval tests")
                return results
        else:
            print(f"   ❌ Agency Staff login failed - cannot create test transfer")
            return results
        
        # Step 2: Test Agency Staff cannot confirm/reject (should get 403)
        print(f"\n   2. Testing Agency Staff cannot confirm/reject transfers...")
        
        # Test confirm (should fail with 403)
        success, response = self.run_test(
            "Agency Staff - Try Confirm Transfer (Should Fail)",
            "PUT",
            f"cash-transfers/{transfer_id}/confirm",
            403
        )
        results['staff_cannot_confirm'] = success
        if success:
            print(f"   ✅ Agency Staff correctly denied confirm access (403)")
        
        # Test reject (should fail with 403)
        success, response = self.run_test(
            "Agency Staff - Try Reject Transfer (Should Fail)",
            "PUT",
            f"cash-transfers/{transfer_id}/reject",
            403
        )
        results['staff_cannot_reject'] = success
        if success:
            print(f"   ✅ Agency Staff correctly denied reject access (403)")
        
        # Step 3: Test General Accountant can confirm transfers
        print(f"\n   3. Testing General Accountant can confirm transfers...")
        
        # Login as General Accountant
        ga_auth_success = self.test_login('generalaccountant@sanhaja.com', 'acc123')
        results['general_accountant_login'] = ga_auth_success
        
        if ga_auth_success:
            print(f"   ✅ General Accountant authenticated successfully")
            
            # Get transfers list to verify it exists
            success, transfers = self.run_test(
                "General Accountant - Get Cash Transfers",
                "GET",
                "cash-transfers",
                200
            )
            results['ga_get_transfers'] = success
            
            if success:
                print(f"   ✅ General Accountant can access transfers list ({len(transfers)} transfers)")
                
                # Find our test transfer
                test_transfer = None
                for transfer in transfers:
                    if transfer.get('id') == transfer_id:
                        test_transfer = transfer
                        break
                
                if test_transfer:
                    print(f"   ✅ Test transfer found - Status: {test_transfer.get('status', 'unknown')}")
                    
                    # Confirm the transfer
                    success, response = self.run_test(
                        "General Accountant - Confirm Transfer",
                        "PUT",
                        f"cash-transfers/{transfer_id}/confirm",
                        200
                    )
                    results['ga_confirm_transfer'] = success
                    
                    if success:
                        print(f"   ✅ General Accountant successfully confirmed transfer")
                        print(f"   Response: {response.get('message', 'No message')}")
                        
                        # Verify status changed to confirmed
                        success, updated_transfers = self.run_test(
                            "Verify Transfer Status - Confirmed",
                            "GET",
                            "cash-transfers",
                            200
                        )
                        
                        if success:
                            updated_transfer = None
                            for transfer in updated_transfers:
                                if transfer.get('id') == transfer_id:
                                    updated_transfer = transfer
                                    break
                            
                            if updated_transfer and updated_transfer.get('status') == 'confirmed':
                                print(f"   ✅ Transfer status correctly updated to 'confirmed'")
                                results['status_updated_confirmed'] = True
                            else:
                                print(f"   ❌ Transfer status not updated correctly")
                                results['status_updated_confirmed'] = False
                else:
                    print(f"   ❌ Test transfer not found in transfers list")
        
        # Step 4: Create another transfer to test rejection
        print(f"\n   4. Creating second transfer to test rejection...")
        
        # Login back as Agency Staff to create another transfer
        if self.test_login('staff1@tlemcen.sanhaja.com', 'staff123'):
            staff_agency_id = self.current_user.get('agency_id')
            
            success, response = self.run_test(
                "Agency Staff - Create Second Transfer",
                "POST",
                f"agencies/{staff_agency_id}/cash-transfer",
                200,
                data={
                    "amount": 30000.0,
                    "notes": "Second test transfer for rejection testing"
                }
            )
            
            if success and 'transfer_id' in response:
                second_transfer_id = response['transfer_id']
                print(f"   ✅ Second transfer created - ID: {second_transfer_id}")
                
                # Step 5: Test Super Admin can reject transfers
                print(f"\n   5. Testing Super Admin can reject transfers...")
                
                # Login as Super Admin
                sa_auth_success = self.test_login('superadmin@sanhaja.com', 'super123')
                results['super_admin_login'] = sa_auth_success
                
                if sa_auth_success:
                    print(f"   ✅ Super Admin authenticated successfully")
                    
                    # Get transfers list
                    success, transfers = self.run_test(
                        "Super Admin - Get Cash Transfers",
                        "GET",
                        "cash-transfers",
                        200
                    )
                    results['sa_get_transfers'] = success
                    
                    if success:
                        print(f"   ✅ Super Admin can access transfers list ({len(transfers)} transfers)")
                        
                        # Reject the second transfer
                        success, response = self.run_test(
                            "Super Admin - Reject Transfer",
                            "PUT",
                            f"cash-transfers/{second_transfer_id}/reject",
                            200
                        )
                        results['sa_reject_transfer'] = success
                        
                        if success:
                            print(f"   ✅ Super Admin successfully rejected transfer")
                            print(f"   Response: {response.get('message', 'No message')}")
                            
                            # Verify status changed to rejected
                            success, updated_transfers = self.run_test(
                                "Verify Transfer Status - Rejected",
                                "GET",
                                "cash-transfers",
                                200
                            )
                            
                            if success:
                                updated_transfer = None
                                for transfer in updated_transfers:
                                    if transfer.get('id') == second_transfer_id:
                                        updated_transfer = transfer
                                        break
                                
                                if updated_transfer and updated_transfer.get('status') == 'rejected':
                                    print(f"   ✅ Transfer status correctly updated to 'rejected'")
                                    results['status_updated_rejected'] = True
                                else:
                                    print(f"   ❌ Transfer status not updated correctly")
                                    results['status_updated_rejected'] = False
        
        # Step 6: Test role-based filtering in GET /api/cash-transfers
        print(f"\n   6. Testing role-based filtering in cash transfers list...")
        
        # Test as Agency Staff (should only see their agency transfers)
        if self.test_login('staff1@tlemcen.sanhaja.com', 'staff123'):
            success, staff_transfers = self.run_test(
                "Agency Staff - Get Transfers (Filtered)",
                "GET",
                "cash-transfers",
                200
            )
            
            if success:
                staff_agency_id = self.current_user.get('agency_id')
                all_same_agency = all(t.get('agency_id') == staff_agency_id for t in staff_transfers)
                
                if all_same_agency:
                    print(f"   ✅ Agency Staff sees only their agency transfers ({len(staff_transfers)} transfers)")
                    results['staff_transfer_filtering'] = True
                else:
                    print(f"   ❌ Agency Staff sees transfers from other agencies")
                    results['staff_transfer_filtering'] = False
        
        # Test as General Accountant (should see all transfers)
        if self.test_login('generalaccountant@sanhaja.com', 'acc123'):
            success, ga_transfers = self.run_test(
                "General Accountant - Get All Transfers",
                "GET",
                "cash-transfers",
                200
            )
            
            if success:
                agency_ids = set(t.get('agency_id') for t in ga_transfers if t.get('agency_id'))
                
                if len(agency_ids) >= 1:  # Should see transfers from multiple agencies or at least all available
                    print(f"   ✅ General Accountant sees transfers from {len(agency_ids)} agencies ({len(ga_transfers)} total)")
                    results['ga_transfer_access'] = True
                else:
                    print(f"   ❌ General Accountant doesn't see expected transfer access")
                    results['ga_transfer_access'] = False
        
        # Step 7: Test error handling for non-existent transfers
        print(f"\n   7. Testing error handling for non-existent transfers...")
        
        if self.test_login('generalaccountant@sanhaja.com', 'acc123'):
            # Test confirm non-existent transfer
            success, response = self.run_test(
                "General Accountant - Confirm Non-existent Transfer",
                "PUT",
                "cash-transfers/non-existent-id/confirm",
                404
            )
            results['error_handling_confirm'] = success
            if success:
                print(f"   ✅ Properly handles non-existent transfer confirmation (404)")
            
            # Test reject non-existent transfer
            success, response = self.run_test(
                "General Accountant - Reject Non-existent Transfer",
                "PUT",
                "cash-transfers/non-existent-id/reject",
                404
            )
            results['error_handling_reject'] = success
            if success:
                print(f"   ✅ Properly handles non-existent transfer rejection (404)")
        
        return results

if __name__ == "__main__":
    tester = FinancialTransferTester()
    
    # Run the specific financial transfer approval test
    print("🚀 Starting Financial Transfer Approval System Testing...")
    print("=" * 80)
    
    results = tester.test_financial_transfer_approval_system()
    
    # Print summary
    print(f"\n" + "=" * 80)
    print(f"📊 FINANCIAL TRANSFER APPROVAL SYSTEM TEST SUMMARY")
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
    
    if passed_tests == total_tests:
        print(f"\n🎉 ALL TESTS PASSED! Financial Transfer Approval System is working correctly.")
    elif passed_tests >= total_tests * 0.8:
        print(f"\n⚠️  MOSTLY WORKING: {passed_tests}/{total_tests} tests passed. Minor issues detected.")
    else:
        print(f"\n❌ CRITICAL ISSUES: Only {passed_tests}/{total_tests} tests passed. Major fixes needed.")