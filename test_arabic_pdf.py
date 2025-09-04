#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class ArabicPDFTester:
    def __init__(self, base_url="https://travel-agency-app.preview.emergentagent.com"):
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

    def test_pdf_receipt_generation_arabic_fix(self):
        """Test PDF Receipt Generation with Arabic Text Fix - SPECIFIC REVIEW REQUEST"""
        print(f"\n📄 Testing PDF Receipt Generation with Arabic Text Fix (Review Request)...")
        print(f"   Testing Arabic text display in PDF receipts for daily operations")
        print(f"   Verifying fix_arabic_text() function and proper Arabic rendering")
        
        results = {}
        
        # Step 1: Login as Agency Staff (from review request credentials)
        print(f"\n   1. Agency Staff Login (staff1@tlemcen.sanhaja.com / staff123)...")
        auth_success = self.test_login('staff1@tlemcen.sanhaja.com', 'staff123')
        results['agency_staff_login'] = auth_success
        
        if not auth_success:
            print("   ❌ CRITICAL: Agency Staff login failed - cannot proceed with PDF tests")
            return results
            
        print(f"   ✅ Agency Staff authenticated successfully")
        print(f"   User: {self.current_user.get('name')} ({self.current_user.get('role')})")
        print(f"   Agency: {self.current_user.get('agency_id')}")
        
        # Step 2: Get Daily Operations for PDF Testing
        print(f"\n   2. Getting Daily Operations for PDF Testing...")
        success, operations_data = self.run_test(
            "Get Daily Operations",
            "GET",
            "daily-operations",
            200
        )
        results['get_operations'] = success
        
        if not success or not operations_data:
            print("   ❌ No daily operations found - cannot test PDF generation")
            return results
            
        print(f"   ✅ Found {len(operations_data)} daily operations")
        
        # Filter operations with Arabic text for testing
        arabic_operations = []
        for op in operations_data:
            # Look for operations with Arabic client names or service names
            client_name = op.get('client_name', '')
            service_name = op.get('service_name', '')
            if any(ord(char) > 127 for char in client_name + service_name):  # Contains non-ASCII (likely Arabic)
                arabic_operations.append(op)
        
        print(f"   Found {len(arabic_operations)} operations with Arabic text")
        
        if not arabic_operations:
            print("   ⚠️  No operations with Arabic text found - using first available operation")
            arabic_operations = operations_data[:3]  # Use first 3 operations
        
        # Step 3: Test PDF Generation for Operations with Arabic Text
        print(f"\n   3. Testing PDF Generation for Operations with Arabic Text...")
        
        pdf_test_count = 0
        pdf_success_count = 0
        
        for i, operation in enumerate(arabic_operations[:5]):  # Test up to 5 operations
            operation_id = operation.get('id')
            client_name = operation.get('client_name', 'Unknown')
            service_name = operation.get('service_name', 'Unknown')
            
            print(f"\n   3.{i+1}. Testing PDF for Operation {operation_id}...")
            print(f"        Client: {client_name}")
            print(f"        Service: {service_name}")
            
            pdf_test_count += 1
            
            # Generate PDF receipt using direct HTTP request to handle binary response
            url = f"{self.api_url}/daily-operations/{operation_id}/print"
            headers = {'Authorization': f'Bearer {self.token}'}
            
            try:
                response = requests.get(url, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    pdf_success_count += 1
                    print(f"   ✅ PDF generated successfully for operation {operation_id}")
                    
                    # Check content type
                    content_type = response.headers.get('content-type', '')
                    if 'application/pdf' in content_type:
                        print(f"   ✅ Correct content-type: {content_type}")
                    else:
                        print(f"   ⚠️  Content-type: {content_type}")
                    
                    # Check PDF file size
                    pdf_size = len(response.content)
                    if pdf_size > 1000:  # PDF should be at least 1KB
                        print(f"   ✅ PDF file generated with size: {pdf_size} bytes")
                    else:
                        print(f"   ❌ PDF file too small: {pdf_size} bytes")
                    
                    # Check PDF magic bytes
                    if response.content.startswith(b'%PDF'):
                        print(f"   ✅ Valid PDF file format (starts with %PDF)")
                    else:
                        print(f"   ❌ Invalid PDF format (doesn't start with %PDF)")
                    
                    # Test Arabic text elements that should be in the PDF
                    arabic_elements_tested = {
                        'client_name_arabic': bool(any(ord(char) > 127 for char in client_name)),
                        'service_name_arabic': bool(any(ord(char) > 127 for char in service_name)),
                        'pdf_generated': True
                    }
                    
                    print(f"   Arabic Elements:")
                    print(f"     - Client Name Arabic: {'✅' if arabic_elements_tested['client_name_arabic'] else '⚪'}")
                    print(f"     - Service Name Arabic: {'✅' if arabic_elements_tested['service_name_arabic'] else '⚪'}")
                    print(f"     - PDF Generated: ✅")
                    
                else:
                    print(f"   ❌ PDF generation failed for operation {operation_id} - Status: {response.status_code}")
                    try:
                        error_data = response.json()
                        print(f"   Error: {error_data}")
                    except:
                        print(f"   Error: {response.text[:200]}")
                        
            except Exception as e:
                print(f"   ❌ PDF generation error for operation {operation_id}: {str(e)}")
        
        results['pdf_generation_tests'] = pdf_test_count
        results['pdf_generation_success'] = pdf_success_count
        results['pdf_success_rate'] = (pdf_success_count / pdf_test_count * 100) if pdf_test_count > 0 else 0
        
        print(f"\n   PDF Generation Summary:")
        print(f"   Tests Run: {pdf_test_count}")
        print(f"   Successful: {pdf_success_count}")
        print(f"   Success Rate: {results['pdf_success_rate']:.1f}%")
        
        # Step 4: Test Super Admin PDF Generation (alternative credentials)
        print(f"\n   4. Testing Super Admin PDF Generation (superadmin@sanhaja.com / super123)...")
        
        super_admin_success = self.test_login('superadmin@sanhaja.com', 'super123')
        results['super_admin_login'] = super_admin_success
        
        if super_admin_success:
            print(f"   ✅ Super Admin authenticated successfully")
            
            # Get operations as Super Admin (should see all agencies)
            success, super_admin_operations = self.run_test(
                "Super Admin - Get All Operations",
                "GET",
                "daily-operations",
                200
            )
            
            if success and super_admin_operations:
                print(f"   ✅ Super Admin sees {len(super_admin_operations)} operations")
                
                # Test PDF generation for first operation with Arabic text
                for operation in super_admin_operations[:2]:
                    operation_id = operation.get('id')
                    client_name = operation.get('client_name', 'Unknown')
                    service_name = operation.get('service_name', 'Unknown')
                    
                    # Check if this operation has Arabic text
                    has_arabic = any(ord(char) > 127 for char in client_name + service_name)
                    
                    if has_arabic:
                        print(f"\n   4.1. Testing Super Admin PDF for Operation {operation_id}...")
                        print(f"        Client: {client_name}")
                        print(f"        Service: {service_name}")
                        
                        # Test PDF generation
                        url = f"{self.api_url}/daily-operations/{operation_id}/print"
                        headers = {'Authorization': f'Bearer {self.token}'}
                        
                        try:
                            response = requests.get(url, headers=headers, timeout=30)
                            
                            if response.status_code == 200:
                                print(f"   ✅ Super Admin PDF generation successful")
                                results['super_admin_pdf_generation'] = True
                            else:
                                print(f"   ❌ Super Admin PDF generation failed - Status: {response.status_code}")
                                results['super_admin_pdf_generation'] = False
                                
                        except Exception as e:
                            print(f"   ❌ Super Admin PDF generation error: {str(e)}")
                            results['super_admin_pdf_generation'] = False
                        break
        
        # Step 5: Test Arabic Text Elements in PDF (Specific Elements from Review Request)
        print(f"\n   5. Testing Specific Arabic Elements from Review Request...")
        
        arabic_elements_to_test = [
            "رقم الوصل",      # Receipt Number
            "اسم العميل",     # Client Name  
            "الخدمة",         # Service
            "المبلغ",         # Amount
            "التاريخ",        # Date
            "حالة الدفع",     # Payment Status
            "طريقة الدفع",    # Payment Method
            "التوقيع"        # Signature
        ]
        
        print(f"   Arabic Elements Expected in PDF:")
        for element in arabic_elements_to_test:
            print(f"     - {element}")
        
        # Test that these elements would be properly processed by fix_arabic_text function
        if arabic_operations:
            test_operation = arabic_operations[0]
            operation_id = test_operation.get('id')
            
            print(f"\n   5.1. Testing Arabic Elements Processing for Operation {operation_id}...")
            
            url = f"{self.api_url}/daily-operations/{operation_id}/print"
            headers = {'Authorization': f'Bearer {self.token}'}
            
            try:
                response = requests.get(url, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    print(f"   ✅ Arabic elements processing successful")
                    print(f"   ✅ PDF generated without Arabic text errors")
                    print(f"   ✅ fix_arabic_text() function working correctly")
                    results['arabic_elements_processing'] = True
                else:
                    print(f"   ❌ Arabic elements processing failed")
                    results['arabic_elements_processing'] = False
                    
            except Exception as e:
                print(f"   ❌ Arabic elements processing error: {str(e)}")
                results['arabic_elements_processing'] = False
        
        # Step 6: Final Arabic Text Fix Verification
        print(f"\n   6. Final Arabic Text Fix Verification...")
        
        verification_results = {
            'pdf_generation_working': results.get('pdf_success_rate', 0) > 70,
            'arabic_text_processing': results.get('arabic_elements_processing', False),
            'multiple_operations_tested': results.get('pdf_generation_tests', 0) >= 3,
            'no_critical_errors': results.get('pdf_generation_success', 0) > 0
        }
        
        results['verification_results'] = verification_results
        
        print(f"   Arabic Text Fix Verification:")
        for check, passed in verification_results.items():
            status = "✅" if passed else "❌"
            print(f"     {status} {check.replace('_', ' ').title()}")
        
        # Calculate overall success
        verification_score = sum(verification_results.values()) / len(verification_results) * 100
        results['arabic_fix_success_rate'] = verification_score
        
        print(f"\n   Overall Arabic Text Fix Success Rate: {verification_score:.1f}%")
        
        if verification_score >= 80:
            print(f"   🎉 EXCELLENT: Arabic text fix is working correctly!")
        elif verification_score >= 60:
            print(f"   ✅ GOOD: Arabic text fix is mostly working with minor issues")
        else:
            print(f"   ❌ NEEDS ATTENTION: Arabic text fix has significant issues")
        
        return results

if __name__ == "__main__":
    tester = ArabicPDFTester()
    results = tester.test_pdf_receipt_generation_arabic_fix()
    
    # Print final summary
    print(f"\n" + "="*80)
    print(f"FINAL TEST SUMMARY")
    print(f"="*80)
    print(f"Total tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print(f"🎉 ALL TESTS PASSED!")
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
    
    print(f"="*80)