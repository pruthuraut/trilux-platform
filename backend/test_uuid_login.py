#!/usr/bin/env python3
"""
UUID Login API Test Script
Tests the new UUID-based login endpoint
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
API_URL = "https://api.trilux.dev"
UUID_LOGIN_ENDPOINT = f"{API_URL}/auth/uuid-login/"
VALIDATE_TOKEN_ENDPOINT = f"{API_URL}/auth/validate-token/"
VERIFY_SSL = False

class UUIDLoginTester:
    def __init__(self, verify_ssl=False):
        self.verify_ssl = verify_ssl
        self.access_token = None
        self.refresh_token = None
        self.user_info = None
    
    def test_login(self, uuid_value, user_id=1):
        """Test UUID login"""
        print(f"\n{'='*60}")
        print(f"Testing UUID Login")
        print(f"{'='*60}")
        print(f"UUID: {uuid_value}")
        print(f"User ID: {user_id}")
        print(f"Endpoint: {UUID_LOGIN_ENDPOINT}")
        
        payload = {
            "uuid": uuid_value,
            "user_id": user_id
        }
        
        try:
            response = requests.post(
                UUID_LOGIN_ENDPOINT,
                json=payload,
                verify=self.verify_ssl,
                timeout=10
            )
            
            print(f"\nStatus Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access')
                self.refresh_token = data.get('refresh')
                self.user_info = {
                    'user': data.get('user'),
                    'user_id': data.get('user_id'),
                    'expires_in': data.get('expires_in')
                }
                
                print("\n✅ LOGIN SUCCESSFUL")
                print(f"User: {data.get('user')}")
                print(f"User ID: {data.get('user_id')}")
                print(f"Message: {data.get('message')}")
                print(f"Token Type: {data.get('token_type')}")
                print(f"Expires In: {data.get('expires_in')}")
                print(f"\nAccess Token: {self.access_token[:50]}...")
                print(f"Refresh Token: {self.refresh_token[:50]}...")
                
                return True
            else:
                error_data = response.json()
                print(f"\n❌ LOGIN FAILED")
                print(f"Error: {json.dumps(error_data, indent=2)}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"\n❌ REQUEST FAILED")
            print(f"Error: {str(e)}")
            return False
    
    def test_token_validation(self):
        """Test token validation"""
        if not self.access_token:
            print("\n⚠️  No access token available. Please login first.")
            return False
        
        print(f"\n{'='*60}")
        print(f"Testing Token Validation")
        print(f"{'='*60}")
        print(f"Endpoint: {VALIDATE_TOKEN_ENDPOINT}")
        
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "token": self.access_token
        }
        
        try:
            response = requests.post(
                VALIDATE_TOKEN_ENDPOINT,
                json=payload,
                headers=headers,
                verify=self.verify_ssl,
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"\n✅ TOKEN VALIDATION SUCCESSFUL")
                print(f"Valid: {data.get('valid')}")
                print(f"Message: {data.get('message')}")
                return True
            else:
                error_data = response.json()
                print(f"\n❌ TOKEN VALIDATION FAILED")
                print(f"Error: {json.dumps(error_data, indent=2)}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"\n❌ REQUEST FAILED")
            print(f"Error: {str(e)}")
            return False
    
    def test_invalid_user_id(self, uuid_value, invalid_user_id=999):
        """Test with invalid user ID"""
        print(f"\n{'='*60}")
        print(f"Testing with Invalid User ID")
        print(f"{'='*60}")
        print(f"UUID: {uuid_value}")
        print(f"User ID: {invalid_user_id}")
        
        payload = {
            "uuid": uuid_value,
            "user_id": invalid_user_id
        }
        
        try:
            response = requests.post(
                UUID_LOGIN_ENDPOINT,
                json=payload,
                verify=self.verify_ssl,
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 404:
                print(f"\n✅ CORRECTLY REJECTED INVALID USER")
                error_data = response.json()
                print(f"Message: {error_data.get('message')}")
                return True
            else:
                print(f"\n⚠️  Unexpected response")
                print(f"Response: {response.json()}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"\n❌ REQUEST FAILED")
            print(f"Error: {str(e)}")
            return False
    
    def test_missing_uuid(self, user_id=1):
        """Test with missing UUID"""
        print(f"\n{'='*60}")
        print(f"Testing with Missing UUID")
        print(f"{'='*60}")
        print(f"User ID: {user_id}")
        
        payload = {
            "user_id": user_id
        }
        
        try:
            response = requests.post(
                UUID_LOGIN_ENDPOINT,
                json=payload,
                verify=self.verify_ssl,
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 400:
                print(f"\n✅ CORRECTLY REJECTED MISSING UUID")
                error_data = response.json()
                print(f"Message: {error_data.get('message')}")
                print(f"Errors: {json.dumps(error_data.get('error', {}), indent=2)}")
                return True
            else:
                print(f"\n⚠️  Unexpected response")
                print(f"Response: {response.json()}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"\n❌ REQUEST FAILED")
            print(f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests"""
        print(f"\n{'='*80}")
        print(f"UUID LOGIN API TEST SUITE")
        print(f"{'='*80}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print(f"API Base URL: {API_URL}")
        
        results = {}
        
        # Test 1: Valid login
        print("\n[TEST 1] Valid UUID Login")
        results['valid_login'] = self.test_login("test-uuid-12345", user_id=1)
        
        # Test 2: Token validation
        if results['valid_login']:
            print("\n[TEST 2] Token Validation")
            results['token_validation'] = self.test_token_validation()
        
        # Test 3: Invalid user ID
        print("\n[TEST 3] Invalid User ID")
        results['invalid_user_id'] = self.test_invalid_user_id("test-uuid", invalid_user_id=999)
        
        # Test 4: Missing UUID
        print("\n[TEST 4] Missing UUID")
        results['missing_uuid'] = self.test_missing_uuid(user_id=1)
        
        # Summary
        print(f"\n{'='*80}")
        print(f"TEST SUMMARY")
        print(f"{'='*80}")
        for test_name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name}: {status}")
        
        total_passed = sum(1 for r in results.values() if r)
        total_tests = len(results)
        print(f"\nTotal: {total_passed}/{total_tests} tests passed")
        
        if total_passed == total_tests:
            print("\n🎉 ALL TESTS PASSED!")
            return True
        else:
            print(f"\n⚠️  {total_tests - total_passed} test(s) failed")
            return False


def main():
    """Main function"""
    tester = UUIDLoginTester(verify_ssl=VERIFY_SSL)
    
    if len(sys.argv) > 1:
        # Custom UUID provided
        uuid_value = sys.argv[1]
        user_id = int(sys.argv[2]) if len(sys.argv) > 2 else 1
        
        print(f"\nTesting with provided parameters:")
        print(f"UUID: {uuid_value}")
        print(f"User ID: {user_id}")
        
        success = tester.test_login(uuid_value, user_id)
        if success:
            tester.test_token_validation()
    else:
        # Run full test suite
        tester.run_all_tests()


if __name__ == "__main__":
    main()
