#!/usr/bin/env python
"""
Test script for the validate-token endpoint
"""
import requests
import json

# Base URL for the API
BASE_URL = "http://127.0.0.1:8000"

def test_validate_token_endpoint():
    """Test the validate-token endpoint"""
    
    # Test 1: No token provided
    print("Test 1: No token provided")
    response = requests.post(f"{BASE_URL}/auth/validate-token/", json={})
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()
    
    # Test 2: Invalid token in request body
    print("Test 2: Invalid token in request body")
    response = requests.post(f"{BASE_URL}/auth/validate-token/", json={"token": "invalid_token"})
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()
    
    # Test 3: Invalid token in Authorization header
    print("Test 3: Invalid token in Authorization header")
    headers = {"Authorization": "Bearer invalid_token"}
    response = requests.post(f"{BASE_URL}/auth/validate-token/", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()
    
    # Test 4: Try to get a valid token first (if possible)
    print("Test 4: Attempting to get a valid token through sign-in")
    # Note: This would require valid credentials in your system
    # For now, we'll just show the structure
    
    print("All tests completed!")

if __name__ == "__main__":
    test_validate_token_endpoint()
