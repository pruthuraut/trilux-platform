# UUID Login API Documentation

## Overview
The UUID Login API provides a secure way to authenticate users using a UUID and user ID, generating a lifetime-valid access token that never expires.

## Endpoint

### POST `/auth/uuid-login/`

Authenticates a user using a UUID and returns a lifetime-valid JWT access token.

## Request

### URL
```
POST https://api.trilux.dev/auth/uuid-login/
```

### Headers
```
Content-Type: application/json
```

### Request Body

```json
{
  "uuid": "string (required)",
  "user_id": "integer (optional, defaults to 1)"
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| uuid | string | Yes | A UUID string for authentication (any non-empty string) |
| user_id | integer | No | The ID of the user to authenticate (defaults to 1) |

### Example Request

```bash
curl -X POST https://api.trilux.dev/auth/uuid-login/ \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": 1
  }' \
  -k
```

## Response

### Success Response (200 OK)

```json
{
  "user": "user@example.com",
  "user_id": 1,
  "message": "Login Success",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": "Lifetime"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| user | string | Email address of the authenticated user |
| user_id | integer | ID of the authenticated user |
| message | string | Status message ("Login Success") |
| access | string | Lifetime-valid JWT access token for API requests |
| refresh | string | 30-day refresh token for getting new access tokens |
| token_type | string | Bearer token type |
| expires_in | string | Token expiration ("Lifetime" - effectively 68 years) |

### Error Responses

#### 400 Bad Request - Invalid Input

```json
{
  "message": "Invalid Input",
  "error": {
    "uuid": ["This field may not be blank."],
    "user_id": ["A valid integer is required."]
  }
}
```

#### 400 Bad Request - Invalid UUID

```json
{
  "message": "Invalid UUID provided"
}
```

#### 404 Not Found - User Not Found

```json
{
  "message": "User with id 999 not found"
}
```

#### 500 Internal Server Error

```json
{
  "message": "Something went wrong",
  "error": "Error details"
}
```

## Usage

### 1. Obtain Access Token

```bash
curl -X POST https://api.trilux.dev/auth/uuid-login/ \
  -H "Content-Type: application/json" \
  -d '{"uuid": "my-uuid-12345", "user_id": 1}'
```

Response:
```json
{
  "user": "sanketugale2003@gmail.com",
  "user_id": 1,
  "message": "Login Success",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjozOTE1MTA3NTQ0LCJpYXQiOjE3NzA2NTk1NDQsImp0aSI6ImY3Y2ZkZmNmYmU5NjQ3ZDI5YzRlODkyYTY3MWJiNzk2IiwidXNlcl9pZCI6MSwiZW1haWwiOiJzYW5rZXR1Z2FsZTIwMDNAZ21haWwuY29tIn0.wrUPL4nze33HpZU4SeLz8A8xIMpRa8cMsRFPTKxORCI",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzI1MTU0NCwiaWF0IjoxNzcwNjU5NTQ0LCJqdGkiOiJkYTg0YjI2MWExNzc0YzVlYWZkZWMzZjc3NmY2OGRiYyIsInVzZXJfaWQiOjF9.o-2Xp1yXkc6w0mNR1WdWY4DwyRTLARtFbnJk6qaSs",
  "token_type": "Bearer",
  "expires_in": "Lifetime"
}
```

### 2. Use Token to Access Protected Endpoints

Include the access token in the `Authorization` header:

```bash
curl -X GET https://api.trilux.dev/api/project/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjozOTE1MTA3NTQ0LCJpYXQiOjE3NzA2NTk1NDQsImp0aSI6ImY3Y2ZkZmNmYmU5NjQ3ZDI5YzRlODkyYTY3MWJiNzk2IiwidXNlcl9pZCI6MSwiZW1haWwiOiJzYW5rZXR1Z2FsZTIwMDNAZ21haWwuY29tIn0.wrUPL4nze33HpZU4SeLz8A8xIMpRa8cMsRFPTKxORCI" \
  -k
```

### 3. Validate Token

Verify that your token is still valid:

```bash
curl -X POST https://api.trilux.dev/auth/validate-token/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{"token": "<YOUR_TOKEN>"}'
```

Response:
```json
{
  "valid": true,
  "message": "Token is valid"
}
```

## Token Characteristics

### Access Token
- **Type**: JWT (JSON Web Token)
- **Lifetime**: 68 years (effectively never expires)
- **Algorithm**: HS256
- **Contains**: 
  - `user_id`: User's ID
  - `email`: User's email
  - `exp`: Expiration timestamp (very far in the future)
  - `iat`: Issued at timestamp
  - `jti`: Unique token ID

### Refresh Token
- **Type**: JWT
- **Lifetime**: 30 days
- **Used to**: Obtain new access tokens when the current one expires

## Python Example

```python
import requests
import json

# Step 1: Login with UUID
login_url = "https://api.trilux.dev/auth/uuid-login/"
payload = {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": 1
}

response = requests.post(login_url, json=payload, verify=False)
data = response.json()

access_token = data['access']
print(f"Access Token: {access_token}")

# Step 2: Use token to access protected endpoints
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

api_url = "https://api.trilux.dev/api/project/"
response = requests.get(api_url, headers=headers, verify=False)
print(response.json())
```

## JavaScript/Fetch Example

```javascript
// Step 1: Login with UUID
const loginUrl = "https://api.trilux.dev/auth/uuid-login/";
const payload = {
  uuid: "550e8400-e29b-41d4-a716-446655440000",
  user_id: 1
};

const response = await fetch(loginUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const data = await response.json();
const accessToken = data.access;

console.log("Access Token:", accessToken);

// Step 2: Use token to access protected endpoints
const headers = {
  "Authorization": `Bearer ${accessToken}`,
  "Content-Type": "application/json"
};

const apiUrl = "https://api.trilux.dev/api/project/";
const apiResponse = await fetch(apiUrl, {
  method: "GET",
  headers: headers,
});

const apiData = await apiResponse.json();
console.log(apiData);
```

## Security Considerations

1. **UUID Generation**: The UUID passed should be generated securely on the client side
2. **HTTPS Only**: Always use HTTPS when making requests to this endpoint
3. **Token Storage**: Store the access token securely (httpOnly cookies for web apps)
4. **Token Rotation**: Even though the access token has a lifetime validity, rotate refresh tokens regularly
5. **User ID Validation**: Only authenticated systems should know valid user IDs

## Error Handling

```python
import requests

def login_with_uuid(uuid, user_id=1):
    url = "https://api.trilux.dev/auth/uuid-login/"
    
    try:
        response = requests.post(
            url,
            json={"uuid": uuid, "user_id": user_id},
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            print("User not found")
        elif response.status_code == 400:
            print("Invalid input:", response.json()['error'])
        else:
            print(f"Error: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")

# Usage
result = login_with_uuid("my-uuid-12345", user_id=1)
if result:
    print(f"Logged in as: {result['user']}")
    print(f"Access Token: {result['access']}")
```

## Testing the Endpoint

### Using cURL

```bash
# Test successful login
curl -X POST https://api.trilux.dev/auth/uuid-login/ \
  -H "Content-Type: application/json" \
  -d '{"uuid": "test-uuid", "user_id": 1}' \
  -k

# Test with invalid user_id
curl -X POST https://api.trilux.dev/auth/uuid-login/ \
  -H "Content-Type: application/json" \
  -d '{"uuid": "test-uuid", "user_id": 999}' \
  -k

# Test with missing UUID
curl -X POST https://api.trilux.dev/auth/uuid-login/ \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1}' \
  -k
```

### Using Postman

1. Create a new POST request
2. URL: `https://api.trilux.dev/auth/uuid-login/`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "uuid": "550e8400-e29b-41d4-a716-446655440000",
     "user_id": 1
   }
   ```
5. Disable SSL verification (for testing)
6. Click Send

## Rate Limiting

This endpoint is not rate-limited by default. Consider implementing rate limiting if needed:

```python
from django_ratelimit.decorators import ratelimit

@ratelimit(key='user_or_ip', rate='5/m', method='ALL', block=True)
def uuid_login(request):
    # Implementation
    pass
```

## Version History

- **v1.0** (Feb 9, 2026): Initial release
  - UUID-based authentication
  - Lifetime-valid access tokens
  - User ID support
  - Refresh token generation
