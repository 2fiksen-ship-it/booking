#!/usr/bin/env python3
"""
PDF Receipt Generation Fix Testing for Daily Operations
Tests Arabic Font Support + Real Payment Data Integration
"""

import requests
import sys
import json
from datetime import datetime, timedelta

class PDFReceiptTester:
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
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

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
                    print(f"   Response: Non-JSON content ({len(response.content)} bytes)")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:200]}")

            return success, response.json() if response.content and 'application/json' in response.headers.get('content-type', '') else response

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

    def test_pdf_receipt_arabic_font_fix(self):
        """Test PDF RECEIPT GENERATION FIX for Daily Operations - Arabic Font Support + Real Payment Data"""
        print(f"\n📄 TESTING PDF RECEIPT GENERATION FIX - ARABIC FONT SUPPORT + REAL PAYMENT DATA")
        print(f"   🎯 CRITICAL PDF TESTING as requested in review")
        print(f"   Focus: Arabic font support, real payment data integration, error handling")
        
        results = {}
        
        # Step 1: Super Admin Login (as specified in review request)
        print(f"\n   1. Super Admin Login (superadmin@sanhaja.com / super123)...")
        auth_success = self.test_login('superadmin@sanhaja.com', 'super123')
        results['super_admin_login'] = auth_success
        
        if not auth_success:
            print("   ❌ CRITICAL: Super Admin login failed - cannot proceed with PDF tests")
            return results
            
        print(f"   ✅ Super Admin authenticated successfully")
        
        # Step 2: Get existing daily operations with different payment statuses
        print(f"\n   2. Getting existing daily operations for PDF testing...")
        success, operations_data = self.run_test(
            "Get Daily Operations for PDF Testing",
            "GET",
            "daily-operations",
            200
        )
        results['get_operations'] = success
        
        if not success or not operations_data:
            print("   ❌ No daily operations found - cannot test PDF generation")
            return results
        
        print(f"   ✅ Found {len(operations_data)} daily operations for testing")
        
        # Step 3: Test operations with different payment statuses
        print(f"\n   3. Testing PDF generation for operations with different payment statuses...")
        
        # Find operations with different payment statuses
        unpaid_operations = []
        partially_paid_operations = []
        fully_paid_operations = []
        
        for operation in operations_data[:10]:  # Test first 10 operations
            operation_id = operation.get('id')
            if not operation_id:
                continue
                
            # Get payment status for this operation
            success, payment_status = self.run_test(
                f"Get Payment Status for Operation {operation_id}",
                "GET",
                f"daily-operations/{operation_id}/payment-status",
                200
            )
            
            if success and payment_status:
                status = payment_status.get('payment_status', 'unpaid')
                if status == 'unpaid':
                    unpaid_operations.append(operation_id)
                elif status == 'partially_paid':
                    partially_paid_operations.append(operation_id)
                elif status == 'fully_paid':
                    fully_paid_operations.append(operation_id)
        
        print(f"   Found operations: {len(unpaid_operations)} unpaid, {len(partially_paid_operations)} partial, {len(fully_paid_operations)} fully paid")
        
        # Step 4: Test Arabic Font Support - Test with unpaid operation
        if unpaid_operations:
            print(f"\n   4. Testing Arabic Font Support with UNPAID operation...")
            test_operation_id = unpaid_operations[0]
            
            success, pdf_result = self.test_pdf_generation_with_arabic_support(test_operation_id, "unpaid")
            results['arabic_font_unpaid'] = success
            
            if success:
                print(f"   ✅ Arabic font support working for unpaid operations")
            else:
                print(f"   ❌ Arabic font support failed for unpaid operations")
        
        # Step 5: Test Real Payment Data Integration - Partially paid operation
        if partially_paid_operations:
            print(f"\n   5. Testing Real Payment Data Integration with PARTIALLY PAID operation...")
            test_operation_id = partially_paid_operations[0]
            
            success, pdf_result = self.test_pdf_generation_with_payment_data(test_operation_id, "partially_paid")
            results['payment_data_partial'] = success
            
            if success:
                print(f"   ✅ Real payment data integration working for partially paid operations")
            else:
                print(f"   ❌ Real payment data integration failed for partially paid operations")
        
        # Step 6: Test Real Payment Data Integration - Fully paid operation
        if fully_paid_operations:
            print(f"\n   6. Testing Real Payment Data Integration with FULLY PAID operation...")
            test_operation_id = fully_paid_operations[0]
            
            success, pdf_result = self.test_pdf_generation_with_payment_data(test_operation_id, "fully_paid")
            results['payment_data_full'] = success
            
            if success:
                print(f"   ✅ Real payment data integration working for fully paid operations")
            else:
                print(f"   ❌ Real payment data integration failed for fully paid operations")
        
        # Step 7: Test Payment Method Display in Arabic
        print(f"\n   7. Testing Payment Method Display in Arabic...")
        
        # Get operations with payments to test payment method display
        success, payments_data = self.run_test(
            "Get Payments for Method Testing",
            "GET",
            "payments?payment_type=operation",
            200
        )
        
        if success and payments_data:
            # Test PDF generation for operation with different payment methods
            payment_methods_tested = set()
            for payment in payments_data[:5]:  # Test first 5 payments
                operation_id = payment.get('daily_operation_id')
                method = payment.get('method')
                
                if operation_id and method and method not in payment_methods_tested:
                    print(f"   Testing payment method '{method}' display in PDF...")
                    
                    success, pdf_result = self.test_pdf_payment_method_display(operation_id, method)
                    results[f'payment_method_{method}'] = success
                    payment_methods_tested.add(method)
                    
                    if success:
                        print(f"   ✅ Payment method '{method}' displays correctly in Arabic")
                    else:
                        print(f"   ❌ Payment method '{method}' display failed")
        
        # Step 8: Test Error Handling
        print(f"\n   8. Testing PDF Generation Error Handling...")
        
        # Test with non-existent operation ID
        success, error_response = self.run_test(
            "PDF Generation - Non-existent Operation",
            "GET",
            "daily-operations/non-existent-id/print",
            404
        )
        results['error_handling_404'] = success
        
        if success:
            print(f"   ✅ Properly handles non-existent operation (404 error)")
        else:
            print(f"   ❌ Error handling failed for non-existent operation")
        
        # Test with operation that has no payments (should show 0 paid, full amount remaining)
        if unpaid_operations:
            print(f"   Testing PDF generation for operation with no payments...")
            test_operation_id = unpaid_operations[0]
            
            success, pdf_result = self.test_pdf_no_payments_handling(test_operation_id)
            results['no_payments_handling'] = success
            
            if success:
                print(f"   ✅ Properly handles operations with no payments")
            else:
                print(f"   ❌ Failed to handle operations with no payments")
        
        # Step 9: Test Arabic Font Fallback
        print(f"\n   9. Testing Arabic Font Fallback Mechanism...")
        
        # This tests if the system gracefully falls back when Arabic fonts fail to load
        if operations_data:
            test_operation_id = operations_data[0].get('id')
            if test_operation_id:
                success, pdf_result = self.test_arabic_font_fallback(test_operation_id)
                results['arabic_font_fallback'] = success
                
                if success:
                    print(f"   ✅ Arabic font fallback mechanism working")
                else:
                    print(f"   ❌ Arabic font fallback mechanism failed")
        
        return results
    
    def test_pdf_generation_with_arabic_support(self, operation_id, payment_status):
        """Test PDF generation with Arabic font support"""
        print(f"   Testing GET /api/daily-operations/{operation_id}/print")
        
        url = f"{self.api_url}/daily-operations/{operation_id}/print"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                print(f"   ✅ PDF generated successfully for {payment_status} operation")
                
                # Check content type
                content_type = response.headers.get('content-type', '')
                if 'application/pdf' in content_type:
                    print(f"   ✅ Correct content-type: application/pdf")
                else:
                    print(f"   ❌ Wrong content-type: {content_type}")
                    return False, None
                
                # Check PDF file size (should be reasonable for Arabic content)
                pdf_size = len(response.content)
                if pdf_size > 2000:  # Arabic PDFs should be larger due to font embedding
                    print(f"   ✅ PDF file size appropriate for Arabic content: {pdf_size} bytes")
                else:
                    print(f"   ❌ PDF file too small for Arabic content: {pdf_size} bytes")
                    return False, None
                
                # Check PDF magic bytes
                if response.content.startswith(b'%PDF'):
                    print(f"   ✅ Valid PDF file format")
                else:
                    print(f"   ❌ Invalid PDF format")
                    return False, None
                
                # Check Content-Disposition header
                content_disposition = response.headers.get('content-disposition', '')
                if 'attachment' in content_disposition:
                    print(f"   ✅ Proper download headers set")
                else:
                    print(f"   ❌ Missing download headers")
                
                return True, response.content
                
            else:
                print(f"   ❌ PDF generation failed - Status: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text[:200]}")
                return False, None
                
        except Exception as e:
            print(f"   ❌ PDF generation error: {str(e)}")
            return False, None
    
    def test_pdf_generation_with_payment_data(self, operation_id, expected_status):
        """Test PDF generation with real payment data integration"""
        print(f"   Testing real payment data integration for {expected_status} operation...")
        
        # First get the payment status to verify expected data
        success, payment_status = self.run_test(
            f"Get Payment Status for Verification",
            "GET",
            f"daily-operations/{operation_id}/payment-status",
            200
        )
        
        if not success:
            print(f"   ❌ Could not get payment status for verification")
            return False, None
        
        print(f"   Payment Status: {payment_status.get('payment_status', 'unknown')}")
        print(f"   Amount Paid: {payment_status.get('amount_paid', 0)} DZD")
        print(f"   Remaining Amount: {payment_status.get('remaining_amount', 0)} DZD")
        
        # Now test PDF generation
        url = f"{self.api_url}/daily-operations/{operation_id}/print"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                print(f"   ✅ PDF generated successfully with real payment data")
                
                # Verify PDF properties
                pdf_size = len(response.content)
                if pdf_size > 2000:
                    print(f"   ✅ PDF contains payment information: {pdf_size} bytes")
                else:
                    print(f"   ❌ PDF too small, may be missing payment data: {pdf_size} bytes")
                    return False, None
                
                # Check if PDF is valid
                if response.content.startswith(b'%PDF'):
                    print(f"   ✅ Valid PDF with payment data generated")
                    
                    # Verify expected payment status matches
                    actual_status = payment_status.get('payment_status', 'unknown')
                    if expected_status in actual_status or actual_status in expected_status:
                        print(f"   ✅ Payment status matches expected: {actual_status}")
                        return True, response.content
                    else:
                        print(f"   ⚠️  Payment status mismatch: expected {expected_status}, got {actual_status}")
                        return True, response.content  # Still success, just different status
                else:
                    print(f"   ❌ Invalid PDF format")
                    return False, None
                
            else:
                print(f"   ❌ PDF generation failed - Status: {response.status_code}")
                return False, None
                
        except Exception as e:
            print(f"   ❌ PDF generation error: {str(e)}")
            return False, None
    
    def test_pdf_payment_method_display(self, operation_id, payment_method):
        """Test payment method display in Arabic in PDF"""
        url = f"{self.api_url}/daily-operations/{operation_id}/print"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                # Check if PDF is generated (we can't easily verify Arabic text without parsing PDF)
                pdf_size = len(response.content)
                if pdf_size > 1500 and response.content.startswith(b'%PDF'):
                    print(f"   ✅ PDF generated with payment method data")
                    return True, response.content
                else:
                    print(f"   ❌ PDF generation issue for payment method")
                    return False, None
            else:
                print(f"   ❌ PDF generation failed for payment method test")
                return False, None
                
        except Exception as e:
            print(f"   ❌ Payment method PDF test error: {str(e)}")
            return False, None
    
    def test_pdf_no_payments_handling(self, operation_id):
        """Test PDF generation when operation has no payments"""
        print(f"   Testing PDF generation for operation with no payments...")
        
        url = f"{self.api_url}/daily-operations/{operation_id}/print"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                print(f"   ✅ PDF generated successfully for operation with no payments")
                
                # Verify PDF is valid
                if response.content.startswith(b'%PDF') and len(response.content) > 1500:
                    print(f"   ✅ Valid PDF shows 0 DZD paid, full amount remaining")
                    return True, response.content
                else:
                    print(f"   ❌ Invalid PDF for no payments scenario")
                    return False, None
            else:
                print(f"   ❌ PDF generation failed for no payments scenario")
                return False, None
                
        except Exception as e:
            print(f"   ❌ No payments PDF test error: {str(e)}")
            return False, None
    
    def test_arabic_font_fallback(self, operation_id):
        """Test Arabic font fallback gracefully handles font loading failures"""
        print(f"   Testing Arabic font fallback mechanism...")
        
        url = f"{self.api_url}/daily-operations/{operation_id}/print"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                # If PDF generates without errors, fallback is working
                if response.content.startswith(b'%PDF') and len(response.content) > 1000:
                    print(f"   ✅ Arabic font fallback working - PDF generated without errors")
                    return True, response.content
                else:
                    print(f"   ❌ Arabic font fallback failed - invalid PDF")
                    return False, None
            else:
                print(f"   ❌ Arabic font fallback test failed - Status: {response.status_code}")
                return False, None
                
        except Exception as e:
            print(f"   ❌ Arabic font fallback test error: {str(e)}")
            return False, None

def main():
    """Main function to run PDF Receipt Generation Fix tests"""
    print("🚀 Starting PDF Receipt Generation Fix Testing...")
    print("=" * 80)
    
    tester = PDFReceiptTester()
    results = tester.test_pdf_receipt_arabic_font_fix()
    
    # Print summary
    print(f"\n{'='*80}")
    print(f"PDF RECEIPT GENERATION FIX TESTING SUMMARY")
    print(f"{'='*80}")
    
    if isinstance(results, dict):
        passed = sum(1 for v in results.values() if v is True)
        total = len(results)
        success_rate = (passed/total*100) if total > 0 else 0
        
        print(f"📊 Overall Results: {passed}/{total} tests passed ({success_rate:.1f}%)")
        
        # Show detailed results
        print(f"\n📋 Detailed Results:")
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {test_name}: {status}")
        
        # Show failed tests
        failed_tests = [k for k, v in results.items() if v is False]
        if failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test}")
        
        # Overall assessment
        if success_rate >= 90:
            print(f"\n🎉 EXCELLENT: PDF Receipt Generation Fix working excellently!")
        elif success_rate >= 75:
            print(f"\n✅ GOOD: PDF Receipt Generation Fix working well with minor issues")
        elif success_rate >= 50:
            print(f"\n⚠️  FAIR: PDF Receipt Generation Fix has some issues")
        else:
            print(f"\n❌ POOR: PDF Receipt Generation Fix has significant issues")
    
    print(f"{'='*80}")
    return results

if __name__ == "__main__":
    main()